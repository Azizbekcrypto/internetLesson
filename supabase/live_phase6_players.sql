-- ============================================================
-- JONLI DARS — FAZA 6: O'QUVCHILAR (nickname) + JAVOBLAR + STATISTIKA
-- Kahoot uslubi: o'quvchi PIN + ism bilan kiradi, har test javobini
-- serverga yozadi (1 marta — birinchisi qotadi), mentor jonli statistika
-- ko'radi, oxirida podium (1-2-3-o'rin) hammaga chiqadi.
--
-- TO'G'RI loyiha (dwoubexcexzsinogojiu) SQL Editor'ida bir marta Run qiling.
-- IDEMPOTENT: qayta ishga tushirsa ham xavfsiz.
-- ============================================================

-- ------------------------------------------------------------
-- 1) JADVALLAR
-- ------------------------------------------------------------

-- O'quvchilar — ommaviy o'qiladi (ro'yxat, soni, podium uchun).
-- Maxfiy token bu yerda YO'Q (player_secrets'da) — sizib chiqmaydi.
create table if not exists public.live_players (
  id         uuid primary key default gen_random_uuid(),
  pin        text not null references public.live_sessions(pin) on delete cascade,
  nickname   text not null,
  joined_at  timestamptz not null default now(),
  unique (pin, nickname)                       -- bitta sessiyada bitta ism
);

-- O'quvchi tokeni — faqat SECURITY DEFINER funksiyalar tegadi
create table if not exists public.player_secrets (
  player_id uuid primary key references public.live_players(id) on delete cascade,
  token     text not null
);

-- Javoblar — ommaviy o'qiladi (mentor statistikasi + podium hammaga).
-- Yozish faqat submit_answer RPC orqali; (player, ekran) = bitta javob,
-- birinchisi qotadi (unique + on conflict do nothing).
create table if not exists public.live_answers (
  id           bigint generated always as identity primary key,
  pin          text not null references public.live_sessions(pin) on delete cascade,
  player_id    uuid not null references public.live_players(id) on delete cascade,
  screen_idx   int  not null,                  -- test ekranining indeksi
  question_id  text not null default '',       -- SCREEN_META id ('s4', 's15'...)
  picked       int  not null,                  -- tanlangan variant (0..3)
  correct      boolean not null,               -- to'g'ri bosdimi
  elapsed_ms   int  not null default 0,        -- savol ochilgandan bosishgacha (tezlik — teng ballda hal qiladi)
  answered_at  timestamptz not null default now(),
  unique (player_id, screen_idx)
);

create index if not exists idx_live_players_pin     on public.live_players (pin);
create index if not exists idx_live_answers_pin_scr on public.live_answers (pin, screen_idx);

-- ------------------------------------------------------------
-- 2) RLS
-- ------------------------------------------------------------

alter table public.live_players   enable row level security;
alter table public.player_secrets enable row level security;
alter table public.live_answers   enable row level security;

drop policy if exists "read_live_players" on public.live_players;
create policy "read_live_players" on public.live_players
  for select using (true);

drop policy if exists "read_live_answers" on public.live_answers;
create policy "read_live_answers" on public.live_answers
  for select using (true);

-- player_secrets: policy YO'Q = hammasi taqiq (session_secrets kabi).

grant select on public.live_players to anon, authenticated;
grant select on public.live_answers to anon, authenticated;
-- player_secrets'ga grant BERMAYMIZ — ataylab.

-- ------------------------------------------------------------
-- 3) RPC: join_session — o'quvchi PIN + ism bilan qo'shiladi
--    → { player_id, token } qaytaradi (token faqat shu o'quvchiga)
-- ------------------------------------------------------------
create or replace function public.join_session(p_pin text, p_nickname text)
returns table (player_id uuid, token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nick   text;
  v_status text;
  v_id     uuid;
  v_token  text;
begin
  v_nick := trim(p_nickname);
  if v_nick is null or length(v_nick) < 2 or length(v_nick) > 24 then
    raise exception 'Ism 2 dan 24 gacha belgi bo''lsin';
  end if;

  select s.status into v_status from live_sessions s where s.pin = p_pin;
  if v_status is null then
    raise exception 'Bunday kod topilmadi';
  end if;
  if v_status <> 'live' then
    raise exception 'Bu dars allaqachon yakunlangan';
  end if;

  -- Katta-kichik harfni farqlamay tekshiramiz ("Ali" va "ali" — band)
  if exists (
    select 1 from live_players lp
    where lp.pin = p_pin and lower(lp.nickname) = lower(v_nick)
  ) then
    raise exception 'Bu ism band — boshqa ism tanlang';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');
  insert into live_players (pin, nickname) values (p_pin, v_nick) returning id into v_id;
  insert into player_secrets (player_id, token) values (v_id, v_token);
  return query select v_id, v_token;
end;
$$;

-- ------------------------------------------------------------
-- 4) RPC: submit_answer — javobni yozish (birinchi javob qotadi)
--    true = yozildi, false = allaqachon javob bergan edi
-- ------------------------------------------------------------
create or replace function public.submit_answer(
  p_pin text, p_player_id uuid, p_token text,
  p_screen int, p_question_id text, p_picked int,
  p_correct boolean, p_elapsed_ms int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  -- Token tekshiruvi — faqat o'z nomidan yozadi
  if not exists (
    select 1 from player_secrets ps
    join live_players lp on lp.id = ps.player_id
    where ps.player_id = p_player_id and ps.token = p_token and lp.pin = p_pin
  ) then
    raise exception 'Ruxsat yo''q';
  end if;

  insert into live_answers (pin, player_id, screen_idx, question_id, picked, correct, elapsed_ms)
  values (
    p_pin, p_player_id, p_screen, coalesce(p_question_id, ''), p_picked, p_correct,
    greatest(0, least(coalesce(p_elapsed_ms, 0), 3600000))   -- 0..1 soat oralig'ida qirqamiz
  )
  on conflict (player_id, screen_idx) do nothing;   -- birinchi javob qotadi

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

grant execute on function public.join_session(text, text) to anon, authenticated;
grant execute on function public.submit_answer(text, uuid, text, int, text, int, boolean, int) to anon, authenticated;

-- ------------------------------------------------------------
-- TEKSHIRISH (alohida Run qiling):
--   select * from create_session('test', 'MENTOR-2026');            -- pin+token
--   select * from join_session('<pin>', 'Ali');                     -- player_id+token
--   select submit_answer('<pin>', '<player_id>', '<token>', 4, 's4', 1, true, 3500);  -- true
--   select submit_answer('<pin>', '<player_id>', '<token>', 4, 's4', 2, false, 900);  -- false (qotgan)
--   select * from live_answers;                                     -- 1 qator, picked=1
--   select * from join_session('<pin>', 'ali');                     -- ❌ "Bu ism band"
-- ============================================================
  