import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · PM3 — MUAMMONI QANDAY IZLASH: OV BOSHLANDI — v16 (AUDIOSIZ)
// G'oya: buyuk mahsulotlar g'ijinishdan tug'iladi. Radar 4 signali (workaround = oltin),
// ov joylari (otziv 1-2⭐, forumlar), baholash matritsasi (chastota × og'riq).
// Signature 1: "Malika kuni" radar-simulyatori (8 lahzadan muammo ovlash).
// Signature 2: matritsa saralash o'yini. Signature 3: 10 muammo ov + jonli reyting.
// BIRINCHI NISHON: 🏹 Muammo Ovchisi — 10 muammo ovlanganda (localStorage'ga yoziladi).
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
  users: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5" /><circle cx="17" cy="9" r="2.4" /><path d="M16.2 14.6c2 .3 3.6 1.6 4.3 3.9" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>),
  repeat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>),
  flag: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="2.6" /></svg>),
  cap: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /><path d="M22 9v5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-problemhunt-28-v16', lessonTitle: { uz: 'Muammoni qanday izlash — ov boshlandi', ru: 'Как искать проблему — охота началась' } };
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
// G'ijinish muzeyi (s2)
const FRUSTS = [
  { id: 'db', ic: '📦', name: 'Dropbox', sub: '$10 mlrd kompaniya', story: '2006-yil. Drew Houston 4 soatlik avtobus yo\'liga chiqdi — ishlamoqchi edi. Flashkasi… uyda qolgan. Butun yo\'l ishsiz, g\'ijinib ketdi: «Nega fayllarim o\'zi men bilan yurmaydi?!» Shu avtobusda Dropbox g\'oyasi tug\'ildi.' },
  { id: 'ba', ic: '🩹', name: 'Band-Aid (plastir)', sub: '100 yillik mahsulot', story: '1920-yil. Earle Dickson\'ning rafiqasi oshxonada tez-tez qo\'lini kesib olardi. Mavjud bintni BIR QO\'L bilan bog\'lab bo\'lmasdi — har safar Earle kerak edi. U tayyor yopishqoq plastirni o\'ylab topdi. Yaqinining takror og\'rig\'i — mahsulotga aylandi.' },
  { id: 'ab', ic: '🛏️', name: 'Airbnb', sub: '$80 mlrd kompaniya', story: '2007-yil, San-Fransisko. Brian va Joe ijara pulini to\'lay olmay qolishdi. Ayni paytda shahardagi konferensiya tufayli BARCHA mehmonxonalar to\'lgan edi. Ular zaldagi 3 ta havo matrasini ijaraga qo\'yishdi — va ikki muammo bir-birini yechdi.' }
];

// Radar 4 signali (s3)
const SIGNALS = [
  { id: 'sig1', label: '«Yana shu…!»', emoji: '😤', color: T.accent, soft: T.accentSoft, d: 'Takrorlanadigan g\'ijinish so\'zlari: «har doim shunaqa», «yana ishlamayapti», «qachongacha». Bir marta bo\'lgan narsa — tasodif, har kuni takrorlangani — signal.' },
  { id: 'sig2', label: 'Workaround (yamoq)', emoji: '🩹', color: T.honey, soft: T.honeySoft, d: 'ENG OLTIN SIGNAL! Odam muammoga o\'zicha yechim yasagan: daftardagi jadvalni rasmga olib guruhga tashlaydi, Excel\'da qo\'lda yuritadi, monitorga eslatma yopishtiradi. Og\'riq shu qadar kuchliki — odam O\'ZI harakat qilgan.' },
  { id: 'sig3', label: 'Vaqt yutuvchi', emoji: '⏳', color: T.blue, soft: T.blueSoft, d: '«Yarim soatim ketdi», «kechgacha o\'tirdim» — qo\'lda, soatlab qilinadigan takroriy ish. Vaqt — eng qimmat narsa: uni yeyayotgan narsa doim yechimga arziydi.' },
  { id: 'sig4', label: 'Voz kechish', emoji: '🙅', color: T.grape, soft: T.grapeSoft, d: '«Qiyin ekan, tashladim», «boshlagan edim — chala qoldi». Odam natijani XOHLAGAN, lekin yo\'l og\'ir bo\'lgani uchun taslim bo\'lgan. Yo\'lni oson qilsangiz — u qaytadi.' }
];

// Ov joylari (s5)
const HUNTSPOTS = [
  { id: 'h1', ic: '👀', name: 'O\'z kuningiz', d: 'Bugungi kunni kino kabi qayta o\'ynang: qayerda kutdingiz, qayerda g\'ijindingiz, nimani ikki marta qildingiz? Eng yaqin ov maydoni — o\'zingiz.' },
  { id: 'h2', ic: '🏠', name: 'Oila va tanishlar', d: 'Nonushtachiligi shikoyatlar — bepul tadqiqot: ota-onangiz nimadan noliydi? Buvingiz nimani «qiyin» deydi? Yaqinlar og\'rig\'ini siz hammadan yaxshi ko\'rasiz (Band-Aid shunday tug\'ilgan).' },
  { id: 'h3', ic: '⭐', name: 'Otzivlar (1-2 yulduz)', d: 'App Store, marketplace, Google Maps otzivlari. 5 yulduzlilar maqtaydi — foydasi kam. 1-2 yulduzli va ANIQ SABAB yozilganlari — oltin koni: «yaxshi-yu, lekin eksport qilib bo\'lmaydi».' },
  { id: 'h4', ic: '💬', name: 'Forum va guruhlar', d: 'Telegram guruhlar, forumlar: «qanday qilsa bo\'ladi?», «kim biladi?», «maslahat bering» savollari — ochiq e\'lon qilingan og\'riqlar. Birov so\'ragan bo\'lsa — yana o\'nlab odam jim qiynalgan.' },
  { id: 'h5', ic: '🔧', name: 'Kasb egalari', d: 'Sotuvchi, sartarosh, nonvoy, usta — ish kunini so\'rang: qayerda qog\'oz-daftar? qayerda telefon qilib so\'raydi? Kichik biznes to\'la yechilmagan muammo — va ular to\'lashga tayyor.' }
];

