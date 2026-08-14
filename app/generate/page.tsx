import { PlannerCompose } from "@/features/planner";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params.destination;
  const destinationId = Array.isArray(raw) ? raw[0] : raw;

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Compose</h1>
      <PlannerCompose destinationId={destinationId} />
    </main>
  );
}
