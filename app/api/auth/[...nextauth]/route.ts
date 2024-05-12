import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, User } from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import prisma from "../../../lib/prisma";
import { UserType } from "@/app/types/types";
import NextAuth from "next-auth/next";

const handler = NextAuth({
  debug: process.env.NODE_ENV === "development",

  providers: [
    CredentialProvider({
      type: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "passwrd", type: "password" },
      },
      async authorize(credentials): Promise<UserType | null> {
        const user = await prisma.user.findFirst({
          where: {
            AND: { email: credentials?.email, password: credentials?.password },
          },
        });
        // ユーザーが存在しないか、パスワードが一致しない場合はnullを返す
        if (
          !user ||
          user.password !== credentials?.password ||
          user.email !== credentials?.email
        ) {
          return null;
        }

        // ユーザーが見つかった場合はユーザーオブジェクトを返す
        return user ? user : null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  adapter: PrismaAdapter(prisma),

  secret: process.env.NEXTAUTH_SECRET,
});

export default handler;
