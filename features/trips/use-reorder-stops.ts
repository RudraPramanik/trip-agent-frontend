"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reorderDayStops,
  type ReorderStopsIn,
  type TripOut,
} from "@/lib/api/trips";

function applyTripEditSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  trip: TripOut,
) {
  queryClient.setQueryData(["trips", id], trip);
  void queryClient.invalidateQueries({ queryKey: ["trips", id, "geojson"] });
  void queryClient.invalidateQueries({ queryKey: ["trips", "list"] });
}

export function useReorderStops(tripId: string) {
  const queryClient = useQueryClient();
  const id = tripId.trim();

  return useMutation({
    mutationFn: (vars: { day: number; body: ReorderStopsIn }) =>
      reorderDayStops(id, vars.day, vars.body),
    retry: false,
    onSuccess: (trip) => {
      applyTripEditSuccess(queryClient, id, trip);
    },
  });
}
