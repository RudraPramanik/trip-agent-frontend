import { getPublicApiUrl } from "@/lib/config";

export function startGoogleLogin(): void {
  window.location.assign(`${getPublicApiUrl()}/api/v1/auth/google`);
}
