import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM6 — INTERVYU TAHLILI + MVP CHEGARASI — v16 (AUDIOSIZ)
// G'oya: 5 intervyu varag'ini oltinga aylantirish: fakt → pattern → insayt → BITTA muammo → MVP chegarasi.
// Hook: Burbn → Instagram (kesish san'ati). Tekshir bosqichining FINALI — keyin qurish boshlanadi.
// Signature 1: Pattern ovlash (5 respondent kartasi, takrorlar sanog'i).
// Signature 2: MVP chegara o'yini (9 ficha: ✅ qilamiz / ⏳ keyin / ❌ qilmaymiz).
// Signature 3: Unit-ekonomika kalkulyatori (og'riq bozori count-up).
// Yakuniy ish: MVP QARORI — portfolio 6-sahifa (muammo + insayt + qilamiz/qilmaymiz/keyin).
// Davomiylik: respondentlar 97-ekspeditsiyadan (Malika, Bobur, Nilufar, Karim, buvi); Aziz case #6.
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
  scissors: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="6" cy="6" r="2.6" /><circle cx="6" cy="18" r="2.6" /><path d="M8.2 7.6L20 19M8.2 16.4L20 5" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>),
  coins: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="9" r="6" /><path d="M15.5 5.5a6 6 0 1 1-7 9.8" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-analysis-31-v16', lessonTitle: { uz: 'Tahlil + MVP chegarasi — kesish san\'ati', ru: 'Анализ интервью + границы MVP' } };
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

// ===== KONSEPT LEKSIKONI =====
// 5 respondent varag'i (s2) — 97-ekspeditsiyadan qaytdik
const RESP = [
  { id: 'r1', ic: '👩‍🎓', name: 'Malika (o\'quvchi)', quote: '«Qachon kelishi noma\'lum — kecha 25 daqiqa kutdim. Muhim kunlari onam taksi chaqiradi»', tags: ['🌫 noaniqlik', '💸 pul sarfi'] },
  { id: 'r2', ic: '🧑‍🎓', name: 'Bobur (o\'quvchi)', quote: '«Qachon kelishini bilmaganim uchun har kuni 20 daqiqa erta chiqaman — uyqumdan yeb qo\'yadi»', tags: ['🌫 noaniqlik', '⏳ vaqt qurboni'] },
  { id: 'r3', ic: '👩‍⚕️', name: 'Nilufar opa (hamshira)', quote: '«Smenaga kech qolib bo\'lmaydi — qachon kelishi noma\'lum, shuning uchun har kuni taksi. Oyiga 300 ming ketadi»', tags: ['🌫 noaniqlik', '💸 pul sarfi'] },
  { id: 'r4', ic: '🧔', name: 'Karim aka (ota)', quote: '«O\'zim mashinadaman. Lekin o\'g\'lim maktabga avtobusda — qayerdaligini bilmay xavotir olamiz»', tags: ['🌫 noaniqlik', '🆕 yangi burchak: ota-ona xavotiri'] },
  { id: 'r5', ic: '👵', name: 'Buvi', quote: '«Men kam chiqaman, shoshadigan joyim yo\'q — menga baribir»', tags: ['🚫 segment emas'] }
];

// Piramida (s3)
const PYRAMID = [
  { id: 'p1', label: 'FAKT', emoji: '🧱', color: T.blue, soft: T.blueSoft, d: 'Bitta intervyudan bitta dalil: «Malika kecha 25 daqiqa kutdi». O\'zi holda — shunchaki voqea. Faktlar — piramidaning g\'ishtlari.' },
  { id: 'p2', label: 'PATTERN', emoji: '🧩', color: T.grape, soft: T.grapeSoft, d: 'Takrorlanish: 5 respondentdan 4 tasi «QACHON KELISHINI BILMAYMAN» dedi — har biri o\'z so\'zi bilan. Bitta gap — tasodif, to\'rttasi — naqsh.' },
  { id: 'p3', label: 'INSAYT', emoji: '💡', color: T.accent, soft: T.accentSoft, d: 'Pattern ortidagi «NEGA»: odamlarni avtobusning SEKINLIGI emas — NOANIQLIK og\'ritadi! 20 daqiqa kutish rejali bo\'lsa — chidasa bo\'ladi; noma\'lum kutish — azob. Demak yechim: tezroq avtobus EMAS — «qachon kelishini bilish». Mana MVP yo\'nalishi!' }
];

// Muammo-nomzodlar reytingi (s5)
const CANDS = [
  { id: 'c1', ic: '🚌', name: 'Avtobus noaniqligi', stats: 'Tasdiq: 4/5 · Pul isboti: BOR (taksi 300 ming/oy) · Yangi burchak: ota-ona xavotiri', verdict: 'g\'olib', d: 'To\'rt xil odam — bir xil og\'riq, o\'z so\'zlari bilan. Ikkitasi allaqachon PUL sarflayapti (taksi). Bonus: kutilmagan segment ham chiqdi (ota-onalar). Bu — tekshirilgan oltin kon.' },
  { id: 'c2', ic: '📚', name: 'Uy vazifasi tarqoqligi', stats: 'Tasdiq: 3/5 · Pul isboti: yo\'q · Workaround: bor (guruh titkilash)', verdict: 'kuchli zaxira', d: 'Yaxshi muammo — lekin pul isboti yo\'q va og\'riq «asab» darajasida, «pul» darajasida emas. Zaxiraga: agar avtobus MVP ishlamasa, bu — 2-nomzod.' },
  { id: 'c3', ic: '🍜', name: 'Yemakxona navbati', stats: 'Tasdiq: 2/5 · Workaround: yo\'q · Yechim: dasturiy emas?', verdict: 'chetga', d: 'Ikki kishi aytdi, lekin hech kim hech narsa qilib ko\'rmagan (workaround yo\'q = og\'riq kuchsiz signali). Ustiga yechim ilova emas — tashkiliy bo\'lishi mumkin. Chetga.' }
];

