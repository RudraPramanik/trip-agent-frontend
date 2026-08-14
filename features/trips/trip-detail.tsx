"use client";

import type { TripOut, TripPlaceOut } from "@/lib/api/trips";
import { ClaimTripButton } from "./claim-trip-button";
import { DayNarrative } from "./day-narrative";
import { DeleteTripControl } from "./delete-trip-control";

type TripDetailProps = {
  trip: TripOut;
};

function preferenceEntries(
  preferences: TripOut["preferences"],
): { key: string; value: string }[] {
  if (!preferences) {
    return [];
  }
  return Object.entries(preferences).flatMap(([key, value]) => {
    if (value === undefined || value === null) {
      return [];
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return [{ key, value: String(value) }];
    }
    if (Array.isArray(value)) {
      return [{ key, value: value.map(String).join(", ") }];
    }
    return [{ key, value: JSON.stringify(value) }];
  });
}

function groupPlacesByDay(places: TripPlaceOut[]): Map<number, TripPlaceOut[]> {
  const byDay = new Map<number, TripPlaceOut[]>();
  for (const place of places) {
    const list = byDay.get(place.day_number) ?? [];
    list.push(place);
    byDay.set(place.day_number, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.order_in_day - b.order_in_day);
  }
  return byDay;
}

export function TripDetail({ trip }: TripDetailProps) {
  const places = trip.places ?? [];
  const byDay = groupPlacesByDay(places);
  const dayNumbers = [...byDay.keys()].sort((a, b) => a - b);
  const prefs = preferenceEntries(trip.preferences);

  return (
    <section className="flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Trip</h1>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-medium">{trip.status}</dd>
          <dt className="text-zinc-500">Days</dt>
          <dd>{trip.days}</dd>
        </dl>
        {prefs.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {prefs.map(({ key, value }) => (
              <li
                key={key}
                className="rounded-md border px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300"
              >
                <span className="font-medium">{key}</span>
                {value ? `: ${value}` : null}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <ClaimTripButton trip={trip} />
          <DeleteTripControl tripId={trip.id} navigateAway />
        </div>
      </header>

      {places.length === 0 ? (
        <div className="space-y-3">
          <DayNarrative tripId={trip.id} />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No stops on this trip yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {dayNumbers.map((dayNumber) => {
            const dayPlaces = byDay.get(dayNumber) ?? [];
            return (
              <section key={dayNumber} className="space-y-2">
                <h2 className="text-sm font-semibold tracking-tight">
                  Day {dayNumber}
                </h2>
                <DayNarrative tripId={trip.id} dayNumber={dayNumber} />
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {dayPlaces.map((place) => (
                    <li key={place.id} className="pl-1">
                      <span className="font-medium">
                        {place.name?.trim() || "Stop"}
                      </span>
                      {place.suggested_start_time ? (
                        <span className="ml-2 text-zinc-500">
                          {place.suggested_start_time}
                        </span>
                      ) : null}
                      {place.arrival_note ? (
                        <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                          {place.arrival_note}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
