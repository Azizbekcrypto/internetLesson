import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · P2 (LOYIHA KUNI) — PRAKTIKA: MOBIL ILOVA — v16 (AUDIOSIZ)
// G'oya: mini-do'konning MOBIL versiyasini qurish (React Native) — o'sha backendga ulanadi (bitta tizim).
//        Loyiha kuni: T6/T7 da sintaksisni o'rgandingiz — bugun QURASIZ, telefonda TEST qilasiz, Expo Go bilan DEPLOY qilasiz.
// Mahsulot: mini-do'kon mobil — List → Detail → Savat → Checkout (o'sha Node.js/PostgreSQL backend) → ulashiladigan ilova.
// Joylashuv: T7 (RN ilova) dan keyin, PM3 dan oldin.
// Falsafa: SIZ — DIREKTOR, AI — ISHCHI. Siz aniq buyurasiz, AI kod yozadi, siz telefonda o'qib testlaysiz.
// Signature 1: Mobil ilova quruvchi (telefon ramkasida jonli build). Signature 2: Expo Go deploy (QR → do'st telefoni).
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
  phone: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></svg>),
  link: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.5 1.5" /><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.5-1.5" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" /></svg>),
  repeat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 9a6 6 0 0 1 10-3l3 2" /><path d="M20 15a6 6 0 0 1-10 3l-3-2" /><path d="M17 4v4h-4M7 20v-4h4" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  bug: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="8" y="7" width="8" height="11" rx="4" /><path d="M9 4l1.5 2M15 4l-1.5 2M4 10h3M17 10h3M4 15h3M17 15h3M12 7v11" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>),
  send: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M22 3L11 13M22 3l-7 18-4-8-8-4 19-6z" /></svg>),
  sparkle: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>)
};

const LESSON_META = { lessonId: 'mobile-app-practice-09-v16', lessonTitle: { uz: 'Praktika: mobil ilova (mini-do\'kon)', ru: 'Практика: мобильное приложение' } };
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
const PRODUCTS = [
  { id: 1, name: 'Olma', price: 12000, emoji: '🍎' },
  { id: 2, name: 'Non', price: 5000, emoji: '🍞' },
  { id: 3, name: 'Sut', price: 9000, emoji: '🥛' }
];
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so\'m';

// Mobil ilova quruvchi qadamlari (s6)
const BUILD_STEPS = [
  { id: 'list', label: 'List ekran', prompt: 'Mahsulotlarni o\'sha backenddan fetch qilib FlatList\'da ko\'rsat', code: 'fetch(API + "/products") → <FlatList data={products} />' },
  { id: 'detail', label: 'Detail + navigatsiya', prompt: 'Mahsulot bosilganda Detail ekranga o\'t (Stack Navigator)', code: 'navigation.navigate("Detail", { id })' },
  { id: 'cart', label: 'Savat', prompt: 'Savatga qo\'shish tugmasi + yuqorida savat soni (badge)', code: 'setCart([...cart, product]) · badge = cart.length' },
  { id: 'checkout', label: 'Checkout', prompt: 'Buyurtma qil tugmasi → o\'sha backendga POST /orders', code: 'fetch(API + "/orders", { method: "POST", body })' }
];

// Checkout oqimi (s8)
const CHECKOUT_FLOW = [
  { emoji: '📱', t: 'Mobil: «Buyurtma qil» bosildi' },
  { emoji: '🟢', t: 'Backendga POST /orders yuborildi (o\'sha Node.js)' },
  { emoji: '🐘', t: 'PostgreSQL: buyurtma saqlandi' },
  { emoji: '✈️', t: 'Telegram: adminga xabar bordi' },
  { emoji: '✅', t: 'Mobil: «Rahmat! Buyurtmangiz qabul qilindi»' }
];

// Telefonda test → bug → tuzatish (s11)
const BUG_STEPS = [
  { k: 'test', tag: '1 · TELEFONDA TEST', color: T.honey, text: 'Expo Go\'da savatga 2 mahsulot qo\'shasiz... lekin yuqoridagi badge hali «1» ko\'rsatyapti! 🐞', note: 'Haqiqiy telefonda sinab ko\'rmasangiz, bu bug\'ni ko\'rmaysiz.' },
  { k: 'why', tag: '2 · SABAB', color: T.accent, text: 'Savat soni (state) to\'g\'ri yangilanmayapti — kod eski qiymatdan foydalanyapti.', note: 'Avval kodni o\'qib, sabab qayerda — tushunasiz.' },
  { k: 'prompt', tag: '3 · TUZATISH PROMPTI', color: T.grape, text: '«Savatga qo\'shganda badge\'ni cart.length bilan bog\'la, har qo\'shilganda yangilansin.»', note: 'Aniq tuzatish — butun ilovani qayta yozdirmaysiz.' },
  { k: 'done', tag: '4 · QAYTA TEST', color: T.success, text: '✅ Endi badge «2» ko\'rsatadi. Savat to\'g\'ri ishlaydi!', note: 'Sikl: test → bug → tuzat → qayta test. Dovodka shu.' }
];

