import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// TIZIMNI YAXLIT YIG'AMAN MODULI · DARS 4 (T4) — CLAUDE SKILLS (TAYYOR SKILL O'QISH) — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi Claude Skill nima ekanini, SKILL.md tuzilishini (frontmatter: name/description + body) va Skill AI
//         xulqini qanday o'zgartirishini tushunadi. Tayyor Skill'ni o'qiydi va tahlil qiladi.
// Aniqlik: Skill = SKILL.md fayl (YAML frontmatter name+description, Markdown body yo'riqnoma + misol). Progressive disclosure:
//          Claude doim faqat name+description'ni ko'radi; to'liq body vazifa description'ga mos kelganda yuklanadi.
// Metafora: Skill = AI-ishchiga bergan yozma yo'riqnoma/qo'llanma (bir marta yoz, har safar shu usulda bajaradi).
// Signature animatsiyalar: SKILL.md reveal, Progressive disclosure (skill javoni), Before/After (skillsiz vs skill bilan).
// Davomi: T3 (agent/AI xulqi). Ko'prik: T5 (o'z Skill'ingni yozish). Mahsulot: mini-do'kon "mahsulot-tavsifi" skilli.
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

const LESSON_META = { lessonId: 'claude-skills-04-v16', lessonTitle: { uz: 'Claude Skills — nima va qanday', ru: 'Claude Skills' } };
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

const SkillMd = ({ minH }) => (
  <CodeFile name="SKILL.md" minH={minH}>
    <Cm>{'---'}</Cm>{'\n'}
    <At>name</At>{': mahsulot-tavsifi'}{'\n'}
    <At>description</At>{': '}<St>Mini-do'kon mahsulotlari uchun qisqa sotuvchi tavsif yozish. Mahsulot nomi berilganda ishlatiladi.</St>{'\n'}
    <Cm>{'---'}</Cm>{'\n\n'}
    <Kw>{'# Mahsulot tavsifi yozish'}</Kw>{'\n'}
    {'1. Aniq 3 jumla yoz.'}{'\n'}
    {'2. Iliq, do\'stona ohang, 1 ta emoji.'}{'\n'}
    {'3. Materiali / asosiy ustunligini ayt.'}{'\n'}
    {'4. Narxni eslat.'}{'\n'}
    {'5. Oxirida: "Savatga qo\'shing!"'}{'\n\n'}
    <Cm>{'Misol: "Yengil charm hamyon 👜 Kundalik uchun ideal.'}</Cm>{'\n'}
    <Cm>{'Atigi 120 000 so\'m — Savatga qo\'shing!"'}</Cm>
  </CodeFile>
);

// ============================================================ MAVZU MA'LUMOTLARI

// ===== SKILL.md QISMLARI (s3) =====
const SKILL_PARTS = [
  { id: 'fm', ico: '🪪', label: 'Frontmatter', tok: '--- name / description ---', desc: "Skillning «pasporti» — yuqoridagi --- orasidagi qism. Claude buni DOIM ko'radi." },
  { id: 'desc', ico: '🎯', label: 'description', tok: 'description: ...', desc: "Skill NIMA qiladi va QACHON ishlatiladi. Eng muhim qator — Claude shunga qarab skillni tanlaydi." },
  { id: 'body', ico: '📋', label: 'Body (yo\'riqnoma)', tok: '# qadamlar + misol', desc: "AI bajaradigan aniq qadamlar va misol. Faqat skill ishlatilganda to'liq yuklanadi." }
];

// ===== PROGRESSIVE DISCLOSURE (s10) =====
const SHELF = [
  { id: 'desc', name: 'mahsulot-tavsifi', d: "mahsulot tavsifi yozish", body: "3 jumla, iliq ohang, narx, «Savatga qo'shing!»", match: true },
  { id: 'email', name: 'mijoz-xati', d: "mijozga rasmiy email yozish", body: "", match: false },
  { id: 'sql', name: 'hisobot-sql', d: "sotuv hisoboti uchun SQL yozish", body: "", match: false }
];

