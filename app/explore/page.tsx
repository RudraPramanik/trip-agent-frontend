import { ExplorePage } from "@/features/explore";
import { PageFrame } from "@/components/layout";

export default async function ExploreRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params.destination;
  const destinationId = Array.isArray(raw) ? raw[0] : raw;

  return (
    <PageFrame className="gap-4 pb-16">
      <ExplorePage destinationId={destinationId} />
    </PageFrame>
  );
}
