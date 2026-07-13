import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PM 20-DARS (Modul 08 · Botlar · PM2) — CUSTDEV: JONLI FOYDALANUVCHILAR BILAN — PLATFORM STANDARD v16
// G'oya: foydalanuvchini bezovta qilmasdan fidbek yig'ish; 5-savol shabloni; birinchi 20 dan nima so'rash.
//        Yakuniy ish: 5 ta mini-intervyu rejasini tuzish (kim + qaysi savollar).
// Joylashuv: BotFullProject (P3 hosting) dan keyin — bot jonli, PM1 dan birinchi 20 user bor → endi so'raymiz.
// Markaziy g'oya: "Taxmin qilma — so'ra". Yetaklovchi savol = xushomad; ochiq + o'tmish xulqi savoli = insayt.
// Signature 1: jonli intervyu simulyatori (savol → javob: insayt vs xushomad). Signature 2: 5-savol skripti.
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
  problem: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1 .9-1 1.7" /><path d="M12 16.7h.01" /></svg>),
  clip: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0" /><path d="M8.5 11l1.5 1.5 3-3M8.5 16l1.5 1.5 3-3" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4M5 5h12l-2 3.5L17 12H5" /></svg>),
  mic: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v3" /></svg>),
  chat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 5h16v11H8l-4 4V5z" /></svg>),
  ear: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M7 9a5 5 0 0 1 10 0c0 3-2 4-3 5.5S13 18 12 19a3 3 0 0 1-5-2" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0" /></svg>),
  search: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>),
  bulb: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" /></svg>),
  user: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3-5.6 7-5.6s7 2 7 5.6" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>)
};

const LESSON_META = { lessonId: 'pm-custdev-20-v16', lessonTitle: { uz: 'Custdev: jonli foydalanuvchilar bilan', ru: 'Custdev с живыми пользователями' } };
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
// Bezovta qilmaslik qoidalari (s3)
const RESPECT = [
  { id: 'permit', emoji: '🙋', label: 'Avval ruxsat so\'ra', how: '"1 daqiqa vaqting bormi?" — majburlama, hurmat bilan.' },
  { id: 'short', emoji: '⏱️', label: 'Qisqa bo\'l', how: '2-3 daqiqa yetadi. Uzoq so\'roq odamni charchatadi.' },
  { id: 'time', emoji: '🕐', label: 'To\'g\'ri vaqtda', how: 'Dars vaqtida emas, bo\'sh paytida yoz.' },
  { id: 'thanks', emoji: '🙏', label: 'Rahmat ayt', how: 'Vaqti uchun minnatdorchilik — keyingi safar ham yordam beradi.' },
  { id: 'nospam', emoji: '🚫', label: 'Spam qilma', how: 'Bir marta so\'ra. Javob bermasa, qayta-qayta yozma.' }
];

// Yaxshi vs yomon savol (s5)
const BADQ = ['"Botim zo\'rmi?" — yetaklovchi (ha deyishga majbur)', '"Kelajakda pul to\'laysizmi?" — gipotetik', '"5 yulduz berasizmi?" — bosim'];
const GOODQ = ['"Qaysi qism qiyin bo\'ldi?" — ochiq', '"Oxirgi marta qachon ishlatdingiz?" — real xulq', '"Nima yetishmadi?" — muammoni ochadi'];

// Intervyu simulyatori (s6)
const INTERVIEW = [
  { id: 'q1', q: 'Botim zo\'rmi? 😍', reply: 'Ha, juda zo\'r! 👍', good: false, why: 'Yetaklovchi savol — odam sizni xafa qilmaslik uchun "ha" deydi. Hech narsa o\'rganmadingiz.' },
  { id: 'q2', q: 'Kelajakda pul to\'larmidingiz?', reply: 'Ehtimol... bilmadim 🤷', good: false, why: 'Gipotetik (faraziy) savol — odamlar kelajak haqida noaniq gapiradi. Ishonchsiz javob.' },
  { id: 'q3', q: 'Qaysi qism qiyin bo\'ldi?', reply: 'To\'lov tugmasini topolmadim 😕', good: true, why: 'Ochiq + real tajriba haqida — aniq muammoni ko\'rsatdi. Mana haqiqiy insayt!' },
  { id: 'q4', q: 'Oxirgi marta qachon ishlatdingiz?', reply: 'Kecha, uy vazifa uchun 📚', good: true, why: 'O\'tmish xulqi haqida — haqiqiy foydalanishni ko\'rsatadi. Ishonchli ma\'lumot.' }
];

