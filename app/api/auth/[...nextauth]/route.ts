import { nextAuthOptions } from "@/app/lib/next-auth/auth";
import NextAuth from "next-auth/next";

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
