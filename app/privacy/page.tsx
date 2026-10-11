import type { Metadata } from "next";
import Link from "next/link";
import { SITE_ADMIN } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Fast Vote",
  description: "Fast Vote の個人情報の取り扱い",
};

export default function PrivacyPage() {
  return (
    <article className="page-shell max-w-3xl py-10 text-sm leading-7 text-slate-700 sm:py-14">
      <p className="text-xs font-medium text-indigo-600">Fast Vote</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        プライバシーポリシー
      </h1>
      <p className="mt-2 text-slate-500">最終更新: 2026年10月11日</p>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">1. 収集する情報</h2>
        <p>
          本アプリは、会社名またはグループ名、氏名またはニックネーム、メールアドレス、パスワード、提案、投票、ホスト指名、チャット、ログイン中かどうかの情報を、サービス提供のために保存します。パスワードはログイン判定に使い、第三者へ販売しません。
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">2. 利用目的</h2>
        <p>
          同じ会社・グループ内でのホスト指名、お題、提案、投票、結果表示、チャット、欠席時の進行のために使います。ホスティング（Vercel）とデータベース（Supabase）の範囲で処理します。
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">3. 共有の範囲</h2>
        <p>
          提案・票・チャット・表示名は、同じ会社名で登録したメンバーに見えます。公開キー経由の外部からは、通知用テーブル以外の本文を読めないようにしています。
        </p>
      </section>

      <section id="leave" className="mt-8 scroll-mt-24 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          4. グループを抜ける・アカウント削除
        </h2>
        <p>
          画面から自分でグループを抜ける機能はありません。抜けたい場合や、アカウント削除を希望する場合は、管理者へメールしてください。依頼に基づき、所属の解除やデータの削除を対応します。
        </p>
        <p>
          管理者: {SITE_ADMIN.name}
          <br />
          メール:{" "}
          <a className="text-indigo-600 underline" href={`mailto:${SITE_ADMIN.email}`}>
            {SITE_ADMIN.email}
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">5. Cookie とセッション</h2>
        <p>
          ログイン維持のため Cookie（JWT セッション、有効期限は約2時間）を使います。ホーム画面追加（PWA）用の Service Worker は、API の内容はキャッシュしません。
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">6. お問い合わせ</h2>
        <p>
          個人情報の開示・訂正・削除の依頼も、同じ管理者へご連絡ください。
        </p>
        <p>
          管理者: {SITE_ADMIN.name}
          <br />
          メール:{" "}
          <a className="text-indigo-600 underline" href={`mailto:${SITE_ADMIN.email}`}>
            {SITE_ADMIN.email}
          </a>
        </p>
      </section>

      <p className="mt-10">
        <Link href="/" className="text-indigo-600 underline">
          トップへ戻る
        </Link>
      </p>
    </article>
  );
}