// "Malika kuni" radar o'yini (s6) — SIGNATURE 1
const MOMENTS = [
  { id: 'm1', time: '07:00', t: 'Budilnik jiringladi — turdi, nonushta qildi', isProblem: false, why: 'Oddiy lahza — hammasi rejadagidek, g\'ijinish yo\'q.' },
  { id: 'm2', time: '07:40', t: 'Avtobus qachon kelishi noma\'lum — bekatda 20 daqiqa sovuqda kutdi', isProblem: true, why: 'Signal: vaqt yutuvchi + har kuni takrorlanadi. Klassik oltin muammo.' },
  { id: 'm3', time: '09:00', t: 'Jadval o\'zgargan ekan — 3 ta guruhni titkilab, sinfdoshdan so\'rab bildi', isProblem: true, why: 'Signal: axborot tarqoq, workaround (guruh titkilash + so\'rash).' },
  { id: 'm4', time: '10:30', t: 'Tanaffusda do\'stlari bilan suhbatlashdi', isProblem: false, why: 'Oddiy — bu yoqimli lahza, hech kim yechim so\'ramaydi.' },
  { id: 'm5', time: '12:00', t: 'Yemakxonada navbat shunchalik uzunki — ovqatlanmasdan darsga qaytdi', isProblem: true, why: 'Signal: voz kechish! Natijani xohlagan, yo\'l og\'ir — taslim bo\'ldi.' },
  { id: 'm6', time: '14:30', t: 'Uy vazifasini daftardan rasmga olib, 2 ta guruhga tashlab, yana onasiga yubordi', isProblem: true, why: 'Signal: workaround — eng oltin signal! Odam o\'zicha tizim yasagan.' },
  { id: 'm7', time: '17:00', t: 'Sevimli serialining yangi qismini ko\'rdi', isProblem: false, why: 'Oddiy — dam olish. Har lahzadan muammo qidirish shart emas.' },
  { id: 'm8', time: '20:00', t: 'Imtihonga qaysi mavzular kirishini bilmay, 3 kishiga yozib chiqdi', isProblem: true, why: 'Signal: «yana shu» + vaqt yutuvchi. Axborot bir joyda emas.' }
];

// Matritsa kvadrantlari (s7)
const QUADS = [
  { id: 'gold', emoji: '🔥', name: 'OLTIN KON', pos: 'Har kuni × Kuchli', color: T.accent, soft: T.accentSoft, d: 'Har kuni og\'ritadi va qattiq og\'ritadi. Odam yechimga vaqt ham, pul ham beradi. Misol: avtobusni bilmay sovuqda kutish. SIZNING NISHONINGIZ — shu kvadrant.' },
  { id: 'wait', emoji: '💎', name: 'KUTUVCHI', pos: 'Kamdan-kam × Kuchli', color: T.grape, soft: T.grapeSoft, d: 'Og\'riq kuchli, lekin yiliga 1-2 marta: hujjat almashtirish, ko\'chish. Odam «bir amallab» o\'tkazib yuboradi — mahsulotga qaytish qiyin bo\'ladi.' },
  { id: 'watch', emoji: '⚠️', name: 'KUZATUVDAGI', pos: 'Har kuni × Yengil', color: T.honey, soft: T.honeySoft, d: 'Mayda, lekin doimiy g\'ijinish: quloqchin chalkashishi, qalam yo\'qolishi. Zo\'r yechim topilsa — sevimli mahsulot bo\'lishi mumkin, lekin odam pul to\'lashga shoshilmaydi.' },
  { id: 'forget', emoji: '🗑️', name: 'UNUT', pos: 'Kamdan-kam × Yengil', color: T.ink3, soft: '#EFEDE8', d: 'Kam uchraydi, og\'ritmaydi: safarda bir marta adapter mos kelmadi. Bunga mahsulot qurish — vaqt isrofi.' }
];

// Matritsa o'yini (s8) — SIGNATURE 2
const MQUIZ = [
  { id: 'q1', t: 'Har kuni: avtobus qachon kelishi noma\'lum — bekatda kutish', ans: 'gold', why: 'Har kuni + asabbuzar kutish = oltin kon.' },
  { id: 'q2', t: 'Yilda 1-2 marta: hujjat topshirish — uzun navbat, ovora', ans: 'wait', why: 'Og\'riq kuchli, lekin juda kam takrorlanadi — kutuvchi kvadrant.' },
  { id: 'q3', t: 'Quloqchin simlari har kuni chalkashadi', ans: 'watch', why: 'Har kuni, lekin og\'riq yengil — kuzatuvdagi g\'ijinish.' },
  { id: 'q4', t: 'Safarda bir marta rozetka adapteri mos kelmadi', ans: 'forget', why: 'Kam + yengil — unut, bunga mahsulot qurilmaydi.' },
  { id: 'q5', t: 'Har kecha: uy vazifasi qaysi guruhda ekanini qidirish', ans: 'gold', why: 'Har kuni + vaqt yutadi + asabga tegadi = oltin kon.' },
  { id: 'q6', t: 'Ruchka imtihon kuni yozmay qolsa (yilda bir-ikki)', ans: 'forget', why: 'Zaxira ruchka bor — kam uchraydi, yengil. Unut.' }
];
const QMAP = { gold: QUADS[0], wait: QUADS[1], watch: QUADS[2], forget: QUADS[3] };

