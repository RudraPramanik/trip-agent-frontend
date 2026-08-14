import { TripsList } from "@/features/trips";

export default function TripsRoutePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <TripsList />
    </main>
  );
}
