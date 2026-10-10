"use client";

import { useEffect, useState } from "react";
import type { CompanyStatusPayload } from "@/app/types/company-status";

/** 投票開始・終了と、全員申請での初期化をダッシュボード上部に出す */
export default function StatusBanner() {
  const [status, setStatus] = useState<CompanyStatusPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/company-status");
    if (!res.ok) {
      return;
    }
    setStatus(await res.json());
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  if (!status?.companyName) {
    return null;
  }

  const requestReset = async () => {
    setError("");
    setBusy(true);
    const res = await fetch("/api/reset-request", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "削除申請できませんでした。");
      return;
    }
    if (data.reset) {
      window.location.reload();
      return;
    }
    await load();
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
            次の回に進むには、メンバー全員の削除申請が必要です。揃った時点でホスト・お題・提案・票は消えます。アカウントは残ります。
          </p>
          <p>
            削除申請 {status.resetRequestCount} / {status.totalCount}
            {status.iRequestedReset ? "（申請済み）" : ""}
          </p>
          {error && <p className="text-red-600">{error}</p>}
          <button
            type="button"
            className="btn-primary"
            disabled={busy || status.iRequestedReset}
            onClick={requestReset}
          >
            {status.iRequestedReset
              ? "削除申請済み"
              : busy
                ? "送信中..."
                : "削除申請する"}
          </button>
        </div>
      )}
    </div>
  );
}
