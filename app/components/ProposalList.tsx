"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useCompanyStatus } from "@/app/lib/company-status-context";
import { getNextAction } from "@/app/lib/next-action";
import CompanyStatus from "./CompanyStatus";
import NextStepMark from "./NextStepMark";

/** /api/proposals の1件。author.email で自分の提案かを判定する */
type Proposal = {
  id: string;
  title: string;
  content: string;
  author?: { id?: string; name?: string | null; email?: string | null };
};

/** 全員提出後に、自分以外の提案へ1票または2票入れる画面 */
const ProposalList = () => {
  const { status, loaded: statusLoaded, failed: statusFailed, refresh } = useCompanyStatus();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
    null
  );
  const { data: session } = useSession();
  const myEmail = session?.user?.email;
  const votingOpen = Boolean(status?.votingOpen);
  const votingComplete = Boolean(status?.votingComplete);
  const phase = status?.phase ?? "nominate";
  const hasVoted = Boolean(status?.iHaveVoted);
  const locked = hasVoted || votingComplete;
  const nextAction = getNextAction(status);

  const handleCheckboxChange = (id: string) => {
    if (locked) {
      return;
    }
    setMessage(null);
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        setMessage({ type: "error", text: "投票は2件までです。" });
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (locked) {
      setMessage({ type: "error", text: "投票は完了済みです。変更はできません。" });
      return;
    }
    if (selectedItems.length < 1 || selectedItems.length > 2) {
      setMessage({ type: "error", text: "1件または2件選んで送信してください。" });
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedItems }),
    });
    const postResult = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setMessage({
        type: "error",
        text:
          postResult === "failed"
            ? "既に投票済みです。変更はできません。"
            : (postResult.error ?? "投票に失敗しました。"),
      });
      return;
    }

    setMessage({ type: "ok", text: "投票を受け付けました。この内容は変更できません。" });
    await refresh();
  };

  useEffect(() => {
    if (status?.iHaveVoted && Array.isArray(status.myVotedPostIds)) {
      setSelectedItems(status.myVotedPostIds);
    }
    if (status?.phase === "nominate" || status?.phase === "topic") {
      setSelectedItems([]);
      setProposals([]);
    }
  }, [status?.iHaveVoted, status?.myVotedPostIds, status?.phase]);

  useEffect(() => {
    if (!votingOpen) {
      setLoaded(true);
      return;
    }
    const fetchProposals = async () => {
      try {
        const proposalRes = await fetch("/api/proposals", { cache: "no-store" });
        if (!proposalRes.ok) {
          setLoadError(true);
          return;
        }
        setProposals(await proposalRes.json());
        setLoaded(true);
      } catch (error) {
        console.error("Error fetching proposals:", error);
        setLoadError(true);
      }
    };

    fetchProposals();
  }, [votingOpen, status?.submittedCount, status?.phase]);

  if (loadError || statusFailed) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">投票</h1>
        <p className="mt-2 text-sm text-slate-500">提案一覧を取得できませんでした。</p>
      </div>
    );
  }

  if (!loaded || !statusLoaded) {
    return <div className="card p-8 text-center text-slate-500">提案を読み込み中...</div>;
  }

  if (!votingOpen) {
    return (
      <div className="space-y-5">
        <div className="card border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          {phase === "nominate" || phase === "topic"
            ? "ホストとお題が決まるまで、投票は開始しません。"
            : "まだ全員の提案が揃っていないので、投票は始まっていません。"}
        </div>
        <CompanyStatus />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">投票</h1>
          <p className="mt-1 text-sm text-slate-500">
            {locked
              ? "投票は完了しています。あとから選び直すことはできません。"
              : "自分以外の提案から、1件か2件を選んで送ってください。"}
          </p>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
          {locked ? "投票済み" : `選択中 ${selectedItems.length} / 2`}
        </div>
      </div>

      <div className="grid gap-3">
        {proposals.length === 0 && (
          <div className="card p-8 text-center text-slate-500">表示できる提案がありません。</div>
        )}
        {proposals.map((post) => {
          const isOwn = Boolean(myEmail && post.author?.email === myEmail);
          const checked = selectedItems.includes(post.id);
          return (
            <label
              key={post.id}
              className={`card flex items-start justify-between gap-4 p-4 transition ${
                isOwn || locked
                  ? "cursor-not-allowed opacity-60"
                  : `cursor-pointer ${checked ? "border-indigo-400 ring-2 ring-indigo-100" : "hover:border-slate-300"}`
              }`}
            >
              <span className="min-w-0">
                <span className="block font-semibold text-slate-900">{post.title}</span>
                <span className="mt-1 block text-sm text-slate-500">
                  提案者: {post.author?.name ?? "不明"}
                  {isOwn ? "（自分の提案）" : ""}
                </span>
                {post.content && (
                  <span className="mt-2 block line-clamp-2 text-sm text-slate-600">
                    {post.content}
                  </span>
                )}
              </span>
              <input
                type="checkbox"
                name="vote"
                value={post.id}
                checked={checked}
                disabled={isOwn || locked}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                onChange={() => handleCheckboxChange(post.id)}
              />
            </label>
          );
        })}
      </div>

      {message && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {submitting && (
        <p className="text-sm font-medium text-indigo-600">送信しています...</p>
      )}

      {!locked && (
        <div className="sticky bottom-4 flex min-w-0 flex-col items-stretch gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-sm text-slate-500">
            1件だけでも送れます。送ったあとは変更できません。
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button type="submit" className="btn-primary" disabled={submitting}>
              投票する
            </button>
            {nextAction?.key === "vote" ? <NextStepMark /> : null}
          </div>
        </div>
      )}
    </form>
  );
};

export default ProposalList;
