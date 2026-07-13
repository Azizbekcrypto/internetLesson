import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// MODUL 10 · KOD/PM — ANALITIKA BIRINCHI KUNDAN — v16 (AUDIOSIZ)
// G'oya: MVP'ni ko'zoynak bilan qur — asboblarsiz uchish = ko'r-ko'rona.
// Hook: "yuklab olish" tuzog'i (maqtanchoq raqam) — samolyot quladi, o'lchagich yashil edi.
// Signature 1: Maqtanchoq 🎈 vs Harakatli 💎 saralash (8 metrika).
// Signature 2: Hodisa (event) tanlash o'yini (kuzatamiz / keyin / shovqin).
// Signature 3: Jonli dashboard (Plausible/Umami uslubida) — voronka + teshik chelak 🪣.
// Real misollar: Facebook «7 do'st 10 kunda», Plausible/Umami, Eric Ries vanity metrics.
// Yakuniy ish: ANALITIKA REJASI — portfolio 8-sahifa (Shimoliy yulduz + 3 hodisa + aktivatsiya).
// Davomiylik: avtobus-tracker mahsuloti (98-99 darslardan); Aziz case #7.
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
  chart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 20V4" /><path d="M4 20h16" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="14" width="3" height="3" /></svg>),
  star: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.8 1.1-6L3.4 9.4l6-.8z" /></svg>),
  eye: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>),
  bell: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>),
  gauge: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 14l4-4" /><path d="M4.5 18a9 9 0 1 1 15 0" /><circle cx="12" cy="14" r="1.4" /></svg>),
  target: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>),
  layers: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>)
};

const LESSON_META = { lessonId: 'pm-analytics-32-v16', lessonTitle: { uz: 'Analitika birinchi kundan — ko\'zoynak kiyish', ru: 'Аналитика с первого дня' } };
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
// 99-darsdan mahsulot nomini o'qib olamiz (davomiylik uchun)
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
// s2 — Maqtanchoq vs Harakatli muzeyi (juftliklar)
const METRIC_PAIRS = [
  { id: 'm1', vic: '📥', vlabel: '5 000 yuklab olish', gic: '🔁', glabel: '9% ertasi kuni qaytdi',
    v: '«5000 yuklab olindi!» — ajoyib sarlavha. Lekin yuklash = bir marta bosish. Ertasi kuni qancha odam QAYTDI? Balki 50 ta. Yuklash — havodagi shar: katta ko\'rinadi, ushlab bo\'lmaydi.',
    g: 'Ertasi kuni qaytganlar ulushi (day-2 retention). Bu — «mahsulot yashaydimi?» degan savolning javobi. Kichik raqam, lekin OG\'IR: butun qaror shundan chiqadi.' },
  { id: 'm2', vic: '❤️', vlabel: '10 000 layk', gic: '✅', glabel: 'Core jobni 2+ marta bajarganlar 34%',
    v: 'Layklar yoqimli, lekin harakatga aylanmasa — bezak. Layk bosgan 10 000 kishidan nechtasi mahsulotni ISHLATDI? Ehtimol, ozchiligi.',
    g: 'Core jobni takror bajarganlar. Takror = qiymat topdi = odat shakllanmoqda. Mahsulotni haqiqatan boshqaradigan raqam shu.' },
  { id: 'm3', vic: '⭐', vlabel: 'App Store reyting 4.8', gic: '📈', glabel: 'Faol foydalanuvchi haftada +12%',
    v: 'Yuqori reyting — 20 kishi baho bergan bo\'lishi mumkin, yarmi tanishlaringiz. O\'rtacha yulduz qaror uchun deyarli foydasiz: nima yaxshilanishini aytmaydi.',
    g: 'Har hafta qancha odam qaytib ishlatyapti — o\'sish trendi. Trend yolg\'on gapirmaydi: o\'symoqdami yoki so\'nayaptimi? Mana bu harakat uchun.' }
];

// s3 — Saralash o'yini (SIGNATURE 1): 8 metrika
const SORT_METRICS = [
  { id: 'g1', t: 'Umumiy yuklab olishlar soni', ans: 'vanity', why: 'Bir martalik bosish; qaytishni ko\'rsatmaydi. Klassik maqtanchoq raqam.' },
  { id: 'g2', t: 'Ertasi kuni qaytganlar ulushi (retention)', ans: 'action', why: '«Mahsulot yashaydimi?» savolining javobi. Eng harakatli raqamlardan biri.' },
  { id: 'g3', t: 'Instagramdagi obunachilar soni', ans: 'vanity', why: 'Mahsulotni ISHLATISHNI o\'lchamaydi. Chiroyli, lekin qarorsiz.' },
  { id: 'g4', t: 'Avtobusni haftada 3+ marta tekshirganlar', ans: 'action', why: 'Odat + core qiymat. To\'g\'ridan-to\'g\'ri Shimoliy yulduzga bog\'liq.' },
  { id: 'g5', t: 'Sahifa ko\'rishlar soni (page views)', ans: 'vanity', why: 'Ko\'p ko\'rish ≠ qiymat. Odam adashib aylanayotgan ham bo\'lishi mumkin.' },
  { id: 'g6', t: 'Eslatmani yoqqanlar ulushi', ans: 'action', why: 'Aktivatsiya signali: eslatma yoqqan odam ~5× ko\'proq qaytadi.' },
  { id: 'g7', t: 'App Store o\'rtacha yulduzi', ans: 'vanity', why: 'Kam sonli baho, ko\'pi tanishlar. Qaror uchun zaif signal.' },
  { id: 'g8', t: 'Ochgandan so\'ng avtobusni tekshirganlar % (konversiya)', ans: 'action', why: 'Voronka konversiyasi: kelgan odam qiymat oldimi? Nisbat — solishtiriladi.' }
];
const SMAP = { vanity: { emoji: '🎈', label: 'MAQTANCHOQ', color: T.honey }, action: { emoji: '💎', label: 'HARAKATLI', color: T.success } };

// s5 — Shimoliy yulduz nomzodlari
const NORTHSTAR = [
  { id: 'n1', ic: '📥', label: 'Umumiy ro\'yxatdan o\'tganlar', verdict: 'no', d: 'Bir marta o\'sadi va to\'xtaydi. Odam mahsulotni tashlab ketsa ham bu raqam kamaymaydi — ya\'ni mahsulot o\'lса ham «yashil» ko\'rinadi. Bu yulduz emas, maqtanchoq raqam.' },
  { id: 'n2', ic: '👀', label: 'Sahifa ko\'rishlar soni', verdict: 'no', d: 'Qiymatga bog\'liq emas: odam adashib ko\'p sahifa ochishi mumkin. Ko\'rish ≠ foyda. Bu ham yulduzligiga da\'vogar emas.' },
  { id: 'n3', ic: '⭐', label: 'Haftada 3+ marta avtobus tekshirgan foydalanuvchilar', verdict: 'yes', d: 'MANA U! Bitta raqamda hammasi jam: odam BOR (foydalanuvchi), qiymat OLDI (tekshirdi), ODAT bo\'ldi (3+ marta). O\'ssa — biznes sog\'lom; tushsa — muammo bor. Butun jamoa aynan shuni o\'stiradi.' }
];

