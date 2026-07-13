import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';





import mentorImg from '../assets/common/mentor.png';

// ============================================================
// CSS PRAKTIKA — PLATFORM STANDARD v15/v16  (v2 — noldan qayta qurilgan)
// O'quvchi HTML praktikasida qurgan PORTFOLIO saytiga CSS bilan jon kiritadi.
// Bezaksiz (browser default) → chiroyli, markazlashgan professional sayt.
// FAQAT o'rgatilgan xususiyatlar: color, background-color, font-family,
//   font-size, font-weight, text-align, padding, margin
//   + display:flex, gap, justify-content, align-items (CSS 2-dars).
// :hover / transition / border-radius — DARS MAVZUSI EMAS (faqat oxirida bonus).
// Murojaat: O'quvchiga "SIZ". Sarlavhalar — savol shaklida (metodika).





// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

const LangContext = createContext('uz');
const MentorCtx = createContext(null);
const useLang = () => useContext(LangContext);

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

class AudioEngine {
  constructor() {
    this.queue = []; this.currentIdx = 0; this.isPlaying = false;
    this.currentUtterance = null; this.onStateChange = null; this.waitingFor = null;
    this.voicesByLang = { ru: null, uz: null }; this.voicesReady = false; this.currentLang = 'uz';
    this.initVoices();
  }
  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;
      this.voicesByLang.ru = v.find(x => x.lang.startsWith('ru')) || v[0];
      this.voicesByLang.uz = v.find(x => x.lang.startsWith('uz')) || v.find(x => x.lang.startsWith('ru')) || v[0];
      this.voicesReady = true;
    };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = load;
  }
  setLang(l) { this.currentLang = l; }
  getVoice() { return this.voicesByLang[this.currentLang] || this.voicesByLang.ru || null; }
  hasUz() { if (typeof window === 'undefined' || !window.speechSynthesis) return false; return window.speechSynthesis.getVoices().some(v => v.lang.startsWith('uz')); }
  loadQueue(s) { this.stop(); this.queue = s; this.currentIdx = 0; this.waitingFor = null; }
  playSegment(seg) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(seg.text);
    const useUz = this.currentLang === 'uz' && this.hasUz();
    u.lang = useUz ? 'uz-UZ' : 'ru-RU'; u.rate = 0.95; u.pitch = 1.0;
    const v = this.getVoice(); if (v) u.voice = v;
    u.onstart = () => { this.isPlaying = true; if (this.onStateChange) this.onStateChange({ isPlaying: true, currentSegment: seg.id }); };
    u.onend = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); this.handleEnd(seg); };
    u.onerror = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); };
    this.currentUtterance = u; /* AUDIOSIZ: ovoz o'chirildi (kontekst saqlandi) */
  }
  handleEnd(seg) { if (seg.waits_for) { this.waitingFor = seg.waits_for; if (this.onStateChange) this.onStateChange({ isPlaying: false, waitingFor: seg.waits_for }); } else { this.currentIdx++; this.playNext(); } }
  playNext() { if (this.currentIdx >= this.queue.length) return; this.playSegment(this.queue[this.currentIdx]); }
  start() { this.currentIdx = 0; this.waitingFor = null; this.playNext(); }
  triggerEvent(type, target) { if (!this.waitingFor) return; const m = this.waitingFor.type === type && (this.waitingFor.target === target || !this.waitingFor.target); if (m) { this.waitingFor = null; this.currentIdx++; this.playNext(); } }
  pushOneOff(text) { if (!text) return; this.queue.push({ id: `oneoff_${Date.now()}`, text, trigger: 'manual', waits_for: null }); this.currentIdx = this.queue.length - 1; this.playNext(); }
  replay() { if (this.currentIdx > 0) this.currentIdx--; this.waitingFor = null; this.playNext(); }
  stop() { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); }
}
let audioEngineInstance = null;
const getAudioEngine = () => { if (typeof window === 'undefined') return null; if (!audioEngineInstance) audioEngineInstance = new AudioEngine(); return audioEngineInstance; };

function useAudio(segments) {
  const lang = useLang();
  const [state, setState] = useState({ isPlaying: false, currentSegment: null, waitingFor: null, muted: false });
  const engineRef = useRef(null);
  const segmentsRef = useRef(segments);
  const key = segments ? JSON.stringify(segments) : '';
  const prevKey = useRef(key);
  if (prevKey.current !== key) { segmentsRef.current = segments; prevKey.current = key; }
  const stable = segmentsRef.current;
  useEffect(() => {
    const engine = getAudioEngine(); if (!engine) return;
    engineRef.current = engine; engine.setLang(lang);
    engine.onStateChange = (s) => setState(p => ({ ...p, ...s }));
    if (stable && stable.length > 0 && !state.muted) {
      engine.loadQueue(stable);
      const t = setTimeout(() => engine.start(), 300);
      return () => { clearTimeout(t); engine.stop(); };
    }
    return () => { if (engine) engine.stop(); };
    // eslint-disable-next-line
  }, [stable, lang]);
  const triggerEvent = useCallback((type, target) => { if (engineRef.current) engineRef.current.triggerEvent(type, target); }, []);
  const replay = useCallback(() => { if (engineRef.current) engineRef.current.replay(); }, []);
  const toggleMute = useCallback(() => { setState(p => { const m = !p.muted; if (m && engineRef.current) engineRef.current.stop(); return { ...p, muted: m }; }); }, []);
  return { ...state, triggerEvent, replay, toggleMute };
}

// AUDIOSIZ: AudioIndicator (ovoz/replay tugmalari) olib tashlandi — ovoz o'chirilgan, ikonka kerak emas.

const LESSON_META = { lessonId: 'css-practice-portfolio-v2', lessonTitle: { uz: 'CSS Praktika — Portfolioni bezaymiz', ru: 'CSS практика — стилизуем портфолио' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's7',  type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's17', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

// ===== Kichik yordamchi komponentlar =====
const Pr = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;   // tinish belgilar { } : ;
const Se = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;      // selektor
const Pp = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;     // xususiyat (property)
const Vl = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;      // qiymat (value)
const Preview = ({ children, title = 'portfolio.html', minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH }}>{children}</div></div>
);
const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* AUDIOSIZ: ovoz tugmasi (AudioIndicator) ko'rsatilmaydi — ovoz allaqachon o'chirilgan */}
              <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
            </div>
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

// ===== TEST (ko'p tanlovli) =====
const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, audioText, audioOk, audioWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio(audioText ? [{ id: `s${screen}_intro`, text: audioText, trigger: 'on_mount', waits_for: { type: 'option_picked' } }] : null);
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
    if (audioText) { audio.triggerEvent('option_picked'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(isCorrect ? (audioOk || "To'g'ri.") : (audioWrong || "Unchalik emas. Qaytadan urinib ko'ring.")); }, 300); }
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow audioState={audioText ? audio : undefined} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
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

