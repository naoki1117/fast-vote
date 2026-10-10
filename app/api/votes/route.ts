import { nextAuthOptions } from "@/app/lib/auth";
import { getCompanyStatusByEmail } from "@/app/lib/company-status";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** 他者の提案へ1件または2件投票する。一度送ったら変更できない */
export const POST = async (req: Request) => {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const { selectedItems } = await req.json();
    const ids = Array.from(
      new Set(
        Array.isArray(selectedItems)
          ? selectedItems.filter((id: unknown) => typeof id === "string")
          : []
      )
    );

    if (ids.length < 1 || ids.length > 2) {
      return NextResponse.json(
        { error: "提案を1件または2件選んでください。" },
        { status: 400 }
      );
    }

    const companyStatus = await getCompanyStatusByEmail(email);
    if (!companyStatus?.votingOpen) {
      return NextResponse.json(
        { error: "会社の全員が提案を提出するまで投票できません。" },
        { status: 403 }
      );
    }
    if (companyStatus.iHaveVoted) {
      return NextResponse.json(
        { error: "投票は完了済みです。変更はできません。" },
        { status: 409 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }
    if ((await prisma.vote.count({ where: { userId: user.id } })) > 0) {
      return NextResponse.json(
        { error: "投票は完了済みです。変更はできません。" },
        { status: 409 }
      );
    }

    const myProposal = await prisma.post.findFirst({
      where: { author: { id: user.id } },
    });
    if (myProposal && ids.includes(myProposal.id)) {
      return NextResponse.json(
        { error: "自分の提案には投票できません。" },
        { status: 400 }
      );
    }

    const posts = await prisma.post.findMany({
      where: { id: { in: ids } },
    });
    if (posts.length !== ids.length) {
      return NextResponse.json({ error: "提案が見つかりません。" }, { status: 404 });
    }
    if (posts.some((post) => post.companyId !== user.companyId)) {
      return NextResponse.json({ error: "自社の提案にだけ投票できます。" }, { status: 403 });
    }

    await prisma.vote.createMany({
      data: ids.map((postId: string) => ({
        userId: user.id,
        postId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json("success");
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "投票に失敗しました。" }, { status: 500 });
  }
};
