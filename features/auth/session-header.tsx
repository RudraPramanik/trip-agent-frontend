"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionChip } from "./session-chip";
import { startGoogleLogin } from "./start-login";
import { useAuthMe } from "./use-auth-me";
import { useLogout } from "./use-logout";

const navLinkClass =
  "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function SessionHeader() {
  const { is_guest } = useAuthMe();
  const logoutMutation = useLogout();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Wandr
        </Link>
        <nav className="flex flex-wrap items-center gap-0.5">
          <Link
            href="/#destination-search"
            className={cn(
              navLinkClass,
              pathname === "/" && "bg-muted text-foreground",
            )}
          >
            Search
          </Link>
          <Link
            href="/explore"
            className={cn(
              navLinkClass,
              pathname === "/explore" && "bg-muted text-foreground",
            )}
          >
            Explore
          </Link>
          <Link
            href="/trips"
            className={cn(
              navLinkClass,
              pathname.startsWith("/trips") && "bg-muted text-foreground",
            )}
          >
            Trips
          </Link>
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {mounted ? (
            <>
              <SessionChip />
              {is_guest ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" onClick={startGoogleLogin}>
                    Login
                  </Button>
                  <span className="max-w-xs text-xs text-muted-foreground">
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
            <span className="text-sm text-muted-foreground">
              Checking session…
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
