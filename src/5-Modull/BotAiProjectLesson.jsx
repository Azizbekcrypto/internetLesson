import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 4 (P1) — LOYIHA KUNI: AI BILAN ISTALGAN BOT — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi AI promptlari bilan to'liq Telegram bot yarata oladi — LEKIN ko'r-ko'rona emas:
//         reja (trigger→action) → aniq prompt → AI kodini O'QISH → TEST → TUZATISH (iteratsiya).
// Davomi: T1 (trigger→action), T2 (Telegraf, /start, tugmalar). Endi shularni AI bilan birga quramiz.
// Falsafa AMALDA: SIZ — DIREKTOR, AI — ISHCHI. Tushunganingiz uchun aniq buyurasiz va kodni tekshirasiz.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
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

const LESSON_META = { lessonId: 'bot-ai-project-v1', lessonTitle: { uz: 'Loyiha kuni: AI bilan istalgan bot', ru: 'Проектный день: бот с ИИ' } };
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

// ===== TELEGRAM CHAT (realistik) =====
const TgChat = ({ title = 'MyQuizBot', sub = 'bot · onlayn', ava = '🤖', children, input = true, minH }) => (
  <div className="tg">
    <div className="tg-head"><span className="tg-ava">{ava}</span><span className="tg-name">{title}<span className="tg-status">{sub}</span></span></div>
    <div className="tg-body" style={{ minHeight: minH }}>{children}</div>
    {input && <div className="tg-input"><span className="tg-input-field">Xabar yozing…</span><span className="tg-send">➤</span></div>}
  </div>
);
const Bubble = ({ from = 'bot', children, inline }) => (
  <div className={`tg-bubble-wrap ${from}`}>
    <div className={`tg-bubble ${from} el-in`}>{children}</div>
    {inline && <div className="tg-inline el-in">{inline.map((row, ri) => <div key={ri} className="tg-inline-row">{row.map((b, bi) => <span key={bi} className={`tg-inline-btn ${b.dead ? 'dead' : ''}`} onClick={b.onClick}>{b.label}</span>)}</div>)}</div>}
  </div>
);

// ===== AI PROMPT + JAVOB KARTOCHKALARI =====
const PromptCard = ({ children, who = 'Siz → AI' }) => (
  <div className="prompt-card"><span className="prompt-who">🧑‍💻 {who}</span><p className="prompt-text">{children}</p></div>
);

// ===== BOT G'OYALARI (reja: trigger → action) =====
const BOT_IDEAS = [
  { id: 'quiz', ico: '🧠', name: 'Viktorina boti', pairs: [['/start', 'savolni boshlash tugmasi'], ['Boshlash tugmasi', 'savol + A/B/C variant'], ['Javob tanlandi', "to'g'ri/xato deydi"], ['/ball', 'to\'plangan ballni ko\'rsatadi']] },
  { id: 'pizza', ico: '🍕', name: 'Buyurtma boti', pairs: [['/start', 'salom + menyu'], ['Menyu tugmasi', 'taomlar ro\'yxati'], ['Taom tanlandi', 'manzil so\'raydi'], ['Manzil yuborildi', 'buyurtmani tasdiqlaydi']] },
  { id: 'remind', ico: '⏰', name: 'Eslatma boti', pairs: [['/start', 'qisqa qo\'llanma'], ['Eslatma matni', 'saqlaydi'], ['/royxat', 'eslatmalarni ko\'rsatadi'], ['/ochir', 'eslatmani o\'chiradi']] }
];

// ===== PROMPT QISMLARI (anatomiya / yig'ish) =====
const PROMPT_PARTS = [
  { id: 'tech', ico: '🛠️', short: 'Texnologiya', text: 'Node.js va Telegraf kutubxonasida yoz', why: "AI qaysi texnologiyani ishlatishini aniq biladi — tasodifiy tanlamaydi." },
  { id: 'pairs', ico: '🔗', short: 'trigger → action', text: '/start → menyu, "Boshlash" → savol, javob → to\'g\'ri/xato', why: "Botning butun mantig'i. Buni bermasangiz, AI o'zича to'qib chiqaradi." },
  { id: 'btn', ico: '🔘', short: 'Tugma turi', text: 'variantlar uchun inline tugma ishlat', why: "Inline'mi reply'mi — buni siz hal qilasiz, AI emas (o'tgan darsda o'rgangansiz)." },
  { id: 'token', ico: '🔑', short: 'Token .env', text: 'token .env\'dan (process.env.BOT_TOKEN) olinsin', why: "Aks holda AI tokenни kodга ochiq yozib qo'yishi mumkin — xavfli." }
];

