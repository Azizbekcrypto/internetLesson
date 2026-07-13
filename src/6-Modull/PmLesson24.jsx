import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 09 · PM3 — ROADMAP: MAHSULOT REJALASHTIRISH — v16 (AUDIOSIZ)
// G'oya: roadmap qanday quriladi; horizontlar (Hozir/3oy/6oy); RICE bilan prioritet (Reach x Impact x Confidence / Effort).
// Mahsulot: o'quvchi o'z tizimi (mini-do'kon) uchun 3-oylik roadmap yozadi.
// Joylashuv: P2 (mobil ilova) dan keyin, P3 dan oldin. Davomiy misol: mini-do'kon keyingi funksiyalari.
// Falsafa: SIZ — DIREKTOR. Hammasini birvarakay qurib bo'lmaydi — prioritet qil, ketma-ket joyla.
// Signature 1: RICE skorlovchi (R/I/C/E -> skor -> saralash). Signature 2: roadmap horizontlar doskasi.
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
  map: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>),
  cal: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>),
  scope: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" /></svg>)
};

const LESSON_META = { lessonId: 'pm-roadmap-24-v16', lessonTitle: { uz: 'Roadmap — mahsulot rejalashtirish', ru: 'Roadmap: планирование продукта' } };
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
// Horizontlar (s3)
const HORIZONS = [
  { id: 'now', label: 'Hozir', emoji: '🎯', color: T.accent, when: 'Shu oy — qurilayotgan ish', detail: 'Aniq, majburiy, tafsilotli. Hozir bajaramiz.' },
  { id: '3mo', label: '3 oy', emoji: '📅', color: T.honey, when: 'Keyingi — ehtimoliy reja', detail: 'Yo\'nalish ma\'lum, lekin tafsilot o\'zgarishi mumkin.' },
  { id: '6mo', label: '6 oy', emoji: '🔭', color: T.blue, when: 'Uzoq — g\'oyalar', detail: 'Mavhum, faqat yo\'nalish. Va\'da emas.' }
];

// RICE nomzod funksiyalar (s6)
const RICE_FEATURES = [
  { id: 'push', label: 'Push-bildirishnoma', emoji: '🔔', R: 8, I: 2, C: 0.9, E: 1 },
  { id: 'pay', label: 'To\'lov tizimi', emoji: '💳', R: 9, I: 3, C: 0.8, E: 4 },
  { id: 'search', label: 'Mahsulot izlash', emoji: '🔍', R: 6, I: 1.5, C: 0.9, E: 2 },
  { id: 'dark', label: 'Tungi rejim', emoji: '🌙', R: 3, I: 0.5, C: 1, E: 1 }
];
const riceScore = (f) => (f.R * f.I * f.C) / f.E;
const riceFmt = (f) => (Math.round(riceScore(f) * 10) / 10).toFixed(1);

// Roadmap doskasi (s8)
const ROAD_FEATURES = [
  { id: 'push', label: 'Push-bildirishnoma', emoji: '🔔', rec: 'now' },
  { id: 'search', label: 'Mahsulot izlash', emoji: '🔍', rec: 'now' },
  { id: 'pay', label: 'To\'lov tizimi', emoji: '💳', rec: '3mo' },
  { id: 'dark', label: 'Tungi rejim', emoji: '🌙', rec: '6mo' }
];
const HCOLS = [
  { id: 'now', label: 'Hozir', color: T.accent },
  { id: '3mo', label: '3 oy', color: T.honey },
  { id: '6mo', label: '6 oy', color: T.blue }
];

