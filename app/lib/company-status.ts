import prisma from "@/app/lib/prisma";
import type { CompanyStatusPayload } from "@/app/types/company-status";

/**
 * ログイン中ユーザーの会社について、
 * 「誰が提案を出したか」と「投票を始めてよいか」をまとめる。
 */
export async function getCompanyStatusByEmail(
  email: string
): Promise<CompanyStatusPayload | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // 会社未所属は投票対象がないので、投票も開けない
  if (!user.company) {
    return {
      companyName: null,
      members: [],
      submittedCount: 0,
      totalCount: 0,
      votingOpen: false,
    };
  }

  // 提案は User.proposal ではなく Post.author から取る（古いクライアントとの相性対策）
  const posts = await prisma.post.findMany({
    where: { companyId: user.company.id },
    select: {
      title: true,
      author: { select: { id: true } },
    },
  });
  const postByAuthor = new Map(posts.map((post) => [post.author.id, post.title]));

  const members = user.company.users.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    submitted: postByAuthor.has(member.id),
    proposalTitle: postByAuthor.get(member.id) ?? null,
    isMe: member.id === user.id,
  }));

  const submittedCount = members.filter((member) => member.submitted).length;
  // 1人以上いて、全員が提出済みなら投票開始
  const votingOpen = members.length > 0 && submittedCount === members.length;

  return {
    companyName: user.company.name,
    members,
    submittedCount,
    totalCount: members.length,
    votingOpen,
  };
}
