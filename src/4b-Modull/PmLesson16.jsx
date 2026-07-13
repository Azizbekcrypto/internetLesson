import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 16-DARS (Modul 06 · Testlash · PM) — SIFAT = MAHSULOT QIYMATI — PLATFORM STANDARD v16
// G'oya: bug ↔ retention bog'liqligi; test = talablar hujjati; happy path vs edge case = PM fikrlashi.
//        Yakuniy ish: edge case ro'yxatini MAHSULOT ASOSI bilan tuzish.
// Joylashuv: JestUnitTest (happy path yozdik) va EdgeCasesTest (toThrow) ORASIDA — ko'prik.
// Mahsulot: KitobShop — orderTotal(price, quantity) (1- va 2-darsdagi funksiya).
// Signature 1: Bug → retention churn (mijozlar ketadi). Signature 2: Edge case ovchisi (toping + asoslang).
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
  doc: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>),
  bug: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="8" y="6" width="8" height="12" rx="4" /><path d="M12 6V4M9 4l-1-1M15 4l1-1M8 10H4M8 14H4M16 10h4M16 14h4M9 18l-2 2M15 18l2 2" /></svg>),
  users: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.2 6-5.2s6 1.9 6 5.2" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M18 20c0-2.6-1-4.2-2.5-5" /></svg>),
  test: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 3v6l-5 9a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18l-5-9V3" /><path d="M8 3h8M8 14h8" /></svg>),
  shield: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>),
  book: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" /><path d="M5 17h13" /></svg>)
};

const LESSON_META = { lessonId: 'pm-quality-value-16-v16', lessonTitle: { uz: 'Sifat = mahsulot qiymati', ru: 'Качество как продуктовая ценность' } };
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
// Bug ↔ retention (s2)
const STABLE = ['Foydalanuvchi ishonadi', 'Qaytib keladi (retention)', 'Do\'stiga tavsiya qiladi'];
const BUGGY = ['Bir bug — ishonch siniq', 'O\'chiradi, qaytmaydi', 'Yomon sharh qoldiradi'];

// Test = talablar hujjati (s3)
const SPECS = [
  { test: "it('quantity 0 → total 0')", req: 'Talab: bo\'sh buyurtma summasi 0 bo\'lsin' },
  { test: "it('2 kitob × 50000 = 100000')", req: 'Talab: narx × soni to\'g\'ri hisoblansin' },
  { test: "it('manfiy quantity xato beradi')", req: 'Talab: manfiy son qabul qilinmasin' }
];

// Happy vs edge (s5)
const HAPPY = ['2 kitob × 50000 so\'m', 'Oddiy, to\'g\'ri quantity', 'Hammasi joyida'];
const EDGE = ['quantity = 0 (bo\'sh)', 'manfiy yoki ulkan son', 'raqam o\'rniga matn', 'tugmani 2 marta bosish'];

// Edge case ovchisi (s8) — orderTotal kirishlari
const INPUTS = [
  { id: 'h1', label: '2 kitob, 50000 so\'m', edge: false },
  { id: 'empty', label: 'quantity = 0', edge: true },
  { id: 'neg', label: 'quantity = −3', edge: true },
  { id: 'h2', label: '1 kitob, 30000 so\'m', edge: false },
  { id: 'huge', label: 'quantity = 99999', edge: true },
  { id: 'text', label: 'quantity = "uch" (matn)', edge: true }
];
const EDGE_IDS = INPUTS.filter(i => i.edge).map(i => i.id);

