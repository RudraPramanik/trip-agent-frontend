"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyleUrl } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { TripGeoJson } from "@/types/trip-geojson";

/** MapLibre demo tiles — development only when NEXT_PUBLIC_MAP_STYLE_URL is unset. */
const DEV_OSM_FALLBACK_STYLE = "https://demotiles.maplibre.org/style.json";

const SOURCE_ID = "trip-geojson";
const LINE_LAYER_ID = "trip-lines";
const POINT_LAYER_ID = "trip-points";

type TripMapProps = {
  geojson: TripGeoJson;
  onCollapse: () => void;
  className?: string;
};

function resolveStyleUrl():
  | { style: string; usingDevFallback: boolean }
  | null {
  const configured = getMapStyleUrl();
  if (configured) {
    return { style: configured, usingDevFallback: false };
  }
  if (process.env.NODE_ENV === "development") {
    return { style: DEV_OSM_FALLBACK_STYLE, usingDevFallback: true };
  }
  return null;
}

function collectLngLats(geojson: TripGeoJson): [number, number][] {
  const coords: [number, number][] = [];
  for (const feature of geojson.features) {
    if (feature.geometry.type === "Point") {
      coords.push(feature.geometry.coordinates);
    } else if (feature.geometry.type === "LineString") {
      for (const c of feature.geometry.coordinates) {
        coords.push(c);
      }
    }
  }
  return coords;
}

export function TripMap({ geojson, onCollapse, className }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onCollapseRef = useRef(onCollapse);
  onCollapseRef.current = onCollapse;
  const [usingDevFallback, setUsingDevFallback] = useState(false);

  useEffect(() => {
    const resolved = resolveStyleUrl();
    if (!resolved) {
      onCollapseRef.current();
      return;
    }
    if (!containerRef.current) {
      onCollapseRef.current();
      return;
    }

    setUsingDevFallback(resolved.usingDevFallback);

    let collapsed = false;
    const collapse = () => {
      if (collapsed) {
        return;
      }
      collapsed = true;
      onCollapseRef.current();
    };

    const map = new MapLibreMap({
      container: containerRef.current,
      style: resolved.style,
      center: [0, 20],
      zoom: 1,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const onMapError = () => {
      collapse();
    };
    map.on("error", onMapError);

    map.on("load", () => {
      if (collapsed) {
        return;
      }
      try {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: LINE_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          filter: ["==", ["geometry-type"], "LineString"],
          paint: {
            "line-color": "#2563eb",
            "line-width": 3,
            "line-opacity": 0.85,
          },
        });

        map.addLayer({
          id: POINT_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 7,
            "circle-color": "#0f766e",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        const coords = collectLngLats(geojson);
        if (coords.length === 1) {
          map.jumpTo({ center: coords[0], zoom: 12 });
        } else if (coords.length > 1) {
          const bounds = new LngLatBounds(coords[0], coords[0]);
          for (const c of coords) {
            bounds.extend(c);
          }
          map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
        }
      } catch {
        collapse();
      }
    });

    return () => {
      map.off("error", onMapError);
      map.remove();
      mapRef.current = null;
    };
  }, [geojson]);

  return (
    <div className="flex w-full flex-col gap-2">
      {usingDevFallback ? (
        <p className="text-xs text-zinc-500">
          Using a development basemap. Set{" "}
          <code className="font-mono">NEXT_PUBLIC_MAP_STYLE_URL</code> (e.g.
          MapTiler style JSON) for production.
        </p>
      ) : null}
      <div
        ref={containerRef}
        className={cn(
          "h-72 w-full overflow-hidden rounded-2xl border bg-muted",
          className,
        )}
        role="img"
        aria-label="Trip map"
      />
    </div>
  );
}