// 5-savol skripti pool (s8)
const POOL = [
  { id: 'p1', q: 'Botni nima uchun ishlatdingiz?', good: true },
  { id: 'p2', q: 'Oxirgi marta qachon ishlatdingiz?', good: true },
  { id: 'p3', q: 'Qaysi qism qiyin yoki noqulay bo\'ldi?', good: true },
  { id: 'p4', q: 'Nima yetishmadi deb o\'ylaysiz?', good: true },
  { id: 'p5', q: 'Do\'stingizga tavsiya qilasizmi? Nega?', good: true },
  { id: 'b1', q: 'Botim zo\'r-a? 😄', good: false, why: 'Yetaklovchi' },
  { id: 'b2', q: 'Menga 5 yulduz berasizmi?', good: false, why: 'Bosim' },
  { id: 'b3', q: 'Kelajakda pul to\'laysizmi?', good: false, why: 'Gipotetik' }
];

// To'liq hikoya (s13)
const CASE_AC = [
  { tag: 'TAXMIN', color: T.accent, text: '"Menimcha rang yoqmagandir" deb o\'yladi', why: 'Taxmin bilan tuzatish — ko\'pincha noto\'g\'ri yo\'nalish.' },
  { tag: 'INTERVYU', color: T.honey, text: '5 ta foydalanuvchidan ochiq savol bilan so\'radi', why: 'Bezovta qilmasdan, qisqa: "qaysi qism qiyin bo\'ldi?"' },
  { tag: 'NAQSH', color: T.blue, text: '5 dan 3 tasi "to\'lov tugmasini topmadim" dedi', why: 'Bir xil shikoyat takrorlandi — bu aniq signal.' },
  { tag: 'NATIJA', color: T.success, text: 'To\'lov tugmasini tuzatdi → qaytish (retention) oshdi', why: 'Real muammo, real yechim. Taxmin emas — ma\'lumot.' }
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

// ===== SCREEN 0 — HOOK (taxmin vs so'rash) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [v, setV] = useState('guess');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'O\'zim taxmin qilaman — menga ko\'rinib turibdi' },
    { id: 'b', label: 'Foydalanuvchilardan so\'rayman — ular haqiqatni biladi' },
    { id: 'c', label: 'Hech narsa qilmayman' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  const cur = v === 'guess'
    ? { who: 'Siz (taxmin)', emoji: '🤔', say: 'Menimcha, foydalanuvchilarga rang yoqmagan. Shuni o\'zgartiraman.', ok: false }
    : { who: 'Foydalanuvchi (haqiqat)', emoji: '💬', say: 'Rang yaxshi! Lekin to\'lov tugmasini umuman topolmadim — shuning uchun tashlab ketdim.', ok: true };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>20 foydalanuvchingiz bor. Nimani <span className="italic" style={{ color: T.accent }}>tuzatish</span> kerak?</h1>
        <Mentor>Bot jonli, birinchi 20 foydalanuvchi bor. Endi nimani yaxshilash kerakligini qanday bilasiz — taxminmi yoki so'rabmi? Ikkalasini bosing.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'guess' ? 'chip-on' : ''}`} onClick={() => setV('guess')}>🤔 Taxmin</button>
              <button className={`chip ${v === 'ask' ? 'chip-on' : ''}`} onClick={() => setV('ask')}>💬 So'rash</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '16px 17px', boxShadow: `0 8px 20px -8px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${cur.ok ? T.success : T.accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span style={{ fontSize: 22 }}>{cur.emoji}</span><span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 14, color: T.ink }}>{cur.who}</span></div>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: 0 }}>"{cur.say}"</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Eng ishonchli yo'l qaysi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Taxmin ko'pincha noto'g'ri — siz o'zingiz foydalanuvchi emassiz. <b>Custdev</b> = real foydalanuvchilar bilan suhbat. Bugun ularni <b>bezovta qilmasdan</b>, to'g'ri savollar bilan so'rashni o'rganamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: '"Taxmin qilma — so\'ra": siz foydalanuvchi emassiz', tag: '' },
    { text: 'Bezovta qilmasdan so\'rash qoidalari', tag: '' },
    { text: 'Yaxshi vs yomon savol (ochiq vs yetaklovchi)', tag: '' },
    { text: 'Jonli intervyu + 5-savol shabloni', tag: 'jonli' },
    { text: '5 mini-intervyu rejangizni tuzasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.mic(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>So'ra, taxmin qilma</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>To'g'ri savol = haqiqiy insayt (muhim xulosa).</p></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Birinchi 20 foydalanuvchidan nima so'rashni o'rganamiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Foydalanuvchidan qanday to'g'ri so'rash kerak?</span></h2></div>
        <Mentor>Custdev — bu so'roq emas, <b style={{ color: T.ink }}>suhbat</b>. Maqsad: haqiqatni bilish, xushomad emas. Buning o'z san'ati bor.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — TAXMIN vs HAQIQAT (metafora) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('guess');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['guess', 'ask']) : new Set(['guess']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Taxmin vs haqiqat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Shifokor <span className="italic" style={{ color: T.accent }}>so'ramasdan dori yozmaydi</span></h2></div>
        <Mentor>Yaxshi shifokor avval so'raydi: "qayeringiz og'riyapti?". Siz ham mahsulotni "davolashdan" oldin so'rashingiz kerak. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'guess' ? 'chip-on' : ''}`} onClick={() => set('guess')}>🤔 Taxmin bilan</button>
              <button className={`chip ${v === 'ask' ? 'chip-on' : ''}`} onClick={() => set('ask')}>🩺 So'rab</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'ask' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'ask' ? '🩺' : '🎲'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'guess'
                ? 'Taxmin bilan "davolash" — bemorni ko\'rmasdan dori yozgandek. Ko\'pincha noto\'g\'ri muammoni tuzatasiz.'
                : 'So\'rab bilsangiz — aniq muammoni topasiz. Vaqt va kuchni to\'g\'ri joyga sarflaysiz.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'guess'
              ? <div className="frame-warn fade-step" key="g"><p className="body" style={{ margin: 0, color: T.ink }}>Siz o'zingiz foydalanuvchi emassiz — sizning his-tuyg'ungiz ularnikidan farq qiladi.</p></div>
              : <div className="frame-success fade-step" key="a"><p className="body" style={{ margin: 0, color: T.ink }}>Real foydalanuvchi — haqiqatning yagona manbai. Ulardan o'rganing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: mahsulot haqida taxmin qilma — foydalanuvchidan so'ra.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BEZOVTA QILMASLIK =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(RESPECT.map(r => r.id)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= RESPECT.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? RESPECT.find(r => r.id === active) : null;
  return (
    <Stage eyebrow="Bezovta qilmaslik" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${RESPECT.length} qoidani ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Fikr so'rang — <span className="italic" style={{ color: T.accent }}>lekin bezovta qilmasdan</span></h2></div>
        <Mentor>Odamlar yordam berishni xohlaydi — agar siz ularni hurmat qilsangiz. 5 ta oltin qoida. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RESPECT.map(r => (<button key={r.id} onClick={() => tap(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === r.id ? `inset 0 0 0 2px ${T.grape}, 0 8px 20px -8px ${T.grape}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ fontSize: 19 }}>{r.emoji}</span><span style={{ flex: 1, fontFamily: "'Manrope'", fontWeight: 600, fontSize: 13.5, color: T.ink }}>{r.label}</span>{seen.has(r.id) && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.emoji}</span><span className="sk-wordbadge" style={{ color: T.grape, background: T.grapeSoft }}>{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{cur.how}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qoidani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hurmat bilan so'rasangiz — odamlar mamnuniyat bilan yordam beradi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Nimani yaxshilashni bilishning eng ishonchli yo'li?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nimani yaxshilashni bilishning eng <span className="italic" style={{ color: T.accent }}>ishonchli</span> yo'li?</h2></>}
    options={['O\'zim taxmin qilaman', 'Real foydalanuvchilardan so\'rayman (custdev)', 'Tasodifan o\'zgartiraman', 'Boshqa botlarga qarayman']} correctIdx={1}
    explainCorrect="To'g'ri! Custdev — real foydalanuvchidan so'rash. Siz o'zingiz foydalanuvchi emassiz, shuning uchun taxmin ko'pincha xato."
    explainWrong={{ 0: 'Taxmin xavfli — siz foydalanuvchi emassiz.', 2: 'Tasodif — vaqtni behuda sarflash.', 3: 'Boshqalar boshqa muammoni hal qiladi. O\'zingiznikidan so\'rang.', default: 'Eng ishonchli — foydalanuvchidan so\'rash.' }} />
);

// ===== SCREEN 5 — YAXSHI vs YOMON SAVOL =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('bad');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['bad', 'good']) : new Set(['bad']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const list = v === 'bad' ? BADQ : GOODQ;
  const col = v === 'bad' ? T.accent : T.success;
  return (
    <Stage eyebrow="Yaxshi vs yomon savol" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Savolingiz <span className="italic" style={{ color: T.accent }}>javobni belgilaydi</span></h2></div>
        <Mentor>Yomon savol — yolg'on (xushomad) javob keltiradi. Yaxshi savol — haqiqat. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'bad' ? 'chip-on' : ''}`} onClick={() => set('bad')}>🚫 Yomon savol</button>
              <button className={`chip ${v === 'good' ? 'chip-on' : ''}`} onClick={() => set('good')}>✅ Yaxshi savol</button>
            </div>
            <div key={v} className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: T.paper, borderRadius: 11, padding: '11px 13px', borderLeft: `3px solid ${col}`, boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: col, display: 'inline-flex', marginTop: 1 }}>{v === 'bad' ? Ico.x(15) : Ico.check(15)}</span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink, lineHeight: 1.4 }}>{c}</span></div>))}
            </div>
          </Col>
          <Col>
            {v === 'bad'
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Yetaklovchi va gipotetik savollar odamni "ha" deyishga undaydi — foydasiz.</p></div>
              : <div className="frame-success fade-step" key="g"><p className="body" style={{ margin: 0, color: T.ink }}>Ochiq savollar (qaysi? qachon? nima?) real tajriba va muammoni ochadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ochiq so'rang, o'tmish xulqi haqida — kelajak yoki fikr haqida emas.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Qaysi savol yaxshi (insayt beradi)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi savol <span className="italic" style={{ color: T.accent }}>yaxshi</span>?</h2></>}
    options={['"Botim zo\'rmi?"', '"Qaysi qism qiyin bo\'ldi?"', '"Menga 5 yulduz berasizmi?"', '"Mahsulotim sizga yoqdimi?"']} correctIdx={1}
    explainCorrect="To'g'ri! Bu ochiq savol — odam real tajribasini aytadi va aniq muammoni ko'rsatadi. Insayt shu yerdan keladi."
    explainWrong={{ 0: 'Yetaklovchi — "ha" deyishga undaydi.', 2: 'Bosim — samimiy javob bermaydi.', 3: 'Yetaklovchi va noaniq — "ha, yoqdi" deydi xolos.', default: 'Ochiq savol (qaysi/qachon/nima) yaxshi.' }} />
);

