import { nextAuthOptions } from "@/app/lib/auth";
import { getCompanyStatusByEmail, tryAssignHost } from "@/app/lib/company-status";
import { hasMajority } from "@/app/lib/majority";
import prisma from "@/app/lib/prisma";
import { bumpRoundSignal } from "@/app/lib/round-signal";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** 欠席者を待たず、いまログイン中のメンバーだけで次へ進む */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const body = await req.json();
    const stage = body?.stage === "propose" ? "propose" : body?.stage === "nominate" ? "nominate" : null;
    if (!stage) {
      return NextResponse.json({ error: "申請の段階が不正です。" }, { status: 400 });
    }

    const status = await getCompanyStatusByEmail(email);
    if (!status?.companyId) {
      return NextResponse.json({ error: "会社に所属していません。" }, { status: 400 });
    }

    if (stage === "nominate" && status.phase !== "nominate") {
      return NextResponse.json({ error: "ホスト指名の段階ではありません。" }, { status: 403 });
    }
    if (stage === "propose" && status.phase !== "propose") {
      return NextResponse.json({ error: "提案の段階ではありません。" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, companyId: true },
    });
    if (!user?.companyId) {
      return NextResponse.json({ error: "会社に所属していません。" }, { status: 400 });
    }

    await prisma.advanceRequest.upsert({
      where: { userId_stage: { userId: user.id, stage } },
      create: { userId: user.id, companyId: user.companyId, stage },
      update: {},
    });

    const presentIds = new Set(status.members.map((member) => member.id));
    const requests = await prisma.advanceRequest.findMany({
      where: { companyId: user.companyId, stage },
      select: { userId: true },
    });
    const count = requests.filter((req) => presentIds.has(req.userId)).length;
    const majority = hasMajority(count, status.totalCount);

    if (majority && stage === "nominate") {
      if (status.nominatedCount === 0) {
        return NextResponse.json(
          { error: "指名が1件もないため進めません。先にホストを指名してください。" },
          { status: 400 }
        );
      }
      await prisma.company.update({
        where: { id: user.companyId },
        data: { skipNominate: true },
      });
      const assigned = await tryAssignHost(user.companyId, true);
      if (!assigned.assigned && assigned.tied) {
        await bumpRoundSignal(user.companyId);
        return NextResponse.json({
          ok: true,
          advanced: false,
          tied: true,
          error: "最多が同数です。指名を変えて1人に決めてください。",
        });
      }
    }

    if (majority && stage === "propose") {
      if (status.submittedCount === 0) {
        return NextResponse.json(
          { error: "提案が1件もないため投票に進めません。" },
          { status: 400 }
        );
      }
      await prisma.company.update({
        where: { id: user.companyId },
        data: { skipPropose: true },
      });
    }

    await bumpRoundSignal(user.companyId);
    return NextResponse.json({
      ok: true,
      advanced: majority,
      count,
      needed: status.advanceNeededCount,
    });
  } catch (error) {
    console.error("Error requesting advance:", error);
    return NextResponse.json({ error: "申請に失敗しました。" }, { status: 500 });
  }
}
