"use client";

import type { PlannerSseEvent } from "@/lib/sse/planner";

type ProgressPanelProps = {
  events: PlannerSseEvent[];
  isStreaming: boolean;
};

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

export function ProgressPanel({ events, isStreaming }: ProgressPanelProps) {
  const lines = events
    .map((event) => ({ event, label: describeEvent(event) }))
    .filter((item): item is { event: PlannerSseEvent; label: string } =>
      Boolean(item.label),
    );

  if (lines.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <section
      className="rounded-lg border p-4 text-sm"
      aria-live="polite"
      aria-busy={isStreaming}
    >
      <p className="font-medium">Progress</p>
      {lines.length === 0 ? (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">Starting…</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {lines.map((line, index) => (
            <li key={`${line.event.event}-${index}`} className="text-zinc-700 dark:text-zinc-300">
              {line.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
