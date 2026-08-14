import { getJson, sendJson } from "@/lib/api/client";
import type { components, paths } from "@/types/generated/api";

const AUTH_ME_PATH = "/api/v1/auth/me" satisfies keyof paths;
const AUTH_LOGOUT_PATH = "/api/v1/auth/logout" satisfies keyof paths;

export type AuthMeResponse = components["schemas"]["AuthMeResponse"];

export function getMe(signal?: AbortSignal): Promise<AuthMeResponse> {
  return getJson<AuthMeResponse>(AUTH_ME_PATH, { signal, parse: "api" });
}

/** Live 200 is ApiResponse; OpenAPI types the body as unknown — do not invent a Logout DTO. */
export function logout(signal?: AbortSignal): Promise<unknown> {
  return sendJson<unknown>(AUTH_LOGOUT_PATH, {
    method: "POST",
    signal,
    parse: "api",
  });
}
