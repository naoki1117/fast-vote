"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useCompanyStatus } from "@/app/lib/company-status-context";
import { getNextAction } from "@/app/lib/next-action";
import AdvanceSkipCard from "./AdvanceSkipCard";
import NextStepMark from "./NextStepMark";

type Voter = { id: string; name?: string | null };
/** /api/my-proposal が返す自分の提案。null なら未提出 */
type ProposalPayload = {
  id: string;
  title: string;
  content: string;
  voters: Voter[];
};

/** 未提出ならフォーム、提出済みなら自分の提案と得票を表示する */
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none ring-indigo-500 transition focus:border-indigo-400 focus:ring-2";

const MyProposal = () => {
  const { status, refresh } = useCompanyStatus();
  const [proposal, setProposal] = useState<ProposalPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const topicTitle = status?.topicTitle ?? null;
  const topicContent = status?.topicContent ?? null;
  const mySubmitted =
    status?.members.some((m) => m.isMe && m.submitted) ?? false;
  const votedCount = status?.votedCount ?? 0;
  const phase = status?.phase ?? "nominate";
  const nextAction = getNextAction(status);

  const loadProposal = useCallback(async () => {
    try {
      const res = await fetch("/api/my-proposal", { cache: "no-store" });
      // 取得失敗でもフォームは出す（500 のとき提出できなくなるのを避ける）
      if (!res.ok) {
        setFailed(true);
        setLoaded(true);
        return;
      }
      const data = await res.json();
      setProposal(data.proposal ?? null);
      setLoaded(true);
    } catch (err) {
      console.error("Error fetching proposal:", err);
      setFailed(true);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadProposal();
  }, [loadProposal, topicTitle, mySubmitted, votedCount, phase]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "提出に失敗しました。");
      return;
    }

    await refresh();
    await loadProposal();
  };

  if (!loaded) {
    return (
      <div className="card p-8 text-center text-slate-500">
        提案を読み込み中...
      </div>
    );
  }

  if (!proposal && !topicTitle) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">提案を提出</h1>
        <p className="mt-2 text-sm text-slate-500">
          ホストがお題を出すまで、提案はできません。
        </p>
      </div>
    );
  }

  // まだ提案がない（または取得失敗）→ 提出フォーム
  if (!proposal) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">提案を提出</h1>
          <p className="mt-1 text-sm text-slate-500">
            お題に沿って、1人1件提出してください。
          </p>
          {topicTitle && (
            <p className="mt-2 text-sm font-medium text-indigo-700">
              お題：{topicTitle}
            </p>
          )}
          {topicContent && (
            <p className="mt-1 text-sm text-slate-500">{topicContent}</p>
          )}
        </div>
        {failed && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            提案情報の取得に失敗しました。そのまま提出できる場合は下のフォームから試してください。
          </p>
        )}
        <form onSubmit={handleSubmit} className="card space-y-4 p-6 sm:p-8">
          <div>
            <label
              htmlFor="proposal-title"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              タイトル
            </label>
            <input
              id="proposal-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="提案のタイトル"
            />
          </div>
          <div>
            <label
              htmlFor="proposal-content"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              内容（任意）
            </label>
            <textarea
              id="proposal-content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={inputClass}
              placeholder="補足があれば入力（空でも提出できます）"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "提出中..." : "提案を提出する"}
            </button>
            {nextAction?.key === "propose" ? <NextStepMark /> : null}
          </div>
        </form>
        <AdvanceSkipCard stage="propose" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdvanceSkipCard stage="propose" />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">自分の提案</h1>
        <p className="mt-1 text-sm text-slate-500">
          提出した提案と、投票してくれた人の一覧です。
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          提案タイトル
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          {proposal.title}
        </h2>
        {proposal.content ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {proposal.content}
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-indigo-50 px-4 py-5">
            <p className="text-sm text-indigo-700">得票数</p>
            <p className="mt-1 text-3xl font-bold text-indigo-900">
              {proposal.voters.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-5">
            <p className="text-sm text-slate-500">投票者</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {proposal.voters.length === 0
                ? "まだいません"
                : `${proposal.voters.length}人`}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900">投票者</h3>
        {proposal.voters.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">まだ投票はありません。</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {proposal.voters.map((voter) => (
              <span
                key={voter.id}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                {voter.name ?? "匿名"}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProposal;
