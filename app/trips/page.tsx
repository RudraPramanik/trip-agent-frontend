import { TripsList } from "@/features/trips";
import { PageFrame } from "@/components/layout";

export default function TripsRoutePage() {
  return (
    <PageFrame className="gap-4 pb-16">
      <TripsList />
    </PageFrame>
  );
}
