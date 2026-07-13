import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 12-DARS (Modul 4 · PM2) — XAVFSIZLIK = FOYDALANUVCHI ISHONCHI — PLATFORM STANDARD v16
// G'oya: xavfsizlik faqat texnik vazifa emas — MAHSULOT QIYMATI. Mijoz ma'lumotini ishonib topshiradi (omonat).
//        .env = sirlar kaliti (kodda qoldirma); GitHub leak; GDPR oddiy tilda (faqat keraklisini yig', himoyala).
// Metafora: Ishonch = omonat — bank xavfsiz bo'lsa pul qo'yasan, sayt xavfsiz bo'lsa ma'lumot berasan.
// Signature 1: "Sirlarni .env'ga ko'chir" + GitHub leak simulyatsiyasi.
// Signature 2: "Ishonch o'lchagichi" — xavfsizlik qarorlari, tarozi to'ladi.
// Mahsulot: AvtoIjara (cars — mijoz telefoni/pasporti/to'lovi). AUDIOSIZ.
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
  lock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>),
  key: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="8" cy="15" r="3.4" /><path d="M10.4 12.6L20 3M16.5 6.5l2.5 2.5M14.2 8.8l2 2" /></svg>),
  shield: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>),
  cloud: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M7 18a4 4 0 0 1-.5-8 5 5 0 0 1 9.6-1.4A3.5 3.5 0 0 1 17.5 18H7z" /><path d="M12 13v6M9.5 15.5L12 13l2.5 2.5" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  eyeOff: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.4 5.2A9 9 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.5M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9 9 0 0 0 3-.5" /></svg>),
  car: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 13l2.2-5.2a2 2 0 0 1 1.8-1.2h10a2 2 0 0 1 1.8 1.2L21 13v4H3v-4z" /><path d="M3 13h18" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /></svg>),
  coin: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M9.7 9.6a2.3 1.9 0 0 1 4.6.2c0 1-1 1.5-2.3 1.7s-2.3.8-2.3 1.8a2.3 1.9 0 0 0 4.6.2" /></svg>)
};

const LESSON_META = { lessonId: 'pm-security-trust-12-v16', lessonTitle: { uz: 'Xavfsizlik = foydalanuvchi ishonchi', ru: 'Безопасность = доверие пользователей' } };
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
// Ishonch = omonat (s2)
const BANK = ['Pulingizni ishonib qo\'yasiz', 'Seyf, qo\'riqchi, kamera bor', 'Xavfsiz bo\'lsa — yana qo\'yasiz'];
const SITE = ['Ma\'lumotingizni ishonib berasiz', 'Parol, .env, HTTPS — himoya', 'Xavfsiz bo\'lsa — yana ishlatasiz'];

// AvtoIjara nima saqlaydi + xavf (s3)
const STORED = [
  { id: 'phone', label: 'Telefon raqami', emoji: '📞', risk: 'Spam va firibgarlik qo\'ng\'iroqlari, SMS-aldov.' },
  { id: 'passport', label: 'Pasport ma\'lumoti', emoji: '🪪', risk: 'Shaxsni o\'g\'irlash (identity theft) — nomingizga kredit.' },
  { id: 'plate', label: 'Mashina raqami + bron tarixi', emoji: '🚗', risk: 'Kim qayerda yurganini biladi — kuzatuv, xavfsizlik.' },
  { id: 'pay', label: 'To\'lov ma\'lumoti', emoji: '💳', risk: 'Pulni to\'g\'ridan-to\'g\'ri o\'g\'irlash.' }
];

// Sirlar (s6 signature)
const SECRETS = [
  { id: 'db', k: 'DB_PASSWORD', v: 'parol123', risk: 'Baza ochiladi — barcha mijoz telefoni va pasporti tashqarida.' },
  { id: 'jwt', k: 'JWT_SECRET', v: 'maxfiy_kalit', risk: 'Soxta token bilan istalgan mijoz hisobiga kirish.' },
  { id: 'api', k: 'SMS_API_KEY', v: 'sk_live_92xk', risk: 'SMS xizmati sizning pulingizga ishlatiladi.' }
];

// GDPR — kerak vs ortiqcha (s8)
const COLLECT = [
  { id: 'phone', label: 'Telefon raqami', need: true, why: 'Bronni tasdiqlash uchun zarur.' },
  { id: 'name', label: 'Ism', need: true, why: 'Kimga ijara berilganini bilish kerak.' },
  { id: 'car', label: 'Qaysi mashina kerak', need: true, why: 'Bronning o\'zi — albatta kerak.' },
  { id: 'scan', label: 'Pasport skani (har doim)', need: false, why: 'Ko\'pincha shart emas — saqlasangiz, xavf ortadi.' },
  { id: 'gps', label: 'Doimiy GPS joylashuv', need: false, why: 'Bronga keraksiz — bu kuzatuv.' },
  { id: 'contacts', label: 'Telefon kontaktlari', need: false, why: 'Mutlaqo keraksiz — yig\'ish o\'zi xavf.' }
];

