"use client";

import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { startGoogleLogin, useAuthMe } from "@/features/auth";
import { ApiError } from "@/lib/api/errors";
import { useDeleteTrip } from "./use-delete-trip";

type DeleteTripControlProps = {
  tripId: string;
  /** When true, navigate to /trips after a successful delete (detail page). */
  navigateAway?: boolean;
};

export function DeleteTripControl({
  tripId,
  navigateAway = false,
}: DeleteTripControlProps) {
  const auth = useAuthMe();
  const queryClient = useQueryClient();
  const del = useDeleteTrip(tripId, { navigateAway });

  if (auth.isPending) {
    return null;
  }

  if (auth.is_guest) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled>
          Delete
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={startGoogleLogin}>
          Login to manage trips
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={del.isPending}
      onClick={() => {
        const ok = window.confirm(
          "Delete this trip permanently? This cannot be undone.",
        );
        if (!ok) {
          return;
        }
        del.mutate(undefined, {
          onSuccess: () => {
            toast.success("Trip deleted");
          },
          onError: (error) => {
            if (error instanceof ApiError) {
              if (error.status === 403 || error.code === "forbidden") {
                toast.error("You don’t own this trip, so it wasn’t deleted.");
                return;
              }
              if (error.status === 404 || error.code === "not_found") {
                toast.error("This trip is already gone.");
                void queryClient.invalidateQueries({
                  queryKey: ["trips", "list"],
                });
                return;
              }
            }
            toast.error("Couldn’t delete this trip. Try again.");
          },
        });
      }}
    >
      {del.isPending ? "Deleting…" : "Delete trip"}
    </Button>
  );
}
