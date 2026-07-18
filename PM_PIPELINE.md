# 📕 PM DARSLIK PIPELINE — orkestratsiya qo'llanmasi

> **Maqsad:** PM darslarni (Senior dasturi, 13-17 yosh) `PM_Prompt_v8.md` senariy-qonuni bo'yicha to'liq yangicha qurish — texnik darslar "miyasi"dan ATAYLAB ajratilgan holda.
>
> **Farq (texnik pipeline'dan):** texnik darslar TAYYOR fayllarni etalonga KO'CHIRAR edi (manba = Htmllesson1); PM darslar SENARIYDAN YANGI QURILADI (manba = PM_Prompt_v8 + tasdiqlangan senariy). **Htmllesson1 PM uchun namuna EMAS.**
>
> **Umumiy hujjatlar:** anti-loop qoidalari `PIPELINE.md` 3-bo'lim (9 qoida) + QOIDA 10-13 — PM'da ham to'liq amal qiladi. Til qonuni `MATN_ETALONI.md` — umumiy.

---

## 1. Rollar

| Bosqich | Rol | Fayl | Nima qiladi | Tahrir |
|---|---|---|---|---|
| S | 📝 **Senariy** (asosiy agent) | `PM_Prompt_v8.md` bilan | 9-blokli senariy generatsiya | — |
| 0 | 🔍 **PM-Auditor** | `pm/pm-auditor.md` | GAP-hisobot (mavjud fayl/QA-oldi) | ❌ |
| 1 | 🏗️ **PM-Quruvchi** | `pm/pm-quruvchi.md` | Senariy -> .jsx: ekranlar, PM primitivlari, wiring | ✅ |
| 2 | 🎨 **PM-Dizayn** | `pm/pm-dizayn.md` | PM identitet: ko'rinish + HARAKAT (animatsiya shu yerda) | ✅ |
| 3 | ⚡ **Jonli** (UMUMIY) | `role/darslik-jonli.md` | Ball/server-baholash relslari | ✅ |
| 4 | 🎓 **PM-Metodist** | `pm/pm-metodist.md` | Til + PM ohangi + keys-sadoqat | ✅ |
| 5 | 🔍 **PM-Tekshiruvchi** | `pm/pm-tekshiruvchi.md` | Adversarial QA (senariy-sadoqat + relslar) | ✅ mayda |
| 6 | ✅ **Verifikator** (UMUMIY) | `role/darslik-verifikator.md` | esbuild + render imzo | ❌ |
| 7 | 🚦 **PM-Qabulchi** | `pm/pm-qabulchi.md` | YAKUNIY GEYT: 20-bandlik PASS/QAYTARISH (senariy 9/9 yopilishi, keys-halollik, relslar, til) | ❌ |

**Nega shunday bo'lingan:**
- `darslik-jonli` va `darslik-verifikator` UMUMIY — ular kontentga qaramaydi (server-ball infra + build/render). Ikkilantirilsa set_quiz_keys bug-sinfi (podium 0-0-0-0) qaytadi.
- Qolgan 5 rol YANGI — texnik rollar Htmllesson1-ankerli, ular PM'da ishlatilsa L1 uslubini ko'chirib keladi.
- 💡 Ijodkor PM'da YO'Q — ijod PM_Prompt_v8 keys-banki va senariyda; ✨ Animatsiya alohida YO'Q — harakat pm-dizayn ichida (PM darslar harakatga texnik darsdan yengilroq).

## 2. Har dars uchun oqim

```
📝 SENARIY — men PM_Prompt_v8 bo'yicha yozaman (kirish: modul, mavzu, o'tilgan ko'nikmalar,
   joriy loyiha, ishlatilgan keyslar, oldingi mexanika)
🎓 PM-Metodist (SENARIY-KORREKTURA rejimi) — til/kollokatsiya/kalka tekshiruvi,
   foydalanuvchi XOM matn ko'rmaydi (2026-07-15 «shirinlik ichadi» saboqi)
   └─ [🚦 GATE S — SIZ] senariyni tasdiqlaysiz (keys tanlovi, artefakt, ohang)
🏗️ PM-Quruvchi   → esbuild darvoza   (senariy -> ekranlar + primitivlar)
🎨 PM-Dizayn     → esbuild darvoza   (identitet + harakat)
⚡ Jonli          → esbuild darvoza   (relslar: set_quiz_keys, kalitlar, arena)
🎓 PM-Metodist   → esbuild darvoza   (til + ohang + keys-sadoqat)
   └─ [🚦 GATE 2 — SIZ] matn/ko'rinish/umumiy his
🔍 PM-Tekshiruvchi → nuqson bo'lsa mas'ul rolga QAYTAR (maks 2 aylanish)
✅ Verifikator    → esbuild + render
🚦 PM-Qabulchi    → 20-bandlik yakuniy PASS/QAYTARISH (senariy-sadoqat yopilishi,
   keys-halollik, ball-halollik, til; QAYTARISH bo'lsa aniq rolga file:line bilan)
   └─ [🚦 GATE 3 — SIZ] yakuniy imzo → holat yangilanadi
```

> **🔴 P0 jonli-sinov saboqlari (2026-07-15, foydalanuvchi):** (1) scored testlar teoriyaga biriktirilib
> TARQATILADI (ketma-ket blok TAQIQ; CodeStrike=yakuniy real test); (2) bitta sahifada yozma mashq maks 3-4;
> (3) KODING = real compiler-muhit (textarea emas); (4) nishon nomlari inglizcha o'yin-nom; (5) hotspot'da
> to'g'ri topilgan javob YASHIL; (6) 2026-07-16: **PROYEKTOR-SIR** — MentorNote default yopiq xira chip
> (bosish=ochish/yopish, ekran almashganda avto-yopiladi) — mentor ekrani katta ekranda ko'rinishini unutmang.
> Batafsil: pm-quruvchi/pm-metodist rollari + senariy v2 bo'limlari.
>
> **Token-tejash (partiya rejimida):** PM-Qabulchi checklisti asosan mexanik — partiyalarda
> bosh-agent uni skript bilan o'zi yuritishi mumkin (6-Modul qa.mjs naqshi). P0 va etalon-
> darslarda esa to'liq rol sifatida chaqiriladi.
> **Eslatma:** texnik pipeline'ning `darslik-qabulchi.md` (repo ildizida) hali aktivlashtirilmagan —
> xohlasa `.claude/agents/role/`ga ko'chirilib texnik darslarga ham shu geyt qo'yiladi.

Bosh-agent har rol-o'tishdan keyin O'ZI dasturiy tekshiradi (QOIDA 10): correct ketma-ketligi, practice:-1, EKRAN<=400, grapheme-tell, esbuild. PM-Auditor alohida bosqich sifatida faqat MAVJUD faylni qayta ishlashda yoki partiya-kirishda chaqiriladi.

## 3. P0 — birinchi PM etalon-dars (majburiy birinchi qadam)

Texnik pipeline Htmllesson1'dan tug'ilgani kabi, PM pipeline P0 darsdan tug'iladi:
1. Foydalanuvchi P0 mavzusini tanlaydi (modul + karta-ma'lumotlari).
2. Senariy [GATE S] -> to'liq human-gated qurilish (har rol-o'tishda ko'rsatiladi, ta'm hakami — foydalanuvchi; ayniqsa PM-Dizayn identitet-tanlovi).
3. P0 imzolangach: **`PM_DARS_ETALON.md`** yoziladi (PM texnik/vizual standarti + P0 manba-xaritasi grep-anchorlar bilan) va PM rollariga P0 = oltin namuna bo'ladi.
4. Keyingi darslar partiyalarda (3-5 talik), P0 naqshida.

## 4. Holat va jonli sinov

- Holat: `PM_PIPELINE_STATE.md` (P0 boshlanganda ochiladi; format PIPELINE_STATE.md kabi).
- Har dars yakunida QO'LDA jonli sinov: yangi PIN, 2 o'quvchi, podium/arena 0 EMAS (MENTOR-2026).
- Commit faqat foydalanuvchi buyrug'i bilan (8-qoida).
