/** 会社メンバー1人分の提出状態 */
export type CompanyMemberStatus = {
  id: string;
  name: string | null;
  email: string | null;
  submitted: boolean;
  proposalTitle: string | null;
  /** ログイン中の自分かどうか（一覧で「あなた」と出す） */
  isMe: boolean;
};

/** 提出状況画面と投票可否判定で共有するペイロード */
export type CompanyStatusPayload = {
  companyName: string | null;
  members: CompanyMemberStatus[];
  submittedCount: number;
  totalCount: number;
  /** 全員提出済みなら true。投票 API でも同じ値を見る */
  votingOpen: boolean;
};
