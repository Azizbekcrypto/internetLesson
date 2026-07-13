import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · KOD/PROYEKT-AI — MVP v1: AI BILAN «VIBE CODING» — v16 (AUDIOSIZ)
// G'oya: AI bilan tez qur — lekin TUSHUNIB qur. Vibe coding + «tushuntir» darvozasi (Xitoy AI-qoidasi).
// Hook: Karpathy «vibe coding» (2025) — superkuch, lekin tushunmasdan qurish xavfi.
// Signature 1: Prompt-trenajyor (zaif → kuchli prompt, 4 qism).
// Signature 2: «Tushuntir» darvozasi (AI kod bloki — har qatorni izohlamaguncha qulf ochilmaydi).
// Signature 3: AI-kod tekshiruv checklisti (hardcode / .env / catch / analitika hodisasi).
// Yakuniy ish: BIRINCHI EKRAN spec — portfolio 9-sahifa (ekran + prompt + tushuntirish).
// Davomiylik: avtobus-tracker (99-arxitektura PERN + 100-hodisalar); Aziz case #8.
// AUDIOSIZ. PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  honey: '#E0892B', honeySoft: '#FBEFDD', grape: '#7B3FE4', grapeSoft: '#EFE9FB',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8', kw: '#C99BF5' };
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
  code: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M8 8l-4 4 4 4" /><path d="M16 8l4 4-4 4" /><path d="M13 6l-2 12" /></svg>),
  wand: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 19L16 8" /><path d="M18 4l.7 1.8L20.5 6.5 18.7 7.2 18 9l-.7-1.8L15.5 6.5l1.8-.7z" /><path d="M6 13l.5 1.3L7.8 15l-1.3.5L6 16.8 5.5 15.5 4.2 15l1.3-.5z" /></svg>),
  lock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>),
  unlock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></svg>),
  bug: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="8" y="7" width="8" height="12" rx="4" /><path d="M8 11H4M20 11h-4M8 15H4M20 15h-4M9 7l-2-3M15 7l2-3" /></svg>),
  gauge: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 14l4-4" /><path d="M4.5 18a9 9 0 1 1 15 0" /><circle cx="12" cy="14" r="1.4" /></svg>),
  loop: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" /><path d="M20 4v4h-4" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" /><path d="M4 20v-4h4" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>)
};

// ===== SYNTAX SPANLAR (kod ranglari) =====
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Kw = ({ children }) => <span style={{ color: CODE.kw }}>{children}</span>;
const Fn = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Pn = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;

const LESSON_META = { lessonId: 'mvp-build1-101-v16', lessonTitle: { uz: 'MVP v1: AI bilan vibe coding', ru: 'MVP v1: вайб-кодинг с ИИ' } };
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
const readProductName = () => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const arch = p.lesson99_architecture;
    if (arch && Array.isArray(arch.fields)) {
      const f = arch.fields.find(x => /nom/i.test(x.label || ''));
      if (f && f.value && f.value.trim()) return f.value.trim();
    }
  } catch { /* jim */ }
  return null;
};

// ===== KONSEPT LEKSIKONI =====
// s3/s5 — Prompt anatomiyasi (4 qism)
const PROMPT_PARTS = [
  { id: 'ctx', label: 'KONTEKST', ic: '🧭', color: T.blue, soft: T.blueSoft, text: 'React + Express (PERN) da avtobus-tracker MVP qilyapman.', why: 'AI vaziyatni bilsa — mos stekда, mos uslubda yozadi. Bilmasa — taxmin qiladi.' },
  { id: 'task', label: 'VAZIFA', ic: '🎯', color: T.accent, soft: T.accentSoft, text: 'Bitta ekran qil: foydalanuvchi maktab yo\'nalishini tanlaydi va avtobus necha daqiqada kelishini ko\'radi.', why: 'Aniq vazifa = aniq natija. «Sahifa qil» — juda umumiy, AI o\'zicha to\'qiydi.' },
  { id: 'lim', label: 'CHEKLOV', ic: '✂️', color: T.grape, soft: T.grapeSoft, text: 'Faqat 1 yo\'nalish, oddiy web-sahifa, ro\'yxatdan o\'tishsiz (98-dars MVP qarori).', why: 'Cheklovsiz AI ortiqcha narsa qo\'shadi. Chegara — MVP\'ni tor va tez qiladi.' },
  { id: 'ex', label: 'NAMUNA', ic: '🖼️', color: T.honey, soft: T.honeySoft, text: 'Ko\'rinishi: markazda katta raqam «7 daqiqa», ostida yo\'nalish nomi.', why: 'Namuna berish — AI\'ga «shunga o\'xshatib» deyish. Aniqlik keskin oshadi.' }
];

