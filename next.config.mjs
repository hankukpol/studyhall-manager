/** @type {import('next').NextConfig} */
const externalPackages = ["@prisma/client", "prisma", "exceljs"];

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: externalPackages,
  },
};

export default nextConfig;
