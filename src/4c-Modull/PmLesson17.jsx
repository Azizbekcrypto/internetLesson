import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 17-DARS (Modul 07 · CI/CD · PM) — RELIZ TEZLIGI = RAQOBAT USTUNLIGI — PLATFORM STANDARD v16
// G'oya: kompaniyalar eng yaxshi g'oya bilan emas, ITERATSIYA TEZLIGI bilan yutadi. CI/CD = mahsulot
//        eksperimentlari uchun infratuzilma. Yakuniy ish: oyiga nechta eksperiment (CI/CD bilan vs bilmasdan).
// Joylashuv: CiCdIntro (konsept) va GithubActions (texnik) ORASIDA — "NEGA tezlik kerak?".
// Mahsulot: AvtoIjara (React + Express, Netlify/Render). Metafora: iteratsiya halqasi — tez aylansa tez o'rganasan.
// Signature 1: Eksperiment hisoblagichi (qo'lda ~4 vs CI/CD ~30 / oy). Signature 2: eksperiment madaniyati.
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
  problem: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1 .9-1 1.7" /><path d="M12 16.7h.01" /></svg>),
  clip: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0" /><path d="M8.5 11l1.5 1.5 3-3M8.5 16l1.5 1.5 3-3" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4M5 5h12l-2 3.5L17 12H5" /></svg>),
  rocket: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l5.5-5.5a5 5 0 0 1 4-1.5 5 5 0 0 1-1.5 4L11 15M9 13l-3-1 1.5-1.5a3 3 0 0 1 2.6-.8M11 15l1 3 1.5-1.5a3 3 0 0 0 .8-2.6" /></svg>),
  refresh: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" /></svg>),
  beaker: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 3v6l-5 9a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18l-5-9V3" /><path d="M8 3h8M7 15h10" /></svg>),
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  cog: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>)
};

const LESSON_META = { lessonId: 'pm-delivery-speed-17-v16', lessonTitle: { uz: 'Reliz tezligi = raqobat ustunligi', ru: 'Скорость доставки — конкурентное преимущество' } };
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
// Iteratsiya halqasi (s2)
const LOOP = [
  { t: 'Qur', emoji: '🔨' }, { t: 'Relizla', emoji: '🚀' }, { t: 'O\'rgan', emoji: '📊' }, { t: 'Yaxshila', emoji: '✨' }
];

// CI/CD avtomatlashtiradigan qadamlar (s3)
const STEPS = [
  { id: 'install', label: 'Install (npm i)', man: '5 daqiqa', why: 'CI/CD o\'zi o\'rnatadi — siz kutmaysiz.' },
  { id: 'test', label: 'Testlarni ishga tushirish', man: '10 daqiqa', why: 'Har push\'da avtomatik — qo\'lda eslab o\'tirmaysiz.' },
  { id: 'build', label: 'Build qilish', man: '10 daqiqa', why: 'Konveyer o\'zi build qiladi.' },
  { id: 'deploy', label: 'Serverga yuklash (deploy)', man: '30+ daqiqa', why: 'Avtomatik deploy — bir tugma ham bosmaysiz.' }
];

// Qo'lda vs CI/CD (s5)
const MANUAL = ['Har reliz ~2 soat qo\'lda ish', 'Xato qilish qo\'rquvi — kechqurun reliz qilmaysan', 'Kamdan-kam reliz (haftada 1)'];
const CICD = ['Har reliz ~5 daqiqa avtomatik', 'Testlar himoyalaydi — qo\'rqmaysan', 'Kuniga bir necha marta reliz'];

// Eksperiment hisoblagichi (s6)
const MANUAL_EXP = 4;
const CICD_EXP = 30;

// Eksperiment madaniyati (s10)
const NOCI = ['Reliz qimmat — eksperiment kam', 'Faqat "katta" o\'zgarish qilinadi', 'Yangi g\'oya oylab kutadi'];
const WITHCI = ['Reliz arzon — ko\'p eksperiment', 'A/B test, narx sinash, yangi tugma', 'G\'oya bugun chiqadi, ertaga natija'];

