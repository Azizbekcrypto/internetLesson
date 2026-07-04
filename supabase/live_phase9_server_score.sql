-- ============================================================
-- JONLI DARS — FAZA 9: SERVER TOMONDA BALL (ballni soxtalashtirishni yopish)
--
-- MUAMMO: submit_answer to'g'ri-noto'g'rini (p_correct) va vaqtni (p_elapsed_ms)
--   MIJOZDAN qabul qilib ko'r-ko'rona saqlardi. O'quvchi konsoldan
--   submit_answer('...', p_correct:=true, p_elapsed_ms:=0) chaqirib har savolga
--   1000 balldan yig'ib podiumni egallashi mumkin edi.
--
-- YECHIM: to'g'ri javob KALITI serverda (quiz_keys) — bundle'ga tushmaydi,
--   anon o'qiy olmaydi. submit_answer endi p_correct'ni E'TIBORGA OLMAYDI:
--   p_picked'ni server kaliti bilan solishtirib to'g'rilikni O'ZI hisoblaydi,
--   jang savollarida vaqtni ham quiz_started_at'dan O'ZI o'lchaydi.
--
-- ORQAGA MOS: funksiya IMZOSI o'zgarmaydi → mijozni qayta deploy qilish SHART EMAS.
--   Eski klient hamon p_correct yuboradi, lekin server uni tashlab, qayta hisoblaydi.
--
-- live_phase8_reveal.sql DAN KEYIN, TO'G'RI loyiha (dwoubexcexzsinogojiu)
-- SQL Editor'ida bir marta Run qiling. IDEMPOTENT: qayta ishga tushirsa ham xavfsiz.
-- ============================================================

