import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 13-DARS (Modul 4 · PM3) — MA'LUMOT SXEMASI = PRD HUJJATI — PLATFORM STANDARD v16
// G'oya: DB sxemasi faqat texnik emas — MAHSULOT HUJJATI (PRD artefakti). Nimani va NEGA saqlaymiz.
//        Jamoa uni o'qiydi; yangi maydon = yangi fycha = roadmap qadami. Har maydon — mahsulot izohi.
// Mahsulot: AvtoStoyanka (joylar ◄ joy_id sessiyalar, FK + JOIN) — keyingi dars (Loyiha kuni) shu sxemani quradi.
// Signature 1: FK/JOIN vizualizator (joyni bos → bog'langan sessiyani ko'r).
// Signature 2: Roadmap — yangi fycha qaysi sxema o'zgarishini talab qiladi (moslash).
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
  user: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.2-5.8 7-5.8s7 2.2 7 5.8" /></svg>),
  db: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></svg>),
  link: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 12h6" /><path d="M10 8H8a4 4 0 0 0 0 8h2M14 8h2a4 4 0 0 1 0 8h-2" /></svg>),
  table: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M4 15h16M10 4v16" /></svg>),
  doc: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>),
  map: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>),
  car: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 13l2.2-5.2a2 2 0 0 1 1.8-1.2h10a2 2 0 0 1 1.8 1.2L21 13v4H3v-4z" /><path d="M3 13h18" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /></svg>)
};

const LESSON_META = { lessonId: 'pm-schema-prd-13-v16', lessonTitle: { uz: 'Ma\'lumot sxemasi — PRD hujjati', ru: 'Схема данных как PRD-артефакт' } };
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
// AvtoStoyanka sxemasi: 2 jadval (s3, s5)
const TABLES = [
  {
    id: 'joylar', name: 'joylar', emoji: '🅿️', desc: 'Stoyanka joylari — bo\'sh yoki band',
    fields: [
      { k: 'id', t: 'SERIAL', why: 'Har joyning yagona raqami — kalit (primary key).' },
      { k: 'raqam', t: 'INTEGER', why: 'Qorovul qaysi joy ekanini ko\'rishi uchun (1, 2, 3...).' },
      { k: 'holat', t: 'TEXT', why: 'Panelda 🟩 bo\'sh / 🟥 band ko\'rsatish uchun.' }
    ]
  },
  {
    id: 'sessiyalar', name: 'sessiyalar', emoji: '🚗', desc: 'Har kirib-chiqish — kim, qachon, qancha',
    fields: [
      { k: 'id', t: 'SERIAL', why: 'Har sessiyaning yagona raqami.' },
      { k: 'joy_id', t: 'INTEGER (FK)', why: 'Mashina QAYSI joyda — joylar bilan bog\'laydi (JOIN).' },
      { k: 'mashina', t: 'TEXT', why: 'Davlat raqami — kim turganini bilish.' },
      { k: 'kirish_vaqti', t: 'TIMESTAMP', why: 'Tolovni hisoblash + peak (gavjum) soat metrikasi.' },
      { k: 'chiqish_vaqti', t: 'TIMESTAMP', why: 'Sessiya tugadimi, joy bo\'shadimi.' },
      { k: 'tolov', t: 'INTEGER', why: 'Kunlik tushum hisoboti uchun.' }
    ]
  }
];

// Maydonlarning mahsulot izohi (s5 — eng muhimlari)
const COMMENTS = [
  { k: 'holat', tbl: 'joylar', why: 'Panelda 🟩/🟥 ko\'rsatish — qorovul bir qarashda biladi.' },
  { k: 'joy_id', tbl: 'sessiyalar', why: 'FK — mashinani joyga bog\'laydi. Busiz "kim qayerda?" bilolmaysiz.' },
  { k: 'kirish_vaqti', tbl: 'sessiyalar', why: 'Tolov = (chiqish − kirish). Yana peak soat metrikasi.' },
  { k: 'tolov', tbl: 'sessiyalar', why: 'Kunlik/oylik tushum hisoboti — biznes raqami.' }
];

// FK/JOIN vizualizator joylari (s6)
const SPOTS = [
  { id: 1, raqam: 1, band: false },
  { id: 2, raqam: 2, band: true, mashina: '01A123BC', kirish: '14:00' },
  { id: 3, raqam: 3, band: false },
  { id: 4, raqam: 5, band: true, mashina: '10B777AA', kirish: '09:30' }
];

