import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const { selectedItems, name } = await req.json();

  try {
    // ユーザーを検索
    const user = await prisma.user.findFirst({
      where: {
        name: name.name,
      },
      include: {
        followedPosts: true,
      },
    });

    if (user?.followedPosts.length == 2) {
      return NextResponse.json("failed");
    }

    // ポストを検索
    const posts = await prisma.post.findMany({
      where: { OR: [{ id: selectedItems[0] }, { id: selectedItems[1] }] },
      include: {
        followers: true,
      },
    });

    // 各ポストに新しいフォロワーを追加
    for (const post of posts) {
      // すでにフォロワーに存在するかチェック
      const isFollowerExists = post.followers.some(
        (follower) => follower.id === user?.id
      );
      if (!isFollowerExists) {
        // 新しいフォロワーを追加
        const updatedPost = await prisma.post.update({
          where: { id: post.id },
          data: {
            followers: {
              connect: {
                id: user?.id,
              },
            },
          },
          include: {
            followers: true,
          },
        });
        console.log("Updated post:", updatedPost);
      } else {
        console.log("User is already a follower of this post.");
      }
    }

    return NextResponse.json("success");
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.error();
  }
};
