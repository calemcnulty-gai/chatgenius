/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features needed for Clerk
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 