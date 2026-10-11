import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import { UserType } from "@/app/types/user";
import prisma from "./prisma";
import { markUserAbsent, markUserPresent } from "./presence";

// セッションの有効期限（2時間）。秒で渡す必要がある
const twoHourInSeconds = 120 * 60;

export const nextAuthOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",

  providers: [
    CredentialProvider({
      type: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "passwrd", type: "password" },
      },
      // メールとパスワードが一致するユーザーだけ通す（Google などの外部ログインは使わない）
      async authorize(credentials): Promise<UserType | null> {
        const user = await prisma.user.findFirst({
          where: {
            AND: { email: credentials?.email, password: credentials?.password },
          },
          include: { company: true },
        });
        if (
          !user ||
          user.password !== credentials?.password ||
          user.email !== credentials?.email
        ) {
          return null;
        }

        await markUserPresent(user.id, user.companyId);

        // JWT / session に載せる最小限の情報。会社名はヘッダー表示用
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          password: user.password,
          companyName: user.company?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    // ログイン直後に user から token へ会社名をコピーする（以降のリクエストでは token だけが残る）
    async jwt({ token, user }) {
      if (user) {
        token.companyName = user.companyName ?? null;
      }
      return token;
    },
    // 画面の useSession() から会社名を読めるようにする
    async session({ session, token }) {
      if (session.user) {
        session.user.companyName = token.companyName ?? null;
      }
      return session;
    },
  },
  session: {
    // DB セッションではなく JWT。サーバー再起動後も Cookie があればログインを維持できる
    strategy: "jwt",
    maxAge: twoHourInSeconds,
  },
  adapter: PrismaAdapter(prisma),

  events: {
    async signOut({ token }) {
      const email = token?.email;
      if (typeof email !== "string" || !email) {
        return;
      }
      const leaving = await prisma.user.findUnique({
        where: { email },
        select: { id: true, companyId: true },
      });
      if (leaving) {
        await markUserAbsent(leaving.id, leaving.companyId);
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