// Maydon ↔ qaysi jadval (s8)
const FIELD_TBL = [
  { id: 'raqam', label: 'raqam (joy nomeri)', tbl: 'joylar' },
  { id: 'holat', label: 'holat (bo\'sh/band)', tbl: 'joylar' },
  { id: 'joy_id', label: 'joy_id (FK)', tbl: 'sessiyalar' },
  { id: 'mashina', label: 'mashina (davlat raqami)', tbl: 'sessiyalar' },
  { id: 'kirish_vaqti', label: 'kirish_vaqti', tbl: 'sessiyalar' },
  { id: 'tolov', label: 'tolov', tbl: 'sessiyalar' }
];

// Roadmap — fycha ↔ sxema o'zgarishi (s10)
const ROADMAP = [
  { id: 'disc', feat: 'Doimiy mijozga chegirma', crit: 'sessiyalar\'ga chegirma maydoni qo\'shish' },
  { id: 'vip', feat: 'VIP joylar (qimmatroq)', crit: 'joylar\'ga narx maydoni qo\'shish' },
  { id: 'sms', feat: 'Mijozni eslab qolish / SMS', crit: 'yangi mijozlar jadvali + telefon' }
];

// Sxemani jamoa o'qiydi (s11)
const READERS = [
  { id: 'dev', who: 'Dasturchi', emoji: '👨‍💻', sees: 'Qaysi ustun, qaysi tip, qaysi FK — kodni shunga qarab yozadi.' },
  { id: 'pm', who: 'PM', emoji: '🧑‍💼', sees: 'Nimani saqlaymiz, nega — qaysi fycha mumkin, qaysi yo\'q.' },
  { id: 'new', who: 'Yangi a\'zo', emoji: '🆕', sees: 'Mahsulot nima qilishini sxemadan tez tushunadi — uzun tushuntirishsiz.' }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'CHIZDI', color: T.blue, text: 'PM AvtoStoyanka sxemasini mahsulot izohlari bilan chizdi', why: 'Har maydon nega kerakligi yozildi — jamoa darrov tushundi.' },
  { tag: 'O\'QIDI', color: T.honey, text: 'Jamoa sxemani o\'qib, kim nima qilishini bildi', why: 'Sxema hujjat bo\'lib xizmat qildi — ortiqcha savol kamaydi.' },
  { tag: 'O\'SDI', color: T.grape, text: '"Chegirma" so\'raldi → sxemaga 1 maydon qo\'shildi', why: 'Sxema o\'zgarishi = aniq roadmap qadami.' },
  { tag: 'NATIJA', color: T.success, text: 'Loyiha kuni sxema bo\'yicha tez va aniq qurildi', why: 'Yaxshi PRD = kam bahs, tez qurilish.' }
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

// ===== SIGNATURE: jadval kartochkasi (DB table) =====
const DbTable = ({ tbl, highlightFk, active }) => (
  <div className={`dbtable ${active ? 'dbt-active' : ''}`}>
    <div className="dbt-head"><span style={{ fontSize: 14 }}>{tbl.emoji}</span><span className="mono">{tbl.name}</span></div>
    {tbl.fields.map(f => { const fk = f.t.includes('FK'); return (
      <div key={f.k} className={`dbt-field ${fk && highlightFk ? 'dbt-fk' : ''}`}>
        <span className="mono dbt-k">{f.k}{fk && <span className="dbt-fkbadge">FK</span>}</span>
        <span className="mono dbt-t">{f.t.replace(' (FK)', '')}</span>
      </div>
    ); })}
  </div>
);

