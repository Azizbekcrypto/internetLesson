import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · DARS 7 (T7) — REACT NATIVE: KOMPONENT, NAVIGATSIYA, API — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi ko'p ekranli RN ilova quradi: komponentlar (Image/Pressable/ScrollView/FlatList/TextInput),
//         navigatsiya (Stack Navigator push/pop), backend'dan fetch (o'sha Node.js API), AsyncStorage (telefonda saqlash).
// Asosiy g'oya: mobil ilova O'SHA backendga ulanadi (T1 "ko'p eshik bitta tizim") — backendni qayta qurmaysiz.
// Yondashuv: PhoneFrame simulyatori (T6 dagi Phone) + navigatsiya slide + fetch animatsiyasi.
// Davomi: T6 (RN asoslari). Ko'prik: P1 (mobil ilovani amalda qurish). Mahsulot: mini-do'kon mobil (ko'p ekran).
// SIFAT: javob aralashtirish, mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309', violet: '#6D4AED', violetSoft: '#ECE6FD',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

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

const LESSON_META = { lessonId: 'react-native-app-07-v16', lessonTitle: { uz: 'RN: komponent, navigatsiya, API', ru: 'RN: компоненты, навигация, API' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
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

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic, scrollSignal }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  useEffect(() => {
    if (!scrollSignal || !isNarrow) return;
    const el = contentRef.current;
    if (!el) return;
    const t = setTimeout(() => { if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, 240);
    return () => clearTimeout(t);
  }, [scrollSignal, isNarrow]);
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    const tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.mentor')) return;
    setMCollapsed(true);
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .pick-row, .rn-item');
    if (!isControl) {
      const el = contentRef.current;
      if (el) setTimeout(() => { if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }, 80);
    }
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

function placeCorrect(n, correctIdx, screen) {
  const others = [];
  for (let i = 0; i < n; i++) if (i !== correctIdx) others.push(i);
  let seed = ((screen + 7) * 48271) % 2147483647;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = others[i]; others[i] = others[j]; others[j] = t; }
  const pos = n > 1 ? 1 + (screen % (n - 1)) : 0;
  const out = []; let oi = 0;
  for (let p = 0; p < n; p++) out.push(p === pos ? correctIdx : others[oi++]);
  return out;
}
const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const order = useMemo(() => placeCorrect(options.length, correctIdx, screen), [options.length, correctIdx, screen]);
  const dispOptions = order.map(i => options[i]);
  const dispCorrect = order.indexOf(correctIdx);
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === dispCorrect)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === dispCorrect;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options: dispOptions, correctIndex: dispCorrect, correctAnswer: dispOptions[dispCorrect], picked: i, studentAnswerIndex: i, studentAnswer: dispOptions[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {dispOptions.map((opt, i) => {
            let cls = 'option';
            if (solved) { if (i === dispCorrect) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === dispCorrect ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}</p>
          <p className="body" style={{ margin: 0 }}>{solved ? explainCorrect : (explainWrong[order[picked]] ?? explainWrong.default)}</p>
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

const Kw = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;

const CodeFile = ({ name, children, minH }) => (
  <div className="editor">
    <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">{name}</span></div>
    <div className="editor-body" style={{ minHeight: minH }}><pre className="editor-code">{children}</pre></div>
  </div>
);

// ===== TELEFON =====
const Phone = ({ children, label, lit = true }) => (
  <div className="phone-wrap">
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen" style={lit ? undefined : { opacity: 0.4 }}>{children}</div>
    </div>
    {label && <div className="phone-label">{label}</div>}
  </div>
);

// ===== MAHSULOTLAR (backend'dan keladigan ma'lumot) =====
const PRODUCTS = [
  { id: 1, ico: '📱', name: 'Telefon', price: '2 500 000', desc: "Zamonaviy smartfon, 128GB xotira." },
  { id: 2, ico: '🎧', name: 'Quloqchin', price: '300 000', desc: "Simsiz, shovqin bostiruvchi." },
  { id: 3, ico: '⌚', name: 'Aqlli soat', price: '800 000', desc: "Salomatlik va bildirishnomalar." }
];

const ProductList = ({ onTap }) => (
  <div className="rn-page">
    <div className="rn-topbar">🛍️ mini-do'kon</div>
    {PRODUCTS.map(p => (
      <div key={p.id} className="rn-item" onClick={onTap ? () => onTap(p) : undefined}>
        <span className="ri-ico">{p.ico}</span><span className="ri-name">{p.name}</span><span className="ri-price">{p.price}</span>
      </div>
    ))}
  </div>
);
const ProductDetail = ({ p, onBack }) => (
  <div className="rn-page">
    <div className="rn-topbar"><span className="rn-back" onClick={onBack}>‹ Orqaga</span></div>
    <div style={{ textAlign: 'center', fontSize: 40 }}>{p.ico}</div>
    <div className="rn-text title" style={{ textAlign: 'center' }}>{p.name}</div>
    <div className="rn-text" style={{ textAlign: 'center', color: T.ink2 }}>{p.desc}</div>
    <div className="rn-text price" style={{ textAlign: 'center' }}>{p.price} so'm</div>
    <div className="rn-text btn">Savatga qo'shish</div>
  </div>
);

// ===== KOMPONENTLAR (s2) =====
const COMPONENTS = [
  { id: 'image', ico: '🖼️', label: 'Image', desc: "Rasm ko'rsatish — web'dagi <img>." },
  { id: 'press', ico: '👆', label: 'Pressable', desc: "Bosiladigan element — onPress bilan (web'dagi onClick / tugma)." },
  { id: 'scroll', ico: '📜', label: 'ScrollView', desc: "Aylantiriladigan konteyner — uzun kontent uchun." },
  { id: 'flat', ico: '📋', label: 'FlatList', desc: "Ro'yxat — ko'p elementni samarali ko'rsatadi (mahsulot, xabar, post)." },
  { id: 'input', ico: '⌨️', label: 'TextInput', desc: "Matn kiritish maydoni — web'dagi <input>." }
];

// ===== APP OQIMI (final s15) =====
const FLOW = [
  { id: 'open', ico: '📱', label: 'Ilova ochildi', d: "birinchi ekran ochiladi." },
  { id: 'fetch', ico: '🔌', label: 'Backend fetch', d: "API'dan mahsulot oladi." },
  { id: 'list', ico: '📋', label: 'FlatList', d: "ro'yxatni ko'rsatadi." },
  { id: 'tap', ico: '👆', label: 'Mahsulotni tap', d: "navigation.navigate." },
  { id: 'detail', ico: '🔎', label: 'Detail ekran', d: "tafsilot ochiladi (push)." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['list', 'open', 'detail', 'fetch', 'tap'];

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Har bir mahsulotni kodga qo'lda yozaman, bitta ekranda" },
    { id: 'b', label: "Ko'p ekran (navigatsiya) + backend'dan real ma'lumot (fetch)" },
    { id: 'c', label: "Imkonsiz — mobil ilovada faqat bitta ekran bo'ladi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Dars · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Bitta ekran — bu hali <span className="italic" style={{ color: T.accent }}>ilova</span> emas. Real do'kon qanday bo'ladi?</h1>
        <Mentor>T6'da bitta ekran qildingiz. Lekin haqiqiy do'konda ko'p mahsulot, tafsilot sahifasi va real ma'lumot bor. Tugmani bosing — qanday ko'rinishini tasavvur qiling.</Mentor>
        <Zoomable><Split>
          <Col>
            <Phone label={tried ? 'ko\'p ekran + real ma\'lumot' : 'haqiqiy ilova?'} lit={tried}>
              {tried
                ? <ProductList />
                : <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>?</p>}
            </Phone>
            <button className="btn-soft" style={{ alignSelf: 'center' }} onClick={poke} disabled={tried}>{tried ? '✓ Ko\'rdingiz' : "▶ Real do'kon ilovasi"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Real ilova qanday quriladi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Real ilova = ko'p ekran (<b>navigatsiya</b>) + backend'dan <b>real ma'lumot</b> (fetch). Bugun mini-do'kon mobilni shunday quramiz — va u o'sha backendga ulanadi.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Ko'proq komponentlar (FlatList, Pressable…)", tag: 'komponent' },
    { text: "Navigatsiya — ko'p ekran (Stack)", tag: 'navigatsiya' },
    { text: "Backend'dan ma'lumot olish (fetch)", tag: 'api' },
    { text: "AsyncStorage — telefonda saqlash", tag: 'xotira' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — ko'p ekranli mobil do'kon</p>
      <Phone label="mini-do'kon mobil"><ProductList /></Phone>
    </Col>
  );
  const StepsB = (
    <Col>
      <p className="flow-label">Bugungi 4 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic scrollSignal={showSteps} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Bitta ekrandan — <span className="italic" style={{ color: T.accent }}>to'liq ilova</span>ga.</h2></div>
        <Mentor>T6'da View/Text'ni o'rgandingiz. Bugun real ilova quramiz: ro'yxat, tafsilot ekrani, backend'dan ma'lumot. Eng muhimi — mobil <b style={{ color: T.ink }}>o'sha backend</b>ga ulanadi.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — KOMPONENTLAR =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(COMPONENTS.map(c => c.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= COMPONENTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = COMPONENTS.find(c => c.id === active);
  return (
    <Stage eyebrow="Komponentlar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 komponentni oching (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Real ekran uchun <span className="italic" style={{ color: T.accent }}>yana 5 komponent</span>.</h2></div>
        <Mentor>View va Text — asos. Real ilova uchun yana bir nechta komponent kerak. Ko'pchiligi web'dagiga o'xshaydi. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {COMPONENTS.map(c => <button key={c.id} className="gchip" onClick={() => tap(c.id)} style={seen.has(c.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(c.id) ? '✓ ' : ''}{c.ico} {c.label}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Eng muhimi — <b>FlatList</b>: backend'dan kelgan mahsulotlar ro'yxatini shu bilan ko'rsatamiz. Keyingi ekranda ko'ramiz.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 17, marginRight: 6 }}>{cur.ico}</span><span className="mono" style={{ color: T.accent }}>{cur.label}</span></p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Komponentni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — FLATLIST =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ro'yxat · FlatList" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ro'yxatni chizing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>FlatList</span> — ma'lumotni <span className="italic" style={{ color: T.accent }}>ro'yxatga</span> aylantiradi.</h2></div>
        <Mentor>FlatList massivni oladi va har element uchun bitta qator chizadi — o'zingiz qo'lda yozmaysiz. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="List.js" minH={110}>
              <Kw>{'<FlatList'}</Kw>{'\n'}
              {'  '}<At>data</At>{'={mahsulotlar}'}{'\n'}
              {'  '}<At>renderItem</At>{'={({item}) => ('}{'\n'}
              {'    '}<Kw>{'<Text>'}</Kw>{'{item.name}'}<Kw>{'</Text>'}</Kw>{'\n'}
              {'  )}'}{'\n'}
              <Kw>{'/>'}</Kw>
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Chizildi' : "▶ Ro'yxatni telefonda chizish"}</button>
          </Col>
          <Col>
            <Phone label="FlatList natijasi">
              {show ? <ProductList /> : <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>data = [ … ]</p>}
            </Phone>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 ta mahsulot — 3 qator, avtomatik. 100 ta bo'lsa ham bitta FlatList yetadi. Endi bu ma'lumot qayerdan keladi — backend'dan.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Mahsulotlarning aylantiriladigan ro'yxati uchun qaysi komponent?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mahsulotlarning <span className="italic" style={{ color: T.accent }}>aylantiriladigan ro'yxati</span> uchun qaysi komponent?</h2></>}
    options={["FlatList — massivni olib, har element uchun qator chizadi", "Text — chunki matn ko'rsatadi", "Image — chunki rasmlar bor", "TextInput — chunki kiritish kerak"]} correctIdx={0}
    explainCorrect="To'g'ri! FlatList ma'lumot massivini oladi va har element uchun avtomatik qator chizadi — ro'yxatlar (mahsulot, xabar, post) uchun ideal va samarali."
    explainWrong={{
      1: "Text faqat bitta matn. Ro'yxat (ko'p element) uchun FlatList kerak.",
      2: "Image — rasm. Ro'yxatni FlatList chizadi (ichida rasm ham bo'lishi mumkin).",
      3: "TextInput — matn kiritish uchun. Ro'yxat ko'rsatish — FlatList.",
      default: "Aylantiriladigan ro'yxat — FlatList."
    }} />
);

// ===== SCREEN 5 — STACK NAVIGATOR =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Navigatsiya · Stack" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Metaforani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ko'p ekran — <span className="italic" style={{ color: T.accent }}>Stack Navigator</span>.</h2></div>
        <Mentor>Ilovada ekranlar <b style={{ color: T.ink }}>kartalar dastasi</b> kabi: yangi ekran ustiga qo'yiladi (push), "Orqaga" bilan olib tashlanadi (pop). Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🗂️ Stack — kartalar dastasi</p><p className="body" style={{ margin: 0, color: T.ink }}>Ro'yxat ekran — pastda. Mahsulotni bossangiz, Detail ekran <b>ustiga qo'yiladi</b> (push). "Orqaga" — Detail olib tashlanadi (pop), ro'yxatga qaytasiz.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "push/pop nima?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>⬆️ <b>push:</b> yangi ekran ochish (Detail ustiga qo'yiladi).</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>⬇️ <b>pop:</b> "Orqaga" — yuqoridagi ekran olib tashlanadi.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🌐 <b>Tanish:</b> brauzerdagi «oldinga/orqaga» kabi, lekin mobil uchun.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi buni harakatda ko'ramiz — keyingi ekranda mahsulotni bosib, Detail ekran qanday ochilishini kuzating.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — NAVIGATSIYA ANIMATSIYA =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [view, setView] = useState('list');
  const [sel, setSel] = useState(PRODUCTS[0]);
  const [opened, setOpened] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = opened;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const open = (p) => { setSel(p); setView('detail'); setOpened(true); setSc(n => n + 1); };
  const back = () => { setView('list'); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Animatsiya · navigatsiya" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Mahsulotni oching"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulotni bosing — Detail ekran <span className="italic" style={{ color: T.accent }}>suriladi</span>.</h2></div>
        <Mentor>Mana navigatsiya harakatda. Telefon ichida mahsulotni bosing — yangi ekran o'ngdan suriladi (push). "‹ Orqaga" bilan qaytasiz (pop). Sinab ko'ring!</Mentor>
        <Zoomable><div className="split">
          <Col>
            <Phone label={view === 'list' ? 'ro\'yxat ekrani' : 'detail ekrani (push)'}>
              {view === 'list' ? <ProductList onTap={open} /> : <ProductDetail p={sel} onBack={back} />}
            </Phone>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">👆 Sinab ko'ring</p><p className="body" style={{ margin: 0, color: T.ink }}>Telefonda biror mahsulotni bosing → Detail ochiladi. "‹ Orqaga" → ro'yxatga qaytadi.</p></div>
            {!opened && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Telefonda mahsulotni bosing ←</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana push/pop! Har ekran alohida komponent; navigation ularni stack qilib boshqaradi. Erkin sinab ko'ring.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — navigate() KODDA =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Kod · navigate" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kodni o'qing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir ekrandan boshqasiga: <span className="mono" style={{ color: T.accent }}>navigation.navigate</span>.</h2></div>
        <Mentor>Bosilganda boshqa ekranga o'tish — bitta qator. <span className="mono">onPress</span> ichida <span className="mono">navigation.navigate</span> chaqirasiz va kerakli ma'lumotni (id) uzatasiz. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="ListScreen.js" minH={110}>
              <Kw>{'<Pressable'}</Kw>{'\n'}
              {'  '}<At>onPress</At>{'={() => navigation.'}<At>navigate</At>{'('}{'\n'}
              {'    '}<St>'Detail'</St>{', { id: item.id }'}{'\n'}
              {'  )}'}<Kw>{'>'}</Kw>{'\n'}
              {'  '}<Kw>{'<Text>'}</Kw>{'{item.name}'}<Kw>{'</Text>'}</Kw>{'\n'}
              <Kw>{'</Pressable>'}</Kw>
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Qatorlarni tushuntir"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>👆 <b>onPress:</b> bosilganda ishlaydi (web'dagi onClick).</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🧭 <b>navigate('Detail'):</b> «Detail» ekraniga o'tadi.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>📦 <b>{'{ id: item.id }'}:</b> Detail ekranga qaysi mahsulot ekanini uzatadi.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Detail ekran shu id'ni olib, o'sha mahsulot tafsilotini ko'rsatadi. Aniq, oddiy.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="RN'da bir ekrandan boshqasiga qanday o'tasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>RN'da bir ekrandan boshqasiga qanday <span className="italic" style={{ color: T.accent }}>o'tasiz</span>?</h2></>}
    options={["navigation.navigate('Ekran') — Stack Navigator orqali", "Sahifani qayta yuklayman", "<a href> link bilan", "Iloji yo'q — har ekran alohida ilova"]} correctIdx={0}
    explainCorrect="To'g'ri! Stack Navigator ekranlarni boshqaradi; navigation.navigate('Ekran') bilan yangi ekran ochasiz (push), back bilan qaytasiz (pop). Bitta qator."
    explainWrong={{
      1: "Mobil ilova web emas — sahifa qayta yuklanmaydi. navigation.navigate ishlatiladi.",
      2: "<a href> — bu web. RN'da navigation.navigate.",
      3: "Aksincha — bitta ilova, ko'p ekran, navigation ularni bog'laydi.",
      default: "navigation.navigate (Stack Navigator)."
    }} />
);

// ===== SCREEN 9 — BACKEND'DAN FETCH =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="API · fetch" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kodni o'qing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Real ma'lumot — <span className="mono" style={{ color: T.accent }}>fetch</span> bilan backend'dan.</h2></div>
        <Mentor>Mahsulotlarni kodga qo'lda yozmaysiz. <span className="mono">useEffect</span> ichida <span className="mono">fetch</span> bilan <b style={{ color: T.ink }}>o'sha Node.js backend</b>dan olasiz — web bilan bir xil API. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="ListScreen.js" minH={120}>
              <Kw>const</Kw>{' [mahsulotlar, setM] = '}<At>useState</At>{'([])'}{'\n\n'}
              <At>useEffect</At>{'(() => {'}{'\n'}
              {'  '}<At>fetch</At>{'('}<St>'https://backend.../mahsulotlar'</St>{')'}{'\n'}
              {'    .then(r => r.json())'}{'\n'}
              {'    .then(setM)'}{'\n'}
              {'}, [])'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Tanish ko'rinyaptimi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step"><span className="agent-lbl">🔌 O'SHA BACKEND</span><p className="agent-msg">Bu — Modul 4/9'dagi o'sha Node.js API. Web-sayt ham, mobil ilova ham <b>bitta backend</b>dan ma'lumot oladi. O'tgan darsdagi «ko'p eshik, bitta tizim»ni eslang!</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">useEffect</span> + <span className="mono">fetch</span> — aynan web React'dagidek. Backendni qayta qurmaysiz; faqat ulaysiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — FETCH ANIMATSIYA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'loaded' : 'idle'); // idle → loading → loaded
  const [sc, setSc] = useState(0);
  const done = phase === 'loaded';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const run = () => {
    if (phase !== 'idle') return;
    setPhase('loading'); setSc(n => n + 1);
    setTimeout(() => { setPhase('loaded'); setSc(n => n + 1); }, 1100);
  };
  return (
    <Stage eyebrow="Animatsiya · fetch" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ma'lumotni yuklang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ilova ochildi → backend'dan ma'lumot <span className="italic" style={{ color: T.accent }}>oqib keladi</span>.</h2></div>
        <Mentor>Mana fetch harakatda: ilova avval bo'sh (yuklanmoqda), keyin backend'dan mahsulotlar kelib ro'yxatga to'ladi. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fetch-flow"><span className="ff-node">📱</span><span className={`ff-arrow ${phase === 'loading' ? 'on' : ''}`}>→</span><span className="ff-node">🔌</span><span className={`ff-arrow ${phase === 'loading' ? 'on' : ''}`}>→</span><span className="ff-node">🗄️</span></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={phase !== 'idle'} onClick={run}>{phase === 'idle' ? "▶ Backend'dan ol (fetch)" : phase === 'loading' ? '⏳ yuklanmoqda…' : '✓ Yuklandi'}</button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ma'lumot serverda turadi; ilova har ochilganda eng yangisini oladi. Mahsulot qo'shsangiz — kod o'zgartirmasdan ilovada paydo bo'ladi.</p></div>}
          </Col>
          <Col>
            <Phone label={phase === 'loaded' ? 'backend ma\'lumoti' : phase === 'loading' ? 'yuklanmoqda…' : 'ilova ochildi'}>
              {phase === 'loaded' ? <ProductList />
                : phase === 'loading' ? <div className="rn-spin" />
                  : <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>bo'sh — tugmani bosing</p>}
            </Phone>
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Mobil ilova real mahsulotlarni qayerdan oladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mobil ilova real mahsulotlarni <span className="italic" style={{ color: T.accent }}>qayerdan</span> oladi?</h2></>}
    options={["Backend API'dan — fetch bilan, web-sayt bilan bir xil server", "Kodga qo'lda yozilgan ro'yxatdan", "Telefon xotirasidan, har doim", "Internetdan tasodifiy"]} correctIdx={0}
    explainCorrect="To'g'ri! Mobil ilova backend API'ga fetch yuboradi va real ma'lumotni oladi — bu o'sha Node.js server (web-sayt ham shundan oladi). Bitta backend, ko'p mijoz."
    explainWrong={{
      1: "Qo'lda yozilgan ro'yxat o'zgarmaydi. Real, yangilanadigan ma'lumot backend'dan keladi.",
      2: "Telefon xotirasi (AsyncStorage) — mahalliy saqlash uchun. Asosiy ma'lumot backend'da.",
      3: "Tasodifiy emas — aniq backend API'dan (sizning serveringiz).",
      default: "Backend API'dan, fetch bilan."
    }} />
);

// ===== SCREEN 12 — CASE: ko'p ekranli ilova =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // 0: prompt, 1: loading, 2: list, 3: detail, 4: done
  const [step, setStep] = useState(storedAnswer ? 4 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= 4;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const NOTES = [
    "📱 Ilova ochildi — birinchi ekran (mahsulotlar ro'yxati).",
    "🔌 Backend'dan fetch — mahsulotlar yuklanmoqda…",
    "📋 FlatList — 3 mahsulot ro'yxati ko'rindi.",
    "👆 «Telefon»ni tap — navigation.navigate('Detail') → Detail ekran suriladi.",
    "✅ Detail ekran: tafsilot, narx, «Savatga». Ko'p ekranli ilova ishladi!"
  ];
  const advance = () => { if (!done) { setStep(n => n + 1); setSc(n => n + 1); } };
  return (
    <Stage eyebrow="Hayotiy · to'liq ilova" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ilovani yuring (${step}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">mini-do'kon mobil — <span className="italic" style={{ color: T.accent }}>boshidan oxirigacha</span>.</h2></div>
        <Mentor>Mana hammasi birga: ilova ochiladi, backend'dan ma'lumot keladi, ro'yxat chiqadi, mahsulotni bossangiz Detail ochiladi. Tugmani bosib kuzating.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {NOTES.slice(0, step + 1).map((n, i) => (
                <div key={i} className={`agent-step fade-step ${i === 4 ? 'done' : ''}`}><span className="as-phase">qadam {i + 1}</span><span className="as-txt">{n}</span></div>
              ))}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Ilova ishladi' : step === 0 ? '▶ Boshlash' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <Phone label={step <= 1 ? 'ilova' : step === 3 || step === 4 ? 'detail ekran' : 'ro\'yxat ekran'}>
              {step === 0 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>tugmani bosing</p>}
              {step === 1 && <div className="rn-spin" />}
              {step === 2 && <ProductList />}
              {(step === 3 || step === 4) && <ProductDetail p={PRODUCTS[0]} />}
            </Phone>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ro'yxat (backend) + Detail (navigatsiya) — bu to'liq ishlaydigan mobil ilova. Amaliyot darsida o'zingiz quryapsiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — ASYNCSTORAGE =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Xotira · AsyncStorage" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Nima uchun?"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>AsyncStorage</span> — telefonda <span className="italic" style={{ color: T.accent }}>saqlash</span>.</h2></div>
        <Mentor>Ba'zi narsalarni telefonning o'zida saqlash kerak — masalan savat yoki «kirgan foydalanuvchi». AsyncStorage — mobil uchun localStorage. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="cart.js" minH={90}>
              <Cm>{'// saqlash'}</Cm>{'\n'}
              {'AsyncStorage.'}<At>setItem</At>{'('}<St>'savat'</St>{', json)'}{'\n\n'}
              <Cm>{'// o\'qish (ilova qayta ochilganda)'}</Cm>{'\n'}
              <Kw>const</Kw>{' s = '}<Kw>await</Kw>{' AsyncStorage.'}<At>getItem</At>{'('}<St>'savat'</St>{')'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Qachon kerak?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🛒 <b>Savat:</b> ilovani yopib ochsangiz ham saqlanib qoladi.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🔑 <b>Token:</b> «kirgan» holatni eslab, qayta login so'ramaydi.</p></div>
                  <div className="frame-warn"><p className="body" style={{ margin: 0, color: T.ink }}>⚠️ Faqat mahalliy, kichik ma'lumot uchun. Asosiy ma'lumot — baribir backend'da.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AsyncStorage = telefon xotirasi (o'tgan darsdagi baza g'oyasi, lekin qurilmada va kichik). Backend bilan birga ishlaydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (global) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Web-do'koningiz bor. Mobil ilova uchun backendni nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Web-do'koningiz bor. Mobil ilova uchun <span className="italic" style={{ color: T.accent }}>backendni</span> nima qilasiz?</h2></>}
    options={["O'sha backendni ishlataman — mobil ilova unga fetch bilan ulanadi (qayta qurmayman)", "Mobil uchun butunlay yangi backend va baza quraman", "Backend kerak emas — hammasi telefonda", "Ma'lumotni qo'lda nusxalayman"]} correctIdx={0}
    explainCorrect="To'g'ri! Backend va baza tayyor — ular har qanday mijoz bilan ishlaydi. Mobil ilova faqat yana bir mijoz: o'sha API'ga fetch yuboradi. O'tgan darsdagi «ko'p eshik, bitta tizim». Backendni qayta qurish — keraksiz."
    explainWrong={{
      1: "Yangi backend — keraksiz va xato: ma'lumot bo'linib ketadi. Mobil o'sha backendga ulanadi.",
      2: "Backend kerak — real, umumiy ma'lumot u yerda. Telefon faqat ko'rsatadi.",
      3: "Qo'lda nusxalash imkonsiz va xato. Bitta umumiy backend yetadi.",
      default: "O'sha backendni ishlatasiz — mobil unga fetch bilan ulanadi."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: app oqimi =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => (storedAnswer ? [...FLOW_ORDER] : []));
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const done = placed.length === FLOW_ORDER.length;
  const need = FLOW_ORDER[placed.length];
  const fired = useRef(!!storedAnswer);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Mobil ilova oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
    }
  }, [done]);
  const flowById = (id) => FLOW.find(f => f.id === id);
  const tap = (id) => {
    if (placed.includes(id) || done) return;
    if (id === need) { setPlaced(p => [...p, id]); setHint(null); }
    else {
      const needF = flowById(need);
      setShakeId(id); setHint(`Hozir emas — avval ${needF.ico} ${needF.label} bo'lishi kerak.`);
      setTimeout(() => setShakeId(x => (x === id ? null : x)), 450);
    }
  };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Oqimni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: ilova ish oqimini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Ko'p ekranli ilova qanday ishlaydi? Eslang: ilova ochiladi → backend'dan fetch → FlatList ro'yxat → mahsulotni tap → Detail ekran. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">ilova oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Ochildi → fetch → FlatList → tap → Detail</b>. Mana ko'p ekranli mobil ilova ishlash sxemasi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qadamni tanlang (keyingisi: {placed.length}/{FLOW_ORDER.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {FLOW_SCRAMBLED.map(id => {
                const f = flowById(id);
                const isPlaced = placed.includes(id);
                return (
                  <button key={id} className={`pick-row ${isPlaced ? 'picked' : ''} ${shakeId === id ? 'shake' : ''}`} disabled={isPlaced || done} onClick={() => tap(id)}>
                    <span style={{ marginRight: 6 }}>{f.ico}</span>
                    <span style={{ flex: 1 }}>{f.label} <span style={{ color: T.ink3, fontWeight: 500 }}>· {f.d}</span></span>
                    <span className="pick-plus">{isPlaced ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint}</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Komponentlar: FlatList (ro'yxat), Pressable, Image, ScrollView, TextInput",
    "Navigatsiya — Stack Navigator: navigation.navigate (push/pop)",
    "Backend'dan ma'lumot: useEffect + fetch (o'sha Node.js API)",
    "Mobil — yana bir mijoz: bitta backend, ko'p eshik (web + bot + mobil)",
    "AsyncStorage — telefonda mahalliy saqlash (savat, token)"
  ];
  const HOMEWORK = [
    { b: "Chizing", t: "— mobil ilovangiz ekranlarini: qaysi ro'yxat, qaysi detail?" },
    { b: "Ulang", t: "— qaysi ekran backend'dan qaysi ma'lumotni fetch qiladi?" },
    { b: "O'ylang", t: "— nimani AsyncStorage'da (telefonda), nimani backend'da saqlaysiz?" }
  ];
  const GLOSSARY = [
    { b: 'FlatList', t: '— ma\'lumot ro\'yxati' },
    { b: 'Pressable', t: '— bosiladigan element' },
    { b: 'Stack Navigator', t: '— ekranlar dastasi' },
    { b: 'navigate', t: '— boshqa ekranga o\'tish' },
    { b: 'push / pop', t: '— ekran qo\'shish / olib tashlash' },
    { b: 'fetch', t: '— backend\'dan ma\'lumot olish' },
    { b: 'AsyncStorage', t: '— telefonda saqlash' },
    { b: 'mijoz (client)', t: '— web/bot/mobil — bitta backend' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Ko'p ekranli ilova</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>to'liq mobil ilova</span> qura olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Komponentlar, navigatsiya (Stack), backend'dan fetch va AsyncStorage'ni o'rgandingiz." : "Yaxshi harakat! Navigatsiya (navigate) va backend'dan fetch bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi — P1: mini-do'kon mobil ilovasini amalda qurish (praktika).</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ReactNativeAppLesson({ lang: langProp, onFinished }) {
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
    const finalAnswers = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean);
    const finalCorrect = finalAnswers.filter(a => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,500&family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
        .lesson-root h1,.lesson-root h2,.lesson-root h3,.lesson-root h4,.lesson-root h5,.lesson-root h6,.lesson-root p,.lesson-root ul,.lesson-root ol { margin: 0; padding: 0; }
        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        .btn { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 14px; font-size: 12.5px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.6; cursor: not-allowed; }
        .gchip { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 12px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); } .gchip:hover:not(:disabled) { transform: translateY(-1px); }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope'; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

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
        .mentor-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope'; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope'; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .h-title { font-size: clamp(22px,4vw,38px); } .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        .stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55); }

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(15px,2.5vw,22px); box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.accent}; flex-shrink: 0; min-width: 38px; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 600; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .note-h { font-weight: 700; font-size: 13.5px; margin: 0 0 5px; display: flex; align-items: center; }

        .editor { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .editor-bar { background: #2D2D2D; padding: 7px 11px; display: flex; align-items: center; gap: 9px; }
        .editor-tab { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; background: #1E1E1E; padding: 4px 11px; border-radius: 6px 6px 0 0; word-break: break-all; }
        .editor-body { background: ${CODE.bg}; padding: 12px 14px; }
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.7; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }

        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 11px 13px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; }

        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }
        .agent-step { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 10px; padding: 10px 13px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); border-left: 3px solid ${T.blue}; }
        .agent-step.done { border-left-color: ${T.success}; background: ${T.successSoft}; }
        .as-phase { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.blue}; letter-spacing: 0.04em; }
        .agent-step.done .as-phase { color: ${T.success}; }
        .as-txt { font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }

        /* ===== TELEFON ===== */
        .phone-wrap { display: flex; flex-direction: column; align-items: center; gap: 0; }
        .phone { width: clamp(150px,42vw,196px); background: #16202E; border-radius: 28px; padding: 12px 9px 16px; box-shadow: 0 16px 38px -8px rgba(${T.shadowBase},0.42), inset 0 0 0 2px #2b3a4f; }
        .phone-notch { width: 52px; height: 5px; background: #3a4660; border-radius: 99px; margin: 2px auto 9px; }
        .phone-screen { background: ${T.bg}; border-radius: 17px; min-height: 200px; padding: 13px 11px; display: flex; flex-direction: column; gap: 8px; transition: opacity 0.35s; }
        .phone-label { text-align: center; color: ${T.ink2}; font-family: 'Manrope'; font-weight: 600; font-size: 11px; margin-top: 9px; }
        .rn-view { background: ${T.paper}; border-radius: 11px; padding: 12px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.18); transition: all 0.3s; }
        .rn-view.on { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 5px 14px -6px rgba(255,79,40,0.22); }
        .rn-text { font-family: 'Manrope'; font-weight: 500; font-size: 13px; color: ${T.ink}; }
        .rn-text.title { font-weight: 800; font-size: 16px; }
        .rn-text.price { color: ${T.accent}; font-weight: 700; font-family: 'JetBrains Mono'; font-size: 12.5px; }
        .rn-text.btn { background: ${T.accent}; color: #fff; text-align: center; padding: 9px; border-radius: 9px; font-weight: 700; }
        @keyframes rn-slide { from { transform: translateX(34px); opacity: 0; } to { transform: none; opacity: 1; } }
        .rn-page { animation: rn-slide 0.34s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 7px; }
        .rn-topbar { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 800; font-size: 13px; color: ${T.ink}; padding-bottom: 8px; margin-bottom: 4px; border-bottom: 1px solid rgba(167,166,162,0.3); }
        .rn-back { color: ${T.accent}; font-weight: 700; cursor: pointer; }
        .rn-item { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 10px; padding: 9px 11px; box-shadow: 0 3px 10px -6px rgba(${T.shadowBase},0.2); cursor: pointer; transition: all 0.15s; animation: el-pop 0.3s ease; }
        .rn-item:hover { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.28); }
        .ri-ico { font-size: 17px; } .ri-name { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; flex: 1; } .ri-price { font-family: 'JetBrains Mono'; font-size: 10.5px; color: ${T.accent}; }
        .rn-spin { width: 26px; height: 26px; border-radius: 50%; border: 3px solid rgba(167,166,162,0.35); border-top-color: ${T.accent}; animation: spin 0.8s linear infinite; margin: 44px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== FETCH FLOW ===== */
        .fetch-flow { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 0; }
        .ff-node { font-size: 24px; }
        .ff-arrow { color: ${T.ink3}; font-weight: 700; font-size: 20px; transition: color 0.3s; }
        .ff-arrow.on { color: ${T.accent}; animation: ff-blink 0.7s infinite; }
        @keyframes ff-blink { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 80px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .cyc-node.done { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .cyc-ico { font-size: 18px; line-height: 1; } .cyc-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .cyc-arrow { color: ${T.ink3}; font-weight: 700; font-size: 14px; } .cyc-arrow.on { color: ${T.success}; }

        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }

        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; } .gloss-body b { color: ${T.ink}; }

        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
