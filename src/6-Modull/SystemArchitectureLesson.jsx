import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · DARS 1 (T1) — KOMPONENTLARDAN TIZIM — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi real mahsulot — bu KOMPONENTLAR TIZIMI ekanini tushunadi: Frontend + Backend + Database + AI + Bot,
//         va ular orasida ma'lumot qanday OQISHINI ko'radi. O'z mahsuloti (mini-do'kon) arxitekturasini chizadi.
// Davomiy mahsulot: mini-do'kon (Modul 2 vanilla-JS do'koniga halqa). Signature animatsiya: DataFlowTracer (ma'lumot sayohati).
// Ko'priklar: PeanStack (M2) — persistence; Bot (M8) — qo'shimcha eshik; React Native (T6-T7) — yana bir frontend.
// Falsafa: SIZ — DIREKTOR. Avval tizimni KO'RASIZ va CHIZASIZ, keyin AI bilan qurasiz.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI.
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

const LESSON_META = { lessonId: 'sys-architecture-01-v16', lessonTitle: { uz: 'Komponentlardan tizim', ru: 'Система из компонентов' } };
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

// ============================================================ TIZIM KOMPONENTLARI

// ===== KICHIK DO'KON VITRINA MOK =====
const ShopMock = ({ title = 'mini-do\'kon', children, minH }) => (
  <div className="shopwin">
    <div className="shopwin-bar"><span className="sw-dots"><i /><i /><i /></span><span className="sw-url">mini-dokon.uz</span></div>
    <div className="shopwin-body" style={{ minHeight: minH }}>{children}</div>
  </div>
);

// ===== TIZIM KOMPONENTLARI (s2) =====
const COMPONENTS = [
  { id: 'front', ico: '🖥️', label: 'Frontend', tech: 'React', color: T.blue, role: "Mijoz ko'radigan qism — VITRINA. Mahsulotlar, savat, tugmalar. Ma'lumotni ko'rsatadi, lekin o'zi saqlamaydi." },
  { id: 'back', ico: '⚙️', label: 'Backend', tech: 'Node / Nest', color: T.accent, role: "Markaz / MIYA. So'rovlarni qabul qiladi, mantiqni bajaradi, baza bilan gaplashadi. Vitrina ortidagi menejer." },
  { id: 'db', ico: '🗄️', label: 'Database', tech: 'PostgreSQL', color: T.success, role: "OMBOR. Mahsulot, buyurtma, foydalanuvchilar doimiy saqlanadi. Server o'chsa ham qoladi." },
  { id: 'ai', ico: '🧠', label: 'AI', tech: 'Claude', color: T.violet, role: "Aqlli MASLAHATCHI. Tavsiya beradi, savolga javob yozadi. Backend uni chaqiradi (Modul 8)." },
  { id: 'bot', ico: '🤖', label: 'Bot', tech: 'Telegram', color: T.amber, role: "Boshqa ESHIK. Telegram orqali buyurtma. O'sha backend va bazaga ulanadi (Modul 8)." }
];

