"use client";

import { useQuery } from "@tanstack/react-query";
import { getDestinationReadiness } from "@/lib/api/destinations";
import { ApiError } from "@/lib/api/errors";

/** Mirrors API default `PLANNER_ABSOLUTE_MIN_PLACES`. 409 remains the authority if the floor drifts. */
export const PLANNER_PLACE_FLOOR = 10;
export const READINESS_POLL_INTERVAL_MS = 2_000;
export const READINESS_POLL_TIMEOUT_MS = 120_000;

type UseDestinationReadinessOptions = {
  poll?: boolean;
};

export function useDestinationReadiness(
  id: string,
  options?: UseDestinationReadinessOptions,
) {
  const poll = options?.poll ?? false;

  const query = useQuery({
    queryKey: ["destinations", "readiness", id],
    queryFn: ({ signal }) => getDestinationReadiness(id, signal),
    enabled: Boolean(id),
    retry: 1,
    refetchInterval: (queryState) => {
      if (!poll) {
        return false;
      }
      if ((queryState.state.data?.place_count ?? 0) >= PLANNER_PLACE_FLOOR) {
        return false;
      }
      return READINESS_POLL_INTERVAL_MS;
    },
  });

  const isNotFound =
    query.error instanceof ApiError && query.error.status === 404;

  return {
    data: query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    isNotFound,
    refetch: query.refetch,
  };
}
