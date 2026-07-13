import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 11-DARS (Modul 4 · PM1) — METRIKALAR: QAYSI RAQAM MUHIM? — PLATFORM STANDARD v16
// G'oya: ma'lumot saqlangach uni O'LCHASH mumkin. Har mahsulotga o'z metrikasi; vanity (chiroyli, foydasiz)
//        vs actionable (harakatga undaydigan); funnel (qayerda odam "oqib ketadi"); ma'lumot = qaror.
// Metafora: Mahsulot paneli = MASHINA asboblar paneli (AvtoIjara mavzusiga mos — mahsulot ham mashina).
// Signature: AvtoIjara TESHIK FUNNEL — foydalanuvchilar har bosqichda oqib ketadi, eng katta teshikni toping.
// Mahsulot: AvtoIjara (Modul 4 P1/P2 praktikasi — cars). AUDIOSIZ.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
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
  problem: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1 .9-1 1.7" /><path d="M12 16.7h.01" /></svg>),
  clip: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0" /><path d="M8.5 11l1.5 1.5 3-3M8.5 16l1.5 1.5 3-3" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4M5 5h12l-2 3.5L17 12H5" /></svg>),
  gauge: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 18a8 8 0 0 1 16 0" /><path d="M12 18l4.5-5.5" /><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none" /></svg>),
  funnel: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>),
  up: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2}><path d="M3 17l6-6 4 4 8-8" /><path d="M16 7h5v5" /></svg>),
  down: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2}><path d="M3 7l6 6 4-4 8 8" /><path d="M16 17h5v-5" /></svg>),
  car: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 13l2.2-5.2a2 2 0 0 1 1.8-1.2h10a2 2 0 0 1 1.8 1.2L21 13v4H3v-4z" /><path d="M3 13h18" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /></svg>),
  coin: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M9.7 9.6a2.3 1.9 0 0 1 4.6.2c0 1-1 1.5-2.3 1.7s-2.3.8-2.3 1.8a2.3 1.9 0 0 0 4.6.2" /></svg>),
  cart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h2l2.4 11h10l2-7H6.2" /></svg>)
};

const LESSON_META = { lessonId: 'pm-metrics-11-v16', lessonTitle: { uz: 'Metrikalar — qaysi raqam muhim', ru: 'Метрики — какое число важно' } };
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
// Mashina paneli ↔ mahsulot paneli (s2)
const DASH_CAR = [
  { ic: Ico.gauge(20), label: 'Spidometr — tezlik' },
  { ic: Ico.coin(20), label: 'Benzin — yoqilg\'i qoldi' },
  { ic: Ico.up(20), label: 'Harorat — dvigatel holati' },
  { ic: Ico.problem(20), label: 'Ogohlantirish chirog\'i' }
];
const DASH_PROD = [
  { ic: Ico.gauge(20), label: 'Kunlik bron soni — "tezlik"' },
  { ic: Ico.coin(20), label: 'Tushum — "yoqilg\'i" (pul)' },
  { ic: Ico.car(20), label: 'Bandlik % — mashinalar ishlayaptimi' },
  { ic: Ico.problem(20), label: '"Bo\'sh mashina" ogohlantirishi' }
];

// Har mahsulotga o'z metrikasi (s3)
const PRODUCTS = [
  { id: 'payme', who: 'Payme', emoji: '💳', metric: 'Kunlik tranzaksiya soni va hajmi', why: 'To\'lov ilovasi uchun muhimi — qancha pul o\'tdi. Tashrif emas, AYNAN to\'lov.' },
  { id: 'pubg', who: 'PUBG', emoji: '🎮', metric: 'Bir vaqtda o\'ynayotgan o\'yinchilar (online)', why: 'O\'yin uchun muhimi — odamlar qaytib o\'ynayaptimi. Ko\'p online = jonli o\'yin.' },
  { id: 'avto', who: 'AvtoIjara', emoji: '🚗', metric: 'Kunlik bron soni + mashina bandligi %', why: 'Ijara uchun muhimi — mashinalar bo\'sh turmayaptimi, daromad kelayaptimi.' }
];

// Vanity vs actionable (s5)
const VANITY = ['1000 sayt tashrifi', 'Jami 5000 ro\'yxatdan o\'tgan', 'Instagram\'da 200 layk'];
const ACTIONABLE = ['Kuniga 5 bron', '60% mashina bo\'sh turibdi', 'Har bron o\'rtacha 80 000 so\'m'];

// FUNNEL — AvtoIjara konversiya (s6 signature)
const FUNNEL = [
  { id: 'view', label: 'Saytni ko\'rdi', n: 1000 },
  { id: 'card', label: 'Mashina kartasini ochdi', n: 300 },
  { id: 'btn', label: '"Bron" tugmasini bosdi', n: 80 },
  { id: 'form', label: 'Ma\'lumot kiritdi (forma)', n: 20 },
  { id: 'pay', label: 'TO\'LADI', n: 8 }
];
const FW = [100, 74, 52, 38, 28]; // bar kengligi % (vizual toraytirish)
const drops = FUNNEL.slice(0, -1).map((s, i) => Math.round(((s.n - FUNNEL[i + 1].n) / s.n) * 100));
const MAXLEAK = drops.reduce((bi, d, i, a) => (d > a[bi] ? i : bi), 0); // eng katta teshik indeksi

