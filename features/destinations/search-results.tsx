"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { DestinationOut } from "@/lib/api/destinations";

type SearchResultsProps = {
  enabled: boolean;
  data: DestinationOut[] | undefined;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function SearchResults({
  enabled,
  data,
  isFetching,
  isError,
  onRetry,
}: SearchResultsProps) {
  const router = useRouter();

  if (!enabled) {
    return null;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Couldn’t load destinations. Try again.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (isFetching && data === undefined) {
    return <p className="text-sm text-zinc-500">Searching…</p>;
  }

  if (data !== undefined && data.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No destinations match
      </p>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {data.map((destination) => (
        <li key={destination.id}>
          <button
            type="button"
            className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              router.replace(
                `/?destination=${encodeURIComponent(destination.id)}`,
              );
            }}
          >
            <span className="font-medium">{destination.display_name}</span>
            {destination.country ? (
              <span className="text-xs text-zinc-500">{destination.country}</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
