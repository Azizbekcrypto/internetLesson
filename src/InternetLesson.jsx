import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
// ============================================================
// JONLI DARS (live) — SHU FAYLGA JOYLANGAN, KUTUBXONASIZ (toza fetch + polling).
// LMS'ga shu .jsx ni o'zini yuklaysiz — tashqi import YO'Q (faqat React).
// O'chirish: LIVE_SUPABASE_URL = '' qiling → dars oddiy rejimda ishlaydi.
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
// Nickname — qurilma bo'ylab BITTA (darsga bog'lanmagan kalit): 1-darsda yozadi, qolganlariga o'zi chiqadi
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
// screenIdx berilmasa — faqat DARS javoblari (<100); Mustahkamlash-jang javoblari 100+ indekslarda
const liveAnswers = (pin, screenIdx) => liveList(`live_answers?pin=eq.${encodeURIComponent(pin)}${screenIdx == null ? '&screen_idx=lt.100' : `&screen_idx=eq.${screenIdx}`}&select=player_id,screen_idx,picked,correct,elapsed_ms`);
const liveQuizAnswers = (pin) => liveList(`live_answers?pin=eq.${encodeURIComponent(pin)}&screen_idx=gte.100&select=player_id,screen_idx,picked,correct,elapsed_ms`);

const LiveGateCtx = createContext(null);
const useLiveLock = () => { const c = useContext(LiveGateCtx); return !!(c && c.locked); };

function useLiveSession(lessonId, answerKey) {
  const keyRef = useRef(answerKey); keyRef.current = answerKey; // javob kaliti — mentor darsni ochganda serverga avto-yuklanadi (SQL shart emas)
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
  const [quiz, setQuiz] = useState({ state: 'off', q: -1 }); // Mustahkamlash-jang holati (serverdan)
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
  }, [mode, pin, lessonId]);

  // MENTOR: heartbeat + o'lik sessiya tekshiruvi
  useEffect(() => {
    if (mode !== 'mentor' || !pin) return;
    let on = true;
    liveGet(pin).then(row => {
      if (!on) return;
      if (!row || row.status === 'ended') { liveClear(lessonId); setPin(null); tokenRef.current = null; setMode('choosing'); setEnded(false); return; }
      syncQuiz(row); // mentor sahifani yangilagan bo'lsa — jang holati tiklanadi
    }).catch(() => {});
    const id = setInterval(() => { liveRpc('session_heartbeat', { p_pin: pin, p_token: tokenRef.current }).catch(() => {}); }, LIVE_HEARTBEAT_MS);
    return () => { on = false; clearInterval(id); };
  }, [mode, pin, lessonId]);

  const startMentor = useCallback(async (mentorCode) => {
    setBusy(true); setJoinError('');
    try {
      const res = await liveRpc('create_session', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim() });
      const row = Array.isArray(res) ? res[0] : res;
      if (!row?.pin) throw new Error('no pin');
      tokenRef.current = row.token; setPin(row.pin); setMode('mentor'); setEnded(false);
      liveStore(lessonId, { mode: 'mentor', pin: row.pin, token: row.token });
      // Javob kalitini serverga avto-yuklash (mentor-kod bilan) — bu dars uchun endi kalit SQL SHART EMAS
      if (keyRef.current) liveRpc('set_quiz_keys', { p_lesson_id: lessonId, p_mentor_code: (mentorCode || '').trim(), p_keys: keyRef.current }).catch(() => {});
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

  // Mustahkamlash-jang boshqaruvi (faqat mentor): 'lobby' | 'q' | 'r' | 'done'
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

// ===== Mentor avatari — oddiy emoji icon (rasmga bog'liq emas) =====

// ============================================================
// JONLI DARS (live session) — Kahoot uslubida sinxronizatsiya.
// Mentor PIN yaratadi → o'quvchilar PIN bilan qo'shiladi va mentordan
// OLDINGA o'tolmaydi (orqaga — mumkin); "Tamom" bosilganda hammaga erkinlik.
// Logika `src/live/` modulida (hook + UI + ctx) — barcha darslar baham ko'radi.
// O'chirib qo'yish: src/live/liveClient.js da SUPABASE_URL ni '' qiling.
// ============================================================

// ============================================================
// HTML 1-DARS — PLATFORM STANDARD v15 (Notion: design_system + platform_contract + infrastructure_v1)
// Arxitektura va asosiy dizayn — Notiondan. 17 ekran bizning kontentimiz.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// Eslatma: ekran-spetsifik widget bezaklari page-by-page bosqichida yakuniy sayqal oladi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

const LangContext = createContext('uz');
const MentorCtx = createContext(null); // mobil: yig'iladigan Mentor
const useLang = () => useContext(LangContext);
const useT = () => {
  const lang = useLang();
  return useCallback((node) => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (React.isValidElement(node)) return node;
    if (node[lang] !== undefined) return node[lang];
    return node.uz ?? node.ru ?? '';
  }, [lang]);
};

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

const LESSON_META = { lessonId: 'internet-01-v17', lessonTitle: { uz: 'Internet qanday ishlaydi', ru: 'Как устроен интернет' } };
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
  { id: 's13b', type: 'game',       template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'MCScreen', scored: true,  scope: 'final' },
  { id: 's15b', type: 'stats',      template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
// Podium sahifasidagi savol-statistika yorliqlari (indeks → qisqa nom)
const Q_LABELS = { 4: '1 — Brauzer', 6: '2 — Domen', 10: '3 — DNS', 13: '4 — Server (HTML)', 17: "5 — Yakuniy (so'rov tartibi)" };
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const CodeBox = ({ children }) => <pre className="code-box">{children}</pre>;
const Tg = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Sr = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Preview = ({ children, title = 'preview.html', minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH }}>{children}</div></div>
);
const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic, mentorCollapse }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768); // mobil: Mentor yig'ilish rejimi
  const collapseOn = (isNarrow || mentorCollapse) && !mentorStatic; // mentorCollapse — desktopda ham yig'iladi
  const padH = isMobile ? 12 : 60; // desktop: 100 → 60 (kontent kengaydi, shriftlar o'z o'lchamida)
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]); // har ekranda Mentor ochiq holatdan boshlanadi
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* AUDIOSIZ: ovoz tugmasi (AudioIndicator) ko'rsatilmaydi — ovoz allaqachon o'chirilgan */}
              <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
            </div>
          </div>
        </div>
        <div ref={contentRef} onClick={onContentClick} className={`stage-content ${narrow ? 'narrow' : ''}`} style={{ paddingLeft: padH, paddingRight: padH }}>{children}</div>
        {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
      </div>
    </MentorCtx.Provider>
  );
};
const NavBack = ({ onPrev }) => <button className="btn-ghost" onClick={onPrev} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Orqaga</button>;
const NavNext = ({ disabled, label = 'Davom etish', onClick, optionalLive }) => {
  const gate = useContext(LiveGateCtx);
  const locked = !!(gate && gate.locked); // jonli darsda mentordan oldinga o'tib bo'lmaydi
  // optionalLive: animatsiya-mashq sahifalari. Jonli dars DAVOMIDA (o'quvchi hali ozod
  // qilinmagan) bajarish majburiy emas — mentor proyektorda ko'rsatadi, o'quvchi orqada
  // qolmasin. Erkin rejimda (ended / mentor uzilgan / self) yana MAJBURIY bo'ladi.
  // Testlar va 16-sahifa (IP-o'yin) optionalLive bermaydi — ular doim majburiy.
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
          {/* Xato qilgan o'quvchi (yoki mustaqil o'quvchi) mavzuni qisqa kartalarda qayta ko'radi.
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

// ===== MENTOR STATISTIKASI — test ekranida jonli natija =====
// DIQQAT: mentor ekrani PROYEKTORGA chiqadi — shuning uchun reveal'gacha panel
// HECH NARSANI oshkor qilmaydi: na variant taqsimoti, na ✅/❌ soni. Faqat
// «javob berdi X/Y» va kim kutilayotgani ko'rinadi (birinchi bosganlardan
// ko'chirib olishning iloji yo'q). «Natijani ochish»da hammasi birdan ochiladi.
const MSTATS_COLORS = ['#019ACB', '#8B5CF6', '#E8A13A', '#E0559A']; // A B C D — brend-neytral, hech biri "to'g'ri"ga ishora qilmaydi
// reveal=true bo'lganda (mentor «Natijani ochish» bosgach) to'g'ri qator yashil bo'lib ochiladi
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
  const struggling = answered >= 2 && bad > ok; // yarmidan ko'pi xato — signal
  const answeredIds = new Set(data.rows.map(r => r.player_id));
  const waiting = data.players.filter(p => !answeredIds.has(p.id));
  const maxN = Math.max(1, ...options.map((_, i) => data.rows.filter(a => a.picked === i).length));
  return (
    <div className="mstats fade-up">
      {/* Sarlavha + kim javob berdi progressi */}
      <div className="mstats-head">
        <span className="mstats-lbl">📊 Jonli natija</span>
        <span className="mstats-n">{allIn ? '✓ Hamma javob berdi' : <>Javob berdi: <b>{answered}</b> / {total}</>}</span>
        {!reveal && onReveal && <button className={`mstats-reveal ${allIn ? 'ready' : ''}`} onClick={onReveal}>🔓 Natijani ochish</button>}
      </div>
      <div className="mstats-prog"><span className={`mstats-prog-fill ${allIn ? 'full' : ''}`} style={{ width: `${total ? Math.round((answered / total) * 100) : 0}%` }} /></div>

      {/* Katta hisoblagichlar. Reveal'gacha ✅/❌ soni ham, variant taqsimoti ham YASHIRIN —
          panel proyektorda turadi, o'quvchilar birinchi bosganlarning javobini ko'rib olmasin.
          «Natijani ochish» bosilgach hammasi birdan ochiladi. */}
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

      {/* Variantlar taqsimoti — FAQAT reveal'dan keyin (to'g'risi yashil ajralib turadi) */}
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

      {/* Natija ochilgach — VERDIKT: sinf o'zlashtirdimi yoki qayta tushuntirish kerakmi.
          Foiz javob berganlar ustidan; ishonchli xulosa uchun kamida RECAP_MIN_ANSWERS javob kerak. */}
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

      {/* Kim hali javob bermadi — ismlari */}
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

// ===== MENTOR (nomsiz ustoz ovozi — intro/izoh shu orqali; audio matni = shu matn) =====
const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
      <div className="mentor-ava" aria-hidden="true">🧑‍🏫</div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
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

// Konfetti — dars muvaffaqiyatli tugaganda yog'iladigan bayram effekti
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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Brauzerga youtube.com yozib Enter bosasiz — bir soniyada sayt chiqadi. Lekin shu bir soniya ichida ekran ortida so'rovingiz katta yo'lni bosib o'tadi. Sizningcha, sayt qayerdan keladi?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [phase, setPhase] = useState(storedAnswer ? 'site' : 'idle');
  const OPTS = [
    { id: 'a', label: 'Kompyuterimning ichidan' },
    { id: 'b', label: 'Boshqa kompyuterdan — internet orqali' },
    { id: 'c', label: "Hech qayerdan, o'zi paydo bo'ladi" }
  ];
  const go = () => { if (phase !== 'idle') return; setPhase('loading'); setTimeout(() => setPhase('site'), 900); };
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext optionalLive disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up">Sayt manzilini yozib Enter bossangiz, u <span className="italic" style={{ color: T.accent }}>qayerdan</span> keladi?</h1>
        <Mentor>Telefon yoki kompyuterda <b style={{ color: T.ink }}>youtube.com</b> yozib Enter bossangiz — bir soniyada sayt chiqadi. Lekin shu bir soniya ichida ekran ortida so'rovingiz katta <b style={{ color: T.ink }}>yo'lni</b> bosib o'tadi. Avval tugmani bosing, keyin taxmin qiling: sayt qayerdan keladi?</Mentor>
        <Split>
          <Col>
            <div className="urlbar fade-up delay-1"><span className="urlbar-lock">🔒</span><span className="urlbar-text">youtube.com</span><button className="urlbar-go" onClick={go} disabled={phase !== 'idle'}>Enter ↵</button></div>
            <Preview minH={150} title="youtube.com">
              {phase === 'idle' && <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>↑ Manzilni yozib Enter bosing…</p>}
              {phase === 'loading' && <p className="mono" style={{ color: T.ink2, textAlign: 'center', margin: 0 }}><span className="gen-line">Sayt yuklanmoqda</span></p>}
              {phase === 'site' && (
                <div className="fade-step">
                  <div style={{ height: 9, width: '42%', background: '#FF0000', borderRadius: 4, marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 8 }}>{[0, 1].map(i => (<div key={i} style={{ flex: 1 }}><div style={{ height: 44, background: '#dcd9d2', borderRadius: 7, marginBottom: 5 }} /><div style={{ height: 6, background: '#cbc8c1', borderRadius: 3, width: '85%', marginBottom: 3 }} /><div style={{ height: 6, background: '#dcd9d2', borderRadius: 3, width: '55%' }} /></div>))}</div>
                </div>
              )}
            </Preview>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, sayt qayerdan keladi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'nalish! Sayt boshqa kompyuterda — serverda yashaydi. Buni internet yetkazib beradi.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (aylana shaklidagi jonli sayohat) =====
// Stansiyalar aylana bo'ylab joylashadi; paket aylana yo'l bo'ylab soat yo'nalishida aylanadi —
// uydan (Siz) chiqib, brauzer → DNS → server orqali yana uyga qaytadi (chinakam aylanma sayohat).
const JR_R = 38; // aylana radiusi (markazdan %)
const JR_STATIONS = [
  { k: 'you', ic: '🧑', l: 'Siz', a: 0 },
  { k: 'browser', ic: '🌐', l: 'Brauzer', a: 90 },
  { k: 'dns', ic: '🗂️', l: 'DNS', a: 180 },
  { k: 'server', ic: '🖥️', l: 'Server', a: 270 }
];
const jrPos = (a) => {
  const rad = (a * Math.PI) / 180;
  return { left: `${(50 + JR_R * Math.sin(rad)).toFixed(2)}%`, top: `${(50 - JR_R * Math.cos(rad)).toFixed(2)}%` };
};
// Har qadam: qaysi stansiya yonadi (active), paket turi (kind), yorlig'i (pkt), izoh (cap)
const JR_STEPS = [
  { active: 'browser', kind: 'req',  pkt: '⌨️ youtube.com',  cap: '1-qadam — Enter bosildi! Brauzer manzilni oldi.' },
  { active: 'dns',     kind: 'req',  pkt: 'youtube.com = ?', cap: "2-qadam — Brauzer DNS'dan IP raqamini so'raydi." },
  { active: 'server',  kind: 'ip',   pkt: '142.250.190.78',  cap: "3-qadam — DNS IP'ni topdi — so'rov to'g'ri serverga ketdi." },
  { active: 'you',     kind: 'page', pkt: '▶️ YouTube',       cap: '4-qadam — Server YouTube sahifasini qaytardi — mana, ekraningizda ochildi!' }
];
const JR_STEP_MS = 1785; // jarayon 15% sekinlashtirildi (1550 → 1785)

const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Bugun bir savolga to'liq javob topamiz: youtube.com yozib Enter bosganingizda, sayt sizning ekraningizga qanday yetib keladi? 5 qadamda bu qanday ishlashini ko'ramiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Internet nima?', tag: 'tarmoq' },
    { text: 'Brauzer — saytlarni ochuvchi dastur', tag: 'Chrome, Safari' },
    { text: 'Domen — saytning manzili', tag: 'youtube.com' },
    { text: 'DNS — manzilni topadi', tag: 'domen → IP' },
    { text: 'Server — sayt shu yerda', tag: '' }
  ];
  const DONE = JR_STEPS.length;
  const [jstep, setJstep] = useState(-1); // -1 = idle, 0..DONE-1 = sayohat, DONE = tugadi
  const [turn, setTurn] = useState(0);    // paketning aylana burchagi (har qadam +90°, doim oldinga)
  const [playing, setPlaying] = useState(false);
  const baseRef = useRef(0);              // har sayohat oxiridagi to'plangan burchak (orqaga aylanmaslik uchun)
  const timer = useRef(null);
  const animScrollRef = useRef(null);     // mobil: animatsiyaga avtoskroll
  useEffect(() => () => clearTimeout(timer.current), []);
  const play = useCallback(() => {
    clearTimeout(timer.current);
    const base = baseRef.current;
    setPlaying(true); setJstep(0); setTurn(base + 90);
    let i = 0;
    const advance = () => {
      timer.current = setTimeout(() => {
        if (i < JR_STEPS.length - 1) { i++; setJstep(i); setTurn(base + (i + 1) * 90); advance(); }
        else { setJstep(JR_STEPS.length); setTurn(base + 360); baseRef.current = base + 360; setPlaying(false); }
      }, JR_STEP_MS);
    };
    advance();
  }, []);
  // Sahifa ochilganda sayohat o'zi bir marta jonlanadi
  useEffect(() => { const t = setTimeout(play, 750); return () => clearTimeout(t); }, [play]);

  const activeKey = jstep >= 0 && jstep < DONE ? JR_STEPS[jstep].active : (jstep >= DONE ? 'you' : null);
  const cur = jstep >= 0 && jstep < DONE ? JR_STEPS[jstep] : null;
  const caption = jstep < 0
    ? "▶ tugmasini bosing — so'rov bosib o'tadigan butun aylanma yo'lni ko'ramiz."
    : jstep >= DONE
      ? "✓ Tayyor! YouTube ekraningizda ochildi — har bir sayt va ilova xuddi shu yo'l bilan, atigi 1 soniyada keladi."
      : JR_STEPS[jstep].cap;

  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  // Mobil: sahifa ochilib animatsiya o'zi jonlanganda — animatsiyani ko'rinishga skroll qilamiz
  useEffect(() => {
    if (!isNarrow) return;
    const t = setTimeout(() => { if (animScrollRef.current) animScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 850);
    return () => clearTimeout(t);
  }, [isNarrow]);
  const AnimBlock = (
    <Zoomable>
    <div className="jr fade-up delay-1">
      <div className="jr-ring">
        <div className="jr-ring-circle" />
        <div className="jr-hub"><span className="jr-hub-ic">⏱️</span><span className="jr-hub-t">≈ 1 soniya</span></div>
        {JR_STATIONS.map(s => {
          const on = activeKey === s.k;
          const delivered = jstep >= DONE && s.k === 'you';
          return (
            <div key={s.k} className={`jr-st ${on ? 'on' : ''} ${delivered ? 'delivered' : ''}`} style={jrPos(s.a)}>
              {delivered && <span className="jr-badge">▶️ YouTube ✓</span>}
              <span className="jr-ic">{s.ic}</span>
              <span className="jr-l">{s.l}</span>
            </div>
          );
        })}
        <div className="jr-orbit" style={{ transform: `rotate(${turn}deg)` }}>
          <div className={`jr-packet ${cur ? cur.kind : ''} ${cur ? 'show' : ''}`} style={{ transform: `translate(-50%,-50%) rotate(${-turn}deg)` }}>{cur ? cur.pkt : ''}</div>
        </div>
      </div>
      <div className={`jr-cap ${jstep >= DONE ? 'done' : ''}`} key={jstep}>{caption}</div>
      <div className="jr-dots">{JR_STEPS.map((_, i) => <span key={i} className={`jr-dot ${(jstep > i || jstep >= DONE) ? 'fill' : ''} ${jstep === i ? 'cur' : ''}`} />)}</div>
      <button className="btn" style={{ alignSelf: 'center' }} onClick={play} disabled={playing}>{playing ? "So'rov yo'lda…" : (jstep >= DONE ? "↻ Yana ko'rish" : "▶ Yo'lni boshlash")}</button>
    </div>
    </Zoomable>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Dars rejasi — 5 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol>
    </Col>
  );

  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Sayt sizgacha qanday yetib keladi?</span></h2></div>
        <Mentor>Bugun bitta savolga to'liq javob topamiz: <b style={{ color: T.ink }}>youtube.com</b> yozib Enter bosganingizda, sayt ekraningizga qanday yetib keladi? Quyidagi <b style={{ color: T.ink }}>aylanma yo'lni</b> kuzating — dars oxirida hammasini o'zingiz tushuntirib bera olasiz.</Mentor>
        {!isNarrow ? (
          <Split>{AnimBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div ref={animScrollRef} className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {AnimBlock}
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Dars rejasini ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Animatsiyani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — INTERNET (tarmoq) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Internet — bu butun dunyo bo'ylab millionlab kompyuterlar bir-biriga ulangan ulkan tarmoq. Xuddi yo'llar to'ri kabi — har bir kompyuter boshqasiga "yo'l" orqali bog'langan. Tugmani bosib, ma'lumot qanday yurishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const NODES = [
    { k: 'phone', ic: '📱', l: 'Telefon', pos: [42, 36] },
    { k: 'laptop', ic: '💻', l: 'Noutbuk', pos: [42, 120] },
    { k: 'tablet', ic: '📲', l: 'Planshet', pos: [128, 28] },
    { k: 'tv', ic: '📺', l: 'TV', pos: [128, 126] },
    { k: 'server', ic: '🖥️', l: 'Server', pos: [222, 78] }
  ];
  const EDGES = [['phone', 'server'], ['laptop', 'server'], ['tablet', 'server'], ['tv', 'server'], ['phone', 'tablet'], ['laptop', 'tv']];
  const PX = {}; NODES.forEach(n => { PX[n.k] = n.pos; });
  const [connected, setConnected] = useState(!!storedAnswer);
  const done = connected;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Internet" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Ulanishlarni ko'rsating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Internet aslida <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></div>
        <Mentor>Internet — bu butun dunyo bo'ylab <b style={{ color: T.ink }}>millionlab kompyuterlar</b> bir-biriga ulangan ulkan <b style={{ color: T.ink }}>tarmoq</b>. Xuddi shaharni bog'lab turgan yo'llar kabi — uyingizdagi telefon, TV va noutbuk ham shu tarmoqqa ulangan. Tugmani bosib, ulanishlarni ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="web fade-up delay-2" style={{ height: 165 }}>
              <svg className="web-svg" viewBox="0 0 260 154" preserveAspectRatio="none">{EDGES.map(([a, b], i) => (<line key={i} x1={PX[a][0]} y1={PX[a][1]} x2={PX[b][0]} y2={PX[b][1]} stroke={connected ? T.accent : T.ink3} strokeWidth={connected ? 1.8 : 1} strokeDasharray={connected ? '0' : '4 3'} opacity={connected ? 0.9 : 0.5} style={{ transition: 'all 0.5s' }} />))}{connected && EDGES.map(([a, b], i) => (<circle key={`pkt${i}`} r="2.6" fill={T.accent}><animate attributeName="cx" values={`${PX[a][0]};${PX[b][0]}`} dur="1.5s" begin={`${(i * 0.22).toFixed(2)}s`} repeatCount="indefinite" /><animate attributeName="cy" values={`${PX[a][1]};${PX[b][1]}`} dur="1.5s" begin={`${(i * 0.22).toFixed(2)}s`} repeatCount="indefinite" /></circle>))}</svg>
              {NODES.map(n => (<div key={n.k} className={`web-node ${connected ? 'on' : ''}`} style={{ left: `${n.pos[0] / 260 * 100}%`, top: `${n.pos[1] / 154 * 100}%`, display: 'flex', alignItems: 'center', gap: 5 }}><span>{n.ic}</span><span>{n.l}</span></div>))}
            </div>
            {!connected && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setConnected(true)}>🔗 Ulanishlarni ko'rsatish</button>}
          </div>
          <div className="col">            {connected ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Mana tarmoq</p><p className="body" style={{ margin: 0, color: T.ink }}>Har bir qurilma boshqasiga <b>"yo'l"</b> bilan bog'langan. Ma'lumot shu yo'llar orqali yuradi. <b>Inter-net</b> = "tarmoqlararo" degani.</p></div>
            ) : (
              <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Telefon, noutbuk, TV, server… hammasi ulangan. Ulanishlarni ko'rish uchun tugmani bosing.</p></div>
            )}
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Asosiy:</b> internet — qurilmalarni bog'lovchi tarmoq. Saytlar shu tarmoq orqali sizgacha keladi.</p></div>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};
// Brauzer logotiplari — har biri o'z brendi rangida (farqi ko'zga tashlansin)
const BrowserLogo = ({ k, size = 30 }) => {
  const ring = { width: size, height: size, borderRadius: '50%', position: 'relative', flexShrink: 0, display: 'inline-block', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.28)' };
  if (k === 'chrome') return (
    <span style={{ ...ring, background: 'conic-gradient(from -90deg, #EA4335 0 120deg, #34A853 120deg 240deg, #FBBC05 240deg 360deg)' }}>
      <span style={{ position: 'absolute', inset: '26%', borderRadius: '50%', background: '#fff' }} />
      <span style={{ position: 'absolute', inset: '33%', borderRadius: '50%', background: '#1A73E8' }} />
    </span>
  );
  if (k === 'firefox') return (
    <span style={{ ...ring, background: 'radial-gradient(circle at 62% 30%, #FFE259 0 8%, #FF9D17 30%, #FF4406 62%, #B5170B 96%)' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 20deg, transparent 0 250deg, rgba(255,213,84,0.9) 322deg, transparent 360deg)' }} />
    </span>
  );
  if (k === 'edge') return (
    <span style={{ ...ring, background: 'conic-gradient(from 150deg, #36D6B7 0deg, #1B9DE2 130deg, #0C5B8F 250deg, #36D6B7 360deg)' }}>
      <span style={{ position: 'absolute', inset: '26%', borderRadius: '50%', background: 'radial-gradient(circle at 38% 38%, rgba(234,250,246,0.95), rgba(234,250,246,0) 72%)' }} />
    </span>
  );
  // safari — ko'k kompas, qizil-oq strelka
  return (
    <span style={{ ...ring, background: 'radial-gradient(circle, #fbfdff 0 12%, #4aa3ff 24%, #1574E0 82%)' }}>
      <svg viewBox="0 0 48 48" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <polygon points="24,24 36,12 27,27" fill="#FF4136" />
        <polygon points="24,24 12,36 21,21" fill="#ffffff" />
        <circle cx="24" cy="24" r="2.2" fill="#0b3c78" />
      </svg>
    </span>
  );
};

// ===== SCREEN 3 — BRAUZER =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Saytlarni ochish uchun maxsus dastur kerak — bu brauzer. Chrome, Safari, Firefox — bularning hammasi brauzer. Siz manzilni yozasiz, brauzer internetdan saytni topib keltiradi va ekranga chiroyli qilib chizadi. Brauzerni tanlab ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const BROWSERS = [{ k: 'chrome', l: 'Chrome', color: '#1A73E8' }, { k: 'safari', l: 'Safari', color: '#1574E0' }, { k: 'firefox', l: 'Firefox', color: '#FF6611' }, { k: 'edge', l: 'Edge', color: '#1B9DE2' }];
  const [br, setBr] = useState(storedAnswer?.picked || null);
  const done = br !== null;
  const cur = BROWSERS.find(b => b.k === br);
  const pick = (k) => { setBr(k); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: k }); };
  return (
    <Stage eyebrow="Brauzer" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Brauzer tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytlarni qaysi <span className="italic" style={{ color: T.accent }}>dastur</span> ochib beradi?</h2></div>
        <Mentor>Saytlarni ochish uchun maxsus <b style={{ color: T.ink }}>dastur</b> kerak — bu <b style={{ color: T.ink }}>brauzer</b>. Telefondagi Chrome, Safari yoki kompyuterdagi Firefox — hammasi brauzer. Siz manzilni yozasiz, brauzer saytni <b style={{ color: T.ink }}>topib keltiradi</b> va ekranga chiroyli qilib chizadi. Birini tanlang.</Mentor>
        <div className="split">
          <div className="col">
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Brauzeringizni tanlang</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{BROWSERS.map(b => {
              const on = br === b.k;
              return (
                <button key={b.k} onClick={() => pick(b.k)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '12px 16px', minWidth: 86, cursor: 'pointer', background: T.paper, border: `2px solid ${on ? b.color : 'rgba(58,53,48,0.14)'}`, borderRadius: 14, boxShadow: on ? `0 9px 22px -8px ${b.color}88` : '0 2px 8px -4px rgba(58,53,48,0.16)', transform: on ? 'translateY(-2px)' : 'none', transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease' }}>
                  <BrowserLogo k={b.k} size={36} />
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13, color: on ? T.ink : T.ink2 }}>{b.l}</span>
                </button>
              );
            })}</div>
            <div className="frame-soft fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}>Qaysi brauzer bo'lishidan qat'i nazar — vazifasi bir xil: <b>manzilni olib, saytni keltirib, ekranga chizish</b>.</p></div>
          </div>
          <div className="col">            <div className="flow-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{done ? <><BrowserLogo k={br} size={18} /><span>{cur.l} youtube.com'ni ochdi</span></> : "Sayt shu yerda ochiladi"}</div>
            <Preview title={done ? `${cur.l} — youtube.com` : 'brauzer'} minH={150}>
              {done ? (
                <SiteMock site={{ mock: 'youtube', ic: '▶️', name: 'YouTube', bar: '#FF0000' }} />
              ) : (<p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Brauzer tanlang — sayt shu yerda ochiladi</p>)}
            </Preview>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST (brauzer) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Internetdagi saytlarni topib, ekranga ochib beradigan dastur qanday nomlanadi?"
    questionText="Internetdagi saytlarni ochib beradigan dastur qanday nomlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Internetdagi saytlarni ochib, ekranga chiqaradigan dastur qanday nomlanadi?</h2></>}
    options={['Server', 'Brauzer', 'Domen', 'DNS']} correctIdx={1}
    explainCorrect="Zo'r! Brauzer (Chrome, Safari, Firefox, Edge) — saytlarni ochib beruvchi dastur. U saytni topadi va ekranga chizib beradi."
    explainWrong={{ 0: 'Server — saytlar saqlanadigan kompyuter. Uni ochib ko’rsatadigan — brauzer.', 2: 'Domen — saytning manzili (youtube.com), dastur emas.', 3: 'DNS — manzilni IP raqamiga aylantiradi. Saytni ko’rsatadigan — brauzer.', default: 'Saytlarni ochib beradigan dastur — brauzer.' }} />
);

