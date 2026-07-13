import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM — DIZAYN VA «NASMOTRENNOST» — v16 (AUDIOSIZ)
// G'oya: dizayn — bezak emas, ISHONCH. Ko'zni yaxshi dizayn bilan mashq qildirish.
// Hook: Airbnb suratlar hikoyasi (dizayn = ishonch, daromad 2×).
// Signature 1: Yaxshi/yomon UI o'yini (jonli MockBus maketlari, tamoyilga bog'liq).
// Signature 2: Pattern ovlash galereyasi (karta / bo'sh holat / tugma iyerarxiyasi / skeleton).
// Signature 3: Ekranni «kiyintirish» — 101-xom ekranni 3 yaxshilanish bilan jonli o'zgartirish.
// Yakuniy ish: DIZAYN REJASI — portfolio 10-sahifa (3 referens + pattern + tamoyil).
// Davomiylik: avtobus-tracker (101-xom ekran); Aziz case #9.
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
  rocket: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 15c-2 0-4-1-5-2 0-5 2-9 5-11 3 2 5 6 5 11-1 1-3 2-5 2z" /><path d="M7 13l-3 2 2 2" /><path d="M17 13l3 2-2 2" /><path d="M12 15v5" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>),
  palette: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16.5" cy="10.5" r="1" /></svg>),
  grid: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>),
  sparkle: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></svg>),
  columns: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M8 4v16M16 4v16" /><rect x="4" y="4" width="16" height="16" rx="2" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-design-33-v16', lessonTitle: { uz: 'Dizayn va nasmotrennost', ru: 'Дизайн и насмотренность' } };
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

// ===== FOUNDER PORTFOLIO =====
const PORTFOLIO_KEY = 'coddyFounderPortfolio';
const savePortfolioSection = (section, data) => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    const cur = raw ? JSON.parse(raw) : {};
    cur[section] = data;
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(cur));
  } catch { /* localStorage bloklangan bo'lsa — dars baribir ishlayveradi */ }
};
const readProductName = () => {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const arch = p.lesson99_architecture;
    if (arch && Array.isArray(arch.fields)) {
      const f = arch.fields.find(x => /nom/i.test(x.label || ''));
      if (f && f.value && f.value.trim()) return f.value.trim();
    }
  } catch { /* jim */ }
  return null;
};

// ============================================================
// JONLI MAKET — avtobus-tracker kartochkasi (dizayn tamoyillari props orqali)
// big=iyerarxiya · spaced=bo'sh joy · contrast=kontrast · oneColor=izchillik
// ============================================================
const MockBus = ({ big = false, spaced = false, contrast = false, oneColor = false }) => {
  const pad = spaced ? 18 : 7;
  const gap = spaced ? 8 : 3;
  const inkMain = contrast ? T.ink : '#C4BEB2';
  const inkSub = contrast ? T.ink2 : '#CDC7BB';
  const btnA = oneColor ? T.accent : '#37A2A2';
  const btnB = oneColor ? T.accentSoft : '#D66';
  const rad = oneColor ? 9 : 4;
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: `${pad}px ${pad}px`, boxShadow: '0 8px 22px -10px rgba(58,53,48,0.28)', width: '100%', maxWidth: 220, fontFamily: "'Manrope', sans-serif", textAlign: 'left' }}>
      <div style={{ fontSize: 9, color: inkSub, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: spaced ? 11 : 2 }}>Maktab yo'nalishi</div>
      <div style={{ fontSize: big ? 40 : 16, fontWeight: big ? 800 : 500, color: inkMain, lineHeight: 1, marginBottom: spaced ? 6 : 1, letterSpacing: big ? '-0.02em' : 0 }}>7 <span style={{ fontSize: big ? 15 : 11, fontWeight: 500 }}>daqiqa</span></div>
      <div style={{ fontSize: 11.5, color: inkSub, marginBottom: spaced ? 15 : 5 }}>12-avtobus kelmoqda</div>
      <div style={{ display: 'flex', gap }}>
        <button type="button" tabIndex={-1} style={{ flex: 1, border: 'none', borderRadius: rad, background: btnA, color: '#fff', padding: spaced ? '9px' : '5px', fontSize: 11, fontWeight: 700, cursor: 'default', fontFamily: 'inherit' }}>Yangilash</button>
        <button type="button" tabIndex={-1} style={{ border: 'none', borderRadius: rad, background: btnB, color: oneColor ? T.accent : '#fff', padding: spaced ? '9px 12px' : '5px 8px', fontSize: 11, fontWeight: 700, cursor: 'default', fontFamily: 'inherit' }}>⚙</button>
      </div>
    </div>
  );
};

// s5 — Yaxshi/yomon UI o'yini (har raund bitta tamoyilда farq qiladi)
const ALLGOOD = { big: true, spaced: true, contrast: true, oneColor: true };
const UI_ROUNDS = [
  { id: 'u1', principle: 'IYERARXIYA', color: T.accent, better: 'B',
    A: { ...ALLGOOD, big: false }, B: { ...ALLGOOD },
    why: 'B da avtobus vaqti KATTA va quyuq — ko\'z darrov unga tushadi (core ma\'lumot!). A da hammasi bir xil o\'lchamda: eng muhim raqam boshqalar orasida yo\'qolib ketgan.' },
  { id: 'u2', principle: 'BO\'SH JOY', color: T.blue, better: 'A',
    A: { ...ALLGOOD }, B: { ...ALLGOOD, spaced: false },
    why: 'A da elementlar nafas oladi — o\'qish oson, tinch. B da hammasi tiqilib qolgan: ko\'z qayerga qarashni bilmaydi, arzon ko\'rinadi. Bo\'sh joy — bepul, lekin qimmatbaho.' },
  { id: 'u3', principle: 'IZCHILLIK + KONTRAST', color: T.grape, better: 'B',
    A: { ...ALLGOOD, oneColor: false, contrast: false }, B: { ...ALLGOOD },
    why: 'B da bitta asosiy rang va aniq kontrast — tartib, ishonch. A da har tugma boshqa rang (kamalak!) va oqarib ketgan matn — o\'qib bo\'lmaydi, ishonchsiz.' }
];

