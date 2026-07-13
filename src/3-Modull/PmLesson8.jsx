import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 8-DARS (Modul 3 · PM2) — KOMPONENT = FYCHA, PRIORITET — PLATFORM STANDARD v16
// G'oya: React ilova = komponentlar to'plami; har komponent = fycha. Nimani AVVAL qurish?
// Markaziy qurol: Impact (foyda) × Effort (kuch) 2x2 matritsasi.
// Kvadrantlar: Oson g'alaba (ko'p foyda/kam kuch) · Katta loyiha · Mayda ish · Vaqt yeguvchi.
// Oltin qoida: ko'p foyda + kam kuch = avval shu.
// Hero keys: "logoga animatsiya qo'shsam sotuvga qancha foyda?" (kam foyda, ko'p kuch = vaqt yeguvchi).
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
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 2.5L4.5 13.5H10l-1 8 9.5-12.5H13z" /></svg>),
  up: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M12 19V6M6 12l6-6 6 6" /></svg>),
  right: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M5 12h13M12 6l6 6-6 6" /></svg>)
};

const LESSON_META = { lessonId: 'pm-priority-08-v16', lessonTitle: { uz: 'Prioritet — Impact vs Effort', ru: 'Приоритизация — Impact vs Effort' } };
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
// 4 kvadrant
const QUADS = {
  win: { key: 'win', label: 'Oson g\'alaba', emoji: '🏆', color: T.success, soft: T.successSoft, sub: 'ko\'p foyda · kam kuch', hint: 'Ko\'p foyda, kam kuch — AVVAL shu!', tip: 'AVVAL' },
  big: { key: 'big', label: 'Katta loyiha', emoji: '🏗', color: T.blue, soft: T.blueSoft, sub: 'ko\'p foyda · ko\'p kuch', hint: 'Ko\'p foyda, lekin ko\'p kuch — rejalashtirib qil.', tip: 'KEYIN' },
  small: { key: 'small', label: 'Mayda ish', emoji: '🍬', color: T.honey, soft: T.honeySoft, sub: 'kam foyda · kam kuch', hint: 'Kam foyda, kam kuch — vaqt bo\'lsa qilasan.', tip: 'BO\'SH VAQTDA' },
  sink: { key: 'sink', label: 'Vaqt yeguvchi', emoji: '🕳', color: T.accent, soft: T.accentSoft, sub: 'kam foyda · ko\'p kuch', hint: 'Kam foyda, ko\'p kuch — qilma!', tip: 'QILMA' }
};
// matritsa tartibi: yuqori qator = ko'p foyda; chap ustun = kam kuch
const QGRID = ['win', 'big', 'small', 'sink'];
const quadOf = (impact, effort) => (impact === 'hi' ? (effort === 'lo' ? 'win' : 'big') : (effort === 'lo' ? 'small' : 'sink'));

