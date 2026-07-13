import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM5 — 5 REAL INTERVYU: EKSPEDITSIYA — v16 (AUDIOSIZ)
// G'oya: bu dars ekranda tugamaydi — hayotda tugaydi. Qo'rquvni yechish, respondent xaritasi
// (oiladan boshlab), kirish gapi, yozuv shabloni (sitata so'zma-so'z!), qiyin vaziyatlar.
// Signature 1: Aziz intervyu transkriptidan 4 xatoni topish o'yini.
// Signature 2: 5 intervyulik EKSPEDITSIYA REJASI (kim + mavzu + qachon) — birinchisi bugun, oila.
// IKKINCHI NISHON: 🎖 Tadqiqotchi — reja 5/5 tayyor bo'lganda (localStorage'ga yoziladi).
// Davomiylik: yozuv shabloni namunasi = 96-darsdagi Malika intervyusi; Aziz case #5.
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
  mic: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3M8 21h8" /></svg>),
  map: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>),
  pen: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M17 3l4 4L8 20l-5 1 1-5L17 3z" /></svg>),
  users: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.2 14.6c2 .3 3.6 1.6 4.3 3.9" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-interviews-30-v16', lessonTitle: { uz: '5 real intervyu — ekspeditsiya', ru: '5 реальных интервью — экспедиция' } };
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
// Qo'rquv-buzar (s2)
const FEARS = [
  { id: 'f1', fear: '«Meni g\'alati deb o\'ylashadi»', emoji: '🙈', color: T.accent, soft: T.accentSoft, real: 'Aksincha! Odamlar O\'ZI HAQIDA gapirishni juda yaxshi ko\'radi. «Sizning tajribangiz qiziq» deb so\'rasangiz — 15 daqiqa to\'xtatolmay qolasiz. Sinab ko\'rilgan.' },
  { id: 'f2', fear: '«Odamlarni bezovta qilaman»', emoji: '😰', color: T.grape, soft: T.grapeSoft, real: 'O\'z muammosi so\'ralgan odam o\'zini MUHIM his qiladi — siz unga «fikringiz qadrli» deyapsiz. Bezovtalik — 20 daqiqalik pitch; 3 daqiqalik samimiy savol — hurmat.' },
  { id: 'f3', fear: '«Nima deyishni unutib qo\'yaman»', emoji: '🫠', color: T.blue, soft: T.blueSoft, real: 'Sizda skript bor: 5-savol shabloni (o\'tgan dars) + yozuv varag\'i (bugun). Aktyor emas — detektivsiz: varaqqa qarab so\'rash mutlaqo normal.' }
];

// Respondent xaritasi (s3)
const RMAP = [
  { id: 'r1', ic: '🏠', name: '1-daraja: Oila', d: 'BUGUN kechki ovqatda. Eng past to\'siq: rad etmaydi, kulmaydi, vaqti bor. Onangiz/otangiz/buvingiz — muammongiz ularning hayotiga tegsa (ro\'zg\'or, vaqt, pul) — ideal birinchi respondent.' },
  { id: 'r2', ic: '🎒', name: '2-daraja: Sinfdosh yoki do\'st', d: 'Tanaffusda, yo\'lda, o\'yindan keyin. Tengdosh muammolarida (dars, jadval, transport, o\'yin) — eng aniq javoblar shulardan. Ogohlantirish: do\'st ham xushmuomala yolg\'on gapiradi — 5-savol bilan himoyalaning!' },
  { id: 'r3', ic: '🏘️', name: '3-daraja: Qo\'shni yoki tanish', d: 'Biroz notanishroq odam — halolroq javob. Qo\'shni, ota-onangizning do\'sti, sport bo\'limidagi tanish. «Maktab loyihasi uchun 3 daqiqa savolim bor edi» — deyarli hech kim yo\'q demaydi.' },
  { id: 'r4', ic: '💬', name: '4-daraja: Telegram guruh', d: 'Sinf guruhi, mahalla guruhi, qiziqish guruhi. Yozma so\'rov: «[Muammo] bo\'yicha 2 daqiqa savolim bor edi — kimga qulay?» Ovoz xabar yoki qo\'ng\'iroqqa chiqsangiz — yozishmadan yaxshi.' },
  { id: 'r5', ic: '🔧', name: '5-daraja: Kasb egasi', d: 'Do\'kondor, sartarosh, usta, kutubxonachi — muammongiz ULARNING sohasida bo\'lsa. Eng qimmat daraja: ular og\'riq uchun PUL to\'lashga tayyor. Xarid paytida 2 savol — tabiiy suhbat.' }
];

