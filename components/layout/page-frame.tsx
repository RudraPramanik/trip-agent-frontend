import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  header: ReactNode;
  children: ReactNode;
};

export function SiteShell({ header, children }: SiteShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-40">{header}</div>
      {children}
    </div>
  );
}

type PageFrameProps = {
  children: ReactNode;
  className?: string;
  width?: "narrow" | "wide" | "full";
};

export function PageFrame({
  children,
  className,
  width = "wide",
}: PageFrameProps) {
  const widthClass =
    width === "full"
      ? "max-w-none px-0"
      : width === "narrow"
        ? "max-w-2xl"
        : "max-w-6xl";

  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8",
        widthClass,
        className,
      )}
    >
      {children}
    </main>
  );
}
