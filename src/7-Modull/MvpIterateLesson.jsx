import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · KOD/PROYEKT-AI — FIDBEK ITERATSIYASI — v16 (AUDIOSIZ)
// G'oya: mahsulot — aylanuvchi charx (qur→o'lcha→o'rgan). Fidbekни prioritetlab, AI bilan tuzat, metrikани o'lcha.
// Hook: Slack pivoti — o'yin quladi, chat qoldi (fidbekни eshitish).
// Signature 1: Fidbek → prioritet matritsasi (ta'sir × mehnat 2×2).
// Signature 2: Signal vs shovqin o'yini (pattern/metrika vs bitta ovoz).
// Signature 3: Sikl yopiladi — Shimoliy yulduz metrikasi count-up bilan ko'tariladi.
// Yakuniy ish: ITERATSIYA rejasi — portfolio 13-sahifa.
// Davomiylik: 104-friction → 100-metrika → 101-AI fix (explain gate). Aziz #12.
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
  loop: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" /><path d="M20 4v4h-4" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" /><path d="M4 20v-4h4" /></svg>),
  code: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M8 8l-4 4 4 4" /><path d="M16 8l4 4-4 4" /><path d="M13 6l-2 12" /></svg>),
  grid: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v16M4 12h16" /></svg>),
  volume: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" /></svg>),
  mute: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>),
  chart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 20V4M4 20h16" /><path d="M7 15l4-4 3 3 5-6" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>)
};

const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Kw = ({ children }) => <span style={{ color: CODE.kw }}>{children}</span>;
const Fn = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Pn = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;

const LESSON_META = { lessonId: 'mvp-iterate-105-v16', lessonTitle: { uz: 'Fidbek iteratsiyasi', ru: 'Итерация по обратной связи' } };
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
// s2 — qur → o'lcha → o'rgan sikli
const LOOP_NODES = [
  { id: 'build', t: 'QUR', ic: '🔨', color: T.accent, d: 'Kichik o\'zgarish yasa (bitta tuzatish, bitta ficha).' },
  { id: 'measure', t: 'O\'LCHA', ic: '📊', color: T.blue, d: 'Metrikага qara: yaxshilandimi? (analitika, 100-dars).' },
  { id: 'learn', t: 'O\'RGAN', ic: '💡', color: T.grape, d: 'Xulosa chiqar: ishladimi? Keyin nima? — va yana QUR.' }
];

// s5 — prioritet matritsasi (SIGNATURE 1)
const QMAP = {
  now: { emoji: '🔥', label: 'HOZIR QIL', color: T.success, hint: 'katta ta\'sir · kam mehnat' },
  plan: { emoji: '📅', label: 'REJALASHTIR', color: T.honey, hint: 'katta ta\'sir · ko\'p mehnat' },
  quick: { emoji: '⚡', label: 'TEZ QILIB QO\'Y', color: T.blue, hint: 'kam ta\'sir · kam mehnat' },
  skip: { emoji: '🗑️', label: 'TASHLA', color: T.ink2, hint: 'kam ta\'sir · ko\'p mehnat' }
};
const FEEDBACK_ITEMS = [
  { id: 'f1', t: 'Eslatma tugmasini topolmaydi (3/5 sinovchi — aktivatsiyani tushiryapti)', ans: 'now', why: 'Katta ta\'sir (Shimoliy yulduz!) + kam mehnat (tugma joyini o\'zgartirish). Klassik «hozir qil».' },
  { id: 'f2', t: 'Push-eslatma «avtobus 5 daqiqada» — foydali, lekin katta ish', ans: 'plan', why: 'Katta ta\'sir, lekin ko\'p mehnat. Tashlanmaydi — rejaga qo\'yiladi (keyingi sprint).' },
  { id: 'f3', t: 'Yozuv shriftini 2px kattalashtirish (buvi aytdi)', ans: 'quick', why: 'Kam ta\'sir (1/5), lekin 2 daqiqalik ish. Yo\'l-yo\'lakay tez qilib qo\'yiladi.' },
  { id: 'f4', t: 'Butun shahar transport xaritasi qo\'shish (1 user)', ans: 'skip', why: 'Kam ta\'sir (core jobga aloqasiz) + ulkan mehnat. Tashlanadi — MVP qotili.' }
];

// s7 — signal vs shovqin o'yini (SIGNATURE 2)
const SIGNAL_ITEMS = [
  { id: 's1', t: '5 sinovchidan 3 tasi bir xil joyда qoqildi', ans: 'signal', why: 'Pattern — takror = signal. Dizayn muammosi, harakat qilamiz.' },
  { id: 's2', t: 'Bitta user «menga qizil rang yoqmaydi» dedi', ans: 'noise', why: 'Bir ovoz + shaxsiy did. Metrika yoki patternга bog\'liq emas — belgilab qo\'yamiz.' },
  { id: 's3', t: 'Aktivatsiya metrikasi hafta ichида tushib ketdi (100)', ans: 'signal', why: 'Metrika — obyektiv signal. Nima buzildi? Darrov tekshiramiz.' },
  { id: 's4', t: 'Do\'stim «AI chatbot qo\'sh» deб maslahat berdi', ans: 'noise', why: 'Mavzudan tashqari + bir ovoz. Core job — avtobus vaqti; chatbot boshqa mahsulot.' },
  { id: 's5', t: 'Ko\'p user eslatma bosqichида voronkадан chiqib ketyapti', ans: 'signal', why: 'Pattern + metrika birga. Kuchli signal — aynan shu bosqichni tuzatamiz.' },
  { id: 's6', t: 'Bitta user «zo\'r, hech nima o\'zgartirma» dedi', ans: 'noise', why: 'Maqtov — yoqimli, lekin harakat uchun ma\'lumot bermaydi. Belgilab qo\'yamiz.' }
];
const SGMAP = { signal: { emoji: '🔊', label: 'SIGNAL', color: T.success }, noise: { emoji: '🔇', label: 'SHOVQIN', color: T.ink2 } };

