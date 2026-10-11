"use client";

import { useEffect, useRef, useState } from "react";
import { useCompanyStatus } from "@/app/lib/company-status-context";
import { getNextAction } from "@/app/lib/next-action";
import AdvanceSkipCard from "./AdvanceSkipCard";
import NextStepMark from "./NextStepMark";

/** 投票開始・終了と、全員申請での初期化をダッシュボード上部に出す */
export default function StatusBanner() {
  const { status, refresh } = useCompanyStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const autoResetStarted = useRef(false);

  const needed = status?.resetNeededCount || status?.totalCount || 0;
  const allAsked =
    Boolean(status?.votingComplete) &&
    needed > 0 &&
    (status?.resetRequestCount ?? 0) >= needed;
  const iSubmitted = Boolean(
    status?.members.find((member) => member.isMe)?.submitted,
  );
  const nextAction = getNextAction(status);

  const finishRoundIfReady = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/reset-request", { method: "POST" });
      const raw = await res.text();
      let data: { error?: string; reset?: boolean } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {
          error:
            res.status === 504
              ? "初期化に時間がかかっています。画面を更新して確認してください。"
              : "削除申請できませんでした。",
        };
      }
      if (!res.ok) {
        await refresh();
        // すでに次の回へ進んでいると 403 になるので、エラーにしない
        if (res.status === 403) {
          return;
        }
        setError(data.error ?? "削除申請できませんでした。");
        autoResetStarted.current = false;
        return;
      }
      await refresh();
    } catch {
      setError("通信に失敗しました。もう一度試してください。");
      autoResetStarted.current = false;
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  // 申請が揃ったらボタンなしで次の回（ホスト指名）へ進める
  useEffect(() => {
    if (!allAsked || autoResetStarted.current) {
      return;
    }
    autoResetStarted.current = true;
    void finishRoundIfReady();
  }, [allAsked]);

  if (!status?.companyName) {
    return null;
  }

  return (
    <div className="space-y-3">
      {status.phase === "nominate" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          この回のホストを指名してください。全員の指名が揃い、最多が1人に決まるとホストになります。欠席者がいる場合は「ホスト・お題」から、いまのメンバーの半数以上の申請で進められます。
        </div>
      )}
      {status.phase === "topic" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          ホスト（{status.host?.name ?? "未設定"}
          ）がお題を出すまで、提案は開始しません。
        </div>
      )}
      {status.topicTitle && status.phase !== "complete" && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">
          <span className="font-semibold">お題：{status.topicTitle}</span>
          {status.topicContent ? (
            <span className="mt-1 block text-slate-600">
              {status.topicContent}
            </span>
          ) : null}
        </div>
      )}
      {status.phase === "propose" ? <AdvanceSkipCard stage="propose" /> : null}
      {status.votingOpen && !status.votingComplete && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          メンバーの提案が出揃いました。投票を開始できます。
        </div>
      )}
      {status.votingComplete && (
        <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
          <p>
            全員の投票が終わりました。結果は「得票（上位5）」で確認できます。
          </p>
          <p className="text-indigo-800">
            次の回に進むには、この回に提案したメンバー全員の削除申請が必要です。揃った時点でホスト・お題・提案・票・チャットは消え、自動でホスト指名に戻ります。アカウントは残ります。
          </p>
          <p>
            削除申請 {status.resetRequestCount} / {needed}
            {status.iRequestedReset ? "（申請済み）" : ""}
          </p>
          {status.members.some(
            (member) => member.submitted && !member.resetRequested,
          ) ? (
            <p className="text-indigo-800">
              未申請:{" "}
              {status.members
                .filter((member) => member.submitted && !member.resetRequested)
                .map((member) => member.name ?? "未設定")
                .join("、")}
            </p>
          ) : (
            <p className="text-indigo-800">
              {busy ? "次の回へ移っています..." : "申請が揃いました。次の回へ移ります。"}
            </p>
          )}
          {error && <p className="text-red-600">{error}</p>}
          {iSubmitted && !status.iRequestedReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => void finishRoundIfReady()}
              >
                {busy ? "送信中..." : "削除申請する"}
              </button>
              {nextAction?.key === "reset" ? <NextStepMark /> : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
