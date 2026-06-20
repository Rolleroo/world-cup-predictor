import type { TournamentState } from "@/types/tournament";
import { TournamentShell } from "@/components/TournamentShell";
import { mockTournamentState } from "@/lib/mockData";
import { fetchTeams, fetchMatches, fetchStandings } from "@/lib/footballData";
import { mapApiResponse } from "@/lib/mapApiResponse";
import { getCompetitionConfig } from "@/config/competitions";

export const dynamic = "force-dynamic";

async function fetchTournamentState(): Promise<TournamentState> {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return mockTournamentState;
  }

  try {
    const config = getCompetitionConfig("WC2026");
    const [fdTeams, fdMatches, fdStandings] = await Promise.all([
      fetchTeams(config.apiCompetitionCode, 2026),
      fetchMatches(config.apiCompetitionCode, 2026),
      fetchStandings(config.apiCompetitionCode, 2026),
    ]);
    return mapApiResponse(config, fdTeams, fdMatches, fdStandings);
  } catch (err) {
    console.warn("Falling back to mock data:", err);
    return mockTournamentState;
  }
}

export default async function Home() {
  const state = await fetchTournamentState();
  return <TournamentShell initialState={state} />;
}
