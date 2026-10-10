import { nextAuthOptions } from "@/app/lib/auth";
import { getCompanyStatusByEmail } from "@/app/lib/company-status";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** 他者の提案へちょうど2票入れる。全員提出前・自社外・自分の提案は拒否する */
export const POST = async (req: Request) => {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const { selectedItems } = await req.json();
    const ids = Array.isArray(selectedItems)
      ? selectedItems.filter((id: unknown) => typeof id === "string")
      : [];

    if (ids.length !== 2) {
      return NextResponse.json({ error: "提案を2件選んでください。" }, { status: 400 });
    }
    if (ids[0] === ids[1]) {
      return NextResponse.json({ error: "同じ提案には投票できません。" }, { status: 400 });
    }

    const companyStatus = await getCompanyStatusByEmail(email);
    if (!companyStatus?.votingOpen) {
      return NextResponse.json(
        { error: "会社の全員が提案を提出するまで投票できません。" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { votes: true },
    });
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }
    // 訂正は画面からできないので、2票ある人は追加できない
    if (user.votes.length >= 2) {
      return NextResponse.json("failed");
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
    if (posts.length !== 2) {
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
