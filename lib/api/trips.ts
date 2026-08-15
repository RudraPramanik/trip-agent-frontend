import { getJson, sendJson, type PaginatedEnvelope } from "@/lib/api/client";
import type { components, paths } from "@/types/generated/api";
import { asTripGeoJson, type TripGeoJson } from "@/types/trip-geojson";

const TRIPS_LIST_PATH = "/api/v1/trips" satisfies keyof paths;
const TRIP_PATH = "/api/v1/trips/{trip_id}" satisfies keyof paths;
const GEOJSON_PATH = "/api/v1/trips/{trip_id}/geojson" satisfies keyof paths;
const CLAIM_PATH = "/api/v1/trips/{trip_id}/claim" satisfies keyof paths;
const REORDER_PATH =
  "/api/v1/trips/{trip_id}/days/{day}/stops/reorder" satisfies keyof paths;
const DAY_STOPS_PATH =
  "/api/v1/trips/{trip_id}/days/{day}/stops" satisfies keyof paths;
const DAY_STOP_PATH =
  "/api/v1/trips/{trip_id}/days/{day}/stops/{place_id}" satisfies keyof paths;
const REOPTIMIZE_PATH =
  "/api/v1/trips/{trip_id}/days/{day}/reoptimize" satisfies keyof paths;

export type TripOut = components["schemas"]["TripOut"];
export type TripPlaceOut = components["schemas"]["TripPlaceOut"];
export type ReorderStopsIn = components["schemas"]["ReorderStopsIn"];
export type AddStopIn = components["schemas"]["AddStopIn"];
export type TripsListPage = PaginatedEnvelope<TripOut>;
export type { TripGeoJson };

function tripDayPath(
  template: string,
  tripId: string,
  day: number,
  placeId?: string,
): string {
  let path = template
    .replace("{trip_id}", encodeURIComponent(tripId))
    .replace("{day}", encodeURIComponent(String(day)));
  if (placeId !== undefined) {
    path = path.replace("{place_id}", encodeURIComponent(placeId));
  }
  return path;
}

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

export function reorderDayStops(
  tripId: string,
  day: number,
  body: ReorderStopsIn,
  signal?: AbortSignal,
): Promise<TripOut> {
  return sendJson<TripOut>(tripDayPath(REORDER_PATH, tripId, day), {
    method: "PATCH",
    body,
    signal,
    parse: "api",
  });
}

export function addDayStop(
  tripId: string,
  day: number,
  body: AddStopIn,
  signal?: AbortSignal,
): Promise<TripOut> {
  return sendJson<TripOut>(tripDayPath(DAY_STOPS_PATH, tripId, day), {
    method: "POST",
    body,
    signal,
    parse: "api",
  });
}

export function removeDayStop(
  tripId: string,
  day: number,
  placeId: string,
  signal?: AbortSignal,
): Promise<TripOut> {
  return sendJson<TripOut>(tripDayPath(DAY_STOP_PATH, tripId, day, placeId), {
    method: "DELETE",
    signal,
    parse: "api",
  });
}

export function reoptimizeDay(
  tripId: string,
  day: number,
  signal?: AbortSignal,
): Promise<TripOut> {
  return sendJson<TripOut>(tripDayPath(REOPTIMIZE_PATH, tripId, day), {
    method: "POST",
    signal,
    parse: "api",
  });
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
