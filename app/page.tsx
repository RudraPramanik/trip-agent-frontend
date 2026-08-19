import { DestinationSearch, ReadinessCard } from "@/features/destinations";
import { PageFrame } from "@/components/layout";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params.destination;
  const destinationId = Array.isArray(raw) ? raw[0] : raw;

  return (
    <PageFrame className="gap-10 pb-16">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(1_0_0_/_0.18),transparent_55%)]" />
        <div className="relative flex max-w-2xl flex-col gap-4">
          <p className="text-sm font-medium tracking-wide text-primary-foreground/80">
            Plan · Explore · Go
          </p>
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Plan a trip that actually fits the place
          </h1>
          <p className="max-w-lg text-sm text-primary-foreground/85 sm:text-base">
            Search a destination, prepare its places, then generate a day-by-day
            itinerary. Guests can plan — no login wall.
          </p>
        </div>
        <div className="relative mt-8 max-w-xl rounded-2xl bg-background p-4 text-foreground shadow-lg sm:p-6">
          <DestinationSearch />
        </div>
      </section>
      <ReadinessCard destinationId={destinationId} />
    </PageFrame>
  );
}
