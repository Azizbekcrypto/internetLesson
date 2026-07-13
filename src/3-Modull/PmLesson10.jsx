import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 10-DARS (Modul 3 · PM4 · FINALE) — FRONTEND MAHSULOTNI TOPSHIRISH — PLATFORM STANDARD v16
// G'oya: frontend = chiroyli vitrina, lekin ortida ombor (backend) yo'q. Ma'lumot vaqtinchalik xotirada (state) —
//        sahifa yangilanса (F5) o'chadi. Mahsulotni mijozga HALOL topshirish + Modul 4 (backend) ga ko'prik.
// Metafora: Vitrina (frontend) vs Ombor (backend + ma'lumotlar bazasi).
// Signature interaktiv: F5 SINOVI — jonli mini-do'kon, mahsulot qo'shasiz → "Sahifani yangilash" → savat bo'shaydi.
// React bog'lanish: useState = vaqtinchalik xotira; doimiy saqlash uchun server + DB kerak.
// AUDIOSIZ — ovoz yo'q, faqat matn va animatsiya.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
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
  user: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.2-5.8 7-5.8s7 2.2 7 5.8" /></svg>),
  cart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h2l2.4 11h10l2-7H6.2" /></svg>),
  store: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 10v9h16v-9" /><path d="M3 10l1.6-5h14.8L21 10a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M9 19v-5h6v5" /></svg>),
  box: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 8l9-4 9 4-9 4-9-4z" /><path d="M3 8v8l9 4 9-4V8" /><path d="M12 12v8" /></svg>),
  refresh: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" /></svg>),
  server: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></svg>)
};

const LESSON_META = { lessonId: 'pm-frontend-handoff-10-v16', lessonTitle: { uz: 'Frontend mahsulotni topshirish', ru: 'Сдача frontend-продукта' } };
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
// Mini-do'kon mahsulotlari (s3 signature)
const SHOP = [
  { id: 'olma',  name: 'Olma',  emoji: '🍎' },
  { id: 'non',   name: 'Non',   emoji: '🍞' },
  { id: 'sut',   name: 'Sut',   emoji: '🥛' },
  { id: 'choy',  name: 'Choy',  emoji: '🍵' },
  { id: 'tuxum', name: 'Tuxum', emoji: '🥚' },
  { id: 'asal',  name: 'Asal',  emoji: '🍯' }
];

// Vitrina (frontend) vs Ombor (backend) (s2)
const VITRINA = ['Chiroyli ko\'rinadi — rang, tugma, animatsiya', 'Foydalanuvchi ko\'radi va bosadi', 'Ma\'lumotni faqat vaqtincha ushlaydi (state)'];
const OMBOR = ['Ko\'rinmaydi — orqada turadi', 'Ma\'lumotni DOIMIY saqlaydi', 'Server + ma\'lumotlar bazasi'];

// Kodda yozilgan (qoladi) vs foydalanuvchi kiritgan (yo'qoladi) (s6)
const STAYS = ['Mahsulotlar ro\'yxati (kodda yozilgan)', 'Tugma va sahifa dizayni', 'Matnlar va ranglar'];
const GONE = ['Savatga qo\'shgan mahsulotlaringiz', 'Formaga yozgan ma\'lumotingiz', 'Login holati ("kirgan"lik)'];

// Frontend → Backend → Ombor oqimi (s7)
const FLOW = [
  { ic: Ico.user(20),    c: T.honey,   t: 'Foydalanuvchi',            d: 'Tugmani bosadi, mahsulot qo\'shadi' },
  { ic: Ico.store(20),   c: T.accent,  t: 'Frontend — Vitrina',       d: 'Chiroyli ko\'rsatadi (lekin saqlamaydi)' },
  { ic: Ico.server(20),  c: T.blue,    t: 'Backend — Server',         d: 'So\'rovni qabul qiladi, qayta ishlaydi' },
  { ic: Ico.box(20),     c: T.success, t: 'Ombor — Ma\'lumotlar bazasi', d: 'Doimiy saqlaydi — F5 da ham qoladi' }
];

// Ma'lumot ↔ qayerda yashaydi (s8 matching)
const HOMES = [
  { id: 'savat', feat: 'Savatdagi mahsulotlar', crit: 'Backend bazasida — F5 dan keyin ham qoladi' },
  { id: 'dizayn', feat: 'Tugma rangi va dizayn', crit: 'Frontend kodida — har doim bir xil' },
  { id: 'login', feat: 'Login holati', crit: 'Backend sessiyasida — qayta kirish shart emas' },
  { id: 'menyu', feat: 'Vaqtincha ochilgan menyu', crit: 'Frontend state — yopilsa o\'chadi (normal)' }
];

