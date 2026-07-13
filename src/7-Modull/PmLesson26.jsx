import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM1 — MAHSULOT VS LOYIHA — AKSELERATOR BOSHLANISHI — v16 (AUDIOSIZ)
// G'oya: loyiha = qurilgan narsa; mahsulot = real odam muammosini hal qiladigan va ISHLATILADIGAN narsa.
// Ramka: o'quvchi "CoddyCamp Akseleratori"ga qabul qilinadi — 16 dars oxirida real foydalanuvchi bilan Demo Day.
// Signature 1: Mahsulot/Loyiha sorter o'yini. Signature 2: Mikaila Ulmer timeline ($11M count-up).
// Yakuniy ish: Founder Portfolio 1-sahifa — 3 ishlatadigan mahsulot + nega ishlaydi (localStorage'ga yoziladi).
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
  arrow: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M4 12h14" /><path d="M13 6l6 6-6 6" /></svg>),
  rocket: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 15c-2 0-4-1-5-2 0-5 2-9 5-11 3 2 5 6 5 11-1 1-3 2-5 2z" /><path d="M7 13l-3 2 2 2" /><path d="M17 13l3 2-2 2" /><path d="M12 15v5" /></svg>),
  users: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.2 14.6c2 .3 3.6 1.6 4.3 3.9" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>),
  heart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 20s-7-4.5-9-9c-1.2-2.8.5-6 3.6-6 1.9 0 3.4 1 4.4 2.6C12 6 13.5 5 15.4 5c3.1 0 4.8 3.2 3.6 6-2 4.5-7 9-7 9z" /></svg>),
  repeat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></svg>),
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-product-26-v16', lessonTitle: { uz: 'Mahsulot vs loyiha — Akselerator boshlanishi', ru: 'Продукт vs проект — старт акселератора' } };
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

// ===== FOUNDER PORTFOLIO (modul bo'ylab yig'iladigan hujjat) =====
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
// Mikaila Ulmer timeline (s3)
const MILESTONES = [
  { id: 'stand', y: '4 yosh', t: 'Limonad stendi', ic: '🍋', d: 'Katta buvisining asal qo\'shilgan limonad retsepti. Uy oldida kichkina stend — birinchi mijozlar: qo\'shnilar. Hali biznes emas, lekin REAL odamlar pul to\'lab ichishyapti.' },
  { id: 'bees', y: '5 yosh', t: 'Missiya topildi', ic: '🐝', d: 'Uni ari chaqib oldi. Qo\'rqish o\'rniga — qiziqish: arilar yo\'qolib borayotganini bildi. Qaror: har sotuvdan bir qism arilarni asrashga. Mahsulotga MAQSAD qo\'shildi — endi bu shunchaki ichimlik emas.' },
  { id: 'shark', y: '9 yosh', t: 'Shark Tank sahnasi', ic: '🎤', d: 'Millionlab tomoshabin oldida investorlarga pitch qildi — $60 000 investitsiya oldi. Bola sifatida emas — founder sifatida gapirdi: muammo, mijoz, raqamlar.' },
  { id: 'whole', y: '11 yosh', t: 'Whole Foods shartnomasi', ic: '🏪', d: '"Me & the Bees Lemonade" butun Amerika bo\'ylab do\'konlarga kirdi — $11 000 000 lik distributsiya shartnomasi. Limonaddan boshlangan yo\'l.' }
];

// O'lik loyihalar qabristoni (s5)
const GRAVES = [
  { id: 'g1', name: 'TeleJadval 2.0', years: '3 oy yashadi', ic: '📅', reason: 'Muammo yo\'q edi. Hamma allaqachon o\'z jadvalini bilardi — hech kimning og\'rig\'ini hal qilmadi.', lesson: 'Mahsulot g\'oyadan emas — OG\'RIQdan boshlanadi.' },
  { id: 'g2', name: 'CoolChat', years: '6 oy yashadi', ic: '💬', reason: 'Muallif faqat o\'zi uchun qurdi — birorta bo\'lajak foydalanuvchidan so\'ramadi. Launch kuni: 0 ro\'yxatdan o\'tish.', lesson: 'O\'zingiz = 1 kishilik bozor. Boshqalardan SO\'RANG.' },
  { id: 'g3', name: 'SuperApp', years: '1 yil yashadi', ic: '🦸', reason: '47 ta ficha, mukammal kod, 12 ekran. Lekin 1 yil yashirincha qurildi — hech kim bilmadi, hech kim kutmadi.', lesson: 'Ko\'p ficha ≠ mahsulot. Bitta hal qilingan muammo > 47 ficha.' }
];

// Sorter o'yini (s6) — SIGNATURE 1
const SORT_ITEMS = [
  { id: 'i1', t: 'Sinf jadvali boti — 30 sinfdosh har kuni tekshiradi', isProduct: true, why: 'Real foydalanuvchilar bor va ular QAYTIB kelishadi — bu mahsulot.' },
  { id: 'i2', t: 'Todo-ilova — GitHub\'da turibdi, foydalanuvchi: 0', isProduct: false, why: 'Qurilgan, lekin hech kim ishlatmaydi — bu (hozircha) loyiha.' },
  { id: 'i3', t: 'Buvi uchun dori eslatgich — buvi har kuni bosadi', isProduct: true, why: 'Bitta foydalanuvchi bo\'lsa ham — real odam, real muammo, har kuni. Mahsulot!' },
  { id: 'i4', t: 'Mukammal kodli kalkulyator — hech kim bilmaydi', isProduct: false, why: 'Kod sifati mahsulot qilmaydi. Foydalanuvchisiz — loyiha.' },
  { id: 'i5', t: 'Nonvoyxona buyurtma sahifasi — kuniga 12 buyurtma', isProduct: true, why: 'Real biznes real ishlatyapti, pul aylanyapti — to\'la mahsulot.' },
  { id: 'i6', t: '3D aylanadigan logo — o\'zim uchun eksperiment', isProduct: false, why: 'O\'rganish uchun zo\'r mashq — lekin foydalanuvchi muammosini hal qilmaydi.' }
];

