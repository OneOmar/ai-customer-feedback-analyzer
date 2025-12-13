/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image domains if needed for external images
  images: {
    domains: [],
  },
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
  
  // Webpack configuration to prevent memory allocation errors
  // Keep webpack for builds that need it (Turbopack is default in Next.js 16)
  webpack: (config, { dev, isServer }) => {
    // In development, use a more memory-efficient cache strategy
    if (dev && !isServer) {
      // Limit filesystem cache to prevent memory bloat
      if (config.cache) {
        config.cache.maxMemoryGenerations = 1
      }
    }
    
    return config
  },
}

module.exports = nextConfig

