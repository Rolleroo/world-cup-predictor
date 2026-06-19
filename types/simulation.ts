import type { MatchResult } from "./tournament";

export interface SimulationUniverse {
  // [simCount × fixtureCount]: 0=HOME_WIN 1=DRAW 2=AWAY_WIN
  outcomeBuffer: Uint8Array;
  // [simCount × fixtureCount]: sampled home / away goals per fixture per sim
  homeGoalBuffer: Uint8Array;
  awayGoalBuffer: Uint8Array;
  fixtureOrder: number[];
  // [simCount × teamCount]: 1 if team advances from group stage
  qualBuffer: Uint8Array;
  teamOrder: number[];
  simCount: number;
}

export interface FilteredUniverse {
  passingSimIndices: Uint32Array;
  passingCount: number;
}

export type QualificationProbabilities = Record<number, number>; // teamId → 0..1

export interface DeltaResult {
  fixtureId: number;
  hypotheticalResult: MatchResult;
  before: QualificationProbabilities;
  after: QualificationProbabilities;
  filteredSimCount: number;
}

export interface SimWorkerInput {
  fixtureOrder: number[];
  teamOrder: number[];
  groupTeamIds: Record<string, number[]>;
  groupFixtureIds: Record<string, number[]>;
  // Per fixture: [homeWinProb, drawProb] — awayWin = 1 - both
  forecastProbs: Float32Array;   // length = fixtureCount * 2
  // Per fixture: Poisson λ values for goal sampling
  lambdaHome: Float32Array;      // length = fixtureCount
  lambdaAway: Float32Array;      // length = fixtureCount
  homeTeamIds: number[];         // parallel to fixtureOrder
  awayTeamIds: number[];
  lockedOutcomes: Uint8Array;    // 255 = not locked, else 0/1/2
  // Starting standings from already-finished matches, indexed [groupIdx * 4 + slotWithinGroup]
  startingPts: Int32Array;
  startingGd:  Int32Array;
  startingGf:  Int32Array;
  pointsForWin: number;
  pointsForDraw: number;
  tiebreakers: string[];
  directQualifiers: number;
  thirdPlaceAdvanceCount: number;
  thirdPlaceSelectionCriteria: string[];
  simCount: number;
}