// s7 — Hodisa (event) tanlash o'yini (SIGNATURE 2)
const EVENTS = [
  { id: 'e1', t: 'sahifa_ochildi — kimdir MVP\'ni ochdi', ans: 'do', why: 'Voronkaning tepasi. Nechtadan boshlanadi — bilishimiz shart, aks holda konversiyani hisoblab bo\'lmaydi.' },
  { id: 'e2', t: 'avtobus_tekshirildi — CORE JOB bajarildi', ans: 'do', why: 'Bu — qiymat lahzasi. Eng muhim hodisa: mahsulot haqiqatan ish berdimi?' },
  { id: 'e3', t: 'eslatma_yoqildi — aktivatsiya nomzodi', ans: 'do', why: 'Yoqqanlar ko\'proq qaytadi. Aktivatsiyani topish uchun kuzatilishi shart.' },
  { id: 'e4', t: 'ertasi_qaytdi — retention', ans: 'do', why: '«Mahsulot yashaydimi?» — Shimoliy yulduzning yuragi. Albatta yozamiz.' },
  { id: 'e5', t: 'dark_mode_yoqildi', ans: 'later', why: 'Qiziq bo\'lishi mumkin, lekin core jobga aloqasi yo\'q. Keyin — kerak bo\'lsa.' },
  { id: 'e6', t: 'har_scroll_pikseli yozib boriladi', ans: 'no', why: 'Shovqin: ma\'lumot ummoni, insayt nol. Tahlilni ko\'mib tashlaydi.' },
  { id: 'e7', t: 'sichqoncha_koordinatalari (har harakat)', ans: 'no', why: 'Maxfiylik xavfi + shovqin. Odamlarga hurmat: faqat kerakli hodisa.' },
  { id: 'e8', t: 'tugma_rangi_ko\'rildi', ans: 'no', why: 'Hech qanday qaror bunga bog\'liq emas. Yozishning ma\'nosi yo\'q.' }
];
const EMAP = { do: { emoji: '✅', label: 'KUZATAMIZ', color: T.success }, later: { emoji: '⏳', label: 'KEYIN', color: T.honey }, no: { emoji: '❌', label: 'SHOVQIN', color: T.accent } };

// s6 — jonli hodisa lentasi (namuna)
const FEED = [
  { ev: 'sahifa_ochildi', meta: 'route: 12' },
  { ev: 'avtobus_tekshirildi', meta: 'kutish: 7 daq' },
  { ev: 'eslatma_yoqildi', meta: 'user: #A81' },
  { ev: 'avtobus_tekshirildi', meta: 'route: 12' },
  { ev: 'ertasi_qaytdi', meta: 'user: #A81' }
];

// s10 — voronka (SIGNATURE 3). Eng katta tushish: 620 → 210 (eslatma bosqichi)
const FUNNEL = [
  { id: 'f1', label: 'MVP ochildi', ev: 'sahifa_ochildi', n: 1000, color: T.blue },
  { id: 'f2', label: 'Avtobus tekshirildi (CORE)', ev: 'avtobus_tekshirildi', n: 620, color: T.grape },
  { id: 'f3', label: 'Eslatma yoqildi', ev: 'eslatma_yoqildi', n: 210, color: T.honey },
  { id: 'f4', label: 'Ertasi kuni qaytdi', ev: 'ertasi_qaytdi', n: 95, color: T.success }
];
const LEAK_ID = 'f3'; // 620 → 210: eng katta tushish (66%)

// s11 — dashboard o'qish drilli
const READ_DRILL = [
  { id: 'd1', label: '1000 ochdi, lekin ertasi kuni atigi 95 (9%) qaytdi', emoji: '🪣', color: T.blue,
    opts: ['Ko\'proq reklama berish — 1000 ni 5000 qilish', 'Teshik ochilishда emas — QAYTISHda; avval retention\'ni tuzat, keyin reklama', 'Ilovani yopib boshqa g\'oya qidirish'],
    correct: 1, why: 'Teshik chelakka ko\'proq suv quyish — behuda. Avval teshikni yoping: nega qaytmayapti? Retention tuzalmasa, reklama pulni yoqadi.' },
  { id: 'd2', label: 'Eslatma yoqqanlar 5× ko\'proq qaytadi', emoji: '🔔', color: T.honey,
    opts: ['Hammani majburan obuna qilish', 'Eslatma yoqishni birinchi ochishda OSON va tabiiy qilish — aktivatsiyani kuchaytir', 'Eslatmani umuman olib tashlash'],
    correct: 1, why: 'Bu — sehrli raqam: aktivatsiya lahzasi topildi. Majburlash emas — yoqishni oson va foydali qilib, ko\'proq odamni «aha» lahzasiga olib boring.' },
  { id: 'd3', label: '620 tekshirdi, lekin faqat 210 eslatma yoqdi', emoji: '📉', color: T.grape,
    opts: ['Muammo yo\'q, 620 zo\'r-ku', 'Voronkaning shu bosqichida katta tushish bor — nega yarmisi eslatma yoqmaydi? Shu qadamni sodda qil', 'Eslatma tugmasini kattaroq qizil qilish (taxminan)'],
    correct: 1, why: 'Eng katta tushish — eng katta imkoniyat. «Nega tushyapti?» degan savolni bering (kuzating/so\'rang), taxminга emas — dalilga qarab tuzating.' }
];

const STAGES = [
  { n: '01', t: 'Kashf qil', ic: '🔭' },
  { n: '02', t: 'Tekshir', ic: '🎙️' },
  { n: '03', t: 'Qur', ic: '🔧' },
  { n: '04', t: 'Isbot qil', ic: '🏆' }
];

