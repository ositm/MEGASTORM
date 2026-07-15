import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lablink/core', '@lablink/server'],
  eslint: {
    // Lint debt is tracked separately; type errors DO fail the build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