// ===== SCREEN 5 — DOMEN =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Saytga borish uchun uning manzilini bilish kerak. Bu manzil — domen: youtube.com, google.uz. Xuddi uyingizning manzili kabi — uni yozsangiz, aynan o'sha saytga borasiz. Domenni tanlab, qismlarini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const DOMAINS = [
    { full: 'youtube.com', name: 'youtube', tld: '.com', note: '.com — tijoriy va umumiy saytlar uchun.' },
    { full: 'google.uz', name: 'google', tld: '.uz', note: ".uz — O'zbekiston saytlari uchun." },
    { full: 'wikipedia.org', name: 'wikipedia', tld: '.org', note: '.org — tashkilotlar uchun.' }
  ];
  const [sel, setSel] = useState(storedAnswer?.picked || null);
  const done = sel !== null;
  const cur = DOMAINS.find(d => d.full === sel);
  const pick = (f) => { setSel(f); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: f }); };
  return (
    <Stage eyebrow="Domen" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Domenni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytning <span className="italic" style={{ color: T.accent }}>manzili</span> qanday bo'ladi?</h2></div>
        <Mentor>Saytga borish uchun uning <b style={{ color: T.ink }}>manzilini</b> bilishingiz kerak — bu <b style={{ color: T.ink }}>domen</b>: youtube.com, google.uz. Xuddi do'stingiznikiga borish uchun uy manzilini bilganingizdek — manzilni yozsangiz, aynan o'sha saytga borasiz. Domenni tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Domenni tanlang</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{DOMAINS.map(d => (<button key={d.full} className={`chip ${sel === d.full ? 'chip-on' : ''}`} onClick={() => pick(d.full)}>{d.full}</button>))}</div>
            <div className="frame-soft fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}><b>Asosiy:</b> domen — odam eslab qoladigan sayt manzili. Bitta sayt = bitta domen.</p></div>
          </div>
          <div className="col">
            <div className="flow-label">Domen qismlari</div>
            {done ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="domsplit" key={cur.full}><span className="dpart dpart-name dsp-l">{cur.name}</span><span className="dpart dpart-tld dsp-r">{cur.tld}</span></div>
                <div className="dlabels"><span><b style={{ color: T.accent }}>nom</b> — sayt nomi</span><span><b style={{ color: T.blue }}>zona</b> — turi</span></div>
                <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>{cur.note}</p></div>
              </div>
            ) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Domenni tanlang — qismlarga ajraladi</p></div>)}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST (domen) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="youtube.com, google.uz — saytning bunday manzili nima deb ataladi?"
    questionText="youtube.com, google.uz — bunday sayt manzili nima deb ataladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>youtube.com</span>, google.uz — bunday sayt manzili nima deb ataladi?</h2></>}
    options={['Brauzer', 'Parol', 'Domen', 'Server']} correctIdx={2}
    explainCorrect="Aniq topdingiz! Domen — saytning odam oson eslab qoladigan manzili (youtube.com)."
    explainWrong={{ 0: 'Brauzer — saytni ochadigan dastur, manzil emas.', 1: 'Parol — maxfiy so’z. Sayt manzili — domen.', 3: 'Server — sayt saqlanadigan kompyuter. Uning manzili (nomi) — domen.', default: 'Sayt manzili — domen deb ataladi.' }} />
);
// ===== SCREEN 6 — IP MANZIL =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Kompyuterlar saytning nomini emas, raqamini tushunadi — bu IP manzil. Tugmani bosing, youtube.com qanday raqamga aylanishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | run | done
  const [scram, setScram] = useState('•••.•••.•••.•••');
  const iv = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearInterval(iv.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const reveal = () => {
    if (phase !== 'idle') return;
    setPhase('run');
    const rnd = (m) => Math.floor(Math.random() * m);
    let n = 0;
    iv.current = setInterval(() => {
      n++;
      setScram(`${rnd(255)}.${rnd(255)}.${rnd(255)}.${rnd(255)}`);
      if (n >= 12) { clearInterval(iv.current); setPhase('done'); }
    }, 70);
  };
  return (
    <Stage eyebrow="IP manzil" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "IP manzilni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kompyuterlar manzilni qanday <span className="italic" style={{ color: T.accent }}>yozadi</span>?</h2></div>
        <Mentor>Kompyuterlar saytning <b style={{ color: T.ink }}>nomini emas, raqamini</b> ishlatadi — bu <b style={{ color: T.ink }}>IP manzil</b>. Tugmani bosing, <b style={{ color: T.ink }}>youtube.com</b> qanday raqamga aylanishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="frame frame-col fade-up delay-2" style={{ alignItems: 'center', gap: 12 }}>
              <span className="dompill"><span className="dpart dpart-name">youtube.com</span></span>
              <p className={`mono small ip-conv ${phase !== 'idle' ? 'go' : ''}`} style={{ margin: 0, textAlign: 'center' }}>↓ raqamga aylantiriladi</p>
              {phase === 'idle'
                ? <button className="btn" onClick={reveal}>🔢 IP manzilni ko'rsatish</button>
                : <span className="ipbox" style={{ opacity: phase === 'run' ? 0.72 : 1 }}><span className="ip-type" key={phase === 'done' ? 'd' : 'r'}>{phase === 'done' ? '142.250.190.78' : scram}</span></span>}
              {phase === 'run' && <p className="mono small" style={{ margin: 0, color: T.blue }}>aylantirilmoqda…</p>}
              {phase === 'done' && <p className="mono small fade-step" style={{ margin: 0, color: T.success, fontWeight: 600 }}>✓ youtube.com = 142.250.190.78</p>}
            </div>
          </div>
          <div className="col" style={{ justifyContent: 'center' }}>
            <div className="flow-label">Xuddi telefon kontaktidek</div>
            <div className="anabox fade-up delay-2"><span className="ana-name">📇 "Aziza"</span><span className="ana-arr">→</span><span className="ana-num">+998 90 123-45-67</span></div>
            <p className="small" style={{ margin: '6px 2px 0', color: T.ink2 }}>Siz <b style={{ color: T.ink }}>nom</b>ni eslaysiz, qurilma esa <b style={{ color: T.ink }}>raqam</b>ni ishlatadi.</p>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — DNS =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Raqamlarni hech kim yodlamaydi! Shuning uchun DNS bor — internetning telefon kitobi: siz domen berasiz, u IP qaytaradi. Domenni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const MAP = { 'youtube.com': '142.250.190.78', 'google.uz': '173.194.220.94', 'wikipedia.org': '208.80.154.224' };
  const PLACE = '•••.•••.•••.••';
  const [q, setQ] = useState(storedAnswer?.q || null);
  const [phase, setPhase] = useState(storedAnswer ? 'found' : 'idle'); // idle | looking | found
  const [scram, setScram] = useState(PLACE);
  const timer = useRef(null);
  const scramIv = useRef(null);
  const done = phase === 'found';
  const rnd = (m) => Math.floor(Math.random() * m);
  useEffect(() => () => { clearTimeout(timer.current); clearInterval(scramIv.current); }, []);
  const lookup = (d) => {
    if (phase === 'looking') return;
    clearTimeout(timer.current); clearInterval(scramIv.current);
    setQ(d); setPhase('looking');
    scramIv.current = setInterval(() => setScram(`${rnd(255)}.${rnd(255)}.${rnd(255)}.${rnd(255)}`), 60);
    timer.current = setTimeout(() => { clearInterval(scramIv.current); setPhase('found'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, q: d }); }, 950);
  };
  const rightIP = phase === 'found' ? MAP[q] : (phase === 'looking' ? scram : PLACE);
  return (
    <Stage eyebrow="DNS" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Domenni qidiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Domen nomidan IP'ni kim <span className="italic" style={{ color: T.accent }}>topadi</span>?</h2></div>
        <Mentor>Raqamlarni hech kim yodlamaydi! Shuning uchun <b style={{ color: T.ink }}>DNS</b> bor — internetning <b style={{ color: T.ink }}>telefon kitobi</b>: siz domen berasiz, u IP qaytaradi. Domenni tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi saytni qidiramiz?</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{Object.keys(MAP).map(d => (<button key={d} className={`chip ${q === d ? 'chip-on' : ''}`} disabled={phase === 'looking'} onClick={() => lookup(d)}>{d}</button>))}</div>
            <div className="dns-card fade-up delay-3">
              <div className="dns-head">📖 DNS — Internet telefon kitobi {phase === 'looking' && <span className="dns-status">🔎 qidirilmoqda…</span>}{phase === 'found' && <span className="dns-status ok">topildi ✓</span>}</div>
              <div className="dns-book">
                {Object.entries(MAP).map(([dom, ip]) => {
                  const isMatch = q === dom;
                  const cls = isMatch && phase === 'looking' ? 'scan' : isMatch && phase === 'found' ? 'hit' : q && phase !== 'idle' ? 'dim' : '';
                  return (
                    <div key={dom} className={`dns-entry ${cls}`}>
                      <span className="dns-dom">{dom}</span>
                      <span className="dns-dots" />
                      <span className="dns-ip" key={cls}>{isMatch && phase === 'found' ? ip : (isMatch && phase === 'looking' ? scram : PLACE)}</span>
                    </div>
                  );
                })}
              </div>
              {!q && <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>Yuqoridan domen tanlang — DNS uni kitobdan topadi</p>}
            </div>
          </div>
          <div className="col">            <div className="flow-label">DNS qanday aylantiradi</div>
            <div className="dnsconv fade-up delay-2">
              <div className="dc-node"><span className="dc-ic">🌐</span><span className="dc-k">domen</span><span className="dc-v">{q || 'youtube.com'}</span></div>
              <div className={`dc-mid ${phase === 'looking' ? 'busy' : ''} ${phase === 'found' ? 'ok' : ''}`}>
                <span className="dc-arrow">↓</span>
                <span className="dc-dns">📖 DNS</span>
                <span className="dc-arrow">↓</span>
              </div>
              <div className={`dc-node dc-ip ${phase === 'found' ? 'hit' : ''}`}><span className="dc-ic">🔢</span><span className="dc-k">IP manzil</span><span className="dc-v" key={phase === 'found' ? 'f' : 'x'}>{rightIP}</span></div>
            </div>
            <p className="small" style={{ margin: '4px 2px 0', color: T.ink2 }}>Siz <b style={{ color: T.ink }}>nom</b> berasiz — DNS <b style={{ color: T.ink }}>raqam</b> qaytaradi. Brauzer keyin shu IP'ga boradi.</p>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — SERVER =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Har bir sayt serverda saqlanadi — bu doim yoniq turadigan kuchli kompyuter. Siz so'rov yuborasiz, server sahifani qaytaradi. Xuddi restoran kabi: buyurtma berasiz, taom tayyor bo'lib keladi. Tugmani bosing.`, trigger: 'on_mount', waits_for: null }]);
  const [step, setStep] = useState(storedAnswer ? 2 : 0);
  const timer = useRef(null);
  const done = step >= 2;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => {
    clearTimeout(timer.current); setStep(0); // qaytadan yuborilganda animatsiya boshidan ko'rinadi
    timer.current = setTimeout(() => {
      setStep(1);
      timer.current = setTimeout(() => { setStep(2); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, 1050);
    }, 70);
  };
  return (
    <Stage eyebrow="Server" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "So'rov yuboring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt o'zi <span className="italic" style={{ color: T.accent }}>qayerda</span> yashaydi?</h2></div>
        <Mentor>Har bir sayt <b style={{ color: T.ink }}>serverda</b> — doim yoniq kuchli kompyuterda — saqlanadi. Siz so'rov yuborasiz, server <b style={{ color: T.ink }}>sahifani qaytaradi</b>. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="cs fade-up delay-2">
              <div className="cs-node"><span className="cs-ic">🧑‍💻</span><span className="cs-l">Siz<br />(brauzer)</span></div>
              <div className="cs-wire">
                <div className="cs-track">
                  <span className={`cs-chip cs-chip-req ${step >= 1 ? 'sent' : ''} ${step >= 2 ? 'gone' : ''}`}>📨 so'rov</span>
                  <span className={`cs-chip cs-chip-res ${step >= 2 ? 'sent' : ''}`}>📄 sahifa</span>
                </div>
              </div>
              <div className={`cs-node ${step >= 1 ? 'cs-active' : ''} ${step === 1 ? 'cs-proc' : ''}`}><span className="cs-ic">🖥️</span><span className="cs-l">Server<br />(sayt shu yerda)</span></div>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={step === 1} onClick={send}>{step === 1 ? 'Yuborilmoqda…' : (done ? '↻ Yana yuborish' : '📨 Serverga so’rov yuborish')}</button>
          </div>
          <div className="col">            {done ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="flow-label">🖥️ Server qaytargan sahifa</div>
                <Preview title="google.com" minH={130}><SiteMock site={siteInfo('google.com')} /></Preview>
                <div className="frame-success"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Server javob berdi</p><p className="body" style={{ margin: 0, color: T.ink }}>Server <b>google.com</b> sahifasini qaytardi. U <b>doim yoniq</b> — sayt istalgan vaqtda ochiladi.</p></div>
              </div>
            ) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Siz (brauzer) chap tomonda, server o'ngda. So'rov yuborib, javobni kuzating.</p></div>)}
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Server</b> — saytlarni saqlovchi va so'rovga javob beruvchi kuchli kompyuter.</p></div>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};
// ===== SCREEN 9 — TEST (DNS) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Domen nomini, masalan youtube.com ni, kompyuter tushunadigan IP raqamiga kim aylantiradi?"
    questionText="Domen nomini IP raqamiga kim aylantiradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Domen nomini (youtube.com) kompyuter tushunadigan <span className="italic" style={{ color: T.accent }}>IP raqamiga</span> kim aylantiradi?</h2></>}
    options={['Brauzer', 'Domen', 'Server', 'DNS']} correctIdx={3}
    explainCorrect="Barakalla! DNS — internetning telefon kitobi: domen nomini IP raqamiga aylantiradi."
    explainWrong={{ 0: 'Brauzer DNS’dan so’raydi, lekin aylantirishni DNS bajaradi.', 1: 'Domen — bu nomning o’zi. Uni IP’ga aylantiradigan — DNS.', 2: 'Server — sayt saqlanadigan kompyuter. Nomni IP’ga aylantiradigan — DNS.', default: 'Domen → IP aylantirishni DNS bajaradi.' }} />
);

// ===== SCREEN 10 — SO'ROV YO'LI (oldinga oqadigan ma'lumot konveyeri) =====
// Ma'lumot CHAPDAN O'NGGA, oldinga oqadi (orqaga qaytmaydi): Manzil → DNS → Server
// → Brauzer (HTML'ni o'qiydi) → Ekran. Har bosqichda paket o'zgaradi; pastdagi
// detal-kartada o'sha bosqich jonli ko'rsatiladi (URL, IP, HTML kod, o'qish, render).
const PIPE = [
  { k: 'addr',    ic: '⌨️', l: 'Manzil',  pos: 10, pkt: '⌨️ youtube.com',    cls: 'req',  cap: '1 — Siz brauzerga youtube.com yozib Enter bosdingiz', note: 'Mana, siz brauzerimizga youtube.com yozib Enter bosdingiz. Endi brauzer ishga tushadi va saytni qidira boshlaydi.' },
  { k: 'dns',     ic: '🗂️', l: 'DNS',     pos: 30, pkt: '🔢 142.250.190.78', cls: 'ip',   cap: '2 — DNS nomni IP raqamiga aylantiradi', note: "Hozir brauzerimizdan DNS'ga «youtube.com qaysi raqam?» degan so'rov oqib bormoqda. DNS uni 142.250.190.78 degan IP raqamiga aylantirib beryapti." },
  { k: 'server',  ic: '🖥️', l: 'Server',  pos: 50, pkt: '📄 HTML kod',        cls: 'page', cap: "3 — Server shu IP'dan sahifani HTML kod sifatida yuboradi", note: "Mana, brauzerimiz shu IP'dagi serverga bordi. Endi server bizga sahifani HTML kod ko'rinishida qaytarib yuboryapti — bu oddiy matn." },
  { k: 'browser', ic: '🌐', l: 'Brauzer', pos: 70, pkt: "👀 o'qilmoqda",      cls: 'read', cap: "4 — Brauzer HTML kodni satrma-satr o'qiydi", note: "Endi brauzerimiz server yuborgan HTML kodni satrma-satr o'qiyapti — har bir kodni tushunib chiqyapti." },
  { k: 'screen',  ic: '🖼️', l: 'Ekran',   pos: 90, pkt: '🎨 sahifa',          cls: 'page', cap: "5 — O'qilgan koddan ekranga chiroyli sahifa chiziladi", note: "Va mana — o'qilgan koddan chiroyli YouTube sahifasi ekraningizga chizildi! Hammasi tayyor." },
];
const PIPE_MS = 2100; // har qadamda biroz to'xtab, Mentor gapini o'qishga ulguriladi
// YouTube'ga mos kod — manzil youtube.com, shuning uchun kod ham, ekran ham YouTube
const PIPE_CODE = [
  <><Tg>{'<h1>'}</Tg>▶️ YouTube<Tg>{'</h1>'}</Tg></>,
  <><Tg>{'<video>'}</Tg>Mushuklar 🐱<Tg>{'</video>'}</Tg></>,
  <><Tg>{'<video>'}</Tg>Futbol ⚽<Tg>{'</video>'}</Tg></>,
];

const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Endi hammasini birlashtiramiz! youtube.com yozsangiz, ma'lumot chapdan o'ngga, bosqichma-bosqich oqadi: manzil DNS'da IP raqamiga aylanadi, server shu IP'dan sahifani HTML kod sifatida yuboradi, brauzer HTML'ni o'qib, ekranga chiroyli chizadi. Tugmani bosib, butun jarayonni kuzating.`, trigger: 'on_mount', waits_for: null }]);
  const [step, setStep] = useState(storedAnswer ? PIPE.length - 1 : -1); // -1 idle, 0..4
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(!!storedAnswer);
  const doneRef = useRef(null);
  const firstRef = useRef(true);
  // Bosqichma-bosqich oldinga yuradi; pauza qilsa to'xtaydi, davom etsa yana yuradi
  useEffect(() => {
    if (!playing || paused) return;
    if (step >= PIPE.length - 1) {
      setPlaying(false); setFinished(true);
      if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
      return;
    }
    const t = setTimeout(() => setStep(s => s + 1), PIPE_MS);
    return () => clearTimeout(t);
  }, [step, playing, paused]);
  // Oxirida natijaga avtoskroll (desktop va mobil)
  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    if (finished && doneRef.current) {
      const el = doneRef.current;
      const id = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 280);
      return () => clearTimeout(id);
    }
  }, [finished]);
  const start = () => { setFinished(false); setPaused(false); setStep(0); setPlaying(true); };
  const togglePause = () => setPaused(p => !p);
  const cur = step >= 0 && step < PIPE.length ? PIPE[step] : null;
  const done = finished;
  const pktLeft = cur ? cur.pos : PIPE[0].pos;
  const fillPct = step < 0 ? 0 : (step / (PIPE.length - 1)) * 100;
  const cap = step < 0 ? "▶ tugmani bosing — ma'lumot chapdan o'ngga, bosqichma-bosqich oqadi." : (cur ? cur.cap : '');
  return (
    <Stage eyebrow="So'rov yo'li" screen={screen} audioState={audio} mentorCollapse navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Yo'lni ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.7vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Enter'dan saytgacha — <span className="italic" style={{ color: T.accent }}>butun yo'l</span></h2></div>
        <Mentor><b style={{ color: T.ink }}>youtube.com</b> yozsangiz nima bo'ladi? ▶ tugmasini bosing — ma'lumot <b style={{ color: T.ink }}>chapdan o'ngga</b> oqib, sayt ochiladi. Har qadamni Mentor tushuntirib boradi.</Mentor>
        <Zoomable>
        <div className="frame frame-col fade-up delay-2" style={{ gap: 'clamp(10px,1.6vw,14px)' }}>
          {/* Konveyer — oldinga oqadigan ma'lumot */}
          <div className="pl-line">
            <div className="pl-belt"><div className={`pl-belt-fill ${playing && !paused ? 'go' : ''}`} style={{ width: `${fillPct}%` }} /></div>
            {step >= 0 && <div className={`pl-pkt ${cur ? cur.cls : ''}`} style={{ left: `${pktLeft}%` }}>{cur ? cur.pkt : ''}</div>}
            {PIPE.map((s, i) => (
              <div key={s.k} className={`pl-st ${step === i ? 'on' : ''} ${step > i ? 'done' : ''}`} style={{ left: `${s.pos}%` }}>
                <span className="pl-st-ic">{s.ic}</span>
                <span className="pl-st-l">{s.l}</span>
              </div>
            ))}
          </div>
          <div className="pl-dots">{PIPE.map((_, i) => <span key={i} className={`pl-dot ${step >= i ? 'fill' : ''} ${step === i ? 'cur' : ''}`} />)}</div>
          {step < 0 && <div className="pl-cap">{cap}</div>}

          {/* Detal-karta — joriy bosqich jonli ko'rsatiladi */}
          <div className="pl-detail">
            {step < 0 && <p className="pl-idle">Har bosqich shu yerda jonli ochiladi 👇</p>}
            {step === 0 && (<div className="pl-url fade-step"><span className="pl-lock">🔒</span><span className="mono" style={{ flex: 1, color: T.ink }}>youtube.com</span><span className="pl-enter">Enter ↵</span></div>)}
            {step === 1 && (<div className="pl-conv fade-step"><span className="pl-pill name">youtube.com</span><span className="pl-conv-arr">→</span><span className="pl-pill ip">142.250.190.78</span></div>)}
            {(step === 2 || step === 3) && (
              <div className="pl-codewrap fade-step">
                <div className="pl-codehead">{step === 2 ? '📄 Server yuborgan HTML kod' : "🌐 Brauzer kodni o'qiyapti…"}</div>
                <pre className={`pl-code ${step === 3 ? 'reading' : ''}`}>
                  {PIPE_CODE.map((c, i) => <div key={i} className="pl-codeline">{c}</div>)}
                  {step === 3 && <span className="pl-scan" />}
                </pre>
              </div>
            )}
            {step === 4 && (
              <div className="pl-render fade-step">
                <div className="pl-codehead">🖼️ Ekranda — tayyor sahifa</div>
                <Preview title="youtube.com" minH={150}>
                  <SiteMock site={siteInfo('youtube.com')} />
                </Preview>
              </div>
            )}
          </div>

          {/* Har bosqichda Mentor o'sha qadamni tushuntiradi (pauzada — to'liq o'qishga to'xtaydi) */}
          {playing && cur && (
            <div className={`mentor pl-pausebubble fade-step ${paused ? 'is-paused' : ''}`} key={step}>
              <div className="mentor-ava" aria-hidden="true">🧑‍🏫</div>
              <div className="mentor-col">
                <span className="mentor-name">{paused ? `⏸ ${step + 1}/${PIPE.length} — o'qing, keyin «Davom etish»` : `Mentor · ${step + 1}/${PIPE.length}-qadam`}</span>
                <div className="mentor-msg body">{cur.note}</div>
              </div>
            </div>
          )}

          <div className="pl-controls">
            {playing
              ? <button className="btn" onClick={togglePause} style={{ alignSelf: 'center' }}>{paused ? '▶ Davom etish' : '⏸ Pauza'}</button>
              : <button className="btn" onClick={start} style={{ alignSelf: 'center' }}>{finished ? "↻ Yana ko'rsatish" : "▶ Yo'lni boshlash"}</button>}
          </div>
        </div>
        </Zoomable>
        {done && (<div ref={doneRef} className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Mana butun yo'l</p><p className="body" style={{ margin: 0, color: T.ink }}>Siz <b>manzil</b> yozasiz → <b>DNS</b> IP topadi → <b>server</b> <b>HTML kodini</b> beradi → <b>brauzer</b> uni o'qib ekranga chizadi. Bularning bari — <b>bir soniyada</b>! Keyingi darsda brauzer HTML'ni qanday o'qishini ochamiz.</p></div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — SERVER -> HTML: BRAUZER YOUTUBE'NI O'QIB QURADI (oldingi qadamning ichi) =====
// Yuqorida oldingi sahifa (so'rov yo'li)ni eslatuvchi "ichiga zoom" strip (Server→Brauzer→Ekran, brauzerga 🔍).
// Pastda: brauzer server bergan YouTube HTML'ini satrma-satr o'qib, sahifani quradi.
const YT_VIDEO = (title, views, dur) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '0 0 11px' }}>
    <div style={{ position: 'relative', width: 78, height: 45, borderRadius: 8, background: 'linear-gradient(135deg,#eaeaea,#d2d2d2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ width: 23, height: 23, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, paddingLeft: 2, lineHeight: 1 }}>▶</span>
      <span style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 8, fontWeight: 600, borderRadius: 3, padding: '1px 4px', fontFamily: "'Manrope', sans-serif" }}>{dur}</span>
    </div>
    <div style={{ minWidth: 0, paddingTop: 1 }}>
      <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 12.5, color: '#0f0f0f', lineHeight: 1.25, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 10.5, color: '#777', fontFamily: "'Manrope', sans-serif" }}>CoddyCamp · {views} ko'rish</div>
    </div>
  </div>
);