// MVP chegara o'yini (s7) — SIGNATURE 2. Mahsulot: maktab yo'nalishi uchun avtobus-tracker
const FEATURES = [
  { id: 'f1', t: 'Avtobus qachon kelishini jonli ko\'rsatish', ans: 'do', why: 'Bu — CORE JOB o\'zi: «qachon kelishini bilish». MVPsiz MVP bo\'lmaydi.' },
  { id: 'f2', t: 'Faqat BITTA yo\'nalish: o\'z maktab yo\'lingiz', ans: 'do', why: 'Toraytirish — MVP kuchi: 1 yo\'nalishda mukammal ishlasin, keyin kengayamiz.' },
  { id: 'f3', t: 'Telefonda ochiladigan oddiy web-sahifa', ans: 'do', why: 'App Store shart emas: havola yubordingiz — ishladi. Eng tez yetkazish yo\'li.' },
  { id: 'f4', t: 'Ro\'yxatdan o\'tish va profil', ans: 'later', why: 'Kutilmagan javob-a? Core jobga profil KERAK EMAS — ochdi, ko\'rdi, ketdi. Keyin (agar kerak bo\'lsa).' },
  { id: 'f5', t: '«Avtobus 5 daqiqada keladi» eslatmasi', ans: 'later', why: 'Foydali! Lekin core ishlagandan KEYIN. MVP: o\'zi qarab bilsin — bu ham katta yutuq.' },
  { id: 'f6', t: 'Qorong\'i rejim (dark mode)', ans: 'later', why: 'Chiroyli, lekin birorta respondent so\'ramagan. Fichalar intervyudan chiqadi — didimizdan emas.' },
  { id: 'f7', t: 'Butun shahar barcha transporti xaritasi', ans: 'no', why: 'MVP qotili: 100 barobar ish, o\'sha bitta jobga qo\'shimcha foyda deyarli nol.' },
  { id: 'f8', t: 'Yo\'lovchilar chati', ans: 'no', why: 'Boshqa job («muloqot») — bizning muammoga aloqasi yo\'q. Burbn xatosi shu edi.' },
  { id: 'f9', t: 'Taksi chaqirish integratsiyasi', ans: 'no', why: 'Bu boshqa mahsulot. Bizning job: kutishni bashoratli qilish — taksi sotish emas.' }
];
const FMAP = { do: { emoji: '✅', label: 'QILAMIZ', color: T.success }, later: { emoji: '⏳', label: 'KEYIN', color: T.honey }, no: { emoji: '❌', label: 'QILMAYMIZ', color: T.accent } };

// Unit-ekonomika (s10) — SIGNATURE 3
const USERS_OPTS = [10, 100, 1000];
const PAIN_PER_USER = 150000; // taksi ~40 ming/hafta → oyiga ~150-180 ming so'm

