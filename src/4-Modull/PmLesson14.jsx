import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 14-DARS (Modul 4 · PM4 · FINALE) — FULLSTACK ARXITEKTURA PITCHI — PLATFORM STANDARD v16
// G'oya: texnik qarorlarni stakeholderga TUSHUNTIRISH. Pitch = texnikni biznes tiliga TARJIMA qilish.
//        Arxitektura diagrammasi = vizual yordamchi. Muammo → Yechim → Natija.
// Mahsulot: AvtoStoyanka (React → Express → PostgreSQL) — to'liq qurilgan, endi egasiga pitch.
// Metafora: Pitch = tarjima. Stakeholder jargonni emas, biznes foydasini eshitadi.
// Signature 1: Arxitektura diagrammasini yig'ish + so'rov oqimi animatsiyasi.
// Signature 2: Pitch yig'ish (Muammo → Yechim → Natija, biznes tilida).
// FINALE: Modul 4 PM yo'li yakuni (4/4). AUDIOSIZ.
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
  mic: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" /></svg>),
  screen: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>),
  server: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="4" y="4" width="16" height="7" rx="2" /><rect x="4" y="13" width="16" height="7" rx="2" /><path d="M8 7.5h.01M8 16.5h.01" /></svg>),
  db: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>),
  star: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8-4.3-4.1 5.9-.9L12 3z" /></svg>),
  car: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 13l2.2-5.2a2 2 0 0 1 1.8-1.2h10a2 2 0 0 1 1.8 1.2L21 13v4H3v-4z" /><path d="M3 13h18" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /></svg>)
};

const LESSON_META = { lessonId: 'pm-architecture-pitch-14-v16', lessonTitle: { uz: 'Fullstack arxitektura pitchi', ru: 'Питч fullstack-архитектуры' } };
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
// AvtoStoyanka arxitekturasi — qatlamlar (s3, s6)
const ARCH = [
  { id: 'user', label: 'Foydalanuvchi', sub: 'Qorovul — panelni ishlatadi', emoji: '👮', ico: Ico.user(20), color: T.honey, biz: 'Kim ishlatadi: stoyanka qorovuli.' },
  { id: 'front', label: 'Frontend — Panel', sub: 'React — ko\'rinadigan ekran', emoji: '🖥️', ico: Ico.screen(20), color: T.accent, biz: 'Qorovul ko\'radigan tugmalar va joylar to\'ri.' },
  { id: 'back', label: 'Backend — Server', sub: 'Express — qoidalar, hisob', emoji: '⚙️', ico: Ico.server(20), color: T.blue, biz: 'Qoidalar va hisob-kitob: tolov, tekshiruv.' },
  { id: 'db', label: 'Ombor — Baza', sub: 'PostgreSQL — doimiy saqlash', emoji: '🗄️', ico: Ico.db(20), color: T.success, biz: 'Ma\'lumot yo\'qolmaydi — F5 ham, o\'chsa ham qoladi.' }
];
const POOL_ORDER = ['back', 'user', 'db', 'front']; // aralash — to'g'ri tartib: user→front→back→db

// Texnik → biznes tarjima (s5, s8)
const TRANSLATE = [
  { id: 'pg', tech: 'PostgreSQL ma\'lumotlar bazasi', biz: 'Ma\'lumot hech qachon yo\'qolmaydi — kompyuter o\'chsa ham qoladi' },
  { id: 'api', tech: 'REST API', biz: 'Qorovul telefoni va ofis kompyuteri bir xil ma\'lumotni ko\'radi' },
  { id: 'auth', tech: 'JWT + .env autentifikatsiya', biz: 'Faqat ruxsat berilgan odam kira oladi — begona kira olmaydi' },
  { id: 'join', tech: 'FK + JOIN bog\'lanish', biz: 'Qaysi mashina qaysi joyda — bir qarashda ko\'rinadi' }
];

