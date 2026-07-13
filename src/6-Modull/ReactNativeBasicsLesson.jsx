import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · DARS 6 (T6) — REACT NATIVE ASOSLARI — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi React Native nima, React'dan farqi (View/Text/StyleSheet), Expo bilan telefonda ko'rishni tushunadi.
//         "React bilasiz → mobil yasaysiz" — deyarli o'sha bilim, faqat tag nomlari o'zgaradi.
// Yondashuv: PhoneFrame simulyatori (ekran telefon ichida), konsept + RN kodini O'QISH/YIG'ISH (rostan Expo emas — simulyatsiya).
// Metafora: bir xil miya (React), yangi oshxona (mobil). div→View, p→Text.
// Signature animatsiyalar: PhoneFrame (ekran telefonda render), div→View tarjimon, Expo Go QR→telefon.
// Davomi: Modul 3 (React). Ko'prik: T7 (RN komponent/navigatsiya/API). Mahsulot: mini-do'kon mobil.
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

const LESSON_META = { lessonId: 'react-native-basics-06-v16', lessonTitle: { uz: 'React Native — asoslari', ru: 'React Native — основы' } };
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
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .pick-row');
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

// ===== TELEFON RAMKASI =====
const Phone = ({ children, label, lit = true }) => (
  <div className="phone-wrap">
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen" style={lit ? undefined : { opacity: 0.35 }}>{children}</div>
    </div>
    {label && <div className="phone-label">{label}</div>}
  </div>
);

// ===== QR (Expo Go) =====
const QR_PAT = [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1];
const QrBox = ({ scanning }) => (
  <div className={`qr ${scanning ? 'qr-scan' : ''}`}>{QR_PAT.map((v, i) => <i key={i} className={v ? '' : 'off'} />)}</div>
);

// ============================================================ MAVZU MA'LUMOTLARI

// ===== REACT → RN TARJIMA (s3) =====
const MAP = [
  { id: 'view', ico: '📦', web: '<div>', rn: '<View>', desc: "Konteyner. Web'dagi div o'rniga RN'da View — qutilar, bo'limlar uchun." },
  { id: 'text', ico: '🔤', web: '<p> / <span>', rn: '<Text>', desc: "Matn. RN'da HAR QANDAY matn <Text> ichida bo'lishi SHART — bu eng muhim qoida." },
  { id: 'style', ico: '🎨', web: 'CSS / className', rn: 'StyleSheet / style', desc: "Bezash. Alohida CSS fayl emas — JS obyekt: StyleSheet.create({...})." }
];

// ===== CASE EKRAN QATORLARI (s12) =====
const CASE_LINES = [
  { code: '<Text style={s.title}>mini-do\'kon</Text>', cls: 'title', txt: 'mini-do\'kon' },
  { code: '<Text>📱 Telefon</Text>', cls: '', txt: '📱 Telefon' },
  { code: '<Text style={s.price}>2 500 000 so\'m</Text>', cls: 'price', txt: '2 500 000 so\'m' },
  { code: '<Pressable style={s.btn}><Text>Sotib olish</Text></Pressable>', cls: 'btn', txt: 'Sotib olish' }
];

// ===== BUILDER (s7) =====
const BUILD = [
  { id: 'view', ico: '📦', label: 'View qo\'shish' },
  { id: 'title', ico: '🔤', label: 'Text (sarlavha)' },
  { id: 'prod', ico: '🔤', label: 'Text (mahsulot)' }
];

