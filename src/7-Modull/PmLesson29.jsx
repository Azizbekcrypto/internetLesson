import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM4 — CUSTDEV: SAVOL BERISH (MOM TEST) — v16 (AUDIOSIZ)
// G'oya: odamlar xushmuomalalikdan yolg'on gapiradi. Taqiqlangan savollar (fikr/kelajak/gipotetik),
// oltin qoida: o'tmish fakti > kelajak va'dasi. 5-savol shabloni. Eshitish: pitch emas — qazish.
// Signature 1: chat-intervyu simulyatori (yomon savol → xushmuomala yolg'on javob!).
// Signature 2: taqiqlangan savollar filtri + yolg'on detektori (saralash o'yinlari).
// Yakuniy ish: Malika bilan to'liq 5-bosqichli rolli intervyu + faktlar xulosasi (portfolio 4-sahifa).
// Davomiylik: muammolar 95-dars ovidan (avtobus, uy vazifasi); Aziz case #4.
// AUDIOSIZ. PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  honey: '#E0892B', honeySoft: '#FBEFDD', grape: '#7B3FE4', grapeSoft: '#EFE9FB',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };
const G = "Georgia, serif";

const LangContext = createContext('uz');
const MentorCtx = createContext(null);

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

// ===== IKONKALAR =====
const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  check: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.3}><path d="M20 6L9 17l-5-5" /></svg>),
  x: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  rocket: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 15c-2 0-4-1-5-2 0-5 2-9 5-11 3 2 5 6 5 11-1 1-3 2-5 2z" /><path d="M7 13l-3 2 2 2" /><path d="M17 13l3 2-2 2" /><path d="M12 15v5" /></svg>),
  mic: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3M8 21h8" /></svg>),
  ear: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M17 14c1.2-1.3 2-3 2-5a7 7 0 0 0-14 0" /><path d="M5 9a7 7 0 0 1 14 0c0 2-.8 3.7-2 5-1 1.2-2 2-2 4a3 3 0 0 1-6 0" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>),
  repeat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-custdev-29-v16', lessonTitle: { uz: 'Custdev: savol berish — Mom Test', ru: 'Custdev: как задавать вопросы — Mom Test' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5b', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

// ===== FOUNDER PORTFOLIO =====
const PORTFOLIO_KEY = 'coddyFounderPortfolio';
const savePortfolioSection = (section, data) => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    const cur = raw ? JSON.parse(raw) : {};
    cur[section] = data;
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(cur));
  } catch { /* localStorage bloklangan bo'lsa — dars baribir ishlayveradi */ }
};

// ===== KONSEPT LEKSIKONI =====
// Nega yolg'on gapirishadi (s2)
const LIE_WHY = [
  { id: 'w1', label: 'Xushmuomalalik', emoji: '😊', color: T.accent, soft: T.accentSoft, d: 'Odamlar sizni XAFA QILGISI kelmaydi. G\'oyangizni aytsangiz — «zo\'r ekan!» deydi, chunki yuzingizga «bu hech kimga kerak emas» deyish noqulay. Yaqinlaringiz — ayniqsa: ular sizni sevadi.' },
  { id: 'w2', label: 'Kelajak optimizmi', emoji: '🔮', color: T.grape, soft: T.grapeSoft, d: 'Kelajak haqida hamma o\'zini qahramon deb tasavvur qiladi: «albatta sport qilaman», «albatta ishlataman». Bu yolg\'on emas — samimiy xato: odam KELAJAKDAGI idealini aytadi, real odatini emas.' },
  { id: 'w3', label: '«Ha» — bepul', emoji: '🎁', color: T.blue, soft: T.blueSoft, d: '«Ishlatarmidingiz?» — «Ha» deyish hech narsa turmaydi. Va\'da tekin, harakat qimmat. Shu sababli va\'dalar emas — PUL yoki VAQT sarflangan o\'tmish faktlari hisoblanadi.' }
];

// Taqiqlangan savollar filtri (s3) — SIGNATURE 2a
const QFILTER = [
  { id: 'q1', t: '«Mening g\'oyam sizga yoqdimi?»', banned: true, why: 'Fikr so\'rash — xushmuomala yolg\'onni chaqirish. Hech kim yuzingizga «yo\'q» demaydi.' },
  { id: 'q2', t: '«Oxirgi marta avtobusni kutib kech qolganingiz qachon edi?»', banned: false, why: 'O\'tmishdagi aniq fakt — buni tekshirib, chuqurlashtirib bo\'ladi.' },
  { id: 'q3', t: '«Shunday ilova bo\'lsa, ishlatarmidingiz?»', banned: true, why: 'Kelajak farazi — «ha» deyish bepul. Bu javob hech narsani isbotlamaydi.' },
  { id: 'q4', t: '«Bu muammoni hozir qanday hal qilyapsiz?»', banned: false, why: 'Workaround\'ni ochadigan oltin savol — real xatti-harakat haqida.' },
  { id: 'q5', t: '«Ilovamga oyiga 10 ming to\'larmidingiz?»', banned: true, why: 'Gipotetik pul — va\'da. Buning o\'rniga: «bu muammoga pul sarflaganmisiz?» (o\'tmish).' },
  { id: 'q6', t: '«Bu muammoga vaqt yoki pul sarflaganingiz bo\'lganmi?»', banned: false, why: 'O\'tmishdagi sarf — og\'riqning eng kuchli isboti.' }
];

// 5-savol shabloni (s6)
const SCRIPT5 = [
  { id: 'p1', n: '1', label: 'Vaziyat', emoji: '🎬', color: T.blue, q: '«Oxirgi marta [muammo] qachon bo\'ldi? Gapirib bering»', why: 'Umumiy fikr emas — ANIQ VOQEA so\'raymiz. «Ba\'zan bo\'ladi» emas, «kecha, fizika darsida» kerak.' },
  { id: 'p2', n: '2', label: 'Og\'riq chuqurligi', emoji: '🌡️', color: T.accent, q: '«Bu nima uchun ayniqsa yomon bo\'ldi?»', why: 'Oqibatni ochamiz: nimadan mahrum bo\'ldi, nima yo\'qotdi? Og\'riq oqibatda ko\'rinadi.' },
  { id: 'p3', n: '3', label: 'Workaround', emoji: '🩹', color: T.honey, q: '«Hozir buni qanday hal qilyapsiz?»', why: 'Radardan tanish oltin signal! Agar odam hech narsa qilmayotgan bo\'lsa — og\'riq unchalik kuchli emas.' },
  { id: 'p4', n: '4', label: 'Yechim kamchiligi', emoji: '🕳️', color: T.grape, q: '«Bu usulning nimasi yomon?»', why: 'Mavjud yechimning kamchiligi = sizning imkoniyatingiz. Bu yerdan MVP g\'oyasi chiqadi.' },
  { id: 'p5', n: '5', label: 'Isbot', emoji: '💰', color: T.success, q: '«Bunga pul yoki vaqt sarflaganmisiz?»', why: 'Yakuniy tekshiruv: sarflangan pul/vaqt — og\'riqning tekshirilgan isboti. Va\'da emas — fakt.' }
];

// Yolg'on detektori (s7) — SIGNATURE 2b
const ANSWERS = [
  { id: 'a1', t: '«Voy, juda zo\'r g\'oya ekan! Omad!»', fact: false, why: 'Klassik xushmuomala yolg\'on: iliq, yoqimli va… mutlaqo foydasiz. Hech qanday fakt yo\'q.' },
  { id: 'a2', t: '«O\'tgan hafta 3 marta bekatda 20 daqiqadan kutdim»', fact: true, why: 'Raqam + vaqt + aniq voqea = tekshirsa bo\'ladigan fakt. Oltin.' },
  { id: 'a3', t: '«Albatta ishlataman, chiqsa menga ayting!»', fact: false, why: '«Chiqsa ayting» — xushmuomala xayrlashuv. Va\'da bepul, ishlatish esa — kelajak tumani.' },
  { id: 'a4', t: '«Hozir Yandex Kartada qarayman, lekin u avtobusni ko\'rsatmaydi»', fact: true, why: 'Workaround + uning kamchiligi — ikki oltin signal bitta javobda!' },
  { id: 'a5', t: '«Do\'stlarimga ham aytaman — hammasi olib oladi!»', fact: false, why: 'Boshqalar nomidan berilgan va\'da — ikki karra arzon. Do\'stlari hech narsa olmaydi.' },
  { id: 'a6', t: '«Muhim kunlari taksiga haftasiga 40-50 ming ketyapti»', fact: true, why: 'PUL sarflangan — og\'riqning eng kuchli isboti. Bu odam yechimga to\'laydi.' }
];