// s10 — metrika (SIGNATURE 3)
const METRIC_BEFORE = 34; // aktivatsiya % (210/620)
const METRIC_AFTER = 61;  // fixdan keyin (380/620)

// s11 — iteratsiya drilli yo'q; s13 case; s3 fikr

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// s15 — Iteratsiya rejasi (portfolio 13-sahifa)
const ITER_FIELDS = [
  { key: 'fix1', label: 'Birinchi tuzatish (eng kritik — 104-dan)', emoji: '🔥', color: T.accent, min: 6, hint: 'Eslatma tugmasini yuqoriga, kattaroq' },
  { key: 'fix2', label: 'Ikkinchi tuzatish', emoji: '📅', color: T.honey, min: 5, hint: 'Yo\'nalish nomlarini aniqroq' },
  { key: 'prompt', label: 'AI fix prompt (qisqacha)', emoji: '🪄', color: T.grape, min: 10, hint: 'Eslatma tugmasini ekran tepasiga, katta va aniq' },
  { key: 'metric', label: 'Qaysi metrika ko\'tariladi (kutilgan)', emoji: '📈', color: T.blue, min: 5, hint: 'Aktivatsiya (eslatma yoqqanlar) %' },
  { key: 'noise', label: 'E\'tiborsiz qoldiradigan shovqin', emoji: '🔇', color: T.ink2, min: 5, hint: 'Bitta userning rang haqidagi fikri' },
  { key: 'loop', label: 'Qanday bilaman ishlаganини (keyingi o\'lchov)', emoji: '🔁', color: T.success, min: 6, hint: 'Bir haftадан keyin aktivatsiya %ini qayta o\'lchayman' }
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

// Xavfsiz count-up
const CountUp = ({ to, dur = 1100, run = true }) => {
  const [val, setVal] = useState(run ? 0 : to);
  useEffect(() => {
    if (!run) { setVal(to); return; }
    let raf, t0 = null;
    const tick = (now) => {
      if (t0 === null) t0 = now;
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const guard = setTimeout(() => { cancelAnimationFrame(raf); setVal(to); }, dur + 400);
    return () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [to, run, dur]);
  return <>{val}</>;
};

const CodeCard = ({ file, children }) => (
  <div className="spec-card">
    <div className="code-file"><span className="cdot" style={{ background: '#FF605C' }} /><span className="cdot" style={{ background: '#FFBD44' }} /><span className="cdot" style={{ background: '#00CA4E' }} /><span className="code-name">{file}</span></div>
    <pre className="code-pre">{children}</pre>
  </div>
);

// Iteratsiya rejasi hujjati (s15)
const IterDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.loop(16)}</span><span>Iteratsiya rejasi · 13-sahifa</span></div>
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
        <div className={`arc-chip ${i === 3 ? 'arc-here' : ''}`}>
          <span style={{ fontSize: 14 }}>{s.ic}</span>
          <span className="arc-t">{s.t}</span>
          {i < 3 && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(11)}</span>}
          {i === 3 && <span className="arc-you">1/4</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: SLACK PIVOTI =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'O\'yinni davom ettirsin — ko\'proq mehnat qilsin' },
    { id: 'b', label: 'Fidbekni eshitsin — chat vositasига o\'tsin' },
    { id: 'c', label: 'Kompaniyani yopsin' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Isbot qil bosqichi" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>O'yin quladi. Lekin <span className="italic" style={{ color: T.accent }}>bitta narsa qoldi.</span></h1>
        <Mentor>MVP chiqdi va sinaldi (103–104). Endi Isbot qil bosqichi: fidbekni eshitib, mahsulotni yaxshilaymiz. Bugungi hikoya — bu san'atning eng mashhur namunasi.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>🎮 TINY SPECK · 2012</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Bir jamoa «Glitch» degan onlayn o'yin qurdi. O'yin muvaffaqiyatsiz — deyarli hech kim o'ynamadi. Lekin jamoa o'zi ishlash uchun kichik <b>ichki chat vositasi</b> yasagan edi — va uni HAMMA yaxshi ko'rardi.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Jamoa nima qilishi kerak edi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : ''}Ular o'yinni tashlab, <b>chat vositasini mahsulotга aylantirdi</b>. Nomini <b>Slack</b> qo'yishdi — bugun u milliardlab dollarlik kompaniya. Sirri: <b>fidbekni eshitdi</b> — nima ishlayotganini ko'rib, o'sha tomonga burildi. Bugun shu san'atni o'rganamiz: fidbek → yaxshilanish.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Qur → o\'lcha → o\'rgan sikli', tag: '' },
    { text: 'Fidbek → prioritet matritsasi', tag: 'o\'yin' },
    { text: 'Signal vs shovqin', tag: 'o\'yin' },
    { text: 'AI bilan tuzatish + metrika ko\'tariladi', tag: 'jonli' },
    { text: 'ITERATSIYA rejasi — portfolio 13-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.loop(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Fidbekni yaxshilanishga</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>104-friction'larни prioritetlab, AI bilan tuzatib, metrikани o'lchaymiz.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Isbot qil bosqichi · 1-dars. Keyingisi: pitch 🎤</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Iteratsiya: <span className="italic" style={{ color: T.accent }}>charxni aylantiramiz</span></h2></div>
        <Mentor>Mahsulot — bir marta yasaladigan haykal emas, <b style={{ color: T.ink }}>aylanuvchi charx</b>. Bugun charxni bir marta aylantiramiz: fidbek → tuzatish → metrika. Va bu — cheksiz takrorlanadi.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — QUR → O'LCHA → O'RGAN SIKLI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(LOOP_NODES.map(n => n.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? LOOP_NODES[0].id : null);
  const done = seen.size >= LOOP_NODES.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? LOOP_NODES.find(n => n.id === active) : null;
  return (
    <Stage eyebrow="Lean sikli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Charxning uch tishi: <span className="italic" style={{ color: T.accent }}>qur → o'lcha → o'rgan</span></h2></div>
        <Mentor>Eric Ries («Lean Startup») bu siklni mashhur qildi. Bir marta emas — DOIM aylanadi. Har tishни bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="loop-ring fade-up delay-1">
              {LOOP_NODES.map((n, i) => { const on = seen.has(n.id); return (
                <React.Fragment key={n.id}>
                  <button className={`loop-node ${active === n.id ? 'loop-act' : ''}`} onClick={() => tap(n.id)} style={{ '--nc': n.color, boxShadow: on ? `inset 0 0 0 2px ${n.color}` : undefined }}>
                    <span style={{ fontSize: 22 }}>{n.ic}</span>
                    <span className="loop-t" style={{ color: on ? n.color : T.ink2 }}>{n.t}</span>
                  </button>
                  {i < LOOP_NODES.length - 1 && <span className="loop-arrow">→</span>}
                </React.Fragment>
              ); })}
              <span className="loop-back"><span style={{ display: 'inline-flex', color: T.grape }}>{Ico.loop(15)}</span> yana boshdan</span>
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: `${cur.color}1A` }}>{cur.ic} {cur.t}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tishni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muhimi: sikl <b>tez va kichik</b> bo'lsin. Katta o'zgarish — sekin aylanish, kech o'rganish. Kichik tuzatish → tez o'lchov → tez saboq. Ko'p marta aylantirgan g'olib.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — HAMMA FIDBEK TENG EMAS =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  return (
    <Stage eyebrow="Fidbek vazni" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Ikki o\'lchovni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hamma fidbek <span className="italic" style={{ color: T.accent }}>teng emas</span></h2></div>
        <Mentor>Yuzlab fidbek keladi — hammasini tuzatib bo'lmaydi. Qaysи biri muhim? Ikki o'lchov yordam beradi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.accent}` }}>
              <p className="note-h" style={{ color: T.accent }}>1️⃣ Nechta odam? (chastota)</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>3/5 sinovчи bir xil muammoни aytdimi (104)? Bu — pattern, kuchli. 1/5 — kuchsizroq. Ko'p takror = muhimroq.</p>
            </div>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.blue}` }}>
              <p className="note-h" style={{ color: T.blue }}>2️⃣ Metrikага ta'siri? (Shimoliy yulduz)</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Bu muammo aktivatsiya yoki retention'ni tushiryaptimi (100)? Metrikани qimirlatadigan fidbek — eng qimmatli.</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', background: T.grapeSoft, boxShadow: 'none' }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Ikki o'lchov birlashса — kuchli signal: <b>«eslatma tugmasi» 3/5 sinovчида qoqildi VA aktivatsiyani tushiryapti</b>. Mana — birinchi tuzatiladigan narsa.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Tushundim</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu ikki o'lchov — sizning filtringiz. «Menга yoqmadi» degan bitta ovoz — kuchsiz. «Ko'p odam + metrika» — kuchli. Endi buni matritsага solamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Qur → o'lcha → o'rgan sikli nima uchun?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Iteratsiya sikli <span className="italic" style={{ color: T.accent }}>nima beradi</span>?</h2></>}
    options={['Mahsulotни bir marta mukammal qilish', 'Kichik o\'zgarish → o\'lchov → saboq → yana; har aylanish mahsulotni yaxshilaydi', 'Ko\'proq ficha qo\'shish', 'Fidbekni e\'tiborsiz qoldirish']} correctIdx={1}
    explainCorrect="To'g'ri! Qur→o'lcha→o'rgan — aylanuvchi sikl. Kichik o'zgarish yasaysiz, metrikani o'lchaysiz, saboq chiqarasiz va yana aylantirasiz. Slack shunday topildi. Ko'p va tez aylantirgan g'olib."
    explainWrong={{ 0: 'Bir marta mukammal — mumkin emas. Iteratsiya — doimiy.', 2: 'Ko\'proq ficha emas — o\'lchanadigan yaxshilanish.', 3: 'Aksincha — fidbekni eshitib, o\'rganadi.', default: 'Qur → o\'lcha → o\'rgan → yana.' }} />
);

