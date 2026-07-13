import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · P3 (LOYIHA KUNI) — TO'LIQ TIZIM — v16 (AUDIOSIZ) — KURS FINALI
// G'oya: kurs davomida qurilgan HAMMA qismni (web + mobil + bot + backend + baza + AI) bitta tizimga yig'ish.
//        Ko'p kanal — bitta backend. End-to-end test → integratsiya bug'ini topish/tuzatish → ishga tushirish (ship).
// Mahsulot: to'liq mini-do'kon — mijoz web/mobil/bot dan buyurtma beradi, hammasi o'sha bazaga tushadi, bot xabar beradi.
// Joylashuv: P2 (mobil) dan keyin — kursning grand-finali.
// Falsafa: SIZ — DIREKTOR (endi TIZIM ARXITEKTORI). Yig' → test → tuzat → ship.
// Signature 1: Ko'p kanal order trace (tirik tizim). Signature 2: End-to-end test matritsasi + bug.
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
  link: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.5 1.5" /><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.5-1.5" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" /></svg>),
  repeat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 9a6 6 0 0 1 10-3l3 2" /><path d="M20 15a6 6 0 0 1-10 3l-3-2" /><path d="M17 4v4h-4M7 20v-4h4" /></svg>),
  bug: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="8" y="7" width="8" height="11" rx="4" /><path d="M9 4l1.5 2M15 4l-1.5 2M4 10h3M17 10h3M4 15h3M17 15h3M12 7v11" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>),
  send: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M22 3L11 13M22 3l-7 18-4-8-8-4 19-6z" /></svg>),
  sparkle: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>),
  grid: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>)
};

const LESSON_META = { lessonId: 'full-system-capstone-09-v16', lessonTitle: { uz: 'To\'liq tizim: hammasini bitta tizimga yig\'amiz', ru: 'Проектный день: полная система' } };
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

// ===== KONSEPT LEKSIKONI =====
// To'liq tizim komponentlari (s2)
const SYS_COMPONENTS = [
  { id: 'web', group: 'Kanal (kirish)', label: 'Web (React)', emoji: '💻', color: T.blue, role: 'Web sahifa', does: 'Brauzerda mahsulotlar va «Buyurtma» tugmasi.', mod: 'Modul 3' },
  { id: 'mobil', group: 'Kanal (kirish)', label: 'Mobil (RN)', emoji: '📱', color: T.grape, role: 'Mobil ilova', does: 'Telefonda o\'sha do\'kon — Expo Go bilan.', mod: 'Modul 9' },
  { id: 'bot', group: 'Kanal (kirish)', label: 'Telegram bot', emoji: '✈️', color: T.blue, role: 'Bot kanal', does: 'Buyurtma va xabarlar Telegram orqali.', mod: 'Modul 8' },
  { id: 'node', group: 'Yadro', label: 'Node.js', emoji: '🟢', color: T.success, role: 'Backend (miya)', does: 'Barcha kanaldan so\'rovni qabul qilib boshqaradi.', mod: 'Modul 4' },
  { id: 'pg', group: 'Yadro', label: 'PostgreSQL', emoji: '🐘', color: T.grape, role: 'Baza', does: 'Mahsulot va buyurtmalarni saqlaydi — bitta joyda.', mod: 'Modul 4' },
  { id: 'ai', group: 'Yadro', label: 'AI (Claude)', emoji: '🤖', color: T.honey, role: 'Aql', does: 'Mijoz savoliga javob, tavsif yozadi.', mod: 'Modul 8/9' }
];

// Ko'p kanal (s3, s6)
const CHANNELS = [
  { id: 'web', label: 'Web', emoji: '💻' },
  { id: 'mobil', label: 'Mobil', emoji: '📱' },
  { id: 'bot', label: 'Bot', emoji: '✈️' }
];

// End-to-end test matritsasi (s8)
const MX_ROWS = [
  { id: 'web', label: 'Web', emoji: '💻' },
  { id: 'mobil', label: 'Mobil', emoji: '📱' },
  { id: 'bot', label: 'Bot', emoji: '✈️' }
];
const MX_COLS = ['Buyurtma', 'Bazada', 'Bot xabar', 'AI javob'];
const BUG_CELL = 1 * MX_COLS.length + 2; // Mobil qatori (1) × «Bot xabar» ustuni (2) = 6

// Bug tuzatish sikli (s10)
const FIX_STEPS = [
  { tag: '1 · BUG', color: T.accent, text: 'Test matritsasida bitta qizil katak: Mobil × «Bot xabar». Mobildan buyurtma berilganda admin Telegram xabarini olmadi.', note: 'End-to-end test integratsiya bug\'ini tutdi — web ishlaydi, mobil yo\'q.' },
  { tag: '2 · SABAB', color: T.honey, text: 'Mobil checkout POST /orders so\'rovida buyurtma to\'liq emas, shuning uchun backend bot xabari bosqichini o\'tkazib yubordi.', note: 'Web ishlaydi, mobil yo\'q — demak chok mobil↔backend orasida.' },
  { tag: '3 · TUZATISH PROMPTI', color: T.grape, text: '«Mobil checkout barcha buyurtma maydonlarini yuborsin; backend HAR buyurtmada, kanal qaysi bo\'lishidan qat\'i nazar, bot xabarini yuborsin.»', note: 'Aniq, nishonli tuzatish — butun tizimni qayta yozmaysiz.' },
  { tag: '4 · QAYTA TEST', color: T.success, text: 'Matritsa endi to\'liq yashil ✅ — uchala kanaldan ham bot xabari keladi.', note: 'Bug tuzatildi. Tizim end-to-end ishlaydi.' }
];

