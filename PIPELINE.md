# 🏭 DARSLIK PIPELINE — orkestratsiya qo'llanmasi

> **Maqsad:** 21 xom darslikni `DARS_ETALON.md` + `MATN_ETALONI.md` etaloniga chiqarish — **rollar bo'yicha, qat'iy tartibda, loop/konflikt/salbiy xatti-harakatsiz.**
>
> **Yuritish rejimi:** QO'LDA, human-gated. Asosiy agent (men) bosqichma-bosqich subagent chaqiraman, har bosqichda esbuild tekshiraman, belgilangan darvozalarda foydalanuvchidan tasdiq so'rayman. **Avtomatik loop yo'q — nazorat odamда.**
>
> **Etalon holati:** to'liq namuna = `Htmllesson1.jsx`, `Htmllesson2.jsx`, `CssLesson1.jsx`. Qolganlari shu uchtaga qarab quriladi.
>
> 🏆 **NAMUNAVIY DARS = `src/1-Modull/Htmllesson1.jsx`** (eng zo'r, oltin — YAGONA birlamchi namuna). ⚠️ `Htmllesson2.jsx`/`CssLesson1.jsx` — IKKINCHI DARAJALI (ba'zi joyда ESKIRGAN: masalan L2 nishon-nomlari o'zbekcha + popover "Nishonlar"). Farq bo'lsa — **HAR DOIM Htmllesson1 g'olib.** **Umumiy qoida (har rol uchun):** qanday qilish yoki qaysi logikani ishlatish noaniq bo'lsa — o'zidan yangi yo'l TO'QIMAsin; Htmllesson1'dan **aynan o'sha yo'lni** ko'rib takrorlasin (joyni `DARS_ETALON.md` **15-I MANBA XARITASI**dan topadi). Har rolning promptида ham shu yozilgan. Natijada barcha dars **bir xil, sinovdan o'tgan** yo'l bilan quriladi.

---

## 1. Rollar (`.claude/agents/role/`)

| Bosqich | Rol | Fayl | Nima qiladi | Tahrir |
|---|---|---|---|---|
| 0 | 🔍 **Auditor** | `role/darslik-auditor.md` | GAP-hisobot (nima yetishmaydi) | ❌ yo'q (o'qish) |
| 0.5 | 💡 **Ijodkor** | `role/darslik-ijodkor.md` | Darsga o'ziga xos ijodiy IDEA (dinozavr kabi) — konsept-brief | ❌ yo'q (brief) |
| 1 | 🏗️ **Quruvchi** | `role/darslik-quruvchi.md` | Tuzilma/wiring — qatlamlar mavjud + ulanган | ✅ Edit |
| 2 | 🎨 **Dizayn** | `role/darslik-dizayn.md` | Vizual: brend, rang, layout, real rasm | ✅ Edit |
| 3 | ✨ **Animatsiya** | `role/darslik-animatsiya.md` | Harakat: DragDrop, flip, bayram, tap-hint | ✅ Edit |
| 4 | ⚡ **Jonli** | `role/darslik-jonli.md` | Ball/server-baholash to'g'riligi | ✅ Edit |
| 5 | 🎓 **Metodist** | `role/darslik-metodist.md` | Til + abrazets (MATN_ETALONI, 4.1) | ✅ Edit |
| 6 | 🔍 **Tekshiruvchi** | `role/darslik-tekshiruvchi.md` | Adversarial QA (14+8 checklist) | ✅ faqat mayda |
| 7 | ✅ **Verifikator** | `role/darslik-verifikator.md` | esbuild + render imzo | ❌ yo'q |

**Sifat lensalari (grep tutmaydigan — har biri o'z o'lchovини "his qilib" baholaydi):** 💡 Ijodkor = idea · 🎨 Dizayn = ko'rinish · ✨ Animatsiya = harakat · 🎓 Metodist = ma'no/abrazets. Bular pipeline'ni "checklist"dan "did"ga ko'taradi.

> **Eslatma:** agentlar `.claude/agents/role/` ichida — Claude Code bu papkani (submapkalar bilan) skanerlaydi va `subagent_type` (masalan `darslik-auditor`) sifatida ko'radi. Ularni `.claude/agents/` dan tashqariga ko'chirmang, aks holda pipeline chaqira olmaydi.