// ===== SCREEN 0 — HOOK (dasturchi vs PM ko'radi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('dev');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Faqat texnik narsa — dasturchi ishi' },
    { id: 'b', label: 'Mahsulot hujjati ham — nimani va NEGA saqlaymiz' },
    { id: 'c', label: 'Ahamiyatsiz — asosiysi kod ishlasin' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'dev'
    ? { who: 'Dasturchi', emoji: '👨‍💻', say: 'Men uchun bu — ikki jadval, ustun va FK, xolos. Kodni shunga qarab yozaveraman — nega kerakligi menga qorong\'i.', ok: true }
    : { who: 'PM', emoji: '🧑‍💼', say: 'Bu sxema mahsulotni aytadi: nimani saqlaymiz, nega. Chegirma kerakmi? Mijoz telefonini? — bular sxema qarori.', ok: false };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Bir xil sxema — ikki xil <span className="italic" style={{ color: T.accent }}>nigoh</span>. DB sxemasi nima?</h1>
        <Mentor>AvtoStoyanka sxemasiga dasturchi va PM boshqacha qaraydi. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'dev' ? 'chip-on' : ''}`} onClick={() => setV('dev')}>Dasturchi 👨‍💻</button>
              <button className={`chip ${v === 'pm' ? 'chip-on' : ''}`} onClick={() => setV('pm')}>PM 🧑‍💼</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.blue : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>DB sxemasi aslida nima?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Sxema — bu <b>PRD artefakti</b> (mahsulot hujjati). U mahsulot nimani saqlashini va NEGA saqlashini aytadi. Jamoa uni o'qiydi; yangi maydon = yangi fycha (yangi imkoniyat). Bugun AvtoStoyanka sxemasini PM ko'zi bilan loyihalaymiz.</p>}
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
    { text: 'Sxema = mahsulot hujjati (nima + nega saqlaymiz)', tag: '' },
    { text: 'AvtoStoyanka: 2 jadval — joylar, sessiyalar', tag: '' },
    { text: 'Bog\'lanish: FK joy_id + JOIN (mashina qaysi joyda)', tag: 'jonli' },
    { text: 'Har maydon — mahsulot sababi (product comment)', tag: '' },
    { text: 'Sxema roadmap\'ga ta\'sir qiladi (yangi maydon = yangi fycha)', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.blue} soft={T.blueSoft}>{Ico.doc(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Sxema — mahsulot hujjati</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Jadvallar nimani saqlashini va NEGA saqlashini aytadi.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Keyingi dars (Loyiha kuni) shu sxemani quradi</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>AvtoStoyanka sxemasini PM ko'zi bilan</span></h2></div>
        <Mentor>Sxema texnik chizma ko'rinadi, lekin u <b style={{ color: T.ink }}>mahsulot hujjati</b>. Uni qanday o'qish va loyihalashni ko'ramiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — SXEMA = CHIZMA (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('dev');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['dev', 'pm']) : new Set(['dev']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Metafora" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sxema — bino <span className="italic" style={{ color: T.accent }}>chizmasi</span> kabi</h2></div>
        <Mentor>Me'mor chizmasi binoni ko'rsatadi: qaysi xona, nima uchun. Sxema ham mahsulotni shunday ko'rsatadi. Ikki nigohni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'dev' ? 'chip-on' : ''}`} onClick={() => set('dev')}>🔧 Dasturchi ko'radi</button>
              <button className={`chip ${v === 'pm' ? 'chip-on' : ''}`} onClick={() => set('pm')}>🧭 PM ko'radi</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'pm' ? T.accent : T.blue}` }}>
              <span style={{ fontSize: 26 }}>{v === 'dev' ? '🧱' : '🏛️'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'dev'
                ? 'Ustun, tip, FK, indeks — texnik tafsilotlar. "Bu maydon INTEGER, bu TEXT, bu bog\'lanish."'
                : 'Nimani saqlaymiz va NEGA. "Kirish vaqtini saqlaymiz, chunki to\'lovni hisoblash kerak." Mahsulot mantig\'i.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'dev'
              ? <div className="frame-soft fade-step" key="d"><p className="body" style={{ margin: 0, color: T.ink }}>Dasturchiga texnik aniqlik kerak — bu to'g'ri.</p></div>
              : <div className="frame-success fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>PM'ga mahsulot mantig'i kerak — har maydon qaysi fychaga xizmat qiladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi sxema ikkalasini ham beradi: <b>texnik aniqlik + mahsulot izohi</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — AVTOSTOYANKA 2 JADVAL =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(TABLES.map(t => t.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= TABLES.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? TABLES.find(t => t.id === active) : null;
  return (
    <Stage eyebrow="2 jadval" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 jadvalni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoStoyanka — <span className="italic" style={{ color: T.accent }}>2 jadval</span></h2></div>
        <Mentor>Stoyanka 2 narsani saqlaydi: <b style={{ color: T.ink }}>joylar</b> (qaysi bo'sh/band) va <b style={{ color: T.ink }}>sessiyalar</b> (kim kirdi-chiqdi). Har birini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TABLES.map(t => (<button key={t.id} onClick={() => tap(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '13px 15px', background: T.paper, boxShadow: active === t.id ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -8px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 22 }}>{t.emoji}</span><div style={{ flex: 1 }}><span className="mono" style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{t.name}</span><p className="small" style={{ color: T.ink2, margin: '1px 0 0' }}>{t.desc}</p></div>{seen.has(t.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="fade-step" key={active}><DbTable tbl={cur} /></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir jadvalni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikki jadval — lekin ular bir-biriga <b>bog'lanadi</b>. Buni keyin ko'ramiz.</p></div>}
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
    questionText="Nega DB sxemasi shunchaki texnik emas, balki PM (mahsulot) masalasi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega sxema <span className="italic" style={{ color: T.accent }}>mahsulot</span> masalasi?</h2></>}
    options={['Chunki u chiroyli ko\'rinadi', 'Chunki u nimani saqlashni belgilaydi — demak qaysi fycha mumkinligini belgilaydi', 'Chunki dasturchiga ish beradi', 'Aslida texnik']} correctIdx={1}
    explainCorrect="To'g'ri! Sxema nimani saqlashni belgilaydi. Saqlamasangiz — o'sha fychani qura olmaysiz. Demak sxema mahsulot imkoniyatlarini belgilaydi."
    explainWrong={{ 0: 'Ko\'rinish emas — gap nimani saqlashda.', 2: 'Maqsad ish berish emas — mahsulotni belgilash.', 3: 'Texnik ham, lekin avvalo mahsulot qarori.', default: 'Sxema = nima saqlanadi = qaysi fycha mumkin.' }} />
);

// ===== SCREEN 5 — HAR MAYDON MAHSULOT SABABI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(COMMENTS.map(c => c.k)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= COMMENTS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? COMMENTS.find(c => c.k === active) : null;
  return (
    <Stage eyebrow="Mahsulot izohi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${COMMENTS.length} maydonni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har maydon — <span className="italic" style={{ color: T.accent }}>nega</span> kerak?</h2></div>
        <Mentor>Yaxshi PRD'da har maydonning mahsulot sababi yozilgan. Maydonni bosing — nega kerakligini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COMMENTS.map(c => { const open = seen.has(c.k); return (<button key={c.k} onClick={() => tap(c.k)} className={`fieldrow ${active === c.k ? 'fr-on' : ''}`}><span className="mono fr-k">{c.tbl}.{c.k}</span>{open ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span style={{ color: T.ink3 }}>?</span>}</button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.doc(16)}</span><span className="mono sk-wordbadge" style={{ color: T.blue, background: T.blueSoft }}>{cur.tbl}.{cur.k}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir maydonni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har maydon bir mahsulot sababga ega. Sababsiz maydon — ortiqcha (xavf ham).</p></div>}
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
    questionText="Nega sessiyalar jadvalida kirish_vaqti saqlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega <span className="mono" style={{ color: T.accent }}>kirish_vaqti</span> saqlanadi?</h2></>}
    options={['Shunchaki chiroyli ko\'rinadi', 'Tolovni hisoblash (chiqish − kirish) va peak soat metrikasi uchun', 'Sayt rangini o\'zgartirish uchun', 'Hech qanday sabab yo\'q']} correctIdx={1}
    explainCorrect="To'g'ri! Kirish vaqtisiz to'lovni hisoblay olmaysiz va eng gavjum soatni bilolmaysiz. Maydon aniq mahsulot sababiga ega."
    explainWrong={{ 0: 'Ko\'rinish emas — bu hisob-kitob uchun kerak.', 2: 'Rangga aloqasi yo\'q — to\'lov va metrika uchun.', 3: 'Aksincha — aniq sabab bor: to\'lov va peak soat.', default: 'Kirish vaqti to\'lov hisoblash + peak metrika uchun.' }} />
);

// ===== SCREEN 6 — FK/JOIN VIZUALIZATOR (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(SPOTS.map(s => s.id)) : new Set());
  const done = seen.size >= 3;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active != null ? SPOTS.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="FK / JOIN · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 joyni bosing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bog'lanish jonli: joyni bosing → <span className="italic" style={{ color: T.accent }}>kim turganini</span> ko'ring</h2></div>
        <Mentor><b style={{ color: T.ink }}>joy_id</b> (FK) sessiyani joyga bog'laydi. Joyni bosing — <b style={{ color: T.ink }}>JOIN</b> ikki jadvalni birlashtirib, o'sha joyda kim turganini ko'rsatadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">🅿️ joylar — bosing</p>
            <div className="spot-grid fade-up delay-1">
              {SPOTS.map(s => (<button key={s.id} onClick={() => tap(s.id)} className={`spot ${s.band ? 'spot-band' : 'spot-free'} ${active === s.id ? 'spot-active' : ''}`}><span className="spot-num">№{s.raqam}</span><span className="spot-st">{s.band ? '🟥 band' : '🟩 bo\'sh'}</span>{seen.has(s.id) && <span className="spot-seen">{Ico.check(11)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">🔗 JOIN natijasi</p>
            {cur ? (cur.band
              ? <div className="join-card fade-step" key={active}>
                  <div className="join-link"><span className="mono">joylar.id={cur.id}</span><span className="join-arrow">{Ico.link(16)} joy_id</span><span className="mono">sessiyalar</span></div>
                  <div className="join-row"><span className="jr-k">🚗 mashina</span><span className="mono jr-v">{cur.mashina}</span></div>
                  <div className="join-row"><span className="jr-k">⏰ kirish</span><span className="mono jr-v">{cur.kirish}</span></div>
                  <div className="join-row"><span className="jr-k">💰 tolov</span><span className="mono jr-v" style={{ color: T.honey }}>hisoblanmoqda…</span></div>
                </div>
              : <div className="join-empty fade-step" key={active}><span style={{ fontSize: 26 }}>🟩</span><p className="body" style={{ margin: '6px 0 0', color: T.ink2 }}>Joy №{cur.raqam} bo'sh — bog'langan sessiya yo'q (JOIN bo'sh qaytaradi).</p></div>)
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Joyni bosing — JOIN natijasi shu yerda</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana FK kuchi: <b>joy_id</b> orqali "kim qayerda?" degan savolga javob beriladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — NEGA BOG'LANISH KERAK =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('no');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['no', 'yes']) : new Set(['no']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nega FK kerak" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">FK bo'lmasa — <span className="italic" style={{ color: T.accent }}>chalkashlik</span></h2></div>
        <Mentor>Ikki jadvalni bog'lamasangiz nima bo'ladi? Ikki holatni solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'no' ? 'chip-on' : ''}`} onClick={() => set('no')}>❌ FK yo'q</button>
              <button className={`chip ${v === 'yes' ? 'chip-on' : ''}`} onClick={() => set('yes')}>🔗 FK bilan</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'yes' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'yes' ? '🧭' : '🌀'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'no'
                ? 'Sessiya bor, lekin qaysi joyniki noma\'lum. "01A123 qaysi joyda?" — javob yo\'q. Panel ishlamaydi.'
                : 'joy_id orqali har sessiya o\'z joyiga bog\'langan. JOIN bilan panel to\'liq ko\'rinadi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'no'
              ? <div className="frame-warn fade-step" key="n"><p className="body" style={{ margin: 0, color: T.ink }}>Bog'lanishsiz ma'lumot bor, lekin foydasiz — ulab bo'lmaydi.</p></div>
              : <div className="frame-success fade-step" key="y"><p className="body" style={{ margin: 0, color: T.ink }}>FK = ma'lumotlar orasidagi ko'prik. Mahsulotni mumkin qiladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bog'lanish — sxemaning eng muhim mahsulot qarori. Uni oldindan o'ylash kerak.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MAYDON ↔ QAYSI JADVAL (classify) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [marks, setMarks] = useState(() => storedAnswer ? Object.fromEntries(FIELD_TBL.map(f => [f.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(marks).length >= FIELD_TBL.length;
  const classify = (item, tbl) => { if (marks[item.id]) return; if (tbl === item.tbl) { setMarks(prev => ({ ...prev, [item.id]: true })); setWrong(null); } else setWrong(item.id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sxemani yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(marks).length}/${FIELD_TBL.length} joylang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har maydon <span className="italic" style={{ color: T.accent }}>qaysi jadvalga</span> tegishli?</h2></div>
        <Mentor>Sxemani o'zingiz yig'ing: har maydonni <b style={{ color: T.honey }}>joylar</b> yoki <b style={{ color: T.blue }}>sessiyalar</b> jadvaliga joylang.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 660, width: '100%', margin: '0 auto' }}>
          {FIELD_TBL.map(f => { const m = marks[f.id]; const isWrong = wrong === f.id; return (
            <div key={f.id} className={`classify-row ${m ? (f.tbl === 'joylar' ? 'cr-joylar' : 'cr-sess') : ''} ${isWrong ? 'shake-x' : ''}`}>
              <span className="mono" style={{ flex: 1, fontWeight: 700, fontSize: 'clamp(12.5px,1.6vw,14px)', color: T.ink }}>{f.label}</span>
              {m ? (<span className="mono small" style={{ fontWeight: 700, color: f.tbl === 'joylar' ? T.honey : T.blue }}>→ {f.tbl}</span>)
                : (<span style={{ display: 'flex', gap: 6 }}><button className="cls-btn cls-joylar" onClick={() => classify(f, 'joylar')}>joylar</button><button className="cls-btn cls-sess" onClick={() => classify(f, 'sessiyalar')}>sessiyalar</button></span>)}
            </div>
          ); })}
        </div>
        {wrong && !done && <p className="small" style={{ color: T.accent, textAlign: 'center', margin: 0 }}>Bu boshqa jadvalga tegishli — qaytadan o'ylab ko'ring.</p>}
        {done && <div className="frame-success fade-step" style={{ maxWidth: 660, width: '100%', margin: '0 auto' }}><p className="body" style={{ margin: 0, color: T.ink }}>Sxema tayyor! joylar — joy haqida, sessiyalar — kirib-chiqish haqida. joy_id ularni bog'laydi.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="sessiyalar.joy_id (FK) nima vazifani bajaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>joy_id</span> (FK) nima vazifani bajaradi?</h2></>}
    options={['Sahifani bezaydi', 'Sessiyani joyga bog\'laydi — "mashina qaysi joyda" (JOIN)', 'Parolni saqlaydi', 'Hech narsa']} correctIdx={1}
    explainCorrect="To'g'ri! joy_id — foreign key (FK). U sessiyani joyga bog'laydi, JOIN orqali 'kim qayerda turibdi' degan savolga javob beradi."
    explainWrong={{ 0: 'Bezak emas — bu bog\'lanish kaliti.', 2: 'Parolga aloqasi yo\'q — joyni bog\'laydi.', 3: 'Aksincha — eng muhim bog\'lanish vazifasini bajaradi.', default: 'joy_id sessiyani joyga bog\'laydi (FK + JOIN).' }} />
);

// ===== SCREEN 10 — ROADMAP: yangi fycha = sxema o'zgarishi (SIGNATURE 2) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CHANGES = [
    { id: 'vip', text: 'joylar\'ga narx maydoni qo\'shish' },
    { id: 'disc', text: 'sessiyalar\'ga chegirma maydoni qo\'shish' },
    { id: 'sms', text: 'yangi mijozlar jadvali + telefon' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(ROADMAP.map(p => [p.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= ROADMAP.length;
  const pickF = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickC = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(12.5px,1.5vw,14px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Sxema ↔ roadmap" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${ROADMAP.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi fycha = <span className="italic" style={{ color: T.accent }}>sxema o'zgarishi</span></h2></div>
        <Mentor>Mijoz yangi narsa so'raydi — bu ko'pincha <b style={{ color: T.ink }}>sxemaga maydon qo'shish</b> demak. Har <b style={{ color: T.ink }}>fychani</b> kerakli <b style={{ color: T.ink }}>sxema o'zgarishi</b> bilan ulang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Mijoz so'rovi (fycha)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {ROADMAP.map(p => { const m = matched[p.id]; const on = sel === p.id; return (<button key={p.id} onClick={() => pickF(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.honey, display: 'inline-flex' }}>{m ? Ico.check(17) : Ico.flag(16)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p.feat}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Sxema o'zgarishi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {CHANGES.map(c => { const m = matched[c.id]; const isWrong = wrong === c.id; return (<button key={c.id} onClick={() => pickC(c.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(16) : Ico.db(15)}</span><span className="mono" style={{ flex: 1, fontSize: 'clamp(11.5px,1.4vw,13px)' }}>{c.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa fycha uchun. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? <b>Sxema o'sishi = mahsulot o'sishi.</b> Roadmap ko'pincha sxemada boshlanadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — SXEMANI JAMOA O'QIYDI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(READERS.map(r => r.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= READERS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? READERS.find(r => r.id === active) : null;
  return (
    <Stage eyebrow="Jamoa o'qiydi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta sxema — <span className="italic" style={{ color: T.accent }}>butun jamoa</span> o'qiydi</h2></div>
        <Mentor>Yaxshi sxema — umumiy til. Har kim undan kerakligini oladi. Uchchalasini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {READERS.map(r => (<button key={r.id} onClick={() => tap(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === r.id ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -8px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 20 }}>{r.emoji}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{r.who}</span>{seen.has(r.id) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge">{cur.who} ko'radi</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.sees}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Birini bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun sxema = hujjat: bir marta yozasiz, hamma o'qiydi.</p></div>}
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
    questionText="Mijoz 'oylik abonement' so'radi. PM nuqtai nazaridan bu ko'pincha nimani anglatadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yangi fycha so'ralsa, bu ko'pincha <span className="italic" style={{ color: T.accent }}>nimani</span> anglatadi?</h2></>}
    options={['Faqat rang o\'zgaradi', 'Sxemaga yangi maydon/jadval kerak bo\'lishi mumkin — roadmap qadami', 'Hech narsa o\'zgarmaydi', 'Loyihani qaytadan boshlash']} correctIdx={1}
    explainCorrect="To'g'ri! Yangi fycha ko'pincha yangi ma'lumotni talab qiladi — demak sxemaga maydon yoki jadval qo'shiladi. Sxema o'zgarishi = roadmap qadami."
    explainWrong={{ 0: 'Rang emas — yangi ma\'lumot kerak bo\'ladi.', 2: 'Aksincha — odatda sxema o\'zgaradi.', 3: 'Qaytadan emas — sxemaga qo\'shiladi.', default: 'Yangi fycha → ko\'pincha sxema o\'zgarishi.' }} />
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>sxema PRD bo'lib</span> ishladi</h2></div>
        <Mentor>AvtoStoyanka jamoasining yo'li — 4 qadam. Har qatorni bosib, sxema qanday hujjat bo'lganini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.doc(16)}</span><span className="cl-title">AvtoStoyanka — sxema hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Chizdi → o'qildi → o'sdi → tez qurildi. Sxema = hujjat. Endi o'zingiznikini yozasiz.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Sxemani <span className="italic" style={{ color: T.accent }}>hujjat</span> kabi yoz</h2></div>
      <Mentor>Yaxshi sxema 3 narsani beradi: NIMA saqlaydi, NEGA (mahsulot izohi), va qanday BOG'LANADI (FK/JOIN).</Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>📋</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Sxema = PRD</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Jamoa o'qiydi, roadmap shundan o'sadi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Yaxshi sxema — 3 narsa</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.table(18), c: T.accent, t: 'NIMA saqlaydi (jadval + maydon)' }, { ic: Ico.doc(18), c: T.blue, t: 'NEGA (har maydon mahsulot izohi)' }, { ic: Ico.link(18), c: T.success, t: 'BOG\'LANISH (FK / JOIN)' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: jadval.maydon — nega =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['joylar.holat — panelda bo\'sh/band ko\'rsatish…', 'sessiyalar.kirish_vaqti — to\'lov hisoblash…', 'sessiyalar.joy_id — mashina qaysi joyda (JOIN)…'];
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
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangiz (yoki AvtoStoyanka) uchun: <span className="italic" style={{ color: T.accent }}>jadval.maydon — nega kerak</span></h2></div>
        <Mentor>PRD uslubida yozing: <b style={{ color: T.ink }}>jadval.maydon — mahsulot sababi</b>. Kamida 2 ta. O'ngda sxema hujjatingiz yig'iladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>Maydon + sabab {i + 1}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning sxema hujjatingiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — sxema hujjatingiz shu yerda paydo bo'ladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.doc(15)}</span><span className="cl-title">Sxema — PRD</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi sxemangiz hujjat bo'lib, jamoaga aniq yo'l ko'rsatadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Sxema = PRD hujjati — nimani va NEGA saqlaymiz', 'Har maydon mahsulot sababiga ega (product comment)', 'FK (joy_id) + JOIN — ma\'lumotlarni bog\'laydi', 'Yangi fycha = sxema o\'zgarishi = roadmap qadami'];
  const HOMEWORK = [{ b: 'Loyihangiz sxemasini chizing', t: '— 2 jadval, har maydon yonida nega kerakligi' }, { b: 'Bog\'lanishni belgilang', t: '— qaysi FK qaysi jadvalni ulaydi' }, { b: 'Bitta yangi fycha o\'ylang', t: '— u qaysi maydonni qo\'shadi?' }];
  const GLOSSARY = [{ b: 'Sxema', t: '— jadvallar va maydonlar tuzilmasi' }, { b: 'FK (foreign key)', t: '— bir jadvalni boshqasiga bog\'lovchi maydon' }, { b: 'JOIN', t: '— ikki jadvalni birlashtirib o\'qish' }, { b: 'PRD', t: '— mahsulot talablari hujjati' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi sxema siz uchun <span className="italic" style={{ color: T.accent }}>hujjat</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Sxema = PRD, mahsulot izohi, FK/JOIN va roadmap bog\'lanishini bilasiz. Keyingi darsda — keyin qurilgan fullstack arxitekturani stakeholderga pitch qilamiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Sxema ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Sxema chizgan — yarmini qurgan! 📋</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🎤</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi PM: Arxitektura pitchi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>AvtoStoyanka to'liq qurilgach — uni stakeholderga vizual pitch bilan tushuntirasiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson13({ lang: langProp, onFinished }) {
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

        /* === DB TABLE (sxema kartochkasi) === */
        .dbtable { background: ${T.paper}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -9px rgba(${T.shadowBase},0.2); border: 1px solid ${T.ink3}33; }
        .dbtable.dbt-active { box-shadow: 0 10px 26px -8px rgba(1,154,203,0.3), inset 0 0 0 1.5px ${T.blue}; }
        .dbt-head { display: flex; align-items: center; gap: 8px; background: ${CODE.bg}; color: #fff; padding: 9px 13px; font-weight: 700; font-size: 13px; }
        .dbt-field { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 13px; border-bottom: 1px solid ${T.ink3}22; font-size: 12.5px; }
        .dbt-field:last-child { border-bottom: none; }
        .dbt-field.dbt-fk { background: ${T.blueSoft}; }
        .dbt-k { font-weight: 700; color: ${T.ink}; display: inline-flex; align-items: center; gap: 6px; }
        .dbt-fkbadge { font-family: 'Manrope'; font-size: 8.5px; font-weight: 800; color: #fff; background: ${T.blue}; padding: 1px 5px; border-radius: 4px; letter-spacing: 0.04em; }
        .dbt-t { color: ${T.ink3}; font-size: 11px; }

        /* === FIELD ROW (s5) === */
        .fieldrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left; border: none; border-radius: 10px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .fieldrow:hover { transform: translateX(2px); }
        .fieldrow.fr-on { box-shadow: inset 0 0 0 1.5px ${T.blue}, 0 6px 16px -8px rgba(1,154,203,0.25); background: ${T.blueSoft}; }
        .fr-k { font-weight: 700; font-size: 13px; color: ${T.ink}; }

        /* === FK / JOIN VIZUALIZATOR (s6) === */
        .spot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .spot { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; border: none; border-radius: 12px; padding: 14px 8px; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.2); }
        .spot-free { background: ${T.successSoft}; } .spot-band { background: ${T.accentSoft}; }
        .spot:hover { transform: translateY(-2px); }
        .spot-active { box-shadow: inset 0 0 0 2px ${T.ink}, 0 10px 22px -8px rgba(${T.shadowBase},0.3); }
        .spot-num { font-family: 'Fraunces', serif; font-weight: 700; font-size: 20px; color: ${T.ink}; }
        .spot-st { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.ink2}; }
        .spot-seen { position: absolute; top: 6px; right: 6px; color: ${T.success}; display: inline-flex; }
        .join-card { background: ${T.paper}; border-radius: 12px; padding: 14px 15px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.18); display: flex; flex-direction: column; gap: 7px; }
        .join-link { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-bottom: 9px; border-bottom: 1px solid ${T.ink3}33; font-size: 11.5px; color: ${T.ink}; }
        .join-arrow { display: inline-flex; align-items: center; gap: 4px; color: ${T.blue}; font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .join-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .jr-k { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink2}; }
        .jr-v { font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .join-empty { background: ${T.successSoft}; border-radius: 12px; padding: 18px; text-align: center; }

        /* === GDPR/classify (s8) === */
        .classify-row { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 11px; padding: 10px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; flex-wrap: wrap; }
        .classify-row.cr-joylar { background: ${T.honeySoft}; box-shadow: inset 0 0 0 1.5px ${T.honey}66; }
        .classify-row.cr-sess { background: ${T.blueSoft}; box-shadow: inset 0 0 0 1.5px ${T.blue}55; }
        .cls-btn { font-family: 'Manrope'; font-weight: 700; font-size: 12px; border: none; border-radius: 8px; padding: 6px 12px; cursor: pointer; transition: all 0.16s; }
        .cls-joylar { background: ${T.honeySoft}; color: ${T.honey}; } .cls-joylar:hover { background: ${T.honey}; color: #fff; }
        .cls-sess { background: ${T.blueSoft}; color: ${T.blue}; } .cls-sess:hover { background: ${T.blue}; color: #fff; }

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
