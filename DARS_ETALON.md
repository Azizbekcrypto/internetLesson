# 📐 DARS QURILISH ETALONI — TO'LIQ (Reference Standard)

> **Oltin etalon (full):** `src/1-Modull/Htmllesson1.jsx` va `src/1-Modull/Htmllesson2.jsx` — boy, jonli, brendlangan namunaviy darslar.
> **Jonli-ball qatlami uchun** qo'shimcha manba: `src/InternetLesson.jsx`, `src/PmLesson1.jsx` (bir xil infra); RECAPS namunasi ham InternetLesson'da.
>
> **Maqsad:** qolgan barcha darslarni shu etalon bo'yicha qurish va shu bo'yicha tekshirish.
>
> **Eng muhim qoida (statistika buglari shu yerdan chiqadi):** jonli ball hisoblash **SERVERda**
> bo'ladi. Server javob kalitini mentor sessiya ochganda oladi (`set_quiz_keys`). Kalit yuklanmasa,
> server hamma javobni **"xato"** deb belgilaydi → podium va arena ballari **0 0 0 0** bo'ladi.
> (Aynan shu bug boshida 19 ta darslikda bor edi — 12 va 13-bo'limlarga qarang.)
>
> **Layout standarti (majburiy, istisno yo'q):** barcha darslar bir xil o'lchamda — stage **1100px**,
> padH **60**, avto-zoom `--lz` (11.11-qoida, 15-F retsept). Boshqa kenglik qabul qilinmaydi.

**Belgilar:** 🔴 = majburiy (buzilsa dars ishlamaydi) · 🟡 = muhim (noto'g'ri ko'rinish) · 🟢 = boyituvchi (mashqlar) · ⚪ = kosmetik.

---

## 0. Qanday ishlatiladi

1. Har darsni quyidagi bo'limlar bo'yicha ketma-ket tekshir.
2. Har o'zgarishdan keyin **build toza** ekanini tekshir: `npx esbuild <fayl> --loader:.jsx=jsx --outfile=/dev/null` (yoki `--outfile` scratch faylga).
3. Jonli qismni **yangi PIN bilan** sinash SHART (2 o'quvchi → podium/arena ballari 0 EMAS). Mentor-kod test uchun: **MENTOR-2026**.
4. Oxirida **14-bo'lim (tekshiruv ro'yxati)**ni to'ldir.

---

## 1. 🔴 TIL VA MATN

> **📖 Batafsil: `MATN_ETALONI.md`** — til/matn sifatining to'liq standarti (siz-forma, «qiyin so'z → sodda so'z»
> lug'ati, ma'no aniqligi, ohang, darslar bo'yicha matn-audit tarixi). Quyida — qisqa xulosa. Matnni chuqur
> tekshirish/tuzatish o'sha faylning tekshiruv ro'yxati bo'yicha qilinadi.

- **Faqat lotin o'zbek.** Tasodifiy kirill harflarga yo'l qo'yilmaydi (`а е о с р х у к н г д л ...` lotin ko'rinadi, lekin boshqa belgi). Tekshiruv:
  ```
  grep -nP '[\x{0400}-\x{04FF}]' <fayl>
  ```
  → faqat ataylab **ruscha `ru:` tarjima** (`{ uz: '...', ru: 'Основы HTML' }`) qatorlari chiqishi mumkin. Boshqa har qanday kirill = xato, lotinga o'giriladi.
- **Tushunarli so'zlar:** boshlang'ich o'quvchi uchun. Masalan `<p>` = "matn (paragraf)" (❌ "xatboshi"); skelet bo'laklari uchun aniq maslahatlar ("butun sahifa qobig'i", "ko'rinmas qism").
- **Faqat siz-forma.** O'quvchiga qaratilgan BARCHA matn — tugmalar, nishon tavsiflari, mentor gaplari, xulosa/muvaffaqiyat xabarlari — "siz" shaklida ("bosing", "topdingiz", "o'zingiz"). ❌ "Topding va tuzatding" → ✅ "Topdingiz va tuzatdingiz". Tekshiruv:
  ```
  grep -noE "[a-z']+(ding|lading|gansan|asan|san)\b|o'zing\b|senga|sening" <fayl>
  ```
  **Istisno:** o'quvchining O'ZI mashinaga bergan buyruqlari (dinozavrga "Yur"/"Sakra", AI promptiga "rasm qo'sh") — bu "kod = kompyuterga buyruq" g'oyasini o'rgatadi, sen-formada qoladi.
- **Tugma nomlari — neytral harakat oti:** "Yaratish", "Yuborish", "Tozalash", "Ishga tushirish" (❌ "Yarat", "Tozala", "Ishga tushir"). Tugma nomi o'zgarsa, uni tilga olgan mentor matni va **audio matni** ham birga yangilanadi.
- **Bir xil apostrof:** o'zbek lotin apostrofi manbada ASCII `'` bilan yoziladi (JS string ichida kerak bo'lsa `\u2019` escape). Literal qiyshiq apostrof belgilari (U+2018 ‘, U+2019 ’, U+02BB ʻ) aralashmasin — ko'z ilg'amaydi, lekin matn nomuvofiq bo'ladi. Tekshiruv:
  ```
  grep -n "[‘’ʻ]" <fayl>
  ```
  → hech narsa chiqmasligi kerak.
- **Matn ↔ UI mosligi:** matnda tilga olingan tugma nomi ekrandagi tugma yozuvi bilan AYNAN bir xil bo'lsin. ❌ «"Sayt" tugmasini bosib, ichida nima borligini ko'ring» — vaholanki ichini "Kod" tugmasi ochadi.
- **"Sir"-uslub taqiqlanadi:** o'quvchiga ko'rinadigan matnda "sir", "hozircha sir", 🤫/🙈 kabi sirli-dramatik ifodalar ISHLATILMAYDI — aniq, tinch tushuntirish yoziladi. ✅ "Javobingiz yozib olindi. To'g'ri yoki xato ekani mentor «Natijani ochish»ni bosganda hammada birdan ko'rinadi." Tekshiruv: `grep -nE "hozircha sir|🤫" <fayl>` → bo'sh (kod izohlaridagi "sir" hisobga olinmaydi).
- Mentor matni sodda, do'stona.
- **Audio qatlami (AUDIOSIZ, lekin matnlar majburiy):** ovoz hozircha o'chirilgan, ammo har ekranda
  `useAudio([{ id, text, trigger: 'on_mount', waits_for }])` matni YOZILADI (keyin yoqilganda tayyor bo'lsin) va
  muhim harakat javoblari `pushOneOff("...")` bilan beriladi. **Audio matn ↔ Mentor matn parallel** —
  biri o'zgarsa ikkinchisi ham (tugma nomlari bilan birga). `waits_for` hodisalari (`option_picked`,
  `error_found`, `link_jumped`...) ekrandagi haqiqiy trigger bilan bog'lanadi.

---

## 2. 🔴 JONLI SESSIYA + SERVER-BAHOLASH (eng kritik)

O'quvchi aldab `correct=true` yubora olmasin uchun javoblarni **server baholaydi**. Buning uchun
mentor sessiya ochganda javob kaliti serverga yuklanishi SHART.

### 2.1 `useLiveSession` imzosi — `answerKey` + `keyRef`
```js
function useLiveSession(lessonId, answerKey) {
  const keyRef = useRef(answerKey); keyRef.current = answerKey; // javob kaliti — mentor sessiya ochganda serverga yuklanadi
  const initRef = useRef(undefined);
  ...
```
❌ Xato: `function useLiveSession(lessonId) {` (answerKey/keyRef yo'q).

### 2.2 `set_quiz_keys` — `startMentor` ichida, `liveStore(... mode:'mentor' ...)` dan KEYIN
```js
liveStore(lessonId, { mode: 'mentor', pin: row.pin, token: row.token });
// 🔴 Javob kalitini serverga avto-yuklash — busiz server hammani "xato" deb hisoblaydi (podium 0/5).
if (keyRef.current) liveRpc('set_quiz_keys', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim(), p_keys: keyRef.current }).catch(() => {});
```
❌ Xato: bu qator umuman yo'q → kalit serverga bormaydi.

### 2.3 `answerKey` chaqiruv tomonida quriladi (odatda buzuq darslarda ham bor)
```js
const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
const live = useLiveSession(LESSON_META.lessonId, answerKey);
```

### 2.4 `INLINE_KEYS` ↔ `correctIdx` muvofiqligi
- Shakli: `{ [screenId]: correctIdx }`. Yozma (input) savollar uchun `-1`.
- **Har `INLINE_KEYS[id]` qiymati o'sha ekranning `QuestionScreen`ga uzatilgan `correctIdx` bilan bir xil bo'lishi SHART**, aks holda to'g'ri javob ham "xato" sanaladi.
```js
const INLINE_KEYS = { s4: 2, s5b: 3, s7: -1, s11: 1 }; // Htmllesson1 (s15 olib tashlangan)
```

### 2.5 Server-baholash tamoyili (nega kalit shart)
- O'quvchi `p_picked` (tanlagan indeks) yuboradi; server `p_picked === kalit[p_question_id]` ni tekshirib `correct` ni **o'zi** yozadi.
- Klientning `p_correct` qiymatiga **ishonilmaydi**.
- Isbot: picked=xato + `p_correct=true` yolg'on yuborilsa ham, kalit yuklangan bo'lsa server `correct=false` yozadi.

### 2.6 Nickname — qurilma bo'ylab BITTA (darsga bog'lanmagan)
```js
const LIVE_NICK_KEY = 'liveNickname'; // localStorage kaliti — DARSGA EMAS, qurilmaga bog'liq
```
O'quvchi bir darsda yozgan ismi keyingi darslarning LiveGate'ida avtomatik to'ldirilgan chiqadi
(`nickRead()` → input boshlang'ich qiymati). ❌ Xato: kalitni `lessonId` bilan yasash — har darsda qayta so'raladi.

---

## 3. 🔴 `submitAnswer` — imzo va indeks konvensiyalari

Imzo (o'zgartirmang): `submitAnswer(screenIdx, questionId, picked, correct, elapsedMs)` → RPC `submit_answer` (3 martagacha qayta urinish).

| Indeks diapazoni | Nima | `question_id` |
|---|---|---|
| `< 100` | Dars ichidagi testlar | `s4`, `s5b`, ... (SCREEN_META id) |
| `>= 100` (`QUIZ_BASE_IDX + qi`) | Kahoot-jang savollari | `quiz-0`, `quiz-1`, ... |
| `PRACTICE_DONE_BASE (500) + fromScreen` | Praktika "tugatdi" belgisi | `practice-<idx>` |

`liveAnswers(pin)` (indekssiz) faqat `<100`, `liveQuizAnswers(pin)` faqat `>=100` oladi.

---

## 4. 🔴 EKRAN ARXITEKTURASI — `SCREEN_META`, `screens[]`, indeks-maplar

```js
const SCREEN_META = [ { id, type, template, scored, scope }, ... ];      // metadata
const screens = [Screen0, ..., ScreenPodium, ScreenFlashcards, Screen16]; // komponentlar
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);
```

**Muqaddas qoida:** `SCREEN_META` va `screens[]` **bir xil tartibda va bir xil uzunlikda** bo'lishi shart (indeks = massivdagi o'rin). O'quvchi `submit_answer`da `p_screen = screen (massiv indeksi)` yuboradi; podium shu indeks bo'yicha o'qiydi.

### Indeks-kalitli maplar (ekran qo'shish/olib tashlaganda E'TIBOR!)
- `PRACTICE_AFTER = { <idx>: {task, starter} }` — praktika **shu ekrandan keyin** ochiladi (idx = `screens[]` o'rni).
- `Q_LABELS = { <idx>: "..." }` — podium "Savollar bo'yicha" yorliqlari (idx = scored ekran o'rni).
- `INLINE_KEYS` — id bo'yicha (indeksga bog'liq emas).

**Ekran QO'SHISH/OLIB TASHLASH retsepti:**
1. `SCREEN_META` va `screens[]` dan **ikkalasidan** bir xil o'rinda qo'sh/olib tashla.
2. O'zgargan o'rindan **keyingi** barcha indekslar suriladi → `PRACTICE_AFTER` va `Q_LABELS` kalitlarini yangila.
3. Agar qo'shilgan/olingan ekran `scored:true` bo'lsa: `INLINE_KEYS` va `Q_LABELS` dan ham id/kalitni yangila. `scope:'final'` yagona bo'lsa, olib tashlanganda baho umumiy nisbatga o'tadi (graceful).
4. Xavfsiz joy: **hamma indeks-kalit** o'zgarish nuqtasidan **kichik** bo'lsa (masalan oxirga yaqin non-scored ekran qo'shish) — hech qanday map o'zgarmaydi.
5. Build + jonli oqim sinovi (praktika to'g'ri ekrandan ochilyaptimi, podium ishlayaptimi).

> **Misol (bu sessiyada):** `s15` ("ismingizni sarlavha qiling") olib tashlandi — SCREEN_META+screens dan chiqarildi, `INLINE_KEYS`/`Q_LABELS` dan s15 olindi, `PRACTICE_AFTER` 16→15 (yakuniy praktika endi Debugging'dan keyin). `ScreenFlashcards` esa summarydan oldin qo'shildi (idx 17) — hamma kalit <17 bo'lgani uchun maplar o'zgarmadi. (Htmllesson2'da ham xuddi shu retsept bilan s15 olib tashlangan.)

### 4.1 STANDART DARS OQIMI (pedagogik skelet)

Har dars shu qolipda quriladi (HTML-1/HTML-2 tasdiqlangan):
```
s0  HOOK        — qiziqtirish: savol + tanlov (optionalLive)
s1  REJA        — "Bugun N qadam" + dars oxiridagi natija preview ("↩ Natijani ko'rish")
    ... SIKL (3-5 marta): EXPLORATION (1-3 ekran, animatsiya) → TEST (QuestionScreen) → ba'zisidan keyin PRAKTIKA (9.4)
    BUILDER     — "Buyruq bering — kod o'zi yaraladi" (AI-his, kamida 3 bo'lak)
    DEBUGGING   — AI/kod xatosini top va tuzat (nishon: debugger)
s15b PODIUM     — jonli reyting (🥇🥈🥉 + savollar statistikasi)
sflash FLASHCARD — takrorlash (jonlida faqat mentorga — 9.3)
s16 SUMMARY     — yakun (4.2)
```
- `LESSON_META.lessonId` formati: `<fan>-<NN>-v<versiya>` (masalan `html-02-v16`) — sessiya/localStorage shu kalitga bog'lanadi; katta kontent o'zgarishida versiya oshiriladi.
- Ekran tiplari SCREEN_META'da: `hook / rule / exploration / test / case / stats / review / summary`.

### 4.2 YAKUN SAHIFASI (summary) — standart tarkibi
Tartib bilan: **✓ Dars tugadi chip + sarlavha + ScoreRing** → **⚡ CodeStrike CTA** (studentWait/Solo/Live/mentor holatlari — 8-bo'lim) → **split: «Endi siz bilasiz» (RECAP) + «📝 Uyga vazifa» (HOMEWORK)** → **🏅 Nishonlar kolleksiyasi (X/4)**. Nav: «Qaytadan» (reset) + «Modulni yakunlash →» (finishLesson → payload: lessonId, nickname, ballar, davomiylik).

> ⚠️ **Kalit so'zlar (GLOSSARY) yakun sahifasida BO'LMAYDI.** Takrorlash uchun alohida **Flashcard** sahifasi bor (`ScreenFlashcards`, summarydan oldin) — glossary uni takrorlar, shuning uchun olib tashlangan. Yakun sahifasi Nishonlar kolleksiyasi bilan tugaydi. (`GLOSSARY` const va `open/setOpen` state ham Screen16'dan olib tashlangan; `.gloss*` CSS ishlatilmaydi.)

---

## 5. 🔴 `QuestionScreen` — javob berish logikasi

- `mountTs = useRef(Date.now())` — tezlik (savol ochilishidan bosishgacha; teng ballda hal qiladi).
- `firstCorrectRef` — **1-urinish qotiriladi**; qayta urinish bahoni oshirmaydi.
- `oneShot = !!(live && live.mode === 'student')` — jonli darsda bir urinish (xato bossa ham qulflanadi).
- Jonli javobda: `live.submitAnswer(screen, SCREEN_META[screen]?.id || 's'+screen, i, isCorrect, Date.now() - mountTs.current)`.

### 5.5 🟡 NavNext `optionalLive` — jonli darsda animatsiya MAJBURIY EMAS (freeRide)

Jonli darsda mentor animatsiya-mashqni **proyektorda o'zi ko'rsatadi** — har bir o'quvchini
bajarishga majburlash sinfni sekinlashtiradi va bolani mentordan orqada qoldiradi
(manba: `InternetLesson.jsx`).

```js
const NavNext = ({ disabled, label = 'Davom etish', onClick, optionalLive }) => {
  const gate = useContext(LiveGateCtx);
  const locked = !!(gate && gate.locked);
  const live = gate && gate.live;
  // Jonli dars DAVOMIDA (o'quvchi, sessiya tugamagan, mentor tirik) gate yumshaydi
  const freeRide = !!(optionalLive && live && live.mode === 'student' && live.status !== 'ended' && live.mentorAlive);
  // disabled={(freeRide ? false : disabled) || locked}
  // freeRide && disabled → yorliq majburlovchi matn o'rniga neytral "Davom etish"
```

**Qoidalar:**
- `optionalLive` **FAQAT animatsiya/mashq ekranlariga** beriladi: hook (1-sahifa tanlovi),
  exploration (bosib o'rganish, almashtirish, yurgizish), builder ("buyruq bering"),
  debugging (xato topish).
- ❌ **BERILMAYDI:** testlar (`QuestionScreen` — jonli ballda javob majburiy), yozma test
  ekranlari (input orqali javob), flashcard/podium/summary (ularda gate yo'q yoki o'zi ochiq).
- **Erkin rejimda avto-qaytadi:** sessiya "erkin qilingan" / mentor uzilgan / yakka o'qishda
  `freeRide=false` → gate yana majburiy. Alohida kod kerak emas — formula o'zi hal qiladi.
- `locked` (mentordan oldinga o'tolmaslik) bundan MUSTAQIL ishlaydi — freeRide uni bekor qilmaydi.
- Oqibat: freeRide'da bola bosqich-nishonini (10-bo'lim) o'tkazib yuborishi mumkin — me'yoriy;
  mashqni bajargan bola nishonini oladi.
- Holat: InternetLesson (11 ekran) · Htmllesson1 (9 ekran) · Htmllesson2 (11 ekran) ✅.

---

### 5.6 🟡 MAJBURIY: 📖 RECAPS — har scored test uchun «Qayta tushuntirish» kartalari

`RECAPS = {}` bo'sh qoldirish TAQIQLANADI — busiz test past chiqqanda mentorga «📖 Qayta tushuntirish»
tugmasi, xato qilgan o'quvchiga «Qisqa takrorlash» tugmasi UMUMAN chiqmaydi (infra ishlaydi, kontent yo'q).

```js
const RECAPS = {
  <scoredIdx>: {                    // kalit = scored ekranning screens[] indeksi (Q_LABELS bilan bir xil!)
    title: 'Mavzu nomi', cards: [   // har test uchun AYNAN 3 karta
      { ic: '🖼️',                   // katta emoji
        h: 'Bitta aniq g\'oya',      // sarlavha — bitta gap
        body: <>1–2 sodda gap, <b>muhim so'z</b> qalin, teglar <b className="mono">&lt;img&gt;</b> ko'rinishda</>,
        vis: <RcFlow items={['A', 'B', 'C']} />,  // ko'rgazma (ixtiyoriy, lekin tavsiya)
        ask: "Sinfga og'zaki savol?" },            // jonli muloqot (kamida 1-2 kartada)
    ]
  },
};
```
- Kontent — o'sha testdan OLDINGI nazariya ekranlaridagi metafora/misollar bilan BIR XIL bo'lsin
  (dars "uy" misolini ishlatsa, recap ham "uy" deydi — yangi metafora kiritilmaydi).
- `ask` — mentor proyektorda o'qib, sinf bilan og'zaki muloqot qiladi; backtick ISHLATILMAYDI
  (RecapOverlay `{card.ask}`ni oddiy matn qiladi, chip bo'lmaydi).
- Namuna: `InternetLesson.jsx` 1675-qator (5 test × 3 karta) · Htmllesson1/2 (4 × 3, 2026-07-08).
- ⚠️ String qiymatlarda apostrof bo'lsa — qo'shtirnoq: `h: "body — ko'rinadigan qism"` (aks holda build sinadi).
- Tekshiruv: `RECAPS` kalitlari `SCORED_IDX` bilan to'liq mos (har scored test uchun bittadan).

### 5.7 🔴 KAHOOT-REVEAL — jonli testda natija mentor ochguncha yashirin

Jonli darsda o'quvchi javob bosgach, to'g'ri/xato ekani DARHOL ko'rsatilmaydi — mentor
«🔓 Natijani ochish»ni bosganda proyektorda ham, BARCHA o'quvchi ekranida ham birdan ochiladi.

- **Server maydoni:** `live_sessions.reveal_screen` — mentor `reveal_screen` RPC bilan yozadi,
  o'quvchi pollingda `revealScreen` sifatida oladi (`syncQuiz` ichida).
- **Mentor:** `doReveal()` — optimistik `setMReveal(true)` + `live.mentorReveal(screen)`; sahifa
  yangilansa serverdagi `revealScreen === screen` dan qayta tiklanadi. Reveal'gacha variantlar
  proyektorda NEYTRAL (to'g'risi ajratilmaydi); NavNext `mReveal`gacha qulf («Avval natijani oching»).
- **O'quvchi:** javob qotadi (`oneShot`), kutish holati — ko'k neytral belgi (`option-wait`,
  `frame-wait`, «📨 Javobingiz qabul qilindi» + 1-bo'limdagi tinch matn). Natija ochilish formulasi:
  ```js
  const revealed = !oneShot || !!(live && (live.revealScreen === screen || live.mentorScreen > screen || live.status === 'ended' || !live.mentorAlive));
  ```
  (mentor keyingi sahifaga o'tsa / dars tugasa / mentor uzilsa — natija o'zi ochiladi, bola osilib qolmaydi).
- **MentorTestStats reveal'gacha:** faqat «javob berdi N/M» ko'rinadi — ✅/❌ soni va ustunlar yashirin
  («Natijani ochish»dan keyin chiqadi). Erkin/self rejimda reveal YO'Q — natija darhol ko'rinadi.

## 6. 🟡 `MentorTestStats` — «to'g'ri» sanog'i ustunlar bilan bir manbadan

Serverdagi (eskirishi mumkin) `a.correct`ga tayanmang — ustunlar bilan **bir xil mantiqdan**:
```js
const ok = data.rows.filter(a => a.picked === correctIdx).length;   // ✅ To'g'ri
// const ok = data.rows.filter(a => a.correct).length;              // ❌ ustunga zid chiqishi mumkin
```
Sabab: pastdagi ustunlar `picked === correctIdx` bilan chizadi. (Bu — "1 xato" statistika bugi tuzatuvi, 12-bo'limga qarang.)

---

## 7. 🔴 `ScreenPodium` — reyting
```js
.sort((x, y) => y.okCount - x.okCount || x.time - y.time); // to'g'ri ↓, teng bo'lsa vaqt ↑
```
`okCount = mine.filter(a => a.correct).length` — server-baholangan → **2-bo'lim kaliti yuklangan bo'lsagina to'g'ri**.

---

## 8. 🔴 CODESTRIKE ARENA (Kahoot-jang)

### 8.1 Ball formulasi (o'zgartirmang)
```js
const QUIZ_MS = 15000, QUIZ_BASE_IDX = 100;
const quizPts = (ms) => ms <= 500 ? 1000 : Math.max(0, Math.round(1000 * (1 - (Math.min(ms, QUIZ_MS) / QUIZ_MS) / 2)));
// quizScore: har to'g'ri javob quizPts + (streak>=2 ? 100 : 0); pts ↓, teng bo'lsa ok ↓
```
- Max 1000 ball (≤500ms), 15s oxirida to'g'ri javob 500. Streak (2+) → +100.
- **Standart hajm: 12 savol** (8.3 taqsimot 3/3/3/3 shunga mo'ljallangan), har biriga **15 soniya** (`QUIZ_MS = 15000` — 2026-07-09 "optimallashdi"da 20s→15s: CodeStrike=jang/tezlik hissi, L1 g'olib. ⚠️ L2/CssLesson1/CssLesson2'da hali 20000 — ko'chirish/keyingi ishlovda 15000 ga tushiriladi).
- `QUIZ_BANK` har elementida `{ q, opts, correct }` — `correct` **haqiqiy indeks** (kalitga kiradi).
- ⚠️ `quizScore` `a.correct`ga tayanadi → kalit yuklanmasa **0 0 0 0**.

### 8.2 CodeStrike brend dizayni (Htmllesson1 etaloni; eski nomi CoddyHoot — ishlatilmasin)
- **Nom:** arena brendi **"CodeStrike"** (`Code<span class="qz-wm-h">Strike</span>` wordmark), CTA: "⚡ CodeStrike jangi".
- **Ranglar:** issiq/moviy CoddyCamp muhiti (`#F0F4FC` fon, accent `#FF4F28`). `QUIZ_COLORS = ['#FF5A2C','#0FA6D6','#F5A623','#22A05C']` (coral/ocean/sun/leaf).
- **Chaqmoq mascot:** `QzBolt` (SVG: gradient kvadrat + oq chaqmoq + uchqunlar) — lobby/CTA/podium. ❌ boyqush (`QzOwl`) eskirdi.
- **Jonli fon:** `QzFX` canvas — suzuvchi uchqunlar + "web" chiziqlari + kod tokenlari. `QZ_BG_SHAPES` = kod tokenlari (`</>`, `{ }`, `href` ...).
- **Plitkalar:** glossy, shakl doirachada; `qz-` CSS to'liq CodeStrike uslubida.
- **Fon tokenlari DARS MAVZUSIDAN (majburiy):** `QZ_BG_SHAPES` (suzuvchi belgilar) va `QzFX` ichidagi `TOK` massivi aynan shu darsda o'rganilgan atamalardan tuziladi — bola arenada "kun bo'yi ko'rgan" so'zlari uchib yurganini his qiladi.
  Misollar: HTML-1 → `</>`, `<h1>`, `</ul>`, `href`, `<a>`, `<p>`; HTML-2 → `<img>`, `src=`, `alt`, `</form>`, `<input>`, `<header>`, `F12`; CSS → `color:`, `{ }`, `.class`; JS → `let`, `=>`, `git`/`commit` (Git darsi).

### 8.3 QUIZ_BANK javob taqsimoti — TENG (3/3/3/3)
Variantlar aralashtirilmaydi (shuffle yo'q) — shuning uchun to'g'ri javoblar 4 pozitsiya
o'rtasida **teng taqsimlanishi SHART** (12 savolda 3/3/3/3). Aks holda ziyrak bola naqshni
sezadi ("javob doim tepada") va o'qimasdan bosadi. Bitta pozitsiyada 0 ta to'g'ri javob = xato.
Tekshiruv:
```
sed -n '/const QUIZ_BANK = \[/,/^\];/p' <fayl> | grep -oE "correct: [0-9]" | sort | uniq -c
```
→ har raqamdan teng (12 savolda 3 tadan). Holat: Htmllesson1 ✅ 3/3/3/3 · Htmllesson2 ✅ 3/3/3/3.

### 8.4 🔴 JAVOB UZUNLIGI TENG — to'g'ri javob uzunligidan bilinмasin (naqsh #2)
Pozitsiya taqsimotidan (8.3) tashqari yana bir naqsh: **to'g'ri javob ko'pincha eng uzun/eng batafsil bo'lib qoladi** (yozuvchi to'g'risini to'liq, xatolarini qisqa yozadi). Ziyrak bola buni sezadi va **o'qimasdan eng uzun variantni** tanlaydi — to'g'ri chiqadi. Bu **inline testlarга ham (`QuestionScreen` `options`), arenaга ham (`QUIZ_BANK` `opts`)** tegishli.

**Qoida:** bitta savoldagi variantlar **taxminan bir xil uzunlikda** bo'lsin. To'g'ri javob boshqalaridan sezilarli uzun (yoki qisqa) bo'lib ajralib turmasin — barchasi bir xil "vazn"да. Xato variantlar ham to'liq, ishonarli yozilsin (qisqa-quruq emas); to'g'ri javob ham ortiqcha cho'zilmasin.
- ❌ To'g'ri: "`<a>` tegi havola yasaydi, `href` ichiga bosilganда ochiladigan manzil yoziladi" · Xatolar: "`<link>`", "`<url>`", "`<web>`" — to'g'risi 5× uzun → bola uzunidan taniydi.
- ✅ Hammasi tegсimon/qisqa yoki hammasi tushuntirishli — bir xil shakl.
- Mas'ul: 🎓 Metodist (variant matnlarини balanslaydi — `correct` indeks va POZITSIYAsiga TEGMAYDI); 🔍 Tekshiruvchi tekshiradi. Ko'z bilan: har savol variantlarини o'qib, to'g'risi uzunidan ajralib turmaganини tasdiqla.
- Holat: **Htmllesson1 ✅** (2026-07-09 audit — QUIZ_BANK Q6/Q9/Q10 balanslandi, inline testlar avvaldan teng).

---

## 9. 🟢 INTERAKTIV REUSABLE KOMPONENTLAR

Har biri **kontentdan ajratilgan** — boshqa darsga faqat ma'lumot almashtiriladi. Hammasi CodeStrike/CoddyCamp uslubida.

### 9.1 🧲 `DragDropOrder` — bo'laklarni to'g'ri tartibda joylash
- Props: `items` (to'g'ri tartibda [{id,label}]), `hints`, `onSolved`.
- **Yagona atomik holat** (`const [st, setSt] = useState({pool, slots})`) — setState ichida setState YO'Q (StrictMode dublikat bug'idan himoya).
- Sudrash: **asl chip DOM transform bilan** suriladi (state emas → pirillamaydi; `position:fixed` klon YO'Q → ekran pastida chiqmaydi). Tap ham ishlaydi.
- Namuna: skelet yig' (Screen5 ichida — `explored` bo'lgach sayt-preview o'rniga chiqadi).

### 9.2 🐞 `DebugChallenge` — buzuq kodni topib tuzatish (jonli preview bilan)
- Props: `lines` (bittasida `bug:true`), `fixed`, `explain`, `renderPreview(ok)`, `onSolved`.
- **Realga yaqin:** kod + JONLI preview yonma-yon. Buzuq preview boshidan xato ko'rinadi (masalan h1 yopilmagani uchun butun matn katta). Xato qator topilganda kod tuzaladi VA preview ko'z oldida to'g'rilanadi.
- Namuna: page 16 "Debugging" (Screen13) — AI kod yozgan, xatoni top.

### 9.3 🃏 `Flashcards` — aktiv takrorlash (3D flip + spaced recall)
- Props: `cards` [{front, back, note}].
- 3D flip (`transform-style: preserve-3d; rotateY(180deg)`), "Bildim"/"Takrorlash" (takrorlash kartasi navbat oxiriga → spaced recall), progress bar, yakun ("🎉 Hammasini bilasiz!").
- **Quizlet uslubidagi baholash (majburiy ko'rinish):**
  - Tugmalar: `✗ Takrorlash` — qizil (accent hoshiya/matn), `✓ Bildim` — yashil to'ldirilgan;
  - Bosilganda karta rangli **muhr** bilan uchib ketadi: ✓ yashil doira + o'ngga (`fc-out-knew`), ✗ qizil doira + chapga (`fc-out-again`); yangi karta pastdan kirib keladi (`fc-in`, `swapRef` kaliti bilan remount);
  - Tepada ikkita jonli **hisoblagich-pill**: `↻ O'rganilmoqda · N` (qizil-soft) va `✓ Bildim · N` (yashil-soft) — qiymat o'zgarganda pop animatsiya (`fc-pill-pop`);
  - Animatsiya davomida (`exiting`) tugmalar va flip qulflanadi — ikki marta bosish bug'i yo'q.
- **Alohida sahifada** (`ScreenFlashcards`, summarydan oldin) + deck/taxlam effekti (`.fc-cardwrap::before/::after`).
- **Jonli darsda FAQAT MENTORGA** — mentor proyektorda kartalarni ochib sinf bilan JAMOAVIY takrorlaydi ("qaysi teg?" — sinf javob beradi, karta ag'dariladi); jonli o'quvchidan yashirin. Mentor «Erkin qilish» qilgach (yoki uzilsa / yakka o'qishda) o'quvchilarga ham ochiladi — bola orqaga bosib kiradi va individual takrorlaydi.

  | Kim / qachon | Flashcard |
  |---|---|
  | 🧑‍🏫 Mentor, jonli dars payti | **Ko'rinadi** — podiumdan keyin proyektorda ochadi |
  | 👨‍🎓 O'quvchi, jonli dars payti | Ko'rinmaydi (sakrab o'tiladi) |
  | 👨‍🎓 O'quvchi, «🔓 Erkin qilish»dan keyin / mentor uzilsa | **Ko'rinadi** — orqaga bosib kiradi |
  | Yakka o'qish (self) | Doim ko'rinadi |

  Nega shunday: jamoaviy takrorlash (xor usuli) CodeStrike jangidan oldin miyani "isitadi"; individual spaced recall esa erkin rejimda o'z tezligida qoladi. Ballga ta'siri nol (`scored:false`, nishon bog'lanmagan). Navigatsiya darajasida sakrab o'tiladi (komponent ichida emas — orqaga qaytishda ham ishlashi uchun):
  ```js
  const FLASH_IDX = SCREEN_META.findIndex(m => m.id === 'sflash');
  const flashHidden = () =>
    live.mode === 'student' && live.status !== 'ended' && live.mentorAlive; // faqat jonli o'quvchidan yashirin
  // advance(): n === FLASH_IDX && flashHidden() → n+1;  prev(): → n-1
  ```
  Yon ta'sir (me'yoriy): mentor flashcardda turganida o'quvchi podiumdan keyingi sahifaga (yakun) o'tib olishi mumkin — u yerda CodeStrike CTA baribir «⏳ Mentorni kuting» holatida turadi, sinxronlik buzilmaydi.
- **Flashcardga nishon berilmaydi** — ekran jonli o'quvchidan yashirin, unga bog'langan nishonni jonli o'quvchi dars davomida ololmaydi (10-bo'limdagi taqiq).

### 9.4 ✍️ PRAKTIKA — HtmlCompiler qatlami (student/self/mentor oqimlari)

> 🔴 **SONI: AYNAN 3 praktika-compiler** (2026-07-09 qaror). 4–5 ta EMAS — dars mavzusining eng kerakli/muhim **3 tasi** olinadi (`PRACTICE_AFTER` uch kalit). Ko'p praktika darsni cho'zadi va charchatadi. Har biri boshqacha ko'nikmani mustahkamlasin (takror emas). Tekshiruv: `sed -n '/const PRACTICE_AFTER = {/,/};/p' <fayl> | grep -cE "^\s*[0-9]+:"` → **3**. (✅ 2026-07-09: L1=Sarlavha+Havola+Yakuniy, L2=Rasm+Forma+Yakuniy, CssLesson1=3 — hammasi 3.)

**Komponent:** `HtmlCompiler({ task, starterCode, onContinue, onBack })` — chapda topshiriq
paneli (shartlar ro'yxati, har birida hint), o'ngda kod maydoni + jonli iframe preview.

**Topshiriq shakli:**
```js
const TASK_X = {
  eyebrow: 'Praktika · mavzu', title: "...", brief: "...",
  requirements: [ { id, label, check: C.attr('img','src', "hint...") }, ... ],
};
const STARTER_X = `<!-- Bu yerga yozing -->\n`;
```
- Shartlar `C.*` bilan **haqiqiy DOM tahlili** (regex emas): `C.has / C.text / C.attr / C.attrs / C.nested / C.count / C.toggle`; **CSS uchun** `C.cssProp(sel, prop)` (xossa bor) / `C.cssValue(sel, prop, val)` (aniq qiymat).
- 🔴 **`parseCss` QISQA XOSSALARni topsin (2026-07-09 bug):** `parseCss` CSSOM ishlatadi — brauzer qisqa xossalarni **longhandga yoyadi** (`gap`→`row-gap`/`column-gap`, `padding`/`margin`→4 tomon, `flex`→3 qism...). Enumeratsiyada faqat longhand chiqadi → `props['gap']` bo'sh → `C.cssProp('.row','gap')` **topa olmaydi** (o'quvchi `gap: 15px` yozsa ham "1/2"). Tuzatish: `parseCss` map ичida qisqa xossalar ro'yxatini `getPropertyValue(sh)` bilan `props`ga qo'sh. **Har CSS praktika sharti — o'quvchi yozadigan har xossa (ayniqsa gap/padding/margin/border) uchun compilator TAYYOR bo'lsin** (qo'lда: har `TASK_*` shartini kompilatorда sinab, to'g'ri yechim ✅ o'tishini tekshir). `C.cssProp` (aniq qiymat emas) ishlatilsin — masalan `gap` uchun `12px`ni majburlaMA.
- **Material HTML — KO'P QATORDA, chekinish bilan** (2026-07-09): index.html material bir uzun qatorда bo'lmasin (o'ngga chiqib ketadi, o'qib bo'lmaydi). Ichma-ich elementlar `\n` + 2-bo'sh chekinish bilan. ❌ `<div class="row"><span>A</span><span>B</span><span>C</span></div>` → ✅ `<div class="row">\n  <span>A</span>\n  <span>B</span>\n  <span>C</span>\n</div>`.
- **CSS praktikasi (2 fayl):** `task.files = [{name:'index.html', lang:'html', starter:'<h1>...</h1>'}, {name:'style.css', lang:'css', starter:'/* Bu yerga yozing */\\n'}]`. index.html — bezaladigan **material** (11.9 tegmaydi, chunki o'quvchi HTML yozmaydi); style.css — o'quvchi yozadigan joy, starter FAQAT `/* Bu yerga yozing */`. Ko'rinish uchun material'ga inline `style="background:..."` berish mumkin (padding/margin ko'rinsin). Namuna: CssLesson1 TASK_COLOR/TASK_TEXT/TASK_BOX (2026-07-08).
- Starter qoidasi (11.9, MAJBURIY): kod maydonida FAQAT `<!-- Bu yerga yozing -->` (yoki CSS'da `/* Bu yerga yozing */`) komment — tayyor teg/matn/ko'rsatma YO'Q; nimani yozish chap paneldagi shartlarda.
- **Pedagogik tartib (MAJBURIY):** praktika shartlari FAQAT shu ekranga qadar O'TILGAN teglarni so'raydi. Hali o'tilmagan teg so'ralmaydi (masalan, sarlavha praktikasida `<p>` so'rash — XATO, chunki `p` keyinroq o'tiladi; o'rniga h1/h2/h6 — narvon mustahkamlanadi). Tekshiruv: har `TASK_*.requirements`dagi teglar dars oqimida praktikadan OLDIN kelgan ekranlarda o'rgatilganini solishtirib chiqing.
- Preview himoyalari (11.4/11.5): `li:empty{display:none}`, `<base target="_blank">`, iframe `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`.

**Handoff xaritasi va oqimlar:**
```js
const PRACTICE_AFTER = { <screenIdx>: { task, starter }, ... }; // shu ekrandan KEYIN ochiladi
const next = () => {
  const entry = PRACTICE_AFTER[screen];
  if (!entry) { advance(); return; }
  if (live && live.mode === 'mentor') { setMentorPractice({ ...entry, fromScreen: screen }); advance(); }
  else runPractice(entry, screen);
};
const runPractice = (entry, fromScreen) => {
  const done = () => {
    // 🔴 praktika "tugatdim" signali — mentor paneli shu yozuvni sanaydi (3-bo'lim: 500+)
    if (live && live.mode === 'student') live.submitAnswer(PRACTICE_DONE_BASE + fromScreen, `practice-${fromScreen}`, 0, true, 0);
    setPractice(null); advance();
  };
  if (typeof onPractice === 'function') Promise.resolve(onPractice(entry.task)).then(done); // production: LMS
  else setPractice({ ...entry, done });                                                     // lokal: overlay
};
```
- **O'quvchi / self:** "Praktika →" → compilator overlay → shartlar bajarilgach `done()` → signal + keyingi ekran.
- **Jonli mentor:** o'zi compilator ochmaydi — `MentorPracticeOverlay` paneli chiqadi:
  1. *watch* ko'rinishi: «👨‍🎓 Praktikani tugatdi» jonli chiplar («✏️ Ali» → «✓ Ali»), «Tugatdi: N/M» progress, 3s polling `liveAnswers(pin, 500+fromScreen)`;
  2. «🖊 Doskada yozib ko'rsatish» → *demo*: mentor AYNAN shu mashqni proyektorda compilatorda yechib beradi;
  3. «Keyingi mavzuga →» panelni yopadi.
- `reset()` da `setMentorPractice(null)` ham tozalanadi. CSS: `mp-*` klasslar (overlay, card, flow, demo/next tugmalar).
- ❌ Xato: `runPractice(entry)` fromScreen'siz (signal yo'q → mentor panel bo'sh) yoki mentor uchun ham overlay ochish.

---

## 10. 🏅 BADGES (nishonlar) tizimi

> **Nomlash (2026-07-09):** yuqori panel **popover sarlavhasi + tugma aria/title = "Badges"** (inglizcha). ❌ "Achievements" ham, ❌ "🏅 Nishonlar" ham noto'g'ri (popover joyида). Ammo **yakun sahifasi** «🏅 Nishonlaringiz», **bayram** «🏅 Nishon ochildi!», **onboarding** «Nishonlaringiz» — O'ZBEKCHA qoladi (namuna: Htmllesson1). **Nishon NOMLARI (`ACHIEVEMENTS.name`) — inglizcha o'yin-nom** ("Built It!"/"Nice Catch!"/"Level Up!"), o'zbekcha tavsifiy EMAS (❌ "Sahifa quruvchi" — L2'даги eski uslub). Ichki KOD identifikatorlari o'zgarmaydi (`ACHIEVEMENTS`, `AchCtx`, `.acu-*`). Tekshiruv: `grep -n '"Achievements"\|Achievements —\|🏅 Nishonlar —'` — o'quvchi ko'radigan popover joyида bo'sh (faqat `🏅 Badges —`). ⚠️ **Htmllesson2 hozir ESKIRGAN** (o'zbekcha nom + "Nishonlar" popover) — standartga o'tkazilishi kerak.

3 qatlamli, ko'rinadigan:
1. **🎉 TO'LIQ-EKRAN BAYRAM** (`AchCelebrate`, o'yin uslubi — MAJBURIY, kichik toast EMAS): nishon olinganда butun ekran bo'ylab — spotlight fon + aylanuvchi oltin nur burjlari (`.acu-rays`, conic-gradient, masklangan) + markaziy pulslovchi yorug'lik + ikki zarba to'lqini (`.acu-ring`) + oltin medalyon (emoji, bounce bilan sakrab kiradi + suzadi + shine yugurib o'tadi) + ~14 uchqun radial otiladi (`.acu-spark`, `--a` burchak) + matn ("🏅 Nishon ochildi!" + `name` katta serif + `desc`) ketma-ket ko'tariladi. ~4s, bosib yopiladi, `prefers-reduced-motion` tinch varianti. **Navbatda bittalab** (`AchToasts` faqat `toasts[0]`ni ko'rsatadi — bir nechta nishon ketma-ket). CSS: `.acu-*` blok.
2. **Hisoblagich** — har sahifada "🏅 X/4" (Stage header, progress yonida), yangisida **pulslaydi** (bump); bosilsa popover.
3. **Kolleksiya** — dars oxirida (Screen16) barcha nishonlar (olingan=rangli+tavsif, olinmagan=🔒).

**Arxitektura:**
```js
const ACHIEVEMENTS = { skelet:{icon,name,desc}, firsttag, debugger, graduate }; // AYNAN 4 ta
// name — QISQA, O'YIN USLUBIDAGI INGLIZCHA nom (1-3 so'z, ko'pincha "!" bilan). desc — o'zbekcha, siz-formada nima qilgani.
// ✅ name: "Built It!", "Tag It!", "Nice Catch!", "Level Up!"  ·  desc: "Sahifa skeletini o'zingiz yig'dingiz"
// ❌ name uzun/rasmiy ("HTML bitiruvchisi", "Skelet ustasi") yoki desc inglizcha. Bola o'yindagidek qisqa, quvnoq nom ko'radi.
// Kategoriya→nom uslubi (nishonlar.png): qurish→"Built It!" · birinchi teg→"Tag It!"/"First!" · xato→"Nice Catch!"/"Fixed!" · yakun→"Level Up!"/"Done!"/"Pro!" · xatosiz→"Perfect!"/"On Fire 🔥" · flashcard→"Fast Brain"/"Sharp!"
const ACH_TRIGGERS = { s5:'skelet', s7:'firsttag', s13:'debugger' }; // ekran id → nishon
const AchCtx = createContext(null); // earned Set — Stage hisoblagichi o'qiydi
```
- **Soni: 4 ta** (3 ta dars-bosqich nishoni + `graduate`). Ko'p nishon qiymatini tushiradi, kolleksiyada 🔒lar qolib ketadi.
- **Hammasi darsni oxirigacha o'tgan bolada REAL ochilsin.** ❌ taqiq: jonli darsda yashirin ekranga bog'langan nishon (flashcard — jonli o'quvchi hech qachon ololmaydi) va "100% to'g'ri" (ace) kabi ko'pchilik bajarolmaydigan shart — ikkalasi kolleksiyada doim 🔒 bo'lib turadi.
- Markazlashgan trigger: `recordAnswer` da `if (ACH_TRIGGERS[_m.id] && data.correct) earn(...)`; yakuniy ekranda `earn('graduate')`.
- 🔴 **ACH_TRIGGERS faqat MA'NOLI ekranga bog'lanadi** (2026-07-09 CssLesson2 bug): SCORED test (`type:'test'` — `correct` = to'g'ri javob) yoki haqiqiy challenge (DragDrop/Debug). ❌ **Exploration/toggle ekranга (masalan flex-direction almashtirish) BOG'LANMAYDI** — u yerda `onAnswer({correct:true})` har bosishda yonadi → nishon **tekin** beriladi (o'quvchi bilmasdan «Davom etish» bossa ham oladi). Nishon "biror narsa evaziga" — real ko'nikma ko'rsatilganda ochilsin. Tekshiruv: har `ACH_TRIGGERS` kaliti SCREEN_META'da `type:'test'` yoki challenge ekaniga qara.
- `earn` **`earnedRef` bilan StrictMode-safe** (setState ichida setState emas).
- `AchCtx.Provider value={earned}` root'da; `<Current ... achievements={earned} />`; `<AchToasts .../>` root'da.
- Boshqa darsga: `ACHIEVEMENTS` + `ACH_TRIGGERS` o'sha darsning bosqichlariga moslanadi.

---

## 11. ⚪ UI TO'G'RILIGI

| # | Qoida | To'g'ri |
|---|---|---|
| 11.1 | 🟡 **Mentor avatari — HOSTLANGAN RASM** (standart, 2026-07-09 qaror) | `<div className="mentor-ava"><img src={MENTOR_IMG} alt="" /></div>` · `const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png'` · CSS: `.mentor-ava{width:40px;height:40px;border-radius:50%;overflow:hidden}` + `.mentor-ava img{width:100%;height:100%;object-fit:cover}`. ❌ emoji 🧑‍🏫 endi ESKI |
| 11.1b | 🟡 **O'quvchi (profil) — qizcha RASMI** (doira) | `PHOTO_SET.profil = { ..., img:'https://go.coddycamp.uz/uploads/media_library/58ebafabd92e2e3a80d86b7bb7e88eda.png', round:true }` — o'quvchi/profil ko'rsatiladigan joyda (1-2 sahifa, natija mockup). Barcha darsда BIR XIL mentor+qizcha (brend izchilligi) |
| 11.2 | h1 natija ko'rinishi qalin | `.pv-h1 { font-weight: 700; ... }` |
| 11.3 | `<p>` tavsifi tushunarli | "matn (paragraf)" (❌ "xatboshi") |
| 11.4 | Bo'sh `<li>` ortiqcha nuqta bermasin | `li:empty{display:none}` (preview CSS) |
| 11.5 | Preview'da havola yangi tabda ochilsin | `<base target="_blank">` + iframe sandbox `allow-popups allow-popups-to-escape-sandbox` |
| 11.6 | **Rang semantikasi:** qizil/accent fon FAQAT xato-ogohlantirish uchun | Xulosa, maslahat, "Sizning loyihangiz" bloklari — yashil `frame-success` (`successSoft` fon + `success` chap chiziq). ❌ `frame-soft`/`accentSoft` bunday joyda — o'quvchi "xato qildim" deb o'ylaydi |
| 11.7 | **Bosiladigan joylar ko'rinsin:** ko'p qismli "bosib o'rgan" ekranlarda | Yo'riqnoma + jonli hisoblagich ("👆 4 ta qismni bosing — 2/4"), bosilmaganlari pulsatsiya (`tap-hint` animatsiya), bosilganlari ✓ belgi |
| 11.8 | **Kod atamalari testlarda chip bilan:** teg/atribut nomlari oddiy matndan ajralib tursin | Savol, variant va izoh satrlarida atama backtick bilan belgilanadi (`` `strong` ``, `` `href` ``, `` `type="email"` ``), `fmtCode()` helper uni `.qcode` mono-chipga aylantiradi. Render joylari: variant tugmasi, izoh matni, "To'g'ri javob: …" satri, arena savoli/plitkalari. Arena plitkasida oq variant: `.qz-tile .qcode` |
| 11.9 | 🟡 **MAJBURIY: Compilator starteri = FAQAT `<!-- Bu yerga yozing -->` — boshqa HECH NARSA** | Barcha praktikada (shu jumladan DEFAULT_FILES va STARTER_FINAL) starter faqat shu bitta kommentdan iborat. ❌ Tayyor teg (`<h1>`, `<a href="">`, `<header>`...), namuna matn, ko'rsatma-gap — hech biri yozilmaydi. Nimani yozish chap paneldagi shartlar ro'yxatida (har shartda o'z hinti). Tekshiruv: har `STARTER_*` va `DEFAULT_FILES` starteri `<!-- Bu yerga yozing -->` + bo'sh qatordan boshqa narsa saqlamaydi |
| 11.10 | **Preview'larda real rasm** (builder, debugging, natija mockuplari) | Emoji-placeholder (🧑‍🚀) EMAS — `PHOTO_SET`dagi LMS media library URL'lari (tog'/mushuk/raketa). Kod namunasi rasm bilan MOS bo'lsin: kodda `src="tog.jpg"` → preview'da tog' rasmi |
| 11.11 | 🟡 **MAJBURIY: Layout kengligi + avto-zoom — BARCHA darslar AYNAN shu o'lchamda, istisno yo'q** | `.stage { max-width: 1100px; height: calc(100dvh / var(--lz, 1)) }` · Stage'da `padH = isMobile ? 12 : 60` · `.lesson-root`da `zoom: var(--lz, 1); height: calc(100dvh / var(--lz, 1))` · lesson root'da `--lz` effekti (15-F retsept). ❌ 936px / padH 100 / boshqa har qanday kenglik — RAD ETILADI (eski tor layout). LiveGate `wrap`da ham `minHeight: 'calc(100dvh / var(--lz, 1))'`. Tekshiruv: `grep -n 'max-width: 1100px' <fayl>` — chiqishi SHART; `grep -n 'max-width: 936px'` — bo'sh bo'lishi SHART |

| 11.12 | **Kod namunalarida identifikatorlar INGLIZCHA** | Ekranda ko'rsatiladigan kodda class/id/o'zgaruvchi nomlari inglizcha yoziladi: ✅ `class="card"` ❌ `class="karta"`. Sabab: real dasturlashda nomlar inglizcha — bola boshidan to'g'ri odat oladi. Izoh/kontent matni o'zbekcha qolaveradi |
| 11.13 | 🟢 **Vosita ekranlarida "haqiqiy hayotda sinang" bloki** | DevTools/terminal kabi VOSITA o'rgatilgan ekranda mashq tugagach yashil blok: real misolda sinash taklifi («🌐 Istalgan saytni oching (masalan, kun.uz), F12 bosing...») — mentor proyektorda jonli ko'rsatadi, o'quvchi uyda takrorlaydi. Audio/Mentor matniga ham jumla qo'shiladi |
| 11.14 | 🟡 **👋 ONBOARDING — real coach-mark spotlight tur** (`TourGuide`, modal EMAS) | Rejim tanlangач (500ms kechikish bilan) rolga qarab HAQIQIY tugmalarni birma-bir yoritadi: har qadam `[data-tour="..."]` elementni topadi (`getBoundingClientRect`), atrofini spotlight bilan yoritadi (`.tg-hole` box-shadow 9999px), yoniga callout (ikonka+sarlavha+matn+«Keyingisi»). **learner** (self/student): next→mentor→progress→ach. **mentor**: live(PIN)→next→progress. Elementlarga `data-tour="next|mentor|progress|ach|live"` qo'yiladi. 🔴 **Mentor'da katta PIN (`LiveBigCode`) AVTOMATIK OCHILMAYDI — faqat «📺 Ko'rsatish» tugmasi bilan** (`bigOpen` useState `false`; auto-open `useEffect` YO'Q). Aks holda mentor kirishi bilanoq katta PIN ochilib, onboarding tur ortida qolgan kichik `data-tour="live"` badge'ni yoritadi → spotlight **qorong'u ustida BO'SH** chiqadi (2026-07-09 CssLesson2 bug, namuna L1 LiveBadge 1162-q izohi). `localStorage hcOnboarded_<role>`. CSS: `.tg-*`. ❌ eski modal (`.ob-*`, `OnboardingOverlay`) — olib tashlangan |
| 11.15 | 🟡 **Jonli panel (LiveBadge) xira → hover'da tiniq** | Tepadagi mentor/o'quvchi paneli kontentni to'smasin: `.live-badge { opacity: 0.4 }` (odatda xira, ortidagi matn ko'rinadi) → `:hover/:focus-within { opacity: 1 }` (tiniqlashadi). Sensorli qurilmada `@media (hover:none) { opacity: 0.62 }`. Barcha 6 badge holatiga `className="live-badge"` |
| 11.16 | 🟡 **Arenada o'quvchining O'Z bali YASHIL** (qizil emas) | CodeStrike/podiumda o'quvchining o'zi (`.me`) rag'batlantiruvchi yashil bilan belgilanadi, accent-qizil EMAS: `.qz-brow.me` (bg+outline yashil), `.qz-brow.me .qz-brank` `#12A968`, `.qz-pod-col.me .qz-pod-name` `#12A968`, `.qz-mypl b` `#12A968`; ScreenPodium ham: `.pod-row.me` `successSoft`, `.pod-col.me .pod-name`+`.pod-my b` `T.success`. Qizil faqat XATO javob (`.qz-res.bad`, `.qz-tile.lose`) uchun qoladi |

> 11.2–11.5 faqat HTML-kod praktikasi (iframe preview) bor darslarga tegishli.
>
> **✅ HAL QILINDI — mentor avatari (11.1, 2026-07-09):** foydalanuvchi qaror qildi — **hostlangan RASM standart** (emoji emas). Mentor = `MENTOR_IMG`, o'quvchi/profil = `PHOTO_SET.profil` qizcha rasmi (`round:true`). Namuna: `Htmllesson2.jsx` (1908/1928-qatorlar). **Barcha darsга tarqatiladi** (🎨 Dizayn roli qo'shadi) — har darsda BIR XIL mentor+qizcha, brend izchilligi. Eslatma: CssLesson1'da avval emojiga qaytarilgan edi — endi qayta rasmga o'tkaziladi.

---

## 12. 🐛 MA'LUM BUGLAR TARIXI (qaytarilmasin!)

| Bug | Belgi | Sabab | Tuzatish |
|---|---|---|---|
| **Kalit yuklanmaydi** | Podium 0/5, arena 0 0 0 0 | `useLiveSession(lessonId)` `answerKey`ni tashlaydi; `set_quiz_keys` yo'q | 2.1 + 2.2 |
| **Mentor stats "1 xato"** | To'g'ri javob "xato" sanaladi (ustunga zid) | Sanoq eskirgan `a.correct`ga tayanadi | 6-bo'lim (`picked === correctIdx`) |
| **DragDrop dublikat** | Chiplar o'nlab ko'payib ketadi | setState ichida setState (StrictMode 2x) | 9.1 (yagona atomik holat) |
| **Drag pirillash/pozitsiya** | Klon ekran pastida, titraydi | `position:fixed` klon transformlangan ajdod ichida | 9.1 (asl chip DOM transform) |
| **`<li/>` ortiqcha nuqta** | Preview'da bo'sh nuqta | Brauzer `<li/>` ni bo'sh li deb o'qiydi | 11.4 |
| **Havola oq oyna** | Link bosilganda oq ekran | iframe sandbox link'ni o'zi ochadi (X-Frame) | 11.5 |
| **Kirill aralashuvi** | Lotin so'zda begona harf | Tasodifiy kirill kiritish | 1-bo'lim (grep + lotinlashtirish) |
| **Sen-forma murojaat** | "Topding", "yozding", "o'zing" | Nishon/xulosa matnlari sen-formada yozilgan | 1-bo'lim (grep + siz-forma) |
| **Matn ↔ tugma nomi mos emas** | «"Sayt" tugmasini bosing» — lekin kodni "Kod" tugmasi ochadi | Matn yozilgach UI o'zgargan/tekshirilmagan | 1-bo'lim (matn ↔ UI mosligi) |
| **Qizil fon xato bo'lmagan joyda** | "Sizning loyihangiz", ul/ol xulosasi qizil fonda | `frame-soft`/`accentSoft` hamma info-blokka qo'yilgan | 11.6 (`frame-success`) |
| **Zerikarli/rasmiy nishon nomlari** | "Skelet ustasi", "HTML qahramoni" | Uzun o'zbekcha nom — o'yin his'i yo'q | 10-bo'lim (qisqa inglizcha "Built It!"/"Level Up!" + o'zbekcha desc) |
| **Bosiladigan joylar noaniq** | O'quvchi skelet ekranida nimani bosishni bilmaydi | Interaktiv qismlarda affordance yo'q | 11.7 (yo'riqnoma+pulsatsiya+✓) |
| **Aralash apostrof** | Manbada `to’liq` (U+2019), `to‘g‘ri` (U+2018) — qolgan matn `'` bilan | Matn terishda tashqi klaviatura/avtokorrekt | 1-bo'lim (`grep -n "[‘’ʻ]"` → bo'sh) |
| **Tugma nomi qisman yangilangan** | "Ishga tushir" → "Ishga tushirish" qilinganda bitta tugma (Brauzer) qolib ketgan; audio/mentor matni eski nomni aytadi | Qidiruv faqat bitta yozilishda qilingan | 1-bo'lim (tugma + matn + audio birga; grep bilan barcha variantlar) |
| **Starterda tayyor kod** | Praktika ochilganda ba'zi shartlar oldindan ✓; o'quvchi o'zi yozmaydi | `STARTER_*`ga namuna teg/matn/ko'rsatma qo'shilgan | 11.9 (faqat `<!-- Bu yerga yozing -->`) |
| **"Sirli" kutish matni** | «To'g'rimi-xatomi — hozircha sir! 🤫» — bola tushunmaydi/bezovta | Kahoot-reveal kutish matni dramatik yozilgan | 1-bo'lim ("sir"-uslub taqiqi) + 15-G |
| **Apostrof tuzatishda build sinishi** | `Expected ")" but found ...` — esbuild yiqiladi | Qiyshiq apostrof single-quoted JS string ichida oddiy `'` bilan almashtirilgan | 15-G (`\'` escape) yoki stringni qo'shtirnoqqa o'tkazish |

---

## 13. 🔍 AUDIT — HOLAT (2026-07-08, 25 fayl skanerlandi)

**To'liq etalon (namuna):** `Htmllesson1` ✅ · `Htmllesson2` ✅ · `CssLesson1` ✅ (2026-07-08, birinchi to'liq ko'chirilgan — 7 qatlam + DragDrop + CSS praktika-compiler) — qolgan darslar SHU uchtaning ko'rinishiga o'tkaziladi.
**Htmllesson1 qo'shimcha (2026-07-08):** onboarding (11.14) · to'liq-ekran nishon bayrami (10) · inglizcha nishon nomlari (10) · xira LiveBadge (11.15) · matn-audit (MATN_ETALONI 9-jadval). Bular boshqa darslarga ham tarqatiladi.

**Hamma darsda ALLAQACHON bor (tekshirilgan):** set_quiz_keys jonli-ball (2.x) · layout 1100px + `--lz` avto-zoom (11.11) ·
Kahoot-reveal `reveal_screen` · RecapOverlay · optionalLive/freeRide (5.5) · QuizArena (lekin ESKI ko'rinishda).

**21 darsda YETISHMAYDI (ko'chiriladigan qatlam):**
| # | Nima | Etalon bo'limi | Holat |
|---|---|---|---|
| 1 | CodeStrike brend arenasi (QzBolt, QzFX, yorug' fon, brend ranglar) | 8.2 | hamma joyda eski ⚔️ ko'rinish |
| 2 | 🃏 Flashcards ekrani (summarydan oldin, jonlida faqat mentorga) | 9.3 | hech birida yo'q |
| 3 | 🏅 Badges (4 nishon + toast + hisoblagich + kolleksiya) | 10 | hech birida yo'q |
| 4 | fmtCode kod-atama chiplari (savol/variant/izoh/arena) | 11.8 / 15-D | hech birida yo'q |
| 5 | Praktika qatlami (compilator + MentorPracticeOverlay + 500+ signal) | 9.4 | hech birida yo'q (mavzuga qarab) |
| 6 | DragDrop / DebugChallenge interaktivlari | 9.1 / 9.2 | hech birida yo'q (mavzuga qarab) |
| 7 | QUIZ_BANK 3/3/3/3 taqsimoti tekshiruvi | 8.3 | tekshirilmagan |
| 8 | TIL: qiyshiq apostrof (2–56 ta/fayl!), "hozircha sir 🤫" (har birida 2), ba'zida sansirash | 1 | hammasida bor |
| 9 | 📖 RECAPS kontenti (testdagi «Qayta tushuntirish» kartalari) | 5.6 | Htmllesson1/2 ✅ (2026-07-08, 4×3 karta) · InternetLesson/PmLesson1/butun 2-Modull ✅ · **qolgan 1-Modull (Css1/2, Git, Deploy, PM2/3) bo'sh `{}`** — ko'chirishda to'ldiriladi |

**TIL nuqsonlari batafsil (2026-07-08 skaneri):** apostrof eng ko'p — HtmlPractice (56), JsVars (52), CssLesson1 (36),
CssLesson2 (33), JsIntro (31); kirill qatorlari — PmLesson5 (2), PmLesson6 (1), PracticeLesson2 (1);
sansirash namunasi — CssLesson1 "o'rganding". ⚠️ Apostrof tuzatishda EHTIYOT: ko'pi single-quoted JS string
ichida — oddiy `'` bilan almashtirsa string buziladi, `\'` escape ishlatiladi (15-G).

**Maxsus fayllar:** `CssPractice.jsx`, `HtmlPractice.jsx` — jonli qatlamsiz alohida praktika sahifalari
(936px ham emas, infra yo'q) — alohida ko'rib chiqiladi (ehtimol darslarning ichki compilatoriga birlashadi).
`PmLesson1`/`PeanStack` QUIZ_BANK=15 savol (etalon 12) — ko'chirishda 12 ta eng yaxshisi qoladi yoki 15 ligicha
qoldirish to'g'risida foydalanuvchidan so'raladi.

**KO'CHIRISH TARTIBI (modul oqimi bo'yicha, har biri alohida sessiya-qadam):** (1. `CssLesson1` ✅ TUGADI)
2. `CssLesson2` → 3. `GitLesson` → 4. `DeployLesson` → 5. `PmLesson2` → 6. `PmLesson3`
→ 7. `JsIntroLesson` → 8. `JsVarsLesson` → 9. `JsConditionsLesson` → 10. `JsLoopsLesson` → 11. `JsFunctionsLesson`
→ 12. `PeanStackLesson` → 13. `PmLesson4` → 14. `PmLesson5` → 15. `PmLesson6` → 16–19. `PracticeLesson1–4`
→ 20. `PmLesson1` + `InternetLesson` (faqat qolgan interaktiv qatlam; til 2026-07-08 tozalangan).

**Har dars uchun ko'chirish retsepti:** 15-C (interaktiv qatlam L1'dan) + 15-D (fmtCode) + 15-G (til tozalash) + MATN_ETALONI matn-auditi
+ 5.6 RECAPS to'ldirish (bo'sh bo'lsa) + 8.2 arena brendi + 8.3 taqsimot + 9.3 flashcard kontenti (12 karta, mavzudan)
+ 10 nishonlar (4 ta, real bosqichlardan) + **inglizcha o'yin-nom** (Nice Catch!/Level Up! bir xil) + **to'liq-ekran bayram `.acu-*`**
+ 11.12 inglizcha class nomlari + **11.14 onboarding (`.ob-*`)** + **11.15 xira LiveBadge (`.live-badge`)** + QZ_BG_SHAPES tokenlari mavzuga moslash
+ (agar mavzuga mos) 9.1 DragDrop / 9.4 kod-praktika + oxirida 14-checklist to'liq + esbuild + jonli sinov.

---

## 14. ✅ HAR DARS UCHUN TO'LIQ TEKSHIRUV RO'YXATI

```
TIL
[ ] 1    grep -nP '[\x{0400}-\x{04FF}]' — faqat ru: tarjima chiqadi (boshqa kirill yo'q)
[ ] 1    tushunarsiz so'zlar sodda tilga keltirilgan
[ ] 1    siz-forma: grep -noE "(ding|lading|san)\b|o'zing\b" — faqat mashina-buyruqlari qoladi
[ ] 1    tugma nomlari neytral ("Yaratish"); matnda tilga olingan tugma ekrandagisi bilan bir xil (audio ham!)
[ ] 1    apostrof: grep -n "[‘’ʻ]" — hech narsa chiqmaydi (faqat ASCII ' yoki \u2019 escape)
[ ] 1    "sir"-uslub yo'q: grep -nE "hozircha sir|🤫" — bo'sh (o'quvchi matnida sirli-dramatik ifoda yo'q)
[ ] 1    har ekranda useAudio matni bor; audio matn ↔ Mentor matn parallel

JONLI / BALL (🔴 statistika buglari shu yerdan)
[ ] 2.1  function useLiveSession(lessonId, answerKey) + keyRef qatori
[ ] 2.2  startMentor ichida set_quiz_keys (liveStore'dan keyin)
[ ] 2.3  const answerKey = {...INLINE_KEYS, ...quiz}; useLiveSession(id, answerKey)
[ ] 2.4  har scored:true ekran uchun INLINE_KEYS[id] == correctIdx
[ ] 3    submitAnswer imzosi o'zgarmagan; indeks konvensiyasi (<100 / >=100 / 500+)
[ ] 4    SCREEN_META.length == screens.length; PRACTICE_AFTER/Q_LABELS indekslari to'g'ri
[ ] 4.1  dars oqimi skeletga mos: hook → reja → (exploration→test→praktika)× → builder → debugging → podium → flashcard → summary
[ ] 4.2  summary standart: ScoreRing + CodeStrike CTA + RECAP/Uyga vazifa + 🏅 kolleksiya + glossary
[ ] 5    QuestionScreen: 1-urinish qotiriladi (firstCorrectRef), oneShot
[ ] 5.5  animatsiya/mashq ekranlarida NavNext optionalLive (testlarda YO'Q; erkin rejimda majburiy)
[ ] 5.7  Kahoot-reveal: reveal_screen RPC + revealed formula + o'quvchida neytral kutish (option-wait) + mentor NavNext reveal'gacha qulf
[ ] 6    MentorTestStats: ok = rows.filter(a => a.picked === correctIdx).length
[ ] 7    ScreenPodium sort: y.okCount - x.okCount || x.time - y.time
[ ] 8    QUIZ_BANK correct indekslari to'g'ri; quizPts/quizScore o'zgarmagan; QZ_BG_SHAPES mavzuga mos
[ ] 8.1  arena 12 savol · har biriga 15s (QUIZ_MS = 15000, 20000 EMAS)
[ ] 8.3  QUIZ_BANK to'g'ri javoblar 4 pozitsiyaga TENG taqsimlangan (3/3/3/3, birortasi 0 emas)
[ ] 8.4  javob UZUNLIGI teng — to'g'ri javob uzunidan bilinmasin (inline QuestionScreen + arena QUIZ_BANK; qo'lda o'qib)

INTERAKTIV / DIZAYN (🟢 to'liq etalon uchun)
[ ] 8.2  CodeStrike arena (QzBolt, QzFX, brend ranglar; "CoddyHoot"/QzOwl qolmagan)
[ ] 9    DragDrop / DebugChallenge / Flashcards — reusable, kontent moslangan
[ ] 9.3  flashcard: Quizlet-uslub baholash; jonli darsda faqat mentorga, erkin rejimda hammaga
[ ] 📖   RECAPS to'ldirilgan: har scored test uchun 3 karta (ic/h/body/vis/ask) — bo'sh {} EMAS (namuna: InternetLesson 1675-qator)
[ ] 9.4  praktika-compiler soni AYNAN 3 (PRACTICE_AFTER 3 kalit — 4-5 emas)
[ ] 9.4  praktika: TASK/STARTER shakli, practice-done signal (500+), mentor jonli panel (chiplar + doska-demo)
[ ] 9.4  MAJBURIY: praktika shartlarida faqat SHU PAYTGACHA o'tilgan teglar (TASK_*.requirements ↔ dars oqimi)
[ ] 10   Badges — AYNAN 4 nishon (3 bosqich + graduate), hammasi real olinadigan; hisoblagich + kolleksiya; ko'rinadigan yorliq "Badges" (❌ "Achievements")
[ ] 10   nishon nomi QISQA INGLIZCHA o'yin-nom ("Built It!", "Nice Catch!", "Level Up!") + o'zbekcha desc
[ ] 10   TO'LIQ-EKRAN bayram (AchCelebrate, .acu-*) — kichik toast EMAS; navbatda bittalab
[ ] 11   UI qoidalari (emoji, pv-h1, li:empty, base target)
[ ] 11.14 onboarding: coach-mark spotlight tur (TourGuide .tg-*, data-tour), bir marta; katta PIN AUTO-ochilmaydi (faqat «Ko'rsatish» — aks holda tur bilan to'qnashadi)
[ ] 11.15 LiveBadge xira (.live-badge opacity 0.4) → hover'da tiniq
[ ] 11.16 arenada o'z-ball YASHIL (.me highlight #12A968), qizil faqat xato javob
[ ] 11.6 qizil fon faqat xatoda; xulosa/maslahat bloklari frame-success (yashil)
[ ] 11.7 "bosib o'rgan" ekranlarda yo'riqnoma + hisoblagich + pulsatsiya + ✓
[ ] 11.8 test/arena matnlarida kod atamalari backtick + fmtCode chip (QUIZ_BANK, options, explain*)
[ ] 11.9 MAJBURIY: har STARTER_* va DEFAULT_FILES faqat "<!-- Bu yerga yozing -->" — tayyor teg/matn/ko'rsatma YO'Q
[ ] 11.10 preview rasmlar real (PHOTO_SET URL), kod namunasi rasm bilan mos
[ ] 11.12 kod namunalarida class/id/o'zgaruvchi nomlari inglizcha (class="card", karta EMAS)
[ ] 11.11 MAJBURIY layout: stage 1100px + padH 60 + avto-zoom (--lz) — grep 'max-width: 1100px' chiqadi, '936px' chiqmaydi

YAKUNIY
[ ] ✔    build toza: npx esbuild <fayl> --outfile=<scratch>
[ ] ✔    JONLI SINOV: yangi PIN → 2 o'quvchi → podium/arena ballari 0 EMAS (MENTOR-2026)
```

---

## 15. 🔧 TUZATISH RETSEPTLARI (mexanik)

**A) set_quiz_keys (jonli-ball) — 2 edit:**
```
1) function useLiveSession(lessonId) {            →  function useLiveSession(lessonId, answerKey) {
   const initRef = useRef(undefined);                const keyRef = useRef(answerKey); keyRef.current = answerKey;
                                                      const initRef = useRef(undefined);
2) liveStore(lessonId, { mode: 'mentor', ... });  →  ...+ keyingi qatorga:
                                                      if (keyRef.current) liveRpc('set_quiz_keys', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim(), p_keys: keyRef.current }).catch(() => {});
```

**B) MentorTestStats sanog'i:**
```
const ok = data.rows.filter(a => a.correct).length;   →   const ok = data.rows.filter(a => a.picked === correctIdx).length;
```

**C) Interaktiv qatlam (to'liq etalon):** `Htmllesson1.jsx` dan `DragDropOrder`, `DebugChallenge`,
`Flashcards`, `ScreenFlashcards`, Badges bloki (ACHIEVEMENTS/ACH_TRIGGERS/AchCtx/AchToasts/AchCounter — kod nomlari o'zgarmaydi),
MentorPracticeOverlay + PRACTICE_DONE_BASE (9.4), fmtCode (D)
va `qz-`/`dd-`/`dbg-`/`fc-`/`ach-`/`mp-` CSS ko'chiriladi; kontent (kartalar, savollar, nishonlar) o'sha darsga moslanadi.

**D) Kod-atama chipi (11.8) — helper + CSS:**
```jsx
// `...` bilan belgilangan kod atamalarini chipga aylantiradi
const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;
```
```css
.qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }
.qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
```
Render joylari (hammasi `fmtCode(...)` bilan o'raladi): variant tugmasi matni, izoh (`explain*`),
"To'g'ri javob: X — ..." satri, arena savoli `{Q.q}` va plitka `{o}` (ikkala ko'rinishda).

**E) NavNext optionalLive (5.5):** animatsiya-ekran `<NavNext optionalLive disabled={...}>` —
testlarga qo'yilmaydi; freeRide formulasi NavNext ichida allaqachon bor bo'lsa, faqat prop qo'shiladi.

**F) Layout kengligi + avto-zoom (11.11) — 4 edit:**
```
1) Lesson root komponentiga (masalan earn callback'idan keyin) effekt:
   // ETALON — 1920px (InternetLesson): keng oynada proportsional kattalashadi, <=1920 da z=1
   useEffect(() => {
     const upd = () => { const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920)); document.documentElement.style.setProperty('--lz', String(Math.round(z * 1000) / 1000)); };
     upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
   }, []);
2) .lesson-root { ... height: 100dvh; ... }   →  zoom: var(--lz, 1); height: calc(100dvh / var(--lz, 1));
3) .stage { max-width: 936px; ... height: 100dvh; ... }  →  max-width: 1100px; height: calc(100dvh / var(--lz, 1));
4) const padH = isMobile ? 12 : 100;  →  const padH = isMobile ? 12 : 60; // InternetLesson layout standarti: 1100px + 60px
```
Eslatma: HtmlCompiler overlay (`.hc-root`, `position:fixed` qatlam) `.lesson-root`dan TASHQARIDA —
unga zoom ta'sir qilmaydi, tegilmaydi. `--lz` mantig'i <=1920px ekranda z=1 (hech narsa o'zgarmaydi,
mobil ham tegilmaydi); faqat 2K/ultrawide'da 1.5x gacha proportsional kattalashadi.

**G) TIL tozalash (1-bo'lim) — python bilan, tartibi MUHIM:**
```python
s = open(fayl).read()
# 1) "sir" kutish matni (double-quoted string — xavfsiz, aynan shu matn hammasida bir xil):
s = s.replace("Javobingiz yozib olindi 🤫 To'g'rimi-xatomi — hozircha sir! Mentor «Natijani ochish»ni bosganda hammada birdan ko'rinadi.",
              "Javobingiz yozib olindi. To'g'ri yoki xato ekani mentor «Natijani ochish»ni bosganda hammada birdan ko'rinadi.")
# 2) Sansirash — har birini alohida, assert count==1 bilan (grep'dan topilganlar)
# 3) Qiyshiq apostrof — ENG OXIRIDA, \' escape bilan (oddiy ' EMAS — single-quoted stringni buzadi!):
for ch in '‘’ʻ': s = s.replace(ch, "\\'")
```
Keyin: `grep -n "[‘’ʻ]"` bo'sh · sansirash grep bo'sh · `npx esbuild` toza. Kirill qatorlari qo'lda lotinlashtiriladi
(faqat `ru:` tarjima qoladi). ⚠️ JSX matn ichida (string emas) `\'` ko'rinsa — noto'g'ri; u joyda oddiy `'` kerak,
shuning uchun almashtirishdan keyin esbuild + `grep -n "\\\\\\'"` natijalarini ko'zdan kechiring.

**H) Yangi UI qatlamlari (onboarding + to'liq-ekran bayram + xira LiveBadge) — L1'dan ko'chiriladi:**
```
1) TO'LIQ-EKRAN BAYRAM (10): AchToastItem/ach-toast'ni AchCelebrate + AchToasts (faqat toasts[0])
   bilan almashtir; .acu-* CSS blokini L1'dan ko'chir (eski .ach-toast* CSS o'chadi). Nishon nomlari inglizcha.
2) ONBOARDING coach-mark (11.14): TOUR data (learner+mentor, selector-based) + TourGuide komponenti + .tg-* CSS;
   real elementlarga data-tour="next|mentor|progress|ach|live" qo'y; root'da [onboard] state + effekt (500ms delay) +
   render <TourGuide role={onboardRole} onClose={closeOnboard} /> + LiveBadge deferBig={onboard}.
3) XIRA LIVEBADGE (11.15): barcha <div style={_liveBadgeS}> → className="live-badge" qo'sh;
   .live-badge { opacity:.4 } :hover/:focus-within { opacity:1 } @media(hover:none){opacity:.62} CSS qo'sh.
4) ARENA O'Z-BALL YASHIL (11.16): .me highlight (qz-brow.me, qz-brank, qz-pod-name, qz-mypl b, pod-row.me...) accent→yashil (#12A968/success).
```
Barchasi ${T.} palitradan foydalanadi (hamma darsda bor). esbuild + brauzerda sinov.

---

## 15-I. 📍 L1 MANBA XARITASI — nima QAYERDA (`Htmllesson1.jsx`)

> Rollar shu bo'limga ishora qiladi (takrorlanmaydi). **Qator raqamlari — v17, 2026-07-09 holati, DRIFT bo'ladi** — shuning uchun har doim **grep-anchor** (identifikator/CSS-marker) bilan toping; qator faqat mo'ljal. Yagona buyruq: `grep -n "<anchor>" src/1-Modull/Htmllesson1.jsx`.

**CONSTLAR** (`grep -n "^const NAME"`):
| Const | ~qator | Kimники |
|---|---|---|
| `T` (palitra) | 902 | 🎨 Dizayn |
| `LESSON_META` / `SCREEN_META` | 1296 / 1297 | 🏗️ Quruvchi / ⚡ Jonli |
| `RECAPS` | 1440 | 🎓 Metodist |
| `SKELET_PIECES` | 2369 | 🏗️ Quruvchi (DragDrop kontenti) |
| `INLINE_KEYS` | 3274 | ⚡ Jonli |
| `QUIZ_COLORS` / `QZ_BG_SHAPES` | 3387 / 3390 | 🎨 Dizayn |
| `QUIZ_BANK` | 3401 | ⚡ Jonli (correct) / 🎓 Metodist (matn) |
| `PRACTICE_AFTER` / `PRACTICE_DONE_BASE` | 3898 / 958 | 🏗️ Quruvchi |
| `ACHIEVEMENTS` / `ACH_TRIGGERS` | 3907 / 3914 | 🏗️ struktura · 🎓 nomlar |
| `TOUR` | 3950 | 🏗️ Quruvchi (onboarding data) |

**KOMPONENTLAR** (`grep -n "function NAME"`):
| Komponent | ~qator | Kimники |
|---|---|---|
| `HtmlCompiler` | 526 | 🏗️ Quruvchi (praktika) |
| `useLiveSession` (+`set_quiz_keys` ichida) | 963 | ⚡ Jonli |
| `AchCounter` (yorliq "Badges") | 1332 | 🏗️ struktura · 🎨 ko'rinish |
| `Stage` / `NavNext` (`optionalLive`) | 1360 / 1403 | 🏗️ Quruvchi |
| `RecapOverlay` / `MentorTestStats` | 1505 / 1553 | 🎓 / ⚡ (`picked===correctIdx`) |
| `fmtCode` | 1549 | 🏗️ helper · 🎨 chip · 🎓 backtick |
| `MentorPracticeOverlay` | 1696 | 🏗️ Quruvchi |
| `QuestionScreen` | 1763 | ⚡ Jonli (1-urinish, reveal) |
| `ScoreRing` / `Mentor` | 1863 / 1890 | 🎨 / — |
| `DragDropOrder` / `DebugChallenge` / `Flashcards` | 2375 / 2454 / 2498 | 🏗️ struktura · ✨ harakat |
| `ScreenFlashcards` / `ScreenPodium` | 3176 / 3276 | ✨ / ⚡ (sort) |
| `QzBolt` / `QzFX` | 3447 / 3479 | 🎨 mascot · ✨ canvas |
| `AchCelebrate` / `AchToasts` | 3916 / 3942 | ✨ to'liq-ekran bayram |
| `TourGuide` | 3963 | ✨ tg-* harakat · 🎨 ko'rinish |

**CSS BLOKLAR** (`grep -n "/* ===" ` — emoji marker bilan):
| Marker | ~qator | Kimники |
|---|---|---|
| `🧲 DRAG&DROP` | 4384 | ✨ Animatsiya |
| `🐞 DEBUG CHALLENGE` | 4407 | ✨ Animatsiya |
| `🃏 FLASHCARDS (3D flip)` | 4421 | ✨ Animatsiya |
| `🏅 ACHIEVEMENTS` + `TO'LIQ-EKRAN NISHON BAYRAMI` (`.acu-*`) | 4472 / 4473 | ✨ Animatsiya |
| `👋 ONBOARDING` (`.tg-*`) | 4547 | ✨ harakat · 🎨 ko'rinish |
| `Jonli panel (LiveBadge)` | 4569 | 🎨 Dizayn |
| `DINOZAVRNI DASTURLASH O'YINI` (`rg-*`) | 4776 | 💡 idea namunasi · ✨ harakat |
| `Konfetti (yakun bayrami)` | 4907 | ✨ Animatsiya |

> **Ishlatish:** yangi darsga qatlam ko'chirayotgan rol shu jadvaldan anchor'ni oladi → `grep -n` bilan L1'da aniq blokni topadi → python/Edit bilan ko'chiradi → mavzuga moslaydi → esbuild. Qator drift bo'lgani uchun HAR SAFAR grep bilan tasdiqlanadi.
