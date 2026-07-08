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
- **Bola nima bilishini o'ylash.** "Server", "atribut", "sintaksis" — bola bilmaydi. Ular metafora bilan kiritiladi ("teg — quti", "atribut — tegning qo'shimcha xususiyati").
- **Bir tushuncha — bir nom.** Bir narsani goh "xususiyat", goh "property", goh "parametr" demaslik. Butun darsda bitta atama.
- **Qisqa gap.** Uzun, ergashgan qo'shma gaplar bo'linadi. Bir gapda bir fikr.
- **Chigal ibora — soddaga.** Bir fikrni ikki-uch bo'lakka bo'lib chalkashtirmang. ❌ "u aynan shuni, shu tartibda bajaradi" → ✅ "u bergan tartibingizda, aynan bajaradi".
- **Gap chala qolmasin.** Atama tashlab ketilmaydi — to'liq gap bilan tugatiladi. ❌ "...ro'yxati — bu dastur (kod)." → ✅ "...ro'yxati **dastur** deyiladi (uni **kod** ham deymiz)."
- **Og'zaki-so'zlashuv qo'shimchalari YO'Q** (tushuntirish matnida): `-ku`, `-da`, `-chi` kabi. ❌ "yonidagisiga bosib o'tasiz-ku" → ✅ "yonidagi videoga bosib o'tasiz".
- **Do'stona ohang.** Mentor — do'st, ustoz emas nazoratchi. "Zo'r!", "Keling, birga ko'ramiz", "Bemalol tajriba qiling".
- **🟢 ISTISNO — nishon (achievement) NOMLARI ataylab inglizcha** (o'yin uslubi: "Built It!", "Nice Catch!", "Level Up!"). Bu o'yin his'ini beradi. Ammo nishon **tavsifi (desc) o'zbekcha** siz-formada qoladi ("Buzuq kodni topib tuzatdingiz"). Bu yagona inglizcha istisno — qolgan BARCHA o'quvchi matni o'zbekcha (DARS_ETALON 10-bo'lim).

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
| aynan shuni, shu tartibda | bergan tartibingizda, aynan | ikki bo'lak chigallashtiradi — bittaga jamlanadi (Htmllesson1) |

> **Qo'shish tartibi:** darsda tushunarsiz so'z topilsa → shu jadvalga (qiyin, sodda, izoh) yoz → kodda grep bilan barcha o'rinlarini tuzat → audio/mentor matni ham birga yangilanadi.

---

## 4. 🔴 MA'NO ANIQLIGI

- **Har atama izohlanadi.** `<img>` — "rasm tegi", `src` — "rasmning manzili", `alt` — "rasm yuklanmasa chiqadigan matn". Izohsiz atama tashlanmaydi.
- **Metafora — hayotdan.** Teg = quti, header/main/footer = uyning shifti/xonalari/poli, forma = qog'oz anketa, padding = ramka ichidagi hoshiya. Metafora bola bilgan narsadan olinadi.
- **Bitta metafora — oxirigacha.** Dars "uy" metaforasini ishlatsa, recap/test/izohda ham "uy" — yangi metafora aralashtirilmaydi.
- **Matn ↔ ko'rgazma mos.** Kodda `class="card"` bo'lsa, tushuntirishda ham "card"; preview'da mushuk bo'lsa, kodda ham `mushuk.jpg`.
- **Kod atamalari prozada ajralib tursin.** Mentor/izoh matnidagi teg/atribut/xususiyat nomlari (`h1`, `href`, `color`, `padding`...) oddiy so'zlardan ajralishi uchun **`<span className="mono">h1</span>`** (yoki `.qcode` chip) bilan beriladi — oddiy `<b>` yoki tekis matn EMAS. Sabab: bola "bu kod" ekanini darrov ko'radi. (Test variant/izohlarida — `fmtCode` + backtick, 11.8.)

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
- **Muvaffaqiyat xabari — samimiy, aniq.** "Zo'r! Sahifangizga rasm qo'shdingiz." (quruq "Bajarildi" emas).
- **Jonli test kutish matni — QISQA.** O'quvchi javob bergach, mentor natijani ochguncha kutadi. Bu paytdagi xabar uzun bo'lmasin. ✅ Yorliq: "📨 Javobingiz qabul qilindi" + izoh: "Hozir to'g'ri javobni bilib olasiz." ❌ Uzun tushuntirish ("...mentor «Natijani ochish»ni bosganda hammada birdan ko'rinadi...").

---

## 8. ✅ HAR DARS UCHUN MATN TEKSHIRUV RO'YXATI

```
[ ] 1  Har atama sodda tilda izohlangan; kattalar jargoni yo'q
[ ] 1  Bir tushuncha — bir atama (butun dars bo'ylab)
[ ] 2  siz-forma: grep "(ding|lading|san)\b|o'zing|bossang" — faqat mashina-buyruqlari qoladi
[ ] 3  tushunarsiz so'zlar 3-bo'lim lug'atiga qo'shildi va kodda tuzatildi
[ ] 4  metafora bir xil (bir dars — bir metafora); matn ↔ ko'rgazma mos
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



/////////////////

ishonasizmi dars oxirida

dinazavrda aynan