// Kirish gapi elementlari (s5b uchun kontekst) — s5 toggle
// Yozuv shabloni (s6) — Malika namunasi bilan (96-dars davomi!)
const TEMPLATE = [
  { id: 't1', label: 'Respondent', emoji: '👤', color: T.blue, ex: 'Malika, 16 yosh, 10-sinf o\'quvchisi, har kuni avtobusda qatnaydi', why: 'Kim ekani keyin tahlilda muhim: yoshi, roli, muammoga aloqasi. Ism shart emas — tavsif yetadi.' },
  { id: 't2', label: '5 savol javoblari', emoji: '🎙️', color: T.grape, ex: 'Vaziyat: kecha 25 daqiqa kutgan · Og\'riq: nazoratga kech qolgan, «2» olgan · Workaround: 20 daqiqa erta chiqadi, ba\'zan taksi · Kamchilik: uyqu + qimmat · Isbot: haftasiga 40-50 ming taksi', why: 'Har savolga 1-2 qator. To\'liq gap shart emas — kalit faktlar: raqam, voqea, sana.' },
  { id: 't3', label: 'Oltin sitata', emoji: '💬', color: T.accent, ex: '«Avtobus qachon kelishi — xudoga ayon» (kulib aytdi)', why: 'SO\'ZMA-SO\'Z yozing! Bu keyin pitchingizdagi eng kuchli slayd bo\'ladi. Xulosangiz unutiladi — jonli sitata qoladi.' },
  { id: 't4', label: 'Kuzatuv', emoji: '👀', color: T.honey, ex: 'Taksi narxini aytganda ovozi ko\'tarildi — bu joyda og\'riq kuchli. Jadval haqida beparvo gapirdi.', why: 'So\'z hammasi emas: QAYERDA jonlandi, qayerda yelka qisdi? Hissiyot og\'riq xaritasini beradi.' },
  { id: 't5', label: 'Xulosa', emoji: '⚖️', color: T.success, ex: 'Og\'riq TASDIQLANDI: har kuni + kuchli + pul sarflanyapti', why: 'Bitta qator: tasdiqlandi / tasdiqlanmadi / qisman. 5 intervyudan keyin shu qatorlar qaror chiqaradi.' }
];

// Aziz transkript xatolari (s7) — SIGNATURE 1
const TRANSCRIPT = [
  { id: 'x1', t: 'Aziz: «Salom! Sport-ilova qilyapman, juda zo\'r bo\'ladi! Savol bersam?»', bad: true, why: 'PITCH bilan boshladi — endi respondent unga yoqishga harakat qiladi. Kirish: maqsad o\'rganish, g\'oya sir.' },
  { id: 'x2', t: 'Aziz: «Oxirgi marta qachon sport qilmoqchi bo\'lib — qilmay qoldingiz?»', bad: false, why: 'Zo\'r savol: o\'tmish + aniq voqea + voz kechish signali.' },
  { id: 'x3', t: 'Aziz (javobdan keyin): «Demak sizga motivatsiya ilovasi kerak ekan-da, to\'g\'rimi?»', bad: true, why: 'Yetakladi + tayyor yechimni og\'ziga soldi. Uning XULOSASINI kutish kerak edi.' },
  { id: 'x4', t: 'Aziz: «Nima to\'sqinlik qildi o\'shanda?»', bad: false, why: 'To\'g\'ri qazish: og\'riq sababiga chuqurlashyapti.' },
  { id: 'x5', t: 'Aziz: «Yozib o\'tirmayman, esimda qoladi»', bad: true, why: 'Sitata yozilmadi! Ertaga bu suhbatdan faqat «yaxshi o\'tdi» tuyg\'usi qoladi — faktlar o\'chadi.' },
  { id: 'x6', t: 'Aziz: «Ilovam chiqsa, 10 mingga sotib olasizmi?»', bad: true, why: 'Gipotetik pul — taqiqlangan savol. «Sport uchun biror narsaga pul sarflaganmisiz?» bo\'lishi kerak edi.' }
];

// Qiyin vaziyatlar trenajyori (s8)
const HARD_DRILL = [
  { id: 'h1', label: 'Respondent: «Hozir vaqtim yo\'q»', emoji: '⏰', color: T.blue, opts: ['«Iltimos-iltimos, atigi 20 daqiqa!»', '«Tushunarli! 2 daqiqalik 2 ta savolim bor edi — yoki qachon qulay bo\'ladi?»', 'Xafa bo\'lib ketish — demak intervyu bo\'lmadi'], correct: 1, why: 'Kichik so\'rov + tanlov bering. «2 daqiqa» — rozi bo\'lish oson; ko\'pincha suhbat o\'zi cho\'zilib ketadi.' },
  { id: 'h2', label: 'Respondent qisqa javob beryapti: «ha», «yo\'q», «normal»', emoji: '🧊', color: T.grape, opts: ['Savollarni tezroq berib, tugatish', '«Nega bunaqa qisqa javob beryapsiz?» deb so\'rash', '«Oxirgi marta shunday bo\'lganini gapirib bering — o\'sha kuni nima bo\'lgandi?» — voqeaga o\'tish'], correct: 2, why: 'Yopiq savollar qisqa javob chaqiradi. VOQEA so\'rasangiz — odam hikoya qila boshlaydi.' },
  { id: 'h3', label: 'Respondent mavzudan chiqib ketdi (qo\'shnisi haqida gapiryapti)', emoji: '🌀', color: T.honey, opts: ['Gapini kesib: «Bu mavzuga aloqasi yo\'q»', '«Qiziq ekan! Aytgancha, avtobus masalasiga qaytsak — o\'sha kuni nima qildingiz?»', 'Indamay eshitib o\'tirish — 20 daqiqa'], correct: 1, why: 'Iliq ko\'prik: avval tan oling («qiziq ekan»), keyin muloyim qaytaring. Hurmat + fokus.' }
];

