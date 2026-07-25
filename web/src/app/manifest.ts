import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Imposter',
    short_name: 'Imposter',
    description: 'One of you is lying. A pass-and-play party game.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0E1020',
    theme_color: '#0E1020',
    icons: [
      {
        src: '/icon-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
