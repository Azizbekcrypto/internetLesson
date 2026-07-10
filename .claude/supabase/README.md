# 🏢 Ofis-bulut (Supabase + Vercel) — o'rnatish yo'riqnomasi

Bu papka OFIS vizualizatsiyasining bulut-qatlami uchun. **Darslar Supabase'siga aloqasi yo'q** — bu YANGI, alohida loyiha (yangi gmail akkauntda).

## Siz qiladigan qadamlar

1. **Yangi Supabase loyihasi:** supabase.com → yangi gmail bilan kirish → New project (nom: masalan `pipeline-office`, region: yaqinini tanlang, parolni saqlab qo'ying).

2. **Sirni tanlang:** `office-schema.sql` faylini oching, ichidagi
   `OFIS-SIRINGIZNI-SHU-YERGA-YOZING` ni o'z kuchli siringizga almashtiring
   (masalan `OFIS-Kx7#2026`). Bu sir faqat lokal hook'da turadi — internetga chiqmaydi.

3. **SQL yuritish:** Dashboard → SQL Editor → `office-schema.sql` matnini to'liq joylab → **Run**.
   Xatosiz o'tsa: `office_state` (ochiq o'qish) + `office_secret` (yopiq) + `office_sync` RPC tayyor.

4. **Menga 3 narsani bering** (Claude'ga yozing):
   - Project URL — Dashboard → Settings → API → `https://XXXX.supabase.co`
   - anon/publishable key — o'sha sahifada (bu ochiq kalit, sahifaga qo'yiladi — xavfsiz, chunki faqat o'qish ochiq)
   - Tanlagan siringiz (hook uchun)

5. Men shundan keyin: hook'ni Supabase'ga yozadigan qilaman, ofis-sahifaga bulut-rejim qo'shaman, Vercel deploy'ni tayyorlayman (`vercel login`ni siz bir marta bosasiz).

## Xavfsizlik modeli

- `office_state` — hammaga FAQAT o'qish (telefondagi sahifa poll qiladi)
- Yozish — faqat `office_sync(p_secret, ...)` RPC orqali; sir `office_secret` jadvalida, RLS bilan to'liq yopiq (hech kim tashqaridan o'qiy olmaydi)
- anon key sahifada ochiq bo'lishi normal — u bilan faqat o'qish mumkin
