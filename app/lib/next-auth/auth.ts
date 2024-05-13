import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, User } from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import prisma from "../prisma";
import { UserType } from "@/app/types/types";

// 日本時間の1時間を秒単位で計算
const oneHourInSeconds = 1 * 60;

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

        return user ? user : null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: oneHourInSeconds,
  },
  adapter: PrismaAdapter(prisma),

  secret: process.env.NEXTAUTH_SECRET,
};

// const { handlers, auth, signIn, signOut } = NextAuth(nextAuthOptions);

// export { handlers, auth, signIn, signOut };
