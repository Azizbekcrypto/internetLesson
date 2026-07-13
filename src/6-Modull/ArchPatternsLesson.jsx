import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · DARS 2 (T2) — ARXITEKTURA PATTERNLARI (MVC, MIKROSERVIS) — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi tizimni TASHKIL QILISH andozalarini nomlaydi: MVC (Model-View-Controller) va monolit↔mikroservis.
//         Mahorat: o'z tizimini PATTERN bilan ta'riflash. T1 komponentlarini MVC rollariga moslaydi.
// Kelishuv: patternlar = ALLAQACHON ishlatilgan tuzilishni NOMLASH + kattaroq pattern (qayta o'rgatish emas).
// Metafora: restoran rollari (View=zal/menyu, Controller=ofitsiant, Model=ombor/retsept). Monolit=bitta restoran, mikroservis=food-court.
// Signature animatsiyalar: MVC-Hub (Controller markaz, puls oqim) va Monolit→Mikroservis bo'linishi (slide-apart).
// Davomi: T1 (mini-do'kon komponentlari). Ko'prik: T3 (AI-agent — arxitektura komponenti). Mahsulot: mini-do'kon.
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

const LESSON_META = { lessonId: 'arch-patterns-02-v16', lessonTitle: { uz: 'Arxitektura patternlari', ru: 'Паттерны архитектуры' } };
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

// ===== MVC ROLLARI (s3) =====
const MVC = [
  { id: 'view', ico: '🖥️', label: 'View', sub: "Ko'rinish", color: T.blue, rest: 'menyu / zal', role: "Mijoz ko'radigan qism — sahifa, tugmalar, menyu. Frontend (React). Faqat ko'rsatadi, qaror qilmaydi." },
  { id: 'controller', ico: '🎮', label: 'Controller', sub: 'Boshqaruvchi', color: T.accent, rest: 'ofitsiant / menejer', role: "So'rovni qabul qiladi, nima qilishni hal qiladi, Model va Viewni bog'laydi. Backend mantiqi — markaz." },
  { id: 'model', ico: '🗄️', label: 'Model', sub: "Ma'lumot", color: T.success, rest: 'ombor / retsept', role: "Ma'lumot va qoidalar — DB, biznes-mantiq. Saqlaydi va beradi (Database)." }
];

// ===== MAP TO MVC (s6) =====
const MVC_ROLES = [{ id: 'view', label: 'View' }, { id: 'controller', label: 'Controller' }, { id: 'model', label: 'Model' }];
const MAP_ITEMS = [
  { id: 'front', comp: "🖥️ Frontend (React) — mijoz ko'radigan sahifa", role: 'view' },
  { id: 'back', comp: '⚙️ Backend (Nest) — so\'rovni boshqaradi', role: 'controller' },
  { id: 'db', comp: '🗄️ PostgreSQL — ma\'lumot saqlanadi', role: 'model' }
];

// ===== MVC HUB ANIMATSIYA (s5) =====
const HUB_STEPS = [
  { active: 'controller', conn: null, txt: "So'rov keldi → Controller qabul qildi. U — markaz." },
  { active: 'model', conn: 'cm', txt: "Controller Model'dan ma'lumot so'radi (bazaga murojaat)." },
  { active: 'controller', conn: 'cm', txt: "Model ma'lumotni qaytardi → Controller qabul qildi." },
  { active: 'view', conn: 'cv', txt: "Controller View'ga «buni ko'rsat» dedi." },
  { active: 'view', conn: null, txt: "View foydalanuvchiga chiroyli natijani ko'rsatdi ✨" }
];

// ===== MONOLIT / MIKROSERVIS (s9, s10) =====
const MICRO_SERVICES = [
  { id: 'prod', label: '🛍️ Mahsulotlar', color: T.blue },
  { id: 'pay', label: '💳 To\'lov', color: T.success },
  { id: 'ship', label: '🚚 Yetkazish', color: T.amber },
  { id: 'user', label: '👤 Foydalanuvchi', color: T.violet }
];

