import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 8 (P5, YAKUNIY) — AI-AGENT: IDROK → QAROR → AMAL — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi AI-bot (reaktiv, faqat gapiradi) ↔ AI-agent (proaktiv, maqsad sari AMAL qiladi) farqini tushunadi.
//         Agent sikli: idrok → qaror (qaysi asbob?) → amal (toolni chaqir) → natijani ko'r → maqsadga yetguncha loop.
// Tushunchalar: tools (asboblar = agentning qo'li), maqsadga yo'naltirish, guardrails (xavfsizlik).
// Davomi: P2 (AI-bot — faqat matn), P4 (qo'lda idrok→qaror→amal sikli). Endi siklni BOTNING O'ZIGA beramiz.
// Falsafa YAKUNI: SIZ — DIREKTOR, AI — ISHCHI. Maqsad + asboblar + chegaralar berasiz; agent o'zi bajaradi.
// s16 = MODUL CAPSTONE: butun yo'l (rule-bot → AI-bot → xotira → mahsulot → fidbek → agent).
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

const LESSON_META = { lessonId: 'bot-ai-agent-v1', lessonTitle: { uz: 'AI-agent: idrok → qaror → amal', ru: 'AI-агент' } };
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

// ===== AI-BOT vs AI-AGENT (s2) =====
const VS_ROWS = [
  { id: 'mode', k: 'Qanday ishlaydi?', bot: 'reaktiv — javob yozadi', agent: 'proaktiv — maqsad sari amal qiladi' },
  { id: 'steps', k: 'Necha qadam?', bot: 'bir martalik (xabar → javob)', agent: "ko'p qadam — maqsadga yetguncha sikl" },
  { id: 'hands', k: 'Nimasi bor?', bot: "faqat og'iz (gapiradi)", agent: "og'iz + qo'l (asboblar bilan amal)" },
  { id: 'input', k: 'Siz nima berasiz?', bot: 'har javob uchun ko\'rsatma', agent: "maqsad — qadamlarni o'zi topadi" }
];

// ===== AGENT SIKLI (s3) =====
const PHASES = [
  { id: 'perceive', ico: '👁️', label: 'Idrok' },
  { id: 'decide', ico: '🧠', label: 'Qaror' },
  { id: 'act', ico: '🤖', label: 'Amal' }
];
const CYCLE_STEPS = [
  { phase: 'perceive', txt: "Mijoz: «2 katta pepperoni». Agent xabarni va bazadagi holatni o'qiydi." },
  { phase: 'decide', txt: "Maqsad — buyurtmani qabul qil. Avval menyuda bormi? → checkMenu tanlanadi." },
  { phase: 'act', txt: "checkMenu() chaqirildi → «katta pepperoni bor» natijasi qaytdi." },
  { phase: 'perceive', txt: "Natija keldi: pizza mavjud. Agent holatni qayta baholaydi." },
  { phase: 'decide', txt: "Endi buyurtmani saqlash kerak → saveOrder tanlanadi." },
  { phase: 'act', txt: "saveOrder() chaqirildi → buyurtma bazaga yozildi ✅." }
];

// ===== TOOLS (s5) =====
const TOOLS = [
  { id: 'menu', ico: '📋', tok: 'checkMenu()', desc: "Menyuda mahsulot bor-yo'qligini tekshiradi." },
  { id: 'save', ico: '💾', tok: 'saveOrder()', desc: "Buyurtmani PostgreSQL bazasiga yozadi." },
  { id: 'kitchen', ico: '🍳', tok: 'sendToKitchen()', desc: "Buyurtmani oshxona tizimiga uzatadi." },
  { id: 'notify', ico: '📞', tok: 'notifyCourier()', desc: "Kuryerga xabar yuboradi." }
];

// ===== TOOL PICK (s6) =====
const SITUATIONS = [
  { id: 'q1', sit: "«Glutensiz pizza bormi?» — avval bilish kerak", tool: 'menu' },
  { id: 'q2', sit: "Buyurtma to'liq aniqlandi — endi saqlash kerak", tool: 'save' },
  { id: 'q3', sit: "Buyurtma saqlandi — oshxonaga uzatish kerak", tool: 'kitchen' }
];

