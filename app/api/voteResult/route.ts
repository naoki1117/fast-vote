import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const posts = await prisma.post.findMany({
    include: {
      followers: {
        select: {
          id: true, // フォロワーの id を選択してカウント
        },
      },
    },
  });

  // 投稿ごとにフォロワー数をカウントし、上位5番目までの投稿を抽出
  const top5Posts = posts
    .map((post) => ({
      ...post,
      followersCount: post.followers.length, // フォロワーの数をカウント
    }))
    .sort((a, b) => b.followersCount - a.followersCount) // フォロワーの数で降順にソート
    .slice(0, 5); // 上位5番目までの投稿を取得

  return NextResponse.json(top5Posts);
};
