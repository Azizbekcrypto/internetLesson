import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 21-DARS (Modul 08 · Botlar · PM3, YAKUNIY) — FOYDALANUVCHI YIG'ISH + METRIKALAR — PLATFORM STANDARD v16
// G'oya: PM1 yig'ish rejasini ishga tushirish; bot metrikalari (DAU, retention, komandalar); raqamni o'qish.
//        Yakuniy ish: birinchi metrika hisoboti (DAU + retention + top komanda + 1 qaror).
// Joylashuv: BotAiAgent (P5) dan keyin — modul va 3-PM yoyining CAPSTONE'i (strategiya→custdev→o'lchov).
// Markaziy g'oya: "O'lchanmagan narsa boshqarilmaydi". Asosiy ko'nikma — raqamni o'qish (talqin + qaror).
// Bog'lanish: PM11 (vanity/actionable) + PM18 (metrika) — bilimlarni botga qo'llash.
// Signature 1: bot o'sish paneli (7-kun DAU + retention + top komanda). Signature 2: raqamni o'qish (data detektiv).
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
  chart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 20V4M4 20h16" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="5" width="3" height="12" /></svg>),
  repeat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 9a6 6 0 0 1 10-3l3 2" /><path d="M20 15a6 6 0 0 1-10 3l-3-2" /><path d="M17 4v4h-4M7 20v-4h4" /></svg>),
  cmd: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M7 9l3 3-3 3M13 15h4" /></svg>),
  search: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>),
  trend: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 17l6-6 4 4 8-8" /><path d="M16 7h5v5" /></svg>),
  bucket: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 7h14l-1.5 12a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3L5 7z" /><path d="M4 7h16M9 4h6" /></svg>),
  ruler: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(0 12 12)" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></svg>),
  trophy: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 14v6" /></svg>)
};

const LESSON_META = { lessonId: 'pm-metrics-users-21-v16', lessonTitle: { uz: 'Foydalanuvchi yig\'ish + metrikalar', ru: 'Набери пользователей + метрики' } };
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
// 3 bot metrikasi (s3)
const METRICS = [
  { id: 'dau', label: 'DAU', full: 'Kunlik faol foydalanuvchi', ico: (s) => Ico.chart(s), color: T.blue, why: 'Bugun nechta odam botni HAQIQATAN ishlatdi. Obuna emas — faollik. Mahsulot tirikligining pulsi.' },
  { id: 'ret', label: 'Retention', full: 'Qaytish darajasi', ico: (s) => Ico.repeat(s), color: T.grape, why: 'Kelganlardan nechtasi QAYTIB keladi. Eng muhim metrika — mahsulot ushlab tura oladimi?' },
  { id: 'cmd', label: 'Komandalar', full: 'Funksiya ishlatilishi', ico: (s) => Ico.cmd(s), color: T.honey, why: 'Qaysi komanda/tugma ko\'p bosiladi. Asosiy qiymat qaerda ekanini ko\'rsatadi.' }
];

// 7 kunlik DAU (s6)
const DAU_WEEK = [3, 5, 4, 7, 9, 8, 12];
const DAU_DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

// Panel plitalari (s6)
const TILES = [
  { id: 'dau', label: 'DAU (bugun)', val: '12', sub: '+4 kechagidan', ico: (s) => Ico.chart(s), color: T.blue, mean: 'Bugun 12 kishi ishlatdi va o\'smoqda — yaxshi belgi.' },
  { id: 'ret', label: 'Retention (7 kun)', val: '40%', sub: 'qaytib keldi', ico: (s) => Ico.repeat(s), color: T.grape, mean: '10 dan 4 tasi qaytdi. Ushlab qolishni yaxshilash mumkin.' },
  { id: 'cmd', label: 'Top komanda', val: '/eslatma', sub: '90% ishlatadi', ico: (s) => Ico.cmd(s), color: T.honey, mean: 'Asosiy qiymat — eslatma. Shuni yaxshilashga e\'tibor bering.' }
];

// Vanity vs actionable (s5)
const VANITY = ['Jami obunalar: 100 🎉', 'Ko\'rsatish uchun chiroyli', 'O\'smoqdek tuyuladi, lekin...'];
const ACTION = ['DAU: bugun 12 ishlatdi', 'Retention: 40% qaytadi', 'Qaror qabul qilishga yordam beradi'];

