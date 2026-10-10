/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prisma を webpack にバンドルすると、generate 後も古いクライアントが残ることがある。
    // 開発中に authorId を知らない古い定義で 500 になったため、サーバー側では外部パッケージとして読む。
    serverComponentsExternalPackages: ["@prisma/client", ".prisma/client"],
  },
};

export default nextConfig;
