import { TripPage } from "@/features/trips";
import { PageFrame } from "@/components/layout";

type TripRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripRoutePage({ params }: TripRoutePageProps) {
  const { id } = await params;

  return (
    <PageFrame className="gap-4 pb-16">
      <TripPage tripId={id} />
    </PageFrame>
  );
}
