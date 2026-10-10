// NextAuth の authorize() が返すユーザー形。null は認証失敗
export type UserType = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string;
  /** ヘッダーに出す所属会社名 */
  companyName?: string | null;
} | null;
