"use client";

import { useState } from "react";
import type { TournamentState } from "@/types/tournament";
import { StoreProvider } from "@/store/storeProvider";
import { GroupStandingsGrid } from "./GroupStandingsGrid";
import { TeamPredictor } from "./TeamPredictor";
import { useTournamentStore } from "@/store/tournamentStore";

function Inner() {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const dataSource = useTournamentStore((s) => s.state?.dataSource);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-neutral-300 tracking-tight">
            2026 World Cup Predictor
          </h1>
          <div className="flex items-center gap-3">
            {dataSource === "mock" && (
              <span className="text-xs text-neutral-600">mock data</span>
            )}
            {dataSource === "live" && (
              <span className="text-xs text-neutral-600">● live</span>
            )}
            <a
              href="#how-it-works"
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors hidden sm:block"
            >
              How the maths works ↓
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Instructions */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-neutral-400 space-y-1">
          <p className="text-neutral-200 font-semibold text-base">How to use</p>
          <p>Click any team in the group tables below to see their current chance of qualifying for the Round of 32.</p>
          <p>Then pick results for upcoming fixtures — the button colours show the impact on your team&apos;s chances: <span className="text-emerald-400">green = helps</span>, <span className="text-red-400">red = hurts</span>, grey = little effect. Expand a fixture to enter a specific score.</p>
          <p className="text-neutral-500 text-xs">
            Probabilities are based on 10,000 simulations per page load using Elo ratings and a Poisson goal model.{" "}
            <a href="#how-it-works" className="underline hover:text-neutral-300 transition-colors">See how it works ↓</a>
          </p>
        </div>

        <GroupStandingsGrid
          selectedTeamId={selectedTeamId}
          onSelect={setSelectedTeamId}
        />

        {selectedTeamId !== null && (
          <TeamPredictor teamId={selectedTeamId} />
        )}
      </main>

      {/* Footer — methodology */}
      <footer id="how-it-works" className="border-t border-neutral-800 mt-16 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
          <h2 className="text-lg font-bold text-neutral-200">How the maths works</h2>

          <div className="grid sm:grid-cols-2 gap-6 text-sm text-neutral-400">
            <div className="space-y-2">
              <h3 className="text-neutral-300 font-semibold">Elo ratings</h3>
              <p>
                Every team is assigned an Elo rating — a single number representing their strength based on historical results.
                The difference in Elo between two teams is used to estimate the probability of each outcome (home win, draw, away win)
                before a ball is kicked.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-neutral-300 font-semibold">Poisson goal model</h3>
              <p>
                Rather than just simulating win/draw/loss, we simulate actual scorelines. The Elo win probability is used to derive
                two Poisson parameters (λ) — one for each team&apos;s expected goals — constrained so the average total goals matches
                the World Cup average of 2.6 per game. Goals are then sampled independently for each team.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-neutral-300 font-semibold">Monte Carlo simulation</h3>
              <p>
                We run 10,000 complete simulations of the remaining tournament. In each one, every unplayed match gets a randomly
                sampled scoreline. Group standings are computed for all 12 groups, and the 8 best third-placed teams advance alongside
                the top two from each group — exactly as FIFA&apos;s rules dictate.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-neutral-300 font-semibold">Colour-coded impact</h3>
              <p>
                When you pick a result, the other buttons show what would happen to your team&apos;s qualifying probability
                if that result occurred across all 10,000 simulations. The colour gradient runs from bright green (big positive impact)
                through grey (little effect) to deep red (significant harm). The intensity scales continuously with the size of the effect.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-neutral-300 font-semibold">Live data</h3>
              <p>
                Match results and standings are fetched from football-data.org each time the page loads. Finished matches are locked in
                as known results; only remaining fixtures are simulated. The model updates automatically as the tournament progresses.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-neutral-300 font-semibold">Limitations</h3>
              <p>
                Elo ratings reflect past performance and don&apos;t account for injuries, squad rotation, or dead-rubber incentives.
                Head-to-head tiebreakers are approximated where scores are unknown. With 10,000 simulations, probabilities are accurate
                to within roughly ±1 percentage point.
              </p>
            </div>
          </div>

          <p className="text-xs text-neutral-700 pt-4 border-t border-neutral-800">
            Built with Next.js · Data from football-data.org · Elo ratings from eloratings.net
          </p>
        </div>
      </footer>
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
