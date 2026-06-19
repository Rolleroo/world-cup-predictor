import { expose } from "comlink";
import { runSimulations } from "@/engine/simulation";
import type { SimWorkerInput, SimulationUniverse } from "@/types/simulation";

const api = {
  runSimulations(input: SimWorkerInput): SimulationUniverse {
    return runSimulations(input);
  },
};

export type SimWorkerApi = typeof api;

expose(api);
