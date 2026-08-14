"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrip } from "@/lib/api/trips";
import { ApiError } from "@/lib/api/errors";

export function useTrip(id: string) {
  const query = useQuery({
    queryKey: ["trips", id],
    queryFn: ({ signal }) => getTrip(id, signal),
    enabled: Boolean(id),
    retry: 1,
  });

  const error = query.error;
  const isNotFound =
    error instanceof ApiError &&
    (error.status === 404 || error.code === "not_found");
  const isForbidden =
    error instanceof ApiError &&
    (error.status === 403 || error.code === "forbidden");

  return {
    data: query.data,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isNotFound,
    isForbidden,
    error,
    refetch: query.refetch,
  };
}
