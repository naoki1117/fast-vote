import "next-auth";
import "next-auth/jwt";

// 標準の Session / JWT に会社名を足す（ヘッダーとダッシュボードで使う）
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      companyName?: string | null;
    };
  }

  interface User {
    companyName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    companyName?: string | null;
  }
}
