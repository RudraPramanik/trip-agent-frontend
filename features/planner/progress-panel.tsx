"use client";

import type { PlannerSseEvent } from "@/lib/sse/planner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ProgressPanelProps = {
  events: PlannerSseEvent[];
  isStreaming: boolean;
};

const STEPS = [
  { key: "preferences", label: "Preferences", match: "preferences_done" },
  { key: "planning", label: "Planning", match: "phase_changed" },
  { key: "places", label: "Places", match: "tool" },
  { key: "check", label: "Check", match: "validation_done" },
] as const;

function describeEvent(event: PlannerSseEvent): string | null {
  try {
    const data = JSON.parse(event.data) as Record<string, unknown>;
    switch (event.event) {
      case "preferences_done":
        return "Preferences understood";
      case "phase_changed":
        return typeof data.phase === "string"
          ? `Phase: ${data.phase}`
          : "Phase changed";
      case "tool_started":
        if (typeof data.label === "string" && data.label.trim()) {
          return data.label;
        }
        if (typeof data.tool === "string") {
          return `Running ${data.tool}…`;
        }
        return "Tool started";
      case "tool_done":
        return typeof data.tool === "string"
          ? `Finished ${data.tool}`
          : "Tool finished";
      case "tool_batch_done":
        return "Batch complete";
      case "validation_done":
        return "Validation complete";
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function stepReached(events: PlannerSseEvent[], match: string): boolean {
  if (match === "tool") {
    return events.some((event) => event.event.startsWith("tool_"));
  }
  return events.some((event) => event.event === match);
}

export function ProgressPanel({ events, isStreaming }: ProgressPanelProps) {
  const lines = events
    .map((event) => ({ event, label: describeEvent(event) }))
    .filter((item): item is { event: PlannerSseEvent; label: string } =>
      Boolean(item.label),
    );

  if (lines.length === 0 && !isStreaming) {
    return null;
  }

  const laterDone =
    stepReached(events, "validation_done") ||
    events.some((event) => event.event === "itinerary_done");

  return (
    <section
      className="rounded-2xl border bg-card p-4 text-sm shadow-sm"
      aria-live="polite"
      aria-busy={isStreaming}
    >
      <p className="font-medium">Progress</p>
      <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((step) => {
          const reached = stepReached(events, step.match) || laterDone;
          const skippedTools =
            step.match === "tool" && laterDone && !stepReached(events, "tool");
          return (
            <li
              key={step.key}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs",
                reached
                  ? "border-primary/30 bg-primary/5 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  reached ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {reached ? <Check className="size-3" /> : null}
              </span>
              <span>
                {step.label}
                {skippedTools ? " (cached)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      {lines.length === 0 ? (
        <p className="mt-3 text-muted-foreground">Starting…</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1 text-muted-foreground">
          {lines.map((line, index) => (
            <li key={`${line.event.event}-${index}`}>{line.label}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
