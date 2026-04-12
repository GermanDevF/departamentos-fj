import type { NextConfig } from "next";

function insforgeStorageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const raw = process.env.NEXT_PUBLIC_INSFORGE_URL;
  if (!raw) return undefined;
  try {
    const { hostname } = new URL(raw);
    if (!hostname) return undefined;
    return {
      protocol: "https",
      hostname,
      pathname: "/api/storage/buckets/**",
    };
  } catch {
    return undefined;
  }
}

const insforgeStorage = insforgeStorageRemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(insforgeStorage ? [insforgeStorage] : []),
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
