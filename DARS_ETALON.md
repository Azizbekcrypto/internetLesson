# 📐 DARS QURILISH ETALONI (Reference Standard)

> **Etalon manba (golden reference):** `src/InternetLesson.jsx` — to'g'ri ishlaydigan dars.
> **Maqsad:** har bir darslik shu hujjatga solishtirib tekshiriladi va tuzatiladi.
> **Eng muhim qoida:** jonli (live) ball hisoblash **serverда** bo'ladi — server javob kalitini
> mentor sessiya ochganда oladi. Kalit yuklanmasa, server hamma javobni **"xato"** deb belgilaydi
> va podium/arena ballari **0** bo'ladi. (Aynan shu bug 19 ta darslikda topildi — pastdagi auditga qarang.)

---

## 0. Qanday ishlatiladi

1. Yangi yoki mavjud darslikni ochganda, quyidagi **11 bo'lim** bo'yicha ketma-ket tekshir.
2. Har bo'limда 🔴 = majburiy (buzilsa dars ishlamaydi), 🟡 = muhim, ⚪ = kosmetik.
3. Oxirida **10-bo'lim (tekshiruv ro'yxati)** ni to'ldir — hammasi ✅ bo'lsa dars etalonга mos.

---

## 1. 🔴 JONLI SESSIYA + JAVOB KALITI (eng kritik — bug shu yerda edi)

