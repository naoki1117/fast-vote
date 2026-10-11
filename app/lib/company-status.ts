import prisma from "@/app/lib/prisma";
import { markUserPresent } from "@/app/lib/presence";
import type { CompanyStatusPayload, RoundPhase } from "@/app/types/company-status";

const empty: CompanyStatusPayload = {
  companyId: null,
  companyName: null,
  members: [],
  submittedCount: 0,
  votedCount: 0,
  resetRequestCount: 0,
  resetNeededCount: 0,
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
  for (const [id, count] of Array.from(counts.entries())) {
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
  const self = await prisma.user.findUnique({
    where: { email },
    select: { id: true, companyId: true, isPresent: true },
  });
  if (self && !self.isPresent) {
    await markUserPresent(self.id, self.companyId);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: {
        include: {
          host: { select: { id: true, name: true } },
          users: {
            where: { isPresent: true },
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

  const [posts, votes, roundVotes, resetRequests, myVotes, nominations] = await Promise.all([
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
    prisma.vote.findMany({
      where: { post: { companyId } },
      select: { id: true },
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
  const presentIds = new Set(memberIds);
  const presentNominations = nominations.filter((nomination) =>
    presentIds.has(nomination.userId)
  );
  const nominationCounts = new Map<string, number>();
  for (const nomination of presentNominations) {
    if (!presentIds.has(nomination.nomineeId)) {
      continue;
    }
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

  const submitters = members.filter((member) => member.submitted);
  const submittedCount = submitters.length;
  const votedCount = members.filter((member) => member.voted).length;
  const topicReady = Boolean(user.company.topicTitle && user.company.topicContent);
  const hasAnyVote = roundVotes.length > 0;
  // 投票開始後に提案していない人がログインしても、投票を巻き戻さない
  const votingOpen =
    topicReady &&
    members.length > 0 &&
    (submittedCount === members.length || hasAnyVote);
  const submittersVoted =
    submitters.length > 0 && submitters.every((member) => member.voted);
  const votingComplete = votingOpen && submittersVoted;
  const resetNeededCount = submitters.length;
  const resetRequestCount = submitters.filter((member) => member.resetRequested).length;
  const { leaders } = leadingNomineeIds(nominationCounts);
  const hostTied =
    !user.company.hostId &&
    presentNominations.length === members.length &&
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
    companyId,
    companyName: user.company.name,
    members,
    submittedCount,
    votedCount,
    resetRequestCount,
    resetNeededCount,
    nominatedCount: presentNominations.length,
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

/**
 * 提案・票・指名・お題・ホスト・チャットを消す。ユーザーと会社は残す。
 * Supabase の PgBouncer（6543）では $transaction が待ち続けて Vercel が 504 になるため、
 * トランザクションは使わず順に消す。票は Post の Cascade で消える。
 */
export async function resetCompanyRound(companyId: string) {
  await prisma.post.deleteMany({ where: { companyId } });
  await prisma.message.deleteMany({ where: { companyId } });
  await prisma.resetRequest.deleteMany({ where: { companyId } });
  await prisma.hostNomination.deleteMany({ where: { companyId } });
  await prisma.company.update({
    where: { id: companyId },
    data: {
      hostId: null,
      topicTitle: null,
      topicContent: null,
    },
  });
}
