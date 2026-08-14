"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { ApiError, NetworkError } from "@/lib/api/errors";

interface QueryMeta extends Record<string, unknown> {
  skipErrorToast?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: QueryMeta;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof NetworkError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong";
}

function notifyError(error: unknown) {
  toast.error(errorMessage(error));
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.skipErrorToast) {
          return;
        }
        notifyError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: notifyError,
    }),
    defaultOptions: {
      queries: {
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
