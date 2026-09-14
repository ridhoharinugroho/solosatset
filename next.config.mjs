/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Typecheck is run separately via npm run typecheck
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
