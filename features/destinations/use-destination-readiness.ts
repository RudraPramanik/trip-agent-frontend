"use client";

import { useQuery } from "@tanstack/react-query";
import { getDestinationReadiness } from "@/lib/api/destinations";
import { ApiError } from "@/lib/api/errors";

export function useDestinationReadiness(id: string) {
  const query = useQuery({
    queryKey: ["destinations", "readiness", id],
    queryFn: ({ signal }) => getDestinationReadiness(id, signal),
    enabled: Boolean(id),
    retry: 1,
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