// Pitch qismlari (s10)
const PITCH = {
  muammo: { label: 'Muammo', a: 'REST API yo\'q edi, ma\'lumot frontda turardi', b: 'Qorovul qo\'lda daftarga yozardi — xato va yo\'qolish' },
  yechim: { label: 'Yechim', a: 'Express + PostgreSQL + JWT o\'rnatdik', b: 'Panel qildik: bir tugma bilan kirish-chiqish, hammasi bazada' },
  natija: { label: 'Natija', a: 'Server 200 OK status qaytaradi', b: 'Hech narsa yo\'qolmaydi, tushum aniq, vaqt tejaladi' }
};
const PKEYS = ['muammo', 'yechim', 'natija'];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'JARGON', color: T.accent, text: 'Dasturchi "NestJS controller, JWT middleware" bilan pitch qildi', why: 'Egasi hech narsa tushunmadi — loyihaga ishonmadi.' },
  { tag: 'TARJIMA', color: T.blue, text: 'PM arxitektura diagrammasini biznes tilida ko\'rsatdi', why: '"Ma\'lumot yo\'qolmaydi, faqat siz kirasiz" — egasi tushundi.' },
  { tag: 'ISHONCH', color: T.honey, text: 'Egasi "ha, aynan shu kerak!" dedi', why: 'Vizual diagramma + biznes tili = ishonch.' },
  { tag: 'NATIJA', color: T.success, text: 'Loyiha qabul qilindi va kengaytirildi', why: 'Yaxshi pitch texnik ishni biznes foydasiga bog\'laydi.' }
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

// ===== ARXITEKTURA NODE (diagramma) =====
const ArchNode = ({ a, lit, active }) => (
  <div className={`arch-node ${lit ? 'arch-lit' : ''} ${active ? 'arch-active' : ''}`} style={lit ? { boxShadow: `0 8px 22px -8px ${a.color}88, inset 0 0 0 1.5px ${a.color}` } : undefined}>
    <span className="arch-ico" style={{ color: a.color }}>{a.ico}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p className="arch-lbl">{a.label}</p>
      <p className="arch-sub">{a.sub}</p>
    </div>
    {active && <span className="arch-packet">🚗</span>}
  </div>
);

