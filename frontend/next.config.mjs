/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/mobile',
        destination: '/mobile/index.html',
      },
      {
        source: '/mobile/',
        destination: '/mobile/index.html',
      },
    ];
  },
};

export default nextConfig;
