"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionChip } from "./session-chip";
import { startGoogleLogin } from "./start-login";
import { useAuthMe } from "./use-auth-me";
import { useLogout } from "./use-logout";

export function SessionHeader() {
  const { is_guest } = useAuthMe();
  const logoutMutation = useLogout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
      <Link href="/" className="font-semibold tracking-tight">
        Wandr
      </Link>
      <Link href="/" className="text-sm underline-offset-4 hover:underline">
        Search
      </Link>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {mounted ? (
          <>
            <SessionChip />
            {is_guest ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" onClick={startGoogleLogin}>
                  Login
                </Button>
                <span className="max-w-xs text-xs text-zinc-500">
                  Login may land on the API JSON page until FRONTEND_URL bounce
                  exists. Guest browsing still works.
                </span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            )}
          </>
        ) : (
          <span className="text-sm text-zinc-500">Checking session…</span>
        )}
      </div>
    </header>
  );
}
