import type { Metadata } from 'next';
import './tailwind.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anima Pulse — Internal Operations Dashboard',
  description: 'Single source of truth operasional tim media sosial Anima Companion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" data-density="comfortable" data-display="minimal">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
