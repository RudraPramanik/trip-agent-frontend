"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlaces } from "@/features/places";
import { matchesCategoryChip } from "@/components/category-art";
import { FeedCard } from "./feed-card";
import type { GeoOrigin } from "./use-geolocation";

const CHIPS = [
  { id: "all", label: "All" },
  { id: "cafe", label: "Cafe" },
  { id: "park", label: "Park" },
  { id: "viewpoint", label: "Viewpoint" },
  { id: "more", label: "More" },
] as const;

function haversineKm(
  a: GeoOrigin,
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

type LiveFeedProps = {
  destinationId: string;
  origin?: GeoOrigin;
};

export function LiveFeed({ destinationId, origin }: LiveFeedProps) {
  const places = usePlaces(destinationId);
  const [chip, setChip] = useState<(typeof CHIPS)[number]["id"]>("all");

  const items = useMemo(() => {
    const rows = places.items.filter((place) =>
      matchesCategoryChip(place.category, chip),
    );
    const mapped = rows.map((place) => ({
      id: place.id,
      name: place.name,
      category: place.category,
      summary: place.summary,
      destinationId: place.destination_id,
      distanceKm: origin
        ? haversineKm(origin, { lat: place.lat, lng: place.lng })
        : undefined,
    }));
    if (origin) {
      mapped.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }
    return mapped;
  }, [chip, origin, places.items]);

  if (places.isNotFound) {
    return (
      <p className="text-sm text-muted-foreground">
        No place catalog for this destination.
      </p>
    );
  }

  if (places.isError) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">Couldn’t load places. Try again.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void places.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (places.isPending && places.data === undefined) {
    return <p className="text-sm text-muted-foreground">Loading places…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((item) => (
          <Badge
            key={item.id}
            variant={chip === item.id ? "default" : "outline"}
            render={
              <button
                type="button"
                onClick={() => {
                  setChip(item.id);
                }}
              />
            }
          >
            {item.label}
          </Badge>
        ))}
      </div>
      {places.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No places in the catalog for this destination.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No places in this category. Try All.
        </p>
      ) : (
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <div key={item.id} className="mb-3">
              <FeedCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
