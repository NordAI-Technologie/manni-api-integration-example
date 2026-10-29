import test from "node:test";
import assert from "node:assert/strict";
import {
  ApiError,
  processAudioFile,
  pollTranscriptionStatus,
  parseResult,
} from "../src/app/services/transcriptionApi.ts";

const result = {
  status: "completed",
  result: {
    transcription: {
      utterances: [
        { start: 0, end: 2, text: "Bonjour", speaker: "SPEAKER_00" },
      ],
    },
  },
};

test("both small and large uploads await admission and poll without browser API credentials", async (t) => {
  for (const size of [4, 5 * 1024 * 1024]) {
    const calls: string[] = [];
    t.mock.method(
      globalThis,
      "fetch",
      async (url: string, init: RequestInit) => {
        assert.equal(new Headers(init.headers).has("x-api-key"), false);
        assert.equal(new Headers(init.headers).has("x-api-endpoint"), false);
        assert.ok(url.startsWith("/api/transcription-proxy?"));
        const path = new URL(url, "http://localhost").searchParams.get("path");
        calls.push(path!);
        if (path === "upload") return Response.json({ file_id: "job" });
        if (path === "transcribe/job")
          return Response.json({ status: "queued" });
        return Response.json({ status: "completed", result });
      },
    );
    const data = await processAudioFile(
      new File([new Uint8Array(size)], "audio.wav"),
    );
    assert.equal(data.text, "Bonjour");
    assert.deepEqual(calls, [
      "upload",
      "transcribe/job",
      "transcribe/job/status",
    ]);
    t.mock.restoreAll();
  }
});

test("rejected or unconfirmed admission never starts polling", async (t) => {
  for (const response of [
    () => Response.json({ detail: "Invalid key" }, { status: 401 }),
    () => Response.json({ message: "unknown" }),
  ]) {
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () =>
      ++calls === 1 ? Response.json({ file_id: "job" }) : response(),
    );
    await assert.rejects(processAudioFile(new File(["audio"], "audio.wav")));
    assert.equal(calls, 2);
    t.mock.restoreAll();
  }
});

test("permanent status errors stop immediately; zero or missing progress is not invented", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ detail: "No such job" }, { status: 404 });
  });
  await assert.rejects(
    pollTranscriptionStatus("job"),
    (error: unknown) => error instanceof ApiError && error.status === 404,
  );
  assert.equal(calls, 1);
  t.mock.restoreAll();
  const progress: (number | null)[] = [];
  const responses = [
    { status: "queued", progress: 0 },
    { status: "processing" },
    { status: "completed", result },
  ];
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(responses.shift()),
  );
  await pollTranscriptionStatus("job", (value) => progress.push(value), {
    intervalMs: 1,
  });
  assert.deepEqual(progress, [0, null, null]);
});

test("retry transient status failure but stop after five consecutive failures", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ error: "unavailable" }, { status: 503 });
  });
  await assert.rejects(
    pollTranscriptionStatus("job", undefined, { intervalMs: 1 }),
  );
  assert.equal(calls, 5);
});

test("deadline and cancellation stop polling without resubmitting a transcription", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ status: "processing" });
  });
  await assert.rejects(
    pollTranscriptionStatus("job", undefined, {
      intervalMs: 100,
      timeoutMs: 10,
    }),
    /Délai de suivi/,
  );
  assert.equal(calls, 1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    pollTranscriptionStatus("job", undefined, { signal: controller.signal }),
  );
  assert.equal(calls, 1);
});

test("terminal failure, nested failure and malformed result are never displayed as success", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ status: "failed", error: "GPU failed" }),
  );
  await assert.rejects(pollTranscriptionStatus("job"), /GPU failed/);
  assert.throws(
    () => parseResult({ status: "failed", error: "No transcription" }),
    /No transcription/,
  );
  assert.throws(
    () => parseResult({ status: "completed" }),
    /résultat est manquant/,
  );
  assert.equal(
    parseResult({ text: "Legacy plain text" }).text,
    "Legacy plain text",
  );
  assert.equal(parseResult({ result }).text, "Bonjour");
});