// Teen-founder galereyasi (s7)
const FOUNDERS = [
  { id: 'mo', name: 'Moziah Bridges', age: '9 yoshda boshlagan', biz: 'Mo\'s Bows — qo\'lda tikilgan kapalak-galstuklar', ic: '🎀', who: 'Chiroyli kiyinishni istagan bolalar va ularning otalari', pain: 'Bolalar uchun zamonaviy, sifatli aksessuar deyarli yo\'q edi', res: 'NBA bilan hamkorlik, $700 000+ savdo' },
  { id: 'al', name: 'Alina Morse', age: '7 yoshda boshlagan', biz: 'Zolli Candy — tishga zarar yetkazmaydigan konfet', ic: '🍭', who: 'Konfetni yaxshi ko\'radigan bolalar — va tishini o\'ylagan onalar', pain: '«Konfet yesang — tishing buziladi» dilemmasi', res: 'Amerikaning yirik do\'kon tarmoqlarida sotiladi' },
  { id: 'ri', name: 'Riya Karumanchi', age: '14 yoshda boshlagan', biz: 'SmartCane — sensorli aqlli hassa', ic: '🦯', who: 'Ko\'zi ojiz insonlar', pain: 'Oddiy oq hassa balandlikdagi to\'siqlarni oldindan sezmaydi', res: '$55 000+ investitsiya, texnologiya rivojlanmoqda' }
];

// Mahsulot anatomiyasi — 3 linza (s8, s11, s15)
const LENSES = [
  { id: 'who', label: 'Kim ishlatadi?', emoji: '👤', color: T.blue, soft: T.blueSoft, tg: 'Siz, sinfdoshlar, oila — xabar yozadigan har kim. Aniq, ko\'rinadigan odamlar.' },
  { id: 'pain', label: 'Qaysi og\'riqni hal qiladi?', emoji: '🎯', color: T.accent, soft: T.accentSoft, tg: 'Tez va bepul aloqa. SMS pullik va sekin edi, qo\'ng\'iroq har doim qulay emas.' },
  { id: 'back', label: 'Nega qaytib kelishadi?', emoji: '🔁', color: T.success, soft: T.successSoft, tg: 'Suhbatlar, guruhlar, fayllar — hammasi shu yerda. Har kuni yangi xabar — qaytmaslikning iloji yo\'q.' }
];

// Yo'naltirilgan mashq — Payme misoli (s11)
const DRILL = [
  { id: 'who', label: 'Kim ishlatadi?', emoji: '👤', color: T.blue, opts: ['Telefonida pul o\'tkazadigan oddiy odamlar', 'Faqat bank xodimlari', 'Faqat dasturchilar'], correct: 0, why: 'Payme foydalanuvchisi — kommunalka, telefon, o\'tkazma to\'laydigan ODDIY odam. Million-million kishi.' },
  { id: 'pain', label: 'Qaysi og\'riqni hal qiladi?', emoji: '🎯', color: T.accent, opts: ['Telefon xotirasi kamligini', 'Bankka borib navbat kutish, naqd olib yurishni', 'Internet sekinligini'], correct: 1, why: 'Asosiy og\'riq — vaqt va noqulaylik: navbat, qog\'oz, naqd pul. Ilova buni 10 soniyaga tushirdi.' },
  { id: 'back', label: 'Nega qaytib kelishadi?', emoji: '🔁', color: T.success, opts: ['Logotipi chiroyli bo\'lgani uchun', 'Reklamasi ko\'p bo\'lgani uchun', 'Har to\'lov 10 soniya — odatga aylanadi'], correct: 2, why: 'To\'lovlar har oy takrorlanadi, ilova esa eng tez yo\'l — shuning uchun odam qayta-qayta qaytadi.' }
];

// Akselerator yo'l xaritasi (s1 mini + s10 to'liq)
const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭', lessons: '93–95', d: 'Mahsulot tafakkuri → Jobs-to-be-Done → atrofingizdan 10 muammo topasiz.', badge: 'Muammo Ovchisi' },
  { n: '02', t: 'Tekshir', ic: '🎙️', lessons: '96–98', d: 'Custdev savollar → 5 REAL intervyu → bitta aniq muammo + MVP chegarasi.', badge: 'Tadqiqotchi' },
  { n: '03', t: 'Qur', ic: '🔧', lessons: '99–104', d: 'Arxitektura → analitika → AI bilan MVP qurish → dizayn → real odam bilan test.', badge: 'Quruvchi · Sinovchi' },
  { n: '04', t: 'Isbot qil', ic: '🏆', lessons: '105–108', d: 'Fidbek iteratsiyasi → pitch → DEMO DAY: real foydalanuvchingiz sahnada siz bilan!', badge: 'Founder' }
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

// Founder Portfolio hujjati (s15, s16)
const PortfolioDoc = ({ rows, title = 'Founder Portfolio · 1-sahifa' }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.rocket(16)}</span><span>{title}</span></div>
    {rows.map((r, i) => (
      <div key={i} className="deck-row">
        <span className="deck-num" style={{ background: r.color }}>{i + 1}</span>
        <div style={{ minWidth: 0 }}><span className="deck-tag" style={{ color: r.color }}>{r.emoji} {r.label}</span><p className="deck-val">{r.text}</p></div>
      </div>
    ))}
  </div>
);

