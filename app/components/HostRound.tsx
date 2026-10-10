"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCompanyStatus } from "@/app/lib/company-status-context";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none ring-indigo-500 transition focus:border-indigo-400 focus:ring-2";

/** ホスト指名と、ホストによるお題提出 */
export default function HostRound() {
  const { status, loaded, failed, refresh } = useCompanyStatus();
  const [nomineeId, setNomineeId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status?.myNomineeId) {
      setNomineeId(status.myNomineeId);
    }
  }, [status?.myNomineeId]);

  const nominate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nomineeId) {
      setError("指名するメンバーを選んでください。");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/host-nomination", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomineeId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "指名に失敗しました。");
      return;
    }
    await refresh();
  };

  const submitTopic = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "お題を出せませんでした。");
      return;
    }
    await refresh();
  };

  if (!loaded) {
    return <div className="card p-8 text-center text-slate-500">読み込み中...</div>;
  }
  if (failed || !status?.companyName) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">ホスト・お題</h1>
        <p className="mt-2 text-sm text-slate-500">状況を取得できませんでした。</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ホスト・お題</h1>
        <p className="mt-1 text-sm text-slate-500">
          毎回メンバーがホストを指名します。最多指名の人がお題を出します。
        </p>
      </div>

      {status.host && (
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">ホスト</p>
          <p className="mt-1 font-semibold text-slate-900">{status.host.name ?? "未設定"}</p>
        </div>
      )}

      {status.topicTitle && (
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">お題</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{status.topicTitle}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {status.topicContent}
          </p>
        </div>
      )}

      {status.phase === "nominate" && (
        <form onSubmit={nominate} className="card space-y-4 p-6">
          <p className="text-sm text-slate-600">
            指名 {status.nominatedCount} / {status.totalCount}
            {status.hostTied ? "。最多が同数です。指名を変更してください。" : ""}
          </p>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {status.members.map((member) => (
              <li key={member.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <span className="font-medium text-slate-900">
                      {member.name ?? "未設定"}
                      {member.isMe ? "（自分）" : ""}
                    </span>
                    <span className="ml-2 text-sm text-slate-500">指名 {member.nominationCount}</span>
                  </span>
                  <input
                    type="radio"
                    name="nominee"
                    value={member.id}
                    checked={nomineeId === member.id}
                    onChange={() => setNomineeId(member.id)}
                    className="h-4 w-4 text-indigo-600"
                  />
                </label>
              </li>
            ))}
          </ul>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "送信中..." : status.myNomineeId ? "指名を更新する" : "指名する"}
          </button>
        </form>
      )}

      {status.phase === "topic" && status.iAmHost && (
        <form onSubmit={submitTopic} className="card space-y-4 p-6">
          <p className="text-sm text-slate-600">ホストに決まりました。この回のお題を出してください。</p>
          <div>
            <label htmlFor="topic-title" className="mb-1.5 block text-sm font-medium text-slate-700">
              お題
            </label>
            <input
              id="topic-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="お題のタイトル"
            />
          </div>
          <div>
            <label htmlFor="topic-content" className="mb-1.5 block text-sm font-medium text-slate-700">
              説明
            </label>
            <textarea
              id="topic-content"
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={inputClass}
              placeholder="提案してほしい内容"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "送信中..." : "お題を出す"}
          </button>
        </form>
      )}

      {status.phase === "topic" && !status.iAmHost && (
        <div className="card p-6 text-sm text-slate-600">
          ホスト（{status.host?.name ?? "未設定"}）がお題を作成しています。
        </div>
      )}
    </div>
  );
}
