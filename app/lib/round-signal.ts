import prisma from "@/app/lib/prisma";

/** 同じ会社の他メンバーへ Realtime で「状況が変わった」と知らせる */
export async function bumpRoundSignal(companyId: string) {
  try {
    await prisma.roundSignal.upsert({
      where: { companyId },
      create: { companyId },
      update: { bumpedAt: new Date() },
    });
  } catch (error) {
    console.error("Error bumping round signal:", error);
  }
}
