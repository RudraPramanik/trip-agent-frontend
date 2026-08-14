"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string(),
});

type SearchValues = z.infer<typeof searchSchema>;

type SearchFieldProps = {
  onQueryChange: (q: string) => void;
  disabled?: boolean;
};

export function SearchField({ onQueryChange, disabled }: SearchFieldProps) {
  const { register, watch } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { q: "" },
    mode: "onChange",
  });
  const q = watch("q");

  useEffect(() => {
    onQueryChange(q);
  }, [q, onQueryChange]);

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor="destination-q" className="text-sm font-medium">
        Destination
      </label>
      <input
        id="destination-q"
        type="search"
        autoComplete="off"
        placeholder="Search destinations"
        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        {...register("q")}
        disabled={disabled}
      />
      {(q ?? "").trim().length < 2 ? (
        <p className="text-xs text-zinc-500">Type at least 2 characters</p>
      ) : null}
    </form>
  );
}