// Intervyu simulyatori 1 — Dilnoza, uy vazifasi (s8), SIGNATURE 1
const SIM1 = {
  persona: { name: 'Dilnoza', ava: '👧', intro: '9-sinf o\'quvchisi. Mavzu: uy vazifasini bilish muammosi (sizning ov varag\'ingizdan).' },
  steps: [
    {
      resp: 'Salom! So\'rayvering :)',
      opts: [
        { t: '«Uy vazifa ilovasi qilyapman — sizga kerakmi?»', good: false, reply: '«Voy, kerak bo\'lsa kerak-da… zo\'r ekan!»', note: 'Fikr so\'radingiz — xushmuomala «ha» oldingiz. Bu javobdan HECH NARSA o\'rganmadik.' },
        { t: '«Kecha uy vazifasini qanday bilib oldingiz?»', good: true, reply: '«Kecha-mi? 4 ta guruhni titkiladim, topolmay oxiri Zuhraga yozdim — u ham darrov javob bermadi…»', note: 'O\'tmishdagi aniq voqea — mana FAKT: 4 guruh + odamdan so\'rash.' },
        { t: '«Uy vazifani bilish qiyin-a, to\'g\'rimi?»', good: false, reply: '«Ha… qiyin shekilli»', note: 'Og\'ziga so\'z soldingiz (yetaklovchi savol) — u sizga shunchaki qo\'shildi.' }
      ]
    },
    {
      resp: '«…oxiri Zuhradan so\'rab bildim»',
      opts: [
        { t: '«Bunga qancha vaqtingiz ketdi?»', good: true, reply: '«20 daqiqacha. Eng yomoni — har kuni shunaqa! Ba\'zan umuman topolmay, ertalab bilaman»', note: 'Raqam + chastota + oqibat. Og\'riq o\'lchandi: har kuni ~20 daqiqa.' },
        { t: '«Mening ilovamda hammasi bitta joyda bo\'ladi!»', good: false, reply: '«Qoyil… omad sizga!»', note: 'PITCH boshladingiz — intervyu tugadi, sotuv boshlandi. Detektiv sotmaydi — qaziydi.' },
        { t: '«Nega guruhlarni tartibli qilmaysizlar?»', good: false, reply: '«Bilmadim… biz aybdormi endi?»', note: 'Ayblov ohangi — respondent yopilib qoldi.' }
      ]
    },
    {
      resp: '«…har kuni shunaqa, ba\'zan ertalab bilaman»',
      opts: [
        { t: '«Bitta joyda bo\'lsa zo\'r bo\'lardi-a?»', good: false, reply: '«Ha, zo\'r bo\'lardi!»', note: 'Yana yetaklovchi savol — «ha» oldingiz, lekin bu sizning gapingiz edi, uniki emas.' },
        { t: '«Bu muammoga o\'zingiz biror narsa qilib ko\'rganmisiz?»', good: true, reply: '«Ha! O\'zim jadval-fayl ochganman sinfga — lekin hech kim to\'ldirmaydi, 2 haftada tashlab qo\'ydik»', note: 'WORKAROUND topildi: o\'zi yechim yasagan (va u ishlamagan sababi ham ma\'lum). Oltin!' },
        { t: '«Xo\'p, rahmat, hammasi tushunarli»', good: false, reply: '«Arzimaydi!»', note: 'Juda erta tugatdingiz — eng qimmat savol (workaround) so\'ralmay qoldi.' }
      ]
    }
  ]
};

// Yakuniy rolli intervyu — Malika, avtobus (s15)
const SIM2 = {
  persona: { name: 'Malika', ava: '👩‍🎓', intro: 'Radar darsidan tanish qahramon. Mavzu: avtobusni bilmay kutish. 5-savol shablonini qo\'llang!' },
  steps: [
    {
      stage: '1 · Vaziyat', fact: { label: 'Vaziyat', emoji: '🎬', color: T.blue, text: 'Kecha 25 daqiqa sovuqda kutgan' },
      resp: 'Salom! Avtobus haqida so\'ramoqchimidingiz?',
      opts: [
        { t: '«Avtobus-tracker ilova g\'oyam bor — zo\'r-a?»', good: false, reply: '«Voy, zo\'r ekan! Kerak narsa-da»', note: 'Fikr so\'radingiz — bepul «ha». 1-savol: aniq VOQEANI so\'rang.' },
        { t: '«Oxirgi marta avtobusni uzoq kutganingiz qachon? Gapirib bering»', good: true, reply: '«Kecha! 25 daqiqa turdim bekatda, muzlab ketdim. Qachon kelishi umuman noma\'lum»', note: 'Aniq voqea ochildi: kecha, 25 daqiqa. Endi og\'riqni chuqurlashtiramiz.' },
        { t: '«Avtobuslar dahshat-a, to\'g\'rimi?»', good: false, reply: '«Ha… dahshat»', note: 'Yetaklovchi savol — o\'z so\'zingizni qaytarib oldingiz, xolos.' }
      ]
    },
    {
      stage: '2 · Og\'riq', fact: { label: 'Og\'riq', emoji: '🌡️', color: T.accent, text: 'Nazoratga kech qolgan — o\'qituvchi kirgizmagan' },
      resp: '«…qachon kelishi umuman noma\'lum»',
      opts: [
        { t: '«10 balldan nechchi bu muammo?»', good: false, reply: '«Bilmadim… 7 mi?»', note: 'Abstrakt baho — foydasiz raqam. Oqibatni so\'rang: nima YO\'QOTDI?' },
        { t: '«Ilova bo\'lsa hammasi hal bo\'lardi-a?»', good: false, reply: '«Ha, hal bo\'lardi!»', note: 'Yana yetaklovchi + kelajak farazi. O\'tmishda qoling!' },
        { t: '«Kecha bu nima uchun ayniqsa yomon bo\'ldi?»', good: true, reply: '«Fizikadan nazoratga kech qoldim — o\'qituvchi kirgizmadi, «2» qo\'ydi. Onamga tushuntirish ham azob»', note: 'Og\'riqning OQIBATI chiqdi: baho + oiladagi noqulaylik. Bu real og\'riq.' }
      ]
    },
    {
      stage: '3 · Workaround', fact: { label: 'Workaround', emoji: '🩹', color: T.honey, text: '20 daqiqa erta chiqadi; muhim kunlari taksi' },
      resp: '«…o\'qituvchi kirgizmadi, onamga tushuntirish ham azob»',
      opts: [
        { t: '«Hozir bu muammoga qarshi nima qilyapsiz?»', good: true, reply: '«20 daqiqa oldin chiqaman — uyqudan yeb qo\'yadi. Nazorat kunlari onam taksi chaqirib beradi»', note: 'Ikki workaround topildi: vaqt qurboni + taksi. Og\'riq isbotlanmoqda.' },
        { t: '«Mening yechimimni aytib beraymi?»', good: false, reply: '«Ayting… qiziq»', note: 'Hali erta! Pitch — intervyudan keyin. Avval faktlarni yig\'ib oling.' },
        { t: '«Boshqa o\'quvchilar ham shunaqami?»', good: false, reply: '«Bilmadim, shunaqadir-da»', note: 'U boshqalar nomidan gapira olmaydi — bu taxmin bo\'ladi, fakt emas.' }
      ]
    },
    {
      stage: '4 · Kamchilik', fact: { label: 'Kamchilik', emoji: '🕳️', color: T.grape, text: 'Erta chiqish — uyqu; taksi — qimmat' },
      resp: '«…nazorat kunlari onam taksi chaqirib beradi»',
      opts: [
        { t: '«Taksi bor-ku, demak muammo hal-a?»', good: false, reply: '«Shunaqa desa ham bo\'ladi…»', note: 'Siz XULOSANI aytib qo\'ydingiz — u rozi bo\'ldi. Uning og\'zidan eshiting!' },
        { t: '«Bu usullarning nimasi yomon?»', good: true, reply: '«Erta chiqish — uyqum o\'ldi. Taksi esa qimmat: har kuni ilojimiz yo\'q, faqat juda muhim kunlarda»', note: 'Mavjud yechimlarning kamchiligi — sizning MVP imkoniyatingiz shu yerda.' },
        { t: '«Yana qanaqa ilovalar ishlatasiz?»', good: false, reply: '«Ko\'p… Telegram, Instagram…»', note: 'Mavzudan chiqib ketdingiz — fokusni yo\'qotmang.' }
      ]
    },
    {
      stage: '5 · Isbot', fact: { label: 'Isbot', emoji: '💰', color: T.success, text: 'Haftasiga 2-3 taksi = 40-50 ming so\'m' },
      resp: '«…taksi qimmat, faqat juda muhim kunlarda»',
      opts: [
        { t: '«Bu muammoga pul yoki vaqt sarflayapsizmi hozir?»', good: true, reply: '«Hisoblasam — haftasiga 2-3 marta taksi, 40-50 ming so\'m! Va har kuni 20 daqiqa uyqu»', note: 'ISBOT: real pul + real vaqt allaqachon sarflanyapti. Bu tekshirilgan og\'riq!' },
        { t: '«Ilovamga oyiga 10 ming to\'larmidingiz?»', good: false, reply: '«Ehtimol… to\'lasam kerak»', note: 'Gipotetik pul — va\'da. «Sarflaganmisiz?» (o\'tmish) bilan «to\'larmidingiz?» (kelajak) — yer bilan osmon.' },
        { t: '«Rahmat, menga hammasi ayon!»', good: false, reply: '«Arzimaydi!»', note: 'Eng kuchli savol — isbot savoli qolib ketdi. Intervyuni isbotsiz yopmang.' }
      ]
    }
  ]
};

