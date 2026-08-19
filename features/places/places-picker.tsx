"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlaceOut } from "@/lib/api/places";
import { usePlaces } from "./use-places";
import { categoryArt } from "@/components/category-art";

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
      <p className="text-sm text-muted-foreground">
        No destination on this trip, so the place catalog can’t load.
      </p>
    );
  }

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

  if (places.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No places in the catalog for this destination.
      </p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {places.items.map((place) => {
        const art = categoryArt(place.category);
        const Icon = art.icon;
        const body = (
          <>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${art.from} ${art.to} text-white`}
              aria-hidden
            >
              <Icon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">{place.name}</span>
              {place.category ? (
                <Badge variant="outline" className="w-fit">
                  {place.category}
                </Badge>
              ) : null}
            </span>
          </>
        );

        if (onSelect) {
          return (
            <li key={place.id}>
              <button
                type="button"
                disabled={disabled}
                className="flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left text-sm shadow-sm hover:bg-muted/60 disabled:opacity-50"
                onClick={() => {
                  onSelect(place);
                }}
              >
                {body}
              </button>
            </li>
          );
        }

        return (
          <li
            key={place.id}
            className="flex items-start gap-3 rounded-xl border bg-card p-3 text-sm shadow-sm"
          >
            {body}
          </li>
        );
      })}
    </ul>
  );
}