// Ishonch qarorlari (s10 signature)
const DECISIONS = [
  { id: 'secret', q: 'Maxfiy parol/kalit', a: 'Kodda — GitHub\'ga ketadi', b: '.env faylida (maxfiy)' },
  { id: 'hash', q: 'Foydalanuvchi paroli', a: 'Ochiq matn (plain)', b: 'Hash qilib (shifrlangan)' },
  { id: 'collect', q: 'Ma\'lumot yig\'ish', a: 'Hammasi (pasport, GPS)', b: 'Faqat kerakli (telefon, mashina)' },
  { id: 'https', q: 'Server ulanishi', a: 'HTTP (ochiq)', b: 'HTTPS (shifrlangan)' }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'XATO', color: T.accent, text: 'Dasturchi JWT_SECRET\'ni kodda qoldirib GitHub\'ga yukladi', why: '"Tez bo\'lsin" dedi — bir qatorlik e\'tiborsizlik.' },
  { tag: 'LEAK', color: T.honey, text: 'Hacker repozitoriydan kalitni topdi, bazani ochdi', why: '5000 mijoz telefoni va pasporti tashqariga chiqdi.' },
  { tag: 'ZARAR', color: T.grape, text: 'Yangilikda chiqdi, mijozlar ishonchni yo\'qotdi', why: 'Ko\'pchilik boshqa saytga ketdi — daromad qulab tushdi.' },
  { tag: 'TUZATISH', color: T.success, text: 'Sirlar .env\'ga, parollar hash\'ga, HTTPS yoqildi', why: 'Xavfsizlik poydevor edi — ishonch asta tiklandi.' }
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