// ===== PATTERN MATCHER (s12) =====
const SYSTEMS = [
  { id: 'a', desc: "Kichik mini-do'kon: React frontend + bitta Nest backend + bitta baza, hammasi bitta loyihada.", ans: 'mono' },
  { id: 'b', desc: "Ulkan marketplace: to'lov, qidiruv, yetkazib berish — har biri alohida, mustaqil xizmat.", ans: 'micro' },
  { id: 'c', desc: "Yangi startap MVP: tezda bitta ishlaydigan ilova kerak, jamoa kichik.", ans: 'mono' }
];

// ===== MVC OQIMI (final s15) =====
const FLOW = [
  { id: 'req', ico: '🙋', label: 'So\'rov', d: "foydalanuvchi so'rov yuboradi." },
  { id: 'controller', ico: '🎮', label: 'Controller', d: "qabul qiladi, boshqaradi." },
  { id: 'model', ico: '🗄️', label: 'Model', d: "ma'lumotni oladi (DB)." },
  { id: 'view', ico: '🖥️', label: 'View', d: "natijani chiroyli ko'rsatadi." },
  { id: 'done', ico: '✨', label: 'Foydalanuvchiga', d: "javob ekranda ko'rinadi." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['model', 'req', 'done', 'controller', 'view'];

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Tartibsizda — fayl ko'p bo'lsa, kuchli loyiha" },
    { id: 'b', label: "Tartibli (pattern)da — har narsa o'z joyida, darrov topadi" },
    { id: 'c', label: "Farqi yo'q — ikkalasi bir xil" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Dars · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Loyiha o'sdi — <span className="italic" style={{ color: T.accent }}>100 ta fayl</span>. Yangi dasturchi qayerdan boshlaydi?</h1>
        <Mentor>Komponentlar bor (o'tgan darsda ko'rdik), lekin ular qanday tartiblanadi? Tugmani bosing — ikki xil loyiha tuzilishini solishtiring.</Mentor>
        <Zoomable><Split>
          <Col>
            {!tried
              ? <div className="frame-dash" style={{ textAlign: 'center' }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Tugmani bosing — fayllarni ko'rsataman</p></div>
              : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CodeFile name="❌ tartibsiz/" minH={0}>
                    {'index.js'}{'\n'}{'kod2.js'}{'\n'}{'stuff.js'}{'\n'}{'final_ROST.js'}{'\n'}{'yana_bir.js …'}
                  </CodeFile>
                  <CodeFile name="✅ tartibli/ (pattern)" minH={0}>
                    {'views/'}{'      '}<Cm>{'// ko\'rinish'}</Cm>{'\n'}
                    {'controllers/'}{' '}<Cm>{'// mantiq'}</Cm>{'\n'}
                    {'models/'}{'     '}<Cm>{'// ma\'lumot'}</Cm>
                  </CodeFile>
                </div>}
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Solishtirildi' : "▶ Ikki loyihani ko'rish"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysisida tez ishlaydi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>Pattern</b> — kodni tashkil qilishning sinab ko'rilgan andozasi. Har narsa o'z joyida. Bugun eng mashhur pattern — <b>MVC</b> va tizim ko'lamlari (monolit/mikroservis) bilan tanishamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "MVC — 3 rol: Model, View, Controller", tag: 'mvc' },
    { text: "Sizning mini-do'koningiz allaqachon MVC", tag: 'moslash' },
    { text: "Monolit vs mikroservis — qachon qaysi", tag: 'ko\'lam' },
    { text: "Tizimni pattern bilan ta'riflash", tag: 'til' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — siz shuni ayta olasiz</p>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>«Mening loyiham — <b>MVC monolit</b>: React (View), Nest (Controller), PostgreSQL (Model).» — bir jumla, hamma tushunadi.</p></div>
      <div className="frame-dash"><p className="small" style={{ margin: 0, color: T.ink2 }}>Pattern = tizimingizning «nomi». 100 faylni tushuntirish o'rniga — bitta tanish so'z.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Tizimga <span className="italic" style={{ color: T.accent }}>nom</span> beramiz: arxitektura patterni.</h2></div>
        <Mentor>O'tgan darsda komponentlarni ko'rdingiz. Bugun ularni tashkil qilishning <b style={{ color: T.ink }}>tayyor andoza</b>larini o'rganamiz. Yaxshi xabar: siz allaqachon pattern bo'yicha qurgansiz — faqat uning nomini bilmagansiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — PATTERN NIMA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · pattern" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Misolni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pattern — <span className="italic" style={{ color: T.accent }}>sinab ko'rilgan andoza</span>.</h2></div>
        <Mentor>Pattern — bu ko'p marta sinab ko'rilgan, ishlaydigan tashkil qilish usuli. Uni o'zingiz ixtiro qilmaysiz — tayyorini olasiz. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🧩 Pattern nima?</p><p className="body" style={{ margin: 0, color: T.ink }}>Tez-tez uchraydigan muammoga tayyor, sinab ko'rilgan yechim andozasi. «Bu vaziyatda odamlar shunday qiladi» degan kelishuv.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Hayotdan misol?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🍳 <b>Oshxonada:</b> retsept — taomni har safar noldan o'ylamaysiz</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🏠 <b>Qurilishda:</b> tipoviy chizma — har uyni qaytadan loyihalamaysiz</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>💻 <b>Kodda:</b> MVC — kodni qanday bo'lish bo'yicha tayyor andoza</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Pattern = umumiy til. «MVC» desangiz — dunyodagi har bir dasturchi nimani nazarda tutganingizni tushunadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — MVC 3 ROLI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(MVC.map(m => m.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= MVC.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = MVC.find(m => m.id === active);
  return (
    <Stage eyebrow="Pattern · MVC" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 rolni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>MVC</span> — restorandagi 3 rol kabi.</h2></div>
        <Mentor>MVC = Model, View, Controller. Restoranni tasavvur qiling: <b style={{ color: T.ink }}>View</b> — zal/menyu, <b style={{ color: T.ink }}>Controller</b> — ofitsiant, <b style={{ color: T.ink }}>Model</b> — ombor. Har rolni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {MVC.map(m => <button key={m.id} className={`pick-row ${active === m.id ? 'sel' : ''} ${seen.has(m.id) ? 'done-row' : ''}`} onClick={() => tap(m.id)}><span style={{ fontSize: 18, marginRight: 4 }}>{m.ico}</span><span style={{ flex: 1 }}>{m.label} <span style={{ color: T.ink3, fontWeight: 500 }}>· {m.sub}</span></span><span className="pick-plus">{seen.has(m.id) ? '✓' : '▶'}</span></button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uch rol bir-birini to'ldiradi: View ko'rsatadi, Controller boshqaradi, Model saqlaydi. Bu — eng mashhur arxitektura patterni.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="fade-step" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info" style={{ borderLeft: `4px solid ${cur.color}` }}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label} <span style={{ color: cur.color, fontWeight: 700, fontSize: 12, marginLeft: 6 }}>{cur.sub}</span></p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.role}</p></div>
                  <div className="frame" style={{ borderLeft: `4px solid ${T.amber}`, padding: '10px 14px' }}><p className="body" style={{ margin: 0, color: T.ink }}>🍽️ Restoranda: <b>{cur.rest}</b></p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Rolni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="MVC'da foydalanuvchi ko'radigan qism (sahifa, tugmalar) qaysi rol?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>MVC'da foydalanuvchi <span className="italic" style={{ color: T.accent }}>ko'radigan</span> qism qaysi rol?</h2></>}
    options={["View — ko'rinish (frontend, sahifa, tugmalar)", "Controller — boshqaruvchi", "Model — ma'lumot", "Hech qaysi — bu MVC'ga kirmaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! View — bu ko'rinish: mijoz ko'radigan sahifa, tugmalar, menyu (frontend). Restoranda — zal va menyu. U faqat ko'rsatadi."
    explainWrong={{
      1: "Controller boshqaradi (ofitsiant), lekin mijozga ko'rinmaydi. Ko'rinadigan qism — View.",
      2: "Model — ma'lumot (ombor). Ko'rinadigan qism emas. Bu — View.",
      3: "Aksincha — ko'rinadigan qism aynan MVC'ning V (View) qismi.",
      default: "Ko'rinadigan qism — View."
    }} />
);

// ===== SCREEN 5 — MVC HUB ANIMATSIYA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? HUB_STEPS.length - 1 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= HUB_STEPS.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setStep(n => n + 1); setSc(n => n + 1); } };
  const cur = HUB_STEPS[step];
  const boxCls = (id) => `mvc-box ${id} ${cur.active === id ? 'on' : ''}`;
  return (
    <Stage eyebrow="Animatsiya · MVC oqimi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Oqimni kuzating (${step + 1}/${HUB_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Controller</span> — markazda turadi va hammasini bog'laydi.</h2></div>
        <Mentor>MVC'da so'rov to'g'ridan-to'g'ri Model'ga bormaydi — har doim <b style={{ color: T.ink }}>Controller orqali</b> o'tadi. Tugmani bosib, so'rov rollar orasida qanday harakatlanishini kuzating.</Mentor>
        <div className="fade-up"><div className="mvc-hub">
          <div className={boxCls('view')}><span style={{ fontSize: 18 }}>🖥️</span> View <span className="mvc-tag">ko'rinish</span></div>
          <div className={`mvc-conn ${cur.conn === 'cv' ? 'on' : ''}`} />
          <div className={boxCls('controller')}><span style={{ fontSize: 18 }}>🎮</span> Controller <span className="mvc-tag">markaz</span></div>
          <div className={`mvc-conn ${cur.conn === 'cm' ? 'on' : ''}`} />
          <div className={boxCls('model')}><span style={{ fontSize: 18 }}>🗄️</span> Model <span className="mvc-tag">ma'lumot</span></div>
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Oqim tugadi' : step === 0 ? '▶ So\'rovni yuborish' : 'Keyingi qadam →'}</button>
            <div className="sk-info fade-step" key={step}><p className="body" style={{ margin: 0, color: T.ink }}>{cur.txt}</p></div>
          </Col>
          <Col>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? View ↔ Controller ↔ Model. Controller — vositachi: View hech qachon to'g'ridan Model bilan gaplashmaydi. Shuning uchun kod tartibli.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — rollar yonadi →</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — MAP TO MVC =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(storedAnswer ? MAP_ITEMS.length : 0);
  const [wrong, setWrong] = useState(null);
  const [sc, setSc] = useState(0);
  const done = idx >= MAP_ITEMS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = done ? null : MAP_ITEMS[idx];
  const choose = (roleId) => {
    if (done) return;
    if (roleId === cur.role) { setWrong(null); setIdx(n => n + 1); setSc(n => n + 1); }
    else { setWrong(roleId); setTimeout(() => setWrong(w => (w === roleId ? null : w)), 450); }
  };
  return (
    <Stage eyebrow="Moslash · sizning do'kon" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Moslang (${idx}/${MAP_ITEMS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning mini-do'koningiz <span className="italic" style={{ color: T.accent }}>allaqachon MVC</span>!</h2></div>
        <Mentor>O'tgan darsdagi komponentlaringiz aynan MVC rollariga to'g'ri keladi. Har bir komponentni mos rolga joylang — o'zingiz ko'rasiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            {cur
              ? <div className="frame" key={cur.id} style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🧩 Komponent {idx + 1}/{MAP_ITEMS.length}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.comp}</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hammasi to'g'ri! Frontend = View, Backend = Controller, Database = Model. Sizning do'koningiz — <b>MVC ilova</b>. Nomini endi bilasiz!</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qaysi MVC roli?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {MVC_ROLES.map(r => (
                <button key={r.id} className={`pick-row ${wrong === r.id ? 'shake' : ''}`} disabled={done} onClick={() => choose(r.id)}>
                  <span style={{ flex: 1 }}>{r.label}</span><span className="pick-plus">+</span>
                </button>
              ))}
            </div>
            {wrong && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu rol mos emas — komponent nima qilishini o'ylang va qayta tanlang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — PATTERN NEGA YORDAM BERADI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const BEN = [
    { id: 'order', ico: '🗂️', label: 'Tartib', desc: "Har narsa o'z joyida — qaysi kod qayerda ekanini bilasiz." },
    { id: 'team', ico: '🤝', label: 'Jamoa', desc: "Bir kishi Viewda, boshqasi Modelda ishlaydi — bir-biriga xalaqit bermaydi." },
    { id: 'ai', ico: '🧠', label: 'AI tushunadi', desc: "AI'ga «MVC bo'yicha controller yoz» desangiz — darrov to'g'ri joyga yozadi." },
    { id: 'bug', ico: '🐞', label: 'Bug topish', desc: "Ma'lumot xato — Modelga qara. Ko'rinish buzuq — Viewga. Tez topasiz." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(BEN.map(b => b.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= BEN.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = BEN.find(b => b.id === active);
  return (
    <Stage eyebrow="Foyda · nega pattern" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 foydani ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega <span className="italic" style={{ color: T.accent }}>pattern</span> bo'yicha qurish foydali?</h2></div>
        <Mentor>Pattern shunchaki «chiroyli» emas — u amaliy foyda beradi. Har foydani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {BEN.map(b => <button key={b.id} className="gchip" onClick={() => tap(b.id)} style={seen.has(b.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(b.id) ? '✓ ' : ''}{b.ico} {b.label}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Pattern — tartib, jamoaviy ish, AI bilan muloqot va tez bug topish demak. Shuning uchun professional loyihalar doim pattern bo'yicha quriladi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Foydani bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="PostgreSQL bazasi MVC patternida qaysi rolga to'g'ri keladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>PostgreSQL</span> bazasi MVC'da qaysi <span className="italic" style={{ color: T.accent }}>rol</span>?</h2></>}
    options={["Model — ma'lumot va uning qoidalari", "View — chunki ma'lumotni ko'rsatadi", "Controller — chunki muhim", "Hech qaysi — baza MVC'dan tashqarida"]} correctIdx={0}
    explainCorrect="To'g'ri! Database — bu Model: ma'lumot qayerda saqlanadi va qanday qoidalar bilan ishlanadi. Restoranda — ombor va retseptlar. View ko'rsatadi, Controller boshqaradi, Model saqlaydi."
    explainWrong={{
      1: "Baza ma'lumotni ko'rsatmaydi — saqlaydi. Ko'rsatish View ishi. Baza = Model.",
      2: "Controller boshqaruvchi mantiq. Baza esa ma'lumot ombori — Model.",
      3: "Aksincha — baza aynan MVC'ning M (Model) qismi.",
      default: "Database = Model."
    }} />
);

// ===== SCREEN 9 — MONOLIT =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ko'lam · monolit" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Plus/minusni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Monolit</span> — hammasi bitta katta ilovada.</h2></div>
        <Mentor>MVC — kodni ICHKARIDA tashkil qiladi. Monolit/mikroservis esa tizimning KO'LAMI haqida. Monolit — bitta katta restoran hamma taomni qiladi. Tugmani bosing.</Mentor>
        <div className="fade-up"><div className="mono-wrap"><div className="mono-block">🏢 mini-do'kon<br /><span style={{ fontWeight: 500, fontSize: 12, opacity: 0.85 }}>Frontend + Backend + Baza — hammasi bitta loyihada</span></div></div></div>
        <Zoomable><div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Plus va minusi?"}</button>
            {show && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aksariyat loyihalar monolitdan boshlanadi — bu normal va to'g'ri.</p></div>}
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="frame-success" style={{ padding: '10px 14px' }}><p className="body" style={{ margin: 0, color: T.ink }}>✅ <b>Plus:</b> sodda, tez boshlanadi, bitta joyda deploy, oson tushuniladi.</p></div>
                  <div className="frame-warn"><p className="body" style={{ margin: 0, color: T.ink }}>⚠️ <b>Minus:</b> juda kattalashsa og'irlashadi; bitta xato butun tizimni to'xtatishi mumkin.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — MIKROSERVIS + BO'LINISH ANIMATSIYA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [split, setSplit] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = split;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ko'lam · mikroservis" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Monolitni bo'ling"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Mikroservis</span> — ko'p mustaqil kichik xizmat.</h2></div>
        <Mentor>Tizim juda kattalashganda, uni mustaqil bo'laklarga ajratamiz — har biri o'z ishini qiladi (food-court kabi). Tugmani bosib, monolit qanday bo'linishini ko'ring.</Mentor>
        <div className="fade-up"><div className="mono-wrap">
          {!split
            ? <div className="mono-block big">🏢 Bitta katta ilova<br /><span style={{ fontWeight: 500, fontSize: 12, opacity: 0.85 }}>hammasi birga</span></div>
            : <div className="micro-row">{MICRO_SERVICES.map((s, i) => <div key={s.id} className="micro-svc" style={{ borderTopColor: s.color, animationDelay: `${i * 0.1}s` }}>{s.label}<span className="micro-tag">mustaqil</span></div>)}</div>}
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={split} onClick={() => { setSplit(true); setSc(n => n + 1); }}>{split ? '✓ Bo\'lindi' : "✂️ Mikroservislarga bo'lish"}</button>
            {split && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har xizmat alohida ishlaydi, alohida deploy bo'ladi, alohida jamoa qaraydi.</p></div>}
          </Col>
          <Col>
            {split
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="frame-success" style={{ padding: '10px 14px' }}><p className="body" style={{ margin: 0, color: T.ink }}>✅ <b>Plus:</b> mustaqil miqyoslash; bitta xato faqat o'z xizmatini to'xtatadi; katta jamolar alohida ishlaydi.</p></div>
                  <div className="frame-warn"><p className="body" style={{ margin: 0, color: T.ink }}>⚠️ <b>Minus:</b> murakkab; ko'p harakatlanuvchi qism; kichik loyihaga ortiqcha.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — ilova bo'linadi →</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (global) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Yangi, kichik loyiha boshlayapsiz, jamoa kichik. Monolit yoki mikroservis?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yangi, <span className="italic" style={{ color: T.accent }}>kichik</span> loyiha, kichik jamoa. Monolit yoki mikroservis?</h2></>}
    options={["Monolit — sodda va tez boshlanadi; keyin kerak bo'lsa bo'lasiz", "Mikroservis — har doim zamonaviyroq va yaxshiroq", "Ikkalasini birga — har ehtimolga qarshi", "Farqi yo'q — tasodifiy tanlash mumkin"]} correctIdx={0}
    explainCorrect="To'g'ri! Kichik loyihaga monolit — sodda, tez va arzon. Mikroservis murakkablik qo'shadi, u faqat tizim juda kattalashganda kerak. «Over-engineering qilma» — professional qoida."
    explainWrong={{
      1: "Mikroservis har doim yaxshi emas — u kichik loyihaga ortiqcha murakkablik. Avval monolit.",
      2: "Ikkalasini birga qilish — eng murakkab va keraksiz yo'l. Soddadan boshlang.",
      3: "Farqi bor: kichik loyihaga monolit aniq to'g'ri tanlov. Soddalik g'olib.",
      default: "Kichik loyihaga monolit — soddadan boshlang."
    }} />
);

// ===== SCREEN 12 — PATTERN MATCHER =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(storedAnswer ? SYSTEMS.length : 0);
  const [wrong, setWrong] = useState(false);
  const [sc, setSc] = useState(0);
  const done = idx >= SYSTEMS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = done ? null : SYSTEMS[idx];
  const choose = (ans) => {
    if (done) return;
    if (ans === cur.ans) { setWrong(false); setIdx(n => n + 1); setSc(n => n + 1); }
    else { setWrong(true); setTimeout(() => setWrong(false), 450); }
  };
  return (
    <Stage eyebrow="Hayotiy · pattern topish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tasniflang (${idx}/${SYSTEMS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tizimni tasvirga qarab <span className="italic" style={{ color: T.accent }}>tasniflang</span>.</h2></div>
        <Mentor>Mana arxitektorning ishi: tizim tasvirini o'qib, qaysi pattern ekanini aytish. Har tizimni o'qing va monolit yoki mikroservis ekanini tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            {cur
              ? <div className="frame" key={cur.id} style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>🧩 Tizim {idx + 1}/{SYSTEMS.length}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Barchasi to'g'ri! Endi tizim tasvirini o'qib, uning patternini ayta olasiz — bu arxitektor mahorati.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qaysi pattern?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className={`pick-row ${wrong ? 'shake' : ''}`} disabled={done} onClick={() => choose('mono')}><span style={{ marginRight: 6 }}>🏢</span><span style={{ flex: 1 }}>Monolit <span style={{ color: T.ink3, fontWeight: 500 }}>· bitta katta ilova</span></span><span className="pick-plus">+</span></button>
              <button className={`pick-row ${wrong ? 'shake' : ''}`} disabled={done} onClick={() => choose('micro')}><span style={{ marginRight: 6 }}>🧩</span><span style={{ flex: 1 }}>Mikroservis <span style={{ color: T.ink3, fontWeight: 500 }}>· ko'p mustaqil xizmat</span></span><span className="pick-plus">+</span></button>
            </div>
            {wrong && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qaytadan o'ylang: bitta loyihami yoki ko'p mustaqil xizmatmi?</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — PATTERN BILAN TA'RIFLASH =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Mahorat · til" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Farqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tizimingizni <span className="italic" style={{ color: T.accent }}>bir jumlada</span> ta'riflang.</h2></div>
        <Mentor>Pattern — umumiy til. Tizimingizni 100 fayl orqali emas, bir nechta tanish so'z bilan tushuntirasiz. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="note-h" style={{ color: T.danger }}>🙈 Patternsiz</p><p className="body" style={{ margin: 0, color: T.ink }}>«Bu yerda fayl bor, u boshqasini chaqiradi, keyin bazaga... » — uzoq, chalkash.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Pattern bilan-chi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step" style={{ borderLeftColor: T.success }}>
                  <span className="agent-lbl" style={{ color: T.success }}>🎯 PATTERN BILAN</span>
                  <p className="agent-msg" style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, marginBottom: 8 }}>«MVC monolit: React (View), Nest (Controller), PostgreSQL (Model).»</p>
                  <p className="agent-msg">→ Bir jumla. Har bir dasturchi va AI darrov tushunadi. Mana arxitektura tili.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yangi loyiha boshlashdan oldin AI'ga «MVC monolit qur» desangiz — u to'g'ri tuzilishni darrov yaratadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (global) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Million foydalanuvchili tizim; to'lov va qidiruv alohida miqyoslanishi kerak. Qaysi pattern?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Million foydalanuvchi; har qism <span className="italic" style={{ color: T.accent }}>alohida miqyoslanishi</span> kerak. Qaysi pattern?</h2></>}
    options={["Mikroservis — har xizmat mustaqil miqyoslanadi va deploy bo'ladi", "Monolit — har doim eng yaxshi tanlov", "Hech qanday pattern kerak emas", "MVC yetarli — ko'lam muhim emas"]} correctIdx={0}
    explainCorrect="To'g'ri! Katta ko'lamda, har qism alohida yuklanganda mikroservis kerak: to'lov xizmatini alohida kuchaytirasiz, qidiruvni alohida. Mustaqillik — mikroservisning asosiy kuchi."
    explainWrong={{
      1: "Monolit kichikda yaxshi, lekin million foydalanuvchi va mustaqil miqyoslashda u og'irlashadi. Bu yerda mikroservis.",
      2: "Aksincha — bunday katta tizimda pattern juda muhim. Mikroservis kerak.",
      3: "MVC kodni ichkarida tashkil qiladi, lekin ko'lam (miqyoslash) masalasini hal qilmaydi. Bu yerda mikroservis.",
      default: "Katta, mustaqil miqyoslash — mikroservis."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: MVC oqimi =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "MVC so'rov oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: MVC so'rov oqimini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>MVC'da so'rov qanday yuradi? Eslang: foydalanuvchi so'rov yuboradi → Controller qabul qiladi → Model'dan ma'lumot → View ko'rsatadi → foydalanuvchiga. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">MVC oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>So'rov → Controller → Model → View → Foydalanuvchiga</b>. Mana MVC patternining ishlash tartibi.</p></div>}
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
    "Pattern — kodni tashkil qilishning sinab ko'rilgan andozasi",
    "MVC: Model (ma'lumot) + View (ko'rinish) + Controller (boshqaruvchi)",
    "Sizning mini-do'koningiz: Front=View, Back=Controller, DB=Model",
    "Monolit — bitta katta ilova (soddadan boshlang); mikroservis — ko'p mustaqil xizmat (katta ko'lam)",
    "Tizimni pattern bilan ta'riflash — umumiy til (AI/jamoa darrov tushunadi)"
  ];
  const HOMEWORK = [
    { b: "Ta'riflang", t: "— o'z loyihangizni bir jumlada: qaysi pattern (MVC?), monolitmi yoki mikroservis?" },
    { b: 'Moslang', t: "— komponentlaringizni Model/View/Controller rollariga ajrating" },
    { b: "Qaror", t: "— loyihangiz uchun monolit yetadimi yoki mikroservis kerakmi? Nega?" }
  ];
  const GLOSSARY = [
    { b: 'pattern', t: '— tashkil qilishning tayyor andozasi' },
    { b: 'MVC', t: '— Model-View-Controller' },
    { b: 'Model', t: '— ma\'lumot va qoidalar (DB)' },
    { b: 'View', t: '— ko\'rinish (frontend)' },
    { b: 'Controller', t: '— boshqaruvchi mantiq (backend)' },
    { b: 'monolit', t: '— bitta katta ilova' },
    { b: 'mikroservis', t: '— ko\'p mustaqil xizmat' },
    { b: 'miqyoslash', t: '— yukni ko\'tarishga moslash' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Patternlarni o'rgandingiz</span><h2 className="title h-title fade-up d1">Endi tizimni <span className="italic" style={{ color: T.accent }}>pattern bilan</span> ta'riflaysiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! MVC rollarini, monolit↔mikroservis farqini va tizimni pattern bilan ta'riflashni o'rgandingiz." : "Yaxshi harakat! MVC rollari va monolit/mikroservis bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — AI-agent: u ham tizimning bir komponenti. Arxitekturada qayerda turadi?</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ArchPatternsLesson({ lang: langProp, onFinished }) {
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

        /* MVC HUB */
        .mvc-hub { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 4px 0; }
        .mvc-box { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 12px; padding: 12px 20px; min-width: 230px; justify-content: center; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18); font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.ink}; opacity: 0.55; transition: all 0.3s; }
        .mvc-box .mvc-tag { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 10px; color: ${T.ink3}; }
        .mvc-box.view.on { opacity: 1; transform: scale(1.05); box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -4px rgba(1,154,203,0.45); }
        .mvc-box.controller.on { opacity: 1; transform: scale(1.05); box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 22px -4px rgba(255,79,40,0.45); }
        .mvc-box.model.on { opacity: 1; transform: scale(1.05); box-shadow: inset 0 0 0 2px ${T.success}, 0 8px 22px -4px rgba(31,122,77,0.45); }
        .mvc-conn { width: 3px; height: 26px; background: rgba(167,166,162,0.4); border-radius: 2px; transition: all 0.3s; }
        .mvc-conn.on { background: ${T.accent}; box-shadow: 0 0 10px 1px rgba(255,79,40,0.6); animation: conn-pulse 0.9s infinite ease-in-out; }
        @keyframes conn-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

        /* MONOLIT / MIKROSERVIS */
        .mono-wrap { display: flex; justify-content: center; padding: 8px 0; min-height: 90px; align-items: center; }
        .mono-block { background: ${T.ink}; color: #fff; border-radius: 14px; padding: 18px 26px; font-family: 'Manrope'; font-weight: 700; font-size: 15px; text-align: center; line-height: 1.4; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.35); }
        .mono-block.big { padding: 24px 40px; }
        .micro-row { display: flex; gap: 9px; flex-wrap: wrap; justify-content: center; }
        .micro-svc { background: ${T.paper}; border-radius: 12px; padding: 13px 15px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.2); border-top: 3px solid ${T.accent}; display: flex; flex-direction: column; gap: 3px; align-items: center; animation: micro-pop 0.5s ease both; }
        .micro-svc .micro-tag { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 9px; color: ${T.success}; }
        @keyframes micro-pop { from { opacity: 0; transform: translateY(10px) scale(0.88); } to { opacity: 1; transform: none; } }

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
