/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image domains if needed for external images
  images: {
    domains: [],
  },
  
  // Webpack configuration to prevent memory allocation errors
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
  
  // Disable webpack cache in development if memory issues persist
  // Uncomment the line below if the error continues:
  // experimental: { isrMemoryCacheSize: 0 },
}

module.exports = nextConfig

