import type { TournamentState, Team, Fixture, Group, GroupStanding } from "@/types/tournament";
import { wc2026 } from "@/config/competitions/wc2026";

// ─── Teams ────────────────────────────────────────────────────────────────────
const TEAMS: Record<number, Team> = {
  // Group A
  1:  { id: 1,  name: "Mexico",               shortName: "Mexico",       tla: "MEX", crest: "", eloRating: 1820, groupId: "A" },
  2:  { id: 2,  name: "South Africa",          shortName: "S. Africa",    tla: "RSA", crest: "", eloRating: 1650, groupId: "A" },
  3:  { id: 3,  name: "South Korea",           shortName: "S. Korea",     tla: "KOR", crest: "", eloRating: 1780, groupId: "A" },
  4:  { id: 4,  name: "Czechia",               shortName: "Czechia",      tla: "CZE", crest: "", eloRating: 1760, groupId: "A" },
  // Group B
  5:  { id: 5,  name: "Canada",                shortName: "Canada",       tla: "CAN", crest: "", eloRating: 1770, groupId: "B" },
  6:  { id: 6,  name: "Bosnia & Herz.",        shortName: "Bosnia",       tla: "BIH", crest: "", eloRating: 1700, groupId: "B" },
  7:  { id: 7,  name: "Qatar",                 shortName: "Qatar",        tla: "QAT", crest: "", eloRating: 1590, groupId: "B" },
  8:  { id: 8,  name: "Switzerland",           shortName: "Switzerland",  tla: "SUI", crest: "", eloRating: 1820, groupId: "B" },
  // Group C
  9:  { id: 9,  name: "Brazil",                shortName: "Brazil",       tla: "BRA", crest: "", eloRating: 2010, groupId: "C" },
  10: { id: 10, name: "Morocco",               shortName: "Morocco",      tla: "MAR", crest: "", eloRating: 1800, groupId: "C" },
  11: { id: 11, name: "Scotland",              shortName: "Scotland",     tla: "SCO", crest: "", eloRating: 1800, groupId: "C" },
  12: { id: 12, name: "Haiti",                 shortName: "Haiti",        tla: "HAI", crest: "", eloRating: 1530, groupId: "C" },
  // Group D
  13: { id: 13, name: "United States",         shortName: "USA",          tla: "USA", crest: "", eloRating: 1820, groupId: "D" },
  14: { id: 14, name: "Paraguay",              shortName: "Paraguay",     tla: "PAR", crest: "", eloRating: 1700, groupId: "D" },
  15: { id: 15, name: "Australia",             shortName: "Australia",    tla: "AUS", crest: "", eloRating: 1770, groupId: "D" },
  16: { id: 16, name: "Türkiye",               shortName: "Türkiye",      tla: "TUR", crest: "", eloRating: 1760, groupId: "D" },
  // Group E
  17: { id: 17, name: "Germany",               shortName: "Germany",      tla: "GER", crest: "", eloRating: 1980, groupId: "E" },
  18: { id: 18, name: "Ivory Coast",           shortName: "Ivory Coast",  tla: "CIV", crest: "", eloRating: 1750, groupId: "E" },
  19: { id: 19, name: "Ecuador",               shortName: "Ecuador",      tla: "ECU", crest: "", eloRating: 1730, groupId: "E" },
  20: { id: 20, name: "Curaçao",               shortName: "Curaçao",      tla: "CUW", crest: "", eloRating: 1540, groupId: "E" },
  // Group F
  21: { id: 21, name: "Sweden",                shortName: "Sweden",       tla: "SWE", crest: "", eloRating: 1820, groupId: "F" },
  22: { id: 22, name: "Japan",                 shortName: "Japan",        tla: "JPN", crest: "", eloRating: 1810, groupId: "F" },
  23: { id: 23, name: "Netherlands",           shortName: "Netherlands",  tla: "NED", crest: "", eloRating: 1930, groupId: "F" },
  24: { id: 24, name: "Tunisia",               shortName: "Tunisia",      tla: "TUN", crest: "", eloRating: 1680, groupId: "F" },
  // Group G
  25: { id: 25, name: "Belgium",               shortName: "Belgium",      tla: "BEL", crest: "", eloRating: 1920, groupId: "G" },
  26: { id: 26, name: "Egypt",                 shortName: "Egypt",        tla: "EGY", crest: "", eloRating: 1660, groupId: "G" },
  27: { id: 27, name: "Iran",                  shortName: "Iran",         tla: "IRN", crest: "", eloRating: 1740, groupId: "G" },
  28: { id: 28, name: "New Zealand",           shortName: "New Zealand",  tla: "NZL", crest: "", eloRating: 1640, groupId: "G" },
  // Group H
  29: { id: 29, name: "Spain",                 shortName: "Spain",        tla: "ESP", crest: "", eloRating: 1990, groupId: "H" },
  30: { id: 30, name: "Cabo Verde",            shortName: "Cabo Verde",   tla: "CPV", crest: "", eloRating: 1650, groupId: "H" },
  31: { id: 31, name: "Saudi Arabia",          shortName: "Saudi Arabia", tla: "KSA", crest: "", eloRating: 1660, groupId: "H" },
  32: { id: 32, name: "Uruguay",               shortName: "Uruguay",      tla: "URU", crest: "", eloRating: 1860, groupId: "H" },
  // Group I
  33: { id: 33, name: "France",                shortName: "France",       tla: "FRA", crest: "", eloRating: 2010, groupId: "I" },
  34: { id: 34, name: "Senegal",               shortName: "Senegal",      tla: "SEN", crest: "", eloRating: 1780, groupId: "I" },
  35: { id: 35, name: "Norway",                shortName: "Norway",       tla: "NOR", crest: "", eloRating: 1870, groupId: "I" },
  36: { id: 36, name: "Iraq",                  shortName: "Iraq",         tla: "IRQ", crest: "", eloRating: 1620, groupId: "I" },
  // Group J
  37: { id: 37, name: "Argentina",             shortName: "Argentina",    tla: "ARG", crest: "", eloRating: 2050, groupId: "J" },
  38: { id: 38, name: "Algeria",               shortName: "Algeria",      tla: "ALG", crest: "", eloRating: 1690, groupId: "J" },
  39: { id: 39, name: "Austria",               shortName: "Austria",      tla: "AUT", crest: "", eloRating: 1790, groupId: "J" },
  40: { id: 40, name: "Jordan",                shortName: "Jordan",       tla: "JOR", crest: "", eloRating: 1640, groupId: "J" },
  // Group K
  41: { id: 41, name: "Colombia",              shortName: "Colombia",     tla: "COL", crest: "", eloRating: 1800, groupId: "K" },
  42: { id: 42, name: "DR Congo",              shortName: "DR Congo",     tla: "COD", crest: "", eloRating: 1650, groupId: "K" },
  43: { id: 43, name: "Portugal",              shortName: "Portugal",     tla: "POR", crest: "", eloRating: 1950, groupId: "K" },
  44: { id: 44, name: "Uzbekistan",            shortName: "Uzbekistan",   tla: "UZB", crest: "", eloRating: 1610, groupId: "K" },
  // Group L
  45: { id: 45, name: "England",               shortName: "England",      tla: "ENG", crest: "", eloRating: 2000, groupId: "L" },
  46: { id: 46, name: "Croatia",               shortName: "Croatia",      tla: "CRO", crest: "", eloRating: 1830, groupId: "L" },
  47: { id: 47, name: "Ghana",                 shortName: "Ghana",        tla: "GHA", crest: "", eloRating: 1710, groupId: "L" },
  48: { id: 48, name: "Panama",                shortName: "Panama",       tla: "PAN", crest: "", eloRating: 1620, groupId: "L" },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
// Real 2026 World Cup results as of 19 Jun 2026.
// Groups A & B: MD1 + MD2 complete. Groups C–L: MD1 complete only.
const FIXTURES: Record<number, Fixture> = {
  // ── Group A ──
  1001: { id: 1001, homeTeamId: 1,  awayTeamId: 2,  groupId: "A", matchday: 1, utcDate: "2026-06-11T22:00:00Z", status: "FINISHED",  score: { homeGoals: 2, awayGoals: 0 }, result: "HOME_WIN" },
  1002: { id: 1002, homeTeamId: 3,  awayTeamId: 4,  groupId: "A", matchday: 1, utcDate: "2026-06-11T19:00:00Z", status: "FINISHED",  score: { homeGoals: 2, awayGoals: 1 }, result: "HOME_WIN" },
  1003: { id: 1003, homeTeamId: 1,  awayTeamId: 3,  groupId: "A", matchday: 2, utcDate: "2026-06-18T22:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 0 }, result: "HOME_WIN" },
  1004: { id: 1004, homeTeamId: 4,  awayTeamId: 2,  groupId: "A", matchday: 2, utcDate: "2026-06-18T19:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 1 }, result: "DRAW" },
  1005: { id: 1005, homeTeamId: 1,  awayTeamId: 4,  groupId: "A", matchday: 3, utcDate: "2026-06-24T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1006: { id: 1006, homeTeamId: 2,  awayTeamId: 3,  groupId: "A", matchday: 3, utcDate: "2026-06-24T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group B ──
  1007: { id: 1007, homeTeamId: 5,  awayTeamId: 6,  groupId: "B", matchday: 1, utcDate: "2026-06-12T01:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 1 }, result: "DRAW" },
  1008: { id: 1008, homeTeamId: 7,  awayTeamId: 8,  groupId: "B", matchday: 1, utcDate: "2026-06-13T00:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 1 }, result: "DRAW" },
  1009: { id: 1009, homeTeamId: 5,  awayTeamId: 7,  groupId: "B", matchday: 2, utcDate: "2026-06-18T19:00:00Z", status: "FINISHED",  score: { homeGoals: 6, awayGoals: 0 }, result: "HOME_WIN" },
  1010: { id: 1010, homeTeamId: 8,  awayTeamId: 6,  groupId: "B", matchday: 2, utcDate: "2026-06-18T22:00:00Z", status: "FINISHED",  score: { homeGoals: 4, awayGoals: 1 }, result: "HOME_WIN" },
  1011: { id: 1011, homeTeamId: 5,  awayTeamId: 8,  groupId: "B", matchday: 3, utcDate: "2026-06-24T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1012: { id: 1012, homeTeamId: 6,  awayTeamId: 7,  groupId: "B", matchday: 3, utcDate: "2026-06-24T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group C ──
  1013: { id: 1013, homeTeamId: 9,  awayTeamId: 10, groupId: "C", matchday: 1, utcDate: "2026-06-13T22:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 1 }, result: "DRAW" },
  1014: { id: 1014, homeTeamId: 11, awayTeamId: 12, groupId: "C", matchday: 1, utcDate: "2026-06-13T19:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 0 }, result: "HOME_WIN" },
  1015: { id: 1015, homeTeamId: 11, awayTeamId: 10, groupId: "C", matchday: 2, utcDate: "2026-06-19T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1016: { id: 1016, homeTeamId: 9,  awayTeamId: 12, groupId: "C", matchday: 2, utcDate: "2026-06-19T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1017: { id: 1017, homeTeamId: 11, awayTeamId: 9,  groupId: "C", matchday: 3, utcDate: "2026-06-24T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1018: { id: 1018, homeTeamId: 10, awayTeamId: 12, groupId: "C", matchday: 3, utcDate: "2026-06-24T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group D ──
  1019: { id: 1019, homeTeamId: 13, awayTeamId: 14, groupId: "D", matchday: 1, utcDate: "2026-06-12T22:00:00Z", status: "FINISHED",  score: { homeGoals: 4, awayGoals: 1 }, result: "HOME_WIN" },
  1020: { id: 1020, homeTeamId: 15, awayTeamId: 16, groupId: "D", matchday: 1, utcDate: "2026-06-13T22:00:00Z", status: "FINISHED",  score: { homeGoals: 2, awayGoals: 0 }, result: "HOME_WIN" },
  1021: { id: 1021, homeTeamId: 13, awayTeamId: 15, groupId: "D", matchday: 2, utcDate: "2026-06-19T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1022: { id: 1022, homeTeamId: 16, awayTeamId: 14, groupId: "D", matchday: 2, utcDate: "2026-06-19T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1023: { id: 1023, homeTeamId: 16, awayTeamId: 13, groupId: "D", matchday: 3, utcDate: "2026-06-25T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1024: { id: 1024, homeTeamId: 14, awayTeamId: 15, groupId: "D", matchday: 3, utcDate: "2026-06-25T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group E ──
  1025: { id: 1025, homeTeamId: 17, awayTeamId: 20, groupId: "E", matchday: 1, utcDate: "2026-06-14T19:00:00Z", status: "FINISHED",  score: { homeGoals: 7, awayGoals: 1 }, result: "HOME_WIN" },
  1026: { id: 1026, homeTeamId: 18, awayTeamId: 19, groupId: "E", matchday: 1, utcDate: "2026-06-14T22:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 0 }, result: "HOME_WIN" },
  1027: { id: 1027, homeTeamId: 17, awayTeamId: 18, groupId: "E", matchday: 2, utcDate: "2026-06-20T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1028: { id: 1028, homeTeamId: 19, awayTeamId: 20, groupId: "E", matchday: 2, utcDate: "2026-06-20T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1029: { id: 1029, homeTeamId: 19, awayTeamId: 17, groupId: "E", matchday: 3, utcDate: "2026-06-25T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1030: { id: 1030, homeTeamId: 20, awayTeamId: 18, groupId: "E", matchday: 3, utcDate: "2026-06-25T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group F ──
  1031: { id: 1031, homeTeamId: 21, awayTeamId: 24, groupId: "F", matchday: 1, utcDate: "2026-06-14T19:00:00Z", status: "FINISHED",  score: { homeGoals: 5, awayGoals: 1 }, result: "HOME_WIN" },
  1032: { id: 1032, homeTeamId: 23, awayTeamId: 22, groupId: "F", matchday: 1, utcDate: "2026-06-14T22:00:00Z", status: "FINISHED",  score: { homeGoals: 2, awayGoals: 2 }, result: "DRAW" },
  1033: { id: 1033, homeTeamId: 23, awayTeamId: 21, groupId: "F", matchday: 2, utcDate: "2026-06-20T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1034: { id: 1034, homeTeamId: 22, awayTeamId: 24, groupId: "F", matchday: 2, utcDate: "2026-06-20T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1035: { id: 1035, homeTeamId: 22, awayTeamId: 21, groupId: "F", matchday: 3, utcDate: "2026-06-25T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1036: { id: 1036, homeTeamId: 24, awayTeamId: 23, groupId: "F", matchday: 3, utcDate: "2026-06-25T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group G ──
  1037: { id: 1037, homeTeamId: 25, awayTeamId: 26, groupId: "G", matchday: 1, utcDate: "2026-06-15T19:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 1 }, result: "DRAW" },
  1038: { id: 1038, homeTeamId: 27, awayTeamId: 28, groupId: "G", matchday: 1, utcDate: "2026-06-15T22:00:00Z", status: "FINISHED",  score: { homeGoals: 2, awayGoals: 2 }, result: "DRAW" },
  1039: { id: 1039, homeTeamId: 25, awayTeamId: 27, groupId: "G", matchday: 2, utcDate: "2026-06-21T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1040: { id: 1040, homeTeamId: 26, awayTeamId: 28, groupId: "G", matchday: 2, utcDate: "2026-06-21T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1041: { id: 1041, homeTeamId: 25, awayTeamId: 28, groupId: "G", matchday: 3, utcDate: "2026-06-26T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1042: { id: 1042, homeTeamId: 26, awayTeamId: 27, groupId: "G", matchday: 3, utcDate: "2026-06-26T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group H ──
  1043: { id: 1043, homeTeamId: 29, awayTeamId: 30, groupId: "H", matchday: 1, utcDate: "2026-06-15T19:00:00Z", status: "FINISHED",  score: { homeGoals: 0, awayGoals: 0 }, result: "DRAW" },
  1044: { id: 1044, homeTeamId: 31, awayTeamId: 32, groupId: "H", matchday: 1, utcDate: "2026-06-15T22:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 1 }, result: "DRAW" },
  1045: { id: 1045, homeTeamId: 29, awayTeamId: 31, groupId: "H", matchday: 2, utcDate: "2026-06-21T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1046: { id: 1046, homeTeamId: 30, awayTeamId: 32, groupId: "H", matchday: 2, utcDate: "2026-06-21T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1047: { id: 1047, homeTeamId: 29, awayTeamId: 32, groupId: "H", matchday: 3, utcDate: "2026-06-26T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1048: { id: 1048, homeTeamId: 30, awayTeamId: 31, groupId: "H", matchday: 3, utcDate: "2026-06-26T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group I ──
  1049: { id: 1049, homeTeamId: 33, awayTeamId: 34, groupId: "I", matchday: 1, utcDate: "2026-06-16T22:00:00Z", status: "FINISHED",  score: { homeGoals: 3, awayGoals: 1 }, result: "HOME_WIN" },
  1050: { id: 1050, homeTeamId: 35, awayTeamId: 36, groupId: "I", matchday: 1, utcDate: "2026-06-16T19:00:00Z", status: "FINISHED",  score: { homeGoals: 4, awayGoals: 1 }, result: "HOME_WIN" },
  1051: { id: 1051, homeTeamId: 33, awayTeamId: 35, groupId: "I", matchday: 2, utcDate: "2026-06-22T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1052: { id: 1052, homeTeamId: 34, awayTeamId: 36, groupId: "I", matchday: 2, utcDate: "2026-06-22T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1053: { id: 1053, homeTeamId: 33, awayTeamId: 36, groupId: "I", matchday: 3, utcDate: "2026-06-26T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1054: { id: 1054, homeTeamId: 34, awayTeamId: 35, groupId: "I", matchday: 3, utcDate: "2026-06-26T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group J ──
  1055: { id: 1055, homeTeamId: 37, awayTeamId: 38, groupId: "J", matchday: 1, utcDate: "2026-06-16T22:00:00Z", status: "FINISHED",  score: { homeGoals: 3, awayGoals: 0 }, result: "HOME_WIN" },
  1056: { id: 1056, homeTeamId: 39, awayTeamId: 40, groupId: "J", matchday: 1, utcDate: "2026-06-17T19:00:00Z", status: "FINISHED",  score: { homeGoals: 3, awayGoals: 1 }, result: "HOME_WIN" },
  1057: { id: 1057, homeTeamId: 37, awayTeamId: 39, groupId: "J", matchday: 2, utcDate: "2026-06-22T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1058: { id: 1058, homeTeamId: 38, awayTeamId: 40, groupId: "J", matchday: 2, utcDate: "2026-06-22T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1059: { id: 1059, homeTeamId: 37, awayTeamId: 40, groupId: "J", matchday: 3, utcDate: "2026-06-27T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1060: { id: 1060, homeTeamId: 38, awayTeamId: 39, groupId: "J", matchday: 3, utcDate: "2026-06-27T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group K ──
  1061: { id: 1061, homeTeamId: 43, awayTeamId: 42, groupId: "K", matchday: 1, utcDate: "2026-06-17T19:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 1 }, result: "DRAW" },
  1062: { id: 1062, homeTeamId: 41, awayTeamId: 44, groupId: "K", matchday: 1, utcDate: "2026-06-17T22:00:00Z", status: "FINISHED",  score: { homeGoals: 3, awayGoals: 1 }, result: "HOME_WIN" },
  1063: { id: 1063, homeTeamId: 43, awayTeamId: 44, groupId: "K", matchday: 2, utcDate: "2026-06-23T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1064: { id: 1064, homeTeamId: 41, awayTeamId: 42, groupId: "K", matchday: 2, utcDate: "2026-06-23T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1065: { id: 1065, homeTeamId: 43, awayTeamId: 41, groupId: "K", matchday: 3, utcDate: "2026-06-27T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1066: { id: 1066, homeTeamId: 42, awayTeamId: 44, groupId: "K", matchday: 3, utcDate: "2026-06-27T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  // ── Group L ──
  1067: { id: 1067, homeTeamId: 45, awayTeamId: 46, groupId: "L", matchday: 1, utcDate: "2026-06-17T22:00:00Z", status: "FINISHED",  score: { homeGoals: 4, awayGoals: 2 }, result: "HOME_WIN" },
  1068: { id: 1068, homeTeamId: 47, awayTeamId: 48, groupId: "L", matchday: 1, utcDate: "2026-06-17T19:00:00Z", status: "FINISHED",  score: { homeGoals: 1, awayGoals: 0 }, result: "HOME_WIN" },
  1069: { id: 1069, homeTeamId: 45, awayTeamId: 47, groupId: "L", matchday: 2, utcDate: "2026-06-23T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1070: { id: 1070, homeTeamId: 48, awayTeamId: 46, groupId: "L", matchday: 2, utcDate: "2026-06-23T19:00:00Z", status: "SCHEDULED", score: null, result: null },
  1071: { id: 1071, homeTeamId: 48, awayTeamId: 45, groupId: "L", matchday: 3, utcDate: "2026-06-27T22:00:00Z", status: "SCHEDULED", score: null, result: null },
  1072: { id: 1072, homeTeamId: 46, awayTeamId: 47, groupId: "L", matchday: 3, utcDate: "2026-06-27T22:00:00Z", status: "SCHEDULED", score: null, result: null },
};

// ─── Groups ───────────────────────────────────────────────────────────────────
const GROUPS: Record<string, Group> = {
  A: { id: "A", teamIds: [1,2,3,4],   fixtureIds: [1001,1002,1003,1004,1005,1006] },
  B: { id: "B", teamIds: [5,6,7,8],   fixtureIds: [1007,1008,1009,1010,1011,1012] },
  C: { id: "C", teamIds: [9,10,11,12], fixtureIds: [1013,1014,1015,1016,1017,1018] },
  D: { id: "D", teamIds: [13,14,15,16], fixtureIds: [1019,1020,1021,1022,1023,1024] },
  E: { id: "E", teamIds: [17,18,19,20], fixtureIds: [1025,1026,1027,1028,1029,1030] },
  F: { id: "F", teamIds: [21,22,23,24], fixtureIds: [1031,1032,1033,1034,1035,1036] },
  G: { id: "G", teamIds: [25,26,27,28], fixtureIds: [1037,1038,1039,1040,1041,1042] },
  H: { id: "H", teamIds: [29,30,31,32], fixtureIds: [1043,1044,1045,1046,1047,1048] },
  I: { id: "I", teamIds: [33,34,35,36], fixtureIds: [1049,1050,1051,1052,1053,1054] },
  J: { id: "J", teamIds: [37,38,39,40], fixtureIds: [1055,1056,1057,1058,1059,1060] },
  K: { id: "K", teamIds: [41,42,43,44], fixtureIds: [1061,1062,1063,1064,1065,1066] },
  L: { id: "L", teamIds: [45,46,47,48], fixtureIds: [1067,1068,1069,1070,1071,1072] },
};

// ─── Standings ────────────────────────────────────────────────────────────────
// Groups A & B: post-MD2. Groups C–L: post-MD1.
const STANDINGS: Record<string, GroupStanding[]> = {
  A: [
    { teamId: 1,  groupId: "A", position: 1, played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, goalDifference:  3, points: 6 },
    { teamId: 3,  groupId: "A", position: 2, played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 2, goalDifference:  0, points: 3 },
    { teamId: 4,  groupId: "A", position: 3, played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 2, goalsAgainst: 3, goalDifference: -1, points: 1 },
    { teamId: 2,  groupId: "A", position: 4, played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 1 },
  ],
  B: [
    { teamId: 5,  groupId: "B", position: 1, played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 7, goalsAgainst: 1, goalDifference:  6, points: 4 },
    { teamId: 8,  groupId: "B", position: 2, played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 5, goalsAgainst: 2, goalDifference:  3, points: 4 },
    { teamId: 6,  groupId: "B", position: 3, played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 2, goalsAgainst: 5, goalDifference: -3, points: 1 },
    { teamId: 7,  groupId: "B", position: 4, played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 1, goalsAgainst: 7, goalDifference: -6, points: 1 },
  ],
  C: [
    { teamId: 11, groupId: "C", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, goalDifference:  1, points: 3 },
    { teamId: 9,  groupId: "C", position: 2, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
    { teamId: 10, groupId: "C", position: 3, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
    { teamId: 12, groupId: "C", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
  ],
  D: [
    { teamId: 13, groupId: "D", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 1, goalDifference:  3, points: 3 },
    { teamId: 15, groupId: "D", position: 2, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, goalDifference:  2, points: 3 },
    { teamId: 16, groupId: "D", position: 3, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, goalDifference: -2, points: 0 },
    { teamId: 14, groupId: "D", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 4, goalDifference: -3, points: 0 },
  ],
  E: [
    { teamId: 17, groupId: "E", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 7, goalsAgainst: 1, goalDifference:  6, points: 3 },
    { teamId: 18, groupId: "E", position: 2, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, goalDifference:  1, points: 3 },
    { teamId: 19, groupId: "E", position: 3, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
    { teamId: 20, groupId: "E", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 7, goalDifference: -6, points: 0 },
  ],
  F: [
    { teamId: 21, groupId: "F", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 1, goalDifference:  4, points: 3 },
    { teamId: 22, groupId: "F", position: 2, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 2, goalsAgainst: 2, goalDifference:  0, points: 1 },
    { teamId: 23, groupId: "F", position: 3, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 2, goalsAgainst: 2, goalDifference:  0, points: 1 },
    { teamId: 24, groupId: "F", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 5, goalDifference: -4, points: 0 },
  ],
  G: [
    { teamId: 25, groupId: "G", position: 1, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
    { teamId: 26, groupId: "G", position: 2, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
    { teamId: 27, groupId: "G", position: 3, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 2, goalsAgainst: 2, goalDifference:  0, points: 1 },
    { teamId: 28, groupId: "G", position: 4, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 2, goalsAgainst: 2, goalDifference:  0, points: 1 },
  ],
  H: [
    { teamId: 29, groupId: "H", position: 1, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference:  0, points: 1 },
    { teamId: 30, groupId: "H", position: 2, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference:  0, points: 1 },
    { teamId: 31, groupId: "H", position: 3, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
    { teamId: 32, groupId: "H", position: 4, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
  ],
  I: [
    { teamId: 35, groupId: "I", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 1, goalDifference:  3, points: 3 },
    { teamId: 33, groupId: "I", position: 2, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 1, goalDifference:  2, points: 3 },
    { teamId: 34, groupId: "I", position: 3, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
    { teamId: 36, groupId: "I", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 4, goalDifference: -3, points: 0 },
  ],
  J: [
    { teamId: 37, groupId: "J", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, goalDifference:  3, points: 3 },
    { teamId: 39, groupId: "J", position: 2, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 1, goalDifference:  2, points: 3 },
    { teamId: 40, groupId: "J", position: 3, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
    { teamId: 38, groupId: "J", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, goalDifference: -3, points: 0 },
  ],
  K: [
    { teamId: 41, groupId: "K", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 1, goalDifference:  2, points: 3 },
    { teamId: 42, groupId: "K", position: 2, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
    { teamId: 43, groupId: "K", position: 3, played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference:  0, points: 1 },
    { teamId: 44, groupId: "K", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
  ],
  L: [
    { teamId: 45, groupId: "L", position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 2, goalDifference:  2, points: 3 },
    { teamId: 47, groupId: "L", position: 2, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, goalDifference:  1, points: 3 },
    { teamId: 48, groupId: "L", position: 3, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
    { teamId: 46, groupId: "L", position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, points: 0 },
  ],
};

export const mockTournamentState: TournamentState = {
  config: wc2026,
  teams: TEAMS,
  groups: GROUPS,
  fixtures: FIXTURES,
  standings: STANDINGS,
  overrides: {},
  scoreOverrides: {},
  forecasts: {},
  fetchedAt: new Date().toISOString(),
  dataSource: "mock",
};