// Data detektiv senariylari (s8)
const SCENARIOS = [
  {
    id: 'sc1', stat: '100 obuna · DAU = 5', emoji: '📉',
    opts: [
      { t: 'Zo\'r — 100 kishi bor!', ok: false },
      { t: 'Ko\'p qo\'shildi, lekin ishlatmaydi → retention muammosi', ok: true }
    ],
    why: 'Obuna ko\'p, lekin faqat 5 tasi faol. Muammo — ushlab qolish. Nega qaytmasligini custdev bilan so\'rang.'
  },
  {
    id: 'sc2', stat: 'DAU o\'smoqda · retention past', emoji: '🪣',
    opts: [
      { t: 'Yangi keladi, lekin qolmaydi → mahsulot ushlab turolmayapti', ok: true },
      { t: 'Hammasi joyida, davom etaver', ok: false }
    ],
    why: 'Teshik chelak: yangi quyasiz, lekin oqib ketadi. Avval qaytishni tuzating, keyin ko\'proq yig\'ing.'
  },
  {
    id: 'sc3', stat: 'Bitta komanda 90% ishlatiladi', emoji: '🎯',
    opts: [
      { t: 'Uni o\'chirib, boshqasini qo\'shaman', ok: false },
      { t: 'Asosiy qiymat shu → shuni yaxshilayman', ok: true }
    ],
    why: 'Foydalanuvchilar aynan shuni qadrlaydi. Diqqatni shu yadroga qarating, kam ishlatilganni keyinroq.'
  }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'ISHGA TUSHIRDI', color: T.accent, text: 'PM1 rejasini ishga tushirdi → 30 foydalanuvchi yig\'di', why: 'Reja qog\'ozda emas — amalda. Birinchi raqamlar paydo bo\'ldi.' },
  { tag: 'O\'LCHADI', color: T.honey, text: 'Metrika qo\'shdi: DAU = 6, retention juda past', why: 'Raqam yomon xabar berdi — ko\'p keladi, lekin qaytmaydi.' },
  { tag: 'O\'QIDI', color: T.blue, text: 'Custdev: "eslatma o\'z vaqtida kelmaydi" degan naqsh', why: 'Raqam muammoni ko\'rsatdi, intervyu sababini ochdi.' },
  { tag: 'NATIJA', color: T.success, text: 'Eslatmani tuzatdi → retention va DAU ko\'tarildi', why: 'O\'lcha → o\'qi → qaror → yaxshilan. Mana metrika kuchi.' }
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