// ===== SCREEN 6 — JONLI INTERVYU SIMULYATORI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(storedAnswer ? 'q3' : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(INTERVIEW.map(q => q.id)) : new Set());
  const workRef = useRef(null);
  const done = seen.size >= INTERVIEW.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const cur = active ? INTERVIEW.find(q => q.id === active) : null;
  return (
    <Stage eyebrow="Intervyu simulyatori" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Savollarni sinab ko'ring (${seen.size}/${INTERVIEW.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Jonli intervyu: <span className="italic" style={{ color: T.accent }}>savolni sinab ko'ring</span></h2></div>
        <Mentor>Foydalanuvchi bilan suhbatdasiz. Savolni tanlang — u <b style={{ color: T.ink }}>chat'da javob beradi</b>. Yaxshi savol insayt, yomon savol xushomad keltiradi. Hammasini sinang!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">Savolingizni tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {INTERVIEW.map(q => (<button key={q.id} onClick={() => tap(q.id)} className="iq-btn" style={{ boxShadow: active === q.id ? `inset 0 0 0 2px ${T.ink}, 0 8px 20px -8px rgba(${T.shadowBase},0.3)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ flex: 1, textAlign: 'left' }}>{q.q}</span>{seen.has(q.id) && <span style={{ color: q.good ? T.success : T.accent, display: 'inline-flex' }}>{q.good ? Ico.check(14) : Ico.x(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            <div className="phone">
              <div className="phone-bar"><span style={{ fontSize: 16 }}>🙂</span><span className="phone-name">Foydalanuvchi</span><span className="phone-live">● onlayn</span></div>
              <div className="phone-body">
                {!cur && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: '14px 0' }}>Savol tanlang — suhbat boshlanadi…</p>}
                {cur && <><div key={'q' + active} className="imsg imsg-you feat-pop">{cur.q}</div><div key={'a' + active} className="imsg imsg-them imsg-delay">{cur.reply}</div></>}
              </div>
            </div>
            {cur && <div className={`fade-step ${cur.good ? 'frame-success' : 'frame-warn'}`} key={'v' + active}><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 700, color: cur.good ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cur.good ? '✅ Insayt!' : '❌ Foydasiz'}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.why}</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — O'TMISH XULQI > FIKR =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('future');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['future', 'past']) : new Set(['future']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'tmish > fikr" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Qachon ishlatdingiz?" &gt; <span className="italic" style={{ color: T.accent }}>"Ishlatasizmi?"</span></h2></div>
        <Mentor>Odamlar kelajak haqida xato bashorat qiladi, lekin o'tmishni aniq eslaydi. Shuning uchun real xulq haqida so'rang. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'future' ? 'chip-on' : ''}`} onClick={() => set('future')}>🔮 Kelajak/fikr</button>
              <button className={`chip ${v === 'past' ? 'chip-on' : ''}`} onClick={() => set('past')}>📅 O'tmish/xulq</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'past' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'past' ? '📅' : '🔮'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'future'
                ? '"Buni ishlatasizmi?" → "Ha, albatta!" deydi, lekin keyin ishlatmaydi. Odamlar o\'zini yaxshi ko\'rsatadi.'
                : '"Oxirgi marta qachon ishlatdingiz?" → "Kecha" yoki "hech qachon" — bu HAQIQATni ko\'rsatadi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'future'
              ? <div className="frame-warn fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>Kelajak va'dalari arzon — odamlar xushmuomalalik uchun "ha" deydi.</p></div>
              : <div className="frame-success fade-step" key="p"><p className="body" style={{ margin: 0, color: T.ink }}>O'tmish xulqi — yolg'on gapirib bo'lmaydigan haqiqat. Eng ishonchli signal.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Savolni o'tmishga yo'naltiring: "qachon?", "qanday qildingiz?", "nima bo'ldi?".</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — 5-SAVOL SKRIPTI QURUVCHI (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sel, setSel] = useState(() => storedAnswer ? new Set(POOL.filter(p => p.good).map(p => p.id)) : new Set());
  const [wrong, setWrong] = useState(null);
  const [wrongKey, setWrongKey] = useState(0);
  const workRef = useRef(null);
  const goodSel = [...sel].filter(id => POOL.find(p => p.id === id)?.good);
  const done = goodSel.length >= 5;
  const tap = (p) => {
    if (!p.good) { setWrong(p.id); setWrongKey(k => k + 1); return; }
    setWrong(null);
    setSel(prev => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else if (goodSel.length < 5) n.add(p.id); return n; });
  };
  useEffect(() => {
    if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (done && typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [done]);
  const scriptList = POOL.filter(p => sel.has(p.id) && p.good);
  return (
    <Stage eyebrow="5-savol skripti" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 yaxshi savol tanlang (${goodSel.length}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'zingizning <span className="italic" style={{ color: T.accent }}>5-savol shabloningiz</span></h2></div>
        <Mentor>8 savoldan eng yaxshi <b style={{ color: T.ink }}>5 tasini</b> tanlab, custdev skriptingizni yig'ing. Yetaklovchi savollarni qo'shmang!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">Savollar to'plami — yaxshilarini tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {POOL.map(p => { const on = sel.has(p.id) && p.good; const isWrong = wrong === p.id; return (
                <button key={p.id + (isWrong ? wrongKey : '')} onClick={() => tap(p)} className={`pool-q ${on ? 'pool-on' : ''} ${isWrong ? 'shake-x pool-bad' : ''}`}>
                  <span className="pool-box" style={{ background: on ? T.success : 'transparent', boxShadow: on ? 'none' : `inset 0 0 0 1.7px ${T.ink3}`, color: '#fff' }}>{on ? Ico.check(12) : ''}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{p.q}</span>
                  {isWrong && <span className="mono" style={{ fontSize: 9, fontWeight: 800, color: T.accent }}>{p.why?.toUpperCase()}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Sizning custdev skriptingiz</p>
            <div className="script-card">
              <div className="script-head"><span style={{ display: 'inline-flex' }}>{Ico.clip(15)}</span><span>5-SAVOL SHABLONI</span><span className="script-count">{scriptList.length}/5</span></div>
              {scriptList.length === 0 && <p className="small" style={{ color: '#9FB4D8', fontStyle: 'italic', textAlign: 'center', margin: '14px 0' }}>Yaxshi savollarni tanlang…</p>}
              {scriptList.map((p, j) => (<div key={p.id} className="script-row feat-pop"><span className="script-num">{j + 1}</span><span>{p.q}</span></div>))}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor shablon! Shu 5 savol bilan istalgan foydalanuvchidan insayt olasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Nega 'Botim zo'rmi?' yomon savol?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega <span className="italic" style={{ color: T.accent }}>"Botim zo'rmi?"</span> — yomon savol?</h2></>}
    options={['Juda uzun', 'Yetaklovchi — odam sizni xafa qilmaslik uchun "ha" deydi', 'Juda qisqa', 'Inglizcha emas']} correctIdx={1}
    explainCorrect="To'g'ri! Bu yetaklovchi savol — javob allaqachon ichida. Odam xushmuomalalik uchun 'ha' deydi va siz hech narsa o'rganmaysiz."
    explainWrong={{ 0: 'Uzunlik muammo emas — yetaklovchiligi muammo.', 2: 'Qisqaligi emas — javobni "yetaklab" turishi yomon.', 3: 'Til muammo emas — savol shakli muammo.', default: 'Yetaklovchi savol soxta "ha" keltiradi.' }} />
);

// ===== SCREEN 10 — TINGLA, HIMOYALANMA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('defend');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['defend', 'listen']) : new Set(['defend']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tingla, himoyalanma" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kritikaga <span className="italic" style={{ color: T.accent }}>bahslashma — yoz</span></h2></div>
        <Mentor>Foydalanuvchi kamchilikni aytsa, uni himoya qilish yoki bahslashish — eng katta xato. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'defend' ? 'chip-on' : ''}`} onClick={() => set('defend')}>🛡️ Himoyalanish</button>
              <button className={`chip ${v === 'listen' ? 'chip-on' : ''}`} onClick={() => set('listen')}>👂 Tinglash</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'listen' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'listen' ? '👂' : '🛡️'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'defend'
                ? '"Yo\'q, u aslida ishlaydi, siz noto\'g\'ri bosgansiz!" → odam yopiladi, boshqa fikr bermaydi.'
                : '"Tushunarli, rahmat! Aniqroq aytib bera olasizmi?" → odam ochiladi, ko\'proq insayt beradi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'defend'
              ? <div className="frame-warn fade-step" key="d"><p className="body" style={{ margin: 0, color: T.ink }}>Bahslashish = fikrni o'ldirish. Siz "g'alaba qozonasiz", lekin insaytni yo'qotasiz.</p></div>
              : <div className="frame-success fade-step" key="l"><p className="body" style={{ margin: 0, color: T.ink }}>Tinglash = hurmat. Kritika — sovg'a, mahsulotni yaxshilash imkoni.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: bahslashma, oqlama — faqat tingla va yozib ol.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — 5-10 KISHI YETADI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('few');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['few', 'many']) : new Set(['few']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nechta intervyu?" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">5-10 ta samimiy intervyu <span className="italic" style={{ color: T.accent }}>yetarli</span></h2></div>
        <Mentor>Minglab odam bilan gaplashish shart emas. 5-10 ta diqqat bilan o'tkazilgan intervyu naqshni ko'rsatadi. Ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'few' ? 'chip-on' : ''}`} onClick={() => set('few')}>🎯 5-10 chuqur</button>
              <button className={`chip ${v === 'many' ? 'chip-on' : ''}`} onClick={() => set('many')}>📊 1000 yuzaki</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${v === 'few' ? T.success : T.accent}` }}>
              <span style={{ fontSize: 26 }}>{v === 'few' ? '🎯' : '🌊'}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.5 }}>{v === 'few'
                ? '5-10 kishi bilan chuqur suhbat. 3 tasi bir xil muammoni aytsa — bu aniq signal, harakat qiling.'
                : '1000 kishidan "ha/yo\'q" — chuqurlik yo\'q. Nega ekanini bilmaysiz, naqsh ko\'rinmaydi.'}</p>
            </div>
          </Col>
          <Col>
            {v === 'few'
              ? <div className="frame-success fade-step" key="f"><p className="body" style={{ margin: 0, color: T.ink }}>Boshlanishda chuqurlik &gt; miqdor. Bir nechta suhbat yo'nalishni ko'rsatadi.</p></div>
              : <div className="frame-warn fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Katta raqam — yaxshi ko'rinadi, lekin "nega" javobsiz qoladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi 20 dan 5-10 tasi bilan gaplashing — yetarli boshlanish.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Custdev intervyuda asosiy maqsad nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Custdev intervyuda asosiy <span className="italic" style={{ color: T.accent }}>maqsad</span> nima?</h2></>}
    options={['Maqtov eshitish', 'Haqiqatni va real muammolarni bilish', 'Botni reklama qilish', 'Ko\'proq yulduz olish']} correctIdx={1}
    explainCorrect="To'g'ri! Maqsad — xushomad emas, haqiqat. Real muammolarni bilsangiz, mahsulotni to'g'ri yaxshilaysiz."
    explainWrong={{ 0: 'Maqtov xush yoqadi, lekin foydasiz — haqiqat kerak.', 2: 'Custdev — reklama emas, o\'rganish.', 3: 'Yulduz emas — gap real insaytda.', default: 'Maqsad — haqiqatni bilish.' }} />
);

