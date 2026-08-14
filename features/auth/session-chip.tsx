"use client";

import { Button } from "@/components/ui/button";
import { useAuthMe } from "./use-auth-me";

export function SessionChip() {
  const { is_guest, user, isPending, isError, refetch } = useAuthMe();

  const label = is_guest ? "Guest" : user?.name || user?.email || "User";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{isPending ? "Checking session…" : label}</span>
      {isError ? (
        <Button type="button" variant="ghost" size="xs" onClick={refetch}>
          Reconnect
        </Button>
      ) : null}
    </div>
  );
}