// ===== SCREEN 0 — HOOK (mijoz pasport berishdan qo'rqadi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('client');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Texnik talab — dasturchi ishi, PM\'ga aloqasi yo\'q' },
    { id: 'b', label: 'Foydalanuvchi ishonchi — xavfsiz bo\'lmasa, mijoz ma\'lumot bermaydi' },
    { id: 'c', label: 'Muhim emas — asosiysi sayt ishlasin' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'client'
    ? { who: 'Mijoz', emoji: '😟', say: 'Bron uchun pasport va karta so\'rayapti... Ma\'lumotim xavfsizmi? Ishonsam bo\'ladimi?', ok: false }
    : { who: 'Dasturchi', emoji: '😅', say: 'Xavfsizlikni keyin o\'ylaymiz — hozir ishlasa bo\'ldi. Parolni ham tezlik uchun to\'g\'ridan kodga yozib qo\'ya qoldim.', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Mijoz pasportini berishdan <span className="italic" style={{ color: T.accent }}>qo'rqyapti</span> — nega muhim?</h1>
        <Mentor>AvtoIjara bron uchun shaxsiy ma'lumot so'raydi. Mijoz ikkilanadi, dasturchi esa beparvo. Har birini bosing.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'client' ? 'chip-on' : ''}`} onClick={() => setV('client')}>Mijoz 😟</button>
              <button className={`chip ${v === 'dev' ? 'chip-on' : ''}`} onClick={() => setV('dev')}>Dasturchi 😅</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.accent : T.blue}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Xavfsizlik nega muhim?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Xavfsizlik — faqat texnik vazifa emas. Mijoz ma'lumotini sizga <b>ishonib topshiradi</b>. Xavfsiz bo'lmasa — ishonmaydi, ma'lumot bermaydi, qaytmaydi. Demak bu <b>mahsulot qiymati</b>.</p>}
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
    { text: 'Ishonch = mahsulot poydevori (omonat metaforasi)', tag: '' },
    { text: '.env — sirlar kaliti, kodda qoldirma', tag: '' },
    { text: 'GitHub leak — bitta xato, butun baza ochiq', tag: 'jonli' },
    { text: 'GDPR oddiy tilda: faqat keraklisini yig\', himoyala', tag: '' },
    { text: 'Xavfsizlik qarorlari = ishonch o\'lchagichi', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.success} soft={T.successSoft}>{Ico.shield(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Xavfsizlik = ishonch</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Mijoz ma'lumotini himoyalash — texnik emas, mahsulot qarori.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ AvtoIjara: telefon, pasport, to'lov — omonat</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Mijoz ma'lumotini qanday himoyalaymiz?</span></h2></div>
        <Mentor>Backend ma'lumot saqlagani uchun endi <b style={{ color: T.ink }}>mas'uliyat</b> ham bor. Xavfsizlik nega mahsulot qiymati ekanini ko'ramiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — ISHONCH = OMONAT (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('bank');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['bank', 'site']) : new Set(['bank']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'bank' ? BANK : SITE;
  return (
    <Stage eyebrow="Metafora" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumot — bu <span className="italic" style={{ color: T.accent }}>omonat</span></h2></div>
        <Mentor>Bankka pulingizni faqat <b style={{ color: T.ink }}>ishonsangiz</b> qo'yasiz. Saytga ma'lumotingizni ham xuddi shunday. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'bank' ? 'chip-on' : ''}`} onClick={() => set('bank')}>🏦 Bank (pul)</button>
              <button className={`chip ${v === 'site' ? 'chip-on' : ''}`} onClick={() => set('site')}>🌐 Sayt (ma'lumot)</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${T.success}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: T.success, display: 'inline-flex' }}>{v === 'bank' ? Ico.coin(16) : Ico.lock(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            <div className="frame-soft fade-step" key={v}><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{v === 'bank' ? 'Bank' : 'Sayt'}</p><p className="body" style={{ margin: 0, color: T.ink }}>{v === 'bank' ? 'Bank bir marta o\'g\'irlansa — hech kim u yerga pul qo\'ymaydi. Ishonch yo\'qoladi.' : 'Sayt bir marta sizib chiqsa — hech kim ma\'lumot bermaydi. Aynan shu — biznes uchun o\'lim.'}</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xavfsizlik — bu mijoz bilan <b>ishonch shartnomasi</b>. PM buni e'tiborsiz qoldirolmaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — NIMA SAQLANADI + XAVF =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(STORED.map(s => s.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= STORED.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? STORED.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="Nima xavf ostida" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${STORED.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoIjara nimani saqlaydi — va <span className="italic" style={{ color: T.accent }}>sizib chiqsa</span> nima bo'ladi?</h2></div>
        <Mentor>Bu shunchaki "ma'lumot" emas — har biri xavf. Har qatorni bosib, sizib chiqsa nima bo'lishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STORED.map(s => (<button key={s.id} onClick={() => tap(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === s.id ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -8px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 20 }}>{s.emoji}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{s.label}</span>{seen.has(s.id) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: T.accent, background: T.accentSoft }}>Sizib chiqsa</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>{cur.risk}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bir ma'lumot — mas'uliyat. Saqlasangiz, <b>himoyalashga majbursiz</b>.</p></div>}
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
    questionText="Nega xavfsizlik PM (mahsulot) masalasi, faqat texnik emas?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega xavfsizlik <span className="italic" style={{ color: T.accent }}>mahsulot</span> masalasi?</h2></>}
    options={['Chunki kod chiroyli ko\'rinadi', 'Chunki xavfsiz bo\'lmasa mijoz ishonmaydi, ma\'lumot bermaydi, qaytmaydi', 'Chunki dasturchiga ish beradi', 'Aslida muhim emas']} correctIdx={1}
    explainCorrect="To'g'ri! Xavfsizlik = ishonch. Mijoz ishonmasa, ma'lumot bermaydi yoki sizib chiqsa ketadi — bu to'g'ridan-to'g'ri biznesga ta'sir qiladi."
    explainWrong={{ 0: 'Ko\'rinish emas — gap mijoz ishonchida.', 2: 'Maqsad ish berish emas — mijoz ma\'lumotini saqlash.', 3: 'Aksincha — bu eng muhim mahsulot masalalaridan biri.', default: 'Xavfsizlik = ishonch = mijoz qaytadi.' }} />
);

