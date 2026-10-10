import { nextAuthOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { bumpRoundSignal } from "@/app/lib/round-signal";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// 提案一覧はキャッシュせず、提出直後の内容をすぐ返す
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** 自社の提案一覧（投票画面用） */
export async function GET() {
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
    // 会社未所属なら他社の提案を見せない
    if (!user?.companyId) {
      return NextResponse.json([]);
    }

    const posts = await prisma.post.findMany({
      where: { companyId: user.companyId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/** 提案の新規提出。1ユーザー1件まで */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const { title, content } = await req.json();
    const trimmedTitle = String(title ?? "").trim();
    const trimmedContent = String(content ?? "").trim();

    if (!trimmedTitle || !trimmedContent) {
      return NextResponse.json(
        { error: "タイトルと内容を入力してください。" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }
    if (user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        select: { topicTitle: true },
      });
      if (!company?.topicTitle) {
        return NextResponse.json(
          { error: "ホストがお題を出すまで提案できません。" },
          { status: 403 }
        );
      }
    }

    // authorId を where に直接書くと、古い Prisma クライアントでは Unknown argument になる
    const existing = await prisma.post.findFirst({
      where: { author: { id: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "提案は1人1件までです。" },
        { status: 409 }
      );
    }

    const proposal = await prisma.post.create({
      data: {
        title: trimmedTitle,
        content: trimmedContent,
        author: { connect: { id: user.id } },
        ...(user.companyId ? { company: { connect: { id: user.companyId } } } : {}),
      },
    });

    if (user.companyId) {
      await bumpRoundSignal(user.companyId);
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "提案の作成に失敗しました。" }, { status: 500 });
  }
}
