"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { matchesCategoryChip } from "@/components/category-art";
import { FeedCard } from "./feed-card";
import { PREVIEW_PLACES } from "./mock-catalog";
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

type PreviewFeedProps = {
  origin: GeoOrigin;
};

export function PreviewFeed({ origin }: PreviewFeedProps) {
  const [chip, setChip] = useState<(typeof CHIPS)[number]["id"]>("all");

  const items = useMemo(() => {
    return PREVIEW_PLACES.filter((place) =>
      matchesCategoryChip(place.category, chip),
    )
      .map((place) => ({
        id: place.id,
        name: place.name,
        category: place.category,
        summary: place.summary,
        preview: true as const,
        distanceKm: haversineKm(origin, place),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [chip, origin]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Preview nearby cards. These are not live catalog places — pick a
        destination above to load the real feed.
      </p>
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
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No preview places in this category. Try All.
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
      <p className="text-xs text-muted-foreground">End of preview</p>
    </div>
  );
}
