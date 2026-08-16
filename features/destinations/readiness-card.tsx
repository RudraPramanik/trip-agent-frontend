"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isPrepareRateLimited,
  useDestinationPrepare,
} from "./use-destination-prepare";
import {
  PLANNER_PLACE_FLOOR,
  READINESS_POLL_TIMEOUT_MS,
  useDestinationReadiness,
} from "./use-destination-readiness";

const RATE_LIMIT_DISABLE_MS = 2000;

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

type ReadinessCardProps = {
  destinationId?: string;
};

export function ReadinessCard({ destinationId }: ReadinessCardProps) {
  const id = destinationId?.trim() ?? "";
  const [preparing, setPreparing] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [prepareDisabled, setPrepareDisabled] = useState(false);
  const readiness = useDestinationReadiness(id, { poll: preparing });
  const prepare = useDestinationPrepare(id);

  useEffect(() => {
    setPreparing(false);
    setPollTimedOut(false);
    setPrepareDisabled(false);
  }, [id]);

  useEffect(() => {
    if (
      readiness.data &&
      readiness.data.place_count >= PLANNER_PLACE_FLOOR
    ) {
      setPreparing(false);
      setPollTimedOut(false);
    }
  }, [readiness.data]);

  useEffect(() => {
    if (!preparing) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setPreparing(false);
      setPollTimedOut(true);
    }, READINESS_POLL_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [preparing, id]);

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

  if (readiness.isError && readiness.data === undefined) {
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
  const atFloor = place_count >= PLANNER_PLACE_FLOOR;
  const warningClass =
    tier === "sparse"
      ? "rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
      : "text-sm text-zinc-600 dark:text-zinc-400";

  async function handlePrepare() {
    try {
      const result = await prepare.mutateAsync();
      if (result.status === "ready") {
        setPreparing(false);
        setPollTimedOut(false);
        void readiness.refetch();
        return;
      }
      setPollTimedOut(false);
      setPreparing(true);
    } catch (error) {
      if (isPrepareRateLimited(error)) {
        setPrepareDisabled(true);
        window.setTimeout(() => setPrepareDisabled(false), RATE_LIMIT_DISABLE_MS);
      }
    }
  }

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
      {tier !== "ready" && message && atFloor ? (
        <p className={warningClass}>{message}</p>
      ) : null}
      {!atFloor && !preparing && !pollTimedOut ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This place has few or no cataloged points yet. That’s expected for a
          new search — prepare it to load nearby places. Generate stays off
          until there are at least {PLANNER_PLACE_FLOOR}.
        </p>
      ) : null}
      {preparing ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Preparing this place. Nearby points can take a minute to appear —
          the first empty update is normal.
        </p>
      ) : null}
      {pollTimedOut && !atFloor ? (
        <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          Not enough places yet to generate a trip. Try prepare again, or pick
          another destination. This is not a login problem.
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {atFloor ? (
          <>
            <Link
              href={`/generate?destination=${encodeURIComponent(id)}`}
              className={cn(buttonVariants())}
            >
              Generate
            </Link>
            <p className="text-xs text-zinc-500">Compose your trip next.</p>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => {
                void handlePrepare();
              }}
              disabled={preparing || prepare.isPending || prepareDisabled}
            >
              {preparing || prepare.isPending ? "Preparing…" : "Prepare"}
            </Button>
            <p className="text-xs text-zinc-500">
              Loads nearby places for this destination. No login needed.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
