"use client";

import { useShallow } from "zustand/react/shallow";
import { useTournamentStore } from "@/store/tournamentStore";
import { FixtureRow } from "@/components/Fixture/FixtureRow";

interface Props {
  groupId: string;
}

export function GroupFixtures({ groupId }: Props) {
  const fixtureIds = useTournamentStore(useShallow((s) => s.state?.groups[groupId]?.fixtureIds ?? []));
  const fixtures = useTournamentStore(useShallow((s) => s.state?.fixtures ?? {}));

  const sorted = [...fixtureIds]
    .map((id) => fixtures[id])
    .filter(Boolean)
    .sort((a, b) => a.matchday - b.matchday || a.utcDate.localeCompare(b.utcDate));

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((f) => (
        <FixtureRow key={f.id} fixture={f} />
      ))}
    </div>
  );
}
