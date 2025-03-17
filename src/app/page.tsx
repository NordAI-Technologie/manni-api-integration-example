'use client';

import TranscriptionDemo from './components/TranscriptionDemo';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        API de Transcription de Manni - Démo d'intégration
      </h1>
      
      <Suspense fallback={<div>Chargement...</div>}>
        <TranscriptionDemo />
      </Suspense>
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© 2025 - Démo d'intégration API</p>
      </footer>
    </div>
  );
}

