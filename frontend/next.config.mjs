import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8001/:path*',
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

export default withNextIntl(nextConfig);
