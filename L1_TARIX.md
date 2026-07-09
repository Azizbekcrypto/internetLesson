# 📜 L1 TARIX — Htmllesson1 evolyutsiya saboqlari (git-tarixdan)

> **Nima uchun bu fayl:** `DARS_ETALON.md` — "NIMA qilish" (yakuniy holat). Bu fayl — "QANDAY O'YLASH":
> oltin dars 16 commit davomida QANDAY nuqsonlarni topib, QANDAY tuzatgani. Har rol o'z bo'limidagi
> saboqlarni o'qib, yangi darsda XUDDI SHU FIKRLASH bilan ishlaydi. Saboq ID'lari (M1…, S1…) rollarda ishlatiladi.
>
> Manba: `git log --follow -- src/1-Modull/Htmllesson1.jsx` (2026-07-04 → 2026-07-10, 16 commit) — har diff o'rganilgan.

---

## 0. Vaqt chizig'i (nima qachon paydo bo'ldi)

| Sana | Commit | Nima bo'ldi |
|---|---|---|
| 07-04 | `63ab1b0` | **TUG'ILISH** (4422 q): dinozavr o'yini, 19 ekran-oqim, jonli sessiya, arena (Kahoot ko'rinishda), praktika-compiler, metaforalar — BOR. Badges/Flashcards/DragDrop/Debug/CodeStrike/onboarding — YO'Q |
| 07-06 | `8987b6c` | **JONLI-BALL FIX**: set_quiz_keys + answerKey (podium 0/5 bugi) + picked-asosli sanoq + 6 UI nozikligi + MentorPracticeOverlay |
| 07-06 | `34e1a74` | Arena rebrand #1: Kahoot ranglari → CoddyHoot (yorug' fon, QzOwl, mavzu-tokenli fon, QzFX+reduced-motion) |
| 07-07 | `4288e88…e55148b` | **INTERAKTIV TO'LQIN** (9 commit, bir kunda): DragDrop, DebugChallenge (3 iteratsiya!), s15 o'chirish, Flashcards (2 iteratsiya), Achievements (2 iteratsiya), kirill-fix |
| 07-09 | `31f2a8d` | **MEGA-SAYQAL** "optimallashdi" (512+/204−): CodeStrike, restoran metaforasi, TourGuide onboarding, AchCelebrate, fmtCode, RECAPS, QUIZ_MS 20s→15s, dim LiveBadge, test-balans, til |
| 07-10 | `b19ef75` | Yakuniy qarorlar: praktika 5→3, "Badges" yorliq, mentor RASM, "Ishonasizmi", distraktor-balans |

**Asosiy xulosa:** qolgan 20 dars hozir taxminan `63ab1b0` (tug'ilish) darajasida. Ularni etalonga chiqarish = shu jadvaldagi YO'LNI takrorlash. **Idea (dinozavr) 1-kundan bor edi; brend-sayqal oxirida keldi** — tartib muhim.

---

## M. META-PRINSIPLAR (barcha rollar uchun — iteratsiya falsafasi)

- **M1 · Qur → sina → his qil → ko'chir.** DebugChallenge avval s6 (teg-tanishuv)ga qurildi → sinovda "erta, yuk og'ir" sezildi → s13 (Debugging)ga ko'chirildi, s6 soddaga qaytdi. Flashcards avval summary-panelga ko'mildi → o'z sahifasiga chiqarildi. Savol: **"bu element to'g'ri kognitiv bosqichda/sahifadami?"**
- **M2 · Passivdan aktivga.** "4 qismni bosib KO'RDIM" gate → "skeletni O'ZIM yig'dim" gate (`explored` → `dragDone`, ikki faza). Ko'rish bilim emas — yasash bilim.
- **M3 · Qoida emas — OQIBAT.** Debug mashqi "h1 yopilmagan" qoidasini emas, OQIBATINI ko'rsatadi: buzuq preview'da BUTUN matn katta (qizil ramka) → tuzatilganda ko'z oldida to'g'rilanadi (yashil). Bola sababdan o'rganadi.
- **M4 · O'tkinchi feedback yetarli emas.** Nishon-toast 3.6s ko'rinib yo'qolardi → doimiy `🏅 X/4` hisoblagich (har sahifada, bump-puls, popover'da 🔒 maqsadlar). Progress DOIM ko'rinsin.
- **M5 · Idea birinchi, sayqal oxiri.** Dinozavr commit №1'da bor edi; CodeStrike/restoran — №15'da. Yangi darsda ham: avval Ijodkor ideasi qurladi, brend-sayqal keyin.
- **M6 · Kam, lekin ma'noli.** 6 nishon→4 (zaif triggerlilar olib tashlandi), 5 praktika→3, glossary→alohida flashcard sahifa. Har qo'shimcha element "nima qo'shyapti?" savolidan o'tsin.
- **M7 · Dekoratsiya ham o'qitadi.** Arena foni ma'nosiz `▲●◆` edi → dars tokenlari `</>`, `<h1>`, `href` bo'ldi. Har bezak mavzuni takrorlasin.
- **M8 · O'chirish = sinxronlik, ikki qadamda.** s15 o'chirilganda 6 joy yangilandi (SCREEN_META, screens[], Q_LABELS, INLINE_KEYS, PRACTICE_AFTER, scope-izoh); o'lik `Screen15` ta'rifi ALOHIDA commitda tozalandi. (1) oqimdan uz → (2) o'lik kodni o'chir.

---

## S. SABOQLAR KATALOGI (rol bo'yicha)

### ⚡ Jonli (S1–S6)
- **S1 · set_quiz_keys tarixi.** Tug'ilishda `useLiveSession(lessonId)` BIR argumentli edi — kalit serverga bormasdi → server hammani "xato" deb podium/arena **0/5** chiqarardi. Fix: `useLiveSession(lessonId, answerKey)` + `keyRef` + `startMentor`da `liveRpc('set_quiz_keys', …)`; kalit = `{...INLINE_KEYS, ...QUIZ_BANK map}`. Har "xom" darsda shu bug BOR deb kutilsin.
- **S2 · Bitta raqam — bitta manba.** MentorTestStats "1 xato" derdi, pastdagi ustunlar "1 to'g'ri" ko'rsatardi — sanoq eskirgan `a.correct`ga, ustunlar `picked===correctIdx`ga tayanardi. Fix: ikkalasi bir formuladan. Ikki joyda ko'rsatilgan bir qiymat bir manbadan hisoblansin.
- **S3 · QUIZ_MS = 15000 (15s).** `31f2a8d`da 20s→15s: CodeStrike = jang/tezlik hissi. L1 g'olib — yangi darslar 15s (⚠️ L2/Css1/Css2 hali 20s — ko'chirishda yangilanadi).
- **S4 · optionalLive/freeRide.** Jonli darsda individual gate jamoaviy oqimni to'xtatmasin — 9 ekranga `optionalLive` qo'shildi (mashq majburiy emas, mentor proyektorda ko'rsatadi). Testlarga QO'YILMAYDI.
- **S5 · flashHidden.** Bir kontent — ikki oqim: flashcard jonlida faqat mentorga (jamoaviy takrorlash), erkin/self'da hammaga. Navigatsiya darajasida sakraladi.
- **S6 · Signal zonalari.** Praktika-tugadi signali `PRACTICE_DONE_BASE=500+screen` — dars testlari (<100) va arena (100+) bilan TO'QNASHMAYDIGAN diapazon. Yangi signal turi = yangi ajratilgan zona.

### 🏗️ Quruvchi (S7–S12)
- **S7 · Reusable + StrictMode-safe.** Har interaktiv (DragDropOrder/DebugChallenge/Flashcards) faqat props (`items/hints/onSolved`) bilan qayta ishlatiladi; holat ATOMIK (`useState({pool,slots})` bitta), `earn()` `earnedRef`+Set bilan — setState-ichida-setState YO'Q (StrictMode dublikat bugi).
- **S8 · Ikki fazali gate (M2 amaliyoti).** `explored` (4 qism bosildi) → keyin DragDrop swap-in (`sk-swapin`) → `done=dragDone`. Eski ko'rinish O'CHIRILMAYDI — ustiga quriladi, NavNext yorlig'i bosqichma-bosqich o'zgaradi ("...ko'rilgan"→"Skeletni yig'ing"→"Davom etish").
- **S9 · O'chirish retsepti (M8 amaliyoti).** Ekran o'chirish = 6 joy sinxron + o'lik ta'rifni alohida qadam. Non-scored ekranni oxirgi map-kalitlardan KEYIN qo'shsang (sflash idx17) — hech bir map o'zgarmaydi (xavfsiz joy).
- **S10 · Juft tuzatishlar.** `<base target="_blank">` FAQAT `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"` bilan birga ishlaydi — bir tuzatish ikkinchisisiz o'lik. Preview himoyalari: `li:empty{display:none}` (chala kod artefaktini yashir).
- **S11 · Markazlashgan trigger.** Nishonlar EKRANLARGA sochilmagan: bitta `ACH_TRIGGERS` map + `recordAnswer`dagi bitta `earn()` chaqiruv + `AchCtx` Context (prop-drilling'siz Stage'ga). Yangi qatlam ham shunday: bir map, bir hook-nuqta.
- **S12 · MentorPracticeOverlay oqimi.** Jonli mentorda praktika: o'quvchi o'zi yozadi (✏️→✓ jonli chiplar, 500+ signal polling) → mentor "Doskada yozib ko'rsatish" demo → keyingi mavzu. Mentorga compilator overlay OCHILMAYDI.

### 🎨 Dizayn (S13–S18)
- **S13 · Begona brend → o'z brend, IKKI bosqichda.** Kahoot ranglari `#E21B3C…` + qora-binafsha fon → CoddyHoot (yorug' `#F0F4FC`, coral/ocean/sun/leaf) → CodeStrike. Maqsad "tanib bo'lmas" emas — "BIZNIKI". Uchinchi tomon UI'si to'liq ko'chiriladi.
- **S14 · Rang semantikasi drift qiladi — qidirib tuzat.** "Sizning loyihangiz"/xulosa bloklari `frame-soft`/`accentSoft`da edi (bola "xato qildim" deb o'qiydi) → `frame-success`. "Me" belgilari coral→yashil `#12A968` (o'zini ijobiy ajratish).
- **S15 · Sekundar UI xira.** LiveBadge doim to'la ko'rinib kontentdan diqqat tortardi → `opacity:.4` (hover 1, touch .62). Yordamchi panel kerak bo'lguncha ko'zga tashlanmasin.
- **S16 · Preview real render'ga mos.** `.pv-h1`da font-weight yo'q edi — haqiqiy `<h1>` bold. Taqlid ham bold. Har mockup "brauzer shunday ko'rsatadimi?" savolidan o'tsin.
- **S17 · Yakun ekrani = harakatga chaqiriq.** Yig'ma glossary yakundan olib tashlandi (kontent alohida flashcard-sahifaga), CTA matn-tugmadan yorqin `CsWordmark`ga aylandi. Yakunda diqqat bitta: keyingi qadam.
- **S18 · Avatar qarori (zigzag → standart).** rasm-import → emoji 🧑‍🏫 → **hostlangan RASM** (`MENTOR_IMG` CDN URL) — yakuniy standart 11.1: real yuz ishonch beradi, lekin faqat hostlangan (import emas). Zigzagni takrorlama — to'g'ri standart bilan boshla.

