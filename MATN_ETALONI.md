# ✍️ MATN ETALONI — til va matn sifati (Text Quality Standard)

> **Nima uchun:** DARS_ETALON.md — texnik/arxitektura standarti. Bu fayl esa **til va matn** standarti:
> so'z tanlash, ma'no aniqligi, bolaga tushunarlilik, siz-forma, ohang. Har darsning MATNI shu bo'yicha
> tekshiriladi va tuzatiladi.
>
> **Auditoriya:** boshlang'ich o'quvchi — o'smir/bola, dasturlashni birinchi marta ko'radi. Har gap
> **sodda, do'stona, aniq** bo'lsin. Shubha bo'lsa — soddaroq varianti to'g'ri.
>
> **Bog'liqlik:** DARS_ETALON.md 1-bo'limi (TIL) shu faylning qisqa xulosasi — batafsili shu yerda.

**Belgilar:** 🔴 = majburiy (buzilsa matn xato) · 🟡 = muhim · 🟢 = sayqal.

---

## 0. Qanday ishlatiladi

1. Darsni ochib, matnni **o'quvchi ko'zi bilan** o'qi: har gap tushunarlimi, har atama izohlanganmi?
2. Quyidagi bo'limlar bo'yicha tekshir (grep + qo'lda o'qish).
3. Topilgan tushunarsiz so'zni **3-bo'lim lug'atiga** yoz (qiyin → sodda), kodda tuzat.
4. Oxirida **8-bo'lim (tekshiruv ro'yxati)**ni to'ldir.

---

## 1. 🔴 ASOSIY TAMOYILLAR

