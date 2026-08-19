import { PlannerCompose } from "@/features/planner";
import { PageFrame } from "@/components/layout";

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveDestinationId(params: {
  [key: string]: string | string[] | undefined;
}): string | undefined {
  return (
    firstQueryValue(params.destination) ??
    firstQueryValue(params.destination_id)
  );
}

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const destinationId = resolveDestinationId(params);

  return (
    <PageFrame width="narrow" className="gap-6 pb-16">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Compose</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Tell us the trip
        </h1>
      </div>
      <PlannerCompose destinationId={destinationId} />
    </PageFrame>
  );
}
