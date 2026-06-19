export type TiebreakerCriterion =
  | "POINTS"
  | "GOAL_DIFFERENCE"
  | "GOALS_FOR"
  | "HEAD_TO_HEAD_POINTS"
  | "HEAD_TO_HEAD_GOAL_DIFFERENCE"
  | "HEAD_TO_HEAD_GOALS_FOR"
  | "DRAWING_OF_LOTS";

export type RoundType =
  | "GROUP_STAGE"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "THIRD_PLACE"
  | "FINAL";

export interface ThirdPlacePlayoffRule {
  advanceCount: number;
  selectionCriteria: TiebreakerCriterion[];
  eligibleGroups?: string[];
}

export interface GroupConfig {
  teamsPerGroup: number;
  pointsForWin: number;
  pointsForDraw: number;
  tiebreakers: TiebreakerCriterion[];
  directQualifiers: number;
  thirdPlaceRule?: ThirdPlacePlayoffRule;
}

export interface KnockoutRound {
  type: RoundType;
  matchCount: number;
  extraTime: boolean;
  penalties: boolean;
}

export interface CompetitionConfig {
  code: string;
  name: string;
  season: number;
  totalTeams: number;
  groupCount: number;
  groupConfig: GroupConfig;
  knockoutTeamCount: number;
  knockoutRounds: KnockoutRound[];
  apiCompetitionCode: string;
  stageMap: Record<string, RoundType>;
}