### ✨ Animatsiya (S19–S23)
- **S19 · Muhim yutuq — muhim nishonlanadi.** 3.6s mikro-toast → to'liq-ekran AchCelebrate (nurlar, medal-bounce, 14 uchqun, zarba halqalari, ~4s). Lekin NAVBAT bilan bittalab (`toasts[0]`).
- **S20 · Harakat javobni TASDIQLAYDI.** Flashcard: quruq setTimeout-almashish → Quizlet-uslub: ✓ yashil muhr o'ngga uchadi / ✗ qizil chapga, yangi karta pastdan (`swapRef` remount), `exiting` paytida tugmalar qulf (ikki-bosish bugi yo'q). Tanish naqsh (swipe) o'rganishni tezlashtiradi.
- **S21 · reduced-motion tug'ilishdan.** QzFX canvas birinchi kunidanoq `prefers-reduced-motion` tekshiradi. Har og'ir animatsiya bilan birga tinch variant yoziladi — keyin emas.
- **S22 · Almashtirish swap-in bilan.** Statik skelet → DragDrop o'tishi `sk-swapin` animatsiya orqali — kontent "sakrab" o'zgarmaydi.
- **S23 · Affordance-puls.** Bosilmagan interaktiv qism `tap-hint` pulsatsiya + bosilgani ✓ + jonli `2/4` hisoblagich. Jim interfeys emas — "meni bos" deb chaqiruvchi.

