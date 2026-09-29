/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'userpic.codeforces.org',
      },
      {
        protocol: 'https',
        hostname: 'cdn.codeforces.com',
      },
      {
        protocol: 'https',
        hostname: '*.codeforces.org',
      },
    ],
  },
};

export default nextConfig;
