import type { GroupStanding } from "@/types/tournament";
import type { CompetitionConfig, TiebreakerCriterion } from "@/types/competition";

export type QualificationStatus = "DIRECT" | "THIRD_PLACE_PLAYOFF" | "ELIMINATED";

export interface QualificationResult {
  teamId: number;
  status: QualificationStatus;
}

export function computeQualification(
  standings: Record<string, GroupStanding[]>,
  config: CompetitionConfig
): QualificationResult[] {
  const { directQualifiers, thirdPlaceRule } = config.groupConfig;
  const results: QualificationResult[] = [];
  const thirdPlaceTeams: GroupStanding[] = [];

  for (const groupStandings of Object.values(standings)) {
    for (const standing of groupStandings) {
      if (standing.position <= directQualifiers) {
        results.push({ teamId: standing.teamId, status: "DIRECT" });
      } else if (standing.position === directQualifiers + 1 && thirdPlaceRule) {
        thirdPlaceTeams.push(standing);
      } else {
        results.push({ teamId: standing.teamId, status: "ELIMINATED" });
      }
    }
  }

  if (thirdPlaceRule && thirdPlaceTeams.length > 0) {
    const sorted = [...thirdPlaceTeams].sort((a, b) =>
      compareByCriteria(a, b, thirdPlaceRule.selectionCriteria)
    );
    const advanceCount = Math.min(thirdPlaceRule.advanceCount, sorted.length);
    for (let i = 0; i < sorted.length; i++) {
      results.push({
        teamId: sorted[i].teamId,
        status: i < advanceCount ? "THIRD_PLACE_PLAYOFF" : "ELIMINATED",
      });
    }
  }

  return results;
}

function compareByCriteria(
  a: GroupStanding,
  b: GroupStanding,
  criteria: TiebreakerCriterion[]
): number {
  for (const criterion of criteria) {
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
      case "DRAWING_OF_LOTS":
        diff = 0;
        break;
    }
    if (diff !== 0) return diff;
  }
  return 0;
}