const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Hozirgina server brauzerga HTML kod qaytarganini ko'rdik. Endi aynan shu qadamning ichiga kiramiz: brauzer o'sha kodni satrma-satr o'qib, YouTube sahifasini chizadi. Tugmani bosing.`, trigger: 'on_mount', waits_for: null }]);
  const HTML = [
    { code: <><Tg>{'<h1>'}</Tg>▶️ YouTube<Tg>{'</h1>'}</Tg></>, el: <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 'clamp(18px,2.6vw,22px)', letterSpacing: '-0.6px', color: '#0f0f0f', margin: '0 0 13px', paddingBottom: 11, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FF0000', color: '#fff', borderRadius: 6, width: 30, height: 21, fontSize: 12, paddingLeft: 1, lineHeight: 1 }}>▶</span>YouTube</h1>, tag: 'sarlavha' },
    { code: <><Tg>{'<video>'}</Tg>Mushuklar 🐱<Tg>{'</video>'}</Tg></>, el: YT_VIDEO('Mushuklar 🐱', '1.2M', '10:24'), tag: 'video' },
    { code: <><Tg>{'<video>'}</Tg>Futbol ⚽<Tg>{'</video>'}</Tg></>, el: YT_VIDEO('Futbol ⚽', '890K', '4:07'), tag: 'video' }
  ];
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | reading | done
  const [active, setActive] = useState(-1); // hozir o'qilayotgan satr
  const [rd, setRd] = useState(storedAnswer ? HTML.length : 0); // chizilgan elementlar soni
  const timer = useRef(null);
  const animRef = useRef(null);
  const resultRef = useRef(null); // mobil: chizilgan sahifaga (natijaga) avtoskroll
  const isMobile = useIsMobile();
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  // Mobil: brauzer kodni o'qib bo'lib, sahifa chizilganda — natijaga skroll
  useEffect(() => {
    if (!done || !isMobile || !resultRef.current) return;
    const el = resultRef.current;
    const id = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 280);
    return () => clearTimeout(id);
  }, [done, isMobile]);
  const start = () => {
    if (phase === 'reading') return;
    clearTimeout(timer.current);
    setPhase('reading'); setRd(0); setActive(0);
    if (isMobile && animRef.current) { const el = animRef.current; requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' })); } // mobil: o'qish boshlanganda animatsiyaga skroll
    let i = 0;
    const tick = () => {
      setActive(i);
      timer.current = setTimeout(() => {
        setRd(i + 1); // satr o'qildi — element chizildi
        i++;
        if (i < HTML.length) { setActive(i); timer.current = setTimeout(tick, 120); }
        else { setActive(-1); setPhase('done'); }
      }, 620);
    };
    tick();
  };
  const reading = phase === 'reading';
  return (
    <Stage eyebrow="Brauzer ichida" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Kodni sahifaga aylantiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Brauzer kodni qanday <span className="italic" style={{ color: T.accent }}>sahifaga</span> aylantiradi?</h2></div>
        <Mentor>Hozirgina server brauzerga <b style={{ color: T.ink }}>HTML kod</b> qaytarganini ko'rdik. Endi aynan <b style={{ color: T.ink }}>shu qadamning ichiga</b> kiramiz: brauzer o'sha kodni <b style={{ color: T.ink }}>satrma-satr o'qib</b>, YouTube sahifasini chizadi.</Mentor>
        {/* 12-darsni eslatuvchi "ichiga zoom" strip */}
        <div className="zi fade-up delay-1">
          <div className="zi-mini">
            <div className="zi-node"><span className="zi-node-ic">🖥️</span><span className="zi-node-l">Server</span></div>
            <div className="zi-wire"><span className="zi-pkt">📄</span></div>
            <div className="zi-node focus"><span className="zi-node-ic">🌐</span><span className="zi-node-l">Brauzer</span><span className="zi-lens">🔍</span></div>
            <div className="zi-wire" />
            <div className="zi-node"><span className="zi-node-ic">🖼️</span><span className="zi-node-l">Ekran</span></div>
          </div>
          <p className="zi-label">🔍 Hozirgina ko'rgan <b>«brauzer o'qiydi»</b> qadamning <b>ichiga</b> kiramiz ↓</p>
        </div>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,1.6vw,16px)' }}>
          <div className="split" ref={animRef}>
            <div className="col">
              <div className="flow-label">📥 Server qaytargan kod (HTML){reading && <span className="dns-status">o'qilmoqda…</span>}</div>
              <pre className="code-box fade-up delay-2">{HTML.map((h, i) => {
                const cls = i === active ? 'reading' : (i < rd ? 'read' : (phase === 'idle' ? '' : 'dim'));
                return <div key={i} className={`htl-line ${cls}`}><span className="htl-code">{h.code}</span>{i < rd && <span className="htl-tick">✓ chizildi</span>}</div>;
              })}</pre>
            </div>
            <div className="col" ref={resultRef}>
              <div className="flow-label">🌐 Brauzer chizgan sahifa</div>
              <Preview title="youtube.com" minH={150}>
                {rd === 0
                  ? (<p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Tugmani bosing — brauzer kodni o'qib, YouTube sahifasini shu yerda chizadi</p>)
                  : (<div style={{ display: 'block' }}>{HTML.slice(0, rd).map((h, i) => <div key={i} className="htl-pop">{h.el}</div>)}</div>)}
              </Preview>
            </div>
          </div>
          <button className="btn" style={{ alignSelf: 'center' }} onClick={start} disabled={reading}>{reading ? "Brauzer o'qiyapti…" : (done ? '↻ Qaytadan' : '🖥️ Brauzer bilan o\'qib chizish')}</button>
        </div>
        </Zoomable>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Chapdagi <b>kod</b> = o'ngdagi <b>YouTube sahifasi</b>. Server faqat HTML matn yuboradi, chiroyli sahifani esa <b>brauzer chizadi</b>. Aynan shunday HTML'ni keyingi modulda <b>o'zingiz yozasiz</b>!</p></div>}
      </div>
    </Stage>
  );
};
// ===== SCREEN 12 — TEST (server javobi) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Server brauzerga aniq nima qaytaradi?"
    questionText="Server brauzerga aniq nima qaytaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Server brauzerga aniq <span className="italic" style={{ color: T.accent }}>nima</span> qaytaradi?</h2></>}
    options={['Domen nomi', 'Sahifa kodi (HTML)', 'DNS manzili', 'Boshqa brauzer']} correctIdx={1}
    explainCorrect="To'ppa-to'g'ri! Server sahifa kodini — HTML'ni qaytaradi. Brauzer uni o'qib, chiroyli sahifaga aylantiradi."
    explainWrong={{ 0: 'Domen nomini siz yozasiz, server emas. Server HTML kodini qaytaradi.', 2: 'DNS manzilini DNS beradi. Server esa sahifa kodini (HTML) qaytaradi.', 3: 'Brauzer sizda allaqachon bor. Server HTML kodini jo’natadi.', default: 'Server HTML — sahifa kodini qaytaradi.' }} />
);

// ===== SCREEN 13 — SIMULATOR (o'zing so'rov yubor — 2-page kabi aylanma sayohat) =====
// Har bir sayt uchun o'z ma'lumoti: ikonka, nomi, IP va brend rangi.
// Tanlangan saytga qarab aylanma sayohat jonlanadi (google bersa Google, youtube bersa YouTube).
const SITE_CATALOG = {
  'youtube.com':   { ic: '▶️', name: 'YouTube',   ip: '142.250.190.78',  bar: '#FF0000', mock: 'youtube' },
  'google.com':    { ic: '🔍', name: 'Google',    ip: '142.250.185.78',  bar: '#4285F4', mock: 'google' },
  'google.uz':     { ic: '🔍', name: 'Google',    ip: '142.250.185.3',   bar: '#4285F4', mock: 'google' },
  'wikipedia.org': { ic: '📚', name: 'Wikipedia', ip: '208.80.154.224',  bar: '#202122', mock: 'wikipedia' },
  'instagram.com': { ic: '📷', name: 'Instagram', ip: '157.240.221.174', bar: '#E1306C', mock: 'generic' },
  'telegram.org':  { ic: '✈️', name: 'Telegram',  ip: '149.154.167.99',  bar: '#229ED9', mock: 'generic' }
};
const siteInfo = (raw) => {
  const t = String(raw || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!t) return null;
  if (SITE_CATALOG[t]) return { domain: t, ...SITE_CATALOG[t] };
  // Katalogda yo'q domen — nomini va IP'ni domendan hosil qilamiz
  const label = t.split('.')[0] || t;
  const name = label.charAt(0).toUpperCase() + label.slice(1);
  let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 100000;
  const ip = `185.${h % 200 + 20}.${(h * 7) % 200 + 10}.${(h * 13) % 200 + 5}`;
  return { domain: t, ic: '🌐', name, ip, bar: T.accent, mock: 'generic' };
};

