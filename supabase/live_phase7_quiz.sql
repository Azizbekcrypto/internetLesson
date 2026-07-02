-- ============================================================
-- JONLI DARS — FAZA 7: MUSTAHKAMLASH (Kahoot-jang)
-- Yakuniy sahifadagi «Mustahkamlash» jangi uchun server holati.
-- Yangi jadval KERAK EMAS: live_sessions'ga 3 ustun + 1 RPC.
-- O'quvchilar shu jadvalni allaqachon poll qiladi — sinxron bepul.
-- Javoblar mavjud live_answers'ga yoziladi (screen_idx = 100 + savol raqami).
--
-- live_phase6_players.sql DAN KEYIN Run qiling. IDEMPOTENT.
-- ============================================================

-- ------------------------------------------------------------
-- 1) live_sessions — jang holati ustunlari
--    quiz_state: 'off' (yo'q) | 'lobby' (kutish) | 'q' (savol ochiq)
--                | 'r' (natija ochildi) | 'done' (jang tugadi)
-- ------------------------------------------------------------
alter table public.live_sessions add column if not exists quiz_state text not null default 'off';
alter table public.live_sessions add column if not exists quiz_q int not null default -1;
alter table public.live_sessions add column if not exists quiz_started_at timestamptz;

-- ------------------------------------------------------------
-- 2) RPC: quiz_control — faqat mentor (token bilan) boshqaradi
-- ------------------------------------------------------------
create or replace function public.quiz_control(p_pin text, p_token text, p_state text, p_q int default -1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_state not in ('off', 'lobby', 'q', 'r', 'done') then
    raise exception 'Noto''g''ri holat: %', p_state;
  end if;

  update live_sessions ls
     set quiz_state      = p_state,
         quiz_q          = coalesce(p_q, -1),
         quiz_started_at = case when p_state = 'q' then now() else ls.quiz_started_at end,
         updated_at      = now()
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

grant execute on function public.quiz_control(text, text, text, int) to anon, authenticated;

-- ------------------------------------------------------------
-- TEKSHIRISH (alohida Run qiling):
--   select * from create_session('test', 'MENTOR-2026');          -- pin+token oling
--   select quiz_control('<pin>', '<token>', 'lobby');              -- jang ochildi
--   select quiz_control('<pin>', '<token>', 'q', 0);               -- 1-savol
--   select quiz_state, quiz_q, quiz_started_at from live_sessions; -- holat ko'rinadi
--   select quiz_control('<pin>', '<token>', 'r', 0);               -- natija ochildi
--   select quiz_control('<pin>', '<token>', 'done', 11);           -- jang tugadi
-- ============================================================