// Fakt→Insayt drilli (s11)
const INSIGHT_DRILL = [
  { id: 'i1', label: 'Pattern: 4/5 respondent «qachon kelishini bilmayman» dedi', emoji: '🌫️', color: T.blue, opts: ['Insayt: avtobuslar juda sekin yuradi', 'Insayt: og\'riq tezlikda emas — NOANIQLIKDA; yechim = bilish, tezlatish emas', 'Insayt: hamma taksiga o\'tishi kerak'], correct: 1, why: 'Insayt yechim YO\'NALISHINI o\'zgartiradi: yangi avtobus sotib olish shart emas — axborot yetarli.' },
  { id: 'i2', label: 'Pattern: 3/5 uy vazifasini 3-4 joydan qidiradi', emoji: '📚', color: T.grape, opts: ['Insayt: o\'quvchilar dangasa', 'Insayt: guruhlar ko\'paytirilishi kerak', 'Insayt: axborot BOR — lekin TARQOQ; yechim = yig\'ish, yangisini yaratish emas'], correct: 2, why: 'Muammo yo\'qlikda emas — tarqoqlikda. Bu MVP\'ni 10 barobar soddalashtiradi: agregator, platforma emas.' },
  { id: 'i3', label: 'Buvi: «menga baribir, shoshmayman»', emoji: '👵', color: T.honey, opts: ['Insayt: muammo umuman mavjud emas ekan', 'Insayt: bu SEGMENT emas — auditoriya «vaqtga shoshiladiganlar»; buvi uchun qurmaymiz', 'Insayt: buvini ko\'ndirish kerak'], correct: 1, why: '«Yo\'q» ham oltin: auditoriya chegarasini chizib berdi. Hamma uchun mahsulot — hech kim uchun mahsulot.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// MVP qarori (s15)
const DECISION_FIELDS = [
  { key: 'problem', label: 'Tanlangan muammo (KIM + QACHON + OG\'RIQ)', emoji: '🎯', color: T.accent, hint: 'Masalan: o\'quvchi va ishchilar har kuni ertalab avtobus qachon kelishini bilmay...' },
  { key: 'insight', label: 'Asosiy insayt', emoji: '💡', color: T.grape, hint: 'Masalan: og\'riq tezlikda emas — noaniqlikda' },
  { key: 'do1', label: 'QILAMIZ — 1-ficha (core job)', emoji: '✅', color: T.success, hint: 'Eng asosiy bitta narsa' },
  { key: 'do2', label: 'QILAMIZ — 2-ficha', emoji: '✅', color: T.success, hint: 'Core\'ni qo\'llab-quvvatlovchi' },
  { key: 'do3', label: 'QILAMIZ — 3-ficha', emoji: '✅', color: T.success, hint: 'MVP shu 3 tada to\'xtaydi' },
  { key: 'later', label: 'KEYIN (v2 uchun)', emoji: '⏳', color: T.honey, hint: 'Foydali, lekin birinchi kunda shart emas' },
  { key: 'no', label: 'QILMAYMIZ (chegara)', emoji: '❌', color: T.ink2, hint: 'Bizning jobga kirmaydi' }
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

// MVP qarori hujjati (s15)
const DecisionDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.scissors(16)}</span><span>MVP qarori · 6-sahifa</span></div>
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
        <div className={`arc-chip ${i === 1 ? 'arc-here' : ''}`}>
          <span style={{ fontSize: 14 }}>{s.ic}</span>
          <span className="arc-t">{s.t}</span>
          {i === 0 && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(11)}</span>}
          {i === 1 && <span className="arc-you">3/3</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: BURBN → INSTAGRAM =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Yana 10 ta yangi ficha qo\'shishdi' },
    { id: 'b', label: 'Hammasini KESIB, faqat rasm + filtr + like qoldirishdi' },
    { id: 'c', label: 'Ilovani yopib, boshqa soha tanlashdi' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Akselerator" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Burbn degan ilovani <span className="italic" style={{ color: T.accent }}>eslaysizmi? Yo'q.</span></h1>
        <Mentor>Ekspeditsiyadan qaytdingiz — qo'lingizda 5 varaq. Ularni nima qilishni bugungi hikoya o'rgatadi.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>📱 2010 · SAN-FRANSISKO</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Kevin Systrom «Burbn» ilovasini qurdi: check-in, rejalar, do'stlar, ball, rasm — HAMMASI bor edi. Foydalanuvchilar esa… deyarli ishlatmasdi.</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Keyin ular foydalanuvchilar xatti-harakatini TAHLIL qilishdi va bitta naqsh ko'rishdi: odamlar faqat <b>rasm joylash va filtr</b>ni ishlatyapti. Boshqa hech narsani.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Ular nima qilishdi deb o'ylaysiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : 'Ular '}<b>hamma narsani kesib tashlashdi</b> — faqat rasm, filtr va like qoldi. Yangi nom ham berishdi: <b>Instagram</b>. 2 yildan keyin $1 000 000 000 ga sotildi. Bugungi dars — shu san'at: <b>tahlil qilish va KESISH</b>. 5 varag'ingizdan bitta aniq MVP qarori chiqaramiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: '5 varaqdan PATTERN ovlash', tag: 'o\'yin' },
    { text: 'Piramida: fakt → pattern → INSAYT', tag: '' },
    { text: 'Muammo-nomzodlar reytingi: bittasini tanlash', tag: '' },
    { text: 'MVP chegarasi: qilamiz / keyin / qilmaymiz', tag: 'o\'yin' },
    { text: 'Og\'riq bozori kalkulyatori + MVP QARORI', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.grape} soft={T.grapeSoft}>{Ico.scissors(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Xom ma'lumot → MVP qarori</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Tekshir bosqichining finali: 1 muammo + 3 ficha + aniq chegara.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Keyingi darsdan QURISH boshlanadi 🔧</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Tahlil: <span className="italic" style={{ color: T.accent }}>5 varaqni oltinga aylantirish</span></h2></div>
        <Mentor>Intervyular — xomashyo. Bugun undan uch narsa yasaymiz: <b style={{ color: T.ink }}>insayt</b> (nega?), <b style={{ color: T.ink }}>bitta muammo</b> (qaysi?) va <b style={{ color: T.ink }}>MVP chegarasi</b> (nimani quramiz — nimani YO'Q?).</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — PATTERN OVLASH (SIGNATURE 1) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(RESP.map(r => r.id)) : new Set());
  const [active, setActive] = useState(null);
  const done = seen.size >= RESP.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? RESP.find(r => r.id === active) : null;
  const fogCount = RESP.filter(r => seen.has(r.id) && r.tags.some(t => t.includes('noaniqlik'))).length;
  const moneyCount = RESP.filter(r => seen.has(r.id) && r.tags.some(t => t.includes('pul'))).length;
  return (
    <Stage eyebrow="Pattern ovi · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Varaqlarni o'qing (${seen.size}/${RESP.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ekspeditsiyadan 5 varaq keldi. <span className="italic" style={{ color: T.accent }}>Takrorni toping.</span></h2></div>
        <Mentor>Har varaqni oching va o'ng tomondagi hisoblagichni kuzating: qaysi og'riq TAKRORLANYAPTI?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RESP.map(r => { const on = seen.has(r.id); return (
                <button key={r.id} className={`plink ${active === r.id ? 'plink-on' : ''}`} onClick={() => tap(r.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{r.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{r.name}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">o'qish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-1" style={{ padding: '13px 16px' }}>
              <p className="flow-label" style={{ marginBottom: 8 }}>📊 Pattern hisoblagichi</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="small" style={{ minWidth: 110, fontWeight: 700 }}>🌫 Noaniqlik</span><div className="fmeter-track" style={{ flex: 1 }}><div className="fmeter-fill" style={{ width: `${(fogCount / 5) * 100}%` }} /></div><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: fogCount >= 4 ? T.accent : T.ink2 }}>{fogCount}/5</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="small" style={{ minWidth: 110, fontWeight: 700 }}>💸 Pul sarfi</span><div className="fmeter-track" style={{ flex: 1 }}><div className="fmeter-fill" style={{ width: `${(moneyCount / 5) * 100}%`, background: T.honey }} /></div><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink2 }}>{moneyCount}/5</span></div>
              </div>
            </div>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.name}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55, fontStyle: 'italic' }}>{cur.quote}</p><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>{cur.tags.map((t, i) => (<span key={i} className="mono" style={{ fontSize: 10.5, fontWeight: 700, background: T.bg, borderRadius: 99, padding: '4px 9px', color: T.ink2 }}>{t}</span>))}</div></div>) : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Varaqni bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Pattern yaqqol: <b>4/5 — «qachon kelishini bilmayman»</b> — har biri O'Z so'zi bilan aytdi (kutdim / erta chiqaman / taksi / xavotir). Buvi esa chegarani chizib berdi: shoshmaydiganlar — bizning segment emas.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — PIRAMIDA: FAKT → PATTERN → INSAYT =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PYRAMID.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const done = seen.size >= PYRAMID.length;
  const tap = (id) => {
    const idx = PYRAMID.findIndex(p => p.id === id);
    if (idx > seen.size) return; // piramida pastdan quriladi
    setActive(id);
    setSeen(prev => { const n = new Set(prev); n.add(id); return n; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? PYRAMID.find(p => p.id === active) : null;
  return (
    <Stage eyebrow="Tahlil piramidasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Piramidani quring (${seen.size}/${PYRAMID.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Piramida: <span className="italic" style={{ color: T.accent }}>fakt → pattern → insayt</span></h2></div>
        <Mentor>Tahlil uch qavat: pastdan yuqoriga quriladi. Tartib bilan oching — eng tepada mukofot bor.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="tl fade-up delay-1">
              {PYRAMID.map((p, pi) => { const on = seen.has(p.id); const act = active === p.id; const isNext = !on && pi === seen.size; const locked = !on && pi > seen.size; return (
                <button key={p.id} className={`tl-item ${on ? 'tl-seen' : ''} ${act ? 'tl-act' : ''} ${isNext ? 'tl-next' : ''} ${locked ? 'tl-lock' : ''}`} onClick={() => tap(p.id)}>
                  <span className="tl-dot" style={{ background: on ? p.color : T.paper, color: on ? '#fff' : T.ink3 }}>{locked ? '🔒' : p.emoji}</span>
                  <span className="tl-body"><span className="tl-year" style={{ color: p.color }}>{locked ? '· · ·' : `${pi + 1}-qavat`}</span><span className="tl-title">{locked ? '?????' : p.label}</span></span>
                  {on && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                  {isNext && <span className="tl-cue">keyingi →</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Birinchi qavatni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Insayt kuchini his qildingizmi? <b>«Tezroq avtobus kerak» → «bilish kerak»</b> — bu farq million dollarlik: birinchisini yechib bo'lmaydi, ikkinchisini bitta web-sahifa yechadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Insayt nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Insayt — bu <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Intervyudagi har qanday qiziq gap', 'Pattern ortidagi «NEGA» — yechim yo\'nalishini o\'zgartiradigan tushuncha', 'Respondentlar soni', 'Mahsulot uchun chiroyli shior']} correctIdx={1}
    explainCorrect="To'g'ri! Fakt — «25 daqiqa kutdi». Pattern — «4/5 bilmayman dedi». Insayt — «og'riq tezlikda emas, NOANIQLIKDA». Aynan insayt MVP'ni belgilaydi: axborot yechimi, transport yechimi emas."
    explainWrong={{ 0: 'Qiziq gap — fakt bo\'lishi mumkin, insayt hali emas.', 2: 'Son — statistika. Insayt — ma\'no.', 3: 'Shior marketingga; insayt — qaror uchun.', default: 'Insayt = pattern ortidagi nega.' }} />
);

// ===== SCREEN 5 — NOMZODLAR REYTINGI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CANDS.map(c => c.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= CANDS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? CANDS.find(c => c.id === active) : null;
  return (
    <Stage eyebrow="Nomzodlar reytingi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${CANDS.length} nomzodni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Uch nomzod — <span className="italic" style={{ color: T.accent }}>bitta g'olib</span></h2></div>
        <Mentor>Ov varag'ingizdagi top-3 muammo intervyu sinovidan o'tdi. Endi dalillar gapiradi: har nomzodni oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CANDS.map(c => { const on = seen.has(c.id); return (
                <button key={c.id} className={`plink ${active === c.id ? 'plink-on' : ''}`} onClick={() => tap(c.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{c.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{c.name}</span><br /><span className="small" style={{ color: T.ink2 }}>{c.stats}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">baho</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.verdict === 'g\'olib' ? T.success : (cur.verdict === 'chetga' ? T.ink2 : T.honey), background: cur.verdict === 'g\'olib' ? T.successSoft : (cur.verdict === 'chetga' ? '#EFEDE8' : T.honeySoft) }}>{cur.ic} {cur.verdict.toUpperCase()}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Nomzodni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tanlov mezoni his-tuyg'u emas — <b>dalil</b>: tasdiqlar soni × og'riq kuchi × pul isboti. E'tibor bering: «yaxshi g'oya» chetda qoldi, «tasdiqlangan og'riq» yutdi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Qaysi muammoni MVP uchun tanlaymiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>MVP uchun muammoni <span className="italic" style={{ color: T.accent }}>nima hal qiladi</span>?</h2></>}
    options={['Menga eng qiziq tuyulgani', 'Eng ko\'p tasdiq + kuchli og\'riq + pul/vaqt isboti bo\'lgani', 'Yechimi eng oson bo\'lgani', 'Do\'stlarim maqtagan g\'oya']} correctIdx={1}
    explainCorrect="To'g'ri! Formula: tasdiqlar soni × og'riq kuchi × sarf isboti. Qiziqish muhim (motivatsiya!), lekin qaror dalilga quriladi — aks holda yana «SuperApp» yo'liga kiramiz."
    explainWrong={{ 0: 'Qiziqish — yoqilg\'i, lekin kompas emas.', 2: 'Oson yechim + kuchsiz og\'riq = hech kimga kerak emas.', 3: 'Do\'stlar maqtovi — xushmuomala yolg\'on bo\'lishi mumkin, esladingizmi?', default: 'Dalil hal qiladi: tasdiq + og\'riq + isbot.' }} />
);

// ===== SCREEN 6 — BITTA MUAMMO PRINTSIPI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('all');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['all', 'one']) : new Set(['all']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isAll = v === 'all';
  return (
    <Stage eyebrow="Bitta muammo" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega <span className="italic" style={{ color: T.accent }}>BITTA</span>?</h2></div>
        <Mentor>Uchala muammo ham «yaxshi»-ku — nega bittasini tanlaymiz? Ikki yo'lni solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isAll ? 'chip-on' : ''}`} onClick={() => set('all')}>🐙 Hammasini yechaman</button>
              <button className={`chip ${!isAll ? 'chip-on' : ''}`} onClick={() => set('one')}>🎯 Bittasini zo'r yechaman</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isAll ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isAll
                ? 'Avtobus + uy vazifa + yemakxona = «O\'quvchi SuperApp»! 3 muammo × 5 ficha = 15 ficha. Har biri chala. 3 oy qurish. Qabristondagi «SuperApp»ni eslaysizmi? 47 ficha, 0 foydalanuvchi.'
                : 'Faqat avtobus. 3 ficha. 2-3 hafta qurish. Malika ochadi — muammosi HAL: «Voy, ishlayapti-ku!» Bitta zo\'r yechilgan og\'riq foydalanuvchini o\'zi olib keladi. Instagram ham «faqat rasm» edi.'}</p>
            </div>
          </Col>
          <Col>
            {isAll
              ? <div className="frame-warn fade-step" key="a"><p className="body" style={{ margin: 0, color: T.ink }}>Matematika ham qarshi: kuchingiz 100 birlik bo'lsa — 15 fichaga 6-7 birlikdan tegadi. Har ficha o'rtacha. O'rtacha hech kimni qaytarib olib kelmaydi.</p></div>
              : <div className="frame-success fade-step" key="o"><p className="body" style={{ margin: 0, color: T.ink }}>100 birlik ÷ 3 ficha = har biriga 33. Core ficha — a'lo darajada. Foydalanuvchi bitta narsani eslab qoladi: «bu narsa MENING muammomni yechdi».</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qolgan 2 nomzod yo'qolmaydi — ular portfolioda «keyin» ro'yxatida kutadi. Avval bittasida G'ALABA kerak.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — MVP CHEGARA O'YINI (SIGNATURE 2) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(FEATURES.map(f => [f.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = FEATURES.filter(f => state[f.id]?.ok).length;
  const done = okCount >= FEATURES.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (f, ans) => {
    if (state[f.id]?.ok) return;
    const ok = ans === f.ans;
    setState(prev => ({ ...prev, [f.id]: { ok, wrong: !ok } }));
    setLast({ id: f.id, ok, why: f.why, ans: f.ans });
  };
  return (
    <Stage eyebrow="MVP chegarasi · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Chegaralang (${okCount}/${FEATURES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Avtobus-tracker MVP: <span className="italic" style={{ color: T.accent }}>✅ qilamiz · ⏳ keyin · ❌ qilmaymiz</span></h2></div>
        <Mentor>Har fichaga bitta savol bering: <b style={{ color: T.ink }}>«Bu CORE JOBga (qachon kelishini bilish) xizmat qiladimi va BIRINCHI kunda shartmi?»</b></Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEATURES.map(f => {
                const st = state[f.id] || {};
                return (
                  <div key={f.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{f.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: FMAP[f.ans].color }}>{FMAP[f.ans].emoji} {FMAP[f.ans].label}</span>
                      : <span className="sort-btns">{['do', 'later', 'no'].map(a => (<button key={a} className="sort-btn" title={FMAP[a].label} onClick={() => pick(f, a)}>{FMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">✂️ Kesish mahorati</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{FEATURES.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / FEATURES.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ To\'g\'ri chegara!' : '✗ Qayta o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Savol: core jobga xizmatmi? Birinchi kunda shartmi? Ikkalasiga HA — ✅; foydali-yu shoshilmas — ⏳; boshqa job — ❌.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Ficha yonidagi ✅ / ⏳ / ❌ ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Natija: MVP = <b>3 ta ficha</b> (jonli vaqt + 1 yo'nalish + web). Hatto ro'yxatdan o'tish ham kesildi! Bu 2-3 haftalik ish — 3 oylik emas. Kesish og'ritadi, lekin ozod qiladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — (o'rin almashgan) MVP TA'RIFI =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('min');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['min', 'viable']) : new Set(['min']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isMin = v === 'min';
  return (
    <Stage eyebrow="MVP anatomiyasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">MVP: <span className="italic" style={{ color: T.accent }}>Minimal</span> lekin <span className="italic" style={{ color: T.success }}>Ishlaydigan</span></h2></div>
        <Mentor>MVP ikki so'zdan: Minimal (ortiqcha yo'q) + Viable (ish bajaradi). Bittasi yetmaydi — ikkalasini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isMin ? 'chip-on' : ''}`} onClick={() => set('min')}>✂️ Minimal — lekin qanchagacha?</button>
              <button className={`chip ${!isMin ? 'chip-on' : ''}`} onClick={() => set('viable')}>💪 Viable — ish bajaradi</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isMin ? T.grape : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isMin
                ? 'Minimal ≠ chala. «Avtobus jadval PDF fayli» — minimal, lekin jonli vaqtni ko\'rsatmaydi = JOB BAJARILMAYDI = hech kim ishlatmaydi. Juda ko\'p kesib yuborish ham xato.'
                : 'Viable = Malika ertalab ochadi va SAVOLIGA JAVOB OLADI: «avtobus 7 daqiqada keladi». Dizayn oddiy, ficha 3 ta — lekin JOB BAJARILDI. Shu — viable.'}</p>
            </div>
          </Col>
          <Col>
            {isMin
              ? <div className="frame-warn fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Chegara testi: MVP'dan yana bitta narsani olib tashlasangiz — job buziladimi? Buzilsa — to'xtang, minimal chegaraga yetdingiz.</p></div>
              : <div className="frame-success fade-step" key="v"><p className="body" style={{ margin: 0, color: T.ink }}>Viable testi: foydalanuvchi BIRINCHI ochishda muammosiga javob oladimi? Olmasa — hali viable emas, qayta o'ylang.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>MVP formulasi: <b>eng kichik narsa — lekin JOB TO'LIQ bajariladi</b>. Kam kessangiz — 3 oy qurasiz; ko'p kessangiz — ishlamaydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="MVP nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>MVP — bu <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={['Mahsulotning chala, sifatsiz birinchi versiyasi', 'Core jobni TO\'LIQ bajaradigan eng kichik versiya', 'Barcha rejalashtirilgan fichalarning 50%i', 'Chiroyli dizaynli demo-sahifa']} correctIdx={1}
    explainCorrect="To'g'ri! MVP chala mahsulot emas — TOR mahsulot: bitta jobni a'lo bajaradi, boshqasiga umuman urinmaydi. Instagram MVP'si faqat rasm edi — lekin rasm MUKAMMAL ishladi."
    explainWrong={{ 0: 'Chala — job bajarilmaydi. MVP tor, lekin to\'liq.', 2: 'Foizlab kesish emas — JOB bo\'yicha kesish.', 3: 'Demo ko\'rsatadi, MVP ISHLAYDI — farqi katta.', default: 'Eng kichik + job to\'liq bajariladi.' }} />
);

// ===== SCREEN 10 — OG'RIQ BOZORI KALKULYATORI (SIGNATURE 3) =====
const fmtSum = (n) => n.toLocaleString('en-US').replace(/,/g, ' ');
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [uIdx, setUIdx] = useState(storedAnswer ? 2 : 0);
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1, 2]) : new Set([0]));
  const [shown, setShown] = useState(storedAnswer ? USERS_OPTS[2] * PAIN_PER_USER : USERS_OPTS[0] * PAIN_PER_USER);
  const done = seen.size >= USERS_OPTS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => {
    const target = USERS_OPTS[uIdx] * PAIN_PER_USER, dur = 900;
    let raf, t0 = null;
    const from = shown;
    const tick = (now) => {
      if (t0 === null) t0 = now;
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const guard = setTimeout(() => { cancelAnimationFrame(raf); setShown(target); }, 1200);
    return () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [uIdx]);
  const pickU = (i) => { setUIdx(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  return (
    <Stage eyebrow="Og'riq bozori · jonli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Uchala miqyosni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu og'riq <span className="italic" style={{ color: T.accent }}>qancha turadi?</span></h2></div>
        <Mentor>Nilufar opa taksiga oyiga ~150 ming so'm sarflaydi — bu BITTA odamning og'riq puli. Endi foydalanuvchi sonini bosib, bozorni ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {USERS_OPTS.map((u, i) => (<button key={u} className={`chip ${uIdx === i ? 'chip-on' : ''}`} onClick={() => pickU(i)}>{u} foydalanuvchi</button>))}
            </div>
            <div className="frame fade-up delay-2" style={{ textAlign: 'center', padding: 'clamp(18px,3vw,26px)' }}>
              <p className="flow-label" style={{ marginBottom: 4 }}>Oylik og'riq bozori (taksi + vaqt puli)</p>
              <p className="money">{fmtSum(shown)} <span style={{ fontSize: '0.45em', color: T.ink2 }}>so'm/oy</span></p>
              <p className="small" style={{ margin: '6px 0 0', color: T.ink2 }}>{USERS_OPTS[uIdx]} kishi × ~150 000 so'm — odamlar bu og'riqqa ALLAQACHON to'layapti</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" style={{ padding: '14px 17px', borderLeft: `4px solid ${T.success}` }}>
              <p className="note-h" style={{ color: T.success }}>💰 Sizning ulushingiz qancha bo'lardi?</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Agar yechimingiz shu og'riqning atigi kichik qismini narx qilsa (aytaylik oyiga 5 000 so'm): <b>{USERS_OPTS[uIdx]} × 5 000 = {fmtSum(USERS_OPTS[uIdx] * 5000)} so'm/oy</b>. 2-3 haftalik MVP uchun yomon emas-a?</p>
            </div>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muhim ogohlantirish: bu raqamlar — <b>potensial</b>, va'da emas (Mom Test esimizda!). Lekin ular bitta narsani isbotlaydi: og'riq PULGA teng — demak MVP qurishga arziydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — FAKT→INSAYT DRILLI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(INSIGHT_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = INSIGHT_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= INSIGHT_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Mashq · insayt" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Insaytni toping (${okCount}/${INSIGHT_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Insayt mashqi: <span className="italic" style={{ color: T.accent }}>pattern ortidagi «nega»ni toping</span></h2></div>
        <Mentor>Uch pattern — har biriga to'g'ri insaytni tanlang. Belgi: to'g'ri insayt YECHIM YO'NALISHINI o'zgartiradi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {INSIGHT_DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Insayt ayblamaydi va umumlashtirmaydi — u yechim eshigini ochadi.</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uchala insayt ham bitta sifatga ega: <b>MVP'ni KICHRAYTIRADI</b>. Yaxshi insayt doim ishni kamaytiradi — ko'paytirmaydi.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Ficha MVP'ga kirishi uchun qaysi savolga HA bo'lishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ficha <span className="italic" style={{ color: T.accent }}>MVP'ga kirish</span> sharti?</h2></>}
    options={['«Bu ficha zamonaviymi?»', '«Core jobga xizmat qiladimi VA birinchi kunda shartmi?»', '«Raqobatchilarda bormi?»', '«Qurish osonmi?»']} correctIdx={1}
    explainCorrect="To'g'ri! Ikki qismli filtr: core jobga xizmat + birinchi kun zarurati. «Ha + ha» = ✅ qilamiz. «Ha + yo'q» = ⏳ keyin. «Yo'q» = ❌ qilmaymiz — hatto zamonaviy va oson bo'lsa ham."
    explainWrong={{ 0: 'Zamonaviylik — did masalasi; job — dalil masalasi.', 2: 'Raqobatchiga qarab qurish — o\'z intervyularingizni tashlab qo\'yish.', 3: 'Osonlik tartibga ta\'sir qiladi, KIRISHGA emas.', default: 'Core job + birinchi kun — ikkala savolga HA.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #6 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Zo\'r! Hammasi so\'ralgan — hammasini qur, foydalanuvchilar xursand bo\'ladi»' },
    { id: 1, t: '«Intervyu — buyurtmalar ro\'yxati emas. CORE JOBni top: 23 tadan qaysi 3 tasi UNGA xizmat qiladi? Qolgani — keyin»' },
    { id: 2, t: '«23 ko\'p, 10 tasini qur»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«23 ta ficha chiqdi!»</span></h2></div>
        <Mentor>Aziz 5 intervyusini qildi (qoyil!) va tahlilga o'tirdi. Natijani ko'ring…</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«5 kishi bilan gaplashdim — har biri nimadir so'radi: biri taymer, biri musiqa, biri do'stlar reytingi, biri ovqat rejasi… Hammasini yozib chiqdim: 23 ta ficha! Hammasi REAL so'rovlar — demak hammasini quraman!»</p>
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
            ? 'So\'ralgan ≠ kerak. Odamlar suhbatda ko\'p narsa aytadi — lekin QAYTIB KELISHINI bitta narsa hal qiladi: core job bajarilishi. Azizning ishi: 23 tadan core jobga xizmat qiladigan 3 tasini ajratish, qolgan 20 tasini «keyin» ro\'yxatiga. Burbn ham hamma so\'raganini qurgan edi — Instagram esa kesganini.'
            : (picked === 0 ? 'Bu Burbn yo\'li: hamma so\'ragan → hech kim ishlatmagan. Ficha so\'rovi ≠ og\'riq.' : '10 ham, 23 ham — son emas muammo. Mezon: core job. Balki to\'g\'ri javob 3 tadir, balki 4 — lekin JOB bo\'yicha.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="MVP qaroriga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Kesish qoidasi: <span className="italic" style={{ color: T.accent }}>MVP qo'shish bilan emas — KESISH bilan quriladi</span></h2></div>
      <Mentor>Qaror oldidan kompas. 4 qoida — va qaror sizniki.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>✂️</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — haykaltarosh</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Haykal toshga qo'shish bilan emas — ortiqchasini olib tashlash bilan yasaladi.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.layers(18), c: T.blue, t: 'PIRAMIDA — fakt → pattern → insayt; insayt ishni KAMAYTIRADI' }, { ic: Ico.target(18), c: T.accent, t: 'BITTA MUAMMO — dalil tanlaydi: tasdiq × og\'riq × isbot' }, { ic: Ico.scissors(18), c: T.grape, t: 'CHEGARA — core job + birinchi kun; qolgani keyin/yo\'q' }, { ic: Ico.coins(18), c: T.honey, t: 'PUL TILI — og\'riqni so\'mga aylantiring: bozor ko\'rinadi' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: MVP QARORI =====
const emptyDecision = () => Object.fromEntries(DECISION_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyDecision());
  const isComplete = (k) => data[k].trim().length >= (k === 'problem' || k === 'insight' ? 10 : 4);
  const completeCount = DECISION_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= DECISION_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson98_mvp_decision', { title: 'MVP qarori', fields: DECISION_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = DECISION_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' — ')[0].split(' (')[0], color: f.color === T.ink2 ? T.ink3 : f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · MVP qarori" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${DECISION_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">MVP QARORI: <span className="italic" style={{ color: T.accent }}>portfolio 6-sahifa</span></h2></div>
        <Mentor>Eng muhim hujjat: O'Z intervyularingiz asosida to'ldiring (misollar avtobus-loyihadan). Bu qog'oz keyingi 6 darsda qurilish chizmangiz bo'ladi!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {DECISION_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Qurilish chizmangiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — chizma shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><DecisionDoc rows={docRows} />{passed && <span className="seal">QAROR QABUL QILINDI ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tekshir bosqichi TUGADI! Qo'lingizda: tasdiqlangan muammo, insayt va 3 fichali aniq chegara. Keyingi darsda bu chizma ARXITEKTURAGA aylanadi — kod bosqichi boshlanadi! 🔧</p></div>}
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
  { t: 'Quruvchi', l: 'KEYINGI BOSQICH' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Piramida: fakt → pattern → insayt; insayt yechim yo\'nalishini o\'zgartiradi', 'Bitta muammo: dalil tanlaydi (tasdiq × og\'riq × pul isboti)', 'MVP chegarasi: core job + birinchi kun → ✅/⏳/❌', 'Og\'riq pulga teng: bozor = foydalanuvchi × oylik sarf'];
  const GLOSSARY = [{ b: 'Pattern', t: '— intervyularda takrorlangan og\'riq' }, { b: 'Insayt', t: '— pattern ortidagi «nega»; ishni kamaytiradi' }, { b: 'MVP', t: '— core jobni TO\'LIQ bajaradigan eng kichik versiya' }, { b: 'Chegara', t: '— qilamiz / keyin / qilmaymiz ro\'yxati' }, { b: 'Og\'riq bozori', t: '— muammoga allaqachon sarflanayotgan pul' }, { b: 'Burbn saboqi', t: '— kesish qo\'shishdan kuchli' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tekshir bosqichi TUGADI · 3/3" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.rocket(12)}</span> 6-dars tamom · 2 bosqich yopildi</span><h2 className="title h-title fade-up d1">Gap tugadi. <span className="italic" style={{ color: T.accent }}>Endi quramiz.</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Kashf ✓ va Tekshir ✓ bosqichlari yopildi: muammo tasdiqlangan, insayt topilgan, MVP chegarasi chizilgan. Modulning ikkinchi yarmi — QURISH: arxitektura, AI bilan kod, dizayn, test.' : 'Yaxshi harakat! Qurishdan oldin tahlil qoidalarini mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 1 ? 'badge-done' : ''} ${i === 2 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔜' : '🔒'))} {b.t}<span className="badge-when" style={i <= 1 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi nishon — <b style={{ color: T.honey }}>🔨 Quruvchi</b>: MVP'ingiz birinchi marta ISHLAGANDA (103-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>📐</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — chizmani mustahkamlash</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>MVP qaroringizni real intervyu varaqlaringiz bilan yana bir solishtiring: har ✅ ficha ortida kamida bitta REAL sitata bormi? Bo'lmasa — ficha emas, sizning xohishingiz. Keyingi dars: mini-MVP arxitekturasi (KOD darsi!).</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson31({ lang: langProp, onFinished }) {
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

        /* === ARC STRIP === */
        .arc-strip { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .arc-chip { display: inline-flex; align-items: center; gap: 6px; background: ${T.paper}; border-radius: 99px; padding: 7px 12px; font-family: 'Manrope'; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .arc-t { font-weight: 700; font-size: 11.5px; color: ${T.ink}; }
        .arc-here { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.35); }
        .arc-you { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.05em; animation: you-pulse 1.8s ease-in-out infinite; }
        @keyframes you-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,79,40,0.45); } 50% { box-shadow: 0 0 0 5px rgba(255,79,40,0); } }
        .arc-sep { color: ${T.ink3}; font-size: 13px; }

        /* === PIRAMIDA / TIMELINE === */
        .tl { display: flex; flex-direction: column; gap: 8px; position: relative; }
        .tl::before { content: ''; position: absolute; left: 19px; top: 16px; bottom: 16px; width: 2px; background: ${T.ink3}44; border-radius: 2px; }
        .tl-item { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 12px; padding: 9px 12px 9px 3px; background: transparent; cursor: pointer; transition: all 0.18s; position: relative; }
        .tl-item:hover { background: ${T.paper}; }
        .tl-act { background: ${T.paper}; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.2); }
        .tl-dot { width: 34px; height: 34px; min-width: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 4px 10px -4px rgba(${T.shadowBase},0.3); z-index: 1; transition: background 0.25s; }
        .tl-body { display: flex; flex-direction: column; gap: 1px; flex: 1; text-align: left; }
        .tl-year { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.08em; }
        .tl-title { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .tl-next .tl-dot { box-shadow: 0 0 0 2px ${T.accent}, 0 4px 10px -4px rgba(${T.shadowBase},0.3); animation: you-pulse 1.8s ease-in-out infinite; }
        .tl-cue { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; animation: fade-step 0.4s; }
        .tl-lock { opacity: 0.42; cursor: default; }
        .tl-lock:hover { background: transparent; }

        /* === SARALASH === */
        .sort-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; }
        .sort-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .sort-text { flex: 1; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; line-height: 1.4; }
        .sort-btns { display: inline-flex; gap: 5px; flex-shrink: 0; }
        .sort-btn { width: 34px; height: 30px; border: none; border-radius: 9px; background: ${T.bg}; font-size: 14px; cursor: pointer; transition: all 0.15s; }
        .sort-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.3); background: ${T.accentSoft}; }
        .sort-verdict { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; animation: feat-pop .3s cubic-bezier(.2,.7,.2,1); }

        /* === METER === */
        .fmeter-track { height: 10px; background: ${T.ink3}33; border-radius: 99px; overflow: hidden; }
        .fmeter-fill { height: 100%; background: linear-gradient(90deg, ${T.honey}, ${T.accent}); border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1); box-shadow: 0 0 10px rgba(255,79,40,0.45); }

        /* === PUL COUNT-UP === */
        .money { font-family: 'Fraunces', serif; font-size: clamp(26px,4vw,38px); color: ${T.success}; margin: 0; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }

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
        .deck-val { font-family: 'Georgia, serif'; font-size: 12.5px; color: ${T.ink}; line-height: 1.45; margin: 2px 0 0; }

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