// Sitata oltinligi drilli (s11)
const QUOTE_DRILL = [
  { id: 'q1', label: 'Transport muammosi bo\'yicha qaysi yozuv qimmatli?', emoji: '📝', color: T.blue, opts: ['«Respondent transportdan norozi» (mening xulosam)', '«“Avtobus qachon kelishi — xudoga ayon” dedi kulib', '«Transport yomon» deb yozib qo\'yish'], correct: 1, why: 'Jonli sitata + hissiyot belgisi. Xulosa — sizning talqiningiz; sitata — dalil.' },
  { id: 'q2', label: 'Og\'riq kuchini qaysi yozuv ko\'rsatadi?', emoji: '🌡️', color: T.accent, opts: ['«Og\'riq: 8/10» (o\'zim baholadim)', '«Muammo katta deb o\'ylayman»', '«“Shu deb fizikadan 2 oldim” — ovozi o\'zgardi, jahli chiqdi»'], correct: 2, why: 'Real oqibat + kuzatilgan hissiyot. Sizning balingiz emas — UNING reaksiyasi o\'lchov.' },
  { id: 'q3', label: 'Isbot bo\'yicha qaysi yozuv kuchli?', emoji: '💰', color: T.success, opts: ['«“Haftasiga 40-50 ming taksiga ketyapti” — aniq aytdi»', '«Pul sarflashga tayyor ko\'rinadi»', '«Boy oila shekilli, to\'laydi»'], correct: 0, why: 'Aniq raqam — respondentning o\'z og\'zidan. Taxmin va taassurot isbot emas.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// Ekspeditsiya rejasi (s15)
const WHO = ['🏠 oila', '🎒 do\'st', '🏘️ tanish', '💬 guruh', '🔧 kasb egasi'];
const WHEN = ['📅 bugun', '🌅 ertaga', '🗓️ shu hafta'];
const PLAN_HINTS = [
  'Masalan: onam — ro\'zg\'or xaridlari muammosi',
  'Masalan: Sardor — uy vazifasini qidirish',
  'Masalan: qo\'shni opa — navbat/vaqt muammosi',
  'Masalan: sinf guruhi — avtobus muammosi',
  'Masalan: do\'kondor aka — hisob-kitob daftari'
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

// Ekspeditsiya hujjati (s15)
const PlanDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.map(16)}</span><span>Ekspeditsiya varag'i · 5-sahifa</span></div>
    {rows.map((r, i) => (
      <div key={i} className="deck-row">
        <span className="deck-num" style={{ background: r.color }}>{i + 1}</span>
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
          {i === 1 && <span className="arc-you">2/3</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: AIRBNB ESHIKMA-ESHIK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Pullari yo\'q edi — reklamaga yetmasdi' },
    { id: 'b', label: 'Yuzma-yuz suhbatdagi faktlarni HECH QAYERDAN topib bo\'lmasdi' },
    { id: 'c', label: 'Nyu-Yorkni aylanib ko\'rgilari keldi' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Akselerator" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Milliarderlar nega <span className="italic" style={{ color: T.accent }}>eshik taqillatgan?</span></h1>
        <Mentor>Bugungi dars boshqacha: u ekranda emas — HAYOTDA tugaydi. Avval bir hikoya.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>🛏️ 2009 · NYU-YORK</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Airbnb o'lim yoqasida edi — haftasiga atigi $200 daromad. Founderlar Brian va Joe har hafta Nyu-Yorkka uchib borib, foydalanuvchilarning UYIGA kirib, ular bilan soatlab gaplashishdi: nima qiyin, qayerda tiqilib qolasiz?</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Bu suhbatlardan chiqqan topilmalar (masalan: yomon fotosuratlar = bron yo'q) kompaniyani o'limdan qaytardi. Ularning maslahatchisi Pol Grem buni shunday atagan: <b>«Masshtablanmaydigan ishlarni qiling»</b>.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega ular shaxsan borishdi deb o'ylaysiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'To\'g\'ri! ' : 'Asosiy sabab: '}<b>jonli suhbat faktlari hech qanday statistikada yo'q</b>. Milliard dollarlik kompaniya founderlariga eshik taqillatish uyat bo'lmagan bo'lsa — sizga 5 ta suhbat nima bo'pti? Bugun: qo'rquvni yechamiz, reja tuzamiz — va siz EKSPEDITSIYAGA chiqasiz. Oxirida: 🎖 <b style={{ color: T.honey }}>Tadqiqotchi nishoni</b>.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Qo\'rquv-buzar: 3 mif va realiti', tag: '' },
    { text: 'Respondent xaritasi: oiladan kasb egasigacha', tag: '' },
    { text: 'Kirish gapi + yozuv shabloni (Malika namunasi)', tag: '' },
    { text: 'Aziz xatolarini toping + qiyin vaziyatlar', tag: 'o\'yin' },
    { text: 'EKSPEDITSIYA REJASI: 5 intervyu + 🎖 nishon', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.honey} soft={T.honeySoft}>{Ico.map(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>5 real intervyu ekspeditsiyasi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Simulyator tugadi — endi jonli odamlar. Birinchisi bugunoq: oila.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.honey, margin: 0 }}>→ Dars oxirida ikkinchi nishon: 🎖 Tadqiqotchi</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Ekspeditsiya: <span className="italic" style={{ color: T.accent }}>ekrandan hayotga</span></h2></div>
        <Mentor>Skript bor (5-savol), detektor bor (yolg'on/fakt). Yetishmayotgani — JASORAT va REJA. Bugun ikkalasini beramiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — QO'RQUV-BUZAR =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(FEARS.map(f => f.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= FEARS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? FEARS.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="Qo'rquv-buzar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${FEARS.length} qo'rquvni buzing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Halol gaplashamiz: <span className="italic" style={{ color: T.accent }}>birinchi intervyu qo'rqinchli</span></h2></div>
        <Mentor>Bu normal — HAMMA founder shundan o'tgan. Har qo'rquvni bosing va realitini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEARS.map(f => { const on = seen.has(f.id); return (
                <button key={f.id} className="lens-btn" style={active === f.id ? { boxShadow: `inset 0 0 0 2px ${f.color}`, background: f.soft } : undefined} onClick={() => tap(f.id)}>
                  <span style={{ fontSize: 17 }}>{f.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? f.color : T.ink }}>{f.fear}</span>
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: T.success, background: T.successSoft }}>✂️ Realiti</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.real}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qo'rquvni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Va eng muhim sir: <b>birinchi intervyudan keyin qo'rquv yo'qoladi</b>. Shuning uchun birinchisini eng oson joydan qilamiz — bugun, uyda, kechki ovqatda.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — RESPONDENT XARITASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(RMAP.map(r => r.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= RMAP.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? RMAP.find(r => r.id === active) : null;
  return (
    <Stage eyebrow="Respondent xaritasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${RMAP.length} darajani oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kimdan so'raymiz: <span className="italic" style={{ color: T.accent }}>5 daraja</span></h2></div>
        <Mentor>Osondan qiyinga qarab. Muhim qoida: respondent MUAMMONGIZGA yaqin odam bo'lsin — avtobus muammosini mashinali qo'shnidan so'ramang 🙂</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {RMAP.map(r => { const on = seen.has(r.id); return (
                <button key={r.id} className={`plink ${active === r.id ? 'plink-on' : ''}`} onClick={() => tap(r.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{r.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{r.name}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ochish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.name}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Darajani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ideal aralashma: <b>1 oila + 2 tengdosh + 1 tanish + 1 guruh/kasb egasi</b>. Besh xil ko'z — bitta muammo. Hammasi bir xil odam bo'lsa, javoblar ham bir xil chiqadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Birinchi intervyuni kimdan boshlagan ma'qul?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Birinchi intervyu — <span className="italic" style={{ color: T.accent }}>kimdan</span>?</h2></>}
    options={['Notanish kasb egasidan — eng qimmat javoblar o\'sha yerda', 'Oiladan — bugun kechki ovqatda, eng past to\'siq', 'Telegram guruhdan — yozma qulayroq', 'Hech kimdan — simulyator yetarli edi']} correctIdx={1}
    explainCorrect="To'g'ri! Birinchi intervyu vazifasi — fakt yig'ishdan ham ko'proq QO'RQUVNI YENGISH. Oila rad etmaydi, xato qilsangiz kulmaydi. Mashq qilib, keyin qiyinroq darajalarga chiqasiz."
    explainWrong={{ 0: 'Kasb egasi — oltin, lekin 5-daraja: unga tajriba bilan boring.', 2: 'Yozishmada hissiyot va qazish yo\'qoladi — jonli suhbat kuchliroq.', 3: 'Simulyator — trenajyor. Haqiqiy faktlar faqat real odamlardan.', default: 'Eng past to\'siqdan boshlang: oila, bugun.' }} />
);

// ===== SCREEN 5 — KIRISH GAPI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('bad');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['bad', 'good']) : new Set(['bad']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isBad = v === 'bad';
  return (
    <Stage eyebrow="Kirish gapi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi 10 soniya: <span className="italic" style={{ color: T.accent }}>kirish gapi</span></h2></div>
        <Mentor>Suhbat taqdiri birinchi jumlalarda hal bo'ladi. Ikkala boshlanishni solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isBad ? 'chip-on' : ''}`} onClick={() => set('bad')}>❌ Yomon boshlanish</button>
              <button className={`chip ${!isBad ? 'chip-on' : ''}`} onClick={() => set('good')}>✅ Yaxshi boshlanish</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isBad ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>{isBad
                ? '«Assalomu alaykum! Men startap qilyapman, ilovam bor, juda innovatsion! 20-30 daqiqa vaqtingizni olsam, hammasini tushuntirib beraman…»'
                : '«[Ism] aka/opa, maktab loyihasi uchun 3 daqiqalik savolim bor edi — [avtobus kutish] haqida. Xato javob yo\'q, shunchaki tajribangizni bilmoqchiman. Maylimi?»'}</p>
            </div>
          </Col>
          <Col>
            {isBad
              ? <div className="frame-warn fade-step" key="b"><p className="body" style={{ margin: 0, color: T.ink }}>Uch xato birdan: «startap/ilova» (pitch signali — endi u sizga yoqishga harakat qiladi), «20-30 daqiqa» (qochadi), «tushuntirib beraman» (siz gapirasiz — u emas).</p></div>
              : <div className="frame-success fade-step" key="g"><p className="body" style={{ margin: 0, color: T.ink }}>Uch element joyida: <b>qisqa vaqt</b> («3 daqiqa» — rozi bo'lish oson), <b>o'rganish maqsadi</b> («tajribangiz» — g'oya haqida lom-mim yo'q!), <b>xavfsizlik</b> («xato javob yo'q»).</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formulani yodlang: <b>QISQA VAQT + O'RGANISH MAQSADI + XAVFSIZLIK</b>. Va g'oyangizni suhbat oxirigacha sir saqlang.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Kirish gapida nima bo'lishi KERAK EMAS?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kirish gapida nima <span className="italic" style={{ color: T.accent }}>bo'lmasligi</span> kerak?</h2></>}
    options={['Qisqa vaqt va\'dasi («3 daqiqa»)', 'G\'oyangiz va ilovangiz haqida hikoya', '«Xato javob yo\'q» degan xavfsizlik', 'O\'rganish maqsadi («tajribangiz kerak»)']} correctIdx={1}
    explainCorrect="To'g'ri! G'oya — suhbat oxirigacha sir. Aytdingizmi — respondent endi 'g'oyaga baho beruvchi'ga aylanadi va sizga yoqadigan javob qidiradi. Qolgan uchala element — kirish gapining ustunlari."
    explainWrong={{ 0: 'Qisqa vaqt — kerak: rozi bo\'lishni osonlashtiradi.', 2: 'Xavfsizlik — kerak: odam erkin gapiradi.', 3: 'O\'rganish maqsadi — kerak: pitch emasligini bildiradi.', default: 'G\'oya sir qoladi — oxirigacha.' }} />
);

// ===== SCREEN 6 — YOZUV SHABLONI (MALIKA NAMUNASI) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(TEMPLATE.map(t => t.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= TEMPLATE.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? TEMPLATE.find(t => t.id === active) : null;
  return (
    <Stage eyebrow="Yozuv shabloni" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${TEMPLATE.length} bo'limni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Intervyu varag'i — <span className="italic" style={{ color: T.accent }}>Malika namunasida</span></h2></div>
        <Mentor>O'tgan darsdagi Malika intervyusini varaqqa tushirdik — mana TO'LDIRILGAN namuna. Har bo'limni oching: nima va qanday yoziladi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TEMPLATE.map(t => { const on = seen.has(t.id); return (
                <button key={t.id} className="lens-btn" style={active === t.id ? { boxShadow: `inset 0 0 0 2px ${t.color}`, background: t.color + '15' } : undefined} onClick={() => tap(t.id)}>
                  <span style={{ fontSize: 17 }}>{t.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? t.color : T.ink }}>{t.label}</span>
                  {t.id === 't3' && <span className="mono" style={{ fontSize: 9, fontWeight: 800, color: T.accent, marginLeft: 4 }}>MUHIM</span>}
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(12.5px,1.7vw,14px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.5, background: T.bg, borderRadius: 8, padding: '9px 11px' }}>{cur.ex}</p><p className="body" style={{ margin: '10px 0 0', color: T.ink2 }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bo'limni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shu 5 bo'limni daftaringizga yoki telefon eslatmasiga ko'chirib oling — har intervyudan keyin <b>5 daqiqa ichida</b> to'ldiring (keyin unutiladi!).</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — AZIZ TRANSKRIPTI: XATOLARNI TOPING (SIGNATURE 1) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(TRANSCRIPT.map(x => [x.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = TRANSCRIPT.filter(x => state[x.id]?.ok).length;
  const done = okCount >= TRANSCRIPT.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (x, asBad) => {
    if (state[x.id]?.ok) return;
    const ok = asBad === x.bad;
    setState(prev => ({ ...prev, [x.id]: { ok, wrong: !ok } }));
    setLast({ id: x.id, ok, why: x.why, bad: x.bad });
  };
  return (
    <Stage eyebrow="Transkript tahlili · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tahlil qiling (${okCount}/${TRANSCRIPT.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Azizning intervyusi: <span className="italic" style={{ color: T.accent }}>xatolarni toping</span></h2></div>
        <Mentor>Aziz birinchi intervyusini o'tkazdi va yozib oldi (buni-ku qoyil!). Har jumlani baholang: 🚫 xato yoki ✅ to'g'ri yo'l?</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TRANSCRIPT.map(x => {
                const st = state[x.id] || {};
                return (
                  <div key={x.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{x.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: x.bad ? T.accent : T.success }}>{x.bad ? '🚫 xato' : '✅ to\'g\'ri'}</span>
                      : <span className="sort-btns"><button className="sort-btn" title="Xato" onClick={() => pick(x, true)}>🚫</button><button className="sort-btn" title="To'g'ri" onClick={() => pick(x, false)}>✅</button></span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🔬 Tahlil</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{TRANSCRIPT.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / TRANSCRIPT.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ To\'g\'ri baholadingiz!' : '✗ Qayta ko\'ring'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'O\'tgan dars mezonlarini eslang: pitch? yetaklash? kelajak/gipotetik savol? sitata yozilmadimi?'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Jumla yonidagi 🚫 yoki ✅ ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aziz 4 ta xato qildi — lekin 2 ta savoli zo'r edi va u YOZIB OLDI. Birinchi intervyu mukammal bo'lmaydi — bo'lishi ham shart emas. Qilingan o'rtacha intervyu &gt; qilinmagan ideal intervyu.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — QIYIN VAZIYATLAR TRENAJYORI =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(HARD_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = HARD_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= HARD_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Qiyin vaziyatlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Yeching (${okCount}/${HARD_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Dalada hammasi silliq bo'lmaydi: <span className="italic" style={{ color: T.accent }}>3 qiyin vaziyat</span></h2></div>
        <Mentor>Real intervyularda shu uchtasi eng ko'p uchraydi. Har biriga to'g'ri harakatni tanlang — dalada tayyor bo'lasiz.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HARD_DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Maqsadni eslang: hurmat saqlab, faktga yetish.</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uchala vaziyatga tayyorsiz. Yana bitta sir: <b>tabassum va samimiylik</b> — texnikadan kuchliroq ishlaydi.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Intervyu yozuvida eng qimmatlisi nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yozuvda eng <span className="italic" style={{ color: T.accent }}>qimmatlisi</span> nima?</h2></>}
    options={['Mening umumiy taassurotim («yaxshi o\'tdi»)', 'Respondentning SO\'ZMA-SO\'Z sitatalari va aniq raqamlar', 'Intervyu qancha davom etgani', 'Respondentning ismi va telefon raqami']} correctIdx={1}
    explainCorrect="To'g'ri! «Haftasiga 40-50 ming taksiga ketyapti» — bu sitata keyin MVP qaroriga ham, pitch slaydiga ham kiradi. Taassurot 2 kunda unutiladi, sitata yillab xizmat qiladi."
    explainWrong={{ 0: 'Taassurot — talqin. Dalil emas.', 2: 'Davomiylik statistikasi hech narsa demaydi.', 3: 'Kontakt foydali (keyin MVP ko\'rsatish uchun!), lekin suhbatning O\'ZI emas.', default: 'Sitata so\'zma-so\'z + raqamlar.' }} />
);

// ===== SCREEN 10 — 5 XIL ODAM + SATURATION =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('same');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['same', 'mix']) : new Set(['same']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isSame = v === 'same';
  return (
    <Stage eyebrow="Kim bilan 5 ta" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">5 intervyu — <span className="italic" style={{ color: T.accent }}>5 xil ko'z</span></h2></div>
        <Mentor>5 ta intervyu kimlar bilan bo'lishi kerak? Ikki strategiyani solishtiring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isSame ? 'chip-on' : ''}`} onClick={() => set('same')}>👥 5 ta sinfdosh</button>
              <button className={`chip ${!isSame ? 'chip-on' : ''}`} onClick={() => set('mix')}>🌈 Aralash 5 lik</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isSame ? T.accent : T.success}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isSame
                ? 'Bir partada o\'tirgan 5 do\'st — bir xil kun, bir xil avtobus, bir xil javob. Siz 1 ta intervyuni 5 marta qildingiz, xolos.'
                : 'Onangiz + 2 sinfdosh + qo\'shni talaba + do\'kondor: har biri muammoni O\'Z tomonidan ko\'radi. Kutilmagan burchaklar shu yerdan chiqadi.'}</p>
            </div>
          </Col>
          <Col>
            {isSame
              ? <div className="frame-warn fade-step" key="s"><p className="body" style={{ margin: 0, color: T.ink }}>«Echo-kamera» xatosi: bir xil odamlar — bir xil sado. 5 raqami emas — 5 XIL nuqtai nazar qimmat.</p></div>
              : <div className="frame-success fade-step" key="m"><p className="body" style={{ margin: 0, color: T.ink }}>Va foydali belgi: 4-5-intervyuda javoblar TAKRORLANA boshlasa — bu yaxshi signal: asosiy naqshni topdingiz. Yangi gap chiqmay qo'ydimi — yig'ish yetarli.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula: <b>1 oila + 2 tengdosh + 1 tanish + 1 guruh/kasb egasi</b>. Takrorlar boshlandimi — to'xtatib, tahlilga o'ting (keyingi dars!).</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — SITATA DRILLI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(QUOTE_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = QUOTE_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= QUOTE_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Mashq · yozuv sifati" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tanlang (${okCount}/${QUOTE_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yozuv sifati: <span className="italic" style={{ color: T.accent }}>fakt yoki talqin?</span></h2></div>
        <Mentor>Bitta intervyu — uch xil yozib olish mumkin. Har blokda eng QIMMAT yozuvni tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {QUOTE_DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Qidiring: respondentning O'Z so'zlari + raqam + kuzatilgan reaksiya.</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'z pishdi! Endi yozuvlaringiz keyingi darsda (tahlil) ishlaydigan xomashyo bo'ladi — «taassurot» emas.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="4-5-intervyuda javoblar takrorlana boshladi. Bu nima degani?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Javoblar <span className="italic" style={{ color: T.accent }}>takrorlana boshladi</span> — bu nima?</h2></>}
    options={['Yomon belgi — respondentlar til biriktirgan', 'Yaxshi signal: asosiy naqsh topildi, yig\'ish yetarli — tahlilga o\'tish vaqti', 'Intervyularni qayta o\'tkazish kerak', 'Muammo mavjud emas degani']} correctIdx={1}
    explainCorrect="To'g'ri! Bunga «to'yinish» (saturation) deyiladi: yangi suhbat yangi fakt bermay qo'ysa — naqsh topilgan. 5 ta sifatli intervyu ko'pincha yetarli. Keyingi qadam: tahlil."
    explainWrong={{ 0: 'Til biriktirishmagan — shunchaki muammo naqshi umumiy.', 2: 'Qayta o\'tkazish — vaqt isrofi: ma\'lumot allaqachon qo\'lingizda.', 3: 'Aksincha: takrorlangan og\'riq — TASDIQLANGAN og\'riq.', default: 'Takror = naqsh topildi = tahlilga o\'ting.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #5 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«To\'g\'ri, 1 ta chuqur intervyu 5 ta yuzakidan yaxshi — yetadi»' },
    { id: 1, t: '«1 kishi = 1 nuqtai nazar. Buvingga QO\'SHIB yana 4 xil odam bilan gaplash: tengdosh, tanish, guruh… Keyin xulosa qil»' },
    { id: 2, t: '«Buvi respondent bo\'lmaydi — qaytadan boshla»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«1 ta intervyu yetdi-da?»</span></h2></div>
        <Mentor>Aziz Mom Test'ni o'rgandi va… birinchi intervyusini qildi. Endi dangasalik boshlanyapti 🙂</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«Buvim bilan 40 daqiqa gaplashdim — hammasi shabl bo'yicha! Juda ko'p narsa bildim. Yana 4 ta qilish shartmi? Baribir bir xil gap chiqadi-ku…»</p>
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
            ? 'Buvi bilan suhbat — zo\'r start (va 40 daqiqa — buvilar bilan doim shunday 🙂). Lekin 1 kishi = tasodif bo\'lishi mumkin. Naqsh kamida 3, ishonchli xulosa 5 xil odamdan chiqadi. «Bir xil gap chiqadi» — buni TAXMIN qilmaydilar, TEKSHIRADILAR: takror chiqsa — bu o\'zi qimmat signal (to\'yinish).'
            : (picked === 0 ? 'Chuqurlik zo\'r, lekin 1 nuqtai nazar — hali naqsh emas. Kamida 3-5 xil odam kerak.' : 'Buvi — juda yaxshi birinchi respondent! Qaytadan boshlash shart emas — davom ettirish kerak.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Ekspeditsiya rejasiga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Ekspeditsiya qoidasi: <span className="italic" style={{ color: T.accent }}>qilingan o'rtacha &gt; qilinmagan ideal</span></h2></div>
      <Mentor>Dalaga chiqishdan oldin — kompas. 4 qoida yoningizda bo'lsin.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🧭</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — ekspeditsiya boshlig'i</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Xarita bor, skript bor. Birinchi manzil — oshxona.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.users(18), c: T.blue, t: 'BOSHLASH — oiladan, BUGUN. Qo\'rquv birinchi suhbatda o\'ladi' }, { ic: Ico.mic(18), c: T.accent, t: 'KIRISH — qisqa vaqt + o\'rganish maqsadi + xavfsizlik; g\'oya sir' }, { ic: Ico.pen(18), c: T.grape, t: 'YOZUV — sitata so\'zma-so\'z, 5 daqiqa ichida shablonga' }, { ic: Ico.flag(18), c: T.success, t: '5 XIL ODAM — takror boshlanunicha; «yo\'q» ham natija' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: EKSPEDITSIYA REJASI =====
const emptyPlan = () => Array.from({ length: 5 }, (_, i) => ({ note: '', who: i === 0 ? 0 : Math.min(i, WHO.length - 1), when: i === 0 ? 0 : Math.min(Math.floor(i / 2), WHEN.length - 1) }));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(() => storedAnswer?.data || emptyPlan());
  const isComplete = (r) => r.note.trim().length >= 6;
  const completeCount = rows.filter(isComplete).length;
  const passed = completeCount >= 5;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data: rows, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson97_interview_plan', { title: '5 intervyu ekspeditsiya rejasi', items: rows.map(r => ({ who: WHO[r.who], note: r.note.trim(), when: WHEN[r.when] })), savedAt: Date.now() });
      savePortfolioSection('badge_researcher', { earned: true, badge: 'Tadqiqotchi', lesson: 97, at: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (i, patch) => setRows(prev => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const inputStyle = { flex: 1, fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box', minWidth: 0 };
  const docRows = rows.map((r, i) => ({ i, r })).filter(x => isComplete(x.r)).map(x => ({ label: `${WHO[x.r.who]} · ${WHEN[x.r.when]}`, text: x.r.note.trim(), color: [T.blue, T.grape, T.honey, T.accent, T.success][x.i] }));
  return (
    <Stage eyebrow="Yakuniy ish · ekspeditsiya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Nishonni olish →' : `Rejalang (${completeCount}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ekspeditsiya rejasi: <span className="italic" style={{ color: T.accent }}>5 intervyu</span></h2></div>
        <Mentor>Har qator — bitta intervyu: KIM bilan (belgini bosib aylantiring), NIMA haqida (ov varag'ingizdagi muammo!), QACHON. 1-qator allaqachon to'g'ri boshlangan: 🏠 oila · 📅 bugun. To'ldiring — va so'z bering!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🗺️ Reja</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: passed ? T.success : T.accent }}>{completeCount}/5</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(completeCount / 5) * 100}%` }} /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {rows.map((r, i) => { const ok = isComplete(r); return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.paper, borderRadius: 10, padding: '7px 8px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -7px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: ok ? T.success : T.ink3, minWidth: 14, textAlign: 'right' }}>{i + 1}</span>
                  <button className="cyc" onClick={() => upd(i, { who: (r.who + 1) % WHO.length })} title="Kim bilan">{WHO[r.who]}</button>
                  <input value={r.note} onChange={e => upd(i, { note: e.target.value })} placeholder={PLAN_HINTS[i]} style={inputStyle} />
                  <button className="cyc" onClick={() => upd(i, { when: (r.when + 1) % WHEN.length })} title="Qachon">{WHEN[r.when]}</button>
                </div>
              ); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Ekspeditsiya varag'ingiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Rejalang — varaq shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><PlanDoc rows={docRows} />{passed && <span className="seal">YO'LGA TAYYOR ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Reja tayyor va saqlandi! Endi eng muhimi: <b>bugunoq 1-intervyuni qiling</b>. Har intervyudan keyin shablonni 5 daqiqada to'ldiring. 5 varaq yig'ilgach — keyingi dars ularni oltinga aylantiradi (tahlil + MVP qarori).</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN + NISHON MAROSIMI =====
const BADGES = [
  { t: 'Muammo Ovchisi', l: 'olingan' },
  { t: 'Tadqiqotchi', l: 'QO\'LGA KIRITILDI' },
  { t: 'Quruvchi', l: '103-dars' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Qo\'rquv birinchi intervyuda o\'ladi — boshlash: oila, bugun', 'Kirish gapi: qisqa vaqt + o\'rganish maqsadi + xavfsizlik; g\'oya — sir', 'Yozuv: sitata so\'zma-so\'z + raqam + kuzatuv; 5 daqiqada shablonga', '5 XIL odam; takror boshlandimi — to\'yinish, tahlilga o\'tamiz'];
  const GLOSSARY = [{ b: 'Ekspeditsiya', t: '— 5 real intervyu rejasi va yurishi' }, { b: 'Kirish gapi', t: '— suhbatning birinchi 10 soniyasi' }, { b: 'Oltin sitata', t: '— respondentning so\'zma-so\'z yozilgan gapi' }, { b: 'To\'yinish', t: '— javoblar takrorlana boshlashi (yetarlilik signali)' }, { b: 'Masshtablanmaydigan ishlar', t: '— qo\'lda, shaxsan qilinadigan ishlar (Airbnb saboqlari)' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tekshir bosqichi · 2/3" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 5.7 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 9) * 0.15}s` }} />))}</div>}
        <div className="medal-strip fade-up">
          <div className="medal">🎖️</div>
          <div style={{ minWidth: 0 }}>
            <p className="mono small" style={{ margin: 0, color: T.honey, fontWeight: 800, letterSpacing: '0.14em' }}>IKKINCHI NISHON QO'LGA KIRITILDI</p>
            <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: '2px 0 0', color: T.ink, fontSize: 'clamp(17px,2.4vw,22px)' }}>Tadqiqotchi</p>
            <p className="small" style={{ margin: '2px 0 0', color: T.ink2 }}>Ekspeditsiya rejasi tayyor. Nishonning to'la kuchi — 5 intervyu o'tkazilganda ochiladi!</p>
          </div>
        </div>
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up d1"><span className="tick">{Ico.rocket(12)}</span> 5-dars tamom</span><h2 className="title h-title fade-up d1">Ekran tugadi — <span className="italic" style={{ color: T.accent }}>hayot boshlandi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Qo\'rquv buzildi, xarita chizildi, reja muhrlandi. Birinchi manzil — bugungi kechki ovqat. Yodda tuting: qilingan o\'rtacha intervyu qilinmagan idealdan yaxshi.' : 'Yaxshi harakat! Dalaga chiqishdan oldin qoidalarni mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 1 ? 'badge-done' : ''} ${i === 2 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔜' : '🔒'))} {b.t}<span className="badge-when" style={i <= 1 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>2/5 nishon! Keyingisi — <b style={{ color: T.honey }}>Quruvchi</b>: MVP'ingiz ishlaganda (103-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🗺️</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — EKSPEDITSIYANING O'ZI</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Rejadagi 5 intervyuni o'tkazing (1-si bugun — oila!). Har biridan keyin 5 daqiqada shablonni to'ldiring: 5 javob + oltin sitata + kuzatuv + xulosa. Keyingi darsga 5 varaq bilan keling — ularni MVP qaroriga aylantiramiz.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson30({ lang: langProp, onFinished }) {
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

        /* === LINZA === */
        .lens-btn { display: flex; align-items: center; gap: 11px; width: 100%; border: none; border-radius: 12px; padding: 12px 14px; background: ${T.paper}; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .lens-btn:hover { transform: translateY(-1px); }
        .lens-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; }

        /* === DRILL === */
        .drill-opt { display: flex; align-items: center; gap: 10px; width: 100%; border: none; border-radius: 10px; padding: 9px 12px; background: ${T.bg}; cursor: pointer; transition: all 0.16s; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; text-align: left; }
        .drill-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -7px rgba(${T.shadowBase},0.22); }
        .drill-opt:disabled { cursor: default; }
        .drill-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .drill-no { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake 0.42s; }

        /* === CYCLE CHIP === */
        .cyc { border: none; border-radius: 8px; background: ${T.bg}; font-size: 11px; padding: 7px 7px; cursor: pointer; transition: all 0.15s; flex-shrink: 0; line-height: 1; font-family: 'Manrope'; font-weight: 600; }
        .cyc:hover { transform: translateY(-1px); background: ${T.honeySoft}; }

        /* === MUHR === */
        .seal { position: absolute; bottom: 10px; right: 12px; padding: 5px 11px; border: 2.5px solid ${T.success}; border-radius: 8px; color: ${T.success}; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; transform: rotate(-7deg); background: rgba(255,255,255,0.78); animation: stamp-in 0.5s cubic-bezier(.2,.9,.3,1.4) 0.15s both; }

        /* === KONFETTI === */
        .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .cf { position: absolute; top: -14px; width: 8px; height: 13px; border-radius: 2px; opacity: 0; animation: cf-fall 2.8s ease-in forwards; }
        @keyframes cf-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(76vh) rotate(560deg); opacity: 0; } }

        /* === MEDAL MAROSIMI === */
        .medal-strip { display: flex; align-items: center; gap: 16px; background: linear-gradient(105deg, ${T.honeySoft}, #FFF7E8); border-radius: 16px; padding: clamp(14px,2.4vw,20px); box-shadow: 0 10px 28px -10px rgba(224,137,43,0.4); position: relative; overflow: hidden; }
        .medal-strip::after { content: ''; position: absolute; top: 0; left: -40%; width: 30%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.8), transparent); animation: badge-shine 2.8s ease-in-out 1.2s infinite; }
        .medal { width: 74px; height: 74px; min-width: 74px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #FFE9A8, ${T.honey}); display: flex; align-items: center; justify-content: center; font-size: 36px; box-shadow: 0 12px 30px -8px rgba(224,137,43,0.6), inset 0 0 0 4px rgba(255,255,255,0.35); animation: medal-drop 0.75s cubic-bezier(.2,.9,.3,1.35) both, medal-glow 2.4s ease-in-out 1s infinite; }
        @keyframes medal-drop { 0% { opacity: 0; transform: translateY(-46px) scale(0.4) rotate(-14deg); } 65% { opacity: 1; transform: translateY(4px) scale(1.08) rotate(2deg); } 100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); } }
        @keyframes medal-glow { 0%,100% { box-shadow: 0 12px 30px -8px rgba(224,137,43,0.6), inset 0 0 0 4px rgba(255,255,255,0.35); } 50% { box-shadow: 0 12px 40px -6px rgba(224,137,43,0.85), inset 0 0 0 4px rgba(255,255,255,0.5); } }

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
