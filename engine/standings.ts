import type { Fixture, GroupStanding, MatchResult, OverrideMap, ScoreOverrideMap } from "@/types/tournament";
import type { CompetitionConfig } from "@/types/competition";

function resultForFixture(
  fixture: Fixture,
  overrides: OverrideMap
): MatchResult | null {
  const override = overrides[String(fixture.id)];
  if (override) return override;
  return fixture.result;
}

export function computeStandings(
  fixtures: Record<number, Fixture>,
  groups: Record<string, { teamIds: number[]; fixtureIds: number[] }>,
  overrides: OverrideMap,
  config: CompetitionConfig,
  scoreOverrides: ScoreOverrideMap = {}
): Record<string, GroupStanding[]> {
  const { pointsForWin, pointsForDraw } = config.groupConfig;
  const result: Record<string, GroupStanding[]> = {};

  for (const [groupId, group] of Object.entries(groups)) {
    const standings: Record<number, GroupStanding> = {};
    for (const teamId of group.teamIds) {
      standings[teamId] = {
        teamId,
        groupId,
        position: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    }

    for (const fixtureId of group.fixtureIds) {
      const fixture = fixtures[fixtureId];
      if (!fixture) continue;
      const outcome = resultForFixture(fixture, overrides);
      if (!outcome) continue;

      const home = standings[fixture.homeTeamId];
      const away = standings[fixture.awayTeamId];
      if (!home || !away) continue;

      home.played++;
      away.played++;

      // Use user-entered score override, then real fixture score
      const scoreOvr = scoreOverrides[String(fixtureId)];
      const score = scoreOvr ?? fixture.score;
      if (score) {
        home.goalsFor     += score.homeGoals;
        home.goalsAgainst += score.awayGoals;
        away.goalsFor     += score.awayGoals;
        away.goalsAgainst += score.homeGoals;
      }

      if (outcome === "HOME_WIN") {
        home.won++;
        home.points += pointsForWin;
        away.lost++;
      } else if (outcome === "AWAY_WIN") {
        away.won++;
        away.points += pointsForWin;
        home.lost++;
      } else {
        home.drawn++;
        home.points += pointsForDraw;
        away.drawn++;
        away.points += pointsForDraw;
      }
    }

    for (const s of Object.values(standings)) {
      s.goalDifference = s.goalsFor - s.goalsAgainst;
    }

    const sorted = Object.values(standings).sort((a, b) =>
      compareStandings(a, b, fixtures, group.fixtureIds, overrides, config)
    );
    sorted.forEach((s, i) => (s.position = i + 1));
    result[groupId] = sorted;
  }

  return result;
}

export function compareStandings(
  a: GroupStanding,
  b: GroupStanding,
  fixtures: Record<number, Fixture>,
  groupFixtureIds: number[],
  overrides: OverrideMap,
  config: CompetitionConfig
): number {
  for (const criterion of config.groupConfig.tiebreakers) {
    let diff = 0;
    switch (criterion) {
      case "POINTS":
        diff = b.points - a.points;
        break;
      case "GOAL_DIFFERENCE":
        diff = b.goalDifference - a.goalDifference;
        break;
      case "GOALS_FOR":
        diff = b.goalsFor - a.goalsFor;
        break;
      case "HEAD_TO_HEAD_POINTS": {
        const h2h = getH2HResult(a.teamId, b.teamId, groupFixtureIds, fixtures, overrides, config);
        diff = h2h.bPoints - h2h.aPoints;
        break;
      }
      case "HEAD_TO_HEAD_GOAL_DIFFERENCE": {
        const h2h = getH2HResult(a.teamId, b.teamId, groupFixtureIds, fixtures, overrides, config);
        diff = h2h.bGD - h2h.aGD;
        break;
      }
      case "HEAD_TO_HEAD_GOALS_FOR": {
        const h2h = getH2HResult(a.teamId, b.teamId, groupFixtureIds, fixtures, overrides, config);
        diff = h2h.bGF - h2h.aGF;
        break;
      }
      case "DRAWING_OF_LOTS":
        diff = 0; // treat as equal — stable sort handles it
        break;
    }
    if (diff !== 0) return diff;
  }
  return 0;
}

function getH2HResult(
  teamA: number,
  teamB: number,
  fixtureIds: number[],
  fixtures: Record<number, Fixture>,
  overrides: OverrideMap,
  config: CompetitionConfig
) {
  let aPoints = 0, bPoints = 0, aGF = 0, bGF = 0, aGA = 0, bGA = 0;

  for (const id of fixtureIds) {
    const f = fixtures[id];
    if (!f) continue;
    const isH2H =
      (f.homeTeamId === teamA && f.awayTeamId === teamB) ||
      (f.homeTeamId === teamB && f.awayTeamId === teamA);
    if (!isH2H) continue;

    const outcome = resultForFixture(f, overrides);
    if (!outcome) continue;

    const aIsHome = f.homeTeamId === teamA;

    if (f.score) {
      const aGoals = aIsHome ? f.score.homeGoals : f.score.awayGoals;
      const bGoals = aIsHome ? f.score.awayGoals : f.score.homeGoals;
      aGF += aGoals;
      aGA += bGoals;
      bGF += bGoals;
      bGA += aGoals;
    }

    const aWon = (outcome === "HOME_WIN" && aIsHome) || (outcome === "AWAY_WIN" && !aIsHome);
    const bWon = (outcome === "HOME_WIN" && !aIsHome) || (outcome === "AWAY_WIN" && aIsHome);

    if (aWon) aPoints += config.groupConfig.pointsForWin;
    else if (bWon) bPoints += config.groupConfig.pointsForWin;
    else { aPoints += config.groupConfig.pointsForDraw; bPoints += config.groupConfig.pointsForDraw; }
  }

  return { aPoints, bPoints, aGD: aGF - aGA, bGD: bGF - bGA, aGF, bGF };
}
