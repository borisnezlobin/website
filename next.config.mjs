/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx",],
  experimental: {
    optimizeCss: false,
    globalNotFound: true,
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/:slug*", destination: "/writing/:slug*", permanent: true },
    ];
  },
};

export default nextConfig;