// ===== SCREEN 0 — HOOK (jargon vs biznes pitch) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('dev');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Dasturchi yomon ishlagan' },
    { id: 'b', label: 'Stakeholder texnik tilni tushunmaydi — biznes tiliga tarjima kerak' },
    { id: 'c', label: 'Arxitektura yomon qurilgan' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'dev'
    ? { who: 'Dasturchi', emoji: '🤓', say: 'Biz Express serverda PostgreSQL, JWT middleware va REST API endpoint\'larini uladik, connection pool\'ni optimallashtirdik...', ok: false }
    : { who: 'PM', emoji: '🧑‍💼', say: 'Endi ma\'lumot yo\'qolmaydi, faqat siz kira olasiz, telefon va ofis kompyuteri bir xil ko\'radi.', ok: true };
  return (
    <Stage eyebrow="Kirish · Finale" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Stoyanka egasiga pitch qildingiz — u <span className="italic" style={{ color: T.accent }}>tushunmadi</span>. Nega?</h1>
        <Mentor>AvtoStoyanka tayyor. Endi uni egasiga tushuntirish kerak. Ikki xil tushuntirishni bosing.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'dev' ? 'chip-on' : ''}`} onClick={() => setV('dev')}>Dasturchi 🤓</button>
              <button className={`chip ${v === 'pm' ? 'chip-on' : ''}`} onClick={() => setV('pm')}>PM 🧑‍💼</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.success : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span><span style={{ marginLeft: 'auto', fontFamily: "'Manrope'", fontWeight: 800, fontSize: 11, color: cur.ok ? T.success : T.accent }}>{cur.ok ? 'tushundi 😊' : 'qotib qoldi 😵'}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega birinchi tushuntirish ishlamadi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Pitch — bu <b>tarjima</b>. Stakeholder (qaror qabul qiluvchi — mijoz, rahbar) jargonni emas, <b>biznes foydasini</b> eshitadi. Arxitektura diagrammasi esa vizual yordamchi. Bugun — Modul 4 ning <b>finale</b> darsi: pitchni o'rganamiz.</p>}
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
    { text: 'Pitch = texnikni biznes tiliga tarjima', tag: '' },
    { text: 'AvtoStoyanka arxitekturasi: Foydalanuvchi → Front → Back → Ombor', tag: '' },
    { text: 'Diagrammani yig\'ib, so\'rov oqimini ko\'ramiz', tag: 'jonli' },
    { text: 'Texnik → biznes tarjimon (har qaror = foyda)', tag: '' },
    { text: 'Pitchni repetitsiya: Muammo → Yechim → Natija', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.accent} soft={T.accentSoft}>{Ico.mic(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Texnikni biznesga tarjima qil</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Diagramma ko'rsatadi, biznes tili ishontiradi.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Modul 4 PM yo'lining FINALE darsi</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Arxitekturani stakeholderga qanday pitch qilamiz?</span></h2></div>
        <Mentor>Bu — Modul 4 PM yo'lining <b style={{ color: T.ink }}>yakuni</b>. AvtoStoyanka qurildi; endi uni egasiga ishonarli qilib tushuntirishni o'rganamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — PITCH = TARJIMA (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('tech');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['tech', 'biz']) : new Set(['tech']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Metafora" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir xil fakt — ikki xil <span className="italic" style={{ color: T.accent }}>til</span></h2></div>
        <Mentor>Stakeholder boshqa tilda gapiradi — biznes tilida. Bir xil narsani ikki tilda eshiting.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'tech' ? 'chip-on' : ''}`} onClick={() => set('tech')}>🔧 Texnik til</button>
              <button className={`chip ${v === 'biz' ? 'chip-on' : ''}`} onClick={() => set('biz')}>💼 Biznes til</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'biz' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'tech' ? '🤖' : '🤝'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'tech'
                ? '"PostgreSQL bazasida ACID tranzaksiyalar bilan ma\'lumot persist qilinadi." — stakeholder uchun bo\'sh so\'zlar.'
                : '"Ma\'lumot hech qachon yo\'qolmaydi — kompyuter o\'chsa ham qoladi." — bir zumda tushunadi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'tech'
              ? <div className="frame-warn fade-step" key="t"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri, lekin stakeholder uchun ma'nosiz. U "xo'sh, menga nima?" deydi.</p></div>
              : <div className="frame-success fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Aynan u tushunadigan til: foyda, ishonch, pul, vaqt.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Pitch = bir xil haqiqatni <b>tinglovchining tilida</b> aytish.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — AVTOSTOYANKA ARXITEKTURASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(ARCH.map(a => a.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= ARCH.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? ARCH.find(a => a.id === active) : null;
  return (
    <Stage eyebrow="Arxitektura" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${ARCH.length} qatlamni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoStoyanka — <span className="italic" style={{ color: T.accent }}>4 qatlam</span></h2></div>
        <Mentor>To'liq tizim 4 qatlamdan iborat. Har birini bosing — biznes tilida nima qilishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ARCH.map(a => (<button key={a.id} onClick={() => tap(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === a.id ? `inset 0 0 0 2px ${a.color}, 0 8px 20px -8px ${a.color}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ color: a.color, display: 'inline-flex' }}>{a.ico}</span><div style={{ flex: 1 }}><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{a.label}</span><p className="small" style={{ color: T.ink2, margin: '1px 0 0' }}>{a.sub}</p></div>{seen.has(a.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 22 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.biz}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatlamni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 qatlam birga ishlaydi. Pitchda ularni biznes tilida bog'laysiz.</p></div>}
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
    questionText="Nega texnik qarorlarni stakeholderga biznes tilida tushuntiramiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega arxitekturani <span className="italic" style={{ color: T.accent }}>biznes tilida</span> tushuntiramiz?</h2></>}
    options={['Texnik til chiroyliroq', 'Stakeholder jargonni emas, foyda va natijani tushunadi — shunda ishonadi', 'Dasturchi tilini yashirish uchun', 'Aslida kerak emas']} correctIdx={1}
    explainCorrect="To'g'ri! Stakeholder texnik atamani emas, biznes foydasini (pul, vaqt, ishonch) tushunadi. Tarjima qilsangiz — u qaror qabul qila oladi."
    explainWrong={{ 0: 'Gap chiroylilikda emas — tushunarlilikda.', 2: 'Yashirish emas — tarjima. Stakeholder tilida gapirish.', 3: 'Aksincha — bu pitchning eng muhim qismi.', default: 'Biznes tili = stakeholder tushunadi va ishonadi.' }} />
);

