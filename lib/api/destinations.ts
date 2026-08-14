import { getJson } from "@/lib/api/client";
import type { components, paths } from "@/types/generated/api";

const SEARCH_PATH = "/api/v1/destinations/search" satisfies keyof paths;
const READINESS_PATH =
  "/api/v1/destinations/{destination_id}/readiness" satisfies keyof paths;

export type DestinationOut = components["schemas"]["DestinationOut"];
export type DestinationReadinessOut =
  components["schemas"]["DestinationReadinessOut"];

export function searchDestinations(
  q: string,
  signal?: AbortSignal,
): Promise<DestinationOut[]> {
  return getJson<DestinationOut[]>(
    `${SEARCH_PATH}?q=${encodeURIComponent(q)}`,
    { signal, parse: "api" },
  );
}

export function getDestinationReadiness(
  destinationId: string,
  signal?: AbortSignal,
): Promise<DestinationReadinessOut> {
  const path = READINESS_PATH.replace(
    "{destination_id}",
    encodeURIComponent(destinationId),
  );
  return getJson<DestinationReadinessOut>(path, { signal, parse: "api" });
}
