import createNextIntlPlugin from 'next-intl/plugin'

// This is the default (also the `src` folder is supported out of the box)
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts')

const nextConfig: import('next').NextConfig = {
  reactStrictMode: true,
  // Enable Cache Components for Next.js 16 stable
  cacheComponents: true,
}

export default withNextIntl(nextConfig)
