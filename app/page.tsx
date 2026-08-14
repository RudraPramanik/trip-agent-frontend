import { DestinationSearch, ReadinessCard } from "@/features/destinations";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params.destination;
  const destinationId = Array.isArray(raw) ? raw[0] : raw;

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Wandr</h1>
      <DestinationSearch />
      <ReadinessCard destinationId={destinationId} />
    </main>
  );
}