// ===== AI-BUILD WORKFLOW (final) =====
const FLOW = [
  { id: 'plan', ico: '🗺️', label: 'Reja', d: "Botni trigger → action juftliklari sifatida rejalashtirasiz." },
  { id: 'prompt', ico: '📝', label: 'Aniq prompt', d: "Texnologiya, juftliklar, tugma turi, token — hammasini yozasiz." },
  { id: 'gen', ico: '🤖', label: 'AI yozadi', d: "AI shu buyruq asosida kodni yaratadi." },
  { id: 'read', ico: '🔍', label: "O'qib tekshirish", d: "Har qismni tushunasiz — ko'r-ko'rona qabul qilmaysiz." },
  { id: 'test', ico: '🧪', label: 'Test', d: "Botni ishga tushirib, tugmalarni bosib sinaysiz." },
  { id: 'fix', ico: '🔧', label: 'Iteratsiya', d: "Xato/kamchilik bo'lsa — aniq tuzatish promptini berasiz." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['gen', 'plan', 'test', 'prompt', 'fix', 'read'];

// ===== SCREEN 0 — HOOK: noaniq vs aniq prompt =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Chap tarafdagi — \"bot yasab ber\" — qisqa va oson" },
    { id: 'b', label: "O'ng tarafdagi — aniq, trigger→action va texnologiya bilan" },
    { id: 'c', label: "Farqi yo'q — AI baribir o'zi to'g'ri qiladi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha kuni · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Bugun AI bilan to'liq bot yasaymiz. Lekin <span className="italic" style={{ color: T.accent }}>qaysi prompt</span> yaxshiroq bot beradi?</h1>
        <Mentor>Bot ichini 2 darsda tushundingiz. Endi kodni AI yozadi — lekin natija sizning <b style={{ color: T.ink }}>buyrug'ingizga</b> bog'liq. Tugmani bosing va ikki promptni solishtiring.</Mentor>
        <Zoomable><Split>
          <Col>
            <PromptCard who="Noaniq prompt">menga Telegram bot yasab ber</PromptCard>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🤖 AI: tasodifiy til, noma'lum tugma turi, token kodda ochiq, ko'p narsa o'zича to'qildi. Buzilsa — qayerdan ekanini bilmaysiz.</p></div>}
            <PromptCard who="Aniq prompt">Telegraf'da viktorina boti: /start → "Boshlash" inline tugma → savol + A/B/C inline variantlar → javobga to'g'ri/xato. Token .env'dan olinsin.</PromptCard>
            {tried && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🤖 AI: aniq Telegraf kodi, inline tugmalar, token xavfsiz. Har qatorni tushunasiz, chunki o'zingiz buyurdingiz.</p></div>}
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Ikki natija solishtirildi' : "▶ AI ikkalasiga javob bersin"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi prompt yaxshiroq bot beradi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>Aniq prompt</b> yaxshi bot beradi — chunki siz nima xohlayotganingizni bilasiz. Bugun shunday aniq buyruq yozishni va AI kodini tekshirishni o'rganamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "G'oya → trigger → action rejasi", tag: 'reja' },
    { text: "Aniq prompt yozish (4 qism)", tag: 'buyruq' },
    { text: "AI kodini o'qib tekshirish", tag: 'nazorat' },
    { text: "Test va tuzatish (iteratsiya)", tag: 'sikl' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — shu botni AI bilan qurib, tekshirasiz</p>
      <TgChat input={false} minH={0}>
        <Bubble from="user">/start</Bubble>
        <Bubble from="bot" inline={[[{ label: '▶ Boshlash' }]]}>🧠 Viktorinaga xush kelibsiz! Tayyormisiz?</Bubble>
      </TgChat>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Siz buyurasiz — AI yozadi — siz tekshirasiz. Bugungi maqsad: AI bilan <b>ishonchli</b> bot qurish, ko'r-ko'rona emas.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Bugun siz — <span className="italic" style={{ color: T.accent }}>direktor</span>. AI — ishchi. Birga bot quramiz.</h2></div>
        <Mentor>Loyiha kuni! AI kodni yozadi, lekin <b style={{ color: T.ink }}>rul sizda</b>: rejani siz tuzasiz, buyruqni siz berasiz, kodni siz tekshirasiz. Mana natija va 4 qadam.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — AVVAL REJA: trigger → action =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(storedAnswer ? 'quiz' : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(BOT_IDEAS.map(b => b.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= BOT_IDEAS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = BOT_IDEAS.find(b => b.id === active);
  return (
    <Stage eyebrow="Reja · trigger→action" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 g'oyani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Promptdan oldin — <span className="italic" style={{ color: T.accent }}>reja</span>. Bot nimani qiladi?</h2></div>
        <Mentor>AI'ga buyruq berishdan oldin botingizni <b style={{ color: T.ink }}>trigger → action</b> juftliklariga ajrating (1-darsdagidek). Rejasiz prompt — noaniq bot. Har g'oyani bosib, uning rejasini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {BOT_IDEAS.map(b => <button key={b.id} className="gchip" onClick={() => tap(b.id)} style={seen.has(b.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(b.id) ? '✓ ' : ''}{b.ico} {b.name}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bot — bu trigger → action ro'yxati, xolos. Shu ro'yxatni AI'ga bersangiz — u aniq kod yozadi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">{cur ? `${cur.ico} ${cur.name} — rejasi` : 'reja'}</p>
            {cur
              ? <div className="wire fade-step" key={active}>{cur.pairs.map((p, i) => <div key={i} className="wire-row el-in"><span className="mono" style={{ color: T.accent, fontSize: 11, minWidth: 14 }}>{i + 1}</span><span className="wire-t">{p[0]}</span><span className="wire-arrow">→</span><span className="wire-t" style={{ color: T.success }}>{p[1]}</span></div>)}</div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>G'oyani bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — YAXSHI PROMPT ANATOMIYASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PROMPT_PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PROMPT_PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PROMPT_PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Prompt anatomiyasi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 qismni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi prompt — <span className="italic" style={{ color: T.accent }}>4 qism</span>dan iborat.</h2></div>
        <Mentor>Aniq prompt 4 narsani aytadi: texnologiya, trigger→action, tugma turi va token. Har qismni bosib, nega muhimligini ko'ring — bularning hammasini siz bilasiz, AI emas.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROMPT_PARTS.map(p => (
                <button key={p.id} className="vcard" onClick={() => tap(p.id)} style={{ boxShadow: active === p.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{p.ico}</span>
                  <span className="vlbl">{p.short}</span>
                  <span className="vseen" style={{ color: seen.has(p.id) ? T.success : T.ink3, marginLeft: 'auto', fontWeight: 700 }}>{seen.has(p.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.short}</p><p className="mono small" style={{ color: T.success, margin: '0 0 7px' }}>"{cur.text}"</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.why}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 qism = aniq buyruq. AI taxmin qilmaydi, siz aytganini qiladi. Mana bu — direktorlik.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Nega AI'ga 'menga bot yasab ber' deyish yomon prompt?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega <span className="italic" style={{ color: T.accent }}>"menga bot yasab ber"</span> yomon prompt?</h2></>}
    options={["Juda noaniq — AI texnologiya, trigger→action va tugmalarni o'zича to'qiydi, natijani nazorat qilmaysiz", "Juda uzun — AI uni o'qiy olmaydi", "AI o'zbekchani tushunmaydi", "Bot yasash umuman AI ishi emas"]} correctIdx={0}
    explainCorrect="To'g'ri! Noaniq prompt AI'ga juda ko'p qaror qoldiradi — u o'zича tanlaydi va siz nima chiqishini nazorat qila olmaysiz. Aniq prompt (texnologiya + trigger→action + tugma + token) — natijani siz boshqarasiz."
    explainWrong={{
      1: "Aksincha — u juda QISQA (noaniq). AI uzun, batafsil promptlarni yaxshi tushunadi.",
      2: "AI o'zbekchani ham tushunadi. Muammo tilda emas — buyruq noaniqligida.",
      3: "Bot yasash AI bilan zo'r ishlaydi — faqat aniq buyruq bering. Muammo shunda.",
      default: "Noaniq prompt → AI o'zича to'qiydi → nazorat yo'qoladi."
    }} />
);

// ===== SCREEN 5 — PROMPTNI YIG'ISH =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer ? new Set(PROMPT_PARTS.map(p => p.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = added.size >= PROMPT_PARTS.length;
  const fired = useRef(!!storedAnswer);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onAnswer(screen, { correct: true, picked: true }); } }, [done]);
  const add = (id) => { if (added.has(id)) return; setAdded(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Prompt yig'ish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Promptni yig'ing (${added.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>siz</span> viktorina boti uchun aniq prompt yig'ing.</h2></div>
        <Mentor>Pastdagi 4 qismni bosib, promptingizga qo'shing. Har qism qo'shilgani sayin o'ngdagi prompt to'liqlashib boradi — mana shu buyruqni AI'ga berasiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">qismlarni qo'shing</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {PROMPT_PARTS.map(p => <button key={p.id} className={`pick-row ${added.has(p.id) ? 'picked' : ''}`} disabled={added.has(p.id)} onClick={() => add(p.id)}><span style={{ marginRight: 4 }}>{p.ico}</span><span style={{ flex: 1 }}>{p.short}</span><span className="pick-plus">{added.has(p.id) ? '✓' : '+'}</span></button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">sizning promptingiz</p>
            <div className="prompt-card live">
              <span className="prompt-who">🧑‍💻 Siz → AI</span>
              {added.size === 0 ? <p className="prompt-text" style={{ color: T.ink3, fontStyle: 'italic' }}>Qismlarni qo'shing — prompt shu yerda yig'iladi…</p>
                : <p className="prompt-text">Viktorina boti yoz. {added.has('tech') && <span className="el-in">Node.js + Telegraf'da. </span>}{added.has('pairs') && <span className="el-in">/start → "Boshlash" tugma → savol + A/B/C variant → javobga to'g'ri/xato. </span>}{added.has('btn') && <span className="el-in">Variantlar uchun inline tugma ishlat. </span>}{added.has('token') && <span className="el-in">Token .env'dan (process.env.BOT_TOKEN) olinsin.</span>}</p>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — aniq, to'liq buyruq. AI endi taxmin qilmaydi. Keyingi ekranda u shu prompt asosida kod yozadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — AI KODINI O'QISH =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle → gen → done
  const [sc, setSc] = useState(0);
  const ANNO = [
    { line: 'bot.start', d: '/start trigger — botni boshlaydi' },
    { line: 'Markup.button.callback', d: 'inline tugma — siz so\'ragandek' },
    { line: 'process.env.BOT_TOKEN', d: 'token .env\'dan — xavfsiz' }
  ];
  const done = phase === 'done';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const generate = () => { setPhase('gen'); setSc(n => n + 1); setTimeout(() => { setPhase('done'); setSc(n => n + 1); }, 1300); };
  return (
    <Stage eyebrow="AI kodi · o'qish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "AI kodini yozsin"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI kod yozdi. Endi eng muhim qadam: uni <span className="italic" style={{ color: T.accent }}>o'qib tushunish</span>.</h2></div>
        <Mentor>AI kodni soniyalarda yozadi. Lekin uni <b style={{ color: T.ink }}>ko'r-ko'rona qabul qilmang</b> — har qismni tushuning. Yaxshiyamki, bularning hammasini o'tgan darslarda o'rgangansiz. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            {phase === 'idle' && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={generate}>🤖 AI'ga promptni yuborish</button>}
            {phase === 'gen' && <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.blue}` }}><p className="body" style={{ margin: 0, color: T.ink }}>🤖 AI kod yozyapti<span className="gen-dots"><i /><i /><i /></span></p></div>}
            {done && <CodeFile name="quiz.bot.ts" minH={150}>
              <Kw>const</Kw>{' bot = '}<Kw>new</Kw>{' '}<At>Telegraf</At>{'(process.env.'}<At>BOT_TOKEN</At>{')'}{'\n\n'}
              <Kw>bot</Kw>{'.'}<At>start</At>{'(('}<Kw>ctx</Kw>{') =>'}{'\n'}
              {'  '}<Kw>ctx</Kw>{'.'}<At>reply</At>{'('}<St>'🧠 Tayyormisiz?'</St>{', '}{'\n'}
              {'    '}<At>Markup</At>{'.'}<At>inlineKeyboard</At>{'(['}{'\n'}
              {'      '}<At>Markup</At>{'.'}<At>button</At>{'.'}<At>callback</At>{'('}<St>'▶ Boshlash'</St>{', '}<St>'start_quiz'</St>{')'}{'\n'}
              {'    ])))'}
            </CodeFile>}
          </Col>
          <Col>
            <p className="flow-label">kod tushuntirilishi</p>
            {done
              ? <div className="wire fade-step">{ANNO.map((a, i) => <div key={i} className="wire-row el-in"><span className="mono" style={{ color: T.accent, fontSize: 11 }}>{a.line}</span><span className="wire-arrow">→</span><span className="wire-t">{a.d}</span></div>)}</div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>AI kod yozgach, bu yerda tahlil chiqadi</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har qatorни tanidingiz: <span className="mono">bot.start</span> (trigger), inline tugma, <span className="mono">.env</span> token. Siz so'raganingiz aynan bajarildi — buni tekshira oldingiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SIGNATURE: VIBECODING SIKLI (test → topish → tuzatish) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [started, setStarted] = useState(!!storedAnswer);
  const [bugSeen, setBugSeen] = useState(!!storedAnswer);
  const [diag, setDiag] = useState(storedAnswer ? 'ok' : null);
  const [fixPhase, setFixPhase] = useState(storedAnswer ? 'fixed' : 'idle'); // idle → fixing → fixed
  const [answered, setAnswered] = useState(storedAnswer ? 'a' : null);
  const [sc, setSc] = useState(0);
  const fixed = fixPhase === 'fixed';
  const done = fixed && answered !== null;
  const fired = useRef(!!storedAnswer);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onAnswer(screen, { correct: true, picked: true }); } }, [done]);
  const DIAG = [
    { id: 'ok', label: "'start_quiz' tugmasiga bot.action handleri yozilmagan", correct: true },
    { id: 'x1', label: "Token noto'g'ri", correct: false },
    { id: 'x2', label: "Internet yo'q", correct: false }
  ];
  const pressStart = () => { if (started) return; setStarted(true); setSc(n => n + 1); };
  const pressAnswerBug = () => { setBugSeen(true); setSc(n => n + 1); };
  const pickDiag = (id) => { if (diag === 'ok') return; setDiag(id); setSc(n => n + 1); };
  const sendFix = () => { setFixPhase('fixing'); setSc(n => n + 1); setTimeout(() => { setFixPhase('fixed'); setSc(n => n + 1); }, 1200); };
  const pressAnswerFixed = (v) => { setAnswered(v); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Vibecoding · test → tuzatish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Botni test qilib, tuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kod tayyor — lekin <span className="italic" style={{ color: T.accent }}>ishlaydimi</span>? Test qilib, tuzatamiz.</h2></div>
        <Mentor>AI yozgan kodni doim <b style={{ color: T.ink }}>test qiling</b>. Botni ishga tushiring, tugmalarni bosing. Nimadir ishlamasa — siz tushunganingiz uchun muammoni topasiz va aniq tuzatish promptini berasiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <TgChat title="MyQuizBot (test)" input={false} minH={170}>
              <Bubble from="user">/start</Bubble>
              <Bubble from="bot" inline={[[{ label: '▶ Boshlash', onClick: pressStart }]]}>🧠 Tayyormisiz?</Bubble>
              {started && <Bubble from="bot" inline={[[{ label: 'A', onClick: fixed ? () => pressAnswerFixed('a') : pressAnswerBug, dead: !fixed }, { label: 'B', onClick: fixed ? () => pressAnswerFixed('b') : pressAnswerBug, dead: !fixed }, { label: 'C', onClick: fixed ? () => pressAnswerFixed('c') : pressAnswerBug, dead: !fixed }]]}>Savol: Telegraf qaysi tilda? (A: Python B: JS/Node C: Go)</Bubble>}
              {fixed && answered && <Bubble from="bot">{answered === 'b' ? '✅ To\'g\'ri! Telegraf — Node.js (JS).' : '❌ Xato. To\'g\'ri javob: B (Node.js).'}</Bubble>}
            </TgChat>
            {!started && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>"▶ Boshlash" tugmasini bosing ←</p>}
          </Col>
          <Col>
            {!bugSeen && started && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>⚠️ "Boshlash" ishladi, lekin <b>A/B/C tugmalarini bosing</b> — nima bo'ladi?</p></div>}
            {bugSeen && diag !== 'ok' && <>
              <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🐞 Tugmani bosdingiz — bot <b>javob bermadi</b>! Sababi nima deb o'ylaysiz?</p></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {DIAG.map(d => <button key={d.id} className={`pick-row ${diag === d.id && !d.correct ? 'sel' : ''}`} onClick={() => pickDiag(d.id)}><span style={{ flex: 1 }}>{d.label}</span></button>)}
              </div>
              {diag && diag !== 'ok' && <p className="small" style={{ color: T.danger, margin: 0 }}>Bu sabab emas — qaytadan o'ylang. (Maslahat: tugma bosilsa-yu javob bo'lmasa, handler yetishmaydi.)</p>}
            </>}
            {diag === 'ok' && fixPhase === 'idle' && <>
              <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Topdingiz! AI <span className="mono">bot.action('start_quiz')</span> dan keyingi javob tugmalariga handler yozmagan. Endi AI'ga aniq tuzatish buyrug'ini bering.</p></div>
              <PromptCard who="Siz → AI (tuzatish)">A/B/C javob tugmalari uchun bot.action handlerini qo'sh: to'g'ri javob B bo'lsa "To'g'ri", aks holda "Xato" deb javob bersin.</PromptCard>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={sendFix}>🤖 Tuzatish promptini yuborish</button>
            </>}
            {fixPhase === 'fixing' && <div className="frame fade-step" style={{ borderLeft: `4px solid ${T.blue}` }}><p className="body" style={{ margin: 0, color: T.ink }}>🤖 AI handlerni qo'shyapti<span className="gen-dots"><i /><i /><i /></span></p></div>}
            {fixed && answered === null && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ AI handler qo'shdi! Endi chapda <b>A/B/C tugmasini qayta bosing</b> — ishlaydimi, tekshiring.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Bot to'liq ishladi! Mana sikl: <b>test → muammoni topish → aniq tuzatish prompti → qayta test</b>. Bu — AI bilan ishlashning to'g'ri yo'li.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="AI bot kodini bergach, birinchi navbatda nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI kod bergach, <span className="italic" style={{ color: T.accent }}>birinchi</span> nima qilasiz?</h2></>}
    options={["Kodni o'qib tushunaman va botni test qilaman — ishlashiga ishonch hosil qilaman", "Hech narsa o'qimasdan to'g'ridan-to'g'ri ishlatib yuboraman", "Kodni o'chiraman va o'zim qaytadan yozaman", "AI'dan yana bir marta so'rayman, baribir"]} correctIdx={0}
    explainCorrect="To'g'ri! AI kodini doim o'qib tushunish va test qilish kerak. Shунда xato/kamchilikni topib, aniq tuzatish promptini bera olasiz. Bu — direktorlik."
    explainWrong={{
      1: "Xavfli — tekshirilmagan kod buzuq bo'lishi mumkin (masalan handler yetishmasligi). Avval o'qing va test qiling.",
      2: "Shart emas — AI kodi ko'pincha yaxshi. Faqat uni tushunib, tekshirib, kerak bo'lsa tuzatish kerak.",
      3: "Maqsadsiz qayta so'rash yordam bermaydi. Avval o'qib, muammoni aniqlab, keyin aniq tuzatish so'rang.",
      default: "AI kodini o'qib tushunib, test qilish kerak."
    }} />
);

// ===== SCREEN 9 — AI XATOLARI =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MISTAKES = [
    { id: 'token', ico: '🔑', t: 'Token kodda ochiq', d: "AI ba'zan tokenni to'g'ridan-to'g'ri kodga yozadi. Siz buni payqab, .env'ga ko'chirasiz." },
    { id: 'handler', ico: '🔌', t: 'Handler yetishmaydi', d: "Tugma bor, lekin uni ushlaydigan bot.action/hears yo'q. Siz test qilib topasiz." },
    { id: 'btn', ico: '🔘', t: "Noto'g'ri tugma turi", d: "Siz inline so'radingiz, AI reply qildi (yoki aksincha). Farqini bilganingiz uchun tuzatasiz." },
    { id: 'old', ico: '📦', t: 'Eski sintaksis', d: "AI eski versiya kodini berishi mumkin. Siz hujjat bilan solishtirib, yangilaysiz." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(MISTAKES.map(m => m.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= MISTAKES.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = MISTAKES.find(m => m.id === active);
  return (
    <Stage eyebrow="AI xatolari" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 xatoni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI ham <span className="italic" style={{ color: T.accent }}>xato qiladi</span>. Tushunsangiz — tutasiz.</h2></div>
        <Mentor>AI kuchli, lekin mukammal emas. Mana eng tez-tez uchraydigan 4 xato. Har birini bosing — va e'tibor bering: ularning hammasini siz <b style={{ color: T.ink }}>tushunganingiz uchun</b> topa olasiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {MISTAKES.map(m => <button key={m.id} className="gchip" onClick={() => tap(m.id)} style={seen.has(m.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(m.id) ? '✓ ' : ''}{m.ico} {m.t}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.t}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Xatoni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bilim — bu sizning "xato detektoringiz". AI tezligini beradi, siz to'g'riligini ta'minlaysiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — FALSAFA AMALDA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Falsafa · direktor" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Farqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ikki xil odam AI ishlatadi. <span className="italic" style={{ color: T.accent }}>Farqni</span> his qiling.</h2></div>
        <Mentor>Bugun siz aniq buyurdingiz, kodni o'qidingiz, test qildingiz, muammoni topib tuzatdingiz. Bu — sizni boshqalardan ajratadigan ko'nikma. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}>
              <p className="note-h" style={{ color: T.danger }}>🙈 Ko'r-ko'rona nusxalovchi</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>"Yasab ber" → nusxalab qo'yadi → ishladi, deydi. Buzilsa — boshi berk ko'chada. Botni o'stira olmaydi, chunki ichini bilmaydi.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Direktor-chi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step" style={{ borderLeftColor: T.success }}>
                  <span className="agent-lbl" style={{ color: T.success }}>🎯 DIREKTOR (SIZ)</span>
                  <p className="agent-msg">Rejani tuzasiz → aniq buyurasiz → kodni o'qiysiz → test qilasiz → muammoni topib aniq tuzatasiz. AI sizning tezligingiz, siz uning aqli va nazoratisiz. <b>Istalgan botni</b> qura olasiz.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun o'tgan darslarda bot ichini o'rgandik. Tushunish — AI bilan istalgan narsani qurish kalitidir.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Inline tugmani bosdingiz, bot javob bermadi. Eng ehtimoliy sabab?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Inline tugma bosildi, bot <span className="italic" style={{ color: T.accent }}>javob bermadi</span>. Sabab?</h2></>}
    options={["Tugma callback'ini ushlaydigan bot.action(...) handleri yozilmagan", "Internet juda tez", "Telegram bu tugmani yoqtirmadi", "Bot juda ko'p ishlaganidan charchadi"]} correctIdx={0}
    explainCorrect="To'g'ri! Inline tugma callback yuboradi, lekin uni ushlaydigan bot.action(...) bo'lmasa — bot jim qoladi. Yechim: o'sha tugma uchun handler qo'shishni so'rash (aniq tuzatish prompti)."
    explainWrong={{
      1: "Internet tezligi bunga sabab emas. Tugma bosilsa-yu javob yo'q bo'lsa — handler yetishmaydi.",
      2: "Telegram tugmalarni 'yoqtirmaydi' degan narsa yo'q. Muammo — handler yo'qligida.",
      3: "Botlar charchamaydi 🙂 Javob bo'lmasa, demak callback'ni ushlaydigan kod yozilmagan.",
      default: "Javob yo'q → bot.action handleri yetishmaydi."
    }} />
);

// ===== SCREEN 12 — CASE: to'liq qurish hikoyasi =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { ico: '🗺️', t: 'Reja', d: "Eslatma boti: /start → qo'llanma, matn → saqlash, /royxat → ko'rsatish." },
    { ico: '📝', t: 'Aniq prompt', d: "\"Telegraf'da eslatma boti: /start qo'llanma bersin, oddiy matnni eslatma sifatida saqlasin, /royxat hammasini ko'rsatsin. Token .env'dan.\"" },
    { ico: '🤖', t: 'AI yozdi', d: "bot.start, bot.on('text'), bot.command('royxat') — uchta handler tayyor." },
    { ico: '🧪', t: 'Test + tuzatish', d: "/royxat bo'sh chiqdi — chunki saqlash massivga yozilmagan. Aniq tuzatish prompti bilan hal qildingiz." },
    { ico: '✅', t: 'Ishladi', d: "Eslatma qo'shildi, ro'yxatda ko'rindi. Bot tayyor — va siz har qismini tushunasiz." }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { setShown(n => Math.min(n + 1, STEPS.length)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Hayotiy · to'liq qurish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Hikoyani oching (${shown}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Boshqa bot, <span className="italic" style={{ color: T.accent }}>bir xil yo'l</span>: g'oyadan ishlaydigan botgacha.</h2></div>
        <Mentor>Endi eslatma botini ko'ramiz — boshqa g'oya, lekin aynan o'sha 5 qadam. Tugmani bosib har qadamni oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS.slice(0, shown).map((s, i) => (
                <div key={i} className="sk-info el-in"><p className="note-h"><span style={{ fontSize: 17, marginRight: 6 }}>{s.ico}</span>{i + 1} · {s.t}</p><p className="body" style={{ margin: 0, color: T.ink }}>{s.d}</p></div>
              ))}
              {shown === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — hikoya boshlanadi</p></div>}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Bot tayyor' : shown === 0 ? '▶ Boshlash' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <div className="agent-card"><span className="agent-lbl">💡 NAQSH</span><p className="agent-msg">G'oya har xil, lekin yo'l doim bir xil: <b>reja → aniq prompt → AI kodi → o'qish → test → tuzatish</b>. Shu naqshni bilsangiz — istalgan botni qurasiz.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Pizza, viktorina, eslatma — texnologiya bir xil, faqat trigger → action'lar farq qiladi. Siz endi naqshni bilasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — O'ZINGIZNIKINI + hosting eslatma =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'zingiznikini" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Tushunding ✓"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi navbat <span className="italic" style={{ color: T.accent }}>sizniki</span>. O'z botingizni o'ylab toping.</h2></div>
        <Mentor>Bugungi naqsh bilan istalgan oddiy botni qura olasiz. Uyga vazifada o'z g'oyangizni hayotga tatbiq qilasiz. Ikki eslatmani esda tuting.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="sk-info"><p className="note-h">🗺️ 1. Avval reja</p><p className="body" style={{ margin: 0, color: T.ink }}>Prompt yozishdan oldin botingizni trigger → action juftliklariga ajrating. Reja qancha aniq — kod shuncha aniq.</p></div>
            <div className="sk-info"><p className="note-h">🖥️ 2. Hozircha lokalda</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">bot.launch()</span> bilan bot kompyuteringizda ishlaydi (polling). Doim onlayn bo'lishi uchun <b>hosting</b> kerak — buni keyingi mini-loyiha darsida qilamiz.</p></div>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => { setDone(true); setSc(n => n + 1); }}>{done ? '✓ Tushundim' : 'Tushundim ✓'}</button>
          </Col>
          <Col>
            <div className="agent-card"><span className="agent-lbl">📍 KEYINGI DARSLAR</span><p className="agent-msg"><b>P2:</b> botga <b>AI miya</b> ulaymiz — u tayyor javoblardan emas, o'ylab javob beradi (AI-bot). <b>P3:</b> bot + DB + AI + hosting bilan to'liq mini-loyiha.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bugun: AI bilan istalgan oddiy botni qura olasiz. Keyin: uni aqlli qilamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="AI bilan bot qurishda eng to'g'ri tartib qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI bilan bot qurishda eng <span className="italic" style={{ color: T.accent }}>to'g'ri tartib</span>?</h2></>}
    options={["Reja → aniq prompt → AI kodi → o'qish → test → tuzatish", "Prompt → nusxalash → tamom (o'qimasdan)", "AI kodi → ishlatish → buzilsa tashlab ketish", "Test → reja → prompt (oxirida rejalashtirish)"]} correctIdx={0}
    explainCorrect="To'g'ri! Avval reja (trigger→action), keyin aniq prompt, AI kod yozadi, siz o'qib tushunasiz, test qilasiz va kerak bo'lsa tuzatasiz. Bu — ishonchli yo'l."
    explainWrong={{
      1: "O'qimasdan nusxalash — eng xavfli yo'l. Buzilsa, nima bo'lganini bilmaysiz.",
      2: "Tashlab ketish — yechim emas. Test qilib, muammoni topib, aniq tuzatish kerak.",
      3: "Reja eng oxirida emas, eng boshida bo'ladi. Avval reja — keyin prompt va test.",
      default: "Reja → prompt → AI kodi → o'qish → test → tuzatish."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: AI-build workflow'ni yig'ish =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "AI-build workflow'ni to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Jarayonni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: AI bilan bot qurish jarayonini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Bugun o'rgangan yo'lni eslang: rejadan boshlanadi, aniq prompt bilan davom etadi, AI yozadi, siz o'qib, test qilib, tuzatasiz. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">jarayon (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana yo'l: <b>Reja → Aniq prompt → AI yozadi → O'qish → Test → Iteratsiya</b>. Shu naqsh bilan istalgan botni qurasiz.</p></div>}
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
    "AI bilan bot qurish: reja → aniq prompt → AI kodi → o'qish → test → tuzatish",
    "Promptdan oldin botni trigger → action juftliklariga rejalashtirasiz",
    "Yaxshi prompt 4 qism: texnologiya, trigger→action, tugma turi, token .env",
    "AI kodini ko'r-ko'rona qabul qilmaysiz — o'qib tushunib, test qilasiz",
    "AI xato qilsa (handler yo'q, token ochiq…) — bilganingiz uchun topib tuzatasiz"
  ];
  const HOMEWORK = [
    { b: 'Reja', t: "— o'z bot g'oyangizni tanlang va uni 3-4 trigger → action juftligiga ajrating" },
    { b: 'Prompt', t: "— 4 qismli (texnologiya, juftliklar, tugma, token) aniq prompt yozing" },
    { b: 'Quring', t: "— AI bilan kod oling, o'qing, lokalda test qiling va kamida bitta narsani tuzating" }
  ];
  const GLOSSARY = [
    { b: 'prompt', t: '— AI\'ga beradigan aniq buyruq' },
    { b: 'vibecoding', t: '— AI bilan birga kod yozish' },
    { b: 'iteratsiya', t: '— test → tuzatish → qayta test sikli' },
    { b: 'reja', t: '— trigger → action juftliklari ro\'yxati' },
    { b: 'bot.action', t: '— inline tugma callback handleri' },
    { b: '.env', t: '— token saqlanadigan maxfiy fayl' },
    { b: 'direktor', t: '— buyuruvchi va tekshiruvchi (siz)' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> AI bilan birinchi botingizni qurdingiz</span><h2 className="title h-title fade-up d1">Endi siz — <span className="italic" style={{ color: T.accent }}>direktor</span>siz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! AI bilan ishlash naqshini o'rgandingiz: reja, aniq prompt, kodni o'qish, test va tuzatish. Endi istalgan oddiy botni qura olasiz." : "Yaxshi harakat! Aniq prompt va AI kodini tekshirish/tuzatish bo'limlarini qayta ko'rib chiqing."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — AI-bot: botga sun'iy intellekt miyasini ulaymiz, u tayyor javoblardan emas, o'ylab javob beradi!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotAiProjectLesson({ lang: langProp, onFinished }) {
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

        .vcard { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover:not(:disabled) { transform: translateY(-1px); }
        .vlbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .role-ico { font-size: 20px; flex-shrink: 0; }

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
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; } .pick-row.sel .pick-plus { color: ${T.accent}; }

        /* AGENT / AI CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }

        /* PROMPT CARD */
        .prompt-card { background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); border-left: 4px solid ${T.amber}; }
        .prompt-card.live { border-left-color: ${T.accent}; min-height: 90px; }
        .prompt-who { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.amber}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .prompt-card.live .prompt-who { color: ${T.accent}; }
        .prompt-text { font-family: 'JetBrains Mono'; font-size: clamp(11.5px,1.4vw,13px); color: ${T.ink}; margin: 0; line-height: 1.6; }

        /* WIRE (reja / annotatsiya) */
        .wire { background: ${T.paper}; border-radius: 14px; padding: 13px 15px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 7px; }
        .wire-row { display: flex; align-items: center; gap: 7px; font-family: 'Manrope'; font-weight: 600; font-size: clamp(11.5px,1.4vw,13px); color: ${T.ink}; }
        .wire-t { color: ${T.ink}; }
        .wire-arrow { color: ${T.accent}; font-weight: 800; }

        /* GENERATING DOTS */
        .gen-dots { display: inline-flex; gap: 4px; margin-left: 8px; vertical-align: middle; }
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
        .tg-inline { display: flex; flex-direction: column; gap: 4px; width: 100%; margin-bottom: 2px; }
        .tg-inline-row { display: flex; gap: 4px; }
        .tg-inline-btn { flex: 1; text-align: center; background: rgba(255,255,255,0.96); color: #2E78B5; font-family: 'Manrope'; font-weight: 600; font-size: 12px; padding: 9px 8px; border-radius: 9px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: all 0.15s; }
        .tg-inline-btn:hover { background: #fff; transform: translateY(-1px); }
        .tg-inline-btn.dead { color: #8A99A8; }
        .tg-input { display: flex; align-items: center; gap: 10px; background: #fff; padding: 10px 14px; border-top: 1px solid rgba(0,0,0,0.06); }
        .tg-input-field { flex: 1; color: #A7A6A2; font-family: 'Manrope'; font-size: 13px; }
        .tg-send { color: #5A9FD4; font-size: 17px; }

        /* ===== BOT TSIKLI (final ko'rinish) ===== */
        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 70px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
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
