"use client";

import { create } from "zustand";
import type { TournamentState, MatchResult, OverrideMap, ScoreOverrideMap } from "@/types/tournament";
import type { SimulationUniverse, QualificationProbabilities } from "@/types/simulation";
import type { MatchForecast } from "@/types/forecast";
import { computeStandings } from "@/engine/standings";
import { filterUniverse, computeProbabilities } from "@/engine/delta";

interface TournamentStore {
  state: TournamentState | null;
  universe: SimulationUniverse | null;
  probabilities: QualificationProbabilities;
  simulating: boolean;

  hydrate: (initial: TournamentState) => void;
  setForecasts: (forecasts: Record<number, MatchForecast>) => void;
  setUniverse: (universe: SimulationUniverse) => void;
  setOverride: (fixtureId: number, result: MatchResult, goals?: { homeGoals: number; awayGoals: number }) => void;
  clearOverride: (fixtureId: number) => void;
  clearAllOverrides: () => void;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  state: null,
  universe: null,
  probabilities: {},
  simulating: false,

  hydrate(initial) {
    set({ state: { ...initial, overrides: {}, scoreOverrides: {} } });
  },

  setForecasts(forecasts) {
    set((s) => {
      if (!s.state) return s;
      return { state: { ...s.state, forecasts } };
    });
  },

  setUniverse(universe) {
    const { state } = get();
    if (!state) {
      set({ universe, simulating: false });
      return;
    }
    const filtered = filterUniverse(universe, state.overrides);
    const probabilities = computeProbabilities(universe, filtered);
    set({ universe, probabilities, simulating: false });
  },

  setOverride(fixtureId, result, goals) {
    set((s) => {
      if (!s.state) return s;
      const overrides: OverrideMap = { ...s.state.overrides, [String(fixtureId)]: result };
      const scoreOverrides: ScoreOverrideMap = { ...s.state.scoreOverrides };
      if (goals) {
        scoreOverrides[String(fixtureId)] = goals;
      } else {
        delete scoreOverrides[String(fixtureId)];
      }
      const standings = computeStandings(
        s.state.fixtures,
        s.state.groups,
        overrides,
        s.state.config,
        scoreOverrides
      );
      const newState = { ...s.state, overrides, scoreOverrides, standings };
      let probabilities = s.probabilities;
      if (s.universe) {
        const filtered = filterUniverse(s.universe, overrides);
        probabilities = computeProbabilities(s.universe, filtered);
      }
      return { state: newState, probabilities };
    });
  },

  clearOverride(fixtureId) {
    set((s) => {
      if (!s.state) return s;
      const overrides = { ...s.state.overrides };
      const scoreOverrides = { ...s.state.scoreOverrides };
      delete overrides[String(fixtureId)];
      delete scoreOverrides[String(fixtureId)];
      const standings = computeStandings(
        s.state.fixtures,
        s.state.groups,
        overrides,
        s.state.config,
        scoreOverrides
      );
      const newState = { ...s.state, overrides, scoreOverrides, standings };
      let probabilities = s.probabilities;
      if (s.universe) {
        const filtered = filterUniverse(s.universe, overrides);
        probabilities = computeProbabilities(s.universe, filtered);
      }
      return { state: newState, probabilities };
    });
  },

  clearAllOverrides() {
    set((s) => {
      if (!s.state) return s;
      const standings = computeStandings(
        s.state.fixtures,
        s.state.groups,
        {},
        s.state.config,
        {}
      );
      const newState = { ...s.state, overrides: {}, scoreOverrides: {}, standings };
      let probabilities = s.probabilities;
      if (s.universe) {
        const filtered = filterUniverse(s.universe, {});
        probabilities = computeProbabilities(s.universe, filtered);
      }
      return { state: newState, probabilities };
    });
  },
}));
