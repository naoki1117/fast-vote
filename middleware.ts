import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

/**
 * ページ遷移の入口でログイン状態を見る。
 */
export async function middleware(req: NextRequest) {
  // Cookie 内の JWT を検証する（DB には都度問い合わせない）
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthed = Boolean(token);
  const { pathname } = req.nextUrl;

  // 未ログインでダッシュボードに来たらトップ（ログイン）へ戻す
  if (pathname.startsWith("/dashboard") && !isAuthed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ログイン済みでトップに来たら作業画面へ進める
  if (pathname === "/" && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // API や静的ファイルは対象外。画面ルートだけ見る
  matcher: ["/", "/dashboard/:path*"],
};
