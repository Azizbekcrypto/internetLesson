import React, { useState, useEffect, useLayoutEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png';

// ============================================================
// 4a-MODUL (NestJS) · DARS 1 — «NEST ARXITEKTURA: TIRIK KO'RISH» — PLATFORM STANDARD v18 (AUDIOSIZ)
// Maqsad: tayyor NestJS loyihasini clone qilib ishga tushirish, Swagger'da tirik API ko'rish,
//         restoran binosini (fayl xaritasi) o'rganish va BUYURTMA YO'LINI O'ZI YIG'ISH.
// Repo: https://github.com/Azizbekcrypto/IntroNestArxitechture
// 🍽️ BIRLASHTIRUVCHI DUNYO — RESTORAN (3 darsga yagona lug'at):
//   Guard = 🛡️ eshik qo'riqchisi · Controller = 🤵 ofitsiant · ValidationPipe+DTO = 🧐 nazoratchi + 📋 anketa
//   Service = 👨‍🍳 oshpaz · BaseService = 📖 retsept kitobi · Repository = 📦 omborchi · PostgreSQL = 🗄️ ombor
//   Entity = 📐 javon chizmasi · Module = 📑 shtat jadvali · successRes = 🍽️ bir xil lagan · AppModule.imports = 🪧 kirish taxtasi
// INTERAKTIV BEAT'lar: s9 «Buyurtma yo'li» (drag + 3 mijoz) · s14 aktiv shtat jadvali (DI) ·
//   s15 DragDropOrder (5 qadam) · s19 «Noto'g'ri xonadagi qator» (1-urinish qotiriladi).
// JONLI: useLiveSession + INLINE_KEYS + CodeStrike arena + Podium (ball to'g'riligi — ⚡ Jonli roli).
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309', nest: '#E0234E',
  line: '#E9E6DF',
  // 🍽️ RESTORAN ZONALARI (s9 buyurtma yo'li · s14 DI simlari) — bola bekatning QAYERDA ekanini RANGDAN biladi
  hallBg: '#E4F3FA', hallInk: '#0B6E90', hallLine: '#8FCFE6',   // ZAL — och/salqin (mijoz bilan gaplashiladi)
  kitchBg: '#FBEFD8', kitchInk: '#9C5A0C', kitchLine: '#EBC183', // OSHXONA — iliq (ish bajariladi)
  storeBg: '#E4E8F1', storeInk: '#3C4A66', storeLine: '#A8B3C8', // OMBOR — to'q/sovuq (saqlanadi)
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

// ============================================================
// JONLI SESSIYA INFRA — InternetLesson/ReactIntro bilan bir xil (liveRpc/useLiveSession/LiveGate)
// ============================================================
// ============================================================
// JONLI SESSIYA INFRA — InternetLesson/ReactIntro bilan bir xil (liveRpc/useLiveSession/LiveGate)
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
// Nickname — qurilma bo'ylab BITTA (darsga bog'lanmagan kalit): Internet darsida yozgan ismi shu yerda ham chiqadi
const LIVE_NICK_KEY = 'liveNickname';
const nickRead = () => { try { return localStorage.getItem(LIVE_NICK_KEY) || ''; } catch { return ''; } };
const nickStore = (n) => { try { localStorage.setItem(LIVE_NICK_KEY, n); } catch {} };
// Statistika uchun jadval o'qish (RLS: select ochiq, yozish faqat RPC)
async function liveList(path) {
  const r = await fetch(`${LIVE_SUPABASE_URL}/rest/v1/${path}`, { headers: _liveHdr });
  if (!r.ok) throw new Error(`list: ${r.status}`);
  return r.json();
}
const livePlayers = (pin) => liveList(`live_players?pin=eq.${encodeURIComponent(pin)}&select=id,nickname,joined_at&order=joined_at.asc`);
// screenIdx berilmasa — faqat DARS javoblari (<100); Mustahkamlash javoblari 100+ indekslarda
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
  const [quiz, setQuiz] = useState({ state: 'off', q: -1 }); // Mustahkamlash holati (serverdan)
  const [revealScreen, setRevealScreen] = useState(-1); // Kahoot-reveal: mentor natijasini ochgan ekran (serverdan)
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
      syncQuiz(row); // mentor sahifani yangilagan bo'lsa — quiz holati tiklanadi
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
      // Serverdan kelgan o'zbekcha xabarlarni (ism band va h.k.) o'zini ko'rsatamiz
      const m = String(e?.message || '');
      setJoinError(/ism|band|kod|dars|belgi/i.test(m) ? m : "Ulanib bo'lmadi. Internetni tekshiring.");
    }
    finally { setBusy(false); }
  }, [lessonId]);

  const selfStudy = useCallback(() => { setMode('self'); liveStore(lessonId, { mode: 'self' }); }, [lessonId]);
  const reportScreen = useCallback((idx) => { if (mode === 'mentor' && pin) liveRpc('advance_session', { p_pin: pin, p_token: tokenRef.current, p_screen: idx }).catch(() => {}); }, [mode, pin]);
  const endSession = useCallback(() => { if (mode === 'mentor' && pin) { liveRpc('end_session', { p_pin: pin, p_token: tokenRef.current }).catch(() => {}); setEnded(true); } }, [mode, pin]);

  // O'quvchi javobini serverga yozish — birinchi javob qotadi (server unique).
  // Tarmoq uzilsa 3 martagacha qayta uriniladi (javob yo'qolmasin).
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

  // Kahoot-reveal (faqat mentor): «Natijani ochish» — to'g'ri javob barcha
  // o'quvchilar ekranida ham birdan ochiladi (o'quvchi polling orqali oladi)
  const mentorReveal = useCallback((screenIdx) => {
    if (mode !== 'mentor' || !pin) return;
    setRevealScreen(screenIdx); // optimistik — proyektorda darhol
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
  const [nick, setNick] = useState(() => nickRead()); // oldingi darsda yozgan ismi tayyor chiqadi
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
    <button onClick={() => { setRole('mentor'); setCode(''); }} title="Mentor" aria-label="Mentor" style={{ position: 'absolute', bottom: 10, right: 12, background: 'none', border: 'none', fontSize: 16, opacity: 0.3, cursor: 'pointer', lineHeight: 1, padding: 4 }}>🧑‍🏫</button>
  </div></div>);
}

