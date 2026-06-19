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
    forecastProbs,
    lambdaHome,
    lambdaAway,
    lockedOutcomes,
    pointsForWin,
    pointsForDraw,
    tiebreakers,
    directQualifiers,
    thirdPlaceAdvanceCount,
    simCount,
  } = input;

  const fixtureCount = fixtureOrder.length;
  const teamCount    = teamOrder.length;

  const fixtureIndex: Record<number, number> = {};
  for (let i = 0; i < fixtureCount; i++) fixtureIndex[fixtureOrder[i]] = i;
  const teamIndex: Record<number, number> = {};
  for (let i = 0; i < teamCount; i++) teamIndex[teamOrder[i]] = i;

  const groups = Object.keys(groupTeamIds);

  // homeTeamIds / awayTeamIds passed as extra fields (legacy cast)
  const homeTeamIds = (input as SimWorkerInput & { homeTeamIds: number[] }).homeTeamIds;
  const awayTeamIds = (input as SimWorkerInput & { awayTeamIds: number[] }).awayTeamIds;

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

    // 2. Compute group standings (pts + GD + GF from sampled goals)
    pts.fill(0);
    gd.fill(0);
    gf.fill(0);

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
          if      (t === "POINTS")          diff = pts[bb] - pts[ab];
          else if (t === "GOAL_DIFFERENCE") diff = gd[bb]  - gd[ab];
          else if (t === "GOALS_FOR")       diff = gf[bb]  - gf[ab];
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
        const g    = groups[gi];
        const tIds = groupTeamIds[g];

        const positions = tIds.map((_, ti) => ti).sort((ati, bti) => {
          const ab = gi * maxTeamsPerGroup + ati;
          const bb = gi * maxTeamsPerGroup + bti;
          let diff = pts[bb] - pts[ab];
          if (diff !== 0) return diff;
          diff = gd[bb] - gd[ab];
          if (diff !== 0) return diff;
          return gf[bb] - gf[ab];
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

      // FIFA: rank thirds by pts → GD → GF → FIFA ranking (approx by order here)
      thirds.sort((a, b) => {
        let diff = b.pts - a.pts;
        if (diff !== 0) return diff;
        diff = b.gd - a.gd;
        if (diff !== 0) return diff;
        return b.gf - a.gf;
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
