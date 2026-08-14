import { getJson } from "@/lib/api/client";
import type { paths } from "@/types/generated/api";

const HEALTH_PATH = "/api/v1/health" satisfies keyof paths;

/** OpenAPI types health 200 as `unknown`; live body is ApiResponse with status/env/version. */
export type HealthData = {
  status: string;
  env: string;
  version: string;
};

export function getHealth(signal?: AbortSignal): Promise<HealthData> {
  return getJson<HealthData>(HEALTH_PATH, { signal, parse: "api" });
}
