import type { CompetitionConfig } from "@/types/competition";
import { wc2026 } from "./wc2026";
import { euro2024 } from "./euro2024";

const registry: Record<string, CompetitionConfig> = {
  WC2026: wc2026,
  EURO2024: euro2024,
};

export function getCompetitionConfig(code: string): CompetitionConfig {
  const config = registry[code];
  if (!config) throw new Error(`Unknown competition: ${code}`);
  return config;
}

export { wc2026, euro2024 };
