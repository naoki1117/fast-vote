import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
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
    throw new Error();
  }
};