// Feature ↔ CI/CD nima beradi (s8 moslash)
const PAIRS = [
  { id: 'install', feat: 'Kutubxonalarni o\'rnatish', crit: 'CI/CD o\'zi qiladi — vaqt tejaladi' },
  { id: 'test', feat: 'Testlarni eslab ishga tushirish', crit: 'Har push\'da avtomatik — unutmaysiz' },
  { id: 'deploy', feat: 'Qo\'lda serverga yuklash', crit: 'Avtomatik deploy — xato kamayadi' },
  { id: 'fear', feat: 'Reliz qilishdan qo\'rquv', crit: 'Testlar himoyalaydi — ishonch bilan relizlaysiz' }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'A KOMPANIYA', color: T.accent, text: 'Zo\'r g\'oya, lekin qo\'lda deploy — oyiga 4 reliz', why: 'Har reliz og\'riq — kam eksperiment, sekin o\'rganish.' },
  { tag: 'B KOMPANIYA', color: T.blue, text: 'Oddiyroq g\'oya, lekin CI/CD — oyiga 30 reliz', why: '7x ko\'p eksperiment — tez o\'rganib, mahsulotni yaxshiladi.' },
  { tag: 'NATIJA', color: T.honey, text: '6 oydan keyin B kompaniya bozorni egalladi', why: 'Tez iteratsiya zo\'r g\'oyani ortda qoldirdi.' },
  { tag: 'XULOSA', color: T.success, text: 'A kompaniya ham CI/CD ga o\'tdi', why: 'Tezlik = raqobat ustunligi. CI/CD — uning poydevori.' }
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

