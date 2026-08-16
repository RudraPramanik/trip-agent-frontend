import { getPublicApiUrl } from "@/lib/config";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { components, paths } from "@/types/generated/api";

export type { components, paths };

export type ParseMode = "api" | "paginated" | "raw" | "empty";

/** Discriminated success envelope (frontendGuide §6). Generated `ApiResponse_*` use `success: boolean`. */
export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  message?: string | null;
};

/** Error envelope from the API global handler — not listed as a named OpenAPI schema. */
export type ErrorEnvelope = {
  success: false;
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
};

type PaginatedSchema =
  | components["schemas"]["PaginatedResponse_PlaceOut_"]
  | components["schemas"]["PaginatedResponse_TripOut_"];

export type PaginatedEnvelope<T> = Omit<PaginatedSchema, "items"> & { items: T[] };

const DEFAULT_TIMEOUT_MS = 20_000;
const GET_RETRY_LIMIT = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function parseApiResponse<T>(body: unknown): T {
  if (!isRecord(body) || body.success !== true || !("data" in body)) {
    throw new NetworkError("Unexpected API success envelope");
  }
  return (body as ApiSuccessEnvelope<T>).data;
}

export function parseErrorResponse(body: unknown): ErrorEnvelope | null {
  if (
    !isRecord(body) ||
    body.success !== false ||
    typeof body.code !== "string" ||
    typeof body.message !== "string"
  ) {
    return null;
  }
  return {
    success: false,
    code: body.code,
    message: body.message,
    details: isRecord(body.details) || body.details === null ? body.details : undefined,
  };
}

export function parsePaginatedResponse<T>(body: unknown): PaginatedEnvelope<T> {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    throw new NetworkError("Unexpected paginated response");
  }
  return body as PaginatedEnvelope<T>;
}

function joinUrl(origin: string, apiPath: string): string {
  const prefix = origin.replace(/\/+$/, "");
  const suffix = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return `${prefix}${suffix}`;
}

function withTimeout(signal: AbortSignal | undefined, ms: number): { signal: AbortSignal; timedOut: () => boolean } {
  const timeout = AbortSignal.timeout(ms);
  if (!signal) {
    return { signal: timeout, timedOut: () => timeout.aborted };
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted || timeout.aborted) {
    abort();
  } else {
    signal.addEventListener("abort", abort, { once: true });
    timeout.addEventListener("abort", abort, { once: true });
  }
  return {
    signal: controller.signal,
    timedOut: () => timeout.aborted && !signal.aborted,
  };
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (err) {
    throw new NetworkError(`Non-JSON body (HTTP ${res.status})`, {
      cause: err,
      status: res.status,
    });
  }
}

function throwMappedError(body: unknown, status: number): never {
  const parsed = parseErrorResponse(body);
  if (parsed) {
    throw new ApiError(parsed.code, parsed.message, status, parsed.details);
  }
  throw new NetworkError(`Unexpected error body (HTTP ${status})`, { status });
}

async function parseResponse<T>(res: Response, parse: ParseMode): Promise<T> {
  if (parse === "empty") {
    if (!res.ok && res.status !== 204) {
      throwMappedError(await readJson(res).catch(() => undefined), res.status);
    }
    return undefined as T;
  }

  const body = await readJson(res);

  // HTTP 2xx including 202 (prepare kickoff) is success. Do not require status === 200.
  if (!res.ok) {
    throwMappedError(body, res.status);
  }

  if (parse === "raw") {
    return body as T;
  }

  if (parse === "paginated") {
    return parsePaginatedResponse<T>(body) as T;
  }

  if (isRecord(body) && body.success === false) {
    throwMappedError(body, res.status);
  }

  return parseApiResponse<T>(body);
}

type RequestOptions = {
  method: string;
  path: string;
  body?: unknown;
  signal?: AbortSignal;
  parse?: ParseMode;
};

async function request<T>(options: RequestOptions): Promise<T> {
  const origin = getPublicApiUrl();
  const url = joinUrl(origin, options.path);
  const method = options.method.toUpperCase();
  const parse = options.parse ?? "api";
  const isGet = method === "GET";
  const maxAttempts = isGet ? 1 + GET_RETRY_LIMIT : 1;

  const attempt = async (attemptSignal: AbortSignal): Promise<T> => {
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          accept: "application/json",
          ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: attemptSignal,
      });
    } catch (err) {
      if (isAbortError(err)) {
        throw err;
      }
      throw new NetworkError("Network request failed", { cause: err });
    }
    return parseResponse<T>(res, parse);
  };

  let lastError: unknown;
  for (let i = 0; i < maxAttempts; i += 1) {
    const { signal, timedOut } = withTimeout(options.signal, DEFAULT_TIMEOUT_MS);
    try {
      return await attempt(signal);
    } catch (err) {
      lastError = err;
      if (isAbortError(err)) {
        if (timedOut()) {
          throw new NetworkError("Request timed out");
        }
        throw err;
      }
      const retryable = isGet && err instanceof NetworkError && i < maxAttempts - 1;
      if (!retryable) {
        throw err;
      }
    }
  }
  throw lastError;
}

export function getJson<T>(
  path: string,
  options?: { signal?: AbortSignal; parse?: ParseMode },
): Promise<T> {
  return request<T>({
    method: "GET",
    path,
    signal: options?.signal,
    parse: options?.parse,
  });
}

export function sendJson<T>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    parse?: ParseMode;
  },
): Promise<T> {
  return request<T>({
    method: options?.method ?? "POST",
    path,
    body: options?.body,
    signal: options?.signal,
    parse: options?.parse,
  });
}
