import type { SimWorkerInput, SimulationUniverse } from "@/types/simulation";
import type { TiebreakerCriterion } from "@/types/competition";

// Knuth Poisson sampler — fast for λ < 15 (all WC fixtures qualify)
function samplePoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = -1, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k;
}

export function runSimulations(input: SimWorkerInput): SimulationUniverse {
  const {
    fixtureOrder,
    teamOrder,
    groupTeamIds,
    groupFixtureIds,
    homeTeamIds,
    awayTeamIds,
    // Match win/draw/loss is determined entirely by the Poisson-sampled
    // scoreline below — there is no separate W/D/L probability input.
    lambdaHome,
    lambdaAway,
    lockedOutcomes,
    startingPts,
    startingGd,
    startingGf,
    finishedH2H,
    pointsForWin,
    pointsForDraw,
    tiebreakers,
    directQualifiers,
    thirdPlaceAdvanceCount,
    thirdPlaceSelectionCriteria,
    simCount,
  } = input;

  const fixtureCount = fixtureOrder.length;
  const teamCount    = teamOrder.length;

  const fixtureIndex: Record<number, number> = {};
  for (let i = 0; i < fixtureCount; i++) fixtureIndex[fixtureOrder[i]] = i;
  const teamIndex: Record<number, number> = {};
  for (let i = 0; i < teamCount; i++) teamIndex[teamOrder[i]] = i;

  const groups = Object.keys(groupTeamIds);

  const groupFixtureCols: Record<string, number[]>  = {};
  const groupHomeTeam:    Record<string, number[]>  = {};
  const groupAwayTeam:    Record<string, number[]>  = {};

  for (const g of groups) {
    groupFixtureCols[g] = [];
    groupHomeTeam[g]    = [];
    groupAwayTeam[g]    = [];
    for (const fid of groupFixtureIds[g]) {
      const col = fixtureIndex[fid];
      if (col === undefined) continue;
      groupFixtureCols[g].push(col);
      groupHomeTeam[g].push(homeTeamIds[col]);
      groupAwayTeam[g].push(awayTeamIds[col]);
    }
  }

  const outcomeBuffer   = new Uint8Array(simCount * fixtureCount);
  const homeGoalBuffer  = new Uint8Array(simCount * fixtureCount);
  const awayGoalBuffer  = new Uint8Array(simCount * fixtureCount);
  const qualBuffer      = new Uint8Array(simCount * teamCount);

  const maxTeamsPerGroup = 4;
  const pts = new Int32Array(groups.length * maxTeamsPerGroup);
  const gd  = new Int32Array(groups.length * maxTeamsPerGroup);
  const gf  = new Int32Array(groups.length * maxTeamsPerGroup);

  for (let s = 0; s < simCount; s++) {
    const base = s * fixtureCount;

    // 1. Sample goals from Poisson; derive outcome
    for (let col = 0; col < fixtureCount; col++) {
      if (lockedOutcomes[col] !== 255) {
        // Outcome is locked — still sample goals consistent with the result
        const locked = lockedOutcomes[col]; // 0=HW 1=D 2=AW
        let hg: number, ag: number;
        // Rejection-sample until goals match the locked result
        do {
          hg = samplePoisson(lambdaHome[col]);
          ag = samplePoisson(lambdaAway[col]);
        } while (
          (locked === 0 && hg <= ag) ||
          (locked === 1 && hg !== ag) ||
          (locked === 2 && hg >= ag)
        );
        homeGoalBuffer[base + col] = Math.min(hg, 255);
        awayGoalBuffer[base + col] = Math.min(ag, 255);
        outcomeBuffer[base + col]  = locked;
      } else {
        const hg = samplePoisson(lambdaHome[col]);
        const ag = samplePoisson(lambdaAway[col]);
        homeGoalBuffer[base + col] = Math.min(hg, 255);
        awayGoalBuffer[base + col] = Math.min(ag, 255);
        outcomeBuffer[base + col]  = hg > ag ? 0 : hg < ag ? 2 : 1;
      }
    }

    // 2. Compute group standings — start from already-played results, add simulated ones
    for (let i = 0; i < pts.length; i++) {
      pts[i] = startingPts[i];
      gd[i]  = startingGd[i];
      gf[i]  = startingGf[i];
    }

    for (let gi = 0; gi < groups.length; gi++) {
      const g      = groups[gi];
      const tIds   = groupTeamIds[g];
      const fCols  = groupFixtureCols[g];
      const htIds  = groupHomeTeam[g];
      const atIds  = groupAwayTeam[g];

      const slot: Record<number, number> = {};
      for (let ti = 0; ti < tIds.length; ti++) slot[tIds[ti]] = ti;

      for (let fi = 0; fi < fCols.length; fi++) {
        const col     = fCols[fi];
        const outcome = outcomeBuffer[base + col];
        const hGoals  = homeGoalBuffer[base + col];
        const aGoals  = awayGoalBuffer[base + col];
        const hSlot   = slot[htIds[fi]];
        const aSlot   = slot[atIds[fi]];
        if (hSlot === undefined || aSlot === undefined) continue;

        const hBase = gi * maxTeamsPerGroup + hSlot;
        const aBase = gi * maxTeamsPerGroup + aSlot;

        // Points
        if (outcome === 0) {
          pts[hBase] += pointsForWin;
        } else if (outcome === 2) {
          pts[aBase] += pointsForWin;
        } else {
          pts[hBase] += pointsForDraw;
          pts[aBase] += pointsForDraw;
        }

        // Goals
        gf[hBase] += hGoals;
        gd[hBase] += hGoals - aGoals;
        gf[aBase] += aGoals;
        gd[aBase] += aGoals - hGoals;
      }

      // 3. Sort by tiebreakers and mark direct qualifiers
      const positions = tIds.map((_, ti) => ti).sort((ati, bti) => {
        const ab = gi * maxTeamsPerGroup + ati;
        const bb = gi * maxTeamsPerGroup + bti;
        for (const t of tiebreakers as TiebreakerCriterion[]) {
          let diff = 0;
          if (t === "POINTS") {
            diff = pts[bb] - pts[ab];
          } else if (t === "GOAL_DIFFERENCE") {
            diff = gd[bb] - gd[ab];
          } else if (t === "GOALS_FOR") {
            diff = gf[bb] - gf[ab];
          } else if (
            t === "HEAD_TO_HEAD_POINTS" ||
            t === "HEAD_TO_HEAD_GOAL_DIFFERENCE" ||
            t === "HEAD_TO_HEAD_GOALS_FOR"
          ) {
            // Look up H2H goals between these two teams (pairwise)
            const teamA = tIds[ati];
            const teamB = tIds[bti];
            let aGoals = -1, bGoals = -1;

            // Check simulated (future) fixtures first
            for (let fi = 0; fi < fCols.length; fi++) {
              const hId = htIds[fi];
              const aid = atIds[fi];
              if ((hId === teamA && aid === teamB) || (hId === teamB && aid === teamA)) {
                const col = fCols[fi];
                const hg = homeGoalBuffer[base + col];
                const ag = awayGoalBuffer[base + col];
                if (hId === teamA) { aGoals = hg; bGoals = ag; }
                else               { aGoals = ag; bGoals = hg; }
                break;
              }
            }

            // Fall back to already-finished H2H fixture
            if (aGoals < 0) {
              const hSlot = ati; const aSlot = bti;
              let idx = gi * 32 + hSlot * 8 + aSlot * 2;
              if (finishedH2H[idx] >= 0) {
                aGoals = finishedH2H[idx]; bGoals = finishedH2H[idx + 1];
              } else {
                idx = gi * 32 + aSlot * 8 + hSlot * 2;
                if (finishedH2H[idx] >= 0) {
                  bGoals = finishedH2H[idx]; aGoals = finishedH2H[idx + 1];
                }
              }
            }

            if (aGoals >= 0) {
              if (t === "HEAD_TO_HEAD_POINTS") {
                const aH2H = aGoals > bGoals ? pointsForWin : aGoals === bGoals ? pointsForDraw : 0;
                const bH2H = bGoals > aGoals ? pointsForWin : aGoals === bGoals ? pointsForDraw : 0;
                diff = bH2H - aH2H;
              } else if (t === "HEAD_TO_HEAD_GOAL_DIFFERENCE") {
                diff = (bGoals - aGoals) - (aGoals - bGoals);
              } else {
                diff = bGoals - aGoals;
              }
            }
          }
          if (diff !== 0) return diff;
        }
        return 0;
      });

      const qualBase = s * teamCount;
      for (let pos = 0; pos < positions.length; pos++) {
        if (pos >= directQualifiers) break;
        const ti = teamIndex[tIds[positions[pos]]];
        if (ti !== undefined) qualBuffer[qualBase + ti] = 1;
      }
    }

    // 4. Best third-placed teams
    if (thirdPlaceAdvanceCount > 0) {
      // Collect the third-placed team from each group with their full stats
      const thirds: { teamId: number; pts: number; gd: number; gf: number }[] = [];

      for (let gi = 0; gi < groups.length; gi++) {
        const g      = groups[gi];
        const tIds   = groupTeamIds[g];
        const fCols3 = groupFixtureCols[g];
        const htIds3 = groupHomeTeam[g];
        const atIds3 = groupAwayTeam[g];

        const positions = tIds.map((_, ti) => ti).sort((ati, bti) => {
          const ab = gi * maxTeamsPerGroup + ati;
          const bb = gi * maxTeamsPerGroup + bti;
          let diff = pts[bb] - pts[ab];
          if (diff !== 0) return diff;
          diff = gd[bb] - gd[ab];
          if (diff !== 0) return diff;
          diff = gf[bb] - gf[ab];
          if (diff !== 0) return diff;
          // H2H pairwise for finding the correct 3rd-placed team
          const teamA = tIds[ati]; const teamB = tIds[bti];
          let aGoals = -1, bGoals = -1;
          for (let fi = 0; fi < fCols3.length; fi++) {
            const hId = htIds3[fi]; const aid = atIds3[fi];
            if ((hId === teamA && aid === teamB) || (hId === teamB && aid === teamA)) {
              const col = fCols3[fi];
              const hg = homeGoalBuffer[base + col]; const ag = awayGoalBuffer[base + col];
              if (hId === teamA) { aGoals = hg; bGoals = ag; } else { aGoals = ag; bGoals = hg; }
              break;
            }
          }
          if (aGoals < 0) {
            let idx = gi * 32 + ati * 8 + bti * 2;
            if (finishedH2H[idx] >= 0) { aGoals = finishedH2H[idx]; bGoals = finishedH2H[idx + 1]; }
            else { idx = gi * 32 + bti * 8 + ati * 2; if (finishedH2H[idx] >= 0) { bGoals = finishedH2H[idx]; aGoals = finishedH2H[idx + 1]; } }
          }
          if (aGoals >= 0) {
            const aH2H = aGoals > bGoals ? pointsForWin : aGoals === bGoals ? pointsForDraw : 0;
            const bH2H = bGoals > aGoals ? pointsForWin : aGoals === bGoals ? pointsForDraw : 0;
            diff = bH2H - aH2H;
            if (diff !== 0) return diff;
            diff = (bGoals - aGoals) - (aGoals - bGoals);
          }
          return diff;
        });

        const thirdSlot = positions[directQualifiers];
        if (thirdSlot !== undefined) {
          const b = gi * maxTeamsPerGroup + thirdSlot;
          thirds.push({
            teamId: tIds[thirdSlot],
            pts: pts[b],
            gd:  gd[b],
            gf:  gf[b],
          });
        }
      }

      thirds.sort((a, b) => {
        for (const criterion of thirdPlaceSelectionCriteria as TiebreakerCriterion[]) {
          let diff = 0;
          if      (criterion === "POINTS")          diff = b.pts - a.pts;
          else if (criterion === "GOAL_DIFFERENCE") diff = b.gd  - a.gd;
          else if (criterion === "GOALS_FOR")       diff = b.gf  - a.gf;
          if (diff !== 0) return diff;
        }
        return 0;
      });

      const qualBase = s * teamCount;
      for (let i = 0; i < Math.min(thirdPlaceAdvanceCount, thirds.length); i++) {
        const ti = teamIndex[thirds[i].teamId];
        if (ti !== undefined) qualBuffer[qualBase + ti] = 1;
      }
    }
  }

  return {
    outcomeBuffer,
    homeGoalBuffer,
    awayGoalBuffer,
    fixtureOrder,
    qualBuffer,
    teamOrder,
    simCount,
  };
}
