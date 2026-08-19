"use client";

import { DestinationSearch } from "@/features/destinations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiveFeed } from "./live-feed";
import { PreviewFeed } from "./preview-feed";
import { useGeolocation } from "./use-geolocation";

type ExplorePageProps = {
  destinationId?: string;
};

export function ExplorePage({ destinationId }: ExplorePageProps) {
  const id = destinationId?.trim() ?? "";
  const geo = useGeolocation();
  const origin = geo.state.status === "granted" ? geo.state.origin : undefined;

  return (
    <div className="flex flex-col gap-8 pb-8">
      <header className="flex max-w-2xl flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Explore Nearby</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {id ? "Places in this destination" : "Find what’s around"}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Instagram-style cards for cafes, parks, viewpoints, and more. Live
          cards come from the destination catalog. Location without a
          destination is a labeled preview until a nearby API exists.
        </p>
      </header>

      <section className="max-w-xl rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-sm font-medium">Pick a destination</h2>
        <DestinationSearch resultPath="/explore" />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={geo.state.status === "pending"}
          onClick={() => {
            geo.request();
          }}
        >
          {geo.state.status === "pending" ? "Locating…" : "Use my location"}
        </Button>
        {geo.state.status === "granted" ? (
          <p className="text-xs text-muted-foreground">
            Location on — distances are approximate.
          </p>
        ) : null}
      </div>

      {geo.state.status === "denied" || geo.state.status === "unavailable" ? (
        <Card role="status">
          <CardHeader>
            <CardTitle>
              {geo.state.status === "denied"
                ? "Location permission denied"
                : "Location unavailable"}
            </CardTitle>
            <CardDescription>
              That’s fine. Search a destination above to browse the live place
              catalog. We do not invent a nearby API from GPS.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {id ? (
        <LiveFeed destinationId={id} origin={origin} />
      ) : geo.state.status === "granted" && origin ? (
        <PreviewFeed origin={origin} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Search a destination for live places, or use your location for a
          preview feed.
        </p>
      )}
    </div>
  );
}
