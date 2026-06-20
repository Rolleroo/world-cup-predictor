/**
 * Qualification logic test — node test-qualification.mjs
 *
 * Uses real mock data (WC 2026 results as of 19 Jun 2026) and mirrors
 * the exact logic from:
 *   storeProvider.tsx  → builds startingPts/GD/GF + finishedH2H
 *   simulation.ts      → sorts teams using those arrays + H2H tiebreaker
 *   qualification.ts   → picks best 8 third-placed teams
 */

// ─── Mock data (inlined from lib/mockData.ts) ─────────────────────────────────
const GROUPS = {
  A: { teamIds: [1,2,3,4],   fixtureIds: [1001,1002,1003,1004,1005,1006] },
  B: { teamIds: [5,6,7,8],   fixtureIds: [1007,1008,1009,1010,1011,1012] },
  C: { teamIds: [9,10,11,12], fixtureIds: [1013,1014,1015,1016,1017,1018] },
  D: { teamIds: [13,14,15,16], fixtureIds: [1019,1020,1021,1022,1023,1024] },
  E: { teamIds: [17,18,19,20], fixtureIds: [1025,1026,1027,1028,1029,1030] },
  F: { teamIds: [21,22,23,24], fixtureIds: [1031,1032,1033,1034,1035,1036] },
  G: { teamIds: [25,26,27,28], fixtureIds: [1037,1038,1039,1040,1041,1042] },
  H: { teamIds: [29,30,31,32], fixtureIds: [1043,1044,1045,1046,1047,1048] },
  I: { teamIds: [33,34,35,36], fixtureIds: [1049,1050,1051,1052,1053,1054] },
  J: { teamIds: [37,38,39,40], fixtureIds: [1055,1056,1057,1058,1059,1060] },
  K: { teamIds: [41,42,43,44], fixtureIds: [1061,1062,1063,1064,1065,1066] },
  L: { teamIds: [45,46,47,48], fixtureIds: [1067,1068,1069,1070,1071,1072] },
};

const TEAMS = {
  1:"Mexico", 2:"S.Africa", 3:"S.Korea", 4:"Czechia",
  5:"Canada", 6:"Bosnia", 7:"Qatar", 8:"Switzerland",
  9:"Brazil", 10:"Morocco", 11:"Scotland", 12:"Haiti",
  13:"USA", 14:"Paraguay", 15:"Australia", 16:"Türkiye",
  17:"Germany", 18:"Ivory Coast", 19:"Ecuador", 20:"Curaçao",
  21:"Sweden", 22:"Japan", 23:"Netherlands", 24:"Tunisia",
  25:"Belgium", 26:"Egypt", 27:"Iran", 28:"New Zealand",
  29:"Spain", 30:"Cabo Verde", 31:"Saudi Arabia", 32:"Uruguay",
  33:"France", 34:"Senegal", 35:"Norway", 36:"Iraq",
  37:"Argentina", 38:"Algeria", 39:"Austria", 40:"Jordan",
  41:"Colombia", 42:"DR Congo", 43:"Portugal", 44:"Uzbekistan",
  45:"England", 46:"Croatia", 47:"Ghana", 48:"Panama",
};

// F=FINISHED, S=SCHEDULED
const F = (id, h, a, hg, ag) => ({ id, homeTeamId:h, awayTeamId:a, status:"FINISHED", score:{homeGoals:hg,awayGoals:ag}, result: hg>ag?"HOME_WIN":hg<ag?"AWAY_WIN":"DRAW" });
const S = (id, h, a) =>         ({ id, homeTeamId:h, awayTeamId:a, status:"SCHEDULED", score:null, result:null });

