/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@velox/db', '@velox/shared'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
}

module.exports = nextConfig
