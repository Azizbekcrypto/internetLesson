# 📕 PM DARS ETALONI — PM_DARS_ETALON.md

> **Oltin namuna (P0):** `src/pm/PmUserStoryLesson.jsx` (`pm-m3d2-v1`) — foydalanuvchi jonli-sinovi + v2 qayta-ishlovdan o'tgan YAGONA birlamchi PM namuna. Qanday qilish noaniq bo'lsa — o'zingdan to'qima, P0'dan AYNAN o'sha yo'lni ko'chir (quyidagi 3-bo'lim xaritasi).
> **Senariy-qonun:** `PM_Prompt_v8.md` (9 blok, K1-K19, 13 maydon). **Til-qonun:** `MATN_ETALONI.md`. **Jonli-ball relslari:** `DARS_ETALON.md` 2/3/4/5.7/6/7/8.1/8.3 (butun platforma bilan UMUMIY).
> ❌ **Htmllesson1 PM uchun namuna EMAS** — texnik-dars kontenti (dinozavr/restoran/HtmlCompiler-mantiq) PM'da topilsa NUQSON.

**Belgilar:** 🔴 majburiy · 🟡 muhim · 🟢 boyituvchi.

---

## 1. 🎨 PM-STUDIA IDENTITET-PASPORTI (barcha PM darslarda AYNAN shu)

**Konsepsiya:** «mahsulot-menejerning ish stoli» — sovuq-indigo studiya (texnik darslar issiq-apelsin; arena binafshasi bilan bir oila).

| `T.*` token | Qiymat | Ma'no |
|---|---|---|
| `bg` | `#F2F0FA` | studio-qog'oz fon |
| `ink / ink2 / ink3` | `#1B1630 / #565073 / #9C97B4` | indigo-siyoh matn |
| `accent` | `#5B3DE6` | PM brend (sarlavha-urg'u, mentor, CTA, tanlov) |
| `accentSoft` | `#EBE5FD` | yumshoq indigo fon (maslahat/hint — XATO EMAS) |
| `accentVivid` | `#6E4BFF` | gradient/urg'u |
| `success / successSoft` | `#12A968 / #E4F5EC` | topildi/bajarildi/o'z-ball |
| 🔴 `err / errSoft` | `#E5484D / #FCE7E8` | **FAQAT haqiqiy xato** (noto'g'ri bosish, FAIL) |
| `blue` | `#0E86C4` | KIM-slot / info |
| `line` | `#E7E3F4` | chiziqlar; soyalar sovuq-indigo `rgba(40,34,82,…)` |

- **Tipografika:** Source Serif 4 (sarlavha/hikoya — editorial) · Manrope (matn) · JetBrains Mono (raqam/kod).
- **Karta-uslub:** oq qog'oz + indigo soya + `line` halqa; artefaktlar «indeks-karta/hujjat» hissi (chap-accent hoshiya); interaktivlar hover'da translateY-lift.
- **Formula/slot semantikasi:** KIM=ko'k · NIMA=amber · NATIJA=yashil.
- **Dekor o'qitadi (M7):** fon/arena tokenlari (`QZ_BG_SHAPES`/`TOK`) shu dars atamalaridan; ma'nosiz shakl yo'q. Arena CodeStrike brendi O'ZGARMAYDI (platforma mahsuloti).
- Universal: layout 1100px+`--lz`+padH60 · `MENTOR_IMG`+`PHOTO_SET` hostlangan · xira LiveBadge · o'z-ball yashil · `prefers-reduced-motion` har og'ir animatsiyada.

## 2. 🔴 BLOK→EKRAN STANDARTI (P0 naqshi, ~15 ekran)

```
s0 HOOK (keys-savol, ovoz-berish, vizual imzo-sahna) → s1 MAQSAD (JONLI natija-preview — kartalar ko'z oldida to'ladi)
→ TEORIYA-1 (savol+hayotiy misol → interaktiv qoida-konstruktor) → 🔴 TEST-1
→ TEORIYA-2 (KEYS-SLAYD: «CASE STUDY» eyebrow, bosqichma-bosqich) → 🔴 TEST-2
→ AMALIYOT (o'z loyihasiga birinchi qadam, jonli validator) → USTAXONA (artefakt, 3-4 element)
→ 🔴 TEST-3 → KODING (compiler-qobiq) → RECAP (juftlik-taymer+Reflection+3 harakat-savol)
→ UYGA VAZIFA (SHARTNOMA harakat-ekrani) → PODIUM → CODESTRIKE ARENA → SUMMARY
```

🔴 **TEST-TAQSIMOT:** scored testlar HECH QACHON ketma-ket blok emas — har biri o'z teoriyasidan keyin; RECAP kartalari (RECAPS) aynan o'z teoriyasini qayta tushuntiradi. CodeStrike = yakuniy «real test».

## 3. 📍 P0 MANBA XARITASI (grep-anchor — qator raqami DRIFT qiladi, doim grep bilan toping)

| Primitiv/qatlam | Anchor (`grep -n "<anchor>" src/pm/PmUserStoryLesson.jsx`) | Nima |
|---|---|---|
| Palitra | `const T = ` / `const LT` | PM-STUDIA tokenlari |
| Jonli relslar | `function useLiveSession` / `set_quiz_keys` | server-ball zanjiri (TEGILMAYDI — darslik-jonli) |
| Hook ovoz-sahna | `.mshake-` / `hook-mc` | ovoz plitkalar + natija-vizual (har darsda O'Z imzo-vizuali) |
| Qoida-konstruktor | `.fslot` / `.frag-chip` | bo'lak-tap qoida yig'ish (magnit-doska) |
| Keys-slayd | `K11_SLIDES` / `.k-slide` | CASE STUDY slayd-naqshi (yangi darsda K<N>_SLIDES) |
| Jonli validator | `validateStory` / `StoryCheck` | artefakt formula-tekshiruvi |
| Ustaxona | `ScreenStoryWorkshop` / `STORIES_KEY` | artefakt-muharrir + storage (amaliyot↔ustaxona ko'chish) |
| Maqsad-preview | `DEMO_STORIES` / `.demo-slot` / `.silo-fill` | s1 WOW: natija-kartalar CSS-taymlayn bilan o'zi to'ladi |
| Scored hotspot | `renderMode="hotspot"` / `BrokenStory` / `.hs-broken` | bo'lak-bosish testi (topilgan=YASHIL ✓, noto'g'ri bosilgan=QIZIL); oddiy tashxis-test = `ctaLabel`/`revealPrefix` props (P0 s9) |
| Kompilyator | `PmCompiler` / `.hcp-root` / `.kod-launch` | TO'LIQ-EKRAN: launch-karta → topshiriq+jonli shart-chiplar+debounce avto-tekshiruv+editor\|natija+«Davom etish» |
| Juftlik-taymer | `PairTimer` | RECAP soft-mexanika |
| SHARTNOMA | `HW_KEY` / `.hw-chip` | uyga-vazifa tanlov-ekrani (summary o'qiydi) |
| Mentor jonli chiplar | `MentorPracticeStats` | «✏️ Ism»→«✓ Ism», 3s polling, `PRACTICE_BASE+screen` |
| Proyektor-sir | `const MentorNote` / `.mnote-chip` | MENTORGA default-yopiq toggle chip |
| Nishonlar | `const ACHIEVEMENTS` / `ACH_TRIGGERS` | 4 ta, inglizcha o'yin-nom, faqat real harakatga |
| Arena | `const QUIZ_BANK` / `QUIZ_MS` / `QZ_BG_SHAPES` | 12 savol·15s·3/3/3/3·naqshsiz·tokenlar mavzudan |
| Kalitlar | `const INLINE_KEYS` / `PRACTICE_BASE` | id-based kalitlar + 500+ signal-zona |

## 4. 🔴 QAT'IY QOIDALAR (P0'da qonlangan — har yangi darsga)

1. **Test-taqsimot** (2-bo'lim) — testlar teoriyaga biriktiriladi.
2. **Yozma mashq maks 3-4 element** bitta sahifada; katta artefakt sinf(3)+uy(+2) bo'linadi.
3. **KODING = REAL KOMPILYATOR har darsda (2026-07-16 foydalanuvchi qonuni, P0-ko'rikda kuchaytirilgan):** Htmllesson1 tizimi TO'LIQ-EKRAN ko'rinishda (P0: `PmCompiler`): dars-ekranda launch-karta («🛠 Kompilyatorni ochish») → to'liq ekranda topshiriq + JONLI shart-chiplar (yozgan sari debounce avto-tekshiruv, birinchi bajarilmagan shartga 💡 hint) + editor (Tab=2 probel, ▶) | jonli iframe-natija + pastda ← Darsga qaytish / Qaytadan / «Davom etish» (faqat hamma shart ✓). Inline yarim-sahifa textarea O'TMAYDI. Faqat INFRA — texnik-dars kontenti emas.
4. **Mentor-panel jonli chiplar** (praktika/koding ekranlarida).
5. **PROYEKTOR-SIR:** MentorNote default yopiq xira chip (bosish=ochish/yopish; ekran almashsa avto-yopiq).
6. **Nishonlar:** 4 ta · name inglizcha o'yin-nom («Story Pro!»/«Nice Catch!»/«Tool Maker!»/«Level Up!» uslubi) · desc o'zbekcha siz-forma · faqat REAL tekshiriladigan harakatga.
7. **Hotspot rang:** topilgan buzuq bo'lak YASHIL+✓ («topdingiz!»); qizil FAQAT noto'g'ri bosilganda.
8. **Test-shart naqshi:** kontekst-gap (lead) → material → ANIQ topshiriq-gap (cue), oldingi teoriyaga bog'langan.
9. **EKRAN ≤ 400 grapheme** — bitta ekranda o'quvchi ko'radigan JAMI o'quv-matn, **mentor-pufak SHU JUMLADAN** (2026-07-16 qabul-konvensiyasi, M8-D1 Screen2 saboqi) · **uzunlik-tell ≤1.4×** (Intl.Segmenter, correct vs 2-eng-uzun) · arena seq naqshsiz (sikl TAQIQ) · taqsimot teng.
10. **Keys-sadoqat:** faqat K1-K19; raqam yilsiz yo'q; «raqamsiz» keysga raqam qo'shilmaydi; pul %/sifat; shaxsiy boylik yo'q. Modul ichida bosh-keys takrorlanmaydi; TEKSHIRUV mexanikasi oldingi darsni takrorlamaydi (jurnal: `PM_PIPELINE_STATE.md`).
11. **Storage:** kalitlar lesson-scoped (`pm-<mNdK>-...`); lessonId format `pm-m<N>d<K>-v<V>`, katta o'zgarishda versiya oshadi.
12. **Signal-zonalar:** test <100 · arena 100+ · praktika `PRACTICE_BASE(500)+screen`; `INLINE_KEYS`da `practice: -1` sentinel.
13. Platforma taqiqlar: placeCorrect YO'Q · mentor.png lokal import YO'Q (`MENTOR_IMG` URL) · auto `setBigOpen(true)` YO'Q · atama birinchi ko'rinishda o'zbekcha gloss bilan.

**2026-07-16 P0 FOYDALANUVCHI-KO'RIGI QONUNLARI (14-20):**

14. **Ichki-jargon ekranga oqmaydi:** «YADRO», «artefakt», blok/pipeline nomlari o'quvchi ko'radigan matnda TAQIQ (izohda mumkin). Mavhum va'da («javob darsda ochiladi») o'rniga «birozdan keyin birga bilib olamiz» uslubi.
15. **Sarlavha = sinfga savol:** har teoriya/amaliyot ekran h2'si qiziqtiruvchi savol-murojaat (texnik-dars uslubi: «Formulani o'zingiz yig'a olasizmi?»). Quruq darak-sarlavha nuqson.
16. **Mentor-pufak ohangi:** maks 1-2 `<b>`; «1) 2) 3)» raqamlangan chala gaplar TAQIQ — ravon savol-ohangli gaplar; pufak dizaynga sig'sin.
17. **Test halolligi:** faqat BITTA variant himoyalanadigan-to'g'ri (boshqa variant ham mazmunan rost bo'lsa test buzuq — s9 dark-mode saboqi); lead ≤1 gap, cue ≤1-2 gap.
18. **MAQSAD-ekran WOW:** s1 natija-preview jonli to'ladi (`DEMO_STORIES` naqshi); statik siluet + dekorativ `rotate()` qiyshiqlik TAQIQ.
19. **Overflow-himoya:** foydalanuvchi kiritmasi ko'rinadigan har konteynerda `min-width:0` + `overflow-wrap:anywhere` (9-page bugi sinfi).
20. **MentorNote faqat zarur ekranda** (sir-saqlash/baholash-mezoni/vaqt-qoidasi/tekshirish-qoidasi) · **CTA-kapsula ixcham** — kutish holatida matndan keyin bo'sh joy qolmasin (`.cs-cta .cs-cap` override), CODE STRIKE so'z kattaligi o'zgarmaydi.

## 5. ✅ QABUL-CHECKLIST
`pm-qabulchi` 20-bandi (rol faylida) + rollar DoD. Yakuniy jonli-sinov QO'LDA: yangi PIN + 2 o'quvchi + MENTOR-2026 → podium/arena 0 EMAS.

## 6. 🏭 YANGI DARS RETSEPTI
1) Kirish-ma'lumot (`PM_PIPELINE_STATE.md` jurnalidan: ishlatilgan keyslar + oldingi mexanika) → senariy (PM_Prompt_v8) → pm-metodist KORREKTURA → [GATE S].
2) pm-quruvchi (P0'dan primitivlar, 3-bo'lim xaritasi; kontent yangi) → pm-dizayn (identitet 1-bo'lim; imzo-vizual har darsda YANGI) → darslik-jonli → pm-metodist → pm-tekshiruvchi → darslik-verifikator → pm-qabulchi.
3) Bosh-agent har o'tishda skript-darvoza (QOIDA 10); parallel partiyada har agent NOYOB scratch-katalog (QOIDA 11).
4) App.jsx ulash + vite build + jurnal yangilash. Commit faqat buyruq bilan.
