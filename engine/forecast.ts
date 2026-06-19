import type { Fixture } from "@/types/tournament";
import type { MatchForecast } from "@/types/forecast";

export function eloWinProb(homeElo: number, awayElo: number, homeAdvantage = 65): {
  homeWin: number;
  draw: number;
  awayWin: number;
} {
  const diff = homeElo + homeAdvantage - awayElo;
  const expectedHome = 1 / (1 + Math.pow(10, -diff / 400));
  const drawProb = 0.28 * Math.exp(-Math.pow((expectedHome - 0.5) * 3, 2));
  const remainder = 1 - drawProb;
  const homeWin = expectedHome * remainder;
  const awayWin = (1 - expectedHome) * remainder;
  return { homeWin, draw: drawProb, awayWin };
}

// ─── Poisson scoring model ─────────────────────────────────────────────────

function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

// P(home win) for Poisson(lh) vs Poisson(la), summing up to maxGoals each side
function poissonHomeWinProb(lh: number, la: number, maxGoals = 9): number {
  const ph: number[] = [];
  const pa: number[] = [];
  for (let k = 0; k <= maxGoals; k++) {
    ph[k] = poissonPmf(k, lh);
    pa[k] = poissonPmf(k, la);
  }
  let p = 0;
  for (let h = 1; h <= maxGoals; h++) {
    for (let a = 0; a < h; a++) {
      p += ph[h] * pa[a];
    }
  }
  return p;
}

// Binary-search for λ_home, λ_away that match the Elo home-win probability,
// constrained to λ_home + λ_away = totalGoals (World Cup avg ≈ 2.6)
export function computeLambdas(
  homeWinProb: number,
  totalGoals = 2.6
): { lh: number; la: number } {
  const min = 0.05;
  const max = totalGoals - 0.05;
  let lo = min, hi = max;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (poissonHomeWinProb(mid, totalGoals - mid) < homeWinProb) lo = mid;
    else hi = mid;
  }
  const lh = (lo + hi) / 2;
  return { lh, la: totalGoals - lh };
}

// ─── Forecast ─────────────────────────────────────────────────────────────

export function forecastMatch(
  fixture: Fixture,
  teamElos: Record<number, number>
): MatchForecast {
  const homeElo = teamElos[fixture.homeTeamId] ?? 1500;
  const awayElo = teamElos[fixture.awayTeamId] ?? 1500;
  const { homeWin, draw, awayWin } = eloWinProb(homeElo, awayElo);
  const { lh, la } = computeLambdas(homeWin);
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
