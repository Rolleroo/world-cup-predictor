import type { TournamentState } from "@/types/tournament";
import { TournamentShell } from "@/components/TournamentShell";
import { mockTournamentState } from "@/lib/mockData";
import { fetchAllGroupStageEvents, fetchEspnStandings } from "@/lib/espnData";
import { mapEspnResponse } from "@/lib/mapEspnResponse";
import { getCompetitionConfig } from "@/config/competitions";

export const dynamic = "force-dynamic";

async function fetchTournamentState(): Promise<TournamentState> {
  console.log("Fetching live data from ESPN...");
  try {
    const config = getCompetitionConfig("WC2026");
    const [espnEvents, espnGroups] = await Promise.all([
      fetchAllGroupStageEvents(),
      fetchEspnStandings(),
    ]);
    const finishedCount = espnEvents.filter((e) => e.status.type.completed).length;
    console.log(`ESPN: ${espnEvents.length} events (${finishedCount} finished), ${espnGroups.length} groups`);
    return mapEspnResponse(config, espnEvents, espnGroups);
  } catch (err) {
    console.error("ESPN fetch failed — falling back to mock data:", err instanceof Error ? err.stack : String(err));
    return mockTournamentState;
  }
}

export default async function Home() {
  const state = await fetchTournamentState();
  return <TournamentShell initialState={state} />;
}
