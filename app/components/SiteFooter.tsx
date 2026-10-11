import Link from "next/link";
import { SITE_ADMIN } from "@/app/lib/site";

/** 全ページ下部の隅。プライバシーと退会の案内 */
export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80">
      <div className="page-shell flex flex-wrap items-center justify-between gap-2 py-3 text-xs text-slate-400">
        <span>Fast Vote</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/privacy" className="hover:text-slate-600">
            プライバシーポリシー
          </Link>
          <Link href="/privacy#leave" className="hover:text-slate-600">
            グループを抜ける場合
          </Link>
          <a href={`mailto:${SITE_ADMIN.email}`} className="hover:text-slate-600">
            管理者 {SITE_ADMIN.name}
          </a>
        </span>
      </div>
    </footer>
  );
}
