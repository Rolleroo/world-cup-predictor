// International Elo ratings (approximate, as of June 2026)
// Source: eloratings.net — update before each tournament
export const eloRatings: Record<string, number> = {
  // Group A
  USA: 1860,
  MEX: 1795,
  CAN: 1720,
  // Group B
  ARG: 2050,
  CHI: 1680,
  PER: 1720,
  // Group C
  BRA: 2000,
  COL: 1790,
  PAR: 1660,
  // Group D
  FRA: 2010,
  BEL: 1920,
  WAL: 1690,
  // Group E
  ENG: 1950,
  NED: 1920,
  SEN: 1770,
  // Group F
  POR: 1940,
  TUR: 1790,
  CZE: 1770,
  // Group G
  ESP: 1980,
  SCO: 1730,
  ALB: 1660,
  // Group H
  GER: 1970,
  AUT: 1790,
  SVK: 1730,
  // Group I
  ITA: 1930,
  CRO: 1840,
  ALG: 1710,
  // Group J
  URU: 1850,
  ECU: 1720,
  BOL: 1590,
  // Group K
  JAP: 1820,
  KOR: 1730,
  IRN: 1710,
  AUS: 1680,
  // Group L
  MAR: 1800,
  NGR: 1690,
  EGY: 1660,
  CMR: 1640,
  // Additional teams (placeholders — update with actual qualifiers)
  PAN: 1640,
  CRC: 1660,
  HON: 1580,
  NZL: 1580,
  SAU: 1640,
  IRQ: 1640,
  UZB: 1620,
  JOR: 1600,
  RSA: 1620,
  TUN: 1660,
  CIV: 1680,
  GHA: 1660,
  POL: 1790,
  SRB: 1770,
  SVN: 1720,
  UKR: 1790,
};

export function getEloByTla(tla: string): number {
  return eloRatings[tla.toUpperCase()] ?? 1600;
}
