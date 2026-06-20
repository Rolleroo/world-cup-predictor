import type { TournamentState, Fixture, GroupStanding, MatchResult, MatchStatus } from "@/types/tournament";
import type { CompetitionConfig } from "@/types/competition";
import type { EspnEvent, EspnGroup } from "./espnData";
import { mockTournamentState } from "./mockData";

function espnStatusToMatchStatus(name: string): MatchStatus {
  if (name === "STATUS_FINAL" || name === "STATUS_FULL_TIME") return "FINISHED";
  if (name === "STATUS_IN_PROGRESS" || name === "STATUS_HALFTIME" || name === "STATUS_FIRST_HALF" || name === "STATUS_SECOND_HALF") return "IN_PLAY";
  return "SCHEDULED";
}

function goalsToResult(h: number, a: number): MatchResult {
  return h > a ? "HOME_WIN" : h < a ? "AWAY_WIN" : "DRAW";
}

function getStat(stats: { name: string; value: number }[], name: string): number {
  return stats.find((s) => s.name === name)?.value ?? 0;
}

export function mapEspnResponse(
  _config: CompetitionConfig,
  espnEvents: EspnEvent[],
  espnGroups: EspnGroup[]
): TournamentState {
  // Build TLA → internal team ID map from mock data
  const tlaToId: Record<string, number> = {};
  for (const team of Object.values(mockTournamentState.teams)) {
    tlaToId[team.tla] = team.id;
  }

  // Start fixtures from mock (correct structure) then patch with ESPN results
  const fixtures: Record<number, Fixture> = { ...mockTournamentState.fixtures };

  for (const event of espnEvents) {
    const comp = event.competitions[0];
    if (!comp) continue;

    const homeComp = comp.competitors.find((c) => c.homeAway === "home");
    const awayComp = comp.competitors.find((c) => c.homeAway === "away");
    if (!homeComp || !awayComp) continue;

    const homeId = tlaToId[homeComp.team.abbreviation];
    const awayId = tlaToId[awayComp.team.abbreviation];
    if (!homeId || !awayId) continue;

    // Find the matching fixture by home+away team
    const fixture = Object.values(fixtures).find(
      (f) => f.homeTeamId === homeId && f.awayTeamId === awayId
    );
    if (!fixture) continue;

    const status = espnStatusToMatchStatus(event.status.type.name);
    const homeGoals = parseInt(homeComp.score ?? "0", 10);
    const awayGoals = parseInt(awayComp.score ?? "0", 10);
    const hasScore  = status === "FINISHED" || status === "IN_PLAY";

    fixtures[fixture.id] = {
      ...fixture,
      status,
      score:  hasScore ? { homeGoals, awayGoals } : null,
      result: status === "FINISHED" ? goalsToResult(homeGoals, awayGoals) : null,
    };
  }

  // Build standings from ESPN groups; fall back to computing from fixtures for missing groups
  const standings: Record<string, GroupStanding[]> = {};

  for (const group of espnGroups) {
    // ESPN group name is e.g. "Group A" → extract letter
    const match = group.name.match(/Group ([A-Z])/i);
    if (!match) continue;
    const gid = match[1].toUpperCase();

    standings[gid] = group.standings.entries
      .map((entry) => {
        const teamId = tlaToId[entry.team.abbreviation];
        if (!teamId) return null;
        return {
          teamId,
          groupId: gid,
          position: 0,
          played:         getStat(entry.stats, "gamesPlayed"),
          won:            getStat(entry.stats, "wins"),
          drawn:          getStat(entry.stats, "ties"),
          lost:           getStat(entry.stats, "losses"),
          goalsFor:       getStat(entry.stats, "pointsFor"),
          goalsAgainst:   getStat(entry.stats, "pointsAgainst"),
          goalDifference: getStat(entry.stats, "pointDifferential"),
          points:         getStat(entry.stats, "points"),
        } as GroupStanding;
      })
      .filter((r): r is GroupStanding => r !== null)
      .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
      .map((r, i) => ({ ...r, position: i + 1 }));
  }

  // For any groups not returned by ESPN (e.g. I–L), compute from finished fixtures
  const config = mockTournamentState.config;
  const W = config.groupConfig.pointsForWin;
  const D = config.groupConfig.pointsForDraw;

  for (const [gid, group] of Object.entries(mockTournamentState.groups)) {
    if (standings[gid]) continue; // already have ESPN data

    const rows: Record<number, GroupStanding> = {};
    for (const tid of group.teamIds) {
      rows[tid] = { teamId: tid, groupId: gid, position: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    }
    for (const fid of group.fixtureIds) {
      const f = fixtures[fid];
      if (!f || f.status !== "FINISHED" || !f.result || !f.score) continue;
      const h = rows[f.homeTeamId];
      const a = rows[f.awayTeamId];
      if (!h || !a) continue;
      h.played++; a.played++;
      h.goalsFor += f.score.homeGoals; h.goalsAgainst += f.score.awayGoals;
      a.goalsFor += f.score.awayGoals; a.goalsAgainst += f.score.homeGoals;
      h.goalDifference = h.goalsFor - h.goalsAgainst;
      a.goalDifference = a.goalsFor - a.goalsAgainst;
      if (f.result === "HOME_WIN")      { h.won++; h.points += W; a.lost++; }
      else if (f.result === "AWAY_WIN") { a.won++; a.points += W; h.lost++; }
      else                              { h.drawn++; h.points += D; a.drawn++; a.points += D; }
    }
    const sorted = Object.values(rows).sort(
      (x, y) => y.points - x.points || y.goalDifference - x.goalDifference || y.goalsFor - x.goalsFor
    );
    sorted.forEach((r, i) => { r.position = i + 1; });
    standings[gid] = sorted;
  }

  return {
    ...mockTournamentState,
    fixtures,
    standings,
    overrides: {},
    scoreOverrides: {},
    forecasts: {},
    fetchedAt: new Date().toISOString(),
    dataSource: "live",
  };
}
