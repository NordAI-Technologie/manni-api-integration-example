import test from "node:test";
import assert from "node:assert/strict";
import { handleProxy } from "../src/server/transcription-proxy.ts";
import { getApiConfig } from "../src/server/config.ts";
import { checkDemoAccess } from "../src/server/access-control.ts";

const env = {
  NODE_ENV: "test",
  API_ENDPOINT: "https://sid.example.test",
  API_KEY: "test-server-secret",
};
const req = (path: string, init: RequestInit = {}) =>
  new Request(
    `http://localhost:3000/api/transcription-proxy?${new URLSearchParams({ path })}`,
    init,
  );
const mockFetch = (
  fn: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Response | Promise<Response>,
) => fn as typeof fetch;

test("production requires access configuration and never falls back based on Host", async () => {
  const response = await checkDemoAccess(
    new Request("http://localhost/", { headers: { host: "localhost" } }),
    { NODE_ENV: "production" },
  );
  assert.equal(response?.status, 503);
});

test("demo password is checked separately from API key", async () => {
  const authEnv = {
    ...env,
    NODE_ENV: "production",
    DEMO_ACCESS_PASSWORD: "demo-only-password",
  };
  assert.equal((await checkDemoAccess(req("upload"), authEnv))?.status, 401);
  assert.equal(
    await checkDemoAccess(
      req("upload", {
        headers: { authorization: `Basic ${btoa("manni:demo-only-password")}` },
      }),
      authEnv,
    ),
    null,
  );
  assert.equal(
    (
      await checkDemoAccess(
        req("upload", { headers: { authorization: "Basic invalid!" } }),
        authEnv,
      )
    )?.status,
    401,
  );
  let called = false;
  const denied = await handleProxy(
    req("transcribe/abc/status"),
    mockFetch(() => {
      called = true;
      return Response.json({});
    }),
    authEnv,
  );
  assert.equal(denied.status, 401);
  assert.equal(called, false);
});

test("fixed destination and exact paths; browser credential overrides and traversal rejected", async () => {
  let called = false;
  const upstream = mockFetch(() => {
    called = true;
    return Response.json({});
  });
  for (const path of [
    "clear_models",
    "transcribe/../status",
    "transcribe/%2fetc/status",
    "transcribe/a/b/status",
    "transcribe/\\secret/status",
  ]) {
    assert.equal((await handleProxy(req(path), upstream, env)).status, 400);
  }
  assert.equal(
    (
      await handleProxy(
        req("transcribe/abc/status", {
          headers: { "x-api-endpoint": "https://attacker.test" },
        }),
        upstream,
        env,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleProxy(
        req("transcribe/abc/status", {
          headers: { "x-api-key": "browser-secret" },
        }),
        upstream,
        env,
      )
    ).status,
    400,
  );
  assert.equal(called, false);
});

test("legacy filename ID is encoded as one segment, server key and status are preserved", async () => {
  const response = await handleProxy(
    req("transcribe/123_réunion a.mp3/status"),
    mockFetch((url, init) => {
      assert.equal(
        url,
        "https://sid.example.test/api/transcribe/123_r%C3%A9union%20a.mp3/status",
      );
      assert.equal(new Headers(init?.headers).get("x-api-key"), env.API_KEY);
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      return Response.json({ status: "processing" });
    }),
    env,
  );
  assert.deepEqual(await response.json(), { status: "processing" });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("awaits actual job admission and forwards its real status/options", async () => {
  let resolve!: (value: Response) => void;
  const upstreamResponse = new Promise<Response>((done) => {
    resolve = done;
  });
  let settled = false;
  const response = handleProxy(
    req("transcribe/abc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "fr",
        language_hint: "fr",
        min_speakers: 2,
      }),
    }),
    mockFetch((url, init) => {
      assert.equal(url, "https://sid.example.test/api/transcribe/abc");
      assert.deepEqual(JSON.parse(String(init?.body)), {
        language: "fr",
        language_hint: "fr",
        min_speakers: 2,
      });
      return upstreamResponse;
    }),
    env,
  ).then((value) => {
    settled = true;
    return value;
  });
  await new Promise((done) => setTimeout(done, 10));
  assert.equal(settled, false);
  resolve(
    Response.json(
      { status: "queued", file_id: "abc", progress: 0 },
      { status: 202 },
    ),
  );
  const result = await response;
  assert.equal(result.status, 202);
  assert.deepEqual(await result.json(), {
    status: "queued",
    file_id: "abc",
    progress: 0,
  });
});

test("preserves 401/404/429/500 and error bodies instead of fabricating pending", async () => {
  for (const status of [401, 404, 429, 500]) {
    const response = await handleProxy(
      req("transcribe/abc/status"),
      mockFetch(() =>
        Response.json(
          { detail: "No such job" },
          { status, headers: { "Retry-After": "3" } },
        ),
      ),
      env,
    );
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { detail: "No such job" });
    assert.equal(response.headers.get("retry-after"), "3");
  }
});