// ===== GUARDRAILS (s13) =====
const GUARDS = [
  { id: 'limit', ico: '🧰', label: 'Cheklangan asboblar', desc: "Agentga faqat kerakli asboblarni bering. «Pul qaytarish» yoki «o'chirish» kabilarni bermang — ishlata olmaydi." },
  { id: 'confirm', ico: '✋', label: "Tasdiq so'rash", desc: "Xavfli amaldan (to'lov, bekor qilish) oldin mijoz yoki admin tasdig'ini so'rasin." },
  { id: 'human', ico: '🧑‍💼', label: 'Odam nazorati', desc: "Murakkab yoki shubhali holatni odamga uzatsin (human-in-loop) — hammasini o'zi hal qilmasin." }
];

// ===== MODUL YO'LI (s16 capstone) =====
const MODULE_ARC = [
  { n: 'Asoslar', t: "Bot asoslari: trigger → action, Telegram API va tugmalar" },
  { n: 'Xotira', t: "Xotira: suhbat holati + PostgreSQL bilan eslab qolish" },
  { n: 'AI', t: "AI: prompt bilan qurish va botga AI miya ulash" },
  { n: 'Mahsulot', t: "To'liq mahsulot: bot + DB + AI + hosting (24/7)" },
  { n: 'Iteratsiya', t: "Iteratsiya: foydalanuvchi fikri bilan yaxshilash" },
  { n: 'AI-agent', t: "AI-agent: idrok → qaror → amal (avtonom)" }
];