### 🎓 Metodist (S24–S30)
- **S24 · Metafora FUNKSIONAL mos bo'lsin.** "yuz ko'rinadi / miya ichkarida ISHLAYDI" — soxta: `head` ishlamaydi, sozlama saqlaydi → "restoran: ZALni mehmon ko'radi / OSHXONAda tayyorlanadi, mehmon kirmaydi". Metafora har bo'lagi vazifaga mos kelsin (MATN 4.1).
- **S25 · Hint javob emas — MAZMUN.** DragDrop hintlari "eng boshi/hujjat/ichida/oxiri" (joylashuv) → "eng boshida / butun sahifa qobig'i / ko'rinmas qism / ko'rinadigan qism" (vazifa). Slot hinti o'rganilayotgan tushunchani takrorlasin.
- **S26 · Savol > va'da.** "Va'da beraman: dars oxirida saytingiz tayyor" → "Ishonasizmi — dars oxirida o'zingizning saytingiz tayyor". Curiosity gap rasmiy va'dadan kuchli.
- **S27 · Aniq subyekt + konkret so'z.** "buyruqlarni bergan tartibingizda, aynan bajaradi" → "SIZ bergan tartibda, BIRMA-BIR bajaradi". "Aynan" mavhum; "birma-bir" ko'z oldiga keladi.
- **S28 · Kognitiv bosqich savoli (M1).** Debug mashqi teg-tanishuv ekranida ERTA edi (bola hali teglarni bilmaydi) → teglar o'rganilgach, "AI kodini tekshirasiz" kontekstiga ko'chirildi. Har mashq uchun: "bola BU nuqtada buni bajara oladimi?"
- **S29 · Distraktor halolligi.** To'g'ri javob pozitsiyasi (ko'pincha 0/1-da) VA uzunligi (eng batafsili to'g'ri) bilan o'zini sotardi → pozitsiyalar taqsimlandi (3/3/3/3), variantlar teng vaznli to'liq jumlalarga tenglashtirildi. RECAPS `{}` → har scored test 3 karta (xato = qayta o'qitish imkoniyati).
- **S30 · Mikro-nusxa birga yuradi.** "Yarat/Tozala/Ishga tushir" → to'liq fe'llar; tugma + uni aytgan mentor matni + audio BIR vaqtda yangilanadi; "xatboshi"→"matn (paragraf)" fayl bo'ylab HAMMA joyda (task, brief, starter, izoh).

