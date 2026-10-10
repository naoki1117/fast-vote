import { PrismaClient } from "@prisma/client";

// schema を変えたあと、開発サーバーが古い PrismaClient を使い続けるのを防ぐ番号。
// 数字を上げるとグローバルに保持していたインスタンスを作り直す。
const CLIENT_VERSION = 5;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaVersion?: number;
};

// Next.js のホットリロードで接続が増えすぎないよう、開発時は globalThis に1つだけ置く
if (globalForPrisma.prismaVersion !== CLIENT_VERSION) {
  globalForPrisma.prisma = new PrismaClient();
  globalForPrisma.prismaVersion = CLIENT_VERSION;
}

export const prisma = globalForPrisma.prisma!;
export default prisma;
