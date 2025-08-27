/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects(){
    return [
      { source: '/:page.html', destination: '/:page', permanent: true },
      { source: '/index.html', destination: '/home', permanent: true }
    ]
  }
}
module.exports = nextConfig
