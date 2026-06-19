"use client";

import { useMemo } from "react";
import { useTournamentStore } from "@/store/tournamentStore";
import { useDeltas } from "@/hooks/useDeltas";
import { FixturePredictor } from "./FixturePredictor";
import type { Fixture } from "@/types/tournament";

interface Props {
  teamId: number;
}

export function TeamPredictor({ teamId }: Props) {
  const team          = useTournamentStore((s) => s.state?.teams[teamId]);
  const fixtures      = useTournamentStore((s) => s.state?.fixtures);
  const probabilities = useTournamentStore((s) => s.probabilities);
  const universe      = useTournamentStore((s) => s.universe);
  const overrideCount = useTournamentStore((s) =>
    s.state ? Object.keys(s.state.overrides).length : 0
  );
  const clearAllOverrides = useTournamentStore((s) => s.clearAllOverrides);

  const remainingFixtures = useMemo<Fixture[]>(() => {
    if (!fixtures) return [];
    return Object.values(fixtures)
      .filter((f) => f.status !== "FINISHED")
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate) || a.id - b.id);
  }, [fixtures]);

  const remainingFixtureIds = useMemo(
    () => remainingFixtures.map((f) => f.id),
    [remainingFixtures]
  );

  const deltas     = useDeltas(teamId, remainingFixtureIds);
  const qualifyPct    = probabilities[teamId] ?? 0;
  const hasRemaining  = remainingFixtures.length > 0;
  const pct           = Math.round(qualifyPct * 100);
  const pctLabel      = qualifyPct === 1 ? "100%"
                      : qualifyPct === 0 ? "0%"
                      : hasRemaining && pct >= 99 ? ">99%"
                      : hasRemaining && pct === 0 ? "<1%"
                      : `${pct}%`;

  let pctColor = "text-red-400";
  if (pct >= 70) pctColor = "text-emerald-400";
  else if (pct >= 40) pctColor = "text-yellow-400";
  else if (pct >= 15) pctColor = "text-orange-400";

  if (!team) return null;

  return (
    <div className="border-t border-neutral-800 pt-8">
      {/* Sticky team header + probability */}
      <div className="sticky top-[44px] z-20 bg-neutral-950/95 backdrop-blur border-b border-neutral-800/60 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-600 uppercase tracking-wider leading-none mb-0.5">Qualifying chances for</p>
            <h2 className="text-xl font-black text-white leading-tight">{team.name}</h2>
            <p className="text-neutral-500 text-xs">Group {team.groupId}</p>
          </div>
          <div className="text-right">
            {!universe ? (
              <p className="text-neutral-500 text-sm animate-pulse">Simulating…</p>
            ) : (
              <>
                <div className={`text-5xl font-black tracking-tight leading-none ${pctColor}`}>
                  {pctLabel}
                </div>
                <p className="text-neutral-600 text-xs mt-0.5">chance of advancing</p>
              </>
            )}
          </div>
        </div>
        {/* Progress bar inside sticky header */}
        {universe && (
          <div className="h-1 rounded-full bg-neutral-800 mt-2">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-500" : pct >= 15 ? "bg-orange-500" : "bg-red-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-neutral-600">
          {remainingFixtures.length} games left · top 2 per group + best 8 third-placed advance
        </p>
        {overrideCount > 0 && (
          <button
            onClick={clearAllOverrides}
            className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
          >
            Clear all {overrideCount} pick{overrideCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Fixture list — chronological, all groups */}
      <div className="space-y-1.5">
        {remainingFixtures.map((fixture) => (
          <FixturePredictor
            key={fixture.id}
            fixture={fixture}
            focusTeamId={teamId}
            currentPct={qualifyPct}
            deltas={deltas[fixture.id] ?? {}}
          />
        ))}
      </div>
    </div>
  );
}