// ===== SCREEN 5 — PRIORITET MATRITSASI (SIGNATURE 1) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(FEEDBACK_ITEMS.map(f => [f.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = FEEDBACK_ITEMS.filter(f => state[f.id]?.ok).length;
  const done = okCount >= FEEDBACK_ITEMS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (f, ans) => {
    if (state[f.id]?.ok) return;
    const ok = ans === f.ans;
    setState(prev => ({ ...prev, [f.id]: { ok, wrong: !ok } }));
    setLast({ id: f.id, ok, why: f.why, ans: f.ans });
  };
  return (
    <Stage eyebrow="Prioritet matritsasi · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Matritsага joylang (${okCount}/${FEEDBACK_ITEMS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har fidbekни <span className="italic" style={{ color: T.accent }}>ta'sir × mehnat</span> bo'yicha joylang</h2></div>
        <Mentor>Ikki savol: <b style={{ color: T.ink }}>ta'siri katta-mi?</b> (metrika/chastota) va <b style={{ color: T.ink }}>mehnat kam-mi?</b> Katta ta'sir + kam mehnat = 🔥 HOZIR QIL.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEEDBACK_ITEMS.map(f => {
                const st = state[f.id] || {};
                return (
                  <div key={f.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{f.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: QMAP[f.ans].color }}>{QMAP[f.ans].emoji} {QMAP[f.ans].label}</span>
                      : <span className="sort-btns">{['now', 'plan', 'quick', 'skip'].map(a => (<button key={a} className="sort-btn" title={`${QMAP[a].label} — ${QMAP[a].hint}`} onClick={() => pick(f, a)}>{QMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Matritsa (ta'sir ↕ · mehnat ↔)</p>
            <div className="matrix">
              <div className="mcell" style={{ '--mc': T.success }}><span className="memoji">🔥</span><b>HOZIR QIL</b><span>katta ta'sir<br />kam mehnat</span></div>
              <div className="mcell" style={{ '--mc': T.honey }}><span className="memoji">📅</span><b>REJALASHTIR</b><span>katta ta'sir<br />ko'p mehnat</span></div>
              <div className="mcell" style={{ '--mc': T.blue }}><span className="memoji">⚡</span><b>TEZ QILIB QO'Y</b><span>kam ta'sir<br />kam mehnat</span></div>
              <div className="mcell" style={{ '--mc': T.ink3 }}><span className="memoji">🗑️</span><b>TASHLA</b><span>kam ta'sir<br />ko'p mehnat</span></div>
            </div>
            {last && <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)} style={{ marginTop: 4 }}><p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? `✓ ${QMAP[last.ans].emoji} ${QMAP[last.ans].label}` : '✗ Qayta o\'ylang'}</p><p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Ta\'siri katta-mi (metrika/chastota)? Mehnat kam-mi? Ikkalasига javob bering.'}</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi navbatda — <b>🔥 HOZIR QIL</b> kvadranti (eslatma tugmasi). Katta foyda, kam mehnat. Boshqa hammasi kutadi. Prioritet — dalilga asoslangan.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Qaysi fidbekni birinchi tuzatasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Birinchi <span className="italic" style={{ color: T.accent }}>nimani tuzatasiz</span>?</h2></>}
    options={['Katta ta\'sir, lekin ko\'p mehnat talab qiladigани', 'Katta ta\'sir + kam mehnat (🔥 hozir qil)', 'Kam ta\'sir, lekin qiziq bo\'lgани', 'Eng oxirgi kelgani']} correctIdx={1}
    explainCorrect="To'g'ri! «Hozir qil» kvadranti — katta ta'sir + kam mehnat. Eng katta foyda, eng kam kuch: eng aqlli birinchi qadam. Katta+ko'p mehnat — rejaga; kam ta'sir — kutadi."
    explainWrong={{ 0: 'Katta ta\'sir yaxshi, lekin ko\'p mehnat — rejaga qo\'yiladi, birinchi emas.', 2: 'Qiziqlik — mezon emas. Ta\'sir va mehnat.', 3: 'Kelish tartibi ahamiyatsiz — ta\'sir muhim.', default: 'Katta ta\'sir + kam mehnat = birinchi.' }} />
);

// ===== SCREEN 6 — SIGNAL vs SHOVQIN =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('noise');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['noise', 'signal']) : new Set(['noise']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isNoise = v === 'noise';
  return (
    <Stage eyebrow="Signal vs shovqin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Baland ovoz ≠ <span className="italic" style={{ color: T.accent }}>muhim ovoz</span></h2></div>
        <Mentor>«Vokal ozchilik» tuzog'i: bitta odam baland-baland talab qiladi, siz hammasini tashlab o'shani qilasiz. Lekin baland ovoz — signal degani emas. Ikkisini farqlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isNoise ? 'chip-on' : ''}`} onClick={() => set('noise')}>🔇 Shovqin</button>
              <button className={`chip ${!isNoise ? 'chip-on' : ''}`} onClick={() => set('signal')}>🔊 Signal</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isNoise ? T.ink3 : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isNoise
                ? 'Bitta baland ovoz: «Menга bu rang yoqmaydi! AI chatbot qo\'shing! Darhol!» — u ko\'p gapiradi, lekin U BITTA odam va shaxsiy did. Metrika ham, pattern ham buni tasdiqlamaydi. Bu — shovqin.'
                : 'Ko\'pchilikда takrorlangan yoki metrikада ko\'ringan: «5 dан 3 tasi eslatма tugmасида qoqildi VA aktivatsiya tushdi». Hech kim baqirmaydi — lekin DALIL kuchli. Bu — signal.'}</p>
            </div>
          </Col>
          <Col>
            {isNoise
              ? <div className="frame-warn fade-step" key="n"><p className="body" style={{ margin: 0, color: T.ink }}>Shovqin ortidan quvsangiz — signalни boy berasiz. Baland talab qiluvchи 1 kishi uchun 3/5 pattern e'tiborsiz qoladi. Ovoz balandligiга aldanmang.</p></div>
              : <div className="frame-success fade-step" key="s"><p className="body" style={{ margin: 0, color: T.ink }}>Signal jim bo'lishi mumkin — metrikада, patternда. Sizning ishingiz — baqiroqni emas, DALILNI eshitish. Raqam va takror gapiradi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Filtr: <b>pattern bormi? metrikага bog'liqmi?</b> Ha — signal. Bitta ovoz + shaxsiy did + metrikасиз — shovqin. Endi o'yinда mashq qilamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SIGNAL vs SHOVQIN O'YINI (SIGNATURE 2) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(SIGNAL_ITEMS.map(s => [s.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = SIGNAL_ITEMS.filter(s => state[s.id]?.ok).length;
  const done = okCount >= SIGNAL_ITEMS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (s, ans) => {
    if (state[s.id]?.ok) return;
    const ok = ans === s.ans;
    setState(prev => ({ ...prev, [s.id]: { ok, wrong: !ok } }));
    setLast({ id: s.id, ok, why: s.why, ans: s.ans });
  };
  return (
    <Stage eyebrow="Signal vs shovqin · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ajrating (${okCount}/${SIGNAL_ITEMS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har fidbek: <span className="italic" style={{ color: T.accent }}>🔊 signal yoki 🔇 shovqin?</span></h2></div>
        <Mentor>Savol: <b style={{ color: T.ink }}>«Pattern bormi (ko'p odam) yoki metrikага bog'liqmi?»</b> Ha — signal (harakat). Bitta ovoz / shaxsiy did / maqtov — shovqin (belgilab qo'y).</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SIGNAL_ITEMS.map(s => {
                const st = state[s.id] || {};
                return (
                  <div key={s.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{s.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: SGMAP[s.ans].color }}>{SGMAP[s.ans].emoji} {SGMAP[s.ans].label}</span>
                      : <span className="sort-btns">{['signal', 'noise'].map(a => (<button key={a} className="sort-btn" title={SGMAP[a].label} onClick={() => pick(s, a)}>{SGMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🔊 Signal ajratildi</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{SIGNAL_ITEMS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / SIGNAL_ITEMS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? `✓ ${SGMAP[last.ans].emoji} ${SGMAP[last.ans].label}` : '✗ Qayta o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Pattern (ko\'p odam) yoki metrika bormi? Ha — signal. Bitta ovoz/did/maqtov — shovqin.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Fidbek yonidagi 🔊 yoki 🔇 ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 signal (pattern/metrika) — harakat qilamiz; 3 shovqin (bir ovoz/did/maqtov) — belgilab qo'yamiz. Signalни eshit, shovqinга aldanma. Endi eng kuchli signalни AI bilan tuzatamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — AI BILAN TUZATISH =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('rewrite');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['rewrite', 'precise']) : new Set(['rewrite']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isRewrite = v === 'rewrite';
  return (
    <Stage eyebrow="AI bilan tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala promptni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Eng kuchli signalni <span className="italic" style={{ color: T.accent }}>aniq tuzat</span> — qayta yozma</h2></div>
        <Mentor>Top signal: eslatma tugmasi topilmaydi (3/5 + aktivatsiya). Uni AI bilan tuzatamiz (101-mahorat). Lekin qanday prompt? Ikkisini solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isRewrite ? 'chip-on' : ''}`} onClick={() => set('rewrite')}>💣 «Qayta yoz»</button>
              <button className={`chip ${!isRewrite ? 'chip-on' : ''}`} onClick={() => set('precise')}>🎯 «Aniq tuzat»</button>
            </div>
            <div key={v} className="demo-swap">
              <CodeCard file="prompt.txt">
                {isRewrite
                  ? <span style={{ color: CODE.comment }}>«Ilovani chiroyliroq va qulayroq qilib qayta yoz»</span>
                  : <span style={{ color: CODE.text }}>«Eslatma tugmasini ekran <b style={{ color: CODE.attr }}>tepasiga</b>, kattaroq va aniq matn bilan («🔔 Eslatma yoq») ko'chir. Boshqa hech narsani o'zgartirma.»</span>}
              </CodeCard>
            </div>
          </Col>
          <Col>
            {isRewrite
              ? <div className="frame-warn fade-step" key="r"><p className="body" style={{ margin: 0, color: T.ink }}>«Qayta yoz» — xavfli: AI ishlab turgan narsani ham buzadi, yangi xatolar keladi, tushunish qiyinlashadi. Bir muammoни tuzatаман deб o'ntасини yaratasiz.</p></div>
              : <div className="frame-success fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>«Aniq tuzat» — xavfsiz: bitta aniq o'zgarish, qolgani tegilmaydi. Osongina tekshirasiz, «tushuntir» darvozasidan o'tkazasiz (101). Kichik, nazoratli qadam.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Iteratsiya qoidasi: <b>kichik, aniq o'zgarishlar</b> — katta qayta yozish emas. Har fixдан keyin «tushuntir» darvozasi va checklist (101). Endi tuzatishni qo'llab, metrikани o'lchaymiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Friction'ni AI bilan qanday tuzatasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI'ga <span className="italic" style={{ color: T.accent }}>qanday</span> tuzatish beraman?</h2></>}
    options={['«Butun ilovani chiroyliroq qayta yoz»', 'Aniq, kichik o\'zgarish: «shu tugmani tepaga, kattaroq — boshqasini tegма»', 'Hech narsani o\'zgartirmayman', 'Barcha fichalarni birdan qayta yozaman']} correctIdx={1}
    explainCorrect="To'g'ri! Aniq, kichik o'zgarish — iteratsiya kaliti. «Qayta yoz» ishlab turgan narsani buzadi. Bitta aniq fix → tekshir → «tushuntir» darvozasi (101) → o'lcha. Kichik qadamlar, katta natija."
    explainWrong={{ 0: '«Qayta yoz» — ishlaganini ham buzadi, yangi xatolar keladi.', 2: 'Signal bo\'lsa — tuzatish kerak; e\'tiborsizlik xato.', 3: 'Barchasini birdan — chalkashlik. Bittadan, aniq.', default: 'Kichik, aniq o\'zgarish qil.' }} />
);

// ===== SCREEN 10 — SIKL YOPILADI: METRIKA KO'TARILADI (SIGNATURE 3) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [applied, setApplied] = useState(!!storedAnswer);
  const workRef = useRef(null);
  const done = applied;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const shown = applied ? METRIC_AFTER : METRIC_BEFORE;
  return (
    <Stage eyebrow="Sikl yopiladi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Tuzatishni qo\'llang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tuzatding — endi <span className="italic" style={{ color: T.success }}>metrika gapiradi</span></h2></div>
        <Mentor>Mana butun modulning sehri bir joyда: 104-friction → 105-fix → 100-metrika. Tuzatishni qo'llang va Shimoliy yulduzни kuzating.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="chain fade-up delay-1">
              <div className="chain-node" style={{ borderColor: T.grape }}><span style={{ fontSize: 18 }}>🧪</span><div><b>104: Friction</b><p className="small" style={{ margin: 0, color: T.ink2 }}>eslatma tugmasi (3/5)</p></div></div>
              <span className="chain-arrow">↓</span>
              <div className="chain-node" style={{ borderColor: T.accent }}><span style={{ fontSize: 18 }}>🪄</span><div><b>105: AI fix</b><p className="small" style={{ margin: 0, color: T.ink2 }}>tugmani tepaga, kattaroq</p></div></div>
              <span className="chain-arrow">↓</span>
              <div className="chain-node" style={{ borderColor: T.blue }}><span style={{ fontSize: 18 }}>📊</span><div><b>100: Metrika</b><p className="small" style={{ margin: 0, color: T.ink2 }}>aktivatsiyani o'lchaymiz</p></div></div>
            </div>
          </Col>
          <Col>
            <div className="metric-card" style={{ background: applied ? T.successSoft : T.paper }}>
              <p className="flow-label" style={{ marginBottom: 4 }}>⭐ Aktivatsiya (eslatma yoqqanlar)</p>
              <p className="metric-num" style={{ color: applied ? T.success : T.ink2 }}><CountUp to={shown} run={applied} key={applied ? 'a' : 'b'} />%</p>
              <div className="fmeter-track" style={{ marginTop: 8 }}><div className="fmeter-fill" style={{ width: `${shown}%`, background: applied ? T.success : T.ink3, transition: 'width 1.1s cubic-bezier(.3,.8,.3,1)' }} /></div>
              <p className="small" style={{ margin: '8px 0 0', color: T.ink2 }}>{applied ? '620 dan 380 tasi eslatma yoqdi — oldin 210 edi!' : '620 dan atigi 210 tasi eslatma yoqadi (tugma yashirin)'}</p>
            </div>
            {!applied && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setApplied(true)}>🔥 Tuzatishni qo'lla va o'lcha</button>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Charх bir marta aylandi: <b>+27% aktivatsiya!</b> Endi taxmin emas — DALIL. Bir kichik tuzatish, o'lchanadigan natija. Mana nega analitika, usability va AI birga ishlaydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ITERATSIYA DOIMIY =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  return (
    <Stage eyebrow="Doimiy sikl" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Davomini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir marta emas — <span className="italic" style={{ color: T.accent }}>cheksiz charх</span></h2></div>
        <Mentor>Bugun charxni bir marta aylantirdingiz. Lekin haqiqiy mahsulot — bu doimiy jarayon. Nega kichik va tez-tez yaxshiroq?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.accent}` }}>
              <p className="note-h" style={{ color: T.accent }}>🐢 Katta, kam-kam iteratsiya</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>3 oy ishlab, katta yangilanish chiqarish. Agar noto'g'ri bo'lsa — 3 oy behuda. Sekin o'rganish, katta xavf.</p>
            </div>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.success}` }}>
              <p className="note-h" style={{ color: T.success }}>🐇 Kichik, tez-tez iteratsiya</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Har hafta kichik tuzatish → o'lchov → saboq. Xato bo'lsa — bir haftalik yo'qotish. Tez o'rganish, kam xavf. Charх tez aylanadi.</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', background: T.grapeSoft, boxShadow: 'none' }}>
              <p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>«Katta muvaffaqiyat — minglab kichik iteratsiyalar yig'indisi.»</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Tushundim</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Founder odati: har hafta charxni aylantiring. Fidbek yig'ing → prioritetlang → tuzating → o'lchang. Mahsulot har hafta 1% yaxshilanса — bir yilда tanib bo'lmaydigan darajada o'sadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Tuzatgandan keyin qanday bilasiz — ishladimi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tuzatish <span className="italic" style={{ color: T.accent }}>ishladimi</span> — qanday bilasiz?</h2></>}
    options={['O\'zimga chiroyli tuyulса — ishladi', 'Metrikани qayta o\'lchayman — aktivatsiya/retention ko\'tarildimi?', 'Do\'stlarга yoqса', 'Hech qanday — shunchaki tuzataveraman']} correctIdx={1}
    explainCorrect="To'g'ri! Sikl yopiladi: tuzatding → metrikани qayta o'lcha. Aktivatsiya 34%→61% ko'tarildimi? Ha — ishladi, saboq oldi. Yo'q — boshqa gipoteza. O'lchovsiz iteratsiya — ko'r iteratsiya."
    explainWrong={{ 0: 'O\'z didingiz — subyektiv. Metrika obyektiv.', 2: 'Do\'stlar maqtovi — ma\'lumot emas. Raqam kerak.', 3: 'O\'lchamasangiz — o\'rganmaysiz. Sikl yopilmaydi.', default: 'Metrikани qayta o\'lcha — ishladimi?' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #12 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Baland ovoz — muhim! Hammasini tashlab, o\'sha AI chatbotни qur»' },
    { id: 1, t: '«Bu — bitta ovoz (shovqin). 3/5 sinovчи aytgan "eslatma tugmasi" — pattern (signal). Signalni tuzat, shovqinni belgilab qo\'y»' },
    { id: 2, t: '«Ikkalasини ham darrov qur»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«Bitta odam AI chatbot so'rayapti — darrov qilaman!»</span></h2></div>
        <Mentor>Aziz fidbek to'pladi. Lekin bittasiga mahliyo bo'lib qoldi. Xabarини o'qing…</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«Bitta foydalanuvchi juda qattiq turib oldi: "AI chatbot qo'shing, bu shart!" — 5 marta yozdi. Shuning uchun bir haftा shuni quraman. Eslatma tugmasi-chi? A, u 3 kishi aytgan, keyinroq...»</p>
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
            ? 'Aziz «vokal ozchilik» tuzog\'iga tushdi: bitta baqiroq ovoz uni chalg\'itdi. 5 marta yozgan 1 kishi — hali ham 1 kishi, va chatbot core jobga aloqasiz (shovqin). «Eslatma tugmasi» esa 3/5 pattern + aktivatsiyani tushiryapti (signal). Ovoz balandligiга emas, DALILга (pattern + metrika) qarab tuzatadi. Aziz signalни tuzatib, shovqinni belgilab qo\'yishi kerak.'
            : (picked === 0 ? 'Baland ovoz ≠ signal. Chatbot 1 kishi + core jobga aloqasiz. Signalни (3/5 pattern) boy berasiz.' : 'Ikkalasi ham emas — prioritet kerak. Signalni (eslatма) tuzat, shovqinни (chatbot) belgila. Cheklangan vaqt.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Iteratsiya rejasiga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Iteratsiya qoidasi: <span className="italic" style={{ color: T.accent }}>dalilni eshit, kichik aylantir</span></h2></div>
      <Mentor>Amaliyotdan oldin kompas. 4 qoida — keyin iteratsiya rejangizni yozasiz.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🔁</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Charxni aylantiring</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Mahsulot bir marta yasalmaydi — u har hafta yaxshilanadi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.loop(18), c: T.grape, t: 'SIKL — qur → o\'lcha → o\'rgan → yana' }, { ic: Ico.grid(18), c: T.accent, t: 'PRIORITET — ta\'sir × mehnat; 🔥 hozir qil' }, { ic: Ico.volume(18), c: T.blue, t: 'SIGNAL — pattern/metrika; baland ovoz emas' }, { ic: Ico.chart(18), c: T.success, t: 'O\'LCHA — tuzatding? metrikани qayta o\'lcha' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: ITERATSIYA REJASI =====
const emptyIter = () => Object.fromEntries(ITER_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyIter());
  const productName = useRef(readProductName()).current;
  const isComplete = (k) => data[k].trim().length >= (ITER_FIELDS.find(f => f.key === k)?.min ?? 4);
  const completeCount = ITER_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= ITER_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson105_iterate', { title: 'Iteratsiya rejasi', fields: ITER_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = ITER_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' (')[0], color: f.color === T.ink2 ? T.ink3 : f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · iteratsiya rejasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${ITER_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">ITERATSIYA REJASI: <span className="italic" style={{ color: T.accent }}>portfolio 13-sahifa</span></h2></div>
        <Mentor>104-test topilmalarингиздан iteratsiya rejasini tuzing{productName ? <> (mahsulotingiz: <b style={{ color: T.ink }}>{productName}</b>)</> : ''}. Prioritetlang, fix promptини yozing va qanday o'lchashни belgilang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {ITER_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color === T.ink2 ? T.ink3 : f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Iteratsiya rejangiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — reja shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><IterDoc rows={docRows} />{passed && <span className="seal">CHARX AYLANDI 🔁</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Charxни aylantirishni o'rgandingiz — mahsulot endi dalilга asoslanib o'sadi. Keyingi darsda butun yo'lni PITCHга aylantiramiz: muammo → yechim → foydalanuvchi → metrika. 🎤</p></div>}
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
  { t: 'Quruvchi', l: 'olingan' },
  { t: 'Sinovchi', l: 'olingan' },
  { t: 'Founder', l: 'Demo Day (108)' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Qur → o\'lcha → o\'rgan: mahsulot aylanuvchi charх', 'Prioritet: ta\'sir × mehnat — 🔥 hozir qil birinchi', 'Signal (pattern/metrika) vs shovqin (bir ovoz)', 'Kichik AI-fix → metrikани qayta o\'lcha (34%→61%)'];
  const GLOSSARY = [{ b: 'Iteratsiya', t: '— qur → o\'lcha → o\'rgan sikli' }, { b: 'Prioritet matritsasi', t: '— ta\'sir × mehnat 2×2' }, { b: 'Signal', t: '— pattern yoki metrikага bog\'liq fidbek' }, { b: 'Shovqin', t: '— bitta ovoz / shaxsiy did / maqtov' }, { b: 'Vokal ozchilik', t: '— baqiroq 1 kishi tuzog\'i' }, { b: 'Build-measure-learn', t: '— Eric Ries, Lean Startup sikli' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Isbot qil bosqichi · 1/4 tamom" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.loop(12)}</span> Charх aylandi · Isbot qil boshlandi</span><h2 className="title h-title fade-up d1">Mahsulot endi <span className="italic" style={{ color: T.accent }}>o'sadi.</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Fidbekni prioritetlab, signalni shovqindan ajratib, AI bilan tuzatib, metrikani o\'lchashni o\'rgandingiz. Bu — butun modulning zanjiri: analitika + usability + kod birga ishlaydi. Endi oxirgi 2 dars: pitch va Demo Day.' : 'Yaxshi harakat! Iteratsiya qoidalarини mustahkamlang — mahsulot shu bilan o\'sadi.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 3 ? 'badge-done' : ''} ${i === 4 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔨' : (i === 3 ? '🧪' : '👑')))} {b.t}<span className="badge-when" style={i <= 3 ? { color: 'rgba(255,255,255,0.85)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Oxirgi nishon — <b style={{ color: T.honey }}>👑 Founder</b>: Demo Day'да butun yo'lni namoyish qilganда (108-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🔁</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — charxni aylantiring</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>104-testда topgan friction'laringizni oling. Ta'sir × mehnat bo'yicha tartiblang, eng kritik 1-2 tasini AI bilan aniq tuzating («qayta yoz» emas!), «tushuntir» darvozasidan o'tkazing va bir haftadan keyin metrikani qayta o'lchang. Keyingi dars: pitch — muammo→yechim→foydalanuvchi→metrika 🎤.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function MvpIterateLesson({ lang: langProp, onFinished }) {
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

        /* === LOOP RING === */
        .loop-ring { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .loop-node { display: flex; flex-direction: column; align-items: center; gap: 4px; border: none; background: ${T.paper}; border-radius: 14px; padding: 14px 16px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.18); min-width: 84px; }
        .loop-node:hover { transform: translateY(-2px); }
        .loop-act { box-shadow: 0 10px 24px -8px rgba(${T.shadowBase},0.28), inset 0 0 0 2px var(--nc); }
        .loop-t { font-family: 'Manrope'; font-weight: 800; font-size: 11.5px; letter-spacing: 0.04em; }
        .loop-arrow { color: ${T.ink3}; font-size: 16px; }
        .loop-back { width: 100%; text-align: center; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.grape}; margin-top: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }

        /* === MATRIX === */
        .matrix { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .mcell { background: ${T.paper}; border-radius: 11px; padding: 11px 12px; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--mc) 40%, transparent); display: flex; flex-direction: column; gap: 2px; }
        .mcell .memoji { font-size: 17px; }
        .mcell b { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: var(--mc); letter-spacing: 0.02em; }
        .mcell span:last-child { font-size: 10px; color: ${T.ink3}; line-height: 1.35; }

        /* === CHAIN === */
        .chain { display: flex; flex-direction: column; gap: 4px; }
        .chain-node { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 12px; padding: 12px 14px; border-left: 4px solid; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.18); }
        .chain-node b { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .chain-arrow { text-align: center; color: ${T.ink3}; font-size: 16px; line-height: 1; }

        /* === METRIC CARD === */
        .metric-card { border-radius: 14px; padding: clamp(16px,2.6vw,22px); box-shadow: 0 8px 22px -10px rgba(${T.shadowBase},0.2); transition: background 0.4s; }
        .metric-num { font-family: 'Fraunces', serif; font-size: clamp(38px,7vw,58px); margin: 2px 0 0; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }

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
        .sort-verdict { font-family: 'Manrope'; font-weight: 800; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0; animation: feat-pop .3s cubic-bezier(.2,.7,.2,1); text-align: right; }

        /* === METER === */
        .fmeter-track { height: 10px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; }
        .fmeter-fill { height: 100%; background: linear-gradient(90deg, ${T.honey}, ${T.accent}); border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.45); }

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

        /* === SPEC / CODE === */
        .spec-card { background: ${CODE.bg}; border-radius: 14px; padding: 16px 17px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); display: flex; flex-direction: column; gap: 8px; }
        .spec-text { font-family: 'Georgia, serif'; font-size: clamp(13px,1.7vw,15px); line-height: 1.5; margin: 3px 0 0; }
        .code-file { display: flex; align-items: center; gap: 6px; padding-bottom: 10px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .cdot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
        .code-name { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9FB4D8; margin-left: 6px; }
        .code-pre { font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.7vw,13.5px); color: ${CODE.text}; line-height: 1.7; margin: 0; white-space: pre-wrap; word-break: break-word; }

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
