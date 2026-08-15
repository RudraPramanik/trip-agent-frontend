import { getJson, type PaginatedEnvelope } from "@/lib/api/client";
import type { components, paths } from "@/types/generated/api";

const PLACES_PATH = "/api/v1/places" satisfies keyof paths;

export type PlaceOut = components["schemas"]["PlaceOut"];
export type PlacesListPage = PaginatedEnvelope<PlaceOut>;

export type ListPlacesParams = {
  destination_id: string;
  page?: number;
  size?: number;
};

export function listPlaces(
  params: ListPlacesParams,
  signal?: AbortSignal,
): Promise<PlacesListPage> {
  const search = new URLSearchParams();
  search.set("destination_id", params.destination_id);
  if (params.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params.size !== undefined) {
    search.set("size", String(params.size));
  }
  return getJson<PlacesListPage>(`${PLACES_PATH}?${search.toString()}`, {
    signal,
    parse: "paginated",
  });
}