// To'liq hikoya (s13 takeaway)
const CASE_AC = [
  { tag: 'QURDI', color: T.accent, text: 'List → Detail → Savat → Checkout — har birini prompt bilan qurdi', why: 'T6/T7 bilimini ishga soldi, AI kod yozdi, u o\'qib bordi.' },
  { tag: 'SAYQALLADI', color: T.honey, text: 'StyleSheet bilan ranglar, bo\'shliq, tartib qo\'shdi', why: '«Ishlaydi» yetarli emas — mijoz ko\'radigan narsa chiroyli bo\'lsin.' },
  { tag: 'TESTLADI', color: T.blue, text: 'Expo Go\'da haqiqiy telefonda xarid qilib ko\'rdi, bug topdi', why: 'Telefonda sinab, savat bug\'ini tutdi va tuzatdi.' },
  { tag: 'DEPLOY', color: T.success, text: 'Expo Go QR bilan ulashdi — do\'sti telefonida ishladi', why: 'Tayyor ilova boshqalarning qo\'lida. Bitta backend, ko\'p telefon.' }
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

// ===== MOBIL UI YORDAMCHILARI =====
const Phone = ({ children, screenClass = '', wake = false }) => (
  <div className={`phone ${wake ? 'phone-wake' : ''}`}><div className="phone-notch" /><div className={`phone-screen ${screenClass}`}>{children}</div></div>
);
const AppBar = ({ title, badge, bump }) => (
  <div className="rn-appbar"><span>{title}</span>{badge !== undefined && badge !== null && <span className={`cart-badge ${bump ? 'bump' : ''}`}>🛒 {badge}</span>}</div>
);
const ProductRow = ({ p, onAdd, chevron }) => (
  <div className="rn-item">
    <span className="rn-emoji">{p.emoji}</span>
    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span className="rn-name">{p.name}</span>
      <span className="rn-price">{fmt(p.price)}</span>
    </span>
    {onAdd ? <button className="rn-add" onClick={() => onAdd(p)}>+</button> : (chevron ? <span style={{ marginLeft: 'auto', color: T.ink3, fontSize: 18 }}>›</span> : null)}
  </div>
);
const RnEmpty = ({ children }) => <div className="rn-empty"><span style={{ fontSize: 30 }}>📱</span>{children}</div>;

const QR_PATTERN = [1,1,1,0,1,1,1, 1,0,1,0,1,0,1, 1,1,1,0,0,1,1, 0,0,0,1,0,0,0, 1,0,1,0,1,1,0, 1,1,0,1,0,0,1, 1,0,1,1,1,0,1];
const QrBox = ({ scanning }) => (
  <div className={`qr-box ${scanning ? 'scanning' : ''}`}>{QR_PATTERN.map((c, i) => <span key={i} className={`qr-cell ${c ? '' : 'off'}`} />)}</div>
);

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

// ===== SCREEN 0 — HOOK (web sayt vs mobil ilova) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('web');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Hech narsa — sayt brauzerda ham ochiladi' },
    { id: 'b', label: 'Mobil ilova — telefon ekraniga moslangan, qulay, App Store/Expo orqali' },
    { id: 'c', label: 'Saytni kattalashtirish' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const isWeb = v === 'web';
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Do'koningiz web'da bor. Lekin mijozlar <span className="italic" style={{ color: T.accent }}>telefonda</span>. Ularga nima beramiz?</h1>
        <Mentor>Web do'kon (o'tgan darsda qurgan) tayyor. Endi o'sha do'konning MOBIL ilovasini quramiz. Ikki holatni bosib solishtiring.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isWeb ? 'chip-on' : ''}`} onClick={() => setV('web')}>🌐 Sayt telefonda</button>
              <button className={`chip ${!isWeb ? 'chip-on' : ''}`} onClick={() => setV('app')}>📱 Mobil ilova</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', justifyContent: 'center' }}>
              {isWeb ? (
                <Phone screenClass="raw">
                  <div style={{ height: 22, background: '#d8d8d8', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 9, color: '#666' }}>🔒 mini-dokon.uz</div>
                  <div style={{ transform: 'scale(0.62)', transformOrigin: 'top center', padding: 8 }}>
                    <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 16 }}>Mini-do'kon</div>
                    {PRODUCTS.map(p => <div key={p.id} style={{ fontSize: 12, padding: '6px 0', borderBottom: '1px solid #eee', color: '#444' }}>{p.emoji} {p.name} — {fmt(p.price)}</div>)}
                    <p style={{ fontSize: 10, color: '#b00', marginTop: 6 }}>matn mayda, tugmalar noqulay, har safar brauzer ochish kerak…</p>
                  </div>
                </Phone>
              ) : (
                <Phone>
                  <AppBar title="Mini-do'kon" badge={0} />
                  <div className="rn-body">{PRODUCTS.map(p => <ProductRow key={p.id} p={p} onAdd={() => {}} />)}</div>
                  <button className="rn-cta">Savatga o'tish</button>
                </Phone>
              )}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Mijozga nima kerak?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri — telefon ekraniga moslangan <b>mobil ilova</b> kerak. Bugun mini-do'konning mobil versiyasini <b>quramiz</b>, <b>telefonda testlaymiz</b> va <b>Expo Go bilan ulashamiz</b>. Va yana o'sha falsafa: siz — direktor.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'O\'sha backendga ulanish (yangi backend qurmaymiz)', tag: '' },
    { text: 'List + Detail ekranlar (mahsulotlar, fetch)', tag: '' },
    { text: 'Savat + jami narx (state, reduce)', tag: '' },
    { text: 'Checkout → buyurtma backendga', tag: '' },
    { text: 'Telefonda test + sayqal + Expo Go deploy', tag: 'deploy' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.phone(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>mini-do'kon → mobil ilova</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Qurib, telefonda testlab, Expo Go bilan ulashamiz.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Sintaksisni T6/T7 da o'rgandingiz — bugun QURASIZ</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Loyiha kuni: mobil ilovani quramiz va ulashamiz</span></h2></div>
        <Mentor>Bugun yangi sintaksis emas — <b style={{ color: T.ink }}>amaliyot</b>. Siz direktor sifatida AI'ga buyurib, mobil ilovani qadam-qadam yig'asiz, telefonda testlaysiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — O'SHA BACKEND, YANGI ESHIK =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [connected, setConnected] = useState(!!storedAnswer);
  const done = connected;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const DOORS = [
    { id: 'web', emoji: '💻', label: 'Web sayt', on: true },
    { id: 'bot', emoji: '✈️', label: 'Telegram bot', on: true },
    { id: 'mobil', emoji: '📱', label: 'Mobil ilova', on: connected, isNew: true }
  ];
  return (
    <Stage eyebrow="Bitta tizim" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Mobil eshikni ulang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'sha backend — <span className="italic" style={{ color: T.accent }}>yangi eshik</span></h2></div>
        <Mentor>Mobil ilova noldan backend qurmaydi! U o'tgan darsda qurgan O'SHA Node.js + PostgreSQL'ga ulanadi. Mobil — bitta tizimning yana bir «eshigi». Mobil eshikni ulang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {DOORS.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {d.isNew && !connected ? (
                    <button className="door door-new" onClick={() => setConnected(true)}>
                      <span style={{ fontSize: 20 }}>{d.emoji}</span><span className="door-lbl">{d.label}</span><span className="door-act">ULA →</span>
                    </button>
                  ) : (
                    <div className={`door ${d.on ? 'door-on' : ''}`}>
                      <span style={{ fontSize: 20 }}>{d.emoji}</span><span className="door-lbl">{d.label}</span>{d.on && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span>}
                    </div>
                  )}
                  <span style={{ color: d.on ? T.grape : T.ink3, fontSize: 18, transition: 'color 0.3s' }}>→</span>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            <div className="backend-hub fade-up delay-1">
              <span style={{ fontSize: 30 }}>🟢</span>
              <p style={{ fontFamily: "'Manrope'", fontWeight: 800, fontSize: 15, color: '#fff', margin: '6px 0 2px' }}>Bitta backend</p>
              <p style={{ fontFamily: G, fontSize: 12, color: '#9FB4D8', margin: 0, textAlign: 'center' }}>Node.js + PostgreSQL<br />(GET /products · POST /orders)</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana o'sha g'oya: <b>ko'p eshik — bitta tizim</b>. Web, bot, mobil — uchchalasi o'sha bazadagi o'sha mahsulot va buyurtmalardan foydalanadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ILOVA XARITASI (telefon preview) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TABS = [
    { id: 'list', label: 'List' },
    { id: 'detail', label: 'Detail' },
    { id: 'cart', label: 'Savat' },
    { id: 'checkout', label: 'Checkout' }
  ];
  const [tab, setTab] = useState('list');
  const [seen, setSeen] = useState(storedAnswer ? new Set(TABS.map(t => t.id)) : new Set(['list']));
  const done = seen.size >= TABS.length;
  const go = (id) => { setTab(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const total = PRODUCTS[0].price + PRODUCTS[1].price;
  const renderPhone = () => {
    if (tab === 'detail') return (<Phone><AppBar title="‹ Olma" /><div className="rn-body" style={{ alignItems: 'center', gap: 10 }}><div style={{ fontSize: 64 }}>🍎</div><p className="rn-name" style={{ fontSize: 16 }}>Olma</p><p className="rn-price" style={{ fontSize: 14 }}>{fmt(12000)}</p><p style={{ fontFamily: G, fontSize: 11, color: T.ink2, textAlign: 'center' }}>Yangi, shirin olma. Kuniga yetkazib beramiz.</p></div><button className="rn-cta">Savatga qo'shish</button></Phone>);
    if (tab === 'cart') return (<Phone><AppBar title="Savat" badge={2} /><div className="rn-body"><ProductRow p={PRODUCTS[0]} /><ProductRow p={PRODUCTS[1]} /><div style={{ marginTop: 'auto', paddingTop: 8, borderTop: `1px dashed ${T.ink3}`, display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope', fontWeight: 800, fontSize: 13 }}><span>Jami:</span><span style={{ color: T.accent }}>{fmt(total)}</span></div></div><button className="rn-cta">Buyurtma qil</button></Phone>);
    if (tab === 'checkout') return (<Phone><AppBar title="Buyurtma" /><div className="rn-body" style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}><div style={{ fontSize: 48 }}>✅</div><p className="rn-name" style={{ fontSize: 14, textAlign: 'center' }}>Rahmat! Buyurtmangiz<br />qabul qilindi</p><p className="rn-price">#1042 · {fmt(total)}</p></div></Phone>);
    return (<Phone><AppBar title="Mini-do'kon" badge={0} /><div className="rn-body">{PRODUCTS.map(p => <ProductRow key={p.id} p={p} chevron />)}</div></Phone>);
  };
  return (
    <Stage eyebrow="Ilova xaritasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ekranlarni ko'ring (${seen.size}/${TABS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ilova — <span className="italic" style={{ color: T.accent }}>4 ekran</span></h2></div>
        <Mentor>Mana qurmoqchi bo'lgan ilovamiz. 4 ekranni bosib, telefonda ko'ring: mahsulotlar → detal → savat → buyurtma.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {TABS.map(t => (<button key={t.id} className={`chip ${tab === t.id ? 'chip-on' : ''}`} onClick={() => go(t.id)}>{seen.has(t.id) && tab !== t.id ? '✓ ' : ''}{t.label}</button>))}
            </div>
            <p className="small" style={{ color: T.ink2, margin: 0 }}>Bularning hammasi o'sha backenddan ma'lumot oladi — yangi server kerak emas.</p>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 ekran tayyor reja. Endi ularni AI bilan birma-bir quramiz.</p></div>}
          </Col>
          <Col>
            <div key={tab} className="demo-swap" style={{ display: 'flex', justifyContent: 'center' }}>{renderPhone()}</div>
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Mobil ilova mahsulot ma'lumotini qayerdan oladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mobil ilova mahsulotlarni <span className="italic" style={{ color: T.accent }}>qayerdan</span> oladi?</h2></>}
    options={['Yangi backend yozamiz, faqat mobil uchun', "O'sha mavjud backenddan (GET /products) — yangi server qurmaymiz", 'Mahsulotlarni ilova ichiga qo\'lda yozamiz', 'Hech qayerdan — mobil ilovada baza bo\'lmaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Mobil ilova o'sha Node.js + PostgreSQL backendga ulanadi (GET /products). Web, bot, mobil — bitta tizimning eshiklari, hammasi o'sha bazadan."
    explainWrong={{ 0: 'Yangi backend shart emas — o\'sha bittasi hamma eshikka xizmat qiladi.', 2: 'Qo\'lda yozsangiz — yangilanmaydi. Backenddan fetch qiling.', 3: 'Ma\'lumot backendda — ilova undan fetch qiladi.', default: 'O\'sha backend, GET /products — bitta tizim.' }} />
);

// ===== SCREEN 5 — VIBECODING LOYIHA KUNI RITMI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FLOW = ['Reja', 'Prompt', 'AI kod', 'Telefonda test', 'Tuzat'];
  const [step, setStep] = useState(storedAnswer ? FLOW.length : 0);
  const done = step >= FLOW.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Loyiha kuni ritmi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni oching (${step}/${FLOW.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ritm: <span className="italic" style={{ color: T.accent }}>prompt → kod → telefonda test → tuzat</span></h2></div>
        <Mentor>Loyiha kunida har qadam shu siklda quriladi. Yangi narsa — <b>telefonda</b> ko'rib test qilish. Bosib oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
              {FLOW.map((f, i) => { const on = i < step; return (<React.Fragment key={f}><span className={`ritm-chip ${on ? 'ritm-on' : ''}`} style={{ transitionDelay: `${i * 0.04}s` }}>{f}</span>{i < FLOW.length - 1 && <span style={{ color: i < step - 1 ? T.accent : T.ink3 }}>→</span>}</React.Fragment>); })}
            </div>
            {!done && <button className="btn" onClick={() => setStep(s => Math.min(s + 1, FLOW.length))} style={{ alignSelf: 'flex-start' }}>{step === 0 ? '▶ Siklni boshlash' : 'Keyingi qadam →'}</button>}
          </Col>
          <Col>
            <div className="frame" style={{ padding: 'clamp(16px,2.5vw,22px)' }}>
              <p className="note-h" style={{ color: T.accent }}>Direktor / ishchi</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Siz aniq buyurasiz, <b>AI kod yozadi</b>, siz uni o'qiysiz va <b>Expo Go'da telefonda</b> sinab ko'rasiz. Bug bo'lsa — aniq tuzatish prompti.</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>«Ishladi» degani — telefonda o'z ko'zingiz bilan ko'rdingiz, degani. Endi quramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Loyiha kunida sizning (direktor) rolingiz nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Loyiha kunida sizning <span className="italic" style={{ color: T.accent }}>rolingiz</span>?</h2></>}
    options={['AI bergan kodni o\'qimasdan ishlatish', "Aniq buyurish, kodni o'qish va telefonda sinab ko'rish", 'Hamma kodni o\'zingiz qo\'lda yozish', 'Faqat dizaynni tanlash']} correctIdx={1}
    explainCorrect="To'g'ri! Siz direktorsiz: aniq buyurasiz, AI kodini o'qib tushunasiz va Expo Go'da telefonda sinab ko'rasiz. Test qilmaguningizcha «ishladi» deyolmaysiz."
    explainWrong={{ 0: 'O\'qimasdan ishlatish — bug\'larni ko\'rmaysiz.', 2: 'Hammasini qo\'lda emas — AI yozadi, siz boshqarasiz.', 3: 'Dizayn ham muhim, lekin asosiy — buyur, o\'qi, telefonda testla.', default: 'Buyur, kodni o\'qi, telefonda testla.' }} />
);

// ===== SCREEN 6 — MOBIL ILOVA QURUVCHI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [built, setBuilt] = useState(() => storedAnswer ? new Set(BUILD_STEPS.map(s => s.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'checkout' : null);
  const [ran, setRan] = useState(false);
  const workRef = useRef(null);
  const allBuilt = built.size >= BUILD_STEPS.length;
  const done = allBuilt;
  const add = (id) => { setActive(id); setBuilt(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const cur = active ? BUILD_STEPS.find(s => s.id === active) : null;
  const has = (id) => built.has(id);
  return (
    <Stage eyebrow="Mobil ilova quruvchi · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ilovani quring (${built.size}/${BUILD_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ilovani <span className="italic" style={{ color: T.accent }}>prompt bilan yig'ing</span></h2></div>
        <Mentor>Har qism uchun AI'ga prompt yuborasiz — kod paydo bo'ladi va telefonda o'sha qism ko'rinadi. 4 qadamni quring, keyin «Xarid qil»!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Phone>
                <AppBar title="Mini-do'kon" badge={has('cart') ? (ran ? 2 : 0) : null} bump={ran} />
                {has('list') ? (
                  ran ? (
                    <div className="rn-body" style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}><div style={{ fontSize: 48 }}>✅</div><p className="rn-name" style={{ fontSize: 13, textAlign: 'center' }}>Buyurtma yuborildi!<br />Backend qabul qildi.</p></div>
                  ) : (
                    <div className="rn-body">{PRODUCTS.map(p => <ProductRow key={p.id} p={p} chevron={has('detail')} onAdd={has('cart') ? () => {} : undefined} />)}</div>
                  )
                ) : (
                  <RnEmpty>Ilova bo'sh.<br />List ekranni qo'shing →</RnEmpty>
                )}
                {has('checkout') && !ran && <button className="rn-cta">Buyurtma qil</button>}
              </Phone>
            </div>
            {allBuilt && !ran && <button className="btn" onClick={() => setRan(true)} style={{ alignSelf: 'center' }}>▶ Xarid qil</button>}
          </Col>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {BUILD_STEPS.map(s => { const on = has(s.id); return (
                <button key={s.id} onClick={() => add(s.id)} className={`plink ${on ? 'plink-on' : ''}`}>
                  <span className="plink-box">{on ? Ico.check(13) : Ico.bolt(13)}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{s.label}</span></span>
                  <span className="plink-act">{on ? 'qo\'shildi' : 'prompt yubor'}</span>
                </button>
              ); })}
            </div>
            {cur && !ran && (<div className="sk-info fade-step" key={active}><p className="flow-label" style={{ margin: 0 }}>{cur.label} — promptingiz</p><p style={{ fontFamily: G, fontSize: 13.5, color: T.ink, margin: '8px 0 10px', fontStyle: 'italic' }}>«{cur.prompt}»</p><div className="codepill">{cur.code}</div></div>)}
            {!cur && !ran && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Qadamni bosing — promptni va AI yozgan kodni ko'rasiz, telefonda qism paydo bo'ladi.</p></div>}
            {ran && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>📱</div><p className="ta-h">Ilova ishladi!</p><p className="ta-sub">List → savat → buyurtma → o'sha backend. To'liq mobil ilova tayyor.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SAVAT + JAMI (state/reduce) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [cart, setCart] = useState([]);
  const [bump, setBump] = useState(false);
  const bumpRef = useRef(null);
  const done = (storedAnswer ? true : cart.length >= 2);
  const add = (p) => { setCart(c => [...c, p]); setBump(true); clearTimeout(bumpRef.current); bumpRef.current = setTimeout(() => setBump(false), 420); };
  useEffect(() => { if (cart.length >= 2 && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [cart.length]);
  const total = cart.reduce((sum, p) => sum + p.price, 0);
  return (
    <Stage eyebrow="Savat + jami" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Savatga 2 ta qo'shing (${cart.length}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Savat va <span className="italic" style={{ color: T.accent }}>jami narx</span></h2></div>
        <Mentor>«+» bosib mahsulot qo'shing — yuqoridagi savat soni (badge) sakraydi, jami narx <b>reduce</b> bilan o'zi hisoblanadi (Modul 2 dagi callback!).</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Phone>
                <AppBar title="Mini-do'kon" badge={cart.length} bump={bump} />
                <div className="rn-body">{PRODUCTS.map(p => <ProductRow key={p.id} p={p} onAdd={add} />)}</div>
                <div style={{ padding: '9px 12px', borderTop: `1px dashed ${T.ink3}`, display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope', fontWeight: 800, fontSize: 13, background: T.paper }}><span>Jami:</span><span style={{ color: T.accent }}>{fmt(total)}</span></div>
              </Phone>
            </div>
          </Col>
          <Col>
            <div className="frame" style={{ padding: 'clamp(14px,2.2vw,20px)' }}>
              <p className="flow-label" style={{ marginBottom: 8 }}>Jami narx — reduce bilan</p>
              <div className="codepill">const jami = cart.reduce(<br />&nbsp;&nbsp;(sum, p) =&gt; sum + p.price, 0<br />);</div>
              <p className="body" style={{ margin: '10px 0 0', color: T.ink2 }}>Har mahsulot narxini qo'shib boradi. Savatda <b>{cart.length}</b> ta · jami <b style={{ color: T.accent }}>{fmt(total)}</b>.</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Badge = <span className="mono">cart.length</span>, jami = <span className="mono">reduce</span>. State o'zgarsa — ekran o'zi yangilanadi. React shu.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — CHECKOUT → O'SHA BACKEND =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? CHECKOUT_FLOW.length - 1 : -1);
  const done = step >= CHECKOUT_FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Checkout → backend" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Oqimni kuzating (${Math.max(0, step + 1)}/${CHECKOUT_FLOW.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Buyurtma qil» — <span className="italic" style={{ color: T.accent }}>o'sha tizimga tushadi</span></h2></div>
        <Mentor>Mobil buyurtma ham o'tgan darsdagi pipeline'ga ulanadi: backend → baza saqlaydi → bot adminga xabar beradi. Bosib, oqimni kuzating.</Mentor>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600, width: '100%', margin: '0 auto' }}>
          {CHECKOUT_FLOW.map((s, i) => { const on = step >= i; return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.paper, borderRadius: 12, padding: '12px 15px', opacity: on ? 1 : 0.3, transform: on ? 'translateX(0)' : 'translateX(-6px)', transition: 'all 0.4s', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `3px solid ${on ? T.grape : T.ink3}` }}>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <span style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,15px)', color: T.ink }}>{s.t}</span>
              </div>
              {i < CHECKOUT_FLOW.length - 1 && <span style={{ textAlign: 'center', color: step > i ? T.grape : T.ink3, fontSize: 14, transition: 'color 0.3s' }}>↓</span>}
            </React.Fragment>
          ); })}
        </div>
        {!done && <button className="btn" onClick={() => setStep(n => Math.min(n + 1, CHECKOUT_FLOW.length - 1))} style={{ alignSelf: 'center' }}>{step < 0 ? '▶ Buyurtma qil' : 'Keyingi qadam →'}</button>}
        {done && <div className="frame-success fade-step" style={{ maxWidth: 600, width: '100%', margin: '0 auto' }}><p className="body" style={{ margin: 0, color: T.ink }}>Telefondan kelgan buyurtma ham bazaga tushdi va bot xabar berdi — xuddi web'dagidek. <b>Bitta tizim, ko'p eshik.</b></p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Mobil ilovada «Buyurtma qil» bosilganda nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mobil «Buyurtma qil» bosilganda <span className="italic" style={{ color: T.accent }}>nima</span> bo'ladi?</h2></>}
    options={['Faqat telefon ichida saqlanadi, hech qayerga bormaydi', "O'sha backendga POST /orders ketadi → baza saqlaydi → bot xabar beradi", 'Yangi mobil backend ishga tushadi', 'Hech narsa — mobil ilova buyurtma qabul qilolmaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Mobil ilova o'sha backendga POST /orders yuboradi. Buyurtma PostgreSQL'ga saqlanadi va Telegram bot adminni xabardor qiladi — web bilan bir xil pipeline."
    explainWrong={{ 0: 'Telefonda qolmaydi — backendga yuboriladi, aks holda admin ko\'rmaydi.', 2: 'Yangi backend yo\'q — o\'sha bitta backend.', 3: 'Qabul qiladi — POST /orders orqali.', default: 'POST /orders → baza + bot. Bitta tizim.' }} />
);

// ===== SCREEN 10 — DOVODKA / SAYQAL =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('raw');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['raw', 'styled']) : new Set(['raw']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isRaw = v === 'raw';
  return (
    <Stage eyebrow="Dovodka · sayqal" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Ishlaydi» yetarli emas — <span className="italic" style={{ color: T.accent }}>sayqalla</span></h2></div>
        <Mentor>Ilova ishlasa ham, mijoz uni ko'radi. StyleSheet bilan rang, bo'shliq, tartib qo'shamiz. Ikki holatni solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isRaw ? 'chip-on' : ''}`} onClick={() => set('raw')}>🩶 Chala (rangsiz)</button>
              <button className={`chip ${!isRaw ? 'chip-on' : ''}`} onClick={() => set('styled')}>✨ Sayqallangan</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', justifyContent: 'center' }}>
              <Phone screenClass={isRaw ? 'raw' : ''}>
                <AppBar title="Mini-do'kon" badge={2} />
                <div className="rn-body">{PRODUCTS.map(p => <ProductRow key={p.id} p={p} onAdd={() => {}} />)}</div>
                <button className="rn-cta">Buyurtma qil</button>
              </Phone>
            </div>
          </Col>
          <Col>
            {isRaw
              ? <div className="frame-warn fade-step" key="r"><p className="note-h" style={{ color: T.accent }}>Chala ko'rinish</p><p className="body" style={{ margin: 0, color: T.ink }}>Rang yo'q, bo'shliq yo'q, tugmalar quruq. Ishlaydi — lekin mijoz ishonmaydi.</p></div>
              : <div className="frame-success fade-step" key="s"><p className="note-h" style={{ color: T.success }}>Sayqallangan</p><p className="body" style={{ margin: 0, color: T.ink }}>StyleSheet: ranglar, yumshoq burchaklar, bo'shliq, soyalar. O'sha ilova — lekin professional.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Dovodka = sayqal. «Ishlaydi»dan keyin «chiroyli va qulay»ni qo'shing — bu ham direktor ishi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TELEFONDA TEST + BUG =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? BUG_STEPS.length - 1 : 0);
  const workRef = useRef(null);
  const done = step >= BUG_STEPS.length - 1;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const cur = BUG_STEPS[step] || BUG_STEPS[0];
  return (
    <Stage eyebrow="Telefonda test · bug" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni kuzating (${step + 1}/${BUG_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Telefonda test: <span className="italic" style={{ color: T.accent }}>bug topiladi → tuzatiladi</span></h2></div>
        <Mentor>Expo Go'da haqiqiy telefonda sinab ko'rasiz — va bug chiqadi! Bosib, tuzatish siklini ko'ring.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="vibe-track">
              {BUG_STEPS.map((s, i) => { const on = i <= step; return (<div key={s.k} className="vibe-row" style={{ opacity: on ? 1 : 0.32, transition: 'opacity 0.35s' }}><span className="vibe-dot" style={{ background: on ? s.color : T.ink3 }}>{i < step ? Ico.check(11) : i + 1}</span><span className="vibe-tag" style={{ color: on ? s.color : T.ink3 }}>{s.tag}</span></div>); })}
            </div>
            {!done && <button className="btn" onClick={() => setStep(n => Math.min(n + 1, BUG_STEPS.length - 1))} style={{ alignSelf: 'flex-start' }}>{step === 0 ? '▶ Telefonda sinash' : 'Keyingi qadam →'}</button>}
          </Col>
          <Col>
            <div key={step} className="vibe-card fade-step" style={{ borderLeft: `4px solid ${cur.color}` }}>
              <span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span>
              <p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 10px', lineHeight: 1.5 }}>{cur.text}</p>
              <p className="body" style={{ margin: 0, color: T.ink2 }}>{cur.note}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana dovodka: telefonda test → bug → aniq tuzatish → qayta test. Emulyator emas — <b>haqiqiy qurilma</b> rost bug'larni ko'rsatadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Mobil ilovani qanday to'g'ri test qilamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mobil ilovani qanday <span className="italic" style={{ color: T.accent }}>test</span> qilamiz?</h2></>}
    options={['Test qilmaymiz, AI to\'g\'ri yozadi', "Expo Go bilan haqiqiy telefonda — har ekran va oqimni bosib ko'rib", 'Faqat kompyuterda koda qarab', 'Faqat ranglarni tekshirib']} correctIdx={1}
    explainCorrect="To'g'ri! Expo Go bilan haqiqiy telefonda ochib, har ekran va oqimni (List → savat → buyurtma) bosib sinaymiz. Real qurilma — real bug'lar (sekinlik, badge, tugma joyi)."
    explainWrong={{ 0: 'AI xato qiladi — telefonda test shart.', 2: 'Kod to\'g\'ri ko\'rinishi mumkin, lekin telefonda boshqacha ishlaydi.', 3: 'Rang — bir qismi xolos. Butun oqimni sinang.', default: 'Expo Go, haqiqiy telefon, butun oqim.' }} />
);

// ===== SCREEN 13 — EXPO GO DEPLOY (SIGNATURE 2) + NAMUNA =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 2 : 0); // 0 = none, 1 = QR, 2 = scanned
  const workRef = useRef(null);
  const done = phase >= 2;
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const MiniApp = ({ wake }) => (
    <Phone wake={wake}><AppBar title="Mini-do'kon" badge={0} /><div className="rn-body">{PRODUCTS.map(p => <ProductRow key={p.id} p={p} chevron />)}</div></Phone>
  );
  return (
    <Stage eyebrow="Expo Go · deploy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : 'Ulashing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Expo Go deploy: <span className="italic" style={{ color: T.accent }}>QR → do'st telefonida</span></h2></div>
        <Mentor>Ilova tayyor — endi ulashamiz. «Chiqar» bosing → QR paydo bo'ladi → do'stingiz skanlaydi → uning telefonida ishlaydi!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', minHeight: 200 }}>
              <div style={{ textAlign: 'center' }}><MiniApp /><p className="small" style={{ color: T.ink2, margin: '6px 0 0' }}>Sizning telefon</p></div>
              {phase >= 1 && (
                <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <QrBox scanning={phase === 1} />
                  <span style={{ fontSize: 18, color: T.grape }}>→</span>
                </div>
              )}
              {phase >= 2 && (
                <div style={{ textAlign: 'center' }}><MiniApp wake /><p className="small" style={{ color: T.success, margin: '6px 0 0', fontWeight: 700 }}>Do'st telefoni ✓</p></div>
              )}
            </div>
            {phase === 0 && <button className="btn" onClick={() => setPhase(1)} style={{ alignSelf: 'center' }}>📤 Expo Go'da chiqar</button>}
            {phase === 1 && <button className="btn" onClick={() => setPhase(2)} style={{ alignSelf: 'center' }}>📲 Do'st QR'ni skanlaydi</button>}
          </Col>
          <Col>
            {!done && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Expo Go — telefonga o'rnatiladigan ilova. QR'ni skanlasangiz, sizning ilovangiz darrov ishga tushadi (App Store kerak emas).</p></div>}
            {done && (
              <>
                <div className="checklist feat-pop">
                  <div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span><span className="cl-title">Bir o'quvchining yo'li</span></div>
                  {CASE_AC.map((c, i) => (<div key={i} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></div>))}
                </div>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta backend, ko'p telefon. Tayyor ilova boshqalar qo'lida ishlayapti. Endi o'z rejangizni yozing.</p></div>
              </>
            )}
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
      <div className="head"><h2 className="title h-title fade-up">Mobil loyiha: <span className="italic" style={{ color: T.accent }}>qur · testla · sayqalla · deploy</span></h2></div>
      <Mentor>Yodda tuting: o'sha backendga ulan, telefonda sinab ko'r, sayqalla, Expo Go bilan ulash.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎬</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — direktor</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>AI kod yozadi, siz telefonda test qilib, ilovani yetkazasiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.link(18), c: T.grape, t: 'O\'SHA BACKEND — yangi server qurmaysiz' }, { ic: Ico.phone(18), c: T.blue, t: 'TELEFONDA TEST — Expo Go, haqiqiy qurilma' }, { ic: Ico.sparkle(18), c: T.honey, t: 'SAYQALLA — StyleSheet bilan chiroyli qil' }, { ic: Ico.send(18), c: T.success, t: 'DEPLOY — Expo Go QR bilan ulash' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: mobil build rejasi =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Qaysi o\'tgan loyihani mobilga aylantirasiz? (masalan mini-do\'kon)', '1-ekran uchun aniq prompt (masalan: mahsulotlarni fetch qilib FlatList\'da ko\'rsat)', '2-ekran/funksiya uchun aniq prompt (masalan: savat + jami narx)'];
const LBL = ['Loyiha', '1-prompt', '2-prompt'];
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
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>mobil build rejangiz</span></h2></div>
        <Mentor>Qaysi o'tgan loyihani mobilga aylantirasiz va 2 ta ekran/funksiya uchun qanday aniq prompt yozasiz? Kamida 2 qatorni to'ldiring.</Mentor>
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
            <p className="flow-label">Sizning mobil rejangiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — rejangiz shu yerda yig'iladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.phone(15)}</span><span className="cl-title">Mening mobil rejam</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Shu reja bilan AI'ga buyurib, mobil ilovangizni qadam-qadam qurib, telefonda test qilasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Mobil ilova o\'sha backendga ulanadi (bitta tizim, ko\'p eshik)', 'List → Detail → Savat → Checkout — prompt bilan qurildi', 'Savat = state, jami = reduce; ekran o\'zi yangilanadi', 'Telefonda test bug\'ni tutadi · Expo Go bilan deploy'];
  const HOMEWORK = [{ b: 'O\'z mobil ilovangizni qurib boshlang', t: '— o\'sha backendga ulang' }, { b: 'Expo Go\'da telefonda testlang', t: '— har ekranni bosib ko\'ring' }, { b: 'Sayqallab, do\'stga ulashing', t: '— QR bilan, fikr oling' }];
  const GLOSSARY = [{ b: 'Expo Go', t: '— telefonda ilovani sinab ko\'rish/ulashish (QR)' }, { b: 'FlatList', t: '— ro\'yxatni ko\'rsatuvchi RN komponent' }, { b: 'state', t: '— o\'zgaruvchan ma\'lumot (savat); o\'zgarsa ekran yangilanadi' }, { b: 'reduce', t: '— ro\'yxatni bitta qiymatga yig\'ish (jami narx)' }, { b: 'deploy', t: '— ilovani ishga tushirib, boshqalarga ulash' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Loyiha kuni tugadi</span><h2 className="title h-title fade-up d1">Mobil ilovangiz <span className="italic" style={{ color: T.accent }}>tayyor</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! mini-do\'konning mobil versiyasini qurdingiz, telefonda testladingiz va Expo Go bilan ulashishni o\'rgandingiz. Keyingi — to\'liq tizimni yig\'amiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Mobil ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Qur, telefonda testla, ulash! 📱</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🧩</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi: To'liq tizim (capstone)</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Web + mobil + bot + backend + baza — hammasini bitta tizimga yig'ib, boshidan oxirigacha sinaymiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function MobileAppPracticeLesson({ lang: langProp, onFinished }) {
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

        /* === PHONE (mobil ilova) === */
        .phone { width: 196px; max-width: 100%; background: #11161F; border-radius: 30px; padding: 9px; box-shadow: 0 22px 46px -14px rgba(${T.shadowBase},0.42), inset 0 0 0 2px #2a3344; position: relative; flex-shrink: 0; }
        .phone-notch { position: absolute; top: 9px; left: 50%; transform: translateX(-50%); width: 62px; height: 15px; background: #11161F; border-radius: 0 0 12px 12px; z-index: 3; }
        .phone-screen { background: ${T.bg}; border-radius: 23px; height: 348px; overflow: hidden; display: flex; flex-direction: column; position: relative; }
        @keyframes phone-wake { 0% { opacity: .2; transform: scale(.95); } 100% { opacity: 1; transform: scale(1); } }
        .phone-wake { animation: phone-wake .6s cubic-bezier(.2,.7,.2,1); }
        .rn-appbar { background: ${T.accent}; color: #fff; padding: 18px 13px 10px; font-family: 'Manrope'; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .rn-body { flex: 1; min-height: 0; overflow-y: auto; padding: 9px; display: flex; flex-direction: column; gap: 7px; }
        .rn-item { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 11px; padding: 7px 9px; box-shadow: 0 4px 12px -8px rgba(${T.shadowBase},0.3); animation: feat-pop .3s; }
        .rn-emoji { width: 32px; height: 32px; min-width: 32px; border-radius: 8px; background: ${T.bg}; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; }
        .rn-name { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; line-height: 1.2; }
        .rn-price { font-size: 10.5px; color: ${T.ink2}; }
        .rn-add { margin-left: auto; width: 26px; height: 26px; min-width: 26px; border-radius: 8px; border: none; background: ${T.accent}; color: #fff; font-size: 17px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
        .rn-add:active { transform: scale(0.9); }
        .cart-badge { background: #fff; color: ${T.accent}; border-radius: 99px; min-width: 22px; height: 19px; padding: 0 6px; font-size: 10.5px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 2px; }
        .cart-badge.bump { animation: badge-bump .42s cubic-bezier(.2,.7,.2,1); }
        @keyframes badge-bump { 0% { transform: scale(1); } 40% { transform: scale(1.55); } 100% { transform: scale(1); } }
        .rn-cta { margin: 9px; background: ${T.ink}; color: #fff; border: none; border-radius: 12px; padding: 11px; font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; cursor: pointer; flex-shrink: 0; }
        .rn-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: ${T.ink3}; font-size: 12px; text-align: center; padding: 20px; font-family: 'Manrope'; font-weight: 600; line-height: 1.5; }
        /* chala (rangsiz) ko'rinish — s10 before */
        .phone-screen.raw { background: #fff; }
        .phone-screen.raw .rn-appbar { background: #e4e4e4; color: #444; font-weight: 600; padding-top: 18px; }
        .phone-screen.raw .rn-item { box-shadow: none; border-radius: 0; background: transparent; border-bottom: 1px solid #eee; padding: 9px 6px; }
        .phone-screen.raw .rn-emoji { background: #f0f0f0; border-radius: 0; }
        .phone-screen.raw .rn-add { background: #c9c9c9; border-radius: 0; color: #fff; }
        .phone-screen.raw .cart-badge { background: #c9c9c9; color: #fff; border-radius: 0; }
        .phone-screen.raw .rn-cta { background: #c9c9c9; color: #fff; border-radius: 0; }

        /* === ESHIK (clients-map s2) === */
        .door { display: flex; align-items: center; gap: 10px; width: 100%; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 14px; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.18); }
        .door-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .door-on { box-shadow: inset 0 0 0 1.5px ${T.success}55, 0 6px 16px -8px rgba(31,122,77,0.2); }
        .door-new { cursor: pointer; transition: all 0.16s; box-shadow: inset 0 0 0 1.6px ${T.accent}; background: ${T.accentSoft}; }
        .door-new:hover { transform: translateY(-1px); }
        .door-act { margin-left: auto; font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.04em; }
        .backend-hub { background: ${CODE.bg}; border-radius: 16px; padding: 18px 16px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); }

        /* === RITM CHIP (s5) === */
        .ritm-chip { font-family: 'Manrope'; font-weight: 700; font-size: 12px; padding: 8px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink3}; box-shadow: 0 4px 12px -7px rgba(${T.shadowBase},0.2); transition: all 0.3s; }
        .ritm-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }

        /* === QR (s13) === */
        .qr-box { width: 92px; height: 92px; background: #fff; border-radius: 10px; padding: 7px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.3); display: grid; grid-template-columns: repeat(7, 1fr); grid-template-rows: repeat(7, 1fr); gap: 2px; }
        .qr-cell { background: ${T.ink}; border-radius: 1px; }
        .qr-cell.off { background: transparent; }
        .qr-box.scanning { animation: qr-pulse 1s ease-in-out infinite; }
        @keyframes qr-pulse { 0%,100% { box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.3); } 50% { box-shadow: 0 0 0 4px ${T.blue}44, 0 8px 20px -8px rgba(${T.shadowBase},0.3); } }

        /* === PLINK (s6) === */
        .plink { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .plink:hover { transform: translateY(-1px); }
        .plink-on { background: ${T.grapeSoft}; box-shadow: inset 0 0 0 1.5px ${T.grape}; }
        .plink-box { width: 22px; height: 22px; min-width: 22px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; background: ${T.grape}; color: #fff; }
        .plink-label { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .plink-act { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.grape}; text-transform: uppercase; letter-spacing: 0.04em; }
        .codepill { font-family: 'JetBrains Mono'; font-size: 11.5px; line-height: 1.5; color: ${CODE.str}; background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; word-break: break-word; }

        /* === VIBE TRACK (s11) === */
        .vibe-track { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }
        .vibe-row { display: flex; align-items: center; gap: 11px; padding: 5px 0; }
        .vibe-dot { width: 24px; height: 24px; min-width: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; transition: background 0.3s; }
        .vibe-tag { font-family: 'Manrope'; font-weight: 700; font-size: 12px; letter-spacing: 0.03em; transition: color 0.3s; }
        .vibe-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === CHEK-LIST === */
        .checklist { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 7px; position: relative; }
        .cl-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid ${T.ink3}33; margin-bottom: 2px; }
        .cl-title { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .crit { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 9px; font-family: 'Georgia, serif'; font-size: 13px; color: ${T.ink}; border: none; transition: background 0.25s; }
        .crit-text { flex: 1; line-height: 1.4; }
        .crit-box { width: 19px; height: 19px; min-width: 19px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
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
