import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png';

// ============================================================
// NEST ARXITEKTURA MODULI · DARS 2 — BIRINCHI RESURSNI QO'LDA QO'SHISH — PLATFORM STANDARD v18 (AUDIOSIZ)
// Domen: AVTOSALON. Dars 1'dagi admin endi mashinalarni (Car) boshqaradi. O'quvchi mashinalar resursini noldan qo'shadi.
// Sikl: Entity → DTO → Service (BaseService) → Controller → Module → AppModule'ga ulash. Repo: github.com/Azizbekcrypto/IntroNestArxitechture.
// Birlashtiruvchi analogiya: RESTORAN (layerlar) — controller=ofitsiant, dto=anketa, service=oshpaz, baseservice=tayyor retsept, entity=ombor shakli, module=bo'lim.
// Pedagogika: I-DO (Dars 1) → WE-DO (shu dars) → YOU-DO (Praktika). Har qadamda "💬 Agentni shunday yo'naltiring" — Praktikaga ko'prik (prompt playbook).
// SARLAVHALAR: darak gap emas — global/qiziqarli SAVOL (namunaviy darslardek). "resurs" so'zi bir marta sodda ta'riflanadi, qolganda "mashinalar jadvali".
// Eng ko'p unutiladigan xato beat (s13): CarModule'ni AppModule'ga ulash — usiz /car = 404.
// SIFAT: variantlar STATIK tartibda (placeCorrect o'chirilgan — jonli kalit bilan to'qnashmaydi), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309', nest: '#E0234E',
  line: '#E9E6DF',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

// ============================================================
// JONLI SESSIYA INFRA — InternetLesson/DataIntro bilan bir xil (liveRpc/useLiveSession/LiveGate)
// ============================================================
const LIVE_SUPABASE_URL = 'https://dwoubexcexzsinogojiu.supabase.co';
const LIVE_SUPABASE_KEY = 'sb_publishable_cijLMhCDDdo6dlXs05thyw__oH-YgKX';
const LIVE_ENABLED = !!(LIVE_SUPABASE_URL && LIVE_SUPABASE_KEY);
const LIVE_POLL_MS = 2500, LIVE_POLL_MAX_MS = 15000, LIVE_HEARTBEAT_MS = 10000, LIVE_STALE_MS = 60000;
const LT = { bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2', paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', success: '#1F7A4D' };
const _liveHdr = { apikey: LIVE_SUPABASE_KEY, Authorization: `Bearer ${LIVE_SUPABASE_KEY}` };
async function liveRpc(fn, body) {
  const r = await fetch(`${LIVE_SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { ..._liveHdr, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  if (!r.ok) {
    let msg = '';
    try { msg = JSON.parse(await r.text()).message || ''; } catch {}
    throw new Error(msg || `${fn}: ${r.status}`);
  }
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function liveGet(pin) {
  const r = await fetch(`${LIVE_SUPABASE_URL}/rest/v1/live_sessions?pin=eq.${encodeURIComponent(pin)}&select=lesson_id,max_screen,status,updated_at,quiz_state,quiz_q,quiz_started_at,reveal_screen`, { headers: _liveHdr });
  if (!r.ok) throw new Error(`get: ${r.status}`);
  const rows = await r.json(); return (rows && rows[0]) || null;
}
const _lsKey = (id) => `liveSession:${id}`;
const liveRead = (id) => { try { return JSON.parse(localStorage.getItem(_lsKey(id)) || 'null'); } catch { return null; } };
const liveStore = (id, o) => { try { localStorage.setItem(_lsKey(id), JSON.stringify(o)); } catch {} };
const liveClear = (id) => { try { localStorage.removeItem(_lsKey(id)); } catch {} };
const fmtPin = (p) => (p ? String(p).replace(/(\d{3})(\d{3})/, '$1 $2') : '');
// Nickname — qurilma bo'ylab BITTA (darsga bog'lanmagan kalit)
const LIVE_NICK_KEY = 'liveNickname';
const nickRead = () => { try { return localStorage.getItem(LIVE_NICK_KEY) || ''; } catch { return ''; } };
const nickStore = (n) => { try { localStorage.setItem(LIVE_NICK_KEY, n); } catch {} };
async function liveList(path) {
  const r = await fetch(`${LIVE_SUPABASE_URL}/rest/v1/${path}`, { headers: _liveHdr });
  if (!r.ok) throw new Error(`list: ${r.status}`);
  return r.json();
}
const livePlayers = (pin) => liveList(`live_players?pin=eq.${encodeURIComponent(pin)}&select=id,nickname,joined_at&order=joined_at.asc`);
// screenIdx berilmasa — faqat DARS javoblari (<100); arena 100+, praktika 500+ zonada
const liveAnswers = (pin, screenIdx) => liveList(`live_answers?pin=eq.${encodeURIComponent(pin)}${screenIdx == null ? '&screen_idx=lt.100' : `&screen_idx=eq.${screenIdx}`}&select=player_id,screen_idx,picked,correct,elapsed_ms`);
const liveQuizAnswers = (pin) => liveList(`live_answers?pin=eq.${encodeURIComponent(pin)}&screen_idx=gte.100&select=player_id,screen_idx,picked,correct,elapsed_ms`);

function useLiveSession(lessonId, answerKey) {
  const keyRef = useRef(answerKey); keyRef.current = answerKey; // javob kaliti — mentor sessiya ochganda serverga yuklanadi
  const initRef = useRef(undefined);
  if (initRef.current === undefined) initRef.current = LIVE_ENABLED ? liveRead(lessonId) : null;
  const init = initRef.current;
  const [mode, setMode] = useState(() => {
    if (!LIVE_ENABLED) return 'self';
    if (init?.mode === 'self') return 'self';
    if (init?.mode === 'student') return 'student';
    if (init?.mode === 'mentor') return 'mentor';
    return 'choosing';
  });
  const [pin, setPin] = useState(init?.pin || null);
  const tokenRef = useRef(init?.token || null);
  const playerRef = useRef(init?.playerId ? { id: init.playerId, token: init.playerToken } : null);
  const nickRef = useRef(init?.nickname || '');
  const [mentorScreen, setMentorScreen] = useState(init?.lastScreen || 0);
  const [status, setStatus] = useState('live');
  const [mentorAlive, setMentorAlive] = useState(true);
  const [connected, setConnected] = useState(true);
  const [ended, setEnded] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [quiz, setQuiz] = useState({ state: 'off', q: -1 });
  const [revealScreen, setRevealScreen] = useState(-1); // Kahoot-reveal: mentor natijasini ochgan ekran
  const lastSeenRef = useRef(Date.now());
  const lastUpdatedRef = useRef(null);
  const syncQuiz = useCallback((row) => {
    const qs = row?.quiz_state || 'off', qq = row?.quiz_q ?? -1;
    setQuiz(p => (p.state === qs && p.q === qq) ? p : { state: qs, q: qq });
    const rv = row?.reveal_screen ?? -1;
    setRevealScreen(p => p === rv ? p : rv);
  }, []);

  // O'QUVCHI: visibility-aware + backoff polling
  useEffect(() => {
    if (mode !== 'student' || !pin) return;
    let on = true, timer = null, delay = LIVE_POLL_MS;
    const schedule = () => { if (on) timer = setTimeout(tick, delay); };
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) { schedule(); return; }
      try {
        const row = await liveGet(pin);
        if (!on) return;
        delay = LIVE_POLL_MS; setConnected(true);
        if (!row) { setStatus(p => p === 'ended' ? p : 'ended'); schedule(); return; }
        setMentorScreen(p => p === row.max_screen ? p : row.max_screen);
        setStatus(p => p === row.status ? p : row.status);
        syncQuiz(row);
        if (row.updated_at !== lastUpdatedRef.current) { lastUpdatedRef.current = row.updated_at; lastSeenRef.current = Date.now(); liveStore(lessonId, { mode: 'student', pin, lastScreen: row.max_screen, playerId: playerRef.current?.id, playerToken: playerRef.current?.token, nickname: nickRef.current }); }
        const alive = Date.now() - lastSeenRef.current < LIVE_STALE_MS;
        setMentorAlive(p => p === alive ? p : alive);
      } catch { if (!on) return; setConnected(false); delay = Math.min(delay * 2, LIVE_POLL_MAX_MS); }
      schedule();
    };
    tick();
    const onVis = () => { if (!document.hidden) { clearTimeout(timer); delay = LIVE_POLL_MS; tick(); } };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    return () => { on = false; clearTimeout(timer); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); };
  }, [mode, pin, lessonId]); // eslint-disable-line

  // MENTOR: heartbeat + o'lik sessiya tekshiruvi
  useEffect(() => {
    if (mode !== 'mentor' || !pin) return;
    let on = true;
    liveGet(pin).then(row => {
      if (!on) return;
      if (!row || row.status === 'ended') { liveClear(lessonId); setPin(null); tokenRef.current = null; setMode('choosing'); setEnded(false); return; }
      syncQuiz(row);
    }).catch(() => {});
    const id = setInterval(() => { liveRpc('session_heartbeat', { p_pin: pin, p_token: tokenRef.current }).catch(() => {}); }, LIVE_HEARTBEAT_MS);
    return () => { on = false; clearInterval(id); };
  }, [mode, pin, lessonId]); // eslint-disable-line

  const startMentor = useCallback(async (mentorCode) => {
    setBusy(true); setJoinError('');
    try {
      const res = await liveRpc('create_session', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim() });
      const row = Array.isArray(res) ? res[0] : res;
      if (!row?.pin) throw new Error('no pin');
      tokenRef.current = row.token; setPin(row.pin); setMode('mentor'); setEnded(false);
      liveStore(lessonId, { mode: 'mentor', pin: row.pin, token: row.token });
      if (keyRef.current) liveRpc('set_quiz_keys', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim(), p_keys: keyRef.current }).catch(() => {});
    } catch { setJoinError("Mentor kodi noto'g'ri yoki ulanishda xato."); }
    finally { setBusy(false); }
  }, [lessonId]);

  const joinStudent = useCallback(async (raw, rawNick) => {
    const p = (raw || '').replace(/\D/g, '');
    const nick = (rawNick || '').trim();
    if (p.length < 4) { setJoinError("Kodni to'liq kiriting."); return; }
    if (nick.length < 2) { setJoinError('Ismingizni kiriting (kamida 2 harf).'); return; }
    setBusy(true); setJoinError('');
    try {
      const row = await liveGet(p);
      if (!row) { setJoinError('Bunday kod topilmadi.'); setBusy(false); return; }
      if (row.lesson_id && row.lesson_id !== lessonId) { setJoinError('Bu kod boshqa darsga tegishli.'); setBusy(false); return; }
      if (row.status !== 'live') { setJoinError('Bu dars allaqachon yakunlangan.'); setBusy(false); return; }
      const res = await liveRpc('join_session', { p_pin: p, p_nickname: nick });
      const player = Array.isArray(res) ? res[0] : res;
      if (!player?.player_id) throw new Error('no player');
      playerRef.current = { id: player.player_id, token: player.token };
      nickRef.current = nick; nickStore(nick);
      lastUpdatedRef.current = row.updated_at; lastSeenRef.current = Date.now();
      setPin(p); setMentorScreen(row.max_screen); setStatus(row.status); setMode('student');
      liveStore(lessonId, { mode: 'student', pin: p, lastScreen: row.max_screen, playerId: player.player_id, playerToken: player.token, nickname: nick });
    } catch (e) {
      const m = String(e?.message || '');
      setJoinError(/ism|band|kod|dars|belgi/i.test(m) ? m : "Ulanib bo'lmadi. Internetni tekshiring.");
    }
    finally { setBusy(false); }
  }, [lessonId]);

  const selfStudy = useCallback(() => { setMode('self'); liveStore(lessonId, { mode: 'self' }); }, [lessonId]);
  const reportScreen = useCallback((idx) => { if (mode === 'mentor' && pin) liveRpc('advance_session', { p_pin: pin, p_token: tokenRef.current, p_screen: idx }).catch(() => {}); }, [mode, pin]);
  const endSession = useCallback(() => { if (mode === 'mentor' && pin) { liveRpc('end_session', { p_pin: pin, p_token: tokenRef.current }).catch(() => {}); setEnded(true); } }, [mode, pin]);

  // O'quvchi javobini serverga yozish — birinchi javob qotadi (server unique).
  const submitAnswer = useCallback((screenIdx, questionId, picked, correct, elapsedMs) => {
    if (mode !== 'student' || !pin || !playerRef.current) return;
    const body = {
      p_pin: pin, p_player_id: playerRef.current.id, p_token: playerRef.current.token,
      p_screen: screenIdx, p_question_id: questionId || '', p_picked: picked,
      p_correct: !!correct, p_elapsed_ms: Math.max(0, Math.round(elapsedMs || 0))
    };
    const attempt = (n) => { liveRpc('submit_answer', body).catch(() => { if (n < 3) setTimeout(() => attempt(n + 1), 3000 * (n + 1)); }); };
    attempt(0);
  }, [mode, pin]);

  // Mustahkamlash boshqaruvi (faqat mentor): 'lobby' | 'q' | 'r' | 'done'
  const quizControl = useCallback(async (state, q) => {
    if (mode !== 'mentor' || !pin) throw new Error('mentor emas');
    await liveRpc('quiz_control', { p_pin: pin, p_token: tokenRef.current, p_state: state, p_q: q ?? -1 });
    setQuiz({ state, q: q ?? -1 });
  }, [mode, pin]);

  // Kahoot-reveal (faqat mentor)
  const mentorReveal = useCallback((screenIdx) => {
    if (mode !== 'mentor' || !pin) return;
    setRevealScreen(screenIdx);
    liveRpc('reveal_screen', { p_pin: pin, p_token: tokenRef.current, p_screen: screenIdx }).catch(() => {});
  }, [mode, pin]);

  return { mode, pin, mentorScreen, status, mentorAlive, connected, ended, joinError, busy, startMentor, joinStudent, selfStudy, reportScreen, endSession, submitAnswer, quiz, quizControl, revealScreen, mentorReveal, playerId: playerRef.current?.id || null, nickname: nickRef.current };
}

const _liveBtnPri = { background: LT.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer' };
const _liveBadgeS = { position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 9998, background: LT.paper, border: `1px solid ${LT.ink3}55`, borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: LT.ink2, boxShadow: '0 2px 10px rgba(58,53,48,0.12)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', maxWidth: '92vw' };
const _liveDot = (c) => ({ width: 8, height: 8, borderRadius: 99, background: c, display: 'inline-block' });

function LiveBigCode({ pin, onClose }) {
  const digits = String(pin || '').split('');
  const overlay = { position: 'fixed', inset: 0, zIndex: 10000, background: LT.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,40px)', textAlign: 'center' };
  const box = { background: LT.paper, color: LT.ink, borderRadius: 'clamp(10px,1.6vw,18px)', fontFamily: 'monospace', fontWeight: 800, lineHeight: 1, fontSize: 'clamp(48px,13vw,150px)', padding: 'clamp(10px,2vw,28px) clamp(12px,2.2vw,30px)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' };
  return (
    <div style={overlay}>
      <div style={{ fontSize: 'clamp(13px,2vw,18px)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: LT.accent, marginBottom: 'clamp(14px,3vw,28px)' }}>Jonli darsga qo'shilish</div>
      <div style={{ display: 'flex', gap: 'clamp(6px,1.4vw,16px)', justifyContent: 'center', flexWrap: 'wrap' }}>{digits.map((d, i) => <span key={i} style={box}>{d}</span>)}</div>
      <p style={{ color: '#fff', opacity: 0.85, fontSize: 'clamp(15px,2.2vw,22px)', maxWidth: 640, margin: 'clamp(20px,4vw,36px) 0 0', lineHeight: 1.5 }}>Shu darsni o'z qurilmangizda oching → <b style={{ color: '#fff' }}>«👨‍🎓 O'quvchiman»</b> → ushbu kodni kiriting.</p>
      <button onClick={onClose} style={{ marginTop: 'clamp(22px,4vw,40px)', background: LT.accent, color: '#fff', border: 'none', borderRadius: 14, padding: 'clamp(12px,1.6vw,16px) clamp(24px,3vw,36px)', fontSize: 'clamp(15px,1.8vw,18px)', fontWeight: 700, cursor: 'pointer' }}>Darsni boshlash →</button>
    </div>
  );
}

function LiveGate({ live, title = 'Jonli dars' }) {
  const [code, setCode] = useState('');
  const [nick, setNick] = useState(() => nickRead());
  const [mentorCode, setMentorCode] = useState('');
  const [role, setRole] = useState('student');
  const card = { position: 'relative', width: '100%', maxWidth: 420, background: LT.paper, borderRadius: 20, padding: 'clamp(24px,4vw,36px)', boxShadow: '0 10px 40px -12px rgba(58,53,48,0.22)', display: 'flex', flexDirection: 'column', gap: 18 };
  const wrap = { minHeight: 'calc(100dvh / var(--lz, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 };
  const link = { background: 'none', border: 'none', color: LT.ink3, fontSize: 13, cursor: 'pointer', alignSelf: 'center' };
  if (role === 'mentor') {
    return (<div style={wrap}><div style={card}>
      <div style={{ textAlign: 'center' }}><h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(22px,3vw,28px)', color: LT.ink, margin: '0 0 4px' }}>🧑‍🏫 Mentor kirishi</h2><p style={{ color: LT.ink2, fontSize: 14, margin: 0 }}>Mentor kodini kiriting.</p></div>
      <input value={mentorCode} onChange={e => setMentorCode(e.target.value)} type="password" autoFocus placeholder="Mentor kodi" onKeyDown={e => { if (e.key === 'Enter') live.startMentor(mentorCode); }} style={{ width: '100%', padding: '14px', border: `2px solid ${LT.ink3}55`, borderRadius: 14, fontSize: 18, fontWeight: 600, textAlign: 'center', outline: 'none' }} />
      <button onClick={() => live.startMentor(mentorCode)} disabled={live.busy} style={_liveBtnPri}>{live.busy ? 'Tekshirilmoqda…' : 'Kirish →'}</button>
      {live.joinError && <div style={{ color: LT.accent, fontSize: 13, textAlign: 'center' }}>{live.joinError}</div>}
      <button onClick={() => { setRole('student'); setMentorCode(''); }} style={link}>← Orqaga</button>
    </div></div>);
  }
  return (<div style={wrap}><div style={card}>
    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: LT.accent }}>{title}</div><h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(22px,3vw,28px)', color: LT.ink, margin: '6px 0 4px' }}>Darsga qo'shilish</h2><p style={{ color: LT.ink2, fontSize: 14, margin: 0 }}>Mentor bergan kodni va ismingizni kiriting.</p></div>
    <input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoFocus placeholder="483 920" style={{ width: '100%', padding: '16px 14px', border: `2px solid ${LT.ink3}55`, borderRadius: 14, fontSize: 28, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.12em', textAlign: 'center', outline: 'none' }} />
    <input value={nick} onChange={e => setNick(e.target.value)} maxLength={24} placeholder="Ismingiz (masalan: Ali)" onKeyDown={e => { if (e.key === 'Enter') live.joinStudent(code, nick); }} style={{ width: '100%', padding: '13px 14px', border: `2px solid ${LT.ink3}55`, borderRadius: 14, fontSize: 17, fontWeight: 600, textAlign: 'center', outline: 'none' }} />
    <button onClick={() => live.joinStudent(code, nick)} disabled={live.busy} style={_liveBtnPri}>{live.busy ? 'Ulanmoqda…' : 'Qo\'shilish →'}</button>
    {live.joinError && <div style={{ color: LT.accent, fontSize: 13, textAlign: 'center' }}>{live.joinError}</div>}
    <button onClick={() => { live.selfStudy(); }} style={link}>Mustaqil o'qiyman →</button>
    <button onClick={() => { setRole('mentor'); setCode(''); }} title="Mentor" aria-label="Mentor" style={{ position: 'absolute', bottom: 10, right: 12, background: 'none', border: 'none', fontSize: 16, opacity: 0.3, cursor: 'pointer', lineHeight: 1, padding: 4 }}>🧑‍🏫</button>
  </div></div>);
}

function LiveBadge({ live, total }) {
  // 11.14: katta PIN AUTO-ochilmaydi — faqat «📺 Ko'rsatish» tugmasi ochadi
  const [bigOpen, setBigOpen] = useState(false);
  const [nPlayers, setNPlayers] = useState(null);
  useEffect(() => {
    if (live.mode !== 'mentor' || !live.pin || live.ended) return;
    let on = true, t = null;
    const tick = async () => {
      try { const rows = await livePlayers(live.pin); if (on) setNPlayers(rows.length); } catch {}
      if (on) t = setTimeout(tick, 6000);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [live.mode, live.pin, live.ended]);
  if (live.mode === 'mentor') {
    if (live.ended) return <div className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.ink3)} /> 🔓 O'quvchilar erkin qilindi</div>;
    return (<>
      {bigOpen && <LiveBigCode pin={live.pin} onClose={() => setBigOpen(false)} />}
      <div className="live-badge" style={_liveBadgeS}>
        <span style={_liveDot(LT.success)} /> Kod: <b style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>{fmtPin(live.pin)}</b>
        {nPlayers !== null && <span style={{ color: LT.ink2 }}>👥 {nPlayers}</span>}
        <button onClick={() => setBigOpen(true)} title="Kodni katta ko'rsatish" style={{ marginLeft: 6, background: LT.ink, color: '#fff', border: 'none', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>📺 Ko'rsatish</button>
        <button onClick={() => { if (window.confirm("O'quvchilarni ozod qilasizmi? Ular o'zlari erkin davom etadi.")) live.endSession(); }} style={{ background: LT.accentSoft, color: LT.accent, border: 'none', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔓 Erkin qilish</button>
      </div>
    </>);
  }
  if (live.mode === 'student') {
    if (live.status === 'ended') return <div className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.success)} /> 🔓 Erkin rejim — o'zingiz davom eting</div>;
    if (!live.mentorAlive) return <div className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.ink3)} /> ⚠️ Mentor uzildi — erkin rejim</div>;
    if (!live.connected) return <div className="live-badge" style={_liveBadgeS}><span style={_liveDot('#FFD380')} /> 🔄 Qayta ulanmoqda…</div>;
    return <div className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.success)} /> 👨‍🏫 Mentor: {Math.min(live.mentorScreen + 1, total)} / {total}{live.nickname && <span style={{ color: LT.ink3 }}>· {live.nickname}</span>}</div>;
  }
  return null;
}

const LangContext = createContext('uz');
const MentorCtx = createContext(null);          // mobil: yig'iladigan Mentor
const AchCtx = createContext(null);             // 🏅 olingan nishonlar (Set)
const LiveGateCtx = createContext(null);        // JONLI: mentor-gate + live obyekti
const BoardCtx = createContext(null);           // 🪧 OCHILISH TAXTASI (dars bo'ylab to'planadi)

// Matn ichidagi `kod` bo'laklarini chip qilib ko'rsatadi (11.8)
const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;

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

const LESSON_META = { lessonId: 'nest-arch-resource-4a-02-v18', lessonTitle: { uz: 'Birinchi resursni qo\'lda qo\'shish — mashinalar', ru: 'Добавляем первый ресурс вручную — машины' } };
const SCREEN_META = [
  { id: 's0',       type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',       type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',       type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',       type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's8',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',       type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11',      type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14',      type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15',      type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's16',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's17',      type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 'practice', type: 'practice',    template: 'custom',   scored: false, scope: null },
  { id: 'podium',   type: 'stats',       template: 'custom',   scored: false, scope: null },
  { id: 'sflash',   type: 'flashcards',  template: 'custom',   scored: false, scope: null },
  { id: 's19',      type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);
// Podium savol yorliqlari (SCORED_IDX indekslariga mos)
const Q_LABELS = { 4: '1 — Entity', 7: '2 — DTO', 9: '3 — BaseService', 11: '4 — Controller', 14: '5 — Ulash', 17: '6 — Debug' };
// JONLI javob kaliti (⚡ Jonli roli: correct qiymatlarini tasdiqlaydi).
// s17 (final challenge) = 0 — REAL kalit: 1-urinishda begona qatorni topgan picked=0, xato bosgan picked=1 yuboradi.
// practice: -1 — sentinel: «Bajardim» signali (500+ zonasi) hech qachon xato deb yozilmasin.
const INLINE_KEYS = { s4: 2, s7: 3, s9: 1, s11: 0, s14: 1, s17: 0, practice: -1 };
// 📖 QAYTA TUSHUNTIRISH — har SCORED test uchun 3 karta. 🎓 Metodist to'ldiradi: kalitlar 4, 7, 9, 11, 14, 17
const RECAPS = {
  4: {
    title: "Entity — javon chizmasi",
    cards: [
      { ic: "📐", h: "Entity — jadval shakli", body: <><b>Entity</b> bazadagi jadval qanday ko'rinishini belgilaydi: qaysi ustunlar bor (<span className="mono">brand</span>, <span className="mono">price</span>...).</> },
      { ic: "🎁", h: "BaseEntity — tayyor tokchalar", body: <><span className="mono">id</span>, <span className="mono">created_at</span>, <span className="mono">updated_at</span> — <b>BaseEntity</b>'dan meros orqali tekin keladi, o'zingiz yozmaysiz.</> },
      { ic: "🚫", h: "Entity ≠ boshqa qatlam", body: <>So'rovni <b>Controller</b> qabul qiladi, qoidani <b>DTO</b> tekshiradi. Entity faqat jadval shakli — javob bermaydi, buyruq bajarmaydi.</>, ask: "Entity nima uchun so'rovga javob qaytara olmaydi?" },
    ]
  },
  7: {
    title: "DTO — buyurtma anketasi",
    cards: [
      { ic: "📋", h: "DTO — kelgan ma'lumot qoidalari", body: <><b>DTO</b> — buyurtma anketasi: <span className="mono">brand</span> matn va majburiy, <span className="mono">price</span> raqam bo'lishi shart.</> },
      { ic: "🧐", h: "Nazoratchi (ValidationPipe) tekshiradi", body: <>Qoida buzilsa so'rov <span className="mono">400</span> bilan qaytadi — hatto Service'gacha ham bormaydi.</> },
      { ic: "🔁", h: "PartialType — bir xil anketa nusxasi", body: <><b>PartialType(CreateCarDto)</b> tahrirlash uchun anketa yasaydi — har katakcha ixtiyoriy bo'ladi, kod ikki marta yozilmaydi.</>, ask: "Bo'sh brand bilan POST /car yuborilsa, so'rov qayerda to'xtaydi?" },
    ]
  },
  9: {
    title: "BaseService — tayyor retsept kitobi",
    cards: [
      { ic: "👨‍🍳", h: "Service — oshpaz", body: <><b>Service</b> asosiy ishni bajaradi: ma'lumotni saqlaydi, o'qiydi, o'zgartiradi, o'chiradi.</> },
      { ic: "📖", h: "BaseService — tayyor retsept kitobi", body: <><span className="mono">create</span>, <span className="mono">findAll</span>, <span className="mono">update</span>, <span className="mono">remove</span> — meros orqali tekin keladi, qo'lda yozilmaydi.</> },
      { ic: "🔑", h: "super(carRepo) — omborni ko'rsatadi", body: <>Bu qator <b>BaseService</b>ga qaysi jadval bilan ishlashini aytadi — shu sababli faqat 4 qator yetarli.</>, ask: "Nega CarService'da 40 qator emas, atigi 4 qator yetarli?" },
    ]
  },
  11: {
    title: "Controller — ofitsiant",
    cards: [
      { ic: "🤵", h: "Controller — ofitsiant", body: <><b>Controller</b> so'rovni qabul qiladi va Service'ning mos metodini chaqiradi. Ishni o'zi bajarmaydi.</> },
      { ic: "🚪", h: "Har dekorator — bir eshik", body: <><span className="mono">@Post</span> qo'shish, <span className="mono">@Get</span> o'qish, <span className="mono">@Patch</span> o'zgartirish, <span className="mono">@Delete</span> o'chirish uchun.</> },
      { ic: "🧭", h: "Controller ≠ Service", body: <>Controller faqat chaqiradi — asosiy ishni <b>Service</b> (BaseService orqali) bajaradi.</>, ask: "Yangi mashina qo'shish uchun qaysi eshik (dekorator) ochiladi?" },
    ]
  },
  14: {
    title: "Module — kirish taxtasi",
    cards: [
      { ic: "📑", h: "Module — bo'lim ro'yxati", body: <><b>Module</b> jadval (<span className="mono">forFeature</span>), eshik (controller) va oshxona (service)ni bitta joyda ro'yxatga oladi.</> },
      { ic: "🚪", h: "Kirish taxtasi — AppModule imports", body: <><span className="mono">CarModule</span> shu ro'yxatda bo'lmasa, mijoz bo'limni topa olmaydi — <span className="mono">/car</span> = <span className="mono">404</span>.</> },
      { ic: "🔌", h: "Ulangach — avtomatik ishlaydi", body: <>NestJS qismlarni o'zi tanishtirib ulaydi (DI) — siz faqat ro'yxatga <b>CarModule</b>ni qo'shasiz.</>, ask: "CarModule AppModule'ga ulanmasa, /car nima qaytaradi?" },
    ]
  },
  17: {
    title: "Debug — har qator o'z qatlamida",
    cards: [
      { ic: "🔎", h: "Har qator — o'z qatlamida", body: <><span className="mono">@Column</span> — Entity qatori (jadval ustuni). Controller ichida turmaydi, chunki u boshqa qatlamga tegishli.</> },
      { ic: "🧯", h: "Begona qator — nega kod buziladi", body: <>Qatlamlar aralashsa, Controller kutilmagan narsani ko'radi va <span className="mono">/car</span> ishlamay qoladi.</> },
      { ic: "🕵️", h: "Siz — nazoratchi", body: <>Agent tez yozadi, lekin xato qilishi mumkin. Arxitekturani bilsangiz, xatoni darrov topasiz.</>, ask: <>Nega <span className="mono">@Column</span> qatori <span className="mono">car.controller.ts</span> ichida ishlamaydi?</> },
    ]
  }
};

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

// 🏅 Yuqori paneldagi nishon hisoblagichi (Stage chrome)
function AchCounter() {
  const earned = useContext(AchCtx);
  const count = earned ? earned.size : 0;
  const total = Object.keys(ACHIEVEMENTS).length;
  const prevRef = useRef(count);
  const [bump, setBump] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (count > prevRef.current) { setBump(true); const t = setTimeout(() => setBump(false), 800); prevRef.current = count; return () => clearTimeout(t); }
    prevRef.current = count;
  }, [count]);
  return (
    <div className="ach-cnt-wrap">
      <button className={`ach-counter ${bump ? 'bump' : ''} ${count > 0 ? 'has' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Badges" title="Badges">
        <span className="ach-cnt-ic">🏅</span><b>{count}</b><span className="ach-cnt-tot">/{total}</span>
      </button>
      {open && (
        <div className="ach-pop" onMouseLeave={() => setOpen(false)}>
          <div className="ach-pop-h">🏅 Badges — {count}/{total}</div>
          {Object.entries(ACHIEVEMENTS).map(([id, a]) => { const got = !!(earned && earned.has(id)); return (
            <div key={id} className={`ach-pop-row ${got ? 'got' : ''}`}><span className="ach-pop-ic">{got ? a.icon : '🔒'}</span><span className="ach-pop-nm">{a.name}</span></div>
          ); })}
        </div>
      )}
    </div>
  );
}

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic, scrollSignal }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 60; // 11.11 layout standarti: 1100px + 60px
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  useEffect(() => {
    if (!scrollSignal || !isNarrow) return;
    const el = contentRef.current;
    if (!el) return;
    const t = setTimeout(() => { if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, 240);
    return () => clearTimeout(t);
  }, [scrollSignal, isNarrow]);
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    const tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.mentor')) return;
    setMCollapsed(true);
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .swg-row, .tree-row, .pick-row');
    if (!isControl) {
      const el = contentRef.current;
      if (el) setTimeout(() => { if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }, 80);
    }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AchCounter />
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
// 5.5 — optionalLive: jonli darsda mentor bilan birga ketayotgan o'quvchi ballsiz ekranda kutib qolmaydi (freeRide)
const NavNext = ({ disabled, label = 'Davom etish', onClick, optionalLive }) => {
  const gate = useContext(LiveGateCtx);
  const locked = !!(gate && gate.locked);
  const live = gate && gate.live;
  const freeRide = !!(optionalLive && live && live.mode === 'student' && live.status !== 'ended' && live.mentorAlive);
  return <button className="btn-white-accent" disabled={(freeRide ? false : disabled) || locked} onClick={onClick} title={locked ? "Mentor hali bu sahifaga o'tmadi" : undefined} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)', marginLeft: 'auto' }}>{locked ? '⏳ Mentorni kuting' : (freeRide && disabled ? 'Davom etish' : label)}</button>;
};

