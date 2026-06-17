import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize server-only packages
  serverExternalPackages: ["mongoose"],

  // Suppress maplibre CSS import warnings
  transpilePackages: ["react-map-gl", "maplibre-gl"],
};

export default nextConfig;
