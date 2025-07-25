// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

const nextConfig = {
  output: 'export',
  basePath: '/static', // Enable static export
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/external/:path*',
  //       destination: 'http://192.168.1.127:8080/:path*',
  //     },
  //   ];
  // },
};

export default nextConfig;