### 🔍 Tekshiruvchi (S31–S34)
- **S31 · Homoglif ovi.** Lotin so'z ICHIDA yashirin kirill: `qamрагач`, `hisси`, `yakunlashдан`, `sudralган` — ko'z ilg'amaydi, build o'tadi, qidiruv buziladi. `grep -nP '[\x{0400}-\x{04FF}]'` har QA'da; faqat `ru:` qoladi.
- **S32 · Zid ma'lumot detektori (S2 QA tomoni).** Bir ekranda ikki raqam bir-biriga zid bo'lsa (sanoq "1 xato" / ustun "1 to'g'ri") — manba ikkilanган. Har statistika juftini solishtirib ko'r.
- **S33 · O'lik kod refaktordan keyin.** s15 oqimdan uzilgach `Screen15` ta'rifi 55 qator o'lik kod bo'lib qoldi — keyingi commit topib o'chirdi. Har olib-tashlashdan keyin: ishlatilmay qolgan komponent/const/CSS bormi?
- **S34 · Balans QO'LDA o'qiladi.** QUIZ_BANK ikki MARTA qayta balanslandi (31f2a8d va b19ef75) — grep 3/3/3/3'ni ko'radi, lekin "to'g'risi uzunligidan bilinadi"ni faqat ODAM o'qib ko'radi. 8.4 tekshiruvi hech qachon grep bilan yopilmaydi.