// ===== FIRST RN APP OQIMI (final s15) =====
const FLOW = [
  { id: 'expo', ico: '🚀', label: 'Expo loyiha', d: "expo bilan yangi loyiha yarat." },
  { id: 'screen', ico: '📝', label: 'View/Text', d: "ekran kodini yoz." },
  { id: 'style', ico: '🎨', label: 'StyleSheet', d: "bezab chiq." },
  { id: 'qr', ico: '📷', label: 'QR skan', d: "Expo Go'da QR skanerla." },
  { id: 'phone', ico: '📱', label: 'Telefonda', d: "ilova telefonda jonli." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['style', 'expo', 'phone', 'screen', 'qr'];

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Yo'q — mobil butunlay boshqa, noldan o'rganaman" },
    { id: 'b', label: "Ha — React bilaman; React Native bilan deyarli o'sha bilim bilan yasayman" },
    { id: 'c', label: "Iloji yo'q — mobil ilova juda qiyin" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Dars · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Web do'koningiz tayyor. Mijoz <span className="italic" style={{ color: T.accent }}>telefon ilovasi</span> istaydi. Yasay olasizmi?</h1>
        <Mentor>Modul 3'da React o'rgandingiz. Endi savol: telefon ilovasi uchun hammasini noldan o'rganasizmi? Tugmani bosing — javobni ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <Phone label={tried ? 'React Native bilan — mumkin!' : 'telefon ekrani'} lit={tried}>
              {tried
                ? <div className="rn-view on fade-step"><div className="rn-text title">mini-do'kon</div><div className="rn-text">📱 Telefon — 2 500 000</div><div className="rn-text btn">Sotib olish</div></div>
                : <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>?</p>}
            </Phone>
            <button className="btn-soft" style={{ alignSelf: 'center' }} onClick={poke} disabled={tried}>{tried ? '✓ Ko\'rdingiz' : "▶ Mobil ilova mumkinmi?"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Mobil uchun nima qilasiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>React Native</b> — React bilimingiz bilan haqiqiy telefon ilovasi yasash. Deyarli o'sha kod, faqat bir nechta tag o'zgaradi (div→View, p→Text). Bugun birinchi ekranni telefonga chiqaramiz!</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "React Native nima — React bilan mobil", tag: 'rn' },
    { text: "React'dan farqi: View, Text, StyleSheet", tag: 'farq' },
    { text: "Expo bilan telefonda ko'rish (QR)", tag: 'expo' },
    { text: "Birinchi ekranni yig'ish", tag: 'ekran' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — birinchi ekraningiz telefonda</p>
      <Phone label="mini-do'kon (RN)"><div className="rn-view on"><div className="rn-text title">mini-do'kon</div><div className="rn-text">📱 Telefon — 2 500 000</div><div className="rn-text btn">Sotib olish</div></div></Phone>
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
        <div className="head"><h2 className="title h-title fade-up">React bilimingizni <span className="italic" style={{ color: T.accent }}>telefonga</span> olib chiqamiz.</h2></div>
        <Mentor>Yaxshi xabar: mobil ilova — bu butunlay yangi dunyo emas. <b style={{ color: T.ink }}>React tafakkuringiz</b> o'sha qoladi; faqat bir nechta yangi komponent va Expo vositasini o'rganasiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — RN NIMA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · RN" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Misolni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">React Native — <span className="italic" style={{ color: T.accent }}>React bilan</span> haqiqiy mobil ilova.</h2></div>
        <Mentor>React Native — bu React bilimi bilan iOS va Android uchun <b style={{ color: T.ink }}>haqiqiy</b> (web-sayt emas) ilova yasash. Bitta kod — ikki platforma. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>📱 React Native nima?</p><p className="body" style={{ margin: 0, color: T.ink }}>React'ning «mobil ukasi». Siz React komponentlari yozasiz, ular telefonda <b>haqiqiy mobil ilova</b> bo'lib ishlaydi (iOS + Android).</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Metafora?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>👨‍🍳 <b>Bir xil oshpaz:</b> mahoratingiz (React) o'sha.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🍳 <b>Yangi oshxona:</b> mobil — asboblar biroz boshqacha (View, Text).</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>📲 <b>Natija:</b> bitta kod, App Store va Play Market'da ilova.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>RN ≠ web-sayt. U haqiqiy mobil ilova — telefon kamerasi, bildirishnomalar va h.k. bilan ishlay oladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REACT vs RN (tarjimon) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(MAP.map(m => m.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= MAP.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = MAP.find(m => m.id === active);
  return (
    <Stage eyebrow="Farq · tarjimon" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 farqni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Web → mobil <span className="italic" style={{ color: T.accent }}>tarjimon</span>: faqat 3 narsa o'zgaradi.</h2></div>
        <Mentor>Tuzilma o'sha (komponent, JSX, props) — faqat «so'zlar» o'zgaradi. Har tarjimani bosib, web va mobil farqini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="trans-row"><CodeFile name="React (web)" minH={0}><Kw>{'<div '}</Kw><At>className</At>{'='}<St>"box"</St><Kw>{'>'}</Kw>{'\n'}{'  '}<Kw>{'<p>'}</Kw>{'Salom'}<Kw>{'</p>'}</Kw>{'\n'}<Kw>{'</div>'}</Kw></CodeFile></div>
            <div style={{ textAlign: 'center', color: T.accent, fontWeight: 700 }}>↓ tarjima ↓</div>
            <div className="trans-row"><CodeFile name="React Native (mobil)" minH={0}><Kw>{'<View '}</Kw><At>style</At>{'={s.box}'}<Kw>{'>'}</Kw>{'\n'}{'  '}<Kw>{'<Text>'}</Kw>{'Salom'}<Kw>{'</Text>'}</Kw>{'\n'}<Kw>{'</View>'}</Kw></CodeFile></div>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {MAP.map(m => <button key={m.id} className="gchip" onClick={() => tap(m.id)} style={seen.has(m.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(m.id) ? '✓ ' : ''}{m.ico} {m.web}→{m.rn}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 17, marginRight: 6 }}>{cur.ico}</span><span className="mono" style={{ color: T.accent }}>{cur.web} → {cur.rn}</span></p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tarjimani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tuzilma bir xil! div→View, p→Text, CSS→StyleSheet. Qolgan hammasi — komponent, props, state — o'sha React.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="React Native nima uchun ishlatiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>React Native nima uchun <span className="italic" style={{ color: T.accent }}>ishlatiladi</span>?</h2></>}
    options={["React bilimi bilan haqiqiy mobil ilova (iOS + Android) yasash uchun", "Faqat web-saytlarni tezlashtirish uchun", "Ma'lumotlar bazasini boshqarish uchun", "Faqat o'yinlar uchun"]} correctIdx={0}
    explainCorrect="To'g'ri! React Native — React bilimingiz bilan iOS va Android uchun haqiqiy mobil ilova yasash imkonini beradi. Bitta kod — ikki platforma."
    explainWrong={{
      1: "RN web emas — u haqiqiy mobil ilova yasaydi. Web uchun oddiy React ishlatiladi.",
      2: "Bu — baza vazifasi (PostgreSQL). RN — mobil ilova interfeysi uchun.",
      3: "Faqat o'yin emas — har qanday mobil ilova (do'kon, chat, bank va h.k.).",
      default: "RN — React bilan haqiqiy mobil ilova yasash uchun."
    }} />
);

// ===== SCREEN 5 — VIEW va TEXT =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Komponent · View/Text" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Qoidani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">2 asosiy komponent: <span className="italic" style={{ color: T.accent }}>View</span> va <span className="italic" style={{ color: T.accent }}>Text</span>.</h2></div>
        <Mentor>RN'da deyarli hamma narsa shu ikkitadan quriladi. <b style={{ color: T.ink }}>View</b> — quti (div kabi), <b style={{ color: T.ink }}>Text</b> — matn. Muhim qoida bor — tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="App.js" minH={110}>
              <Kw>import</Kw>{' { View, Text } '}<Kw>from</Kw>{' '}<St>'react-native'</St>{'\n\n'}
              <Kw>{'<View>'}</Kw>{'\n'}
              {'  '}<Kw>{'<Text>'}</Kw>{'Salom, mini-do\'kon!'}<Kw>{'</Text>'}</Kw>{'\n'}
              <Kw>{'</View>'}</Kw>
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Muhim qoida nima?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>⚠️ <b>Eng muhim qoida:</b> RN'da har qanday matn <b>albatta</b> <span className="mono">{'<Text>'}</span> ichida bo'lishi kerak. View ichiga to'g'ridan matn yozsangiz — xato beradi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>View = konteyner (qatorlar, qutilar). Text = ko'rinadigan har bir harf. Boshqa komponentlar (Image, Button) ham bor, lekin shu ikkitasi asos.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — STYLESHEET =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bezash · StyleSheet" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Farqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bezash — <span className="mono" style={{ color: T.accent }}>StyleSheet</span> (CSS fayl emas).</h2></div>
        <Mentor>RN'da alohida CSS fayl yo'q. Stillar JS obyekt sifatida yoziladi — lekin nomlar deyarli o'sha (padding, color, fontSize). Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="styles" minH={120}>
              <Kw>const</Kw>{' s = StyleSheet.'}<At>create</At>{'({'}{'\n'}
              {'  box: { '}<At>padding</At>{': 20, '}<At>backgroundColor</At>{': '}<St>'#FF4F28'</St>{' },'}{'\n'}
              {'  title: { '}<At>fontSize</At>{': 22, '}<At>color</At>{': '}<St>'#fff'</St>{' }'}{'\n'}
              {'})'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "CSS'dan farqi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>📦 <b>JS obyekt:</b> CSS fayl emas — <span className="mono">StyleSheet.create({'{...}'})</span>.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🔤 <b>camelCase:</b> <span className="mono">background-color</span> → <span className="mono">backgroundColor</span>.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>📐 <b>flex default:</b> RN'da hamma narsa flex — joylash oson.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>CSS bilimingiz deyarli o'sha — faqat camelCase va JS obyekt. Qiyin emas.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — PHONE BUILDER =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer ? new Set(BUILD.map(b => b.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = added.size >= BUILD.length;
  const add = (id) => { setAdded(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Animatsiya · PhoneFrame" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ekranni yig'ing (${added.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi ekraningizni <span className="italic" style={{ color: T.accent }}>yig'ing</span> — telefonda paydo bo'ladi.</h2></div>
        <Mentor>Har bo'lakni qo'shing va o'ng tomonda telefonda jonli paydo bo'lishini kuzating. View qutisini va ikkita Text'ni qo'shing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {BUILD.map(b => <button key={b.id} className="pick-row" disabled={added.has(b.id)} onClick={() => add(b.id)} style={added.has(b.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, background: T.successSoft, color: T.success } : undefined}><span style={{ fontSize: 17, marginRight: 4 }}>{b.ico}</span><span style={{ flex: 1 }}>{b.label}</span><span className="pick-plus">{added.has(b.id) ? '✓' : '+'}</span></button>)}
            </div>
            <CodeFile name="App.js" minH={0}>
              <Kw>{'<View>'}</Kw>{added.has('view') ? '' : '   '}<Cm>{added.has('view') ? '' : '// View qo\'shing'}</Cm>{'\n'}
              {added.has('title') && <>{'  '}<Kw>{'<Text>'}</Kw>{'mini-do\'kon'}<Kw>{'</Text>'}</Kw>{'\n'}</>}
              {added.has('prod') && <>{'  '}<Kw>{'<Text>'}</Kw>{'📱 Telefon'}<Kw>{'</Text>'}</Kw>{'\n'}</>}
              <Kw>{'</View>'}</Kw>
            </CodeFile>
          </Col>
          <Col>
            <Phone label="jonli ekran">
              {added.size === 0
                ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>bo'sh ekran</p>
                : <div className={`rn-view ${added.has('view') ? 'on' : ''}`}>
                    {added.has('title') && <div className="rn-text title">mini-do'kon</div>}
                    {added.has('prod') && <div className="rn-text">📱 Telefon</div>}
                    {!added.has('title') && !added.has('prod') && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>View qo'shildi — endi Text qo'shing</p>}
                  </div>}
            </Phone>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — birinchi mobil ekraningiz! View ichida Text'lar. Aynan React kabi, faqat View/Text bilan.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="React Native'da matn (harflar) qayerga yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>RN'da matn (harflar) <span className="italic" style={{ color: T.accent }}>qayerga</span> yoziladi?</h2></>}
    options={["<Text> komponenti ichiga — har doim", "To'g'ridan-to'g'ri <View> ichiga", "<div> ichiga", "<p> ichiga"]} correctIdx={0}
    explainCorrect="To'g'ri! RN'da har qanday matn albatta <Text> ichida bo'lishi shart. View ichiga to'g'ridan matn yozsangiz, ilova xato beradi. Bu — RN'ning eng muhim qoidasi."
    explainWrong={{
      1: "View — konteyner, u to'g'ridan matnni ko'tarmaydi. Matn <Text> ichida bo'lishi kerak.",
      2: "<div> — bu web (React). RN'da matn <Text> ichida bo'ladi.",
      3: "<p> — bu ham web. RN'da uning o'rnida <Text> ishlatiladi.",
      default: "RN'da matn <Text> ichida bo'ladi."
    }} />
);

// ===== SCREEN 9 — EXPO NIMA =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vosita · Expo" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Nega qulay?"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Expo</span> — RN'ni osonlashtiruvchi vosita.</h2></div>
        <Mentor>RN'ni «yalang'och» o'rnatish murakkab (Xcode, Android Studio…). Expo bularning hammasini o'zi qiladi — siz faqat kod yozasiz. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🚀 Expo nima?</p><p className="body" style={{ margin: 0, color: T.ink }}>RN loyihasini yaratish, ishga tushirish va telefonda ko'rishni juda osonlashtiruvchi tayyor toolkit. Yangi boshlovchilar uchun ideal.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Nega Expo qulay?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>⚡ <b>Tez start:</b> bitta buyruq bilan loyiha tayyor.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🛠 <b>Murakkab sozlash yo'q:</b> Xcode/Android Studio shart emas.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>📱 <b>Expo Go:</b> ilovani o'z telefoningizda darrov ko'rasiz (keyingi ekran).</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Expo = mobil ishlab chiqishning «oson rejimi». Aynan u tufayli bugun darrov natija ko'rasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — EXPO GO QR =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [scanned, setScanned] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = scanned;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Animatsiya · Expo Go" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "QR'ni skanerlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">QR skanerlang — ilova <span className="italic" style={{ color: T.accent }}>telefoningizda</span> paydo bo'ladi.</h2></div>
        <Mentor>Expo Go ilovasini telefoningizga o'rnatasiz, kompyuterdagi QR kodni skanerlaysiz — va ilovangiz darrov telefonda ochiladi. Tugmani bosib ko'ring!</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">kompyuterdagi QR kod</p>
            <QrBox scanning={!scanned} />
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={scanned} onClick={() => { setScanned(true); setSc(n => n + 1); }}>{scanned ? '✓ Skanerlandi' : "📷 Telefonda skanerlash"}</button>
          </Col>
          <Col>
            <Phone label={scanned ? '🟢 ulandi — ilova jonli' : 'Expo Go (kutyapti)'} lit={scanned}>
              {scanned
                ? <div className="rn-view on fade-step"><div className="rn-text title">mini-do'kon</div><div className="rn-text">📱 Telefon — 2 500 000</div><div className="rn-text btn">Sotib olish</div></div>
                : <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>QR'ni kuting…</p>}
            </Phone>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana natija! Kodni o'zgartirsangiz, Expo o'zgarishni telefonga darrov yuboradi. Hech qanday murakkab o'rnatish yo'q.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Expo Go ilovasi nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Expo Go</span> nima qiladi?</h2></>}
    options={["QR kodni skanerlab, ilovangizni o'z telefoningizda darrov ko'rsatadi", "Kodni o'zi yozib beradi", "Ma'lumotlarni saqlaydi", "Faqat web-saytni ochadi"]} correctIdx={0}
    explainCorrect="To'g'ri! Expo Go — telefoningizdagi ilova. QR kodni skanerlaysiz va loyihangiz darrov telefonda ochiladi. Kodni o'zgartirsangiz — telefonda ham yangilanadi. Murakkab o'rnatishsiz."
    explainWrong={{
      1: "Kodni siz (yoki AI) yozasiz — Expo Go uni telefonda ko'rsatadi.",
      2: "Saqlash — bazaning ishi. Expo Go ilovani telefonda ishga tushiradi.",
      3: "Web emas — Expo Go haqiqiy mobil ilovani telefoningizda ochadi.",
      default: "Expo Go QR orqali ilovani telefonda ko'rsatadi."
    }} />
);

// ===== SCREEN 12 — CASE: birinchi ekran =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [shown, setShown] = useState(storedAnswer ? CASE_LINES.length : 0);
  const [sc, setSc] = useState(0);
  const done = shown >= CASE_LINES.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setShown(n => n + 1); setSc(n => n + 1); } };
  return (
    <Stage eyebrow="Hayotiy · birinchi ekran" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ekranni quring (${shown}/${CASE_LINES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">mini-do'kon mobil — <span className="italic" style={{ color: T.accent }}>to'liq birinchi ekran</span>.</h2></div>
        <Mentor>Endi to'liqroq ekran quramiz: sarlavha, mahsulot, narx va tugma. Har qatorni qo'shing va telefonda jonlanishini kuzating.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="ShopScreen.js" minH={130}>
              <Kw>{'<View '}</Kw><At>style</At>{'={s.card}'}<Kw>{'>'}</Kw>{'\n'}
              {CASE_LINES.slice(0, shown).map((l, i) => <span key={i}>{'  ' + l.code}{'\n'}</span>)}
              <Kw>{'</View>'}</Kw>
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Ekran tayyor' : shown === 0 ? '▶ Qurishni boshlash' : 'Keyingi qator →'}</button>
          </Col>
          <Col>
            <Phone label="mini-do'kon mobil">
              <div className="rn-view on">
                {shown === 0
                  ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>kod yozilmoqda…</p>
                  : CASE_LINES.slice(0, shown).map((l, i) => <div key={i} className={`rn-text ${l.cls}`}>{l.txt}</div>)}
              </div>
            </Phone>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'liq ekran! View ichida Text'lar va Pressable (tugma). Aynan React mantiqida — faqat mobil komponentlar bilan.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — BIR XIL REACT MIYA =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SAME = [
    { id: 'comp', ico: '🧩', label: 'Komponentlar', desc: "Funksiya-komponentlar, JSX — aynan web React kabi." },
    { id: 'props', ico: '📨', label: 'Props', desc: "Komponentga ma'lumot uzatish — o'sha props." },
    { id: 'state', ico: '🔄', label: 'useState', desc: "Holat va qayta render — bir xil hooklar (useState, useEffect)." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(SAME.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= SAME.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = SAME.find(s => s.id === active);
  return (
    <Stage eyebrow="Tinchlantiruvchi · o'sha React" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 narsani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Eng yaxshi xabar: <span className="italic" style={{ color: T.accent }}>React miyangiz</span> o'sha ishlaydi.</h2></div>
        <Mentor>View/Text va Expo'ni o'rgandingiz. Qolgan hammasi — Modul 3'dagi React. Har birini bosib, ishonch hosil qiling.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {SAME.map(s => <button key={s.id} className="gchip" onClick={() => tap(s.id)} style={seen.has(s.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(s.id) ? '✓ ' : ''}{s.ico} {s.label}</button>)}
            </div>
            {done && <div className="agent-card fade-step"><span className="agent-lbl">📍 KEYINGI DARS (T7)</span><p className="agent-msg">Birinchi ekran tayyor. T7'da ko'p ekranli ilova quramiz: <b>navigatsiya</b> (Stack Navigator), <b>API'dan ma'lumot</b> va <b>AsyncStorage</b>.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 17, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Narsani bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (global) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Web React'ni bilasiz. Mobil (RN) uchun asosan nimani qo'shimcha o'rganasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Web React'ni bilasiz. Mobil uchun asosan <span className="italic" style={{ color: T.accent }}>nimani</span> qo'shimcha o'rganasiz?</h2></>}
    options={["Asosan yangi komponent nomlari (View/Text) va Expo — React tafakkur o'sha", "Hammasini noldan — React umuman yordam bermaydi", "Boshqa dasturlash tili (masalan Java)", "Hech narsa — RN va web bir xil kod"]} correctIdx={0}
    explainCorrect="To'g'ri! React bilimingiz (komponent, props, state, JSX) to'liq ishlaydi. Qo'shimcha — bir nechta mobil komponent (View/Text/StyleSheet) va Expo. Shuning uchun React bilsangiz, mobilga o'tish oson."
    explainWrong={{
      1: "Aksincha — React bilimingizning katta qismi ishlaydi. Faqat tag nomlari o'zgaradi.",
      2: "Boshqa til shart emas — RN ham JavaScript/React. O'rganganingiz asqotadi.",
      3: "Butunlay bir xil emas — View/Text va Expo bor. Lekin tafakkur o'sha.",
      default: "Asosan View/Text va Expo — React tafakkur o'sha."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: first RN app oqimi =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Birinchi RN ilova oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: birinchi RN ilova qadamlarini <span className="italic" style={{ color: T.accent }}>tartibda</span> yig'ing.</h2></div>
        <Mentor>Bo'sh loyihadan telefondagi ilovagacha yo'l: Expo loyiha → View/Text bilan ekran → StyleSheet bilan bezab → QR skan → telefonda jonli. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">RN ilova oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Expo → View/Text → StyleSheet → QR skan → Telefonda</b>. Mana birinchi mobil ilovangiz yo'li.</p></div>}
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
    "React Native — React bilimi bilan haqiqiy mobil ilova (iOS + Android)",
    "Web → mobil: <div>→<View>, <p>→<Text>, CSS→StyleSheet",
    "Eng muhim qoida: har qanday matn <Text> ichida bo'ladi",
    "Expo + Expo Go — QR skanerlab, ilovani telefonda darrov ko'rasiz",
    "React tafakkur (komponent, props, state) — o'sha ishlaydi"
  ];
  const HOMEWORK = [
    { b: "Tarjima", t: "— web React komponentingizni qog'ozda RN'ga aylantiring (div→View, p→Text)" },
    { b: "Yozing", t: "— bitta View + 2 Text bo'lgan birinchi ekran kodini yozing" },
    { b: "O'ylang", t: "— mini-do'kon mobil ilovasida qanday ekranlar bo'ladi?" }
  ];
  const GLOSSARY = [
    { b: 'React Native', t: '— React bilan mobil ilova' },
    { b: 'View', t: '— konteyner (div o\'rniga)' },
    { b: 'Text', t: '— matn (har doim shu ichida)' },
    { b: 'StyleSheet', t: '— RN stillari (JS obyekt)' },
    { b: 'Expo', t: '— RN\'ni osonlashtiruvchi vosita' },
    { b: 'Expo Go', t: '— telefonda QR orqali ko\'rish' },
    { b: 'iOS + Android', t: '— bitta kod, ikki platforma' },
    { b: 'JSX', t: '— web kabi, o\'sha sintaksis' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Birinchi mobil ekran</span><h2 className="title h-title fade-up d1">React bilimingiz endi <span className="italic" style={{ color: T.accent }}>telefonda</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! React Native, View/Text/StyleSheet va Expo bilan telefonda ko'rishni o'rgandingiz." : "Yaxshi harakat! View/Text qoidasi va Expo Go (QR) bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars (T7) — RN'da ko'p ekran, navigatsiya va backend'dan ma'lumot.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ReactNativeBasicsLesson({ lang: langProp, onFinished }) {
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
        .trans-row { width: 100%; }

        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 11px 13px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; }

        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }

        /* ===== TELEFON ===== */
        .phone-wrap { display: flex; flex-direction: column; align-items: center; gap: 0; }
        .phone { width: clamp(150px,42vw,196px); background: #16202E; border-radius: 28px; padding: 12px 9px 16px; box-shadow: 0 16px 38px -8px rgba(${T.shadowBase},0.42), inset 0 0 0 2px #2b3a4f; }
        .phone-notch { width: 52px; height: 5px; background: #3a4660; border-radius: 99px; margin: 2px auto 9px; }
        .phone-screen { background: ${T.bg}; border-radius: 17px; min-height: 178px; padding: 13px 11px; display: flex; flex-direction: column; gap: 8px; transition: opacity 0.35s; }
        .phone-label { text-align: center; color: ${T.ink2}; font-family: 'Manrope'; font-weight: 600; font-size: 11px; margin-top: 9px; }
        .rn-view { background: ${T.paper}; border-radius: 11px; padding: 12px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.18); transition: all 0.3s; }
        .rn-view.on { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 5px 14px -6px rgba(255,79,40,0.22); }
        .rn-text { font-family: 'Manrope'; font-weight: 500; font-size: 13px; color: ${T.ink}; animation: el-pop 0.32s ease; }
        .rn-text.title { font-weight: 800; font-size: 16px; }
        .rn-text.price { color: ${T.accent}; font-weight: 700; font-family: 'JetBrains Mono'; font-size: 12.5px; }
        .rn-text.btn { background: ${T.accent}; color: #fff; text-align: center; padding: 9px; border-radius: 9px; font-weight: 700; }

        /* ===== QR ===== */
        .qr { width: clamp(96px,26vw,118px); aspect-ratio: 1; border-radius: 12px; background: #fff; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.25); display: grid; grid-template-columns: repeat(5,1fr); grid-template-rows: repeat(5,1fr); gap: 3px; padding: 11px; }
        .qr i { background: ${T.ink}; border-radius: 2px; } .qr i.off { background: transparent; }
        @keyframes qr-pulse { 0%,100% { box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.25); } 50% { box-shadow: 0 6px 20px -2px rgba(255,79,40,0.4); } }
        .qr.qr-scan { animation: qr-pulse 1.3s infinite; }

        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 78px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
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
