import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 15-DARS (Modul 05 · Nest arxitektura · PM) — MASSHTABLANUVCHANLIK = MAHSULOT QARORI — PLATFORM STANDARD v16
// G'oya: bugungi arxitektura qarori 6 oydan keyingi fycha-chiqarish TEZLIGINI belgilaydi.
//        Texnik qarz = MAHSULOT RISKI. Yaxshi arxitektura bilan qaysi fychalar osonlashadi.
// Joylashuv: NestArchAlive (skelet ko'rdik) va NestArchResource (Car 5 fayl yozamiz) ORASIDA — "nega shuncha fayl?"ga javob.
// Mahsulot: avtosalon admin (Car) — 4a moduli mavzusiga uyg'un.
// Metafora: Texnik qarz = kredit (bugun tez, ertaga foiz).
// Signature 1: "6 oy poygasi" grafigi (tez-iflos vs tartibli jamoa tezligi). Signature 2: feature ↔ nega oson (moslash).
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
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  up: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2}><path d="M3 17l6-6 4 4 8-8" /><path d="M16 7h5v5" /></svg>),
  down: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2}><path d="M3 7l6 6 4-4 8 8" /><path d="M16 17h5v-5" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>),
  card: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>),
  rocket: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 13l5.5-5.5a5 5 0 0 1 4-1.5 5 5 0 0 1-1.5 4L11 15M9 13l-3-1 1.5-1.5a3 3 0 0 1 2.6-.8M11 15l1 3 1.5-1.5a3 3 0 0 0 .8-2.6" /></svg>),
  car: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 13l2.2-5.2a2 2 0 0 1 1.8-1.2h10a2 2 0 0 1 1.8 1.2L21 13v4H3v-4z" /><path d="M3 13h18" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /></svg>)
};

const LESSON_META = { lessonId: 'pm-scalability-15-v16', lessonTitle: { uz: 'Masshtablanuvchanlik = mahsulot qarori', ru: 'Масштабируемость = продуктовое решение' } };
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
// Texnik qarz = kredit (s2)
const CREDIT = ['Bugun tez pul olasiz', ' Keyin foiz bilan to\'laysiz', 'Cho\'zilsa — qarz o\'sib ketadi'];
const TECHDEBT = ['Bugun tez fycha chiqarasiz', 'Keyin har o\'zgarish qiyinlashadi', 'Cho\'zilsa — kod botqoqqa aylanadi'];

// Avtosalon o'sadi — kelajak fychalar (s3)
const GROW = [
  { id: 'mijoz', label: 'Mijozlar jadvali', emoji: '🧑', why: 'Qatlamli bo\'lsa: Car kabi 5 fayl naqshini takrorlaysiz — 1 soat. Iflos bo\'lsa: hamma joyni titkilaysiz.' },
  { id: 'auth', label: 'Sotuvchi / admin rollari', emoji: '🔑', why: 'Qatlamli: bitta Guard hamma joyga. Iflos: har endpointga qo\'lda tekshiruv yozasiz.' },
  { id: 'search', label: 'Narx bo\'yicha qidiruv', emoji: '🔍', why: 'Qatlamli: Service\'ga bitta metod. Iflos: controller ichida chalkashlik.' },
  { id: 'report', label: 'Sotuv hisoboti', emoji: '📊', why: 'Qatlamli: ma\'lumot toza ajratilgan — oson yig\'asiz. Iflos: ma\'lumot tarqoq, qiyin.' }
];

// Texnik qarz = risk (s5)
const NODEBT = ['Reliz xotirjam — ishonch bor', 'Bug kam, tez tuzatiladi', 'Yangi a\'zo tez tushunadi'];
const DEBT = ['Har relizda qo\'rquv: "nima buziladi?"', 'Bitta o\'zgarish 10 joyni buzadi', 'Yangi a\'zo haftalab adashadi'];

// 6 oy poygasi (s6) — fycha/oy tezligi
const RACE_MESSY = [5, 5, 4, 3, 2, 1];
const RACE_CLEAN = [3, 4, 4, 5, 5, 5];
const RACE_MAX = 5;

