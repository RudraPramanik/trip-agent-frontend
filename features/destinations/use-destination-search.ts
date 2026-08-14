"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchDestinations } from "@/lib/api/destinations";
import { ApiError } from "@/lib/api/errors";

const DEBOUNCE_MS = 300;

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function isSearchRateLimited(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 429 || error.code === "rate_limit_exceeded")
  );
}

export function useDestinationSearch(q: string) {
  const debouncedQ = useDebouncedValue(q, DEBOUNCE_MS);
  const enabled = debouncedQ.trim().length >= 2;

  const query = useQuery({
    queryKey: ["destinations", "search", debouncedQ],
    queryFn: ({ signal }) => searchDestinations(debouncedQ, signal),
    enabled,
    retry: 1,
    staleTime: 15_000,
  });

  return {
    data: query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRateLimited: isSearchRateLimited(query.error),
    enabled,
    debouncedQ,
  };
}