const FIXTURES = {
  // Group A — MD1+MD2 finished
  1001:F(1001,1,2,2,0), 1002:F(1002,3,4,2,1), 1003:F(1003,1,3,1,0), 1004:F(1004,4,2,1,1),
  1005:S(1005,1,4),     1006:S(1006,2,3),
  // Group B — MD1+MD2 finished
  1007:F(1007,5,6,1,1), 1008:F(1008,7,8,1,1), 1009:F(1009,5,7,6,0), 1010:F(1010,8,6,4,1),
  1011:S(1011,5,8),     1012:S(1012,6,7),
  // Groups C–L — MD1 only finished
  1013:F(1013,9,10,1,1), 1014:F(1014,11,12,1,0), 1015:S(1015,11,10), 1016:S(1016,9,12),  1017:S(1017,11,9),  1018:S(1018,10,12),
  1019:F(1019,13,14,4,1),1020:F(1020,15,16,2,0), 1021:S(1021,13,15), 1022:S(1022,16,14), 1023:S(1023,16,13), 1024:S(1024,14,15),
  1025:F(1025,17,20,7,1),1026:F(1026,18,19,1,0), 1027:S(1027,17,18), 1028:S(1028,19,20), 1029:S(1029,19,17), 1030:S(1030,20,18),
  1031:F(1031,21,24,5,1),1032:F(1032,23,22,2,2), 1033:S(1033,23,21), 1034:S(1034,22,24), 1035:S(1035,22,21), 1036:S(1036,24,23),
  1037:F(1037,25,26,1,1),1038:F(1038,27,28,2,2), 1039:S(1039,25,27), 1040:S(1040,26,28), 1041:S(1041,25,28), 1042:S(1042,26,27),
  1043:F(1043,29,30,0,0),1044:F(1044,31,32,1,1), 1045:S(1045,29,31), 1046:S(1046,30,32), 1047:S(1047,29,32), 1048:S(1048,30,31),
  1049:F(1049,33,34,3,1),1050:F(1050,35,36,4,1), 1051:S(1051,33,35), 1052:S(1052,34,36), 1053:S(1053,33,36), 1054:S(1054,34,35),
  1055:F(1055,37,38,3,0),1056:F(1056,39,40,3,1), 1057:S(1057,37,39), 1058:S(1058,38,40), 1059:S(1059,37,40), 1060:S(1060,38,39),
  1061:F(1061,43,42,1,1),1062:F(1062,41,44,3,1), 1063:S(1063,43,44), 1064:S(1064,41,42), 1065:S(1065,43,41), 1066:S(1066,42,44),
  1067:F(1067,45,46,4,2),1068:F(1068,47,48,1,0), 1069:S(1069,45,47), 1070:S(1070,48,46), 1071:S(1071,48,45), 1072:S(1072,46,47),
};

const CONFIG = { groupConfig: { pointsForWin:3, pointsForDraw:1, directQualifiers:2,
  tiebreakers:["POINTS","GOAL_DIFFERENCE","GOALS_FOR","HEAD_TO_HEAD_POINTS","HEAD_TO_HEAD_GOAL_DIFFERENCE","HEAD_TO_HEAD_GOALS_FOR","DRAWING_OF_LOTS"],
  thirdPlaceRule:{ advanceCount:8, selectionCriteria:["POINTS","GOAL_DIFFERENCE","GOALS_FOR"] } } };

