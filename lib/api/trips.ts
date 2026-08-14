import { getJson, sendJson, type PaginatedEnvelope } from "@/lib/api/client";
import type { components, paths } from "@/types/generated/api";
import { asTripGeoJson, type TripGeoJson } from "@/types/trip-geojson";

const TRIPS_LIST_PATH = "/api/v1/trips" satisfies keyof paths;
const TRIP_PATH = "/api/v1/trips/{trip_id}" satisfies keyof paths;
const GEOJSON_PATH = "/api/v1/trips/{trip_id}/geojson" satisfies keyof paths;
const CLAIM_PATH = "/api/v1/trips/{trip_id}/claim" satisfies keyof paths;

export type TripOut = components["schemas"]["TripOut"];
export type TripPlaceOut = components["schemas"]["TripPlaceOut"];
export type TripsListPage = PaginatedEnvelope<TripOut>;
export type { TripGeoJson };

export type ListTripsParams = {
  page?: number;
  size?: number;
};

export function listTrips(
  params?: ListTripsParams,
  signal?: AbortSignal,
): Promise<TripsListPage> {
  const search = new URLSearchParams();
  if (params?.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params?.size !== undefined) {
    search.set("size", String(params.size));
  }
  const query = search.toString();
  const path = query ? `${TRIPS_LIST_PATH}?${query}` : TRIPS_LIST_PATH;
  return getJson<TripsListPage>(path, { signal, parse: "paginated" });
}

export function getTrip(
  tripId: string,
  signal?: AbortSignal,
): Promise<TripOut> {
  const path = TRIP_PATH.replace("{trip_id}", encodeURIComponent(tripId));
  return getJson<TripOut>(path, { signal, parse: "api" });
}

export function claimTrip(
  tripId: string,
  signal?: AbortSignal,
): Promise<TripOut> {
  const path = CLAIM_PATH.replace("{trip_id}", encodeURIComponent(tripId));
  return sendJson<TripOut>(path, { method: "POST", signal, parse: "api" });
}

export function deleteTrip(
  tripId: string,
  signal?: AbortSignal,
): Promise<void> {
  const path = TRIP_PATH.replace("{trip_id}", encodeURIComponent(tripId));
  return sendJson<void>(path, { method: "DELETE", signal, parse: "empty" });
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