// Feature ↔ nega oson (s8 moslash)
const EASY_PAIRS = [
  { id: 'mijoz', feat: 'Yangi resurs: Mijozlar', crit: 'Xuddi shu naqsh (Entity→...→Module) takrorlanadi' },
  { id: 'auth', feat: 'Sotuvchi roli (auth)', crit: 'Bitta Guard hamma controllerga ulanadi' },
  { id: 'search', feat: 'Narx bo\'yicha qidiruv', crit: 'Faqat Service qatlamiga bitta metod' },
  { id: 'test', feat: 'Avtomatik test', crit: 'Har qatlam mustaqil — alohida testlanadi' }
];

// Qachon tez-iflos maqbul (s10)
const SCENARIOS = [
  { id: 'demo', text: 'Ertaga investorga bir martalik demo', quick: true, why: 'Keyin tashlaysiz — tez-iflos maqbul.' },
  { id: 'mvp', text: 'G\'oyani sinash uchun MVP', quick: true, why: 'Ishlaydimi noma\'lum — avval tez sinab ko\'r.' },
  { id: 'grow', text: '5 yil yashaydigan mahsulot', quick: false, why: 'Uzoq yashaydi — tartibli arxitektura shart.' },
  { id: 'team', text: '10 kishilik jamoa parallel ishlaydi', quick: false, why: 'Qatlamsiz bir-birini buzadi — tartib shart.' }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'TEZ-IFLOS', color: T.accent, text: 'Avtosalon boshida hammasini bitta faylga yozdi', why: 'Birinchi oy zo\'r ketdi — tez va oson edi.' },
  { tag: 'QARZ', color: T.honey, text: '6 oydan keyin "auth" fychasi 2 hafta o\'rniga 2 oy oldi', why: 'Spagetti kod — har o\'zgarish boshqa joyni buzdi.' },
  { tag: 'REFACTOR', color: T.blue, text: 'Qatlamli arxitekturaga ko\'chirildi (NestJS)', why: 'Bir martalik investitsiya — qarz to\'landi.' },
  { tag: 'NATIJA', color: T.success, text: 'Endi yangi fycha bir kunda — barqaror tez', why: 'Arxitektura = uzoq muddatli tezlik.' }
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