-- ------------------------------------------------------------
-- 1) MAXFIY JAVOB KALITI — anon HECH NARSA o'qiy olmaydi (policy yo'q = taqiq)
--    correct_idx = to'g'ri variant (0..3)
--    correct_idx = -1  → "ishtirok" savoli (erkin matn: g'oya/mashq) — to'ldirgani = to'g'ri
-- ------------------------------------------------------------
create table if not exists public.quiz_keys (
  lesson_id   text not null,
  question_id text not null,
  correct_idx int  not null,
  primary key (lesson_id, question_id)
);
alter table public.quiz_keys enable row level security;
-- Ataylab: hech qanday policy yo'q → faqat SECURITY DEFINER funksiyalar o'qiydi.
revoke all on public.quiz_keys from anon, authenticated;

-- ------------------------------------------------------------
-- 2) KALITLARNI TO'LDIRISH
--    ⚠️ Savol yoki tartib o'zgarsa — SHU joyni yangilang (kalit = manba haqiqat).
--    lesson_id = LESSON_META.lessonId (bundle'dagi qiymat), question_id = SCREEN_META id / 'quiz-N'.
-- ------------------------------------------------------------

-- Internet darsi (internet-01-v17)
insert into public.quiz_keys (lesson_id, question_id, correct_idx) values
  -- dars ichidagi testlar (screen_idx < 100)
  ('internet-01-v17', 's4',   1),
  ('internet-01-v17', 's5b',  2),
  ('internet-01-v17', 's9',   3),
  ('internet-01-v17', 's12',  1),
  ('internet-01-v17', 's15',  2),
  -- Mustahkamlash-jang (screen_idx = 100 + N)
  ('internet-01-v17', 'quiz-0',  1),
  ('internet-01-v17', 'quiz-1',  2),
  ('internet-01-v17', 'quiz-2',  1),
  ('internet-01-v17', 'quiz-3',  0),
  ('internet-01-v17', 'quiz-4',  2),
  ('internet-01-v17', 'quiz-5',  3),
  ('internet-01-v17', 'quiz-6',  1),
  ('internet-01-v17', 'quiz-7',  2),
  ('internet-01-v17', 'quiz-8',  3),
  ('internet-01-v17', 'quiz-9',  0),
  ('internet-01-v17', 'quiz-10', 1),
  ('internet-01-v17', 'quiz-11', 2)
on conflict (lesson_id, question_id) do update set correct_idx = excluded.correct_idx;

-- PM darsi (pm-audience-01-v17)
insert into public.quiz_keys (lesson_id, question_id, correct_idx) values
  -- dars ichidagi MCQ testlar
  ('pm-audience-01-v17', 's4',  2),
  ('pm-audience-01-v17', 's5b', 1),
  ('pm-audience-01-v17', 's9',  2),
  ('pm-audience-01-v17', 's12', 2),
  -- erkin matn (to'g'ri javob yo'q — to'ldirgani hisobga olinadi): -1
  ('pm-audience-01-v17', 's6',  -1),   -- mashq belgisi (baholanmaydi, lekin yoziladi)
  ('pm-audience-01-v17', 's15', -1),   -- o'z g'oyasi ✍️ (yakuniy, baholanadi)
  -- Mustahkamlash-jang
  ('pm-audience-01-v17', 'quiz-0',  2),
  ('pm-audience-01-v17', 'quiz-1',  0),
  ('pm-audience-01-v17', 'quiz-2',  1),
  ('pm-audience-01-v17', 'quiz-3',  3),
  ('pm-audience-01-v17', 'quiz-4',  1),
  ('pm-audience-01-v17', 'quiz-5',  2),
  ('pm-audience-01-v17', 'quiz-6',  0),
  ('pm-audience-01-v17', 'quiz-7',  3),
  ('pm-audience-01-v17', 'quiz-8',  1),
  ('pm-audience-01-v17', 'quiz-9',  2),
  ('pm-audience-01-v17', 'quiz-10', 1),
  ('pm-audience-01-v17', 'quiz-11', 3)
on conflict (lesson_id, question_id) do update set correct_idx = excluded.correct_idx;

-- ------------------------------------------------------------
-- 3) submit_answer — QAYTA YOZILDI (imzo o'sha — orqaga mos)
--    • p_correct  → E'TIBORGA OLINMAYDI (faqat orqaga moslik uchun turibdi)
--    • to'g'rilik → server quiz_keys'dan hisoblaydi
--    • vaqt (jang)→ server quiz_started_at'dan hisoblaydi
-- ------------------------------------------------------------
create or replace function public.submit_answer(
  p_pin text, p_player_id uuid, p_token text,
  p_screen int, p_question_id text, p_picked int,
  p_correct boolean, p_elapsed_ms int   -- p_correct: ENDI ISHLATILMAYDI
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows    int;
  v_lesson  text;
  v_state   text;
  v_started timestamptz;
  v_key     int;
  v_correct boolean;
  v_elapsed int;
begin
  -- 1) Token tekshiruvi — faqat o'z nomidan yozadi
  if not exists (
    select 1 from player_secrets ps
    join live_players lp on lp.id = ps.player_id
    where ps.player_id = p_player_id and ps.token = p_token and lp.pin = p_pin
  ) then
    raise exception 'Ruxsat yo''q';
  end if;

  -- 2) Sessiya holati (qaysi dars + jang holati)
  select ls.lesson_id, ls.quiz_state, ls.quiz_started_at
    into v_lesson, v_state, v_started
    from live_sessions ls
   where ls.pin = p_pin;
  if v_lesson is null then
    raise exception 'Sessiya topilmadi';
  end if;

  -- 3) TO'G'RILIKNI SERVER HISOBLAYDI (mijoz p_correct'iga ishonmaymiz)
  select qk.correct_idx into v_key
    from quiz_keys qk
   where qk.lesson_id = v_lesson
     and qk.question_id = coalesce(p_question_id, '');
  if v_key is null then
    v_correct := false;                 -- noma'lum savol → xavfsiz default (ballga kirmaydi)
  elsif v_key < 0 then
    v_correct := true;                  -- ishtirok savoli (erkin matn) → to'ldirgani = to'g'ri
  else
    v_correct := (p_picked = v_key);    -- oddiy MCQ — tanlangan variant kalitga tengmi
  end if;

  -- 4) VAQTNI ham SERVER hisoblaydi (jang savolida elapsed=0 firibi yopiladi)
  if p_screen >= 100 and v_state = 'q' and v_started is not null then
    v_elapsed := greatest(0, least( (extract(epoch from (now() - v_started)) * 1000)::int, 3600000));
  else
    v_elapsed := greatest(0, least(coalesce(p_elapsed_ms, 0), 3600000));
  end if;

  -- 5) Yozish — (player, ekran) bo'yicha BIRINCHI javob qotadi
  insert into live_answers (pin, player_id, screen_idx, question_id, picked, correct, elapsed_ms)
  values (p_pin, p_player_id, p_screen, coalesce(p_question_id, ''), p_picked, v_correct, v_elapsed)
  on conflict (player_id, screen_idx) do nothing;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- Imzo o'zgarmagani uchun grant saqlanadi, lekin idempotentlik uchun qayta beramiz
grant execute on function public.submit_answer(text, uuid, text, int, text, int, boolean, int)
  to anon, authenticated;

-- ------------------------------------------------------------
-- TEKSHIRISH (alohida Run qiling):
--   select * from create_session('internet-01-v17', 'MENTOR-2026');   -- pin+token
--   select * from join_session('<pin>', 'Ali');                        -- player_id+token
--   -- To'g'ri javob (s4 = 1):
--   select submit_answer('<pin>','<pid>','<tok>', 4,'s4', 1, false, 0);  -- true (yozildi)
--   select correct from live_answers where question_id='s4';            -- ✅ true (p_correct=false bo'lsa ham!)
--   -- Firib urinishi: noto'g'ri variant + correct:=true:
--   select * from join_session('<pin>', 'Firibgar');
--   select submit_answer('<pin>','<pid2>','<tok2>', 4,'s4', 0, true, 0); -- yoziladi, LEKIN
--   select correct from live_answers where player_id='<pid2>' and screen_idx=4;  -- ❌ false (server rad etdi)
-- ============================================================
