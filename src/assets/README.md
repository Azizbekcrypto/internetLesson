# Rasmlar (assets) — qo'llanma

Bu papkaga darslik rasmlari joylanadi. Har rasm `import` orqali darsga ulanadi
(Vite uni siqadi, hash beradi, nomi xato bo'lsa build darrov ogohlantiradi).

## Papkalar
- `common/` — barcha darslarda takror ishlatiladigan rasmlar (mentor avatari va h.k.)
- `internet/` — 0-dars "Internet qanday ishlaydi" rasmlari
- (keyingi darslar uchun: `html/`, `css/`, `git/`, `deploy/`, `pm/` ... qo'shamiz)

## Nomlash qoidasi
- Faqat kichik harf, so'zlar orasida `-` (chiziqcha). Bo'sh joy/kirill YO'Q.
- Format: foto/illyustratsiya uchun **.webp** yoki **.png**, shaffof fon kerak bo'lsa **.png**.
- Misol: `mentor.png`, `dns-jadval.webp`, `server-restoran.png`

## Ulash (men qilaman)
Dars fayllari `src/1-Modull/`, `src/6-Modull/` ... ichida — ya'ni `src/assets/` bir
pog'ona yuqorida. Shuning uchun yo'l **bitta** `../` bilan boshlanadi:

```jsx
import mentorImg from '../assets/common/mentor.png';
...
<img src={mentorImg} alt="Mentor" />
```

⚠️ `../../assets/...` — XATO: u loyihadan tashqariga chiqadi va build sinadi.

## Birinchi qadam — mentor avatari
`common/mentor.png` nomi bilan kichik, kvadrat (masalan 200×200) rasm tashlang.
Dumaloq qilib men kesib ko'rsataman. Tashlagach menga ayting — ulaymiz.
