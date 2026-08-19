"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryArt } from "@/components/category-art";

export type FeedCardItem = {
  id: string;
  name: string;
  category: string;
  summary: string | null;
  destinationId?: string;
  preview?: boolean;
  distanceKm?: number;
};

type FeedCardProps = {
  item: FeedCardItem;
};

export function FeedCard({ item }: FeedCardProps) {
  const art = categoryArt(item.category);
  const Icon = art.icon;

  return (
    <article className="flex break-inside-avoid flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        className={cn(
          "relative flex h-40 items-end bg-gradient-to-br p-3 text-white",
          art.from,
          art.to,
        )}
      >
        <span className="absolute top-3 right-3 rounded-full bg-black/25 p-2">
          <Icon className="size-4" aria-hidden />
        </span>
        <p className="text-xs font-medium text-white/90">
          {art.label} category illustration, not a photo of this venue
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="font-heading text-base font-semibold">{item.name}</h3>
          {item.preview ? <Badge variant="secondary">Preview</Badge> : null}
        </div>
        {item.category ? (
          <Badge variant="outline" className="w-fit">
            {item.category}
          </Badge>
        ) : null}
        {item.summary ? (
          <p className="text-sm text-muted-foreground">{item.summary}</p>
        ) : null}
        {item.distanceKm !== undefined ? (
          <p className="text-xs text-muted-foreground">
            {item.distanceKm.toFixed(1)} km from you
          </p>
        ) : null}
        <div className="mt-auto pt-1">
          {item.preview ? (
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Search this on Plan
            </Link>
          ) : item.destinationId ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/?destination=${encodeURIComponent(item.destinationId)}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Plan this destination
              </Link>
              <Link
                href={`/generate?destination=${encodeURIComponent(item.destinationId)}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Generate
              </Link>
            </div>
          ) : (
            <Button type="button" size="sm" variant="outline" disabled>
              No destination
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
