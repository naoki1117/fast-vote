import { nextAuthOptions } from "@/app/lib/auth";
import { getCompanyStatusByEmail, resetCompanyRound } from "@/app/lib/company-status";
import prisma from "@/app/lib/prisma";
import { bumpRoundSignal } from "@/app/lib/round-signal";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const maxDuration = 30;

/** 投票が全員終わったあと、削除申請する。全員揃ったらラウンドを初期化する */
export async function POST() {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const status = await getCompanyStatusByEmail(email);
    if (!status) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }
    if (!status.votingComplete) {
      return NextResponse.json(
        { error: "全員の投票が終わるまで削除申請はできません。" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, companyId: true },
    });
    if (!user?.companyId) {
      return NextResponse.json({ error: "会社に所属していません。" }, { status: 400 });
    }

    await prisma.resetRequest.upsert({
      where: { userId: user.id },
      create: { userId: user.id, companyId: user.companyId },
      update: {},
    });

    const neededIds = status.members
      .filter((member) => member.submitted)
      .map((member) => member.id);
    const requestedIds = new Set(
      status.members.filter((member) => member.resetRequested).map((member) => member.id)
    );
    requestedIds.add(user.id);
    const everyoneAsked =
      neededIds.length > 0 && neededIds.every((id) => requestedIds.has(id));

    if (everyoneAsked) {
      await resetCompanyRound(user.companyId);
      await bumpRoundSignal(user.companyId);
      return NextResponse.json({ ok: true, reset: true });
    }

    await bumpRoundSignal(user.companyId);

    return NextResponse.json({
      ok: true,
      reset: false,
      resetRequestCount: requestedIds.size,
      totalCount: neededIds.length || status.resetNeededCount,
    });
  } catch (error) {
    console.error("Error requesting reset:", error);
    return NextResponse.json({ error: "削除申請に失敗しました。" }, { status: 500 });
  }
}