- **Sodda so'z, aniq ma'no.** Kattalar tili, rasmiy atama, jargon — YO'Q. Har texnik atama birinchi ko'rinishda **sodda tilda izohlanadi** (metafora yoki qavs ichida).
- **🔴 O'zbek grammatikasi to'g'ri.** Aniq affikslar (**-ni / -da / -ga / -dan** — kelishik qo'shimchalari joyida), ega-kesim moslashuvi, tabiiy so'z tartibi. **Rus tilidan KALKA yo'q** (so'zma-so'z tarjima natijasidagi g'aliz tuzilma). Matnni ovoz chiqarib o'qib ko'ring — quloqqa g'alati tuyulsa, tuzating. ❌ "bu bo'ladi ko'rsatadi" (kalka) → ✅ "bu ko'rsatadi".
- **7–8 sinf o'quvchisi tushunadigan daraja.** Har gapni 13 yoshli bola ko'zi bilan o'qing: tushunmaydigan so'z bo'lsa — izohlang yoki almashtiring.
- **Bola nima bilishini o'ylash.** "Server", "atribut", "sintaksis" — bola bilmaydi. Ular metafora bilan kiritiladi ("teg — quti", "atribut — tegning qo'shimcha xususiyati").
- **Bir tushuncha — bir nom.** Bir narsani goh "xususiyat", goh "property", goh "parametr" demaslik. Butun darsda bitta atama.
- **Qisqa gap.** Uzun, ergashgan qo'shma gaplar bo'linadi. Bir gapda bir fikr.
- **Chigal ibora — soddaga.** Bir fikrni ikki-uch bo'lakka bo'lib chalkashtirmang. ❌ "u aynan shuni, shu tartibda bajaradi" → ✅ "u bergan tartibingizda, aynan bajaradi".
- **Gap chala qolmasin.** Atama tashlab ketilmaydi — to'liq gap bilan tugatiladi. ❌ "...ro'yxati — bu dastur (kod)." → ✅ "...ro'yxati **dastur** deyiladi (uni **kod** ham deymiz)."
- **Yangi tushunchani yarim qoldirmang.** Texnik atamani kiritganda uning har bo'lagining vazifasini ochib bering. ❌ "havola `a href` bilan yasaladi" (o'quvchi `href` nimaligini bilmaydi) → ✅ "havola `<a>` tegi bilan: `href` ichiga manzil yoziladi, teglar orasiga esa ko'rinadigan matn". Har bo'lak nima uchun kerakligi aytilsin.
- **Og'zaki-so'zlashuv qo'shimchalari YO'Q** (tushuntirish matnida): `-ku`, `-da`, `-chi` kabi. ❌ "yonidagisiga bosib o'tasiz-ku" → ✅ "yonidagi videoga bosib o'tasiz".
- **Do'stona ohang.** Mentor — do'st, ustoz emas nazoratchi. "Zo'r!", "Keling, birga ko'ramiz", "Bemalol tajriba qiling".
- **🟡 Qiziqtiruvchi ilinma > quruq va'da.** Natijani e'lon qiladigan mentor gapi rasmiy-majburiyat ohangida emas, o'quvchini qiziqtiradigan savol/taklif bilan boshlanadi. ❌ "Va'da beraman: dars oxirida saytingiz tayyor bo'ladi" (rasmiy, majburiyat hidi) → ✅ "Ishonasizmi — dars oxirida o'zingizning saytingiz tayyor bo'ladi, xuddi mana shunaqa." Qiziqish uyg'otadigan boshlama ("Ishonasizmi?", "Bir o'ylab ko'ring…", "Sizga sir emas…") bolani ichiga tortadi; "va'da beraman", "kafolatlayman" kabi rasmiy iboralar sovuq. (Htmllesson1 2-page)
- **🟢 ISTISNO — nishon (badge) NOMLARI ataylab inglizcha** (o'yin uslubi: "Built It!", "Nice Catch!", "Level Up!"). Bu o'yin his'ini beradi. Ammo nishon **tavsifi (desc) o'zbekcha** siz-formada qoladi ("Buzuq kodni topib tuzatdingiz"). Bu yagona inglizcha istisno — qolgan BARCHA o'quvchi matni o'zbekcha (DARS_ETALON 10-bo'lim).

---

## 2. 🔴 SIZ-FORMA (eng ko'p buziladigan)

O'quvchiga qaratilgan **BARCHA matn** siz-formada: tugmalar, mentor gaplari, nishon tavsiflari,
xulosa/muvaffaqiyat xabarlari, izohlar.

| ❌ Sen-forma | ✅ Siz-forma |
|---|---|
| topding, yozding, tuzatding | topdingiz, yozdingiz, tuzatdingiz |
| o'rganding, bilib olding, tugatding | o'rgandingiz, bilib oldingiz, tugatdingiz |
| o'zing, senga, sening | o'zingiz, sizga, sizning |
| bossang, tanlasang | bossangiz, tanlasangiz |
| boshqarasan, qilasan | boshqarasiz, qilasiz |

**Tekshiruv:**
```
grep -noE "[a-z']+(ding|lading|gansan|asan|san)\b|o'zing\b|senga\b|sening\b|bossang\b" <fayl>
```
→ faqat quyidagi ISTISNO qolishi mumkin.

**🟢 ISTISNO — o'quvchi mashinaga bergan buyrug'i sen-formada qoladi:** dinozavrga "Yur"/"Sakra",
AI promptiga "rasm qo'sh", robotga "oldinga yur". Bu "kod = kompyuterga buyruq" g'oyasini o'rgatadi —
buyruq odam-odamga emas, odam-mashinaga. (Masalan builder ekranidagi "rasm qo'sh" — buyruq, sen-forma to'g'ri.)

---

## 3. 🔴 «QIYIN SO'Z → SODDA SO'Z» LUG'ATI (o'sib boradi)

Har dars tekshirilganda topilgan tushunarsiz/rasmiy so'z shu jadvalga qo'shiladi. Bu — butun platforma bo'ylab bir xil tilni ta'minlaydi.

| ❌ Qiyin / rasmiy / noaniq | ✅ Sodda / tushunarli | Izoh |
|---|---|---|
| xatboshi | matn (paragraf) | "xatboshi" — bola bilmaydigan eski atama |
| ma'lumot bazasi (kontekstsiz) | ma'lumotlar saqlanadigan joy | atamani izohlash |
| sintaksis (izohsiz) | yozilish qoidasi / shakl | metafora bilan kiritiladi |
| element (izohsiz) | teg / bo'lak | kontekstga qarab |
| deklaratsiya | qoida / yozuv | |
| initsializatsiya | boshlang'ich qiymat berish | |
| itoatkor | aytganini bajaradigan | eski/kitobiy so'z, bola bilmaydi (Htmllesson1) |
| bajartiramiz | buyuramiz / aytamiz | "bajartir-" o'zak qiyin (Htmllesson1) |
| o'rtasida (ikki narsa orasida) | orasida | "ikki sahifa **orasida**", "o'rtasida" markazni bildiradi |
| aynan shuni, shu tartibda | siz bergan tartibda, birma-bir | ikki bo'lak chigallashtiradi; «aynan» ergash so'z bola uchun mavhum — «birma-bir» ko'z oldiga keladi (Htmllesson1 dinozavr) |
| afisha (devordagi) | bino qavatlari | «afisha» — bola birinchi marta eshitadi; block=full-width stacked uchun «qavat» tanish+aniq (CssLesson2 block/inline) |
| tizilish (ot) | yo'nalish | «tizilish» oti bolaga begona; flex-direction=«yo'nalish» tanish (fe'l «tiziladi/tizadi» OK) (CssLesson2 s5) |
| bola / bolalar (child element) | ichki element / ichki elementlar | qutiga «bola» deyish g'alati; «ichki element» aniq (child element). «ichidagi» oldida qisqa «element» (redundantlik yo'q) (CssLesson2 s3) |

> **Qo'shish tartibi:** darsda tushunarsiz so'z topilsa → shu jadvalga (qiyin, sodda, izoh) yoz → kodda grep bilan barcha o'rinlarini tuzat → audio/mentor matni ham birga yangilanadi.

---

## 4. 🔴 MA'NO ANIQLIGI

- **Har atama izohlanadi.** `<img>` — "rasm tegi", `src` — "rasmning manzili", `alt` — "rasm yuklanmasa chiqadigan matn". Izohsiz atama tashlanmaydi.
- **Metafora — hayotdan.** Teg = quti, header/main/footer = uyning shifti/xonalari/poli, forma = qog'oz anketa, padding = ramka ichidagi hoshiya. Metafora bola bilgan narsadan olinadi.
- **Bitta metafora — oxirigacha.** Dars "uy" metaforasini ishlatsa, recap/test/izohda ham "uy" — yangi metafora aralashtirilmaydi.
- **Matn ↔ ko'rgazma mos.** Kodda `class="card"` bo'lsa, tushuntirishda ham "card"; preview'da mushuk bo'lsa, kodda ham `mushuk.jpg`.
- **Kod atamalari prozada ajralib tursin.** Mentor/izoh matnidagi teg/atribut/xususiyat nomlari (`h1`, `href`, `color`, `padding`...) oddiy so'zlardan ajralishi uchun **`<span className="mono">h1</span>`** (yoki `.qcode` chip) bilan beriladi — oddiy `<b>` yoki tekis matn EMAS. Sabab: bola "bu kod" ekanini darrov ko'radi. (Test variant/izohlarida — `fmtCode` + backtick, 11.8.)

### 4.1 🔴 ABRAZETS (misol/metafora) SIFATI — grep tutmaydigan, ENG MUHIM qatlam

> ⚠️ **Raqam eslatmasi:** bu — **MATN_ETALONI 4.1** (abrazets). `DARS_ETALON.md` dagi **4.1** boshqa narsa (dars oqimi skeleti). Rollarda ishorat qilinganda to'liq nom bilan yoziladi.

> Bu — **mazmuniy mulohaza**, mexanik tekshiruv EMAS. Metodist HAR metafora/misol/tushuntirishni o'qib, "bu bola miyasida to'g'ri rasm chizadimi?" deb baholaydi va zaif abrazetsni **almashtiradi**. Grep buni tutmaydi — shuning uchun uni qo'lda, o'quvchi ko'zi bilan qidirish SHART.

**Yaxshi metaforaning 5 sharti:**
1. **To'g'ri moslashadi (mapping aniq).** Metaforadagi HAR element tushunchadagi elementga to'g'ri kelishi va tushuntirilayotgan **farqni chalkashtirmasligi** shart. Test: metaforaning har bo'lagini tushunchaga ulab ko'r — biror joyda "teskari" chiqmaydimi?
2. **Bolaga tanish, hayotiy.** FAQAT o'smir har kuni ko'radigan/ishlatadigan narsadan: **uy va xonalar, maktab, telefon, Telegram/Instagram, bozor, do'kon, oshxona va retsept, futbol, avtobus, tokchali javon, quti, konvert va xat, televizor pulti**. Mavhum/kitobiy narsa emas.
3. **Konkret misol + aniq harakat bilan.** Metafora + aniq ro'yxat (`body` = matn, rasm, tugma) + aniq harakat ("4 qismni birma-bir bosing"). Mavhum qolmaydi.
4. **Bitta metafora — oxirigacha** (4-bo'lim yuqorida).
5. **"So'z o'xshashligi" tuzog'idan qoch.** `head` tegi ↔ odam kallasi/miyasi kabi atama-o'xshashligi **soxta anatomiya** yaratadi — undan qoching. Teg nomi bilan hayotiy narsani so'zi o'xshagani uchun bog'lamang; **vazifasi** o'xshagani uchun bog'lang.

**🚫 TAQIQLANGAN metafora manbalari** (bola bilmaydi yoki chalkashtiradi): **biologiya, kimyo, inson a'zolari (miya/yurak/o'pka...), mavhum matematika, murakkab/ko'p qatlamli metafora**. "miya ichkarida ishlaydi" aynan shu taqiq (inson a'zosi + soxta mos) — shuning uchun restoranga almashtirilgan.

**🔢 Ketma-ketlik (MAJBURIY): metafora → atama → kod.** Avval hayotiy o'xshatish (bola tushunadi), keyin texnik atama (nomini beramiz), keyin kod (ko'rsatamiz). ❌ Teskari (avval kod/atama, keyin izoh) — bola mavhumdan boshlaydi va yo'qotadi.

