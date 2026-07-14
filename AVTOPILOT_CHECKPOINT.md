# 🤖 AVTOPILOT CHECKPOINT

## ⏰ TIKLASH (limit yangilangandan keyin)
> **Cron o'rnatildi: 2026-07-13, 10:08** — sessiya OCHIQ qolsa avtopilot o'zi uyg'onadi va **5-Modulni to'liq yakunlaydi**.
> **Terminal yopilib qolsa** — yangi sessiyada shu bitta jumlani yozing:
> ```
> AVTOPILOT_CHECKPOINT.md ni o'qi va avtopilot rejimda qolgan joydan davom et — to'liq o'zing boshqar, tasdiq so'rama.
> ```
> **Rejim:** 3 ta agent (Sonnet) · zanjir Quruvchi → Jonli → SAYQAL → Tekshiruvchi · **Verifikator = bosh agent o'zi** (esbuild + `--bundle` + node+eval uzunlik-tell + INLINE_KEYS↔JSX — bash bilan).
> **Qoidalar:** agent hisobotiga ISHONMA (fayldan dasturiy tekshir) · PM darslariga (PmLesson15-18) TEGMA (foydalanuvchi qarori) · **COMMIT YO'Q** · jonli-sinov foydalanuvchida.

## 🟢 PARTIYA REJASI — 4a+4b+4c YAKUNIGACHA (2026-07-12, qayta boshlash)
> **VAKOLAT:** «ketma-ket yurit, avtopilotni davom ettir... 3 tadan agent, 10 ta parallel qilma. 4c niyam tugatishimiz kerak.»
> **REJIM:** har partiyada **3 agent** (ko'p emas, kam emas). Partiya tugaydi → office-mark → checkpoint yangilanadi → keyingi partiya. Uzilsa shu jadvaldan davom.
>
> **DASTURIY TEKSHIRUV (2026-07-12) — fon-agentlarning HECH BIRI yetkazmagan, /tmp tozalangan (audit+brief fayllar YO'Q).**
> Haqiqiy holat: Practice ✅imzo · Alive kod-toza (Verifikator qoldi) · Resource 4 bug · JestUnitTest 2 bug · EdgeCases v16 · 4c 5/5 v16.
> App.jsx: 4-Modul (m4-01..11) ALLAQACHON ulangan. Ulanmagan: 4a, 4b, 4c.

### ✅ BAJARILGAN (jonli holat)
- **4a-Modul YOPILDI 3/3 IMZOLANDI:** NestArchPractice · NestArchAlive · NestArchResource.
- **4b-Modul YOPILDI 2/2 IMZOLANDI:** JestUnitTest · EdgeCasesTest.
- **4c: 2/5 IMZOLANDI**
  - **CiCdIntro ✅** (modul etaloni — qolgan darslar undan ko'chiradi). QUIZ=`201302312301`, INLINE `{s4:2,s8:0,s10:3,s14:1,s15:0}`, ACH `{s9,s10,s13,s15}`, 20 ekran. Markaziy o'yin (s9 chamadon→lenta→qizil chiroq) kod darajasida ishlashi tasdiqlangan.
  - **GithubActions ✅** QUIZ=`102021323013` (tell 0/12), INLINE `{s4:2,s7:0,s10:3,s15:1,s18:0}`, ACH `{s4,s15,s17,s18}`, 23 ekran. Verifikatsiyani BOSH AGENT o'zi qildi (esbuild+bundle+node eval+INLINE↔JSX 1:1).

### 🔴 QOLGAN ISH (cron 04:55 da shu yerdan davom etadi)
| Dars | Holat | Keyingi qadam |
|---|---|---|
| `FullPipelineProjectLesson` | ✅ **IMZOLANDI** (2026-07-13 05:0x) — QUIZ `302103123012`, INLINE `{s2:1,s5:3,s7:0,s9:2,s12:1}`, ACH `{s3,s6,s10,s12}`, 18 ekran, tell 0/12. **Tekshiruvchi 8 ta ekranda yetishmayotgan `optionalLive` ni tuzatdi** (jonli darsda sinf mentordan orqada qolardi) | — |
| `FullProPipelineLesson` | ✅ **IMZOLANDI** — QUIZ `032130120132`, INLINE `{s4:1,s8:3,s10:0,s14:2,s15:0}`, ACH `{s4,s10,s14,s15}`, 20 ekran, tell 0/12, `passed>=0.6` (v16'da HAR DOIM `true` edi). Jonli 2 ta TEKIN nishonni scored ekranga ko'chirdi; SAYQAL s4'da **noto'g'ri kalit-moslik** (to'g'ri matn boshqa indeksda) va yo'q `vcard` CSS'ini topdi | — |
| `AiPipelineProjectLesson` | ✅ **IMZOLANDI** — QUIZ `201301321302`, INLINE `{s4:0,s8:3,s10:1,s14:2,s15:0}`, ACH `{s9,s10,s13,s15}`, 20 ekran, tell 0/12+0/4. s9 «usta ADAShADI» tuzog'i kod darajasida tasdiqlangan | — |

## ✅✅ 4c-MODUL YOPILDI 5/5 — JAMI 10/10 DARS IMZOLANDI (4a 3/3 · 4b 2/2 · 4c 5/5)
Barchasi App.jsx'da (`MODULES[4]/[5]/[6]`), `npx vite build` TOZA.

## 🟢 5-MODUL — ISHDA (8 dars)
| Dars | Holat | QUIZ seq · INLINE_KEYS |
|---|---|---|
| `BotIntroLesson` (etalon) | ✅ **IMZOLANDI** — 4 nishon (`keyMaster` s6 · `sheetMaster` s7 · `neverSilent` bonus · `sheetWriter` s13) | `021320311302` · `{s4:3,s8:0,s10:2,s14:3,s15:0}` · tell 0/12+0/4 · 20 ekran |
| `BotApiButtonsLesson` | ✅ **IMZOLANDI** (s15 RecapOverlay ulandi; JSX `\'` escape bug'i tuzatildi) | `203112033120` · `{s4:1,s8:3,s10:0,s14:2,s15:0}` · ACH `{s9,s11,s12,s13}` · tell 0/12+0/4 |
| `BotStatefulMemoryLesson` | ✅ **IMZOLANDI** (Tekshiruvchi 113 qator o'lik kod tozaladi) | `230131022013` · `{s4:2,s8:1,s10:3,s14:0,s15:0}` · ACH `{s8,s10,s13,s15}` · tell 0/12 · 20 ekran |
| `BotAiBrainLesson` | Quruvchi ✅ **TOZA** (bosh agent dasturiy tekshirdi: QUIZ band emas, tell 0/12+0/4, INLINE↔correctIdx mos, 4 nishon, RecapOverlay 2 joyda, taqiq so'zlar 0, `placeCorrect`/`.png` yo'q). **JONLI KERAK EMAS** — Quruvchi uning ishini ham qilgan | → **SAYQAL** → Tekshiruvchi → Verifikator |
| `BotAiAgentLesson` | ✅ **IMZOLANDI (2026-07-14)** — Quruvchi 2-aylanish (1-marta AiBrain kontenti qolib ketgan, agent mavzusiga qayta yozildi: idrok→qaror→amal, TOOLS/GUARDS) · Jonli 10/10 · Tekshiruvchi TAYYOR (o'lik .desk/.dial CSS tozalandi) · Verifikator: esbuild+bundle toza, grapheme-tell 1/12, 3/3/3/3, App m5-10 | ✅ `bot-ai-agent-05-10-v18` |
| `BotFeedbackIterationLesson` | ✅ **IMZOLANDI** (📔 TILAKLAR DAFTARI · voronka · yaxshilash aylanasi) | ✅ |
| `BotFullProjectLesson` | ✅ **IMZOLANDI (2026-07-14)** — 🏠 DOIMIY JOY (deploy=ko'chirish, server=doim yoqilgan kompyuter) · Quruvchi→Metodist→Jonli 10/10→Tekshiruvchi(QA 1-aylanish: arena Q10/Q6 grapheme uzunlik-tell tuzatildi)→Verifikator: esbuild+bundle toza, grapheme-tell **0/12**, App m5-07 | ✅ `bot-full-project-05-07-v18` |
| `BotAiProjectLesson` | ✅ **IMZOLANDI (2026-07-14)** — ⭐ capstone/vibecoding (direktor↔yozuvchi, panel 8/8 to'ladi) · Quruvchi(+QUIZ 11→12)→Metodist→Jonli 10/10→Tekshiruvchi TAYYOR(o'lik desk/dial/claim CSS tozalandi)→Verifikator: esbuild+bundle toza, grapheme yaqin-tenglik ≤1.16×, App m5-05 | ✅ `bot-ai-project-05-05-v18` |

> **🟢 5-MODUL BOT DARSLARI TO'LIQ YOPILDI (2026-07-14):** 8/8 Bot darsi Etalon v18 (Intro·ApiButtons·StatefulMemory·AiBrain·AiAgent·Feedback·FullProject·AiProject), hammasi `set_quiz_keys`+QUIZ 12+3/3/3/3, App.jsx m5-01..m5-11 (Bot slotlari), **umumiy `npx vite build` TOZA** (exit 0, 3 yangi chunk dist'da). PM darslari (PmLesson19/20/21) — foydalanuvchi qarori bilan REJADAN TASHQARI. Jonli-sinov (yangi PIN + 2 o'quvchi + MENTOR-2026, podium/arena 0 emas) va COMMIT — foydalanuvchida.
> **Partiya saboqlari (2026-07-14):** (1) Quruvchi «yaqin qardoshni verbatim ko'chirish» qilsa KONTENT ham ko'chib qolishi mumkin — BotAiAgent 1-aylanishda AiBrain mavzusida qoldi (43 residue), 2-aylanish git-asl skeletdan agent pedagogikasini tiklab tuzatdi. (2) **GRAPHEME uzunlik-tell** — Metodistlar String.length bilan o'lchaydi, emoji uzunlikni buzadi; Intl.Segmenter bilan qayta o'lchash SHART (B da 2/12 String.length «toza» edi, grapheme 2.3–2.95× tell ochdi). Bosh agent Verifikatorda grapheme-metrikani majburiy qildi.

> ⚠️ **3 ta agent limit yaqinida API xatosi bilan uzildi** (07:2x–07:3x). Fayllar har safar tekshirildi — buzilish YO'Q. Limit 95%dan oshganda og'ir Quruvchi agentini ishga tushirmang.
| `BotFeedbackIterationLesson` | ⬜ navbatda | — |
| `BotFullProjectLesson` | ⬜ navbatda | — |
| `BotAiProjectLesson` | ⬜ navbatda | — |

**BotIntro topilmalari (etalon uchun muhim):** Jonli s14'da `correctIdx={1}` vs `INLINE_KEYS.s14=2` **mos kelmasligini** topdi (to'g'ri javob bergan o'quvchi XATO hisoblanardi!) · SAYQAL arena fon tokenlari NestJS darsidan qolganini topdi · Tekshiruvchi 2 ta o'lik komponent o'chirdi. Markaziy o'yinlar (s6 kalit-o'g'irlash, s7 tungi smena) kod darajasida ishlashi tasdiqlangan.

🔴 **TAKRORLANUVCHI XATO (7 martadan 7 marta!):** Quruvchi agentlari etalonni ko'chirganda **`QUIZ_BANK.correct` va `INLINE_KEYS` qiymatlarini ham ko'chirib yuboradi**. Har Quruvchi promptida ogohlantirilsa ham takrorlanadi. Jonli roli buni har safar tutadi — **zanjir shuning uchun kerak.**
| **App.jsx** | ✅ **ULANDI** (2026-07-13) — `MODULES[4]` 4a (m4a-01..03) · `[5]` 4b (m4b-01..02) · `[6]` 4c (m4c-01..05). **`npx vite build` TOZA** (faqat odatiy chunk-size ogohlantirishi) | 5-Modul tugagach yana ulanadi |

**FullProPipeline uchun (Ijodkor KERAK EMAS):** mavzu = professional lenta — **PARALLEL LENTALAR** (matrix, Node 18/20/22) · **YAQIN JAVON** (cache: 40s→8s) · **SEYF/MAXFIY KALIT** (secret ochiq yozilsa butun dunyo ko'radi) · **SINOV REYSI**→**HAQIQIY REYS** (staging→production) · **ESKI YUKNI QAYTARISH** (rollback: buzuq versiya uchib ketdi → bir bosishda qutqarish). `lessonId = 'cicd-full-pro-4c-04-v18'`.
🔴 **FullProPipeline maxsus bug (`:926` atrofida):** `passed` HAR DOIM `true` — 4 testdan 0 tasini to'g'ri qilgan bola ham «o'tgan» bo'lib chiqadi. REAL chegara qo'yilsin (≥3/4).

**FullPipelineProject qiymatlari (🔒):** QUIZ=`302103123012` · INLINE `{s2:1,s5:3,s7:0,s9:2,s12:1,practice:-1}` · ACH `{s3,s6,s10,s12}` · 18 ekran · tell 0/12.
⚠️ **FullPipelineProject ochiq shubha:** `optionalLive` faqat praktika ekraniga berilgan (`:1486`) — jonli darsda qulflangan exploration ekranlarida o'quvchi mentordan orqada qoladi. Tekshiruvchi buni MAJBURIY tekshirsin.

**AiPipelineProject uchun (Ijodkor KERAK EMAS — metafora qulflangan):** mavzu = **LENTA USTASI** (AI-yordamchi: qizil chiroq yonsa LENTA JURNALINI o'qib sababni aytadi va tuzatish taklif qiladi — lekin tugmani BARIBIR SIZ bosasiz). `lessonId = 'cicd-ai-pipeline-4c-05-v18'`. Kasalliklar: `placeCorrect` · `mentor.png` import · soxta gate/final · javob oshkorligi · `correctIdx` hammasi 0 · uzunlik-tell.

**Band QUIZ seq (yangi dars BULARDAN FARQLI bo'lsin):** `130230210231` · `310213021320` · `203102133102` · `321132001023` · `231032010123` · `201302312301` · `102021323013` · `302103123012` · `032130120132` · `201301321302` · `021320311302` · `203112033120` · `230131022013` · `130210312302`

---

## 📦 KEYINGI QAMROV — 5-Modull (foydalanuvchi qo'shdi, 2026-07-13)
> 4c tugagach **AVTOMATIK boshlanadi**. Partiya rejasini bosh agent o'zi tuzadi va avtopilotda oxirigacha yuritadi.
> **Qamrov: 8 dars** (`src/5-Modull/`, hammasi v16 kasal shablon, ~90-99KB):
> `BotIntroLesson` · `BotApiButtonsLesson` · `BotStatefulMemoryLesson` · `BotAiBrainLesson` · `BotAiAgentLesson` · `BotFeedbackIterationLesson` · `BotFullProjectLesson` · `BotAiProjectLesson`
> 🚫 **PmLesson19/20/21 — TEGILMAYDI** (foydalanuvchi qarori: PM darslari hozirgi holicha qoladi).

**Zanjir (siqilgan, sinovdan o'tgan):** Ijodkor (faqat 1-dars — metafora yuzini QULFLAYDI + MAPPING JADVALI) → Quruvchi → Jonli → SAYQAL (Metodist+Anim+Dizayn) → Tekshiruvchi → **Verifikator = BOSH AGENT o'zi** (bash: esbuild + `--bundle` + node eval uzunlik-tell + INLINE_KEYS↔JSX). Bir vaqtda **3 agent** (Sonnet).

### 🔒 5-MODUL METAFORA — QULFLANDI: «BOTJON — uxlamaydigan yordamchi»
> Ijodkor (BotIntro) qaror qildi. **8 darsda ham AYNAN shu lug'at.**
> **TAQIQ:** zavod (2-Modul) · robot/JESTBOT/mashina (4b) · konveyer/lenta/chamadon/nuqta/skaner/uchirish/yo'l xaritasi/seyf/tablo (4c) · restoran/ofitsiant/oshpaz/anketa/omborchi/retsept/oshxona (4a) · qo'riqchi (4-Modul) · pochtachi (4-Modul) · «sir» · **«miya»** (inson a'zosi — MATN_ETALONI 4.1 taqiqi)

| TEXNIK ATAMA | METAFORA SO'ZI |
|---|---|
| bot | **BOTJON** — uxlamaydigan yordamchi (24/7, charchamaydi) |
| BotFather | **ro'yxat idorasi** (kalit beriladigan joy) |
| token | 🔑 **KALIT** — kalit kimda bo'lsa, Botjon o'shanga bo'ysunadi |
| .env | **qulfli tortma** (kodda faqat `process.env` yozuvi ko'rinadi) |
| Bot API | **xizmat oynasi** (kalitsiz ochilmaydi) |
| handler | 📋 **varaqdagi bitta qator** (`signal → amal`) |
| trigger | **signal** · action = **amal** |
| komanda (`/start`) | **chaqiruv so'zi** |
| ctx | ✉️ **konvert** (kim yozdi, nima yozdi, qayerga javob) |
| inline tugma | **xabar ustidagi tugma** · reply = **pastdagi tugmalar taxtasi** |
| polling | **o'zi so'rab turish** · webhook = **qo'ng'iroq** |
| state / xotira | 📓 **DAFTAR** · stateless = **daftarsiz** |
| in-memory | **cho'ntakdagi varaqcha** (o'chsa yo'qoladi) · DB = **doimiy daftar** |
| sessiya | **daftardagi bitta mijoz sahifasi** |
| LLM / model | 🧭 **maslahatchi** (ko'p o'qigan, lekin **sizni ESLAMAYDI**) |
| prompt | **topshiriq** · system prompt = 📜 **yo'riqnoma** |
| kontekst oynasi | **stol usti** (joyi cheklangan — to'lsa eng eski varaq tushadi) |
| temperature | **erkinlik murvati** |
| agent | 🧰 **asbob sumkasi ko'targan Botjon** (gapirmaydi — **ish bajaradi**) |
| tool-call | **sumkadan asbobni olish** · tashqi API = **tashqi xizmat** |
| guardrails | **sumkadagi chegara** (pul ishida odamdan ruxsat) |
| iteratsiya | **yaxshilash aylanasi** · foydalanuvchi fikri = 📔 **tilaklar daftari** |
| deploy | **ko'chirish** · server = 🏠 **doim yoqilgan kompyuter (doimiy joy)** |
| error handling | **yiqilmaslik qoidasi** · fallback = **oxirgi qator** («jim qolmaslik») |
| rate limit | **tezlik cheklovi** |
| vibecoding | **direktor va yozuvchi** (siz — direktor, AI — yozuvchi) |

**🎒 JIHOZLAR PANELI (s1'da har darsda takrorlanadi — 8 uyacha, yangisi yonadi):**
1 BotIntro 🔑+📋 (**javob bera oladi**) · 2 ApiButtons 🔘+✉️ (**muloqot qiladi**) · 3 StatefulMemory 📓 (**eslab qoladi**) · 4 AiBrain 🧭+📜 (**o'ylay boshlaydi**) · 5 AiAgent 🧰 (**ish bajaradi**) · 6 Feedback 📔 (**yaxshilanadi**) · 7 FullProject 🏠 (**doim yashaydi**) · 8 AiProject ⭐ (**to'liq jihozlangan**)

**BotIntro markaziy tajribalari:** (1) **TUNGI SMENA** (s7) — bola bo'sh varaqni to'ldiradi, 03:00 da 4 mijoz keladi; varaqda qator yo'q → Botjon JIM QOLADI → mijoz kulrangga so'nib ketadi («Xizmat 2/4 · Ketib qoldi 2»); tuzatib qayta o'tkazadi → 4/4; bonus: **fallback qatori**. (2) **KALIT SINOVI** (s6) — bola kalitni ATAYLAB ochiq kodga qo'yadi → skrinshot → notanish odam nusxalaydi → **bot uning nomidan mijozlarga firibgar xabar yuboradi** → bola o'z botiga buyruq berolmaydi → **revoke → yangi kalit → .env** bilan qutqaradi.
**Nishonlar:** `Kalit ustasi` (revoke+.env) · `Varaq ustasi` (4/4 smena) · `Jim qolmadi` (fallback qatori).
**BotIntro'da tozalanadigan matn:** «miyasi» (~264, ~633) → «qoidalar varag'i» · «pochtachi» (~562, ~930, ~943) → «xizmat oynasi» · «siri» (~446, ~712) va 🙈 (~718) → olib tashlanadi.

**Har darsda kutiladigan kasalliklar (o'sha kasal shablon):** `placeCorrect()` (podium 0) · `mentor.png` lokal import (vite build blokeri) · soxta gate/final (`correct: true` qattiq) · javob oshkorligi (yorliq/tooltip/marker) · `correctIdx` hammasi 0 · **uzunlik-tell** (to'g'ri javob eng uzun variant — mezon: arena ≤4/12, inline ≤2/5, node+eval bilan o'lchanadi) · passiv gate'lar · tekin nishonlar.

**YAKUNIY QADAM (5-Modul tugagach):** `src/App.jsx` ga barcha yangi modullarni ulash — 4a, 4b, 4c, 5-Modul + umumiy `vite build` (toza bo'lishi shart) + to'liq hisobot. **COMMIT YO'Q.**
- Hammasi esbuild+`--bundle`+jsdom toza, INLINE_KEYS↔JSX 1:1 tasdiqlangan, `placeCorrect` yo'q, `.png` import yo'q.
  - QUIZ seq (🔒 regressiya nazorati): Alive=`130230210231` · Resource=`310213021320` · Practice=`203102133102` · JestUnit=`321132001023` · EdgeCases=`231032010123`
  - INLINE_KEYS: Alive `{s4:1,s8:3,s10:0,s16:2,s19:0}` · Resource `{s4:2,s7:3,s9:1,s11:0,s14:1,s17:0}` · Practice `{s5:2,s8:0,s12:3,s15:1}` · JestUnit `{s4:2,s8:1,s11:3,s14:0,s16:1}` · EdgeCases `{s4:2,s8:1,s11:3,s14:0,s16:1}` (hammasida `practice:-1`)
- **4c metafora QULFLANDI** — «UCHISH LENTASI» (pastda mapping jadvali).
- 🔴 **YANGI TIZIMLI BUG-SINFI — UZUNLIK-TELL.** Har darsda chiqmoqda: to'g'ri javob deyarli har doim ENG UZUN variant (Resource 11/12, JestUnit 9/12 + inline 5/5). Bola savolni O'QIMASDAN «eng uzunini bos» bilan arenani yorib o'tadi = `placeCorrect` darajasidagi ball-bug. **Har Quruvchi/SAYQAL promptiga majburiy kiritiladi.** Mezon: arena ≤4/12, inline ≤2/5. Sog'lom namuna: Alive=2/12.

### ⚠️ UZUNLIK-TELLNI TO'G'RI O'LCHASH (agentlar buni XATO o'lchaydi!)
Xom manba matnidan o'lchash (`\'` escape, qo'shtirnoq belgilari) **YOLG'ON raqam beradi** — bir agent 5/12 ni «4/12» deb hisobot berdi. **node + eval** bilan haqiqiy string uzunligini o'lchash SHART:
```js
const m = src.match(/const QUIZ_BANK\s*=\s*(\[[\s\S]*?\n\]);/); const bank = eval(m[1]);
let tell = 0; bank.forEach(q => { const lens = q.opts.map(o => String(o).length); if (lens[q.correct] === Math.max(...lens)) tell++; });
```
Ba'zi Verifikatorlar umuman BOSHQA narsani o'lchagan («indeks chastotasi 3/12») — bu uzunlik-tell EMAS.

**Jonli o'lchov (2026-07-13, node bilan tasdiqlangan):** Alive 2/12 ✅ · Resource 4/12 ✅ · **Practice 5/12 ❌ QARZ** · JestUnit 4/12 ✅ · EdgeCases 0/12 ✅
🔴 **QARZ:** `NestArchPracticeLesson` (imzolangan, lekin uzunlik-tell qoidasi kashf qilinishidan OLDIN) — arena 5/12. Bo'sh slot bo'lganda tuzatilsin (5 savolda distraktorni uzaytirish; `correct` seq `203102133102` TEGILMASIN).

### Partiya jadvali (3 agent/partiya)
| # | Agent A | Agent B | Agent C |
|---|---|---|---|
| **P1** | Alive → **Verifikator** | Resource → **Jonli** (4 bug) | JestUnit → **Dizayn** |
| **P2** | Resource → Metodist | JestUnit → Animatsiya | EdgeCases → **Quruvchi** |
| **P3** | Resource → Tekshiruvchi | JestUnit → Jonli (2 bug) | **CiCdIntro → Ijodkor** 🔑 (4c METAFORA YUZINI QULFLAYDI + MAPPING JADVALI) |
| **P4** | Resource → **Verifikator** → **4a YOPILDI 3/3** | JestUnit → Metodist | EdgeCases → Dizayn |
| **P5** | JestUnit → Tekshiruvchi | EdgeCases → Animatsiya | CiCdIntro → Quruvchi |
| **P6** | JestUnit → **Verifikator** | EdgeCases → Jonli | GithubActions → Ijodkor |
| **P7** | EdgeCases → Metodist | CiCdIntro → Dizayn | FullPipelineProject → Ijodkor |
| **P8** | EdgeCases → Tekshiruvchi | CiCdIntro → Animatsiya | FullProPipeline → Ijodkor |
| **P9** | EdgeCases → **Verifikator** → **4b YOPILDI 2/2** | CiCdIntro → Jonli | AiPipelineProject → Ijodkor |
| **P10+** | **4c dumalab boruvchi konveyer:** 5 dars, bir vaqtda 3 tasi yo'lda, har partiyada har biri BIR rol oldinga. Zanjir: Quruvchi → Dizayn → Animatsiya → Jonli → Metodist → Tekshiruvchi → Verifikator. Taxminan **P10–P22**. |
| **YAKUN** | App.jsx: `MODULES[4]` 4a (m4a-01..03) · `[5]` 4b (m4b-01..02) · `[6]` 4c (m4c-01..05) + umumiy `vite build` + hisobot. **COMMIT YO'Q.** |

### 4c — 5 darsda BIRDEK tuzatiladigan 6 kasallik (Quruvchi promptiga majburiy)
1. `placeCorrect()` O'CHIRILADI → variantlar STATIK manba tartibida (display-indeks === server kaliti). Podium/arena 0 shu yerdan.
2. `import mentorImg from '../../assets/common/mentor.png'` → **`MENTOR_IMG` URL-const** (vite build blokeri, 6/6 faylda bor).
3. Soxta final: `correct: true` qattiq yozilgan (GithubActions'da 8 joyda) → real kalit.
4. `FullProPipelineLesson` — `passed` HAR DOIM `true` → real chegara (masalan 3/4).
5. Javob oshkorligi: yorliqdagi ❌/✅, tooltip, `// ?` marker, placeholder ichidagi javob → o'chiriladi.
6. `correctIdx` hammasi 0 + to'g'ri javob doim eng uzun variant → aralashtiriladi.
Qo'shimcha: passiv gate (9-10 ta) → interaktiv; nishon FAQAT scored/xato-imkoniyatli ekranga; `practice: -1` sentinel; `optionalLive` qulflangan ekranlarga.

### 🔒 4c METAFORA — QULFLANDI: «UCHISH LENTASI» (aeroport bagaj lentasi)
> Ijodkor (CiCdIntro) qaror qildi. **5 darsda ham AYNAN shu lug'at** — mentor matni, RECAP, flashcard, test variantlari, nishon tavsiflari, uy vazifasi.
> **TAQIQ (4c bo'ylab, hozir 95 o'rinda uchraydi — TOZALANADI):** zavod ❌ (2-Modul Sikl zavodi) · robot ❌ (4b JESTBOT) · konveyer ❌ · qo'riqchi ❌ (4-Modul) · retsept/oshxona/restoran/ofitsiant/oshpaz/ombor ❌ (4a) · darvoza ❌ · puls ❌ · pochtachi ❌ · «sir» ❌ (→ maxfiy kalit)
> **Nuqtalarda ODAM ham, ROBOT ham turmaydi — MASHINA turadi** (CI/CD g'oyasi: odam qo'li tegmaydi).

| TEXNIK ATAMA | METAFORA SO'ZI |
|---|---|
| commit | **yig'ilgan chamadon** |
| push | **lentaga qo'yish** |
| pipeline | **LENTA** (uchish lentasi) |
| stage / job | **NUQTA** (tekshiruv nuqtasi) |
| step | **AMAL** |
| CI | **hamma chamadon bitta lentada** (bir xil sharoit — «mening kompimda ishlayapti» yo'q) |
| CD | **avtomatik uchish** (yashil → o'zi yetkaziladi) |
| install | 📦 **YIG'ISH nuqtasi** |
| test | 🔍 **SKANER** |
| lint | 📐 **O'LCHAM RAMKASI** |
| build | 🎁 **O'RASH** |
| deploy | ✈️ **UCHIRISH** |
| live / production | **yo'lovchi qo'lida** / haqiqiy reys |
| staging | **sinov reysi** |
| runner | **LENTA MASHINASI** (`runs-on`) |
| workflow YAML | **YO'L XARITASI** (`ci.yml`) |
| trigger (`on: push`) | **START SIGNALI** |
| artefakt | **O'RALGAN YUK** |
| yashil ✓ / qizil ✗ | **YASHIL CHIROQ / QIZIL CHIROQ** (qizil → lenta TO'XTAYDI) |
| skipped | **o'tkazib yuborildi** |
| logs | **LENTA JURNALI** (qizil chiroq sababi shu yerda) |
| rollback | **ESKI YUKNI QAYTARISH** |
| secret / env | **SEYF** va **MAXFIY KALIT** |
| matrix | **PARALLEL LENTALAR** |
| cache | **YAQIN JAVON** |
| status badge | **TABLO** (aeroport tablosi) |
| AI-yordamchi (AiPipeline) | **LENTA USTASI** (jurnalni o'qib sababni aytadi; tugmani baribir SIZ bosasiz) |

**CiCdIntro markaziy tajribasi (s9, «dinozavr» ekvivalenti):** bola chamadonga 5 buyumdan xohlaganini soladi (3 tasi nuqsonli: `login.js`=test yiqiladi · `stil.css`=lint buzadi · `rasm.jsx`=build yiqiladi) → «Lentaga qo'ying» → lenta aylanadi, jurnal qator-qator yozadi → **AYNAN mos nuqta qizil bo'ladi, lenta TO'XTAYDI, samolyot uchmaydi**, o'ng paneldagi foydalanuvchi telefonida ESKI sayt qoladi → bola tuzatib qayta yuboradi → hamma yashil → samolyot uchadi, telefonda yangi sayt. Mentor: «Siz buzuq kodni push qildingiz — lekin foydalanuvchi buni umuman ko'rmadi.»
Nishonlar: `Red Light` (s9 sababni jurnaldan topish) · `Cleared for Takeoff` (s9 tuzatib to'liq yashil) · `Order Matters` (s15 tartib 1-urinishda) · `Route Reader` (s13 ci.yml 3 bo'shliq xatosiz).

---

## 🔴 ARXIV — 4a-Modull (NestJS), TO'LIQ AVTOPILOT (2026-07-12)
> **VAKOLAT:** foydalanuvchi: «boladi boshla avto rejimda bajar ozing toliq boshqar oficedayam 4a modull korinsin» — tasdiq so'ralmaydi, oxirigacha o'zim boshqaraman.
> **Qamrov:** `src/4a-Modull/` — NestArchAlive · NestArchResource · NestArchPractice (3 dars, bitta parallel partiya, har biri o'z zanjirida).
> **PmLesson15 — REJADAN TASHQARI** (PM darsi; ofisda K-belgisi bilan ko'rinadi).
> **Ofis:** `pipeline-state.js` + `office-deploy/pipeline-state.js` — yangi `module:5` «4a — NestJS arxitektura» (🪺, #E0234E). ✅ QO'SHILDI.
> **Zanjir:** 0 Auditor → 0.5 Ijodkor → 1 Quruvchi → 2 Dizayn → 3 Animatsiya → 4 Jonli → 5 Metodist → 6 Tekshiruvchi (maks 2 qaytarish) → 7 Verifikator. Har o'tishda `office-mark.py done <rol> <Fayl.jsx>`.
> **Spetsifikatsiya:** Etalon v18 · audio STUB (matn YOZILMAYDI, N/A) · `MENTOR_IMG` URL-const (lokal import esbuildni yiqitadi — 4/4 faylda bor!) · JONLI PRAKTIKA mentor-gate (`ScreenLivePractice`, `PRACTICE_BASE=500`, KOD KIRITILMAYDI) · `INLINE_KEYS`+`QUIZ_BANK` 12 (3/3/3/3, `QUIZ_MS=15000`) · RECAPS+RecapOverlay · lessonId `-v18`.
> **4 tizimli bug oldini olish (M4-P2 saboqlari) — har rol promptida:** (1) QUIZ `correct` naqshi mexanik bo'lmasin; (2) `practice: -1` sentinel; (3) `optionalLive` qulflangan ekranlarga; (4) nishon faqat scored/xato-imkoniyatli ekranga.
> **Jonli agent hisobotiga ISHONMANG** — `correct` ketma-ketligini skript bilan tekshiring (o'tgan safar 3 agent yolg'on «PASS» berdi).
> **Yakunda:** App.jsx `MODULES[4]` (m4a-01..03) + umumiy vite build + hisobot. **COMMIT YO'Q.** Jonli-sinov foydalanuvchida.
> Audit/brief fayllar: `<scratchpad>/audit-<Fayl>.md`, `brief-<Fayl>.md`.

## ⏸️ SESSIYA TO'XTASH NUQTASI (2026-07-12, soatlik limit 95%) — 1 soatdan keyin DAVOM
> **Qamrov kengaydi:** 4a (3 dars) + **4b** (2 dars) + **4c** (5 dars) = **10 dars**, 3 modul parallel.
> Ofis: 5-qavat 4a 🪺 · 6-qavat 4b 🧪 · 7-qavat 4c 🔄 — hammasi `pipeline-state.js` + `office-deploy/` da.

### HOLAT JADVALI (davom etishda shu yerdan boshlang)
| Qavat | Dars | Bosqich | Keyingi qadam |
|---|---|---|---|
| 4a | `NestArchPracticeLesson` | ✅ **IMZOLANDI 9/9** | — (App.jsx ulash modul yakunida) |
| 4a | `NestArchAliveLesson` | Tekshiruvchi ✅ O'TDI → **Verifikator 🔵 fonda** | Verifikator natijasini kuting → IMZO |
| 4a | `NestArchResourceLesson` | **Dizayn 🔵 fonda** | → Animatsiya → Jonli → Metodist → Tekshiruvchi → Verifikator |
| 4b | `JestUnitTestLesson` | **Dizayn 🔵 fonda** | → Animatsiya → Jonli → Metodist → Tekshiruvchi → Verifikator |
| 4b | `EdgeCasesTestLesson` | **Quruvchi 🔵 fonda** | → Dizayn → ... |
| 4c | `CiCdIntroLesson` | **Ijodkor 🔵 fonda** (metafora chegarasi yuborilgan) | Brief kelgach → Quruvchi |
| 4c | `GithubActionsLesson` | **Ijodkor 🔵 fonda** | → Quruvchi |
| 4c | `FullPipelineProjectLesson` | **Ijodkor 🔵 fonda** | → Quruvchi |
| 4c | `FullProPipelineLesson` | **Ijodkor 🔵 fonda** | → Quruvchi |
| 4c | `AiPipelineProjectLesson` | Auditor ✅ · **Ijodkor HALI ISHGA TUSHIRILMAGAN** | 🔴 IJODKORNI ISHGA TUSHIRING |

⚠️ **Fon-agentlar tugaganda ofisda O'ZI belgilanmaydi** — `python3 .claude/hooks/office-mark.py done <rol-indeks> <Fayl.jsx> <sek>` QO'LDA chaqirilishi shart (0 auditor · 1 ijodkor · 2 quruvchi · 3 dizayn · 4 anim · 5 jonli · 6 metodist · 7 tekshiruvchi · 8 verifikator).

### 🔴 OCHIQ ISHLAR (davom etishda MAJBURIY)
1. **`AiPipelineProjectLesson` Ijodkori ishga tushirilsin** (audit tayyor: `<SP>/audit-AiPipelineProjectLesson.md`).
2. **4c metafora qarori** — CiCdIntro Ijodkoriga chegara yuborildi: KONVEYER/LINIYA g'oyasi QOLADI, lekin «zavod» (JsLoops SIKL ZAVODI bilan to'qnashadi), «robot» (4b JESTBOT), «qo'riqchi» (4-Modul), «retsept/oshxona» (4a), «darvoza», «puls» — TAQIQ. U yangi yuz topadi + MAPPING JADVALI beradi → qolgan 4 dars unga ergashadi (kerak bo'lsa SendMessage bilan yetkazing).
3. **`JestUnitTestLesson` Jonli roliga:** QUIZ_BANK = `012301230123` (TAQIQLANGAN MEXANIK SIKL) + 4/4 inline `correctIdx=0` → qayta joylashtirilsin.
4. **`NestArchResourceLesson` Jonli roliga:** (a) QUIZ_BANK = `012301230123` (taqiq); (b) 5 inline test `correctIdx=0`; (c) `:1668` `ACH_TRIGGERS` da `practice: 'grandOpening'` — nishon «Bajardim» bir bosishiga bog'langan, TEKIN; (d) `s17: -1` — ballik final challenge, real kalit qo'yilsin.
5. **4c 5/5 darsda:** `placeCorrect` mina · build blokeri (`mentor.png`) · soxta final (`correct:true` qattiq) · soxta challenge · `correctIdx` hammasi 0 · to'g'ri javob eng uzun · passiv gate (9-10 ta) · takror bo'g'inlar. `FullProPipeline` da qo'shimcha: **`passed` HAR DOIM `true`** (`:926` — hech kim yiqilmaydi).
6. **Modul yakunida:** App.jsx'ga ulash — 4-Modul, 4a, 4b, 4c hech biri hali `src/App.jsx` da YO'Q (`MODULES[4]`, `[5]`, `[6]` qo'shiladi) + umumiy `vite build`.
7. **COMMIT YO'Q** (foydalanuvchi buyrug'isiz). Jonli-sinov (yangi PIN, MENTOR-2026, 2 o'quvchi) — foydalanuvchida.

### Audit/brief fayllar (scratchpad)
`<SP>` = `/tmp/claude-1000/-home-kali-Desktop-InternetLesson/20b7e79f-f79c-4c37-b9f6-3f53019ede95/scratchpad`
audit-*.md: NestArchAlive · NestArchResource · NestArchPractice · JestUnitTest · EdgeCasesTest · CiCdIntro · GithubActions · FullPipelineProject · AiPipelineProject · FullProPipeline (10/10 tayyor)
brief-*.md: NestArchAlive · NestArchResource · NestArchPractice · JestUnitTest · EdgeCasesTest (5 tayyor; 4c briflar fonda)

### Metafora lug'ati (modul bo'yicha, TO'QNASHMASIN)
- **4a** = RESTORAN (bo'lim=Module · ofitsiant=Controller · oshpaz=Service · anketa=DTO · javon chizmasi=Entity · OMBOR=PostgreSQL · 📦omborchi=Repository · retsept kitobi=BaseService · 🪧KIRISH TAXTASI=imports · 🛡️ESHIK QO'RIQCHISI=Guard · YORLIQ=@ManyToOne)
- **4b** = funksiya=MASHINA + **JESTBOT** (robot-sinovchi) + **ETALON KARTOCHKASI** (`expect().toBe()`); 2-darsda **SHUMTAKA** (−5 kitob buyurib qaytim so'raydigan mijoz). Qonun: javob yorliqda turmaydi, xato bosilganda DALIL qaytadi; hakam=`JestRun` terminali.
- **4c** = KONVEYER/LINIYA (yuz — CiCdIntro Ijodkori qulflaydi; «zavod» TAQIQ)

### M4a holat jurnali
- 2026-07-12: ofis 5-qavati qo'shildi · 3 dars 0-bosqichda (Auditor) 🔵
- 2026-07-12: Auditor 3/3 ✅ · Ijodkor 3/3 ✅ (RESTORAN metaforasi — foydalanuvchi qarori, 3 darsda izchil lug'at) · Quruvchi 3/3 ✅ (esbuild 3/3 toza, `placeCorrect` 3/3 o'chdi, MENTOR_IMG 3/3, kod-input 3/3 o'chdi) · Dizayn 🔵

**🔴 JEST DARSIGA (4b) JONLI ROLIGA:** `JestUnitTestLesson` QUIZ_BANK correct = `012301230123` — **TAQIQLANGAN MEXANIK SIKL** (Quruvchi qo'ygan; rasman 3/3/3/3, mohiyatan naqsh). Qayta joylashtirilsin. Ayni paytda 4/4 inline testda `correctIdx=0` (`{s4:0,s8:0,s11:0,s14:0}`) — variantlar aralashtirilsin.

**🔴 RESOURCE DARSIGA QOLGAN BUG (Practice Tekshiruvchisi topdi, dasturiy tasdiqlandi):**
`NestArchResourceLesson.jsx:1668` — `ACH_TRIGGERS = { ..., practice: 'grandOpening' }` → nishon PRAKTIKA «✅ Bajardim» tugmasiga bog'langan = BIR BOSISHDA TEKINGA beriladi (DARS_ETALON 10-bandi taqiqlaydi). Practice va Alive darslarida bu xato YO'Q. Jonli/Tekshiruvchi roliga topshirilsin: `practice` kaliti ACH_TRIGGERS dan OLIB TASHLANSIN (scored/real-xato ekranga ko'chirilsin).

**🔴 JONLI ROLIGA MAJBURIY IShLAR (dasturiy tekshiruvda topildi, agent hisobotlariga ISHONMANG):**
1. `NestArchResourceLesson` — QUIZ_BANK correct = `012301230123` = **TAQIQLANGAN MEXANIK SIKL**. Qayta joylashtirilsin (matn o'zgarmaydi, faqat pozitsiya swap). Alive=`130230210231` ✅ · Practice=`203102133102` ✅ — bular YAXSHI, TEGILMASIN.
2. **3/3 darsda inline testlarda `correctIdx` hammasi 0** (javob doim A varianti): Alive `{s4:0,s8:0,s10:0,s16:0}` · Resource `{s4:0,s7:0,s9:0,s11:0,s14:0}` · Practice `{s5:0,s8:0,s12:0,s15:0}`. Variant massivlari aralashtirilib, INLINE_KEYS mos yangilansin.
3. `s19: -1` (Alive) va `s17: -1` (Resource) — bu ekranlar BALLIK final challenge (real xato imkoniyati bor). `-1` = «ishtirok savoli, doim to'g'ri» → soxta final qaytadi. Tekshirilsin: ballik bo'lsa haqiqiy `correctIdx` qo'yilsin.

### Metafora lug'ati (3 darsda majburiy, o'zgarmaydi)
Restoran=NestJS ilova · bo'lim=Module · ofitsiant/sotuvchi=Controller · oshpaz=Service · anketa=DTO (PartialType=qisman anketa) · javon chizmasi=Entity · OMBOR=PostgreSQL · omborchi=Repository · retsept kitobi=BaseService (ASBOB, aktyor emas) · KIRISH TAXTASI=AppModule.imports (yozilmagan bo'lim=404) · ESHIK QO'RIQCHISI=Guard · nazoratchi=FAQAT ValidationPipe · YORLIQ=@ManyToOne · bir xil lagan=successRes. «Domen» so'zi TAQIQ.

---

# 📜 ARXIV — P1 yakunlash + P2 partiya (Modul-3) → 4-Modull

> **VAKOLAT (2026-07-12):** Foydalanuvchi TO'LIQ avtopilotga ruxsat berdi — tasdiqlash so'ralmaydi.
> Topshiriq: P1'ni yakunlash + P2'ni (BuildSite, ApiGet, ApiPost, ProjectDay) oxirigacha yuritish, yakunda jamlangan hisobot.
> **YANGI VAKOLAT (2026-07-12, foydalanuvchi xabari, 2-tasdiq):** 3-Modull TO'LIQ tugagach 4-Modullni (15 dars, src/4-Modull/) AVTOMATIK boshlash va BARCHA 3 PARTIYANI (M4-P1→P2→P3) OXIRIGACHA o'zim boshqarish — so'roqsiz, to'xtovsiz. Foydalanuvchi 4-Modull bo'lgach keladi: jonli ballarni o'zi tekshiradi va COMMIT o'zi qiladi (mengacha commit YO'Q).
> M4 uchun ham 3-Modull spetsifikasi: audio STUB, MENTOR_IMG URL-const, JONLI PRAKTIKA mentor-gate (ScreenLivePractice, PRACTICE_BASE=500, kod kiritilmaydi), INLINE_KEYS+QUIZ_BANK 12 (3/3/3/3) QUIZ_MS=15000, RECAPS+RecapOverlay, pozitsiya-aralashtirish, optionalLive/audioText P1-parity, lessonId v16→v18. Har dars yakunida App.jsx'ga ulash (4-Modul bo'limi yangi MODULES[3] bo'lib qo'shiladi, m4-01...) — partiya yakunida.
> Commit YO'Q (foydalanuvchi buyrug'isiz). Jonli-sinov qo'lda (foydalanuvchida).
> Agar sessiya uzilsa: yangi sessiyada shu faylni o'qib davom ettirish.

## P1 — ✅ TO'LIQ YAKUNLANDI (2026-07-12)
1. ✅ ReactPropsReuseLesson — Verifikator IMZOLADI (PASS: esbuild toza, vite 858ms, 21/21 SSR, jsdom MOUNT-OK, useAudio stub, MENTOR_IMG URL, set_quiz_keys zanjiri butun)
2. ✅ App.jsx'ga 5 dars ulandi: m3-02 FirstComponent · m3-03 StateEffect · m3-04 PropsReuse · m3-05 Crud (Proyekt) · m3-06 Router (Proyekt) — tartib lessonId raqamlari bo'yicha
3. ✅ Umumiy vite build toza (faqat odatiy chunk-size warning)
4. ✅ office-mark rol 8 PropsReuse
P1 5/5 imzolangan. Jonli-sinov qo'lda (foydalanuvchida). UNCOMMITTED.

## P2 — 4 dars, har biri o'z zanjirida (parallel), 9-rolli pipeline
Bosqichlar: 0 Auditor → 0.5 Ijodkor → 1 Quruvchi → 2 Dizayn → 3 Animatsiya → 4 Jonli → 5 Metodist → 6 Tekshiruvchi (maks 2 qaytarish) → 7 Verifikator.
Audit-hisobotlar scratchpad'da: /tmp/claude-1000/-home-kali-Desktop-InternetLesson/ca878ab8-7484-436c-88ff-99d7af7919a1/scratchpad/audit-<Fayl>.md (sessiya o'chsa — PIPELINE_STATE izohlaridan tiklash yoki Auditorni qayta yuritish).

## P2 — ✅ TO'LIQ YAKUNLANDI (2026-07-12): 4/4 IMZOLANDI
BuildSite, ApiGet, ApiPost, ProjectDay — hammasi Etalon v18, App.jsx m3-07..m3-10, vite build toza. 3-MODULL YOPIQ (10/10).

## M4-P1 — 5 dars, parallel zanjirlar (2026-07-12 boshlandi)
## M4-P1 — ✅ TO'LIQ IMZOLANDI (2026-07-12, 5/5)
DataIntro (2 fix-tsikl: 16/16 uzunlik-mezon) · DbSqlNosql · NodeServer (1 fix: QUIZ 0/12) · Routing · PostgresCrud (1 fix: inline balans) — hammasi Etalon v18, App.jsx m4-01..05 (yangi MODULES[3] «4-Modul — Backend/Fullstack»), umumiy vite build toza. Jonli-sinov qo'lda, UNCOMMITTED.

## M4-P2 (6 dars) — parallel (PM darslar REJADAN CHIQARILGAN)

**SESSIYA-2 QAYTA BOSHLASH (2026-07-12, yangi sessiya):** Foydalanuvchi qarori — TO'LIQ 9-rolli pipeline (siqilgan zanjir EMAS), o'rtacha tejash (~40%: parallel to'lqinlar + ixcham promptlar). Qamrov: avval M4-P2 (6 dars), keyin `src/4a-Modull/` NestArch×3 (hali v16, rejaga kirmagan edi). PmLesson15 — PM bo'lgani uchun chetda.

Tashxis (fayl-tekshiruv bilan tasdiqlangan): 6 dars ham 0–2 bosqichlarni (Auditor·Ijodkor·Quruvchi) va Dizayn izlarini olgan — v18 lessonId, QUIZ_BANK 12, INLINE_KEYS, ScreenLivePractice, set_quiz_keys, MentorTestStats, Podium bor; **6/6 esbuild toza**. Qolgan: Dizayn(sayqal) → Animatsiya → Jonli → Metodist → Tekshiruvchi → Verifikator → App.jsx (m4-06..11) → vite build.

| Dars | Bosqich | QUIZ seq (🔒 o'zgarmasin) | Konsept |
|---|---|---|---|
| ApiPostmanLesson | Dizayn·Anim·Jonli·Metodist ✅ → 🔵 Tekshiruvchi (rol 7) | `301221300231` | «POSTACHI-SINOVCHI STOLI» |
| AuthEnvLesson | Dizayn·Anim·Jonli·Metodist ✅ → 🔵 Tekshiruvchi (rol 7) | `013213203120` | «QO'RIQCHI SMENASI» |
| BackendCrudPracticeLesson | Dizayn·Anim·Jonli·Metodist ✅ → 🔵 Tekshiruvchi (rol 7) | `130201322013` | «ROL PASPORTI» |
| FullstackConnectPracticeLesson | Dizayn·Anim·Jonli·Metodist ✅ → 🔵 Tekshiruvchi (rol 7) | `203132011302` | «KO'PRIK QURISH» |
| FullstackFeedbackLesson | Dizayn·Anim·Jonli·Metodist ✅ → 🔵 Tekshiruvchi (rol 7) | `312010320213` | «USTUVORLIK DOSKASI» |
| FullstackProjectDayLesson | Dizayn·Anim·Jonli·Metodist ✅ → 🔵 Tekshiruvchi (rol 7) | `021323013120` | «STOYANKA OCHILISH AKTI» (capstone) |

> **Regressiya-nazorati:** yuqoridagi seq qiymatlari Jonli bosqichida ataylab qo'yilgan (mexanik naqshni sindirish). Har roldan keyin skript bilan tekshiring — o'zgargan bo'lsa REGRESSIYA.

Modul-ichi etalon (agentlarga manba): `src/4-Modull/DataIntroLesson.jsx` (M4-P1, imzolangan).

### Dizayn bosqichi yakuni (2026-07-12) — 6/6, esbuild 6/6 toza
**TIZIMLI nuqson (butun 4-Modul oilasida):** `.live-badge` xiralik CSS'i (11.15) HECH BIR darsda yo'q edi — 6/6 da L1 etalonidan ko'chirildi. M4-P1'ning 5 imzolangan darsida ham yo'q bo'lishi mumkin — **keyin tekshirish kerak**.
Dars-darsdagi jiddiy topilmalar:
- **FullstackFeedback:** `'\U0001f17f️'` buzuq escape (JS'da `\U` yaroqsiz) → arena fonida `U0001f17f️` axlat matn suzardi. Tuzatildi.
- **BackendCrudPractice:** konseptning MARKAZIY mexanikasi «ROL PASPORTI» 3 muhri umuman qurilmagan edi → `RolePassport` komponenti qurildi (s1/s2/s5/s9/s13).
- **FullstackConnect:** rang semantikasi teskari — ulangan/muvaffaqiyat holatlari qizil (accent) edi → 5 joyda yashilga. Yangi: uzilgan sim (s0), CORS shlagbaumi (s10).
- **FullstackProjectDay:** `'Caveat'` shrifti — LMS yuklamaydi, Comic Sans'ga tushardi → `Source Serif 4`.
- **AuthEnv:** `.stage{height:100dvh}` — `--lz` zoomni hisobga olmagan (kesilish/qo'sh-scroll) → `calc(100dvh / var(--lz,1))`.
- **ApiPostman:** Postman mock'i oyna-chrome'siz yassi karta edi; javob paneli fonsiz osilardi.

### Animatsiya bosqichi yakuni (2026-07-12) — 6/6, esbuild 6/6 toza
**TIZIMLI nuqson (partiya bo'ylab):** `tap-hint` affordance CSS'i YOZILGAN, lekin JSX'da HECH QAYERDA ishlatilmagan edi — bolada «bu yerni bosish mumkin» signali yo'q edi. 6/6 da ulandi. **M4-P1'ning 5 imzolangan darsida ham tekshirish kerak.**
Dars-darsdagi jiddiy topilmalar:
- **FullstackFeedback:** Screen5 sudrash HTML5 `draggable` bilan yozilgan edi → **mobil touch'da UMUMAN ishlamasdi** (darsning yuragi telefonda o'lik). Pointer + DOM-transform motoriga qayta yozildi (Htmllesson1 DragDropOrder naqshi).
- **ApiPostman:** konvert-yig'ish DragDrop'i umuman yo'q edi (Quruvchi passiv «bosing» qoldirgan) → qurildi. Agent 3 ta o'z bug'ini topib tuzatdi (`Zone` render ichida komponent edi → sudrash pirillardi).
- **FullstackProjectDay:** `flashId` (POST/PUT javob signali) hech qayerga ULANMAGAN edi → o'quvchi so'rov yuborganda panelda tasdiq ko'rinmasdi. Ulandi. 2 ta CSS-kaskad bug'i tuzatildi.
- **AuthEnv:** s7 qo'riqchi-o'yini butunlay jonsiz edi (faqat `fade-step`) → to'siq/401-muhr/bilaguzuk segmentlari jonlandi.
- **FullstackConnect:** s0'da so'rov-impulsi endi kesikda so'nadi (bola «yetib bormaydi»ni KO'RADI, matndan o'qimaydi).

### Metodistga o'tkaziladigan eslatma
- **ApiPostman s3:** mexanika tap→DragDrop'ga o'zgardi. Mentor matni «Qismlarni bosib…» hamon to'g'ri (tap zaxira yo'l sifatida ishlaydi), lekin «sudrab yoki bosib» deb sayqallash mumkin.

### 🔴 Jonli bosqichi yakuni (2026-07-12) — 6/6, esbuild toza. IKKI TIZIMLI BALL-BUG TOPILDI
**MUHIM SABOQ: Jonli agentlarining 3 tasi «PASS, statik aralash» deb hisobot berdi — DASTURIY TEKSHIRUVDA YOLG'ON chiqdi.** Agent hisobotiga ishonmang, `correct` ketma-ketligini skript bilan tekshiring.

**BUG-1 — arena javob-naqshi (11 darsning 9 tasida!).** QUIZ_BANK `correct` ketma-ketligi mexanik edi:
- `012301230123` (qat'iy sikl): BackendCrudPractice, FullstackFeedback, FullstackProjectDay, NodeServer(P1), PostgresCrud(P1), Routing(P1)
- `000111222333` (bloklar — sikldan ham yomon, 2 savoldan keyin bola keyingisini biladi): ApiPostman, DataIntro(P1, ETALON!), DbSqlNosql(P1)
Rasman 3/3/3/3 — qoidaning HARFIGA mos, mohiyatiga zid. Arena bali tezlikka bog'liq → naqshni sezgan bola savolni o'qimay maksimal ball oladi va **reyting jadvalini buzadi**.
**Tuzatildi (11/11):** skript bilan (`scratchpad/reshuffle_quiz.py`) — to'g'ri variant boshqa pozitsiyaga SWAP qilinadi, matn o'zgarmaydi → uzunlik-tell invariant, `answerKey` runtime'da `QUIZ_BANK[i].correct` dan hosil bo'lgani uchun server kaliti avtomatik ergashadi. Har darsga BOSHQA ketma-ketlik. Backup: `scratchpad/bak*-*.jsx`. Matn butunligi dasturiy tasdiqlandi (savol/variant matnlari + to'g'ri javob o'zgarmagan).

**BUG-2 — `practice: -1` sentineli yo'q (7 darsda).** Server SQL mantiqi:
```sql
if v_key is null then v_correct := false;   -- noma'lum savol
elsif v_key < 0 then v_correct := true;     -- ishtirok savoli
```
`ScreenLivePractice` `question_id='practice'` yuboradi; kalit bo'lmasa server uni **noma'lum** deb `correct=false` yozadi → **«✅ Bajardim» bosgan o'quvchi bazada «bajarmagan» bo'lib tushadi.** Podium/arenaga ta'sir qilmaydi (500+ zona reytingdan tashqarida), lekin mentor statistikasi yolg'on.
**Tuzatildi (7/7):** AuthEnv, FullstackConnect (P2) + M4-P1'ning 5 tasi.

**Boshqa Jonli tuzatishlari:** AuthEnv — `optionalLive` 10 ballsiz ekranda yo'q edi (jonli darsda jamoaviy oqimni to'xtatardi). FullstackConnect — s15-final-submit qatori yo'q edi (bugun no-op, lekin keyingi rol scored+final qilsa jim bug bo'lardi). BackendCrud — eskirgan izoh («VS Code'da INSERT yozish») «KOD KIRITILMAYDI» qoidasiga zid edi, keyingi agentni adashtirardi.

### ⚠️ M4-P1 (imzolangan 5 dars) — foydalanuvchi ruxsati bilan TUZATILDI (2026-07-12)
Foydalanuvchi tanlovi: «javob-naqshi + practice:-1 tuzatilsin» (LiveBadge/tap-hint — hozircha YO'Q).
- ✅ QUIZ_BANK qayta joylandi (5/5), matn butunligi tasdiqlandi, esbuild 5/5 toza
- ✅ `practice: -1` qo'shildi (5/5)
- ⬜ **QOLGAN QARZ (M4-P1):** `.live-badge` xiralik CSS'i va `tap-hint` affordance JSX'da — tekshirilmagan/qo'shilmagan (foydalanuvchi hozircha kerak emas dedi)
- 📌 **Kuzatuv:** `NodeServerLesson` INLINE_KEYS `{s4:0, s5b:1, s9:2, s12:3}` — inline savollar ham ketma-ket. Risk PAST (4 savol dars bo'ylab tarqoq, arenadagi tez 12 savol emas). Tuzatish ekran ichidagi variant massivlarini ham qayta joylashni talab qiladi — qilinmadi.

### Metodist bosqichi yakuni (2026-07-12) — 6/6, esbuild toza, ball zanjiri buzilmagan
Tizimli xato-sinfi: **BEGONA METAFORA / COPY-PASTE QOLDIG'I** — ergashuvchi darslar oldingi darsdan matn olib qoladi:
- **AuthEnv:** dars yakunida RoutingLesson'dan qolgan «**Pochtachi** o'z eshigini o'zi ochadi!» turgan edi — bu darsda pochtachi tushunchasi YO'Q (eshikni token ochadi). Bola bilmagan metafora bilan tabriklanardi.
- **FullstackFeedback:** praktika audiosi boshqa darsniki edi («games ro'yxatini koddan olib tashlab…»).
- **FullstackConnect:** kod-kommentlari «routing» darsidan.
Boshqa jiddiy topilmalar:
- **ApiPostman:** metafora TO'QNASHUVI — API ham «pochtachi», Postman ham «postachi» deb atalgan. Bola miyasida ikkalasi bir narsa bo'lardi. Endi API=«pochta» (qoida/tizim), Postman=«postachi» (eltuvchi).
- **FullstackFeedback:** ustuvorlik doskasining O'QLARI (foyda/mehnat) hech qayerda tushuntirilmagan — bola nima bo'yicha saralayotganini bilmay sudrardi. Screen0'da YOLG'ON TASDIQ: 3 variantdan qaysinisi bosilsa ham «To'g'ri!» derdi.
- **FullstackConnect:** arena Q3 butunlay SEN-formada edi. 🚧 «CORS Cleared!» nishoni s9'da yonardi — CORS s10'da o'rgatiladi (bola ko'rmagan so'z bilan bayram). → `bothOnline` ga o'zgartirildi; Tekshiruvchiga s10'ga qaytarish tavsiya qilindi.
- **FullstackProjectDay:** «**Sir** — aniq va qisqa promptda» (MATN_ETALONI 7-bo'lim TAQIQ). 4 praktika to'liq qayta yozildi (yorliq-uslub → bajariladigan siz-forma qadamlar).
- **BackendCrud:** `s5b` scored test edi, RECAP'i yo'q edi → yozildi. «S0'dagi muammo» (ichki jargon ekranda) → «Dars boshidagi muammo».
Ochiq tuzilmaviy nuqson (Tekshiruvchiga qaytarildi): **FullstackProjectDay `RECAPS[20]` (s16) to'ldirilgan, lekin HECH QACHON ko'rsatilmaydi** — `RecapOverlay` faqat `QuestionScreen` ichidan chaqiriladi, s16 esa custom ekran. → Tekshiruvchi RECAPS[20]ni olib tashladi (etalon ham final custom ekranga recap bermaydi).

### 🔴 Tekshiruvchi bosqichi yakuni (2026-07-12) — 5/6 QAYTARILDI, tuzatildi
Adversarial rol o'z narxini oqladi. **IKKI TIZIMLI TUZILMAVIY NUQSON** (oldingi 5 roldan o'tib ketgan):

**BUG-3 — `optionalLive` yetishmasligi (3 darsda).** `NavNext`dagi `freeRide` mantiqi to'g'ri, lekin prop qulflangan ekranlarga berilmagan:
| Dars | oldin | keyin |
|---|---|---|
| BackendCrudPractice | 1 | 10 |
| FullstackFeedback | 3 | 11 |
| FullstackProjectDay | 1 | 12 |
| (ApiPostman 13 · AuthEnv 12 · FullstackConnect 11 — allaqachon yaxshi) |
*Buzilish ssenariysi:* jonli darsda mentor animatsiyani proyektorda ko'rsatib oldinga o'tadi; o'quvchining «Davom etish» tugmasi esa u har bir ekranni SHAXSAN bosib chiqmaguncha qulflangan qoladi (6 ustun, 2 joy, 3 amal…) → **butun sinf mentordan orqada qoladi.** 5.5 qoidasi aynan shu holat uchun yozilgan.
⚠️ QAT'IY: `optionalLive` BERILMAYDI → `QuestionScreen` (ballik testlar), scored final, `ScreenPodium`, `ScreenFlashcards`.

**BUG-4 — nishonlar TEKINGA berilmoqda (3 darsda).** `ACH_TRIGGERS` xato qilish imkoni bo'lmagan exploration/toggle ekranlarga bog'langan edi → bola hech narsa bilmasdan «Send → Kirish → Send» bosib nishon olardi (DARS_ETALON 10-bandi buni aniq taqiqlaydi):
- FullstackFeedback: 4 nishondan 3 tasi (s7/s11/s12) → `{s5(DragDrop), s10, s13, s16}` (scored testlar)
- FullstackProjectDay: `p1`/`p4` praktika («Bajardim» bir bosishda!) → `{s4, s10, s13, s16}`
- AuthEnv: `s13` exploration → tuzatilmoqda
*Etalon qoidasi:* nishon FAQAT scored testga yoki real xato-imkoniyati bo'lgan challenge'ga bog'lanadi.

**Tekshiruvchilarning boshqa qimmatli topilmalari:**
- **`.stage{height:100dvh}` — `--lz` zoomni hisobga olmagan (3 darsda).** Sinf PROYEKTORIDA (2560px, lz≈1.33) pastki nav qatori — «Davom etish»/«Send» tugmalari — ekran ostiga tushib **ko'rinmay qolardi**; mentor darsni oldinga surolmasdi. → `calc(100dvh / var(--lz,1))`.
- **FullstackFeedback `CONSEQ.f4.Q1` — ZID MA'LUMOT:** karta «kam mehnat» katagiga tegishli, matn esa «bu bir haftalik ish» (= ko'p mehnat) derdi → doskaning butun mantig'ini teskari o'rgatardi.
- **BackendCrud s10 — o'quvchiga ko'rsatiladigan kod SINTAKTIK XATO edi:** `res.json({ status: 'qo'shildi' })` — apostrof stringni yorib yuboradi. Bola «to'g'ri» deb belgilangan qatorni ko'chirsa, kodi ishlamasdi.
- **FullstackFeedback:** mentorning «📖 Qayta tushuntirish» tugmasi render qilinmagan — `onOpenRecap` uzatilardi, lekin hech qachon chizilmasdi → 4×3 RECAPS kartasi mentorga umuman yetib bormasdi.
- FullstackConnect Tekshiruvchisi Metodistning CORS-nishon tavsiyasini ASOSLI RAD ETDI (o'sha ekranda xato yo'li yo'q → nishon baribir tekin; ustiga 4→5 ta bo'lib ketardi). Adversarial rol to'g'ri ishladi.

### 📌 AUDIO — foydalanuvchi qarori (2026-07-12): KEYINGA QOLDIRILDI
Tekshiruvchilar «audio matni yo'q» deb 3 darsni qaytardi. Holat: M4-P1 (5 dars) — 14-16 `useAudio`; M4-P2 — ApiPostman 16, qolgan 5 dars 0-2.
Ovoz STUB (o'chirilgan) → bugungi ishga ta'siri NOL. Lekin checkpoint spetsi «audioText P1-parity» talab qiladi → ovoz keyin yoqilganda bu 5 dars JIM qoladi.
**Foydalanuvchi:** hozir yozilmasin, alohida ish sifatida rejaga tushsin. Bu band M4-P2 uchun vaqtincha N/A.
⬜ **OCHIQ QARZ:** AuthEnv · BackendCrudPractice · FullstackConnect · FullstackFeedback · FullstackProjectDay → audio matni.

Tizimli topilmalar (yangi darslarga qo'llansin): s15-final-submit qatori; 8.4 uzunlik-tell (QUIZ_BANK); placeCorrect shuffle server bilan mos emas → statik aralash; kod-input praktika taqiq → ScreenLivePractice. Audit/brief fayllar scratchpad'da.

## ⚠️ BYUDJET-TEJASH REJIMI (2026-07-12, oylik limit urilgandan keyin — foydalanuvchi: «tez, partiyani tugat»)
P2 qolgan bosqichlar SIQILGAN zanjirda: Quruvchi/Dizayn (bor) → **BIRLASHGAN SAYQAL-agent** (Animatsiya-lite + Jonli to'liq-checklist + Metodist-lite BITTA promptda) → Tekshiruvchi (to'liq, dasturiy 8.4 mezon bilan) → Verifikator (dasturiy tekshiruvlar). Har alohida rol o'rniga 1 agent — token ~60% tejaladi, sifat Tekshiruvchi+Verifikator darvozalari bilan saqlanadi. Uzilgan agentlar SendMessage bilan resume qilinadi (kontekst saqlanib arzon).

Zanjir: Auditor → Ijodkor → Quruvchi → Dizayn → Animatsiya → Jonli → Metodist → Tekshiruvchi → Verifikator (har o'tishda office-mark + shu ikki fayl). Audit/brief fayllar scratchpad'da: audit-<Fayl>.md / brief-<Fayl>.md.
P1 yakunida: App.jsx'ga 4-Modul bo'limi (MODULES[3], m4-01..05) + vite build → M4-P2 avtomatik start (ApiPostman, AuthEnv, BackendCrudPractice, FullstackConnectPractice, FullstackFeedback) → so'ng M4-P3 (FullstackProjectDay, PmLesson11-14).

Yakunda: 4 darsni App.jsx'ga ulash (m3-07..m3-10), umumiy vite build, PIPELINE_STATE.md yangilash, jamlangan hisobot.

## Rol-prompt eslatmalari (P1'dan meros)
- **Jonli**: ReactIntroLesson.jsx manba-etalon; INLINE_KEYS scored-ekranlardan qo'lda 1:1; praktika 'practice' kalitlari -1 sentinel; QUIZ_BANK 12 savol 3/3/3/3, QUIZ_MS=15000; JONLI PRAKTIKA wiring: ScreenLivePractice.complete() → live.submitAnswer(PRACTICE_BASE+screen,'practice',0,true,0), MentorPracticeStats (screen_idx>=500), MENTOR-GATE (jonlida praktika-NavNext mentor o'tguncha qulf, soloda o'z-tasdiq); SQL KERAK EMAS.
- **Metodist**: matn-sayqal + RECAPS to'ldirish + arena savol-tili + praktika task/checklist + flashcard/badge nomlari + qiyshiq apostroflar; ball-indekslarga tegmaslik. RECAPS+RecapOverlay tekshiruvi MAJBURIY (tizimli naqsh: ergashuvchi darslarda tushib qoladi).
- **Tekshiruvchi**: DARS_ETALON 14 + MATN_ETALONI 8 to'liq; v16→v18 artefakt-ovi; tuzilmaviy nuqson → mas'ul rolga qaytarish (maks 2).
- **Verifikator**: esbuild + vite build + SSR smoke (kalit ekranlar) + jsdom mount; useAudio-sinf regressiya ovi; IMZO.
- Audio YO'Q (stub). mentorImg import → URL-const.
- Har bosqich-o'tishda: `python3 .claude/hooks/office-mark.py done <rol-indeks> <Fayl.jsx> <sekund>` (0 auditor · 1 ijodkor · 2 quruvchi · 3 dizayn · 4 anim · 5 jonli · 6 metodist · 7 tekshiruvchi · 8 verifikator) + PIPELINE_STATE.md + shu fayl yangilanadi.
- ScreenLivePractice API: title/task/checklist/screen/storedAnswer/onAnswer/onNext/onPrev/live?; PRACTICE_BASE=500.
- P1 lessonId naqshi: react-first-component-02-v18 kabi → P2: react-build-site-07-v18 · react-api-get-08-v18 · react-api-post-09-v18 · react-project-day-10-v18 (raqamni App.jsx tartibiga moslang).
