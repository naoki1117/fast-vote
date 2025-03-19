import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // 動的ルーティングを強制
export const revalidate = 0; // キャッシュを無効化

export async function GET() {
  try {
    // 全てのユーザーを取得
    const users = await prisma.user.findMany({
      include: {
        posts: {
          include: {
            post: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
