import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ApiConfigProvider } from './components/ApiConfigProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'API de Transcription de Manni - Démo d\'intégration',
  description: 'Démonstration d\'intégration de l\'API de transcription de Manni',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ApiConfigProvider>
          {children}
        </ApiConfigProvider>
      </body>
    </html>
  );
}