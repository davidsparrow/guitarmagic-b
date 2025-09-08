/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Vercel to rebuild CSS by adding a cache buster
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Ensure CSS is properly handled
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  },
  
  // Ensure API routes are properly handled
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Environment variables for Stripe
  env: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Enable webpack for better debugging
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('stripe');
    }
    return config;
  },
};

module.exports = nextConfig;
