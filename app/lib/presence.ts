import prisma from "@/app/lib/prisma";
import { bumpRoundSignal } from "@/app/lib/round-signal";

/** ログイン中としてメンバー一覧に出す */
export async function markUserPresent(userId: string, companyId: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: { isPresent: true },
  });
  if (companyId) {
    await bumpRoundSignal(companyId);
  }
}

/** ログアウトしたらメンバーから外す。アカウントは残す */
export async function markUserAbsent(userId: string, companyId: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: { isPresent: false },
  });
  if (companyId) {
    await bumpRoundSignal(companyId);
  }
}
