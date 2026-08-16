"use client";

import { useEffect, useState } from "react";
import { useAuthMe } from "@/features/auth";
import { apiHostnameMismatchesPage } from "@/lib/config";

export function TripForbidden() {
  const { is_guest } = useAuthMe();
  const [pageHostname, setPageHostname] = useState<string | undefined>();

  useEffect(() => {
    setPageHostname(window.location.hostname);
  }, []);

  if (is_guest) {
    const hostMismatch = apiHostnameMismatchesPage(pageHostname);
    return (
      <section className="w-full max-w-lg rounded-lg border p-4 text-sm">
        <p className="font-medium">This trip belongs to a different session</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your guest session does not match the session that owns this trip.
          Logging in will not fix that — open a trip generated in this browser
          session, or generate a new one.
        </p>
        {hostMismatch ? (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            This page and the API are on different hosts (localhost vs
            127.0.0.1 splits cookies). Use the same host for the app and the
            API.
          </p>
        ) : null}
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
