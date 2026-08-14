"use client";

import { useQuery } from "@tanstack/react-query";
import { getTripGeojson } from "@/lib/api/trips";

export function useTripGeojson(id: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ["trips", id, "geojson"],
    queryFn: ({ signal }) => getTripGeojson(id, signal),
    enabled: Boolean(id) && enabled,
    retry: 1,
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
