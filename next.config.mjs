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
      // Per-project writeups are gone — everything now lives on the one list page.
      // `:slug+` (one or more) rather than `:slug*` (zero or more): with `*` the
      // bare /projects matches its own rule and redirects to itself forever.
      { source: "/projects/:slug+", destination: "/projects", permanent: true },
    ];
  },
};

export default nextConfig;
