/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx",],
  experimental: {
    optimizeCss: false,
    globalNotFound: true,
  }
};

export default nextConfig;