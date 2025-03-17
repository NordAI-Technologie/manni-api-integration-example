'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useApiConfig } from '../components/ApiConfigProvider';

export interface TranscriptionResult {
  text: string;
  result: {
    transcription: {
        utterances: [{
            start: number;
            end: number;
            transcript: string;
            text: string;
        }]
    }
  },
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  start: number;
  speaker: string;
  end: number;
  text: string;
}

export type TranscriptionStatus = 'idle' | 'uploading' | 'transcribing' | 'polling' | 'completed' | 'failed';

export function useTranscription() {
  const { apiConfig, isConfigured } = useApiConfig();
  const [fileId, setFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLongFile, setIsLongFile] = useState<boolean>(false);
  
  const pollingRef = useRef<boolean>(false);
  const pollCountRef = useRef<number>(0);
  
  useEffect(() => {
    return () => {
      pollingRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setFileId(null);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setIsLongFile(false);
    pollingRef.current = false;
    pollCountRef.current = 0;
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!isConfigured) {
      throw new Error('API not configured. Please provide API endpoint and key');
    }

    try {
      setStatus('uploading');
      
      const fileSizeMB = file.size / (1024 * 1024);
      setIsLongFile(fileSizeMB > 4);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transcription-proxy?path=upload', {
        method: 'POST',
        headers: {
          'x-api-endpoint': apiConfig.apiEndpoint,
          'x-api-key': apiConfig.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const newFileId = data.file_id;
      setFileId(newFileId);
      return newFileId;
    } catch (err) {
      setStatus('failed');
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'upload';
      setError(errorMessage);
      throw err;
    }
  }, [apiConfig.apiEndpoint, apiConfig.apiKey, isConfigured]);

  const startTranscription = useCallback(async (fileId: string, language = null): Promise<any> => {
    if (!isConfigured) {
      throw new Error('API not configured. Please provide API endpoint and key');
    }

    try {
      setStatus('polling');
      setProgress(5);
  
      await fetch(`/api/transcription-proxy?path=transcribe/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-endpoint': apiConfig.apiEndpoint,
          'x-api-key': apiConfig.apiKey,
        },
        body: JSON.stringify({
          language: language,
        }),
      });

      console.log("Transcription initiated, starting polling for status");
      
      return startPolling(fileId);
    } catch (err) {
      console.error("Error starting transcription:", err);
      console.log("Starting polling despite error");
      startPolling(fileId);
      return { status: 'polling', file_id: fileId };
    }
  }, [apiConfig.apiEndpoint, apiConfig.apiKey, isConfigured]);

  const startPolling = useCallback((fileId: string) => {
    if (!isConfigured) {
      throw new Error('API not configured. Please provide API endpoint and key');
    }

    setStatus('polling');
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/transcription-proxy?path=transcribe/${fileId}/status`, {
          method: 'GET',
          headers: {
            'x-api-endpoint': apiConfig.apiEndpoint,
            'x-api-key': apiConfig.apiKey,
          },
        });
        
        if (!response.ok) {
          console.log("Status check failed, retrying in 5 seconds");
          setTimeout(checkStatus, 5000);
          return;
        }
        
        const statusData = await response.json();
        console.log("Received status:", statusData);
        
        if (statusData.progress) {
          setProgress(statusData.progress);
        } else {
          setProgress(prev => Math.min(prev + 2, 95));
        }
        
        if (statusData.status === 'completed' && statusData.result) {
          console.log("Transcription completed!");
          
          const transformedResult = transformApiResult(statusData);
          setResult(transformedResult);
          setStatus('completed');
          return;
        }
        
        if (statusData.status === 'failed') {
          setStatus('failed');
          setError(statusData.error || 'La transcription a échoué');
          return;
        }
        
        setTimeout(checkStatus, 5000);
      } catch (error) {
        console.error("Error checking status:", error);
        setTimeout(checkStatus, 5000);
      }
    };
    
    checkStatus();
  }, [apiConfig.apiEndpoint, apiConfig.apiKey, isConfigured]);

  const transformApiResult = (apiResponse: any): TranscriptionResult => {
    if (
      apiResponse?.result?.result?.transcription?.utterances &&
      Array.isArray(apiResponse.result.result.transcription.utterances)
    ) {
      const utterances = apiResponse.result.result.transcription.utterances;
      
      const fullText = utterances
        .map((u: any) => u.text)
        .join(' ')
        .trim();
      
      const segments = utterances.map((utterance: { start: number; end: number; text: string }) => ({
        start: utterance.start,
        end: utterance.end,
        text: utterance.text
      }));
      
      return {
        text: fullText,
        result: apiResponse.result.result,
        segments: segments
      };
    } else if (apiResponse?.result?.text) {
      return apiResponse.result;
    } else {
      console.warn("Unexpected API response format:", apiResponse);
      return {
        text: "La transcription est terminée, mais le format des données n'est pas celui attendu.",
        result: apiResponse.result,
        segments: []
      };
    }
  };

  const processAudioFile = useCallback(async (file: File, options = {}): Promise<any> => {
    if (!isConfigured) {
      throw new Error('API not configured. Please provide API endpoint and key');
    }

    try {
      const fileId = await uploadFile(file);
      
      return await startTranscription(fileId, (options as any).language);
    } catch (err) {
      console.error('Error processing audio file:', err);
      throw err;
    }
  }, [uploadFile, startTranscription, isConfigured]);

  return {
    fileId,
    status,
    progress,
    result,
    error,
    isLongFile,
    isConfigured,
    reset,
    uploadFile,
    startTranscription,
    processAudioFile
  };
}