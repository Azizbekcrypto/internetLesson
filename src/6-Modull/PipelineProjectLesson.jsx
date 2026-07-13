import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · P1 (LOYIHA KUNI) — PIPELINE: BARCHA QISMNI BITTA TIZIMGA ULAYMIZ — v16 (AUDIOSIZ)
// G'oya: React + Node.js + PostgreSQL + Telegram + AI — 5 komponentni BITTA ishlaydigan pipeline'ga ulash.
//        Qurilishni AI-PROMPTLAR boshqaradi (VIBECODING). Natija: barcha qismdan ishlaydigan tizim.
// Mahsulot: mini-do'kon — "Buyurtma" bosiladi → React→Node→PostgreSQL→Telegram xabar + AI javob (bitta bosish, butun tizim).
// Joylashuv: T5 (O'z Skill) dan keyin, T6 (React Native) dan oldin — pipeline mobilni talab qilmaydi.
// Falsafa: SIZ — DIREKTOR, AI — ISHCHI. Siz aniq buyurasiz, AI kod yozadi, siz kodni o'qib testlaysiz.
// Signature 1: pipeline quruvchi (prompt bilan ulanish, ma'lumot oqimi). Signature 2: vibecoding sikli (prompt→kod→test→tuzat).
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
  link: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.5 1.5" /><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.5-1.5" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" /></svg>),
  repeat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 9a6 6 0 0 1 10-3l3 2" /><path d="M20 15a6 6 0 0 1-10 3l-3-2" /><path d="M17 4v4h-4M7 20v-4h4" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  bug: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="8" y="7" width="8" height="11" rx="4" /><path d="M9 4l1.5 2M15 4l-1.5 2M4 10h3M17 10h3M4 15h3M17 15h3M12 7v11" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>),
  cmd: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M7 9l3 3-3 3M13 15h4" /></svg>)
};

const LESSON_META = { lessonId: 'pipeline-project-09-v16', lessonTitle: { uz: 'Pipeline: barcha qismni bitta tizimga ulaymiz', ru: 'Связка инструментов: полный pipeline' } };
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
// 5 komponent (s2)
const COMPONENTS = [
  { id: 'react', label: 'React', emoji: '⚛️', color: T.blue, role: 'Frontend (web)', does: 'Mijoz ko\'radigan sahifa — mahsulotlar va "Buyurtma" tugmasi.', mod: 'Modul 3' },
  { id: 'node', label: 'Node.js', emoji: '🟢', color: T.success, role: 'Backend (miya)', does: 'So\'rovlarni qabul qiladi va boshqaradi: GET /products, POST /orders.', mod: 'Modul 4' },
  { id: 'pg', label: 'PostgreSQL', emoji: '🐘', color: T.grape, role: 'Database', does: 'Ma\'lumotni saqlaydi: products va orders jadvallari.', mod: 'Modul 4' },
  { id: 'tg', label: 'Telegram', emoji: '✈️', color: T.blue, role: 'Bot', does: 'Yangi buyurtmada adminga xabar yuboradi.', mod: 'Modul 8' },
  { id: 'ai', label: 'AI (Claude)', emoji: '🤖', color: T.honey, role: 'Aql', does: 'Mijoz savoliga javob beradi, mahsulot tavsifini yozadi.', mod: 'Modul 8/9' }
];

// Pipeline tugunlari va ulanishlari (s6)
const PNODES = [
  { id: 'react', label: 'React', emoji: '⚛️' },
  { id: 'node', label: 'Node.js', emoji: '🟢' },
  { id: 'pg', label: 'PostgreSQL', emoji: '🐘' },
  { id: 'tg', label: 'Telegram', emoji: '✈️' },
  { id: 'ai', label: 'AI', emoji: '🤖' }
];
const LINKS = [
  { id: 'l1', label: 'React → Node', nodes: ['react', 'node'], prompt: '"Buyurtma" tugmasi POST /orders so\'rov yuborsin', code: 'fetch(API + "/orders", { method: "POST", body })' },
  { id: 'l2', label: 'Node → PostgreSQL', nodes: ['node', 'pg'], prompt: 'Order\'ni orders jadvaliga INSERT qil', code: 'INSERT INTO orders(mahsulot, soni, narx) VALUES(...)' },
  { id: 'l3', label: 'Node → Telegram', nodes: ['node', 'tg'], prompt: 'Adminga "Yangi buyurtma" xabar yubor', code: 'bot.sendMessage(ADMIN_ID, "Yangi buyurtma...")' },
  { id: 'l4', label: 'Node → AI', nodes: ['node', 'ai'], prompt: 'Mijoz savolini Claude\'ga yuborib javob ol', code: 'claude.messages.create({ messages: [...] })' }
];

