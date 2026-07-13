import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 09 · PM2 — ETIKA VA MAS'ULIYAT (AI-mahsulot) — v16 (AUDIOSIZ)
// G'oya: AI-mahsulot bilan nima noto'g'ri ketishi mumkin; PM riskar uchun MAS'UL; cheklov (guardrail) = mahsulot qarori.
// Mahsulot: o'quvchi o'z AI-agenti risklari + himoya choralarini yozadi (risk register).
// Joylashuv: T4 (Claude Skills) dan keyin. Davomiy misol: mini-do'kon AI-agenti (M8 P5 davomi).
// Falsafa: SIZ — DIREKTOR. AI qilgani uchun SIZ javobgarsiz. Cheklov = zaiflik emas, himoya.
// Signature 1: Risk register quruvchi (Risk → Himoya). Signature 2: Guardrail demo (xavfli buyruq, guard off/on).
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
  shield: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>),
  warn: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 4L2 20h20z" /><path d="M12 10v5M12 18h.01" /></svg>),
  lock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  scale: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3v18M7 21h10M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0zM19 7l-2.5 6a3 3 0 0 0 5 0z" /></svg>),
  bolt: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" /></svg>)
};

const LESSON_META = { lessonId: 'pm-ethics-23-v16', lessonTitle: { uz: 'Etika va mas\'uliyat — AI-mahsulot', ru: 'Этика и ответственность продукта' } };
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
// Risk katalogi (s2)
const RISKS = [
  { id: 'hallu', label: 'Gallyutsinatsiya', emoji: '🌀', color: T.grape, what: 'AI ishonch bilan noto\'g\'ri ma\'lumot o\'ylab topadi.', ex: 'Agent mavjud bo\'lmagan «90% chegirma» yoki soxta narxni aytadi.' },
  { id: 'harm', label: 'Zararli amal', emoji: '💥', color: T.accent, what: 'Agent qaytarib bo\'lmaydigan zarar qiladi.', ex: '«Tozala» buyrug\'iga hamma buyurtmani o\'chirib yuboradi.' },
  { id: 'privacy', label: 'Maxfiylik sizishi', emoji: '🔓', color: T.honey, what: 'AI shaxsiy ma\'lumotni oshkor qiladi.', ex: 'Mijozning telefon raqami yoki manzilini begonaga beradi.' },
  { id: 'trust', label: 'Ko\'r-ko\'rona ishonch', emoji: '🙈', color: T.blue, what: 'Foydalanuvchi AI javobini tekshirmay ishonadi.', ex: 'Egasi agent bergan noto\'g\'ri hisobotga qarab qaror qiladi.' }
];

// Risk register (s6, s13)
const REGISTER = [
  { id: 'r1', risk: 'Soxta narx yoki chegirma o\'ylab topadi', emoji: '🌀', color: T.grape, fix: 'Narxni faqat bazadan olsin — o\'zi raqam to\'qimasin.' },
  { id: 'r2', risk: 'Buyurtmalarni o\'chirib yuborishi mumkin', emoji: '💥', color: T.accent, fix: 'O\'chirish/bekor qilishga inson tasdig\'i shart (human-in-the-loop).' },
  { id: 'r3', risk: 'Mijoz ma\'lumotini sizdiradi', emoji: '🔓', color: T.honey, fix: 'Shaxsiy ma\'lumotni hech kimga bermasin — faqat egaga.' },
  { id: 'r4', risk: 'Javobiga ko\'r-ko\'rona ishoniladi', emoji: '🙈', color: T.blue, fix: 'Aniq bo\'lmasa «aniq emas» desin; muhim qarorni odam tasdiqlasin.' }
];

