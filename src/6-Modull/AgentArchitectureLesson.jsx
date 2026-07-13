import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · DARS 3 (T3) — AI-AGENT (ARXITEKTURA DARAJASIDA) — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi AI-agentni TIZIM KOMPONENTI sifatida tushunadi: oddiy AI ↔ agent farqi (system view),
//         agent qachon kerak (judgment), agent toollar orqali tizimga (DB/API/Bot) qanday ulanishi.
// KELISHUV: M8 P5 (agent qurish) ni TAKRORLAMAYDI — bu yerda agent = arxitekturadagi aqlli komponent (qayerda, qachon, qanday ulanadi).
// Metafora: oddiy AI = bitta funksiya (savol→javob); agent = xodim (maqsad→o'z sikli→tizim bilan ishlaydi).
// Signature animatsiyalar: AgentVsAI (bir vazifa — ikki yondashuv) va Agent-in-system (agent markaz, qo'llari toollarga).
// Davomi: T1 (komponentlar), T2 (patternlar). Ko'prik: T4 (Claude Skills — AI/agent xulqini shakllantirish). Mahsulot: mini-do'kon.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
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

const LESSON_META = { lessonId: 'agent-arch-03-v16', lessonTitle: { uz: 'AI-agent — arxitektura komponenti', ru: 'AI-агент в архитектуре' } };
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

// ============================================================ MAVZU MA'LUMOTLARI

// ===== ODDIY AI vs AGENT (s2) =====
const VS_ROWS = [
  { id: 'what', k: 'Nima u?', ai: 'bitta funksiya — chaqirasiz, javob qaytaradi', agent: "komponent — maqsad berasiz, o'zi ishlaydi" },
  { id: 'steps', k: 'Necha qadam?', ai: 'bir martalik (savol → javob)', agent: "ko'p qadam — maqsadga yetguncha sikl" },
  { id: 'system', k: 'Tizim bilan?', ai: 'tizimga tegmaydi — faqat matn qaytaradi', agent: 'toollar orqali tizim bilan ishlaydi (DB, API, bot)' },
  { id: 'use', k: 'Qachon?', ai: 'oddiy, bir martalik ish (tarjima, tavsiya)', agent: "ko'p qadamli maqsad (buyurtmani hal qil)" }
];

// ===== AGENT TOOLLARI (s7) — tizimga ulanish =====
const TOOLS = [
  { id: 'db', ico: '🗄️', label: 'Database', desc: "Agent omborni tekshiradi va buyurtmani yozadi — bu sizning DB so'rovingiz (tool)." },
  { id: 'api', ico: '🔌', label: 'API', desc: "Agent boshqa xizmatni chaqiradi — to'lov, yetkazish — bu API chaqiruvi (tool)." },
  { id: 'bot', ico: '🤖', label: 'Bot', desc: "Agent mijozga Telegram orqali xabar yuboradi — bu bot funksiyasi (tool)." }
];

// ===== AGENT ENGINE (s5) =====
const ENGINE = [
  { id: 'perceive', ico: '👁️', label: 'Idrok' },
  { id: 'decide', ico: '🧠', label: 'Qaror' },
  { id: 'act', ico: '🛠️', label: 'Amal' }
];

// ===== TASK DECIDER (s10) =====
const TASKS = [
  { id: 't1', task: "Mahsulot tavsifini ingliz tiliga o'gir", ans: 'ai' },
  { id: 't2', task: "Mijoz buyurtmasini boshidan oxirigacha hal qil: tekshir, band qil, yetkazishni rasmiylashtir", ans: 'agent' },
  { id: 't3', task: "Bitta savolga qisqa javob ber", ans: 'ai' },
  { id: 't4', task: "Mahsulot tugaganda o'zi yetkazib beruvchiga yangi buyurtma ber", ans: 'agent' }
];

