// import { nextAuthOptions } from "@/app/lib/next-auth/options";
// import NextAuth from "next-auth/next";

// const handler = NextAuth(nextAuthOptions);

// export { handler as GET, handler as POST };

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Awaitable, NextAuthOptions, RequestInternal, User } from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import prisma from "../../../lib/prisma";
import { UserType } from "@/app/types/types";
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcrypt";
import NextAuth from "next-auth/next";

export const nextAuthOptions: NextAuthOptions = {
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

        // const passwordMatch = await bcrypt.compare(
        //   credentials.password,
        //   user.password
        // );

        // if (!passwordMatch) {
        //   return null;
        // }

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
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
