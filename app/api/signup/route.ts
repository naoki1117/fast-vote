import prisma from "@/app/lib/prisma";
import { bumpRoundSignal } from "@/app/lib/round-signal";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/** 会社名・メール・パスワードでユーザーを作り、同じ会社名なら既存会社に参加する */
export async function POST(req: Request) {
  try {
    const { companyName, email, password } = await req.json();
    const trimmedCompany = String(companyName ?? "").trim();
    const trimmedEmail = String(email ?? "").trim().toLowerCase();
    const rawPassword = String(password ?? "");

    if (!trimmedCompany || !trimmedEmail || !rawPassword) {
      return NextResponse.json(
        { error: "会社名、メールアドレス、パスワードを入力してください。" },
        { status: 400 }
      );
    }

    if (rawPassword.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上にしてください。" },
        { status: 400 }
      );
    }

    // 会社の作成とユーザー作成をまとめて行い、途中失敗ならどちらも残さない
    const companyId = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (existing) {
        throw new Error("EMAIL_TAKEN");
      }

      // 会社名が同じなら同じ Company に所属させる（社内投票の単位）
      let company = await tx.company.findFirst({
        where: { name: trimmedCompany },
      });
      if (!company) {
        company = await tx.company.create({
          data: { name: trimmedCompany },
        });
      }

      await tx.user.create({
        data: {
          email: trimmedEmail,
          password: rawPassword,
          // 表示名が未入力なので、メールの @ より前を仮の名前にする
          name: trimmedEmail.split("@")[0],
          companyId: company.id,
        },
      });

      return company.id;
    });

    await bumpRoundSignal(companyId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。" },
        { status: 409 }
      );
    }
    // ユニーク制約（email）に引っかかった場合も同じ案内にする
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。" },
        { status: 409 }
      );
    }
    console.error("Error signing up:", error);
    return NextResponse.json(
      { error: "登録に失敗しました。" },
      { status: 500 }
    );
  }
}