// Mini-do'kon komponentlari (fychalar)
const FEATURES = [
  { id: 'list', text: 'Mahsulot ro\'yxati', impact: 'hi', effort: 'lo', q: 'win', why: 'Do\'kon ishlashi uchun shart — odam ko\'rmasa sotib ololmaydi. Tez quriladi.' },
  { id: 'search', text: 'Qidiruv', impact: 'hi', effort: 'lo', q: 'win', why: 'Kerakli narsani tez topadi — katta foyda, oz kuch.' },
  { id: 'cart', text: 'Savat', impact: 'hi', effort: 'hi', q: 'big', why: 'Juda kerak, lekin ko\'p ish (holat, jami narx). Rejalashtirib qil.' },
  { id: 'ai', text: 'AI tavsiya', impact: 'hi', effort: 'hi', q: 'big', why: 'Foydali, lekin og\'ir. Keyingi bosqichga.' },
  { id: 'dark', text: 'Tungi rejim', impact: 'lo', effort: 'lo', q: 'small', why: 'Yoqimli, oson — lekin sotuvga ta\'siri kam. Vaqt bo\'lsa.' },
  { id: 'anim', text: 'Logoga animatsiya', impact: 'lo', effort: 'hi', q: 'sink', why: 'Qiziq ko\'rinadi, lekin ko\'p vaqt oladi va sotuvga foydasi yo\'q. Qilma!' }
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

// Qora "ro'yxat" kartasi
const SpecCard = ({ items, minH = 200, title = 'Ro\'yxat', icon }) => (
  <div className="spec-card" style={{ minHeight: minH }}>
    <div className="spec-head"><span style={{ display: 'inline-flex', color: '#9FB4D8' }}>{icon || Ico.bolt(15)}</span><span className="spec-title">{title}</span></div>
    {items.map((it, i) => (
      <div key={i} className={it.text ? 'feat-pop' : ''}>
        {it.label && <span className="spec-lbl" style={{ color: it.color || '#9FB4D8' }}>{it.label}</span>}
        <p className="spec-text" style={{ color: it.text ? '#E8E5DD' : '#6B7585', fontStyle: it.text ? 'normal' : 'italic' }}>{it.text || it.ph}</p>
      </div>
    ))}
  </div>
);

// ===== SIGNATURE: Impact × Effort matritsasi =====
const Matrix = ({ chips = {}, onCell, selectable, glow, shakeQ, active, sub = true }) => (
  <div className="mx-outer fade-up">
    <div className="mx-yax">FOYDA {Ico.up(11)}</div>
    <div className="mx-grid">
      {QGRID.map(q => {
        const Qd = QUADS[q]; const list = chips[q] || [];
        return (
          <div key={q} onClick={selectable ? () => onCell && onCell(q) : undefined} className={`mx-cell ${selectable ? 'sel' : ''} ${glow === q ? 'glow' : ''} ${active === q ? 'act' : ''} ${shakeQ === q ? 'shake-x' : ''}`} style={{ borderColor: Qd.color + '55' }}>
            <div className="mx-cell-head"><span className="mx-emoji">{Qd.emoji}</span><span className="mx-cell-lbl" style={{ color: Qd.color }}>{Qd.label}</span></div>
            {sub && <span className="mx-cell-sub">{Qd.sub}</span>}
            <div className="mx-chips">{list.map((c, i) => <span key={i} className="mx-chip feat-pop" style={{ background: Qd.soft, color: Qd.color }}>{c}</span>)}</div>
          </div>
        );
      })}
    </div>
    <div className="mx-xax">KUCH {Ico.right(11)}</div>
  </div>
);

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

// ===== SCREEN 0 — HOOK (2 reja, oqibat) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [plan, setPlan] = useState('A');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'A — eng qiziq ko\'ringani uchun' },
    { id: 'b', label: 'B — ko\'p foyda beradigan, tez ishdan boshlagani uchun' },
    { id: 'c', label: 'Farqi yo\'q, ikkalasi bir xil' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const A = { feats: ['Logoga animatsiya', 'Salyut effekti'], ok: false, res: 'Do\'kon hali sotmaydi — mahsulot ham, qidiruv ham yo\'q.' };
  const B = { feats: ['Mahsulot ro\'yxati', 'Qidiruv'], ok: true, res: 'Do\'kon allaqachon sotyapti! Asosiy ish tayyor.' };
  const cur = plan === 'A' ? A : B;
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 840 }}>Bir hafta vaqt bor — <span className="italic" style={{ color: T.accent }}>qaysi</span> komponentdan boshlaysan?</h1>
        <Mentor>Ikki dasturchi do'kon quryapti, lekin <b style={{ color: T.ink }}>boshqacha tartibda</b>. Har rejani bosib, 1 hafta o'tgach natijani ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${plan === 'A' ? 'chip-on' : ''}`} onClick={() => setPlan('A')}>Reja A</button>
              <button className={`chip ${plan === 'B' ? 'chip-on' : ''}`} onClick={() => setPlan('B')}>Reja B</button>
            </div>
            <div key={plan} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.success : T.accent}` }}>
              <span className="mono small" style={{ color: T.ink3 }}>BIRINCHI HAFTA QURDI</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 12px' }}>{cur.feats.map(f => <span key={f} style={{ fontFamily: "'Manrope'", fontWeight: 600, fontSize: 13, color: T.ink, background: T.bg, padding: '6px 12px', borderRadius: 99 }}>{f}</span>)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: cur.ok ? T.successSoft : T.accentSoft, borderRadius: 10, padding: '10px 13px' }}><span style={{ fontSize: 18 }}>{cur.ok ? '🎉' : '😕'}</span><p style={{ fontFamily: G, fontSize: 13.5, color: T.ink, margin: 0 }}>{cur.res}</p></div>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi reja to'g'ri?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Vaqt cheklangan! Avval <b>ko'p foyda beradigan, tez bo'ladigan</b> ishdan boshla. Buni <b>oson g'alaba</b> deyiladi. Bugun shu tartibni o'rganamiz.</p>}
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
    { text: 'Har komponent = bitta fycha', tag: '' },
    { text: 'Foyda (impact) va kuch (effort)ni baholash', tag: '' },
    { text: 'Matritsaga joylash — qaysi kvadrant?', tag: '' },
    { text: 'Oson g\'alabani topib, vaqt yeguvchini olib tashlash', tag: 'mashq' },
    { text: 'O\'z loyihangiz komponentlarini prioritetlash', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up"><Matrix sub /></div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Avval 🏆 oson g'alaba: ko'p foyda, kam kuch</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Hamma komponent teng emas — qaysini avval?</span></h2></div>
        <Mentor>Vaqt va kuch cheklangan. Har komponentni <b style={{ color: T.ink }}>foyda</b> va <b style={{ color: T.ink }}>kuch</b> bo'yicha o'lchab, <b style={{ color: T.ink }}>matritsaga</b> joylaymiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Matritsani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — FYCHALAR: foyda va kuch =====
const S2 = [FEATURES[0], FEATURES[2], FEATURES[5], FEATURES[4]]; // win, big, sink, small
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(S2.map(f => f.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= S2.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? S2.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="Foyda va kuch" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har komponentning <span className="italic" style={{ color: T.accent }}>foyda</span>si va <span className="italic" style={{ color: T.accent }}>kuch</span>i bormi?</h2></div>
        <Mentor>Do'kon komponentlari. Bittasini bosib, <b style={{ color: T.ink }}>qancha foyda</b> beradi va <b style={{ color: T.ink }}>qancha kuch</b> oladi — ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {S2.map(f => (<button key={f.id} onClick={() => tap(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === f.id ? `inset 0 0 0 2px ${QUADS[f.q].color}, 0 8px 20px -8px ${QUADS[f.q].color}44` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{f.text}</span>{seen.has(f.id) && <span style={{ marginLeft: 'auto', fontSize: 16 }}>{QUADS[f.q].emoji}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 18 }}>{QUADS[cur.q].emoji}</span><span className="sk-wordbadge" style={{ color: QUADS[cur.q].color, background: QUADS[cur.q].soft }}>{cur.text}</span></span>
                <div style={{ display: 'flex', gap: 8, margin: '12px 0 0', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 12, color: cur.impact === 'hi' ? T.success : T.ink3, background: cur.impact === 'hi' ? T.successSoft : T.bg, padding: '5px 11px', borderRadius: 99 }}>Foyda: {cur.impact === 'hi' ? 'KO\'P' : 'kam'}</span>
                  <span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 12, color: cur.effort === 'hi' ? T.accent : T.ink3, background: cur.effort === 'hi' ? T.accentSoft : T.bg, padding: '5px 11px', borderRadius: 99 }}>Kuch: {cur.effort === 'hi' ? 'KO\'P' : 'kam'}</span>
                </div>
                <p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{cur.why}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir komponentni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har komponentning foyda va kuchi har xil. Shuning uchun hammasi teng emas.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ANIMATSIYA TUZOG'I (toggle) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('anim');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['anim', 'list']) : new Set(['anim']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const Bar = ({ label, val, color }) => (<div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span className="mono small" style={{ color: T.ink2 }}>{label}</span></div><div className="meter-track"><div className="meter-fill" style={{ width: `${val}%`, background: color }} /></div></div>);
  const cur = v === 'anim' ? { foyda: 18, kuch: 85, c: T.accent, t: 'Logoga animatsiya', note: 'Qiziq ko\'rinadi, lekin ko\'p vaqt oladi va sotuvga foydasi deyarli yo\'q. 🕳 Vaqt yeguvchi.' } : { foyda: 92, kuch: 22, c: T.success, t: 'Mahsulot ro\'yxati', note: 'Do\'kon ishlashi uchun shart, tez quriladi. 🏆 Oson g\'alaba.' };
  return (
    <Stage eyebrow="Tuzoq" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Animatsiya qo'shsam <span className="italic" style={{ color: T.accent }}>foyda</span>si bormi?"</h2></div>
        <Mentor>Eng keng tarqalgan tuzoq: <b style={{ color: T.ink }}>qiziq</b> narsadan boshlash. Ikki komponentni solishtiring — foyda va kuch o'lchagichini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'anim' ? 'chip-on' : ''}`} onClick={() => set('anim')}>Logoga animatsiya</button>
              <button className={`chip ${v === 'list' ? 'chip-on' : ''}`} onClick={() => set('list')}>Mahsulot ro'yxati</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 'clamp(16px,2.5vw,22px)' }}>
              <Bar label="FOYDA (impact)" val={cur.foyda} color={cur.foyda > 50 ? T.success : T.ink3} />
              <Bar label="KUCH (effort)" val={cur.kuch} color={cur.kuch > 50 ? T.accent : T.success} />
            </div>
          </Col>
          <Col>
            <div className={v === 'anim' ? 'frame-warn fade-step' : 'frame-success fade-step'} key={v}><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: cur.c, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cur.t}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.note}</p></div>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qiziq ≠ foydali. Har komponent uchun so'rang: <b>foyda ko'pmi? kuch kammi?</b></p></div>}
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
    questionText="Vaqt cheklangan bo'lsa, qaysi komponentni avval qurasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Vaqt cheklangan — qaysi komponentni <span className="italic" style={{ color: T.accent }}>avval</span> qurasiz?</h2></>}
    options={['Eng qiziq ko\'ringanini', 'Ko\'p foyda beradigan va kam kuch oladiganini', 'Eng qiyinini', 'Eng oxirida o\'ylanganini']} correctIdx={1}
    explainCorrect="To'g'ri! Ko'p foyda + kam kuch = oson g'alaba. Tez tayyor bo'ladi va katta foyda beradi — shundan boshlanadi."
    explainWrong={{ 0: 'Qiziq ≠ foydali. Avval foyda beradigan, tez bo\'ladiganidan boshlang.', 2: 'Eng qiyini ko\'p kuch oladi. Avval oson g\'alaba.', 3: 'Tartibsiz emas — foyda va kuch bo\'yicha o\'lchab tanlang.', default: 'Avval ko\'p foyda + kam kuch (oson g\'alaba).' }} />
);

