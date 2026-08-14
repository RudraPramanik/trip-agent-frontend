"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, NetworkError } from "@/lib/api/errors";
import {
  generatePlanner,
  PROGRESS_SSE_EVENTS,
  TERMINAL_SSE_EVENTS,
  type PlannerSseEvent,
} from "@/lib/sse/planner";
import type { components } from "@/types/generated/api";

type PlanRequest = components["schemas"]["PlanRequest"];

export type PlannerGenerateStatus = "idle" | "streaming" | "done" | "error";

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof NetworkError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong";
}

export function isGenerateRateLimited(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 429 || error.code === "rate_limit_exceeded")
  );
}

export function isDestinationNotReady(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    error.code === "destination_not_ready"
  );
}

export function usePlannerGenerate() {
  const queryClient = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<PlannerGenerateStatus>("idle");
  const [error, setError] = useState<ApiError | NetworkError | null>(null);
  const [lastEvent, setLastEvent] = useState<PlannerSseEvent | null>(null);
  const [progressEvents, setProgressEvents] = useState<PlannerSseEvent[]>([]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setError(null);
    setLastEvent(null);
    setProgressEvents([]);
  }, []);

  const start = useCallback(
    async (request: PlanRequest) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      setError(null);
      setLastEvent(null);
      setProgressEvents([]);
      setStatus("streaming");

      void queryClient.invalidateQueries({
        queryKey: ["destinations", "readiness", request.destination_id],
      });

      try {
        for await (const event of generatePlanner(request, controller.signal)) {
          if (controller.signal.aborted) {
            break;
          }

          if (PROGRESS_SSE_EVENTS.has(event.event)) {
            setProgressEvents((current) => [...current, event]);
          }

          setLastEvent(event);

          if (TERMINAL_SSE_EVENTS.has(event.event)) {
            setStatus("done");
            if (controllerRef.current === controller) {
              controllerRef.current = null;
            }
            return;
          }
        }

        if (!controller.signal.aborted) {
          setStatus("done");
        }
      } catch (err) {
        if (isAbortError(err)) {
          setStatus("idle");
          setError(null);
          setLastEvent(null);
          setProgressEvents([]);
          return;
        }

        const mapped =
          err instanceof ApiError || err instanceof NetworkError
            ? err
            : new NetworkError("Generate failed", { cause: err });

        setError(mapped);
        setStatus("error");

        if (isDestinationNotReady(mapped)) {
          return;
        }

        toast.error(errorMessage(mapped));
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [queryClient],
  );

  return {
    status,
    error,
    lastEvent,
    progressEvents,
    start,
    cancel,
    isStreaming: status === "streaming",
  };
}
