"use client";

import { useState } from "react";
import { useCompanyStatus } from "@/app/lib/company-status-context";
import { SITE_ADMIN } from "@/app/lib/site";
import { getNextAction } from "@/app/lib/next-action";
import NextStepMark from "./NextStepMark";

/** 欠席者を待たず、いまのメンバーだけで次へ進む申請 */
export default function AdvanceSkipCard({
  stage,
}: {
  stage: "nominate" | "propose";
}) {
  const { status, refresh } = useCompanyStatus();
  const nextAction = getNextAction(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!status?.companyName) {
    return null;
  }
  if (stage === "nominate" && status.phase !== "nominate") {
    return null;
  }
  if (stage === "propose" && status.phase !== "propose") {
    return null;
  }

  const count =
    stage === "nominate"
      ? status.advanceNominateCount
      : status.advanceProposeCount;
  const already =
    stage === "nominate"
      ? status.iRequestedAdvanceNominate
      : status.iRequestedAdvancePropose;
  const needed = status.advanceNeededCount;
  const showNext = nextAction?.key === "advance";

  const requestAdvance = async () => {
    setError("");
    setBusy(true);
    const res = await fetch("/api/advance-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "申請できませんでした。");
      return;
    }
    if (data.tied) {
      setError("最多が同数です。指名を変えて1人に決めてください。");
    }
    await refresh();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
      <p>
        欠席やグループを抜けた人がいて全員を待てないときは、いまログイン中のメンバーの
        <span className="font-semibold">半数以上</span>
        が申請すると次へ進めます。グループを抜ける場合はサイト管理者へ連絡してください（
        <a href="/privacy#leave" className="text-indigo-600 underline">
          プライバシーポリシー
        </a>
        ）。
      </p>
      <p className="mt-2">
        今のメンバーで進める申請 {count} / {needed}
        {already ? "（申請済み）" : ""}
      </p>
      {error ? <p className="mt-2 text-red-600">{error}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-ghost"
          disabled={busy || already}
          onClick={() => void requestAdvance()}
        >
          {already ? "申請済み" : busy ? "送信中..." : "今のメンバーで進める"}
        </button>
        {showNext ? <NextStepMark /> : null}
      </div>
    </div>
  );
}