// Ishga tushirish checklisti (s11)
const LAUNCH = [
  'Barcha sozlamalar (.env) to\'g\'ri: API_URL, DATABASE_URL, BOT_TOKEN, AI kaliti',
  'End-to-end test o\'tdi — matritsa to\'liq yashil',
  'Mobil ilova Expo Go\'da haqiqiy telefonda sinaldi',
  'Backend deploy qilindi — 24/7 ishlaydi'
];

// Namuna hikoyasi (s13)
const CASE_AC = [
  { tag: 'YIG\'DI', color: T.accent, text: 'Web + mobil + bot — uchala kanalni bitta backendga uladi', why: 'Hammasi o\'sha baza va mantiqdan foydalanadi. Ko\'p eshik, bitta tizim.' },
  { tag: 'TESTLADI', color: T.blue, text: 'End-to-end: har kanaldan buyurtma berib, butun oqimni sinadi', why: 'Bitta amal butun tizimni boshidan oxirigacha tekshiradi.' },
  { tag: 'TUZATDI', color: T.honey, text: 'Integratsiya bug\'ini topdi va aniq prompt bilan tuzatdi', why: 'Chok qayerda ekanini topib, nishonli yamadi.' },
  { tag: 'ISHGA TUSHIRDI', color: T.success, text: 'Tizimni deploy qildi — mijozlar uch kanaldan kelyapti', why: 'Tayyor, sinangan, jonli tizim. Kurs tamom!' }
];