// ===== SCREEN 5 — TEXNIK → BIZNES =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(TRANSLATE.map(t => t.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= TRANSLATE.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? TRANSLATE.find(t => t.id === active) : null;
  return (
    <Stage eyebrow="Tarjimon" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${TRANSLATE.length} tarjima qiling`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har texnik qaror — bitta <span className="italic" style={{ color: T.accent }}>biznes foydasi</span></h2></div>
        <Mentor>Texnik atamani bosing — uning biznes tarjimasini ko'ring. Pitchda aynan o'ng tomonini aytasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TRANSLATE.map(t => (<button key={t.id} onClick={() => tap(t.id)} className={`fieldrow ${active === t.id ? 'fr-on' : ''}`}><span className="mono fr-k" style={{ fontSize: 12.5 }}>{t.tech}</span>{seen.has(t.id) ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.arrow(15)}</span> : <span style={{ color: T.ink3 }}>→</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="mono" style={{ fontSize: 11, color: T.ink3 }}>{cur.tech}</span><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.arrow(15)}</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 0', fontWeight: 600 }}>💼 {cur.biz}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir atamani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har "qiyin so'z" ortida oddiy foyda bor — shuni ayting.</p></div>}
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
    questionText="'PostgreSQL bazada saqlanadi' ni stakeholder uchun qanday aytasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"PostgreSQL" ni <span className="italic" style={{ color: T.accent }}>stakeholder</span> uchun qanday aytasiz?</h2></>}
    options={['"PostgreSQL relyatsion bazasi ACID bilan"', '"Ma\'lumot hech qachon yo\'qolmaydi — kompyuter o\'chsa ham qoladi"', '"SQL so\'rovlar tez ishlaydi"', '"Baza 5432-portda turadi"']} correctIdx={1}
    explainCorrect="To'g'ri! Bu — biznes tarjimasi. Stakeholder 'yo'qolmaydi' degan foydani tushunadi va qadrlaydi."
    explainWrong={{ 0: 'Jargon — stakeholder hech narsa tushunmaydi.', 2: 'Tezlik texnik — foyda emas. "Yo\'qolmaydi" muhimroq.', 3: 'Port raqami — mutlaqo biznesga aloqasi yo\'q.', default: 'Biznes tilida: "ma\'lumot yo\'qolmaydi".' }} />
);

// ===== SCREEN 6 — ARXITEKTURA DIAGRAMMASI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(storedAnswer ? ARCH.map(a => a.id) : []);
  const [wrong, setWrong] = useState(null);
  const [flowStep, setFlowStep] = useState(storedAnswer ? ARCH.length : -1);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const runningRef = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const assembled = placed.length >= ARCH.length;
  const flowed = flowStep >= ARCH.length;
  const done = assembled && flowed;
  const nextNeeded = ARCH[placed.length];
  const tapPool = (id) => {
    if (assembled) return;
    if (nextNeeded && id === nextNeeded.id) { setPlaced(prev => [...prev, id]); setWrong(null); }
    else { setWrong(id); }
  };
  const runFlow = () => {
    if (runningRef.current || !assembled) return;
    runningRef.current = true; setRunning(true); setFlowStep(0);
    const tick = (i) => { setFlowStep(i); if (i < ARCH.length) { timer.current = setTimeout(() => tick(i + 1), 620); } else { setRunning(false); runningRef.current = false; } };
    timer.current = setTimeout(() => tick(1), 320);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const remaining = POOL_ORDER.filter(id => !placed.includes(id));
  return (
    <Stage eyebrow="Diagramma · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (assembled ? 'So\'rov oqimini yuboring' : 'Qatlamlarni tartibga soling')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Arxitektura diagrammasini <span className="italic" style={{ color: T.accent }}>yig'ing</span></h2></div>
        <Mentor>So'rov yo'li: <b style={{ color: T.ink }}>Foydalanuvchi → Frontend → Backend → Ombor</b>. Qatlamlarni shu tartibda bosing, keyin so'rov oqimini yuboring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Diagramma</p>
            <div className="arch-flow">
              {placed.map((id, i) => { const a = ARCH.find(x => x.id === id); return (
                <React.Fragment key={id}>
                  <ArchNode a={a} lit={flowStep > i || (flowed)} active={running && flowStep === i + 1} />
                  {i < ARCH.length - 1 && <span className={`arch-conn ${flowStep > i + 1 ? 'conn-lit' : ''}`} />}
                </React.Fragment>
              ); })}
              {!assembled && <div className="arch-slot">{nextNeeded ? `${placed.length + 1}-qatlam: pastdagi to'g'ri kartani bosing` : ''}</div>}
            </div>
            {assembled && flowStep < ARCH.length && <button className="btn" onClick={runFlow} disabled={running} style={{ alignSelf: 'flex-start', marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ display: 'inline-flex' }}>{Ico.car(17)}</span>{running ? 'Oqim ketyapti…' : 'So\'rov oqimini yuborish'}</button>}
          </Col>
          <Col>
            {!assembled ? (
              <><p className="flow-label">Qatlamlar (aralash)</p>
                <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {remaining.map(id => { const a = ARCH.find(x => x.id === id); const isWrong = wrong === id; return (<button key={id} onClick={() => tapPool(id)} className={`pool-item ${isWrong ? 'shake-x' : ''}`} style={{ borderLeft: `3px solid ${a.color}` }}><span style={{ color: a.color, display: 'inline-flex' }}>{a.ico}</span><span style={{ flex: 1, textAlign: 'left' }}><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink }}>{a.label}</span></span></button>); })}
                </div>
                {wrong && <p className="small" style={{ color: T.accent, margin: 0 }}>Tartib noto'g'ri — so'rov Foydalanuvchidan boshlanadi.</p>}
              </>
            ) : (
              flowed
                ? <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>🎯</div><p className="ta-h">So'rov to'liq oqdi!</p><p className="ta-sub">Mashina kirdi → panel → server → bazaga yozildi. Mana shu diagrammani egasiga ko'rsatasiz</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Diagramma tayyor! Endi <b>"So'rov oqimini yuborish"</b>ni bosing — ma'lumot qatlamlardan qanday o'tishini ko'ring.</p></div>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — OQIMNI KUZATISH (biznes tilida) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const JOURNEY = [
    { emoji: '🚗', t: 'Mashina kiradi, qorovul panelda tugmani bosadi (Frontend)' },
    { emoji: '⚙️', t: 'Server tekshiradi: joy bo\'shmi, kim kirdi — qoidalarni qo\'llaydi (Backend)' },
    { emoji: '🗄️', t: 'Sessiya bazaga yoziladi — endi doimiy saqlandi (Ombor)' },
    { emoji: '✅', t: 'Panel yangilanadi: joy 🟥 band bo\'ldi, hammaga ko\'rinadi' }
  ];
  const [step, setStep] = useState(storedAnswer ? JOURNEY.length - 1 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= JOURNEY.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { setStep(n => Math.min(n + 1, JOURNEY.length - 1)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="So'rov sayohati" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Sayohatni kuzating (${step + 1}/${JOURNEY.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta so'rov — <span className="italic" style={{ color: T.accent }}>biznes tilida</span> hikoya</h2></div>
        <Mentor>So'rovning yo'lini biznes tilida aytsangiz, stakeholder butun tizimni tushunadi. Bosib, qadamlarni oching.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640, width: '100%', margin: '0 auto' }}>
          {JOURNEY.map((j, i) => { const on = step >= i; return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.paper, borderRadius: 12, padding: '12px 15px', opacity: on ? 1 : 0.3, transition: 'opacity 0.4s', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `3px solid ${on ? T.accent : T.ink3}` }}>
              <span style={{ fontSize: 24 }}>{j.emoji}</span>
              <span style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.7vw,15px)', color: T.ink }}>{j.t}</span>
            </div>
          ); })}
        </div>
        {!done && <button className="btn" onClick={advance} style={{ alignSelf: 'center' }}>{step === 0 ? '▶ Sayohatni boshlash' : 'Keyingi qadam →'}</button>}
        {done && <div className="frame-success fade-step" style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Hech qanday jargon — faqat tushunarli hikoya. Mana shu pitchning qalbi.</p></div>}
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEXNIK ↔ BIZNES MOSLASH =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const BIZ = [
    { id: 'join', text: 'Qaysi mashina qaysi joyda — bir qarashda' },
    { id: 'pg', text: 'Ma\'lumot yo\'qolmaydi — o\'chsa ham qoladi' },
    { id: 'auth', text: 'Faqat ruxsatli odam kira oladi' },
    { id: 'api', text: 'Telefon va kompyuter bir xil ko\'radi' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(TRANSLATE.map(t => [t.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= TRANSLATE.length;
  const pickF = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickC = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(12px,1.5vw,13.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Moslash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${TRANSLATE.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har <span className="italic" style={{ color: T.accent }}>texnik</span> qarorni biznes foydasi bilan ulang</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>texnik</b> atamani, keyin uning <b style={{ color: T.ink }}>biznes tarjimasini</b> bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Texnik qaror</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {TRANSLATE.map(t => { const m = matched[t.id]; const on = sel === t.id; return (<button key={t.id} onClick={() => pickF(t.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.blue, display: 'inline-flex' }}>{m ? Ico.check(16) : Ico.server(15)}</span><span className="mono" style={{ flex: 1, fontWeight: 700, fontSize: 'clamp(11px,1.4vw,12.5px)' }}>{t.tech}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Biznes foydasi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {BIZ.map(c => { const m = matched[c.id]; const isWrong = wrong === c.id; return (<button key={c.id} onClick={() => pickC(c.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(16) : '💼'}</span><span style={{ flex: 1 }}>{c.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa qaror uchun. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Endi har texnik qarorni biznes tilida ayta olasiz.</p></div>}
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
    questionText="Pitchda stakeholder eng ko'p nimaga qiziqadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Stakeholder eng ko'p <span className="italic" style={{ color: T.accent }}>nimaga</span> qiziqadi?</h2></>}
    options={['Qaysi framework ishlatilgan', 'Biznes foydasi: pul, vaqt, ishonch, yo\'qolmaslik', 'Necha qator kod yozilgan', 'Server qaysi portda']} correctIdx={1}
    explainCorrect="To'g'ri! Stakeholder natijaga qiziqadi — bu unga qancha foyda keltiradi. Texnik tafsilot uni qiziqtirmaydi."
    explainWrong={{ 0: 'Framework — texnik tafsilot. Stakeholderga befarq.', 2: 'Kod miqdori — ahamiyatsiz. Natija muhim.', 3: 'Port — mutlaqo qiziqtirmaydi. Foyda muhim.', default: 'Stakeholder biznes foydasiga qiziqadi.' }} />
);

// ===== SCREEN 10 — PITCH YIG'ISH (SIGNATURE 2) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pick, setPick] = useState(storedAnswer?.pick || (storedAnswer ? Object.fromEntries(PKEYS.map(k => [k, 'b'])) : {}));
  const workRef = useRef(null);
  const allGood = PKEYS.every(k => pick[k] === 'b');
  const allPicked = PKEYS.every(k => pick[k]);
  const set = (k, v) => { if (allGood) return; setPick(prev => ({ ...prev, [k]: v })); };
  useEffect(() => {
    if (allGood && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, pick });
    if (allGood && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  return (
    <Stage eyebrow="Pitch yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allGood} label={allGood ? 'Davom etish' : (allPicked ? 'Biznes variantni tanlang' : 'Har qismni tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitchni <span className="italic" style={{ color: T.accent }}>yig'ing</span>: Muammo → Yechim → Natija</h2></div>
        <Mentor>Yaxshi pitch 3 qismdan iborat. Har qism uchun <b style={{ color: T.ink }}>biznes tilidagi</b> (jargonsiz) variantni tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {PKEYS.map(k => (<div key={k}><p className="flow-label" style={{ margin: '0 0 6px' }}>{PITCH[k].label}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['a', 'b'].map(v => { const on = pick[k] === v; return (<button key={v} onClick={() => set(k, v)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 13px', fontFamily: G, fontSize: 13, color: on ? '#fff' : T.ink, background: on ? (v === 'b' ? T.success : T.accent) : T.paper, boxShadow: on ? `0 6px 14px -6px ${v === 'b' ? T.success : T.accent}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}>{PITCH[k][v]}</button>); })}</div></div>))}
          </Col>
          <Col>
            <p className="flow-label">Sizning pitchingiz</p>
            <div className="pitch-card">
              <div className="pitch-head"><span style={{ display: 'inline-flex' }}>{Ico.mic(16)}</span><span>AvtoStoyanka — egasiga</span></div>
              {PKEYS.map(k => { const v = pick[k]; const ok = v === 'b'; return (<div key={k} className={`pitch-line ${!v ? 'pl-empty' : ok ? 'pl-ok' : 'pl-bad'}`}><span className="pitch-tag">{PITCH[k].label}</span><span className="pitch-txt">{v ? PITCH[k][v] : '…'}</span></div>); })}
            </div>
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — kuchli pitch! Muammo aniq, yechim tushunarli, natija foydali. Egasi "ha!" deydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — YOMON vs YAXSHI PITCH =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('bad');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['bad', 'good']) : new Set(['bad']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yomon vs yaxshi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir loyiha — ikki <span className="italic" style={{ color: T.accent }}>pitch</span></h2></div>
        <Mentor>Bir xil AvtoStoyanka, ikki xil pitch. Stakeholder reaksiyasini solishtiring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'bad' ? 'chip-on' : ''}`} onClick={() => set('bad')}>😵 Jargon pitch</button>
              <button className={`chip ${v === 'good' ? 'chip-on' : ''}`} onClick={() => set('good')}>🎯 Biznes pitch</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'good' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'good' ? '🎤' : '📉'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'bad'
                ? '"NestJS monorepoda TypeORM entity\'lar, JWT guard, PostgreSQL connection pool..." — egasi telefoniga qaray boshladi.'
                : '"Qorovul bir tugma bilan ishlaydi, ma\'lumot yo\'qolmaydi, tushum aniq ko\'rinadi." — egasi bosh irg\'adi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'bad'
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Jargon = masofa. Stakeholder zerikadi, ishonmaydi.</p></div>
              : <div className="frame-success fade-step" key="g"><p className="body" style={{ margin: 0, color: T.ink }}>Biznes tili + diagramma = ishonch. "Ha, aynan shu kerak."</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Texnik ish bir xil — farq faqat <b>qanday tushuntirishda</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Kuchli arxitektura pitchida eng muhim 2 narsa qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kuchli pitchda eng <span className="italic" style={{ color: T.accent }}>muhim</span> 2 narsa?</h2></>}
    options={['Ko\'p texnik atama va uzun kod', 'Vizual diagramma + biznes tili (foyda)', 'Tezroq gapirish', 'Faqat narx']} correctIdx={1}
    explainCorrect="To'g'ri! Diagramma ko'zga ko'rsatadi, biznes tili foydani tushuntiradi. Ikkisi birga — ishonch tug'diradi."
    explainWrong={{ 0: 'Texnik atama aksincha to\'sqinlik qiladi.', 2: 'Tezlik emas — aniqlik va tushunarlilik.', 3: 'Narx muhim, lekin yolg\'iz emas — foyda va ishonch ham kerak.', default: 'Vizual diagramma + biznes tili.' }} />
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>jargon rad etildi</span>, tarjima qabul</h2></div>
        <Mentor>AvtoStoyanka pitchining haqiqiy yo'li — 4 qadam. Har qatorni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.mic(16)}</span><span className="cl-title">AvtoStoyanka — pitch hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Jargon → tarjima → ishonch → qabul. Endi o'z pitchingizni yozasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Arxitekturani <span className="italic" style={{ color: T.accent }}>pitch</span> qil</h2></div>
      <Mentor>Kuchli pitch 3 narsa bilan ishlaydi: vizual diagramma, biznes tili va Muammo→Yechim→Natija tuzilishi.</Mentor>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎤</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Pitch = tarjima</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Texnik ish — biznes foydasiga.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Kuchli pitch — 3 narsa</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.layers(18), c: T.accent, t: 'VIZUAL diagramma (ko\'rsatadi)' }, { ic: Ico.mic(18), c: T.blue, t: 'BIZNES tili (foyda, ishonch)' }, { ic: Ico.flag(18), c: T.success, t: 'MUAMMO → YECHIM → NATIJA' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: pitch jumlalari =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Muammo: foydalanuvchi nimadan qiynalardi…', 'Yechim: tizim biznes tilida nima qiladi…', 'Natija: qanday foyda (pul/vaqt/ishonch)…'];
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
  const LBL = ['Muammo', 'Yechim', 'Natija'];
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangizni stakeholderga <span className="italic" style={{ color: T.accent }}>pitch qiling</span></h2></div>
        <Mentor>Biznes tilida (jargonsiz) yozing: <b style={{ color: T.ink }}>Muammo → Yechim → Natija</b>. Kamida 2 ta. O'ngda pitchingiz yig'iladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>{LBL[i]}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning pitchingiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — pitchingiz shu yerda yig'iladi…</p></div>
              : <div className="pitch-card feat-pop"><div className="pitch-head"><span style={{ display: 'inline-flex' }}>{Ico.mic(16)}</span><span>Mening pitchim</span></div>{completeLines.map((f, j) => (<div key={j} className="pitch-line pl-ok"><span className="pitch-txt">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi istalgan loyihani stakeholderga ishonarli pitch qila olasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN (FINALE) =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Pitch = texnikni biznes tiliga tarjima', 'Arxitektura diagrammasi = vizual yordamchi', 'Har texnik qaror ortida biznes foydasi bor', 'Muammo → Yechim → Natija — kuchli tuzilma'];
  const JOURNEY = [{ t: 'PM11 — Metrikalar', d: 'qaysi raqam muhim' }, { t: 'PM12 — Xavfsizlik', d: 'ishonch = qiymat' }, { t: 'PM13 — Sxema = PRD', d: 'ma\'lumot hujjati' }, { t: 'PM14 — Arxitektura pitchi', d: 'stakeholderga tarjima' }];
  const GLOSSARY = [{ b: 'Pitch', t: '— g\'oyani qisqa va ishonarli tushuntirish' }, { b: 'Stakeholder', t: '— qaror qabul qiluvchi (mijoz, egasi, rahbar)' }, { b: 'Arxitektura', t: '— tizim qatlamlari: front, back, baza' }, { b: 'Tarjima', t: '— texnik tilni biznes tiliga o\'girish' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Finale · tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up" style={{ color: T.grape, background: T.grapeSoft }}><span className="tick" style={{ color: T.grape }}>{Ico.star(12)}</span> Modul 4 PM yo'li tugadi · 4/4</span><h2 className="title h-title fade-up d1">Endi siz arxitekturani <span className="italic" style={{ color: T.accent }}>pitch</span> qila olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Metrikalar, xavfsizlik, sxema va pitch — backend PM yo\'lini to\'liq o\'tdingiz. AvtoIjara\'dan AvtoStoyanka\'gacha!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.grape }}><span style={{ color: T.grape, display: 'inline-flex' }}>{Ico.star(15)}</span> Modul 4 PM yo'li</div><ul className="recap">{JOURNEY.map((j, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ color: T.grape, display: 'inline-flex' }}>{Ico.check(15)}</span><span><b>{j.t}</b> <span style={{ color: T.ink2 }}>— {j.d}</span></span></li>))}</ul></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🏗️</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi modul: Nest arxitektura</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Endi backendni professional, qatlamli arxitekturada quramiz — NestJS bilan.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson14({ lang: langProp, onFinished }) {
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

        /* === ARXITEKTURA DIAGRAMMA (signature 1) === */
        .arch-flow { display: flex; flex-direction: column; align-items: center; gap: 0; width: 100%; }
        .arch-node { display: flex; align-items: center; gap: 11px; width: 100%; max-width: 340px; background: ${T.paper}; border-radius: 12px; padding: 11px 14px; box-shadow: 0 6px 16px -9px rgba(${T.shadowBase},0.2); transition: box-shadow 0.3s, transform 0.2s; animation: feat-pop 0.36s cubic-bezier(.2,.7,.2,1); }
        .arch-active { transform: scale(1.03); }
        .arch-ico { display: inline-flex; flex-shrink: 0; }
        .arch-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; margin: 0; }
        .arch-sub { font-family: 'Manrope'; font-weight: 500; font-size: 11px; color: ${T.ink2}; margin: 1px 0 0; }
        .arch-packet { font-size: 18px; flex-shrink: 0; animation: feat-pop 0.3s; }
        .arch-conn { width: 2px; height: 16px; background: ${T.ink3}66; transition: background 0.3s; }
        .arch-conn.conn-lit { background: ${T.success}; }
        .arch-slot { width: 100%; max-width: 340px; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 13px; text-align: center; font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink3}; margin-top: 8px; }
        .pool-item { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 11px; padding: 12px 14px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.18); }
        .pool-item:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -8px rgba(${T.shadowBase},0.26); }

        /* === FIELD ROW (s5) === */
        .fieldrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left; border: none; border-radius: 10px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .fieldrow:hover { transform: translateX(2px); }
        .fieldrow.fr-on { box-shadow: inset 0 0 0 1.5px ${T.blue}, 0 6px 16px -8px rgba(1,154,203,0.25); background: ${T.blueSoft}; }
        .fr-k { font-weight: 700; color: ${T.ink}; }

        /* === PITCH CARD (signature 2) === */
        .pitch-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 8px; }
        .pitch-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid ${T.ink3}33; font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.accent}; }
        .pitch-line { display: flex; flex-direction: column; gap: 3px; padding: 9px 11px; border-radius: 9px; background: ${T.bg}; border-left: 3px solid ${T.ink3}; }
        .pitch-line.pl-ok { background: ${T.successSoft}; border-left-color: ${T.success}; }
        .pitch-line.pl-bad { background: ${T.accentSoft}; border-left-color: ${T.accent}; }
        .pitch-tag { font-family: 'Manrope'; font-weight: 800; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: ${T.ink2}; }
        .pitch-txt { font-family: 'Georgia, serif'; font-size: 13px; color: ${T.ink}; line-height: 1.4; }

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