// ===== CASE (s12) — smart order agent =====
const CASE_STEPS = [
  { ico: '🎯', txt: "Maqsad: «Mijoz buyurtmasini to'liq qabul qilib, yetkazishga uzat.»" },
  { ico: '👁️', txt: "Idrok: agent DB'dan omborni o'qidi — mahsulot bormi? (tool: SQL)" },
  { ico: '🧠', txt: "Qaror: bor ekan — band qilish kerak. saveOrder toolini tanladi." },
  { ico: '🛠️', txt: "Amal: saveOrder() → DB'ga buyurtma yozildi ✅ (tizimga ta'sir)" },
  { ico: '🧠', txt: "Qaror: endi yetkazish kerak → notifyCourier toolini tanladi." },
  { ico: '🛠️', txt: "Amal: notifyCourier() → kuryerga xabar ketdi 🚚✅" },
  { ico: '✅', txt: "Maqsadga yetildi. Agent o'zi 2 ta toolni ishlatib, ishni bajardi." }
];

// ===== AGENT OQIMI (final s15) =====
const FLOW = [
  { id: 'goal', ico: '🎯', label: 'Maqsad', d: "agentga vazifa beriladi." },
  { id: 'perceive', ico: '👁️', label: 'Idrok', d: "tizimdan holatni o'qiydi (DB)." },
  { id: 'decide', ico: '🧠', label: 'Qaror', d: "AI qaysi toolni tanlaydi." },
  { id: 'act', ico: '🛠️', label: 'Amal', d: "toolni chaqiradi (tizimga ta'sir)." },
  { id: 'loop', ico: '🔁', label: "Natijani ko'r", d: "tugamasa — qayta idrok." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['decide', 'goal', 'loop', 'perceive', 'act'];

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Agent chiroyliroq gapiradi" },
    { id: 'b', label: "Agent o'zi qadamlar qo'yib, tizim (DB, yetkazish) bilan ishlab, ishni bajardi" },
    { id: 'c', label: "Hech farqi yo'q — ikkalasi bir xil" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Dars · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Bitta maqsad: «sovg'a top, 200 minggacha, tez yetkazilsin». Ikki xil <span className="italic" style={{ color: T.accent }}>javob</span>.</h1>
        <Mentor>AI miyani o'tgan darslarda ko'rdik. Endi savol: AI tizimda qanday turlarda bo'ladi? Tugmani bosing — bir maqsadga oddiy AI va agent qanday javob berishini solishtiring.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="sk-info" style={{ borderLeft: `4px solid ${T.ink3}` }}>
              <p className="note-h" style={{ color: T.ink2 }}>💬 Oddiy AI (faqat javob)</p>
              {tried ? <p className="body" style={{ margin: 0, color: T.ink }}>«Mana mos variantlar: Quloqchin (180k), Powerbank (150k). O'zingiz tanlab buyurtma bering.»</p>
                : <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>…</p>}
            </div>
            <div className="agent-card">
              <span className="agent-lbl">🤖 AI-agent (ishni bajaradi)</span>
              {tried ? <p className="agent-msg">«Topdim ✓ band qildim ✓ tez yetkazishni rasmiylashtirdim ✓ — 35 daqiqada yetkaziladi.»</p>
                : <p className="agent-msg" style={{ color: T.ink3, fontStyle: 'italic' }}>…</p>}
            </div>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Solishtirildi' : "▶ Ikki javobni ko'rish"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Asosiy farq nimada?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Oddiy AI — <b>maslahatchi</b> (faqat javob). <b>Agent</b> — tizimning aqlli <b>komponenti</b>: o'zi qadamlar qo'yib, toollar (DB, yetkazish) orqali ishni bajaradi. Bugun agentning arxitekturadagi o'rnini ko'ramiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Oddiy AI vs agent — tizim nuqtai nazaridan", tag: 'farq' },
    { text: "Agentning ichki dvigateli: idrok → qaror → amal", tag: 'sikl' },
    { text: "Toollar — agentni tizimga ulaydi (DB/API/bot)", tag: 'ulanish' },
    { text: "Qachon agent, qachon oddiy AI", tag: 'qaror' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — agentni arxitekturada joylaysiz</p>
      <div className="clients-map">
        <div className="cm-clients"><div className="cm-client on"><span>🗄️</span><span className="cm-lbl">DB</span></div><div className="cm-client on"><span>🤖</span><span className="cm-lbl">Bot</span></div><div className="cm-client on"><span>🔌</span><span className="cm-lbl">API</span></div></div>
        <span className="cm-arrow">←</span>
        <div className="cm-core"><div className="cm-core-node">🤖<span>Agent</span></div></div>
      </div>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Agent — backend ichidagi aqlli komponent. Toollar orqali tizimning boshqa qismlariga «qo'l» cho'zadi.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Agent — tizimning <span className="italic" style={{ color: T.accent }}>aqlli komponenti</span>.</h2></div>
        <Mentor>Modul 8'da agent <b style={{ color: T.ink }}>qurdingiz</b>. Bugun boshqa savol — arxitektura savoli: agent tizimda <b style={{ color: T.ink }}>qayerda turadi</b>, oddiy AI'dan farqi nima va <b style={{ color: T.ink }}>qachon</b> uni tanlaysiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — ODDIY AI vs AGENT =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(VS_ROWS.map(r => r.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= VS_ROWS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = VS_ROWS.find(r => r.id === active);
  return (
    <Stage eyebrow="Tushuncha · farq" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 farqni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Oddiy AI</span> — funksiya. <span className="italic" style={{ color: T.accent }}>Agent</span> — xodim.</h2></div>
        <Mentor>Oddiy AI — kalkulyator kabi: savol berasiz, javob oladi, tamom. Agent — xodim kabi: maqsad berasiz, u o'zi qadamlar qo'yib bajaradi. Har jihatni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {VS_ROWS.map(r => <button key={r.id} className="gchip" onClick={() => tap(r.id)} style={seen.has(r.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(r.id) ? '✓ ' : ''}{r.k}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir jumla: <b>oddiy AI gapiradi (bir marta), agent ishni qiladi (sikl + toollar).</b> Ikkalasi ham foydali — har biri o'z o'rnida.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="fade-step" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p className="flow-label">{cur.k}</p>
                  <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h" style={{ color: T.ink2 }}>💬 Oddiy AI</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.ai}</p></div>
                  <div className="agent-card"><span className="agent-lbl">🤖 Agent</span><p className="agent-msg">{cur.agent}</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Jihatni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — AGENT vs AI ANIMATSIYA =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [run, setRun] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = run;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const AG = [
    { ico: '👁️', txt: "DB'ni tekshirdi — mos mahsulot bormi?" },
    { ico: '🛠️', txt: "Mosini band qildi (saveOrder)" },
    { ico: '🛠️', txt: "Tez yetkazishni rasmiylashtirdi (notifyCourier)" },
    { ico: '✅', txt: "Maqsad bajarildi" }
  ];
  return (
    <Stage eyebrow="Animatsiya · bir vazifa, ikki yo'l" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Farqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta vazifa — oddiy AI <span className="italic" style={{ color: T.accent }}>1 qadam</span>, agent <span className="italic" style={{ color: T.accent }}>ko'p qadam</span>.</h2></div>
        <Mentor>Mana vizual farq: oddiy AI bitta javob qaytaradi va to'xtaydi. Agent esa sikl bo'ylab bir nechta amal qiladi — tizimga ta'sir o'tkazadi. Tugmani bosing.</Mentor>
        <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={run} onClick={() => { setRun(true); setSc(n => n + 1); }}>{run ? '✓ Ko\'rsatildi' : "▶ Ikki yondashuvni ishga tushir"}</button>
        <Zoomable><div className="split">
          <Col>
            <div className="sk-info" style={{ borderLeft: `4px solid ${T.ink3}` }}>
              <p className="note-h" style={{ color: T.ink2 }}>💬 Oddiy AI — bir qadam</p>
              {run ? <div className="fade-step"><p className="body" style={{ margin: '0 0 8px', color: T.ink }}>«Mana variantlar: …» → tugadi.</p><span className="loop-badge" style={{ background: T.bg, color: T.ink2 }}>1 qadam · faqat matn</span></div>
                : <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>Tugmani bosing →</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label" style={{ color: T.accent }}>🤖 Agent — sikl + toollar {run && <span className="loop-badge">↻ loop</span>}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {run && AG.map((s, i) => (
                <div key={i} className={`agent-step fade-step ${s.ico === '✅' ? 'done' : ''}`} style={{ animationDelay: `${i * 0.45}s` }}>
                  <span className="as-phase">{s.ico} {i < AG.length - 1 ? `amal ${i + 1}` : 'tayyor'}</span>
                  <span className="as-txt">{s.txt}</span>
                </div>
              ))}
              {!run && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — agent ishga tushadi</p></div>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agent 3 ta amal qildi va tizimga ta'sir o'tkazdi. Oddiy AI esa faqat gapirdi. Mana arxitektura farqi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Oddiy AI chaqiruvi (agent emas) nima qaytaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Oddiy AI chaqiruvi (agent emas) nima <span className="italic" style={{ color: T.accent }}>qaytaradi</span>?</h2></>}
    options={["Bitta javob (matn) — bir martalik, tizimga ta'sir qilmaydi", "Maqsad sari ko'p qadamli amallar", "Bazaga to'g'ridan-to'g'ri yozadi", "Hech narsa — u faqat agent ichida ishlaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! Oddiy AI — funksiya kabi: kirishga javob beradi va to'xtaydi. Tizimga (DB/API) o'zi ta'sir qilmaydi. Ko'p qadamli, tizim bilan ishlaydigan vazifa uchun agent kerak."
    explainWrong={{
      1: "Ko'p qadamli amallar — bu agent ishi. Oddiy AI faqat bitta javob beradi.",
      2: "Oddiy AI o'zi bazaga yozmaydi — u faqat matn qaytaradi. Yozish toollar orqali agent (yoki kod) ishi.",
      3: "Oddiy AI mustaqil ishlatiladi — agent shart emas. U bitta javob qaytaradi.",
      default: "Oddiy AI bitta javob (matn) qaytaradi."
    }} />
);

// ===== SCREEN 5 — AGENT ENGINE =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? ENGINE.length : 0);
  const [sc, setSc] = useState(0);
  const done = step >= ENGINE.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setStep(n => n + 1); setSc(n => n + 1); } };
  const NOTES = ["Idrok: agent tizimdan holatni o'qiydi (DB, xabar).", "Qaror: AI keyingi qadamni tanlaydi (qaysi tool?).", "Amal: tool chaqiriladi — tizimga ta'sir o'tadi."];
  return (
    <Stage eyebrow="Ichki dvigatel" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Dvigatelni ko'ring (${step}/${ENGINE.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent qutining ichida <span className="italic" style={{ color: T.accent }}>dvigatel</span>: idrok → qaror → amal.</h2></div>
        <Mentor>Modul 8'da bu siklni qurgansiz — eslatib o'tamiz: agentni «aqlli» qiladigan ichki dvigatel. U maqsadga yetguncha aylanadi. Tugmani bosib bosqichlarni yoqing.</Mentor>
        <div className="fade-up"><div className="flow-row" style={{ justifyContent: 'center' }}>
          {ENGINE.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span className="fl-track">{step === i + 1 - 1 && step <= i ? null : null}</span>}
              <div className={`fl-node ${step > i ? 'done' : ''}`}><span className="fl-node-ico">{p.ico}</span><span className="fl-node-lbl">{p.label}</span></div>
            </React.Fragment>
          ))}
          <span className="archloop" style={{ marginLeft: 6 }}>↺ qayta</span>
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Tugadi' : step === 0 ? '▶ Dvigatelni yoqish' : 'Keyingi qadam →'}</button>
            {step > 0 && <div className="sk-info fade-step" key={step}><p className="body" style={{ margin: 0, color: T.ink }}>{NOTES[step - 1]}</p></div>}
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">🔁 Nega sikl?</p><p className="body" style={{ margin: 0, color: T.ink }}>Har amaldan keyin agent natijani ko'radi va keyingi qadamni tanlaydi — maqsad bajarilguncha. Mana shu sikl agentni avtonom qiladi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu dvigatel — agent komponentining ichida. Tashqaridan siz unga maqsad va toollar berasiz, qolganini o'zi qiladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — TOOLS NIMA =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ulanish · toollar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Tool nima?"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent tizimga <span className="italic" style={{ color: T.accent }}>toollar</span> orqali ulanadi.</h2></div>
        <Mentor>Agentning «qo'llari» — bu toollar. Va eng muhimi: <b style={{ color: T.ink }}>toollar — bu sizning tizimingizning qismlari</b>: DB so'rovi, API chaqiruvi, bot funksiyasi. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🛠️ Tool nima?</p><p className="body" style={{ margin: 0, color: T.ink }}>Tool — agent chaqira oladigan funksiya. U orqali agent tizimning boshqa komponentlariga ta'sir qiladi.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Toollar tizimga qanday ulanadi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {TOOLS.map(t => <div key={t.id} className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{t.ico} <b>{t.label} tool:</b> {t.desc}</p></div>)}
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Demak agent yangi tizim emas — u mavjud komponentlaringizni (DB/API/bot) tool sifatida ishlatadi. U — aqlli muvofiqlashtiruvchi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — AGENT-IN-SYSTEM (map) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(TOOLS.map(t => t.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= TOOLS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = TOOLS.find(t => t.id === active);
  return (
    <Stage eyebrow="Arxitektura · agent o'rni" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 toolni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent — markazda, <span className="italic" style={{ color: T.accent }}>qo'llari</span> tizimning qismlariga cho'ziladi.</h2></div>
        <Mentor>Mana agentning arxitekturadagi o'rni: u backend ichida turadi va har bir tool orqali tizimning bir qismiga ulanadi. Har toolni bosib, agent u bilan nima qilishini ko'ring.</Mentor>
        <div className="fade-up"><div className="clients-map">
          <div className="cm-core"><div className="cm-core-node" style={{ background: T.accent }}>🤖<span>Agent</span></div></div>
          <span className="cm-arrow">→</span>
          <div className="cm-clients">
            {TOOLS.map(t => <div key={t.id} className={`cm-client ${seen.has(t.id) ? 'on' : ''} ${active === t.id ? 'sel' : ''}`}><span>{t.ico}</span><span className="cm-lbl">{t.label}</span></div>)}
          </div>
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {TOOLS.map(t => <button key={t.id} className="gchip" onClick={() => tap(t.id)} style={seen.has(t.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(t.id) ? '✓ ' : ''}{t.ico} {t.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h">{cur.ico} {cur.label} tool</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Toolni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agent — bitta komponent, lekin uchta tool orqali butun tizim bilan ishlaydi. Qancha tool bersangiz — shuncha ish qila oladi (ehtiyot bo'lib).</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="AI-agent tizimga qanday ta'sir qiladi (amal qiladi)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI-agent tizimga qanday <span className="italic" style={{ color: T.accent }}>ta'sir</span> qiladi?</h2></>}
    options={["Toollar orqali — sizning DB so'rovingiz, API chaqiruvingiz, bot funksiyangizni ishlatadi", "Sehr bilan, kodsiz", "Faqat matn yozib — boshqa hech narsa qilmaydi", "To'g'ridan-to'g'ri ekranni o'zgartirib"]} correctIdx={0}
    explainCorrect="To'g'ri! Agentning amallari — toollar orqali. Toollar esa sizning tizimingizning qismlari: DB so'rovi, API chaqiruvi, bot xabari. Agent ularni qaysi tartibda ishlatishni o'zi tanlaydi."
    explainWrong={{
      1: "Sehr emas — toollar siz yozgan oddiy funksiyalar. Agent faqat qaysi birini ishlatishni tanlaydi.",
      2: "Faqat matn — bu oddiy AI. Agent toollar orqali real amal qiladi.",
      3: "Agent ekranni o'zi chizmaydi — u toollar (DB/API/bot) orqali tizimga ta'sir qiladi.",
      default: "Agent toollar orqali (DB/API/bot) amal qiladi."
    }} />
);

// ===== SCREEN 9 — QACHON AGENT =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qaror · qachon agent" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Qoidani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qachon agent, qachon <span className="italic" style={{ color: T.accent }}>oddiy AI</span>?</h2></div>
        <Mentor>Agent kuchli, lekin har joyga kerak emas. Oddiy ish uchun oddiy AI yetadi — agent ortiqcha murakkablik. Tugmani bosib, qoidani ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="sk-info" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h" style={{ color: T.ink2 }}>💬 Oddiy AI yetadi — qachon?</p><p className="body" style={{ margin: 0, color: T.ink }}>Bir martalik, aniq ish: tarjima, matn yozish, tavsiya, savolga javob. Tizim bilan ishlash shart emas.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Agent qachon kerak?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step"><span className="agent-lbl">🤖 AGENT — QACHON</span><p className="agent-msg">Ko'p qadamli, maqsadga yo'naltirilgan, tizim bilan ishlaydigan vazifa: buyurtmani to'liq hal qil, ma'lumot yig'ib qaror qil, o'zi bir necha amal bajar.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: <b>bir qadam → oddiy AI; ko'p qadamli maqsad → agent.</b> Keraksiz joyda agent ishlatish — over-engineering.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TASK DECIDER =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(storedAnswer ? TASKS.length : 0);
  const [wrong, setWrong] = useState(null);
  const [sc, setSc] = useState(0);
  const done = idx >= TASKS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = done ? null : TASKS[idx];
  const choose = (ans) => {
    if (done) return;
    if (ans === cur.ans) { setWrong(null); setIdx(n => n + 1); setSc(n => n + 1); }
    else { setWrong(ans); setTimeout(() => setWrong(w => (w === ans ? null : w)), 450); }
  };
  return (
    <Stage eyebrow="Mashq · qaysi birini" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tanlang (${idx}/${TASKS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har vazifaga: <span className="italic" style={{ color: T.accent }}>oddiy AI</span> yoki <span className="italic" style={{ color: T.accent }}>agent</span>?</h2></div>
        <Mentor>Endi o'zingiz qaror qiling. Har vazifani o'qing: u bir martalik ishmi (oddiy AI) yoki ko'p qadamli, tizim bilan ishlaydigan maqsadmi (agent)?</Mentor>
        <Zoomable><div className="split">
          <Col>
            {cur
              ? <div className="frame" key={cur.id} style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🧩 Vazifa {idx + 1}/{TASKS.length}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.task}</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hammasi to'g'ri! Endi vazifaga qarab to'g'ri vositani tanlay olasiz — bu arxitektorning muhim qarori.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qaysi birini ishlatasiz?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className={`pick-row ${wrong === 'ai' ? 'shake' : ''}`} disabled={done} onClick={() => choose('ai')}><span style={{ marginRight: 6 }}>💬</span><span style={{ flex: 1 }}>Oddiy AI <span style={{ color: T.ink3, fontWeight: 500 }}>· bir martalik</span></span><span className="pick-plus">+</span></button>
              <button className={`pick-row ${wrong === 'agent' ? 'shake' : ''}`} disabled={done} onClick={() => choose('agent')}><span style={{ marginRight: 6 }}>🤖</span><span style={{ flex: 1 }}>Agent <span style={{ color: T.ink3, fontWeight: 500 }}>· ko'p qadamli maqsad</span></span><span className="pick-plus">+</span></button>
            </div>
            {wrong && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qaytadan o'ylang: bu bir martalik ishmi yoki ko'p qadamli maqsadmi?</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (global) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Bitta gapni boshqa tilga o'girish kerak. Oddiy AI yoki agent?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bitta gapni boshqa tilga <span className="italic" style={{ color: T.accent }}>o'girish</span> kerak. Oddiy AI yoki agent?</h2></>}
    options={["Oddiy AI — bir martalik, aniq ish; agent ortiqcha bo'ladi", "Agent — har doim agent yaxshiroq", "Ikkalasini birga ishlatish", "Hech qaysi — bu AI ishi emas"]} correctIdx={0}
    explainCorrect="To'g'ri! Tarjima — bitta qadamli, aniq vazifa. Oddiy AI chaqiruvi yetarli. Bunga agent qurish — keraksiz murakkablik (over-engineering). To'g'ri vositani tanlash muhim."
    explainWrong={{
      1: "Agent har doim yaxshi emas — bir qadamli ish uchun u ortiqcha. Tarjimaga oddiy AI yetadi.",
      2: "Ikkalasini birga — keraksiz. Sodda ishni sodda vosita bilan qiling.",
      3: "Bu aniq AI ishi — tarjima. Faqat oddiy AI yetarli, agent shart emas.",
      default: "Bir martalik ishga oddiy AI yetadi."
    }} />
);

// ===== SCREEN 12 — CASE: smart order agent =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [shown, setShown] = useState(storedAnswer ? CASE_STEPS.length : 0);
  const [sc, setSc] = useState(0);
  const done = shown >= CASE_STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setShown(n => n + 1); setSc(n => n + 1); } };
  const usedTools = CASE_STEPS.slice(0, shown).filter(s => s.ico === '🛠️').length;
  return (
    <Stage eyebrow="Hayotiy · do'kon agenti" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Agentni kuzating (${shown}/${CASE_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mini-do'kon agenti — maqsaddan <span className="italic" style={{ color: T.accent }}>natijagacha</span> o'zi.</h2></div>
        <Mentor>Mana agent arxitekturada ish boshida: bitta maqsad oladi va toollar orqali tizimni boshqarib, ishni bajaradi. Tugmani bosib, qadamlarni kuzating.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {CASE_STEPS.slice(0, shown).map((s, i) => (
                <div key={i} className={`agent-step fade-step ${s.ico === '✅' ? 'done' : ''}`}>
                  <span className="as-phase">{s.ico} {s.ico === '🎯' ? 'maqsad' : s.ico === '👁️' ? 'idrok' : s.ico === '🧠' ? 'qaror' : s.ico === '🛠️' ? 'amal (tool)' : 'tayyor'}</span>
                  <span className="as-txt">{s.txt}</span>
                </div>
              ))}
              {shown === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — agent ishga tushadi.</p></div>}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Maqsadga yetildi' : shown === 0 ? '▶ Agentga maqsad berish' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">🛠️ Ishlatilgan toollar</p><p className="body" style={{ margin: 0, color: T.ink }}>{usedTools === 0 ? 'hali yo\'q' : `${usedTools} ta tool chaqirildi (saveOrder, notifyCourier) — har biri tizimga ta'sir qildi.`}</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz faqat maqsad berdingiz. Agent idrok→qaror→amal sikli bilan toollarni ishlatib, ishni bajardi. Mana agentning arxitekturadagi kuchi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — XAVF + O'RNI (ko'prik) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ehtiyot · agent kuchi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Nega ehtiyot?"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent <span className="italic" style={{ color: T.accent }}>amal qiladi</span> — demak ehtiyot kerak.</h2></div>
        <Mentor>Oddiy AI faqat gapirgani uchun xavfsiz. Agent esa real amal qiladi (DB'ga yozadi, pul, xabar) — shuning uchun unga chegara qo'yiladi. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🤖 Agent backend ichida</p><p className="body" style={{ margin: 0, color: T.ink }}>Arxitekturada agent — backend komponenti. U faqat siz bergan toollarga ega; bermagan ishingizni qila olmaydi.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Tushundim' : "Qanday chegara?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🧰 <b>Cheklangan toollar:</b> faqat kerakli toollarni bering (o'chirish/to'lovni — yo'q).</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>✋ <b>Tasdiq:</b> xavfli amaldan oldin odam tasdig'ini so'rasin.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="agent-card fade-step"><span className="agent-lbl">📍 KEYINGI DARS</span><p className="agent-msg">Agent va AI xulqini qanday <b>aniq shakllantirish</b> mumkin? Buni <b>Claude Skills</b> bilan qilamiz — keyingi darsda.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (arxitektura o'rni) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="AI-agent arxitekturada qayerda yashaydi va nima bilan amal qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI-agent arxitekturada <span className="italic" style={{ color: T.accent }}>qayerda</span> yashaydi va nima bilan amal qiladi?</h2></>}
    options={["Backend ichidagi komponent — toollar (DB/API/bot) orqali tizimga ta'sir qiladi", "Frontend'da — chunki mijoz uni ko'radi", "Bazaning ichida — chunki ma'lumot bilan ishlaydi", "Tizimdan tashqarida — mustaqil dastur"]} correctIdx={0}
    explainCorrect="To'g'ri! Agent — backend ichidagi aqlli komponent. U mustaqil dastur emas; tizimning bir qismi va faqat siz bergan toollar (DB/API/bot) orqali boshqa komponentlarga ta'sir qiladi."
    explainWrong={{
      1: "Agent mijozga ko'rinmaydi — u sahna ortida (backend) ishlaydi. Frontend faqat natijani ko'rsatadi.",
      2: "Agent baza ichida emas — u backendda turadi va bazani tool sifatida ishlatadi.",
      3: "Agent tizimdan tashqarida emas — u tizimning komponenti, toollar orqali ulangan.",
      default: "Agent — backend komponenti, toollar orqali amal qiladi."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: agent oqimi =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Agent oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: agent ish oqimini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Agent maqsadni qanday bajaradi? Eslang: maqsad → tizimdan o'qiydi (idrok) → AI tool tanlaydi (qaror) → tool chaqiriladi (amal) → natijani ko'rib qaytadi. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">agent oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Maqsad → Idrok → Qaror → Amal → Natijani ko'r</b> (maqsadga yetguncha qayta aylanadi). Mana agentning ishlash dvigateli.</p></div>}
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
    "Oddiy AI — funksiya (bir javob); agent — komponent (maqsad sari sikl)",
    "Agentning dvigateli: idrok → qaror → amal (maqsadga yetguncha)",
    "Toollar agentni tizimga ulaydi: DB so'rovi, API, bot funksiyasi",
    "Arxitekturada agent — backend komponenti, toollar orqali amal qiladi",
    "Bir qadamli ish → oddiy AI; ko'p qadamli maqsad → agent"
  ];
  const HOMEWORK = [
    { b: "Toping", t: "— loyihangizda qaysi vazifa ko'p qadamli? O'sha — agentga nomzod." },
    { b: 'Toollar', t: "— o'sha agent qaysi toollarni ishlatadi: DB? API? bot?" },
    { b: "Qaror", t: "— qaysi ishlar oddiy AI bilan kifoya? Agent shart emas joylarni belgilang." }
  ];
  const GLOSSARY = [
    { b: 'AI-agent', t: '— maqsad sari amal qiladigan komponent' },
    { b: 'oddiy AI', t: '— bir martalik savol→javob funksiyasi' },
    { b: 'tool (asbob)', t: '— agent chaqiradigan funksiya' },
    { b: 'idrok', t: '— tizimdan holatni o\'qish' },
    { b: 'qaror', t: '— qaysi toolni ishlatish tanlovi' },
    { b: 'amal', t: '— toolni chaqirib ish bajarish' },
    { b: 'sikl', t: '— maqsadga yetguncha takror' },
    { b: 'chegara', t: '— agentga ruxsat berilgan toollar' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Agentning o'rnini tushundingiz</span><h2 className="title h-title fade-up d1">Agent — tizimning <span className="italic" style={{ color: T.accent }}>aqlli komponenti</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Oddiy AI ↔ agent farqini, agent toollar orqali tizimga ulanishini va qachon ishlatishni o'rgandingiz." : "Yaxshi harakat! Oddiy AI vs agent va toollar (tizimga ulanish) bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — Claude Skills: AI va agent xulqini aniq shakllantirish.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function AgentArchitectureLesson({ lang: langProp, onFinished }) {
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

        /* AGENT STEP */
        .agent-step { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 10px; padding: 10px 13px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); border-left: 3px solid ${T.blue}; }
        .agent-step.done { border-left-color: ${T.success}; background: ${T.successSoft}; }
        .as-phase { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.blue}; letter-spacing: 0.04em; }
        .agent-step.done .as-phase { color: ${T.success}; }
        .as-txt { font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .loop-badge { display: inline-flex; align-items: center; gap: 4px; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: ${T.accent}; background: ${T.accentSoft}; padding: 3px 9px; border-radius: 99px; }

        /* FLOW ROW (engine cycle) */
        .flow-row { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; justify-content: center; padding: 8px 0; }
        .fl-node { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 12px; padding: 10px 14px; min-width: 80px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.3s; opacity: 0.5; }
        .fl-node.done { opacity: 1; background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .fl-node-ico { font-size: 20px; line-height: 1; }
        .fl-node-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink}; text-align: center; }
        .fl-track { width: 22px; height: 3px; background: rgba(167,166,162,0.4); border-radius: 2px; }
        .archloop { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.accent}; }

        /* CLIENTS / AGENT MAP */
        .clients-map { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; padding: 6px 0; }
        .cm-clients { display: flex; flex-direction: column; gap: 7px; }
        .cm-client { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 10px; padding: 8px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); opacity: 0.5; transition: all 0.25s; min-width: 120px; }
        .cm-client.on { opacity: 1; box-shadow: inset 0 0 0 1.5px ${T.success}, 0 5px 14px -6px rgba(31,122,77,0.26); }
        .cm-client.sel { opacity: 1; box-shadow: inset 0 0 0 2px ${T.accent}; }
        .cm-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; }
        .cm-arrow { color: ${T.ink3}; font-weight: 700; font-size: 18px; }
        .cm-core { display: flex; flex-direction: column; gap: 7px; }
        .cm-core-node { display: flex; align-items: center; gap: 8px; background: ${T.ink}; color: #fff; border-radius: 10px; padding: 10px 16px; font-size: 19px; }
        .cm-core-node span { font-family: 'Manrope'; font-weight: 700; font-size: 12px; }

        /* CYC (final) */
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