// Namuna roadmap (s13)
const CASE_HORIZONS = [
  { id: 'now', label: 'Hozir', emoji: '🎯', color: T.accent, items: ['🔔 Push-bildirishnoma', '🔍 Mahsulot izlash'], why: 'Yuqori RICE, kichik effort — tez qiymat beradi (quick wins).' },
  { id: '3mo', label: '3 oy', emoji: '📅', color: T.honey, items: ['💳 To\'lov tizimi', '🧾 Buyurtma tarixi'], why: 'Muhim, lekin kattaroq ish — keyingi bosqich.' },
  { id: '6mo', label: '6 oy', emoji: '🔭', color: T.blue, items: ['🌙 Tungi rejim', '🎁 Sodiqlik dasturi'], why: 'G\'oyalar — yo\'nalish, hali aniq emas.' }
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
    { id: 'a', label: 'Hammasini birvarakay qurishni boshlash' },
    { id: 'b', label: 'Prioritet qilib, vaqt bo\'yicha ketma-ket rejalashtirish (roadmap)' },
    { id: 'c', label: 'Eng yoqqanidan boshlash' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Tizim ishlayapti, <span className="italic" style={{ color: T.accent }}>20 ta g'oya</span> bor, vaqt esa kam. Nima qilasiz?</h1>
        <Mentor>Hamma g'oyani birdan qurib bo'lmaydi. Direktor — nimadan boshlashni va qachon qilishni rejalashtiradi. Tanlang.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)' }}>
              <p className="flow-label" style={{ marginBottom: 10 }}>Mini-do'kon g'oyalari</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['🔔 Push', '💳 To\'lov', '🔍 Izlash', '🌙 Tungi rejim', '🎁 Sodiqlik', '🧾 Tarix', '⭐ Reyting', '🚚 Yetkazish'].map((x, i) => (
                  <span key={i} className="idea-tag" style={{ animationDelay: `${0.12 + i * 0.05}s` }}>{x}</span>
                ))}
              </div>
              <p className="body" style={{ margin: '12px 0 0', color: T.ink2 }}>Hammasi yaxshi g'oya — lekin qaysi biri avval, qaysi keyin?</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi yo'l to'g'ri?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri — <b>roadmap</b>. Bugun: roadmap qanday quriladi, <b>horizontlar</b> (Hozir/3oy/6oy) va <b>RICE</b> bilan prioritet. So'ng o'z 3-oylik roadmapingizni yozasiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Roadmap nima — nima va qachon rejasi', tag: '' },
    { text: 'Horizontlar: Hozir / 3 oy / 6 oy', tag: '' },
    { text: 'RICE bilan prioritet (skor bilan saralash)', tag: 'jonli' },
    { text: 'Funksiyalarni horizontlarga joylash', tag: 'jonli' },
    { text: 'O\'z 3-oylik roadmapingizni yozasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.map(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>3-oylik roadmap</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Prioritet qil, horizontlarga joyla, yo'nalishni ko'rsat.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Siz direktor — nimadan boshlashni siz hal qilasiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Roadmap bilan kelajakni rejalashtiramiz</span></h2></div>
        <Mentor>Ko'p g'oya — kam vaqt. Yechim: <b style={{ color: T.ink }}>prioritet va horizontlar</b>. Bugun shuni o'rganamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — ROADMAP NIMA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('chaos');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['chaos', 'plan']) : new Set(['chaos']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isChaos = v === 'chaos';
  return (
    <Stage eyebrow="Roadmap nima" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Roadmap — <span className="italic" style={{ color: T.accent }}>nima va qachon</span> rejasi</h2></div>
        <Mentor>Roadmap nima va qachon qurilishini ko'rsatadi. U bo'lmasa nima bo'ladi? Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isChaos ? 'chip-on' : ''}`} onClick={() => set('chaos')}>🌀 Rejasiz</button>
              <button className={`chip ${!isChaos ? 'chip-on' : ''}`} onClick={() => set('plan')}>🗺️ Roadmap bilan</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isChaos ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isChaos
                ? 'Har kuni boshqa narsa quriladi: bugun push, ertaga rang, indinga izlash... hech narsa tugamaydi, yo\'nalish yo\'q.'
                : 'Roadmap: nima, qaysi tartibda, qachon. Hamma yo\'nalishni biladi — ketma-ket, fokus bilan ishlaymiz.'}</p>
            </div>
          </Col>
          <Col>
            {isChaos
              ? <div className="frame-warn fade-step" key="c"><p className="body" style={{ margin: 0, color: T.ink }}>Rejasiz ish — tarqoq. Ko'p boshlanadi, kam tugaydi.</p></div>
              : <div className="frame-success fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>Roadmap yo'nalish beradi. U qat'iy va'da emas — moslashuvchan reja.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Roadmap = prioritetlangan yo'nalish. Endi vaqtni horizontlarga bo'lamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — HORIZONTLAR =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(HORIZONS.map(h => h.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= HORIZONS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? HORIZONS.find(h => h.id === active) : null;
  return (
    <Stage eyebrow="Horizontlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${HORIZONS.length} horizontni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Uchta horizont: <span className="italic" style={{ color: T.accent }}>Hozir · 3 oy · 6 oy</span></h2></div>
        <Mentor>Roadmap vaqtni 3 horizontga bo'ladi. Masofa uzoqlashgan sari ishonch kamayadi. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HORIZONS.map(c => (<button key={c.id} onClick={() => tap(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === c.id ? `inset 0 0 0 2px ${c.color}, 0 8px 20px -8px ${c.color}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 20 }}>{c.emoji}</span><span style={{ flex: 1 }}><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink }}>{c.label}</span><span className="small" style={{ color: c.color, marginLeft: 7 }}>{c.when}</span></span>{seen.has(c.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.detail}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir horizontni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaqin = aniq va majburiy. Uzoq = mavhum va moslashuvchan. Buni unutmang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Roadmap nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Roadmap <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Har bir funksiyaning kodi', 'Nimani qaysi tartibda va qachon qurish rejasi (yo\'nalish, qat\'iy kafolat emas)', 'Faqat dizayn fayli', 'Mijozlar ro\'yxati']} correctIdx={1}
    explainCorrect="To'g'ri! Roadmap — nimani qaysi tartibda va qachon qurish rejasi. U horizontlarga bo'linadi va yo'nalish ko'rsatadi; qat'iy o'zgarmas kafolat emas."
    explainWrong={{ 0: 'Kod emas — bu yuqori darajadagi reja.', 2: 'Dizayn emas — nima/qachon rejasi.', 3: 'Mijozlar ro\'yxati emas.', default: 'Roadmap = prioritetlangan nima/qachon rejasi.' }} />
);

