import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // @react-pdf/renderer no debe ser empaquetado por el bundler del servidor.
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
}

export default nextConfig
