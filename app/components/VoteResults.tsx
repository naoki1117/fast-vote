"use client";

import { useEffect, useState } from "react";
import { useCompanyStatus } from "@/app/lib/company-status-context";

/** /api/vote-results の1件。同票は同じ rank（1位・1位・3位） */
type Result = {
  id: string;
  title: string;
  content: string;
  authorName?: string | null;
  voteCount: number;
  rank: number;
  voters: { id: string; name?: string | null }[];
};

/** 自社の得票上位5件。バーの長さは1位を100%にする */
const rankStyle = [
  "bg-amber-100 text-amber-800",
  "bg-slate-200 text-slate-700",
  "bg-orange-100 text-orange-800",
];

const VoteResults = () => {
  const { status } = useCompanyStatus();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const votedCount = status?.votedCount ?? 0;
  const votingComplete = Boolean(status?.votingComplete);
  const phase = status?.phase ?? "nominate";

  useEffect(() => {
    async function getResult() {
      try {
        const res = await fetch("/api/vote-results", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        setResults(await res.json());
      } catch (error) {
        console.error("Error fetching vote results:", error);
      }
      setLoading(false);
    }

    getResult();
  }, [votedCount, votingComplete, phase]);

  if (loading) {
    return <div className="card p-8 text-center text-slate-500">結果を読み込み中...</div>;
  }

  const maxVotes = Math.max(1, ...results.map((item) => item.voteCount)); // 0票でもバー計算が割れないように1以上

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">得票ランキング</h1>
        <p className="mt-1 text-sm text-slate-500">
          投票数が多い提案の上位5件です。同票は同じ順位、次は飛ばします（例: 1位・1位・3位）。
        </p>
      </div>

      {results.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">まだ投票結果がありません。</div>
      ) : (
        <div className="space-y-3">
          {results.map((data) => {
            const count = data.voteCount;
            const rank = data.rank ?? 0;
            const width = `${Math.round((count / maxVotes) * 100)}%`;
            return (
              <article key={data.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        rankStyle[rank - 1] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {rank}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-slate-900">{data.title}</h2>
                      {data.authorName && (
                        <p className="mt-0.5 text-xs text-slate-500">提案者: {data.authorName}</p>
                      )}
                      {data.content && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{data.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{count}</p>
                    <p className="text-xs text-slate-500">票</p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width }} />
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-indigo-600">
                    投票者を見る
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.voters.length === 0 ? (
                      <span className="text-sm text-slate-500">まだいません</span>
                    ) : (
                      data.voters.map((voter) => (
                        <span
                          key={voter.id}
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                        >
                          {voter.name ?? "匿名"}
                        </span>
                      ))
                    )}
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VoteResults;
