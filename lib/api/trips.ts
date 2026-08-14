import { getJson } from "@/lib/api/client";
import type { components, paths } from "@/types/generated/api";
import { asTripGeoJson, type TripGeoJson } from "@/types/trip-geojson";

const TRIP_PATH = "/api/v1/trips/{trip_id}" satisfies keyof paths;
const GEOJSON_PATH = "/api/v1/trips/{trip_id}/geojson" satisfies keyof paths;

export type TripOut = components["schemas"]["TripOut"];
export type TripPlaceOut = components["schemas"]["TripPlaceOut"];
export type { TripGeoJson };

export function getTrip(
  tripId: string,
  signal?: AbortSignal,
): Promise<TripOut> {
  const path = TRIP_PATH.replace("{trip_id}", encodeURIComponent(tripId));
  return getJson<TripOut>(path, { signal, parse: "api" });
}

export async function getTripGeojson(
  tripId: string,
  signal?: AbortSignal,
): Promise<TripGeoJson> {
  const path = GEOJSON_PATH.replace("{trip_id}", encodeURIComponent(tripId));
  const body = await getJson<unknown>(path, { signal, parse: "raw" });
  const geojson = asTripGeoJson(body);
  if (!geojson) {
    return { type: "FeatureCollection", features: [] };
  }
  return geojson;
}