Bu darslarда javobларни **server baholaydi** (o'quvchi aldab `correct=true` yubora olmasin uchun).
Buning uchun **mentor sessiyani ochganда** javob kaliti serverга yuklanishi SHART.

### 1.1 🔴 `useLiveSession` imzosi — `answerKey` qabul qiladi + `keyRef`

**To'g'ri (etalon):**
```js
function useLiveSession(lessonId, answerKey) {
  const keyRef = useRef(answerKey); keyRef.current = answerKey; // javob kaliti — mentor sessiya ochganda serverga yuklanadi
  const initRef = useRef(undefined);
  ...
```

**Xato (buzuq darsliklarda):**
```js
function useLiveSession(lessonId) {        // ❌ answerKey YO'Q
  const initRef = useRef(undefined);        // ❌ keyRef YO'Q
```

### 1.2 🔴 `set_quiz_keys` — `startMentor` ichida kalitni serverga yuklash

**To'g'ri (etalon):** `startMentor` ichida, `liveStore(... mode:'mentor' ...)` dan KEYIN:
```js
const startMentor = useCallback(async (mentorCode) => {
  setBusy(true); setJoinError('');
  try {
    const res = await liveRpc('create_session', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim() });
    const row = Array.isArray(res) ? res[0] : res;
    if (!row?.pin) throw new Error('no pin');
    tokenRef.current = row.token; setPin(row.pin); setMode('mentor'); setEnded(false);
    liveStore(lessonId, { mode: 'mentor', pin: row.pin, token: row.token });
    // 🔴 Javob kalitini serverga avto-yuklash — server-baholash uchun SHART.
    // Busiz server javoblarni kalitsiz baholaydi va hammasini «xato» deb hisoblaydi (podium 0/5).
    if (keyRef.current) liveRpc('set_quiz_keys', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim(), p_keys: keyRef.current }).catch(() => {});
  } catch { setJoinError('Mentor kodi noto‘g‘ri yoki ulanishda xato.'); }
  finally { setBusy(false); }
}, [lessonId]);
```

**Xato (buzuq):** `set_quiz_keys` qatori umuman yo'q → kalit hech qachon serverga bormaydi.

### 1.3 🟡 `answerKey` chaqiruv tomonida quriladi va uzatiladi

Bu qism **buzuq darsliklarda ham bor** (shuning uchun faqat 1.1/1.2 tuzatilsa yetadi):
```js
const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
const live = useLiveSession(LESSON_META.lessonId, answerKey);
```

### 1.4 🔴 `INLINE_KEYS` — har baholanadigan ekranning to'g'ri javob indeksi

- Kalit `{ [screenId]: correctIdx }` shaklida. Yozma (input) savollar uchun `-1`.
- **Muhim:** har `INLINE_KEYS[id]` qiymati o'sha ekranning `QuestionScreen`ga uzatilgan `correctIdx` bilan **bir xil bo'lishi shart**. Aks holda o'quvchi to'g'ri javob bersa ham server "xato" qiladi.

```js
// Misol (Htmllesson1):
const INLINE_KEYS = { s4: 2, s5b: 3, s7: -1, s11: 1, s15: -1 };
//                        ↑ Brauzer   ↑ <body>  ↑ yozma  ↑ <ol>  ↑ yozma
```

### 1.5 ℹ️ Server-baholash tamoyili (nega kalit shart)

- O'quvchi `submit_answer` bilan `p_picked` (tanlagan indeks) yuboradi.
- Server `p_picked === kalit[p_question_id]` ni tekshirib `correct` ni **o'zi** yozadi.
- Klientning `p_correct` qiymatiga **ishonilmaydi** (aldashдан himoya).
- ✅ **Isbot (jonli test):** picked=xato + `p_correct=true` yolg'on yuborilsa ham, kalit yuklangan bo'lsa server `correct=false` yozadi.

---

## 2. 🔴 `submitAnswer` — imzo va indeks konvensiyalari

**Etalon imzo (o'zgartirmang):**
```js
const submitAnswer = useCallback((screenIdx, questionId, picked, correct, elapsedMs) => {
  if (mode !== 'student' || !pin || !playerRef.current) return;
  const body = {
    p_pin: pin, p_player_id: playerRef.current.id, p_token: playerRef.current.token,
    p_screen: screenIdx, p_question_id: questionId || '', p_picked: picked,
    p_correct: !!correct, p_elapsed_ms: Math.max(0, Math.round(elapsedMs || 0))
  };
  const attempt = (n) => { liveRpc('submit_answer', body).catch(() => { if (n < 3) setTimeout(() => attempt(n + 1), 3000 * (n + 1)); }); };
  attempt(0);
}, [mode, pin]);
```

**Screen indeks konvensiyasi (MAJBURIY):**
| Diapazon | Nima | `question_id` |
|---|---|---|
| `< 100` | Dars ichidagi testlar | `s4`, `s5b`, ... (SCREEN_META id) |
| `>= 100` (`QUIZ_BASE_IDX + qi`) | Kahoot-jang savollari | `quiz-0`, `quiz-1`, ... |

`liveAnswers(pin)` (indekssiz) faqat `<100` ni, `liveQuizAnswers(pin)` faqat `>=100` ni oladi.

---

## 3. 🔴 `SCREEN_META` va `SCORED_IDX`

```js
const SCREEN_META = [ { id, type, template, scored, scope }, ... ];
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);
```
- `scored: true` — baholanadigan test. `scope: 'module-mikro'` (oddiy) yoki `'final'` (yakuniy).
- **Qoida:** har `scored:true` ekran uchun `INLINE_KEYS`da mos `id` bo'lishi shart.
- `SCORED_IDX`даги indeks = `screens[]` massividagi o'rin = o'quvchi `submit_answer`да yuboradigan `p_screen`. Bular **mos** bo'lishi kerak (podium shu bo'yicha o'qiydi).

---

## 4. 🔴 `QuestionScreen` — javob berish logikasi

- `mountTs = useRef(Date.now())` — tezlik (savol ochilгандан bosishgacha).
- `firstCorrectRef` — **1-urinish qotiriladi** (`ball: 1-urinishni qotirib qo'yamiz`), qayta urinish bahoni oshirmaydi.
- `oneShot = !!(live && live.mode === 'student')` — jonli darsда bir urinish, xato bossa ham qulflanadi.
- Jonli javobда: `live.submitAnswer(screen, SCREEN_META[screen]?.id || 's'+screen, i, isCorrect, Date.now() - mountTs.current)`.

---

## 5. 🟡 `MentorTestStats` — «to'g'ri» sanog'i ustunlar bilan bir manbadan

Panel sanog'ini serverdagi (eskirishi mumkin bo'lgan) `a.correct` boolean'iga tayamang —
ustunlar bilan **bir xil mantiqdan** hisoblang:

```js
// ✅ To'g'ri
const ok = data.rows.filter(a => a.picked === correctIdx).length;
// ❌ Xato (zid chiqishi mumkin)
const ok = data.rows.filter(a => a.correct).length;
```
Sabab: pastdagi ustunlar `picked === correctIdx` bilan chizadi; sanoq ham shundan hisoblansa,
yuqori/past hech qachon zid chiqmaydi.

---

## 6. 🔴 `ScreenPodium` — reyting

```js
const board = players.map(p => {
  const mine = rows.filter(a => a.player_id === p.id && SCORED_IDX.includes(a.screen_idx));
  const okCount = mine.filter(a => a.correct).length;      // server-baholangan
  const time = mine.reduce((s, a) => s + (a.elapsed_ms || 0), 0);
  return { id: p.id, nickname: p.nickname, okCount, time };
}).sort((x, y) => y.okCount - x.okCount || x.time - y.time); // to'g'ri ↓, teng bo'lsa vaqt ↑
```
- Reyting: to'g'ri javob soni bo'yicha; teng bo'lsa jami tezlik (kichik vaqt oldinda).
- ⚠️ `okCount` server `a.correct`ига tayanadi → **1-bo'lim kaliti yuklangan bo'lsagina to'g'ri ishlaydi**.

---

## 7. 🔴 Kahoot arena (`quizPts` / `quizScore` / `QUIZ_BANK`)

```js
const QUIZ_MS = 20000, QUIZ_BASE_IDX = 100;
const quizPts = (ms) => ms <= 500 ? 1000 : Math.max(0, Math.round(1000 * (1 - (Math.min(ms, QUIZ_MS) / QUIZ_MS) / 2)));
const quizScore = (rows) => {
  const byQ = {}; rows.forEach(r => { byQ[r.screen_idx - QUIZ_BASE_IDX] = r; });
  let pts = 0, streak = 0, maxStreak = 0, ok = 0;
  for (let i = 0; i < QUIZ_BANK.length; i++) {
    const a = byQ[i];
    if (a && a.correct) { streak++; maxStreak = Math.max(maxStreak, streak); ok++; pts += quizPts(a.elapsed_ms) + (streak >= 2 ? 100 : 0); }
    else streak = 0;
  }
  return { pts, ok, maxStreak };
};
```
- Max 1000 ball (≤500ms), 20s oxirida to'g'ri javob 500 ball. Streak (2+ ketma-ket) → +100.
- `QUIZ_BANK` har elementiда `{ q, opts, correct }` — `correct` **haqiqiy indeks** bo'lishi shart (kalitga kiradi).
- ⚠️ `quizScore` `a.correct`ига tayanadi → **kalit yuklanmasa ballar 0 0 0 0**.

---

## 8. ⚪ UI to'g'riligi (kichik, lekin etalonда bor)

| # | Qoida | To'g'ri |
|---|---|---|
| 8.1 | Mentor avatari — rasm emas, emoji | `<div className="mentor-ava">🧑‍🏫</div>` |
| 8.2 | h1 natija ko'rinishi qalin | `.pv-h1 { font-weight: 700; ... }` |
| 8.3 | `<p>` tavsifi tushunarli | "matn (paragraf)" (❌ "xatboshi") |
| 8.4 | Bo'sh `<li>` ortiqcha nuqta bermasin | `li:empty{display:none}` (preview CSS) |
| 8.5 | Preview'da havola yangi tabда ochilsin | `<base target="_blank">` + iframe sandbox `allow-popups allow-popups-to-escape-sandbox` |

> 8.2–8.5 faqat HTML-kod praktikasi (iframe preview) bor darsliklarga tegishli.

---

## 9. 🔍 AUDIT — HOLAT (2026-07-06 — TUZATILDI)

`useLiveSession(lessonId, answerKey)` + `set_quiz_keys` bo'yicha — **barcha 23 jonli darslik endi etalonga mos ✅**

### ✅ TO'G'RI — 23/23
Modul-1: `InternetLesson` · `Htmllesson1` · `Htmllesson2` · `CssLesson1` · `CssLesson2` · `GitLesson` · `DeployLesson` · `PmLesson1` · `PmLesson2` · `PmLesson3`
Modul-2: `JsIntroLesson` · `JsVarsLesson` · `JsConditionsLesson` · `JsLoopsLesson` · `JsFunctionsLesson` · `PeanStackLesson` · `PmLesson4` · `PmLesson5` · `PmLesson6` · `PracticeLesson1` · `PracticeLesson2` · `PracticeLesson3` · `PracticeLesson4`

**Tarix:** boshida faqat 4 tasi to'g'ri edi (InternetLesson, Htmllesson1, PmLesson1, JsIntroLesson);
qolgan **19 tasida `set_quiz_keys` yo'q edi** (podium/arena ballari 0). Bu sessiyada 19 tasi ham
etalon retsepti (1.1 + 1.2) bo'yicha tuzatildi, 19/19 build toza. `INLINE_KEYS` + `QUIZ_BANK` va
chaqiruv tomoni (`answerKey`) hammasida allaqachon to'g'ri edi.

> ⚠️ Har tuzatilgan darsni yangi jonli sessiyada bir marta jonli sinash tavsiya etiladi
> (yangi PIN → 2 o'quvchi → podium 0 emasligini ko'rish). Mexanizm InternetLesson/Htmllesson1'da
> jonli isbotlangan (mentor-kod MENTOR-2026); kod o'zgarishi bir xil.

## 10. ✅ HAR DARS UCHUN TEKSHIRUV RO'YXATI

```
[ ] 1.1  function useLiveSession(lessonId, answerKey)  + keyRef qatori bor
[ ] 1.2  startMentor ichida set_quiz_keys chaqiruvi bor (liveStore'dan keyin)
[ ] 1.3  chaqiruvda: const answerKey = {...INLINE_KEYS, ...quiz} ; useLiveSession(id, answerKey)
[ ] 1.4  har scored:true ekran uchun INLINE_KEYS[id] bor VA correctIdx bilan mos
[ ] 2    submitAnswer imzosi (screenIdx, questionId, picked, correct, elapsedMs) o'zgarmagan
[ ] 3    SCORED_IDX indekslari screens[] o'rni bilan mos
[ ] 5    MentorTestStats: ok = rows.filter(a => a.picked === correctIdx).length
[ ] 6    ScreenPodium sort: y.okCount - x.okCount || x.time - y.time
[ ] 7    QUIZ_BANK har elementda to'g'ri `correct` indeksi; quizPts/quizScore o'zgarmagan
[ ] 8    (HTML-kod darsliklari) 8.1–8.5 UI qoidalari
[ ] ✔    build toza:  npx esbuild <fayl> --outfile=/dev/null
[ ] ✔    jonli test: yangi PIN → 2 o'quvchi → podium/arena ballari 0 EMAS
```

---

## 11. 🔧 TUZATISH RETSEPTI (19 buzuq darslik uchun — bir xil, mexanik)

Har fayl uchun aynan 2 ta o'zgarish (chaqiruv tomoni allaqachon to'g'ri):

**Edit 1 — imzo + keyRef:**
```
TOP:   function useLiveSession(lessonId) {
         const initRef = useRef(undefined);
YANGI: function useLiveSession(lessonId, answerKey) {
         const keyRef = useRef(answerKey); keyRef.current = answerKey; // javob kaliti — mentor sessiya ochganda serverga yuklanadi
         const initRef = useRef(undefined);
```

**Edit 2 — set_quiz_keys (startMentor ichida):**
```
TOP:   liveStore(lessonId, { mode: 'mentor', pin: row.pin, token: row.token });
       } catch { setJoinError('Mentor kodi noto‘g‘ri yoki ulanishda xato.'); }
YANGI: liveStore(lessonId, { mode: 'mentor', pin: row.pin, token: row.token });
         if (keyRef.current) liveRpc('set_quiz_keys', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim(), p_keys: keyRef.current }).catch(() => {});
       } catch { setJoinError('Mentor kodi noto‘g‘ri yoki ulanishda xato.'); }
```

> ⚠️ Ba'zi darsliklarda `catch` xabari matni boshqacha bo'lishi mumkin — Edit 2'ni `liveStore(... mode: 'mentor' ...)` qatoriga bog'lang.

**Tuzatishdan keyin:** har fayl `build toza` + yangi jonli sessiyaда podium/arena ballari 0 emasligини tekshir.