---

## 2. Har dars uchun oqim (tartib + darvozalar)

```
🔍 Auditor
   └─ [🚦 GATE 1 — SIZ] GAP-reja + Ijodkor kerakmi (idea zaif/yo'qmi) — tasdiqlang
💡 Ijodkor  (FAQAT kerak bo'lsa — idea zaif/yo'q)  → konsept-brief
   └─ [🚦 GATE 1.5 — SIZ] Ijodiy ideani tasdiqlang (agar Ijodkor ishlagan bo'lsa — ta'm hakami)
🏗️ Quruvchi    → esbuild darvoza   (tuzilma/wiring)
🎨 Dizayn       → esbuild darvoza   (vizual)
✨ Animatsiya    → esbuild darvoza   (harakat)
⚡ Jonli         → esbuild darvoza   (ball)
🎓 Metodist      → esbuild darvoza   (til + abrazets)
   └─ [🚦 GATE 2 — SIZ] Matn/pedagogika + umumiy ko'rinish/his — tasdiqlang (ta'm hakami)
🔍 Tekshiruvchi  → esbuild darvoza
   └─ nuqson bo'lsa → mas'ul rolga QAYTAR (maks 2 aylanish) → keyin [🚦 SIZ]ga eskalatsiya
✅ Verifikator   → esbuild + render
   └─ [🚦 GATE 3 — SIZ] Yakuniy imzo → PIPELINE_STATE yangilanadi → keyingi dars
```

