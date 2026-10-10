import { nextAuthOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** 自社の提案を得票数順に並べ、上位5件を返す */
export const GET = async () => {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { companyId: true },
    });
    if (!user?.companyId) {
      return NextResponse.json([]);
    }

    const posts = await prisma.post.findMany({
      where: { companyId: user.companyId },
      include: {
        author: {
          select: { name: true },
        },
        votes: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const top5Posts = posts
      .map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorName: post.author.name,
        voters: post.votes.map((vote) => vote.user),
        voteCount: post.votes.length,
      }))
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 5);

    return NextResponse.json(top5Posts);
  } catch (error) {
    console.error("Error fetching vote results:", error);
    return NextResponse.json({ error: "取得に失敗しました。" }, { status: 500 });
  }
};