**Namuna (aynan shu darsdan — fikrlash etaloni):**

| Ekran | ❌ ZAIF abrazets | ✅ ZO'R abrazets | Nega |
|---|---|---|---|
| Skelet (s5) | "yuzingizni hamma ko'radi, lekin **miyangiz ichkarida ishlaydi** — head ko'rinmas, body ko'rinadi" | "**Restoran**: zalni mehmon ko'radi; **oshxona**ga mehmon kirmaydi, lekin taom o'sha yerda tayyorlanadi. body — ko'rinadigan qism, head — ko'rinmaydigan sozlamalar" | Miya "ishlaydi" — lekin `head` ishlamaydi, sozlama saqlaydi → soxta mos. Oshxona "ko'rinmas tayyorgarlik" = `head` vazifasiga aniq mos. |
| (HTML-2 s5) | "gazeta" | "**uy**: shift=header, xonalar=main, pol=footer" | Uy bo'laklari sahifa bo'limlariga fizik joylashuv bilan aniq mos keladi |

**Metodist qadami (majburiy):** har ekran matnini o'qib — "metafora to'g'ri moslashadimi? bolaga tanishmi? konkretmi?" deb bahola. "So'z o'xshash, lekin vazifa teskari" bo'lsa — hayotiy va vazifasi-mos metaforaga almashtir (audio ↔ Mentor birga). Almashtirilganini 9-bo'lim audit tarixiga yoz.

