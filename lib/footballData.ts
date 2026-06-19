const BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";

function headers() {
  return { "X-Auth-Token": API_KEY };
}

async function fdFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`football-data.org ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface FdTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FdScore {
  fullTime: { home: number | null; away: number | null };
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: { id: number };
  awayTeam: { id: number };
  score: FdScore;
}

export interface FdStandingRow {
  position: number;
  team: { id: number };
  points: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FdStandingGroup {
  stage: string;
  type: string;
  group: string | null;
  table: FdStandingRow[];
}

// Resolve competition code — tries the given code, falls back to searching by name
export async function resolveCompetitionCode(code: string): Promise<string> {
  try {
    await fdFetch(`/competitions/${code}`);
    return code;
  } catch {
    const data = await fdFetch<{ competitions: { code: string; name: string }[] }>("/competitions");
    const match = data.competitions.find((c) =>
      c.name.toLowerCase().includes("world cup")
    );
    return match?.code ?? code;
  }
}

export async function fetchTeams(code: string, season: number): Promise<FdTeam[]> {
  const data = await fdFetch<{ teams: FdTeam[] }>(`/competitions/${code}/teams?season=${season}`);
  return data.teams;
}

export async function fetchMatches(code: string, season: number): Promise<FdMatch[]> {
  const data = await fdFetch<{ matches: FdMatch[] }>(
    `/competitions/${code}/matches?season=${season}`
  );
  return data.matches;
}

export async function fetchStandings(code: string, season: number): Promise<FdStandingGroup[]> {
  const data = await fdFetch<{ standings: FdStandingGroup[] }>(
    `/competitions/${code}/standings?season=${season}`
  );
  return data.standings;
}