// ===== Portfolio jonli ko'rinishi — modifier klasslar bilan bezatiladi =====
const usePortfolio = (answers) => ({
  name: (answers?.[3]?.name || '').trim() || 'Aziza Karimova',
  role: (answers?.[3]?.role || '').trim() || 'Frontend dasturchi'
});
// on-kalitlar → .pf root ustidagi modifier klasslar
const MOD = { page: 'pf-page', center: 'pf-center', head: 'pf-head', nav: 'pf-nav', about: 'pf-about', list: 'pf-list', btn: 'pf-btn' };

// parts: 'header','about','projects','contact','footer' ; on: bezash kalitlari ro'yxati
const StyledSite = ({ name = 'Aziza Karimova', role = 'Frontend dasturchi', parts, on = [], nameColor }) => {
  const has = (p) => parts.includes(p);
  const cls = 'pf ' + on.map(k => MOD[k]).filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className="pf-inner">
        {has('header') && (
          <header className="pf-header">
            <h1 style={nameColor ? { color: nameColor } : undefined}>{name}</h1>
            <p>{role}</p>
            <nav><a>Men haqimda</a><a>Loyihalar</a><a>Aloqa</a></nav>
          </header>
        )}
        {has('about') && (
          <section className="pf-sec-about">
            <h2>Men haqimda</h2>
            <p>Salom! Men veb-saytlar yasashni o'rganayotgan dasturchiman.</p>
          </section>
        )}
        {has('projects') && (
          <section className="pf-sec-projects">
            <h2>Loyihalarim</h2>
            <ul><li><a>To-Do ilova</a></li><li><a>Ob-havo sayti</a></li></ul>
          </section>
        )}
        {has('contact') && (
          <section className="pf-sec-contact">
            <h2>Aloqa</h2>
            <p>Men bilan bog'lanish:</p>
            <a className="pf-email">Menga yozing ✉</a>
          </section>
        )}
        {has('footer') && <footer><p>© 2026 {name}</p></footer>}
      </div>
    </div>
  );
};

// Bezash ekranlari uchun umumiy "xususiyat/qiymatni tanlash" mantig'i
const useStylePick = (correct, storedAnswer, onAnswer, screen) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === correct;
  const pick = (o) => { if (solved) return; setPicked(o); if (o === correct && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: o }); };
  return { picked, solved, pick };
};
const Chips = ({ options, correct, picked, solved, pick }) => (
  <div className="tagpick fade-up delay-3">
    {options.map(o => { const isC = o === correct; let cls = 'chip'; if (picked === o) cls += isC ? ' chip-on' : ' chip-wrong'; return (<button key={o} className={cls} disabled={solved} onClick={() => pick(o)}><span className="mono">{o}</span></button>); })}
  </div>
);

