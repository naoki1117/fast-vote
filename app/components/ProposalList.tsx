"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CompanyStatus from "./CompanyStatus";

/** /api/proposals の1件。author.email で自分の提案かを判定する */
type Proposal = {
  id: string;
  title: string;
  content: string;
  author?: { id?: string; name?: string | null; email?: string | null };
};

/** 全員提出後に、自分以外の提案へ2票入れる画面 */
const ProposalList = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [votingOpen, setVotingOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
    null
  );
  const { data: session } = useSession();
  const myEmail = session?.user?.email;

  const handleCheckboxChange = (id: string) => {
    setMessage(null);
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      // 3件目は選ばせず、ルールをその場で伝える
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

    if (selectedItems.length !== 2) {
      setMessage({ type: "error", text: "投票する提案を2件選んでください。" });
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedItems }),
    });
    const postResult = await res.json();

    if (postResult === "failed") {
      setMessage({
        type: "error",
        text: "既に投票済みです。訂正する場合は管理者まで連絡ください。",
      });
    } else if (!res.ok) {
      setMessage({ type: "error", text: postResult.error ?? "投票に失敗しました。" });
    } else {
      setMessage({ type: "ok", text: "投票が完了しました。" });
      setSelectedItems([]);
    }
    setSubmitting(false);
  };

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        // 投票可否と一覧を同時に取り、未開放なら提出状況だけ見せる
        const [statusRes, proposalRes] = await Promise.all([
          fetch("/api/company-status"),
          fetch("/api/proposals"),
        ]);
        if (!statusRes.ok || !proposalRes.ok) {
          setLoadError(true);
          return;
        }
        const status = await statusRes.json();
        setVotingOpen(Boolean(status.votingOpen));
        setProposals(await proposalRes.json());
        setLoaded(true);
      } catch (error) {
        console.error("Error fetching proposals:", error);
        setLoadError(true);
      }
    };

    fetchProposals();
  }, []);

  if (loadError) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">全提案</h1>
        <p className="mt-2 text-sm text-slate-500">提案一覧を取得できませんでした。</p>
      </div>
    );
  }

  if (!loaded) {
    return <div className="card p-8 text-center text-slate-500">提案を読み込み中...</div>;
  }

  if (!votingOpen) {
    return (
      <div className="space-y-5">
        <div className="card border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          同じ会社の全員が提案を提出するまで、投票は開始しません。
        </div>
        <CompanyStatus />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">全提案</h1>
          <p className="mt-1 text-sm text-slate-500">投票したい提案を2件選んで送信してください。</p>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
          選択中 {selectedItems.length} / 2
        </div>
      </div>

      <div className="grid gap-3">
        {proposals.length === 0 && (
          <div className="card p-8 text-center text-slate-500">表示できる提案がありません。</div>
        )}
        {proposals.map((post) => {
          const isOwn = Boolean(myEmail && post.author?.email === myEmail); // 自分の提案はチェック不可
          const checked = selectedItems.includes(post.id);
          return (
            <label
              key={post.id}
              className={`card flex items-start justify-between gap-4 p-4 transition ${
                isOwn
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
                disabled={isOwn}
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
        <p className="text-sm font-medium text-indigo-600">通信中です。しばらくお待ちください...</p>
      )}

      <div className="sticky bottom-4 flex flex-col items-stretch gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">2件選んだら送信できます。自分の提案には投票できません。</p>
        <button type="submit" className="btn-primary" disabled={submitting}>
          投票する
        </button>
      </div>
    </form>
  );
};

export default ProposalList;
