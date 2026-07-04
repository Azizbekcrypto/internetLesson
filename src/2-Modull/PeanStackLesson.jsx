import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../assets/common/mentor.png';

// ============================================================
// PERN STACK — OBZOR: PostgreSQL + Express + React + Node.js — PLATFORM STANDARD v16
// Mavzu: frontend vs backend, React (ko'rinish), Node.js (JS serverda),
//        Express (yo'llar/so'rovlar), PostgreSQL (doimiy ombor),
//        to'liq so'rov sayohati — 4 texnologiya bitta jamoa (stack).
// Hook: saytga izoh yozasiz → sahifa yangilanadi → izoh yo'qoladi (saqlash yo'q!).
// Bosh metafora: RESTORAN — zal (React) · ofitsiant (Express) · oshxona (Node) · ombor (PostgreSQL).
// Maqsad: kod o'rgatish EMAS — keyingi modullarga (React, Node/Express/NestJS) xarita va qiziqish berish.
// AUDIOSIZ versiya — Mentor matni qoladi, TTS yo'q.
// Toza dizayn — ortiqcha emoji yo'q; ma'no so'z, rang va tipografiya bilan beriladi.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  purple: '#7C3AED', purpleSoft: '#EFE9FB',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };


// ============================================================
// JONLI DARS (live) — Kahoot uslubida: PIN, mentor, o'quvchilar, jonli test.
// InternetLesson/PmLesson1 bilan bir xil infra. O'chirish: LIVE_SUPABASE_URL='' .
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

const LiveGateCtx = createContext(null);

