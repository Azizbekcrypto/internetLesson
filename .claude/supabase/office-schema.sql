-- ═══════════════════════════════════════════════════════════════
-- PIPELINE HQ OFIS — bulut-holat sxemasi (YANGI, alohida Supabase loyihasi)
-- Darslar bazasiga ALOQASI YO'Q — faqat ofis-vizualizatsiya holati.
--
-- ⚠️ YURITISHDAN OLDIN: pastdagi 'OFIS-SIRINGIZNI-SHU-YERGA-YOZING' ni
--    o'zingizning kuchli siringizga almashtiring (masalan: OFIS-Kx7#2026-mahfiy).
--    Bu sir FAQAT lokal hook'da ishlatiladi — ochiq sahifaga chiqmaydi.
--
-- Yuritish: Supabase Dashboard → SQL Editor → shu faylni to'liq joylab → Run.
-- ═══════════════════════════════════════════════════════════════

-- 1) Ofis holati — bitta qatorli jadval (butun holat jsonb'da)
create table if not exists public.office_state (
  id int primary key default 1 check (id = 1),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.office_state (id, state)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- 2) Yozish-siri — alohida jadval, RLS bilan TO'LIQ yopiq
--    (policy yo'q = anon/authenticated hech o'qiy/yoza olmaydi;
--     faqat security definer funksiya ichidan o'qiladi)
create table if not exists public.office_secret (
  id int primary key default 1 check (id = 1),
  secret text not null
);

insert into public.office_secret (id, secret)
values (1, 'OFIS-SIRINGIZNI-SHU-YERGA-YOZING')
on conflict (id) do update set secret = excluded.secret;  -- qayta yuritish = sirni yangilash

-- 3) RLS
alter table public.office_state  enable row level security;
alter table public.office_secret enable row level security;

-- O'qish hammaga ochiq (ofis-sahifa anon-key bilan poll qiladi)
drop policy if exists office_state_read on public.office_state;
create policy office_state_read on public.office_state
  for select using (true);

-- To'g'ridan-to'g'ri yozish TAQIQ (policy yo'q) — faqat RPC orqali.
-- office_secret'ga esa umuman policy yo'q — tashqaridan ko'rinmaydi.

revoke all on public.office_secret from anon, authenticated;
grant select on public.office_state to anon, authenticated;

-- 4) Yozish RPC — sir tekshiruvi bilan (set_quiz_keys'dagi mentor-kod uslubi)
create or replace function public.office_sync(p_secret text, p_state jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s text;
begin
  select secret into s from public.office_secret where id = 1;
  if s is null or p_secret is distinct from s then
    raise exception 'office_sync: sir noto''g''ri';
  end if;
  update public.office_state
     set state = p_state,
         updated_at = now()
   where id = 1;
end;
$$;

grant execute on function public.office_sync(text, jsonb) to anon, authenticated;

-- 5) Tekshiruv so'rovi (Run'dan keyin natijani ko'rish uchun ixtiyoriy):
-- select id, updated_at, state from public.office_state;
