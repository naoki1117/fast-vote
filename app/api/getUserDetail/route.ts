import prisma from "@/app/lib/prisma";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  try {
    // リクエストの本文からemailを取得
    const { name } = await req.json();

    // ユーザーをデータベースから検索
    const user = await prisma.user.findFirst({
      where: { name: name },
      include: { posts: true }, // Userが作成したPostを含める
    });

    // ユーザーが見つからない場合のエラーハンドリング
    if (!user) {
      return NextResponse.error();
    }

    // ユーザーが作成した最初の投稿の情報を取得
    const myVote = await prisma.post.findUnique({
      where: { id: user.posts[0]?.postId }, // 最初の投稿が存在する場合のみ検索
      include: { author: true, followers: true }, // author,followersを含めて取得
    });

    const followers = await prisma.user.findMany({
      where: {
        OR: myVote?.followers?.map((follower) => ({
          // 各条件に対応するフィールドと値を指定
          id: follower.id, // フィールド名と値}
        })),
      },
    });
    // 投稿が存在しない場合のエラーハンドリング
    if (!myVote) {
      return NextResponse.error();
    }

    // 最初の投稿のタイトルを返す
    return NextResponse.json({
      title: myVote.title,
      followers: followers,
    });
  } catch (error) {
    // エラーハンドリング
    console.error("Error fetching user:", error);
    return NextResponse.error();
  }
};
