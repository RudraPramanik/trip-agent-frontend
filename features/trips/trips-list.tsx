"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startGoogleLogin } from "@/features/auth";
import { DeleteTripControl } from "./delete-trip-control";
import { useTripsList } from "./use-trips-list";

function LoginCta({ message }: { message: string }) {
  return (
    <section className="flex w-full max-w-lg flex-col gap-3 text-sm">
      <p className="text-muted-foreground">{message}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={startGoogleLogin}>
          Login
        </Button>
        <span className="max-w-xs text-xs text-muted-foreground">
          Login may land on the API JSON page until FRONTEND_URL bounce exists.
        </span>
      </div>
    </section>
  );
}

export function TripsList() {
  const list = useTripsList();

  if (list.authPending) {
    return (
      <p className="w-full text-sm text-muted-foreground">Checking session…</p>
    );
  }

  if (list.isGuest || list.isUnauthorized) {
    return (
      <LoginCta message="Sign in to see your trips. Guests don’t get a trip list." />
    );
  }

  if (list.isError) {
    return (
      <section className="flex w-full max-w-lg flex-col gap-2 text-sm">
        <p className="text-muted-foreground">
          Couldn’t load your trips. Try again.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void list.refetch();
          }}
        >
          Retry
        </Button>
      </section>
    );
  }

  if (list.isPending) {
    return <p className="w-full text-sm text-muted-foreground">Loading trips…</p>;
  }

  if (list.items.length === 0) {
    return (
      <section className="flex w-full max-w-lg flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          My trips
        </h1>
        <p className="text-sm text-muted-foreground">
          No trips yet. Generate one from a destination, then claim it after
          login if you started as a guest.
        </p>
        <Link
          href="/"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Plan a trip
        </Link>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        My trips
      </h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.items.map((trip) => (
          <li key={trip.id}>
            <Card size="sm" className="h-full">
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="hover:underline"
                  >
                    Trip · {trip.days} day{trip.days === 1 ? "" : "s"}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {trip.days} day itinerary
                </CardDescription>
                <CardAction>
                  <DeleteTripControl tripId={trip.id} />
                </CardAction>
              </CardHeader>
              <div className="px-4 pb-4">
                <Badge variant="secondary">{trip.status}</Badge>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
