"use client";

import { useEffect, useRef } from "react";
import type { Remote } from "comlink";
import { wrap } from "comlink";
import type { TournamentState, Fixture } from "@/types/tournament";
import { useTournamentStore } from "./tournamentStore";
import { forecastAll } from "@/engine/forecast";
import type { SimWorkerApi } from "@/workers/simulation.worker";
import type { SimWorkerInput } from "@/types/simulation";

interface Props {
  initialState: TournamentState;
  children: React.ReactNode;
}

export function StoreProvider({ initialState, children }: Props) {
  const hydrate = useTournamentStore((s) => s.hydrate);
  const setForecasts = useTournamentStore((s) => s.setForecasts);
  const setUniverse = useTournamentStore((s) => s.setUniverse);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // 1. Seed store
    hydrate(initialState);

    // 2. Compute Elo forecasts for all unresolved fixtures
    const teamElos: Record<number, number> = {};
    for (const team of Object.values(initialState.teams)) {
      teamElos[team.id] = team.eloRating;
    }
    const forecasts = forecastAll(initialState.fixtures, teamElos);
    setForecasts(forecasts);

    // 3. Build simulation input
    const remainingFixtures = Object.values(initialState.fixtures).filter(
      (f: Fixture) => f.status !== "FINISHED"
    );
    if (remainingFixtures.length === 0) return;

    const fixtureOrder = remainingFixtures.map((f) => f.id);
    const homeTeamIds = remainingFixtures.map((f) => f.homeTeamId);
    const awayTeamIds = remainingFixtures.map((f) => f.awayTeamId);
    const teamOrder = Object.values(initialState.teams).map((t) => t.id);

    const forecastProbs = new Float32Array(fixtureOrder.length * 2);
    const lambdaHome    = new Float32Array(fixtureOrder.length);
    const lambdaAway    = new Float32Array(fixtureOrder.length);
    for (let i = 0; i < fixtureOrder.length; i++) {
      const fc = forecasts[fixtureOrder[i]];
      forecastProbs[i * 2]     = fc?.homeWinProb ?? 0.35;
      forecastProbs[i * 2 + 1] = fc?.drawProb    ?? 0.28;
      lambdaHome[i]            = fc?.lambdaHome   ?? 1.3;
      lambdaAway[i]            = fc?.lambdaAway   ?? 1.3;
    }

    const lockedOutcomes = new Uint8Array(fixtureOrder.length).fill(255);

    const groupTeamIds: Record<string, number[]> = {};
    const groupFixtureIds: Record<string, number[]> = {};
    for (const [gid, group] of Object.entries(initialState.groups)) {
      groupTeamIds[gid] = group.teamIds;
      groupFixtureIds[gid] = group.fixtureIds.filter((id) =>
        fixtureOrder.includes(id)
      );
    }

    // Pre-compute standings from already-finished fixtures so the simulation
    // starts from the correct points/GD/GF baseline rather than zero
    const groupOrder = Object.keys(groupTeamIds);
    const maxSlots = 4;
    const startingPts = new Int32Array(groupOrder.length * maxSlots);
    const startingGd  = new Int32Array(groupOrder.length * maxSlots);
    const startingGf  = new Int32Array(groupOrder.length * maxSlots);
    // finishedH2H: [gi * 32 + homeSlot * 8 + awaySlot * 2 + (0=hg|1=ag)], -1 = not played
    const finishedH2H = new Int32Array(groupOrder.length * maxSlots * maxSlots * 2).fill(-1);

    for (let gi = 0; gi < groupOrder.length; gi++) {
      const gid     = groupOrder[gi];
      const group   = initialState.groups[gid];
      const teamIds = groupTeamIds[gid];
      const slot: Record<number, number> = {};
      teamIds.forEach((tid, i) => { slot[tid] = i; });

      for (const fid of group.fixtureIds) {
        const f = initialState.fixtures[fid];
        if (!f || f.status !== "FINISHED" || !f.result) continue;
        const hSlot = slot[f.homeTeamId];
        const aSlot = slot[f.awayTeamId];
        if (hSlot === undefined || aSlot === undefined) continue;
        const hBase = gi * maxSlots + hSlot;
        const aBase = gi * maxSlots + aSlot;
        if (f.result === "HOME_WIN") {
          startingPts[hBase] += initialState.config.groupConfig.pointsForWin;
        } else if (f.result === "AWAY_WIN") {
          startingPts[aBase] += initialState.config.groupConfig.pointsForWin;
        } else {
          startingPts[hBase] += initialState.config.groupConfig.pointsForDraw;
          startingPts[aBase] += initialState.config.groupConfig.pointsForDraw;
        }
        if (f.score) {
          startingGf[hBase] += f.score.homeGoals;
          startingGd[hBase] += f.score.homeGoals - f.score.awayGoals;
          startingGf[aBase] += f.score.awayGoals;
          startingGd[aBase] += f.score.awayGoals - f.score.homeGoals;
          // Store H2H score for use in tiebreaker
          const h2hIdx = gi * 32 + hSlot * 8 + aSlot * 2;
          finishedH2H[h2hIdx]     = f.score.homeGoals;
          finishedH2H[h2hIdx + 1] = f.score.awayGoals;
        }
      }
    }

    const input: SimWorkerInput = {
      fixtureOrder,
      teamOrder,
      groupTeamIds,
      groupFixtureIds,
      forecastProbs,
      lambdaHome,
      lambdaAway,
      lockedOutcomes,
      startingPts,
      startingGd,
      startingGf,
      finishedH2H,
      pointsForWin: initialState.config.groupConfig.pointsForWin,
      pointsForDraw: initialState.config.groupConfig.pointsForDraw,
      tiebreakers: initialState.config.groupConfig.tiebreakers,
      directQualifiers: initialState.config.groupConfig.directQualifiers,
      thirdPlaceAdvanceCount: initialState.config.groupConfig.thirdPlaceRule?.advanceCount ?? 0,
      thirdPlaceSelectionCriteria: initialState.config.groupConfig.thirdPlaceRule?.selectionCriteria ?? ["POINTS", "GOAL_DIFFERENCE", "GOALS_FOR"],
      simCount: 50_000,
      homeTeamIds,
      awayTeamIds,
    };

    // 4. Spawn Web Worker
    const raw = new Worker(
      new URL("../workers/simulation.worker.ts", import.meta.url)
    );
    const worker = wrap<SimWorkerApi>(raw);

    worker.runSimulations(input as SimWorkerInput).then((universe) => {
      setUniverse(universe);
      raw.terminate();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
