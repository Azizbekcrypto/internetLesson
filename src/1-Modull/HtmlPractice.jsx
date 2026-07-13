import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// HTML PRAKTIKA — PLATFORM STANDARD v15/v16
// O'quvchi o'z PORTFOLIO saytini HTML bilan quradi (bezaksiz — CSS keyingi darsda).
// Bo'limlar: Header · Men haqimda · Loyihalar · Aloqa · Footer (qisqa, skrolsiz).
// Markup toza va semantik — CSS praktikasida aynan shu struktura style qilinadi.
// Murojaat: O'quvchiga "SIZ" deb. Sarlavhalar — savol shaklida (metodika).
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

const LESSON_META = { lessonId: 'html-practice-portfolio-v1', lessonTitle: { uz: 'HTML Praktika — Portfolio sayt', ru: 'HTML практика — портфолио' } };
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
  { id: 's10', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's11', type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'build',       template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's14', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'test',        template: 'MCScreen', scored: true,  scope: 'final' },
  { id: 's17', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

// ===== Kichik yordamchi komponentlar =====
const Tg = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Sr = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
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

// ===== Portfolio ma'lumotlari va jonli "bezaksiz brauzer" ko'rinishi =====
const usePortfolio = (answers) => ({
  name: (answers?.[3]?.name || '').trim() || 'Aziza Karimova',
  role: (answers?.[3]?.role || '').trim() || 'Frontend dasturchi'
});
const firstName = (name) => (name.trim().split(/\s+/)[0] || 'aziza').toLowerCase().replace(/[^a-z]/g, '') || 'aziza';

// parts: 'header','nav','about','projects','contact','footer'
const SiteRender = ({ name, role, parts }) => {
  const has = (p) => parts.includes(p);
  return (
    <div className="raw">
      {has('header') && (
        <header>
          <h1>{name}</h1>
          <p>{role}</p>
          {has('nav') && (<nav><a>Men haqimda</a><a>Loyihalar</a><a>Aloqa</a></nav>)}
        </header>
      )}
      {has('header') && (has('about') || has('projects') || has('contact') || has('footer')) && <hr />}
      {has('about') && (
        <section>
          <h2>Men haqimda</h2>
          <span className="raw-img">🖼️ rasm</span>
          <p>Salom! Men HTML o'rganayotgan o'quvchiman.</p>
        </section>
      )}
      {has('projects') && (
        <section>
          <h2>Loyihalarim</h2>
          <ul><li><a>To-Do ilova</a></li><li><a>Ob-havo sayti</a></li></ul>
        </section>
      )}
      {has('contact') && (
        <section>
          <h2>Aloqa</h2>
          <p>Men bilan bog'lanish uchun:</p>
          <a>{firstName(name)}@gmail.com</a>
        </section>
      )}
      {has('footer') && <footer><p>© 2026 {name}</p></footer>}
    </div>
  );
};

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
  const audio = useAudio([{ id: 's0', text: `Nazariyani amalga aylantiramiz! Bugun siz o'zingizning portfolio saytingizni — shaxsiy saytingizni — noldan quryapsiz, faqat HTML bilan. Keyingi darsda esa uni CSS bilan chiroyli qilamiz. Avval ayting: portfolio sayt nima uchun kerak?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: "O'zingizni, ishlaringiz va aloqangizni bir joyda ko'rsatish uchun" },
    { id: 'b', label: 'Faqat dasturchilar ko‘radigan maxfiy sahifa uchun' },
    { id: 'c', label: "O'yin o'ynash uchun" }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Praktika · kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Boshlaymiz →" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 800 }}>O'zingizni dunyoga qanday <span className="italic" style={{ color: T.accent }}>tanishtirasiz</span>?</h1>
        <Mentor>Bugun siz o'zingizning <b style={{ color: T.ink }}>portfolio saytingizni</b> noldan quryapsiz — faqat HTML bilan. Keyingi darsda uni CSS bilan bezaymiz. Avval ayting: portfolio sayt nima uchun kerak?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">Dars oxirida — sizning saytingiz</p>
            <Preview title="portfolio.html" minH={160}>
              {picked !== null
                ? <div className="fade-step"><SiteRender name="Aziza Karimova" role="Frontend dasturchi" parts={['header', 'nav', 'about']} /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Hozircha bo'sh sahifa — uni birga to'ldiramiz…</p>}
            </Preview>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, portfolio nima uchun kerak?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Aniq! Portfolio — o'zingizni, ishlaringiz va aloqangizni bir joyda ko'rsatadigan shaxsiy sayt. Bugun shuni 0 dan quramiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Saytingiz 5 ta bo'limdan iborat bo'ladi: sarlavha — ismingiz va kasbingiz, men haqimda, loyihalar, aloqa va eng pastda footer. Har bir bo'limni birma-bir o'z qo'lingiz bilan quramiz. Va'da beraman: dars oxirida o'ngdagi saytni o'zingiz quryapsiz!`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Sarlavha — ism va kasb', tag: 'header' },
    { text: 'Men haqimda — rasm va matn', tag: 'section' },
    { text: 'Loyihalar — ishlaringiz', tag: 'ul / li' },
    { text: 'Aloqa — sizni topishlari uchun', tag: 'a' },
    { text: 'Footer — pastki qism', tag: 'footer' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const stepBtnRef = useRef(null);
  const scrollToBtn = () => { if (stepBtnRef.current) stepBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Tayyor sayt — dars oxirida shunday bo'ladi</p>
      <Preview title="portfolio.html" minH={200}>
        <SiteRender name="Aziza Karimova" role="Frontend dasturchi" parts={['header', 'nav', 'about', 'projects', 'contact', 'footer']} />
      </Preview>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">5 bo'lim</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{`<${s.tag.split(' ')[0]}>`}</span></span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Birinchi bo'limga →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Bu sayt sizni qanday <span className="italic" style={{ color: T.accent }}>tanishtiradi</span>?</h2></div>
        <Mentor>Har bir bo'limni birma-bir <b style={{ color: T.ink }}>o'z qo'lingiz bilan</b> quramiz. <b style={{ color: T.ink }}>Va'da beraman:</b> dars oxirida o'ngdagi saytni o'zingiz qura olasiz. Tayyor bo'lsangiz — boshladik! Sayt ustiga bosing</Mentor>
        {!isNarrow ? (<Split>{PreviewBlock}{StepsBlock}</Split>)
          : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)', cursor: 'pointer' }} onClick={scrollToBtn}>{PreviewBlock}<p className="small" style={{ margin: 0, color: T.ink2, textAlign: 'center', fontStyle: 'italic' }}>👆 Saytni bosing — keyin "5 bo'limni ko'rish"</p><button ref={stepBtnRef} className="btn" style={{ alignSelf: 'flex-start' }} onClick={(e) => { e.stopPropagation(); setShowSteps(true); }}>📋 5 bo'limni ko'rish</button></div>)
          : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Tayyor saytni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — SKELET =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Har qanday sayt — bu bloklar to'plami, ustma-ust joylashgan. Bizning saytimizning skeleti ham shunday: yuqorida sarlavha, o'rtada bo'limlar, eng pastida footer. Tugmani bosib, skeletni ko'ring — keyin har bir blokni HTML bilan to'ldiramiz.`, trigger: 'on_mount', waits_for: null }]);
  const BLOCKS = [
    { tag: 'header', l: 'Sarlavha (ism)' },
    { tag: 'section', l: 'Men haqimda' },
    { tag: 'section', l: 'Loyihalar' },
    { tag: 'section', l: 'Aloqa' },
    { tag: 'footer', l: 'Footer' }
  ];
  const [shown, setShown] = useState(!!storedAnswer);
  const done = shown;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Skelet" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Birinchi blokni quramiz →' : 'Skeletni ko’ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt <span className="italic" style={{ color: T.accent }}>nimalardan</span> tuzilgan?</h2></div>
        <Mentor>Har qanday sayt — <b style={{ color: T.ink }}>bloklar to'plami</b>, ustma-ust joylashgan. Yuqorida sarlavha, o'rtada bo'limlar, pastda footer. Tugmani bosing — skeletni ko'ramiz, keyin to'ldiramiz.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="skel-stack fade-up delay-2">
              {BLOCKS.map((b, i) => (
                <div key={i} className={`skel-block ${shown ? 'on' : ''}`} style={{ transitionDelay: `${i * 0.07}s` }}>
                  <span className="skel-tag">{`<${b.tag}>`}</span>
                  <span className="skel-l">{shown ? b.l : '…'}</span>
                </div>
              ))}
            </div>
            {!shown && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShown(true)}>🧱 Skeletni ko'rsatish</button>}
          </div>
          <div className="col">
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Asosiy:</b> sahifani bo'laklarga bo'lamiz. Har bo'lak — alohida teg: <span className="mono">{'<header>'}</span>, <span className="mono">{'<section>'}</span>, <span className="mono">{'<footer>'}</span>. Ularni birma-bir to'ldiramiz.</p></div>
            {shown && <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Skelet tayyor</p><p className="body" style={{ margin: 0, color: T.ink }}>Endi har bir bo'sh blokni teglar bilan to'ldiramiz. Birinchi — sarlavha (header).</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BUILD: HEADER (shaxsiy) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Birinchi blok — sarlavha. Bu yerda ikkita narsa bor: ismingiz va kasbingiz. Ismingizni eng katta sarlavha — h1 teg ichiga, kasbingizni esa oddiy matn — p teg ichiga yozamiz. Ismingiz va kasbingizni yozing, keyin "Headerni qo'shish" tugmasini bosing.`, trigger: 'on_mount', waits_for: null }]);
  const [name, setName] = useState(storedAnswer?.name ?? '');
  const [role, setRole] = useState(storedAnswer?.role ?? '');
  const [done, setDone] = useState(!!storedAnswer);
  const dispName = (name.trim() || 'Aziza Karimova');
  const dispRole = (role.trim() || 'Frontend dasturchi');
  const add = () => { setDone(true); onAnswer(screen, { correct: true, name: name.trim(), role: role.trim() }); };
  return (
    <Stage eyebrow="Build · Header" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Headerni qo'shing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytingiz qanday <span className="italic" style={{ color: T.accent }}>boshlanadi</span>?</h2></div>
        <Mentor>Eng yuqoridagi blok — <b style={{ color: T.ink }}>header</b>. Ismingizni <span className="mono">{'<h1>'}</span> (asosiy sarlavha), kasbingizni <span className="mono">{'<p>'}</span> (oddiy matn) ichiga yozamiz. To'ldiring va qo'shing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="build-in fade-up delay-2">
              <span className="fld-label">Ismingiz (h1)</span>
              <input className="text-input" value={name} placeholder="masalan: Aziza Karimova" onChange={e => setName(e.target.value)} />
              <span className="fld-label" style={{ marginTop: 4 }}>Kasbingiz / yo'nalishingiz (p)</span>
              <input className="text-input" value={role} placeholder="masalan: Frontend dasturchi" onChange={e => setRole(e.target.value)} />
            </div>
            <pre className="code-box fade-up delay-2"><Tg>{'<header>'}</Tg>{'\n  '}<Tg>{'<h1>'}</Tg>{dispName}<Tg>{'</h1>'}</Tg>{'\n  '}<Tg>{'<p>'}</Tg>{dispRole}<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'</header>'}</Tg></pre>
            {!done && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={add}>➕ Headerni qo'shish</button>}
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda (hozircha bezaksiz)</div>
            <Preview title="portfolio.html" minH={140}>
              {done ? <div className="fade-step"><SiteRender name={dispName} role={dispRole} parts={['header']} /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>"Headerni qo'shish" ni bosing — sarlavha shu yerda chiqadi</p>}
            </Preview>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">{'<h1>'}</span> — sahifadagi eng katta, eng muhim sarlavha. Bir sahifada bitta <span className="mono">{'<h1>'}</span> bo'ladi.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST (h1) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Sahifadagi eng katta, eng asosiy sarlavha qaysi teg bilan yoziladi?"
    questionText="Eng katta, asosiy sarlavha qaysi teg?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sahifadagi <span className="italic" style={{ color: T.accent }}>eng katta</span>, asosiy sarlavha (ismingiz) qaysi teg bilan yoziladi?</h2></>}
    options={['<p>', '<h1>', '<h6>', '<title>']} correctIdx={1}
    explainCorrect="To'g'ri! <h1> — sahifadagi eng katta va eng muhim sarlavha. Har sahifada bitta <h1> bo'ladi."
    explainWrong={{ 0: '<p> — oddiy matn (paragraf), sarlavha emas. Eng katta sarlavha — <h1>.', 2: '<h6> — eng kichik sarlavha. Eng kattasi — <h1>.', 3: '<title> — brauzer yorlig’idagi nom, sahifa ichida ko’rinmaydi. Asosiy sarlavha — <h1>.', default: 'Eng katta sarlavha — <h1>.' }} />
);

// ===== SCREEN 5 — BUILD: NAV =====
const Screen5 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Endi menyu qo'shamiz — bo'limlarga o'tadigan havolalar. Havola bosilsa, boshqa joyga olib boradigan teg — bu a, ya'ni anchor. To'g'ri tegni tanlang, menyu jonlanadi.`, trigger: 'on_mount', waits_for: null }]);
  const OPTS = ['<p>', '<a>', '<li>', '<img>'];
  const CORRECT = '<a>';
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === CORRECT;
  const pf = usePortfolio(answers);
  const pick = (o) => { if (solved) return; setPicked(o); if (o === CORRECT && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: o }); };
  return (
    <Stage eyebrow="Build · Navigatsiya" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To’g’ri tegni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bo'limlar orasida qanday <span className="italic" style={{ color: T.accent }}>yuriladi</span>?</h2></div>
        <Mentor>Header ichiga <b style={{ color: T.ink }}>menyu</b> qo'shamiz — bosilsa bo'limga o'tadigan havolalar. Bosiladigan havola tegi qaysi? Tanlang — bo'sh joy <span className="slot">?</span> to'ladi.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Tg>{'<nav>'}</Tg>{'\n  '}<span className={`slot ${solved ? 'filled' : ''}`}>{solved ? '<a href="#about">' : '<?>'}</span>Men haqimda<span className={`slot ${solved ? 'filled' : ''}`}>{solved ? '</a>' : '</?>'}</span>{'\n  '}<span style={{ opacity: 0.55 }}>{'… (yana 2 ta havola)'}</span>{'\n'}<Tg>{'</nav>'}</Tg></pre>
            <p className="fld-label">Bo'sh joyga qaysi teg mos keladi?</p>
            <div className="tagpick fade-up delay-3">
              {OPTS.map(o => { const isC = o === CORRECT; let cls = 'chip'; if (picked === o) cls += isC ? ' chip-on' : ' chip-wrong'; return (<button key={o} className={cls} disabled={solved} onClick={() => pick(o)}><span className="mono">{o}</span></button>); })}
            </div>
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko’ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <>Aniq! <span className="mono">{'<a>'}</span> (anchor) — bosiladigan havola. <span className="mono">href</span> atributi qayerga o'tishni ko'rsatadi.</> : 'Bu teg havola emas. Bosilganda boshqa joyga o’tkazadigan teg — anchor.'}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda</div>
            <Preview title="portfolio.html" minH={140}>
              {solved ? <div className="fade-step"><SiteRender name={pf.name} role={pf.role} parts={['header', 'nav']} /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>To'g'ri tegni tanlang — menyu havolalari paydo bo'ladi</p>}
            </Preview>
            {solved && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Havolalar hozir <b>ko'k va tagi chizilgan</b> — bu brauzerning standart ko'rinishi. CSS darsida ularni chiroyli qilamiz.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — TEST (a / havola) =====
const Screen6 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Boshqa sahifaga yoki bo'limga o'tkazadigan, bosiladigan havola qaysi teg bilan yaratiladi?"
    questionText="Bosiladigan havola qaysi teg?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Boshqa bo'lim yoki saytga o'tkazadigan, <span className="italic" style={{ color: T.accent }}>bosiladigan havola</span> qaysi teg bilan yaratiladi?</h2></>}
    options={['<nav>', '<p>', '<link>', '<a>']} correctIdx={3}
    explainCorrect="To'g'ri! <a> (anchor) — bosiladigan havola. href atributi qayerga o'tishni ko'rsatadi: <a href=…>."
    explainWrong={{ 0: '<nav> — menyuni o’rab turadigan idish. Ichidagi har bir havola — <a>.', 1: '<p> — oddiy matn. Bosiladigan havola — <a>.', 2: '<link> — boshqa narsa (masalan CSS fayl ulash) uchun. Ko’rinadigan havola — <a>.', default: 'Bosiladigan havola — <a> tegi.' }} />
);

// ===== SCREEN 7 — BUILD: ABOUT (img) =====
const Screen7 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Endi "Men haqimda" bo'limi. Bu yerda rasm bor — img teg orqali. Rasmga qaysi faylni ko'rsatishni src atributi aytadi. To'g'ri atributni tanlang, rasm joylashadi.`, trigger: 'on_mount', waits_for: null }]);
  const OPTS = ['href', 'src', 'alt', 'link'];
  const CORRECT = 'src';
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === CORRECT;
  const pf = usePortfolio(answers);
  const pick = (o) => { if (solved) return; setPicked(o); if (o === CORRECT && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: o }); };
  return (
    <Stage eyebrow="Build · Men haqimda" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To’g’ri atributni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'zingiz haqingizda qanday <span className="italic" style={{ color: T.accent }}>aytasiz</span>?</h2></div>
        <Mentor>Bu bo'lim <span className="mono">{'<section>'}</span> ichida: sarlavha <span className="mono">{'<h2>'}</span>, rasm <span className="mono">{'<img>'}</span> va matn <span className="mono">{'<p>'}</span>. Rasm fayliga qaysi atribut yo'l ko'rsatadi? Tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Tg>{'<section '}</Tg><At>id</At>=<Sr>"about"</Sr><Tg>{'>'}</Tg>{'\n  '}<Tg>{'<h2>'}</Tg>Men haqimda<Tg>{'</h2>'}</Tg>{'\n  '}<Tg>{'<img '}</Tg><span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'src' : '?'}</span>=<Sr>"rasm.jpg"</Sr> <At>alt</At>=<Sr>"Mening rasmim"</Sr><Tg>{'>'}</Tg>{'\n  '}<Tg>{'<p>'}</Tg>Salom! Men o'quvchiman.<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'</section>'}</Tg></pre>
            <p className="fld-label">Rasm fayliga qaysi atribut yo'l ko'rsatadi?</p>
            <div className="tagpick fade-up delay-3">
              {OPTS.map(o => { const isC = o === CORRECT; let cls = 'chip'; if (picked === o) cls += isC ? ' chip-on' : ' chip-wrong'; return (<button key={o} className={cls} disabled={solved} onClick={() => pick(o)}><span className="mono">{o}</span></button>); })}
            </div>
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko’ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">src</span> (source) — rasm faylining manzili. <span className="mono">alt</span> esa rasm yuklanmasa, o'rniga chiqadigan matn.</> : <>Bu atribut rasm manzilini ko'rsatmaydi. Manzil uchun — <span className="mono">src</span>.</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda</div>
            <Preview title="portfolio.html" minH={140}>
              {solved ? <div className="fade-step"><SiteRender name={pf.name} role={pf.role} parts={['about']} /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>To'g'ri atributni tanlang — bo'lim chiqadi</p>}
            </Preview>
            {solved && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">{'<img>'}</span> — yopiladigan jufti yo'q (bo'sh teg). U <span className="mono">src</span> (manzil) va <span className="mono">alt</span> (muqobil matn) atributlari bilan ishlaydi.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST (alt) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Rasm yuklanmasa yoki ko'rinmasa, uning o'rniga matn ko'rsatadigan atribut qaysi?"
    questionText="Rasm o'rniga matn ko'rsatadigan atribut?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Rasm yuklanmasa, uning o'rniga matn ko'rsatadigan (va ko'rish imkoni cheklanganlar uchun muhim) atribut qaysi?</h2></>}
    options={['src', 'href', 'alt', 'title']} correctIdx={2}
    explainCorrect="To'g'ri! alt (alternative) — rasm chiqmasa o'rniga ko'rsatiladigan matn. Ekran o'qigichlar ham shu matnni o'qiydi."
    explainWrong={{ 0: 'src — rasm faylining manzili. O’rniga matn esa — alt.', 1: 'href — bu havola (<a>) uchun. Rasm matni — alt.', 3: 'title — sichqoncha ustiga kelganda chiqadigan maslahat. Asosiy muqobil matn — alt.', default: 'Rasm o’rniga matn — alt atributi.' }} />
);

// ===== SCREEN 9 — BUILD: LOYIHALAR (ul / li + a) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's9', text: `Loyihalar bo'limini ro'yxat bilan yasaymiz. Tartibsiz ro'yxat — ul, va har bir loyiha alohida element — li ichida, bosish uchun havola — a bilan. Pastdagi loyihalarni bosib, ro'yxatga qo'shing. Kamida ikkita qo'shing.`, trigger: 'on_mount', waits_for: null }]);
  const POOL = ['To-Do ilova', 'Ob-havo sayti', 'Kalkulyator', 'Shaxsiy blog'];
  const [added, setAdded] = useState(storedAnswer?.added ?? []);
  const done = added.length >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, added }); }, [done, added]);
  const add = (s) => { if (added.includes(s)) return; setAdded(a => [...a, s]); };
  return (
    <Stage eyebrow="Build · Loyihalar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Yana ${2 - added.length} ta qo’shing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihalaringizni qanday <span className="italic" style={{ color: T.accent }}>ro'yxatlaysiz</span>?</h2></div>
        <Mentor>Loyihalar — ro'yxat: <span className="mono">{'<ul>'}</span> butun ro'yxat, ichida har biri <span className="mono">{'<li>'}</span>, va bosish uchun <span className="mono">{'<a>'}</span> havola. Pastdagi loyihalarni bosing — har biri yangi <span className="mono">{'<li>'}</span> bo'lib qo'shiladi.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <p className="fld-label">Loyiha qo'shing (kamida 2 ta)</p>
            <div className="tagpick fade-up delay-2">
              {POOL.map(s => (<button key={s} className={`chip ${added.includes(s) ? 'chip-on' : ''}`} disabled={added.includes(s)} onClick={() => add(s)}>{added.includes(s) ? '✓ ' : '+ '}{s}</button>))}
            </div>
            <pre className="code-box fade-up delay-3"><Tg>{'<ul>'}</Tg>{added.length === 0 ? <span style={{ opacity: 0.5 }}>{'\n  … loyiha qo’shing'}</span> : added.map((s, i) => (<React.Fragment key={i}>{'\n  '}<Tg>{'<li>'}</Tg><Tg>{'<a '}</Tg><At>href</At>=<Sr>"#"</Sr><Tg>{'>'}</Tg>{s}<Tg>{'</a>'}</Tg><Tg>{'</li>'}</Tg></React.Fragment>))}{'\n'}<Tg>{'</ul>'}</Tg></pre>
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda</div>
            <Preview title="portfolio.html" minH={140}>
              {added.length > 0 ? (
                <div className="raw fade-step"><h2>Loyihalarim</h2><ul>{added.map((s, i) => <li key={i}><a>{s}</a></li>)}</ul></div>
              ) : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Loyiha qo'shing — ro'yxat shu yerda o'sadi</p>}
            </Preview>
            {done && <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Ro'yxat tayyor</p><p className="body" style={{ margin: 0, color: T.ink }}>Har bir <span className="mono">{'<li>'}</span> — alohida loyiha, ichidagi <span className="mono">{'<a>'}</span> esa uni ochadigan havola.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST (ul/ol) =====
const Screen10 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    audioText="Tartibi muhim bo'lmagan, nuqtali ro'yxat qaysi teg bilan yaratiladi?"
    questionText="Tartibsiz (nuqtali) ro'yxat qaysi teg?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Loyihalar ro'yxatida tartib muhim emas. <span className="italic" style={{ color: T.accent }}>Tartibsiz (nuqtali)</span> ro'yxat qaysi teg bilan yaratiladi?</h2></>}
    options={['<ol>', '<ul>', '<li>', '<dl>']} correctIdx={1}
    explainCorrect="To'g'ri! <ul> (unordered list) — tartibsiz, nuqtali ro'yxat. Ichidagi har bir element — <li>."
    explainWrong={{ 0: '<ol> (ordered list) — raqamli, tartibli ro’yxat. Nuqtalisi — <ul>.', 2: '<li> — ro’yxat elementi. Uni o’rab turadigan idish — <ul>.', 3: '<dl> — boshqa tur (ta’rif ro’yxati). Oddiy nuqtali ro’yxat — <ul>.', default: 'Nuqtali ro’yxat — <ul>.' }} />
);

// ===== SCREEN 11 — BUILD: ALOQA (mailto) =====
const Screen11 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Portfolioning eng muhim qismi — sizni qanday topishlari. Aloqa bo'limiga email havolasini qo'yamiz. Bosilganda pochta dasturi ochilishi uchun manzil oldiga maxsus belgi yoziladi. Qaysi biri? Tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const OPTS = ['http://', 'mailto:', 'tel:', '#'];
  const CORRECT = 'mailto:';
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === CORRECT;
  const pf = usePortfolio(answers);
  const pick = (o) => { if (solved) return; setPicked(o); if (o === CORRECT && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: o }); };
  return (
    <Stage eyebrow="Build · Aloqa" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'To’g’ri variantni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizni qanday <span className="italic" style={{ color: T.accent }}>topishadi</span>?</h2></div>
        <Mentor>Portfolioning eng muhim qismi — odamlar siz bilan <b style={{ color: T.ink }}>bog'lana olishi</b>. Email havolasini qo'yamiz: bosilganda pochta dasturi ochilishi uchun <span className="mono">href</span> ichida manzil oldiga maxsus belgi qo'yiladi. Qaysi biri?</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><Tg>{'<section '}</Tg><At>id</At>=<Sr>"contact"</Sr><Tg>{'>'}</Tg>{'\n  '}<Tg>{'<h2>'}</Tg>Aloqa<Tg>{'</h2>'}</Tg>{'\n  '}<Tg>{'<a '}</Tg><At>href</At>=<Sr>"</Sr><span className={`slot ${solved ? 'filled' : ''}`}>{solved ? 'mailto:' : '?'}</span><Sr>{firstName(pf.name)}@gmail.com"</Sr><Tg>{'>'}</Tg>Email<Tg>{'</a>'}</Tg>{'\n'}<Tg>{'</section>'}</Tg></pre>
            <p className="fld-label">Email manzili oldiga nima qo'yiladi?</p>
            <div className="tagpick fade-up delay-3">
              {OPTS.map(o => { const isC = o === CORRECT; let cls = 'chip'; if (picked === o) cls += isC ? ' chip-on' : ' chip-wrong'; return (<button key={o} className={cls} disabled={solved} onClick={() => pick(o)}><span className="mono">{o}</span></button>); })}
            </div>
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko’ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">mailto:</span> — email havolasi. Bosilsa, pochta dasturi shu manzilga (masalan <span className="mono">{firstName(pf.name)}@gmail.com</span>) xat yozish uchun ochiladi.</> : <>Bu email uchun emas. Email havolasi <span className="mono">mailto:</span> bilan boshlanadi.</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda</div>
            <Preview title="portfolio.html" minH={140}>
              {solved ? <div className="fade-step"><SiteRender name={pf.name} role={pf.role} parts={['contact']} /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>To'g'ri variantni tanlang — aloqa bo'limi chiqadi</p>}
            </Preview>
            {solved && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu havola <b>gmail.com</b> bilan ham, istalgan pochta bilan ham ishlaydi — <span className="mono">mailto:</span> har qanday email manziliga mos keladi.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — BUILD: FOOTER =====
const Screen12 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's12', text: `Oxirgi blok — footer, ya'ni sahifaning pastki qismi. Bu yerda odatda mualliflik belgisi va yil yoziladi. Footer uchun qaysi teg ishlatiladi? Tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const OPTS = ['<header>', '<footer>', '<section>', '<main>'];
  const CORRECT = '<footer>';
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === CORRECT;
  const pf = usePortfolio(answers);
  const pick = (o) => { if (solved) return; setPicked(o); if (o === CORRECT && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: o }); };
  return (
    <Stage eyebrow="Build · Footer" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Saytni yig’amiz →' : 'To’g’ri tegni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sahifa qanday <span className="italic" style={{ color: T.accent }}>yakunlanadi</span>?</h2></div>
        <Mentor>Eng pastki blok — <b style={{ color: T.ink }}>footer</b> ("oyoq" degani). Bu yerda mualliflik <span className="mono">©</span> va yil yoziladi. Pastki qism uchun qaysi teg? Tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2"><span className={`slot ${solved ? 'filled' : ''}`}>{solved ? '<footer>' : '<?>'}</span>{'\n  '}<Tg>{'<p>'}</Tg>© 2026 {pf.name}<Tg>{'</p>'}</Tg>{'\n'}<span className={`slot ${solved ? 'filled' : ''}`}>{solved ? '</footer>' : '</?>'}</span></pre>
            <p className="fld-label">Sahifaning pastki qismi qaysi teg?</p>
            <div className="tagpick fade-up delay-3">
              {OPTS.map(o => { const isC = o === CORRECT; let cls = 'chip'; if (picked === o) cls += isC ? ' chip-on' : ' chip-wrong'; return (<button key={o} className={cls} disabled={solved} onClick={() => pick(o)}><span className="mono">{o}</span></button>); })}
            </div>
            <FeedbackBlock show={picked !== null} isCorrect={solved}>
              <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : 'Yana urinib ko’ring'}</p>
              <p className="body" style={{ margin: 0 }}>{solved ? <><span className="mono">{'<footer>'}</span> — sahifaning eng pastki, yakuniy qismi. Mualliflik, yil va aloqa shu yerga joylashadi.</> : <>Bu teg pastki qism uchun emas. Sahifa "oyog'i" — <span className="mono">{'<footer>'}</span>.</>}</p>
            </FeedbackBlock>
          </div>
          <div className="col">
            <div className="flow-label">Brauzerda</div>
            <Preview title="portfolio.html" minH={140}>
              {solved ? <div className="fade-step"><SiteRender name={pf.name} role={pf.role} parts={['footer']} /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>To'g'ri tegni tanlang — footer chiqadi</p>}
            </Preview>
            {solved && <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Barcha bo'limlar tayyor</p><p className="body" style={{ margin: 0, color: T.ink }}>5 blok ham qurildi! Endi hammasini bitta sahifaga yig'amiz.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — TEST (footer) =====
const Screen13 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 5-savol"
    audioText="Sahifaning eng pastida, mualliflik va yil joylashadigan qism qaysi teg bilan belgilanadi?"
    questionText="Sahifaning eng pastki qismi qaysi teg?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sahifaning <span className="italic" style={{ color: T.accent }}>eng pastida</span> (mualliflik ©, yil) joylashadigan qism qaysi teg bilan belgilanadi?</h2></>}
    options={['<header>', '<nav>', '<section>', '<footer>']} correctIdx={3}
    explainCorrect="To'g'ri! <footer> — sahifaning eng pastki, yakuniy qismi: mualliflik, yil, aloqa. Nomi ham 'oyoq' (foot) degani."
    explainWrong={{ 0: '<header> — aksincha, eng yuqoridagi qism (sarlavha). Pastdagi — <footer>.', 1: '<nav> — menyu (havolalar). Pastki qism — <footer>.', 2: '<section> — oddiy bo’lim. Maxsus pastki qism — <footer>.', default: 'Eng pastki qism — <footer>.' }} />
);

// ===== SCREEN 14 — DEBUGGING (o'quvchi xatoni o'zi topadi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Endi siz teglarni bilasiz — demak xatoni ham topa olasiz. AI "Men haqimda" bo'limingiz uchun kod yozdi, lekin bitta xato qoldirdi: bir teg ochilgan, ammo yopilmagan. Qaysi qatorda? Bosib toping.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'p' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'p';
  const done = fixed;
  const pickP = () => {
    if (found) return; setPicked('p'); audio.triggerEvent('error_found');
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! <p> ochildi, lekin </p> bilan yopilmagan. Endi yopuvchi tegni qo'shib tuzatamiz.`); }, 300);
  };
  const fix = () => {
    setFixed(true);
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Mana, debugging shunday bo'ladi: xatoni topasiz va to'g'rilaysiz.`); }, 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI kod yozdi — siz uni <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI kod yozishda zo'r yordamchi. Lekin <b style={{ color: T.ink }}>odamlar ham, AI ham</b> ba'zan kichik xato qiladi. Shuni topib tuzatish — <b style={{ color: T.ink }}>debugging</b> deyiladi, va bu eng zo'r mahorat. AI yozgan kodda bitta teg yopilmagan — qaysi qatorda? Bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana, "Men haqimda" bo'limi tayyor!</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'h2' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('h2'); }}><span className="tg">&lt;h2&gt;</span>Men haqimda<span className="tg">&lt;/h2&gt;</span></div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickP}><span className="tg">&lt;p&gt;</span>Men 15 yoshdaman.{fixed && <span className="tg">&lt;/p&gt;</span>}</div>
              </div>
              {!found && <p className="ai-prompt">Xato qaysi qatorda? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Yopuvchi {'</p>'} tegini qo'shish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi kod to'g'ri!</p>}
            </div>
          </div>
          <div className="col">
            {!found && (
              picked === 'h2'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — <span className="mono">{'<h2>'}</span> ochildi va <span className="mono">{'</h2>'}</span> bilan yopildi. Yana qarang: qaysi teg yopilmagan?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Endi siz teglarni bilasiz — AI yozgan kodni <b style={{ color: T.ink }}>tekshira olasiz</b>. Qaysi teg ochilib, yopilmagan?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">{'<p>'}</span> ochildi, lekin <span className="mono">{'</p>'}</span> bilan yopilmagan. Chap tomondagi tugmani bosib tuzating →</p></div>)}
            {fixed && (<>
              <div className="flow-label">Endi sahifa to'g'ri ishlaydi</div>
              <Preview title="portfolio.html" minH={110}><div className="raw fade-step"><h2>Men haqimda</h2><p>Men 15 yoshdaman.</p></div></Preview>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>
            </>)}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YIG'ISH (to'liq portfolio) =====
const Screen15 = ({ screen, answers, storedAnswer, onAnswer, onNext, onPrev }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's15', text: `Mana eng zo'r qismi — barcha bloklarni bitta sahifaga yig'amiz. Tugmani bosing va o'z portfolio saytingiz to'liq ko'rinishda paydo bo'lsin. Hozir u bezaksiz, oddiy — bu normal. Keyingi darsda CSS bilan uni chiroyli qilamiz.`, trigger: 'on_mount', waits_for: null }]);
  const ALL = ['header', 'nav', 'about', 'projects', 'contact', 'footer'];
  const isNarrow = useIsMobile(768);
  const [built, setBuilt] = useState(storedAnswer ? ALL : []);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const endRef = useRef(null);
  const done = built.length >= ALL.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const followDown = () => { if (!isNarrow) return; requestAnimationFrame(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }); };
  const assemble = () => {
    clearTimeout(timer.current); setBuilt([]); setRunning(true);
    const tick = (i) => { setBuilt(ALL.slice(0, i)); followDown(); if (i < ALL.length) timer.current = setTimeout(() => tick(i + 1), 460); else setRunning(false); };
    timer.current = setTimeout(() => tick(1), 250);
  };
  return (
    <Stage eyebrow="Saytni yig'ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Yakuniy savol →' : 'Avval saytni yig’ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasini bitta <span className="italic" style={{ color: T.accent }}>saytga</span> yig'amizmi?</h2></div>
        <Mentor>Mana eng zo'r qismi! Tugmani bosing — barcha bloklar <b style={{ color: T.ink }}>birma-bir</b> yig'ilib, sizning to'liq portfolio saytingiz paydo bo'ladi. Bezaksiz — bu normal, CSS keyin.</Mentor>
        <Zoomable>
        <div className="split" style={{ alignItems: 'stretch' }}>
          <div className="col">
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={assemble} disabled={running}>{running ? 'Yig’ilmoqda…' : (done ? '↻ Yana yig’ish' : '▶ Saytni yig’ish')}</button>
            <div className="asm-list fade-up delay-2">
              {ALL.map((p, i) => (<div key={p} className={`asm-row ${built.includes(p) ? 'on' : ''}`}><span className="asm-ic">{built.includes(p) ? '✓' : (i + 1)}</span><span className="mono small">{`<${p}>`}</span></div>))}
            </div>
            {done && <div className="frame-success fade-step" style={{ marginTop: 'auto' }}><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Sayt tayyor!</p><p className="body" style={{ margin: 0, color: T.ink }}>Bu — to'liq <b>HTML</b> bilan qurilgan, ishlaydigan sayt. Keyingi darsda CSS bilan ranglar va chiroyli ko'rinish beramiz.</p></div>}
          </div>
          <div className="col">
            <div className="flow-label">{pf.name} — portfolio.html</div>
            <Preview title="portfolio.html" minH={210}>
              {built.length > 0 ? <SiteRender name={pf.name} role={pf.role} parts={built} />
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>"Saytni yig'ish" ni bosing — to'liq saytingiz shu yerda paydo bo'ladi</p>}
            </Preview>
            <div ref={endRef} aria-hidden="true" />
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUNIY TEST =====
const Screen16 = (props) => (
  <QuestionScreen {...props} scope="final" eyebrow="Yakuniy savol"
    audioText="Portfolio sahifangiz to'g'ri tartibda qanday joylashadi? Yuqoridan pastga qarab."
    questionText="Bo'limlar to'g'ri tartibi qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Butun saytni eslang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Portfolio sahifangiz <span className="italic" style={{ color: T.accent }}>yuqoridan pastga</span> qanday tartibda joylashadi?</h2></>}
    options={['Footer → Header → Men haqimda → Loyihalar → Aloqa', 'Men haqimda → Header → Loyihalar → Aloqa → Footer', 'Header → Men haqimda → Loyihalar → Aloqa → Footer', 'Header → Loyihalar → Men haqimda → Footer → Aloqa']} correctIdx={2}
    explainCorrect="To'g'ri! Yuqorida header (ism), keyin bo'limlar (men haqimda, loyihalar, aloqa), eng pastda footer."
    explainWrong={{ 0: 'Footer eng pastda bo’lishi kerak, yuqorida emas. Header — birinchi.', 1: 'Header birinchi bo’ladi — "Men haqimda" undan keyin keladi.', 3: 'Boshlanishi to’g’ri, lekin Footer eng oxirida bo’lishi kerak.', default: 'To’g’ri tartib: Header → bo’limlar → Footer.' }} />
);

// ===== SCREEN 17 — YAKUN =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const pf = usePortfolio(answers);
  const audio = useAudio([{ id: 's17', text: "Tabriklayman! Siz o'z qo'lingiz bilan to'liq portfolio saytini HTML bilan qurdingiz: header, navigatsiya, men haqimda, loyihalar, aloqa va footer. Hozir u bezaksiz. Keyingi darsda esa aynan shu saytga CSS bilan jon kiritamiz — ranglar, shriftlar, chiroyli joylashuv. Tayyor bo'ling!", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['header — sahifa sarlavhasi (ism, kasb)', 'h1, h2 — sarlavhalar bosqichi', 'nav va a — menyu havolalari', 'section — alohida bo’limlar', 'img (src, alt) — rasm', 'ul va li — ro’yxat', 'a + mailto — email havola', 'footer — pastki qism'];
  const HOMEWORK = [{ b: "O'zgartiring", t: '— loyihalar ro’yxatiga yana bitta ish qo’shing' }, { b: "To'ldiring", t: '— "Men haqimda" matnini o’zingiz haqingizda yozing' }, { b: 'Tayyorlaning', t: '— keyingi darsda shu saytga CSS beramiz' }];
  const GLOSSARY = [{ b: 'header', t: '— yuqori, sarlavha qismi' }, { b: 'nav', t: '— menyu (havolalar)' }, { b: 'section', t: '— mavzuli bo’lim' }, { b: 'img', t: '— rasm (src, alt)' }, { b: 'ul / li', t: '— ro’yxat' }, { b: 'a', t: '— havola (href, mailto)' }, { b: 'footer', t: '— pastki qism' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>CSS bilan bezashni boshlash →</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> HTML praktika tugadi</span><h2 className="title h-title fade-up d1">{pf.name} — <span className="italic" style={{ color: T.accent }}>portfolio</span> tayyor.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Zo’r! Siz to’liq saytni HTML bilan o’z qo’lingiz bilan qurdingiz.' : 'Yaxshi harakat! Bir-ikki tegni mustahkamlash uchun darsni qayta ko’ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz qura olasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.06}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🔧 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Saytingizni o'zingizniki qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda aynan shu portfolioga CSS bilan jon kiritamiz! 🎨</p></div>
        </div>
        <div className="gloss fade-up d4"><div className="gloss-head" onClick={() => setOpen(o => !o)}><span className="lbl">💡 Teglar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function HtmlPractice({ lang: langProp, onFinished }) {
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
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
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
        .bp-body ul { list-style-type: disc; list-style-position: outside; padding-left: 24px; }
        .bp-body li { display: list-item; }

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

        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .text-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); font-weight: 500; padding: 11px 13px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: box-shadow 0.2s; }
        .text-input:focus { box-shadow: 0 10px 22px -6px rgba(255,79,40,0.3), 0 0 0 1px rgba(255,79,40,0.2); }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.55; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

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
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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

        /* ============ HTML PRAKTIKA — qo'shimcha ============ */
        /* Bezaksiz "xom" brauzer ko'rinishi (browser default) */
        .raw { font-family: 'Times New Roman', Times, serif; color: #111; line-height: 1.4; }
        .raw h1 { font-size: 2em; font-weight: bold; margin: 0.4em 0 0.2em; }
        .raw h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0 0.2em; }
        .raw p { margin: 0.5em 0; }
        .raw nav { display: flex; gap: 14px; flex-wrap: wrap; margin: 6px 0; }
        .raw a { color: #0000ee; text-decoration: underline; cursor: pointer; }
        .raw ul { padding-left: 28px; margin: 0.4em 0; list-style: disc outside; }
        .raw li { display: list-item; margin: 2px 0; }
        .raw hr { border: none; border-top: 1px solid #cfcfcf; margin: 10px 0; }
        .raw section { margin: 10px 0; }
        .raw footer { margin-top: 12px; color: #444; font-size: 0.85em; }
        .raw-img { display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 92px; height: 64px; background: #e9e9e9; border: 1px solid #c2c2c2; color: #777; font-family: 'Manrope', sans-serif; font-size: 11px; margin: 4px 0; }

        /* Kod ichidagi to'ldiriladigan bo'sh joy (slot) */
        .slot { display: inline-block; min-width: 30px; padding: 0 7px; border-radius: 6px; background: rgba(255,79,40,0.20); box-shadow: inset 0 0 0 1.5px ${T.accent}; color: ${T.accent}; font-weight: 700; }
        .slot.filled { background: rgba(31,122,77,0.18); box-shadow: inset 0 0 0 1.5px ${T.success}; color: ${CODE.str}; }

        .build-in { display: flex; flex-direction: column; gap: 7px; }
        .fld-label { font-family: 'Manrope'; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${T.ink2}; }
        .tagpick { display: flex; flex-wrap: wrap; gap: 8px; }

        /* Skelet bloklari */
        .skel-stack { display: flex; flex-direction: column; gap: 7px; }
        .skel-block { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border: 1.5px dashed ${T.ink3}; border-radius: 10px; padding: 11px 14px; opacity: 0.5; transition: all 0.4s; }
        .skel-block.on { opacity: 1; border-style: solid; border-color: ${T.accent}40; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .skel-tag { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 9px; border-radius: 6px; flex-shrink: 0; }
        .skel-l { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; }

        /* Yig'ish ro'yxati */
        .asm-list { display: flex; flex-direction: column; gap: 6px; }
        .asm-row { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 10px; padding: 9px 13px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.12); opacity: 0.5; transition: all 0.35s; }
        .asm-row.on { opacity: 1; box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .asm-ic { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; box-shadow: inset 0 0 0 2px ${T.ink3}; color: ${T.ink2}; transition: all 0.35s; }
        .asm-row.on .asm-ic { background: ${T.success}; color: #fff; box-shadow: inset 0 0 0 2px ${T.success}; }

        /* AI debugging kartasi */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; }
        .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; }
        .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 4px 7px; border-radius: 6px; transition: all 0.15s; }
        .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line .tg { color: ${CODE.tag}; }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; }
        .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