// s7 — «Tushuntir» darvozasi (AI kod qatorlari)
const GATE_LINES = [
  { id: 'g1', code: (<><Kw>const</Kw> [vaqt, setVaqt] = <Fn>useState</Fn>(<Kw>null</Kw>)</>),
    opts: ['Avtobus vaqtini saqlaydigan xotira (holat)', 'Sahifa rangini o\'zgartiradi', 'Serverga rasm yuboradi'], correct: 0,
    why: 'useState — komponent xotirasi: avtobus vaqti shu yerda turadi, o\'zgarganda ekran avtomatik yangilanadi.' },
  { id: 'g2', code: (<><Fn>useEffect</Fn>(() <Pn>=&gt;</Pn> {'{'} <Fn>fetch</Fn>(url) {'}'}, [])</>),
    opts: ['Har soniyada rangni almashtiradi', 'Ochilganda BIR marta serverdan ma\'lumot oladi', 'Foydalanuvchini o\'chiradi'], correct: 1,
    why: 'useEffect bo\'sh [] bilan — sahifa ochilganda faqat bir marta ishlaydi: serverdan avtobus vaqtini so\'raydi.' },
  { id: 'g3', code: (<><Fn>track</Fn>(<St>'avtobus_tekshirildi'</St>)</>),
    opts: ['Analitika hodisasini yozadi (100-dars!)', 'Avtobusni to\'xtatadi', 'Kodni o\'chiradi'], correct: 0,
    why: 'Bu — 100-darsdagi hodisa! Core job bajarilganini analitikaga yozadi. AI buni ko\'pincha unutadi — o\'zingiz qo\'shasiz.' },
  { id: 'g4', code: (<>{'{'}vaqt <Pn>?</Pn> <St>`${'{'}vaqt{'}'} daqiqa`</St> <Pn>:</Pn> <St>'Yuklanmoqda...'</St>{'}'}</>),
    opts: ['Doim bo\'sh ekran ko\'rsatadi', 'Vaqt kelgan bo\'lsa ko\'rsatadi, aks holda «Yuklanmoqda»', 'Xato chiqaradi'], correct: 1,
    why: 'Shartli ko\'rsatish: ma\'lumot kelmaguncha «Yuklanmoqda», kelgach — vaqt. Yaxshi UX shundan boshlanadi.' }
];

