import type { TournamentState } from "@/types/tournament";
import { TournamentShell } from "@/components/TournamentShell";
import { mockTournamentState } from "@/lib/mockData";

export const dynamic = "force-dynamic";

async function fetchTournamentState(): Promise<TournamentState> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/tournament?competition=WC2026&season=2026`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  } catch (err) {
    console.warn("Falling back to mock data:", err);
    return mockTournamentState;
  }
}

export default async function Home() {
  const state = await fetchTournamentState();
  return <TournamentShell initialState={state} />;
}
