-- ============================================================
-- JONLI DARS — FAZA 8: KAHOOT-REVEAL (teoriya orasidagi testlar)
-- O'quvchi javob bosganda natija SIR saqlanadi (faqat «qabul qilindi»);
-- mentor «Natijani ochish»ni bosganda to'g'ri javob BARCHA o'quvchilar
-- ekranida ham birdan ochiladi. Erkin rejimda natija darhol ko'rinadi.
-- Yangi jadval KERAK EMAS: live_sessions'ga 1 ustun + 1 RPC.
-- O'quvchilar jadvalni allaqachon poll qiladi — sinxron bepul.
--
-- live_phase7_quiz.sql DAN KEYIN Run qiling. IDEMPOTENT.
-- DIQQAT: buni Run qilmasdan yangi klient deploy qilinsa, jonli rejim
-- ishlamaydi (select'da reveal_screen ustuni so'raladi).
-- ============================================================

-- ------------------------------------------------------------
-- 1) live_sessions — hozir qaysi ekran natijasi ochilgan (-1 = hech qaysi)
-- ------------------------------------------------------------
alter table public.live_sessions add column if not exists reveal_screen int not null default -1;

-- ------------------------------------------------------------
-- 2) RPC: reveal_screen — faqat mentor (token bilan) ochadi
-- ------------------------------------------------------------
create or replace function public.reveal_screen(p_pin text, p_token text, p_screen int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update live_sessions ls
     set reveal_screen = p_screen,
         updated_at    = now()
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

grant execute on function public.reveal_screen(text, text, int) to anon, authenticated;

-- ------------------------------------------------------------
-- TEKSHIRISH (alohida Run qiling):
--   select * from create_session('test', '<mentor-kod>');          -- pin+token oling
--   select reveal_screen('<pin>', '<token>', 4);                   -- 4-ekran ochildi
--   select pin, reveal_screen, updated_at from live_sessions;      -- holat ko'rinadi
-- ============================================================
