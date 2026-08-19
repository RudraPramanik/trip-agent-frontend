"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
      className="flex flex-col gap-2"
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor="destination-q" className="text-sm font-medium">
        Destination
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="destination-q"
          type="search"
          autoComplete="off"
          placeholder="Search destinations"
          className="h-12 rounded-xl bg-background pr-3 pl-10 text-base"
          {...register("q")}
          disabled={disabled}
        />
      </div>
      {(q ?? "").trim().length < 2 ? (
        <p className="text-xs text-muted-foreground">Type at least 2 characters</p>
      ) : null}
    </form>
  );
}
