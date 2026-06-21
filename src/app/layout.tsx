import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PULSE - AI Congestion Copilot | Bengaluru Traffic Police',
  description:
    'AI-driven Event-Driven Congestion Copilot for Bengaluru Traffic Police. Predicts traffic bottlenecks and recommends dynamic resource allocation using RAG-powered intelligence.',
  keywords: [
    'traffic management',
    'AI copilot',
    'Bengaluru traffic',
    'congestion prediction',
    'RAG',
    'smart city',
  ],
  authors: [{ name: 'Pulse Team' }],
  openGraph: {
    title: 'PULSE - AI Congestion Copilot',
    description: 'Predict and manage traffic bottlenecks in real-time with AI-powered intelligence.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type='x-icon' href="/logo.png" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
