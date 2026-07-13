import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM2 — JOBS-TO-BE-DONE: DREL EMAS — TESHIK — v16 (AUDIOSIZ)
// G'oya: odamlar mahsulotni sotib olmaydi — uni ISHga yollaydi. JTBD: funksional/ijtimoiy/emotsional job.
// Hook: McDonald's milksheyk jumbog'i (Christensen) — raqobatchi banan va zerikish.
// Signature 1: Drel→teshik→surat→his "rentgen zanjiri" (qulfli, tartib bilan).
// Signature 2: Job saralash o'yini (⚙️/👥/❤️) + instinkt shkalasi. Signature 3: JTBD formula quruvchi.
// Yakuniy ish: Founder Portfolio 2-sahifa — 93-darsda yozilgan 3 mahsulotga JTBD (localStorage'dan o'qiladi).
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
  tool: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4L15 12l-3-3z" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-jtbd-27-v16', lessonTitle: { uz: 'Jobs-to-be-Done — drel emas, teshik', ru: 'Jobs-to-be-Done — не дрель, а дырка' } };
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
// 93-darsda yozilgan 3 mahsulotni o'qish (bo'lmasa — standart misollar)
const readLesson93Products = () => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    const items = raw ? JSON.parse(raw)?.lesson93_products?.items : null;
    if (Array.isArray(items) && items.length >= 3 && items.every(i => i && i.name)) return { own: true, names: items.slice(0, 3).map(i => i.name) };
  } catch { /* buzilgan JSON — standartga o'tamiz */ }
  return { own: false, names: ['Telegram', 'Instagram', 'YouTube'] };
};

// ===== KONSEPT LEKSIKONI =====
// Rentgen zanjiri (s2) — SIGNATURE 1
const XRAY = [
  { id: 'x1', ic: '🛠️', y: "Do'kon sotadi", t: 'Drel', d: 'Sotuvchi nazarida odam drel sotib olyapti: quvvati, tezligi, brendi. Lekin hech kim drelning o\'zini sevmaydi. Chuqurroq qaraymiz…' },
  { id: 'x2', ic: '🕳️', y: 'Bevosita natija', t: 'Teshik', d: 'Unga aslida devordagi 8 mm teshik kerak. Mashhur ibora shu yerdan: «Odamlar drel emas — teshik sotib oladi». Lekin teshik ham o\'z-o\'zidan qadrli emas…' },
  { id: 'x3', ic: '🖼️', y: 'Haqiqiy maqsad', t: 'Osilgan oilaviy surat', d: 'Teshikka dyubel, unga oilaviy surat osiladi. Devor endi bo\'m-bo\'sh emas. Lekin bu ham oxirgi qatlam emas…' },
  { id: 'x4', ic: '😌', y: 'Eng chuqur job', t: 'Shinam uy hissi', d: '«Uyim chiroyli, mehmonlar oldida faxrlanaman». MANA odam aslida nimani «sotib oladi». Drel — bu hisga yetishning vositasi, xolos.' }
];

// 3 job turi (s5)
const JOBTYPES = [
  { id: 'f', label: 'Funksional job', emoji: '⚙️', color: T.blue, soft: T.blueSoft, d: 'Aniq amaliy vazifa: bog\'lanish, yetib borish, saqlash, hisoblash. Instagram misolida: do\'stlar nima qilayotganini bilib turish, xotiralarni bir joyda saqlash.' },
  { id: 's', label: 'Ijtimoiy job', emoji: '👥', color: T.grape, soft: T.grapeSoft, d: 'Boshqalar ko\'zida qanday ko\'rinish: status, tan olinish, davraga tegishlilik. Instagram misolida: «hayotim qiziq» deb ko\'rsatish, trendda ekanini bildirish.' },
  { id: 'e', label: 'Emotsional job', emoji: '❤️', color: T.accent, soft: T.accentSoft, d: 'O\'zini qanday HIS qilish: xotirjamlik, quvonch, zerikishdan qochish. Instagram misolida: navbatda turganda zerikmaslik, kulgili reels bilan yayrash.' }
];

// Job saralash o'yini (s6) — SIGNATURE 2
const JOBSORT = [
  { id: 'j1', t: 'Google Maps — notanish joyga adashmay yetib borish', type: 'f', why: 'Aniq, o\'lchanadigan amaliy vazifa — sof funksional job.' },
  { id: 'j2', t: 'Yangi iPhone — sinfda hamma ko\'rsin', type: 's', why: 'Gap telefonda emas — boshqalar ko\'zidagi statusda. Ijtimoiy job.' },
  { id: 'j3', t: 'Sevimli pleylist — kayfiyatni ko\'tarish', type: 'e', why: 'Natija — ichki his. Emotsional job.' },
  { id: 'j4', t: 'Budilnik — birinchi darsga kech qolmaslik', type: 'f', why: 'Vazifa aniq bajarildi yoki yo\'q — funksional job.' },
  { id: 'j5', t: 'Sayohat rasmini storisga joylash — «hayotim qiziq»', type: 's', why: 'Rasm o\'zi uchun emas — auditoriya uchun. Ijtimoiy job.' },
  { id: 'j6', t: 'Iliq choy va serial — og\'ir kundan keyin tinchlanish', type: 'e', why: 'Choy «tinchlanish» ishiga yollangan — emotsional job.' },
  { id: 'j7', t: 'Kalkulyator — chegirma foizini tez hisoblash', type: 'f', why: 'Hisobla va bo\'ldi — funksional job.' },
  { id: 'j8', t: 'Brendli krossovka — davrada «o\'zimizniki» bo\'lish', type: 's', why: 'Guruhga tegishlilik hissi boshqalar ko\'zida — ijtimoiy job.' }
];
const JT = { f: { emoji: '⚙️', label: 'Funksional', color: T.blue }, s: { emoji: '👥', label: 'Ijtimoiy', color: T.grape }, e: { emoji: '❤️', label: 'Emotsional', color: T.accent } };

