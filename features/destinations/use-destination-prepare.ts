"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { prepareDestination } from "@/lib/api/destinations";
import { ApiError } from "@/lib/api/errors";

export function isPrepareRateLimited(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 429 || error.code === "rate_limit_exceeded")
  );
}

export function useDestinationPrepare(id: string) {
  const queryClient = useQueryClient();
  const destinationId = id.trim();

  return useMutation({
    mutationFn: () => prepareDestination(destinationId),
    retry: false,
    onSuccess: (data) => {
      if (data.status === "ready") {
        void queryClient.invalidateQueries({
          queryKey: ["destinations", "readiness", destinationId],
        });
      }
    },
  });
}
