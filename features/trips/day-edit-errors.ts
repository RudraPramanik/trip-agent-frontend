"use client";

import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";

export type DayEditFailureKind =
  | "unauthorized"
  | "session_mismatch"
  | "ownership"
  | "duplicate"
  | "validation"
  | "rate_limited"
  | "llm_unavailable"
  | "other";

export function classifyDayEditError(
  error: unknown,
  options?: { isGuest?: boolean },
): DayEditFailureKind {
  if (!(error instanceof ApiError)) {
    return "other";
  }
  if (error.status === 401 || error.code === "unauthorized") {
    return "unauthorized";
  }
  if (error.status === 409) {
    return "duplicate";
  }
  if (error.status === 422 || error.code === "validation_error") {
    return "validation";
  }
  if (error.status === 429 || error.code === "rate_limit_exceeded") {
    return "rate_limited";
  }
  if (error.status === 503 || error.code === "llm_unavailable") {
    return "llm_unavailable";
  }
  if (error.status === 403 || error.code === "forbidden") {
    if (options?.isGuest) {
      return "session_mismatch";
    }
    return "ownership";
  }
  return "other";
}

function detailsText(details: unknown): string {
  if (details == null) {
    return "";
  }
  if (typeof details === "string") {
    return details;
  }
  if (typeof details !== "object") {
    return "";
  }
  const record = details as Record<string, unknown>;
  if (typeof record.msg === "string") {
    return record.msg;
  }
  try {
    return JSON.stringify(details);
  } catch {
    return "";
  }
}

export function toastDayEditError(
  error: unknown,
  options?: { isGuest?: boolean },
): DayEditFailureKind {
  const kind = classifyDayEditError(error, options);
  if (kind === "unauthorized") {
    toast.error("Sign in to edit this trip.");
    return kind;
  }
  if (kind === "session_mismatch") {
    toast.error(
      "This trip belongs to a different session. Logging in will not fix that.",
    );
    return kind;
  }
  if (kind === "ownership") {
    toast.error("You don’t own this trip, so it wasn’t changed.");
    return kind;
  }
  if (kind === "duplicate") {
    toast.error("That place is already on this day.");
    return kind;
  }
  if (kind === "validation") {
    const extra =
      error instanceof ApiError ? detailsText(error.details) : "";
    toast.error(
      extra
        ? `Couldn’t save this edit: ${extra}`
        : "That edit isn’t valid. The itinerary wasn’t changed.",
    );
    return kind;
  }
  if (kind === "rate_limited") {
    toast.error("Too many edits. Wait a moment, then try again.");
    return kind;
  }
  if (kind === "llm_unavailable") {
    toast.error("Reoptimize isn’t available right now. Try again later.");
    return kind;
  }
  toast.error("Couldn’t save this edit. Try again.");
  return kind;
}
