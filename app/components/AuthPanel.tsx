"use client";

import { useState } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

/** トップ右。ログインと新規登録をタブで切り替える */
export default function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="card p-6 shadow-panel sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          className={`rounded-lg py-2 text-sm font-semibold transition ${
            mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
          onClick={() => setMode("signin")}
        >
          ログイン
        </button>
        <button
          type="button"
          className={`rounded-lg py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
          onClick={() => setMode("signup")}
        >
          新規登録
        </button>
      </div>
      {mode === "signin" ? (
        <>
          <h2 className="text-xl font-semibold text-slate-900">ログイン</h2>
          <p className="mt-2 mb-6 text-sm text-slate-500">
            登録済みのメールアドレスとパスワードでログインします。
          </p>
          <SignInForm />
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-slate-900">新規登録</h2>
          <p className="mt-2 mb-6 text-sm text-slate-500">
            同一の会社名で登録すると、同じ会社に所属します。パスワードは8文字以上です。
          </p>
          <SignUpForm />
        </>
      )}
    </div>
  );
}