// Edge case → mahsulot asosi (s10 moslash)
const EDGE_WHY = [
  { id: 'empty', feat: 'quantity = 0 (bo\'sh)', crit: 'Bo\'sh buyurtmaga to\'lov so\'ralmasin — xato summa chiqmasin' },
  { id: 'neg', feat: 'manfiy quantity', crit: 'Pul qaytib ketmasin — firibgarlik oldini olish' },
  { id: 'huge', feat: 'ulkan son (99999)', crit: 'Sayt qotmasin, mantiqsiz narx chiqmasin' },
  { id: 'double', feat: 'tugmani 2 marta bosish', crit: 'Ikki marta to\'lov olinmasin — mijoz g\'azabi' }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'HAPPY-ONLY', color: T.accent, text: 'Jamoa faqat happy path\'ni test qildi: "2 kitob = 100000"', why: 'Oddiy holatda ishladi — demo zo\'r ketdi.' },
  { tag: 'EDGE BUG', color: T.honey, text: 'Mijoz quantity 0 bilan to\'lovni bosdi → sayt xato berdi', why: 'Edge case test qilinmagandi — production\'da chiqdi.' },
  { tag: 'CHURN', color: T.grape, text: '10+ mijoz o\'chirdi, yomon sharh qoldirdi', why: 'Bitta edge bug — retention tushdi.' },
  { tag: 'TUZATISH', color: T.success, text: 'Edge case testlari qo\'shildi (toThrow)', why: 'Endi har reliz himoyalangan — ishonch qaytdi.' }
];

