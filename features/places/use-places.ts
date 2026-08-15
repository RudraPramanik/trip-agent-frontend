"use client";

import { useQuery } from "@tanstack/react-query";
import { listPlaces } from "@/lib/api/places";
import { ApiError } from "@/lib/api/errors";

export function usePlaces(destinationId: string) {
  const id = destinationId.trim();

  const query = useQuery({
    queryKey: ["places", id],
    queryFn: ({ signal }) => listPlaces({ destination_id: id }, signal),
    enabled: Boolean(id),
    retry: 1,
  });

  const error = query.error;
  const isNotFound =
    error instanceof ApiError &&
    (error.status === 404 || error.code === "not_found");

  return {
    data: query.data,
    items: query.data?.items ?? [],
    isPending: query.isPending,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isNotFound,
    error,
    refetch: query.refetch,
    enabled: Boolean(id),
  };
}