function LiveBadge({ live, total }) {
  const [bigOpen, setBigOpen] = useState(false);
  const [nPlayers, setNPlayers] = useState(null);
  // Mentor: qo'shilgan o'quvchilar soni (har 6s yangilanadi)
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
const MentorCtx = createContext(null); // mobil: yig'iladigan Mentor
const AchCtx = createContext(null); // 🏅 olingan nishonlar (Set) — Stage hisoblagichi uchun
const LiveGateCtx = createContext(null); // JONLI: mentor-gate + live obyekti (Jonli roli Provider bilan ulaydi)

// Matn ichidagi `kod` bo'laklarini chip qilib ko'rsatadi (qcode)
const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;

// AUDIOSIZ dars — useAudio/getAudioEngine zaglushkasi (QuestionScreen imzosi saqlanadi, TTS yo'q)
const getAudioEngine = () => null;
const useAudio = () => ({ muted: true, isPlaying: false, currentSegment: null, waitingFor: null, triggerEvent: () => {}, replay: () => {}, toggleMute: () => {} });

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

const LESSON_META = { lessonId: 'nest-arch-alive-4a-01-v18', lessonTitle: { uz: 'Nest arxitektura — tirik ko\'rish', ru: 'Nest архитектура — живой обзор' } };
// 22 ekran · 4.1 oqim: hook → reja → (exploration↔test)× → builder → debugging → praktika → podium → flashcard → summary
// M8 KESISH: eski s7 (ROLES 7 passiv karta) va s17 (takroriy xulosa) O'CHIRILDI — id'lar (s4/s8/s10/s16/s19) SAQLANDI.
const SCREEN_META = [
  { id: 's0',       type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',       type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',       type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',       type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',       type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',       type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's10',      type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's11',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's15',      type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's16',      type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's18',      type: 'builder',     template: 'custom',   scored: false, scope: null },
  { id: 's19',      type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 'practice', type: 'practice',    template: 'custom',   scored: false, scope: null },
  { id: 'podium',   type: 'stats',       template: 'custom',   scored: false, scope: null },
  { id: 'sflash',   type: 'flashcards',  template: 'custom',   scored: false, scope: null },
  { id: 's20',      type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);


const Split = ({ children }) => <div className="split">{children}</div>;
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
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

// 🏅 Yuqori paneldagi nishon hisoblagichi (Stage chrome)
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
  const isNarrow = useIsMobile(768); // mobil: Mentor yig'ilish rejimi
  const collapseOn = isNarrow && !mentorStatic; // ba'zi sahifalarda Mentor yig'ilmaydi
  const padH = isMobile ? 12 : 60; // InternetLesson layout standarti: 1100px + 60px
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]); // har ekranda Mentor ochiq holatdan boshlanadi
  // mobil: yangi bo'lak ochilganda pastga silliq surish (scrollSignal o'zgarsa)
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
    if (e.target && e.target.closest && e.target.closest('.mentor')) return; // Mentorning o'ziga tegsa — yig'maymiz
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
const RcFlow = ({ items, sep = '→' }) => (
  <div className="rc-flow">{items.map((t, i) => <React.Fragment key={i}><span className="rc-chip">{t}</span>{sep && i < items.length - 1 && <span className="rc-arr">{sep}</span>}</React.Fragment>)}</div>
);

// ⚡ JONLI: javob kaliti (ekran id → to'g'ri variant indeksi). `practice: -1` va `s19: -1` — sentinel (variant yo'q).
// ⚠️ Variant TARTIBI/qiymatlari 🎓 Metodist + ⚡ Jonli rollari tomonidan qayta balanslanadi — shu map ular bilan sinxron bo'lsin.
// ⚡ To'g'ri javob pozitsiyalari ATAYIN har xil (1 · 3 · 0 · 2) — «doim A» naqshi yo'q, o'qimay bosgan ball to'plamaydi.
// s19 (yakuniy debug) — REAL kalit: picked=0 → 1-urinishda topdi (to'g'ri), picked=1 → 1-urinishda xato bosdi.
const INLINE_KEYS = { s4: 1, s8: 3, s10: 0, s16: 2, s19: 0, practice: -1 };
// 📖 RECAPS — har SCORED test uchun 3 karta (kalit = ekran INDEKSI). Matn 🎓 Metodist tomonidan sayqallanadi.
const RECAPS = {
  4: {
    title: "Maxfiy sozlamalar — .env",
    cards: [
      { ic: "🔐", h: "Kalitlar kodga yozilmaydi", body: <>Baza manzili va maxfiy kalitlar <span className="mono">.env</span> faylida turadi — kod ichida emas.</> },
      { ic: "🙈", h: "GitHub ko'rmaydi", body: <><span className="mono">.gitignore</span> tufayli <span className="mono">.env</span> GitHub'ga yuklanmaydi.</> },
      { ic: "▶️", h: "start:dev — restoranni ochish", body: <><span className="mono">npm run start:dev</span> serverni yoqadi va o'zgarishlarni kuzatadi.</>, ask: "Maxfiy kalit qaysi faylda turadi?" },
    ]
  },
  7: {
    title: "Controller — ofitsiant",
    cards: [
      { ic: "🤵", h: "Yagona gaplashuvchi", body: <>Controller — <b>ofitsiant</b>: tashqi dunyodan so'rovni oladi va javobni qaytaradi.</> },
      { ic: "🚪", h: "@Get / @Post — eshiklar", body: <>Har dekorator — bitta eshik: qaysi manzilga qanday so'rov kelishi mumkin.</> },
      { ic: "👨‍🍳", h: "Ishni o'zi qilmaydi", body: <>Ofitsiant taom pishirmaydi — <b>oshpaz</b> (service) pishiradi.</>, ask: "Parolni kim shifrlaydi — ofitsiantmi yoki oshpazmi?" },
    ]
  },
  9: {
    title: "Eshik qo'riqchisi — birinchi bekat",
    cards: [
      { ic: "🛡️", h: "Eng birinchi — qo'riqchi", body: <>So'rov ichkariga kirishdan oldin <b>qo'riqchi</b> (guard) tekshiradi: klub kartasi (token) bormi?</> },
      { ic: "⛔", h: "Yo'q bo'lsa — 401", body: <>Token bo'lmasa mijoz eshikdan o'tmaydi: <span className="mono">401</span>. Oshpazgacha ham bormaydi.</> },
      { ic: "🧐", h: "Qo'riqchi ≠ nazoratchi", body: <>Qo'riqchi <b>odamni</b> tekshiradi, nazoratchi (ValidationPipe) esa <b>anketani</b>.</>, ask: "So'rov birinchi kimga uchraydi?" },
    ]
  },
  15: {
    title: "Yangi bo'lim — 5 qadam",
    cards: [
      { ic: "📐", h: "Avval javon chizmasi", body: <><b>Entity</b> — omborda qanday tokchalar bo'lishini aytadi (id, username...).</> },
      { ic: "📋", h: "Keyin anketa va oshpaz", body: <><b>DTO</b> — kelgan ma'lumot qoidalari, <b>Service</b> — asosiy ish.</> },
      { ic: "📑", h: "Oxirida shtat jadvali", body: <><b>Controller</b> eshiklarni ochadi, <b>Module</b> hammani ro'yxatga oladi.</>, vis: <RcFlow items={['📐 Entity', '📋 DTO', "👨‍🍳 Service", '🤵 Controller', '📑 Module']} />, ask: "Yangi bo'lim uchun nechta asosiy fayl kerak?" },
    ]
  },
  17: {
    title: "Har ish — o'z xonasida",
    cards: [
      { ic: "🤵", h: "Ofitsiant oshxonaga kirmaydi", body: <><b>Controller</b> faqat so'rovni oladi va javobni qaytaradi. Asosiy ishni o'zi bajarmaydi.</> },
      { ic: "👨‍🍳", h: "Parolni oshpaz shifrlaydi", body: <><span className="mono">bcrypt.hash()</span> — bu asosiy ish. Demak uning joyi <span className="mono">admin.service.ts</span> ichida.</> },
      { ic: "🧲", h: "AI tez yozadi, siz joyiga qo'yasiz", body: <>AI qatorni noto'g'ri faylga qo'yishi mumkin. Arxitekturani bilsangiz — xatoni darrov ko'rasiz.</>, ask: <>Nima uchun <span className="mono">bcrypt.hash()</span> ofitsiantning ishi emas?</> },
    ]
  }
};


function RecapOverlay({ screenIdx, onClose }) {
  const rc = RECAPS[screenIdx];
  const [i, setI] = useState(0);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setI(p => Math.min(p + 1, rc.cards.length - 1));
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
        {card.vis && <div className="rc-vis">{card.vis}</div>}
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
          const isC = reveal && i === correctIdx;
          const col = isC ? T.success : MSTATS_COLORS[i % 4];
          return (
            <div key={i} className={`mstats-row ${reveal && !isC ? 'dimmed' : ''}`}>
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
            {level === 'need' && <>
              <p className="mstats-verdict-t">⚠️ Faqat <b>{pct}%</b> to'g'ri — bu mavzu sinfga tushunarsiz qolgan. Davom etishdan oldin qisqa takrorlash tavsiya etiladi.</p>
              {onOpenRecap && <button className="rc-open" onClick={onOpenRecap}>📖 Qayta tushuntirish — {RECAPS[screenIdx]?.title}</button>}
            </>}
            {level === 'maybe' && <>
              <p className="mstats-verdict-t">🟡 <b>{pct}%</b> to'g'ri — yomon emas. Xohlasangiz, davom etishdan oldin qisqa takrorlab oling.</p>
              {onOpenRecap && <button className="rc-open soft" onClick={onOpenRecap}>📖 Qisqa takrorlash</button>}
            </>}
            {level === 'good' && <p className="mstats-verdict-t">✅ <b>{pct}%</b> to'g'ri — sinf mavzuni o'zlashtirdi. Bemalol davom eting!</p>}
            {level === 'few' && <p className="mstats-verdict-t">Javob berganlar kam ({answered} ta) — foiz bo'yicha xulosa chiqarish qiyin. O'zingiz baholang.</p>}
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

const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, audioText, audioOk, audioWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio(audioText ? [{ id: `s${screen}_intro`, text: audioText, trigger: 'on_mount', waits_for: { type: 'option_picked' } }] : null);
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const oneShot = !!(live && live.mode === 'student'); // jonli dars: BITTA urinish — xato bo'lsa ham qotadi
  const isMentorLive = !!(live && live.mode === 'mentor');
  const mountTs = useRef(Date.now()); // tezlik: savol ochilgandan bosishgacha (teng ballda hal qiladi)
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  // MENTOR (proyektor): o'zi javob BERMAYDI — «Natijani ochish» bosilguncha to'g'ri javob sir saqlanadi.
  const [mReveal, setMReveal] = useState(() => !!(isMentorLive && storedAnswer));
  // 📖 Qayta tushuntirish (recap) — natija past chiqsa mentor ochadi; o'quvchi xato qilsa o'zi ham ochishi mumkin
  const [recapOpen, setRecapOpen] = useState(false);
  const hasRecap = !!RECAPS[screen];
  const doReveal = () => { setMReveal(true); if (live) live.mentorReveal(screen); if (storedAnswer === undefined) onAnswer(screen, { mentorRevealed: true }); };
  const liveRevealScreen = live ? live.revealScreen : -1;
  useEffect(() => { if (isMentorLive && liveRevealScreen === screen) setMReveal(true); }, [isMentorLive, liveRevealScreen, screen]);
  const pick = (i) => {
    if (solved || isMentorLive) return;
    const isCorrect = i === correctIdx;
    setPicked(i);
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect; // ball: 1-urinishni qotirib qo'yamiz
    if (oneShot) {
      // Jonli dars: javob darhol qotadi (to'g'ri ham, xato ham) va serverga yoziladi
      setSolved(true);
      onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: isCorrect, firstAttemptCorrect: isCorrect, solved: true, lastPicked: i });
      live.submitAnswer(screen, SCREEN_META[screen]?.id || `s${screen}`, i, isCorrect, Date.now() - mountTs.current);
    } else {
      if (isCorrect) setSolved(true);
      onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
    }
    if (audioText) { audio.triggerEvent('option_picked'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(isCorrect ? (audioOk || "To'g'ri.") : (audioWrong || "Unchalik emas. Qaytadan urinib ko'ring.")); }, 300); }
  };
  const wrongLocked = oneShot && solved && picked !== correctIdx; // jonli darsda xato bosib qotgan
  // KAHOOT REVEAL: jonli darsda javob bosilgach to'g'ri/XATO ham sir — faqat «javob qabul qilindi».
  // Mentor «Natijani ochish»/keyingi sahifa/dars tugashi bilan hammada birdan ochiladi.
  const revealed = !oneShot || !!(live && (live.revealScreen === screen || live.mentorScreen > screen || live.status === 'ended' || !live.mentorAlive));
  const waiting = oneShot && solved && !revealed; // javob qotdi — natija mentordan kutilmoqda
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow audioState={audioText ? audio : undefined} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? !mReveal : !solved} label={isMentorLive ? (mReveal ? 'Davom etish' : 'Avval natijani oching') : solved ? 'Davom etish' : (oneShot ? 'Javob tanlang' : "To'g'ri javobni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: isMentorLive ? 'flex-start' : 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        {oneShot && !solved && <p className="small mono fade-up" style={{ margin: '-8px 0 0', color: T.accent, fontWeight: 600 }}>⚡ Jonli dars — bitta urinish, o'ylab bosing!</p>}
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (isMentorLive) {
              if (mReveal) { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; } // reveal'gacha hammasi neytral
            } else if (solved) {
              if (waiting) { if (i === picked) cls += ' option-wait'; } // faqat neytral belgi — to'g'ri/xato hali sir
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
          {/* Xato qilgan o'quvchi mavzuni qisqa kartalarda qayta ko'radi.
              Jonli darsda — javob sirini saqlash uchun faqat reveal'dan keyin chiqadi. */}
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

// ===== MENTOR =====
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

// ===== MOCK TERMINAL =====
const REPO = 'https://github.com/Azizbekcrypto/IntroNestArxitechture';
const Term = ({ title = 'Terminal', children, minH }) => (
  <div className="term"><div className="term-bar"><span className="bb-dots"><i /><i /><i /></span><span className="term-title">{title}</span></div><div className="term-body" style={{ minHeight: minH }}>{children}</div></div>
);
const TLine = ({ cmd, out, col }) => (
  <div className="el-in tline">{cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : <span style={{ color: col || CODE.comment }}>{out}</span>}</div>
);

// ===== MOCK SWAGGER — restoran MENYUSI =====
const M_COLOR = { GET: T.blue, POST: T.success, PATCH: T.amber, DELETE: T.danger };
const ENDPOINTS = [
  { id: 'e1', m: 'POST', path: '/admin/signin', sum: 'Tizimga kirish', resp: '{\n  "statusCode": 200,\n  "message": "success",\n  "data": { "token": "eyJhbGci..." }\n}' },
  { id: 'e2', m: 'GET', path: '/admin', sum: 'Adminlar ro\'yxati', resp: '{\n  "statusCode": 200,\n  "data": [ { "id": "a1f...", "username": "ali" } ]\n}' },
  { id: 'e3', m: 'POST', path: '/admin', sum: 'Yangi admin', resp: '{ "statusCode": 201, "message": "success" }' },
  { id: 'e4', m: 'GET', path: '/admin/{id}', sum: 'Bitta admin', resp: '{ "statusCode": 200, "data": { "id": "a1f...", "username": "ali" } }' },
  { id: 'e5', m: 'DELETE', path: '/admin/{id}', sum: 'Adminni o\'chirish', resp: '{ "statusCode": 200, "message": "success" }' }
];
const Swagger = ({ openId, onToggle, triedIds, onTry }) => (
  <div className="swg">
    <div className="swg-top"><span className="swg-dot" /> AvtoNest API <span className="swg-ver">/api/v1</span></div>
    {ENDPOINTS.map(e => {
      const open = openId === e.id;
      const tried = triedIds.has(e.id);
      return (
        <div key={e.id} className="swg-row">
          <button className="swg-head" onClick={() => onToggle(e.id)}>
            <span className="swg-m" style={{ background: M_COLOR[e.m] }}>{e.m}</span>
            <span className="swg-path">{e.path}</span>
            <span className="swg-sum">{e.sum}</span>
            <span className="swg-chev">{open ? '▾' : '▸'}</span>
          </button>
          {open && (
            <div className="swg-detail el-in">
              {!tried
                ? <button className="btn-soft" onClick={() => onTry(e.id)} style={{ alignSelf: 'flex-start' }}>▶ Try it out</button>
                : <><div className="swg-code-lbl">Javob · <span style={{ color: T.success }}>200</span></div><pre className="json">{e.resp}</pre></>}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ===== FAYL DARAXTI — restoran binosi (BEAT 5) =====
const TREE = [
  { k: 'core/', role: 'Ombor zonasi — chizma va omborchi', d: "Omborda nima qanday shaklda turishi (javon chizmasi = entity) va u bilan kim ishlashi (omborchi = repository) shu yerda yozilgan.", kids: ['entity/Base.entity.ts', 'entity/admin.entity.ts', 'repository/admin.repository.ts'] },
  { k: 'api/', role: "Bo'limlar — zal va oshxona", d: "Har bo'lim (admin, auth...) — ofitsiant + oshpaz + anketa + shtat jadvali. Mijoz bilan ishlaydigan qism.", kids: ['admin/  (controller · service · module · dto)', 'auth/', 'app.module.ts'] },
  { k: 'infrastructure/', role: 'Umumiy jihozlar', d: "Bir marta yasalgan, hamma bo'lim ishlatadigan jihozlar: retsept kitobi (BaseService), token, bir xil lagan (successRes).", kids: ['base/base.service.ts', 'lib/token · lib/crypto', 'pagination · response · exception'] },
  { k: 'common/', role: "Eshik qo'riqchisi va qoidalar", d: "Qo'riqchilar (guard), maxsus dekoratorlar, umumiy qoidalar (interface, enum).", kids: ['guard/  (auth · roles)', 'decorator/', 'interface/ · enum/'] }
];

// ===== ★ BUYURTMA YO'LI — 6 BEKAT (s9 markaziy o'yin manbai) =====
// 🎨 ZONA RANG PLANI: har bekat uchta zonadan birida turadi — bola bekatni rangdan tanib oladi.
const ZONES = {
  hall:  { nm: 'ZAL',     d: 'mijoz bilan gaplashiladi' },
  kitch: { nm: 'OSHXONA', d: 'ish bajariladi' },
  store: { nm: 'OMBOR',   d: 'saqlanadi' }
};
const STATIONS = [
  { k: 'guard',     z: 'hall',  icon: '🛡️', name: "Eshik qo'riqchisi", code: 'Guard',                 d: "Odamni umuman kiritadimi? Klub kartasi (token) bormi — yo'q bo'lsa 401." },
  { k: 'waiter',    z: 'hall',  icon: '🤵',   name: 'Ofitsiant',          code: 'Controller',            d: "Tashqi dunyo bilan yagona gaplashuvchi. @Get / @Post — uning eshiklari." },
  { k: 'inspector', z: 'hall',  icon: '🧐',   name: 'Nazoratchi + anketa', code: 'ValidationPipe + DTO', d: "Anketa to'g'ri to'ldirilganmi? Noto'g'ri bo'lsa — 400, ichkariga kiritmaydi." },
  { k: 'chef',      z: 'kitch', icon: '👨‍🍳', name: 'Oshpaz + retsept kitobi', code: 'Service + BaseService', d: "Yagona harakat qiluvchi: parolni shifrlaydi, retsept kitobidagi tayyor qadamni bajaradi." },
  { k: 'store',     z: 'store', icon: '🗄️', name: 'Ombor + omborchi',    code: 'PostgreSQL + Repository', d: "Oshpaz omborga o'zi kirmaydi — omborchiga aytadi, u javon chizmasi bo'yicha qo'yadi." },
  { k: 'tray',      z: 'hall',  icon: '🍽️', name: 'Bir xil lagan',       code: 'successRes',            d: "Har taom bir xil idishda chiqadi: { statusCode, message, data }." }
];
const ROUTE = ['guard', 'waiter', 'inspector', 'chef', 'store', 'tray'];
const ST_BY_K = Object.fromEntries(STATIONS.map(s => [s.k, s]));
const CUSTOMERS = [
  { id: 'ok',      icon: '🟢', label: "To'g'ri mijoz",   req: "POST /admin · token ✓ · { username: 'ali', password: 'Aa1!xyz' }", token: true,  valid: true },
  { id: 'empty',   icon: '🟡', label: "Bo'sh username",  req: "POST /admin · token ✓ · { username: '', password: '123' }",        token: true,  valid: false },
  { id: 'notoken', icon: '🔴', label: 'Tokensiz mijoz',  req: "POST /admin · token ✗ · { username: 'ali', password: 'Aa1!xyz' }", token: false, valid: true }
];
// Bir yo'l — uch taqdir. Har bekat o'z shartini tekshiradi; xato tartibda AYNAN o'sha bekatda yiqiladi.
function runPath(slots, c) {
  const st = { auth: false, valid: false, cooked: false, saved: false };
  for (let i = 0; i < slots.length; i++) {
    const k = slots[i];
    if (k === 'guard') {
      if (!c.token) return { at: i, code: '401', expected: !st.cooked, msg: st.cooked ? "Qo'riqchi KECH tekshirdi — begona odam oshxonagacha kirib bordi." : "Qo'riqchi to'xtatdi: klub kartasi (token) yo'q. Mijoz eshikdan o'tmadi — oshpazgacha ham bormadi." };
      st.auth = true;
    } else if (k === 'inspector') {
      if (!c.valid) return { at: i, code: '400', expected: !st.cooked, msg: st.cooked ? "Nazoratchi KECH tekshirdi — oshpaz bo'sh anketa bo'yicha taom pishirib bo'lgan." : "Nazoratchi anketani rad etdi: username bo'sh. Iflos ma'lumot omborgacha bormadi." };
      st.valid = true;
    } else if (k === 'chef') {
      if (!st.auth) return { at: i, code: '401', expected: false, msg: "Oshpaz tekshirilmagan odamga taom pishiryapti — qo'riqchi hali eshikda emas, kartani hech kim ko'rmadi!" };
      if (!st.valid) return { at: i, code: '500', expected: false, msg: "Oshpaz tekshirilmagan anketa bilan ishladi — iflos ma'lumot oshxonaga kirdi." };
      st.cooked = true;
    } else if (k === 'store') {
      if (!st.cooked) return { at: i, code: '500', expected: false, msg: "Omborchi hali tayyor bo'lmagan narsani omborga qo'yolmaydi." };
      st.saved = true;
    } else if (k === 'tray') {
      if (!st.saved) return { at: i, code: '500', expected: false, msg: "Bo'sh lagan: saqlanmagan narsani mijozga berib bo'lmaydi." };
    }
  }
  return { at: -1, code: '201', expected: true, msg: "Mijoz taomni bir xil laganda oldi — 201 Created." };
}

// 🧲 Qayta ishlatiladigan DRAG-DROP TARTIB (L1 etalon: pointer + DOM-transform — HTML5 draggable YO'Q, mobil touchda ishlaydi)
function DragDropOrder({ items, hints, onSolved, doneText }) {
  const order = items.map(x => x.id);
  const byId = useMemo(() => Object.fromEntries(items.map(x => [x.id, x])), [items]);
  // YAGONA holat — pool va slots birga (setState ichida setState YO'Q → StrictMode'da dublikat bo'lmaydi)
  const [st, setSt] = useState(() => {
    const a = order.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return { pool: a, slots: order.map(() => null) };
  });
  const { pool, slots } = st;
  const slotRefs = useRef([]);
  const full = slots.every(s => s !== null);
  const solved = slots.every((s, i) => s === order[i]);
  const wrong = full && !solved;
  useEffect(() => { if (solved) onSolved && onSolved(); }, [solved]); // eslint-disable-line
  const place = (id, from, slotIdx) => setSt(({ pool, slots }) => {
    const ns = slots.slice(); const occ = ns[slotIdx];
    if (typeof from === 'number') ns[from] = null;
    ns[slotIdx] = id;
    let np = from === 'pool' ? pool.filter(x => x !== id) : pool.slice();
    if (occ) np = [...np, occ];
    return { pool: np, slots: ns };
  });
  const toPool = (slotIdx) => setSt(({ pool, slots }) => {
    const id = slots[slotIdx]; if (!id) return { pool, slots };
    const ns = slots.slice(); ns[slotIdx] = null;
    return { pool: [...pool, id], slots: ns };
  });
  const tap = (id) => setSt(({ pool, slots }) => {
    const e = slots.findIndex(s => s === null); if (e < 0) return { pool, slots };
    const ns = slots.slice(); ns[e] = id;
    return { pool: pool.filter(x => x !== id), slots: ns };
  });
  const down = (ev, id, from) => {
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    const el = ev.currentTarget; const sx = ev.clientX, sy = ev.clientY; let moved = false;
    el.style.transition = 'none'; el.style.zIndex = '9999'; el.style.willChange = 'transform';
    const mv = (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) el.style.transform = `translate(${dx}px,${dy}px) scale(1.06) rotate(-2deg)`;
    };
    const finish = (el2) => { el2.style.zIndex = ''; el2.style.willChange = ''; el2.style.transform = ''; el2.style.transition = ''; };
    const up = (e) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (!moved) { finish(el); if (from === 'pool') tap(id); else toPool(from); return; }
      let t = -1;
      slotRefs.current.forEach((elm, i) => { if (!elm) return; const r = elm.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) t = i; });
      if (t >= 0) { finish(el); place(id, from, t); }
      else if (typeof from === 'number') { finish(el); toPool(from); }
      else { el.style.transition = 'transform .2s cubic-bezier(.34,1.3,.4,1)'; el.style.transform = ''; setTimeout(() => finish(el), 210); }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  return (
    <div className="dd fade-up">
      <div className="dd-slots">
        {slots.map((sid, i) => (
          <div key={i} ref={el => (slotRefs.current[i] = el)} className={`dd-slot ${sid ? 'filled' : ''} ${solved && sid ? 'ok' : ''} ${wrong && sid && sid !== order[i] ? 'bad' : ''}`}>
            <span className="dd-slotn">{i + 1}</span>
            {sid ? <button key={sid} className="dd-chip in" onPointerDown={(e) => down(e, sid, i)}>{byId[sid].label}</button> : <span className="dd-hint">{hints ? hints[i] : 'bu yerga joylang'}</span>}
          </div>
        ))}
      </div>
      <div className="dd-pool">
        {pool.length === 0 && !solved && <span className="dd-pool-empty">Tartib xato — bo'lakni bosib qaytaring va qayta joylang</span>}
        {pool.map(id => <button key={id} className="dd-chip" onPointerDown={(e) => down(e, id, 'pool')}>{byId[id].label}</button>)}
      </div>
      {solved && <div className="dd-done">✓ {doneText || "To'g'ri tartib!"}</div>}
      {wrong && !solved && <div className="dd-wrong">⚠️ Tartib xato — qayta joylang.</div>}
    </div>
  );
}

// ===== SCREEN 0 — HOOK (1 fayl chalkash vs tartibli) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [shaking, setShaking] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const poke = () => { setTried(true); setSc(n => n + 1); clearTimeout(timer.current); setShaking(true); timer.current = setTimeout(() => setShaking(false), 450); };
  const OPTS = [
    { id: 'a', label: "Hammasini yana bitta faylga yozamiz" },
    { id: 'b', label: "Tartibli arxitektura — har narsa o'z joyida" },
    { id: 'c', label: "Loyihani tashlab ketamiz" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext optionalLive disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Katta backend bitta faylga sig'adimi — uni <span className="italic" style={{ color: T.accent }}>boshqarib bo'ladimi</span>?</h1>
        <Mentor>Oldingi modulda hamma narsani bitta faylga yozar edingiz. Loyiha o'sganda u 1000+ qatorli chalkashlikka aylanadi. Quyidagi ulkan fayldan <b style={{ color: T.ink }}>"login" kodini toping</b> — bosib ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <p className="flow-label fade-up delay-1">server.js — 1240 qator 😵</p>
            <div className={`fade-up delay-1 ${shaking ? 'shake' : ''}`}>
              <div className="messy" onClick={poke}>
                <p>{"app.get('/a') app.post('/b') const db = ..."}</p>
                <p>{"function x() ... let token = ... if (role) ..."}</p>
                <p>{"app.put('/c') hash(pw) jwt.sign SELECT * FROM"}</p>
                <p>{"app.delete() cors() bcrypt app.post('/login')"}</p>
                <p>{"const pool = ... try ... catch ... app.get('/d')"}</p>
                <p style={{ color: T.danger }}>{"// login qayerda??? 1000 qator pastda..."}</p>
              </div>
            </div>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Topib bo'lmaydi — hammasi aralash. O'sganda bunaqa kod jamoaga azob!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Katta loyiha o'sib borishi uchun nima kerak?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval ulkan faylni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Professional jamoalar har narsani <b>o'z joyiga</b> qo'yadigan tartibli <b>arxitektura</b> ishlatadi (NestJS). Bugun tayyor shunday loyihani <b>clone qilib</b>, uni tirik ko'ramiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Clone qilib ishga tushiramiz', tag: 'git clone + run' },
    { text: "Swagger'da tirik API ko'ramiz", tag: 'menyu' },
    { text: "Restoran binosini o'rganamiz", tag: 'qaysi papka nima' },
    { text: "Buyurtma yo'lini o'zimiz yig'amiz", tag: '6 bekat' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">Bugun ko'radiganingiz — tirik API</p>
      <Swagger openId={'e1'} onToggle={() => { }} triedIds={new Set(['e1'])} onTry={() => { }} />
    </Col>
  );
  const StepsB = (
    <Col>
      <p className="flow-label">Bugungi 4 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic scrollSignal={showSteps} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Tayyor arxitektura qanday <span className="italic" style={{ color: T.accent }}>ishlaydi</span> — o'zimiz ko'ramiz?</h2></div>
        <Mentor>Bugun kod <b style={{ color: T.ink }}>yozmaymiz</b> — tayyor professional loyihani clone qilib, qanday ishlashini ko'ramiz. Yordamchi g'oya: arxitektura — bu bir <b style={{ color: T.ink }}>restoran</b>. Har xodimning o'z joyi va o'z ishi bor. Dars oxirida bitta so'rovning butun yo'lini tushuntira olasiz.</Mentor>
        {!isNarrow ? <Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — CLONE + INSTALL =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const go = () => { setStep(s => Math.min(s + 1, 2)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="1-qadam · clone" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : '2 qadamni bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi loyihani <span className="italic" style={{ color: T.accent }}>noldan</span> yozamizmi?</h2></div>
        <Mentor>Yo'q! Professional dasturchi tayyor, tekshirilgan <b style={{ color: T.ink }}>loyihani clone qiladi</b>. Ikki buyruq: <span className="mono">git clone</span> (yuklab oladi) va <span className="mono">npm install</span> (kerakli paketlarni o'rnatadi). Tugmani bosib bajaring.</Mentor>
        <Zoomable><Split>
          <Col>
            <Term title="bash" minH={150}>
              <TLine cmd={`git clone ${REPO}`} />
              {step >= 1 && <><TLine out="Cloning into 'IntroNestArxitechture'..." /><TLine out="✓ yuklab olindi" col={CODE.str} /></>}
              {step >= 1 && <TLine cmd="cd IntroNestArxitechture && npm install" />}
              {step >= 2 && <><TLine out="added 412 packages" /><TLine out="✓ paketlar o'rnatildi" col={CODE.str} /></>}
            </Term>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{step === 0 ? '▶ git clone' : (step === 1 ? '▶ npm install' : '✓ Tayyor')}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{fmtCode("`git clone` — GitHub'dagi tayyor loyihani kompyuteringizga ko'chiradi.")}</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{fmtCode("`npm install` — loyiha ishlashi uchun kerakli kutubxonalarni yuklaydi (NestJS, TypeORM...).")}</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Restoran binosi tayyor! Endi bazaga ulab, eshiklarni ochamiz.</p></div>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — .env + RUN =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0);
  const [sc, setSc] = useState(0);
  const done = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const go = () => { setStep(s => Math.min(s + 1, 2)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="1-qadam · ishga tushirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Serverni yoqing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server qaysi <span className="italic" style={{ color: T.accent }}>bazaga</span> ulanishini qayerdan biladi?</h2></div>
        <Mentor>Maxfiy sozlamalar (baza manzili, kalitlar) kodga emas, <span className="mono">.env</span> fayliga yoziladi — bu xavfsiz. Keyin <span className="mono">npm run start:dev</span> serverni yoqadi. Ikki qadamni bajaring.</Mentor>
        <Zoomable><Split>
          <Col>
            {step < 1
              ? <pre className="code-box" style={{ lineHeight: 1.9 }}><Cm>{'# .env  (maxfiy sozlamalar)'}</Cm>{'\n'}{'PORT='}<St>3000</St>{'\n'}{'DEV_DB_URL='}<St>postgres://localhost/nest_db</St>{'\n'}{'Access_Token_Key='}<St>maxfiy_kalit</St></pre>
              : <Term title="bash" minH={120}><TLine cmd="npm run start:dev" />{step >= 2 && <><TLine out="Nest application successfully started" col={CODE.str} /><TLine out="server running on port 3000 ✓" col={CODE.str} /></>}{step < 2 && <TLine out="ishga tushyapti..." />}</Term>}
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={go}>{step === 0 ? '✓ .env to\'ldirildi → run' : (step === 1 ? '▶ npm run start:dev' : '✓ Server ishlayapti')}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{fmtCode("`.env` — maxfiy kalitlar shu yerda. GitHub'ga yuklanmaydi (`.gitignore`).")}</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{fmtCode("`start:dev` — serverni yoqadi va o'zgarishlarni avtomatik kuzatadi.")}</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Restoran ochildi — <span className="mono">localhost:3000</span>! Hozircha bir qator ham yozmadingiz. Endi menyuni ko'ramiz.</p></div>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (scored) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Maxfiy sozlamalar (baza manzili, kalitlar) qayerga yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Maxfiy sozlamalar <span className="italic" style={{ color: T.accent }}>qayerga</span> yoziladi?</h2></>}
    options={["To'g'ridan-to'g'ri kod ichiga", "Alohida `.env` fayli ichiga", "`Swagger` hujjati ichiga", "Loyiha `README` fayli ichiga"]} correctIdx={1}
    explainCorrect="To'g'ri! Maxfiy kalitlar `.env` faylida saqlanadi va `.gitignore` orqali GitHub'ga chiqmaydi — bu xavfsizlik."
    explainWrong={{
      0: "Kodga yozsangiz, GitHub'da hamma ko'radi — xavfli. To'g'risi: `.env`.",
      2: "`Swagger` — menyu (API eshiklari ro'yxati), sozlama joyi emas. To'g'risi: `.env`.",
      3: "`README` — loyihani tanishtiruvchi fayl. Maxfiy sozlamalar `.env`da turadi.",
      default: "Maxfiy sozlamalar = `.env` fayli."
    }} />
);

// ===== SCREEN 5 — SWAGGER (tirik API = menyu) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [openId, setOpenId] = useState(storedAnswer ? 'e1' : null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['e1']) : new Set());
  const [sc, setSc] = useState(0);
  const done = tried.size >= 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  return (
    <Stage eyebrow="2-qadam · Swagger" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Bitta eshikni sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hech narsa yozmadik — <span className="italic" style={{ color: T.accent }}>API qayerda</span>?</h2></div>
        <Mentor><b style={{ color: T.ink }}>Swagger</b> — restoranning <b style={{ color: T.ink }}>menyusi</b>: mijoz ko'radigan barcha eshiklar ro'yxati. Har bir eshikning kod tilidagi nomi — <span className="mono">endpoint</span>: mijoz so'rov yuboradigan manzil. Bittasini ochib, <b style={{ color: T.ink }}>"Try it out"</b> bilan sinab ko'ring — javob keladi.</Mentor>
        <Zoomable><Split>
          <Col>
            <Swagger openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Rangli yorliqlar — <b style={{ color: T.blue }}>GET</b> (o'qish), <b style={{ color: T.success }}>POST</b> (qo'shish), <b style={{ color: T.amber }}>PATCH</b> (o'zgartirish), <b style={{ color: T.danger }}>DELETE</b> (o'chirish).</p></div>
            <div className="real-try"><p className="body" style={{ margin: 0, color: T.ink }}>🌐 <b>Haqiqiy hayotda sinang:</b> o'z kompyuteringizda serverni yoqib, brauzerda <span className="mono">localhost:3000/api/v1</span> ni oching — aynan shu menyuni ko'rasiz.</p></div>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? API <b>tirik</b> — bir qator ham yozmadingiz, lekin to'liq ishlaydigan admin tizimi bor. Endi: bularning hammasi qayerda turibdi?</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Bitta eshikni (endpoint) bosib oching → "Try it out" → javobni ko'ring.</p></div>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — FAYL DARAXTI (restoran binosi) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(TREE.map(t => t.k)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= TREE.length;
  const tap = (k) => { setActive(k); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const cur = TREE.find(t => t.k === active);
  return (
    <Stage eyebrow="3-qadam · bino xaritasi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `Papkalarni oching (${seen.size}/${TREE.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu papkalar nima — <span className="italic" style={{ color: T.accent }}>qayerda nima</span> turadi?</h2></div>
        <Mentor>Loyihaning <span className="mono">src/</span> papkasi — restoran binosining 4 qismi. Har birini bosing: ichida nima borligini va vazifasini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="tree fade-up delay-1">
              <div className="tree-root">📁 src/</div>
              {TREE.map(t => (
                <button key={t.k} className={`tree-row ${active === t.k ? 'on' : ''} ${!seen.has(t.k) ? 'tap-hint' : ''}`} onClick={() => tap(t.k)}>
                  <span className="tree-folder">📁 {t.k}</span>
                  <span className="tree-role">{t.role}</span>
                  <span className="tree-seen" style={{ color: seen.has(t.k) ? T.success : T.ink3 }}>{seen.has(t.k) ? '✓' : ''}</span>
                </button>
              ))}
              <div className="tree-root" style={{ opacity: 0.6 }}>📄 main.ts · config/</div>
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h" style={{ color: T.accent }}>📁 {cur.k} <span style={{ color: T.ink2, fontWeight: 500 }}>· {cur.role}</span></p><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>{cur.d}</p><div className="tree-kids">{cur.kids.map((k, i) => <div key={i} className="tree-kid">📄 {k}</div>)}</div></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Papkani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana bino: <span className="mono">core</span> (ombor zonasi), <span className="mono">api</span> (bo'limlar — zal va oshxona), <span className="mono">infrastructure</span> (umumiy jihozlar), <span className="mono">common</span> (qo'riqchi va qoidalar).</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 (scored) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} idx={7} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Controller (ofitsiant) nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Controller</span> (ofitsiant) <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={["Ma'lumotni omborga o'zi yozadi", "Parolni shifrlaydi (hash qiladi)", "Loyihani ishga tushiradi va kuzatadi", "So'rovni oladi, javobni qaytaradi"]} correctIdx={3}
    explainCorrect="To'g'ri! `Controller` — ofitsiant: so'rovni oladi va javobni qaytaradi. Asosiy ishni `Service` (oshpaz) bajaradi."
    explainWrong={{
      0: "Omborga yozish — omborchi (`Repository`) ishi. Ofitsiant faqat buyurtmani oladi.",
      1: "Parolni shifrlash — oshpaz (`Service`) ishi. Ofitsiant oshxonaga kirmaydi.",
      2: "Ishga tushirish va kuzatish — `npm run start:dev` ishi. `Controller` — so'rovlar eshigi.",
      default: "`Controller` = so'rovni oladi va javob qaytaradi (ofitsiant)."
    }} />
);

// ===== ★ SCREEN 9 — MARKAZIY O'YIN: «BUYURTMA YO'LI» (BEAT 1) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [st, setSt] = useState(() => {
    if (storedAnswer) return { pool: [], slots: ROUTE.slice() };
    const a = ROUTE.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return { pool: a, slots: ROUTE.map(() => null) };
  });
  const { pool, slots } = st;
  const [runs, setRuns] = useState(() => (storedAnswer ? { ok: 1, empty: 1, notoken: 1 } : {}));
  const [walk, setWalk] = useState(null); // { c, i, res, phase: 'walk' | 'crash' | 'done' }
  const [sc, setSc] = useState(0);
  const timer = useRef(null);
  const runningRef = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const slotRefs = useRef([]);
  // ✨ .rz-walk — 📨 token YAGONA element bo'lib yo'lak ustida SURILADI (bekatdan bekatga sakramaydi):
  // pozitsiya bekatlardan o'lchanadi, CSS transition uni bekatlar ORASIDA yurgizadi → bola YO'LNI ko'radi.
  const laneRef = useRef(null);
  const exitRef = useRef(null);
  const [tokXY, setTokXY] = useState(null);
  const [rsz, setRsz] = useState(0);
  useEffect(() => {
    const on = () => setRsz(n => n + 1);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const wI = walk ? walk.i : -1, wPh = walk ? walk.phase : '';
  useLayoutEffect(() => {
    if (!walk || !laneRef.current) { setTokXY(null); return; }
    const target = wPh === 'done' ? exitRef.current : slotRefs.current[wI];
    if (!target) return;
    const lr = laneRef.current.getBoundingClientRect(), tr = target.getBoundingClientRect();
    setTokXY({ x: tr.left - lr.left + tr.width / 2, y: tr.top - lr.top + (wPh === 'done' ? tr.height / 2 : 6) });
  }, [wI, wPh, walk && walk.c.id, rsz]); // eslint-disable-line
  const full = slots.every(s => s !== null);
  const pathOk = slots.every((s, i) => s === ROUTE[i]);
  const doneRuns = Object.keys(runs).length >= CUSTOMERS.length;
  const done = pathOk && doneRuns;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { stage: 'case', screenIdx: screen, question: "Buyurtma yo'lini yig'ing va 3 mijozni kiriting", correct: true, solved: true, picked: true }); }, [done]); // eslint-disable-line

  const place = (id, from, slotIdx) => setSt(({ pool, slots }) => {
    const ns = slots.slice(); const occ = ns[slotIdx];
    if (typeof from === 'number') ns[from] = null;
    ns[slotIdx] = id;
    let np = from === 'pool' ? pool.filter(x => x !== id) : pool.slice();
    if (occ) np = [...np, occ];
    return { pool: np, slots: ns };
  });
  const toPool = (slotIdx) => setSt(({ pool, slots }) => {
    const id = slots[slotIdx]; if (!id) return { pool, slots };
    const ns = slots.slice(); ns[slotIdx] = null;
    return { pool: [...pool, id], slots: ns };
  });
  const tap = (id) => setSt(({ pool, slots }) => {
    const e = slots.findIndex(s => s === null); if (e < 0) return { pool, slots };
    const ns = slots.slice(); ns[e] = id;
    return { pool: pool.filter(x => x !== id), slots: ns };
  });
  // Sudrash — asl kartani DOM transform bilan suramiz (pointer; HTML5 draggable YO'Q → mobil touchda ham ishlaydi)
  const down = (ev, id, from) => {
    if (runningRef.current) return;
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    const el = ev.currentTarget; const sx = ev.clientX, sy = ev.clientY; let moved = false;
    el.style.transition = 'none'; el.style.zIndex = '9999'; el.style.willChange = 'transform';
    const mv = (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) el.style.transform = `translate(${dx}px,${dy}px) scale(1.06) rotate(-2deg)`;
    };
    const finish = (el2) => { el2.style.zIndex = ''; el2.style.willChange = ''; el2.style.transform = ''; el2.style.transition = ''; };
    const up = (e) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      setRuns({}); setWalk(null);
      if (!moved) { finish(el); if (from === 'pool') tap(id); else toPool(from); return; }
      let t = -1;
      slotRefs.current.forEach((elm, i) => { if (!elm) return; const r = elm.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) t = i; });
      if (t >= 0) { finish(el); place(id, from, t); }
      else if (typeof from === 'number') { finish(el); toPool(from); }
      else { el.style.transition = 'transform .2s cubic-bezier(.34,1.3,.4,1)'; el.style.transform = ''; setTimeout(() => finish(el), 210); }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const startRun = (c) => {
    if (!full || runningRef.current) return;
    runningRef.current = true;
    const res = runPath(slots, c);
    const limit = res.at < 0 ? slots.length - 1 : res.at;
    let i = 0;
    setWalk({ c, i: 0, res, phase: 'walk' }); setSc(n => n + 1);
    const tick = () => {
      if (i >= limit) {
        setWalk(w => (w ? { ...w, phase: res.at < 0 ? 'done' : 'crash' } : w));
        setRuns(r => ({ ...r, [c.id]: res.expected ? 1 : 0 }));
        setSc(n => n + 1);
        runningRef.current = false;
        return;
      }
      i++;
      setWalk(w => (w ? { ...w, i } : w));
      timer.current = setTimeout(tick, 720);
    };
    timer.current = setTimeout(tick, 720);
  };

  const navLabel = done ? 'Davom etish' : !full ? `Yo'lakni yig'ing (${slots.filter(Boolean).length}/6)` : !pathOk ? "Tartibni tuzating" : `3 mijozni kiriting (${Object.keys(runs).length}/3)`;
  const crashIdx = walk && walk.phase === 'crash' ? walk.res.at : -1;
  return (
    <Stage eyebrow="Markaziy · buyurtma yo'li" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Buyurtma yo'lini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> tering — mijozni kiriting.</h2></div>
        <Mentor>Bo'sh yo'lakka 6 bekatni <b style={{ color: T.ink }}>sudrab</b> joylashtiring, keyin pastdagi <b style={{ color: T.ink }}>mijoz kartasini</b> (▶) bosing. Buyurtma bekatma-bekat yuradi. Tartib xato bo'lsa — aynan o'sha bekatda yiqiladi. Uchala mijozni ham sinab ko'ring: bir yo'l — uch taqdir.</Mentor>

        <div className="rz-board fade-up delay-1">
          <div className="rz-door">
            <span className="rz-doorman">🙋</span>
            <div className="rz-sign" title="AppModule.imports">🪧 KIRISH TAXTASI<span>Admin bo'limi · Auth bo'limi</span></div>
            <div className="rz-legend">
              {Object.entries(ZONES).map(([z, v]) => (
                <span key={z} className={`rz-zchip z-${z}`}><i /> {v.nm} <em>{v.d}</em></span>
              ))}
            </div>
          </div>
          <div className="rz-lane" ref={laneRef}>
            {slots.map((sid, i) => {
              const s = sid ? ST_BY_K[sid] : null;
              const here = walk && walk.i === i && walk.phase !== 'done';
              const passed = walk && walk.i > i;
              return (
                <div key={i} ref={el => (slotRefs.current[i] = el)} className={`rz-slot ${sid ? `filled z-${s.z}` : ''} ${here ? 'cur' : ''} ${passed ? 'passed' : ''} ${crashIdx === i ? 'rz-crash' : ''}`}>
                  <span className="rz-n">{i + 1}</span>
                  {s
                    ? <button key={sid} className={`rz-card in z-${s.z}`} onPointerDown={(e) => down(e, sid, i)}>
                        <span className="rz-z">{ZONES[s.z].nm}</span>
                        <span className="rz-ico">{s.icon}</span>
                        <span className="rz-nm">{s.name}</span>
                        <span className="rz-code mono">{s.code}</span>
                      </button>
                    : <span className="rz-empty">bo'sh bekat</span>}
                  {crashIdx === i && <span className="rz-shock" />}
                  {crashIdx === i && <span className="rz-code-chip">{walk.res.code}</span>}
                </div>
              );
            })}
            <div ref={exitRef} className={`rz-exit ${walk && walk.phase === 'done' ? 'served' : ''}`}>
              <span className="rz-diner">{walk && walk.phase === 'done' ? '😋' : '🙂'}</span>
              <span className="rz-exit-l">Mijoz</span>
            </div>
            {/* ✨ YAGONA sayohatchi token — yuradi (.rz-walk) → aybdor bekatda yiqiladi (.rz-crash) → lagan bo'lib mijozga uchadi (.rz-tray) */}
            {walk && tokXY && (
              <span key={walk.c.id} className={`rz-tok ${walk.phase === 'done' ? 'rz-tray' : walk.phase === 'crash' ? 'rz-crash' : 'rz-walk'}`}
                style={{ transform: `translate(${tokXY.x}px, ${tokXY.y}px)` }}>
                <span className="rz-tok-i">{walk.phase === 'done' ? '🍽️' : walk.phase === 'crash' ? '💥' : '📨'}</span>
              </span>
            )}
          </div>
          <div className="rz-pool">
            {pool.length === 0
              ? <span className="rz-pool-empty">{pathOk ? "✓ Yo'l to'g'ri terildi" : "Tartib xato bo'lsa — kartani bosib qaytaring"}</span>
              : pool.map(k => {
                const s = ST_BY_K[k];
                return (
                  <button key={k} className={`rz-card tap-hint z-${s.z}`} onPointerDown={(e) => down(e, k, 'pool')}>
                    <span className="rz-z">{ZONES[s.z].nm}</span>
                    <span className="rz-ico">{s.icon}</span>
                    <span className="rz-nm">{s.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="rz-run fade-up delay-2">
          <div className="rz-cust">
            {CUSTOMERS.map(c => {
              const r = runs[c.id];
              return (
                <button key={c.id} className={`rz-cbtn ${r === 1 ? 'ok' : ''} ${r === 0 ? 'bad' : ''}`} disabled={!full} onClick={() => startRun(c)}>
                  <span className="rz-cico">{c.icon}</span>
                  <span className="rz-cl">{c.label}</span>
                  <span className="rz-cr mono">{c.req}</span>
                  <span className="rz-cs">{r === 1 ? '✓' : r === 0 ? '↻' : '▶'}</span>
                </button>
              );
            })}
          </div>
          {walk && walk.phase !== 'walk' && (
            <div className={`${walk.res.expected ? 'frame-success' : 'frame-warn'} fade-step`} key={`${walk.c.id}-${walk.res.code}`}>
              <p className="note-h" style={{ color: walk.res.expected ? T.success : T.danger }}>{walk.res.expected ? '✓' : '✗'} {walk.res.code} — {walk.res.at < 0 ? 'buyurtma yetkazildi' : `${ST_BY_K[slots[walk.res.at]].name} bekatida to'xtadi`}</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>{walk.res.msg}</p>
            </div>
          )}
          {!full && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Avval 6 bekatni yo'lakka joylang — keyin mijozni kiritasiz.</p></div>}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana butun yo'l! Har bekat o'z ishini qiladi — shuning uchun xato aynan qayerda bo'lganini bilib olasiz. Bu — arxitekturaning kuchi.</p></div>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST 3 (scored) =====
const Screen10 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="So'rov serverga kelganda birinchi kimga uchraydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>So'rov <span className="italic" style={{ color: T.accent }}>birinchi</span> kimga uchraydi?</h2></>}
    options={["`Guard` — eshik qo'riqchisi", "`Service` — oshpaz (oshxona)", "`successRes` — bir xil lagan", "`PostgreSQL` — ombor (baza)"]} correctIdx={0}
    explainCorrect="To'g'ri! Avval eshik qo'riqchisi (`Guard`) tekshiradi: token bormi? Faqat o'tgach ofitsiantga boradi. Ruxsat yo'q bo'lsa — 401."
    explainWrong={{
      1: "Oshpaz ishni keyinroq boshlaydi. Eng avval — eshikdagi qo'riqchi.",
      2: "`successRes` — javob idishi, u eng oxirida keladi. Birinchi — qo'riqchi.",
      3: "Ombor — eng oxirgi bekat. Avval eshikda qo'riqchi turadi.",
      default: "Birinchi — `Guard` (eshik qo'riqchisi)."
    }} />
);

// ===== SCREEN 11 — ENTITY (javon chizmasi) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="Tushuncha · Entity" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : "BaseEntity nima berishini ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>Entity</span> — omborning <span className="italic" style={{ color: T.accent }}>javon chizmasi</span>.</h2></div>
        <Mentor>Entity — omborda qanday tokchalar bo'lishini aytadi (qaysi ustunlar bor). Eng zo'r joyi: har entity <span className="mono">BaseEntity</span>'dan <b style={{ color: T.ink }}>meros oladi</b> — ya'ni uning tayyor tokchalari tekinga qo'shiladi: <b style={{ color: T.ink }}>id, created_at, updated_at</b>. Siz faqat o'ziga xos tokchalarni yozasiz.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">admin.entity.ts</p>
            <pre className="code-box" style={{ lineHeight: 1.85 }}>
              <Jx>{'@Entity'}</Jx>{"('admins')"}{'\n'}
              <Jx>{'export class'}</Jx>{' AdminEntity '}<Jx>extends</Jx>{' BaseEntity {'}{'\n'}
              {'  '}<At>@Column</At>{'({ unique: '}<Jx>true</Jx>{' })'}{'\n'}
              {'  username: '}<St>string</St>{';'}{'\n'}
              {'  '}<At>@Column</At>{'()  hashed_password: '}<St>string</St>{';'}{'\n'}
              {'  '}<At>@Column</At>{'()  full_name: '}<St>string</St>{';'}{'\n'}
              {'}'}
            </pre>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? "✓ Ko'rdingiz" : '🎁 BaseEntity nima beradi?'}</button>
          </Col>
          <Col>
            <p className="flow-label">{show ? 'BaseEntity — tayyor keladi' : 'Siz yozasiz'}</p>
            <div className="frame" style={{ padding: 14 }}>
              <div className="ent-row siz">username, hashed_password, full_name <span>← siz yozasiz</span></div>
              {show && <><div className="ent-row free el-in">id (uuid) <span>← BaseEntity</span></div><div className="ent-row free el-in">created_at <span>← BaseEntity</span></div><div className="ent-row free el-in">updated_at <span>← BaseEntity</span></div></>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har javonga kerakli <span className="mono">id</span> va vaqtlar avtomatik chiziladi. Siz faqat o'ziga xos tokchalarni qo'shasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — DTO + NAZORATCHI =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [res, setRes] = useState(storedAnswer ? 'bad' : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['ok', 'bad']) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= 2;
  const send = (kind) => { setRes(kind); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(kind); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="Tushuncha · DTO" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : "To'g'ri va xato so'rovni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>DTO</span> — buyurtma <span className="italic" style={{ color: T.accent }}>anketasi</span>.</h2></div>
        <Mentor>DTO — kelgan ma'lumot qanday bo'lishi <b style={{ color: T.ink }}>kerakligini</b> belgilaydi (<span className="mono">@IsString</span>, <span className="mono">@IsStrongPassword</span>). Anketani <b style={{ color: T.ink }}>nazoratchi</b> (ValidationPipe) tekshiradi: noto'g'ri to'ldirilgan bo'lsa — ichkariga kiritmaydi (400). To'g'ri va xato so'rovni yuboring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">create-admin.dto.ts</p>
            <pre className="code-box" style={{ lineHeight: 1.8 }}>
              <At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()'}{'\n'}
              {'username: '}<St>string</St>{';'}{'\n\n'}
              <At>@IsStrongPassword</At>{'()'}{'\n'}
              {'password: '}<St>string</St>{';'}
            </pre>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`btn-soft ${seen.has('ok') ? '' : 'tap-hint'}`} onClick={() => send('ok')}>✅ To'g'ri: {`{username:'ali', password:'Aa1!xyz'}`}</button>
              <button className={`btn-soft ${seen.has('bad') ? '' : 'tap-hint'}`} onClick={() => send('bad')}>❌ Xato: {`{username:'', password:'123'}`}</button>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Nazoratchi javobi</p>
            {res === 'ok' && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ 201 — qabul qilindi</p><p className="body" style={{ margin: 0, color: T.ink }}>Anketa to'g'ri to'ldirilgan — ichkariga o'tdi.</p></div>}
            {res === 'bad' && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 400 — rad etildi</p><p className="body" style={{ margin: 0, color: T.ink }}>"username bo'sh bo'lmasin", "password kuchli bo'lsin" — qoidalar buzilgan. Omborga umuman bormadi.</p></div>}
            {res === null && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rov yuboring ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>DTO + nazoratchi — ilovani iflos ma'lumotdan himoya qiladi. Yomon anketa oshpazgacha ham yetib bormaydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — BASESERVICE (tayyor retsept kitobi) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FREE = ['create', 'findAll', 'findOneById', 'update', 'remove'];
  const [seen, setSeen] = useState(storedAnswer ? new Set(FREE) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= 3;
  const tap = (m) => { setActive(m); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(m); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const DESC = { create: "yangi qatorni omborga qo'shadi", findAll: "hammasini o'qiydi", findOneById: 'bittasini topadi', update: "o'zgartiradi", remove: "o'chiradi" };
  return (
    <Stage eyebrow="Tushuncha · BaseService" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `Tayyor retseptlarni ko'ring (${Math.min(seen.size, 3)}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Admin CRUD'ni kim yozgan — <span className="italic" style={{ color: T.accent }}>tayyormi</span>?</h2></div>
        <Mentor>Mana arxitekturaning eng kuchli joyi: <span className="mono">BaseService</span> — <b style={{ color: T.ink }}>tayyor retseptlar kitobi</b>. Kodda <span className="mono">extends BaseService</span> deb yozish — «oshpaz shu kitobni qo'liga oladi» degani. U kitobni ochadi va tayyor qadamni bajaradi — qayta o'ylab topmaydi. Retseptlarni bosib ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">📖 BaseService — tayyor retseptlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FREE.map(m => <button key={m} className={`gchip ${!seen.has(m) ? 'tap-hint' : ''}`} onClick={() => tap(m)} style={seen.has(m) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(m) ? '✓ ' : ''}{m}()</button>)}
            </div>
            {active && <div className="sk-info" key={active}><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 13 }}>{active}() — {DESC[active]}</p></div>}
          </Col>
          <Col>
            <pre className="code-box" style={{ lineHeight: 1.8 }}>
              <Jx>export class</Jx>{' AdminService'}{'\n'}
              {'  '}<Jx>extends</Jx>{' BaseService {'}{'\n'}
              {'    '}<Cm>{'// CRUD tayyor keldi!'}</Cm>{'\n'}
              {'    '}<Cm>{'// faqat signIn() ni'}</Cm>{'\n'}
              {'    '}<Cm>{"// o'zingiz qo'shasiz"}</Cm>{'\n'}
              {'}'}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Demak har yangi bo'lim uchun CRUD <b>qayta yozilmaydi</b> — retsept kitobidan keladi. Siz faqat o'ziga xos mantiqni qo'shasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — MODULE + DI (BEAT 2: aktiv shtat jadvali) =====
const STAFF_CHIPS = [
  { k: 'ctrl', icon: '🤵', label: 'AdminController', target: 'controllers' },
  { k: 'svc', icon: '👨‍🍳', label: 'AdminService', target: 'providers' }
];
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [lists, setLists] = useState(() => (storedAnswer ? { controllers: ['ctrl'], providers: ['svc'] } : { controllers: [], providers: [] }));
  const [started, setStarted] = useState(!!storedAnswer);
  const [fail, setFail] = useState(false);
  const [sc, setSc] = useState(0);
  const inList = (k) => lists.controllers.includes(k) || lists.providers.includes(k);
  const hire = (chip) => {
    if (inList(chip.k)) return;
    setLists(l => ({ ...l, [chip.target]: [...l[chip.target], chip.k] }));
    setFail(false); setStarted(false); setSc(n => n + 1);
  };
  const wired = lists.controllers.includes('ctrl') && lists.providers.includes('svc');
  const run = () => { setStarted(true); setFail(!wired); setSc(n => n + 1); };
  const done = started && wired;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="Tushuncha · Module — shtat jadvali" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Smenani boshlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>Module</span> — bo'limning <span className="italic" style={{ color: T.accent }}>shtat jadvali</span>.</h2></div>
        <Mentor>Module — bu bo'limda kim ishlashi yozilgan ro'yxat. Ikki qatorga e'tibor bering: <span className="mono">controllers</span> — ofitsiantlar ro'yxati, <span className="mono">providers</span> — oshxona xodimlari (oshpazlar) ro'yxati. Xodimlarni ro'yxatga qo'shing va <b style={{ color: T.ink }}>▶ Smenani boshlash</b> bosing. Kimnidir yozmasangiz — NestJS uni topa olmaydi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">admin.module.ts — shtat jadvali</p>
            <pre className="code-box" style={{ lineHeight: 1.9 }}>
              <At>@Module</At>{'({'}{'\n'}
              {'  imports: [TypeOrmModule.forFeature([AdminEntity])],'}{'\n'}
              {'  controllers: ['}<St>{lists.controllers.length ? 'AdminController' : ''}</St>{'],'}{'\n'}
              {'  providers: ['}<St>{lists.providers.length ? 'AdminService' : ''}</St>{']'}{!lists.providers.length && <Cm>{'   // bo\'sh!'}</Cm>}{'\n'}
              {'})'}{'\n'}
              <Jx>export class</Jx>{' AdminModule {}'}
            </pre>
            <div className="chips">
              {STAFF_CHIPS.map(c => (
                <button key={c.k} className={`gchip ${inList(c.k) ? '' : 'tap-hint'}`} disabled={inList(c.k)} onClick={() => hire(c)} style={inList(c.k) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{inList(c.k) ? '✓ ' : '+ '}{c.icon} {c.label}</button>
              ))}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={run}>{done ? '✓ Smena ishlayapti' : '▶ Smenani boshlash'}</button>
          </Col>
          <Col>
            <p className="flow-label">NestJS xodimlarni o'zi ulaydi</p>
            <div className="wire">
              <div className={`wire-box z-hall ${lists.controllers.length ? 'on' : ''}`}>🤵 Controller</div>
              <span className={`wire-arr ${done ? 'rz-wire w1 on' : ''}`}>{done ? '✓ chaqiradi →' : '— ?'}</span>
              <div className={`wire-box z-kitch ${lists.providers.length ? 'on' : ''}`}>👨‍🍳 Service</div>
              <span className={`wire-arr ${done ? 'rz-wire w2 on' : ''}`}>{done ? '✓ ishlatadi →' : '— ?'}</span>
              <div className="wire-box z-store">📦 Repository</div>
            </div>
            {started && fail && <Term title="terminal · xato" minH={84}><TLine cmd="npm run start:dev" /><TLine out="✗ Nest can't resolve dependencies of AdminController" col={T.danger} /><TLine out="  Ofitsiant bor, oshpaz shtatda yo'q — kim pishiradi?" col={CODE.comment} /></Term>}
            {done && <>
              <Term title="terminal" minH={84}><TLine cmd="npm run start:dev" /><TLine out="Nest application successfully started" col={CODE.str} /><TLine out="server running on port 3000 ✓" col={CODE.str} /></Term>
              <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz simni <b>o'zingiz tortmadingiz</b> — shtat jadvaliga yozdingiz, NestJS xodimlarni o'zi topib uladi. Buni <b>Dependency Injection</b> deyishadi: «kerakli xodimni o'zi keltirib beradi».</p></div>
            </>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — SIKL (BEAT 3: DragDropOrder) =====
const CYCLE_ITEMS = [
  { id: 'entity', label: '📐 Entity' },
  { id: 'dto', label: '📋 DTO' },
  { id: 'service', label: '👨‍🍳 Service' },
  { id: 'controller', label: '🤵 Controller' },
  { id: 'module', label: '📑 Module' }
];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="Tartib · 5 qadam" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Tartibni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi bo'lim ochsam — <span className="italic" style={{ color: T.accent }}>qaysi tartibda</span> yozaman?</h2></div>
        <Mentor>Keyingi darsda ochadigan bo'limingiz uchun tayyorgarlik. Kartalarni <b style={{ color: T.ink }}>sudrab</b> to'g'ri tartibga qo'ying: avval NIMA saqlanadi, keyin ma'lumot QANDAY kelishi kerak, keyin KIM ishlaydi, keyin QAYSI eshik ochiladi — oxirida shtat jadvali.</Mentor>
        <DragDropOrder
          items={CYCLE_ITEMS}
          hints={["avval NIMA saqlanadi — javon chizmasi", "ma'lumot QANDAY kelishi kerak — anketa", "KIM ishlaydi — oshpaz", "QAYSI eshik — ofitsiant", "shtat jadvali — hammani ro'yxatga oladi"]}
          doneText="To'g'ri: Entity → DTO → Service → Controller → Module."
          onSolved={() => setDone(true)} />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har yangi bo'lim — doim shu <b>5 qadam</b>. Keyingi darsda aynan shu tartib bilan o'z bo'limingizni ochasiz!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — TEST 4 (scored) =====
const Screen16 = (props) => (
  <QuestionScreen {...props} idx={15} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Yangi bo'lim qo'shganda asosan nechta fayl yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yangi bo'lim = <span className="italic" style={{ color: T.accent }}>nechta</span> asosiy fayl?</h2></>}
    options={["1 ta: hamma kod bitta katta faylda turadi", "0 ta: NestJS fayllarni o'zi yozib beradi", "5 ta: har bo'lim uchun bir xil to'plam", "20 ta: har bir vazifaga alohida fayl kerak"]} correctIdx={2}
    explainCorrect="To'g'ri! Har bo'lim — bir xil 5 qadam: `Entity`, `DTO`, `Service` (BaseService'dan), `Controller`, `Module`."
    explainWrong={{
      0: "Bitta faylga yozsak — yana o'sha chalkashlik. Arxitektura buni 5 faylga bo'ladi.",
      1: "Avtomatik emas — 5 faylni siz yozasiz (lekin CRUD `BaseService`'dan tayyor keladi).",
      3: "20 ta emas — asosiy 5 ta fayl yetadi (qolgani tayyor jihozlar).",
      default: "Yangi bo'lim = 5 fayl (Entity, DTO, Service, Controller, Module)."
    }} />
);

// ===== SCREEN 18 — AI BUILDER (buyruq bering → AI 5 faylni yozadi) =====
const BUILD_STEPS = [
  { step: 'Entity', icon: '📐', file: (r) => `${r}.entity.ts` },
  { step: 'DTO', icon: '📋', file: (r) => `create-${r}.dto.ts` },
  { step: 'Service', icon: '👨‍🍳', file: (r) => `${r}.service.ts` },
  { step: 'Controller', icon: '🤵', file: (r) => `${r}.controller.ts` },
  { step: 'Module', icon: '📑', file: (r) => `${r}.module.ts` }
];
const buildCode = (i, R) => {
  const r = R.toLowerCase();
  switch (i) {
    case 0: return <><Jx>@Entity</Jx>{`('${r}s')`}{'\n'}<Jx>export class</Jx>{` ${R}Entity `}<Jx>extends</Jx>{' BaseEntity {'}{'\n'}{'  '}<At>@Column</At>{'()  title: '}<St>string</St>{';'}{'\n'}{'}'}</>;
    case 1: return <><Jx>export class</Jx>{` Create${R}Dto {`}{'\n'}{'  '}<At>@IsString</At>{'()  '}<At>@IsNotEmpty</At>{'()'}{'\n'}{'  title: '}<St>string</St>{';'}{'\n'}{'}'}</>;
    case 2: return <><At>@Injectable</At>{'()'}{'\n'}<Jx>export class</Jx>{` ${R}Service `}<Jx>extends</Jx>{' BaseService {}'}{'\n'}<Cm>{"// CRUD tayyor — retsept kitobidan"}</Cm></>;
    case 3: return <><At>@Controller</At>{`('${r}')`}{'\n'}<Jx>export class</Jx>{` ${R}Controller {}`}</>;
    case 4: return <><At>@Module</At>{'({'}{'\n'}{`  controllers: [${R}Controller],`}{'\n'}{`  providers: [${R}Service],`}{'\n'}{'})'}{'\n'}<Jx>export class</Jx>{` ${R}Module {}`}</>;
    default: return null;
  }
};
const Screen18 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PRESET = ['Task', 'Product', 'Comment'];
  const [name, setName] = useState('');
  const [resName, setResName] = useState(storedAnswer ? (storedAnswer.picked || 'Task') : '');
  const [built, setBuilt] = useState(storedAnswer ? [0, 1, 2, 3, 4] : []);
  const [building, setBuilding] = useState(false);
  const [hint, setHint] = useState('');
  const [sc, setSc] = useState(0);
  const timer = useRef(null);
  const runningRef = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  const done = built.length >= BUILD_STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: resName || 'Task' }); }, [done]); // eslint-disable-line
  const start = (raw) => {
    if (building || runningRef.current) return; // sinxron guard — tez ketma-ket bosishda parallel zanjirlarning oldini oladi
    const clean = (raw || '').trim().replace(/[^a-zA-Z]/g, '');
    if (!clean) { setHint('Bo\'lim nomini lotin harflarda yozing — masalan: Task'); return; }
    runningRef.current = true;
    const R = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    setHint(''); setResName(R); setBuilt([]); setBuilding(true); setSc(n => n + 1);
    let i = 0;
    const tick = () => {
      setBuilt(prev => (prev.length >= BUILD_STEPS.length ? prev : [...prev, i])); setSc(n => n + 1); i++;
      if (i < BUILD_STEPS.length) { timer.current = setTimeout(tick, 620); } else { setBuilding(false); runningRef.current = false; }
    };
    timer.current = setTimeout(tick, 450);
  };
  const reset = () => { clearTimeout(timer.current); runningRef.current = false; setBuilt([]); setBuilding(false); setResName(''); setName(''); setHint(''); };
  const R = resName || 'Task';
  return (
    <Stage eyebrow="Amaliyot · bo'lim quramiz" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'AI 5 faylni yozsin'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Buyruq bering — AI <span className="italic" style={{ color: T.accent }}>5 faylni o'zi yozadi</span>.</h2></div>
        <Mentor>Endi shu 5 qadamni ish holida ko'ramiz. Yangi bo'lim kerakmi (masalan <span className="mono">Task</span>)? Nomini yozing va <b style={{ color: T.ink }}>"Yaratish"</b> bosing — AI o'rgangan tartibimizda <b style={{ color: T.ink }}>Entity → DTO → Service → Controller → Module</b> fayllarini ketma-ket yozadi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">Bo'lim nomini yozing</p>
            <div className="prompt-row">
              <input className="prompt-input" value={name} placeholder="masalan: Task" spellCheck={false} autoCapitalize="off" autoCorrect="off" disabled={building} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') start(name); }} />
              <button className="prompt-btn" onClick={() => start(name)} disabled={building}>Yaratish</button>
            </div>
            <div className="chips">
              {PRESET.map(p => <button key={p} className="gchip" disabled={building} onClick={() => { setName(p); start(p); }}>{p}</button>)}
              {(built.length > 0 || resName) && <button className="gchip" disabled={building} onClick={reset}>↺ Tozalash</button>}
            </div>
            {hint && <p className="hint fade-step">{hint}</p>}
            <div className="gen-steps">
              {BUILD_STEPS.map((s, i) => {
                const okk = built.includes(i);
                const curr = building && built.length === i;
                return <span key={i} className={`gen-step ${okk ? 'on' : ''} ${curr ? 'cur' : ''}`}>{okk ? '✓' : i + 1} {s.step}</span>;
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! <b>{R}</b> bo'limi 5 fayl bilan tayyor — har doim shu 5 qadam. Siz buyruq berdingiz, AI yozdi. Lekin AI har doim 100% to'g'ri yozadimi? Keyingi ekranda tekshiramiz.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">AI yozayotgan fayllar · {R}</p>
            <div className="filestream">
              {built.length === 0 && !building && <p className="fs-empty">Buyruq bering — fayllar shu yerda paydo bo'ladi…</p>}
              {built.map((i, idx) => { const stp = BUILD_STEPS[i]; if (!stp) return null; return (
                <div key={idx} className="fs-file el-in">
                  <div className="fs-name"><span className="fs-ico">{stp.icon}</span>{stp.file(R.toLowerCase())}</div>
                  <pre className="fs-code">{buildCode(i, R)}</pre>
                </div>
              ); })}
              {building && built.length < BUILD_STEPS.length && <p className="gen-line">{BUILD_STEPS[built.length]?.step} yozilmoqda</p>}
            </div>
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — FINAL (BEAT 4): «NOTO'G'RI XONADAGI QATOR» — 1-urinish qotiriladi =====
const CTRL_LINES = [
  { id: 'dec', txt: <><span className="tg">@Post</span>()</> },
  { id: 'sig', txt: <>{'async create(@Body() dto: CreateAdminDto) {'}</> },
  { id: 'hash', txt: <>{'  const hash = await bcrypt.hash(dto.password, 7);'}</>, bug: true },
  { id: 'call', txt: <>{'  return this.adminService.create(dto);'}</> },
  { id: 'end', txt: <>{'}'}</> }
];
const Screen19 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'hash' : null);
  const [wrongId, setWrongId] = useState(null);
  const [moved, setMoved] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const mountTs = useRef(Date.now()); // tezlik: ekran ochilgandan yechimgacha (podiumda teng ballda hal qiladi)
  const dropRef = useRef(null);
  // 📖 Qayta tushuntirish — xato qatorni bosgan o'quvchi mavzuni kartalarda qayta ko'radi
  const [recapOpen, setRecapOpen] = useState(false);
  const found = picked === 'hash';
  const done = moved;
  const pickLine = (id) => {
    if (found) return;
    if (firstCorrectRef.current === null) firstCorrectRef.current = (id === 'hash'); // 1-URINISH QOTIRILADI (soxta correct:true tugadi)
    if (id === 'hash') setPicked('hash');
    else { setWrongId(id); setTimeout(() => setWrongId(w => (w === id ? null : w)), 520); }
    setSc(n => n + 1);
  };
  // Sudrab ko'chirish — noto'g'ri qator o'z faylidan uchib, service fayliga tushadi (.rz-move)
  const down = (ev) => {
    if (!found || moved) return;
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    const el = ev.currentTarget; const sx = ev.clientX, sy = ev.clientY; let mv2 = false;
    el.style.transition = 'none'; el.style.zIndex = '9999';
    const mv = (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!mv2 && Math.abs(dx) + Math.abs(dy) > 5) mv2 = true;
      if (mv2) el.style.transform = `translate(${dx}px,${dy}px) scale(1.04)`;
    };
    const up = (e) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      el.style.zIndex = ''; el.style.transform = ''; el.style.transition = '';
      const z = dropRef.current;
      if (z) { const r = z.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { setMoved(true); setSc(n => n + 1); } }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  // ⚡ JONLI BALL: picked = 0 (1-urinishda to'g'ri qatorni topdi) yoki 1 (avval xato qatorni bosdi).
  // INLINE_KEYS.s19 = 0 → serverda `picked === 0` bo'lgani to'g'ri sanaladi (soxta «hamma to'g'ri» yo'q).
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { stage: 'final', screenIdx: screen, question: "AI qaysi qatorni noto'g'ri xonaga qo'ydi?", studentAnswer: picked, correct: firstCorrectRef.current === true, firstAttemptCorrect: firstCorrectRef.current === true, solved: true, picked: firstCorrectRef.current === true ? 0 : 1, elapsedMs: Date.now() - mountTs.current }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="Yakuniy · debugging" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? "Qatorni to'g'ri faylga sudrang" : 'Xato qatorni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI bitta qatorni <span className="italic" style={{ color: T.accent }}>noto'g'ri xonaga</span> qo'ydi.</h2></div>
        <Mentor>Ofitsiant oshxonaga kirib, taomni o'zi pishiryapti — bu restoran emas, tartibsizlik. <b style={{ color: T.ink }}>Qaysi qator ofitsiantning ishi emas?</b> Uni toping va to'g'ri faylga <b style={{ color: T.ink }}>sudrang</b>. Diqqat: birinchi urinish hisobga olinadi.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="ai-card">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana, Admin bo'limi tayyor!</span></div>
              <p className="flow-label">🤵 admin.controller.ts</p>
              <div className="ai-code">
                {CTRL_LINES.map(l => {
                  if (l.id === 'hash' && moved) return null;
                  const isBug = found && l.id === 'hash';
                  return (
                    <div key={l.id}
                      className={`ai-line ${isBug ? 'bad rz-move' : ''} ${wrongId === l.id ? 'shake' : ''} ${isBug ? 'grabbable' : ''}`}
                      onPointerDown={isBug ? down : undefined}
                      onClick={() => pickLine(l.id)}>
                      {l.txt}
                      {isBug && <span className="ai-tag-empty"> ← bu ofitsiantning ishi emas · sudrang</span>}
                    </div>
                  );
                })}
                {moved && <div className="ai-line ok">{'  return this.adminService.create(dto);'}</div>}
              </div>
              {!found && <p className="ai-prompt">Qaysi qator noto'g'ri xonada? Bosing.</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">👨‍🍳 admin.service.ts</p>
            <div ref={dropRef} className={`rz-drop ${found && !moved ? 'hot' : ''} ${moved ? 'filled' : ''}`}>
              <div className="ai-code" style={{ boxShadow: 'none' }}>
                <div className="ai-line"><span className="tg">@Injectable</span>()</div>
                <div className="ai-line">{'async create(dto: CreateAdminDto) {'}</div>
                {moved
                  ? <div className="ai-line ok rz-move">{'  const hash = await bcrypt.hash(dto.password, 7);'}</div>
                  : <div className="ai-line dashed">{found ? '  ← qatorni shu yerga sudrang' : '  ...'}</div>}
                <div className="ai-line">{'  return this.repo.save({ ...dto, hashed_password: hash });'}</div>
                <div className="ai-line">{'}'}</div>
              </div>
              {moved && <span className="rz-stamp">✓</span>}
            </div>
            {!found && (picked === null && wrongId === null
              ? <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Ofitsiant faqat buyurtmani oladi va javobni qaytaradi. Parolni shifrlash — oshpazning ishi.</p></div>
              : <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator o'z joyida. Eslang: <span className="mono">bcrypt.hash()</span> — asosiy ish, ya'ni oshpaz (Service) ishi.</p></div>)}
            {found && !moved && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator <span className="mono">admin.service.ts</span> ichida turishi kerak. Uni o'ng tomondagi faylga sudrab o'tkazing →</p></div>}
            {moved && <>
              <Term title="terminal" minH={70}><TLine cmd="npm run start:dev" /><TLine out="server running on port 3000 ✓" col={CODE.str} /></Term>
              <div className="takeaway fade-step"><div className="ta-bulb">🧲</div><p className="ta-h">Har ish — o'z xonasida!</p><p className="ta-sub">AI tez yozadi, siz joyiga qo'yasiz — zo'r jamoa</p></div>
              {firstCorrectRef.current === false && RECAPS[screen] && (
                <button className="rc-open-mini" onClick={() => setRecapOpen(true)}>📖 Qisqa takrorlash — mavzuni yana bir ko'rish</button>
              )}
            </>}
          </Col>
        </div></Zoomable>
        {recapOpen && RECAPS[screen] && <RecapOverlay screenIdx={screen} onClose={() => setRecapOpen(false)} />}
      </div>
    </Stage>
  );
};


// ===== 🏅 BADGES (nishonlar) — faqat REAL bosqichlar uchun (tekin emas) =====
const ACHIEVEMENTS = {
  secretKeeper: { icon: '🔐', name: 'Secret Keeper', desc: "Maxfiy kalitlar joyini bilib oldingiz" },
  fullFlow:     { icon: '🔥', name: 'Full Flow',     desc: "Buyurtma yo'lini yig'ib, 3 mijozni ham oxirigacha olib bordingiz" },
  fiveSteps:    { icon: '🧩', name: 'Five Steps',    desc: "Yangi bo'limning 5 qadamini aniqladingiz" },
  rightPlace:   { icon: '🧲', name: 'Right Place',   desc: "Noto'g'ri xonadagi qatorni 1-urinishda topdingiz" },
};
// Ekran id → nishon. ❗ FAQAT ma'noli ekranlar: s4/s10/s16 (SCORED test) · s9 (markaziy o'yin — 3 mijoz to'g'ri) · s19 (real debug, 1-urinish).
// Passiv exploration ekranlariga (s2,s3,s5,s6,s11..s15,s18) BOG'LANMAYDI — aks holda nishon tekin beriladi.
const ACH_TRIGGERS = { s4: 'secretKeeper', s9: 'fullFlow', s16: 'fiveSteps', s19: 'rightPlace' };

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
// Navbatda bittasi ko'rsatiladi — tugagach keyingisi chiqadi
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


// Podium savol yorliqlari (SCORED_IDX indekslariga mos: 4, 7, 9, 15, 17)
const Q_LABELS = { 4: '1 — .env', 7: '2 — Controller', 9: "3 — Qo'riqchi", 15: '4 — 5 fayl', 17: '5 — Debug' };
const QUIZ_MS = 15000;
// Kapsula ichida suzuvchi tokenlar — darsning "DNK"si (Nest atamalari)
const QZ_BG_SHAPES = [
  { ch: '{',           l: 5,  t: 10, s: 32, d: 19, dl: 0 },
  { ch: '}',           l: 85, t: 8,  s: 32, d: 23, dl: 1.5 },
  { ch: '@Get',        l: 8,  t: 72, s: 26, d: 27, dl: 0.8 },
  { ch: '@Post',       l: 76, t: 68, s: 26, d: 21, dl: 2.2 },
  { ch: '@Module',     l: 45, t: 86, s: 24, d: 25, dl: 1.1 },
  { ch: 'guard',       l: 66, t: 26, s: 26, d: 17, dl: 0.4 },
  { ch: 'providers',   l: 26, t: 34, s: 22, d: 20, dl: 1.9 },
  { ch: '.env',        l: 55, t: 5,  s: 26, d: 22, dl: 0.6 },
  { ch: '401',         l: 91, t: 42, s: 26, d: 24, dl: 1.3 },
  { ch: '201',         l: 16, t: 52, s: 26, d: 26, dl: 2.6 },
  { ch: 'start:dev',   l: 34, t: 62, s: 20, d: 29, dl: 3.4 },
  { ch: 'DTO',         l: 2,  t: 30, s: 26, d: 28, dl: 3.1 },
  { ch: '@Injectable', l: 60, t: 90, s: 20, d: 31, dl: 4.2 },
  { ch: '500',         l: 20, t: 16, s: 22, d: 18, dl: 2.9 },
];
// ⚡ Mustahkamlash-jang savollari — to'g'ri javoblar 4 pozitsiyaga TENG (12 savol: 3/3/3/3, mexanik ketma-ketlik yo'q).
// 🎓 Metodist: savol matni va variant uzunliklari sayqallanadi · ⚡ Jonli: `correct` qiymatlari INLINE_KEYS bilan sinxron tekshiriladi.
const QUIZ_BANK = [
  { q: "`Controller` restoranda kim?", opts: ["Oshpaz — asosiy ishni oshxonada bajaradi", "Ofitsiant — so'rov oladi, javob beradi", "Omborchi — javonga o'zi olib qo'yadi", "Qo'riqchi — eshikda tokenni tekshiradi"], correct: 1 },
  { q: "Tokensiz mijoz qanday javob oladi?", opts: ["`200` — hammasi joyida", "`201` — yangi yozuv yaratildi", "`500` — serverda ichki xato", "`401` — ruxsat berilmadi"], correct: 3 },
  { q: "`Service` nima qiladi?", opts: ["Asosiy ishni bajaradi — oshpaz", "Papkalarni tartibga solib turadi", "Serverni yoqib, kuzatib turadi", "Sahifani brauzerda chizadi"], correct: 0 },
  { q: "`DTO` — bu nima?", opts: ["Ombordagi javonning chizmasi — tokchalar", "Server ishlaydigan portning raqami", "Buyurtma anketasi — ma'lumot qoidalari", "Loyihaning GitHub'dagi rasmiy nomi"], correct: 2 },
  { q: "`@Module` ichidagi `providers` nimani bildiradi?", opts: ["Loyihaning GitHub'dagi nomini", "Bazaga ulanish uchun parolni", "Loyiha fayllarining umumiy hajmini", "Bu bo'limdagi xodimlar ro'yxatini"], correct: 3 },
  { q: "`npm run start:dev` nima qiladi?", opts: ["Serverni yoqadi va kuzatib turadi", "Loyihani GitHub'ga yuklab qo'yadi", "Ombordagi hamma ma'lumotni o'chiradi", "Yangi bo'limning fayllarini yozadi"], correct: 0 },
  { q: "Anketa xato to'ldirilsa qaysi kod qaytadi?", opts: ["`201` — yozuv yaratildi", "`401` — ruxsat berilmadi", "`400` — anketa noto'g'ri", "`200` — hammasi joyida"], correct: 2 },
  { q: "`Entity` nimani belgilaydi?", opts: ["Sahifadagi ranglar palitrasini", "Ombordagi tokchalar ro'yxatini", "Serverning ishlash tezligini", "Ofitsiantning ish jadvali va vaqtini"], correct: 1 },
  { q: "`git clone` nima qiladi?", opts: ["Tayyor loyihani kompyuterga oladi", "Loyihani butunlay o'chirib tashlaydi", "Omborni ma'lumot bilan to'ldiradi", "Ishlab turgan serverni to'xtatadi"], correct: 0 },
  { q: "`Swagger` — bu nima?", opts: ["Ombordagi javonning chizmasi", "Maxfiy kalitlar saqlanadigan fayl", "Menyu — API eshiklari ro'yxati", "Parolni shifrlaydigan vosita"], correct: 2 },
  { q: "Yangi bo'lim qo'shishning to'g'ri tartibi qaysi?", opts: ["Module → Controller → Service → DTO → Entity", "Controller → Module → Entity → DTO → Service", "Service → Entity → Module → Controller → DTO", "Entity → DTO → Service → Controller → Module"], correct: 3 },
  { q: "`successRes` nima uchun kerak?", opts: ["Xato xabarlarini mijozdan yashirish uchun", "Har javob bir xil shaklda chiqishi uchun", "Serverning ishini tezlashtirish uchun", "Parolni omborda shifrlab saqlash uchun"], correct: 1 },
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
// ===== ⚡ MUSTAHKAMLASH-JANG (Kahoot arena) — signal zonasi: 100+ (test <100, praktika 500+ bilan to'qnashmaydi) =====
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#FF5A2C', '#0FA6D6', '#F5A623', '#22A05C']; // CodeStrike palitrasi: coral · ocean · sun · leaf
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
const quizPts = (elapsedMs) => elapsedMs <= 500 ? 1000 : Math.max(0, Math.round(1000 * (1 - (Math.min(elapsedMs, QUIZ_MS) / QUIZ_MS) / 2)));
// Bitta o'yinchining barcha javoblaridan yakuniy hisob (hamma klientda bir xil chiqadi)
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

// Aylana taymer — vaqt kamaygani sari yashil → sariq → qizil
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

// Jonli fon: suzuvchi uchqunlar + «web» chiziqlari + kod tokenlari (canvas)
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
    // Arena tokenlari — SHU darsning mavzusidan (Nest): dekorativ suzuvchi kod-bo'laklari
    const TOK = ['{ }', '@Get', '@Post', '@Module', 'providers', 'guard', 'DTO', '201', '401', 'start:dev'];
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
  const [myAnswers, setMyAnswers] = useState({}); // {qi: {picked, correct, elapsed}}
  const [players, setPlayers] = useState([]);
  const [qRows, setQRows] = useState([]);
  const [answeredN, setAnsweredN] = useState(0);
  const [classEnded, setClassEnded] = useState(false);
  const seenQRef = useRef(-1);
  const qStartRef = useRef(0);
  const deadlineRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // O'quvchi sahifani yangilagan bo'lsa — o'z javoblarini serverdan tiklaymiz
  useEffect(() => {
    if (!isStudent || solo || !live.playerId) return;
    liveQuizAnswers(live.pin).then(rows => {
      const mine = {};
      rows.filter(r => r.player_id === live.playerId).forEach(r => { mine[r.screen_idx - QUIZ_BASE_IDX] = { picked: r.picked, correct: r.correct, elapsed: r.elapsed_ms }; });
      setMyAnswers(m => ({ ...mine, ...m }));
    }).catch(() => {});
  }, []); // eslint-disable-line

  // Jonli sinxron: 1.2s polling — savol/natija/yakun fazalari serverdan keladi.
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

  // Taymer — 100ms; vaqt tugasa javob ochiladi. MENTOR serverni ham 'r' ga o'tkazadi.
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
          <span key={i} className="qz-shp" style={{ left: `${s.l}%`, top: `${s.t}%`, fontSize: s.s, color: s.c, animationDuration: `${s.d}s`, animationDelay: `${s.dl}s` }}>{s.ch}</span>
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

// ===== 🏆 PODIUM / STATISTIKA — jonli reyting (jonli-ulanishni ⚡ Jonli qiladi; self-mode fallback tayyor) =====
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

// ===== 🛠️ JONLI PRAKTIKA (reusable) — o'quvchi VS Code'da bajaradi, ustoz kuzatadi =====
// signal zonasi: <100 test · 100+ arena · 500+ praktika (to'qnashmaydi).
const PRACTICE_BASE = 500;
// Mentor ko'rinishi sloti — "kim bajardi" jonli chiplar paneli. JONLI roli to'ldiradi.
const MentorPracticeStats = ({ live, screen }) => {
  const [data, setData] = useState({ players: null, doneIds: new Set() });
  useEffect(() => {
    if (!live || live.mode !== 'mentor' || !live.pin) return;
    let on = true, t = null;
    const tick = async () => {
      try {
        // Praktika signali 500+ zonasida (test <100, arena 100+ bilan to'qnashmaydi)
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
  // JONLI: mentor keyingi sahifaga o'tmaguncha NavNext qulf bo'ladi (optionalLive + LiveGateCtx gate). Hozircha done bo'lsa ochiq.
  const audio = useAudio([{ id: `practice_${screen}`, text: `Endi navbat sizda — bu topshiriqni o'z kompyuteringizda, VS Code'da bajarasiz. Loyihani clone qiling, serverni yoqing va Swagger menyusida bitta eshikni sinab ko'ring. So'ng bitta so'rovning butun yo'lini o'z so'zingiz bilan aytib bering. Har bosqichni bajarib, belgilab boring. Tugagach «Bajardim» tugmasini bosing — ustoz kuzatib turadi.`, trigger: 'on_mount', waits_for: null }]);
  return (
    <Stage eyebrow="Amaliyot · VS Code" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Avval bajaring'} onClick={onNext} /></>}>
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

function Flashcards({ cards }) {
  const [queue, setQueue] = useState(() => cards.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [exiting, setExiting] = useState(null); // 'knew' | 'again' — karta uchib chiqish animatsiyasi
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

// 🛠️ PRAKTIKA — 4a backend: HtmlCompiler YO'Q, o'quvchi VS Code'da bajaradi (mentor-gate)
const ScreenNestPractice = (props) => (
  <ScreenLivePractice {...props}
    title="Restoranni o'z kompyuteringizda oching"
    task="Loyihani clone qilib ishga tushiring, Swagger menyusida bitta eshikni sinang va bitta so'rovning yo'lini o'z so'zingiz bilan aytib bering: mijoz qaysi bekatlardan o'tadi?"
    checklist={[
      "Repo'ni clone qiling: `git clone` + `npm install`",
      "`.env` faylini to'ldiring va `npm run start:dev` bilan serverni yoqing",
      "Brauzerda `localhost:3000/api/v1` — Swagger menyusini oching",
      "Bitta endpointni `Try it out` bilan sinang va javobni ko'ring",
      "Yoningizdagi do'stingizga `POST /admin` yo'lini aytib bering: qo'riqchi → ofitsiant → nazoratchi → oshpaz → ombor → lagan",
    ]} />
);

// 🃏 FLASHCARD KARTALARI — 12 atama (eski summary GLOSSARY'sidan ko'chdi; orqa tomon = restoran tili)
const NEST_FLASHCARDS = [
  { front: "Tayyor loyihani kompyuterga ko'chirish buyrug'i", back: 'git clone', note: "noldan yozmaymiz" },
  { front: "Menyu — API eshiklari ro'yxati", back: 'Swagger', note: "localhost:3000/api/v1" },
  { front: "So'rovni oladi, javobni qaytaradi", back: 'Controller', note: "🤵 ofitsiant" },
  { front: "Kelgan ma'lumot qanday bo'lishi kerak", back: 'DTO', note: "📋 buyurtma anketasi" },
  { front: "Anketa to'g'ri to'ldirilganmi — tekshiradi", back: 'ValidationPipe', note: "🧐 nazoratchi · 400" },
  { front: "Asosiy ishni bajaradi: parolni shifrlaydi", back: 'Service', note: "👨‍🍳 oshpaz" },
  { front: "Tayyor CRUD qadamlari bir marta yozilgan", back: 'BaseService', note: "📖 retsept kitobi" },
  { front: "Omborda qaysi tokchalar bo'lishini aytadi", back: 'Entity', note: "📐 javon chizmasi" },
  { front: "Oshpaz aytadi — u ma'lumotni javonga qo'yadi", back: 'Repository + PostgreSQL', note: "📦 omborchi + 🗄️ ombor" },
  { front: "Bu bo'limda kim ishlashi yozilgan ro'yxat", back: 'Module', note: "📑 shtat jadvali" },
  { front: "Klub kartasi (token) bormi — eshikda tekshiradi", back: 'Guard', note: "🛡️ qo'riqchi · 401" },
  { front: "Har javob bir xil shaklda chiqadi", back: 'successRes', note: "🍽️ bir xil lagan" },
];
const ScreenFlashcards = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []); // eslint-disable-line
  return (
    <Stage eyebrow="Takrorlash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={false} label="Yakunlash →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Restoran atamalarini <span className="italic" style={{ color: T.accent }}>tez takrorlaymiz</span>.</h2></div>
        <Mentor>Darsni yakunlashdan oldin bugungi atamalarni takrorlaymiz. Har kartada bir topishmoq — <b style={{ color: T.ink }}>qaysi atama</b> ekanini o'ylang, keyin kartani bosib tekshiring. <b style={{ color: T.ink }}>Bildim</b> yoki <b style={{ color: T.ink }}>Takrorlash</b> bilan baholang.</Mentor>
        <div className="fc-center"><Flashcards cards={NEST_FLASHCARDS} /></div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 20 — YAKUN (4.2: ScoreRing + CodeStrike CTA + RECAP/Uyga vazifa + 🏅 kolleksiya) =====
const Screen20 = ({ screen, answers, achievements, onReset, onPrev, onFinish }) => {
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
    "Professional loyiha clone qilinadi (noldan yozilmaydi)",
    "Swagger — restoran menyusi: barcha eshiklar ro'yxati",
    "Bino: core (ombor zonasi) · api (bo'limlar) · infrastructure (jihozlar) · common (qo'riqchi)",
    "Buyurtma yo'li: qo'riqchi → ofitsiant → nazoratchi → oshpaz → ombor → bir xil lagan",
    "Yangi bo'lim = 5 qadam: Entity → DTO → Service → Controller → Module"
  ];
  const HOMEWORK = [
    { b: "Repo'ni oching", t: "— github.com/Azizbekcrypto/IntroNestArxitechture — papkalarni ko'zdan kechiring" },
    { b: 'Restoran', t: "— har papkani restoran bo'limiga moslab ayting" },
    { b: "So'rov yo'li", t: "— bitta endpoint uchun buyurtma yo'lini o'z so'zingiz bilan tushuntiring" }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Modulni yakunlash →</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Arxitekturani tirik ko'rdingiz</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>kim qayerda turishini</span> bilasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Tayyor loyihani clone qildingiz, menyuni ko'rdingiz va buyurtma yo'lini o'zingiz yig'dingiz." : "Yaxshi harakat! Buyurtma yo'li va bino xaritasini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className={`qz-cta cs-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <CsWordmark stats={false} liveOn={studentLive} disabled={studentWait} onClick={studentWait ? undefined : openArena} hint={studentWait ? '⏳ Mentorni kuting' : undefined} />
        </div>
        {arena && <QuizArena live={_live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi darsda — restoranga o'z bo'limingizni ochasiz: Entity → DTO → Service → Controller → Module!</p></div>
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
export default function NestArchAliveLesson({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());
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
  // ETALON — 1920px (InternetLesson): keng oynada proportsional kattalashadi, <=1920 da z=1
  useEffect(() => {
    const upd = () => { const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920)); document.documentElement.style.setProperty('--lz', String(Math.round(z * 1000) / 1000)); };
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, []);
  // Javob kaliti: inline testlar + jang savollari (QUIZ_BANK'dan) — mentor ochganda set_quiz_keys bilan serverga yuklanadi
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
    if (_m && ACH_TRIGGERS[_m.id] && data && data.correct) earn(ACH_TRIGGERS[_m.id]); // 🏅 nishon (faqat REAL solve)
    // Yakuniy debug-gate (s19) — XATO javob ham serverga ketadi (aks holda xato qilgan o'quvchi podiumda umuman ko'rinmaydi).
    // picked: 0 = 1-urinishda topdi · 1 = avval xato bosdi. To'g'rilikni server INLINE_KEYS.s19 (=0) bilan o'zi hisoblaydi.
    if (_m && _m.scored && _m.scope === 'final' && data && data.solved && live.mode === 'student') live.submitAnswer(idx, _m.id, data.picked ?? 1, !!data.correct, data.elapsedMs || 0);
  };
  const reset = () => { setAnswers({}); setScreen(0); startTimeRef.current = Date.now(); };

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

  // SCREEN_META bilan 1:1 (22 ekran) — M8: eski s7/s17 o'chirilgan, Praktika+Podium+Flashcards qo'shilgan
  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen18, Screen19, ScreenNestPractice, ScreenPodium, ScreenFlashcards, Screen20];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        /* PRODUCTION: shu @import OLIB TASHLANADI — shriftlarni LMS yuklaydi (platform_contract). */
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
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === MENTOR === */
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
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI (radio) === */
        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
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

        /* === STAGE === */
        .stage { max-width: 1100px; margin: 0 auto; height: calc(100dvh / var(--lz, 1)); display: flex; flex-direction: column; }
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
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        /* frame-warn — FAQAT haqiqiy xato/yiqilish (401/400/500, noto'g'ri tanlov): dangerSoft, yo'lakdagi rz-crash bilan bir tilda */
        .frame-warn { background: ${T.dangerSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 6px 16px -8px rgba(194,54,43,0.22); }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr !important; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === YAKUN === */
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

        /* === 4-MODUL: KOD QUTISI === */
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        /* === JSON KO'RINISHI === */

        /* === MA'LUMOT JADVALI === */

        /* === SXEMA JADVAL-KARTOCHKASI === */

        /* === BOG'LANISH TUGMASI (s10) === */

        /* === TANLASH QATORI (s13) === */

        /* === YAKUNIY SXEMA KANVAS (s15) === */

        /* === Instagram POST KARTOCHKASI === */

        /* MOBIL: yig'iladigan Mentor */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }
        /* === 🛠️ JONLI PRAKTIKA (VS Code-uslub, self-report) === */
        .lp-task { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 9px; border-left: 4px solid ${T.accent}; }
        .lp-task-h { display: flex; align-items: center; gap: 8px; }
        .lp-task-badge { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 10.5px; letter-spacing: 0.12em; color: #fff; background: ${T.accent}; padding: 3px 9px; border-radius: 6px; }
        .lp-steps { display: flex; flex-direction: column; gap: 8px; }
        .lp-step { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 13px; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; cursor: pointer; transition: all 0.16s; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); }
        .lp-step:hover:not(.on) { box-shadow: 0 8px 18px -7px rgba(${T.shadowBase},0.24); }
        .lp-step.on { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}55; }
        .lp-check { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; background: ${T.bg}; color: ${T.ink3}; box-shadow: inset 0 0 0 1.5px ${T.ink3}55; transition: all 0.16s; }
        .lp-step.on .lp-check { background: ${T.success}; color: #fff; box-shadow: none; animation: lp-check-pop 0.34s cubic-bezier(.3,1.5,.5,1); }
        @keyframes lp-check-pop { 0% { transform: scale(0.7); } 45% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .lp-step-t { flex: 1; min-width: 0; }
        .lp-done-btn { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(14px,1.8vw,16px); cursor: pointer; border: none; border-radius: 13px; padding: 14px 20px; background: ${T.ink}; color: ${T.bg}; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.34); transition: all 0.18s; margin-top: 2px; }
        .lp-done-btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.5); }
        .lp-done-btn.is-done { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}66; cursor: default; animation: lp-done-pop 0.44s cubic-bezier(.3,1.35,.5,1); }
        @keyframes lp-done-pop { 0% { transform: scale(1); } 32% { transform: scale(1.05) translateY(-2px); } 60% { transform: scale(0.98); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .lp-step.on .lp-check, .lp-done-btn.is-done { animation: none !important; } }
        .lp-mstats { background: ${T.blueSoft}; border-radius: 12px; padding: 13px 15px; display: flex; flex-direction: column; gap: 6px; }

        /* === 🃏 FLASHCARDS (reusable, 3D flip) === */
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
        .fc-btn.again:hover { border-color: ${T.accent}; background: ${T.accentSoft}; }
        .fc-btn:disabled { opacity: 0.55; cursor: default; transform: none; }
        .fc-btn.ghost { background: ${T.paper}; border: 1.5px solid ${T.line}; color: ${T.ink}; flex: none; align-self: center; padding: 11px 22px; }
        .fc-hint { margin: 0; text-align: center; color: ${T.ink3}; font-style: italic; font-size: 13px; }
        .fc-done { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; background: ${T.successSoft}; border-radius: 18px; padding: 22px; max-width: 480px; }
        .fc-done-emoji { font-size: 40px; }
        .fc-done-h { font-family: 'Manrope'; font-weight: 800; font-size: 20px; color: ${T.success}; margin: 0; }
        .fc-done-s { font-family: 'Manrope'; color: ${T.ink2}; margin: 0 0 8px; font-size: 14px; }

        /* === 🔤 KOD-ATAMA CHIP (fmtCode) === */
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }

        /* === 🏅 ACHIEVEMENTS — hisoblagich + to'liq-ekran bayram === */
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

        /* === Konfetti (yakun bayrami) === */
        .confetti { position: fixed; inset: 0; pointer-events: none; z-index: 1200; overflow: hidden; }
        .confetti-bit { position: absolute; top: -24px; opacity: 0; will-change: transform, opacity; animation-name: confetti-fall; animation-timing-function: cubic-bezier(.25,.6,.45,1); animation-iteration-count: 1; animation-fill-mode: forwards; box-shadow: 0 2px 6px -2px rgba(${T.shadowBase},0.3); }
        @keyframes confetti-fall { 0% { transform: translateY(-24px) rotate(0deg); opacity: 0; } 8% { opacity: 1; } 55% { transform: translateY(48vh) translateX(22px) rotate(320deg); } 100% { transform: translateY(104vh) translateX(-12px) rotate(680deg); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .confetti { display: none; } }

        /* === 🏆 PODIUM / STATISTIKA SAHIFASI === */
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
        .pod-my b { color: ${T.success}; } /* 11.16: o'quvchining O'Z natijasi YASHIL (qizil faqat xato javob uchun) */
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

        /* === ⚡ CODE STRIKE — CTA neon-kapsula (arena STRUKTURASI ⚡ Jonliniki) === */
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
        .cs-word { position: relative; z-index: 2; display: inline-block; font-family: 'Manrope','Manrope Fallback',sans-serif; font-weight: 900; font-style: italic; font-size: clamp(30px,6.2vw,72px); letter-spacing: .015em; line-height: 1.06; white-space: nowrap; padding-right: .06em; background: linear-gradient(180deg,#FFFFFF 10%,#E4D6FF 46%,#A97CFF 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; animation: cs-wglow 2.8s ease-in-out infinite; }
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
        .cs-clickable:focus-visible { outline: 2px dashed rgba(186,140,255,.8); outline-offset: 6px; }
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
        /* ===== ⚡ JONLI QATLAM CSS (Kahoot-kutish · MentorTestStats · CodeStrike arena · qcode-chip) — L1 etalondan ===== */
        /* --- Kahoot-kutish holatlari (jonli test) --- */
        /* option-wait (jonli test kutish holati) */
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; }
        /* frame-wait (feedback kutish) */
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }

        /* === MENTOR STATISTIKASI (jonli test + yozma ish panellari) === */
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
        .mstats-chip.okc  { background: ${T.successSoft}; } .mstats-chip.okc .mstats-chip-n, .mstats-chip.okc .mstats-chip-t { color: ${T.success}; }
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
        /* Verdikt + recap tugmalari */
        .mstats-verdict { border-radius: 12px; padding: 12px 15px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; animation: fade-step 0.3s ease-out; }
        .mstats-verdict.need { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; }
        .mstats-verdict.maybe { background: rgba(232,161,58,0.14); border-left: 4px solid #E8A13A; }
        .mstats-verdict.good { background: ${T.successSoft}; border-left: 4px solid ${T.success}; }
        .mstats-verdict.few { background: rgba(167,166,162,0.12); border-left: 4px solid ${T.ink3}; }
        .mstats-verdict-t { margin: 0; font-family: 'Manrope', sans-serif; font-size: clamp(13px,1.6vw,15px); line-height: 1.45; color: ${T.ink}; }
        .rc-open { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.6vw,15px); background: ${T.accent}; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(255,79,40,0.5); transition: all 0.2s; }
        .rc-open:hover { transform: translateY(-1px); box-shadow: 0 12px 26px -6px rgba(255,79,40,0.55); }
        .rc-open.soft { background: ${T.paper}; color: ${T.accent}; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.2); }
        .rc-open-mini { align-self: flex-start; margin-top: 10px; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13px; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 99px; padding: 8px 14px; cursor: pointer; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.2); transition: all 0.2s; }
        .rc-open-mini:hover { transform: translateY(-1px); }

        /* === 📖 QAYTA TUSHUNTIRISH (recap overlay) — proyektorga katta shrift === */
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
        .rc-vis { margin-top: clamp(4px,1vw,10px); display: flex; justify-content: center; width: 100%; }
        .rc-flow { display: flex; align-items: center; justify-content: center; gap: clamp(6px,1.4vw,12px); flex-wrap: wrap; }
        .rc-chip { font-weight: 700; font-size: clamp(13px,2vw,18px); background: ${T.paper}; color: ${T.ink}; border-radius: 12px; padding: clamp(8px,1.4vw,13px) clamp(12px,2vw,18px); box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.2); white-space: nowrap; }
        .rc-arr { font-size: clamp(15px,2.2vw,22px); color: ${T.accent}; font-weight: 800; }
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
        .rc-btn.ghost:hover:not(:disabled) { background: ${T.paper}; color: ${T.ink}; }
        .rc-btn.done { background: ${T.success}; color: #fff; }
        .rc-btn.done:hover { background: #17603C; }
        @media (max-width: 640px) {
          .rc-nav { flex-wrap: wrap; justify-content: center; row-gap: 10px; }
          .rc-dots { width: 100%; order: -1; }
          .rc-btn { font-size: 13px; padding: 11px 16px; }
        }

        /* === ⚡ CTA (yakun sahifasida) === */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; border-radius: 18px; }

        /* ===== ⚡ ARENA — issiq CoddyCamp muhiti ===== */
        .qz-arena { position: fixed; inset: 0; z-index: 10500; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; padding: clamp(18px,4vw,44px) clamp(12px,3vw,32px); background: radial-gradient(62% 46% at 10% 6%, rgba(124,58,237,0.30) 0%, rgba(124,58,237,0) 56%), radial-gradient(58% 48% at 92% 12%, rgba(15,166,214,0.14) 0%, rgba(15,166,214,0) 55%), radial-gradient(70% 52% at 78% 104%, rgba(255,79,40,0.14) 0%, rgba(255,79,40,0) 60%), radial-gradient(90% 55% at 50% -8%, #26123F 0%, rgba(38,18,63,0) 54%), #140B30; }
        .qz-arena::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: radial-gradient(rgba(190,150,255,0.08) 1.1px, transparent 1.2px); background-size: 24px 24px; -webkit-mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); }
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; text-shadow: 0 0 16px rgba(150,95,255,0.35); animation: qz-drift ease-in-out infinite; will-change: transform; }
        @keyframes qz-drift { 0%,100% { transform: translate(0,0) rotate(-6deg) scale(1); } 50% { transform: translate(18px,-24px) rotate(6deg) scale(1.05); } }
        @media (prefers-reduced-motion: reduce) { .qz-shp { animation: none; } }
        .qz-x { position: fixed; top: 14px; right: 16px; z-index: 10600; width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(186,140,255,0.34); background: rgba(255,255,255,0.06); color: #D9C9FF; font-size: 16px; cursor: pointer; box-shadow: 0 0 20px rgba(124,58,237,0.22); backdrop-filter: blur(6px); transition: transform 0.25s, color 0.2s, background 0.2s; }
        .qz-x:hover { color: #F2ECFF; background: rgba(255,255,255,0.12); transform: rotate(90deg); }
        .qz-view { position: relative; z-index: 1; width: 100%; max-width: 820px; display: flex; flex-direction: column; align-items: center; gap: clamp(14px,2.4vw,22px); margin: auto; }
        .qz-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(22px,4vw,36px); color: #F2ECFF; margin: 0; text-align: center; letter-spacing: -0.02em; text-shadow: 0 0 24px rgba(150,95,255,0.35); }
        .qz-sub { font-family: 'Manrope'; font-size: clamp(13px,1.9vw,16px); color: #B9A8E6; margin: 0; text-align: center; max-width: 540px; line-height: 1.55; font-weight: 500; }
        .qz-sub b { color: #F2ECFF; }
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
        .qz-btn.ghost:hover:not(:disabled) { box-shadow: 0 0 34px rgba(140,72,255,0.6), inset 0 1px 0 rgba(255,255,255,0.2); }
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
        .qz-q { font-family: 'Manrope'; font-weight: 800; font-size: clamp(19px,3.2vw,28px); color: #F2ECFF; margin: 0; text-align: center; line-height: 1.35; background: rgba(255,255,255,0.05); border: 1px solid rgba(186,140,255,0.34); border-radius: 20px; padding: clamp(18px,2.8vw,28px) clamp(18px,3vw,30px); width: 100%; box-shadow: 0 0 34px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.06); backdrop-filter: blur(8px); text-wrap: balance; }
        .qz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(11px,1.6vw,15px); width: 100%; }
        @media (max-width: 560px) { .qz-grid { grid-template-columns: 1fr; } }
        .qz-tile { --gl: 255,255,255; position: relative; display: flex; align-items: center; gap: 14px; border: none; border-radius: 18px; padding: clamp(15px,2.4vw,22px) clamp(14px,2.2vw,20px); cursor: pointer; text-align: left; min-height: 66px; color: #fff; overflow: hidden; box-shadow: 0 10px 26px -12px rgba(0,0,0,0.55), 0 0 26px -4px rgba(var(--gl),0.42), inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -4px 0 rgba(0,0,0,0.22), inset 0 0 0 1.5px rgba(0,0,0,0.24); transition: transform 0.14s, opacity 0.3s, box-shadow 0.14s, filter 0.2s; }
        .qz-grid .qz-tile:nth-child(1) { --gl: 255,90,44; }
        .qz-grid .qz-tile:nth-child(2) { --gl: 15,166,214; }
        .qz-grid .qz-tile:nth-child(3) { --gl: 245,166,35; }
        .qz-grid .qz-tile:nth-child(4) { --gl: 34,160,92; }
        .qz-tile:hover:not(:disabled):not(.rv) { transform: translateY(-3px); box-shadow: 0 18px 34px -12px rgba(0,0,0,0.6), 0 0 40px -2px rgba(var(--gl),0.6), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.24), inset 0 0 0 1.5px rgba(0,0,0,0.26); }
        .qz-tile:active:not(:disabled):not(.rv) { transform: translateY(2px) scale(0.985); }
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
        .qz-board { width: 100%; max-width: 480px; background: rgba(255,255,255,0.05); border: 1px solid rgba(186,140,255,0.32); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 0 32px rgba(124,58,237,0.25); backdrop-filter: blur(8px); }
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
        .qz-endnote { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 10600; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 94vw; background: rgba(27,15,63,0.86); border: 1px solid rgba(186,140,255,0.4); border-radius: 16px; padding: 10px 16px; color: #F2ECFF; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13.5px; box-shadow: 0 0 34px rgba(124,58,237,0.35); backdrop-filter: blur(10px); }

        /* --- kod-atama chip (fmtCode) arena variantlari --- */
        .qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
        .qz-q .qcode { background: rgba(203,173,255,0.18); color: #F2ECFF; }
        /* --- CodeStrike bolt FX qatlami --- */
        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

        /* tap-hint affordance: bosilmagan karta "meni bos" deb pulslaydi */
        @keyframes tap-hint-pulse { 0% { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18), 0 0 0 0 rgba(255,79,40,0.4); } 70%,100% { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18), 0 0 0 8px rgba(255,79,40,0); } }

        /* Kahoot-kutish: tanlangan variant javob ochilguncha nafas oladi */
        .option-wait { animation: opt-wait-breathe 2s ease-in-out infinite; }
        @keyframes opt-wait-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.012); } }
        @media (prefers-reduced-motion: reduce) { .option-wait { animation: none !important; } }

        /* ============ 4a-MODUL · NEST DARSI CSS ============ */

        /* TERMINAL */
        .term { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .term-bar { background: #2D2D2D; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; }
        .term-body { background: #1E1E1E; padding: 12px 13px; min-height: 60px; }
        .tline { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.8; color: ${CODE.text}; word-break: break-word; }

        /* SWAGGER — menyu */
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

        /* FAYL DARAXTI */
        .tree { background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 5px; }
        .tree-root { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; padding: 4px 6px; }
        .tree-row { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: ${T.bg}; border: none; border-radius: 9px; padding: 10px 11px; margin-left: 14px; cursor: pointer; transition: all 0.16s; }
        .tree-row:hover { background: #EFEBE3; }
        .tree-row.on { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .tree-folder { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; color: ${T.ink}; }
        .tree-role { font-size: 10.5px; color: ${T.ink2}; font-weight: 600; }
        .tree-seen { margin-left: auto; font-weight: 700; }
        .tree-kids { display: flex; flex-direction: column; gap: 4px; }
        .tree-kid { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 5px 9px; border-radius: 7px; }

        /* DI WIRE (s14) — qutilar s9 dagi ZONA rangini saqlaydi: zal(ofitsiant) → oshxona(oshpaz) → ombor(omborchi) */
        .wire { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); }
        .wire-box { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11.5px; background: var(--zbg, ${T.bg}); color: var(--zink, ${T.ink}); padding: 8px 11px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px var(--zline, ${T.line}); opacity: 0.5; filter: saturate(0.45); transition: opacity 0.25s, filter 0.25s, box-shadow 0.25s; }
        .wire-box.z-store, .wire-box.on { opacity: 1; filter: none; }
        .wire-box.on { box-shadow: inset 0 0 0 1.5px var(--zline), 0 0 0 2px ${T.success}66; }
        .wire-arr { position: relative; font-family: 'JetBrains Mono'; font-size: 10.5px; font-weight: 700; color: ${T.ink3}; transition: color 0.3s; }
        .wire-arr.on { color: ${T.success}; }
        /* ✨ .rz-wire — «siz simni tortmadingiz, NestJS uladi»: sim O'ZI chiziladi (chapdan o'ngga),
           so'ng ichidan yorug'lik yuguradi. Ikki sim KETMA-KET ulanadi (w1 → w2) — bola ulanish TARTIBINI ko'radi. */
        .rz-wire { animation: rz-wire-in 0.4s ease-out both; }
        @keyframes rz-wire-in { from { opacity: 0; } to { opacity: 1; } }
        .rz-wire::before { content: ''; position: absolute; left: 0; right: 0; bottom: -3px; height: 2px; border-radius: 2px; background: ${T.success}; transform-origin: left center; animation: rz-wire-draw 0.5s cubic-bezier(.3,.9,.4,1) both; }
        @keyframes rz-wire-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .rz-wire::after { content: ''; position: absolute; bottom: -4.5px; left: 0; width: 15px; height: 5px; border-radius: 99px; background: linear-gradient(90deg, transparent, #fff, transparent); box-shadow: 0 0 9px 2px ${T.success}; opacity: 0; animation: rz-wire-spark 1.5s 0.5s ease-in-out infinite; }
        @keyframes rz-wire-spark { 0% { left: 0; opacity: 0; } 12% { opacity: 1; } 62% { opacity: 1; } 72%, 100% { left: calc(100% - 15px); opacity: 0; } }
        .rz-wire.w2, .rz-wire.w2::before { animation-delay: 0.36s; }
        .rz-wire.w2::after { animation-delay: 0.86s; }

        /* ENTITY ROWS */
        .ent-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-family: 'JetBrains Mono'; font-size: 11.5px; padding: 7px 10px; border-radius: 8px; margin-bottom: 5px; }
        .ent-row span { font-size: 10px; font-weight: 700; }
        .ent-row.siz { background: ${T.accentSoft}; color: ${T.ink}; } .ent-row.siz span { color: ${T.accent}; }
        .ent-row.free { background: ${T.successSoft}; color: ${T.ink}; } .ent-row.free span { color: ${T.success}; }

        /* HOOK — chalkash fayl */
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }
        .messy { background: ${CODE.bg}; color: ${CODE.comment}; font-family: 'JetBrains Mono'; font-size: 10.5px; line-height: 1.7; padding: 13px; border-radius: 11px; cursor: pointer; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); max-height: 170px; overflow: hidden; } .messy p { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* 11.13 — haqiqiy hayotda sinang */
        .real-try { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: 13px 16px; }

        /* AI BUILDER (s18) */
        .prompt-row { display: flex; gap: 8px; }
        .prompt-input { flex: 1; min-width: 0; font-family: 'JetBrains Mono'; font-size: 14px; padding: 11px 14px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: inset 0 0 0 1.5px ${T.ink3}40; transition: box-shadow 0.2s; }
        .prompt-input:focus { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .prompt-btn { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14px; padding: 0 18px; border-radius: 12px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .prompt-btn:hover:not(:disabled) { box-shadow: 0 10px 22px -5px rgba(255,79,40,0.55); }
        .prompt-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .gen-steps { display: flex; flex-wrap: wrap; gap: 6px; }
        .gen-step { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; padding: 6px 10px; border-radius: 99px; background: ${T.paper}; color: ${T.ink3}; box-shadow: inset 0 0 0 1px ${T.ink3}30; transition: all 0.25s; }
        .gen-step.on { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}55; }
        .gen-step.cur { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .gen-line { font-family: 'JetBrains Mono'; font-size: 12px; color: ${CODE.attr}; margin: 4px 2px 0; } .gen-line::after { content: '…'; animation: blink 1s steps(3) infinite; } @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        .filestream { display: flex; flex-direction: column; gap: 8px; max-height: clamp(260px,42vh,360px); overflow-y: auto; padding-right: 2px; }
        .fs-empty { font-size: 13px; color: ${T.ink3}; font-style: italic; margin: 0; padding: 10px 0; }
        .fs-file { background: ${CODE.bg}; border-radius: 11px; overflow: hidden; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.22); }
        .fs-name { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11.5px; color: #C9D1D9; background: #243049; padding: 7px 11px; display: flex; align-items: center; gap: 7px; } .fs-ico { font-size: 14px; }
        .fs-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.55; color: ${CODE.text}; padding: 10px 12px; margin: 0; white-space: pre-wrap; word-break: break-word; }

        /* DEBUG (s19) — noto'g'ri xonadagi qator */
        .ai-line .tg { color: ${CODE.tag}; }
        /* topilgan xato qator: sudralishi mumkinligi KO'RINIB tursin (⠿ tutqich + tanlangan ramka) */
        .ai-line.grabbable { cursor: grab; touch-action: none; user-select: none; position: relative; padding-left: 26px; }
        /* ⠿ tutqich jim turmasin — "meni sudra" deb chaqiradi (affordance) */
        .ai-line.grabbable::before { content: '⠿'; position: absolute; left: 8px; top: 50%; color: ${T.accent}; font-size: 14px; line-height: 1; animation: rz-grip 1.5s ease-in-out infinite; }
        @keyframes rz-grip { 0%,100% { transform: translateY(-50%) translateX(0); opacity: 0.55; } 50% { transform: translateY(-50%) translateX(3px); opacity: 1; } }
        .ai-line.grabbable:active { cursor: grabbing; }
        .ai-line.grabbable:active::before { animation: none; opacity: 1; }
        .ai-line.bad .ai-tag-empty { color: ${T.accent}; font-style: normal; font-weight: 700; }
        .ai-line.dashed { color: ${CODE.comment}; font-style: italic; border: 1px dashed ${CODE.punct}66; }
        .ai-line.shake { animation: shake 0.45s ease; }
        .ai-tag-empty { color: ${CODE.comment}; font-style: italic; }
        .rz-drop { position: relative; border-radius: 12px; padding: 8px; background: ${CODE.bg}; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); transition: box-shadow 0.25s; }
        /* xato qator topilgach — to'g'ri fayl "shu yerga tashla" deb pulslaydi */
        .rz-drop.hot { box-shadow: 0 0 0 2px ${T.accent}, 0 12px 26px -8px rgba(255,79,40,0.35); animation: rz-drop-hot 1.2s ease-in-out infinite; }
        @keyframes rz-drop-hot { 0%,100% { box-shadow: 0 0 0 2px ${T.accent}, 0 0 0 3px rgba(255,79,40,0), 0 12px 26px -8px rgba(255,79,40,0.35); } 50% { box-shadow: 0 0 0 2px ${T.accent}, 0 0 0 8px rgba(255,79,40,0.15), 0 14px 30px -8px rgba(255,79,40,0.45); } }
        .rz-drop.filled { box-shadow: 0 0 0 2px ${T.success}, 0 10px 24px -8px rgba(31,122,77,0.3); }
        /* .rz-move — qator o'z xonasiga "clack" bilan tushadi */
        .rz-move { animation: rz-move-in 0.45s cubic-bezier(.3,1.4,.5,1); }
        @keyframes rz-move-in { 0% { opacity: 0; transform: translateY(-14px) scale(1.05); } 60% { transform: translateY(2px) scale(0.98); } 100% { opacity: 1; transform: none; } }
        /* MUHR — qator joyiga tushganda urib qo'yiladi (qaror harakat bilan muhrlanadi) */
        .rz-stamp { position: absolute; top: -11px; right: -9px; z-index: 3; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; font-weight: 900; font-size: 15px; color: ${T.success}; background: ${T.paper}; box-shadow: 0 0 0 2.5px ${T.success}, 0 7px 15px -4px rgba(31,122,77,0.42); animation: rz-stamp-in 0.5s 0.18s cubic-bezier(.3,1.5,.5,1) both; }
        @keyframes rz-stamp-in { 0% { transform: scale(2.7) rotate(-24deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1) rotate(-10deg); opacity: 1; } }

        /* ★ BUYURTMA YO'LI (s9) — RESTORAN PLANI: zal (och) → oshxona (iliq) → ombor (to'q) */
        /* 🎨 ZONA TOKENLARI — bir bekat qaysi zonada ekani RANGDAN o'qiladi (kartada ham, yo'lakda ham, DI simlarida ham) */
        .z-hall  { --zbg: ${T.hallBg};  --zink: ${T.hallInk};  --zline: ${T.hallLine}; }
        .z-kitch { --zbg: ${T.kitchBg}; --zink: ${T.kitchInk}; --zline: ${T.kitchLine}; }
        .z-store { --zbg: ${T.storeBg}; --zink: ${T.storeInk}; --zline: ${T.storeLine}; }
        /* board = restoran POLI (oq, nozik plan-katak); bo'sh bekat va xodimlar zaxirasi — krem; to'lgan bekat — zona rangi */
        .rz-board { display: flex; flex-direction: column; gap: 10px; border-radius: 16px; padding: clamp(10px,1.6vw,16px); box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.2);
          background-color: ${T.paper};
          background-image: linear-gradient(rgba(${T.shadowBase},0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(${T.shadowBase},0.05) 1px, transparent 1px);
          background-size: 22px 22px; }
        .rz-door { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rz-doorman { font-size: 24px; }
        .rz-sign { display: flex; flex-direction: column; font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.1em; color: ${T.ink2}; background: ${T.paper}; border-radius: 9px; padding: 6px 11px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.22); }
        .rz-sign span { font-weight: 600; font-size: 10.5px; letter-spacing: 0; color: ${T.ink3}; }
        /* zona legendasi — uch rangning ma'nosi bir qarashda */
        .rz-legend { display: flex; gap: 6px; flex-wrap: wrap; margin-left: auto; }
        .rz-zchip { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 800; font-size: 9.5px; letter-spacing: 0.09em; color: var(--zink); background: var(--zbg); border-radius: 99px; padding: 5px 11px; box-shadow: inset 0 0 0 1px var(--zline); }
        .rz-zchip i { width: 7px; height: 7px; border-radius: 50%; background: var(--zink); flex-shrink: 0; }
        .rz-zchip em { font-style: normal; font-weight: 600; font-size: 9.5px; letter-spacing: 0; opacity: 0.72; }
        @media (max-width: 700px) { .rz-legend { margin-left: 0; } .rz-zchip em { display: none; } }
        /* position:relative — sayohatchi token (.rz-tok) shu yo'lak ustida suriladi */
        .rz-lane { position: relative; display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); gap: 6px; align-items: stretch; }
        @media (max-width: 760px) { .rz-lane { grid-template-columns: repeat(4, minmax(0,1fr)); } }
        .rz-slot { position: relative; min-height: 100px; border-radius: 12px; border: 2px dashed ${T.ink3}66; background: ${T.bg}; display: flex; align-items: center; justify-content: center; padding: 4px; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        /* to'lgan bekat ZONA rangiga bo'yaladi → yo'lak uch zonaga bo'linib ko'rinadi */
        .rz-slot.filled { border-style: solid; border-color: var(--zline); background: var(--zbg); box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.24); }
        .rz-slot.passed { box-shadow: inset 0 0 0 2px ${T.success}88; }
        /* faol bekat "ishlayapti" — nafas oladi (token shu yerda to'xtaganini bola ko'radi) */
        .rz-slot.cur { border-color: ${T.ink}; box-shadow: 0 0 0 2.5px ${T.ink}, 0 12px 22px -8px rgba(${T.shadowBase},0.4); animation: rz-station 0.9s ease-in-out infinite; }
        @keyframes rz-station { 0%,100% { box-shadow: 0 0 0 2.5px ${T.ink}, 0 0 0 3px rgba(${T.shadowBase},0), 0 12px 22px -8px rgba(${T.shadowBase},0.4); } 50% { box-shadow: 0 0 0 2.5px ${T.ink}, 0 0 0 7px rgba(${T.shadowBase},0.13), 0 14px 26px -8px rgba(${T.shadowBase},0.45); } }
        /* .rz-crash — bekat AYNAN aybdor joyda qizarib silkinadi (kelgan tartibda .cur ustidan yutadi) */
        .rz-slot.rz-crash { border-color: ${T.danger}; background: ${T.dangerSoft}; box-shadow: 0 0 0 2.5px ${T.danger}; animation: rz-shake 0.5s ease; }
        @keyframes rz-shake { 0%,100% { transform: none; } 20% { transform: translateX(-5px); } 45% { transform: translateX(5px); } 70% { transform: translateX(-3px); } }
        /* zarba to'lqini — yiqilish KO'RINADIGAN bo'lsin */
        .rz-shock { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; box-shadow: 0 0 0 2px ${T.danger}; pointer-events: none; z-index: 1; animation: rz-shock-out 0.62s ease-out both; }
        @keyframes rz-shock-out { 0% { transform: scale(0.4); opacity: 0.9; } 100% { transform: scale(3.8); opacity: 0; } }
        .rz-n { position: absolute; top: 4px; left: 6px; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 10px; color: ${T.ink3}; z-index: 1; }
        .rz-empty { font-size: 10.5px; color: ${T.ink3}; font-style: italic; text-align: center; }
        /* karta — oq qog'oz, tepasida ZONA chizig'i; zonasiz (neytral) holat ham xavfsiz */
        .rz-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; width: 100%; background: ${T.paper}; border: none; border-radius: 10px; padding: 12px 4px 8px; cursor: grab; touch-action: none; user-select: none; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.24), inset 0 3px 0 var(--zline, ${T.line}); transition: transform 0.14s, box-shadow 0.2s; }
        .rz-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -8px rgba(${T.shadowBase},0.3), inset 0 3px 0 var(--zline, ${T.line}); }
        .rz-card:active { cursor: grabbing; }
        /* SNAP — xodim bekatga tushganda "joyiga qo'yildi" hissi.
           ⚠️ fill-mode YO'Q (both EMAS): aks holda animatsiya-origin sudrashning inline transform'ini bosib qo'yadi. */
        .rz-card.in { animation: rz-snap 0.34s cubic-bezier(.3,1.55,.5,1); }
        @keyframes rz-snap { 0% { transform: scale(1.12) rotate(-2.5deg); } 55% { transform: scale(0.97); } 100% { transform: scale(1) rotate(0); } }
        .rz-z { font-family: 'Manrope'; font-weight: 800; font-size: 8px; letter-spacing: 0.12em; color: var(--zink, ${T.ink3}); background: var(--zbg, ${T.bg}); border-radius: 99px; padding: 1px 7px; }
        .rz-ico { font-size: clamp(18px,2.4vw,24px); line-height: 1.1; }
        .rz-nm { font-family: 'Manrope'; font-weight: 800; font-size: 10px; color: ${T.ink}; text-align: center; line-height: 1.15; }
        .rz-code { font-size: 8.5px; color: var(--zink, ${T.ink2}); font-weight: 700; text-align: center; line-height: 1.1; }
        /* ✨ SAYOHATCHI TOKEN — bitta element, yo'lak ustida SURILADI (bekatdan bekatga SAKRAMAYDI).
           Tashqi qatlam = pozitsiya (transition), ichki qatlam = xarakter (animation) → ikkalasi to'qnashmaydi. */
        .rz-tok { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 6; pointer-events: none; will-change: transform;
          transition: transform 0.62s cubic-bezier(.42,.06,.28,1); }
        .rz-tok-i { position: absolute; left: -16px; top: -14px; width: 32px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 22px; filter: drop-shadow(0 3px 5px rgba(${T.shadowBase},0.35)); }
        /* .rz-walk — yurish: har qadamda tebranadi (bekatdan bekatga YO'L ko'rinadi) */
        .rz-tok.rz-walk .rz-tok-i { animation: rz-walk-bob 0.72s ease-in-out infinite; }
        @keyframes rz-walk-bob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }
        /* .rz-crash — aynan aybdor bekatda: zarba, silkinish, qulash */
        .rz-tok.rz-crash .rz-tok-i { animation: rz-crash-hit 0.62s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes rz-crash-hit { 0% { transform: translateY(-9px) scale(0.9); } 18% { transform: translateY(0) scale(1.55); } 32% { transform: translateX(-6px) scale(1.35); } 47% { transform: translateX(6px) scale(1.28); } 62% { transform: translateX(-4px) scale(1.2); } 100% { transform: translateY(5px) scale(1.12) rotate(-8deg); } }
        /* .rz-tray — 🍽️ lagan mijozga UCHIB boradi: muvaffaqiyat yo'li oxirigacha ko'rinadi */
        .rz-tok.rz-tray { transition: transform 0.66s cubic-bezier(.3,1.22,.45,1); }
        .rz-tok.rz-tray .rz-tok-i { font-size: 26px; animation: rz-tray-in 0.66s cubic-bezier(.3,1.35,.45,1) both; }
        @keyframes rz-tray-in { 0% { transform: scale(0.75) rotate(-14deg); } 55% { transform: scale(1.28) rotate(7deg); } 100% { transform: scale(1) rotate(0); } }
        .rz-code-chip { position: absolute; bottom: -9px; left: 50%; transform: translateX(-50%); font-family: 'JetBrains Mono'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.danger}; border-radius: 99px; padding: 2px 9px; box-shadow: 0 4px 10px -3px rgba(194,54,43,0.5); z-index: 2; }
        /* mijoz zalda kutadi — chiqish ham ZAL rangida */
        .rz-exit { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border-radius: 12px; background: ${T.hallBg}; box-shadow: inset 0 0 0 1.5px ${T.hallLine}; min-height: 100px; transition: background 0.3s, box-shadow 0.3s; }
        .rz-exit.served { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}66; }
        /* mijoz laganni KUTADI va u yetib kelganda quvonadi (kechikish = lagan uchib borgan payt) */
        .rz-diner { font-size: 26px; }
        .rz-exit.served .rz-diner { animation: rz-diner-happy 0.7s 0.42s cubic-bezier(.3,1.4,.5,1) both; }
        @keyframes rz-diner-happy { 0%,100% { transform: scale(1) rotate(0); } 42% { transform: scale(1.34) rotate(-7deg); } 72% { transform: scale(0.96) rotate(3deg); } }
        .rz-exit-l { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink2}; }
        .rz-pool { display: flex; flex-wrap: wrap; gap: 7px; min-height: 66px; padding: 9px; border-radius: 12px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px rgba(${T.shadowBase},0.08); align-items: center; position: relative; z-index: 1; }
        .rz-pool .rz-card { width: auto; min-width: 108px; }
        .rz-pool-empty { font-size: 12px; color: ${T.ink3}; font-style: italic; padding: 0 6px; }
        .rz-run { display: flex; flex-direction: column; gap: 10px; }
        .rz-cust { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
        @media (max-width: 700px) { .rz-cust { grid-template-columns: 1fr; } }
        .rz-cbtn { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 10px 12px; cursor: pointer; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.22); transition: all 0.18s; }
        .rz-cbtn:hover:not(:disabled) { transform: translateY(-2px); }
        .rz-cbtn:disabled { opacity: 0.45; cursor: not-allowed; }
        .rz-cbtn.ok { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 8px 18px -8px rgba(31,122,77,0.28); }
        .rz-cbtn.bad { box-shadow: inset 0 0 0 1.5px ${T.danger}; }
        .rz-cico { font-size: 15px; }
        .rz-cl { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; color: ${T.ink}; }
        .rz-cr { font-size: 9.5px; color: ${T.ink2}; word-break: break-word; }
        .rz-cs { position: absolute; top: 9px; right: 11px; font-weight: 800; font-size: 12px; color: ${T.accent}; }

        /* 🧲 DRAG-DROP TARTIB (s15) */
        .dd { display: flex; flex-direction: column; gap: 13px; }
        .dd-slots { display: flex; flex-direction: column; gap: 9px; position: relative; }
        .dd-slot { display: flex; align-items: center; gap: 12px; min-height: 58px; border-radius: 14px; border: 2px dashed ${T.ink3}66; background: ${T.paper}; padding: 8px 12px; box-shadow: 0 5px 14px -9px rgba(${T.shadowBase},0.2); transition: border-color .18s, background .18s, box-shadow .18s; }
        .dd-slot.filled { border-style: solid; border-color: ${T.line}; box-shadow: 0 8px 18px -10px rgba(${T.shadowBase},0.26); }
        /* to'g'ri terilganda — qadamlar KETMA-KET tasdiqlanadi (yuqoridan pastga to'lqin) */
        .dd-slot.ok { border-color: ${T.success}; background: ${T.successSoft}; animation: dd-ok-pop 0.42s cubic-bezier(.3,1.5,.5,1); }
        .dd-slot.ok:nth-child(2) { animation-delay: 0.07s; } .dd-slot.ok:nth-child(3) { animation-delay: 0.14s; }
        .dd-slot.ok:nth-child(4) { animation-delay: 0.21s; } .dd-slot.ok:nth-child(5) { animation-delay: 0.28s; }
        @keyframes dd-ok-pop { 0%,100% { transform: scale(1); } 45% { transform: scale(1.025); } }
        .dd-slot.bad { border-color: ${T.danger}; background: ${T.dangerSoft}; animation: dd-shake .4s; }
        @keyframes dd-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        /* SNAP — bo'lak slotga tushganda "qulflandi" hissi (fill-mode YO'Q — sudrash transform'i erkin qolsin) */
        .dd-chip.in { animation: dd-snap 0.32s cubic-bezier(.3,1.6,.5,1); }
        @keyframes dd-snap { 0% { transform: scale(1.14) rotate(-2deg); } 55% { transform: scale(0.97) rotate(0.5deg); } 100% { transform: scale(1) rotate(0); } }
        .dd-slotn { width: 26px; height: 26px; border-radius: 8px; background: ${T.bg}; color: ${T.ink3}; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 0 0 1.5px ${T.line}; }
        .dd-slot.ok .dd-slotn { background: ${T.success}; color: #fff; box-shadow: none; }
        .dd-slot.bad .dd-slotn { background: ${T.danger}; color: #fff; box-shadow: none; }
        .dd-hint { flex: 1; min-width: 0; color: ${T.ink3}; font-style: italic; font-size: 13px; line-height: 1.35; }
        .dd-slot .dd-chip { min-width: 168px; text-align: left; }
        .dd-pool { display: flex; flex-wrap: wrap; gap: 9px; min-height: 48px; padding: 10px; border-radius: 14px; background: ${T.bg}; position: relative; z-index: 1; }
        .dd-pool-empty { color: ${T.ink3}; font-size: 12.5px; font-style: italic; align-self: center; }
        .dd-chip { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(13px,1.7vw,15px); color: #fff; background: linear-gradient(170deg, #FF8A3D, ${T.accent}); border: none; border-radius: 11px; padding: 11px 15px; cursor: grab; touch-action: none; box-shadow: 0 8px 16px -8px rgba(255,79,40,.6), inset 0 2px 0 rgba(255,255,255,.3); transition: transform .12s; user-select: none; }
        .dd-chip:hover { transform: translateY(-2px); }
        .dd-chip:active { cursor: grabbing; }
        .dd-done { font-weight: 700; color: ${T.success}; font-size: 14.5px; }
        .dd-wrong { font-weight: 700; color: ${T.danger}; font-size: 13.5px; }

        /* tap-hint affordance — bosilmagan kartalar "meni bos" deb pulslaydi (11.7). Bosilgach pulsatsiya TO'XTAYDI = progress signali. */
        .tree-row.tap-hint, .gchip.tap-hint, .rz-card.tap-hint, .btn-soft.tap-hint { animation: tap-hint-pulse 1.9s ease-in-out infinite; }

        /* 11.15 — jonli badge xira, hover'da tiniq (proyektorda xalaqit bermaydi) */
        .live-badge { opacity: 0.4; transition: opacity 0.25s ease, box-shadow 0.25s ease; }
        .live-badge:hover, .live-badge:focus-within { opacity: 1; box-shadow: 0 8px 24px -6px rgba(58,53,48,0.32) !important; }
        @media (hover: none) { .live-badge { opacity: 0.62; } }

        /* S21 — har og'ir animatsiyaga TINCH variant. Token POZITSIYASI = ma'lumot (qaysi bekatda),
           shuning uchun u o'chirilmaydi — faqat deyarli oniy qilinadi. Bezak harakatlar to'liq to'xtaydi. */
        @media (prefers-reduced-motion: reduce) {
          .rz-tok-i, .rz-shock, .rz-diner, .rz-exit.served .rz-diner, .rz-slot.cur, .rz-slot.rz-crash,
          .rz-move, .rz-stamp, .rz-drop.hot, .rz-wire, .rz-wire::before, .rz-wire::after,
          .ai-line.grabbable::before, .ai-line.shake, .rz-card.in, .dd-chip.in, .dd-slot.ok, .dd-slot.bad,
          .tree-row.tap-hint, .gchip.tap-hint, .rz-card.tap-hint, .btn-soft.tap-hint { animation: none !important; }
          .rz-tok { transition: transform 0.16s linear !important; }
          .rz-wire::after { display: none; }
          .ai-line.grabbable::before { transform: translateY(-50%); opacity: 1; }
        }

      `}</style>
      <AchCtx.Provider value={earned}>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="Nest arxitektura darsi" />
          ) : (
            <>
              <Current screen={screen} storedAnswer={answers[screen]} answers={answers} achievements={earned} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} live={live} />
              <LiveBadge live={live} total={TOTAL_SCREENS} />
              <AchToasts toasts={achToasts} onDone={(k) => setAchToasts(t => t.filter(x => x.k !== k))} />
            </>
          )}
        </div>
      </LiveGateCtx.Provider>
      </AchCtx.Provider>
    </LangContext.Provider>
  );
}
