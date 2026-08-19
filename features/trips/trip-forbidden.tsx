"use client";

import { useEffect, useState } from "react";
import { useAuthMe } from "@/features/auth";
import { apiHostnameMismatchesPage } from "@/lib/config";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TripForbidden() {
  const { is_guest } = useAuthMe();
  const [pageHostname, setPageHostname] = useState<string | undefined>();

  useEffect(() => {
    setPageHostname(window.location.hostname);
  }, []);

  if (is_guest) {
    const hostMismatch = apiHostnameMismatchesPage(pageHostname);
    return (
      <Card className="w-full max-w-lg" role="alert">
        <CardHeader>
          <CardTitle>This trip belongs to a different session</CardTitle>
          <CardDescription>
            Your guest session does not match the session that owns this trip.
            Logging in will not fix that — open a trip generated in this browser
            session, or generate a new one.
          </CardDescription>
          {hostMismatch ? (
            <CardDescription>
              This page and the API are on different hosts (localhost vs
              127.0.0.1 splits cookies). Use the same host for the app and the
              API.
            </CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg" role="alert">
      <CardHeader>
        <CardTitle>You don’t own this trip</CardTitle>
        <CardDescription>
          This trip is owned by another account. You can’t view or change it.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