// Guardrail demo (s8)
const GUARD_SCEN = [
  { id: 'del', user: 'Hamma buyurtmani o\'chir', off: { icon: '💥', text: '247 buyurtma butunlay o\'chirildi — qaytarib bo\'lmaydi.' }, on: { icon: '🛡️', text: 'Bu 247 buyurtmani butunlay o\'chiradi (qaytarib bo\'lmaydi). Tasdiqlaysizmi? [Ha / Yo\'q]' } },
  { id: 'phone', user: 'Bu mijozning telefon raqamini menga ber', off: { icon: '🔓', text: '+998 90 123 45 67 — raqam begonaga berildi.' }, on: { icon: '🛡️', text: 'Mijozning shaxsiy ma\'lumotini ulasholmayman — maxfiylik qoidasi.' } },
  { id: 'bulk', user: '10000 dona pizza buyurtma qil', off: { icon: '⚠️', text: '10000 buyurtma yuborildi — ehtimol xato, katta zarar.' }, on: { icon: '🛡️', text: 'Bu g\'ayrioddiy katta buyurtma (10000). Xato bo\'lmasligi uchun tasdiqlang.' } }
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

// Risk register hujjati (s6, s15)
const RegisterDoc = ({ rows }) => (
  <div className="reg-doc feat-pop">
    <div className="reg-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.shield(16)}</span><span>Risk register</span></div>
    {rows.map((r, i) => (
      <div key={i} className="reg-row">
        <div className="reg-risk"><span className="reg-tag" style={{ color: r.color, background: r.color + '1c' }}>{r.emoji} RISK</span><span>{r.risk}</span></div>
        <div className="reg-fix"><span className="reg-tag" style={{ color: T.success, background: T.successSoft }}>🛡️ HIMOYA</span><span>{r.fix}</span></div>
      </div>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'AI ayblidir — «u o\'zi qildi»' },
    { id: 'b', label: 'Siz — agentni siz qurib, ishga qo\'ydingiz' },
    { id: 'c', label: 'Hech kim — bu shunchaki dastur' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Agentingiz soxta <span className="italic" style={{ color: T.accent }}>«90% chegirma»</span> o'ylab topdi va mijozga aytdi. Kim javobgar?</h1>
        <Mentor>AI-mahsulot kuchli, lekin xato qilishi mumkin. Va uning xatosi — kimning mas'uliyati? Tanlang.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.accent}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.accent, fontWeight: 700 }}>🤖 AGENT (xato)</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>«Bugun maxsus: hamma pizzaga 90% chegirma! Atigi 5 000 so'm.» <br /><span className="small" style={{ color: T.ink2, fontStyle: 'normal' }}>— bunday chegirma umuman yo'q edi. Agent o'zi to'qib chiqardi.</span></p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Kim javobgar?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri javob — <b>siz</b>. Agentni siz qurdingiz va ishga qo'ydingiz; uning har amali sizning mas'uliyatingiz. Bugun: AI bilan nima noto'g'ri ketishi mumkin, mas'uliyat va <b>cheklov = himoya</b>.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'AI bilan nima noto\'g\'ri ketishi mumkin (risklar)', tag: '' },
    { text: 'Mas\'uliyat: «AI qildi» bahona emas', tag: '' },
    { text: 'Cheklov (guardrail) — mahsulot qarori', tag: 'jonli' },
    { text: 'Foydalanuvchini asrash: maxfiylik, halollik', tag: '' },
    { text: 'O\'z agentingiz risklari + himoyasini yozasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.shield(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Mas'uliyatli AI-mahsulot</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Risklarni bil, himoya qo'y, foydalanuvchini asra.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Siz direktor — agent qilgani uchun siz javobgarsiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Agentingizni mas'uliyat bilan quring</span></h2></div>
        <Mentor>Tez qurish oson — <b style={{ color: T.ink }}>xavfsiz</b> qurish direktorning ishi. Bugun shu mas'uliyatni o'rganamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — AI NIMA NOTO'G'RI QILADI (risk katalogi) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(RISKS.map(r => r.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= RISKS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? RISKS.find(r => r.id === active) : null;
  return (
    <Stage eyebrow="Risklar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${RISKS.length} riskni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI bilan <span className="italic" style={{ color: T.accent }}>nima noto'g'ri ketadi?</span></h2></div>
        <Mentor>AI-agent foydali, lekin 4 xil tarzda zarar qilishi mumkin. Har birini bosing: nima va misol.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RISKS.map(c => (<button key={c.id} onClick={() => tap(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === c.id ? `inset 0 0 0 2px ${c.color}, 0 8px 20px -8px ${c.color}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 20 }}>{c.emoji}</span><span style={{ flex: 1, fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13.5, color: T.ink }}>{c.label}</span>{seen.has(c.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.what}</p><p style={{ fontFamily: G, fontSize: 13.5, color: T.ink2, margin: '8px 0 0', fontStyle: 'italic' }}>Misol: {cur.ex}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir riskni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 risk — 4 himoya talab qiladi. Avval risklarni bilish kerak, keyin himoya.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ISHONCHLI, LEKIN NOTO'G'RI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('confident');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['confident', 'truth']) : new Set(['confident']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isConf = v === 'confident';
  return (
    <Stage eyebrow="Ishonchli ≠ to'g'ri" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI <span className="italic" style={{ color: T.accent }}>ishonch bilan</span> xato qiladi</h2></div>
        <Mentor>Eng xavfli tomoni — AI noto'g'ri javobni ham juda ishonchli aytadi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isConf ? 'chip-on' : ''}`} onClick={() => set('confident')}>🤖 AI aytgani</button>
              <button className={`chip ${!isConf ? 'chip-on' : ''}`} onClick={() => set('truth')}>✅ Haqiqat</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isConf ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{isConf
                ? '«Albatta! Bu mahsulot omborda bor, narxi 5 000 so\'m, bugun yetkazamiz.» — juda ishonchli ohang.'
                : 'Aslida bu mahsulot omborda yo\'q. AI tekshirmasdan, ishonch bilan to\'qib chiqardi.'}</p>
            </div>
          </Col>
          <Col>
            {isConf
              ? <div className="frame-warn fade-step" key="c"><p className="body" style={{ margin: 0, color: T.ink }}>Ishonchli ohang odamni chalg'itadi — «AI shunday dedi, demak rost» deb o'ylaymiz.</p></div>
              : <div className="frame-success fade-step" key="t"><p className="body" style={{ margin: 0, color: T.ink }}>Haqiqat boshqacha. Shuning uchun AI javobini tekshirish va himoya qo'yish shart.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>«Ishonchli» — «to'g'ri» degani emas. AI'ni faktlarga (baza) bog'lash kerak.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="AI-mahsulotning asosiy xavfi nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI-mahsulotning asosiy <span className="italic" style={{ color: T.accent }}>xavfi</span>?</h2></>}
    options={['U sekin ishlaydi', 'U ishonch bilan noto\'g\'ri yoki zararli natija berishi mumkin — himoya shart', 'U juda ko\'p rang ishlatadi', 'U faqat ingliz tilini biladi']} correctIdx={1}
    explainCorrect="To'g'ri! AI ishonchli ohangda noto'g'ri ma'lumot to'qishi yoki zararli amal qilishi mumkin (gallyutsinatsiya, zararli amal, maxfiylik). Shuning uchun himoya (guardrail) qo'yish shart."
    explainWrong={{ 0: 'Sekinlik — texnik masala, asosiy etik xavf emas.', 2: 'Rang — bu xavf emas.', 3: 'Til — bu cheklov, asosiy xavf emas.', default: 'Asosiy xavf — ishonchli, lekin noto\'g\'ri/zararli natija.' }} />
);

// ===== SCREEN 5 — MAS'ULIYAT =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('blame');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['blame', 'own']) : new Set(['blame']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isBlame = v === 'blame';
  return (
    <Stage eyebrow="Mas'uliyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«AI qildi» — <span className="italic" style={{ color: T.accent }}>bahona emas</span></h2></div>
        <Mentor>Agent xato qilsa, mas'uliyatni AI'ga to'nkash oson. Lekin direktor egalik qiladi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isBlame ? 'chip-on' : ''}`} onClick={() => set('blame')}>🙅 Ayblash</button>
              <button className={`chip ${!isBlame ? 'chip-on' : ''}`} onClick={() => set('own')}>🫱 Egalik</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isBlame ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{isBlame
                ? '«AI o\'zi shunday qildi, men aybdor emasman.» — lekin agentni kim qurdi va ishga qo\'ydi?'
                : '«Men agentni qo\'ydim — uning har amali mening mas\'uliyatim. Himoyani men o\'ylaganman.»'}</p>
            </div>
          </Col>
          <Col>
            {isBlame
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Ayblash — muammoni hal qilmaydi. Foydalanuvchi sizning agentingizdan zarar ko'rdi.</p></div>
              : <div className="frame-success fade-step" key="o"><p className="body" style={{ margin: 0, color: T.ink }}>Egalik — kuch beradi. Mas'ul bo'lsangiz, himoyani oldindan o'ylaysiz.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: AI sizning vositangiz. U qilgan ish — sizning qaroringiz natijasi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Agentingiz foydalanuvchiga zarar yetkazsa kim javobgar?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Agentingiz zarar yetkazsa <span className="italic" style={{ color: T.accent }}>kim</span> javobgar?</h2></>}
    options={['AI modeli', 'Siz — agentni qurib, ishga qo\'ygan PM/direktor', 'Foydalanuvchi', 'Hech kim']} correctIdx={1}
    explainCorrect="To'g'ri! Siz agentni qurdingiz, sozladingiz va ishga qo'ydingiz — uning xatti-harakati sizning mas'uliyatingiz. «AI qildi» bahona emas."
    explainWrong={{ 0: 'Model — vosita. Uni siz qo\'ydingiz.', 2: 'Foydalanuvchi — jabrlanuvchi, aybdor emas.', 3: 'Mas\'ul bor — bu siz.', default: 'Mas\'uliyat — agentni qo\'ygan PM/direktorda.' }} />
);

// ===== SCREEN 6 — RISK REGISTER QURUVCHI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [built, setBuilt] = useState(() => storedAnswer ? new Set(REGISTER.map(r => r.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'r4' : null);
  const workRef = useRef(null);
  const done = built.size >= REGISTER.length;
  const add = (id) => { setActive(id); setBuilt(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const rows = REGISTER.filter(r => built.has(r.id));
  return (
    <Stage eyebrow="Risk register · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Registerni yig'ing (${built.size}/${REGISTER.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Risk register: <span className="italic" style={{ color: T.accent }}>risk → himoya</span></h2></div>
        <Mentor>Mini-do'kon agenti uchun har riskka himoya juftlaymiz. Risklarni bosing — register yig'iladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {REGISTER.map(r => { const on = built.has(r.id); return (
                <button key={r.id} onClick={() => add(r.id)} className={`plink ${on ? 'plink-on' : ''}`}>
                  <span style={{ fontSize: 17, minWidth: 22 }}>{r.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{r.risk}</span></span>
                  <span className="plink-act">{on ? 'himoyalandi' : '+ himoya'}</span>
                </button>
              ); })}
            </div>
            {active && (<div className="sk-info fade-step" key={active} style={{ marginTop: 2 }}><p className="flow-label" style={{ margin: 0, color: T.success }}>🛡️ Himoya</p><p style={{ fontFamily: G, fontSize: 13.5, color: T.ink, margin: '6px 0 0' }}>{REGISTER.find(r => r.id === active).fix}</p></div>)}
          </Col>
          <Col>
            {rows.length === 0
              ? <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Riskni bosing — uning himoyasi bilan registerga qo'shiladi.</p></div>
              : <RegisterDoc rows={rows} />}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana risk register — har risk uchun aniq himoya. Bu hujjat agentingizni xavfsiz qiladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — CHEKLOV = MAHSULOT QARORI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('free');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['free', 'limited']) : new Set(['free']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isFree = v === 'free';
  return (
    <Stage eyebrow="Cheklov = himoya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Cheklov — zaiflik emas, <span className="italic" style={{ color: T.accent }}>funksiya</span></h2></div>
        <Mentor>Agentni cheklash — yomon emas. Aksincha, bu ataylab qilingan mahsulot qarori. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isFree ? 'chip-on' : ''}`} onClick={() => set('free')}>♾️ Cheksiz agent</button>
              <button className={`chip ${!isFree ? 'chip-on' : ''}`} onClick={() => set('limited')}>🛡️ Cheklangan agent</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isFree ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isFree
                ? '«Agent hamma narsani o\'zi qilsin — o\'chirsin, to\'lov olsin, ma\'lumot bersin. Tez bo\'lsin!» — tez, lekin bitta xato katta zarar.'
                : '«Agent taklif qiladi, lekin o\'chirish/to\'lovni odam tasdiqlaydi.» — biroz sekin, lekin xavfsiz va ishonchli.'}</p>
            </div>
          </Col>
          <Col>
            {isFree
              ? <div className="frame-warn fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>Cheksiz kuch = cheksiz xavf. Bitta noto'g'ri buyruq — qaytarib bo'lmaydigan zarar.</p></div>
              : <div className="frame-success fade-step" key="l"><p className="body" style={{ margin: 0, color: T.ink }}>Cheklov xavfli amallarga to'siq qo'yadi. Foydalanuvchi ham xotirjam.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi cheklov = mahsulot qarori. «Nimani QILMASIN» — «nima qilsin»dan kam emas.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — GUARDRAIL DEMO (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [scen, setScen] = useState('del');
  const [guard, setGuard] = useState(true);
  const [seenOn, setSeenOn] = useState(() => storedAnswer ? new Set(GUARD_SCEN.map(s => s.id)) : new Set());
  const workRef = useRef(null);
  const done = seenOn.size >= 2;
  useEffect(() => {
    if (guard) setSeenOn(prev => { if (prev.has(scen)) return prev; const n = new Set(prev); n.add(scen); return n; });
  }, [guard, scen]);
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const cur = GUARD_SCEN.find(s => s.id === scen);
  const resp = guard ? cur.on : cur.off;
  return (
    <Stage eyebrow="Guardrail demo · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Guardni yoqib 2 holatni ko'ring (${seenOn.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Guardrail: <span className="italic" style={{ color: T.accent }}>bajaradi vs to'xtaydi</span></h2></div>
        <Mentor>Xavfli buyruqni tanlang. «Guardrail» o'chiq bo'lsa agent shunchaki bajaradi; yoqilsa — to'xtaydi va himoya qiladi. Yoqib ko'ring!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {GUARD_SCEN.map(s => (<button key={s.id} className={`chip ${scen === s.id ? 'chip-on' : ''}`} onClick={() => setScen(s.id)} style={{ fontSize: 12 }}>{seenOn.has(s.id) ? '✓ ' : ''}«{s.user.length > 22 ? s.user.slice(0, 20) + '…' : s.user}»</button>))}
            </div>
            <button className={`guard-toggle ${guard ? 'on' : ''}`} onClick={() => setGuard(g => !g)}>
              <span className="gt-knob">{guard ? Ico.shield(15) : Ico.warn(15)}</span>
              <span>Guardrail: <b>{guard ? 'YOQILGAN' : 'O\'CHIQ'}</b></span>
            </button>
          </Col>
          <Col>
            <div className="agent-panel" key={scen + guard}>
              <div className="msg-row"><span className="msg-user">{cur.user}</span></div>
              <div className={`msg-row ${guard ? '' : 'shake-x'}`}><span className={`msg-agent ${guard ? 'block' : 'exec'}`}><span style={{ fontSize: 18 }}>{resp.icon}</span><span>{resp.text}</span></span></div>
            </div>
            {!guard && <p className="small" style={{ color: T.accent, margin: 0, fontWeight: 600 }}>⚠️ Guardrailsiz — agent o'ylamasdan bajardi. Guardrailni yoqing.</p>}
            {guard && <p className="small" style={{ color: T.success, margin: 0, fontWeight: 600 }}>🛡️ Guardrail — xavfli amalni to'xtatdi yoki tasdiq so'radi.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana cheklovning kuchi: o'sha agent, lekin guardrail bilan — xavfsiz. Bu siz qo'ygan himoya.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="AI-agent uchun yaxshi «cheklov» (guardrail) qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi <span className="italic" style={{ color: T.accent }}>cheklov</span> qaysi?</h2></>}
    options={['Agent hamma narsani so\'rovsiz, tez qilsin', 'Zararli/qaytmas amalga inson tasdig\'i; o\'z doirasida qolsin; noaniqlikni tan olsin', 'Agent hech narsa qilmasin', 'Agent javoblarini chiroyliroq yozsin']} correctIdx={1}
    explainCorrect="To'g'ri! Yaxshi cheklov: zararli/qaytmas amalga inson tasdig'i (human-in-the-loop), agent o'z doirasida qolishi va aniq bilmasa «aniq emas» deyishi. Bu xavfni kamaytiradi."
    explainWrong={{ 0: 'So\'rovsiz tez — aynan xavfli. Tasdiq kerak.', 2: 'Umuman ishlamaslik — cheklov emas, foydasizlik.', 3: 'Chiroyli yozish — himoya emas.', default: 'Tasdiq + doira + halollik.' }} />
);

// ===== SCREEN 10 — FOYDALANUVCHINI ASRA (maxfiylik) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('leak');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['leak', 'protect']) : new Set(['leak']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isLeak = v === 'leak';
  return (
    <Stage eyebrow="Foydalanuvchini asra" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Foydalanuvchi <span className="italic" style={{ color: T.accent }}>ma'lumotini asrang</span></h2></div>
        <Mentor>Agent mijoz ma'lumotlarini ko'radi: ism, telefon, manzil. Ular bilan ehtiyot bo'lish — sizning vazifangiz. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isLeak ? 'chip-on' : ''}`} onClick={() => set('leak')}>🔓 Sizdiradi</button>
              <button className={`chip ${!isLeak ? 'chip-on' : ''}`} onClick={() => set('protect')}>🔒 Asraydi</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isLeak ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{isLeak
                ? 'So\'ragan hammaga mijoz telefon raqami va manzilini beradi. Birov suiiste\'mol qilsa — javobgar siz.'
                : 'Shaxsiy ma\'lumotni faqat egaga ko\'rsatadi, begonaga bermaydi. Faqat kerakli ish uchun ishlatadi.'}</p>
            </div>
          </Col>
          <Col>
            {isLeak
              ? <div className="frame-warn fade-step" key="l"><p className="body" style={{ margin: 0, color: T.ink }}>Ma'lumot sizishi — ishonchni buzadi va zarar keltiradi. Eng og'ir etik xato.</p></div>
              : <div className="frame-success fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>Ma'lumotni asrash — foydalanuvchi ishonchini saqlaydi. Faqat keraklisini, faqat kerak joyda.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: shaxsiy ma'lumot — omonat. Agent uni kerakmas joyda oshkor qilmasin.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — AI HALOLLIGI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('invent');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['invent', 'honest']) : new Set(['invent']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isInvent = v === 'invent';
  return (
    <Stage eyebrow="AI halolligi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Bilmayman» deyish — <span className="italic" style={{ color: T.accent }}>kuch</span></h2></div>
        <Mentor>Agent javobni bilmasa nima qilsin? O'ylab topsinmi yoki rost gapirsinmi? Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isInvent ? 'chip-on' : ''}`} onClick={() => set('invent')}>🌀 O'ylab topadi</button>
              <button className={`chip ${!isInvent ? 'chip-on' : ''}`} onClick={() => set('honest')}>🙂 «Aniq emas»</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isInvent ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{isInvent
                ? '«Yetkazib berish 12:00da bo\'ladi» — aslida agent bilmaydi, ishonch bilan to\'qidi.'
                : '«Yetkazish vaqtini aniq bilmayman — egadan tekshirib aytaman.» — rost va xavfsiz.'}</p>
            </div>
          </Col>
          <Col>
            {isInvent
              ? <div className="frame-warn fade-step" key="i"><p className="body" style={{ margin: 0, color: T.ink }}>To'qilgan javob — eng xavfli, chunki ishonchli eshitiladi. Mijoz aldanadi.</p></div>
              : <div className="frame-success fade-step" key="h"><p className="body" style={{ margin: 0, color: T.ink }}>Halol «bilmayman» — noto'g'ri javobdan ming marta yaxshi. Ishonch shundan tug'iladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agentni shunday sozlang: aniq bilmasa — tan olsin, tekshirsin yoki odamga yo'naltirsin.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Qaysi — mas'uliyatli dizayn qarori?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi <span className="italic" style={{ color: T.accent }}>mas'uliyatli</span> qaror?</h2></>}
    options={['Agent har narsani so\'rovsiz, tez qilsin', 'Zararli amalga tasdiq so\'rash, shaxsiy ma\'lumotni asrash, aniq bilmasa tan olish', 'Agent ko\'proq gapirsin', 'Foydalanuvchi ma\'lumotini hammaga ko\'rsatish']} correctIdx={1}
    explainCorrect="To'g'ri! Mas'uliyatli dizayn: zararli amalga tasdiq, foydalanuvchi ma'lumotini asrash va aniq bilmaganini tan olish. Bu uchovi — foydalanuvchini himoya qiladi."
    explainWrong={{ 0: 'So\'rovsiz tez — xavfli, mas\'uliyatsiz.', 2: 'Ko\'p gapirish — himoya emas.', 3: 'Ma\'lumotni oshkor qilish — etik xato.', default: 'Tasdiq + ma\'lumotni asrash + halollik.' }} />
);

// ===== SCREEN 13 — NAMUNA (to'liq register) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(REGISTER.map((_, i) => i)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= REGISTER.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active !== null ? REGISTER[active] : null;
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${REGISTER.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq namuna: <span className="italic" style={{ color: T.accent }}>agent risk register</span></h2></div>
        <Mentor>Mini-do'kon agentining to'liq risk registeri. Har qatorni bosing — risk va himoyasini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.accent, display: 'inline-flex' }}>{Ico.shield(16)}</span><span className="cl-title">Risk register — mini-do'kon agenti</span></div>
              {REGISTER.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.emoji} RISK</span>{c.risk}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.emoji} {cur.risk}</span></span><p className="flow-label" style={{ margin: '12px 0 0', color: T.success }}>🛡️ Himoya</p><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '5px 0 0' }}>{cur.fix}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir riskni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har risk — aniq himoyasi bilan. Endi o'z agentingiz uchun shunday yozing.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Mas'uliyat: <span className="italic" style={{ color: T.accent }}>bil · egalik qil · cheKLA · asra</span></h2></div>
      <Mentor>Yodda tuting: risklarni bil, mas'uliyatni o'zingga ol, xavfli amalga cheklov qo'y, foydalanuvchini asra.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🛡️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — mas'ul direktor</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>AI sizning vositangiz; uning xavfsizligi — sizning ishingiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.warn(18), c: T.grape, t: 'RISKLARNI BIL — gallyutsinatsiya, zarar, maxfiylik' }, { ic: Ico.scale(18), c: T.accent, t: 'EGALIK QIL — «AI qildi» bahona emas' }, { ic: Ico.shield(18), c: T.honey, t: 'CHEKLOV QO\'Y — xavfli amalga tasdiq' }, { ic: Ico.lock(18), c: T.success, t: 'FOYDALANUVCHINI ASRA — ma\'lumot va halollik' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: o'z agent risk registeri =====
const emptyRows = () => [{ risk: '', fix: '' }, { risk: '', fix: '' }, { risk: '', fix: '' }];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(() => storedAnswer?.rows || emptyRows());
  const isComplete = (r) => r.risk.trim().length >= 5 && r.fix.trim().length >= 5;
  const completeCount = rows.filter(isComplete).length;
  const passed = completeCount >= 2;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, rows, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (i, k, v) => setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = rows.filter(isComplete).map(r => ({ emoji: '⚠️', color: T.accent, risk: r.risk, fix: r.fix }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>agent risk registeringiz</span></h2></div>
        <Mentor>O'z AI-agentingiz uchun kamida 2 ta risk va uning himoyasini yozing — o'ngda register yig'iladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {rows.map((r, i) => { const ok = isComplete(r); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '10px 11px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>RISK {i + 1}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}</div>
                <input value={r.risk} onChange={e => upd(i, 'risk', e.target.value)} placeholder="Risk: agent nimani noto'g'ri qilishi mumkin?" style={inputStyle} />
                <input value={r.fix} onChange={e => upd(i, 'fix', e.target.value)} placeholder="Himoya: buni qanday oldini olasiz?" style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning registeringiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — registeringiz shu yerda yig'iladi…</p></div>
              : <RegisterDoc rows={docRows} />}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Mas'uliyatli PM shunday ishlaydi — risklarni oldindan ko'rib, himoya qo'yadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['AI ishonch bilan xato/zarar qiladi — risklarni bil', 'Mas\'uliyat sizda: «AI qildi» bahona emas', 'Cheklov (guardrail) — zaiflik emas, mahsulot qarori', 'Foydalanuvchini asra: maxfiylik + halollik'];
  const HOMEWORK = [{ b: 'Agentingiz uchun risk register yozing', t: '— risk → himoya' }, { b: 'Xavfli amalga tasdiq qo\'ying', t: '— human-in-the-loop' }, { b: 'Agent «aniq emas» desin', t: '— o\'ylab topmasin' }];
  const GLOSSARY = [{ b: 'Gallyutsinatsiya', t: '— AI ishonch bilan noto\'g\'ri ma\'lumot to\'qishi' }, { b: 'Guardrail', t: '— agentga qo\'yilgan xavfsizlik cheklovi' }, { b: 'Human-in-the-loop', t: '— muhim amalni odam tasdiqlaydi' }, { b: 'Risk register', t: '— risklar va himoyalar ro\'yxati' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>mas'uliyatli quryasiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! AI risklarini, o\'z mas\'uliyatingizni va cheklov = himoya tamoyilini o\'rgandingiz. Endi agentni xavfsiz quryasiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Mas'uliyat ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Bil, egalik qil, cheklov qo'y, asra! 🛡️</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>✍️</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi: o'z Skill'ingni yozish</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Mas'uliyatni bildingiz. Endi AI'ga aniq, xavfsiz yo'riqnoma — Skill yozamiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson23({ lang: langProp, onFinished }) {
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

        /* === RISK REGISTER DOC === */
        .reg-doc { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2); display: flex; flex-direction: column; gap: 10px; border-top: 4px solid ${T.accent}; }
        .reg-head { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.ink}; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; border-bottom: 1px solid ${T.ink3}33; }
        .reg-row { display: flex; flex-direction: column; gap: 5px; padding: 8px; background: ${T.bg}; border-radius: 9px; animation: fade-step .3s; }
        .reg-risk, .reg-fix { display: flex; gap: 7px; align-items: flex-start; font-family: 'Georgia, serif'; font-size: 12.5px; color: ${T.ink}; line-height: 1.4; }
        .reg-tag { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 9px; padding: 3px 7px; border-radius: 5px; margin-top: 1px; }

        /* === GUARD TOGGLE + AGENT PANEL === */
        .guard-toggle { display: inline-flex; align-items: center; gap: 10px; align-self: flex-start; border: none; cursor: pointer; border-radius: 99px; padding: 8px 16px 8px 8px; background: ${T.accentSoft}; color: ${T.accent}; font-family: 'Manrope'; font-weight: 700; font-size: 13px; transition: all 0.2s; box-shadow: 0 4px 12px -6px rgba(255,79,40,0.3); }
        .guard-toggle.on { background: ${T.successSoft}; color: ${T.success}; box-shadow: 0 4px 12px -6px rgba(31,122,77,0.3); }
        .gt-knob { width: 30px; height: 30px; border-radius: 50%; background: ${T.accent}; color: #fff; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .guard-toggle.on .gt-knob { background: ${T.success}; }
        .agent-panel { background: ${T.paper}; border-radius: 14px; padding: 13px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 9px; }
        .msg-row { display: flex; }
        .msg-user { margin-left: auto; background: ${T.ink}; color: #fff; border-radius: 14px 14px 4px 14px; padding: 9px 13px; font-family: 'Georgia, serif'; font-size: 13px; max-width: 85%; }
        .msg-agent { background: ${T.bg}; border-radius: 14px 14px 14px 4px; padding: 10px 12px; font-family: 'Georgia, serif'; font-size: 13px; color: ${T.ink}; max-width: 92%; display: flex; gap: 9px; align-items: flex-start; line-height: 1.4; animation: fade-step .3s; }
        .msg-agent.exec { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .msg-agent.block { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }

        /* === DET-OPT === */
        .det-opt { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 11px; padding: 12px 14px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Georgia, serif'; font-size: 13.5px; color: ${T.ink}; }
        .det-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -8px rgba(${T.shadowBase},0.22); }
        .det-opt:disabled { cursor: default; }
        .det-correct { background: ${T.successSoft} !important; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .det-wrong { background: ${T.accentSoft} !important; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .det-box { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.6px ${T.ink3}; color: #fff; }
        .det-correct .det-box { background: ${T.success}; box-shadow: none; }
        .det-wrong .det-box { background: ${T.accent}; box-shadow: none; }

        /* === PLINK === */
        .plink { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .plink:hover { transform: translateY(-1px); }
        .plink-on { background: ${T.grapeSoft}; box-shadow: inset 0 0 0 1.5px ${T.grape}; }
        .plink-label { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .plink-act { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.grape}; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === CHEK-LIST === */
        .checklist { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 7px; position: relative; }
        .cl-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid ${T.ink3}33; margin-bottom: 2px; }
        .cl-title { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .crit { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 9px; font-family: 'Georgia, serif'; font-size: 13px; color: ${T.ink}; border: none; transition: background 0.25s; }
        .crit-text { flex: 1; line-height: 1.4; }
        .crit-box { width: 19px; height: 19px; min-width: 19px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .crit-pending { background: ${T.bg}; } .crit-pending .crit-box { box-shadow: inset 0 0 0 1.7px ${T.ink3}; color: ${T.ink3}; }
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
