import { nextAuthOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** ログイン中ユーザー自身の提案と、その投票者一覧 */
export async function GET() {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    const proposal = await prisma.post.findFirst({
      where: { author: { id: user.id } },
      include: {
        votes: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // 未提出ならフォームを出すために null を返す（エラーではない）
    if (!proposal) {
      return NextResponse.json({ proposal: null });
    }

    return NextResponse.json({
      proposal: {
        id: proposal.id,
        title: proposal.title,
        content: proposal.content,
        voters: proposal.votes.map((vote) => vote.user),
      },
    });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json({ error: "取得に失敗しました。" }, { status: 500 });
  }
}
