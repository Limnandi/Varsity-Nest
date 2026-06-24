/** @type {import('next').NextConfig} */
const nextConfig = {
   turbopack: {}, // Enables Turbopack for development builds
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Suppress webpack warnings from Sentry/OpenTelemetry dependencies
    // These are harmless warnings about dynamic requires that don't affect functionality
    config.ignoreWarnings = [
      {
        module: /node_modules\/@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /node_modules\/@sentry/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // Suppress webpack cache serialization warnings for large strings
      // These are performance suggestions, not errors, and don't affect functionality
      // The warnings suggest using Buffer instead of strings, but this is an internal
      // webpack optimization that we can't directly control from application code
      {
        message: /Serializing big strings.*impacts deserialization performance/,
      },
    ]
    
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https', 
        hostname: 'images.unsplash.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [430, 640, 768, 1024, 1280],
    minimumCacheTTL: 31536000,
    unoptimized: false,
  },
 
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      {
        source: '/.well-known/microsoft-identity-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          // CORS set dynamically by middleware; keep permissive structure here
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? '' // Set dynamically at runtime by middleware or vercel config
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-API-Version, X-Client-Version'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
          // CSP and HSTS are set centrally in middleware/security-config with report-only toggle
          // X-XSS-Protection removed as it's deprecated and not needed in modern browsers
        ]
      }
    ]
  }
}

export default nextConfig