// Muammo ta'rifi drilli (s10): KIM + QACHON + OG'RIQ
const FORM_DRILL = [
  { id: 'f1', label: 'Xom fikr: «Transport yomon ishlaydi»', emoji: '🚌', color: T.blue, opts: ['Hamma shahar transportini yaxshilash kerak', 'O\'quvchilar (KIM) har kuni ertalab (QACHON) avtobus qachon kelishini bilmay 20 daqiqa kutadi (OG\'RIQ)', 'Menga avtobuslar umuman yoqmaydi'], correct: 1, why: 'KIM + QACHON + OG\'RIQ bor — endi bu muammo ustida ishlash mumkin.' },
  { id: 'f2', label: 'Xom fikr: «Odamlar vaqtini behuda sarflaydi»', emoji: '⏰', color: T.grape, opts: ['Hamma odam telefonini kam ishlatishi kerak', 'Vaqt — eng qimmat resurs, uni tejash zarur', 'O\'quvchilar (KIM) har kecha (QACHON) uy vazifasi qaysi guruhda ekanini 15-20 daqiqa qidiradi (OG\'RIQ)'], correct: 2, why: 'Aniq odam, aniq vaziyat, o\'lchanadigan og\'riq — mana bu ta\'rif!' },
  { id: 'f3', label: 'Xom fikr: «Kichik do\'konlar zamonaviy emas»', emoji: '🏪', color: T.honey, opts: ['Do\'kon egasi (KIM) har hafta (QACHON) qaysi mahsulot qachon tugashini bilmay, ortiqcha yoki kam xarid qiladi (OG\'RIQ)', 'Do\'konlar hammasi eskirgan, yopilsin', 'Do\'konlarga chiroyli vitrina kerak'], correct: 0, why: 'E\'tibor bering: «zamonaviy emas» — fikr; «bilmay ortiqcha xarid qiladi» — o\'lchanadigan og\'riq.' }
];

