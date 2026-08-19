"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchField } from "./search-field";
import { SearchResults } from "./search-results";
import { useDestinationSearch } from "./use-destination-search";

const RATE_LIMIT_DISABLE_MS = 2000;

type DestinationSearchProps = {
  /** Pathname that receives `?destination=` after a hit is selected. */
  resultPath?: string;
};

export function DestinationSearch({
  resultPath = "/",
}: DestinationSearchProps) {
  const [q, setQ] = useState("");
  const search = useDestinationSearch(q);
  const [rateLimited, setRateLimited] = useState(false);

  const onQueryChange = useCallback((value: string) => {
    setQ(value);
  }, []);

  useEffect(() => {
    if (!search.isRateLimited) {
      return;
    }
    setRateLimited(true);
    const id = window.setTimeout(() => setRateLimited(false), RATE_LIMIT_DISABLE_MS);
    return () => window.clearTimeout(id);
  }, [search.isRateLimited]);

  return (
    <section
      id="destination-search"
      className="flex w-full max-w-xl flex-col gap-3"
    >
      <SearchField onQueryChange={onQueryChange} disabled={rateLimited} />
      <SearchResults
        enabled={search.enabled}
        data={search.data}
        isFetching={search.isFetching}
        isError={search.isError}
        resultPath={resultPath}
        onRetry={() => {
          void search.refetch();
        }}
      />
    </section>
  );
}
