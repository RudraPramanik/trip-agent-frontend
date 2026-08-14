/** Thin domain narrow of GET /trips/{id}/geojson (frontendGuide §15). Not generated. */

export type TripPointFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name: string | null;
    day: number;
    order: number;
    suggested_start_time: string | null;
    place_id: string;
    trip_place_id: string;
  };
};

export type TripLineFeature = {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  properties: {
    day: number;
    trip_id: string;
  };
};

export type TripGeoJson = {
  type: "FeatureCollection";
  features: Array<TripPointFeature | TripLineFeature>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLngLat(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

/** Narrow raw GeoJSON; drop unusable features. Never invent coordinates. */
export function asTripGeoJson(body: unknown): TripGeoJson | null {
  if (!isRecord(body) || body.type !== "FeatureCollection" || !Array.isArray(body.features)) {
    return null;
  }

  const features: Array<TripPointFeature | TripLineFeature> = [];

  for (const feature of body.features) {
    if (!isRecord(feature) || feature.type !== "Feature" || !isRecord(feature.geometry)) {
      continue;
    }
    const geometry = feature.geometry;
    const properties = isRecord(feature.properties) ? feature.properties : {};

    if (geometry.type === "Point" && isLngLat(geometry.coordinates)) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: geometry.coordinates },
        properties: {
          name: typeof properties.name === "string" ? properties.name : null,
          day: typeof properties.day === "number" ? properties.day : 0,
          order: typeof properties.order === "number" ? properties.order : 0,
          suggested_start_time:
            typeof properties.suggested_start_time === "string"
              ? properties.suggested_start_time
              : null,
          place_id: typeof properties.place_id === "string" ? properties.place_id : "",
          trip_place_id:
            typeof properties.trip_place_id === "string" ? properties.trip_place_id : "",
        },
      });
      continue;
    }

    if (
      geometry.type === "LineString" &&
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length >= 2 &&
      geometry.coordinates.every(isLngLat)
    ) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: geometry.coordinates as [number, number][],
        },
        properties: {
          day: typeof properties.day === "number" ? properties.day : 0,
          trip_id: typeof properties.trip_id === "string" ? properties.trip_id : "",
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}
