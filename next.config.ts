import type { NextConfig } from "next";

// @ts-ignore
const WebpackObfuscator = require('webpack-obfuscator');

const nextConfig: NextConfig = {
  // 1. SECURITY: Hide source maps so code cannot be reversed easily
  productionBrowserSourceMaps: false,

  // 2. SECURITY: Add Strict HTTP Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // Prevents clickjacking
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ];
  },

  // 3. WEBPACK CONFIGURATION (WASM + Obfuscation)
  webpack: (config, { dev, isServer, webpack }) => {
    
    // --- A. Enable WebAssembly (Critical for your AI tools) ---
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,      
      asyncWebAssembly: true,   
      layers: true,             
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        module: false,
        process: false,
        buffer: false,
      };

      // Fix for node: prefixes if used by any library
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }

    // --- B. SECURITY: OBFUSCATION (Production Client Only) ---
    if (!dev && !isServer) {
      // Disable devtool completely
      config.devtool = false;

      // 1. Add Copyright Banner (warns anyone trying to steal code)
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: "© 2026 Nextooly Labs. All rights reserved. Unauthorized reproduction or distribution is strictly prohibited.",
          raw: false,
          entryOnly: true,
        })
      );

      // 2. Scramble the code (High Performance Profile)
      config.plugins.push(
        new WebpackObfuscator(
          {
            compact: true,
            controlFlowFlattening: false, // Keep false for speed
            splitStrings: false,          // Keep false for speed
            identifierNamesGenerator: 'hexadecimal', // Variables become _0x1234
            rotateStringArray: true,
            stringArray: true,
            stringArrayThreshold: 0.75,
            debugProtection: true,        // Breaks devtools debugger
            disableConsoleOutput: true,   // Hides console.log
            log: false,
            renameGlobals: false,
            selfDefending: true,          // Code breaks if formatted
          },
          // Exclude huge framework files to keep build fast
          ['framework-*.js', 'main-*.js', 'commons-*.js', 'b-*.js'] 
        )
      );
    }

    return config;
  },
};

export default nextConfig;