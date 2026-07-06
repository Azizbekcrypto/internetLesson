# 📐 DARS QURILISH ETALONI — TO'LIQ (Reference Standard)

> **Oltin etalon (full):** `src/1-Modull/Htmllesson1.jsx` — boy, jonli, brendlangan namunaviy dars.
> **Jonli-ball qatlami uchun** qo'shimcha manba: `src/InternetLesson.jsx`, `src/PmLesson1.jsx` (bir xil infra).
>
> **Maqsad:** qolgan barcha darslarni shu etalon bo'yicha qurish va shu bo'yicha tekshirish.
>
> **Eng muhim qoida (statistika buglari shu yerdan chiqadi):** jonli ball hisoblash **SERVERda**
> bo'ladi. Server javob kalitini mentor sessiya ochganda oladi (`set_quiz_keys`). Kalit yuklanmasa,
> server hamma javobni **"xato"** deb belgilaydi → podium va arena ballari **0 0 0 0** bo'ladi.
> (Aynan shu bug boshida 19 ta darslikda bor edi — 12 va 13-bo'limlarga qarang.)

**Belgilar:** 🔴 = majburiy (buzilsa dars ishlamaydi) · 🟡 = muhim (noto'g'ri ko'rinish) · 🟢 = boyituvchi (mashqlar) · ⚪ = kosmetik.

---

## 0. Qanday ishlatiladi

1. Har darsni quyidagi bo'limlar bo'yicha ketma-ket tekshir.
2. Har o'zgarishdan keyin **build toza** ekanini tekshir: `npx esbuild <fayl> --loader:.jsx=jsx --outfile=/dev/null` (yoki `--outfile` scratch faylga).
3. Jonli qismni **yangi PIN bilan** sinash SHART (2 o'quvchi → podium/arena ballari 0 EMAS). Mentor-kod test uchun: **MENTOR-2026**.
4. Oxirida **14-bo'lim (tekshiruv ro'yxati)**ni to'ldir.

---

## 1. 🔴 TIL VA MATN

- **Faqat lotin o'zbek.** Tasodifiy kirill harflarga yo'l qo'yilmaydi (`а е о с р х у к н г д л ...` lotin ko'rinadi, lekin boshqa belgi). Tekshiruv:
  ```
  grep -nP '[\x{0400}-\x{04FF}]' <fayl>
  ```
  → faqat ataylab **ruscha `ru:` tarjima** (`{ uz: '...', ru: 'Основы HTML' }`) qatorlari chiqishi mumkin. Boshqa har qanday kirill = xato, lotinga o'giriladi.
- **Tushunarli so'zlar:** boshlang'ich o'quvchi uchun. Masalan `<p>` = "matn (paragraf)" (❌ "xatboshi"); skelet bo'laklari uchun aniq maslahatlar ("butun sahifa qobig'i", "ko'rinmas qism").
- Mentor matni sodda, do'stona, "siz" shaklida.

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

> **Misol (bu sessiyada):** `s15` ("ismingizni sarlavha qiling") olib tashlandi — SCREEN_META+screens dan chiqarildi, `INLINE_KEYS`/`Q_LABELS` dan s15 olindi, `PRACTICE_AFTER` 16→15 (yakuniy praktika endi Debugging'dan keyin). `ScreenFlashcards` esa summarydan oldin qo'shildi (idx 17) — hamma kalit <17 bo'lgani uchun maplar o'zgarmadi.

---

## 5. 🔴 `QuestionScreen` — javob berish logikasi

- `mountTs = useRef(Date.now())` — tezlik (savol ochilishidan bosishgacha; teng ballda hal qiladi).
- `firstCorrectRef` — **1-urinish qotiriladi**; qayta urinish bahoni oshirmaydi.
- `oneShot = !!(live && live.mode === 'student')` — jonli darsda bir urinish (xato bossa ham qulflanadi).
- Jonli javobda: `live.submitAnswer(screen, SCREEN_META[screen]?.id || 's'+screen, i, isCorrect, Date.now() - mountTs.current)`.

---

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

## 8. 🔴 CODDYHOOT ARENA (Kahoot-jang)

### 8.1 Ball formulasi (o'zgartirmang)
```js
const QUIZ_MS = 20000, QUIZ_BASE_IDX = 100;
const quizPts = (ms) => ms <= 500 ? 1000 : Math.max(0, Math.round(1000 * (1 - (Math.min(ms, QUIZ_MS) / QUIZ_MS) / 2)));
// quizScore: har to'g'ri javob quizPts + (streak>=2 ? 100 : 0); pts ↓, teng bo'lsa ok ↓
```
- Max 1000 ball (≤500ms), 20s oxirida to'g'ri javob 500. Streak (2+) → +100.
- `QUIZ_BANK` har elementida `{ q, opts, correct }` — `correct` **haqiqiy indeks** (kalitga kiradi).
- ⚠️ `quizScore` `a.correct`ga tayanadi → kalit yuklanmasa **0 0 0 0**.

### 8.2 CoddyHoot brend dizayni (Htmllesson1 etaloni)
- **Ranglar:** issiq/moviy CoddyCamp muhiti (`#F0F4FC` fon, accent `#FF4F28`). `QUIZ_COLORS = ['#FF5A2C','#0FA6D6','#F5A623','#22A05C']` (coral/ocean/sun/leaf).
- **Boyqush mascot:** `QzOwl` (SVG) + "CoddyHoot" logotip (lobby/CTA/podium).
- **Jonli fon:** `QzFX` canvas — suzuvchi uchqunlar + "web" chiziqlari + kod tokenlari. `QZ_BG_SHAPES` = kod tokenlari (`</>`, `{ }`, `href` ...).
- **Plitkalar:** glossy, shakl doirachada; `qz-` CSS to'liq CoddyHoot uslubida.
- **Boshqa mavzu darsida:** `QZ_BG_SHAPES` va `QzFX` ichidagi `TOK` massivini o'sha mavzuga moslang (CSS: `let`/`=>`; JS: `git`/`commit`; va h.k.).

---

## 9. 🟢 INTERAKTIV REUSABLE KOMPONENTLAR

Har biri **kontentdan ajratilgan** — boshqa darsga faqat ma'lumot almashtiriladi. Hammasi CoddyHoot uslubida.

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
- **Alohida sahifada** (`ScreenFlashcards`, summarydan oldin) + deck/taxlam effekti (`.fc-cardwrap::before/::after`).

---

## 10. 🏅 ACHIEVEMENT (nishonlar) tizimi

4 qatlamli, ko'rinadigan:
1. **Toast** — olinganda yuqoridan qalqib chiqadi (shine + pop, ~3.6s).
2. **Hisoblagich** — har sahifada "🏅 X/6" (Stage header, progress yonida), yangisida **pulslaydi** (bump); bosilsa popover.
3. **Kolleksiya** — dars oxirida (Screen16) barcha nishonlar (olingan=rangli+tavsif, olinmagan=🔒).

**Arxitektura:**
```js
const ACHIEVEMENTS = { skelet:{icon,name,desc}, firsttag, debugger, flashcard, ace, graduate };
const ACH_TRIGGERS = { s5:'skelet', s7:'firsttag', s13:'debugger', sflash:'flashcard' }; // ekran id → nishon
const AchCtx = createContext(null); // earned Set — Stage hisoblagichi o'qiydi
```
- Markazlashgan trigger: `recordAnswer` da `if (ACH_TRIGGERS[_m.id] && data.correct) earn(...)`; yakuniy ekranda `earn('graduate')` + (hammasi to'g'ri bo'lsa) `earn('ace')`.
- `earn` **`earnedRef` bilan StrictMode-safe** (setState ichida setState emas).
- `AchCtx.Provider value={earned}` root'da; `<Current ... achievements={earned} />`; `<AchToasts .../>` root'da.
- Boshqa darsga: `ACHIEVEMENTS` + `ACH_TRIGGERS` o'sha darsning bosqichlariga moslanadi.

---

## 11. ⚪ UI TO'G'RILIGI

| # | Qoida | To'g'ri |
|---|---|---|
| 11.1 | Mentor avatari — rasm emas, emoji | `<div className="mentor-ava">🧑‍🏫</div>` |
| 11.2 | h1 natija ko'rinishi qalin | `.pv-h1 { font-weight: 700; ... }` |
| 11.3 | `<p>` tavsifi tushunarli | "matn (paragraf)" (❌ "xatboshi") |
| 11.4 | Bo'sh `<li>` ortiqcha nuqta bermasin | `li:empty{display:none}` (preview CSS) |
| 11.5 | Preview'da havola yangi tabda ochilsin | `<base target="_blank">` + iframe sandbox `allow-popups allow-popups-to-escape-sandbox` |

> 11.2–11.5 faqat HTML-kod praktikasi (iframe preview) bor darslarga tegishli.

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

---

## 13. 🔍 AUDIT — HOLAT (2026-07-07)

**Jonli-ball qatlami (set_quiz_keys):** barcha **23 jonli darslik** etalonga mos ✅
(boshida faqat 4 to'g'ri edi; 19 tasi shu ish jarayonida tuzatildi).

**To'liq interaktiv qatlam (CoddyHoot + mashqlar + Achievement):** faqat `Htmllesson1` ✅.
Qolgan darslar hali eski (qora Kahoot, mashqlar/nishonlarsiz) — 9/10-bo'limlar bo'yicha tarqatiladi.

Modul-1: InternetLesson · **Htmllesson1 (to'liq etalon)** · Htmllesson2 · CssLesson1/2 · GitLesson · DeployLesson · PmLesson1/2/3
Modul-2: JsIntro/Vars/Conditions/Loops/Functions · PeanStackLesson · PmLesson4/5/6 · PracticeLesson1/2/3/4

---

## 14. ✅ HAR DARS UCHUN TO'LIQ TEKSHIRUV RO'YXATI

```
TIL
[ ] 1    grep -nP '[\x{0400}-\x{04FF}]' — faqat ru: tarjima chiqadi (boshqa kirill yo'q)
[ ] 1    tushunarsiz so'zlar sodda tilga keltirilgan

JONLI / BALL (🔴 statistika buglari shu yerdan)
[ ] 2.1  function useLiveSession(lessonId, answerKey) + keyRef qatori
[ ] 2.2  startMentor ichida set_quiz_keys (liveStore'dan keyin)
[ ] 2.3  const answerKey = {...INLINE_KEYS, ...quiz}; useLiveSession(id, answerKey)
[ ] 2.4  har scored:true ekran uchun INLINE_KEYS[id] == correctIdx
[ ] 3    submitAnswer imzosi o'zgarmagan; indeks konvensiyasi (<100 / >=100 / 500+)
[ ] 4    SCREEN_META.length == screens.length; PRACTICE_AFTER/Q_LABELS indekslari to'g'ri
[ ] 5    QuestionScreen: 1-urinish qotiriladi (firstCorrectRef), oneShot
[ ] 6    MentorTestStats: ok = rows.filter(a => a.picked === correctIdx).length
[ ] 7    ScreenPodium sort: y.okCount - x.okCount || x.time - y.time
[ ] 8    QUIZ_BANK correct indekslari to'g'ri; quizPts/quizScore o'zgarmagan; QZ_BG_SHAPES mavzuga mos

INTERAKTIV / DIZAYN (🟢 to'liq etalon uchun)
[ ] 8.2  CoddyHoot arena (QzOwl, QzFX, brend ranglar)
[ ] 9    DragDrop / DebugChallenge / Flashcards — reusable, kontent moslangan
[ ] 10   Achievement — ACHIEVEMENTS + ACH_TRIGGERS + hisoblagich + kolleksiya
[ ] 11   UI qoidalari (emoji, pv-h1, li:empty, base target)

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
`Flashcards`, `ScreenFlashcards`, Achievement bloki (ACHIEVEMENTS/ACH_TRIGGERS/AchCtx/AchToasts/AchCounter),
va `qz-`/`dd-`/`dbg-`/`fc-`/`ach-` CSS ko'chiriladi; kontent (kartalar, savollar, nishonlar) o'sha darsga moslanadi.