const FeedbackBlock = ({ show, isCorrect, neutral, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (show) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => { setVisible(true); setTimeout(() => { if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 350); })); }
    else { setVisible(false); const t = setTimeout(() => setMounted(false), 400); return () => clearTimeout(t); }
  }, [show]);
  if (!mounted) return null;
  return <div ref={ref} className={`feedback-block ${visible ? 'visible' : ''}`}><div className={neutral ? 'frame-wait' : isCorrect ? 'frame-success' : 'frame-soft'}>{children}</div></div>;
};

const MSTATS_COLORS = ['#019ACB', '#8B5CF6', '#E8A13A', '#E0559A'];
const RECAP_NEED_PCT = 60;
const RECAP_GOOD_PCT = 75;
const RECAP_MIN_ANSWERS = 3;

// 📖 Qayta tushuntirish overlay — ekran USTIDA ochiladi (indekslarga tegmaydi)
function RecapOverlay({ screenIdx, onClose }) {
  const rc = RECAPS[screenIdx];
  const [i, setI] = useState(0);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setI(p => Math.min(p + 1, (rc ? rc.cards.length : 1) - 1));
      else if (e.key === 'ArrowLeft') setI(p => Math.max(p - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, rc]);
  if (!rc) return null;
  const card = rc.cards[i];
  const last = i === rc.cards.length - 1;
  return (
    <div className="rc-overlay">
      <div className="rc-head">
        <span className="rc-tag">📖 Qayta tushuntirish</span>
        <span className="rc-title">{rc.title}</span>
        <button className="rc-x" onClick={onClose} aria-label="Yopish">✕</button>
      </div>
      <div className="rc-card" key={i}>
        <div className="rc-ic">{card.ic}</div>
        <h2 className="rc-h">{card.h}</h2>
        <p className="rc-body">{card.body}</p>
        {card.ask && <div className="rc-ask">🗣️ Sinfga savol: {card.ask}</div>}
      </div>
      <div className="rc-nav">
        <button className="rc-btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>← Oldingi</button>
        <div className="rc-dots">{rc.cards.map((_, k) => <button key={k} className={`rc-dot ${k === i ? 'cur' : k < i ? 'fill' : ''}`} onClick={() => setI(k)} aria-label={`${k + 1}-karta`} />)}</div>
        {last
          ? <button className="rc-btn done" onClick={onClose}>✓ Tushunarli — davom etamiz</button>
          : <button className="rc-btn" onClick={() => setI(i + 1)}>Keyingisi →</button>}
      </div>
    </div>
  );
}

