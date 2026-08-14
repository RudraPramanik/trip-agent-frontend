import { TripPage } from "@/features/trips";

type TripRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripRoutePage({ params }: TripRoutePageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <TripPage tripId={id} />
    </main>
  );
}
