import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 09 · PM4 — METRIKALI PITCH: DEMO DAY 3 — v16 (AUDIOSIZ) — KURS FINALI
// G'oya: IT-auditoriya uchun pitch strukturasi; metrika = isbot; arxitektura sxemasi = kuchli slayd.
// Mahsulot: o'quvchi 3-daqiqalik metrikali pitchni repetitsiya qiladi (o'z to'liq tizimi haqida).
// Joylashuv: P3 (to'liq tizim) dan keyin — KURSNING ENG OXIRGI DARSI.
// Falsafa: SIZ — DIREKTOR. IT-auditoriyaga: maqtanma — ko'rsat va raqam bilan isbotla.
// Signature 1: Pitch deck quruvchi (5 slayd). Signature 2: 3-daqiqa repetitsiya timeri.
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
  present: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M12 16v4M8 20h8" /></svg>),
  chart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 20V4M4 20h16" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="5" width="3" height="12" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>),
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  hand: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6m0-1V4a1.5 1.5 0 0 1 3 0v7m0-1V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L7 16" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-pitch-25-v16', lessonTitle: { uz: 'Metrikali pitch — Demo Day 3', ru: 'Питч с метриками: Demo Day 3' } };
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
// Pitch 5 slaydi (s2, s6, s13)
const SLIDES = [
  { id: 'problem', label: 'Muammo', emoji: '🎯', color: T.accent, q: 'Qaysi muammoni hal qildingiz?', content: 'Kichik do\'kon egasi buyurtmani qo\'lda daftarda yuritadi — adashadi, vaqt ketadi.' },
  { id: 'demo', label: 'Demo', emoji: '▶️', color: T.grape, q: 'Nimani jonli ko\'rsatasiz?', content: 'Web, mobil va botdan buyurtma beriladi — hammasi bitta tizimda darrov paydo bo\'ladi.' },
  { id: 'arch', label: 'Arxitektura', emoji: '🧩', color: T.blue, q: 'Tizim qanday tuzilgan?', content: 'Web + Mobil + Bot → Backend (Node) → Baza (PostgreSQL) + AI. Ko\'p kanal, bitta tizim.' },
  { id: 'metrics', label: 'Metrika', emoji: '📊', color: T.success, q: 'Ishlashini nima isbotlaydi?', content: 'Kuniga 50 buyurtma · 99% uptime (ishlab turgan vaqt) · 200ms javob · 40% qaytish (retention).' },
  { id: 'ask', label: 'So\'rov', emoji: '🤝', color: T.honey, q: 'Auditoriyadan nima so\'raysiz?', content: 'Keyingi qadam — to\'lov tizimi. Sizdan: fidbek va hamkorlik.' }
];

// Metrika sorteri (s8)
const PITCH_METRICS = [
  { id: 'orders', t: 'Kuniga 50 tugatilgan buyurtma', strong: true, why: 'Tizim real qiymat berayotganini ko\'rsatadi — kuchli isbot.' },
  { id: 'uptime', t: '99% uptime, 200ms javob vaqti', strong: true, why: 'Ishonchlilik va tezlik — IT-auditoriya buni qadrlaydi.' },
  { id: 'colors', t: 'Ilovada 12 xil rang', strong: false, why: 'Vanity — tizim ishlashini isbotlamaydi.' },
  { id: 'lines', t: '10 000 qator kod yozildi', strong: false, why: 'Ko\'p kod — yaxshi natija degani emas. Natija muhim.' }
];

// 3-daqiqa timeri (s11)
const TIMER_SECTIONS = [
  { id: 'problem', label: 'Muammo', sec: 30, color: T.accent, say: 'Muammoni qisqa ayt — kim, nimadan qiynaladi.' },
  { id: 'demo', label: 'Demo', sec: 45, color: T.grape, say: 'Jonli ko\'rsat — buyurtma berilib, tizimda paydo bo\'ladi.' },
  { id: 'arch', label: 'Arxitektura', sec: 30, color: T.blue, say: 'Sxema slaydi — ko\'p kanal, bitta backend.' },
  { id: 'metrics', label: 'Metrika', sec: 45, color: T.success, say: 'Raqamlar — buyurtma, uptime, javob vaqti.' },
  { id: 'ask', label: 'So\'rov', sec: 30, color: T.honey, say: 'Keyingi qadam va so\'rovni ayt.' }
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

// Pitch deck hujjati (s6, s15)
const DeckDoc = ({ rows, title = 'Pitch deck' }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.present(16)}</span><span>{title}</span></div>
    {rows.map((r, i) => (
      <div key={i} className="deck-row">
        <span className="deck-num" style={{ background: r.color }}>{i + 1}</span>
        <div style={{ minWidth: 0 }}><span className="deck-tag" style={{ color: r.color }}>{r.emoji} {r.label}</span><p className="deck-val">{r.text}</p></div>
      </div>
    ))}
  </div>
);

