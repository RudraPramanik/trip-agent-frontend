export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL. Copy .env.example to .env.local and set NEXT_PUBLIC_API_URL (no trailing slash).",
    );
  }
  return raw.replace(/\/+$/, "");
}

/**
 * True when the page hostname differs from NEXT_PUBLIC_API_URL's hostname
 * (e.g. localhost vs 127.0.0.1). Read-only — does not rewrite the API origin.
 * Undefined/empty pageHostname (SSR) is not a mismatch.
 */
export function apiHostnameMismatchesPage(
  pageHostname: string | undefined,
): boolean {
  const page = pageHostname?.trim();
  if (!page) {
    return false;
  }
  try {
    const apiHostname = new URL(getPublicApiUrl()).hostname;
    return apiHostname.toLowerCase() !== page.toLowerCase();
  } catch {
    return false;
  }
}

export function getMapStyleUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (!raw) {
    return undefined;
  }
  return raw.replace(/\/+$/, "") || undefined;
}