// Animatsiyani katta ekranda ko'rish uchun o'rovchi — ⛶ tugma, holat saqlanadi
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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `O'tgan darsda siz portfolio saytini HTML bilan qurdingiz — lekin u oddiy, bezaksiz edi. Bugun unga CSS bilan jon kiritamiz. Mana bir xil sayt, ikki xil ko'rinishda. Sizningcha, bu farqni nima qiladi?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'CSS — ranglar, shrift va joylashuv beradi' },
    { id: 'b', label: 'Boshqacha, yangi HTML yozilgan' },
    { id: 'c', label: 'Sayt boshqa kompyuterda turibdi' }
  ];
  const isNarrow = useIsMobile(768);
  const resultRef = useRef(null);
  const pick = (v) => {
    if (picked !== null) return;
    setPicked(v);
    onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true });
    audio.triggerEvent('option_picked');
    if (isNarrow) setTimeout(() => { if (resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 140);
  };
  return (
    <Stage eyebrow="CSS Praktika · kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Boshlaymiz →" onClick={onNext} />}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <h1 className="title h-title fade-up" style={{ maxWidth: 800 }}>Bir xil sayt — nega biri <span className="italic" style={{ color: T.accent }}>chiroyli</span>?</h1>
        <Mentor>O'tgan darsda portfolioni HTML bilan qurdingiz — oddiy, bezaksiz. Bugun <b style={{ color: T.ink }}>CSS bilan jon kiritamiz!</b> Quyidagi ikkala saytning <b style={{ color: T.ink }}>HTML kodi bir xil</b> — lekin biri chiroyli. Buni nima qilyapti?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">Hozir — CSS'siz (bezaksiz)</p>
            <Preview title="portfolio.html" minH={150}><StyledSite parts={['header', 'about']} on={[]} /></Preview>
          </Col>
          <Col>
            <p className="flow-label">CSS bilan — bezatilgan</p>
            <div ref={resultRef}><Preview title="portfolio.html" minH={150}>{picked !== null ? <div className="fade-step"><StyledSite parts={['header', 'about']} on={['page', 'head', 'nav', 'about']} /></div> : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Javobni tanlang — bezatilgan ko'rinish chiqadi</p>}</Preview></div>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, answers, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's1', text: `Portfolioni 6 qadamda bezaymiz: avval fon va shrift, keyin sarlavhalar, menyu, men haqimda bo'limi, loyihalar va aloqa tugmasi. Har qadamda saytingiz chiroyliroq bo'lib boradi. Va'da beraman: dars oxirida o'ngdagi chiroyli sayt sizniki bo'ladi!`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Fon va shrift', tag: 'background-color, font-family' },
    { text: 'Sarlavhalar — rang, markaz', tag: 'color, text-align' },
    { text: 'Menyu — bir qatorga', tag: 'display: flex' },
    { text: 'Men haqimda — joylashuv', tag: 'padding' },
    { text: 'Loyihalar — kartalar', tag: 'margin' },
    { text: 'Aloqa tugmasi', tag: 'background-color, padding' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const stepBtnRef = useRef(null);
  const scrollDown = (e) => { const sc = e.currentTarget.closest('.stage-content'); if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); };
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Tayyor sayt — dars oxirida shunday bo'ladi</p>
      <Preview title="portfolio.html" minH={196}><StyledSite name={pf.name} role={pf.role} parts={['header', 'about', 'projects', 'contact', 'footer']} on={['page', 'center', 'head', 'nav', 'about', 'list', 'btn']} /></Preview>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">6 bezash qadami</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Bezashni boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Portfolioni qanday <span className="italic" style={{ color: T.accent }}>chiroyli</span> qilamiz?</h2></div>
        <Mentor>Portfolioni <b style={{ color: T.ink }}>6 qadamda</b> bezaymiz. Har qadamda saytingiz chiroyliroq bo'ladi. <b style={{ color: T.ink }}>Va'da:</b> dars oxirida o'ngdagi sayt — sizniki!</Mentor>
        {!isNarrow ? (<div onClick={scrollDown}><Split>{PreviewBlock}{StepsBlock}</Split></div>)
          : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)', cursor: 'pointer' }} onClick={() => stepBtnRef.current && stepBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{PreviewBlock}<p className="small" style={{ margin: 0, color: T.ink2, textAlign: 'center', fontStyle: 'italic' }}>👆 Saytni bosing — keyin "6 qadamni ko'rish"</p><button ref={stepBtnRef} className="btn" style={{ alignSelf: 'flex-start' }} onClick={(e) => { e.stopPropagation(); setShowSteps(true); }}>📋 6 qadamni ko'rish</button></div>)
          : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Tayyor saytni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — CSS QOIDASI (konkret: ismingiz = h1) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `CSS yozishdan oldin bitta qoidani bilish kerak. Har bir CSS satri uch qismdan iborat. Mana misol: h1, ochiluvchi qavs, color, ikki nuqta, to'q sariq, nuqta-vergul. Pastdagi uch qismni birma-bir bosing — har biri nima qilishini ko'ring va ismingiz qanday rang olishini kuzating.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    sel: { label: 'selektor', t: 'Qaysi elementni bezaymiz. Bu yerda h1 — ya\'ni ismingiz.' },
    prop: { label: 'xususiyat', t: 'Nimasini o\'zgartiramiz. color — matn rangi.' },
    val: { label: 'qiymat', t: 'Qanday bo\'lsin. #FF4F28 — to\'q sariq rang.' }
  };
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? ['sel', 'prop', 'val'] : []));
  const done = seen.size === 3;
  const clickPart = (k) => setSeen(s => { if (s.has(k)) return s; const n = new Set(s); n.add(k); return n; });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const last = [...seen].pop();
  return (
    <Stage eyebrow="CSS qoidasi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Birinchi bezakni beramiz →' : `Uch qismni bosing (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ismingizni bo'yash uchun nima <span className="italic" style={{ color: T.accent }}>yozamiz</span>?</h2></div>
        <Mentor>Bezashdan oldin bitta narsani bilamiz: CSS <b style={{ color: T.ink }}>buyrug'i</b> doim uch qismdan iborat — <b style={{ color: T.ink }}>selektor</b> (nimani), <b style={{ color: T.ink }}>xususiyat</b> (nimasini), <b style={{ color: T.ink }}>qiymat</b> (qanday). Pastdagi qoidaning uch qismini bosing — ismingiz jonlanadi.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(14px,2vw,18px)', textAlign: 'center', lineHeight: 2 }}>
              <span className={`cpart ${seen.has('sel') ? 'on' : ''}`} style={{ color: CODE.tag }} onClick={() => clickPart('sel')}>h1</span>{' '}<Pr>{'{'}</Pr>{' '}<span className={`cpart ${seen.has('prop') ? 'on' : ''}`} style={{ color: CODE.attr }} onClick={() => clickPart('prop')}>color</span><Pr>:</Pr>{' '}<span className={`cpart ${seen.has('val') ? 'on' : ''}`} style={{ color: CODE.str }} onClick={() => clickPart('val')}>#FF4F28</span><Pr>;</Pr>{' '}<Pr>{'}'}</Pr>
            </pre>
            <div className="clegend fade-up delay-3">
              {Object.entries(PARTS).map(([k, v]) => (<span key={k} className={`ctab ${seen.has(k) ? 'done' : ''}`}>{seen.has(k) ? '✓' : '•'} {v.label}</span>))}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda — ismingiz (h1)</div>
            <Preview title="portfolio.html" minH={120}><StyledSite parts={['header']} on={[]} nameColor={seen.has('val') ? T.accent : undefined} /></Preview>
            {last && <div className="frame-soft fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{PARTS[last].label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{PARTS[last].t}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana butun qoida: <span className="mono">{'h1 { color: #FF4F28; }'}</span> — "h1 ning rangini to'q sariq qil". Har CSS satri <b>nuqta-vergul</b> (;) bilan tugaydi.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BUILD: FON + SHRIFT (body) =====
const Screen3 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's3', text: `Birinchi bezak — butun sahifaga fon rangi va shrift. body selektori orqali beramiz. Fon rangini beradigan xususiyat — background-color. To'g'ri xususiyatni tanlang, sahifa jonlanadi.`, trigger: 'on_mount', waits_for: null }]);
  const { picked, solved, pick } = useStylePick('background-color', storedAnswer, onAnswer, screen);
  return (
    <Stage eyebrow="Bezak · Fon va shrift" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri xususiyatni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytimizga qanday <span className="italic" style={{ color: T.accent }}>fon</span> beramiz?</h2></div>
        <Mentor>Butun sahifaga <span className="mono">body</span> orqali fon rangi va shrift beramiz. Fon rangini beradigan xususiyat qaysi? Tanlang — bo'sh joy <span className="slot">?</span> to'ladi.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Se>body</Se> <Pr>{'{'}</Pr>{'\n  '}<span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'background-color' : '?'}</span><Pr>:</Pr> <Vl>#F6F4EF</Vl><Pr>;</Pr>{'\n  '}<Pp>font-family</Pp><Pr>:</Pr> <Vl>Manrope, sans-serif</Vl><Pr>;</Pr>{'\n'}<Pr>{'}'}</Pr></pre>
            <p className="fld-label">Fon rangini qaysi xususiyat beradi?</p>
            <Chips options={['color', 'background-color', 'font-size', 'padding']} correct="background-color" picked={picked} solved={solved} pick={pick} />
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko\'ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">background-color</span> — orqa fon rangi. <span className="mono">font-family</span> esa butun sahifa shriftini o'zgartiradi.</> : <>Bu fon emas. Orqa fonni <span className="mono">background-color</span> beradi (<span className="mono">color</span> — matn rangi).</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">{solved ? 'CSS bilan' : 'Hozir — bezaksiz'}</div>
            <Preview title="portfolio.html" minH={150}><StyledSite name={pf.name} role={pf.role} parts={['header', 'about']} on={solved ? ['page'] : []} /></Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST (color vs background) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Matnning o'zini — harflar rangini — o'zgartiradigan xususiyat qaysi?"
    questionText="Matn (harflar) rangini qaysi xususiyat beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Matnning o'zini — <span className="italic" style={{ color: T.accent }}>harflar rangini</span> — o'zgartiradigan xususiyat qaysi?</h2></>}
    options={['background-color', 'color', 'font-size', 'text-align']} correctIdx={1}
    explainCorrect="To'g'ri! color — matn (harflar) rangi. background-color esa orqa fon rangi — ikkisini chalkashtirmang."
    explainWrong={{ 0: "background-color — orqa fon rangi. Harflar rangi esa — color.", 2: "font-size — shrift kattaligi, rang emas. Matn rangi — color.", 3: "text-align — matn joylashuvi (chap/markaz). Rang — color.", default: "Harflar rangi — color." }} />
);