// s10 — AI-kod tekshiruv checklisti (xatoni top)
const REVIEW_DRILL = [
  { id: 'r1', code: (<><Kw>const</Kw> API_KEY = <St>"sk-abc123xyz..."</St></>), emoji: '🔑', color: T.accent,
    opts: ['Muammo yo\'q', 'Maxfiy kalit kodда ochiq — .env ga ko\'chirish kerak (45-dars!)', 'Rang noto\'g\'ri'], correct: 1,
    why: 'AI ko\'pincha kalitni to\'g\'ridan-to\'g\'ri yozadi. Xavfli! .env ga ko\'chiring — 4-moduldan bilamiz.' },
  { id: 'r2', code: (<><Fn>fetch</Fn>(url).<Fn>then</Fn>(r <Pn>=&gt;</Pn> r.<Fn>json</Fn>()) <Cm>// catch yo'q</Cm></>), emoji: '💥', color: T.honey,
    opts: ['Xatolik ushlanmagan — internet uzilса ilova sinadi (oq ekran)', 'Muammo yo\'q', 'Juda tez ishlaydi'], correct: 0,
    why: 'AI ko\'pincha «baxtli yo\'l»ni yozadi. Xato bo\'lsa? .catch() qo\'shing — aks holda oq ekran (buzilish detektivi, 99!).' },
  { id: 'r3', code: (<><Kw>const</Kw> daqiqa = <St>7</St> <Cm>// qotirib qo'yilgan</Cm></>), emoji: '📌', color: T.blue,
    opts: ['Muammo yo\'q, 7 zo\'r', 'Qiymat hardcode — hamma uchun DOIM «7» ko\'rinadi, serverdan kelmaydi', 'Rang xato'], correct: 1,
    why: 'Hardcode: AI demo uchun 7 yozgan. Real ilovada serverdan kelishi kerak — aks holda soxta, o\'zgarmas ma\'lumot.' },
  { id: 'r4', code: (<><Cm>// tugma bosildi, lekin track() yo'q</Cm></>), emoji: '📊', color: T.grape,
    opts: ['track() chaqiruvi yo\'q — 100-darsdagi hodisani qo\'shish kerak', 'Muammo yo\'q', 'Juda ko\'p kod'], correct: 0,
    why: 'AI analitikani o\'zi bilmaydi. track(\'avtobus_tekshirildi\') qo\'shmasangiz — ilova ishlaydi, lekin siz KO\'R qolasiz.' }
];

// s11 — iteratsiya sikli
const LOOP_STEPS = [
  { id: 'l1', t: 'PROMPT', d: 'Aniq so\'rov: kontekst + vazifa + cheklov + namuna.', color: T.accent },
  { id: 'l2', t: 'KOD', d: 'AI kod yozadi — birinchi urinish kamdan-kam mukammal.', color: T.grape },
  { id: 'l3', t: 'TUSHUN', d: 'Har qatorni o\'qib, o\'z so\'zingiz bilan izohlang.', color: T.blue },
  { id: 'l4', t: 'TEKSHIR', d: 'Checklist: hardcode? catch? .env? analitika hodisasi?', color: T.honey },
  { id: 'l5', t: 'QAYTA', d: 'Aniq muammoni ayting: «catch qo\'sh», «kalitni .env ga ol». Sikl davom etadi.', color: T.success }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// s15 — Birinchi ekran spec (portfolio 9-sahifa)
const BUILD_FIELDS = [
  { key: 'screen', label: 'Qaysi ekranni qurdim', emoji: '🖥️', color: T.accent, min: 6, hint: 'Masalan: avtobus vaqti ekrani' },
  { key: 'prompt', label: 'Ishlatgan prompt (qisqacha)', emoji: '🪄', color: T.grape, min: 12, hint: 'Kontekst + vazifa + cheklov + namuna' },
  { key: 'el1', label: 'Asosiy element 1', emoji: '🔹', color: T.blue, min: 3, hint: 'Yo\'nalish tanlash' },
  { key: 'el2', label: 'Asosiy element 2', emoji: '🔹', color: T.blue, min: 3, hint: 'Katta «7 daqiqa» raqami' },
  { key: 'el3', label: 'Asosiy element 3', emoji: '🔹', color: T.blue, min: 3, hint: '«Yuklanmoqda» holati' },
  { key: 'event', label: 'Ulangan analitika hodisasi (100-dars)', emoji: '📊', color: T.honey, min: 4, hint: 'avtobus_tekshirildi' },
  { key: 'understand', label: 'Bitta qatorni O\'Z so\'zingiz bilan izohlang', emoji: '💡', color: T.success, min: 12, hint: 'useEffect([]) sahifa ochilganda bir marta serverdan ma\'lumot oladi...' }
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

// Kod kartochkasi (terminal uslub)
const CodeCard = ({ file, children }) => (
  <div className="spec-card">
    <div className="code-file"><span className="cdot" style={{ background: '#FF605C' }} /><span className="cdot" style={{ background: '#FFBD44' }} /><span className="cdot" style={{ background: '#00CA4E' }} /><span className="code-name">{file}</span></div>
    <pre className="code-pre">{children}</pre>
  </div>
);

// Birinchi ekran spec hujjati (s15)
const BuildDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.code(16)}</span><span>Birinchi ekran · 9-sahifa</span></div>
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
          {i < 2 && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(11)}</span>}
          {i === 2 && <span className="arc-you">3/6</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: VIBE CODING =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'AI juda sekin — kutish kerak' },
    { id: 'b', label: 'Tez qurasan, lekin kodni TUSHUNMASANG — buzilganda tuzatolmaysan' },
    { id: 'c', label: 'AI juda ko\'p pul turadi' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Qur bosqichi" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>«Kodni unut, faqat <span className="italic" style={{ color: T.accent }}>vibega beril</span>»</h1>
        <Mentor>Analitika rejasi tayyor (100-dars). Endi haqiqiy narsa: birinchi ishlaydigan ekranni AI bilan quramiz. Lekin bitta muhim qoida bilan.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>🤖 2025 · YANGI DAVR</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Andrej Karpathy (AI dunyosining eng mashhur muhandislaridan) yangi atama o'ylab topdi: <b>«vibe coding»</b> — «kod borligini unut, faqat vibega beril, AI yozadi».</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Bir haftada internet portladi: minglab odam umrida kod yozmasdan ilova qurdi. Superkuch! Lekin tajribalilar bitta yashirin xavfni ko'rdi…</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Yashirin xavf nima?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : ''}Vibe coding — haqiqiy superkuch: g'oyani soatlar ichida ekranga aylantirasiz. Lekin <b>AI yozgan kodni tushunmasangiz</b>, u buzilganda ojiz qolasiz — na tuzata olasiz, na kengaytira olasiz. Shuning uchun bugun bitta qoida bilan quramiz: <b>«tushuntir» darvozasi</b> — har AI-koddan keyin uni o'z so'zingiz bilan izohlaysiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Prompt anatomiyasi: kontekst + vazifa + cheklov + namuna', tag: '' },
    { text: 'Prompt-trenajyor: zaif → kuchli', tag: 'o\'yin' },
    { text: 'AI-kodni o\'qish + «tushuntir» darvozasi', tag: 'o\'yin' },
    { text: 'AI-kod tekshiruv checklisti', tag: 'o\'yin' },
    { text: 'BIRINCHI EKRAN spec — portfolio 9-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.wand(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>AI bilan tez — lekin tushunib</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Birinchi ishlaydigan ekran. Vibe coding kuchi + «tushuntir» darvozasi intizomi.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Qur bosqichi · 3-dars (kod). Keyingisi: dizayn 🎨</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Vibe coding: <span className="italic" style={{ color: T.accent }}>kuch + intizom</span></h2></div>
        <Mentor>AI kod yozadi — lekin siz <b style={{ color: T.ink }}>kapitan</b>siz. Bugun ikki mahoratni o'rganamiz: AI'ga <b style={{ color: T.ink }}>aniq buyruq</b> berish (prompt) va uning javobini <b style={{ color: T.ink }}>tekshirib, tushunib</b> qabul qilish.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — VIBE CODING NIMA (WHAT vs HOW) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('old');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['old', 'vibe']) : new Set(['old']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isOld = v === 'old';
  return (
    <Stage eyebrow="Vibe coding" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala usulni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Siz <span className="italic" style={{ color: T.accent }}>NIMA</span> kerakligini aytasiz — AI <span className="italic" style={{ color: T.grape }}>QANDAY</span>ni yozadi</h2></div>
        <Mentor>Vibe coding — fikrlash darajasini ko'taradi: har vergul o'rniga <b style={{ color: T.ink }}>niyat</b> bilan ishlaysiz. Ikki usulni solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isOld ? 'chip-on' : ''}`} onClick={() => set('old')}>⌨️ Eski usul</button>
              <button className={`chip ${!isOld ? 'chip-on' : ''}`} onClick={() => set('vibe')}>🪄 Vibe coding</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isOld ? T.ink2 : T.grape}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isOld
                ? 'Har bir qatorni o\'zingiz yozasiz: sintaksis, qavslar, nuqta-vergul... 100 qator kod = 100 marta xato qilish imkoni. Sekin, lekin har qatorni bilasiz.'
                : 'AI\'ga niyatingizni aytasiz: «avtobus vaqti ekranini qil». U 100 qatorni soniyalarда yozadi. Tez va kuchli — LEKIN u yozgan narsani tushunmasangiz, egasi emas, sayohatchisiz.'}</p>
            </div>
          </Col>
          <Col>
            {isOld
              ? <div className="frame-warn fade-step" key="o"><p className="body" style={{ margin: 0, color: T.ink }}>Eski usul yomon emas — lekin MVP tezligida raqobatlashib bo'lmaydi. Bugun founderlar g'oyani bir kunda sinaydi.</p></div>
              : <div className="frame-success fade-step" key="v"><p className="body" style={{ margin: 0, color: T.ink }}>Vibe coding kuchi haqiqiy. Lekin kapitan siz: AI — kuchli dvigatel, yo'nalishni SIZ belgilaysiz va asboblarni SIZ o'qiysiz.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kalit farq: eski usulда tushunish MAJBUR edi (yozolmasang, ishlamaydi). Vibe coding'да tushunish IXTIYORIY bo'lib qoladi — va aynan shu tuzoq. Biz tushunishni majburiy qilamiz: «tushuntir» darvozasi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — PROMPT ANATOMIYASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PROMPT_PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? PROMPT_PARTS[0].id : null);
  const done = seen.size >= PROMPT_PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? PROMPT_PARTS.find(p => p.id === active) : null;
  return (
    <Stage eyebrow="Prompt anatomiyasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 qismni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi prompt — <span className="italic" style={{ color: T.accent }}>4 qismdan</span></h2></div>
        <Mentor>AI'ga «sahifa qil» deyish — ovqatga «biror narsa qil» deyishdek. Aniq buyruq 4 qismdan iborat. Har birini oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROMPT_PARTS.map(p => { const on = seen.has(p.id); return (
                <button key={p.id} className={`plink ${active === p.id ? 'plink-on' : ''}`} onClick={() => tap(p.id)}>
                  <span style={{ fontSize: 18, minWidth: 24 }}>{p.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label" style={{ color: p.color }}>{p.label}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ochish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}>
              <span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.ic} {cur.label}</span>
              <div className="frame" style={{ marginTop: 11, padding: '11px 13px', background: T.bg, boxShadow: 'none' }}><p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>«{cur.text}»</p></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink2, margin: '11px 0 0', lineHeight: 1.55 }}>{cur.why}</p>
            </div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rttasi birga: <b>Kontekst + Vazifa + Cheklov + Namuna</b>. Shu 4 qism bo'lsa — AI taxmin qilmaydi, aniq siz istagan narsani yozadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Yaxshi promptni nima kuchli qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kuchli promptда <span className="italic" style={{ color: T.accent }}>nima bo'ladi</span>?</h2></>}
    options={['«Zo\'r sahifa qil» — qisqa va umumiy', 'Kontekst + aniq vazifa + cheklov + namuna', 'Iloji boricha ko\'proq so\'z', 'Faqat texnik atamalar']} correctIdx={1}
    explainCorrect="To'g'ri! Kuchli prompt = 4 qism: vaziyat (kontekst), aniq vazifa, chegara (cheklov) va namuna. Shunda AI taxmin qilmaydi — aynan kerakli narsani yozadi."
    explainWrong={{ 0: '«Zo\'r sahifa» — AI o\'zicha to\'qiydi, sizga kerak bo\'lmagan narsa chiqadi.', 2: 'Ko\'p so\'z ≠ aniq so\'z. Muhimi — 4 qism to\'liqligi.', 3: 'Texnik atama shart emas — aniqlik va cheklov muhim.', default: '4 qism: kontekst + vazifa + cheklov + namuna.' }} />
);

// ===== SCREEN 5 — PROMPT-TRENAJYOR (SIGNATURE 1) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(() => storedAnswer ? new Set(PROMPT_PARTS.map(p => p.id)) : new Set());
  const workRef = useRef(null);
  const count = added.size;
  const done = count >= PROMPT_PARTS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const add = (id) => setAdded(prev => { if (prev.has(id)) return prev; const n = new Set(prev); n.add(id); return n; });
  const quality = Math.round((count / PROMPT_PARTS.length) * 100);
  return (
    <Stage eyebrow="Prompt-trenajyor · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Promptni kuchaytiring (${count}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Zaif promptni <span className="italic" style={{ color: T.accent }}>kuchli</span>ga aylantiring</h2></div>
        <Mentor>Zaif prompt: «<i>avtobus sahifa qil</i>». 4 qismni birma-bir qo'shing va o'ng tomonda sifat o'lchagichini kuzating.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">Qismlarni qo'shing</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROMPT_PARTS.map(p => { const on = added.has(p.id); return (
                <button key={p.id} className={`sort-card ${on ? 'sort-ok' : ''}`} onClick={() => add(p.id)} style={{ cursor: on ? 'default' : 'pointer', width: '100%', textAlign: 'left' }}>
                  <span style={{ fontSize: 17 }}>{p.ic}</span>
                  <span className="sort-text"><b style={{ color: p.color }}>{p.label}</b> — {p.text}</span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> : <span className="plink-act" style={{ color: p.color }}>+ qo'sh</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🪄 Prompt sifati</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{quality}%</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${quality}%`, background: done ? T.success : undefined }} /></div>
            </div>
            <CodeCard file="prompt.txt">
              {count === 0
                ? <span style={{ color: CODE.comment }}>avtobus sahifa qil</span>
                : PROMPT_PARTS.filter(p => added.has(p.id)).map(p => (<div key={p.id} className="fade-step"><span style={{ color: CODE.punct }}>[{p.label}] </span><span style={{ color: CODE.text }}>{p.text}</span></div>))}
            </CodeCard>
            {!done && count > 0 && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>{count}/4 qism. AI hali taxmin qiladi — qolganini qo'shing.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Farqni his qildingizmi? Zaif prompt → AI umumiy, noto'g'ri sahifa to'qiydi. Kuchli prompt → AI aynan avtobus-tracker ekranini yozadi. <b>Prompt sifati = kod sifati.</b></p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="AI kutilmagan, noto'g'ri sahifa yozsa — birinchi sabab nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI <span className="italic" style={{ color: T.accent }}>noto'g'ri</span> yozsa — birinchi tekshiring?</h2></>}
    options={['AI yomon — boshqasiga o\'ting', 'Promptingiz zaif bo\'lgan — kontekst/cheklov/namuna yetishmagan', 'Kompyuter sekin', 'Internet uzilgan']} correctIdx={1}
    explainCorrect="To'g'ri! Ko'pincha ayb AI'da emas — zaif promptда. Aniqroq kontekst, cheklov va namuna bering — natija keskin yaxshilanadi. «Axlat kirsa — axlat chiqadi»."
    explainWrong={{ 0: 'AI\'ni almashtirish oldin — promptni kuchaytiring; ko\'pincha muammo shu.', 2: 'Tezlik masalasi emas — aniqlik masalasi.', 3: 'Internet emas — buyruq aniqligi.', default: 'Avval promptni kuchaytiring: kontekst + cheklov + namuna.' }} />
);

// ===== SCREEN 6 — AI-KODNI O'QISH =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  return (
    <Stage eyebrow="AI-kodni o'qish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Kodni ko\'rib chiqing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI javob berdi. <span className="italic" style={{ color: T.accent }}>Endi o'qiymiz.</span></h2></div>
        <Mentor>Kuchli promptdan AI shu kodni yozdi — avtobus vaqti ekrani. Qo'rqmang: har qatorni oddiy so'z bilan tushunish mumkin. Keyingi ekranда har qatorni izohlaysiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeCard file="AvtobusEkrani.jsx">
              <div><Kw>function</Kw> <Fn>AvtobusEkrani</Fn>() {'{'}</div>
              <div>{'  '}<Kw>const</Kw> [vaqt, setVaqt] = <Fn>useState</Fn>(<Kw>null</Kw>)</div>
              <div>{'  '}<Fn>useEffect</Fn>(() <Pn>=&gt;</Pn> {'{'}</div>
              <div>{'    '}<Fn>fetch</Fn>(<St>'/api/avtobus/12'</St>)</div>
              <div>{'      '}.<Fn>then</Fn>(r <Pn>=&gt;</Pn> r.<Fn>json</Fn>())</div>
              <div>{'      '}.<Fn>then</Fn>(d <Pn>=&gt;</Pn> <Fn>setVaqt</Fn>(d.daqiqa))</div>
              <div>{'  '}{'}'}, [])</div>
              <div>{'  '}<Fn>track</Fn>(<St>'avtobus_tekshirildi'</St>)</div>
              <div>{'  '}<Kw>return</Kw> <Pn>&lt;</Pn><Pn>div&gt;</Pn>{'{'}vaqt <Pn>?</Pn> <St>`${'{'}vaqt{'}'} daqiqa`</St> <Pn>:</Pn> <St>'Yuklanmoqda...'</St>{'}'}<Pn>&lt;/div&gt;</Pn></div>
              <div>{'}'}</div>
            </CodeCard>
          </Col>
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="note-h" style={{ color: T.grape }}>🔍 Kod qo'rqinchli emas</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Har qator — bitta oddiy ish: xotira ochish, serverdan so'rash, hodisani yozish, ekranга chiqarish. Ingliz tili + biroz belgilar, xolos.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Kodni tushundim — davom</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>E'tibor bering: AI <b>track('avtobus_tekshirildi')</b> ni ham yozibdi — bu 100-darsdagi hodisa! (Odatda AI buni unutadi; bu safar promptда aytilgan.) Endi darvoza: har qatorni izohlang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — «TUSHUNTIR» DARVOZASI (SIGNATURE 2) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(GATE_LINES.map(g => [g.id, g.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = GATE_LINES.filter(g => picked[g.id] === g.correct).length;
  const done = okCount >= GATE_LINES.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (g, i) => {
    if (picked[g.id] === g.correct) return;
    setPicked(prev => ({ ...prev, [g.id]: i }));
    setWrong(prev => ({ ...prev, [g.id]: i !== g.correct }));
  };
  return (
    <Stage eyebrow="«Tushuntir» darvozasi · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Darvoza ochildi →' : `Har qatorni izohlang (${okCount}/${GATE_LINES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">
          <span style={{ display: 'inline-flex', verticalAlign: 'middle', color: done ? T.success : T.accent, marginRight: 8 }}>{done ? Ico.unlock(26) : Ico.lock(26)}</span>
          {done ? <>Darvoza <span className="italic" style={{ color: T.success }}>ochildi</span></> : <>Har qator nima qiladi? <span className="italic" style={{ color: T.accent }}>Izohlamaguncha oldinga o'tolmaysiz</span></>}
        </h2></div>
        <Mentor>Bu — <b style={{ color: T.ink }}>Xitoy AI-maktablari qoidasi</b>: AI kod yozdi-yu, sen uni tushunmasang — o'tolmaysan. Har qatorni to'g'ri vazifasiga ulang. Xato — qayta urinasiz.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {GATE_LINES.map(g => {
            const p = picked[g.id];
            const solved = p === g.correct;
            return (
              <div key={g.id} className="frame" style={{ padding: 'clamp(12px,2vw,16px)', borderLeft: `4px solid ${solved ? T.success : T.grape}` }}>
                <div className="code-inline">{g.code}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  {g.opts.map((o, i) => {
                    let cls = 'drill-opt';
                    if (solved && i === g.correct) cls += ' drill-ok';
                    else if (!solved && p === i && wrong[g.id]) cls += ' drill-no';
                    return (<button key={i} className={cls} disabled={solved} onClick={() => pick(g, i)}><span className="mono small" style={{ minWidth: 16, color: T.ink3 }}>{String.fromCharCode(65 + i)}</span><span style={{ flex: 1 }}>{o}</span>{solved && i === g.correct && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>);
                  })}
                </div>
                {solved && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.success, fontWeight: 600 }}>✓ {g.why}</p>}
                {!solved && p !== undefined && wrong[g.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Qaytadan o'ylang — kod nimani BAJARADI?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi bu kod SIZniki: har qatorini tushunasiz. Buzilса — qayerni ochishni bilasiz; kengaytirmoqchi bo'lsangiz — qayerga qo'shishni bilasiz. Mana shu — vibe coding'ni xavfsiz qiladigan darvoza.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — NEGA DARVOZA KERAK =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('blind');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['blind', 'own']) : new Set(['blind']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isBlind = v === 'blind';
  return (
    <Stage eyebrow="Nega tushunish shart" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala yo\'lni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ikki founder, <span className="italic" style={{ color: T.accent }}>bir xil AI</span></h2></div>
        <Mentor>Ikkalasi ham AI bilan tez qurdi. Farq bittada: birinchisi kodni tushunmadi, ikkinchisi darvozadan o'tdi. Bir oydan keyin nima bo'ladi?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isBlind ? 'chip-on' : ''}`} onClick={() => set('blind')}>🙈 Ko'r-ko'rona</button>
              <button className={`chip ${!isBlind ? 'chip-on' : ''}`} onClick={() => set('own')}>🧠 Tushunib</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isBlind ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isBlind
                ? 'Ilova buzildi — oq ekran. Founder kodni o\'qimagan, hech narsa tushunmaydi. AI\'ga «tuzat» deydi — AI boshqa joyni buzadi. Aylanib, aylanib... loyiha to\'xtaydi. Har buzilish — halokat.'
                : 'Ilova buzildi. Founder buzilish detektivini ishlatadi (99-dars): «bu — fetch qatori, catch yo\'q ekan». AI\'ga ANIQ aytadi: «fetch\'ga catch qo\'sh». 2 daqiqada tuzaladi. Nazorat — undа.'}</p>
            </div>
          </Col>
          <Col>
            {isBlind
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'r-ko'rona vibe coding = qum ustiga qurish. Tez ko'tariladi, birinchi shamolda quladi. Tushunmasangiz — AI ham sizga yordam berolmaydi (chunki muammoni aniq ayta olmaysiz).</p></div>
              : <div className="frame-success fade-step" key="o"><p className="body" style={{ margin: 0, color: T.ink }}>Tushunish = nazorat. AI dvigatel, siz kapitan. Darvoza sekinlashtirmaydi — u sizni buzilishlarga tayyorlaydi. Aslida TEZROQ chiqasiz.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: <b>AI kodini o'z so'zingiz bilan izohlay olmasangiz — u hali SIZniki emas.</b> Izohlang, keyin qabul qiling. Bu 30 soniya — lekin loyihangizni saqlaydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="«Tushuntir» darvozasi nima uchun kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>«Tushuntir» darvozasi <span className="italic" style={{ color: T.accent }}>nima beradi</span>?</h2></>}
    options={['Kodni chiroyliroq qiladi', 'AI kodini tushunib qabul qilasiz — buzilса o\'zingiz tuzatasiz, aniq so\'rov bera olasiz', 'AI\'ni tezlashtiradi', 'Kodni qisqartiradi']} correctIdx={1}
    explainCorrect="To'g'ri! Darvoza — tushunishni majburiy qiladi. Tushunsangiz: buzilganda tuzatasiz, kengaytirasiz va AI'ga ANIQ muammoni aytasiz. Tushunmasangiz — har buzilish halokat."
    explainWrong={{ 0: 'Chiroy emas — NAZORAT. Tushunish sizga boshqaruvni beradi.', 2: 'AI tezligiga aloqasi yo\'q — SIZning tushunchangizga.', 3: 'Qisqartirmaydi — tushuntiradi.', default: 'Tushunish = nazorat: tuzatish, kengaytirish, aniq so\'rov.' }} />
);

// ===== SCREEN 10 — AI-KOD TEKSHIRUV CHECKLISTI (SIGNATURE 3) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(REVIEW_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = REVIEW_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= REVIEW_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="AI-kod tekshiruvi · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Xatolarni toping (${okCount}/${REVIEW_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span style={{ display: 'inline-flex', verticalAlign: 'middle', color: T.accent, marginRight: 8 }}>{Ico.bug(24)}</span>AI xato qiladi. <span className="italic" style={{ color: T.accent }}>Toping.</span></h2></div>
        <Mentor>AI aqlli, lekin beparvo: kalitni ochiq qoldiradi, xatolikni unutadi, qiymatni qotirib qo'yadi. Har kod parchasini tekshiring — muammo qayerda?</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {REVIEW_DRILL.map(d => {
            const p = picked[d.id];
            const solved = p === d.correct;
            return (
              <div key={d.id} className="frame" style={{ padding: 'clamp(12px,2vw,16px)', borderLeft: `4px solid ${solved ? T.success : d.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}><span style={{ fontSize: 17 }}>{d.emoji}</span><div className="code-inline" style={{ flex: 1 }}>{d.code}</div></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {d.opts.map((o, i) => {
                    let cls = 'drill-opt';
                    if (solved && i === d.correct) cls += ' drill-ok';
                    else if (!solved && p === i && wrong[d.id]) cls += ' drill-no';
                    return (<button key={i} className={cls} disabled={solved} onClick={() => pick(d, i)}><span className="mono small" style={{ minWidth: 16, color: T.ink3 }}>{String.fromCharCode(65 + i)}</span><span style={{ flex: 1 }}>{o}</span>{solved && i === d.correct && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>);
                  })}
                </div>
                {solved && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.success, fontWeight: 600 }}>✓ {d.why}</p>}
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Diqqat bilan qarang — nima yetishmayapti yoki xavfli?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 klassik AI-xato: <b>ochiq kalit</b> (.env!) · <b>catch yo'q</b> · <b>hardcode qiymat</b> · <b>analitika hodisasi yo'q</b>. Har AI-koddan keyin shu 4 ni tekshiring — checklist tayyor.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ITERATSIYA SIKLI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(LOOP_STEPS.map(s => s.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? LOOP_STEPS[0].id : null);
  const done = seen.size >= LOOP_STEPS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? LOOP_STEPS.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="Iteratsiya sikli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni ko'ring (${seen.size}/${LOOP_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi urinish kamdan-kam mukammal — <span className="italic" style={{ color: T.accent }}>sikl aylanadi</span></h2></div>
        <Mentor>Vibe coding — bir marta emas, DOIRA: prompt → kod → tushun → tekshir → qayta prompt. Har aylanish yaxshiroq qiladi. 5 qadamni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {LOOP_STEPS.map((s, i) => { const on = seen.has(s.id); return (
                <React.Fragment key={s.id}>
                  <button className={`plink ${active === s.id ? 'plink-on' : ''}`} onClick={() => tap(s.id)}>
                    <span className="loop-badge" style={{ background: on ? s.color : T.bg, color: on ? '#fff' : T.ink3 }}>{i + 1}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label" style={{ color: on ? s.color : T.ink }}>{s.t}</span></span>
                    {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ko'rish</span>}
                  </button>
                  {i < LOOP_STEPS.length - 1 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 12, lineHeight: 1 }}>↓</span>}
                </React.Fragment>
              ); })}
              <div style={{ textAlign: 'center', color: T.grape, fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><span style={{ display: 'inline-flex' }}>{Ico.loop(14)}</span> qayta boshga</div>
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: `${cur.color}1A` }}>{cur.t}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qadamni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muhim: <b>«qayta»</b> qadamda AI'ga ANIQ ayting — «catch qo'sh», «kalitni .env ga ol». Umumiy «tuzat» emas. Aniq so'rov = aniq tuzatish. Bu tushunishдан keladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="AI kodida qaysi 4 narsani doim tekshirasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI-kod <span className="italic" style={{ color: T.accent }}>tekshiruv checklisti</span>?</h2></>}
    options={['Rang, shrift, animatsiya, emoji', 'Ochiq kalit (.env), xatolik ushlash (catch), hardcode qiymat, analitika hodisasi', 'Fayl nomi, papka, sana, versiya', 'Faqat kod chiroylimi']} correctIdx={1}
    explainCorrect="To'g'ri! 4 klassik AI-xato: maxfiy kalit ochiq qolgani (.env ga!), xatolik ushlanmagani (catch), qiymat qotirib qo'yilgani (hardcode) va analitika hodisasi yo'qligi (track). Har AI-koddan keyin shu 4 ni tekshiring."
    explainWrong={{ 0: 'Bular bezak — xavfsizlik va ishonchlilik emas.', 2: 'Fayl tartibi muhim, lekin bu — kod xatolari checklisti emas.', 3: 'Chiroy emas — xavfsizlik, xato, hardcode, analitika.', default: '.env · catch · hardcode · analitika hodisasi.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #8 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«AI\'ga butun ilovani boshidan qayta yozdir — balki bu safar buzilmaydi»' },
    { id: 1, t: '«Avval kodni O\'QI: har qatorni izohla. Muammo qayerdaligini top, keyin AI\'ga ANIQ ayt: falon qatorni tuzat»' },
    { id: 2, t: '«O\'sha fichadan voz kech, ishlaydiganini qoldir»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«AI bilan qurdim, endi buzildi — nima qilay?!»</span></h2></div>
        <Mentor>Aziz vibe coding bilan tez ekran qurdi (qoyil!). Lekin kodni o'qimadi. Endi ilova buzildi va u boshi berk ko'chada…</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«Bir soatда AI 300 qator kod yozib berdi — ishladi! Zo'r! Lekin bugun oq ekran chiqyapti. AI'ga 10 marta "tuzat" dedim — har safar boshqa joyi buzilyapti. Kodni umuman tushunmayman. Nima qilay?»</p>
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
            ? 'Azizning aslida bitta muammosi bor: u darvozadan o\'tmagan. AI\'ga «tuzat» deb aylanish — ko\'r-ko\'rona. Yechim: kodni o\'qib, har qatorni izohlash. Shunda «voy, fetch\'da catch yo\'q ekan» degan aniq muammo topiladi — va AI\'ga aniq buyruq beriladi. Tushunish — AI\'ni foydali qiladi.'
            : (picked === 0 ? 'Qaytadan yozdirish — o\'sha muammoni yana yaratadi. Aziz baribir tushunmaydi, keyingi buzilishda yana shu holat.' : 'Voz kechish — taslim bo\'lish. Muammo fichada emas — Azizning kodni tushunmasligida. Uni bitta marta hal qilса, hamma ficha ochiladi.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Birinchi ekranga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Vibe coding qoidasi: <span className="italic" style={{ color: T.accent }}>AI yozadi — siz TUSHUNASIZ</span></h2></div>
      <Mentor>Amaliyotdan oldin kompas. 4 qoida — keyin birinchi ekraningizni yozasiz.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🧭</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — kapitan</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>AI — kuchli dvigatel. Yo'nalishni siz belgilaysiz, asboblarni siz o'qiysiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.wand(18), c: T.grape, t: 'PROMPT — kontekst + vazifa + cheklov + namuna' }, { ic: Ico.lock(18), c: T.accent, t: 'DARVOZA — izohlay olmasang, u hali SENIKI emas' }, { ic: Ico.bug(18), c: T.honey, t: 'TEKSHIR — .env · catch · hardcode · analitika hodisasi' }, { ic: Ico.loop(18), c: T.success, t: 'ITERATSIYA — aniq so\'rov bilan qayta-qayta yaxshila' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: BIRINCHI EKRAN SPEC =====
const emptyBuild = () => Object.fromEntries(BUILD_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyBuild());
  const productName = useRef(readProductName()).current;
  const isComplete = (k) => data[k].trim().length >= (BUILD_FIELDS.find(f => f.key === k)?.min ?? 4);
  const completeCount = BUILD_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= BUILD_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson101_mvp_v1', { title: 'MVP v1 — birinchi ekran', fields: BUILD_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = BUILD_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' (')[0], color: f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · birinchi ekran" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${BUILD_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">BIRINCHI EKRAN: <span className="italic" style={{ color: T.accent }}>portfolio 9-sahifa</span></h2></div>
        <Mentor>O'Z MVP'ingizning birinchi ekranini rejalashtiring{productName ? <> (mahsulotingiz: <b style={{ color: T.ink }}>{productName}</b>)</> : ''}. Misollar avtobus-loyihadan. Oxirgi maydon — «tushuntir» darvozangiz: bitta qatorni O'Z so'zingiz bilan izohlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {BUILD_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Ekran spesifikatsiyangiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — spec shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><BuildDoc rows={docRows} />{passed && <span className="seal">EKRAN TAYYOR ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi ishlaydigan ekran rejalashtirildi — va siz uni TUSHUNASIZ. Keyingi darsda mahsulotni chiroyli qilamiz: dizayn va «nasmotrennost». 🎨</p></div>}
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
  { t: 'Quruvchi', l: '103-dars' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Prompt anatomiyasi: kontekst + vazifa + cheklov + namuna', '«Tushuntir» darvozasi: izohlay olmasang, kod hali seniki emas', 'AI xato qiladi: .env · catch · hardcode · analitika hodisasi', 'Iteratsiya sikli: aniq so\'rov bilan qayta-qayta yaxshila'];
  const GLOSSARY = [{ b: 'Vibe coding', t: '— niyatni aytib, AI\'ga kod yozdirish' }, { b: 'Prompt', t: '— AI\'ga aniq buyruq (4 qism)' }, { b: '«Tushuntir» darvozasi', t: '— kodni izohlamaguncha oldinga o\'tmaslik' }, { b: 'Hardcode', t: '— qiymatni kodга qotirib qo\'yish' }, { b: '.env', t: '— maxfiy kalitlar joyi (kodда emas)' }, { b: 'catch', t: '— xatolikni ushlash; oq ekrandan saqlaydi' }, { b: 'Iteratsiya', t: '— prompt → kod → tushun → tekshir → qayta' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Qur bosqichi · 3/6 tamom" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.code(12)}</span> Birinchi ekran qurildi</span><h2 className="title h-title fade-up d1">AI bilan qurdingiz — <span className="italic" style={{ color: T.accent }}>va tushundingiz.</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Vibe coding kuchini «tushuntir» darvozasi intizomi bilan birlashtirdingiz: aniq prompt, tushunilgan kod, tekshirilgan xatolar. Endi MVP\'ingizning birinchi ekrani bor. Keyingi darsda uni chiroyli qilamiz — dizayn va nasmotrennost.' : 'Yaxshi harakat! Keyingi ekranга o\'tishdan oldin prompt va darvoza qoidalarini mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 1 ? 'badge-done' : ''} ${i === 2 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔨' : (i === 3 ? '🧪' : '👑')))} {b.t}<span className="badge-when" style={i <= 1 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi nishon — <b style={{ color: T.honey }}>🔨 Quruvchi</b>: MVP'ingiz to'liq ishlaganda (103-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🪄</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — darvozadan o'tkazing</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>AI'dan (Cursor / Claude / v0) birinchi ekraningizni so'rang — kuchli prompt bilan. Keyin har qatorni O'Z so'zingiz bilan izohlang va 4-checklistdan o'tkazing (.env · catch · hardcode · analitika). Tushunmagan qatoringizni AI'dan «bu qator nima qiladi?» deb so'rang. Keyingi dars: dizayn va nasmotrennost 🎨.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function MvpBuild1Lesson({ lang: langProp, onFinished }) {
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

        /* === KOD === */
        .code-file { display: flex; align-items: center; gap: 6px; padding-bottom: 10px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .cdot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
        .code-name { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9FB4D8; margin-left: 6px; }
        .code-pre { font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.6vw,13px); color: ${CODE.text}; line-height: 1.75; margin: 0; white-space: pre-wrap; word-break: break-word; overflow-x: auto; }
        .code-inline { font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.7vw,13.5px); background: ${CODE.bg}; color: ${CODE.text}; padding: 9px 12px; border-radius: 9px; line-height: 1.6; overflow-x: auto; }
        .loop-badge { width: 24px; height: 24px; min-width: 24px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; transition: background 0.2s; }

        /* === ARC STRIP === */
        .arc-strip { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .arc-chip { display: inline-flex; align-items: center; gap: 6px; background: ${T.paper}; border-radius: 99px; padding: 7px 12px; font-family: 'Manrope'; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .arc-t { font-weight: 700; font-size: 11.5px; color: ${T.ink}; }
        .arc-here { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.35); }
        .arc-you { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.05em; animation: you-pulse 1.8s ease-in-out infinite; }
        @keyframes you-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,79,40,0.45); } 50% { box-shadow: 0 0 0 5px rgba(255,79,40,0); } }
        .arc-sep { color: ${T.ink3}; font-size: 13px; }

        /* === SARALASH === */
        .sort-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; border: none; }
        .sort-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .sort-text { flex: 1; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; line-height: 1.4; text-align: left; }
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
        .deck-val { font-family: 'Georgia, serif'; font-size: 12.5px; color: ${T.ink}; line-height: 1.45; margin: 2px 0 0; word-break: break-word; }

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
        .spec-card { background: ${CODE.bg}; border-radius: 14px; padding: 16px 17px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); display: flex; flex-direction: column; gap: 8px; }
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
