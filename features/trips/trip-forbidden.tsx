"use client";

import { useAuthMe } from "@/features/auth";

export function TripForbidden() {
  const { is_guest } = useAuthMe();

  if (is_guest) {
    return (
      <section className="w-full max-w-lg rounded-lg border p-4 text-sm">
        <p className="font-medium">This trip belongs to a different session</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your guest session does not match the session that owns this trip.
          Logging in will not fix that — open a trip from this browser session,
          or generate a new one.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-lg rounded-lg border p-4 text-sm">
      <p className="font-medium">You don’t own this trip</p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        This trip is owned by another account. You can’t view or change it.
      </p>
    </section>
  );
}
