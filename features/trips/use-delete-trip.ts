"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTrip } from "@/lib/api/trips";

export function useDeleteTrip(tripId: string, options?: { navigateAway?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const id = tripId.trim();
  const navigateAway = options?.navigateAway ?? false;

  return useMutation({
    mutationFn: () => deleteTrip(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trips", "list"] });
      queryClient.removeQueries({ queryKey: ["trips", id] });
      queryClient.removeQueries({ queryKey: ["trips", id, "geojson"] });
      if (navigateAway) {
        router.push("/trips");
      }
    },
  });
}
