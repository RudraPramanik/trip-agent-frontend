import { PlannerCompose } from "@/features/planner";

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
    <main className="flex flex-1 flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
      <PlannerCompose destinationId={destinationId} />
    </main>
  );
}
