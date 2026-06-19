import type { TournamentState, Team, Fixture, Group, GroupStanding, MatchResult, MatchStatus } from "@/types/tournament";
import type { CompetitionConfig } from "@/types/competition";
import type { FdTeam, FdMatch, FdStandingGroup, FdStandingRow } from "./footballData";
import { getEloByTla } from "./eloRatings";

function fdStatusToStatus(s: string): MatchStatus {
  if (s === "FINISHED") return "FINISHED";
  if (s === "IN_PLAY" || s === "PAUSED" || s === "HALFTIME") return "IN_PLAY";
  if (s === "POSTPONED" || s === "CANCELLED" || s === "SUSPENDED") return "POSTPONED";
  return "SCHEDULED";
}

function scoreToResult(score: FdMatch["score"]): MatchResult | null {
  const h = score.fullTime.home;
  const a = score.fullTime.away;
  if (h === null || a === null) return null;
  if (h > a) return "HOME_WIN";
  if (a > h) return "AWAY_WIN";
  return "DRAW";
}

// football-data.org group field: "GROUP_A" → "A"
function parseGroupId(group: string | null): string {
  if (!group) return "UNKNOWN";
  return group.replace(/^GROUP_/, "");
}

export function mapApiResponse(
  config: CompetitionConfig,
  fdTeams: FdTeam[],
  fdMatches: FdMatch[],
  fdStandings: FdStandingGroup[]
): TournamentState {
  const teams: Record<number, Team> = {};
  const groups: Record<string, Group> = {};
  const fixtures: Record<number, Fixture> = {};
  const standings: Record<string, GroupStanding[]> = {};

  // Map teams — we'll fill groupId once we process matches
  const teamGroupMap: Record<number, string> = {};
  for (const m of fdMatches) {
    if (m.stage !== "GROUP_STAGE" || !m.group) continue;
    const gid = parseGroupId(m.group);
    teamGroupMap[m.homeTeam.id] = gid;
    teamGroupMap[m.awayTeam.id] = gid;
  }

  for (const t of fdTeams) {
    const groupId = teamGroupMap[t.id] ?? "UNKNOWN";
    teams[t.id] = {
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      tla: t.tla,
      crest: t.crest,
      eloRating: getEloByTla(t.tla),
      groupId,
    };
  }

  // Build group scaffolding
  for (const [teamId, gid] of Object.entries(teamGroupMap)) {
    if (!groups[gid]) groups[gid] = { id: gid, teamIds: [], fixtureIds: [] };
    const numId = Number(teamId);
    if (!groups[gid].teamIds.includes(numId)) groups[gid].teamIds.push(numId);
  }

  // Map group-stage fixtures
  for (const m of fdMatches) {
    if (m.stage !== "GROUP_STAGE" || !m.group) continue;
    const gid = parseGroupId(m.group);
    const status = fdStatusToStatus(m.status);
    const result = status === "FINISHED" ? scoreToResult(m.score) : null;
    const homeGoals = m.score.fullTime.home;
    const awayGoals = m.score.fullTime.away;

    const fixture: Fixture = {
      id: m.id,
      homeTeamId: m.homeTeam.id,
      awayTeamId: m.awayTeam.id,
      groupId: gid,
      matchday: m.matchday,
      utcDate: m.utcDate,
      status,
      score: homeGoals !== null && awayGoals !== null ? { homeGoals, awayGoals } : null,
      result,
    };

    fixtures[m.id] = fixture;
    if (groups[gid] && !groups[gid].fixtureIds.includes(m.id)) {
      groups[gid].fixtureIds.push(m.id);
    }
  }

  // Map standings from API (used as initial seed only; client recomputes on overrides)
  for (const sg of fdStandings) {
    if (sg.type !== "TOTAL" || !sg.group) continue;
    const gid = parseGroupId(sg.group);
    standings[gid] = sg.table.map((row: FdStandingRow) => ({
      teamId: row.team.id,
      groupId: gid,
      position: row.position,
      played: row.won + row.draw + row.lost,
      won: row.won,
      drawn: row.draw,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
    }));
  }

  // Sort group teamIds alphabetically for stable display
  for (const g of Object.values(groups)) {
    g.teamIds.sort((a, b) => (teams[a]?.tla ?? "").localeCompare(teams[b]?.tla ?? ""));
  }

  return {
    config,
    teams,
    groups,
    fixtures,
    standings,
    overrides: {},
    scoreOverrides: {},
    forecasts: {},
    fetchedAt: new Date().toISOString(),
  };
}