// Metrika ↔ qaysi ma'lumotni saqlash (s8 matching)
const DATA_PAIRS = [
  { id: 'peak', feat: 'Gavjum (peak) soatni bilish', crit: 'Bron VAQTINI saqlash' },
  { id: 'occ', feat: 'Har mashina bandligini bilish', crit: 'Bronda car_id (mashina) saqlash' },
  { id: 'repeat', feat: 'Qaytib kelgan mijozni bilish', crit: 'Mijoz id / telefonini saqlash' },
  { id: 'dur', feat: 'O\'rtacha ijara muddatini bilish', crit: 'Boshlanish + tugash sanasini saqlash' }
];

// Metrika paneli yig'ish (s10)
const METRIC_POOL = [
  { id: 'bron', label: 'Kunlik bron soni', good: true, why: 'Harakatga undaydi — kam bo\'lsa nimadir noto\'g\'ri.' },
  { id: 'band', label: 'Mashina bandligi %', good: true, why: 'Mashinalar ishlayaptimi yoki bo\'sh turibdimi — to\'g\'ridan-to\'g\'ri daromad.' },
  { id: 'tushum', label: 'O\'rtacha tushum / bron', good: true, why: 'Bitta bron qancha pul keltiradi — narx qaroriga ta\'sir qiladi.' },
  { id: 'tashrif', label: 'Jami tashriflar soni', good: false, why: 'Vanity — katta ko\'rinadi, lekin nima qilish kerakligini aytmaydi.' },
  { id: 'rang', label: 'Sayt rangi reytingi', good: false, why: 'Vanity — bronga aloqasi yo\'q, qaror bermaydi.' },
  { id: 'login', label: 'Login bosilgan soni', good: false, why: 'Vanity — bosish ≠ bron. Daromad haqida hech narsa demaydi.' }
];
const GOOD_IDS = METRIC_POOL.filter(m => m.good).map(m => m.id);

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'VANITY TUZOG\'I', color: T.accent, text: 'Egasi "1000 kishi ko\'rdi" deb xursand edi', why: 'Katta, chiroyli raqam — lekin daromad haqida hech narsa demaydi.' },
  { tag: 'TESHIK', color: T.honey, text: 'Funnel: 80 "Bron" bosdi, atigi 20 forma to\'ldirdi', why: 'Eng katta oqim shu yerda — forma 8 maydon, juda uzun.' },
  { tag: 'QAROR', color: T.blue, text: 'Forma 8 maydondan 3 maydonga qisqartirildi', why: 'Teshik aniq edi — aniq harakat qilindi.' },
  { tag: 'NATIJA', color: T.success, text: 'Bron 8 dan 22 ga ko\'tarildi — qariyb 3 barobar', why: 'To\'g\'ri metrika to\'g\'ri qarorni ko\'rsatdi.' }
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

