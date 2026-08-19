"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { DestinationOut } from "@/lib/api/destinations";
import { MapPin } from "lucide-react";

type SearchResultsProps = {
  enabled: boolean;
  data: DestinationOut[] | undefined;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Pathname that receives `?destination=` — home `/` or explore `/explore`. */
  resultPath?: string;
};

export function SearchResults({
  enabled,
  data,
  isFetching,
  isError,
  onRetry,
  resultPath = "/",
}: SearchResultsProps) {
  const router = useRouter();

  if (!enabled) {
    return null;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          Couldn’t load destinations. Try again.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (isFetching && data === undefined) {
    return <p className="text-sm text-muted-foreground">Searching…</p>;
  }

  if (data !== undefined && data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No destinations match</p>
    );
  }

  if (!data) {
    return null;
  }

  const path = resultPath.trim() || "/";

  return (
    <ul className="flex flex-col gap-2">
      {data.map((destination) => (
        <li key={destination.id}>
          <button
            type="button"
            className="flex w-full items-start gap-3 rounded-xl border bg-card px-3 py-3 text-left text-sm shadow-sm transition-colors hover:bg-muted/60"
            onClick={() => {
              router.replace(
                `${path}?destination=${encodeURIComponent(destination.id)}`,
              );
            }}
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">{destination.display_name}</span>
              {destination.country ? (
                <span className="text-xs text-muted-foreground">
                  {destination.country}
                </span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
