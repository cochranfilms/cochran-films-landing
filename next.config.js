/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects(){
    return [
      { source: '/', destination: '/home', permanent: true },
      { source: '/index.html', destination: '/home', permanent: true }
    ]
  }
}
module.exports = nextConfig