// ===== SCREEN 0 — HOOK (vanity vs real) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('vanity');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Jami obunalar soni — 100!' },
    { id: 'b', label: 'Necha kishi ishlatadi va qaytadi (DAU, retention)' },
    { id: 'c', label: 'Hech qaysi raqam muhim emas' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'vanity'
    ? { who: 'Chiroyli raqam', emoji: '🎉', say: '100 ta obuna yig\'dim! Bot juda mashhur bo\'lyapti!', ok: false }
    : { who: 'Haqiqiy raqam', emoji: '📊', say: 'Lekin bugun faqat 5 kishi ishlatdi. Qolganlari bir marta kelib, qaytmadi.', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>20+ foydalanuvchi yig'dingiz. Endi <span className="italic" style={{ color: T.accent }}>qaysi raqam</span> muhim?</h1>
        <Mentor>Yig'ish rejangiz ishladi, foydalanuvchi keldi. Lekin bot o'smoqdami va ular qoladimi? Ikki turdagi raqamni bosing.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'vanity' ? 'chip-on' : ''}`} onClick={() => setV('vanity')}>🎉 Chiroyli</button>
              <button className={`chip ${v === 'real' ? 'chip-on' : ''}`} onClick={() => setV('real')}>📊 Haqiqiy</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.success : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi raqam muhim?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Obunalar soni — chiroyli, lekin yolg'on tasalli. Asosiysi: <b>nechta ishlatadi (DAU)</b> va <b>qaytadi (retention)</b>. Bugun shu raqamlarni o'qishni o'rganamiz — bu acquisition (foydalanuvchi yig'ish) yo'limizning so'nggi qadami.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: '"O\'lchanmagan narsa boshqarilmaydi"', tag: '' },
    { text: '3 bot metrikasi: DAU, retention, komandalar', tag: '' },
    { text: 'Vanity vs actionable: qaysi raqam qaror beradi', tag: '' },
    { text: 'Jonli panel + raqamni o\'qish (data detektiv)', tag: 'jonli' },
    { text: 'Birinchi metrika hisobotingizni yozasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.blue} soft={T.blueSoft}>{Ico.chart(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Raqamlar hikoya aytadi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>O'lcha, o'qi, keyin qaror qabul qil.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Acquisition yo'li finali: strategiya → custdev → o'lchov</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Botingiz o'smoqdami? Raqamlar aytadi.</span></h2></div>
        <Mentor>His-tuyg'u aldaydi: "menimcha yaxshi ketyapti". <b style={{ color: T.ink }}>Raqam</b> esa haqiqatni aytadi. Bugun bot metrikalarini o'qishni o'rganamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — O'LCHANMAGAN NARSA BOSHQARILMAYDI (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('blind');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['blind', 'measure']) : new Set(['blind']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'lchov" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"O'lchanmagan narsa <span className="italic" style={{ color: T.accent }}>boshqarilmaydi</span>"</h2></div>
        <Mentor>Reja ishga tushdi — lekin natijani o'lchamasangiz, ko'zi yumuq haydaganga o'xshaysiz. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'blind' ? 'chip-on' : ''}`} onClick={() => set('blind')}>🙈 O'lchamasdan</button>
              <button className={`chip ${v === 'measure' ? 'chip-on' : ''}`} onClick={() => set('measure')}>📏 O'lchab</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'measure' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'measure' ? '🧭' : '🙈'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'blind'
                ? '"Menimcha yaxshi ketyapti" — bu his-tuyg\'u. Aslida o\'smoqdami yoki tushmoqdami — bilmaysiz.'
                : 'DAU, retention raqamlari aniq ko\'rsatadi: o\'sish bormi, qayerda muammo bor. Qaror aniq bo\'ladi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'blind'
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>His-tuyg'u bilan boshqarish — qorong'uda mashina haydaganga teng.</p></div>
              : <div className="frame-success fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Raqam — chiroq. Qayerga ketayotganingizni ko'rsatadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Avval o'lcha — keyin xulosa qil. Raqamsiz qaror = taxmin.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — 3 BOT METRIKASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(METRICS.map(m => m.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= METRICS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? METRICS.find(m => m.id === active) : null;
  return (
    <Stage eyebrow="3 metrika" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${METRICS.length} metrikani ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Botning <span className="italic" style={{ color: T.accent }}>3 asosiy raqami</span></h2></div>
        <Mentor>Bot uchun eng muhim 3 metrika. Har birini bosing — nima va NEGA muhimligini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {METRICS.map(m => (<button key={m.id} onClick={() => tap(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === m.id ? `inset 0 0 0 2px ${m.color}, 0 8px 20px -8px ${m.color}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ color: m.color, display: 'inline-flex' }}>{m.ico(18)}</span><span style={{ flex: 1 }}><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink }}>{m.label}</span><span className="small" style={{ color: T.ink2, marginLeft: 7 }}>{m.full}</span></span>{seen.has(m.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: cur.color, display: 'inline-flex' }}>{cur.ico(18)}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label} — {cur.full}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir metrikani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uchchalasi birga — botingiz sog'ligining to'liq manzarasi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Bot o'sishini bilish uchun qaysi raqam eng muhim?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot o'sishini bilish uchun qaysi raqam <span className="italic" style={{ color: T.accent }}>eng muhim</span>?</h2></>}
    options={['Jami obunalar soni', 'Necha kishi ishlatadi va qaytadi (DAU, retention)', 'Bot rangi', 'Kod qatorlari soni']} correctIdx={1}
    explainCorrect="To'g'ri! Obuna — bir martalik. Asosiysi: nechta odam HAQIQATAN ishlatadi (DAU) va QAYTADI (retention). Bular o'sishni ko'rsatadi."
    explainWrong={{ 0: 'Jami obuna — vanity. Ishlatish va qaytish muhimroq.', 2: 'Rang — metrika emas.', 3: 'Kod soni — foydalanuvchi haqida hech narsa demaydi.', default: 'DAU va retention — o\'sishning haqiqiy o\'lchovi.' }} />
);

// ===== SCREEN 5 — VANITY vs ACTIONABLE =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('vanity');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['vanity', 'action']) : new Set(['vanity']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'vanity' ? VANITY : ACTION;
  const col = v === 'vanity' ? T.accent : T.success;
  return (
    <Stage eyebrow="Vanity vs actionable" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Chiroyli raqam vs <span className="italic" style={{ color: T.accent }}>qaror beradigan raqam</span></h2></div>
        <Mentor>Ba'zi raqamlar faqat ko'rsatish uchun (vanity), ba'zilari qaror qabul qilishga yordam beradi (actionable). Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'vanity' ? 'chip-on' : ''}`} onClick={() => set('vanity')}>🎈 Vanity</button>
              <button className={`chip ${v === 'action' ? 'chip-on' : ''}`} onClick={() => set('action')}>🎯 Actionable</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'vanity' ? Ico.problem(15) : Ico.check(15)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'vanity'
              ? <div className="frame-warn fade-step" key="v"><p className="body" style={{ margin: 0, color: T.ink }}>Vanity raqam ko'ngilni ko'taradi, lekin nima qilish kerakligini aytmaydi.</p></div>
              : <div className="frame-success fade-step" key="a"><p className="body" style={{ margin: 0, color: T.ink }}>Actionable raqam — "retention past" → "ushlab qolishni tuzat". Qarorga olib boradi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Savol bering: "bu raqam menga nima qilishni aytadi?" Aytmasa — vanity.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="DAU nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>DAU <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Jami obunalar', 'Kunlik faol foydalanuvchilar (bugun nechta ishlatdi)', 'Bot yoshi', 'Kod hajmi']} correctIdx={1}
    explainCorrect="To'g'ri! DAU (Daily Active Users) — bugun botni HAQIQATAN ishlatgan odamlar soni. Obuna emas — faollik."
    explainWrong={{ 0: 'Obuna — bir martalik. DAU = bugungi faollik.', 2: 'Bot yoshi emas — kunlik faollik.', 3: 'Kod emas — foydalanuvchi faolligi.', default: 'DAU = kunlik faol foydalanuvchilar.' }} />
);

// ===== SCREEN 6 — BOT O'SISH PANELI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [revealed, setRevealed] = useState(!!storedAnswer);
  const [active, setActive] = useState(storedAnswer ? 'dau' : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(TILES.map(t => t.id)) : new Set());
  const workRef = useRef(null);
  const done = revealed && seen.size >= TILES.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const maxD = Math.max(...DAU_WEEK);
  const cur = active ? TILES.find(t => t.id === active) : null;
  return (
    <Stage eyebrow="Bot o'sish paneli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (revealed ? `Plitalarni bosing (${seen.size}/${TILES.length})` : 'Panelni oching')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Botingizning <span className="italic" style={{ color: T.accent }}>o'sish paneli</span></h2></div>
        <Mentor>Bu — botingiz analitika paneli. {revealed ? 'Har plitkani bosing — raqam nimani anglatishini ko\'ring.' : '"Panelni ochish"ni bosing — 7 kunlik o\'sish jonlanadi.'}</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="dashboard">
              <div className="dash-top"><span className="dash-title">📈 Haftalik hisobot</span><span className="mono small" style={{ color: '#9FB4D8' }}>@mening_botim</span></div>
              <div className="dash-chartwrap">
                <p className="dash-chartlbl">DAU — kunlik faol (7 kun)</p>
                <div className="dash-chart">
                  {DAU_WEEK.map((d, i) => (<div key={i} className="dbar-col"><div className="dbar" style={{ height: revealed ? `${(d / maxD) * 100}%` : '0%', transitionDelay: `${i * 0.08}s` }}><span className="dbar-val" style={{ opacity: revealed ? 1 : 0, transitionDelay: `${i * 0.08 + 0.3}s` }}>{d}</span></div><span className="dbar-day">{DAU_DAYS[i]}</span></div>))}
                </div>
              </div>
            </div>
            {!revealed && <button className="btn" onClick={() => setRevealed(true)} style={{ alignSelf: 'flex-start' }}>▶ Panelni ochish</button>}
            {revealed && <div className="tile-row fade-step">
              {TILES.map(t => (<button key={t.id} onClick={() => tap(t.id)} className="mtile" style={{ boxShadow: active === t.id ? `inset 0 0 0 2px ${t.color}, 0 8px 18px -8px ${t.color}66` : `0 6px 16px -9px rgba(${T.shadowBase},0.18)` }}><span className="mtile-ico" style={{ color: t.color }}>{t.ico(16)}</span><span className="mtile-val" style={{ color: t.color }}>{t.val}</span><span className="mtile-lbl">{t.label}</span><span className="mtile-sub">{t.sub}</span></button>))}
            </div>}
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: cur.color, display: 'inline-flex' }}>{cur.ico(18)}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label}: {cur.val}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.mean}</p></div>)
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>{revealed ? 'Plitani bosing — raqam nimani anglatishini o\'qing.' : 'DAU ustunlari Du dan Ya gacha o\'smoqda. Panelni oching!'}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Trend yuqoriga (3→12), retention 40% — o'smoqda, lekin qaytishni yaxshilash mumkin.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — RETENTION = TESHIK CHELAK =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('leak');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['leak', 'fix']) : new Set(['leak']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Retention" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Retention — <span className="italic" style={{ color: T.accent }}>teshik chelak</span> muammosi</h2></div>
        <Mentor>Yangi foydalanuvchi yig'ish — chelakka suv quyish. Agar chelak teshik bo'lsa (past retention), quygan suvingiz oqib ketadi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'leak' ? 'chip-on' : ''}`} onClick={() => set('leak')}>🪣 Teshik chelak</button>
              <button className={`chip ${v === 'fix' ? 'chip-on' : ''}`} onClick={() => set('fix')}>🛠️ Teshikni yop</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'fix' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'fix' ? '🛠️' : '🪣'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'leak'
                ? 'Past retention: har kuni yangi yig\'asiz, lekin eskilari ketadi. Ko\'p mehnat, lekin jami o\'smaydi.'
                : 'Avval retention\'ni tuzat (teshikni yop) — keyin har bir yangi foydalanuvchi qoladi va jami o\'sadi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'leak'
              ? <div className="frame-warn fade-step" key="l"><p className="body" style={{ margin: 0, color: T.ink }}>Teshik chelakka quygan suv behuda. Avval teshikni topish kerak.</p></div>
              : <div className="frame-success fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>To'liq chelak: retention yaxshilangach, yig'ish kuchayadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: ko'p yig'ishdan oldin retention'ni tuzat. Aks holda — behuda mehnat.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — RAQAMNI O'QISH (DATA DETEKTIV, SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState(storedAnswer?.picks || {});
  const workRef = useRef(null);
  const sc = SCENARIOS[idx];
  const solvedAll = SCENARIOS.every(s => picks[s.id] === true);
  const pick = (scId, ok) => { if (picks[scId] === true) return; setPicks(prev => ({ ...prev, [scId]: ok })); };
  useEffect(() => {
    if (solvedAll && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, picks });
  }, [solvedAll]);
  const solvedThis = picks[sc.id] === true;
  const wrongThis = picks[sc.id] === false;
  return (
    <Stage eyebrow="Data detektiv" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solvedAll} label={solvedAll ? 'Davom etish' : 'Har senariyni to\'g\'ri o\'qing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Data detektiv: <span className="italic" style={{ color: T.accent }}>bu raqam nima deydi?</span></h2></div>
        <Mentor>Raqamning o'zi kifoya emas — uni <b style={{ color: T.ink }}>o'qish</b> kerak. Har senariy uchun to'g'ri talqinni tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef}>
          <div className="det-tabs">
            {SCENARIOS.map((s, i) => (<button key={s.id} onClick={() => setIdx(i)} className={`det-tab ${i === idx ? 'det-on' : ''} ${picks[s.id] === true ? 'det-done' : ''}`}>{picks[s.id] === true ? '✓' : i + 1}-holat</button>))}
          </div>
          <div key={sc.id} className="det-card fade-step">
            <div className="det-stat"><span style={{ fontSize: 26 }}>{sc.emoji}</span><span className="det-num">{sc.stat}</span></div>
            <p className="flow-label" style={{ margin: '4px 0 0' }}>Bu nima deydi + nima qilaman?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {sc.opts.map((o, i) => { const chosen = (solvedThis && o.ok) || (wrongThis && !o.ok && picks[sc.id] === false && false); const showCorrect = solvedThis && o.ok; const showWrong = wrongThis && !o.ok; return (
                <button key={i} onClick={() => pick(sc.id, o.ok)} disabled={solvedThis} className={`det-opt ${showCorrect ? 'det-correct' : ''} ${showWrong ? 'det-wrong shake-x' : ''}`}>
                  <span className="det-box">{showCorrect ? Ico.check(13) : (showWrong ? Ico.x(13) : '')}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{o.t}</span>
                </button>
              ); })}
            </div>
            {solvedThis && <div className="frame-success fade-step" style={{ marginTop: 10 }}><p className="body" style={{ margin: 0, color: T.ink }}>{sc.why}</p></div>}
            {wrongThis && <p className="small" style={{ color: T.accent, margin: '8px 0 0' }}>Bu emas — qaytadan o'ylab ko'ring.</p>}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="100 obuna, lekin DAU=5. Bu nima deydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>100 obuna, lekin <span className="italic" style={{ color: T.accent }}>DAU = 5</span>. Bu nima deydi?</h2></>}
    options={['Zo\'r — 100 kishi bor', 'Ko\'p qo\'shildi, lekin ishlatmaydi — retention muammosi', 'Bot juda tez', 'Hech narsa']} correctIdx={1}
    explainCorrect="To'g'ri! 100 obuna chiroyli, lekin faqat 5 tasi faol. Muammo — ushlab qolish. Nega qaytmasligini custdev bilan aniqlang."
    explainWrong={{ 0: '100 obuna vanity — faqat 5 tasi faol-ku.', 2: 'Tezlik haqida emas — faollik past.', 3: 'Aniq signal bor: retention muammosi.', default: 'Past DAU = retention/ushlab qolish muammosi.' }} />
);

// ===== SCREEN 10 — KOMANDALARNI O'QISH =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('top');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['top', 'low']) : new Set(['top']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Komandalarni o'qish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Komandalar <span className="italic" style={{ color: T.accent }}>qiymatni ko'rsatadi</span></h2></div>
        <Mentor>Qaysi funksiya ko'p ishlatiladi — qaysi biri deyarli yo'q? Bu botingiz YADROsini ochadi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'top' ? 'chip-on' : ''}`} onClick={() => set('top')}>🏆 Ko'p ishlatilgan</button>
              <button className={`chip ${v === 'low' ? 'chip-on' : ''}`} onClick={() => set('low')}>🪫 Kam ishlatilgan</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'top' ? T.success : T.honey}` }}>
              <span style={{ fontSize: 26 }}>{v === 'top' ? '🏆' : '🪫'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'top'
                ? '/eslatma 90% ishlatiladi → bu botingizning asosiy qiymati. Shuni yaxshilashga e\'tibor bering.'
                : '/sozlama deyarli ishlatilmaydi → yo qiyin, yo keraksiz. Tuzatish yoki olib tashlash mumkin.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'top'
              ? <div className="frame-success fade-step" key="t"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'p ishlatilgan = foydalanuvchi qadrlaydi. Diqqatni shu yadroga qarating.</p></div>
              : <div className="frame-warn fade-step" key="lo"><p className="body" style={{ margin: 0, color: T.ink }}>Kam ishlatilgan — keraksiz murakkablik. Soddalashtiring.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Komandalar — foydalanuvchi ovozi: nimani qadrlashini harakat bilan aytadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — KICHIK RAQAMDAN XAFA BO'LMA (TREND) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('abs');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['abs', 'trend']) : new Set(['abs']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Trend muhim" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">20 — kam emas, <span className="italic" style={{ color: T.accent }}>boshlanish</span></h2></div>
        <Mentor>Boshlanishda mutlaq son emas, YO'NALISH (trend) muhim: o'smoqdami yoki tushmoqdami? Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'abs' ? 'chip-on' : ''}`} onClick={() => set('abs')}>🔢 Mutlaq son</button>
              <button className={`chip ${v === 'trend' ? 'chip-on' : ''}`} onClick={() => set('trend')}>📈 Trend</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'trend' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'trend' ? '📈' : '😞'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'abs'
                ? '"Atigi 20 kishi" deb tushkunlikka tushish — xato. Hamma katta mahsulot kichikdan boshlangan.'
                : '20 → 25 → 32: trend yuqoriga! Bu — to\'g\'ri yo\'ldasiz degani. Yo\'nalish sondan muhimroq.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'abs'
              ? <div className="frame-warn fade-step" key="a"><p className="body" style={{ margin: 0, color: T.ink }}>Kichik son sizni to'xtatmasin — hamma 0 dan boshlaydi.</p></div>
              : <div className="frame-success fade-step" key="t"><p className="body" style={{ margin: 0, color: T.ink }}>Har hafta o'sish — eng yaxshi belgi. Trendni kuzating.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>So'rang: "o'tgan haftaga nisbatan o'smoqdami?" — javob trendda.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Boshlanishda nima muhimroq — mutlaq son yoki trend?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Boshlanishda nima <span className="italic" style={{ color: T.accent }}>muhimroq</span>?</h2></>}
    options={['Faqat katta mutlaq son', 'Trend — har hafta o\'smoqdami (yo\'nalish)', 'Bot rangi', 'Obunalarning umumiy soni']} correctIdx={1}
    explainCorrect="To'g'ri! 20→25→32 kichik, lekin o'smoqda — bu to'g'ri yo'l. Boshlanishda yo'nalish mutlaq sondan muhimroq."
    explainWrong={{ 0: 'Katta son keyin keladi — avval o\'sish yo\'nalishi.', 2: 'Rang — metrika emas.', 3: 'Jami obuna vanity. Trend muhimroq.', default: 'Trend (o\'smoqdami?) — eng muhim signal.' }} />
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>o'lcha → o'qi → tuzat</span></h2></div>
        <Mentor>Bot quruvchining to'liq yo'li — reja, o'lchov, tuzatish. Har qatorni bosing (bu PM1→PM2→PM3 ni bog'laydi).</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.chart(16)}</span><span className="cl-title">Bot quruvchi — metrika hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Reja → o'lchov → o'qish → tuzatish. Mana acquisition yo'lining to'liq halqasi.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Metrika: <span className="italic" style={{ color: T.accent }}>o'lcha · o'qi · qaror</span></h2></div>
      <Mentor>Yodda tuting: DAU/retention/komandani o'lcha, trendni o'qi, raqam asosida qaror qabul qil.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>📊</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Raqam — kompas</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>His emas — ma'lumot asosida boshqaring.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">3 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.ruler(18), c: T.accent, t: 'O\'LCHA — DAU, retention, komandalar' }, { ic: Ico.trend(18), c: T.blue, t: 'O\'QI — trend va naqshni ko\'r' }, { ic: Ico.check(18), c: T.success, t: 'QAROR — raqam asosida, his emas' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: metrika hisoboti =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['DAU + retention: masalan "bugun 12 ishlatdi, 40% qaytdi"', 'Top komanda: masalan "/eslatma 90%"', 'Bitta qaror: raqam asosida nima qilaman'];
const LBL = ['DAU + Retention', 'Top komanda', 'Bitta qaror'];
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
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>birinchi metrika hisobotingiz</span></h2></div>
        <Mentor>Botingiz uchun: DAU/retention qancha, top komanda qaysi, va raqam asosida qanday qaror qabul qilasiz? Kamida 2 qatorni to'ldiring.</Mentor>
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
            <p className="flow-label">Sizning metrika hisobotingiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — hisobotingiz shu yerda yig'iladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.chart(15)}</span><span className="cl-title">Mening metrika hisobotim</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Bu — sizning birinchi metrika hisobotingiz. Endi raqam asosida boshqarasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN (CAPSTONE) =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['O\'lchanmagan narsa boshqarilmaydi', 'DAU, retention, komandalar — bot metrikalari', 'Vanity vs actionable: qaror beradigan raqam', 'Trend muhim; raqamni o\'qib qaror qil'];
  const HOMEWORK = [{ b: 'PM1 rejangizni ishga tushiring', t: '— 20+ real foydalanuvchi yig\'ing' }, { b: 'Metrika qo\'shing', t: '— DAU, retention, komandalarni kuzating' }, { b: 'Birinchi hisobot yozing', t: '— raqamni o\'qib, 1 qaror qabul qiling' }];
  const GLOSSARY = [{ b: 'DAU', t: '— kunlik faol foydalanuvchilar' }, { b: 'Retention', t: '— qaytib keluvchilar foizi' }, { b: 'Vanity metrika', t: '— chiroyli, lekin qaror bermaydi' }, { b: 'Trend', t: '— o\'sish yo\'nalishi (eng muhim)' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Acquisition yo'li tugadi!</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>raqam bilan</span> o'sasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! 3 PM darsda foydalanuvchi yig\'ish (strategiya), fikr olish (custdev) va o\'lchash (metrika)ni o\'rgandingiz. Endi botingizni real foydalanuvchilar bilan o\'stira olasiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <Zoomable><div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Acquisition yo'lini amalda yakunlang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">20+ real foydalanuvchi + birinchi hisobot! 📊</p></div>
        </div></Zoomable>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🧩</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>3 PM yoyi yakunlandi: yig'ish → so'rash → o'lchash</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Endi botingiz nafaqat ishlaydi, balki real foydalanuvchilar bilan o'sadi va yaxshilanadi.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson21({ lang: langProp, onFinished }) {
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

        /* === BOT O'SISH PANELI (s6) === */
        .dashboard { background: linear-gradient(165deg, #1f2c44 0%, ${CODE.bg} 100%); border-radius: 16px; padding: 15px; box-shadow: 0 14px 34px -12px rgba(${T.shadowBase},0.4); }
        .dash-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #ffffff14; margin-bottom: 12px; }
        .dash-title { font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: #fff; letter-spacing: 0.02em; }
        .dash-chartlbl { font-family: 'Manrope'; font-weight: 600; font-size: 10px; color: #9FB4D8; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 8px; }
        .dash-chart { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; height: 110px; }
        .dbar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; }
        .dbar { width: 100%; max-width: 26px; min-height: 4px; border-radius: 6px 6px 3px 3px; background: linear-gradient(to top, ${T.blue}, #4fc3e8); position: relative; transition: height 0.6s cubic-bezier(.2,.8,.2,1); box-shadow: 0 0 12px -2px ${T.blue}88; }
        .dbar-val { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; color: #cfe8f4; transition: opacity 0.3s; }
        .dbar-day { font-family: 'Manrope'; font-weight: 600; font-size: 10px; color: #6B7585; }
        .tile-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .mtile { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; border: none; border-radius: 12px; padding: 11px 10px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; }
        .mtile:hover { transform: translateY(-1px); }
        .mtile-ico { display: inline-flex; margin-bottom: 2px; }
        .mtile-val { font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(15px,2.4vw,19px); line-height: 1; }
        .mtile-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: ${T.ink}; }
        .mtile-sub { font-family: 'Manrope'; font-weight: 500; font-size: 9.5px; color: ${T.ink2}; }

        /* === DATA DETEKTIV (s8) === */
        .det-tabs { display: flex; gap: 7px; margin-bottom: 12px; }
        .det-tab { font-family: 'Manrope'; font-weight: 700; font-size: 12px; padding: 7px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink2}; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .det-tab.det-on { background: ${T.ink}; color: #fff; }
        .det-tab.det-done { background: ${T.successSoft}; color: ${T.success}; }
        .det-tab.det-done.det-on { background: ${T.success}; color: #fff; }
        .det-card { background: ${T.paper}; border-radius: 16px; padding: 16px 18px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2); }
        .det-stat { display: flex; align-items: center; gap: 12px; background: ${T.bg}; border-radius: 12px; padding: 13px 15px; margin-bottom: 12px; }
        .det-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(15px,2.4vw,20px); color: ${T.ink}; }
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
