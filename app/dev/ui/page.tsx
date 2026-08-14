"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startGoogleLogin, useAuthMe, useLogout } from "@/features/auth";

function truncateSessionId(sessionId: string | null): string {
  if (!sessionId) {
    return "—";
  }
  if (sessionId.length <= 8) {
    return sessionId;
  }
  return `${sessionId.slice(0, 8)}…`;
}

function SessionReadout() {
  const { is_guest, user, session_id, isPending, isError, refetch } = useAuthMe();
  const logoutMutation = useLogout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = is_guest
    ? "Guest"
    : (user?.name || user?.email || "User");

  const showPending = !mounted || isPending;

  return (
    <div className="flex flex-col items-center gap-2 text-sm">
      {showPending ? (
        <p>Checking session…</p>
      ) : (
        <>
          <p>
            {label}
            <span className="ml-2 text-zinc-500">({truncateSessionId(session_id)})</span>
          </p>
          {isError ? (
            <Button type="button" variant="outline" size="sm" onClick={refetch}>
              Reconnect
            </Button>
          ) : null}
          <div className="flex flex-col items-center gap-1">
            {is_guest ? (
              <>
                <Button type="button" onClick={startGoogleLogin}>
                  Login
                </Button>
                <p className="max-w-md text-center text-xs text-zinc-500">
                  Google may return you to the API JSON page. Guest browsing still
                  works. Polished return needs backend FRONTEND_URL.
                </p>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DevUiPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <Button>Scratch</Button>
      <Button type="button" variant="outline" onClick={() => toast("F0 scratch")}>
        F0 scratch
      </Button>
      <SessionReadout />
    </main>
  );
}

