import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No server work anywhere in this app, so it exports to plain static files.
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