// ===== AGENT SIKLI (final s15) =====
const FLOW = [
  { id: 'goal', ico: '🎯', label: 'Maqsad', d: "agentga vazifa beriladi." },
  { id: 'perceive', ico: '👁️', label: 'Idrok', d: "holatni o'qiydi (xabar, DB)." },
  { id: 'decide', ico: '🧠', label: 'Qaror', d: "AI qaysi asbobni tanlaydi." },
  { id: 'act', ico: '🤖', label: 'Amal', d: "asbobni chaqiradi." },
  { id: 'loop', ico: '🔁', label: "Natijani ko'r", d: "tugamasa — qayta idrok." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['decide', 'goal', 'loop', 'perceive', 'act'];

// ===== SCREEN 0 — HOOK: gapirdi vs qildi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Bot buzilgan — kodda xato bor" },
    { id: 'b', label: "AI-bot faqat gapiradi — amal qilish uchun unga maqsad va «qo'l» (asboblar) kerak" },
    { id: 'c', label: "Oshxona ishlamayapti" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>AI-bot «oshxonaga yubordim» dedi. Lekin oshxona <span className="italic" style={{ color: T.accent }}>bo'sh</span>. Nima yetishmaydi?</h1>
        <Mentor>O'tgan darsni eslang: AI-bot chiroyli javob yozadi, lekin amal qilmaydi. Tugmani bosing — bir vaziyatda AI-bot va AI-agent qanday farq qilishini ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <TgChat title="AI-bot (faqat gapiradi)" sub="bot · reaktiv" input={false} minH={110}>
              <Bubble from="user">Buyurtmamni oshxonaga yubor</Bubble>
              {tried && <Bubble from="bot">Albatta, yubordim ✅</Bubble>}
            </TgChat>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🍳 Oshxona: <b>hech narsa kelmadi</b> — faqat matn yozildi.</p></div>}
            <TgChat title="AI-agent (amal qiladi)" sub="bot · proaktiv" input={false} minH={110}>
              <Bubble from="user">Buyurtmamni oshxonaga yubor</Bubble>
              {tried && <Bubble from="bot">sendToKitchen() ✅ Oshxona buyurtmani oldi, 30 daqiqada tayyor 🍳</Bubble>}
            </TgChat>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Solishtirildi' : "▶ Ikki botni solishtirish"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>AI-botda nima yetishmaydi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! AI-bot — og'iz (gapiradi). <b>AI-agent</b> — og'iz + qo'l (asboblar bilan AMAL qiladi). Bugun botingizga maqsad, asboblar va sikl beramiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "AI-bot → AI-agent: gapirishdan amalga", tag: 'farq' },
    { text: "Sikl: idrok → qaror → amal (loop)", tag: 'sikl' },
    { text: "Asboblar (tools) — agentning qo'li", tag: 'qo\'l' },
    { text: "Maqsad + chegaralar bilan agent qurish", tag: 'qurish' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — o'zi ish bajaradigan agent</p>
      <TgChat input={false} minH={0} sub="agent · proaktiv 🟢">
        <Bubble from="user">2 katta pepperoni, Chilonzor 5</Bubble>
        <Bubble from="bot">Tekshirdim ✓ saqladim ✓ oshxonaga yubordim ✓ — 30 daqiqada yetkazamiz 🍕</Bubble>
      </TgChat>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Siz bitta maqsad berdingiz — agent o'zi qadamlarni topib, hammasini bajardi. Mana shuni quramiz.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Bot endi gapiribgina qolmay — <span className="italic" style={{ color: T.accent }}>amal qiladi</span>.</h2></div>
        <Mentor>O'tgan darsda idrok → qaror → amal siklini <b style={{ color: T.ink }}>siz qo'lda</b> bajardingiz (tingla → tuzat → qayta tingla). Bugun aynan shu siklni <b style={{ color: T.ink }}>botning o'ziga</b> beramiz — u maqsad sari avtonom (mustaqil) ishlaydi. Bu — modulning cho'qqisi.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — AI-BOT vs AI-AGENT =====
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
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>AI-bot</span> va <span className="italic" style={{ color: T.accent }}>AI-agent</span> — eng muhim farq.</h2></div>
        <Mentor>Bu darsning yuragi shu. AI-bot javob yozadi va to'xtaydi. AI-agent maqsadga qarab qadam-baqadam <b style={{ color: T.ink }}>amal qiladi</b>. Har jihatni bosib, farqni ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {VS_ROWS.map(r => <button key={r.id} className="gchip" onClick={() => tap(r.id)} style={seen.has(r.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(r.id) ? '✓ ' : ''}{r.k}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir jumla: <b>AI-bot gapiradi, AI-agent qiladi.</b> Bot — bir martalik javob; agent — maqsadga yetguncha amallar sikli.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="fade-step" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p className="flow-label">{cur.k}</p>
                  <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h" style={{ color: T.ink2 }}>💬 AI-bot</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.bot}</p></div>
                  <div className="agent-card"><span className="agent-lbl">🤖 AI-agent</span><p className="agent-msg">{cur.agent}</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Jihatni bosing ←</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — AGENT SIKLI (CycleTrack) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? CYCLE_STEPS.length : 0);
  const [sc, setSc] = useState(0);
  const done = step >= CYCLE_STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const curPhase = step === 0 ? null : CYCLE_STEPS[step - 1].phase;
  const advance = () => { if (!done) { setStep(n => n + 1); setSc(n => n + 1); } };
  return (
    <Stage eyebrow="Tushuncha · sikl" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni yuriting (${step}/${CYCLE_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agentning yuragi: <span className="italic" style={{ color: T.accent }}>idrok → qaror → amal</span>, va u aylanadi.</h2></div>
        <Mentor>Agent bir martada to'xtamaydi — u <b style={{ color: T.ink }}>aylanadi</b>: ko'radi, qaror qiladi, amal qiladi, natijani ko'radi va yana. Tugmani bosib, bitta buyurtma uchun sikl ikki marta aylanishini kuzating.</Mentor>
        <div className="fade-up"><div className="archflow" style={{ justifyContent: 'center' }}>
          {PHASES.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span className="archflow-arrow">→</span>}
              <div className={`archnode ${curPhase === p.id ? 'cur' : ''}`}><span className="archnode-ico">{p.ico}</span><span className="archnode-lbl">{p.label}</span></div>
            </React.Fragment>
          ))}
          <span className="archloop">↺ qayta</span>
        </div></div>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Sikl aylandi' : step === 0 ? '▶ Siklni boshlash' : 'Keyingi qadam →'}</button>
            {step > 0 && <div className="sk-info fade-step" key={step}><p className="note-h">{PHASES.find(p => p.id === curPhase).ico} {PHASES.find(p => p.id === curPhase).label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{CYCLE_STEPS[step - 1].txt}</p></div>}
            {step === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — sikl boshlanadi.</p></div>}
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">🔁 Nega aylanadi?</p><p className="body" style={{ margin: 0, color: T.ink }}>Har amaldan keyin natija paydo bo'ladi — agent uni <b>ko'radi</b> (idrok) va maqsadga yetmagan bo'lsa, <b>keyingi qadamni</b> tanlaydi. Maqsad bajarilguncha davom etadi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingiz: bitta «2 pepperoni» buyurtmasi uchun agent ikki marta aylandi (tekshir → saqla). Mana avtonomlik.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (bot vs agent, global) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Bot mijoz xabarini o'qib, menyuni tekshirdi, buyurtmani bazaga yozdi va oshxonaga yubordi. Bu nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot xabarni o'qib, menyuni tekshirdi, bazaga yozdi va oshxonaga <span className="italic" style={{ color: T.accent }}>yubordi</span>. Bu nima?</h2></>}
    options={["AI-agent — faqat gapirmadi, maqsad sari real amallar (asboblar) bajardi", "AI-bot — har bot aslida shunday ishlaydi", "Rule-bot — tayyor javoblar to'plami", "Oddiy kalkulyator dasturi"]} correctIdx={0}
    explainCorrect="To'g'ri! Bu agent: u matn yozish bilan cheklanmadi, balki maqsadga (buyurtmani qabul qil) erishish uchun ketma-ket amallar bajardi — asboblarni chaqirdi. AI-bot esa faqat javob matnini yozardi."
    explainWrong={{
      1: "AI-bot faqat matn yozadi — amal qilmaydi. Bu bot esa real ish bajardi — demak agent.",
      2: "Rule-bot tayyor javoblar beradi, amal qilmaydi. Bu agent — ketma-ket amallar bajardi.",
      3: "Kalkulyator hisoblaydi, lekin maqsad sari qaror chiqarib amal qilmaydi. Bu — AI-agent.",
      default: "Maqsad sari amallar bajargan — bu AI-agent."
    }} />
);

// ===== SCREEN 5 — TOOLS (asboblar) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(TOOLS.map(t => t.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= TOOLS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = TOOLS.find(t => t.id === active);
  return (
    <Stage eyebrow="Asboblar · qo'l" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 asbobni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Asboblar (tools) — agentning <span className="italic" style={{ color: T.accent }}>qo'li</span>.</h2></div>
        <Mentor>Agent amalni «asbob» orqali qiladi — bu siz yozgan funksiyalar. AI o'zi gapira oladi, lekin <b style={{ color: T.ink }}>ish qilish uchun asboblar</b> kerak. Har asbobni bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {TOOLS.map(t => <button key={t.id} className="gchip" onClick={() => tap(t.id)} style={seen.has(t.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(t.id) ? '✓ ' : ''}{t.ico} <span className="mono">{t.tok}</span></button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Asboblar — agentga bergan <b>qo'l</b>laringiz. Qancha asbob bersangiz — shuncha ish qila oladi (lekin ehtiyot bo'ling — keyin ko'ramiz).</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span><span className="mono" style={{ color: T.accent, fontSize: 13 }}>{cur.tok}</span></p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Asbobni bosing ←</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — TOOL PICK (qaror) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(storedAnswer ? SITUATIONS.length : 0);
  const [wrong, setWrong] = useState(null);
  const [sc, setSc] = useState(0);
  const done = idx >= SITUATIONS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = done ? null : SITUATIONS[idx];
  const choose = (toolId) => {
    if (done) return;
    if (toolId === cur.tool) { setWrong(null); setIdx(n => n + 1); setSc(n => n + 1); }
    else { setWrong(toolId); setTimeout(() => setWrong(w => (w === toolId ? null : w)), 450); }
  };
  return (
    <Stage eyebrow="Qaror · tanlash" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Asbobni tanlang (${idx}/${SITUATIONS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Qaror» qadami: vaziyatga qarab <span className="italic" style={{ color: T.accent }}>to'g'ri asbobni</span> tanlang.</h2></div>
        <Mentor>Bu — agentning miyasi qiladigan ish. Haqiqiy agentda buni AI o'zi qiladi; hozir siz uning o'rnida sinab ko'ring: har vaziyatga mos asbobni tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            {cur
              ? <div className="frame" key={cur.id} style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🎯 Vaziyat {idx + 1}/{SITUATIONS.length}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.sit}</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hammasi to'g'ri! Har vaziyatga mos asbobni tanladingiz — aynan shu «qaror» qadami agentni aqlli qiladi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qaysi asbobni chaqirasiz?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {TOOLS.map(t => (
                <button key={t.id} className={`pick-row ${wrong === t.id ? 'shake' : ''}`} disabled={done} onClick={() => choose(t.id)}>
                  <span style={{ marginRight: 4 }}>{t.ico}</span><span className="mono" style={{ flex: 1 }}>{t.tok}</span><span className="pick-plus">+</span>
                </button>
              ))}
            </div>
            {wrong && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu vaziyatga mos emas — vaziyatni qayta o'qing va boshqa asbobni tanlang.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — MAQSADGA YO'NALTIRISH =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · maqsad" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Farqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agentga qadam emas — <span className="italic" style={{ color: T.accent }}>maqsad</span> berasiz.</h2></div>
        <Mentor>Bu — eng katta o'zgarish. AI-botda har javobni siz yozasiz. Agentga esa <b style={{ color: T.ink }}>maqsad</b> berasiz, qadamlarni u o'zi topadi. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}>
              <p className="note-h" style={{ color: T.ink2 }}>💬 AI-bot — siz qadam yozasiz</p>
              <p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12 }}>«Salom» kelsa → «Salom!» yoz. «menyu» kelsa → menyuni yubor…</p>
              <p className="body" style={{ margin: '8px 0 0', color: T.ink }}>Har holatni oldindan yozish kerak — kutilmaganini uddalay olmaydi.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Agentga-chi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step" style={{ borderLeftColor: T.success }}>
                  <span className="agent-lbl" style={{ color: T.success }}>🎯 AI-AGENT — SIZ MAQSAD BERASIZ</span>
                  <p className="agent-msg" style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, marginBottom: 8 }}>«Maqsad: mijoz buyurtmasini to'liq qabul qilib, oshxonaga yubor.»</p>
                  <p className="agent-msg">→ Agent o'zi qadamlarni topadi: tekshir, so'ra, saqla, yubor. Kutilmagan savolni ham uddalaydi.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz — direktor: maqsadni aytasiz. Agent — ishchi: yo'lini o'zi tanlaydi. Modulning butun falsafasi shu.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 (qanday amal qiladi, global) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="AI-agent biror ishni qanday bajaradi (amal qiladi)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI-agent biror ishni qanday <span className="italic" style={{ color: T.accent }}>bajaradi</span>?</h2></>}
    options={["Maqsadga qarab tegishli asbobni (funksiya/tool) tanlab chaqiradi", "Faqat matn yozadi — qolganini odam bajaradi", "Hech qanday kodsiz, sehr bilan", "Har doim bitta oldindan belgilangan amalni qiladi"]} correctIdx={0}
    explainCorrect="To'g'ri! Agent amalni asboblar (siz yozgan funksiyalar) orqali qiladi. AI vaziyatni ko'rib, maqsadga mos asbobni tanlaydi va chaqiradi — masalan saveOrder(). Tanlash AI'da, bajarish — asbobda."
    explainWrong={{
      1: "Faqat matn yozish — bu AI-bot. Agent matndan tashqari real amal (asbob chaqirish) qiladi.",
      2: "Sehr emas — asboblar siz yozgan oddiy funksiyalar. AI faqat qaysi birini ishlatishni tanlaydi.",
      3: "Aksincha — agent vaziyatga qarab har xil asbobni tanlaydi. Bitta qotib qolgan amal — bu agent emas.",
      default: "Agent maqsadga mos asbobni tanlab chaqiradi."
    }} />
);