test("network failures and invalid JSON remain errors and never disclose server key", async () => {
  const unavailable = await handleProxy(
    req("transcribe/abc/status"),
    mockFetch(() => {
      throw new Error(`connect failed ${env.API_KEY}`);
    }),
    env,
  );
  assert.equal(unavailable.status, 502);
  assert.doesNotMatch(await unavailable.text(), /test-server-secret/);
  const invalid = await handleProxy(
    req("transcribe/abc/status"),
    mockFetch(
      () =>
        new Response("not json", {
          headers: { "Content-Type": "application/json" },
        }),
    ),
    env,
  );
  assert.equal(invalid.status, 502);
  const reflected = await handleProxy(
    req("transcribe/abc/status"),
    mockFetch(() =>
      Response.json({ detail: `unauthorized ${env.API_KEY}` }, { status: 401 }),
    ),
    env,
  );
  assert.doesNotMatch(await reflected.text(), /test-server-secret/);
});

test("multipart upload retains existing SID contract", async () => {
  const form = new FormData();
  form.append(
    "file",
    new File(["audio fixture"], "audio.wav", { type: "audio/wav" }),
  );
  const response = await handleProxy(
    req("upload", { method: "POST", body: form }),
    mockFetch(async (url, init) => {
      assert.equal(url, "https://sid.example.test/api/upload");
      const file = (init?.body as FormData).get("file") as File;
      assert.equal(file.name, "audio.wav");
      assert.equal(await file.text(), "audio fixture");
      assert.equal(new Headers(init?.headers).has("Content-Type"), false);
      return Response.json({ file_id: "abc" });
    }),
    env,
  );
  assert.deepEqual(await response.json(), { file_id: "abc" });
});

test("cross-origin writes and malformed input never call SID", async () => {
  const never = mockFetch(() => {
    assert.fail("unexpected upstream request");
  });
  assert.equal(
    (
      await handleProxy(
        req("upload", {
          method: "POST",
          headers: { origin: "https://attacker.test" },
        }),
        never,
        env,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleProxy(
        req("upload", {
          method: "POST",
          headers: { "sec-fetch-site": "cross-site" },
        }),
        never,
        env,
      )
    ).status,
    403,
  );
  for (const body of [
    "not json",
    '{"num_speakers":0}',
    '{"language":"../../admin"}',
    '{"url":"https://attacker.test"}',
  ]) {
    assert.equal(
      (
        await handleProxy(
          req("transcribe/abc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }),
          never,
          env,
        )
      ).status,
      400,
    );
  }
});

test("configuration fails closed and never exposes secret values", () => {
  assert.throws(() => getApiConfig({ API_ENDPOINT: "https://example.test" }));
  assert.throws(() =>
    getApiConfig({
      API_ENDPOINT: "https://user:secret@example.test",
      API_KEY: "secret",
    }),
  );
  assert.throws(() =>
    getApiConfig({ API_ENDPOINT: "file:///tmp/test", API_KEY: "secret" }),
  );
});

test("UTF-8 demo password and escaped upstream JSON cannot leak credentials", async () => {
  const password = "mot-de-passe-épreuve";
  const authorization = `Basic ${Buffer.from(`manni:${password}`, "utf8").toString("base64")}`;
  assert.equal(
    await checkDemoAccess(
      req("transcribe/abc/status", { headers: { authorization } }),
      { ...env, NODE_ENV: "production", DEMO_ACCESS_PASSWORD: password },
    ),
    null,
  );
  const response = await handleProxy(
    req("transcribe/abc/status"),
    mockFetch(
      () =>
        new Response(
          '{"detail":["test-\\u0073erver-secret"],"nested":{"test-server-secret":"test-server-secret"}}',
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
    ),
    env,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    detail: ["[REDACTED]"],
    nested: { "[REDACTED]": "[REDACTED]" },
  });
});

test("accepts actual same-origin Host when Next normalizes the URL, but not forwarded-host spoofing", async () => {
  const upstream = mockFetch(() => Response.json({ status: "queued" }));
  const post = {
    method: "POST",
    body: "{}",
    headers: {
      "Content-Type": "application/json",
      host: "127.0.0.1:3000",
      origin: "http://127.0.0.1:3000",
    },
  };
  assert.equal(
    (await handleProxy(req("transcribe/abc", post), upstream, env)).status,
    200,
  );
  assert.equal(
    (
      await handleProxy(
        req("transcribe/abc", {
          ...post,
          headers: { ...post.headers, origin: "https://127.0.0.1:3000" },
        }),
        upstream,
        env,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleProxy(
        req("transcribe/abc", {
          ...post,
          headers: {
            ...post.headers,
            origin: "https://attacker.test",
            "x-forwarded-host": "attacker.test",
          },
        }),
        upstream,
        env,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await checkDemoAccess(
        req("transcribe/abc/status", { headers: { host: "attacker.test" } }),
        env,
      )
    )?.status,
    403,
  );
});