// ===== SCREEN 5 — MATRITSA: 4 kvadrant (signature) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState('win');
  const [seen, setSeen] = useState(storedAnswer ? new Set(QGRID) : new Set(['win']));
  const isNarrow = useIsMobile(768);
  const done = seen.size >= QGRID.length;
  const tap = (q) => { setActive(q); setSeen(prev => { const n = new Set(prev); n.add(q); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const Qd = QUADS[active];
  const exFeat = FEATURES.find(f => f.q === active);
  return (
    <Stage eyebrow="Matritsa" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 kvadrantni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Impact × Effort matritsasi — <span className="italic" style={{ color: T.accent }}>4 kvadrant</span></h2></div>
        <Mentor>Yuqori = ko'p foyda, o'ng = ko'p kuch. Har <b style={{ color: T.ink }}>kvadrantni</b> bosib, ma'nosini ko'ring. 🏆 doim yonib turadi — u eng muhimi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Matrix selectable onCell={tap} active={active} glow="win" sub />
          </Col>
          <Col>
            <div className="sk-info fade-step" key={active}>
              <span className="sk-tagbig"><span style={{ fontSize: 20 }}>{Qd.emoji}</span><span className="sk-wordbadge" style={{ color: Qd.color, background: Qd.soft }}>{Qd.label}</span><span className="mono small" style={{ color: Qd.color, fontWeight: 700, marginLeft: 'auto' }}>→ {Qd.tip}</span></span>
              <p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{Qd.hint}</p>
              {exFeat && <p style={{ fontFamily: G, fontStyle: 'italic', color: T.ink2, margin: '9px 0 0', fontSize: 13.5 }}>Misol: "{exFeat.text}"</p>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rt kvadrant tayyor. Endi har komponentni shu matritsaga joylaymiz.</p></div>}
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
    questionText="'Oson g'alaba' qaysi kvadrant?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>🏆 "Oson g'alaba" qaysi <span className="italic" style={{ color: T.accent }}>kvadrant</span>?</h2></>}
    options={['Ko\'p foyda, ko\'p kuch', 'Ko\'p foyda, kam kuch', 'Kam foyda, kam kuch', 'Kam foyda, ko\'p kuch']} correctIdx={1}
    explainCorrect="To'g'ri! Oson g'alaba = ko'p foyda, kam kuch. Tez tayyor bo'ladi, katta foyda beradi — eng birinchi shu."
    explainWrong={{ 0: 'Bu — Katta loyiha (rejalashtirib qilinadi). Oson g\'alaba kam kuch oladi.', 2: 'Bu — Mayda ish. Oson g\'alaba esa KO\'P foyda beradi.', 3: 'Bu — Vaqt yeguvchi (qilma!). Oson g\'alaba aksi: ko\'p foyda, kam kuch.', default: 'Oson g\'alaba = ko\'p foyda, kam kuch.' }} />
);

// ===== SCREEN 6 — HAFTALIK REJA (stepper) =====
const PLAN = [
  { f: 'Mahsulot ro\'yxati', q: 'win', note: '🏆 Oson g\'alaba — birinchi navbatda.' },
  { f: 'Qidiruv', q: 'win', note: '🏆 Yana oson g\'alaba — tez foyda.' },
  { f: 'Savat', q: 'big', note: '🏗 Katta loyiha — endi rejalashtirib quramiz.' },
  { f: 'Tungi rejim', q: 'small', note: '🍬 Mayda ish — vaqt qolsa.' }
];
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? PLAN.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = step >= PLAN.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < PLAN.length) timer.current = setTimeout(() => tick(i + 1), 820); else setRunning(false); }; timer.current = setTimeout(() => tick(1), 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Haftalik reja" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,13px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Reja <span className="italic" style={{ color: T.accent }}>tartib bilan</span> quriladi</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>oson g'alabalar</b>, keyin katta loyihalar, oxirida mayda ishlar. <b style={{ color: T.ink }}>🕳 Vaqt yeguvchi umuman yo'q.</b> Tugmani bosing.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PLAN.map((p, i) => { const on = step > i; const Qd = QUADS[p.q]; return (<div key={i} className={on ? 'ver-in' : ''} style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', opacity: on ? 1 : 0.32, boxShadow: on ? `0 7px 18px -10px rgba(${T.shadowBase},0.18)` : 'none', borderLeft: `4px solid ${on ? Qd.color : T.ink3}`, transition: 'all 0.45s' }}><span className="mono" style={{ fontSize: 13, fontWeight: 800, color: on ? Qd.color : T.ink3 }}>{i + 1}</span><span style={{ fontSize: 16 }}>{Qd.emoji}</span><div style={{ minWidth: 0, flex: 1 }}><p style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink, margin: 0 }}>{p.f}</p>{on && <p className="small fade-step" style={{ color: T.ink2, margin: '1px 0 0', fontStyle: 'italic' }}>{p.note}</p>}</div>{on && <span style={{ color: T.success }}>{Ico.check(15)}</span>}</div>); })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Tartiblanmoqda…' : (done ? '↻ Yana ko\'rish' : 'Rejani tuzish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'g'ri tartib: <b>oson g'alaba → katta loyiha → mayda ish.</b> Vaqt yeguvchi rejaga kirmadi.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TO'G'RI TARTIB vs TUZOQ (compare) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('right');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['right', 'wrong']) : new Set(['right']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const RIGHT = [{ label: '1', color: CODE.str, text: 'Mahsulot ro\'yxati 🏆' }, { label: '2', color: CODE.str, text: 'Qidiruv 🏆' }, { label: '3', color: CODE.str, text: 'Savat 🏗' }];
  const WRONG = [{ label: '1', color: '#FFCB6B', text: 'Logoga animatsiya 🕳' }, { label: '2', color: '#FFCB6B', text: 'Salyut effekti 🕳' }, { label: '3', color: '#FFCB6B', text: 'Mahsulot ro\'yxati (juda kech!)' }];
  return (
    <Stage eyebrow="To'g'ri tartib" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi tartib bilan <span className="italic" style={{ color: T.accent }}>boshlash</span> kerak?</h2></div>
        <Mentor>Ikki reja — biri oson g'alabadan, biri qiziq narsadan boshlaydi. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'right' ? 'chip-on' : ''}`} onClick={() => set('right')}>To'g'ri tartib</button>
              <button className={`chip ${v === 'wrong' ? 'chip-on' : ''}`} onClick={() => set('wrong')}>Tuzoq tartib</button>
            </div>
            <div key={v}><SpecCard items={v === 'right' ? RIGHT : WRONG} minH={170} title={v === 'right' ? 'Reja — foydadan boshlash' : 'Reja — qiziqdan boshlash'} icon={Ico.bolt(15)} /></div>
          </Col>
          <Col>
            {v === 'right'
              ? <div className="frame-success fade-step" key="r"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Do'kon tez ishlaydi</p><p className="body" style={{ margin: 0, color: T.ink }}>Oson g'alabalar birinchi — do'kon darrov sotadi, keyin katta funksiyalar qo'shiladi.</p></div>
              : <div className="frame-warn fade-step" key="w"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vaqt behuda ketdi</p><p className="body" style={{ margin: 0, color: T.ink }}>Animatsiyaga vaqt ketdi, asosiy ish (mahsulot ro'yxati) esa eng oxiriga qoldi. Do'kon hali sotmaydi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Doim <b>oson g'alabadan</b> boshla — qiziq narsa keyin.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MATRITSANI TO'LDIRISH (place) — signature =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(storedAnswer ? Object.fromEntries(FEATURES.map(f => [f.id, f.q])) : {});
  const [sel, setSel] = useState(null);
  const [shakeQ, setShakeQ] = useState(null);
  const done = Object.keys(placed).length >= FEATURES.length;
  const remaining = FEATURES.filter(f => !placed[f.id]);
  const chips = {}; QGRID.forEach(q => { chips[q] = []; });
  FEATURES.forEach(f => { if (placed[f.id]) chips[placed[f.id]].push(f.text); });
  const onCell = (q) => {
    if (!sel) return;
    const f = FEATURES.find(x => x.id === sel);
    if (f.q === q) { setPlaced(p => ({ ...p, [sel]: q })); setSel(null); }
    else { setShakeQ(q); setTimeout(() => setShakeQ(s => (s === q ? null : s)), 460); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const selF = sel ? FEATURES.find(f => f.id === sel) : null;
  return (
    <Stage eyebrow="Matritsani to'ldir" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(placed).length}/${FEATURES.length} joylang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har komponentni <span className="italic" style={{ color: T.accent }}>to'g'ri</span> kvadrantga joylang</h2></div>
        <Mentor>Avval pastdan bitta <b style={{ color: T.ink }}>komponentni</b> tanlang, keyin uning <b style={{ color: T.ink }}>kvadrantini</b> bosing. Foyda va kuchini o'ylang!</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Matrix selectable onCell={onCell} shakeQ={shakeQ} glow={done ? 'win' : null} chips={chips} sub />
        {!done && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="flow-label">Komponentlar — bittasini tanlang ({remaining.length} qoldi)</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {remaining.map(f => { const on = sel === f.id; return (<button key={f.id} onClick={() => setSel(f.id)} style={{ fontFamily: "'Manrope'", fontWeight: 600, fontSize: 13, padding: '9px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', background: on ? T.ink : T.paper, color: on ? T.bg : T.ink, boxShadow: on ? `0 6px 16px -5px rgba(${T.shadowBase},0.4)` : `0 5px 14px -8px rgba(${T.shadowBase},0.18)`, transition: 'all 0.16s' }}>{f.text}</button>); })}
            </div>
            {selF && <div className="frame-soft fade-step" style={{ padding: '10px 14px' }}><p className="body" style={{ margin: 0, color: T.ink }}><b>{selF.text}</b> — Foyda: <b style={{ color: selF.impact === 'hi' ? T.success : T.ink2 }}>{selF.impact === 'hi' ? 'ko\'p' : 'kam'}</b>, Kuch: <b style={{ color: selF.effort === 'hi' ? T.accent : T.ink2 }}>{selF.effort === 'hi' ? 'ko\'p' : 'kam'}</b>. Endi kvadrantni bosing.</p></div>}
          </div>
        )}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Matritsa to'ldi. Endi 🏆 oson g'alabalar (mahsulot ro'yxati, qidiruv) — birinchi navbatda.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (do'kon keysi) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Mini-do'kon: qaysi komponent birinchi qurilishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mini-do'kon: qaysi komponent <span className="italic" style={{ color: T.accent }}>birinchi</span>?</h2></>}
    options={['Logoga animatsiya', 'Mahsulot ro\'yxati', 'AI tavsiya tizimi', 'Salyut effekti']} correctIdx={1}
    explainCorrect="To'g'ri! Mahsulot ro'yxati — ko'p foyda (do'kon ishlashi uchun shart), kam kuch (tez quriladi). 🏆 Oson g'alaba — birinchi shu."
    explainWrong={{ 0: 'Animatsiya — vaqt yeguvchi (kam foyda, ko\'p kuch). Birinchi emas.', 2: 'AI tavsiya — katta loyiha (ko\'p foyda, lekin ko\'p kuch). Keyinroq.', 3: 'Salyut — bezak, foydasi kam. Birinchi mahsulot ro\'yxati.', default: 'Birinchi — mahsulot ro\'yxati (oson g\'alaba).' }} />
);

// ===== SCREEN 10 — VAQT YEGUVCHINI OLIB TASHLASH (debug) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const rows = [
    { key: 'anim', text: 'Logoga animatsiya', q: 'sink', bad: true },
    { key: 'list', text: 'Mahsulot ro\'yxati', q: 'win' },
    { key: 'search', text: 'Qidiruv', q: 'win' },
    { key: 'cart', text: 'Savat', q: 'big' }
  ];
  const clickLine = (k) => { if (found || fixed) return; if (k === 'anim') setFound(true); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const order = fixed ? rows.filter(r => r.key !== 'anim') : rows;
  return (
    <Stage eyebrow="Tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi olib tashlang' : 'Vaqt yeguvchini toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu rejada qaysi komponent <span className="italic" style={{ color: T.accent }}>birinchi bo'lmasligi</span> kerak?</h2></div>
        <Mentor>Reja yozilgan, lekin <b style={{ color: T.ink }}>1-o'rinда vaqt yeguvchi</b> turibdi. Qaysi biri? O'sha qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">REJA</span><span className="ai-bubble">{fixed ? 'Tozalangan tartib:' : 'Tekshiring:'}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.map((l, i) => { const Qd = QUADS[l.q]; const bad = found && !fixed && l.bad; return (<div key={l.key} onClick={() => clickLine(l.key)} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 9, background: bad ? T.accentSoft : T.bg, borderRadius: 10, padding: '9px 12px', boxShadow: bad ? `inset 0 0 0 1.5px ${T.accent}` : 'none', transition: 'all 0.18s' }}><span className="mono" style={{ fontSize: 12, fontWeight: 800, color: T.ink3 }}>{i + 1}</span><span style={{ fontSize: 15 }}>{Qd.emoji}</span><span style={{ flex: 1, fontFamily: G, fontSize: 13.5, color: T.ink }}>{l.text}</span></div>); })}
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Vaqt yeguvchini rejadan olib tashlash</button>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: 🕳 vaqt yeguvchi = <b>kam foyda, ko'p kuch</b>. Qaysi komponent sotuvga foyda bermay, ko'p vaqt oladi?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>"Logoga animatsiya" — kam foyda, ko'p kuch. Rejada birinchi bo'lishi mumkin emas. Olib tashlang — oson g'alabalar oldinga chiqsin.</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 32 }}>🏆</div><p className="ta-h">Endi reja oson g'alabadan boshlanadi</p><p className="ta-sub">Vaqt yeguvchi — chetga</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — BU HAFTA (build / prioritet tanlash) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CORRECT = ['list', 'search'];
  const [chosen, setChosen] = useState(() => new Set(storedAnswer?.chosen || []));
  const allGood = chosen.size === 2 && CORRECT.every(c => chosen.has(c));
  const workRef = useRef(null);
  const toggle = (id) => { if (allGood) return; setChosen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else if (n.size < 2) n.add(id); return n; }); };
  useEffect(() => {
    if (!allGood) return;
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, chosen: [...chosen] });
    if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  const items = FEATURES.filter(f => chosen.has(f.id)).map(f => ({ label: '🏆 BU HAFTA', color: CODE.str, text: f.text }));
  while (items.length < 2) items.push({ label: '🏆 BU HAFTA', color: '#6B7585', text: '', ph: 'bo\'sh slot…' });
  const badPick = chosen.size === 2 && !allGood;
  return (
    <Stage eyebrow="Bu hafta" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allGood} label={allGood ? 'Davom etish' : (chosen.size < 2 ? `Tanlang (${chosen.size}/2)` : 'Oson g\'alabalarni tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu hafta faqat <span className="italic" style={{ color: T.accent }}>2 ta slot</span> — eng muhimini tanlang</h2></div>
        <Mentor>6 komponent, lekin bu hafta faqat 2 tasini qurasiz. <b style={{ color: T.ink }}>🏆 Oson g'alabalarni</b> (ko'p foyda, kam kuch) tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">Komponentlar ({chosen.size}/2 tanlangan)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEATURES.map(f => { const on = chosen.has(f.id); const full = chosen.size >= 2 && !on; const Qd = QUADS[f.q]; return (
                <button key={f.id} onClick={() => toggle(f.id)} disabled={full && !allGood} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', border: 'none', borderRadius: 11, padding: '11px 13px', cursor: full ? 'not-allowed' : 'pointer', background: on ? T.success : T.paper, color: on ? '#fff' : T.ink, opacity: full ? 0.45 : 1, boxShadow: on ? `0 7px 16px -7px ${T.success}` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}><span style={{ display: 'inline-flex' }}>{on ? Ico.check(16) : <span style={{ fontSize: 15 }}>{Qd.emoji}</span>}</span><span style={{ flex: 1, fontFamily: "'Manrope'", fontWeight: 600, fontSize: 14 }}>{f.text}</span></button>
              ); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Bu haftaning rejasi</p>
            <SpecCard items={items} minH={150} title="🏆 Bu hafta" />
            {badPick && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu ikkisi eng foydali emas. Eslang: <b>ko'p foyda + kam kuch</b> — mahsulot ro'yxati va qidiruv.</p></div>}
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana! Eng ko'p foyda beradigan 2 ta — do'kon shu hafta ishga tushadi.</p></div>}
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
    questionText="Nega 'qiziq'dan emas, 'foydali'dan boshlaymiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega <span className="italic" style={{ color: T.accent }}>"qiziq"</span>dan emas, "foydali"dan boshlaymiz?</h2></>}
    options={['Qiziq narsa qiyin bo\'lgani uchun', 'Vaqt cheklangan — eng ko\'p foyda beradigan ish muhim', 'Foydali narsa har doim oson', 'Qiziq narsa umuman kerak emas']} correctIdx={1}
    explainCorrect="To'g'ri! Vaqt va kuch cheklangan. Eng ko'p foyda beradigan (oson g'alaba) ishdan boshlasak, mahsulot tez ishga tushadi."
    explainWrong={{ 0: 'Gap qiyinlikda emas — foydada. Ko\'p foyda beradiganidan boshlanadi.', 2: 'Foydali narsa har doim oson emas (savat — katta loyiha). Lekin foyda muhim.', 3: 'Qiziq narsa keyin qo\'shilishi mumkin — lekin avval foyda beradigan ish.', default: 'Vaqt cheklangan — eng ko\'p foyda beradigan ish muhim.' }} />
);

// ===== SCREEN 13 — NAMUNA: to'ldirilgan matritsa =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(FEATURES.map(f => f.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= FEATURES.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const chips = {}; QGRID.forEach(q => { chips[q] = []; }); FEATURES.forEach(f => chips[f.q].push(f.text));
  const cur = active ? FEATURES.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${FEATURES.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor matritsa: har komponent <span className="italic" style={{ color: T.accent }}>nega</span> shu yerda?</h2></div>
        <Mentor>Mana to'liq to'ldirilgan matritsa. Pastdagi har komponentni bosib, nega aynan shu kvadrantda ekanini ko'ring.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Matrix chips={chips} glow="win" sub />
        <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FEATURES.map(f => { const open = seen.has(f.id); return (<button key={f.id} onClick={() => tap(f.id)} style={{ fontFamily: "'Manrope'", fontWeight: 600, fontSize: 12.5, padding: '8px 13px', borderRadius: 99, border: 'none', cursor: 'pointer', background: active === f.id ? T.ink : T.paper, color: active === f.id ? T.bg : T.ink, boxShadow: open ? `inset 0 0 0 1px ${T.success}66` : `0 5px 14px -8px rgba(${T.shadowBase},0.18)`, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{QUADS[f.q].emoji} {f.text}{open && active !== f.id && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(12)}</span>}</button>); })}
        </div>
        {cur ? <div className="frame-soft fade-step" key={active}><p className="body" style={{ margin: 0, color: T.ink }}><b>{QUADS[cur.q].emoji} {cur.text}</b> — {cur.why}</p></div> : (!isNarrow && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Bir komponentni bosing</p>)}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har komponent o'z o'rnida. Endi o'z loyihangizni shunday tartiblaysiz.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Avval <span className="italic" style={{ color: T.accent }}>oson g'alaba</span></h2></div>
      <Mentor>Hamma komponent teng emas. Har birini <b style={{ color: T.ink }}>foyda</b> va <b style={{ color: T.ink }}>kuch</b> bo'yicha o'lchab, <b style={{ color: T.ink }}>ko'p foyda + kam kuch</b>dan boshlang.</Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🏆</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Oson g'alaba — birinchi</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Ko'p foyda, kam kuch. Tez foyda beradi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Har komponent uchun 2 savol</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.up(18), c: T.success, t: 'FOYDA ko\'pmi?' }, { ic: Ico.bolt(18), c: T.accent, t: 'KUCH kammi?' }, { ic: <span style={{ fontSize: 17 }}>🏆</span>, c: T.honey, t: 'Ikkalasi ha → AVVAL shu' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: o'z komponentlaringni matritsaga =====
const emptyRows = () => [{ name: '', impact: null, effort: null }, { name: '', impact: null, effort: null }, { name: '', impact: null, effort: null }, { name: '', impact: null, effort: null }];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(() => storedAnswer?.rows || emptyRows());
  const complete = rows.filter(r => r.name.trim().length >= 2 && r.impact && r.effort);
  const passed = complete.length >= 3;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, rows, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (i, field, val) => setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  const chips = {}; QGRID.forEach(q => { chips[q] = []; });
  complete.forEach(r => chips[quadOf(r.impact, r.effort)].push(r.name.trim()));
  const Toggle = ({ on, color, onClick, children }) => (<button onClick={onClick} style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 11.5, padding: '5px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', background: on ? color : T.bg, color: on ? '#fff' : T.ink2, transition: 'all 0.15s' }}>{children}</button>);
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${complete.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangiz komponentlarini <span className="italic" style={{ color: T.accent }}>matritsaga</span> joylang</h2></div>
        <Mentor>Komponent nomini yozing va <b style={{ color: T.success }}>foyda</b> + <b style={{ color: T.accent }}>kuch</b>ini belgilang. O'ngda ular avtomatik kvadrantga tushadi. Kamida 3 ta to'ldiring.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {rows.map((r, i) => { const ok = r.name.trim().length >= 2 && r.impact && r.effort; return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <input value={r.name} onChange={e => upd(i, 'name', e.target.value)} placeholder={`Komponent ${i + 1} (masalan: profil sahifasi)`} style={{ width: '100%', fontFamily: G, fontSize: 13.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '8px 11px', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="mono small" style={{ color: T.ink3 }}>Foyda:</span>
                  <Toggle on={r.impact === 'hi'} color={T.success} onClick={() => upd(i, 'impact', 'hi')}>ko'p</Toggle>
                  <Toggle on={r.impact === 'lo'} color={T.ink3} onClick={() => upd(i, 'impact', 'lo')}>kam</Toggle>
                  <span className="mono small" style={{ color: T.ink3, marginLeft: 6 }}>Kuch:</span>
                  <Toggle on={r.effort === 'lo'} color={T.success} onClick={() => upd(i, 'effort', 'lo')}>kam</Toggle>
                  <Toggle on={r.effort === 'hi'} color={T.accent} onClick={() => upd(i, 'effort', 'hi')}>ko'p</Toggle>
                  {ok && <span style={{ marginLeft: 'auto', fontSize: 16 }}>{QUADS[quadOf(r.impact, r.effort)].emoji}</span>}
                </div>
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning matritsangiz</p>
            <Matrix chips={chips} glow={passed ? 'win' : null} sub />
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi qaysi komponentdan boshlashni bilasiz: 🏆 oson g'alabadan.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Har komponent = fycha — hammasi teng emas', 'Impact (foyda) × Effort (kuch) matritsasi', '🏆 Oson g\'alaba: ko\'p foyda, kam kuch — avval shu', '🕳 Vaqt yeguvchi: kam foyda, ko\'p kuch — qilma'];
  const HOMEWORK = [{ b: 'Loyihangizni matritsaga soling', t: '— har komponentga foyda/kuch bering' }, { b: 'Oson g\'alabani toping', t: '— birinchi shuni quring' }, { b: 'Vaqt yeguvchini belgilang', t: '— "qiziq, lekin foydasiz" narsalarni chetga' }];
  const GLOSSARY = [{ b: 'Impact (foyda)', t: '— komponent qancha qiymat beradi' }, { b: 'Effort (kuch)', t: '— uni qurish qancha vaqt/mehnat oladi' }, { b: 'Oson g\'alaba', t: '— ko\'p foyda, kam kuch (quick win)' }, { b: 'Vaqt yeguvchi', t: '— kam foyda, ko\'p kuch (qilma)' }, { b: 'Prioritet', t: '— nimani avval qurish tartibi' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>nimani avval</span> qurishni bilasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Impact×Effort matritsasi bilan har komponentni prioritetlaysiz. React darslarida oson g\'alabadan boshlaysiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Prioritet ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Vaqt cheklangan — oson g'alabadan boshla! 🏆</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson8({ lang: langProp, onFinished }) {
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        @keyframes feat-pop { 0% { transform: scale(.7); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        .feat-pop { animation: feat-pop .34s cubic-bezier(.2,.7,.2,1); }
        @keyframes shake { 0%,100% { transform: none; } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .shake-x { animation: shake 0.42s; }
        @keyframes ver-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
        .ver-in { animation: ver-in .45s cubic-bezier(.2,.7,.2,1); }

        /* === IMPACT × EFFORT MATRITSASI === */
        .mx-outer { display: flex; flex-direction: column; gap: 6px; }
        .mx-yax { display: flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: 0.12em; color: ${T.ink2}; font-weight: 700; }
        .mx-xax { display: flex; align-items: center; justify-content: center; gap: 5px; font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: 0.12em; color: ${T.ink2}; font-weight: 700; }
        .mx-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; }
        .mx-cell { background: ${T.paper}; border: 1.5px solid; border-radius: 13px; padding: 11px; min-height: 90px; display: flex; flex-direction: column; gap: 3px; transition: all 0.2s; }
        .mx-cell.sel { cursor: pointer; }
        .mx-cell.sel:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -8px rgba(${T.shadowBase},0.24); }
        .mx-cell.act { box-shadow: inset 0 0 0 2px ${T.ink}; }
        .mx-cell.glow { box-shadow: 0 0 0 2px ${T.success}, 0 10px 24px -8px rgba(31,122,77,0.4); animation: mx-glow 1.8s ease-in-out infinite; }
        @keyframes mx-glow { 0%,100% { box-shadow: 0 0 0 2px ${T.success}, 0 8px 20px -10px rgba(31,122,77,0.35); } 50% { box-shadow: 0 0 0 3px ${T.success}, 0 13px 28px -6px rgba(31,122,77,0.5); } }
        .mx-cell-head { display: flex; align-items: center; gap: 6px; }
        .mx-emoji { font-size: 16px; line-height: 1; }
        .mx-cell-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; }
        .mx-cell-sub { font-family: 'JetBrains Mono'; font-size: 8.5px; color: ${T.ink3}; text-transform: uppercase; letter-spacing: 0.04em; }
        .mx-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: auto; padding-top: 5px; }
        .mx-chip { font-family: 'Manrope'; font-weight: 600; font-size: 11px; padding: 3px 9px; border-radius: 99px; }

        /* === O'LCHAGICH (s3) === */
        .meter-track { height: 12px; border-radius: 99px; background: rgba(167,166,162,0.22); overflow: hidden; }
        .meter-fill { height: 100%; border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1), background 0.3s; }

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

        /* === AI CARD / TAKEAWAY === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
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