// ===== SCREEN 9 — AGENTNI PROMPT BILAN QURISH =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qurish · prompt" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "3 qismni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agentni 3 narsa bilan <span className="italic" style={{ color: T.accent }}>quramiz</span>: maqsad, asboblar, chegaralar.</h2></div>
        <Mentor>Siz direktorsiz — agentni prompt bilan ta'riflaysiz: nima qilsin (maqsad), nima bilan (asboblar), nimaga ruxsat yo'q (chegaralar). AI qolganini yozadi. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <PromptCard who="agent prompti" tone="live">Sen AvtoPizza buyurtma agentisan. MAQSAD: mijoz buyurtmasini to'liq qabul qilib, oshxonaga yubor. ASBOBLAR: checkMenu, saveOrder, sendToKitchen, notifyCourier. QOIDA: faqat menyudagini qabul qil; saqlashdan oldin mijozga tasdiqlat; to'lov/bekor qilishni o'zing qilma — adminga uzat.</PromptCard>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "3 qismni ajrating"}</button>
          </Col>
          <Col>
            {show ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🎯 <b>Maqsad:</b> buyurtmani qabul qilib oshxonaga yuborish</p></div>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🧰 <b>Asboblar:</b> checkMenu, saveOrder, sendToKitchen, notifyCourier</p></div>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🚧 <b>Chegaralar:</b> faqat menyudagini; tasdiqlat; to'lovni adminga uzat</p></div>
            </div> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Maqsad + asboblar + chegaralar — agentning butun «ish yo'riqnomasi». Chegaralar nega muhimligini keyin ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — AGENT SIKLI KODDA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { id: 'perceive', tok: 'perceive(ctx)', desc: "Idrok: mijoz xabari va bazadagi holatni o'qiydi — hozir nima bo'layapti." },
    { id: 'decide', tok: 'ai.decide(goal, tools, state)', desc: "Qaror: AI maqsad va holatga qarab qaysi asbobni ishlatishni tanlaydi." },
    { id: 'act', tok: 'runTool(action)', desc: "Amal: tanlangan asbobni chaqiradi (masalan saveOrder) va natijani oladi." },
    { id: 'loop', tok: 'while (!goalDone)', desc: "Loop: maqsad bajarilmaguncha sikl qayta-qayta aylanadi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Kod · sikl" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 qismni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent sikli kodda — AI yozadi, siz <span className="italic" style={{ color: T.accent }}>o'qiysiz</span>.</h2></div>
        <Mentor>Mana agentning yuragi — oddiy sikl. Bu kodni AI yozadi, lekin har qismni tanishingiz kerak. Pastdagi qismlarni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="agent.ts" minH={160}>
              <Kw>while</Kw>{' (!goalDone) {'}{'\n'}
              {'  '}<Kw>const</Kw>{' state = '}<At>perceive</At>{'(ctx)'}{'      '}<Cm>{'// idrok'}</Cm>{'\n'}
              {'  '}<Kw>const</Kw>{' action = '}<Kw>await</Kw>{' ai.'}<At>decide</At>{'(goal, tools, state) '}<Cm>{'// qaror'}</Cm>{'\n'}
              {'  '}<Kw>const</Kw>{' result = '}<Kw>await</Kw>{' '}<At>runTool</At>{'(action)'}<Cm>{'   // amal'}</Cm>{'\n'}
              {'  goalDone = result.done'}{'              '}<Cm>{'// natijani ko\'r'}</Cm>{'\n'}
              {'}'}
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}<span className="mono">{p.id}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent, fontSize: 12 }}>{cur.tok}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kod qismini bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sikl: idrok → qaror → amal → natijani ko'r → qayta. Maqsad bajarilganda <span className="mono">while</span> to'xtaydi. Mana agent.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (loop, global) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="AI-agent bitta amalni bajardi (buyurtmani saqladi). Endi nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Agent bitta amalni bajardi (buyurtmani <span className="italic" style={{ color: T.accent }}>saqladi</span>). Endi nima qiladi?</h2></>}
    options={["Natijani ko'radi va maqsadga yetmagan bo'lsa — yana qaror chiqaradi (sikl davom etadi)", "Darrov to'xtaydi — bitta amal har doim yetarli", "Foydalanuvchidan keyingi buyruqni kutib turadi", "Hammasini boshidan, noldan qayta boshlaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! Agentni avtonom qiladigan narsa shu: u amaldan keyin natijani ko'radi (idrok) va maqsad bajarilmagan bo'lsa keyingi qadamni tanlaydi. Saqladi → endi oshxonaga yuborish kerak → sikl davom etadi."
    explainWrong={{
      1: "Bitta amal kamdan-kam yetarli. Maqsadga yetguncha agent sikl bo'ylab davom etadi.",
      2: "Buyruq kutish — bu reaktiv AI-bot. Agent maqsad sari o'zi davom etadi, kutib turmaydi.",
      3: "Noldan boshlamaydi — u qilingan ishni hisobga olib, keyingi qadamga o'tadi.",
      default: "Natijani ko'radi va sikl davom etadi."
    }} />
);

// ===== SCREEN 12 — CASE: AvtoPizza AI-agent (avtonom) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { phase: 'Idrok', ico: '👁️', txt: "Mijoz: «2 katta pepperoni, Chilonzor 5». Agent xabarni o'qidi.", tool: null },
    { phase: 'Qaror', ico: '🧠', txt: "Avval menyuda bormi — tekshiraman.", tool: 'checkMenu()' },
    { phase: 'Amal', ico: '🤖', txt: "checkMenu() → «katta pepperoni mavjud» ✅", tool: 'checkMenu()' },
    { phase: 'Qaror', ico: '🧠', txt: "Bor ekan — buyurtmani saqlayman.", tool: 'saveOrder()' },
    { phase: 'Amal', ico: '🤖', txt: "saveOrder() → buyurtma bazaga yozildi ✅", tool: 'saveOrder()' },
    { phase: 'Qaror', ico: '🧠', txt: "Saqlandi — endi oshxonaga uzataman.", tool: 'sendToKitchen()' },
    { phase: 'Amal', ico: '🤖', txt: "sendToKitchen() → oshxona buyurtmani oldi 🍳✅", tool: 'sendToKitchen()' },
    { phase: 'Tayyor', ico: '✅', txt: "Maqsadga yetildi. Mijozga javob yuboriladi.", tool: null }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setShown(n => n + 1); setSc(n => n + 1); } };
  const calledTools = STEPS.slice(0, shown).filter(s => s.phase === 'Amal').map(s => s.tool);
  return (
    <Stage eyebrow="Hayotiy · avtonom agent" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Agentni kuzating (${shown}/${STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta maqsad — agent qolganini <span className="italic" style={{ color: T.accent }}>o'zi</span> bajaradi.</h2></div>
        <Mentor>Mijoz bitta xabar yozdi. Agent endi sikl bo'ylab o'zi yuradi: ko'radi, qaror qiladi, asbob chaqiradi — maqsadga yetguncha. Tugmani bosib, har qadamni kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">agent ichki qadamlari (sahna ortida)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.slice(0, shown).map((s, i) => (
                <div key={i} className={`agent-step fade-step ${s.phase === 'Tayyor' ? 'done' : ''}`}>
                  <span className="as-phase">{s.ico} {s.phase}</span>
                  <span className="as-txt">{s.txt}</span>
                  {s.tool && <span className="as-tool mono">{s.tool}</span>}
                </div>
              ))}
              {shown === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — agent ishga tushadi.</p></div>}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Maqsadga yetildi' : shown === 0 ? '▶ Agentni ishga tushirish' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <p className="flow-label">mijoz ko'radigan chat</p>
            <TgChat input={false} minH={90} sub="agent · proaktiv 🟢">
              <Bubble from="user">2 katta pepperoni, Chilonzor 5</Bubble>
              {done && <Bubble from="bot">2 ta katta pepperoni qabul qilindi ✅ Chilonzor 5 manziliga ~30 daqiqada yetkazamiz 🍕</Bubble>}
            </TgChat>
            <div className="sk-info"><p className="note-h">🧰 Chaqirilgan asboblar</p>{calledTools.length === 0 ? <p className="body" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>hali yo'q</p> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{calledTools.map((t, i) => <span key={i} className="tool-chip mono">{t}</span>)}</div>}</div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mijoz bitta gap yozdi — agent 3 ta asbobni o'zi chaqirdi va ishni bajardi. Mana AI-agent kuchi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — GUARDRAILS =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(GUARDS.map(g => g.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= GUARDS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = GUARDS.find(g => g.id === active);
  return (
    <Stage eyebrow="Xavfsizlik · chegaralar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 chegarani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Amal qiladigan agent — kuchli, lekin <span className="italic" style={{ color: T.accent }}>xavfli</span>. Chegara qo'ying.</h2></div>
        <Mentor>Agent real ishlar qiladi: pul, xabar, o'chirish. Xato qilsa — oqibati real. Shuning uchun direktor unga <b style={{ color: T.ink }}>chegara</b> qo'yadi. Har birini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {GUARDS.map(g => <button key={g.id} className="gchip" onClick={() => tap(g.id)} style={seen.has(g.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(g.id) ? '✓ ' : ''}{g.ico} {g.label}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Avtonomlik + chegara = ishonchli agent. Erkinlikni asta-sekin, ishonch ortgani sari kengaytirasiz.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="frame-warn fade-step" key={active}><p className="note-h" style={{ margin: '0 0 4px' }}>{cur.ico} {cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chegarani bosing ←</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (guardrails, global) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Agent real pul yechadigan yoki mijozga xabar yuboradigan amal qilishidan oldin nima muhim?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Agent real <span className="italic" style={{ color: T.accent }}>pul yechadigan</span> yoki xabar yuboradigan amal qilishidan oldin nima muhim?</h2></>}
    options={["Chegara qo'yish: faqat ruxsat etilgan asboblar va xavfli amaldan oldin tasdiq / odam nazorati", "Hech narsa — agentga to'liq erkinlik berish kerak", "Agentni umuman ishlatmaslik", "Faqat javob tezligini oshirish"]} correctIdx={0}
    explainCorrect="To'g'ri! Amal qiladigan agent xato qilsa, oqibati real (pul, mijoz). Shuning uchun chegara qo'yiladi: cheklangan asboblar, xavfli amaldan oldin tasdiq, kerakli joyda odam nazorati (human-in-loop). Bu — har avtonom tizimda muhim."
    explainWrong={{
      1: "To'liq erkinlik xavfli — agent xato qilsa real zarar. Chegara shart.",
      2: "Ishlatmaslik — yechim emas. To'g'ri yo'l: chegara bilan xavfsiz ishlatish.",
      3: "Tezlik bu yerda asosiy emas — xavfsizlik (chegara, tasdiq) muhim.",
      default: "Chegara qo'yish: ruxsat etilgan asboblar va tasdiq/odam nazorati."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: agent siklini yig'ish =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "AI-agent siklini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Siklni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: AI-agent siklini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Agent qanday ishlaydi? Maqsad oladi, holatni ko'radi, asbob tanlaydi, amal qiladi va natijani ko'rib qaytadi. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">agent sikli (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Sikl tayyor: <b>Maqsad → Idrok → Qaror → Amal → Natijani ko'r</b> — va maqsadga yetguncha qayta aylanadi. Mana AI-agent.</p></div>}
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
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — MODUL CAPSTONE =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const HOMEWORK = [
    { b: "Loyihalang", t: "— o'z botingiz uchun bitta maqsad va 3-4 ta asbob (funksiya) yozing" },
    { b: 'Chegaralang', t: "— qaysi amal xavfli (pul, o'chirish)? Unga tasdiq yoki taqiq qo'ying" },
    { b: 'Quring', t: "— AI'ga maqsad + asboblar + chegaralarni prompt bilan bering va agentni sinab ko'ring" }
  ];
  const GLOSSARY = [
    { b: 'AI-agent', t: '— maqsad sari o\'zi amal qiladigan bot' },
    { b: 'idrok', t: '— holatni o\'qish (perceive)' },
    { b: 'qaror', t: '— qaysi asbobni ishlatishni tanlash' },
    { b: 'amal', t: '— asbobni chaqirib ish bajarish' },
    { b: 'tool (asbob)', t: '— agent chaqiradigan funksiya' },
    { b: 'maqsad', t: '— agentga berilgan vazifa' },
    { b: 'guardrails', t: '— xavfsizlik chegaralari' },
    { b: 'human-in-loop', t: '— muhim qarorda odam nazorati' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Modul yakuni 🎓" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Modulni yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Botlar moduli tamom</span><h2 className="title h-title fade-up d1">Oddiy javobdan — <span className="italic" style={{ color: T.accent }}>o'zi ish bajaradigan agentgacha</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! AI-agent siklini (idrok → qaror → amal), asboblar va xavfsizlik chegaralarini o'rgandingiz — modulni yakunladingiz." : "Yaxshi harakat! AI-bot vs AI-agent farqi va agent sikli bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Bosib o'tgan yo'lingiz</div><ul className="recap">{MODULE_ARC.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="arc-n mono">{r.n}</span><span>{r.t}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Yakuniy vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🎓 Siz direktorsiz: rule-bot'dan AI-agentgacha — endi AI bilan istalgan botni qura olasiz. Tabriklaymiz!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotAiAgentLesson({ lang: langProp, onFinished }) {
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

        /* ===== ARXITEKTURA / SIKL OQIMI ===== */
        .archflow { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .archnode { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 11px; padding: 10px 14px; min-width: 90px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .archnode.cur { box-shadow: inset 0 0 0 2px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.3); background: ${T.accentSoft}; transform: translateY(-2px); }
        .archnode-ico { font-size: 20px; line-height: 1; }
        .archnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink}; text-align: center; }
        .archflow-arrow { color: ${T.ink3}; font-weight: 700; font-size: 15px; }
        .archloop { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.accent}; margin-left: 6px; }

        /* ===== AGENT STEP (case) ===== */
        .agent-step { display: flex; flex-direction: column; gap: 4px; background: ${T.paper}; border-radius: 10px; padding: 10px 13px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); border-left: 3px solid ${T.blue}; }
        .agent-step.done { border-left-color: ${T.success}; background: ${T.successSoft}; }
        .as-phase { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.blue}; letter-spacing: 0.04em; }
        .agent-step.done .as-phase { color: ${T.success}; }
        .as-txt { font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .as-tool { font-size: 11px; color: ${T.accent}; background: ${T.accentSoft}; padding: 2px 8px; border-radius: 6px; align-self: flex-start; }
        .tool-chip { font-size: 11px; color: ${T.success}; background: ${T.successSoft}; padding: 4px 9px; border-radius: 99px; font-weight: 700; }

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
        .arc-n { color: ${T.accent}; font-weight: 700; font-size: 11px; background: ${T.accentSoft}; padding: 2px 8px; border-radius: 6px; flex-shrink: 0; min-width: 56px; text-align: center; }
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