// Mini arxitektura slaydi (s7)
const ArchMini = () => (
  <div className="arch-mini">
    <div className="am-col"><span className="am-node">💻 Web</span><span className="am-node">📱 Mobil</span><span className="am-node">✈️ Bot</span></div>
    <span className="am-arrow">→</span>
    <span className="am-node am-core">🟢 Backend</span>
    <span className="am-arrow">→</span>
    <div className="am-col"><span className="am-node">🐘 Baza</span><span className="am-node">🤖 AI</span></div>
  </div>
);

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: '«Bizning ilova juda zo\'r va innovatsion!» deyish' },
    { id: 'b', label: 'Tuzilgan pitch: muammo → demo → arxitektura → metrika' },
    { id: 'c', label: 'Hamma kodni qatorma-qator ko\'rsatish' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Kirish · Demo Day" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Demo Day! <span className="italic" style={{ color: T.accent }}>3 daqiqa</span>, IT-auditoriya oldida. Nima ko'rsatasiz?</h1>
        <Mentor>To'liq tizim qurdingiz. Endi uni taqdim etasiz. Texnik auditoriya maqtovga emas — dalilga qaraydi. Tanlang.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.accent}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.accent, fontWeight: 700 }}>🎤 SAHNADA</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>Old qatorda dasturchilar, mentorlar, investorlar. Soat ketyapti: <b>3:00 → 0:00</b>. Bir marta gapirasiz — har soniya muhim.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Eng kuchli yo'l qaysi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri — <b>tuzilgan pitch</b>: muammo → demo → arxitektura → metrika → so'rov. Bugun (kursning <b>oxirgi darsi</b>) shu strukturani o'rganamiz va 3-daqiqalik pitchni repetitsiya qilamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Pitch strukturasi (5 bo\'lim)', tag: '' },
    { text: 'IT-auditoriya: dalil, bo\'sh so\'z emas', tag: '' },
    { text: 'Metrika = isbot; arxitektura = kuchli slayd', tag: '' },
    { text: 'Pitch deck va 3-daqiqa repetitsiya', tag: 'jonli' },
    { text: 'O\'z pitchingiz konturini yozasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.present(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>3-daqiqalik metrikali pitch</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Ko'rsat, isbotla, so'ra — zich va aniq.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Siz direktor — tizimingizni dalil bilan taqdim etasiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Tizimingizni metrika bilan pitch qilamiz</span></h2></div>
        <Mentor>IT-auditoriya raqamni va ishlaydigan tizimni qadrlaydi. Bugun — <b style={{ color: T.ink }}>struktura va isbot</b>. Bu kursning yakuniy darsi.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — PITCH STRUKTURASI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(SLIDES.map(s => s.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= SLIDES.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? SLIDES.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="Pitch strukturasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${SLIDES.length} bo'limni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitch — <span className="italic" style={{ color: T.accent }}>5 bo'lim</span></h2></div>
        <Mentor>Kuchli pitch 5 bo'limdan iborat. Har birini bosing: u qaysi savolga javob beradi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SLIDES.map((c, i) => (<button key={c.id} onClick={() => tap(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 14px', background: T.paper, boxShadow: active === c.id ? `inset 0 0 0 2px ${c.color}, 0 8px 20px -8px ${c.color}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: c.color, minWidth: 14 }}>{i + 1}</span><span style={{ fontSize: 18 }}>{c.emoji}</span><span style={{ flex: 1, fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink }}>{c.label}</span>{seen.has(c.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '12px 0 0', fontStyle: 'italic' }}>«{cur.q}»</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir bo'limni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib: <b>Muammo → Demo → Arxitektura → Metrika → So'rov</b>. Hikoya kabi oqadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — IT-AUDITORIYA BOSHQACHA =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('hype');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['hype', 'sub']) : new Set(['hype']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isHype = v === 'hype';
  return (
    <Stage eyebrow="IT-auditoriya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">IT-auditoriya — <span className="italic" style={{ color: T.accent }}>maqtov emas, dalil</span></h2></div>
        <Mentor>Texnik auditoriya bo'sh so'zlardan charchagan. Ular ishlaydigan narsani va raqamni ko'rishni istaydi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isHype ? 'chip-on' : ''}`} onClick={() => set('hype')}>🎈 Maqtov</button>
              <button className={`chip ${!isHype ? 'chip-on' : ''}`} onClick={() => set('sub')}>🔬 Dalil</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isHype ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{isHype
                ? '«Bizning AI-quvvatli, innovatsion, inqilobiy platformamiz bozorni o\'zgartiradi!» — bo\'sh so\'zlar, hech qanday dalil.'
                : '«Jonli demo: buyurtma 3 kanaldan keladi. Arxitektura mana. Kuniga 50 buyurtma, 99% uptime.» — ko\'rsatildi va isbotlandi.'}</p>
            </div>
          </Col>
          <Col>
            {isHype
              ? <div className="frame-warn fade-step" key="h"><p className="body" style={{ margin: 0, color: T.ink }}>Maqtov — IT-auditoriyani ishontirmaydi, balki shubha uyg'otadi. «Ko'rsat» deydi ular.</p></div>
              : <div className="frame-success fade-step" key="s"><p className="body" style={{ margin: 0, color: T.ink }}>Dalil — ishlaydigan demo, sxema, raqam. Bu ishonch qozonadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: aytma — ko'rsat. Sifat emas, dalil bilan gapir.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="IT-auditoriya pitchda nimani ko'rishni istaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>IT-auditoriya nimani <span className="italic" style={{ color: T.accent }}>istaydi</span>?</h2></>}
    options={['Ko\'p sifatlar: «zo\'r, innovatsion, inqilobiy»', 'Dalil: ishlaydigan demo, arxitektura va metrikalar', 'Faqat chiroyli slaydlar', 'Uzoq tarix va hissiyot']} correctIdx={1}
    explainCorrect="To'g'ri! IT-auditoriya dalil istaydi: ishlaydigan demo, arxitektura sxemasi va metrikalar. Bo'sh so'z emas, dalil ularni ishontiradi."
    explainWrong={{ 0: 'Sifatlar — bo\'sh so\'z. Dalil kerak.', 2: 'Chiroyli slayd yetarli emas — mazmun muhim.', 3: 'Hissiyot — bu auditoriya raqamni afzal ko\'radi.', default: 'Demo + arxitektura + metrika.' }} />
);

// ===== SCREEN 5 — METRIKA = ISBOT =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('claim');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['claim', 'proof']) : new Set(['claim']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isClaim = v === 'claim';
  return (
    <Stage eyebrow="Metrika = isbot" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Metrika — <span className="italic" style={{ color: T.accent }}>da'voning isboti</span></h2></div>
        <Mentor>Har da'voni raqam bilan quvvatlang. «Yaxshi» — fikr; «50 buyurtma/kun» — dalil. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isClaim ? 'chip-on' : ''}`} onClick={() => set('claim')}>💬 Da'vo</button>
              <button className={`chip ${!isClaim ? 'chip-on' : ''}`} onClick={() => set('proof')}>📊 Isbot</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isClaim ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{isClaim
                ? '«Bizning tizim juda tez va ishonchli ishlaydi.» — qanchalik tez? qanchalik ishonchli? Hech kim bilmaydi.'
                : '«Javob vaqti 200ms, uptime 99%, kuniga 50 buyurtma.» — aniq, tekshiriladigan, ishonarli.'}</p>
            </div>
          </Col>
          <Col>
            {isClaim
              ? <div className="frame-warn fade-step" key="c"><p className="body" style={{ margin: 0, color: T.ink }}>Da'vo — sub'yektiv. Auditoriya «isboti qani?» deb so'raydi.</p></div>
              : <div className="frame-success fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>Raqam — obyektiv dalil. Da'vongizni mustahkamlaydi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har da'voga raqam: «tez» → «200ms», «ko'p ishlatiladi» → «50 buyurtma/kun».</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Mahsulot ishlashini auditoriyaga qanday isbotlaysiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ishlashini qanday <span className="italic" style={{ color: T.accent }}>isbotlaysiz</span>?</h2></>}
    options={['Ko\'proq sifatlar bilan: «zo\'r, tez, kuchli»', 'Metrikalar bilan: aniq raqamlar (buyurtma, uptime, javob vaqti)', 'Ovozni balandlatib', 'Uzoqroq gapirib']} correctIdx={1}
    explainCorrect="To'g'ri! Metrikalar — aniq raqamlar (kunlik buyurtma, uptime, javob vaqti) ishlashini isbotlaydi. Sifatlar emas, son dalil bo'ladi."
    explainWrong={{ 0: 'Sifatlar — isbot emas, fikr.', 2: 'Ovoz — dalil emas.', 3: 'Uzoq gapirish — ishontirmaydi. Raqam ishontiradi.', default: 'Aniq metrikalar bilan isbotlanadi.' }} />
);

// ===== SCREEN 6 — PITCH DECK QURUVCHI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [built, setBuilt] = useState(() => storedAnswer ? new Set(SLIDES.map(s => s.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'ask' : null);
  const workRef = useRef(null);
  const done = built.size >= SLIDES.length;
  const add = (id) => { setActive(id); setBuilt(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const rows = SLIDES.filter(s => built.has(s.id)).map(s => ({ emoji: s.emoji, label: s.label, color: s.color, text: s.content }));
  return (
    <Stage eyebrow="Pitch deck · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Deckni yig'ing (${built.size}/${SLIDES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitch deck'ni <span className="italic" style={{ color: T.accent }}>slayd-slayd yig'ing</span></h2></div>
        <Mentor>Mini-do'kon misolida 5 slaydni bosing — har biri deck'ga qo'shiladi. Beshtasini yig'ing.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {SLIDES.map((s, i) => { const on = built.has(s.id); return (
                <button key={s.id} onClick={() => add(s.id)} className={`plink ${on ? 'plink-on' : ''}`}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: s.color, minWidth: 14 }}>{i + 1}</span>
                  <span style={{ fontSize: 16, minWidth: 20 }}>{s.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{s.label}</span></span>
                  <span className="plink-act">{on ? 'qo\'shildi' : '+ slayd'}</span>
                </button>
              ); })}
            </div>
            {active && (<div className="sk-info fade-step" key={active} style={{ marginTop: 2 }}><p className="flow-label" style={{ margin: 0 }}>{SLIDES.find(s => s.id === active).label}</p><p style={{ fontFamily: G, fontSize: 13.5, color: T.ink, margin: '6px 0 0' }}>{SLIDES.find(s => s.id === active).content}</p></div>)}
          </Col>
          <Col>
            {rows.length === 0
              ? <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Slaydni bosing — pitch deck'ingiz shu yerda yig'iladi.</p></div>
              : <DeckDoc rows={rows} />}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq pitch deck — 5 slayd, hikoya kabi oqadi. Endi vaqtga sig'dirishni mashq qilamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — ARXITEKTURA SLAYDI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('words');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['words', 'diagram']) : new Set(['words']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isWords = v === 'words';
  return (
    <Stage eyebrow="Arxitektura slaydi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Arxitektura sxemasi — <span className="italic" style={{ color: T.accent }}>kuchli slayd</span></h2></div>
        <Mentor>IT-auditoriya uchun tizim sxemasi — siz haqiqiy tizim qurganingiz dalili. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isWords ? 'chip-on' : ''}`} onClick={() => set('words')}>💬 So'z bilan</button>
              <button className={`chip ${!isWords ? 'chip-on' : ''}`} onClick={() => set('diagram')}>🧩 Sxema slaydi</button>
            </div>
            {isWords
              ? <div key="w" className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.accent}` }}><p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>«Bizda frontend, backend, baza va bot bor, hammasi bog'langan...» — quloqda qoladi, ko'z oldida emas, tasavvur qilish qiyin.</p></div>
              : <div key="d" className="demo-swap"><ArchMini /></div>}
          </Col>
          <Col>
            {isWords
              ? <div className="frame-warn fade-step" key="wi"><p className="body" style={{ margin: 0, color: T.ink }}>Faqat so'z — auditoriya tizimni ko'z oldiga keltira olmaydi.</p></div>
              : <div className="frame-success fade-step" key="di"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta sxema — ko'p kanal, bitta backend. «Bu odam haqiqiy tizim qurgan» degan taassurot.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Arxitektura slaydini qo'ying — u sizning eng kuchli texnik dalilingiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — QAYSI METRIKA (sorter) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PITCH_METRICS.map(m => m.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= PITCH_METRICS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? PITCH_METRICS.find(m => m.id === active) : null;
  return (
    <Stage eyebrow="Qaysi metrika" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${PITCH_METRICS.length} metrikani ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi raqam <span className="italic" style={{ color: T.accent }}>ishlashni isbotlaydi?</span></h2></div>
        <Mentor>Har metrikani bosing: u kuchli isbotmi yoki vanity (bo'sh raqam)? Pitchga faqat kuchlilarini oling.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PITCH_METRICS.map(m => { const open = seen.has(m.id); return (
                <button key={m.id} onClick={() => tap(m.id)} className="det-opt" style={open ? { boxShadow: `inset 0 0 0 1.5px ${m.strong ? T.success : T.accent}`, background: (m.strong ? T.successSoft : T.accentSoft) } : undefined}>
                  <span className="det-box" style={open ? { background: m.strong ? T.success : T.accent, boxShadow: 'none' } : undefined}>{open ? (m.strong ? Ico.check(13) : Ico.x(13)) : ''}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{m.t}</span>
                  {open && <span className="mono" style={{ fontSize: 9, fontWeight: 800, color: m.strong ? T.success : T.accent }}>{m.strong ? 'KUCHLI' : 'VANITY'}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className={`${cur.strong ? 'frame-success' : 'frame-warn'} fade-step`} key={active}><p className="note-h" style={{ color: cur.strong ? T.success : T.accent }}>{cur.strong ? '📊 Kuchli isbot' : '🎈 Vanity'}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir metrikani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kuchli metrika maqsadga (ishlash, ishonchlilik) bog'liq. Vanity raqamlarni pitchda ishlatmang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Pitchda arxitektura sxemasi nima beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Arxitektura slaydi nima <span className="italic" style={{ color: T.accent }}>beradi</span>?</h2></>}
    options={['Hech narsa — u faqat chiroy uchun', 'Siz haqiqiy, ishlaydigan tizim qurganingizning kuchli dalili', 'Auditoriyani chalg\'itadi', 'Faqat dasturchilarga tushunarli, foydasiz']} correctIdx={1}
    explainCorrect="To'g'ri! Arxitektura sxemasi — siz real, ishlaydigan tizim qurganingizning kuchli vizual dalili. IT-auditoriya buni bir qarashda tushunadi va qadrlaydi."
    explainWrong={{ 0: 'Chiroy emas — bu texnik dalil.', 2: 'Chalg\'itmaydi — aksincha, aniqlik beradi.', 3: 'Foydali — aynan texnik auditoriya uchun kuchli.', default: 'Haqiqiy tizim qurganingiz dalili.' }} />
);

// ===== SCREEN 10 — 3 DAQIQA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('long');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['long', 'tight']) : new Set(['long']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isLong = v === 'long';
  return (
    <Stage eyebrow="3 daqiqa" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">3 daqiqa — <span className="italic" style={{ color: T.accent }}>zich va aniq</span></h2></div>
        <Mentor>Vaqt cheklangan. Ko'p gapirish — dushman, zichlik — do'st. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isLong ? 'chip-on' : ''}`} onClick={() => set('long')}>🗯️ Vaysaqi</button>
              <button className={`chip ${!isLong ? 'chip-on' : ''}`} onClick={() => set('tight')}>🎯 Zich</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isLong ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isLong
                ? 'Tarixdan boshlab, har detalga to\'xtab, 10 daqiqa gapirish — vaqt tugaydi, asosiy g\'oya yetib bormaydi.'
                : 'Har bo\'limga belgilangan vaqt: muammo 30s, demo 45s... 3 daqiqada eng muhimi aytiladi.'}</p>
            </div>
          </Col>
          <Col>
            {isLong
              ? <div className="frame-warn fade-step" key="l"><p className="body" style={{ margin: 0, color: T.ink }}>Cheksiz gapirish — auditoriya diqqatini yo'qotadi, vaqt tugaydi.</p></div>
              : <div className="frame-success fade-step" key="t"><p className="body" style={{ margin: 0, color: T.ink }}>Zich pitch — har soniya ishlaydi. Vaqtni bo'limlarga taqsimlang va repetitsiya qiling.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 daqiqani bo'limlarga bo'ling va mashq qiling. Keyin sahnada qiynalmaysiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — PITCH REPETITSIYA TIMERI (SIGNATURE 2) =====
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const TOTAL_SEC = TIMER_SECTIONS.reduce((a, s) => a + s.sec, 0);
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? TIMER_SECTIONS.length - 1 : -1);
  const workRef = useRef(null);
  const done = step >= TIMER_SECTIONS.length - 1;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const usedSec = TIMER_SECTIONS.slice(0, step + 1).reduce((a, s) => a + s.sec, 0);
  const cur = step >= 0 ? TIMER_SECTIONS[step] : null;
  return (
    <Stage eyebrow="Pitch repetitsiya · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Repetitsiya (${step + 1}/${TIMER_SECTIONS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">3-daqiqa <span className="italic" style={{ color: T.accent }}>repetitsiya</span></h2></div>
        <Mentor>3 daqiqani 5 bo'limga taqsimladik. «Boshla» bosing — har bo'limga necha soniya va nima deyishni ko'ring. Vaqtga sig'diring!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">Vaqt byudjeti</span><span className="mono" style={{ fontSize: 13, fontWeight: 700, color: usedSec > 0 ? T.accent : T.ink3 }}>{fmtTime(usedSec)} / {fmtTime(TOTAL_SEC)}</span></div>
            <div className="tbar">
              {TIMER_SECTIONS.map((s, i) => { const on = step >= i; return (<div key={s.id} className={`tseg ${on ? 'on' : ''}`} style={{ flex: s.sec, background: s.color }}>{s.label}<br />{s.sec}s</div>); })}
            </div>
          </div>
          <Zoomable><div className="split">
            <Col>
              {!done && <button className="btn" onClick={() => setStep(n => Math.min(n + 1, TIMER_SECTIONS.length - 1))} style={{ alignSelf: 'flex-start' }}>{step < 0 ? '▶ Repetitsiyani boshlash' : 'Keyingi bo\'lim →'}</button>}
              {step >= 0 && <div className="vibe-track">{TIMER_SECTIONS.map((s, i) => { const on = i <= step; return (<div key={s.id} className="vibe-row" style={{ opacity: on ? 1 : 0.32, transition: 'opacity 0.35s' }}><span className="vibe-dot" style={{ background: on ? s.color : T.ink3 }}>{i < step ? Ico.check(11) : i + 1}</span><span className="vibe-tag" style={{ color: on ? s.color : T.ink3 }}>{s.label} · {s.sec}s</span></div>); })}</div>}
            </Col>
            <Col>
              {cur ? (<div className="frame fade-step" key={step} style={{ borderLeft: `4px solid ${cur.color}`, padding: '15px 17px' }}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label} · {cur.sec}s</span><p className="body" style={{ margin: '12px 0 0', color: T.ink }}>{cur.say}</p></div>) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>«Boshla» bosing — bo'limlar vaqt byudjeti bo'ylab ochiladi.</p></div>}
              {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 daqiqa to'la! Har bo'limga aniq vaqt. Shu ritmda mashq qilsangiz — sahnada xotirjam bo'lasiz.</p></div>}
            </Col>
          </div></Zoomable>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Yaxshi IT-pitch qanaqa bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi IT-pitch <span className="italic" style={{ color: T.accent }}>qanaqa</span>?</h2></>}
    options={['Uzoq, hissiy va ko\'p sifatli', 'Tuzilgan (muammo→demo→arxitektura→metrika→so\'rov), metrikali, zich 3 daqiqa', 'Faqat slayd dizayni chiroyli', 'Imkon qadar ko\'p texnik atama']} correctIdx={1}
    explainCorrect="To'g'ri! Yaxshi IT-pitch: tuzilgan (muammo→demo→arxitektura→metrika→so'rov), har da'vo metrika bilan isbotlangan va 3 daqiqaga zich joylangan."
    explainWrong={{ 0: 'Uzoq/hissiy — IT-auditoriya dalil istaydi.', 2: 'Faqat dizayn — mazmun muhim.', 3: 'Ko\'p atama — chalkashtiradi. Aniqlik kerak.', default: 'Struktura + metrika + zich 3 daqiqa.' }} />
);

// ===== SCREEN 13 — NAMUNA (to'liq pitch) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SLIDES.map((_, i) => i)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= SLIDES.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active !== null ? SLIDES[active] : null;
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${SLIDES.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq namuna: <span className="italic" style={{ color: T.accent }}>mini-do'kon 3-daqiqa pitch</span></h2></div>
        <Mentor>Mini-do'kon tizimining to'liq pitchi. Har slaydni bosing — nima deyiladi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.accent, display: 'inline-flex' }}>{Ico.present(16)}</span><span className="cl-title">Pitch — mini-do'kon</span></div>
              {SLIDES.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.emoji} {c.label.toUpperCase()}</span>{c.q}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.emoji} {cur.label}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>{cur.content}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir slaydni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muammo → Demo → Arxitektura → Metrika → So'rov. Zich va dalil bilan. Endi o'zingiznikini yozing.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Pitch: <span className="italic" style={{ color: T.accent }}>struktura · demo · arxitektura · metrika · 3 daqiqa</span></h2></div>
      <Mentor>Yodda tuting: tuzilgan struktura, jonli demo, arxitektura slaydi, har da'voga metrika, hammasi 3 daqiqaga zich.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎤</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — taqdimotchi</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Maqtanma — ko'rsat va raqam bilan isbotla.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.present(18), c: T.grape, t: 'STRUKTURA — muammo→demo→arxitektura→metrika→so\'rov' }, { ic: Ico.layers(18), c: T.blue, t: 'ARXITEKTURA SLAYDI — real tizim dalili' }, { ic: Ico.chart(18), c: T.success, t: 'METRIKA = ISBOT — har da\'voga raqam' }, { ic: Ico.clock(18), c: T.accent, t: '3 DAQIQA — zich, repetitsiya qilingan' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: o'z pitch konturing =====
const PFIELDS = [
  { key: 'problem', label: 'Muammo', emoji: '🎯', color: T.accent, hint: 'Qaysi muammoni hal qildingiz?' },
  { key: 'demo', label: 'Demo + Arxitektura', emoji: '▶️', color: T.grape, hint: 'Nimani ko\'rsatasiz? Tizim qanday tuzilgan?' },
  { key: 'metrics', label: 'Metrika', emoji: '📊', color: T.success, hint: 'Qaysi raqamlar ishlashini isbotlaydi?' },
  { key: 'ask', label: 'So\'rov', emoji: '🤝', color: T.honey, hint: 'Auditoriyadan nima so\'raysiz?' }
];
const emptyPitch = () => ({ problem: '', demo: '', metrics: '', ask: '' });
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyPitch());
  const isComplete = (v) => v.trim().length >= 6;
  const completeCount = PFIELDS.filter(f => isComplete(data[f.key])).length;
  const passed = completeCount >= 3;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 13, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' };
  const rows = PFIELDS.filter(f => isComplete(data[f.key])).map(f => ({ emoji: f.emoji, label: f.label, color: f.color, text: data[f.key] }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>pitch konturingiz</span></h2></div>
        <Mentor>O'z tizimingiz uchun pitch yozing. Kamida 3 bo'limni to'ldiring — metrikani unutmang. O'ngda pitch deck yig'iladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {PFIELDS.map(f => { const ok = isComplete(data[f.key]); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ fontSize: 15 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning pitch deckingiz</p>
            {rows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — pitchingiz shu yerda yig'iladi…</p></div>
              : <DeckDoc rows={rows} title="Mening pitchim" />}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi shuni ovoz chiqarib, 3 daqiqaga sig'dirib repetitsiya qiling.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — KURS FINALI =====
const PM_PATH = [
  { n: '1', t: 'PRD — nima va nega' },
  { n: '2', t: 'Etika va mas\'uliyat' },
  { n: '3', t: 'Roadmap — prioritet' },
  { n: '4', t: 'Pitch — metrika bilan isbot' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Pitch strukturasi: muammo→demo→arxitektura→metrika→so\'rov', 'IT-auditoriya dalil istaydi — bo\'sh so\'z emas', 'Metrika = isbot; arxitektura sxemasi — kuchli slayd', 'Hammasi 3 daqiqaga zich, repetitsiya qilingan'];
  const GLOSSARY = [{ b: 'Pitch', t: '— mahsulotni qisqa, tuzilgan taqdim etish' }, { b: 'Metrika = isbot', t: '— da\'voni raqam bilan quvvatlash' }, { b: 'Arxitektura slaydi', t: '— tizim sxemasi (real tizim dalili)' }, { b: 'Demo Day', t: '— mahsulotni auditoriyaga taqdim kuni' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.cap(12)}</span> Kurs finali</span><h2 className="title h-title fade-up d1">Siz endi <span className="italic" style={{ color: T.accent }}>quryasiz va pitch qilasiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Metrikali pitchni o\'rgandingiz va butun kursni tamomladingiz. Endi siz tizim quradigan VA uni ishonchli taqdim etadigan direktorsiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring — keyin bu finalni yopasiz.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>PM yo'lingiz</div><ol className="pmpath">{PM_PATH.map((p, i) => (<li key={i} className="pm-row" style={{ animationDelay: `${0.35 + i * 0.06}s` }}><span className="pm-num">{p.n}</span><span className="pm-text">{p.t}</span></li>))}</ol></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🎓</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Kurs tamom — endi navbat sizniki</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Sizda endi bor: PRD yozish, mas'uliyatli qurish, roadmap rejalashtirish, metrikali pitch — va ishlaydigan tizim qurish ko'nikmasi. Boring va o'z mahsulotingizni quring.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson25({ lang: langProp, onFinished }) {
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

        /* === PITCH DECK DOC === */
        .deck-doc { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2); display: flex; flex-direction: column; gap: 9px; border-top: 4px solid ${T.accent}; }
        .deck-head { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.ink}; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; border-bottom: 1px solid ${T.ink3}33; }
        .deck-row { display: flex; gap: 9px; align-items: flex-start; animation: fade-step .3s; }
        .deck-num { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .deck-tag { font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .deck-val { font-family: 'Georgia, serif'; font-size: 12.5px; color: ${T.ink}; line-height: 1.45; margin: 2px 0 0; }

        /* === ARXITEKTURA MINI (s7) === */
        .arch-mini { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; background: ${CODE.bg}; border-radius: 14px; padding: 18px 14px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); }
        .am-col { display: flex; flex-direction: column; gap: 5px; }
        .am-node { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: #fff; background: #ffffff14; border-radius: 8px; padding: 7px 10px; white-space: nowrap; text-align: center; }
        .am-core { background: ${T.success}; box-shadow: 0 0 14px -3px ${T.success}99; }
        .am-arrow { color: #9FB4D8; font-size: 16px; }

        /* === TIME BUDGET BAR (s11) === */
        .tbar { display: flex; gap: 3px; border-radius: 9px; overflow: hidden; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.2); }
        .tseg { padding: 9px 4px; text-align: center; font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: #fff; line-height: 1.35; opacity: 0.28; transition: opacity 0.35s; min-width: 0; }
        .tseg.on { opacity: 1; }

        /* === VIBE TRACK === */
        .vibe-track { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }
        .vibe-row { display: flex; align-items: center; gap: 11px; padding: 5px 0; }
        .vibe-dot { width: 24px; height: 24px; min-width: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; transition: background 0.3s; }
        .vibe-tag { font-family: 'Manrope'; font-weight: 700; font-size: 12px; letter-spacing: 0.03em; transition: color 0.3s; }

        /* === DET-OPT === */
        .det-opt { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 11px; padding: 12px 14px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Georgia, serif'; font-size: 13.5px; color: ${T.ink}; }
        .det-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -8px rgba(${T.shadowBase},0.22); }
        .det-box { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.6px ${T.ink3}; color: #fff; }

        /* === PLINK === */
        .plink { display: flex; align-items: center; gap: 9px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .plink:hover { transform: translateY(-1px); }
        .plink-on { background: ${T.grapeSoft}; box-shadow: inset 0 0 0 1.5px ${T.grape}; }
        .plink-label { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .plink-act { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.grape}; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }

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

        /* === ROADMAP STEP === */
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
        .pmpath { display: flex; flex-direction: column; gap: 6px; list-style: none; } .pm-row { display: flex; align-items: center; gap: 11px; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .pm-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; color: #fff; background: ${T.accent}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; } .pm-text { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; }
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