// s3 — 4 tamoyil
const PRINCIPLES = [
  { id: 'p1', label: 'IYERARXIYA', ic: '📊', color: T.accent, prop: 'big',
    def: 'Eng muhim narsa eng katta va quyuq bo\'lsin — ko\'z avval unga tushsin.',
    tip: 'Avtobus-trackerда «7 daqiqa» — bosh qahramon. Uni kattalashtiring, qolgani kichrayadi.' },
  { id: 'p2', label: 'BO\'SH JOY', ic: '🌬️', color: T.blue, prop: 'spaced',
    def: 'Elementlar orasida nafas qoldiring. Tiqilinch = chalkashlik va arzonlik.',
    tip: 'Har blok atrofida joy bo\'lsin. Bo\'sh joy — «bo\'shlik» emas, tartibning o\'zi.' },
  { id: 'p3', label: 'KONTRAST', ic: '◐', color: T.grape, prop: 'contrast',
    def: 'Matn fondan aniq ajralsin — kulrang ustiga kulrang = o\'qib bo\'lmaydi.',
    tip: 'Muhim matn to\'q rangda. Och-kulrang matn «chiroyli» ko\'rinadi, lekin o\'qilmaydi.' },
  { id: 'p4', label: 'IZCHILLIK', ic: '🔁', color: T.honey, prop: 'oneColor',
    def: 'Bir xil narsalar bir xil ko\'rinsin: bitta asosiy rang, bitta tugma uslubi.',
    tip: 'Kamalak = havaskorlik belgisi. Bitta asosiy rang tanlang, hamma joyda o\'shani ishlating.' }
];

// s7 — Pattern galereyasi
const PATTERNS = [
  { id: 'card', label: 'Karta (card)', ic: '🃏', color: T.blue,
    d: 'Bog\'liq ma\'lumotни bitta «qog\'oz»ga yig\'ish — fondan ajralib, guruh bo\'lib ko\'rinadi.',
    use: 'Har avtobus yo\'nalishi — alohida karta. Instagram post, mahsulot kartasi — hammasi shu pattern.' },
  { id: 'empty', label: 'Bo\'sh holat (empty state)', ic: '📭', color: T.grape,
    d: 'Ma\'lumot yo\'q bo\'lganda ham chiroyli xabar + keyingi qadam ko\'rsatish.',
    use: '«Hali yo\'nalish tanlanmagan — tanlang» ekrani. Bo\'sh ekran emas — yo\'l ko\'rsatuvchi.' },
  { id: 'btnh', label: 'Tugma iyerarxiyasi', ic: '🔘', color: T.accent,
    d: 'Asosiy amal to\'q (to\'ldirilgan) tugma, ikkilamchisi och — ko\'z asosiyni darrov topadi.',
    use: '«Yangilash» — to\'q apelsin; «Sozlama» — och. Ikkitasi bir xil bo\'lsa, ko\'z chalkashadi.' },
  { id: 'skel', label: 'Skeleton yuklash', ic: '💀', color: T.honey,
    d: 'Yuklanayotganda kulrang «suyak» chiziqlar — «Yuklanmoqda...» matnidan yaxshiroq, tezroq tuyuladi.',
    use: 'Avtobus vaqti kelguncha kulrang joy tebranadi. YouTube, Facebook — hammasi shuni ishlatadi.' }
];

// s10 — Ekranni «kiyintirish» (SIGNATURE 3)
const DRESS_STEPS = [
  { id: 'big', label: 'Vaqtni KATTA qil', sub: 'iyerarxiya', color: T.accent, ic: '📊' },
  { id: 'spaced', label: 'Nafas joyi qo\'sh', sub: 'bo\'sh joy', color: T.blue, ic: '🌬️' },
  { id: 'oneColor', label: 'Bitta asosiy rang', sub: 'izchillik', color: T.honey, ic: '🔁' }
];

