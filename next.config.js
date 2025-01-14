/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com'],
  },
  staticPageGenerationTimeout: 180,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['@heroicons/react', '@clerk/nextjs'],
    workerThreads: true,
  },
  compiler: {
    removeConsole: false,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',

  // TypeScript error handling
  typescript: {
    // Don't ignore build errors
    ignoreBuildErrors: false,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Suppress Edge runtime warnings from dependencies
    config.ignoreWarnings = [
      { message: /MessageChannel|setImmediate|scheduler|MessageEvent/ }
    ];

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        setImmediate: false,
        MessageChannel: false,
        MessageEvent: false,
      };
    }

    // Always show detailed stats in production builds
    config.stats = {
      colors: true,
      errors: true,
      errorDetails: true,
      moduleTrace: true
    };

    return config;
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
