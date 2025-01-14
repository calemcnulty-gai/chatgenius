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

  // If you want to skip ESlint errors so they don't break builds:
  eslint: {
    ignoreDuringBuilds: false, // or true if you just want to ignore lint errors
  },

  // If you want to skip TS errors:
  typescript: {
    ignoreBuildErrors: false,
  },

  // This is not valid — remove it:
  // onError: (err) => { console.error('Build error:', err); },

  webpack: (config, { isServer }) => {
    // If you’d like to hide the “unsupported APIs for edge runtime” warnings
    // and you’re sure you’re deploying to Node only:
    config.ignoreWarnings = [
      { message: /MessageChannel|setImmediate|scheduler|MessageEvent/ }
    ];

    if (!isServer) {
      // Fallback for certain Node APIs in the client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        setImmediate: false,
        MessageChannel: false,
        MessageEvent: false,
      };
    }

    // More verbose webpack build stats
    config.stats = 'verbose';

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