// ===== SCREEN 5 — BUILD: SARLAVHALAR (color + text-align) =====
const Screen5 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's5', text: `Endi sarlavhalarni bezaymiz. Ismingizni — h1 ni — yorqin rang bilan ajratamiz va markazga joylashtiramiz. Matnni markazga joylashtiradigan qiymat — center. To'g'ri qiymatni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const { picked, solved, pick } = useStylePick('center', storedAnswer, onAnswer, screen);
  return (
    <Stage eyebrow="Bezak · Sarlavhalar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri qiymatni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ismingiz qanday <span className="italic" style={{ color: T.accent }}>ko'zga tashlansin</span>?</h2></div>
        <Mentor>Ismingiz — <span className="mono">h1</span> — eng avval ko'zga tashlanishi kerak. Buning uchun unga yorqin <b style={{ color: T.accent }}>rang</b> beramiz va <b style={{ color: T.ink }}>markazga</b> qo'yamiz. Matnni markazga qo'yadigan qiymat qaysi? Tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Se>h1</Se> <Pr>{'{'}</Pr>{'\n  '}<Pp>color</Pp><Pr>:</Pr> <Vl>#FF4F28</Vl><Pr>;</Pr>{'\n  '}<Pp>text-align</Pp><Pr>:</Pr> <span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'center' : '?'}</span><Pr>;</Pr>{'\n'}<Pr>{'}'}</Pr></pre>
            <p className="fld-label">Sarlavhani markazga qaysi qiymat qo'yadi?</p>
            <Chips options={['left', 'center', 'right', 'middle']} correct="center" picked={picked} solved={solved} pick={pick} />
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko\'ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">text-align: center</span> — matnni markazga qo'yadi. <span className="mono">color</span> esa sarlavhaga yorqin rang berdi.</> : <>Bu qiymat markaz emas. Markaz uchun — <span className="mono">center</span> (<span className="mono">left</span> — chap, <span className="mono">right</span> — o'ng).</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">{solved ? 'CSS bilan' : 'Fon berildi — sarlavha hali oddiy'}</div>
            <Preview title="portfolio.html" minH={150}><StyledSite name={pf.name} role={pf.role} parts={['header', 'about']} on={solved ? ['page', 'head'] : ['page']} /></Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — TEST (text-align) =====
const Screen6 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Matnni markazga, chapga yoki o'ngga joylashtiradigan xususiyat qaysi?"
    questionText="Matn joylashuvini qaysi xususiyat boshqaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Matnni <span className="italic" style={{ color: T.accent }}>markazga</span> (yoki chapga/o'ngga) joylashtiradigan xususiyat qaysi?</h2></>}
    options={['margin', 'padding', 'color', 'text-align']} correctIdx={3}
    explainCorrect="To'g'ri! text-align matnni qator ichida joylashtiradi: center (markaz), left (chap), right (o'ng)."
    explainWrong={{ 0: "margin — tashqi bo'shliq, matn joylashuvi emas. Joylashuv — text-align.", 1: "padding — ichki bo'shliq. Matn joylashuvi — text-align.", 2: "color — rang. Joylashuv — text-align.", default: "Matn joylashuvi — text-align." }} />
);

// ===== SCREEN 7 — BUILD: MENYU (display: flex + gap + justify-content) =====
const Screen7 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's7', text: `Menyu havolalari hozir ustma-ust va tagi chizilgan. Ularni o'tgan darsda o'rgangan flexbox bilan bir qatorga tizamiz. Elementlarni qatorga tizadigan qoida — display flex. To'g'ri qiymatni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const { picked, solved, pick } = useStylePick('flex', storedAnswer, onAnswer, screen);
  return (
    <Stage eyebrow="Bezak · Menyu" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri qiymatni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Menyuni qanday <span className="italic" style={{ color: T.accent }}>bir qatorga</span> tizamiz?</h2></div>
        <Mentor>O'tgan darsdagi <b style={{ color: T.ink }}>flexbox</b> kerak bo'ladi! <span className="mono">nav</span> ga <span className="mono">display: flex</span> berib, <span className="mono">gap</span> bilan oraliq, <span className="mono">justify-content: center</span> bilan markazga qo'yamiz. Qator qiluvchi qiymat qaysi?</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Se>nav</Se> <Pr>{'{'}</Pr>{'\n  '}<Pp>display</Pp><Pr>:</Pr> <span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'flex' : '?'}</span><Pr>;</Pr>{'\n  '}<Pp>gap</Pp><Pr>:</Pr> <Vl>14px</Vl><Pr>;</Pr>{'\n  '}<Pp>justify-content</Pp><Pr>:</Pr> <Vl>center</Vl><Pr>;</Pr>{'\n'}<Pr>{'}'}</Pr></pre>
            <p className="fld-label">Elementlarni bir qatorga qaysi qiymat tizadi?</p>
            <Chips options={['block', 'flex', 'none', 'inline']} correct="flex" picked={picked} solved={solved} pick={pick} />
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko\'ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">display: flex</span> — havolalarni bir qatorga tizdi, <span className="mono">gap</span> oraliq berdi, <span className="mono">justify-content: center</span> markazga qo'ydi.</> : <>Bu qiymat qatorga tizmaydi. Yonma-yon tizish uchun — <span className="mono">flex</span>.</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">{solved ? 'CSS bilan' : 'Menyu hali oddiy (ustma-ust)'}</div>
            <Preview title="portfolio.html" minH={150}><StyledSite name={pf.name} role={pf.role} parts={['header']} on={solved ? ['page', 'head', 'nav'] : ['page', 'head']} /></Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST (display: flex) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Elementlarni yonma-yon, bir qatorga tizadigan qoida qaysi?"
    questionText="Elementlarni bir qatorga tizadigan qoida?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Menyu havolalarini <span className="italic" style={{ color: T.accent }}>yonma-yon</span>, bir qatorga tizadigan qoida qaysi?</h2></>}
    options={['display: block', 'text-align: center', 'display: flex', 'font-size: 20px']} correctIdx={2}
    explainCorrect="To'g'ri! display: flex — idishni 'flex' qiladi va bolalarini bir qatorga tizadi. gap esa oralarini ochadi."
    explainWrong={{ 0: "display: block — aksincha, har birini alohida qatorga qo'yadi. Bir qatorga — display: flex.", 1: "text-align: center — matnni markazlaydi, qatorga tizmaydi. Tizish — display: flex.", 3: "font-size — shrift kattaligi, joylashuv emas. Qator — display: flex.", default: "Bir qatorga tizish — display: flex." }} />
);