---

## 5. 🔴 YOZUV TOZALIGI (mexanik)

- **Faqat lotin o'zbek.** Tasodifiy kirill harf yo'q. Istisno — ataylab `ru:` tarjima.
  ```
  grep -nP '[\x{0400}-\x{04FF}]' <fayl>   # faqat ru: qatorlari chiqsin
  ```
- **Bir xil apostrof — ASCII `'`.** Qiyshiq belgilar (‘ ’ ʻ) aralashmasin. JS single-quoted string ichida `\'` escape.
  ```
  grep -n "[‘’ʻ]" <fayl>   # bo'sh chiqsin
  ```
  ⚠️ Tuzatishda EHTIYOT: qiyshiq apostrof ko'pincha string ichida — oddiy `'` bilan almashtirsa string buziladi. `\'` ishlat yoki stringni qo'shtirnoqqa o'tkaz.

---

## 6. 🟡 TUGMA NOMLARI VA UI MATNI

- **Tugma = neytral harakat oti:** "Yaratish", "Yuborish", "Tozalash", "Ishga tushirish" (❌ "Yarat", "Tozala").
- **Matn ↔ UI mosligi:** matnda tilga olingan tugma nomi ekrandagi yozuv bilan AYNAN bir xil. ❌ «"Sayt" tugmasini bosing» — vaholanki ichini "Kod" tugmasi ochadi.
- **Tugma nomi o'zgarsa — hamma joyi birga:** tugma + uni tilga olgan mentor matni + audio matni.

---

## 7. 🟡 OHANG VA USLUB

