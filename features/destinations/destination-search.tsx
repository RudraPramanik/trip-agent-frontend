"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchField } from "./search-field";
import { SearchResults } from "./search-results";
import { useDestinationSearch } from "./use-destination-search";

const RATE_LIMIT_DISABLE_MS = 2000;

export function DestinationSearch() {
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
      className="flex w-full max-w-lg flex-col gap-3"
    >
      <SearchField onQueryChange={onQueryChange} disabled={rateLimited} />
      <SearchResults
        enabled={search.enabled}
        data={search.data}
        isFetching={search.isFetching}
        isError={search.isError}
        onRetry={() => {
          void search.refetch();
        }}
      />
    </section>
  );
}
