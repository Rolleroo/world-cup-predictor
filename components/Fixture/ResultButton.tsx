"use client";

import { useState } from "react";
import type { MatchResult } from "@/types/tournament";
import type { DeltaResult } from "@/types/simulation";
import { useTournamentStore } from "@/store/tournamentStore";
import { computeDelta } from "@/engine/delta";
import { HoverPreview } from "./HoverPreview";

interface Props {
  fixtureId: number;
  result: MatchResult;
  label: string;
  focusTeamIds?: number[];
}

export function ResultButton({ fixtureId, result, label, focusTeamIds }: Props) {
  const universe = useTournamentStore((s) => s.universe);
  const state = useTournamentStore((s) => s.state);
  const probabilities = useTournamentStore((s) => s.probabilities);
  const setOverride = useTournamentStore((s) => s.setOverride);
  const clearOverride = useTournamentStore((s) => s.clearOverride);

  const [delta, setDelta] = useState<DeltaResult | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null);

  const isLocked = state?.overrides[String(fixtureId)] === result;
  const isOtherLocked = !!state?.overrides[String(fixtureId)] && !isLocked;

  function handleMouseEnter(e: React.MouseEvent) {
    if (!universe || !state) return;
    const d = computeDelta(universe, state.overrides, fixtureId, result, probabilities);
    setDelta(d);
    setPreviewPos({ x: e.clientX, y: e.clientY });
  }

  function handleMouseLeave() {
    setDelta(null);
    setPreviewPos(null);
  }

  function handleClick() {
    if (isLocked) {
      clearOverride(fixtureId);
    } else {
      setOverride(fixtureId, result);
    }
    setDelta(null);
    setPreviewPos(null);
  }

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        disabled={isOtherLocked}
        className={[
          "px-3 py-1.5 rounded text-sm font-medium transition-all duration-100 border",
          isLocked
            ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
            : isOtherLocked
            ? "bg-neutral-800 border-neutral-700 text-neutral-600 cursor-not-allowed"
            : "bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:border-neutral-500 cursor-pointer",
        ].join(" ")}
      >
        {label}
      </button>

      {delta && previewPos && (
        <HoverPreview
          delta={delta}
          focusTeamIds={focusTeamIds}
          teams={state?.teams ?? {}}
          anchorPos={previewPos}
        />
      )}
    </div>
  );
}