// Akselerator bosqich chiziqchasi (s1)
const ArcStrip = () => (
  <div className="arc-strip fade-up delay-2">
    {STAGES.map((s, i) => (
      <React.Fragment key={s.n}>
        <div className={`arc-chip ${i === 0 ? 'arc-here' : ''}`}>
          <span style={{ fontSize: 14 }}>{s.ic}</span>
          <span className="arc-t">{s.t}</span>
          {i === 0 && <span className="arc-you">siz</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: QABUL XATI =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [opened, setOpened] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Mukammal, xatosiz yozilgan kod' },
    { id: 'b', label: 'Real odam har kuni ishlatayotgan mahsulot' },
    { id: 'c', label: 'Eng chiroyli dizayn va animatsiyalar' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Akselerator" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Sizga <span className="italic" style={{ color: T.accent }}>xat</span> keldi.</h1>
        <Mentor>{opened ? <>O'qib chiqing. Bu modul avvalgilardan boshqacha bo'ladi — endi siz shunchaki o'quvchi emassiz.</> : <>Konvertni bosing. Ichida sizni nimadir kutyapti…</>}</Mentor>
        <Zoomable><Split>
          <Col>
            {!opened ? (
              <button className="envelope" onClick={() => setOpened(true)} aria-label="Xatni ochish">
                <span className="env-flap" />
                <span className="env-seal">◆</span>
                <span className="env-to">KIMGA: SIZGA</span>
                <span className="env-hint">📬 Ochish uchun bosing</span>
              </button>
            ) : (
              <div className="accept-card fade-step">
                <div className="accept-head"><span className="accept-logo">◆ CODDYCAMP</span><span className="accept-sub">AKSELERATOR DASTURI</span></div>
                <p className="accept-body">Hurmatli founder,</p>
                <p className="accept-body">Siz 9 ta modulni tamomladingiz: web, JavaScript, React, backend, baza, testlar, CI/CD, botlar va to'liq tizim. Texnologiyani bilasiz.</p>
                <p className="accept-body">Endi eng qiyin va eng qiziq bosqich: <b>16 dars ichida siz REAL ODAMning real muammosiga mahsulot qurasiz</b>. Yakunda — Demo Day: foydalanuvchingiz sahnada siz bilan turadi.</p>
                <div className="stamp">QABUL QILINDINGIZ</div>
              </div>
            )}
          </Col>
          <Col>
            {!opened ? (
              <div className="frame-dash fade-up delay-2"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Savol xat ochilgach chiqadi…</p></div>
            ) : (<>
              <p className="eyebrow fade-step" style={{ color: T.ink2, margin: 0 }}>Demo Day'da nima ko'rsatishingiz eng muhim?</p>
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
              </div>
              {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'To\'g\'ri sezdingiz — ' : 'Aslida eng muhimi — '}<b>real odam ishlatayotgan mahsulot</b>. Kod ham, dizayn ham unga xizmat qiladi. Lekin «mahsulot» nima o'zi va u oddiy «loyiha»dan nimasi bilan farq qiladi? Bugungi dars — shu haqda.</p>}
            </>)}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Loyiha va mahsulot — farqi nimada', tag: '' },
    { text: '$11 000 000 lik limonad hikoyasi', tag: 'timeline' },
    { text: 'Mahsulotmi yoki loyihami? — sorter', tag: 'o\'yin' },
    { text: 'Mahsulot anatomiyasi: 3 linza', tag: '' },
    { text: 'Founder Portfolio — 1-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Akselerator maqsadi</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.accent} soft={T.accentSoft}>{Ico.rocket(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Real odam uchun mini-MVP</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>16 dars · 4 bosqich · yakunda real foydalanuvchi bilan Demo Day.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Birinchi qadam: mahsulot nima ekanini his qilish</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Mahsulot vs loyiha</span> — akselerator birinchi darsi</h2></div>
        <Mentor>Butun modul — bitta safar: muammo topasiz, odamlar bilan gaplashasiz, MVP qurasiz va Demo Day'da isbotlaysiz. Bugun — poydevor: <b style={{ color: T.ink }}>mahsulot tafakkuri</b>.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — LOYIHA VS MAHSULOT =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('proj');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['proj', 'prod']) : new Set(['proj']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isProj = v === 'proj';
  return (
    <Stage eyebrow="Asosiy farq" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyiha <span className="italic" style={{ color: T.ink3 }}>quriladi</span>. Mahsulot <span className="italic" style={{ color: T.accent }}>ishlatiladi</span>.</h2></div>
        <Mentor>Bitta so'z hammasini o'zgartiradi. Ikkala kartani bosib, farqni his qiling.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isProj ? 'chip-on' : ''}`} onClick={() => set('proj')}>🧱 Loyiha</button>
              <button className={`chip ${!isProj ? 'chip-on' : ''}`} onClick={() => set('prod')}>🚀 Mahsulot</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isProj ? T.ink3 : T.accent}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: isProj ? T.ink2 : T.accent, fontWeight: 700 }}>{isProj ? '🧱 LOYIHA' : '🚀 MAHSULOT'}</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isProj
                ? 'Qurilgan narsa. «Kod yozdim, ishladi — bo\'ldi». Muallifi bor, maqsadi — o\'rganish yoki ko\'rsatish. Foydalanuvchi bo\'lishi shart emas.'
                : 'Real odamning real muammosini hal qiladigan va u QAYTA-QAYTA ishlatadigan narsa. Muallifi emas — FOYDALANUVCHISI asosiy qahramon.'}</p>
            </div>
          </Col>
          <Col>
            {isProj
              ? <div className="frame fade-step" key="pj" style={{ padding: '15px 17px' }}><p className="note-h" style={{ color: T.ink2 }}>Savol: «Nima qurding?»</p><p className="body" style={{ margin: 0, color: T.ink }}>Loyihada gap KOD haqida: qaysi texnologiya, nechta ekran, qanday ficha. Siz 9 modul davomida ko'p loyiha qurdingiz — va bu juda muhim edi: qo'l shu yerda pishadi.</p></div>
              : <div className="frame-success fade-step" key="pd"><p className="note-h" style={{ color: T.success }}>Savol: «KIM ishlatyapti?»</p><p className="body" style={{ margin: 0, color: T.ink }}>Mahsulotda gap ODAM haqida: kim, qaysi muammosi uchun, nega qaytib keladi. Kod bir xil bo'lishi mumkin — savol boshqa.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula: <b>Mahsulot = Loyiha + Real foydalanuvchi + Hal qilingan muammo.</b> Shu modulda loyihalaringiz birinchi marta mahsulotga aylanadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — MIKAILA TIMELINE (SIGNATURE 2) =====
const fmtMoney = (n) => '$' + n.toLocaleString('en-US');
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(MILESTONES.map(m => m.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'whole' : null);
  const [money, setMoney] = useState(storedAnswer ? 11000000 : 0);
  const done = seen.size >= MILESTONES.length;
  const tap = (id) => {
    const idx = MILESTONES.findIndex(m => m.id === id);
    if (idx > seen.size) return; // hikoya tartib bilan ochiladi
    setActive(id);
    setSeen(prev => { const n = new Set(prev); n.add(id); return n; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => {
    if (!done || money > 0) return;
    const target = 11000000, dur = 1500;
    let raf, t0 = null;
    const tick = (now) => {
      if (t0 === null) t0 = now;
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setMoney(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const guard = setTimeout(() => { cancelAnimationFrame(raf); setMoney(target); }, 2000); // rAF to'xtab qolsa ham yakuniy raqam chiqadi
    return () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [done]);
  const cur = active ? MILESTONES.find(m => m.id === active) : null;
  return (
    <Stage eyebrow="Real hikoya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${MILESTONES.length} bosqichni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mikaila Ulmer: <span className="italic" style={{ color: T.accent }}>limonaddan $11 000 000 gacha</span></h2></div>
        <Mentor>AQShda bolalar biznesni limonad sotishdan o'rganadi. Mikaila ham shunday boshlagan — 4 yoshida. Hikoyani <b style={{ color: T.ink }}>tartib bilan</b> oching — oxirida sizni raqam kutyapti.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="tl fade-up delay-1">
              {MILESTONES.map((m, mi) => { const on = seen.has(m.id); const act = active === m.id; const isNext = !on && mi === seen.size; const locked = !on && mi > seen.size; return (
                <button key={m.id} className={`tl-item ${on ? 'tl-seen' : ''} ${act ? 'tl-act' : ''} ${isNext ? 'tl-next' : ''} ${locked ? 'tl-lock' : ''}`} onClick={() => tap(m.id)}>
                  <span className="tl-dot" style={{ background: on ? T.accent : T.paper, color: on ? '#fff' : T.ink3 }}>{locked ? '🔒' : m.ic}</span>
                  <span className="tl-body"><span className="tl-year">{locked ? '· · ·' : m.y}</span><span className="tl-title">{locked ? '?????' : m.t}</span></span>
                  {on && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                  {isNext && <span className="tl-cue">keyingi →</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.y} · {cur.t}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Timeline'dan bosqichni bosing</p></div>)}
            {done && (
              <div className="frame-success fade-step" style={{ textAlign: 'center' }}>
                <p className="flow-label" style={{ color: T.success, marginBottom: 4 }}>Whole Foods shartnomasi</p>
                <p className="money">{fmtMoney(money)}</p>
                <p className="body" style={{ margin: '6px 0 0', color: T.ink }}>E'tibor bering: Mikaila KODdan ham, retseptdan ham boshlamagan. U <b>istak</b>dan boshlagan: issiq kunda mazali ichimlik + arilarni qutqarish hikoyasi. Mahsulot — har doim odamdan boshlanadi.</p>
              </div>
            )}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Loyiha qachon mahsulotga aylanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Loyiha qachon <span className="italic" style={{ color: T.accent }}>mahsulotga</span> aylanadi?</h2></>}
    options={['Kod GitHub\'ga yuklanganda', 'Real odam o\'z muammosi uchun ishlata boshlaganda', 'Dizayn juda chiroyli bo\'lganda', 'Ficha soni 20 dan oshganda']} correctIdx={1}
    explainCorrect="To'g'ri! Mahsulotning yagona mezoni — real foydalanuvchi: kimdir o'z muammosini hal qilish uchun uni ishlatyapti va qaytib kelyapti. Qolgani — vosita."
    explainWrong={{ 0: 'GitHub — saqlash joyi. U yerda millionlab hech kim ishlatmaydigan loyiha yotibdi.', 2: 'Chiroyli dizayn foydali, lekin foydalanuvchisiz u ham loyiha.', 3: 'Ficha soni emas — hal qilingan muammo muhim.', default: 'Mezon — real foydalanuvchi.' }} />
);

// ===== SCREEN 5 — O'LIK LOYIHALAR QABRISTONI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(GRAVES.map(g => g.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= GRAVES.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? GRAVES.find(g => g.id === active) : null;
  return (
    <Stage eyebrow="Nega o'lishadi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${GRAVES.length} tarixni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'lik loyihalar <span className="italic" style={{ color: T.accent }}>qabristoni</span></h2></div>
        <Mentor>Bular real turdagi hikoyalar — har yili minglab shunday loyiha jimgina o'ladi. Har birini bosing: nima uchun?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GRAVES.map((g, gi) => { const on = seen.has(g.id); return (
                <button key={g.id} className={`grave grave-rise ${on ? 'grave-open' : ''} ${active === g.id ? 'grave-act' : ''}`} style={{ animationDelay: `${0.15 + gi * 0.18}s` }} onClick={() => tap(g.id)}>
                  <span style={{ fontSize: 20 }}>{on ? '🪦' : g.ic}</span>
                  <span className="grave-body"><span className="grave-name">{g.name}</span><span className="grave-years">{g.years} · foydalanuvchi: 0</span></span>
                  <span className="grave-act-lbl">{on ? 'ochildi' : 'nima bo\'ldi?'}</span>
                </button>
              ); })}
            </div>
            <div className="frame fade-up delay-2" style={{ padding: '13px 16px', borderLeft: `4px solid ${T.honey}` }}>
              <p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.honey }}>📊 Fakt:</b> startaplar o'limining eng katta sababi (~42%) — «bozorga kerak emas»: hech kimning muammosini hal qilmagan mahsulot.</p>
            </div>
          </Col>
          <Col>
            {cur ? (<div className="frame-warn fade-step" key={active}><p className="note-h" style={{ color: T.accent }}>💀 O'lim sababi</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.reason}</p><p className="body" style={{ margin: '10px 0 0', color: T.ink, fontWeight: 600 }}>Saboq: {cur.lesson}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Loyihani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uchchalasida ham kod aybdor emas. Aybdor — <b>tartib</b>: avval qurishdi, keyin «kimga kerak?» deb o'ylashdi. Akseleratorda biz teskarisidan boramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Ko'p loyihalar nega hech kimga kerak bo'lmay qoladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ko'p loyihalar nega <span className="italic" style={{ color: T.accent }}>hech kimga kerak emas</span>?</h2></>}
    options={['Kodi sifatsiz yozilgani uchun', 'Avval qurilgan, foydalanuvchi va muammo keyin qidirilgani uchun', 'Reklamaga pul yetmagani uchun', 'Texnologiyasi eskirgani uchun']} correctIdx={1}
    explainCorrect="To'g'ri! Asosiy xato — tartib: avval «zo'r g'oya»ni qurish, keyin unga foydalanuvchi qidirish. To'g'ri tartib teskari: avval odam va og'riq, keyin yechim."
    explainWrong={{ 0: 'Yomon kodli, lekin kerakli mahsulotlar ko\'p — kod sabab emas.', 2: 'Keraksiz narsani reklama ham qutqarmaydi.', 3: 'Eski texnologiyada ishlayotgan foydali mahsulotlar to\'lib yotibdi.', default: 'Gap tartibda: avval odam, keyin qurish.' }} />
);

// ===== SCREEN 6 — SORTER O'YINI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(SORT_ITEMS.map(it => [it.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = SORT_ITEMS.filter(it => state[it.id]?.ok).length;
  const done = okCount >= SORT_ITEMS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (it, asProduct) => {
    if (state[it.id]?.ok) return;
    const ok = asProduct === it.isProduct;
    setState(prev => ({ ...prev, [it.id]: { ok, wrong: !ok } }));
    setLast({ id: it.id, ok, why: it.why, isProduct: it.isProduct });
  };
  return (
    <Stage eyebrow="Sorter · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Saralang (${okCount}/${SORT_ITEMS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulotmi yoki <span className="italic" style={{ color: T.accent }}>loyihami?</span></h2></div>
        <Mentor>Har biriga qaror bering: 🚀 mahsulot yoki 🧱 loyiha? Sirli mezon esingizdami — real foydalanuvchi va qaytish.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SORT_ITEMS.map(it => {
                const st = state[it.id] || {};
                return (
                  <div key={it.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{it.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: it.isProduct ? T.success : T.ink2 }}>{it.isProduct ? '🚀 mahsulot' : '🧱 loyiha'}</span>
                      : <span className="sort-btns"><button className="sort-btn sb-p" onClick={() => pick(it, true)}>🚀</button><button className="sort-btn sb-l" onClick={() => pick(it, false)}>🧱</button></span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🧠 Founder instinkti</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{SORT_ITEMS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / SORT_ITEMS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ To\'g\'ri!' : '✗ Yana o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Savol bering: real odam o\'z muammosi uchun ishlatyaptimi? Qaytib kelyaptimi?'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Kartadagi 🚀 yoki 🧱 ni bosing — izoh shu yerda chiqadi va instinkt shkalangiz to'ladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sezdingizmi? <b>Hajm ham, texnologiya ham ahamiyatsiz</b>: bitta buvi har kuni ishlatgan eslatgich — mahsulot; mukammal, lekin egasiz ilova — loyiha.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEEN-FOUNDER GALEREYASI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(FOUNDERS.map(f => f.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= FOUNDERS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? FOUNDERS.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="Siz yoshdagilar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${FOUNDERS.length} founderni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ular ham <span className="italic" style={{ color: T.accent }}>odamdan boshlagan</span></h2></div>
        <Mentor>Uch real founder — uchchalasi maktab yoshida boshlagan. Har birini bosing va bitta narsaga e'tibor bering: nimadan boshlashgan?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FOUNDERS.map(f => { const on = seen.has(f.id); return (
                <button key={f.id} className={`plink ${active === f.id ? 'plink-on' : ''}`} onClick={() => tap(f.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{f.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{f.name}</span><br /><span className="small" style={{ color: T.ink2 }}>{f.age}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ochish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.biz}</span></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  <p className="body" style={{ margin: 0 }}><b style={{ color: T.blue }}>👤 Kim:</b> {cur.who}</p>
                  <p className="body" style={{ margin: 0 }}><b style={{ color: T.accent }}>🎯 Og'riq:</b> {cur.pain}</p>
                  <p className="body" style={{ margin: 0 }}><b style={{ color: T.success }}>🏆 Natija:</b> {cur.res}</p>
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Founderni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Payqadingizmi? Uchchalasi ham <b>texnologiyadan emas — aniq odam va aniq og'riqdan</b> boshlagan. Galstuk, konfet, hassa — texnologiya oddiy, mahsulot kuchli.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MAHSULOT ANATOMIYASI: 3 LINZA =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(LENSES.map(l => l.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= LENSES.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? LENSES.find(l => l.id === active) : null;
  return (
    <Stage eyebrow="3 linza" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${LENSES.length} linzani qo'llang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulot anatomiyasi: <span className="italic" style={{ color: T.accent }}>3 linza</span></h2></div>
        <Mentor>Istalgan narsani shu 3 savoldan o'tkazsangiz — mahsulotmi-yo'qmi darrov bilinadi. Misol: Telegram. Har linzani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>✈️</span>
              <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Telegram</p><p className="small" style={{ margin: 0, color: T.ink2 }}>tanish mahsulotni linzadan o'tkazamiz</p></div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LENSES.map(l => { const on = seen.has(l.id); return (
                <button key={l.id} className="lens-btn" style={active === l.id ? { boxShadow: `inset 0 0 0 2px ${l.color}`, background: l.soft } : undefined} onClick={() => tap(l.id)}>
                  <span style={{ fontSize: 17 }}>{l.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? l.color : T.ink }}>{l.label}</span>
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.tg}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Linzani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 savolga ham aniq javob bor → <b>mahsulot</b>. Birortasiga javob yo'q → hali loyiha. Bu linzalar butun modul davomida siz bilan yuradi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Mahsulotning 3 linzasi qaysi qatorda to'g'ri?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mahsulotning <span className="italic" style={{ color: T.accent }}>3 linzasi</span> qaysi?</h2></>}
    options={['Qancha kod · qaysi til · nechta ficha', 'Kim ishlatadi · qaysi og\'riqni hal qiladi · nega qaytib keladi', 'Logo · nom · reklama byudjeti', 'Server · baza · deploy']} correctIdx={1}
    explainCorrect="To'g'ri! Kim? Qaysi og'riq? Nega qaytadi? — shu 3 savolga aniq javob bo'lsa, qo'lingizda mahsulot bor. Qolgan hammasi — vositalar."
    explainWrong={{ 0: 'Bu loyihaning o\'lchovlari — mahsulotniki emas.', 2: 'Marketing muhim, lekin mahsulot mohiyatini aniqlamaydi.', 3: 'Bu texnik fundament — 3 linzaga javob bermaydi.', default: 'Kim · og\'riq · qaytish.' }} />
);

// ===== SCREEN 10 — AKSELERATOR YO'L XARITASI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(STAGES.map(s => s.n)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= STAGES.length;
  const tap = (n) => { setActive(n); setSeen(prev => { const x = new Set(prev); x.add(n); return x; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? STAGES.find(s => s.n === active) : null;
  return (
    <Stage eyebrow="Yo'l xaritasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${STAGES.length} bosqichni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Akselerator: <span className="italic" style={{ color: T.accent }}>4 bosqich, 16 dars</span></h2></div>
        <Mentor>Mana sizning to'liq yo'lingiz — xuddi haqiqiy startap akseleratoridagidek. Har bosqichni bosing. Nishonlarga e'tibor bering!</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="stmap fade-up delay-1">
              <div className="st-fill" style={{ height: `calc((100% - 36px) * ${seen.size / STAGES.length})` }} />
              {STAGES.map((s, i) => { const on = seen.has(s.n); return (
                <button key={s.n} className={`st-row ${on ? 'st-seen' : ''} ${active === s.n ? 'st-act' : ''}`} onClick={() => tap(s.n)}>
                  <span className="st-num" style={{ background: on ? T.accent : T.paper, color: on ? '#fff' : T.ink3 }}>{s.ic}</span>
                  <span className="st-body">
                    <span className="st-t">{s.t} {i === 0 && <span className="arc-you" style={{ marginLeft: 6 }}>siz shu yerdasiz</span>}</span>
                    <span className="st-l">darslar {s.lessons}</span>
                  </span>
                  {on && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.n} · {cur.t}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p><p className="small" style={{ margin: '10px 0 0', color: T.honey, fontWeight: 700 }}>🏅 Nishon: {cur.badge}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bosqichni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har dars natijasi <b>Founder Portfolio</b>ga yoziladi — Demo Day'da butun yo'lingizni bitta hujjatda ko'rasiz. Birinchi sahifani bugun ochamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — YO'NALTIRILGAN MASHQ: PAYME =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Mashq · linzalar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Linzalarni qo'llang (${okCount}/${DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi o'zingiz: <span className="italic" style={{ color: T.accent }}>Payme'ni linzadan o'tkazing</span></h2></div>
        <Mentor>Har linza uchun to'g'ri javobni tanlang. Bu — 3 linzani birinchi mustaqil qo'llashingiz.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Yana o'ylang: linza savoliga eng to'g'ridan-to'g'ri javob qaysi?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Linzalar qo'lingizda. Yakuniy ishda ularni <b>o'zingiz ishlatadigan mahsulotlarga</b> qo'llaysiz.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Akseleratorda birinchi qadam nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mahsulot qurish qayerdan <span className="italic" style={{ color: T.accent }}>boshlanadi</span>?</h2></>}
    options={['Kod yozishdan — texnologiya hal qiladi', 'Odamni va uning og\'rig\'ini topishdan', 'Domen va logo tanlashdan', 'Investor qidirishdan']} correctIdx={1}
    explainCorrect="To'g'ri! Avval odam va og'riq — keyin yechim, undan keyingina kod. Keyingi darslarda aynan shu izlanishni qilamiz: JTBD, muammo ovlash, custdev."
    explainWrong={{ 0: 'Kod — kuchli vosita, lekin u 4-bosqichda. Avval kim uchunligini bilish kerak.', 2: 'Logo — bezak. O\'lik loyihalarning ham chiroyli logolari bor edi.', 3: 'Investor foydalanuvchisi bor mahsulotga keladi.', default: 'Avval odam, keyin kod.' }} />
);

// ===== SCREEN 13 — CASE: DO'STGA MASLAHAT =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Reklamaga pul sarfla — odamlar bilib qolsa, kelishadi»' },
    { id: 1, t: '«Avval 5 ta odamga ko\'rsat: muammolarini so\'ra, ishlatishlarini KUZAT — kimga keragini top»' },
    { id: 2, t: '«Yana 10 ta ficha qo\'sh — imkoniyat ko\'p bo\'lsa, kerak bo\'ladi»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Do'stingizga qanday <span className="italic" style={{ color: T.accent }}>maslahat berasiz?</span></h2></div>
        <Mentor>Bugungi bilim bilan real vaziyatni yeching.</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«3 oy fitnes-ilova qurdim. Kod toza, dizayn zo'r, 15 ta ekran. Play Market'ga chiqardim — 2 hafta bo'ldi, 4 kishi o'rnatdi, hech kim qaytib kirmayapti. Endi nima qilay?»</p>
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
            ? 'Azizning ilovasi hozircha loyiha — chunki foydalanuvchi muammosi noma\'lum. Reklama ham, yangi ficha ham buni tuzatmaydi. Yagona yo\'l — odamlarga qaytish: kim, qaysi og\'riq, nega qaytmayapti. Aynan shu ishni siz keyingi darslarda o\'z mahsulotingiz uchun qilasiz.'
            : (picked === 0 ? 'Keraksiz narsani reklama qutqarmaydi — 4 kishi o\'rnatib tashlab ketganini eslang. Avval muammoni aniqlash kerak.' : 'Ficha qo\'shish — «SuperApp» yo\'li (47 ficha, 0 foydalanuvchi). Muammo fichada emas.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Oltin qoida: <span className="italic" style={{ color: T.accent }}>avval odam, keyin kod</span></h2></div>
      <Mentor>Butun akseleratorning kompasi shu. Qachon adashsangiz — shu 4 qatorni eslang.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🧭</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — founder</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Kod yozishni bilasiz. Endi kim uchun yozishni o'rganasiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.users(18), c: T.blue, t: 'MAHSULOT = loyiha + real foydalanuvchi + hal qilingan og\'riq' }, { ic: Ico.target(18), c: T.accent, t: '3 LINZA — kim? qaysi og\'riq? nega qaytadi?' }, { ic: Ico.flag(18), c: T.honey, t: 'TARTIB — avval odam va muammo, keyin yechim, keyin kod' }, { ic: Ico.repeat(18), c: T.success, t: 'QAYTISH — mahsulotning eng halol o\'lchovi' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: FOUNDER PORTFOLIO 1-SAHIFA =====
const PROD_ROWS = [
  { key: 'p1', emoji: '1️⃣', color: T.blue },
  { key: 'p2', emoji: '2️⃣', color: T.accent },
  { key: 'p3', emoji: '3️⃣', color: T.success }
];
const emptyProducts = () => ({ p1: { name: '', why: '' }, p2: { name: '', why: '' }, p3: { name: '', why: '' } });
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyProducts());
  const isComplete = (row) => row.name.trim().length >= 2 && row.why.trim().length >= 8;
  const completeCount = PROD_ROWS.filter(r => isComplete(data[r.key])).length;
  const passed = completeCount >= 3;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson93_products', { title: '3 mahsulot va nega ishlaydi', items: PROD_ROWS.map(r => ({ name: data[r.key].name.trim(), why: data[r.key].why.trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, field, v) => setData(prev => ({ ...prev, [k]: { ...prev[k], [field]: v } }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 13, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' };
  const rows = PROD_ROWS.filter(r => isComplete(data[r.key])).map(r => ({ emoji: r.emoji, label: data[r.key].name.trim(), color: r.color, text: data[r.key].why.trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · portfolio" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Founder Portfolio: <span className="italic" style={{ color: T.accent }}>1-sahifa</span></h2></div>
        <Mentor>O'zingiz muntazam ishlatadigan 3 mahsulotni yozing va har biriga: <b>nega ishlaydi?</b> (qaysi og'riqni hal qiladi, nega qaytasiz). Bu portfolio Demo Day'gacha siz bilan boradi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {PROD_ROWS.map((r, i) => { const ok = isComplete(data[r.key]); return (
              <div key={r.key} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ fontSize: 15 }}>{r.emoji}</span><span className="flow-label" style={{ margin: 0, color: r.color }}>{i + 1}-mahsulot</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <input value={data[r.key].name} onChange={e => upd(r.key, 'name', e.target.value)} placeholder="Nomi (masalan: Telegram)" style={inputStyle} />
                  <input value={data[r.key].why} onChange={e => upd(r.key, 'why', e.target.value)} placeholder="Nega ishlaydi? Qaysi og'riq + nega qaytasiz" style={inputStyle} />
                </div>
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Portfolio sahifangiz</p>
            {rows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — birinchi sahifa shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><PortfolioDoc rows={rows} />{passed && <span className="seal">MUHRLANDI ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi sahifa tayyor va saqlandi! Keyingi darsda bu 3 mahsulotga <b>Jobs-to-be-Done</b> linzasini qo'llaymiz: odamlar ularni aslida nima uchun «yollashadi»?</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const BADGES = [
  { t: 'Muammo Ovchisi', l: '95-dars' },
  { t: 'Tadqiqotchi', l: '97-dars' },
  { t: 'Quruvchi', l: '103-dars' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Mahsulot = loyiha + real foydalanuvchi + hal qilingan og\'riq', '3 linza: kim ishlatadi · qaysi og\'riq · nega qaytadi', 'Loyihalar «avval qurib, keyin odam qidirgani» uchun o\'ladi', 'Akselerator yo\'li: Kashf qil → Tekshir → Qur → Isbot qil'];
  const GLOSSARY = [{ b: 'Mahsulot', t: '— real odam muammosini hal qiladigan, ishlatiladigan narsa' }, { b: 'Loyiha', t: '— qurilgan, lekin (hali) foydalanuvchisiz narsa' }, { b: 'Founder', t: '— mahsulotni boshidan oxirigacha yetaklaydigan odam (siz!)' }, { b: '3 linza', t: '— kim? qaysi og\'riq? nega qaytadi?' }, { b: 'Demo Day', t: '— mahsulotni real auditoriyaga taqdim etish kuni' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Akselerator boshlandi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.rocket(12)}</span> 1-dars tamom</span><h2 className="title h-title fade-up d1">Siz endi <span className="italic" style={{ color: T.accent }}>founder ko'zi bilan</span> qaraysiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Zo\'r boshladingiz! Mahsulot va loyiha farqini bilasiz, 3 linzangiz bor, portfolioning 1-sahifasi yozildi. Akselerator yo\'li ochiq.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring — poydevor mustahkam bo\'lishi kerak.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i === 0 ? 'badge-next' : ''}`}>{i === 0 ? '🔜' : '🔒'} {b.t}<span className="badge-when">· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Birinchi nishon — <b style={{ color: T.honey }}>Muammo Ovchisi</b>: 95-darsda atrofingizdan 10 muammo topsangiz.</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🔭</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — founder kuzatuvi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Bugun ishlatgan har bir ilovangizga 3 linzani qo'llang: kim uchun, qaysi og'riq, nega qaytyapsiz? Keyingi dars: Jobs-to-be-Done — odamlar drel emas, teshik sotib olishadi.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson26({ lang: langProp, onFinished }) {
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

        /* === QABUL XATI (s0) === */
        .accept-card { position: relative; background: ${T.paper}; border-radius: 16px; padding: clamp(18px,3vw,26px); box-shadow: 0 14px 34px -12px rgba(${T.shadowBase},0.28); overflow: hidden; }
        .accept-head { display: flex; flex-direction: column; gap: 2px; padding-bottom: 12px; border-bottom: 2px solid ${T.bg}; margin-bottom: 13px; }
        .accept-logo { font-family: 'Manrope'; font-weight: 800; font-size: 15px; color: ${T.accent}; letter-spacing: 0.06em; }
        .accept-sub { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; letter-spacing: 0.22em; }
        .accept-body { font-family: Georgia, serif; font-size: clamp(13px,1.7vw,14.5px); color: ${T.ink}; line-height: 1.6; margin: 0 0 10px; }
        .stamp { display: inline-block; margin-top: 6px; padding: 8px 16px; border: 3px solid ${T.accent}; border-radius: 10px; color: ${T.accent}; font-family: 'Manrope'; font-weight: 800; font-size: clamp(14px,1.9vw,17px); letter-spacing: 0.12em; text-transform: uppercase; transform: rotate(-8deg); animation: stamp-in 0.55s cubic-bezier(.2,.9,.3,1.4) 0.9s both; }
        @keyframes stamp-in { 0% { opacity: 0; transform: scale(2.4) rotate(6deg); } 60% { opacity: 1; transform: scale(0.94) rotate(-10deg); } 80% { transform: scale(1.05) rotate(-7deg); } 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }

        /* === KONVERT (s0) === */
        .envelope { position: relative; width: 100%; max-width: 360px; margin: 6px auto 0; aspect-ratio: 8 / 5; border: none; background: ${T.accent}; border-radius: 16px; cursor: pointer; box-shadow: 0 18px 40px -12px rgba(255,79,40,0.55); overflow: hidden; padding: 0; animation: env-in 0.5s cubic-bezier(.2,.7,.2,1) 0.12s both, env-float 2.6s ease-in-out 0.8s infinite; transition: transform 0.2s; display: block; }
        .envelope:hover { transform: scale(1.03) rotate(-0.5deg); }
        @keyframes env-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes env-float { 0%, 100% { margin-top: 6px; } 50% { margin-top: 0px; } }
        .env-flap { position: absolute; top: 0; left: 0; right: 0; height: 58%; background: #E8431F; clip-path: polygon(0 0, 100% 0, 50% 100%); }
        .env-seal { position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%); width: 46px; height: 46px; border-radius: 50%; background: ${T.paper}; color: ${T.accent}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 19px; box-shadow: 0 6px 16px -4px rgba(0,0,0,0.3); z-index: 2; animation: seal-pulse 1.8s ease-in-out infinite; }
        @keyframes seal-pulse { 0%, 100% { box-shadow: 0 6px 16px -4px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,255,255,0.5); } 50% { box-shadow: 0 6px 16px -4px rgba(0,0,0,0.3), 0 0 0 9px rgba(255,255,255,0); } }
        .env-to { position: absolute; bottom: 32px; left: 0; width: 100%; text-align: center; color: #fff; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; letter-spacing: 0.2em; }
        .env-hint { position: absolute; bottom: 10px; left: 0; width: 100%; text-align: center; color: rgba(255,255,255,0.85); font-family: 'Manrope'; font-weight: 700; font-size: 11px; letter-spacing: 0.04em; }

        /* === FOUNDER METER (s6) === */
        .fmeter-track { height: 10px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; }
        .fmeter-fill { height: 100%; background: linear-gradient(90deg, ${T.honey}, ${T.accent}); border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.45); }

        /* === MUHR (s15) === */
        .seal { position: absolute; bottom: 10px; right: 12px; padding: 5px 11px; border: 2.5px solid ${T.success}; border-radius: 8px; color: ${T.success}; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; transform: rotate(-7deg); background: rgba(255,255,255,0.78); animation: stamp-in 0.5s cubic-bezier(.2,.9,.3,1.4) 0.15s both; }

        /* === KONFETTI (s16) === */
        .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .cf { position: absolute; top: -14px; width: 8px; height: 13px; border-radius: 2px; opacity: 0; animation: cf-fall 2.8s ease-in forwards; }
        @keyframes cf-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(76vh) rotate(560deg); opacity: 0; } }

        /* === ARC STRIP (s1) === */
        .arc-strip { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .arc-chip { display: inline-flex; align-items: center; gap: 6px; background: ${T.paper}; border-radius: 99px; padding: 7px 12px; font-family: 'Manrope'; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .arc-t { font-weight: 700; font-size: 11.5px; color: ${T.ink}; }
        .arc-here { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.35); }
        .arc-you { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.05em; animation: you-pulse 1.8s ease-in-out infinite; }
        @keyframes you-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,79,40,0.45); } 50% { box-shadow: 0 0 0 5px rgba(255,79,40,0); } }
        .arc-sep { color: ${T.ink3}; font-size: 13px; }

        /* === TIMELINE (s3) === */
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
        .money { font-family: 'Fraunces', serif; font-size: clamp(28px,4.5vw,42px); color: ${T.success}; margin: 0; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; animation: money-glow 1.8s ease-in-out 0.3s; }
        @keyframes money-glow { 0%, 100% { text-shadow: none; } 40% { text-shadow: 0 0 22px rgba(31,122,77,0.55); } }

        /* === QABRISTON (s5) === */
        .grave { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 12px; padding: 12px 14px; background: ${CODE.bg}; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.3); }
        .grave-rise { animation: grave-rise 0.55s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes grave-rise { 0% { opacity: 0; transform: translateY(18px) rotate(-1.5deg); } 100% { opacity: 1; transform: translateY(0) rotate(0); } }
        .grave:hover { transform: translateY(-1px); }
        .grave-open { background: ${T.paper}; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.18); }
        .grave-act { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 20px -8px rgba(255,79,40,0.3); }
        .grave-body { display: flex; flex-direction: column; gap: 1px; flex: 1; text-align: left; }
        .grave-name { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: inherit; }
        .grave .grave-name { color: #fff; } .grave-open .grave-name { color: ${T.ink}; }
        .grave-years { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; }
        .grave-act-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }

        /* === SORTER (s6) === */
        .sort-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; }
        .sort-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .sort-text { flex: 1; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; line-height: 1.4; }
        .sort-btns { display: inline-flex; gap: 6px; flex-shrink: 0; }
        .sort-btn { width: 36px; height: 32px; border: none; border-radius: 9px; background: ${T.bg}; font-size: 15px; cursor: pointer; transition: all 0.15s; }
        .sort-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.3); }
        .sb-p:hover { background: ${T.successSoft}; } .sb-l:hover { background: ${T.accentSoft}; }
        .sort-verdict { font-family: 'Manrope'; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; animation: feat-pop .3s cubic-bezier(.2,.7,.2,1); }

        /* === LINZA (s8) === */
        .lens-btn { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 12px; padding: 12px 14px; background: ${T.paper}; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .lens-btn:hover { transform: translateY(-1px); }
        .lens-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; }

        /* === DRILL (s11) === */
        .drill-opt { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 10px; padding: 9px 12px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; text-align: left; }
        .drill-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -7px rgba(${T.shadowBase},0.22); }
        .drill-opt:disabled { cursor: default; }
        .drill-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .drill-no { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake 0.42s; }

        /* === YO'L XARITASI (s10) === */
        .stmap { display: flex; flex-direction: column; gap: 8px; position: relative; }
        .stmap::before { content: ''; position: absolute; left: 21px; top: 18px; bottom: 18px; width: 2px; background: ${T.ink3}44; border-radius: 2px; }
        .st-fill { position: absolute; left: 20px; top: 18px; width: 3px; background: ${T.accent}; border-radius: 2px; transition: height 0.6s cubic-bezier(.4,0,.2,1); z-index: 0; box-shadow: 0 0 8px rgba(255,79,40,0.5); }
        .st-row { display: flex; align-items: center; gap: 12px; width: 100%; border: none; border-radius: 12px; padding: 9px 12px 9px 4px; background: transparent; cursor: pointer; transition: all 0.18s; position: relative; }
        .st-row:hover { background: ${T.paper}; }
        .st-act { background: ${T.paper}; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.2); }
        .st-num { width: 36px; height: 36px; min-width: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px -4px rgba(${T.shadowBase},0.3); z-index: 1; transition: background 0.25s; }
        .st-body { display: flex; flex-direction: column; gap: 1px; flex: 1; text-align: left; }
        .st-t { font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.ink}; display: flex; align-items: center; flex-wrap: wrap; }
        .st-l { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; }

        /* === BADGE (s16) === */
        .badge-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 99px; background: ${T.bg}; color: ${T.ink2}; font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .badge-when { color: ${T.ink3}; font-weight: 600; }
        .badge-next { background: ${T.honeySoft}; color: ${T.honey}; box-shadow: inset 0 0 0 1.5px ${T.honey}55; position: relative; overflow: hidden; }
        .badge-next::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.75), transparent); animation: badge-shine 2.4s ease-in-out infinite; }
        @keyframes badge-shine { 0% { left: -60%; } 55% { left: 120%; } 100% { left: 120%; } }

        /* === PORTFOLIO DOC === */
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

        /* === MENTOR === */
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

        /* === HOOK OPSIYALARI === */
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

        /* === ROADMAP STEP === */
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
