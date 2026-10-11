-- 公開キーで Data API から提案・ユーザーを読めないようにする。
-- Prisma は postgres ロール（テーブル所有者）なので RLS をバイパスする。
-- FORCE ROW LEVEL SECURITY は付けない（Prisma が止まる）。

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE users FROM anon, authenticated;
REVOKE ALL ON TABLE posts FROM anon, authenticated;
REVOKE ALL ON TABLE votes FROM anon, authenticated;
REVOKE ALL ON TABLE companies FROM anon, authenticated;
REVOKE ALL ON TABLE host_nominations FROM anon, authenticated;
REVOKE ALL ON TABLE reset_requests FROM anon, authenticated;
REVOKE ALL ON TABLE advance_requests FROM anon, authenticated;
REVOKE ALL ON TABLE messages FROM anon, authenticated;

DROP POLICY IF EXISTS round_signals_select ON round_signals;
CREATE POLICY round_signals_select ON round_signals
  FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE round_signals TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'round_signals'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE round_signals';
  END IF;
END $$;
