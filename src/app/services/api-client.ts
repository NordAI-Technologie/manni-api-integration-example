"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  processAudioFile as process,
  pollTranscriptionStatus,
  type TranscriptionResult,
  type TranscriptionOptions,
} from "./transcriptionApi";
import { useApiConfig } from "../components/ApiConfigProvider";

export type { TranscriptionResult } from "./transcriptionApi";
export type TranscriptionStatus =
  | "idle"
  | "uploading"
  | "transcribing"
  | "polling"
  | "completed"
  | "failed";

export function useTranscription() {
  const { isConfigured } = useApiConfig();
  const [fileId, setFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setFileId(null);
    setStatus("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);
  const run = useCallback(
    async (action: (signal: AbortSignal) => Promise<TranscriptionResult>) => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      setError(null);
      setProgress(null);
      try {
        const data = await action(current.signal);
        if (!current.signal.aborted) {
          setResult(data);
          setStatus("completed");
        }
      } catch (error) {
        if (!current.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "La requête a échoué.",
          );
          setStatus("failed");
        }
      }
    },
    [],
  );
  const processAudioFile = useCallback(
    (file: File, options: TranscriptionOptions = {}) => {
      if (!isConfigured) {
        setError("Configurez la connexion sur le serveur.");
        setStatus("failed");
        return Promise.resolve();
      }
      setFileId(null);
      setResult(null);
      return run((signal) =>
        process(file, {
          ...options,
          signal,
          onUploadComplete: setFileId,
          onProgress: setProgress,
          onState: setStatus,
        }),
      );
    },
    [isConfigured, run],
  );
  const resume = useCallback(() => {
    if (!fileId) return Promise.resolve();
    setStatus("polling");
    return run((signal) =>
      pollTranscriptionStatus(fileId, setProgress, { signal }),
    );
  }, [fileId, run]);
  const stop = useCallback(() => {
    controller.current?.abort();
    setStatus("failed");
    setError(
      "Suivi arrêté dans le navigateur. Le traitement déjà accepté peut continuer sur le serveur.",
    );
  }, []);
  return {
    fileId,
    status,
    progress,
    result,
    error,
    reset,
    stop,
    resume,
    processAudioFile,
  };
}
