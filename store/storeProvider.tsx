"use client";

import { useEffect, useRef } from "react";
import type { Remote } from "comlink";
import { wrap } from "comlink";
import type { TournamentState, Fixture, OverrideMap, MatchResult } from "@/types/tournament";
import { useTournamentStore } from "./tournamentStore";
import { forecastAll } from "@/engine/forecast";
import type { SimWorkerApi } from "@/workers/simulation.worker";
import type { SimWorkerInput } from "@/types/simulation";

interface Props {
  initialState: TournamentState;
  children: React.ReactNode;
}

const RESULT_BYTE: Record<MatchResult, number> = {
  HOME_WIN: 0,
  DRAW: 1,
  AWAY_WIN: 2,
};

// Wait this long after the last pick before re-simulating, so rapid clicks
// or typing a scoreline coalesce into a single worker run.
const RESIM_DEBOUNCE_MS = 300;

// Build the full simulation input from the tournament state and the set of
// committed picks. Picks are encoded as lockedOutcomes so every simulated
// universe satisfies them by construction — this keeps the effective sample
// size at the full simCount no matter how many results are stacked, instead
// of the geometric decay you get from filtering an unconditioned universe.
function buildSimInput(
  state: TournamentState,
  overrides: OverrideMap
): SimWorkerInput | null {
  const remainingFixtures = Object.values(state.fixtures).filter(
    (f: Fixture) => f.status !== "FINISHED"
  );
  if (remainingFixtures.length === 0) return null;

  const fixtureOrder = remainingFixtures.map((f) => f.id);
  const homeTeamIds = remainingFixtures.map((f) => f.homeTeamId);
  const awayTeamIds = remainingFixtures.map((f) => f.awayTeamId);
  const teamOrder = Object.values(state.teams).map((t) => t.id);

  const teamElos: Record<number, number> = {};
  for (const team of Object.values(state.teams)) teamElos[team.id] = team.eloRating;
  const forecasts = forecastAll(state.fixtures, teamElos);

  const lambdaHome = new Float32Array(fixtureOrder.length);
  const lambdaAway = new Float32Array(fixtureOrder.length);
  const lockedOutcomes = new Uint8Array(fixtureOrder.length).fill(255);
  for (let i = 0; i < fixtureOrder.length; i++) {
    const fc = forecasts[fixtureOrder[i]];
    lambdaHome[i] = fc?.lambdaHome ?? 1.3;
    lambdaAway[i] = fc?.lambdaAway ?? 1.3;
    const ov = overrides[String(fixtureOrder[i])];
    if (ov) lockedOutcomes[i] = RESULT_BYTE[ov];
  }

  const groupTeamIds: Record<string, number[]> = {};
  const groupFixtureIds: Record<string, number[]> = {};
  for (const [gid, group] of Object.entries(state.groups)) {
    groupTeamIds[gid] = group.teamIds;
    groupFixtureIds[gid] = group.fixtureIds.filter((id) => fixtureOrder.includes(id));
  }

  // Pre-compute standings from already-finished fixtures so the simulation
  // starts from the correct points/GD/GF baseline rather than zero.
  const groupOrder = Object.keys(groupTeamIds);
  const maxSlots = 4;
  const startingPts = new Int32Array(groupOrder.length * maxSlots);
  const startingGd = new Int32Array(groupOrder.length * maxSlots);
  const startingGf = new Int32Array(groupOrder.length * maxSlots);
  // finishedH2H: [gi * 32 + homeSlot * 8 + awaySlot * 2 + (0=hg|1=ag)], -1 = not played
  const finishedH2H = new Int32Array(groupOrder.length * maxSlots * maxSlots * 2).fill(-1);

  for (let gi = 0; gi < groupOrder.length; gi++) {
    const gid = groupOrder[gi];
    const group = state.groups[gid];
    const teamIds = groupTeamIds[gid];
    const slot: Record<number, number> = {};
    teamIds.forEach((tid, i) => { slot[tid] = i; });

    for (const fid of group.fixtureIds) {
      const f = state.fixtures[fid];
      if (!f || f.status !== "FINISHED" || !f.result) continue;
      const hSlot = slot[f.homeTeamId];
      const aSlot = slot[f.awayTeamId];
      if (hSlot === undefined || aSlot === undefined) continue;
      const hBase = gi * maxSlots + hSlot;
      const aBase = gi * maxSlots + aSlot;
      if (f.result === "HOME_WIN") {
        startingPts[hBase] += state.config.groupConfig.pointsForWin;
      } else if (f.result === "AWAY_WIN") {
        startingPts[aBase] += state.config.groupConfig.pointsForWin;
      } else {
        startingPts[hBase] += state.config.groupConfig.pointsForDraw;
        startingPts[aBase] += state.config.groupConfig.pointsForDraw;
      }
      if (f.score) {
        startingGf[hBase] += f.score.homeGoals;
        startingGd[hBase] += f.score.homeGoals - f.score.awayGoals;
        startingGf[aBase] += f.score.awayGoals;
        startingGd[aBase] += f.score.awayGoals - f.score.homeGoals;
        const h2hIdx = gi * 32 + hSlot * 8 + aSlot * 2;
        finishedH2H[h2hIdx] = f.score.homeGoals;
        finishedH2H[h2hIdx + 1] = f.score.awayGoals;
      }
    }
  }

  return {
    fixtureOrder,
    teamOrder,
    groupTeamIds,
    groupFixtureIds,
    lambdaHome,
    lambdaAway,
    lockedOutcomes,
    startingPts,
    startingGd,
    startingGf,
    finishedH2H,
    pointsForWin: state.config.groupConfig.pointsForWin,
    pointsForDraw: state.config.groupConfig.pointsForDraw,
    tiebreakers: state.config.groupConfig.tiebreakers,
    directQualifiers: state.config.groupConfig.directQualifiers,
    thirdPlaceAdvanceCount: state.config.groupConfig.thirdPlaceRule?.advanceCount ?? 0,
    thirdPlaceSelectionCriteria:
      state.config.groupConfig.thirdPlaceRule?.selectionCriteria ??
      ["POINTS", "GOAL_DIFFERENCE", "GOALS_FOR"],
    simCount: 50_000,
    homeTeamIds,
    awayTeamIds,
  };
}