function useLiveSession(lessonId) {
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
    } catch { setJoinError('Mentor kodi noto‘g‘ri yoki ulanishda xato.'); }
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
  const shownRef = useRef(false);
  useEffect(() => { if (live.mode === 'mentor' && live.pin && !live.ended && !shownRef.current) { shownRef.current = true; setBigOpen(true); } }, [live.mode, live.pin, live.ended]);
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
    if (live.ended) return <div style={_liveBadgeS}><span style={_liveDot(LT.ink3)} /> 🔓 O'quvchilar erkin qilindi</div>;
    return (<>
      {bigOpen && <LiveBigCode pin={live.pin} onClose={() => setBigOpen(false)} />}
      <div style={_liveBadgeS}>
        <span style={_liveDot(LT.success)} /> Kod: <b style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>{fmtPin(live.pin)}</b>
        {nPlayers !== null && <span style={{ color: LT.ink2 }}>👥 {nPlayers}</span>}
        <button onClick={() => setBigOpen(true)} title="Kodni katta ko'rsatish" style={{ marginLeft: 6, background: LT.ink, color: '#fff', border: 'none', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>📺 Ko'rsatish</button>
        <button onClick={() => { if (window.confirm("O'quvchilarni ozod qilasizmi? Ular o'zlari erkin davom etadi.")) live.endSession(); }} style={{ background: LT.accentSoft, color: LT.accent, border: 'none', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔓 Erkin qilish</button>
      </div>
    </>);
  }
  if (live.mode === 'student') {
    if (live.status === 'ended') return <div style={_liveBadgeS}><span style={_liveDot(LT.success)} /> 🔓 Erkin rejim — o'zingiz davom eting</div>;
    if (!live.mentorAlive) return <div style={_liveBadgeS}><span style={_liveDot(LT.ink3)} /> ⚠️ Mentor uzildi — erkin rejim</div>;
    if (!live.connected) return <div style={_liveBadgeS}><span style={_liveDot('#FFD380')} /> 🔄 Qayta ulanmoqda…</div>;
    return <div style={_liveBadgeS}><span style={_liveDot(LT.success)} /> 👨‍🏫 Mentor: {Math.min(live.mentorScreen + 1, total)} / {total}{live.nickname && <span style={{ color: LT.ink3 }}>· {live.nickname}</span>}</div>;
  }
  return null;
}

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

// ===== Kod bo'yoqlari =====
const KW = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const STR = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const FN = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;
const CM = ({ children }) => <span style={{ color: CODE.comment }}>{children}</span>;

const LESSON_META = { lessonId: 'pean-stack-01-v17', lessonTitle: { uz: 'PERN Stack — 4 texnologiya, bitta jamoa', ru: 'PERN Stack — 4 технологии, одна команда' } };
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
  { id: 's15b', type: 'stats',      template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 60; // InternetLesson layout standarti: 1100px + 60px
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  const setCollapsed = (v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  };
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
const NavNext = ({ disabled, label = 'Davom etish', onClick, optionalLive }) => {
  const gate = useContext(LiveGateCtx);
  const locked = !!(gate && gate.locked);
  const live = gate && gate.live;
  const freeRide = !!(optionalLive && live && live.mode === 'student' && live.status !== 'ended' && live.mentorAlive);
  return <button className="btn-white-accent" disabled={(freeRide ? false : disabled) || locked} onClick={onClick} title={locked ? 'Mentor hali bu sahifaga o\'tmadi' : undefined} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)', marginLeft: 'auto' }}>{locked ? '⏳ Mentorni kuting' : (freeRide && disabled ? 'Davom etish' : label)}</button>;
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

// ===== KO'P TANLOVLI TEST (audiosiz) =====

// ===== 📖 QAYTA TUSHUNTIRISH (recap) — jonli darsda mentor past natijada ochadi =====
const RECAP_NEED_PCT = 60;   // shundan past — qayta tushuntirish TAVSIYA etiladi
const RECAP_GOOD_PCT = 75;   // shundan yuqori — sinf o'zlashtirdi, bemalol davom
const RECAP_MIN_ANSWERS = 3; // foizga ishonch uchun kamida shuncha javob kerak
// ============================================================
// 📖 QAYTA TUSHUNTIRISH (recap) — test natijasi past chiqsa mentor proyektorda
// ochib, og'zaki qayta tushuntiradi (server sinxronsiz — o'quvchilar qulflangan,
// proyektorga qaraydi). Xato qilgan o'quvchi o'z qurilmasida ham ochishi mumkin.
// Kalitlar — scored test ekranlarining indekslari (4, 6, 10, 13).
// Har karta: ic (katta emoji), h (sarlavha), body (1-2 gap), vis (ko'rgazma),
// ask (mentor sinfga og'zaki beradigan savol — jonli muloqot uchun).
// ============================================================
const RcFlow = ({ items, sep = '→' }) => (
  <div className="rc-flow">{items.map((t, i) => <React.Fragment key={i}><span className="rc-chip">{t}</span>{sep && i < items.length - 1 && <span className="rc-arr">{sep}</span>}</React.Fragment>)}</div>
);
// RECAPS kontenti — Stage 4'da JS-intro testlariga to'ldiriladi (hozircha bo'sh)
const RECAPS = {
  // s4 — "Saytning foydalanuvchi ko'radigan qismi nima deb ataladi?" → Frontend
  4: {
    title: "Frontend — ko'rinadigan qism",
    cards: [
      {
        ic: "🍽️",
        h: "Sayt — bu restoran",
        body: <>Restoranda <b>zal</b> bor: mijoz o'tiradigan, menyu ko'radigan, ovqat keladigan joy. Saytda ham xuddi shunday ko'rinadigan qism bor — bu <b>frontend</b>.</>,
        vis: <RcFlow items={["mijoz", "zal (ko'rinadi)", "oshxona (yashirin)"]} />
      },
      {
        ic: "👀",
        h: "Frontend — sen ko'rgan hamma narsa",
        body: <>Tugmalar, rasmlar, matn, ranglar — brauzerda <b>ko'rgan va bosgan</b> hamma narsa frontend. Uni ko'pincha <b>React</b> yasaydi.</>,
        vis: <RcFlow items={["tugma", "rasm", "matn", "rang"]} sep="·" />,
        ask: "Hozir ekranda ko'rib turgan qaysi narsalar frontendga tegishli?"
      },
      {
        ic: "🔒",
        h: "Backend — ko'rinmaydigan qism",
        body: <>Frontendning teskarisi <b>backend</b>: server va baza — restoranning <b>oshxonasi</b> kabi yashirin ishlaydi. Mijoz uni ko'rmaydi, lekin ovqat o'sha yerda tayyorlanadi.</>,
      },
    ]
  },

  // s5b — "Node.js nima qiladi?" → JavaScript'ni serverda ishlatadi
  6: {
    title: "Node.js — JS serverda",
    cards: [
      {
        ic: "🌐",
        h: "Ilgari JavaScript faqat brauzerda edi",
        body: <>Avval JavaScript faqat <b>brauzer ichida</b>, ya'ni zalda ishlardi. Oshxonaga (serverga) kira olmasdi.</>,
        vis: <RcFlow items={["JavaScript", "faqat brauzer"]} />
      },
      {
        ic: "👨‍🍳",
        h: "Node.js — JS ni oshxonaga olib kirdi",
        body: <>Node.js — bu <b>JavaScriptni serverda</b> ishlatadigan vosita. Endi bir tilda ham zal (frontend), ham <b>oshxona (server)</b> yozish mumkin.</>,
        vis: <RcFlow items={["JavaScript", "Node.js", "serverda ishlaydi"]} />,
        ask: "Bir xil tilda ham zal, ham oshxona yozish nega qulay?"
      },
      {
        ic: "❌",
        h: "Node.js nima QILMAYDI",
        body: <>U sahifani bezamaydi (bu CSS ishi), rasm tahrirlamaydi, internet tezligini oshirmaydi. Uning yagona vazifasi — <b>JS ni serverda ishga tushirish</b>.</>,
      },
    ]
  },

  // s9 — "Like va izohlar doimiy qayerda saqlanadi?" → PostgreSQL bazasida
  10: {
    title: "PostgreSQL — doimiy ombor",
    cards: [
      {
        ic: "🏪",
        h: "Baza — restoranning ombori",
        body: <>Restoranda mahsulotlar <b>omborda</b> turadi — svet o'chsa ham yo'qolmaydi. Saytda ma'lumotlar shunday doimiy joyda — <b>bazada</b> saqlanadi. Bu vazifani ko'pincha <b>PostgreSQL</b> bajaradi.</>,
        vis: <RcFlow items={["like", "izoh", "ombor (PostgreSQL)"]} />
      },
      {
        ic: "💾",
        h: "Doimiy — ya'ni yo'qolmaydi",
        body: <>Like bossang, izoh yozsang — ular <b>bazaga yoziladi</b>. Sahifani yangilasang ham, ertaga qaytib kelsang ham <b>joyida turadi</b>.</>,
        vis: <RcFlow items={["yozdim", "bazaga saqlandi", "yangiladim", "hali ham bor"]} />,
        ask: "Nega like brauzer xotirasiga emas, bazaga saqlanishi kerak?"
      },
      {
        ic: "🚫",
        h: "Brauzer xotirasi doimiy emas",
        body: <>Agar ma'lumot faqat <b>brauzerda</b> yoki ekranda tursa, sahifa yangilanishi bilan <b>yo'qoladi</b>. Shuning uchun muhim narsalar CSS faylida emas, bazada saqlanadi.</>,
      },
    ]
  },

  // s12 — "Tugma bosilganda so'rov qaysi yo'l bilan boradi?" → React → Express → PostgreSQL
  13: {
    title: "So'rov sayohati",
    cards: [
      {
        ic: "🙋",
        h: "React — mijoz buyurtma beradi",
        body: <>Tugmani bosganingda <b>React (zal)</b> so'rovni boshlaydi — xuddi mijoz ofitsiantga «menga shuni keltiring» deganidek.</>,
        vis: <RcFlow items={["tugma bosildi", "React so'rov yubordi"]} />
      },
      {
        ic: "🧑‍🍳",
        h: "Express — ofitsiant so'rovni oshxonaga eltadi",
        body: <>So'rov <b>Express (ofitsiant)</b> ga boradi. U qaysi so'rov qayerga borishini biladi va uni to'g'ri joyga — <b>bazaga</b> yo'naltiradi.</>,
        vis: <RcFlow items={["React", "Express", "PostgreSQL"]} />,
        ask: "Nega so'rov to'g'ridan-to'g'ri bazaga emas, avval Express orqali boradi?"
      },
      {
        ic: "📦",
        h: "PostgreSQL javob qaytaradi",
        body: <>Baza kerakli ma'lumotni topib <b>orqaga qaytaradi</b>: PostgreSQL → Express → React. Shuning uchun to'g'ri yo'l <b>React → Express → PostgreSQL</b>, teskarisi emas.</>,
        vis: <RcFlow items={["PostgreSQL", "Express", "React (ekranda ko'rinadi)"]} />
      },
    ]
  },
};

// Overlay — ekran ustida (indekslarga tegmaydi)
// Overlay — ekran USTIDA ochiladi (indekslarga tegmaydi), slayd-slayd o'tiladi.
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

// ===== MENTOR STATISTIKASI (jonli test paneli — InternetLesson bilan bir xil) =====
const MSTATS_COLORS = ['#019ACB', '#8B5CF6', '#E8A13A', '#E0559A']; // A B C D — brend-neytral
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
  const ok = data.rows.filter(a => a.correct).length;
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
            {level === 'few' && <>
              <p className="mstats-verdict-t">Javob berganlar kam ({answered} ta) — foiz bo'yicha xulosa chiqarish qiyin. O'zingiz baholang:</p>
              {onOpenRecap && <button className="rc-open soft" onClick={onOpenRecap}>📖 Qayta tushuntirish — {RECAPS[screenIdx]?.title}</button>}
            </>}
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

// ===== MENTOR YOZMA-ISH PANELI — s6 (amaliyot) va s15 (yakuniy g'oya) uchun =====
// O'quvchining yozgan MATNI serverga bormaydi (jadval sxemasi) — faqat «tugatdi»
// belgisi boradi. Mentor kim tugatgani/kim yozayotganini jonli ko'radi.
function MentorWorkStats({ live, screenIdx, taskLabel }) {
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
  const doneN = data.rows.length;
  const allIn = total > 0 && doneN >= total;
  const doneIds = new Set(data.rows.map(r => r.player_id));
  return (
    <div className="mstats fade-up">
      <div className="mstats-head">
        <span className="mstats-lbl">✍️ {taskLabel}</span>
        <span className="mstats-n">{allIn ? '✓ Hamma tugatdi!' : <>Tugatdi: <b>{doneN}</b> / {total}</>}</span>
      </div>
      <div className="mstats-prog"><span className={`mstats-prog-fill ${allIn ? 'full' : ''}`} style={{ width: `${total ? Math.round((doneN / total) * 100) : 0}%` }} /></div>
      {total > 0 && (
        <div className="mstats-waitrow">
          {data.players.map(p => <span key={p.id} className="mstats-wait-chip" style={doneIds.has(p.id) ? { background: T.successSoft, color: T.success, fontWeight: 700 } : undefined}>{doneIds.has(p.id) ? '✓ ' : '✏️ '}{p.nickname}</span>)}
        </div>
      )}
      {doneN === 0 && <p className="mstats-wait">O'quvchilar yozib tugatishi bilan shu yerda ✓ belgisi chiqadi…</p>}
    </div>
  );
}

const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, audioText, audioOk, audioWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio(audioText ? [{ id: `s${screen}_intro`, text: audioText, trigger: 'on_mount', waits_for: { type: 'option_picked' } }] : null);
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const oneShot = !!(live && live.mode === 'student'); // jonli dars: BITTA urinish — xato bo'lsa ham qotadi
  const isMentorLive = !!(live && live.mode === 'mentor');
  const mountTs = useRef(Date.now()); // tezlik: savol ochilgandan bosishgacha (teng ballda hal qiladi)
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  // MENTOR (proyektor): o'zi javob BERMAYDI — statistikani kuzatadi, «Natijani ochish»
  // bosganda to'g'ri javob + izoh katta ekranda ochiladi, shundan keyin davom etadi.
  const [mReveal, setMReveal] = useState(() => !!(isMentorLive && storedAnswer));
  // 📖 Qayta tushuntirish (recap) — natija past chiqsa mentor ochadi; o'quvchi xato qilsa o'zi ham ochishi mumkin
  const [recapOpen, setRecapOpen] = useState(false);
  const hasRecap = !!RECAPS[screen];
  // «Natijani ochish» — proyektorda ham, BARCHA o'quvchilar ekranida ham birdan ochiladi (Kahoot reveal)
  const doReveal = () => { setMReveal(true); if (live) live.mentorReveal(screen); if (storedAnswer === undefined) onAnswer(screen, { mentorRevealed: true }); };
  // Mentor sahifani yangilagan bo'lsa — reveal holati serverdan tiklanadi
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
  // KAHOOT REVEAL: jonli darsda javob bosilgach to'g'ri/XATO ham sir saqlanadi —
  // faqat «javob qabul qilindi» ko'rinadi. Mentor «Natijani ochish»ni bosganda
  // (reveal_screen) yoki keyingi sahifaga o'tganda / dars tugaganda hammada birdan ochiladi.
  // Erkin rejimda (ended / mentor uzilgan / self) natija darhol ko'rinadi.
  const revealed = !oneShot || !!(live && (live.revealScreen === screen || live.mentorScreen > screen || live.status === 'ended' || !live.mentorAlive));
  const waiting = oneShot && solved && !revealed; // javob qotdi — natija mentordan kutilmoqda
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow audioState={audioText ? audio : undefined} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? !mReveal : !solved} label={isMentorLive ? (mReveal ? 'Davom etish' : 'Avval natijani oching') : solved ? 'Davom etish' : (oneShot ? 'Javob tanlang' : "To'g'ri javobni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: isMentorLive ? 'flex-start' : 'safe center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        {oneShot && !solved && <p className="small mono fade-up" style={{ margin: '-8px 0 0', color: T.accent, fontWeight: 600 }}>⚡ Jonli dars — bitta urinish, o'ylab bosing!</p>}
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (isMentorLive) {
              if (mReveal) { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; } // reveal'gacha hammasi neytral — proyektorda sir saqlanadi
            } else if (solved) {
              if (waiting) { if (i === picked) cls += ' option-wait'; } // faqat neytral belgi — to'g'ri/xato hali sir
              else { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; if (wrongLocked && i === picked) cls += ' option-picked-wrong'; }
            }
            else if (i === picked) cls += ' option-picked-wrong';
            const showGreenLetter = isMentorLive ? (mReveal && i === correctIdx) : (solved && revealed && i === correctIdx);
            return (
              <button key={i} className={cls} disabled={solved || isMentorLive} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: showGreenLetter ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={isMentorLive ? mReveal : picked !== null} isCorrect={isMentorLive ? true : (solved && !wrongLocked)} neutral={waiting}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: waiting ? T.blue : (isMentorLive || (solved && !wrongLocked)) ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isMentorLive
              ? `✓ To'g'ri javob: ${String.fromCharCode(65 + correctIdx)} — ${options[correctIdx]}`
              : waiting
                ? '📨 Javobingiz qabul qilindi'
                : wrongLocked
                  ? `To'g'ri javob: ${String.fromCharCode(65 + correctIdx)} — ${options[correctIdx]}`
                  : solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}
          </p>
          <p className="body" style={{ margin: 0 }}>
            {isMentorLive
              ? explainCorrect
              : waiting
                ? "Javobingiz yozib olindi 🤫 To'g'rimi-xatomi — hozircha sir! Mentor «Natijani ochish»ni bosganda hammada birdan ko'rinadi."
                : wrongLocked
                  ? (explainWrong[picked] ?? explainWrong.default)
                  : solved ? explainCorrect : (explainWrong[picked] ?? explainWrong.default)}
          </p>
          {/* Xato qilgan o'quvchi mavzuni qisqa kartalarda qayta ko'radi (3-qadamda kontent keladi).
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

// ===== MENTOR (matn, audiosiz) =====
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

// ===== 4 TEXNOLOGIYA (PERN) — yagona manba =====
const TECH = [
  { key: 'react',    name: 'React',      color: '#019ACB', soft: '#E2F4FA', rest: 'Zal',       role: "Ko'rinish — foydalanuvchi ko'radigan va bosadigan hamma narsa", side: 'Frontend' },
  { key: 'express',  name: 'Express',    color: '#FF4F28', soft: '#FFE8E1', rest: 'Ofitsiant', role: "Yo'llar — so'rovni qabul qiladi va kerakli joyga yetkazadi", side: 'Backend' },
  { key: 'node',     name: 'Node.js',    color: '#1F7A4D', soft: '#E3F0E8', rest: 'Oshxona',   role: "Dvigatel — JavaScript'ni serverda ishlatadi", side: 'Backend' },
  { key: 'postgres', name: 'PostgreSQL', color: '#7C3AED', soft: '#EFE9FB', rest: 'Ombor',     role: "Xotira — ma'lumotlarni doimiy saqlaydi", side: 'Baza' }
];
const techBy = (k) => TECH.find(t => t.key === k);

// Texnologiya nishoni (rangli doira + nom)
const TechTag = ({ k, small }) => {
  const t = techBy(k);
  return (
    <span className="ttag" style={{ background: t.soft, color: t.color, fontSize: small ? 11.5 : 12.5 }}>
      <span className="ttag-dot" style={{ background: t.color }} />{t.name}
    </span>
  );
};

// Mini brauzer oynasi
const BWindow = ({ url = 'mening-saytim.uz', children, minH }) => (
  <div className="bw" style={minH ? { minHeight: minH } : undefined}>
    <div className="bw-bar">
      <span className="bw-dot" style={{ background: '#FF5F56' }} /><span className="bw-dot" style={{ background: '#FFBD2E' }} /><span className="bw-dot" style={{ background: '#27C93F' }} />
      <span className="bw-url mono">{url}</span>
    </div>
    <div className="bw-body">{children}</div>
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

// ===== SCREEN 0 — HOOK (izoh yo'qoldi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [comments, setComments] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [lost, setLost] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const POOL = [
    { name: 'Aziz', text: "Zo'r sayt ekan, tabriklayman!", time: '2 daqiqa oldin', color: '#019ACB' },
    { name: 'Malika', text: 'Menga ham juda yoqdi, ofarin', time: '1 daqiqa oldin', color: '#FF4F28' },
    { name: 'Sardor', text: 'Qoyil — buni qanday yasading?', time: 'hozirgina', color: '#7C3AED' }
  ];
  const OPTS = [
    { id: 'a', label: 'Internet uzilib qoldi' },
    { id: 'b', label: 'Izoh hech qayerda saqlanmagan edi' },
    { id: 'c', label: 'Sayt butunlay buzilib qoldi' }
  ];
  const addComment = () => setComments(c => (c.length < POOL.length ? [...c, POOL[c.length]] : c));
  const refresh = () => {
    if (comments.length === 0 || spinning) return;
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setComments([]); setLost(true); }, 700);
  };
  const pick = (v) => { if (picked !== null || !lost) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Izohingiz <span className="italic" style={{ color: T.accent }}>qayoqqa</span> yo'qoldi?</h1>
        <Mentor>Siz AI bilan chiroyli sayt yasadingiz. Do'stlaringiz unga izoh yozdi. Endi tajriba: avval <b style={{ color: T.ink }}>izoh qoldiring</b>, keyin <b style={{ color: T.ink }}>sahifani yangilang</b> — nima bo'lishini kuzating.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <BWindow minH={170}>
              {spinning ? (
                <div className="bw-spin"><span className="spinner" /> yuklanmoqda…</div>
              ) : (
                <>
                  <p className="bw-h">Mening saytim</p>
                  <p className="bw-sub">Izohlar ({comments.length}):</p>
                  {comments.length === 0
                    ? <p className="bw-empty">{lost ? 'Izohlar yo’q… hammasi yo’qoldi!' : 'Hozircha izoh yo’q'}</p>
                    : comments.map((c, i) => (
                        <div key={i} className="cmt el-in">
                          <span className="cmt-ava" style={{ background: c.color }}>{c.name[0]}</span>
                          <div className="cmt-col">
                            <div className="cmt-top"><span className="cmt-name">{c.name}</span><span className="cmt-time">{c.time}</span></div>
                            <span className="cmt-text">{c.text}</span>
                          </div>
                        </div>
                      ))}
                </>
              )}
            </BWindow>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={addComment} disabled={spinning || comments.length >= POOL.length}>Izoh qoldirish</button>
              <button className="btn-soft" onClick={refresh} disabled={comments.length === 0 || spinning} style={{ boxShadow: comments.length > 0 && !lost ? `0 0 0 1.5px ${T.accent}` : undefined }}>Sahifani yangilash ⟳</button>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>{lost ? 'Sizningcha, nega izohlar yo’qoldi?' : 'Avval chap tomonda tajriba qiling'}</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9, opacity: lost ? 1 : 0.45 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !lost} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Aynan shunday! Saytingiz izohni <b>eslab qolishni bilmaydi</b> — unga ko'rinmas jamoa kerak: server va baza. Bugun ana shu jamoa bilan tanishamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// 4 texnologiya → birlashib → bitta yaxlit sayt (animatsiyali)
const PernAssemble = () => (
  <div className="assemble">
    <div className="asm-pieces">
      {TECH.map((t, i) => (
        <div key={t.key} className="asm-chip" style={{ background: t.soft, color: t.color, animationDelay: `${0.1 + i * 0.13}s` }}>
          <span className="asm-dot" style={{ background: t.color }} />{t.name}
        </div>
      ))}
    </div>
    <div className="asm-merge"><span className="asm-arrow">↓</span> birlashib — bitta sayt</div>
    <div className="asm-site">
      <span className="asm-badge">✓ Bitta ishlaydigan sayt</span>
      <BWindow url="mening-saytim.uz" minH={118}>
        <div className="rb rb-header">Mening do'konim</div>
        <div className="rb rb-card"><span className="rb-thumb" /><span>Krossovka — 250 000 so'm</span></div>
        <button className="rb rb-btn">Savatga qo'shish</button>
      </BWindow>
    </div>
  </div>
);

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Frontend va Backend', tag: 'ikki dunyo' },
    { text: "React — ko'rinish", tag: 'frontend' },
    { text: 'Node.js — JS serverda', tag: 'backend' },
    { text: 'Express va PostgreSQL', tag: "yo'llar + ombor" },
    { text: "To'liq sayohat", tag: 'PERN' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">4 ta texnologiya → bitta yaxlit sayt</p>
      <PernAssemble />
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">5 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head">
          <h2 className="title h-title fade-up">Katta saytlar <span className="italic" style={{ color: T.accent }}>qanday</span> quriladi?</h2>
        </div>
        <Mentor>Bugun yangi kod yozmaymiz — <b style={{ color: T.ink }}>xarita</b> olamiz. YouTube ham, Telegram ham 4 texnologiya jamoasi ustida turadi. Shu jamoani bilsangiz, keyingi modullar aniq xaritaga aylanadi.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Jamoani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — FRONTEND vs BACKEND (restoran) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const INFO = {
    zal: { title: 'Zal = FRONTEND', color: T.blue, soft: T.blueSoft, lines: ['Mehmon KO’RADIGAN qism', 'Saytda: tugmalar, ranglar, kartochkalar, animatsiyalar', 'Siz buni allaqachon qilgansiz — HTML, CSS, JS!'] },
    osh: { title: 'Oshxona = BACKEND', color: T.success, soft: T.successSoft, lines: ['Mehmon KO’RMAYDIGAN qism — lekin asosiy ish shu yerda', 'Saytda: parolni tekshirish, izohni saqlash, pul o’tkazish', 'Bugun aynan shu dunyoga kiramiz'] }
  };
  const cur = active ? INFO[active] : null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Frontend va Backend" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala xonani ko’ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Restoranning qaysi qismini mehmon <span className="italic" style={{ color: T.accent }}>ko'radi</span>?</h2></div>
        <Mentor>Har bir sayt — restoranga o'xshaydi. Mehmon <b style={{ color: T.ink }}>zalni</b> ko'radi: stol, menyu, taom. Lekin taom <b style={{ color: T.ink }}>oshxonada</b> tayyorlanadi — mehmon u yerga kirmaydi. Ikkala xonani bosib, sayt bilan solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className={`rest-card ${active === 'zal' ? 'on' : ''}`} onClick={() => tap('zal')}>
                <span className="rest-ic" style={{ background: T.blueSoft, color: T.blue }}>Z</span>
                <span className="rest-body"><b>Zal</b><span className="small" style={{ color: T.ink2 }}>stol · menyu · taom {seen.has('zal') && '✓'}</span></span>
              </button>
              <button className={`rest-card ${active === 'osh' ? 'on' : ''}`} onClick={() => tap('osh')}>
                <span className="rest-ic" style={{ background: T.successSoft, color: T.success }}>O</span>
                <span className="rest-body"><b>Oshxona</b><span className="small" style={{ color: T.ink2 }}>oshpaz · pech · ombor {seen.has('osh') && '✓'}</span></span>
              </button>
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.title}</span></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  {cur.lines.map((l, i) => (<p key={i} className="body" style={{ margin: 0, color: T.ink }}>{i === 0 ? <b>{l}</b> : l}</p>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Xonani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>Frontend</b> — siz ko'rgan hamma narsa. <b>Backend</b> — ko'rinmas, lekin izohni saqlaydigan, parolni tekshiradigan kuch. Hook'dagi izoh yo'qoldi, chunki saytimizda backend yo'q edi!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REACT (bloklardan ko'rinish) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { key: 'header', label: 'Header' },
    { key: 'card', label: 'Karta' },
    { key: 'btn', label: 'Tugma' }
  ];
  const [added, setAdded] = useState([]);
  const done = added.length >= 3;
  const add = (k) => setAdded(a => (a.includes(k) ? a : [...a, k]));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="React" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${added.length}/3 blokni qo'shing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Katta saytni mayda <span className="italic" style={{ color: T.blue }}>bloklardan</span> qanday yig'amiz?</h2></div>
        <Mentor>Frontend dunyosining yulduzi — <b style={{ color: T.blue }}>React</b>. G'oyasi oddiy: sayt <b style={{ color: T.ink }}>bloklardan</b> yig'iladi (xuddi LEGO'dek!). Bitta "Karta" blokini bir marta yasaysiz — keyin uni minglab mahsulot uchun qayta ishlatasiz. Quyidagi bloklarni bosib, sahifani yig'ing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Bloklar (komponentlar)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PARTS.map(p => (<button key={p.key} className={`chip ${added.includes(p.key) ? 'chip-on' : ''}`} onClick={() => add(p.key)}><span className="mono">{'<'}{p.label}{' />'}</span>{added.includes(p.key) && ' ✓'}</button>))}
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(12px,1.8vw,14px)' }}>
              <div><KW>function</KW> <FN>Sayt</FN>() {'{'}</div>
              <div>{'  '}<KW>return</KW> (</div>
              {added.length === 0 && <div>{'    '}<CM>// bloklarni qo'shing…</CM></div>}
              {added.map(k => { const p = PARTS.find(x => x.key === k); return <div key={k} className="el-in">{'    '}<STR>{'<'}{p.label}{' />'}</STR></div>; })}
              <div>{'  '})</div>
              <div>{'}'}</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija — ekranda</p>
            <BWindow minH={150}>
              {added.length === 0 && <p className="bw-empty">bo'sh sahifa…</p>}
              {added.includes('header') && <div className="rb rb-header el-in">Mening do'konim</div>}
              {added.includes('card') && <div className="rb rb-card el-in"><span className="rb-thumb" /><span>Krossovka — 250 000 so'm</span></div>}
              {added.includes('btn') && <button className="rb rb-btn el-in">Savatga qo'shish</button>}
            </BWindow>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b style={{ color: T.blue }}>React</b> — frontend kutubxonasi: ko'rinishni bloklardan yig'adi. Keyingi modul <b>to'liq React'ga</b> bag'ishlanadi — o'z bloklaringizni yasaysiz!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Saytning foydalanuvchi ko'radigan va bosadigan qismi nima deb ataladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Saytning foydalanuvchi <span className="italic" style={{ color: T.accent }}>ko'radigan</span> qismi nima deb ataladi?</h2></>}
    options={['Backend', 'Frontend', 'Baza (database)', 'Server']} correctIdx={1}
    explainCorrect="To'g'ri! Frontend — ekrandagi hamma narsa: tugmalar, ranglar, kartochkalar. Restorandagi zal kabi."
    explainWrong={{
      0: "Backend — aksincha, ko'rinmas qism (oshxona). Ko'rinadigan qism — frontend.",
      2: "Baza ma'lumotni saqlaydi, u ham ko'rinmas qismda. Ko'rinadigani — frontend.",
      3: "Server — backend ishlaydigan kompyuter. Foydalanuvchi ko'radigani — frontend.",
      default: "Ko'rinadigan qism — frontend."
    }} />
);

// ===== SCREEN 5 — NODE.JS (JS serverda) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [place, setPlace] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setPlace(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Node.js" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala joyda ishlating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">JavaScript brauzerdan tashqarida <span className="italic" style={{ color: T.success }}>yashay oladimi</span>?</h2></div>
        <Mentor>Siz JS'ni brauzerda yozdingiz. Lekin sir bor: <b style={{ color: T.success }}>Node.js</b> degan dvigatel JS'ni <b style={{ color: T.ink }}>serverda</b> ham ishlata oladi — restoran oshxonasidagi pech kabi. Bitta kodni ikki joyda ishlatib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Kod bitta — joy ikkita</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${place === 'browser' ? 'chip-on' : ''}`} onClick={() => tap('browser')}>Brauzerda{seen.has('browser') && ' ✓'}</button>
              <button className={`chip ${place === 'server' ? 'chip-on' : ''}`} onClick={() => tap('server')}>Serverda (Node.js){seen.has('server') && ' ✓'}</button>
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(12.5px,1.9vw,14.5px)' }}>
              <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom, dunyo!"</STR>)</div>
            </div>
          </Col>
          <Col>
            {place ? (
              <div className="demo-swap" key={place} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {place === 'browser' ? (
                  <BWindow minH={110}>
                    <p className="bw-sub mono" style={{ margin: 0 }}>Console</p>
                    <div className="cmt mono el-in">› Salom, dunyo!</div>
                  </BWindow>
                ) : (
                  <div className="term">
                    <div className="term-bar"><span className="term-dot" style={{ background: '#FF5F56' }} /><span className="term-dot" style={{ background: '#FFBD2E' }} /><span className="term-dot" style={{ background: '#27C93F' }} /><span className="term-title">server terminali</span></div>
                    <div className="term-body">
                      <div className="term-line"><span className="term-arrow">$</span><span>node salom.js</span></div>
                      <div className="term-line el-in"><span className="term-arrow">›</span><span>Salom, dunyo!</span></div>
                    </div>
                  </div>
                )}
                <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{place === 'browser' ? "Bu sizga tanish — JS brauzerda, frontendda ishlayapti." : <span><b style={{ color: T.success }}>Node.js</b> — JS endi serverda! Brauzersiz, oshxonada. Backend ham — siz bilgan til!</span>}</p></div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Joyni tanlang</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Bitta til — ikki dunyo. JS bilganingiz uchun siz <b>backend'ga tayyorsiz</b>: yangi til o'rganish shart emas!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Node.js nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.success }}>Node.js</span> nima qiladi?</h2></>}
    options={['Sahifani bezaydi (CSS kabi)', "JavaScript'ni serverda ishlatadi", 'Rasmlarni tahrirlaydi', 'Internet tezligini oshiradi']} correctIdx={1}
    explainCorrect="To'g'ri! Node.js — dvigatel: JS kodini brauwersiz, serverda ishlatadi. Backend shu dvigatel ustida quriladi."
    explainWrong={{
      0: "Bezash — CSS'ning ishi, frontendda. Node.js esa JS'ni serverda ishlatadi.",
      2: "Yo'q, Node.js rasm bilan ishlamaydi — u JS'ni serverda ishlatadigan dvigatel.",
      3: "Tezlikka aloqasi yo'q — Node.js JS'ni serverda ishlatadi.",
      default: "Node.js — JS'ni serverda ishlatadigan dvigatel."
    }} />
);

// ===== SCREEN 6 — EXPRESS (ofitsiant / yo'llar) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MENU = [
    { key: 'palov', label: 'Palov', path: '/palov' },
    { key: 'lagmon', label: "Lag'mon", path: '/lagmon' },
    { key: 'choy', label: 'Choy', path: '/choy' }
  ];
  const [order, setOrder] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setOrder(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const cur = MENU.find(m => m.key === order);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Express" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 buyurtma bering`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server minglab so'rovni qanday <span className="italic" style={{ color: T.accent }}>adashtirmaydi</span>?</h2></div>
        <Mentor>Restoranda buyurtmani <b style={{ color: T.accent }}>ofitsiant</b> oladi: eshitadi, oshxonaga yetkazadi, taomni qaytaradi. Serverda bu ishni <b style={{ color: T.accent }}>Express</b> qiladi: har taomning o'z <b style={{ color: T.ink }}>yo'li</b> bor. Buyurtma berib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Menyu — buyurtma bering</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MENU.map(m => (<button key={m.key} className={`chip ${order === m.key ? 'chip-on' : ''}`} onClick={() => tap(m.key)}>{m.label}{seen.has(m.key) && ' ✓'}</button>))}
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(11.5px,1.7vw,13.5px)' }}>
              <div><CM>// Express — har taomning yo'li</CM></div>
              {MENU.map(m => (
                <div key={m.key} style={{ background: order === m.key ? 'rgba(31,122,77,0.25)' : 'transparent', borderRadius: 4, opacity: order && order !== m.key ? 0.45 : 1, padding: '1px 3px' }}>
                  <FN>app</FN>.<KW>get</KW>(<STR>'{m.path}'</STR>, …)
                </div>
              ))}
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="demo-swap" key={order} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="jr-mini">
                  <span className="jr-mini-step">Siz</span><span className="jr-mini-arr">→</span>
                  <span className="jr-mini-step" style={{ color: T.accent, fontWeight: 700 }}>Express</span><span className="jr-mini-arr">→</span>
                  <span className="jr-mini-step">Oshxona</span><span className="jr-mini-arr">→</span>
                  <span className="jr-mini-step" style={{ color: T.success, fontWeight: 700 }}>Tayyor!</span>
                </div>
                <div style={{ background: T.paper, borderRadius: 14, padding: '18px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
                  <p className="mono small" style={{ margin: '0 0 6px', color: T.ink2 }}>GET {cur.path}</p>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: T.success, margin: 0, fontSize: 'clamp(16px,2.4vw,20px)' }}>{cur.label} tayyor!</p>
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Taomni tanlang</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b style={{ color: T.accent }}>Express</b> — Node.js ustidagi "ofitsiant": so'rovni qabul qiladi, yo'lini topadi, javob qaytaradi. Har manzil (<span className="mono">/palov</span>) — bitta yo'l (route).</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — POSTGRESQL (ombor / jadval) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = [
    { id: 1, item: 'Palov', who: 'Aziz' },
    { id: 2, item: "Lag'mon", who: 'Malika' },
    { id: 3, item: 'Choy', who: 'Sardor' }
  ];
  const [rows, setRows] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [restarted, setRestarted] = useState(false);
  const done = rows.length >= 2 && restarted;
  const addRow = () => setRows(r => (r.length < POOL.length ? [...r, POOL[r.length]] : r));
  const restart = () => {
    if (rows.length === 0 || spinning) return;
    setSpinning(true);
    setTimeout(() => { setSpinning(false); setRestarted(true); }, 800);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="PostgreSQL" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (rows.length < 2 ? 'Buyurtma qo’shing' : 'Serverni o’chirib-yoqing')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumot qayerda <span className="italic" style={{ color: T.purple }}>joylashadi</span>?</h2></div>
        <Mentor>Hook'dagi izohlar yo'qoldi, chunki ular hech qayerda yozilmagan edi. <b style={{ color: T.purple }}>PostgreSQL</b> — bu ombor daftari: ma'lumot <b style={{ color: T.ink }}>jadvalga</b> yoziladi va o'chmaydi. Buyurtma qo'shing, so'ng serverni o'chirib-yoqib sinang!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={addRow} disabled={spinning || rows.length >= POOL.length}>+ Buyurtma qo'shish</button>
              <button className="btn-soft" onClick={restart} disabled={rows.length === 0 || spinning} style={{ boxShadow: rows.length >= 2 && !restarted ? `0 0 0 1.5px ${T.accent}` : undefined }}>Serverni o'chirib-yoqish ⏻</button>
            </div>
            <div className="codebox fade-up delay-2" style={{ fontSize: 'clamp(11.5px,1.7vw,13px)' }}>
              <div><CM>-- SQL: jadvalga yozish</CM></div>
              <div><KW>INSERT INTO</KW> buyurtmalar …</div>
            </div>
            {spinning && <p className="small mono fade-step" style={{ color: T.accent, margin: 0 }}>server o'chirilmoqda… yoqilmoqda…</p>}
          </Col>
          <Col>
            <p className="flow-label">Jadval: buyurtmalar</p>
            <div className="dbt fade-up delay-2" style={{ opacity: spinning ? 0.35 : 1 }}>
              <div className="dbt-row dbt-head"><span>id</span><span>taom</span><span>kim</span></div>
              {rows.length === 0
                ? <div className="dbt-empty">bo'sh jadval…</div>
                : rows.map(r => (<div key={r.id} className="dbt-row el-in"><span className="mono">{r.id}</span><span>{r.item}</span><span>{r.who}</span></div>))}
            </div>
            {restarted && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Server o'chib-yondi — ma'lumot <b>joyida!</b> Mana hook'dagi muammoning yechimi: <b style={{ color: T.purple }}>PostgreSQL</b> — doimiy xotira. Izoh endi hech qachon yo'qolmaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SAYOHAT QADAMLARI (s8 va s15 uchun yagona manba) =====
const JOURNEY = [
  { who: 'react', t: 'Siz like tugmasini bosdingiz', d: 'React buni darhol payqadi' },
  { who: 'react', t: "React serverga so'rov yubordi", d: 'POST /like — xat jo’nadi' },
  { who: 'express', t: 'Express so’rovni qabul qildi', d: "Node.js ichida kerakli yo'l topildi" },
  { who: 'postgres', t: 'PostgreSQL yozib qo’ydi', d: 'jadvalda like +1' },
  { who: 'react', t: 'Javob qaytdi — yurak qizardi', d: 'hammasi 1 soniyadan tez!' }
];

// ===== SCREEN 8 — TO'LIQ SAYOHAT (animatsiya) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [at, setAt] = useState(-1);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const done = finished;
  const start = () => { if (running) return; setRunning(true); setAt(-1); };
  useEffect(() => {
    if (!running) return;
    if (at >= JOURNEY.length - 1) { setRunning(false); setFinished(true); return; }
    const t = setTimeout(() => setAt(a => a + 1), at === -1 ? 300 : 750);
    return () => clearTimeout(t);
  }, [running, at]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="To'liq sayohat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sayohatni boshlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Like bosilganda 1 soniyada <span className="italic" style={{ color: T.accent }}>nima bo'ladi</span>?</h2></div>
        <Mentor>Endi 4 texnologiyani <b style={{ color: T.ink }}>birga</b> ko'ramiz. Siz video ostidagi yurakchani bosasiz — va ko'z ochib-yumguncha to'rt qahramon ishga tushadi. Tugmani bosib, sayohatni kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" onClick={start} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Sayohat ketmoqda…' : (finished ? '↻ Yana bir bor' : '▶ Sayohatni boshlash')}</button>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {JOURNEY.map((s, i) => {
                const tech = techBy(s.who);
                const on = i <= at;
                const cur = i === at;
                return (
                  <div key={i} className={`jr-step ${on ? 'on' : ''} ${cur ? 'cur' : ''}`} style={on ? { boxShadow: `inset 0 0 0 1.5px ${tech.color}` } : undefined}>
                    <span className="jr-num" style={{ background: on ? tech.color : T.ink3 }}>{i + 1}</span>
                    <span className="jr-body">
                      <span className="jr-t">{s.t}</span>
                      {on && <span className="jr-d el-in">{s.d}</span>}
                    </span>
                    <span className="jr-tag" style={{ color: tech.color, background: on ? tech.soft : 'transparent', opacity: on ? 1 : 0.4 }}>{tech.name}</span>
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <BWindow url="ijtimoiy-tarmoq.uz" minH={150}>
              <div className="rb rb-card" style={{ marginBottom: 8 }}><span className="rb-thumb" style={{ background: '#cfe8f5' }} /><span>Mushukcha videosi</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24, filter: finished || at >= 4 ? 'none' : 'grayscale(1)', transition: 'filter 0.3s' }}>❤️</span>
                <span className="mono" style={{ fontWeight: 700, color: finished || at >= 3 ? T.accent : T.ink3 }}>{finished || at >= 3 ? '1 025' : '1 024'}</span>
                <span className="small" style={{ color: T.ink3 }}>like</span>
              </div>
            </BWindow>
            {finished && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mana — <b>to'liq stack ishda</b>: React ko'rsatdi, Express yo'lladi, Node yurgizdi, PostgreSQL esladi. Siz har kuni millionlab shunday sayohatga sabab bo'lasiz!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Like, izoh va boshqa ma'lumotlar doimiy qayerda saqlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Like va izohlar <span className="italic" style={{ color: T.accent }}>doimiy</span> qayerda saqlanadi?</h2></>}
    options={['Brauzerda', 'Telefon ekranida', 'PostgreSQL bazasida', 'CSS faylida']} correctIdx={2}
    explainCorrect="To'g'ri! Baza (PostgreSQL) — doimiy ombor: server o'chib-yonsa ham ma'lumot joyida qoladi."
    explainWrong={{
      0: "Brauzer sahifa yangilanganda unutadi — hook'da ko'rdik! Doimiy joy — baza.",
      1: "Ekran faqat ko'rsatadi, saqlamaydi. Doimiy joy — PostgreSQL bazasi.",
      3: "CSS — bezak tili, ma'lumot saqlamaydi. Doimiy joy — baza.",
      default: "Doimiy saqlash — PostgreSQL bazasining ishi."
    }} />
);

// ===== SCREEN 10 — PERN = JAMOA (4 karta) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const cur = active ? techBy(active) : null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="PERN jamoasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 a'zoni taniqing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'rt texnologiya — nega <span className="italic" style={{ color: T.accent }}>bitta jamoa</span>?</h2></div>
        <Mentor>Futbol jamoasida darvozabon, himoyachi, yarim himoyachi, hujumchi bor — har birining o'z roli. Saytda ham shunday. To'rt a'zoning har birini bosib, rolini bilib oling.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {TECH.map(t => (
                <button key={t.key} className={`tech-card ${active === t.key ? 'on' : ''}`} onClick={() => tap(t.key)} style={active === t.key ? { boxShadow: `inset 0 0 0 2px ${t.color}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` } : undefined}>
                  <span className="pean-badge" style={{ background: t.color }}>{t.name[0]}</span>
                  <span style={{ fontWeight: 700, fontSize: 'clamp(13px,1.7vw,15px)' }}>{t.name}</span>
                  <span className="small" style={{ color: T.ink3 }}>{seen.has(t.key) ? '✓ tanishdik' : t.side}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: cur.color, background: cur.soft }}>{cur.name}</span><span style={{ fontWeight: 600, color: T.ink }}>{cur.side}</span></span>
                <p className="body" style={{ color: T.ink, margin: '10px 0 4px' }}>{cur.role}</p>
                <p className="small" style={{ color: T.ink2, margin: 0 }}>Restoranda: <b style={{ color: cur.color }}>{cur.rest}</b></p>
              </div>
            ) : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>A'zoni bosing</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu jamoaning nomi — <b style={{ color: T.accent }}>PERN stack</b>: <b>P</b>ostgreSQL + <b>E</b>xpress + <b>R</b>eact + <b>N</b>ode.js. <b>Stack</b> — bir-birini to'ldiruvchi texnologiyalar to'plami.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — KIM NIMA QILADI? (vazifa-tester) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { q: "Tugmani ko'k rangga bo'yab, bosilganda animatsiya qilish", a: 'react', hint: "Bu ko'rinadigan ish — zal." },
    { q: "/profil manziliga kelgan so'rovni qabul qilib yo'naltirish", a: 'express', hint: "Bu yo'l topish ishi — ofitsiant." },
    { q: "Foydalanuvchilar ro'yxatini doimiy eslab qolish", a: 'postgres', hint: 'Bu xotira ishi — ombor.' }
  ];
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [solvedAll, setSolvedAll] = useState(false);
  const done = solvedAll;
  const cur = TASKS[Math.min(idx, TASKS.length - 1)];
  const pick = (k) => {
    if (solvedAll) return;
    if (k === cur.a) {
      setWrong(null);
      if (idx >= TASKS.length - 1) setSolvedAll(true);
      else setIdx(i => i + 1);
    } else setWrong(k);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vazifa taqsimoti" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Vazifa ${Math.min(idx + 1, TASKS.length)}/${TASKS.length}`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu vazifani <span className="italic" style={{ color: T.accent }}>qaysi texnologiya</span> bajaradi?</h2></div>
        <Mentor>Endi siz jamoa sardorisiz! Har vazifani <b style={{ color: T.ink }}>to'g'ri texnologiyaga</b> topshiring. O'ylab ko'ring: bu ish ko'rinadimi (zal), yo'l topishmi (ofitsiant), saqlashmi (ombor)?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Vazifa {Math.min(idx + 1, TASKS.length)} / {TASKS.length}</p>
            <div className="task-card demo-swap" key={solvedAll ? 'fin' : idx}>
              <p className="body" style={{ margin: 0, color: T.ink, fontWeight: 600 }}>{solvedAll ? 'Barcha vazifalar taqsimlandi!' : cur.q}</p>
            </div>
            {!solvedAll && (
              <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TECH.map(t => (
                  <button key={t.key} className={`chip ${wrong === t.key ? 'chip-bad' : ''}`} onClick={() => pick(t.key)}>
                    <span className="ttag-dot" style={{ background: t.color }} />{t.name}
                  </button>
                ))}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Taqsimot</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TASKS.map((t, i) => {
                const ok = solvedAll || i < idx;
                const tech = techBy(t.a);
                return (
                  <div key={i} className={ok ? 'jr-step on el-in' : 'jr-step'} style={ok ? { boxShadow: `inset 0 0 0 1.5px ${tech.color}` } : { opacity: 0.45 }}>
                    <span className="jr-body"><span className="jr-t" style={{ fontSize: 'clamp(12.5px,1.5vw,14px)' }}>{t.q}</span></span>
                    {ok && <span className="jr-tag" style={{ color: tech.color, background: tech.soft }}>{tech.name}</span>}
                  </div>
                );
              })}
            </div>
            {wrong !== null && !solvedAll && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{techBy(wrong).name} emas. Maslahat: {cur.hint}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r taqsimladingiz! Har texnologiya — o'z ishining ustasi. Birini olib tashlasangiz, jamoa to'xtaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Buyurtma tugmasi bosilganda so'rov qaysi yo'l bilan boradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tugma bosilganda so'rov qaysi <span className="italic" style={{ color: T.accent }}>yo'l</span> bilan boradi?</h2></>}
    options={['PostgreSQL → React → Express', 'React → Express → PostgreSQL', 'Express → React → PostgreSQL', 'React → PostgreSQL → Express']} correctIdx={1}
    explainCorrect="To'g'ri! Avval ko'rinish (React), so'rov ofitsiantga (Express), u esa omborga (PostgreSQL). Javob xuddi shu yo'ldan qaytadi."
    explainWrong={{
      0: "Baza o'zi boshlamaydi — sayohat foydalanuvchidan, ya'ni React'dan boshlanadi.",
      2: "Express so'rovni qabul qiladi, lekin sayohat React'dan (tugmadan) boshlanadi.",
      3: "React bazaga to'g'ridan-to'g'ri bormaydi — avval Express qabul qilib yo'naltiradi.",
      default: "Yo'l: React → Express → PostgreSQL."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'Z STACKINGIZNI YIG'ING =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SLOTS = [
    { key: 'view', label: "Ko'rinish", sub: 'kartochkalar, tugmalar', a: 'react' },
    { key: 'engine', label: 'Dvigatel', sub: 'JS serverda', a: 'node' },
    { key: 'routes', label: "Yo'llar", sub: "so'rovlarni qabul qilish", a: 'express' },
    { key: 'store', label: 'Ombor', sub: 'buyurtmalarni saqlash', a: 'postgres' }
  ];
  const [assign, setAssign] = useState({});
  const [activeSlot, setActiveSlot] = useState('view');
  const [checked, setChecked] = useState(false);
  const [allOk, setAllOk] = useState(false);
  const usedTech = Object.values(assign);
  const full = SLOTS.every(s => assign[s.key]);
  const done = allOk;
  const tapSlot = (k) => {
    setChecked(false);
    if (assign[k]) { setAssign(a => { const n = { ...a }; delete n[k]; return n; }); setActiveSlot(k); }
    else setActiveSlot(k);
  };
  const tapTech = (tk) => {
    if (!activeSlot || usedTech.includes(tk) || allOk) return;
    setChecked(false);
    setAssign(a => {
      const n = { ...a, [activeSlot]: tk };
      const nextEmpty = SLOTS.find(s => !n[s.key]);
      setActiveSlot(nextEmpty ? nextEmpty.key : null);
      return n;
    });
  };
  const launch = () => {
    if (!full) return;
    setChecked(true);
    if (SLOTS.every(s => assign[s.key] === s.a)) setAllOk(true);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · stack yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Stackni yig’ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mini-do'kon jamoasini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> tuzing</h2></div>
        <Mentor>Tez orada <b style={{ color: T.ink }}>mini-do'kon</b> qurasiz — unga jamoa kerak! Texnologiyani tanlab vazifaga biriktiring, so'ng <b style={{ color: T.ink }}>Ishga tushirish</b>!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">1 — texnologiyani tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TECH.map(t => {
                const used = usedTech.includes(t.key);
                return (
                  <button key={t.key} className="chip" disabled={used || allOk} onClick={() => tapTech(t.key)} style={{ opacity: used ? 0.35 : 1, padding: '7px 12px', fontSize: 13 }}>
                    <span className="ttag-dot" style={{ background: t.color }} />{t.name}
                  </button>
                );
              })}
            </div>
            <p className="flow-label">2 — vazifalarga biriktiring</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SLOTS.map(s => {
                const tk = assign[s.key];
                const tech = tk ? techBy(tk) : null;
                const isBad = checked && tk && tk !== s.a && !allOk;
                const isOk = (checked || allOk) && tk === s.a;
                return (
                  <button key={s.key} className={`slotx ${activeSlot === s.key && !tk ? 'act' : ''} ${isBad ? 'bad' : ''} ${isOk ? 'ok' : ''}`} onClick={() => tapSlot(s.key)}>
                    <span className="slotx-l"><b>{s.label}</b><span className="small" style={{ color: T.ink3 }}>{s.sub}</span></span>
                    {tech ? <span className="ttag" style={{ background: tech.soft, color: tech.color }}><span className="ttag-dot" style={{ background: tech.color }} />{tech.name}</span> : <span className="small" style={{ color: T.ink3, fontStyle: 'italic' }}>bo'sh</span>}
                  </button>
                );
              })}
            </div>
          </Col>
          <Col>
            <button className="btn fade-up delay-2" onClick={launch} disabled={!full || allOk} style={{ alignSelf: 'flex-start' }}>▶ Ishga tushirish</button>
            {allOk ? (
              <div className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <BWindow url="mini-dokon.uz" minH={120}>
                  <div className="rb rb-header el-in">Mini do'kon</div>
                  <div className="rb rb-card el-in"><span className="rb-thumb" /><span>Krossovka — 250 000 so'm</span></div>
                  <button className="rb rb-btn el-in">Savatga qo'shish</button>
                </BWindow>
                <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Do'kon ishga tushdi! Jamoa to'g'ri yig'ildi — endi izohlar ham, buyurtmalar ham yo'qolmaydi.</p></div>
              </div>
            ) : checked && full ? (
              <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qizil kartochkalar noto'g'ri joyda. Ularni bosib bo'shating va qayta biriktiring. Eslang: zal, pech, ofitsiant, daftar.</p></div>
            ) : (
              <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Maslahat: <b style={{ color: T.ink }}>ko'rinish</b> — zal, <b style={{ color: T.ink }}>dvigatel</b> — oshxona pechi, <b style={{ color: T.ink }}>yo'llar</b> — ofitsiant, <b style={{ color: T.ink }}>ombor</b> — daftar.</p></div>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (AI rollarni adashtirdi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'pg' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'pg';
  const done = fixed;
  const LINES = [
    { key: 'react', text: 'React — sahifadagi kartochka va tugmalarni chizadi', ok: true },
    { key: 'pg', text: fixed ? "PostgreSQL — ma'lumotlarni jadvalda doimiy saqlaydi" : 'PostgreSQL — sahifaga chiroyli tugmalar chizadi', ok: false },
    { key: 'express', text: "Express — so'rovlarni qabul qilib yo'naltiradi", ok: true },
    { key: 'node', text: "Node.js — JavaScript'ni serverda ishlatadi", ok: true }
  ];
  const tap = (k) => {
    if (found) return;
    setPicked(k);
  };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI jamoani tushuntirdi — lekin bitta rol <span className="italic" style={{ color: T.accent }}>adashgan</span>?</h2></div>
        <Mentor>AI'dan PERN jamoasini tushuntirishni so'radik. U deyarli to'g'ri yozdi, lekin <b style={{ color: T.ink }}>bitta a'zoning roli</b> adashib ketdi. Siz endi stackni bilasiz — xato qatorni toping va bosing!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">PERN jamoasi rollari:</span></div>
              <div className="ai-code">
                {LINES.map(l => (
                  <div key={l.key} className={`ai-line ${found && l.key === 'pg' ? (fixed ? 'ok' : 'bad') : ''}`} onClick={() => tap(l.key)} style={{ cursor: found ? 'default' : 'pointer' }}>{l.text}</div>
                ))}
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda rol adashgan? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Rolni to'g'rilash</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi har kim o'z o'rnida!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              picked !== null
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — rol o'z egasida. Yana o'ylang: <b>chizish</b> kimning ishi edi, <b>saqlash</b> kimning?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: <b style={{ color: T.ink }}>chizish</b> — frontend (zal). <b style={{ color: T.ink }}>Saqlash</b> — baza (ombor). Qaysi a'zoga boshqaning ishi yozilgan?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>PostgreSQL tugma chizmaydi — chizish React'ning ishi! PostgreSQL'ning vazifasi — <b>saqlash</b>. Chapdagi tugmani bosing.</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">✓</div><p className="ta-h">Topdingiz va tuzatdingiz — bu arxitektor ko'zi!</p><p className="ta-sub">AI ham adashadi — rollarni bilgan odam tekshiradi</p></div>)}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (sayohatni o'zingiz tuzing) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { key: 'click', label: 'Foydalanuvchi tugmani bosadi', who: 'react' },
    { key: 'send', label: "React so'rov yuboradi", who: 'react' },
    { key: 'route', label: 'Express qabul qiladi (Node ichida)', who: 'express' },
    { key: 'save', label: 'PostgreSQL saqlaydi', who: 'postgres' },
    { key: 'back', label: 'Javob qaytadi — ekran yangilanadi', who: 'react' }
  ];
  const POOL_ORDER = ['route', 'click', 'back', 'send', 'save'];
  const [placed, setPlaced] = useState(storedAnswer?.solved ? STEPS.map(s => s.key) : []);
  const [shake, setShake] = useState(null);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const solved = placed.length === STEPS.length;
  const tap = (k) => {
    if (solved || placed.includes(k)) return;
    const expected = STEPS[placed.length].key;
    if (k === expected) {
      const np = [...placed, k];
      setPlaced(np);
      setShake(null);
      if (np.length === STEPS.length) {
        if (firstCorrectRef.current === null) firstCorrectRef.current = true;
        onAnswer(screen, { stage: 'final', screenIdx: screen, correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: true, picked: np.join('→') });
      }
    } else {
      if (firstCorrectRef.current === null) firstCorrectRef.current = false;
      setShake(k);
      setTimeout(() => setShake(null), 450);
    }
  };
  const reset = () => { setPlaced([]); setShake(null); };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : 'Sayohatni tuzing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: sayohatni <span className="italic" style={{ color: T.accent }}>o'zingiz</span> tuzing</h2></div>
        <Mentor>Buyurtma tugmasi bosildi! Quyidagi qadamlarni <b style={{ color: T.ink }}>to'g'ri tartibda</b> bosing — so'rov sayohatini o'zingiz quring. Birinchi qadamdan boshlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qadamlar — tartib bilan bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {POOL_ORDER.map(k => {
                const s = STEPS.find(x => x.key === k);
                const used = placed.includes(k);
                const tech = techBy(s.who);
                return (
                  <button key={k} className={`pool-chip ${used ? 'used' : ''} ${shake === k ? 'shake' : ''}`} disabled={used || solved} onClick={() => tap(k)}>
                    <span className="ttag-dot" style={{ background: tech.color }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
                    {used && <span style={{ color: T.success, fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })}
            </div>
            {!solved && placed.length > 0 && <button className="btn-soft fade-step" style={{ alignSelf: 'flex-start' }} onClick={reset}>↺ Boshidan</button>}
          </Col>
          <Col>
            <p className="flow-label">Sayohat — {placed.length}/{STEPS.length}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.map((s, i) => {
                const on = i < placed.length;
                const tech = techBy(s.who);
                return (
                  <div key={s.key} className={`jr-step ${on ? 'on el-in' : ''}`} style={on ? { boxShadow: `inset 0 0 0 1.5px ${tech.color}` } : { opacity: 0.4 }}>
                    <span className="jr-num" style={{ background: on ? tech.color : T.ink3 }}>{i + 1}</span>
                    <span className="jr-body"><span className="jr-t">{on ? s.label : '…'}</span></span>
                    {on && <span className="jr-tag" style={{ color: tech.color, background: tech.soft }}>{tech.name}</span>}
                  </div>
                );
              })}
            </div>
            {solved && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Siz endi katta saytlarning ichini bilasiz: <b>React → Express → PostgreSQL → javob</b>. Bu xarita keyingi modullarda doim siz bilan bo'ladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
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
    "Frontend — ko'rinadigan qism, Backend — ko'rinmas ish",
    "React — ko'rinishni bloklardan yig'adi (frontend)",
    "Node.js — JavaScript'ni serverda ishlatadi",
    "Express — so'rov yo'llari · PostgreSQL — doimiy ombor",
    "4 texnologiya birga = PERN stack"
  ];
  const HOMEWORK = [
    { b: 'YouTube', t: "— frontend nimani ko'rsatadi, backend nimani saqlaydi? Yozing" },
    { b: 'Telegram', t: '— xabaringiz telefonda emas, qayerda saqlanadi?' },
    { b: "O'z saytingiz", t: "— unga PERN'ning qaysi a'zolari yetishmayapti?" }
  ];
  const GLOSSARY = [
    { b: 'frontend', t: "— ko'rinadigan qism (zal)" },
    { b: 'backend', t: "— ko'rinmas qism (oshxona)" },
    { b: 'React', t: "— ko'rinish kutubxonasi" },
    { b: 'Node.js', t: '— JS serverda (dvigatel)' },
    { b: 'Express', t: "— so'rov yo'llari (ofitsiant)" },
    { b: 'PostgreSQL', t: '— baza, doimiy ombor' },
    { b: 'stack', t: '— texnologiyalar jamoasi' },
    { b: "so'rov", t: '— frontenddan backendga xat' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => {
    const nv = !o;
    if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80);
    return nv;
  });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Katta saytlarning <span className="italic" style={{ color: T.accent }}>xaritasi</span> endi qo'lingizda.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Frontend, backend va PERN jamoasi endi sizga tanish." : "Yaxshi harakat! Bir-ikki ekranni qayta ko'rib, xaritani mustahkamlang."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className={`qz-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <div className="qz-cta-txt">
            <span className="qz-cta-h">⚔️ Mustahkamlash testi</span>
            <span className="qz-cta-s">{studentSolo
              ? `${QUIZ_BANK.length} savol · har biriga ${QUIZ_MS / 1000} soniya · mashq rejimi — natija faqat sizga`
              : `${QUIZ_BANK.length} savol · har biriga ${QUIZ_MS / 1000} soniya · tezkorlar podiumga 🏆`}</span>
          </div>
          <button className="qz-cta-btn" disabled={studentWait} onClick={openArena}>
            {studentWait ? '⏳ Mentorni kuting'
              : studentSolo ? "📖 Testni o'zim ishlash"
              : studentLive ? (quizSt === 'done' ? "🏆 Natijalarni ko'rish" : '🔥 Testga kirish!')
              : isMentorL ? (quizSt === 'off' ? '⚔️ Testni ochish' : '⚔️ Davom ettirish')
              : '⚔️ Testni ishlash'}
          </button>
        </div>
        {arena && <QuizArena live={_live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa — detektiv bo'ling</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>3 ta tanish ilovani "ichidan" tahlil qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Oldinda: avval mini-do'kon praktikasi, so'ng React moduli (frontend) va Node.js + Express + NestJS moduli (backend). Xarita qo'lingizda!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
// Podium yorliqlari (scored indeks -> qisqa nom)
const Q_LABELS = { 4: "1 — Frontend", 6: "2 — Node.js", 10: "3 — Ma'lumot qayerda", 13: "4 — So'rov yo'li", 16: "5 — Sayohat tartibi" };

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

// Server-baholash javob kaliti (mentor darsni ochganda avto-yuklanadi). s15 = -1 (yakuniy amaliy).
const INLINE_KEYS = { s4: 1, s5b: 1, s9: 2, s12: 1, s15: -1 };

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
      if (on) t = setTimeout(tick, 3000); // kech qo'shilganlar ham jonli ko'rinadi
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [isLive, livePin]);

  const totalQ = SCORED_IDX.length;
  const board = players.map(p => {
    // FAQAT baholanadigan testlar hisoblanadi — s6 amaliyotning «tugatdi» belgisi (idx 7)
    // reytingga aralashmasin (u faqat MentorWorkStats uchun yoziladi)
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
            {/* Podium — 2-1-3 tartibida (o'rtada g'olib, balandroq) */}
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
            {/* Savollar bo'yicha — qaysi mavzu qiyin bo'ldi */}
            <div className="card fade-up d2">
              <div className="card-lbl" style={{ color: T.blue }}>📊 Savollar bo'yicha</div>
              <div className="pod-qstats">
                {SCORED_IDX.map(q => {
                  const qa = rows.filter(r => r.screen_idx === q);
                  const okN = qa.filter(r => r.correct).length;
                  const pct = qa.length ? Math.round((okN / qa.length) * 100) : 0;
                  const hard = qa.length >= 2 && pct < 50;
                  return (
                    <div key={q} className="qstat-row">
                      <span className="qstat-lbl">{Q_LABELS[q] || `#${q}`}{hard && ' ⚠️'}</span>
                      <span className="mstats-track"><span className="mstats-fill" style={{ width: `${pct}%`, background: hard ? T.accent : T.success }} /></span>
                      <span className="mono qstat-n">{okN}/{qa.length}</span>
                    </div>
                  );
                })}
              </div>
              {live.mode === 'mentor' && <p className="small" style={{ margin: '10px 0 0', color: T.ink2 }}>⚠️ belgili savollar — sinf qiynalgan mavzular. Qayta tushuntirish tavsiya etiladi.</p>}
            </div>
          </>
        )}
      </div>
    </Stage>
  );
};

// ===== ⚔️ MUSTAHKAMLASH-JANG (Kahoot arena) =====
const QUIZ_MS = 20000;
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C']; // Kahoot ranglari
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
// Arena foni: suzuvchi neon shakllar (statik pozitsiyalar)
const QZ_BG_SHAPES = [
  { ch: '▲', l: 5,  t: 10, s: 88,  c: 'rgba(255,80,110,0.16)',  d: 19, dl: 0 },
  { ch: '●', l: 86, t: 7,  s: 64,  c: 'rgba(255,201,77,0.15)',  d: 23, dl: 1.5 },
  { ch: '◆', l: 8,  t: 72, s: 104, c: 'rgba(80,150,255,0.18)',  d: 27, dl: 0.8 },
  { ch: '■', l: 82, t: 68, s: 76,  c: 'rgba(90,220,120,0.16)',  d: 21, dl: 2.2 },
  { ch: '▲', l: 44, t: 86, s: 54,  c: 'rgba(255,201,77,0.12)',  d: 25, dl: 1.1 },
  { ch: '◆', l: 66, t: 26, s: 46,  c: 'rgba(255,80,110,0.12)',  d: 17, dl: 0.4 },
  { ch: '●', l: 26, t: 34, s: 38,  c: 'rgba(90,220,120,0.12)',  d: 20, dl: 1.9 },
  { ch: '■', l: 55, t: 5,  s: 42,  c: 'rgba(80,150,255,0.14)',  d: 22, dl: 0.6 },
  { ch: '▲', l: 93, t: 42, s: 48,  c: 'rgba(160,120,255,0.14)', d: 24, dl: 1.3 },
  { ch: '●', l: 2,  t: 45, s: 44,  c: 'rgba(255,80,110,0.10)',  d: 26, dl: 2.6 },
];
const QUIZ_BANK = [
  { q: "Saytning foydalanuvchi ko'radigan qismi nima deb ataladi?", opts: ["Backend", "Frontend", "Baza", "Server"], correct: 1 },
  { q: "Backend nima?", opts: ["Ko'rinadigan qism (zal)", "Ko'rinmas qism — saqlash, tekshirish (oshxona)", "Faqat ranglar", "Faqat rasmlar"], correct: 1 },
  { q: "React nima qiladi?", opts: ["Ma'lumotni saqlaydi", "Ko'rinishni bloklardan yig'adi (frontend)", "So'rovlarni yo'naltiradi", "Serverni yoqadi"], correct: 1 },
  { q: "Node.js nima qiladi?", opts: ["Sahifani bezaydi", "JavaScript'ni serverda ishlatadi", "Rasm tahrirlaydi", "Internetni tezlashtiradi"], correct: 1 },
  { q: "Express restoranda qaysi rolga o'xshaydi?", opts: ["Oshpaz", "Ofitsiant (so'rovlarni yo'naltiradi)", "Ombor", "Mehmon"], correct: 1 },
  { q: "Ma'lumot (like, izoh) doimiy qayerda saqlanadi?", opts: ["Brauzerda", "CSS faylida", "PostgreSQL bazasida", "Ekranda"], correct: 2 },
  { q: "Hook'dagi izoh nega yo'qoldi?", opts: ["Internet uzildi", "Hech qayerda saqlanmagan edi (baza yo'q)", "Sayt buzildi", "Parol xato"], correct: 1 },
  { q: "PERN qaysi 4 texnologiyadan iborat?", opts: ["Python, Express, React, Node", "PostgreSQL, Express, React, Node.js", "PHP, Ember, Ruby, Next", "PostgreSQL, Elm, React, .NET"], correct: 1 },
  { q: "Tugma bosilganda so'rov qaysi yo'ldan boradi?", opts: ["PostgreSQL → React → Express", "React → Express → PostgreSQL", "Express → React → PostgreSQL", "React → PostgreSQL → Express"], correct: 1 },
  { q: "'Stack' so'zi nimani anglatadi?", opts: ["Bitta dastur", "Bir-birini to'ldiruvchi texnologiyalar to'plami", "Xato turi", "Deploy usuli"], correct: 1 },
  { q: "PostgreSQL restoranda nimaga o'xshaydi?", opts: ["Zal", "Ofitsiant", "Ombor / daftar (doimiy xotira)", "Menyu"], correct: 2 },
  { q: "JavaScript bilgan odam backend'ga tayyormi?", opts: ["Yo'q, yangi til shart", "Ha — Node.js JS'ni serverda ishlatadi", "Faqat CSS kerak", "Faqat Python bilan"], correct: 1 },
];
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

function QuizArena({ live, onClose, startSolo }) {
  const isMentor = live.mode === 'mentor';
  const isStudent = live.mode === 'student';
  // solo: self rejim YOKI mashq (dars tugagach o'quvchi uyda qayta ishlashi) —
  // taymer/savollar bir xil, lekin serverga yozilmaydi, faqat o'z natijasi ko'rinadi
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
  const [classEnded, setClassEnded] = useState(false); // jonli dars tugadi — qutqaruv banneri
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
      if (soloRef.current) return; // mashqqa o'tildi — server bilan ishlamaymiz
      try {
        const row = await liveGet(live.pin);
        if (!on) return;
        if (row) {
          const st = row.quiz_state || 'off', q = row.quiz_q ?? -1;
          if (st === 'q' && q !== seenQRef.current) {
            seenQRef.current = q; qStartRef.current = Date.now();
            deadlineRef.current = Date.now() + QUIZ_MS - (isMentor ? 0 : 700); // polling kechikish kompensatsiyasi
            setQi(q); setRemaining(deadlineRef.current - Date.now()); setPhase('q'); setAnsweredN(0);
          } else if (st === 'r') {
            if (q !== seenQRef.current) { seenQRef.current = q; setQi(q); } // kech kirgan ham natijani ko'radi
            setPhase(p => p === 'done' ? p : 'reveal');
          }
          else if (st === 'done') { setPhase('done'); }
        }
        // Fetch-fazani SERVER holatidan hisoblaymiz — reveal'ga o'tgan ZAHOTI natijalar yuklanadi
        const st1 = row ? (row.quiz_state || 'off') : null;
        const ph = st1 === 'r' ? 'reveal' : st1 === 'done' ? 'done' : st1 === 'lobby' ? 'lobby' : st1 === 'q' ? 'q' : phaseRef.current;
        if (on) setClassEnded(!row || row.status === 'ended');
        // phaseRef sharti — himoya: lokal reveal (taymer tugagan), server hali 'q' bo'lsa ham natijalar yuklanadi
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

  // Taymer — 100ms aniqlikda; vaqt tugasa javob ochiladi.
  // MENTOR: serverni ham 'r' ga o'tkazamiz — aks holda server 'q'ligicha qolib,
  // poll natijalarni yuklamaydi va hisoblagichlar/TOP-5 nolda qotib qolardi.
  useEffect(() => {
    if (phase !== 'q') return;
    const iv = setInterval(() => {
      const rem = deadlineRef.current - Date.now();
      setRemaining(rem > 0 ? rem : 0);
      if (rem <= 0) {
        clearInterval(iv);
        setPhase('reveal');
        if (isMentor && !soloRef.current) ctrl('r', seenQRef.current); // Kahoot: vaqt tugadi — natija hammaga ochiladi
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase, qi]); // eslint-disable-line

  // Mentor boshqaruvi (optimistik lokal o'tish + server)
  const ctrl = async (state, q) => {
    try {
      await live.quizControl(state, q);
      if (state === 'q') { seenQRef.current = q; qStartRef.current = Date.now(); deadlineRef.current = Date.now() + QUIZ_MS; setQi(q); setRemaining(QUIZ_MS); setPhase('q'); setAnsweredN(0); }
      else if (state === 'r' || state === 'done') {
        setPhase(state === 'r' ? 'reveal' : 'done');
        // Natijalarni DARHOL yuklaymiz — hisoblagichlar bo'sh turmaydi
        Promise.all([livePlayers(live.pin), liveQuizAnswers(live.pin)]).then(([pl, qa]) => { setPlayers(pl); setQRows(qa); }).catch(() => {});
      }
    } catch {}
  };
  // Solo boshqaruvi
  const soloStart = (i) => { seenQRef.current = i; qStartRef.current = Date.now(); deadlineRef.current = Date.now() + QUIZ_MS; setQi(i); setRemaining(QUIZ_MS); setPhase('q'); };
  const soloNext = () => { const n = qi + 1; if (n >= QUIZ_BANK.length) setPhase('done'); else soloStart(n); };
  const soloReplay = () => { setMyAnswers({}); soloStart(0); };
  // Jonli test tugagach «qayta ishlash» — mashq rejimiga o'tish (serverga yozilmaydi)
  const startPractice = () => { setSoloMode(true); setMyAnswers({}); soloStart(0); };

  const answer = (i) => {
    if (phase !== 'q' || isMentor || myAnswers[qi]) return;
    const elapsed = Math.min(QUIZ_MS, Date.now() - qStartRef.current);
    const correct = i === QUIZ_BANK[qi].correct;
    setMyAnswers(m => ({ ...m, [qi]: { picked: i, correct, elapsed } }));
    if (isStudent && !solo) live.submitAnswer(QUIZ_BASE_IDX + qi, `quiz-${qi}`, i, correct, elapsed);
    if (solo) setPhase('reveal'); // yolg'iz o'yinda javob darhol ochiladi
  };

  // Joriy streak (shu savolgacha ketma-ket to'g'ri)
  const streakUpTo = (k) => { let s = 0; for (let i = 0; i <= k; i++) { if (myAnswers[i]?.correct) s++; else s = 0; } return s; };
  const myPtsFor = (k) => { const a = myAnswers[k]; if (!a || !a.correct) return 0; return quizPts(a.elapsed) + (streakUpTo(k) >= 2 ? 100 : 0); };

  // Reyting (jonli) / solo hisob
  const board = players.map(p => { const s = quizScore(qRows.filter(r => r.player_id === p.id)); return { id: p.id, nickname: p.nickname, ...s }; }).sort((a, b) => b.pts - a.pts || b.ok - a.ok);
  const myRank = live.playerId ? board.findIndex(b => b.id === live.playerId) : -1;
  const soloRows = Object.entries(myAnswers).map(([k, v]) => ({ player_id: 'me', screen_idx: QUIZ_BASE_IDX + Number(k), correct: v.correct, elapsed_ms: v.elapsed }));
  const soloScore = quizScore(soloRows);

  const Q = qi >= 0 && qi < QUIZ_BANK.length ? QUIZ_BANK[qi] : null;
  // Hisoblagichlar: server qatorlari + O'Z javobim hali kelmagan bo'lsa lokal qo'shiladi
  const counts = Q ? Q.opts.map((_, i) => {
    if (solo) return myAnswers[qi]?.picked === i ? 1 : 0;
    let n = qRows.filter(r => r.screen_idx === QUIZ_BASE_IDX + qi && r.picked === i).length;
    const mine = myAnswers[qi];
    if (mine && mine.picked === i && live.playerId && !qRows.some(r => r.player_id === live.playerId && r.screen_idx === QUIZ_BASE_IDX + qi)) n++;
    return n;
  }) : [];
  const lastQ = qi >= QUIZ_BANK.length - 1;
  const my = qi >= 0 ? myAnswers[qi] : null;

  // Mentor test o'rtasida ✕ bossa — ogohlantiramiz: sinf arenada kutib qoladi.
  const closeArena = () => {
    if (isMentor && !solo && phase !== 'done') {
      if (!window.confirm("Test hali yakunlanmadi — yopsangiz o'quvchilar arenada kutib qoladi.\nKeyin «⚔️ Davom ettirish» bilan aynan shu joydan qaytishingiz mumkin.\n\nBaribir yopilsinmi?")) return;
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
      <button className="qz-x" onClick={closeArena} aria-label="Yopish">✕</button>

      {/* QUTQARUV: jonli dars tugadi — o'quvchi osilib qolmaydi, mashq rejimida davom etadi */}
      {classEnded && isStudent && !solo && phase !== 'done' && (
        <div className="qz-endnote fade-step">
          <span>⚠️ Jonli dars yakunlandi — testni o'zingiz davom ettiring:</span>
          <button className="qz-btn" onClick={startPractice}>📖 Mashq rejimida davom etish</button>
        </div>
      )}

      {/* ===== LOBBY ===== */}
      {phase === 'lobby' && (
        <div className="qz-view fade-step">
          <div className="qz-logo">⚔️</div>
          <h2 className="qz-h">Mustahkamlash Testi</h2>
          <p className="qz-sub">{QUIZ_BANK.length} savol · har biriga {QUIZ_MS / 1000} soniya · tezroq to'g'ri bossang — ko'proq ball. Ketma-ket to'g'ri javoblar 🔥 bonus beradi!</p>
          {solo && isStudent && <p className="qz-sub" style={{ color: '#FFC94D' }}>📖 Mashq rejimi — o'z tezligingizda ishlaysiz, natija faqat sizga ko'rinadi.</p>}
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

      {/* ===== SAVOL ===== */}
      {phase === 'q' && Q && (
        <div className="qz-view qz-qview fade-step" key={`q${qi}`}>
          <div className="qz-top">
            <span className="qz-count">Savol <b>{qi + 1}</b>/{QUIZ_BANK.length}</span>
            <QzTimer remaining={remaining} />
            {isMentor
              ? <span className="qz-ansn">📨 {answeredN}/{players.length}</span>
              : <span className="qz-ansn">{streakUpTo(qi - 1) >= 2 ? `🔥 x${streakUpTo(qi - 1)}` : ' '}</span>}
          </div>
          <h2 className="qz-q">{Q.q}</h2>
          <div className="qz-grid">
            {Q.opts.map((o, i) => {
              const pickedThis = my && my.picked === i;
              return (
                <button key={i} className={`qz-tile ${my ? (pickedThis ? 'picked' : 'faded') : ''}`} style={{ background: QUIZ_COLORS[i] }} disabled={isMentor || !!my} onClick={() => answer(i)}>
                  <span className="qz-shape">{QUIZ_SHAPES[i]}</span>
                  <span className="qz-opt">{o}</span>
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

      {/* ===== NATIJA (reveal) ===== */}
      {phase === 'reveal' && Q && (
        <div className="qz-view qz-qview fade-step" key={`r${qi}`}>
          <div className="qz-top">
            <span className="qz-count">Savol <b>{qi + 1}</b>/{QUIZ_BANK.length} — natija</span>
          </div>
          <h2 className="qz-q">{Q.q}</h2>
          <div className="qz-grid">
            {Q.opts.map((o, i) => {
              const win = i === Q.correct;
              const pickedThis = my && my.picked === i;
              return (
                <div key={i} className={`qz-tile rv ${win ? 'win' : 'lose'} ${pickedThis ? 'picked' : ''}`} style={{ background: QUIZ_COLORS[i] }}>
                  <span className="qz-shape">{QUIZ_SHAPES[i]}</span>
                  <span className="qz-opt">{o}</span>
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

      {/* ===== YAKUN — PODIUM ===== */}
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

export default function PeanStackLesson({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());

  // ETALON — 1920px (InternetLesson): keng oynada proportsional kattalashadi, <=1920 da z=1
  useEffect(() => {
    const upd = () => { const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920)); document.documentElement.style.setProperty('--lz', String(Math.round(z * 1000) / 1000)); };
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, []);
  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, data) => {
    setAnswers(a => ({ ...a, [idx]: data }));
    const _m = SCREEN_META[idx];
    if (_m && _m.scored && _m.scope === 'final' && data && data.correct && live.mode === 'student') live.submitAnswer(idx, _m.id, 0, true, 0);
  };
  const reset = () => { setAnswers({}); setScreen(0); startTimeRef.current = Date.now(); };

  // Javob kaliti: inline testlar + jang savollari (QUIZ_BANK'dan) — mentor ochganda serverga yuklanadi
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const locked = isStudentLive && (screen + 1 > live.mentorScreen);
  useEffect(() => { live.reportScreen(screen); }, [screen, live.mode, live.pin]); // eslint-disable-line

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
      nickname: live.nickname || null, livePin: live.pin || null, liveMode: live.mode,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((_, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, ScreenPodium, Screen16];
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
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: calc(90vh / var(--lz, 1)); overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        @keyframes shake-x { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .shake { animation: shake-x 0.3s ease-in-out; box-shadow: inset 0 0 0 1.5px ${T.accent} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 14px; height: 14px; border: 2px solid ${T.ink3}; border-top-color: ${T.accent}; border-radius: 50%; display: inline-block; animation: spin 0.7s linear infinite; }

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
        .btn-soft:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip-bad { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; animation: shake-x 0.3s ease-in-out; }
        .chip:disabled { cursor: not-allowed; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
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
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.3s ease-out; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 9px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }

        /* === CODEBOX === */
        .codebox { background: ${CODE.bg}; border-radius: 12px; padding: 14px 16px; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); color: ${CODE.text}; line-height: 1.75; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); overflow-x: hidden; }
        .codebox > div { white-space: pre-wrap; word-break: break-word; }

        /* === AI CARD / DEBUGGING === */
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: clamp(12px,1.6vw,13.5px); color: ${CODE.text}; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; word-break: break-word; }
        .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === TERMINAL === */
        .term { background: ${CODE.bg}; border-radius: 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); overflow: hidden; }
        .term-bar { display: flex; align-items: center; gap: 6px; padding: 9px 13px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .term-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; margin-left: 6px; }
        .term-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; font-family: 'JetBrains Mono'; font-size: clamp(12.5px,1.6vw,14px); color: ${CODE.text}; min-height: 64px; }
        .term-line { display: flex; gap: 9px; animation: el-pop 0.25s ease-out; }
        .term-arrow { color: ${T.success}; flex-shrink: 0; }

        /* === PERN: BRAUZER OYNASI === */
        .bw { background: ${T.paper}; border-radius: 13px; box-shadow: 0 10px 26px -8px rgba(${T.shadowBase},0.2); overflow: hidden; }
        .bw-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: #EFEBE4; border-bottom: 1px solid rgba(167,166,162,0.25); }
        .bw-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .bw-url { font-size: 11px; color: ${T.ink2}; background: ${T.paper}; border-radius: 6px; padding: 3px 10px; margin-left: 6px; }
        .bw-body { padding: 14px 16px; font-family: Georgia, serif; }
        .bw-h { font-size: clamp(16px,2.2vw,20px); font-weight: 700; color: ${T.ink}; margin: 0 0 4px; }
        .bw-sub { font-size: 12px; color: ${T.ink3}; margin: 0 0 8px; font-family: 'Manrope', sans-serif; font-weight: 600; }
        .bw-empty { font-size: 13px; color: ${T.ink3}; font-style: italic; margin: 0; }
        .bw-spin { display: flex; align-items: center; gap: 10px; min-height: 110px; justify-content: center; color: ${T.ink3}; font-family: 'JetBrains Mono'; font-size: 13px; }
        .cmt { display: flex; align-items: flex-start; gap: 10px; background: ${T.bg}; border-radius: 10px; padding: 9px 11px; margin-bottom: 7px; }
        .cmt-ava { width: 30px; height: 30px; border-radius: 50%; color: #fff; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; text-transform: uppercase; }
        .cmt-col { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cmt-top { display: flex; align-items: baseline; gap: 8px; }
        .cmt-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .cmt-time { font-family: 'Manrope', sans-serif; font-size: 11px; color: ${T.ink3}; }
        .cmt-text { font-family: 'Manrope', sans-serif; font-size: 13px; color: ${T.ink2}; line-height: 1.4; }

        /* === PERN: JAMOA / NISHONLAR === */
        .pean-row { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 12px; padding: 9px 13px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .pean-badge { width: 28px; height: 28px; border-radius: 8px; color: #fff; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: 'Manrope'; }

        /* === PERN: 4 KATAK → BITTA SAYT (birlashish animatsiyasi) === */
        @keyframes asm-in { from { opacity: 0; transform: translateY(-10px) scale(0.88); } to { opacity: 1; transform: none; } }
        @keyframes asm-pop { 0% { opacity: 0; transform: scale(0.92); } 60% { transform: scale(1.025); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes asm-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
        .assemble { display: flex; flex-direction: column; align-items: center; gap: 11px; }
        .asm-pieces { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .asm-chip { display: inline-flex; align-items: center; gap: 7px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(12px,1.6vw,13.5px); padding: 8px 14px; border-radius: 10px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.18); opacity: 0; animation: asm-in 0.42s cubic-bezier(.34,1.4,.5,1) forwards; }
        .asm-dot { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
        .asm-merge { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: ${T.ink3}; opacity: 0; animation: fade-in-up 0.4s ease-out forwards 0.62s; }
        .asm-arrow { font-size: 17px; color: ${T.accent}; animation: asm-bounce 1.6s ease-in-out infinite 1s; }
        .asm-site { position: relative; width: 100%; opacity: 0; animation: asm-pop 0.5s cubic-bezier(.34,1.3,.4,1) forwards 0.82s; }
        .asm-badge { position: absolute; top: -10px; right: 12px; z-index: 2; background: ${T.success}; color: #fff; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 10.5px; padding: 4px 10px; border-radius: 99px; box-shadow: 0 5px 14px -5px rgba(31,122,77,0.5); }
        .ttag { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; padding: 4px 11px; border-radius: 99px; }
        .ttag-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .tech-card { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; background: ${T.paper}; border: none; border-radius: 14px; padding: 14px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; color: ${T.ink}; text-align: left; }
        .tech-card:hover { transform: translateY(-2px); }

        /* === PERN: RESTORAN === */
        .rest-card { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 14px; padding: 15px 17px; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; color: ${T.ink}; font-size: clamp(14px,1.7vw,16px); }
        .rest-card:hover:not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .rest-card.on { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22); }
        .rest-ic { width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0; }
        .rest-body { display: flex; flex-direction: column; gap: 2px; }

        /* === PERN: REACT BLOKLARI (mini sayt) === */
        .rb { font-family: 'Manrope', sans-serif; }
        .rb-header { background: ${T.ink}; color: ${T.bg}; border-radius: 8px; padding: 8px 12px; font-weight: 700; font-size: 13px; margin-bottom: 8px; }
        .rb-card { display: flex; align-items: center; gap: 9px; background: ${T.bg}; border-radius: 8px; padding: 8px 10px; font-size: 12.5px; color: ${T.ink}; margin-bottom: 8px; }
        .rb-thumb { width: 26px; height: 26px; border-radius: 6px; background: #f5d8cf; flex-shrink: 0; display: inline-block; }
        .rb-btn { background: ${T.accent}; color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-weight: 700; font-size: 12.5px; cursor: default; font-family: 'Manrope'; }

        /* === PERN: SAYOHAT QADAMLARI === */
        .jr-step { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 12px; padding: 9px 13px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.12); transition: all 0.25s; }
        .jr-step.cur { transform: translateX(4px); }
        .jr-num { width: 22px; height: 22px; border-radius: 50%; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.25s; }
        .jr-body { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .jr-t { font-weight: 600; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink}; }
        .jr-d { font-size: 11.5px; color: ${T.ink2}; }
        .jr-tag { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; padding: 3px 8px; border-radius: 99px; flex-shrink: 0; }
        .jr-mini { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; background: ${T.paper}; border-radius: 12px; padding: 11px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; font-size: 13px; color: ${T.ink2}; }
        .jr-mini-arr { color: ${T.ink3}; }

        /* === PERN: BAZA JADVALI === */
        .dbt { background: ${T.paper}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); transition: opacity 0.3s; }
        .dbt-row { display: grid; grid-template-columns: 44px 1fr 1fr; gap: 8px; padding: 9px 14px; font-size: 13px; color: ${T.ink}; border-bottom: 1px solid rgba(167,166,162,0.18); font-family: 'Manrope'; }
        .dbt-row:last-child { border-bottom: none; }
        .dbt-head { background: ${T.purpleSoft}; color: ${T.purple}; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-family: 'JetBrains Mono'; }
        .dbt-empty { padding: 16px 14px; font-size: 13px; color: ${T.ink3}; font-style: italic; }

        /* === PERN: SLOT (s13) === */
        .slotx { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; background: ${T.paper}; border: 1.5px dashed transparent; border-radius: 12px; padding: 7px 13px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.12); font-family: 'Manrope'; color: ${T.ink}; text-align: left; }
        .slotx.act { border-color: ${T.accent}; box-shadow: 0 8px 20px -6px rgba(255,79,40,0.2); }
        .slotx.bad { box-shadow: inset 0 0 0 2px ${T.accent}; animation: shake-x 0.3s ease-in-out; }
        .slotx.ok { box-shadow: inset 0 0 0 2px ${T.success}; }
        .slotx-l { display: flex; flex-direction: column; gap: 1px; font-size: clamp(13px,1.6vw,14.5px); }

        /* === PERN: VAZIFA KARTASI / POOL === */
        .task-card { background: ${T.paper}; border-radius: 14px; padding: 16px 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); }
        .pool-chip { display: flex; align-items: center; gap: 10px; width: 100%; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink}; }
        .pool-chip:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.2); }
        .pool-chip.used { opacity: 0.45; cursor: default; }
        .pool-chip:disabled { cursor: default; }

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
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        /* MOBIL: yig'iladigan Mentor */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* ===================== JONLI DARS CSS (InternetLesson bilan bir xil) ===================== */
        /* Konfetti */
        /* === Konfetti (yakun bayrami) === */
        .confetti { position: fixed; inset: 0; pointer-events: none; z-index: 1200; overflow: hidden; }
        .confetti-bit { position: absolute; top: -24px; opacity: 0; will-change: transform, opacity; animation-name: confetti-fall; animation-timing-function: cubic-bezier(.25,.6,.45,1); animation-iteration-count: 1; animation-fill-mode: forwards; box-shadow: 0 2px 6px -2px rgba(${T.shadowBase},0.3); }
        @keyframes confetti-fall {
          0% { transform: translateY(-24px) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          55% { transform: translateY(48vh) translateX(22px) rotate(320deg); }
          100% { transform: translateY(104vh) translateX(-12px) rotate(680deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .confetti { display: none; } }

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

        /* === ⚔️ CTA (yakun sahifasida) === */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: linear-gradient(135deg, #1D1145, #35206B); border-radius: 18px; padding: clamp(16px,2.4vw,22px) clamp(18px,2.6vw,26px); box-shadow: 0 14px 36px -14px rgba(29,17,69,0.55); }
        .qz-cta-txt { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 3px; }
        .qz-cta-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(16px,2.2vw,20px); color: #fff; }
        .qz-cta-s { font-family: 'Manrope'; font-weight: 500; font-size: 13px; color: rgba(255,255,255,0.72); }
        .qz-cta-btn { background: ${T.accent}; color: #fff; border: none; border-radius: 14px; padding: 13px 24px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.7); transition: transform 0.2s; }
        .qz-cta-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
        .qz-cta-btn:disabled { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.55); cursor: default; box-shadow: none; }
        .qz-cta.ready .qz-cta-btn { animation: qz-pulse 1.1s ease-in-out infinite; }
        @keyframes qz-pulse { 0%,100% { transform: scale(1); box-shadow: 0 8px 22px -8px rgba(255,79,40,0.7); } 50% { transform: scale(1.06); box-shadow: 0 10px 30px -6px rgba(255,79,40,0.95); } }

        /* === ⚔️ ARENA — to'liq ekran, tiniq qorong'u muhit === */
        .qz-arena { position: fixed; inset: 0; z-index: 10500; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; padding: clamp(18px,4vw,44px) clamp(12px,3vw,32px);
          background:
            radial-gradient(120% 85% at 50% -18%, rgba(88,58,200,0.55) 0%, rgba(88,58,200,0) 55%),
            radial-gradient(70% 60% at 108% 112%, rgba(196,37,126,0.30) 0%, rgba(196,37,126,0) 60%),
            radial-gradient(55% 45% at -8% 108%, rgba(19,104,206,0.28) 0%, rgba(19,104,206,0) 60%),
            linear-gradient(168deg, #241560 0%, #170F3D 52%, #0D0826 100%);
        }
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; animation: qz-drift ease-in-out infinite; text-shadow: 0 0 34px currentColor; will-change: transform; }
        @keyframes qz-drift { 0%,100% { transform: translate(0,0) rotate(-7deg) scale(1); } 50% { transform: translate(22px,-28px) rotate(9deg) scale(1.07); } }
        @media (prefers-reduced-motion: reduce) { .qz-shp { animation: none; } }
        .qz-x { position: fixed; top: 14px; right: 16px; z-index: 10600; width: 38px; height: 38px; border-radius: 50%; border: none; background: rgba(255,255,255,0.12); color: #fff; font-size: 16px; cursor: pointer; transition: background 0.2s; }
        .qz-x:hover { background: rgba(255,255,255,0.25); }
        .qz-view { position: relative; z-index: 1; width: 100%; max-width: 780px; display: flex; flex-direction: column; align-items: center; gap: clamp(14px,2.4vw,22px); margin: auto; }
        .qz-logo { font-size: clamp(44px,8vw,72px); line-height: 1; filter: drop-shadow(0 8px 24px rgba(255,79,40,0.5)); }
        .qz-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(24px,4.4vw,40px); color: #fff; margin: 0; text-align: center; letter-spacing: -0.02em; }
        .qz-sub { font-family: 'Manrope'; font-size: clamp(13px,1.9vw,16px); color: rgba(255,255,255,0.75); margin: 0; text-align: center; max-width: 560px; line-height: 1.55; }
        .qz-dimtxt { color: rgba(255,255,255,0.5); font-family: 'Manrope'; font-size: 14px; font-style: italic; }
        .qz-lobby-players { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 640px; }
        .qz-pchip { background: rgba(255,255,255,0.12); color: #fff; font-family: 'Manrope'; font-weight: 700; font-size: 14px; border-radius: 99px; padding: 7px 16px; animation: qz-pop 0.4s cubic-bezier(.34,1.5,.4,1); }
        .qz-pchip.me { background: ${T.accent}; }
        @keyframes qz-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .qz-btn { background: ${T.accent}; color: #fff; border: none; border-radius: 14px; padding: 13px 26px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 10px 26px -8px rgba(255,79,40,0.65); transition: transform 0.18s; }
        .qz-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .qz-btn:disabled { opacity: 0.45; cursor: default; }
        .qz-btn.big { font-size: clamp(16px,2.2vw,19px); padding: clamp(14px,2vw,17px) clamp(30px,4vw,44px); }
        .qz-btn.ghost { background: rgba(255,255,255,0.12); box-shadow: none; }
        .qz-waitmsg { margin: 0; font-family: 'Manrope'; font-weight: 600; font-size: 14.5px; color: #2BD97C; text-align: center; }
        .qz-qview { max-width: 860px; }
        .qz-top { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .qz-count { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.8vw,16px); color: rgba(255,255,255,0.75); }
        .qz-count b { color: #fff; font-size: 1.25em; }
        .qz-ansn { font-family: 'Manrope'; font-weight: 700; font-size: clamp(13px,1.8vw,16px); color: #FFC94D; min-width: 64px; text-align: right; }
        .qz-timer { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
        .qz-timer-n { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 20px; }
        .qz-timer.urgent { animation: qz-shake 0.5s ease-in-out infinite; }
        @keyframes qz-shake { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .qz-q { font-family: 'Manrope'; font-weight: 800; font-size: clamp(19px,3.2vw,28px); color: #fff; margin: 0; text-align: center; line-height: 1.35; background: rgba(255,255,255,0.07); border-radius: 18px; padding: clamp(16px,2.6vw,24px) clamp(18px,3vw,30px); width: 100%; }
        .qz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px,1.6vw,14px); width: 100%; }
        @media (max-width: 560px) { .qz-grid { grid-template-columns: 1fr; } }
        .qz-tile { position: relative; display: flex; align-items: center; gap: 12px; border: none; border-radius: 16px; padding: clamp(15px,2.4vw,22px) clamp(14px,2.2vw,20px); cursor: pointer; text-align: left; min-height: 64px; box-shadow: 0 10px 26px -10px rgba(0,0,0,0.55); transition: transform 0.16s, opacity 0.3s, box-shadow 0.16s; }
        .qz-tile:hover:not(:disabled):not(.rv) { transform: translateY(-3px) scale(1.015); box-shadow: 0 16px 34px -10px rgba(0,0,0,0.6); }
        .qz-tile:disabled { cursor: default; }
        .qz-shape { font-size: clamp(17px,2.4vw,22px); color: rgba(255,255,255,0.9); flex-shrink: 0; }
        .qz-opt { flex: 1; font-family: 'Manrope'; font-weight: 700; font-size: clamp(14px,2vw,17px); color: #fff; line-height: 1.3; }
        .qz-tile.faded { opacity: 0.28; }
        .qz-tile.picked { outline: 3px solid #fff; animation: qz-pop 0.3s; }
        .qz-pbadge { position: absolute; top: -9px; right: -7px; width: 26px; height: 26px; border-radius: 50%; background: #fff; color: #17103B; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); }
        .qz-tile.rv.win { outline: 4px solid #2BD97C; box-shadow: 0 0 34px rgba(43,217,124,0.55); animation: qz-pop 0.4s; }
        .qz-tile.rv.lose { opacity: 0.3; }
        .qz-cnt { font-family: 'Manrope'; font-weight: 800; font-size: clamp(15px,2.2vw,19px); color: #fff; background: rgba(0,0,0,0.28); border-radius: 99px; padding: 4px 13px; flex-shrink: 0; }
        .qz-mrow { display: flex; align-items: center; gap: 14px; }
        .qz-allin { font-family: 'Manrope'; font-weight: 700; font-size: 15px; color: #2BD97C; animation: qz-pop 0.4s; }
        .qz-res { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; justify-content: center; border-radius: 16px; padding: 14px 26px; animation: qz-pop 0.45s cubic-bezier(.34,1.5,.4,1); }
        .qz-res.good { background: rgba(43,217,124,0.16); outline: 1.5px solid rgba(43,217,124,0.5); }
        .qz-res.bad { background: rgba(255,90,90,0.14); outline: 1.5px solid rgba(255,90,90,0.4); }
        .qz-res-pts { font-family: 'Manrope'; font-weight: 800; font-size: clamp(28px,4.4vw,40px); color: #2BD97C; line-height: 1; }
        .qz-res-t { font-family: 'Manrope'; font-weight: 700; font-size: clamp(14px,2vw,17px); color: #fff; }
        .qz-res-rank { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; color: rgba(255,255,255,0.7); width: 100%; text-align: center; }
        .qz-board { width: 100%; max-width: 480px; background: rgba(255,255,255,0.07); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; }
        .qz-board.wide { max-width: 640px; max-height: 260px; overflow: auto; }
        .qz-board-h { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; letter-spacing: 0.1em; color: #FFC94D; margin-bottom: 3px; }
        .qz-brow { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 10px; background: rgba(255,255,255,0.05); }
        .qz-brow.me { background: rgba(255,79,40,0.3); outline: 1.5px solid rgba(255,79,40,0.6); }
        .qz-brank { font-family: 'Manrope'; font-weight: 800; font-size: 13px; color: rgba(255,255,255,0.55); min-width: 20px; }
        .qz-bname { flex: 1; min-width: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14.5px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-bstreak { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: #FFC94D; }
        .qz-bok { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: rgba(255,255,255,0.6); }
        .qz-bpts { font-family: 'Manrope'; font-weight: 800; font-size: 15px; color: #FFC94D; min-width: 52px; text-align: right; }
        .qz-pod { display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px,2.4vw,24px); padding-top: 18px; }
        .qz-pod-col { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; width: clamp(92px,24vw,170px); }
        .qz-crown { position: absolute; top: -30px; font-size: 28px; animation: qz-float-sm 2s ease-in-out infinite; }
        @keyframes qz-float-sm { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .qz-pod-medal { font-size: clamp(30px,5vw,46px); line-height: 1; }
        .qz-pod-name { font-family: 'Manrope'; font-weight: 800; font-size: clamp(14px,2vw,18px); color: #fff; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-pod-pts { font-family: 'Manrope'; font-weight: 600; font-size: clamp(11px,1.5vw,13px); color: rgba(255,255,255,0.72); }
        .qz-pod-bar { width: 100%; border-radius: 12px 12px 0 0; animation: qz-rise 0.9s cubic-bezier(.3,1.2,.4,1); transform-origin: bottom; }
        @keyframes qz-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .qz-pod-col.p1 .qz-pod-bar { height: clamp(90px,14vw,150px); background: linear-gradient(180deg, #FFD34D, #E8A13A); box-shadow: 0 0 44px rgba(255,211,77,0.4); }
        .qz-pod-col.p2 .qz-pod-bar { height: clamp(62px,10vw,104px); background: linear-gradient(180deg, #D8DCE8, #9AA2B8); }
        .qz-pod-col.p3 .qz-pod-bar { height: clamp(44px,7vw,74px); background: linear-gradient(180deg, #D89A5C, #A9682F); }
        .qz-pod-col.me .qz-pod-name { color: #FFC94D; }
        .qz-mypl { margin: 0; font-family: 'Manrope'; font-size: 15px; color: rgba(255,255,255,0.85); }
        .qz-mypl b { color: #FFC94D; }
        .qz-solo-res { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .qz-solo-pts { font-family: 'Manrope'; font-weight: 800; font-size: clamp(52px,9vw,84px); line-height: 1; color: #FFC94D; text-shadow: 0 8px 34px rgba(255,201,77,0.4); }
        .qz-endnote { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 10600; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 94vw; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 16px; padding: 10px 16px; color: #fff; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13.5px; backdrop-filter: blur(6px); }

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
        .pod-col.me .pod-name { color: ${T.accent}; }
        .pod-my { margin: 0; text-align: center; font-family: 'Manrope'; font-size: 14px; color: ${T.ink2}; }
        .pod-my b { color: ${T.accent}; }
        .pod-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow: auto; }
        .pod-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; background: rgba(${T.shadowBase},0.04); }
        .pod-row.me { background: ${T.accentSoft}; outline: 1.5px solid ${T.accent}55; }
        .pod-rank { min-width: 22px; font-size: 12px; font-weight: 700; color: ${T.ink3}; }
        .pod-row-name { flex: 1; min-width: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.ink}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pod-row-dots { display: flex; gap: 4px; }
        .pod-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(${T.shadowBase},0.15); }
        .pod-dot.ok { background: ${T.success}; }
        .pod-dot.bad { background: ${T.accent}; }
        .pod-row-score { min-width: 34px; text-align: right; font-size: 12.5px; font-weight: 700; color: ${T.ink}; }
        .pod-row-time { min-width: 46px; text-align: right; font-size: 11.5px; color: ${T.ink3}; }
        .pod-qstats { display: flex; flex-direction: column; gap: 8px; }
        .qstat-row { display: flex; align-items: center; gap: 10px; }
        .qstat-lbl { min-width: clamp(120px,22vw,190px); font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink2}; }
        .qstat-n { min-width: 40px; text-align: right; font-size: 12px; color: ${T.ink2}; }
        .pm-pop { animation: pmPop 0.5s cubic-bezier(.34,1.55,.5,1); }
        @keyframes pmPop { 0% { transform: scale(0.9); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .pm-match { animation: pmMatch 0.55s cubic-bezier(.34,1.5,.5,1); }
        @keyframes pmMatch { 0% { transform: scale(1); } 35% { transform: scale(1.06); box-shadow: 0 0 0 5px rgba(31,122,77,0.16); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(31,122,77,0); } }
        .pm-shake { animation: shake 0.4s ease; }
        .fade-step { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes dl-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.16); } }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }


        /* option-wait (jonli test kutish holati) */
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; }
        /* frame-wait (feedback kutish) */
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }
      `}</style>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="JS darsi" />
          ) : (
            <>
              <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
              <LiveBadge live={live} total={TOTAL_SCREENS} />
            </>
          )}
        </div>
      </LiveGateCtx.Provider>
    </LangContext.Provider>
  );
}
