import type { CompanyStatusPayload } from "@/app/types/company-status";

export type DashboardView =
  | "home"
  | "host"
  | "myProposal"
  | "companyStatus"
  | "proposals"
  | "voteResults";

export type NextActionKey =
  | "nominate"
  | "topic"
  | "propose"
  | "vote"
  | "reset"
  | "advance";

export type NextAction = {
  view: DashboardView;
  key: NextActionKey;
};

/** いま自分が進める一手。待ちのときは null */
export function getNextAction(
  status: CompanyStatusPayload | null
): NextAction | null {
  if (!status?.companyName) {
    return null;
  }
  const me = status.members.find((member) => member.isMe);

  if (status.phase === "nominate") {
    if (!status.myNomineeId || status.hostTied) {
      return { view: "host", key: "nominate" };
    }
    if (!status.iRequestedAdvanceNominate) {
      return { view: "host", key: "advance" };
    }
    return null;
  }

  if (status.phase === "topic") {
    if (status.iAmHost) {
      return { view: "host", key: "topic" };
    }
    return null;
  }

  if (status.phase === "propose") {
    if (!me?.submitted) {
      return { view: "myProposal", key: "propose" };
    }
    if (!status.iRequestedAdvancePropose) {
      return { view: "myProposal", key: "advance" };
    }
    return null;
  }

  if (status.phase === "vote" && !status.iHaveVoted) {
    return { view: "proposals", key: "vote" };
  }

  if (
    status.phase === "complete" &&
    me?.submitted &&
    !status.iRequestedReset
  ) {
    return { view: "home", key: "reset" };
  }

  return null;
}
