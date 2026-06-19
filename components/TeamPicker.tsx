"use client";

import { useTournamentStore } from "@/store/tournamentStore";

interface Props {
  onSelect: (teamId: number) => void;
}

export function TeamPicker({ onSelect }: Props) {
  const groups = useTournamentStore((s) => s.state?.groups);
  const teams = useTournamentStore((s) => s.state?.teams);

  if (!groups || !teams) {
    return <p className="text-neutral-500 text-sm animate-pulse">Loading…</p>;
  }

  const groupIds = Object.keys(groups).sort();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Pick your team</h2>
        <p className="text-neutral-400 text-sm">Select a team to explore their path to the next round.</p>
      </div>
      <div className="space-y-4">
        {groupIds.map((gid) => (
          <div key={gid}>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2 font-medium">Group {gid}</p>
            <div className="flex flex-wrap gap-2">
              {groups[gid].teamIds.map((tid) => {
                const team = teams[tid];
                if (!team) return null;
                return (
                  <button
                    key={tid}
                    onClick={() => onSelect(tid)}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-sm font-medium transition-all"
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
