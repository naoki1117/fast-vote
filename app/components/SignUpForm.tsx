"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none ring-indigo-500 transition focus:border-indigo-400 focus:ring-2";

/** 会社名つきで登録したあと、同じ資格情報でそのままログインする */
function SignUpForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // 先にアカウントを作り、成功したら同じ入力でセッションを取る
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setError(data.error ?? "登録に失敗しました。");
      return;
    }

    // 登録成功後に手動ログイン。失敗してもアカウント自体は作れている
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setSubmitting(false);

    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setError("登録は完了しました。ログインしてください。");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="companyName"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          会社名またはグループ名
        </label>
        <input
          id="companyName"
          type="text"
          autoComplete="organization"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className={inputClass}
          placeholder="株式会社サンプル"
        />
      </div>
      <div>
        <label
          htmlFor="signup-name"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          氏名またはニックネーム
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="nickname"
          required
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="山田太郎"
        />
      </div>
      <div>
        <label
          htmlFor="signup-email"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          メールアドレス
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label
          htmlFor="signup-password"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          パスワード
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="8文字以上"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting}
      >
        {submitting ? "登録中..." : "アカウントを作成"}
      </button>
    </form>
  );
}

export default SignUpForm;