// Natija oynasida — saytni tahminiy, real ko'rinishida chizadi (har sayt o'ziga xos)
const SiteMock = ({ site }) => {
  if (!site) return null;
  if (site.mock === 'google') {
    return (
      <div className="fade-step" style={{ textAlign: 'center', padding: '18px 6px 14px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 30, letterSpacing: '-1px', marginBottom: 16 }}>
          <span style={{ color: '#4285F4' }}>G</span><span style={{ color: '#EA4335' }}>o</span><span style={{ color: '#FBBC05' }}>o</span><span style={{ color: '#4285F4' }}>g</span><span style={{ color: '#34A853' }}>l</span><span style={{ color: '#EA4335' }}>e</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, maxWidth: 250, margin: '0 auto', border: '1px solid #dcdce0', borderRadius: 99, padding: '9px 15px', boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}>
          <span style={{ color: '#9aa0a6', fontSize: 13 }}>🔍</span>
          <div style={{ flex: 1, height: 6, background: '#e8eaed', borderRadius: 3 }} />
          <span style={{ color: '#4285F4', fontSize: 13 }}>🎤</span>
        </div>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginTop: 16 }}>
          {['Google Qidiruv', 'Menga omad'].map(l => (<div key={l} style={{ background: '#f8f9fa', border: '1px solid #f1f1f1', borderRadius: 4, padding: '7px 12px', fontSize: 10, color: '#5f6368', fontFamily: 'Manrope, sans-serif' }}>{l}</div>))}
        </div>
      </div>
    );
  }
  if (site.mock === 'youtube') {
    return (
      <div className="fade-step">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 9 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FF0000', color: '#fff', borderRadius: 5, width: 23, height: 16, fontSize: 9, paddingLeft: 1, lineHeight: 1 }}>▶</span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '-0.6px', color: '#0f0f0f' }}>YouTube</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flex: '0 1 130px', maxWidth: 140, border: '1px solid #e3e3e3', borderRadius: 99, padding: '4px 10px', background: '#fff' }}>
            <div style={{ flex: 1, height: 5, background: '#ececec', borderRadius: 3 }} />
            <span style={{ fontSize: 10, color: '#909090', lineHeight: 1 }}>🔍</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ position: 'relative', height: 50, background: 'linear-gradient(135deg,#eaeaea,#d2d2d2)', borderRadius: 9, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, paddingLeft: 2, lineHeight: 1 }}>▶</span>
                <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.78)', color: '#fff', fontSize: 8, fontWeight: 600, borderRadius: 3, padding: '1px 4px', fontFamily: 'Manrope, sans-serif' }}>{i === 0 ? '10:24' : '4:07'}</span>
              </div>
              <div style={{ height: 6, background: '#c9c9c9', borderRadius: 3, width: '92%', marginBottom: 4 }} />
              <div style={{ height: 5, background: '#e2e2e2', borderRadius: 3, width: '58%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (site.mock === 'wikipedia') {
    return (
      <div className="fade-step">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid #eaecf0', paddingBottom: 8, marginBottom: 9 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 22, color: '#202122' }}>W</span>
          <div><div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#202122', lineHeight: 1.1 }}>WIKIPEDIA</div><div style={{ fontSize: 8, color: '#72777d' }}>Erkin ensiklopediya</div></div>
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#000', marginBottom: 8 }}>Maqola</div>
        {[100, 96, 90, 68].map((w, i) => (<div key={i} style={{ height: 5, background: '#dfe1e5', borderRadius: 2, width: `${w}%`, marginBottom: 6 }} />))}
      </div>
    );
  }
  // generic — boshqa saytlar uchun brend rangidagi sodda sahifa
  return (
    <div className="fade-step">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{site.ic}</span>
        <div style={{ height: 9, width: '42%', background: site.bar || T.accent, borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{[0, 1].map(i => (<div key={i} style={{ flex: 1 }}><div style={{ height: 42, background: '#dcd9d2', borderRadius: 7, marginBottom: 5 }} /><div style={{ height: 6, background: '#cbc8c1', borderRadius: 3, width: '85%' }} /></div>))}</div>
    </div>
  );
};
// ============================================================
// 📖 QAYTA TUSHUNTIRISH (recap) — VARIANT A: faqat proyektor, server sinxroni YO'Q.
// Test natijasi past chiqsa mentor shu overlay'ni ochadi: testga taalluqli 2–3
// nazariya sahifasining JAMLANGAN qisqa kartalari bilan og'zaki qayta tushuntiradi.
// O'quvchilar baribir qulflangan (locked) — proyektorga qaraydi. Xato qilgan
// o'quvchi o'z qurilmasida ham xuddi shu kartalarni o'zi ochib ko'rishi mumkin.
// Kalitlar — scored test ekranlarining indekslari (4, 6, 10, 13, 17).
// Har karta: ic (katta emoji), h (sarlavha), body (1-2 gap), vis (ko'rgazma),
// ask (mentor sinfga og'zaki beradigan savol — jonli muloqot uchun).
// ============================================================
const RECAP_NEED_PCT = 60;   // shundan past — qayta tushuntirish TAVSIYA etiladi
const RECAP_GOOD_PCT = 75;   // shundan yuqori — sinf o'zlashtirdi, bemalol davom
const RECAP_MIN_ANSWERS = 3; // foizga ishonch uchun kamida shuncha javob kerak
const RcFlow = ({ items, sep = '→' }) => (
  <div className="rc-flow">{items.map((t, i) => <React.Fragment key={i}><span className="rc-chip">{t}</span>{sep && i < items.length - 1 && <span className="rc-arr">{sep}</span>}</React.Fragment>)}</div>
);
const RECAPS = {
  // s4 — «Saytlarni ochib beradigan dastur?» (nazariya: s2 Internet + s3 Brauzer)
  4: {
    title: 'Internet va Brauzer', cards: [
      { ic: '🕸️', h: 'Internet — kompyuterlarni bog\'lovchi tarmoq',
        body: <>Butun dunyodagi <b>millionlab kompyuterlar</b> simlar va antennalar orqali bir-biriga ulangan — mana shu internet. Siz ochgan video ham, yuborgan xabar ham ana shu «yo'llar» orqali yuradi.</>,
        vis: <RcFlow items={['📱 Telefon', '💻 Noutbuk', '📺 TV', '🖥️ Server']} sep="·" />,
        ask: "Uyingizda yana qaysi qurilmalar internetga ulangan?" },
      { ic: '📲', h: 'Brauzer — saytlarni ochuvchi dastur',
        body: <>O'yin o'ynash uchun o'yin-dastur kerak, rasm chizish uchun — chizish dasturi. Saytlarni ochish uchun ham maxsus <b>dastur</b> kerak — bu <b>brauzer</b>. Chrome, Safari, Firefox, Edge — nomi har xil, ishi bitta.</>,
        vis: <div className="rc-flow">{[['chrome', 'Chrome'], ['safari', 'Safari'], ['firefox', 'Firefox'], ['edge', 'Edge']].map(([k, l]) => <span key={k} className="rc-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><BrowserLogo k={k} size={26} />{l}</span>)}</div>,
        ask: "O'zingiz qaysi brauzerni ishlatasiz?" },
      { ic: '🎨', h: 'Brauzer 3 ta ish qiladi',
        body: <>Siz faqat manzil yozasiz — qolganini brauzer o'zi qiladi: saytni internetdan <b>topadi</b>, <b>olib keladi</b> va ekranga <b>chizib beradi</b>.</>,
        vis: <RcFlow items={['⌨️ Manzil yozasiz', '📦 Saytni olib keladi', '🎨 Ekranga chizadi']} /> },
    ]
  },
  // s5b — «youtube.com nima deb ataladi?» (nazariya: s5 Domen)
  6: {
    title: 'Domen — sayt manzili', cards: [
      { ic: '🏠', h: 'Domen — saytning manzili',
        body: <>Do'stingiznikiga borish uchun uy manzilini bilishingiz kerak. Saytga kirish uchun ham manzil kerak — brauzerning yuqori qatoriga yoziladigan bu manzil <b>domen</b> deyiladi: <b className="mono">youtube.com</b>, <b className="mono">google.uz</b>.</>,
        vis: <RcFlow items={['🏠 Uy manzili → uyga borasiz', '🌐 Domen → saytga borasiz']} />,
        ask: "Sevimli saytingizning domeni nima?" },
      { ic: '🧩', h: 'Domen ikki qismdan iborat',
        body: <>Nuqtadan oldin — <b>nom</b> (saytning ismi), nuqtadan keyin — <b>zona</b> (turi): <b className="mono">.uz</b> — O'zbekiston, <b className="mono">.com</b> — umumiy, <b className="mono">.org</b> — tashkilotlar.</>,
        vis: <RcFlow items={['youtube — nom', '.com — zona']} sep="+" /> },
      { ic: '☝️', h: 'Adashtirmang!',
        body: <>Domen — <b>dastur emas</b> (dastur — brauzer), <b>kompyuter ham emas</b> (u — server). Domen — faqat <b>manzil</b>, xolos. Bitta harf xato yozilsa — sayt topilmaydi!</>,
        ask: "«youtub.com» yozsak nima bo'ladi? (bir harf kam!)" },
    ]
  },
  // s9 — «Domenni IP'ga kim aylantiradi?» (nazariya: s6 IP + s7 DNS)
  10: {
    title: 'IP manzil va DNS', cards: [
      { ic: '🔢', h: 'Kompyuter faqat raqamni tushunadi',
        body: <>Biz saytni <b>nomi</b> bilan eslaymiz, kompyuter esa <b>raqami</b> bilan topadi. Internetdagi har bir kompyuterning o'z raqamli manzili bor — bu <b>IP manzil</b>.</>,
        vis: <RcFlow items={['🌐 youtube.com', '🔢 142.250.190.78']} /> },
      { ic: '📖', h: 'DNS — internetning telefon kitobi',
        body: <>Telefonda «Aziza» deb qidirasiz — raqamini telefon o'zi topadi-ku? Internetda ham xuddi shunday: siz <b>domen</b> yozasiz, <b>DNS</b> uning <b>IP raqamini</b> bir zumda topib beradi.</>,
        vis: <RcFlow items={['📇 «Aziza»', '📞 +998 90 123-45-67']} />,
        ask: "youtube.com yozsak, DNS bizga aniq nima qaytaradi?" },
      { ic: '⚡', h: 'Uchalasini eslab qoling',
        body: <><b>Domen</b> — nom, odam uchun. <b>IP</b> — raqam, kompyuter uchun. <b>DNS</b> — nomdan raqamni topib beruvchi xizmat.</>,
        vis: <RcFlow items={['🌐 Domen', '📖 DNS', '🔢 IP']} /> },
    ]
  },
  // s12 — «Server nima qaytaradi?» (nazariya: s8 Server + s10/s11 HTML va brauzer)
  13: {
    title: 'Server va HTML', cards: [
      { ic: '🖥️', h: 'Sayt serverda yashaydi',
        body: <>Server — saytlarni saqlaydigan, <b>doim yoniq</b> turadigan kuchli kompyuter. Siz so'rov yuborasiz — u saytni qaytaradi. Kechasi soat 3 da ham sayt ochiladi, chunki server hech qachon uxlamaydi!</>,
        vis: <RcFlow items={["📨 Siz so'rov yubordingiz", '🖥️ Server javob qaytardi']} />,
        ask: "Nega server hech qachon o'chmasligi kerak?" },
      { ic: '📄', h: 'Server chiroyli sahifa EMAS — kod qaytaradi',
        body: <>Serverdan keladigan narsa — <b>HTML kod</b>, oddiy matn. Tayyor rasm ham, chiroyli sahifa ham emas! Keyingi darsda xuddi shunday kodni <b>o'zingiz yozasiz</b>.</>,
        vis: <div className="rc-code mono"><Tg>{'<h1>'}</Tg>▶️ YouTube<Tg>{'</h1>'}</Tg></div> },
      { ic: '🎨', h: 'Chiroyli qiladigan — brauzer',
        body: <>HTML kod — retsept, brauzer — oshpaz: kodni <b>satrma-satr o'qib</b>, undan ekranda chiroyli sahifa «pishiradi».</>,
        vis: <RcFlow items={['📄 HTML kod', "🌐 Brauzer o'qiydi", '🖼️ Chiroyli sahifa']} /> },
    ]
  },
  // s15 — yakuniy «so'rov tartibi» (nazariya: butun yo'l — s1/s10)
  17: {
    title: "So'rovning to'liq yo'li", cards: [
      { ic: '🗺️', h: '4 qadam — doim shu tartibda',
        body: <>Enter bosilgach: <b>brauzer</b> ishni boshlaydi → <b>DNS</b> IP raqamni topadi → <b>server</b> HTML kodni beradi → <b>ekranda</b> sahifa chiziladi.</>,
        vis: <RcFlow items={['🌐 Brauzer', '📖 DNS', '🖥️ Server', '🖼️ Ekran']} /> },
      { ic: '🤔', h: 'Nega aynan shu tartib?',
        body: <>Manzilni bilmasdan borib bo'lmaydi! Avval DNS'dan <b>IP olinadi</b>, keyin o'sha manzildagi serverga boriladi. Pochtachi ham avval konvertdagi manzilni o'qiydi, keyin xatni tashiydi.</>,
        ask: "Brauzer DNS'siz to'g'ri serverni topa oladimi? Nega?" },
      { ic: '⏱️', h: 'Va bularning bari — 1 soniyada',
        body: <>Bu yo'lning hammasi ko'z ochib yumguncha bosib o'tiladi. Har safar sayt ochganingizda — YouTube'mi, o'yinmi, Telegram'mi — aynan shu yo'l takrorlanadi.</>,
        vis: <RcFlow items={['⌨️ Enter', '⏱️ ≈ 1 soniya', '✅ Sayt ochildi']} /> },
    ]
  },
};

// Overlay — QuizArena kabi ekran USTIDA ochiladi, ekran indekslariga tegmaydi.
// Slayd-slayd o'tiladi (mentor og'zaki tushuntirib boradi), oxirgi kartada yopiladi.
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

const sim13Steps = (s) => [
  { active: 'browser', kind: 'req',  pkt: `⌨️ ${s.domain}`,    cap: '1-qadam — Enter bosildi! Brauzer manzilni oldi.' },
  { active: 'dns',     kind: 'req',  pkt: `${s.domain} = ?`,   cap: "2-qadam — Brauzer DNS'dan IP raqamini so'raydi." },
  { active: 'server',  kind: 'ip',   pkt: s.ip,                cap: "3-qadam — DNS IP'ni topdi — so'rov to'g'ri serverga ketdi." },
  { active: 'you',     kind: 'page', pkt: `${s.ic} ${s.name}`, cap: `4-qadam — Server ${s.name} sahifasini qaytardi — ekraningizda ochildi!` }
];
const SIM13_STEP_MS = 1500; // har bir bo'lak (Siz→Brauzer→DNS→Server→Siz) to'liq ko'rinishi uchun (CSS o'tishi 1.25s)

const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi o'zingiz sinab ko'ring. Sayt manzilini yozing yoki tanlang, Yubor tugmasini bosing — so'rov aylanma yo'lni bosib o'tib, sayt ochiladi.`, trigger: 'on_mount', waits_for: null }]);
  const SITES = ['google.com', 'youtube.com', 'wikipedia.org'];
  const DONE = sim13Steps({ domain: '', ic: '', name: '', ip: '' }).length;
  const [url, setUrl] = useState('');
  const [site, setSite] = useState(storedAnswer?.picked ? siteInfo(storedAnswer.picked) : null);
  const [steps, setSteps] = useState(storedAnswer?.picked ? sim13Steps(siteInfo(storedAnswer.picked)) : []);
  const [jstep, setJstep] = useState(storedAnswer?.picked ? DONE : -1); // -1 idle, 0..DONE-1 sayohat, DONE tugadi
  const [turn, setTurn] = useState(storedAnswer?.picked ? 360 : 0);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(storedAnswer?.picked || null);
  const timer = useRef(null);
  const baseRef = useRef(storedAnswer?.picked ? 360 : 0); // to'plangan burchak — doim oldinga (soat strelkasi bo'yicha) aylanadi
  const isMobile = useIsMobile();
  const animRef = useRef(null); // mobilda animatsiyaga avtoskroll uchun
  const resultRef = useRef(null); // mobilda sayt ochilganda natijaga avtoskroll uchun
  const done = loaded !== null;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = (target) => {
    const s = siteInfo(target || url); if (!s || running) return;
    clearTimeout(timer.current);
    const st = sim13Steps(s);
    const base = baseRef.current; // qaytadan yuborilganda ham orqaga emas, oldinga aylanadi
    setSite(s); setSteps(st); setUrl(s.domain); setLoaded(null);
    setRunning(true); setJstep(0); setTurn(base + 90); // Siz → Brauzer (1-bo'lak)
    if (isMobile && animRef.current) { const el = animRef.current; requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' })); } // mobil: sayt bosilganda animatsiyaga skroll
    let i = 0;
    const advance = () => {
      timer.current = setTimeout(() => {
        if (i < st.length - 1) { i++; setJstep(i); setTurn(base + (i + 1) * 90); advance(); }
        else { setJstep(st.length); setTurn(base + 360); baseRef.current = base + 360; setRunning(false); setLoaded(s.domain); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: s.domain }); if (isMobile && resultRef.current) { const el = resultRef.current; requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' })); } }
      }, SIM13_STEP_MS);
    };
    advance();
  };

  const activeKey = jstep >= 0 && jstep < DONE ? steps[jstep]?.active : (jstep >= DONE ? 'you' : null);
  const cur = jstep >= 0 && jstep < DONE ? steps[jstep] : null;
  const caption = jstep < 0
    ? "Manzil yuboring — so'rov bosib o'tadigan butun aylanma yo'lni ko'rasiz."
    : jstep >= DONE
      ? `✓ Tayyor! ${site?.name || 'Sayt'} ekraningizda ochildi — aynan shu yo'l bilan, 1 soniyada.`
      : (steps[jstep]?.cap || '');

  return (
    <Stage eyebrow="Amaliyot · so'rov yuboring" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "So'rov yuboring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'zingiz <span className="italic" style={{ color: T.accent }}>so'rov</span> yuboring.</h2></div>
        <Mentor>Endi navbat sizda! Sayt manzilini yozing yoki tayyorlaridan tanlang va <b style={{ color: T.ink }}>"Yubor"</b> tugmasini bosing — so'rovingiz <b style={{ color: T.ink }}>aylanma yo'lni</b> bosib o'tib, aynan o'sha sayt ochilishini ko'rasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="urlbar fade-up delay-2"><span className="urlbar-lock">🔒</span><input className="urlbar-input" value={url} placeholder="masalan: google.com" onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} /><button className="urlbar-go" onClick={() => send()} disabled={running}>Yubor</button></div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{SITES.map(s => (<button key={s} className="chip" disabled={running} onClick={() => send(s)}>{s}</button>))}</div>
            <div className="jr jr-sim fade-up delay-3" ref={animRef}>
              <div className="jr-ring">
                <div className="jr-ring-circle" />
                <div className="jr-hub"><span className="jr-hub-ic">{site ? site.ic : '⏱️'}</span><span className="jr-hub-t">{site ? site.domain : '≈ 1 soniya'}</span></div>
                {JR_STATIONS.map(s => {
                  const on = activeKey === s.k;
                  const delivered = jstep >= DONE && s.k === 'you';
                  return (
                    <div key={s.k} className={`jr-st ${on ? 'on' : ''} ${delivered ? 'delivered' : ''}`} style={jrPos(s.a)}>
                      {delivered && <span className="jr-badge">{site ? `${site.ic} ${site.name} ✓` : '✓'}</span>}
                      <span className="jr-ic">{s.ic}</span>
                      <span className="jr-l">{s.l}</span>
                    </div>
                  );
                })}
                <div className="jr-orbit" style={{ transform: `rotate(${turn}deg)` }}>
                  <div className={`jr-packet ${cur ? cur.kind : ''} ${cur ? 'show' : ''}`} style={{ transform: `translate(-50%,-50%) rotate(${-turn}deg)` }}>{cur ? cur.pkt : ''}</div>
                </div>
              </div>
              <div className={`jr-cap ${jstep >= DONE ? 'done' : ''}`} key={jstep}>{caption}</div>
              <div className="jr-dots">{steps.length ? steps.map((_, i) => <span key={i} className={`jr-dot ${(jstep > i || jstep >= DONE) ? 'fill' : ''} ${jstep === i ? 'cur' : ''}`} />) : Array.from({ length: DONE }).map((_, i) => <span key={i} className="jr-dot" />)}</div>
            </div>
          </div>
          <div className="col" ref={resultRef}>
            <div className="flow-label">Natija</div>
            <Preview title={loaded || 'sayt'} minH={150}>
              {running ? (<p className="mono" style={{ color: T.ink2, textAlign: 'center', margin: 0 }}><span className="gen-line">Yuklanmoqda</span></p>)
                : loaded ? (<div className="fade-step"><SiteMock site={site} /><p className="mono small" style={{ color: T.success, margin: '10px 0 0', textAlign: 'center' }}>✓ {site?.name || loaded} ochildi</p></div>)
                  : (<p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Manzil yuboring — sayt shu yerda ochiladi</p>)}
            </Preview>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13b — SINOV: SAYTNI TOP VA EKRANGA KELTIR (IP bo'yicha to'g'ri serverni top) =====
// Bola izlovchi: 🗂️ DNS serverning IP-manzilini beradi → keyin 3 ta serverdan o'sha IP'ga
// MOS kelganini o'qib-taqqoslab o'zi topadi → 🖼️ Ekranga keltiradi. Xato server = 404
// (boshqa sayt o'zini fosh qiladi). IP endi MA'NOLI: uni o'qish, solishtirish, tanlash kerak.
const NET_POS = {
  you: [9, 50], dns: [31, 50], srv0: [61, 16], srv1: [61, 50], srv2: [61, 84], screen: [89, 50],
};
const NET_EDGES = [['you', 'dns'], ['dns', 'srv0'], ['dns', 'srv1'], ['dns', 'srv2'], ['srv0', 'screen'], ['srv1', 'screen'], ['srv2', 'screen']];
// Har serverning o'z IP-manzili bor (ba'zilari ataylab o'xshash — diqqat bilan o'qitadi)
const SRV_POOL = [
  { name: 'YouTube',   ip: '142.250.190.78', domain: 'youtube.com',   mock: 'youtube' },
  { name: 'Google',    ip: '142.250.185.78', domain: 'google.com',    mock: 'google' },
  { name: 'Wikipedia', ip: '208.80.154.224', domain: 'wikipedia.org', mock: 'wikipedia' },
  { name: 'Facebook',  ip: '31.13.72.36',    domain: 'facebook.com',  mock: 'generic' },
];
const NET_TARGETS = ['youtube.com', 'google.com', 'wikipedia.org']; // chiroyli mock'li saytlar
const netShuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const netPick = (not) => { const o = NET_TARGETS.filter(s => s !== not); return o[Math.floor(Math.random() * o.length)]; };
// O'xshash IP: oxirgi raqamni o'zgartiramiz — bola raqamni oxirigacha o'qishi kerak bo'ladi
const nearMissIP = (ip) => { const p = ip.split('.'); p[3] = String((parseInt(p[3], 10) + 17) % 200 + 11); return p.join('.'); };
// Bitta raund: to'g'ri sayt + o'xshash IP (boshqa kompyuter) + bitta boshqa real sayt
const buildRound = (domain) => {
  const target = SRV_POOL.find(s => s.domain === domain) || SRV_POOL[0];
  const nearMiss = { name: null, ip: nearMissIP(target.ip), mock: 'generic' };
  const other = netShuffle(SRV_POOL.filter(s => s.domain !== target.domain))[0];
  const servers = netShuffle([target, nearMiss, other]).map((s, i) => ({ ...s, slot: i }));
  return { target, servers };
};

const Screen13b = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13b', text: `Vazifa: youtube.com qayerda joylashganini topib, sahifasini ekranga keltirish. Avval DNS serverning IP-manzilini beradi. Keyin bir nechta serverdan o'sha IP'ga aynan mos kelganini o'zingiz topib boring. Raqamlarni diqqat bilan o'qing!`, trigger: 'on_mount', waits_for: null }]);
  const won = !!storedAnswer;
  const [round, setRound] = useState(() => buildRound('youtube.com'));
  const target = round.target;
  const site = siteInfo(target.domain) || { ...target, ic: '🌐' };
  const [cur, setCur] = useState(won ? 'screen' : 'you');
  const [pktPos, setPktPos] = useState(won ? NET_POS.screen : NET_POS.you);
  const [hasIP, setHasIP] = useState(won);
  const [hasPage, setHasPage] = useState(won);
  const [visited, setVisited] = useState(won ? ['you', 'dns', 'screen'] : ['you']);
  const [traveled, setTraveled] = useState([]);
  const [moving, setMoving] = useState(false);
  const [phase, setPhase] = useState(won ? 'win' : 'play');
  const [msg, setMsg] = useState(null);
  const [moves, setMoves] = useState(0);
  const [shakeNode, setShakeNode] = useState(null);
  const [matchNode, setMatchNode] = useState(null);
  const timer = useRef(null);
  const winRef = useRef(null);
  const firstRef = useRef(true);

  useEffect(() => () => clearTimeout(timer.current), []);
  // To'g'ri topilganda (g'alaba) — desktop va mobilda natijaga avtoskroll
  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    if (phase === 'win' && winRef.current) {
      const el = winRef.current;
      const id = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 220);
      return () => clearTimeout(id);
    }
  }, [phase]);

  // Tugunlar — server slotlari raundga qarab to'ladi (har birida o'z IP'si)
  const nodes = {
    you:    { ic: '🧑', l: 'Siz',   note: 'boshlanish',    kind: 'start',  pos: NET_POS.you },
    dns:    { ic: '🗂️', l: 'DNS',   note: 'manzil beradi', kind: 'dns',    pos: NET_POS.dns },
    screen: { ic: '🖼️', l: 'Ekran', note: 'chizadi',       kind: 'screen', pos: NET_POS.screen },
  };
  round.servers.forEach((s) => { nodes['srv' + s.slot] = { ic: '🖥️', l: 'Server', ip: s.ip, name: s.name, mock: s.mock, kind: 'server', pos: NET_POS['srv' + s.slot] }; });
  const NODE_LIST = ['you', 'dns', 'srv0', 'srv1', 'srv2', 'screen'];

  const ek = (a, b) => [a, b].sort().join('-');
  const adjacent = (a, b) => NET_EDGES.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));

  const resetRound = (domain) => {
    clearTimeout(timer.current);
    if (domain) setRound(buildRound(domain));
    setCur('you'); setPktPos(NET_POS.you); setHasIP(false); setHasPage(false);
    setVisited(['you']); setTraveled([]); setMoving(false); setPhase('play'); setMsg(null); setMoves(0); setShakeNode(null); setMatchNode(null);
  };
  const replay = () => { firstRef.current = false; resetRound(netPick(target.domain)); };
  const restart = () => resetRound();

  // Paketni 'to' tuguniga jonli yuborish (har qadamni bola o'zi tanlaydi)
  const go = (to) => {
    if (moving || phase !== 'play' || !adjacent(cur, to)) return;
    const from = cur;
    setMoving(true); setMsg(null); setMoves(m => m + 1);
    setPktPos(nodes[to].pos);
    timer.current = setTimeout(() => {
      const node = nodes[to];
      const bounce = (t, type = 'bad') => {
        setMsg({ t, type }); setShakeNode(to); setPktPos(nodes[from].pos);
        timer.current = setTimeout(() => setShakeNode(null), 520); setMoving(false);
      };
      if (node.kind === 'dns') { setHasIP(true); setMsg({ t: `🗂️ DNS manzillar kitobidan topdi: ${target.domain} → ${target.ip}`, type: 'good' }); }
      else if (node.kind === 'server') {
        if (!hasIP) return bounce("🔒 Qaysi server kerakligini bilmaysiz — avval IP-manzilni oling.");
        if (node.ip === target.ip) { setHasPage(true); setMatchNode(to); setMsg({ t: '🤝 IP mos keldi! Aynan shu server — sahifa olindi.', type: 'good' }); }
        else if (node.name) return bounce(`❌ ${node.ip} — bu ${node.name}'niki, sizniki emas! (404)`);
        else return bounce(`❌ ${node.ip} — juda o'xshash, lekin boshqa kompyuter! Raqamni oxirigacha solishtiring.`);
      } else if (node.kind === 'screen') {
        if (!hasPage) return bounce("🖼️ Hali sahifa yo'q — uni to'g'ri serverdan olib keling.");
      }
      setTraveled(tr => Array.from(new Set([...tr, ek(from, to)])));
      setVisited(v => Array.from(new Set([...v, to])));
      setCur(to); setMoving(false);
      if (node.kind === 'screen') { setPhase('win'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }
    }, 600);
  };

  const pktCls = hasPage ? 'page' : hasIP ? 'key' : 'req';
  const pktIc = hasPage ? '📄' : hasIP ? '📇' : '📨';

  return (
    <Stage eyebrow="Sinov · saytni top" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={phase !== 'win'} label={phase === 'win' ? 'Davom etish' : 'Saytni ekranga keltiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>{target.domain}</span> ni topib, ekranga keltira olasizmi?</h2></div>
        <Mentor>🔎 Har bir sayt biror <b style={{ color: T.ink }}>serverda</b> yashaydi. Avval <b className="mono" style={{ color: T.accent }}>{target.domain}</b> ning <b style={{ color: T.ink }}>IP-manzilini</b> bilib oling, so'ng o'shanga <b style={{ color: T.ink }}>aynan mos serverni</b> tanlang — raqamlarni diqqat bilan solishtiring!</Mentor>
        <Zoomable>
        <div className="frame frame-col fade-up delay-2">
          {/* Inventar — paket nimani tashiydi */}
          <div className="net-hud">
            <span className={`net-slot ${hasIP ? 'on' : ''}`}><span className="net-slot-ic">📇</span>{hasIP ? <span className="net-hud-ip">{target.ip}</span> : "IP-manzil yo'q"}</span>
            <span className={`net-slot ${hasPage ? 'on' : ''}`}><span className="net-slot-ic">📄</span>{hasPage ? 'Sahifa ✓' : "Sahifa yo'q"}</span>
            <span className="net-moves">Qadam: {moves}</span>
          </div>

          {/* Tarmoq xaritasi */}
          <div className="net-map">
            <svg className="net-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {NET_EDGES.map((e, i) => {
                const k = ek(e[0], e[1]);
                const done = traveled.includes(k);
                const live = !done && (e[0] === cur || e[1] === cur) && phase === 'play';
                const a = nodes[e[0]].pos, b = nodes[e[1]].pos;
                return <line key={i} className={`net-edge ${done ? 'done' : ''} ${live ? 'live' : ''}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} vectorEffect="non-scaling-stroke" />;
              })}
            </svg>
            {NODE_LIST.map((k) => {
              const n = nodes[k];
              const isCur = cur === k;
              const isVisited = visited.includes(k);
              const reachable = phase === 'play' && !moving && adjacent(cur, k);
              return (
                <button key={k} className={`net-node ${n.kind} ${isCur ? 'cur' : ''} ${isVisited ? 'visited' : ''} ${reachable ? 'reachable' : ''} ${matchNode === k ? 'match' : ''} ${shakeNode === k ? 'shake' : ''}`} style={{ left: `${n.pos[0]}%`, top: `${n.pos[1]}%` }} onClick={() => go(k)} disabled={!reachable}>
                  <span className="net-node-ic">{n.ic}</span>
                  <span className="net-node-l">{n.l}</span>
                  {n.kind === 'server' ? <span className="net-ip">{n.ip}</span> : <span className="net-node-note">{n.note}</span>}
                </button>
              );
            })}
            <div className={`net-packet ${pktCls}`} style={{ left: `${pktPos[0]}%`, top: `${pktPos[1]}%` }}>{pktIc}</div>
          </div>

          {/* Xabar / maslahat + boshqaruv */}
          {msg ? <p className={`net-msg ${msg.type}`} key={msg.t}>{msg.t}</p>
            : phase === 'play' && <p className="net-hint">{hasIP ? "📇 Kartangizdagi IP'ga MOS serverni tanlang — raqamlarni oxirigacha solishtiring!" : '🟢 yonayotgan DNS tugunini bosing'}</p>}
          <div className="dlv-run-row">
            <button className="dlv-mini" onClick={restart} disabled={moving || (cur === 'you' && !hasIP && !hasPage)}>↺ Boshidan</button>
            {phase === 'win' && <button className="btn" onClick={replay} style={{ marginLeft: 'auto' }}>↻ Boshqa sayt bilan yana</button>}
          </div>
        </div>
        </Zoomable>

        {phase === 'win' && (
          <div ref={winRef} className="dlv-result fade-step">
            <Confetti />
            <p className="dlv-open-lbl">🎉 Topdingiz! Brauzer <b>{target.name}</b>'ni ekraningizda ochdi</p>
            <div className="dlv-browser">
              <Preview title={target.domain} minH={185}><SiteMock site={site} /></Preview>
            </div>
            <div className="dlv-win">
              <span className="dlv-win-ic">💡</span>
              <p className="dlv-win-b"><b className="dlv-win-h">{moves <= 3 ? "Aniq nishonga!" : 'Topdingiz!'}</b> 🗂️ DNS <b>{target.domain}</b> ning manzilini berdi — <b className="mono">{target.ip}</b>. Har bir kompyuterning <b>o'z IP-manzili</b> bor; aynan shu raqam internetda <b>bitta serverni</b> aniqlaydi. Bitta raqam farq qilsa ham — butunlay boshqa kompyuter! Shuning uchun to'g'ri IP = to'g'ri sayt.</p>
            </div>
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (sayt ochilmadi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Ba'zan sayt ochilmaydi. Eng ko'p sabab — domen xato yozilgan, DNS uni topolmaydi. Mana: youtub.com — bir harf kam, "e" tushib qolgan. Ochishga urinib ko'ring, keyin xatoni tuzating.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [stage, setStage] = useState(storedAnswer ? 'fixed' : 'idle'); // idle -> failed -> fixed
  const done = stage === 'fixed';
  const fail = () => { if (stage !== 'idle') return; setStage('failed'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Mana muammo: DNS "youtub.com" ni topolmadi, chunki bunday domen yo'q. "e" harfi tushib qolgan.`); }, 300); };
  const fix = () => { setStage('fixed'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi youtube.com to'g'ri — DNS IP'ni topdi va sayt ochildi.`); }, 300); };
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : (stage === 'failed' ? "Endi tuzating" : "Ochib ko'ring")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt ochilmadi — <span className="italic" style={{ color: T.accent }}>nega</span>?</h2></div>
        <Mentor>Ba'zan sayt ochilmaydi — qo'rqinchli emas. Eng ko'p sabab: <b style={{ color: T.ink }}>domen xato yozilgan</b>, shuning uchun DNS uni topolmaydi. Mana <span className="mono">youtub.com</span> — bitta harf yetishmayapti. Avval ochib ko'ring, keyin xatoni o'zingiz toping.</Mentor>
        <div className="split">
          <div className="col">
            <div className={`urlbar fade-up delay-2 ${stage === 'failed' ? 'urlbar-err' : ''}`}>
              <span className="urlbar-lock">{stage === 'fixed' ? '🔒' : '⚠️'}</span>
              <span className="urlbar-text mono" style={{ color: stage === 'fixed' ? T.success : (stage === 'failed' ? T.accent : T.ink2) }}>youtub{stage === 'fixed' ? <span className="miss-fill">e</span> : (stage === 'failed' ? <span className="miss-slot">?</span> : '')}.com</span>
            </div>
            {stage === 'idle' && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={fail}>↵ Saytni ochish</button>}
            {stage === 'failed' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Yetishmagan "e" harfini qo'shish</button>}
            {stage === 'fixed' && <p className="mono small fade-step" style={{ color: T.success, margin: 0, fontWeight: 600 }}>✓ youtube.com — endi to'g'ri!</p>}
          </div>
          <div className="col">
            {stage === 'idle' && (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Manzilga diqqat bilan qarang. "Saytni ochish"ni bosib, nima bo'lishini ko'ring.</p></div>)}
            {stage === 'failed' && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>❌ DNS: domen topilmadi</p><p className="body" style={{ margin: 0, color: T.ink }}>DNS <span className="mono">youtub.com</span> ni topolmadi — bunday domen yo'q. Oxirida <b>"e"</b> harfi yetishmayapti (qizil katak ⌶). Chap tugma bilan qo'shing →</p></div>)}
            {stage === 'fixed' && (<><Preview title="youtube.com" minH={130}><SiteMock site={siteInfo('youtube.com')} /></Preview><div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Xatoni topding va tuzatding!</p><p className="ta-sub">Domen to'g'ri bo'lsa — DNS topadi, sayt ochiladi</p></div></>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 15 — YAKUNIY TEST =====
const Screen15 = (props) => (
  <QuestionScreen {...props} scope="final" eyebrow="Yakuniy savol"
    audioText="youtube.com yozib Enter bosganingizda, so'rov to'g'ri qaysi tartibda boradi?"
    questionText="youtube.com yozganda so'rov qaysi tartibda boradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Butun yo'lni eslang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>youtube.com yozib Enter bossangiz, so'rov <span className="italic" style={{ color: T.accent }}>qaysi tartibda</span> boradi?</h2></>}
    options={['Server → DNS → Brauzer → Ekran', 'DNS → Brauzer → Server → Ekran', 'Brauzer → DNS → Server → Ekran', 'Brauzer → Server → DNS → Ekran']} correctIdx={2}
    explainCorrect="Ajoyib, butun yo'lni esladingiz! Brauzer avval DNS'dan IP oladi, keyin serverga so'rov yuboradi, server sahifani qaytaradi, brauzer esa ekranga chizadi."
    explainWrong={{ 0: "Server birinchi emas — avval brauzer so'rovni boshlaydi.", 1: "DNS birinchi emas — avval brauzer DNS'ga murojaat qiladi.", 3: "DNS server'dan oldin keladi — avval IP topiladi, keyin server'ga boriladi.", default: "To'g'ri yo'l: Brauzer → DNS → Server → Ekran." }} />
);

// ===== SCREEN 15b — PODIUM / STATISTIKA (Kahoot uslubi) =====
// Jonli darsda hammaga ko'rinadi: 🥇🥈🥉 podium + to'liq reyting + savollar statistikasi.
// Reyting: to'g'ri javob soni (ko'p — yaxshi), teng bo'lsa jami vaqt (kam — yaxshi).
// Mustaqil (self) rejimda — faqat o'z natijasi ko'rinadi.
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
    const mine = rows.filter(a => a.player_id === p.id);
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

// ============================================================
// ⚔️ MUSTAHKAMLASH — Kahoot uslubidagi jonli jang (12 savol · 20s)
// Mentor quiz_control RPC bilan fazalarni boshqaradi: lobby → q → r → q → … → done.
// O'quvchilar arenada 1.2s polling bilan sinxron yuradi; savol hammada bir vaqtda
// ochiladi, taymer tugaganda (yoki mentor «Natijani ochish» bosganda) javob ochiladi.
// Ball — Kahoot formulasi: to'g'ri = 1000×(1−(vaqt/20s)/2), 0.5s dan tez = 1000;
// ketma-ket 2+ to'g'ri = har biriga +100 (streak 🔥). Solo (self) rejimda lokal o'ynaladi.
// Javoblar live_answers'da screen_idx = 100 + savol_raqami bilan saqlanadi.
// ============================================================
const QUIZ_MS = 20000;
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C']; // Kahoot ranglari
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
// Arena foni: suzuvchi neon shakllar (blur YO'Q — tiniq, loyqa emas). Pozitsiyalar statik.
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
// Server-baholash javob kaliti (dars ichidagi testlar). quiz-N jang savollari QUIZ_BANK'dan avto-qo'shiladi.
const INLINE_KEYS = { s4: 1, s5b: 2, s9: 3, s12: 1, s15: 2 };
const QUIZ_BANK = [
  { q: "youtube.com yozib Enter bosdingiz. Brauzer ENG BIRINCHI kimga murojaat qiladi?", opts: ['Serverga', "DNS'ga", 'Ekranga', "Wi-Fi routerga"], correct: 1 },
  { q: "DNS'ning asl vazifasi qaysi qatorda?", opts: ['Saytni ekranga chizish', 'Sahifalarni saqlash', "Domenni IP raqamga aylantirish", 'Internet tezligini oshirish'], correct: 2 },
  { q: "142.250.190.78 va 142.250.190.87 — bular…", opts: ['Bitta kompyuter', 'Ikki XIL kompyuter', "Bitta saytning ikki nomi", "Xato yozilgan bitta IP"], correct: 1 },
  { q: "Server brauzerga aniq nima yuboradi?", opts: ['HTML kodni', 'Tayyor suratni', 'IP manzilni', 'Yangi brauzerni'], correct: 0 },
  { q: "«Inter-net» so'zining asl ma'nosi nima?", opts: ['Tezkor aloqa', 'Simsiz aloqa', 'Tarmoqlararo', 'Butunjahon kompyuteri'], correct: 2 },
  { q: "youtub.com (bir harf kam!) yozsangiz nima bo'ladi?", opts: ['YouTube baribir ochiladi', 'Kompyuter sekinlashadi', 'Internet uziladi', "DNS topolmaydi — xato chiqadi"], correct: 3 },
  { q: "Sayt «yashaydigan», DOIM yoniq turadigan kompyuter?", opts: ['Router', 'Server', 'Brauzer', 'Planshet'], correct: 1 },
  { q: "Qaysi biri DOMEN?", opts: ['142.250.190.78', 'Chrome', 'wikipedia.org', 'HTML'], correct: 2 },
  { q: "HTML kodni o'qib, chiroyli sahifaga aylantiradigan kim?", opts: ['Server', 'DNS', 'Domen', 'Brauzer'], correct: 3 },
  { q: "So'rovning TO'G'RI tartibi qaysi?", opts: ['Brauzer → DNS → Server → Ekran', 'DNS → Brauzer → Ekran → Server', 'Server → Brauzer → DNS → Ekran', 'Brauzer → Server → DNS → Ekran'], correct: 0 },
  { q: "google.uz'dagi «.uz» nimani bildiradi?", opts: ['Saytning nomi', "O'zbekiston zonasi", 'Parol', "Serverning IP'si"], correct: 1 },
  { q: "DNS «telefon kitobi» bo'lsa, undagi ism va raqam nima?", opts: ['Ism=IP · Raqam=domen', 'Ism=brauzer · Raqam=server', 'Ism=domen · Raqam=IP', 'Ism=sayt · Raqam=parol'], correct: 2 },
];
const quizPts = (elapsedMs) => elapsedMs <= 500 ? 1000 : Math.max(0, Math.round(1000 * (1 - (Math.min(elapsedMs, QUIZ_MS) / QUIZ_MS) / 2)));
// Bitta o'yinchining barcha jang javoblaridan yakuniy hisob (hamma klientda bir xil chiqadi)
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
  const [classEnded, setClassEnded] = useState(false); // jonli dars tugadi/mentor yo'q — qutqaruv tugmasi uchun
  const seenQRef = useRef(-1);
  const qStartRef = useRef(0);
  const deadlineRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // O'quvchi sahifani yangilagan bo'lsa — o'z javoblarini serverdan tiklaymiz (mashqda kerak emas)
  useEffect(() => {
    if (!isStudent || solo || !live.playerId) return;
    liveQuizAnswers(live.pin).then(rows => {
      const mine = {};
      rows.filter(r => r.player_id === live.playerId).forEach(r => { mine[r.screen_idx - QUIZ_BASE_IDX] = { picked: r.picked, correct: r.correct, elapsed: r.elapsed_ms }; });
      setMyAnswers(m => ({ ...mine, ...m }));
    }).catch(() => {});
  }, []); // eslint-disable-line

  // Jonli sinxron: 1.2s polling — savol/natija/yakun fazalari serverdan keladi.
  // Solo/mashq rejimiga o'tilsa polling o'z-o'zidan to'xtaydi.
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
            deadlineRef.current = Date.now() + QUIZ_MS - (isMentor ? 0 : 700); // o'quvchi polling kechikish kompensatsiyasi
            setQi(q); setRemaining(deadlineRef.current - Date.now()); setPhase('q'); setAnsweredN(0);
          } else if (st === 'r') {
            if (q !== seenQRef.current) { seenQRef.current = q; setQi(q); } // kech kirgan o'quvchi ham natijani ko'radi
            setPhase(p => p === 'done' ? p : 'reveal');
          }
          else if (st === 'done') { setPhase('done'); }
        }
        // Fetch-fazani SERVER holatidan hisoblaymiz: phaseRef bir tick orqada qoladi,
        // shuning uchun reveal'ga o'tgan ZAHOTI (shu tickning o'zida) natijalar yuklanadi —
        // hisoblagichlar «0» bo'lib turmaydi.
        const st1 = row ? (row.quiz_state || 'off') : null;
        const ph = st1 === 'r' ? 'reveal' : st1 === 'done' ? 'done' : st1 === 'lobby' ? 'lobby' : st1 === 'q' ? 'q' : phaseRef.current;
        if (on) setClassEnded(!row || row.status === 'ended'); // mentor «Erkin qilish» bosgan — arenada qutqaruv ko'rinadi
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
        // Natijalarni DARHOL yuklaymiz — polling kutilmaydi, hisoblagichlar bo'sh turmaydi
        Promise.all([livePlayers(live.pin), liveQuizAnswers(live.pin)]).then(([pl, qa]) => { setPlayers(pl); setQRows(qa); }).catch(() => {});
      }
    } catch {}
  };
  // Solo boshqaruvi
  const soloStart = (i) => { seenQRef.current = i; qStartRef.current = Date.now(); deadlineRef.current = Date.now() + QUIZ_MS; setQi(i); setRemaining(QUIZ_MS); setPhase('q'); };
  const soloNext = () => { const n = qi + 1; if (n >= QUIZ_BANK.length) setPhase('done'); else soloStart(n); };
  const soloReplay = () => { setMyAnswers({}); soloStart(0); };
  // Jonli test tugagach «qayta ishlash» — mashq rejimiga o'tish (jadvalga yozilmaydi)
  const startPractice = () => { setSoloMode(true); setMyAnswers({}); soloStart(0); };

  const answer = (i) => {
    if (phase !== 'q' || isMentor || myAnswers[qi]) return;
    const elapsed = Math.min(QUIZ_MS, Date.now() - qStartRef.current);
    const correct = i === QUIZ_BANK[qi].correct;
    setMyAnswers(m => ({ ...m, [qi]: { picked: i, correct, elapsed } }));
    if (isStudent && !solo) live.submitAnswer(QUIZ_BASE_IDX + qi, `quiz-${qi}`, i, correct, elapsed); // mashqda serverga YOZILMAYDI
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
  // Hisoblagichlar: server qatorlari + O'Z javobim hali serverdan kelmagan bo'lsa, lokal qo'shiladi —
  // reveal ochilganda o'quvchining o'z plitkasi hech qachon «0» ko'rinmaydi
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
  // Server holatiga TEGILMAYDI — «⚔️ Davom ettirish» bilan aynan shu joydan qaytadi.
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

      {/* QUTQARUV: jonli dars tugadi/mentor chiqib ketdi — o'quvchi osilib qolmaydi,
          o'z tezligida mashq rejimiga o'tib testni tugatadi (natija serverga yozilmaydi) */}
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

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Internet qanday ishlashini bilib olding! Endi bilasiz: sayt boshqa kompyuterda — serverda yashaydi, domen uning manzili, DNS manzilni IP'ga aylantiradi, brauzer esa hammasini bog'lab, sahifani ekranga chizadi. Va server qaytargan narsa — HTML. Endi o'sha HTML'ni o'rganamiz.", trigger: 'on_mount', waits_for: null }]);
  // ⚔️ Mustahkamlash testi: jonli darsda mentor ochadi → o'quvchilar kiradi.
  // Dars tugagan / mentor uzilgan / test umuman ochilmagan bo'lsa — o'quvchi UYDA
  // xuddi shu taymer bilan SOLO (mashq) ishlaydi, natijani o'zi ko'radi.
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const [arena, setArena] = useState(false);
  const [arenaSolo, setArenaSolo] = useState(false);
  const quizSt = (live && live.quiz && live.quiz.state) || 'off';
  const isStudentL = live && live.mode === 'student';
  const isMentorL = live && live.mode === 'mentor';
  const classOver = !!(live && (live.status === 'ended' || !live.mentorAlive)); // jonli sinf tugagan/uzilgan
  // O'quvchi uch holatda: (1) sinf tugagan va test yakunlanmagan — SOLO mashq;
  // (2) jonli test bor (yoki yakunlangan — natijalarni ko'radi) — jonli arena;
  // (3) sinf davom etyapti, test hali ochilmagan — kutadi.
  const studentSolo = isStudentL && classOver && quizSt !== 'done';
  const studentLive = isStudentL && !studentSolo && quizSt !== 'off';
  const studentWait = isStudentL && !studentSolo && quizSt === 'off';
  const openArena = async () => {
    if (isMentorL && quizSt === 'off') { try { await live.quizControl('lobby', -1); } catch { return; } }
    setArenaSolo(studentSolo); // uydagi o'quvchi — mashq rejimida
    setArena(true);
  };
  const RECAP = ['Internet — qurilmalarni bog’lovchi tarmoq', 'Brauzer — saytni ochib beruvchi dastur', 'Domen — saytning manzili (youtube.com)', 'IP — kompyuterlar uchun raqamli manzil', 'DNS — domenni IP’ga aylantiradi', 'Server — saytni saqlaydi va qaytaradi'];
  const HOMEWORK = [{ b: 'Kuzating', t: '— sevimli saytingiz domeni nima?' }, { b: 'Tasavvur qiling', t: '— sayt brauzeringizga qanday yo’l bosib kelishini' }, { b: 'Tushuntiring', t: '— do’stingizga internet qanday ishlashini' }];
  const GLOSSARY = [{ b: 'Internet', t: '— tarmoqlar tarmog’i' }, { b: 'Brauzer', t: '— saytni ochuvchi dastur' }, { b: 'Domen', t: '— sayt manzili' }, { b: 'IP', t: '— raqamli manzil' }, { b: 'DNS', t: '— domen → IP' }, { b: 'Server', t: '— saytni saqlovchi kompyuter' }, { b: 'So’rov', t: '— brauzer → DNS → server → ekran' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={() => setShowDone(true)} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>🎉 Darsni yakunlash</button></>}>
      <div className="screen">
        {PASSED && <Confetti />}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Kirish darsi tugadi</span><h2 className="title h-title fade-up d1">Internet <span className="italic" style={{ color: T.accent }}>qanday ishlashini</span> bilib olding.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Endi sayt sizgacha qanday yetib kelishini bilasiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko’ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        {/* ⚔️ Mustahkamlash testi — CTA */}
        <div className={`qz-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <div className="qz-cta-txt">
            <span className="qz-cta-h">⚔️ Mustahkamlash testi</span>
            <span className="qz-cta-s">{studentSolo
              ? `${QUIZ_BANK.length} savol · har biriga ${QUIZ_MS / 1000} soniya · mashq rejimi — natija faqat sizga ko'rinadi`
              : `${QUIZ_BANK.length} savol · har biriga ${QUIZ_MS / 1000} soniya · tezkorlar podiumga chiqadi 🏆`}</span>
          </div>
          <button className="qz-cta-btn" disabled={studentWait} onClick={openArena}>
            {studentWait ? '⏳ Mentorni kuting'
              : studentSolo ? "📖 Testni o'zim ishlash"
              : studentLive ? (quizSt === 'done' ? "🏆 Natijalarni ko'rish" : '🔥 Testga kirish!')
              : isMentorL ? (quizSt === 'off' ? '⚔️ Testni ochish' : '⚔️ Davom ettirish')
              : '⚔️ Testni ishlash'}
          </button>
        </div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🔎 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Internetni hayotda kuzating:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul></div>
        </div>
        <div className="gloss fade-up d4"><div className="gloss-head" onClick={() => setOpen(o => !o)}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
      {showDone && (
        <div className="fin-backdrop" onClick={() => setShowDone(false)}>
          <Confetti />
          <div className="fin-card" onClick={e => e.stopPropagation()}>
            <button className="fin-x" onClick={() => setShowDone(false)} aria-label="Yopish">✕</button>
            <div className="fin-emoji">🎉</div>
            <h3 className="fin-h">Tabriklaymiz!</h3>
            <p className="fin-sub">Internet darsini muvaffaqiyatli tugatding. Endi sayt sizgacha qanday yetib kelishini bilasiz.</p>
            <button className="btn-white-accent" onClick={onFinish} style={{ padding: '12px 32px', fontSize: 15 }}>Tamom</button>
          </div>
        </div>
      )}
      {arena && <QuizArena live={live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
    </Stage>
  );
};

// ===== JONLI DARS — hook va UI `src/live/` modulida (import yuqorida) =====

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function HtmlLesson({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());
  // ETALON — 1920px: shu kenglikda tasdiqlangan ko'rinish (1100px konteyner, 1x shrift).
  // Kengroq oynada (2K monitor, ultrawide, brauzer zoom <100%) butun dars proportsional
  // kattalashadi — ko'rinish har qanday keng ekranda ham etalondagidek qoladi.
  // 1920 va undan tor ekranlarda z=1 (hech narsa o'zgarmaydi, mobil ham tegilmaydi).
  useEffect(() => {
    const upd = () => {
      const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920));
      document.documentElement.style.setProperty('--lz', String(Math.round(z * 1000) / 1000));
    };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, data) => setAnswers(a => ({ ...a, [idx]: data }));
  const reset = () => { setAnswers({}); setScreen(0); startTimeRef.current = Date.now(); };

  // Jonli dars: o'quvchi mentordan oldinga o'tolmaydi (high-water mark)
  // Javob kaliti: inline testlar + jang savollari (QUIZ_BANK'dan) — mentor darsni ochganda serverga yuklanadi
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const locked = isStudentLive && (screen + 1 > live.mentorScreen);
  // Mentor: har sahifa almashganda o'z holatini e'lon qiladi
  useEffect(() => { live.reportScreen(screen); }, [screen, live.mode, live.pin]); // eslint-disable-line

  const finishLesson = () => {
    live.endSession(); // mentor "Tamom" bossa — barcha o'quvchilarga erkinlik
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
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen13b, Screen14, Screen15, ScreenPodium, Screen16];
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
        .bp-body ul { list-style-type: disc; list-style-position: outside; padding-left: 24px; }
        .bp-body ol { list-style-type: decimal; list-style-position: outside; padding-left: 24px; }
        .bp-body li { display: list-item; }

        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .display { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.0; letter-spacing: -0.01em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        /* Kattalashtirish (zoom) — animatsiyani katta ekranda ko'rish */
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: calc(90vh / var(--lz, 1)); overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === KNOPKALAR v15 (soyalar) === */
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === OPSIYALAR v15 === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }
        /* Kahoot-reveal: javob qotdi, natija hali sir — neytral ko'k belgi (to'g'ri/xato sezdirmaydi) */
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; }
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

        .text-input, .prompt-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); font-weight: 500; padding: 11px 13px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: box-shadow 0.2s; }
        .text-input:focus, .prompt-input:focus { box-shadow: 0 10px 22px -6px rgba(255,79,40,0.3), 0 0 0 1px rgba(255,79,40,0.2); }
        .prompt-input { font-family: 'Manrope'; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.55; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        /* HTML satrma-satr o'qish (Screen11) */
        .htl-line { display: flex; align-items: flex-start; gap: 8px; padding: 3px 8px; margin: 0 -4px; border-radius: 6px; transition: background 0.3s ease, opacity 0.3s ease; }
        .htl-code { flex: 1; min-width: 0; white-space: pre-wrap; word-break: break-word; }
        .htl-line.dim { opacity: 0.35; }
        .htl-line.reading { background: rgba(255,79,40,0.20); box-shadow: inset 3px 0 0 ${CODE.tag}; animation: htl-blink 0.6s ease-in-out infinite; }
        .htl-line.read { background: rgba(125,209,129,0.12); }
        .htl-tick { flex-shrink: 0; white-space: nowrap; color: ${CODE.str}; font-size: 0.82em; opacity: 0.85; }
        @keyframes htl-blink { 0%,100% { background: rgba(255,79,40,0.12); } 50% { background: rgba(255,79,40,0.26); } }
        .htl-pop { animation: htl-pop 0.5s cubic-bezier(.34,1.4,.4,1); }
        @keyframes htl-pop { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: none; } }
        /* Debugging (16-page): yetishmagan harf katagi va to'ldirilishi */
        .miss-slot { display: inline-flex; align-items: center; justify-content: center; min-width: 13px; height: 17px; border-radius: 4px; background: rgba(255,79,40,0.18); color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; font-weight: 700; margin: 0 1px; vertical-align: middle; animation: htl-blink 0.7s ease-in-out infinite; }
        .miss-fill { display: inline-block; color: ${T.success}; font-weight: 800; animation: htl-pop 0.5s cubic-bezier(.34,1.4,.4,1); }
        .code-box .tg, .t-tag { color: ${CODE.tag}; }
        .ck.active .t-tag { color: #fff; }
        .t-cm, .cm { color: ${CODE.comment}; font-style: italic; }
        .t-title { color: ${CODE.comment}; font-style: italic; opacity: 0.85; }
        .at { color: ${CODE.attr}; } .st { color: ${CODE.str}; } .tx { color: ${CODE.text}; }

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
        .lead { margin: 0; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        /* === STAGE v15 (sticky header, 936px) === */
        .stage { max-width: 1100px; margin: 0 auto; height: calc(100dvh / var(--lz, 1)); display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55), 0 0 3px rgba(255,79,40,0.4); }

        /* === FRAME v15 === */
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-ok { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: 12px 15px; }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        /* === PROBLEM REVEAL === */
        .pr { display: flex; flex-direction: column; gap: 12px; }
        .mu-block { display: flex; flex-direction: column; gap: 14px; transition: opacity 0.35s, transform 0.35s; }
        .mu-block.leave { opacity: 0; transform: translateY(-8px); }
        .ps-line { display: flex; gap: 10px; align-items: flex-start; }
        .ps-badge { flex-shrink: 0; font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 9px; border-radius: 6px; margin-top: 2px; }
        .ps-q { background: ${T.accentSoft}; color: ${T.accent}; }
        .ps-a { background: ${T.successSoft}; color: ${T.success}; }
        .ps-text { font-size: clamp(14px,1.7vw,16px); line-height: 1.5; color: ${T.ink}; }
        .solve-btn { align-self: flex-start; font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.6vw,15px); padding: 10px 18px; border-radius: 10px; border: none; background: ${T.ink}; color: ${T.bg}; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(${T.shadowBase},0.3); }
        .solve-btn:hover:not(:disabled) { background: ${T.accent}; }
        .ye-solved, .ye-stack { display: flex; flex-direction: column; gap: 12px; }
        .mu-mini { opacity: 0.7; }
        .idea { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 0; }
        .happy { font-size: 30px; animation: pop 0.5s ease-out; } .idea-bulb { font-size: 22px; animation: pop 0.5s ease-out 0.1s both; }
        @keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .pr-answer { animation: fade-step 0.4s ease-out; }

        .demo-swap { animation: fade-step 0.3s ease-out; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }
        .dest { display: flex; align-items: center; gap: 14px; background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 14px 18px; }
        .dest-emoji { font-size: 28px; } .dest-title { font-weight: 700; color: ${T.ink}; margin: 0; font-size: clamp(15px,1.8vw,17px); } .dest-sub { color: ${T.ink2}; margin: 2px 0 0; font-size: clamp(13px,1.5vw,14px); }

        /* === RECIPE === */
        .recipe-list { display: flex; flex-direction: column; list-style: none; }
        .recipe-list li { display: flex; align-items: center; gap: 13px; padding: 11px 2px; border-bottom: 1px solid rgba(167,166,162,0.22); transition: all 0.3s; }
        .recipe-list li:last-child { border-bottom: none; }
        .recipe-num { width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 2px ${T.ink3}; background: transparent; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; flex-shrink: 0; transition: all 0.3s; }
        .recipe-list li.on .recipe-num { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.success}; }
        .recipe-text { font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }

        /* === FLOW ARROW === */
        .flow-arrow { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 0; }
        .flow-track { width: 2px; height: 10px; background: ${T.ink3}; position: relative; overflow: hidden; border-radius: 2px; }
        .flow-bead { position: absolute; top: -8px; left: -1px; width: 4px; height: 8px; background: ${T.accent}; border-radius: 2px; animation: bead 1.4s linear infinite; }
        @keyframes bead { from { top: -8px; } to { top: 18px; } }
        .flow-chevron { color: ${T.accent}; font-size: 11px; animation: chev 1.4s ease-in-out infinite; }
        @keyframes chev { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .brauzer-step { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 9px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .brauzer-icon { font-size: 20px; } .brauzer-h { font-weight: 700; color: ${T.ink}; margin: 0; font-size: 14px; } .brauzer-sub { color: ${T.ink2}; margin: 1px 0 0; font-size: 12px; font-family: 'JetBrains Mono'; }

        /* === PROFILE CARD === */
        .profile-card { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; padding: 2px 0; animation: fade-step 0.3s; }
        .pf-ava { width: 44px; height: 44px; border-radius: 50%; background: ${T.accent}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 20px; }
        .pf-name { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,19px); color: ${T.ink}; margin: 0; }
        .pf-bio { color: ${T.ink2}; margin: 0; font-size: 12.5px; }
        .pf-btn { margin-top: 3px; background: ${T.accent}; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; cursor: default; }

        /* === BSKEL (skeleton anatomy) === */
        .bskel { display: flex; flex-direction: column; gap: 0; }
        .bskel-doctype, .bskel-html, .bskel-tab, .bskel-page { cursor: pointer; transition: all 0.2s; position: relative; }
        .bskel-doctype { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; padding: 6px 10px; border-radius: 8px 8px 0 0; background: ${T.bg}; }
        .bskel-html { border: 2px solid ${T.ink3}; border-radius: 0 8px 12px 12px; padding: 18px 10px 10px; background: ${T.paper}; }
        .bskel-htmllabel { position: absolute; top: -1px; left: 10px; transform: translateY(-50%); font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink2}; background: ${T.paper}; padding: 0 6px; }
        .bskel-win { border-radius: 10px; overflow: hidden; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18); }
        .bskel-tab { background: #f0eee8; padding: 8px 10px; display: flex; align-items: center; gap: 8px; }
        .bskel-dots { display: flex; gap: 4px; } .bskel-dots i { width: 8px; height: 8px; border-radius: 50%; background: ${T.ink3}; }
        .bskel-tabpill { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: #fff; padding: 3px 9px; border-radius: 5px; }
        .bskel-zone { margin-left: auto; font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; }
        .bskel-page { background: #fff; padding: 16px; min-height: 80px; }
        .bskel-ptitle { font-family: 'Georgia, serif'; font-size: 18px; color: ${T.ink}; margin: 0 0 4px; } .bskel-ptext { font-family: 'Georgia, serif'; color: ${T.ink2}; margin: 0; font-size: 13px; }
        .bskel-zone-b { position: absolute; bottom: 6px; right: 10px; }
        .bskel-doctype.active, .bskel-html.active, .bskel-tab.active, .bskel-page.active { box-shadow: inset 0 0 0 2px ${T.accent}; background: ${T.accentSoft}; }
        .bskel-tab.active, .bskel-page.active { background: ${T.accentSoft}; }
        .ck { cursor: pointer; border-radius: 4px; transition: all 0.15s; padding: 0 2px; }
        .ck:hover { background: rgba(255,255,255,0.08); }
        .ck.active { background: ${T.accent}; }
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 4px 9px; border-radius: 6px; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }

        /* === HUG (teg o'raydi) === */
        .hug-wrap { display: flex; justify-content: center; padding: 10px 0; }
        .hug { display: flex; align-items: stretch; gap: 0; transition: gap 0.4s; }
        .hug.on { gap: 4px; }
        .hug-item { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 14px; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .hug-tag { background: ${CODE.bg}; } .hug-content { background: ${T.accentSoft}; }
        .hug-item.active { box-shadow: 0 0 0 2px ${T.accent}; }
        .hug-code { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(15px,2vw,18px); }
        .hug-tag .hug-code { color: ${CODE.tag}; } .hug-content .hug-code { color: ${T.accent}; }
        .hug-slash { color: ${CODE.attr}; }
        .hug-lbl { font-family: 'JetBrains Mono'; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: ${T.ink3}; }
        .role-line { background: ${T.paper}; border-radius: 10px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .pv-h1 { font-family: 'Georgia, serif'; font-size: clamp(22px,3vw,30px); color: ${T.ink}; margin: 0; animation: fade-step 0.4s; }

        /* === LADDER (sarlavhalar) === */
        .ladder { display: flex; flex-direction: column; gap: 6px; }
        .hl-row { display: flex; align-items: center; gap: 13px; padding: 9px 14px; border-radius: 10px; cursor: pointer; transition: all 0.18s; background: ${T.paper}; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.12); }
        .hl-row:hover { box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.2); }
        .hl-row.on { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.25); background: ${T.accentSoft}; }
        .hl-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 8px; border-radius: 5px; flex-shrink: 0; }
        .hl-text { font-family: 'Georgia, serif'; font-weight: 700; color: ${T.ink}; line-height: 1; }
        .hl-tag { margin-left: auto; font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; background: ${T.accentSoft}; padding: 3px 9px; border-radius: 99px; }
        .hl-note { background: ${T.paper}; border-radius: 10px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .hl-note .nb { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .hl-hint { padding: 10px 2px; }

        /* === MCARD (matn) === */
        .mcard { background: ${T.paper}; border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .mc-head { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .mc-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 9px; border-radius: 5px; }
        .mc-label { font-weight: 600; font-size: 13px; color: ${T.ink2}; }
        .mc-demo { font-family: 'Georgia, serif'; font-size: clamp(18px,2.5vw,24px); color: ${T.ink}; padding: 8px 0; }
        .w-anim { display: inline-block; transition: all 0.3s; } .w-bold { font-weight: 800; } .w-ital { font-style: italic; }
        .mc-btn { align-self: flex-start; font-family: 'Manrope'; font-weight: 600; font-size: 13px; padding: 8px 15px; border-radius: 9px; border: none; background: ${T.bg}; color: ${T.ink}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 7px; }
        .mc-btn:hover { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .mc-btn.on { background: ${T.accent}; color: #fff; }
        .mc-btn .ic { font-family: 'Georgia, serif'; }
        .mc-code { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; background: ${T.bg}; padding: 8px 11px; border-radius: 8px; margin: 0; } .mc-code .tg { color: ${CODE.tag}; }

        /* === WHEN / LISTS === */
        .when { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 10px; padding: 11px 15px; }
        .site-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid ${T.ink3}40; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .site-brand { display: inline-flex; align-items: center; gap: 8px; } .site-logo { width: 22px; height: 22px; border-radius: 6px; background: ${T.accent}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 13px; } .site-name { font-family: 'Manrope'; font-weight: 700; color: ${T.ink}; font-size: 14px; }
        .site-nav { display: inline-flex; gap: 11px; font-family: 'Manrope'; font-size: 12px; color: ${T.ink2}; }
        .site-sec { } .site-h3 { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0 0 8px; }
        .site-list { font-family: 'Georgia, serif'; color: ${T.ink}; font-size: clamp(14px,1.8vw,16px); }
        .site-list ul, .site-list ol { padding-left: 24px; } .site-list li { display: list-item; margin: 3px 0; }

        /* === WEB (graf) === */
        .web { position: relative; height: 150px; background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .web-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .web-node { position: absolute; transform: translate(-50%,-50%); font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.ink}; background: ${T.bg}; padding: 5px 10px; border-radius: 99px; cursor: pointer; transition: all 0.2s; white-space: nowrap; box-shadow: 0 3px 8px -3px rgba(${T.shadowBase},0.25); }
        .web-node:hover { transform: translate(-50%,-50%) scale(1.06); }
        .web-node.on { background: ${T.accent}; color: #fff; }
        .web-cap { font-size: clamp(12px,1.5vw,13px); color: ${T.ink2}; margin: 0; line-height: 1.5; }

        .bp-url { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; display: flex; align-items: center; gap: 6px; animation: fade-step 0.3s; } .lock { color: ${T.success}; font-size: 8px; }
        .pg-in { animation: pg-in 0.35s ease-out; } @keyframes pg-in { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        .site-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; flex-wrap: wrap; gap: 4px; }
        .site-wordmark { font-family: 'Georgia, serif'; font-weight: 700; color: ${T.ink}; font-size: 14px; } .site-tag { font-size: 10px; color: ${T.ink3}; font-family: 'JetBrains Mono'; }
        .pg-h1 { font-family: 'Georgia, serif'; font-size: clamp(20px,2.8vw,26px); color: ${T.ink}; margin: 0 0 7px; } .pg-body { font-family: 'Georgia, serif'; color: ${T.ink2}; font-size: clamp(13px,1.7vw,15px); line-height: 1.55; margin: 0 0 12px; }
        .pg-divider { height: 1px; background: ${T.ink3}30; margin: 0 0 12px; }
        .pg-linklabel { font-family: 'Manrope'; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${T.ink3}; margin: 0 0 8px; }
        .pg-links { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
        .pg-a { font-family: 'Georgia, serif'; color: ${T.link}; text-decoration: underline; cursor: pointer; font-size: clamp(13px,1.7vw,15px); display: inline-flex; align-items: center; gap: 5px; transition: gap 0.2s; } .pg-a:hover { gap: 9px; } .arr { font-size: 12px; }
        .pg-foot { font-size: 10px; color: ${T.ink3}; margin: 0; font-family: 'Manrope'; }

        .codecard { background: ${T.paper}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s ease-out forwards; }
        .codecard-top { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; margin: 0 0 8px; display: flex; align-items: center; gap: 7px; } .dotf { width: 8px; height: 8px; border-radius: 50%; background: ${T.accent}; }
        .codeblock { background: ${CODE.bg}; border-radius: 8px; padding: 11px 13px; margin: 0; font-family: 'JetBrains Mono'; font-size: 12px; line-height: 1.6; display: flex; flex-direction: column; } .codeblock .ln { white-space: pre-wrap; word-break: break-word; } .codeblock .tg { color: ${CODE.tag}; }
        .codecap { font-size: 12px; color: ${T.ink2}; margin: 8px 0 0; } .mn { font-family: 'JetBrains Mono'; color: ${T.accent}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 4px 7px; border-radius: 6px; transition: all 0.15s; } .ai-line:hover { background: rgba(255,255,255,0.06); } .ai-line .tg { color: ${CODE.tag}; }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === BUILDER === */
        .prompt-row { display: flex; gap: 8px; }
        .prompt-btn { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14px; padding: 0 18px; border-radius: 12px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); } .prompt-btn:hover:not(:disabled) { box-shadow: 0 10px 22px -5px rgba(255,79,40,0.55); } .prompt-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 7px 12px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; } .gt { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.accent}; }
        .gen-line { color: ${CODE.attr}; } .gen-line::after { content: '…'; animation: blink 1s steps(3) infinite; } @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        .el-in { animation: fade-step 0.35s ease-out; }

        /* === YOZISH (Screen7) === */
        .yz-card { background: ${T.paper}; border-radius: 14px; padding: 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 10px; }
        .yz-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-family: 'JetBrains Mono'; font-size: clamp(15px,2vw,18px); }
        .yz-code { color: ${T.ink}; } .yz-code .t-tag { color: ${CODE.tag}; } .yz-done { animation: fade-step 0.3s; }
        .yz-input { font-family: 'JetBrains Mono'; font-size: clamp(15px,2vw,18px); padding: 5px 10px; border: none; border-radius: 8px; background: ${T.bg}; color: ${T.ink}; outline: none; width: 150px; box-shadow: inset 0 0 0 1.5px ${T.accent}40; } .yz-input:focus { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .yz-hint { font-size: 12.5px; color: ${T.ink2}; margin: 0; } .yz-ok { font-size: 13px; color: ${T.success}; font-weight: 600; margin: 0; animation: fade-step 0.3s; } .yz-placeholder { color: ${T.ink3}; font-style: italic; margin: 0; font-family: 'Georgia, serif'; }

        /* === YAKUN (Screen16) === */
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
        /* ============ v16 QO'SHIMCHA CSS ============ */
        /* SCREEN 2 — Hayotdan misol (2-bosqich) */
        .frame-col { display: flex; flex-direction: column; gap: 14px; }
        .savo { gap: 12px; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }
        .pz-head { display: flex; align-items: flex-start; gap: 12px; }
        .pz-emoji { font-size: 26px; line-height: 1; flex-shrink: 0; }
        .pz-title { font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 3px; }
        .pz-sub { font-size: clamp(13px,1.6vw,15px); color: ${T.ink2}; line-height: 1.45; margin: 0; }
        .pz-flow { display: flex; align-items: flex-start; gap: 4px; overflow-x: auto; padding: 4px 2px 2px; }
        .pz-step { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 88px; flex: 0 0 auto; padding: 10px 6px; border-radius: 12px; transition: background 0.3s; }
        .pz-step.on { background: ${T.successSoft}; }
        .pz-step.active { background: ${T.accentSoft}; }
        .pz-ic { width: 34px; height: 34px; border-radius: 50%; box-shadow: inset 0 0 0 2px ${T.ink3}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 14px; color: ${T.ink2}; background: transparent; transition: all 0.3s; }
        .pz-step.on .pz-ic { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.success}; color: #fff; }
        .pz-step.active .pz-ic { box-shadow: inset 0 0 0 2px ${T.accent}; color: ${T.accent}; }
        .pz-lbl { font-size: 11.5px; text-align: center; color: ${T.ink2}; line-height: 1.25; font-weight: 500; }
        .pz-step.on .pz-lbl { color: ${T.ink}; }
        .pz-arrow { align-self: center; margin-top: 16px; color: ${T.ink3}; font-size: 15px; flex: 0 0 auto; transition: color 0.3s; }
        .pz-arrow.on { color: ${T.success}; }
        /* SCREEN 10 — gorizontal bir qatorli yo'l (skrollsiz, mobilda wrap) */
        .hz-flow { display: flex; align-items: flex-start; justify-content: center; gap: 2px; flex-wrap: wrap; }
        .hz-step { display: flex; flex-direction: column; align-items: center; gap: 7px; flex: 1 1 78px; min-width: 72px; max-width: 128px; padding: 10px 4px; border-radius: 12px; transition: background 0.3s; }
        .hz-step.done { background: ${T.successSoft}; }
        .hz-step.active { background: ${T.accentSoft}; }
        .hz-node { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 14px; box-shadow: inset 0 0 0 2px rgba(${T.shadowBase},0.30); color: ${T.ink2}; background: ${T.paper}; transition: all 0.4s cubic-bezier(.34,1.35,.4,1); }
        .hz-step.done .hz-node { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.success}; color: #fff; }
        .hz-step.active .hz-node { box-shadow: inset 0 0 0 2px ${T.accent}, 0 0 0 5px ${T.accentSoft}; color: ${T.accent}; background: ${T.accentSoft}; transform: scale(1.12); animation: vz-pulse 1.1s ease-in-out infinite; }
        .hz-ic { font-size: 20px; line-height: 1; filter: grayscale(0.45) opacity(0.65); transition: all 0.4s; }
        .hz-step.done .hz-ic, .hz-step.active .hz-ic { filter: none; }
        .hz-step.active .hz-ic { transform: scale(1.12); }
        .hz-lbl { font-size: 11px; text-align: center; color: ${T.ink2}; line-height: 1.25; font-weight: 500; transition: color 0.3s; }
        .hz-step.done .hz-lbl, .hz-step.active .hz-lbl { color: ${T.ink}; font-weight: 600; }
        .hz-arrow { align-self: center; margin-top: 19px; color: ${T.ink3}; font-size: 14px; flex: 0 0 auto; transition: color 0.3s; }
        .hz-arrow.on { color: ${T.success}; }
        .hz-arrow.flow { color: ${T.accent}; animation: hz-aflow 0.7s ease-in-out infinite; }
        @keyframes hz-aflow { 0%,100% { transform: translateX(-2px); opacity: 0.45; } 50% { transform: translateX(3px); opacity: 1; } }
        .hz-prog { height: 6px; border-radius: 99px; background: rgba(${T.shadowBase},0.12); overflow: hidden; margin-top: 8px; }
        .hz-prog-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, ${T.accent}, ${T.success}); box-shadow: 0 0 8px rgba(255,79,40,0.45); transition: width 0.65s cubic-bezier(.45,0,.3,1); }
        .hz-cap { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.7vw,15px); color: ${T.ink}; text-align: center; min-height: 22px; margin-top: 8px; animation: fade-step 0.4s ease-out; }
        .hz-cap.done { color: ${T.success}; }
        @keyframes vz-pulse { 0%,100% { box-shadow: inset 0 0 0 2px ${T.accent}, 0 0 0 5px ${T.accentSoft}; } 50% { box-shadow: inset 0 0 0 2px ${T.accent}, 0 0 0 9px rgba(255,79,40,0.10); } }
        /* SCREEN 6 — Teg (qo'shtirnoq modeli) */
        .pv-plain { font-family: 'Georgia, serif'; font-size: 14px; color: ${T.ink3}; margin: 0; }
        .tegbuild-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 22px 0 14px; }
        .tegbuild { display: flex; align-items: center; justify-content: center; gap: 5px; min-height: 78px; }
        .tegbuild.on { gap: 4px; }
        .tb-chip { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 13px 16px; border-radius: 11px; transition: transform 0.55s cubic-bezier(.34,1.25,.4,1), opacity 0.4s; cursor: default; }
        .tegbuild.on .tb-chip { cursor: pointer; }
        .tb-tag { background: ${CODE.bg}; } .tb-content { background: ${T.accentSoft}; }
        .tb-code { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(16px,2.4vw,20px); }
        .tb-tag .tb-code { color: ${CODE.tag}; } .tb-content .tb-code { color: ${T.accent}; }
        .tb-slash { color: ${CODE.attr}; display: inline-block; }
        .tegbuild.on .tb-slash { animation: slashpulse 1.3s ease-in-out 0.55s 2; }
        @keyframes slashpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.45); } }
        .tb-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: ${T.ink3}; transition: opacity 0.3s 0.35s; }
        .tb-open.hide { transform: translateX(-64px) scale(0.82); opacity: 0; }
        .tb-close.hide { transform: translateX(64px) scale(0.82); opacity: 0; }
        .tegbuild:not(.on) .tb-tag .tb-lbl { opacity: 0; }
        .tb-chip.active { box-shadow: 0 0 0 2px ${T.accent}; }
        .tb-bracket { display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.3s 0.5s; }
        .tegbuild-wrap.on .tb-bracket { opacity: 1; }
        .tb-brace { width: 150px; max-width: 70%; height: 9px; border: 1.5px solid ${T.ink3}; border-top: none; border-radius: 0 0 9px 9px; }
        .tb-brace-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink2}; }
        .slash-callout { display: flex; align-items: center; gap: 13px; background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .slash-big { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 30px; color: ${T.accent}; line-height: 1; flex-shrink: 0; }
        /* SCREEN 8 — Sarlavhalar (gazeta -> teglar qo'nadi) */
        .news-card { display: flex; flex-direction: column; }
        .news-line { display: flex; align-items: center; gap: 12px; padding: 9px 10px; margin: 0 -10px; border-radius: 10px; transition: background 0.4s ease; }
        .news-card.tagged .news-line { background: ${T.bg}; }
        .news-card.tagged .news-headline { background: ${T.accentSoft}; }
        .news-line > h3, .news-line > p { flex: 1; min-width: 0; }
        .tag-badge { flex-shrink: 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 4px 9px; border-radius: 6px; opacity: 0; transform: translateX(10px) scale(0.9); transition: opacity 0.4s ease, transform 0.45s cubic-bezier(.34,1.25,.4,1); }
        .news-card.tagged .tag-badge { opacity: 1; transform: none; }
        .tag-badge.accent { color: #fff; background: ${T.accent}; box-shadow: 0 4px 12px -4px rgba(255,79,40,0.5); }
        .tag-badge.soft { color: ${T.ink2}; background: ${T.bg}; box-shadow: inset 0 0 0 1px ${T.ink3}55; }
        .news-hint { font-family: 'Manrope'; font-size: 12.5px; color: ${T.ink2}; margin: 12px 0 0; }
        /* Avtoscroll */
        .stage-content { scroll-behavior: smooth; }
        /* MOBIL: yig'iladigan Mentor (skrollni kamaytirish) */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* ============ INTERNET DARS CSS ============ */
        .urlbar { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 12px; padding: 8px 8px 8px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); }
        .urlbar-lock { font-size: 13px; flex-shrink: 0; }
        .urlbar-text { font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); color: ${T.ink}; flex: 1; min-width: 0; }
        .urlbar-input { flex: 1; min-width: 0; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); border: none; background: transparent; color: ${T.ink}; outline: none; }
        .urlbar-go { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 9px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; }
        .urlbar-go:hover:not(:disabled) { box-shadow: 0 6px 14px -4px rgba(255,79,40,0.5); }
        .urlbar-go:disabled { opacity: 0.5; cursor: not-allowed; }
        .urlbar-err { box-shadow: 0 0 0 2px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.3); }
        .dompill { display: inline-flex; align-self: center; border-radius: 10px; overflow: hidden; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18); font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(15px,2.2vw,19px); }
        .dpart { padding: 10px 14px; }
        .dpart-name { background: ${T.accentSoft}; color: ${T.accent}; }
        .dpart-tld { background: #E2F1F7; color: ${T.blue}; }
        .dlabels { display: flex; justify-content: center; gap: 18px; font-size: 12px; color: ${T.ink2}; font-family: 'Manrope'; }
        .domsplit { display: inline-flex; align-self: center; align-items: center; gap: 7px; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(15px,2.2vw,19px); }
        .domsplit .dpart { border-radius: 10px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18); }
        .dsp-l { animation: dsp-left 0.55s cubic-bezier(.34,1.45,.4,1) both; }
        .dsp-r { animation: dsp-right 0.55s cubic-bezier(.34,1.45,.4,1) 0.06s both; }
        @keyframes dsp-left { 0% { transform: translateX(22px); } 100% { transform: translateX(0); } }
        @keyframes dsp-right { 0% { transform: translateX(-22px); } 100% { transform: translateX(0); } }
        .ipbox { align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(16px,2.4vw,20px); color: ${T.blue}; background: #E2F1F7; padding: 10px 16px; border-radius: 10px; }
        .ipbox-sm { font-size: clamp(13px,1.7vw,15px); padding: 5px 10px; }
        .ip-type { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: middle; width: 14ch; animation: ip-typing 0.9s steps(14,end); }
        @keyframes ip-typing { from { width: 0; } to { width: 14ch; } }
        .ip-conv { color: ${T.ink3}; transition: color 0.3s; }
        .ip-conv.go { color: ${T.accent}; animation: ip-convpulse 0.85s ease 2; }
        @keyframes ip-convpulse { 0%,100% { transform: translateY(0); opacity: 0.75; } 50% { transform: translateY(2px); opacity: 1; } }
        .anabox { display: flex; align-items: center; justify-content: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); text-align: center; }
        .ana-name { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; }
        .ana-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; font-size: 12px; flex-shrink: 0; }
        .ana-num { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; }
        .dns-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 10px; }
        .dns-head { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .dns-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .dns-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .dns-status { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; margin-left: 6px; }
        .dns-status.ok { color: ${T.success}; }
        .dns-book { display: flex; flex-direction: column; gap: 5px; }
        .dns-entry { display: flex; align-items: center; gap: 8px; padding: 9px 11px; border-radius: 9px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px transparent; transition: opacity 0.4s ease, box-shadow 0.4s ease, background 0.4s ease; }
        .dns-dom { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; color: ${T.ink}; flex-shrink: 0; }
        .dns-dots { flex: 1; height: 0; border-bottom: 1.5px dotted rgba(${T.shadowBase},0.28); margin: 6px 2px 0; }
        .dns-ip { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: ${T.ink3}; letter-spacing: 0.5px; flex-shrink: 0; transition: color 0.3s; }
        .dns-entry.scan { background: ${T.accentSoft}; animation: dns-scan 0.55s ease-in-out infinite; }
        .dns-entry.hit { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px rgba(31,122,77,0.45); }
        .dns-entry.hit .dns-ip { color: ${T.success}; font-weight: 700; animation: pop 0.4s cubic-bezier(.34,1.4,.4,1); }
        .dns-entry.dim { opacity: 0.4; }
        @keyframes dns-scan { 0%,100% { box-shadow: inset 0 0 0 1.5px rgba(255,79,40,0.25); } 50% { box-shadow: inset 0 0 0 1.5px ${T.accent}; } }
        /* DNS aylantirgich — o'ng tomondagi jonli domen → DNS → IP */
        .dnsconv { display: flex; flex-direction: column; align-items: center; gap: 5px; background: ${T.paper}; border-radius: 14px; padding: 16px 14px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .dc-node { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 11px; border-radius: 11px; background: ${T.bg}; transition: background 0.4s ease, box-shadow 0.4s ease; }
        .dc-ic { font-size: 22px; line-height: 1; }
        .dc-k { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 9.5px; color: ${T.ink3}; text-transform: uppercase; letter-spacing: 0.07em; }
        .dc-v { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 14px; color: ${T.ink}; }
        .dc-node.dc-ip.hit { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px rgba(31,122,77,0.4); }
        .dc-node.dc-ip.hit .dc-v { color: ${T.success}; animation: pop 0.45s cubic-bezier(.34,1.4,.4,1); }
        .dc-mid { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .dc-dns { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; padding: 4px 13px; border-radius: 99px; background: ${T.accentSoft}; transition: color 0.3s, background 0.3s; }
        .dc-arrow { color: ${T.ink3}; font-size: 14px; line-height: 1; transition: color 0.3s; }
        .dc-mid.busy .dc-dns { animation: dc-pulse 0.7s ease-in-out infinite; }
        .dc-mid.busy .dc-arrow { animation: dc-flow 0.85s ease-in-out infinite; }
        .dc-mid.busy .dc-arrow:last-child { animation-delay: 0.42s; }
        .dc-mid.ok .dc-dns { color: ${T.success}; background: ${T.successSoft}; }
        .dc-mid.ok .dc-arrow { color: ${T.success}; }
        @keyframes dc-pulse { 0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,79,40,0); } 50% { transform: scale(1.07); box-shadow: 0 0 0 6px rgba(255,79,40,0.10); } }
        @keyframes dc-flow { 0% { opacity: 0.25; transform: translateY(-3px); } 50% { opacity: 1; transform: translateY(3px); } 100% { opacity: 0.25; transform: translateY(-3px); } }
        .cs { display: flex; align-items: center; gap: clamp(10px,2vw,18px); background: ${T.paper}; border-radius: 14px; padding: 16px 14px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); overflow: hidden; }
        .cs-node { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; padding: 8px; border-radius: 10px; transition: all 0.3s; min-width: 64px; }
        .cs-node.cs-active { background: ${T.accentSoft}; }
        .cs-ic { font-size: 26px; }
        .cs-l { font-family: 'Manrope'; font-size: 11px; font-weight: 600; color: ${T.ink2}; text-align: center; line-height: 1.2; }
        .cs-wire { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 96px; justify-content: center; }
        .cs-track { position: relative; height: 36px; }
        .cs-track::before { content: ''; position: absolute; left: 2px; right: 2px; top: 50%; height: 2px; transform: translateY(-50%); background: repeating-linear-gradient(90deg, rgba(${T.shadowBase},0.22) 0 6px, transparent 6px 12px); border-radius: 2px; }
        .cs-chip { position: absolute; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; gap: 3px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 9.5px; padding: 3px 7px; border-radius: 99px; white-space: nowrap; box-shadow: 0 4px 11px -4px rgba(${T.shadowBase},0.3); transition: left 1.05s cubic-bezier(.5,0,.3,1), opacity 0.3s ease; }
        .cs-chip-req { left: 0; background: ${T.accentSoft}; color: ${T.accent}; }
        .cs-chip-req.sent { left: calc(100% - 56px); }
        .cs-chip-req.gone { opacity: 0; }
        .cs-chip-res { left: calc(100% - 56px); background: ${T.successSoft}; color: ${T.success}; opacity: 0; }
        .cs-chip-res.sent { left: 0; opacity: 1; }
        .cs-node.cs-proc { background: ${T.accentSoft}; animation: cs-procring 0.7s ease-in-out infinite; }
        .cs-node.cs-proc .cs-ic { animation: cs-procscale 0.7s ease-in-out infinite; }
        @keyframes cs-procring { 0%,100% { box-shadow: 0 0 0 0 rgba(255,79,40,0); } 50% { box-shadow: 0 0 0 7px rgba(255,79,40,0.10); } }
        @keyframes cs-procscale { 0%,100% { transform: scale(1); } 50% { transform: scale(1.13); } }
        .jmini { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; background: ${T.paper}; border-radius: 12px; padding: 14px 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .jmini-node { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .jmini-ic { font-size: 22px; }
        .jmini-l { font-family: 'Manrope'; font-size: 10px; font-weight: 600; color: ${T.ink2}; }
        .jmini-arr { color: ${T.accent}; font-weight: 700; }

        /* === REJA — AYLANA JONLI SAYOHAT (Screen1) === */
        .jr { display: flex; flex-direction: column; align-items: center; gap: clamp(12px,2vw,16px); background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,28px); box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .jr-ring { position: relative; width: min(300px, 100%); aspect-ratio: 1 / 1; margin: 2px auto; }
        /* Sim (15-page): desktopda skrol bo'lmasligi uchun animatsiya ~10% kichikroq */
        .jr-sim { gap: clamp(8px,1.6vw,12px); padding: clamp(12px,2.4vw,20px); }
        .jr-sim .jr-ring { width: min(270px, 100%); }
        .jr-ring-circle { position: absolute; left: 50%; top: 50%; width: 76%; height: 76%; transform: translate(-50%,-50%); border-radius: 50%; border: 2px dashed rgba(${T.shadowBase},0.25); }
        .jr-hub { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .jr-hub-ic { font-size: 20px; }
        .jr-hub-t { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink2}; }
        .jr-st { position: absolute; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 6px; width: 78px; }
        .jr-ic { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 25px; background: ${T.bg}; box-shadow: inset 0 0 0 2px rgba(${T.shadowBase},0.18); transition: all 0.35s cubic-bezier(.34,1.35,.4,1); }
        .jr-st.on .jr-ic { box-shadow: inset 0 0 0 2px ${T.accent}, 0 0 0 6px ${T.accentSoft}; background: ${T.accentSoft}; transform: scale(1.12); animation: vz-pulse 1.1s ease-in-out infinite; }
        .jr-st.delivered .jr-ic { box-shadow: inset 0 0 0 2px ${T.success}, 0 0 0 6px ${T.successSoft}; background: ${T.successSoft}; transform: scale(1.08); }
        .jr-l { font-family: 'Manrope'; font-size: 12px; font-weight: 600; color: ${T.ink2}; transition: color 0.3s; }
        .jr-st.on .jr-l, .jr-st.delivered .jr-l { color: ${T.ink}; }
        .jr-badge { position: absolute; top: -15px; white-space: nowrap; font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: ${T.success}; background: ${T.successSoft}; padding: 3px 9px; border-radius: 99px; box-shadow: 0 4px 12px -4px rgba(31,122,77,0.4); animation: pop 0.45s cubic-bezier(.34,1.4,.4,1); z-index: 5; }
        .jr-orbit { position: absolute; inset: 0; transform-origin: 50% 50%; transition: transform 1.25s cubic-bezier(.45,0,.3,1); z-index: 4; pointer-events: none; }
        .jr-packet { position: absolute; left: 50%; top: 12%; white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(10.5px,1.5vw,13px); padding: 6px 11px; border-radius: 99px; opacity: 0; box-shadow: 0 7px 18px -4px rgba(${T.shadowBase},0.4); transition: transform 1.25s cubic-bezier(.45,0,.3,1), opacity 0.4s ease; }
        .jr-packet.show { opacity: 1; }
        .jr-packet.req { background: ${T.accent}; color: #fff; }
        .jr-packet.ip { background: ${T.blue}; color: #fff; }
        .jr-packet.page { background: ${T.success}; color: #fff; }
        .jr-cap { font-family: 'Manrope'; font-weight: 600; font-size: clamp(14px,1.9vw,16.5px); color: ${T.ink}; text-align: center; min-height: 44px; display: flex; align-items: center; justify-content: center; padding: 0 6px; animation: fade-step 0.4s ease-out; }
        .jr-cap.done { color: ${T.success}; }
        .jr-dots { display: flex; justify-content: center; gap: 7px; }
        .jr-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(${T.shadowBase},0.18); transition: all 0.3s; }
        .jr-dot.fill { background: ${T.success}; }
        .jr-dot.cur { background: ${T.accent}; transform: scale(1.4); }
        /* Zoom (⛶) bosilganda animatsiya kattalashadi */
        .zoom-on .jr-ring { width: min(560px, 76vmin); }
        /* Sim (15-page) zoom: animatsiya + natija + saytlar ro'yxati birga sig'ishi uchun halqa kichikroq */
        .zoom-on .jr-sim .jr-ring { width: min(340px, 40vmin); }
        .zoom-on .jr-sim .jr-ic { width: 48px; height: 48px; font-size: 24px; }
        .zoom-on .jr-sim .jr-l { font-size: 12px; }
        .zoom-on .jr-sim .jr-cap { font-size: 15.5px; min-height: 44px; }
        .zoom-on .jr-sim .jr-packet { font-size: 13px; padding: 7px 12px; }
        .zoom-on .jr-ic { width: 64px; height: 64px; font-size: 32px; }
        .zoom-on .jr-l { font-size: 14px; }
        .zoom-on .jr-hub-ic { font-size: 26px; }
        .zoom-on .jr-hub-t { font-size: 13px; }
        .zoom-on .jr-packet { font-size: 15px; padding: 9px 16px; }
        .zoom-on .jr-cap { font-size: 19px; min-height: 52px; }
        @media (max-width: 560px) {
          .jr-ic { width: 42px; height: 42px; font-size: 21px; }
          .jr-st { width: 64px; }
          .jr-packet { font-size: 10px; padding: 5px 9px; }
        }
        @media (prefers-reduced-motion: reduce) { .jr-orbit, .jr-packet { transition: opacity 0.3s ease; } }

        /* === KONFETTI (yakun bayrami) === */
        .confetti { position: fixed; inset: 0; pointer-events: none; z-index: 1200; overflow: hidden; }
        .confetti-bit { position: absolute; top: -24px; opacity: 0; will-change: transform, opacity; animation-name: confetti-fall; animation-timing-function: cubic-bezier(.25,.6,.45,1); animation-iteration-count: 1; animation-fill-mode: forwards; box-shadow: 0 2px 6px -2px rgba(${T.shadowBase},0.3); }
        @keyframes confetti-fall {
          0% { transform: translateY(-24px) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          55% { transform: translateY(48vh) translateX(22px) rotate(320deg); }
          100% { transform: translateY(104vh) translateX(-12px) rotate(680deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .confetti { display: none; } }
        /* Yakun popup (18-page) */
        .fin-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.62); z-index: 1001; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fade-step 0.25s ease; }
        .fin-card { position: relative; background: ${T.paper}; border-radius: 20px; padding: clamp(28px,5vw,46px); max-width: 440px; width: 100%; text-align: center; box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: fin-pop 0.4s cubic-bezier(.34,1.3,.4,1); }
        @keyframes fin-pop { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: none; } }
        .fin-x { position: absolute; top: 12px; right: 14px; background: transparent; border: none; font-size: 16px; color: ${T.ink3}; cursor: pointer; line-height: 1; }
        .fin-emoji { font-size: clamp(46px,9vw,66px); line-height: 1; margin-bottom: 10px; animation: pop 0.5s cubic-bezier(.34,1.4,.4,1); }
        .fin-h { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: clamp(22px,3.4vw,28px); color: ${T.ink}; margin: 0 0 8px; }
        .fin-sub { font-family: 'Manrope', sans-serif; font-size: clamp(14px,1.8vw,15px); color: ${T.ink2}; margin: 0 0 22px; line-height: 1.5; }

        /* === O'YIN: SO'ROVNI O'ZING YETKAZ (Screen13b) === */
        .dlv-mission { display: flex; align-items: center; gap: 12px; background: ${T.bg}; border-radius: 12px; padding: 11px 14px; }
        .dlv-mission-ic { font-size: 26px; line-height: 1; flex-shrink: 0; }
        .dlv-mission-h { font-family: 'Manrope'; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: ${T.accent}; margin: 0 0 2px; }
        .dlv-mission-t { font-size: clamp(13px,1.7vw,15px); color: ${T.ink}; margin: 0; }
        .dlv-attempts { margin-left: auto; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; flex-shrink: 0; }

        .dlv-scene { position: relative; background: linear-gradient(180deg, #FBFAF7, ${T.paper}); border-radius: 14px; padding: clamp(18px,3vw,28px) clamp(8px,2vw,16px) clamp(20px,3vw,30px); box-shadow: inset 0 0 0 1px rgba(${T.shadowBase},0.06); overflow: hidden; }
        .dlv-track { display: flex; align-items: flex-start; justify-content: center; gap: 0; position: relative; min-height: 98px; }
        .dlv-node { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 0 0 auto; width: clamp(72px,18vw,98px); padding: 6px 2px; }
        .dlv-node-ic { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 23px; background: ${T.bg}; box-shadow: inset 0 0 0 2px rgba(${T.shadowBase},0.16); transition: all 0.35s cubic-bezier(.34,1.35,.4,1); }
        .dlv-node.start .dlv-node-ic { box-shadow: inset 0 0 0 2px ${T.ink3}; }
        .dlv-node.on .dlv-node-ic { box-shadow: inset 0 0 0 2px ${T.accent}, 0 0 0 6px ${T.accentSoft}; background: ${T.accentSoft}; transform: scale(1.12); animation: vz-pulse 1.1s ease-in-out infinite; }
        .dlv-node.reached .dlv-node-ic { box-shadow: inset 0 0 0 2px ${T.success}, 0 0 0 5px ${T.successSoft}; background: ${T.successSoft}; }
        .dlv-node-l { font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: ${T.ink2}; }
        .dlv-node.on .dlv-node-l, .dlv-node.reached .dlv-node-l { color: ${T.ink}; }
        .dlv-node-note { font-family: 'Manrope'; font-size: 9.5px; color: ${T.ink3}; text-align: center; line-height: 1.2; min-height: 22px; }
        .dlv-node.reached .dlv-node-note { color: ${T.success}; font-weight: 600; }
        .dlv-link { flex: 1 1 8px; max-width: 40px; height: 2px; margin-top: 28px; border-radius: 2px; background: repeating-linear-gradient(90deg, rgba(${T.shadowBase},0.25) 0 5px, transparent 5px 10px); }
        .dlv-packet { position: absolute; top: -8px; transform: translateX(-50%); white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(10px,1.4vw,12.5px); padding: 5px 10px; border-radius: 99px; color: #fff; box-shadow: 0 7px 18px -4px rgba(${T.shadowBase},0.4); transition: left 0.6s cubic-bezier(.45,0,.3,1), background 0.3s ease; z-index: 5; }
        .dlv-packet.req { background: ${T.accent}; }
        .dlv-packet.ip { background: ${T.blue}; }
        .dlv-packet.page { background: ${T.success}; }
        .dlv-packet.done { background: ${T.success}; }
        .dlv-packet.fail { animation: dlv-shake 0.5s ease; }
        @keyframes dlv-shake { 0%,100% { transform: translateX(-50%) rotate(0); } 20% { transform: translateX(-58%) rotate(-6deg); } 40% { transform: translateX(-42%) rotate(6deg); } 60% { transform: translateX(-54%) rotate(-4deg); } 80% { transform: translateX(-46%) rotate(4deg); } }
        .dlv-empty { text-align: center; font-family: 'Georgia, serif'; font-style: italic; color: ${T.ink3}; font-size: 13px; margin: 10px 0 0; }

        .dlv-palette { display: flex; gap: 8px; flex-wrap: wrap; }
        .dlv-key { flex: 1 1 110px; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 8px; border-radius: 12px; border: none; background: ${T.paper}; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.18); }
        .dlv-key:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px -6px rgba(${T.shadowBase},0.26); }
        .dlv-key:disabled { opacity: 0.4; cursor: not-allowed; }
        .dlv-key-ic { font-size: 22px; line-height: 1; }
        .dlv-key-l { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .dlv-key-note { font-family: 'Manrope'; font-size: 10px; color: ${T.ink3}; }
        .dlv-key-dns:hover:not(:disabled) { box-shadow: 0 10px 20px -6px rgba(1,154,203,0.35); }
        .dlv-key-server:hover:not(:disabled) { box-shadow: 0 10px 20px -6px rgba(255,79,40,0.32); }
        .dlv-key-screen:hover:not(:disabled) { box-shadow: 0 10px 20px -6px rgba(31,122,77,0.32); }

        .dlv-route { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; background: ${CODE.bg}; border-radius: 10px; padding: 11px 13px; }
        .dlv-route-lbl { font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; }
        .dlv-route-empty { font-family: 'JetBrains Mono'; font-size: 12px; color: ${CODE.comment}; font-style: italic; }
        .dlv-chip { display: inline-flex; align-items: center; gap: 5px; font-family: 'Manrope'; font-weight: 700; font-size: 12px; padding: 5px 10px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.15s; }
        .dlv-chip:hover:not(:disabled) { box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.3); }
        .dlv-chip:disabled { cursor: default; }
        .dlv-chip-start { background: rgba(255,255,255,0.14); color: #fff; cursor: default; }
        .dlv-x { font-size: 9px; color: ${T.accent}; }
        .dlv-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${CODE.attr}; font-size: 13px; }

        .dlv-run-row { display: flex; align-items: center; gap: 10px; }
        .dlv-mini { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 14px; border-radius: 9px; border: none; background: ${T.bg}; color: ${T.ink2}; cursor: pointer; transition: all 0.2s; }
        .dlv-mini:hover:not(:disabled) { color: ${T.ink}; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.2); }
        .dlv-mini:disabled { opacity: 0.45; cursor: not-allowed; }
        .dlv-msg { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.6vw,15px); text-align: center; margin: 0; padding: 10px 14px; border-radius: 10px; animation: fade-step 0.3s ease-out; }
        .dlv-msg.bad { background: ${T.accentSoft}; color: ${T.accent}; }
        .dlv-msg.idle { background: ${T.bg}; color: ${T.ink2}; }

        .dlv-result { display: flex; flex-direction: column; align-items: center; gap: clamp(10px,2vw,14px); }
        .dlv-open-lbl { font-family: 'Manrope'; font-weight: 700; font-size: clamp(12px,1.6vw,14px); color: ${T.success}; text-align: center; margin: 0; animation: fade-step 0.45s ease-out; }
        .dlv-open-lbl b { color: ${T.ink}; }
        .dlv-browser { width: 100%; max-width: 470px; animation: dlv-open 0.55s cubic-bezier(.34,1.3,.4,1); }
        @keyframes dlv-open { 0% { opacity: 0; transform: translateY(16px) scale(0.93); } 100% { opacity: 1; transform: none; } }
        .dlv-win { display: flex; align-items: center; gap: 12px; width: 100%; max-width: 600px; background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: 13px 16px; }
        .dlv-win-ic { font-size: 24px; line-height: 1; flex-shrink: 0; }
        .dlv-win-h { color: ${T.success}; }
        .dlv-win-b { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; line-height: 1.5; margin: 0; }
        @media (max-width: 560px) {
          .dlv-node { width: clamp(62px,22vw,84px); }
          .dlv-node-ic { width: 40px; height: 40px; font-size: 20px; }
          .dlv-packet { font-size: 9.5px; padding: 4px 8px; }
        }

        /* === O'YIN: TARMOQ XARITASI (Screen13b) === */
        .net-hud { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .net-slot { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 700; font-size: 11px; padding: 5px 11px; border-radius: 99px; background: ${T.bg}; color: ${T.ink3}; box-shadow: inset 0 0 0 1.5px rgba(${T.shadowBase},0.12); transition: all 0.3s; }
        .net-slot.on { color: ${T.success}; background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px rgba(31,122,77,0.5); }
        .net-slot.bad { color: ${T.accent}; background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px rgba(255,79,40,0.5); }
        .net-slot-ic { font-size: 14px; }
        .net-moves { margin-left: auto; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .net-map { position: relative; width: 100%; aspect-ratio: 16 / 9; max-height: 330px; background: radial-gradient(circle at 50% 45%, #FFFDF9, ${T.paper}); border-radius: 16px; box-shadow: inset 0 0 0 1px rgba(${T.shadowBase},0.06); overflow: hidden; }
        .net-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .net-edge { stroke: rgba(${T.shadowBase},0.18); stroke-width: 2.5; fill: none; transition: stroke 0.3s; }
        .net-edge.live { stroke: ${T.accent}; stroke-width: 3; stroke-dasharray: 6 5; animation: net-dash 0.7s linear infinite; }
        .net-edge.done { stroke: ${T.success}; stroke-width: 3.5; }
        .net-edge.blocked { stroke: rgba(255,79,40,0.40); stroke-dasharray: 3 4; }
        @keyframes net-dash { to { stroke-dashoffset: -22; } }
        .net-node { position: absolute; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 3px; width: clamp(56px,15vw,78px); background: transparent; border: none; padding: 0; cursor: default; }
        .net-node-ic { position: relative; width: clamp(38px,9vw,50px); height: clamp(38px,9vw,50px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: clamp(18px,4.5vw,24px); background: ${T.paper}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.25), inset 0 0 0 2px rgba(${T.shadowBase},0.12); transition: transform 0.3s cubic-bezier(.34,1.35,.4,1), box-shadow 0.3s, background 0.3s; }
        .net-node.cur .net-node-ic { box-shadow: 0 6px 16px -4px rgba(255,79,40,0.4), inset 0 0 0 2px ${T.accent}; }
        .net-node.visited .net-node-ic { box-shadow: 0 4px 12px -4px rgba(31,122,77,0.3), inset 0 0 0 2px ${T.success}; background: ${T.successSoft}; }
        .net-node.trap .net-node-ic { background: #FFF4F1; }
        .net-node.reachable { cursor: pointer; }
        .net-node.reachable .net-node-ic { box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.3), inset 0 0 0 2px ${T.accent}; animation: net-pulse 1.2s ease-in-out infinite; }
        .net-node.reachable:hover .net-node-ic { transform: scale(1.1); }
        @keyframes net-pulse { 0%,100% { box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.3), inset 0 0 0 2px ${T.accent}, 0 0 0 0 rgba(255,79,40,0.3); } 50% { box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.3), inset 0 0 0 2px ${T.accent}, 0 0 0 9px rgba(255,79,40,0); } }
        .net-node.shake .net-node-ic { animation: net-shake 0.45s ease; }
        @keyframes net-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .net-node-l { font-family: 'Manrope'; font-weight: 700; font-size: clamp(10px,2.4vw,12px); color: ${T.ink}; white-space: nowrap; }
        .net-node-note { font-family: 'Manrope'; font-size: clamp(8px,2vw,9.5px); color: ${T.ink3}; white-space: nowrap; }
        .net-node.visited .net-node-note { color: ${T.success}; }
        .net-lock { position: absolute; top: -7px; right: -7px; font-size: 14px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25)); }
        .net-ip { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(8.5px,2vw,10.5px); color: ${T.ink}; background: ${T.bg}; padding: 1px 6px; border-radius: 6px; box-shadow: inset 0 0 0 1px rgba(${T.shadowBase},0.14); white-space: nowrap; }
        .net-node.match .net-ip { color: ${T.success}; background: ${T.successSoft}; box-shadow: inset 0 0 0 1px rgba(31,122,77,0.4); }
        .net-node.match .net-node-ic { box-shadow: 0 6px 16px -4px rgba(31,122,77,0.5), inset 0 0 0 2px ${T.success}, 0 0 0 7px ${T.successSoft}; background: ${T.successSoft}; animation: net-matchpop 0.55s cubic-bezier(.34,1.4,.4,1); }
        @keyframes net-matchpop { 0% { transform: scale(1); } 45% { transform: scale(1.22); } 100% { transform: scale(1); } }
        .net-hud-ip { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
        .net-packet { position: absolute; transform: translate(-50%,-50%); z-index: 6; width: clamp(28px,7vw,36px); height: clamp(28px,7vw,36px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: clamp(14px,3.4vw,18px); background: ${T.accent}; color: #fff; box-shadow: 0 0 0 4px rgba(255,79,40,0.18), 0 6px 16px -4px rgba(255,79,40,0.6); transition: left 0.6s cubic-bezier(.45,0,.3,1), top 0.6s cubic-bezier(.45,0,.3,1), background 0.3s, box-shadow 0.3s; pointer-events: none; }
        .net-packet.key { background: ${T.blue}; box-shadow: 0 0 0 4px rgba(1,154,203,0.18), 0 6px 16px -4px rgba(1,154,203,0.6); }
        .net-packet.page { background: ${T.success}; box-shadow: 0 0 0 4px rgba(31,122,77,0.18), 0 6px 16px -4px rgba(31,122,77,0.6); }
        .net-packet::after { content: ''; position: absolute; inset: -3px; border-radius: 50%; border: 2px solid #fff; opacity: 0.4; animation: net-halo 1.5s ease-in-out infinite; }
        @keyframes net-halo { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.3); opacity: 0; } }
        .net-msg { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.7vw,15px); text-align: center; margin: 0; padding: 10px 14px; border-radius: 10px; animation: fade-step 0.3s ease-out; }
        .net-msg.good { background: ${T.successSoft}; color: ${T.success}; }
        .net-msg.warn { background: #FFF3E0; color: #B26A00; }
        .net-msg.bad { background: ${T.accentSoft}; color: ${T.accent}; }
        .net-hint { font-family: 'Georgia, serif'; font-style: italic; color: ${T.ink3}; font-size: clamp(12.5px,1.5vw,13.5px); text-align: center; margin: 0; }
        /* Mobil: 3 server tik ustunda — xarita balandroq bo'lsin, tugunlar kichrayadi, IP yorliqlari ustma-ust tushmaydi */
        @media (max-width: 560px) {
          .net-hud { padding-right: 38px; } /* "Qadam" hisoblagichi ⛶ tugma ortida qolmasin */
          .net-map { aspect-ratio: 3 / 4; max-height: 380px; }
          .net-node { width: clamp(48px,15vw,62px); gap: 2px; }
          .net-node-ic { width: clamp(33px,8.5vw,40px); height: clamp(33px,8.5vw,40px); font-size: clamp(15px,4vw,19px); }
          .net-node-l { font-size: clamp(9px,2.4vw,11px); }
          .net-node-note { font-size: clamp(8px,2vw,9px); }
          .net-ip { font-size: clamp(8px,2.2vw,9.5px); padding: 1px 4px; }
          .net-packet { width: clamp(24px,6.5vw,30px); height: clamp(24px,6.5vw,30px); font-size: clamp(12px,3.2vw,15px); }
        }
        @media (prefers-reduced-motion: reduce) { .net-edge.live { animation: none; } .net-node.reachable .net-node-ic, .net-packet::after { animation: none; } }

        /* === SO'ROV YO'LI — OLDINGA OQADIGAN KONVEYER (Screen10) === */
        .pl-line { position: relative; height: clamp(104px,21.5vw,126px); }
        .pl-belt { position: absolute; left: 6%; right: 6%; top: 20%; height: 7px; transform: translateY(-50%); border-radius: 99px; background: rgba(${T.shadowBase},0.14); overflow: hidden; }
        .pl-belt-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, ${T.accent}, ${T.blue}, ${T.success}); background-size: 200% 100%; box-shadow: 0 0 8px rgba(255,79,40,0.35); transition: width 1.15s cubic-bezier(.45,0,.3,1); }
        .pl-belt-fill.go { animation: pl-flow 1s linear infinite; }
        @keyframes pl-flow { from { background-position: 0 0; } to { background-position: -40px 0; } }
        .pl-pkt { position: absolute; top: 20%; transform: translate(-50%,-50%); white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(10px,1.6vw,12.5px); padding: 5px 11px; border-radius: 99px; color: #fff; box-shadow: 0 8px 18px -4px rgba(${T.shadowBase},0.4); transition: left 1.15s cubic-bezier(.45,0,.3,1), background 0.4s ease; z-index: 6; }
        .pl-pkt::after { content: '▾'; position: absolute; left: 50%; bottom: -12px; transform: translateX(-50%); font-size: 13px; line-height: 1; opacity: 0.95; }
        .pl-pkt.req { background: ${T.accent}; } .pl-pkt.req::after { color: ${T.accent}; }
        .pl-pkt.ip { background: ${T.blue}; } .pl-pkt.ip::after { color: ${T.blue}; }
        .pl-pkt.page { background: ${T.success}; } .pl-pkt.page::after { color: ${T.success}; }
        .pl-pkt.read { background: ${CODE.bg}; color: ${CODE.text}; animation: pl-readblink 0.6s ease-in-out infinite; } .pl-pkt.read::after { color: ${CODE.bg}; }
        @keyframes pl-readblink { 0%,100% { box-shadow: 0 8px 18px -4px rgba(${T.shadowBase},0.45), 0 0 0 0 rgba(255,79,40,0); } 50% { box-shadow: 0 8px 18px -4px rgba(${T.shadowBase},0.45), 0 0 0 5px rgba(255,79,40,0.2); } }
        .pl-st { position: absolute; top: 56%; transform: translate(-50%,-50%); display: flex; flex-direction: column; align-items: center; gap: 5px; width: clamp(52px,14vw,72px); }
        .pl-st-ic { width: clamp(38px,9vw,48px); height: clamp(38px,9vw,48px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: clamp(19px,4.6vw,25px); background: ${T.paper}; box-shadow: 0 5px 14px -5px rgba(${T.shadowBase},0.28), inset 0 0 0 2px rgba(${T.shadowBase},0.12); transition: transform 0.35s cubic-bezier(.34,1.35,.4,1), box-shadow 0.35s, background 0.35s; }
        .pl-st.done .pl-st-ic { box-shadow: 0 5px 14px -5px rgba(31,122,77,0.32), inset 0 0 0 2px ${T.success}; background: ${T.successSoft}; }
        .pl-st.on .pl-st-ic { box-shadow: 0 8px 20px -5px rgba(255,79,40,0.45), inset 0 0 0 2px ${T.accent}, 0 0 0 6px ${T.accentSoft}; transform: scale(1.14); animation: vz-pulse 1.1s ease-in-out infinite; }
        .pl-st-l { font-family: 'Manrope'; font-weight: 700; font-size: clamp(9.5px,2.3vw,12px); color: ${T.ink2}; transition: color 0.3s; }
        .pl-st.on .pl-st-l, .pl-st.done .pl-st-l { color: ${T.ink}; }
        .pl-dots { display: flex; justify-content: center; gap: 7px; }
        .pl-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(${T.shadowBase},0.18); transition: all 0.3s; }
        .pl-dot.fill { background: ${T.success}; }
        .pl-dot.cur { background: ${T.accent}; transform: scale(1.4); }
        .pl-cap { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.8vw,15.5px); color: ${T.ink}; text-align: center; min-height: 40px; display: flex; align-items: center; justify-content: center; padding: 0 6px; animation: fade-step 0.4s ease-out; }
        .pl-cap.done { color: ${T.success}; }
        .pl-detail { min-height: clamp(88px,18vw,110px); display: flex; align-items: center; justify-content: center; background: ${T.bg}; border-radius: 12px; padding: 12px; }
        .pl-idle { font-family: 'Georgia, serif'; font-style: italic; color: ${T.ink3}; font-size: 13px; margin: 0; }
        .pl-url { display: flex; align-items: center; gap: 9px; width: 100%; max-width: 360px; background: ${T.paper}; border-radius: 10px; padding: 9px 13px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.18); font-size: clamp(13px,1.8vw,15px); }
        .pl-lock { font-size: 12px; }
        .pl-enter { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: #fff; background: ${T.accent}; padding: 4px 10px; border-radius: 7px; }
        .pl-conv { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .pl-conv-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; font-size: 18px; }
        .pl-pill { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(13px,2vw,16px); padding: 8px 14px; border-radius: 10px; }
        .pl-pill.name { background: ${T.accentSoft}; color: ${T.accent}; }
        .pl-pill.ip { background: #E2F1F7; color: ${T.blue}; animation: pop 0.45s cubic-bezier(.34,1.4,.4,1); }
        .pl-codewrap { width: 100%; max-width: 420px; }
        .pl-codehead { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink2}; margin-bottom: 6px; }
        .pl-code { position: relative; background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.6vw,13.5px); line-height: 1.6; padding: 11px 13px; border-radius: 10px; margin: 0; overflow: hidden; }
        .pl-codeline { white-space: pre-wrap; }
        .pl-code .tg { color: ${CODE.tag}; }
        .pl-scan { position: absolute; left: 0; right: 0; top: 0; height: 26px; background: linear-gradient(180deg, rgba(255,79,40,0.28), transparent); box-shadow: 0 1px 0 rgba(255,79,40,0.7); animation: pl-scanmove 1.1s ease-in-out infinite; }
        @keyframes pl-scanmove { 0% { transform: translateY(-12px); } 100% { transform: translateY(66px); } }
        .pl-render { width: 100%; max-width: 360px; }
        .pl-page { background: #fff; border-radius: 10px; padding: 14px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.2); }
        .pl-pop { animation: htl-pop 0.5s cubic-bezier(.34,1.4,.4,1) both; }
        .pl-controls { display: flex; justify-content: center; margin-top: 2px; }
        .pl-pausebubble { align-items: flex-start; }
        .pl-pausebubble .mentor-name { color: ${T.accent}; }
        .pl-pausebubble .mentor-msg { background: ${T.accentSoft}; box-shadow: 0 6px 16px -6px rgba(255,79,40,0.28); }
        .pl-pausebubble.is-paused .mentor-msg { box-shadow: 0 0 0 2px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.4); }
        @media (prefers-reduced-motion: reduce) { .pl-st.on .pl-st-ic, .pl-belt-fill.go, .pl-scan { animation: none; } .pl-pkt { transition: none; } }

        /* === 12-DARSGA "ICHIGA ZOOM" STRIP (Screen11) === */
        .zi { display: flex; flex-direction: column; gap: 7px; background: ${T.bg}; border-radius: 12px; padding: 11px 14px; }
        .zi-mini { display: flex; align-items: center; justify-content: center; gap: clamp(4px,2vw,12px); }
        .zi-node { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .zi-node-ic { width: clamp(34px,8vw,42px); height: clamp(34px,8vw,42px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: clamp(18px,4.5vw,22px); background: ${T.paper}; box-shadow: 0 4px 11px -5px rgba(${T.shadowBase},0.25), inset 0 0 0 2px rgba(${T.shadowBase},0.12); }
        .zi-node-l { font-family: 'Manrope'; font-weight: 700; font-size: clamp(9px,2.2vw,11px); color: ${T.ink3}; }
        .zi-node.focus .zi-node-ic { box-shadow: 0 6px 16px -4px rgba(255,79,40,0.4), inset 0 0 0 2px ${T.accent}, 0 0 0 5px ${T.accentSoft}; background: ${T.accentSoft}; animation: vz-pulse 1.4s ease-in-out infinite; }
        .zi-node.focus .zi-node-l { color: ${T.accent}; }
        .zi-lens { position: absolute; top: -7px; right: -9px; font-size: 15px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)); animation: zi-lens 1.6s ease-in-out infinite; }
        @keyframes zi-lens { 0%,100% { transform: scale(1) rotate(0); } 50% { transform: scale(1.25) rotate(-8deg); } }
        .zi-wire { position: relative; width: clamp(26px,8vw,58px); height: 2px; background: repeating-linear-gradient(90deg, rgba(${T.shadowBase},0.28) 0 5px, transparent 5px 10px); }
        .zi-pkt { position: absolute; left: 0; top: 50%; transform: translateY(-50%); font-size: 13px; animation: zi-travel 2.4s ease-in-out infinite; }
        @keyframes zi-travel { 0% { left: -4px; opacity: 0; } 15% { opacity: 1; } 62% { left: calc(100% - 6px); opacity: 1; } 80%,100% { left: calc(100% - 6px); opacity: 0; } }
        .zi-label { font-family: 'Manrope'; font-weight: 600; font-size: clamp(11.5px,1.6vw,13px); color: ${T.ink2}; text-align: center; margin: 0; }
        .zi-label b { color: ${T.accent}; }
        @media (prefers-reduced-motion: reduce) { .zi-node.focus .zi-node-ic, .zi-lens, .zi-pkt { animation: none; } }

        /* === MENTOR JONLI STATISTIKA (test ekrani, proyektorga chiqadi — to'g'ri javob SIR) === */
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

        /* === PODIUM / STATISTIKA SAHIFASI === */
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
        @media (max-width: 560px) { .pod-row-dots { display: none; } .qstat-lbl { min-width: 108px; } }

        /* === ⚔️ MUSTAHKAMLASH — CTA banner (yakuniy sahifada) === */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: linear-gradient(135deg, #1D1145, #35206B); border-radius: 18px; padding: clamp(16px,2.4vw,22px) clamp(18px,2.6vw,26px); box-shadow: 0 14px 36px -14px rgba(29,17,69,0.55); }
        .qz-cta-txt { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 3px; }
        .qz-cta-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(16px,2.2vw,20px); color: #fff; }
        .qz-cta-s { font-family: 'Manrope'; font-weight: 500; font-size: 13px; color: rgba(255,255,255,0.72); }
        .qz-cta-btn { background: ${T.accent}; color: #fff; border: none; border-radius: 14px; padding: 13px 24px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.7); transition: transform 0.2s; }
        .qz-cta-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
        .qz-cta-btn:disabled { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.55); cursor: default; box-shadow: none; }
        .qz-cta.ready .qz-cta-btn { animation: qz-pulse 1.1s ease-in-out infinite; }
        @keyframes qz-pulse { 0%,100% { transform: scale(1); box-shadow: 0 8px 22px -8px rgba(255,79,40,0.7); } 50% { transform: scale(1.06); box-shadow: 0 10px 30px -6px rgba(255,79,40,0.95); } }

        /* === ⚔️ ARENA — to'liq ekran, tiniq qorong'u jang muhiti === */
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

        /* Savol ko'rinishi */
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

        /* Natija banneri (o'quvchi) */
        .qz-res { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; justify-content: center; border-radius: 16px; padding: 14px 26px; animation: qz-pop 0.45s cubic-bezier(.34,1.5,.4,1); }
        .qz-res.good { background: rgba(43,217,124,0.16); outline: 1.5px solid rgba(43,217,124,0.5); }
        .qz-res.bad { background: rgba(255,90,90,0.14); outline: 1.5px solid rgba(255,90,90,0.4); }
        .qz-res-pts { font-family: 'Manrope'; font-weight: 800; font-size: clamp(28px,4.4vw,40px); color: #2BD97C; line-height: 1; }
        .qz-res-t { font-family: 'Manrope'; font-weight: 700; font-size: clamp(14px,2vw,17px); color: #fff; }
        .qz-res-rank { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; color: rgba(255,255,255,0.7); width: 100%; text-align: center; }

        /* TOP-5 / to'liq reyting */
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

        /* Yakuniy podium */
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
        /* Qutqaruv banneri — dars tugaganda o'quvchi arenada osilib qolmasin */
        .qz-endnote { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 6; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 94vw; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 16px; padding: 10px 16px; color: #fff; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13.5px; backdrop-filter: blur(6px); }

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
        .rc-code { background: ${CODE.bg}; color: ${CODE.text}; font-size: clamp(15px,2.4vw,22px); border-radius: 12px; padding: clamp(12px,2vw,18px) clamp(16px,2.6vw,26px); box-shadow: 0 10px 26px -8px rgba(${T.shadowBase},0.3); }
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

        /* Mentor statistikasidagi verdikt (natija ochilgach) */
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
        /* Mobil: nuqtalar tepada, tugmalar pastda markazda — tugma ekrandan chiqib ketmasin */
        @media (max-width: 640px) {
          .rc-nav { flex-wrap: wrap; justify-content: center; row-gap: 10px; }
          .rc-dots { width: 100%; order: -1; }
          .rc-btn { font-size: 13px; padding: 11px 16px; }
        }

      `}</style>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="Internet darsi" />
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