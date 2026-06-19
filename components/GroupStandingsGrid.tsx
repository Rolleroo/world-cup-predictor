"use client";

import { useTournamentStore } from "@/store/tournamentStore";

interface Props {
  selectedTeamId: number | null;
  onSelect: (teamId: number) => void;
}

export function GroupStandingsGrid({ selectedTeamId, onSelect }: Props) {
  const groups    = useTournamentStore((s) => s.state?.groups);
  const teams     = useTournamentStore((s) => s.state?.teams);
  const standings = useTournamentStore((s) => s.state?.standings);

  if (!groups || !teams || !standings) return null;

  const groupIds = Object.keys(groups).sort();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
      {groupIds.map((gid) => {
        const rows = standings[gid] ?? [];
        return (
          <div key={gid} className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
            <div className="px-3 py-1 bg-neutral-800/60 border-b border-neutral-800">
              <span className="text-xs font-bold text-neutral-400 tracking-widest uppercase">
                Group {gid}
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-800/50">
                  <th className="text-left px-3 py-1 font-medium text-neutral-600 w-full">Team</th>
                  <th className="text-center px-1 py-1 font-medium text-neutral-600 w-5">P</th>
                  <th className="text-center px-1 py-1 font-medium text-neutral-600 w-5">W</th>
                  <th className="text-center px-1 py-1 font-medium text-neutral-600 w-5">D</th>
                  <th className="text-center px-1 py-1 font-medium text-neutral-600 w-5">L</th>
                  <th className="text-center px-1 py-1 font-medium text-neutral-600 w-7">GD</th>
                  <th className="text-center px-1 py-1 font-medium text-neutral-600 w-7">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const team       = teams[row.teamId];
                  const isSelected = row.teamId === selectedTeamId;
                  const isAutoQ    = i < 2; // top 2 auto-qualify
                  const gdStr      = row.goalDifference > 0 ? `+${row.goalDifference}` : String(row.goalDifference);

                  return (
                    <tr
                      key={row.teamId}
                      className={`border-b border-neutral-800/30 last:border-0 transition-colors ${
                        isSelected ? "bg-emerald-900/30" : "hover:bg-neutral-800/30"
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isAutoQ ? "bg-emerald-500" : "bg-neutral-700"}`} />
                          <button
                            onClick={() => onSelect(row.teamId)}
                            className={`truncate text-left leading-none transition-colors hover:text-white ${
                              isSelected ? "text-emerald-300 font-semibold" : "text-neutral-300"
                            }`}
                          >
                            {team?.shortName ?? team?.name ?? "?"}
                          </button>
                        </div>
                      </td>
                      <td className="text-center px-1 py-1.5 text-neutral-500">{row.played}</td>
                      <td className="text-center px-1 py-1.5 text-neutral-500">{row.won}</td>
                      <td className="text-center px-1 py-1.5 text-neutral-500">{row.drawn}</td>
                      <td className="text-center px-1 py-1.5 text-neutral-500">{row.lost}</td>
                      <td className={`text-center px-1 py-1.5 tabular-nums ${
                        row.goalDifference > 0 ? "text-emerald-400" :
                        row.goalDifference < 0 ? "text-red-400" : "text-neutral-500"
                      }`}>{gdStr}</td>
                      <td className={`text-center px-1 py-1.5 font-bold tabular-nums ${
                        isSelected ? "text-emerald-300" : "text-neutral-200"
                      }`}>{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
