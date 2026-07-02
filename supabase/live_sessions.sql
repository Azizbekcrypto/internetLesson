
-- ============================================================
-- JONLI DARS SINXRONIZATSIYASI — Supabase sxemasi (Kahoot uslubida)
-- Mentor PIN yaratadi → o'quvchilar PIN bilan qo'shiladi → mentor
-- o'tgan sahifagacha ochiq → "Tamom" → hammaga erkinlik.
--
-- Bu faylni Supabase > SQL Editor'da bir marta ishga tushiring.
-- ============================================================

-- Tasodifiy token yaratish uchun kerak
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) JADVALLAR
-- ------------------------------------------------------------

-- Ommaviy holat: o'quvchilar SHU jadvalni o'qiydi (Realtime ham shunda).
-- Maxfiy token bu yerda YO'Q — shuning uchun o'quvchilarga sizib chiqmaydi.
create table if not exists public.live_sessions (
  pin         text primary key,                 -- "483920" (6 xonali kod)
  lesson_id   text not null,                    -- "internet"
  max_screen  integer not null default 0,       -- mentor yetgan ENG OLIS sahifa
  status      text not null default 'live'
              check (status in ('live','ended')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()-- heartbeat (mentor tirikligi)
);

-- Maxfiy qism: faqat RPC funksiyalar tegadi. Anon (o'quvchi/mentor brauzeri)
-- bu jadvalni O'QIY OLMAYDI — token shu yerda himoyada.
create table if not exists public.session_secrets (
  pin          text primary key
               references public.live_sessions(pin) on delete cascade,
  mentor_token text not null
);

-- ------------------------------------------------------------
-- 2) RLS (qator darajasidagi xavfsizlik)
-- ------------------------------------------------------------

alter table public.live_sessions   enable row level security;
alter table public.session_secrets enable row level security;

-- live_sessions: hamma O'QIY oladi (o'quvchilar + Realtime uchun shart).
-- Yozish — to'g'ridan-to'g'ri MUMKIN EMAS (faqat RPC orqali).
drop policy if exists "read_live_sessions" on public.live_sessions;
create policy "read_live_sessions" on public.live_sessions
  for select using (true);

-- session_secrets: hech kimga ruxsat yo'q (policy yo'q = hammasi taqiq).
-- Faqat SECURITY DEFINER funksiyalar (quyida) o'qiy/yoza oladi.

grant select on public.live_sessions to anon, authenticated;
-- session_secrets'ga grant BERMAYMIZ — ataylab.

-- ------------------------------------------------------------
-- 3) RPC FUNKSIYALAR (barcha yozuv shular orqali — xavfsiz)
-- ------------------------------------------------------------

-- 3.1) Mentor: yangi sessiya yaratadi → noyob PIN + maxfiy token qaytaradi
create or replace function public.create_session(p_lesson_id text)
returns table (pin text, token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin   text;
  v_token text;
  v_try   int := 0;
begin
  -- Eski sessiyalarni tozalaymiz (24 soatdan oshgan) — PIN'lar bo'shaydi
  delete from live_sessions where created_at < now() - interval '24 hours';

  -- Noyob 6 xonali PIN topamiz
  loop
    v_try := v_try + 1;
    v_pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from live_sessions s where s.pin = v_pin);
    if v_try > 50 then
      raise exception 'PIN yaratib bo''lmadi, qayta urinib ko''ring';
    end if;
  end loop;

  v_token := encode(gen_random_bytes(16), 'hex');

  insert into live_sessions (pin, lesson_id) values (v_pin, p_lesson_id);
  insert into session_secrets (pin, mentor_token) values (v_pin, v_token);

  return query select v_pin, v_token;
end;
$$;

-- 3.2) Mentor: sahifani oldinga suradi (high-water mark — orqaga tushmaydi)
create or replace function public.advance_session(p_pin text, p_token text, p_screen int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update live_sessions ls
     set max_screen = greatest(ls.max_screen, p_screen),
         updated_at = now()
    from session_secrets s
   where ls.pin = p_pin
     and s.pin = ls.pin
     and s.mentor_token = p_token
     and ls.status = 'live';
  if not found then
    raise exception 'Sessiya topilmadi yoki ruxsat yo''q';
  end if;
end;
$$;

-- 3.3) Mentor: heartbeat (tirikligini bildiradi — o'quvchilar uzilishni sezadi)
create or replace function public.session_heartbeat(p_pin text, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update live_sessions ls
     set updated_at = now()
    from session_secrets s
   where ls.pin = p_pin and s.pin = ls.pin
     and s.mentor_token = p_token and ls.status = 'live';
end;
$$;

-- 3.4) Mentor: "Tamom" → hammaga erkinlik
create or replace function public.end_session(p_pin text, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update live_sessions ls
     set status = 'ended', updated_at = now()
    from session_secrets s
   where ls.pin = p_pin and s.pin = ls.pin
     and s.mentor_token = p_token;
end;
$$;

-- Funksiyalarni anon (brauzer) chaqira olishi uchun ruxsat
grant execute on function public.create_session(text)             to anon, authenticated;
grant execute on function public.advance_session(text, text, int) to anon, authenticated;
grant execute on function public.session_heartbeat(text, text)    to anon, authenticated;
grant execute on function public.end_session(text, text)          to anon, authenticated;

-- ------------------------------------------------------------
-- 4) REALTIME — KERAK EMAS (biz fetch() + polling tanladik)
-- ------------------------------------------------------------
-- O'quvchilar har ~2s GET so'rov bilan live_sessions'ni o'qiydi (WebSocket yo'q).
-- Agar kelajakda supabase-js Realtime'ga o'tsangiz, quyidagini yoqing:
-- alter publication supabase_realtime add table public.live_sessions;

-- ============================================================
-- TEST (ixtiyoriy — SQL Editor'da tekshirib ko'rish uchun):
--   select * from create_session('internet');          -- pin+token oladi
--   select advance_session('<pin>', '<token>', 5);      -- 5-sahifaga suradi
--   select * from live_sessions;                         -- max_screen=5 ko'rinadi
--   select end_session('<pin>', '<token>');             -- status=ended
-- ============================================================