- **Mentor — do'st.** Sodda, iliq, rag'batlantiruvchi. Buyruq emas — taklif ("Keling, ko'ramiz").
- **"Sir"-uslub TAQIQ.** O'quvchi matnida "sir", "hozircha sir", 🤫/🙈 kabi sirli-dramatik ifoda YO'Q — aniq, tinch tushuntirish. ✅ "Javobingiz yozib olindi. To'g'ri yoki xato ekani mentor «Natijani ochish»ni bosganda ko'rinadi."
  ```
  grep -nE "hozircha sir|🤫" <fayl>   # bo'sh chiqsin
  ```
- **Bir ekranda bitta ilinish (hook) yetarli.** Qiziqtiruvchi savol/ibora bir ekranda bir marta ishlaydi; har jumlada takror ("sirni bilasizmi? U...") charchatadi va asosiy fikrni kechiktiradi. ❌ "Kompyuter tez, lekin **sirni bilasizmi? U** o'zicha hech narsa qila olmaydi" → ✅ "Kompyuter tez, lekin o'zicha hech narsa qila olmaydi".
- **Muvaffaqiyat xabari — samimiy, aniq.** "Zo'r! Sahifangizga rasm qo'shdingiz." (quruq "Bajarildi" emas).
- **Jonli test kutish matni — QISQA.** O'quvchi javob bergach, mentor natijani ochguncha kutadi. Bu paytdagi xabar uzun bo'lmasin. ✅ Yorliq: "📨 Javobingiz qabul qilindi" + izoh: "Hozir to'g'ri javobni bilib olasiz." ❌ Uzun tushuntirish ("...mentor «Natijani ochish»ni bosganda hammada birdan ko'rinadi...").

---

## 8. ✅ HAR DARS UCHUN MATN TEKSHIRUV RO'YXATI

```
[ ] 1  Har atama sodda tilda izohlangan; kattalar jargoni yo'q; 7–8 sinf darajasi
[ ] 1  o'zbek grammatikasi to'g'ri (affiks -ni/-da/-ga/-dan, moslashuv, so'z tartibi); rus kalkasi yo'q
[ ] 1  Bir tushuncha — bir atama (butun dars bo'ylab)
[ ] 2  siz-forma: grep "(ding|lading|san)\b|o'zing|bossang" — faqat mashina-buyruqlari qoladi
[ ] 3  tushunarsiz so'zlar 3-bo'lim lug'atiga qo'shildi va kodda tuzatildi
[ ] 4  metafora bir xil (bir dars — bir metafora); matn ↔ ko'rgazma mos
[ ] 4.1 ABRAZETS SIFATI (qo'lda, grep emas): har metafora to'g'ri MOSLASHADI (soxta anatomiya yo'q), hayotiy manbadan (uy/telefon/bozor/oshxona...), konkret misol+harakat bilan; TAQIQ manbalari (biologiya/kimyo/inson a'zolari/mavhum matematika) yo'q; zaif abrazets almashtirilgan
[ ] 4.1 ketma-ketlik: metafora → atama → kod (teskari emas)
[ ] 4  yangi tushuncha yarim qolmagan (har bo'lak vazifasi ochilgan); bir ekranda bitta hook
[ ] 5  kirill: grep -nP '[\x{0400}-\x{04FF}]' — faqat ru:
[ ] 5  apostrof: grep "[‘’ʻ]" — bo'sh
[ ] 6  tugma nomlari neytral; matn ↔ UI ↔ audio mos
[ ] 7  "sir"-uslub yo'q: grep "hozircha sir|🤫" — bo'sh; ohang do'stona
```

---

## 9. 📋 DARSLAR BO'YICHA MATN-AUDIT TARIXI

Har dars matn-auditidan o'tganda shu yerga qisqa yozuv (sana + nima tuzatilgani).

