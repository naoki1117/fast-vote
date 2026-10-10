import { nextAuthOptions } from "@/app/lib/auth";
import NextAuth from "next-auth/next";

// /api/auth/* を NextAuth に委譲する（ログイン・ログアウト・セッション取得）
const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
