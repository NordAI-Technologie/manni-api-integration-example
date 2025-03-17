export interface UploadResponse {
    file_id: string;
  }
  
  export interface TranscriptionSegment {
    start: number;
    end: number;
    speaker: string;
    text: string;
  }
  
  export interface TranscriptionResult {
    text: string;
    result: {
        transcription: {
            utterances: {
                start: number;
                end: number;
                transcript: string;
            }
        }
    }
    segments: TranscriptionSegment[];
  }
  
  export interface TranscriptionStatusResponse {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: TranscriptionResult;
    error?: string;
  }
  
  export interface TranscriptionOptions {
    language?: string | null;
    onUploadComplete?: (fileId: string) => void;
    onProgress?: (progress: number) => void;
  }
  
  const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  
  /**
   * Télécharge un fichier audio vers l'API
   * @param {File} file - Le fichier audio à télécharger
   * @returns {Promise<UploadResponse>} - Un objet contenant l'ID du fichier
   */
  export async function uploadFile(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch(`${API_ENDPOINT}/api/upload`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY as string,
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
  
      return response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  /**
   * Démarre la transcription d'un fichier audio
   * @param {string} fileId - L'ID du fichier à transcrire
   * @param {string|null} language - Code de langue optionnel (null pour détection auto)
   * @returns {Promise<TranscriptionResult|any>} - Les résultats de la transcription ou un accusé de réception
   */
  export async function transcribeFile(fileId: string, language: string | null = null): Promise<any> {
    try {
      const response = await fetch(`${API_ENDPOINT}/api/transcribe/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY as string,
        },
        body: JSON.stringify({
          language,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
      }
  
      return response.json();
    } catch (error) {
      console.error('Error transcribing file:', error);
      throw error;
    }
  }
  
  /**
   * Vérifie l'état d'une tâche de transcription
   * @param {string} fileId - L'ID du fichier
   * @returns {Promise<TranscriptionStatusResponse>} - L'état actuel de la transcription
   */
  export async function getTranscriptionStatus(fileId: string): Promise<TranscriptionStatusResponse> {
    try {
      const response = await fetch(`${API_ENDPOINT}/api/transcribe/${fileId}/status`, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY as string,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }
  
      return response.json();
    } catch (error) {
      console.error('Error checking transcription status:', error);
      throw error;
    }
  }
  
  /**
   * Fonction pour gérer la vérification périodique de l'état d'une transcription
   * Utilise le backoff exponentiel pour espacer les requêtes
   * @param {string} fileId - L'ID du fichier
   * @param {Function} onProgress - Callback pour les mises à jour de progression
   * @returns {Promise<TranscriptionResult>} - Les résultats finaux de la transcription
   */
  export function pollTranscriptionStatus(
    fileId: string, 
    onProgress?: (progress: number) => void
  ): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkStatus = async () => {
        try {
          const statusResponse = await getTranscriptionStatus(fileId);
          
          if (statusResponse.status === 'completed' && statusResponse.result) {
            resolve(statusResponse.result);
          } else if (statusResponse.status === 'failed') {
            reject(new Error(statusResponse.error || 'La transcription a échoué'));
          } else {
            if (statusResponse.progress !== undefined && typeof onProgress === 'function') {
              onProgress(statusResponse.progress);
            }
            
            attempts++;
            const delay = Math.min(5000 * Math.pow(1.5, attempts), 30000);
            setTimeout(checkStatus, delay);
          }
        } catch (error) {
          setTimeout(checkStatus, 5000);
        }
      };
      
      checkStatus();
    });
  }
  
  /**
   * Fonction complète pour gérer le workflow de transcription
   * @param {File} file - Le fichier audio à transcrire
   * @param {TranscriptionOptions} options - Options supplémentaires
   * @returns {Promise<TranscriptionResult>} - Les résultats finaux de la transcription
   */
  export async function processAudioFile(
    file: File, 
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const { 
      language = null, 
      onUploadComplete = () => {}, 
      onProgress = () => {} 
    } = options;
    const uploadResponse = await uploadFile(file);
    const fileId = uploadResponse.file_id;
    
    onUploadComplete(fileId);
    
    const isLongFile = file.size > 4 * 1024 * 1024;
    
    if (!isLongFile) {
      return await transcribeFile(fileId, language);
    } else {
      await transcribeFile(fileId, language);
      return await pollTranscriptionStatus(fileId, onProgress);
    }
  }