// ===== SCREEN 9 — BUILD: MEN HAQIMDA (padding + markaz, dasturchi avatar) =====
const Screen9 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's9', text: `Endi men haqimda bo'limi. Matnni markazga qo'yib, bo'limga ichki bo'shliq beramiz — shunda u qisilib turmaydi, nafas oladi. Ichki bo'shliqni beradigan xususiyat — padding. To'g'ri xususiyatni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const { picked, solved, pick } = useStylePick('padding', storedAnswer, onAnswer, screen);
  return (
    <Stage eyebrow="Bezak · Men haqimda" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri xususiyatni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Men haqimda"ni qanday <span className="italic" style={{ color: T.accent }}>joylashtiramiz</span>?</h2></div>
        <Mentor>"Men haqimda" matnini <b style={{ color: T.ink }}>markazga</b> qo'yamiz va bo'limga <b style={{ color: T.ink }}>ichki bo'shliq</b> beramiz — qisilib turmasin, nafas olsin. Ichkaridagi bo'shliqni qaysi xususiyat beradi? Tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Se>section</Se> <Pr>{'{'}</Pr>{'\n  '}<Pp>text-align</Pp><Pr>:</Pr> <Vl>center</Vl><Pr>;</Pr>{'\n  '}<span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'padding' : '?'}</span><Pr>:</Pr> <Vl>14px</Vl><Pr>;</Pr>{'\n'}<Pr>{'}'}</Pr></pre>
            <p className="fld-label">Bo'lim ichidagi bo'shliqni qaysi xususiyat beradi?</p>
            <Chips options={['margin', 'padding', 'gap', 'color']} correct="padding" picked={picked} solved={solved} pick={pick} />
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko\'ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">padding</span> — element ichidagi bo'shliq. Matn chetga yopishmasdan, nafas oladi.</> : <>Bu ichki bo'shliq emas. Ichkarisini <span className="mono">padding</span> ochadi (<span className="mono">margin</span> — tashqi bo'shliq).</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">{solved ? 'CSS bilan — markazda, bo\'shliq bilan' : 'Bo\'lim hali qisilib turibdi'}</div>
            <Preview title="portfolio.html" minH={150}><StyledSite name={pf.name} role={pf.role} parts={['about']} on={solved ? ['page', 'head', 'about'] : ['page', 'head']} /></Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — BUILD: LOYIHALAR (margin — kartalar orasi) =====
const Screen10 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's10', text: `Loyihalar ro'yxatini chiroyli kartalarga aylantiramiz. Har bir kartaga oq fon beramiz va kartalar bir-biriga yopishmasligi uchun ular orasiga tashqi bo'shliq qo'yamiz — buni margin beradi. To'g'ri xususiyatni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const { picked, solved, pick } = useStylePick('margin', storedAnswer, onAnswer, screen);
  return (
    <Stage eyebrow="Bezak · Loyihalar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri xususiyatni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihalarni qanday <span className="italic" style={{ color: T.accent }}>kartaga</span> aylantiramiz?</h2></div>
        <Mentor>Har bir loyihaga <b style={{ color: T.ink }}>oq fon</b> va ichki <span className="mono">padding</span> berib karta qilamiz. Kartalar yopishmasligi uchun orasiga <b style={{ color: T.ink }}>tashqi bo'shliq</b> kerak — qaysi xususiyat? Tanlang. <span className="small" style={{ color: T.ink2 }}>(ro'yxat nuqtalarini <span className="mono">list-style: none</span> oladi — kichik bonus.)</span></Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Se>li</Se> <Pr>{'{'}</Pr>{'\n  '}<Pp>background-color</Pp><Pr>:</Pr> <Vl>#fff</Vl><Pr>;</Pr>{'\n  '}<Pp>padding</Pp><Pr>:</Pr> <Vl>10px</Vl><Pr>;</Pr>{'\n  '}<span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'margin' : '?'}</span><Pr>:</Pr> <Vl>8px 0</Vl><Pr>;</Pr>{'\n'}<Pr>{'}'}</Pr></pre>
            <p className="fld-label">Kartalar orasidagi bo'shliqni qaysi xususiyat beradi?</p>
            <Chips options={['padding', 'margin', 'gap', 'color']} correct="margin" picked={picked} solved={solved} pick={pick} />
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko\'ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">margin</span> — element <b>tashqarisidagi</b> bo'shliq. Kartalar bir-biridan ajraladi. (<span className="mono">padding</span> — ichkarida, <span className="mono">margin</span> — tashqarida.)</> : <>Bu tashqi bo'shliq emas. Elementlar orasini <span className="mono">margin</span> ochadi (<span className="mono">padding</span> — ichkarida).</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">{solved ? 'CSS bilan — kartalar' : 'Ro\'yxat hali nuqtali'}</div>
            <Preview title="portfolio.html" minH={150}><StyledSite name={pf.name} role={pf.role} parts={['projects']} on={solved ? ['page', 'head', 'list'] : ['page', 'head']} /></Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST (padding vs margin) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    audioText="Kontent bilan elementning cheti orasidagi ichki bo'shliq qaysi xususiyat bilan beriladi?"
    questionText="Element ichidagi bo'shliq qaysi xususiyat?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kontent bilan element cheti orasidagi <span className="italic" style={{ color: T.accent }}>ichki bo'shliq</span> qaysi xususiyat?</h2></>}
    options={['margin', 'padding', 'gap', 'text-align']} correctIdx={1}
    explainCorrect="To'g'ri! padding — ichki bo'shliq (kontent bilan chet orasida). margin esa tashqi bo'shliq (elementlar orasida)."
    explainWrong={{ 0: "margin — bu tashqi bo'shliq (elementlar orasida). Ichkisi — padding.", 2: "gap — flex elementlar orasidagi oraliq. Ichki bo'shliq — padding.", 3: "text-align — matn joylashuvi. Ichki bo'shliq — padding.", default: "Ichki bo'shliq — padding." }} />
);

