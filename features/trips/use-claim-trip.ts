"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimTrip } from "@/lib/api/trips";
import { ApiError } from "@/lib/api/errors";

export type ClaimFailureKind =
  | "unauthorized"
  | "session_mismatch"
  | "already_claimed"
  | "other";

export function classifyClaimError(
  error: unknown,
  options?: { isGuest?: boolean; tripUserId?: string | null },
): ClaimFailureKind {
  if (!(error instanceof ApiError)) {
    return "other";
  }
  if (error.status === 401 || error.code === "unauthorized") {
    return "unauthorized";
  }
  if (error.status === 403 || error.code === "forbidden") {
    if (options?.isGuest) {
      return "session_mismatch";
    }
    return "already_claimed";
  }
  if (error.status === 409) {
    return "already_claimed";
  }
  if (options?.tripUserId) {
    return "already_claimed";
  }
  return "other";
}

export function useClaimTrip(tripId: string) {
  const queryClient = useQueryClient();
  const id = tripId.trim();

  return useMutation({
    mutationFn: () => claimTrip(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trips", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["trips", id] });
      void queryClient.invalidateQueries({
        queryKey: ["trips", id, "geojson"],
      });
    },
  });
}
