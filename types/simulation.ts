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
  // Per fixture: Poisson λ values for goal sampling. These are the sole
  // source of each match's win/draw/loss distribution — the outcome is
  // derived from the sampled scoreline, not from any separate W/D/L probs.
  lambdaHome: Float32Array;      // length = fixtureCount
  lambdaAway: Float32Array;      // length = fixtureCount
  homeTeamIds: number[];         // parallel to fixtureOrder
  awayTeamIds: number[];
  lockedOutcomes: Uint8Array;    // 255 = not locked, else 0/1/2
  // Starting standings from already-finished matches, indexed [groupIdx * 4 + slotWithinGroup]
  startingPts: Int32Array;
  startingGd:  Int32Array;
  startingGf:  Int32Array;
  // H2H scores from already-finished fixtures: [groupIdx * 32 + homeSlot * 8 + awaySlot * 2 + (0=hg|1=ag)]
  // -1 means the fixture hasn't been played yet (will be in the simulated buffers instead)
  finishedH2H: Int32Array;
  pointsForWin: number;
  pointsForDraw: number;
  tiebreakers: string[];
  directQualifiers: number;
  thirdPlaceAdvanceCount: number;
  thirdPlaceSelectionCriteria: string[];
  simCount: number;
}
