"use client";

import { Button } from "@/components/ui/button";
import { useDestinationReadiness } from "./use-destination-readiness";

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

type ReadinessCardProps = {
  destinationId?: string;
};

export function ReadinessCard({ destinationId }: ReadinessCardProps) {
  const id = destinationId?.trim() ?? "";
  const readiness = useDestinationReadiness(id);

  if (!id) {
    return null;
  }

  if (readiness.isNotFound) {
    return (
      <section className="w-full max-w-lg rounded-lg border p-4 text-sm">
        <p className="font-medium">Destination not found</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          This destination id is missing or unknown. Search again and pick a
          result.
        </p>
      </section>
    );
  }

  if (readiness.isError) {
    return (
      <section className="flex w-full max-w-lg flex-col gap-2 text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Couldn’t load readiness. Try again.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void readiness.refetch();
          }}
        >
          Retry
        </Button>
      </section>
    );
  }

  if (readiness.isFetching && readiness.data === undefined) {
    return (
      <p className="w-full max-w-lg text-sm text-zinc-500">
        Checking readiness…
      </p>
    );
  }

  if (!readiness.data) {
    return null;
  }

  const { tier, score, place_count, enriched_pct, indexed_pct, message } =
    readiness.data;
  const warningClass =
    tier === "sparse"
      ? "rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
      : "text-sm text-zinc-600 dark:text-zinc-400";

  return (
    <section className="flex w-full max-w-lg flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold tracking-tight">Readiness</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-zinc-500">Tier</dt>
        <dd className="font-medium">{tier}</dd>
        <dt className="text-zinc-500">Score</dt>
        <dd>{score}</dd>
        <dt className="text-zinc-500">Places</dt>
        <dd>{place_count}</dd>
        <dt className="text-zinc-500">Enriched</dt>
        <dd>{formatPct(enriched_pct)}</dd>
        <dt className="text-zinc-500">Indexed</dt>
        <dd>{formatPct(indexed_pct)}</dd>
      </dl>
      {tier !== "ready" && message ? (
        <p className={warningClass}>{message}</p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Button type="button">Generate</Button>
        <p className="text-xs text-zinc-500">Compose is next (F3).</p>
      </div>
    </section>
  );
}
