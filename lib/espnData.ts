const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const API_BASE  = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world";

async function espnFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`ESPN ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

export interface EspnTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
}

export interface EspnCompetitor {
  homeAway: "home" | "away";
  score: string;
  winner: boolean;
  team: EspnTeam;
}

export interface EspnEvent {
  id: string;
  date: string;
  status: {
    type: { name: string; completed: boolean };
  };
  competitions: Array<{
    competitors: EspnCompetitor[];
    notes: Array<{ headline: string }>;
  }>;
}

export interface EspnStatEntry {
  name: string;
  value: number;
}

export interface EspnStandingEntry {
  team: EspnTeam;
  stats: EspnStatEntry[];
}

export interface EspnGroup {
  name: string;
  standings: {
    entries: EspnStandingEntry[];
  };
}

export interface EspnStandingsResponse {
  children: EspnGroup[];
}

export interface EspnScoreboardResponse {
  events: EspnEvent[];
}

export async function fetchEspnStandings(): Promise<EspnGroup[]> {
  const data = await espnFetch<EspnStandingsResponse>(`${API_BASE}/standings`);
  return data.children ?? [];
}

export async function fetchEspnScoreboard(dateYYYYMMDD: string): Promise<EspnEvent[]> {
  const data = await espnFetch<EspnScoreboardResponse>(
    `${SITE_BASE}/scoreboard?dates=${dateYYYYMMDD}&limit=50`
  );
  return data.events ?? [];
}

// Fetch all scoreboard events from tournament start up to today
export async function fetchAllGroupStageEvents(): Promise<EspnEvent[]> {
  const start = new Date("2026-06-11");
  const end   = new Date(Math.min(Date.now(), new Date("2026-06-27T23:59:59Z").getTime()));

  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
  }

  const results = await Promise.all(
    dates.map((date) => fetchEspnScoreboard(date).catch(() => [] as EspnEvent[]))
  );
  return results.flat();
}
