"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTournamentStore } from "@/store/tournamentStore";
import { GroupTable } from "./GroupTable";
import { GroupFixtures } from "./GroupFixtures";

export function GroupGrid() {
  const groups = useTournamentStore(useShallow((s) => s.state?.groups ?? {}));
  const standings = useTournamentStore(useShallow((s) => s.state?.standings ?? {}));
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const groupIds = Object.keys(groups).sort();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groupIds.map((gid) => (
          <div key={gid} className="space-y-3">
            <GroupTable groupId={gid} standings={standings[gid] ?? []} />
            <button
              onClick={() => setExpandedGroup(expandedGroup === gid ? null : gid)}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors w-full text-center py-1"
            >
              {expandedGroup === gid ? "Hide fixtures ▲" : "Show fixtures ▼"}
            </button>
            {expandedGroup === gid && <GroupFixtures groupId={gid} />}
          </div>
        ))}
      </div>
    </div>
  );
}
