import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM — REAL ODAM BILAN TEST: «GAPIRMA — KUZAT» — v16 (AUDIOSIZ)
// G'oya: o'zingizga ravshan tuyulgan ilovada real odam adashishini kuzatish = oltin.
// Hook: buvi «ravshan» tugmani topolmaydi — founder jim turib kuzatishi kerak.
// Signature 1: «Gapirma — kuzat» simulyatori (Malika sessiyasi, friction nuqtasi, «yordam» vasvasasi).
// Signature 2: Test protokoli quruvchi (✅ kiritamiz / ❌ chiqaramiz — vazifa vs yetaklash).
// Signature 3: 5-user friction taxtasi (5 sinovchi, takrorlangan muammo = kritik pattern).
// Yakuniy ish: USABILITY TEST yozuvi — portfolio 12-sahifa. 🧪 Sinovchi. QUR bosqichi TUGAYDI.
// Davomiylik: 103-chiqarilgan MVP; Mom Test (96); 5 intervyu (97). Aziz #11.
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
  mute: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" /></svg>),
  cursor: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 3l6 18 2.5-7L20 11z" /></svg>),
  users: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></svg>),
  clipboard: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 10h6M9 14h4" /></svg>),
  warn: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.5v.5" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-usability-34-v16', lessonTitle: { uz: 'Real odam bilan test — gapirma, kuzat', ru: 'Юзабилити-тест' } };
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

// ===== KONSEPT LEKSIKONI =====
// s5 — «Gapirma — kuzat» sessiyasi (Malika)
const SESSION = [
  { id: 'm1', txt: 'Malika sahifani ochdi', detail: 'Bemalol — sahifa yuklandi.', friction: false },
  { id: 'm2', txt: 'Yo\'nalish ro\'yxatini ko\'rdi, o\'zinikini tanladi', detail: 'Ravon — ro\'yxat tushunarli.', friction: false },
  { id: 'm3', txt: 'Katta «7 daqiqa» raqamini ko\'rdi — tushundi', detail: '«Voy, ishlayapti-ku!» Core job bajarildi.', friction: false },
  { id: 'm4', txt: 'Eslatma yoqmoqchi — lekin TUGMANI TOPOLMAYDI…', detail: '3 marta boshqa joyni bosdi, 10 soniya ekranга tikildi, «qayerda bu?» deb g\'udrandi.', friction: true, note: 'Eslatma tugmasi ko\'rinmaydi / tushunarsiz joyда' },
  { id: 'm5', txt: 'Nihoyat pastдан, kichik matnдан topdi va yoqdi', detail: 'Topdi — lekin qийinchilik bilan. Bu — friction.', friction: false }
];

// s7 — Test protokoli quruvchi
const PROTOCOL_ITEMS = [
  { id: 'a1', t: '«Keyingi avtobus qachon kelishini toping» — aniq VAZIFA bering', ans: 'in', why: 'Vazifa beradi, yo\'l ko\'rsatmaydi. Real xatti-harakatni kuzatasiz.' },
  { id: 'a2', t: '«Yoqdimi? Chiroylimi?» deb so\'rash', ans: 'out', why: 'Yetaklovchi savol — xushmuomala yolg\'on chaqiradi (Mom Test, 96-dars).' },
  { id: 'a3', t: 'Adashса — jim turib kuzatish', ans: 'in', why: 'Sukut — eng qimmatli ma\'lumot. Qoqilish joyи = tuzatiladigan joy.' },
  { id: 'a4', t: '«Yo\'q, u tugmani bosing» deb yordam berish', ans: 'out', why: 'Aralashsangiz — muammoni YO\'QOTASIZ. U to\'g\'ri yo\'lni topib beradi, siz esa hech narsa bilmaysiz.' },
  { id: 'a5', t: '«Ovoz chiqarib o\'ylang» deб so\'rash (think-aloud)', ans: 'in', why: 'Fikrini eshitasiz — «bu nima ekan?» — lekin yetaklamaysiz. Oltin usul.' },
  { id: 'a6', t: 'Do\'stlarni chaqirib, maqtovини olish', ans: 'out', why: 'Do\'stlar maqtaydi. Begona, maqsad-guruh vakili kerak — Malika, Karim aka.' }
];
const PMAP = { in: { emoji: '✅', label: 'KIRITAMIZ', color: T.success }, out: { emoji: '❌', label: 'CHIQARAMIZ', color: T.accent } };

// s10 — 5-user friction taxtasi
const USERS_5 = [
  { id: 'u1', ic: '👩‍🎓', name: 'Malika', friction: 'Eslatma tugmasini topolmadi', key: 'eslatma' },
  { id: 'u2', ic: '🧔', name: 'Karim aka', friction: 'Eslatma tugmasini topolmadi', key: 'eslatma' },
  { id: 'u3', ic: '👵', name: 'Buvi', friction: 'Matn juda kichik — o\'qiy olmadi', key: 'matn' },
  { id: 'u4', ic: '🧑‍🎓', name: 'Bobur', friction: 'Eslatma tugmasini topolmadi', key: 'eslatma' },
  { id: 'u5', ic: '👩‍⚕️', name: 'Nilufar opa', friction: 'Yo\'nalish nomlari chalkash', key: 'yonalish' }
];

