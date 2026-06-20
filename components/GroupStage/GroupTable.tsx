"use client";

import { useShallow } from "zustand/react/shallow";
import type { GroupStanding } from "@/types/tournament";
import { useTournamentStore } from "@/store/tournamentStore";

interface Props {
  groupId: string;
  standings: GroupStanding[];
}

function QualBadge({ prob, config }: { prob: number; config: { directQualifiers: number; thirdPlaceRule?: unknown } }) {
  const pct = Math.round(prob * 100);
  let color = "text-neutral-500";
  if (pct >= 70) color = "text-emerald-400";
  else if (pct >= 40) color = "text-yellow-400";
  else if (pct >= 10) color = "text-orange-400";
  else color = "text-red-400";
  return <span className={`font-mono text-sm font-semibold ${color}`}>{pct}%</span>;
}

export function GroupTable({ groupId, standings }: Props) {
  const { probabilities, config } = useTournamentStore(
    useShallow((s) => ({
      probabilities: s.probabilities,
      config: s.state?.config,
    }))
  );

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800">
      <div className="px-3 py-2 bg-neutral-800/60 border-b border-neutral-700">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
          Group {groupId}
        </h3>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-neutral-500 border-b border-neutral-800">
            <th className="text-left pl-2 pr-1 py-1.5 font-normal w-5">#</th>
            <th className="text-left px-1 py-1.5 font-normal">Team</th>
            <th className="text-center px-1 py-1.5 font-normal">P</th>
            <th className="hidden sm:table-cell text-center px-1 py-1.5 font-normal">W</th>
            <th className="hidden sm:table-cell text-center px-1 py-1.5 font-normal">D</th>
            <th className="hidden sm:table-cell text-center px-1 py-1.5 font-normal">L</th>
            <th className="text-center px-1 py-1.5 font-normal">GD</th>
            <th className="text-center px-1 py-1.5 font-normal">Pts</th>
            <th className="text-right pl-1 pr-2 py-1.5 font-normal">Qual%</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const directCutoff = config?.groupConfig.directQualifiers ?? 2;
            const prob = probabilities[s.teamId] ?? 0;

            return (
              <tr
                key={s.teamId}
                className={[
                  "border-b border-neutral-800/60 last:border-0",
                  i < directCutoff ? "bg-emerald-950/20" : "",
                ].join(" ")}
              >
                <td className="pl-2 pr-1 py-2 text-neutral-500">{s.position}</td>
                <td className="px-1 py-2 text-neutral-200 font-medium max-w-0 w-full">
                  <span className="block truncate"><TeamName teamId={s.teamId} /></span>
                </td>
                <td className="px-1 py-2 text-center text-neutral-300">{s.played}</td>
                <td className="hidden sm:table-cell px-1 py-2 text-center text-neutral-300">{s.won}</td>
                <td className="hidden sm:table-cell px-1 py-2 text-center text-neutral-300">{s.drawn}</td>
                <td className="hidden sm:table-cell px-1 py-2 text-center text-neutral-300">{s.lost}</td>
                <td className="px-1 py-2 text-center text-neutral-300">
                  {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                </td>
                <td className="px-1 py-2 text-center font-semibold text-neutral-100">{s.points}</td>
                <td className="pl-1 pr-2 py-2 text-right">
                  {config ? <QualBadge prob={prob} config={config.groupConfig} /> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamName({ teamId }: { teamId: number }) {
  const name = useTournamentStore((s) => s.state?.teams[teamId]?.shortName ?? String(teamId));
  return <>{name}</>;
}
