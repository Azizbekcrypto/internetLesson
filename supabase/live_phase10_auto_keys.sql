-- ============================================================
-- FAZA 10: JAVOB KALITINI AVTO-REGISTRATSIYA (har darsga SQL yozish TUGADI)
--
-- G'oya: kalit allaqachon dars faylining o'zida (QUIZ_BANK, correctIdx). Mentor
-- darsni ochganda (u mentor-kodni biladi), brauzeri kalitni SHU RPC orqali serverga
-- yuklaydi. Shundan keyin yangi dars qo'shsangiz — hech qanday SQL kerak emas.
--
-- Xavfsizlik: kalitni faqat MENTOR-KODLI odam yuklay oladi (o'quvchida kod yo'q).
-- submit_answer baribir serverdagi kalitdan hisoblaydi → ball soxtalashtirilmaydi.
-- Kalit avvaldan bundle'da bor edi — bu yangi hech narsa oshkor qilmaydi.
--
-- live_phase9_server_score.sql DAN KEYIN Run qiling. IDEMPOTENT. Bu — OXIRGI marta
-- kalit uchun SQL yozishingiz (bundan keyin darslar o'zi ro'yxatdan o'tadi).
-- ============================================================

create or replace function public.set_quiz_keys(p_lesson_id text, p_mentor_code text, p_keys jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  -- Faqat mentor-kodli odam kalit qo'ya/yangilay oladi
  if p_mentor_code is distinct from (select value from app_config where key = 'mentor_code') then
    raise exception 'Mentor kodi noto''g''ri';
  end if;

  -- p_keys = { "s4": 1, "s5b": 0, "quiz-0": 1, ... }  (correct_idx; -1 = ishtirok savoli)
  insert into public.quiz_keys (lesson_id, question_id, correct_idx)
  select p_lesson_id, e.key, (e.value)::int
  from jsonb_each_text(p_keys) as e(key, value)
  on conflict (lesson_id, question_id) do update set correct_idx = excluded.correct_idx;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

grant execute on function public.set_quiz_keys(text, text, jsonb) to anon, authenticated;

-- TEKSHIRISH (alohida Run qiling):
--   select set_quiz_keys('test-lesson', 'MENTOR-2026', '{"s4":1,"quiz-0":2}'::jsonb);  -- 2 qaytadi
--   select * from quiz_keys where lesson_id = 'test-lesson';                             -- 2 qator
--   select set_quiz_keys('test-lesson', 'NOTOGRI', '{"s4":1}'::jsonb);                   -- ❌ xato
--   delete from quiz_keys where lesson_id = 'test-lesson';                               -- tozalash