// ─── Mirrors storeProvider: build startingPts/GD/GF + finishedH2H ─────────────
function buildStartingArrays(groups, fixtures, config) {
  const W = config.groupConfig.pointsForWin;
  const D = config.groupConfig.pointsForDraw;
  const groupOrder = Object.keys(groups);
  const maxSlots = 4;
  const startingPts = new Int32Array(groupOrder.length * maxSlots);
  const startingGd  = new Int32Array(groupOrder.length * maxSlots);
  const startingGf  = new Int32Array(groupOrder.length * maxSlots);
  const finishedH2H = new Int32Array(groupOrder.length * maxSlots * maxSlots * 2).fill(-1);

  for (let gi = 0; gi < groupOrder.length; gi++) {
    const gid   = groupOrder[gi];
    const group = groups[gid];
    const slot  = {};
    group.teamIds.forEach((tid, i) => { slot[tid] = i; });

    for (const fid of group.fixtureIds) {
      const f = fixtures[fid];
      if (!f || f.status !== "FINISHED" || !f.score) continue;
      const hSlot = slot[f.homeTeamId];
      const aSlot = slot[f.awayTeamId];
      if (hSlot === undefined || aSlot === undefined) continue;
      const hBase = gi * maxSlots + hSlot;
      const aBase = gi * maxSlots + aSlot;
      if (f.result === "HOME_WIN")      { startingPts[hBase] += W; }
      else if (f.result === "AWAY_WIN") { startingPts[aBase] += W; }
      else                              { startingPts[hBase] += D; startingPts[aBase] += D; }
      startingGf[hBase] += f.score.homeGoals;
      startingGd[hBase] += f.score.homeGoals - f.score.awayGoals;
      startingGf[aBase] += f.score.awayGoals;
      startingGd[aBase] += f.score.awayGoals - f.score.homeGoals;
      const h2hIdx = gi * 32 + hSlot * 8 + aSlot * 2;
      finishedH2H[h2hIdx]     = f.score.homeGoals;
      finishedH2H[h2hIdx + 1] = f.score.awayGoals;
    }
  }
  return { startingPts, startingGd, startingGf, finishedH2H, groupOrder };
}