**Nega shu tartib:**
- **Auditor** avval ishni aniqlaydi; agar dars ijodiy ideasi zaif bo'lsa **Ijodkor** yangi idea beradi (dinozavr kabi) — bu eng erta, chunki idea qolgan hammasini shakllantiradi.
- **Quruvchi** tuzilmani ko'taradi (qatlamlar mavjud+ulanган) → **Dizayn** ko'rinishни, **Animatsiya** harakatни sayqallaydi (Quruvchi qo'yган skelet ustidan, ketma-ket — konflikt yo'q).
- **Jonli** ball-to'g'riligini qotiradi (Quruvchi qo'shган QUIZ_BANK/ekranlar ustidan).
- **Metodist ENG OXIRIDA** yakuniy matn+abrazetsни sayqallaydi (qayta yozilmaydigan, tayyor kontentни). Keyin QA → Verifikator.
- **Sifat lensalari ketma-ketligi (Dizayn→Animatsiya→...→Metodist)** — har biri bir o'lchovni chuqur ko'radi; bir fayl, bir muharrir (1-qoida) saqlanadi.

---

## 3. 🛡️ ANTI-LOOP / XAVFSIZLIK — 8 QOIDA (buzilmaydi)

1. **Bir fayl — bir muharrir.** Bosqichlar bitta dars ustida qat'iy KETMA-KET. Parallel FAQAT turli darslarga (turli fayl). Hech qachon ikki agent bitta faylni bir vaqtda tahrirlamaydi.
2. **esbuild darvozasi — har tahrir bosqichidan keyin.** `npx esbuild <fayl> --loader:.jsx=jsx --outfile=/dev/null`. Singan bo'lsa: **TO'XTA**, sabab bilan foydalanuvchiga xabar ber, keyingi bosqichga O'TMA. Avto-tuzatish kaskadi yo'q.
3. **Chekli QA sikli.** Tekshiruvchi → mas'ul rol → qayta tekshir = **maksimum 2 aylanish**. Hal bo'lmasa foydalanuvchiga eskalatsiya. Cheksiz ping-pong TAQIQ.
4. **Idempotentlik (thrash yo'q).** Har rol qatlamni qo'shishdan oldin grep bilan borligini tekshiradi — bor bo'lsa o'tkazadi. Pipeline'ни qayta yuritish xavfsiz.
5. **Scope-fence (DO-NOT ro'yxatlari).** Har rol faqat o'z hududini tahrirlaydi (agent .md da yozilған): 🏗️ Quruvchi=tuzilma/wiring · 🎨 Dizayn=vizual (rang/rasm/layout) · ✨ Animatsiya=harakat (keyframes/transform/timing) · ⚡ Jonli=ball · 🎓 Metodist=matn/abrazets · 💡 Ijodkor+🔍 Auditor+✅ Verifikator=tahrir yo'q. Bir rol ikkinchisining hududiga TEGMAYDI (Dizayn harakatga, Animatsiya rangга, Metodist ballга...). Hech kim BOSHQA darsга yoki commitга tegmaydi.
6. **Human-gate — muhim nuqtalarда.** GATE 1 (Audit-reja), GATE 1.5 (ijodiy idea — agar Ijodkor ishlasa), GATE 2 (matn/dizayn/animatsiya — umumiy his), GATE 3 (yakuniy imzo). Foydalanuvchi — ta'm/nafislik hakami.
7. **Holat manifesti.** `PIPELINE_STATE.md` — qaysi dars qaysi bosqichда. Tugaган bosqich qayta yurmaydi; bosqich o'tkazib yuborilmaydi.
8. **Commit faqat buyruq bilan.** Foydalanuvchi aytmaguncha hech qachon commit yo'q. O'zgarishlar uncommitted qoladi.

---

## 4. Asosiy agent (men) qanday yuritaman

Har dars uchun:
1. `PIPELINE_STATE.md` dan navbatdagi darsni va uning bosqichini oling.
2. **Auditor** ni chaqiring (`Agent` tool, `subagent_type: "darslik-auditor"`, `run_in_background: false`), promptда dars fayli yo'lini bering. Natijani (GAP-hisobot) o'qing.
3. **[GATE 1]** GAP-rejani + ijodiy idea kerakmi (Auditor "idea zaif/yo'q" desa) foydalanuvchiga ko'rsating, tasdiq/tuzatish so'rang.
4. **(Faqat kerak bo'lsa) Ijodkor** ni chaqiring → konsept-brief. **[GATE 1.5]** ideani foydalanuvchiga ko'rsating, tasdiq so'rang. (Idea zo'r bo'lsa yoki mavjud bo'lsa — bu bosqich o'tkaziladi.)
5. **Quruvchi → Dizayn → Animatsiya → Jonli → Metodist** ni KETMA-KET chaqiring. Har biriga: Auditor hisoboti (+ Ijodkor brifi bo'lsa) + shu rolга tegishli bandlar. Har biridan keyin O'ZIM esbuild darvozasini yuritaman. Singan bo'lsa to'xtayman.
6. **[GATE 2]** Metodist+Dizayn+Animatsiya o'zgarishini (diff/xulosa/umumiy his) foydalanuvchiga ko'rsating, tasdiq so'rang.
7. **Tekshiruvchi** ni chaqiring. VERDIKT "QAYTARILADI" bo'lsa → mas'ul rolni BIR marta qayta chaqiring → Tekshiruvchini qayta yuriting (2-aylanish). Yana nuqson bo'lsa → foydalanuvchiga eskalatsiya.
8. **Verifikator** ni chaqiring. IMZOLANMADI bo'lsa → mas'ul rolga qaytar.
9. **[GATE 3]** Yakuniy holatni ko'rsating. `PIPELINE_STATE.md` ni yangilang.
10. Keyingi darsга o'ting (yoki parallel: turli darslarni alohida oqimда).

**Muhim:** subagentlar bir-birini chaqirmaydi — faqat MEN (asosiy agent) ketma-ketlikни boshqaraman. Bu loop imkonsizligining kafolati.

---

## 5. Sinov va joriy etish

- **Avval BITTA darsда to'liq sinash** (`CssLesson2` — etalon 13-tartибda navbatдa), promptlarни sozlash, keyin qolgan 19 darsга.
- Har dars yakunida **QO'LDA jonli sinov**: yangi PIN, 2 o'quvchi, podium/arena ballari 0 EMAS (mentor-kod **MENTOR-2026**). Buni subagent qila olmaydi — foydalanuvchi/asosiy agent qo'lда.
- Ko'chirish tartibi va har dars retsepti: `DARS_ETALON.md` 13-bo'lim.
