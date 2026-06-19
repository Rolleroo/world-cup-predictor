"use client";

import { useEffect, useRef, useState } from "react";
import type { DeltaResult } from "@/types/simulation";
import type { Team } from "@/types/tournament";

interface Props {
  delta: DeltaResult;
  focusTeamIds?: number[];
  teams: Record<number, Team>;
  anchorPos: { x: number; y: number };
}

function fmt(n: number) {
  return `${Math.round(n * 100)}%`;
}

function Arrow({ before, after }: { before: number; after: number }) {
  const diff = after - before;
  if (Math.abs(diff) < 0.005) return <span className="text-neutral-400">—</span>;
  return diff > 0 ? (
    <span className="text-emerald-400">↑ {fmt(diff)}</span>
  ) : (
    <span className="text-red-400">↓ {fmt(Math.abs(diff))}</span>
  );
}

export function HoverPreview({ delta, focusTeamIds, teams, anchorPos }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(anchorPos);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = anchorPos.x + 12;
    let y = anchorPos.y - 8;
    if (x + rect.width > vw - 8) x = anchorPos.x - rect.width - 12;
    if (y + rect.height > vh - 8) y = vh - rect.height - 8;
    setPos({ x, y });
  }, [anchorPos]);

  const teamIds = focusTeamIds ?? Object.keys(delta.after).map(Number);
  const sorted = [...teamIds].sort(
    (a, b) => (delta.after[b] ?? 0) - (delta.after[a] ?? 0)
  );

  return (
    <div
      ref={ref}
      className="fixed z-50 pointer-events-none bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-3 min-w-[200px]"
      style={{ left: pos.x, top: pos.y }}
    >
      <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wide">
        If selected
      </p>
      <table className="w-full text-sm">
        <tbody>
          {sorted.map((teamId) => {
            const team = teams[teamId];
            if (!team) return null;
            const before = delta.before[teamId] ?? 0;
            const after = delta.after[teamId] ?? 0;
            return (
              <tr key={teamId}>
                <td className="text-neutral-300 pr-3 py-0.5">{team.shortName || team.tla}</td>
                <td className="text-neutral-100 font-mono text-right pr-2">{fmt(after)}</td>
                <td className="text-right">
                  <Arrow before={before} after={after} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-neutral-600 mt-2 text-right">
        {delta.filteredSimCount.toLocaleString()} sims
      </p>
    </div>
  );
}