// MENTOR (proyektor): jonli test statistikasi — «Natijani ochish»gacha ✅/❌ soni yashirin (Kahoot-reveal).
// Sanoq FAQAT bitta manbadan: picked === correctIdx (server-kalit bilan mos).
function MentorTestStats({ live, screenIdx, options, correctIdx, reveal, onReveal, onOpenRecap }) {
  const [data, setData] = useState({ players: null, rows: [] });
  useEffect(() => {
    let on = true, t = null;
    const tick = async () => {
      try {
        const [players, answers] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, screenIdx)]);
        if (on) setData({ players, rows: answers });
      } catch {}
      if (on) t = setTimeout(tick, 3000);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [live.pin, screenIdx]);
  if (data.players === null) return null;
  const total = data.players.length;
  const answered = data.rows.length;
  const ok = data.rows.filter(a => a.picked === correctIdx).length;
  const bad = answered - ok;
  const allIn = total > 0 && answered >= total;
  const struggling = answered >= 2 && bad > ok;
  const answeredIds = new Set(data.rows.map(r => r.player_id));
  const waiting = data.players.filter(p => !answeredIds.has(p.id));
  const maxN = Math.max(1, ...options.map((_, i) => data.rows.filter(a => a.picked === i).length));
  return (
    <div className="mstats fade-up">
      <div className="mstats-head">
        <span className="mstats-lbl">📊 Jonli natija</span>
        <span className="mstats-n">{allIn ? '✓ Hamma javob berdi' : <>Javob berdi: <b>{answered}</b> / {total}</>}</span>
        {!reveal && onReveal && <button className={`mstats-reveal ${allIn ? 'ready' : ''}`} onClick={onReveal}>🔓 Natijani ochish</button>}
      </div>
      <div className="mstats-prog"><span className={`mstats-prog-fill ${allIn ? 'full' : ''}`} style={{ width: `${total ? Math.round((answered / total) * 100) : 0}%` }} /></div>
      {reveal ? (
        <div className="mstats-big">
          <div className="mstats-chip okc"><span className="mstats-chip-n">{ok}</span><span className="mstats-chip-t">to'g'ri ✅</span></div>
          <div className="mstats-chip badc"><span className="mstats-chip-n">{bad}</span><span className="mstats-chip-t">xato ❌</span></div>
          <div className="mstats-chip waitc"><span className="mstats-chip-n">{total - answered}</span><span className="mstats-chip-t">kutilmoqda ⏳</span></div>
        </div>
      ) : (
        <div className="mstats-big">
          <div className="mstats-chip ansc"><span className="mstats-chip-n">{answered}</span><span className="mstats-chip-t">javob berdi 📨</span></div>
          <div className="mstats-chip waitc"><span className="mstats-chip-n">{total - answered}</span><span className="mstats-chip-t">kutilmoqda ⏳</span></div>
        </div>
      )}
      {!reveal && answered > 0 && (
        <p className="mstats-hidden">🙈 Kim nimani tanlagani va ✅/❌ soni yashirin — «Natijani ochish» bosilganda sizda ham, o'quvchilar ekranida ham birdan ochiladi.</p>
      )}
      {reveal && <div className="mstats-bars">
        {options.map((opt, i) => {
          const n = data.rows.filter(a => a.picked === i).length;
          const pct = answered ? Math.round((n / answered) * 100) : 0;
          const isC = i === correctIdx;
          const col = isC ? T.success : MSTATS_COLORS[i % 4];
          return (
            <div key={i} className={`mstats-row ${!isC ? 'dimmed' : ''}`}>
              <span className="mstats-abc" style={{ background: col }}>{isC ? '✓' : String.fromCharCode(65 + i)}</span>
              <span className="mstats-track"><span className="mstats-fill" style={{ width: `${answered ? Math.round((n / maxN) * 100) : 0}%`, background: col }} /></span>
              <span className="mono mstats-count" style={isC ? { color: T.success, fontWeight: 800 } : undefined}>{n > 0 ? `${n} o'quvchi · ${pct}%` : '—'}</span>
            </div>
          );
        })}
      </div>}
      {reveal && answered > 0 && (() => {
        const pct = Math.round((ok / answered) * 100);
        const level = answered < RECAP_MIN_ANSWERS ? 'few' : pct < RECAP_NEED_PCT ? 'need' : pct < RECAP_GOOD_PCT ? 'maybe' : 'good';
        return (
          <div className={`mstats-verdict ${level}`}>
            {level === 'need' && <p className="mstats-verdict-t">⚠️ Faqat <b>{pct}%</b> to'g'ri — bu mavzu sinfga tushunarsiz qolgan. Davom etishdan oldin qisqa takrorlash tavsiya etiladi.</p>}
            {level === 'maybe' && <p className="mstats-verdict-t">🟡 <b>{pct}%</b> to'g'ri — yomon emas. Xohlasangiz, davom etishdan oldin qisqa takrorlab oling.</p>}
            {level === 'good' && <p className="mstats-verdict-t">✅ <b>{pct}%</b> to'g'ri — sinf mavzuni o'zlashtirdi. Bemalol davom eting!</p>}
            {level === 'few' && <p className="mstats-verdict-t">Javob berganlar kam ({answered} ta) — foiz bo'yicha xulosa chiqarish qiyin. O'zingiz baholang.</p>}
            {onOpenRecap && <button className="rc-open" onClick={onOpenRecap}>📖 Qayta tushuntirish</button>}
          </div>
        );
      })()}
      {waiting.length > 0 && answered > 0 && (
        <div className="mstats-waitrow">
          <span className="mstats-wait-lbl">⏳ Kutilmoqda:</span>
          {waiting.slice(0, 8).map(p => <span key={p.id} className="mstats-wait-chip">{p.nickname}</span>)}
          {waiting.length > 8 && <span className="mstats-wait-chip more">+{waiting.length - 8}</span>}
        </div>
      )}
      {reveal && struggling && <p className="mstats-warn">⚠️ Ko'pchilik xato qildi — bu mavzu tushunarsiz bo'lgan ko'rinadi. Qayta tushuntirish tavsiya etiladi.</p>}
      {answered === 0 && <p className="mstats-wait">O'quvchilar javoblari shu yerda jonli ko'rinadi…</p>}
    </div>
  );
}

// ⚠️ placeCorrect O'CHIRILDI: variantlar MANBA tartibida chiqadi (display-indeks === server kaliti).
const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const oneShot = !!(live && live.mode === 'student'); // jonli dars: BITTA urinish
  const isMentorLive = !!(live && live.mode === 'mentor');
  const mountTs = useRef(Date.now()); // tezlik: savol ochilgandan bosishgacha
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const [mReveal, setMReveal] = useState(() => !!(isMentorLive && storedAnswer));
  const [recapOpen, setRecapOpen] = useState(false);
  const hasRecap = !!RECAPS[screen];
  const doReveal = () => { setMReveal(true); if (live) live.mentorReveal(screen); if (storedAnswer === undefined) onAnswer(screen, { mentorRevealed: true }); };
  const liveRevealScreen = live ? live.revealScreen : -1;
  useEffect(() => { if (isMentorLive && liveRevealScreen === screen) setMReveal(true); }, [isMentorLive, liveRevealScreen, screen]);
  const pick = (i) => {
    if (solved || isMentorLive) return;
    const isCorrect = i === correctIdx;
    setPicked(i);
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect; // ball: 1-urinish qotadi
    if (oneShot) {
      setSolved(true);
      onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: isCorrect, firstAttemptCorrect: isCorrect, solved: true, lastPicked: i });
      live.submitAnswer(screen, SCREEN_META[screen]?.id || `s${screen}`, i, isCorrect, Date.now() - mountTs.current);
    } else {
      if (isCorrect) setSolved(true);
      onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
    }
  };
  const wrongLocked = oneShot && solved && picked !== correctIdx;
  // KAHOOT REVEAL: jonli darsda javob bosilgach natija ham sir — mentor ochguncha
  const revealed = !oneShot || !!(live && (live.revealScreen === screen || live.mentorScreen > screen || live.status === 'ended' || !live.mentorAlive));
  const waiting = oneShot && solved && !revealed;
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? !mReveal : !solved} label={isMentorLive ? (mReveal ? 'Davom etish' : 'Avval natijani oching') : solved ? 'Davom etish' : (oneShot ? 'Javob tanlang' : "To'g'ri javobni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: isMentorLive ? 'flex-start' : 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        {oneShot && !solved && <p className="small mono fade-up" style={{ margin: '-8px 0 0', color: T.accent, fontWeight: 600 }}>⚡ Jonli dars — bitta urinish, o'ylab bosing!</p>}
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (isMentorLive) {
              if (mReveal) { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; }
            } else if (solved) {
              if (waiting) { if (i === picked) cls += ' option-wait'; }
              else { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; if (wrongLocked && i === picked) cls += ' option-picked-wrong'; }
            }
            else if (i === picked) cls += ' option-picked-wrong';
            const showGreenLetter = isMentorLive ? (mReveal && i === correctIdx) : (solved && revealed && i === correctIdx);
            return (
              <button key={i} className={cls} disabled={solved || isMentorLive} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: showGreenLetter ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{fmtCode(opt)}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={isMentorLive ? mReveal : picked !== null} isCorrect={isMentorLive ? true : (solved && !wrongLocked)} neutral={waiting}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: waiting ? T.blue : (isMentorLive || (solved && !wrongLocked)) ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isMentorLive
              ? <>✓ To'g'ri javob: {String.fromCharCode(65 + correctIdx)} — {fmtCode(options[correctIdx])}</>
              : waiting
                ? '📨 Javobingiz qabul qilindi'
                : wrongLocked
                  ? <>To'g'ri javob: {String.fromCharCode(65 + correctIdx)} — {fmtCode(options[correctIdx])}</>
                  : solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}
          </p>
          <p className="body" style={{ margin: 0 }}>
            {isMentorLive
              ? fmtCode(explainCorrect)
              : waiting
                ? "Hozir to'g'ri javobni bilib olasiz."
                : wrongLocked
                  ? fmtCode(explainWrong[picked] ?? explainWrong.default)
                  : solved ? fmtCode(explainCorrect) : fmtCode(explainWrong[picked] ?? explainWrong.default)}
          </p>
          {hasRecap && !isMentorLive && firstCorrectRef.current === false && (!oneShot || revealed) && (
            <button className="rc-open-mini" onClick={() => setRecapOpen(true)}>📖 Qisqa takrorlash — mavzuni yana bir ko'rish</button>
          )}
        </FeedbackBlock>
        {isMentorLive && <MentorTestStats live={live} screenIdx={screen} options={options} correctIdx={correctIdx} reveal={mReveal} onReveal={doReveal} onOpenRecap={hasRecap ? () => setRecapOpen(true) : null} />}
        {recapOpen && hasRecap && <RecapOverlay screenIdx={screen} onClose={() => setRecapOpen(false)} />}
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

const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
      <div className="mentor-ava" aria-hidden="true">
        <img src={MENTOR_IMG} alt="" />
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;

// ===== MOCK VS CODE EDITOR =====
const CodeFile = ({ name, children, minH }) => (
  <div className="editor">
    <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">{name}</span></div>
    <div className="editor-body" style={{ minHeight: minH }}><pre className="editor-code">{children}</pre></div>
  </div>
);

// ===== AGENT PROMPT (Praktikaga ko'prik) =====
const AgentCard = ({ children }) => (
  <div className="agent-card">
    <span className="agent-lbl">💬 Agentni shunday yo'naltiring</span>
    <p className="agent-msg">{children}</p>
  </div>
);

// ===== MOCK SWAGGER (Car) =====
const M_COLOR = { GET: T.blue, POST: T.success, PATCH: T.amber, DELETE: T.danger };
const CAR_EPS = [
  { m: 'POST', path: '/car', sum: 'Yangi mashina', resp: '{\n  "statusCode": 201,\n  "message": "success",\n  "data": { "id": "c1a...", "brand": "Chevrolet", "model": "Cobalt", "price": 15000, "is_available": true }\n}' },
  { m: 'GET', path: '/car', sum: 'Mashinalar ro\'yxati', resp: '{\n  "statusCode": 200,\n  "data": [ { "id": "c1a...", "brand": "Chevrolet", "model": "Cobalt" } ]\n}' },
  { m: 'GET', path: '/car/{id}', sum: 'Bitta mashina', resp: '{ "statusCode": 200, "data": { "id": "c1a...", "brand": "Chevrolet", "price": 15000 } }' },
  { m: 'PATCH', path: '/car/{id}', sum: 'Tahrirlash', resp: '{ "statusCode": 200, "message": "success" }' },
  { m: 'DELETE', path: '/car/{id}', sum: 'O\'chirish', resp: '{ "statusCode": 200, "message": "success" }' }
];
const CarSwagger = ({ available, openId, onToggle, triedIds, onTry }) => (
  <div className="swg">
    <div className="swg-top"><span className="swg-dot" style={{ background: available ? '#49cc90' : '#febc2e' }} /> Avtosalon API <span className="swg-ver">/api/v1</span></div>
    {CAR_EPS.map(e => {
      const id = e.m + e.path;
      const open = openId === id;
      const tried = triedIds.has(id);
      return (
        <div key={id} className="swg-row">
          <button className="swg-head" onClick={() => onToggle(id)}>
            <span className="swg-m" style={{ background: M_COLOR[e.m] }}>{e.m}</span>
            <span className="swg-path">{e.path}</span>
            <span className="swg-sum">{e.sum}</span>
            <span className="swg-chev">{open ? '▾' : '▸'}</span>
          </button>
          {open && (
            <div className="swg-detail el-in">
              {!tried
                ? <button className="btn-soft" onClick={() => onTry(id)} style={{ alignSelf: 'flex-start' }}>▶ Try it out</button>
                : (available
                  ? <><div className="swg-code-lbl">Javob · <span style={{ color: T.success }}>{e.m === 'POST' ? '201' : '200'}</span></div><pre className="json">{e.resp}</pre></>
                  : <><div className="swg-code-lbl">Javob · <span style={{ color: T.danger }}>404</span></div><pre className="json">{'{\n  "statusCode": 404,\n  "message": "Cannot ' + e.m + ' ' + e.path + '"\n}'}</pre></>)}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ===== PICK LINES — "qaysi qator shu faylga tegishli?" (qatlamlarni ajratish) =====
const PickLines = ({ fileName, scaffoldTop, scaffoldBottom, candidates, agent, instruction, onComplete, completedInit }) => {
  const correct = candidates.filter(c => c.correct);
  const [picked, setPicked] = useState(() => completedInit ? new Set(correct.map(c => c.id)) : new Set());
  const [shakeId, setShakeId] = useState(null);
  const [why, setWhy] = useState(null);
  const done = correct.every(c => picked.has(c.id));
  const fired = useRef(false);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onComplete && onComplete(); } }, [done]);
  const tap = (c) => {
    if (picked.has(c.id) || done) return;
    if (c.correct) { setPicked(p => { const s = new Set(p); s.add(c.id); return s; }); setWhy(null); }
    else { setShakeId(c.id); setWhy(c.why); setTimeout(() => setShakeId(x => (x === c.id ? null : x)), 450); }
  };
  const pickedCorrect = correct.filter(c => picked.has(c.id));
  return (
    <Zoomable>
    <div className="split">
      <Col>
        <p className="flow-label">{fileName}</p>
        <CodeFile name={fileName} minH={120}>
          {scaffoldTop}{'\n'}
          {pickedCorrect.length === 0
            ? <span className="line-empty">{'  // qatorlarni o\'ng tomondan tanlang →'}</span>
            : pickedCorrect.map((c, i) => <React.Fragment key={c.id}>{i > 0 ? '\n' : ''}{'  '}{c.node}</React.Fragment>)}
          {'\n'}{scaffoldBottom}
        </CodeFile>
        {agent && <AgentCard>{agent}</AgentCard>}
      </Col>
      <Col>
        <p className="flow-label">{instruction || 'Shu faylga tegishli qatorlarni tanlang'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {candidates.map(c => (
            <button key={c.id} className={`pick-row ${picked.has(c.id) ? 'picked' : ''} ${shakeId === c.id ? 'shake' : ''}`} disabled={picked.has(c.id)} onClick={() => tap(c)}>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span className="pick-plus">{picked.has(c.id) ? '✓' : '+'}</span>
            </button>
          ))}
        </div>
        {why && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{why}</p></div>}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Fayl tayyor — har qator o'z joyida. Begona qatorlar boshqa qatlamga tegishli edi.</p></div>}
      </Col>
    </div>
    </Zoomable>
  );
};

// ===== SO'ROV YO'LI (Car) =====
const FLOW = [
  { k: "So'rov", icon: '📨', r: 'Admin buyurtmasi', d: "POST /car — admin yangi mashina qo'shmoqchi." },
  { k: 'Controller', icon: '🛎️', r: 'Ofitsiant', d: "CarController so'rovni qabul qiladi, create() ni chaqiradi." },
  { k: 'DTO', icon: '📋', r: 'Anketa tekshiruvi', d: "brand bormi, price raqammi? (ValidationPipe). Xato bo'lsa — 400." },
  { k: 'Service', icon: '👨‍🍳', r: 'Oshpaz', d: 'CarService — maxsus mantiq yo\'q, to\'g\'ri BaseService\'ga uzatadi.' },
  { k: 'BaseService', icon: '📖', r: 'Tayyor retsept', d: 'repository.save() — yozishni bajaradi (tekin keldi).' },
  { k: 'PostgreSQL', icon: '🗄️', r: 'Ombor', d: "cars jadvaliga yoziladi." },
  { k: 'successRes', icon: '🎁', r: 'Qadoqlash', d: '{ statusCode, message, data } — bir xil shakl.' },
  { k: 'Javob', icon: '✅', r: 'Adminga', d: '201 Created — mashina qo\'shildi!' }
];

// ===== 🪧 OCHILISH TAXTASI — dars bo'ylab to'planadigan artefakt (6 slot) =====
// 5 xodim sloti + KIRISH TAXTASI. Har qadam tugaganda kartochka slotga uchadi (.oc-fly — ✨ Animatsiya sayqallaydi).
const BOARD_SLOTS = [
  { k: 'entity',     ic: '📐', name: 'javon chizmasi', file: 'car.entity.ts' },
  { k: 'dto',        ic: '📋', name: 'anketa',         file: 'create/update dto' },
  { k: 'service',    ic: '👨‍🍳', name: 'oshpaz',         file: 'car.service.ts' },
  { k: 'controller', ic: '🛎️', name: 'ofitsiant',      file: 'car.controller.ts' },
  { k: 'module',     ic: '📑', name: 'shtat jadvali',  file: 'car.module.ts' },
  { k: 'plate',      ic: '🪧', name: 'KIRISH TAXTASI', file: 'app.module.ts', plate: true }
];
const useBoard = () => useContext(BoardCtx) || { board: {}, fill: () => {}, plus: false, plusOn: () => {} };
const OpeningBoard = () => {
  const { board, plus } = useBoard();
  const done = BOARD_SLOTS.filter(s => board[s.k]).length;
  return (
    <div className="oc-board fade-up" aria-label="Ochilish taxtasi">
      <div className="oc-board-h">
        <span className="oc-board-t">🚗 MASHINALAR BO'LIMI — ochilishga tayyorgarlik</span>
        <span className={`oc-board-n ${done >= BOARD_SLOTS.length ? 'full' : ''}`}>{done}/{BOARD_SLOTS.length}</span>
      </div>
      <div className="oc-strip">
        {BOARD_SLOTS.map((s, i) => {
          const on = !!board[s.k];
          return (
            <React.Fragment key={s.k}>
              {s.plate && <span className="oc-sep" aria-hidden="true">‖</span>}
              <div className={`oc-slot ${on ? 'on oc-fly' : ''} ${s.plate ? 'plate' : ''}`} title={s.file}>
                <span className="oc-ic">{on ? s.ic : '·'}</span>
                <span className="oc-nm">{s.name}{s.k === 'dto' && plus && <b className="oc-plus"> ⁺</b>}</span>
                {on && <span className="oc-tick">✓</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ===== SCREEN 0 — HOOK: admin bor, mashinalar jadvali yo'q =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "admin faylini o'zgartirib, ichiga mashinani tiqamiz" },
    { id: 'b', label: "Mashinalar uchun yangi resurs (Car) quramiz" },
    { id: 'c', label: "Imkonsiz — skeletga yangi narsa qo'shib bo'lmaydi" }
  ];
  // Tanlovga QARAB javob (har tanlovga «Aynan!» demaydi) — 🎓 Metodist matnni sayqallaydi
  const ACK = {
    a: <>Bunda admin fayli ikki ishni bajarib, chalkashib ketadi. To'g'ri yo'l — mashinalar uchun <b>alohida resurs</b>: o'z papkasi, o'z 5 qadami. Bugun shuni quramiz — va <span className="mono">/car</span> tirik bo'ladi.</>,
    b: <>Aynan! Admin faylini buzmaymiz. <b>Resurs</b> — bu ilovangiz boshqaradigan bir tur ma'lumot (admin, mashina, buyurtma...). Mashinalar — alohida resurs: <b>o'z papkasi</b>da, <b>o'z 5 qadami</b> bilan quriladi. Bugun mashinalarni noldan qo'shamiz — va <span className="mono">/car</span> tirik bo'ladi.</>,
    c: <>Yo'q — skelet aynan shuning uchun qurilgan: unga yangi bo'lim qo'shsa bo'ladi. Mashinalar uchun <b>alohida resurs</b> quramiz: o'z papkasi, o'z 5 qadami. Bugun shu ish — va <span className="mono">/car</span> tirik bo'ladi.</>
  };
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: v === 'b' }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext optionalLive disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Admin tizimi tayyor — lekin avtosalon <span className="italic" style={{ color: T.accent }}>mashinalarini</span> qayerda saqlaydi?</h1>
        <Mentor>Dars 1'da clone qilgan skeletda <b style={{ color: T.ink }}>admin</b> tizimi ishlayapti. Endi admin avtosalon mashinalarini boshqarishi kerak — lekin hozir mashinalar jadvali yo'q. Pastdagi <span className="mono">POST /car</span> ni bosib sinab ko'ring — nima bo'larkan?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label fade-up delay-1">Hozirgi holat — /car hali yo'q</p>
            <div className="swg fade-up delay-1">
              <div className="swg-top"><span className="swg-dot" /> Avtosalon API <span className="swg-ver">/api/v1</span></div>
              <div className="swg-row"><div className="swg-head" style={{ cursor: 'default' }}><span className="swg-m" style={{ background: M_COLOR.POST }}>POST</span><span className="swg-path">/admin/signin</span><span className="swg-sum">ishlaydi ✓</span></div></div>
              <div className="swg-row"><div className="swg-head" style={{ cursor: 'default' }}><span className="swg-m" style={{ background: M_COLOR.GET }}>GET</span><span className="swg-path">/admin</span><span className="swg-sum">ishlaydi ✓</span></div></div>
              <div className="swg-row">
                <button className="swg-head" onClick={poke}><span className="swg-m" style={{ background: M_COLOR.POST }}>POST</span><span className="swg-path">/car</span><span className="swg-sum">sinab ko'ring</span><span className="swg-chev">▸</span></button>
                {tried && <div className="swg-detail el-in"><div className="swg-code-lbl">Javob · <span style={{ color: T.danger }}>404</span></div><pre className="json">{'{\n  "statusCode": 404,\n  "message": "Cannot POST /car"\n}'}</pre></div>}
              </div>
            </div>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>404 — bunday eshik yo'q. Chunki mashinalar jadvalini hali hech kim qo'shmagan.</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Endi /car ni qanday paydo qilamiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval POST /car ni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">{ACK[picked]}</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (5 qadam) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Entity — jadval shakli', tag: 'car.entity.ts' },
    { text: 'DTO — anketa + qoidalar', tag: 'create/update dto' },
    { text: 'Service — BaseService\'dan meros', tag: 'car.service.ts' },
    { text: 'Controller — eshiklar', tag: 'car.controller.ts' },
    { text: 'Module — ulaydi + AppModule', tag: 'car.module.ts' }
  ];
  return (
    <Stage eyebrow="Reja · 5 qadam" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Mashinalar jadvalini qo'shish — <span className="italic" style={{ color: T.accent }}>qayerdan boshlanadi</span>?</h2></div>
        <Mentor>Restoranda yangi <b style={{ color: T.ink }}>bo'lim</b> ochgandek, ilovaga yangi bo'lim — mashinalar — qo'shamiz. Eng muhim qoida shu: <b style={{ color: T.ink }}>har</b> resurs uchun tartib bir xil va <b style={{ color: T.ink }}>pastdan yuqoriga</b>: avval ma'lumot shakli (Entity), keyin qoidalar (DTO), ish (Service), eshik (Controller), oxirida hammasini ulash (Module). Bir marta o'rgansangiz — istalgan loyihada shu sikl.</Mentor>
        <ol className="roadmap fade-up delay-1">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
        <div className="frame-success fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}>Misol resurs — <span className="mono">Car</span> (mashina). Sodda: parol ham, kirish-chiqish ham yo'q — shu sababli <b>BaseService</b>ning kuchi to'liq ko'rinadi.</p></div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — REJA: mashina jadvali qanday ko'rinadi? =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FIELDS = [
    { id: 'brand', label: 'brand', d: 'marka (matn, majburiy)' },
    { id: 'model', label: 'model', d: 'model nomi (matn, majburiy)' },
    { id: 'price', label: 'price', d: 'narx (raqam)' },
    { id: 'is_available', label: 'is_available', d: 'sotuvda bormi? (true/false)' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(FIELDS.map(f => f.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= FIELDS.length;
  const tap = (id) => { setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Reja · mashina shakli" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `Ustunlarni belgilang (${seen.size}/${FIELDS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kod yozishdan oldin: bitta mashina haqida <span className="italic" style={{ color: T.accent }}>nimani saqlaymiz</span>?</h2></div>
        <Mentor>Professional dasturchi avval <b style={{ color: T.ink }}>rejalashtiradi</b>: qanday ma'lumot kerak? Mashina uchun to'rtta ustun yetadi. Har birini bosib belgilang. Yonda — <b style={{ color: T.ink }}>ochilish taxtasi</b>: har tugagan qadam shu yerga tushib boradi.</Mentor>
        <OpeningBoard />
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">siz qo'shadigan ustunlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {FIELDS.map(f => (
                <button key={f.id} className={`vcard ${!seen.has(f.id) ? 'tap-hint' : ''}`} onClick={() => tap(f.id)} style={{ boxShadow: seen.has(f.id) ? `inset 0 0 0 1.5px ${T.success}, 0 5px 14px -6px rgba(${T.shadowBase},0.16)` : undefined }}>
                  <span className="vlbl mono">{f.label}</span>
                  <span className="role-r">{f.d}</span>
                  <span className="vseen" style={{ color: seen.has(f.id) ? T.success : T.ink3 }}>{seen.has(f.id) ? '✓' : '+'}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">tekin keladi (BaseEntity)</p>
            <div className="frame" style={{ padding: 14 }}>
              <div className="ent-row free">id (uuid) <span>← BaseEntity</span></div>
              <div className="ent-row free">created_at <span>← BaseEntity</span></div>
              <div className="ent-row free">updated_at <span>← BaseEntity</span></div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Reja tayyor: 4 ta o'z ustunimiz + 3 ta tekin. Endi buni 1-faylga — Entity'ga yozamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — 1-QADAM: ENTITY =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const { fill } = useBoard();
  useEffect(() => { if (storedAnswer) fill('entity'); }, []); // eslint-disable-line
  const candidates = [
    { id: 'brand', correct: true, label: '@Column()  brand: string;', node: <><At>@Column</At>{'()  brand: '}<St>string</St>{';'}</> },
    { id: 'model', correct: true, label: '@Column()  model: string;', node: <><At>@Column</At>{'()  model: '}<St>string</St>{';'}</> },
    { id: 'price', correct: true, label: '@Column()  price: number;', node: <><At>@Column</At>{'()  price: '}<St>number</St>{';'}</> },
    { id: 'avail', correct: true, label: '@Column({ default: true })  is_available: boolean;', node: <><At>@Column</At>{'({ default: '}<Jx>true</Jx>{' })  is_available: '}<St>boolean</St>{';'}</> },
    { id: 'id', correct: false, label: 'id: string;', why: "id kerakmas — u BaseEntity'dan tekin keladi. Qayta yozsangiz, takror bo'ladi." },
    { id: 'username', correct: false, label: 'username: string;', why: "Bu admin'ga tegishli. Mashinada username yo'q — bu qator boshqa resursdan." }
  ];
  return (
    <Stage eyebrow="1-qadam · Entity" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Faylni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashina haqida nimani saqlaymiz — jadval <span className="italic" style={{ color: T.accent }}>qanday ko'rinadi</span>?</h2></div>
        <Mentor><span className="mono">Entity</span> bazadagi jadval ko'rinishini belgilaydi. <span className="mono">BaseEntity</span>'dan meros olamiz — <b style={{ color: T.ink }}>id, created_at, updated_at tekin</b>. Faqat o'z ustunlarimizni qo'shamiz. Diqqat: o'ngdagi ba'zi qatorlar <b style={{ color: T.ink }}>boshqa qatlamga</b> tegishli — faqat to'g'rilarini tanlang.</Mentor>
        <OpeningBoard />
        <PickLines
          fileName="src/core/entity/car.entity.ts"
          scaffoldTop={<><At>@Entity</At>{"('cars')"}{'\n'}<Jx>export class</Jx>{' CarEntity '}<Jx>extends</Jx>{' BaseEntity {'}</>}
          scaffoldBottom={<>{'}'}</>}
          candidates={candidates}
          agent={"car.entity.ts yoz: BaseEntity'dan meros olsin; brand, model (matn), price (raqam), is_available (default true) ustunlari bo'lsin."}
          instruction="car.entity.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); fill('entity'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>1-fayl tayyor! Lekin <span className="mono">/car</span> hali yo'q — bitta fayl yetmaydi. Keyingi qadam: ma'lumot qoidalari (DTO).</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (Entity) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Entity nimani belgilaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Entity</span> <span className="italic" style={{ color: T.accent }}>nimani</span> belgilaydi?</h2></>}
    options={['So\'rovni butunlay qabul qilib olishni', 'Kelgan ma\'lumot qoidalarini tekshirishni', 'Bazadagi jadval qanday ko\'rinishini', 'Loyihani ishga tushirish tartibini']} correctIdx={2}
    explainCorrect="To'g'ri! Entity — jadval ko'rinishi: qaysi ustunlar bor (brand, price...). id va vaqtlar BaseEntity'dan tekin keladi."
    explainWrong={{
      0: "So'rovni qabul qilish — Controller (ofitsiant) ishi. Entity — jadval shakli.",
      1: "Ma'lumot qoidalari — DTO ishi. Entity esa bazadagi ustunlarni belgilaydi.",
      3: "Ishga tushirish — main.ts. Entity — jadval shakli.",
      default: "Entity = jadval shakli (qaysi ustunlar bor)."
    }} />
);

// ===== SCREEN 5 — 2-QADAM: DTO + VALIDATSIYA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [res, setRes] = useState(storedAnswer ? 'bad' : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['ok', 'bad']) : new Set());
  const [sc, setSc] = useState(0);
  const { fill } = useBoard();
  const done = seen.size >= 2;
  const send = (kind) => { setRes(kind); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(kind); return s; }); };
  useEffect(() => { if (storedAnswer) fill('dto'); }, []); // eslint-disable-line
  useEffect(() => { if (done) { fill('dto'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); } }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="2-qadam · DTO" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : "To'g'ri va xato so'rovni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Noto'g'ri mashina ma'lumoti kelsa — <span className="italic" style={{ color: T.accent }}>kim to'xtatadi</span>?</h2></div>
        <Mentor><span className="mono">DTO</span> — buyurtma anketasi: <span className="mono">brand</span> matn va majburiy, <span className="mono">price</span> raqam bo'lishi shart. Qoidalarni <span className="mono">@IsString</span>, <span className="mono">@IsNotEmpty</span>, <span className="mono">@IsNumber</span> belgilaydi. Nazoratchi (ValidationPipe) tekshiradi. To'g'ri va xato so'rovni yuboring.</Mentor>
        <OpeningBoard />
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="src/api/car/dto/create-car.dto.ts">
              <Jx>export class</Jx>{' CreateCarDto {'}{'\n'}
              {'  '}<At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()'}{'\n'}
              {'  brand: '}<St>string</St>{';'}{'\n\n'}
              {'  '}<At>@IsNumber</At>{'()'}{'\n'}
              {'  price: '}<St>number</St>{';'}{'\n'}
              {'}'}
            </CodeFile>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={() => send('ok')}>✅ To'g'ri: {`{ brand: 'Chevrolet', price: 15000 }`}</button>
              <button className="btn-soft" onClick={() => send('bad')}>❌ Xato: {`{ brand: '', price: 'arzon' }`}</button>
            </div>
            <AgentCard>create-car.dto.ts yoz: brand — majburiy matn (@IsString, @IsNotEmpty), price — raqam (@IsNumber), is_available — ixtiyoriy.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">Nazoratchi javobi</p>
            {res === 'ok' && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ 201 — qabul qilindi</p><p className="body" style={{ margin: 0, color: T.ink }}>brand to'ldirilgan, price raqam — anketa to'g'ri, ichkariga o'tdi.</p></div>}
            {res === 'bad' && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 400 — rad etildi</p><p className="body" style={{ margin: 0, color: T.ink }}>brand bo'sh, price esa raqam emas ("arzon") — qoidalar buzilgan. So'rov service'gacha ham bormadi.</p></div>}
            {res === null && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rov yuboring ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>DTO + nazoratchi ilovani ifloslangan ma'lumotdan himoya qiladi. Yomon ma'lumot bazaga umuman yetib bormaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — 2-QADAM (b): UpdateCarDto (PartialType) — 2 VARIANTLI MIKRO-TANLOV =====
// Mijoz faqat NARXNI o'zgartirmoqchi — unga qaysi anketani beramiz? Ikkala OQIBAT ham ko'rinadi.
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(['full', 'partial']) : new Set());
  const [cur, setCur] = useState(storedAnswer ? 'partial' : null);
  const [sc, setSc] = useState(0);
  const { fill, plusOn } = useBoard();
  const done = seen.size >= 2;
  const choose = (k) => { setCur(k); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (storedAnswer) plusOn(); }, []); // eslint-disable-line
  useEffect(() => { if (done) { plusOn(); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); } }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="2-qadam · Update DTO" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `Ikkala variantni sinang (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mijoz faqat narxni o'zgartirmoqchi — unga <span className="italic" style={{ color: T.accent }}>qaysi anketani</span> berasiz?</h2></div>
        <Mentor>Ikkala tugmani ham bosib ko'ring — <b style={{ color: T.ink }}>oqibatini o'zingiz ko'rasiz</b>. Tahrirlashda mijoz faqat o'zgargan katakchani to'ldiradi: <span className="mono">{"{ price: 12000 }"}</span>.</Mentor>
        <OpeningBoard />
        <Zoomable>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className={`pick-row ${cur === 'full' ? 'picked' : ''} ${!seen.has('full') ? 'tap-hint' : ''}`} onClick={() => choose('full')}>
                <span style={{ flex: 1 }}>a) To'liq anketa — CreateCarDto</span>
                <span className="pick-plus">{seen.has('full') ? '✓' : '?'}</span>
              </button>
              <button className={`pick-row ${cur === 'partial' ? 'picked' : ''} ${!seen.has('partial') ? 'tap-hint' : ''}`} onClick={() => choose('partial')}>
                <span style={{ flex: 1 }}>b) PartialType(CreateCarDto) — nusxa</span>
                <span className="pick-plus">{seen.has('partial') ? '✓' : '?'}</span>
              </button>
            </div>
            {cur === 'full' && (
              <CodeFile name="src/api/car/dto/update-car.dto.ts" minH={110}>
                <Cm>{'// a) to\'liq anketa — hamma katakcha MAJBURIY'}</Cm>{'\n'}
                <Jx>export class</Jx>{' UpdateCarDto {'}{'\n'}
                {'  '}<At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()  brand: '}<St>string</St>{';'}{'\n'}
                {'  '}<At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()  model: '}<St>string</St>{';'}{'\n'}
                {'  '}<At>@IsNumber</At>{'()  price: '}<St>number</St>{';'}{'\n'}
                {'}'}
              </CodeFile>
            )}
            {cur === 'partial' && (
              <CodeFile name="src/api/car/dto/update-car.dto.ts" minH={110}>
                <Cm>{'// b) bir xil anketa — lekin har katakcha IXTIYORIY'}</Cm>{'\n'}
                <Jx>export class</Jx>{' UpdateCarDto '}{'\n'}
                {'  '}<Jx>extends</Jx>{' '}<At>PartialType</At>{'(CreateCarDto) {}'}
              </CodeFile>
            )}
            {cur === null && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Variantni tanlang ↑</p></div>}
            <AgentCard>update-car.dto.ts yoz: PartialType(CreateCarDto) — barcha maydon ixtiyoriy bo'lsin.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">natija · PATCH /car/:id  {`{ price: 12000 }`}</p>
            {cur === 'full' && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 400 — rad etildi</p><p className="body" style={{ margin: 0, color: T.ink }}>To'liq anketada <span className="mono">brand</span> va <span className="mono">model</span> ham majburiy. Mijoz faqat narxni yubordi — anketa chala, so'rov o'tmadi.</p></div>}
            {cur === 'partial' && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ 200 — o'zgartirildi</p><p className="body" style={{ margin: 0, color: T.ink }}>PartialType create anketasini olib, har katakchani <b>ixtiyoriy</b> qildi. Faqat <span className="mono">price</span> yetarli.</p></div>}
            <div className="frame" style={{ padding: 14 }}>
              <div className="ent-row siz">brand, model, price <span>← create'da majburiy</span></div>
              {seen.has('partial') && <><div className="ent-row free el-in">brand? (ixtiyoriy) <span>← PartialType</span></div><div className="ent-row free el-in">price? (ixtiyoriy) <span>← PartialType</span></div></>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta qator — tahrirlash anketasi tayyor. Bir xil kodni ikki marta yozmaslik — professional odat (DRY).</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 (DTO) =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="brand bo'sh holda POST /car yuborilsa nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bo'sh <span className="mono">brand</span> yuborilsa <span className="italic" style={{ color: T.accent }}>nima</span> bo'ladi?</h2></>}
    options={['201 — mashina baribir saqlanadi', 'Server butunlay ishdan chiqadi', 'brand avtomatik ravishda qo\'yiladi', '400 qaytadi — bazaga bormaydi']} correctIdx={3}
    explainCorrect="To'g'ri! DTO qoidasi (@IsNotEmpty) buzilgani uchun nazoratchi (ValidationPipe) so'rovni 400 bilan rad etadi — service va bazaga yetib bormaydi."
    explainWrong={{
      0: "Saqlanmaydi — qoida buzilgan. DTO yomon ma'lumotni ichkariga kiritmaydi (400).",
      1: "Server ishdan chiqmaydi — DTO toza ravishda 400 qaytaradi.",
      2: "Avtomatik qo'yilmaydi — qoida buzilsa so'rov rad etiladi (400).",
      default: "Bo'sh brand = 400, bazaga bormaydi."
    }} />
);

// ===== SCREEN 8 — 3-QADAM: SERVICE (BaseService meros) — 2 VARIANTLI MIKRO-TANLOV =====
// «Yangi oshpaz keldi. Unga nima berasiz?» — bo'sh daftar (40 qator) ↔ tayyor retsept kitobi (4 qator).
const FREE_METHODS = ['create', 'findAll', 'findOneById', 'update', 'remove'];
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(['manual', 'base']) : new Set());
  const [cur, setCur] = useState(storedAnswer ? 'base' : null);
  const [sc, setSc] = useState(0);
  const { fill } = useBoard();
  const done = seen.size >= 2;
  const choose = (k) => { setCur(k); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (storedAnswer) fill('service'); }, []); // eslint-disable-line
  useEffect(() => { if (done) { fill('service'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); } }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="3-qadam · Service" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `Ikkala yo'lni ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi oshpaz keldi — unga <span className="italic" style={{ color: T.accent }}>nima berasiz</span>?</h2></div>
        <Mentor>Mashina CRUD'ini (qo'shish/o'qish/o'zgartirish/o'chirish) ikki yo'l bilan olish mumkin. Ikkalasini ham bosib, <b style={{ color: T.ink }}>kod hajmini solishtiring</b>.</Mentor>
        <OpeningBoard />
        <Zoomable>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className={`pick-row ${cur === 'manual' ? 'picked' : ''} ${!seen.has('manual') ? 'tap-hint' : ''}`} onClick={() => choose('manual')}>
                <span style={{ flex: 1 }}>a) Bo'sh daftar — 5 metodni qo'lda yozadi</span>
                <span className="pick-plus">{seen.has('manual') ? '✓' : '?'}</span>
              </button>
              <button className={`pick-row ${cur === 'base' ? 'picked' : ''} ${!seen.has('base') ? 'tap-hint' : ''}`} onClick={() => choose('base')}>
                <span style={{ flex: 1 }}>b) Tayyor retsept kitobi — extends BaseService</span>
                <span className="pick-plus">{seen.has('base') ? '✓' : '?'}</span>
              </button>
            </div>
            {cur === 'manual' && (
              <CodeFile name="src/api/car/car.service.ts  ·  ~40 qator" minH={210}>
                <At>@Injectable</At>{'()'}{'\n'}
                <Jx>export class</Jx>{' CarService {'}{'\n'}
                {'  create(dto) { '}<Jx>return</Jx>{' this.carRepo.save(dto); }'}{'\n'}
                {'  findAll() { '}<Jx>return</Jx>{' this.carRepo.find(); }'}{'\n'}
                {'  findOneById(id) {'}{'\n'}
                {'    '}<Jx>const</Jx>{' car = this.carRepo.findOneBy({ id });'}{'\n'}
                {'    '}<Jx>if</Jx>{' (!car) '}<Jx>throw new</Jx>{' NotFoundException();'}{'\n'}
                {'    '}<Jx>return</Jx>{' car;'}{'\n'}
                {'  }'}{'\n'}
                {'  update(id, dto) { ... }'}{'\n'}
                {'  remove(id) { ... }'}{'\n'}
                <Cm>{'  // ...va bu HAR resursda qaytadan takrorlanadi'}</Cm>{'\n'}
                {'}'}
              </CodeFile>
            )}
            {cur === 'base' && (
              <CodeFile name="src/api/car/car.service.ts  ·  4 qator" minH={210}>
                <At>@Injectable</At>{'()'}{'\n'}
                <Jx>export class</Jx>{' CarService'}{'\n'}
                {'  '}<Jx>extends</Jx>{' BaseService<CreateCarDto, UpdateCarDto, CarEntity> {'}{'\n'}
                {'  constructor('}<At>@InjectRepository</At>{'(CarEntity) '}<Jx>private readonly</Jx>{' carRepo) {'}{'\n'}
                {'    '}<Jx>super</Jx>{'(carRepo);'}{'\n'}
                {'  }'}{'\n'}
                {'}'}
              </CodeFile>
            )}
            {cur === null && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Variantni tanlang ↑</p></div>}
            <AgentCard>CarService yoz: BaseService'dan meros olsin (Create/Update DTO, CarEntity), CarEntity repozitoriysini inject qilib super(repo) chaqirsin.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {cur === 'manual' && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>~40 qator qo'l mehnati</p><p className="body" style={{ margin: 0, color: T.ink }}>5 metodni o'zingiz yozasiz — va keyingi resursda (mijoz, buyurtma) HAMMASI qaytadan.</p></div>}
            {cur === 'base' && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>4 qator — 5 metod tekin</p><p className="body" style={{ margin: 0, color: T.ink }}>Oshpaz har taomni noldan o'ylab topmaydi — tayyor retsept kitobidan oladi.</p></div>}
            {seen.has('base') && <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{FREE_METHODS.map(m => <span key={m} className="gchip" style={{ boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success }}>✓ {m}()</span>)}</div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 ta CRUD metod — bittasini ham yozmadingiz, BaseService'dan keldi. O'ziga xos mantiq kerak bo'lsagina qo'shasiz (mashinada kerak emas).</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (BaseService) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="CarService'da CRUD (create, findAll, remove...) kodini kim yozadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>CRUD kodini <span className="italic" style={{ color: T.accent }}>kim</span> yozadi?</h2></>}
    options={['Har resurs uchun qo\'lda qayta yozamiz', 'Hech kim — BaseService\'dan tekin keladi', 'Controller o\'zi to\'liq yozib chiqadi', 'PostgreSQL o\'zi avtomatik ravishda yozadi']} correctIdx={1}
    explainCorrect="To'g'ri! BaseService'dan meros olgani uchun CRUD tekin keladi. Siz faqat o'ziga xos mantiqni (kerak bo'lsa) qo'shasiz."
    explainWrong={{
      0: "Qayta yozish — vaqt isrofi. Aynan shuning uchun BaseService bor — meros olasiz, tekin keladi.",
      2: "Controller faqat so'rovni qabul qiladi. CRUD esa BaseService'dan keladi.",
      3: "Baza kodni yozmaydi. CRUD metodlari BaseService'dan meros bo'lib keladi.",
      default: "CRUD = BaseService'dan tekin (meros)."
    }} />
);

// ===== SCREEN 10 — 4-QADAM: CONTROLLER =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const { fill } = useBoard();
  useEffect(() => { if (storedAnswer) fill('controller'); }, []); // eslint-disable-line
  const candidates = [
    { id: 'post', correct: true, label: '@Post()  create(@Body() dto)', node: <><At>@Post</At>{'()  create('}<At>@Body</At>{'() dto) { '}<Jx>return</Jx>{' this.carService.create(dto); }'}</> },
    { id: 'get', correct: true, label: '@Get()  findAll()', node: <><At>@Get</At>{'()  findAll() { '}<Jx>return</Jx>{' this.carService.findAll(); }'}</> },
    { id: 'getid', correct: true, label: '@Get(\':id\')  findOne(@Param() id)', node: <><At>@Get</At>{"(':id')  findOne("}<At>@Param</At>{"('id') id) { "}<Jx>return</Jx>{' this.carService.findOneById(id); }'}</> },
    { id: 'patch', correct: true, label: '@Patch(\':id\')  update(...)', node: <><At>@Patch</At>{"(':id')  update("}<At>@Param</At>{"('id') id, "}<At>@Body</At>{'() dto) { '}<Jx>return</Jx>{' this.carService.update(id, dto); }'}</> },
    { id: 'delete', correct: true, label: '@Delete(\':id\')  remove(...)', node: <><At>@Delete</At>{"(':id')  remove("}<At>@Param</At>{"('id') id) { "}<Jx>return</Jx>{' this.carService.remove(id); }'}</> },
    { id: 'col', correct: false, label: '@Column()  brand: string;', why: "Bu Entity'ga tegishli (jadval ustuni). Controller'da eshiklar (@Get/@Post) bo'ladi." },
    { id: 'super', correct: false, label: 'super(carRepo);', why: "Bu Service'ga tegishli (BaseService chaqiruvi). Controller'da bunday qator bo'lmaydi." }
  ];
  return (
    <Stage eyebrow="4-qadam · Controller" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Eshiklarni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Admin mashina qo'shmoqchi — so'rov <span className="italic" style={{ color: T.accent }}>qaysi eshikdan</span> kiradi?</h2></div>
        <Mentor><span className="mono">Controller</span> — ofitsiant: so'rovni qabul qiladi va service'ning mos metodini chaqiradi. Har amal — bir eshik: <span className="mono">@Post</span> (qo'shish), <span className="mono">@Get</span> (o'qish), <span className="mono">@Patch</span> (o'zgartirish), <span className="mono">@Delete</span> (o'chirish). O'ngdagilardan faqat <b style={{ color: T.ink }}>controller'ga tegishlilarini</b> tanlang.</Mentor>
        <OpeningBoard />
        <PickLines
          fileName="src/api/car/car.controller.ts"
          scaffoldTop={<><At>@Controller</At>{"('car')"}{'\n'}<Jx>export class</Jx>{' CarController {'}{'\n'}{'  constructor('}<Jx>private readonly</Jx>{' carService: CarService) {}'}</>}
          scaffoldBottom={<>{'}'}</>}
          candidates={candidates}
          agent={"CarController yoz: create, findAll, findOne, update, remove — standart CRUD endpointlar, har biri CarService'ning mos metodini chaqirsin."}
          instruction="car.controller.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); fill('controller'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 ta eshik tayyor. Controller faqat <b>qabul qilib chaqiradi</b> — asosiy ishni service/BaseService bajaradi. Oxirgi qadam: Module.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 4 (Controller) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Yangi mashina qo'shish uchun qaysi dekorator ishlatiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yangi mashina <span className="italic" style={{ color: T.accent }}>qo'shish</span> uchun qaysi dekorator?</h2></>}
    options={['@Post() — yangi mashina qo\'shish', '@Get() — mashinalarni o\'qish', '@Delete() — mashinani o\'chirish', '@Column() — ustunni belgilash']} correctIdx={0}
    explainCorrect="To'g'ri! @Post() — yangi narsa qo'shish (create) uchun. @Get o'qish, @Patch o'zgartirish, @Delete o'chirish."
    explainWrong={{
      1: "@Get() — o'qish uchun. Qo'shish uchun @Post().",
      2: "@Delete() — o'chirish uchun. Qo'shish uchun @Post().",
      3: "@Column() — Entity ustuni, controller dekoratori emas. Qo'shish — @Post().",
      default: "Qo'shish = @Post()."
    }} />
);

// ===== SCREEN 12 — 5-QADAM: MODULE =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const { fill } = useBoard();
  useEffect(() => { if (storedAnswer) fill('module'); }, []); // eslint-disable-line
  const candidates = [
    { id: 'imports', correct: true, label: 'imports: [TypeOrmModule.forFeature([CarEntity])]', node: <>{'imports: [TypeOrmModule.'}<At>forFeature</At>{'([CarEntity])],'}</> },
    { id: 'controllers', correct: true, label: 'controllers: [CarController]', node: <>{'controllers: [CarController],'}</> },
    { id: 'providers', correct: true, label: 'providers: [CarService]', node: <>{'providers: [CarService],'}</> },
    { id: 'isstring', correct: false, label: '@IsString()  brand: string;', why: "Bu DTO'ga tegishli (validatsiya qoidasi). Module'da ro'yxatlar bo'ladi." },
    { id: 'col', correct: false, label: '@Column()  price: number;', why: "Bu Entity'ga tegishli (jadval ustuni). Module bo'limni ulaydi, ustun yozmaydi." }
  ];
  return (
    <Stage eyebrow="5-qadam · Module" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Module\'ni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">5 fayl alohida turibdi — ularni <span className="italic" style={{ color: T.accent }}>kim bir-biriga ulaydi</span>?</h2></div>
        <Mentor><span className="mono">Module</span> bir bo'limning qismlarini ro'yxatga oladi: jadval (<span className="mono">forFeature</span>), eshik (controller), ish (service). Keyin NestJS ularni <b style={{ color: T.ink }}>avtomatik ulaydi</b> (DI). O'ngdan faqat <b style={{ color: T.ink }}>module'ga tegishli</b> ro'yxatlarni tanlang.</Mentor>
        <OpeningBoard />
        <PickLines
          fileName="src/api/car/car.module.ts"
          scaffoldTop={<><At>@Module</At>{'({'}</>}
          scaffoldBottom={<>{'})'}{'\n'}<Jx>export class</Jx>{' CarModule {}'}</>}
          candidates={candidates}
          agent={"CarModule yoz: imports'da TypeOrmModule.forFeature([CarEntity]), controllers'da CarController, providers'da CarService bo'lsin."}
          instruction="car.module.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); fill('module'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>5 fayl tayyor: Entity, DTO, Service, Controller, Module. Lekin bitta oxirgi ulanish qoldi — usiz <span className="mono">/car</span> baribir ishlamaydi!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — OCHILISH KUNI: mijoz kiradi → 404 → taxtachani osamiz → 200 OK =====
// Faza: 0 boshlang'ich · 1 mijoz yurdi va 404 · 2 taxtacha osildi (kodda CarModule paydo) · 3 mijoz kirdi, 200 OK
const OK_JSON = [
  '{',
  '  "statusCode": 200,',
  '  "message": "success",',
  '  "data": [',
  '    { "brand": "Chevrolet", "model": "Cobalt", "price": 15000 }',
  '  ]',
  '}'
];
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0);
  const [walking, setWalking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [holding, setHolding] = useState(false); // mobil: taxtachani "qo'lga oldi"
  const [typed, setTyped] = useState(storedAnswer ? OK_JSON.length : 0);
  const [sc, setSc] = useState(0);
  const { fill } = useBoard();
  const wired = phase >= 2;
  const done = phase >= 3;
  useEffect(() => { if (storedAnswer) fill('plate'); }, []); // eslint-disable-line
  useEffect(() => { if (done) { fill('plate'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); } }, [done]); // eslint-disable-line
  // 200 javobi satrma-satr yoziladi (.json-type — ✨ Animatsiya sayqallaydi)
  useEffect(() => {
    if (phase !== 3 || typed >= OK_JSON.length) return;
    const t = setTimeout(() => setTyped(n => n + 1), 220);
    return () => clearTimeout(t);
  }, [phase, typed]);
  const enterVisitor = () => {
    if (walking || done) return;
    setWalking(true); setSc(n => n + 1);
    setTimeout(() => { setWalking(false); setPhase(p => (p >= 2 ? 3 : 1)); setSc(n => n + 1); }, 1300);
  };
  const hangPlate = () => {
    if (phase !== 1) return;
    setPhase(2); setHolding(false); setDragOver(false); setSc(n => n + 1);
  };
  const canHang = phase === 1;
  return (
    <Stage eyebrow="Ochilish kuni · AppModule" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : (phase === 0 ? 'Mijozni kiriting' : phase === 1 ? 'Taxtachani osing' : 'Mijozni yana kiriting')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">5 fayl tayyor — nega <span className="mono" style={{ color: T.accent }}>/car</span> hali ham <span className="italic" style={{ color: T.accent }}>404</span> qaytaradi?</h2></div>
        <Mentor>Xodimlar joyida, lekin mijoz bo'limni <b style={{ color: T.ink }}>topa olmaydi</b>: kirish taxtasida «Mashinalar» yozilmagan. NestJS ham shunday — <span className="mono">AppModule</span> imports'ida yo'q modul ko'rinmaydi. Avval mijozni kiriting, keyin taxtachani osing.</Mentor>
        <OpeningBoard />
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">restoran kirishi</p>
            <div className={`oc-door ${walking ? 'oc-walk' : ''} ${phase === 1 && !walking ? 'is-404' : ''} ${done ? 'is-ok' : ''}`}>
              <div className="oc-plate-board">
                <span className="oc-plate-h">🚪 KIRISH TAXTASI</span>
                <span className="oc-plate-row">AdminModule</span>
                <span className="oc-plate-row">AuthModule</span>
                <div
                  className={`oc-plate-drop ${dragOver ? 'over' : ''} ${wired ? 'filled' : ''}`}
                  onDragOver={(e) => { if (canHang) { e.preventDefault(); setDragOver(true); } }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); hangPlate(); }}
                  onClick={() => { if (canHang && holding) hangPlate(); }}
                >
                  {wired
                    ? <span className="oc-plate-row on oc-plate-snap">🚗 Mashinalar</span>
                    : <span className="oc-plate-empty">{canHang ? (holding ? '↓ shu yerga qo\'ying' : 'bo\'sh joy — taxtacha yo\'q') : 'bo\'sh joy — taxtacha yo\'q'}</span>}
                </div>
              </div>
              <div className="oc-visitor" aria-hidden="true">{walking ? '🙋' : (done ? '🛎️ 🙋' : (phase === 1 ? '🙋‍♂️' : '🙋'))}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" disabled={walking || done} onClick={enterVisitor}>{done ? '✓ Mijoz kirdi' : (walking ? '🚶 Mijoz kirmoqda…' : '🚪 Mijozni kiriting')}</button>
              {canHang && (
                <button
                  className={`oc-plate-chip ${holding ? 'held tap-hint' : 'tap-hint'}`}
                  draggable
                  onDragStart={() => setHolding(true)}
                  onDragEnd={() => setDragOver(false)}
                  onClick={() => setHolding(h => !h)}
                >🚗 Mashinalar — taxtachani sudrang</button>
              )}
            </div>
            <AgentCard>CarModule'ni AppModule'ning imports ro'yxatiga qo'sh — endpointlar tirik bo'lsin.</AgentCard>
          </Col>
          <Col>
            <CodeFile name="src/api/app.module.ts" minH={120}>
              <At>@Module</At>{'({'}{'\n'}
              {'  imports: ['}{'\n'}
              {'    AdminModule, AuthModule,'}{'\n'}
              {wired
                ? <span className="el-in oc-code-new" style={{ color: T.success }}>{'    CarModule,   // ← qo\'shildi ✓'}</span>
                : <Cm>{'    // CarModule, ← yo\'q!'}</Cm>}{'\n'}
              {'  ],'}{'\n'}
              {'})'}{'\n'}
              <Jx>export class</Jx>{' AppModule {}'}
            </CodeFile>
            <p className="flow-label">GET /car natijasi</p>
            {phase === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Mijozni kiriting ←</p></div>}
            {phase === 1 && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 404 — topilmadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Fayllar bor, xodimlar joyida — lekin mijoz bo'limni topa olmadi. Taxtada «Mashinalar» yo'q. Chapdagi taxtachani sudrab, kirish taxtasiga oling.</p></div>}
            {phase === 2 && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>🪧 Taxtacha osildi</p><p className="body" style={{ margin: 0, color: T.ink }}>Kodda <span className="mono">CarModule,</span> qatori paydo bo'ldi. Endi mijozni yana kiriting — bo'limni topadimi?</p></div>}
            {done && <>
              <pre className="json json-type">{OK_JSON.slice(0, typed).join('\n')}</pre>
              {typed >= OK_JSON.length && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ 200 OK — bo'lim ochildi</p><p className="body" style={{ margin: 0, color: T.ink }}>Bitta qator hammasini ishga tushirdi. Ochilish taxtasi to'ldi — <b>6/6</b>.</p></div>}
            </>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 5 (Ulash / DI) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 5-savol"
    questionText="5 fayl yozildi, lekin CarModule AppModule'ga qo'shilmadi. Nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>CarModule <span className="italic" style={{ color: T.accent }}>ulanmasa</span> nima bo'ladi?</h2></>}
    options={['Hammasi baribir avvalgidek ishlayveradi', '/car endpointlari ishlamaydi — 404', 'Butun loyiha umuman ishga tushmay qoladi', 'Faqat GET so\'rovlari ishlayveradi']} correctIdx={1}
    explainCorrect="To'g'ri! NestJS faqat AppModule imports'idagi modullarni biladi. Ulanmasa — CarModule ko'rinmaydi, /car = 404."
    explainWrong={{
      0: "Ishlamaydi — NestJS modulni ro'yxatdan ko'rmasa, endpointlar paydo bo'lmaydi (404).",
      2: "Loyiha ishga tushadi, lekin /car eshiklari yo'q bo'ladi (404). Bu juda tez-tez bo'ladigan xato.",
      3: "GET ham ishlamaydi — butun CarModule ko'rinmaydi.",
      default: "Ulanmasa = /car 404."
    }} />
);

// ===== SCREEN 15 — CASE: SO'ROV YO'LI (POST /car) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? FLOW.length : -1);
  const [sc, setSc] = useState(0);
  const done = step >= FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const adv = () => { setStep(s => Math.min(s + 1, FLOW.length - 1)); setSc(n => n + 1); };
  const cur = step >= 0 ? FLOW[Math.min(step, FLOW.length - 1)] : null;
  return (
    <Stage eyebrow="Markaziy · so'rov yo'li" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : "So'rovni oxirigacha kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Admin <span className="mono" style={{ color: T.accent }}>POST /car</span> bosdi — so'rov qanday <span className="italic" style={{ color: T.accent }}>sayohat</span> qiladi?</h2></div>
        <Mentor>Siz qurgan resurs orqali bitta so'rovni kuzatamiz. Har bekat — siz yozgan fayllardan biri. Tugmani bosib, oxirigacha boring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="flow-rail fade-up delay-1">
              {FLOW.map((f, i) => {
                const lit = step >= i;
                return (
                  <div key={f.k} className="flow-stop" style={{ opacity: lit ? 1 : 0.35 }}>
                    <span className="flow-ico" style={{ background: lit ? T.accent : T.paper, color: lit ? '#fff' : T.ink3 }}>{f.icon}</span>
                    <span className="flow-k" style={{ color: lit ? T.ink : T.ink3 }}>{f.k}</span>
                    {i < FLOW.length - 1 && <span className="flow-down" style={{ color: step > i ? T.accent : T.ink3 + '66' }}>↓</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={adv}>{step < 0 ? "▶ So'rovni yuborish" : (done ? '✓ Javob qaytdi' : 'Keyingi bekat →')}</button>
            {cur && <div className="sk-info fade-step" key={step}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.k}</span> · {cur.r}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana butun yo'l — hammasi siz qurgan 5 fayl orqali o'tdi. Endi Swagger'da tirik ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — AGENT YARATADI (playbook → 5 fayl) =====
const PLAYBOOK_FILES = [
  { f: 'car.entity.ts', d: 'brand · model · price · is_available' },
  { f: 'dto/create-car.dto.ts', d: 'qoidalar (@IsString, @IsNumber)' },
  { f: 'dto/update-car.dto.ts', d: 'PartialType(CreateCarDto)' },
  { f: 'car.service.ts', d: 'BaseService meros — CRUD tekin' },
  { f: 'car.controller.ts', d: 'create · findAll · findOne · update · remove' },
  { f: 'car.module.ts → AppModule', d: 'ro\'yxatga olib, ulaydi' }
];
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TOTAL = PLAYBOOK_FILES.length;
  const [n, setN] = useState(storedAnswer ? TOTAL : 0);
  const [running, setRunning] = useState(false);
  const [sc, setSc] = useState(0);
  const done = n >= TOTAL;
  useEffect(() => {
    if (!running) return;
    if (n >= TOTAL) { setRunning(false); return; }
    const t = setTimeout(() => { setN(x => x + 1); setSc(s => s + 1); }, 600);
    return () => clearTimeout(t);
  }, [running, n]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const run = () => { if (running || done) return; setN(0); setRunning(true); };
  return (
    <Stage eyebrow="Agent · yaratish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Playbookni yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sekin qo'lda qildik — agent buni necha <span className="italic" style={{ color: T.accent }}>soniyada</span> quradi?</h2></div>
        <Mentor>Endi 5 qadamni tushunasiz — demak agentga ham aniq buyruq bera olasiz. Mana sizning <b style={{ color: T.ink }}>playbook</b>ingiz. Uni agentga yuboring — u fayllarni o'zi yozib beradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="prompt-box fade-up delay-1">
              <span className="agent-lbl">💬 Agentga playbook</span>
              <p className="agent-msg" style={{ marginBottom: 0 }}>"Avtosalon uchun Car resursini qo'sh: Entity (brand, model, price, is_available) → create/update DTO → BaseService'dan meros service → CRUD controller → module va uni AppModule'ga ula."</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={running || done} onClick={run}>{done ? '✓ Yozildi' : (running ? '⏳ Agent yozyapti…' : '▶ Playbookni agentga yuborish')}</button>
            <AgentCard>Bir buyruqning o'zi — chunki agent 5 qadamni qaysi tartibda qilishni siz aytib berdingiz.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">Agent yaratayotgan fayllar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {PLAYBOOK_FILES.map((file, i) => {
                const ready = i < n;
                const active = running && i === n;
                if (!ready && !active) return <div key={i} className="gen-file" style={{ opacity: 0.4 }}><span className="gen-ico">·</span><span className="mono" style={{ flex: 1 }}>{file.f}</span></div>;
                return (
                  <div key={i} className={`gen-file ${ready ? 'ready' : ''} el-in`}>
                    <span className="gen-ico" style={{ color: ready ? T.success : T.amber }}>{ready ? '✓' : '⏳'}</span>
                    <span className="mono" style={{ flex: 1 }}>{file.f}</span>
                    <span className="gen-d">{ready ? file.d : 'yozilmoqda…'}</span>
                  </div>
                );
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agent 5 qadamni soniyalarda bajardi! Lekin diqqat — agent ham shoshib xato qiladi. Keyingi ekranda uning kodini <b>tekshiramiz</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — DEBUG: agent xato qildi (begona qator) =====
const Screen17 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [openId, setOpenId] = useState(storedAnswer ? 'POST/car' : null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['POST/car']) : new Set());
  const [sc, setSc] = useState(0);
  const [missed, setMissed] = useState(0); // xato qatorni bosishlar — real xato imkoniyati bor
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null); // 1-URINISH QOTIRILADI
  const mountTs = useRef(Date.now()); // tezlik: ekran ochilgandan yechimgacha (podiumda teng ballda hal qiladi)
  const done = fixed;
  // ⚡ JONLI BALL: picked = 0 (1-urinishda begona qatorni topdi) yoki 1 (avval to'g'ri qatorni bosdi).
  // INLINE_KEYS.s17 = 0 → serverda faqat `picked === 0` to'g'ri sanaladi (soxta «hamma to'g'ri» yo'q).
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Agent kodidagi begona qatorni toping", correct: firstCorrectRef.current === true, firstAttemptCorrect: firstCorrectRef.current === true, solved: true, picked: firstCorrectRef.current === true ? 0 : 1, elapsedMs: Date.now() - mountTs.current }); }, [done]); // eslint-disable-line
  const pickBad = () => { if (found) return; if (firstCorrectRef.current === null) firstCorrectRef.current = true; setFound(true); setSc(n => n + 1); };
  const pickGood = () => { if (found || fixed) return; if (firstCorrectRef.current === null) firstCorrectRef.current = false; setMissed(m => m + 1); setSc(n => n + 1); };
  const fix = () => { setFixed(true); setSc(n => n + 1); };
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Debugging · nazoratchi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Oxirgi qadam →' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent yozdi — lekin <span className="mono" style={{ color: T.accent }}>/car</span> xato beryapti. <span className="italic" style={{ color: T.accent }}>Qayerda</span> adashgan?</h2></div>
        <Mentor>Agent shoshib, bitta qatorni <b style={{ color: T.ink }}>noto'g'ri faylga</b> qo'ygan. Siz — <b style={{ color: T.ink }}>NAZORATCHI</b>. <span className="mono">car.controller.ts</span> ni o'qing: controller'ga tegishli bo'lmagan begona qatorni bosib toping.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana CarController kodingiz! (lekin /car ishlamayapti 🤔)</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default', opacity: 0.85 }}><span style={{ color: CODE.attr }}>@Controller</span>{"('car') {"}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri qator"><span style={{ color: CODE.attr }}>@Post</span>{'()  create('}<span style={{ color: CODE.attr }}>@Body</span>{'() dto) { ... }'}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri qator"><span style={{ color: CODE.attr }}>@Get</span>{'()  findAll() { ... }'}</div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickBad}><span style={{ color: CODE.attr }}>@Column</span>{'()  price: '}<span style={{ color: CODE.str }}>number</span>{';'}{fixed ? '' : '   // ?'}</div>
                <div className="ai-line" onClick={pickGood} title="to'g'ri qator"><span style={{ color: CODE.attr }}>@Delete</span>{"(':id')  remove(...) { ... }"}</div>
                <div className="ai-line" style={{ cursor: 'default', opacity: 0.85 }}>{'}'}</div>
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Begona @Column qatorini olib tashlash</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — controller endi toza!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Har qatorni o'qing: <span className="mono">@Column</span> qaysi qatlamga tegishli edi? Begona qatorni bosing.</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">@Column</span> — bu <b>Entity</b> qatori (jadval ustuni), controller'da turibdi. Shuning uchun kod buziladi. Chap tomondagi tugma bilan olib tashlang →</p></div>}
            {fixed && <>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Debug qildingiz!</p><p className="ta-sub">Kodni o'qib, begona qatorni topib, tuzatdingiz — agent ustidan nazorat shu</p></div>
              <CarSwagger available={true} openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
            </>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== 🏅 BADGES (nishonlar) — faqat REAL bosqichlar uchun (tekin emas) =====
// 🎓 Metodist: nom/tavsif matnini sayqallaydi (inglizcha o'yin-nom saqlanadi)
const ACHIEVEMENTS = {
  blueprintDrafter: { icon: '📐', name: 'Blueprint Drafter', desc: "Entity — javon chizmasini to'g'ri o'qidingiz" },
  recipeMaster:     { icon: '📖', name: 'Recipe Master',     desc: "BaseService — tayyor retsept kitobini tushundingiz" },
  detective404:     { icon: '🔎', name: '404 Detective',     desc: "Agent kodidagi begona qatorni topdingiz" },
  grandOpening:     { icon: '🎊', name: 'Grand Opening',     desc: "Mashinalar bo'limini ochdingiz — /car tirik" }
};
// Ekran id → nishon. FAQAT REAL xato imkoniyati bor ekranlar: SCORED testlar (s4, s9, s14) + final challenge (s17).
// ⛔ 'practice' KALITI YO'Q: «✅ Bajardim» tugmasi bir bosishda nishon bermasin (tekin nishon taqiqlanadi).
const ACH_TRIGGERS = { s4: 'blueprintDrafter', s9: 'recipeMaster', s14: 'grandOpening', s17: 'detective404' };

// 🏅 O'YIN USLUBIDAGI TO'LIQ-EKRAN NISHON BAYRAMI
function AchCelebrate({ ach, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, []); // eslint-disable-line
  return (
    <div className="acu-overlay" onClick={onDone} role="status" aria-label={`Yangi nishon: ${ach.name}`}>
      <div className="acu-rays" aria-hidden="true" />
      <div className="acu-glow" aria-hidden="true" />
      <div className="acu-ring" aria-hidden="true" />
      <div className="acu-ring d2" aria-hidden="true" />
      <div className="acu-stage">
        <div className="acu-medal-wrap">
          <div className="acu-medal">{ach.icon}<span className="acu-shine" /></div>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="acu-spark" style={{ '--a': `${i * (360 / 14)}deg`, animationDelay: `${0.18 + (i % 5) * 0.05}s` }}>✦</span>
          ))}
        </div>
        <div className="acu-txt">
          <span className="acu-eyebrow">🏅 Nishon ochildi!</span>
          <span className="acu-name">{ach.name}</span>
          {ach.desc && <span className="acu-desc">{ach.desc}</span>}
        </div>
        <span className="acu-tap">bosib davom eting</span>
      </div>
    </div>
  );
}
function AchToasts({ toasts, onDone }) {
  const t = toasts[0];
  const a = t && ACHIEVEMENTS[t.id];
  if (!a) return null;
  return <AchCelebrate key={t.k} ach={a} onDone={() => onDone(t.k)} />;
}

const Confetti = () => {
  const COLORS = [T.accent, T.success, T.blue, '#FFD380', '#FF7755', '#7DD181'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 44 }).map((_, i) => {
        const left = (i * 2.31 + (i % 7) * 4) % 100;
        const size = 6 + (i % 4) * 2;
        return (
          <span key={i} className="confetti-bit" style={{
            left: `${left}%`, background: COLORS[i % COLORS.length],
            width: size, height: size * 1.5,
            animationDelay: `${(i % 11) * 0.16}s`,
            animationDuration: `${2.4 + (i % 6) * 0.45}s`,
            borderRadius: i % 2 ? '2px' : '50%'
          }} />
        );
      })}
    </div>
  );
};

// ===== ⚔️ CODE STRIKE — arena (savol matni 🎓 Metodist · correct ⚡ Jonli tasdiqlaydi) =====
const QUIZ_MS = 15000;
// Kapsula ichida suzuvchi tokenlar — darsning "DNK"si
const QZ_BG_SHAPES = [
  { ch: '@Post',   l: 5,  t: 10, s: 30, d: 19, dl: 0 },
  { ch: '@Column', l: 82, t: 8,  s: 28, d: 23, dl: 1.5 },
  { ch: 'DTO',     l: 8,  t: 72, s: 28, d: 27, dl: 0.8 },
  { ch: '404',     l: 76, t: 68, s: 30, d: 21, dl: 2.2 },
  { ch: 'imports', l: 45, t: 86, s: 26, d: 25, dl: 1.1 },
  { ch: 'super()', l: 64, t: 26, s: 26, d: 17, dl: 0.4 },
  { ch: '@Get',    l: 26, t: 34, s: 28, d: 20, dl: 1.9 },
  { ch: 'extends', l: 55, t: 5,  s: 24, d: 22, dl: 0.6 },
  { ch: '@Module', l: 89, t: 42, s: 26, d: 24, dl: 1.3 },
  { ch: '/car',    l: 16, t: 52, s: 28, d: 26, dl: 2.6 },
  { ch: '🚗',      l: 2,  t: 30, s: 30, d: 28, dl: 3.1 }
];
// ⚔️ 12 savol — to'g'ri javoblar 4 pozitsiyaga TENG (3/3/3/3). ⚡ Jonli: correct qiymatlarini tasdiqlaydi.
const QUIZ_BANK = [
  { q: "`Entity` nimani belgilaydi?", opts: ["So'rov qaysi eshikdan kirishini bildiradi", "Loyihani qaysi tartibda ishga tushishini", "Foydalanuvchi ekranidagi ranglarni", "Bazadagi jadval qanday ko'rinishini"], correct: 3 },
  { q: "`BaseEntity` qaysi ustunlarni tekin beradi?", opts: ["brand, model hamda price ustunlarini", "id, created_at va updated_at ustunlarini", "username hamda password ustunlarini", "imports va controllers ro'yxatlarini"], correct: 1 },
  { q: "`DTO` nima uchun kerak?", opts: ["Kelgan ma'lumot qoidalarini tekshirish uchun", "Bazadagi jadval ustunlarini yaratish uchun", "CarModule'ni AppModule'ga ulab qo'yish uchun", "NestJS serverini ishga tushirish uchun"], correct: 0 },
  { q: "Bo'sh `brand` bilan POST /car yuborilsa?", opts: ["Mashina baribir bazaga saqlanadi", "Server butunlay ishdan chiqadi", "400 qaytadi — bazaga bormaydi", "brand qiymati avtomatik to'ldiriladi"], correct: 2 },
  { q: "`PartialType(CreateCarDto)` nima qiladi?", opts: ["Barcha maydonni majburiy qiladi", "Barcha maydonni ixtiyoriy qiladi", "Bazada butunlay yangi jadval yaratadi", "Mavjud endpointlarni o'chirib qo'yadi"], correct: 1 },
  { q: "CRUD metodlarini (create, findAll, remove) kim beradi?", opts: ["Controller o'zi to'liq yozib chiqadi", "PostgreSQL o'zi avtomatik yozadi", "Har resursda qaytadan qo'lda yoziladi", "`BaseService` — meros bo'lib keladi"], correct: 3 },
  { q: "Yangi mashina qo'shish uchun qaysi dekorator?", opts: ["`@Post()` — yangisini qo'shish uchun", "`@Get()` — mavjudini o'qish uchun", "`@Column()` — ustunni belgilash uchun", "`@Module()` — bo'limni ulash uchun"], correct: 0 },
  { q: "`Controller` nima qiladi?", opts: ["Jadval ustunlarini aniq belgilab beradi", "Ma'lumotni to'g'ridan-to'g'ri diskka yozadi", "So'rovni qabul qilib, service'ni chaqiradi", "Loyihani noldan build qilib ishga tushiradi"], correct: 2 },
  { q: "`CarModule` `AppModule` imports'iga qo'shilmasa?", opts: ["Hammasi baribir avvalgidek ishlaydi", "/car endpointlari ishlamaydi — 404", "Faqat GET so'rovlari ishlayveradi", "Butun loyiha ishga tushmay qoladi"], correct: 1 },
  { q: "`super(carRepo)` nima uchun chaqiriladi?", opts: ["Bazada yangi jadval yaratish uchun", "Serverni qaytadan ishga tushirish uchun", "Endpointni ro'yxatdan o'tkazish uchun", "BaseService'ga repozitoriyni berish uchun"], correct: 3 },
  { q: "`car.module.ts` ichida nima bo'ladi?", opts: ["@Column'dagi ustunlar ro'yxati", "@IsString kabi qoidalar ro'yxati", "imports, controllers, providers", "main.ts faylining sozlamalari"], correct: 2 },
  { q: "Yangi resurs qo'shishning to'g'ri tartibi?", opts: ["Entity → DTO → Service → Controller → Module", "Controller → Module → Entity → DTO → Service", "Module → Controller → Service → DTO → Entity", "DTO → Entity → Controller → Module → Service"], correct: 0 }
];

const CsNeonBolt = ({ flip }) => (
  <span className={`csn-boltwrap ${flip ? 'flip' : ''}`} aria-hidden="true">
    <svg className="csn-bolt" viewBox="0 0 60 100">
      <defs><linearGradient id="csnb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#B08CFF" /></linearGradient></defs>
      <path d="M38 4 L10 52 L27 52 L20 96 L52 40 L33 40 Z" fill="url(#csnb)" stroke="rgba(255,255,255,.65)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
    <i className="cs-spark s1" /><i className="cs-spark s2" /><i className="cs-spark s3" />
  </span>
);
const CsWordmark = ({ onClick, disabled, hint, stats = true, bolt = true, liveOn = false }) => {
  const clickable = !!onClick && !disabled;
  const [charge, setCharge] = useState(false);
  const fire = () => {
    if (!clickable || charge) return;
    setCharge(true);
    setTimeout(onClick, 430);
    setTimeout(() => setCharge(false), 900);
  };
  return (
    <div
      className={`cs-cap ${clickable ? 'cs-clickable' : ''} ${disabled ? 'cs-off' : ''} ${liveOn ? 'cs-live' : ''} ${charge ? 'cs-charging' : ''}`}
      {...(clickable ? { role: 'button', tabIndex: 0, onClick: fire, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } } } : {})}
    >
      <span className="cs-ring" aria-hidden="true" />
      <div className="cs-sky" aria-hidden="true">
        {QZ_BG_SHAPES.map((s, i) => (
          <span key={i} className={`cs-tok ${i % 2 ? 'back' : 'front'}`} style={{ left: `${s.l}%`, top: `${s.t}%`, fontSize: `clamp(9px, ${Math.round(s.s * 0.4)}px, ${Math.round(s.s * 0.6)}px)`, '--d': `${s.d}s`, animationDelay: `-${s.dl * 3}s` }}>{s.ch}</span>
        ))}
        {[[14, 30, 24], [38, 66, 15], [57, 20, 27], [76, 60, 18], [88, 36, 13]].map(([l, t, w], i) => (
          <i key={i} className="cs-dash" style={{ left: `${l}%`, top: `${t}%`, width: w, animationDelay: `-${i * 1.7}s` }} />
        ))}
        <span className="cs-thunder" />
      </div>
      <div className="cs-row">
        {bolt && <CsNeonBolt />}
        <div className="cs-word" data-text="CODE STRIKE" aria-label="CodeStrike">CODE STRIKE</div>
        {bolt && <CsNeonBolt flip />}
      </div>
      {stats && (
        <div className="cs-hud">
          <span className="cs-hud-i"><b>{QUIZ_BANK.length}</b> SAVOL</span>
          <span className="cs-hud-dot">·</span>
          <span className="cs-hud-i"><b>{QUIZ_MS / 1000}</b> SONIYA</span>
          <span className="cs-hud-dot">·</span>
          <span className="cs-hud-i">🏆 PODIUM</span>
        </div>
      )}
      {hint && <span className={`cs-enter ${disabled ? 'wait' : ''}`}>{hint}</span>}
      {liveOn && <span className="cs-livedot"><i />LIVE</span>}
      {charge && <span className="cs-portal" aria-hidden="true" />}
    </div>
  );
};

// Signal zonasi: test <100 · arena 100+ · praktika 500+ (to'qnashmaydi)
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#FF5A2C', '#0FA6D6', '#F5A623', '#22A05C'];
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
const quizPts = (elapsedMs) => elapsedMs <= 500 ? 1000 : Math.max(0, Math.round(1000 * (1 - (Math.min(elapsedMs, QUIZ_MS) / QUIZ_MS) / 2)));
const quizScore = (rows) => {
  const byQ = {};
  rows.forEach(r => { byQ[r.screen_idx - QUIZ_BASE_IDX] = r; });
  let pts = 0, streak = 0, maxStreak = 0, ok = 0;
  for (let i = 0; i < QUIZ_BANK.length; i++) {
    const a = byQ[i];
    if (a && a.correct) { streak++; maxStreak = Math.max(maxStreak, streak); ok++; pts += quizPts(a.elapsed_ms) + (streak >= 2 ? 100 : 0); }
    else streak = 0;
  }
  return { pts, ok, maxStreak };
};

function QzTimer({ remaining }) {
  const R = 26, C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, remaining / QUIZ_MS));
  const sec = Math.ceil(remaining / 1000);
  const col = remaining > 10000 ? '#2BD97C' : remaining > 5000 ? '#FFC94D' : '#FF5A5A';
  return (
    <div className={`qz-timer ${remaining <= 5000 && remaining > 0 ? 'urgent' : ''}`}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="6" />
        <circle cx="32" cy="32" r={R} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.4s' }} />
      </svg>
      <span className="qz-timer-n" style={{ color: col }}>{sec}</span>
    </div>
  );
}

// Jonli fon: uchqunlar + kod tokenlari (canvas) — ✨ Animatsiya sayqallaydi
function QzFX() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = cv.getContext('2d'); const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, raf = 0;
    const size = () => { W = cv.width = Math.max(1, cv.offsetWidth * DPR); H = cv.height = Math.max(1, cv.offsetHeight * DPR); };
    size(); window.addEventListener('resize', size);
    const TOK = ['@Post', '@Column', 'DTO', '404', 'imports', 'super()', '@Get', 'extends', '@Module', '/car'];
    const em = [], toks = [];
    for (let i = 0; i < 26; i++) em.push({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .7, ph: Math.random() * 6.28, sw: .3 + Math.random() * .6 });
    for (let i = 0; i < 9; i++) toks.push({ x: Math.random() * W, y: Math.random() * H, z: .4 + Math.random() * .9, vx: (Math.random() - .5) * .16, t: TOK[i % TOK.length], r: (Math.random() - .5) * .5 });
    const draw = (tm) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of em) { p.y -= (.15 + p.z * .35) * DPR; p.x += Math.sin(tm / 1400 + p.ph) * p.sw * DPR * .35; if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; } }
      ctx.lineWidth = 1 * DPR;
      for (let a = 0; a < em.length; a++) for (let b = a + 1; b < em.length; b++) { const dx = em[a].x - em[b].x, dy = em[a].y - em[b].y, d = Math.sqrt(dx * dx + dy * dy), mx = 95 * DPR; if (d < mx) { ctx.strokeStyle = 'rgba(150,95,255,' + (.11 * (1 - d / mx)) + ')'; ctx.beginPath(); ctx.moveTo(em[a].x, em[a].y); ctx.lineTo(em[b].x, em[b].y); ctx.stroke(); } }
      for (const p of em) { const s = (1.3 + p.z * 2.2) * DPR, tw = .22 + p.z * .3 + Math.sin(tm / 600 + p.ph) * .1; ctx.fillStyle = 'rgba(205,175,255,' + tw + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 6.29); ctx.fill(); }
      for (const t of toks) { t.x += t.vx * DPR; t.y -= (.08 + t.z * .12) * DPR; if (t.y < -34) t.y = H + 34; if (t.x < -50) t.x = W + 50; if (t.x > W + 50) t.x = -50; ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.r * .12); ctx.font = '700 ' + ((13 + t.z * 22) * DPR) + 'px "JetBrains Mono",monospace'; ctx.fillStyle = 'rgba(190,150,255,' + (.05 + t.z * .07) + ')'; ctx.textAlign = 'center'; ctx.fillText(t.t, 0, 0); ctx.restore(); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="qz-fx" aria-hidden="true" />;
}

function QuizArena({ live, onClose, startSolo }) {
  const isMentor = live.mode === 'mentor';
  const isStudent = live.mode === 'student';
  const [soloMode, setSoloMode] = useState(!!startSolo);
  const solo = soloMode || (!isMentor && !isStudent);
  const soloRef = useRef(solo);
  soloRef.current = solo;
  const [phase, setPhase] = useState('lobby'); // lobby | q | reveal | done
  const [qi, setQi] = useState(-1);
  const [remaining, setRemaining] = useState(QUIZ_MS);
  const [myAnswers, setMyAnswers] = useState({});
  const [players, setPlayers] = useState([]);
  const [qRows, setQRows] = useState([]);
  const [answeredN, setAnsweredN] = useState(0);
  const [classEnded, setClassEnded] = useState(false);
  const seenQRef = useRef(-1);
  const qStartRef = useRef(0);
  const deadlineRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (!isStudent || solo || !live.playerId) return;
    liveQuizAnswers(live.pin).then(rows => {
      const mine = {};
      rows.filter(r => r.player_id === live.playerId).forEach(r => { mine[r.screen_idx - QUIZ_BASE_IDX] = { picked: r.picked, correct: r.correct, elapsed: r.elapsed_ms }; });
      setMyAnswers(m => ({ ...mine, ...m }));
    }).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (soloRef.current) return;
    let on = true, t = null;
    const tick = async () => {
      if (soloRef.current) return;
      try {
        const row = await liveGet(live.pin);
        if (!on) return;
        if (row) {
          const st = row.quiz_state || 'off', q = row.quiz_q ?? -1;
          if (st === 'q' && q !== seenQRef.current) {
            seenQRef.current = q; qStartRef.current = Date.now();
            deadlineRef.current = Date.now() + QUIZ_MS - (isMentor ? 0 : 700);
            setQi(q); setRemaining(deadlineRef.current - Date.now()); setPhase('q'); setAnsweredN(0);
          } else if (st === 'r') {
            if (q !== seenQRef.current) { seenQRef.current = q; setQi(q); }
            setPhase(p => p === 'done' ? p : 'reveal');
          }
          else if (st === 'done') { setPhase('done'); }
        }
        const st1 = row ? (row.quiz_state || 'off') : null;
        const ph = st1 === 'r' ? 'reveal' : st1 === 'done' ? 'done' : st1 === 'lobby' ? 'lobby' : st1 === 'q' ? 'q' : phaseRef.current;
        if (on) setClassEnded(!row || row.status === 'ended');
        if (ph === 'lobby' || ph === 'reveal' || ph === 'done' || phaseRef.current === 'reveal') {
          const [pl, qa] = await Promise.all([livePlayers(live.pin), liveQuizAnswers(live.pin)]);
          if (on) { setPlayers(pl); setQRows(qa); }
        } else if (ph === 'q' && isMentor) {
          const [pl, qa] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, QUIZ_BASE_IDX + seenQRef.current)]);
          if (on) { setPlayers(pl); setAnsweredN(qa.length); }
        }
      } catch {}
      if (on) t = setTimeout(tick, 1200);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (phase !== 'q') return;
    const iv = setInterval(() => {
      const rem = deadlineRef.current - Date.now();
      setRemaining(rem > 0 ? rem : 0);
      if (rem <= 0) {
        clearInterval(iv);
        setPhase('reveal');
        if (isMentor && !soloRef.current) ctrl('r', seenQRef.current);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase, qi]); // eslint-disable-line

  const ctrl = async (state, q) => {
    try {
      await live.quizControl(state, q);
      if (state === 'q') { seenQRef.current = q; qStartRef.current = Date.now(); deadlineRef.current = Date.now() + QUIZ_MS; setQi(q); setRemaining(QUIZ_MS); setPhase('q'); setAnsweredN(0); }
      else if (state === 'r' || state === 'done') {
        setPhase(state === 'r' ? 'reveal' : 'done');
        Promise.all([livePlayers(live.pin), liveQuizAnswers(live.pin)]).then(([pl, qa]) => { setPlayers(pl); setQRows(qa); }).catch(() => {});
      }
    } catch {}
  };
  const soloStart = (i) => { seenQRef.current = i; qStartRef.current = Date.now(); deadlineRef.current = Date.now() + QUIZ_MS; setQi(i); setRemaining(QUIZ_MS); setPhase('q'); };
  const soloNext = () => { const n = qi + 1; if (n >= QUIZ_BANK.length) setPhase('done'); else soloStart(n); };
  const soloReplay = () => { setMyAnswers({}); soloStart(0); };
  const startPractice = () => { setSoloMode(true); setMyAnswers({}); soloStart(0); };

  const answer = (i) => {
    if (phase !== 'q' || isMentor || myAnswers[qi]) return;
    const elapsed = Math.min(QUIZ_MS, Date.now() - qStartRef.current);
    const correct = i === QUIZ_BANK[qi].correct;
    setMyAnswers(m => ({ ...m, [qi]: { picked: i, correct, elapsed } }));
    if (isStudent && !solo) live.submitAnswer(QUIZ_BASE_IDX + qi, `quiz-${qi}`, i, correct, elapsed);
    if (solo) setPhase('reveal');
  };

  const streakUpTo = (k) => { let s = 0; for (let i = 0; i <= k; i++) { if (myAnswers[i]?.correct) s++; else s = 0; } return s; };
  const myPtsFor = (k) => { const a = myAnswers[k]; if (!a || !a.correct) return 0; return quizPts(a.elapsed) + (streakUpTo(k) >= 2 ? 100 : 0); };

  const board = players.map(p => { const s = quizScore(qRows.filter(r => r.player_id === p.id)); return { id: p.id, nickname: p.nickname, ...s }; }).sort((a, b) => b.pts - a.pts || b.ok - a.ok);
  const myRank = live.playerId ? board.findIndex(b => b.id === live.playerId) : -1;
  const soloRows = Object.entries(myAnswers).map(([k, v]) => ({ player_id: 'me', screen_idx: QUIZ_BASE_IDX + Number(k), correct: v.correct, elapsed_ms: v.elapsed }));
  const soloScore = quizScore(soloRows);

  const Q = qi >= 0 && qi < QUIZ_BANK.length ? QUIZ_BANK[qi] : null;
  const counts = Q ? Q.opts.map((_, i) => {
    if (solo) return myAnswers[qi]?.picked === i ? 1 : 0;
    let n = qRows.filter(r => r.screen_idx === QUIZ_BASE_IDX + qi && r.picked === i).length;
    const mine = myAnswers[qi];
    if (mine && mine.picked === i && live.playerId && !qRows.some(r => r.player_id === live.playerId && r.screen_idx === QUIZ_BASE_IDX + qi)) n++;
    return n;
  }) : [];
  const lastQ = qi >= QUIZ_BANK.length - 1;
  const my = qi >= 0 ? myAnswers[qi] : null;

  const closeArena = () => {
    if (isMentor && !solo && phase !== 'done') {
      if (typeof window !== 'undefined' && !window.confirm("Test hali yakunlanmadi — yopsangiz o'quvchilar arenada kutib qoladi.\nBaribir yopilsinmi?")) return;
    }
    onClose();
  };

  return (
    <div className="qz-arena">
      <div className="qz-bg" aria-hidden="true">
        {QZ_BG_SHAPES.map((s, i) => (
          <span key={i} className="qz-shp" style={{ left: `${s.l}%`, top: `${s.t}%`, fontSize: s.s, animationDuration: `${s.d}s`, animationDelay: `${s.dl}s` }}>{s.ch}</span>
        ))}
      </div>
      <QzFX />
      <button className="qz-x" onClick={closeArena} aria-label="Yopish">✕</button>

      {classEnded && isStudent && !solo && phase !== 'done' && (
        <div className="qz-endnote fade-step">
          <span>⚠️ Jonli dars yakunlandi — testni o'zingiz davom ettiring:</span>
          <button className="qz-btn" onClick={startPractice}>📖 Mashq rejimida davom etish</button>
        </div>
      )}

      {phase === 'lobby' && (
        <div className="qz-view fade-step">
          <CsWordmark />
          <p className="qz-sub" style={{ marginTop: -4 }}>Tezroq to'g'ri bossangiz — ko'proq ball. Ketma-ket to'g'ri javoblar 🔥 bonus beradi!</p>
          {!solo && (
            <div className="qz-lobby-players">
              {players.map(p => <span key={p.id} className={`qz-pchip ${p.id === live.playerId ? 'me' : ''}`}>{p.nickname}</span>)}
              {players.length === 0 && <span className="qz-dimtxt">O'quvchilar kutilmoqda…</span>}
            </div>
          )}
          {isMentor && <button className="qz-btn big" disabled={players.length === 0} onClick={() => ctrl('q', 0)}>▶ Testni boshlash</button>}
          {isStudent && !solo && <p className="qz-waitmsg">⏳ Mentor testni boshlashini kuting…</p>}
          {solo && <button className="qz-btn big" onClick={() => soloStart(0)}>▶ Boshlash</button>}
        </div>
      )}

      {phase === 'q' && Q && (
        <div className="qz-view qz-qview fade-step" key={`q${qi}`}>
          <div className="qz-top">
            <span className="qz-count">Savol <b>{qi + 1}</b>/{QUIZ_BANK.length}</span>
            <QzTimer remaining={remaining} />
            {isMentor
              ? <span className="qz-ansn">📨 {answeredN}/{players.length}</span>
              : <span className="qz-ansn">{streakUpTo(qi - 1) >= 2 ? `🔥 x${streakUpTo(qi - 1)}` : ' '}</span>}
          </div>
          <h2 className="qz-q">{fmtCode(Q.q)}</h2>
          <div className="qz-grid">
            {Q.opts.map((o, i) => {
              const pickedThis = my && my.picked === i;
              return (
                <button key={i} className={`qz-tile ${my ? (pickedThis ? 'picked' : 'faded') : ''}`} style={{ background: QUIZ_COLORS[i] }} disabled={isMentor || !!my} onClick={() => answer(i)}>
                  <span className="qz-shape">{QUIZ_SHAPES[i]}</span>
                  <span className="qz-opt">{fmtCode(o)}</span>
                  {pickedThis && <span className="qz-pbadge">✔</span>}
                </button>
              );
            })}
          </div>
          {my && !isMentor && !solo && <p className="qz-waitmsg">✔ Javob qabul qilindi — natijani kuting…</p>}
          {isMentor && (
            <div className="qz-mrow">
              {answeredN >= players.length && players.length > 0 && <span className="qz-allin">✓ Hamma javob berdi!</span>}
              <button className="qz-btn" onClick={() => ctrl('r', qi)}>⏹ Natijani ochish</button>
            </div>
          )}
        </div>
      )}

      {phase === 'reveal' && Q && (
        <div className="qz-view qz-qview fade-step" key={`r${qi}`}>
          <div className="qz-top">
            <span className="qz-count">Savol <b>{qi + 1}</b>/{QUIZ_BANK.length} — natija</span>
          </div>
          <h2 className="qz-q">{fmtCode(Q.q)}</h2>
          <div className="qz-grid">
            {Q.opts.map((o, i) => {
              const win = i === Q.correct;
              const pickedThis = my && my.picked === i;
              return (
                <div key={i} className={`qz-tile rv ${win ? 'win' : 'lose'} ${pickedThis ? 'picked' : ''}`} style={{ background: QUIZ_COLORS[i] }}>
                  <span className="qz-shape">{QUIZ_SHAPES[i]}</span>
                  <span className="qz-opt">{fmtCode(o)}</span>
                  <span className="qz-cnt">{win ? '✓ ' : ''}{counts[i]}</span>
                </div>
              );
            })}
          </div>
          {!isMentor && (
            <div className={`qz-res ${my?.correct ? 'good' : 'bad'}`}>
              {my?.correct
                ? <><span className="qz-res-pts">+{myPtsFor(qi)}</span><span className="qz-res-t">ball{streakUpTo(qi) >= 2 ? ` · 🔥 x${streakUpTo(qi)} streak` : ''}</span></>
                : <span className="qz-res-t">{my ? "Xato — 0 ball. Keyingisida olasiz! 💪" : "Vaqt tugadi — 0 ball. Tezroq bo'ling! ⏱"}</span>}
              {!solo && myRank >= 0 && <span className="qz-res-rank">Siz hozir: {myRank + 1}-o'rin</span>}
            </div>
          )}
          {!solo && (
            <div className="qz-board">
              <div className="qz-board-h">🏆 TOP-5</div>
              {board.slice(0, 5).map((b, i) => (
                <div key={b.id} className={`qz-brow ${b.id === live.playerId ? 'me' : ''}`}>
                  <span className="qz-brank">{i + 1}</span><span className="qz-bname">{b.nickname}</span>
                  {b.maxStreak >= 2 && <span className="qz-bstreak">🔥</span>}
                  <span className="qz-bpts">{b.pts}</span>
                </div>
              ))}
            </div>
          )}
          {isMentor && <button className="qz-btn big" onClick={() => lastQ ? ctrl('done', qi) : ctrl('q', qi + 1)}>{lastQ ? "🏁 G'oliblarni e'lon qilish" : 'Keyingi savol →'}</button>}
          {solo && <button className="qz-btn big" onClick={soloNext}>{lastQ ? '🏁 Natijani ko\'rish' : 'Keyingi →'}</button>}
        </div>
      )}

      {phase === 'done' && (
        <div className="qz-view fade-step">
          <Confetti />
          <h2 className="qz-h">🏆 Test yakunlandi!</h2>
          {solo ? (
            <div className="qz-solo-res">
              <div className="qz-solo-pts">{soloScore.pts}</div>
              <p className="qz-sub">ball · {soloScore.ok}/{QUIZ_BANK.length} to'g'ri{soloScore.maxStreak >= 2 ? ` · eng uzun streak 🔥x${soloScore.maxStreak}` : ''}</p>
              <button className="qz-btn big" onClick={soloReplay}>↻ Qayta ishlash</button>
            </div>
          ) : (
            <>
              <div className="qz-pod">
                {[1, 0, 2].map(rank => {
                  const b = board[rank];
                  return (
                    <div key={rank} className={`qz-pod-col p${rank + 1} ${b && b.id === live.playerId ? 'me' : ''}`}>
                      {rank === 0 && <span className="qz-crown">👑</span>}
                      <span className="qz-pod-medal">{['🥇', '🥈', '🥉'][rank]}</span>
                      <span className="qz-pod-name">{b ? b.nickname : '—'}</span>
                      {b && <span className="qz-pod-pts">{b.pts} ball · {b.ok}/{QUIZ_BANK.length}</span>}
                      <div className="qz-pod-bar" />
                    </div>
                  );
                })}
              </div>
              {myRank >= 0 && <p className="qz-mypl">Siz — <b>{myRank + 1}-o'rin</b> · {board[myRank].pts} ball</p>}
              <div className="qz-board wide">
                {board.map((b, i) => (
                  <div key={b.id} className={`qz-brow ${b.id === live.playerId ? 'me' : ''}`}>
                    <span className="qz-brank">{i + 1}</span><span className="qz-bname">{b.nickname}</span>
                    {b.maxStreak >= 2 && <span className="qz-bstreak">🔥x{b.maxStreak}</span>}
                    <span className="qz-bok">{b.ok}/{QUIZ_BANK.length}</span>
                    <span className="qz-bpts">{b.pts}</span>
                  </div>
                ))}
              </div>
              {isStudent && <button className="qz-btn" onClick={startPractice}>↻ Testni qayta ishlash — mashq (jadvalga yozilmaydi)</button>}
            </>
          )}
          <button className="qz-btn ghost" onClick={closeArena}>Arenani yopish</button>
        </div>
      )}
    </div>
  );
}

// ===== 🛠️ JONLI PRAKTIKA — o'quvchi VS Code'da bajaradi (KOD KIRITILMAYDI), ustoz kuzatadi =====
// signal zonasi: <100 test · 100+ arena · 500+ praktika
const PRACTICE_BASE = 500;
const MentorPracticeStats = ({ live, screen }) => {
  const [data, setData] = useState({ players: null, doneIds: new Set() });
  useEffect(() => {
    if (!live || live.mode !== 'mentor' || !live.pin) return;
    let on = true, t = null;
    const tick = async () => {
      try {
        const [players, rows] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, PRACTICE_BASE + screen)]);
        if (on) setData({ players, doneIds: new Set(rows.map(r => r.player_id)) });
      } catch {}
      if (on) t = setTimeout(tick, 3000);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [live && live.pin, screen]);
  if (!live || live.mode !== 'mentor') return null;
  const players = data.players || [];
  const doers = players.filter(p => data.doneIds.has(p.id));
  const waiting = players.filter(p => !data.doneIds.has(p.id));
  return (
    <div className="lp-mstats fade-up">
      <div className="card-lbl" style={{ color: T.blue }}>👀 Kim bajardi — {doers.length}/{players.length}</div>
      {data.players === null ? (
        <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Yuklanmoqda…</p>
      ) : players.length === 0 ? (
        <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Hali hech kim qo'shilmagan.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {doers.map(p => <span key={p.id} className="mstats-wait-chip" style={{ background: T.successSoft, color: T.success }}>✓ {p.nickname}</span>)}
          {waiting.map(p => <span key={p.id} className="mstats-wait-chip" style={{ opacity: 0.6 }}>⏳ {p.nickname}</span>)}
        </div>
      )}
    </div>
  );
};
function ScreenLivePractice({ title, task, checklist, screen, storedAnswer, onAnswer, onNext, onPrev, live }) {
  const _gate = useContext(LiveGateCtx) || {};
  const _live = live || _gate.live;
  const [checked, setChecked] = useState(() => new Set());
  const [done, setDone] = useState(!!(storedAnswer && storedAnswer.solved));
  const toggle = (i) => setChecked(prev => { const s = new Set(prev); if (s.has(i)) s.delete(i); else s.add(i); return s; });
  const complete = () => {
    if (done) return;
    setDone(true);
    onAnswer(screen, { stage: 'practice', screenIdx: screen, practice: title, solved: true, correct: true, picked: true });
    // JONLI: praktika bajarilgani serverga yoziladi (500+ zona — reytingga aralashmaydi, faqat mentor ko'radi)
    if (_live && _live.mode === 'student') _live.submitAnswer(PRACTICE_BASE + screen, 'practice', 0, true, 0);
  };
  return (
    <Stage eyebrow="Amaliyot · VS Code" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Avval bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">{title}</h2></div>
        <Mentor>Bu topshiriqni <b style={{ color: T.ink }}>o'z kompyuteringizda</b> — VS Code'da bajaring. Har bosqichni bajarib, belgilab boring. Tugagach <b style={{ color: T.ink }}>«Bajardim»</b> tugmasini bosing — ustoz kuzatib turadi.</Mentor>
        <div className="split">
          <Col>
            <div className="lp-task fade-up delay-1">
              <div className="lp-task-h"><span className="lp-task-badge">TOPSHIRIQ</span></div>
              <p className="body" style={{ margin: 0, color: T.ink }}>{task}</p>
            </div>
            <MentorPracticeStats live={_live} screen={screen} />
          </Col>
          <Col>
            <p className="flow-label">Bosqichlar — belgilab boring</p>
            <div className="lp-steps fade-up delay-2">
              {checklist.map((c, i) => {
                const on = checked.has(i);
                return (
                  <button key={i} className={`lp-step ${on ? 'on' : ''}`} onClick={() => toggle(i)}>
                    <span className="lp-check">{on ? '✓' : i + 1}</span>
                    <span className="lp-step-t">{fmtCode(c)}</span>
                  </button>
                );
              })}
            </div>
            <button className={`lp-done-btn ${done ? 'is-done' : ''}`} disabled={done} onClick={complete}>
              {done ? '✓ Bajarildi — ustozni kuting' : '✅ Bajardim'}
            </button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Vazifani bajardingiz. Ustoz tekshirib, keyingi qadamga o'tkazadi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
}
// 🎊 OCHILISH KUNI — haqiqiy loyihada (KOD DARSLIKKA KIRITILMAYDI)
const ScreenCarPractice = (props) => (
  <ScreenLivePractice {...props}
    title="Ochilish kuni — /car ni o'z loyihangizda tirik qiling"
    task="VS Code'da IntroNestArxitechture loyihasini oching: mashinalar resursini 5 qadam bilan qo'shing va CarModule'ni AppModule imports ro'yxatiga ulang. Brauzerda /car ni ochib, 200 javobini ko'ring."
    checklist={[
      "`car.entity.ts` — `brand`, `model`, `price`, `is_available` ustunlarini yozing",
      "`create-car.dto.ts` va `update-car.dto.ts` (`PartialType`) fayllarini qo'shing",
      "`car.service.ts` — `extends BaseService` va `super(carRepo)`",
      "`car.controller.ts` — CRUD endpointlar (`@Post`, `@Get`, `@Patch`, `@Delete`)",
      "`car.module.ts` ni yozib, uni `AppModule` imports'iga ulang",
      "Brauzerda `/car` ni oching — `200` javobini ko'ring (404 emas)"
    ]} />
);

// ===== 🏆 PODIUM / STATISTIKA — jonli reyting =====
const ScreenPodium = ({ screen, answers, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const isLive = !!(live && (live.mode === 'student' || live.mode === 'mentor') && live.pin);
  const livePin = live ? live.pin : null;
  const [players, setPlayers] = useState([]);
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!isLive || !livePin) return;
    let on = true, t = null;
    const tick = async () => {
      try {
        const [p, a] = await Promise.all([livePlayers(livePin), liveAnswers(livePin)]);
        if (on) { setPlayers(p); setRows(a); setLoaded(true); }
      } catch {}
      if (on) t = setTimeout(tick, 3000);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [isLive, livePin]);

  const totalQ = SCORED_IDX.length;
  const board = players.map(p => {
    const mine = rows.filter(a => a.player_id === p.id && SCORED_IDX.includes(a.screen_idx));
    const okCount = mine.filter(a => a.correct).length;
    const time = mine.reduce((s, a) => s + (a.elapsed_ms || 0), 0);
    return { id: p.id, nickname: p.nickname, okCount, time };
  }).sort((x, y) => y.okCount - x.okCount || x.time - y.time);
  const fmtT = (ms) => `${(ms / 1000).toFixed(1)}s`;
  const top3 = board.slice(0, 3);
  const myIdx = live && live.playerId ? board.findIndex(b => b.id === live.playerId) : -1;
  const selfCorrect = SCORED_IDX.filter(i => answers[i]?.correct).length;

  return (
    <Stage eyebrow="Natijalar" screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(14px,2.2vw,20px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kim <span className="italic" style={{ color: T.accent }}>g'olib</span>?</h2></div>
        {!isLive ? (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <ScoreRing correct={selfCorrect} total={totalQ} />
            <div className="frame-soft" style={{ maxWidth: 480 }}><p className="body" style={{ margin: 0 }}>Siz mustaqil rejimdasiz. Jonli darsda bu yerda butun guruh reytingi — 🥇🥈🥉 podium chiqadi.</p></div>
          </div>
        ) : !loaded ? (
          <p className="mono small fade-up" style={{ color: T.ink2 }}>Natijalar yuklanmoqda…</p>
        ) : board.length === 0 ? (
          <div className="frame-soft fade-up"><p className="body" style={{ margin: 0 }}>Bu sessiyaga hali hech kim qo'shilmagan.</p></div>
        ) : (
          <>
            <Confetti />
            <div className="pod-stage fade-up">
              {[1, 0, 2].map(rank => {
                const b = top3[rank];
                return (
                  <div key={rank} className={`pod-col pod-${rank + 1} ${b && live.playerId === b.id ? 'me' : ''}`}>
                    <span className="pod-medal">{['🥇', '🥈', '🥉'][rank]}</span>
                    <span className="pod-name">{b ? b.nickname : '—'}</span>
                    {b && <span className="pod-score mono">{b.okCount}/{totalQ} · {fmtT(b.time)}</span>}
                    <div className="pod-bar" />
                  </div>
                );
              })}
            </div>
            {myIdx >= 0 && <p className="pod-my fade-up">Siz — <b>{myIdx + 1}-o'rin</b> ({board[myIdx].okCount}/{totalQ} to'g'ri)</p>}
            <div className="card fade-up d1">
              <div className="card-lbl" style={{ color: T.accent }}>🏆 To'liq reyting</div>
              <div className="pod-list">
                {board.map((b, i) => (
                  <div key={b.id} className={`pod-row ${live.playerId === b.id ? 'me' : ''}`}>
                    <span className="mono pod-rank">{i + 1}</span>
                    <span className="pod-row-name">{b.nickname}</span>
                    <span className="pod-row-dots">{SCORED_IDX.map(q => { const a = rows.find(r => r.player_id === b.id && r.screen_idx === q); return <span key={q} className={`pod-dot ${a ? (a.correct ? 'ok' : 'bad') : ''}`} title={Q_LABELS[q]} />; })}</span>
                    <span className="mono pod-row-score">{b.okCount}/{totalQ}</span>
                    <span className="mono pod-row-time">{fmtT(b.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Stage>
  );
};

// ===== 🃏 FLASHCARDS (Quizlet-uslub, 3D flip) =====
function Flashcards({ cards }) {
  const [queue, setQueue] = useState(() => cards.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [exiting, setExiting] = useState(null);
  const swapRef = useRef(0);
  const total = cards.length;
  const cur = queue[0];
  const card = cur != null ? cards[cur] : null;
  const advance = (removed) => {
    if (exiting) return;
    setExiting(removed ? 'knew' : 'again');
    setTimeout(() => {
      setExiting(null); setFlipped(false); swapRef.current++;
      if (removed) setKnown(k => k + 1);
      setQueue(q => { const [first, ...rest] = q; return removed ? rest : [...rest, first]; });
    }, 420);
  };
  const knew = () => advance(true);
  const again = () => advance(false);
  const restart = () => { setQueue(cards.map((_, i) => i)); setKnown(0); setFlipped(false); };
  if (!card) return (
    <div className="fc-done fade-up"><span className="fc-done-emoji">🎉</span><p className="fc-done-h">Hammasini bilasiz!</p><p className="fc-done-s">{total}/{total} atama yodlandi</p><button className="fc-btn ghost" onClick={restart}>↻ Qaytadan takrorlash</button></div>
  );
  return (
    <div className="fc fade-up">
      <div className="fc-top"><span className="fc-pill learn" key={`l-${queue.length}-${swapRef.current}`}>↻ O'rganilmoqda · <b>{queue.length}</b></span><span className="fc-pill knew" key={`k-${known}`}>✓ Bildim · <b>{known}</b></span></div>
      <div className="fc-bar"><span className="fc-bar-fill" style={{ width: `${(known / total) * 100}%` }} /></div>
      <div className="fc-cardwrap">
        <div className={`fc-fly ${exiting === 'knew' ? 'out-knew' : ''} ${exiting === 'again' ? 'out-again' : ''}`} key={swapRef.current}>
        <div className={`fc-card ${flipped ? 'flip' : ''}`} onClick={() => !flipped && !exiting && setFlipped(true)} role="button" tabIndex={0}>
          <div className="fc-face fc-front"><span className="fc-q">{card.front}</span><span className="fc-cue">Qaysi tushuncha? 🤔 <span className="fc-tap">bosing</span></span></div>
          <div className="fc-face fc-back"><span className="fc-tag">{card.back}</span>{card.note && <span className="fc-note">{card.note}</span>}</div>
        </div>
        </div>
      </div>
      {flipped
        ? (<div className="fc-actions"><button className="fc-btn again" disabled={!!exiting} onClick={again}>✗ Takrorlash</button><button className="fc-btn knew" disabled={!!exiting} onClick={knew}>✓ Bildim</button></div>)
        : (<p className="fc-hint">👆 Kartani bosing — javobni ko'rasiz</p>)}
    </div>
  );
}
// 🃏 12 KARTA (front=topishmoq, back=atama, note=restoran tili) — eski GLOSSARY shu yerga ko'chdi
const CAR_FLASHCARDS = [
  { front: "Ilova boshqaradigan bir tur ma'lumot", back: "Resurs", note: "mashina, mijoz, buyurtma" },
  { front: "Bazadagi jadval shakli — qaysi ustunlar bor", back: "Entity", note: "javon chizmasi" },
  { front: "id, created_at, updated_at — tekin keladi", back: "BaseEntity", note: "tayyor tokchalar" },
  { front: "Kelgan ma'lumot qoidalari", back: "DTO", note: "buyurtma anketasi" },
  { front: "Create anketasining hamma katakchasini ixtiyoriy qiladi", back: "PartialType", note: "anketa nusxasi" },
  { front: "CRUD metodlari tekin keladigan ota-klass", back: "BaseService", note: "tayyor retsept kitobi" },
  { front: "So'rovni qabul qilib, service metodini chaqiradi", back: "Controller", note: "ofitsiant" },
  { front: "Bo'lim qismlarini ro'yxatga oladi", back: "Module", note: "shtat jadvali" },
  { front: "Bo'lim shu ro'yxatda bo'lmasa — ko'rinmaydi", back: "AppModule imports", note: "kirish taxtasi" },
  { front: "Bunday eshik yo'q — manzil topilmadi", back: "404", note: "taxtada yozilmagan" },
  { front: "Anketa qoidasi buzilsa 400 qaytaradi", back: "ValidationPipe", note: "nazoratchi" },
  { front: "NestJS qismlarni o'zi tanishtirib ulaydi", back: "DI", note: "xodimlarni tanishtirish" }
];
const ScreenFlashcards = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []); // eslint-disable-line
  return (
    <Stage eyebrow="Takrorlash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={false} label="Yakunlash →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Atamalarni <span className="italic" style={{ color: T.accent }}>tez takrorlaymiz</span>.</h2></div>
        <Mentor>Darsni yakunlashdan oldin bugungi atamalarni takrorlaymiz. Har kartada bir topishmoq — <b style={{ color: T.ink }}>qaysi atama</b> ekanini o'ylang, keyin kartani bosib tekshiring. <b style={{ color: T.ink }}>Bildim</b> yoki <b style={{ color: T.ink }}>Takrorlash</b> bilan baholang.</Mentor>
        <div className="fc-center"><Flashcards cards={CAR_FLASHCARDS} /></div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — YAKUN (4.2: ScoreRing + CodeStrike CTA + RECAP/Uyga vazifa + 🏅 kolleksiya) =====
const Screen19 = ({ screen, answers, achievements, onReset, onPrev, onFinish }) => {
  const _gate = useContext(LiveGateCtx) || {};
  const _live = _gate.live;
  const [arena, setArena] = useState(false);
  const [arenaSolo, setArenaSolo] = useState(false);
  const quizSt = (_live && _live.quiz && _live.quiz.state) || 'off';
  const isStudentL = _live && _live.mode === 'student';
  const isMentorL = _live && _live.mode === 'mentor';
  const classOver = !!(_live && (_live.status === 'ended' || !_live.mentorAlive));
  const studentSolo = isStudentL && classOver && quizSt !== 'done';
  const studentLive = isStudentL && !studentSolo && quizSt !== 'off';
  const studentWait = isStudentL && !studentSolo && quizSt === 'off';
  const openArena = async () => {
    if (isMentorL && quizSt === 'off') { try { await _live.quizControl('lobby', -1); } catch { return; } }
    setArenaSolo(studentSolo); setArena(true);
  };
  const RECAP = [
    "Har resurs = 5 qadam: Entity → DTO → Service → Controller → Module",
    "Entity — jadval shakli; id va vaqtlar BaseEntity'dan tekin",
    "DTO — kelgan ma'lumot qoidalari (bo'sh brand → 400)",
    "Service — BaseService'dan meros: CRUD tekin keladi",
    "CarModule'ni AppModule'ga ulash (aks holda 404)",
    "Agent yozgan kodni tekshirish: har qator o'z qatlamida (debug)"
  ];
  const HOMEWORK = [
    { b: 'O\'z resursingiz', t: "— masalan Order (buyurtma) yoki Client (mijoz): 5 qadamni qog'ozga yozing" },
    { b: 'Playbook', t: "— har qadam uchun agentga beradigan promptni tayyorlang" },
    { b: 'Tekshiruv', t: "— AppModule'ga ulanganini va Swagger'da ko'rinishini tasavvur qiling" }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Mashinalar bo'limi ochildi</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>yangi resurs qo'sha olasiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Mashinalar jadvalini noldan qurdingiz: 5 qadam + ulash. Har faylning nega kerakligini tushuntira olasiz." : "Yaxshi harakat! 5 qadam tartibini va ulashni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className={`qz-cta cs-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <CsWordmark stats={false} liveOn={studentLive} disabled={studentWait} onClick={studentWait ? undefined : openArena} hint={studentWait ? '⏳ Mentorni kuting' : undefined} />
        </div>
        {arena && <QuizArena live={_live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi — PRAKTIKA: o'z mini-loyihangiz uchun 2–3 resurs quring (Avtosalon / Kutubxona / Do'kon), agentni shu playbook bilan boshqarib!</p></div>
        </div>
        <div className="card ach-coll fade-up d3">
          <div className="card-lbl" style={{ color: T.accent }}>🏅 Nishonlaringiz — {(achievements ? achievements.size : 0)}/{Object.keys(ACHIEVEMENTS).length}</div>
          <div className="ach-grid">
            {Object.entries(ACHIEVEMENTS).map(([id, a]) => { const got = !!(achievements && achievements.has(id)); return (
              <div key={id} className={`ach-badge ${got ? 'got' : 'locked'}`} title={a.desc}>
                <span className="ach-badge-ic">{got ? a.icon : '🔒'}</span>
                <span className="ach-badge-name">{a.name}</span>
                {got && <span className="ach-badge-desc">{a.desc}</span>}
              </div>
            ); })}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function NestArchResourceLesson({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());

  // 🪧 OCHILISH TAXTASI — dars bo'ylab to'planadigan holat (atomik, StrictMode-xavfsiz)
  const [board, setBoard] = useState({});
  const [plus, setPlus] = useState(false);
  const fill = useCallback((k) => setBoard(b => (b[k] ? b : { ...b, [k]: true })), []);
  const plusOn = useCallback(() => { setPlus(p => p || true); setBoard(b => (b.dto ? b : { ...b, dto: true })); }, []);
  const boardVal = { board, fill, plus, plusOn };

  // 🏅 Nishonlar
  const earnedRef = useRef(new Set());
  const [earned, setEarned] = useState(() => new Set());
  const [achToasts, setAchToasts] = useState([]);
  const achKeyRef = useRef(0);
  const earn = useCallback((id) => {
    if (!ACHIEVEMENTS[id] || earnedRef.current.has(id)) return;
    earnedRef.current.add(id);
    setEarned(new Set(earnedRef.current));
    setAchToasts(t => [...t, { id, k: ++achKeyRef.current }]);
  }, []);

  // 11.11 — avto-zoom (ETALON 1920px): keng oynada proportsional kattalashadi
  useEffect(() => {
    const upd = () => { const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920)); document.documentElement.style.setProperty('--lz', String(Math.round(z * 1000) / 1000)); };
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, []);

  // Javob kaliti: inline testlar + arena savollari — mentor ochganda set_quiz_keys bilan serverga yuklanadi
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const locked = isStudentLive && (screen + 1 > live.mentorScreen);
  useEffect(() => { live.reportScreen(screen); }, [screen, live.mode, live.pin]); // eslint-disable-line

  // 🃏 Flashcard ekrani jonli darsda (mentor boshqaruvida) o'quvchida ko'rsatilmaydi
  const FLASH_IDX = SCREEN_META.findIndex(m => m.id === 'sflash');
  const flashHidden = () => live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const next = () => setScreen(s => { let n = Math.min(s + 1, TOTAL_SCREENS - 1); if (n === FLASH_IDX && flashHidden()) n = Math.min(n + 1, TOTAL_SCREENS - 1); return n; });
  const prev = () => setScreen(s => { let n = Math.max(s - 1, 0); if (n === FLASH_IDX && flashHidden()) n = Math.max(n - 1, 0); return n; });

  const recordAnswer = (idx, data) => {
    setAnswers(a => ({ ...a, [idx]: data }));
    const _m = SCREEN_META[idx];
    if (_m && ACH_TRIGGERS[_m.id] && data && data.correct) earn(ACH_TRIGGERS[_m.id]); // 🏅 faqat REAL solve
    if (_m && _m.scored && _m.scope === 'final' && data && data.solved && live.mode === 'student') live.submitAnswer(idx, _m.id, data.picked ?? 1, !!data.correct, data.elapsedMs || 0); // yakuniy challenge: REAL picked (INLINE_KEYS s17 = 0) — server o'zi baholaydi
  };
  const reset = () => { setAnswers({}); setScreen(0); setBoard({}); setPlus(false); startTimeRef.current = Date.now(); };

  const finishLesson = () => {
    live.endSession();
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17, ScreenCarPractice, ScreenPodium, ScreenFlashcards, Screen19];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,500&family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; zoom: var(--lz, 1); height: calc(100dvh / var(--lz, 1)); overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
        .lesson-root h1,.lesson-root h2,.lesson-root h3,.lesson-root h4,.lesson-root h5,.lesson-root h6,.lesson-root p,.lesson-root ul,.lesson-root ol { margin: 0; padding: 0; }
        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        .btn { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 14px; font-size: 12.5px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.6; cursor: not-allowed; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: default; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); }
        .tagpill { font-family: 'JetBrains Mono'; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope'; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .vcard { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover:not(:disabled) { transform: translateY(-1px); }
        .vcard:disabled { cursor: default; }
        .vlbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }
        .role-ico { font-size: 20px; flex-shrink: 0; } .role-r { font-size: 11.5px; color: ${T.ink2}; font-weight: 600; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }

        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope'; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope'; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .h-title { font-size: clamp(22px,4vw,38px); } .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        .stage { max-width: 1100px; margin: 0 auto; height: calc(100dvh / var(--lz, 1)); display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55); }

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(15px,2.5vw,22px); box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.accent}; flex-shrink: 0; min-width: 38px; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 600; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .note-h { font-weight: 700; font-size: 13.5px; margin: 0 0 5px; display: flex; align-items: center; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono'; font-size: clamp(11.5px,1.5vw,13px); line-height: 1.55; padding: clamp(12px,2.2vw,15px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        /* VS CODE EDITOR */
        .editor { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .editor-bar { background: #2D2D2D; padding: 7px 11px; display: flex; align-items: center; gap: 9px; }
        .editor-tab { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; background: #1E1E1E; padding: 4px 11px; border-radius: 6px 6px 0 0; word-break: break-all; }
        .editor-body { background: ${CODE.bg}; padding: 12px 14px; }
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.75; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .line-empty { color: ${CODE.comment}; font-style: italic; }

        /* PICK LINES */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; }

        /* AGENT CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 11px 14px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 4px; }
        .agent-msg { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink}; margin: 0; line-height: 1.55; }
        .prompt-box { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 12px 15px; }

        /* AGENT FILE GENERATION (s16) */
        .gen-file { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 9px; padding: 9px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-size: 12px; transition: all 0.2s; }
        .gen-file.ready { box-shadow: inset 0 0 0 1.5px ${T.success}33, 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .gen-ico { font-weight: 800; min-width: 16px; text-align: center; }
        .gen-file .mono { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .gen-d { font-size: 10px; color: ${T.ink2}; font-weight: 600; margin-left: auto; text-align: right; }

        /* AI DEBUG CARD (s17) */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 11px; }
        .ai-row { display: flex; gap: 8px; align-items: flex-start; }
        .ai-badge { background: ${T.nest}; color: #fff; font-family: 'Manrope'; font-weight: 800; font-size: 10px; padding: 4px 8px; border-radius: 6px; flex-shrink: 0; }
        .ai-bubble { background: ${T.bg}; border-radius: 4px 12px 12px 12px; padding: 9px 12px; font-size: 13px; color: ${T.ink}; }
        .ai-code { background: ${CODE.bg}; border-radius: 10px; padding: 10px 11px; display: flex; flex-direction: column; gap: 2px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${CODE.text}; padding: 5px 7px; border-radius: 6px; cursor: pointer; transition: all 0.16s; }
        .ai-line:hover { background: rgba(255,255,255,0.07); }
        .ai-line.bad { background: rgba(194,54,43,0.26); box-shadow: inset 0 0 0 1.5px ${T.danger}; }
        .ai-line.ok { opacity: 0.4; text-decoration: line-through; cursor: default; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; font-style: italic; margin: 0; }
        .takeaway { background: ${T.successSoft}; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 3px; text-align: center; }
        .ta-bulb { font-size: 26px; } .ta-h { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: ${T.ink}; margin: 0; } .ta-sub { font-size: 12px; color: ${T.ink2}; margin: 0; }


        /* SWAGGER */
        .swg { border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); }
        .swg-top { background: #173647; color: #fff; padding: 10px 13px; font-family: 'Manrope'; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 8px; } .swg-dot { width: 8px; height: 8px; border-radius: 50%; background: #49cc90; } .swg-ver { font-family: 'JetBrains Mono'; font-weight: 400; font-size: 11px; color: #9FB4D8; margin-left: auto; }
        .swg-row { border-bottom: 1px solid #eee; }
        .swg-head { width: 100%; display: flex; align-items: center; gap: 9px; padding: 9px 11px; background: #fff; border: none; cursor: pointer; text-align: left; }
        .swg-head:hover { background: #FBFAF7; }
        .swg-m { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: #fff; padding: 3px 8px; border-radius: 5px; min-width: 52px; text-align: center; }
        .swg-path { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; color: ${T.ink}; }
        .swg-sum { font-size: 11px; color: ${T.ink3}; margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .swg-chev { margin-left: auto; color: ${T.ink3}; font-size: 11px; }
        .swg-detail { padding: 11px; background: #F8FAFB; display: flex; flex-direction: column; gap: 8px; }
        .swg-code-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink2}; }
        .json { background: ${CODE.bg}; color: ${CODE.text}; border-radius: 9px; padding: 10px 12px; font-family: 'JetBrains Mono'; font-size: 11px; white-space: pre-wrap; word-break: break-word; line-height: 1.6; margin: 0; }

        /* SO'ROV YO'LI */
        .flow-rail { display: flex; flex-direction: column; gap: 2px; }
        .flow-stop { display: flex; flex-direction: column; align-items: flex-start; transition: opacity 0.3s; }
        .flow-stop > span { display: inline-flex; }
        .flow-ico { width: 34px; height: 34px; border-radius: 9px; align-items: center; justify-content: center; font-size: 17px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); transition: all 0.3s; }
        .flow-k { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; margin: 3px 0 0 6px; }
        .flow-down { font-size: 15px; margin: 1px 0 1px 9px; line-height: 1; transition: color 0.3s; }

        /* ENTITY ROWS */
        .ent-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-family: 'JetBrains Mono'; font-size: 11.5px; padding: 7px 10px; border-radius: 8px; margin-bottom: 5px; }
        .ent-row span { font-size: 10px; font-weight: 700; }
        .ent-row.siz { background: ${T.accentSoft}; color: ${T.ink}; } .ent-row.siz span { color: ${T.accent}; }
        .ent-row.free { background: ${T.successSoft}; color: ${T.ink}; } .ent-row.free span { color: ${T.success}; }

        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }

        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }

        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; }

        /* === 🔤 KOD-ATAMA CHIP (fmtCode · 11.8) === */
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }

        /* === 🪧 OCHILISH TAXTASI (strip) — 🎨 Dizayn sayqallaydi === */
        .oc-board { background: ${T.paper}; border-radius: 14px; padding: 11px 13px; box-shadow: 0 6px 18px -8px rgba(${T.shadowBase},0.18); display: flex; flex-direction: column; gap: 8px; }
        .oc-board-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .oc-board-t { font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.08em; color: ${T.ink2}; text-transform: uppercase; }
        .oc-board-n { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.ink3}; background: ${T.bg}; border-radius: 99px; padding: 2px 9px; }
        .oc-board-n.full { color: ${T.success}; background: ${T.successSoft}; }
        .oc-strip { display: flex; align-items: stretch; gap: 7px; flex-wrap: wrap; }
        .oc-sep { display: flex; align-items: center; color: ${T.ink3}; font-weight: 700; }
        .oc-slot { flex: 1; min-width: 96px; display: flex; align-items: center; gap: 6px; border: 1.5px dashed ${T.ink3}; border-radius: 10px; padding: 7px 9px; background: ${T.bg}; transition: all 0.25s; }
        .oc-slot.on { background: ${T.paper}; border: 1.5px solid transparent; border-left: 4px solid ${T.success}; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.2); }
        .oc-slot.plate { min-width: 118px; }
        .oc-slot.plate.on { border-left-color: ${T.nest}; }
        .oc-ic { font-size: 15px; line-height: 1; }
        .oc-nm { flex: 1; font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: ${T.ink2}; line-height: 1.25; }
        .oc-slot.on .oc-nm { color: ${T.ink}; }
        .oc-plus { color: ${T.accent}; }
        .oc-tick { color: ${T.success}; font-weight: 800; font-size: 12px; }
        /* ✨ Animatsiya: kartochka slotga uchib tushadi */
        @keyframes oc-fly-in { 0% { opacity: 0; transform: translateY(-14px) scale(1.1); } 60% { opacity: 1; transform: translateY(2px) scale(0.97); } 100% { transform: none; } }
        .oc-slot.oc-fly { animation: oc-fly-in 0.45s cubic-bezier(.3,1.4,.5,1); }

        /* === 🚪 s13 — KIRISH TAXTASI + mijoz === */
        .oc-door { position: relative; display: flex; align-items: flex-start; gap: 12px; background: ${CODE.bg}; border-radius: 14px; padding: 14px; box-shadow: 0 10px 26px -12px rgba(${T.shadowBase},0.4); overflow: hidden; }
        .oc-plate-board { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .oc-plate-h { font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.1em; color: #9FB4D8; }
        .oc-plate-row { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.text}; background: rgba(255,255,255,0.07); border-radius: 8px; padding: 7px 10px; }
        .oc-plate-row.on { background: ${T.nest}; color: #fff; }
        .oc-plate-drop { border: 1.5px dashed rgba(255,255,255,0.28); border-radius: 8px; padding: 4px; transition: all 0.2s; }
        .oc-plate-drop.over { border-color: ${T.nest}; background: rgba(224,35,78,0.14); }
        .oc-plate-drop.filled { border-color: transparent; padding: 0; }
        .oc-plate-empty { display: block; font-family: 'JetBrains Mono'; font-size: 11px; color: #6B7585; font-style: italic; padding: 6px 8px; }
        .oc-plate-chip { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; color: #fff; background: ${T.nest}; border: none; border-radius: 10px; padding: 10px 14px; cursor: grab; box-shadow: 0 8px 20px -8px rgba(224,35,78,0.6); }
        .oc-plate-chip:active { cursor: grabbing; }
        .oc-plate-chip.held { outline: 2px solid #fff; outline-offset: 2px; }
        @keyframes oc-plate-snap { 0% { transform: scale(1.15); } 60% { transform: scale(0.97); } 100% { transform: none; } }
        .oc-plate-snap { animation: oc-plate-snap 0.4s cubic-bezier(.3,1.5,.5,1); }
        .oc-visitor { font-size: 26px; line-height: 1; align-self: flex-end; }
        @keyframes oc-walk { 0% { transform: translateX(-60px); opacity: 0.3; } 45% { transform: translateX(0); opacity: 1; } 70% { transform: translateX(0); } 100% { transform: translateX(-60px); opacity: 0.3; } }
        .oc-door.oc-walk .oc-visitor { animation: oc-walk 1.3s ease-in-out; }
        @keyframes oc-door-shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .oc-door.is-404 { box-shadow: 0 0 0 2px ${T.danger}, 0 10px 26px -12px rgba(194,54,43,0.5); animation: oc-door-shake 0.4s ease; }
        .oc-door.is-ok { box-shadow: 0 0 0 2px ${T.success}, 0 10px 26px -12px rgba(31,122,77,0.45); }
        .oc-code-new { display: inline-block; }
        .json-type { white-space: pre-wrap; }
        @media (prefers-reduced-motion: reduce) { .oc-slot.oc-fly, .oc-door.oc-walk .oc-visitor, .oc-door.is-404, .oc-plate-snap { animation: none !important; } }

        /* === tap-hint affordance (11.7): bosilmagan element "meni bos" deb pulslaydi === */
        .tap-hint { animation: tap-hint-pulse 1.9s ease-in-out infinite; }
        @keyframes tap-hint-pulse { 0% { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18), 0 0 0 0 rgba(255,79,40,0.4); } 70%,100% { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18), 0 0 0 8px rgba(255,79,40,0); } }
        @media (prefers-reduced-motion: reduce) { .tap-hint { animation: none !important; } }

        /* === 🔴 JONLI PANEL (11.15): xira → hover'da tiniq === */
        .live-badge { opacity: 0.4; transition: opacity 0.25s ease, box-shadow 0.25s ease; }
        .live-badge:hover, .live-badge:focus-within { opacity: 1; box-shadow: 0 8px 24px -6px rgba(58,53,48,0.32) !important; }
        @media (hover: none) { .live-badge { opacity: 0.62; } }

        /* === Kahoot-kutish holatlari (jonli test) === */
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; animation: opt-wait-breathe 2s ease-in-out infinite; }
        @keyframes opt-wait-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.012); } }
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }
        @media (prefers-reduced-motion: reduce) { .option-wait { animation: none !important; } }

        /* === 📊 MENTOR STATISTIKASI === */
        .mstats { background: ${T.paper}; border: 1.5px solid rgba(${T.shadowBase},0.12); border-radius: 16px; padding: clamp(14px,2vw,20px); display: flex; flex-direction: column; gap: 12px; box-shadow: 0 10px 30px -12px rgba(${T.shadowBase},0.18); }
        .mstats-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .mstats-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; letter-spacing: 0.07em; text-transform: uppercase; color: ${T.blue}; }
        .mstats-n { font-family: 'Manrope'; font-size: 13.5px; font-weight: 600; color: ${T.ink2}; }
        .mstats-reveal { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; background: ${T.ink}; color: #fff; border: none; border-radius: 99px; padding: 7px 14px; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.35); transition: all 0.2s; }
        .mstats-reveal:hover { background: ${T.accent}; box-shadow: 0 6px 16px -4px rgba(255,79,40,0.5); }
        .mstats-reveal.ready { background: ${T.accent}; animation: mstats-pulse 1.6s ease-in-out infinite; }
        @keyframes mstats-pulse { 0%,100% { box-shadow: 0 4px 12px -4px rgba(255,79,40,0.5); } 50% { box-shadow: 0 4px 18px 0 rgba(255,79,40,0.55); } }
        .mstats-prog { height: 7px; background: rgba(${T.shadowBase},0.09); border-radius: 99px; overflow: hidden; }
        .mstats-prog-fill { display: block; height: 100%; border-radius: 99px; background: ${T.blue}; transition: width 0.6s cubic-bezier(.4,0,.2,1); }
        .mstats-prog-fill.full { background: ${T.success}; }
        .mstats-big { display: flex; gap: 10px; flex-wrap: wrap; }
        .mstats-chip { flex: 1; min-width: 96px; display: flex; flex-direction: column; align-items: center; gap: 2px; border-radius: 14px; padding: clamp(10px,1.6vw,14px) 8px; }
        .mstats-chip-n { font-family: 'Manrope'; font-weight: 800; font-size: clamp(24px,3.4vw,34px); line-height: 1; }
        .mstats-chip-t { font-family: 'Manrope'; font-weight: 600; font-size: 12px; }
        .mstats-chip.okc { background: ${T.successSoft}; } .mstats-chip.okc .mstats-chip-n, .mstats-chip.okc .mstats-chip-t { color: ${T.success}; }
        .mstats-chip.badc { background: ${T.accentSoft}; } .mstats-chip.badc .mstats-chip-n, .mstats-chip.badc .mstats-chip-t { color: ${T.accent}; }
        .mstats-chip.waitc { background: rgba(${T.shadowBase},0.06); } .mstats-chip.waitc .mstats-chip-n, .mstats-chip.waitc .mstats-chip-t { color: ${T.ink2}; }
        .mstats-chip.ansc { background: rgba(1,154,203,0.10); } .mstats-chip.ansc .mstats-chip-n, .mstats-chip.ansc .mstats-chip-t { color: ${T.blue}; }
        .mstats-hidden { margin: 0; font-family: 'Manrope'; font-size: 12.5px; font-style: italic; color: ${T.ink3}; }
        .mstats-bars { display: flex; flex-direction: column; gap: 8px; }
        .mstats-row { display: flex; align-items: center; gap: 10px; transition: opacity 0.4s; }
        .mstats-row.dimmed { opacity: 0.4; }
        .mstats-abc { width: 28px; height: 28px; border-radius: 9px; color: #fff; font-family: 'Manrope'; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 3px 8px -3px rgba(${T.shadowBase},0.3); }
        .mstats-track { flex: 1; height: 16px; background: rgba(${T.shadowBase},0.07); border-radius: 99px; overflow: hidden; }
        .mstats-fill { display: block; height: 100%; border-radius: 99px; transition: width 0.6s cubic-bezier(.4,0,.2,1); opacity: 0.85; }
        .mstats-count { min-width: 108px; text-align: right; font-size: 12px; font-weight: 600; color: ${T.ink2}; white-space: nowrap; }
        .mstats-waitrow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .mstats-wait-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink3}; }
        .mstats-wait-chip { font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink2}; background: rgba(${T.shadowBase},0.07); border-radius: 99px; padding: 3px 10px; }
        .mstats-wait-chip.more { color: ${T.ink3}; }
        .mstats-warn { margin: 0; font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; border-radius: 10px; padding: 9px 12px; }
        .mstats-wait { margin: 0; font-size: 12.5px; color: ${T.ink3}; font-style: italic; }
        @media (max-width: 560px) { .mstats-count { min-width: 78px; font-size: 11px; } }
        .mstats-verdict { border-radius: 12px; padding: 12px 15px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; animation: fade-step 0.3s ease-out; }
        .mstats-verdict.need { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; }
        .mstats-verdict.maybe { background: rgba(232,161,58,0.14); border-left: 4px solid #E8A13A; }
        .mstats-verdict.good { background: ${T.successSoft}; border-left: 4px solid ${T.success}; }
        .mstats-verdict.few { background: rgba(167,166,162,0.12); border-left: 4px solid ${T.ink3}; }
        .mstats-verdict-t { margin: 0; font-family: 'Manrope', sans-serif; font-size: clamp(13px,1.6vw,15px); line-height: 1.45; color: ${T.ink}; }
        .rc-open { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.6vw,15px); background: ${T.accent}; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(255,79,40,0.5); transition: all 0.2s; }
        .rc-open:hover { transform: translateY(-1px); }
        .rc-open-mini { align-self: flex-start; margin-top: 10px; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13px; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 99px; padding: 8px 14px; cursor: pointer; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.2); transition: all 0.2s; }
        .rc-open-mini:hover { transform: translateY(-1px); }

        /* === 📖 QAYTA TUSHUNTIRISH (recap overlay) === */
        .rc-overlay { position: fixed; inset: 0; z-index: 10005; background: ${T.bg}; display: flex; flex-direction: column; align-items: center; padding: clamp(14px,3vw,32px); overflow-y: auto; animation: fade-step 0.3s ease-out; font-family: 'Manrope', sans-serif; }
        .rc-head { width: 100%; max-width: 880px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .rc-tag { font-weight: 800; font-size: clamp(11px,1.4vw,13px); letter-spacing: 0.1em; text-transform: uppercase; color: ${T.accent}; background: ${T.accentSoft}; border-radius: 99px; padding: 6px 14px; white-space: nowrap; }
        .rc-title { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.4vw,22px); color: ${T.ink}; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rc-x { background: ${T.paper}; border: none; border-radius: 10px; width: 36px; height: 36px; font-size: 15px; color: ${T.ink2}; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .rc-x:hover { color: ${T.accent}; }
        .rc-card { flex: 1; width: 100%; max-width: 880px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: clamp(10px,2.2vw,20px); padding: clamp(16px,3vw,28px) 0; animation: fade-step 0.35s ease-out; }
        .rc-ic { font-size: clamp(44px,8vw,76px); line-height: 1; }
        .rc-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(24px,4.6vw,44px); color: ${T.ink}; line-height: 1.12; max-width: 800px; margin: 0; }
        .rc-body { font-size: clamp(15px,2.4vw,21px); line-height: 1.55; color: ${T.ink2}; max-width: 720px; margin: 0; }
        .rc-body b { color: ${T.ink}; }
        .rc-ask { font-weight: 600; font-size: clamp(13px,1.8vw,16px); color: ${T.accent}; background: ${T.accentSoft}; border-radius: 12px; padding: 10px 18px; max-width: 660px; }
        .rc-nav { width: 100%; max-width: 880px; display: flex; align-items: center; gap: 14px; flex-shrink: 0; padding-top: 8px; }
        .rc-dots { flex: 1; display: flex; justify-content: center; gap: 8px; }
        .rc-dot { width: 10px; height: 10px; border-radius: 99px; background: rgba(167,166,162,0.4); cursor: pointer; transition: all 0.25s; border: none; padding: 0; }
        .rc-dot.fill { background: ${T.ink3}; }
        .rc-dot.cur { background: ${T.accent}; width: 26px; }
        .rc-btn { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.7vw,16px); border: none; border-radius: 12px; padding: clamp(11px,1.6vw,14px) clamp(18px,2.6vw,26px); cursor: pointer; background: ${T.ink}; color: ${T.bg}; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); transition: all 0.2s; white-space: nowrap; }
        .rc-btn:hover:not(:disabled) { background: ${T.accent}; }
        .rc-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
        .rc-btn.ghost { background: transparent; color: ${T.ink2}; box-shadow: none; }
        .rc-btn.done { background: ${T.success}; color: #fff; }
        @media (max-width: 640px) { .rc-nav { flex-wrap: wrap; justify-content: center; row-gap: 10px; } .rc-dots { width: 100%; order: -1; } }

        /* === 🏅 ACHIEVEMENTS — hisoblagich + kolleksiya + to'liq-ekran bayram === */
        .ach-cnt-wrap { position: relative; }
        .ach-counter { display: inline-flex; align-items: center; gap: 4px; background: ${T.paper}; border: 1.5px solid ${T.line}; border-radius: 99px; padding: 5px 11px 5px 9px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink2}; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .ach-counter.has { border-color: ${T.accent}66; }
        .ach-counter:hover { border-color: ${T.accent}; box-shadow: 0 6px 16px -8px rgba(255,79,40,0.4); }
        .ach-counter b { color: ${T.accent}; font-size: 14px; font-variant-numeric: tabular-nums; }
        .ach-cnt-tot { color: ${T.ink3}; font-size: 11.5px; }
        .ach-cnt-ic { font-size: 14px; }
        .ach-counter.bump { animation: ach-bump 0.8s cubic-bezier(.34,1.6,.4,1); }
        @keyframes ach-bump { 0% { transform: scale(1); } 30% { transform: scale(1.35) rotate(-6deg); box-shadow: 0 0 0 6px rgba(255,79,40,0.18); } 60% { transform: scale(0.96) rotate(3deg); } 100% { transform: scale(1) rotate(0); box-shadow: 0 0 0 0 rgba(255,79,40,0); } }
        .ach-pop { position: absolute; top: calc(100% + 8px); right: 0; z-index: 200; width: 222px; background: ${T.paper}; border: 1px solid ${T.line}; border-radius: 14px; padding: 10px; box-shadow: 0 18px 44px -14px rgba(${T.shadowBase},0.4); display: flex; flex-direction: column; gap: 3px; animation: fade-step 0.22s ease; }
        .ach-pop-h { font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.accent}; padding: 2px 6px 6px; }
        .ach-pop-row { display: flex; align-items: center; gap: 9px; padding: 6px 8px; border-radius: 9px; }
        .ach-pop-row.got { background: ${T.accentSoft}66; }
        .ach-pop-ic { font-size: 17px; width: 20px; text-align: center; }
        .ach-pop-row:not(.got) .ach-pop-ic { filter: grayscale(1) opacity(0.5); font-size: 13px; }
        .ach-pop-nm { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .ach-pop-row:not(.got) .ach-pop-nm { color: ${T.ink3}; }
        .ach-coll { display: flex; flex-direction: column; gap: 10px; }
        .ach-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 560px) { .ach-grid { grid-template-columns: repeat(2, 1fr); } }
        .ach-badge { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; border-radius: 14px; padding: 14px 10px; transition: transform 0.15s; }
        .ach-badge.got { background: linear-gradient(160deg, ${T.accentSoft}, #FFF3EC); border: 1.5px solid ${T.accent}55; }
        .ach-badge.got:hover { transform: translateY(-3px); }
        .ach-badge.locked { background: ${T.bg}; border: 1.5px dashed ${T.line}; opacity: 0.75; }
        .ach-badge-ic { font-size: 30px; line-height: 1; }
        .ach-badge.locked .ach-badge-ic { filter: grayscale(1) opacity(0.55); font-size: 22px; }
        .ach-badge-name { font-family: 'Manrope'; font-weight: 800; font-size: 13px; color: ${T.ink}; }
        .ach-badge.locked .ach-badge-name { color: ${T.ink3}; }
        .ach-badge-desc { font-family: 'Manrope'; font-size: 10.5px; color: ${T.ink2}; line-height: 1.3; }
        .acu-overlay { position: fixed; inset: 0; z-index: 11000; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer;
          background: radial-gradient(circle at 50% 42%, rgba(20,14,6,0.34) 0%, rgba(10,8,14,0.72) 62%, rgba(8,6,12,0.86) 100%);
          animation: acu-bg-in 0.35s ease-out, acu-bg-out 0.55s ease-in 3.45s forwards; }
        @keyframes acu-bg-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes acu-bg-out { to { opacity: 0; } }
        .acu-rays { position: absolute; top: 50%; left: 50%; width: 170vmax; height: 170vmax; transform: translate(-50%,-50%); pointer-events: none;
          background: repeating-conic-gradient(from 0deg, rgba(255,201,77,0.16) 0deg 7deg, transparent 7deg 20deg);
          -webkit-mask-image: radial-gradient(circle, #000 8%, rgba(0,0,0,0.55) 30%, transparent 62%); mask-image: radial-gradient(circle, #000 8%, rgba(0,0,0,0.55) 30%, transparent 62%);
          animation: acu-spin 16s linear infinite, acu-fade 0.6s ease-out; }
        @keyframes acu-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes acu-fade { from { opacity: 0; } to { opacity: 1; } }
        .acu-glow { position: absolute; top: 42%; left: 50%; width: 78vmin; height: 78vmin; transform: translate(-50%,-50%); pointer-events: none; filter: blur(4px);
          background: radial-gradient(circle, rgba(255,224,150,0.62) 0%, rgba(255,150,60,0.30) 38%, rgba(255,120,40,0) 68%);
          animation: acu-glow-pulse 2.2s ease-in-out infinite, acu-fade 0.5s ease-out; }
        @keyframes acu-glow-pulse { 0%,100% { opacity: 0.85; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.08); } }
        .acu-ring { position: absolute; top: 42%; left: 50%; width: 130px; height: 130px; border-radius: 50%; border: 3px solid rgba(255,240,200,0.85); transform: translate(-50%,-50%) scale(0.3); pointer-events: none; animation: acu-shock 1s cubic-bezier(.2,.7,.3,1) forwards; }
        .acu-ring.d2 { border-color: rgba(255,180,90,0.6); animation-delay: 0.22s; }
        @keyframes acu-shock { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(6.5); opacity: 0; } }
        .acu-stage { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: clamp(14px,3vw,22px); animation: acu-bg-in 0.3s ease-out; }
        .acu-medal-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
        .acu-medal { position: relative; width: clamp(112px,26vw,152px); height: clamp(112px,26vw,152px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: clamp(54px,13vw,74px); overflow: hidden;
          background: radial-gradient(circle at 38% 30%, #FFF0BE 0%, #FFD35A 42%, #F5A623 72%, #E4870C 100%);
          box-shadow: 0 0 70px 12px rgba(255,201,77,0.55), 0 22px 54px -12px rgba(0,0,0,0.55), inset 0 -9px 18px rgba(140,70,0,0.28), inset 0 7px 14px rgba(255,255,255,0.6);
          animation: acu-medal-pop 0.7s cubic-bezier(.28,1.5,.4,1) both, acu-float 2.6s ease-in-out 0.7s infinite; }
        @keyframes acu-medal-pop { 0% { transform: scale(0) rotate(-40deg); } 55% { transform: scale(1.18) rotate(10deg); } 75% { transform: scale(0.94) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes acu-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -8px; } }
        .acu-shine { position: absolute; top: 0; bottom: 0; left: -70%; width: 45%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.75), transparent); transform: skewX(-18deg); animation: acu-shine-sweep 1.1s ease 0.5s 2; }
        @keyframes acu-shine-sweep { to { left: 130%; } }
        .acu-spark { position: absolute; top: 50%; left: 50%; font-size: clamp(14px,2.6vw,20px); color: #FFE9A8; text-shadow: 0 0 8px rgba(255,201,77,0.9); pointer-events: none; transform: translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(0); opacity: 0; animation: acu-spark-burst 1s ease-out both; }
        @keyframes acu-spark-burst { 0% { transform: translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(0); opacity: 0; } 35% { opacity: 1; } 100% { transform: translate(-50%,-50%) rotate(var(--a)) translateY(clamp(-130px,-24vw,-96px)) scale(1); opacity: 0; } }
        .acu-txt { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; }
        .acu-eyebrow { font-family: 'Manrope', sans-serif; font-weight: 900; font-size: clamp(12px,1.8vw,14px); letter-spacing: 0.2em; text-transform: uppercase; color: #FFD35A; text-shadow: 0 2px 12px rgba(0,0,0,0.5); animation: acu-rise 0.5s ease-out 0.35s both; }
        .acu-name { font-family: 'Source Serif 4', Georgia, serif; font-weight: 700; font-size: clamp(26px,5.5vw,42px); color: #fff; line-height: 1.1; text-shadow: 0 3px 22px rgba(0,0,0,0.55); animation: acu-rise 0.55s cubic-bezier(.3,1.2,.4,1) 0.45s both; }
        .acu-desc { font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,2vw,16px); color: rgba(255,255,255,0.82); max-width: 30ch; line-height: 1.5; animation: acu-rise 0.5s ease-out 0.6s both; }
        @keyframes acu-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .acu-tap { font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; color: rgba(255,255,255,0.5); margin-top: 4px; animation: acu-rise 0.5s ease-out 1.1s both, acu-blink 1.6s ease-in-out 1.6s infinite; }
        @keyframes acu-blink { 0%,100% { opacity: 0.5; } 50% { opacity: 0.85; } }
        @media (prefers-reduced-motion: reduce) { .acu-rays, .acu-medal, .acu-glow, .acu-tap { animation-iteration-count: 1 !important; } .acu-rays { animation: acu-fade 0.4s both !important; } }

        /* === Konfetti === */
        .confetti { position: fixed; inset: 0; pointer-events: none; z-index: 1200; overflow: hidden; }
        .confetti-bit { position: absolute; top: -24px; opacity: 0; will-change: transform, opacity; animation-name: confetti-fall; animation-timing-function: cubic-bezier(.25,.6,.45,1); animation-iteration-count: 1; animation-fill-mode: forwards; box-shadow: 0 2px 6px -2px rgba(${T.shadowBase},0.3); }
        @keyframes confetti-fall { 0% { transform: translateY(-24px) rotate(0deg); opacity: 0; } 8% { opacity: 1; } 55% { transform: translateY(48vh) translateX(22px) rotate(320deg); } 100% { transform: translateY(104vh) translateX(-12px) rotate(680deg); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .confetti { display: none; } }

        /* === 🏆 PODIUM === */
        .pod-stage { display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px,2vw,20px); padding-top: 8px; }
        .pod-col { display: flex; flex-direction: column; align-items: center; gap: 5px; width: clamp(88px,22vw,150px); }
        .pod-medal { font-size: clamp(26px,4vw,38px); line-height: 1; }
        .pod-name { font-family: 'Manrope'; font-weight: 800; font-size: clamp(13px,1.8vw,16px); color: ${T.ink}; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pod-score { font-size: clamp(11px,1.4vw,12.5px); color: ${T.ink2}; }
        .pod-bar { width: 100%; border-radius: 10px 10px 0 0; background: linear-gradient(180deg, ${T.accent}, ${T.accent}BB); box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.35); }
        .pod-1 .pod-bar { height: clamp(74px,11vw,120px); }
        .pod-2 .pod-bar { height: clamp(52px,8vw,86px); background: linear-gradient(180deg, ${T.ink2}, ${T.ink3}); }
        .pod-3 .pod-bar { height: clamp(38px,6vw,62px); background: linear-gradient(180deg, #C98A3D, #DDA55C); }
        .pod-col.me .pod-name { color: ${T.success}; }
        .pod-my { margin: 0; text-align: center; font-family: 'Manrope'; font-size: 14px; color: ${T.ink2}; }
        .pod-my b { color: ${T.accent}; }
        .pod-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow: auto; }
        .pod-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; background: rgba(${T.shadowBase},0.04); }
        .pod-row.me { background: ${T.successSoft}; outline: 1.5px solid ${T.success}66; }
        .pod-rank { min-width: 22px; font-size: 12px; font-weight: 700; color: ${T.ink3}; }
        .pod-row-name { flex: 1; min-width: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.ink}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pod-row-dots { display: flex; gap: 4px; }
        .pod-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(${T.shadowBase},0.15); }
        .pod-dot.ok { background: ${T.success}; }
        .pod-dot.bad { background: ${T.accent}; }
        .pod-row-score { min-width: 34px; text-align: right; font-size: 12.5px; font-weight: 700; color: ${T.ink}; }
        .pod-row-time { min-width: 46px; text-align: right; font-size: 11.5px; color: ${T.ink3}; }

        /* === 🛠️ JONLI PRAKTIKA === */
        .lp-task { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 9px; border-left: 4px solid ${T.accent}; }
        .lp-task-h { display: flex; align-items: center; gap: 8px; }
        .lp-task-badge { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 10.5px; letter-spacing: 0.12em; color: #fff; background: ${T.accent}; padding: 3px 9px; border-radius: 6px; }
        .lp-steps { display: flex; flex-direction: column; gap: 8px; }
        .lp-step { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 13px; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); }
        .lp-step:hover:not(.on) { box-shadow: 0 8px 18px -7px rgba(${T.shadowBase},0.24); }
        .lp-step.on { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}55; }
        .lp-check { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; background: ${T.bg}; color: ${T.ink3}; box-shadow: inset 0 0 0 1.5px ${T.ink3}55; transition: all 0.16s; }
        .lp-step.on .lp-check { background: ${T.success}; color: #fff; box-shadow: none; animation: lp-check-pop 0.34s cubic-bezier(.3,1.5,.5,1); }
        @keyframes lp-check-pop { 0% { transform: scale(0.5); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
        .lp-step-t { flex: 1; min-width: 0; }
        .lp-done-btn { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(14px,1.8vw,16px); cursor: pointer; border: none; border-radius: 13px; padding: 14px 20px; background: ${T.ink}; color: ${T.bg}; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.34); transition: all 0.18s; margin-top: 2px; }
        .lp-done-btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.5); }
        .lp-done-btn.is-done { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}66; cursor: default; animation: lp-done-pop 0.44s cubic-bezier(.3,1.35,.5,1); }
        @keyframes lp-done-pop { 0% { transform: scale(0.96); } 55% { transform: scale(1.04); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .lp-step.on .lp-check, .lp-done-btn.is-done { animation: none !important; } }
        .lp-mstats { background: ${T.blueSoft}; border-radius: 12px; padding: 13px 15px; display: flex; flex-direction: column; gap: 6px; }

        /* === 🃏 FLASHCARDS (3D flip) === */
        .fc-center { display: flex; justify-content: center; padding-top: 4px; }
        .fc { display: flex; flex-direction: column; gap: 11px; max-width: 480px; width: 100%; }
        .fc-top { display: flex; justify-content: space-between; align-items: center; }
        .fc-pill { display: inline-flex; align-items: center; gap: 5px; font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; border-radius: 99px; padding: 5px 13px; animation: fc-pill-pop 0.35s cubic-bezier(.34,1.5,.4,1); }
        .fc-pill b { font-size: 1.15em; font-variant-numeric: tabular-nums; }
        .fc-pill.learn { background: ${T.accentSoft}; color: ${T.accent}; border: 1.5px solid ${T.accent}44; }
        .fc-pill.knew { background: ${T.successSoft}; color: ${T.success}; border: 1.5px solid ${T.success}44; }
        @keyframes fc-pill-pop { 40% { transform: scale(1.16); } }
        .fc-bar { height: 7px; background: ${T.line}; border-radius: 99px; overflow: hidden; }
        .fc-bar-fill { display: block; height: 100%; background: linear-gradient(90deg, #FF8A3D, ${T.accent}); border-radius: 99px; transition: width .4s cubic-bezier(.34,1.2,.4,1); }
        .fc-cardwrap { perspective: 1200px; position: relative; }
        .fc-cardwrap::before, .fc-cardwrap::after { content: ""; position: absolute; left: 0; right: 0; top: 0; bottom: 0; border-radius: 20px; background: ${T.paper}; border: 2px solid ${T.line}; z-index: -1; }
        .fc-cardwrap::before { transform: translateY(7px) scale(0.965); opacity: 0.7; }
        .fc-cardwrap::after { transform: translateY(15px) scale(0.93); opacity: 0.4; }
        .fc-fly { position: relative; animation: fc-in 0.3s ease; }
        @keyframes fc-in { from { opacity: 0; transform: translateY(10px) scale(0.97); } }
        .fc-fly.out-knew { animation: fc-out-knew 0.42s ease forwards; }
        .fc-fly.out-again { animation: fc-out-again 0.42s ease forwards; }
        @keyframes fc-out-knew { 30% { transform: translateX(0) rotate(0); opacity: 1; } 100% { transform: translateX(70%) rotate(5deg); opacity: 0; } }
        @keyframes fc-out-again { 30% { transform: translateX(0) rotate(0); opacity: 1; } 100% { transform: translateX(-70%) rotate(-5deg); opacity: 0; } }
        .fc-fly.out-knew::after, .fc-fly.out-again::after { position: absolute; top: 50%; left: 50%; z-index: 6; width: 58px; height: 58px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 800; color: #fff; pointer-events: none; animation: fc-stamp 0.3s cubic-bezier(.34,1.6,.4,1); transform: translate(-50%, -50%); }
        .fc-fly.out-knew::after { content: '✓'; background: ${T.success}; box-shadow: 0 10px 26px -8px ${T.success}; }
        .fc-fly.out-again::after { content: '✗'; background: ${T.accent}; box-shadow: 0 10px 26px -8px ${T.accent}; }
        @keyframes fc-stamp { from { transform: translate(-50%, -50%) scale(0); } }
        .fc-card { position: relative; height: clamp(160px,26vw,188px); cursor: pointer; transform-style: preserve-3d; transition: transform .55s cubic-bezier(.4,0,.2,1); }
        .fc-card.flip { transform: rotateY(180deg); }
        .fc-card:not(.flip):hover { transform: translateY(-3px); }
        .fc-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 22px; text-align: center; }
        .fc-front { background: ${T.paper}; border: 2px solid ${T.line}; box-shadow: 0 14px 34px -18px rgba(${T.shadowBase},0.4); }
        .fc-back { background: linear-gradient(160deg, #FF8A3D, ${T.accent}); color: #fff; transform: rotateY(180deg); box-shadow: 0 16px 36px -16px rgba(255,79,40,0.6); }
        .fc-q { font-family: 'Manrope'; font-weight: 800; font-size: clamp(18px,2.8vw,23px); color: ${T.ink}; line-height: 1.3; text-wrap: balance; }
        .fc-cue { font-family: 'Manrope'; font-size: 13px; color: ${T.ink3}; }
        .fc-tap { color: ${T.accent}; font-weight: 700; }
        .fc-tag { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(24px,5vw,40px); letter-spacing: -0.02em; text-wrap: balance; }
        .fc-note { font-family: 'Manrope'; font-size: 14px; opacity: 0.92; }
        .fc-actions { display: flex; gap: 10px; }
        .fc-btn { flex: 1; padding: 13px; border-radius: 13px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; border: none; transition: transform .15s; }
        .fc-btn:hover { transform: translateY(-2px); }
        .fc-btn.knew { background: ${T.success}; color: #fff; box-shadow: 0 10px 22px -10px ${T.success}; }
        .fc-btn.again { background: ${T.paper}; border: 2px solid ${T.accent}66; color: ${T.accent}; }
        .fc-btn:disabled { opacity: 0.55; cursor: default; transform: none; }
        .fc-btn.ghost { background: ${T.paper}; border: 1.5px solid ${T.line}; color: ${T.ink}; flex: none; align-self: center; padding: 11px 22px; }
        .fc-hint { margin: 0; text-align: center; color: ${T.ink3}; font-style: italic; font-size: 13px; }
        .fc-done { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; background: ${T.successSoft}; border-radius: 18px; padding: 22px; max-width: 480px; }
        .fc-done-emoji { font-size: 40px; }
        .fc-done-h { font-family: 'Manrope'; font-weight: 800; font-size: 20px; color: ${T.success}; margin: 0; }
        .fc-done-s { font-family: 'Manrope'; color: ${T.ink2}; margin: 0 0 8px; font-size: 14px; }

        /* === ⚡ CODE STRIKE — CTA neon-kapsula === */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; border-radius: 18px; }
        .cs-cta { flex-direction: column; align-items: stretch; justify-content: center; text-align: center; gap: 0; position: relative; padding: 0; background: none; border: none; box-shadow: none; }
        @property --csa { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        .cs-cap { position: relative; overflow: hidden; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%;
          gap: clamp(10px,1.5vw,15px); padding: clamp(26px,3.6vw,44px) clamp(22px,3.2vw,40px); border-radius: 999px;
          background: radial-gradient(130% 170% at 50% 120%, #3D1F86 0%, #2A1560 44%, #1B0F3F 100%);
          border: 1.5px solid rgba(186,140,255,0.72);
          box-shadow: 0 0 0 1px rgba(90,40,180,.45), 0 0 26px rgba(124,58,237,.5), 0 0 68px rgba(124,58,237,.28), inset 0 0 48px rgba(124,58,237,.32);
          animation: cs-ignite 1.5s ease-out both, cs-breathe 3.8s ease-in-out 1.5s infinite; }
        @keyframes cs-ignite { 0% { opacity: .22; filter: saturate(.25) brightness(.55); box-shadow: none; } 32% { opacity: .3; filter: saturate(.3) brightness(.6); box-shadow: none; } 38% { opacity: 1; filter: none; } 44% { opacity: .38; filter: saturate(.4) brightness(.65); } 51% { opacity: 1; filter: none; } 57% { opacity: .55; filter: saturate(.5) brightness(.75); } 66%, 100% { opacity: 1; filter: none; } }
        @keyframes cs-breathe { 0%,100% { box-shadow: 0 0 0 1px rgba(90,40,180,.45), 0 0 26px rgba(124,58,237,.5), 0 0 68px rgba(124,58,237,.28), inset 0 0 48px rgba(124,58,237,.32); } 50% { box-shadow: 0 0 0 1px rgba(110,55,210,.6), 0 0 40px rgba(140,72,255,.75), 0 0 96px rgba(140,72,255,.42), inset 0 0 60px rgba(140,72,255,.44); } }
        .cs-ring { position: absolute; inset: 0; border-radius: inherit; padding: 2.5px; pointer-events: none; z-index: 4;
          background: conic-gradient(from var(--csa), transparent 0 80%, rgba(201,166,255,0) 80%, rgba(201,166,255,.9) 91%, #FFFFFF 96%, transparent 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude;
          animation: cs-current 3.4s linear infinite; }
        @keyframes cs-current { to { --csa: 360deg; } }
        .cs-sky { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .cs-tok { position: absolute; font-family: 'JetBrains Mono', monospace; font-weight: 700; line-height: 1; user-select: none; color: rgba(203,173,255,.32); text-shadow: 0 0 12px rgba(150,95,255,.4); animation: cs-float ease-in-out infinite; animation-duration: calc(var(--d,22s) / var(--spd,1)); will-change: transform; }
        .cs-tok.back { color: rgba(150,115,240,.16); filter: blur(.6px); }
        @keyframes cs-float { 0%,100% { transform: translate(0,0) rotate(-5deg); } 50% { transform: translate(16px,-14px) rotate(5deg); } }
        .cs-dash { position: absolute; height: 2px; border-radius: 2px; background: linear-gradient(90deg, transparent, rgba(190,150,255,.55), transparent); animation: cs-dash-run 5.5s linear infinite; }
        @keyframes cs-dash-run { 0% { transform: translateX(-46px); opacity: 0; } 14% { opacity: .85; } 86% { opacity: .85; } 100% { transform: translateX(76px); opacity: 0; } }
        .cs-thunder { position: absolute; inset: 0; opacity: 0; background: radial-gradient(62% 95% at 50% 0%, rgba(222,192,255,.55), transparent 64%); animation: cs-thunder 6.4s linear infinite; }
        @keyframes cs-thunder { 0%, 90.5%, 100% { opacity: 0; } 91.4% { opacity: .5; } 92.3% { opacity: .07; } 93.4% { opacity: .38; } 95% { opacity: 0; } }
        .cs-row { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; gap: clamp(14px,2.6vw,30px); }
        .csn-boltwrap { position: relative; display: inline-flex; flex: none; }
        .csn-bolt { width: clamp(30px,4.6vw,54px); height: auto; filter: drop-shadow(0 0 9px rgba(170,120,255,.75)); animation: cs-bolt-strike 2s linear infinite; }
        .csn-boltwrap.flip .csn-bolt { animation-delay: 1s; }
        @keyframes cs-bolt-strike { 0%, 100% { filter: drop-shadow(0 0 9px rgba(170,120,255,.75)) brightness(1); transform: translateY(0) scale(1); } 5% { filter: drop-shadow(0 0 26px rgba(230,205,255,1)) brightness(2.4); transform: translateY(2px) scale(1.14); } 9% { filter: drop-shadow(0 0 7px rgba(170,120,255,.55)) brightness(.9); transform: translateY(0) scale(.97); } 13% { filter: drop-shadow(0 0 20px rgba(215,185,255,.95)) brightness(1.8); transform: translateY(1px) scale(1.07); } 20% { filter: drop-shadow(0 0 9px rgba(170,120,255,.75)) brightness(1); transform: translateY(0) scale(1); } }
        .cs-spark { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #E7D9FF; box-shadow: 0 0 9px rgba(190,150,255,.95); opacity: 0; pointer-events: none; }
        .cs-spark.s1 { top: 6%; left: 72%; --sx: 15px; --sy: -16px; }
        .cs-spark.s2 { top: 50%; left: -10%; --sx: -17px; --sy: -10px; animation-delay: .3s !important; }
        .cs-spark.s3 { top: 80%; left: 74%; --sx: 13px; --sy: 12px; animation-delay: .55s !important; }
        .cs-cap:hover .cs-spark { animation: cs-spark-fly .9s ease-out infinite; }
        @keyframes cs-spark-fly { 0% { opacity: 0; transform: translate(0,0) scale(.4); } 22% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--sx,14px), var(--sy,-16px)) scale(1); } }
        .cs-word { position: relative; z-index: 2; display: inline-block; font-family: 'Manrope', sans-serif; font-weight: 900; font-style: italic; font-size: clamp(30px,6.2vw,72px); letter-spacing: .015em; line-height: 1.06; white-space: nowrap; padding-right: .06em; background: linear-gradient(180deg,#FFFFFF 10%,#E4D6FF 46%,#A97CFF 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; animation: cs-wglow 2.8s ease-in-out infinite; }
        .cs-word::before { content: attr(data-text); position: absolute; left: 0; top: 0; width: 100%; padding-right: inherit; pointer-events: none; background: linear-gradient(100deg, transparent 34%, rgba(255,255,255,.95) 48%, rgba(255,255,255,.4) 54%, transparent 66%); background-size: 260% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; animation: cs-glint 3.4s cubic-bezier(.6,0,.4,1) infinite; }
        @keyframes cs-wglow { 0%,100% { filter: drop-shadow(0 3px 0 rgba(38,10,88,.9)) drop-shadow(0 0 14px rgba(150,90,255,.5)); } 50% { filter: drop-shadow(0 3px 0 rgba(38,10,88,.9)) drop-shadow(0 0 27px rgba(172,112,255,.95)); } }
        @keyframes cs-glint { 0% { background-position: 135% 0; } 60%,100% { background-position: -55% 0; } }
        .cs-clickable:hover .cs-word { animation-duration: 1.4s; }
        .cs-hud { position: relative; z-index: 2; display: flex; gap: clamp(7px,1.1vw,11px); align-items: center; justify-content: center; flex-wrap: wrap; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(10px,1.3vw,13px); letter-spacing: .14em; color: #D9C9FF; }
        .cs-hud-i { display: inline-flex; align-items: baseline; gap: 5px; background: rgba(255,255,255,.055); border: 1px solid rgba(190,150,255,.42); border-radius: 999px; padding: 6px 14px; text-shadow: 0 0 10px rgba(160,100,255,.55); }
        .cs-hud-i b { font-size: clamp(13px,1.7vw,17px); color: #fff; }
        .cs-hud-dot { color: rgba(190,150,255,.6); }
        .cs-enter { position: relative; z-index: 2; font-family: 'Manrope'; font-weight: 900; font-size: clamp(13px,1.8vw,17px); color: #C9A6FF; letter-spacing: .01em; text-shadow: 0 0 12px rgba(150,90,255,.6); animation: cs-enter-pulse 1.3s ease-in-out infinite; }
        .cs-enter.wait { color: #8C86A8; text-shadow: none; animation: none; }
        @keyframes cs-enter-pulse { 0%,100% { opacity: .72; transform: translateY(0) scale(1); } 50% { opacity: 1; transform: translateY(2px) scale(1.03); } }
        .cs-clickable { cursor: pointer; user-select: none; transition: transform .18s cubic-bezier(.2,1,.3,1); outline: none; }
        .cs-clickable:hover { transform: scale(1.015); --spd: 2.2; }
        .cs-clickable:active { transform: scale(.99); }
        .cs-off { filter: saturate(.45) brightness(.74); animation: cs-ignite 1.5s ease-out both, cs-breathe 6.5s ease-in-out 1.5s infinite; }
        .cs-off .cs-ring, .cs-off .cs-thunder { display: none; }
        .cs-live { animation: cs-ignite 1.2s ease-out both, cs-breathe 1.7s ease-in-out 1.2s infinite; }
        .cs-livedot { position: absolute; top: clamp(12px,1.8vw,20px); right: clamp(18px,3vw,30px); z-index: 4; display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; letter-spacing: .18em; color: #7CFFB1; text-shadow: 0 0 10px rgba(60,255,150,.7); }
        .cs-livedot i { width: 8px; height: 8px; border-radius: 50%; background: #3CFF8E; box-shadow: 0 0 10px #3CFF8E; animation: cs-liveblink 1.1s ease-in-out infinite; }
        @keyframes cs-liveblink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
        .cs-charging { animation: cs-charge .45s ease-in forwards !important; }
        @keyframes cs-charge { to { transform: scale(1.05); filter: brightness(1.75) saturate(1.35); } }
        .cs-portal { position: fixed; inset: 0; z-index: 10400; pointer-events: none; background: radial-gradient(52% 52% at 50% 55%, rgba(210,180,255,.95), rgba(124,58,237,.55) 42%, transparent 76%); animation: cs-portal-in .9s ease-in-out both; }
        @keyframes cs-portal-in { 0% { opacity: 0; transform: scale(.55); } 48% { opacity: 1; transform: scale(1.35); } 100% { opacity: 0; transform: scale(1.7); } }
        @media (prefers-reduced-motion: reduce) { .cs-cap, .cs-ring, .cs-tok, .cs-dash, .cs-thunder, .cs-word, .cs-word::before, .csn-bolt, .cs-spark, .cs-enter, .cs-livedot i, .cs-hud-i, .cs-portal { animation: none !important; } }
        @media (max-width: 560px) { .cs-word { font-size: clamp(26px,9vw,50px); } .cs-cap { border-radius: 40px; padding: 22px 18px; } .cs-livedot { top: 10px; right: 14px; } }

        /* === ⚔️ ARENA === */
        .qz-arena { position: fixed; inset: 0; z-index: 10500; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; padding: clamp(18px,4vw,44px) clamp(12px,3vw,32px); background: radial-gradient(62% 46% at 10% 6%, rgba(124,58,237,0.30) 0%, rgba(124,58,237,0) 56%), radial-gradient(58% 48% at 92% 12%, rgba(15,166,214,0.14) 0%, rgba(15,166,214,0) 55%), radial-gradient(70% 52% at 78% 104%, rgba(255,79,40,0.14) 0%, rgba(255,79,40,0) 60%), radial-gradient(90% 55% at 50% -8%, #26123F 0%, rgba(38,18,63,0) 54%), #140B30; }
        .qz-arena::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: radial-gradient(rgba(190,150,255,0.08) 1.1px, transparent 1.2px); background-size: 24px 24px; -webkit-mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); }
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: rgba(190,150,255,0.14); text-shadow: 0 0 16px rgba(150,95,255,0.35); animation: qz-drift ease-in-out infinite; will-change: transform; }
        @keyframes qz-drift { 0%,100% { transform: translate(0,0) rotate(-6deg) scale(1); } 50% { transform: translate(18px,-24px) rotate(6deg) scale(1.05); } }
        @media (prefers-reduced-motion: reduce) { .qz-shp { animation: none; } }
        .qz-x { position: fixed; top: 14px; right: 16px; z-index: 10600; width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(186,140,255,0.34); background: rgba(255,255,255,0.06); color: #D9C9FF; font-size: 16px; cursor: pointer; box-shadow: 0 0 20px rgba(124,58,237,0.22); transition: transform 0.25s, color 0.2s, background 0.2s; }
        .qz-x:hover { color: #F2ECFF; background: rgba(255,255,255,0.12); transform: rotate(90deg); }
        .qz-view { position: relative; z-index: 1; width: 100%; max-width: 820px; display: flex; flex-direction: column; align-items: center; gap: clamp(14px,2.4vw,22px); margin: auto; }
        .qz-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(22px,4vw,36px); color: #F2ECFF; margin: 0; text-align: center; letter-spacing: -0.02em; text-shadow: 0 0 24px rgba(150,95,255,0.35); }
        .qz-sub { font-family: 'Manrope'; font-size: clamp(13px,1.9vw,16px); color: #B9A8E6; margin: 0; text-align: center; max-width: 540px; line-height: 1.55; font-weight: 500; }
        .qz-dimtxt { color: #8C86A8; font-family: 'Manrope'; font-size: 14px; font-style: italic; }
        .qz-lobby-players { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 640px; }
        .qz-pchip { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(186,140,255,0.34); color: #F2ECFF; font-family: 'Manrope'; font-weight: 700; font-size: 14px; border-radius: 99px; padding: 7px 16px; box-shadow: 0 0 18px rgba(124,58,237,0.2); animation: qz-pop 0.4s cubic-bezier(.34,1.5,.4,1); }
        .qz-pchip.me { background: linear-gradient(170deg,#FF8A3D,#FF4F28); color: #fff; border-color: transparent; box-shadow: 0 0 22px rgba(255,79,40,0.45); }
        @keyframes qz-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .qz-btn { background: linear-gradient(170deg,#FF8A3D,#FF4F28); color: #fff; border: none; border-radius: 14px; padding: 13px 26px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 14px 26px -10px rgba(255,79,40,0.6), inset 0 2px 0 rgba(255,255,255,0.3); transition: transform 0.18s; }
        .qz-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .qz-btn:disabled { opacity: 0.5; cursor: default; }
        .qz-btn.big { font-size: clamp(16px,2.2vw,19px); padding: clamp(15px,2vw,18px) clamp(32px,4vw,46px); }
        .qz-btn.ghost { background: linear-gradient(170deg,#7C3AED,#5B21B6); color: #F2ECFF; border: 1px solid rgba(186,140,255,0.5); box-shadow: 0 0 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
        .qz-waitmsg { margin: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14.5px; color: #3CE88E; text-align: center; text-shadow: 0 0 14px rgba(60,232,142,0.4); }
        .qz-qview { max-width: 880px; }
        .qz-top { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .qz-count { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.8vw,16px); color: #B9A8E6; }
        .qz-count b { color: #F2ECFF; font-size: 1.25em; }
        .qz-ansn { font-family: 'Manrope'; font-weight: 800; font-size: clamp(13px,1.8vw,16px); color: #FF7A4D; min-width: 64px; text-align: right; text-shadow: 0 0 12px rgba(255,90,44,0.4); }
        .qz-timer { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
        .qz-timer-n { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 20px; }
        .qz-timer.urgent { animation: qz-shake 0.5s ease-in-out infinite; }
        @keyframes qz-shake { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .qz-q { font-family: 'Manrope'; font-weight: 800; font-size: clamp(19px,3.2vw,28px); color: #F2ECFF; margin: 0; text-align: center; line-height: 1.35; background: rgba(255,255,255,0.05); border: 1px solid rgba(186,140,255,0.34); border-radius: 20px; padding: clamp(18px,2.8vw,28px) clamp(18px,3vw,30px); width: 100%; box-shadow: 0 0 34px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.06); text-wrap: balance; }
        .qz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(11px,1.6vw,15px); width: 100%; }
        @media (max-width: 560px) { .qz-grid { grid-template-columns: 1fr; } }
        .qz-tile { --gl: 255,255,255; position: relative; display: flex; align-items: center; gap: 14px; border: none; border-radius: 18px; padding: clamp(15px,2.4vw,22px) clamp(14px,2.2vw,20px); cursor: pointer; text-align: left; min-height: 66px; color: #fff; overflow: hidden; box-shadow: 0 10px 26px -12px rgba(0,0,0,0.55), 0 0 26px -4px rgba(var(--gl),0.42), inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -4px 0 rgba(0,0,0,0.22), inset 0 0 0 1.5px rgba(0,0,0,0.24); transition: transform 0.14s, opacity 0.3s, box-shadow 0.14s, filter 0.2s; }
        .qz-grid .qz-tile:nth-child(1) { --gl: 255,90,44; }
        .qz-grid .qz-tile:nth-child(2) { --gl: 15,166,214; }
        .qz-grid .qz-tile:nth-child(3) { --gl: 245,166,35; }
        .qz-grid .qz-tile:nth-child(4) { --gl: 34,160,92; }
        .qz-tile:hover:not(:disabled):not(.rv) { transform: translateY(-3px); }
        .qz-tile:disabled { cursor: default; }
        .qz-shape { width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,0.22); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.35); display: flex; align-items: center; justify-content: center; font-size: clamp(16px,2.2vw,20px); color: #fff; flex-shrink: 0; }
        .qz-opt { flex: 1; font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(14px,2vw,17px); color: #fff; line-height: 1.3; letter-spacing: -0.01em; }
        .qz-tile.faded { filter: saturate(0.5); opacity: 0.4; }
        .qz-tile.picked { outline: 3px solid #fff; box-shadow: 0 0 0 4px rgba(255,255,255,0.4), 0 14px 26px -12px rgba(0,0,0,0.4); animation: qz-pop 0.3s; }
        .qz-pbadge { position: absolute; top: -9px; right: -7px; width: 27px; height: 27px; border-radius: 50%; background: #fff; color: #12A968; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 12px rgba(0,0,0,0.28); }
        .qz-tile.rv.win { outline: 4px solid #fff; box-shadow: 0 0 0 5px rgba(43,217,124,0.45), 0 0 60px rgba(43,217,124,0.7), 0 14px 30px -12px rgba(0,0,0,0.5); animation: qz-pop 0.4s; }
        .qz-tile.rv.lose { filter: saturate(0.45); opacity: 0.4; }
        .qz-cnt { font-family: 'Manrope'; font-weight: 800; font-size: clamp(15px,2.2vw,19px); color: #fff; background: rgba(0,0,0,0.22); border-radius: 99px; padding: 4px 13px; flex-shrink: 0; margin-left: auto; font-variant-numeric: tabular-nums; }
        .qz-mrow { display: flex; align-items: center; gap: 14px; }
        .qz-allin { font-family: 'Manrope'; font-weight: 700; font-size: 15px; color: #3CE88E; text-shadow: 0 0 14px rgba(60,232,142,0.4); animation: qz-pop 0.4s; }
        .qz-res { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; justify-content: center; border-radius: 16px; padding: 14px 26px; animation: qz-pop 0.45s cubic-bezier(.34,1.5,.4,1); }
        .qz-res.good { background: rgba(43,217,124,0.15); outline: 1.5px solid rgba(43,217,124,0.5); box-shadow: 0 0 30px rgba(43,217,124,0.28); }
        .qz-res.bad { background: rgba(255,90,90,0.14); outline: 1.5px solid rgba(255,90,90,0.42); box-shadow: 0 0 30px rgba(255,90,90,0.22); }
        .qz-res-pts { font-family: 'Manrope'; font-weight: 800; font-size: clamp(28px,4.4vw,40px); color: #3CE88E; line-height: 1; text-shadow: 0 0 20px rgba(60,232,142,0.45); font-variant-numeric: tabular-nums; }
        .qz-res-t { font-family: 'Manrope'; font-weight: 700; font-size: clamp(14px,2vw,17px); color: #F2ECFF; }
        .qz-res-rank { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; color: #B9A8E6; width: 100%; text-align: center; }
        .qz-board { width: 100%; max-width: 480px; background: rgba(255,255,255,0.05); border: 1px solid rgba(186,140,255,0.32); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 0 32px rgba(124,58,237,0.25); }
        .qz-board.wide { max-width: 640px; max-height: 260px; overflow: auto; }
        .qz-board-h { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; letter-spacing: 0.1em; color: #FF7A4D; margin-bottom: 3px; text-transform: uppercase; text-shadow: 0 0 12px rgba(255,90,44,0.4); }
        .qz-brow { display: flex; align-items: center; gap: 10px; padding: 8px 11px; border-radius: 11px; background: rgba(255,255,255,0.05); }
        .qz-brow.me { background: linear-gradient(90deg,rgba(43,217,124,0.26),rgba(43,217,124,0.06)); outline: 1.5px solid rgba(43,217,124,0.55); }
        .qz-brank { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; color: #F2ECFF; background: rgba(255,255,255,0.18); border-radius: 8px; min-width: 23px; height: 23px; display: flex; align-items: center; justify-content: center; }
        .qz-brow:first-of-type .qz-brank { background: #FFCE3D; color: #1B0F3F; box-shadow: 0 0 14px rgba(255,206,61,0.5); }
        .qz-brow.me .qz-brank { background: #2BD97C; color: #0B2417; }
        .qz-bname { flex: 1; min-width: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14.5px; color: #F2ECFF; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-bstreak { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: #FF9A5D; }
        .qz-bok { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: #B9A8E6; }
        .qz-bpts { font-family: 'Manrope'; font-weight: 800; font-size: 15px; color: #FF7A4D; min-width: 52px; text-align: right; font-variant-numeric: tabular-nums; text-shadow: 0 0 10px rgba(255,90,44,0.35); }
        .qz-pod { display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px,2.4vw,24px); padding-top: 18px; }
        .qz-pod-col { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; width: clamp(92px,24vw,170px); }
        .qz-crown { position: absolute; top: -30px; font-size: 28px; animation: qz-float-sm 2s ease-in-out infinite; }
        @keyframes qz-float-sm { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }
        .qz-pod-medal { font-size: clamp(30px,5vw,46px); line-height: 1; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.4)); }
        .qz-pod-name { font-family: 'Manrope'; font-weight: 800; font-size: clamp(14px,2vw,18px); color: #F2ECFF; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-pod-pts { font-family: 'Manrope'; font-weight: 600; font-size: clamp(11px,1.5vw,13px); color: #B9A8E6; font-variant-numeric: tabular-nums; }
        .qz-pod-bar { width: 100%; border-radius: 14px 14px 0 0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.45); animation: qz-rise 0.9s cubic-bezier(.3,1.2,.4,1); transform-origin: bottom; }
        @keyframes qz-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .qz-pod-col.p1 .qz-pod-bar { height: clamp(96px,14vw,156px); background: linear-gradient(180deg, #FFDE6B, #F5A623); box-shadow: inset 0 2px 0 rgba(255,255,255,0.55), 0 0 54px rgba(245,166,35,0.55); }
        .qz-pod-col.p2 .qz-pod-bar { height: clamp(66px,10vw,110px); background: linear-gradient(180deg, #E4E7EE, #A2A8B4); box-shadow: inset 0 2px 0 rgba(255,255,255,0.55), 0 0 30px rgba(214,217,224,0.35); }
        .qz-pod-col.p3 .qz-pod-bar { height: clamp(48px,7vw,82px); background: linear-gradient(180deg, #F4C08F, #CB8149); box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), 0 0 30px rgba(237,177,131,0.35); }
        .qz-pod-col.me .qz-pod-name { color: #3CE88E; text-shadow: 0 0 14px rgba(60,232,142,0.4); }
        .qz-mypl { margin: 0; font-family: 'Manrope'; font-size: 15px; color: #B9A8E6; }
        .qz-mypl b { color: #3CE88E; }
        .qz-solo-res { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .qz-solo-pts { font-family: 'Manrope'; font-weight: 800; font-size: clamp(52px,9vw,84px); line-height: 1; color: #FF7A4D; text-shadow: 0 0 40px rgba(255,90,44,0.55); font-variant-numeric: tabular-nums; }
        .qz-endnote { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 10600; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 94vw; background: rgba(27,15,63,0.86); border: 1px solid rgba(186,140,255,0.4); border-radius: 16px; padding: 10px 16px; color: #F2ECFF; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13.5px; box-shadow: 0 0 34px rgba(124,58,237,0.35); }
        .qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
        .qz-q .qcode { background: rgba(203,173,255,0.18); color: #F2ECFF; }
        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
      `}</style>
      <AchCtx.Provider value={earned}>
      <BoardCtx.Provider value={boardVal}>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="Birinchi resursni qo'shish darsi" />
          ) : (
            <>
              <Current screen={screen} storedAnswer={answers[screen]} answers={answers} achievements={earned} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
              <LiveBadge live={live} total={TOTAL_SCREENS} />
              <AchToasts toasts={achToasts} onDone={(k) => setAchToasts(t => t.filter(x => x.k !== k))} />
            </>
          )}
        </div>
      </LiveGateCtx.Provider>
      </BoardCtx.Provider>
      </AchCtx.Provider>
    </LangContext.Provider>
  );
}