// To'liq topshirish namunasi: klient + texnik (s13)
const CASE_AC = [
  { tag: 'KLIENT', color: T.honey, text: 'Dizayn va foydalanuvchi oqimi tayyor — bosib ko\'rishingiz mumkin', why: 'Mijoz tilida: nima qilingani va ko\'rsa bo\'ladigani.' },
  { tag: 'KLIENT', color: T.honey, text: 'Ma\'lumot hozircha saqlanmaydi — bu demo bosqichi', why: 'Halol gap: cheklovni oldindan ayting, keyin ajablanmasin.' },
  { tag: 'TEXNIK', color: T.blue, text: 'Ma\'lumot useState\'da — sahifa yangilansa o\'chadi', why: 'Dasturchi tilida: nega vaqtinchalik ekani.' },
  { tag: 'TEXNIK', color: T.blue, text: 'Keyingi bosqich: backend + ma\'lumotlar bazasi ulanadi', why: 'Aniq keyingi qadam — ko\'prik Modul 4 ga.' }
];

const Split = ({ children, refEl }) => <div className="split" ref={refEl}>{children}</div>;
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

const Q = ({ children, max = 760 }) => <h2 className="title h-title fade-up" style={{ maxWidth: max }}>{children}</h2>;
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

const SpecCard = ({ items, minH = 200, title = 'Ro\'yxat', icon }) => (
  <div className="spec-card" style={{ minHeight: minH }}>
    <div className="spec-head"><span style={{ display: 'inline-flex', color: '#9FB4D8' }}>{icon || Ico.clip(15)}</span><span className="spec-title">{title}</span></div>
    {items.map((it, i) => (
      <div key={i} className={it.text ? 'feat-pop' : ''}>
        {it.label && <span className="spec-lbl" style={{ color: it.color || '#9FB4D8' }}>{it.label}</span>}
        <p className="spec-text" style={{ color: it.text ? '#E8E5DD' : '#6B7585', fontStyle: it.text ? 'normal' : 'italic' }}>{it.text || it.ph}</p>
      </div>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK (mijoz qo'ng'irog'i) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('client');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Dasturchi kodda xato qilgan' },
    { id: 'b', label: 'Frontend ma\'lumotni saqlamaydi — u faqat vaqtinchalik xotirada edi' },
    { id: 'c', label: 'Internet uzilib qolgan' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'client'
    ? { who: 'Mijoz', emoji: '😟', say: 'Kecha 10 ta mahsulot qo\'shgandim. Bugun ochsam — savat bo\'m-bo\'sh!', ok: false }
    : { who: 'Dasturchi', emoji: '🤔', say: 'Sayt to\'g\'ri ishlaydi. Lekin ma\'lumot faqat brauzer xotirasida edi — sahifa yangilanganda o\'chdi.', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Mijoz qo'ng'iroq qiladi: <span className="italic" style={{ color: T.accent }}>"Qo'shgan mahsulotlarim yo'qolibdi!"</span> — nega?</h1>
        <Mentor>Sayt chiroyli ishlayotgandek edi. Lekin sahifa yangilangach — ma'lumot yo'q. Har birini bosib, kim nima deyotganini ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'client' ? 'chip-on' : ''}`} onClick={() => setV('client')}>Mijoz 😟</button>
              <button className={`chip ${v === 'dev' ? 'chip-on' : ''}`} onClick={() => setV('dev')}>Dasturchi 🤔</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.blue : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Ma'lumot nega yo'qoldi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Frontend — chiroyli <b>vitrina</b>, lekin ortida <b>ombor</b> (backend) yo'q. Ma'lumot doimiy saqlanishi uchun server kerak. Bugun frontendni HALOL topshirishni o'rganamiz.</p>}
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
    { text: 'Frontend = vitrina: ko\'rinadi, lekin saqlamaydi', tag: '' },
    { text: 'F5 sinovi: state nolga qaytadi, ma\'lumot o\'chadi', tag: 'jonli' },
    { text: 'Nega? state = vaqtinchalik xotira', tag: '' },
    { text: 'Mijozga HALOL tushuntirish (cheklovni ayt)', tag: 'mashq' },
    { text: 'O\'z loyihangizni topshirish jumlalarini yozasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.accent} soft={T.accentSoft}>{Ico.store(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Vitrina chiroyli — ombor hali yo'q</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Frontend ko'rsatadi; saqlash uchun backend kerak.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ useState = vaqtinchalik xotira (F5 da o'chadi)</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Frontend mahsulotni qanday halol topshiramiz?</span></h2></div>
        <Mentor>Bu — Modul 3 ning <b style={{ color: T.ink }}>yakuniy</b> darsi. Frontend nima qila oladi, nimani <b style={{ color: T.ink }}>qila olmaydi</b> — va buni mijozga to'g'ri aytishni ko'ramiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — VITRINA vs OMBOR (toggle) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('vitrina');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['vitrina', 'ombor']) : new Set(['vitrina']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'vitrina' ? VITRINA : OMBOR;
  const col = v === 'vitrina' ? T.accent : T.success;
  return (
    <Stage eyebrow="Vitrina vs ombor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend — <span className="italic" style={{ color: T.accent }}>vitrina</span>, backend — <span className="italic" style={{ color: T.success }}>ombor</span></h2></div>
        <Mentor>Do'kon vitrinasi chiroyli ko'rsatadi, lekin tovar <b style={{ color: T.ink }}>omborda</b> saqlanadi. Sayt ham shunaqa. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'vitrina' ? 'chip-on' : ''}`} onClick={() => set('vitrina')}>🛍️ Vitrina (Frontend)</button>
              <button className={`chip ${v === 'ombor' ? 'chip-on' : ''}`} onClick={() => set('ombor')}>📦 Ombor (Backend)</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'vitrina' ? Ico.store(16) : Ico.box(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'vitrina'
              ? <div className="frame-warn fade-step" key="v"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Faqat ko'rsatadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Vitrina go'zal — lekin tovar saqlanmaydi. Frontend ham: chiroyli, ammo ma'lumotni doimiy ushlamaydi.</p></div>
              : <div className="frame-success fade-step" key="o"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Doimiy saqlaydi</p><p className="body" style={{ margin: 0, color: T.ink }}>Ombor ko'rinmaydi, lekin tovarni saqlaydi. Backend ham: ma'lumotni doimiy joyda ushlaydi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hozir bizda faqat <b>vitrina</b> bor. <b>Ombor</b> (backend) — keyingi modulda.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — F5 SINOVI (SIGNATURE: jonli mini-do'kon) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [cart, setCart] = useState({});
  const [flash, setFlash] = useState(false);
  const [justReset, setJustReset] = useState(false);
  const [witnessed, setWitnessed] = useState(!!storedAnswer);
  const timer = useRef(null);
  const flashTimer = useRef(null);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(flashTimer.current); }, []);
  const add = (id) => { if (flash) return; setJustReset(false); setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 })); };
  const reload = () => {
    if (count === 0 || flash) return;
    setFlash(true);
    setWitnessed(true);
    timer.current = setTimeout(() => { setCart({}); setJustReset(true); }, 140);
    flashTimer.current = setTimeout(() => setFlash(false), 700);
  };
  const done = witnessed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const added = SHOP.filter(p => cart[p.id]);
  return (
    <Stage eyebrow="F5 sinovi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval F5 ni sinab ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mini-do'kon: mahsulot qo'shing, keyin <span className="italic" style={{ color: T.accent }}>F5</span> bosing</h2></div>
        <Mentor>Bu jonli mini-do'kon. Mahsulot qo'shing — savat to'ladi. Keyin <b style={{ color: T.ink }}>"Sahifani yangilash (F5)"</b> ni bosing va nima bo'lishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="shop">
              <div className={`flash ${flash ? 'on' : ''}`} />
              <div className="shop-bar">
                <span style={{ display: 'inline-flex', gap: 5 }}><span className="shop-dot" style={{ background: '#FF5F57' }} /><span className="shop-dot" style={{ background: '#FEBC2E' }} /><span className="shop-dot" style={{ background: '#28C840' }} /></span>
                <span className="shop-url">mening-dokonim.uz</span>
                <span className="cart-badge"><span style={{ display: 'inline-flex' }}>{Ico.cart(15)}</span>{count > 0 && <span className="cart-num">{count}</span>}</span>
              </div>
              <div className="shop-grid">
                {SHOP.map(p => { const q = cart[p.id] || 0; return (<button key={p.id} className="prod" onClick={() => add(p.id)}><span style={{ fontSize: 26 }}>{p.emoji}</span><span className="prod-name">{p.name}</span><span className="prod-add">{q > 0 ? `Savatda: ${q}` : '+ Qo\'shish'}</span>{q > 0 && <span className="prod-q">{q}</span>}</button>); })}
              </div>
              <div className="cart-strip">
                {added.length === 0
                  ? <span className="cart-empty">{justReset ? '💨 Savat bo\'shadi — ma\'lumot yo\'qoldi' : 'Savat bo\'sh — mahsulot qo\'shing'}</span>
                  : <span className="cart-list">{added.map(p => <span key={p.id} className="cart-emo">{p.emoji}{cart[p.id] > 1 ? <sup>{cart[p.id]}</sup> : ''}</span>)}</span>}
              </div>
            </div>
            <button className="btn" onClick={reload} disabled={count === 0 || flash} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ display: 'inline-flex' }}>{Ico.refresh(17)}</span>Sahifani yangilash (F5)</button>
          </Col>
          <Col>
            {!witnessed
              ? <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>{count === 0 ? 'Avval bir nechta mahsulot qo\'shing. Savat to\'lganini ko\'rasiz.' : 'Endi "Sahifani yangilash (F5)" ni bosing — savatga nima bo\'lishini kuzating.'}</p></div>
              : <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Ma'lumot yo'qoldi!</p><p className="body" style={{ margin: '0 0 8px', color: T.ink }}>F5 — sahifani noldan qayta yukladi. Savat <b>useState</b>'da edi, ya'ni <b>vaqtinchalik xotirada</b>. Sahifa yangilangach, state nolga qaytdi.</p><p className="body" style={{ margin: 0, color: T.ink2 }}>Hech qanday xato yo'q — frontend shunaqa ishlaydi. Doimiy saqlash uchun <b>ombor (backend)</b> kerak.</p></div>}
            {witnessed && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Eslab qoling: <b>state = vaqtinchalik xotira</b>. F5 = yangi boshlanish.</p></div>}
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
    questionText="useState'dagi ma'lumotga F5 (sahifa yangilash) dan keyin nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>useState'dagi ma'lumotga F5 dan keyin <span className="italic" style={{ color: T.accent }}>nima</span> bo'ladi?</h2></>}
    options={['Doimiy saqlanib qoladi', 'Nolga qaytadi — yo\'qoladi', 'Internetga yuklanadi', 'Avtomatik bazaga yoziladi']} correctIdx={1}
    explainCorrect="To'g'ri! useState — vaqtinchalik xotira. Sahifa yangilanса state noldan boshlanadi, ma'lumot yo'qoladi. Saqlash uchun backend kerak."
    explainWrong={{ 0: 'Aksincha — state doimiy emas. F5 da nolga qaytadi.', 2: 'state hech qayerga yuklanmaydi — u faqat brauzer xotirasida.', 3: 'Bazaga yozish uchun backend kerak. Faqat frontend buni qilmaydi.', default: 'useState F5 da nolga qaytadi — ma\'lumot yo\'qoladi.' }} />
);

