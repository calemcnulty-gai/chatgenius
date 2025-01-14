/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com'],
  },
  staticPageGenerationTimeout: 180,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    optimizePackageImports: ['@heroicons/react', '@clerk/nextjs'],
    workerThreads: true
  },
  compiler: {
    removeConsole: false,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Disable static page generation for all routes
  // generateStaticParams: () => [],
  generateBuildId: () => 'build',
  serverRuntimeConfig: {
    runtime: 'nodejs'
  },
  // Suppress Edge runtime warnings from dependencies
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'setImmediate': false,
        'MessageChannel': false,
        'MessageEvent': false,
      };
    }
    // Enable more verbose webpack output
    config.stats = 'verbose';
    return config;
  },
  // Show more detailed build output
  onError: (err) => {
    console.error('Build error:', err);
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}

module.exports = nextConfig 