export function StoreProvider({ initialState, children }: Props) {
  const hydrate = useTournamentStore((s) => s.hydrate);
  const setForecasts = useTournamentStore((s) => s.setForecasts);
  const setUniverse = useTournamentStore((s) => s.setUniverse);
  const setSimulating = useTournamentStore((s) => s.setSimulating);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Seed store
    hydrate(initialState);

    // 2. Compute Elo forecasts for the W/D/L button labels
    const teamElos: Record<number, number> = {};
    for (const team of Object.values(initialState.teams)) {
      teamElos[team.id] = team.eloRating;
    }
    setForecasts(forecastAll(initialState.fixtures, teamElos));

    // 3. Spawn one persistent worker reused for every re-simulation
    const raw = new Worker(new URL("../workers/simulation.worker.ts", import.meta.url));
    const worker: Remote<SimWorkerApi> = wrap<SimWorkerApi>(raw);

    // generation guard: only the most recent request's result is applied
    let generation = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const runSim = (overrides: OverrideMap) => {
      const state = useTournamentStore.getState().state;
      if (!state) return;
      const input = buildSimInput(state, overrides);
      if (!input) return;
      const gen = ++generation;
      setSimulating(true);
      worker.runSimulations(input as SimWorkerInput).then((universe) => {
        if (gen !== generation) return; // a newer pick superseded this run
        setUniverse(universe);
      });
    };

    // 4. Initial run with no picks locked
    runSim({});

    // 5. Re-simulate (debounced) whenever the committed picks change, so the
    //    baseline stays at full precision regardless of how many are stacked.
    const unsubscribe = useTournamentStore.subscribe((s, prev) => {
      const next = s.state?.overrides;
      const previous = prev.state?.overrides;
      if (next === previous) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => runSim(next ?? {}), RESIM_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
      raw.terminate();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
