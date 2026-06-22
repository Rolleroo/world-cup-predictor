import type { Fixture } from "@/types/tournament";
import type { MatchForecast } from "@/types/forecast";

// ─── Poisson scoring model ─────────────────────────────────────────────────

function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

// Win/draw/loss probabilities for two independent Poissons.
// Used only for the displayed button labels — derived from the SAME λ the
// simulation samples from, so the labels match the simulated outcomes.
function poissonOutcomeProbs(
  lh: number,
  la: number,
  maxGoals = 12
): { homeWin: number; draw: number; awayWin: number } {
  const ph: number[] = [];
  const pa: number[] = [];
  for (let k = 0; k <= maxGoals; k++) {
    ph[k] = poissonPmf(k, lh);
    pa[k] = poissonPmf(k, la);
  }
  let homeWin = 0, draw = 0, awayWin = 0;
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = ph[h] * pa[a];
      if (h > a) homeWin += p;
      else if (h < a) awayWin += p;
      else draw += p;
    }
  }
  return { homeWin, draw, awayWin };
}

// ─── Elo → expected goals (supremacy model) ────────────────────────────────
// Each team's expected goals scale geometrically with the Elo gap, so a
// bigger mismatch produces both a larger favourite λ and a larger total —
// matching real football, where lopsided games have more goals and bigger
// margins. The geometric mean of the two λ stays at BASE_GOALS, so an even
// match still averages the World Cup norm of ~2.6 total goals, while a
// mismatch lets favourites win by realistic margins (important because GD
// and GF are real group tiebreakers in the simulation).
const BASE_GOALS = 1.3;        // per-team expected goals in an even match
const ELO_GOAL_SCALE = 0.0035; // ln-goals per Elo point (λ ratio ≈ 4× at 400 Elo)
const MIN_LAMBDA = 0.15;
const MAX_LAMBDA = 4.5;

function clampLambda(x: number): number {
  return Math.max(MIN_LAMBDA, Math.min(MAX_LAMBDA, x));
}

export function eloToLambdas(
  homeElo: number,
  awayElo: number
): { lh: number; la: number } {
  const d = homeElo - awayElo; // neutral venue — no home advantage at a World Cup
  const lh = clampLambda(BASE_GOALS * Math.exp((ELO_GOAL_SCALE * d) / 2));
  const la = clampLambda(BASE_GOALS * Math.exp((-ELO_GOAL_SCALE * d) / 2));
  return { lh, la };
}

// ─── Forecast ─────────────────────────────────────────────────────────────

export function forecastMatch(
  fixture: Fixture,
  teamElos: Record<number, number>
): MatchForecast {
  const homeElo = teamElos[fixture.homeTeamId] ?? 1500;
  const awayElo = teamElos[fixture.awayTeamId] ?? 1500;
  const { lh, la } = eloToLambdas(homeElo, awayElo);
  const { homeWin, draw, awayWin } = poissonOutcomeProbs(lh, la);
  return {
    fixtureId: fixture.id,
    homeWinProb: homeWin,
    drawProb: draw,
    awayWinProb: awayWin,
    lambdaHome: lh,
    lambdaAway: la,
  };
}

export function forecastAll(
  fixtures: Record<number, Fixture>,
  teamElos: Record<number, number>
): Record<number, MatchForecast> {
  const forecasts: Record<number, MatchForecast> = {};
  for (const fixture of Object.values(fixtures)) {
    if (fixture.status === "FINISHED") continue;
    forecasts[fixture.id] = forecastMatch(fixture, teamElos);
  }
  return forecasts;
}
