const PHOTO_HOST = "photos.borisnezlobin.com";
const PRIMARY_HOSTS = ["borisnezlobin.com", "www.borisnezlobin.com"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx",],
  experimental: {
    optimizeCss: false,
    globalNotFound: true,
  },
  async rewrites() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: PHOTO_HOST }],
        destination: "/photography",
      },
    ];
  },
  async redirects() {
    return PRIMARY_HOSTS.map((host) => ({
      source: "/photography/:path*",
      has: [{ type: "host", value: host }],
      destination: `https://${PHOTO_HOST}/:path*`,
      permanent: false,
    }));
  },
};

export default nextConfig;