// ===== SCREEN 5 — NEGA? state = vaqtinchalik xotira (toggle) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('open');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['open', 'reload']) : new Set(['open']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nega bunday?" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">state — <span className="italic" style={{ color: T.accent }}>brauzer xotirasi</span>, sahifa bilan yashaydi</h2></div>
        <Mentor>state — kompyuter <b style={{ color: T.ink }}>vaqtinchalik xotirasi</b> kabi: tez, lekin o'chirsang yo'qoladi. Ikki holatni bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'open' ? 'chip-on' : ''}`} onClick={() => set('open')}>Sahifa ochiq</button>
              <button className={`chip ${v === 'reload' ? 'chip-on' : ''}`} onClick={() => set('reload')}>Sahifa yangilandi</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {v === 'open'
                ? <><span style={{ fontSize: 26 }}>🟢</span><p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>Sahifa ochiq turibdi: state xotirada saqlanyapti. Savat, forma, login — hammasi joyida.</p></>
                : <><span style={{ fontSize: 26 }}>🔄</span><p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>F5 bosildi: brauzer sahifani noldan quradi. Eski xotira o'chdi — state bo'm-bo'sh holatdan boshlanadi.</p></>}
            </div>
          </Col>
          <Col>
            {v === 'open'
              ? <div className="frame-success fade-step" key="o"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Xotirada bor</p><p className="body" style={{ margin: 0, color: T.ink }}>Sahifa ochiq ekan — ma'lumot ko'rinadi va ishlaydi.</p></div>
              : <div className="frame-warn fade-step" key="r"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Xotira tozalandi</p><p className="body" style={{ margin: 0, color: T.ink }}>Sahifa yangilandi — xotira o'chdi. Bu xato emas, frontendning tabiati.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ma'lumot sahifadan <b>uzoqroq</b> yashashi uchun — uni serverga (omborga) yuborish kerak.</p></div>}
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
    questionText="Ma'lumot F5 dan keyin ham qolishi uchun u qayerda saqlanishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ma'lumot F5 dan keyin ham qolishi uchun u <span className="italic" style={{ color: T.accent }}>qayerda</span> saqlanishi kerak?</h2></>}
    options={['React useState\'da', 'Server + ma\'lumotlar bazasida (backend)', 'Tugma rangida', 'CSS faylida']} correctIdx={1}
    explainCorrect="To'g'ri! Doimiy saqlash uchun ma'lumot serverdagi ombor — ma'lumotlar bazasiga yoziladi. Shunda F5 ham, boshqa qurilma ham uni ko'radi."
    explainWrong={{ 0: 'useState — vaqtinchalik. F5 da o\'chadi. Doimiy joy kerak.', 2: 'Rang — ko\'rinish, saqlash joyi emas.', 3: 'CSS dizayn uchun, ma\'lumot saqlamaydi.', default: 'Doimiy saqlash — backend + ma\'lumotlar bazasida.' }} />
);

// ===== SCREEN 6 — NIMA QOLADI / NIMA YO'QOLADI (toggle) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('stays');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['stays', 'gone']) : new Set(['stays']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'stays' ? STAYS : GONE;
  const col = v === 'stays' ? T.success : T.accent;
  return (
    <Stage eyebrow="Qoladi vs yo'qoladi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">F5 dan keyin <span className="italic" style={{ color: T.success }}>nima qoladi</span>, <span className="italic" style={{ color: T.accent }}>nima yo'qoladi</span>?</h2></div>
        <Mentor>Oddiy qoida: <b style={{ color: T.ink }}>kodda yozilgani</b> qoladi, <b style={{ color: T.ink }}>foydalanuvchi kiritgani</b> yo'qoladi. Ikkalasini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'stays' ? 'chip-on' : ''}`} onClick={() => set('stays')}>✅ Qoladi</button>
              <button className={`chip ${v === 'gone' ? 'chip-on' : ''}`} onClick={() => set('gone')}>💨 Yo'qoladi</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'stays' ? Ico.check(16) : Ico.x(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'stays'
              ? <div className="frame-success fade-step" key="s"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kodda yozilgan</p><p className="body" style={{ margin: 0, color: T.ink }}>Dizayn, matn, mahsulot ro'yxati — kodda turibdi, har yuklashda qaytadan paydo bo'ladi.</p></div>
              : <div className="frame-warn fade-step" key="g"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Foydalanuvchi kiritgan</p><p className="body" style={{ margin: 0, color: T.ink }}>Savat, forma, login — bu state. Hech qayerga yozilmagan, shuning uchun F5 da o'chadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Foydalanuvchi kiritgan narsani saqlash kerak bo'lsa — backend shart.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — FRONTEND → BACKEND → OMBOR OQIMI (stepper) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? FLOW.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = step >= FLOW.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < FLOW.length) timer.current = setTimeout(() => tick(i + 1), 720); else setRunning(false); }; timer.current = setTimeout(() => tick(1), 320); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="To'liq oqim" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumot <span className="italic" style={{ color: T.accent }}>omborga</span> qanday yetib boradi?</h2></div>
        <Mentor>To'liq tizimda ma'lumot 4 bosqichdan o'tadi. Tugmani bosib, oqimni kuzating — <b style={{ color: T.ink }}>oxirgi bosqich</b> bizda hali yo'q.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FLOW.map((f, i) => { const on = step > i; return (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.paper, borderRadius: 12, padding: '12px 14px', opacity: on ? 1 : 0.32, transition: 'opacity 0.4s', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `3px solid ${on ? f.c : T.ink3}` }}><span style={{ color: f.c, display: 'inline-flex' }}>{f.ic}</span><div><p style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink, margin: 0 }}>{f.t}</p><p className="small" style={{ color: T.ink2, margin: '2px 0 0' }}>{f.d}</p></div></div>{i < FLOW.length - 1 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 13, opacity: step > i ? 1 : 0.3 }}>↓</span>}</React.Fragment>); })}
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Yuborilmoqda…' : (done ? '↻ Yana ko\'rish' : 'Oqimni ishga tushirish')}</button>
          </Col>
          <Col>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: '0 0 8px', color: T.ink }}>Ma'lumot <b>omborga</b> (bazaga) yozilsa — F5 ham, boshqa qurilma ham uni ko'radi.</p><p className="body" style={{ margin: 0, color: T.ink2 }}>Bizda hozir 1–2 bosqich (vitrina) bor. <b>3–4 bosqich</b> (server + ombor) — Modul 4.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Frontend faqat birinchi bosqich. Ma'lumot doimiy qolishi uchun u serverga borishi va omborga yozilishi kerak.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MOSLASH: ma'lumot ↔ joy =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CRITS = [
    { id: 'menyu', text: 'Frontend state — yopilsa o\'chadi (normal)' },
    { id: 'savat', text: 'Backend bazasida — F5 dan keyin ham qoladi' },
    { id: 'login', text: 'Backend sessiyasida — qayta kirish shart emas' },
    { id: 'dizayn', text: 'Frontend kodida — har doim bir xil' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(HOMES.map(p => [p.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= HOMES.length;
  const pickF = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickC = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(12.5px,1.5vw,14px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Moslash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${HOMES.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har <span className="italic" style={{ color: T.accent }}>ma'lumot</span> qayerda yashashi kerak?</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>ma'lumotni</b>, keyin unga mos <b style={{ color: T.ink }}>joyni</b> bosing. Hammasi state'da bo'lishi shart emas.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Ma'lumot</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {HOMES.map(p => { const m = matched[p.id]; const on = sel === p.id; return (<button key={p.id} onClick={() => pickF(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.blue, display: 'inline-flex' }}>{m ? Ico.check(17) : Ico.clip(16)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p.feat}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Qayerda yashaydi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {CRITS.map(c => { const m = matched[c.id]; const isWrong = wrong === c.id; return (<button key={c.id} onClick={() => pickC(c.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(16) : '☐'}</span><span style={{ flex: 1 }}>{c.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa ma'lumotning joyi. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hammasi joyida! Ba'zi ma'lumot frontendda qolsa bo'ladi, muhimi — backendда saqlanadi.</p></div>}
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
    questionText="Mijoz: 'Saytni topshirdingmi?' Eng halol javob qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mijozga eng <span className="italic" style={{ color: T.accent }}>halol</span> javob qaysi?</h2></>}
    options={['"Sayt butunlay tayyor, hamma narsa saqlanadi"', '"Frontend tayyor: dizayn va oqim ishlaydi. Ma\'lumot doimiy saqlanishi uchun keyin backend qo\'shamiz"', '"Hammasi ishlaydi, muammo bo\'lmaydi"', '"Ma\'lumot yo\'qolsa, foydalanuvchi aybdor"']} correctIdx={1}
    explainCorrect="To'g'ri! Halol topshirish: nima tayyor ekanini ayting, cheklovni yashirмang, keyingi qadamni tushuntiring. Mijoz ishonadi."
    explainWrong={{ 0: 'Bu — yolg\'on va\'da. F5 da ma\'lumot o\'chadi, mijoz aldangan bo\'ladi.', 2: '"Muammo bo\'lmaydi" — cheklovni yashirish. Keyin ishonch buziladi.', 3: 'Aybni foydalanuvchiga ag\'darish — noprofessional. Cheklovni oldindan ayt.', default: 'Halol javob: nima tayyor, nima keyin — aniq ayt.' }} />
);

// ===== SCREEN 10 — HALOL KOMMUNIKATSIYA (toggle) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('bad');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['bad', 'good']) : new Set(['bad']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Halol gap" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mijozga <span className="italic" style={{ color: T.accent }}>qanday</span> aytasiz?</h2></div>
        <Mentor>Bir xil ish — ikki xil topshirish. Biri ishonchni buzadi, biri mustahkamlaydi. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'bad' ? 'chip-on' : ''}`} onClick={() => set('bad')}>❌ Yomon va'da</button>
              <button className={`chip ${v === 'good' ? 'chip-on' : ''}`} onClick={() => set('good')}>✅ Halol gap</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'good' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'good' ? '🤝' : '🎭'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'good' ? '"Bu — frontend demo: dizayn va oqim tayyor. Ma\'lumot hozircha F5 da o\'chadi. Doimiy saqlash uchun keyingi bosqichda backend qo\'shamiz."' : '"Sayt to\'liq tayyor! Hamma narsa saqlanadi, foydalaning."'}</p>
            </div>
          </Col>
          <Col>
            {v === 'bad'
              ? <div className="frame-warn fade-step" key="b"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ishonch buziladi</p><p className="body" style={{ margin: 0, color: T.ink }}>Mijoz F5 bosadi, ma'lumot yo'qoladi, aldanganini sezadi. Keyingi loyihaga ishonmaydi.</p></div>
              : <div className="frame-success fade-step" key="g"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ishonch ortadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Cheklov oldindan aytilgan. Mijoz nima borligini biladi, keyingi qadamni kutadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Halol topshirish 3 narsani aytadi: <b>nima tayyor</b>, <b>nima cheklangan</b>, <b>keyin nima</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TOPSHIRISH MATNINI YIG'ISH (build) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = {
    c1: { label: 'Demo haqida', a: 'Sayt butunlay tayyor', b: 'Bu — frontend demo: dizayn va oqim ishlaydi' },
    c2: { label: 'Ma\'lumot haqida', a: 'Hamma ma\'lumot saqlanadi', b: 'Ma\'lumot hozircha F5 da o\'chadi — bu demo bosqichi' },
    c3: { label: 'Keyingi qadam', a: 'Boshqa hech narsa kerak emas', b: 'Doimiy saqlash uchun keyin backend qo\'shamiz' }
  };
  const KEYS = ['c1', 'c2', 'c3'];
  const [pick, setPick] = useState(storedAnswer?.pick || {});
  const allGood = KEYS.every(k => pick[k] === 'b');
  const allPicked = KEYS.every(k => pick[k]);
  const workRef = useRef(null);
  const set = (k, v) => { if (allGood) return; setPick(prev => ({ ...prev, [k]: v })); };
  useEffect(() => {
    if (!allGood) return;
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, pick });
    if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  return (
    <Stage eyebrow="Topshirish matni" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allGood} label={allGood ? 'Davom etish' : (allPicked ? 'Halol variantni tanlang' : 'Har bandni tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mijozga <span className="italic" style={{ color: T.accent }}>halol</span> topshirish matnini yig'ing</h2></div>
        <Mentor>Har band uchun ikkita variant — <b style={{ color: T.ink }}>halol</b> (cheklovни yashirmaydigan) ni tanlang. O'ngda topshirish matni to'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {KEYS.map(k => (<div key={k}><p className="flow-label" style={{ margin: '0 0 6px' }}>{POOL[k].label}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['a', 'b'].map(v => { const on = pick[k] === v; return (<button key={v} onClick={() => set(k, v)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 13px', fontFamily: G, fontSize: 13.5, color: on ? '#fff' : T.ink, background: on ? (v === 'b' ? T.success : T.accent) : T.paper, boxShadow: on ? `0 6px 14px -6px ${v === 'b' ? T.success : T.accent}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}>"{POOL[k][v]}"</button>); })}</div></div>))}
          </Col>
          <Col>
            <p className="flow-label">Sizning topshirish matningiz</p>
            <div className="checklist">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.clip(16)}</span><span className="cl-title">Mijozga — frontend topshirish</span></div>
              {KEYS.map(k => { const v = pick[k]; const st = !v ? 'pending' : (v === 'b' ? 'pass' : 'fail'); return (<div key={k} className={`crit crit-${st}`}><span className="crit-box">{st === 'pass' ? Ico.check(13) : st === 'fail' ? Ico.x(13) : ''}</span><span className="crit-text">{v ? POOL[k][v] : '…'}</span></div>); })}
            </div>
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — halol topshirish matni! Mijoz nima borligini aniq biladi.</p></div>}
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
    questionText="Frontend mahsulotni topshirishda nega cheklovni oldindan aytamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega cheklovni <span className="italic" style={{ color: T.accent }}>oldindan</span> aytamiz?</h2></>}
    options={['Mijozni qo\'rqitish uchun', 'Ishonch saqlanadi — keyin ajablanmaydi va aldangani sezilmaydi', 'Kamroq ish qilish uchun', 'Backendni umuman qilmaslik uchun']} correctIdx={1}
    explainCorrect="To'g'ri! Cheklovni oldindan aytsangiz — mijoz nimani kutishni biladi. F5 da ma'lumot o'chsa ham, bu kelishilgan — ishonch saqlanadi."
    explainWrong={{ 0: 'Maqsad qo\'rqitish emas — aniqlik va ishonch.', 2: 'Gap ish hajmida emas — halol kutilma yaratishda.', 3: 'Aksincha — backend keyingi reja. Buni mijozga aytamiz.', default: 'Oldindan aytsak — ishonch saqlanadi, ajablanish bo\'lmaydi.' }} />
);

