const PHOTO_HOST = "photos.borisnezlobin.com";
const PRIMARY_HOST = "borisnezlobin.com";

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
    return [
      {
        source: "/photography/:path*",
        has: [{ type: "host", value: PRIMARY_HOST }],
        destination: `https://${PHOTO_HOST}/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;