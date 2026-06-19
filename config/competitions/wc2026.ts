import type { CompetitionConfig } from "@/types/competition";

export const wc2026: CompetitionConfig = {
  code: "WC2026",
  name: "2026 FIFA World Cup",
  season: 2026,
  totalTeams: 48,
  groupCount: 12,
  apiCompetitionCode: "WC",
  groupConfig: {
    teamsPerGroup: 4,
    pointsForWin: 3,
    pointsForDraw: 1,
    directQualifiers: 2,
    tiebreakers: [
      "POINTS",
      "GOAL_DIFFERENCE",
      "GOALS_FOR",
      "HEAD_TO_HEAD_POINTS",
      "HEAD_TO_HEAD_GOAL_DIFFERENCE",
      "HEAD_TO_HEAD_GOALS_FOR",
      "DRAWING_OF_LOTS",
    ],
    thirdPlaceRule: {
      advanceCount: 8,
      selectionCriteria: [
        "POINTS",
        "GOAL_DIFFERENCE",
        "GOALS_FOR",
        "DRAWING_OF_LOTS",
      ],
    },
  },
  knockoutTeamCount: 32,
  knockoutRounds: [
    { type: "ROUND_OF_32", matchCount: 16, extraTime: true, penalties: true },
    { type: "ROUND_OF_16", matchCount: 8, extraTime: true, penalties: true },
    { type: "QUARTER_FINAL", matchCount: 4, extraTime: true, penalties: true },
    { type: "SEMI_FINAL", matchCount: 2, extraTime: true, penalties: true },
    { type: "THIRD_PLACE", matchCount: 1, extraTime: true, penalties: true },
    { type: "FINAL", matchCount: 1, extraTime: true, penalties: true },
  ],
  stageMap: {
    GROUP_STAGE: "GROUP_STAGE",
    LAST_32: "ROUND_OF_32",
    LAST_16: "ROUND_OF_16",
    QUARTER_FINALS: "QUARTER_FINAL",
    SEMI_FINALS: "SEMI_FINAL",
    THIRD_PLACE: "THIRD_PLACE",
    FINAL: "FINAL",
  },
};
