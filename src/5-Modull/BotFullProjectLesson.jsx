import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 6 (P3) — MINI-LOYIHA: BOT + DB + AI + HOSTING — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi 4 bo'lakni (tugma T2, AI miya P2, xotira/DB T3, + hosting) bitta ISHLAYDIGAN mahsulotga yig'adi
//         va botni serverga chiqarib, 24/7 jonli qiladi. Yangi texnik mavzu: HOSTING (lokal vs server, polling vs webhook).
// Loyiha kuni: sintez + deploy. Davomiy case: AvtoPizza — to'liq mahsulot.
// Falsafa: SIZ — DIREKTOR, AI — ISHCHI. Siz arxitekturani tushunasiz va buyurasiz; AI kod + platformani tanlaydi.
// Hosting: PLATFORMA-NEYTRAL (tushuncha), Railway/Render faqat MISOL sifatida. Metafora: botga "doimiy uy" kerak.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309',
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

const LESSON_META = { lessonId: 'bot-full-project-v1', lessonTitle: { uz: 'Mini-loyiha: bot + DB + AI + hosting', ru: 'Мини-проект: бот + БД + ИИ + хостинг' } };
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

// ============================================================ BOT MAVZUSI KOMPONENTLARI

const TgChat = ({ title = 'AvtoPizza bot', sub = 'bot · onlayn', ava = '🍕', children, input = true, minH }) => (
  <div className="tg">
    <div className="tg-head"><span className="tg-ava">{ava}</span><span className="tg-name">{title}<span className="tg-status">{sub}</span></span></div>
    <div className="tg-body" style={{ minHeight: minH }}>{children}</div>
    {input && <div className="tg-input"><span className="tg-input-field">Xabar yozing…</span><span className="tg-send">➤</span></div>}
  </div>
);
const Bubble = ({ from = 'bot', children, thinking }) => (
  <div className={`tg-bubble-wrap ${from}`}>
    <div className={`tg-bubble ${from} ${thinking ? 'think' : ''} el-in`}>{thinking ? <span className="gen-dots inline"><i /><i /><i /></span> : children}</div>
  </div>
);
const PromptCard = ({ children, who = 'prompt', tone }) => (
  <div className={`prompt-card ${tone || ''}`}><span className="prompt-who">📝 {who}</span><p className="prompt-text">{children}</p></div>
);

// ===== TO'LIQ ARXITEKTURA (s2) =====
const ARCH = [
  { id: 'user', ico: '👤', label: 'Foydalanuvchi', desc: "Telegram'da yozadi yoki tugma bosadi — buyurtma beradi, savol so'raydi." },
  { id: 'tg', ico: '✈️', label: 'Telegram', desc: "Xabarni Bot API orqali botingizga yetkazadi va javobni qaytaradi." },
  { id: 'bot', ico: '🤖', label: 'Bot (server)', desc: "Markaz: xabarni qabul qiladi, AI va DB bilan ishlaydi, javobni jo'natadi. Serverda 24/7 ishlaydi." },
  { id: 'ai', ico: '🧠', label: 'AI (Claude)', desc: "Erkin savollarga o'ylab tabiiy javob yozadi." },
  { id: 'db', ico: '🗄️', label: 'PostgreSQL', desc: "Foydalanuvchi, holat va buyurtmani eslab qoladi." }
];

// ===== 4 BO'LAK (s3 — BuildStack) =====
const PIECES = [
  { id: 'btn', ico: '🔘', label: 'Tugmalar', from: 'ilgari', desc: "Tez va aniq buyruqlar: menyu, /start, inline-tugmalar." },
  { id: 'ai', ico: '🧠', label: 'AI miya', from: 'ilgari', desc: "Erkin savollarga o'ylab tabiiy javob beradi." },
  { id: 'db', ico: '🗄️', label: 'Xotira (DB)', from: 'ilgari', desc: "Buyurtma va suhbat holatini saqlaydi, restart'da yo'qotmaydi." }
];

// ===== POLLING vs WEBHOOK (s6) =====
const RECEIVE = [
  { id: 'polling', ico: '📮', label: 'Polling', meta: 'so\'rab turadi', desc: "Bot Telegram'dan tinmay so'raydi: «yangi xabar bormi?». Pochta qutisini har soniya tekshirgan kabi. Sodda, kichik botlar uchun yaxshi." },
  { id: 'webhook', ico: '🔔', label: 'Webhook', meta: 'o\'zi xabar beradi', desc: "Telegram yangi xabar kelganda botga o'zi «xabar bor!» deb qo'ng'iroq qiladi. Qo'ng'iroq eshigi kabi — tezroq, ko'p foydalanuvchi uchun." }
];

