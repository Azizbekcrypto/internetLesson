import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · KOD1 — MINI-MVP ARXITEKTURASI — v16 (AUDIOSIZ)
// G'oya: 98-darsdagi MVP qarorini QURILISH CHIZMASIga aylantirish — kod yozishdan OLDIN.
// Hook: Nomad List — dunyodagi eng mashhur "sayt" Google Jadval edi (Pieter Levels).
// Signature 1: Komponent sxemasi safari (4 blok: foydalanuvchi → sahifa → server → baza).
// Signature 2: Stek tanlash drilli — tanishlik printsipi (PERN: M4-M6dan tanish).
// Signature 3: Fundament chegarasi o'yini (9 element: ✅ birinchi kun / ⏳ keyin / ❌ kerak emas).
// Yakuniy ish: ARXITEKTURA CHIZMASI — portfolio 7-sahifa (3 qavat + stek + fundament + kesilganlar).
// Davomiylik: mahsulot 98-darsdagi avtobus-tracker (QachonKeladi); lesson98_mvp_decision o'qiladi; Aziz case #7.
// QUR bosqichi OCHILDI (1/6). AUDIOSIZ. PRODUCTION: <style> ichidagi @import OLIB TASHLANADI.
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
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>),
  db: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>),
  coins: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="9" r="6" /><path d="M15.5 5.5a6 6 0 1 1-7 9.8" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></svg>),
  scissors: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="6" cy="6" r="2.6" /><circle cx="6" cy="18" r="2.6" /><path d="M8.2 7.6L20 19M8.2 16.4L20 5" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'kod-mvp-arch-v16', lessonTitle: { uz: 'Mini-MVP arxitekturasi — chizma birinchi', ru: 'Архитектура mini-MVP' } };
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
// 98-darsdagi MVP qarorini o'qish (davomiylik)
const readLesson98Decision = () => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    if (!raw) return null;
    const dec = JSON.parse(raw)?.lesson98_mvp_decision;
    if (dec && Array.isArray(dec.fields) && dec.fields.length) return dec.fields;
  } catch { /* bo'sh */ }
  return null;
};

// ===== KONSEPT LEKSIKONI =====
// 3 qavat (s2)
const LAYERS = [
  { id: 'l1', label: 'FRONTEND', sub: "ko'rinish", emoji: '🎨', color: T.blue, soft: T.blueSoft, d: 'Foydalanuvchi KO\'RADIGAN yagona qavat: sahifa, katta raqam, «7 daqiqada keladi» yozuvi. Malika faqat shu qavatni ko\'radi — qolgan hammasi parda ortida. Bizda: BITTA web-sahifa (React — 4-modulda qurgansiz).' },
  { id: 'l2', label: 'BACKEND', sub: 'miya', emoji: '⚙️', color: T.grape, soft: T.grapeSoft, d: 'Miya: hisob-kitob shu yerda. «Avtobus 8:02 da chiqqan + yo\'lda o\'rtacha 14 daqiqa → demak 7 daqiqada keladi». Foydalanuvchi bu qavatni hech qachon ko\'rmaydi — faqat NATIJASINI ko\'radi. Bizda: kichkina Express server.' },
  { id: 'l3', label: 'DATA', sub: 'xotira', emoji: '🗄️', color: T.honey, soft: T.honeySoft, d: 'Xotira: avtobus jadvali, yo\'nalish, o\'rtacha yo\'l vaqtlari. Backend har so\'rovda shu yerdan o\'qiydi. Server o\'chib yonsa ham ma\'lumot joyida turadi. Bizda: PostgreSQL — 2 tagina jadval.' }
];

// Komponent sxemasi safari (s3) — SIGNATURE 1
const SCHEMA = [
  { id: 'b1', emoji: '👩‍🎓', label: 'FOYDALANUVCHI', tech: 'Malika + telefon', color: T.accent, soft: T.accentSoft, d: 'Malika telefonida HAVOLANI ochadi — App Store yo\'q, o\'rnatish yo\'q. 97-intervyudagi respondentlaringizga ham xuddi shu havolani yuborasiz. Eng past to\'siq — eng ko\'p foydalanuvchi.' },
  { id: 'b2', emoji: '🖥️', label: 'WEB-SAHIFA', tech: 'React (frontend)', color: T.blue, soft: T.blueSoft, d: 'Bitta ekran: yo\'nalish nomi + katta raqam «7 daqiqa». Tugma ham deyarli yo\'q — ochdi, ko\'rdi, bo\'ldi. 98-darsda ro\'yxatdan o\'tishni kesganingizni eslang: sahifa BIRDANIGA javob beradi.' },
  { id: 'b3', emoji: '⚙️', label: 'SERVER', tech: 'Express API (backend)', color: T.grape, soft: T.grapeSoft, d: 'BITTA endpoint: GET /arrival. Bazadan jadvalni oladi, hozirgi vaqt bilan solishtiradi, «7» raqamini qaytaradi. 5-moduldagi katta loyihalar emas — 20-30 qator kod.' },
  { id: 'b4', emoji: '🗄️', label: 'BAZA', tech: 'PostgreSQL (data)', color: T.honey, soft: T.honeySoft, d: '2 jadval: routes (yo\'nalish nomi) va timetable (chiqish vaqtlari + o\'rtacha yo\'l daqiqasi). FK bilan bog\'langan — 4-modulda JOIN o\'rgangan edingiz, shu yerda ishlaydi.' }
];