| Dars | Sana | Topilgan/tuzatilgan |
|---|---|---|
| Htmllesson2 | 2026-07-08 | "xatboshi"→"matn (paragraf)"; "sir 🤫" olib tashlandi; apostrof |
| CssLesson1 | 2026-07-08 | sansirash (o'rganding/boshqarasan/bossang→siz); 35 apostrof; "sir" |
| InternetLesson | 2026-07-08 | 6 sansirash; 19 apostrof; "sir" |
| Htmllesson1 | 2026-07-08 | 3-page: "sir" olib tashlandi (dinozavr audio+mentor), "bajartiramiz"→"buyuramiz", dinozavr iborasi soddalashtirildi + "dastur deyiladi" (chala emas); xulosa "itoatkor"→"aytganini bajaradigan"; 9-page `h1`/`h6`→`.mono` chip; 14-page "-ku" olib tashlandi + "o'rtasida"→"orasida"; jonli test kutish matni qisqartirildi ("Hozir to'g'ri javobni bilib olasiz") |
| Htmllesson1 | 2026-07-09 | 2-page: "Va'da beraman:"→"Ishonasizmi —" (rasmiy va'da → qiziqtiruvchi ilinma, audio+mentor); dinozavr: "bergan tartibingizda, aynan bajaradi"→"siz bergan tartibda, birma-bir bajaradi" (maks. tushunarli) |
| Htmllesson1 (abrazets auditi, backup↔hozirgi) | 2026-07-09 | **ABRAZETS namunalari aniqlandi** (4.1-bo'lim asosi): s5 skelet "miya ichkarida ishlaydi"→"restoran zal/oshxona" (soxta anatomiya→to'g'ri mos); s2 "sirni bilasizmi? U"→to'g'ridan (bitta hook); s12 "a href bilan yasaladi"→"href ichiga manzil, teglar orasiga matn" (chala→to'liq); s0/s3/s14 tugma nomi ekranга moslandi; s4/s5b/s11 test variantlari backtick+fmtCode. 5 umumiy prinsip 1/4/4.1/6/7-bo'limlarga singdirildi. |
| CssLesson2 | 2026-07-09 | RECAPS bo'sh→to'ldirildi (4 scored test × 3 karta: flexbox/flex-direction/justify+align/DevTools, dars metaforalari bilan mos); "sir 🤫" kutish matni→tinch (15-G.1); sansirash "joylashtira olasan"→"olasiz"; 33 qiyshiq apostrof→`\'` escape; 12 kod namunasidagi `.qator` selektori→`.row` (11.12, praktika `.row/.box/.menu` bilan izchil); 4 Badge nomi inglizcha o'yin-nom (Lined Up!/Bullseye!/Nice Catch!/Level Up!) + o'zbek desc; abrazets "asosiy o'q/ko'ndalang o'q"→hayotiy anchor ("qator bo'ylab, chapdan o'ngga" / "qatorga ko'ndalang, yuqoridan pastga", s7/s8 audio+mentor); "Va'da beraman:"→"Ishonasizmi —" (s1); arena 8.4: 4 savolda to'g'ri javob uzunligi balanslandi (correct indeks/pozitsiya TEGILMADI); kirill "holatда"→"holatda". |
| CssLesson2 (feedback-qurilish sayqali) | 2026-07-09 | Feedbackда 2 yangi ekran sayqallandi: **s3b "Qoida ustaxonasi"** DragDrop — slot ipuchlari qo'shildi (`hints`: qaysi element/qoida boshlanadi/qaysi xususiyat/xususiyat qiymati/qatorni tugatadi/qoida tugaydi) + learner matnда "slot"→"katak" (sodda), dd-done boyitildi ("CSS qoidasi aynan shu tartibda yoziladi"); **s7 "Bullseye!"** goal-challenge matni ko'zdan kechirildi — namunaga moslash hint + "🎯 nishonga tegdi" muvaffaqiyat matni aniq, javob (space-between) challenge davomida oshkor bo'lmaydi; **s16 yakun** — olingan s15 (yozma test)ga ishora yo'q (audio/RECAP flexboxga mos, "yozdingiz" qoldig'i yo'q). Til-grep: apostrof/sir/begona = 0. esbuild TOZA. |
| ETALON boyitildi (Shahzoda yo'riqnomasi, `shaxzoda-fkir.md`) | 2026-07-09 | 4.1'ga: TAQIQ metafora manbalari (biologiya/kimyo/inson a'zolari/mavhum matematika — "miya" taqig'ini tasdiqlaydi) + yaxshi manbalar ro'yxati (uy/telefon/Telegram/bozor/oshxona/futbol/avtobus/javon/quti/konvert) + **metafora→atama→kod** ketma-ketligi. 1-bo'limga: o'zbek grammatikasi (affiks -ni/-da/-ga/-dan, rus kalkasi yo'q) + 7–8 sinf darajasi. Metodist/Ijodkor rollari yangilandi. |