// s11 — friction drilli (chastota bo'yicha prioritet)
const PRIO_DRILL = [
  { id: 'd1', label: '«Eslatma tugmasini topolmadi» — 5 sinovchidan 3 tasi', emoji: '🔴', color: T.accent,
    opts: ['E\'tibor bermayman — 3 ta oz', 'Eng kritik — 3/5 takrorlandi; birinchi shuni tuzataman', 'Faqat 1 kishi aytса tuzataman'], correct: 1,
    why: 'Takror = pattern = kritik. 3/5 — bu shaxsiy emas, dizayn muammosi. Birinchi navbatda shu.' },
  { id: 'd2', label: '«Matn kichik» — 1 sinovchi (buvi)', emoji: '🟡', color: T.honey,
    opts: ['Darrov hamma matnni kattalashtiraman', 'Belgilab qo\'yaman, lekin 3/5 muammodan keyin; balki yosh xususiyati', 'Umuman e\'tibor bermayman'], correct: 1,
    why: '1/5 — belgilab qo\'yiladi, lekin kritik emas. Avval ko\'p takrorlangани tuzatiladi. Prioritet — chastota.' },
  { id: 'd3', label: 'Test tugadi — endi nima?', emoji: '📋', color: T.grape,
    opts: ['Hammasini birdaniga tuzataman', 'Friction\'larni chastota bo\'yicha tartiblab, eng kritik 1-2 tasidan boshlayman (105-dars)', 'Hech narsa qilmayman'], correct: 1,
    why: 'Test topilma beradi — tuzatishни emas. Chastota bo\'yicha prioritet qo\'ying; keyingi darsda iteratsiya qilamiz.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// s15 — Usability test yozuvi (portfolio 12-sahifa)
const TEST_FIELDS = [
  { key: 'task', label: 'Sinovchiga bergan vazifam', emoji: '🎯', color: T.accent, min: 6, hint: 'Keyingi avtobus qachon kelishini toping' },
  { key: 'friction1', label: 'Topilgan friction 1', emoji: '⚠️', color: T.honey, min: 5, hint: 'Eslatma tugmasini topolmadi' },
  { key: 'friction2', label: 'Friction 2', emoji: '⚠️', color: T.honey, min: 5, hint: 'Matn kichik' },
  { key: 'friction3', label: 'Friction 3', emoji: '⚠️', color: T.honey, min: 5, hint: 'Yo\'nalish nomi chalkash' },
  { key: 'critical', label: 'Eng kritik (nechta sinovchidа takrorlandi)', emoji: '🔴', color: T.accent, min: 5, hint: '3/5 — eslatma tugmasi' },
  { key: 'next', label: 'Keyingi qadam (tuzatish — 105-dars)', emoji: '➡️', color: T.success, min: 6, hint: 'Eslatma tugmasini kattaroq, ko\'rinadigan joyга' }
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

// Usability test yozuvi hujjati (s15)
const TestDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.clipboard(16)}</span><span>Usability test · 12-sahifa</span></div>
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
          {i === 2 && <span className="arc-you">6/6</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: BUVI TESTI =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: '«U tugmani bosing» deb darrov yordam bering' },
    { id: 'b', label: 'Jim turib kuzating — u qayerда qoqilyaptи?' },
    { id: 'c', label: '«Noto\'g\'ri qilyapsiz» deб to\'g\'rilang' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Qur bosqichi · FINAL" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>«Bu-ku <span className="italic" style={{ color: T.accent }}>ravshan!</span>» — deb o'ylaysiz. Real odam esa…</h1>
        <Mentor>MVP chiqdi (103-dars)! 🎉 Endi eng qimmatli, lekin eng kamtar qiladigan qadam: real odam uni ishlatganини kuzatish.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>👵 BUVINGIZ ILOVANGIZNI SINAYAPTI</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Buvingizga telefonни berib, «avtobus vaqtини top» dedingiz. U ekranга qaraydi, qaraydi… «ravshan» deб o'ylagan tugmani <b>topolmaydi</b>, boshqa joyni bosaveradi. Sizning yuragingiz siqiladi: «axir shundoq turibdi-ku!»</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Siz nima qilasiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : ''}<b>Jim turib kuzating.</b> Buvining qoqilishi — bu sizning aybingiz emas, buvining aybi ham emas: bu <b>ILOVA muammosi</b> va u — eng qimmatli topilma. Yordam bersangiz, muammo yashirinadi. Bugun o'rganamiz: <b>gapirma — kuzat</b>. Uyaltiradi, lekin oltinга teng.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Test ≠ fikr so\'rash — kuzatish', tag: '' },
    { text: '«Yordam berma» qoidasi', tag: '' },
    { text: '«Gapirma — kuzat» simulyatori', tag: 'o\'yin' },
    { text: 'Test protokoli + 5-user friction taxtasi', tag: 'o\'yin' },
    { text: 'USABILITY TEST yozuvi — portfolio 12-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.eye(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Kuzatib o'rganish</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Real odam MVP'ingizni ishlatadi. Siz jim kuzatib, friction'larni topasiz.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Qur bosqichi FINALI! Keyingisi: Isbot qil 🏆 (fidbek iteratsiyasi)</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Test: <span className="italic" style={{ color: T.accent }}>gapirma, kuzat</span></h2></div>
        <Mentor>Eng katta xato — foydalanuvchidan «yoqdimi?» deб so'rash. Odamlar xushmuomala yolg'on gapiradi (Mom Test, 96!). Haqiqatни bilishning yagona yo'li — <b style={{ color: T.ink }}>vazifa berib, jim kuzatish</b>.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — TEST ≠ SO'RASH =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('ask');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['ask', 'watch']) : new Set(['ask']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isAsk = v === 'ask';
  return (
    <Stage eyebrow="Kuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala usulni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Yoqdimi?» so'rash vs <span className="italic" style={{ color: T.accent }}>ishlatishini kuzatish</span></h2></div>
        <Mentor>Bir xil odam, ikki xil usul — butunlay boshqa natija. Ikkalasini solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isAsk ? 'chip-on' : ''}`} onClick={() => set('ask')}>🗣️ «Yoqdimi?» so'rash</button>
              <button className={`chip ${!isAsk ? 'chip-on' : ''}`} onClick={() => set('watch')}>👀 Kuzatish</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isAsk ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isAsk
                ? '«Ilovam yoqdimi?» — «Ha, zo\'r!» deydi (sizni xafa qilgisi kelmaydi). Siz xursand, lekin HECH NARSA bilmadingiz. Ertasi kuni u ilovani ochmaydi ham. Xushmuomala yolg\'on — Mom Test saboqи.'
                : '«Keyingi avtobus qachon kelishini toping» — vazifa berasiz va JIM turasiz. U qaerда qoqiladi, qaysi tugmани topolmaydi — hammasi ko\'z oldingizda. Bu — haqiqat, maqtov emas.'}</p>
            </div>
          </Col>
          <Col>
            {isAsk
              ? <div className="frame-warn fade-step" key="a"><p className="body" style={{ margin: 0, color: T.ink }}>Fikr so'rash — nol qiymat: odamlar taxmin qiladi, xushmuomalalik qiladi, o'zini bilimliroq ko'rsatadi. So'z arzon.</p></div>
              : <div className="frame-success fade-step" key="w"><p className="body" style={{ margin: 0, color: T.ink }}>Kuzatish — oltin: xatti-harakat yolg'on gapirmaydi. Odam nima QILGANI — nima degani emas — haqiqatни ko'rsatadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: <b>«yoqdimi?» so'ramang — vazifa berib, kuzating.</b> Intervyuдаgidek (96-dars): fikr emas, xatti-harakat. Bu safar so'z emas — sichqoncha gapiradi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — «YORDAM BERMA» QOIDASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  return (
    <Stage eyebrow="Eng qiyin qoida" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Qoidani ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Eng qiyin qoida: <span className="italic" style={{ color: T.accent }}>yordam berma</span></h2></div>
        <Mentor>Odam qoqilganда, sizning butun vujudingiz «yordam beray!» deydi. Aynan shu lahzada tishingizni tishlab, jim turing. Nega?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.accent}` }}>
              <p className="note-h" style={{ color: T.accent }}>🙋 Aralashsangiz…</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>«U tugmani bosing» dedingiz — odam yo'lni topdi, xursand. Lekin siz muammoni <b>YO'QOTDINGIZ</b>: real hayotда siz uning yonida turmaysiz. Yordam = ma'lumotni o'chirish.</p>
            </div>
            <div style={{ textAlign: 'center', color: T.ink3, fontSize: 18 }}>vs</div>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.success}` }}>
              <p className="note-h" style={{ color: T.success }}>🤫 Jim tursangiz…</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Odam 15 soniya qiynaladi — noqulay. Lekin siz ANIQ bilib oldingiz: bu tugma tushunarsiz. Bu — tuzatiladigan real muammo. Noqulaylik = topilma.</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', background: T.grapeSoft, boxShadow: 'none' }}>
              <p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>«Agar foydalanuvchiga qanday ishlatishни tushuntirishga majbur bo'lsangiz — dizayn muvaffaqiyatsiz.»</p>
              <p className="small" style={{ margin: '8px 0 0', color: T.ink2, fontWeight: 600 }}>— Steve Krug, «Don't Make Me Think»</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Tushundim — jim turaman</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta ruxsat etilgan gap: «Ovoz chiqarib o'ylang» (think-aloud). Qolgan hamma vaqt — sukut. Sizning noqulayligingiz — mahsulotingiz uchun sovg'a.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Usability test nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Usability test — bu <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Foydalanuvchidan «yoqdimi?» deб so\'rash', 'Vazifa berib, odam ishlatganini JIM kuzatish va friction\'larni topish', 'Ilovaga baho qo\'yish', 'Do\'stlardan maqtov olish']} correctIdx={1}
    explainCorrect="To'g'ri! Usability test — fikr so'rash emas. Real odamga vazifa berasiz, jim kuzatasiz va qayerda qoqilishini (friction) topasiz. Xatti-harakat yolg'on gapirmaydi."
    explainWrong={{ 0: '«Yoqdimi?» — xushmuomala yolg\'on chaqiradi (Mom Test).', 2: 'Baho — subyektiv fikr; xatti-harakat muhim.', 3: 'Do\'stlar maqtaydi — bu test emas.', default: 'Vazifa ber + jim kuzat + friction top.' }} />
);

// ===== SCREEN 5 — «GAPIRMA — KUZAT» SIMULYATORI (SIGNATURE 1) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(storedAnswer ? SESSION.length : 1);
  const [frictionFound, setFrictionFound] = useState(!!storedAnswer);
  const [helped, setHelped] = useState(false);
  const workRef = useRef(null);
  const revealedAll = idx >= SESSION.length;
  const done = revealedAll && frictionFound;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => setIdx(i => Math.min(i + 1, SESSION.length));
  return (
    <Stage eyebrow="Gapirma — kuzat · simulyator" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (!revealedAll ? 'Sessiyani kuzating' : 'Friction\'ni belgilang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Malika MVP'ingizni sinayapti. <span className="italic" style={{ color: T.accent }}>Kuzating.</span></h2></div>
        <Mentor>Vazifa: «Avtobus vaqtini ko'r va eslatma yoq». Sessiyani lahza-lahza ochib boring. Diqqat: <b style={{ color: T.ink }}>«Yordam ber» tugmasi bosilmasin</b> — u sizni sinaydi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">🎥 Sessiya yozuvи</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SESSION.slice(0, idx).map((m) => (
                <div key={m.id} className={`sess-row fade-step ${m.friction ? 'sess-friction' : ''}`}>
                  <span className="sess-cursor" style={{ color: m.friction ? T.accent : T.success }}>{m.friction ? Ico.warn(16) : Ico.cursor(15)}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: T.ink, margin: 0 }}>{m.txt}</p>
                    <p className="small" style={{ margin: '2px 0 0', color: m.friction ? T.accent : T.ink2, fontStyle: 'italic' }}>{m.detail}</p>
                    {m.friction && !frictionFound && <button className="friction-btn" onClick={() => setFrictionFound(true)}>⚠️ Bu yerда qoqildi — FRICTION deб belgilash</button>}
                    {m.friction && frictionFound && <span className="friction-tag">✓ Friction: {m.note}</span>}
                  </div>
                </div>
              ))}
            </div>
            {!revealedAll && <button className="btn" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={advance}>Keyingi lahza ▶</button>}
          </Col>
          <Col>
            <button className="help-btn" onClick={() => setHelped(true)}>🙋 Malikaга yordam ber</button>
            {helped
              ? <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✗ Aralashdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Malika yo'lni topdi — lekin real hayotда siz yonида turmaysiz. Muammoni YO'QOTDINGIZ. Endi qайта: jim turing, faqat kuzating.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Vasvasага berilmang: «Yordam ber» tugmasi bosilса, friction ko'rinmay qoladi. Faqat kuzating.</p></div>}
            {revealedAll && !frictionFound && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sessiya tugadi. Malika bir joyда aniq qoqildi — chapдан o'sha lahzani toping va «friction» deб belgilang.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Topdingiz! Malika 3 qadamни ravon o'tdi, lekin <b>eslatma tugmасида qotib qoldi</b>. Siz gapirmadingiz — shuning uchun muammoни KO'RDINGIZ. Mana usability testning kuchi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Test paytida foydalanuvchi qoqilса nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Odam qoqilса — <span className="italic" style={{ color: T.accent }}>siz nima qilasiz</span>?</h2></>}
    options={['Darrov yordam beraman — yo\'lni ko\'rsataman', 'Jim turaman va kuzataman — bu qoqilish ASOSIY topilma', 'Testни to\'xtataman', 'Undan uzr so\'rayman']} correctIdx={1}
    explainCorrect="To'g'ri! Qoqilish — bu muvaffaqiyatsizlik emas, ENG QIMMATLI topilma. Jim turing: real hayotда siz yonида bo'lmaysiz. Yordam bersangiz — muammoni yashirasiz. Sukut = ma'lumot."
    explainWrong={{ 0: 'Yordam — muammoni yo\'qotadi. Real user yolg\'iz qoladi.', 2: 'To\'xtatmang — aynan shu lahza oltin.', 3: 'Uzr shart emas — muammo ilovada, odamда emas.', default: 'Jim turing — qoqilish topilma.' }} />
);

// ===== SCREEN 6 — VAZIFAGA ASOSLANGAN TEST =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('task');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['task', 'tour']) : new Set(['task']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isTask = v === 'task';
  return (
    <Stage eyebrow="Vazifaga asoslangan" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ekskursiya emas — <span className="italic" style={{ color: T.accent }}>real vazifa</span> bering</h2></div>
        <Mentor>Foydalanuvchiga «mana bu tugma, mana buni bosing» deб ekskursiya qilib bermang. Real vazifa bering va yo'lni O'ZI topsin.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isTask ? 'chip-on' : ''}`} onClick={() => set('task')}>🎯 Vazifa</button>
              <button className={`chip ${!isTask ? 'chip-on' : ''}`} onClick={() => set('tour')}>🚌 Ekskursiya</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isTask ? T.success : T.accent}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>{isTask
                ? '«Tasavvur qiling, ertaga maktabга borasiz. Keyingi avtobus qachon kelishini shu ilovадан toping.»'
                : '«Bu — bosh sahifa. Bu tugma yo\'nalish tanlaydi. Buni bossangiz vaqt chiqadi. Bu yerда eslatma bor…»'}</p>
            </div>
          </Col>
          <Col>
            {isTask
              ? <div className="frame-success fade-step" key="t"><p className="body" style={{ margin: 0, color: T.ink }}>Vazifa: real maqsad beradi, yo'lni ko'rsatmaydi. Odam qanday o'ylayди, qayerда adashadi — hammasi ko'rinadi. Sof kuzatuv.</p></div>
              : <div className="frame-warn fade-step" key="e"><p className="body" style={{ margin: 0, color: T.ink }}>Ekskursiya: siz hamma yo'lni ko'rsatдingiz — endi u adashmaydi (chunki siz aytдingiz). Test buzildi: siz o'zингизни sinаdingiz, ilovани emas.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi vazifa: real hayotdan, aniq natijали («X ni top»), yo'lni aytmaydigan. Keyin — jim. Vazifa + sukut = sof ma'lumot.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST PROTOKOLI QURUVCHI (SIGNATURE 2) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(PROTOCOL_ITEMS.map(p => [p.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = PROTOCOL_ITEMS.filter(p => state[p.id]?.ok).length;
  const done = okCount >= PROTOCOL_ITEMS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (p, ans) => {
    if (state[p.id]?.ok) return;
    const ok = ans === p.ans;
    setState(prev => ({ ...prev, [p.id]: { ok, wrong: !ok } }));
    setLast({ id: p.id, ok, why: p.why, ans: p.ans });
  };
  return (
    <Stage eyebrow="Test protokoli · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Protokolni tuzing (${okCount}/${PROTOCOL_ITEMS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Test protokoli: <span className="italic" style={{ color: T.accent }}>✅ kiritamiz · ❌ chiqaramiz</span></h2></div>
        <Mentor>Yaxshi test protokoli — oldindan tayyorlangan reja. Har qatorга savol: <b style={{ color: T.ink }}>«Bu sof kuzatuvга yordam beradimi, yoki natijани buzadimi?»</b></Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROTOCOL_ITEMS.map(p => {
                const st = state[p.id] || {};
                return (
                  <div key={p.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{p.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: PMAP[p.ans].color }}>{PMAP[p.ans].emoji} {PMAP[p.ans].label}</span>
                      : <span className="sort-btns">{['in', 'out'].map(a => (<button key={a} className="sort-btn" title={PMAP[a].label} onClick={() => pick(p, a)}>{PMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🎙️ Protokol tayyor</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{PROTOCOL_ITEMS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / PROTOCOL_ITEMS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? `✓ ${PMAP[last.ans].emoji} ${PMAP[last.ans].label}` : '✗ Qayta o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Savol: bu sof kuzatuvга yordam beradimi (✅), yoki yetaklaydi/aralashadi (❌)?'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Qator yonidagi ✅ yoki ❌ ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Protokol tayyor: <b>real vazifa + think-aloud + sukut</b>. Chiqarildi: «yoqdimi?», yordam berish, do'stlar maqtovi. Endi 5 sinovчиni chaqiramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — NIELSEN: 5 KISHI = 85% =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? true : false);
  useEffect(() => { if (seen && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [seen]);
  const BARS = [{ n: 1, p: 31 }, { n: 2, p: 52 }, { n: 3, p: 66 }, { n: 5, p: 85 }, { n: 15, p: 98 }];
  return (
    <Stage eyebrow="5 kishi qoidasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!seen} label={seen ? 'Davom etish' : 'Grafikni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">100 tester shart emas — <span className="italic" style={{ color: T.accent }}>atigi 5</span></h2></div>
        <Mentor>Jakob Nielsen (usability guruusi) hisoblab chiqdi: 5 kishi muammolarning <b style={{ color: T.ink }}>85%</b>ini topadi. 5 intervyu (97-dars) kabi — oz son, katta natija.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: 'clamp(14px,2.5vw,20px)' }}>
              <p className="flow-label" style={{ marginBottom: 12 }}>Topilgan muammolar (% )</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {BARS.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, minWidth: 54, color: b.n === 5 ? T.accent : T.ink2 }}>{b.n} kishi</span>
                    <div className="nbar-track"><div className="nbar-fill" style={{ width: seen ? `${b.p}%` : 0, background: b.n === 5 ? T.accent : (b.n === 15 ? T.success : T.ink3), transitionDelay: `${i * 0.12}s` }} /></div>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, minWidth: 34, color: b.n === 5 ? T.accent : T.ink2 }}>{b.p}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: 'clamp(14px,2.2vw,18px)', borderLeft: `4px solid ${T.accent}` }}>
              <p className="note-h" style={{ color: T.accent }}>Nega 5?</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>1 kishi — 31% (oz). 5 kishi — 85% (deyarli hammasi). 5 dan keyin har yangi tester bir xil muammolarni takrorlaydi — foyda keskin kamayadi. 100 tester — pul va vaqt isrofi.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setSeen(true)}>Grafikni ko'rdim</button>
            {seen && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Founder uchun bu — ozodlik: 5 kishi (oila, sinfdosh, qo'shni) yetadi. Bugundan sinash mumkin. Ko'p emas — TEZ va TAKROR sinang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="MVP'ni sinash uchun nechta tester kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nechta tester <span className="italic" style={{ color: T.accent }}>yetarli</span>?</h2></>}
    options={['Kamida 100 kishi — ko\'proq yaxshiroq', 'Atigi 5 kishi — muammolarning ~85%ini topadi (Nielsen)', 'Faqat 1 kishi', 'Minglab foydalanuvchi']} correctIdx={1}
    explainCorrect="To'g'ri! Nielsen qoidasi: 5 kishi muammolarning ~85%ini topadi. 5 dan keyin har yangi tester bir xil muammolarni takrorlaydi — foyda kamayadi. Founder uchun 5 kishi (oila, do'st) darrov topiladi."
    explainWrong={{ 0: '100 — isrof: 5 dan keyin bir xil muammolar takrorlanadi.', 2: '1 kishi atigi 31% — kam. 5 kerak.', 3: 'Minglab — keraksiz. 5 yetadi, tez va takror.', default: '5 kishi = ~85% muammo.' }} />
);

// ===== SCREEN 10 — 5-USER FRICTION TAXTASI (SIGNATURE 3) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(USERS_5.map(u => u.id)) : new Set());
  const [active, setActive] = useState(null);
  const done = seen.size >= USERS_5.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const seenUsers = USERS_5.filter(u => seen.has(u.id));
  const eslatmaCount = seenUsers.filter(u => u.key === 'eslatma').length;
  const cur = active ? USERS_5.find(u => u.id === active) : null;
  return (
    <Stage eyebrow="Friction taxtasi · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 sinovchini kuzating (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">5 sinovchi — <span className="italic" style={{ color: T.accent }}>takrorlangani kritik</span></h2></div>
        <Mentor>Har sinovchini kuzating va friction'ini taxtага yozing. O'ng tomondagi hisoblagichni kuzating: <b style={{ color: T.ink }}>qaysi muammo TAKRORLANyapti?</b></Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {USERS_5.map(u => { const on = seen.has(u.id); return (
                <button key={u.id} className={`plink ${active === u.id ? 'plink-on' : ''}`} onClick={() => tap(u.id)}>
                  <span style={{ fontSize: 18, minWidth: 24 }}>{u.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{u.name}</span>{on && <><br /><span className="small" style={{ color: T.ink2 }}>⚠️ {u.friction}</span></>}</span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">kuzatish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: '13px 16px' }}>
              <p className="flow-label" style={{ marginBottom: 8 }}>📊 Friction hisoblagichi</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="small" style={{ minWidth: 96, fontWeight: 700 }}>🔔 Eslatma tugmasi</span><div className="fmeter-track" style={{ flex: 1 }}><div className="fmeter-fill" style={{ width: `${(eslatmaCount / 5) * 100}%` }} /></div><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: eslatmaCount >= 3 ? T.accent : T.ink2 }}>{eslatmaCount}/5</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="small" style={{ minWidth: 96, fontWeight: 700 }}>🔤 Matn kichik</span><div className="fmeter-track" style={{ flex: 1 }}><div className="fmeter-fill" style={{ width: `${(seenUsers.filter(u => u.key === 'matn').length / 5) * 100}%`, background: T.honey }} /></div><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink2 }}>{seenUsers.filter(u => u.key === 'matn').length}/5</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="small" style={{ minWidth: 96, fontWeight: 700 }}>🛣️ Yo'nalish nomi</span><div className="fmeter-track" style={{ flex: 1 }}><div className="fmeter-fill" style={{ width: `${(seenUsers.filter(u => u.key === 'yonalish').length / 5) * 100}%`, background: T.grape }} /></div><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink2 }}>{seenUsers.filter(u => u.key === 'yonalish').length}/5</span></div>
              </div>
            </div>
            {cur && <div className="sk-info fade-step" key={active}><span className="sk-wordbadge">{cur.ic} {cur.name}</span><p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.5 }}>⚠️ {cur.friction}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Pattern aniq: <b>eslatma tugmasi — 3/5</b>! Bu shaxsiy emas, DIZAYN muammosi. «Matn kichik» (1/5) va «yo'nalish nomi» (1/5) — belgilanadi, lekin kritik emas. Chastota — prioritet.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TOPISH ≠ TUZATISH DRILLI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(PRIO_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = PRIO_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= PRIO_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Mashq · prioritet" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `To'g'ri qarorni toping (${okCount}/${PRIO_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Friction topildi — <span className="italic" style={{ color: T.accent }}>endi nima?</span></h2></div>
        <Mentor>Test topilma beradi — yechim emas. Muhimi: qaysi friction'ni birinchi tuzatish? Belgi — <b style={{ color: T.ink }}>chastota</b> (nechta sinovchida takrorlandi).</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PRIO_DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Chastotага qarang — nechta sinovchida takrorlandi?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Naqsh: <b>test topadi, tuzatish keyin</b> (105-dars). Chastota bo'yicha tartiblang: ko'p takrorlangani — birinchi. Hammasini birdan tuzatish — chalkashlik.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Qaysi friction'ni birinchi tuzatasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Friction'larни <span className="italic" style={{ color: T.accent }}>qanday tartiblab</span> tuzatasiz?</h2></>}
    options={['Menga eng qiziq tuyulganini', 'Eng ko\'p sinovchида takrorlangani (chastota) — birinchi', 'Eng oson tuzatiladiganини', 'Hammasini birdaniga']} correctIdx={1}
    explainCorrect="To'g'ri! Chastota — prioritet: 3/5 takrorlangan friction — dizayn muammosi, birinchi navbatda. 1/5 — belgilanadi, lekin keyin. Test topilma beradi; chastota bo'yicha tartiblang."
    explainWrong={{ 0: 'Qiziqish — subyektiv. Chastota — dalil.', 2: 'Osonlik emas — TA\'SIR (chastota) muhim.', 3: 'Birdaniga — chalkashlik. Bittadan, eng kritikdan.', default: 'Chastota bo\'yicha: ko\'p takrorlangani birinchi.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #11 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Zo\'r! Hamma "ha, yoqdi" dedi — demak mahsulot mukammal, hech narsa o\'zgartirma»' },
    { id: 1, t: '«"Yoqdimi?" — foydasiz savol. Aniq VAZIFA ber ("avtobus vaqtини top") va JIM kuzat — qayerда qoqilishini ko\'r»' },
    { id: 2, t: '«Do\'stlar oz — 100 kishidan so\'ra»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«5 do'stimga ko'rsatdim — hammaga yoqdi!»</span></h2></div>
        <Mentor>Aziz MVP'ini sinadi (qoyil!). Lekin usulини ko'ring…</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«5 do'stimga ilovani ko'rsatib, "yoqdimi?" deб so'radim. Hammasi "ha, zo'r, chiroyli!" dedi. Demak mahsulotim tayyor — hech qanday muammo yo'q ekan!»</p>
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
            ? 'Aziz ikki xato qildi: (1) «yoqdimi?» so\'radi — do\'stlar xushmuomala yolg\'on aytdi (Mom Test, 96); (2) do\'stlarni tanladi — ular xafa qilmaydi. Yechim: begonaroq odamga ANIQ vazifa berib, JIM kuzatish. Ko\'rsatishда «yoqdi» — hech narsa; ishlatishда qoqilish — oltin. Aziz 0 friction topdi, chunki noto\'g\'ri savol berdi.'
            : (picked === 0 ? '«Ha, yoqdi» — maqtov, ma\'lumot emas. Kuzatmagunча muammoni ko\'rmaysiz.' : 'Muammo son emas — USUL. 100 kishidan «yoqdimi?» so\'rasa ham 0 topilma. 5 kishini KUZATish kerak.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Test yozuviga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Test qoidasi: <span className="italic" style={{ color: T.accent }}>vazifa ber, jim kuzat</span></h2></div>
      <Mentor>Amaliyotdan oldin kompas. 4 qoida — keyin test yozuvингизни to'ldirasiz.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🤫</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Sukut — ma'lumot</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Noqulaylikка chidang: har qoqilish — tuzatiladigan real topilma.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.eye(18), c: T.accent, t: 'KUZAT — «yoqdimi?» emas, xatti-harakat' }, { ic: Ico.mute(18), c: T.grape, t: 'JIM TUR — yordam bersang, muammoni yo\'qotasan' }, { ic: Ico.clipboard(18), c: T.blue, t: 'VAZIFA BER — real maqsad, ekskursiya emas' }, { ic: Ico.users(18), c: T.honey, t: '5 KISHI = 85% — chastota bo\'yicha prioritet' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: USABILITY TEST YOZUVI =====
const emptyTest = () => Object.fromEntries(TEST_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyTest());
  const productName = useRef(readProductName()).current;
  const isComplete = (k) => data[k].trim().length >= (TEST_FIELDS.find(f => f.key === k)?.min ?? 4);
  const completeCount = TEST_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= TEST_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson104_usability', { title: 'Usability test', fields: TEST_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = TEST_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' (')[0], color: f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · test yozuvi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${TEST_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">USABILITY TEST: <span className="italic" style={{ color: T.accent }}>portfolio 12-sahifa</span></h2></div>
        <Mentor>O'Z MVP'ingizni real odam bilan sinang{productName ? <> (mahsulotingiz: <b style={{ color: T.ink }}>{productName}</b>)</> : ''} va topilmalarni yozing. Misollar avtobus-loyihadan. Bu — 105-darsda tuzatiladigan ro'yxat.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {TEST_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Test yozuvingiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — yozuv shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><TestDoc rows={docRows} />{passed && <span className="seal">SINOVDAN O'TDI ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Real fidbek qo'lда! Endi mahsulotingiz taxminга emas — DALILга asoslangan. Keyingi darsda (Isbot qil bosqichi!) bu friction'larni iteratsiya bilan tuzatamiz. 🔁</p></div>}
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
  { t: 'Quruvchi', l: 'olingan' },
  { t: 'Sinovchi', l: 'HOZIRGINA!' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Test = kuzatish, «yoqdimi?» so\'rash emas (Mom Test)', '«Yordam berma»: sukut — eng qimmatli ma\'lumot', 'Vazifa ber (real maqsad), ekskursiya qilma', '5 kishi = 85% muammo; chastota bo\'yicha prioritet'];
  const GLOSSARY = [{ b: 'Usability test', t: '— odam ishlatganини kuzatib muammo topish' }, { b: 'Friction', t: '— foydalanuvchi qoqilgan joy' }, { b: 'Think-aloud', t: '— «ovoz chiqarib o\'ylang» usuli' }, { b: '«Yordam berma»', t: '— jim tur, aralashma' }, { b: 'Nielsen qoidasi', t: '— 5 kishi = ~85% muammo' }, { b: 'Chastota', t: '— nechta sinovчида takrorlandi (prioritet)' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="QUR BOSQICHI TUGADI · 6/6 · 🧪 Sinovchi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        {PASSED && <div className="medal-hero fade-up"><div className="medal medal-big">🧪</div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 700, margin: '8px 0 0', color: T.honey, fontSize: 'clamp(18px,2.6vw,24px)' }}>🏅 Sinovchi nishoni olindi</p><p className="mono small" style={{ margin: '4px 0 0', color: T.success, fontWeight: 700, letterSpacing: '0.06em' }}>🔧 QUR BOSQICHI TUGADI — 6/6</p></div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.eye(12)}</span> Real fidbek olindi · Qur yakunlandi</span><h2 className="title h-title fade-up d1">Endi mahsulot <span className="italic" style={{ color: T.accent }}>dalilga asoslanadi.</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Real odam bilan sinadingiz: kuzatib, jim turib, friction\'larni topdingiz. MVP endi taxminга emas, DALILga asoslanadi. QUR bosqichi to\'liq tugadi — arxitektura, analitika, kod, dizayn, SHIP va test. Endi oxirgi bosqich: ISBOT QIL.' : 'Yaxshi harakat! Isbot bosqichига o\'tishдан oldin test qoidalarini mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 3 ? 'badge-done' : ''} ${i === 4 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔨' : (i === 3 ? '🧪' : '👑')))} {b.t}<span className="badge-when" style={i <= 3 ? { color: 'rgba(255,255,255,0.85)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Oxirgi nishon — <b style={{ color: T.honey }}>👑 Founder</b>: Demo Day'да butun yo'lni namoyish qilganда (108-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🧪</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — HAQIQATAN sinang</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>MVP'ingizni 3-5 real odamga bering (oila, sinfdosh, qo'shni). Aniq vazifa bering va JIM turib kuzating — hech yordam bermang! Har qoqilishni yozing, keyin chastota bo'yicha tartiblang. Eng ko'p takrorlangan — keyingi darsda birinchi tuzatiladi. Isbot qil bosqichi boshlanadi: fidbek iteratsiyasi 🔁.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson34({ lang: langProp, onFinished }) {
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

        /* === SESSIYA (gapirma-kuzat) === */
        .sess-row { display: flex; gap: 10px; align-items: flex-start; background: ${T.paper}; border-radius: 11px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .sess-friction { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .sess-cursor { display: inline-flex; flex-shrink: 0; margin-top: 1px; }
        .sess-friction .sess-cursor { animation: fric-pulse 1.1s ease-in-out infinite; }
        @keyframes fric-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.28); } }
        .friction-btn { margin-top: 8px; border: none; background: ${T.accent}; color: #fff; font-family: 'Manrope'; font-weight: 700; font-size: 12px; padding: 8px 13px; border-radius: 9px; cursor: pointer; box-shadow: 0 6px 16px -6px rgba(255,79,40,0.5); transition: all 0.18s; }
        .friction-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 22px -6px rgba(255,79,40,0.6); }
        .friction-tag { display: inline-block; margin-top: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 11px; border-radius: 7px; animation: feat-pop 0.34s; }
        .help-btn { width: 100%; border: 1.5px dashed ${T.accent}; background: ${T.accentSoft}; color: ${T.accent}; font-family: 'Manrope'; font-weight: 700; font-size: clamp(13px,1.7vw,15px); padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.18s; }
        .help-btn:hover { background: #FFDDD3; }

        /* === NIELSEN BARS === */
        .nbar-track { flex: 1; height: 13px; background: ${T.ink3}2E; border-radius: 99px; overflow: hidden; }
        .nbar-fill { height: 100%; border-radius: 99px; width: 0; transition: width 0.8s cubic-bezier(.3,.8,.3,1); }

        /* === MEDAL === */
        .medal { font-size: 40px; animation: medal-drop 0.7s cubic-bezier(.3,.9,.4,1.5) both; filter: drop-shadow(0 6px 10px rgba(224,137,43,0.5)); }
        .medal-big { font-size: clamp(52px,11vw,74px); }
        @keyframes medal-drop { 0% { opacity: 0; transform: translateY(-40px) scale(0.4) rotate(-25deg); } 60% { opacity: 1; transform: translateY(6px) scale(1.12) rotate(8deg); } 100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); } }
        .medal-hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 6px 0 2px; }

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
