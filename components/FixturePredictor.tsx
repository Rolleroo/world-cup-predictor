"use client";

import React, { useState } from "react";
import type { Fixture, MatchResult } from "@/types/tournament";
import { useTournamentStore } from "@/store/tournamentStore";

interface Props {
  fixture: Fixture;
  focusTeamId: number;
  currentPct: number;
  deltas: Partial<Record<MatchResult, number>>;
}

function outcomeLabel(
  result: MatchResult,
  homeShort: string,
  awayShort: string,
  focusTeamId: number,
  homeTeamId: number,
  awayTeamId: number,
): string {
  const focusHome = focusTeamId === homeTeamId;
  const focusAway = focusTeamId === awayTeamId;
  if (focusHome || focusAway) {
    if (result === "HOME_WIN") return focusHome ? "Win" : "Lose";
    if (result === "AWAY_WIN") return focusAway ? "Win" : "Lose";
    return "Draw";
  }
  if (result === "HOME_WIN") return homeShort;
  if (result === "AWAY_WIN") return awayShort;
  return "Draw";
}

type RGB = [number, number, number];

function lerp(a: RGB, b: RGB, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const C_NEUTRAL_BG:     RGB = [38,  38,  38];   // neutral-800
const C_NEUTRAL_BORDER: RGB = [64,  64,  64];   // neutral-700
const C_NEUTRAL_TEXT:   RGB = [163, 163, 163];  // neutral-400
const C_POS_BG:         RGB = [4,   120, 87];   // emerald-700
const C_POS_BORDER:     RGB = [5,   150, 105];  // emerald-600
const C_POS_TEXT:       RGB = [255, 255, 255];
const C_NEG_BG:         RGB = [127, 29,  29];   // red-900
const C_NEG_BORDER:     RGB = [153, 27,  27];   // red-800
const C_NEG_TEXT:       RGB = [254, 202, 202];  // red-200

const MAX_DIFF = 20; // pp at which colours are fully saturated

function deltaStyle(diff: number, isLocked: boolean, isOtherLocked: boolean): React.CSSProperties {
  if (isLocked) return { backgroundColor: "#059669", borderColor: "#10b981", color: "#fff", cursor: "pointer" };
  if (isOtherLocked) return { backgroundColor: "rgba(38,38,38,0.2)", borderColor: "rgba(64,64,64,0.3)", color: "#525252", cursor: "not-allowed" };
  // Square-root curve: small diffs get visible colour quickly
  const t = Math.sqrt(Math.min(Math.abs(diff) / MAX_DIFF, 1));
  if (diff > 0) return { backgroundColor: lerp(C_NEUTRAL_BG, C_POS_BG, t), borderColor: lerp(C_NEUTRAL_BORDER, C_POS_BORDER, t), color: lerp(C_NEUTRAL_TEXT, C_POS_TEXT, t), cursor: "pointer" };
  if (diff < 0) return { backgroundColor: lerp(C_NEUTRAL_BG, C_NEG_BG, t), borderColor: lerp(C_NEUTRAL_BORDER, C_NEG_BORDER, t), color: lerp(C_NEUTRAL_TEXT, C_NEG_TEXT, t), cursor: "pointer" };
  return { backgroundColor: `rgb(${C_NEUTRAL_BG.join(",")})`, borderColor: `rgb(${C_NEUTRAL_BORDER.join(",")})`, color: `rgb(${C_NEUTRAL_TEXT.join(",")})`, cursor: "pointer" };
}

function scoreToResult(h: number, a: number): MatchResult {
  return h > a ? "HOME_WIN" : h < a ? "AWAY_WIN" : "DRAW";
}

const OUTCOMES: MatchResult[] = ["HOME_WIN", "DRAW", "AWAY_WIN"];

export function FixturePredictor({ fixture, focusTeamId, currentPct, deltas }: Props) {
  const [expanded,  setExpanded]  = useState(false);
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");

  const teams         = useTournamentStore((s) => s.state?.teams);
  const overrides     = useTournamentStore((s) => s.state?.overrides);
  const setOverride   = useTournamentStore((s) => s.setOverride);
  const clearOverride = useTournamentStore((s) => s.clearOverride);

  const home   = teams?.[fixture.homeTeamId];
  const away   = teams?.[fixture.awayTeamId];
  const locked = overrides?.[String(fixture.id)] as MatchResult | undefined;

  const focusInFixture =
    focusTeamId === fixture.homeTeamId || focusTeamId === fixture.awayTeamId;

  const dateStr = new Date(fixture.utcDate).toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });

  function handleScore(h: string, a: string) {
    setHomeGoals(h);
    setAwayGoals(a);
    const hn = parseInt(h, 10);
    const an = parseInt(a, 10);
    if (!isNaN(hn) && !isNaN(an) && h !== "" && a !== "") {
      setOverride(fixture.id, scoreToResult(hn, an), { homeGoals: hn, awayGoals: an });
    }
  }

  function handleResultClick(result: MatchResult) {
    if (locked === result) {
      clearOverride(fixture.id);
      setHomeGoals("");
      setAwayGoals("");
    } else {
      setHomeGoals("");
      setAwayGoals("");
      setOverride(fixture.id, result);
    }
  }

  return (
    <div className={`rounded border transition-colors ${
      locked ? "border-emerald-800/40" : "border-neutral-800"
    }`}>
      {/* Main row */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2.5 py-1.5 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Date + group */}
        <div className="w-[62px] flex-shrink-0">
          <p className="text-xs text-neutral-600 leading-none tabular-nums">{dateStr}</p>
          <p className={`text-xs font-semibold leading-none mt-0.5 ${
            focusInFixture ? "text-emerald-500" : "text-neutral-700"
          }`}>Grp {fixture.groupId}</p>
        </div>

        {/* Teams */}
        <div className="flex-1 min-w-[120px] text-sm leading-none">
          <span className={
            focusTeamId === fixture.homeTeamId ? "text-white font-bold" : "text-neutral-300"
          }>{home?.shortName ?? "?"}</span>
          <span className="text-neutral-700 mx-1 text-xs">v</span>
          <span className={
            focusTeamId === fixture.awayTeamId ? "text-white font-bold" : "text-neutral-300"
          }>{away?.shortName ?? "?"}</span>
        </div>

        {/* Outcome buttons — full width row on mobile */}
        <div
          className="flex gap-1 w-full sm:w-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {OUTCOMES.map((result) => {
            const isLocked      = locked === result;
            const isOtherLocked = !!locked && !isLocked;
            const afterPct      = deltas[result] ?? currentPct;
            const diff          = Math.round((afterPct - currentPct) * 100);
            const label         = outcomeLabel(
              result,
              home?.shortName ?? "?",
              away?.shortName ?? "?",
              focusTeamId,
              fixture.homeTeamId,
              fixture.awayTeamId,
            );

            return (
              <button
                key={result}
                onClick={() => handleResultClick(result)}
                disabled={isOtherLocked}
                className="flex-1 sm:flex-none px-2.5 py-1.5 rounded border text-xs font-medium transition-all"
                style={deltaStyle(diff, isLocked, isOtherLocked)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Expand chevron */}
        <span className="text-neutral-700 text-xs flex-shrink-0 ml-1">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Score inputs */}
      {expanded && (
        <div
          className="px-2.5 pb-2 pt-1.5 border-t border-neutral-800/40 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-neutral-600 flex-shrink-0">Score</span>
          <span className="text-xs text-neutral-500 truncate flex-shrink-0 w-12 text-right">{home?.shortName}</span>
          <input
            type="number" min={0} max={20} value={homeGoals}
            onChange={(e) => handleScore(e.target.value, awayGoals)}
            placeholder="–"
            className="w-9 text-center bg-neutral-800 border border-neutral-700 rounded text-white text-sm py-0.5 focus:outline-none focus:border-neutral-500"
          />
          <span className="text-neutral-600 text-xs">–</span>
          <input
            type="number" min={0} max={20} value={awayGoals}
            onChange={(e) => handleScore(homeGoals, e.target.value)}
            placeholder="–"
            className="w-9 text-center bg-neutral-800 border border-neutral-700 rounded text-white text-sm py-0.5 focus:outline-none focus:border-neutral-500"
          />
          <span className="text-xs text-neutral-500 truncate flex-shrink-0 w-12">{away?.shortName}</span>
          {locked && (
            <button
              onClick={() => { clearOverride(fixture.id); setHomeGoals(""); setAwayGoals(""); }}
              className="ml-auto text-xs text-neutral-600 hover:text-red-400 transition-colors"
            >
              clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
