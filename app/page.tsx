import { TournamentShell } from "@/components/TournamentShell";
import { ErrorScreen } from "@/components/ErrorScreen";
import { fetchAllGroupStageEvents, fetchEspnStandings } from "@/lib/espnData";
import { mapEspnResponse } from "@/lib/mapEspnResponse";
import { getCompetitionConfig } from "@/config/competitions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = getCompetitionConfig("WC2026");

  try {
    const [espnEvents, espnGroups] = await Promise.all([
      fetchAllGroupStageEvents(),
      fetchEspnStandings(),
    ]);
    const finishedCount = espnEvents.filter((e) => e.status.type.completed).length;
    console.log(`ESPN: ${espnEvents.length} events (${finishedCount} finished), ${espnGroups.length} groups`);
    const state = mapEspnResponse(config, espnEvents, espnGroups);
    return <TournamentShell initialState={state} />;
  } catch (err) {
    console.error("ESPN fetch failed:", err instanceof Error ? err.stack : String(err));
    const message = err instanceof Error ? err.message : String(err);
    return <ErrorScreen message={message} />;
  }
}
