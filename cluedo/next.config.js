/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel deploys Next.js with zero config
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
