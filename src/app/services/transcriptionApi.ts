export interface TranscriptionSegment {
  start: number;
  end: number;
  speaker: string | null;
  text: string;
}
export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  raw: unknown;
}
export interface SpeakerOptions {
  language_hint?: string | null;
  num_speakers?: number | null;
  min_speakers?: number | null;
  max_speakers?: number | null;
}
export interface TranscriptionStatusResponse {
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  progress?: number;
  result?: unknown;
  error?: string;
  file_id?: string;
}
export interface TranscriptionOptions extends SpeakerOptions {
  language?: string | null;
  signal?: AbortSignal;
  onUploadComplete?: (fileId: string) => void;
  onProgress?: (progress: number | null) => void;
  onState?: (state: "uploading" | "transcribing" | "polling") => void;
}
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

async function request<T>(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
  timeout = 35_000,
): Promise<T> {
  const response = await fetch(
    `/api/transcription-proxy?${new URLSearchParams({ path })}`,
    {
      ...init,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
        : AbortSignal.timeout(timeout),
      cache: "no-store",
    },
  );
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "Réponse illisible du serveur.",
      response.ok ? 502 : response.status,
    );
  }
  signal?.throwIfAborted();
  if (!response.ok) {
    const message =
      isRecord(data) &&
      (typeof data.error === "string"
        ? data.error
        : typeof data.detail === "string"
          ? data.detail
          : null);
    throw new ApiError(
      message || `La requête a échoué (HTTP ${response.status}).`,
      response.status,
    );
  }
  return data as T;
}

export async function uploadFile(
  file: File,
  signal?: AbortSignal,
): Promise<{ file_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await request<{ file_id: string }>(
    "upload",
    { method: "POST", body: formData },
    signal,
    125_000,
  );
  if (!response.file_id || typeof response.file_id !== "string")
    throw new Error("Le serveur n’a pas retourné d’identifiant de fichier.");
  return response;
}

export function transcribeFile(
  fileId: string,
  language: string | null = null,
  speakers: SpeakerOptions = {},
  signal?: AbortSignal,
) {
  return request<TranscriptionStatusResponse>(
    `transcribe/${fileId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, ...speakers }),
    },
    signal,
  );
}
export function getTranscriptionStatus(fileId: string, signal?: AbortSignal) {
  return request<TranscriptionStatusResponse>(
    `transcribe/${fileId}/status`,
    { method: "GET" },
    signal,
  );
}

export function parseResult(raw: unknown): TranscriptionResult {
  let data = raw;
  for (let level = 0; level < 4 && isRecord(data); level++) {
    if (data.status === "failed")
      throw new Error(
        typeof data.error === "string"
          ? data.error
          : "La transcription a échoué.",
      );
    const utterances = isRecord(data.transcription)
      ? data.transcription.utterances
      : data.segments;
    if (Array.isArray(utterances)) {
      const segments = utterances.map((value): TranscriptionSegment => {
        if (
          !isRecord(value) ||
          (typeof value.text !== "string" &&
            typeof value.transcript !== "string")
        )
          throw new Error("Format de transcription inattendu.");
        return {
          start: Number(value.start) || 0,
          end: Number(value.end) || 0,
          speaker: typeof value.speaker === "string" ? value.speaker : null,
          text: String(value.text ?? value.transcript),
        };
      });
      return {
        text:
          typeof data.text === "string"
            ? data.text
            : segments
                .map((s) => s.text)
                .join(" ")
                .trim(),
        segments,
        raw,
      };
    }
    if (typeof data.text === "string")
      return { text: data.text, segments: [], raw };
    data = data.result;
  }
  throw new Error(
    "Le traitement est terminé mais son résultat est manquant ou illisible.",
  );
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function pollTranscriptionStatus(
  fileId: string,
  onProgress?: (progress: number | null) => void,
  options: {
    signal?: AbortSignal;
    timeoutMs?: number;
    intervalMs?: number;
  } = {},
): Promise<TranscriptionResult> {
  const deadline = AbortSignal.timeout(options.timeoutMs ?? 30 * 60_000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, deadline])
    : deadline;
  let consecutiveFailures = 0;
  let delay = options.intervalMs ?? 2_000;
  try {
    while (true) {
      signal.throwIfAborted();
      try {
        const data = await getTranscriptionStatus(fileId, signal);
        consecutiveFailures = 0;
        onProgress?.(
          typeof data.progress === "number" &&
            Number.isFinite(data.progress) &&
            data.progress >= 0 &&
            data.progress <= 100
            ? data.progress
            : null,
        );
        if (data.status === "completed") return parseResult(data.result);
        if (data.status === "failed")
          throw new Error(data.error || "La transcription a échoué.");
        if (!["pending", "queued", "processing"].includes(data.status))
          throw new Error("État de transcription inconnu.");
      } catch (error) {
        if (signal.aborted) throw error;
        const transient =
          error instanceof ApiError
            ? [429, 502, 503, 504].includes(error.status)
            : error instanceof TypeError ||
              (error instanceof Error && error.name === "TimeoutError");
        if (!transient || ++consecutiveFailures >= 5) throw error;
      }
      await wait(delay, signal);
      delay = Math.min(Math.round(delay * 1.5), 10_000);
    }
  } catch (error) {
    if (deadline.aborted && !options.signal?.aborted)
      throw new Error(
        "Délai de suivi dépassé. Reprenez le suivi avec le même identifiant, sans renvoyer le fichier.",
      );
    throw error;
  }
}

export async function processAudioFile(
  file: File,
  options: TranscriptionOptions = {},
): Promise<TranscriptionResult> {
  options.onState?.("uploading");
  const { file_id } = await uploadFile(file, options.signal);
  options.onUploadComplete?.(file_id);
  options.onState?.("transcribing");
  const admission = await transcribeFile(
    file_id,
    options.language ?? null,
    {
      language_hint: options.language_hint,
      num_speakers: options.num_speakers,
      min_speakers: options.min_speakers,
      max_speakers: options.max_speakers,
    },
    options.signal,
  );
  if (admission.status === "completed") return parseResult(admission.result);
  if (admission.status === "failed")
    throw new Error(admission.error || "La transcription a échoué.");
  if (!["pending", "queued", "processing"].includes(admission.status))
    throw new Error("Le serveur n’a pas confirmé le lancement.");
  options.onState?.("polling");
  return pollTranscriptionStatus(file_id, options.onProgress, {
    signal: options.signal,
  });
}