// s15 — Analitika rejasi (portfolio 8-sahifa)
const PLAN_FIELDS = [
  { key: 'northstar', label: 'Shimoliy yulduz metrikasi ⭐', emoji: '⭐', color: T.honey, min: 8, hint: 'Masalan: haftada 3+ marta avtobus tekshirgan foydalanuvchilar soni' },
  { key: 'event1', label: 'Hodisa 1 — CORE JOB', emoji: '✅', color: T.success, min: 4, hint: 'avtobus_tekshirildi' },
  { key: 'event2', label: 'Hodisa 2 — aktivatsiya', emoji: '🔔', color: T.blue, min: 4, hint: 'eslatma_yoqildi' },
  { key: 'event3', label: 'Hodisa 3 — retention', emoji: '🔁', color: T.grape, min: 4, hint: 'ertasi_qaytdi' },
  { key: 'activation', label: 'Aktivatsiya lahzasi («aha!»)', emoji: '💡', color: T.accent, min: 6, hint: 'Birinchi marta avtobus vaqtini ko\'rgan lahza' },
  { key: 'vanity', label: 'E\'TIBOR BERMAYDIGAN maqtanchoq raqam 🎈', emoji: '🎈', color: T.ink2, min: 4, hint: 'Umumiy yuklab olishlar / like' },
  { key: 'tool', label: 'Asbob', emoji: '🛠️', color: T.grape, min: 3, hint: 'Plausible yoki Umami' }
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

// Xavfsiz count-up (rAF timestamp asosida — manfiy qiymat bug'iga qarshi qolip)
const fmtNum = (n) => n.toLocaleString('en-US').replace(/,/g, ' ');
const CountUp = ({ to, dur = 1000, run = true }) => {
  const [val, setVal] = useState(run ? 0 : to);
  useEffect(() => {
    if (!run) { setVal(to); return; }
    let raf, t0 = null;
    const tick = (now) => {
      if (t0 === null) t0 = now;
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const guard = setTimeout(() => { cancelAnimationFrame(raf); setVal(to); }, dur + 400);
    return () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [to, run, dur]);
  return <>{fmtNum(val)}</>;
};

// Analitika rejasi hujjati (s15)
const PlanDoc = ({ rows }) => (
  <div className="deck-doc feat-pop">
    <div className="deck-head"><span style={{ display: 'inline-flex', color: T.accent }}>{Ico.chart(16)}</span><span>Analitika rejasi · 8-sahifa</span></div>
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
          {i === 2 && <span className="arc-you">2/6</span>}
        </div>
        {i < STAGES.length - 1 && <span className="arc-sep">→</span>}
      </React.Fragment>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK: MAQTANCHOQ RAQAM TUZOG'I =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Yana yangi fichalar qo\'shishdi' },
    { id: 'b', label: 'Nechta odam ERTASI KUNI QAYTGANINI ko\'rishdi' },
    { id: 'c', label: 'Ko\'proq reklama berishdi' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Modul 10 · Qur bosqichi" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 900 }}>«5000 yuklab olish!» — <span className="italic" style={{ color: T.accent }}>lekin ilova o'lyapti.</span></h1>
        <Mentor>Arxitektura tayyor (o'tgan dars). Endi qurishdan oldin BITTA narsani o'rnatamiz: ko'zoynak — ya'ni analitika. Aks holda ko'r-ko'rona uchamiz.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
              <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>✈️ KO'R-KO'RONA UCHISH</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>Bir founder MVP'ini chiqardi. Birinchi hafta: <b>«5000 yuklab olish! Top yangi ilova!»</b> — bayram qildi. 🎉</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '10px 0 0', lineHeight: 1.55 }}>Bir oydan keyin — ilova bo'm-bo'sh. Nega? Odamlar bir marta yuklab, ochib, <b>hech qachon qaytmagan</b>. «Yuklab olish» o'lchagichi yashil edi — lekin samolyot allaqachon qulayotgan edi.</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Founder nimaga qarashi kerak edi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">{picked === 'b' ? 'Aynan! ' : ''}<b>«Yuklab olish» — maqtanchoq raqam</b> (vanity metric, — Eric Ries atamasi): chiroyli ko'rinadi, lekin qaror uchun yaroqsiz. Haqiqiy o'lchagich — <b>nechta odam qaytadi</b>. Bugun ko'zoynak yasaymiz: qaysi raqamlar muhim, ularni qanday yig'amiz va dashboardni qanday o'qiymiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS_R = [
    { text: 'Maqtanchoq 🎈 vs Harakatli 💎 saralash', tag: 'o\'yin' },
    { text: 'Shimoliy yulduz metrikasi ⭐: bitta muhim raqam', tag: '' },
    { text: 'Hodisa (event) tanlash: nimani yozamiz?', tag: 'o\'yin' },
    { text: 'Jonli dashboard: voronka + teshik chelak', tag: 'simulyator' },
    { text: 'ANALITIKA REJASI — portfolio 8-sahifa', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi maqsad</p>
      <div className="fade-up frame" style={{ padding: 'clamp(16px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <IcoChip size={50} color={T.blue} soft={T.blueSoft}>{Ico.gauge(26)}</IcoChip>
        <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>MVP'ga ko'zoynak kiydirish</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Birinchi kundan analitika: mahsulot yashaydimi yoki o'lyaptimi — raqamlar aytadi.</p></div>
      </div>
      <ArcStrip />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Qur bosqichi · 2-dars (analitika, keyin AI bilan kod) 🔧</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">Bugungi 5 qadam</p><ol className="roadmap">{STEPS_R.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Analitika: <span className="italic" style={{ color: T.accent }}>ko'r-ko'rona qurmang</span></h2></div>
        <Mentor>Yaxshi founder his-tuyg'u bilan emas — <b style={{ color: T.ink }}>raqam</b> bilan qaror qiladi. Lekin har raqam ham foydali emas: bugun <b style={{ color: T.ink }}>maqtanchoq</b> raqamni <b style={{ color: T.ink }}>harakatli</b> raqamdan ajratamiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — MAQTANCHOQ vs HARAKATLI MUZEYI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(METRIC_PAIRS.map(m => m.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? METRIC_PAIRS[0].id : null);
  const done = seen.size >= METRIC_PAIRS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? METRIC_PAIRS.find(m => m.id === active) : null;
  return (
    <Stage eyebrow="Maqtanchoq vs Harakatli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Juftliklarni oching (${seen.size}/${METRIC_PAIRS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har maqtanchoq raqam ortida <span className="italic" style={{ color: T.accent }}>bitta haqiqiy raqam yashiringan</span></h2></div>
        <Mentor>Chapdagi shar 🎈 — katta va chiroyli. O'ngdagi olmos 💎 — kichik, lekin OG'IR. Har juftlikni oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {METRIC_PAIRS.map(m => { const on = seen.has(m.id); return (
                <button key={m.id} className={`plink ${active === m.id ? 'plink-on' : ''}`} onClick={() => tap(m.id)}>
                  <span className="balloon" style={{ fontSize: 22, minWidth: 26 }}>{m.vic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{m.vlabel}</span></span>
                  {on ? <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span> : <span className="plink-act">ochish</span>}
                </button>
              ); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}>
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
                <div style={{ flex: 1, background: T.honeySoft, borderRadius: 10, padding: '10px 12px' }}><span className="balloon" style={{ fontSize: 26 }}>{cur.vic}</span><p className="flow-label" style={{ margin: '4px 0 0', color: T.honey }}>🎈 Maqtanchoq</p><p style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, color: T.ink, margin: '2px 0 0' }}>{cur.vlabel}</p></div>
                <div style={{ alignSelf: 'center', color: T.ink3, fontSize: 18 }}>→</div>
                <div style={{ flex: 1, background: T.successSoft, borderRadius: 10, padding: '10px 12px' }}><span className="gem pop" style={{ fontSize: 24 }}>{cur.gic}</span><p className="flow-label" style={{ margin: '4px 0 0', color: T.success }}>💎 Harakatli</p><p style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, color: T.ink, margin: '2px 0 0' }}>{cur.glabel}</p></div>
              </div>
              <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink2, margin: '11px 0 0', lineHeight: 1.55 }}>{cur.v}</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,14.5px)', color: T.ink, margin: '8px 0 0', lineHeight: 1.55 }}><b>💎 {cur.g}</b></p>
            </div>) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Juftlikni bosing</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Farq oddiy: maqtanchoq raqam <b>ko'tarilaveradi</b> (yuklab olish faqat ortadi), harakatli raqam esa <b>xatti-harakatni</b> o'lchaydi va tushishi ham mumkin — shuning uchun u sizni ogohlantiradi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — SARALASH O'YINI (SIGNATURE 1) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(SORT_METRICS.map(m => [m.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = SORT_METRICS.filter(m => state[m.id]?.ok).length;
  const done = okCount >= SORT_METRICS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (m, ans) => {
    if (state[m.id]?.ok) return;
    const ok = ans === m.ans;
    setState(prev => ({ ...prev, [m.id]: { ok, wrong: !ok } }));
    setLast({ id: m.id, ok, why: m.why, ans: m.ans });
  };
  return (
    <Stage eyebrow="Saralash · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Saralang (${okCount}/${SORT_METRICS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har metrikani ajrating: <span className="italic" style={{ color: T.accent }}>🎈 maqtanchoq · 💎 harakatli</span></h2></div>
        <Mentor>Bitta savol bering: <b style={{ color: T.ink }}>«Bu raqam o'zgarganda men BOSHQACHA qaror qilaman-mi?»</b> Ha bo'lsa — 💎 harakatli; yo'q bo'lsa — 🎈 maqtanchoq.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SORT_METRICS.map(m => {
                const st = state[m.id] || {};
                return (
                  <div key={m.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text">{m.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: SMAP[m.ans].color }}>{SMAP[m.ans].emoji} {SMAP[m.ans].label}</span>
                      : <span className="sort-btns">{['vanity', 'action'].map(a => (<button key={a} className="sort-btn" title={SMAP[a].label} onClick={() => pick(m, a)}>{SMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">💎 Harakatli topildi</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{SORT_METRICS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / SORT_METRICS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? `✓ ${SMAP[last.ans].emoji} ${SMAP[last.ans].label}` : '✗ Qayta o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Savol: bu raqam o\'zgarsa, qarorim o\'zgaradimi? Ha — 💎 harakatli; yo\'q — 🎈 maqtanchoq.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Metrika yonidagi 🎈 yoki 💎 ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 ta harakatli raqam topdingiz: retention, takror-job, eslatma-ulush, konversiya. Diqqat: hammasi <b>NISBAT/FOIZ</b> — ular solishtiriladi. Maqtanchoq raqamlar esa faqat «katta son».</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Maqtanchoq raqam (vanity metric) nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Maqtanchoq raqam — bu <span className="italic" style={{ color: T.accent }}>qanaqa</span> raqam?</h2></>}
    options={['Katta va chiroyli ko\'rinadi, lekin hech qanday qarorni o\'zgartirmaydi', 'Doim kichik bo\'ladigan raqam', 'Faqat pul haqidagi raqam', 'Raqobatchilar ko\'rsatadigan raqam']} correctIdx={0}
    explainCorrect="To'g'ri! Maqtanchoq raqam (yuklab olish, like, sahifa ko'rish) hech qanday qarorga olib kelmaydi — faqat maqtanish uchun. Harakatli raqam esa (retention, konversiya) sizni harakatga undaydi."
    explainWrong={{ 1: 'Aksincha — maqtanchoq raqam odatda KATTA va o\'sib boradi, shuning uchun aldaydi.', 2: 'Pul bo\'lishi shart emas — «10k like» ham maqtanchoq.', 3: 'Kim ko\'rsatishi emas — QAROR uchun foydalimi, o\'shasi muhim.', default: 'Belgi: qaror o\'zgaradimi? Yo\'q bo\'lsa — maqtanchoq.' }} />
);

// ===== SCREEN 5 — SHIMOLIY YULDUZ METRIKASI ⭐ =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(NORTHSTAR.map(n => n.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'n3' : null);
  const isNarrow = useIsMobile(768);
  const done = seen.size >= NORTHSTAR.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const n = new Set(prev); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? NORTHSTAR.find(n => n.id === active) : null;
  const REAL = [{ ic: '🏠', n: 'Airbnb', m: 'bron qilingan kechalar' }, { ic: '🎧', n: 'Spotify', m: 'tinglash vaqti' }, { ic: '💬', n: 'WhatsApp', m: 'yuborilgan xabarlar' }];
  return (
    <Stage eyebrow="Shimoliy yulduz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Nomzodlarni ko'ring (${seen.size}/${NORTHSTAR.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta raqam butun jamoani boshqaradi: <span className="italic" style={{ color: T.honey }}>Shimoliy yulduz ⭐</span></h2></div>
        <Mentor>Dengizchilar Shimoliy yulduzga qarab yo'l topgan. Mahsulotning ham bittasi bor: <b style={{ color: T.ink }}>core qiymatni</b> eng yaxshi o'lchaydigan raqam. Uchta nomzodni sinang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NORTHSTAR.map(n => { const on = seen.has(n.id); const win = n.verdict === 'yes'; return (
                <button key={n.id} className={`plink ${active === n.id ? 'plink-on' : ''}`} onClick={() => tap(n.id)}>
                  <span style={{ fontSize: 18, minWidth: 22 }}>{on && win ? <span className="nstar" style={{ fontSize: 18 }}>⭐</span> : n.ic}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}><span className="plink-label">{n.label}</span></span>
                  {on ? (win ? <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: T.honey }}>YULDUZ</span> : <span style={{ color: T.ink3, display: 'inline-flex' }}>{Ico.x(13)}</span>) : <span className="plink-act">sinash</span>}
                </button>
              ); })}
            </div>
            <div className="frame fade-up delay-2" style={{ padding: '11px 14px' }}>
              <p className="flow-label" style={{ marginBottom: 8 }}>Haqiqiy mahsulotlar yulduzi</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{REAL.map((r, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 15 }}>{r.ic}</span><span className="small" style={{ fontWeight: 700, minWidth: 74 }}>{r.n}</span><span className="mono" style={{ fontSize: 11, color: T.ink2 }}>{r.m}</span></div>))}</div>
              <p className="small" style={{ margin: '9px 0 0', color: T.ink3, fontStyle: 'italic' }}>Diqqat: hech biri «yuklab olish» emas — hammasi QIYMAT lahzasini o'lchaydi.</p>
            </div>
          </Col>
          <Col>
            {cur ? (<div className={`${cur.verdict === 'yes' ? 'frame-success' : 'frame-warn'} fade-step`} key={active}>
              {cur.verdict === 'yes' && <div style={{ textAlign: 'center', marginBottom: 6 }}><span className="nstar" style={{ fontSize: 40 }}>⭐</span></div>}
              <p className="note-h" style={{ color: cur.verdict === 'yes' ? T.honey : T.accent }}>{cur.ic} {cur.verdict === 'yes' ? 'SHIMOLIY YULDUZ!' : 'Yulduz emas'}</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p>
            </div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Nomzodni bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi Shimoliy yulduzning uch belgisi: (1) core qiymatni o'lchaydi, (2) foydalanuvchi bilan bog'liq, (3) o'sса biznes ham o'sadi. «Ro'yxatdan o'tish» uchalasidan ham yiqiladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Shimoliy yulduz metrikasi qanaqa bo'lishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi <span className="italic" style={{ color: T.honey }}>Shimoliy yulduz</span> nimani o'lchaydi?</h2></>}
    options={['Umumiy ro\'yxatdan o\'tganlar sonini', 'Foydalanuvchilar core qiymatni olayotganini (masalan: haftada 3+ marta tekshirdi)', 'App Store yulduzini', 'Ijtimoiy tarmoqdagi obunachilar sonini']} correctIdx={1}
    explainCorrect="To'g'ri! Shimoliy yulduz = core qiymat lahzasini o'lchaydigan bitta raqam. U o'ssa — odamlar mahsulotdan foyda ko'ryapti; tushsa — muammo bor. Airbnb: bron qilingan kechalar; sizniki: takror tekshirgan foydalanuvchilar."
    explainWrong={{ 0: 'Ro\'yxatdan o\'tish faqat o\'sadi va mahsulot o\'lса ham kamaymaydi — maqtanchoq.', 2: 'Yulduz — kam sonli, tanish baholaridan; core qiymatni o\'lchamaydi.', 3: 'Obunachi mahsulotni ishlatishni ko\'rsatmaydi.', default: 'Yulduz = core qiymatni o\'lchaydi.' }} />
);

// ===== SCREEN 6 — HODISA (EVENT): RAQAM QAYERDAN KELADI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [count, setCount] = useState(storedAnswer ? FEED.length : 0);
  const done = count >= FEED.length;
  useEffect(() => {
    if (storedAnswer) return;
    if (count >= FEED.length) return;
    const t = setTimeout(() => setCount(c => Math.min(c + 1, FEED.length)), 700);
    return () => clearTimeout(t);
  }, [count, storedAnswer]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hodisa · event" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Lenta to\'lishini kuting…'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har raqam <span className="italic" style={{ color: T.accent }}>bitta hodisadan</span> tug'iladi</h2></div>
        <Mentor>Foydalanuvchi biror harakat qiladi → siz <b style={{ color: T.ink }}>hodisa (event)</b> yozib qo'yasiz. Keyin hodisalarni sanaganingiz — sizning raqamlaringiz. Muhimi: birinchi kundan yozing — <b style={{ color: T.ink }}>o'tmish qaytmaydi</b>.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">🟢 Jonli hodisa lentasi</p>
            <div className="feed">
              {FEED.slice(0, count).map((f, i) => (
                <div key={i} className="feed-row fade-step">
                  <span style={{ color: T.grape, display: 'inline-flex' }}>{Ico.chart(15)}</span>
                  <span className="feed-ev">{f.ev}</span>
                  <span className="feed-meta">{f.meta}</span>
                </div>
              ))}
              {!done && <div className="feed-row" style={{ opacity: 0.5 }}><span className="mono small" style={{ color: T.ink3 }}>· · · yozilmoqda</span></div>}
            </div>
          </Col>
          <Col>
            <div className="spec-card fade-up delay-1">
              <p className="mono" style={{ fontSize: 11, color: CODE.comment, margin: 0 }}>// kodda bitta qator: foydalanuvchi tekshirsa</p>
              <p className="mono" style={{ fontSize: 'clamp(12px,1.7vw,13.5px)', margin: '4px 0 0', color: CODE.text, lineHeight: 1.7 }}><span style={{ color: CODE.attr }}>track</span>(<span style={{ color: CODE.str }}>'avtobus_tekshirildi'</span>, {'{'} <span style={{ color: CODE.punct }}>route:</span> <span style={{ color: CODE.str }}>'12'</span> {'}'})</p>
              <p className="spec-text" style={{ color: '#9FB4D8' }}>Plausible yoki Umami — real, maxfiylikni hurmat qiluvchi, bepul analitika asboblari. Bir marta ulaysiz — har hodisa avtomatik yig'iladi.</p>
            </div>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Nega birinchi kundan? Chunki bugun yozmagan hodisangizni <b>keyin tiklab bo'lmaydi</b>. Analitikasiz o'tgan hafta — abadiy qorong'i. Shuning uchun MVP'ga birinchi kunidan ulaymiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — HODISA TANLASH O'YINI (SIGNATURE 2) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [state, setState] = useState(() => storedAnswer ? Object.fromEntries(EVENTS.map(e => [e.id, { ok: true }])) : {});
  const [last, setLast] = useState(null);
  const workRef = useRef(null);
  const okCount = EVENTS.filter(e => state[e.id]?.ok).length;
  const done = okCount >= EVENTS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (e, ans) => {
    if (state[e.id]?.ok) return;
    const ok = ans === e.ans;
    setState(prev => ({ ...prev, [e.id]: { ok, wrong: !ok } }));
    setLast({ id: e.id, ok, why: e.why, ans: e.ans });
  };
  return (
    <Stage eyebrow="Hodisa tanlash · o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tanlang (${okCount}/${EVENTS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nimani yozamiz? <span className="italic" style={{ color: T.accent }}>✅ kuzatamiz · ⏳ keyin · ❌ shovqin</span></h2></div>
        <Mentor>Hamma narsani yozish — xato: shovqin insaytni ko'mib tashlaydi (va maxfiylikni buzadi). Savol: <b style={{ color: T.ink }}>«Bu hodisa Shimoliy yulduz yoki voronkaga bog'liqmi?»</b></Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EVENTS.map(e => {
                const st = state[e.id] || {};
                return (
                  <div key={e.id} className={`sort-card ${st.ok ? 'sort-ok' : ''} ${st.wrong && !st.ok ? 'shake-x' : ''}`}>
                    <span className="sort-text mono" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(11.5px,1.5vw,12.5px)' }}>{e.t}</span>
                    {st.ok
                      ? <span className="sort-verdict" style={{ color: EMAP[e.ans].color }}>{EMAP[e.ans].emoji} {EMAP[e.ans].label}</span>
                      : <span className="sort-btns">{['do', 'later', 'no'].map(a => (<button key={a} className="sort-btn" title={EMAP[a].label} onClick={() => pick(e, a)}>{EMAP[a].emoji}</button>))}</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-1">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span className="flow-label">🎯 Hodisalar tozalandi</span><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done ? T.success : T.accent }}>{okCount}/{EVENTS.length}</span></div>
              <div className="fmeter-track"><div className="fmeter-fill" style={{ width: `${(okCount / EVENTS.length) * 100}%` }} /></div>
            </div>
            {last ? (
              <div className={`${last.ok ? 'frame-success' : 'frame-warn'} fade-step`} key={last.id + String(last.ok)}>
                <p className="note-h" style={{ color: last.ok ? T.success : T.accent }}>{last.ok ? `✓ ${EMAP[last.ans].emoji} ${EMAP[last.ans].label}` : '✗ Qayta o\'ylang'}</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>{last.ok ? last.why : 'Savol: bu hodisa Shimoliy yulduz yoki voronkaga bog\'liqmi? Ha — ✅; foydali-yu shoshilmas — ⏳; aloqasiz/maxfiy — ❌.'}</p>
              </div>
            ) : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Hodisa yonidagi ✅ / ⏳ / ❌ ni bosing.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Natija: atigi <b>4 ta muhim hodisa</b> — ochildi, tekshirdi (core), eslatma yoqdi (aktivatsiya), qaytdi (retention). Bu 4 tasi butun voronkani beradi. Qolgani — shovqin.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — AKTIVATSIYA + SEHRLI RAQAM =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('fb');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['fb', 'bus']) : new Set(['fb']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const isFb = v === 'fb';
  return (
    <Stage eyebrow="Aktivatsiya · sehrli raqam" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala misolni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">«Aha!» lahzasi va <span className="italic" style={{ color: T.honey }}>sehrli raqam</span></h2></div>
        <Mentor>Aktivatsiya = foydalanuvchi birinchi marta QIYMATNI his qilgan lahza. Ba'zan uni aniq bir <b style={{ color: T.ink }}>«sehrli raqam»</b> bashorat qiladi. Ikki misolni ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`chip ${isFb ? 'chip-on' : ''}`} onClick={() => set('fb')}>📘 Facebook: 7 do'st / 10 kun</button>
              <button className={`chip ${!isFb ? 'chip-on' : ''}`} onClick={() => set('bus')}>🚌 Sizniki: eslatma → 5×</button>
            </div>
            <div key={v} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${isFb ? T.blue : T.honey}` }}>
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55 }}>{isFb
                ? 'Facebook o\'sish jamoasi ma\'lumotni titkiladi va bitta naqsh topdi: «birinchi 10 kunда 7 ta do\'st qo\'shgan» foydalanuvchi deyarli hech qachon ketmaydi. Mana — sehrli raqam. Shundan keyin butun mahsulot bitta maqsadga qaratildi: yangi odamni tezroq 7 do\'stga yetkazish.'
                : 'Sizning dashboardingiz ham naqsh ko\'rsatdi: «eslatmani yoqqan» foydalanuvchi eslatma yoqmaganidan ~5 barobar ko\'proq qaytadi. Demak aktivatsiya lahzangiz = eslatmani yoqish. Vazifa: birinchi ochishda eslatma yoqishni oson va tabiiy qilish.'}</p>
            </div>
          </Col>
          <Col>
            {isFb
              ? <div className="frame-success fade-step" key="fb"><p className="body" style={{ margin: 0, color: T.ink }}>Saboq: sehrli raqam «ko'proq yaxshi» degan noaniqlikni <b>aniq maqsadga</b> aylantiradi. «Odamlar ko'proq qolsin» emas — «7 do'st, 10 kun».</p></div>
              : <div className="frame-success fade-step" key="bus"><p className="body" style={{ margin: 0, color: T.ink }}>Saboq: aktivatsiyani majburlab emas, <b>osonlashtirib</b> oshiring. Sehrli raqam — sizga qaysi tugmani mukammal qilish kerakligini aytadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aktivatsiya — voronkaning eng qimmatli qadami: bu yerda odam «foydalanuvchi»ga aylanadi. Uni topsangiz — nimani yaxshilashni aniq bilasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Nega hodisalarni birinchi kundan yozish kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega analitikani <span className="italic" style={{ color: T.accent }}>birinchi kundan</span> ulaymiz?</h2></>}
    options={['Chunki bu chiroyli ko\'rinadi', 'Chunki yozilmagan o\'tmish ma\'lumotini keyin tiklab bo\'lmaydi', 'Chunki investorlar shuni talab qiladi', 'Chunki kod shunsiz ishlamaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Analitika kelajakka emas, o'tmishga qaray olmaydi. Bugun hodisa yozmasangiz — bugungi foydalanuvchilar xatti-harakati abadiy yo'qoladi. Shuning uchun MVP'ning birinchi kunidan ulaymiz."
    explainWrong={{ 0: 'Chiroylilik sabab emas — ma\'lumotning qaytmasligi sabab.', 2: 'Investor uchun emas — O\'ZINGIZ qaror qilish uchun.', 3: 'Kod analitikasiz ham ishlaydi — lekin siz ko\'r bo\'lasiz.', default: 'O\'tmish ma\'lumoti tiklanmaydi — shuning uchun birinchi kundan.' }} />
);

// ===== SCREEN 10 — JONLI DASHBOARD (SIGNATURE 3) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [view, setView] = useState('vanity');
  const [seenV, setSeenV] = useState(storedAnswer ? new Set(['vanity', 'truth']) : new Set(['vanity']));
  const [leak, setLeak] = useState(storedAnswer ? LEAK_ID : null);
  const [barsOn, setBarsOn] = useState(false);
  const workRef = useRef(null);
  const leakOk = leak === LEAK_ID;
  const done = seenV.size >= 2 && leakOk;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => {
    if (view !== 'truth') { setBarsOn(false); return; }
    const t = setTimeout(() => setBarsOn(true), 60);
    return () => clearTimeout(t);
  }, [view]);
  const setV = (x) => { setView(x); setSeenV(prev => { const n = new Set(prev); n.add(x); return n; }); };
  const max = FUNNEL[0].n;
  const pickLeak = (id) => { if (leakOk) return; setLeak(id); };
  return (
    <Stage eyebrow="Jonli dashboard · simulyator" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (seenV.size < 2 ? 'Ikkala panelni ko\'ring' : 'Eng katta teshikni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta dashboard — <span className="italic" style={{ color: T.accent }}>ikki xil haqiqat</span></h2></div>
        <Mentor>Bir xil ma'lumot. Chapdan qarasangiz — bayram. O'ngdan qarasangiz — teshik chelak. Ikkalasini ko'ring, keyin <b style={{ color: T.ink }}>eng katta tushish</b> qayerda ekanini toping.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`chip ${view === 'vanity' ? 'chip-on' : ''}`} onClick={() => setV('vanity')}>🎈 Maqtanchoq panel</button>
          <button className={`chip ${view === 'truth' ? 'chip-on' : ''}`} onClick={() => setV('truth')}>💎 Haqiqat paneli</button>
        </div>
        <Zoomable><div ref={workRef} className="dash" key={view}>
          <div className="dash-head"><span className="dash-brand">{Ico.chart(14)} coddy-analytics</span><span className="dash-live">JONLI · bugun</span></div>
          {view === 'vanity' ? (
            <div className="fade-step" style={{ textAlign: 'center', padding: 'clamp(14px,3vw,26px) 0' }}>
              <p className="tile-lbl" style={{ letterSpacing: '0.1em' }}>BUGUNGI TASHRIFLAR</p>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(44px,9vw,72px)', color: '#6FE3B0', margin: '4px 0 0', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}><CountUp to={1000} dur={1100} run={view === 'vanity'} /></p>
              <p style={{ color: '#9FB4D8', fontFamily: 'Manrope', fontSize: 14, margin: '10px 0 0' }}>🎉 Rekord kun! Hammasi zo'r ketyapti… <span style={{ color: '#E0892B' }}>rostdanmi?</span></p>
              <div className="tiles" style={{ marginTop: 16, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                <div className="tile"><p className="tile-lbl">Yuklab olish</p><p className="tile-num">5 000</p></div>
                <div className="tile"><p className="tile-lbl">Like</p><p className="tile-num">10k</p></div>
              </div>
              <p style={{ color: '#6B7585', fontFamily: 'Manrope', fontSize: 12, margin: '14px 0 0', fontStyle: 'italic' }}>Bu panel faqat MAQTANCHOQ raqamlarni ko'rsatadi. «💎 Haqiqat paneli»ni bosing.</p>
            </div>
          ) : (
            <div className="fade-step">
              <p className="tile-lbl" style={{ marginBottom: 10 }}>VORONKA — bugungi 1000 tashrif qayerga ketdi?</p>
              <div className="funnel">
                {FUNNEL.map((f, i) => {
                  const prev = i === 0 ? null : FUNNEL[i - 1].n;
                  const dropPct = prev ? Math.round((1 - f.n / prev) * 100) : 0;
                  const w = barsOn ? (f.n / max) * 100 : 0;
                  const picked = leak === f.id;
                  return (
                    <button key={f.id} className={`funnel-row ${picked ? 'leak-pick' : ''}`} onClick={() => pickLeak(f.id)}>
                      <div className="funnel-top">
                        <span className="funnel-name">{f.label} {i > 0 && <span className="mono" style={{ color: dropPct >= 60 ? T.accent : '#8FA3C4', fontSize: 10, fontWeight: 700 }}>−{dropPct}%</span>}{f.id === LEAK_ID && leakOk && <span className="leak-badge">ENG KATTA TESHIK</span>}</span>
                        <span className="funnel-n">{fmtNum(f.n)}</span>
                      </div>
                      <div className="funnel-track"><div className="funnel-bar" style={{ width: `${w}%`, background: f.color }}><span className="funnel-pct">{Math.round((f.n / max) * 100)}%</span></div></div>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, background: '#182238', borderRadius: 11, padding: '11px 14px' }}>
                <div className="bucket-wrap" style={{ position: 'relative', width: 40 }}><span style={{ fontSize: 30 }}>🪣</span><span className="drop" style={{ left: 12, top: 20 }} /><span className="drop" style={{ left: 22, top: 20, animationDelay: '0.5s' }} /><span className="drop" style={{ left: 17, top: 20, animationDelay: '1s' }} /></div>
                <p style={{ color: '#C7D2E4', fontFamily: 'Manrope', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{leakOk ? <>To'g'ri! <b style={{ color: '#fff' }}>620 → 210</b>: eng katta tushish (−66%). Aynan shu bosqichni tuzatish eng ko'p foyda beradi.</> : <>Chelak teshik: 1000 quyildi, 95 qoldi. <b style={{ color: '#fff' }}>Qaysi bosqichda eng ko'p oqib ketyapti?</b> Voronka qatorini bosing.</>}</p>
              </div>
            </div>
          )}
        </div></Zoomable>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xulosa: maqtanchoq panel «1000!» deb baqiradi; haqiqat paneli esa 95 kishigina qaytganini va teshik qayerdaligini ko'rsatadi. <b>Dashboard maqtanish uchun emas — qaror uchun.</b></p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — DASHBOARD O'QISH DRILLI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(() => storedAnswer ? Object.fromEntries(READ_DRILL.map(d => [d.id, d.correct])) : {});
  const [wrong, setWrong] = useState({});
  const workRef = useRef(null);
  const okCount = READ_DRILL.filter(d => picked[d.id] === d.correct).length;
  const done = okCount >= READ_DRILL.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pick = (d, i) => {
    if (picked[d.id] === d.correct) return;
    setPicked(prev => ({ ...prev, [d.id]: i }));
    setWrong(prev => ({ ...prev, [d.id]: i !== d.correct }));
  };
  return (
    <Stage eyebrow="Mashq · dashboard o'qish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Harakatni toping (${okCount}/${READ_DRILL.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Raqam ko'rdingiz — <span className="italic" style={{ color: T.accent }}>endi nima qilasiz?</span></h2></div>
        <Mentor>Yomon founder raqamга qarab bosh irg'aydi. Yaxshi founder har raqamdan <b style={{ color: T.ink }}>bitta harakat</b> chiqaradi. Uch holat — har biriga to'g'ri harakatni tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div ref={workRef} className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {READ_DRILL.map(d => {
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
                {!solved && p !== undefined && wrong[d.id] && <p className="small fade-step" style={{ margin: '9px 0 0', color: T.accent, fontWeight: 600 }}>Raqamga ko'proq raqam qo'shmang — teshikning SABABINI qidiring.</p>}
              </div>
            );
          })}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Naqsh: har uch holatda ham to'g'ri harakat — <b>reklama ko'paytirish emas, teshikni tuzatish</b>. Avval chelakni yop, keyin suv quy.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Voronkada katta tushish (teshik) ko'rsangiz nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Voronkadagi <span className="italic" style={{ color: T.accent }}>eng katta teshik</span> — nima qilasiz?</h2></>}
    options={['E\'tibor bermayman, umumiy son kattaligicha qoladi', 'Ko\'proq reklama beraman — tepaga ko\'proq odam quyaman', 'O\'sha bosqich nega odamlarni yo\'qotayotganini aniqlab, uni tuzataman', 'Butun mahsulotni qayta yozaman']} correctIdx={2}
    explainCorrect="To'g'ri! Eng katta tushish = eng katta imkoniyat. Teshik chelakka ko'proq suv quyish (reklama) — behuda. Avval o'sha bitta bosqichni tuzat: nega tushyapti? — kuzat, so'ra, soddalashtir."
    explainWrong={{ 0: 'E\'tibor bermaslik — chelak oqib bo\'shashda davom etadi.', 1: 'Teshik chelakka suv quyish — pulni yoqish. Avval teshikni yop.', 3: 'Butunni qayta yozish — haddan tashqari. Bitta teshikni nuqtali tuzat.', default: 'Eng katta tushishni aniqla va o\'sha bosqichni tuzat.' }} />
);

// ===== SCREEN 13 — CASE: AZIZ #7 =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? null);
  const [solved, setSolved] = useState(!!storedAnswer);
  const OPTS = [
    { id: 0, t: '«Zo\'r, 300 yuklab olish! Endi ko\'proq reklama ber — 3000 qil!»' },
    { id: 1, t: '«Yuklab olish — maqtanchoq raqam. Bugundan hodisa yoz: nechta CORE JOB bajarildi, nechta odam ertasi qaytdi? Shu raqamlar mahsulotni boshqaradi»' },
    { id: 2, t: '«300 kam, kamida 1000 yuklab olish kerak»' }
  ];
  const pick = (id) => {
    if (solved) return;
    setPicked(id);
    if (id === 1) { setSolved(true); onAnswer(screen, { correct: true, picked: id, lastPicked: id }); }
  };
  return (
    <Stage eyebrow="Vaziyat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To\'g\'ri maslahatni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,1.8vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aziz: <span className="italic" style={{ color: T.accent }}>«300 yuklab olish! Top yangi ilova!»</span></h2></div>
        <Mentor>Aziz MVP'ini chiqardi (qoyil!) va hayajon bilan yozdi. Xabarini o'qing…</Mentor>
        <div className="fade-up delay-1 frame" style={{ padding: 'clamp(16px,2.5vw,22px)', borderLeft: `4px solid ${T.grape}` }}>
          <p className="mono small" style={{ margin: '0 0 8px', color: T.grape, fontWeight: 700 }}>💬 DO'STINGIZ AZIZ</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>«Chiqardim! Birinchi haftada 300 yuklab olish, App Store'da 4.7 yulduz, Telegramda 500 like! Zo'r ketyapti-a? Endi reklamaga pul tikib, ming odamga yetkazaman!»</p>
          <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.8vw,15px)', color: T.ink2, margin: '10px 0 0', lineHeight: 1.55 }}>Siz so'radingiz: «Nechta odam ertasi kuni qaytdi?» — Aziz: «…bilmadim. Uni o'lchamagan ekanman.»</p>
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
            ? 'Aziz uch maqtanchoq raqamга suyanyapti (yuklab olish, yulduz, like) — hech biri «mahsulot yashaydimi?» degan savolga javob bermaydi. Reklama tikishdan oldin u teshik chelakni topishi kerak: nechta odam CORE jobni bajardi va qaytdi? Bugundan hodisa yozmasa — bu savol abadiy javobsiz qoladi.'
            : (picked === 0 ? 'Bu — samolyot qulayotganda gazni bosish. Teshik chelakka ko\'proq suv quyish pulni yoqadi. Avval retention.' : 'Yuklab olish — maqtanchoq raqam. 300 ham, 1000 ham «mahsulot yashaydimi?» degan savolga javob bermaydi. Muhimi son emas — qaytish.')}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Analitika rejasiga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Analitika qoidasi: <span className="italic" style={{ color: T.accent }}>xatti-harakatni o'lchang — fikrni emas</span></h2></div>
      <Mentor>Qaror oldidan kompas. 4 qoida — keyin o'z rejangizni yozasiz.</Mentor>
      <Zoomable><div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ fontSize: 40 }}>🧭</span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Ko'zoynak kiying</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Asboblarsiz uchuvchi — tumanda ko'zi yumuq. Raqamlar sizning gorizontingiz.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">4 narsani unutmang</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.eye(18), c: T.honey, t: 'MAQTANCHOQ ≠ HARAKATLI — «qaror o\'zgaradimi?» so\'rang' }, { ic: Ico.star(18), c: T.honey, t: 'SHIMOLIY YULDUZ — core qiymatni o\'lchaydigan bitta raqam' }, { ic: Ico.chart(18), c: T.grape, t: 'HODISA — birinchi kundan yoz; o\'tmish qaytmaydi' }, { ic: Ico.gauge(18), c: T.blue, t: 'TESHIK CHELAK — voronkani o\'qi, eng katta tushishni tuzat' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 3 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div></Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: ANALITIKA REJASI =====
const emptyPlan = () => Object.fromEntries(PLAN_FIELDS.map(f => [f.key, '']));
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [data, setData] = useState(() => storedAnswer?.data || emptyPlan());
  const productName = useRef(readProductName()).current;
  const isComplete = (k) => data[k].trim().length >= (PLAN_FIELDS.find(f => f.key === k)?.min ?? 4);
  const completeCount = PLAN_FIELDS.filter(f => isComplete(f.key)).length;
  const passed = completeCount >= PLAN_FIELDS.length;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, data, stage: 'final', screenIdx: screen });
      savePortfolioSection('lesson100_analytics', { title: 'Analitika rejasi', fields: PLAN_FIELDS.map(f => ({ label: f.label, value: data[f.key].trim() })), savedAt: Date.now() });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setData(prev => ({ ...prev, [k]: v }));
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 12.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 8, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' };
  const docRows = PLAN_FIELDS.filter(f => isComplete(f.key)).map(f => ({ emoji: f.emoji, label: f.label.split(' — ')[0].split(' (')[0], color: f.color === T.ink2 ? T.ink3 : f.color, text: data[f.key].trim() }));
  return (
    <Stage eyebrow="Yakuniy ish · analitika rejasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${completeCount}/${PLAN_FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">ANALITIKA REJASI: <span className="italic" style={{ color: T.accent }}>portfolio 8-sahifa</span></h2></div>
        <Mentor>O'Z MVP'ingiz uchun to'ldiring{productName ? <> (mahsulotingiz: <b style={{ color: T.ink }}>{productName}</b>)</> : ''}. Misollar avtobus-loyihadan. Bu reja — MVP'ni qurishdan oldin ulaydigan ko'zoynagingiz.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable><div className="split" ref={workRef}>
          <Col>
            {PLAN_FIELDS.map(f => { const ok = isComplete(f.key); return (
              <div key={f.key} style={{ background: T.paper, borderRadius: 12, padding: '10px 12px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{f.emoji}</span><span className="flow-label" style={{ margin: 0, color: f.color === T.ink2 ? T.ink3 : f.color }}>{f.label}</span>{ok && <span style={{ color: T.success, display: 'inline-flex', marginLeft: 'auto' }}>{Ico.check(13)}</span>}</div>
                <input value={data[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.hint} style={inputStyle} />
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Sizning ko'zoynagingiz</p>
            {docRows.length === 0
              ? <div className="spec-card" style={{ minHeight: 150, justifyContent: 'center' }}><p className="spec-text" style={{ color: '#6B7585', fontStyle: 'italic', textAlign: 'center' }}>To'ldiring — reja shu yerda yig'iladi…</p></div>
              : <div style={{ position: 'relative' }}><PlanDoc rows={docRows} />{passed && <span className="seal">KO'ZOYNAK TAYYOR ✓</span>}</div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>MVP'ingiz endi ko'r emas! Shimoliy yulduz, 3 hodisa va aktivatsiya lahzasi belgilandi. Keyingi darsda AI bilan birinchi ekranni quramiz — va bu hodisalarni birinchi kunidan yozib boramiz. 🔧</p></div>}
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
  const RECAP = ['Maqtanchoq raqam ≠ harakatli raqam: «qaror o\'zgaradimi?» so\'rang', 'Shimoliy yulduz: core qiymatni o\'lchaydigan bitta raqam', 'Hodisalarni birinchi kundan yozing — o\'tmish qaytmaydi', 'Teshik chelak: voronkani o\'qing, eng katta tushishni tuzating'];
  const GLOSSARY = [{ b: 'Maqtanchoq raqam', t: '— katta ko\'rinadi, lekin qaror o\'zgartirmaydi (yuklab olish, like)' }, { b: 'Harakatli raqam', t: '— harakatga undaydi (retention, konversiya)' }, { b: 'Shimoliy yulduz', t: '— core qiymatni o\'lchaydigan bosh metrika' }, { b: 'Hodisa (event)', t: '— foydalanuvchi harakati yozuvi' }, { b: 'Aktivatsiya', t: '— birinchi qiymat («aha!») lahzasi' }, { b: 'Teshik chelak', t: '— voronkadagi tushish; retention muammosi' }, { b: 'Sehrli raqam', t: '— retention\'ni bashorat qiluvchi aniq son' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Qur bosqichi · 2/6 tamom" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen" style={{ position: 'relative' }}>
        {PASSED && <div className="confetti" aria-hidden="true">{Array.from({ length: 16 }).map((_, i) => (<span key={i} className="cf" style={{ left: `${(i * 6.3 + 2) % 100}%`, background: [T.accent, T.honey, T.grape, T.blue, T.success][i % 5], animationDelay: `${(i % 8) * 0.16}s` }} />))}</div>}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.gauge(12)}</span> Analitika darsi tamom</span><h2 className="title h-title fade-up d1">Endi MVP <span className="italic" style={{ color: T.accent }}>ko'rli emas.</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Ko\'zoynak tayyor: Shimoliy yulduzni tanladingiz, muhim hodisalarni ajratdingiz, dashboardni o\'qishni o\'rgandingiz. Keyingi darsda AI bilan birinchi ekranni quramiz — va bu hodisalarni birinchi kunidan yozib boramiz.' : 'Yaxshi harakat! Kod yozishdan oldin analitika qoidalarini mustahkamlang — aks holda ko\'r-ko\'rona quramiz.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card fade-up d4"><div className="card-lbl" style={{ color: T.honey }}>🏅 Nishonlar yo'li</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{BADGES.map((b, i) => (<span key={i} className={`badge-chip ${i <= 1 ? 'badge-done' : ''} ${i === 2 ? 'badge-next' : ''}`}>{i === 0 ? '🏹' : (i === 1 ? '🎖️' : (i === 2 ? '🔨' : '🔒'))} {b.t}<span className="badge-when" style={i <= 1 ? { color: 'rgba(255,255,255,0.8)' } : undefined}>· {b.l}</span></span>))}</div><p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>Keyingi nishon — <b style={{ color: T.honey }}>🔨 Quruvchi</b>: MVP'ingiz birinchi marta ISHLAGANDA (103-dars).</p></div>
        </div>
        <div className="frame-success fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 30 }}>📊</span><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(15px,2vw,18px)' }}>Uyga vazifa — ko'zoynakni sinang</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Analitika rejangizga qarang: har hodisa Shimoliy yulduz yoki voronkaga bog'liqmi? Bog'liq bo'lmasa — u shovqin, o'chiring. Keyin Plausible yoki Umami saytini oching va bepul hisob qanday ishlashini ko'rib chiqing. Keyingi dars: AI bilan MVP v1 (kod darsi!).</p></div></div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson32({ lang: langProp, onFinished }) {
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

        /* === MAQTANCHOQ vs HARAKATLI === */
        .balloon { display: inline-flex; align-items: center; justify-content: center; animation: float 3.2s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-6px) rotate(3deg); } }
        .gem { display: inline-flex; align-items: center; justify-content: center; filter: drop-shadow(0 5px 9px rgba(1,154,203,0.35)); }
        .pop { animation: pop-out 0.42s cubic-bezier(.3,.9,.3,1.4); }
        @keyframes pop-out { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }

        /* === NORTH STAR === */
        .nstar { display: inline-flex; animation: twinkle 2.4s ease-in-out infinite; filter: drop-shadow(0 0 9px rgba(224,137,43,0.55)); }
        @keyframes twinkle { 0%,100% { transform: scale(1); filter: drop-shadow(0 0 7px rgba(224,137,43,0.5)); } 50% { transform: scale(1.14); filter: drop-shadow(0 0 17px rgba(224,137,43,0.85)); } }

        /* === LIVE FEED === */
        .feed { display: flex; flex-direction: column; gap: 6px; }
        .feed-row { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 10px; padding: 8px 12px; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.16); }
        .feed-ev { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11.5px; color: ${T.grape}; }
        .feed-meta { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; margin-left: auto; }

        /* === DASHBOARD === */
        .dash { background: #0F1626; border-radius: 16px; padding: clamp(13px,2vw,18px); box-shadow: 0 16px 38px -14px rgba(0,0,0,0.5); }
        .dash-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .dash-brand { font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 700; color: #6FE3B0; letter-spacing: 0.04em; display: inline-flex; align-items: center; gap: 6px; }
        .dash-live { font-family: 'JetBrains Mono'; font-size: 9.5px; color: #9FB4D8; display: inline-flex; align-items: center; gap: 6px; }
        .dash-live::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #3DDC84; box-shadow: 0 0 8px #3DDC84; animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .tile { background: #182238; border-radius: 11px; padding: 11px 13px; text-align: left; }
        .tile-lbl { font-family: 'JetBrains Mono'; font-size: 9.5px; color: #8FA3C4; text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }
        .tile-num { font-family: 'Fraunces', serif; font-size: clamp(20px,3vw,26px); color: #E8EEF7; margin: 3px 0 0; font-variant-numeric: tabular-nums; }

        /* === FUNNEL === */
        .funnel { display: flex; flex-direction: column; gap: 8px; }
        .funnel-row { cursor: pointer; background: transparent; border: none; text-align: left; padding: 3px; margin: -3px; border-radius: 9px; transition: outline 0.15s; width: 100%; }
        .funnel-row:hover { background: rgba(255,255,255,0.04); }
        .funnel-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 8px; }
        .funnel-name { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: #C7D2E4; display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .funnel-n { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; color: #E8EEF7; flex-shrink: 0; }
        .funnel-track { height: 22px; background: #131C2E; border-radius: 7px; overflow: hidden; }
        .funnel-bar { height: 100%; border-radius: 7px; width: 0; transition: width 0.9s cubic-bezier(.3,.8,.3,1); display: flex; align-items: center; padding-left: 9px; min-width: 34px; }
        .funnel-pct { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.92); }
        .funnel-row.leak-pick { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        .leak-badge { font-family: 'JetBrains Mono'; font-size: 8.5px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 7px; letter-spacing: 0.03em; }

        /* === LEAKY BUCKET === */
        .bucket-wrap { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .drop { position: absolute; width: 5px; height: 8px; border-radius: 0 0 5px 5px; background: ${T.blue}; box-shadow: 0 0 5px rgba(1,154,203,0.6); animation: drip 1.6s linear infinite; }
        @keyframes drip { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }

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
