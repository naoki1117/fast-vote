"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import CompanyChat from "../components/CompanyChat";
import CompanyStatus from "../components/CompanyStatus";
import HostRound from "../components/HostRound";
import MyProposal from "../components/MyProposal";
import NextStepMark from "../components/NextStepMark";
import PageLoading from "../components/PageLoading";
import ProposalList from "../components/ProposalList";
import StatusBanner from "../components/StatusBanner";
import VoteResults from "../components/VoteResults";
import { CompanyStatusProvider, useCompanyStatus } from "../lib/company-status-context";
import { getNextAction, type DashboardView } from "../lib/next-action";

type ViewKey = DashboardView;

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
  const [view, setView] = useState<ViewKey>("host");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "loading") {
    return <PageLoading />;
  }

  if (status !== "authenticated") {
    return <PageLoading label="ログイン画面へ移動します..." />;
  }

  return (
    <CompanyStatusProvider>
      <DashboardBody user={user} view={view} setView={setView} />
    </CompanyStatusProvider>
  );
};

function DashboardBody({
  user,
  view,
  setView,
}: {
  user: { name?: string | null; companyName?: string | null } | undefined;
  view: ViewKey;
  setView: (view: ViewKey) => void;
}) {
  const { status: companyStatus } = useCompanyStatus();
  const nextAction = getNextAction(companyStatus);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 overflow-x-hidden px-4 py-4 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
      <StatusBanner />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[200px_minmax(0,1fr)_minmax(260px,320px)]">
        <aside className="card min-w-0 p-2 sm:p-3 lg:sticky lg:top-24 lg:h-fit">
          <p className="hidden px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">
            メニュー
          </p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-col">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item min-w-0 px-2 py-2 sm:px-3 ${
                  view === item.key ? "nav-item-active" : "nav-item-idle"
                }`}
                onClick={() => setView(item.key)}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="block truncate">{item.label}</span>
                    {nextAction?.view === item.key ? <NextStepMark /> : null}
                  </span>
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

        <section className="min-w-0 overflow-x-hidden">
          {view === "home" && (
            <div className="space-y-6">
              <div className="card p-5 sm:p-8">
                <p className="text-sm font-medium text-indigo-600">
                  {user?.companyName ?? "会社未所属"}
                </p>
                <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">
                  全員の提案を見て、すばやく投票する。
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  {user?.name ?? "ゲスト"}さん。毎回ホストを指名し、ホストがお題を出します。
                  提案は1人1件です。内容は任意です。全員が提出すると投票を開始できます。
                  投票は1件または2件で、送信後は変更できません。
                  全員の投票が完了したあと、提案したメンバーが削除申請するとホスト・お題・提案・票・チャットが初期化されます。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {navItems
                  .filter((item) => item.key !== "home")
                  .map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setView(item.key)}
                      className="card p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5"
                    >
                      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                        {item.label}
                        {nextAction?.view === item.key ? <NextStepMark /> : null}
                      </h2>
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

        <div className="min-w-0 lg:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-1">
          <CompanyChat />
        </div>
      </div>
    </div>
  );
}

export default Page;
