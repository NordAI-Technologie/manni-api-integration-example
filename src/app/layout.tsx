import "server-only";
import type { Metadata } from "next";
import "./globals.css";
import { ApiConfigProvider } from "./components/ApiConfigProvider";

import { getApiConfig } from "../server/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API de Transcription de Manni - Démo d'intégration",
  description: "Démonstration d'intégration de l'API de transcription de Manni",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isConfigured = false;
  try {
    getApiConfig();
    isConfigured = true;
  } catch {
    /* Render setup instructions. */
  }
  return (
    <html lang="fr">
      <body className="font-sans">
        <ApiConfigProvider isConfigured={isConfigured}>
          {children}
        </ApiConfigProvider>
      </body>
    </html>
  );
}
