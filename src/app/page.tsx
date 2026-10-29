"use client";

import TranscriptionDemo from "./components/TranscriptionDemo";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        API de Transcription de Manni — Démo d’intégration
      </h1>

      <TranscriptionDemo />

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} - Démo d’intégration API</p>
      </footer>
    </div>
  );
}
