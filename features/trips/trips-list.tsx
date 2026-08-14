"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { startGoogleLogin } from "@/features/auth";
import { DeleteTripControl } from "./delete-trip-control";
import { useTripsList } from "./use-trips-list";

function LoginCta({ message }: { message: string }) {
  return (
    <section className="flex w-full max-w-lg flex-col gap-3 text-sm">
      <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={startGoogleLogin}>
          Login
        </Button>
        <span className="max-w-xs text-xs text-zinc-500">
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
      <p className="w-full max-w-lg text-sm text-zinc-500">Checking session…</p>
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
        <p className="text-zinc-600 dark:text-zinc-400">
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
    return (
      <p className="w-full max-w-lg text-sm text-zinc-500">Loading trips…</p>
    );
  }

  if (list.items.length === 0) {
    return (
      <section className="flex w-full max-w-lg flex-col gap-2 text-sm">
        <h1 className="text-xl font-semibold tracking-tight">My trips</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          No trips yet. Generate one from a destination, then claim it after
          login if you started as a guest.
        </p>
      </section>
    );
  }

  return (
    <section className="flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">My trips</h1>
      <ul className="divide-y rounded-lg border text-sm">
        {list.items.map((trip) => (
          <li
            key={trip.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-3"
          >
            <Link
              href={`/trips/${trip.id}`}
              className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-2 hover:underline"
            >
              <span className="font-medium">
                Trip · {trip.days} day{trip.days === 1 ? "" : "s"}
              </span>
              <span className="text-zinc-500">{trip.status}</span>
            </Link>
            <DeleteTripControl tripId={trip.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
