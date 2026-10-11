/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prisma を webpack にバンドルすると、generate 後も古いクライアントが残ることがある。
    // 開発中に authorId を知らない古い定義で 500 になったため、サーバー側では外部パッケージとして読む。
    serverComponentsExternalPackages: ["@prisma/client", ".prisma/client"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