// ===== PRODUCTION .ENV (s7) =====
const ENV_VARS = [
  { id: 'token', tok: 'BOT_TOKEN', desc: "Telegram bot tokeni — botni Telegram taniydi." },
  { id: 'ai', tok: 'ANTHROPIC_API_KEY', desc: "AI kaliti — bot AI miyaga ulanadi." },
  { id: 'db', tok: 'DATABASE_URL', desc: "PostgreSQL bazaning manzili — serverdagi bazaga ulanish." }
];

// ===== DEPLOY OQIMI (final s15) =====
const FLOW = [
  { id: 'build', ico: '🔧', label: 'Qur', d: "AI bilan kodni yoz: tugma + AI + DB." },
  { id: 'test', ico: '🧪', label: 'Lokal test', d: "o'z kompyuteringda sinab ko'r." },
  { id: 'env', ico: '🔑', label: '.env sozla', d: "token, AI kalit, DB url — serverga." },
  { id: 'deploy', ico: '🚀', label: 'Deploy', d: "kodni hosting xizmatiga yukla." },
  { id: 'live', ico: '🌐', label: '24/7 jonli', d: "bot serverda doimo ishlaydi." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['env', 'build', 'live', 'test', 'deploy'];

// ===== SCREEN 0 — HOOK: kompyuterni o'chirsang bot o'ladi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Bot buzilib qoldi — kodda xato bor" },
    { id: 'b', label: "Bot mening kompyuterimda ishlardi — kompyuter o'chsa, bot ham o'chadi" },
    { id: 'c', label: "Telegram tunda ishlamaydi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Botingiz zo'r ishlayapti. Kechqurun laptopni yopdingiz — va u <span className="italic" style={{ color: T.accent }}>jim bo'ldi</span>. Nega?</h1>
        <Mentor>Botingizda hammasi bor: tugmalar, AI miya, xotira. Lekin u sizning <b style={{ color: T.ink }}>kompyuteringizda</b> ishlardi. Tugmani bosib, tunda nima bo'lishini ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <TgChat title="AvtoPizza bot" sub="bot · oflayn ⚫" input={false} minH={140}>
              <Bubble from="user">02:14 — Salom, pizza buyuraman</Bubble>
              {tried && <><p className="small" style={{ color: T.danger, fontStyle: 'italic', textAlign: 'center', margin: '6px 0' }}>💻 Laptop yopiq — bot oflayn</p>
                <Bubble from="user">Hali ham javob yo'q… 😕</Bubble></>}
            </TgChat>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Ko\'rdingiz' : "▶ Tunda mijoz yozdi"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega bot javob bermadi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Bot kompyuteringizda yashasa — siz uxlasangiz, u ham «uxlaydi». Bugun botga <b>doimiy uy</b> beramiz: uni serverga chiqaramiz (hosting) — 24/7 jonli bo'lsin.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "4 bo'lakni bitta botga yig'ish: tugma + AI + DB", tag: 'sintez' },
    { text: "Hosting: botni serverga qo'yish (24/7)", tag: 'server' },
    { text: "polling vs webhook — bot xabarni qanday oladi", tag: 'aloqa' },
    { text: "Deploy: test → .env → jonli mahsulot", tag: 'chiqarish' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — to'liq jonli mahsulot</p>
      <TgChat input={false} minH={0} sub="bot · onlayn 🟢">
        <Bubble from="user">Glutensiz pizza bormi?</Bubble>
        <Bubble from="bot">Afsus, hozircha yo'q 😔 Lekin yupqa Margarita yengil bo'ladi 🌿 Saqlab qo'yaymi?</Bubble>
      </TgChat>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Tugma + AI + xotira — birga ishlayapti, serverda 24/7. Mana shu to'liq mahsulotni quramiz.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Bo'laklardan — <span className="italic" style={{ color: T.accent }}>ishlaydigan mahsulot</span>.</h2></div>
        <Mentor>Bugun yangi sintaksis kam — ko'proq <b style={{ color: T.ink }}>yig'amiz</b>. Tugma, AI, xotira — hammasi tayyor. Ularni birlashtiramiz va botni internetga chiqaramiz, toki u doim jonli tursin.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — TO'LIQ ARXITEKTURA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(ARCH.map(a => a.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= ARCH.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ARCH.find(a => a.id === active);
  return (
    <Stage eyebrow="Arxitektura · to'liq" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 qismni oching (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mana <span className="italic" style={{ color: T.accent }}>to'liq</span> botning xaritasi — uch dars bitta sxemada.</h2></div>
        <Mentor>Bot — markazda turgan dirijyor: foydalanuvchidan xabar oladi, kerak bo'lsa <b style={{ color: T.ink }}>AI</b>'dan javob so'raydi, <b style={{ color: T.ink }}>DB</b>'ga yozadi, so'ng javob qaytaradi. Har qismni bosib ko'ring.</Mentor>
        <div className="fade-up"><div className="archflow">
          {ARCH.map((a, i) => (
            <React.Fragment key={a.id}>
              {i > 0 && <span className="archflow-arrow">{a.id === 'ai' || a.id === 'db' ? '↕' : '→'}</span>}
              <div className={`archnode ${seen.has(a.id) ? 'on' : ''} ${(a.id === 'ai' || a.id === 'db') ? 'ai' : ''}`}><span className="archnode-ico">{a.ico}</span><span className="archnode-lbl">{a.label}</span></div>
            </React.Fragment>
          ))}
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ARCH.map(a => <button key={a.id} className="gchip" onClick={() => tap(a.id)} style={seen.has(a.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(a.id) ? '✓ ' : ''}{a.ico} {a.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bot — bitta o'zi emas, balki AI va DB bilan ishlaydigan markaz. Endi bu bo'laklarni qanday yig'ishni ko'ramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BUILDSTACK: 4 bo'lakni yig'ish =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [attached, setAttached] = useState(storedAnswer ? new Set(PIECES.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = attached.size >= PIECES.length;
  const tap = (id) => { setActive(id); setAttached(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PIECES.find(p => p.id === active);
  return (
    <Stage eyebrow="Sintez · yig'ish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 bo'lakni ulang (${attached.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta botga <span className="italic" style={{ color: T.accent }}>uch bo'lakni</span> ulaymiz.</h2></div>
        <Mentor>Har dars sizga bitta bo'lak berdi. Endi ularni bitta botga ulaymiz — har bo'lakni bosib, qaysi darsdan kelganini va nima qilishini eslang.</Mentor>
        <div className="fade-up"><div className="stackbar">
          <div className="stack-core">🤖<span>Bot</span></div>
          {PIECES.map(p => <div key={p.id} className={`stack-piece ${attached.has(p.id) ? 'on' : ''}`}><span className="stack-ico">{p.ico}</span><span className="stack-lbl">{p.label}</span><span className="stack-from">{p.from}</span></div>)}
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PIECES.map(p => <button key={p.id} className={`pick-row ${active === p.id ? 'sel' : ''} ${attached.has(p.id) ? 'done-row' : ''}`} onClick={() => tap(p.id)}><span style={{ fontSize: 18, marginRight: 4 }}>{p.ico}</span><span style={{ flex: 1 }}>{p.label} <span style={{ color: T.ink3, fontWeight: 500 }}>· {p.from}</span></span><span className="pick-plus">{attached.has(p.id) ? '✓' : '＋'}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label} <span className="mono" style={{ color: T.accent, fontSize: 11, marginLeft: 6 }}>{cur.from}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bo'lakni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'liq bot tayyor: oddiy buyruqqa <b>tugma</b>, erkin savolga <b>AI</b>, eslab qolishga <b>DB</b>. Endi uni internetga chiqaramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (bo'lak roli) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Mijozning buyurtmasini ertasi kuni ham eslab qolish — qaysi bo'lak ishi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mijozning buyurtmasini <span className="italic" style={{ color: T.accent }}>ertasi kuni ham</span> eslab qolish — qaysi bo'lak?</h2></>}
    options={["Xotira — PostgreSQL (DB), ma'lumotni saqlaydi", "AI miya — chunki u aqlli", "Tugmalar — chunki ular ko'rinadi", "Hech qaysi bo'lak — bot eslab qola olmaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! Eslab qolish — bu xotira ishi, ya'ni PostgreSQL. AI o'ylaydi, tugma buyruq beradi, lekin ma'lumotni doimiy saqlaydigan — faqat DB."
    explainWrong={{
      1: "AI o'ylaydi, lekin o'zi hech narsani saqlamaydi (AI-bot reaktiv). Saqlash DB ishi.",
      2: "Tugmalar tez buyruq uchun — ular ma'lumotni saqlamaydi. Bu DB ishi.",
      3: "Aksincha — DB bilan bot bemalol eslab qoladi. Aynan shuning uchun o'tgan darsda DB qo'shdik.",
      default: "Eslab qolish — PostgreSQL (DB) ishi."
    }} />
);

// ===== SCREEN 5 — HOSTING: lokal vs server =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [off, setOff] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = off;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hosting · doimiy uy" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kompyuterni o'chiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Botga <span className="italic" style={{ color: T.accent }}>doimiy uy</span> — server kerak.</h2></div>
        <Mentor>Kompyuteringiz — mehmonxona xonasi: ketsangiz yopiladi. <b style={{ color: T.ink }}>Server</b> (hosting xizmati) — doimiy uy: hech qachon o'chmaydi. Tugmani bosib, ikkalasiga nima bo'lishini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className={`mem-box ${off ? 'gone' : ''}`}>
              <p className="note-h" style={{ color: off ? T.danger : T.ink2 }}>💻 Sizning kompyuteringiz (lokal)</p>
              <p className="body" style={{ margin: 0, color: off ? T.danger : T.ink }}>{off ? '⚫ O\'chdi — bot ham oflayn!' : '🟢 Bot ishlayapti (siz onlaynsiz)'}</p>
            </div>
            <div className="mem-box keep">
              <p className="note-h" style={{ color: T.success }}>🌐 Server (hosting xizmati)</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>🟢 Bot doim onlayn — siz uxlasangiz ham 24/7 ishlaydi ✅</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={off} onClick={() => { setOff(true); setSc(n => n + 1); }}>{off ? '✓ Ko\'rdingiz' : "💻 Kompyuterni o'chirish"}</button>
          </Col>
          <Col>
            {off
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kompyuter o'chdi — lokal bot jim. Lekin <b>serverdagi bot ishlayveradi</b>. Shuning uchun jiddiy botni doimo serverga (hosting'ga) qo'yamiz.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="agent-card fade-step"><span className="agent-lbl">💡 HOSTING XIZMATLARI</span><p className="agent-msg">Server ijaraga olamiz — masalan <b>Railway</b>, <b>Render</b> kabi xizmatlar. Qaysi birini tanlashni AI'dan so'rashingiz mumkin; siz uchun muhimi — <b>bot doim jonli</b> turishi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — POLLING vs WEBHOOK =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(RECEIVE.map(r => r.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= RECEIVE.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = RECEIVE.find(r => r.id === active);
  return (
    <Stage eyebrow="Aloqa · 2 usul" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 usulni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bot xabarni qanday <span className="italic" style={{ color: T.accent }}>oladi</span>: polling yoki webhook?</h2></div>
        <Mentor>Yangi xabar kelganini bot ikki yo'l bilan biladi. Ikkalasini ham bosib ko'ring — tushunchani metafora bilan eslang. (Tafsilotini AI yozadi; siz farqni bilsangiz yetarli.)</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {RECEIVE.map(r => <button key={r.id} className={`pick-row ${active === r.id ? 'sel' : ''} ${seen.has(r.id) ? 'done-row' : ''}`} onClick={() => tap(r.id)}><span style={{ fontSize: 18, marginRight: 4 }}>{r.ico}</span><span style={{ flex: 1 }}>{r.label} <span style={{ color: T.ink3, fontWeight: 500 }}>· {r.meta}</span></span><span className="pick-plus">{seen.has(r.id) ? '✓' : '▶'}</span></button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sodda bot — <b>polling</b> bilan boshlang (oson). Ko'p foydalanuvchi bo'lsa — <b>webhook</b>ga o'tasiz. Ikkalasi ham bir ishni qiladi: xabarni botga yetkazadi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Usulni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — PRODUCTION .ENV =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(ENV_VARS.map(e => e.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= ENV_VARS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ENV_VARS.find(e => e.id === active);
  return (
    <Stage eyebrow="Deploy · .env" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 kalitni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Serverda 3 ta <span className="italic" style={{ color: T.accent }}>maxfiy kalit</span> kerak bo'ladi.</h2></div>
        <Mentor>Loyihada uch maxfiy qiymat bor: bot tokeni, AI kaliti, baza manzili. Lokalda <span className="mono">.env</span>'da edi (o'tgan darsdagi qoida). Serverda ularni hosting sozlamalariga qo'yasiz — kodda ochiq emas. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name=".env (serverda)" minH={90}>
              <Cm>{'# Maxfiy — git\'ga tushmaydi'}</Cm>{'\n'}
              <At>BOT_TOKEN</At>{'='}<St>123456:AA…</St>{'\n'}
              <At>ANTHROPIC_API_KEY</At>{'='}<St>sk-ant-…</St>{'\n'}
              <At>DATABASE_URL</At>{'='}<St>postgres://…</St>
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ENV_VARS.map(e => <button key={e.id} className="gchip" onClick={() => tap(e.id)} style={seen.has(e.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(e.id) ? '✓ ' : ''}<span className="mono">{e.tok}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent, fontSize: 12 }}>{cur.tok}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kalitni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Eng tez-tez uchraydigan deploy xatosi — serverda kalit unutilishi (masalan <span className="mono">DATABASE_URL</span> yo'q). Shuni esda tuting!</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 (hosting maqsadi) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Nega botni o'z kompyuterimiz o'rniga serverga (hosting) qo'yamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega botni serverga (<span className="italic" style={{ color: T.accent }}>hosting</span>) qo'yamiz?</h2></>}
    options={["Server doim yoqilgan — bot 24/7 ishlaydi, kompyuterimiz o'chsa ham", "Server botni chiroyliroq qiladi", "Faqat shunda bot AI bilan gaplasha oladi", "Hosting bot kodini o'zi yozib beradi"]} correctIdx={0}
    explainCorrect="To'g'ri! Server doimo yoqilgan kompyuter — botingiz u yerda 24/7 jonli turadi. Sizning laptopingiz o'chsa ham mijozlar bemalol yozaveradi."
    explainWrong={{
      1: "Hosting ko'rinishni o'zgartirmaydi — u botni doim jonli tutadi.",
      2: "AI bilan aloqa kalit (.env) orqali bo'ladi, hosting'dan mustaqil. Hosting — 24/7 ishlash uchun.",
      3: "Kodni siz AI bilan yozasiz; hosting faqat uni doimo ishlatib turadi.",
      default: "Hosting botni 24/7 jonli tutadi."
    }} />
);

// ===== SCREEN 9 — AI BILAN TO'LIQ LOYIHA PROMPTI =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qurish · prompt" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Promptni o'qing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI'ga <span className="italic" style={{ color: T.accent }}>to'liq loyihani</span> aniq buyuramiz.</h2></div>
        <Mentor>Siz direktorsiz: arxitekturani aytasiz, AI kodni yozadi. Yaxshi prompt — har bo'lakni aniq nomlaydi (tugma, AI, DB) va vazifani belgilaydi. Tugmani bosib, nega bu prompt kuchli ekanini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <PromptCard who="loyiha prompti" tone="live">NestJS + Telegraf'da pizza buyurtma boti yoz. /start'da inline-tugmalar bilan menyu chiqsin. Erkin savollarga Claude AI (system: faqat pizza) javob bersin. Foydalanuvchi va buyurtmani PostgreSQL'da saqla (users, orders). Kalitlar .env'dan o'qilsin.</PromptCard>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Nega bu prompt kuchli?"}</button>
          </Col>
          <Col>
            {show ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🔘 <b>Tugma:</b> «inline-tugmalar bilan menyu»</p></div>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🧠 <b>AI:</b> «Claude, system: faqat pizza»</p></div>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🗄️ <b>DB:</b> «PostgreSQL'da saqla (users, orders)»</p></div>
            </div> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Prompt har bo'lakni aniq aytdi — shuning uchun AI to'liq, ishlaydigan struktura yozadi. Noaniq prompt — chala bot.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — AI YOZGAN LOYIHA STRUKTURASI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FILES = [
    { f: 'bot.ts', d: "Markaz — Telegraf, /start, tugmalar, xabar handleri." },
    { f: 'ai.ts', d: "AI'ga so'rov: messages.create, system prompt." },
    { f: 'db.ts', d: "PostgreSQL ulanishi: INSERT/SELECT/UPDATE." },
    { f: '.env', d: "Maxfiy kalitlar: BOT_TOKEN, ANTHROPIC_API_KEY, DATABASE_URL." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(FILES.map(f => f.f)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= FILES.length;
  const tap = (f) => { setActive(f); setSeen(prev => new Set(prev).add(f)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = FILES.find(x => x.f === active);
  return (
    <Stage eyebrow="O'qish · struktura" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 faylni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI loyihani <span className="italic" style={{ color: T.accent }}>bo'laklarga</span> bo'lib yozdi — o'qiy olasizmi?</h2></div>
        <Mentor>Yaxshi AI kodni tartibli fayllarga ajratadi: har fayl bitta ish. Direktor sifatida har fayl nima qilishini bilishingiz kerak. Har faylni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="loyiha/" minH={130}>
              {'avtopizza-bot/'}{'\n'}
              {'├─ '}<At>bot.ts</At>{'      '}<Cm>{'// markaz'}</Cm>{'\n'}
              {'├─ '}<At>ai.ts</At>{'       '}<Cm>{'// AI miya'}</Cm>{'\n'}
              {'├─ '}<At>db.ts</At>{'       '}<Cm>{'// xotira'}</Cm>{'\n'}
              {'└─ '}<At>.env</At>{'        '}<Cm>{'// kalitlar'}</Cm>
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FILES.map(x => <button key={x.f} className="gchip" onClick={() => tap(x.f)} style={seen.has(x.f) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(x.f) ? '✓ ' : ''}<span className="mono">{x.f}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent, fontSize: 12 }}>{cur.f}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Faylni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bo'lak — alohida fayl. Bug chiqsa, qaysi faylga qarashni bilasiz. Mana shu — kodni «o'qiy olish».</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (polling/webhook) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Webhook qanday ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Webhook</span> qanday <span className="italic" style={{ color: T.accent }}>ishlaydi</span>?</h2></>}
    options={["Yangi xabar kelganda Telegram botga o'zi xabar beradi (qo'ng'iroq eshigi kabi)", "Bot Telegram'dan tinmay «xabar bormi?» deb so'rab turadi", "Bot internetsiz ishlaydi", "Webhook ma'lumotni bazaga saqlaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! Webhook'da Telegram tashabbus ko'rsatadi: xabar kelishi bilan botga «xabar bor!» deb yuboradi — qo'ng'iroq eshigi kabi. Bu tezroq va ko'p foydalanuvchiga qulay."
    explainWrong={{
      1: "Bu — polling (bot o'zi so'rab turadi). Webhook'da aksincha — Telegram botga o'zi xabar beradi.",
      2: "Ikkala usul ham internet talab qiladi — webhook internetsiz ishlamaydi.",
      3: "Saqlash — DB ishi. Webhook faqat xabarni botga yetkazadi.",
      default: "Webhook'da Telegram botga o'zi xabar beradi."
    }} />
);

// ===== SCREEN 12 — CASE: AvtoPizza to'liq jonli =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { u: '/start', b: "Salom! 🍕 Menyu uchun tugmani bosing yoki shunchaki savol bering.", piece: '🔘 Tugma', note: "Tayyor menyu — tez va aniq." },
    { u: 'Glutensiz pizza bormi?', b: "Afsus, hozircha glutensiz yo'q 😔 Lekin yupqa xamirli Margarita yengil bo'ladi 🌿", piece: '🧠 AI miya', note: "Erkin savol — AI o'ylab javob berdi." },
    { u: 'Mayli, Margarita olaman — Chilonzor 5', b: "Qabul qilindi! Margarita · Chilonzor 5 📍 Saqlab qo'ydim ✅", piece: '🗄️ Xotira (DB)', note: "Buyurtma bazaga yozildi — keyin ham eslaydi." }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [phase, setPhase] = useState('idle');
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => {
    if (phase === 'think') return;
    setPhase('think'); setSc(n => n + 1);
    setTimeout(() => { setShown(n => Math.min(n + 1, STEPS.length)); setPhase('idle'); setSc(n => n + 1); }, 800);
  };
  const curPiece = shown === 0 ? null : STEPS[shown - 1];
  return (
    <Stage eyebrow="Hayotiy · to'liq bot" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Suhbatni davom ettiring (${shown}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq bot jonli — har xabarda <span className="italic" style={{ color: T.accent }}>boshqa bo'lak</span> ishlaydi.</h2></div>
        <Mentor>Mana hammasi birga. Mijoz gaplashadi — bot goh tugma, goh AI, goh DB bilan javob beradi. O'ng tomonda har qadamda qaysi bo'lak ishlayotganini kuzating.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <TgChat minH={210} input={false} sub="bot · onlayn 🟢">
              {STEPS.slice(0, shown).map((s, i) => (<React.Fragment key={i}><Bubble from="user">{s.u}</Bubble><Bubble from="bot">{s.b}</Bubble></React.Fragment>))}
              {phase === 'think' && <Bubble from="bot" thinking />}
              {shown === 0 && phase !== 'think' && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Tugmani bosing — suhbat boshlanadi.</p>}
            </TgChat>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done || phase === 'think'} onClick={advance}>{done ? '✓ To\'liq suhbat ko\'rsatildi' : shown === 0 ? '▶ Suhbatni boshlash' : 'Keyingi xabar →'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">🔧 Ishlagan bo'lak</p>{curPiece ? <><p className="holat-badge">{curPiece.piece}</p><p className="body" style={{ margin: '8px 0 0', color: T.ink }}>{curPiece.note}</p></> : <p className="body" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>Hali boshlanmadi.</p>}</div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta suhbatda uchala bo'lak ham ishladi — tugma, AI, DB. Va bularning bari serverda 24/7. Mana to'liq mahsulot!</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — VIBECODING: deploy bug → tuzatish =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STAGES = [
    { lbl: '🧪 Test', tone: 'info', txt: "Deploydan keyin sinaymiz: bot javob beradi, AI ishlayapti — yaxshi!" },
    { lbl: '🐞 Bug', tone: 'warn', txt: "Lekin buyurtma saqlanmayapti. Restart'dan keyin bot hech narsani eslamaydi. ❌" },
    { lbl: '🔍 Sabab', tone: 'info', txt: "Serverda DATABASE_URL .env'ga qo'shilmagan — bot bazaga ulana olmagan." },
    { lbl: '✅ Tuzatish', tone: 'ok', txt: "DATABASE_URL ni hosting sozlamalariga qo'shamiz va qayta deploy. Endi buyurtma saqlanadi!" }
  ];
  const [step, setStep] = useState(storedAnswer ? STAGES.length : 0);
  const [sc, setSc] = useState(0);
  const done = step >= STAGES.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setStep(n => n + 1); setSc(n => n + 1); } };
  return (
    <Stage eyebrow="Vibecoding · sikl" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni yuriting (${step}/${STAGES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Deploydan keyin <span className="italic" style={{ color: T.accent }}>bug</span> chiqdi — siz uni topib tuzatasiz.</h2></div>
        <Mentor>To'liq loyihada xato bo'lishi tabiiy. Direktor sifatida sikl bo'yicha ishlaysiz: test → bug topish → sabab → tuzatish (vibecoding). Tugmani bosib, siklni yuring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {STAGES.slice(0, step).map((s, i) => (
                <div key={i} className={s.tone === 'warn' ? 'frame-warn fade-step' : s.tone === 'ok' ? 'frame-success fade-step' : 'sk-info fade-step'}>
                  <p className="note-h" style={{ margin: '0 0 4px' }}>{s.lbl}</p>
                  <p className="body" style={{ margin: 0, color: T.ink }}>{s.txt}</p>
                </div>
              ))}
              {step === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — sikl boshlanadi.</p></div>}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Bug tuzatildi' : step === 0 ? '▶ Test qilish' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <div className="agent-card"><span className="agent-lbl">🔁 VIBECODING SIKLI</span><p className="agent-msg">Test → bug → sabab → tuzatish prompti → qayta deploy. Eng ko'p deploy bug'i — <b>serverda kalit (.env) yo'qligi</b>. Birinchi shu yerga qarang.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz bug'ni topdingiz, sababini tushundingiz va tuzatdingiz — kodni AI yozgan bo'lsa ham. Mana direktorlik.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (deploy bug) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Bot serverda javob beradi, lekin buyurtmani saqlamayapti. Birinchi nimani tekshirasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot javob beradi, lekin buyurtmani <span className="italic" style={{ color: T.accent }}>saqlamayapti</span>. Birinchi nimani tekshirasiz?</h2></>}
    options={["Serverda DATABASE_URL (.env kaliti) to'g'ri qo'yilganmi", "Botning rangini", "Telegram ilovasini qayta o'rnatishni", "Internet tezligini"]} correctIdx={0}
    explainCorrect="To'g'ri! Bot javob beryapti (token va AI joyida), lekin saqlamayapti — demak baza bilan aloqa yo'q. Eng ehtimolli sabab: serverda DATABASE_URL kaliti yo'q yoki noto'g'ri. Deploy bug'larining eng ko'pi shu."
    explainWrong={{
      1: "Rang bilan saqlash bog'liq emas. Saqlash DB ishi — DATABASE_URL ni tekshiring.",
      2: "Muammo bot tomonida (baza ulanishi), foydalanuvchi ilovasida emas.",
      3: "Bot javob beryapti — demak internet bor. Muammo baza kalitida.",
      default: "DATABASE_URL (.env) ni birinchi tekshiring."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: deploy oqimini yig'ish =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Deploy oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: loyihani jonli qilish <span className="italic" style={{ color: T.accent }}>tartibini</span> yig'ing.</h2></div>
        <Mentor>Bo'sh fayldan jonli botgacha yo'l: avval qurasiz, lokal test qilasiz, kalitlarni sozlaysiz, deploy qilasiz — va bot 24/7 jonli bo'ladi. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">deploy oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Qur → Lokal test → .env → Deploy → 24/7 jonli</b>. Mana mahsulotni internetga chiqarish yo'li.</p></div>}
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
    "To'liq bot = tugma + AI miya + xotira/DB bir markazda",
    "Bot — dirijyor: AI'dan javob so'raydi, DB'ga yozadi, javob qaytaradi",
    "Hosting: botni serverga qo'yib, 24/7 jonli qilamiz (kompyuter o'chsa ham)",
    "polling — bot so'rab turadi; webhook — Telegram o'zi xabar beradi",
    "Deploy: qur → lokal test → .env (token, AI kalit, DB url) → deploy → jonli"
  ];
  const HOMEWORK = [
    { b: "Yig'ing", t: "— o'z botingizga uch bo'lakni ulang: bitta tugma, bitta AI javob, bitta saqlash" },
    { b: 'Chiqaring', t: "— botni hosting xizmatiga deploy qiling, .env kalitlarni serverga qo'ying" },
    { b: 'Sinang', t: "— kompyuteringizni o'chiring va bot hali ham javob berayotganini tekshiring" }
  ];
  const GLOSSARY = [
    { b: 'hosting', t: '— botni serverda doimo ishlatish' },
    { b: 'server', t: '— doim yoqilgan kompyuter (botning uyi)' },
    { b: 'lokal', t: '— o\'z kompyuteringizda ishlash' },
    { b: 'deploy', t: '— kodni serverga chiqarish' },
    { b: 'polling', t: '— bot o\'zi «xabar bormi?» deb so\'raydi' },
    { b: 'webhook', t: '— Telegram botga o\'zi xabar beradi' },
    { b: 'DATABASE_URL', t: '— baza manzili (.env kaliti)' },
    { b: '24/7', t: '— doimiy, to\'xtovsiz ishlash' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> To'liq mahsulot qurdingiz</span><h2 className="title h-title fade-up d1">Botingiz endi <span className="italic" style={{ color: T.accent }}>internetda jonli</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Tugma + AI + DB ni bitta botga yig'dingiz va uni serverga chiqarib, 24/7 jonli qildingiz." : "Yaxshi harakat! Hosting (24/7) va deploy oqimi (.env → deploy) bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — Fidbek va iteratsiya: foydalanuvchilar nima deydi, nimani yaxshilaymiz?</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotFullProjectLesson({ lang: langProp, onFinished }) {
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

        /* PROMPT CARD */
        .prompt-card { background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); border-left: 4px solid ${T.amber}; }
        .prompt-card.live { border-left-color: ${T.accent}; }
        .prompt-who { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.amber}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .prompt-card.live .prompt-who { color: ${T.accent}; }
        .prompt-text { font-family: 'JetBrains Mono'; font-size: clamp(11.5px,1.4vw,13px); color: ${T.ink}; margin: 0; line-height: 1.6; }

        /* GENERATING DOTS */
        .gen-dots { display: inline-flex; gap: 4px; }
        .gen-dots.inline { vertical-align: middle; }
        .gen-dots i { width: 7px; height: 7px; border-radius: 50%; background: ${T.blue}; animation: gen-bounce 1s infinite ease-in-out; }
        .gen-dots i:nth-child(2) { animation-delay: 0.15s; } .gen-dots i:nth-child(3) { animation-delay: 0.3s; }
        @keyframes gen-bounce { 0%,80%,100% { transform: scale(0.5); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

        /* ===== TELEGRAM CHAT ===== */
        .tg { border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px -8px rgba(${T.shadowBase},0.3); border: 1px solid rgba(167,166,162,0.22); }
        .tg-head { background: linear-gradient(180deg,#5A9FD4,#4E8FC0); padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .tg-ava { width: 32px; height: 32px; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
        .tg-name { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: #fff; display: flex; flex-direction: column; line-height: 1.25; }
        .tg-status { font-weight: 500; font-size: 10.5px; color: #DCEBF7; }
        .tg-body { background: #CAD7E0; background-image: radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px); background-size: 18px 18px; padding: 13px 12px; display: flex; flex-direction: column; gap: 4px; }
        .tg-bubble-wrap { display: flex; flex-direction: column; max-width: 86%; gap: 0; }
        .tg-bubble-wrap.user { align-self: flex-end; align-items: flex-end; }
        .tg-bubble-wrap.bot { align-self: flex-start; align-items: flex-start; }
        .tg-bubble { padding: 8px 12px; border-radius: 14px; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); line-height: 1.45; box-shadow: 0 1px 2px rgba(0,0,0,0.12); word-break: break-word; margin-bottom: 3px; }
        .tg-bubble.bot { background: #fff; color: #0E0E10; border-bottom-left-radius: 5px; }
        .tg-bubble.user { background: #EFFDDE; color: #0E0E10; border-bottom-right-radius: 5px; }
        .tg-bubble.think { padding: 11px 14px; }
        .tg-input { display: flex; align-items: center; gap: 10px; background: #fff; padding: 10px 14px; border-top: 1px solid rgba(0,0,0,0.06); }
        .tg-input-field { flex: 1; color: #A7A6A2; font-family: 'Manrope'; font-size: 13px; }
        .tg-send { color: #5A9FD4; font-size: 17px; }

        /* ===== ARXITEKTURA OQIMI ===== */
        .archflow { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .archnode { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 11px; padding: 10px 10px; min-width: 84px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .archnode.on { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.26); background: ${T.successSoft}; }
        .archnode.ai.on { box-shadow: inset 0 0 0 1.5px ${T.blue}, 0 6px 16px -6px rgba(1,154,203,0.26); background: ${T.blueSoft}; }
        .archnode-ico { font-size: 19px; line-height: 1; }
        .archnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .archflow-arrow { color: ${T.ink3}; font-weight: 700; font-size: 15px; }

        /* ===== BUILD STACK ===== */
        .stackbar { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; padding: 4px 0; }
        .stack-core { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.ink}; color: #fff; border-radius: 12px; padding: 11px 13px; font-size: 22px; min-width: 70px; }
        .stack-core span { font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .stack-piece { display: flex; flex-direction: column; align-items: center; gap: 1px; background: ${T.paper}; border-radius: 11px; padding: 9px 11px; min-width: 86px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); opacity: 0.45; filter: grayscale(0.5); transition: all 0.3s; }
        .stack-piece.on { opacity: 1; filter: none; box-shadow: inset 0 0 0 1.5px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.26); background: ${T.successSoft}; }
        .stack-ico { font-size: 18px; line-height: 1; }
        .stack-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; }
        .stack-from { font-family: 'JetBrains Mono'; font-size: 9px; color: ${T.accent}; }

        /* ===== HOLAT BADGE / MEM BOX ===== */
        .holat-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(11px,1.4vw,13px); color: ${T.accent}; background: ${T.accentSoft}; padding: 6px 12px; border-radius: 99px; margin: 0; }
        .mem-box { background: ${T.paper}; border-radius: 12px; padding: 14px 16px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); border-left: 4px solid ${T.ink3}; transition: all 0.35s; }
        .mem-box.keep { border-left-color: ${T.success}; }
        .mem-box.gone { border-left-color: ${T.danger}; background: ${T.dangerSoft}; }

        /* ===== OQIM (final ko'rinish) ===== */
        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 76px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
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
