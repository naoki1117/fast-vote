"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

/** 全ページ共通のヘッダー。ログイン名の横に会社名を出す */
const Header: FC = () => {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  // サーバー描画時はセッションが空なので、マウント後にだけ実データを出す
  useEffect(() => {
    setMounted(true);
  }, []);

  const name = session?.user?.name;
  const companyName = session?.user?.companyName;
  const initial = (name ?? "G").slice(0, 1);
  const ready = mounted && status !== "loading"; // 未準備の間はスケルトンを出してチラつきを防ぐ

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="page-shell flex h-14 items-center justify-between gap-2 sm:h-16">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white sm:h-9 sm:w-9">
            FV
          </span>
          <span className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Fast Vote
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!ready ? (
            <div className="h-9 w-36 animate-pulse rounded-full bg-slate-100" />
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {initial}
                </span>
                <span className="hidden min-w-0 sm:flex sm:flex-col">
                  <span className="max-w-[12rem] truncate text-sm font-medium leading-tight text-slate-700">
                    {name ?? "ログイン中"}
                  </span>
                  {companyName ? (
                    <span className="max-w-[12rem] truncate text-xs leading-tight text-slate-400">
                      {companyName}
                    </span>
                  ) : null}
                </span>
              </Link>
              <button
                className="btn-ghost px-2.5 py-2 text-xs sm:px-4 sm:text-sm"
                onClick={async () => {
                  await fetch("/api/presence-leave", { method: "POST" });
                  await signOut({ callbackUrl: "/" });
                }}
              >
                ログアウト
              </button>
            </>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-500">
              未ログイン
            </span>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
