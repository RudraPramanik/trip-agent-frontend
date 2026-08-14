export function getPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL. Copy .env.example to .env.local and set NEXT_PUBLIC_API_URL (no trailing slash).",
    );
  }
  return raw.replace(/\/+$/, "");
}

export function getMapStyleUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (!raw) {
    return undefined;
  }
  return raw.replace(/\/+$/, "") || undefined;
}