// ===== SCREEN 13 — NAMUNA (hikoya) =====
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
        <div className="head"><h2 className="title h-title fade-up">To'liq hikoya: <span className="italic" style={{ color: T.accent }}>taxmin emas — so'rab topdi</span></h2></div>
        <Mentor>Bir bot quruvchining custdev yo'li — 4 qadam. Har qatorni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="checklist fade-up delay-1">
              <div className="cl-head"><span style={{ color: T.grape, display: 'inline-flex' }}>{Ico.mic(16)}</span><span className="cl-title">Bot quruvchi — custdev hikoyasi</span></div>
              {CASE_AC.map((c, i) => { const open = seen.has(i); return (<button key={i} onClick={() => tap(i)} className={`crit crit-${open ? 'pass' : 'pending'}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: active === i ? c.color + '18' : undefined, boxShadow: active === i ? `inset 0 0 0 1.5px ${c.color}` : undefined }}><span className="crit-box">{open ? Ico.check(13) : ''}</span><span className="crit-text"><span className="mono" style={{ fontSize: 9, fontWeight: 800, color: c.color, marginRight: 6 }}>{c.tag}</span>{c.text}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.tag}</span></span><p style={{ fontFamily: G, fontSize: 14, color: T.ink, margin: '12px 0 0' }}>"{cur.text}"</p><p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Taxmin → intervyu → naqsh → tuzatish. Mana custdev kuchi. Endi o'z rejangizni tuzasiz.</p></div>}
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
      <div className="head"><h2 className="title h-title fade-up">Custdev: <span className="italic" style={{ color: T.accent }}>so'ra · ochiq · tingla</span></h2></div>
      <Mentor>Yodda tuting: taxmin qilma so'ra, ochiq savol ber, tingla va himoyalanma.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🎤</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Suhbat — xushomad emas</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Maqsad: haqiqatni bilish va naqshni topish.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">3 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.search(18), c: T.accent, t: 'SO\'RA — taxmin qilma, foydalanuvchidan o\'rgan' }, { ic: Ico.chat(18), c: T.blue, t: 'OCHIQ SAVOL — o\'tmish xulqi haqida' }, { ic: Ico.ear(18), c: T.success, t: 'TINGLA — bahslashma, yozib ol' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: 5 intervyu rejasi =====
const emptyLines = () => [{ name: '' }, { name: '' }, { name: '' }];
const HINTS = ['Kimni so\'rayman: ... (birinchi 20 dan 3-5 kishi)', '1-savol: masalan "Qaysi qism qiyin bo\'ldi?"', '2-savol: masalan "Nima yetishmadi?"'];
const LBL = ['Kimni so\'rayman', '1-savol', '2-savol'];
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
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>5 mini-intervyu</span> rejangiz</h2></div>
        <Mentor>Birinchi 20 dan kimni so'rasiz va qaysi 2 savolni berasiz? Real custdev rejangizni yozing. Kamida 2 qatorni to'ldiring.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {lines.map((f, i) => { const ok = isComplete(f); return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '11px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="flow-label" style={{ margin: 0 }}>{LBL[i]}</span></div>
                <input value={f.name} onChange={e => upd(i, e.target.value)} placeholder={HINTS[i]} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning intervyu rejangiz</p>
            {completeLines.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Yozing — rejangiz shu yerda yig'iladi…</p></div>
              : <div className="checklist feat-pop"><div className="cl-head"><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.mic(15)}</span><span className="cl-title">Mening custdev rejam</span></div>{completeLines.map((f, j) => (<div key={j} className="crit crit-pass"><span className="crit-box">{Ico.check(13)}</span><span className="crit-text">{f.name}</span></div>))}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Shu reja bilan 5 ta foydalanuvchidan haqiqiy insayt yig'asiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Taxmin qilma — real foydalanuvchidan so\'ra', 'Bezovta qilmasdan: ruxsat, qisqa, rahmat', 'Ochiq savol + o\'tmish xulqi = insayt', 'Tingla, himoyalanma; 5-10 kishi yetadi'];
  const HOMEWORK = [{ b: '5-savol shabloningizni tayyorlang', t: '— ochiq, o\'tmishga yo\'naltirilgan' }, { b: 'Birinchi 20 dan 5 kishi tanlang', t: '— ruxsat so\'rab, qisqa intervyu' }, { b: 'Naqshni qidiring', t: '— bir xil shikoyat takrorlansa, harakat qiling' }];
  const GLOSSARY = [{ b: 'Custdev', t: '— foydalanuvchi bilan o\'rganuvchi suhbat' }, { b: 'Yetaklovchi savol', t: '— javobni "yetaklab" turuvchi (yomon)' }, { b: 'Ochiq savol', t: '— qaysi/qachon/nima (yaxshi)' }, { b: 'Naqsh', t: '— takrorlanuvchi fikr = signal' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM darsi tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>haqiqatni</span> so'rab bilasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Custdev, bezovta qilmaslik, yaxshi savol va 5-savol shablonini bilasiz. Keyingi praktikada — yig\'ilgan fikrni prioritetlaymiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Custdev ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">So'ra, tingla, naqshni top! 🎤</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🔧</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Keyingi: Fidbek va iteratsiya</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Yig'ilgan fikrlarni qanday saralash, prioritetlash va botni yaxshilashni o'rganamiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson20({ lang: langProp, onFinished }) {
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
        @keyframes slide-in-left { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

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

        /* === INTERVYU SIMULYATORI (s6) === */
        .iq-btn { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 12px; padding: 12px 14px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; font-family: 'Georgia, serif'; font-size: 13.5px; color: ${T.ink}; }
        .iq-btn:hover { transform: translateY(-1px); }
        .phone { background: linear-gradient(160deg, #1f2c44 0%, ${CODE.bg} 100%); border-radius: 18px; padding: 10px; box-shadow: 0 16px 38px -12px rgba(${T.shadowBase},0.45); }
        .phone-bar { display: flex; align-items: center; gap: 8px; padding: 6px 10px 10px; border-bottom: 1px solid #ffffff14; }
        .phone-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: #fff; }
        .phone-live { margin-left: auto; font-family: 'Manrope'; font-weight: 600; font-size: 9.5px; color: #7DD181; }
        .phone-body { background: #0e1726; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 130px; }
        .imsg { max-width: 86%; border-radius: 14px; padding: 9px 12px; font-family: 'Georgia, serif'; font-size: 13px; line-height: 1.4; }
        .imsg-you { align-self: flex-end; border-bottom-right-radius: 4px; background: linear-gradient(135deg, ${T.accent} 0%, #ff6a45 100%); color: #fff; box-shadow: 0 4px 12px -4px rgba(255,79,40,0.5); }
        .imsg-them { align-self: flex-start; border-bottom-left-radius: 4px; background: #25344d; color: #E8E5DD; animation: slide-in-left 0.3s 0.15s both; }

        /* === 5-SAVOL SKRIPTI (s8) === */
        .pool-q { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 11px; padding: 10px 13px; background: ${T.paper}; cursor: pointer; transition: all 0.16s; font-family: 'Georgia, serif'; font-size: 13px; color: ${T.ink}; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .pool-q:hover { transform: translateY(-1px); }
        .pool-on { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .pool-bad { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .pool-box { width: 19px; height: 19px; min-width: 19px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; }
        .script-card { background: linear-gradient(165deg, #1f2c44 0%, ${CODE.bg} 100%); border-radius: 14px; padding: 14px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.32); }
        .script-head { display: flex; align-items: center; gap: 8px; color: #9FB4D8; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.08em; padding-bottom: 10px; border-bottom: 1px solid #ffffff14; margin-bottom: 9px; }
        .script-count { margin-left: auto; color: #7DD181; }
        .script-row { display: flex; align-items: flex-start; gap: 9px; padding: 7px 0; font-family: 'Georgia, serif'; font-size: 13px; color: #E8E5DD; line-height: 1.4; }
        .script-num { width: 20px; height: 20px; min-width: 20px; border-radius: 50%; background: ${T.grape}; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; }

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
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
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
