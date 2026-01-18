const webpack = require('webpack');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    
    if (!isServer) {
      // Set up aliases to use the project's three.js for all imports
      config.resolve.alias = config.resolve.alias || {};
      const threeDir = path.resolve(__dirname, 'node_modules/three');
      const webgpuStub = path.resolve(__dirname, 'lib/webgpu-stub.js');
      const tslStub = path.resolve(__dirname, 'lib/three-tsl-stub.js');
      
      // Direct aliases
      config.resolve.alias['three'] = threeDir;
      config.resolve.alias['three/'] = threeDir;
      config.resolve.alias['three/webgpu'] = webgpuStub;
      config.resolve.alias['three/tsl'] = tslStub;
      
      // For bundled versions
      config.resolve.alias['globe.gl/node_modules/three'] = threeDir;
      config.resolve.alias['three-globe/node_modules/three'] = threeDir;
      
      // Webpack plugins for extra safety
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /three[\\/]webgpu/,
          webgpuStub
        )
      );
      
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /three[\\/]tsl/,
          tslStub
        )
      );
    }
    
    return config;
  },
}

module.exports = nextConfig
