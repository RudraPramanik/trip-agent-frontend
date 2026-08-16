import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Pin to this package so Turbopack resolves node_modules/next (HMR import map).
    root: packageRoot,
  },
};

export default nextConfig;
