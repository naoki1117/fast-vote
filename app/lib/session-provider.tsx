"use client";

import { SessionProvider } from "next-auth/react";
import { FC, PropsWithChildren } from "react";

// クライアントコンポーネントから useSession() できるように、アプリ全体を包む
export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