// ===== SCREEN 13 — NAMUNA: to'liq topshirish (klient + texnik) =====
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
        <div className="head"><h2 className="title h-title fade-up">To'liq topshirish: <span className="italic" style={{ color: T.honey }}>mijoz</span> + <span className="italic" style={{ color: T.blue }}>texnik</span></h2></div>
        <Mentor>Yaxshi topshirishda ikki til bor: <b style={{ color: T.honey }}>mijoz</b> (nima tayyor/cheklangan) va <b style={{ color: T.blue }}>texnik</b> (nega va keyin nima). Har qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.store(16)}</span><span className="cl-title">Frontend demo — topshirish</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Klient + texnik birga — mijoz ham, jamoa ham aniq tushunadi. Endi o'zingiznikini yozasiz.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Frontendni <span className="italic" style={{ color: T.accent }}>halol</span> topshir</h2></div>
      <Mentor>Vitrina tayyor, ombor hali yo'q. Mijozga shuni <b style={{ color: T.ink }}>halol</b> ayting: nima ishlaydi, nima vaqtinchalik, keyin nima bo'ladi.</Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🛍️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Vitrina tayyor</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Ombor (backend) — keyingi bosqich. Buni yashirma.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Topshirishda — 3 narsa</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.store(18), c: T.accent, t: 'NIMA TAYYOR — dizayn va oqim' }, { ic: Ico.refresh(18), c: T.honey, t: 'NIMA VAQTINCHALIK — F5 da o\'chadi' }, { ic: Ico.box(18), c: T.success, t: 'KEYIN NIMA — backend + ombor' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: o'z loyihangizni topshirish jumlalari =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Nima tayyor (dizayn/oqim)…', 'Nima vaqtinchalik (F5 da o\'chadi)…', 'Keyingi qadam (backend)…'];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [lines, setLines] = useState(() => storedAnswer?.lines || emptyLines());
  const isComplete = (f) => f.name.trim().length >= 12;
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
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangizni mijozga <span className="italic" style={{ color: T.accent }}>halol topshirish</span> jumlalari</h2></div>
        <Mentor>Loyihangizni topshirayotgandek <b style={{ color: T.ink }}>3 ta jumla</b> yozing: nima tayyor, nima vaqtinchalik, keyin nima. Kamida 2 tasini to'ldiring.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>{['Nima tayyor', 'Nima vaqtinchalik', 'Keyingi qadam'][i]}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning topshirish matningiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Jumlalarni yozing — bu yerda topshirish matni paydo bo'ladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.store(15)}</span><span className="cl-title">Mijozga — topshirish</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi frontendни ishonch bilan, halol topshira olasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Frontend = vitrina: ko\'rsatadi, lekin saqlamaydi', 'useState = vaqtinchalik xotira — F5 da o\'chadi', 'Doimiy saqlash uchun backend + ma\'lumotlar bazasi kerak', 'Mijozga halol topshir: nima tayyor, nima vaqtinchalik, keyin nima'];
  const HOMEWORK = [{ b: 'Loyihangizni oching', t: '— mahsulot qo\'shing, F5 bosing, ma\'lumot yo\'qolishini ko\'ring' }, { b: 'Topshirish matnini yozing', t: '— 3 jumla: tayyor / vaqtinchalik / keyingi qadam' }, { b: 'Ro\'yxat tuzing', t: '— loyihangizда qaysi ma\'lumot backendда saqlanishi kerak?' }];
  const GLOSSARY = [{ b: 'Frontend (vitrina)', t: '— foydalanuvchi ko\'radigan qism' }, { b: 'Backend (ombor)', t: '— ma\'lumotni doimiy saqlaydigan server' }, { b: 'state', t: '— vaqtinchalik xotira, F5 da o\'chadi' }, { b: 'Halol topshirish', t: '— cheklovni yashirmay, aniq aytib berish' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Modul 3 PM yo'li tugadi</span><h2 className="title h-title fade-up d1">Frontendni endi <span className="italic" style={{ color: T.accent }}>halol</span> topshirasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Frontend nima qila olishini, cheklovini va mijozga to\'g\'ri aytishni bilasiz. Keyingi modulда — ombor (backend) quramiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsни qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Topshirish ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi modulda omborni quramiz — backend! 📦</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🌉</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Ko'prik: Modul 4 — Backend</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Vitrina tayyor. Endi ma'lumotni doimiy saqlaydigan ombor — server va ma'lumotlar bazasini quramiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson10({ lang: langProp, onFinished }) {
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
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
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
        .crit-fail { background: ${T.accentSoft}; } .crit-fail .crit-box { background: ${T.accent}; color: #fff; animation: crit-pop 0.3s cubic-bezier(.2,.7,.2,1); }
        @keyframes crit-pop { 0% { transform: scale(.4); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }

        /* === F5 MINI-DO'KON (signature) === */
        .shop { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.14); position: relative; overflow: hidden; }
        .flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; z-index: 6; }
        .flash.on { animation: flash-sweep 0.7s ease-out; }
        @keyframes flash-sweep { 0% { opacity: 0; } 16% { opacity: 0.95; } 100% { opacity: 0; } }
        .shop-bar { display: flex; align-items: center; gap: 9px; padding-bottom: 11px; border-bottom: 1px solid ${T.ink3}33; margin-bottom: 12px; }
        .shop-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
        .shop-url { flex: 1; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 4px 11px; border-radius: 7px; text-align: center; }
        .cart-badge { position: relative; display: inline-flex; align-items: center; color: ${T.ink}; }
        .cart-num { position: absolute; top: -7px; right: -9px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 99px; background: ${T.accent}; color: #fff; font-family: 'Manrope'; font-weight: 800; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; animation: feat-pop .3s; }
        .shop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
        .prod { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.bg}; border: none; border-radius: 11px; padding: 12px 6px 9px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -8px rgba(${T.shadowBase},0.2); }
        .prod:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(${T.shadowBase},0.28); }
        .prod-name { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; }
        .prod-add { font-family: 'Manrope'; font-weight: 600; font-size: 10px; color: ${T.accent}; }
        .prod-q { position: absolute; top: 6px; right: 6px; min-width: 16px; height: 16px; border-radius: 99px; background: ${T.success}; color: #fff; font-family: 'Manrope'; font-weight: 800; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; }
        .cart-strip { margin-top: 12px; min-height: 34px; display: flex; align-items: center; background: ${T.bg}; border-radius: 10px; padding: 7px 12px; }
        .cart-empty { font-family: 'Georgia, serif'; font-size: 12.5px; color: ${T.ink2}; font-style: italic; }
        .cart-list { display: flex; flex-wrap: wrap; gap: 6px; font-size: 20px; }
        .cart-emo sup { font-family: 'Manrope'; font-size: 10px; font-weight: 800; color: ${T.accent}; }

        /* === QABUL / RAD SHTAMPI === */
        .stamp { position: absolute; top: 46%; left: 50%; font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(20px,5vw,28px); padding: 5px 20px; border-radius: 10px; border: 3px solid; transform: translate(-50%,-50%) rotate(-11deg); letter-spacing: 0.04em; pointer-events: none; z-index: 5; animation: stamp-drop 0.46s cubic-bezier(.2,.7,.2,1); }
        .stamp-qabul { color: ${T.success}; border-color: ${T.success}; background: rgba(31,122,77,0.1); }
        .stamp-rad { color: ${T.accent}; border-color: ${T.accent}; background: rgba(255,79,40,0.1); }
        @keyframes stamp-drop { 0% { transform: translate(-50%,-50%) rotate(-11deg) scale(2.6); opacity: 0; } 55% { transform: translate(-50%,-50%) rotate(-11deg) scale(0.9); opacity: 1; } 100% { transform: translate(-50%,-50%) rotate(-11deg) scale(1); } }

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

        /* === SPEC CARD (qora) === */
        .spec-card { background: ${CODE.bg}; border-radius: 14px; padding: 16px 17px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); display: flex; flex-direction: column; gap: 12px; }
        .spec-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid #ffffff18; }
        .spec-title { font-family: 'JetBrains Mono'; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #9FB4D8; }
        .spec-lbl { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
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
        .takeaway { background: ${T.successSoft}; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.success}; font-weight: 600; font-size: 13px; margin: 0; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }

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

        /* MOBIL: yig'iladigan Mentor */
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