// s11 — dizayn drilli
const DESIGN_DRILL = [
  { id: 'x1', label: 'Ekranда 6 xil rang, 4 xil tugma shakli — ko\'z chalkashadi', emoji: '🌈', color: T.honey,
    opts: ['Kontrastni oshirish', 'Izchillik: bitta asosiy rang va bitta tugma uslubi', 'Ko\'proq rang qo\'shish'], correct: 1,
    why: 'Kamalak — havaskorlik belgisi. Bitta asosiy rangga qaytaring, tugmalarni bir xil qiling — darrov professional ko\'rinadi.' },
  { id: 'x2', label: 'Hamma matn bir xil o\'lchamда — nima muhimligi bilinmaydi', emoji: '📏', color: T.accent,
    opts: ['Iyerarxiya: muhim narsani kattalashtir, qolganini kichrayt', 'Rangni o\'zgartirish', 'Barchasini kichraytirish'], correct: 0,
    why: 'Ko\'z avval kattaga tushadi. «7 daqiqa»ni katta qiling, yorliqlarni kichik — muhimi darrov ko\'rinadi.' },
  { id: 'x3', label: 'Och-kulrang matn oq fonда — o\'qib bo\'lmaydi', emoji: '👁️', color: T.grape,
    opts: ['Matnni yana ochroq qilish', 'Kontrast: matnni to\'q rangга o\'tkazish', 'Shrift o\'lchamини kichraytirish'], correct: 1,
    why: 'Chiroyli ko\'ringan och-kulrang — o\'qish uchun dushman. To\'q rang oling: dizayn avvalo O\'QILISHI kerak.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// s15 — Dizayn rejasi (portfolio 10-sahifa)
const DESIGN_FIELDS = [
  { key: 'ref1', label: 'Referens 1 (Dribbble / Mobbin / Behance)', emoji: '🖼️', color: T.blue, min: 4, hint: 'Masalan: Mobbin — transport ilovasi ekrani' },
  { key: 'ref2', label: 'Referens 2', emoji: '🖼️', color: T.blue, min: 4, hint: 'Yoqqan bitta UI' },
  { key: 'ref3', label: 'Referens 3', emoji: '🖼️', color: T.blue, min: 4, hint: 'Yana bittasi' },
  { key: 'pattern', label: 'Qo\'llaydigan pattern', emoji: '🃏', color: T.grape, min: 4, hint: 'Karta / bo\'sh holat / tugma iyerarxiyasi / skeleton' },
  { key: 'principle', label: 'Asosiy tamoyil', emoji: '📐', color: T.accent, min: 5, hint: 'Iyerarxiya: vaqtni kattalashtirish' },
  { key: 'screen', label: 'Qaysi ekranga qo\'llayman', emoji: '🖥️', color: T.honey, min: 5, hint: 'Avtobus vaqti ekrani' }
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

// Dizayn rejasi hujjati (s15)
const DesignDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.palette(16)}</span><span>Dizayn rejasi · 10-sahifa</span></div>
    {rows.map((r, i) => (
      <div key={i} className="deck-row">
        <span className="deck-num" style={{ background: r.color }}>{r.emoji}</span>
        <div style={{ minWidth: 0 }}><span className="deck-tag" style={{ color: r.color }}>{r.label}</span><p className="deck-val">{r.text}</p></div>
      </div>
    ))}
  </div>
);

const ArcStrip = () => (
  <div className="arc-strip fade-up delay-2">
    {STAGES.map((s, i) => (
      <React.Fragment key={s.n}>
        <div className={`arc-chip ${i === 2 ? 'arc-here' : ''}`}>
          <span style={{ fontSize: 14 }}>{s.ic}</span>
          <span className="arc-t">{s.t}</span>
          {i < 2 && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(11)}</span>}
          {i === 2 && <span className="arc-you">4/6</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: AIRBNB SURATLAR =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Narxni tushiring — arzonroq qiling' },
    { id: 'b', label: 'Uylarni professional kamerada suratga oling' },
    { id: 'c', label: 'Yana ko\'proq ficha qo\'shing' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Qur bosqichi" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Bir suratdan <span className="italic" style={{ color: T.accent }}>million dollar</span></h1>
        <Mentor>Birinchi ekran tayyor (101-dars) — lekin u xom. Bugun uni chiroyli qilamiz. Va bilib qo'ying: dizayn — bezak emas.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>🏠 2009 · AIRBNB</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Airbnb o'lish arafasida edi — deyarli hech kim uy bron qilmasdi. Asoschilar sababini tushunmasdi. Ustozlari <b>Pol Grem</b> saytga qaradi va bitta narsani ko'rdi: <b>uy suratlari dahshatli</b> — qorong'i, xira telefon suratlari.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Pol Grem nima maslahat berdi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : ''}Uch asoschi Nyu-Yorkka uchib, uylarni <b>professional kamerada</b> suratga oldi. Bir hafta ichida daromad <b>ikki barobar</b> oshdi — bitta qatoram kod yozmasdan. Saboq: <b>dizayn — bezak emas, ISHONCH.</b> Yaxshi ko'ringan narsaga odam ishonadi va pul beradi. Bugun ko'zimizni mashq qilamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Nasmotrennost: ko\'zni mashq qildirish', tag: '' },
    { text: '4 tamoyil: iyerarxiya · bo\'sh joy · kontrast · izchillik', tag: '' },
    { text: 'Yaxshi/yomon UI o\'yini', tag: 'o\'yin' },
    { text: 'Pattern ovlash + ekranni «kiyintirish»', tag: 'o\'yin' },
    { text: 'DIZAYN REJASI — portfolio 10-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.eye(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Ko'zni mashq qildirish</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Xom ekranni ishonch uyg'otadigan ekranga. Dizayn = qanday ishlashi va ishonch.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Qur bosqichi · 4-dars. Keyingisi: MVP v2 — SHIP 🚀</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Dizayn: <span className="italic" style={{ color: T.accent }}>ko'zni o'rgatamiz</span></h2></div>
        <Mentor>Dizayner bo'lish shart emas — lekin <b style={{ color: T.ink }}>yaxshi dizaynni tanish</b> shart. Buni «nasmotrennost» deyishadi: ko'p yaxshi ishlarni ko'rib, ko'zingiz o'rganadi. Bugun shu ko'zni mashq qilamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — NASMOTRENNOST =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  return (
    <Stage eyebrow="Nasmotrennost" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Ikkalasini solishtiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Odam saytni <span className="italic" style={{ color: T.accent }}>0.05 soniyada</span> baholaydi</h2></div>
        <Mentor>Google tadqiqoti: foydalanuvchi sahifага qaragan zahoti — ilk 50 millisekundда — «ishonaman/ishonmayman» qарорini qiladi. Ikki xom vs chiroyli ekranни solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label" style={{ color: T.accent }}>🙈 Xom (101-dagi AI ekran)</p>
            <div style={{ background: T.bg, borderRadius: 14, padding: 18, display: 'flex', justifyContent: 'center', border: `1.5px dashed ${T.ink3}` }}><MockBus /></div>
            <p className="small" style={{ color: T.ink2, margin: 0 }}>Ishlaydi — lekin xira, tiqilinch, ishonch uyg'otmaydi. «Havaskor» tuyuladi.</p>
          </Col>
          <Col>
            <p className="flow-label" style={{ color: T.success }}>✨ Dizayn qilingan</p>
            <div style={{ background: '#F0EEE8', borderRadius: 14, padding: 18, display: 'flex', justifyContent: 'center' }}><MockBus big spaced contrast oneColor /></div>
            <p className="small" style={{ color: T.ink2, margin: 0 }}>Bir xil ma'lumot, bir xil kod hajmi — lekin ishonchli, tinch, professional. Ko'z «ha» deydi.</p>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Farqni ko'rdim</button>
          </Col>
        </div></Zoomable>
        {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muhimi: farq <b>ma'lumotда emas — taqdimotда</b>. Aynan bir xil narsa, lekin biri ishonch uyg'otadi, biri yo'q. Nasmotrennost — shu farqni ko'radigan ko'z. Uni 4 tamoyil bilan qo'lга olamiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — 4 TAMOYIL =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PRINCIPLES.map(p => p.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? PRINCIPLES[0].id : null);
  const done = seen.size >= PRINCIPLES.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? PRINCIPLES.find(p => p.id === active) : null;
  const badProps = cur ? { ...ALLGOOD, [cur.prop]: false } : {};
  return (
    <Stage eyebrow="4 tamoyil" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tamoyillarni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Dizaynning <span className="italic" style={{ color: T.accent }}>4 ustuni</span></h2></div>
        <Mentor>Chiroyli dizayn sirli iste'dod emas — 4 tamoyil. Har birini bosing va o'ngда ekran qanday o'zgarishini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRINCIPLES.map(p => { const on = seen.has(p.id); return (
                <button key={p.id} className={`plink ${active === p.id ? 'plink-on' : ''}`} onClick={() => tap(p.id)}>
                  <span style={{ fontSize: 18, minWidth: 24 }}>{p.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label" style={{ color: p.color }}>{p.label}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ochish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="fade-step" key={active}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <div style={{ flex: 1, background: T.bg, borderRadius: 11, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}><span className="mono" style={{ fontSize: 9, color: T.accent, fontWeight: 700 }}>❌ TAMOYILSIZ</span><MockBus {...badProps} /></div>
                <div style={{ flex: 1, background: '#F0EEE8', borderRadius: 11, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}><span className="mono" style={{ fontSize: 9, color: T.success, fontWeight: 700 }}>✓ {cur.label}</span><MockBus {...ALLGOOD} /></div>
              </div>
              <div className="sk-info" style={{ marginTop: 11 }}><span className="sk-wordbadge" style={{ color: cur.color, background: `${cur.color}1A` }}>{cur.ic} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>{cur.def}</p><p style={{ fontFamily: G, fontSize: 'clamp(12.5px,1.7vw,14px)', color: T.ink2, margin: '7px 0 0', lineHeight: 1.5 }}><b>Amalда:</b> {cur.tip}</p></div>
            </div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tamoyilni bosing — ekran o'zgaradi</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rttasi birga ishlaydi: <b>iyerarxiya</b> yo'l ko'rsatadi, <b>bo'sh joy</b> tinchlik beradi, <b>kontrast</b> o'qitadi, <b>izchillik</b> ishonch uyg'otadi. Endi ko'zingizni sinaymiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Dizayn nima uchun muhim?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Dizayn — bu <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Ilovani chiroyli qiladigan bezak', 'Ma\'lumot qanday taqdim etilishi — ishonch va tushunarlilik', 'Faqat rang tanlash', 'Rassomlar uchun ixtiyoriy narsa']} correctIdx={1}
    explainCorrect="To'g'ri! Dizayn — bezak emas. U ma'lumotni QANDAY taqdim etishingiz: nima muhim, qayerga qarash kerak, ishonsa bo'ladimi. Airbnb suratlar — kod emas, taqdimot daromadni 2× qildi."
    explainWrong={{ 0: 'Bezak — natija, sabab emas. Dizayn — ishonch va tushunarlilik.', 2: 'Rang — bir qism, xolos. Iyerarxiya, bo\'sh joy, kontrast ham bor.', 3: 'Ixtiyoriy emas — 0.05 soniyada odam qaror qiladi.', default: 'Dizayn = ma\'lumot taqdimoti = ishonch.' }} />
);

// ===== SCREEN 5 — YAXSHI/YOMON UI O'YINI (SIGNATURE 1) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(UI_ROUNDS.map(r => [r.id, r.better])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = UI_ROUNDS.filter(r => picked[r.id] === r.better).length;
  const done = okCount >= UI_ROUNDS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (r, side) => {
    if (picked[r.id] === r.better) return;
    setPicked(prev => ({ ...prev, [r.id]: side }));
    setWrong(prev => ({ ...prev, [r.id]: side !== r.better }));
  };
  return (
    <Stage eyebrow="Yaxshi/yomon UI · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Yaxshirog'ini toping (${okCount}/${UI_ROUNDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi ekran <span className="italic" style={{ color: T.accent }}>yaxshiroq?</span> Nega?</h2></div>
        <Mentor>Ikki variantни taqqoslang va yaxshirog'ini tanlang. Ko'zingizni ishonting — keyin nega ekanini o'qing. Har raundда bitta tamoyil farq qiladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {UI_ROUNDS.map((r, ri) => {
            const p = picked[r.id];
            const solved = p === r.better;
            const badge = (side) => solved && r.better === side;
            return (
              <div key={r.id} className="frame" style={{ padding: 'clamp(13px,2vw,18px)', borderLeft: `4px solid ${solved ? T.success : r.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><span className="mono small" style={{ color: r.color, fontWeight: 700 }}>RAUND {ri + 1}</span><span className="small" style={{ color: T.ink3 }}>· farq: {r.principle}</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['A', 'B'].map(side => {
                    const props2 = side === 'A' ? r.A : r.B;
                    const isWin = badge(side);
                    return (
                      <button key={side} className={`ui-pick ${solved && r.better === side ? 'ui-win' : ''} ${!solved && p === side && wrong[r.id] ? 'ui-lose' : ''}`} disabled={solved} onClick={() => pick(r, side)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: T.ink2 }}>{side}</span>{isWin && <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: T.success }}>✓ YAXSHIROQ</span>}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}><MockBus {...props2} /></div>
                      </button>
                    );
                  })}
                </div>
                {solved && <p className="small fade-step" style={{ margin: '10px 0 0', color: T.success, fontWeight: 600 }}>✓ {r.why}</p>}
                {!solved && p !== undefined && wrong[r.id] && <p className="small fade-step" style={{ margin: '10px 0 0', color: T.accent, fontWeight: 600 }}>Yana qarang — {r.principle} tamoyili qaysi birida yaxshiroq?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'zingiz o'rganyapti! Har safar so'rang: <b>eng muhim narsa ko'rinyaptimi? Nafas bormi? O'qsa bo'ladimi? Izchilmi?</b> Shu 4 savol — sizning dizayn ko'zingiz.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Ekranда eng muhim ma'lumot yo'qolib ketgan bo'lsa — qaysi tamoyil?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Eng muhim narsa <span className="italic" style={{ color: T.accent }}>ko'rinmayapti</span> — nima yetishmayapti?</h2></>}
    options={['Ko\'proq rang', 'Iyerarxiya — muhim narsani kattalashtir, quyuqlashtir', 'Ko\'proq tugma', 'Kichikroq shrift']} correctIdx={1}
    explainCorrect="To'g'ri! Iyerarxiya — ko'zga yo'l ko'rsatadi. Muhim narsa (avtobus vaqti) katta va quyuq bo'lsa, ko'z darrov unga tushadi. Hamma bir xil o'lchamda bo'lsa — muhimi yo'qoladi."
    explainWrong={{ 0: 'Rang qo\'shish chalkashtiradi — o\'lcham farqi kerak.', 2: 'Tugma emas — muhim ma\'lumotning O\'LCHAMI.', 3: 'Kichraytirish yashiradi — muhimni KATTALASHTIRING.', default: 'Iyerarxiya: muhim = katta va quyuq.' }} />
);

// ===== SCREEN 6 — RASSOMDEK O'G'IRLA =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('scratch');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['scratch', 'steal']) : new Set(['scratch']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isScratch = v === 'scratch';
  const LIBS = [{ n: 'Mobbin', d: 'minglab real ilova ekranlari' }, { n: 'Dribbble', d: 'dizaynerlar ishlari' }, { n: 'Behance', d: 'to\'liq loyihalar' }];
  return (
    <Stage eyebrow="Rassomdek o'g'irla" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala yo\'lni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Noldan <span className="italic" style={{ color: T.accent }}>ixtiro qilmang</span> — yaxshisidan o'rganing</h2></div>
        <Mentor>Yaxshi founder dizaynni noldan o'ylab topmaydi — u <b style={{ color: T.ink }}>ishlaydigan patternlarni</b> ko'rib, moslaydi. Bu o'g'irlik emas — o'rganish. Ikki yo'lni ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isScratch ? 'chip-on' : ''}`} onClick={() => set('scratch')}>😰 Noldan o'ylash</button>
              <button className={`chip ${!isScratch ? 'chip-on' : ''}`} onClick={() => set('steal')}>🎨 Referensdan o'rganish</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isScratch ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isScratch
                ? 'Bo\'sh ekranга qarab «qanday qilsam?» deb soatlab o\'ylash. Natija: ehtimol yomon va o\'ziga xos «g\'alati» dizayn. Foydalanuvchi tanish naqshlarni izlaydi — siz esa yangisini majburlaysiz.'
                : 'Mobbin/Dribbble ochib, 10 ta transport ilovasi ekranini ko\'rasiz. Naqshlar takrorlanadi — chunki ular ISHLAYDI. Eng yaxshi 3 tasini oling, o\'zingizga moslang. Tez va sifatli.'}</p>
            </div>
          </Col>
          <Col>
            {!isScratch && <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <p className="flow-label">Referens kutubxonalari</p>
              {LIBS.map((l, i) => (<div key={i} className="frame" style={{ padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 4px 12px -7px rgba(${T.shadowBase},0.16)` }}><span style={{ fontSize: 16 }}>🖼️</span><span style={{ fontWeight: 700, fontSize: 13, color: T.ink, minWidth: 70 }}>{l.n}</span><span className="small" style={{ color: T.ink2 }}>{l.d}</span></div>))}
            </div>}
            {isScratch && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Noldan ixtiro — vaqt isrofi va xavf. Foydalanuvchi «qanday ishlatishни» qaytadan o'rganishга majbur bo'ladi. Tanishlik — qulaylik.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: <b>yaxshi rassomlar nusxa oladi, buyuklari o'g'irlaydi</b> (— Pikasso). Ko'chirish emas — 3 referensdan eng yaxshi g'oyalarni yig'ib, o'zingizniki qilish.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// Pattern uchun kichik vizual namuna
const PatternViz = ({ id }) => {
  if (id === 'card') return (<div style={{ display: 'flex', gap: 6 }}>{[0, 1].map(i => (<div key={i} style={{ flex: 1, background: '#fff', borderRadius: 9, padding: 9, boxShadow: '0 5px 13px -8px rgba(58,53,48,0.3)' }}><div style={{ height: 6, width: '60%', background: T.ink3 + '66', borderRadius: 3 }} /><div style={{ height: 5, width: '85%', background: T.ink3 + '33', borderRadius: 3, marginTop: 6 }} /></div>))}</div>);
  if (id === 'empty') return (<div style={{ border: `1.5px dashed ${T.ink3}`, borderRadius: 11, padding: 16, textAlign: 'center', background: T.bg }}><div style={{ fontSize: 24 }}>📭</div><div style={{ fontSize: 10, color: T.ink2, marginTop: 4, fontWeight: 600 }}>Hali yo'nalish tanlanmagan</div><div style={{ display: 'inline-block', marginTop: 7, background: T.accent, color: '#fff', fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 7 }}>Tanlash</div></div>);
  if (id === 'btnh') return (<div style={{ display: 'flex', gap: 7, alignItems: 'center' }}><div style={{ flex: 1, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '9px', borderRadius: 8 }}>Yangilash</div><div style={{ background: T.accentSoft, color: T.accent, fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '9px 12px', borderRadius: 8 }}>Sozlama</div></div>);
  return (<div style={{ background: '#fff', borderRadius: 9, padding: 11, boxShadow: '0 5px 13px -8px rgba(58,53,48,0.3)', display: 'flex', flexDirection: 'column', gap: 7 }}>{['70%', '90%', '50%'].map((w, i) => (<div key={i} className="skel-bar" style={{ height: 8, width: w, borderRadius: 4 }} />))}</div>);
};

// ===== SCREEN 7 — PATTERN OVLASH GALEREYASI (SIGNATURE 2) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PATTERNS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? PATTERNS[0].id : null);
  const done = seen.size >= PATTERNS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? PATTERNS.find(p => p.id === active) : null;
  return (
    <Stage eyebrow="Pattern ovlash · galereya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Patternlarni oching (${seen.size}/${PATTERNS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor <span className="italic" style={{ color: T.accent }}>UI patternlari</span> — g'ildirakni qayta ixtiro qilmang</h2></div>
        <Mentor>Har mashhur ilovada bir xil «g'ishtlar» takrorlanadi — chunki ular ishlaydi. 4 asosiy patternni oching va namunasini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PATTERNS.map(p => { const on = seen.has(p.id); return (
                <button key={p.id} className={`plink ${active === p.id ? 'plink-on' : ''}`} onClick={() => tap(p.id)}>
                  <span style={{ fontSize: 18, minWidth: 24 }}>{p.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label" style={{ color: p.color }}>{p.label}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ochish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}>
              <span className="sk-wordbadge" style={{ color: cur.color, background: `${cur.color}1A` }}>{cur.ic} {cur.label}</span>
              <div style={{ margin: '12px 0', background: T.bg, borderRadius: 11, padding: 13 }}><PatternViz id={cur.id} /></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{cur.d}</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(12.5px,1.7vw,14px)', color: T.ink2, margin: '7px 0 0', lineHeight: 1.5 }}><b>Bizда:</b> {cur.use}</p>
            </div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Patternni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu patternlar — dizayn alifbosi. Foydalanuvchi ularni allaqachon biladi (boshqa ilovalardan). Ularni ishlatib, mahsulotingizni <b>darrov tanish va qulay</b> qilasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — BO'SH JOY KUCHI =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('cramped');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['cramped', 'airy']) : new Set(['cramped']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isCramped = v === 'cramped';
  return (
    <Stage eyebrow="Bo'sh joy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bo'sh joy — <span className="italic" style={{ color: T.accent }}>bepul, lekin qimmatbaho</span></h2></div>
        <Mentor>Yangi boshlovchilar ekranни to'ldirishга harakat qiladi. Professionallar bo'sh joy qoldiradi. Nega? Toggle bilan his qiling.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isCramped ? 'chip-on' : ''}`} onClick={() => set('cramped')}>😵 Tiqilinch</button>
              <button className={`chip ${!isCramped ? 'chip-on' : ''}`} onClick={() => set('airy')}>🌬️ Nafasli</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: isCramped ? '#EFE7DE' : '#F0EEE8', borderRadius: 14, padding: isCramped ? 8 : 22, display: 'flex', justifyContent: 'center', transition: 'padding 0.3s' }}>
              <MockBus big contrast oneColor spaced={!isCramped} />
            </div>
          </Col>
          <Col>
            <div key={v + '2'} className={`${isCramped ? 'frame-warn' : 'frame-success'} fade-step`}>
              <p className="body" style={{ margin: 0, color: T.ink }}>{isCramped
                ? 'Tiqilinch: ko\'z qayerga qarashni bilmaydi, hammasi bir-biriga yopishgan. «Arzon», «shoshilinch» tuyuladi — garchi ma\'lumot bir xil bo\'lsa ham.'
                : 'Nafas: har element o\'z joyiga ega. Ko\'z osongina harakatlanadi, muhimi ajralib turadi. «Qimmat», «ishonchli» tuyuladi. Apple shuning ustasi.'}</p>
            </div>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Amaliy qoida: shubha bo'lsa — <b>bo'sh joy qo'shing, element emas</b>. Kamroq narsa + ko'proq joy = professional. Bo'shliqdan qo'rqmang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Noldan dizayn o'ylash o'rniga nima qilish yaxshiroq?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi dizayn uchun <span className="italic" style={{ color: T.accent }}>eng tez yo'l</span>?</h2></>}
    options={['Bo\'sh ekranга qarab noldan o\'ylash', 'Mobbin/Dribbble\'da ishlaydigan patternlarni ko\'rib, o\'zingizga moslash', 'Iloji boricha ko\'proq rang va ficha qo\'shish', 'Boshqa ilovani aynan nusxa ko\'chirish']} correctIdx={1}
    explainCorrect="To'g'ri! «Rassomdek o'g'irlash»: yaxshi referenslarni ko'rib, tamoyillarini o'rganib, o'zingizga moslash. Bu tez va sifatli — foydalanuvchiga tanish, sizga oson."
    explainWrong={{ 0: 'Noldan o\'ylash — sekin va xavfli; g\'alati natija.', 2: 'Ko\'proq ≠ yaxshiroq. Bo\'sh joy va izchillik muhim.', 3: 'Aynan nusxa — o\'g\'rilik; g\'oyani oling, moslang.', default: 'Referensdan o\'rganib, o\'zingizga moslang.' }} />
);

// ===== SCREEN 10 — EKRANNI «KIYINTIRISH» (SIGNATURE 3) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [applied, setApplied] = useState(() => storedAnswer ? new Set(DRESS_STEPS.map(s => s.id)) : new Set());
  const workRef = useRef(null);
  const count = applied.size;
  const done = count >= DRESS_STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const apply = (id) => setApplied(prev => { if (prev.has(id)) return prev; const n = new Set(prev); n.add(id); return n; });
  const props2 = { big: applied.has('big'), spaced: applied.has('spaced'), oneColor: applied.has('oneColor'), contrast: applied.has('oneColor') };
  return (
    <Stage eyebrow="Ekranni kiyintirish · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Yaxshilanishlarni qo'llang (${count}/${DRESS_STEPS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">101-dagi xom ekranni <span className="italic" style={{ color: T.accent }}>jonli kiyintiring</span></h2></div>
        <Mentor>Mana AI qurgan xom ekran (101-dars). Uch yaxshilanishni birma-bir qo'llang va ekranning ko'z oldingizda o'zgarishini kuzating.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">Yaxshilanishlar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DRESS_STEPS.map(s => { const on = applied.has(s.id); return (
                <button key={s.id} className={`sort-card ${on ? 'sort-ok' : ''}`} onClick={() => apply(s.id)} style={{ cursor: on ? 'default' : 'pointer', width: '100%', textAlign: 'left' }}>
                  <span style={{ fontSize: 17 }}>{s.ic}</span>
                  <span className="sort-text"><b style={{ color: s.color }}>{s.label}</b> <span style={{ color: T.ink3 }}>· {s.sub}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> : <span className="plink-act" style={{ color: s.color }}>+ qo'llash</span>}
                </button>
              ); })}
            </div>
            <div className="fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">✨ Dizayn darajasi</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{Math.round((count / DRESS_STEPS.length) * 100)}%</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(count / DRESS_STEPS.length) * 100}%`, background: done ? T.success : undefined }} /></div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Jonli natija</p>
            <div style={{ background: count === 0 ? T.bg : '#F0EEE8', borderRadius: 14, padding: props2.spaced ? 22 : 14, display: 'flex', justifyContent: 'center', transition: 'all 0.35s cubic-bezier(.3,.8,.3,1)', border: count === 0 ? `1.5px dashed ${T.ink3}` : 'none', minHeight: 150, alignItems: 'center' }}>
              <MockBus {...props2} />
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xuddi shu ma'lumot — lekin endi <b>ishonchli va professional</b>. Katta o'zgarish 3 kichik qarordan: kattalashtir, joy qoldir, bitta rang. Dizayn — mo'jiza emas, INTIZOM.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — DIZAYN DRILLI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(DESIGN_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = DESIGN_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= DESIGN_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Mashq · dizayn tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tamoyilni toping (${okCount}/${DESIGN_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Muammoni ko'rdingiz — <span className="italic" style={{ color: T.accent }}>qaysi tamoyil tuzatadi?</span></h2></div>
        <Mentor>Uch keng tarqalgan dizayn muammosi. Har biriga to'g'ri tamoyilni ulang — bu sizning kundalik dizayn asbobingiz.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DESIGN_DRILL.map(d => {
            const p = picked[d.id];
            const solved = p === d.correct;
            return (
              <div key={d.id} className="frame" style={{ padding: 'clamp(13px,2vw,17px)', borderLeft: `4px solid ${solved ? T.success : d.color}` }}>
                <p className="flow-label" style={{ color: d.color, marginBottom: 9 }}>{d.emoji} {d.label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {d.opts.map((o, i) => {
                    let cls = 'drill-opt';
                    if (solved && i === d.correct) cls += ' drill-ok';
                    else if (!solved && p === i && wrong[d.id]) cls += ' drill-no';
                    return (<button key={i} className={cls} disabled={solved} onClick={() => pick(d, i)}><span className="mono small" style={{ minWidth: 16, color: T.ink3 }}>{String.fromCharCode(65 + i)}</span><span style={{ flex: 1 }}>{o}</span>{solved && i === d.correct && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>);
                  })}
                </div>
                {solved && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.success, fontWeight: 600 }}>✓ {d.why}</p>}
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Qaysi tamoyil aynan shu muammoni yechadi?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi sizда tashxis ko'zi bor: chalkash → izchillik, muhimi yo'q → iyerarxiya, o'qib bo'lmaydi → kontrast. Muammoni nomlay olsangiz — yechimni ham bilasiz.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Ekran juda tiqilinch va arzon ko'rinsa — birinchi nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ekran <span className="italic" style={{ color: T.accent }}>tiqilinch va arzon</span> ko'rinsa?</h2></>}
    options={['Ko\'proq element va rang qo\'shaman', 'Bo\'sh joy qo\'shaman — element emas', 'Shriftni kichraytiraman', 'Yana ficha qo\'shaman']} correctIdx={1}
    explainCorrect="To'g'ri! Tiqilinchning davosi — bo'sh joy, ko'proq narsa emas. Elementlar orasiga nafas qo'shing: darrov tinch, qimmat va professional ko'rinadi. Kamroq = ko'proq."
    explainWrong={{ 0: 'Element qo\'shish — muammoni kuchaytiradi. Aksincha — joy qo\'shing.', 2: 'Shrift o\'lchami masala emas — masofa (bo\'sh joy) masala.', 3: 'Ficha qo\'shish yana tiqadi. Bo\'sh joy qo\'shing.', default: 'Tiqilinch davosi — bo\'sh joy.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #9 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Zo\'r! Rang-barang — jonli va yoshlarbop, shundoq qoldir»' },
    { id: 1, t: '«Ko\'p rang ≠ dizayn. Bitta asosiy rang tanla, bir xil tugmalar, ko\'proq bo\'sh joy — izchillik professional qiladi»' },
    { id: 2, t: '«Yana ko\'proq rang va shrift qo\'sh — battar jonli bo\'ladi»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«Kamalak qildim — dizayn bu-da!»</span></h2></div>
        <Mentor>Aziz dizaynга qo'l urdi (qoyil!) — lekin «chiroyli» degani ko'p rang deb tushundi. Natijasini ko'ring…</Mentor>
        <div className="split">
          <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
            <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
            <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«Ekranга 6 xil rang, 5 xil shrift, har tugma boshqa shakl qildim! Bir tugma yashil, biri pushti, biri gradient! Rang-barang — juda jonli, to'g'rimi?»</p>
          </div>
          <div className="fade-up delay-2" style={{ background: T.bg, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}><span className="mono" style={{ fontSize: 9, color: T.accent, fontWeight: 700 }}>AZIZNING EKRANI</span><MockBus big spaced contrast oneColor={false} /></div>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {OPTS.map(o => {
            let cls = 'option';
            if (solved) { if (o.id === 1) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (picked === o.id) cls += ' option-picked-wrong';
            return (<button key={o.id} className={cls} disabled={solved} onClick={() => pick(o.id)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(13.5px,1.7vw,15.5px)', display: 'flex', alignItems: 'center', gap: 12 }}><span className="mono small" style={{ minWidth: 20, color: T.ink3 }}>{String.fromCharCode(65 + o.id)}</span><span style={{ flex: 1, textAlign: 'left' }}>{o.t}</span></button>);
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? 'To\'g\'ri maslahat' : 'Yana o\'ylang'}</p>
          <p className="body" style={{ margin: 0 }}>{solved
            ? 'Aziz eng keng tarqalgan xatoni qildi: «chiroyli = ko\'p rang» deb o\'yladi. Aslida aksincha — professional dizayn VAZMIN: bitta asosiy rang, izchil tugmalar, ko\'p bo\'sh joy. Kamalak — havaskorlik belgisi. Cheklov — did belgisi.'
            : (picked === 0 ? 'Kamalak jonli emas — chalkash. Ko\'z qayerga qarashni bilmaydi, ishonch yo\'qoladi. Izchillik kerak.' : 'Ko\'proq rang — battar chalkashlik. Aziznang muammosi ortiqcha rang; yechim — kamaytirish, izchillik.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Dizayn rejasiga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Dizayn qoidasi: <span className="italic" style={{ color: T.accent }}>kamroq, lekin izchil</span></h2></div>
      <Mentor>Amaliyotdan oldin kompas. 4 qoida — keyin o'z dizayn rejangizni yozasiz.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>👁️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Ko'zingizga ishoning</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Nasmotrennost o'sdi. Endi «yaxshimi?» degan savolga ko'zingiz javob beradi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.layers(18), c: T.accent, t: 'IYERARXIYA — muhim narsa katta va quyuq' }, { ic: Ico.columns(18), c: T.blue, t: 'BO\'SH JOY — element emas, joy qo\'sh' }, { ic: Ico.eye(18), c: T.grape, t: 'KONTRAST — matn fondan aniq ajralsin' }, { ic: Ico.palette(18), c: T.honey, t: 'IZCHILLIK — bitta rang, bir xil tugmalar' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: DIZAYN REJASI =====
const emptyDesign = () => Object.fromEntries(DESIGN_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyDesign());
  const productName = useRef(readProductName()).current;
  const isComplete = (k) => data[k].trim().length >= (DESIGN_FIELDS.find(f => f.key === k)?.min ?? 4);
  const completeCount = DESIGN_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= DESIGN_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson102_design', { title: 'Dizayn rejasi', fields: DESIGN_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = DESIGN_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' (')[0], color: f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · dizayn rejasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${DESIGN_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">DIZAYN REJASI: <span className="italic" style={{ color: T.accent }}>portfolio 10-sahifa</span></h2></div>
        <Mentor>O'Z MVP'ingiz uchun dizayn rejasini tuzing{productName ? <> (mahsulotingiz: <b style={{ color: T.ink }}>{productName}</b>)</> : ''}. Avval Mobbin/Dribbble'da 3 referens toping, keyin pattern va tamoyilni belgilang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {DESIGN_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Dizayn rejangiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — reja shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><DesignDoc rows={docRows} />{passed && <span className="seal">KO'Z TAYYOR ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>MVP'ingiz endi ishonch uyg'otadi! Referens, pattern va tamoyil belgilandi. Keyingi darsda mahsulotni oxiriga yetkazamiz va INTERNETGA chiqaramiz — SHIP! 🚀</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const BADGES = [
  { t: 'Muammo Ovchisi', l: 'olingan' },
  { t: 'Tadqiqotchi', l: 'olingan' },
  { t: 'Quruvchi', l: '103-dars' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Dizayn — bezak emas, ishonch (Airbnb suratlar, daromad 2×)', '4 tamoyil: iyerarxiya · bo\'sh joy · kontrast · izchillik', 'Rassomdek o\'g\'irla: referenslar va patternlardan o\'rgan', 'Kamroq, lekin izchil — kamalak havaskorlik belgisi'];
  const GLOSSARY = [{ b: 'Nasmotrennost', t: '— yaxshi dizaynni ko\'rib o\'rgangan ko\'z' }, { b: 'Iyerarxiya', t: '— muhim narsa katta va quyuq' }, { b: 'Bo\'sh joy', t: '— elementlar orasidagi nafas' }, { b: 'Kontrast', t: '— matn fondan ajralishi' }, { b: 'Izchillik', t: '— bir xil narsalar bir xil ko\'rinishi' }, { b: 'Pattern', t: '— tayyor, ishlaydigan UI yechimi' }, { b: 'Referens', t: '— o\'rganish uchun yaxshi namuna (Mobbin/Dribbble)' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Qur bosqichi · 4/6 tamom" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.eye(12)}</span> Dizayn ko'zi ochildi</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>ishonch ko'rinadi.</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Ko\'zingiz o\'rgandi: yaxshi va yomon UI ni ajratasiz, 4 tamoyilni bilasiz, patternlarni ishlatasiz. MVP\'ingiz endi ishonch uyg\'otadi. Keyingi darsda uni oxiriga yetkazamiz va INTERNETGA chiqaramiz.' : 'Yaxshi harakat! Ekranni chiqarishdan oldin dizayn tamoyillarini mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 1 ? 'badge-done' : ''} ${i === 2 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔨' : (i === 3 ? '🧪' : '👑')))} {b.t}<span className="badge-when" style={i <= 1 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi nishon — <b style={{ color: T.honey }}>🔨 Quruvchi</b>: MVP'ingiz to'liq ishlaganda (103-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🎨</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — ko'zni to'ydiring</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Mobbin yoki Dribbble'ni oching va o'z sohangizdagi 5 ta ilova ekranini diqqat bilan ko'ring: ular iyerarxiya, bo'sh joy, kontrast, izchillikni qanday ishlatgan? Yoqqanini saqlang. Har kuni 10 daqiqa — ko'zingiz oylar ichida o'sadi. Keyingi dars: MVP v2 — SHIP 🚀.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson33({ lang: langProp, onFinished }) {
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
        @keyframes stamp-in { 0% { opacity: 0; transform: scale(2.4) rotate(6deg); } 60% { opacity: 1; transform: scale(0.94) rotate(-10deg); } 80% { transform: scale(1.05) rotate(-7deg); } 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }

        /* === UI TAQQOSLASH === */
        .ui-pick { border: none; background: ${T.paper}; border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.18); text-align: left; }
        .ui-pick:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px -10px rgba(${T.shadowBase},0.28); }
        .ui-pick:disabled { cursor: default; }
        .ui-win { box-shadow: inset 0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(31,122,77,0.3); background: ${T.successSoft}; }
        .ui-lose { box-shadow: inset 0 0 0 2px ${T.accent}; animation: shake 0.42s; }

        /* === SKELETON === */
        .skel-bar { background: linear-gradient(90deg, ${T.ink3}33 25%, ${T.ink3}18 50%, ${T.ink3}33 75%); background-size: 200% 100%; animation: skel 1.4s ease-in-out infinite; }
        @keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* === ARC STRIP === */
        .arc-strip { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .arc-chip { display: inline-flex; align-items: center; gap: 6px; background: ${T.paper}; border-radius: 99px; padding: 7px 12px; font-family: 'Manrope'; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .arc-t { font-weight: 700; font-size: 11.5px; color: ${T.ink}; }
        .arc-here { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.35); }
        .arc-you { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.05em; animation: you-pulse 1.8s ease-in-out infinite; }
        @keyframes you-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,79,40,0.45); } 50% { box-shadow: 0 0 0 5px rgba(255,79,40,0); } }
        .arc-sep { color: ${T.ink3}; font-size: 13px; }

        /* === SARALASH === */
        .sort-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; border: none; }
        .sort-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .sort-text { flex: 1; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; line-height: 1.4; text-align: left; }
        .sort-verdict { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; animation: feat-pop .3s cubic-bezier(.2,.7,.2,1); }

        /* === METER === */
        .fmeter-track { height: 10px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; }
        .fmeter-fill { height: 100%; background: linear-gradient(90deg, ${T.honey}, ${T.accent}); border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.45); }

        /* === DRILL === */
        .drill-opt { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 10px; padding: 9px 12px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; text-align: left; }
        .drill-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -7px rgba(${T.shadowBase},0.22); }
        .drill-opt:disabled { cursor: default; }
        .drill-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .drill-no { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake 0.42s; }

        /* === MUHR === */
        .seal { position: absolute; bottom: 10px; right: 12px; padding: 5px 11px; border: 2.5px solid ${T.success}; border-radius: 8px; color: ${T.success}; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; transform: rotate(-7deg); background: rgba(255,255,255,0.78); animation: stamp-in 0.5s cubic-bezier(.2,.9,.3,1.4) 0.15s both; }

        /* === KONFETTI === */
        .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .cf { position: absolute; top: -14px; width: 8px; height: 13px; border-radius: 2px; opacity: 0; animation: cf-fall 2.8s ease-in forwards; }
        @keyframes cf-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(76vh) rotate(560deg); opacity: 0; } }

        /* === BADGE === */
        .badge-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 99px; background: ${T.bg}; color: ${T.ink2}; font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .badge-when { color: ${T.ink3}; font-weight: 600; }
        .badge-done { background: ${T.honey}; color: #fff; box-shadow: 0 6px 16px -6px rgba(224,137,43,0.55); }
        .badge-next { background: ${T.honeySoft}; color: ${T.honey}; box-shadow: inset 0 0 0 1.5px ${T.honey}55; position: relative; overflow: hidden; }
        .badge-next::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.75), transparent); animation: badge-shine 2.4s ease-in-out infinite; }
        @keyframes badge-shine { 0% { left: -60%; } 55% { left: 120%; } 100% { left: 120%; } }

        /* === DOC === */
        .deck-doc { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2); display: flex; flex-direction: column; gap: 9px; border-top: 4px solid ${T.accent}; }
        .deck-head { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.ink}; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px; border-bottom: 1px solid ${T.ink3}33; }
        .deck-row { display: flex; gap: 9px; align-items: flex-start; animation: fade-step .3s; }
        .deck-num { width: 20px; height: 20px; min-width: 20px; border-radius: 6px; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px; }
        .deck-tag { font-family: 'Manrope'; font-weight: 700; font-size: 11px; }
        .deck-val { font-family: 'Georgia, serif'; font-size: 12.5px; color: ${T.ink}; line-height: 1.45; margin: 2px 0 0; word-break: break-word; }

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

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }

        /* === MENTOR / ZOOM === */
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

        /* === HOOK === */
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
        .spec-card { background: ${CODE.bg}; border-radius: 14px; padding: 16px 17px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); display: flex; flex-direction: column; gap: 8px; }
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
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; display: inline-block; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === PLINK === */
        .plink { display: flex; align-items: center; gap: 9px; width: 100%; border: none; border-radius: 11px; padding: 11px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .plink:hover { transform: translateY(-1px); }
        .plink-on { background: ${T.grapeSoft}; box-shadow: inset 0 0 0 1.5px ${T.grape}; }
        .plink-label { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .plink-act { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.grape}; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }

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