### 💡 Ijodkor (S35–S37)
- **S35 · Idea = mexanika ixtirosi, birinchi kundan.** Dinozavr (buyruq tuz → u BIRMA-BIR bajaradi, kaktusda yiqiladi) tug'ilish commit'ida to'liq bor edi. Idea keyin "qo'shib qo'yiladigan" narsa emas — dars shu atrofida quriladi.
- **S36 · Nom-mascot-mexanika BIR his.** CoddyHoot (boyqush=donolik) jang arenasiga mos kelmasdi → CodeStrike (chaqmoq=tezlik) + timer 20s→15s + jang-atmosfera wordmark. Brend nomi qanday his bersa, mascot ham, mexanika (vaqt!) ham shu hisni bersin.
- **S37 · Tanish naqshdan foydalain.** Flashcard baholash Quizlet-swipe naqshiga o'tkazildi — bola YANGI interfeys o'rganmaydi, bilgan naqshida o'rganadi. Yangi mexanika o'ylaganda: "bola buni qaysi o'yin/ilovadan taniydi?"

### 🔍 Auditor (S38–S40)
- **S38 · "Xom dars" profili.** Qolgan darslar ≈ tug'ilish holati: jonli infra BOR, lekin odatda YO'Q: to'liq set_quiz_keys zanjiri, Badges, Flashcards sahifa, DragDrop/Debug, CodeStrike, onboarding, fmtCode, MentorPracticeOverlay, RECAPS kontenti. GAP-hisobotni shu profil bo'yicha kutib boshla.
- **S39 · "Bu bo'g'in nima qo'shyapti?"** s15 yakuniy praktika bilan TAKROR edi → o'chirildi. Har ekran uchun qiymat-savoli; takror/qiymatsiz bo'g'in = o'chirish ish-buyrug'i (M8 retsepti bilan).
- **S40 · Ko'milgan boylik va passiv gate'lar.** Flashcard yakun-panelida ko'milgan edi; Screen5 "bosib ko'rish" bilan o'tkazardi. GAP-hisobotda faqat "yo'q"ni emas — "bor lekin ko'milgan / bor lekin passiv / bor lekin noto'g'ri bosqichda"ni ham qidir.

### ✅ Verifikator (S41–S42)
- **S41 · Regressiya sinflari.** Tarixdagi har bug — regressiya nomzodi: podium 0/5 (kalit), zid statistika, homoglif, o'lik kod, `\'` JSX'da. Imzolashdan oldin shu sinflar bo'yicha yakuniy ko'z.
- **S42 · Hajm-sanity.** Har qatlam faylni o'stirgan (4422→5228 q). Build hajmi keskin KICHRAYSA — qatlam yo'qolgan; solishtirib imzola.

---

## R. Rol → saboq indeksi

| Rol | Meta | Saboqlar |
|---|---|---|
| 🔍 Auditor | M1 M6 M8 | S38 S39 S40 |
| 💡 Ijodkor | M2 M3 M5 M7 | S35 S36 S37 |
| 🏗️ Quruvchi | M2 M8 | S7 S8 S9 S10 S11 S12 |
| 🎨 Dizayn | M6 M7 | S13 S14 S15 S16 S17 S18 |
| ✨ Animatsiya | M3 M4 | S19 S20 S21 S22 S23 |
| ⚡ Jonli | — | S1 S2 S3 S4 S5 S6 |
| 🎓 Metodist | M1 M6 | S24 S25 S26 S27 S28 S29 S30 |
| 🔍 Tekshiruvchi | M6 | S31 S32 S33 S34 |
| ✅ Verifikator | — | S41 S42 |