// JTBD ko'prigi (s11): muammo ortidagi job
const JOB_DRILL = [
  { id: 'j1', label: 'Muammo: avtobusni bilmay bekatda kutish', emoji: '🚌', color: T.blue, opts: ['Job: «avtobus haydashni o\'rganish»', 'Job: «maktabga vaqtida, asabsiz yetib borish»', 'Job: «bekatda do\'st orttirish»'], correct: 1, why: 'Muammo — bu YOMON BAJARILAYOTGAN JOB. Yechim = o\'sha jobni a\'lo bajarish.' },
  { id: 'j2', label: 'Muammo: uy vazifasini guruhlardan qidirish', emoji: '📚', color: T.grape, opts: ['Job: «ko\'proq guruhga a\'zo bo\'lish»', 'Job: «telefonda ko\'p o\'tirish»', 'Job: «bugun nima qilish kerakligini 1 daqiqada bilish»'], correct: 2, why: 'O\'quvchiga guruh kerak emas — javob kerak. Job shu.' },
  { id: 'j3', label: 'Muammo: yemakxona navbati — ovqatsiz qolish', emoji: '🍜', color: T.honey, opts: ['Job: «tanaffusda tez va issiq ovqatlanish»', 'Job: «navbatda sabr o\'rganish»', 'Job: «uydan ovqat olib kelish»'], correct: 0, why: '«Uydan olib kelish» — bu workaround (signal!), job emas. Job — tez va issiq ovqatlanish.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// Ov varag'i (s15)
const FREQ = ['⚡ kam', '⚡⚡ tez-tez', '⚡⚡⚡ har kuni'];
const PAIN = ['🔥 yengil', '🔥🔥 o\'rtacha', '🔥🔥🔥 kuchli'];
const HUNT_HINTS = [
  'Uyda: har kuni nima g\'ijintiradi?',
  'Yo\'lda: bekat, tirbandlik, kutish…',
  'Maktabda: jadval, navbat, e\'lonlar…',
  'Telefonda: qaysi ilova asabga tegadi?',
  'Oilada: ota-onangiz nimadan noliydi?',
  'Do\'konda: sotuvchi nima deb noliydi?',
  'Darsda: nima vaqtingizni yeydi?',
  'Do\'stlarda: nimani «iloji yo\'q» deyishadi?',
  'O\'zingizda: nimani boshlab, tashlagansiz?',
  'Otzivlarda: 1-2 yulduzlilar nima deydi?'
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

// Ov reytingi hujjati (s15)
const HuntDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.target(16)}</span><span>Ov reytingi · 3-sahifa</span></div>
    {rows.map((r, i) => (
      <div key={i} className="deck-row">
        <span className="deck-num" style={{ background: r.color }}>{i + 1}</span>
        <div style={{ minWidth: 0 }}><span className="deck-tag" style={{ color: r.color }}>{r.top ? '🏆 ' : ''}{r.label}</span><p className="deck-val">{r.text}</p></div>
      </div>
    ))}
  </div>
);

const ArcStrip = () => (
  <div className="arc-strip fade-up delay-2">
    {STAGES.map((s, i) => (
      <React.Fragment key={s.n}>
        <div className={`arc-chip ${i === 0 ? 'arc-here' : ''}`}>
          <span style={{ fontSize: 14 }}>{s.ic}</span>
          <span className="arc-t">{s.t}</span>
          {i === 0 && <span className="arc-you">3/3</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: PARIJ, QISH, TAKSI YO'Q =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Instagram' },
    { id: 'b', label: 'Uber' },
    { id: 'c', label: 'Telegram' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Akselerator" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>Parij. Qish. <span className="italic" style={{ color: T.accent }}>Taksi yo'q.</span></h1>
        <Mentor>2008-yil. Ikki do'st konferensiyadan chiqdi — qor, sovuq, 30 daqiqa taksi kutishdi. Kelmadi. Ular ROSA g'ijinishdi. Va shu g'ijinishdan nimadir tug'ildi…</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.blue}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.blue, fontWeight: 700 }}>❄️ 2008 · PARIJ</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>«Nega tugmani bossam — mashina kelmaydi?!» — deb g'ijindi Travis va Garrett. Ko'pchilik shu joyda noligan bo'lardi-yu, unutardi. Ular esa g'ijinishni <b>yozib olishdi</b> va savol berishdi: «Bu og'riq yana kimda bor?»</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Bugun o'sha g'ijinishdan tug'ilgan kompaniya <b>$70 000 000 000</b> dan ortiq turadi.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi kompaniya haqida gapiryapmiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'To\'g\'ri — ' : 'Bu — '}<b>Uber</b>! Va bu yagona misol emas: deyarli har buyuk mahsulot kimningdir g'ijinishidan boshlangan. Farq bitta: oddiy odam g'ijinib O'TIB KETADI, founder esa <b>to'xtab, yozib oladi</b>. Bugun sizda ham shu radar paydo bo'ladi — va dars oxirida birinchi nishon: <b style={{ color: T.honey }}>🏹 Muammo Ovchisi</b>.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'G\'ijinish muzeyi: Dropbox, Band-Aid, Airbnb', tag: '' },
    { text: 'Muammo radari: 4 signal (workaround!)', tag: '' },
    { text: 'Ov joylari: otziv, forum, kasb egalari', tag: '' },
    { text: '«Malika kuni» + baholash matritsasi', tag: 'o\'yin' },
    { text: 'OV: 10 muammo + 🏹 birinchi nishon', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.honey} soft={T.honeySoft}>{Ico.eye(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Muammo radarini yoqish</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Atrofdan 10 muammo ovlash va har birini baholash.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.honey, margin: 0 }}>→ Kashf bosqichi finali — bugun birinchi nishon beriladi! 🏹</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Ovni boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Muammo — founderning oltin koni.</span> Ovga chiqamiz</h2></div>
        <Mentor>JTBD ko'zingiz bor. Endi u bilan atrofga qaraymiz: muammolar hamma joyda — faqat ularni KO'RISHNI o'rganish kerak. Bu darsdan siz 10 ta real muammo bilan chiqasiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — G'IJINISH MUZEYI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(FRUSTS.map(f => f.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= FRUSTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? FRUSTS.find(f => f.id === active) : null;
  return (
    <Stage eyebrow="G'ijinish muzeyi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${FRUSTS.length} eksponatni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">G'ijinish <span className="italic" style={{ color: T.accent }}>muzeyi</span></h2></div>
        <Mentor>Uchta mashhur eksponat. Har birida bitta narsaga e'tibor bering: founder muammoni QAYERDAN topgan?</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FRUSTS.map(f => { const on = seen.has(f.id); return (
                <button key={f.id} className={`plink ${active === f.id ? 'plink-on' : ''}`} onClick={() => tap(f.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{f.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{f.name}</span><br /><span className="small" style={{ color: T.ink2 }}>{f.sub}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">hikoya</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.name}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.6 }}>{cur.story}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Eksponatni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uchchalasida ham bitta naqsh: muammo <b>uzoqdan qidirilmagan</b> — founder uni O'ZI his qilgan yoki YAQINIDA kuzatgan. Sizning ov maydoningiz ham shu yerda: o'z kuningiz va atrofingiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — RADAR: 4 SIGNAL =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SIGNALS.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= SIGNALS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? SIGNALS.find(s => s.id === active) : null;
  return (
    <Stage eyebrow="Radar signallari" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${SIGNALS.length} signalni o'rganing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Muammo radari: <span className="italic" style={{ color: T.accent }}>4 signal</span></h2></div>
        <Mentor>Muammo o'zini «men muammoman» deb tanishtirmaydi — u signal beradi. 4 signalni o'rganing; bittasi boshqalaridan qimmatroq.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SIGNALS.map(s => { const on = seen.has(s.id); return (
                <button key={s.id} className="lens-btn" style={active === s.id ? { boxShadow: `inset 0 0 0 2px ${s.color}`, background: s.soft } : undefined} onClick={() => tap(s.id)}>
                  <span style={{ fontSize: 17 }}>{s.emoji}</span>
                  <span className="lens-lbl" style={{ color: on ? s.color : T.ink }}>{s.label}</span>
                  {s.id === 'sig2' && <span className="mono" style={{ fontSize: 9, fontWeight: 800, color: T.honey, marginLeft: 4 }}>OLTIN</span>}
                  {on && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(14)}</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.emoji} {cur.label}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Signalni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Eng kuchli signal — <b>workaround</b>: odam allaqachon o'zicha yechim yasagan bo'lsa, muammo real va og'riqli ekani ISBOTLANGAN. Sizga faqat yaxshiroq yechim qurish qoladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Sotuvchi buyurtmalarni daftarga yozib, kechqurun Excel'ga ko'chiradi. Bu nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sotuvchi daftarga yozib, keyin Excel'ga <span className="italic" style={{ color: T.accent }}>ko'chiradi</span>. Bu nima?</h2></>}
    options={['U shunchaki eski usulni yaxshi ko\'radi', 'Workaround — real muammoning eng kuchli signali', 'Oddiy ish tartibi, signal emas', 'Uning kompyuteri sekin ishlaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Odam ikki marta ish qilyapti — o'zicha «tizim» yasagan. Bu workaround: muammo shu qadar og'riqliki, u allaqachon harakat qilgan. Yaxshiroq yechim taklif qilsangiz — o'tadi."
    explainWrong={{ 0: 'Hech kim ishni IKKI MARTA qilishni yaxshi ko\'rmaydi — bu majburiyat.', 2: '«Oddiy tartib» ko\'ringan narsalar ichida eng ko\'p oltin yotadi.', 3: 'Kompyuter emas — jarayon og\'riqli. Signalni o\'qing.', default: 'Ikki marta ish = workaround = oltin signal.' }} />
);

// ===== SCREEN 5 — OV JOYLARI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(HUNTSPOTS.map(h => h.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= HUNTSPOTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? HUNTSPOTS.find(h => h.id === active) : null;
  return (
    <Stage eyebrow="Ov joylari" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${HUNTSPOTS.length} joyni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qayerda <span className="italic" style={{ color: T.accent }}>ov qilinadi?</span></h2></div>
        <Mentor>Muammolar 5 ta joyda to'planadi. Har birini oching — ertaga aynan shu joylardan ov qilasiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HUNTSPOTS.map(h => { const on = seen.has(h.id); return (
                <button key={h.id} className={`plink ${active === h.id ? 'plink-on' : ''}`} onClick={() => tap(h.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{h.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{h.name}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ochish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ fontSize: 20 }}>{cur.ic}</span><span className="sk-wordbadge">{cur.name}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Ov joyini bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Diqqat qiling: hech bir joyda «g'oya o'ylab topish» yo'q. Founder g'oyani <b>o'ylab topmaydi</b> — u og'riqni <b>topadi</b>. G'oya og'riqdan o'zi chiqadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Ov uchun qaysi otziv eng qimmatli?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi otziv — <span className="italic" style={{ color: T.accent }}>oltin</span>?</h2></>}
    options={['★★★★★ «Ajoyib ilova, hammaga tavsiya qilaman!»', '★★☆☆☆ «Yaxshi-yu, lekin eksport yo\'q — har safar qo\'lda ko\'chiraman»', '★★★★☆ «Dizayni juda chiroyli»', '★★★☆☆ «Normal»']} correctIdx={1}
    explainCorrect="To'g'ri! Past baho + ANIQ sabab + workaround («qo'lda ko'chiraman») — uchala signal bitta otzivda. Bunday otzivlar tayyor muammo ro'yxati."
    explainWrong={{ 0: 'Maqtov yoqimli, lekin ov uchun ma\'lumot bermaydi.', 2: 'Dizayn bahosi — og\'riq haqida hech narsa demaydi.', 3: '«Normal» — eng bo\'sh otziv: na og\'riq, na sabab.', default: 'Past baho + aniq sabab = oltin.' }} />
);

// ===== SCREEN 6 — "MALIKA KUNI" RADAR O'YINI (SIGNATURE 1) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(MOMENTS.map(m => [m.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = MOMENTS.filter(m => state[m.id]?.ok).length;
  const done = okCount >= MOMENTS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (m, asProblem) => {
    if (state[m.id]?.ok) return;
    const ok = asProblem === m.isProblem;
    setState(prev => ({ ...prev, [m.id]: { ok, wrong: !ok } }));
    setLast({ id: m.id, ok, why: m.why, isProblem: m.isProblem });
  };
  return (
    <Stage eyebrow="Radar mashqi · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kunni skanerlang (${okCount}/${MOMENTS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Malikaning kuni: <span className="italic" style={{ color: T.accent }}>radarni yoqing</span></h2></div>
        <Mentor>Mana oddiy o'quvchi kuni — 8 lahza. Har lahzaga qaror bering: 🎯 muammo signali bormi yoki 😌 oddiy lahzami? 4 signalni eslang!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOMENTS.map(m => {
                const st = state[m.id] || {};
                return (
                  <div key={m.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: T.ink3, minWidth: 34 }}>{m.time}</span>
                    <span className="sort-text">{m.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: m.isProblem ? T.accent : T.success }}>{m.isProblem ? '🎯 muammo' : '😌 oddiy'}</span>
                      : <span className="sort-btns"><button className="sort-btn" title="Muammo signali" onClick={() => pick(m, true)}>🎯</button><button className="sort-btn" title="Oddiy lahza" onClick={() => pick(m, false)}>😌</button></span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><span className="flow-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="radar" /> Radar skaneri</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{MOMENTS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / MOMENTS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ Radar ishladi!' : '✗ Signalni qayta tekshiring'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Belgilar: takror g\'ijinish? workaround? vaqt ketishi? voz kechish? Agar hech biri yo\'q — bu oddiy lahza.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Lahzadagi 🎯 yoki 😌 ni bosing — radar izohi shu yerda chiqadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta oddiy kundan <b>5 ta real muammo</b> chiqdi! Malika ularni sezmaydi ham — o'rganib qolgan. Founder farqi shu: boshqalar o'rganib qolgan narsani U savol qilib ko'radi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — BAHOLASH MATRITSASI =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(QUADS.map(q => q.id)) : new Set());
  const [active, setActive] = useState(null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= QUADS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? QUADS.find(q => q.id === active) : null;
  const order = ['wait', 'gold', 'forget', 'watch']; // 2x2: yuqori chap, yuqori o'ng, past chap, past o'ng
  return (
    <Stage eyebrow="Baholash matritsasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/${QUADS.length} kvadrantni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hamma muammo teng emas: <span className="italic" style={{ color: T.accent }}>chastota × og'riq</span></h2></div>
        <Mentor>Ovlagan muammoni ikki savol bilan baholaymiz: QANCHALIK TEZ-TEZ bo'ladi? QANCHALIK OG'RITADI? Har kvadrantni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1">
              <p className="mono small" style={{ margin: '0 0 6px', color: T.ink2, textAlign: 'center' }}>↑ OG'RIQ KUCHLI</p>
              <div className="quad-grid">
                {order.map(id => { const q = QUADS.find(x => x.id === id); const on = seen.has(id); return (
                  <button key={id} className="quad-cell" style={{ background: on ? q.soft : T.paper, boxShadow: active === id ? `inset 0 0 0 2px ${q.color}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }} onClick={() => tap(id)}>
                    <span style={{ fontSize: 22 }}>{q.emoji}</span>
                    <span className="quad-name" style={{ color: q.color === T.ink3 ? T.ink2 : q.color }}>{q.name}</span>
                    <span className="quad-pos">{q.pos}</span>
                    {on && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(12)}</span>}
                  </button>
                ); })}
              </div>
              <p className="mono small" style={{ margin: '6px 0 0', color: T.ink2, textAlign: 'center' }}>← KAMDAN-KAM · HAR KUNI →</p>
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-wordbadge" style={{ color: cur.color === T.ink3 ? T.ink2 : cur.color, background: cur.soft }}>{cur.emoji} {cur.name} · {cur.pos}</span><p style={{ fontFamily: G, fontSize: 'clamp(13.5px,1.8vw,15px)', color: T.ink, margin: '12px 0 0', lineHeight: 1.55 }}>{cur.d}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kvadrantni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula oddiy: <b>ball = chastota × og'riq</b>. Yakuniy ovda har muammoga shu ikki bahoni berasiz — va 🔥 oltin konlar o'zi yuzaga chiqadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MATRITSA O'YINI (SIGNATURE 2) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(MQUIZ.map(q => [q.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = MQUIZ.filter(q => state[q.id]?.ok).length;
  const done = okCount >= MQUIZ.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (q, ans) => {
    if (state[q.id]?.ok) return;
    const ok = ans === q.ans;
    setState(prev => ({ ...prev, [q.id]: { ok, wrong: !ok } }));
    setLast({ id: q.id, ok, why: q.why, ans: q.ans });
  };
  return (
    <Stage eyebrow="Matritsa · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Baholang (${okCount}/${MQUIZ.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu muammolar <span className="italic" style={{ color: T.accent }}>qaysi kvadrantda?</span></h2></div>
        <Mentor>Har muammoni baholang: 🔥 oltin kon · 💎 kutuvchi · ⚠️ kuzatuvdagi · 🗑️ unut. Ikki savol: qancha tez-tez? qancha og'ritadi?</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MQUIZ.map(q => {
                const st = state[q.id] || {};
                return (
                  <div key={q.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{q.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: QMAP[q.ans].color === T.ink3 ? T.ink2 : QMAP[q.ans].color }}>{QMAP[q.ans].emoji} {QMAP[q.ans].name}</span>
                      : <span className="sort-btns">{['gold', 'wait', 'watch', 'forget'].map(a => (<button key={a} className="sort-btn" title={QMAP[a].name} onClick={() => pick(q, a)}>{QMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? '✓ To\'g\'ri baholadingiz!' : '✗ Qayta baholang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Ikki o\'qni alohida tekshiring: bu HAR KUNImi yoki kamdan-kammi? KUCHLI og\'ritadimi yoki shunchaki noqulaymi?'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Muammo kartasidagi kvadrant belgisini bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Payqadingizmi: 🔥 ikkala oltin kon ham <b>«har kuni + asab»</b> kombinatsiyasi. MVP uchun doim shu kvadrantdan boshlanadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Qaysi muammo mahsulot qurishga eng arziydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi muammo <span className="italic" style={{ color: T.accent }}>mahsulotga arziydi</span>?</h2></>}
    options={['Kamdan-kam uchraydigan, yengil muammo', 'Har kuni takrorlanadigan, kuchli og\'riqli muammo', 'Faqat bitta odamda bo\'lgan g\'alati muammo', 'Hech kim sezmaydigan nazariy muammo']} correctIdx={1}
    explainCorrect="To'g'ri! Chastota × og'riq ikkalasi ham yuqori — oltin kon. Odam bunday muammo yechimiga vaqt, e'tibor va pul beradi."
    explainWrong={{ 0: 'Kam + yengil = 🗑️ unut kvadranti.', 2: 'Bitta odam — bozor emas. Keyingi darsda buni tekshirishni o\'rganamiz.', 3: 'Nazariy og\'riq uchun hech kim to\'lamaydi.', default: 'Har kuni + kuchli = oltin.' }} />
);

// ===== SCREEN 10 — MUAMMO TA'RIFI: KIM + QACHON + OG'RIQ =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(FORM_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = FORM_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= FORM_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Muammo ta'rifi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ta'rifni tuzating (${okCount}/${FORM_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Muammo qanday yoziladi: <span className="italic" style={{ color: T.accent }}>KIM + QACHON + OG'RIQ</span></h2></div>
        <Mentor>«Hammasi yomon» — muammo emas, nolish. Ov varag'iga yozishdan oldin formulani o'rganamiz: har xom fikrga to'g'ri ta'rifni tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FORM_DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Uchala qism bormi: aniq KIM, aniq QACHON (vaziyat), o'lchanadigan OG'RIQ?</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula qo'lda! <b>KIM + QACHON + OG'RIQ</b> — shu uchligi bo'lsa, muammo ustida ishlash mumkin. Ov varag'ida ham xuddi shunday yozasiz.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — JTBD KO'PRIGI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(JOB_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = JOB_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= JOB_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="JTBD ko'prigi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Jobni toping (${okCount}/${JOB_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'tgan dars bilan ko'prik: <span className="italic" style={{ color: T.accent }}>muammo = yomon bajarilgan job</span></h2></div>
        <Mentor>Har muammoning ortida bajarilmayotgan JOB yotadi. Muammoni toping → jobni aniqlang → yechim o'zi ko'rinadi. Har muammoga to'g'ri jobni tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {JOB_DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Job — odam XOHLAGAN natija, yechim usuli emas.</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zanjir tayyor: <b>signal → muammo → job → (keyin) yechim</b>. Keyingi darslarda bu zanjirning davomini quramiz.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Yaxshi muammo ta'rifida nima bo'lishi shart?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi muammo <span className="italic" style={{ color: T.accent }}>ta'rifida</span> nima bo'ladi?</h2></>}
    options={['Chiroyli shior va katta so\'zlar', 'KIM (aniq odam) + QACHON (vaziyat) + OG\'RIQ (o\'lchanadigan)', 'Tayyor yechim va texnologiya nomi', '«Hamma», «doim», «hamma narsa» so\'zlari']} correctIdx={1}
    explainCorrect="To'g'ri! Uch qism: aniq KIM, aniq VAZIYAT, o'lchanadigan OG'RIQ. «O'quvchilar har kuni ertalab avtobusni bilmay 20 daqiqa kutadi» — ideal ta'rif."
    explainWrong={{ 0: 'Shior — marketing; ta\'rif — aniqlik.', 2: 'Yechim keyin! Avval og\'riq. Yechimdan boshlagan — SuperApp yo\'liga kiradi.', 3: '«Hamma/doim» — umumlashtirish belgisi, aniqlikning dushmani.', default: 'KIM + QACHON + OG\'RIQ.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #3 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Zo\'r muammo! Darrov ilova qurishni boshla»' },
    { id: 1, t: '«Bu hali nolish, muammo emas: KIM aynan? QACHON? Qaysi OG\'RIQ? Avval toraytir — keyin kuzat»' },
    { id: 2, t: '«Odamlar sport qilmasa — o\'zlariga. Boshqa muammo top»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz endi <span className="italic" style={{ color: T.accent }}>muammo topdi</span>. Yoki yo'qmi?</h2></div>
        <Mentor>Aziz JTBD darsini o'tdi va yugurib keldi. Uning «muammosi»ni radar bilan tekshiring.</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«Topdim! Mana muammo: ODAMLAR SPORT QILMAYDI. Millionlab odam! Endi shu muammoga super-ilova quraman — hamma sport qiladigan bo'ladi!»</p>
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
            ? '«Odamlar sport qilmaydi» — bu KIM+QACHON+OG\'RIQsiz umumlashtirish. Toraytirilgan varianti masalan: «9-sinf o\'quvchilari (KIM) darsdan keyin (QACHON) charchoq va reja yo\'qligidan mashqni 2-haftada tashlab yuboradi (OG\'RIQ)». Endi buni kuzatish va tekshirish mumkin.'
            : (picked === 0 ? '«Millionlab odam» — bu bozor emas, tuman. Bunday keng «muammo»ga qurilgan ilova hech kimga tegmaydi.' : 'Muammoning o\'zi yaxshi yo\'nalish — faqat xom. Tashlamang, TORAYTIRING.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Ovga! →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Ovchi qoidasi: <span className="italic" style={{ color: T.accent }}>g'oya o'ylab topilmaydi — og'riq topiladi</span></h2></div>
      <Mentor>Ovdan oldin kompasni tekshiring. 4 qoida — va varaq sizniki.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🏹</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Siz — ovchi</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Radar yoqilgan. Endi 10 ta o'lja kerak.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.eye(18), c: T.accent, t: 'RADAR — 4 signal: takror g\'ijinish, workaround, vaqt, voz kechish' }, { ic: Ico.target(18), c: T.honey, t: 'OV JOYLARI — o\'z kuningiz, oila, 1-2⭐ otziv, forum, kasb egalari' }, { ic: Ico.repeat(18), c: T.blue, t: 'MATRITSA — ball = chastota × og\'riq; nishon = 🔥 oltin kon' }, { ic: Ico.flag(18), c: T.success, t: 'TA\'RIF — KIM + QACHON + OG\'RIQ; «hamma/doim» — taqiqlangan' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: 10 MUAMMO OVI =====
const emptyHunt = () => Array.from({ length: 10 }, () => ({ text: '', f: 0, p: 0 }));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(() => storedAnswer?.data || emptyHunt());
  const isComplete = (r) => r.text.trim().length >= 6;
  const completeCount = rows.filter(isComplete).length;
  const passed = completeCount >= 10;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      const items = rows.filter(isComplete).map(r => ({ text: r.text.trim(), freq: r.f + 1, pain: r.p + 1, score: (r.f + 1) * (r.p + 1) }));
      onAnswer(screen, { correct: true, data: rows, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson95_problems', { title: '10 muammo ovi + baho', items, savedAt: Date.now() });
      savePortfolioSection('badge_problem_hunter', { earned: true, badge: 'Muammo Ovchisi', lesson: 95, at: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (i, patch) => setRows(prev => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const inputStyle = { flex: 1, fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box', minWidth: 0 };
  const ranked = rows.map((r, i) => ({ ...r, i, score: (r.f + 1) * (r.p + 1) })).filter(isComplete).sort((a, b) => b.score - a.score);
  const topScore = ranked.length ? ranked[0].score : 0;
  const docRows = ranked.slice(0, 10).map(r => ({ label: r.text.trim().slice(0, 44) + (r.text.trim().length > 44 ? '…' : ''), text: `${FREQ[r.f]} · ${PAIN[r.p]} · ball: ${r.score}`, color: r.score >= 6 ? T.accent : (r.score >= 3 ? T.honey : T.blue), top: r.score === topScore && r.score >= 6 }));
  return (
    <Stage eyebrow="Yakuniy ish · OV" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Nishonni olish →' : `Ovlang (${completeCount}/10)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Katta ov: <span className="italic" style={{ color: T.accent }}>10 muammo + baho</span></h2></div>
        <Mentor>Har qatorga bitta muammo (KIM + QACHON + OG'RIQ uslubida) yozing, so'ng ⚡ chastota va 🔥 og'riqni bosib baholang — belgilar aylanib o'zgaradi. Maslahatlar har qatorda. 10/10 — va 🏹 nishon sizniki!</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="radar" /> Ov varag'i</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: passed ? T.success : T.accent }}>{completeCount}/10</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(completeCount / 10) * 100}%` }} /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {rows.map((r, i) => { const ok = isComplete(r); return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.paper, borderRadius: 10, padding: '7px 8px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -7px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: ok ? T.success : T.ink3, minWidth: 16, textAlign: 'right' }}>{i + 1}</span>
                  <input value={r.text} onChange={e => upd(i, { text: e.target.value })} placeholder={HUNT_HINTS[i]} style={inputStyle} />
                  <button className="cyc" onClick={() => upd(i, { f: (r.f + 1) % 3 })} title="Chastota">{FREQ[r.f].split(' ')[0]}</button>
                  <button className="cyc" onClick={() => upd(i, { p: (r.p + 1) % 3 })} title="Og'riq">{PAIN[r.p].split(' ')[0]}</button>
                </div>
              ); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Ov reytingi (ball bo'yicha)</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>Ovlang — reyting shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><HuntDoc rows={docRows} />{passed && <span className="seal">OV YOPILDI ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>10/10! Reytingdagi 🏆 — sizning eng kuchli nomzodingiz. Keyingi darsda aynan shu muammolarni <b>real odamlar bilan tekshirishni</b> o'rganasiz (custdev). Endi — nishon marosimi!</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN + NISHON MAROSIMI =====
const BADGES = [
  { t: 'Muammo Ovchisi', l: 'QO\'LGA KIRITILDI' },
  { t: 'Tadqiqotchi', l: '97-dars' },
  { t: 'Quruvchi', l: '103-dars' },
  { t: 'Sinovchi', l: '104-dars' },
  { t: 'Founder', l: 'Demo Day' }
];
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Radar 4 signali: takror g\'ijinish, workaround (oltin!), vaqt, voz kechish', 'Ov joylari: o\'z kuningiz, oila, 1-2⭐ otziv, forum, kasb egalari', 'Ball = chastota × og\'riq; nishon — 🔥 oltin kon kvadranti', 'Ta\'rif: KIM + QACHON + OG\'RIQ; «hamma/doim» taqiqlangan'];
  const GLOSSARY = [{ b: 'Workaround', t: '— odam o\'zicha yasagan yamoq-yechim (eng oltin signal)' }, { b: 'Chastota', t: '— muammo qanchalik tez-tez takrorlanadi' }, { b: 'Og\'riq', t: '— muammo qanchalik qattiq bezovta qiladi' }, { b: 'Oltin kon', t: '— har kuni × kuchli kvadranti' }, { b: 'Muammo ta\'rifi', t: '— KIM + QACHON + OG\'RIQ formulasi' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Kashf bosqichi tugadi · 3/3" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 5.7 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 9) * 0.15}s` }} />))}</div>}
        <div className="medal-strip fade-up">
          <div className="medal">🏹</div>
          <div style={{ minWidth: 0 }}>
            <p className="mono small" style={{ margin: 0, color: T.honey, fontWeight: 800, letterSpacing: '0.14em' }}>BIRINCHI NISHON QO'LGA KIRITILDI</p>
            <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: '2px 0 0', color: T.ink, fontSize: 'clamp(17px,2.4vw,22px)' }}>Muammo Ovchisi</p>
            <p className="small" style={{ margin: '2px 0 0', color: T.ink2 }}>10 muammo ovlandi va baholandi — Kashf bosqichi yakunlandi.</p>
          </div>
        </div>
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up d1"><span className="tick">{Ico.rocket(12)}</span> 3-dars tamom</span><h2 className="title h-title fade-up d1">Radar <span className="italic" style={{ color: T.accent }}>doim yoniq</span> qoladi.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Endi siz dunyoni founder ko\'zi bilan skanerlaysiz: signal → muammo → baho → job. Ov varag\'ingiz keyingi darslarning xomashyosi bo\'ladi.' : 'Yaxshi harakat! Radar signallarini mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i === 0 ? 'badge-done' : ''} ${i === 1 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🔜' : '🔒')} {b.t}<span className="badge-when" style={i === 0 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi nishon — <b style={{ color: T.honey }}>Tadqiqotchi</b>: 97-darsda 5 real intervyu o'tkazsangiz.</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>🏹</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — ov davom etadi</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Varag'ingizga yana 5 muammo qo'shing — eng zo'ri kutilmagan joydan chiqadi (oiladagi nonushta suhbatini eshiting!). Keyingi dars: bu muammolarni ODAMLAR bilan qanday tekshirish — custdev savollari.</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson28({ lang: langProp, onFinished }) {
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

        /* === RADAR SPINNER === */
        .radar { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid ${T.honey}; position: relative; overflow: hidden; display: inline-block; flex-shrink: 0; }
        .radar::after { content: ''; position: absolute; left: 50%; top: 0; width: 50%; height: 50%; background: conic-gradient(from 0deg, rgba(224,137,43,0.95), transparent 100deg); transform-origin: 0% 100%; animation: radar-spin 2s linear infinite; }
        @keyframes radar-spin { to { transform: rotate(360deg); } }

        /* === KVADRANT GRID (s7) === */
        .quad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .quad-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; border: none; border-radius: 13px; padding: 14px 8px; cursor: pointer; transition: all 0.18s; }
        .quad-cell:hover { transform: translateY(-1px); }
        .quad-name { font-family: 'Manrope'; font-weight: 800; font-size: 11.5px; letter-spacing: 0.04em; }
        .quad-pos { font-family: 'JetBrains Mono'; font-size: 9px; color: ${T.ink3}; }

        /* === SARALASH === */
        .sort-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 13px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); transition: all 0.2s; }
        .sort-ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .sort-text { flex: 1; font-family: Georgia, serif; font-size: clamp(12.5px,1.6vw,13.5px); color: ${T.ink}; line-height: 1.4; }
        .sort-btns { display: inline-flex; gap: 5px; flex-shrink: 0; }
        .sort-btn { width: 32px; height: 30px; border: none; border-radius: 9px; background: ${T.bg}; font-size: 14px; cursor: pointer; transition: all 0.15s; }
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

        /* === CYCLE CHIP (s15) === */
        .cyc { border: none; border-radius: 8px; background: ${T.bg}; font-size: 11px; padding: 7px 7px; cursor: pointer; transition: all 0.15s; flex-shrink: 0; line-height: 1; }
        .cyc:hover { transform: translateY(-1px); background: ${T.honeySoft}; }

        /* === MUHR === */
        .seal { position: absolute; bottom: 10px; right: 12px; padding: 5px 11px; border: 2.5px solid ${T.success}; border-radius: 8px; color: ${T.success}; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; transform: rotate(-7deg); background: rgba(255,255,255,0.78); animation: stamp-in 0.5s cubic-bezier(.2,.9,.3,1.4) 0.15s both; }

        /* === KONFETTI === */
        .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
        .cf { position: absolute; top: -14px; width: 8px; height: 13px; border-radius: 2px; opacity: 0; animation: cf-fall 2.8s ease-in forwards; }
        @keyframes cf-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(76vh) rotate(560deg); opacity: 0; } }

        /* === MEDAL MAROSIMI (s16) === */
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
