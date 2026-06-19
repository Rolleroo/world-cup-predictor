"use client";

import { useMemo } from "react";
import { useTournamentStore } from "@/store/tournamentStore";
import { computeAllDeltasForTeam } from "@/engine/delta";
import type { MatchResult } from "@/types/tournament";

export type FixtureDeltas = Record<MatchResult, number>;

export function useDeltas(
  teamId: number,
  fixtureIds: number[]
): Record<number, FixtureDeltas> {
  const universe     = useTournamentStore((s) => s.universe);
  const overrides    = useTournamentStore((s) => s.state?.overrides);
  const probabilities = useTournamentStore((s) => s.probabilities);

  return useMemo(() => {
    if (!universe || !overrides) return {};
    const currentPct = probabilities[teamId] ?? 0;
    return computeAllDeltasForTeam(universe, overrides, teamId, fixtureIds, currentPct);
  }, [universe, overrides, probabilities, teamId, fixtureIds]);
}
