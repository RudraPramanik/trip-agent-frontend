"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlacesPicker } from "@/features/places";
import { useAuthMe } from "@/features/auth";
import type { TripOut } from "@/lib/api/trips";
import { toastDayEditError } from "./day-edit-errors";
import { useAddStop } from "./use-add-stop";

const RATE_LIMIT_LOCK_MS = 2000;

type AddStopControlProps = {
  trip: TripOut;
  dayNumber: number;
};

export function AddStopControl({ trip, dayNumber }: AddStopControlProps) {
  const auth = useAuthMe();
  const add = useAddStop(trip.id);
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const busy = add.isPending || locked;

  if (auth.isPending) {
    return null;
  }

  if (auth.is_guest) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        Add stop
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {open ? "Hide places" : "Add stop"}
      </Button>
      {open ? (
        <PlacesPicker
          destinationId={trip.destination_id}
          disabled={busy}
          onSelect={(place) => {
            add.mutate(
              { day: dayNumber, body: { place_id: place.id } },
              {
                onSuccess: () => {
                  toast.success(`Added ${place.name} to day ${dayNumber}`);
                  setOpen(false);
                },
                onError: (error) => {
                  const kind = toastDayEditError(error, { isGuest: auth.is_guest });
                  if (kind === "rate_limited") {
                    setLocked(true);
                    window.setTimeout(() => {
                      setLocked(false);
                    }, RATE_LIMIT_LOCK_MS);
                  }
                },
              },
            );
          }}
        />
      ) : null}
    </div>
  );
}