const Split = ({ children, refEl }) => <div className="split" ref={refEl}>{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

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

// ===== SCREEN 0 — HOOK (bug → mijoz ketadi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('user');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Faqat texnik nosozlik — kod xatosi' },
    { id: 'b', label: 'Bug foydalanuvchini haydaydi — retention (qaytish) tushadi' },
    { id: 'c', label: 'Muhim emas — keyin tuzatamiz' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'user'
    ? { who: 'Foydalanuvchi', emoji: '😠', say: 'Kitob buyurtma qildim, summa "-150000" chiqdi! Bu sayt ishonchsiz — o\'chirib tashladim.', ok: false }
    : { who: 'Dasturchi', emoji: '😅', say: 'Men test yozgandim-ku: "2 kitob = 100000" — PASS bo\'lgan! Foydalanuvchi 0 dona buyurtma qiladi deb o\'ylamabman.', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Bitta bug — bitta <span className="italic" style={{ color: T.accent }}>yo'qolgan mijoz</span>. Nega?</h1>
        <Mentor>KitobShop oddiy holatda ishladi, lekin foydalanuvchi g'alati narsa qildi va bug chiqdi. Har birini bosing.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'user' ? 'chip-on' : ''}`} onClick={() => setV('user')}>Foydalanuvchi 😠</button>
              <button className={`chip ${v === 'dev' ? 'chip-on' : ''}`} onClick={() => setV('dev')}>Dasturchi 😅</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.blue : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Bug nega mahsulot masalasi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Bug — faqat texnik xato emas. U <b>ishonchni buzadi</b>, foydalanuvchi ketadi (<b>retention</b> tushadi). Sifat = mahsulot qiymati. Bugun PM ko'zi bilan testni ko'ramiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Sifat = mahsulot qiymati (bug ↔ retention)', tag: 'jonli' },
    { text: 'Bitta bug → yo\'qolgan mijoz', tag: '' },
    { text: 'Test = talablar hujjati', tag: '' },
    { text: 'Happy path vs edge case — PM fikrlashi', tag: '' },
    { text: 'Edge case ro\'yxati — mahsulot asosi bilan', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.success} soft={T.successSoft}>{Ico.shield(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Sifat = mahsulot qiymati</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Test — texnik emas, mahsulot ishonchi haqida.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Keyingi dars: bu edge case'larni toThrow bilan sinaymiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Nega test — mahsulot masalasi?</span></h2></div>
        <Mentor>1-darsda test yozdingiz. Bu PM darsi: <b style={{ color: T.ink }}>nimani</b> va <b style={{ color: T.ink }}>nega</b> test qilish kerakligini ko'ramiz — keyin 2-darsda uni texnik qilamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — BUG ↔ RETENTION (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('buggy');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['buggy', 'stable']) : new Set(['buggy']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'buggy' ? BUGGY : STABLE;
  const col = v === 'buggy' ? T.accent : T.success;
  return (
    <Stage eyebrow="Bug ↔ retention" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bug va <span className="italic" style={{ color: T.accent }}>retention</span> bog'liq</h2></div>
        <Mentor><b style={{ color: T.ink }}>Retention</b> — foydalanuvchi qaytib kelishi. Bug uni to'g'ridan-to'g'ri kamaytiradi. Ikki holatni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'buggy' ? 'chip-on' : ''}`} onClick={() => set('buggy')}>🐛 Bug bor</button>
              <button className={`chip ${v === 'stable' ? 'chip-on' : ''}`} onClick={() => set('stable')}>✅ Barqaror</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'buggy' ? Ico.bug(16) : Ico.check(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'buggy'
              ? <div className="frame-warn fade-step" key="b"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Retention tushadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Foydalanuvchi bir marta aldansa — qaytmaydi. Yangi mijoz topish 5x qimmat.</p></div>
              : <div className="frame-success fade-step" key="s"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Retention o'sadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Barqaror mahsulot — ishonch quradi. Mijoz qaytadi va tavsiya qiladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Test — bug'lardan himoya. Demak test = retention himoyasi = mahsulot qiymati.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — TEST = TALABLAR HUJJATI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(SPECS.map((_, i) => i)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= SPECS.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active !== null ? SPECS[active] : null;
  return (
    <Stage eyebrow="Test = hujjat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${SPECS.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Test — bu <span className="italic" style={{ color: T.accent }}>talablar hujjati</span></h2></div>
        <Mentor>Test nomi mahsulot talabini aytadi: "<span className="mono">bo'sh savat 0 qaytaradi</span>" — bu AYNAN talab. Testni o'qigan odam mahsulot nima qilishini biladi. Har testni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SPECS.map((s, i) => (<button key={i} onClick={() => tap(i)} className={`fieldrow ${active === i ? 'fr-on' : ''}`}><span className="mono fr-k" style={{ fontSize: 12 }}>{s.test}</span>{seen.has(i) ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.arrow(15)}</span> : <span style={{ color: T.ink3 }}>→</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.doc(16)}</span><span className="sk-wordbadge" style={{ color: T.blue, background: T.blueSoft }}>Talab</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0', fontWeight: 600 }}>{cur.req}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir testni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Testlar = jonli hujjat. Ular har doim kod bilan mos (eskirmaydi). Yangi a'zo testdan mahsulotni o'rganadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Nega bug — faqat texnik emas, balki mahsulot (PM) masalasi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega bug <span className="italic" style={{ color: T.accent }}>mahsulot</span> masalasi?</h2></>}
    options={['Kod chiroyli ko\'rinmaydi', 'Bug ishonchni buzadi → foydalanuvchi ketadi → retention tushadi', 'Dasturchini band qiladi', 'Aslida muhim emas']} correctIdx={1}
    explainCorrect="To'g'ri! Bug — foydalanuvchi tajribasiga zarba. Ishonch buzilsa, mijoz ketadi va qaytmaydi. Bu to'g'ridan-to'g'ri biznes (retention) masalasi."
    explainWrong={{ 0: 'Ko\'rinish emas — gap foydalanuvchi ishonchida.', 2: 'Band qilish emas — mijoz yo\'qotish.', 3: 'Aksincha — eng muhim mahsulot risklaridan.', default: 'Bug → ishonch buziladi → retention tushadi.' }} />
);

// ===== SCREEN 5 — HAPPY PATH vs EDGE CASE =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('happy');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['happy', 'edge']) : new Set(['happy']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'happy' ? HAPPY : EDGE;
  const col = v === 'happy' ? T.success : T.accent;
  return (
    <Stage eyebrow="Happy vs edge" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.success }}>Happy path</span> vs <span className="italic" style={{ color: T.accent }}>edge case</span> — PM fikrlashi</h2></div>
        <Mentor>Dasturchi <b style={{ color: T.ink }}>happy path</b>ni sinaydi (hammasi to'g'ri). PM <b style={{ color: T.ink }}>edge case</b>ni o'ylaydi — real foydalanuvchi nima qiladi. Ikkalasini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'happy' ? 'chip-on' : ''}`} onClick={() => set('happy')}>😊 Happy path</button>
              <button className={`chip ${v === 'edge' ? 'chip-on' : ''}`} onClick={() => set('edge')}>⚠️ Edge case</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'happy' ? Ico.check(16) : Ico.problem(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'happy'
              ? <div className="frame-success fade-step" key="h"><p className="body" style={{ margin: 0, color: T.ink }}>Happy path — hamma narsa to'g'ri ketgan holat. Bu yetarli emas: real hayot tartibsiz.</p></div>
              : <div className="frame-warn fade-step" key="e"><p className="body" style={{ margin: 0, color: T.ink }}>Edge case — chekka, kutilmagan holat. Aynan shu yerda bug yashiringan.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>PM savoli: "<b>Foydalanuvchi nima noto'g'ri qilishi mumkin?</b>" — javoblar = edge case ro'yxati.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Edge case nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Edge case <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Eng tez-tez uchraydigan oddiy holat', 'Chekka, kutilmagan holat (0, manfiy, bo\'sh, ulkan son)', 'Dizayn rangi', 'Tugma o\'lchami']} correctIdx={1}
    explainCorrect="To'g'ri! Edge case — chegara/kutilmagan holat: bo'sh, 0, manfiy, juda katta. Aynan shu yerda ko'pchilik bug yashiringan."
    explainWrong={{ 0: 'Bu — happy path. Edge case aksincha, kam uchraydigan chekka holat.', 2: 'Rang emas — kirish ma\'lumotining chekka holati.', 3: 'O\'lcham emas — kutilmagan kirishlar.', default: 'Edge case — chekka, kutilmagan holat.' }} />
);

// ===== SCREEN 6 — BUG → RETENTION CHURN (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const USERS = 10;
  const [phase, setPhase] = useState(storedAnswer ? 'fixed' : 'idle'); // idle | buggy | fixed
  const [seenBuggy, setSeenBuggy] = useState(!!storedAnswer);
  const done = seenBuggy;
  const releaseBuggy = () => { setPhase('buggy'); setSeenBuggy(true); };
  const releaseFixed = () => { setPhase('fixed'); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const left = phase === 'buggy' ? 4 : 0;
  const retention = Math.round(((USERS - left) / USERS) * 100);
  return (
    <Stage eyebrow="Retention · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bugli relizni sinab ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bugli reliz — mijozlar <span className="italic" style={{ color: T.accent }}>ketadi</span></h2></div>
        <Mentor>10 ta xursand mijoz bor. "Bug bilan reliz"ni bosing — nima bo'lishini ko'ring. Keyin tuzatib qayta reliz qiling.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="churn-box">
              <div className="churn-grid">
                {Array.from({ length: USERS }).map((_, i) => { const gone = i < left; return (<span key={i} className={`uface ${gone ? 'uf-gone' : ''}`}>{gone ? '😠' : '😀'}</span>); })}
              </div>
              <div className="ret-row">
                <span className="ret-lbl">Retention</span>
                <div className="ret-track"><div className="ret-fill" style={{ width: `${retention}%`, background: retention >= 80 ? T.success : retention >= 50 ? T.honey : T.accent }} /></div>
                <span className="ret-pct" style={{ color: retention >= 80 ? T.success : retention >= 50 ? T.honey : T.accent }}>{retention}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {phase !== 'buggy' && !seenBuggy && <button className="btn" onClick={releaseBuggy} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'inline-flex' }}>{Ico.bug(16)}</span>Bug bilan reliz</button>}
              {phase === 'buggy' && <button className="btn-soft" onClick={releaseFixed} style={{ background: T.successSoft, color: T.success }}>🔧 Tuzatib qayta reliz</button>}
              {phase === 'fixed' && seenBuggy && <button className="btn-soft" onClick={releaseBuggy}>↻ Bugni yana ko'rish</button>}
            </div>
          </Col>
          <Col>
            {phase === 'idle' && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Hozir hamma mijoz xursand (100%). Bug chiqsa nima bo'ladi?</p></div>}
            {phase === 'buggy' && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>4 mijoz ketdi! Retention 60%</p><p className="body" style={{ margin: 0, color: T.ink }}>Bitta edge bug → 4 kishi o'chirdi va qaytmaydi. Yangi mijoz topish — 5x qimmat.</p></div>}
            {phase === 'fixed' && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>🛡️</div><p className="ta-h">Tuzatildi — 100%</p><p className="ta-sub">Test bug'ni foydalanuvchidan OLDIN ushlaydi. Shuning uchun test = retention himoyasi</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST = XAVFSIZLIK TO'RI (regressiya) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('no');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['no', 'yes']) : new Set(['no']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Regressiya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Test — <span className="italic" style={{ color: T.accent }}>xavfsizlik to'ri</span></h2></div>
        <Mentor>Yangi fycha qo'shganda eski narsa buzilishi mumkin (<b style={{ color: T.ink }}>regressiya</b>). Test buni ushlaydi. Ikki holatni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'no' ? 'chip-on' : ''}`} onClick={() => set('no')}>❌ Testsiz</button>
              <button className={`chip ${v === 'yes' ? 'chip-on' : ''}`} onClick={() => set('yes')}>🛡️ Test bilan</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'yes' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'yes' ? '🛡️' : '🕳️'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'no'
                ? 'Chegirma fychasini qo\'shdingiz — bilmagan holda orderTotal buzildi. Foydalanuvchi ko\'rdi.'
                : 'Chegirma qo\'shdingiz — eski test darrov "FAIL" dedi. Foydalanuvchiga yetmasdan tuzatdingiz.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'no'
              ? <div className="frame-warn fade-step" key="n"><p className="body" style={{ margin: 0, color: T.ink }}>Testsiz — har o'zgarish qo'rqinchli. Eski buzilishini bilmaysiz.</p></div>
              : <div className="frame-success fade-step" key="y"><p className="body" style={{ margin: 0, color: T.ink }}>Test bilan — ishonch bilan o'zgartiravering. To'r tutib qoladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Test = tez va xavfsiz o'sish. PM15 "masshtablanuvchanlik"ka bevosita bog'liq.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — EDGE CASE OVCHISI (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sel, setSel] = useState(() => storedAnswer ? new Set(EDGE_IDS) : new Set());
  const edgeSel = [...sel].filter(id => EDGE_IDS.includes(id)).length;
  const badSel = [...sel].filter(id => !EDGE_IDS.includes(id)).length;
  const done = edgeSel >= EDGE_IDS.length && badSel === 0;
  const toggle = (id) => { if (done) return; setSel(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const wrongPick = INPUTS.find(i => sel.has(i.id) && !i.edge);
  return (
    <Stage eyebrow="Edge case ovchisi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Edge case'larni toping (${edgeSel}/${EDGE_IDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent, fontSize: '0.8em' }}>orderTotal()</span> uchun <span className="italic" style={{ color: T.accent }}>edge case</span>'larni toping</h2></div>
        <Mentor>Quyidagi kirishlardan qaysilari <b style={{ color: T.ink }}>edge case</b> (chekka holat)? Hammasini tanlang. Oddiy (happy) tanlasangiz, ogohlantiraman.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {INPUTS.map(it => { const on = sel.has(it.id); const tone = on ? (it.edge ? 'good' : 'bad') : 'off'; return (
                <button key={it.id} onClick={() => toggle(it.id)} className={`mcard ${tone === 'good' ? 'mcard-good' : tone === 'bad' ? 'mcard-bad' : ''}`}>
                  <span className="mcard-box">{on ? (it.edge ? Ico.check(14) : Ico.x(14)) : ''}</span>
                  <span className="mono" style={{ flex: 1, fontSize: 'clamp(12px,1.5vw,13.5px)' }}>{it.label}</span>
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Topilgan edge case'lar</p>
            <div className="mpanel-frame">
              {edgeSel === 0 && badSel === 0 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '8px 0' }}>Edge case'larni tanlang…</p>}
              {INPUTS.filter(it => sel.has(it.id) && it.edge).map(it => <div key={it.id} className="ec-chip"><span style={{ color: T.accent, display: 'inline-flex' }}>{Ico.problem(14)}</span><span className="mono" style={{ fontSize: 12.5 }}>{it.label}</span></div>)}
              {wrongPick && <div className="frame-warn fade-step" style={{ marginTop: 8 }}><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 700, color: T.accent }}>HAPPY PATH</p><p className="body" style={{ margin: 0, color: T.ink }}>"{wrongPick.label}" — bu oddiy holat, edge case emas. Olib tashlang.</p></div>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 edge case topildi! Endi har biri uchun NEGA muhimligini ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="orderTotal(price, quantity) uchun qaysi biri edge case?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi biri <span className="italic" style={{ color: T.accent }}>edge case</span>?</h2></>}
    options={['2 kitob × 50000', 'quantity = −3 (manfiy)', '1 kitob × 30000', 'Oddiy buyurtma']} correctIdx={1}
    explainCorrect="To'g'ri! Manfiy quantity — kutilmagan, chekka holat. Test qilinmasa, manfiy summa yoki pul qaytishi kabi bug chiqishi mumkin."
    explainWrong={{ 0: 'Bu — happy path (oddiy, to\'g\'ri).', 2: 'Bu ham oddiy holat.', 3: 'Oddiy buyurtma — happy path.', default: 'Manfiy quantity — edge case.' }} />
);

// ===== SCREEN 10 — EDGE CASE → MAHSULOT ASOSI (moslash) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const WHY = [
    { id: 'double', text: 'Ikki marta to\'lov olinmasin — mijoz g\'azabi' },
    { id: 'empty', text: 'Bo\'sh buyurtmaga to\'lov so\'ralmasin' },
    { id: 'huge', text: 'Sayt qotmasin, mantiqsiz narx chiqmasin' },
    { id: 'neg', text: 'Pul qaytib ketmasin — firibgarlik oldini olish' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(EDGE_WHY.map(p => [p.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= EDGE_WHY.length;
  const pickF = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickC = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(12px,1.5vw,13.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Mahsulot asosi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${EDGE_WHY.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har edge case — <span className="italic" style={{ color: T.accent }}>nega muhim</span> (mahsulot asosi)</h2></div>
        <Mentor>Edge case shunchaki "texnik" emas — har birining mahsulot sababi bor. Avval <b style={{ color: T.ink }}>edge case</b>ni, keyin uning <b style={{ color: T.ink }}>mahsulot asosini</b> bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Edge case</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {EDGE_WHY.map(p => { const m = matched[p.id]; const on = sel === p.id; return (<button key={p.id} onClick={() => pickF(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.accent, display: 'inline-flex' }}>{m ? Ico.check(17) : Ico.problem(15)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p.feat}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Mahsulot asosi (nega)</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {WHY.map(c => { const m = matched[c.id]; const isWrong = wrong === c.id; return (<button key={c.id} onClick={() => pickC(c.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(16) : '💡'}</span><span style={{ flex: 1 }}>{c.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa edge case uchun. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — mahsulot asosi bilan edge case'lar. Aynan shu yakuniy ishingiz bo'ladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — QAYSI QISMNI KO'PROQ TEST QILAMIZ =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('crit');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['crit', 'minor']) : new Set(['crit']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Test prioriteti" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasini emas — <span className="italic" style={{ color: T.accent }}>kritik yo'lni</span> test qil</h2></div>
        <Mentor>Vaqt cheklangan. PM <b style={{ color: T.ink }}>kritik yo'l</b>ni (pul, ishonch) birinchi test qiladi. Ikkalasini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'crit' ? 'chip-on' : ''}`} onClick={() => set('crit')}>🎯 Kritik yo'l</button>
              <button className={`chip ${v === 'minor' ? 'chip-on' : ''}`} onClick={() => set('minor')}>🔹 Ikkinchi darajali</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(v === 'crit' ? ['orderTotal — to\'lov summasi', 'Login / parol', 'Buyurtma yaratish'] : ['Logotip rangi', 'Shrift o\'lchami', 'Footer matni']).map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${v === 'crit' ? T.accent : T.ink3}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: v === 'crit' ? T.accent : T.ink3, display: 'inline-flex' }}>{v === 'crit' ? Ico.flag(15) : Ico.x(15)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'crit'
              ? <div className="frame-success fade-step" key="c"><p className="body" style={{ margin: 0, color: T.ink }}>Pulga va ishonchga tegadigan qism — albatta test. Bug bu yerda eng qimmat.</p></div>
              : <div className="frame-soft fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Rang yoki shrift — buzilsa ham mijoz ketmaydi. Test keyinroq bo'lsa ham bo'ladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>PM qarori: cheklangan vaqtni kritik yo'lga sarflang.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Nega aytishadi: 'test = talablar hujjati'?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega <span className="italic" style={{ color: T.accent }}>test = hujjat</span>?</h2></>}
    options={['Chunki test rang beradi', 'Test nomi mahsulot nima qilishini aniq aytadi va kod bilan doim mos', 'Chunki testlar uzun bo\'ladi', 'Hujjat kerak emas']} correctIdx={1}
    explainCorrect="To'g'ri! 'it(bo'sh savat 0 qaytaradi)' — bu ham talab, ham tekshiruv. Oddiy hujjat eskiradi, test esa kod bilan doim mos — jonli hujjat."
    explainWrong={{ 0: 'Rangga aloqasi yo\'q — gap talabni ifodalashda.', 2: 'Uzunlik emas — aniqlik va kod bilan moslik.', 3: 'Hujjat kerak — va test eng yaxshi, eskirmaydigan hujjat.', default: 'Test nomi = talab, va kod bilan doim mos.' }} />
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>edge bug</span> retention'ni tushirdi</h2></div>
        <Mentor>KitobShop jamoasining yo'li — 4 qadam. Har qatorni bosib, sifat qanday mahsulotga ta'sir qilganini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.book(16)}</span><span className="cl-title">KitobShop — sifat hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Happy-only → edge bug → churn → edge testlar. Endi o'zingiz edge case ro'yxatini yozasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Sifatni <span className="italic" style={{ color: T.accent }}>mahsulot</span> kabi o'yla</h2></div>
      <Mentor>Yodda tuting: bug retention'ni tushiradi, test = talablar hujjati, edge case'larni mahsulot asosi bilan o'ylash — PM ishi.</Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🛡️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Sifat = ishonch</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Test bug'ni foydalanuvchidan oldin ushlaydi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">3 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.users(18), c: T.accent, t: 'BUG → retention tushadi' }, { ic: Ico.doc(18), c: T.blue, t: 'TEST = talablar hujjati' }, { ic: Ico.problem(18), c: T.success, t: 'EDGE CASE = PM fikrlashi' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: edge case ro'yxati + mahsulot asosi =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['quantity = 0 — bo\'sh buyurtmaga to\'lov so\'ralmasin…', 'manfiy quantity — pul qaytib ketmasin…', 'ulkan son yoki 2 marta bosish — …'];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [lines, setLines] = useState(() => storedAnswer?.lines || emptyLines());
  const isComplete = (f) => f.name.trim().length >= 10;
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
        <div className="head"><h2 className="title h-title fade-up">Edge case ro'yxati — <span className="italic" style={{ color: T.accent }}>mahsulot asosi bilan</span></h2></div>
        <Mentor>O'z loyihangiz (yoki orderTotal) uchun: <b style={{ color: T.ink }}>edge case + nega muhim</b>. Kamida 2 ta. Bu ro'yxat keyingi darsda test qilinadi!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>Edge case + nega {i + 1}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning edge case ro'yxatingiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — ro'yxat shu yerda yig'iladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.test(15)}</span><span className="cl-title">Test qilinadigan edge case'lar</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Keyingi darsda aynan shularni <span className="mono">toThrow</span> bilan test qilasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Sifat = mahsulot qiymati (bug ↔ retention)', 'Bitta edge bug — yo\'qolgan mijozlar', 'Test = talablar hujjati (eskirmaydi)', 'Edge case\'larni mahsulot asosi bilan o\'ylash — PM ishi'];
  const HOMEWORK = [{ b: 'Loyihangizni o\'ylang', t: '— foydalanuvchi qanday "noto\'g\'ri" ish qilishi mumkin?' }, { b: '3 edge case yozing', t: '— har biri uchun mahsulot asosi bilan' }, { b: 'Kritik yo\'lni belgilang', t: '— qaysi qism eng ko\'p test talab qiladi' }];
  const GLOSSARY = [{ b: 'Fycha', t: '— yangi imkoniyat (feature)' }, { b: 'Retention', t: '— foydalanuvchining qaytib kelishi' }, { b: 'Happy path', t: '— hammasi to\'g\'ri ketgan oddiy holat' }, { b: 'Edge case', t: '— chekka, kutilmagan holat (0, manfiy, bo\'sh)' }, { b: 'Regressiya', t: '— yangi o\'zgarish eskisini buzishi' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi sifat — siz uchun <span className="italic" style={{ color: T.accent }}>mahsulot qiymati</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Bug↔retention, test=hujjat va edge case fikrlashini bilasiz. Endi keyingi darsda edge case ro\'yxatingizni toThrow bilan sinaymiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Sifat ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Foydalanuvchidan oldin bug'ni ushla! 🛡️</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🧪</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi dars: Edge case'larni test qilish</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Yozgan edge case ro'yxatingizni endi texnik qilamiz — chegara holatlar va toThrow bilan.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson16({ lang: langProp, onFinished }) {
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

        /* === RETENTION CHURN (signature 1) === */
        .churn-box { background: ${T.paper}; border-radius: 14px; padding: 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.16); }
        .churn-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
        .uface { font-size: clamp(24px,5vw,32px); text-align: center; transition: opacity 0.4s, transform 0.4s; }
        .uface.uf-gone { opacity: 0.35; transform: translateY(6px) rotate(-8deg); filter: grayscale(0.6); }
        .ret-row { display: flex; align-items: center; gap: 10px; }
        .ret-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; }
        .ret-track { flex: 1; height: 12px; background: ${T.bg}; border-radius: 99px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(${T.shadowBase},0.2); }
        .ret-fill { height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(.4,0,.2,1), background 0.3s; }
        .ret-pct { font-family: 'Fraunces', serif; font-weight: 700; font-size: 20px; min-width: 48px; text-align: right; }

        /* === EDGE OVCHISI (signature 2) === */
        .mcard { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; border: none; border-radius: 12px; padding: 12px 14px; font-family: 'Manrope', sans-serif; font-weight: 600; color: ${T.ink}; cursor: pointer; background: ${T.paper}; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.16); transition: all 0.18s; }
        .mcard:hover { transform: translateY(-1px); }
        .mcard-box { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.7px ${T.ink3}; color: #fff; }
        .mcard-good { background: ${T.successSoft}; box-shadow: 0 6px 16px -8px rgba(31,122,77,0.3), inset 0 0 0 1.5px ${T.success}; } .mcard-good .mcard-box { background: ${T.success}; box-shadow: none; }
        .mcard-bad { background: ${T.accentSoft}; box-shadow: 0 6px 16px -8px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; } .mcard-bad .mcard-box { background: ${T.accent}; box-shadow: none; }
        .mpanel-frame { background: ${T.bg}; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; box-shadow: inset 0 0 0 1.5px ${T.ink3}44; }
        .ec-chip { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 9px; padding: 9px 11px; box-shadow: 0 4px 12px -8px rgba(${T.shadowBase},0.2); animation: feat-pop 0.3s; }

        /* === FIELD ROW (s3) === */
        .fieldrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left; border: none; border-radius: 10px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .fieldrow:hover { transform: translateX(2px); }
        .fieldrow.fr-on { box-shadow: inset 0 0 0 1.5px ${T.blue}, 0 6px 16px -8px rgba(1,154,203,0.25); background: ${T.blueSoft}; }
        .fr-k { font-weight: 700; color: ${T.ink}; }

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
