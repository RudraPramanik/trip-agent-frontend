"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { components } from "@/types/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiHostnameMismatchesPage } from "@/lib/config";
import {
  parseClarificationQuestion,
  parseItineraryDone,
  parseStreamError,
} from "@/lib/sse/planner";
import { useNarrativeStore } from "@/store/narrative";
import { ClarificationForm } from "./clarification-form";
import {
  isDestinationNotReady,
  isGenerateRateLimited,
  usePlannerGenerate,
} from "./use-planner-generate";
import { ProgressPanel } from "./progress-panel";

type PlanRequest = components["schemas"]["PlanRequest"];

const composeSchema = z.object({
  raw_input: z.string().refine((value) => value.trim().length >= 1, {
    message: "Describe your trip",
  }),
  days: z.string().optional(),
  base_lat: z.string().optional(),
  base_lng: z.string().optional(),
  accommodation_label: z.string().optional(),
});

type ComposeValues = z.infer<typeof composeSchema>;

const RATE_LIMIT_DISABLE_MS = 2000;

function emptyToNullNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPlanRequest(
  values: ComposeValues,
  destinationId: string,
): PlanRequest {
  const accommodation = values.accommodation_label?.trim() ?? "";
  return {
    destination_id: destinationId,
    raw_input: values.raw_input.trim(),
    days: emptyToNullNumber(values.days),
    base_lat: emptyToNullNumber(values.base_lat),
    base_lng: emptyToNullNumber(values.base_lng),
    accommodation_label: accommodation === "" ? null : accommodation,
  };
}

type ComposeFormProps = {
  destinationId: string;
};