// ===== SCREEN 5 — .env = KALIT =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('code');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['code', 'env']) : new Set(['code']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow=".env = kalit" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Maxfiy parol — kodda emas, <span className="italic" style={{ color: T.accent }}>.env</span>'da</h2></div>
        <Mentor><b style={{ color: T.ink }}>.env</b> — sirlar uchun maxfiy fayl, GitHub'ga yuklanmaydi (.gitignore). Kalitni eshik tagiga qo'ymaganday — uni yashirin joyda saqlang. Ikkalasini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'code' ? 'chip-on' : ''}`} onClick={() => set('code')}>📄 Kodda (ochiq)</button>
              <button className={`chip ${v === 'env' ? 'chip-on' : ''}`} onClick={() => set('env')}>🔒 .env (maxfiy)</button>
            </div>
            <div key={v} className="codeblk demo-swap">
              <div className="codeblk-bar"><span className="cb-dot" style={{ background: '#FF5F57' }} /><span className="cb-dot" style={{ background: '#FEBC2E' }} /><span className="cb-dot" style={{ background: '#28C840' }} /><span className="cb-name">{v === 'code' ? 'server.js' : '.env'}</span></div>
              <pre className="codeblk-body">{v === 'code'
                ? <><span style={{ color: CODE.comment }}>{'// ⚠️ hammaga ko\'rinadi\n'}</span><span style={{ color: CODE.punct }}>{'const db = connect('}</span><span style={{ color: CODE.str }}>{'"parol123"'}</span><span style={{ color: CODE.punct }}>{')'}</span></>
                : <><span style={{ color: CODE.comment }}>{'# maxfiy, GitHub\'ga ketmaydi\n'}</span><span style={{ color: CODE.attr }}>{'DB_PASSWORD'}</span><span style={{ color: CODE.text }}>{'='}</span><span style={{ color: CODE.str }}>{'parol123'}</span></>}</pre>
            </div>
          </Col>
          <Col>
            {v === 'code'
              ? <div className="frame-warn fade-step" key="c"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Xavfli</p><p className="body" style={{ margin: 0, color: T.ink }}>Parol kodda → GitHub'ga yuklanadi → hamma o'qiydi → bazaga kiradi.</p></div>
              : <div className="frame-success fade-step" key="e"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Xavfsiz</p><p className="body" style={{ margin: 0, color: T.ink }}>Parol .env'da → GitHub'ga ketmaydi → faqat server biladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: <b>hech qachon</b> parol/kalitni to'g'ridan kodga yozma. Doim .env.</p></div>}
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
    questionText="Maxfiy parol va kalitlarni qayerda saqlash kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Maxfiy parol/kalitni <span className="italic" style={{ color: T.accent }}>qayerda</span> saqlash kerak?</h2></>}
    options={['To\'g\'ridan kodda — tez bo\'ladi', '.env faylida (GitHub\'ga ketmaydi)', 'README faylida', 'Sayt sarlavhasida']} correctIdx={1}
    explainCorrect="To'g'ri! .env — maxfiy fayl, .gitignore'ga qo'shiladi va GitHub'ga yuklanmaydi. Faqat server o'qiydi."
    explainWrong={{ 0: 'Kodda qolsa GitHub\'ga ketadi — eng keng tarqalgan xavfsizlik xatosi.', 2: 'README ham repozitoriyda — ochiq. Xavfli.', 3: 'Sarlavha — hammaga ko\'rinadi. Mutlaqo xato.', default: 'Maxfiy ma\'lumot — .env\'da.' }} />
);

// ===== SCREEN 6 — SIRLARNI .env'GA KO'CHIR (SIGNATURE) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [loc, setLoc] = useState(() => storedAnswer ? Object.fromEntries(SECRETS.map(s => [s.id, 'env'])) : Object.fromEntries(SECRETS.map(s => [s.id, 'code'])));
  const [phase, setPhase] = useState(storedAnswer ? 'safe' : 'idle'); // idle | leaked | safe
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const allEnv = SECRETS.every(s => loc[s.id] === 'env');
  const done = phase === 'safe';
  const move = (id) => { if (done) return; clearTimeout(timer.current); setPhase('idle'); setLoc(prev => ({ ...prev, [id]: 'env' })); };
  const push = () => { if (phase === 'safe') return; setPhase(allEnv ? 'safe' : 'leaked'); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const inCode = SECRETS.filter(s => loc[s.id] === 'code');
  const inEnv = SECRETS.filter(s => loc[s.id] === 'env');
  const leakedSecret = inCode[0];
  return (
    <Stage eyebrow="Sirlarni himoyala" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Repozitoriyni xavfsiz qiling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoIjara sirlarini <span className="italic" style={{ color: T.accent }}>.env</span>'ga ko'chiring</h2></div>
        <Mentor>Kodda 3 ta maxfiy sir ochiq turibdi. Har birini bosib <b style={{ color: T.ink }}>.env</b>'ga ko'chiring, keyin <b style={{ color: T.ink }}>"GitHub'ga yuklash"</b>ni bosing — nima bo'lishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className={`vault zone-code ${phase === 'leaked' ? 'zone-leak' : ''}`}>
              <div className="vault-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.eye(15)}</span><span className="vault-title">Kod — GitHub'ga ketadi</span></div>
              {inCode.length === 0 ? <p className="small" style={{ color: T.success, fontStyle: 'italic', margin: '6px 0' }}>✓ Kodda sir qolmadi</p>
                : inCode.map(s => (<button key={s.id} className="secret" onClick={() => move(s.id)}><span className="mono secret-k">{s.k}</span><span className="mono secret-v">={s.v}</span><span className="secret-move">→ .env</span></button>))}
            </div>
            <div className="vault zone-env">
              <div className="vault-head"><span style={{ display: 'inline-flex', color: T.success }}>{Ico.lock(15)}</span><span className="vault-title">.env — maxfiy (.gitignore)</span></div>
              {inEnv.length === 0 ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 0' }}>Bo'sh — sirlarni shu yerga ko'chiring</p>
                : inEnv.map(s => (<div key={s.id} className="secret secret-safe feat-pop"><span className="mono secret-k">{s.k}</span><span className="mono secret-v">={s.v}</span><span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span></div>))}
            </div>
            {phase !== 'safe' && <button className="btn" onClick={push} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ display: 'inline-flex' }}>{Ico.cloud(17)}</span>GitHub'ga yuklash</button>}
          </Col>
          <Col>
            {phase === 'idle' && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Kodda sir qolsa — GitHub'ga yuklanganda hamma o'qiydi. Avval hammasini .env'ga ko'chiring.</p></div>}
            {phase === 'leaked' && leakedSecret && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>🚨 Leak! Repozitoriy ochildi</p><p className="body" style={{ margin: '0 0 8px', color: T.ink }}>Hacker <b className="mono">{leakedSecret.k}</b> ni topdi: {leakedSecret.risk}</p><p className="body" style={{ margin: 0, color: T.ink2 }}>Qolgan sirni ham .env'ga ko'chiring va qayta urinib ko'ring.</p></div>}
            {phase === 'safe' && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>🛡️</div><p className="ta-h">Repozitoriy xavfsiz!</p><p className="ta-sub">Barcha sir .env'da — GitHub'ga faqat kod ketdi, parollar yashirin qoldi</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — LEAK OQIBATI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('safe');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['safe', 'leak']) : new Set(['safe']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Leak oqibati" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta sizib chiqish — <span className="italic" style={{ color: T.accent }}>butun biznes</span></h2></div>
        <Mentor>Bitta sir sizib chiqsa zanjir uzun. Himoyalangan va sizib chiqgan holatni solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'safe' ? 'chip-on' : ''}`} onClick={() => set('safe')}>🔒 Himoyalangan</button>
              <button className={`chip ${v === 'leak' ? 'chip-on' : ''}`} onClick={() => set('leak')}>💥 Sizib chiqgan</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'safe' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'safe' ? '😌' : '😱'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'safe'
                ? 'Sirlar .env\'da, parollar hash\'da. Hacker hech narsa topolmaydi. Mijoz tinch ishlaydi.'
                : 'Kalit GitHub\'da → baza ochildi → 5000 mijoz ma\'lumoti o\'g\'irlandi → yangilik → mijozlar ketdi → jarima.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'safe'
              ? <div className="frame-success fade-step" key="s"><p className="body" style={{ margin: 0, color: T.ink }}>Himoya — arzon. Bir necha qator kod, bir oz e'tibor.</p></div>
              : <div className="frame-warn fade-step" key="l"><p className="body" style={{ margin: 0, color: T.ink }}>Zarar — qimmat. Pul, obro', mijoz — hammasi birato'la.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ishonchni qurish yillar, buzish — bir soniya. Oldini olish 100x arzon.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — GDPR: kerak vs ortiqcha (classify) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [marks, setMarks] = useState(() => storedAnswer ? Object.fromEntries(COLLECT.map(c => [c.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(marks).length >= COLLECT.length;
  const classify = (item, asNeed) => {
    if (marks[item.id]) return;
    if (asNeed === item.need) { setMarks(prev => ({ ...prev, [item.id]: true })); setWrong(null); }
    else setWrong(item.id);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="GDPR · ma'lumot yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(marks).length}/${COLLECT.length} saralang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">GDPR oddiy tilda: <span className="italic" style={{ color: T.accent }}>faqat keraklisini</span> yig'</h2></div>
        <Mentor>Eng kam ma'lumot qoidasi: nima zarur bo'lsa, shuni so'ra. Ortiqcha ma'lumot = ortiqcha xavf. Har birini <b style={{ color: T.success }}>Kerak</b> yoki <b style={{ color: T.accent }}>Ortiqcha</b> deb belgilang.</Mentor>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640, width: '100%', margin: '0 auto' }}>
          {COLLECT.map(c => { const m = marks[c.id]; const isWrong = wrong === c.id; return (
            <div key={c.id} className={`classify-row ${m ? (c.need ? 'cr-need' : 'cr-extra') : ''} ${isWrong ? 'shake-x' : ''}`}>
              <span style={{ flex: 1, fontFamily: "'Manrope'", fontWeight: 600, fontSize: 'clamp(13px,1.6vw,14.5px)', color: T.ink }}>{c.label}</span>
              {m ? (<span className="mono small" style={{ fontWeight: 700, color: c.need ? T.success : T.accent }}>{c.need ? '✓ Kerak' : '✗ Ortiqcha'}{!c.need && <span style={{ color: T.ink2, fontWeight: 500 }}> — {c.why}</span>}</span>)
                : (<span style={{ display: 'flex', gap: 6 }}><button className="cls-btn cls-need" onClick={() => classify(c, true)}>Kerak</button><button className="cls-btn cls-extra" onClick={() => classify(c, false)}>Ortiqcha</button></span>)}
            </div>
          ); })}
        </div>
        {wrong && !done && <p className="small" style={{ color: T.accent, textAlign: 'center', margin: 0 }}>Qaytadan o'ylab ko'ring — bron uchun haqiqatan kerakmi?</p>}
        {done && <div className="frame-success fade-step" style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Kam ma'lumot = kam xavf. Yig'masangiz — sizib chiqolmaydi ham.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="GDPR (ma'lumot himoyasi) ning asosiy qoidasi qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>GDPR ning asosiy <span className="italic" style={{ color: T.accent }}>qoidasi</span> qaysi?</h2></>}
    options={['Imkon qadar ko\'p ma\'lumot yig\'', 'Faqat kerakli ma\'lumotni yig\' va uni himoyala', 'Hech qanday ma\'lumot yig\'ma', 'Ma\'lumotni hammaga ko\'rsat']} correctIdx={1}
    explainCorrect="To'g'ri! Asosiy g'oya: kam ma'lumot (faqat kerakli) + himoya. Yig'magan ma'lumotingiz sizib chiqolmaydi."
    explainWrong={{ 0: 'Aksincha — ko\'p yig\'ish ko\'p xavf. Faqat keraklisi.', 2: 'Umuman yig\'maslik ham noto\'g\'ri — bron uchun telefon kerak. Faqat keraklisi.', 3: 'Ko\'rsatish — eng katta buzilish. Himoya kerak.', default: 'GDPR: faqat keraklisini yig\' va himoyala.' }} />
);

// ===== SCREEN 10 — ISHONCH O'LCHAGICHI (SIGNATURE 2) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pick, setPick] = useState(() => storedAnswer?.pick || (storedAnswer ? Object.fromEntries(DECISIONS.map(d => [d.id, 'b'])) : {}));
  const workRef = useRef(null);
  const goodCount = DECISIONS.filter(d => pick[d.id] === 'b').length;
  const pct = Math.round((goodCount / DECISIONS.length) * 100);
  const done = goodCount === DECISIONS.length;
  const set = (id, v) => { if (done) return; setPick(prev => ({ ...prev, [id]: v })); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, pick });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  return (
    <Stage eyebrow="Ishonch o'lchagichi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Xavfsiz tanlovni qiling (${goodCount}/${DECISIONS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har qaror — <span className="italic" style={{ color: T.accent }}>ishonch</span>ni oshiradi yoki buzadi</h2></div>
        <Mentor>AvtoIjara uchun 4 ta xavfsizlik qarori. Har birida <b style={{ color: T.ink }}>xavfsiz</b> variantni tanlang — o'ngda ishonch tarozisi to'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {DECISIONS.map(d => (<div key={d.id}><p className="flow-label" style={{ margin: '0 0 6px' }}>{d.q}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['a', 'b'].map(v => { const on = pick[d.id] === v; return (<button key={v} onClick={() => set(d.id, v)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 13px', fontFamily: G, fontSize: 13.5, color: on ? '#fff' : T.ink, background: on ? (v === 'b' ? T.success : T.accent) : T.paper, boxShadow: on ? `0 6px 14px -6px ${v === 'b' ? T.success : T.accent}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}>{d[v]}</button>); })}</div></div>))}
          </Col>
          <Col>
            <p className="flow-label">Ishonch darajasi</p>
            <div className="trust-box">
              <div className="trust-top"><span style={{ display: 'inline-flex', color: done ? T.success : T.ink3 }}>{done ? Ico.shield(34) : Ico.lock(34)}</span><span className="trust-pct" style={{ color: pct >= 75 ? T.success : pct >= 50 ? T.honey : T.accent }}>{pct}%</span></div>
              <div className="trust-track"><div className="trust-fill" style={{ width: `${pct}%`, background: pct >= 75 ? T.success : pct >= 50 ? T.honey : T.accent }} /></div>
              <p className="small" style={{ color: T.ink2, margin: '6px 0 0', textAlign: 'center' }}>{done ? 'To\'liq himoyalangan — mijoz ishonadi' : `${DECISIONS.length - goodCount} ta qaror hali xavfli`}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>100%! Sirlar .env, parol hash, kam ma'lumot, HTTPS — mijoz xotirjam.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ISHONCH BUZILADI vs ORTADI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('build');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['build', 'break']) : new Set(['build']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ishonch" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ishonch — <span className="italic" style={{ color: T.accent }}>asta quriladi</span>, bir soniyada buziladi</h2></div>
        <Mentor>Xavfsizlik ko'rinmaydi, lekin mijoz uni his qiladi. Ikki yo'lni solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'build' ? 'chip-on' : ''}`} onClick={() => set('build')}>📈 Ishonch ortadi</button>
              <button className={`chip ${v === 'break' ? 'chip-on' : ''}`} onClick={() => set('break')}>📉 Ishonch buziladi</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'build' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'build' ? '🤝' : '🚪'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'build'
                ? 'Ma\'lumot xavfsiz, HTTPS qulfi ko\'rinadi, kam so\'raladi → mijoz xotirjam → do\'stiga tavsiya qiladi.'
                : 'Bir marta sizib chiqdi → yangilik → mijoz "endi hech qachon" deydi → boshqalar ham eshitadi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'build'
              ? <div className="frame-success fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Xavfsizlik — sokin afzallik. Mijozni ushlab turadi.</p></div>
              : <div className="frame-warn fade-step" key="k"><p className="body" style={{ margin: 0, color: T.ink }}>Bir leak — yillik mehnatni yo'qqa chiqaradi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun xavfsizlik — birinchi kundan, "keyin" emas.</p></div>}
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
    questionText="AvtoIjara parolni kodda qoldirib GitHub'ga yukladi. Eng katta xavf?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Parol kodda qolib GitHub'ga ketdi — eng katta <span className="italic" style={{ color: T.accent }}>xavf</span>?</h2></>}
    options={['Sayt sekin ishlaydi', 'Hacker bazani ochadi — barcha mijoz ma\'lumoti o\'g\'irlanadi', 'Logotip o\'zgaradi', 'Hech narsa bo\'lmaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Parol ochiq bo'lsa, kim bo'lmasin bazaga kiradi — 5000 mijozning telefoni, pasporti, to'lovi o'g'irlanadi. Ishonch va biznes qulaydi."
    explainWrong={{ 0: 'Tezlik emas — gap ma\'lumot o\'g\'irlanishida.', 2: 'Logotip emas — butun baza xavf ostida.', 3: 'Aksincha — bu eng jiddiy buzilishlardan biri.', default: 'Ochiq parol → baza ochiladi → mijoz ma\'lumoti o\'g\'irlanadi.' }} />
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>bir qator xato</span> — katta zarar</h2></div>
        <Mentor>AvtoIjara'da bo'lgan voqea — 4 qadam. Har qatorni bosib, xavfsizlik nega PM masalasi ekanini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.car(16)}</span><span className="cl-title">AvtoIjara — xavfsizlik hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xato → leak → zarar → tuzatish. Oldini olish arzon edi. Endi o'zingiznikini yozasiz.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Ma'lumot — <span className="italic" style={{ color: T.accent }}>omonat</span>, himoyala</h2></div>
      <Mentor>Mijoz ma'lumotini ishonib bergan. Uni 3 narsa bilan himoyalang: sirlar .env'da, faqat keraklisini yig', parol hash + HTTPS.</Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🛡️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Ishonch shartnomasi</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Xavfsizlik buziladi-yu, mijoz qaytmaydi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Himoya — 3 shart</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.key(18), c: T.accent, t: 'SIRLAR .env\'da (kodda emas)' }, { ic: Ico.eyeOff(18), c: T.blue, t: 'FAQAT keraklisini yig\' (GDPR)' }, { ic: Ico.lock(18), c: T.success, t: 'PAROL hash + HTTPS' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: ma'lumot + himoya =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Telefon — .env va HTTPS bilan himoyalayman…', 'Parol — hash qilib saqlayman…', 'Faqat kerakli ma\'lumotni yig\'aman…'];
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
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangiz uchun: <span className="italic" style={{ color: T.accent }}>qaysi ma'lumot + qanday himoya</span></h2></div>
        <Mentor>Loyihangiz qaysi ma'lumotni saqlaydi va uni qanday himoyalaysiz? Kamida <b style={{ color: T.ink }}>2 ta</b> yozing.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>Ma'lumot + himoya {i + 1}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning himoya rejangiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — himoya rejangiz shu yerda paydo bo'ladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.shield(15)}</span><span className="cl-title">Himoya rejasi</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi ma'lumotni mas'uliyat bilan saqlaysiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Xavfsizlik = ishonch = mahsulot qiymati', 'Sirlar .env\'da — hech qachon kodda (GitHub leak)', 'GDPR: faqat kerakli ma\'lumotni yig\' va himoyala', 'Bir leak — yillik ishonchni yo\'q qiladi'];
  const HOMEWORK = [{ b: 'Loyihangizni tekshiring', t: '— parol/kalit kodda qolmaganmi? .env bormi?' }, { b: 'Ma\'lumotni qisqartiring', t: '— qaysi ortiqcha ma\'lumotni yig\'masangiz ham bo\'ladi?' }, { b: 'Himoya rejasi yozing', t: '— har ma\'lumot qanday himoyalanadi' }];
  const GLOSSARY = [{ b: '.env', t: '— maxfiy sozlamalar fayli (GitHub\'ga ketmaydi)' }, { b: 'Hash', t: '— parolni qaytarib bo\'lmas shaklga shifrlash' }, { b: 'GDPR', t: '— ma\'lumotni kam yig\', himoyala qoidasi' }, { b: 'HTTPS', t: '— shifrlangan, xavfsiz ulanish' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>ishonchni himoyalaysiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Xavfsizlik = ishonch, .env, GDPR va himoya qarorlarini bilasiz. Keyingi darsda — ma\'lumot sxemasini PRD hujjati sifatida loyihalaymiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Xavfsizlik ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Ishonch — eng qimmat aktiv. Himoyala! 🛡️</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>📋</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi PM: Sxema = PRD hujjati</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Ma'lumotlar bazasi sxemasi — jamoa o'qiydigan mahsulot hujjati. Uni AvtoStoyanka uchun loyihalaymiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson12({ lang: langProp, onFinished }) {
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

        /* === KOD BLOK === */
        .codeblk { background: ${CODE.bg}; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); }
        .codeblk-bar { display: flex; align-items: center; gap: 6px; padding: 9px 13px; border-bottom: 1px solid #ffffff14; }
        .cb-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
        .cb-name { font-family: 'JetBrains Mono'; font-size: 11px; color: #9FB4D8; margin-left: 8px; }
        .codeblk-body { font-family: 'JetBrains Mono'; font-size: clamp(12px,1.6vw,14px); line-height: 1.7; padding: 14px 16px; margin: 0; white-space: pre-wrap; color: ${CODE.text}; }

        /* === VAULT (sirlar .env) === */
        .vault { border-radius: 13px; padding: 12px 14px; display: flex; flex-direction: column; gap: 7px; transition: all 0.25s; }
        .zone-code { background: ${T.paper}; box-shadow: inset 0 0 0 1.5px ${T.ink3}55, 0 6px 16px -10px rgba(${T.shadowBase},0.2); }
        .zone-code.zone-leak { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 22px -8px rgba(255,79,40,0.4); animation: shake 0.42s; }
        .zone-env { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}66; }
        .vault-head { display: flex; align-items: center; gap: 8px; padding-bottom: 7px; border-bottom: 1px solid ${T.ink3}33; }
        .vault-title { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; }
        .secret { display: flex; align-items: center; gap: 7px; width: 100%; text-align: left; border: none; border-radius: 9px; padding: 9px 11px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -8px rgba(${T.shadowBase},0.2); }
        .secret:hover { transform: translateX(2px); }
        .secret-safe { cursor: default; background: ${T.paper}; }
        .secret-k { font-weight: 700; font-size: 12px; color: ${T.accent}; }
        .secret-safe .secret-k { color: ${T.success}; }
        .secret-v { font-size: 12px; color: ${T.ink2}; }
        .secret-move { margin-left: auto; font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.blue}; }

        /* === GDPR classify === */
        .classify-row { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 11px; padding: 10px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; flex-wrap: wrap; }
        .classify-row.cr-need { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}55; }
        .classify-row.cr-extra { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}55; }
        .cls-btn { font-family: 'Manrope'; font-weight: 700; font-size: 12px; border: none; border-radius: 8px; padding: 6px 12px; cursor: pointer; transition: all 0.16s; }
        .cls-need { background: ${T.successSoft}; color: ${T.success}; } .cls-need:hover { background: ${T.success}; color: #fff; }
        .cls-extra { background: ${T.accentSoft}; color: ${T.accent}; } .cls-extra:hover { background: ${T.accent}; color: #fff; }

        /* === TRUST METER === */
        .trust-box { background: ${T.paper}; border-radius: 14px; padding: 16px 18px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }
        .trust-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .trust-pct { font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(26px,4vw,34px); line-height: 1; }
        .trust-track { height: 12px; background: ${T.bg}; border-radius: 99px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(${T.shadowBase},0.2); }
        .trust-fill { height: 100%; border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1), background 0.3s; }

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