// Stek tanlash drilli (s5) — SIGNATURE 2
const STACK_QS = [
  { id: 'q1', label: '1-qaror: sahifa nimada quriladi?', emoji: '🎨', color: T.blue,
    opts: ['Flutter — yangi va zamonaviy, 2 oyda o\'rganaman', 'React — 4-moduldan beri qurayapman, ertaga boshlayman', 'Faqat toza HTML — lekin jonli yangilanish juda qiynaydi'], correct: 1,
    why: 'Tanishlik = tezlik. React\'da siz ALLAQACHON komponent, state, fetch qilgansiz — birinchi ekran 1 kunda chiqadi.' },
  { id: 'q2', label: '2-qaror: miya (server) nimada?', emoji: '⚙️', color: T.grape,
    opts: ['Express — tanish, bitta endpoint uchun 20 qator yetadi', 'Nest — 5-modulda ko\'rganmiz, lekin bitta endpoint uchun og\'ir artilleriya', 'Server umuman yozmayman — balki keyin kerak bo\'lar'], correct: 0,
    why: 'Ikkalasini bilasiz — MVP ENGILINI tanlaydi: bitta GET /arrival uchun Express ideal. Nest katta jamoaviy loyihada kuchli (buni 5-modulda his qilgansiz).' },
  { id: 'q3', label: '3-qaror: ma\'lumot qayerda saqlanadi?', emoji: '🗄️', color: T.honey,
    opts: ['MongoDB — nomini ko\'p eshitganman, o\'rganib ko\'raman', 'TXT fayl — oddiy-ku, lekin deployda o\'chib ketadi', 'PostgreSQL — 4-moduldan tanish, 2 jadval 10 daqiqada tayyor'], correct: 2,
    why: 'FK, JOIN, schema — hammasini qilgansiz. 2 jadvalli baza siz uchun yangi bilim EMAS, shunchaki ish. Yangi baza o\'rganish = +2 hafta kechikish.' }
];
const STACK_RESULT = [
  { k: 'React', c: T.blue, m: 'frontend · 4-modul' },
  { k: 'Express', c: T.grape, m: 'backend · 5-modul' },
  { k: 'PostgreSQL', c: T.honey, m: 'data · 4-modul' }
];

// Fundament chegarasi o'yini (s7) — SIGNATURE 3
const FOUND = [
  { id: 'f1', t: 'Ma\'lumotlar bazasi (jadval + yo\'nalish)', ans: 'do', why: 'Miyaning oziqasi: ma\'lumotsiz «7 daqiqa» ni hisoblab bo\'lmaydi. Birinchi kun — 2 jadval.' },
  { id: 'f2', t: 'Deploy — internetga chiqarish (havola!)', ans: 'do', why: 'Havolasiz real foydalanuvchi YO\'Q. Malika localhost\'ingizga kira olmaydi. Birinchi kundan deploy — 1-modulda o\'rgangansiz.' },
  { id: 'f3', t: 'Git repozitoriy', ans: 'do', why: 'Birinchi kundan: AI bilan qurishda ayniqsa — buzilsa, bir buyruq bilan orqaga qaytasiz.' },
  { id: 'f4', t: 'Ro\'yxatdan o\'tish (auth)', ans: 'later', why: 'Kutilmagan javob-a? 98-darsda buni ficha sifatida kesgansiz — arxitekturada ham YO\'Q. Job auth so\'ramaydi: ochdi, ko\'rdi, ketdi.' },
  { id: 'f5', t: 'Admin panel (jadvalni tahrirlash)', ans: 'later', why: 'Boshida jadvalni SQL bilan O\'ZINGIZ kiritasiz — foydalanuvchi 10 ta bo\'lganda panel shart emas.' },
  { id: 'f6', t: '«5 daqiqada keladi» push-eslatmasi', ans: 'later', why: '98-qaroringizda ⏳ KEYIN edi — arxitektura qarorga bo\'ysunadi, o\'zicha ficha qo\'shmaydi.' },
  { id: 'f7', t: 'Docker + Kubernetes klaster', ans: 'no', why: '1000 serverlik kompaniya asbobi. Bizda: 1 sahifa, 1 endpoint, 2 jadval. Hosting o\'zi yetadi.' },
  { id: 'f8', t: 'Mikroservislar (5 alohida server)', ans: 'no', why: 'Bo\'lish — katta jamoa muammosi. Bir kishilik MVP = BITTA ilova (monolit). Bo\'laklashning o\'zi haftalar yeydi.' },
  { id: 'f9', t: 'O\'z serverimizni sotib olish', ans: 'no', why: 'Render/Railway bepul tarifi MVPga ortig\'i bilan yetadi — 4-modulda deploy qilgansiz. Temir sotib olish — boshqa davr hikoyasi.' }
];
const FMAP = { do: { emoji: '✅', label: 'BIRINCHI KUN', color: T.success }, later: { emoji: '⏳', label: 'KEYIN', color: T.honey }, no: { emoji: '❌', label: 'KERAK EMAS', color: T.accent } };

