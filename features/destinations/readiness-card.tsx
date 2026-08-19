"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <Card className="w-full max-w-xl" role="alert">
        <CardHeader>
          <CardTitle>Destination not found</CardTitle>
          <CardDescription>
            This destination id is missing or unknown. Search again and pick a
            result.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (readiness.isError && readiness.data === undefined) {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Couldn’t load readiness</CardTitle>
          <CardDescription>Try again.</CardDescription>
        </CardHeader>
        <CardFooter>
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
        </CardFooter>
      </Card>
    );
  }

  if (readiness.isFetching && readiness.data === undefined) {
    return (
      <p className="w-full max-w-xl text-sm text-muted-foreground">
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
      : "text-sm text-muted-foreground";

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
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Ready to plan?</CardTitle>
          <Badge variant={tier === "ready" ? "default" : "secondary"}>
            {tier}
          </Badge>
        </div>
        <CardDescription>
          {place_count} places in catalog · score {score}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Enriched</dt>
          <dd>{formatPct(enriched_pct)}</dd>
          <dt className="text-muted-foreground">Indexed</dt>
          <dd>{formatPct(indexed_pct)}</dd>
        </dl>
        {tier !== "ready" && message && atFloor ? (
          <p className={warningClass}>{message}</p>
        ) : null}
        {!atFloor && !preparing && !pollTimedOut ? (
          <p className="text-sm text-muted-foreground">
            This place has few or no cataloged points yet. That’s expected for a
            new search — prepare it to load nearby places. Generate stays off
            until there are at least {PLANNER_PLACE_FLOOR}.
          </p>
        ) : null}
        {preparing ? (
          <p className="text-sm text-muted-foreground">
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
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-1.5">
        {atFloor ? (
          <>
            <Link
              href={`/generate?destination=${encodeURIComponent(id)}`}
              className={cn(buttonVariants())}
            >
              Generate
            </Link>
            <p className="text-xs text-muted-foreground">Compose your trip next.</p>
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
            <p className="text-xs text-muted-foreground">
              Loads nearby places for this destination. No login needed.
            </p>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
