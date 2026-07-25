import type { Metadata, Viewport } from 'next';
import { Press_Start_2P } from 'next/font/google';

import './globals.css';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-press-start',
});

export const metadata: Metadata = {
  title: 'Imposter',
  description: 'One of you is lying. A pass-and-play party game.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Imposter',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0E1020',
  width: 'device-width',
  initialScale: 1,
  // The reveal card is held with a finger; pinch-zoom would fight the gesture.
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={pixelFont.variable}>
      <body>{children}</body>
    </html>
  );
}
