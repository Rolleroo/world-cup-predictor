"use client";

import { useShallow } from "zustand/react/shallow";
import { useTournamentStore } from "@/store/tournamentStore";

export function QualificationTable() {
  const { teams, probabilities, simulating } = useTournamentStore(
    useShallow((s) => ({
      teams: s.state?.teams ?? {},
      probabilities: s.probabilities,
      simulating: s.simulating,
    }))
  );

  const sorted = Object.values(teams).sort(
    (a, b) => (probabilities[b.id] ?? 0) - (probabilities[a.id] ?? 0)
  );

  if (simulating || sorted.length === 0) {
    return (
      <div className="text-neutral-500 text-sm animate-pulse">
        {simulating ? "Running simulations…" : "Loading…"}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-neutral-500 border-b border-neutral-700 bg-neutral-800/60">
            <th className="text-left px-4 py-2 font-normal">Team</th>
            <th className="text-left px-3 py-2 font-normal">Group</th>
            <th className="text-right px-4 py-2 font-normal">Qualify %</th>
            <th className="text-right px-4 py-2 hidden sm:table-cell font-normal">Bar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, i) => {
            const prob = probabilities[team.id] ?? 0;
            const pct = Math.round(prob * 100);
            let barColor = "bg-red-700";
            if (pct >= 70) barColor = "bg-emerald-600";
            else if (pct >= 40) barColor = "bg-yellow-600";
            else if (pct >= 15) barColor = "bg-orange-600";

            return (
              <tr
                key={team.id}
                className="border-b border-neutral-800/60 last:border-0 hover:bg-neutral-800/30 transition-colors"
              >
                <td className="px-4 py-2 text-neutral-200 font-medium">
                  {i + 1}. {team.name}
                </td>
                <td className="px-3 py-2 text-neutral-400">Group {team.groupId}</td>
                <td className="px-4 py-2 text-right font-mono font-semibold text-neutral-100">
                  {pct}%
                </td>
                <td className="px-4 py-2 hidden sm:table-cell">
                  <div className="h-2 rounded-full bg-neutral-700 w-32 ml-auto">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