// Founderlar JTBD ko'zi bilan (s7) — 93-darsdan tanish qahramonlar
const FOUNDERS = [
  { id: 'mo', name: 'Mo\'s Bows (Moziah)', ic: '🎀', biz: 'Bolalar kapalak-galstugi', jobs: 'Ota o\'g\'liga galstuk oladi. Funksional job (bo\'yinni isitish?) — deyarli NOL! Asosiy job ijtimoiy: «o\'g\'lim davrada chiroyli ko\'rinsin» 👥 + emotsional: bola o\'zini katta va jiddiy his qiladi ❤️.' },
  { id: 'al', name: 'Zolli Candy (Alina)', ic: '🍭', biz: 'Tishga zarar yetkazmaydigan konfet', jobs: 'Bola uchun: shirinlik quvonchi ❤️. Onasi uchun: «tish buziladi» degan aybdorlik YO\'Q — xotirjamlik ❤️ + tish sog\'lig\'i ⚙️. Bitta konfet — ikki mijoz, ikki xil job!' },
  { id: 'ri', name: 'SmartCane (Riya)', ic: '🦯', biz: 'Sensorli aqlli hassa', jobs: 'Funksional: to\'siqni oldindan sezish ⚙️. Lekin chuqurroq job emotsional: «birovga qaram emasman» — mustaqillik va ishonch hissi ❤️. Kuchli mahsulot bir nechta jobni birga bajaradi.' }
];

// JTBD formula quruvchi (s8) — SIGNATURE 3, milksheyk misolida
const FSLOTS = [
  { id: 'when', label: '1 · VAZIYAT — qachon?', color: T.blue, opts: ['Sport zalida mashq qilayotganimda', 'Ertalab uzoq, zerikarli yo\'lga chiqqanimda', 'Kechki ovqatdan keyin'], correct: 1, why: 'Kuzatuv shuni ko\'rsatdi: xaridorlarning katta qismi — ertalabki yolg\'iz haydovchilar.' },
  { id: 'why', label: '2 · NATIJA — nima uchun?', color: T.success, opts: ['Toki vazn yo\'qotay', 'Toki uyqum kelmasin', 'Toki yo\'l zerikarli o\'tmasin va tushlikkacha to\'q yuray'], correct: 2, why: 'Quyuq milksheyk 20 daqiqa so\'riladi — yo\'lga yo\'ldosh va tushlikkacha to\'qlik.' },
  { id: 'rival', label: '3 · RAQOBATCHI — kimga qarshi?', color: T.grape, opts: ['Banan, bagel va… zerikish', 'Boshqa restoran milksheyklari', 'Gazli ichimliklar'], correct: 0, why: 'Xuddi shu ishga odamlar banan, bagel yollab ko\'rgan — hammasi yo\'lda noqulay. Asosiy raqib esa — zerikish!' }
];

// Bitta mahsulot — uch vaziyat (s10)
const CONTEXTS = [
  { id: 'c1', chip: '📚 Imtihon arafasi', d: '«Integral qanday yechiladi?» — YouTube o\'qituvchi ishiga yollandi.', type: 'f', verdict: 'Funksional job: aniq bilim olish.' },
  { id: 'c2', chip: '😴 Uyqudan oldin', d: 'Maqsadsiz lentani aylantirish — YouTube «zerikishni o\'ldirish» ishiga yollandi.', type: 'e', verdict: 'Emotsional job: dam olish, chalg\'ish.' },
  { id: 'c3', chip: '🔥 Tanaffusda', d: '«Buni ko\'rdingmi?!» — hamma ko\'rgan trendni bilish, suhbatdan chetda qolmaslik.', type: 's', verdict: 'Ijtimoiy job: davrada «o\'z odam» bo\'lish.' }
];

// Yo'naltirilgan mashq (s11)
const DRILL = [
  { id: 'd1', label: 'Dilnoza har kuni metroda podkast eshitadi', emoji: '🎧', color: T.blue, opts: ['Quloqchinining sifatini tekshirish uchun', 'Yo\'l vaqtini foydali va qiziqarli o\'tkazish uchun', 'Podkast boshlovchisini qo\'llab-quvvatlash uchun'], correct: 1, why: 'Podkast «zerikarli yo\'lni foydali qilish» ishiga yollangan — milksheyk bilan bir xil vaziyat!' },
  { id: 'd2', label: 'Sardor rasmni yopiq guruhga emas — ochiq profilga joyladi', emoji: '📸', color: T.grape, opts: ['Telefon xotirasini bo\'shatish uchun', 'Xotirani saqlab qo\'yish uchun', 'Ko\'pchilik ko\'rsin — ijtimoiy job uchun'], correct: 2, why: 'Yopiq guruh xotira saqlashga yetardi. Ochiq profil tanlangani — job ijtimoiy ekanining belgisi.' },
  { id: 'd3', label: 'Madina og\'ir imtihondan keyin muzqaymoq oldi', emoji: '🍦', color: T.accent, opts: ['Ochlikni qondirish uchun', 'O\'zini siylash — «men bunga loyiqman» hissi uchun', 'Kalsiy yetishmovchiligi uchun'], correct: 1, why: 'Vaziyatga qarang: imtihondan KEYIN. Bu ovqat emas — mukofot. Emotsional job.' }
];

