import { getPublicApiUrl } from "@/lib/config";
import { parseErrorResponse } from "@/lib/api/client";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { components, paths } from "@/types/generated/api";

type PlanRequest = components["schemas"]["PlanRequest"];

export const GENERATE_PATH = "/api/v1/planner/generate" satisfies keyof paths;

export type PlannerSseEvent = {
  event: string;
  data: string;
};

export const TERMINAL_SSE_EVENTS = new Set([
  "itinerary_done",
  "error",
  "clarification_needed",
]);

export const PROGRESS_SSE_EVENTS = new Set([
  "preferences_done",
  "phase_changed",
  "tool_started",
  "tool_done",
  "tool_batch_done",
  "validation_done",
]);

export function buildClarificationRawInput(
  original: string,
  answer: string,
): string {
  return `${original}\n${answer}`;
}

export function parseClarificationQuestion(data: string): string {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    if (typeof parsed.question === "string" && parsed.question.trim()) {
      return parsed.question;
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.prompt === "string" && parsed.prompt.trim()) {
      return parsed.prompt;
    }
  } catch {
    // fall through
  }
  return "The planner needs a bit more detail.";
}

type ItineraryDonePayload = {
  trip_id?: unknown;
  days?: Array<{
    day?: number;
    title?: string | null;
    narrative?: string | null;
  }>;
};

export function parseItineraryDone(data: string): {
  tripId: string | null;
  days: ItineraryDonePayload["days"];
} {
  try {
    const parsed = JSON.parse(data) as ItineraryDonePayload;
    const tripId =
      typeof parsed.trip_id === "string" && parsed.trip_id.trim()
        ? parsed.trip_id.trim()
        : null;
    return { tripId, days: parsed.days ?? [] };
  } catch {
    return { tripId: null, days: [] };
  }
}

export function parseStreamError(data: string): string {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.code === "string" && parsed.code.trim()) {
      return parsed.code;
    }
  } catch {
    // fall through
  }
  return "Generation failed";
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function parseSseBlock(block: string): PlannerSseEvent | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0 && event === "message") {
    return null;
  }

  return { event, data: dataLines.join("\n") };
}

/** Pure parser for SSE frame blocks separated by blank lines. */
export function parseSseFrames(input: string): {
  frames: PlannerSseEvent[];
  remainder: string;
} {
  const frames: PlannerSseEvent[] = [];
  const normalized = input.replace(/\r\n/g, "\n");
  let searchStart = 0;

  while (true) {
    const idx = normalized.indexOf("\n\n", searchStart);
    if (idx === -1) {
      return { frames, remainder: normalized.slice(searchStart) };
    }

    const block = normalized.slice(searchStart, idx);
    searchStart = idx + 2;

    const frame = parseSseBlock(block);
    if (frame) {
      frames.push(frame);
    }
  }
}

async function throwPreStreamError(res: Response): Promise<never> {
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch (err) {
    throw new NetworkError(`Non-JSON body (HTTP ${res.status})`, {
      cause: err,
      status: res.status,
    });
  }

  const parsed = parseErrorResponse(body);
  if (parsed) {
    throw new ApiError(parsed.code, parsed.message, res.status, parsed.details);
  }

  throw new NetworkError(`Unexpected error body (HTTP ${res.status})`, {
    status: res.status,
  });
}

export async function* generatePlanner(
  request: PlanRequest,
  signal: AbortSignal,
): AsyncGenerator<PlannerSseEvent> {
  const url = `${getPublicApiUrl()}${GENERATE_PATH}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
    });
  } catch (err) {
    if (isAbortError(err)) {
      throw err;
    }
    throw new NetworkError("Network request failed", { cause: err });
  }

  if (!res.ok) {
    await throwPreStreamError(res);
  }

  if (!res.body) {
    throw new NetworkError("Empty response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const { frames, remainder } = parseSseFrames(buffer);
      buffer = remainder;

      for (const frame of frames) {
        yield frame;
        if (TERMINAL_SSE_EVENTS.has(frame.event)) {
          return;
        }
      }
    }

    if (buffer.trim()) {
      const { frames } = parseSseFrames(`${buffer}\n\n`);
      for (const frame of frames) {
        yield frame;
        if (TERMINAL_SSE_EVENTS.has(frame.event)) {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
