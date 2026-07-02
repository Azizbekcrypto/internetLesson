-- ============================================================
-- FAZA 5 — TUZATISH: token yaratish xatosi
-- Muammo: create_session ichida token `gen_random_bytes(16)` (pgcrypto) bilan
-- yaratilardi, lekin `search_path = public` bo'lgani uchun u topilmadi
-- (Supabase'da pgcrypto `extensions` sxemasida).
--
-- Yechim: token endi `gen_random_uuid()` bilan — bu PostgreSQL'ning O'ZIDA bor
-- (pg_catalog), hech qanday kengaytma/search_path muammosi yo'q.
--
-- TO'G'RI loyiha SQL Editor'ida Run qiling. Mentor kodi (app_config) tegmaydi.
-- ============================================================

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
  -- Mentor kodi tekshiruvi (o'zgarmadi)
  if p_mentor_code is distinct from (select value from app_config where key = 'mentor_code') then
    raise exception 'Mentor kodi noto''g''ri';
  end if;

  delete from live_sessions where created_at < now() - interval '24 hours';

  loop
    v_try := v_try + 1;
    v_pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from live_sessions s where s.pin = v_pin);
    if v_try > 50 then raise exception 'PIN yaratib bo''lmadi, qayta urinib ko''ring'; end if;
  end loop;

  v_token := replace(gen_random_uuid()::text, '-', '');  -- pgcrypto'siz, doim mavjud (32 hex)

  insert into live_sessions (pin, lesson_id) values (v_pin, p_lesson_id);
  insert into session_secrets (pin, mentor_token) values (v_pin, v_token);
  return query select v_pin, v_token;
end;
$$;

grant execute on function public.create_session(text, text) to anon, authenticated;

-- TEKSHIRISH:
--   select * from create_session('test', 'MENTOR-2026');  -- ✅ endi pin+token qaytadi
