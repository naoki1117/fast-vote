import prisma from "@/app/lib/prisma";
import type { CompanyStatusPayload, RoundPhase } from "@/app/types/company-status";

const empty: CompanyStatusPayload = {
  companyName: null,
  members: [],
  submittedCount: 0,
  votedCount: 0,
  resetRequestCount: 0,
  nominatedCount: 0,
  totalCount: 0,
  phase: "nominate",
  votingOpen: false,
  votingComplete: false,
  iHaveVoted: false,
  iRequestedReset: false,
  iAmHost: false,
  myNomineeId: null,
  myVotedPostIds: [],
  host: null,
  topicTitle: null,
  topicContent: null,
  hostTied: false,
};

function leadingNomineeIds(counts: Map<string, number>) {
  let max = 0;
  const leaders: string[] = [];
  for (const [id, count] of counts) {
    if (count > max) {
      max = count;
      leaders.length = 0;
      leaders.push(id);
    } else if (count === max && count > 0) {
      leaders.push(id);
    }
  }
  return { max, leaders };
}

/**
 * ログイン中ユーザーの会社について、
 * ホスト指名・お題・提出・投票の進捗をまとめる。
 */
export async function getCompanyStatusByEmail(
  email: string
): Promise<CompanyStatusPayload | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: {
        include: {
          host: { select: { id: true, name: true } },
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

  if (!user.company) {
    return empty;
  }

  const companyId = user.company.id;
  const memberIds = user.company.users.map((member) => member.id);

  const [posts, votes, resetRequests, myVotes, nominations] = await Promise.all([
    prisma.post.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        author: { select: { id: true } },
      },
    }),
    prisma.vote.findMany({
      where: { userId: { in: memberIds } },
      select: { userId: true },
    }),
    prisma.resetRequest.findMany({
      where: { companyId },
      select: { userId: true },
    }),
    prisma.vote.findMany({
      where: { userId: user.id },
      select: { postId: true },
    }),
    prisma.hostNomination.findMany({
      where: { companyId },
      select: { userId: true, nomineeId: true },
    }),
  ]);

  const postByAuthor = new Map(posts.map((post) => [post.author.id, post.title]));
  const votedUserIds = new Set(votes.map((vote) => vote.userId));
  const resetUserIds = new Set(resetRequests.map((req) => req.userId));
  const nominationCounts = new Map<string, number>();
  for (const nomination of nominations) {
    nominationCounts.set(
      nomination.nomineeId,
      (nominationCounts.get(nomination.nomineeId) ?? 0) + 1
    );
  }

  const members = user.company.users.map((member) => {
    const others = posts.filter((post) => post.author.id !== member.id).length;
    const voted = votedUserIds.has(member.id) || others === 0;
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      submitted: postByAuthor.has(member.id),
      voted,
      resetRequested: resetUserIds.has(member.id),
      proposalTitle: postByAuthor.get(member.id) ?? null,
      nominationCount: nominationCounts.get(member.id) ?? 0,
      isMe: member.id === user.id,
    };
  });

  const submittedCount = members.filter((member) => member.submitted).length;
  const votedCount = members.filter((member) => member.voted).length;
  const topicReady = Boolean(user.company.topicTitle && user.company.topicContent);
  const votingOpen =
    topicReady && members.length > 0 && submittedCount === members.length;
  const votingComplete = votingOpen && votedCount === members.length;
  const { leaders } = leadingNomineeIds(nominationCounts);
  const hostTied =
    !user.company.hostId &&
    nominations.length === members.length &&
    members.length > 0 &&
    leaders.length > 1;

  let phase: RoundPhase = "nominate";
  if (votingComplete) {
    phase = "complete";
  } else if (votingOpen) {
    phase = "vote";
  } else if (topicReady) {
    phase = "propose";
  } else if (user.company.hostId) {
    phase = "topic";
  }

  return {
    companyName: user.company.name,
    members,
    submittedCount,
    votedCount,
    resetRequestCount: resetRequests.length,
    nominatedCount: nominations.length,
    totalCount: members.length,
    phase,
    votingOpen,
    votingComplete,
    iHaveVoted: members.find((member) => member.isMe)?.voted ?? false,
    iRequestedReset: resetUserIds.has(user.id),
    iAmHost: user.company.hostId === user.id,
    myNomineeId: nominations.find((nomination) => nomination.userId === user.id)?.nomineeId ?? null,
    myVotedPostIds: myVotes.map((vote) => vote.postId),
    host: user.company.host
      ? { id: user.company.host.id, name: user.company.host.name }
      : null,
    topicTitle: user.company.topicTitle,
    topicContent: user.company.topicContent,
    hostTied,
  };
}

export { leadingNomineeIds };

/** 提案・票・指名・お題・ホストを消す。ユーザーと会社は残す */
export async function resetCompanyRound(companyId: string) {
  await prisma.$transaction([
    prisma.post.deleteMany({ where: { companyId } }),
    prisma.resetRequest.deleteMany({ where: { companyId } }),
    prisma.hostNomination.deleteMany({ where: { companyId } }),
    prisma.company.update({
      where: { id: companyId },
      data: {
        hostId: null,
        topicTitle: null,
        topicContent: null,
      },
    }),
  ]);
}
