"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe, type AuthMeResponse } from "@/lib/api/auth";

export type AuthMeView = {
  is_guest: boolean;
  user: AuthMeResponse["user"];
  session_id: string | null;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useAuthMe(): AuthMeView {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: ({ signal }) => getMe(signal),
    retry: 1,
    meta: { skipErrorToast: true },
  });

  const refetch = () => {
    void query.refetch();
  };

  if (query.isSuccess) {
    return {
      is_guest: query.data.is_guest,
      user: query.data.user ?? null,
      session_id: query.data.session_id,
      isPending: false,
      isError: false,
      refetch,
    };
  }

  return {
    is_guest: true,
    user: null,
    session_id: null,
    isPending: query.isPending,
    isError: query.isError,
    refetch,
  };
}
