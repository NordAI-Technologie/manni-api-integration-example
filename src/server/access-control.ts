/** A demo access password is separate from the SID API key. Protect the route too,
 * not only middleware: direct route requests must never bypass the guard. */
export async function checkDemoAccess(
  request: Request,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<Response | null> {
  const password = env.DEMO_ACCESS_PASSWORD;
  if (!password) {
    if (env.NODE_ENV !== "production") {
      // Local development only, including protection from DNS rebinding.
      const host = request.headers.get("host") || new URL(request.url).host;
      try {
        if (
          ["localhost", "127.0.0.1", "[::1]"].includes(
            new URL(`http://${host}`).hostname,
          )
        )
          return null;
      } catch {
        /* Invalid Host. */
      }
      return Response.json(
        { error: "Demo access is restricted to local development" },
        { status: 403 },
      );
    }
    return Response.json(
      { error: "Demo access is not configured" },
      { status: 503 },
    );
  }
  const expected = `${env.DEMO_ACCESS_USERNAME || "manni"}:${password}`;
  let supplied = "";
  const authorization = request.headers.get("authorization") || "";
  if (authorization.startsWith("Basic ")) {
    try {
      const bytes = Uint8Array.from(atob(authorization.slice(6)), (char) =>
        char.charCodeAt(0),
      );
      supplied = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      /* Invalid credentials. */
    }
  }
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
  ]);
  const left = new Uint8Array(a),
    right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference === 0) return null;
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate":
        'Basic realm="Manni integration demo", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}
