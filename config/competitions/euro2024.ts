import type { CompetitionConfig } from "@/types/competition";

export const euro2024: CompetitionConfig = {
  code: "EURO2024",
  name: "UEFA Euro 2024",
  season: 2024,
  totalTeams: 24,
  groupCount: 6,
  apiCompetitionCode: "EC",
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
      advanceCount: 4,
      selectionCriteria: [
        "POINTS",
        "GOAL_DIFFERENCE",
        "GOALS_FOR",
        "DRAWING_OF_LOTS",
      ],
    },
  },
  knockoutTeamCount: 16,
  knockoutRounds: [
    { type: "ROUND_OF_16", matchCount: 8, extraTime: true, penalties: true },
    { type: "QUARTER_FINAL", matchCount: 4, extraTime: true, penalties: true },
    { type: "SEMI_FINAL", matchCount: 2, extraTime: true, penalties: true },
    { type: "THIRD_PLACE", matchCount: 0, extraTime: false, penalties: false },
    { type: "FINAL", matchCount: 1, extraTime: true, penalties: true },
  ],
  stageMap: {
    GROUP_STAGE: "GROUP_STAGE",
    LAST_16: "ROUND_OF_16",
    QUARTER_FINALS: "QUARTER_FINAL",
    SEMI_FINALS: "SEMI_FINAL",
    FINAL: "FINAL",
  },
};
