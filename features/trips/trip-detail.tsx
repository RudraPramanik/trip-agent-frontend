"use client";

import type { TripOut, TripPlaceOut } from "@/lib/api/trips";
import { Badge } from "@/components/ui/badge";
import { AddStopControl } from "./add-stop-control";
import { ClaimTripButton } from "./claim-trip-button";
import { DayEditControls } from "./day-edit-controls";
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
  const dayCount = Math.max(trip.days, 0);
  const dayNumbers =
    dayCount > 0
      ? Array.from({ length: dayCount }, (_, i) => i + 1)
      : [...byDay.keys()].sort((a, b) => a - b);
  const prefs = preferenceEntries(trip.preferences);

  return (
    <section className="flex w-full flex-col gap-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Itinerary
          </h1>
          <Badge variant="secondary">{trip.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {trip.days} day{trip.days === 1 ? "" : "s"}
        </p>
        {prefs.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {prefs.map(({ key, value }) => (
              <li key={key}>
                <Badge variant="outline">
                  <span className="font-medium">{key}</span>
                  {value ? `: ${value}` : null}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <ClaimTripButton trip={trip} />
          <DeleteTripControl tripId={trip.id} navigateAway />
        </div>
      </header>

      {dayNumbers.length === 0 ? (
        <div className="space-y-3">
          <DayNarrative tripId={trip.id} />
          <p className="text-sm text-muted-foreground">
            No stops on this trip yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {dayNumbers.map((dayNumber) => {
            const dayPlaces = byDay.get(dayNumber) ?? [];
            return (
              <section
                key={dayNumber}
                className="relative space-y-3 border-l-2 border-primary/20 pl-5"
              >
                <span className="absolute top-1.5 -left-[7px] size-3 rounded-full bg-primary" />
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  Day {dayNumber}
                </h2>
                <DayNarrative tripId={trip.id} dayNumber={dayNumber} />
                {dayPlaces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No stops on this day yet.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {dayPlaces.map((place, index) => (
                      <li
                        key={place.id}
                        className="rounded-xl border bg-card p-3 text-sm shadow-sm"
                      >
                        <p className="font-medium">
                          {index + 1}. {place.name?.trim() || "Stop"}
                        </p>
                        {place.suggested_start_time ? (
                          <p className="mt-0.5 text-muted-foreground">
                            {place.suggested_start_time}
                          </p>
                        ) : null}
                        {place.arrival_note ? (
                          <p className="mt-1 text-muted-foreground">
                            {place.arrival_note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
                <DayEditControls
                  trip={trip}
                  dayNumber={dayNumber}
                  places={dayPlaces}
                />
                <AddStopControl trip={trip} dayNumber={dayNumber} />
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