// Vibecoding sikli (s8)
const VIBE_STEPS = [
  { k: 'prompt', tag: '1 · PROMPT', color: T.accent, text: '"Express POST /orders yoz: req.body dan mahsulot va soni ol, orders jadvaliga INSERT qil, 201 qaytar."', note: 'Aniq buyruq berasiz — taxmin qoldirmaysiz.' },
  { k: 'code', tag: '2 · AI KOD', color: T.blue, text: 'app.post("/orders", async (req, res) => { await db.query("INSERT ..."); res.status(201).json(ok); })', note: 'AI kod yozadi. Siz o\'qiysiz — tushunasiz.' },
  { k: 'test', tag: '3 · TEST', color: T.honey, text: 'Buyurtma yuborib ko\'rasiz... ❌ Bug: narx (price) NULL bo\'lib saqlanyapti!', note: 'Sinab ko\'rmasangiz, bugni bilmaysiz.' },
  { k: 'fix', tag: '4 · TUZATISH', color: T.grape, text: '"INSERT so\'roviga narx (price) ustunini ham qo\'sh."', note: 'Aniq tuzatish prompti — butun kodni qayta yozdirmaysiz.' },
  { k: 'done', tag: '5 · QAYTA TEST', color: T.success, text: '✅ Ishladi! Narx ham saqlandi. Bitta ulanish tayyor — keyingisiga.', note: 'Sikl: prompt → kod → test → tuzat → qayta. Vibecoding shu.' }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'BO\'LDI', color: T.accent, text: 'Tizimni 4 ulanishga bo\'ldi (React→Node→DB→bot/AI)', why: 'Katta vazifani kichik, aniq qadamlarga bo\'ldi — har biri alohida quriladi.' },
  { tag: 'PROMPT', color: T.honey, text: 'Har ulanish uchun aniq texnik prompt yozdi', why: 'Aniq buyruq = aniq kod. AI taxmin qilmadi, kerakli narsani yozdi.' },
  { tag: 'TEST', color: T.blue, text: 'Har qadamda testladi, bug topib tuzatdi', why: 'AI kodiga ko\'r-ko\'rona ishonmadi — o\'qib, sinab, tuzatib bordi.' },
  { tag: 'ISHLADI', color: T.success, text: 'Bitta buyurtma butun tizimni harakatga keltirdi', why: '5 qism — bitta tirik pipeline. Direktor siz, ishchi AI.' }
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

