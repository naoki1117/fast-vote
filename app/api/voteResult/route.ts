import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        followers: {
          select: {
            id: true, // フォロワーの id を選択してカウント
            name: true, // フォロワーの名前を選択
          },
        },
      },
    });

    // 投稿ごとにフォロワーの名前を取得し、上位5番目までの投稿を抽出
    const top5Posts = posts
      .map((post) => ({
        ...post,
        followersNames: post.followers.map((follower) => follower.name), // フォロワーの名前を取得
        followersCount: post.followers.length, // フォロワーの数をカウント
      }))
      .sort((a, b) => b.followersCount - a.followersCount) // フォロワーの数で降順にソート
      .slice(0, 5); // 上位5番目までの投稿を取得

    return NextResponse.json(top5Posts);
  } catch (error) {
    console.error("Error fetching top 5 posts:", error);
    return NextResponse.error();
  }
};
