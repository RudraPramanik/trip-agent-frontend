"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlacesPicker } from "@/features/places";
import { getMapStyleUrl } from "@/lib/config";
import { useTrip } from "./use-trip";
import { useTripGeojson } from "./use-trip-geojson";
import { TripDetail } from "./trip-detail";
import { TripForbidden } from "./trip-forbidden";
import { TripMap } from "./trip-map";
import { TripNotFound } from "./trip-not-found";

type TripPageProps = {
  tripId: string;
};

export function TripPage({ tripId }: TripPageProps) {
  const id = tripId.trim();
  const trip = useTrip(id);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const geojson = useTripGeojson(id, trip.isSuccess);
  const styleConfigured = Boolean(getMapStyleUrl());
  const styleAvailable =
    styleConfigured || process.env.NODE_ENV === "development";
  const showMap =
    trip.isSuccess &&
    styleAvailable &&
    !mapCollapsed &&
    geojson.isSuccess &&
    (geojson.data?.features.length ?? 0) > 0;

  if (!id) {
    return <TripNotFound />;
  }

  if (trip.isNotFound) {
    return <TripNotFound />;
  }

  if (trip.isForbidden) {
    return <TripForbidden />;
  }

  if (trip.isError) {
    return (
      <section className="flex w-full max-w-lg flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          Couldn’t load this trip. Try again.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void trip.refetch();
          }}
        >
          Retry
        </Button>
      </section>
    );
  }

  if (trip.isPending && trip.data === undefined) {
    return (
      <p className="w-full text-sm text-muted-foreground">Loading trip…</p>
    );
  }

  if (!trip.data) {
    return null;
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
      <div className="order-1 flex min-w-0 flex-col gap-8">
        <TripDetail trip={trip.data} />
        <section className="flex w-full flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Places
          </h2>
          <PlacesPicker destinationId={trip.data.destination_id} />
        </section>
      </div>
      {showMap && geojson.data ? (
        <div className="order-2 min-w-0 lg:sticky lg:top-24">
          <TripMap
            geojson={geojson.data}
            className="h-56 lg:h-[min(70vh,36rem)]"
            onCollapse={() => {
              setMapCollapsed(true);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
