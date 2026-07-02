-- ============================================================
-- JONLI DARS — FAZA 2: BACKEND MUSTAHKAMLASH
-- live_sessions.sql dan KEYIN, SHU loyihaning SQL Editor'ida bir marta ishga tushiring.
-- (Ilova ulanadigan loyiha — dwoubexcexzsinogojiu — da, hmuvbzbgfusdsyqxdyyp'da EMAS!)
--
-- Bu fayl IDEMPOTENT: qayta ishga tushirsa ham xavfsiz.
-- Qamrov:
--   S4 — pg_cron bilan eski sessiyalarni AVTOMATIK tozalash (hech kim create qilmasa ham)
--   Indeks — tozalash so'rovi tez ishlashi uchun
--   B1 — lesson_id allaqachon bor (faqat tekshiramiz)
-- ============================================================

-- ------------------------------------------------------------
-- 0) B1 TEKSHIRUVI — lesson_id ustuni bor bo'lishi shart (live_sessions.sql da yaratilgan).
--    Bo'lmasa, qo'shamiz (eski schema bo'lsa ham ishlaydi).
-- ------------------------------------------------------------
alter table public.live_sessions
  add column if not exists lesson_id text not null default '';

-- ------------------------------------------------------------
-- 1) INDEKS — tozalash created_at bo'yicha qidiradi (kichik jadval, lekin tartib uchun)
-- ------------------------------------------------------------
create index if not exists idx_live_sessions_created_at
  on public.live_sessions (created_at);

-- ------------------------------------------------------------
-- 2) S4 — AVTOMATIK TOZALASH (pg_cron)
--    create_session ichida ham tozalash bor, lekin u faqat kimdir yangi
--    sessiya yaratganda ishlaydi. Hech kim yaratmasa eski qatorlar qoladi.
--    pg_cron buni MUSTAQIL, rejали bajaradi.
-- ------------------------------------------------------------
create extension if not exists pg_cron;

-- Tozalash funksiyasi — bir joyda, qayta foydalanish uchun
create or replace function public.cleanup_live_sessions()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.live_sessions
  where created_at < now() - interval '24 hours'                 -- juda eski (himoya)
     or (status = 'ended' and updated_at < now() - interval '2 hours'); -- yakunlangan — tezroq
$$;

-- Avvalgi xuddi shu nomli jobni o'chiramiz (idempotent — qayta ishga tushirish uchun)
do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'live-sessions-cleanup';
exception when others then
  null; -- job yo'q bo'lsa — e'tibor bermaymiz
end $$;

-- Har 15 daqiqada tozalash
select cron.schedule(
  'live-sessions-cleanup',
  '*/15 * * * *',
  $$ select public.cleanup_live_sessions(); $$
);

-- ------------------------------------------------------------
-- 3) S2 — ABUSE himoyasi (RATE-LIMIT) — HOZIRCHA QILINMAYDI
--    Anon kalit commitda ochiq → cheksiz create_session chaqirish mumkin.
--    To'g'ri yechim: mentor uchun yengil auth (kim chaqirayotganini bilish).
--    Auth'siz "global limit" bitta abuser hammani bloklaydi — yomon.
--    Shuning uchun bu FAZA 4 (yoki auth qo'shilgach) ga qoldiriladi.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- TEKSHIRISH (ishga tushirgach, alohida ishlatib ko'ring):
--   select cron.jobname, schedule, active from cron.job;       -- job ko'rinadimi
--   select public.cleanup_live_sessions();                      -- qo'lda tozalash
--   select * from cron.job_run_details order by start_time desc limit 5;  -- tarix
-- ============================================================
