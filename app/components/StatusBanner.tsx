"use client";

import { useState } from "react";
import { useCompanyStatus } from "@/app/lib/company-status-context";

/** 投票開始・終了と、全員申請での初期化をダッシュボード上部に出す */
export default function StatusBanner() {
  const { status, refresh } = useCompanyStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!status?.companyName) {
    return null;
  }

  const needed = status.resetNeededCount || status.totalCount;
  const allAsked = needed > 0 && status.resetRequestCount >= needed;
  const iSubmitted = Boolean(status.members.find((member) => member.isMe)?.submitted);
  const canRetryReset = status.iRequestedReset && allAsked;

  const requestReset = async () => {
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
              ? "サーバーの応答が時間切れになりました。もう一度「初期化をやり直す」を押してください。"
              : "削除申請できませんでした。",
        };
      }
      if (!res.ok) {
        setError(data.error ?? "削除申請できませんでした。");
        await refresh();
        return;
      }
      await refresh();
    } catch {
      setError("通信に失敗しました。もう一度試してください。");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {status.phase === "nominate" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          この回のホストを指名してください。全員の指名が揃い、最多が1人に決まるとホストになります。
        </div>
      )}
      {status.phase === "topic" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          ホスト（{status.host?.name ?? "未設定"}）がお題を出すまで、提案は開始しません。
        </div>
      )}
      {status.topicTitle && status.phase !== "complete" && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">
          <span className="font-semibold">お題：{status.topicTitle}</span>
          {status.topicContent ? (
            <span className="mt-1 block text-slate-600">{status.topicContent}</span>
          ) : null}
        </div>
      )}
      {status.votingOpen && !status.votingComplete && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          メンバーの提案が出揃いました。投票を開始できます。
        </div>
      )}
      {status.votingComplete && (
        <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
          <p>全員の投票が終わりました。結果は「得票（上位5）」で確認できます。</p>
          <p className="text-indigo-800">
            次の回に進むには、この回に提案したメンバー全員の削除申請が必要です。揃った時点でホスト・お題・提案・票・チャットは消えます。アカウントは残ります。
          </p>
          <p>
            削除申請 {status.resetRequestCount} / {status.resetNeededCount || status.totalCount}
            {status.iRequestedReset ? "（申請済み）" : ""}
          </p>
          {status.members.some((member) => member.submitted && !member.resetRequested) ? (
            <p className="text-indigo-800">
              未申請:{" "}
              {status.members
                .filter((member) => member.submitted && !member.resetRequested)
                .map((member) => member.name ?? "未設定")
                .join("、")}
            </p>
          ) : null}
          {error && <p className="text-red-600">{error}</p>}
          {iSubmitted ? (
            <button
              type="button"
              className="btn-primary"
              disabled={busy || (status.iRequestedReset && !canRetryReset)}
              onClick={requestReset}
            >
              {busy
                ? "送信中..."
                : canRetryReset
                  ? "初期化をやり直す"
                  : status.iRequestedReset
                    ? "削除申請済み"
                    : "削除申請する"}
            </button>
          ) : (
            <p className="text-indigo-800">提案したメンバーの申請が揃うと次の回に進みます。</p>
          )}
        </div>
      )}
    </div>
  );
}
