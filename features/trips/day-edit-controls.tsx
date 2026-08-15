"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startGoogleLogin, useAuthMe } from "@/features/auth";
import type { TripOut, TripPlaceOut } from "@/lib/api/trips";
import { toastDayEditError } from "./day-edit-errors";
import { useRemoveStop } from "./use-remove-stop";
import { useReorderStops } from "./use-reorder-stops";
import { useReoptimizeDay } from "./use-reoptimize-day";

const RATE_LIMIT_LOCK_MS = 2000;

type DayEditControlsProps = {
  trip: TripOut;
  dayNumber: number;
  places: TripPlaceOut[];
};

export function DayEditControls({
  trip,
  dayNumber,
  places,
}: DayEditControlsProps) {
  const auth = useAuthMe();
  const reorder = useReorderStops(trip.id);
  const remove = useRemoveStop(trip.id);
  const reoptimize = useReoptimizeDay(trip.id);
  const [locked, setLocked] = useState(false);
  const busy =
    reorder.isPending || remove.isPending || reoptimize.isPending || locked;

  function lockIfRateLimited(kind: ReturnType<typeof toastDayEditError>) {
    if (kind !== "rate_limited") {
      return;
    }
    setLocked(true);
    window.setTimeout(() => {
      setLocked(false);
    }, RATE_LIMIT_LOCK_MS);
  }

  if (auth.isPending) {
    return null;
  }

  if (auth.is_guest) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled>
          Reoptimize day
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={startGoogleLogin}>
          Login to edit
        </Button>
      </div>
    );
  }

  const placeIds = places.map((place) => place.place_id);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || places.length < 2}
        onClick={() => {
          reoptimize.mutate(
            { day: dayNumber },
            {
              onSuccess: () => {
                toast.success(`Reoptimized day ${dayNumber}`);
              },
              onError: (error) => {
                lockIfRateLimited(
                  toastDayEditError(error, { isGuest: auth.is_guest }),
                );
              },
            },
          );
        }}
      >
        {reoptimize.isPending ? "Reoptimizing…" : "Reoptimize day"}
      </Button>
      {places.map((place, index) => (
        <div key={place.id} className="flex flex-wrap items-center gap-1">
          <span className="mr-2 text-xs text-zinc-500">
            {place.name?.trim() || "Stop"}
          </span>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={busy || index === 0}
            onClick={() => {
              const next = [...placeIds];
              const other = next[index - 1];
              const current = next[index];
              if (other === undefined || current === undefined) {
                return;
              }
              next[index - 1] = current;
              next[index] = other;
              reorder.mutate(
                { day: dayNumber, body: { place_ids: next } },
                {
                  onError: (error) => {
                    lockIfRateLimited(
                      toastDayEditError(error, { isGuest: auth.is_guest }),
                    );
                  },
                },
              );
            }}
          >
            Move up
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={busy || index === places.length - 1}
            onClick={() => {
              const next = [...placeIds];
              const other = next[index + 1];
              const current = next[index];
              if (other === undefined || current === undefined) {
                return;
              }
              next[index + 1] = current;
              next[index] = other;
              reorder.mutate(
                { day: dayNumber, body: { place_ids: next } },
                {
                  onError: (error) => {
                    lockIfRateLimited(
                      toastDayEditError(error, { isGuest: auth.is_guest }),
                    );
                  },
                },
              );
            }}
          >
            Move down
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              const ok = window.confirm(
                `Remove ${place.name?.trim() || "this stop"} from day ${dayNumber}?`,
              );
              if (!ok) {
                return;
              }
              remove.mutate(
                { day: dayNumber, placeId: place.place_id },
                {
                  onSuccess: () => {
                    toast.success("Stop removed");
                  },
                  onError: (error) => {
                    lockIfRateLimited(
                      toastDayEditError(error, { isGuest: auth.is_guest }),
                    );
                  },
                },
              );
            }}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
