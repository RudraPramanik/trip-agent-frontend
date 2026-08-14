"use client";

export function TripNotFound() {
  return (
    <section className="w-full max-w-lg rounded-lg border p-4 text-sm">
      <p className="font-medium">Trip not found</p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        This trip id is missing or unknown. Generate a trip or check the link.
      </p>
    </section>
  );
}
