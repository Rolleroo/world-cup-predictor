import type { CompetitionConfig } from "./competition";
import type { MatchForecast } from "./forecast";

export type MatchResult = "HOME_WIN" | "DRAW" | "AWAY_WIN";
export type MatchStatus = "SCHEDULED" | "IN_PLAY" | "FINISHED" | "POSTPONED";

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  eloRating: number;
  groupId: string;
}

export interface Fixture {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  groupId: string;
  matchday: number;
  utcDate: string;
  status: MatchStatus;
  score: { homeGoals: number; awayGoals: number } | null;
  result: MatchResult | null;
}

export interface GroupStanding {
  teamId: number;
  groupId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Group {
  id: string;
  teamIds: number[];
  fixtureIds: number[];
}

export type OverrideMap = Record<string, MatchResult>;
export type ScoreOverrideMap = Record<string, { homeGoals: number; awayGoals: number }>;

export interface TournamentState {
  config: CompetitionConfig;
  teams: Record<number, Team>;
  groups: Record<string, Group>;
  fixtures: Record<number, Fixture>;
  standings: Record<string, GroupStanding[]>;
  overrides: OverrideMap;
  scoreOverrides: ScoreOverrideMap;
  forecasts: Record<number, MatchForecast>;
  fetchedAt: string;
  dataSource: "live" | "mock";
}
