import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · KOD/PROYEKT-AI — MVP v2: OXIRIGA YETKAZISH VA SHIP — v16 (AUDIOSIZ)
// G'oya: boshlash oson — TUGATISH qahramonlik. «Done > perfect». MVP internetga chiqadi.
// Hook: Reid Hoffman — «birinchi versiyangdan uyalmasang, kech chiqargansan».
// Signature 1: Ficha → AI-prompt (3 MVP fichani qurish promptlari + yig'ish).
// Signature 2: «Done vs perfekt» chegara o'yini (feature-freeze: ship / v2 / hech qachon).
// Signature 3: SHIP! — uchishdan oldingi checklist → deploy → jonli URL → 🔨 Quruvchi nishoni.
// Yakuniy ish: SHIP yozuvi — portfolio 11-sahifa (havola + 3 ficha + freeze + his).
// Davomiylik: 99-arxitektura + 100-analitika + 101-ekran + 102-dizayn → chiqariladi. Aziz #10.
// AUDIOSIZ. PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  honey: '#E0892B', honeySoft: '#FBEFDD', grape: '#7B3FE4', grapeSoft: '#EFE9FB',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8', kw: '#C99BF5' };
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
  code: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M8 8l-4 4 4 4" /><path d="M16 8l4 4-4 4" /><path d="M13 6l-2 12" /></svg>),
  cloud: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 18 18z" /><path d="M12 12v5M9.5 14.5L12 12l2.5 2.5" /></svg>),
  hammer: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M14 6l4 4" /><path d="M10 10l-6 6a2 2 0 0 0 3 3l6-6" /><path d="M12 4l6 6 3-3-6-6z" /></svg>),
  bug: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="8" y="7" width="8" height="12" rx="4" /><path d="M8 11H4M20 11h-4M8 15H4M20 15h-4M9 7l-2-3M15 7l2-3" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></svg>),
  loop: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" /><path d="M20 4v4h-4" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" /><path d="M4 20v-4h4" /></svg>),
  scissors: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="6" cy="6" r="2.6" /><circle cx="6" cy="18" r="2.6" /><path d="M8.2 7.6L20 19M8.2 16.4L20 5" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>)
};

// ===== SYNTAX SPANLAR =====
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Kw = ({ children }) => <span style={{ color: CODE.kw }}>{children}</span>;
const Fn = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Pn = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;

const LESSON_META = { lessonId: 'mvp-build2-103-v16', lessonTitle: { uz: 'MVP v2: oxiriga yetkazish va SHIP', ru: 'MVP v2: завершить и запустить' } };
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
// nomni URL-slug'ga aylantirish (deploy URL uchun)
const toSlug = (name) => {
  if (!name) return 'avtobus-tracker';
  const map = { 'ʻ': '', '\'': '', 'ʼ': '', "'": '' };
  let s = name.toLowerCase().replace(/[ʻʼ'']/g, '');
  s = s.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  return s.slice(0, 24) || 'avtobus-tracker';
};

