"use client";

import type { Fixture } from "@/types/tournament";
import { useTournamentStore } from "@/store/tournamentStore";
import { ResultButton } from "./ResultButton";

interface Props {
  fixture: Fixture;
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function FixtureRow({ fixture }: Props) {
  const teams = useTournamentStore((s) => s.state?.teams);
  const forecasts = useTournamentStore((s) => s.state?.forecasts);
  const overrides = useTournamentStore((s) => s.state?.overrides);

  const home = teams?.[fixture.homeTeamId];
  const away = teams?.[fixture.awayTeamId];
  const forecast = forecasts?.[fixture.id];
  const locked = overrides?.[String(fixture.id)];

  const date = new Date(fixture.utcDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  if (fixture.status === "FINISHED") {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-neutral-800/40">
        <span className="text-neutral-300 flex-1 text-sm">{home?.shortName ?? "?"}</span>
        <span className="font-mono text-white font-semibold">
          {fixture.score?.homeGoals} – {fixture.score?.awayGoals}
        </span>
        <span className="text-neutral-300 flex-1 text-right text-sm">{away?.shortName ?? "?"}</span>
        <span className="text-xs text-neutral-500 ml-2">FT</span>
      </div>
    );
  }

  return (
    <div className="py-2 px-3 rounded-lg bg-neutral-800/20 border border-neutral-800">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-neutral-400 text-xs">{date}</span>
        {locked && (
          <span className="text-xs text-emerald-400 font-medium">Locked</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-neutral-200 text-sm font-medium flex-1">{home?.shortName ?? "?"}</span>
        <div className="flex gap-1.5">
          <ResultButton
            fixtureId={fixture.id}
            result="HOME_WIN"
            label={forecast ? pct(forecast.homeWinProb) : "W"}
            focusTeamIds={[fixture.homeTeamId, fixture.awayTeamId]}
          />
          <ResultButton
            fixtureId={fixture.id}
            result="DRAW"
            label={forecast ? pct(forecast.drawProb) : "D"}
            focusTeamIds={[fixture.homeTeamId, fixture.awayTeamId]}
          />
          <ResultButton
            fixtureId={fixture.id}
            result="AWAY_WIN"
            label={forecast ? pct(forecast.awayWinProb) : "W"}
            focusTeamIds={[fixture.homeTeamId, fixture.awayTeamId]}
          />
        </div>
        <span className="text-neutral-200 text-sm font-medium flex-1 text-right">{away?.shortName ?? "?"}</span>
      </div>
    </div>
  );
}
