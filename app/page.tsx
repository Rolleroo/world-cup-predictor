import type { TournamentState } from "@/types/tournament";
import { TournamentShell } from "@/components/TournamentShell";
import { mockTournamentState } from "@/lib/mockData";
import { fetchTeams, fetchMatches, fetchStandings } from "@/lib/footballData";
import { mapApiResponse } from "@/lib/mapApiResponse";
import { getCompetitionConfig } from "@/config/competitions";

export const dynamic = "force-dynamic";

async function fetchTournamentState(): Promise<TournamentState> {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    console.warn("No FOOTBALL_DATA_API_KEY — using mock data");
    return mockTournamentState;
  }

  console.log("Fetching live data from football-data.org...");
  try {
    const config = getCompetitionConfig("WC2026");
    const [fdTeams, fdMatches] = await Promise.all([
      fetchTeams(config.apiCompetitionCode, 2026),
      fetchMatches(config.apiCompetitionCode, 2026),
    ]);
    console.log(`Fetched ${fdMatches.length} matches, ${fdTeams.length} teams`);
    // Pass empty standings — mapApiResponse will compute them from match results
    return mapApiResponse(config, fdTeams, fdMatches, []);
  } catch (err) {
    console.error("Live fetch failed, falling back to mock data:", err);
    return mockTournamentState;
  }
}

export default async function Home() {
  const state = await fetchTournamentState();
  return <TournamentShell initialState={state} />;
}
