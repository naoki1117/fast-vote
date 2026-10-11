import { nextAuthOptions } from "@/app/lib/auth";
import { getCompanyStatusByEmail, leadingNomineeIds } from "@/app/lib/company-status";
import prisma from "@/app/lib/prisma";
import { bumpRoundSignal } from "@/app/lib/round-signal";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** 今ラウンドのホストを1人指名する。全員の指名が揃い最多が1人なら確定 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    const { nomineeId } = await req.json();
    if (typeof nomineeId !== "string" || !nomineeId) {
      return NextResponse.json({ error: "指名するメンバーを選んでください。" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          include: { users: { where: { isPresent: true }, select: { id: true } } },
        },
      },
    });
    if (!user?.company) {
      return NextResponse.json({ error: "会社に所属していません。" }, { status: 400 });
    }
    if (user.company.hostId) {
      return NextResponse.json({ error: "ホストはすでに決まっています。" }, { status: 409 });
    }
    if (!user.company.users.some((member) => member.id === nomineeId)) {
      return NextResponse.json({ error: "自社のメンバーだけ指名できます。" }, { status: 403 });
    }

    await prisma.hostNomination.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        nomineeId,
        companyId: user.company.id,
      },
      update: { nomineeId },
    });

    const nominations = await prisma.hostNomination.findMany({
      where: { companyId: user.company.id },
      select: { nomineeId: true },
    });
    const memberCount = user.company.users.length;
    if (nominations.length === memberCount && memberCount > 0) {
      const counts = new Map<string, number>();
      for (const nomination of nominations) {
        counts.set(nomination.nomineeId, (counts.get(nomination.nomineeId) ?? 0) + 1);
      }
      const { leaders } = leadingNomineeIds(counts);
      if (leaders.length === 1) {
        await prisma.company.update({
          where: { id: user.company.id },
          data: { hostId: leaders[0] },
        });
      }
    }

    await bumpRoundSignal(user.company.id);
    const status = await getCompanyStatusByEmail(email);
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Error nominating host:", error);
    return NextResponse.json({ error: "指名に失敗しました。" }, { status: 500 });
  }
}