function ComposeForm({ destinationId }: ComposeFormProps) {
  const router = useRouter();
  const generate = usePlannerGenerate();
  const setNarrative = useNarrativeStore((state) => state.setNarrative);
  const handledTerminalRef = useRef<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [missingTripId, setMissingTripId] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: {
      raw_input: "",
      days: "",
      base_lat: "",
      base_lng: "",
      accommodation_label: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!generate.error || !isGenerateRateLimited(generate.error)) {
      return;
    }
    setRateLimited(true);
    const id = window.setTimeout(() => setRateLimited(false), RATE_LIMIT_DISABLE_MS);
    return () => window.clearTimeout(id);
  }, [generate.error]);

  useEffect(() => {
    const terminal = generate.lastEvent;
    if (!terminal || generate.status !== "done") {
      return;
    }

    const key = `${terminal.event}:${terminal.data}`;
    if (handledTerminalRef.current === key) {
      return;
    }
    handledTerminalRef.current = key;

    if (terminal.event === "itinerary_done") {
      const { tripId, days } = parseItineraryDone(terminal.data);
      if (!tripId) {
        setMissingTripId(true);
        return;
      }

      if (days && days.length > 0) {
        setNarrative(tripId, {
          days: days.map((day, index) => ({
            day: day.day ?? index + 1,
            title: day.title ?? null,
            narrative: day.narrative ?? null,
          })),
        });
      }

      router.push(`/trips/${encodeURIComponent(tripId)}`);
      return;
    }

    if (terminal.event === "error") {
      setStreamError(parseStreamError(terminal.data));
    }
  }, [generate.lastEvent, generate.status, router, setNarrative]);

  const submitDisabled = generate.isStreaming || rateLimited;
  const notReady =
    generate.error && isDestinationNotReady(generate.error)
      ? generate.error
      : null;
  const genericError =
    generate.error && !isDestinationNotReady(generate.error)
      ? generate.error
      : null;

  const clarificationNeeded =
    generate.status === "done" &&
    generate.lastEvent?.event === "clarification_needed";

  const onSubmit = (values: ComposeValues) => {
    setStreamError(null);
    setMissingTripId(false);
    handledTerminalRef.current = null;
    void generate.start(toPlanRequest(values, destinationId));
  };

  const handleClarificationSubmit = (request: PlanRequest) => {
    setStreamError(null);
    setMissingTripId(false);
    handledTerminalRef.current = null;
    void generate.start(request);
  };

  const currentPlanRequest = toPlanRequest(getValues(), destinationId);
  const clarificationQuestion =
    clarificationNeeded && generate.lastEvent
      ? parseClarificationQuestion(generate.lastEvent.data)
      : "";

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      {notReady ? (
        <section
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <p className="font-medium">Not enough places yet</p>
          <p className="mt-1">{notReady.message}</p>
          <p className="mt-1">
            Prepare this place on home, then try generate again. This is not a
            login problem.
          </p>
          <Link
            href={`/?destination=${encodeURIComponent(destinationId)}`}
            className="mt-2 inline-block text-primary underline-offset-4 hover:underline"
          >
            Back to readiness
          </Link>
        </section>
      ) : null}

      {genericError ? (
        <section
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <p className="font-medium">Couldn&apos;t start generate</p>
          <p className="mt-1 text-muted-foreground">{genericError.message}</p>
        </section>
      ) : null}

      {streamError ? (
        <section
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <p className="font-medium">Generation failed</p>
          <p className="mt-1 text-muted-foreground">{streamError}</p>
        </section>
      ) : null}

      {missingTripId ? (
        <section
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <p className="font-medium">No trip id</p>
          <p className="mt-1 text-muted-foreground">
            The planner finished without a trip id. Try generating again.
          </p>
        </section>
      ) : null}

      {generate.isStreaming ? (
        <section className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-sm shadow-sm">
          <p>Generating…</p>
          <Button type="button" size="sm" variant="outline" onClick={generate.cancel}>
            Cancel
          </Button>
        </section>
      ) : null}

      <ProgressPanel
        events={generate.progressEvents}
        isStreaming={generate.isStreaming}
      />

      {clarificationNeeded ? (
        <ClarificationForm
          question={clarificationQuestion}
          originalRawInput={currentPlanRequest.raw_input}
          baseRequest={currentPlanRequest}
          disabled={generate.isStreaming}
          onSubmit={handleClarificationSubmit}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Compose your trip</CardTitle>
          <CardDescription>
            Destination{" "}
            <span className="break-all font-mono text-xs">
              {destinationId}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            method="post"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit(onSubmit)(event);
            }}
            noValidate
          >
            <input type="hidden" name="destination_id" value={destinationId} readOnly />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="raw_input" className="text-sm font-medium">
                What kind of trip?
              </label>
              <Textarea
                id="raw_input"
                rows={5}
                className="min-h-28 text-base"
                placeholder="A few days in the hills, food and walking…"
                disabled={submitDisabled}
                {...register("raw_input")}
              />
              {errors.raw_input ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.raw_input.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="days" className="text-sm font-medium">
                  Days{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="days"
                  type="text"
                  inputMode="numeric"
                  className="h-10"
                  disabled={submitDisabled}
                  {...register("days")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="accommodation_label" className="text-sm font-medium">
                  Stay{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="accommodation_label"
                  type="text"
                  className="h-10"
                  placeholder="Hotel or neighborhood"
                  disabled={submitDisabled}
                  {...register("accommodation_label")}
                />
              </div>
            </div>

            <details className="rounded-xl border bg-muted/30 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">
                Advanced: base coordinates
              </summary>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional map pin for the planner. Leave blank if you are not sure.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="base_lat" className="text-sm font-medium">
                    Base lat
                  </label>
                  <Input
                    id="base_lat"
                    type="text"
                    inputMode="decimal"
                    className="h-10"
                    disabled={submitDisabled}
                    {...register("base_lat")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="base_lng" className="text-sm font-medium">
                    Base lng
                  </label>
                  <Input
                    id="base_lng"
                    type="text"
                    inputMode="decimal"
                    className="h-10"
                    disabled={submitDisabled}
                    {...register("base_lng")}
                  />
                </div>
              </div>
            </details>

            <Button type="submit" className="h-10" disabled={submitDisabled}>
              {generate.isStreaming ? "Generating…" : "Generate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function HostMismatchWarning() {
  const [pageHostname, setPageHostname] = useState<string | undefined>();

  useEffect(() => {
    setPageHostname(window.location.hostname);
  }, []);

  if (!apiHostnameMismatchesPage(pageHostname)) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      <p className="font-medium">App and API hosts differ</p>
      <p className="mt-1">
        {
          "Guest generate cookies may not apply to GET /trips/{id}. Open the app and the API on the same host (localhost with localhost, or 127.0.0.1 with 127.0.0.1). This is not a missing frontend LLM key."
        }
      </p>
    </section>
  );
}

type PlannerComposeProps = {
  destinationId?: string;
};

export function PlannerCompose({ destinationId }: PlannerComposeProps) {
  const id = destinationId?.trim() ?? "";

  if (!id) {
    return (
      <div className="flex w-full max-w-xl flex-col gap-3">
        <HostMismatchWarning />
        <Card>
          <CardHeader>
            <CardTitle>Pick a destination first</CardTitle>
            <CardDescription>
              Search on home and choose a place, then come back to compose.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="text-primary underline-offset-4 hover:underline">
              Back to search
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <HostMismatchWarning />
      <ComposeForm destinationId={id} />
    </div>
  );
}