// Qazish drilli (s11)
const DIG_DRILL = [
  { id: 'g1', label: 'Respondent: «Ha, ba\'zan kech qolaman»', emoji: '🎬', color: T.blue, opts: ['«Unda ilovamni ko\'rsataman!»', '«Oxirgi marta qachon? Nima bo\'lgandi o\'shanda?»', '«Demak muammo bor ekan-da, to\'g\'rimi?»'], correct: 1, why: '«Ba\'zan» — tuman. Aniq voqeaga qazing: qachon, nima bo\'ldi, nima yo\'qotdi.' },
  { id: 'g2', label: 'Respondent: «Buni Excel\'da yuritaman»', emoji: '🩹', color: T.honey, opts: ['«Excel eskirgan-ku! Ilova kerak sizga»', '«Zo\'r ekan, demak yechim bor»', '«Qanday yuritasiz? Qayeri ko\'p vaqt oladi?»'], correct: 2, why: 'Workaround topildi — endi uni ochib o\'rganing: qanday, qachon, qayeri og\'riqli.' },
  { id: 'g3', label: 'Respondent: «Bu menga unchalik muhim emas»', emoji: '🚪', color: T.grape, opts: ['«Qanaqasiga muhim emas?! Bu katta muammo-ku!»', '«Tushunarli — demak bu og\'riq emas. O\'zi kuningizda nima ko\'proq asabga tegadi?»', '«Xo\'p…» (xafa bo\'lib suhbatni tugatish)'], correct: 1, why: '«Muhim emas» — ham qimmatli natija! Bu muammoni chizib tashlang va OCHIQ savol bilan boshqa og\'riqni qidiring.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

const Split = ({ children, refEl }) => <div className="split" ref={refEl}>{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Zoomable = ({ children }) => {
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (!big) return;
    const onKey = (e) => { if (e.key === 'Escape') setBig(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [big]);
  return (
    <>
      {big && <div className="zoom-backdrop" onClick={() => setBig(false)} />}
      <div className={`zoomable ${big ? 'zoom-on' : ''}`}>
        <button type="button" className="zoom-btn" onClick={() => setBig(b => !b)} aria-label={big ? 'Kichraytirish' : 'Kattalashtirish'} title={big ? 'Kichraytirish' : 'Kattalashtirish'}>{big ? '✕' : '⛶'}</button>
        {children}
      </div>
    </>
  );
};

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    if (e.target && e.target.closest && e.target.closest('.mentor')) return;
    setMCollapsed(true);
  };
  const onContentScroll = () => {
    if (!collapseOn || mCollapsed) return;
    const el = contentRef.current;
    if (el && el.scrollTop > 6) setMCollapsed(true);
  };
  return (
    <MentorCtx.Provider value={{ enabled: collapseOn, collapsed: mCollapsed, setCollapsed }}>
      <div className="stage">
        <div className="stage-header" style={{ paddingLeft: padH, paddingRight: padH }}>
          <div className="progress-track"><div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }} /></div>
          <div className="chrome">
            <div className="chrome-left eyebrow"><span className="dot" /><span>{eyebrow}</span></div>
            <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
          </div>
        </div>
        <div ref={contentRef} onClick={onContentClick} onScroll={onContentScroll} className={`stage-content ${narrow ? 'narrow' : ''}`} style={{ paddingLeft: padH, paddingRight: padH }}>{children}</div>
        {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
      </div>
    </MentorCtx.Provider>
  );
};
const NavBack = ({ onPrev }) => <button className="btn-ghost" onClick={onPrev} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Orqaga</button>;
const NavNext = ({ disabled, label = 'Davom etish', onClick }) => <button className="btn-white-accent" disabled={disabled} onClick={onClick} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)', marginLeft: 'auto' }}>{label}</button>;

const FeedbackBlock = ({ show, isCorrect, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (show) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => { setVisible(true); setTimeout(() => { if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 350); })); }
    else { setVisible(false); const t = setTimeout(() => setMounted(false), 400); return () => clearTimeout(t); }
  }, [show]);
  if (!mounted) return null;
  return <div ref={ref} className={`feedback-block ${visible ? 'visible' : ''}`}><div className={isCorrect ? 'frame-success' : 'frame-soft'}>{children}</div></div>;
};

const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === correctIdx;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (solved) { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === correctIdx ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}</p>
          <p className="body" style={{ margin: 0 }}>{solved ? explainCorrect : (explainWrong[picked] ?? explainWrong.default)}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

function ScoreRing({ correct, total }) {
  const PCT = total ? correct / total : 0;
  const col = PCT >= 0.6 ? T.success : T.accent;
  const R = 50, ST = 9, C = 2 * Math.PI * R;
  const [off, setOff] = useState(C);
  useEffect(() => { const t = setTimeout(() => setOff(C * (1 - PCT)), 200); return () => clearTimeout(t); }, [C, PCT]);
  return (
    <div className="ring-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={R} fill="none" stroke={T.ink3 + '40'} strokeWidth={ST} />
        <circle cx="64" cy="64" r={R} fill="none" stroke={col} strokeWidth={ST} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="ring-center"><div className="ring-num"><span style={{ color: col }}>{correct}</span><span className="ring-den">/{total}</span></div><div className="ring-lbl">to'g'ri javob</div></div>
    </div>
  );
}

const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
      <div className="mentor-ava" aria-hidden="true">
        <img src={mentorImg} alt="" />
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

const IcoChip = ({ color = T.accent, soft = T.accentSoft, children, size = 46 }) => (
  <span style={{ width: size, height: size, borderRadius: 13, background: soft, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</span>
);

const MentorCollapseScroll = ({ targetRef }) => {
  const ctx = useContext(MentorCtx) || {};
  const prev = useRef(false);
  useEffect(() => {
    if (ctx.enabled && ctx.collapsed && !prev.current && targetRef && targetRef.current) {
      const el = targetRef.current;
      setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 420);
    }
    prev.current = !!ctx.collapsed;
  }, [ctx.collapsed, ctx.enabled, targetRef]);
  return null;
};

// Faktlar hujjati (s15)
const FactsDoc = ({ rows, title = 'Intervyu xulosasi · 4-sahifa' }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.mic(16)}</span><span>{title}</span></div>
    {rows.map((r, i) => (
      <div key={i} className="deck-row">
        <span className="deck-num" style={{ background: r.color }}>{i + 1}</span>
        <div style={{ minWidth: 0 }}><span className="deck-tag" style={{ color: r.color }}>{r.emoji} {r.label}</span><p className="deck-val">{r.text}</p></div>
      </div>
    ))}
  </div>
);

