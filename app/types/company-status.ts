export type RoundPhase = "nominate" | "topic" | "propose" | "vote" | "complete";

/** 会社メンバー1人分の提出・投票・削除申請・ホスト指名 */
export type CompanyMemberStatus = {
  id: string;
  name: string | null;
  email: string | null;
  submitted: boolean;
  voted: boolean;
  resetRequested: boolean;
  proposalTitle: string | null;
  nominationCount: number;
  /** ログイン中の自分かどうか（一覧で「あなた」と出す） */
  isMe: boolean;
};

/** 提出状況画面と投票可否判定で共有するペイロード */
export type CompanyStatusPayload = {
  companyId: string | null;
  companyName: string | null;
  members: CompanyMemberStatus[];
  submittedCount: number;
  votedCount: number;
  resetRequestCount: number;
  nominatedCount: number;
  totalCount: number;
  phase: RoundPhase;
  /** 全員提出済みかつお題ありなら true */
  votingOpen: boolean;
  votingComplete: boolean;
  iHaveVoted: boolean;
  iRequestedReset: boolean;
  iAmHost: boolean;
  myNomineeId: string | null;
  myVotedPostIds: string[];
  host: { id: string; name: string | null } | null;
  topicTitle: string | null;
  topicContent: string | null;
  hostTied: boolean;
};