// ===== KONSEPT LEKSIKONI =====
// s5 — 3 MVP fichasi → qurish promptlari (SIGNATURE 1)
const BUILD_FEATURES = [
  { id: 'f1', ic: '🚌', name: 'Avtobus vaqtini ko\'rsatish', tag: 'CORE JOB', color: T.accent,
    prompt: (<>Serverdan avtobus vaqtini ol, <b>katta raqamda</b> ko'rsat. Kelmasa «Yuklanmoqda». <Fn>track</Fn>(<St>'avtobus_tekshirildi'</St>) qo'sh.</>),
    done: 'MVP yuragi — bu bo\'lmasa mahsulot yo\'q. Birinchi va eng muhim.' },
  { id: 'f2', ic: '🛣️', name: 'Bitta yo\'nalish tanlash', tag: 'core oqim', color: T.blue,
    prompt: (<>Foydalanuvchi ro'yxatdan <b>1 maktab yo'nalishini</b> tanlaydi (98-qaror: faqat 1 yo'nalish).</>),
    done: 'Tanlovsiz qaysi avtobus vaqtini ko\'rsatishni bilmaymiz. Zarur bo\'g\'in.' },
  { id: 'f3', ic: '📱', name: 'Oddiy web-sahifa (telefon)', tag: 'yetkazish', color: T.grape,
    prompt: (<>Mobil telefonда ochiladigan <b>bitta oddiy web-sahifa</b>. App Store shart emas — havola yubordingiz, ishladi.</>),
    done: 'Eng tez yetkazish yo\'li. Havola = mahsulot foydalanuvchi qo\'lida.' }
];

// s7 — «Done vs perfekt» chegara o'yini (SIGNATURE 2)
const SHIP_TASKS = [
  { id: 't1', t: 'Avtobus vaqti ishlaydi (core)', ans: 'ship', why: 'Core job — bu bo\'lmasa MVP yo\'q. Albatta hozir chiqaramiz.' },
  { id: 't2', t: 'Bitta yo\'nalish tanlanadi', ans: 'ship', why: 'Core oqim uchun zarur bo\'g\'in. Ship.' },
  { id: 't3', t: 'Telefonда ochiladi', ans: 'ship', why: 'Foydalanuvchi telefonда ishlatadi — zarur. Ship.' },
  { id: 't4', t: 'Qorong\'i rejim (dark mode)', ans: 'later', why: 'Chiroyli, lekin core emas. Birorta foydalanuvchi so\'ramagan. v2 ga.' },
  { id: 't5', t: 'Push-eslatma «avtobus 5 daqiqada»', ans: 'later', why: 'Foydali! Lekin core ishlagandan keyin. v2 — aynan shu ficha kutadi.' },
  { id: 't6', t: '10 shahar barcha transporti', ans: 'never', why: 'MVP qotili: 100 barobar ish, core jobga foyda deyarli nol. Hech qachon (bu MVP uchun).' },
  { id: 't7', t: 'AI ovozli yordamchi', ans: 'never', why: 'Over-engineering: muammoga aloqasi yo\'q. Bu boshqa mahsulot.' },
  { id: 't8', t: 'Har piksel mukammal animatsiya', ans: 'never', why: 'Perfeksionizm tuzog\'i — chiqishni haftalarга kechiktiradi, foyda nol.' }
];
const TMAP = { ship: { emoji: '✅', label: 'HOZIR CHIQARAMIZ', color: T.success }, later: { emoji: '⏳', label: 'v2 KEYIN', color: T.honey }, never: { emoji: '❌', label: 'HECH QACHON', color: T.accent } };

// s10 — SHIP checklist (butun qurilish yoyini takrorlaydi: 99-102)
const SHIP_CHECKS = [
  { id: 'c1', ic: '🚌', label: 'Core job ishlaydi', sub: 'avtobus vaqti oxirigacha ko\'rinadi', from: '101' },
  { id: 'c2', ic: '📊', label: 'Analitika ulangan', sub: 'track() hodisalari yozilyapti', from: '100' },
  { id: 'c3', ic: '🎨', label: 'Dizayn qo\'llangan', sub: 'iyerarxiya, bo\'sh joy, izchillik', from: '102' },
  { id: 'c4', ic: '🐛', label: 'Xatolar tekshirildi', sub: '.env · catch · hardcode yo\'q', from: '101' }
];

// s2 — perfeksionist vs shipper
// s11 — chiqargandan keyin
const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// s15 — SHIP yozuvi (portfolio 11-sahifa)
const SHIP_FIELDS = [
  { key: 'url', label: 'MVP havolasi / qayerda joylashgan', emoji: '🔗', color: T.accent, min: 5, hint: 'avtobus-tracker.vercel.app' },
  { key: 'f1', label: 'Chiqarilgan ficha 1 (core)', emoji: '✅', color: T.success, min: 4, hint: 'Avtobus vaqtini ko\'rsatish' },
  { key: 'f2', label: 'Chiqarilgan ficha 2', emoji: '✅', color: T.success, min: 4, hint: 'Yo\'nalish tanlash' },
  { key: 'f3', label: 'Chiqarilgan ficha 3', emoji: '✅', color: T.success, min: 4, hint: 'Telefonда ochiladi' },
  { key: 'freeze', label: 'Nimani «keyin»ga qoldirdim (freeze)', emoji: '⏳', color: T.honey, min: 5, hint: 'Push-eslatma, dark mode' },
  { key: 'feeling', label: 'Chiqargandagi hissim (bir jumla)', emoji: '🚀', color: T.grape, min: 6, hint: 'Biroz qo\'rqinchli, lekin g\'ururlanaman!' }
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

// Kod kartochkasi (terminal uslub)
const CodeCard = ({ file, children }) => (
  <div className="spec-card">
    <div className="code-file"><span className="cdot" style={{ background: '#FF605C' }} /><span className="cdot" style={{ background: '#FFBD44' }} /><span className="cdot" style={{ background: '#00CA4E' }} /><span className="code-name">{file}</span></div>
    <pre className="code-pre">{children}</pre>
  </div>
);

// SHIP yozuvi hujjati (s15)
const ShipDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.rocket(16)}</span><span>SHIP yozuvi · 11-sahifa</span></div>
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
          {i === 2 && <span className="arc-you">5/6</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: REID HOFFMAN =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Yana 5 ficha qo\'shsin — keyin chiqarsin' },
    { id: 'b', label: 'Hozir chiqarsin — mukammal emasligidan uyalmasin' },
    { id: 'c', label: 'To\'liq mukammal bo\'lguncha kutsin' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Qur bosqichi" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>«Boshlash oson. <span className="italic" style={{ color: T.accent }}>Tugatish — qahramonlik.</span>»</h1>
        <Mentor>Arxitektura, analitika, birinchi ekran, dizayn — hammasi tayyor (99–102). Endi eng qiyin qadam: hammasini yig'ib, <b style={{ color: T.ink }}>internetga chiqarish</b>.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💼 REID HOFFMAN · LINKEDIN ASOSCHISI</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(15px,2vw,17px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«Agar mahsulotingizning birinchi versiyasidan UYALMASANGIZ — juda kech chiqargansiz.»</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink2, margin: '10px 0 0', lineHeight: 1.5 }}>Bir founderда ishlaydigan MVP bor. Lekin u «hali tayyor emas, yana 5 ficha qo'shay» deydi…</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nima qilishi kerak?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : ''}<b>Hozir chiqarish kerak.</b> «Yana bitta ficha» — hech qachon tugamaydigan tuzoq. Ishlaydigan, biroz uyaltiradigan MVP — kutilayotgan mukammal mahsulotdan yaxshiroq, chunki u REAL foydalanuvchiga yetadi. Instagram ham «faqat rasm» bilan chiqqan. Bugun — SHIP kuni. 🚀</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Tugatish — nega boshlashdan qiyin', tag: '' },
    { text: '3 fichani AI-prompt bilan qurish', tag: 'o\'yin' },
    { text: '3 ficha → BITTA ishlaydigan oqim', tag: '' },
    { text: '«Done vs perfekt» chegara + SHIP!', tag: 'o\'yin' },
    { text: 'SHIP yozuvi — portfolio 11-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.accent} soft={T.accentSoft}>{Ico.rocket(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>G'oyani jonli mahsulotga</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Hammasini yig'ib, internetga chiqaramiz. Bugun 🔨 Quruvchi nishonini olasiz.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Qur bosqichi · 5-dars. Keyingisi: real odam bilan test 🧪</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">SHIP kuni: <span className="italic" style={{ color: T.accent }}>chiqaramiz</span></h2></div>
        <Mentor>Bugun hech narsa qo'shmaymiz — aksincha, <b style={{ color: T.ink }}>kesamiz va chiqaramiz</b>. 3 fichani ulab, «tayyor» chizig'ini chizib, deploy tugmasini bosamiz. Bu — eng qo'rqinchli va eng zavqli qadam.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — PERFEKSIONIST vs SHIPPER =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('perf');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['perf', 'ship']) : new Set(['perf']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isPerf = v === 'perf';
  return (
    <Stage eyebrow="Tugatish muammosi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala yo\'lni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega <span className="italic" style={{ color: T.accent }}>tugatish</span> boshlashdan qiyin?</h2></div>
        <Mentor>Boshlash zavqli — bo'sh sahifa, cheksiz imkoniyat. Tugatish qo'rqinchli — endi odamlar ko'radi. Ikki founderni solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isPerf ? 'chip-on' : ''}`} onClick={() => set('perf')}>🐌 Perfeksionist</button>
              <button className={`chip ${!isPerf ? 'chip-on' : ''}`} onClick={() => set('ship')}>🚀 Shipper</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isPerf ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isPerf
                ? '«Hali tayyor emas. Yana bu ficha, yana o\'sha tugma, yana bir hafta...» 3 oy o\'tadi. Mahsulot hech qachon chiqmaydi. Nol foydalanuvchi, nol fidbek, nol o\'rganish. Mukammallik — chiqmaslikning chiroyli bahonasi.'
                : '«Ishlaydi? Chiqaramiz.» Biroz uyaltiradi, lekin REAL foydalanuvchi qo\'lда. Birinchi kunдаyoq fidbek keladi: nima ishlaydi, nima yo\'q. Har hafta yaxshilanadi. Harakatда o\'rganadi.'}</p>
            </div>
          </Col>
          <Col>
            {isPerf
              ? <div className="frame-warn fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>Perfeksionizm — yashirin qo'rquv. «Mukammal emas» degani aslida «tanqiddan qo'rqaman». Lekin chiqmagan mahsulot — o'lik mahsulot.</p></div>
              : <div className="frame-success fade-step" key="s"><p className="body" style={{ margin: 0, color: T.ink }}>Shipper haqiqatni tanlaydi: real dunyoда sinaladigan v1 — boshда tasavvur qilingan «mukammal» v10 dan qimmatliroq. Chunki v10 taxmin, v1 — dalil.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yodda tuting: <b>chiqarilmagan mukammal mahsulot — 0 ga teng.</b> Chiqarilgan «yetarlicha yaxshi» mahsulot — cheksiz o'rganish boshlanishi. Bugun shipper bo'lamiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — DONE > PERFECT =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  const DONE = [
    { ic: '✅', t: 'Core job boshidan oxirigacha ISHLAYDI', c: T.success },
    { ic: '✅', t: 'Foydalanuvchi muammosiga JAVOB oladi', c: T.success },
    { ic: '✅', t: 'Internetда ochiladi (havola bor)', c: T.success }
  ];
  const NOT = [
    { ic: '❌', t: 'Har piksel mukammal', c: T.ink3 },
    { ic: '❌', t: 'Barcha rejalashtirilgan ficha bor', c: T.ink3 },
    { ic: '❌', t: 'Hech qanday kamchilik yo\'q', c: T.ink3 }
  ];
  return (
    <Stage eyebrow="«Done» nima" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Ta\'rifni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Tayyor» degani <span className="italic" style={{ color: T.accent }}>«mukammal» emas</span></h2></div>
        <Mentor>Facebook devorида yozuv bor edi: <b style={{ color: T.ink }}>«Done is better than perfect»</b>. MVP uchun «tayyor»ning aniq ta'rifi bor — uni bilib olaylik.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.success}` }}>
              <p className="flow-label" style={{ color: T.success, marginBottom: 10 }}>MVP «TAYYOR» = shu 3 ta</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{DONE.map((d, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ fontSize: 15 }}>{d.ic}</span><span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{d.t}</span></div>))}</div>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.ink3}` }}>
              <p className="flow-label" style={{ color: T.ink3, marginBottom: 10 }}>«TAYYOR» BU EMAS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{NOT.map((d, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ fontSize: 15, opacity: 0.6 }}>{d.ic}</span><span style={{ fontSize: 13.5, fontWeight: 500, color: T.ink3, textDecoration: 'line-through' }}>{d.t}</span></div>))}</div>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Tushundim</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>«Tayyor» = core job ishlaydi + odam javob oladi + internetда. Shu uchtasi bo'lsa — CHIQARING. Qolgani v2, v3, v10 da yaxshilanadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="MVP «tayyor» qachon hisoblanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>MVP <span className="italic" style={{ color: T.accent }}>«tayyor»</span> qachon?</h2></>}
    options={['Barcha rejalashtirilgan fichalar qo\'shilganда', 'Core job ishlaganда + odam javob olganда + internetда bo\'lganда', 'Hech qanday kamchilik qolmaganда', 'Dizayn 100% mukammal bo\'lganда']} correctIdx={1}
    explainCorrect="To'g'ri! «Tayyor» = core job boshidan oxirigacha ishlaydi, foydalanuvchi muammosiga javob oladi va u internetда ochiladi. Perfeksionizm emas — ishlaydigan minimal. «Done > perfect»."
    explainWrong={{ 0: 'Barcha ficha — bu v10, MVP emas. Core yetarli.', 2: 'Kamchilik doim bo\'ladi — v2 da tuzatiladi. Kutmang.', 3: 'Dizayn muhim, lekin 100% mukammallik — chiqmaslik bahonasi.', default: 'Core ishlaydi + javob + internetда = tayyor.' }} />
);

// ===== SCREEN 5 — FICHA → AI-PROMPT (SIGNATURE 1) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [built, setBuilt] = useState(() => storedAnswer ? new Set(BUILD_FEATURES.map(f => f.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? BUILD_FEATURES[0].id : null);
  const workRef = useRef(null);
  const done = built.size >= BUILD_FEATURES.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const build = (id) => { setActive(id); setBuilt(prev => { const n = new Set(prev); n.add(id); return n; }); };
  const cur = active ? BUILD_FEATURES.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="Ficha → prompt · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 fichani qurdiring (${built.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">3 fichani <span className="italic" style={{ color: T.accent }}>AI bilan qurdiring</span></h2></div>
        <Mentor>98-darsda 3 fichaga qaror qilgansiz. Endi har biriga aniq prompt bering (101-mahorat!) — AI kodni yozadi, siz kapitan bo'lasiz. Har fichani bosing.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BUILD_FEATURES.map(f => { const on = built.has(f.id); return (
                <button key={f.id} className={`plink ${active === f.id ? 'plink-on' : ''}`} onClick={() => build(f.id)}>
                  <span style={{ fontSize: 18, minWidth: 24 }}>{f.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{f.name}</span><br /><span className="mono" style={{ fontSize: 10, color: f.color, fontWeight: 700, letterSpacing: '0.04em' }}>{f.tag}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act" style={{ color: f.color }}>qurish</span>}
                </button>
              ); })}
            </div>
            <div className="fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🔧 MVP qurilmoqda</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{built.size}/3</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(built.size / 3) * 100}%`, background: done ? T.success : undefined }} /></div>
            </div>
          </Col>
          <Col>
            {cur ? (<div className="fade-step" key={active}>
              <CodeCard file={`prompt-${cur.id}.txt`}>
                <div><span style={{ color: CODE.punct }}>[KONTEKST] </span><span style={{ color: CODE.text }}>PERN, avtobus-tracker MVP</span></div>
                <div style={{ marginTop: 4 }}><span style={{ color: CODE.punct }}>[VAZIFA] </span><span style={{ color: CODE.text }}>{cur.prompt}</span></div>
              </CodeCard>
              <div className="frame-success" style={{ marginTop: 10 }}><p className="body" style={{ margin: 0, color: T.ink }}><b>✓ Qurildi.</b> {cur.done}</p></div>
            </div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Fichani bosing — prompt paydo bo'ladi</p></div>)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 ficha ham qurildi! Diqqat: har prompt <b>bitta aniq ishга</b> qaratilgan — «hammasini qil» emas. Kichik, aniq promptlar = AI aniq kod yozadi. Endi ularni ulaymiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Katta ficha uchun AI'ga qanday prompt berish yaxshiroq?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI'ga fichalarni <span className="italic" style={{ color: T.accent }}>qanday</span> qurdirasiz?</h2></>}
    options={['«Butun ilovani bir promptда qil» deb aytaman', 'Har fichaga alohida, aniq prompt beraman — kichik bo\'laklab', 'Prompt bermay, o\'zim qo\'lда yozaman', 'Faqat «chiroyli qil» deyman']} correctIdx={1}
    explainCorrect="To'g'ri! Katta ishni kichik, aniq promptlarga bo'ling. Har ficha — alohida prompt. AI kichik, aniq vazifani mukammal bajaradi; «hammasini qil» desangiz — chalkash, xato kod yozadi."
    explainWrong={{ 0: '«Butun ilova» — AI chalkashadi, tekshirib bo\'lmaydigan katta kod chiqadi.', 2: 'Qo\'lда — sekin; AI kuchini ishlating, lekin tushunib.', 3: '«Chiroyli qil» — juda umumiy, natija taxminiy.', default: 'Kichik, aniq promptlarga bo\'ling.' }} />
);

// ===== SCREEN 6 — 3 FICHA → BITTA OQIM =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  const FLOW = [
    { ic: '🛣️', t: 'Yo\'nalish tanlaydi', c: T.blue },
    { ic: '🚌', t: 'Avtobus vaqtini ko\'radi', c: T.accent },
    { ic: '📊', t: 'Hodisa yoziladi', c: T.grape }
  ];
  return (
    <Stage eyebrow="Bitta oqim" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Oqimni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">3 alohida ficha emas — <span className="italic" style={{ color: T.accent }}>bitta sayohat</span></h2></div>
        <Mentor>MVP — bir-biriga ulanmagan 3 ekran emas. U <b style={{ color: T.ink }}>ketma-ket oqim</b>: foydalanuvchi bir qadamdan ikkinchisiga silliq o'tadi. Oqimni ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">Foydalanuvchi sayohati</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FLOW.map((f, i) => (
                <React.Fragment key={i}>
                  <div className="flow-node fade-up" style={{ animationDelay: `${0.1 + i * 0.12}s`, borderLeft: `4px solid ${f.c}` }}>
                    <span style={{ fontSize: 20 }}>{f.ic}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{f.t}</span>
                  </div>
                  {i < FLOW.length - 1 && <div style={{ textAlign: 'center', color: T.ink3, fontSize: 15, lineHeight: 1 }}>↓</div>}
                </React.Fragment>
              ))}
            </div>
          </Col>
          <Col>
            <CodeCard file="arxitektura (99-dars)">
              <div><span style={{ color: CODE.attr }}>Frontend</span> <span style={{ color: CODE.punct }}>→</span> tanlov va ko'rsatish</div>
              <div style={{ marginTop: 3 }}><span style={{ color: CODE.attr }}>Backend</span> <span style={{ color: CODE.punct }}>→</span> avtobus vaqtini hisoblash</div>
              <div style={{ marginTop: 3 }}><span style={{ color: CODE.attr }}>Database</span> <span style={{ color: CODE.punct }}>→</span> yo'nalishlar saqlanadi</div>
            </CodeCard>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Oqim ulandi — tekshir</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ulashда «tushuntir» darvozasi (101): har o'tishни izohlang — tanlovдан vaqt qanday keladi? Oqim uzluksiz bo'lsagina MVP «ishlaydi». Bitta bo'g'in uzilsa — butun sayohat to'xtaydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — «DONE vs PERFEKT» CHEGARA O'YINI (SIGNATURE 2) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(SHIP_TASKS.map(t => [t.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = SHIP_TASKS.filter(t => state[t.id]?.ok).length;
  const done = okCount >= SHIP_TASKS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (t, ans) => {
    if (state[t.id]?.ok) return;
    const ok = ans === t.ans;
    setState(prev => ({ ...prev, [t.id]: { ok, wrong: !ok } }));
    setLast({ id: t.id, ok, why: t.why, ans: t.ans });
  };
  return (
    <Stage eyebrow="Feature-freeze · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'SHIP\'ga tayyor →' : `Chegaralang (${okCount}/${SHIP_TASKS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Chiqarishdan oldin: <span className="italic" style={{ color: T.accent }}>✅ hozir · ⏳ v2 · ❌ hech qachon</span></h2></div>
        <Mentor>Bu — <b style={{ color: T.ink }}>feature-freeze</b>: chiqarishдан oldin ro'yxatni muzlatasiz. Har vazifага savol: <b style={{ color: T.ink }}>«Core job ishlashi uchun HOZIR shartmi?»</b> Yo'q bo'lsa — keyinга.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SHIP_TASKS.map(t => {
                const st = state[t.id] || {};
                return (
                  <div key={t.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{t.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: TMAP[t.ans].color }}>{TMAP[t.ans].emoji} {TMAP[t.ans].label}</span>
                      : <span className="sort-btns">{['ship', 'later', 'never'].map(a => (<button key={a} className="sort-btn" title={TMAP[a].label} onClick={() => pick(t, a)}>{TMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">✂️ Freeze intizomi</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{SHIP_TASKS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / SHIP_TASKS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? `✓ ${TMAP[last.ans].emoji} ${TMAP[last.ans].label}` : '✗ Qayta o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Savol: core job ishlashi uchun HOZIR shartmi? Ha — ✅; foydali-yu shoshilmas — ⏳; over-engineering — ❌.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Vazifa yonidagi ✅ / ⏳ / ❌ ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Natija: MVP = <b>3 core ficha</b>. Qolgani muzlatildi (v2) yoki tashlandi. Freeze — chiqarishни ta'minlaydi: chegarasiz «yana bitta» cheksiz cho'ziladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — DEPLOY NIMA =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  return (
    <Stage eyebrow="Deploy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'SHIP\'ga →' : 'Deploy nimaligini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Internetga chiqarish» — <span className="italic" style={{ color: T.accent }}>deploy</span></h2></div>
        <Mentor>Hozircha MVP faqat sizning kompyuteringizда ishlaydi. <b style={{ color: T.ink }}>Deploy</b> — uni internetга joylashtirish: shunda dunyoning istalgan joyидан havola orqali ochiladi (Modul 1-deploy esimizда).</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.ink3}` }}>
              <p className="note-h" style={{ color: T.ink3 }}>💻 Faqat kompyuterимда</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>localhost:3000 — faqat men ko'raman. Foydalanuvchiga yubora olmayman. Mahsulot go'yo mavjud emas.</p>
            </div>
            <div style={{ textAlign: 'center', color: T.accent, fontSize: 20 }}>↓ deploy ↓</div>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.success}` }}>
              <p className="note-h" style={{ color: T.success }}>🌍 Internetда, hamma uchun</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>avtobus-tracker.vercel.app — havola yubordim, ishladi. Malika telefonида ochadi. Mahsulot JONLI.</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)' }}>
              <p className="flow-label" style={{ marginBottom: 9 }}>🚀 Bir-klik deploy asboblari</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[{ n: 'Vercel', d: 'React/web uchun eng ommabop' }, { n: 'Netlify', d: 'oddiy va bepul' }].map((x, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.cloud(18)}</span><span style={{ fontWeight: 700, fontSize: 13, minWidth: 60 }}>{x.n}</span><span className="small" style={{ color: T.ink2 }}>{x.d}</span></div>))}</div>
              <p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Kodni ulaysiz — ular avtomatik internetга chiqaradi va havola beradi. Bepul, bir necha daqiqa.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Tayyorman — SHIP!</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Havola bo'lsa — mahsulot REAL. Endi eng zavqli qadam: uchishдан oldingi tekshiruv va deploy tugmasi. 🚀</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Feature-freeze nima uchun kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>«Feature-freeze» <span className="italic" style={{ color: T.accent }}>nima beradi</span>?</h2></>}
    options={['Kodni muzlatib, sekinlashtiradi', 'Chiqarishдан oldin ro\'yxatni muzlatadi — «yana bitta ficha» cheksizligини to\'xtatadi', 'Yangi fichalarни taqiqlaydi butunlay', 'Dizaynни o\'zgartiradi']} correctIdx={1}
    explainCorrect="To'g'ri! Feature-freeze — chiqarishдан oldin «bas, shu 3 ficha bilan chiqamiz» deb chegara chizish. Bu «yana bitta ficha» cheksiz tuzog'ini to'xtatadi va SHIP'ni ta'minlaydi. Qolgani v2 da."
    explainWrong={{ 0: 'Sekinlashtirmaydi — aksincha, chiqarishni tezlashtiradi.', 2: 'Butunlay taqiqlamaydi — v2 ga qoldiradi.', 3: 'Dizaynга aloqasi yo\'q — ficha ro\'yxatini muzlatadi.', default: 'Freeze = chegara chizib, chiqishни ta\'minlash.' }} />
);

// ===== SCREEN 10 — SHIP! (SIGNATURE 3) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [checked, setChecked] = useState(() => storedAnswer ? new Set(SHIP_CHECKS.map(c => c.id)) : new Set());
  const [phase, setPhase] = useState(storedAnswer ? 'live' : 'check'); // check | deploying | live
  const workRef = useRef(null);
  const allChecked = checked.size >= SHIP_CHECKS.length;
  const done = phase === 'live';
  const slug = useRef(toSlug(readProductName())).current;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => {
    if (phase !== 'deploying') return;
    const t = setTimeout(() => setPhase('live'), 2000);
    return () => clearTimeout(t);
  }, [phase]);
  const check = (id) => setChecked(prev => { const n = new Set(prev); n.add(id); return n; });
  const deploy = () => { if (allChecked && phase === 'check') setPhase('deploying'); };
  return (
    <Stage eyebrow="SHIP · uchirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish →' : 'Deploy qiling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)', position: 'relative' }}>
        {done && <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 5.6 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 9) * 0.14}s` }} />))}</div>}
        <div className="head"><h2 className="title h-title fade-up">{done ? <>Mahsulotingiz <span className="italic" style={{ color: T.success }}>JONLI!</span> 🎉</> : <>Uchishдан oldingi <span className="italic" style={{ color: T.accent }}>tekshiruv</span></>}</h2></div>
        {!done && <Mentor>Uchuvchilar kabi: uchishдан oldin checklistдан o'tamiz. Har bandни bosib tasdiqlang — hammasi yashil bo'lgach, deploy tugmasi ochiladi.</Mentor>}
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div ref={workRef}>
          {phase === 'check' && (
            <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {SHIP_CHECKS.map(c => { const on = checked.has(c.id); return (
                  <button key={c.id} className={`ship-check ${on ? 'ship-on' : ''}`} onClick={() => check(c.id)} disabled={on}>
                    <span className="ship-box">{on ? Ico.check(14) : ''}</span>
                    <span style={{ fontSize: 20 }}>{c.ic}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}><span style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{c.label}</span><br /><span className="small" style={{ color: T.ink3 }}>{c.sub} · {c.from}-dars</span></span>
                  </button>
                ); })}
              </div>
              <button className={`deploy-btn ${allChecked ? 'ready' : ''}`} disabled={!allChecked} onClick={deploy}>
                <span style={{ display: 'inline-flex' }}>{Ico.rocket(20)}</span> {allChecked ? 'DEPLOY — internetga chiqar!' : `Avval tekshiring (${checked.size}/${SHIP_CHECKS.length})`}
              </button>
            </div>
          )}
          {phase === 'deploying' && (
            <div className="fade-step frame" style={{ padding: 'clamp(20px,4vw,32px)', textAlign: 'center' }}>
              <span style={{ display: 'inline-flex', color: T.accent }}>{Ico.cloud(40)}</span>
              <p className="mono" style={{ fontSize: 13, color: T.ink2, margin: '10px 0 14px', letterSpacing: '0.04em' }}>build → optimallash → internetga yuklash…</p>
              <div className="deploy-track"><div className="deploy-fill" /></div>
              <p className="small" style={{ color: T.ink3, margin: '10px 0 0', fontStyle: 'italic' }}>Vercel mahsulotingizni dunyoga chiqarmoqda…</p>
            </div>
          )}
          {phase === 'live' && (
            <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="browser">
                <div className="browser-bar"><span className="cdot" style={{ background: '#FF605C' }} /><span className="cdot" style={{ background: '#FFBD44' }} /><span className="cdot" style={{ background: '#00CA4E' }} /><span className="url-pill"><span style={{ color: T.success }}>🔒</span> {slug}.vercel.app</span></div>
                <div className="browser-body"><span className="live-dot" /> <b>JONLI</b> — dunyoning istalgan joyидан ochiladi</div>
              </div>
              <div className="medal-wrap">
                <div className="medal">🔨</div>
                <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 700, margin: 0, color: T.honey, fontSize: 'clamp(17px,2.4vw,21px)' }}>🏅 Quruvchi nishoni ochildi!</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>G'oyani REAL, jonli mahsulotga aylantirdingiz. Bu — founderlikning eng katta qadamlaridan biri.</p></div>
              </div>
            </div>
          )}
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — CHIQARISH — TUGASH EMAS =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  return (
    <Stage eyebrow="Chiqarishдан keyin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Davomini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">SHIP — bu <span className="italic" style={{ color: T.accent }}>finish emas, START</span></h2></div>
        <Mentor>Ko'p yangi founder o'ylaydi: «chiqardim — tamom». Aslida aksincha: chiqarish — HAQIQIY ishning boshlanishi. Nega?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Endi mahsulot jonli — va birinchi marta <b>REAL foydalanuvchilar</b> keladi. Ular sizning taxminlaringizni sinaydi: qaysi ficha ishlaydi, qayerда adashadi, nimани so'raydi.</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Uyat tuyg'usi tez o'tadi. O'rniga qimmatbaho narsa keladi: <b>haqiqiy ma'lumot</b>. Endi taxmin qilmaysiz — kuzatasiz.</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)' }}>
              <p className="flow-label" style={{ marginBottom: 9 }}>Keyingi 2 dars</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>🧪</span><span className="body" style={{ color: T.ink }}><b>104:</b> real odam bilan test — kuzatib, muammolarni topasiz</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>🔁</span><span className="body" style={{ color: T.ink }}><b>105:</b> fidbek iteratsiyasi — eng muhim tuzatishlar</span></div>
              </div>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Tushundim</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun v1 dan uyalmaslik kerak: u mukammal bo'lish uchun emas — <b>o'rganish uchun</b> chiqadi. Har foydalanuvchi — bepul o'qituvchi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="MVP'ni chiqargandan keyin nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>SHIP — bu <span className="italic" style={{ color: T.accent }}>finishmi</span>?</h2></>}
    options={['Ha, chiqardim — ish tugadi', 'Yo\'q — endi real foydalanuvchilar keladi va HAQIQIY o\'rganish boshlanadi', 'Endi 6 oy dam olaman', 'Endi barcha fichalarни qo\'shaman']} correctIdx={1}
    explainCorrect="To'g'ri! Chiqarish — start, finish emas. Endi real foydalanuvchilar taxminlaringizni sinaydi: fidbek, kuzatuv, o'rganish boshlanadi. v1 mukammal bo'lish uchun emas — o'rganish uchun chiqadi."
    explainWrong={{ 0: 'Aksincha — chiqarish bilan asosiy ish (o\'rganish) boshlanadi.', 2: 'Dam olish emas — endi foydalanuvchilarni kuzatasiz.', 3: 'Barcha ficha emas — fidbekга qarab eng muhimini.', default: 'SHIP = o\'rganishning boshlanishi.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #10 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«To\'g\'ri, hali tayyor emas — yana bir oy ishlab, keyin chiqar»' },
    { id: 1, t: '«Core ishlaydimi? Ha. Unda BUGUN chiqar. Qolgan fichalarni v2 ga muzlat — real fidbeksiz yana 3 oy taxmin qilasan»' },
    { id: 2, t: '«Loyihani tashlab, yangisini boshla»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«3 oydan beri quraman — hali tayyor emas»</span></h2></div>
        <Mentor>Aziznang MVP'si aslida ishlaydi. Lekin u hech qachon chiqarmaydi. Xabarini o'qing…</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«3 oydan beri ustида ishlayapman. Core ishlaydi, lekin hali chiqarmadim — dark mode qo'shishim kerak, animatsiyalarni silliqlashim kerak, yana 5 ta ficha rejalashtirdim… Odamlarga ko'rsatishga uyalaman, mukammal bo'lsin!»</p>
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
            ? 'Aziz perfeksionizm tuzog\'ida: «mukammal bo\'lsin» aslida «tanqiddan qo\'rqaman» degani. Core ishlar ekan — bugun chiqarishi kerak. Uyat 5 daqiqa, o\'rganish esa cheksiz. Har qo\'shilgan ficha — real fidbeksiz yasалган yana bir taxmin. Reid Hoffman: birinchi versiyangdan uyalmasang, kech chiqargansan.'
            : (picked === 0 ? 'Bu — yana bir oylik kechikish, keyin yana bir oy... Perfeksionizm shunday cho\'zadi. Core ishlar ekan — chiqarsin.' : 'Loyiha yaxshi, muammo unда emas — Aziznang qo\'rquvida. Tashlash emas — CHIQARISH kerak.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="SHIP yozuviga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">SHIP qoidasi: <span className="italic" style={{ color: T.accent }}>chiqarilgan yaxshiroq, mukammaldan</span></h2></div>
      <Mentor>Amaliyotdan oldin kompas. 4 qoida — keyin SHIP yozuvингизни to'ldirasiz.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🚀</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — quruvchi</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>G'oyani jonli mahsulotga aylantirdingiz. Endi u dunyoда yashaydi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.flag(18), c: T.success, t: 'DONE > PERFECT — core ishlaydi = tayyor' }, { ic: Ico.scissors(18), c: T.grape, t: 'FREEZE — ro\'yxatni muzlat, «yana bitta»ni to\'xtat' }, { ic: Ico.cloud(18), c: T.blue, t: 'DEPLOY — havola bo\'lsa, mahsulot REAL' }, { ic: Ico.loop(18), c: T.accent, t: 'SHIP = START — chiqarish o\'rganishни boshlaydi' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: SHIP YOZUVI =====
const emptyShip = () => Object.fromEntries(SHIP_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyShip());
  const productName = useRef(readProductName()).current;
  const isComplete = (k) => data[k].trim().length >= (SHIP_FIELDS.find(f => f.key === k)?.min ?? 4);
  const completeCount = SHIP_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= SHIP_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson103_ship', { title: 'SHIP yozuvi', fields: SHIP_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = SHIP_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' (')[0], color: f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · SHIP yozuvi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${SHIP_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">SHIP YOZUVI: <span className="italic" style={{ color: T.accent }}>portfolio 11-sahifa</span></h2></div>
        <Mentor>Tarixiy lahza — birinchi chiqarishingizni yozib qo'ying{productName ? <> (mahsulotingiz: <b style={{ color: T.ink }}>{productName}</b>)</> : ''}. Bu sahifага bir yildan keyin qaytib qarash yoqimli bo'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {SHIP_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">SHIP yozuvingiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — yozuv shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><ShipDoc rows={docRows} />{passed && <span className="seal">CHIQARILDI 🚀</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tabriklaymiz — siz endi CHIQARGAN founder'siz! 🔨 Quruvchi nishoni sizniki. Keyingi darsda mahsulotingizni real odam bilan sinaymiz — birinchi haqiqiy fidbek! 🧪</p></div>}
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
  { t: 'Quruvchi', l: 'HOZIRGINA!' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Done > perfect: core ishlaydi + javob + internetда = tayyor', 'Feature-freeze: ro\'yxatni muzlat, «yana bitta»ni to\'xtat', 'Deploy: havola bo\'lsa — mahsulot REAL (Vercel/Netlify)', 'SHIP = start: chiqarish haqiqiy o\'rganishni boshlaydi'];
  const GLOSSARY = [{ b: 'SHIP', t: '— mahsulotni internetга chiqarish' }, { b: 'Deploy', t: '— kodni internetга joylashtirish' }, { b: 'Done > perfect', t: '— ishlaydigan v1 kutilgan v10 dan yaxshi' }, { b: 'Feature-freeze', t: '— chiqarishдан oldin ro\'yxatni muzlatish' }, { b: 'Perfeksionizm tuzog\'i', t: '— «yana bitta ficha» cheksizligi' }, { b: 'v2', t: '— keyingi versiya (muzlatilgan fichalar)' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Qur bosqichi · 5/6 tamom · 🔨 Quruvchi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        {PASSED && <div className="medal-hero fade-up"><div className="medal medal-big">🔨</div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 700, margin: '8px 0 0', color: T.honey, fontSize: 'clamp(18px,2.6vw,24px)' }}>🏅 Quruvchi nishoni olindi</p></div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.rocket(12)}</span> MVP chiqarildi · 5-dars tamom</span><h2 className="title h-title fade-up d1">Siz endi <span className="italic" style={{ color: T.accent }}>chiqargan founder</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'G\'oyani real, jonli mahsulotga aylantirdingiz. «Done > perfect» qoidasini, feature-freeze intizomini va deploy\'ni o\'rgandingiz. Ko\'plar hech qachon shu yerga yetmaydi. Keyingi darsda — birinchi real fidbek.' : 'Yaxshi harakat! Chiqarish qoidalarini mustahkamlang — perfeksionizm eng katta to\'siq.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 2 ? 'badge-done' : ''} ${i === 3 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔨' : (i === 3 ? '🧪' : '👑')))} {b.t}<span className="badge-when" style={i <= 2 ? { color: 'rgba(255,255,255,0.85)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi nishon — <b style={{ color: T.honey }}>🧪 Sinovchi</b>: real odam mahsulotингизни sinaganда (104-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🚀</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — HAQIQATAN chiqaring</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>MVP'ingizni Vercel yoki Netlify'ga yuklang (bepul, 10 daqiqa) va jonli havolani oling. Keyin uni <b>3 kishига</b> yuboring — do'st, oila, sinfdosh. Uyaltiradi? Demak to'g'ri vaqtда chiqaryapsiz. Keyingi dars: real odam bilan test 🧪.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function MvpBuild2Lesson({ lang: langProp, onFinished }) {
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

        /* === SHIP / DEPLOY === */
        .ship-check { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 12px; padding: 12px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); text-align: left; }
        .ship-check:hover:not(:disabled) { transform: translateY(-1px); }
        .ship-check:disabled { cursor: default; }
        .ship-on { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .ship-box { width: 22px; height: 22px; min-width: 22px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; color: #fff; background: ${T.success}; box-shadow: inset 0 0 0 2px ${T.ink3}44; transition: background 0.2s; }
        .ship-check:not(.ship-on) .ship-box { background: transparent; }
        .deploy-btn { width: 100%; border: none; border-radius: 13px; padding: clamp(13px,2.2vw,17px); font-family: 'Manrope'; font-weight: 800; font-size: clamp(14px,1.9vw,17px); background: ${T.ink3}44; color: ${T.ink3}; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.25s; letter-spacing: 0.01em; }
        .deploy-btn.ready { background: linear-gradient(100deg, ${T.accent}, ${T.honey}); color: #fff; cursor: pointer; box-shadow: 0 12px 30px -8px rgba(255,79,40,0.5); animation: deploy-pulse 1.6s ease-in-out infinite; }
        .deploy-btn.ready:hover { transform: translateY(-2px); box-shadow: 0 16px 36px -8px rgba(255,79,40,0.6); }
        @keyframes deploy-pulse { 0%,100% { box-shadow: 0 12px 30px -8px rgba(255,79,40,0.5); } 50% { box-shadow: 0 12px 34px -6px rgba(255,79,40,0.72); } }
        .deploy-track { height: 12px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; max-width: 340px; margin: 0 auto; }
        .deploy-fill { height: 100%; width: 0; background: linear-gradient(90deg, ${T.accent}, ${T.honey}, ${T.success}); border-radius: 99px; animation: deploy-load 2s cubic-bezier(.35,.6,.3,1) forwards; }
        @keyframes deploy-load { 0% { width: 4%; } 30% { width: 42%; } 62% { width: 68%; } 100% { width: 100%; } }

        /* === BROWSER === */
        .browser { border-radius: 13px; overflow: hidden; box-shadow: 0 14px 34px -12px rgba(${T.shadowBase},0.34); border: 1px solid ${T.ink3}33; }
        .browser-bar { display: flex; align-items: center; gap: 6px; background: #E9E5DE; padding: 9px 12px; }
        .url-pill { flex: 1; margin-left: 8px; background: #fff; border-radius: 7px; padding: 5px 12px; font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink}; display: flex; align-items: center; gap: 6px; }
        .browser-body { background: #fff; padding: 18px 16px; font-family: 'Manrope'; font-size: 14px; color: ${T.ink}; display: flex; align-items: center; gap: 9px; }
        .live-dot { width: 9px; height: 9px; border-radius: 50%; background: ${T.success}; box-shadow: 0 0 9px ${T.success}; animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

        /* === MEDAL === */
        .medal-wrap { display: flex; align-items: center; gap: 16px; background: ${T.honeySoft}; border-radius: 14px; padding: 16px 18px; box-shadow: 0 8px 22px -10px rgba(224,137,43,0.4); }
        .medal { font-size: 40px; animation: medal-drop 0.7s cubic-bezier(.3,.9,.4,1.5) both; filter: drop-shadow(0 6px 10px rgba(224,137,43,0.5)); }
        .medal-big { font-size: clamp(52px,11vw,74px); }
        @keyframes medal-drop { 0% { opacity: 0; transform: translateY(-40px) scale(0.4) rotate(-25deg); } 60% { opacity: 1; transform: translateY(6px) scale(1.12) rotate(8deg); } 100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); } }
        .medal-hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 6px 0 2px; }

        /* === FLOW NODE === */
        .flow-node { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border-radius: 11px; padding: 12px 15px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.18); opacity: 0; }

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
        .sort-btns { display: inline-flex; gap: 5px; flex-shrink: 0; }
        .sort-btn { width: 34px; height: 30px; border: none; border-radius: 9px; background: ${T.bg}; font-size: 14px; cursor: pointer; transition: all 0.15s; }
        .sort-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.3); background: ${T.accentSoft}; }
        .sort-verdict { font-family: 'Manrope'; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; flex-shrink: 0; animation: feat-pop .3s cubic-bezier(.2,.7,.2,1); }

        /* === METER === */
        .fmeter-track { height: 10px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; }
        .fmeter-fill { height: 100%; background: linear-gradient(90deg, ${T.honey}, ${T.accent}); border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.45); }

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
        .code-file { display: flex; align-items: center; gap: 6px; padding-bottom: 10px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .cdot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
        .code-name { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #9FB4D8; margin-left: 6px; }
        .code-pre { font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.6vw,13px); color: ${CODE.text}; line-height: 1.7; margin: 0; white-space: pre-wrap; word-break: break-word; overflow-x: auto; }

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
