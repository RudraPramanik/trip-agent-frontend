"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthMe } from "@/features/auth";
import { listTrips, type ListTripsParams } from "@/lib/api/trips";
import { ApiError } from "@/lib/api/errors";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;

export function useTripsList(params?: ListTripsParams) {
  const auth = useAuthMe();
  const page = params?.page ?? DEFAULT_PAGE;
  const size = params?.size ?? DEFAULT_SIZE;
  const authenticated = !auth.isPending && !auth.is_guest;

  const query = useQuery({
    queryKey: ["trips", "list", page, size],
    queryFn: ({ signal }) => listTrips({ page, size }, signal),
    enabled: authenticated,
    retry: 1,
  });

  const error = query.error;
  const isUnauthorized =
    error instanceof ApiError &&
    (error.status === 401 || error.code === "unauthorized");

  return {
    data: query.data,
    items: query.data?.items ?? [],
    isPending: auth.isPending || (authenticated && query.isPending),
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isUnauthorized,
    authenticated,
    isGuest: auth.is_guest,
    authPending: auth.isPending,
    error,
    refetch: query.refetch,
  };
}