// ===== SCREEN 5 — PRIORITET KERAK (RICE intro) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('gut');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['gut', 'rice']) : new Set(['gut']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isGut = v === 'gut';
  return (
    <Stage eyebrow="Prioritet kerak" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Prioritet: his emas, <span className="italic" style={{ color: T.accent }}>RICE bilan son</span></h2></div>
        <Mentor>Nimadan boshlashni qanday tanlaymiz? His bilanmi yoki son bilanmi? Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isGut ? 'chip-on' : ''}`} onClick={() => set('gut')}>🎲 His bilan</button>
              <button className={`chip ${!isGut ? 'chip-on' : ''}`} onClick={() => set('rice')}>🧮 RICE bilan</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isGut ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isGut
                ? '«Menga tungi rejim yoqadi, avval shuni qilaylik!» — eng ovozli yoki eng yoqqan g\'oya g\'alaba qiladi. Ko\'pincha noto\'g\'ri.'
                : 'Har funksiyani RICE bilan baholaymiz va saralaymiz. Son qaror chiqaradi — adolatli va aniq.'}</p>
            </div>
          </Col>
          <Col>
            {isGut
              ? <div className="frame-warn fade-step" key="g"><p className="body" style={{ margin: 0, color: T.ink }}>His bilan tanlash — sub'yektiv. Ko'p qiymatli ish nazardan chetda qoladi.</p></div>
              : <div className="frame-success fade-step" key="r"><p className="note-h" style={{ color: T.success }}>RICE = (Reach × Impact × Confidence) ÷ Effort</p><p className="body" style={{ margin: 0, color: T.ink }}>Reach (qancha foydalanuvchi) · Impact (qancha foyda) · Confidence (ishonch) · Effort (mehnat).</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>RICE skori = (R × I × C) ÷ E. Baland skor — avval qilamiz. Keyin hisoblab ko'ramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Funksiyalarni qanday prioritet qilamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Funksiyalarni qanday <span className="italic" style={{ color: T.accent }}>prioritet</span> qilamiz?</h2></>}
    options={['Eng baland ovozli yoki eng yoqqanidan', 'Obyektiv skor bilan — RICE: (Reach × Impact × Confidence) ÷ Effort', 'Alifbo tartibida', 'Tasodifan']} correctIdx={1}
    explainCorrect="To'g'ri! RICE obyektiv skor beradi: (Reach × Impact × Confidence) ÷ Effort. Baland skorli funksiya avval qilinadi — his yoki ovoz emas, son hal qiladi."
    explainWrong={{ 0: 'Ovoz/yoqish — sub\'yektiv, noto\'g\'ri prioritet.', 2: 'Alifbo — qiymatga aloqasi yo\'q.', 3: 'Tasodif — reja emas.', default: 'RICE skori bilan obyektiv prioritet.' }} />
);

// ===== SCREEN 6 — RICE SKORLOVCHI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [sorted, setSorted] = useState(!!storedAnswer);
  const workRef = useRef(null);
  const done = sorted;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const list = sorted ? [...RICE_FEATURES].sort((a, b) => riceScore(b) - riceScore(a)) : RICE_FEATURES;
  const cur = active ? RICE_FEATURES.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="RICE skorlovchi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Saralab ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">RICE skori bilan <span className="italic" style={{ color: T.accent }}>saralaymiz</span></h2></div>
        <Mentor>Har funksiyani bosing — R/I/C/E va skorini ko'ring. Keyin «Saralash» bosing: qaysi avval ekanini son ko'rsatadi!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {list.map((f, idx) => { const top = sorted && idx === 0; return (
                <button key={f.id} onClick={() => setActive(f.id)} className={`rice-card ${active === f.id ? 'rc-active' : ''} ${top ? 'rc-top' : ''}`}>
                  {sorted && <span className="rank-num">{idx + 1}</span>}
                  <span style={{ fontSize: 18 }}>{f.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="rice-name">{f.label}</span></span>
                  {sorted
                    ? <span className="score-pill" style={{ background: top ? T.success : T.grape }}>{riceFmt(f)}</span>
                    : <span className="rice-metrics"><span className="rice-badge">R{f.R}</span><span className="rice-badge">I{f.I}</span><span className="rice-badge">E{f.E}</span></span>}
                </button>
              ); })}
            </div>
            {!sorted && <button className="btn" onClick={() => setSorted(true)} style={{ alignSelf: 'flex-start' }}>🧮 Saralash (RICE)</button>}
          </Col>
          <Col>
            {cur && !sorted && (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 18 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: T.grape, background: T.grapeSoft }}>{cur.label}</span></span><div style={{ display: 'flex', gap: 6, margin: '12px 0 8px', flexWrap: 'wrap' }}><span className="rice-badge">Reach {cur.R}</span><span className="rice-badge">Impact {cur.I}</span><span className="rice-badge">Confidence {cur.C}</span><span className="rice-badge">Effort {cur.E}</span></div><div className="codepill">({cur.R} × {cur.I} × {cur.C}) ÷ {cur.E} = <b style={{ color: '#fff' }}>{riceFmt(cur)}</b></div></div>)}
            {!cur && !sorted && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Funksiyani bosing — uning Reach/Impact/Confidence/Effort va RICE skorini ko'rasiz.</p></div>}
            {sorted && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>Son hal qildi 🧮</p><p className="body" style={{ margin: 0, color: T.ink }}>Eng baland — <b>Push (14.4)</b>: kichik effort, katta ta'sir (quick win). Eng past — <b>Tungi rejim (1.5)</b>: qiziq, lekin kam qiymat. His emas, RICE saraladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — QUICK WINS =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('big');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['big', 'quick']) : new Set(['big']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isBig = v === 'big';
  return (
    <Stage eyebrow="Quick wins" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Effort muhim: <span className="italic" style={{ color: T.accent }}>quick win'lar oldin</span></h2></div>
        <Mentor>RICE'da Effort pastda — skor balandda. Kichik mehnatli, yaxshi ta'sirli ish avval bo'ladi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isBig ? 'chip-on' : ''}`} onClick={() => set('big')}>🏔️ Ulkan ish</button>
              <button className={`chip ${!isBig ? 'chip-on' : ''}`} onClick={() => set('quick')}>⚡ Quick win</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isBig ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isBig
                ? 'To\'lov tizimi — zo\'r, lekin 4 oy ketadi (ulkan effort). RICE skori pasayadi — birinchi emas.'
                : 'Push-bildirishnoma — 1 hafta, yaxshi ta\'sir. Kichik effort, baland skor — avval shu.'}</p>
            </div>
          </Col>
          <Col>
            {isBig
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Katta ish ham kerak — lekin u ko'p vaqt oladi. Hammasini boshida qilmang.</p></div>
              : <div className="frame-success fade-step" key="q"><p className="body" style={{ margin: 0, color: T.ink }}>Quick win — tez qiymat va tezroq fidbek. Kichik g'alabalar ishonch beradi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Avval quick win'lar (kichik effort, yaxshi ta'sir), keyin katta ishlar. Effort qancha katta bo'lsa, skor shuncha kichik bo'ladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — ROADMAP HORIZONTLAR DOSKASI (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => storedAnswer ? Object.fromEntries(ROAD_FEATURES.map(f => [f.id, f.rec])) : {});
  const [selected, setSelected] = useState(null);
  const workRef = useRef(null);
  const placedCount = Object.keys(placed).length;
  const done = placedCount >= ROAD_FEATURES.length;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const pool = ROAD_FEATURES.filter(f => !placed[f.id]);
  const place = (colId) => { if (!selected) return; setPlaced(prev => ({ ...prev, [selected]: colId })); setSelected(null); };
  return (
    <Stage eyebrow="Roadmap doskasi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Joylang (${placedCount}/${ROAD_FEATURES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiyalarni <span className="italic" style={{ color: T.accent }}>horizontlarga joylang</span></h2></div>
        <Mentor>Funksiyani tanlang, keyin ustunni bosing. Yuqori RICE — «Hozir»ga, kattaroq ish — «3 oy», g'oyalar — «6 oy». Hammasini joylang!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pool.length > 0 && (
            <div className="road-pool">
              <span className="flow-label" style={{ marginRight: 4 }}>Tanlang:</span>
              {pool.map(f => (<button key={f.id} className={`pool-item ${selected === f.id ? 'sel' : ''}`} onClick={() => setSelected(f.id)}><span style={{ fontSize: 14 }}>{f.emoji}</span>{f.label}</button>))}
            </div>
          )}
          <div className="road-board">
            {HCOLS.map(col => {
              const items = ROAD_FEATURES.filter(f => placed[f.id] === col.id);
              return (
                <button key={col.id} className={`road-col ${selected ? 'rc-target' : ''}`} onClick={() => place(col.id)} disabled={!selected}>
                  <span className="road-col-head" style={{ color: col.color, background: col.color + '1c' }}>{col.label}</span>
                  {items.map(f => (<span key={f.id} className="road-item"><span style={{ fontSize: 13 }}>{f.emoji}</span>{f.label}</span>))}
                  {items.length === 0 && <span className="road-empty">{selected ? 'shu yerga bosing' : '—'}</span>}
                </button>
              );
            })}
          </div>
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana roadmap — funksiyalar horizontlarga taqsimlandi. Yaqin horizont to'la va aniq, uzoq — yengil. Bu sizning yo'l xaritangiz.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="RICE bo'yicha qaysi funksiya avval qilinadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>RICE bo'yicha qaysi <span className="italic" style={{ color: T.accent }}>avval</span>?</h2></>}
    options={['Eng yaltiroq yoki eng yangi funksiya', 'Eng baland (R × I × C) ÷ E skorli — odatda kichik effort, katta ta\'sir', 'Eng katta va murakkab funksiya', 'Egasiga eng yoqqani']} correctIdx={1}
    explainCorrect="To'g'ri! Eng baland RICE skorli funksiya avval qilinadi: (R × I × C) ÷ Effort. Odatda bu — kichik effort, katta ta'sirli quick win, eng yaltiroq emas."
    explainWrong={{ 0: 'Yaltiroqlik — RICE o\'lchamaydi. Skor muhim.', 2: 'Katta/murakkab — effort baland, skor pastrak.', 3: 'Yoqish — sub\'yektiv, RICE emas.', default: 'Eng baland (R×I×C)/E skorli.' }} />
);

