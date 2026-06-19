"use client";

import { useState } from "react";
import type { TournamentState } from "@/types/tournament";
import { StoreProvider } from "@/store/storeProvider";
import { GroupStandingsGrid } from "./GroupStandingsGrid";
import { TeamPredictor } from "./TeamPredictor";

function Inner() {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-neutral-300 tracking-tight">
            2026 World Cup Predictor
          </h1>
          <p className="text-xs text-neutral-600 hidden sm:block">
            Click a team to explore their path to the Round of 32
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <GroupStandingsGrid
          selectedTeamId={selectedTeamId}
          onSelect={setSelectedTeamId}
        />

        {selectedTeamId !== null && (
          <TeamPredictor teamId={selectedTeamId} />
        )}
      </main>
    </div>
  );
}

interface Props {
  initialState: TournamentState;
}

export function TournamentShell({ initialState }: Props) {
  return (
    <StoreProvider initialState={initialState}>
      <Inner />
    </StoreProvider>
  );
}
