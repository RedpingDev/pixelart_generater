import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: 'pbxt.replicate.delivery' },
      { protocol: 'https', hostname: '*.replicate.delivery' },
    ],
  },
  // 바이너리 경로 패키지 — 번들링 금지 (번들시 \ROOT\... 경로로 깨짐)
  serverExternalPackages: ['sharp', 'ffmpeg-static'],
};

export default nextConfig;