// Akselerator bosqich chiziqchasi (s1)
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

// Founder Portfolio hujjati (s15)
const PortfolioDoc = ({ rows, title = 'Founder Portfolio · 2-sahifa' }) => (
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
          {i === 0 && <span className="arc-you">2/3</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: MILKSHEYK JUMBOG'I =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: '«Qaysi ta\'m sizga ko\'proq yoqadi?»' },
    { id: 'b', label: '«Odamlar milksheykni qanday ISHGA yollashadi?»' },
    { id: 'c', label: '«Narxni qancha tushirsak sotib olasiz?»' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Akselerator" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Milksheyk <span className="italic" style={{ color: T.accent }}>jumbog'i</span></h1>
        <Mentor>Dunyodagi eng mashhur mahsulot-tadqiqot hikoyalaridan biri. Diqqat bilan o'qing — javob kutilmagan.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.honey}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.honey, fontWeight: 700 }}>🥤 McDONALD'S, 1990-YILLAR</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Vazifa: milksheyk savdosini oshirish. Kompaniya mijozlardan so'radi: <i>«Qalinroq qilaylikmi? Shirinroqmi? Shokoladli?»</i> Hammasi qilindi. Savdo… <b>umuman o'zgarmadi</b>.</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Keyin Harvard professori Clayton Christensen jamoasi keldi — va BOSHQA savol berdi. Savdo o'sdi.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Ular qanday savol berdi deb o'ylaysiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan shunday! ' : 'Yo\'q — ular so\'radi: '}<b>«Odamlar milksheykni qanday ishga yollashadi?»</b> Kuzatuv esa hayratlanarli edi: xaridorlarning katta qismi — ertalabki 8dan oldin, yolg'iz, mashinada. Ular milksheykni <b>uzoq zerikarli yo'lga yo'ldosh</b> ishiga yollashardi! Raqobatchilar: banan, bagel va… zerikish. Bugun shu «yollash» tafakkurini o'rganamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Drel → teshik → …: rentgen zanjiri', tag: 'interaktiv' },
    { text: '«Yollash» metaforasi — mahsulot ishchi', tag: '' },
    { text: '3 xil Job: funksional · ijtimoiy · emotsional', tag: '' },
    { text: 'Job saralash o\'yini + JTBD formula', tag: 'o\'yin' },
    { text: 'Portfolio 2-sahifa: O\'Z mahsulotlaringizga JTBD', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.tool(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Jobs-to-be-Done tafakkuri</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Odamlar mahsulotni sotib olmaydi — uni ISHga yollaydi.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Kashf bosqichi, 2-qadam: foydalanuvchi ko'zi bilan qarash</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Drel emas — teshik</span>: JTBD darsi</h2></div>
        <Mentor>O'tgan darsda 3 linzani o'rgandingiz. Bugun eng kuchli linzani chuqurlashtiramiz: <b style={{ color: T.ink }}>odam mahsulotni QAYSI ISHGA yollaydi?</b> Dars oxirida buni o'z portfoliongizdagi mahsulotlarga qo'llaysiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — RENTGEN ZANJIRI (SIGNATURE 1) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(XRAY.map(x => x.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'x4' : null);
  const done = seen.size >= XRAY.length;
  const tap = (id) => {
    const idx = XRAY.findIndex(x => x.id === id);
    if (idx > seen.size) return; // zanjir tartib bilan ochiladi
    setActive(id);
    setSeen(prev => { const n = new Set(prev); n.add(id); return n; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? XRAY.find(x => x.id === active) : null;
  return (
    <Stage eyebrow="Rentgen zanjiri" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Zanjirni oching (${seen.size}/${XRAY.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Odam do'konda drel oldi. <span className="italic" style={{ color: T.accent }}>Aslida nimani sotib oldi?</span></h2></div>
        <Mentor>Har qatlamda «NEGA?» deb so'raymiz va chuqurlashamiz. Zanjirni tartib bilan oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="tl fade-up delay-1">
              {XRAY.map((x, xi) => { const on = seen.has(x.id); const act = active === x.id; const isNext = !on && xi === seen.size; const locked = !on && xi > seen.size; return (
                <button key={x.id} className={`tl-item ${on ? 'tl-seen' : ''} ${act ? 'tl-act' : ''} ${isNext ? 'tl-next' : ''} ${locked ? 'tl-lock' : ''}`} onClick={() => tap(x.id)}>
                  <span className="tl-dot" style={{ background: on ? T.accent : T.paper, color: on ? '#fff' : T.ink3 }}>{locked ? '🔒' : x.ic}</span>
                  <span className="tl-body"><span className="tl-year">{locked ? '· · ·' : x.y}</span><span className="tl-title">{locked ? '?????' : x.t}</span></span>
                  {on && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                  {isNext && <span className="tl-cue">nega? →</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.y} · {cur.t}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Birinchi qatlamni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zanjir: drel → teshik → surat → <b>shinam uy hissi</b>. Sotuvchi vositani ko'radi, foydalanuvchi — natijani. Founder sifatida siz doim <b>oxirgi qatlamgacha</b> borishingiz kerak.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — «YOLLASH» METAFORASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('buy');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['buy', 'hire']) : new Set(['buy']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isBuy = v === 'buy';
  return (
    <Stage eyebrow="Yollash metaforasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulot — <span className="italic" style={{ color: T.accent }}>sizning ishchingiz</span></h2></div>
        <Mentor>JTBD tili: mahsulot ishga YOLLANADI. Ishni bajarsa — qoladi, bajarmasa — «ishdan bo'shatiladi» (o'chiriladi). Ikkala qarashni solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isBuy ? 'chip-on' : ''}`} onClick={() => set('buy')}>🛒 «Sotib olish» ko'zi</button>
              <button className={`chip ${!isBuy ? 'chip-on' : ''}`} onClick={() => set('hire')}>🤝 «Yollash» ko'zi</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isBuy ? T.ink3 : T.accent}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isBuy
                ? '«Telegram — bepul messenger. 2GB fayl, stikerlar, kanallar, sirli chatlar…» — XUSUSIYATLAR ro\'yxati. Foydalanuvchi bularning yarmini bilmaydi ham.'
                : '«Men Telegramni SINFDOSHLAR BILAN ALOQADA QOLISH ishiga yolladim. U bu ishni zo\'r bajaryapti — shuning uchun har kuni ochaman.» — bajarilayotgan ISH.'}</p>
            </div>
          </Col>
          <Col>
            {isBuy
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Xususiyatlar ro'yxati mahsulot NEGA kerakligini aytmaydi. 47 fichali «SuperApp»ni eslang — xususiyat ko'p, ish yo'q edi.</p></div>
              : <div className="frame-success fade-step" key="h"><p className="body" style={{ margin: 0, color: T.ink }}>«Yollash» ko'zi darrov to'g'ri savolga olib keladi: qaysi ish? kim uchun? ish bajarilyaptimi? Ish bajarilmasa — foydalanuvchi «ishdan bo'shatadi».</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Esda tuting: raqobatchingiz ham «shu ishga da'vogar» hamma narsa. Milksheykning raqibi banan bo'lgani kabi — sizning ilovangizning raqibi qog'oz-daftar bo'lishi mumkin!</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="JTBD tafakkuri qaysi savolni beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>JTBD qaysi <span className="italic" style={{ color: T.accent }}>savolni</span> beradi?</h2></>}
    options={['Mahsulotda nechta xususiyat bor?', 'Odam bu mahsulotni qaysi ISHNI bajarish uchun yollaydi?', 'Mahsulot qaysi texnologiyada qurilgan?', 'Raqobatchilar qancha turadi?']} correctIdx={1}
    explainCorrect="To'g'ri! JTBD asosiy savoli: odam mahsulotni qaysi ishga yollaydi? Drel «teshik ochish» ishiga, milksheyk «zerikarli yo'lga yo'ldosh» ishiga yollanadi."
    explainWrong={{ 0: 'Xususiyat soni — «sotib olish» ko\'zi. JTBD ishni so\'raydi.', 2: 'Texnologiya foydalanuvchiga baribir — unga bajarilgan ish kerak.', 3: 'Narx muhim, lekin JTBD savoli emas.', default: 'Kalit so\'z — ISH (Job).' }} />
);

// ===== SCREEN 5 — 3 JOB TURI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(JOBTYPES.map(j => j.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= JOBTYPES.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? JOBTYPES.find(j => j.id === active) : null;
  return (
    <Stage eyebrow="3 job turi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${JOBTYPES.length} turni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta mahsulot — <span className="italic" style={{ color: T.accent }}>uch xil ish</span></h2></div>
        <Mentor>Job har doim uch qavatda yashaydi. Instagram misolida uchchalasini oching — farqni his qiling.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📱</span>
              <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Instagram</p><p className="small" style={{ margin: 0, color: T.ink2 }}>uchala job turini bitta ilovada ko'ramiz</p></div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {JOBTYPES.map(j => { const on = seen.has(j.id); return (
                <button key={j.id} className="lens-btn" style={active === j.id ? { boxShadow: `inset 0 0 0 2px ${j.color}`, background: j.soft } : undefined} onClick={() => tap(j.id)}>
                  <span style={{ fontSize: 17 }}>{j.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? j.color : T.ink }}>{j.label}</span>
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Job turini bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kuchli mahsulot ko'pincha uchala jobni birga bajaradi — lekin bittasi <b>asosiy</b>. Founder vazifasi: asosiysini topish va uni a'lo bajarish.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="«Bu krossovkani kiysam davrada zo'r ko'rinaman» — qaysi job?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>«Kiysam davrada zo'r ko'rinaman» — <span className="italic" style={{ color: T.accent }}>qaysi job</span>?</h2></>}
    options={['Funksional — oyoqni himoya qiladi', 'Ijtimoiy — boshqalar ko\'zida qanday ko\'rinish', 'Emotsional — yugurish qulayligi', 'Bu umuman job emas']} correctIdx={1}
    explainCorrect="To'g'ri! «Davrada ko'rinish» — boshqalar ko'ziga qaratilgan, demak ijtimoiy job. Krossovkaning himoya vazifasi (funksional) bu xaridda ikkinchi o'rinda."
    explainWrong={{ 0: 'Himoya — funksional, lekin gapda «davrada ko\'rinish» aytilgan.', 2: 'Emotsional — o\'z ichki hissi; bu yerda esa boshqalar ko\'zi.', 3: 'Bu to\'la job — faqat qaysi tur?', default: 'Kalit: «davrada» — boshqalar ko\'zi.' }} />
);

// ===== SCREEN 6 — JOB SARALASH O'YINI (SIGNATURE 2) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(JOBSORT.map(it => [it.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = JOBSORT.filter(it => state[it.id]?.ok).length;
  const done = okCount >= JOBSORT.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (it, type) => {
    if (state[it.id]?.ok) return;
    const ok = type === it.type;
    setState(prev => ({ ...prev, [it.id]: { ok, wrong: !ok } }));
    setLast({ id: it.id, ok, why: it.why, type: it.type });
  };
  return (
    <Stage eyebrow="Saralash · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Saralang (${okCount}/${JOBSORT.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi <span className="italic" style={{ color: T.accent }}>job turi?</span></h2></div>
        <Mentor>Har vaziyatga qaror bering: ⚙️ funksional, 👥 ijtimoiy yoki ❤️ emotsional? Maslahat: natija KIMGA qaratilgan — vazifagami, boshqalar ko'zigami, o'z hissigami?</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {JOBSORT.map(it => {
                const st = state[it.id] || {};
                return (
                  <div key={it.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{it.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: JT[it.type].color }}>{JT[it.type].emoji} {JT[it.type].label}</span>
                      : <span className="sort-btns"><button className="sort-btn" title="Funksional" onClick={() => pick(it, 'f')}>⚙️</button><button className="sort-btn" title="Ijtimoiy" onClick={() => pick(it, 's')}>👥</button><button className="sort-btn" title="Emotsional" onClick={() => pick(it, 'e')}>❤️</button></span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🧠 Job instinkti</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{JOBSORT.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / JOBSORT.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ To\'g\'ri!' : '✗ Yana o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Natija kimga qaratilgan? Vazifa bajarilishiga (⚙️), boshqalar fikriga (👥) yoki o\'z his-tuyg\'usiga (❤️)?'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Kartadagi ⚙️ / 👥 / ❤️ ni bosing — izoh shu yerda chiqadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sezdingizmi? Bitta savol hammasini ochadi: <b>«natija qayerda yashaydi?»</b> — real dunyoda (⚙️), boshqalar boshida (👥) yoki o'z yuragida (❤️).</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — FOUNDERLAR JTBD KO'ZI BILAN =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(FOUNDERS.map(f => f.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= FOUNDERS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? FOUNDERS.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="Tanish founderlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${FOUNDERS.length} tahlilni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'tgan darsdagi founderlar — <span className="italic" style={{ color: T.accent }}>endi JTBD ko'zi bilan</span></h2></div>
        <Mentor>Ularni eslaysiz. Endi chuqurroq savol: mijozlar bu mahsulotlarni qaysi ISHGA yollagan? Javoblar kutilmagan bo'lishi mumkin.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FOUNDERS.map(f => { const on = seen.has(f.id); return (
                <button key={f.id} className={`plink ${active === f.id ? 'plink-on' : ''}`} onClick={() => tap(f.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{f.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{f.name}</span><br /><span className="small" style={{ color: T.ink2 }}>{f.biz}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">qaysi job?</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.name}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.6 }}>{cur.jobs}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Founderni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muhim saboq: mahsulotning <b>ko'rinishi</b> (galstuk, konfet, hassa) va <b>bajaradigan ishi</b> (status, xotirjamlik, mustaqillik) — boshqa-boshqa narsalar. Ishni ko'rgan founder yutadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — JTBD FORMULA QURUVCHI (SIGNATURE 3) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(FSLOTS.map(s => [s.id, s.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = FSLOTS.filter(s => picked[s.id] === s.correct).length;
  const done = okCount >= FSLOTS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (s, i) => {
    if (picked[s.id] === s.correct) return;
    setPicked(prev => ({ ...prev, [s.id]: i }));
    setWrong(prev => ({ ...prev, [s.id]: i !== s.correct }));
  };
  return (
    <Stage eyebrow="JTBD formula · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Formulani yig'ing (${okCount}/${FSLOTS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Milksheyk uchun <span className="italic" style={{ color: T.accent }}>JTBD formulani yig'ing</span></h2></div>
        <Mentor>Formula: <b style={{ color: T.ink }}>«Qachonki [VAZIYAT], men [MAHSULOT]ni yollayman, toki [NATIJA]»</b>. Har qism uchun to'g'ri javobni tanlang — o'ngda formula yig'iladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {FSLOTS.map(s => {
              const p = picked[s.id];
              const solved = p === s.correct;
              return (
                <div key={s.id} className="frame" style={{ padding: 'clamp(13px,2vw,17px)', borderLeft: `4px solid ${solved ? T.success : s.color}` }}>
                  <p className="flow-label" style={{ color: s.color, marginBottom: 9 }}>{s.label}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {s.opts.map((o, i) => {
                      let cls = 'drill-opt';
                      if (solved && i === s.correct) cls += ' drill-ok';
                      else if (!solved && p === i && wrong[s.id]) cls += ' drill-no';
                      return (<button key={i} className={cls} disabled={solved} onClick={() => pick(s, i)}><span className="mono small" style={{ minWidth: 16, color: T.ink3 }}>{String.fromCharCode(65 + i)}</span><span style={{ flex: 1 }}>{o}</span>{solved && i === s.correct && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>);
                    })}
                  </div>
                  {solved && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.success, fontWeight: 600 }}>✓ {s.why}</p>}
                  {!solved && p !== undefined && wrong[s.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Hook'dagi kuzatuvni eslang: ertalab, yolg'iz, mashinada…</p>}
                </div>
              );
            })}
          </Col>
          <Col>
            <p className="flow-label">Yig'ilayotgan formula</p>
            <div className="spec-card" style={{ minHeight: 130 }}>
              <p className="spec-text" style={{ color: CODE.text }}>
                «Qachonki <b style={{ color: picked.when === 1 ? CODE.str : CODE.comment }}>{picked.when === 1 ? 'ertalab uzoq, zerikarli yo\'lga chiqsam' : '[vaziyat…]'}</b>, men <b style={{ color: CODE.attr }}>quyuq milksheykni</b> yollayman, toki <b style={{ color: picked.why === 2 ? CODE.str : CODE.comment }}>{picked.why === 2 ? 'yo\'l zerikarli o\'tmasin va tushlikkacha to\'q yuray' : '[natija…]'}</b>.»
              </p>
              <p className="spec-text" style={{ color: picked.rival === 0 ? CODE.str : CODE.comment, marginTop: 8 }}>Raqobatchilar: {picked.rival === 0 ? 'banan, bagel va zerikish 🍌🥯😴' : '[kimga qarshi…?]'}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula tayyor! E'tibor bering: unda mahsulot xususiyati YO'Q — faqat vaziyat, ish va natija. Yakuniy ishda shu formulani o'z mahsulotlaringizga yozasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Milksheykning asosiy raqobatchisi kim bo'lib chiqdi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Milksheykning asosiy <span className="italic" style={{ color: T.accent }}>raqobatchisi</span> kim edi?</h2></>}
    options={['Boshqa restoranlarning milksheyklari', 'Banan, bagel va zerikish — o\'sha ishga da\'vogar hamma narsa', 'Gazli ichimliklar', 'Qahva']} correctIdx={1}
    explainCorrect="To'g'ri! Raqobat mahsulot toifasida emas — ISHda bo'ladi. «Yo'lga yo'ldosh» ishiga banan ham, bagel ham, radio ham da'vogar. Sizning ilovangizning raqibi ham Google emas — balki qog'oz-daftar yoki «hech narsa qilmaslik»dir."
    explainWrong={{ 0: 'Toifa ichida o\'ylash — eski ko\'z. Ish uchun kurash kengroq.', 2: 'Gazli ichimlik boshqa ishlarga yollanadi.', 3: 'Qahva ham raqib, lekin javob to\'liq emas — zerikish ham raqib!', default: 'Ishga da\'vogar HAMMA narsa raqib.' }} />
);

// ===== SCREEN 10 — BITTA MAHSULOT, UCH VAZIYAT =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('c1');
  const [seen, setSeen] = useState(storedAnswer ? new Set(CONTEXTS.map(c => c.id)) : new Set(['c1']));
  const done = seen.size >= CONTEXTS.length;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = CONTEXTS.find(c => c.id === v);
  return (
    <Stage eyebrow="Vaziyat hal qiladi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${CONTEXTS.length} vaziyatni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">YouTube bitta. <span className="italic" style={{ color: T.accent }}>Job — vaziyatga qarab uch xil.</span></h2></div>
        <Mentor>Job mahsulotda emas — VAZIYATDA yashaydi. Uchala vaziyatni bosing va bitta YouTube qanday uch xil ishga yollanishini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CONTEXTS.map(c => (<button key={c.id} className={`chip ${v === c.id ? 'chip-on' : ''}`} onClick={() => set(c.id)}>{c.chip}</button>))}
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${JT[cur.type].color}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{cur.d}</p>
            </div>
          </Col>
          <Col>
            <div className="sk-info fade-step" key={v}>
              <span className="sk-wordbadge" style={{ color: JT[cur.type].color, background: JT[cur.type].color + '1c' }}>{JT[cur.type].emoji} {cur.verdict}</span>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun keyingi darslarda biz mahsulotni emas — <b>odamlarning VAZIYATLARINI</b> o'rganamiz: kuzatamiz, savol beramiz, intervyu qilamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — YO'NALTIRILGAN MASHQ =====
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
    <Stage eyebrow="Mashq · job detektivi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Jobni toping (${okCount}/${DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Job detektivi: <span className="italic" style={{ color: T.accent }}>vaziyatdan ishni toping</span></h2></div>
        <Mentor>Uch real vaziyat. Har birida odam nimanidir «yollagan». Qaysi ishga? Vaziyat tafsilotlariga e'tibor bering — ular hammasini aytadi.</Mentor>
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Vaziyatni qayta o'qing: QACHON va QANDAY sharoitda ishlatilyapti?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Detektiv ko'nikmasi shakllandi! Endi eng muhimi — buni <b>o'z portfoliongizga</b> qo'llash.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Job qayerda «yashaydi»?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Job qayerda <span className="italic" style={{ color: T.accent }}>«yashaydi»</span>?</h2></>}
    options={['Mahsulotning ichida — kodda va fichalarda', 'Odamning VAZIYATIDA — qachon, qayerda, nima uchun kerak bo\'lganida', 'Reklama sloganida', 'Narx belgisida']} correctIdx={1}
    explainCorrect="To'g'ri! Job vaziyatda yashaydi: o'sha YouTube imtihon oldidan o'qituvchi, tanaffusda esa ijtimoiy yopishqoq. Shu sababli founder mahsulotdan oldin VAZIYATLARNI o'rganadi."
    explainWrong={{ 0: 'Ficha — ishning bajaruvchisi, o\'zi emas. Vaziyat o\'zgarsa, o\'sha ficha keraksiz bo\'ladi.', 2: 'Reklama jobni aks ettirishi mumkin, lekin yaratmaydi.', 3: 'Narx — to\'siq yoki imkon, job emas.', default: 'Job — odamning vaziyatida.' }} />
);

// ===== SCREEN 13 — CASE: DO'STGA MASLAHAT =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Yana ko\'proq grafik va statistika qo\'sh — funksiya ko\'p bo\'lsa qadri oshadi»' },
    { id: 1, t: '«Avval so\'ra: odamlar fitnes-ilovani qaysi ISHGA yollashadi — va sening ilovang o\'sha ishni bajaryaptimi?»' },
    { id: 2, t: '«Ilovani pullik qil — pul to\'lagan odam qadrlaydi»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz <span className="italic" style={{ color: T.accent }}>yana qaytdi</span> — endi nima deysiz?</h2></div>
        <Mentor>O'tgan darsda Aziz odamlar bilan gaplashishni o'rgandi. Endi yangi savol bilan keldi — JTBD bilan javob bering.</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«5 kishi bilan gaplashdim — rahmat! Ular ilovamni o'rnatishdi. Lekin bir hafta ishlatib… tashlab ketishyapti. Kaloriya grafigi, qadam sanagich, statistika — hammasi bor-ku! Yana nima qo'shay?»</p>
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
            ? 'Odamlar fitnes-ilovani grafik uchun emas — «formada bo\'lish va o\'zimni zo\'r his qilish» ishiga yollashadi. Grafik bu ishni bajarmaydi — MOTIVATSIYA bajaradi: kunlik streak, do\'st bilan bellashuv, kichik g\'alabalar. Aziz ficha emas — bajarilmayotgan ISHNI izlashi kerak.'
            : (picked === 0 ? 'Ficha allaqachon ko\'p — muammo boshqa yerda. «SuperApp» yo\'lini eslang.' : 'Pullik qilish ishni bajarmayotgan ilovani qutqarmaydi — aksincha, tezroq tashlab ketishadi.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Oltin qoida: <span className="italic" style={{ color: T.accent }}>odamlar natijani sotib oladi</span></h2></div>
      <Mentor>JTBD kompasingiz. G'oyangizga shubha tug'ilganda shu 4 qatorga qaytib keling.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🕳️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Drel emas — teshik</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Mahsulotingiz — vosita. Odam natijani «sotib oladi».</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.tool(18), c: T.blue, t: 'ZANJIR — «nega?» deb oxirgi qatlamgacha boring' }, { ic: Ico.repeat(18), c: T.accent, t: 'YOLLASH — ish bajarilmasa, mahsulot «ishdan bo\'shatiladi»' }, { ic: Ico.users(18), c: T.grape, t: '3 TUR — ⚙️ funksional · 👥 ijtimoiy · ❤️ emotsional' }, { ic: Ico.flag(18), c: T.success, t: 'VAZIYAT — job mahsulotda emas, odamning vaziyatida yashaydi' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: PORTFOLIO 2-SAHIFA =====
const ROW_COLORS = [T.blue, T.accent, T.success];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [products] = useState(() => readLesson93Products());
  const [data, setData] = useState(() => storedAnswer?.data || { j0: '', j1: '', j2: '' });
  const isComplete = (v) => v.trim().length >= 10;
  const completeCount = [0, 1, 2].filter(i => isComplete(data['j' + i])).length;
  const passed = completeCount >= 3;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson94_jtbd', { title: '3 mahsulotning JTBD tahlili', items: [0, 1, 2].map(i => ({ product: products.names[i], job: data['j' + i].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 13, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' };
  const rows = [0, 1, 2].filter(i => isComplete(data['j' + i])).map(i => ({ emoji: '💼', label: products.names[i], color: ROW_COLORS[i], text: data['j' + i].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · portfolio" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Founder Portfolio: <span className="italic" style={{ color: T.accent }}>2-sahifa — JTBD</span></h2></div>
        <Mentor>{products.own
          ? <>Mana <b style={{ color: T.ink }}>93-darsda O'ZINGIZ yozgan</b> 3 mahsulot! Endi har biriga JTBD yozing: <b style={{ color: T.ink }}>«Qachonki [vaziyat], men uni yollayman, toki [natija]»</b>.</>
          : <>Har mahsulotga JTBD yozing: <b style={{ color: T.ink }}>«Qachonki [vaziyat], men uni yollayman, toki [natija]»</b>. (93-dars portfoliosi topilmadi — standart misollar berildi.)</>}</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {[0, 1, 2].map(i => { const ok = isComplete(data['j' + i]); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ fontSize: 15 }}>💼</span><span className="flow-label" style={{ margin: 0, color: ROW_COLORS[i] }}>{products.names[i]}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}</div>
                <input value={data['j' + i]} onChange={e => upd('j' + i, e.target.value)} placeholder="Qachonki …, men uni yollayman, toki …" style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Portfolio sahifangiz</p>
            {rows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — 2-sahifa shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><PortfolioDoc rows={rows} />{passed && <span className="seal">MUHRLANDI ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>2-sahifa tayyor! Endi sizda founder ko'zi bor: mahsulot emas — ish. Keyingi darsda shu ko'z bilan atrofingizdan <b>10 ta muammo ovlaysiz</b> — va birinchi nishon sizniki bo'ladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const BADGES = [
  { t: 'Muammo Ovchisi', l: 'KEYINGI DARS!' },
  { t: 'Tadqiqotchi', l: '97-dars' },
  { t: 'Quruvchi', l: '103-dars' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Odamlar drel emas — teshik (aslida: shinam uy hissini) sotib oladi', 'Mahsulot ishga YOLLANADI: ish bajarilmasa — o\'chiriladi', '3 job turi: ⚙️ funksional · 👥 ijtimoiy · ❤️ emotsional', 'Job vaziyatda yashaydi; raqib — o\'sha ishga da\'vogar hamma narsa'];
  const GLOSSARY = [{ b: 'JTBD', t: '— Jobs-to-be-Done: odam mahsulotni qaysi ishga yollaydi' }, { b: 'Yollash', t: '— mahsulotni ishga olish; ish bajarilmasa «bo\'shatiladi»' }, { b: 'Funksional job', t: '— aniq amaliy vazifa' }, { b: 'Ijtimoiy job', t: '— boshqalar ko\'zida qanday ko\'rinish' }, { b: 'Emotsional job', t: '— o\'zini qanday his qilish' }, { b: 'Vaziyat', t: '— job yashaydigan kontekst (qachon, qayerda, nima uchun)' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Kashf bosqichi · 2/3" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.rocket(12)}</span> 2-dars tamom</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>ishni ko'rasiz</span> — mahsulotni emas.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Ajoyib! JTBD ko\'zingiz ochildi: zanjir, yollash, 3 tur, vaziyat. Portfolio 2-sahifasi muhrlandi. Keyingi dars — ov boshlanadi!' : 'Yaxshi harakat! JTBD — modulning eng muhim tafakkur asbobi. Darsni qayta ko\'rib mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i === 0 ? 'badge-next' : ''}`}>{i === 0 ? '🔜' : '🔒'} {b.t}<span className="badge-when">· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi darsda atrofingizdan <b style={{ color: T.honey }}>10 muammo</b> topsangiz — birinchi nishon sizniki!</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🕵️</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — job detektivi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Bugun biror narsa sotib olsangiz yoki ilova ochsangiz, o'zingizdan so'rang: «Men hozir buni qaysi ISHGA yolladim?» Keyingi dars: muammo radari — atrofdan 10 og'riq ovlaymiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson27({ lang: langProp, onFinished }) {
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

        /* === ARC STRIP (s1) === */
        .arc-strip { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .arc-chip { display: inline-flex; align-items: center; gap: 6px; background: ${T.paper}; border-radius: 99px; padding: 7px 12px; font-family: 'Manrope'; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .arc-t { font-weight: 700; font-size: 11.5px; color: ${T.ink}; }
        .arc-here { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.35); }
        .arc-you { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.05em; animation: you-pulse 1.8s ease-in-out infinite; }
        @keyframes you-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,79,40,0.45); } 50% { box-shadow: 0 0 0 5px rgba(255,79,40,0); } }
        .arc-sep { color: ${T.ink3}; font-size: 13px; }

        /* === ZANJIR / TIMELINE (s2) === */
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

        /* === SARALASH (s6) === */
        .sort-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; }
        .sort-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .sort-text { flex: 1; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; line-height: 1.4; }
        .sort-btns { display: inline-flex; gap: 5px; flex-shrink: 0; }
        .sort-btn { width: 34px; height: 30px; border: none; border-radius: 9px; background: ${T.bg}; font-size: 14px; cursor: pointer; transition: all 0.15s; }
        .sort-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.3); background: ${T.accentSoft}; }
        .sort-verdict { font-family: 'Manrope'; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; animation: feat-pop .3s cubic-bezier(.2,.7,.2,1); }

        /* === FOUNDER/JOB METER === */
        .fmeter-track { height: 10px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; }
        .fmeter-fill { height: 100%; background: linear-gradient(90deg, ${T.honey}, ${T.accent}); border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.45); }

        /* === LINZA/JOB TURI (s5) === */
        .lens-btn { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 12px; padding: 12px 14px; background: ${T.paper}; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .lens-btn:hover { transform: translateY(-1px); }
        .lens-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; }

        /* === DRILL (s8, s11) === */
        .drill-opt { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 10px; padding: 9px 12px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; text-align: left; }
        .drill-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -7px rgba(${T.shadowBase},0.22); }
        .drill-opt:disabled { cursor: default; }
        .drill-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .drill-no { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake 0.42s; }

        /* === MUHR (s15) === */
        .seal { position: absolute; bottom: 10px; right: 12px; padding: 5px 11px; border: 2.5px solid ${T.success}; border-radius: 8px; color: ${T.success}; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; transform: rotate(-7deg); background: rgba(255,255,255,0.78); animation: stamp-in 0.5s cubic-bezier(.2,.9,.3,1.4) 0.15s both; }

        /* === KONFETTI (s16) === */
        .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .cf { position: absolute; top: -14px; width: 8px; height: 13px; border-radius: 2px; opacity: 0; animation: cf-fall 2.8s ease-in forwards; }
        @keyframes cf-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(76vh) rotate(560deg); opacity: 0; } }

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
