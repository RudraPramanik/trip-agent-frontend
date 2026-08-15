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
        <p className="text-zinc-600 dark:text-zinc-400">
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
      <p className="w-full max-w-lg text-sm text-zinc-500">Loading trip…</p>
    );
  }

  if (!trip.data) {
    return null;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {showMap && geojson.data ? (
        <TripMap
          geojson={geojson.data}
          onCollapse={() => {
            setMapCollapsed(true);
          }}
        />
      ) : null}
      <TripDetail trip={trip.data} />
      <section className="flex w-full max-w-2xl flex-col gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Places</h2>
        <PlacesPicker destinationId={trip.data.destination_id} />
      </section>
    </div>
  );
}
