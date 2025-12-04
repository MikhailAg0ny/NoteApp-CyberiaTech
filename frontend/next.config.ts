import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const browserSigningImport =
  "@emurgo/cardano-message-signing-browser/cardano_message_signing.js";
const browserSigningModulePath = require.resolve(browserSigningImport);

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@emurgo/cardano-message-signing-nodejs": browserSigningImport,
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        "@emurgo/cardano-message-signing-nodejs": browserSigningModulePath,
      };
    }
    return config;
  },
};

export default nextConfig;
