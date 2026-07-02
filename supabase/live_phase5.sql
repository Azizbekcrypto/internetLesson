-- ============================================================
-- JONLI DARS — FAZA 5: MENTOR KODI (mentorlikni himoyalash)
-- Maqsad: qiziquvchi o'quvchi "mentor" bo'lib ketmasin. Mentor bo'lish uchun
-- STATIK kod kerak — u SERVER tomonda saqlanadi (bundle'ga tushmaydi, sizmaydi).
--
-- TO'G'RI loyiha (dwoubexcexzsinogojiu) SQL Editor'ida bir marta Run qiling.
-- IDEMPOTENT.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Maxfiy config jadvali — anon HECH NARSA o'qiy olmaydi (policy yo'q = taqiq)
-- ------------------------------------------------------------
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;
-- Ataylab: hech qanday policy yo'q → faqat SECURITY DEFINER funksiyalar tegadi.
revoke all on public.app_config from anon, authenticated;

-- ------------------------------------------------------------
-- 2) ⚠️ MENTOR KODINI SHU YERDA O'RNATING — 'MENTOR-2026' ni O'ZINGIZNIKIGA almashtiring!
--    Keyin istalgan paytda shu satrni qayta Run qilib kodni yangilash mumkin.
-- ------------------------------------------------------------
insert into public.app_config (key, value)
values ('mentor_code', 'MENTOR-2026')
on conflict (key) do update set value = excluded.value;

-- ------------------------------------------------------------
-- 3) create_session'ni mentor kodi bilan himoyalash
--    Eski (kodsiz) versiyani o'chiramiz — aks holda uni chaqirib chetlab o'tish mumkin.
--    Yangi versiyada p_mentor_code default '' — eski 1-argumentli chaqiruvlar ham
--    shu funksiyaga tushadi va kod bo'sh bo'lgani uchun RAD etiladi (404 emas, xato).
-- ------------------------------------------------------------
drop function if exists public.create_session(text);

create or replace function public.create_session(p_lesson_id text, p_mentor_code text default '')
returns table (pin text, token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_pin   text;
  v_token text;
  v_try   int := 0;
begin
  -- MENTOR KODI TEKSHIRUVI (server tomonda — sizib chiqmaydi)
  if p_mentor_code is distinct from (select value from app_config where key = 'mentor_code') then
    raise exception 'Mentor kodi noto''g''ri';
  end if;

  -- Eski sessiyalarni tozalash
  delete from live_sessions where created_at < now() - interval '24 hours';

  -- Noyob 6 xonali PIN
  loop
    v_try := v_try + 1;
    v_pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from live_sessions s where s.pin = v_pin);
    if v_try > 50 then raise exception 'PIN yaratib bo''lmadi, qayta urinib ko''ring'; end if;
  end loop;

  v_token := replace(gen_random_uuid()::text, '-', ''); -- pgcrypto'siz, doim mavjud
  insert into live_sessions (pin, lesson_id) values (v_pin, p_lesson_id);
  insert into session_secrets (pin, mentor_token) values (v_pin, v_token);
  return query select v_pin, v_token;
end;
$$;

grant execute on function public.create_session(text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- TEKSHIRISH (alohida Run qiling):
--   select create_session('test', 'NOTOGRI');       -- ❌ xato: "Mentor kodi noto'g'ri"
--   select * from create_session('test', 'MENTOR-2026'); -- ✅ pin+token qaytadi
--   select * from app_config;                         -- (anon ko'rolmaydi; siz — SQL editorда ko'rasiz)
-- ============================================================
