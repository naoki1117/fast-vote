import { nextAuthOptions } from "@/app/lib/auth";
import { markUserAbsent } from "@/app/lib/presence";
import prisma from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** ログアウト直前に呼び、同じ会社のメンバー一覧から外す */
export async function POST() {
  const session = await getServerSession(nextAuthOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, companyId: true },
  });
  if (user) {
    await markUserAbsent(user.id, user.companyId);
  }

  return NextResponse.json({ ok: true });
}
