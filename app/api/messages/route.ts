import { nextAuthOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { bumpRoundSignal } from "@/app/lib/round-signal";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_LEN = 500;
const LIMIT = 80;

/** 自社のチャット履歴（新しい順ではなく時系列） */
export async function GET() {
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

  const rows = await prisma.message.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(rows.reverse());
}

/** 自社チャットへ1件投稿する */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const { content } = await req.json();
    const text = String(content ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });
    }
    if (text.length > MAX_LEN) {
      return NextResponse.json({ error: `メッセージは${MAX_LEN}文字までです。` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, companyId: true },
    });
    if (!user?.companyId) {
      return NextResponse.json({ error: "会社に所属していません。" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: text,
        userId: user.id,
        companyId: user.companyId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await bumpRoundSignal(user.companyId);
    return NextResponse.json(message);
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json({ error: "送信に失敗しました。" }, { status: 500 });
  }
}
