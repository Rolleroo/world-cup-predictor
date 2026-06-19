import { NextRequest, NextResponse } from "next/server";
import { getCompetitionConfig } from "@/config/competitions";
import { fetchTeams, fetchMatches, fetchStandings } from "@/lib/footballData";
import { mapApiResponse } from "@/lib/mapApiResponse";
import { mockTournamentState } from "@/lib/mockData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitionCode = searchParams.get("competition") ?? "WC2026";
  const season = Number(searchParams.get("season") ?? "2026");

  if (!process.env.FOOTBALL_DATA_API_KEY) {
    // No API key — return mock data for development
    return NextResponse.json(mockTournamentState);
  }

  try {
    const config = getCompetitionConfig(competitionCode);
    const [fdTeams, fdMatches, fdStandings] = await Promise.all([
      fetchTeams(config.apiCompetitionCode, season),
      fetchMatches(config.apiCompetitionCode, season),
      fetchStandings(config.apiCompetitionCode, season),
    ]);
    const state = mapApiResponse(config, fdTeams, fdMatches, fdStandings);
    return NextResponse.json(state);
  } catch (err) {
    console.error("Tournament API error:", err);
    // Graceful fallback to mock data
    return NextResponse.json(mockTournamentState);
  }
}