const ArcStrip = () => (
  <div className="arc-strip fade-up delay-2">
    {STAGES.map((s, i) => (
      <React.Fragment key={s.n}>
        <div className={`arc-chip ${i === 1 ? 'arc-here' : ''}`}>
          <span style={{ fontSize: 14 }}>{s.ic}</span>
          <span className="arc-t">{s.t}</span>
          {i === 0 && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(11)}</span>}
          {i === 1 && <span className="arc-you">1/3</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// Chat xabari
const Msg = ({ who, ava, children, lie }) => (
  <div className={`msg-row ${who === 'u' ? 'msg-row-u' : ''}`}>
    {who === 'r' && <span className="msg-ava">{ava}</span>}
    <div className={`msg ${who === 'u' ? 'msg-u' : 'msg-r'} ${lie ? 'msg-lie' : ''}`}>{children}{lie && <span className="lie-tag">🎈 xushmuomala yolg'on</span>}</div>
  </div>
);

// ===== SCREEN 0 — HOOK: ONANGIZ HAM YOLG'ON GAPIRADI =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Chunki u g\'oyani tushunmadi' },
    { id: 'b', label: 'Chunki u sizni sevadi — xafa qilmaslik uchun rozi bo\'ladi' },
    { id: 'c', label: 'Xavfli emas — ona doim to\'g\'risini aytadi' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Akselerator" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Onangiz ham sizga <span className="italic" style={{ color: T.accent }}>yolg'on gapiradi</span>.</h1>
        <Mentor>Qo'rqinchli eshitiladi, lekin bu — mahsulot dunyosidagi eng mashhur kitoblardan biri «Mom Test»ning bosh g'oyasi. Vaziyatni ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.accent}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.accent, fontWeight: 700 }}>🏠 OSHXONADA</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Siz: «Onajon, uy vazifalari uchun ilova qilyapman. Zo'r g'oyami?»</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '8px 0 0', lineHeight: 1.55 }}>Onangiz: «Voy bolam, juda zo'r! Sen aqllisan-da. Albatta hamma ishlatadi!»</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,14.5px)', color: T.ink2, margin: '10px 0 0', fontStyle: 'italic' }}>3 oydan keyin: ilova tayyor, foydalanuvchi — 0. Onangiz ham o'rnatmagan.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega bu «zo'r!» javobi xavfli edi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : 'Aslida — '}<b>u sizni sevadi va xafa qilgisi kelmaydi</b>. Va bu faqat onalar emas: HAMMA odam g'oyangizga «zo'r!» deydi — xushmuomalalikdan. Rob Fitzpatrick buni «Mom Test» deb atagan: savolni shunday beringki, <b>hatto onangiz ham yolg'on gapira olmasin</b>. Bugun shu san'atni o'rganamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Nega odamlar intervyuda yolg\'on gapiradi', tag: '' },
    { text: 'Taqiqlangan savollar filtri', tag: 'o\'yin' },
    { text: 'Oltin qoida: o\'tmish fakti > kelajak va\'dasi', tag: '' },
    { text: '5-savol shabloni + yolg\'on detektori', tag: '' },
    { text: 'Rolli intervyu: chat-simulyator', tag: 'jonli' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.mic(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Yolg'on o'tkazmaydigan savollar</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Ov varag'idagi muammolarni odamlar bilan tekshirishga tayyorgarlik.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Yangi bosqich: Tekshir! Keyingi darsda — 5 REAL intervyu</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Custdev</span>: savol berish san'ati</h2></div>
        <Mentor>Ovlagan 10 muammongiz — hali faraz. Ularni faqat ODAMLAR tasdiqlaydi. Lekin noto'g'ri so'rasangiz, hamma «zo'r!» deydi va siz aldanasiz. Bugun — to'g'ri so'rash.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — NEGA YOLG'ON GAPIRISHADI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(LIE_WHY.map(w => w.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= LIE_WHY.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? LIE_WHY.find(w => w.id === active) : null;
  return (
    <Stage eyebrow="Nega yolg'on" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${LIE_WHY.length} sababni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Odamlar yomon emas. <span className="italic" style={{ color: T.accent }}>Shunchaki uchta sabab bor.</span></h2></div>
        <Mentor>Hech kim sizni ataylab aldamaydi. Lekin uch kuch birlashib, intervyungizni foydasiz qilib qo'yadi. Uchchalasini o'rganing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LIE_WHY.map(w => { const on = seen.has(w.id); return (
                <button key={w.id} className="lens-btn" style={active === w.id ? { boxShadow: `inset 0 0 0 2px ${w.color}`, background: w.soft } : undefined} onClick={() => tap(w.id)}>
                  <span style={{ fontSize: 17 }}>{w.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? w.color : T.ink }}>{w.label}</span>
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Sababni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xulosa: aybdor — respondent emas, <b>SAVOL</b>. Fikr va kelajak so'rasangiz — yolg'on olasiz. Fakt va o'tmish so'rasangiz — haqiqat olasiz. Hammasi sizning qo'lingizda.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — TAQIQLANGAN SAVOLLAR FILTRI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(QFILTER.map(q => [q.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = QFILTER.filter(q => state[q.id]?.ok).length;
  const done = okCount >= QFILTER.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (q, asBanned) => {
    if (state[q.id]?.ok) return;
    const ok = asBanned === q.banned;
    setState(prev => ({ ...prev, [q.id]: { ok, wrong: !ok } }));
    setLast({ id: q.id, ok, why: q.why, banned: q.banned });
  };
  return (
    <Stage eyebrow="Savol filtri · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Filtrlang (${okCount}/${QFILTER.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Savol filtri: <span className="italic" style={{ color: T.accent }}>🚫 taqiq yoki ✅ ruxsat?</span></h2></div>
        <Mentor>Mezon bitta: savol FIKR yoki KELAJAK haqidami (🚫) — yoki O'TMISHDAGI FAKT haqidami (✅)?</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QFILTER.map(q => {
                const st = state[q.id] || {};
                return (
                  <div key={q.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{q.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: q.banned ? T.accent : T.success }}>{q.banned ? '🚫 taqiq' : '✅ ruxsat'}</span>
                      : <span className="sort-btns"><button className="sort-btn" title="Taqiqlangan" onClick={() => pick(q, true)}>🚫</button><button className="sort-btn" title="Ruxsat etilgan" onClick={() => pick(q, false)}>✅</button></span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🛡️ Savol filtri</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{QFILTER.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / QFILTER.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ To\'g\'ri!' : '✗ Yana o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Tekshiring: bu savol FIKR/KELAJAK so\'rayaptimi (taqiq) yoki O\'TMISHDAGI XATTI-HARAKAT haqida so\'rayaptimi (ruxsat)?'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Savoldagi 🚫 yoki ✅ ni bosing — izoh shu yerda chiqadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Naqshni ko'rdingizmi? Taqiqlanganlarning hammasida <b>«…armidingiz?»</b> ohang bor — kelajak va faraz. Ruxsat etilganlari <b>«qachon / qanday / sarflaganmisiz»</b> — o'tmish va fakt.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Nega «shunday ilova bo'lsa ishlatarmidingiz?» — taqiqlangan savol?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega «ishlatarmidingiz?» — <span className="italic" style={{ color: T.accent }}>taqiqlangan</span>?</h2></>}
    options={['Chunki bu qo\'pol savol', 'Chunki kelajak haqidagi «ha» — bepul va\'da, hech narsani isbotlamaydi', 'Chunki odamlar ilovalarni yoqtirmaydi', 'Aslida bu eng yaxshi savol']} correctIdx={1}
    explainCorrect="To'g'ri! «Ha, ishlatardim» deyish hech narsa turmaydi — odam xushmuomalalik bilan va'da beradi. Real xatti-harakatni faqat O'TMISH ko'rsatadi: «hozir qanday hal qilyapsiz?»"
    explainWrong={{ 0: 'Savol muloyim — muammo ohangda emas, YO\'NALISHDA: kelajak farazi.', 2: 'Gap ilovada emas — va\'daning arzonligida.', 3: 'Bu eng XAVFLI savol: yolg\'on «ha»lar bilan sizni aldab qo\'yadi.', default: 'Kelajak va\'dasi arzon, o\'tmish fakti qimmat.' }} />
);

// ===== SCREEN 5 — OLTIN QOIDA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('future');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['future', 'past']) : new Set(['future']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isFuture = v === 'future';
  return (
    <Stage eyebrow="Oltin qoida" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'tmish fakti <span className="italic" style={{ color: T.accent }}>&gt;</span> kelajak va'dasi</h2></div>
        <Mentor>Bitta savolning ikki versiyasi — ikki dunyo. Ikkalasini solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isFuture ? 'chip-on' : ''}`} onClick={() => set('future')}>🔮 Kelajak so'roq</button>
              <button className={`chip ${!isFuture ? 'chip-on' : ''}`} onClick={() => set('past')}>📼 O'tmish so'roq</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isFuture ? T.grape : T.success}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: isFuture ? T.grape : T.success, fontWeight: 700 }}>{isFuture ? '🔮 «Sport ilovasini ishlatarmidingiz?»' : '📼 «O\'tgan hafta necha marta sport qildingiz?»'}</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>{isFuture
                ? '«Albatta! Yangi yildan boshlayman. Har kuni yuguraman!» — kelajakdagi IDEAL MEN gapiryapti. U hech qachon kelmaydi.'
                : '«Hmm… rostini aytsam, bir marta ham. Ishdan keyin holim yo\'q» — REAL MEN gapirdi. Mana haqiqat.'}</p>
            </div>
          </Col>
          <Col>
            {isFuture
              ? <div className="frame-warn fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>Kelajak savoliga javob — orzu. Orzuga mahsulot qursangiz, foydalanuvchisiz qolasiz (fitnes-zallar yanvar obunalaridan buni yaxshi biladi).</p></div>
              : <div className="frame-success fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>O'tmish savoliga javob — fakt. Fakt ba'zan yoqimsiz («hech kim sport qilmaydi») — lekin aynan shu sizni 3 oylik behuda qurilishdan asraydi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: intervyudagi HAR savolni o'tmishga burang. «Ishlatarmidingiz?» → «Hozir nima ishlatyapsiz?». «To'larmidingiz?» → «Sarflaganmisiz?»</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Qaysi javob haqiqiy qiymatga ega?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi javob — <span className="italic" style={{ color: T.accent }}>haqiqiy oltin</span>?</h2></>}
    options={['«Albatta sotib olaman, zo\'r g\'oya!»', '«O\'tgan oy shu muammo uchun repetitorga 200 ming to\'ladim»', '«Do\'stlarim ham albatta ishlatadi»', '«Omad tilayman, ajoyib boshlanish!»']} correctIdx={1}
    explainCorrect="To'g'ri! Sarflangan REAL pul — o'tmishdagi tekshirilgan fakt. Odam bu og'riqqa allaqachon to'layapti — demak yaxshiroq yechimga ham to'lashi mumkin."
    explainWrong={{ 0: 'Va\'da — bepul. «Albatta» so\'zi custdev\'da ogohlantiruvchi belgi.', 2: 'Boshqalar nomidan berilgan va\'da — ikki karra bepul.', 3: 'Iliq so\'z, nol ma\'lumot.', default: 'Pul/vaqt sarflangan o\'tmish — eng kuchli signal.' }} />
);

// ===== SCREEN 6 — 5-SAVOL SHABLONI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SCRIPT5.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= SCRIPT5.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? SCRIPT5.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="5-savol shabloni" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${SCRIPT5.length} savolni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning skriptingiz: <span className="italic" style={{ color: T.accent }}>5 savol</span></h2></div>
        <Mentor>Bu shablon keyingi darsda 5 ta REAL intervyungizning skeleti bo'ladi. Har savolni oching: nima uchun aynan shu tartib?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCRIPT5.map(s => { const on = seen.has(s.id); return (
                <button key={s.id} className="lens-btn" style={active === s.id ? { boxShadow: `inset 0 0 0 2px ${s.color}`, background: s.color + '15' } : undefined} onClick={() => tap(s.id)}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: s.color, minWidth: 14 }}>{s.n}</span>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? s.color : T.ink }}>{s.label}</span>
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.emoji} {cur.n}-savol · {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '12px 0 0', fontStyle: 'italic' }}>{cur.q}</p><p className="body" style={{ margin: '10px 0 0', color: T.ink2 }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Savolni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartibga e'tibor: voqea → og'riq → workaround → kamchilik → isbot. Har savol oldingisining javobiga quriladi — <b>suhbat, so'roq emas</b>.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — YOLG'ON DETEKTORI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(ANSWERS.map(a => [a.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = ANSWERS.filter(a => state[a.id]?.ok).length;
  const done = okCount >= ANSWERS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (a, asFact) => {
    if (state[a.id]?.ok) return;
    const ok = asFact === a.fact;
    setState(prev => ({ ...prev, [a.id]: { ok, wrong: !ok } }));
    setLast({ id: a.id, ok, why: a.why, fact: a.fact });
  };
  return (
    <Stage eyebrow="Yolg'on detektori · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Aniqlang (${okCount}/${ANSWERS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yolg'on detektori: <span className="italic" style={{ color: T.accent }}>💎 fakt yoki 🎈 xushmuomala?</span></h2></div>
        <Mentor>Intervyu javoblari keldi. Qaysilari real signal, qaysilari shunchaki iliq so'z? Detektorni yoqing.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ANSWERS.map(a => {
                const st = state[a.id] || {};
                return (
                  <div key={a.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{a.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: a.fact ? T.success : T.accent }}>{a.fact ? '💎 fakt' : '🎈 yolg\'on'}</span>
                      : <span className="sort-btns"><button className="sort-btn" title="Qimmatli fakt" onClick={() => pick(a, true)}>💎</button><button className="sort-btn" title="Xushmuomala yolg'on" onClick={() => pick(a, false)}>🎈</button></span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🔍 Detektor aniqligi</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{ANSWERS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / ANSWERS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ Detektor ishladi!' : '✗ Qayta tekshiring'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Belgi: javobda RAQAM, SANA, ANIQ VOQEA yoki SARFLANGAN PUL/VAQT bormi? Bo\'lsa — fakt. «Albatta/zo\'r/keyin» — yolg\'on belgisi.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Javobdagi 💎 yoki 🎈 ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula: 💎 faktlarda <b>raqam, sana, voqea, sarf</b> bor. 🎈 yolg'onlarda <b>«albatta», «zo'r», «hamma», undov belgisi</b> ko'p. Kompliment qancha baland — signal shuncha past.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== INTERVYU SIMULYATORI (umumiy komponent, s8 va s15) =====
const InterviewSim = ({ sim, onDone, storedDone, showFacts }) => {
  const [step, setStep] = useState(storedDone ? sim.steps.length : 0);
  const [log, setLog] = useState(() => storedDone
    ? sim.steps.flatMap(st => { const g = st.opts.find(o => o.good); return [{ who: 'u', t: g.t }, { who: 'r', t: g.reply }]; })
    : []);
  const [flash, setFlash] = useState(null); // {reply, note} — yomon tanlov
  const chatRef = useRef(null);
  const done = step >= sim.steps.length;
  useEffect(() => { if (done) onDone(); }, [done]);
  useEffect(() => {
    if (chatRef.current) { const el = chatRef.current; setTimeout(() => { el.scrollTop = el.scrollHeight; }, 60); }
  }, [log, flash]);
  const pick = (opt) => {
    if (done) return;
    if (opt.good) {
      setFlash(null);
      setLog(prev => [...prev, { who: 'u', t: opt.t }, { who: 'r', t: opt.reply }]);
      setStep(s => s + 1);
    } else {
      setFlash({ q: opt.t, reply: opt.reply, note: opt.note });
    }
  };
  const cur = !done ? sim.steps[step] : null;
  return (
    <div className="split">
      <Col>
        <div className="chatbox fade-up delay-1">
          <div className="chat-head"><span style={{ fontSize: 20 }}>{sim.persona.ava}</span><div><p className="chat-name">{sim.persona.name}</p><p className="chat-sub">{sim.persona.intro}</p></div></div>
          <div className="chat" ref={chatRef}>
            {log.length === 0 && !flash && <Msg who="r" ava={sim.persona.ava}>{sim.steps[0].resp}</Msg>}
            {log.map((m, i) => (<Msg key={i} who={m.who} ava={sim.persona.ava}>{m.t}</Msg>))}
            {flash && <>
              <Msg who="u">{flash.q}</Msg>
              <Msg who="r" ava={sim.persona.ava} lie>{flash.reply}</Msg>
            </>}
          </div>
        </div>
      </Col>
      <Col>
        {!done && cur && (
          <div className="fade-step" key={step}>
            <p className="flow-label" style={{ marginBottom: 8 }}>{cur.stage ? cur.stage + ' — savolingizni tanlang' : 'Savolingizni tanlang'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cur.opts.map((o, i) => (<button key={i} className="q-opt" onClick={() => pick(o)}><span className="mono small" style={{ minWidth: 16, color: T.ink3 }}>{String.fromCharCode(65 + i)}</span><span style={{ flex: 1 }}>{o.t}</span></button>))}
            </div>
          </div>
        )}
        {flash && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>🎈 Bu javobdan nima o'rgandik? Hech narsa.</p><p className="body" style={{ margin: 0, color: T.ink }}>{flash.note} Boshqa savol tanlang.</p></div>}
        {done && showFacts && (
          <div style={{ position: 'relative' }}>
            <FactsDoc rows={sim.steps.map(st => ({ emoji: st.fact.emoji, label: st.fact.label, color: st.fact.color, text: st.fact.text }))} />
            <span className="seal">SUHBAT YOPILDI ✓</span>
          </div>
        )}
        {done && !showFacts && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mashq tugadi! Sezdingizmi: yomon savol — yoqimli-yu bo'sh javob, yaxshi savol — fakt keltiradi. Katta intervyuda shu mahoratni to'liq qo'llaysiz.</p></div>}
      </Col>
    </div>
  );
};

// ===== SCREEN 8 — SIMULYATOR MASHQI: DILNOZA =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [finished, setFinished] = useState(!!storedAnswer);
  const onDone = useCallback(() => {
    setFinished(true);
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
  }, [storedAnswer, screen, onAnswer]);
  return (
    <Stage eyebrow="Simulyator · mashq" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!finished} label={finished ? 'Davom etish' : 'Intervyuni tugating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi mashq: <span className="italic" style={{ color: T.accent }}>Dilnoza bilan suhbat</span></h2></div>
        <Mentor>Har qadamda 3 savoldan birini tanlang. Yomon savol tanlasangiz — xushmuomala yolg'on olasiz va suhbat OLDINGA SILJIMAYDI. Faktlar olib keladigan savollarni toping!</Mentor>
        <Zoomable><InterviewSim sim={SIM1} onDone={onDone} storedDone={!!storedAnswer} showFacts={false} /></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Intervyuda kim ko'proq gapirishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Intervyuda kim <span className="italic" style={{ color: T.accent }}>ko'proq gapiradi</span>?</h2></>}
    options={['Siz — g\'oyani yaxshilab tushuntirishingiz kerak', 'Respondent — 80% u, 20% siz (qisqa savollar)', 'Teng — 50/50 suhbat', 'Mentor']} correctIdx={1}
    explainCorrect="To'g'ri! 80/20 qoidasi: siz qisqa savol berasiz, respondent gapiradi. Siz gapirgan har daqiqa — yo'qotilgan fakt. Va eng muhimi: G'OYANGIZNI PITCH QILMANG — siz sotuvchi emas, detektivsiz."
    explainWrong={{ 0: 'G\'oyani tushuntirish = pitch = respondent endi sizga yoqadigan javob beradi.', 2: 'Yaxshi suhbatda siz deyarli eshitasiz, xolos.', 3: 'Mentor keyingi darsda kuzatadi — gapirmaydi 🙂', default: '80% respondent, 20% siz.' }} />
);

// ===== SCREEN 10 — ESHITISH QOIDALARI =====
const LISTEN = [
  { id: 'l1', label: 'Pitch qilmang', emoji: '🤐', color: T.accent, soft: T.accentSoft, d: 'G\'oyangizni intervyu OXIRIGACHA aytmang. Aytdingizmi — tamom: endi odam sizga yoqishga harakat qiladi. Siz sotuvchi emas — detektivsiz.' },
  { id: 'l2', label: '80/20', emoji: '🎙️', color: T.blue, soft: T.blueSoft, d: 'Respondent 80% gapiradi. Sizning ishingiz — qisqa savol va bosh irg\'ash. Gap tugagach 3 soniya jim turing: odamlar jimlikni to\'ldirishga shoshiladi — eng qimmat gaplar shu payt chiqadi.' },
  { id: 'l3', label: 'Sitata yozing', emoji: '✍️', color: T.grape, soft: T.grapeSoft, d: 'Xulosangizni emas — odamning O\'Z SO\'ZLARINI yozing: «haftasiga 40 ming taksiga» — bu keyin pitch\'ingizdagi eng kuchli dalil bo\'ladi. Umumiy taassurot unutiladi, sitata qoladi.' },
  { id: 'l4', label: '«Yo\'q» ham natija', emoji: '🚪', color: T.success, soft: T.successSoft, d: '«Bu menga muammo emas» — muvaffaqiyatsizlik EMAS! Bu sizni 3 oylik behuda qurilishdan saqlagan qimmat javob. 10 tadan 7 muammo o\'lishi normal — tirik qolgan 3 tasi oltin.' }
];
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(LISTEN.map(l => l.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= LISTEN.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? LISTEN.find(l => l.id === active) : null;
  return (
    <Stage eyebrow="Eshitish san'ati" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${LISTEN.length} qoidani oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Savol berish — yarmi. <span className="italic" style={{ color: T.accent }}>Eshitish — qolgan yarmi.</span></h2></div>
        <Mentor>4 ta eshitish qoidasi — keyingi darsdagi real intervyularingiz uchun.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LISTEN.map(l => { const on = seen.has(l.id); return (
                <button key={l.id} className="lens-btn" style={active === l.id ? { boxShadow: `inset 0 0 0 2px ${l.color}`, background: l.soft } : undefined} onClick={() => tap(l.id)}>
                  <span style={{ fontSize: 17 }}>{l.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? l.color : T.ink }}>{l.label}</span>
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qoidani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Intervyu maqsadi — <b>tasdiqlatish emas, O'RGANISH</b>. G'oyangiz o'lsa intervyuda o'lsin — kod yozilgandan keyin emas.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — QAZISH DRILLI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(DIG_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = DIG_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= DIG_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Mashq · qazish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qazing (${okCount}/${DIG_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qazish mashqi: <span className="italic" style={{ color: T.accent }}>javobdan keyingi savol</span></h2></div>
        <Mentor>Intervyu — savollar ro'yxati emas, QAZISH: har javobdan chuqurroq savol chiqadi. Har vaziyatda eng yaxshi davomni tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DIG_DRILL.map(d => {
            const p = picked[d.id];
            const solved = p === d.correct;
            return (
              <div key={d.id} className="frame" style={{ padding: 'clamp(13px,2vw,17px)', borderLeft: `4px solid ${solved ? T.success : d.color}` }}>
                <p className="flow-label" style={{ color: d.color, marginBottom: 9 }}>{d.emoji} {d.label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {d.opts.map((o, i) => {
                    let cls = 'drill-opt';
                    if (solved && i === d.correct) cls += ' drill-ok';
                    else if (!solved && p === i && wrong[d.id]) cls += ' drill-no';
                    return (<button key={i} className={cls} disabled={solved} onClick={() => pick(d, i)}><span className="mono small" style={{ minWidth: 16, color: T.ink3 }}>{String.fromCharCode(65 + i)}</span><span style={{ flex: 1 }}>{o}</span>{solved && i === d.correct && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>);
                  })}
                </div>
                {solved && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.success, fontWeight: 600 }}>✓ {d.why}</p>}
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Qazish savoli faktga olib borishi kerak — pitch yoki yetaklashga emas.</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qazish refleksi tayyor. Endi — katta imtihon: to'liq rolli intervyu.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Respondent: «Juda zo'r g'oya ekan!» — nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Respondent: <span className="italic" style={{ color: T.accent }}>«Juda zo'r g'oya ekan!»</span> Nima qilasiz?</h2></>}
    options={['Xursand bo\'lib, ro\'yxatga «1 ta ijobiy javob» deb yozaman', 'Bu ma\'lumot emasligini bilib, faktga qaytaman: «Oxirgi marta bu muammo qachon bo\'lgandi?»', 'Darhol ilovani ko\'rsataman', 'Intervyuni muvaffaqiyatli deb yakunlayman']} correctIdx={1}
    explainCorrect="To'g'ri! Kompliment — ma'lumot emas, xushmuomalalik. Uni chiroyli qabul qiling-da, darhol o'tmish faktiga buriling. Intervyu qiymati komplimentlarda emas — faktlarda."
    explainWrong={{ 0: '«Ijobiy javob» statistikasi — o\'z-o\'zini aldash. 10 ta «zo\'r!» = 0 ta fakt.', 2: 'Pitch boshlandi — intervyu tugadi.', 3: 'Kompliment bilan yakunlangan intervyu — bo\'sh intervyu.', default: 'Komplimentni faktga aylantirib yuboring.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #4 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Zo\'r! 5 tadan 5 ta HA — bozor tasdiqlandi, qur!»' },
    { id: 1, t: '«5 ta HA emas — 5 ta xushmuomala yolg\'on oldingiz: savol kelajak farazi edi. Qayta so\'rang: oxirgi marta qachon sport qildingiz? nimaga to\'sqinlik qildi?»' },
    { id: 2, t: '«Intervyu umuman ishonchsiz usul — shunchaki qur»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz <span className="italic" style={{ color: T.accent }}>intervyu qilibdi</span>. Xursand.</h2></div>
        <Mentor>Aziz muammosini toraytirdi va odamlar bilan gaplashdi. Natijasini Mom Test bilan tekshiring.</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«5 ta sinfdoshdan so'radim: “Darsdan keyin mashq rejasini tuzib beradigan ilova bo'lsa, ishlatarmiding?” — BESHALASI HAM “HA, albatta!” dedi! Bozor bor! Endi qursam bo'ladi-a?»</p>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {OPTS.map(o => {
            let cls = 'option';
            if (solved) { if (o.id === 1) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (picked === o.id) cls += ' option-picked-wrong';
            return (<button key={o.id} className={cls} disabled={solved} onClick={() => pick(o.id)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(13.5px,1.7vw,15.5px)', display: 'flex', alignItems: 'center', gap: 12 }}><span className="mono small" style={{ minWidth: 20, color: T.ink3 }}>{String.fromCharCode(65 + o.id)}</span><span style={{ flex: 1, textAlign: 'left' }}>{o.t}</span></button>);
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? 'To\'g\'ri maslahat' : 'Yana o\'ylang'}</p>
          <p className="body" style={{ margin: 0 }}>{solved
            ? '«Ishlatarmiding?» — klassik taqiqlangan savol: kelajak + faraz + sinfdoshlar uni xafa qilgisi kelmaydi. 5 ta «ha» = 0 ta fakt. To\'g\'ri yo\'l: o\'tmishga qaytish — qachon sport qildi, nima to\'sdi, hozir nima qilyapti, pul/vaqt sarflaganmi.'
            : (picked === 0 ? '5/5 «ha» — bu aslida OGOHLANTIRUVCHI belgi: hamma rozi bo\'lsa, savol noto\'g\'ri berilgan.' : 'Intervyu ishonchli — agar savollar to\'g\'ri bo\'lsa. Usulni emas, savolni tuzating.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Katta intervyuga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Mom Test: <span className="italic" style={{ color: T.accent }}>hatto onangiz ham yolg'on gapira olmasin</span></h2></div>
      <Mentor>Katta intervyu oldidan kompas. 4 qoida — va mikrofon sizniki.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎙️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — detektiv</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Sotmang. So'rang. Eshiting. Yozing.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.x(18), c: T.accent, t: 'TAQIQ — fikr, kelajak, gipotetik pul so\'ramang' }, { ic: Ico.repeat(18), c: T.blue, t: 'O\'TMISH — «qachon / qanday / sarflaganmisiz» — fakt qazing' }, { ic: Ico.mic(18), c: T.grape, t: '5-SAVOL — vaziyat → og\'riq → workaround → kamchilik → isbot' }, { ic: Ico.ear(18), c: T.success, t: 'ESHITING — 80/20, pitch yo\'q, sitata yozing, «yo\'q» ham natija' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: ROLLI INTERVYU (MALIKA) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [finished, setFinished] = useState(!!storedAnswer);
  const prevDone = useRef(!!storedAnswer);
  const onDone = useCallback(() => {
    setFinished(true);
    if (!prevDone.current) {
      prevDone.current = true;
      onAnswer(screen, { correct: true, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson96_interview', {
        title: 'Rolli intervyu (Malika, avtobus muammosi)',
        facts: SIM2.steps.map(st => ({ label: st.fact.label, text: st.fact.text })),
        savedAt: Date.now()
      });
    }
  }, [screen, onAnswer]);
  return (
    <Stage eyebrow="Yakuniy ish · rolli intervyu" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!finished} label={finished ? 'Davom etish' : '5 bosqichni o\'tang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Katta intervyu: <span className="italic" style={{ color: T.accent }}>Malika, avtobus muammosi</span></h2></div>
        <Mentor>5-savol shabloni bo'yicha to'liq intervyu o'tkazing. Har bosqichda to'g'ri savolni toping — o'ngda faktlar xulosasi yig'iladi. Bu portfolio 4-sahifangiz bo'ladi!</Mentor>
        <Zoomable><InterviewSim sim={SIM2} onDone={onDone} storedDone={!!storedAnswer} showFacts={true} /></Zoomable>
        {finished && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qarang: 5 ta to'g'ri savol — va qo'lingizda <b>tekshirilgan og'riq</b>: voqea, oqibat, 2 ta workaround, ularning kamchiligi va haftasiga 40-50 ming so'mlik isbot. Keyingi darsda buni 5 ta REAL odam bilan qilasiz — va 🎖 Tadqiqotchi nishonini olasiz!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const BADGES = [
  { t: 'Muammo Ovchisi', l: 'olingan' },
  { t: 'Tadqiqotchi', l: 'KEYINGI DARS!' },
  { t: 'Quruvchi', l: '103-dars' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Odamlar xushmuomalalikdan yolg\'on gapiradi — aybdor savol, respondent emas', 'Taqiq: fikr, kelajak, gipotetik pul. Ruxsat: o\'tmish, fakt, sarf', '5-savol: vaziyat → og\'riq → workaround → kamchilik → isbot', 'Eshitish: 80/20, pitch yo\'q, sitata yozing, «yo\'q» ham natija'];
  const GLOSSARY = [{ b: 'Mom Test', t: '— hatto onangiz ham yolg\'on gapira olmaydigan savollar' }, { b: 'Taqiqlangan savol', t: '— fikr/kelajak/gipotetik so\'roq' }, { b: 'Xushmuomala yolg\'on', t: '— «zo\'r! albatta!» — iliq, lekin bo\'sh javob' }, { b: '5-savol shabloni', t: '— intervyu skeleti' }, { b: 'Qazish (follow-up)', t: '— javobdan chuqurroq savol chiqarish' }, { b: '80/20', t: '— respondent gapiradi, siz eshitasiz' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tekshir bosqichi · 1/3" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.rocket(12)}</span> 4-dars tamom</span><h2 className="title h-title fade-up d1">Endi sizni <span className="italic" style={{ color: T.accent }}>aldab bo'lmaydi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Mom Test qo\'lingizda: taqiqlangan savollarni ko\'rasiz, yolg\'onni sezasiz, faktgacha qaziysiz. Simulyatorda ikkita intervyu o\'tkazdingiz — endi real odamlar navbati.' : 'Yaxshi harakat! Savol berish — modulning eng nozik mahorati. Darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i === 0 ? 'badge-done' : ''} ${i === 1 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🔜' : '🔒')} {b.t}<span className="badge-when" style={i === 0 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi darsda <b style={{ color: T.honey }}>5 ta REAL intervyu</b> o'tkazasiz — birinchisi eng oson: oiladan boshlaysiz.</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🎙️</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — 5-savolni yodlang</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Bugun kechki ovqatda oilangizdan birovga 5-savol shablonini sinab ko'ring (ov varag'ingizdagi biror muammo bo'yicha). E'tibor bering: qachon fakt keladi, qachon «zo'r-zo'r» boshlanadi. Keyingi dars: 5 real intervyu + 🎖 Tadqiqotchi nishoni.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson29({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());
  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, data) => setAnswers(a => ({ ...a, [idx]: data }));
  const reset = () => { setAnswers({}); setScreen(0); startTimeRef.current = Date.now(); };

  const finishLesson = () => {
    const scoredMeta = SCREEN_META.filter(s => s.scored);
    const finalMeta = scoredMeta.filter(s => s.scope === 'final');
    const scoredAnswers = SCREEN_META.map((s, i) => (s.scored ? answers[i] : null)).filter(Boolean);
    const correctAnswers = scoredAnswers.filter(a => a.correct).length;
    const finalCorrect = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean).filter(a => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((_s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        /* PRODUCTION: shu @import OLIB TASHLANADI — shriftlarni LMS yuklaydi (platform_contract). */
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,500&family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
        .lesson-root h1,.lesson-root h2,.lesson-root h3,.lesson-root h4,.lesson-root h5,.lesson-root h6,.lesson-root p,.lesson-root ul,.lesson-root ol { margin: 0; padding: 0; }

        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.45s cubic-bezier(.2,.7,.2,1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        @keyframes feat-pop { 0% { transform: scale(.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .feat-pop { animation: feat-pop .34s cubic-bezier(.2,.7,.2,1); }
        @keyframes shake { 0%,100% { transform: none; } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .shake-x { animation: shake 0.42s; }
        @keyframes stamp-in { 0% { opacity: 0; transform: scale(2.4) rotate(6deg); } 60% { opacity: 1; transform: scale(0.94) rotate(-10deg); } 80% { transform: scale(1.05) rotate(-7deg); } 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }

        /* === ARC STRIP === */
        .arc-strip { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .arc-chip { display: inline-flex; align-items: center; gap: 6px; background: ${T.paper}; border-radius: 99px; padding: 7px 12px; font-family: 'Manrope'; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .arc-t { font-weight: 700; font-size: 11.5px; color: ${T.ink}; }
        .arc-here { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.35); }
        .arc-you { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.05em; animation: you-pulse 1.8s ease-in-out infinite; }
        @keyframes you-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,79,40,0.45); } 50% { box-shadow: 0 0 0 5px rgba(255,79,40,0); } }
        .arc-sep { color: ${T.ink3}; font-size: 13px; }

        /* === CHAT (s8, s15) === */
        .chatbox { background: ${T.paper}; border-radius: 16px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2); overflow: hidden; display: flex; flex-direction: column; }
        .chat-head { display: flex; align-items: center; gap: 10px; padding: 12px 15px; border-bottom: 1px solid ${T.ink3}33; background: ${T.bg}; }
        .chat-name { font-family: 'Manrope'; font-weight: 800; font-size: 13px; color: ${T.ink}; margin: 0; }
        .chat-sub { font-size: 11px; color: ${T.ink2}; margin: 1px 0 0; line-height: 1.35; }
        .chat { display: flex; flex-direction: column; gap: 8px; padding: 14px; max-height: 340px; overflow-y: auto; scroll-behavior: smooth; }
        .msg-row { display: flex; align-items: flex-end; gap: 7px; }
        .msg-row-u { justify-content: flex-end; }
        .msg-ava { font-size: 20px; flex-shrink: 0; }
        .msg { max-width: 85%; border-radius: 4px 13px 13px 13px; padding: 9px 12px; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); line-height: 1.45; color: ${T.ink}; animation: fade-step 0.3s; position: relative; }
        .msg-r { background: ${T.bg}; }
        .msg-u { background: ${T.accentSoft}; border-radius: 13px 4px 13px 13px; }
        .msg-lie { box-shadow: inset 0 0 0 1.5px ${T.accent}66; }
        .lie-tag { display: block; margin-top: 5px; font-family: 'Manrope'; font-weight: 700; font-size: 9.5px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.05em; }

        /* === SAVOL TUGMALARI === */
        .q-opt { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; text-align: left; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .q-opt:hover { transform: translateY(-1px); box-shadow: 0 8px 18px -8px rgba(${T.shadowBase},0.24); }

        /* === SARALASH === */
        .sort-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; }
        .sort-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .sort-text { flex: 1; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; line-height: 1.4; }
        .sort-btns { display: inline-flex; gap: 5px; flex-shrink: 0; }
        .sort-btn { width: 34px; height: 30px; border: none; border-radius: 9px; background: ${T.bg}; font-size: 14px; cursor: pointer; transition: all 0.15s; }
        .sort-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.3); background: ${T.accentSoft}; }
        .sort-verdict { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; animation: feat-pop .3s cubic-bezier(.2,.7,.2,1); }

        /* === METER === */
        .fmeter-track { height: 10px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; }
        .fmeter-fill { height: 100%; background: linear-gradient(90deg, ${T.honey}, ${T.accent}); border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.45); }

        /* === LINZA === */
        .lens-btn { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 12px; padding: 12px 14px; background: ${T.paper}; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .lens-btn:hover { transform: translateY(-1px); }
        .lens-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; }

        /* === DRILL === */
        .drill-opt { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 10px; padding: 9px 12px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; text-align: left; }
        .drill-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -7px rgba(${T.shadowBase},0.22); }
        .drill-opt:disabled { cursor: default; }
        .drill-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .drill-no { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake 0.42s; }

        /* === MUHR === */
        .seal { position: absolute; bottom: 10px; right: 12px; padding: 5px 11px; border: 2.5px solid ${T.success}; border-radius: 8px; color: ${T.success}; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; transform: rotate(-7deg); background: rgba(255,255,255,0.78); animation: stamp-in 0.5s cubic-bezier(.2,.9,.3,1.4) 0.15s both; }

        /* === KONFETTI === */
        .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .cf { position: absolute; top: -14px; width: 8px; height: 13px; border-radius: 2px; opacity: 0; animation: cf-fall 2.8s ease-in forwards; }
        @keyframes cf-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(76vh) rotate(560deg); opacity: 0; } }

        /* === BADGE === */
        .badge-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 99px; background: ${T.bg}; color: ${T.ink2}; font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .badge-when { color: ${T.ink3}; font-weight: 600; }
        .badge-done { background: ${T.honey}; color: #fff; box-shadow: 0 6px 16px -6px rgba(224,137,43,0.55); }
        .badge-next { background: ${T.honeySoft}; color: ${T.honey}; box-shadow: inset 0 0 0 1.5px ${T.honey}55; position: relative; overflow: hidden; }
        .badge-next::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.75), transparent); animation: badge-shine 2.4s ease-in-out infinite; }
        @keyframes badge-shine { 0% { left: -60%; } 55% { left: 120%; } 100% { left: 120%; } }

        /* === DOC === */
        .deck-doc { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2); display: flex; flex-direction: column; gap: 9px; border-top: 4px solid ${T.accent}; }
        .deck-head { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.ink}; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; border-bottom: 1px solid ${T.ink3}33; }
        .deck-row { display: flex; gap: 9px; align-items: flex-start; animation: fade-step .3s; }
        .deck-num { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .deck-tag { font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .deck-val { font-family: 'Georgia, serif'; font-size: 12.5px; color: ${T.ink}; line-height: 1.45; margin: 2px 0 0; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === KNOPKALAR === */
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .option:hover:not(:disabled) { background: #FDFBF7; transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -8px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.5 !important; box-shadow: none !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.34) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }

        /* === MENTOR / ZOOM === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -7px rgba(${T.shadowBase},0.16); }

        /* === HOOK === */
        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .hook-option:hover:not(:disabled):not(.on) { transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }

        /* === STAGE === */
        .stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55), 0 0 3px rgba(255,79,40,0.4); }

        /* === FRAME === */
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === SPEC CARD === */
        .spec-card { background: ${CODE.bg}; border-radius: 14px; padding: 16px 17px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); display: flex; flex-direction: column; gap: 12px; }
        .spec-text { font-family: 'Georgia, serif'; font-size: clamp(13px,1.7vw,15px); line-height: 1.5; margin: 3px 0 0; }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 16px 18px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); animation: fade-step 0.34s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; display: inline-block; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === YAKUN === */
        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { display: inline-flex; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; flex-shrink: 0; margin-top: 1px; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        /* MOBIL Mentor */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
