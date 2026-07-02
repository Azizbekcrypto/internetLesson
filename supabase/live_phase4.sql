-- ============================================================
-- JONLI DARS — FAZA 4: REALTIME (WebSocket)
-- live_sessions o'zgarishlari o'quvchilarga DARHOL push qilinishi uchun
-- jadvalni supabase_realtime publication'iga qo'shamiz.
--
-- TO'G'RI loyihaning (dwoubexcexzsinogojiu) SQL Editor'ida bir marta Run qiling.
-- IDEMPOTENT: qayta ishga tushirsa ham xavfsiz.
--
-- Eslatma: o'quvchilar anon roli bilan obuna bo'ladi. live_sessions RLS'da
-- "for select using (true)" bor — shuning uchun Realtime obunasiga ruxsat bor.
-- session_secrets esa publication'ga QO'SHILMAYDI (maxfiy qoladi).
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'live_sessions'
  ) then
    alter publication supabase_realtime add table public.live_sessions;
  end if;
end $$;

-- ------------------------------------------------------------
-- TEKSHIRISH (alohida Run qiling — 1 qator qaytishi kerak):
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime' and tablename = 'live_sessions';
-- ============================================================