// ===== SCREEN 0 — HOOK (2 jamoa, 6 oy) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('messy');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Tartibli jamoa ko\'proq odam yolladi' },
    { id: 'b', label: 'Tez-iflos kod "texnik qarz" to\'pladi — har yangi fycha qiyinlashdi' },
    { id: 'c', label: 'Farqi yo\'q, tasodif' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'messy'
    ? { who: 'Tez-iflos jamoa', emoji: '🏃', m1: '1-oy: 5 fycha! Zo\'r ketyapti!', m6: '6-oy: atigi 1 fycha. Har o\'zgarish boshqa joyni buzadi.', ok: false }
    : { who: 'Tartibli jamoa', emoji: '🧱', m1: '1-oy: 3 fycha. Sekinroq, lekin tartibli.', m6: '6-oy: 5 fycha — barqaror tez. Yangi fycha — naqshni takrorlash.', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Ikki jamoa birga boshladi. 6 oydan keyin biri <span className="italic" style={{ color: T.accent }}>botqoqda</span>. Nega?</h1>
        <Mentor>Bitta jadval uchun 5 ta fayl ko'p tuyuladi. Lekin 6 oydan keyin farq katta. Har jamoani bosing.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'messy' ? 'chip-on' : ''}`} onClick={() => setV('messy')}>🏃 Tez-iflos</button>
              <button className={`chip ${v === 'clean' ? 'chip-on' : ''}`} onClick={() => setV('clean')}>🧱 Tartibli</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.success : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', lineHeight: 1.5, color: T.ink, margin: '0 0 8px' }}>📅 {cur.m1}</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', lineHeight: 1.5, color: cur.ok ? T.success : T.accent, margin: 0, fontWeight: 600 }}>📅 {cur.m6}</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega 6 oydan keyin farq?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Bugungi <b>arxitektura qarori</b> 6 oydan keyingi tezlikni belgilaydi. Texnik qarz — <b>mahsulot riski</b>. Shuning uchun NestJS bitta jadval uchun ham qatlamlarni talab qiladi. Bugun nega ekanini ko'ramiz.</p>}
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
    { text: 'Masshtablanuvchanlik = mahsulot qarori', tag: '' },
    { text: 'Bugungi qaror → 6 oydan keyingi tezlik', tag: 'jonli' },
    { text: 'Texnik qarz = mahsulot riski', tag: '' },
    { text: 'Yaxshi arxitektura: yangi fycha = naqshni takrorlash', tag: '' },
    { text: '3 fychani nomlash — qaysilari osonlashadi', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.blue} soft={T.blueSoft}>{Ico.rocket(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Arxitektura = tezlik investitsiyasi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Bugun sekinroq, 6 oydan keyin ancha tez.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Nega NestJS bitta jadval uchun 5 fayl talab qiladi</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Nega arxitektura — mahsulot qarori?</span></h2></div>
        <Mentor>Bu modul professional <b style={{ color: T.ink }}>qatlamli arxitektura</b>ni o'rgatadi. PM nuqtai nazaridan: nega bu investitsiya arziydi?</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — TEXNIK QARZ = KREDIT (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('credit');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['credit', 'tech']) : new Set(['credit']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'credit' ? CREDIT : TECHDEBT;
  return (
    <Stage eyebrow="Metafora" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Texnik qarz — bu <span className="italic" style={{ color: T.accent }}>kredit</span></h2></div>
        <Mentor>Tez-iflos kod — kreditga olgandek. Bugun tez, lekin keyin <b style={{ color: T.ink }}>foiz</b> to'laysiz. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'credit' ? 'chip-on' : ''}`} onClick={() => set('credit')}>💳 Kredit (pul)</button>
              <button className={`chip ${v === 'tech' ? 'chip-on' : ''}`} onClick={() => set('tech')}>💻 Texnik qarz (kod)</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${i === 0 ? T.success : i === 2 ? T.accent : T.honey}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: i === 0 ? T.success : i === 2 ? T.accent : T.honey, display: 'inline-flex' }}>{v === 'credit' ? Ico.card(15) : Ico.layers(15)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            <div className="frame-soft fade-step" key={v}><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{v === 'credit' ? 'Kredit' : 'Texnik qarz'}</p><p className="body" style={{ margin: 0, color: T.ink }}>{v === 'credit' ? 'Kredit yomon emas — to\'g\'ri ishlatilsa foydali. Yomoni — uni to\'lamay cho\'zish.' : 'Texnik qarz ham — ba\'zan ataylab olinadi (MVP). Yomoni — uni hech tuzatmay, davom etish.'}</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>PM ishi: <b>qachon qarz olish</b>, qachon <b>uni to'lash</b>ni bilish.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — AVTOSALON O'SADI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(GROW.map(g => g.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= GROW.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? GROW.find(g => g.id === active) : null;
  return (
    <Stage eyebrow="Mahsulot o'sadi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${GROW.length} fychani ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bugun 1 jadval — <span className="italic" style={{ color: T.accent }}>ertaga</span> ko'p fycha</h2></div>
        <Mentor>Avtosalon bugun faqat Car jadvali. Lekin u o'sadi. Har kelajak fychani bosing — arxitektura uni qanday osonlashtiradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GROW.map(g => (<button key={g.id} onClick={() => tap(g.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === g.id ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -8px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 20 }}>{g.emoji}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{g.label}</span>{seen.has(g.id) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge">{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir fychani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har fycha — qatlamli arxitektura bilan oson, iflos kod bilan og'riq.</p></div>}
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
    questionText="Nega arxitektura qarori — mahsulot (PM) masalasi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega arxitektura <span className="italic" style={{ color: T.accent }}>mahsulot</span> masalasi?</h2></>}
    options={['Chunki kod chiroyli ko\'rinadi', 'Chunki u 6 oydan keyin fycha chiqarish tezligini belgilaydi', 'Chunki dasturchilarga yoqadi', 'Aslida faqat texnik']} correctIdx={1}
    explainCorrect="To'g'ri! Arxitektura kelajakdagi tezlikni belgilaydi — demak mahsulot qancha tez o'sishini. Bu to'g'ridan-to'g'ri biznes masalasi."
    explainWrong={{ 0: 'Ko\'rinish emas — gap kelajakdagi tezlikda.', 2: 'Yoqish emas — fycha chiqarish tezligi muhim.', 3: 'Texnik ham, lekin avvalo mahsulot tezligi haqida.', default: 'Arxitektura = kelajakdagi fycha tezligi.' }} />
);

// ===== SCREEN 5 — TEXNIK QARZ = RISK =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('debt');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['debt', 'no']) : new Set(['debt']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'debt' ? DEBT : NODEBT;
  const col = v === 'debt' ? T.accent : T.success;
  return (
    <Stage eyebrow="Qarz = risk" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Texnik qarz — <span className="italic" style={{ color: T.accent }}>mahsulot riski</span></h2></div>
        <Mentor>Qarz ko'paysa, har reliz qaltis bo'ladi. Bu — bevosita mahsulot riski. Ikki holatni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'debt' ? 'chip-on' : ''}`} onClick={() => set('debt')}>⚠️ Qarz ko'p</button>
              <button className={`chip ${v === 'no' ? 'chip-on' : ''}`} onClick={() => set('no')}>✅ Qarz yo'q</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'debt' ? Ico.problem(16) : Ico.check(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'debt'
              ? <div className="frame-warn fade-step" key="d"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk yuqori</p><p className="body" style={{ margin: 0, color: T.ink }}>Har o'zgarish qo'rqinchli — mahsulot sekin va ishonchsiz o'sadi.</p></div>
              : <div className="frame-success fade-step" key="n"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk past</p><p className="body" style={{ margin: 0, color: T.ink }}>Har reliz xotirjam — mahsulot tez va barqaror o'sadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>PM riskni boshqaradi. Texnik qarz — ko'rinmas, lekin eng katta risklardan biri.</p></div>}
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
    questionText="Texnik qarz nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Texnik qarz <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Dasturchining banka qarzi', 'Tez-iflos qaror — keyin "foiz" (sekinlik, bug) bilan to\'lanadi', 'Yangi kompyuter narxi', 'Internet to\'lovi']} correctIdx={1}
    explainCorrect="To'g'ri! Texnik qarz — bugun tez ketish uchun olingan yon-berish. Keyin uni har yangi fycha sekinlashishi bilan 'to'laysiz'."
    explainWrong={{ 0: 'Bu — kod sifati haqida, pul qarzi emas.', 2: 'Apparat narxi emas — kod yon-berishlari.', 3: 'Internet emas — kod tuzilmasidagi qarz.', default: 'Texnik qarz — keyin to\'lanadigan kod yon-berishi.' }} />
);

// ===== SCREEN 6 — 6 OY POYGASI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [month, setMonth] = useState(storedAnswer ? 6 : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const runningRef = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const done = month >= 6;
  const run = () => {
    if (runningRef.current || done) return;
    runningRef.current = true; setRunning(true); setMonth(0);
    const tick = (m) => { setMonth(m); if (m < 6) { timer.current = setTimeout(() => tick(m + 1), 540); } else { setRunning(false); runningRef.current = false; } };
    timer.current = setTimeout(() => tick(1), 320);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="6 oy poygasi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Poygani ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">6 oy poygasi: <span className="italic" style={{ color: T.accent }}>fycha tezligi</span></h2></div>
        <Mentor>"Ishga tushir"ni bosing — oylar o'tadi. Har oyda ikki jamoa <b style={{ color: T.ink }}>nechta fycha</b> chiqarganini ko'ring. Boshda kim oldinda, oxirida kim?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="race-chart">
              <div className="race-legend"><span className="rl-item"><span className="rl-dot" style={{ background: T.accent }} />Tez-iflos</span><span className="rl-item"><span className="rl-dot" style={{ background: T.success }} />Tartibli</span></div>
              <div className="race-bars">
                {[0, 1, 2, 3, 4, 5].map(i => { const on = month > i; const mh = RACE_MESSY[i], ch = RACE_CLEAN[i]; return (
                  <div key={i} className="race-col">
                    <div className="race-pair">
                      <div className="race-bar rb-messy" style={{ height: on ? `${(mh / RACE_MAX) * 100}%` : '0%' }} title={`${mh} fycha`}>{on && <span className="rb-val">{mh}</span>}</div>
                      <div className="race-bar rb-clean" style={{ height: on ? `${(ch / RACE_MAX) * 100}%` : '0%' }} title={`${ch} fycha`}>{on && <span className="rb-val">{ch}</span>}</div>
                    </div>
                    <span className="race-mlbl" style={{ color: on ? T.ink : T.ink3 }}>{i + 1}-oy</span>
                  </div>
                ); })}
              </div>
            </div>
            {!done && <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start', marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ display: 'inline-flex' }}>{Ico.clock(17)}</span>{running ? `${month}-oy…` : 'Poygani ishga tushirish'}</button>}
          </Col>
          <Col>
            {!done && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Boshda tez-iflos jamoa oldinda (5 vs 3). Lekin oylar o'tgan sayin kuzating — texnik qarz o'z ta'sirini ko'rsatadi.</p></div>}
            {done && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>📉📈</div><p className="ta-h">6-oy: 1 vs 5!</p><p className="ta-sub">Tez-iflos jamoa qarz ostida sekinlashdi (5→1). Tartibli jamoa barqaror tez bo'ldi (3→5). Bugungi qaror — 6 oydan keyingi tezlik</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — NEGA TEZ-IFLOS SEKINLASHADI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('messy');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['messy', 'clean']) : new Set(['messy']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nega sekinlashadi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega iflos kod <span className="italic" style={{ color: T.accent }}>sekinlashadi</span>?</h2></div>
        <Mentor>Sabab — kodning tuzilishida. Ikki holatni solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'messy' ? 'chip-on' : ''}`} onClick={() => set('messy')}>🍝 Spagetti</button>
              <button className={`chip ${v === 'clean' ? 'chip-on' : ''}`} onClick={() => set('clean')}>🧱 Qatlamli</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'clean' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'messy' ? '🍝' : '🧱'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'messy'
                ? 'Hammasi bitta faylda aralash. Bitta narsani o\'zgartirsang, 10 boshqa joy buziladi. Qo\'rqib tegasan.'
                : 'Har qism o\'z qatlamida (Entity, Service, Controller). Bittasini o\'zgartirsang, boshqalar tinch. Bemalol tegasan.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'messy'
              ? <div className="frame-warn fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Bog'liqlik chalkash = har o'zgarish qaltis. Tezlik tushadi.</p></div>
              : <div className="frame-success fade-step" key="c"><p className="body" style={{ margin: 0, color: T.ink }}>Qatlamlar mustaqil = xavfsiz o'zgartirish. Tezlik saqlanadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>NestJS qatlamlari aynan shuni beradi: har qism alohida, xavfsiz o'zgaradi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — FEATURE ↔ NEGA OSON (moslash) (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const REASONS = [
    { id: 'search', text: 'Faqat Service qatlamiga bitta metod' },
    { id: 'mijoz', text: 'Xuddi shu naqsh (Entity→...→Module) takrorlanadi' },
    { id: 'test', text: 'Har qatlam mustaqil — alohida testlanadi' },
    { id: 'auth', text: 'Bitta Guard hamma controllerga ulanadi' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(EASY_PAIRS.map(p => [p.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= EASY_PAIRS.length;
  const pickF = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickC = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(12px,1.5vw,13.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Nega oson" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${EASY_PAIRS.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har <span className="italic" style={{ color: T.accent }}>fycha</span> — qatlamli arxitektura bilan nega oson?</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>fychani</b>, keyin uni <b style={{ color: T.ink }}>nega oson qiladigan</b> sababni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Yangi fycha</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {EASY_PAIRS.map(p => { const m = matched[p.id]; const on = sel === p.id; return (<button key={p.id} onClick={() => pickF(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.blue, display: 'inline-flex' }}>{m ? Ico.check(17) : Ico.rocket(15)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p.feat}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Nega oson</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {REASONS.map(c => { const m = matched[c.id]; const isWrong = wrong === c.id; return (<button key={c.id} onClick={() => pickC(c.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(16) : Ico.layers(15)}</span><span style={{ flex: 1 }}>{c.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa fycha uchun. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Qatlamlar har yangi fychani <b>naqshni takrorlash</b>ga aylantiradi.</p></div>}
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
    questionText="Qatlamli arxitektura yangi resurs (Mijozlar) qo'shishni nega osonlashtiradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yangi resurs qo'shish nega <span className="italic" style={{ color: T.accent }}>oson</span> bo'ladi?</h2></>}
    options={['Kod o\'zi yoziladi', 'Tayyor naqsh bor: Entity→DTO→Service→Controller→Module — uni takrorlaysiz', 'Mijozlar kerak emas', 'Hech qanday farqi yo\'q']} correctIdx={1}
    explainCorrect="To'g'ri! Car uchun ishlatilgan naqsh aynan Mijozlar uchun ham ishlaydi. Yangi resurs = tayyor andozani takrorlash, noldan o'ylash emas."
    explainWrong={{ 0: 'Kod o\'zi yozilmaydi — lekin naqsh tayyor, takrorlaysiz.', 2: 'Mijozlar kerak — gap qo\'shish osonligida.', 3: 'Katta farq bor — naqsh bilan tez, naqshsiz qiyin.', default: 'Tayyor qatlam naqshini takrorlaysiz.' }} />
);

// ===== SCREEN 10 — QACHON TEZ-IFLOS MAQBUL (qaror) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [marks, setMarks] = useState(() => storedAnswer ? Object.fromEntries(SCENARIOS.map(s => [s.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(marks).length >= SCENARIOS.length;
  const classify = (item, asQuick) => { if (marks[item.id]) return; if (asQuick === item.quick) { setMarks(prev => ({ ...prev, [item.id]: true })); setWrong(null); } else setWrong(item.id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="PM qarori" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(marks).length}/${SCENARIOS.length} qaror qiling`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qachon tez-iflos <span className="italic" style={{ color: T.accent }}>maqbul</span>?</h2></div>
        <Mentor>Texnik qarz doim yomon emas — ba'zan to'g'ri qaror. Har stsenariy uchun <b style={{ color: T.honey }}>Tez-iflos</b> yoki <b style={{ color: T.success }}>Tartibli</b> ni tanlang.</Mentor>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 660, width: '100%', margin: '0 auto' }}>
          {SCENARIOS.map(s => { const m = marks[s.id]; const isWrong = wrong === s.id; return (
            <div key={s.id} className={`classify-row ${m ? (s.quick ? 'cr-quick' : 'cr-clean') : ''} ${isWrong ? 'shake-x' : ''}`}>
              <span style={{ flex: 1, fontFamily: "'Manrope'", fontWeight: 600, fontSize: 'clamp(13px,1.6vw,14.5px)', color: T.ink }}>{s.text}</span>
              {m ? (<span className="mono small" style={{ fontWeight: 700, color: s.quick ? T.honey : T.success }}>{s.quick ? '⚡ Tez-iflos' : '🧱 Tartibli'}<span style={{ color: T.ink2, fontWeight: 500 }}> — {s.why}</span></span>)
                : (<span style={{ display: 'flex', gap: 6 }}><button className="cls-btn cls-quick" onClick={() => classify(s, true)}>Tez-iflos</button><button className="cls-btn cls-clean" onClick={() => classify(s, false)}>Tartibli</button></span>)}
            </div>
          ); })}
        </div>
        {wrong && !done && <p className="small" style={{ color: T.accent, textAlign: 'center', margin: 0 }}>Qaytadan o'ylab ko'ring — bu uzoq yashaydimi yoki bir martalikmi?</p>}
        {done && <div className="frame-success fade-step" style={{ maxWidth: 660, width: '100%', margin: '0 auto' }}><p className="body" style={{ margin: 0, color: T.ink }}>Bir martalik / sinov → tez maqbul. Uzoq / jamoa → tartib shart. PM kontekstga qaraydi.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ARXITEKTURA = ROADMAP TEZLIGI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('slow');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['slow', 'fast']) : new Set(['slow']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Roadmap tezligi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Arxitektura <span className="italic" style={{ color: T.accent }}>roadmap</span> tezligini belgilaydi</h2></div>
        <Mentor>PM roadmap tuzadi. Lekin uni qancha tez bajarish — arxitekturaga bog'liq. Ikkalasini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'slow' ? 'chip-on' : ''}`} onClick={() => set('slow')}>🐌 Qarzli roadmap</button>
              <button className={`chip ${v === 'fast' ? 'chip-on' : ''}`} onClick={() => set('fast')}>🚀 Toza roadmap</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'fast' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'fast' ? '🚀' : '🐌'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'slow'
                ? 'PM "shu chorakda 5 fycha" deydi. Lekin qarz tufayli faqat 2 tasi chiqadi. Roadmap kechikadi.'
                : 'PM "5 fycha" deydi — toza arxitektura bilan 5 tasi ham chiqadi. Roadmap bashorat qilinadi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'slow'
              ? <div className="frame-warn fade-step" key="s"><p className="body" style={{ margin: 0, color: T.ink }}>Va'da berilgan fychalar chiqmaydi — biznes ishonchini yo'qotadi.</p></div>
              : <div className="frame-success fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>Reja amalga oshadi — biznes ishonadi, mahsulot o'sadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi arxitektura = ishonchli roadmap. Shuning uchun PM unga qiziqadi.</p></div>}
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
    questionText="Qachon tez-iflos (texnik qarz) maqbul qaror?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qachon tez-iflos <span className="italic" style={{ color: T.accent }}>maqbul</span>?</h2></>}
    options={['Doim — tezlik hammasidan muhim', 'Bir martalik demo yoki g\'oyani sinovchi MVP da', '5 yillik mahsulotda', 'Katta jamoa ishlaganda']} correctIdx={1}
    explainCorrect="To'g'ri! Bir martalik demo yoki noma'lum g'oyani sinashda tez-iflos maqbul — keyin tashlaysiz yoki tartibga solasiz. Uzoq mahsulotda esa tartib shart."
    explainWrong={{ 0: 'Doim emas — uzoq mahsulotda qarz xavfli.', 2: '5 yillik mahsulot — aynan tartib kerak joy.', 3: 'Katta jamoa — qatlam shart, aks holda bir-birini buzadi.', default: 'Tez-iflos: bir martalik demo / MVP uchun.' }} />
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>qarz to'landi</span>, tezlik qaytdi</h2></div>
        <Mentor>Avtosalon backendining yo'li — 4 qadam. Har qatorni bosib, arxitektura qarorining ta'sirini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.car(16)}</span><span className="cl-title">Avtosalon — arxitektura hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tez-iflos → qarz → refactor → tezlik. Arxitektura — uzoq muddatli qaror. Endi o'zingiznikini yozasiz.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Arxitektura — <span className="italic" style={{ color: T.accent }}>mahsulot investitsiyasi</span></h2></div>
      <Mentor>Yodda tuting: bugungi qaror kelajak tezligini belgilaydi, texnik qarz — risk, qatlam — har fychani takror naqshga aylantiradi.</Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🚀</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Bugun ek, ertaga o'r</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Tartib bugun — tezlik 6 oydan keyin.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">3 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.clock(18), c: T.blue, t: 'BUGUNGI qaror → 6 oydan keyingi tezlik' }, { ic: Ico.problem(18), c: T.accent, t: 'TEXNIK QARZ — mahsulot riski' }, { ic: Ico.layers(18), c: T.success, t: 'QATLAM — yangi fycha = takror naqsh' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: 3 fycha osonlashadi =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Yangi resurs qo\'shish (masalan mijozlar)…', 'Auth / rollar bir joydan…', 'Qidiruv yoki avtomatik test…'];
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
        <div className="head"><h2 className="title h-title fade-up">Yaxshi arxitektura bilan qaysi <span className="italic" style={{ color: T.accent }}>3 fycha osonlashadi</span>?</h2></div>
        <Mentor>O'z loyihangiz (yoki avtosalon) uchun: qatlamli arxitektura qaysi <b style={{ color: T.ink }}>3 fychani</b> osonlashtiradi? Kamida 2 ta yozing.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>Fycha {i + 1}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Osonlashadigan fychalar</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — ro'yxat shu yerda yig'iladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.rocket(15)}</span><span className="cl-title">Arxitektura tufayli oson</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi nega NestJS qatlamlari arziydiganini biznes tilida tushuntira olasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Masshtablanuvchanlik = mahsulot qarori', 'Bugungi arxitektura → 6 oydan keyingi tezlik', 'Texnik qarz = mahsulot riski', 'Qatlam = yangi fychani takror naqshga aylantiradi'];
  const HOMEWORK = [{ b: 'Loyihangizni baholang', t: '— hozir texnik qarz bormi? Qayerda?' }, { b: '3 kelajak fycha yozing', t: '— qaysilari toza arxitektura bilan oson bo\'ladi' }, { b: 'Qaror qiling', t: '— qaysi qism tez-iflos, qaysi tartibli bo\'lsin' }];
  const GLOSSARY = [{ b: 'Fycha', t: '— yangi imkoniyat (feature)' }, { b: 'Texnik qarz', t: '— keyin to\'lanadigan tez-iflos qaror' }, { b: 'Masshtablanuvchanlik', t: '— mahsulot o\'sganda ham tez ishlash' }, { b: 'Qatlamli arxitektura', t: '— har vazifa o\'z joyida (Service, Controller...)' }, { b: 'Refactor', t: '— kodni qayta tartibga solish' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi arxitektura — <span className="italic" style={{ color: T.accent }}>mahsulot qarori</span> siz uchun.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Masshtablanuvchanlik, texnik qarz va arxitektura investitsiyasini bilasiz. Endi nega NestJS qatlamlari kerakligini tushunib, Car resursini quramiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Arxitektura ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Bugun tartib — ertaga tezlik! 🚀</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🧱</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi dars: Car resursini qurish</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Endi nega 5 ta fayl kerakligini bilasiz — Entity→DTO→Service→Controller→Module ni qo'lda yozamiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson15({ lang: langProp, onFinished }) {
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

        /* === 6 OY POYGASI (signature 1) === */
        .race-chart { background: ${T.paper}; border-radius: 14px; padding: 14px 14px 10px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.16); }
        .race-legend { display: flex; gap: 16px; justify-content: center; margin-bottom: 10px; }
        .rl-item { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 600; font-size: 11.5px; color: ${T.ink2}; }
        .rl-dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
        .race-bars { display: flex; align-items: flex-end; justify-content: space-between; gap: 4px; height: 150px; }
        .race-col { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; height: 100%; }
        .race-pair { display: flex; align-items: flex-end; justify-content: center; gap: 3px; flex: 1; width: 100%; }
        .race-bar { width: 42%; max-width: 22px; border-radius: 4px 4px 0 0; position: relative; transition: height 0.5s cubic-bezier(.4,0,.2,1); display: flex; align-items: flex-start; justify-content: center; }
        .rb-messy { background: linear-gradient(${T.accent}, ${T.accentSoft}); }
        .rb-clean { background: linear-gradient(${T.success}, ${T.successSoft}); }
        .rb-val { font-family: 'Fraunces', serif; font-weight: 700; font-size: 10px; color: ${T.ink}; margin-top: -14px; }
        .race-mlbl { font-family: 'Manrope'; font-weight: 600; font-size: 9.5px; transition: color 0.3s; }

        /* === CLASSIFY (s10) === */
        .classify-row { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 11px; padding: 10px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; flex-wrap: wrap; }
        .classify-row.cr-quick { background: ${T.honeySoft}; box-shadow: inset 0 0 0 1.5px ${T.honey}66; }
        .classify-row.cr-clean { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}55; }
        .cls-btn { font-family: 'Manrope'; font-weight: 700; font-size: 12px; border: none; border-radius: 8px; padding: 6px 12px; cursor: pointer; transition: all 0.16s; }
        .cls-quick { background: ${T.honeySoft}; color: ${T.honey}; } .cls-quick:hover { background: ${T.honey}; color: #fff; }
        .cls-clean { background: ${T.successSoft}; color: ${T.success}; } .cls-clean:hover { background: ${T.success}; color: #fff; }

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
