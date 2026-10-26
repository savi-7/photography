import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: false,   // StrictMode double-invokes effects; breaks GSAP animations
};

export default nextConfig;
