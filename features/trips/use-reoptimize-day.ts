"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reoptimizeDay, type TripOut } from "@/lib/api/trips";

function applyTripEditSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  trip: TripOut,
) {
  queryClient.setQueryData(["trips", id], trip);
  void queryClient.invalidateQueries({ queryKey: ["trips", id, "geojson"] });
  void queryClient.invalidateQueries({ queryKey: ["trips", "list"] });
}

export function useReoptimizeDay(tripId: string) {
  const queryClient = useQueryClient();
  const id = tripId.trim();

  return useMutation({
    mutationFn: (vars: { day: number }) => reoptimizeDay(id, vars.day),
    retry: false,
    onSuccess: (trip) => {
      applyTripEditSuccess(queryClient, id, trip);
    },
  });
}
