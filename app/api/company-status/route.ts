import { nextAuthOptions } from "@/app/lib/auth";
import { getCompanyStatusByEmail } from "@/app/lib/company-status";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// 提出人数が変わったらすぐ画面に出したいのでキャッシュしない
export const dynamic = "force-dynamic";

/** 同じ会社の提出状況と、投票開始フラグ */
export async function GET() {
  const session = await getServerSession(nextAuthOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const status = await getCompanyStatusByEmail(email);
  if (!status) {
    return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
  }

  return NextResponse.json(status);
}