// ===== SCREEN 12 — BUILD: ALOQA TUGMASI (color — oq matn) =====
const Screen12 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's12', text: `Aloqa bo'limidagi oddiy email havolasini chiroyli tugmaga aylantiramiz: to'q sariq fon, ichki bo'shliq va oq matn. Matnni oq qiladigan xususiyat — color. To'g'ri xususiyatni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const { picked, solved, pick } = useStylePick('color', storedAnswer, onAnswer, screen);
  return (
    <Stage eyebrow="Bezak · Aloqa tugmasi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Saytni yig\'amiz →' : "To'g'ri xususiyatni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Havolani, tugmaga <span className="italic" style={{ color: T.accent }}>qanday</span> aylantiramiz?</h2></div>
        <Mentor>Email havolasiga <b style={{ color: T.accent }}>to'q sariq fon</b> (<span className="mono">background-color</span>) va <span className="mono">padding</span> berib tugma qilamiz. Endi matn ko'rinishi uchun <b style={{ color: T.ink }}>oq</b> bo'lishi kerak — matn rangini qaysi xususiyat beradi?</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Se>.pf-email</Se> <Pr>{'{'}</Pr>{'\n  '}<Pp>background-color</Pp><Pr>:</Pr> <Vl>#FF4F28</Vl><Pr>;</Pr>{'\n  '}<Pp>padding</Pp><Pr>:</Pr> <Vl>10px 20px</Vl><Pr>;</Pr>{'\n  '}<span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'color' : '?'}</span><Pr>:</Pr> <Vl>#fff</Vl><Pr>;</Pr>{'\n'}<Pr>{'}'}</Pr></pre>
            <p className="fld-label">Tugma matnini oq qiladigan xususiyat?</p>
            <Chips options={['background-color', 'color', 'padding', 'gap']} correct="color" picked={picked} solved={solved} pick={pick} />
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko\'ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">color: #fff</span> — matnni oq qildi. To'q sariq fon + oq matn + padding = chinakam tugma!</> : <>Bu matn rangi emas. Harflar rangini <span className="mono">color</span> beradi (<span className="mono">background-color</span> — fon).</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">{solved ? 'CSS bilan — tugma!' : 'Hozir — oddiy havola'}</div>
            <Preview title="portfolio.html" minH={150}><StyledSite name={pf.name} role={pf.role} parts={['contact']} on={solved ? ['page', 'head', 'btn'] : ['page', 'head']} /></Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — BUILD: MARKAZLASH (margin: auto) =====
const Screen13 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's13', text: `Oxirgi bezak — eng ta'sirlisi! Butun saytni oq kartaga solib, ekran markaziga joylashtiramiz. Buni max-width bilan kenglikni cheklab, keyin chap va o'ng tashqi bo'shliqni avtomatik teng bo'lishtirib qilamiz. margin ning qaysi qiymati buni qiladi? Tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const { picked, solved, pick } = useStylePick('auto', storedAnswer, onAnswer, screen);
  const isNarrow = useIsMobile(768);
  const previewRef = useRef(null);
  const pick2 = (o) => { pick(o); if (isNarrow) setTimeout(() => { if (previewRef.current) previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 140); };
  return (
    <Stage eyebrow="Bezak · Markazlash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Saytni yig\'amiz →' : "To'g'ri qiymatni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Butun saytni qanday <span className="italic" style={{ color: T.accent }}>markazga</span> qo'yamiz?</h2></div>
        <Mentor>Saytni oq kartaga solib, <span className="mono">max-width</span> bilan kengligini cheklaymiz, so'ng chap-o'ng tashqi bo'shliqni teng bo'lib markazga qo'yamiz. <span className="mono">margin</span> ning qaysi qiymati markazlaydi? Tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Se>.karta</Se> <Pr>{'{'}</Pr>{'\n  '}<Pp>max-width</Pp><Pr>:</Pr> <Vl>300px</Vl><Pr>;</Pr>{'\n  '}<Pp>margin</Pp><Pr>:</Pr> <Vl>0</Vl> <span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'auto' : '?'}</span><Pr>;</Pr>{'\n'}<Pr>{'}'}</Pr></pre>
            <p className="fld-label">margin ning qaysi qiymati markazlaydi?</p>
            <Chips options={['center', 'auto', 'middle', 'left']} correct="auto" picked={picked} solved={solved} pick={pick2} />
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko\'ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">margin: 0 auto</span> — chap va o'ng bo'shliqni teng qilib, kartani markazga qo'yadi. <span className="mono">max-width</span> esa juda kengayib ketishiga yo'l qo'ymaydi.</> : <>Bu qiymat markazlamaydi. Chap-o'ngni teng bo'lish uchun — <span className="mono">auto</span>.</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">{solved ? 'CSS bilan — markazda!' : 'Sayt hali butun enni egallaydi'}</div>
            <div ref={previewRef}><Preview title="portfolio.html" minH={160}><StyledSite name={pf.name} role={pf.role} parts={['header', 'about']} on={solved ? ['page', 'center', 'head', 'nav', 'about'] : ['page', 'head', 'nav', 'about']} /></Preview></div>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST (justify-content / flexbox recap) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 5-savol"
    audioText="Flex konteyner ichidagi elementlarni qator bo'ylab gorizontal markazga joylashtiradigan xususiyat qaysi?"
    questionText="Flex elementlarni gorizontal markazga joylash?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Menyudagi (flex) havolalarni qator bo'ylab <span className="italic" style={{ color: T.accent }}>gorizontal markazga</span> joylash uchun qaysi xususiyat?</h2></>}
    options={['align-items: center', 'justify-content: center', 'text-align: center', 'gap: 10px']} correctIdx={1}
    explainCorrect="To'g'ri! justify-content: center — flex elementlarni asosiy o'q (gorizontal) bo'ylab markazga joylaydi."
    explainWrong={{ 0: "align-items — ko'ndalang o'q (vertikal) bo'ylab tekislaydi. Gorizontal markaz — justify-content.", 2: "text-align matn uchun. Flex elementlar uchun — justify-content.", 3: "gap — faqat oraliq beradi, markazlmaydi. Markaz — justify-content: center.", default: "Flex gorizontal markaz — justify-content: center." }} />
);

// ===== SCREEN 15 — YIG'ISH (to'liq portfolio) =====
const Screen15 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's15', text: `Mana eng zo'r qismi — barcha bezaklarni bitta saytga yig'amiz. Tugmani bosing va bezaksiz portfolioingiz birma-bir chiroyli, markazlashgan professional saytga aylanganini ko'ring!`, trigger: 'on_mount', waits_for: null }]);
  const ALL = ['page', 'head', 'nav', 'about', 'list', 'btn', 'center'];
  const LABELS = [
    { k: 'page', l: 'Fon va shrift' }, { k: 'head', l: 'Sarlavhalar' }, { k: 'nav', l: 'Menyu (flex)' },
    { k: 'about', l: 'Men haqimda' }, { k: 'list', l: 'Loyiha kartalari' }, { k: 'btn', l: 'Aloqa tugmasi' }, { k: 'center', l: 'Markazlash' }
  ];
  const isNarrow = useIsMobile(768);
  const [on, setOn] = useState(storedAnswer ? ALL : []);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const endRef = useRef(null);
  const done = on.length >= ALL.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const followDown = (last) => {
    requestAnimationFrame(() => {
      if (!endRef.current) return;
      if (last) { const sc = endRef.current.closest('.stage-content'); if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); return; }
      if (isNarrow) endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };
  const apply = () => {
    clearTimeout(timer.current); setOn([]); setRunning(true);
    const tick = (i) => { setOn(ALL.slice(0, i)); const last = i >= ALL.length; followDown(last); if (i < ALL.length) timer.current = setTimeout(() => tick(i + 1), 430); else setRunning(false); };
    timer.current = setTimeout(() => tick(1), 250);
  };
  return (
    <Stage eyebrow="Saytni yig'ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Yakuniy mashq →' : 'Avval bezang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasini birlashtirib, <span className="italic" style={{ color: T.accent }}>saytga</span> yig'amizmi?</h2></div>
        <Mentor>Mana eng zo'r qismi! Tugmani bosing — barcha bezaklar <b style={{ color: T.ink }}>birma-bir</b> qo'shilib, bezaksiz saytingiz chiroyli portfolioga aylanadi!</Mentor>
        <Zoomable>
        <div className="split" style={{ alignItems: 'stretch' }}>
          <div className="col">
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={apply} disabled={running}>{running ? 'Bezatilmoqda…' : (done ? '↻ Yana ko\'rsatish' : '🎨 Saytni bezash')}</button>
            <div className="asm-list fade-up delay-2">
              {LABELS.map((b, i) => (<div key={b.k} className={`asm-row ${on.includes(b.k) ? 'on' : ''}`}><span className="asm-ic">{on.includes(b.k) ? '✓' : (i + 1)}</span><span className="small" style={{ fontWeight: 600 }}>{b.l}</span></div>))}
            </div>
            {done && <div className="frame-success fade-step" style={{ marginTop: 'auto' }}><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Portfolio tayyor!</p><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil HTML — endi <b>chiroyli, markazlashgan va professional</b>. Mana CSS ning kuchi!</p></div>}
          </div>
          <div className="col">
            <div className="flow-label">{pf.name} — portfolio</div>
            <Preview title="portfolio.html" minH={230}><StyledSite name={pf.name} role={pf.role} parts={['header', 'about', 'projects', 'contact', 'footer']} on={on} /></Preview>
            <div ref={endRef} aria-hidden="true" />
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUNIY (qo'lda CSS yozish) =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's16', text: `Oxirgi qadam — endi o'zingiz CSS yozasiz! Ismingiz, ya'ni h1 ga rang bering. Pastdagi yordamchi tugmalardan foydalanib, to'liq qoidani yozing: h1, qavs, color, rang, nuqta-vergul, qavs. To'g'ri yozsangiz, ismingiz o'sha rangga bo'yaladi!`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [val, setVal] = useState(storedAnswer?.text ?? '');
  const inputRef = useRef(null);
  const okRef = useRef(!!storedAnswer);
  const hasSel = /h1/i.test(val);
  const hasOpen = val.includes('{');
  const hasColor = /color\s*:/i.test(val);
  const hasSemi = val.includes(';');
  const hasClose = val.includes('}');
  const m = val.match(/color\s*:\s*([^;}\s]+)/i);
  const colorVal = m ? m[1] : null;
  const valid = hasSel && hasOpen && hasColor && hasSemi && hasClose;
  const CHECKS = [{ ok: hasSel, l: 'h1' }, { ok: hasOpen, l: '{' }, { ok: hasColor, l: 'color:' }, { ok: hasSemi, l: ';' }, { ok: hasClose, l: '}' }];
  useEffect(() => {
    if (valid && !okRef.current) {
      okRef.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, correct: true, solved: true, firstAttemptCorrect: true, text: val });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff('Zo\'r! Siz haqiqiy CSS qoidasini o\'z qo\'lingiz bilan yozdingiz.'); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!valid} label={valid ? 'Yakunlash →' : 'CSS qoidasini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>o'zingiz</span> CSS yozing.</h2></div>
        <Mentor>Mashq vaqti! Ismingizga — <span className="mono">h1</span> ga — <b style={{ color: T.ink }}>rang bering</b>. To'liq qoidani <b style={{ color: T.ink }}>o'zingiz qo'lda yozing</b>: <span className="mono">{'h1 { color: tomato; }'}</span>. To'g'ri yozsangiz, pastdagi belgilar yashil bo'lib, ism o'sha rangga bo'yaladi!</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <input ref={inputRef} className="text-input mono" value={val} placeholder="bu yerga yozing: h1 { color: tomato; }" onChange={e => setVal(e.target.value)} spellCheck={false} autoFocus />
            <p className="small" style={{ margin: 0, color: T.ink2, fontStyle: 'italic' }}>✍️ Klaviaturadan o'zingiz yozing — yordamchi tugmalarsiz.</p>
            <div className="pill-row fade-up delay-2">
              {CHECKS.map((c, i) => (<span key={i} className={`tagpill ${c.ok ? 'on' : ''}`}><span className="tp-ic">{c.ok ? '✓' : i + 1}</span><span className="mono">{c.l}</span></span>))}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda — ismingiz</div>
            <Preview title="portfolio.html" minH={130}><StyledSite parts={['header']} on={['page', 'center']} nameColor={valid && colorVal ? colorVal : undefined} /></Preview>
            {valid && <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ To'g'ri yozildi</p><p className="body" style={{ margin: 0, color: T.ink }}>Siz haqiqiy CSS qoidasini qo'lda yozdingiz — selektor, xususiyat, qiymat va nuqta-vergul bilan!</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's17', text: "Tabriklayman! Siz dizayner bo'ldingiz. Bir xil HTML'dan, faqat CSS yordamida chiroyli, markazlashgan va professional portfolio yasadingiz: fon, ranglar, shriftlar, flex menyu, kartalar va tugma. Endi siz veb-sahifa yasashning ikkala kuchini ham bilasiz — HTML struktura beradi, CSS go'zallik. Zo'r ish!", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['background-color, color — fon va matn rangi', 'font-family — shrift', 'text-align: center — markazlash', 'display: flex + gap + justify-content — menyu', 'padding — ichki bo\'shliq', 'margin — tashqi bo\'shliq', 'margin: 0 auto — kartani markazga'];
  const HOMEWORK = [{ b: "O'zgartiring", t: '— ranglarni o\'zingizga yoqqaniga almashtiring' }, { b: 'Sinab ko\'ring', t: '— keyingi darslarda: border-radius (dumaloq burchak), :hover (jonli tugma)' }, { b: 'Maqtaning', t: '— tayyor portfolioni do\'stlaringizga ko\'rsating' }];
  const GLOSSARY = [{ b: 'background-color', t: '— fon rangi' }, { b: 'color', t: '— matn rangi' }, { b: 'text-align', t: '— matn joylashuvi' }, { b: 'display: flex', t: '— bir qatorga tizish' }, { b: 'gap', t: '— flex oraliq' }, { b: 'justify-content', t: '— flex gorizontal joylash' }, { b: 'padding', t: '— ichki bo\'shliq' }, { b: 'margin', t: '— tashqi bo\'shliq' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Tugatish ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> CSS praktika tugadi</span><h2 className="title h-title fade-up d1">Siz <span className="italic" style={{ color: T.accent }}>dizayner</span> bo'ldingiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Zo\'r! Bir xil HTML\'dan faqat CSS bilan chiroyli, professional portfolio yasadingiz.' : 'Yaxshi harakat! Bir-ikki xususiyatni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bezay olasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.06}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🎨 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Portfolioni o'zingizniki qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">HTML struktura beradi, CSS go'zallik — endi ikkisini ham bilasiz! 🚀</p></div>
        </div>
        <div className="gloss fade-up d4"><div className="gloss-head" onClick={() => setOpen(o => !o)}><span className="lbl">💡 CSS xususiyatlari (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function CssPractice({ lang: langProp, onFinished }) {
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
    const finalAnswers = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean);
    const finalCorrect = finalAnswers.filter(a => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((_, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,500&family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
        .lesson-root h1,.lesson-root h2,.lesson-root h3,.lesson-root h4,.lesson-root h5,.lesson-root h6,.lesson-root p,.lesson-root ul,.lesson-root ol { margin: 0; padding: 0; }

        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip-wrong { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .chip:disabled { opacity: 0.55; cursor: not-allowed; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(12px,1.7vw,15px) clamp(14px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }

        .text-input { width: 100%; font-size: clamp(14px,1.8vw,16px); font-weight: 500; padding: 12px 14px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: box-shadow 0.2s; }
        .text-input:focus { box-shadow: 0 10px 22px -6px rgba(255,79,40,0.3), 0 0 0 1px rgba(255,79,40,0.2); }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.6; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.16); }
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

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

        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; background: none; padding: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* Kod ichidagi slot + chiplar + klikli qism (s2) */
        .slot { display: inline-block; min-width: 26px; padding: 0 7px; border-radius: 6px; background: rgba(255,79,40,0.20); box-shadow: inset 0 0 0 1.5px ${T.accent}; color: ${T.accent}; font-weight: 700; }
        .slot.filled { background: rgba(31,122,77,0.18); box-shadow: inset 0 0 0 1.5px ${T.success}; color: ${CODE.str}; }
        .fld-label { font-family: 'Manrope'; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${T.ink2}; }
        .tagpick { display: flex; flex-wrap: wrap; gap: 8px; }
        .cpart { cursor: pointer; padding: 2px 5px; border-radius: 6px; box-shadow: inset 0 0 0 1.5px transparent; transition: all 0.18s; }
        .cpart:hover { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.25); }
        .cpart.on { box-shadow: inset 0 0 0 1.5px currentColor; background: rgba(255,255,255,0.06); }
        .clegend { display: flex; flex-wrap: wrap; gap: 8px; }
        .ctab { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${T.ink2}; background: ${T.paper}; padding: 5px 11px; border-radius: 99px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); transition: all 0.2s; }
        .ctab.done { color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; }

        /* Yakuniy tekshiruv pillalari */
        .pill-row { display: flex; flex-wrap: wrap; gap: 7px; }
        .tagpill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${T.ink3}; background: ${T.paper}; padding: 5px 10px; border-radius: 99px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.14); transition: all 0.25s; }
        .tagpill.on { color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .tp-ic { width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; box-shadow: inset 0 0 0 1.5px ${T.ink3}; color: ${T.ink3}; }
        .tagpill.on .tp-ic { background: ${T.success}; color: #fff; box-shadow: none; }

        /* Yig'ish ro'yxati */
        .asm-list { display: flex; flex-direction: column; gap: 6px; }
        .asm-row { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 10px; padding: 9px 13px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.12); opacity: 0.5; transition: all 0.35s; }
        .asm-row.on { opacity: 1; box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .asm-ic { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; box-shadow: inset 0 0 0 2px ${T.ink3}; color: ${T.ink2}; transition: all 0.35s; }
        .asm-row.on .asm-ic { background: ${T.success}; color: #fff; box-shadow: inset 0 0 0 2px ${T.success}; }

        /* ============ PORTFOLIO JONLI KO'RINISHI (.pf) ============ */
        /* Bezaksiz (browser default) holat */
        .pf { font-family: 'Times New Roman', Times, serif; color: #111; line-height: 1.4; }
        .pf, .pf * { transition: background 0.4s ease, color 0.35s ease, padding 0.4s ease, margin 0.4s ease, text-align 0.3s ease, box-shadow 0.25s ease; }
        .pf header, .pf section, .pf footer { margin: 10px 0; }
        .pf h1 { font-size: 2em; font-weight: bold; margin: 0.3em 0 0.1em; }
        .pf h2 { font-size: 1.5em; font-weight: bold; margin: 0.4em 0 0.1em; }
        .pf p { margin: 0.4em 0; }
        .pf nav { display: block; margin: 6px 0; }
        .pf nav a { color: #0000ee; text-decoration: underline; margin-right: 12px; cursor: pointer; }
        .pf ul { padding-left: 28px; margin: 0.4em 0; list-style: disc outside; }
        .pf li { display: list-item; margin: 4px 0; }
        .pf li a, .pf .pf-email { color: #0000ee; text-decoration: underline; cursor: pointer; }
        .pf footer { color: #444; font-size: 0.85em; }

        /* page: fon + shrift (tashqi qatlam) */
        .pf-page { background: ${T.bg}; font-family: 'Manrope', sans-serif; color: ${T.ink}; padding: 16px; }
        .pf-page footer { text-align: center; color: ${T.ink3}; font-family: 'Manrope', sans-serif; font-size: 11px; margin-top: 12px; }
        /* center — oq karta, markazda (max-width + margin auto) */
        .pf-center .pf-inner { max-width: 300px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 14px 34px -12px rgba(${T.shadowBase},0.28); padding: 18px; }
        /* head: sarlavhalar */
        .pf-head .pf-header h1 { color: ${T.accent}; text-align: center; font-size: 1.6em; margin-bottom: 0; }
        .pf-head .pf-header p { text-align: center; color: ${T.ink2}; font-size: 0.95em; margin-top: 2px; }
        .pf-head h2 { color: ${T.ink}; font-size: 1.1em; border-bottom: 2px solid ${T.accentSoft}; padding-bottom: 3px; }
        /* nav: flex + gap + justify-content (CSS 2-dars) */
        .pf-nav .pf-header nav { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-top: 10px; }
        .pf-nav .pf-header nav a { color: ${T.accent}; text-decoration: none; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13px; margin: 0; }
        /* about: markaz + padding + dasturchi avatar */
        .pf-about .pf-sec-about { text-align: center; padding: 14px 10px; }
        .pf-about .pf-sec-about p { color: ${T.ink2}; font-family: 'Manrope', sans-serif; font-size: 13px; }
        /* list: loyiha kartalari (bg + padding + margin; list-style none bonus) */
        .pf-list .pf-sec-projects ul { list-style: none; padding: 0; margin: 8px 0 0; }
        .pf-list .pf-sec-projects li { background: #FBFAF7; border-radius: 10px; padding: 10px 13px; margin: 8px 0; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .pf-list .pf-sec-projects li a { color: ${T.ink}; text-decoration: none; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13.5px; }
        /* btn: aloqa tugmasi (bg + color + padding) */
        .pf-btn .pf-sec-contact { text-align: center; }
        .pf-btn .pf-sec-contact p { color: ${T.ink2}; font-family: 'Manrope', sans-serif; font-size: 13px; }
        .pf-btn .pf-sec-contact .pf-email { display: inline-block; background-color: ${T.accent}; color: #fff; text-decoration: none; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 14px; padding: 10px 20px; border-radius: 10px; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
