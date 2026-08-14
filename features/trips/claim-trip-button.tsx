"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startGoogleLogin, useAuthMe } from "@/features/auth";
import type { TripOut } from "@/lib/api/trips";
import {
  classifyClaimError,
  useClaimTrip,
} from "./use-claim-trip";

type ClaimTripButtonProps = {
  trip: TripOut;
};

/**
 * Claim after Google login on the trip. Best-effort until API FRONTEND_URL
 * OAuth bounce keeps wandr_session aligned with the guest trip.
 */
export function ClaimTripButton({ trip }: ClaimTripButtonProps) {
  const auth = useAuthMe();
  const claim = useClaimTrip(trip.id);
  const unclaimed = trip.user_id == null;

  if (!unclaimed) {
    return null;
  }

  if (auth.isPending) {
    return null;
  }

  if (auth.is_guest) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={startGoogleLogin}>
          Login to claim
        </Button>
        <span className="max-w-sm text-xs text-zinc-500">
          Claim needs a matching session after login. Until FRONTEND_URL bounce
          works, local cookies may be required.
        </span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={claim.isPending}
      onClick={() => {
        claim.mutate(undefined, {
          onSuccess: () => {
            toast.success("Trip claimed");
          },
          onError: (error) => {
            const kind = classifyClaimError(error, {
              isGuest: auth.is_guest,
              tripUserId: trip.user_id,
            });
            if (kind === "unauthorized") {
              toast.error("Sign in to claim this trip");
              return;
            }
            if (kind === "session_mismatch") {
              toast.error(
                "This trip belongs to a different session. Logging in will not fix that.",
              );
              return;
            }
            if (kind === "already_claimed") {
              toast.error("This trip is already claimed and can’t be claimed again.");
              return;
            }
            toast.error("Couldn’t claim this trip. Try again.");
          },
        });
      }}
    >
      {claim.isPending ? "Claiming…" : "Claim trip"}
    </Button>
  );
}