// ===== ANALYZE (s12) =====
const ANALYZE = [
  { id: 'desc', q: 'description aniqmi?', a: "Ha — «mahsulot tavsifi yozish, mahsulot nomi berilganda» aniq aytadi qachon ishlatishni. Claude adashmaydi." },
  { id: 'steps', q: 'Qadamlar aniqmi?', a: "Ha — 3 jumla, ohang, narx, yakun. AI taxmin qilmaydi — aniq bajaradi." },
  { id: 'example', q: 'Misol bormi?', a: "Ha — bitta tayyor misol. Misol AI uchun eng kuchli yo'riqnoma: u shunga taqlid qiladi." }
];

// ===== SKILL LIFECYCLE (final s15) =====
const FLOW = [
  { id: 'task', ico: '📩', label: 'Vazifa keladi', d: "foydalanuvchi so'rov beradi." },
  { id: 'match', ico: '🔍', label: 'description mos', d: "Claude qaysi skill kerakligini topadi." },
  { id: 'load', ico: '📂', label: 'Skill yuklanadi', d: "to'liq yo'riqnoma (body) o'qiladi." },
  { id: 'follow', ico: '✅', label: "Yo'riqnomaga amal", d: "AI sizning usulingizda bajaradi." },
  { id: 'result', ico: '✨', label: 'Izchil natija', d: "har safar bir xil sifat." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['load', 'task', 'result', 'match', 'follow'];

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Har safar uzun ko'rsatma yozib beraman — boshqa yo'li yo'q" },
    { id: 'b', label: "Bir marta yozma yo'riqnoma (Skill) beraman — har safar shunga amal qiladi" },
    { id: 'c', label: "Iloji yo'q — AI har doim har xil ishlaydi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Dars · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>AI'dan «mahsulot tavsifi yoz» dedingiz. Har safar <span className="italic" style={{ color: T.accent }}>boshqacha</span> chiqyapti. Nega?</h1>
        <Mentor>AI miyani o'tgan darsda ko'rdik. Lekin uni har doim SIZNING usulingizda ishlatish — alohida mahorat. Tugmani bosing — muammoni ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="sk-info" style={{ borderLeft: `4px solid ${T.danger}` }}>
              <p className="note-h" style={{ color: T.danger }}>❌ Yo'riqnomasiz — har safar har xil</p>
              {tried ? <div className="fade-step"><p className="body" style={{ margin: '0 0 6px', color: T.ink }}>1-marta: «Bu ajoyib mahsulot bo'lib, sizga juda yoqadi va...» (uzun)</p><p className="body" style={{ margin: 0, color: T.ink }}>2-marta: «Hamyon. Narxi 120000.» (quruq)</p></div>
                : <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>…</p>}
            </div>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Muammoni ko\'rdingiz' : "▶ Ikki marta so'rab ko'rish"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>AI'ni har safar bir xil ishlatish-chi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>Claude Skill</b> — AI'ga bergan yozma yo'riqnoma (qo'llanma). Bir marta yozasiz — AI har safar aynan shunga amal qiladi. Bugun tayyor skillni o'qib, tahlil qilamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Skill nima — AI uchun yozma yo'riqnoma", tag: 'tushuncha' },
    { text: "SKILL.md tuzilishi: frontmatter + body", tag: 'struktura' },
    { text: "Skill AI xulqini qanday o'zgartiradi", tag: 'xulq' },
    { text: "Tayyor skillni o'qish va tahlil qilish", tag: 'tahlil' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars davomida — shu skillni o'qiymiz</p>
      <SkillMd minH={0} />
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
        <div className="head"><h2 className="title h-title fade-up">AI'ga <span className="italic" style={{ color: T.accent }}>qo'llanma</span> beramiz: Claude Skill.</h2></div>
        <Mentor>Skill — bu zamonaviy va juda foydali narsa. Siz AI-ishchingizga bir marta aniq <b style={{ color: T.ink }}>yozma yo'riqnoma</b> berasiz, u esa har safar shunga amal qiladi. Bugun tayyorini o'qib, qanday tuzilganini tahlil qilamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Skillni ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — SKILL NIMA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · skill" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Misolni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Skill — AI uchun <span className="italic" style={{ color: T.accent }}>yozma yo'riqnoma</span>.</h2></div>
        <Mentor>Yangi xodimni tasavvur qiling: unga «bizda ishlar shunday qilinadi» degan qo'llanma berasiz. Skill — aynan shu, lekin AI uchun. Bir marta yozasiz, qayta-qayta ishlatasiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="note-h" style={{ color: T.accent }}>📋 Skill nima?</p><p className="body" style={{ margin: 0, color: T.ink }}>Bitta papkadagi <span className="mono">SKILL.md</span> fayl — AI'ga muayyan vazifani sizning usulingizda qanday bajarishni o'rgatadigan yo'riqnoma (va kerak bo'lsa, qo'shimcha fayllar).</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Hayotdan misol?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🧑‍🍳 <b>Oshpazga:</b> retsept kartasi — har safar bir xil taom chiqadi</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🧑‍💼 <b>Xodimga:</b> ish qo'llanmasi — «bizda shunday qilinadi»</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🤖 <b>AI'ga:</b> Skill — vazifani sizning usulingizda bajarish yo'riqnomasi</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Farqi: prompt — bir martalik gap; Skill — saqlanadigan, qayta ishlatiladigan yo'riqnoma. Endi uning ichini ochamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — SKILL.md TUZILISHI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SKILL_PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= SKILL_PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = SKILL_PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Struktura · SKILL.md" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 qismni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor skillni <span className="italic" style={{ color: T.accent }}>o'qiymiz</span>: 3 qismi bor.</h2></div>
        <Mentor>Mana mini-do'kon uchun haqiqiy skill. Ikki qismdan iborat: <b style={{ color: T.ink }}>frontmatter</b> (pasport) va <b style={{ color: T.ink }}>body</b> (yo'riqnoma). Har qismni bosib, vazifasini oching.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <SkillMd minH={150} />
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {SKILL_PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}{p.ico} {p.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 17, marginRight: 6 }}>{cur.ico}</span>{cur.label} <span className="mono" style={{ color: T.accent, fontSize: 11, marginLeft: 6 }}>{cur.tok}</span></p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Oddiy matn fayl — lekin kuchli. Frontmatter Claude'ga «bu nima» deydi, body esa «qanday qilish»ni.</p></div>}
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
    questionText="Skill AI xulqini qanday o'zgartiradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Skill AI <span className="italic" style={{ color: T.accent }}>xulqini</span> qanday o'zgartiradi?</h2></>}
    options={["Unga aniq yo'riqnoma (qadamlar) yuklaydi — AI shu bo'yicha izchil bajaradi", "AI'ni tezroq qiladi", "AI modelini o'zgartiradi (kuchliroq qiladi)", "Internetga ulaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! Skill — bu yo'riqnoma. Vazifa unga mos kelganda Claude skill ko'rsatmalarini o'qiydi va aynan shu bo'yicha ishlaydi. Shuning uchun natija izchil va sizning usulingizda chiqadi."
    explainWrong={{
      1: "Skill tezlikni o'zgartirmaydi — u xulqni (qanday bajarishni) belgilaydi.",
      2: "Skill modelni almashtirmaydi — u o'sha AI'ga aniq ko'rsatma beradi.",
      3: "Internet bilan bog'liq emas — Skill bu yo'riqnoma matni.",
      default: "Skill AI'ga aniq yo'riqnoma yuklaydi."
    }} />
);

// ===== SCREEN 5 — DESCRIPTION ENG MUHIM =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Frontmatter · description" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Nega muhim?"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>description</span> — skillning eng <span className="italic" style={{ color: T.accent }}>muhim</span> qatori.</h2></div>
        <Mentor>Claude'da o'nlab skill bo'lishi mumkin. U qaysi birini ishlatishni qayerdan biladi? Aynan <b style={{ color: T.ink }}>description</b>dan. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="prompt-card" style={{ borderLeftColor: T.accent }}><span className="prompt-who" style={{ color: T.accent }}>description</span><p className="prompt-text">Mini-do'kon mahsulotlari uchun qisqa sotuvchi tavsif yozish. Mahsulot nomi berilganda ishlatiladi.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Description nega muhim?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🔍 <b>Qachon:</b> «mahsulot nomi berilganda» — Claude shunga qarab bu skillni tanlaydi.</p></div>
                  <div className="agent-card"><span className="agent-lbl">💡 PROGRESSIVE DISCLOSURE (bosqichma-bosqich ochilish)</span><p className="agent-msg">Claude DOIM faqat skill nomi va description'ini ko'radi (arzon). To'liq body esa faqat vazifa mos kelganda yuklanadi. Shuning uchun description aniq bo'lishi shart.</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Noaniq description → Claude skillni ishlatmaydi yoki noto'g'ri ishlatadi. Aniq description → to'g'ri vaqtda ishga tushadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — BODY (yo'riqnoma) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Body · yo'riqnoma" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Qadamlarni o'qing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Body — AI bajaradigan <span className="italic" style={{ color: T.accent }}>aniq qadamlar</span>.</h2></div>
        <Mentor>Body — skillning «yuragi»: aniq, qadam-baqadam ko'rsatma + misol. Qancha aniq bo'lsa — natija shuncha bashorat qilinadigan. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="SKILL.md (body)" minH={120}>
              <Kw>{'# Mahsulot tavsifi yozish'}</Kw>{'\n'}
              {'1. Aniq 3 jumla yoz.'}{'\n'}
              {'2. Iliq ohang, 1 ta emoji.'}{'\n'}
              {'3. Materiali / ustunligini ayt.'}{'\n'}
              {'4. Narxni eslat.'}{'\n'}
              {'5. "Savatga qo\'shing!" bilan yakunla.'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Nega bunday aniq?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🔢 <b>Raqamlangan qadamlar:</b> AI ularni aniq bajaradi — hech narsa tashlab ketmaydi.</p></div>
                  <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>✨ <b>Misol:</b> body oxiridagi namuna — AI uchun eng kuchli ko'rsatma (taqlid qiladi).</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Noaniq body («yaxshi tavsif yoz») → har xil natija. Aniq qadamlar + misol → izchil natija.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — BEFORE / AFTER =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Natija · skillsiz vs skill" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Farqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir xil so'rov — <span className="italic" style={{ color: T.accent }}>skillsiz</span> va <span className="italic" style={{ color: T.accent }}>skill bilan</span>.</h2></div>
        <Mentor>«Charm hamyon uchun tavsif yoz» — bir xil so'rov, lekin natija juda farq qiladi. Tugmani bosib solishtiring.</Mentor>
        <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Solishtirildi' : "▶ Ikki natijani ko'rish"}</button>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="sk-info" style={{ borderLeft: `4px solid ${T.danger}` }}><p className="note-h" style={{ color: T.danger }}>❌ Skillsiz</p>{show ? <p className="body fade-step" style={{ margin: 0, color: T.ink }}>«Ushbu yuqori sifatli charm hamyon zamonaviy dizayni bilan ajralib turadi va uzoq muddat xizmat qiladi, shuningdek...» (uzun, quruq, narxsiz)</p> : <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>…</p>}</div>
          </Col>
          <Col>
            <div className="sk-info" style={{ borderLeft: `4px solid ${T.success}` }}><p className="note-h" style={{ color: T.success }}>✅ Skill bilan</p>{show ? <p className="body fade-step" style={{ margin: 0, color: T.ink }}>«Yengil va pishiq charm hamyon 👜 Kundalik foydalanish uchun ideal. Atigi 120 000 so'm — Savatga qo'shing!» (3 jumla, iliq, narxli)</p> : <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>…</p>}</div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil AI, bir xil so'rov — lekin skill natijani sizning standartingizga soldi. Mana skill kuchi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="SKILL.md'dagi description nima uchun kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>SKILL.md'dagi <span className="mono" style={{ color: T.accent }}>description</span> nima uchun?</h2></>}
    options={["Claude qachon shu skillni ishlatishni biladi — vazifaga mos kelsa tanlaydi", "Skillni chiroyli ko'rsatish uchun", "Faqat odam o'qishi uchun, Claude ko'rmaydi", "AI modelini tanlash uchun"]} correctIdx={0}
    explainCorrect="To'g'ri! description — skillning eng muhim qatori: Claude DOIM uni ko'radi va vazifa unga mos kelsa, skillni ishga soladi. Noaniq description → skill noto'g'ri ishlaydi yoki umuman ishlamaydi."
    explainWrong={{
      1: "Description bezak emas — u Claude uchun «qachon ishlat» signali.",
      2: "Aksincha — Claude description'ni doim o'qiydi; aynan shunga qarab skillni tanlaydi.",
      3: "Description model tanlamaydi — u skillni qachon ishlatishni belgilaydi.",
      default: "Description — Claude qachon skillni ishlatishini bildiradi."
    }} />
);

// ===== SCREEN 9 — SKILL vs SYSTEM PROMPT =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Farq · skill vs system" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Farqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Skill — <span className="italic" style={{ color: T.accent }}>system prompt</span>'dan farqi?</h2></div>
        <Mentor>Modul 8'da system prompt'ni ko'rdik (botning doimiy shaxsi). Skill biroz boshqacha — kerak bo'lganda yuklanadigan maxsus yo'riqnoma. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h" style={{ color: T.ink2 }}>⚙️ system prompt</p><p className="body" style={{ margin: 0, color: T.ink }}>Doimiy shaxs/ohang — har bir javobda yoqilgan turadi. «Sen samimiy yordamchisan.»</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Skill-chi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step" style={{ borderLeftColor: T.success }}><span className="agent-lbl" style={{ color: T.success }}>📋 SKILL</span><p className="agent-msg">Aniq VAZIFAGA maxsus yo'riqnoma — faqat o'sha vazifa kelganda yuklanadi. Ko'p skill bo'lishi mumkin; har biri o'z ishi uchun.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sodda: <b>system prompt — kim u (doimiy); skill — muayyan vazifani qanday qilish (kerakda).</b> Ikkalasi birga ishlaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — PROGRESSIVE DISCLOSURE ANIMATSIYA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [loaded, setLoaded] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = loaded;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Animatsiya · yuklanish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Vazifani yuboring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Claude faqat <span className="italic" style={{ color: T.accent }}>kerakli</span> skillni ochadi.</h2></div>
        <Mentor>Claude'da uchta skill bor. U doim faqat ularning nomi va description'ini ko'radi (arzon). Vazifa kelganda — faqat mos skill to'liq <b style={{ color: T.ink }}>ochiladi</b>. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.accent}` }}><p className="body" style={{ margin: 0, color: T.ink }}>📩 Vazifa: <b>«Charm hamyon uchun tavsif yoz»</b></p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={loaded} onClick={() => { setLoaded(true); setSc(n => n + 1); }}>{loaded ? '✓ Skill yuklandi' : "▶ Vazifani yuborish"}</button>
          </Col>
          <Col>
            <p className="flow-label">Claude'dagi skilllar javoni</p>
            <div className="skill-shelf">
              {SHELF.map(s => {
                const open = loaded && s.match;
                const dim = loaded && !s.match;
                return (
                  <div key={s.id} className={`skill-card ${open ? 'open' : ''} ${dim ? 'dim' : ''}`}>
                    <div className="sc-head"><span className="sc-name mono">{s.match && loaded ? '📂' : '📄'} {s.name}</span>{open && <span className="loop-badge">yuklandi ✓</span>}</div>
                    <div className="sc-desc">{s.d}</div>
                    {s.match && <div className="sc-body">▸ {s.body}</div>}
                  </div>
                );
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Faqat <b>mahsulot-tavsifi</b> ochildi (description mos keldi). Qolganlari yopiq qoldi. Shuning uchun yuzlab skill bo'lsa ham — tez va arzon.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Skillning to'liq yo'riqnomasi (body) qachon yuklanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Skillning to'liq <span className="italic" style={{ color: T.accent }}>body</span>'si qachon yuklanadi?</h2></>}
    options={["Vazifa uning description'iga mos kelganda — har doim emas", "Har bir so'rovda, doim", "Hech qachon — Claude faqat nomni ko'radi", "Faqat tunda"]} correctIdx={0}
    explainCorrect="To'g'ri! Bu — progressive disclosure. Claude doim faqat nom+description'ni ko'radi (arzon). To'liq body esa faqat vazifa o'sha skillga mos kelganda yuklanadi. Shuning uchun ko'p skill bo'lsa ham tizim tez ishlaydi."
    explainWrong={{
      1: "Har so'rovda barcha skill body'larini yuklash — bekorga sekin va qimmat. Faqat mos kelgani yuklanadi.",
      2: "Body ham yuklanadi — lekin faqat vazifa mos kelganda. Aks holda skill foydasiz bo'lardi.",
      3: "Vaqt bilan bog'liq emas — mos kelish (description) bilan bog'liq.",
      default: "Body vazifa description'ga mos kelganda yuklanadi."
    }} />
);

// ===== SCREEN 12 — CASE: tayyor skillni tahlil =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(ANALYZE.map(a => a.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= ANALYZE.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ANALYZE.find(a => a.id === active);
  return (
    <Stage eyebrow="Hayotiy · skillni tahlil" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tahlil qiling (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu skill <span className="italic" style={{ color: T.accent }}>yaxshimi</span>? O'zingiz tahlil qiling.</h2></div>
        <Mentor>Yaxshi skillni yomonidan ajratish — muhim mahorat (keyingi darsda o'zingiz yozasiz). Mana mini-do'kon skilli. 3 mezon bo'yicha tekshiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <SkillMd minH={150} />
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ANALYZE.map(a => <button key={a.id} className="gchip" onClick={() => tap(a.id)} style={seen.has(a.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(a.id) ? '✓ ' : ''}{a.q}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h">✅ {cur.q}</p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.a}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Mezonni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi skill = aniq description + aniq qadamlar + misol. Bu uchtasi bo'lsa — AI uni xatosiz bajaradi. Keyingi darsda o'zingiz shunday yozasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — NEGA KUCHLI =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const BEN = [
    { id: 'reuse', ico: '♻️', label: 'Qayta ishlatish', desc: "Bir marta yozasiz — yuz marta ishlatasiz. Har safar qaytadan tushuntirmaysiz." },
    { id: 'consist', ico: '🎯', label: 'Izchillik', desc: "Natija har doim bir xil sifat va uslubda — standart saqlanadi." },
    { id: 'share', ico: '🤝', label: 'Ulashish', desc: "Skillni jamoa bilan ulashasiz — hamma AI'dan bir xil sifat oladi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(BEN.map(b => b.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= BEN.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = BEN.find(b => b.id === active);
  return (
    <Stage eyebrow="Foyda · nega skill" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 foydani ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega Skill <span className="italic" style={{ color: T.accent }}>kuchli</span> vosita?</h2></div>
        <Mentor>Skill — zamonaviy AI ishida eng foydali g'oyalardan biri. Uchta asosiy foydasini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {BEN.map(b => <button key={b.id} className="gchip" onClick={() => tap(b.id)} style={seen.has(b.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(b.id) ? '✓ ' : ''}{b.ico} {b.label}</button>)}
            </div>
            {done && <div className="agent-card fade-step"><span className="agent-lbl">📍 KEYINGI DARS</span><p className="agent-msg">Endi o'qishni bilasiz. Keyingi darsda o'z vazifangiz uchun <b>o'z skillingizni yozasiz</b> va kontekst-injiniring bilan yaxshilaysiz.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 17, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: '6px 0 0', color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Foydani bosing ←</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (global) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Bir xil vazifani har safar AI'ga qayta-qayta tushuntirayapsiz. Eng yaxshi yechim?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bir xil vazifani AI'ga <span className="italic" style={{ color: T.accent }}>qayta-qayta</span> tushuntirayapsiz. Eng yaxshi yechim?</h2></>}
    options={["Skill yozaman — yo'riqnomani bir marta yozib, har safar qayta ishlataman", "Har safar yana qo'lda tushuntiraveraman", "AI'dan voz kechaman", "Kuchliroq model sotib olaman"]} correctIdx={0}
    explainCorrect="To'g'ri! Takrorlanuvchi vazifa — Skill uchun mukammal nomzod. Yo'riqnomani bir marta SKILL.md'ga yozasiz, keyin AI har safar shunga amal qiladi. Vaqt tejaladi va natija izchil bo'ladi."
    explainWrong={{
      1: "Qo'lda qayta-qayta tushuntirish — vaqt isrofi va natija har xil. Skill aynan shu muammoni yechadi.",
      2: "Voz kechish — yechim emas. Skill bilan AI aynan sizga kerakli ishni qiladi.",
      3: "Model masalasi emas — sizga izchillik kerak. Buni Skill beradi, kuchliroq model emas.",
      default: "Takrorlanuvchi vazifaga — Skill yozish."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: skill lifecycle =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Skill ishlash oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: Skill qanday ishlashini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Vazifa kelganda Skill qanday ishga tushadi? Eslang: vazifa keladi → description mos keladi → skill yuklanadi → AI yo'riqnomaga amal qiladi → izchil natija. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">skill oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Vazifa → description mos → yuklanadi → amal → izchil natija</b>. Mana Claude Skill ishlash mexanizmi.</p></div>}
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

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Skill — AI uchun yozma, qayta ishlatiladigan yo'riqnoma (SKILL.md fayl)",
    "Tuzilishi: frontmatter (name + description) + body (qadamlar + misol)",
    "description — Claude qachon skillni ishlatishni bildiradi (eng muhim)",
    "Progressive disclosure: body faqat vazifa mos kelganda yuklanadi",
    "Yaxshi skill = aniq description + aniq qadamlar + misol"
  ];
  const HOMEWORK = [
    { b: "O'qing", t: "— internetdan yoki shu darsdan bitta SKILL.md ni o'qib chiqing" },
    { b: 'Tahlil', t: "— uning description aniqmi? qadamlari aniqmi? misoli bormi? — baholang" },
    { b: "O'ylang", t: "— o'z loyihangizda qaysi takrorlanuvchi vazifaga skill kerak?" }
  ];
  const GLOSSARY = [
    { b: 'Skill', t: '— AI uchun yozma yo\'riqnoma' },
    { b: 'SKILL.md', t: '— skill yozilgan fayl' },
    { b: 'frontmatter', t: '— --- orasidagi name/description' },
    { b: 'description', t: '— skill nima va qachon ishlatiladi' },
    { b: 'body', t: '— qadamlar va misol (yo\'riqnoma)' },
    { b: 'progressive disclosure', t: '— body kerakda yuklanadi' },
    { b: 'izchillik', t: '— har safar bir xil sifat' },
    { b: 'qayta ishlatish', t: '— bir marta yoz, ko\'p ishlat' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Skill o'qishni o'rgandingiz</span><h2 className="title h-title fade-up d1">Endi AI'ga <span className="italic" style={{ color: T.accent }}>qo'llanma</span> bera olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! SKILL.md tuzilishini, description rolini va progressive disclosure'ni o'rgandingiz va tayyor skillni tahlil qildingiz." : "Yaxshi harakat! SKILL.md tuzilishi va description (qachon yuklanadi) bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — O'z Skill'ingizni yozasiz: struktura, test va kontekst-injiniring bilan yaxshilash.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ClaudeSkillsLesson({ lang: langProp, onFinished }) {
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
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.7; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }

        /* PICK ROWS */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 11px 13px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; }

        /* AGENT / AI CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }

        /* PROMPT CARD */
        .prompt-card { background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); border-left: 4px solid ${T.amber}; }
        .prompt-who { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.amber}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .prompt-text { font-family: 'JetBrains Mono'; font-size: clamp(11.5px,1.4vw,13px); color: ${T.ink}; margin: 0; line-height: 1.6; }

        .loop-badge { display: inline-flex; align-items: center; gap: 4px; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: ${T.success}; background: ${T.successSoft}; padding: 3px 9px; border-radius: 99px; }

        /* SKILL SHELF (progressive disclosure) */
        .skill-shelf { display: flex; flex-direction: column; gap: 8px; }
        .skill-card { background: ${T.paper}; border-radius: 11px; padding: 11px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); border-left: 3px solid ${T.ink3}; transition: all 0.35s; }
        .skill-card .sc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .skill-card .sc-name { font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .skill-card .sc-desc { font-size: 12px; color: ${T.ink2}; margin-top: 2px; }
        .skill-card .sc-body { max-height: 0; overflow: hidden; opacity: 0; transition: max-height 0.45s cubic-bezier(.4,0,.2,1), opacity 0.3s ease, margin-top 0.3s ease; font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .skill-card.open { border-left-color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.3); }
        .skill-card.open .sc-body { max-height: 80px; opacity: 1; margin-top: 8px; }
        .skill-card.dim { opacity: 0.45; }

        /* CYC (final) */
        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 84px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
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
