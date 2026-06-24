import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import VoiceAssistant from '../components/VoiceAssistant';

export const metadata: Metadata = {
  title: 'LaunchHub AI - Startup Asset Exchange & Operating System',
  description: 'Buy, build, hire, fund, and launch startups on LaunchHub AI. The first decentralized exchange for domain names, SaaS projects, AI datasets, ML models, and tech talent.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <VoiceAssistant />
      </body>
    </html>
  );
}
