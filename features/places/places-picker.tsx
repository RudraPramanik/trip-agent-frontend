"use client";

import { Button } from "@/components/ui/button";
import type { PlaceOut } from "@/lib/api/places";
import { usePlaces } from "./use-places";

type PlacesPickerProps = {
  destinationId: string;
  /** When set, rows are choosable (add-stop). Omit for a read-only catalog. */
  onSelect?: (place: PlaceOut) => void;
  disabled?: boolean;
};

export function PlacesPicker({
  destinationId,
  onSelect,
  disabled = false,
}: PlacesPickerProps) {
  const places = usePlaces(destinationId);

  if (!places.enabled) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No destination on this trip, so the place catalog can’t load.
      </p>
    );
  }

  if (places.isNotFound) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No place catalog for this destination.
      </p>
    );
  }

  if (places.isError) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Couldn’t load places. Try again.
        </p>
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
    return <p className="text-sm text-zinc-500">Loading places…</p>;
  }

  if (places.items.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No places in the catalog for this destination.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {places.items.map((place) => {
        const label = (
          <>
            <span className="font-medium">{place.name}</span>
            {place.category ? (
              <span className="text-xs text-zinc-500">{place.category}</span>
            ) : null}
          </>
        );

        if (onSelect) {
          return (
            <li key={place.id}>
              <button
                type="button"
                disabled={disabled}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                onClick={() => {
                  onSelect(place);
                }}
              >
                {label}
              </button>
            </li>
          );
        }

        return (
          <li
            key={place.id}
            className="flex flex-col gap-0.5 px-3 py-2 text-sm"
          >
            {label}
          </li>
        );
      })}
    </ul>
  );
}
