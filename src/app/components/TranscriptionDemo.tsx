'use client';

import React, { useState } from 'react';
import { useTranscription, TranscriptionResult } from '../services/api-client';

interface TranscriptionDemoProps {
}

const TranscriptionDemo: React.FC<TranscriptionDemoProps> = () => {
  const {
    status,
    progress,
    result,
    error,
    reset,
    processAudioFile
  } = useTranscription();

  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'demo' | 'code' | 'doc'>('demo');
  const [showCode, setShowCode] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setFileName(file.name);
      
      await processAudioFile(file, {
        language: null // Use automatic language detection
      });
    } catch (err) {
      console.error('Error processing file:', err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex space-x-4 mb-6">
        <button 
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${activeTab === 'demo' ? 'bg-[#209e67] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('demo')}
        >
          {" Démo Interactive "}
        </button>
        <button 
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${activeTab === 'code' ? 'bg-[#209e67] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('code')}
        >
          {" Code d'intégration "}
        </button>
        <button 
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${activeTab === 'doc' ? 'bg-[#209e67] text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('doc')}
        >
          {" Documentation "}
        </button>
      </div>

      {activeTab === 'demo' && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{" Démo d'intégration de l'API "}</h2>
          
          {status === 'idle' && (
            <div className="upload-section">
              <div className="border-2 border-dashed border-[#209e67]/40 rounded-lg p-8 text-center bg-[#209e67]/5 transition-all duration-300 hover:bg-[#209e67]/10">
                <svg className="w-16 h-16 mx-auto text-[#209e67] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="text-lg mb-4 text-gray-700">{" Déposez votre fichier audio ici ou cliquez pour parcourir "}</p>
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileUpload} 
                  className="w-full max-w-xs mx-auto bg-[#209e67] hover:bg-[#1c8a59] text-white py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 shadow-md"
                />
                <p className="text-sm text-gray-500 mt-3">{" Formats supportés : MP3, WAV, M4A, etc. "}</p>
              </div>
            </div>
          )}

          {status === 'uploading' && (
            <div className="processing-section text-center p-8">
                <div className="mx-auto mb-6 relative w-24 h-24">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-t-4 border-[#209e67] rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{" Téléchargement en cours... "}</h3>
                <p className="text-gray-600 mb-4">{" Nous préparons votre fichier "} <span className="font-medium text-[#209e67]">({fileName})</span></p>
                
                <div className="max-w-md mx-auto bg-gray-100 rounded-full h-2.5 mb-6 overflow-hidden">
                  <div className="bg-[#209e67] h-2.5 rounded-full animate-[upload_2s_ease-in-out_infinite]"></div>
                </div>
                
                <div className="bg-[#209e67]/10 rounded-lg p-4 max-w-md mx-auto text-left border border-[#209e67]/20">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-[#209e67] mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-sm text-gray-700">
                      {" Votre fichier audio est en cours de téléchargement vers nos serveurs sécurisés. Veuillez patienter pendant que nous le préparons pour la transcription. "}
                    </p>
                  </div>
                </div>
            </div>
          )}

          {status === 'transcribing' && (
            <div className="processing-section text-center p-8">
              <div className="relative mx-auto mb-6 w-24 h-24">
                <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-t-8 border-[#209e67] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 bg-[#209e67]/20 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-8 h-8 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3 text-gray-800">{" Transcription en cours... "}</h3>
              <div className="max-w-md mx-auto">
                <div className="bg-[#209e67]/10 rounded-lg p-4 mb-4 border border-[#209e67]/20">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-[#209e67] rounded-full mr-2 animate-pulse"></div>
                    <p className="text-[#209e67] font-medium">{" Traitement direct en cours "}</p>
                  </div>
                  <p className="text-sm text-gray-700">{" La transcription sera disponible dans quelques instants... "}</p>
                </div>

                <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {" À propos de la transcription directe : "}
                  </h4>
                  <p className="text-sm text-left text-gray-600">
                    {" Pour les fichiers courts (moins de 4 minutes), l'API utilise une méthode de transcription directe. "}
                    {" La requête reste ouverte jusqu'à ce que le traitement soit terminé et retourne directement le résultat. "}
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'polling' && (
            <div className="processing-section text-center p-8">
              <div className="relative h-32 w-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-[#209e67] transition-all duration-300 ease-in-out"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800">{progress}%</span>
                  <span className="text-xs text-gray-500">{" Progression "}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-gray-800">{" Transcription en cours... "}</h3>
              <p className="text-gray-600 mb-4">{" Fichier long en traitement asynchrone "}</p>
              
              <div className="mt-8 max-w-md mx-auto bg-white rounded-lg shadow-md p-4 border border-gray-100">
                <h4 className="font-semibold mb-4 text-center text-gray-800">{" Étapes de traitement "}</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progress > 0 ? 'bg-[#209e67]/20 text-[#209e67]' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h5 className="font-medium text-gray-800">{" Téléchargement "}</h5>
                      <p className="text-sm text-gray-500">{" Fichier audio reçu par le serveur "}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${progress > 10 ? 'bg-[#209e67]/20 text-[#209e67]' : 'bg-gray-100 text-gray-400'}`}>
                      {progress > 10 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <span className="text-gray-500">2</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <h5 className="font-medium text-gray-800">{" Pré-traitement "}</h5>
                      <p className="text-sm text-gray-500">{" Analyse et normalisation de l'audio "}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      progress > 60 ? 'bg-[#209e67]/20 text-[#209e67]' : 
                      progress > 30 ? 'bg-[#209e67]/10 text-[#209e67] animate-pulse' : 
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {progress > 60 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : progress > 30 ? (
                        <div className="w-3 h-3 bg-[#209e67] rounded-full"></div>
                      ) : (
                        <span className="text-gray-500">3</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <h5 className="font-medium text-gray-800">{" Reconnaissance vocale "}</h5>
                      <p className="text-sm text-gray-500">{" Conversion de la parole en texte "}</p>
                      {progress > 30 && progress <= 60 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className="bg-[#209e67] h-1.5 rounded-full transition-all duration-300" style={{ width: `${((progress - 30) * 100) / 30}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      progress > 95 ? 'bg-[#209e67]/20 text-[#209e67]' : 
                      progress > 60 ? 'bg-[#209e67]/10 text-[#209e67] animate-pulse' : 
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {progress > 95 ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : progress > 60 ? (
                        <div className="w-3 h-3 bg-[#209e67] rounded-full"></div>
                      ) : (
                        <span className="text-gray-500">4</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <h5 className="font-medium text-gray-800">{" Finalisation "}</h5>
                      <p className="text-sm text-gray-500">{" Organisation et formatage des résultats "}</p>
                      {progress > 60 && progress <= 95 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className="bg-[#209e67] h-1.5 rounded-full transition-all duration-300" style={{ width: `${((progress - 60) * 100) / 35}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <div className="flex items-end space-x-1 h-16">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const height = 30 + Math.sin((Date.now() / 1000) + (i * 0.3)) * 15 + 
                                 Math.cos((Date.now() / 800) + (i * 0.5)) * 10;
                                 
                    return (
                      <div
                        key={i}
                        className="bg-[#209e67] w-1.5 rounded-full transition-all duration-150"
                        style={{ 
                          height: `${height}%`,
                          opacity: 0.5 + Math.sin((Date.now() / 1000) + (i * 0.5)) * 0.5
                        }}
                      ></div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-8 max-w-md mx-auto bg-[#209e67]/10 p-4 rounded-lg text-left border border-[#209e67]/20">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-[#209e67] mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      {" Le traitement d'un fichier long peut prendre plusieurs minutes. La transcription continue même si vous fermez cette page. "}
                    </p>
                    <p className="text-sm text-gray-700">
                      {" Estimation du temps restant : "}
                      <span className="font-medium text-[#209e67]">
                        {progress < 30 ? "5-10 minutes" : 
                        progress < 60 ? "3-5 minutes" : 
                        progress < 90 ? "1-2 minutes" : 
                        "Moins d'une minute"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {status === 'completed' && result && (
            <div className="result-section">
              <div className="flex items-center mb-4">
                <div className="bg-[#209e67]/20 p-2 rounded-full mr-3">
                  <svg className="w-6 h-6 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{" Transcription terminée "}</h3>
              </div>
              
              <div className="mb-8 bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-100">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  {" Texte complet : "}
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700 shadow-inner">
                  {result.text || 
                   (result.result?.transcription?.utterances && 
                    result.result.transcription.utterances.map(u => u.text).join(' '))}
                </div>
              </div>
              
              <div className="mb-8">
                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                  </svg>
                  {" Segments : "}
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
                  {(result.segments || 
                   (result.result?.transcription?.utterances || [])).map((segment, index) => {
                    const segmentData = segment.text ? segment : {
                      start: segment.start,
                      end: segment.end,
                      text: segment.text
                    };
                    
                    return (
                      <div 
                        key={index} 
                        className="border-b border-gray-200 p-4 last:border-b-0 transition-colors duration-200 hover:bg-[#209e67]/5"
                      >
                        <div className="flex items-center mb-2">
                          <div className="bg-[#209e67]/10 text-[#209e67] text-xs font-medium px-2 py-1 rounded flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            {segmentData.start.toFixed(1)}s - {segmentData.end.toFixed(1)}s
                          </div>
                          
                          {segment.speaker && (
                            <div className="ml-2 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                              <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                              {segment.speaker}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-gray-800 pl-1">{segmentData.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
                
              <div className="flex space-x-4 justify-center">
                <button 
                  onClick={reset}
                  className="bg-[#209e67] hover:bg-[#1c8a59] text-white py-2 px-6 rounded-md flex items-center transition-colors duration-200 shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  {" Traiter un autre fichier "}
                </button>

                <button 
                  onClick={() => {
                    const blob = new Blob([result.text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `transcription_${new Date().toISOString().slice(0, 10)}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 py-2 px-6 rounded-md flex items-center transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  {" Télécharger le texte "}
                </button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="error-section text-center p-8 bg-red-50 rounded-lg border border-red-100">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-xl font-semibold text-red-600 mb-2">{" Erreur de transcription "}</h3>
              <p className="text-gray-700 mb-4">{error}</p>
              <button 
                onClick={reset}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-md transition-colors duration-200 shadow-md"
              >
                {" Réessayer "}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'code' && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{" Code d'intégration "}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{" 1. Configuration de l'environnement "}</h3>
              <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-gray-200 shadow-md">
                <p>// Dans votre fichier .env.local</p>
                <p className="text-[#209e67]">NEXT_PUBLIC_API_ENDPOINT=https://votre-api-endpoint.com</p>
                <p className="text-[#209e67]">NEXT_PUBLIC_API_KEY=votre-api-key</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{" 2. Upload du fichier "}</h3>
              <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-gray-200 shadow-md">
                <p>// Préparation des données</p>
                <p>const formData = new FormData()</p>
                <p>formData.append('file', votreFileObject)</p>
                <p></p>
                <p>// Requête d'upload</p>
                <p>const uploadResponse = await fetch(`${'{API_ENDPOINT}'}/api/upload`, {'{'}</p>
                <p>  method: 'POST',</p>
                <p>  headers: {'{'} 'x-api-key': API_KEY {'}'},</p>
                <p>  body: formData</p>
                <p>{'}'})</p>
                <p></p>
                <p>// Récupération de l'ID du fichier</p>
                <p>const {'{'} file_id {'}'} = await uploadResponse.json()</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{" 3. Transcription et polling "}</h3>
              <div className="flex mb-2">
                <button 
                  className={`px-3 py-1 rounded-t border border-gray-300 ${!showCode ? 'bg-[#209e67] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors duration-200`}
                  onClick={() => setShowCode(false)}
                >
                  {" Fichier court "}
                </button>
                <button 
                  className={`px-3 py-1 rounded-t border border-gray-300 ${showCode ? 'bg-[#209e67] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors duration-200`}
                  onClick={() => setShowCode(true)}
                >
                  {" Fichier long "}
                </button>
              </div>
              
              {!showCode ? (
                <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-gray-200 shadow-md">
                  <p>// Pour les fichiers courts (&lt;4 minutes)</p>
                  <p>const transcribeResponse = await fetch(`${'{API_ENDPOINT}'}/api/transcribe/${'{file_id}'}`, {'{'}</p>
                  <p>  method: 'POST',</p>
                  <p>  headers: {'{'}</p>
                  <p>    'Content-Type': 'application/json',</p>
                  <p>    'x-api-key': API_KEY</p>
                  <p>  {'}'},</p>
                  <p>  body: JSON.stringify({'{'}</p>
                  <p>    language: null // optionnel, null pour détection automatique</p>
                  <p>  {'}'})</p>
                  <p>{'}'})</p>
                  <p></p>
                  <p>// Récupération du résultat</p>
                  <p>const result = await transcribeResponse.json()</p>
                </div>
              ) : (
                <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-gray-200 shadow-md">
                  <p>{"// Pour les fichiers longs (>4 minutes)"}</p>
                  <p>// 1. Initier la transcription (sans attendre la réponse complète)</p>
                  <p>fetch(`${'{API_ENDPOINT}'}/api/transcribe/${'{file_id}'}`, {'{'}</p>
                  <p>  method: 'POST',</p>
                  <p>  headers: {'{'}</p>
                  <p>    'Content-Type': 'application/json',</p>
                  <p>    'x-api-key': API_KEY</p>
                  <p>  {'}'},</p>
                  <p>  body: JSON.stringify({'{'}</p>
                  <p>    language: null // optionnel</p>
                  <p>  {'}'})</p>
                  <p>{'}'})</p>
                  <p></p>
                  <p>// 2. Vérifier périodiquement l'état de la transcription</p>
                  <p>function pollTranscriptionStatus(fileId: string): Promise&lt;any&gt; {'{'}</p>
                  <p>{"  return new Promise((resolve, reject) => {'{'}"}</p>
                  <p>    let attempts = 0;</p>
                  <p>{"    const checkStatus = async () => {'{'}"}</p>
                  <p>      try {'{'}</p>
                  <p>        const statusResponse = await fetch(</p>
                  <p>          `${'{API_ENDPOINT}'}/api/transcribe/${'{fileId}'}/status`,</p>
                  <p>          {'{'}</p>
                  <p>            method: 'GET',</p>
                  <p>            headers: {'{'} 'x-api-key': API_KEY {'}'}</p>
                  <p>          {'}'}</p>
                  <p>        );</p>
                  <p>        </p>
                  <p>        const status = await statusResponse.json();</p>
                  <p>        </p>
                  <p>        if (status.status === 'completed') {'{'}</p>
                  <p>          resolve(status.result);</p>
                  <p>        {'}'} else if (status.status === 'failed') {'{'}</p>
                  <p>          reject(new Error(status.error || 'Transcription failed'));</p>
                  <p>        {'}'} else {'{'}</p>
                  <p>          // Backoff exponentiel</p>
                  <p>          attempts++;</p>
                  <p>          const delay = Math.min(5000 * Math.pow(1.5, attempts), 30000);</p>
                  <p>          setTimeout(checkStatus, delay);</p>
                  <p>        {'}'}</p>
                  <p>      {'}'} catch (error) {'{'}</p>
                  <p>        setTimeout(checkStatus, 5000);</p>
                  <p>      {'}'}</p>
                  <p>    {'}'};</p>
                  <p>    </p>
                  <p>    checkStatus();</p>
                  <p>  {'}'});</p>
                  <p>{'}'}</p>
                  <p></p>
                  <p>// Utilisation</p>
                  <p>const transcription = await pollTranscriptionStatus(file_id);</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'doc' && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{" Documentation de l'API "}</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{" Aperçu "}</h3>
              <p className="mb-4 text-gray-700">{" L'API de transcription de Manni offre deux méthodes pour traiter les fichiers, choisies automatiquement selon la durée estimée du fichier : "}</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li><strong className="text-gray-800">{" Transcription directe : "}</strong>{" pour les fichiers courts (<4 minutes) "}</li>
                <li><strong className="text-gray-800">{" Transcription avec polling : "}</strong>{" pour les fichiers longs (>4 minutes) "}</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{" Endpoints "}</h3>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <span className="inline-block bg-[#209e67] text-white text-xs font-semibold px-2 py-1 rounded mr-2">POST</span>
                    <span className="font-mono text-gray-800">/api/upload</span>
                  </div>
                  <div className="p-4">
                    <p className="mb-3 text-gray-700">{" Télécharge un fichier audio sur le serveur "}</p>
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-1 text-gray-800">{" Headers: "}</h4>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">{" x-api-key: votre-api-key "}</p>
                    </div>
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-1 text-gray-800">{" Body: "}</h4>
                      <p className="text-sm text-gray-700">{" form-data avec le champ "} <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[#209e67]">file</span> {" contenant le fichier audio "}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-gray-800">{" Réponse: "}</h4>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">
                        <p>{'{'}</p>
                        <p className="text-[#209e67]">  "file_id": "identifiant-unique-du-fichier"</p>
                        <p>{'}'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <span className="inline-block bg-[#209e67] text-white text-xs font-semibold px-2 py-1 rounded mr-2">POST</span>
                    <span className="font-mono text-gray-800">/api/transcribe/{'{file_id}'}</span>
                  </div>
                  <div className="p-4">
                    <p className="mb-3 text-gray-700">{" Démarre le processus de transcription pour un fichier préalablement téléchargé "}</p>
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-1 text-gray-800">{" Headers: "}</h4>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">{" Content-Type: application/json "}<br/>{" x-api-key: votre-api-key "}</p>
                    </div>
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-1 text-gray-800">{" Body: "}</h4>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">
                        <p>{'{'}</p>
                        <p className="text-[#209e67]">  "language": "string" // Optionnel, null pour la détection automatique</p>
                        <p>{'}'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <span className="inline-block bg-[#209e67] text-white text-xs font-semibold px-2 py-1 rounded mr-2">GET</span>
                    <span className="font-mono text-gray-800">/api/transcribe/{'{file_id}'}/status</span>
                  </div>
                  <div className="p-4">
                    <p className="mb-3 text-gray-700">{" Vérifie l'état d'une tâche de transcription "}</p>
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-1 text-gray-800">{" Headers: "}</h4>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">{" x-api-key: votre-api-key "}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-gray-800">{" Réponse: "}</h4>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">
                        <p>{'{'}</p>
                        <p>  "status": <span className="text-[#209e67]">"pending|processing|completed|failed"</span>,</p>
                        <p>  "progress": <span className="text-[#209e67]">45</span>, // pourcentage (optionnel)</p>
                        <p>  "result": {'{}'}, // présent uniquement si completed</p>
                        <p>  "error": <span className="text-[#209e67]">""</span> // présent uniquement si failed</p>
                        <p>{'}'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{" Points importants "}</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="bg-[#209e67]/10 rounded-full p-1 mr-2 mt-0.5">
                    <svg className="w-4 h-4 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <strong className="text-gray-800">{" Estimation de la durée : "}</strong>{" L'API estime la durée du fichier audio en fonction de sa taille (≈1MB par minute). "}
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-[#209e67]/10 rounded-full p-1 mr-2 mt-0.5">
                    <svg className="w-4 h-4 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <strong className="text-gray-800">{" Timeouts : "}</strong>
                    <ul className="mt-1 ml-5 space-y-1">
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-[#209e67] rounded-full mr-2"></div>
                        {" Méthode directe : timeout après 5 minutes "}
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-[#209e67] rounded-full mr-2"></div>
                        {" Méthode avec polling : vérifie pendant 30 minutes maximum "}
                      </li>
                    </ul>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-[#209e67]/10 rounded-full p-1 mr-2 mt-0.5">
                    <svg className="w-4 h-4 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <div>
                    <strong className="text-gray-800">{" Gestion des erreurs : "}</strong>{" Même si une requête échoue, continuez à vérifier le statut car le processus peut continuer en arrière-plan. "}
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-[#209e67]/10 rounded-full p-1 mr-2 mt-0.5">
                    <svg className="w-4 h-4 text-[#209e67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <strong className="text-gray-800">{" Backoff exponentiel : "}</strong>{" Augmentez progressivement le temps entre les vérifications pour réduire la charge sur le serveur. "}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionDemo;