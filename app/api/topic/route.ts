import { nextAuthOptions } from "@/app/lib/auth";
import { getCompanyStatusByEmail } from "@/app/lib/company-status";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** ホストだけが今ラウンドのお題を1回出せる */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const { title, content } = await req.json();
    const topicTitle = String(title ?? "").trim();
    const topicContent = String(content ?? "").trim();
    if (!topicTitle || !topicContent) {
      return NextResponse.json(
        { error: "お題のタイトルと内容を入力してください。" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user?.company) {
      return NextResponse.json({ error: "会社に所属していません。" }, { status: 400 });
    }
    if (user.company.hostId !== user.id) {
      return NextResponse.json({ error: "お題を出せるのはホストだけです。" }, { status: 403 });
    }
    if (user.company.topicTitle) {
      return NextResponse.json({ error: "お題はすでに出ています。" }, { status: 409 });
    }

    await prisma.company.update({
      where: { id: user.company.id },
      data: { topicTitle, topicContent },
    });

    const status = await getCompanyStatusByEmail(email);
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json({ error: "お題の作成に失敗しました。" }, { status: 500 });
  }
}
