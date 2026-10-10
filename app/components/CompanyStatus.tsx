"use client";

import { useEffect, useState } from "react";
import type { CompanyStatusPayload } from "@/app/types/company-status";

/** 同じ会社の誰が提案済みかを一覧し、投票開始の目安にする */
const CompanyStatus = () => {
  const [status, setStatus] = useState<CompanyStatusPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/company-status");
        if (!res.ok) {
          setFailed(true);
          setLoaded(true);
          return;
        }
        setStatus(await res.json());
        setLoaded(true);
      } catch {
        setFailed(true);
        setLoaded(true);
      }
    };
    load();
  }, []);

  if (!loaded) {
    return <div className="card p-8 text-center text-slate-500">提出状況を読み込み中...</div>;
  }

  if (failed || !status) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">提出状況</h1>
        <p className="mt-2 text-sm text-slate-500">状況を取得できませんでした。</p>
      </div>
    );
  }

  if (!status.companyName) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">提出状況</h1>
        <p className="mt-2 text-sm text-slate-500">会社に所属していないため、提出状況を表示できません。</p>
      </div>
    );
  }

  // 進捗バー用。0人会社は 0% にしてゼロ除算しない
  const percent =
    status.totalCount === 0 ? 0 : Math.round((status.submittedCount / status.totalCount) * 100);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">提出状況</h1>
        <p className="mt-1 text-sm text-slate-500">
          {status.companyName} のメンバーが全員提案を提出すると、投票が始まります。
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">提出済み</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {status.submittedCount} / {status.totalCount}
            </p>
          </div>
          {status.votingOpen ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              投票受付中
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
              投票はまだ開始していません
            </span>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {status.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {member.name ?? "未設定"}
                  {member.isMe ? <span className="ml-2 text-xs text-indigo-600">あなた</span> : null}
                </p>
                {member.submitted && member.proposalTitle ? (
                  <p className="truncate text-sm text-slate-500">{member.proposalTitle}</p>
                ) : (
                  <p className="text-sm text-slate-400">未提出</p>
                )}
              </div>
              {member.submitted ? (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  提出済み
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  未提出
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CompanyStatus;