// Buzilish detektivi (s11)
const DETECTIVE = [
  { id: 'd1', label: 'Simptom: havola umuman ochilmayapti', emoji: '🔗', color: T.blue,
    opts: ['Baza aybdor — jadval noto\'g\'ri', 'Deploy qavati — sahifa internetga chiqmagan yoki hosting yiqilgan', 'Malika telefoni eski'], correct: 1,
    why: 'Sahifa umuman kelmasa — yetkazish qavati: deploy, hosting, domen. Bazani tekshirish — vaqtni behuda yeyish.' },
  { id: 'd2', label: 'Simptom: sahifa ochildi, lekin «NaN daqiqa» deb turibdi', emoji: '🧮', color: T.grape,
    opts: ['Frontend chiroyli chizilmagan', 'Foydalanuvchi noto\'g\'ri bosgan', 'Backend/data — hisobga ma\'lumot kelmayapti yoki formula xato'], correct: 2,
    why: 'Sahifa ishlayapti (ochildi-ku!) — raqam buzuq. Demak miyaga tushing: API nima qaytaryapti? Bazada nima bor?' },
  { id: 'd3', label: 'Simptom: hammasi ishlaydi, lekin avtobus jadvali o\'zgargan — vaqtlar eskirdi', emoji: '📅', color: T.honey,
    opts: ['Data qavati — bazani yangilash kerak; kod AYBSIZ', 'Serverni qaytadan yozish kerak', 'React versiyasini yangilash kerak'], correct: 0,
    why: 'Kod to\'g\'ri ishlayapti — MA\'LUMOT eskirgan. UPDATE so\'rovi yetadi. Qavatni bilish = 3 kunlik izlanish o\'rniga 3 daqiqalik tuzatish.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// Skelet daraxti (s10)
const SKELETON = [
  { id: 'sk1', key: 'client/', emoji: '🎨', color: T.blue, soft: T.blueSoft, title: 'client/ — React sahifa', d: 'src/App.jsx — bitta komponent: sahifa ochilganda fetch(\'/arrival\') qiladi va katta raqamni chizadi. 4-moduldagi birinchi React loyihangizdan ham kichik.' },
  { id: 'sk2', key: 'server/', emoji: '⚙️', color: T.grape, soft: T.grapeSoft, title: 'server/ — Express API', d: 'index.js — GET /arrival endpointi: bazadan jadvalni o\'qiydi, hozirgi vaqtdan ayiradi, {minutes: 7} qaytaradi. db.js — bazaga ulanish (4-modul .env saboqlari shu yerda!).' },
  { id: 'sk3', key: 'db/', emoji: '🗄️', color: T.honey, soft: T.honeySoft, title: 'db/ — sxema va boshlang\'ich ma\'lumot', d: 'schema.sql — 2 jadval: routes va timetable (FK bilan). seed.sql — o\'z maktab yo\'nalishingiz jadvalini qo\'lda kiritasiz: MVPda ma\'lumotni QO\'LDA kiritish uyat emas, tezlik!' }
];

// Arxitektura chizmasi (s15)
const ARCH_FIELDS = [
  { key: 'name', label: 'Mahsulot nomi', emoji: '🚀', color: T.accent, hint: 'Masalan: QachonKeladi' },
  { key: 'front', label: 'FRONTEND — foydalanuvchi nimani ko\'radi (1 ekran)', emoji: '🎨', color: T.blue, hint: 'Masalan: yo\'nalish nomi + «7 daqiqada keladi» katta raqami' },
  { key: 'back', label: 'BACKEND — miya nimani hisoblaydi', emoji: '⚙️', color: T.grape, hint: 'Masalan: jadval + hozirgi vaqtdan kelish daqiqasini hisoblaydi' },
  { key: 'data', label: 'DATA — nima saqlanadi va qayerdan keladi', emoji: '🗄️', color: T.honey, hint: 'Masalan: chiqish jadvali + o\'rtacha yo\'l vaqti, boshida qo\'lda kiritamiz' },
  { key: 'stack', label: 'STEK — qaysi texnologiyalar (tanish bo\'lsin!)', emoji: '🧰', color: T.grape, hint: 'Masalan: React + Express + PostgreSQL' },
  { key: 'fund', label: 'FUNDAMENT — birinchi kun: baza + deploy + git', emoji: '🧱', color: T.success, hint: 'Masalan: Render\'ga deploy, jadvalni SQL bilan kiritish, GitHub repo' },
  { key: 'cut', label: 'ARXITEKTURADA YO\'Q (kesilganlar)', emoji: '✂️', color: T.ink2, hint: 'Masalan: auth, admin panel, mikroservis, push' }
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

// Arxitektura hujjati (s15)
const ArchDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.layers(16)}</span><span>Arxitektura chizmasi · 7-sahifa</span></div>
    {rows.map((r, i) => (
      <div key={i} className="deck-row">
        <span className="deck-num" style={{ background: r.color }}>{r.emoji}</span>
        <div style={{ minWidth: 0 }}><span className="deck-tag" style={{ color: r.color }}>{r.label}</span><p className="deck-val">{r.text}</p></div>
      </div>
    ))}
  </div>
);

const ArcStrip = () => (
  <div className="arc-strip fade-up delay-2">
    {STAGES.map((s, i) => (
      <React.Fragment key={s.n}>
        <div className={`arc-chip ${i === 2 ? 'arc-here' : ''}`}>
          <span style={{ fontSize: 14 }}>{s.ic}</span>
          <span className="arc-t">{s.t}</span>
          {i <= 1 && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(11)}</span>}
          {i === 2 && <span className="arc-you">1/6</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: NOMAD LIST = GOOGLE JADVAL =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: '6 oy yashirincha katta mobil ilova qurdi' },
    { id: 'b', label: 'Oddiy Google Jadval ochib, havolasini internetga tashladi' },
    { id: 'c', label: 'Avval investor va katta jamoa qidirdi' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Akselerator" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Million dollarlik sayt <span className="italic" style={{ color: T.accent }}>Google Jadval edi</span></h1>
        <Mentor>QUR bosqichi ochildi! 🔧 Lekin kod yozishdan oldin — bitta hikoya arxitektura haqidagi tasavvuringizni o'zgartiradi.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>🌍 2014 · PIETER LEVELS</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Gollandiyalik dasturchi Pieter Levels sayohat qilib ishlaydiganlar uchun «qaysi shahar arzon va qulay?» savoliga javob mahsulotini boshladi — Nomad List.</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Uning qo'lida na jamoa, na katta server bor edi. Sizningcha, u BIRINCHI versiyani qanday qurdi?</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi biri deb o'ylaysiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : 'Yo\'q — '}u <b>ommaviy Google Jadval</b> ochdi: shaharlar, narxlar, internet tezligi. Odamlar o'zlari to'ldirdi, havola viral bo'ldi — KEYIN sayt qurildi. Bugun Nomad List — million dollarlik biznes, hali ham deyarli bir kishi boshqaradi. Saboq: <b>arxitektura maqtanish uchun emas — JOB uchun</b>. Bugun MVP'ingizga xuddi shunday kamtarona, lekin puxta chizma chizamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: '3 qavat: frontend · backend · data', tag: '' },
    { text: 'Komponent sxemasi: so\'rov safari (4 blok)', tag: 'o\'yin' },
    { text: 'Stek tanlash: tanishlik printsipi', tag: 'drill' },
    { text: 'Fundament chegarasi: ✅ / ⏳ / ❌', tag: 'o\'yin' },
    { text: 'ARXITEKTURA CHIZMASI — portfolio 7-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.layers(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>MVP qarori → qurilish chizmasi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Chizmasiz qurilish — devorsiz tom: kod yozishdan OLDIN sxema.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Bu KOD darsi: modulda yagona 🔧</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Arxitektura: <span className="italic" style={{ color: T.accent }}>kod yozishdan oldingi chizma</span></h2></div>
        <Mentor>98-darsda QAROR qabul qildingiz: 1 muammo + 3 ficha. Bugun bu qaror <b style={{ color: T.ink }}>chizmaga</b> aylanadi: qaysi qismlar, qaysi texnologiyalar, qaysi poydevor. Keyingi darslarda AI bilan AYNAN shu chizma bo'yicha qurasiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — 3 QAVAT =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(LAYERS.map(l => l.id)) : new Set());
  const [active, setActive] = useState(null);
  const done = seen.size >= LAYERS.length;
  const tap = (id) => {
    const idx = LAYERS.findIndex(l => l.id === id);
    if (idx > seen.size) return; // qavatlar tartib bilan ochiladi
    setActive(id);
    setSeen(prev => { const n = new Set(prev); n.add(id); return n; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? LAYERS.find(l => l.id === active) : null;
  return (
    <Stage eyebrow="Uch qavat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qavatlarni oching (${seen.size}/${LAYERS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har qanday web-mahsulot — <span className="italic" style={{ color: T.accent }}>3 qavatli bino</span></h2></div>
        <Mentor>Instagram ham, sizning avtobus-tracker ham — bir xil 3 qavat. Farqi faqat o'lchamda. Yuqoridan pastga oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="tl fade-up delay-1">
              {LAYERS.map((l, li) => { const on = seen.has(l.id); const act = active === l.id; const isNext = !on && li === seen.size; const locked = !on && li > seen.size; return (
                <button key={l.id} className={`tl-item ${on ? 'tl-seen' : ''} ${act ? 'tl-act' : ''} ${isNext ? 'tl-next' : ''} ${locked ? 'tl-lock' : ''}`} onClick={() => tap(l.id)}>
                  <span className="tl-dot" style={{ background: on ? l.color : T.paper, color: on ? '#fff' : T.ink3 }}>{locked ? '🔒' : l.emoji}</span>
                  <span className="tl-body"><span className="tl-year" style={{ color: l.color }}>{locked ? '· · ·' : `${li + 1}-qavat · ${l.sub}`}</span><span className="tl-title">{locked ? '?????' : l.label}</span></span>
                  {on && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                  {isNext && <span className="tl-cue">keyingi →</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label} — {cur.sub}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Birinchi qavatni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sehrli tomoni: bu 3 so'z bilan siz ISTALGAN mahsulotni «rentgen» qila olasiz. Telegram? Frontend — chat oynasi, backend — yetkazish, data — xabarlar. Endi o'zingiznikini chizamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — KOMPONENT SXEMASI SAFARI (SIGNATURE 1) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SCHEMA.map(b => b.id)) : new Set());
  const [active, setActive] = useState(null);
  const done = seen.size >= SCHEMA.length;
  const tap = (id) => {
    const idx = SCHEMA.findIndex(b => b.id === id);
    if (idx > seen.size) return; // safar tartib bilan
    setActive(id);
    setSeen(prev => { const n = new Set(prev); n.add(id); return n; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? SCHEMA.find(b => b.id === active) : null;
  return (
    <Stage eyebrow="Komponent sxemasi · safar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Safarni yakunlang (${seen.size}/${SCHEMA.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Malika sahifani ochdi — <span className="italic" style={{ color: T.accent }}>so'rov qanday safar qiladi?</span></h2></div>
        <Mentor>«7 daqiqa» raqami 4 bekatdan o'tib keladi. Har bekatni tartib bilan oching — o'ngda sxemangiz o'zi yig'iladi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SCHEMA.map((b, bi) => { const on = seen.has(b.id); const isNext = !on && bi === seen.size; const locked = !on && bi > seen.size; return (
                <button key={b.id} className={`plink ${active === b.id ? 'plink-on' : ''}`} style={locked ? { opacity: 0.42, cursor: 'default' } : undefined} onClick={() => tap(b.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{locked ? '🔒' : b.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{locked ? '?????' : b.label}</span><br /><span className="small" style={{ color: T.ink2 }}>{locked ? '· · ·' : b.tech}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : (isNext ? <span className="tl-cue">keyingi →</span> : null)}
                </button>
              ); })}
            </div>
            {cur && <div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,14.5px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Sxemangiz jonli yig'ilmoqda</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SCHEMA.map((b, bi) => { const on = seen.has(b.id); return (
                <React.Fragment key={b.id}>
                  <div className={`arch-box ${on ? 'arch-on' : ''}`} style={on ? { borderLeftColor: b.color } : undefined}>
                    <span style={{ fontSize: 16 }}>{on ? b.emoji : '·'}</span>
                    <span style={{ minWidth: 0 }}><span className="arch-lbl" style={{ color: on ? b.color : T.ink3 }}>{on ? b.label : '— — —'}</span>{on && <span className="arch-tech"> · {b.tech}</span>}</span>
                  </div>
                  {bi < SCHEMA.length - 1 && <span style={{ textAlign: 'center', color: seen.has(SCHEMA[bi + 1].id) ? T.accent : T.ink3, fontSize: 13, lineHeight: 1 }}>↓ ↑</span>}
                </React.Fragment>
              ); })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana ARXITEKTURA — 4 blok, 3 strelka. Murakkab sxemalar ham shu mantiq: <b>so'rov pastga tushadi, javob tepaga qaytadi</b>. Butun safar ~200 millisekund.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Web-mahsulotning 3 qavati nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Har qanday web-mahsulotning <span className="italic" style={{ color: T.accent }}>3 qavati</span>?</h2></>}
    options={['Dizayn, kod va reklama', 'Frontend (ko\'rinish) + Backend (miya) + Data (xotira)', 'HTML, CSS va JavaScript', 'Telefon, kompyuter va planshet versiyalari']} correctIdx={1}
    explainCorrect="To'g'ri! Frontend — foydalanuvchi ko'radigan sahifa; backend — ko'rinmas hisob-kitob miyasi; data — o'chmas xotira. Instagram ham, 3 fichali MVP'ingiz ham shu 3 qavat."
    explainWrong={{ 0: 'Reklama mahsulot qavati emas — tarqatish vositasi.', 2: 'HTML/CSS/JS — bu faqat FRONTEND qavatining g\'ishtlari.', 3: 'Qurilmalar — ekran o\'lchami; arxitektura qavatlari emas.', default: 'Ko\'rinish + miya + xotira — 3 qavat.' }} />
);

// ===== SCREEN 5 — STEK TANLASH DRILLI (SIGNATURE 2) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(STACK_QS.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = STACK_QS.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= STACK_QS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Stek tanlash · drill" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Stekni yig'ing (${okCount}/${STACK_QS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Stek tanlash: <span className="italic" style={{ color: T.accent }}>moda emas — TANISHLIK</span></h2></div>
        <Mentor>MVP stegining oltin qoidasi: <b style={{ color: T.ink }}>bilganing = tezliging</b>. Har «zamonaviy yangi texnologiya» = +haftalar kechikish. Malika kutmaydi. 3 qarorni qabul qiling.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STACK_QS.map(d => {
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
                    {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>MVP savoli: qaysi birini ALLAQACHON bilasiz va jobga yetadi?</p>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Stek kartangiz</p>
            <div className="frame fade-up delay-1" style={{ padding: '14px 17px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STACK_RESULT.map((s, i) => { const ok = picked[STACK_QS[i].id] === STACK_QS[i].correct; return (
                <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: ok ? 1 : 0.35, transition: 'opacity 0.3s' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.c, flexShrink: 0 }} />
                  <span className="mono" style={{ fontWeight: 700, fontSize: 13.5, color: T.ink }}>{s.k}</span>
                  <span className="small" style={{ color: T.ink2 }}>{s.m}</span>
                  {ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}
                </div>
              ); })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qarang: <b>React + Express + PostgreSQL</b> — siz 4-6-modullarda AYNAN shu stek bilan ishlagansiz! MVP uchun yangi bilim kerak emas — bori bilan TEZ qurish kerak. Bu sizning superkuchingiz.</p></div>}
            {!done && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Har qarorda «yaltiroq yangi» va «tanish ishchi» bor. MVP nimani tanlaydi?</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="MVP uchun stek qanday tanlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>MVP uchun stekni <span className="italic" style={{ color: T.accent }}>nima hal qiladi</span>?</h2></>}
    options={['Eng zamonaviy va moda bo\'lgan texnologiya', 'O\'zim BILADIGAN va core jobga yetadigan texnologiya', 'Eng katta kompaniyalar ishlatadigani', 'YouTube\'da eng ko\'p maqtalgani']} correctIdx={1}
    explainCorrect="To'g'ri! Ikki savol: bilamanmi? jobga yetadimi? Ikkalasiga HA — tanlov tayyor. Yangi texnologiya o'rganish zavqli, lekin bu MVP DAN KEYINGI zavq: hozir har hafta — real foydalanuvchi oldidagi qarz."
    explainWrong={{ 0: 'Moda o\'tadi, kechikish qoladi. MVPda tezlik — hayot.', 2: 'Google 10 000 dasturchiga quradi — siz bir kishisiz. Kontekst boshqa.', 3: 'YouTube maqtovi sizning tezligingizni oshirmaydi.', default: 'Bilaman + jobga yetadi = MVP stegi.' }} />
);

// ===== SCREEN 6 — ZAVOD YOKI UY =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('big');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['big', 'home']) : new Set(['big']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isBig = v === 'big';
  return (
    <Stage eyebrow="Zavod yoki uy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">MVP arxitekturasi: <span className="italic" style={{ color: T.accent }}>zavod emas — uy</span></h2></div>
        <Mentor>Internetda «to'g'ri arxitektura» deb ko'pincha katta kompaniya sxemalari ko'rsatiladi. Ikki yo'lni solishtiring — farqni his qilasiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isBig ? 'chip-on' : ''}`} onClick={() => set('big')}>🏭 Katta zavod</button>
              <button className={`chip ${!isBig ? 'chip-on' : ''}`} onClick={() => set('home')}>🏡 Bitta uy (monolit)</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isBig ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isBig
                ? 'Mikroservislar, Docker klasteri, GraphQL, alohida auth-server, message queue… Netflix shunday quradi — chunki ularda 2 700 dasturchi va 260 million foydalanuvchi bor. Har bo\'lak alohida JAMOA tomonidan boshqariladi.'
                : 'BITTA ilova: client + server + baza. Hammasi bir joyda, bir repoda, bir deploy tugmasi. Bir kishi TO\'LIQ tushunadi va bir kechada tuzata oladi. Instagram 13 kishi bilan 30 million foydalanuvchiga xizmat qilgan — monolitda.'}</p>
            </div>
          </Col>
          <Col>
            {isBig
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Bu sxemani BIR o'quvchi qursa: 2 oy sozlash, 0 foydalanuvchi. Katta arxitektura katta muammoni yechadi — sizda esa u muammo hali YO'Q. Bo'lish kerak bo'lganda bo'lasiz — bu «yaxshi muammo».</p></div>
              : <div className="frame-success fade-step" key="h"><p className="body" style={{ margin: 0, color: T.ink }}>MVP formulasi: <b>bitta uy, mustahkam poydevor</b>. 2-3 hafta — va Malika qo'lida ishlaydigan havola. O'sish kelsa — devorlarni keyin kengaytirasiz (buni 5-modulda Nest bilan ko'rgansiz).</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Arxitektura ham 98-darsdagi kesish san'ati: <b>murakkablik ham FICHA</b> — kerak bo'lmaganda kesiladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — FUNDAMENT CHEGARASI O'YINI (SIGNATURE 3) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(FOUND.map(f => [f.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = FOUND.filter(f => state[f.id]?.ok).length;
  const done = okCount >= FOUND.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (f, ans) => {
    if (state[f.id]?.ok) return;
    const ok = ans === f.ans;
    setState(prev => ({ ...prev, [f.id]: { ok, wrong: !ok } }));
    setLast({ id: f.id, ok, why: f.why, ans: f.ans });
  };
  return (
    <Stage eyebrow="Fundament · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Fundamentni quring (${okCount}/${FOUND.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Fundament: <span className="italic" style={{ color: T.accent }}>✅ birinchi kun · ⏳ keyin · ❌ kerak emas</span></h2></div>
        <Mentor>Har elementga savol: <b style={{ color: T.ink }}>«MVP BIRINCHI KUNIDAN ishlashi uchun shartmi?»</b> Ehtiyot bo'ling — bitta tuzoq bor 😉</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FOUND.map(f => {
                const st = state[f.id] || {};
                return (
                  <div key={f.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{f.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: FMAP[f.ans].color }}>{FMAP[f.ans].emoji} {FMAP[f.ans].label}</span>
                      : <span className="sort-btns">{['do', 'later', 'no'].map(a => (<button key={a} className="sort-btn" title={FMAP[a].label} onClick={() => pick(f, a)}>{FMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🧱 Poydevor mustahkamligi</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{FOUND.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / FOUND.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ To\'g\'ri qaror!' : '✗ Qayta o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Savol bitta: MVP birinchi kunidan ishlashi uchun SHARTMI? Shart — ✅; foydali lekin shoshilmas — ⏳; bizning o\'lchamga umuman mos emas — ❌.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Element yonidagi ✅ / ⏳ / ❌ ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Fundament = <b>baza + deploy + git</b>. Tuzoqni sezdingizmi: AUTH fundament EMAS! Ko'p boshlovchi 2 haftani login sahifasiga sarflaydi — job esa auth so'ramagan edi. Arxitektura 98-QARORGA bo'ysunadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MA'LUMOT MANBAI: WIZARD OF OZ =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('ideal');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['ideal', 'oz']) : new Set(['ideal']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isIdeal = v === 'ideal';
  return (
    <Stage eyebrow="Ma'lumot manbai" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumot qayerdan? <span className="italic" style={{ color: T.accent }}>«Oz sehrgari» siri</span></h2></div>
        <Mentor>Eng katta savol: avtobusning JONLI joylashuvi bizda yo'q-ku! GPS datchigi ham, transport API'si ham. To'xtaymizmi? Yo'q — ikki yo'lni ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isIdeal ? 'chip-on' : ''}`} onClick={() => set('ideal')}>🛰 Ideal: jonli GPS</button>
              <button className={`chip ${!isIdeal ? 'chip-on' : ''}`} onClick={() => set('oz')}>🧙 MVP: jadval + qo'l</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isIdeal ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isIdeal
                ? 'Har avtobusga GPS datchik, shahar bilan shartnoma, real-time server… Bu LOYIHA 2 yil va million dollar. Job esa nima edi? «Qachon kelishini BILISH» — millimetrgacha aniqlik emas!'
                : 'Chiqish jadvali (bekatda osig\'liq turadi — suratga olasiz!) + o\'rtacha yo\'l vaqti (sekundomer bilan 3 kun o\'lchaysiz) = «~7 daqiqada keladi». 25 daqiqalik NOANIQLIK o\'rniga ±2 daqiqalik ANIQLIK. Job bajarildi!'}</p>
            </div>
          </Col>
          <Col>
            {isIdeal
              ? <div className="frame-warn fade-step" key="i"><p className="body" style={{ margin: 0, color: T.ink }}>«Mukammal ma'lumotsiz boshlamayman» — MVP qotillaridan biri. Insaytni eslang: og'riq NOANIQLIKDA edi. Taxminiy javob ham noaniqlikni 90% ga kesadi.</p></div>
              : <div className="frame-success fade-step" key="o"><p className="body" style={{ margin: 0, color: T.ink }}>Buni «Wizard of Oz» MVP deyishadi: parda ortida qisman QO'L MEHNATI. DoorDash asoschilari birinchi buyurtmalarni O'ZLARI tashigan. Ma'lumotni qo'lda kiritish — uyat emas, TEZLIK.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Arxitektura saboqlaridan eng ozod qiluvchisi: <b>data qavati ham MVP bo'la oladi</b>. Keyin foydalanuvchi ko'paysa — haydovchi telefonidagi GPS bilan v2 qilasiz (⏳ ro'yxatingizda turibdi).</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="MVP fundamentiga qaysi biri KIRMAYDI?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Birinchi kun fundamentiga <span className="italic" style={{ color: T.accent }}>KIRMAYDIGANI</span> qaysi?</h2></>}
    options={['Ma\'lumotlar bazasi', 'Deploy — internetdagi havola', 'Ro\'yxatdan o\'tish (auth) — job talab qilmasa', 'Git repozitoriy']} correctIdx={2}
    explainCorrect="To'g'ri! Fundament = baza + deploy + git. Auth — FICHA: job talab qilsagina kiradi. Bizning avtobus-jobda «ochdi-ko'rdi-ketdi» — login faqat to'siq bo'lardi. 98-qarorga sodiq qoling."
    explainWrong={{ 0: 'Baza — miya oziqasi, birinchi kundan shart.', 1: 'Havolasiz real foydalanuvchi yo\'q — deploy fundament.', 3: 'Git — AI bilan qurishda ayniqsa: buzilsa qaytish yo\'li.', default: 'Fundament: baza + deploy + git. Auth — job so\'rasa.' }} />
);

// ===== SCREEN 10 — LOYIHA SKELETI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SKELETON.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const done = seen.size >= SKELETON.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? SKELETON.find(s => s.id === active) : null;
  const Ln = ({ ind = 0, c = CODE.text, children }) => <div style={{ paddingLeft: ind * 16, color: c, whiteSpace: 'pre' }}>{children}</div>;
  return (
    <Stage eyebrow="Loyiha skeleti" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Papkalarni oching (${seen.size}/${SKELETON.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Chizma → <span className="italic" style={{ color: T.accent }}>skelet: 3 papka</span></h2></div>
        <Mentor>Arxitektura kompyuterda shunday ko'rinadi — atigi 3 papka. Har birini bosib, ichida nima bo'lishini ko'ring. Keyingi darslarda AI aynan shu skeletni to'ldiradi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="spec-card fade-up delay-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(11.5px,1.5vw,13px)', lineHeight: 1.75 }}>
              <Ln c={CODE.attr}>qachon-keladi/</Ln>
              <Ln ind={1} c={seen.has('sk1') ? CODE.str : CODE.text}>├─ client/   <span style={{ color: CODE.comment }}>← 🎨 React sahifa</span></Ln>
              <Ln ind={2} c={CODE.comment}>│  └─ src/App.jsx</Ln>
              <Ln ind={1} c={seen.has('sk2') ? CODE.str : CODE.text}>├─ server/   <span style={{ color: CODE.comment }}>← ⚙️ Express API</span></Ln>
              <Ln ind={2} c={CODE.comment}>│  ├─ index.js — GET /arrival</Ln>
              <Ln ind={2} c={CODE.comment}>│  └─ db.js</Ln>
              <Ln ind={1} c={seen.has('sk3') ? CODE.str : CODE.text}>└─ db/       <span style={{ color: CODE.comment }}>← 🗄 sxema + seed</span></Ln>
              <Ln ind={2} c={CODE.comment}>   ├─ schema.sql — 2 jadval</Ln>
              <Ln ind={2} c={CODE.comment}>   └─ seed.sql — jadval qo'lda</Ln>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SKELETON.map(s => { const on = seen.has(s.id); return (<button key={s.id} className={`chip ${active === s.id ? 'chip-on' : ''}`} onClick={() => tap(s.id)}>{s.emoji} {s.key}{on && ' ✓'}</button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.title}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Papkani bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Butun mahsulot — <b>3 papka, ~6 fayl</b>. Qo'rqinchli emas-a? 101-darsda AI'ga aynan shu skeletni buyurasiz — va u sizga tushunarli bo'ladi, chunki CHIZMASI sizniki.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — BUZILISH DETEKTIVI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(DETECTIVE.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = DETECTIVE.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= DETECTIVE.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Buzilish detektivi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qavatni toping (${okCount}/${DETECTIVE.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Detektiv mashqi: <span className="italic" style={{ color: T.accent }}>qaysi QAVAT aybdor?</span></h2></div>
        <Mentor>Arxitekturani bilishning eng katta foydasi: buzilganda QAYERGA qarashni bilasiz. 3 simptom — qavatni toping.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DETECTIVE.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Safar xaritasini eslang: sahifa → server → baza. Simptom safarning qayerida uziladi?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu ko'nikma 101-105-darslarda oltin bo'ladi: AI kodida xato chiqsa, <b>«qaysi qavat?»</b> deb so'raysiz — va AI'ga ANIQ prompt yozasiz. Qavatni bilmagan odam «ishlamayapti, tuzat» deydi — va soatlab aylanadi.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Malika sahifani ochganda so'rov qaysi yo'lni bosib o'tadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>«7 daqiqa» raqami <span className="italic" style={{ color: T.accent }}>qaysi safarni</span> bosib keladi?</h2></>}
    options={['Sahifa → baza → sahifa (server shart emas)', 'Sahifa → server (API) → baza → server → sahifa', 'Baza → sahifa → server', 'Server raqamni Malika telefoniga SMS qiladi']} correctIdx={1}
    explainCorrect="To'g'ri! Sahifa APIga so'rov beradi, server bazadan jadvalni oladi, hisoblaydi va javobni sahifaga qaytaradi. So'rov pastga — javob tepaga. Butun safar ~200 ms."
    explainWrong={{ 0: 'Sahifa bazaga to\'g\'ridan-to\'g\'ri kirmaydi — bu xavfsizlik va tartib uchun: miya o\'rtada turadi.', 2: 'Baza o\'zi hech narsani boshlamaydi — u XOTIRA, so\'ralganda javob beradi.', 3: 'SMS boshqa kanal — bizning safar web ichida.', default: 'Safar: sahifa → server → baza → orqaga.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #7 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Zo\'r reja! Professional bo\'lish uchun professional asboblar kerak»' },
    { id: 1, t: '«Professional = JOBGA MOS asbob. 3 fichali MVPga tanish stek 2 hafta; Kubernetes o\'rganish — 2 oy KECHIKISH. Malika kutmaydi»' },
    { id: 2, t: '«Yarmini qil: Kubernetessiz, lekin GraphQL va mikroservislar qolsin»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«Kubernetes bilan quraman!»</span></h2></div>
        <Mentor>Aziz ham arxitektura bosqichiga yetdi. Rejasini eshiting…</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«YouTube'da ko'rdim: haqiqiy professionallar mikroservis + Kubernetes + GraphQL ishlatarkan. Men ham MVP'imni shunday quraman! To'g'ri, hali bilmayman — lekin 2 oyda o'rganib olsam, arxitekturam Netflix'nikidek bo'ladi!»</p>
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
            ? 'Netflix arxitekturasi Netflix MUAMMOSINI yechadi: 2 700 dasturchi, 260 mln foydalanuvchi. Azizning muammosi boshqa: 0 foydalanuvchini 10 taga yetkazish — TEZ. Nomad List Google Jadval bilan boshlagan edi, esladingizmi? Professional darajani asbob emas, YETKAZILGAN QIYMAT belgilaydi.'
            : (picked === 0 ? 'Bu «katta zavod» tuzog\'i: 2 oy sozlash, 0 foydalanuvchi. Professional asbob o\'z muammosiga mos kelganda professional.' : 'GraphQL va mikroservis ham xuddi shu savolga javob berishi kerak: JOBGA keraklimi? 1 endpoint uchun — yo\'q.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Chizma chizishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Arxitektura qoidasi: <span className="italic" style={{ color: T.accent }}>chizma jobga xizmat qiladi — aksincha emas</span></h2></div>
      <Mentor>Chizma oldidan kompas. 4 qoida — va qalam sizda.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>📐</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — arxitektor</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Bino devor bilan emas — chizma bilan boshlanadi. Kod ham shunday.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.layers(18), c: T.blue, t: '3 QAVAT — frontend (ko\'rinish) + backend (miya) + data (xotira)' }, { ic: Ico.target(18), c: T.accent, t: 'TANISH STEK — bilganing = tezliging; moda keyin' }, { ic: Ico.db(18), c: T.success, t: 'FUNDAMENT — baza + deploy + git; auth esa job so\'rasa' }, { ic: Ico.scissors(18), c: T.grape, t: 'SODDALIK — bitta uy (monolit); zavod katta jamoaga' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: ARXITEKTURA CHIZMASI =====
const emptyArch = () => Object.fromEntries(ARCH_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyArch());
  const [decision] = useState(() => readLesson98Decision());
  const isComplete = (k) => data[k].trim().length >= (k === 'name' ? 3 : 8);
  const completeCount = ARCH_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= ARCH_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson99_architecture', { title: 'Arxitektura chizmasi', fields: ARCH_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = ARCH_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' — ')[0].split(' (')[0], color: f.color === T.ink2 ? T.ink3 : f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · Arxitektura chizmasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${ARCH_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">ARXITEKTURA CHIZMASI: <span className="italic" style={{ color: T.accent }}>portfolio 7-sahifa</span></h2></div>
        <Mentor>O'Z mahsulotingiz uchun to'ldiring (misollar avtobus-loyihadan). 101-darsda AI'ga birinchi promptni AYNAN shu chizmadan yozasiz!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {decision && <div className="frame fade-up" style={{ padding: '11px 14px', borderLeft: `4px solid ${T.grape}` }}>
              <p className="flow-label" style={{ color: T.grape, marginBottom: 6 }}>📋 98-darsdagi qaroringiz (asos)</p>
              <p className="small" style={{ margin: 0, color: T.ink2, lineHeight: 1.55 }}>{decision.slice(0, 5).map((f, i) => (<span key={i}><b style={{ color: T.ink }}>{i > 0 ? ' · ' : ''}</b>{i > 0 ? '' : ''}{f.value}</span>))}</p>
            </div>}
            {ARCH_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Chizmangiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — chizma shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><ArchDoc rows={docRows} />{passed && <span className="seal">CHIZMA TAYYOR ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Chizma qo'lda! Endi sizda bor: muammo (95) → intervyular (97) → qaror (98) → <b>arxitektura (99)</b>. Keyingi qadam: analitika ulash (100) va AI bilan QURISH (101). G'ishtlar terila boshlaydi! 🧱</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const BADGES = [
  { t: 'Muammo Ovchisi', l: 'olingan' },
  { t: 'Tadqiqotchi', l: 'olingan' },
  { t: 'Quruvchi', l: 'KEYINGI BOSQICH' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['3 qavat: frontend (ko\'rinish) + backend (miya) + data (xotira)', 'Stek tanishlik bo\'yicha: bilganing = tezliging (PERN allaqachon sizniki)', 'Fundament: baza + deploy + git — birinchi kun; auth job so\'rasa', 'Soddalik: monolit uy; Kubernetes zavodi — katta jamoa hikoyasi'];
  const GLOSSARY = [{ b: 'Arxitektura', t: '— kod yozishdan oldingi qurilish chizmasi' }, { b: 'Frontend', t: '— foydalanuvchi ko\'radigan qavat' }, { b: 'Backend', t: '— ko\'rinmas hisob-kitob miyasi' }, { b: 'Data qavati', t: '— o\'chmas xotira (baza)' }, { b: 'Monolit', t: '— hammasi bitta ilovada; MVP do\'sti' }, { b: 'Wizard of Oz', t: '— parda ortida qo\'l mehnati bo\'lgan MVP' }, { b: 'Nomad List saboqi', t: '— arxitektura maqtanish uchun emas, JOB uchun' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Qur bosqichi · 1/6" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.rocket(12)}</span> 7-dars tamom · Qur bosqichi ochildi</span><h2 className="title h-title fade-up d1">Chizma qo'lda. <span className="italic" style={{ color: T.accent }}>Endi poydevor quyiladi.</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Arxitektura tayyor: 3 qavat, tanish stek, aniq fundament — va nimalar YO\'Qligi ham yozilgan. Keyingi darslar: analitika ulash, so\'ng AI bilan birinchi ekranni qurish.' : 'Yaxshi harakat! Qurishdan oldin qavatlar va fundament qoidalarini mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 1 ? 'badge-done' : ''} ${i === 2 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔜' : '🔒'))} {b.t}<span className="badge-when" style={i <= 1 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi nishon — <b style={{ color: T.honey }}>🔨 Quruvchi</b>: chizmangiz bo'yicha MVP birinchi marta ISHLAGANDA (103-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🧱</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — birinchi g'isht</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>GitHub'da mahsulotingiz nomi bilan BO'SH repozitoriy yarating va 3 papkani (client / server / db) qo'lda oching. Ha, hozircha bo'sh — lekin bu birinchi g'isht! Keyingi dars: analitika birinchi kundan (100).</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function MvpArchLesson({ lang: langProp, onFinished }) {
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

        /* === QAVATLAR / TIMELINE === */
        .tl { display: flex; flex-direction: column; gap: 8px; position: relative; }
        .tl::before { content: ''; position: absolute; left: 19px; top: 16px; bottom: 16px; width: 2px; background: ${T.ink3}44; border-radius: 2px; }
        .tl-item { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 12px; padding: 9px 12px 9px 3px; background: transparent; cursor: pointer; transition: all 0.18s; position: relative; }
        .tl-item:hover { background: ${T.paper}; }
        .tl-act { background: ${T.paper}; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.2); }
        .tl-dot { width: 34px; height: 34px; min-width: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 4px 10px -4px rgba(${T.shadowBase},0.3); z-index: 1; transition: background 0.25s; }
        .tl-body { display: flex; flex-direction: column; gap: 1px; flex: 1; text-align: left; }
        .tl-year { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.08em; }
        .tl-title { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .tl-next .tl-dot { box-shadow: 0 0 0 2px ${T.accent}, 0 4px 10px -4px rgba(${T.shadowBase},0.3); animation: you-pulse 1.8s ease-in-out infinite; }
        .tl-cue { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; animation: fade-step 0.4s; }
        .tl-lock { opacity: 0.42; cursor: default; }
        .tl-lock:hover { background: transparent; }

        /* === ARCH BOX (sxema yig'ilishi) === */
        .arch-box { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 11px; padding: 10px 13px; border-left: 4px solid ${T.ink3}44; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); opacity: 0.45; transition: all 0.3s; }
        .arch-box.arch-on { opacity: 1; animation: feat-pop .34s cubic-bezier(.2,.7,.2,1); }
        .arch-lbl { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11.5px; letter-spacing: 0.04em; }
        .arch-tech { font-family: 'Manrope'; font-weight: 600; font-size: 11.5px; color: ${T.ink2}; }

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

        /* === PLINK === */
        .plink { display: flex; align-items: center; gap: 9px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .plink:hover { transform: translateY(-1px); }
        .plink-on { background: ${T.grapeSoft}; box-shadow: inset 0 0 0 1.5px ${T.grape}; }
        .plink-label { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .plink-act { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.grape}; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }

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
