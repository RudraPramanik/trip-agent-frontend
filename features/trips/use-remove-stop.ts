"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeDayStop, type TripOut } from "@/lib/api/trips";

function applyTripEditSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  trip: TripOut,
) {
  queryClient.setQueryData(["trips", id], trip);
  void queryClient.invalidateQueries({ queryKey: ["trips", id, "geojson"] });
  void queryClient.invalidateQueries({ queryKey: ["trips", "list"] });
}

export function useRemoveStop(tripId: string) {
  const queryClient = useQueryClient();
  const id = tripId.trim();

  return useMutation({
    mutationFn: (vars: { day: number; placeId: string }) =>
      removeDayStop(id, vars.day, vars.placeId),
    retry: false,
    onSuccess: (trip) => {
      applyTripEditSuccess(queryClient, id, trip);
    },
  });
}