// ─── Mirrors simulation.ts sort (with H2H) ────────────────────────────────────
function sortGroup(gi, tIds, pts, gd, gf, finishedH2H, fCols, htIds, atIds, homeGoalBuf, awayGoalBuf, base, config) {
  const W = config.groupConfig.pointsForWin;
  const D = config.groupConfig.pointsForDraw;
  const maxSlots = 4;

  return tIds.map((_, ti) => ti).sort((ati, bti) => {
    const ab = gi * maxSlots + ati;
    const bb = gi * maxSlots + bti;
    for (const t of config.groupConfig.tiebreakers) {
      let diff = 0;
      if (t === "POINTS")          { diff = pts[bb] - pts[ab]; }
      else if (t === "GOAL_DIFFERENCE") { diff = gd[bb] - gd[ab]; }
      else if (t === "GOALS_FOR")  { diff = gf[bb] - gf[ab]; }
      else if (t === "HEAD_TO_HEAD_POINTS" || t === "HEAD_TO_HEAD_GOAL_DIFFERENCE" || t === "HEAD_TO_HEAD_GOALS_FOR") {
        const teamA = tIds[ati]; const teamB = tIds[bti];
        let aGoals = -1, bGoals = -1;
        for (let fi = 0; fi < fCols.length; fi++) {
          const hId = htIds[fi]; const aid = atIds[fi];
          if ((hId===teamA&&aid===teamB)||(hId===teamB&&aid===teamA)) {
            const col=fCols[fi], hg=homeGoalBuf[base+col], ag=awayGoalBuf[base+col];
            if (hId===teamA){aGoals=hg;bGoals=ag;}else{aGoals=ag;bGoals=hg;}
            break;
          }
        }
        if (aGoals < 0) {
          let idx = gi*32 + ati*8 + bti*2;
          if (finishedH2H[idx]>=0){aGoals=finishedH2H[idx];bGoals=finishedH2H[idx+1];}
          else{idx=gi*32+bti*8+ati*2;if(finishedH2H[idx]>=0){bGoals=finishedH2H[idx];aGoals=finishedH2H[idx+1];}}
        }
        if (aGoals >= 0) {
          if (t==="HEAD_TO_HEAD_POINTS") {
            const aH=(aGoals>bGoals?W:aGoals===bGoals?D:0), bH=(bGoals>aGoals?W:aGoals===bGoals?D:0);
            diff = bH - aH;
          } else if (t==="HEAD_TO_HEAD_GOAL_DIFFERENCE") {
            diff = (bGoals-aGoals)-(aGoals-bGoals);
          } else { diff = bGoals - aGoals; }
        }
      }
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

// ─── Test helpers ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function check(desc, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { console.log(`  ✓ ${desc}`); passed++; }
  else    { console.error(`  ✗ ${desc}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`); failed++; }
}

// ─── Build arrays ─────────────────────────────────────────────────────────────
const { startingPts, startingGd, startingGf, finishedH2H, groupOrder } = buildStartingArrays(GROUPS, FIXTURES, CONFIG);
const maxSlots = 4;

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 1: Group A startingPts/GD/GF (MD1+MD2 both finished) ===");
// Mexico: beat S.Africa 2-0, beat S.Korea 1-0 → 6pts, GF3, GA0, GD+3
// S.Korea: beat Czechia 2-1, lost Mexico 0-1  → 3pts, GF2, GA2, GD0
// Czechia: lost S.Korea 1-2, drew S.Africa 1-1 → 1pt, GF2, GA3, GD-1
// S.Africa: lost Mexico 0-2, drew Czechia 1-1  → 1pt, GF1, GA3, GD-2
// groupOrder[0]=A, slots: MEX=0 RSA=1 KOR=2 CZE=3
{
  const gi = 0;
  check("Mexico pts=6",   startingPts[gi*4+0], 6);
  check("S.Africa pts=1", startingPts[gi*4+1], 1);
  check("S.Korea pts=3",  startingPts[gi*4+2], 3);
  check("Czechia pts=1",  startingPts[gi*4+3], 1);
  check("Mexico GD=+3",   startingGd[gi*4+0],  3);
  check("S.Korea GD=0",   startingGd[gi*4+2],  0);
  check("Czechia GD=-1",  startingGd[gi*4+3], -1);
  check("S.Africa GD=-2", startingGd[gi*4+1], -2);
  check("Mexico GF=3",    startingGf[gi*4+0],  3);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 2: Group B startingPts/GD/GF (MD1+MD2 both finished) ===");
// Canada: drew Bosnia 1-1, beat Qatar 6-0    → 4pts, GF7, GA1, GD+6
// Switzerland: drew Qatar 1-1, beat Bosnia 4-1 → 4pts, GF5, GA2, GD+3
// Bosnia: drew Canada 1-1, lost Switzerland 1-4 → 1pt, GF2, GA5, GD-3
// Qatar: drew Switzerland 1-1, lost Canada 0-6  → 1pt, GF1, GA7, GD-6
// slots: CAN=0 BIH=1 QAT=2 SUI=3
{
  const gi = 1;
  check("Canada pts=4",      startingPts[gi*4+0], 4);
  check("Switzerland pts=4", startingPts[gi*4+3], 4);
  check("Bosnia pts=1",      startingPts[gi*4+1], 1);
  check("Qatar pts=1",       startingPts[gi*4+2], 1);
  check("Canada GD=+6",      startingGd[gi*4+0],  6);
  check("Switzerland GD=+3", startingGd[gi*4+3],  3);
  check("Qatar GD=-6",       startingGd[gi*4+2], -6);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 3: finishedH2H array — Group A ===");
// MEX(slot0) 2-0 RSA(slot1) → idx = 0*32 + 0*8 + 1*2 = 2
// KOR(slot2) 2-1 CZE(slot3) → idx = 0*32 + 2*8 + 3*2 = 22
// MEX(slot0) 1-0 KOR(slot2) → idx = 0*32 + 0*8 + 2*2 = 4
// CZE(slot3) 1-1 RSA(slot1) → idx = 0*32 + 3*8 + 1*2 = 26
{
  const gi = 0;
  check("MEX vs RSA: home goals=2", finishedH2H[gi*32 + 0*8 + 1*2],     2);
  check("MEX vs RSA: away goals=0", finishedH2H[gi*32 + 0*8 + 1*2 + 1], 0);
  check("KOR vs CZE: home goals=2", finishedH2H[gi*32 + 2*8 + 3*2],     2);
  check("KOR vs CZE: away goals=1", finishedH2H[gi*32 + 2*8 + 3*2 + 1], 1);
  check("MEX vs KOR: home goals=1", finishedH2H[gi*32 + 0*8 + 2*2],     1);
  check("CZE vs RSA: draw 1-1 hg",  finishedH2H[gi*32 + 3*8 + 1*2],     1);
  check("CZE vs RSA: draw 1-1 ag",  finishedH2H[gi*32 + 3*8 + 1*2 + 1], 1);
  // Fixtures not yet played should be -1
  check("MEX vs CZE not yet played: -1", finishedH2H[gi*32 + 0*8 + 3*2], -1);
  check("RSA vs KOR not yet played: -1", finishedH2H[gi*32 + 1*8 + 2*2], -1);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 4: Group A sort — correct order after MD1+MD2 (no remaining sim needed) ===");
// After MD1+MD2 with no more games: MEX 6pts > KOR 3pts > CZE 1pt GD-1 > RSA 1pt GD-2
// (Czechia above S.Africa on GD, no H2H needed)
{
  const gi = 0;
  const tIds = GROUPS.A.teamIds; // [1,2,3,4] = MEX,RSA,KOR,CZE
  const pts = new Int32Array(startingPts); // copy
  const gd  = new Int32Array(startingGd);
  const gf  = new Int32Array(startingGf);
  // No remaining simulated fixtures for this sub-test
  const positions = sortGroup(gi, tIds, pts, gd, gf, finishedH2H, [], [], [], new Uint8Array(0), new Uint8Array(0), 0, CONFIG);
  const ranked = positions.map(slot => TEAMS[tIds[slot]]);
  console.log("  Ranked:", ranked.join(" > "));
  check("1st: Mexico",   ranked[0], "Mexico");
  check("2nd: S.Korea",  ranked[1], "S.Korea");
  check("3rd: Czechia",  ranked[2], "Czechia");
  check("4th: S.Africa", ranked[3], "S.Africa");
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 5: Group B sort — Canada & Switzerland tied on pts, GD separates ===");
{
  const gi = 1;
  const tIds = GROUPS.B.teamIds; // [5,6,7,8] = CAN,BIH,QAT,SUI
  const pts = new Int32Array(startingPts);
  const gd  = new Int32Array(startingGd);
  const gf  = new Int32Array(startingGf);
  const positions = sortGroup(gi, tIds, pts, gd, gf, finishedH2H, [], [], [], new Uint8Array(0), new Uint8Array(0), 0, CONFIG);
  const ranked = positions.map(slot => TEAMS[tIds[slot]]);
  console.log("  Ranked:", ranked.join(" > "));
  check("1st: Canada (GD+6)",      ranked[0], "Canada");
  check("2nd: Switzerland (GD+3)", ranked[1], "Switzerland");
  check("3rd: Bosnia (GD-3)",      ranked[2], "Bosnia");
  check("4th: Qatar (GD-6)",       ranked[3], "Qatar");
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 6: H2H tiebreaker using finishedH2H — Group A CZE vs RSA ===");
// Czechia and S.Africa are both on 1pt but GD already separates them (CZE -1 > RSA -2).
// Construct a sub-test where we force them equal on Pts+GD+GF and verify H2H kicks in.
// CZE beat RSA in their H2H via fixture 1004: CZE(slot3) 1-1 RSA(slot1) → draw → H2H pts equal
// So in real data H2H doesn't separate them. Test the mechanism with a hypothetical:
// Manually patch pts/gd/gf so CZE and RSA are identical, then verify H2H draw → still equal.
{
  const gi = 0;
  const tIds = GROUPS.A.teamIds;
  const pts = new Int32Array(startingPts);
  const gd  = new Int32Array(startingGd);
  const gf  = new Int32Array(startingGf);
  // Force CZE(slot3) and RSA(slot1) to same pts/gd/gf
  pts[gi*4+3] = 1; gd[gi*4+3] = -1; gf[gi*4+3] = 2;
  pts[gi*4+1] = 1; gd[gi*4+1] = -1; gf[gi*4+1] = 2; // make RSA match CZE
  const positions = sortGroup(gi, tIds, pts, gd, gf, finishedH2H, [], [], [], new Uint8Array(0), new Uint8Array(0), 0, CONFIG);
  const ranked = positions.map(slot => TEAMS[tIds[slot]]);
  console.log("  Ranked (RSA=CZE patched equal):", ranked.join(" > "));
  // CZE vs RSA H2H was a draw (1-1) → H2H pts equal → H2H GD equal → H2H GF equal → lots
  // Sort should still put MEX 1st, KOR 2nd, CZE/RSA 3rd/4th in some order (both equal)
  check("Mexico still 1st",  ranked[0], "Mexico");
  check("S.Korea still 2nd", ranked[1], "S.Korea");
  // CZE and RSA truly equal — verify H2H was consulted (no throw, result is one of the two)
  const bottom2 = new Set(ranked.slice(2));
  check("CZE and RSA fill 3rd+4th", bottom2.has("Czechia") && bottom2.has("S.Africa"), true);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 7: H2H tiebreaker — simulated future fixture decides order ===");
// Construct a scenario: two teams equal on Pts/GD/GF, H2H match is a FUTURE (simulated) fixture.
// Use Group C: Scotland(slot2) vs Morocco(slot1) is future fixture 1015.
// Patch starting arrays so they're equal, provide a simulated H2H goal buffer where SCO beat MAR.
{
  const gi = 2; // Group C
  const tIds = GROUPS.C.teamIds; // [9,10,11,12] = BRA,MAR,SCO,HAI slots 0,1,2,3
  const pts = new Int32Array(groupOrder.length * 4);
  const gd  = new Int32Array(groupOrder.length * 4);
  const gf  = new Int32Array(groupOrder.length * 4);
  // BRA and SCO both on 4pts, GD+1, GF2 (hypothetical)
  pts[gi*4+0]=4; gd[gi*4+0]=1; gf[gi*4+0]=2; // BRA
  pts[gi*4+2]=4; gd[gi*4+2]=1; gf[gi*4+2]=2; // SCO — equal to BRA
  pts[gi*4+1]=1; gd[gi*4+1]=0; gf[gi*4+1]=1; // MAR
  pts[gi*4+3]=0; gd[gi*4+3]=-2;gf[gi*4+3]=0; // HAI

  // Simulated: fixture 1015 is SCO(home=11) vs MAR(away=10) — not the BRA vs SCO matchup.
  // For BRA vs SCO, we need fixture 1017: SCO(home=11) vs BRA(away=9).
  // Simulate: SCO beat BRA 2-1 in fixture 1017 → SCO has H2H advantage over BRA.
  // fixtureOrder for remaining = [1015,1016,1017,1018], columns 0,1,2,3
  const fIds   = [1015,1016,1017,1018];
  const htIds  = [FIXTURES[1015].homeTeamId, FIXTURES[1016].homeTeamId, FIXTURES[1017].homeTeamId, FIXTURES[1018].homeTeamId];
  const atIds  = [FIXTURES[1015].awayTeamId, FIXTURES[1016].awayTeamId, FIXTURES[1017].awayTeamId, FIXTURES[1018].awayTeamId];
  // homeGoalBuf/awayGoalBuf: fixture 1017 (col=2) → SCO(home) 2, BRA(away) 1
  const homeGoalBuf = new Uint8Array([0, 0, 2, 0]); // col2=SCO scores 2
  const awayGoalBuf = new Uint8Array([0, 0, 1, 0]); // col2=BRA scores 1
  const base = 0; // sim index 0

  const positions = sortGroup(gi, tIds, pts, gd, gf, finishedH2H, [0,1,2,3], htIds, atIds, homeGoalBuf, awayGoalBuf, base, CONFIG);
  const ranked = positions.map(slot => TEAMS[tIds[slot]]);
  console.log("  Ranked (SCO beat BRA 2-1 in sim H2H):", ranked.join(" > "));
  check("SCO ranks above BRA via simulated H2H", ranked.indexOf("Scotland") < ranked.indexOf("Brazil"), true);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log("\n=== TEST 8: Full qualification count from mock data starting state ===");
// With only MD1 results for groups C-L, compute current qualification status.
// All teams still have games remaining — this tests the count is always correct (48 teams).
{
  // Build complete standings from finished fixtures only
  const allStandings = {};
  for (const [gid, group] of Object.entries(GROUPS)) {
    const rows = {};
    for (const tid of group.teamIds) {
      rows[tid] = { teamId:tid, groupId:gid, position:0, played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, goalDifference:0, points:0 };
    }
    for (const fid of group.fixtureIds) {
      const f = FIXTURES[fid];
      if (!f || f.status !== "FINISHED") continue;
      const h = rows[f.homeTeamId], a = rows[f.awayTeamId];
      h.played++; a.played++;
      h.goalsFor+=f.score.homeGoals; h.goalsAgainst+=f.score.awayGoals;
      a.goalsFor+=f.score.awayGoals; a.goalsAgainst+=f.score.homeGoals;
      h.goalDifference=h.goalsFor-h.goalsAgainst; a.goalDifference=a.goalsFor-a.goalsAgainst;
      if(f.result==="HOME_WIN"){h.won++;h.points+=3;a.lost++;}
      else if(f.result==="AWAY_WIN"){a.won++;a.points+=3;h.lost++;}
      else{h.drawn++;h.points++;a.drawn++;a.points++;}
    }
    const sorted = Object.values(rows).sort((x,y)=>y.points-x.points||y.goalDifference-x.goalDifference||y.goalsFor-x.goalsFor);
    sorted.forEach((r,i)=>r.position=i+1);
    allStandings[gid] = sorted;
  }

  // Compute qualification
  const { directQualifiers, thirdPlaceRule } = CONFIG.groupConfig;
  const results = []; const thirds = [];
  for (const rows of Object.values(allStandings)) {
    for (const r of rows) {
      if (r.position <= directQualifiers) results.push({ teamId:r.teamId, status:"DIRECT" });
      else if (r.position === directQualifiers+1) thirds.push(r);
      else results.push({ teamId:r.teamId, status:"ELIMINATED" });
    }
  }
  thirds.sort((a,b)=>b.points-a.points||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor);
  thirds.forEach((t,i)=>results.push({ teamId:t.teamId, status: i<thirdPlaceRule.advanceCount?"THIRD_PLACE":"ELIMINATED" }));

  const direct   = results.filter(r=>r.status==="DIRECT").length;
  const third    = results.filter(r=>r.status==="THIRD_PLACE").length;
  const elim     = results.filter(r=>r.status==="ELIMINATED").length;
  console.log(`  Direct:${direct} Third:${third} Eliminated:${elim} Total:${results.length}`);
  check("Total teams = 48",         results.length, 48);
  check("24 direct qualifiers",     direct, 24);
  check("8 third-place qualifiers", third, 8);
  check("16 eliminated",            elim, 16);

  // Spot-check known leaders from real data
  const qualIds = new Set(results.filter(r=>r.status==="DIRECT").map(r=>r.teamId));
  check("Mexico (6pts, 1st in A) qualifies directly", qualIds.has(1), true);
  check("England (3pts, 1st in L) qualifies directly", qualIds.has(45), true);
  check("Germany (3pts, 1st in E) qualifies directly", qualIds.has(17), true);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
