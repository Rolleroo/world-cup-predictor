import type { SimulationUniverse, FilteredUniverse, QualificationProbabilities, DeltaResult } from "@/types/simulation";
import type { MatchResult, OverrideMap } from "@/types/tournament";

const RESULT_FROM_BYTE: MatchResult[] = ["HOME_WIN", "DRAW", "AWAY_WIN"];

const RESULT_BYTE: Record<MatchResult, number> = {
  HOME_WIN: 0,
  DRAW: 1,
  AWAY_WIN: 2,
};

// Build a Uint32Array of simulation indices where all overrides match
export function filterUniverse(
  universe: SimulationUniverse,
  overrides: OverrideMap
): FilteredUniverse {
  const { outcomeBuffer, fixtureOrder, simCount } = universe;
  const fixtureCount = fixtureOrder.length;

  // Pre-compute which columns to check and what value to match
  const checks: { col: number; val: number }[] = [];
  for (const [fixtureIdStr, result] of Object.entries(overrides)) {
    const col = fixtureOrder.indexOf(Number(fixtureIdStr));
    if (col === -1) continue;
    checks.push({ col, val: RESULT_BYTE[result] });
  }

  if (checks.length === 0) {
    // No filter — all sims pass
    const all = new Uint32Array(simCount);
    for (let i = 0; i < simCount; i++) all[i] = i;
    return { passingSimIndices: all, passingCount: simCount };
  }

  const passing = new Uint32Array(simCount);
  let count = 0;

  for (let s = 0; s < simCount; s++) {
    const base = s * fixtureCount;
    let match = true;
    for (const { col, val } of checks) {
      if (outcomeBuffer[base + col] !== val) {
        match = false;
        break;
      }
    }
    if (match) passing[count++] = s;
  }

  return { passingSimIndices: passing, passingCount: count };
}

export function computeProbabilities(
  universe: SimulationUniverse,
  filtered: FilteredUniverse
): QualificationProbabilities {
  const { qualBuffer, teamOrder, simCount: _simCount } = universe;
  const teamCount = teamOrder.length;
  const { passingSimIndices, passingCount } = filtered;

  if (passingCount === 0) {
    const probs: QualificationProbabilities = {};
    for (const id of teamOrder) probs[id] = 0;
    return probs;
  }

  const counts = new Uint32Array(teamCount);
  for (let i = 0; i < passingCount; i++) {
    const s = passingSimIndices[i];
    const base = s * teamCount;
    for (let t = 0; t < teamCount; t++) {
      counts[t] += qualBuffer[base + t];
    }
  }

  const probs: QualificationProbabilities = {};
  for (let t = 0; t < teamCount; t++) {
    probs[teamOrder[t]] = counts[t] / passingCount;
  }
  return probs;
}

/**
 * Single-pass delta computation for all fixtures × 3 outcomes for one team.
 * Replaces 180 separate filterUniverse+computeProbabilities calls with one
 * O(simCount × fixtureCount) scan, avoiding ~400M main-thread operations.
 */
export function computeAllDeltasForTeam(
  universe: SimulationUniverse,
  overrides: OverrideMap,
  teamId: number,
  fixtureIds: number[],
  currentProbability: number,
): Record<number, Record<MatchResult, number>> {
  const { outcomeBuffer, fixtureOrder, qualBuffer, teamOrder, simCount } = universe;
  const fixtureCount = fixtureOrder.length;
  const teamCount = teamOrder.length;

  const teamIdx = teamOrder.indexOf(teamId);
  if (teamIdx === -1) return {};

  // Build fixture → column index map
  const fixtureIdxMap: Record<number, number> = {};
  for (let i = 0; i < fixtureOrder.length; i++) fixtureIdxMap[fixtureOrder[i]] = i;

  // Pre-compute override column checks
  const overrideCols: number[] = [];
  const overrideVals: number[] = [];
  for (const [fidStr, result] of Object.entries(overrides)) {
    const col = fixtureIdxMap[Number(fidStr)];
    if (col !== undefined) {
      overrideCols.push(col);
      overrideVals.push(RESULT_BYTE[result]);
    }
  }
  const overrideCount = overrideCols.length;

  // Map requested fixture IDs to columns (skip unknown)
  const cols: number[] = [];
  const validFids: number[] = [];
  for (const fid of fixtureIds) {
    const col = fixtureIdxMap[fid];
    if (col !== undefined) { cols.push(col); validFids.push(fid); }
  }
  const numCols = cols.length;

  // count[i*3+r]    = passing sims where fixture i had result r
  // qualCount[i*3+r] = of those, how many had teamId qualify
  const count     = new Uint32Array(numCols * 3);
  const qualCount = new Uint32Array(numCols * 3);

  for (let s = 0; s < simCount; s++) {
    const simBase = s * fixtureCount;

    // Check current overrides
    let passes = true;
    for (let oi = 0; oi < overrideCount; oi++) {
      if (outcomeBuffer[simBase + overrideCols[oi]] !== overrideVals[oi]) {
        passes = false;
        break;
      }
    }
    if (!passes) continue;

    const qualified = qualBuffer[s * teamCount + teamIdx];

    for (let i = 0; i < numCols; i++) {
      const outcome = outcomeBuffer[simBase + cols[i]];
      const idx = i * 3 + outcome;
      count[idx]++;
      if (qualified) qualCount[idx]++;
    }
  }

  // Build result map
  const out: Record<number, Record<MatchResult, number>> = {};
  for (let i = 0; i < validFids.length; i++) {
    const entry: Record<MatchResult, number> = {} as Record<MatchResult, number>;
    for (let r = 0; r < 3; r++) {
      const c = count[i * 3 + r];
      entry[RESULT_FROM_BYTE[r]] = c > 0 ? qualCount[i * 3 + r] / c : currentProbability;
    }
    out[validFids[i]] = entry;
  }
  return out;
}

export function computeDelta(
  universe: SimulationUniverse,
  currentOverrides: OverrideMap,
  fixtureId: number,
  hypotheticalResult: MatchResult,
  currentProbs: QualificationProbabilities
): DeltaResult {
  const hypotheticalOverrides: OverrideMap = {
    ...currentOverrides,
    [String(fixtureId)]: hypotheticalResult,
  };

  const filtered = filterUniverse(universe, hypotheticalOverrides);
  const after = computeProbabilities(universe, filtered);

  return {
    fixtureId,
    hypotheticalResult,
    before: currentProbs,
    after,
    filteredSimCount: filtered.passingCount,
  };
}