// ===== SIGNATURE: metrika kartochkasi (gauge) =====
const Gauge = ({ ic, label, val, sub, tone = 'ink', delay = 0 }) => {
  const col = tone === 'good' ? T.success : tone === 'bad' ? T.accent : T.ink;
  return (
    <div className="gcard fade-up" style={{ animationDelay: `${delay}s`, borderLeft: `3px solid ${tone === 'good' ? T.success : tone === 'bad' ? T.accent : T.ink3}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.ink2 }}><span style={{ display: 'inline-flex', color: T.blue }}>{ic}</span><span className="gcard-lbl">{label}</span></div>
      {val !== undefined && <div className="gcard-val" style={{ color: col }}>{val}<span className="gcard-sub">{sub}</span></div>}
    </div>
  );
};

// ===== SCREEN 0 — HOOK ("1000 ko'rdi") =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('owner');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Sayt muvaffaqiyatli — ko\'p odam keldi' },
    { id: 'b', label: 'O\'zicha hech narsa — muhimi nechtasi BRON qildi' },
    { id: 'c', label: 'Sayt yomon ishlagan' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'owner'
    ? { who: 'AvtoIjara egasi', emoji: '🤩', say: '1000 kishi saytni ko\'rdi! Reklama zo\'r ishladi — biz mashhurmiz!', ok: true }
    : { who: 'Hisobchi', emoji: '🧐', say: 'Ko\'rdi, ha. Lekin kuniga atigi 5 bron. 20 mashinaning 14 tasi bo\'sh turibdi — pul kirmayapti.', ok: false };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>"1000 kishi ko'rdi!" — bu <span className="italic" style={{ color: T.accent }}>yaxshi</span> raqammi?</h1>
        <Mentor>AvtoIjara sayti ochildi. Ikki odam bir xil raqamga ikki xil qaraydi. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'owner' ? 'chip-on' : ''}`} onClick={() => setV('owner')}>Egasi 🤩</button>
              <button className={`chip ${v === 'acc' ? 'chip-on' : ''}`} onClick={() => setV('acc')}>Hisobchi 🧐</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.blue : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>"1000 ko'rdi" o'zicha nimani bildiradi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Katta raqam chiroyli ko'rinadi, lekin o'zicha bo'sh. <b>Qaysi raqam muhim?</b> — mahsulotni o'lchaydigan to'g'ri metrikani topish. Bugun shuni o'rganamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Metrika = mahsulotning "asboblar paneli"', tag: '' },
    { text: 'Har mahsulotga o\'z metrikasi (Payme ≠ PUBG ≠ AvtoIjara)', tag: '' },
    { text: 'Vanity (chiroyli) vs actionable (harakatga undaydigan)', tag: '' },
    { text: 'Funnel — foydalanuvchilar qayerda "oqib ketadi"', tag: 'jonli' },
    { text: 'Ma\'lumot = qaror: nimani saqlasang, shuni o\'lchaysan', tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.blue} soft={T.blueSoft}>{Ico.gauge(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Qaysi raqamga qaraysiz?</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Ma'lumot saqlangach, uni o'lchash mumkin — lekin to'g'ri metrikani tanlash kerak.</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ AvtoIjara: bron, bandlik, tushum — daromad raqamlari</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Ma'lumotdan to'g'ri metrikagacha</span></h2></div>
        <Mentor>Bu Modul 4 ning birinchi PM darsi. Endi backend ma'lumot saqlaydi — demak <b style={{ color: T.ink }}>o'lchash</b> mumkin. Lekin <b style={{ color: T.ink }}>nimani</b> o'lchash kerak?</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — METAFORA: mashina paneli ↔ mahsulot paneli =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('car');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['car', 'prod']) : new Set(['car']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'car' ? DASH_CAR : DASH_PROD;
  return (
    <Stage eyebrow="Metafora" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulotning ham <span className="italic" style={{ color: T.accent }}>asboblar paneli</span> bor</h2></div>
        <Mentor>Mashinada spidometr, benzin, harorat... lekin siz <b style={{ color: T.ink }}>muhimlarini</b> kuzatasiz. Mahsulot ham xuddi shunaqa. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'car' ? 'chip-on' : ''}`} onClick={() => set('car')}>🚗 Mashina paneli</button>
              <button className={`chip ${v === 'prod' ? 'chip-on' : ''}`} onClick={() => set('prod')}>📊 Mahsulot paneli</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '11px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: T.blue, display: 'inline-flex' }}>{c.ic}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c.label}</span></div>))}
            </div>
          </Col>
          <Col>
            <div className="frame-soft fade-step" key={v}><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{v === 'car' ? 'Mashinada' : 'AvtoIjara’da'}</p><p className="body" style={{ margin: 0, color: T.ink }}>{v === 'car' ? 'Hamma asbobni teng kuzatmaysiz — benzin va tezlik muhim, soat shunchaki bezak.' : 'Mahsulotda ham shunaqa: bron va bandlik muhim, "tashriflar" — bezak raqam.'}</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Metrika — bu mahsulot paneli. To'g'ri <b>ko'rsatkichni</b> tanlash — PM ishi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — HAR MAHSULOTGA O'Z METRIKASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(PRODUCTS.map(p => p.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= PRODUCTS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? PRODUCTS.find(p => p.id === active) : null;
  return (
    <Stage eyebrow="Har mahsulot ≠" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir xil "yaxshi" yo'q — <span className="italic" style={{ color: T.accent }}>mahsulotga qarab</span></h2></div>
        <Mentor>Har mahsulot uchun MUHIM raqam boshqa. Uchchalasini bosib, qaysi metrika ularga muhimligini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRODUCTS.map(p => (<button key={p.id} onClick={() => tap(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '13px 15px', background: T.paper, boxShadow: active === p.id ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -8px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 22 }}>{p.emoji}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: T.ink }}>{p.who}</span>{seen.has(p.id) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 22 }}>{cur.emoji}</span><span className="sk-wordbadge">{cur.who} uchun muhim</span></span><p style={{ fontFamily: G, fontSize: 'clamp(15px,2vw,17px)', color: T.ink, margin: '12px 0 0', fontWeight: 600 }}>{cur.metric}</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir mahsulotni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Payme'ga to'lov, PUBG'ga o'yinchi, AvtoIjara'ga bron muhim. <b>Metrikani mahsulotga moslang.</b></p></div>}
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
    questionText="AvtoIjara uchun eng muhim metrika qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AvtoIjara uchun eng <span className="italic" style={{ color: T.accent }}>muhim</span> metrika qaysi?</h2></>}
    options={['Sahifa fon rangi', 'Kunlik bron soni va mashina bandligi', 'Logotip o\'lchami', 'Sayt necha rangda']} correctIdx={1}
    explainCorrect="To'g'ri! AvtoIjara — ijara biznesi. Muhimi: mashinalar band bo'lyaptimi, kuniga nechta bron — bu daromad raqamlari."
    explainWrong={{ 0: 'Rang — bezak. Daromad haqida hech narsa demaydi.', 2: 'Logotip o\'lchami metrika emas — bronni ko\'rsatmaydi.', 3: 'Ranglar soni — biznesga aloqasi yo\'q. Muhimi: bron va bandlik.', default: 'AvtoIjara uchun bron soni va bandlik muhim.' }} />
);

// ===== SCREEN 5 — VANITY vs ACTIONABLE =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('vanity');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['vanity', 'action']) : new Set(['vanity']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'vanity' ? VANITY : ACTIONABLE;
  const col = v === 'vanity' ? T.accent : T.success;
  return (
    <Stage eyebrow="Vanity vs actionable" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Chiroyli raqam vs <span className="italic" style={{ color: T.accent }}>foydali</span> raqam</h2></div>
        <Mentor><b style={{ color: T.ink }}>Vanity</b> metrika — katta, chiroyli, lekin nima qilish kerakligini aytmaydi. <b style={{ color: T.ink }}>Actionable</b> — harakatga undaydi. Ikkalasini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'vanity' ? 'chip-on' : ''}`} onClick={() => set('vanity')}>✨ Vanity (chiroyli)</button>
              <button className={`chip ${v === 'action' ? 'chip-on' : ''}`} onClick={() => set('action')}>🎯 Actionable (foydali)</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex' }}>{v === 'vanity' ? Ico.eye(16) : Ico.gauge(16)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'vanity'
              ? <div className="frame-warn fade-step" key="v"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Qaror bermaydi</p><p className="body" style={{ margin: 0, color: T.ink }}>"1000 tashrif" — xo'sh, endi nima qilamiz? Aniq emas. Chiroyli, lekin bo'sh.</p></div>
              : <div className="frame-success fade-step" key="a"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Harakatga undaydi</p><p className="body" style={{ margin: 0, color: T.ink }}>"60% mashina bo'sh" — demak narxni tushiramiz yoki reklama qilamiz. Aniq qaror!</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Doim so'rang: <b>"bu raqamdan keyin nima qilaman?"</b> Javob bo'lmasa — vanity.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Qaysi raqam 'vanity' (bekorchi) metrika?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi raqam <span className="italic" style={{ color: T.accent }}>vanity</span> (bekorchi)?</h2></>}
    options={['Instagram\'da 5000 obunachi', '60% mashina bo\'sh turibdi', 'Kuniga 5 bron', 'O\'rtacha bron 80 000 so\'m']} correctIdx={0}
    explainCorrect="To'g'ri! 5000 obunachi chiroyli eshitiladi, lekin bronga aloqasi noaniq. Qolganlari aniq qaror beradi — bu actionable."
    explainWrong={{ 1: 'Bu actionable — bo\'sh mashina ko\'p bo\'lsa, narx yoki reklamani o\'zgartirasiz.', 2: 'Bu actionable — bron kam bo\'lsa muammoni qidirasiz.', 3: 'Bu actionable — narx qaroriga ta\'sir qiladi.', default: 'Obunachi soni vanity — qaror bermaydi.' }} />
);

// ===== SCREEN 6 — TESHIK FUNNEL (SIGNATURE) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [revealed, setRevealed] = useState(storedAnswer ? FUNNEL.length : 0);
  const [running, setRunning] = useState(false);
  const [found, setFound] = useState(storedAnswer ? MAXLEAK : null);
  const [wrong, setWrong] = useState(null);
  const timer = useRef(null);
  const runningRef = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const filled = revealed >= FUNNEL.length;
  const done = found === MAXLEAK;
  const run = () => {
    if (runningRef.current || filled) return;
    runningRef.current = true; setRunning(true); setRevealed(0); setWrong(null);
    const tick = (i) => { setRevealed(i); if (i < FUNNEL.length) { timer.current = setTimeout(() => tick(i + 1), 560); } else { setRunning(false); runningRef.current = false; } };
    timer.current = setTimeout(() => tick(1), 320);
  };
  const guess = (i) => { if (!filled || done) return; if (i === MAXLEAK) { setFound(i); setWrong(null); } else setWrong(i); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Funnel · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (filled ? 'Eng katta teshikni toping' : 'Avval funnelni to\'ldiring')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoIjara funneli: odamlar <span className="italic" style={{ color: T.accent }}>qayerda</span> oqib ketadi?</h2></div>
        <Mentor>Saytga 1000 kishi kirdi, lekin har bosqichda bir qismi yo'qoladi. "To'ldir"ni bosing, keyin <b style={{ color: T.ink }}>eng katta teshikni</b> (qaysi bosqichda eng ko'p odam yo'qolgan) bosib toping.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="funnel">
              {FUNNEL.map((s, i) => {
                const on = revealed > i;
                return (
                  <React.Fragment key={s.id}>
                    <div className={`fn-bar ${on ? 'fn-on' : ''} ${i === FUNNEL.length - 1 ? 'fn-pay' : ''}`} style={{ width: `${FW[i]}%`, opacity: on ? 1 : 0.25 }}>
                      <span className="fn-lbl">{s.label}</span>
                      <span className="fn-n">{on ? s.n.toLocaleString('ru') : '—'}</span>
                    </div>
                    {i < FUNNEL.length - 1 && (
                      <button
                        className={`fn-leak ${found === i ? 'leak-found' : ''} ${wrong === i ? 'leak-wrong' : ''} ${(filled && !done) ? 'leak-live' : ''}`}
                        disabled={!filled || done}
                        onClick={() => guess(i)}
                        style={{ opacity: revealed > i + 1 ? 1 : 0.25 }}
                      >
                        <span className="leak-icon">{Ico.down(13)}</span>
                        <span>−{drops[i]}%{found === i ? '  ← eng katta teshik!' : ''}</span>
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {!filled && <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start', marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 9 }}><span style={{ display: 'inline-flex' }}>{Ico.funnel(17)}</span>{running ? 'To\'lyapti…' : 'Funnelni to\'ldirish'}</button>}
          </Col>
          <Col>
            {!filled && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>1000 kishidan atigi <b>8 tasi</b> to'laydi. Funnel har bosqichda qancha odam yo'qolishini ko'rsatadi.</p></div>}
            {filled && !done && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Teshikni toping</p><p className="body" style={{ margin: 0, color: T.ink }}>Bosqichlar orasidagi <b>−% belgilarini</b> bosing. Qaysi joyda eng ko'p odam yo'qolgan? {wrong !== null && <span style={{ color: T.accent }}> Bu eng kattasi emas — qaytadan.</span>}</p></div>}
            {done && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 30 }}>🕳️</div><p className="ta-h">Eng katta teshik topildi!</p><p className="ta-sub">"Bron" bosgan 80 kishidan faqat 20 tasi formani to'ldirdi — bu yerni tuzatsak, ko'proq bron bo'ladi</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TESHIKNI TUZATISH (funnel'dan harakat) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('before');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['before', 'after']) : new Set(['before']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Teshikni tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Teshik aniq — endi <span className="italic" style={{ color: T.accent }}>aniq harakat</span></h2></div>
        <Mentor>Funnel teshikni ko'rsatdi: "Bron" bosildi-yu, forma to'ldirilmadi. Sabab — forma juda uzun. Ikki holatni solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'before' ? 'chip-on' : ''}`} onClick={() => set('before')}>Hozir (uzun forma)</button>
              <button className={`chip ${v === 'after' ? 'chip-on' : ''}`} onClick={() => set('after')}>Tuzatilgan (qisqa)</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'after' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'after' ? '✅' : '📋'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'before' ? 'Forma 8 maydon: ism, familiya, pasport, manzil, ish joyi, telefon, email, izoh. Ko\'pchilik yarmida tashlab ketadi.' : 'Forma 3 maydon: ism, telefon, qaysi mashina. Qolganini keyin so\'raymiz. Ko\'proq odam tugatadi.'}</p>
              <p className="mono small" style={{ margin: 0, color: v === 'after' ? T.success : T.accent }}>{v === 'before' ? '80 bosdi → 20 to\'ldirdi (−75%)' : '80 bosdi → 55 to\'ldirdi (−31%)'}</p>
            </div>
          </Col>
          <Col>
            {v === 'before'
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Uzun forma = katta teshik. Odam sabrini yo'qotadi.</p></div>
              : <div className="frame-success fade-step" key="a"><p className="body" style={{ margin: 0, color: T.ink }}>Qisqa forma = kichik teshik. Bir o'zgarish bilan ko'proq bron.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Funnel <b>qayerni</b> tuzatishni aytadi. Metrikasiz — qayerni tuzatishni bilmaysiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MA'LUMOT = QAROR (moslash) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CRITS = [
    { id: 'dur', text: 'Boshlanish + tugash sanasini saqlash' },
    { id: 'peak', text: 'Bron VAQTINI saqlash' },
    { id: 'repeat', text: 'Mijoz id / telefonini saqlash' },
    { id: 'occ', text: 'Bronda car_id (mashina) saqlash' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(DATA_PAIRS.map(p => [p.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= DATA_PAIRS.length;
  const pickF = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickC = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(12.5px,1.5vw,14px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Ma'lumot = qaror" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${DATA_PAIRS.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nimani <span className="italic" style={{ color: T.accent }}>o'lchamoqchi</span> bo'lsangiz, o'shani avval saqlang</h2></div>
        <Mentor>Metrika havodan kelmaydi — ma'lumotdan chiqadi. Avval <b style={{ color: T.ink }}>metrikani</b>, keyin uni o'lchash uchun <b style={{ color: T.ink }}>qaysi ma'lumotni saqlash</b> kerakligini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Bilmoqchimiz (metrika)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {DATA_PAIRS.map(p => { const m = matched[p.id]; const on = sel === p.id; return (<button key={p.id} onClick={() => pickF(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.blue, display: 'inline-flex' }}>{m ? Ico.check(17) : Ico.gauge(16)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p.feat}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Saqlash kerak (ma'lumot)</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {CRITS.map(c => { const m = matched[c.id]; const isWrong = wrong === c.id; return (<button key={c.id} onClick={() => pickC(c.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(16) : '☐'}</span><span style={{ flex: 1 }}>{c.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa metrika uchun. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Ma'lumot modeli = qaror. <b>Saqlamasangiz — o'lchay olmaysiz.</b></p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Gavjum (peak) soatni bilish uchun nimani saqlash kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"Eng gavjum soat" ni bilish uchun nimani <span className="italic" style={{ color: T.accent }}>saqlash</span> kerak?</h2></>}
    options={['Sayt rangini', 'Har bron qilingan VAQTNI (sana + soat)', 'Logotipni', 'Foydalanuvchi parolini']} correctIdx={1}
    explainCorrect="To'g'ri! Peak soatni bilish uchun har bron qachon bo'lganini saqlash kerak. Saqlanmasa — bu metrikani umuman chiqarib bo'lmaydi."
    explainWrong={{ 0: 'Rang vaqtni bermaydi. Bron vaqtini saqlash kerak.', 2: 'Logotip — soatni ko\'rsatmaydi.', 3: 'Parol — bunga aloqasi yo\'q (va uni xom saqlash xavfli!). Bron vaqti kerak.', default: 'Peak soat uchun bron vaqtini saqlash kerak.' }} />
);

// ===== SCREEN 10 — METRIKA PANELI YIG'ISH (signature) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sel, setSel] = useState(() => storedAnswer ? new Set(GOOD_IDS) : new Set());
  const workRef = useRef(null);
  const goodSel = [...sel].filter(id => GOOD_IDS.includes(id)).length;
  const badSel = [...sel].filter(id => !GOOD_IDS.includes(id)).length;
  const done = goodSel >= 3 && badSel === 0;
  const toggle = (id) => { if (done) return; setSel(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const badMetric = METRIC_POOL.find(m => sel.has(m.id) && !m.good);
  return (
    <Stage eyebrow="Panel yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 ta foydali metrika tanlang (${goodSel}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoIjara <span className="italic" style={{ color: T.accent }}>metrika panelini</span> yig'ing</h2></div>
        <Mentor>Quyidagi 6 raqamdan <b style={{ color: T.ink }}>3 ta actionable</b> (harakatga undaydigan) metrikani tanlang. Vanity tanlasangiz — panel ogohlantiradi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {METRIC_POOL.map(m => { const on = sel.has(m.id); const tone = on ? (m.good ? 'good' : 'bad') : 'off'; return (
                <button key={m.id} onClick={() => toggle(m.id)} className={`mcard ${tone === 'good' ? 'mcard-good' : tone === 'bad' ? 'mcard-bad' : ''}`}>
                  <span className="mcard-box">{on ? (m.good ? Ico.check(14) : Ico.x(14)) : ''}</span>
                  <span style={{ flex: 1 }}>{m.label}</span>
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Sizning paneliingiz</p>
            <div className="mpanel-frame">
              {goodSel === 0 && badSel === 0 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '8px 0' }}>Metrika tanlang — panel shu yerda yig'iladi…</p>}
              {METRIC_POOL.filter(m => sel.has(m.id) && m.good).map(m => <Gauge key={m.id} ic={Ico.gauge(18)} label={m.label} tone="good" />)}
              {badMetric && <div className="frame-warn fade-step" style={{ marginTop: 8 }}><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 700, color: T.accent }}>VANITY</p><p className="body" style={{ margin: 0, color: T.ink }}>"{badMetric.label}" — {badMetric.why} Olib tashlang.</p></div>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r panel! Uchchala raqam ham aniq qaror beradi — vanity yo'q.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — METRIKANI O'QISH: TREND =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('alone');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['alone', 'trend']) : new Set(['alone']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Trend" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Bandlik 40%" — <span className="italic" style={{ color: T.accent }}>yaxshimi yomonmi</span>?</h2></div>
        <Mentor>Yolg'iz raqam yetmaydi. Uni <b style={{ color: T.ink }}>nimaga nisbatan</b> o'qiysiz? Ikki holatni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'alone' ? 'chip-on' : ''}`} onClick={() => set('alone')}>Yolg'iz raqam</button>
              <button className={`chip ${v === 'trend' ? 'chip-on' : ''}`} onClick={() => set('trend')}>Trend bilan</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(18px,2.6vw,24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span className="gcard-val" style={{ fontSize: 'clamp(34px,7vw,52px)', color: v === 'trend' ? T.accent : T.ink }}>40%</span>
              <p className="small" style={{ color: T.ink2, margin: 0 }}>mashina bandligi</p>
              {v === 'trend' && <div className="fade-step" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}><span className="trend trend-down">{Ico.down(16)} o'tgan oy 70% edi</span></div>}
            </div>
          </Col>
          <Col>
            {v === 'alone'
              ? <div className="frame-warn fade-step" key="al"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aniq emas</p><p className="body" style={{ margin: 0, color: T.ink }}>40% — ko'pmi, ozmi? O'zicha bilib bo'lmaydi. Solishtirish kerak.</p></div>
              : <div className="frame-success fade-step" key="tr"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Endi ma'lum</p><p className="body" style={{ margin: 0, color: T.ink }}>O'tgan oy 70% edi → <b>tushib ketgan!</b> Bu — ogohlantirish. Sabab qidirish kerak.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Metrikani doim <b>o'tgan davr</b> yoki <b>maqsad</b> bilan solishtiring — trend muhim.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Bandlik 40%, o'tgan oy 70% edi. Bu nimani aytadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bandlik 40%, o'tgan oy 70% edi — bu <span className="italic" style={{ color: T.accent }}>nimani</span> aytadi?</h2></>}
    options={['Hammasi joyida, 40% — yaxshi', 'Bandlik tushib ketgan — muammo bor, sabab qidirish kerak', 'Raqamning ahamiyati yo\'q', 'Mashina ko\'paygan']} correctIdx={1}
    explainCorrect="To'g'ri! 70% dan 40% ga tushish — sezilarli pasayish. Trend yomon tomonga — darrov sabab qidirish kerak."
    explainWrong={{ 0: 'Yolg\'iz 40% yaxshi ko\'rinishi mumkin, lekin trend tushgan — bu yomon signal.', 2: 'Aksincha — trend muhim ma\'lumot beradi.', 3: 'Bu raqam mashina sonini emas, bandlikni ko\'rsatadi — u tushgan.', default: 'Bandlik 70% dan 40% ga tushgan — muammo signal.' }} />
);

// ===== SCREEN 13 — NAMUNA (to'liq hikoya) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CASE_AC.map((_, i) => i)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= CASE_AC.length;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active !== null ? CASE_AC[active] : null;
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${CASE_AC.length} ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>vanity tuzog'idan</span> 3x bron'gacha</h2></div>
        <Mentor>AvtoIjara egasining yo'li — 4 qadam. Har qatorni bosib, metrika qanday qaror berganini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.blue, display: 'inline-flex' }}>{Ico.car(16)}</span><span className="cl-title">AvtoIjara — metrika hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Vanity → funnel → qaror → natija. To'g'ri metrika butun yo'lni ochdi. Endi o'zingiznikini yozasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">To'g'ri <span className="italic" style={{ color: T.accent }}>metrikani</span> tanla</h2></div>
      <Mentor>Yaxshi metrika 3 shartni bajaradi: harakatga undaydi, mahsulotga mos, va trend bilan o'qiladi.</Mentor>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎯</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>"Keyin nima qilaman?"</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Metrika shu savolga javob bersa — u to'g'ri.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Yaxshi metrika — 3 shart</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.gauge(18), c: T.accent, t: 'HARAKATGA undaydi (actionable)' }, { ic: Ico.car(18), c: T.blue, t: 'MAHSULOTGA mos (bron, bandlik)' }, { ic: Ico.up(18), c: T.success, t: 'TREND bilan o\'qiladi (o\'tgan davr)' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: 3 actionable metrika =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Kunlik bron soni…', 'Mashina bandligi %…', 'O\'rtacha tushum / bron…'];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [lines, setLines] = useState(() => storedAnswer?.lines || emptyLines());
  const isComplete = (f) => f.name.trim().length >= 8;
  const completeCount = lines.filter(isComplete).length;
  const passed = completeCount >= 2;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, lines, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (i, v) => setLines(prev => prev.map((f, idx) => (idx === i ? { name: v } : f)));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 13, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' };
  const completeLines = lines.filter(isComplete);
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangiz (yoki AvtoIjara) uchun <span className="italic" style={{ color: T.accent }}>3 ta actionable metrika</span></h2></div>
        <Mentor>Har biri <b style={{ color: T.ink }}>harakatga undaydigan</b> raqam bo'lsin (vanity emas). Kamida 2 tasini yozing — o'ngda paneliingiz yig'iladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>Metrika {i + 1}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning metrika paneliingiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Metrika yozing — panel shu yerda paydo bo'ladi…</p></div>
              : <div className="mpanel-frame feat-pop">{completeLines.map((f, j) => <Gauge key={j} ic={Ico.gauge(18)} label={f.name} tone="good" />)}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi mahsulotingizning to'g'ri raqamlarini bilasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Metrika = mahsulot paneli — to\'g\'ri ko\'rsatkichni tanlang', 'Vanity (chiroyli) emas, actionable (harakatga undaydigan) raqam', 'Funnel teshikni ko\'rsatadi — qayerni tuzatishni aytadi', 'Ma\'lumot = qaror: nimani saqlasang, shuni o\'lchaysan'];
  const HOMEWORK = [{ b: 'AvtoIjara funnelini chizing', t: '— tashrif → karta → bron → forma → to\'lov' }, { b: '3 metrika tanlang', t: '— mahsulotingiz uchun actionable raqamlar' }, { b: 'Vanity\'ni toping', t: '— hozir kuzatayotgan bekorchi raqamni aniqlang' }];
  const GLOSSARY = [{ b: 'Metrika', t: '— mahsulotni o\'lchaydigan raqam' }, { b: 'Vanity metrika', t: '— chiroyli, lekin qaror bermaydigan' }, { b: 'Actionable', t: '— harakatga undaydigan raqam' }, { b: 'Funnel', t: '— bosqichma-bosqich oqim, teshikni ko\'rsatadi' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>to'g'ri raqamga</span> qaraysiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Metrika, vanity vs actionable, funnel va "ma\'lumot = qaror"ni bilasiz. Endi keyingi darsda — ma\'lumot xavfsizligi!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Metrika ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">To'g'ri raqamni o'lcha — qaror o'zi keladi! 🎯</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🔐</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi PM: Xavfsizlik = ishonch</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Ma'lumot saqlash — mas'uliyat. Foydalanuvchi ma'lumotini himoyalash nega mahsulot qiymati?</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson11({ lang: langProp, onFinished }) {
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
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        @keyframes feat-pop { 0% { transform: scale(.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .feat-pop { animation: feat-pop .34s cubic-bezier(.2,.7,.2,1); }
        @keyframes shake { 0%,100% { transform: none; } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .shake-x { animation: shake 0.42s; }

        /* === CHEK-LIST (namuna hikoyasi) === */
        .checklist { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 7px; position: relative; }
        .cl-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid ${T.ink3}33; margin-bottom: 2px; }
        .cl-title { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .crit { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 9px; font-family: 'Georgia, serif'; font-size: 13px; color: ${T.ink}; border: none; transition: background 0.25s; }
        .crit-text { flex: 1; line-height: 1.4; }
        .crit-box { width: 19px; height: 19px; min-width: 19px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .crit-pending { background: ${T.bg}; } .crit-pending .crit-box { box-shadow: inset 0 0 0 1.7px ${T.ink3}; color: ${T.ink3}; }
        .crit-pass { background: ${T.successSoft}; } .crit-pass .crit-box { background: ${T.success}; color: #fff; animation: crit-pop 0.3s cubic-bezier(.2,.7,.2,1); }
        @keyframes crit-pop { 0% { transform: scale(.4); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }

        /* === FUNNEL (signature) === */
        .funnel { display: flex; flex-direction: column; align-items: center; gap: 0; width: 100%; padding: 4px 0; }
        .fn-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 15px; border-radius: 10px; background: linear-gradient(90deg, ${T.blue}, ${T.blueSoft}); color: ${T.ink}; box-shadow: 0 6px 16px -9px rgba(${T.shadowBase},0.3); transition: width 0.55s cubic-bezier(.4,0,.2,1), opacity 0.4s; min-width: 120px; }
        .fn-bar.fn-on { animation: fn-pop 0.4s cubic-bezier(.2,.7,.2,1); }
        @keyframes fn-pop { 0% { transform: scale(.94); } 60% { transform: scale(1.02); } 100% { transform: scale(1); } }
        .fn-bar.fn-pay { background: linear-gradient(90deg, ${T.success}, ${T.successSoft}); }
        .fn-lbl { font-family: 'Manrope'; font-weight: 600; font-size: clamp(11px,1.5vw,13px); color: #08323f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fn-pay .fn-lbl { color: #0c3a26; }
        .fn-n { font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(14px,2vw,18px); color: ${T.ink}; flex-shrink: 0; }
        .fn-leak { display: inline-flex; align-items: center; gap: 5px; margin: 3px 0; padding: 3px 11px; border-radius: 99px; border: none; background: transparent; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; color: ${T.ink3}; cursor: default; transition: all 0.18s; }
        .fn-leak .leak-icon { display: inline-flex; }
        .fn-leak.leak-live { background: ${T.accentSoft}; color: ${T.accent}; cursor: pointer; }
        .fn-leak.leak-live:hover { transform: scale(1.06); box-shadow: 0 4px 12px -4px rgba(255,79,40,0.4); }
        .fn-leak.leak-found { background: ${T.accent}; color: #fff; cursor: default; animation: feat-pop 0.4s; }
        .fn-leak.leak-wrong { animation: shake 0.42s; }

        /* === METRIKA PANEL === */
        .mcard { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; border: none; border-radius: 12px; padding: 12px 14px; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; cursor: pointer; background: ${T.paper}; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.16); transition: all 0.18s; }
        .mcard:hover { transform: translateY(-1px); }
        .mcard-box { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.7px ${T.ink3}; color: #fff; }
        .mcard-good { background: ${T.successSoft}; box-shadow: 0 6px 16px -8px rgba(31,122,77,0.3), inset 0 0 0 1.5px ${T.success}; } .mcard-good .mcard-box { background: ${T.success}; box-shadow: none; }
        .mcard-bad { background: ${T.accentSoft}; box-shadow: 0 6px 16px -8px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; } .mcard-bad .mcard-box { background: ${T.accent}; box-shadow: none; }
        .mpanel-frame { background: ${T.bg}; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; box-shadow: inset 0 0 0 1.5px ${T.ink3}44; }
        .gcard { background: ${T.paper}; border-radius: 11px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.18); display: flex; flex-direction: column; gap: 4px; }
        .gcard-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink}; }
        .gcard-val { font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(20px,3vw,26px); line-height: 1.1; display: inline-flex; align-items: baseline; gap: 5px; }
        .gcard-sub { font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink2}; }
        .trend { font-family: 'Manrope'; font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 99px; }
        .trend-down { color: ${T.accent}; background: ${T.accentSoft}; }
        .trend-up { color: ${T.success}; background: ${T.successSoft}; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

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

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
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

        /* === SPEC CARD (qora) === */
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
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === TAKEAWAY === */
        .takeaway { background: ${T.successSoft}; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.success}; font-weight: 600; font-size: 13px; margin: 0; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }

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

        /* MOBIL: yig'iladigan Mentor */
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