// ===== MA'LUMOT OQIMI (s3 tracer + s15 final) =====
const FLOW = [
  { id: 'user', ico: '🙋', label: 'Foydalanuvchi', d: "tugmani bosadi.", say: "Mijoz «Savatga» tugmasini bosdi." },
  { id: 'front', ico: '🖥️', label: 'Frontend', d: "so'rovni backendga yuboradi.", say: "Frontend (React) so'rovni Backendga jo'natdi." },
  { id: 'back', ico: '⚙️', label: 'Backend', d: "qabul qiladi, qaror qiladi.", say: "Backend so'rovni qabul qildi va qaror qildi." },
  { id: 'db', ico: '🗄️', label: 'Database', d: "saqlaydi yoki o'qiydi.", say: "Database savatga mahsulotni yozdi (PostgreSQL)." },
  { id: 'render', ico: '✨', label: 'Ekranda natija', d: "javob qaytib ko'rinadi.", say: "Javob Frontendga qaytdi — savat yangilandi ✅" }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['back', 'user', 'render', 'front', 'db'];

// ===== ESHIKLAR (s10) =====
const CLIENTS = [
  { id: 'web', ico: '🖥️', label: 'Web sayt', note: "React frontend — brauzerda ochiladi." },
  { id: 'bot', ico: '🤖', label: 'Telegram bot', note: "Modul 8'dagi bot — chat orqali buyurtma." },
  { id: 'mobile', ico: '📱', label: 'Mobil ilova', note: "React Native — telefonda. Buni T6-T7'da quramiz!" }
];

// ===== KOMPONENTNI O'CHIRISH (s9) =====
const BREAKS = [
  { id: 'db', ico: '🗄️', label: 'Database', effect: "Ma'lumot hech qayerda saqlanmaydi — sahifa yangilansa savat va buyurtmalar yo'qoladi (PEAN darsidagi hookni eslang)." },
  { id: 'back', ico: '⚙️', label: 'Backend', effect: "Frontend ma'lumot ololmaydi — vitrina bo'sh qoladi, hech narsa ishlamaydi. Miya yo'q." },
  { id: 'front', ico: '🖥️', label: 'Frontend', effect: "Mijoz hech narsa ko'rmaydi — vitrina yo'q. Backend ishlaydi-yu, kirish nuqtasi yo'q." }
];

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Bitta narsa — shunchaki «sayt»" },
    { id: 'b', label: "Bir nechta qism bir jamoa bo'lib ishlaydi — tizim" },
    { id: 'c', label: "Faqat dizayn va rasmlar" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Modul · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Bitta oddiy <span className="italic" style={{ color: T.accent }}>online do'kon</span> ortida nechta «qism» ishlayapti?</h1>
        <Mentor>Foydalanuvchi faqat chiroyli sahifani ko'radi. Lekin ortida bir nechta qism bir jamoa bo'lib ishlaydi. Tugmani bosing — pardani ko'taramiz.</Mentor>
        <Zoomable><Split>
          <Col>
            <ShopMock minH={150}>
              <div className="sw-row"><b>📱 Telefon</b><span className="sw-price">2 500 000</span></div>
              <div className="sw-row"><b>🎧 Quloqchin</b><span className="sw-price">300 000</span></div>
              <button className="sw-btn">🛒 Savatga</button>
              {tried && <div className="sw-reveal fade-step">⬇️ ortida: 5 ta komponent</div>}
            </ShopMock>
            {tried && <div className="fade-step" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMPONENTS.map((c, i) => <span key={c.id} className="comp-pill r-in" style={{ animationDelay: `${i * 0.08}s`, color: c.color }}>{c.ico} {c.label}</span>)}
            </div>}
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Parda ko\'tarildi' : "▶ Ortida nima bor?"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sayt aslida nima?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Har bir mahsulot — bu <b>komponentlar tizimi</b>: Frontend, Backend, Database, AI va Bot. Bugun ularni va orasidagi bog'lanishni ko'ramiz va chizamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Tizimning 5 komponenti — har biri nima qiladi", tag: 'qismlar' },
    { text: "Ma'lumot qanday oqadi (Front→Back→DB)", tag: 'oqim' },
    { text: "Ko'p eshik, bitta tizim (web, bot, mobil)", tag: 'eshik' },
    { text: "O'z mahsulotingiz arxitekturasini chizish", tag: 'chizma' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — siz shu chizmani yig'asiz</p>
      <div className="flow-row mini">
        {FLOW.map((f, i) => (<React.Fragment key={f.id}>{i > 0 && <span className="fl-track" />}<div className="fl-node done"><span className="fl-node-ico">{f.ico}</span><span className="fl-node-lbl">{f.label}</span></div></React.Fragment>))}
      </div>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Bu — har qanday real mahsulotning skeleti. Modul 1-8'da qurgan qismlaringiz shu chizmada birlashadi.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Bo'laklarni <span className="italic" style={{ color: T.accent }}>yaxlit tizim</span> sifatida ko'ramiz.</h2></div>
        <Mentor>Modul bo'ylab har bir qismni alohida o'rgandingiz: React, Node, PostgreSQL, AI, bot. Bugun ularni <b style={{ color: T.ink }}>birga ulab</b>, bitta tizim sifatida ko'rasiz va chizasiz. Bu — arxitektura fikrlash.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Chizmani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — 5 KOMPONENT =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(COMPONENTS.map(c => c.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= COMPONENTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = COMPONENTS.find(c => c.id === active);
  return (
    <Stage eyebrow="Tushuncha · komponentlar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 komponentni oching (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Do'kon — bu <span className="italic" style={{ color: T.accent }}>do'kondagi 5 bo'lim</span> kabi.</h2></div>
        <Mentor>Haqiqiy do'konni tasavvur qiling: vitrina, menejer, ombor, maslahatchi va telefon-operator. Mahsulot ham xuddi shunday — har komponent o'z ishini qiladi. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {COMPONENTS.map(c => <button key={c.id} className="gchip" onClick={() => tap(c.id)} style={seen.has(c.id) ? { boxShadow: `inset 0 0 0 1.5px ${c.color}`, color: c.color } : undefined}>{seen.has(c.id) ? '✓ ' : ''}{c.ico} {c.label}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 bo'lim, bitta do'kon. Hech biri yolg'iz ishlamaydi — ular <b>birga</b> mahsulotni tashkil qiladi. Endi ular qanday gaplashishini ko'ramiz.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active} style={{ borderLeft: `4px solid ${cur.color}` }}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label} <span className="mono" style={{ color: cur.color, fontSize: 11, marginLeft: 6 }}>{cur.tech}</span></p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.role}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Komponentni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — DATA FLOW TRACER (signature animatsiya) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? FLOW.length - 1 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { setStep(n => Math.min(n + 1, FLOW.length - 1)); setSc(n => n + 1); }; // clamp — tez bosishda chegaradan oshib ketmasin
  return (
    <Stage eyebrow="Animatsiya · ma'lumot sayohati" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Sayohatni kuzating (${step + 1}/${FLOW.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tugma bosilganda ma'lumot <span className="italic" style={{ color: T.accent }}>shu yo'l</span> bilan sayohat qiladi.</h2></div>
        <Mentor>Mijoz «Savatga» tugmasini bosdi — keyin nima bo'ladi? Tugmani bosib, ma'lumot paketining bekatdan-bekatga sayohatini kuzating. Har bekat o'z ishini qiladi.</Mentor>
        <div className="fade-up"><div className="flow-row">
          {FLOW.map((f, i) => (
            <React.Fragment key={f.id}>
              {i > 0 && <span className="fl-track">{step === i && <span key={step} className="fl-packet" />}</span>}
              <div className={`fl-node ${step > i ? 'done' : ''} ${step === i ? 'on' : ''}`}><span className="fl-node-ico">{f.ico}</span><span className="fl-node-lbl">{f.label}</span></div>
            </React.Fragment>
          ))}
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Sayohat tugadi' : step === 0 ? '▶ So\'rovni yuborish' : 'Keyingi bekat →'}</button>
            {FLOW[step] && <div className="sk-info fade-step" key={step}><p className="note-h">{FLOW[step].ico} {FLOW[step].label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{FLOW[step].say}</p></div>}
          </Col>
          <Col>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'liq sayohat: <b>Foydalanuvchi → Frontend → Backend → Database → ekran</b>. Har komponent zanjirning bitta halqasi. Bittasi ishlamasa — zanjir uziladi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — paket harakatlanadi →</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Mahsulotlar, buyurtmalar va foydalanuvchilar qayerda doimiy saqlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mahsulot, buyurtma va foydalanuvchilar qayerda <span className="italic" style={{ color: T.accent }}>doimiy saqlanadi</span>?</h2></>}
    options={["Database — PostgreSQL bazasida (server o'chsa ham qoladi)", "Frontend — chunki mijoz uni ko'radi", "Backend — chunki u markaz", "AI — chunki u aqlli"]} correctIdx={0}
    explainCorrect="To'g'ri! Doimiy ma'lumot Database (PostgreSQL)da saqlanadi. Frontend faqat ko'rsatadi, Backend qaror qiladi va bazaga yozadi, lekin saqlash — bazaning ishi."
    explainWrong={{
      1: "Frontend faqat ko'rsatadi — yangilansa hammasi yo'qoladi. Saqlash bazaning ishi.",
      2: "Backend qaror qiladi va bazaga yozishni boshqaradi, lekin o'zi doimiy saqlamaydi — Database saqlaydi.",
      3: "AI maslahat beradi, ma'lumot ombori emas. Doimiy saqlash — Database.",
      default: "Doimiy ma'lumot Database (PostgreSQL)da."
    }} />
);

// ===== SCREEN 5 — FRONTEND vs BACKEND =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { id: 'front', ico: '🖥️', label: 'Frontend', color: T.blue, does: "Ko'rsatadi: sahifa, tugma, savat. Mijoz bilan to'g'ridan-to'g'ri gaplashadi.", not: "Ma'lumotni saqlamaydi, muhim qarorlarni qilmaydi." },
    { id: 'back', ico: '⚙️', label: 'Backend', color: T.accent, does: "Qaror qiladi: narxni hisoblaydi, buyurtmani tekshiradi, bazaga yozadi.", not: "Mijozga ko'rinmaydi — sahna ortida ishlaydi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Chok · front ↔ back" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ikkalasini oching (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Eng muhim chegara: <span className="italic" style={{ color: T.accent }}>vitrina</span> va <span className="italic" style={{ color: T.accent }}>menejer</span>.</h2></div>
        <Mentor>Boshlovchilar ko'p adashadi: Frontend <b style={{ color: T.ink }}>ko'rsatadi</b>, Backend <b style={{ color: T.ink }}>qaror qiladi</b>. Vitrina mahsulotni chiroyli qiladi; menejer hisoblaydi va omborga yozadi. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PARTS.map(p => <button key={p.id} className={`pick-row ${active === p.id ? 'sel' : ''} ${seen.has(p.id) ? 'done-row' : ''}`} onClick={() => tap(p.id)}><span style={{ fontSize: 18, marginRight: 4 }}>{p.ico}</span><span style={{ flex: 1 }}>{p.label}</span><span className="pick-plus">{seen.has(p.id) ? '✓' : '▶'}</span></button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: ko'rinadigan narsa — Frontend; qaror va saqlash — Backend. Ular API orqali gaplashadi (buni keyingi darsda chuqurroq ko'ramiz).</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="fade-step" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info" style={{ borderLeft: `4px solid ${cur.color}` }}><p className="note-h">{cur.ico} {cur.label} — qiladi</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.does}</p></div>
                  <div className="frame-warn"><p className="body" style={{ margin: 0, color: T.ink }}>🚫 <b>Qilmaydi:</b> {cur.not}</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bo'limni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — DATABASE PERSISTENCE =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [refreshed, setRefreshed] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = refreshed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Komponent · Database" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Sahifani yangilang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Database — <span className="italic" style={{ color: T.accent }}>ombor</span>. U bo'lmasa, xotira yo'q.</h2></div>
        <Mentor>PEAN darsidagi misolni eslang: izoh yozib, sahifani yangilasangiz — yo'qoladi. Sababi bazaga yozilmagan. Tugmani bosib, baza bor va yo'q holatni solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className={`mem-box ${refreshed ? 'gone' : ''}`}>
              <p className="note-h" style={{ color: refreshed ? T.danger : T.ink2 }}>❌ Bazasiz (faqat Frontend)</p>
              {refreshed
                ? <p className="body" style={{ margin: 0, color: T.danger }}>💨 Savat bo'sh — yangilashda hammasi yo'qoldi!</p>
                : <p className="body" style={{ margin: 0, color: T.ink }}>🛒 Savat: Telefon, Quloqchin</p>}
            </div>
            <div className="mem-box keep">
              <p className="note-h" style={{ color: T.success }}>✅ Baza bilan (PostgreSQL)</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>🛒 Savat: Telefon, Quloqchin — yangilashdan keyin ham joyida</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={refreshed} onClick={() => { setRefreshed(true); setSc(n => n + 1); }}>{refreshed ? '✓ Yangilandi' : "🔄 Sahifani yangilash"}</button>
          </Col>
          <Col>
            {refreshed
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Bazaga yozilgan ma'lumot qoladi, faqat ekrandagi (frontend) — yo'qoladi. Shuning uchun muhim narsa <b>doim bazaga</b> yoziladi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Database = ombor/daftar. Frontend = vaqtinchalik ko'rinish. Backend ikkisi orasida ma'lumotni tashiydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — AI + BOT (qo'shimcha komponentlar) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const EXTRA = [
    { id: 'ai', ico: '🧠', label: 'AI (Claude)', color: T.violet, desc: "Aqlli maslahatchi: «Telefonga g'ilof ham olasizmi?», qidiruvga javob. Backend AI'ni chaqiradi (Modul 8)." },
    { id: 'bot', ico: '🤖', label: 'Bot (Telegram)', color: T.amber, desc: "Qo'shimcha eshik: mijoz Telegram'da ham buyurtma beradi. Bot o'sha backend va bazaga ulanadi (Modul 8)." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(EXTRA.map(e => e.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= EXTRA.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = EXTRA.find(e => e.id === active);
  return (
    <Stage eyebrow="Komponent · AI + Bot" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ikkalasini oching (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI va Bot — <span className="italic" style={{ color: T.accent }}>tizimga ulanadigan</span> qo'shimcha qismlar.</h2></div>
        <Mentor>Asosiy uchlik (Front+Back+DB) ustiga AI va Bot qo'shiladi. Muhimi: ikkalasi ham <b style={{ color: T.ink }}>o'sha backendga</b> ulanadi — alohida tizim emas. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {EXTRA.map(e => <button key={e.id} className={`pick-row ${active === e.id ? 'sel' : ''} ${seen.has(e.id) ? 'done-row' : ''}`} onClick={() => tap(e.id)}><span style={{ fontSize: 18, marginRight: 4 }}>{e.ico}</span><span style={{ flex: 1 }}>{e.label}</span><span className="pick-plus">{seen.has(e.id) ? '✓' : '▶'}</span></button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI va Bot — «qo'shimcha». Ularsiz ham do'kon ishlaydi; ular tajribani boyitadi. Ikkalasi ham markaziy backendga ulanadi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active} style={{ borderLeft: `4px solid ${cur.color}` }}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Komponentni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Mijoz web-saytda «Savatga» bosdi. So'rov qaysi yo'l bilan boradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mijoz «Savatga» bosdi. So'rov qaysi <span className="italic" style={{ color: T.accent }}>yo'l</span> bilan boradi?</h2></>}
    options={["Frontend → Backend → Database, keyin javob orqaga qaytadi", "To'g'ridan-to'g'ri Database'ga, Backend'siz", "Faqat Frontend ichida qoladi, hech qayerga bormaydi", "Database → Backend → Frontend"]} correctIdx={0}
    explainCorrect="To'g'ri! So'rov mijozdan Frontend orqali Backend'ga, undan Database'ga boradi; natija esa teskari yo'l bilan ekranga qaytadi. Frontend bazaga to'g'ridan ulanmaydi — har doim Backend orqali."
    explainWrong={{
      1: "Frontend xavfsizlik uchun bazaga to'g'ridan ulanmaydi — har doim Backend orqali o'tadi.",
      2: "Agar Frontend ichida qolsa, hech narsa saqlanmaydi. So'rov Backend va Database'ga borishi kerak.",
      3: "Yo'nalish teskari: avval Frontend so'rov yuboradi, keyin Backend va Database. Javob esa orqaga qaytadi.",
      default: "Frontend → Backend → Database, javob orqaga qaytadi."
    }} />
);

// ===== SCREEN 9 — KOMPONENTNI O'CHIRISH (ArchBreaker) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(BREAKS.map(b => b.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= BREAKS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = BREAKS.find(b => b.id === active);
  return (
    <Stage eyebrow="Tajriba · qismni o'chir" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 qismni sinab ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta qismni <span className="italic" style={{ color: T.accent }}>o'chirsangiz</span> — nima buziladi?</h2></div>
        <Mentor>Har komponent nega kerakligini bilishning eng yaxshi yo'li — uni olib tashlab ko'rish. Har bir qismni bosing va tizim qanday «sinishini» ko'ring.</Mentor>
        <div className="fade-up"><div className="flow-row mini">
          {COMPONENTS.slice(0, 3).map((c, i) => (<React.Fragment key={c.id}>{i > 0 && <span className="fl-track" />}<div className={`fl-node ${active === c.id ? 'broken' : 'done'}`}><span className="fl-node-ico">{active === c.id ? '❌' : c.ico}</span><span className="fl-node-lbl">{c.label}</span></div></React.Fragment>))}
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {BREAKS.map(b => <button key={b.id} className="gchip" onClick={() => tap(b.id)} style={seen.has(b.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.danger}`, color: T.danger } : undefined}>{seen.has(b.id) ? '✗ ' : ''}{b.ico} {b.label} o'chir</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bir asosiy qism kerak: Frontend ko'rsatadi, Backend boshqaradi, Database eslaydi. Bittasi yo'qolsa — tizim ishlamaydi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="frame-warn fade-step" key={active}><p className="note-h" style={{ margin: '0 0 4px', color: T.danger }}>{cur.ico} {cur.label} o'chirildi</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.effect}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — KO'P ESHIK, BITTA TIZIM =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CLIENTS.map(c => c.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= CLIENTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = CLIENTS.find(c => c.id === active);
  return (
    <Stage eyebrow="Tizim · ko'p eshik" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 eshikni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta backend + baza, lekin <span className="italic" style={{ color: T.accent }}>ko'p eshik</span>.</h2></div>
        <Mentor>Bu juda muhim g'oya: mijoz do'konga turli eshiklardan kirishi mumkin — web, bot yoki mobil ilova. Lekin hammasi <b style={{ color: T.ink }}>bitta backend va bazaga</b> ulanadi. Har eshikni bosing.</Mentor>
        <div className="fade-up"><div className="clients-map">
          <div className="cm-clients">
            {CLIENTS.map(c => <div key={c.id} className={`cm-client ${seen.has(c.id) ? 'on' : ''} ${active === c.id ? 'sel' : ''}`}><span>{c.ico}</span><span className="cm-lbl">{c.label}</span></div>)}
          </div>
          <span className="cm-arrow">→</span>
          <div className="cm-core"><div className="cm-core-node">⚙️<span>Backend</span></div><div className="cm-core-node">🗄️<span>Database</span></div></div>
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CLIENTS.map(c => <button key={c.id} className="gchip" onClick={() => tap(c.id)} style={seen.has(c.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(c.id) ? '✓ ' : ''}{c.ico} {c.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h">{cur.ico} {cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.note}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Eshikni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Backend va bazani bir marta qurasiz; keyin har xil frontend (web, bot, mobil) ulayversiz. Mobil ilovani T6-T7'da qo'shamiz!</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Web-sayt va Telegram bot bir xil buyurtmalarni ko'rishi uchun nima qilinadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Web-sayt va bot <span className="italic" style={{ color: T.accent }}>bir xil</span> buyurtmalarni ko'rishi uchun nima qilinadi?</h2></>}
    options={["Ikkalasi bitta backend va bazaga ulanadi — bitta tizim, ko'p eshik", "Har biriga alohida baza quriladi", "Ma'lumot qo'lda nusxalanadi", "Buni qilib bo'lmaydi — ular alohida"]} correctIdx={0}
    explainCorrect="To'g'ri! Web va bot — ikki xil frontend (eshik), lekin ikkalasi bitta backend va bazaga ulanadi. Shuning uchun bir joyda berilgan buyurtma boshqasida ham ko'rinadi. Mobil ilova ham xuddi shunday ulanadi."
    explainWrong={{
      1: "Alohida baza bo'lsa, ma'lumot bo'linib ketadi. To'g'risi — bitta umumiy backend+baza.",
      2: "Qo'lda nusxalash xato va imkonsiz. Bitta umumiy bazaga ulansa, avtomatik bir xil bo'ladi.",
      3: "Aksincha — bu juda oson: bitta backend+bazaga ikkala eshikni ulaysiz.",
      default: "Bitta backend+bazaga ulanadi — bitta tizim, ko'p eshik."
    }} />
);

// ===== SCREEN 12 — CASE: to'liq buyurtma =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { ico: '🖥️', txt: "Web mijoz «Telefon»ni savatga qo'shdi → Frontend so'rovni Backendga yubordi." },
    { ico: '⚙️', txt: "Backend so'rovni qabul qildi va Databasega buyurtmani yozdi 🗄️✅" },
    { ico: '🤖', txt: "Boshqa mijoz Telegram BOT orqali «Telefon buyuraman» dedi." },
    { ico: '⚙️', txt: "Bot ham O'SHA Backendga ulandi → O'SHA Databasega yozildi 🗄️✅" },
    { ico: '🧠', txt: "AI ikkala mijozga ham «G'ilof ham olasizmi?» deb tavsiya berdi." },
    { ico: '✅', txt: "Bitta tizim, ikki eshik — barchasi bitta backend+bazada birlashdi." }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setShown(n => n + 1); setSc(n => n + 1); } };
  return (
    <Stage eyebrow="Hayotiy · to'liq tizim" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tizimni kuzating (${shown}/${STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta buyurtma — <span className="italic" style={{ color: T.accent }}>butun tizim</span> birga ishlaydi.</h2></div>
        <Mentor>Mana hammasi birga: web va bot orqali kelgan buyurtmalar bitta bazada uchrashadi, AI tavsiya beradi. Tugmani bosib, tizimning ishlashini bosqichma-bosqich kuzating.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.slice(0, shown).map((s, i) => (
                <div key={i} className={`agent-step fade-step ${s.ico === '✅' ? 'done' : ''}`}>
                  <span className="as-phase">{s.ico} qadam {i + 1}</span>
                  <span className="as-txt">{s.txt}</span>
                </div>
              ))}
              {shown === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — tizim ishga tushadi.</p></div>}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Tizim ishladi' : shown === 0 ? '▶ Buyurtmani boshlash' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">🗺️ Tizim xaritasi</p><div className="clients-map" style={{ marginTop: 8 }}>
              <div className="cm-clients"><div className="cm-client on"><span>🖥️</span><span className="cm-lbl">Web</span></div><div className="cm-client on"><span>🤖</span><span className="cm-lbl">Bot</span></div></div>
              <span className="cm-arrow">→</span>
              <div className="cm-core"><div className="cm-core-node">⚙️<span>Backend</span></div><div className="cm-core-node">🗄️<span>DB</span></div></div>
            </div></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikki mijoz, ikki eshik, bitta baza. Mana shuni siz yakuniy loyihada (capstone) to'liq quramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — ARXITEKTURANI CHIZISH =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amalda · chizma" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Nega chizamiz?"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kod yozishdan oldin — arxitekturani <span className="italic" style={{ color: T.accent }}>chizing</span>.</h2></div>
        <Mentor>Professional dasturchi avval qog'ozda yoki AI bilan tizim chizmasini chizadi: qaysi komponentlar, qanday ulanadi. Bu — direktor ishi. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="arxitektura.txt" minH={120}>
              <Cm>{'// mini-do\'kon tizimi'}</Cm>{'\n'}
              {'Foydalanuvchi'}{'\n'}
              {'   ↓'}{'\n'}
              <At>Frontend</At>{' (React)'}{'\n'}
              {'   ↓ ↑  API'}{'\n'}
              <Kw>Backend</Kw>{' (Nest) ── '}<St>AI</St>{'\n'}
              {'   ↓ ↑'}{'\n'}
              <At>Database</At>{' (PostgreSQL)'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Tushundim' : "Nega chizma muhim?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🗺️ <b>Aniqlik:</b> qaysi qism nima qilishini oldindan bilasiz</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🤝 <b>Muloqot:</b> jamoaga/AI'ga tizimni tushuntira olasiz</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🐞 <b>Xato:</b> muammo qaysi komponentda — tezroq topasiz</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="agent-card fade-step"><span className="agent-lbl">📍 KEYINGI DARS</span><p className="agent-msg">Bu chizmaning «nomi» bor — <b>arxitektura patterni</b> (MVC, mikroservis). Keyingi darsda o'shani o'rganamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (mobil ko'prik, global) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Mavjud web-do'koningizga mobil ilova qo'shmoqchisiz. Eng kam ish bilan qanday qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Web-do'koningizga <span className="italic" style={{ color: T.accent }}>mobil ilova</span> qo'shmoqchisiz. Eng kam ish bilan qanday?</h2></>}
    options={["Faqat yangi frontend (mobil) yozaman; mavjud backend va bazaga ulayman", "Hammasini noldan: yangi frontend, backend va baza", "Mobil uchun alohida baza quraman", "Buni qilib bo'lmaydi — mobil butunlay boshqa"]} correctIdx={0}
    explainCorrect="To'g'ri! Backend va baza tayyor — ular har qanday eshik bilan ishlaydi. Mobil ilova faqat yana bir frontend (React Native), o'sha backendga ulanadi. Shuning uchun arxitekturani tushunish ish hajmini keskin kamaytiradi."
    explainWrong={{
      1: "Backend va bazani qayta yozish keraksiz — ular tayyor. Faqat yangi frontend qo'shasiz.",
      2: "Alohida baza ma'lumotni bo'lib yuboradi. Mobil o'sha umumiy bazaga ulanishi kerak.",
      3: "Aksincha — mobil ham shunchaki yana bir frontend. T6-T7'da aynan shuni qilamiz.",
      default: "Faqat yangi frontend yozib, mavjud backend+bazaga ulaysiz."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: oqimni yig'ish =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Ma'lumot oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: ma'lumot oqimini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Mijoz tugma bosganda ma'lumot qayerdan-qayerga boradi? Tartibni eslang: foydalanuvchi → frontend → backend → database → ekranda natija. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">ma'lumot oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Foydalanuvchi → Frontend → Backend → Database → ekran</b>. Mana real mahsulotning ma'lumot yo'li.</p></div>}
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
    "Real mahsulot — bu komponentlar tizimi, bitta narsa emas",
    "5 komponent: Frontend, Backend, Database, AI, Bot",
    "Ma'lumot oqimi: Foydalanuvchi → Frontend → Backend → Database → ekran",
    "Bitta backend+baza, ko'p eshik (web, bot, mobil)",
    "Kod yozishdan oldin arxitekturani chizish — direktor ishi"
  ];
  const HOMEWORK = [
    { b: "Chizing", t: "— o'z loyihangiz arxitekturasini chizing: qaysi 5 komponent bor?" },
    { b: 'Oqim', t: "— bitta amal (masalan «buyurtma berish») uchun ma'lumot yo'lini chizib chiqing" },
    { b: "Eshik", t: "— loyihangizga qaysi eshiklar kerak: web? bot? mobil?" }
  ];
  const GLOSSARY = [
    { b: 'tizim', t: '— birga ishlaydigan komponentlar' },
    { b: 'komponent', t: '— tizimning bir qismi' },
    { b: 'Frontend', t: '— ko\'rinadigan qism (React)' },
    { b: 'Backend', t: '— mantiq/markaz (Node/Nest)' },
    { b: 'Database', t: '— ombor (PostgreSQL)' },
    { b: 'API', t: '— qismlar gaplashadigan «til»' },
    { b: 'arxitektura', t: '— tizim chizmasi/tuzilishi' },
    { b: 'eshik (client)', t: '— kirish nuqtasi: web/bot/mobil' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Tizimni ko'ra boshladingiz</span><h2 className="title h-title fade-up d1">Endi mahsulotni <span className="italic" style={{ color: T.accent }}>yaxlit tizim</span> sifatida ko'rasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Komponentlar, ma'lumot oqimi va «ko'p eshik, bitta tizim» tushunchalarini o'rgandingiz." : "Yaxshi harakat! Ma'lumot oqimi (Front→Back→DB) va ko'p eshik bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — Arxitektura patternlari: MVC va mikroservis, chizmangizning «nomi».</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function SystemArchitectureLesson({ lang: langProp, onFinished }) {
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

        /* VS CODE EDITOR */
        .editor { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .editor-bar { background: #2D2D2D; padding: 7px 11px; display: flex; align-items: center; gap: 9px; }
        .editor-tab { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; background: #1E1E1E; padding: 4px 11px; border-radius: 6px 6px 0 0; word-break: break-all; }
        .editor-body { background: ${CODE.bg}; padding: 12px 14px; }
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.75; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }

        /* PICK ROWS */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 11px 13px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.sel { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.28); background: ${T.accentSoft}; }
        .pick-row.done-row { box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; } .pick-row.sel .pick-plus { color: ${T.accent}; } .pick-row.done-row .pick-plus { color: ${T.success}; }

        /* AGENT / AI CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }

        /* AGENT STEP (case) */
        .agent-step { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 10px; padding: 10px 13px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); border-left: 3px solid ${T.blue}; }
        .agent-step.done { border-left-color: ${T.success}; background: ${T.successSoft}; }
        .as-phase { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.blue}; letter-spacing: 0.04em; }
        .agent-step.done .as-phase { color: ${T.success}; }
        .as-txt { font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }

        /* SHOP MOCK */
        .shopwin { border-radius: 14px; overflow: hidden; box-shadow: 0 12px 30px -8px rgba(${T.shadowBase},0.3); border: 1px solid rgba(167,166,162,0.22); }
        .shopwin-bar { background: #E8E4DC; padding: 8px 12px; display: flex; align-items: center; gap: 9px; }
        .sw-dots { display: flex; gap: 5px; } .sw-dots i { width: 9px; height: 9px; border-radius: 50%; } .sw-dots i:first-child { background: #ff5f57; } .sw-dots i:nth-child(2) { background: #febc2e; } .sw-dots i:nth-child(3) { background: #28c840; }
        .sw-url { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: #fff; padding: 3px 10px; border-radius: 6px; }
        .shopwin-body { background: #fff; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .sw-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: ${T.bg}; border-radius: 9px; font-size: 14px; color: ${T.ink}; }
        .sw-price { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; }
        .sw-btn { align-self: flex-start; background: ${T.accent}; color: #fff; border: none; border-radius: 9px; padding: 8px 16px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; cursor: default; }
        .sw-reveal { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.accent}; text-align: center; }
        .comp-pill { font-family: 'Manrope'; font-weight: 700; font-size: 12px; padding: 5px 11px; border-radius: 99px; background: ${T.paper}; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        @keyframes rev-in { from { opacity: 0; transform: translateY(-6px) scale(0.96); } to { opacity: 1; transform: none; } }
        .r-in { animation: rev-in 0.4s ease-out both; }

        /* ===== FLOW ROW (data-flow tracer) ===== */
        .flow-row { display: flex; align-items: center; flex-wrap: wrap; gap: 3px; justify-content: center; padding: 8px 0; }
        .flow-row.mini { gap: 2px; }
        .fl-node { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 12px; padding: 10px 11px; min-width: 74px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.3s; opacity: 0.5; }
        .flow-row.mini .fl-node { min-width: 62px; padding: 8px 8px; opacity: 1; }
        .fl-node.done { opacity: 1; background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .fl-node.on { opacity: 1; background: ${T.accentSoft}; box-shadow: inset 0 0 0 2px ${T.accent}, 0 6px 18px -4px rgba(255,79,40,0.45); transform: translateY(-3px); animation: fl-pulse 1.1s infinite ease-in-out; }
        .fl-node.broken { opacity: 1; background: ${T.dangerSoft}; box-shadow: inset 0 0 0 2px ${T.danger}; }
        @keyframes fl-pulse { 0%,100% { box-shadow: inset 0 0 0 2px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.4); } 50% { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 24px -2px rgba(255,79,40,0.65); } }
        .fl-node-ico { font-size: 19px; line-height: 1; }
        .fl-node-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 9.5px; color: ${T.ink}; text-align: center; }
        .fl-track { position: relative; width: 26px; height: 3px; background: rgba(167,166,162,0.4); border-radius: 2px; flex-shrink: 0; }
        .fl-packet { position: absolute; top: -5px; left: 0; width: 13px; height: 13px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 10px 2px rgba(255,79,40,0.6); animation: fl-move 0.65s ease forwards; }
        @keyframes fl-move { from { left: -7px; opacity: 0; } 25% { opacity: 1; } to { left: calc(100% - 6px); opacity: 1; } }

        /* ===== CLIENTS MAP (ko'p eshik) ===== */
        .clients-map { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 6px 0; }
        .cm-clients { display: flex; flex-direction: column; gap: 7px; }
        .cm-client { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 10px; padding: 8px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); opacity: 0.5; transition: all 0.25s; min-width: 120px; }
        .cm-client.on { opacity: 1; box-shadow: inset 0 0 0 1.5px ${T.success}, 0 5px 14px -6px rgba(31,122,77,0.26); }
        .cm-client.sel { opacity: 1; box-shadow: inset 0 0 0 2px ${T.accent}; }
        .cm-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; }
        .cm-arrow { color: ${T.ink3}; font-weight: 700; font-size: 18px; }
        .cm-core { display: flex; flex-direction: column; gap: 7px; }
        .cm-core-node { display: flex; align-items: center; gap: 8px; background: ${T.ink}; color: #fff; border-radius: 10px; padding: 8px 14px; font-size: 17px; }
        .cm-core-node span { font-family: 'Manrope'; font-weight: 700; font-size: 12px; }

        /* ===== MEM BOX ===== */
        .mem-box { background: ${T.paper}; border-radius: 12px; padding: 14px 16px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); border-left: 4px solid ${T.ink3}; transition: all 0.35s; }
        .mem-box.keep { border-left-color: ${T.success}; }
        .mem-box.gone { border-left-color: ${T.danger}; background: ${T.dangerSoft}; }

        /* ===== CYC (final) ===== */
        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 74px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
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