// Kurs sayohati (s16)
const JOURNEY = [
  { m: '01', t: 'Web asoslari — HTML, CSS, Git, deploy' },
  { m: '02', t: 'JavaScript' },
  { m: '03', t: 'React — frontend' },
  { m: '04', t: 'Backend + PostgreSQL' },
  { m: '05', t: 'NestJS — masshtab' },
  { m: '06', t: 'Sifat — testlar' },
  { m: '07', t: 'CI/CD + Monitoring' },
  { m: '08', t: 'Botlar + AI' },
  { m: '09', t: 'Tizimni yaxlit yig\'ish — siz shu yerda' }
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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Darrov e\'lon qilish — vaqt ketmasin' },
    { id: 'b', label: 'Butun tizimni boshidan oxirigacha test qilib, bug\'larni tuzatish' },
    { id: 'c', label: 'Yana yangi funksiyalar qo\'shish' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Kirish · Kurs finali" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Hamma qism tayyor. Ishga tushirishdan <span className="italic" style={{ color: T.accent }}>oldingi oxirgi qadam</span> nima?</h1>
        <Mentor>Kurs davomida web, mobil, bot, backend, baza, AI — hammasini qurdingiz. Bugun ularni bitta tizimga yig'amiz va ishga tushiramiz. Lekin avval bitta narsa shart.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)' }}>
              <p className="flow-label" style={{ marginBottom: 10 }}>Sizda tayyor turgan qismlar</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['💻 Web', '📱 Mobil', '✈️ Bot', '🟢 Backend', '🐘 Baza', '🤖 AI'].map((x, i) => (
                  <span key={i} className="ready-tag" style={{ animationDelay: `${0.15 + i * 0.07}s` }}>{x}</span>
                ))}
              </div>
              <p className="body" style={{ margin: '12px 0 0', color: T.ink2 }}>Olti qism — lekin ular birga, xatosiz ishlashini hali hech kim tekshirmadi.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Birinchi nima qilamiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri — avval <b>end-to-end test va bug tuzatish</b>. Bugun: hamma qismni yig'amiz, butun tizimni sinaymiz, bug'ni topib tuzatamiz va ishga tushiramiz. Bu — <b>kursning yakuniy loyiha kuni</b>.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Hamma qismni bitta tizimga yig\'ish (web + mobil + bot)', tag: '' },
    { text: 'Ko\'p kanal — bitta backend (order trace)', tag: 'jonli' },
    { text: 'End-to-end test — butun oqimni sinash', tag: 'jonli' },
    { text: 'Integratsiya bug\'ini topish va tuzatish', tag: '' },
    { text: 'Ishga tushirish (ship) + kursni yakunlash', tag: 'finale' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.grid(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Hamma qism → bitta tizim</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Yig'amiz, sinaymiz, tuzatamiz, ishga tushiramiz.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Siz endi tizim arxitektori — butun tizimni boshqarasiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Kursning yakuniy loyiha kuni</span></h2></div>
        <Mentor>Bugun yangi narsa o'rganmaymiz — bilganlarimizni <b style={{ color: T.ink }}>bitta to'liq tizimga</b> yig'amiz va ishga tushiramiz. Bu — kursning grand-finali.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — TO'LIQ TIZIM XARITASI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(SYS_COMPONENTS.map(c => c.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= SYS_COMPONENTS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? SYS_COMPONENTS.find(c => c.id === active) : null;
  const groups = ['Kanal (kirish)', 'Yadro'];
  return (
    <Stage eyebrow="To'liq tizim xaritasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${SYS_COMPONENTS.length} komponentni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bularning <span className="italic" style={{ color: T.accent }}>hammasini siz qurdingiz</span></h2></div>
        <Mentor>Mana to'liq tizim: yuqorida 3 ta kanal (kirish), pastda yadro. Har birini bosing — nima qiladi va qaysi moduldan.</Mentor>
        <Zoomable><div className="split">
          <Col>
            {groups.map(g => (
              <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <p className="flow-label" style={{ margin: '2px 0' }}>{g}</p>
                {SYS_COMPONENTS.filter(c => c.group === g).map(c => (
                  <button key={c.id} onClick={() => tap(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 13px', background: T.paper, boxShadow: active === c.id ? `inset 0 0 0 2px ${c.color}, 0 8px 20px -8px ${c.color}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}>
                    <span style={{ fontSize: 19 }}>{c.emoji}</span>
                    <span style={{ flex: 1 }}><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13, color: T.ink }}>{c.label}</span><span className="small" style={{ color: c.color, marginLeft: 7 }}>{c.role}</span></span>
                    {seen.has(c.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                  </button>
                ))}
              </div>
            ))}
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label} · {cur.mod}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.does}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir komponentni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>6 qism, 6 modul mehnati — bitta tizim. Endi ularni birga ishlatamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — KO'P KANAL, BITTA TIZIM =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState('web');
  const [seen, setSeen] = useState(storedAnswer ? new Set(CHANNELS.map(c => c.id)) : new Set(['web']));
  const done = seen.size >= CHANNELS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ko'p kanal, bitta tizim" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kanallarni ko'ring (${seen.size}/${CHANNELS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Uch kanal — <span className="italic" style={{ color: T.accent }}>bitta backend</span></h2></div>
        <Mentor>Mijoz web, mobil yoki bot orqali keladi — lekin uchchasi ham o'sha backend va bazadan foydalanadi. Har kanalni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {CHANNELS.map(c => (<button key={c.id} className={`chip ${active === c.id ? 'chip-on' : ''}`} onClick={() => tap(c.id)}>{seen.has(c.id) && active !== c.id ? '✓ ' : ''}{c.emoji} {c.label}</button>))}
            </div>
            <div className="converge fade-step" key={active}>
              {CHANNELS.map(c => (<div key={c.id} className={`cv-chan ${active === c.id ? 'cv-on' : ''}`}><span style={{ fontSize: 17 }}>{c.emoji}</span><span>{c.label}</span><span className={`cv-line ${active === c.id ? 'cv-line-on' : ''}`} /></div>))}
              <div className="cv-core"><span style={{ fontSize: 24 }}>🟢</span><span style={{ fontFamily: "'Manrope'", fontWeight: 800, fontSize: 12, color: '#fff' }}>Backend + Baza</span></div>
            </div>
          </Col>
          <Col>
            <div className="frame" style={{ padding: 'clamp(14px,2.2vw,20px)' }}>
              <p className="note-h" style={{ color: T.accent }}>{CHANNELS.find(c => c.id === active).emoji} {CHANNELS.find(c => c.id === active).label} kanali</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Bu kanal ham <b>o'sha</b> Node.js backendga so'rov yuboradi va <b>o'sha</b> PostgreSQL bazasidan o'qiydi. Hech narsa ikki marta qurilmaydi.</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana o'sha g'oya to'liq miqyosda: <b>ko'p eshik, bitta tizim</b>. Ma'lumot bitta joyda — shuning uchun hammasi mos.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Nega web, mobil va bot «bitta tizim» deyiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega bu uch kanal <span className="italic" style={{ color: T.accent }}>bitta tizim</span>?</h2></>}
    options={['Har biri o\'z alohida backendi va bazasiga ega', 'Uchchasi ham o\'sha bitta backend va bazadan foydalanadi — ma\'lumot bitta joyda', 'Ular bir-biriga umuman bog\'liq emas', 'Faqat ranglari bir xil']} correctIdx={1}
    explainCorrect="To'g'ri! Web, mobil, bot — uchala kanal o'sha bitta backend va PostgreSQL bazasidan foydalanadi. Ma'lumot bitta joyda bo'lgani uchun hamma kanal bir xil holatni ko'radi — bu bitta tizim."
    explainWrong={{ 0: 'Alohida backend emas — bitta backend hamma kanalga xizmat qiladi.', 2: 'Aynan bog\'liq — bitta backend orqali.', 3: 'Rang emas — umumiy backend va baza.', default: 'Bitta backend + bitta baza = bitta tizim.' }} />
);

// ===== SCREEN 5 — END-TO-END NIMA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FLOW = [
    { emoji: '📱', t: 'Mijoz mobildan «Buyurtma» bosadi' },
    { emoji: '🟢', t: 'Backend so\'rovni qabul qiladi' },
    { emoji: '🐘', t: 'Buyurtma bazaga saqlanadi' },
    { emoji: '✈️', t: 'Bot adminga xabar yuboradi' },
    { emoji: '✅', t: 'Mijozga tasdiq qaytadi' }
  ];
  const [step, setStep] = useState(storedAnswer ? FLOW.length - 1 : -1);
  const done = step >= FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="End-to-end" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Oqimni kuzating (${Math.max(0, step + 1)}/${FLOW.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">End-to-end: <span className="italic" style={{ color: T.accent }}>boshidan oxirigacha</span></h2></div>
        <Mentor>«End-to-end» — bitta amalni boshidan (mijoz) oxirigacha (tasdiq) kuzatish. Har qism birga ishlayaptimi, shu sinaladi. Bosing.</Mentor>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600, width: '100%', margin: '0 auto' }}>
          {FLOW.map((s, i) => { const on = step >= i; return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.paper, borderRadius: 12, padding: '12px 15px', opacity: on ? 1 : 0.3, transform: on ? 'translateX(0)' : 'translateX(-6px)', transition: 'all 0.4s', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `3px solid ${on ? T.grape : T.ink3}` }}>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <span style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,15px)', color: T.ink }}>{s.t}</span>
              </div>
              {i < FLOW.length - 1 && <span style={{ textAlign: 'center', color: step > i ? T.grape : T.ink3, fontSize: 14, transition: 'color 0.3s' }}>↓</span>}
            </React.Fragment>
          ); })}
        </div>
        {!done && <button className="btn" onClick={() => setStep(n => Math.min(n + 1, FLOW.length - 1))} style={{ alignSelf: 'center' }}>{step < 0 ? '▶ Oqimni boshlash' : 'Keyingi qadam →'}</button>}
        {done && <div className="frame-success fade-step" style={{ maxWidth: 600, width: '100%', margin: '0 auto' }}><p className="body" style={{ margin: 0, color: T.ink }}>End-to-end test = shu 5 qadamni birga sinash. Bitta qadam ishlamasa — tizim chala. Shuni tutamiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="End-to-end test nimani tekshiradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>End-to-end test nimani <span className="italic" style={{ color: T.accent }}>tekshiradi</span>?</h2></>}
    options={['Faqat bitta funksiyani alohida', 'Butun oqimni boshidan oxirigacha — barcha qism birga ishlayaptimi', 'Faqat ranglar va dizaynni', 'Faqat backend kodini o\'qib']} correctIdx={1}
    explainCorrect="To'g'ri! End-to-end test butun oqimni (mijoz → backend → baza → bot → tasdiq) boshidan oxirigacha sinaydi. Bu integratsiya bug'larini — qismlar orasidagi choklarni — ochib beradi."
    explainWrong={{ 0: 'Bitta funksiya emas — butun zanjirni birga.', 2: 'Rang emas — oqim ishlayaptimi.', 3: 'Faqat o\'qish kam — amalda sinash kerak.', default: 'Butun oqimni boshidan oxirigacha sinaydi.' }} />
);

// ===== SCREEN 6 — KO'P KANAL ORDER TRACE (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [selected, setSelected] = useState('web');
  const [tried, setTried] = useState(() => storedAnswer ? new Set(CHANNELS.map(c => c.id)) : new Set());
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | flowing | done
  const timerRef = useRef(null);
  const workRef = useRef(null);
  const done = tried.size >= CHANNELS.length;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const selChan = CHANNELS.find(c => c.id === selected);
  const choose = (id) => { if (phase === 'flowing') return; setSelected(id); setPhase('idle'); };
  const fire = () => {
    if (phase === 'flowing') return;
    setPhase('flowing');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setPhase('done'); setTried(prev => { const n = new Set(prev); n.add(selected); return n; }); }, 900);
  };
  return (
    <Stage eyebrow="Order trace · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Uch kanalni sinang (${tried.size}/${CHANNELS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi kanaldan kelsa ham — <span className="italic" style={{ color: T.accent }}>o'sha tizim javob beradi</span></h2></div>
        <Mentor>Kanalni tanlang, «Buyurtma yubor» bosing — buyurtma o'sha backendga borib, bazaga saqlanadi, bot xabar beradi, AI javob qaytaradi. Uchala kanalni sinab ko'ring — natija bir xil!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {CHANNELS.map(c => (<button key={c.id} className={`chip ${selected === c.id ? 'chip-on' : ''}`} onClick={() => choose(c.id)}>{tried.has(c.id) ? '✓ ' : ''}{c.emoji} {c.label}</button>))}
            </div>
            <div className="trace-board">
              <div className="trace-col"><span className="trace-node chan-node on"><span style={{ fontSize: 15 }}>{selChan.emoji}</span>{selChan.label}</span></div>
              <span className={`trace-arrow ${phase !== 'idle' ? 'flow' : ''}`}>→</span>
              <div className="trace-col"><span className={`trace-node be-node ${phase !== 'idle' ? 'on' : ''}`}><span style={{ fontSize: 15 }}>🟢</span>Backend</span></div>
              <span className={`trace-arrow ${phase === 'done' ? 'flow' : ''}`}>→</span>
              <div className="trace-col data-col">
                <span className={`trace-node d-node ${phase === 'done' ? 'on' : ''}`} style={{ animationDelay: '0s' }}><span style={{ fontSize: 14 }}>🐘</span>Baza</span>
                <span className={`trace-node d-node ${phase === 'done' ? 'on' : ''}`} style={{ animationDelay: '0.12s' }}><span style={{ fontSize: 14 }}>✈️</span>Bot</span>
                <span className={`trace-node d-node ${phase === 'done' ? 'on' : ''}`} style={{ animationDelay: '0.24s' }}><span style={{ fontSize: 14 }}>🤖</span>AI</span>
              </div>
            </div>
            {phase !== 'flowing' && <button className="btn" onClick={fire} style={{ alignSelf: 'flex-start' }}>{phase === 'idle' ? `▶ ${selChan.label}dan buyurtma yubor` : 'Yana yubor →'}</button>}
            {phase === 'flowing' && <p className="mono small" style={{ color: T.accent, margin: 0 }}>Buyurtma oqyapti…</p>}
          </Col>
          <Col>
            {phase === 'done' ? (
              <div className="takeaway fade-step" key={tried.size}>
                <div className="ta-bulb" style={{ fontSize: 28 }}>{selChan.emoji}</div>
                <p className="ta-h">{selChan.label}dan keldi — tizim ishladi</p>
                <p className="ta-sub">Bazaga saqlandi · admin xabardor · AI javob berdi. Boshqa kanal ham xuddi shunday.</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Buyurtma yuboring — o'sha bitta backend uni qabul qilib, baza/bot/AI ga tarqatadi.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uchala kanal — bitta natija. Mana <b>tirik tizim</b>: kirish ko'p, yadro bitta.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — INTEGRATSIYA CHOKLARI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SEAMS = [
    { id: 's1', emoji: '💻→🟢', t: 'Frontend ↔ Backend', risk: 'API_URL noto\'g\'ri (.env) — «Failed to fetch»' },
    { id: 's2', emoji: '📱→🟢', t: 'Mobil ↔ Backend', risk: 'Mobil eski manzilga ulanyapti yoki maydon yetishmaydi' },
    { id: 's3', emoji: '✈️→🟢', t: 'Bot ↔ Backend', risk: 'BOT_TOKEN yo\'q yoki xato — bot xabar yubormaydi' },
    { id: 's4', emoji: '🟢→🤖', t: 'Backend ↔ AI', risk: 'AI kaliti yo\'q yoki limit tugagan — javob kelmaydi' }
  ];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(SEAMS.map(s => s.id)) : new Set());
  const done = seen.size >= SEAMS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? SEAMS.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="Integratsiya choklari" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Choklarni ko'ring (${seen.size}/${SEAMS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tizim <span className="italic" style={{ color: T.accent }}>choklarda siniydi</span></h2></div>
        <Mentor>Qismlar yaxshi ishlaydi — lekin ular ULANGAN joyda (chok) bug chiqadi. Har chokni bosing: bu yerda nima buziladi?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SEAMS.map(s => { const on = seen.has(s.id); return (
                <button key={s.id} onClick={() => tap(s.id)} className={`plink ${active === s.id ? 'plink-on' : ''}`}>
                  <span className="mono" style={{ fontSize: 13, minWidth: 50 }}>{s.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{s.t}</span></span>
                  {on && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="frame fade-step" key={active} style={{ borderLeft: `4px solid ${T.accent}`, padding: '14px 16px' }}><p className="mono small" style={{ margin: '0 0 6px', color: T.accent, fontWeight: 700 }}>🐞 BU YERDA NIMA BUZILADI</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.risk}</p></div>) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Bir chokni bosing — qaysi sozlama yoki ulanish buzilishini ko'rasiz.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aksar bug'lar — bitta yo'qolgan sozlama (.env) yoki yetishmagan maydon. End-to-end test aynan shularni tutadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — END-TO-END TEST MATRITSASI (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CELLS = MX_ROWS.length * MX_COLS.length;
  const [started, setStarted] = useState(!!storedAnswer);
  const [revealed, setRevealed] = useState(storedAnswer ? CELLS : 0);
  const workRef = useRef(null);
  const done = revealed >= CELLS;
  useEffect(() => {
    if (!started || revealed >= CELLS) return;
    const t = setTimeout(() => setRevealed(r => r + 1), 240);
    return () => clearTimeout(t);
  }, [started, revealed, CELLS]);
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const cellState = (i) => { if (i >= revealed) return 'pending'; return i === BUG_CELL ? 'fail' : 'pass'; };
  return (
    <Stage eyebrow="Test matritsasi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Testni ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">End-to-end test: <span className="italic" style={{ color: T.accent }}>har kanal × har qadam</span></h2></div>
        <Mentor>Har kanaldan butun oqimni sinaymiz. «Test ishga tushir» bosing — kataklar yashil bo'lib boradi. Bittasiga e'tibor bering!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="matrix">
              <span className="mx-h" />
              {MX_COLS.map((c, j) => <span key={j} className="mx-h">{c}</span>)}
              {MX_ROWS.map((r, ri) => (
                <React.Fragment key={r.id}>
                  <span className="mx-rowh"><span style={{ fontSize: 15 }}>{r.emoji}</span>{r.label}</span>
                  {MX_COLS.map((_c, ci) => { const i = ri * MX_COLS.length + ci; const st = cellState(i); return (
                    <span key={ci} className={`mx-cell ${st === 'pass' ? 'mx-pass' : ''} ${st === 'fail' ? 'mx-fail' : ''}`}>{st === 'pass' ? Ico.check(13) : st === 'fail' ? Ico.x(13) : ''}</span>
                  ); })}
                </React.Fragment>
              ))}
            </div>
            {!started && <button className="btn" onClick={() => setStarted(true)} style={{ alignSelf: 'flex-start' }}>▶ Test ishga tushir</button>}
            {started && !done && <p className="mono small" style={{ color: T.accent, margin: 0 }}>Sinalyapti…</p>}
          </Col>
          <Col>
            {!done ? <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Har katak = bitta kanaldan bitta qadam. Yashil — ishladi, qizil — bug.</p></div>
              : <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.accent}`, padding: '14px 16px' }}><p className="mono small" style={{ margin: '0 0 6px', color: T.accent, fontWeight: 700 }}>🐞 BUG TOPILDI</p><p className="body" style={{ margin: 0, color: T.ink }}><b>Mobil × «Bot xabar»</b> qizil: mobildan buyurtma berilganda admin Telegram xabarini olmadi. Web va bot ishlaydi — demak chok mobilda.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana end-to-end testning kuchi: 11 katak yashil, lekin 1 qizil — yashirin integratsiya bug'i ko'rindi. Endi tuzatamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Integratsiya (chok) bug'larini qanday tutamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Integratsiya bug'larini qanday <span className="italic" style={{ color: T.accent }}>tutamiz</span>?</h2></>}
    options={['Faqat bitta kanalni bir marta sinab', 'Har kanaldan butun oqimni (end-to-end) sinab — qaysi qadam buzilishini ko\'rib', 'Umuman test qilmaymiz', 'Faqat kodga qarab, ishlatib ko\'rmasdan']} correctIdx={1}
    explainCorrect="To'g'ri! Har kanaldan butun oqimni end-to-end sinaymiz. Matritsa ko'rsatadi: qaysi kanal × qaysi qadam buzilgan. Shunday qilib chok qayerda ekanini aniq topamiz."
    explainWrong={{ 0: 'Bitta kanal kam — bug boshqa kanalda bo\'lishi mumkin (mobildagidek).', 2: 'Test qilmaslik — bug\'ni mijoz topadi.', 3: 'Faqat o\'qish kam — amalda sinash kerak.', default: 'Har kanal × har qadam — end-to-end.' }} />
);

// ===== SCREEN 10 — BUG'NI TUZATISH =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? FIX_STEPS.length - 1 : 0);
  const workRef = useRef(null);
  const done = step >= FIX_STEPS.length - 1;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const cur = FIX_STEPS[step] || FIX_STEPS[0];
  return (
    <Stage eyebrow="Bug tuzatish · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni kuzating (${step + 1}/${FIX_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bug'ni <span className="italic" style={{ color: T.accent }}>topdik → tuzatamiz</span></h2></div>
        <Mentor>Qizil katakni topdik. Endi direktor sifatida sababni aniqlab, aniq tuzatish prompti beramiz va qayta sinaymiz. Bosing.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="vibe-track">
              {FIX_STEPS.map((s, i) => { const on = i <= step; return (<div key={s.tag} className="vibe-row" style={{ opacity: on ? 1 : 0.32, transition: 'opacity 0.35s' }}><span className="vibe-dot" style={{ background: on ? s.color : T.ink3 }}>{i < step ? Ico.check(11) : i + 1}</span><span className="vibe-tag" style={{ color: on ? s.color : T.ink3 }}>{s.tag}</span></div>); })}
            </div>
            {!done && <button className="btn" onClick={() => setStep(n => Math.min(n + 1, FIX_STEPS.length - 1))} style={{ alignSelf: 'flex-start' }}>{step === 0 ? '▶ Tuzatishni boshlash' : 'Keyingi qadam →'}</button>}
          </Col>
          <Col>
            <div key={step} className="vibe-card fade-step" style={{ borderLeft: `4px solid ${cur.color}` }}>
              <span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span>
              <p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 10px', lineHeight: 1.5 }}>{cur.text}</p>
              <p className="body" style={{ margin: 0, color: T.ink2 }}>{cur.note}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Topildi → sabab → aniq prompt → qayta test. Bitta chok yamaldi, butun tizim yana yashil. Endi ishga tushiramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ISHGA TUSHIRISH CHECKLISTI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [checked, setChecked] = useState(() => storedAnswer ? new Set(LAUNCH.map((_, i) => i)) : new Set());
  const done = checked.size >= LAUNCH.length;
  const toggle = (i) => setChecked(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ishga tushirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Belgilang (${checked.size}/${LAUNCH.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ishga tushirishdan oldin — <span className="italic" style={{ color: T.accent }}>launch checklist</span></h2></div>
        <Mentor>Tizimni ishga tushirishdan oldin shu ro'yxatni belgilang. Hammasi tayyor bo'lsa — ship!</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist">
              <div className="cl-head"><span style={{ color: T.accent, display: 'inline-flex' }}>{Ico.send(15)}</span><span className="cl-title">Launch checklist</span></div>
              {LAUNCH.map((t, i) => { const on = checked.has(i); return (
                <button key={i} onClick={() => toggle(i)} className={`crit crit-${on ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                  <span className="crit-box">{on ? Ico.check(13) : ''}</span>
                  <span className="crit-text">{t}</span>
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {!done ? <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Har bandni bosib belgilang. Bular bo'lmasa — tizim mijozda buziladi.</p></div>
              : <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>🚀</div><p className="ta-h">Ishga tushirishga tayyor!</p><p className="ta-sub">Sozlama to'g'ri, test o'tdi, mobil sinaldi, backend jonli. Endi mijozlar foydalanadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Tizimni ishga tushirishdan oldin nima SHART?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ishga tushirishdan oldin nima <span className="italic" style={{ color: T.accent }}>shart</span>?</h2></>}
    options={['Hech narsa — darrov chiqaramiz', 'End-to-end test o\'tgan va sozlamalar (.env) to\'g\'ri bo\'lishi', 'Faqat ko\'proq rang qo\'shish', 'Faqat logotip tayyor bo\'lishi']} correctIdx={1}
    explainCorrect="To'g'ri! Ishga tushirishdan oldin end-to-end test o'tgan bo'lishi (barcha kanal × qadam yashil) va sozlamalar to'g'ri bo'lishi shart. Aks holda bug'ni mijoz topadi."
    explainWrong={{ 0: 'Darrov chiqarish — bug\'lar mijozga tushadi.', 2: 'Rang muhim, lekin test va sozlama shart.', 3: 'Logotip yetarli emas — tizim ishlashi kerak.', default: 'End-to-end test o\'tgan + sozlama to\'g\'ri.' }} />
);

// ===== SCREEN 13 — ISHGA TUSHDI / NAMUNA =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CASE_AC.map((_, i) => i)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= CASE_AC.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active !== null ? CASE_AC[active] : null;
  return (
    <Stage eyebrow="Ishga tushdi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${CASE_AC.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tizim <span className="italic" style={{ color: T.accent }}>jonli</span> — bir o'quvchining yo'li</h2></div>
        <Mentor>Mana bir o'quvchi to'liq tizimni qanday yetkazdi — 4 qadam. Har qatorni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.grape, display: 'inline-flex' }}>{Ico.grid(16)}</span><span className="cl-title">Yig'→test→tuzat→ship</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>{cur.text}</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yig' → test → tuzat → ship. Mana to'liq tizimni yetkazish. Endi o'zingiz rejalang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">To'liq tizim: <span className="italic" style={{ color: T.accent }}>yig' · test · tuzat · ship</span></h2></div>
      <Mentor>Yodda tuting: hamma qismni yig', butun oqimni end-to-end sinab ko'r, chokdagi bug'ni tuzat, keyin ishga tushir.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎬</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — tizim arxitektori</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Qismlarni yig'asiz, sinaysiz va ishlaydigan tizimni yetkazasiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.link(18), c: T.grape, t: 'YIG\' — ko\'p kanal, bitta backend' }, { ic: Ico.repeat(18), c: T.blue, t: 'END-TO-END TEST — har kanal × har qadam' }, { ic: Ico.bug(18), c: T.accent, t: 'BUG TUZAT — chokni topib nishonli yama' }, { ic: Ico.send(18), c: T.success, t: 'SHIP — sozlama+test tayyor bo\'lsa ishga tushir' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: launch rejasi =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Qaysi tizimni ishga tushirasiz? (masalan: mini-do\'kon — web+mobil+bot)', 'End-to-end test rejasi (masalan: har kanaldan buyurtma berib, baza+bot tekshir)', 'Ishga tushirishdan oldingi 1 ta shart (masalan: .env to\'g\'ri)'];
const LBL = ['Tizim', 'End-to-end test rejasi', 'Ship sharti'];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [lines, setLines] = useState(() => storedAnswer?.lines || emptyLines());
  const isComplete = (f) => f.name.trim().length >= 8;
  const completeCount = lines.filter(isComplete).length;
  const passed = completeCount >= 2;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, lines, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (i, v) => setLines(prev => prev.map((f, idx) => (idx === i ? { name: v } : f)));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 13, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' };
  const completeLines = lines.filter(isComplete);
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>ishga tushirish rejangiz</span></h2></div>
        <Mentor>O'z tizimingiz uchun: qaysi tizimni, qanday end-to-end test bilan sinab, qaysi shart bilan ishga tushirasiz? Kamida 2 qatorni to'ldiring.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>{LBL[i]}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning launch rejangiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — rejangiz shu yerda yig'iladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.send(15)}</span><span className="cl-title">Mening launch rejam</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Shu reja bilan har qanday tizimni yig'ib, sinab, ishga tushira olasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — KURS YAKUNI =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Ko\'p kanal (web/mobil/bot) — bitta backend, bitta tizim', 'End-to-end test butun oqimni boshidan oxirigacha sinaydi', 'Integratsiya bug\'i chokda bo\'ladi — topib, nishonli tuzatasiz', 'Sozlama+test tayyor bo\'lsa — ishga tushirasiz (ship)'];
  const GLOSSARY = [{ b: 'To\'liq tizim', t: '— barcha kanal+yadro birga ishlaydigan butun' }, { b: 'End-to-end', t: '— boshidan oxirigacha sinash' }, { b: 'Integratsiya bug\'i', t: '— qismlar orasidagi chok xatosi' }, { b: 'Ship / deploy', t: '— tizimni ishga tushirib, mijozga yetkazish' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Kursni tamomladingiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Kurs finali tugadi</span><h2 className="title h-title fade-up d1">Siz endi <span className="italic" style={{ color: T.accent }}>tizim quryasiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Web, mobil, bot, backend, baza va AI ni bitta to\'liq tizimga yig\'ib, sinab, ishga tushirishni o\'rgandingiz. Bu — kursning yakuni. Siz endi direktor va arxitektorsiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring — keyin bu finalni yopasiz.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Sizning yo'lingiz — 9 modul</div><ol className="journey">{JOURNEY.map((j, i) => (<li key={i} className="jrow" style={{ animationDelay: `${0.35 + i * 0.05}s` }}><span className="jnum" style={{ background: i === JOURNEY.length - 1 ? T.success : T.accent }}>{j.m}</span><span className="jtext">{j.t}</span></li>))}</ol></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🎓</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Capstone tamom — endi navbat sizniki</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>O'z g'oyangizni oling, qismlarga bo'ling, AI bilan quring, end-to-end sinab ishga tushiring. Siz buni endi qila olasiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function FullSystemProjectLesson({ lang: langProp, onFinished }) {
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

        /* === READY-TAG (s0) === */
        .ready-tag { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; background: ${T.bg}; border-radius: 99px; padding: 7px 13px; box-shadow: 0 4px 12px -7px rgba(${T.shadowBase},0.2); animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }

        /* === CONVERGE (s3) === */
        .converge { display: flex; flex-direction: column; gap: 7px; background: ${T.paper}; border-radius: 16px; padding: 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.14); position: relative; }
        .cv-chan { display: flex; align-items: center; gap: 9px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink2}; background: ${T.bg}; border-radius: 10px; padding: 9px 12px; position: relative; transition: all 0.25s; }
        .cv-chan.cv-on { color: ${T.ink}; box-shadow: inset 0 0 0 1.5px ${T.accent}; background: ${T.accentSoft}; }
        .cv-line { display: none; }
        .cv-core { display: flex; align-items: center; justify-content: center; gap: 9px; background: ${CODE.bg}; border-radius: 12px; padding: 13px; margin-top: 4px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.3); }

        /* === TRACE BOARD (s6) === */
        .trace-board { display: flex; align-items: center; justify-content: center; gap: 8px; background: ${CODE.bg}; border-radius: 16px; padding: 18px 12px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); flex-wrap: wrap; }
        .trace-col { display: flex; flex-direction: column; gap: 8px; }
        .trace-node { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: #9FB4D8; background: #ffffff12; border-radius: 10px; padding: 9px 11px; transition: all 0.35s; white-space: nowrap; }
        .trace-node.on { color: #fff; }
        .chan-node.on { background: ${T.accent}; box-shadow: 0 0 14px -2px ${T.accent}99; }
        .be-node.on { background: ${T.success}; box-shadow: 0 0 14px -2px ${T.success}99; }
        .d-node.on { background: ${T.grape}; box-shadow: 0 0 12px -2px ${T.grape}99; animation: feat-pop .42s both; }
        .trace-arrow { color: #6B7585; font-size: 18px; transition: color 0.3s; }
        .trace-arrow.flow { color: ${T.accent}; }

        /* === MATRITSA (s8) === */
        .matrix { display: grid; grid-template-columns: auto repeat(${MX_COLS.length}, 1fr); gap: 5px; background: ${T.paper}; border-radius: 14px; padding: 13px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.14); }
        .mx-h { font-family: 'Manrope'; font-weight: 700; font-size: 9.5px; color: ${T.ink2}; text-align: center; align-self: center; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.02em; }
        .mx-rowh { font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: ${T.ink}; display: flex; align-items: center; gap: 5px; padding-right: 4px; }
        .mx-cell { min-height: 34px; border-radius: 8px; background: ${T.bg}; display: flex; align-items: center; justify-content: center; color: ${T.ink3}; box-shadow: inset 0 0 0 1px ${T.ink3}22; transition: all 0.3s; }
        .mx-pass { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; animation: feat-pop .3s; }
        .mx-fail { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake 0.45s; }

        /* === JOURNEY (s16) === */
        .journey { display: flex; flex-direction: column; gap: 3px; list-style: none; }
        .jrow { display: flex; align-items: center; gap: 11px; padding: 4px 0; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .jnum { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10.5px; color: #fff; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .jtext { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink}; }

        /* === PLINK (s7) === */
        .plink { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .plink:hover { transform: translateY(-1px); }
        .plink-on { background: ${T.grapeSoft}; box-shadow: inset 0 0 0 1.5px ${T.grape}; }
        .plink-label { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }

        /* === VIBE TRACK (s10) === */
        .vibe-track { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }
        .vibe-row { display: flex; align-items: center; gap: 11px; padding: 5px 0; }
        .vibe-dot { width: 24px; height: 24px; min-width: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; transition: background 0.3s; }
        .vibe-tag { font-family: 'Manrope'; font-weight: 700; font-size: 12px; letter-spacing: 0.03em; transition: color 0.3s; }
        .vibe-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === CHEK-LIST === */
        .checklist { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 7px; position: relative; }
        .cl-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid ${T.ink3}33; margin-bottom: 2px; }
        .cl-title { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .crit { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 9px; font-family: 'Georgia, serif'; font-size: 13px; color: ${T.ink}; border: none; transition: background 0.25s; }
        .crit-text { flex: 1; line-height: 1.4; }
        .crit-box { width: 19px; height: 19px; min-width: 19px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .crit-pending { background: ${T.bg}; } .crit-pending .crit-box { box-shadow: inset 0 0 0 1.7px ${T.ink3}; color: ${T.ink3}; }
        .crit-pass { background: ${T.successSoft}; } .crit-pass .crit-box { background: ${T.success}; color: #fff; animation: crit-pop 0.3s cubic-bezier(.2,.7,.2,1); }
        @keyframes crit-pop { 0% { transform: scale(.4); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }

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

        /* === TAKEAWAY === */
        .takeaway { background: ${T.successSoft}; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.success}; font-weight: 600; font-size: 13px; margin: 0; }

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