// ===== SCREEN 0 — HOOK (5 orol vs bitta tizim) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('islands');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Hech narsa — har biri alohida yaxshi' },
    { id: 'b', label: 'Ulanish — ular bir-biriga ma\'lumot uzatmasa, tizim emas' },
    { id: 'c', label: 'Ko\'proq komponent qo\'shish' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'islands'
    ? { who: '5 alohida qism', emoji: '🏝️', say: 'React bor, Node bor, baza bor, bot bor, AI bor — lekin har biri alohida ishlaydi, bir-biriga ulanmagan.', ok: false }
    : { who: 'Bitta tizim', emoji: '🔗', say: 'Ular ulanganda: bitta "Buyurtma" → backend → baza → bot xabar + AI javob. Hammasi birga ishlaydi!', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>5 qism tayyor — lekin ular bir-biriga <span className="italic" style={{ color: T.accent }}>ulanmagan</span>. Nima yetishmayapti?</h1>
        <Mentor>Oldingi modullarda React, Node, PostgreSQL, Telegram, AI ni o'rgandingiz. Endi ularni bitta tizimga ulaymiz. Ikki holatni bosing.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'islands' ? 'chip-on' : ''}`} onClick={() => setV('islands')}>🏝️ Alohida</button>
              <button className={`chip ${v === 'system' ? 'chip-on' : ''}`} onClick={() => setV('system')}>🔗 Ulangan</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.success : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nima yetishmayapti?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri — yetishmagani <b>ulanish (pipeline)</b>. Bugun beshala qismni bitta ishlaydigan tizimga ulaymiz. Va kodni qo'lda yozmaymiz — <b>AI-promptlar bilan</b> (vibecoding). Siz — direktor.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: '5 komponent: React, Node, PostgreSQL, Telegram, AI', tag: '' },
    { text: 'Pipeline xaritasi: ma\'lumot qanday oqadi', tag: '' },
    { text: 'Vibecoding: aniq prompt → AI kod → test → tuzat', tag: '' },
    { text: 'Pipeline\'ni ulash + sikl (jonli)', tag: 'jonli' },
    { text: 'O\'z pipeline build rejangizni yozasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.link(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>5 qism → bitta tizim</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>AI-promptlar bilan ulaymiz (vibecoding).</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Siz direktor, AI ishchi — butun tizimni siz boshqarasiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Hamma qismni bitta pipeline'ga ulaymiz</span></h2></div>
        <Mentor>Qismlarni noldan yozmaymiz — siz <b style={{ color: T.ink }}>direktor</b> sifatida AI'ga aniq buyurasiz, kodini o'qib testlaysiz. Bu — vibecoding.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — 5 KOMPONENT =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(COMPONENTS.map(c => c.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= COMPONENTS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? COMPONENTS.find(c => c.id === active) : null;
  return (
    <Stage eyebrow="5 komponent" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${COMPONENTS.length} komponentni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pipeline'ning <span className="italic" style={{ color: T.accent }}>5 qismi</span></h2></div>
        <Mentor>Hammasini avval o'rgandingiz — endi ular bitta jamoa. Har birini bosing: nima qiladi va qaysi moduldan.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COMPONENTS.map(c => (<button key={c.id} onClick={() => tap(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === c.id ? `inset 0 0 0 2px ${c.color}, 0 8px 20px -8px ${c.color}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 20 }}>{c.emoji}</span><span style={{ flex: 1 }}><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink }}>{c.label}</span><span className="small" style={{ color: c.color, marginLeft: 7 }}>{c.role}</span></span>{seen.has(c.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label} · {cur.mod}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.does}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir komponentni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Markazda Node.js — barcha so'rov u orqali oqadi. U "miya".</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — PIPELINE XARITASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FLOW = [
    { emoji: '⚛️', t: 'Mijoz web\'da "Buyurtma" bosadi (React)' },
    { emoji: '🟢', t: 'React → Node\'ga POST /orders yuboradi' },
    { emoji: '🐘', t: 'Node → PostgreSQL\'ga buyurtmani saqlaydi' },
    { emoji: '✈️', t: 'Node → Telegram\'da adminga xabar yuboradi' },
    { emoji: '🤖', t: 'AI mijoz savoliga javob beradi' }
  ];
  const [step, setStep] = useState(storedAnswer ? FLOW.length - 1 : -1);
  const done = step >= FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => setStep(n => Math.min(n + 1, FLOW.length - 1));
  return (
    <Stage eyebrow="Pipeline xaritasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Oqimni kuzating (${Math.max(0, step + 1)}/${FLOW.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta buyurtma — <span className="italic" style={{ color: T.accent }}>butun tizim harakatda</span></h2></div>
        <Mentor>Ma'lumot pipeline bo'ylab qanday oqishini ko'ring. Bosib, qadamlarni ochib boring.</Mentor>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 620, width: '100%', margin: '0 auto' }}>
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
        {!done && <button className="btn" onClick={advance} style={{ alignSelf: 'center' }}>{step < 0 ? '▶ Buyurtmani boshlash' : 'Keyingi qadam →'}</button>}
        {done && <div className="frame-success fade-step" style={{ maxWidth: 620, width: '100%', margin: '0 auto' }}><p className="body" style={{ margin: 0, color: T.ink }}>Mana pipeline: bitta bosish — 5 qism ketma-ket ishlaydi. Endi shuni quramiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Pipeline (tizim) nima degani?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"Pipeline" (tizim) <span className="italic" style={{ color: T.accent }}>nima</span> degani?</h2></>}
    options={['Bitta katta fayl', 'Komponentlar bog\'lanib, ma\'lumot ular orasida oqadigan tizim', 'Faqat frontend', 'Ko\'p sonli mustaqil dasturlar']} correctIdx={1}
    explainCorrect="To'g'ri! Pipeline — komponentlar (React, Node, DB, bot, AI) bog'lanib, ma'lumot ular orasida oqadigan yagona tizim. Bitta amal butun zanjirni harakatga keltiradi."
    explainWrong={{ 0: 'Bitta fayl emas — bog\'langan komponentlar tizimi.', 2: 'Faqat frontend emas — barcha qismlar birga.', 3: 'Mustaqil emas — aynan ularning BOG\'LANISHI pipeline qiladi.', default: 'Pipeline = bog\'langan komponentlar, ma\'lumot oqadi.' }} />
);

// ===== SCREEN 5 — VIBECODING PRINTSIPI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('blind');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['blind', 'director']) : new Set(['blind']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vibecoding" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Vibecoding: <span className="italic" style={{ color: T.accent }}>siz direktor, AI ishchi</span></h2></div>
        <Mentor>Vibecoding — AI bilan kod yozish. Lekin ikki xil yo'l bor. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'blind' ? 'chip-on' : ''}`} onClick={() => set('blind')}>🙈 Ko'r-ko'rona</button>
              <button className={`chip ${v === 'director' ? 'chip-on' : ''}`} onClick={() => set('director')}>🎬 Direktor</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'director' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'director' ? '🎬' : '🙈'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'blind'
                ? '"Sayt qil" deb yozib, AI bergan kodni o\'qimasdan ishlatasiz. Bug chiqsa — nima qilishni bilmaysiz.'
                : 'Aniq buyurasiz, AI kodini o\'qiysiz, testlaysiz, kerak bo\'lsa tuzatasiz. Tizimni siz boshqarasiz.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'blind'
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'r-ko'rona — AI xatosini ko'rmaysiz. Tizim sizning nazoratingizdan chiqadi.</p></div>
              : <div className="frame-success fade-step" key="d"><p className="body" style={{ margin: 0, color: T.ink }}>Direktor — AI tez yozadi, siz aql va nazoratni berasiz. Eng kuchli juftlik.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Vibecoding: aniq buyur · kodni o'qi · testla · tuzat. Siz mas'ulsiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Vibecoding'da sizning (direktor) rolingiz nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Vibecoding'da sizning <span className="italic" style={{ color: T.accent }}>rolingiz</span>?</h2></>}
    options={['AI bergan har narsani o\'qimasdan ishlatish', 'Aniq buyurish, kodni o\'qib tushunish va testlash', 'Hamma kodni qo\'lda yozish', 'Hech narsa qilmaslik']} correctIdx={1}
    explainCorrect="To'g'ri! Siz direktorsiz: aniq buyurasiz, AI kodini o'qib tushunasiz, testlaysiz va tuzatasiz. AI tez yozadi, siz nazorat qilasiz."
    explainWrong={{ 0: 'O\'qimasdan ishlatish — xavfli. Siz tushunishingiz kerak.', 2: 'Hammasini qo\'lda emas — AI yozadi, siz boshqarasiz.', 3: 'Direktor faol: buyuradi, o\'qiydi, testlaydi.', default: 'Aniq buyur, o\'qib tushun, testla.' }} />
);

// ===== SCREEN 6 — PIPELINE QURUVCHI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [built, setBuilt] = useState(() => storedAnswer ? new Set(LINKS.map(l => l.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'l1' : null);
  const [flowing, setFlowing] = useState(false);
  const workRef = useRef(null);
  const allBuilt = built.size >= LINKS.length;
  const done = allBuilt;
  const build = (id) => { setActive(id); setBuilt(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const nodeActive = (nid) => [...built].some(lid => { const l = LINKS.find(x => x.id === lid); return l && l.nodes.includes(nid); });
  const cur = active ? LINKS.find(l => l.id === active) : null;
  return (
    <Stage eyebrow="Pipeline quruvchi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ulanishlarni quring (${built.size}/${LINKS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pipeline'ni <span className="italic" style={{ color: T.accent }}>prompt bilan ulang</span></h2></div>
        <Mentor>Har ulanish uchun AI'ga prompt yuborasiz — AI kod yozadi, ulanish yonadi. 4 tasini ulang, keyin "Buyurtma yuboring"!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className={`pipe-board ${flowing ? 'pipe-flow' : ''}`}>
              {PNODES.map((n, i) => { const on = nodeActive(n.id); return (<span key={n.id} className={`pnode ${on ? 'pnode-on' : ''}`} style={{ animationDelay: `${i * 0.18}s` }}><span style={{ fontSize: 16 }}>{n.emoji}</span>{n.label}</span>); })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {LINKS.map(l => { const on = built.has(l.id); return (
                <button key={l.id} onClick={() => build(l.id)} className={`plink ${on ? 'plink-on' : ''}`}>
                  <span className="plink-box">{on ? Ico.check(13) : Ico.bolt(13)}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{l.label}</span></span>
                  <span className="plink-act">{on ? 'ulandi' : 'prompt yubor'}</span>
                </button>
              ); })}
            </div>
            {allBuilt && !flowing && <button className="btn" onClick={() => setFlowing(true)} style={{ alignSelf: 'flex-start' }}>▶ Buyurtma yuborish</button>}
          </Col>
          <Col>
            {cur && !flowing && (<div className="sk-info fade-step" key={active}><p className="flow-label" style={{ margin: 0 }}>{cur.label} — promptingiz</p><p style={{ fontFamily: G, fontSize: 13.5, color: T.ink, margin: '8px 0 10px', fontStyle: 'italic' }}>"{cur.prompt}"</p><div className="codepill">{cur.code}</div></div>)}
            {!cur && !flowing && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Ulanishni bosing — promptni va AI yozgan kodni ko'rasiz.</p></div>}
            {flowing && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>⚡</div><p className="ta-h">Tizim ishladi!</p><p className="ta-sub">Buyurtma → bazaga saqlandi → admin xabardor → AI javob berdi. Bitta bosish, butun pipeline.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — ANIQ vs NOANIQ PROMPT =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('vague');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['vague', 'precise']) : new Set(['vague']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Prompt sifati" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aniq prompt = <span className="italic" style={{ color: T.accent }}>aniq kod</span></h2></div>
        <Mentor>AI buyruq qanaqa bo'lsa, shunaqa yozadi. Noaniq prompt — taxmin. Aniq prompt — kerakli kod. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'vague' ? 'chip-on' : ''}`} onClick={() => set('vague')}>🌫️ Noaniq</button>
              <button className={`chip ${v === 'precise' ? 'chip-on' : ''}`} onClick={() => set('precise')}>🎯 Aniq</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'precise' ? T.success : T.accent}` }}>
              <p className="mono small" style={{ margin: 0, color: T.ink2, fontWeight: 700 }}>PROMPT:</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, fontStyle: 'italic' }}>{v === 'vague' ? '"buyurtma qismini yoz"' : '"Express POST /orders: req.body dan {mahsulot, soni} ol, orders jadvaliga INSERT qil, 201 qaytar"'}</p>
            </div>
          </Col>
          <Col>
            {v === 'vague'
              ? <div className="frame-warn fade-step" key="va"><p className="note-h" style={{ color: T.accent }}>AI taxmin qiladi</p><p className="body" style={{ margin: 0, color: T.ink }}>Qaysi manzil? Qaysi jadval? Javob qanday? AI o'zicha taxmin qiladi — ko'pincha noto'g'ri yoki chala.</p></div>
              : <div className="frame-success fade-step" key="pr"><p className="note-h" style={{ color: T.success }}>AI aniq yozadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Yo'l, jadval, javob aniq — AI to'g'ri kodni birinchi urinishdayoq yozadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi prompt: nima, qayerda, qanday format — aniq ayting.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — VIBECODING SIKLI (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? VIBE_STEPS.length - 1 : 0);
  const workRef = useRef(null);
  const done = step >= VIBE_STEPS.length - 1;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const advance = () => setStep(n => Math.min(n + 1, VIBE_STEPS.length - 1));
  const cur = VIBE_STEPS[step] || VIBE_STEPS[0];
  return (
    <Stage eyebrow="Vibecoding sikli · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni kuzating (${step + 1}/${VIBE_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Vibecoding sikli: <span className="italic" style={{ color: T.accent }}>prompt → kod → test → tuzat</span></h2></div>
        <Mentor>Bir ulanishni qanday quramiz? Sikl orqali. Bosib, har qadamni ko'ring — bug ham chiqadi!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="vibe-track">
              {VIBE_STEPS.map((s, i) => { const on = i <= step; return (<div key={s.k} className="vibe-row" style={{ opacity: on ? 1 : 0.32, transition: 'opacity 0.35s' }}><span className="vibe-dot" style={{ background: on ? s.color : T.ink3 }}>{i < step ? Ico.check(11) : i + 1}</span><span className="vibe-tag" style={{ color: on ? s.color : T.ink3 }}>{s.tag}</span></div>); })}
            </div>
            {!done && <button className="btn" onClick={advance} style={{ alignSelf: 'flex-start' }}>{step === 0 ? '▶ Siklni boshlash' : 'Keyingi qadam →'}</button>}
          </Col>
          <Col>
            <div key={step} className="vibe-card fade-step" style={{ borderLeft: `4px solid ${cur.color}` }}>
              <span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span>
              <div className="codepill" style={{ margin: '12px 0 10px' }}>{cur.text}</div>
              <p className="body" style={{ margin: 0, color: T.ink2 }}>{cur.note}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana sikl: aniq prompt → AI kod → test → bug → tuzat → ishladi. Har ulanish shunday quriladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Qaysi prompt AI'dan yaxshi (aniq) natija beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi prompt <span className="italic" style={{ color: T.accent }}>yaxshi natija</span> beradi?</h2></>}
    options={['"yaxshi sayt qil"', '"POST /orders yoz: body{mahsulot,soni}, orders jadvaliga INSERT, 201 qaytar"', '"kod yoz"', '"hammasini o\'zing hal qil"']} correctIdx={1}
    explainCorrect="To'g'ri! Aniq prompt — nima (POST /orders), kirish (body), amal (INSERT), natija (201). AI taxmin qilmaydi, kerakli kodni yozadi."
    explainWrong={{ 0: 'Juda umumiy — AI nimani, qanday qilishni bilmaydi.', 2: 'Noaniq — qaysi kod, nima uchun?', 3: '"O\'zing hal qil" — nazoratni yo\'qotasiz.', default: 'Aniq, texnik tafsilotli prompt eng yaxshi.' }} />
);

// ===== SCREEN 10 — AI KODINI O'QISH =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('trust');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['trust', 'read']) : new Set(['trust']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="AI kodini o'qish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI kodiga <span className="italic" style={{ color: T.accent }}>ko'r-ko'rona ishonmang</span></h2></div>
        <Mentor>AI tez yozadi, lekin xato ham qiladi. Direktor kodni o'qiydi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'trust' ? 'chip-on' : ''}`} onClick={() => set('trust')}>🙈 Ko'rmasdan ishlat</button>
              <button className={`chip ${v === 'read' ? 'chip-on' : ''}`} onClick={() => set('read')}>👁️ O'qib tushun</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'read' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'read' ? '👁️' : '🙈'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'trust'
                ? 'Kodni o\'qimasdan ishlatasiz. AI maxfiy token\'ni kodga yozib qo\'yibti — siz bilmaysiz, xavfsizlik teshigi.'
                : 'Har qatorni o\'qiysiz: nima qilyapti, xavfsizmi? Xatoni darrov ko\'rasiz va tuzatasiz.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'trust'
              ? <div className="frame-warn fade-step" key="t"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rmasdan ishonish — AI xatosi sizning xatongizga aylanadi.</p></div>
              : <div className="frame-success fade-step" key="r"><p className="body" style={{ margin: 0, color: T.ink }}>O'qish — tushunish. Tushunsangiz, tuzata olasiz va nazorat sizda.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: AI yozadi, lekin oxirgi qaror — siznikida. Doim o'qing.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — INTEGRATSIYA BUG'I =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CAUSES = [
    { id: 'c1', t: 'Mahsulot rangi noto\'g\'ri', ok: false },
    { id: 'c2', t: '.env\'da API_URL yo\'q yoki noto\'g\'ri (frontend backendni topolmayapti)', ok: true },
    { id: 'c3', t: 'Logotip kichik', ok: false }
  ];
  const [picked, setPicked] = useState(storedAnswer ? 'c2' : null);
  const solved = picked === 'c2';
  const pick = (id) => { if (solved) return; setPicked(id); };
  useEffect(() => { if (solved && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [solved]);
  return (
    <Stage eyebrow="Integratsiya bug'i" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'Sababni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Klassik bug: <span className="italic" style={{ color: T.accent }}>frontend backendga ulanmayapti</span></h2></div>
        <Mentor>Qismlarni ulaganda eng ko'p uchraydigan bug — ulanish manzili. Simptomni o'qing, sababni toping.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}`, padding: '14px 16px' }}>
              <p className="mono small" style={{ margin: '0 0 6px', color: T.accent, fontWeight: 700 }}>🐞 SIMPTOM</p>
              <p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: 0, lineHeight: 1.5 }}>Mijoz "Buyurtma" bosadi — lekin hech narsa bo'lmaydi. Konsolda: <span className="mono" style={{ fontSize: 12, color: T.accent }}>Failed to fetch</span>. Backend ishlayapti, baza ham. Nima sabab?</p>
            </div>
            <p className="flow-label">Sababni tanlang</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CAUSES.map(c => { const isP = picked === c.id; const showOk = solved && c.ok; const showWrong = isP && !c.ok; return (
                <button key={c.id} onClick={() => pick(c.id)} disabled={solved} className={`det-opt ${showOk ? 'det-correct' : ''} ${showWrong ? 'det-wrong shake-x' : ''}`}>
                  <span className="det-box">{showOk ? Ico.check(13) : (showWrong ? Ico.x(13) : '')}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{c.t}</span>
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {!solved && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>"Failed to fetch" = frontend backend manziliga yeta olmadi. Manzil qayerda saqlanadi?</p></div>}
            {solved && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>Topdingiz! 🔧</p><p className="body" style={{ margin: 0, color: T.ink }}>Frontend backend manzilini <span className="mono" style={{ fontSize: 12 }}>.env</span> dan oladi. API_URL yo'q yoki noto'g'ri bo'lsa — ulanmaydi. Tuzatish: to'g'ri URL'ni qo'ying. End-to-end test shu bug'larni tutadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Integratsiya (ulanish) bug'larini qanday tutamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ulanish bug'larini qanday <span className="italic" style={{ color: T.accent }}>tutamiz</span>?</h2></>}
    options={['Kodni umuman testlamaymiz', 'Har ulanishni va butun oqimni (end-to-end) sinab ko\'ramiz', 'Faqat rangga qaraymiz', 'AI hech qachon xato qilmaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Har ulanishni alohida, keyin butun pipeline'ni boshidan oxirigacha (end-to-end) sinaymiz. Shunda integratsiya bug'lari (URL, .env, format) ko'rinadi."
    explainWrong={{ 0: 'Testlamaslik — bug\'larni mijoz topadi. Yomon.', 2: 'Rang emas — ulanish ishlayaptimi, shuni sinash kerak.', 3: 'AI ham xato qiladi — shuning uchun testlaymiz.', default: 'Har ulanishni va end-to-end oqimni sinang.' }} />
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>5 qism → bitta tizim</span></h2></div>
        <Mentor>Bir o'quvchining pipeline qurish yo'li — 4 qadam. Har qatorni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.grape, display: 'inline-flex' }}>{Ico.link(16)}</span><span className="cl-title">Pipeline qurish — vibecoding hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bo'l → prompt → test → ishlat. Mana vibecoding bilan tizim qurish. Endi o'zingiz rejalang.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Vibecoding: <span className="italic" style={{ color: T.accent }}>bo'l · buyur · testla · ula</span></h2></div>
      <Mentor>Yodda tuting: tizimni qismlarga bo'l, aniq prompt ber, kodni o'qib testla, qadam-qadam ula.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎬</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — direktor</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>AI ishlaydi, siz butun tizimni boshqarasiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">3 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.target(18), c: T.accent, t: 'ANIQ PROMPT — nima, qayer, qanday format' }, { ic: Ico.eye(18), c: T.blue, t: 'KODNI O\'QI — ko\'r-ko\'rona ishonma' }, { ic: Ico.repeat(18), c: T.success, t: 'TESTLA + TUZAT — har ulanishni sinab ula' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: pipeline build rejasi =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Ulash tartibi: masalan React→Node→DB→bot→AI', '1-ulanish uchun aniq prompt (masalan POST /orders ...)', '2-ulanish uchun aniq prompt'];
const LBL = ['Ulash tartibi', '1-prompt', '2-prompt'];
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
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>pipeline build rejangiz</span></h2></div>
        <Mentor>O'z tizimingiz uchun: komponentlarni qaysi tartibda ulaysiz va 2 ta ulanish uchun qanday aniq prompt yozasiz? Kamida 2 qatorni to'ldiring.</Mentor>
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
            <p className="flow-label">Sizning build rejangiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — rejangiz shu yerda yig'iladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.link(15)}</span><span className="cl-title">Mening pipeline rejam</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Shu reja bilan AI'ga buyurib, pipeline'ingizni qadam-qadam quryasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['5 komponent → bitta pipeline (ma\'lumot oqadi)', 'Vibecoding: siz direktor, AI ishchi', 'Aniq prompt = aniq kod; kodni o\'qib testla', 'End-to-end test integratsiya bug\'ini tutadi'];
  const HOMEWORK = [{ b: 'Tizimni ulanishlarga bo\'ling', t: '— har biri uchun aniq prompt yozing' }, { b: 'Qadam-qadam ulang', t: '— har ulanishni alohida testlang' }, { b: 'End-to-end sinang', t: '— bitta buyurtma butun oqimni tekshiradi' }];
  const GLOSSARY = [{ b: 'Pipeline', t: '— bog\'langan komponentlar tizimi' }, { b: 'Vibecoding', t: '— AI-promptlar bilan qurish (siz direktor)' }, { b: 'Integratsiya bug\'i', t: '— ulanish xatosi (URL/.env/format)' }, { b: 'End-to-end', t: '— boshidan oxirigacha sinash' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Loyiha kuni tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>tizim quryasiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! 5 komponentni bitta pipeline\'ga, vibecoding bilan ulashni o\'rgandingiz. Endi React Native — yana bir "eshik" qo\'shamiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Pipeline ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Bo'l, buyur, testla, ula! ⚡</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>📱</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi: React Native (mobil)</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Pipeline'ingizga yana bir "eshik" — mobil ilova qo'shamiz. O'sha backendga ulanadi.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PipelineProjectLesson({ lang: langProp, onFinished }) {
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
        @keyframes node-pulse { 0%,100% { transform: scale(1); box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.2); } 50% { transform: scale(1.08); box-shadow: 0 0 0 4px ${T.grape}33, 0 8px 20px -6px ${T.grape}66; } }

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

        /* === PIPELINE QURUVCHI (s6) === */
        .pipe-board { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; justify-content: center; background: ${CODE.bg}; border-radius: 14px; padding: 14px 12px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); }
        .pnode { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: #9FB4D8; background: #ffffff10; border-radius: 10px; padding: 8px 11px; transition: all 0.35s; }
        .pnode-on { color: #fff; background: ${T.grape}; box-shadow: 0 0 14px -2px ${T.grape}99; }
        .pipe-flow .pnode-on { animation: node-pulse 0.7s ease-in-out; }
        .pipe-flow .pnode-on:nth-child(1) { animation-delay: 0s; } .pipe-flow .pnode-on:nth-child(2) { animation-delay: 0.18s; } .pipe-flow .pnode-on:nth-child(3) { animation-delay: 0.36s; } .pipe-flow .pnode-on:nth-child(4) { animation-delay: 0.54s; } .pipe-flow .pnode-on:nth-child(5) { animation-delay: 0.72s; }
        .plink { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .plink:hover { transform: translateY(-1px); }
        .plink-on { background: ${T.grapeSoft}; box-shadow: inset 0 0 0 1.5px ${T.grape}; }
        .plink-box { width: 22px; height: 22px; min-width: 22px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; background: ${T.grape}; color: #fff; }
        .plink-label { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .plink-act { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.grape}; text-transform: uppercase; letter-spacing: 0.04em; }
        .codepill { font-family: 'JetBrains Mono'; font-size: 11.5px; line-height: 1.5; color: ${CODE.str}; background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; word-break: break-word; }

        /* === VIBECODING SIKLI (s8) === */
        .vibe-track { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }
        .vibe-row { display: flex; align-items: center; gap: 11px; padding: 5px 0; }
        .vibe-dot { width: 24px; height: 24px; min-width: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; transition: background 0.3s; }
        .vibe-tag { font-family: 'Manrope'; font-weight: 700; font-size: 12px; letter-spacing: 0.03em; transition: color 0.3s; }
        .vibe-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }

        /* === DATA-DETEKTIV opsiyalar (s11) === */
        .det-opt { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 11px; padding: 12px 14px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Georgia, serif'; font-size: 13.5px; color: ${T.ink}; }
        .det-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -8px rgba(${T.shadowBase},0.22); }
        .det-opt:disabled { cursor: default; }
        .det-correct { background: ${T.successSoft} !important; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .det-wrong { background: ${T.accentSoft} !important; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .det-box { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.6px ${T.ink3}; color: #fff; }
        .det-correct .det-box { background: ${T.success}; box-shadow: none; }
        .det-wrong .det-box { background: ${T.accent}; box-shadow: none; }

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
