import { checkDemoAccess } from "./access-control.ts";
import { getApiConfig } from "./config.ts";

function upstreamPath(path: string, method: string): string | null {
  if (path === "upload" && method === "POST") return "upload";
  const match = /^transcribe\/([^/]+?)(\/status)?$/.exec(path);
  if (!match || (method === "GET") !== Boolean(match[2])) return null;
  const id = match[1];
  // New UUIDs and legacy timestamp_filename IDs are both supported.
  if (id.startsWith(".") || id.length > 512 || /[\\\x00-\x1f%]/.test(id))
    return null;
  return `transcribe/${encodeURIComponent(id)}${match[2] || ""}`;
}
const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

function redactSecret(value: unknown, secret: string): unknown {
  if (typeof value === "string") return value.replaceAll(secret, "[REDACTED]");
  if (Array.isArray(value))
    return value.map((item) => redactSecret(item, secret));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key.replaceAll(secret, "[REDACTED]"),
        redactSecret(item, secret),
      ]),
    );
  }
  return value;
}

export async function handleProxy(
  request: Request,
  fetchUpstream: typeof fetch = fetch,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<Response> {
  const denied = await checkDemoAccess(request, env);
  if (denied) return denied;
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "";
  if (request.method !== "GET" && request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  const upstream = upstreamPath(path, request.method);
  if (!upstream) {
    return json({ error: "Invalid API path" }, 400);
  }
  // This browser-facing demo deliberately does not expose a configurable proxy.
  if (
    request.headers.has("x-api-endpoint") ||
    request.headers.has("x-api-key")
  ) {
    return json({ error: "Configure API access on the server" }, 400);
  }
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    // Next may normalize request.url to localhost; Host represents the browser's
    // actual destination. Do not trust a client-controlled x-forwarded-host.
    const host = request.headers.get("host") || url.host;
    let sameOrigin = !origin;
    try {
      if (origin) {
        const source = new URL(origin);
        sameOrigin = source.host === host && source.protocol === url.protocol;
      }
    } catch {
      /* Invalid Origin. */
    }
    if (request.headers.get("sec-fetch-site") === "cross-site" || !sameOrigin) {
      return json({ error: "Cross-origin requests are not allowed" }, 403);
    }
  }
  let config;
  try {
    config = getApiConfig(env);
  } catch {
    return json({ error: "API configuration missing or invalid" }, 503);
  }
  const headers = new Headers({ "x-api-key": config.key });
  let body: BodyInit | undefined;
  if (request.method === "POST") {
    try {
      if (path === "upload") {
        const input = await request.formData();
        const file = input.get("file");
        if (!(file instanceof File) || file.size === 0)
          return json({ error: "An audio file is required" }, 400);
        const form = new FormData();
        form.append("file", file);
        body = form;
      } else {
        const input: unknown = await request.json();
        if (!input || typeof input !== "object" || Array.isArray(input))
          return json({ error: "Invalid transcription options" }, 400);
        const values = input as Record<string, unknown>;
        const allowed = [
          "language",
          "language_hint",
          "num_speakers",
          "min_speakers",
          "max_speakers",
        ];
        if (Object.keys(values).some((key) => !allowed.includes(key)))
          return json({ error: "Invalid transcription options" }, 400);
        for (const key of ["language", "language_hint"]) {
          if (
            values[key] != null &&
            (typeof values[key] !== "string" ||
              !/^[a-zA-Z-]{2,16}$/.test(values[key] as string))
          ) {
            return json({ error: "Invalid language" }, 400);
          }
        }
        for (const key of allowed.slice(2)) {
          if (
            values[key] != null &&
            (!Number.isInteger(values[key]) || Number(values[key]) < 1)
          )
            return json({ error: "Invalid speaker count" }, 400);
        }
        body = JSON.stringify(values);
        headers.set("Content-Type", "application/json");
      }
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
  }
  try {
    const response = await fetchUpstream(`${config.endpoint}/api/${upstream}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "error", // Never forward the API key to a redirected destination.
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(path === "upload" ? 120_000 : 30_000),
      ]),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json"))
      return json(
        { error: "Invalid response from transcription service" },
        response.ok ? 502 : response.status,
      );
    const text = await response.text();
    // Do not echo a secret even if an upstream error accidentally includes it.
    let payload: unknown;
    try {
      payload = redactSecret(JSON.parse(text), config.key);
    } catch {
      return json(
        { error: "Invalid response from transcription service" },
        response.ok ? 502 : response.status,
      );
    }
    const result = json(payload, response.status);
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) result.headers.set("Retry-After", retryAfter);
    return result;
  } catch (error) {
    if (request.signal.aborted)
      return json({ error: "Request cancelled" }, 499);
    const timeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return json(
      {
        error: timeout
          ? "Transcription service timeout; check the existing job before retrying"
          : "Transcription service unavailable",
      },
      timeout ? 504 : 502,
    );
  }
}
