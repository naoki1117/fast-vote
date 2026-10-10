"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CompanyStatus from "../components/CompanyStatus";
import HostRound from "../components/HostRound";
import MyProposal from "../components/MyProposal";
import PageLoading from "../components/PageLoading";
import ProposalList from "../components/ProposalList";
import StatusBanner from "../components/StatusBanner";
import VoteResults from "../components/VoteResults";
import { CompanyStatusProvider } from "../lib/company-status-context";

type ViewKey =
  | "home"
  | "host"
  | "myProposal"
  | "companyStatus"
  | "proposals"
  | "voteResults";

const navItems: { key: ViewKey; label: string; hint: string }[] = [
  { key: "home", label: "ホーム", hint: "いまの状況" },
  { key: "host", label: "ホスト・お題", hint: "指名とお題" },
  { key: "myProposal", label: "自分の提案", hint: "1人1件" },
  { key: "companyStatus", label: "提出状況", hint: "誰が出したか" },
  { key: "proposals", label: "投票する", hint: "1〜2件" },
  { key: "voteResults", label: "得票（上位5）", hint: "同票は同順位" },
];

const Page = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  // 最初に提案提出へ。未提出だと投票が始まらないため
  const [view, setView] = useState<ViewKey>("host");
  const [mounted, setMounted] = useState(false);

  // サーバー HTML とクライアントのセッション表示が食い違う hydration エラーを避ける
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "loading") {
    return <PageLoading />;
  }

  // 未ログインは middleware がトップへ戻す。その間の空白を防ぐ
  if (status !== "authenticated") {
    return <PageLoading label="ログイン画面へ移動します..." />;
  }

  return (
    <CompanyStatusProvider>
    <div className="page-shell space-y-6 py-6 sm:py-8">
      <StatusBanner />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="card h-fit p-3 lg:sticky lg:top-24">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            メニュー
          </p>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item min-w-[9.5rem] lg:min-w-0 ${
                  view === item.key ? "nav-item-active" : "nav-item-idle"
                }`}
                onClick={() => setView(item.key)}
              >
                <span>
                  <span className="block">{item.label}</span>
                  <span
                    className={`hidden text-xs font-normal lg:block ${
                      view === item.key ? "text-indigo-100" : "text-slate-400"
                    }`}
                  >
                    {item.hint}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          {view === "home" && (
            <div className="space-y-6">
              <div className="card p-6 sm:p-8">
                <p className="text-sm font-medium text-indigo-600">
                  {user?.companyName ?? "会社未所属"}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  全員の提案を見て、すばやく投票する。
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  {user?.name ?? "ゲスト"}さん。毎回ホストを指名し、ホストがお題を出します。
                  提案は1人1件です。全員が提出すると投票を開始できます。
                  投票は1件または2件で、送信後は変更できません。
                  全員の投票が完了したあと、全員が削除申請するとホスト・お題・提案・票が初期化されます。
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {navItems
                  .filter((item) => item.key !== "home")
                  .map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setView(item.key)}
                      className="card p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                    >
                      <h2 className="font-semibold text-slate-900">{item.label}</h2>
                      <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
                    </button>
                  ))}
              </div>
            </div>
          )}
          {view === "host" && <HostRound />}
          {view === "myProposal" && <MyProposal />}
          {view === "companyStatus" && <CompanyStatus />}
          {view === "proposals" && <ProposalList />}
          {view === "voteResults" && <VoteResults />}
        </section>
      </div>
    </div>
    </CompanyStatusProvider>
  );
};

export default Page;
