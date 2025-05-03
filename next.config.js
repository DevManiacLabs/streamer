/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  // Using experimental options for server packages
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
};

module.exports = nextConfig; 