// ===== SCREEN 0 — HOOK (2 kompaniya) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('a');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'B kompaniyada pul ko\'p edi' },
    { id: 'b', label: 'B tez iteratsiya qildi — ko\'p eksperiment, tez o\'rganish' },
    { id: 'c', label: 'Shunchaki omad' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'a'
    ? { who: 'A kompaniya', emoji: '🐢', say: 'Bizda zo\'r g\'oya bor edi! Lekin har relizni qo\'lda qilardik — oyiga 4 marta. Mukammal qilishni xohlardik.', ok: false }
    : { who: 'B kompaniya', emoji: '🚀', say: 'G\'oyamiz oddiyroq edi, lekin CI/CD bor — kuniga relizladik. Tez sinab, tez o\'rganib, yaxshiladik.', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Zo'r g'oyali kompaniya <span className="italic" style={{ color: T.accent }}>yutqazdi</span>. Nega?</h1>
        <Mentor>Ikki kompaniya birga boshladi. Biri yaxshi g'oya bilan, biri tez reliz bilan. Har birini bosing.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'a' ? 'chip-on' : ''}`} onClick={() => setV('a')}>A — zo'r g'oya 🐢</button>
              <button className={`chip ${v === 'b' ? 'chip-on' : ''}`} onClick={() => setV('b')}>B — tez reliz 🚀</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.success : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega B yutdi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Kompaniyalar ko'pincha eng yaxshi g'oya bilan emas, <b>iteratsiya tezligi</b> bilan yutadi. Tez relizlaganlar ko'proq eksperiment qiladi, tez o'rganadi. <b>CI/CD</b> — shu tezlikning poydevori. Bugun nega ekanini ko'ramiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Iteratsiya tezligi yutadi, zo\'r g\'oya emas', tag: '' },
    { text: 'CI/CD = mahsulot eksperimentlari infratuzilmasi', tag: '' },
    { text: 'Qo\'lda deploy vs CI/CD — vaqt va qo\'rquv', tag: '' },
    { text: 'Eksperiment hisoblagichi: oyiga nechta?', tag: 'jonli' },
    { text: 'O\'z loyihangiz uchun eksperiment sonini hisoblang', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.accent} soft={T.accentSoft}>{Ico.rocket(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Tez relizlagan yutadi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>CI/CD ko'proq eksperiment qilish imkonini beradi.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Keyingi dars: shu konveyerni GitHub Actions bilan quramiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Nega CI/CD — raqobat ustunligi?</span></h2></div>
        <Mentor>CI/CD texnik vosita bo'lib ko'rinadi. Lekin PM uchun u — <b style={{ color: T.ink }}>tez eksperiment</b> qilish imkoniyati. Bugun shu tomonini ko'ramiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — ITERATSIYA HALQASI (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('slow');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['slow', 'fast']) : new Set(['slow']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Metafora" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulot — <span className="italic" style={{ color: T.accent }}>iteratsiya halqasi</span></h2></div>
        <Mentor>Mahsulot bir halqada o'sadi: <b style={{ color: T.ink }}>Qur → Relizla → O'rgan → Yaxshila</b>. Halqa qanchalik tez aylansa, shunchalik tez o'rganasiz. Ikki tezlikni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'slow' ? 'chip-on' : ''}`} onClick={() => set('slow')}>🐢 Sekin halqa</button>
              <button className={`chip ${v === 'fast' ? 'chip-on' : ''}`} onClick={() => set('fast')}>⚡ Tez halqa (CI/CD)</button>
            </div>
            <div key={v} className={`loop-ring ${v === 'fast' ? 'lr-fast' : ''}`}>
              {LOOP.map((s, i) => (<div key={i} className={`loop-node ln-${i}`}><span style={{ fontSize: 20 }}>{s.emoji}</span><span className="loop-lbl">{s.t}</span></div>))}
              <span className="loop-spin" style={{ color: v === 'fast' ? T.success : T.ink3 }}>{Ico.refresh(26)}</span>
            </div>
          </Col>
          <Col>
            {v === 'slow'
              ? <div className="frame-warn fade-step" key="s"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sekin o'rganish</p><p className="body" style={{ margin: 0, color: T.ink }}>Qo'lda deploy = halqa sekin aylanadi. Oyiga bir-ikki marta o'rganasiz.</p></div>
              : <div className="frame-success fade-step" key="f"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tez o'rganish</p><p className="body" style={{ margin: 0, color: T.ink }}>CI/CD = halqa tez aylanadi. Kuniga o'rganib, mahsulotni yaxshilaysiz.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yutuq — halqa tezligida. CI/CD halqani tezlashtiradigan dvigatel.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — CI/CD NIMANI AVTOMATLASHTIRADI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(STEPS.map(s => s.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= STEPS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? STEPS.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="Avtomatlashtirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${STEPS.length} qadamni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">CI/CD <span className="italic" style={{ color: T.accent }}>qo'l ishini</span> oladi</h2></div>
        <Mentor>Har reliz uchun bu qadamlar qo'lda qilinadi — vaqt yeydi. CI/CD ularni avtomatlashtiradi. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS.map(s => (<button key={s.id} onClick={() => tap(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === s.id ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -8px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.cog(17)}</span><span style={{ flex: 1 }}><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink }}>{s.label}</span><span className="mono" style={{ fontSize: 10.5, color: T.accent, marginLeft: 7 }}>qo'lda {s.man}</span></span>{seen.has(s.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.bolt(16)}</span><span className="sk-wordbadge" style={{ color: T.success, background: T.successSoft }}>CI/CD avtomatlashtiradi</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qadamni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qadamlar avtomat bo'lsa — reliz arzon. Arzon reliz = ko'p eksperiment.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Kompaniyalar ko'pincha nima bilan yutadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kompaniyalar ko'pincha <span className="italic" style={{ color: T.accent }}>nima bilan</span> yutadi?</h2></>}
    options={['Faqat eng yaxshi g\'oya bilan', 'Iteratsiya tezligi bilan — tez sinab, tez o\'rganib', 'Eng ko\'p kod yozish bilan', 'Eng chiroyli logotip bilan']} correctIdx={1}
    explainCorrect="To'g'ri! G'oya boshlanish nuqtasi, lekin g'olib ko'pincha tez iteratsiya qiladigan — tez relizlab, foydalanuvchidan tez o'rganadigan kompaniya."
    explainWrong={{ 0: 'Zo\'r g\'oya yetarli emas — tez sinab takomillashtirish kerak.', 2: 'Kod miqdori emas — o\'rganish tezligi.', 3: 'Logotip emas — iteratsiya tezligi.', default: 'Iteratsiya tezligi yutadi.' }} />
);

// ===== SCREEN 5 — QO'LDA vs CI/CD =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('manual');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['manual', 'cicd']) : new Set(['manual']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'manual' ? MANUAL : CICD;
  const col = v === 'manual' ? T.accent : T.success;
  return (
    <Stage eyebrow="Qo'lda vs CI/CD" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qo'lda deploy vs <span className="italic" style={{ color: T.accent }}>CI/CD</span></h2></div>
        <Mentor>Reliz qo'lda qilinsa — qimmat va qo'rqinchli. CI/CD bilan — arzon va xotirjam. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'manual' ? 'chip-on' : ''}`} onClick={() => set('manual')}>✋ Qo'lda</button>
              <button className={`chip ${v === 'cicd' ? 'chip-on' : ''}`} onClick={() => set('cicd')}>⚙️ CI/CD</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'manual' ? Ico.clock(16) : Ico.bolt(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'manual'
              ? <div className="frame-warn fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Har reliz og'riq bo'lsa — kam relizlaysiz. Kam reliz = kam eksperiment = sekin o'sish.</p></div>
              : <div className="frame-success fade-step" key="c"><p className="body" style={{ margin: 0, color: T.ink }}>Reliz arzon bo'lsa — bemalol relizlaysiz. Ko'p reliz = ko'p eksperiment = tez o'sish.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Asosiy g'oya: reliz <b>arzonlashsa</b>, eksperiment <b>ko'payadi</b>.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="CI/CD reliz qilishni arzonlashtirsa, mahsulotga qanday ta'sir qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Reliz <span className="italic" style={{ color: T.accent }}>arzonlashsa</span> nima bo'ladi?</h2></>}
    options={['Eksperiment kamayadi', 'Ko\'proq eksperiment qilinadi — tez o\'rganiladi', 'Hech narsa o\'zgarmaydi', 'Kod sekinlashadi']} correctIdx={1}
    explainCorrect="To'g'ri! Reliz arzon va xavfsiz bo'lsa, jamoa bemalol ko'p marta relizlaydi — ko'p eksperiment, tez o'rganish."
    explainWrong={{ 0: 'Aksincha — arzon bo\'lsa ko\'payadi.', 2: 'Katta o\'zgarish — eksperiment tezligi oshadi.', 3: 'Kod tezligiga emas — reliz/eksperiment soniga ta\'sir qiladi.', default: 'Arzon reliz → ko\'p eksperiment.' }} />
);

// ===== SCREEN 6 — EKSPERIMENT HISOBLAGICHI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [prog, setProg] = useState(storedAnswer ? 30 : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const runningRef = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const done = prog >= 30;
  const run = () => {
    if (runningRef.current || done) return;
    runningRef.current = true; setRunning(true); setProg(0);
    const tick = (d) => { setProg(d); if (d < 30) { timer.current = setTimeout(() => tick(Math.min(d + 2, 30)), 110); } else { setRunning(false); runningRef.current = false; } };
    timer.current = setTimeout(() => tick(2), 200);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const manualNow = Math.round(MANUAL_EXP * (prog / 30));
  const cicdNow = Math.round(CICD_EXP * (prog / 30));
  return (
    <Stage eyebrow="Eksperiment hisoblagichi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '1 oyni simulyatsiya qiling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">1 oy: <span className="italic" style={{ color: T.accent }}>nechta eksperiment</span> qila olasiz?</h2></div>
        <Mentor>"1 oyni simulyatsiya qiling"ni bosing — oy o'tadi. Qo'lda deploy va CI/CD bilan nechta eksperiment (reliz) chiqishini sanab ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="exp-cards">
              <div className="exp-card" style={{ borderColor: T.accent }}>
                <div className="exp-top"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.clock(18)}</span><span className="exp-lbl">Qo'lda deploy</span></div>
                <div className="exp-num" style={{ color: T.accent }}>{manualNow}</div>
                <div className="exp-bar"><div className="exp-fill" style={{ width: `${(manualNow / CICD_EXP) * 100}%`, background: T.accent }} /></div>
              </div>
              <div className="exp-card" style={{ borderColor: T.success }}>
                <div className="exp-top"><span style={{ display: 'inline-flex', color: T.success }}>{Ico.bolt(18)}</span><span className="exp-lbl">CI/CD</span></div>
                <div className="exp-num" style={{ color: T.success }}>{cicdNow}</div>
                <div className="exp-bar"><div className="exp-fill" style={{ width: `${(cicdNow / CICD_EXP) * 100}%`, background: T.success }} /></div>
              </div>
            </div>
            <div className="exp-month"><span className="mono small" style={{ color: T.ink2 }}>{prog === 0 ? 'Oy boshlanmadi' : prog >= 30 ? '30-kun · oy tugadi' : `${prog}-kun…`}</span></div>
            {!done && <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ display: 'inline-flex' }}>{Ico.clock(17)}</span>{running ? `${prog}-kun…` : '1 oyni simulyatsiya qilish'}</button>}
          </Col>
          <Col>
            {!done && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Qo'lda: har reliz 2 soat + qo'rquv → oyiga ~4. CI/CD: 5 daqiqa + ishonch → kuniga ~1.</p></div>}
            {done && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>🧪</div><p className="ta-h">30 vs 4 — qariyb 7× ko'p!</p><p className="ta-sub">CI/CD bilan bir oyda 7 barobar ko'p eksperiment. Ko'p eksperiment = tez o'rganish = raqobat ustunligi</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — KO'P EKSPERIMENT = TEZ O'RGANISH =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('few');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['few', 'many']) : new Set(['few']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Eksperiment = o'rganish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har eksperiment — bir <span className="italic" style={{ color: T.accent }}>dars</span></h2></div>
        <Mentor>Har reliz foydalanuvchidan javob keltiradi: ishladimi yoki yo'q. Ko'p eksperiment = ko'p dars. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'few' ? 'chip-on' : ''}`} onClick={() => set('few')}>🐢 Kam eksperiment</button>
              <button className={`chip ${v === 'many' ? 'chip-on' : ''}`} onClick={() => set('many')}>🚀 Ko'p eksperiment</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'many' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'many' ? '📈' : '❓'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'few'
                ? 'Oyiga 4 reliz → 4 marta o\'rganasiz. Qaysi g\'oya ishlashini bilish uchun oylar ketadi.'
                : 'Oyiga 30 reliz → 30 marta o\'rganasiz. Ishlamaydiganini darrov tashlab, ishlaydiganini topasiz.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'few'
              ? <div className="frame-warn fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>Sekin o'rganish — raqobatchi sizdan oldin to'g'ri yo'lni topadi.</p></div>
              : <div className="frame-success fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Tez o'rganish — birinchi bo'lib to'g'ri yechimni topasiz.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>CI/CD = ko'p eksperiment = tez o'rganish. Mana shu raqobat ustunligi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MOSLASH: qo'l ishi ↔ CI/CD nima beradi =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const GIVES = [
    { id: 'fear', text: 'Testlar himoyalaydi — ishonch bilan relizlaysiz' },
    { id: 'install', text: 'CI/CD o\'zi qiladi — vaqt tejaladi' },
    { id: 'deploy', text: 'Avtomatik deploy — xato kamayadi' },
    { id: 'test', text: 'Har push\'da avtomatik — unutmaysiz' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(PAIRS.map(p => [p.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= PAIRS.length;
  const pickF = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickC = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(12px,1.5vw,13.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Moslash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${PAIRS.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har <span className="italic" style={{ color: T.accent }}>qo'l ishi</span> — CI/CD nima beradi?</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>qo'l ishini</b>, keyin <b style={{ color: T.ink }}>CI/CD nima berishini</b> bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">Qo'l ishi / og'riq</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PAIRS.map(p => { const m = matched[p.id]; const on = sel === p.id; return (<button key={p.id} onClick={() => pickF(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.accent, display: 'inline-flex' }}>{m ? Ico.check(17) : Ico.clock(15)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p.feat}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">CI/CD nima beradi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {GIVES.map(c => { const m = matched[c.id]; const isWrong = wrong === c.id; return (<button key={c.id} onClick={() => pickC(c.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(16) : Ico.bolt(15)}</span><span style={{ flex: 1 }}>{c.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqasi uchun. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har qo'l ishi CI/CD bilan yengillashadi — tezlik shundan keladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="PM nuqtai nazaridan CI/CD aslida nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>PM uchun CI/CD <span className="italic" style={{ color: T.accent }}>aslida nima</span>?</h2></>}
    options={['Faqat dasturchilar uchun texnik vosita', 'Mahsulot eksperimentlari uchun infratuzilma', 'Dizayn dasturi', 'Ma\'lumotlar bazasi']} correctIdx={1}
    explainCorrect="To'g'ri! PM uchun CI/CD — tez va arzon eksperiment qilish imkoniyati. U mahsulotni tez sinab, o'rganib, yaxshilash infratuzilmasi."
    explainWrong={{ 0: 'Texnik ham, lekin PM uchun u — eksperiment infratuzilmasi.', 2: 'Dizayn emas — reliz avtomatlashtirish.', 3: 'Baza emas — reliz quvuri (pipeline).', default: 'CI/CD = eksperiment infratuzilmasi.' }} />
);

// ===== SCREEN 10 — EKSPERIMENT MADANIYATI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('noci');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['noci', 'withci']) : new Set(['noci']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'noci' ? NOCI : WITHCI;
  const col = v === 'noci' ? T.accent : T.success;
  return (
    <Stage eyebrow="Eksperiment madaniyati" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">CI/CD <span className="italic" style={{ color: T.accent }}>eksperiment madaniyatini</span> ochadi</h2></div>
        <Mentor>Reliz arzon bo'lganda jamoa boshqacha o'ylaydi: "sinab ko'raylik!". Ikki madaniyatni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'noci' ? 'chip-on' : ''}`} onClick={() => set('noci')}>🚫 CI/CD'siz</button>
              <button className={`chip ${v === 'withci' ? 'chip-on' : ''}`} onClick={() => set('withci')}>✅ CI/CD bilan</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'noci' ? Ico.x(15) : Ico.beaker(15)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'noci'
              ? <div className="frame-warn fade-step" key="n"><p className="body" style={{ margin: 0, color: T.ink }}>Reliz qimmat — faqat "ishonchli" katta o'zgarishlar qilinadi. Jasur g'oyalar sinalmay qoladi.</p></div>
              : <div className="frame-success fade-step" key="w"><p className="body" style={{ margin: 0, color: T.ink }}>Reliz arzon — kichik g'oyalar ham sinaladi. A/B test, narx sinash — hammasi mumkin.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Eng yaxshi mahsulotlar — ko'p sinaganlardan chiqadi. CI/CD shuni mumkin qiladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEZ RELIZ XAVFLI EMASMI? =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('reckless');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['reckless', 'safe']) : new Set(['reckless']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tez ≠ beparvo" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tez reliz <span className="italic" style={{ color: T.accent }}>xavfli emasmi</span>?</h2></div>
        <Mentor>"Tez" degani "beparvo" degani emas. CI/CD tezlikni <b style={{ color: T.ink }}>xavfsiz</b> qiladi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'reckless' ? 'chip-on' : ''}`} onClick={() => set('reckless')}>😬 Tez + beparvo</button>
              <button className={`chip ${v === 'safe' ? 'chip-on' : ''}`} onClick={() => set('safe')}>🛡️ Tez + xavfsiz</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'safe' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'safe' ? '🛡️' : '💥'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'reckless'
                ? 'Tekshiruvsiz tez reliz — buglar foydalanuvchiga yetadi. Bu xavfli.'
                : 'CI/CD: har reliz test va lint darvozasidan o\'tadi. Tez, lekin sifat ushlab turiladi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'reckless'
              ? <div className="frame-warn fade-step" key="r"><p className="body" style={{ margin: 0, color: T.ink }}>Darvozasiz tezlik — xavf. Bu CI/CD emas, shoshqaloqlik.</p></div>
              : <div className="frame-success fade-step" key="s"><p className="body" style={{ margin: 0, color: T.ink }}>CI/CD = tezlik + avtomatik sifat darvozalari. Tez VA ishonchli.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>CI/CD tezlikni test bilan birga beradi — shuning uchun tez relizlasa ham xavfsiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Tez reliz qilish nega beparvolik emas?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tez reliz nega <span className="italic" style={{ color: T.accent }}>beparvolik emas</span>?</h2></>}
    options={['Chunki tezlik doim xavfli', 'Chunki CI/CD har relizni test va lint darvozasidan o\'tkazadi', 'Chunki hech kim tekshirmaydi', 'Beparvolik aslida']} correctIdx={1}
    explainCorrect="To'g'ri! CI/CD tezlikni avtomatik sifat darvozalari (test, lint) bilan beradi. Shu sabab tez relizlasa ham bug foydalanuvchiga yetmaydi."
    explainWrong={{ 0: 'Tezlik darvozalar bilan xavfsiz bo\'ladi.', 2: 'Aksincha — CI/CD avtomatik tekshiradi.', 3: 'Aksincha — darvozalar tufayli xavfsiz.', default: 'CI/CD avtomatik test/lint darvozalari beradi.' }} />
);

// ===== SCREEN 13 — NAMUNA (hikoya) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CASE_AC.map((_, i) => i)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= CASE_AC.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active !== null ? CASE_AC[active] : null;
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${CASE_AC.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>tezlik g'oyani yengdi</span></h2></div>
        <Mentor>Ikki kompaniyaning yo'li — 4 qadam. Har qatorni bosib, tezlik nega yutganini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.rocket(16)}</span><span className="cl-title">A vs B — tezlik hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sekin g'oya → tez iteratsiya → B yutdi. Endi o'zingiz hisoblaysiz.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Tezlik — <span className="italic" style={{ color: T.accent }}>raqobat ustunligi</span></h2></div>
      <Mentor>Yodda tuting: iteratsiya tezligi yutadi, CI/CD eksperiment infratuzilmasi, va tez reliz darvozalar bilan xavfsiz.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🚀</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Tez sina, tez o'rgan</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Ko'p eksperiment — to'g'ri yo'lni birinchi topadi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">3 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.refresh(18), c: T.accent, t: 'ITERATSIYA tezligi yutadi' }, { ic: Ico.beaker(18), c: T.blue, t: 'CI/CD = eksperiment infratuzilmasi' }, { ic: Ico.flag(18), c: T.success, t: 'TEZ + xavfsiz (darvozalar bilan)' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: eksperiment soni =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['CI/CD\'siz: oyiga nechta reliz/eksperiment va nega…', 'CI/CD bilan: oyiga nechta va nega…', 'Bu farq mahsulotga nima beradi…'];
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
  const LBL = ['CI/CD\'siz', 'CI/CD bilan', 'Farq nima beradi'];
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangiz: oyiga <span className="italic" style={{ color: T.accent }}>nechta eksperiment</span>?</h2></div>
        <Mentor>Hisoblang: loyihangizda CI/CD <b style={{ color: T.ink }}>bilan</b> va <b style={{ color: T.ink }}>bilmasdan</b> oyiga nechta reliz/eksperiment qila olasiz va bu farq nima beradi? Kamida 2 ta yozing.</Mentor>
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
            <p className="flow-label">Sizning hisobingiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — hisobingiz shu yerda paydo bo'ladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.beaker(15)}</span><span className="cl-title">Eksperiment hisobi</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi CI/CD nega raqobat ustunligi ekanini raqam bilan tushuntira olasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Iteratsiya tezligi yutadi — zo\'r g\'oya emas', 'CI/CD = mahsulot eksperimentlari infratuzilmasi', 'Arzon reliz → ko\'p eksperiment → tez o\'rganish', 'Tez + xavfsiz (test va lint darvozalari)'];
  const HOMEWORK = [{ b: 'Loyihangizni o\'lchang', t: '— hozir oyiga nechta reliz qila olasiz?' }, { b: 'To\'siqlarni toping', t: '— qaysi qo\'l ishi sizni sekinlashtiradi?' }, { b: 'Bitta eksperiment rejalang', t: '— CI/CD bo\'lsa nimani sinab ko\'rardingiz?' }];
  const GLOSSARY = [{ b: 'Iteratsiya', t: '— qur→relizla→o\'rgan→yaxshila halqasi' }, { b: 'CI/CD', t: '— reliz quvurini avtomatlashtirish' }, { b: 'Eksperiment', t: '— g\'oyani relizlab, natijani o\'lchash' }, { b: 'Deploy', t: '— mahsulotni serverga chiqarish' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi tezlik — siz uchun <span className="italic" style={{ color: T.accent }}>raqobat ustunligi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Iteratsiya tezligi, eksperiment infratuzilmasi va tez+xavfsiz relizni bilasiz. Endi keyingi darsda GitHub Actions bilan shu konveyerni quramiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <Zoomable><div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Tezlik ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Tez sina, tez o'rgan — birinchi bo'l! 🚀</p></div>
        </div></Zoomable>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>⚙️</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi dars: GitHub Actions</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Endi shu tezlikni beradigan konveyerni o'z qo'lingiz bilan quramiz — birinchi workflow.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson17({ lang: langProp, onFinished }) {
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

        /* === ITERATSIYA HALQASI (s2) === */
        .loop-ring { position: relative; width: 100%; max-width: 280px; aspect-ratio: 1; margin: 4px auto; }
        .loop-node { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 12px; padding: 8px 11px; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.2); }
        .loop-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink}; }
        .ln-0 { top: 0; left: 50%; transform: translateX(-50%); } .ln-1 { top: 50%; right: 0; transform: translateY(-50%); } .ln-2 { bottom: 0; left: 50%; transform: translateX(-50%); } .ln-3 { top: 50%; left: 0; transform: translateY(-50%); }
        .loop-spin { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); animation: spin 4s linear infinite; }
        .lr-fast .loop-spin { animation-duration: 1s; }
        @keyframes spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }

        /* === EKSPERIMENT HISOBLAGICHI (s6) === */
        .exp-cards { display: flex; flex-direction: column; gap: 10px; }
        .exp-card { background: ${T.paper}; border-radius: 14px; padding: 13px 15px; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.16); border-left: 4px solid; }
        .exp-top { display: flex; align-items: center; gap: 8px; }
        .exp-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .exp-num { font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(32px,7vw,46px); line-height: 1; margin: 4px 0 6px; }
        .exp-bar { height: 8px; background: ${T.bg}; border-radius: 99px; overflow: hidden; }
        .exp-fill { height: 100%; border-radius: 99px; transition: width 0.2s linear; }
        .exp-month { text-align: center; padding: 4px 0; }

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

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
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
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
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
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
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