// ===== SCREEN 10 — ROADMAP O'ZGARADI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('fixed');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['fixed', 'living']) : new Set(['fixed']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isFixed = v === 'fixed';
  return (
    <Stage eyebrow="Roadmap o'zgaradi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Roadmap — <span className="italic" style={{ color: T.accent }}>tirik hujjat</span></h2></div>
        <Mentor>Roadmap toshga o'yilgan emas. Yangi ma'lumot kelsa o'zgaradi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isFixed ? 'chip-on' : ''}`} onClick={() => set('fixed')}>🗿 Qat'iy</button>
              <button className={`chip ${!isFixed ? 'chip-on' : ''}`} onClick={() => set('living')}>🌱 Tirik</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isFixed ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isFixed
                ? '«Roadmap yozildi — 6 oy o\'zgarmaydi.» — bozor, fidbek, raqobat o\'zgaradi, reja eskiradi va noto\'g\'ri bo\'lib qoladi.'
                : 'Roadmap tirik hujjat — har oy yangi fidbek va raqamlar bilan qayta ko\'rib chiqasiz, prioritetni yangilaysiz.'}</p>
            </div>
          </Col>
          <Col>
            {isFixed
              ? <div className="frame-warn fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>Qat'iy roadmap — eskirgan reja. Foydalanuvchi o'zgarsa, siz o'zgarmasangiz — yutqazasiz.</p></div>
              : <div className="frame-success fade-step" key="l"><p className="body" style={{ margin: 0, color: T.ink }}>Tirik roadmap — haqiqatga moslashadi. Yo'nalish bor, lekin qotib qolmagan.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uzoqdagi horizontni va'da deb olmang. Roadmap — yo'nalish, har oy yangilanadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — FOKUS =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('over');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['over', 'focus']) : new Set(['over']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isOver = v === 'over';
  return (
    <Stage eyebrow="Fokus" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Hozir» ustuni — <span className="italic" style={{ color: T.accent }}>kam va fokuslangan</span></h2></div>
        <Mentor>«Hozir»ga nechta ish qo'yamiz? Ko'pmi yoki ozmi? Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isOver ? 'chip-on' : ''}`} onClick={() => set('over')}>📚 10 ta birga</button>
              <button className={`chip ${!isOver ? 'chip-on' : ''}`} onClick={() => set('focus')}>🎯 2-3 ta</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isOver ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isOver
                ? '«Hozir»ga 10 ta funksiya — hammasi yarim qoladi, hech biri tugamaydi, jamoa charchaydi.'
                : '«Hozir»da 2-3 ta — tugatib, ishga tushirib, keyingisiga o\'tasiz. Tugagan ish — qiymat.'}</p>
            </div>
          </Col>
          <Col>
            {isOver
              ? <div className="frame-warn fade-step" key="o"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'p ish birga = tarqoq diqqat. Hech narsa tugamaydi.</p></div>
              : <div className="frame-success fade-step" key="fo"><p className="body" style={{ margin: 0, color: T.ink }}>Kam, lekin tugatilgan ish — haqiqiy qiymat. Fokus tezlik beradi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>«Hozir» qisqa bo'lsin. Tugating, keyin keyingisini «Hozir»ga ko'taring.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Yaxshi roadmap qanaqa bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi roadmap <span className="italic" style={{ color: T.accent }}>qanaqa</span>?</h2></>}
    options={['«Hozir»ga 20 ta ish, hammasi qat\'iy va o\'zgarmas', 'Prioritetlangan (RICE), horizontli, fokuslangan «Hozir», moslashuvchan uzoq', 'Faqat 6 oylik aniq tafsilotlar', 'Tasodifiy tartibda']} correctIdx={1}
    explainCorrect="To'g'ri! Yaxshi roadmap: RICE bilan prioritetlangan, horizontlarga (Hozir/3oy/6oy) bo'lingan, «Hozir» fokuslangan (kam ish), uzoq horizont moslashuvchan."
    explainWrong={{ 0: '20 ta qat\'iy ish — fokus yo\'q, moslashmaydi.', 2: '6 oyni aniq rejalashtirib bo\'lmaydi — uzoq mavhum.', 3: 'Tasodif — reja emas.', default: 'Prioritet + horizont + fokus + moslashuvchanlik.' }} />
);

// ===== SCREEN 13 — NAMUNA (to'liq roadmap) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CASE_HORIZONS.map((_, i) => i)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= CASE_HORIZONS.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active !== null ? CASE_HORIZONS[active] : null;
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${CASE_HORIZONS.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq namuna: <span className="italic" style={{ color: T.accent }}>mini-do'kon 3-oylik roadmap</span></h2></div>
        <Mentor>Mini-do'konning to'liq roadmapi. Har horizontni bosing — qaysi ishlar va nega shu yerda.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.accent, display: 'inline-flex' }}>{Ico.map(16)}</span><span className="cl-title">Roadmap — mini-do'kon</span></div>
              {CASE_HORIZONS.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.emoji} {c.label.toUpperCase()}</span>{c.items.join(' · ')}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.emoji} {cur.label}</span></span><div style={{ display: 'flex', flexDirection: 'column', gap: 5, margin: '12px 0 0' }}>{cur.items.map((it, j) => <span key={j} style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{it}</span>)}</div><p className="body" style={{ color: T.ink2, margin: '10px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir horizontni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hozir to'la va aniq, uzoq yengil. Endi o'zingiznikini yozing.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Roadmap: <span className="italic" style={{ color: T.accent }}>prioritet · horizont · fokus · yangila</span></h2></div>
      <Mentor>Yodda tuting: RICE bilan prioritet qil, horizontlarga joyla, «Hozir»ni fokusla, har oy yangila.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🗺️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — yo'l boshlovchi</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Nimadan boshlash va qachon — sizning qaroringiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.scope(18), c: T.grape, t: 'PRIORITET — RICE: (R×I×C)÷E' }, { ic: Ico.layers(18), c: T.accent, t: 'HORIZONTLAR — Hozir / 3 oy / 6 oy' }, { ic: Ico.target(18), c: T.honey, t: 'FOKUS — «Hozir»da kam ish' }, { ic: Ico.cal(18), c: T.success, t: 'YANGILA — roadmap tirik, har oy qayta ko\'r' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: o'z 3-oylik roadmaping =====
const RFIELDS = [
  { key: 'now', label: 'Hozir', emoji: '🎯', color: T.accent, hint: 'Shu oy nimani qurasiz? (1-2 ta quick win)' },
  { key: '3mo', label: '3 oy', emoji: '📅', color: T.honey, hint: 'Keyingi 3 oyda nima? (kattaroq ish)' },
  { key: '6mo', label: '6 oy', emoji: '🔭', color: T.blue, hint: '6 oyga g\'oyalar? (yo\'nalish)' }
];
const emptyRoad = () => ({ now: '', '3mo': '', '6mo': '' });
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyRoad());
  const isComplete = (v) => v.trim().length >= 6;
  const completeCount = RFIELDS.filter(f => isComplete(data[f.key])).length;
  const passed = completeCount >= 2;
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
  const filled = RFIELDS.filter(f => isComplete(data[f.key]));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>3-oylik roadmapingiz</span></h2></div>
        <Mentor>O'z tizimingiz uchun: Hozir / 3 oy / 6 oy — nimani qurasiz? Kamida 2 horizontni to'ldiring (yaqinini fokuslang).</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {RFIELDS.map(f => { const ok = isComplete(data[f.key]); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ fontSize: 15 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning roadmapingiz</p>
            {filled.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — roadmapingiz shu yerda yig'iladi…</p></div>
              : <div className="reg-doc feat-pop"><div className="reg-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.map(16)}</span><span>Mening roadmapim</span></div>{filled.map((f, j) => (<div key={j} className="road-line"><span className="reg-tag" style={{ color: f.color, background: f.color + '1c' }}>{f.emoji} {f.label}</span><span style={{ fontFamily: G, fontSize: 13, color: T.ink }}>{data[f.key]}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Sizning yo'l xaritangiz. Har oy qayta ko'rib, yangilab boring.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Roadmap — prioritetlangan nima/qachon rejasi (yo\'nalish)', 'Horizontlar: Hozir (aniq) / 3 oy / 6 oy (mavhum)', 'RICE bilan prioritet: (Reach×Impact×Confidence)÷Effort', 'Fokuslangan «Hozir»; roadmap tirik — har oy yangila'];
  const HOMEWORK = [{ b: 'Tizimingiz uchun roadmap yozing', t: '— Hozir / 3 oy / 6 oy' }, { b: 'Funksiyalarni RICE bilan saralang', t: '— skor bilan prioritet' }, { b: '«Hozir»ni fokuslang', t: '— 2-3 ta quick win' }];
  const GLOSSARY = [{ b: 'Roadmap', t: '— nima/qachon prioritetlangan reja' }, { b: 'Horizont', t: '— vaqt oralig\'i (Hozir/3oy/6oy)' }, { b: 'RICE', t: '— (Reach×Impact×Confidence)÷Effort prioritet skori' }, { b: 'Quick win', t: '— kichik effort, yaxshi ta\'sirli ish' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>roadmap quryasiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Roadmap, horizontlar va RICE bilan prioritetni o\'rgandingiz. Endi nimadan boshlashni son bilan hal qilasiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Roadmap ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Prioritet, horizont, fokus, yangila! 🗺️</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🧩</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi: To'liq tizim (capstone)</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Reja tayyor. Endi hamma qismni bitta tizimga yig'ib, end-to-end sinab ishga tushiramiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson24({ lang: langProp, onFinished }) {
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

        /* === IDEA TAG (s0) === */
        .idea-tag { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; background: ${T.bg}; border-radius: 99px; padding: 6px 12px; box-shadow: 0 4px 12px -7px rgba(${T.shadowBase},0.2); animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }

        /* === RICE CARD (s6) === */
        .rice-card { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 12px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.25s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .rice-card:hover { transform: translateY(-1px); }
        .rc-active { box-shadow: inset 0 0 0 1.5px ${T.grape}, 0 6px 16px -8px rgba(123,63,228,0.25); }
        .rc-top { box-shadow: inset 0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(31,122,77,0.3); }
        .rice-name { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .rice-metrics { display: flex; gap: 4px; }
        .rice-badge { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; padding: 3px 6px; border-radius: 5px; background: ${T.bg}; color: ${T.ink2}; white-space: nowrap; }
        .score-pill { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 13.5px; color: #fff; border-radius: 8px; padding: 4px 9px; min-width: 46px; text-align: center; animation: feat-pop .35s; }
        .rank-num { font-family: 'Fraunces', serif; font-size: 18px; color: ${T.accent}; min-width: 18px; text-align: center; }
        .codepill { font-family: 'JetBrains Mono'; font-size: 12px; line-height: 1.5; color: ${CODE.str}; background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; word-break: break-word; }

        /* === ROADMAP DOSKASI (s8) === */
        .road-pool { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
        .pool-item { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 600; font-size: 12px; border: none; border-radius: 99px; padding: 8px 13px; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .pool-item:hover { transform: translateY(-1px); }
        .pool-item.sel { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .road-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .road-col { display: flex; flex-direction: column; gap: 6px; border: none; background: ${T.bg}; border-radius: 12px; padding: 9px; min-height: 130px; cursor: default; transition: all 0.2s; align-items: stretch; }
        .road-col.rc-target { cursor: pointer; box-shadow: inset 0 0 0 2px ${T.accent}55; }
        .road-col.rc-target:hover { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .road-col-head { font-family: 'Manrope'; font-weight: 800; font-size: 11px; text-align: center; padding: 5px; border-radius: 7px; }
        .road-item { display: flex; align-items: center; gap: 6px; background: ${T.paper}; border-radius: 8px; padding: 7px 8px; font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.ink}; box-shadow: 0 3px 9px -6px rgba(${T.shadowBase},0.3); animation: feat-pop .3s; text-align: left; }
        .road-empty { font-family: 'Manrope'; font-size: 10px; color: ${T.ink3}; text-align: center; margin-top: auto; margin-bottom: auto; font-style: italic; }
        .road-line { display: flex; flex-direction: column; gap: 4px; padding: 8px; background: ${T.bg}; border-radius: 9px; animation: fade-step .3s; }

        /* === RISK/ROADMAP DOC === */
        .reg-doc { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2); display: flex; flex-direction: column; gap: 9px; border-top: 4px solid ${T.accent}; }
        .reg-head { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.ink}; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; border-bottom: 1px solid ${T.ink3}33; }
        .reg-tag { align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 10px; padding: 3px 8px; border-radius: 5px; }

        /* === DET-OPT === */
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
