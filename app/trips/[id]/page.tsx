type TripStubPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripStubPage({ params }: TripStubPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-2 px-4 py-10">
      <h1 className="text-xl font-semibold">Trip</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Trip detail lands in F4.
      </p>
      <p className="break-all font-mono text-xs text-zinc-500">{id}</p>
    </main>
  );
}
