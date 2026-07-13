import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png';

// ============================================================
// NEST ARXITEKTURA MODULI (4a) · PRAKTIKA — "KitobShop" MINI-LOYIHA — PLATFORM STANDARD v18 (AUDIOSIZ)
// Maqsad (YOU-DO): o'quvchi AI agentni boshqarib, 3 bog'langan resursli real backend quradi: Category, Book, Order.
// Boshqaruv sikli: REJALASHTIR (reja) -> YO'NALTIR (agentga aniq buyruq) -> TEKSHIR (natijani tekshir).
// Metafora (modul bo'ylab izchil): restoran -> do'kon. Bo'lim=Module · sotuvchi/ofitsiant=Controller · omborchi/oshpaz=Service
//   · javon chizmasi=Entity · ombor=PostgreSQL · anketa=DTO · kirish taxtasi=AppModule.imports · eshik qo'riqchisi=Guard/@Roles
//   · YORLIQ=@ManyToOne bog'lanishi (ko'p kitob -> bitta yorliq; yorliq KITOBDA saqlanadi).
// Jonli qatlam: PIN + Kahoot-reveal + podium + CodeStrike arena + jonli praktika (500+ signal zonasi).
// Ekranlar: 23 (s0..s17, s19, spf praktika, spod podium, sflash flashcards, s20 yakun).
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309', amberSoft: '#FBEBD8',
  nest: '#E0234E', line: '#E9E6DF',
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
// Matn ichidagi `kod` bo'laklarini chip qilib ko'rsatadi (qcode)
const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;

// AUDIOSIZ dars — useAudio/getAudioEngine zaglushkasi (imzo saqlanadi, TTS yo'q)
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

const LESSON_META = { lessonId: 'nest-arch-practice-4a-03-v18', lessonTitle: { uz: 'Praktika — KitobShop backend', ru: 'Практика — бэкенд KitobShop' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'case',        template: 'custom',   scored: false, scope: null }, // PickLines challenge (nishon: shelf)
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's16', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's17', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's19', type: 'case',        template: 'custom',   scored: false, scope: null }, // Audit challenge — yolg'on da'vo (nishon: owner)
  { id: 'spf', type: 'practice',    template: 'custom',   scored: false, scope: null },
  { id: 'spod', type: 'stats',      template: 'custom',   scored: false, scope: null },
  { id: 'sflash', type: 'flashcards', template: 'custom', scored: false, scope: null },
  { id: 's20', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

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
  const padH = isMobile ? 12 : 60; // layout standarti: 1100px + 60px (11.11)
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
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .swg-row, .tree-row, .pick-row, .bk, .sh, .cl-row, .lg-card');
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
// 5.5 — optionalLive: jonli darsda mentor oldinga o'tsa, o'quvchi gate'da qolib ketmaydi (freeRide). Testlarga BERILMAYDI.
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


// ============================================================
// 📖 QAYTA TUSHUNTIRISH (recap) — scored testda xato chiqsa mavzuni qisqa kartalarda yana ko'rsatish.
// Kalitlar — scored test ekranlarining screens[]-indekslari (5, 8, 12, 15).
// SKELET: kontent «eshik + qo'riqchi», «yorliq», «kirish taxtasi» metaforasida — 🎓 Metodist sayqallaydi.
// ============================================================

const RcFlow = ({ items, sep = '→' }) => (
  <div className="rc-flow">{items.map((t, i) => <React.Fragment key={i}><span className="rc-chip">{t}</span>{sep && i < items.length - 1 && <span className="rc-arr">{sep}</span>}</React.Fragment>)}</div>
);
const RECAPS = {
  5: {
    title: "Tekshiruvchi — AI yozgach nima qilamiz",
    cards: [
      { ic: "📋", h: "Uch ish: rejalashtir, yo'naltir, tekshir", body: <>Avval <b>reja</b> tuzasiz (qaysi resurs, qaysi ustun), keyin agentga <b>aniq buyruq</b> berasiz, so'ng natijani <b>tekshirasiz</b>. Uchinchisi tushib qolsa — xato sizniki bo'lib qoladi.</>, vis: <RcFlow items={["Rejalashtir", "Yo'naltir", "Tekshir"]} /> },
      { ic: "🧾", h: "5 fayl — bitta resurs", body: <>Har resurs: <span className="mono">entity</span> (javon chizmasi), <span className="mono">dto</span> (anketa), <span className="mono">service</span> (omborchi), <span className="mono">controller</span> (sotuvchi), <span className="mono">module</span> (bo'lim). Beshtasi ham bormi — birinchi tekshiruv shu.</>, vis: <RcFlow items={["entity", "dto", "service", "controller", "module"]} sep="·" /> },
      { ic: "🚪", h: "Kirish taxtasi — 404 sababi", body: <>Bo'lim <span className="mono">AppModule.imports</span> ga yozilmasa, u restoranning kirish taxtasida yo'q — <b>mijoz eshikni topa olmaydi</b> (<span className="mono">404</span>). Swagger'da ko'rinyaptimi — shuni tekshiring.</>, ask: "AI kod yozib berdi. Birinchi navbatda nimani tekshirasiz?" },
    ]
  },
  8: {
    title: "Eshik va qo'riqchi — public vs admin",
    cards: [
      { ic: "🛡️", h: "Qo'riqchi = @UseGuards", body: <><span className="mono">@UseGuards(AuthGuard, RolesGuard)</span> — eshikka qo'riqchi qo'yadi. <span className="mono">AuthGuard</span> tokenni tekshiradi, <span className="mono">RolesGuard</span> — rolni.</>, vis: <RcFlow items={["so'rov", "qo'riqchi", "controller"]} /> },
      { ic: "🔑", h: "@Roles — qo'riqchining ro'yxati", body: <>🌐 <span className="mono">@Roles('public')</span> — hamma kiradi. 🔒 <span className="mono">@Roles(UserRole.ADMIN)</span> — faqat admin. Ro'yxatni <b>siz</b> yozasiz, qo'riqchi shuni bajaradi.</> },
      { ic: "🚫", h: "403 — qo'riqchi rad etdi", body: <>Token yo'q bo'lsa — <span className="mono">401</span>. Token bor, lekin rol yetmasa — <span className="mono">403</span>. Ikkalasi ham «kirmaysiz» degani; server o'chmaydi.</>, ask: "Oddiy mijoz POST /book qilsa nima bo'ladi?" },
    ]
  },
  12: {
    title: "findAll + where — tayyor retsept kitobi",
    cards: [
      { ic: "📕", h: "BaseService — tayyor retsept kitobi", body: <>Service <span className="mono">BaseService</span> ni <b>meros oladi</b> (ya'ni tayyor retsept kitobini qo'liga oladi) — shu zahoti <span className="mono">create / findAll / update / remove</span> tekin keladi. Ularni qaytadan yozmaysiz.</>, vis: <RcFlow items={["BaseService", "findAll", "create"]} sep="·" /> },
      { ic: "🔎", h: "where — shart", body: <>Maxsus endpoint uchun yangi CRUD yozmaysiz: <span className="mono">findAll({'{ where: { is_featured: true } }'})</span> — faqat shart berasiz.</> },
      { ic: "🏷️", h: "relations — yorliqni ham olib kelish", body: <><span className="mono">findAll({'{ relations: { category: true } }'})</span> — kitob bilan birga uning yorlig'i (kategoriyasi) ham qaytadi.</>, ask: "Faqat top kitoblarni qanday qaytaramiz?" },
    ]
  },
  15: {
    title: "Debug — qo'riqchiga noto'g'ri ro'yxat",
    cards: [
      { ic: "🧍", h: "Mijozni o'z do'koningizga kiritmaslik", body: <>Agent <span className="mono">POST /order</span> ga <span className="mono">@Roles(ADMIN)</span> qo'yib ketgan. Natija: <b>mijoz buyurtma bera olmaydi</b> — 403. Ochilish kuni, buyurtma yo'q.</>, vis: <RcFlow items={["mijoz", "POST /order", "403"]} /> },
      { ic: "🔍", h: "Dalil avval, kod keyin", body: <>Avval <b>ikki rolda</b> eshikni sinaysiz (🧍 mijoz / 🔑 admin), dalil jadvalini to'ldirasiz — <b>keyin</b> kodni ochasiz. Xato qatorni dalil ko'rsatadi.</> },
      { ic: "🔧", h: "Faqat o'sha qator tuzatiladi", body: <>Guard'ni butunlay o'chirmaysiz (u holda admin eshiklari ham ochilib qoladi). Faqat <span className="mono">POST /order</span> ni <span className="mono">@Roles('public')</span> qilasiz.</>, ask: "Mijoz buyurtma berolsin desak, qatorni qanday tuzatamiz?" },
    ]
  },
};

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

// ===== 📊 MENTOR STATISTIKASI (jonli test) — proyektorda jonli natija, Kahoot-reveal =====
const MSTATS_COLORS = ['#019ACB', '#8B5CF6', '#E8A13A', '#E0559A'];
const RECAP_NEED_PCT = 60, RECAP_GOOD_PCT = 75, RECAP_MIN_ANSWERS = 3;
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
      {reveal && answered >= RECAP_MIN_ANSWERS && (() => {
        const pct = Math.round((ok / answered) * 100);
        const level = pct < RECAP_NEED_PCT ? 'need' : pct < RECAP_GOOD_PCT ? 'maybe' : 'good';
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

const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const oneShot = !!(live && live.mode === 'student'); // jonli dars: BITTA urinish
  const isMentorLive = !!(live && live.mode === 'mentor');
  const mountTs = useRef(Date.now());
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
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
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

const CodeFile = ({ name, children, minH }) => (
  <div className="editor">
    <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">{name}</span></div>
    <div className="editor-body" style={{ minHeight: minH }}><pre className="editor-code">{children}</pre></div>
  </div>
);
const AgentCard = ({ children, title = "💬 Agentni shunday yo'naltiring" }) => (
  <div className="agent-card"><span className="agent-lbl">{title}</span><p className="agent-msg">{children}</p></div>
);
// ===== MOCK SWAGGER (KitobShop, lock = faqat admin) =====
const M_COLOR = { GET: T.blue, POST: T.success, PATCH: T.amber, DELETE: T.danger };
const SHOP_EPS = [
  { m: 'POST', path: '/category', lock: true, sum: 'Kategoriya qo\'shish', resp: '{ "statusCode": 201, "data": { "id": "ct1...", "name": "Detektiv" } }' },
  { m: 'GET', path: '/category', lock: false, sum: 'Kategoriyalar', resp: '{ "statusCode": 200, "data": [ { "name": "Detektiv" }, { "name": "Ilmiy" } ] }' },
  { m: 'POST', path: '/book', lock: true, sum: 'Kitob qo\'shish', resp: '{ "statusCode": 201, "data": { "title": "Sherlok Holms", "price": 45000 } }' },
  { m: 'GET', path: '/book', lock: false, sum: 'Barcha kitoblar', resp: '{ "statusCode": 200, "data": [ { "title": "Sherlok Holms", "author": "Doyl", "price": 45000 } ] }' },
  { m: 'GET', path: '/book/featured', lock: false, sum: '⭐ Top kitoblar', resp: '{ "statusCode": 200, "data": [ { "title": "Sherlok Holms", "is_featured": true } ] }' },
  { m: 'POST', path: '/order', lock: false, sum: 'Buyurtma berish', resp: '{ "statusCode": 201, "data": { "bookId": "bk1...", "quantity": 2 } }' },
  { m: 'GET', path: '/order', lock: true, sum: 'Buyurtmalar', resp: '{ "statusCode": 200, "data": [ { "customer_name": "Ali", "quantity": 2 } ] }' }
];
const ShopSwagger = ({ eps = SHOP_EPS, openId, onToggle, triedIds, onTry }) => (
  <div className="swg">
    <div className="swg-top"><span className="swg-dot" /> KitobShop API <span className="swg-ver">/api/v1</span></div>
    {eps.map(e => {
      const id = e.m + e.path;
      const open = openId === id;
      const tried = triedIds.has(id);
      return (
        <div key={id} className="swg-row">
          <button className={`swg-head ${!tried && !open ? 'tap-hint' : ''}`} onClick={() => onToggle(id)}>
            <span className="swg-m" style={{ background: M_COLOR[e.m] }}>{e.m}</span>
            <span className="swg-path">{e.path}</span>
            <span className="swg-sum">{e.sum}</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span title={e.lock ? 'faqat admin' : 'ochiq'} style={{ fontSize: 12 }}>{e.lock ? '🔒' : '🌐'}</span>
              <span className="swg-chev">{open ? '▾' : '▸'}</span>
            </span>
          </button>
          {open && (
            <div className="swg-detail el-in">
              {!tried
                ? <button className="btn-soft" onClick={() => onTry(id)} style={{ alignSelf: 'flex-start' }}>▶ Try it out</button>
                : <><div className="swg-code-lbl">Javob · <span style={{ color: T.success }}>{e.m === 'POST' ? '201' : '200'}</span></div><pre className="json">{e.resp}</pre></>}
            </div>
          )}
        </div>
      );
    })}
  </div>
);
// ===== PICK LINES (Dars 2 dan) =====
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
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Fayl tayyor — har qator o'z joyida.</p></div>}
      </Col>
    </div>
    </Zoomable>
  );
};

// ===== AGENT FAYL GENERATSIYASI (Dars 2 s16 dan) =====
const FileGen = ({ files, running, n }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
    {files.map((file, i) => {
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
);
function useFileGen(total, storedAnswer) {
  const [n, setN] = useState(storedAnswer ? total : 0);
  const [running, setRunning] = useState(false);
  const done = n >= total;
  useEffect(() => {
    if (!running) return;
    if (n >= total) { setRunning(false); return; }
    const t = setTimeout(() => setN(x => x + 1), 560);
    return () => clearTimeout(t);
  }, [running, n, total]);
  const run = () => { if (running || done) return; setN(0); setRunning(true); };
  return { n, running, done, run };
}
// ===== TEKSHIRUV CHECKLIST (TEKSHIRUVCHI roli) =====
const Checklist = ({ items, doneInit, onComplete }) => {
  const [seen, setSeen] = useState(() => doneInit ? new Set(items.map((_, i) => i)) : new Set());
  const done = seen.size >= items.length;
  const fired = useRef(false);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onComplete && onComplete(); } }, [done]);
  const tap = (i) => setSeen(prev => { const s = new Set(prev); s.add(i); return s; });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((it, i) => {
        const on = seen.has(i);
        return (
          <button key={i} className={`vcard ${on ? '' : 'tap-hint'}`} onClick={() => tap(i)} style={{ boxShadow: on ? `inset 0 0 0 1.5px ${T.success}, 0 5px 14px -6px rgba(${T.shadowBase},0.16)` : undefined, alignItems: 'flex-start' }}>
            <span className="vseen" style={{ marginLeft: 0, marginRight: 2, color: on ? T.success : T.ink3, minWidth: 18 }}>{on ? '✓' : '☐'}</span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
              <span className="vlbl" style={{ fontFamily: "'Manrope'", fontSize: 13 }}>{it.t}</span>
              {on && <span className="role-r el-in">{it.ok}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
};
// ===== SO'ROV YO'LI (Integration) =====
const SHOP_FLOW = [
  { k: 'Admin', icon: '🔒', r: 'POST /book', d: 'Admin token bilan yangi kitob qo\'shadi (guard ruxsat beradi).' },
  { k: 'Mijoz', icon: '🌐', r: 'GET /book/featured', d: 'Mijoz top kitoblarni ko\'radi — token kerakmas (public).' },
  { k: 'Buyurtma', icon: '🛒', r: 'POST /order', d: 'Mijoz bookId bilan buyurtma beradi (Order → Book bog\'lanishi).' },
  { k: 'Tekshiruv', icon: '📋', r: 'GET /order', d: 'Admin kelgan buyurtmalarni ko\'radi (faqat admin).' },
  { k: 'Tayyor', icon: '✅', r: 'KitobShop ishlaydi', d: 'Admin + mijoz oqimi to\'liq — real do\'kon backendi!' }
];

// ===== 🧵 BEAT 0 — MEROS TASMASI: restoran -> bitta bo'lim -> KitobShop (xodimlar bir xil) =====
const LEGACY = [
  { id: 'l1', ic: '🍽️', t: 'Restoran',      s: "1-dars — ko'rdingiz" },
  { id: 'l2', ic: '🔧', t: "Bitta bo'lim",   s: "2-dars — ochdingiz" },
  { id: 'l3', ic: '📚', t: 'KitobShop',      s: "bugun — 3 bo'lim, o'zingiz" }
];
const STAFF = ["🛡️ qo'riqchi", '🧾 sotuvchi', '📋 anketa', '📦 omborchi', "🏷️ bo'lim"];
const LegacyRail = ({ seen, onTap }) => (
  <div className="lg-rail fade-up delay-2">
    {LEGACY.map(l => {
      const on = seen.has(l.id);
      return (
        <button key={l.id} className={`lg-card ${on ? 'on' : ''} ${on ? '' : 'tap-hint'}`} onClick={() => onTap(l.id)}>
          <span className="lg-ic">{l.ic}</span>
          <span className="lg-t">{l.t}</span>
          <span className="lg-s">{l.s}</span>
          <span className={`lg-staff ${on ? 'lit' : ''}`}>{STAFF.map((s, i) => <i key={i}>{s}</i>)}</span>
        </button>
      );
    })}
  </div>
);

// ===== SCREEN 0 — HOOK: tayyor KitobShop + meros tasmasi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [openId, setOpenId] = useState(null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['GET/book/featured']) : new Set());
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [lseen, setLseen] = useState(storedAnswer ? new Set(LEGACY.map(l => l.id)) : new Set());
  const [sc, setSc] = useState(0);
  const triedOne = tried.size >= 1;
  const OPTS = [
    { id: 'a', label: "Hammasini bitta ulkan faylga yozamiz" },
    { id: 'b', label: "3 resurs — har biri 5 qadam, agent bilan tez quramiz" },
    { id: 'c', label: "Bunday do'kon backendini faqat katta jamoa quradi" }
  ];
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  const tapLegacy = (id) => { setLseen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !triedOne) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Praktika · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext optionalLive disabled={picked === null} label="Boshlaymiz" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Mana siz quradigan narsa — haqiqiy <span className="italic" style={{ color: T.accent }}>onlayn kitob do'koni</span>.</h1>
        <Mentor>Bu — <b style={{ color: T.ink }}>KitobShop</b>: admin kitob qo'shadi, mijozlar ko'radi, "Top kitoblar"ni ko'zdan kechiradi va buyurtma beradi. Ro'yxatdagi har qator — bitta <b style={{ color: T.ink }}>endpoint</b>, ya'ni <b style={{ color: T.ink }}>eshik</b>: mijoz shu manzilga so'rov yuboradi. 🔒 — faqat admin kiradi, 🌐 — hamma kiradi. Bitta eshikni ochib <b style={{ color: T.ink }}>"Try it out"</b> bilan sinab ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <ShopSwagger openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Bunday backendni qanday quramiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !triedOne} style={{ opacity: !triedOne ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!triedOne && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval bitta endpointni sinang ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Har resurs — o'sha 5 qadam sikli. Bugun <b>3 resursni</b> (Kategoriya, Kitob, Buyurtma) <b>AI yordamchi bilan</b> qurasiz: siz <b>rejalashtirasiz</b>, AI'ni <b>yo'naltirasiz</b> va natijani <b>tekshirasiz</b>.</p>}
          </Col>
        </Split>
        </Zoomable>
        <p className="flow-label" style={{ marginTop: 4 }}>Uch dars — bitta zanjir (har birini bosib ko'ring)</p>
        <LegacyRail seen={lseen} onTap={tapLegacy} />
        {lseen.size >= LEGACY.length && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Biznes boshqa — <b>xodimlar bir xil</b>. Restoranda ofitsiant, do'konda sotuvchi: ish bitta — so'rovni oladi, javobni qaytaradi. Kodda ikkalasi ham <span className="mono">Controller</span>. Aynan shuning uchun bu — <b>arxitektura</b>.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — RULE: bosh dasturchi 3 ishi =====
const Screen1 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const HATS = [
    { id: 'plan', icon: '📋', t: 'Rejalashtiruvchi', d: 'Rejalashtiradi: qaysi resurs, qaysi ustun, qanday bog\'lanish.' },
    { id: 'guide', icon: '🤖', t: 'Yo\'naltiruvchi', d: 'AI yordamchiga aniq topshiriq beradi (playbook prompt).' },
    { id: 'check', icon: '🔍', t: 'Tekshiruvchi', d: 'Natijani tekshiradi: to\'g\'ri qatlam? ulangan? himoyalangan?' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(HATS.map(h => h.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= HATS.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = HATS.find(h => h.id === active);
  return (
    <Stage eyebrow="Qoida · 3 ish" screen={screen} scrollSignal={sc} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Boshlaymiz →' : `3 ishni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bugun ko'p kod yozmaysiz — siz <span className="italic" style={{ color: T.accent }}>bosh dasturchisiz</span>.</h2></div>
        <Mentor>AI yordamchingiz kodni soniyalarda yozadi — siz uni <b style={{ color: T.ink }}>yo'naltirasiz</b> va natijani <b style={{ color: T.ink }}>tekshirasiz</b>. Bosh dasturchi shu uchta ishni qiladi. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HATS.map(h => (
                <button key={h.id} className={`vcard ${seen.has(h.id) ? '' : 'tap-hint'}`} onClick={() => tap(h.id)} style={{ boxShadow: active === h.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">{h.icon}</span>
                  <span className="vlbl mono">{h.t}</span>
                  <span className="vseen" style={{ color: seen.has(h.id) ? T.success : T.ink3 }}>{seen.has(h.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span style={{ fontSize: 22, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.t}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Rolni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sikl: <b>Rejalashtir → Yo'naltir → Tekshir</b>. Har resurs uchun shu uch qadam. Boshlaymiz — avval reja.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};
// ===== SCREEN 2 — REJALASHTIRUVCHI: ma'lumotlar rejasi =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const NODES = [
    { id: 'cat', t: 'Category', cols: 'name', rel: null, d: 'Kitob turlari: Detektiv, Ilmiy, Bolalar...' },
    { id: 'book', t: 'Book', cols: 'title · author · price · is_featured', rel: '→ Category (@ManyToOne)', d: 'Har kitob bitta kategoriyaga tegishli.' },
    { id: 'order', t: 'Order', cols: 'customer_name · quantity', rel: '→ Book (@ManyToOne)', d: 'Har buyurtma bitta kitobga ishora qiladi.' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(NODES.map(n => n.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= NODES.length;
  const tap = (id) => { setActive(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = NODES.find(n => n.id === active);
  return (
    <Stage eyebrow="Reja · ma'lumotlar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `3 jadvalni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kitob do'koni qanday <span className="italic" style={{ color: T.accent }}>ma'lumotlarni</span> saqlaydi — va ular bir-biriga qanday <span className="italic" style={{ color: T.accent }}>ulanadi</span>?</h2></div>
        <Mentor>AI'ga buyruq berishdan oldin <b style={{ color: T.ink }}>reja</b> tuzamiz: do'konda 3 turdagi ma'lumot bor — kategoriyalar, kitoblar va buyurtmalar. Ular bir-biriga bog'lanadi. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {NODES.map((nd) => (
                <React.Fragment key={nd.id}>
                  <button className={`vcard ${seen.has(nd.id) ? '' : 'tap-hint'}`} onClick={() => tap(nd.id)} style={{ boxShadow: active === nd.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined, flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}><span className="vlbl mono">📦 {nd.t}</span><span className="vseen" style={{ color: seen.has(nd.id) ? T.success : T.ink3 }}>{seen.has(nd.id) ? '✓' : ''}</span></span>
                    <span className="role-r" style={{ fontFamily: "'JetBrains Mono'" }}>{nd.cols}</span>
                  </button>
                  {nd.rel && <div className="mono" style={{ fontSize: 10.5, color: T.accent, fontWeight: 700, margin: '4px 0 4px 14px' }}>↑ {nd.rel}</div>}
                </React.Fragment>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="frame fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>📦 {cur.t}</span></p><p className="body" style={{ margin: '0 0 8px', color: T.ink }}>{cur.d}</p><div className="ent-row siz">{cur.cols} <span>← ustunlar</span></div>{cur.rel && <div className="ent-row free el-in">{cur.rel} <span>← bog'lanish</span></div>}</div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Jadvalni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Reja tayyor: <b>Category ← Book ← Order</b>. Endi har birini agent bilan quramiz — Category'dan boshlaymiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — 🎯 BEAT 1: agent AYNAN aytganingizni yozadi (3 neytral buyruq · oqibat = kirish taxtasi) =====
const CMDS = [
  { id: 'c1', label: '1-buyruq', text: '"kategoriya qil"', wired: false,
    files: [{ f: 'category.ts', d: 'hammasi bitta faylda' }],
    note: "Agent nima so'ralganini o'zi taxmin qildi — bitta chalkash fayl. Qaysi ustun? Qaysi qatlam? Noma'lum." },
  { id: 'c2', label: '2-buyruq', text: '"category.entity.ts yoz: name ustuni."', wired: false,
    files: [{ f: 'category.entity.ts', d: 'name' }],
    note: "Buyruq aniq — lekin TO'LIQ emas. Agent aynan so'ralganini yozdi: bitta fayl. DTO, service, controller, module va ulanish yo'q." },
  { id: 'c3', label: '3-buyruq', text: '"Category resursini qo\'sh: Entity (name) -> DTO -> BaseService\'dan service -> CRUD controller -> module va AppModule\'ga ula."', wired: true,
    files: [{ f: 'category.entity.ts', d: 'name' }, { f: 'create/update-category.dto.ts', d: 'anketa' }, { f: 'category.service.ts', d: 'BaseService' }, { f: 'category.controller.ts', d: 'CRUD' }, { f: 'category.module.ts', d: "bo'lim" }, { f: 'AppModule.imports += CategoryModule', d: 'kirish taxtasi' }],
    note: "To'liq playbook: 5 fayl + bo'lim kirish taxtasiga yozildi. Endi /category tirik." }
];
function useAgentRun(files, initDone) {
  const total = files.length;
  const [n, setN] = useState(initDone ? 99 : 0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (n >= total) { setRunning(false); return; }
    const t = setTimeout(() => setN(x => x + 1), 460);
    return () => clearTimeout(t);
  }, [running, n, total]);
  const start = () => { setN(0); setRunning(true); };
  return { n, running, done: total > 0 && n >= total, start };
}
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pickId, setPickId] = useState(storedAnswer ? 'c3' : null);
  const [sc, setSc] = useState(0);
  const cmd = CMDS.find(c => c.id === pickId) || null;
  const gen = useAgentRun(cmd ? cmd.files : [], !!storedAnswer);
  const shown = !!cmd && gen.done;
  const wired = shown && cmd.wired;
  const done = pickId === 'c3' && gen.done;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: 'c3' }); }, [done]); // eslint-disable-line
  const send = (id) => { if (done) return; setPickId(id); setSc(n => n + 1); gen.start(); };
  return (
    <Stage eyebrow="Yo'naltirish · buyruq" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : "To'liq playbookni yuboring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agent <span className="italic" style={{ color: T.accent }}>aynan</span> aytganingizni yozadi — ko'proq emas.</h2></div>
        <Mentor>Birinchi resurs — <b style={{ color: T.ink }}>Category</b>. Uchta buyruq bor, uchalasi ham ishonarli ko'rinadi. Bittasini yuboring va o'ngda <b style={{ color: T.ink }}>oqibatini</b> ko'ring: bo'lim <b style={{ color: T.ink }}>kirish taxtasiga</b> yozilmasa, mijoz eshikni topa olmaydi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            {CMDS.map(c => (
              <button key={c.id} className={`vcard ${pickId === c.id ? 'on' : ''} ${pickId ? '' : 'tap-hint'}`} onClick={() => send(c.id)} disabled={done && c.id !== 'c3'} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, boxShadow: pickId === c.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                <span className="vlbl" style={{ fontFamily: "'Manrope'" }}>{c.label}</span>
                <span className="agent-msg">{c.text}</span>
              </button>
            ))}
            {shown && <div className={wired ? 'frame-success fade-step' : 'frame-warn fade-step'}><p className="body" style={{ margin: 0, color: T.ink }}>{cmd.note}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Agent yaratayotgan fayllar</p>
            {cmd
              ? <FileGen files={cmd.files} running={gen.running} n={gen.n} />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Buyruqni yuboring ←</p></div>}
            {shown && <>
              <p className="flow-label" style={{ marginTop: 4 }}>🍽️ Restoran kirish taxtasi — AppModule.imports</p>
              <div className="frame" style={{ padding: 13 }}>
                <div className="ent-row free">TypeOrmModule · AuthModule <span>bor</span></div>
                {wired
                  ? <div className="ent-row free el-in">CategoryModule <span>yozildi</span></div>
                  : <div className="ent-row siz">CategoryModule <span>yo'q</span></div>}
                <div className={`ev-row ${wired ? 'fixed' : 'hot'}`} style={{ marginTop: 8, marginBottom: 0 }}>
                  <span className="ev-m">GET</span><span style={{ flex: 1 }}>/category</span>
                  <b style={{ color: wired ? T.success : T.danger }}>{wired ? '200 ✓' : '404'}</b>
                </div>
              </div>
              {!wired && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Bo'lim taxtada yo'q — mijoz uchun bu eshik <b>mavjud emas</b>. Boshqa buyruqni sinang.</p></div>}
              {wired && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Category tirik! Farq "aniq/noaniq"da emas edi — <b>TO'LIQmi</b> shunda edi. Endi tekshiruvchi bo'lib ko'rib chiqamiz.</p></div>}
            </>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEKSHIRUVCHI: tekshiruv checklist (Category) =====
const Screen4 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const ITEMS = [
    { t: '5 fayl yaratildimi? (entity, dto, service, controller, module)', ok: '✓ Hammasi bor.' },
    { t: 'category.module.ts AppModule imports\'iga ulanganmi?', ok: '✓ Ulangan — usiz /category 404 bo\'lardi.' },
    { t: 'Service BaseService\'ni meros olganmi? (meros = tayyor retsept kitobini oladi)', ok: '✓ Ha — create/findAll/update/remove tekin keldi, ularni yozmaymiz.' },
    { t: 'Swagger\'da /category eshiklari (endpointlari) ko\'rinyaptimi?', ok: '✓ Ko\'rinyapti — Category tirik!' }
  ];
  return (
    <Stage eyebrow="Tekshiruv · checklist" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Har bandni tekshiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yozib berdi — endi uni qanday <span className="italic" style={{ color: T.accent }}>tekshiramiz</span>?</h2></div>
        <Mentor>Natijani tekshirish — bosh dasturchining doimiy odati (AI yomon bo'lgani uchun emas, shunchaki professional ish shunaqa). Mana tekshiruv ro'yxati — har bandni bosib tasdiqlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Checklist items={ITEMS} doneInit={!!storedAnswer} onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }} />
          </Col>
          <Col>
            <AgentCard title="🔍 Tekshiruv qoidasi">Har resurs uchun shu 4 bandni ko'rib chiqing. AI tez yozadi — siz natija to'g'riligiga ishonch hosil qilasiz.</AgentCard>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Category ✓ tasdiqlandi. 1-resurs tayyor! Endi muhim savol: <b>har kim kitob qo'sha olishi kerakmi?</b></p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5 — TEST 1 (tekshiruv) =====
const Screen5 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Bosh dasturchi sifatida AI kod yozgandan keyin eng muhim vazifangiz nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI yozgach, sizning eng muhim <span className="italic" style={{ color: T.accent }}>vazifangiz</span>?</h2></>}
    options={['Natijani ko\'rmasdan keyingi ishga o\'tish', 'Kodni har safar o\'chirib qayta yozdirish', 'Natijani tekshirish — qatlam va ulanish', 'Xuddi shu vazifani boshqa AI\'ga berish']} correctIdx={2}
    explainCorrect="To'g'ri! AI tez yozadi, siz esa natijani tekshirasiz: to'g'ri qatlam? bo'lim ulanganmi? eshik himoyalanganmi? Swagger'da ko'rinyaptimi? Bu — bosh dasturchining asosiy ishi."
    explainWrong={{
      0: "Ko'rmasdan o'tib ketish xavfli — mayda narsa o'tkazib yuborilishi mumkin. Tekshirish shart.",
      1: "Har safar qayta yozdirish shart emas — avval tekshiring, kerak bo'lsa aniq tuzating.",
      3: "Boshqa AI ham xato qilishi mumkin. Asosiysi — natijani siz tekshirasiz.",
      default: "Eng muhimi — natijani tekshirish."
    }} />
);

// ===== SCREEN 6 — AUTH tushuncha =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [guard, setGuard] = useState(!!storedAnswer);
  const [tried, setTried] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = guard;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tryHack = () => { setTried(true); setSc(n => n + 1); };
  const addGuard = () => { setGuard(true); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Yangi · Auth" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Qo\'riqchini qo\'ying'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har kim kitob qo'sha olsa — do'kon <span className="italic" style={{ color: T.accent }}>nima bo'ladi</span>?</h2></div>
        <Mentor>Kitob qo'shish — faqat <b style={{ color: T.ink }}>admin</b> ishi. Hozir himoya yo'q: istalgan odam <span className="mono">POST /book</span> qila oladi. Avval "hujum"ni sinab ko'ring, keyin qo'riqchi (<span className="mono">guard</span>) qo'ying.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="book.controller.ts" minH={110}>
              {guard ? <><At>@UseGuards</At>{'(AuthGuard, RolesGuard)'}{'\n'}</> : <Cm>{'// himoya yo\'q!'}{'\n'}</Cm>}
              <At>@Controller</At>{"('book') {"}{'\n'}
              {guard ? <span className="el-in" style={{ color: CODE.attr }}>{'  @Roles'}<span style={{ color: CODE.text }}>{'(UserRole.ADMIN)'}</span></span> : <span style={{ color: CODE.comment }}>{'  // hamma kira oladi'}</span>}{'\n'}
              {'  '}<At>@Post</At>{'()  create(dto) { ... }'}{'\n'}
              {'}'}
            </CodeFile>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={tryHack} disabled={guard}>🕵️ Begona odam: POST /book</button>
              {!guard && <button className="btn" onClick={addGuard}>🛡️ Guard + @Roles qo'shish</button>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            {!tried && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>So'rovni sinang ←</p></div>}
            {tried && !guard && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✗ 201 — har kim kitob qo'shdi!</p><p className="body" style={{ margin: 0, color: T.ink }}>Himoyasiz — begona odam ham do'konga kitob qo'shyapti. Bu xavfli.</p></div>}
            {guard && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ Endi faqat admin</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">AuthGuard</span> tokenni tekshiradi, <span className="mono">@Roles(ADMIN)</span> rolni. Begona odam — 401/403. Bu — Dars 1'dagi "qo'riqchi"!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — AUTH apply: qaysi eshik ochiq/admin =====
const AUTH_ROWS = [
  { id: 'getbook', label: 'GET /book', correct: 'public', hint: 'Kitoblarni hamma ko\'rishi kerak — ochiq (public).' },
  { id: 'featured', label: 'GET /book/featured', correct: 'public', hint: 'Top kitoblar — vitrina, hamma ko\'radi (public).' },
  { id: 'order', label: 'POST /order', correct: 'public', hint: 'Mijoz buyurtma beradi — ro\'yxatdan o\'tmasdan ham (public).' },
  { id: 'postbook', label: 'POST /book', correct: 'admin', hint: 'Kitob qo\'shish — faqat admin.' },
  { id: 'delbook', label: 'DELETE /book/:id', correct: 'admin', hint: 'O\'chirish — faqat admin.' },
  { id: 'getorder', label: 'GET /order', correct: 'admin', hint: 'Buyurtmalarni ko\'rish — faqat admin.' }
];
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [chosen, setChosen] = useState(storedAnswer ? Object.fromEntries(AUTH_ROWS.map(r => [r.id, r.correct])) : {});
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const [sc, setSc] = useState(0);
  const done = AUTH_ROWS.every(r => chosen[r.id] === r.correct);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const set = (row, val) => {
    if (chosen[row.id] === row.correct) return;
    if (val === row.correct) { setChosen(c => ({ ...c, [row.id]: val })); setHint(null); setSc(n => n + 1); }
    else { setShakeId(row.id); setHint({ id: row.id, txt: row.hint }); setTimeout(() => setShakeId(x => (x === row.id ? null : x)), 450); }
  };
  return (
    <Stage eyebrow="Auth · biriktirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Har eshikni belgilang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi eshik <span className="italic" style={{ color: T.accent }}>ochiq</span>, qaysi biri faqat <span className="italic" style={{ color: T.accent }}>admin</span> uchun?</h2></div>
        <Mentor>Har endpoint uchun <span className="mono">@Roles</span> ni to'g'ri tanlang: 🌐 <b style={{ color: T.ink }}>public</b> (hamma) yoki 🔒 <b style={{ color: T.ink }}>admin</b>. O'ylang: bu amalni begona odam qila olsa, xavfli emasmi?</Mentor>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AUTH_ROWS.map(r => {
            const val = chosen[r.id];
            const locked = val === r.correct;
            return (
              <div key={r.id} className={`auth-row ${shakeId === r.id ? 'shake' : ''}`}>
                <span className="mono" style={{ flex: 1, fontSize: 13, color: T.ink }}>{r.label}</span>
                <button className={`auth-btn ${val === 'public' ? (r.correct === 'public' ? 'ok' : 'bad') : ''}`} disabled={locked} onClick={() => set(r, 'public')}>🌐 public</button>
                <button className={`auth-btn ${val === 'admin' ? (r.correct === 'admin' ? 'ok' : 'bad') : ''}`} disabled={locked} onClick={() => set(r, 'admin')}>🔒 admin</button>
              </div>
            );
          })}
        </div>
        {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint.txt}</p></div>}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Ko'rish/buyurtma — ochiq, qo'shish/o'chirish/buyurtmalar ro'yxati — admin. <span className="mono">@Roles('public')</span> tokenni o'tkazib yuboradi, qolgani himoyalangan.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 (auth) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Oddiy mijoz (admin emas) POST /book qilsa nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mijoz <span className="mono">POST /book</span> qilsa <span className="italic" style={{ color: T.accent }}>nima</span> bo'ladi?</h2></>}
    options={['401/403 — qo\'riqchi rad etadi', '201 — kitob baribir qo\'shiladi', '200 — qo\'shiladi, lekin yashirin', '500 — server xato berib o\'chadi']} correctIdx={0}
    explainCorrect="To'g'ri! `@Roles(UserRole.ADMIN)` tufayli qo'riqchi mijozni rad etadi — 403. Token umuman bo'lmasa — 401. Faqat admin kitob qo'sha oladi."
    explainWrong={{
      1: "Qo'shilmaydi — bu eshik faqat admin uchun. Mijoz 403 oladi.",
      2: "Yashirin ham qo'shilmaydi — qo'riqchi so'rovni butunlay to'xtatadi.",
      3: "Server o'chmaydi — qo'riqchi toza javob qaytaradi: 401 yoki 403.",
      default: "Mijoz admin eshigiga kelsa — qo'riqchi rad etadi (401/403)."
    }} />
);

// ===== SCREEN 9 — 🏷️ BEAT 2: YORLIQ (@ManyToOne uchun hayotiy abrazets) =====
// Yorliq KITOB MUQOVASIDA paydo bo'ladi -> shuning uchun @ManyToOne book.entity.ts da yoziladi.
const SHELVES = [
  { id: 'det', ic: '📗', t: 'Detektiv' },
  { id: 'ilm', ic: '📘', t: 'Ilmiy' },
  { id: 'bol', ic: '📙', t: 'Bolalar' }
];
const SH_BOOKS = [
  { id: 'k1', t: 'Sherlok Holms', a: 'Doyl', cat: 'det', hint: "Sherlok Holms — tergov va jumboq. Bu detektiv rastasi." },
  { id: 'k2', t: 'Sharqiy ekspress qotilligi', a: 'Kristi', cat: 'det', hint: "Kristi romani — tergov. Detektiv rastasiga." },
  { id: 'k3', t: 'Koinot qisqacha tarixi', a: 'Xoking', cat: 'ilm', hint: "Xoking — fizika va koinot. Bu ilmiy rasta." },
  { id: 'k4', t: 'Turlar kelib chiqishi', a: 'Darvin', cat: 'ilm', hint: "Darvin — tabiat ilmi. Ilmiy rastaga." },
  { id: 'k5', t: 'Kichkina shahzoda', a: 'Sent-Ekzyuperi', cat: 'bol', hint: "Bu — bolalar uchun ertak-qissa." },
  { id: 'k6', t: 'Alisa mo\'jizalar mamlakatida', a: 'Kerroll', cat: 'bol', hint: "Bolalar ertagi — bolalar rastasiga." }
];
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => storedAnswer ? Object.fromEntries(SH_BOOKS.map(b => [b.id, b.cat])) : {});
  const [sel, setSel] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [note, setNote] = useState(null);
  const [lit, setLit] = useState(null);
  const [over, setOver] = useState(null);     // sudrash paytida ustida turgan rasta
  const [caught, setCaught] = useState(null); // rasta kitobni "ushlab oldi" — pop
  const [sc, setSc] = useState(0);
  const shelfRefs = useRef({});
  const nPlaced = Object.keys(placed).length;
  const done = nPlaced >= SH_BOOKS.length;
  const shown = nPlaced > 0;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const shakeIt = (id) => { setShakeId(id); setTimeout(() => setShakeId(x => (x === id ? null : x)), 450); };
  const busyNote = (b) => {
    const sh = SHELVES.find(s => s.id === placed[b.id]);
    setNote({ k: 'busy', txt: `Bu kitobda allaqachon yorliq bor: "${sh.t}". Bitta kitob — bitta yorliq. Ikkinchisini taqib bo'lmaydi.` });
    setSc(n => n + 1);
  };
  // yorliq taqildi — kitob muqovasida "muhrlanadi" (bk-stamp) + rasta ushlab oladi (sh-catch)
  const drop = (b, sid) => {
    const sh = SHELVES.find(s => s.id === sid);
    setPlaced(p => ({ ...p, [b.id]: sid }));
    setSel(null);
    setCaught(sid); setTimeout(() => setCaught(x => (x === sid ? null : x)), 430);
    setNote({ k: 'ok', txt: `Yorliq kitob MUQOVASIDA paydo bo'ldi: category: ${sh.t}. Rastada emas — kitobda!` });
    setSc(n => n + 1);
  };
  const tapBook = (b) => {
    if (placed[b.id]) { setSel(null); setLit(null); shakeIt(b.id); busyNote(b); return; }
    setSel(b.id); setLit(null); setNote(null);
  };
  const tapShelf = (s) => {
    if (!sel) {
      if (!done) { setNote({ k: 'pick', txt: 'Avval kitobni tanlang ←' }); return; }
      setLit(x => (x === s.id ? null : s.id));
      setNote({ k: 'rel', txt: `Rastani bosdingiz — "${s.t}" yorlig'i taqilgan hamma kitob yondi.` });
      setSc(n => n + 1); return;
    }
    const b = SH_BOOKS.find(x => x.id === sel);
    if (b.cat !== s.id) { shakeIt(s.id); setNote({ k: 'wrong', txt: b.hint }); setSc(n => n + 1); return; }
    drop(b, s.id);
  };
  // 🖐️ SUDRASH — asl kitob elementi DOM transform bilan suriladi (state emas → pirillamaydi;
  // `position:fixed` klon YO'Q → ekran pastida chiqmaydi). Pointer events: sichqoncha ham, barmoq ham.
  // Tap ham ishlaydi: qimirlamasa (5px dan kam) — eski "bosib tanlash" oqimi.
  const down = (ev, b) => {
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    const el = ev.currentTarget;
    const sx = ev.clientX, sy = ev.clientY;
    let moved = false, hov = null;
    el.style.transition = 'none'; el.style.zIndex = '30'; el.style.willChange = 'transform';
    const clear = () => { el.style.transition = ''; el.style.transform = ''; el.style.zIndex = ''; el.style.willChange = ''; el.classList.remove('drag'); };
    const snapBack = (ms) => { el.classList.remove('drag'); el.style.transition = `transform ${ms}ms cubic-bezier(.34,1.4,.4,1)`; el.style.transform = ''; setTimeout(clear, ms + 30); };
    const hit = (x, y) => {
      let h = null;
      SHELVES.forEach(s => {
        const n = shelfRefs.current[s.id]; if (!n) return;
        const r = n.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) h = s.id;
      });
      return h;
    };
    const mv = (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 5) { moved = true; el.classList.add('drag'); if (!placed[b.id]) { setSel(b.id); setLit(null); setNote(null); } }
      if (!moved) return;
      el.style.transform = `translate(${dx}px,${dy}px) scale(1.06) rotate(-2deg)`;
      const t = hit(e.clientX, e.clientY);
      if (t !== hov) { hov = t; setOver(t); }
    };
    const up = (e) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      setOver(null);
      if (!moved) { clear(); tapBook(b); return; }                                            // sudramadi → tap
      const t = hit(e.clientX, e.clientY);
      if (placed[b.id]) { snapBack(300); busyNote(b); setTimeout(() => shakeIt(b.id), 320); return; } // ikkinchi yorliq → qaytib ketadi
      if (!t) { snapBack(300); setSel(null); return; }                                        // bo'sh joy → qaytadi
      if (t !== b.cat) { snapBack(300); shakeIt(t); setNote({ k: 'wrong', txt: b.hint }); setSc(n => n + 1); return; } // xato rasta → qaytadi
      snapBack(200); drop(b, t);                                                              // to'g'ri rasta → yorliq muqovada
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
  return (
    <Stage eyebrow="Yangi · Yorliq" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `Yorliqlarni taqing (${nPlaced}/6)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har kitobning muqovasida bitta <span className="italic" style={{ color: T.accent }}>yorliq</span> bor.</h2></div>
        <Mentor>Ko'p kitob bitta yorliqni taqishi mumkin — lekin <b style={{ color: T.ink }}>bitta kitob ikkita yorliq taqa olmaydi</b>. Kitobni bosing, so'ng rastasini bosing. Menyuda ham shunday: har taomda bitta yorliq — "Salatlar".</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">6 kitob — yorliqsiz</p>
            <div className="bk-grid">
              {SH_BOOKS.map(b => {
                const at = placed[b.id];
                const sh = at ? SHELVES.find(s => s.id === at) : null;
                const isLit = lit && at === lit;
                return (
                  <button key={b.id} className={`bk ${sel === b.id ? 'sel' : ''} ${at ? 'done' : ''} ${isLit ? 'lit' : ''} ${shakeId === b.id ? 'shake' : ''} ${!at && !sel ? 'tap-hint' : ''}`} onPointerDown={(e) => down(e, b)}>
                    <span className="bk-t">{b.t}</span>
                    <span className="bk-a">{b.a}</span>
                    {sh && <span className="bk-tag">category: {sh.t}</span>}
                  </button>
                );
              })}
            </div>
            <CodeFile name="book.entity.ts" minH={100}>
              <At>@Entity</At>{"('books')"}{'\n'}
              <Jx>export class</Jx>{' BookEntity '}<Jx>extends</Jx>{' BaseEntity {'}{'\n'}
              {'  '}<At>@Column</At>{'()  title: '}<St>string</St>{';'}{'\n'}
              {shown
                ? <><span className="el-in" style={{ color: CODE.attr }}>{'  @ManyToOne'}<span style={{ color: CODE.text }}>{'(() => CategoryEntity)'}</span></span>{'\n'}<span className="el-in" style={{ color: CODE.text }}>{'  category: CategoryEntity;'}</span>{'\n'}</>
                : <><Cm>{"  // yorliq hali yo'q"}</Cm>{'\n'}</>}
              {'}'}
            </CodeFile>
          </Col>
          <Col>
            <p className="flow-label">3 rasta — uch xil yorliq</p>
            {SHELVES.map(s => {
              const mine = SH_BOOKS.filter(b => placed[b.id] === s.id);
              return (
                <button key={s.id} ref={el => (shelfRefs.current[s.id] = el)} className={`sh ${lit === s.id ? 'on' : ''} ${over === s.id ? 'over' : ''} ${caught === s.id ? 'catch' : ''} ${shakeId === s.id ? 'shake' : ''}`} onClick={() => tapShelf(s)}>
                  <span className="sh-h">{s.ic} {s.t}<span className="sh-n">{mine.length}/2</span></span>
                  {mine.length > 0 && <span className="sh-b">{mine.map(b => b.t).join(' · ')}</span>}
                </button>
              );
            })}
            {note && <div className={`${note.k === 'ok' || note.k === 'rel' ? 'frame-success' : note.k === 'pick' ? 'frame-wait' : 'frame-warn'} fade-step`}><p className="body" style={{ margin: 0, color: T.ink }}>{note.txt}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yorliq <b>kitobda</b> saqlanadi — rastada emas. Shuning uchun <span className="mono">@ManyToOne</span> aynan <span className="mono">book.entity.ts</span> ichida yoziladi, <span className="mono">category.entity.ts</span> da emas. Ko'p kitob → bitta yorliq.</p></div>}
            {done && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Rastani bosing — o'sha yorliq taqilgan hamma kitob yonadi. Kodda bu: <span className="mono">findAll({'{ relations: { category: true } }'})</span> — kitob bilan birga yorlig'i ham qaytadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — Book entity yig'ish (PickLines) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const candidates = [
    { id: 'title', correct: true, label: '@Column()  title: string;', node: <><At>@Column</At>{'()  title: '}<St>string</St>{';'}</> },
    { id: 'author', correct: true, label: '@Column()  author: string;', node: <><At>@Column</At>{'()  author: '}<St>string</St>{';'}</> },
    { id: 'price', correct: true, label: '@Column()  price: number;', node: <><At>@Column</At>{'()  price: '}<St>number</St>{';'}</> },
    { id: 'feat', correct: true, label: '@Column({ default: false })  is_featured: boolean;', node: <><At>@Column</At>{'({ default: '}<Jx>false</Jx>{' })  is_featured: '}<St>boolean</St>{';'}</> },
    { id: 'rel', correct: true, label: '@ManyToOne(() => CategoryEntity)  category: CategoryEntity;', node: <><At>@ManyToOne</At>{'(() => CategoryEntity)  category;'}</> },
    { id: 'isstring', correct: false, label: '@IsString()  title: string;', why: "Bu DTO qatori (validatsiya). Entity'da @Column bo'ladi, @IsString emas." },
    { id: 'roles', correct: false, label: '@Roles(UserRole.ADMIN)', why: "Bu controller qatori (himoya). Entity jadval shaklini belgilaydi, ruxsatni emas." }
  ];
  return (
    <Stage eyebrow="Book · Entity" screen={screen} scrollSignal={done ? 1 : 0} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Faylni yig\'ing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kitob jadvalini yig'ing — qaysi qator <span className="italic" style={{ color: T.accent }}>Entity'ga</span> tegishli?</h2></div>
        <Mentor>Agent xato qilmasin — siz Book entity'ni tekshirib yig'asiz. Ustunlar + bog'lanish (<span className="mono">@ManyToOne</span>) Entity'da. O'ngdagi begona qatorlar boshqa qatlamdan — faqat to'g'rilarini tanlang.</Mentor>
        <PickLines
          fileName="src/core/entity/book.entity.ts"
          scaffoldTop={<><At>@Entity</At>{"('books')"}{'\n'}<Jx>export class</Jx>{' BookEntity '}<Jx>extends</Jx>{' BaseEntity {'}</>}
          scaffoldBottom={<>{'}'}</>}
          candidates={candidates}
          agent={"book.entity.ts yoz: title, author, price, is_featured (default false) ustunlari + @ManyToOne bilan Category bog'lanishi."}
          instruction="book.entity.ts ga qaysi qatorlar tegishli?"
          completedInit={!!storedAnswer}
          onComplete={() => { setDone(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }}
        />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Book entity tayyor — ustunlar + Category bog'lanishi bilan. Endi "Top kitoblar" bo'limini qo'shamiz.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — FEATURED endpoint =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Book · Top kitoblar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Endpointni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Top kitoblar" bo'limi — yangi metod <span className="italic" style={{ color: T.accent }}>yozamizmi</span>?</h2></div>
        <Mentor>Bosh sahifada faqat <span className="mono">is_featured: true</span> kitoblar chiqsin. Yangi CRUD yozmaymiz — controller'ga bitta maxsus eshik qo'shamiz va <b style={{ color: T.ink }}>BaseService'ning findAll</b>'iga shart beramiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="book.controller.ts" minH={120}>
              <At>@Roles</At>{"('public')"}{'\n'}
              <At>@Get</At>{"('featured')"}{'\n'}
              {'featured() {'}{'\n'}
              {show
                ? <span className="el-in" style={{ color: CODE.text }}>{'  return this.bookService.findAll('}{'\n    { where: { is_featured: '}<span style={{ color: CODE.tag }}>true</span>{' } });'}</span>
                : <Cm>{'  // top kitoblarni qaytarish...'}</Cm>}{'\n'}
              {'}'}
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : '⭐ findAll bilan to\'ldirish'}</button>
            <AgentCard>BookController'ga public GET /book/featured endpoint qo'sh: findAll({'{ where: { is_featured: true } }'}) qaytarsin.</AgentCard>
          </Col>
          <Col>
            <p className="flow-label">GET /book/featured</p>
            {!show
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Endpointni to'ldiring ←</p></div>
              : <div className="frame fade-step"><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12, lineHeight: 1.7 }}>[<br />&nbsp;&nbsp;{'{ title: "Sherlok Holms", is_featured: true }'},<br />&nbsp;&nbsp;{'{ title: "Hobbit", is_featured: true }'}<br />]</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Maxsus endpoint — lekin yangi CRUD kodi yo'q! <span className="mono">findAll</span> BaseService'dan, siz faqat <span className="mono">where</span> shartini berdingiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 3 (featured / bog'lanish) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Top kitoblarni (is_featured) qaytaruvchi endpointni qanday yozamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Top kitoblarni <span className="italic" style={{ color: T.accent }}>qanday</span> qaytaramiz?</h2></>}
    options={['Yangi `findFeatured` metodini yozib', 'Bazaga to\'g\'ridan-to\'g\'ri SQL yozib', 'Hammasini olib, frontend\'da filtrlab', 'Tayyor `findAll` ga `where` berib']} correctIdx={3}
    explainCorrect="To'g'ri! Tayyor `findAll` shart qabul qiladi: `findAll({ where: { is_featured: true } })`. Yangi metod yozmaysiz — faqat shartni berasiz."
    explainWrong={{
      0: "Yangi metod yozish shart emas — tayyor `findAll` allaqachon `where` shartini qabul qiladi.",
      1: "Xom SQL kerak emas — buni `findAll` va `where` hal qiladi.",
      2: "Frontend'da filtrlash sekin: server barcha kitobni behuda yuboradi. Shartni serverda bering.",
      default: "Top kitoblar = `findAll` ga `where` shartini berish."
    }} />
);

// ===== SCREEN 13 — Order: YO'NALTIRUVCHI + bog'lanish =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FILES = [{ f: 'order.entity.ts', d: 'customer_name, quantity + @ManyToOne Book' }, { f: 'create/update-order.dto.ts', d: 'bookId, quantity qoidalari' }, { f: 'order.service.ts', d: 'BaseService' }, { f: 'order.controller.ts', d: 'POST public, GET admin' }, { f: 'order.module.ts → AppModule', d: 'ulash' }];
  const gen = useFileGen(FILES.length, storedAnswer);
  const [sc, setSc] = useState(0);
  const done = gen.done;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const run = () => { gen.run(); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Order · yo'naltirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Playbookni yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi resurs — <span className="italic" style={{ color: T.accent }}>Buyurtma</span>. Qaysi kitobga bog'lanadi?</h2></div>
        <Mentor>Order <span className="mono">@ManyToOne</span> bilan Book'ga bog'lanadi (har buyurtma — bitta kitob). Buyurtma berish — <b style={{ color: T.ink }}>public</b> (mijoz), ko'rish — admin. Playbookni agentga yuboring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="prompt-box fade-up delay-1"><span className="agent-lbl">💬 Agentga playbook</span><p className="agent-msg" style={{ marginBottom: 0 }}>"Order resursini qo'sh: Entity (customer_name, quantity + @ManyToOne Book) → DTO (bookId, quantity) → BaseService service → controller (POST public, GET admin) → module va AppModule'ga ula."</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={gen.running || done} onClick={run}>{done ? '✓ Yozildi' : (gen.running ? '⏳ Agent yozyapti…' : '▶ Playbookni yuborish')}</button>
          </Col>
          <Col>
            <p className="flow-label">Agent yaratayotgan fayllar</p>
            <FileGen files={FILES} running={gen.running} n={gen.n} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI Order'ni yozdi. Lekin... mijoz buyurtma bera olmayapti! Keyingi ekranda tekshiruvchi bo'lib sababini topamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — 🚪 BEAT 3: ESHIK SINOVI (dalil avval, kod keyin — marker/tooltip YO'Q) =====
const DOOR_ROLES = [{ id: 'guest', ic: '🧍', t: 'Mijoz' }, { id: 'admin', ic: '🔑', t: 'Admin' }];
const DOORS = [
  { id: 'getbook',   m: 'GET',  p: '/book',   guest: '200', admin: '200', want: 'open' },
  { id: 'postorder', m: 'POST', p: '/order',  guest: '403', admin: '201', want: 'open' },
  { id: 'getorder',  m: 'GET',  p: '/order',  guest: '403', admin: '200', want: 'admin' }
];
const BAD_LINE = 'l2';
const OC_LINES = [
  { id: 'l1', why: "Bu qator faqat manzilni belgilaydi (/order). Uni olib tashlasak ham mijoz baribir 403 oladi — demak muammo bunda emas." },
  { id: 'l2', why: '' },
  { id: 'l3', why: "Bu qator buyurtmani qabul qiladi. U bo'lmasa 404 chiqardi, 403 emas — demak muammo bunda emas." },
  { id: 'l4', why: "Bu qator buyurtmalar RO'YXATI uchun — uni admin ko'rishi to'g'ri. Uni o'zgartirsak ham mijoz POST'da baribir 403 oladi." },
  { id: 'l5', why: "Bu — yopiluvchi qavs. Ruxsatga aloqasi yo'q." }
];
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [tried, setTried] = useState(() => storedAnswer ? new Set(DOORS.flatMap(d => ['guest:' + d.id, 'admin:' + d.id])) : new Set());
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [why, setWhy] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [sc, setSc] = useState(0);
  const evidence = DOORS.every(d => tried.has('guest:' + d.id));
  const done = fixed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const knock = (roleId, d) => {
    const k = roleId + ':' + d.id;
    if (tried.has(k)) return;
    setTried(prev => { const s = new Set(prev); s.add(k); return s; });
    setSc(n => n + 1);
  };
  const tapLine = (ln) => {
    if (!evidence || found) return;
    if (ln.id === BAD_LINE) { setFound(true); setWhy(null); setSc(n => n + 1); return; }
    setShakeId(ln.id); setWhy(ln.why); setSc(n => n + 1);
    setTimeout(() => setShakeId(x => (x === ln.id ? null : x)), 450);
  };
  const fix = () => { setFixed(true); setSc(n => n + 1); };
  const cellVal = (roleId, d) => (roleId === 'guest' ? (fixed && d.id === 'postorder' ? '201' : d.guest) : d.admin);
  const cellBad = (roleId, d) => roleId === 'guest' && d.want === 'open' && cellVal(roleId, d) === '403';
  return (
    <Stage eyebrow="Debugging · mustaqil" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : (evidence ? 'Xato qatorni toping' : 'Eshiklarni sinang'))} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Do'kon ochildi — lekin <span className="italic" style={{ color: T.accent }}>bironta buyurtma kelmayapti</span>.</h2></div>
        <Mentor>Sabab aytilmaydi — <b style={{ color: T.ink }}>o'zingiz topasiz</b>. Avval mijoz bo'lib, keyin admin bo'lib eshiklarni taqillatib ko'ring: qaysi eshik kimga ochilyapti? Dalil yig'ilgach, kodni ochamiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Eshik sinovi — ikki rolda taqillatib ko'ring</p>
            <div className="dr-tbl fade-up delay-1">
              <div className="dr-head">
                <span className="dr-ep">Eshik</span>
                {DOOR_ROLES.map(r => <span key={r.id} className="dr-hc">{r.ic} {r.t}</span>)}
              </div>
              {DOORS.map(d => (
                <div key={d.id} className="dr-row">
                  <span className="dr-ep">{d.m} {d.p}</span>
                  {DOOR_ROLES.map(r => {
                    const k = r.id + ':' + d.id;
                    const on = tried.has(k);
                    const bad = on && cellBad(r.id, d);
                    const rej = on && /^4/.test(String(cellVal(r.id, d))); // 401/403 — qo'riqchi ORQAGA ITARADI (harakat bilan ko'rinadi)
                    return (
                      <button key={r.id} className={`dr-cell ${on ? (bad ? 'bad' : 'ok') : ''} ${rej ? 'rej' : ''} ${on ? '' : 'tap-hint'}`} disabled={on} onClick={() => knock(r.id, d)}>
                        {on ? <>{r.ic} {cellVal(r.id, d)}{bad ? ' ❗' : ''}</> : <>{r.ic} sinash</>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {evidence && !found && <div className="frame-wait fade-step"><p className="note-h" style={{ color: T.blue }}>🔎 Dalil yig'ildi</p><p className="body" style={{ margin: 0, color: T.ink }}>Dalil: mijoz <span className="mono">POST /order</span> da <b>403</b> olyapti — bu eshik ochiq bo'lishi kerak edi. Admin esa 201 oladi. Demak muammo — <b>ruxsatda</b>. Endi kodni oching →</p></div>}
          </Col>
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">OrderController tayyor!</span></div>
              <div className="ai-code" style={{ opacity: evidence ? 1 : 0.45 }}>
                <div className="ai-code-h"><span className="bb-dots"><i /><i /><i /></span><span className="ai-code-t">order.controller.ts</span></div>
                <div className={`ai-line ${shakeId === 'l1' ? 'shake' : ''}`} onClick={() => tapLine(OC_LINES[0])}><span style={{ color: CODE.attr }}>@Controller</span>{"('order') {"}</div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''} ${shakeId === 'l2' ? 'shake' : ''}`} onClick={() => tapLine(OC_LINES[1])}><span style={{ color: CODE.attr }}>@Roles</span>{fixed ? "('public')" : '(UserRole.ADMIN)'}</div>
                <div className={`ai-line ${shakeId === 'l3' ? 'shake' : ''}`} onClick={() => tapLine(OC_LINES[2])}><span style={{ color: CODE.attr }}>@Post</span>{'()  create(@Body() dto) { ... }'}</div>
                <div className={`ai-line ${shakeId === 'l4' ? 'shake' : ''}`} onClick={() => tapLine(OC_LINES[3])}><span style={{ color: CODE.attr }}>@Roles</span>{'(UserRole.ADMIN)  '}<span style={{ color: CODE.attr }}>@Get</span>{'()  findAll()'}</div>
                <div className={`ai-line ${shakeId === 'l5' ? 'shake' : ''}`} onClick={() => tapLine(OC_LINES[4])}>{'}'}</div>
              </div>
              {!evidence && <p className="ai-prompt">Avval dalil yig'ing — uch eshikni mijoz sifatida sinang ←</p>}
              {evidence && !found && <p className="ai-prompt">Qaysi qator mijozni to'sib qo'ygan? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 POST'ni @Roles('public') ga o'zgartirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — buyurtma endi ochiq!</p>}
            </div>
            {why && !found && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>{why}</p></div>}
            {found && !fixed && <div className="frame-success fade-step"><p className="note-h" style={{ color: T.success }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><b>Qo'riqchiga noto'g'ri ro'yxat berilgan</b> — u sizning MIJOZINGIZNI do'koningizga kiritmayapti. To'g'risi: <span className="mono">@Roles('public')</span>. Chap tugma bilan tuzating →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🔍</div><p className="ta-h">Dalil bilan topdingiz!</p><p className="ta-sub">Mijoz endi buyurtma bera oladi — 201</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — TEST 4 (debug) =====
const Screen15 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="POST /order'ga xato bilan @Roles(ADMIN) qo'yilgan. To'g'ri tuzatish qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mijoz buyurtma berolsin desak, qatorni <span className="italic" style={{ color: T.accent }}>qanday</span> tuzatamiz?</h2></>}
    options={["Qo'riqchini butunlay olib tashlaymiz", "`@Roles('public')` ga o'zgartiramiz", 'Har bir mijozni admin qilamiz', "Tugmani frontend'da yashiramiz"]} correctIdx={1}
    explainCorrect="To'g'ri! `POST /order` hamma uchun ochiq bo'lishi kerak — `@Roles('public')`. Qolgan eshiklar (`GET /order`) admin'da qoladi. Faqat shu qator tuzatiladi."
    explainWrong={{
      0: "Qo'riqchini olib tashlasak, admin eshiklari ham ochilib qoladi. Faqat shu qatorni public qilamiz.",
      2: "Har mijozni admin qilish juda xavfli — u holda ular kitob ham qo'sha oladi.",
      3: "Frontend himoya emas — server baribir 403 beradi. Ruxsat server tomonda tuzatiladi.",
      default: "To'g'ri tuzatish — `POST /order` ni `@Roles('public')` qilish."
    }} />
);

// ===== SCREEN 16 — INTEGRATION: to'liq stsenariy =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? SHOP_FLOW.length : -1);
  const [sc, setSc] = useState(0);
  const done = step >= SHOP_FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const adv = () => { setStep(s => Math.min(s + 1, SHOP_FLOW.length - 1)); setSc(n => n + 1); };
  const cur = step >= 0 ? SHOP_FLOW[Math.min(step, SHOP_FLOW.length - 1)] : null;
  return (
    <Stage eyebrow="Integratsiya · stsenariy" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Stsenariyni kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasi birga: bitta haqiqiy <span className="italic" style={{ color: T.accent }}>xarid</span> qanday kechadi?</h2></div>
        <Mentor>3 resurs, auth va bog'lanish — endi birga ishlaydi. Admin kitob qo'shadi, mijoz top kitoblarni ko'rib buyurtma beradi, admin buyurtmani ko'radi. Tugmani bosib kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="flow-rail fade-up delay-1">
              {SHOP_FLOW.map((f, i) => {
                const lit = step >= i;
                return (
                  <div key={f.k} className="flow-stop" style={{ opacity: lit ? 1 : 0.35 }}>
                    <span className="flow-ico" style={{ background: lit ? T.accent : T.paper, color: lit ? '#fff' : T.ink3 }}>{f.icon}</span>
                    <span className="flow-k" style={{ color: lit ? T.ink : T.ink3 }}>{f.k}</span>
                    {i < SHOP_FLOW.length - 1 && <span className="flow-down" style={{ color: step > i ? T.accent : T.ink3 + '66' }}>↓</span>}
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={adv}>{step < 0 ? '▶ Stsenariyni boshlash' : (done ? '✓ Tugadi' : 'Keyingi qadam →')}</button>
            {cur && <div className="sk-info fade-step" key={step}><p className="note-h"><span style={{ fontSize: 20, marginRight: 6 }}>{cur.icon}</span><span className="mono" style={{ color: T.accent }}>{cur.r}</span> · {cur.k}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.d}</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq do'kon oqimi! Auth, bog'lanish, maxsus endpoint — hammasi birga ishlayapti.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — SWAGGER: to'liq KitobShop tirik =====
const Screen17 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [openId, setOpenId] = useState(storedAnswer ? 'GET/book/featured' : null);
  const [tried, setTried] = useState(storedAnswer ? new Set(['GET/book/featured', 'POST/order']) : new Set());
  const [sc, setSc] = useState(0);
  const done = tried.size >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const toggle = (id) => { setOpenId(o => o === id ? null : id); setSc(n => n + 1); };
  const onTry = (id) => { setTried(prev => { const s = new Set(prev); s.add(id); return s; }); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Natija · Swagger" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `2 endpoint sinang (${tried.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning <span className="italic" style={{ color: T.accent }}>KitobShop</span>'ingiz — to'liq tirik!</h2></div>
        <Mentor>3 resurs, 7 endpoint, auth himoyasi, bog'lanish — hammasi siz boshqarib qurildi. Kamida 2 ta endpointni <b style={{ color: T.ink }}>"Try it out"</b> bilan sinab ko'ring (🔒 admin, 🌐 ochiq).</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <ShopSwagger openId={openId} onToggle={toggle} triedIds={tried} onTry={onTry} />
          </Col>
          <Col>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🌐 Mijoz: kitoblarni ko'radi, top kitoblar, buyurtma. 🔒 Admin: kitob/kategoriya qo'shadi, buyurtmalarni ko'radi.</p></div>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tabriklaymiz! Siz haqiqiy, auth bilan himoyalangan, bog'langan backend qurdingiz — agentni boshqarib.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Endpointni oching → "Try it out" → javobni ko'ring.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 19 — 🔓 BEAT 4: OCHILISH TEKSHIRUVI (5 da'vo — bittasi YOLG'ON) =====
const DOORLIST = [
  { id: 'getbook',   m: 'GET',    p: '/book',      lock: false },
  { id: 'postbook',  m: 'POST',   p: '/book',      lock: true },
  { id: 'postorder', m: 'POST',   p: '/order',     lock: false },
  { id: 'delbook',   m: 'DELETE', p: '/book/:id',  lock: false },
  { id: 'getorder',  m: 'GET',    p: '/order',     lock: true }
];
const CLAIMS = [
  { id: 'q1', ev: 'getbook',   ok: true,  t: "GET /book — hamma ko'radi (public)",        why: "Ro'yxatda: GET /book — 🌐 public. Da'vo to'g'ri, yolg'on emas." },
  { id: 'q2', ev: 'postbook',  ok: true,  t: "POST /book — faqat admin",                  why: "Ro'yxatda: POST /book — 🔒 admin. Da'vo to'g'ri, yolg'on emas." },
  { id: 'q3', ev: 'postorder', ok: true,  t: "POST /order — mijoz o'zi bera oladi",       why: "Ro'yxatda: POST /order — 🌐 public. Da'vo to'g'ri, yolg'on emas." },
  { id: 'q4', ev: 'delbook',   ok: false, t: "DELETE /book — faqat admin",                why: "" },
  { id: 'q5', ev: 'getorder',  ok: true,  t: "GET /order — buyurtmalarni faqat admin ko'radi", why: "Ro'yxatda: GET /order — 🔒 admin. Da'vo to'g'ri, yolg'on emas." }
];
const Screen19 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [checked, setChecked] = useState(() => new Set());
  const [found, setFound] = useState(!!storedAnswer);
  const [guarded, setGuarded] = useState(!!storedAnswer);
  const [why, setWhy] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [sc, setSc] = useState(0);
  const done = found && guarded;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  const tap = (c) => {
    if (found) return;
    if (c.ok) {
      setChecked(prev => { const s = new Set(prev); s.add(c.id); return s; });
      setWhy(c.why); setShakeId(c.id); setSc(n => n + 1);
      setTimeout(() => setShakeId(x => (x === c.id ? null : x)), 450);
      return;
    }
    setFound(true); setWhy(null); setSc(n => n + 1);
  };
  const addGuard = () => { setGuarded(true); setSc(n => n + 1); };
  const lockOf = (d) => d.id === 'delbook' ? guarded : d.lock;
  return (
    <Stage eyebrow="Tekshiruv · ochilish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Yakunga →' : (found ? "Qo'riqchini qo'ying" : "Yolg'on da'voni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ochilishdan oldin: beshta da'vodan bittasi <span className="italic" style={{ color: T.accent }}>yolg'on</span>.</h2></div>
        <Mentor>Bu — tasdiqlash emas, <b style={{ color: T.ink }}>tekshirish</b>. Har da'voni o'ngdagi <b style={{ color: T.ink }}>eshiklar ro'yxati</b> bilan solishtiring: 🌐 ochiq, 🔒 qulflangan. Ro'yxatga mos kelmaydigan da'voni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">5 da'vo — qaysi biri ro'yxatga mos emas?</p>
            {CLAIMS.map((c, i) => (
              <button key={c.id} className={`cl-row ${checked.has(c.id) ? 'checked' : ''} ${found && !c.ok ? 'liar' : ''} ${shakeId === c.id ? 'shake' : ''} ${!found && !checked.has(c.id) ? 'tap-hint' : ''}`} disabled={found} onClick={() => tap(c)}>
                <span className="cl-n">{i + 1}</span>
                <span style={{ flex: 1 }}>{c.t}</span>
                <span>{found && !c.ok ? '❗' : (checked.has(c.id) ? '✓' : '')}</span>
              </button>
            ))}
            {why && !found && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>{why}</p></div>}
            {found && !guarded && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>❗ Yolg'on topildi</p><p className="body" style={{ margin: 0, color: T.ink }}>Ro'yxatda <span className="mono">DELETE /book/:id</span> — 🌐 <b>public</b>. Agent qo'riqchi qo'ymay ketgan: <b>har kim butun do'koningiz kitoblarini o'chirib tashlashi mumkin edi</b>.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Dalil — eshiklar ro'yxati</p>
            <div className="frame" style={{ padding: 13 }}>
              {DOORLIST.map(d => {
                const lk = lockOf(d);
                const hot = found && d.id === 'delbook' && !guarded;
                const fx = guarded && d.id === 'delbook';
                return (
                  <div key={d.id} className={`ev-row ${hot ? 'hot' : ''} ${fx ? 'fixed' : ''}`}>
                    <span className="ev-m">{d.m}</span>
                    <span style={{ flex: 1 }}>{d.p}</span>
                    <span className={`ev-tag ${lk ? 'lock' : 'open'}`}>{lk ? '🔒 admin' : '🌐 public'}</span>
                  </div>
                );
              })}
            </div>
            {found && !guarded && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={addGuard}>🛡️ DELETE /book ga @Roles(ADMIN) qo'yish</button>}
            <div className={`shop-sign ${done ? 'open' : ''}`}>{done ? '🏪 KitobShop — OCHIQ' : '🏪 KitobShop — tekshiruvda'}</div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qo'riqchi ikki xil xato qiladi: <b>o'zinikini kiritmaydi</b> (403) va <b>begonani kiritadi</b> (o'chirib ketadi). Ikkalasini ham <b>siz</b> tekshirasiz — bugun ikkalasini ham topdingiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};


// ===== 🛠️ JONLI PRAKTIKA (reusable checkpoint) — o'quvchi VS Code'da bajaradi, ustoz kuzatadi =====
// signal zonasi: <100 test · 100+ arena · 500+ praktika (to'qnashmaydi).
const PRACTICE_BASE = 500;
const MentorPracticeStats = ({ live, screen }) => {
  const [data, setData] = useState({ players: null, doneIds: new Set() });
  const isMentor = !!(live && live.mode === 'mentor' && live.pin);
  useEffect(() => {
    if (!isMentor) return;
    let on = true, t = null;
    const tick = async () => {
      try {
        const [players, rows] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, PRACTICE_BASE + screen)]);
        if (on) setData({ players, doneIds: new Set(rows.map(r => r.player_id)) }); // JONLI: bajarganlar = screen_idx==500+screen javob yozganlar
      } catch {}
      if (on) t = setTimeout(tick, 3000);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [isMentor, live && live.pin, screen]);
  if (!isMentor) return null;
  const total = data.players ? data.players.length : 0;
  const doers = data.players ? data.players.filter(p => data.doneIds.has(p.id)) : [];
  const waiting = data.players ? data.players.filter(p => !data.doneIds.has(p.id)) : [];
  return (
    <div className="lp-mstats fade-up">
      <div className="card-lbl" style={{ color: T.blue }}>👀 Kim bajardi — <b>{doers.length}</b>/{total}</div>
      {data.players === null ? (
        <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Jonli darsda bajargan o'quvchilar shu yerda chiqadi.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {doers.map(p => <span key={p.id} className="lp-doer done">✓ {p.nickname}</span>)}
            {waiting.slice(0, 10).map(p => <span key={p.id} className="lp-doer">⏳ {p.nickname}</span>)}
            {waiting.length > 10 && <span className="lp-doer">+{waiting.length - 10}</span>}
          </div>
          {total === 0 && <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>O'quvchilar kutilmoqda…</p>}
        </>
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
    // JONLI: o'quvchi «Bajardim» bosganda serverga yoziladi (500+ zonasi) — mentor MentorPracticeStats'da ko'radi
    if (_live && _live.mode === 'student') _live.submitAnswer(PRACTICE_BASE + screen, 'practice', 0, true, 0);
  };
  return (
    <Stage eyebrow="Amaliyot · VS Code" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Avval bajaring'} onClick={onNext} /></>}>
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

// ===== spf — JONLI PRAKTIKA (VS Code: KitobShop backend). Kod PLATFORMAGA KIRITILMAYDI. =====
const ScreenKitobShopPractice = (props) => (
  <ScreenLivePractice {...props}
    title="KitobShop'ni o'z kompyuteringizda oching"
    task="VS Code'da KitobShop backendini quring: Book bo'limi + yorliq bog'lanishi + eshik qo'riqchisi. So'ng Swagger'da mijoz bo'lib ham, admin bo'lib ham kirib ko'ring — ikkala eshik ham kutilganidek ishlayaptimi?"
    checklist={[
      "Agentga TO'LIQ playbook yuboring: `book.entity.ts` (title, author, price, is_featured) -> DTO -> `BaseService` dan service -> controller -> `book.module.ts` va AppModule'ga ulang (kirish taxtasi!)",
      "Yorliqni qo'ying: `book.entity.ts` ga `@ManyToOne(() => CategoryEntity) category` — so'ng serverni qayta ishga tushiring",
      "Qo'riqchini qo'ying: `book.controller.ts` ga `@UseGuards(AuthGuard, RolesGuard)` + POST va DELETE uchun `@Roles(UserRole.ADMIN)`; `GET /book` public qolsin",
      "Swagger (`/api`) da ikki eshikni sinang: `GET /book` = 200 · token'siz `POST /book` = 401/403",
    ]} />
);


// 🃏 FLASHCARD KARTALARI (front=izoh, back=atama, note=metafora/kod) — 🎓 Metodist sayqallaydi
const KITOB_FLASHCARDS = [
  { front: "Bir tur ma'lumot uchun kerak bo'ladigan 5 fayl to'plami", back: "Resurs", note: "Entity · DTO · Service · Controller · Module" },
  { front: "Jadval qanday ustunlardan iboratligini belgilaydigan fayl", back: "Entity", note: "javon chizmasi" },
  { front: "Ma'lumot aslida shu yerda yotadi", back: "PostgreSQL", note: "ombor" },
  { front: "Kiruvchi so'rov qoidalari — qaysi maydon majburiy", back: "DTO", note: "anketa (PartialType = qisman anketa)" },
  { front: "Ishni bajaradigan qatlam", back: "Service", note: "oshpaz / omborchi" },
  { front: "create, findAll, update, remove metodlari tekin keladigan tayyor sinf", back: "BaseService", note: "tayyor retsept kitobi" },
  { front: "So'rovni oladi, javobni qaytaradi", back: "Controller", note: "restoranda ofitsiant — do'konda sotuvchi" },
  { front: "Bu yerga yozilmagan bo'lim = 404", back: "AppModule.imports", note: "restoran kirish taxtasi" },
  { front: "Eshikka qo'riqchi qo'yadigan dekorator", back: "@UseGuards", note: "AuthGuard + RolesGuard" },
  { front: "Qo'riqchining ro'yxati: kim kira oladi", back: "@Roles", note: "🌐 public (hamma) / 🔒 admin" },
  { front: "Ko'p kitob — bitta yorliq. Yorliq kitobda saqlanadi", back: "@ManyToOne", note: "shuning uchun book.entity.ts da yoziladi" },
  { front: "Qo'shildi / qo'riqchi rad etdi / bunday eshik yo'q", back: "201 / 403 / 404", note: "status kodlar" },
];

const ScreenFlashcards = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []); // eslint-disable-line
  return (
    <Stage eyebrow="Takrorlash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={false} label="Yakunlash →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tushunchalarni <span className="italic" style={{ color: T.accent }}>tez takrorlaymiz</span>.</h2></div>
        <Mentor>Darsni yakunlashdan oldin bugun o'rgangan tushunchalarni takrorlaymiz. Har kartada bir izoh — <b style={{ color: T.ink }}>qaysi tushuncha</b> ekanini o'ylang, keyin kartani bosib tekshiring. <b style={{ color: T.ink }}>Bildim</b> yoki <b style={{ color: T.ink }}>Takrorlash</b> bilan baholang.</Mentor>
        <div className="fc-center"><Flashcards cards={KITOB_FLASHCARDS} /></div>
      </div>
    </Stage>
  );
};


// ===== 🃏 FLASHCARDS (reusable, 3D flip) — HARAKAT ✨ Animatsiya, KONTENT 🎓 Metodist =====
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

// ===== 🏅 ACHIEVEMENTS (nishonlar) — faqat REAL bosqichlar uchun (tekin emas) =====
const ACHIEVEMENTS = {
  shelf:   { icon: '📚', name: 'Shelf Master!', desc: "Javon chizmasini toza yig'dingiz — har qator o'z joyida." },
  guard:   { icon: '🛡️', name: 'Guard Up!',    desc: "Qaysi eshik ochiq, qaysi biri qulf — aniq bilasiz." },
  catcher: { icon: '🔍', name: 'Nice Catch!',   desc: "AI qo'yib yuborgan xatoni dalil bilan topdingiz." },
  owner:   { icon: '🏪', name: 'Shop Owner!',   desc: "Ochiq qolgan eshikni topdingiz — KitobShop ochildi!" },
};
// Ekran id -> nishon. FAQAT ma'noli ekran: s8 = scored test · s10 = PickLines · s14 = debug (Beat 3) · s19 = audit (Beat 4).
// ❌ «Bajardim» tugmasiga va passiv «bosdim=to'g'ri» gate'larga BOG'LANMAYDI.
const ACH_TRIGGERS = { s8: 'guard', s10: 'shelf', s14: 'catcher', s19: 'owner' };

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
      <Confetti />
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

// Podium savol yorliqlari (SCORED_IDX indekslariga mos: 5, 8, 12, 15)
const Q_LABELS = { 5: "1 — Tekshiruvchi", 8: "2 — Qo'riqchi (403)", 12: "3 — findAll + where", 15: "4 — Debug (public)" };
// ⚡ Server-baholash javob kaliti (mentor darsni ochganda avto-yuklanadi). SCORED_IDX ekranlari correctIdx'laridan 1:1.
// s5=2 · s8=0 · s12=3 · s15=1 — to'g'ri javob pozitsiyalari aralash (birinchi variantni bosib ball olib bo'lmaydi).
// practice: -1 — sentinel: «Bajardim» signali (500+ zonasi) hech qachon xato deb yozilmasin.
const INLINE_KEYS = { s5: 2, s8: 0, s12: 3, s15: 1, practice: -1 };

// ===== ⚡ CODE STRIKE — CTA kapsulasi + ARENA =====
const QUIZ_MS = 15000;
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#FF5A2C', '#0FA6D6', '#F5A623', '#22A05C'];
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
const QZ_BG_SHAPES = [
  { ch: '@ManyToOne',  l: 5,  t: 10, s: 24, c: 'rgba(120,235,175,0.16)', d: 19, dl: 0 },
  { ch: '@Roles',      l: 84, t: 7,  s: 30, c: 'rgba(80,200,255,0.14)',  d: 23, dl: 1.5 },
  { ch: '@UseGuards',  l: 8,  t: 72, s: 24, c: 'rgba(232,161,58,0.15)',  d: 27, dl: 0.8 },
  { ch: 'findAll',     l: 80, t: 68, s: 30, c: 'rgba(255,110,70,0.14)',  d: 21, dl: 2.2 },
  { ch: 'where',       l: 44, t: 86, s: 28, c: 'rgba(203,173,255,0.14)', d: 25, dl: 1.1 },
  { ch: '201',         l: 62, t: 26, s: 32, c: 'rgba(80,200,255,0.13)',  d: 17, dl: 0.4 },
  { ch: '403',         l: 26, t: 34, s: 32, c: 'rgba(255,110,70,0.14)',  d: 20, dl: 1.9 },
  { ch: 'DTO',         l: 55, t: 5,  s: 30, c: 'rgba(203,173,255,0.12)', d: 22, dl: 0.6 },
  { ch: 'BaseService', l: 89, t: 42, s: 20, c: 'rgba(232,161,58,0.13)',  d: 24, dl: 1.3 },
  { ch: 'Entity',      l: 2,  t: 45, s: 26, c: 'rgba(80,200,255,0.10)',  d: 26, dl: 2.6 },
  { ch: 'Module',      l: 36, t: 58, s: 24, c: 'rgba(255,110,70,0.11)',  d: 28, dl: 0.9 },
  { ch: '404',         l: 70, t: 90, s: 28, c: 'rgba(203,173,255,0.12)', d: 18, dl: 2.0 },
];
// JONLI: mustahkamlash-jang savollari — KitobShop qamrovi. To'g'ri javoblar 4 pozitsiyaga TENG (3/3/3/3), ARALASH tartibda.
// ⚡ Jonli roli: `correct` qiymatlarini tekshiradi/tasdiqlaydi.
const QUIZ_BANK = [
  { q: "Yangi resurs (masalan Book) uchun nechta fayl kerak?", opts: ["2 — faqat entity va controller", "3 — entity, service va module", "5 — har qatlam uchun bitta fayl", "1 — hammasi bitta katta faylga yoziladi"], correct: 2 },
  { q: "Bo'lim AppModule'ga ulanmasa nima bo'ladi?", opts: ["Eshik topilmaydi — 404 qaytadi", "Server umuman ishga tushmay qoladi", "Ma'lumot bazaga saqlanmaydi", "Swagger'da 500 xatosi chiqadi"], correct: 0 },
  { q: "Kitobni kategoriyaga bog'lash uchun qaysi dekorator?", opts: ["`@Column()` (oddiy ustun uchun)", "`@UseGuards()`", "`@Roles()`", "`@ManyToOne()`"], correct: 3 },
  { q: "`@ManyToOne` qaysi faylga yoziladi?", opts: ["`category.entity.ts`", "`book.entity.ts`", "`book.controller.ts`", "`app.module.ts`"], correct: 1 },
  { q: "Token'siz mijoz `POST /book` qilsa, server nima qaytaradi?", opts: ["401/403 — qo'riqchi rad etadi", "201 — kitob baribir qo'shiladi", "404 — bunday eshik topilmadi", "200 — bo'sh ro'yxat qaytadi"], correct: 0 },
  { q: "Eshikka qo'riqchi qo'yadigan dekorator qaysi?", opts: ["`@Injectable()`", "`@Entity()`", "`@UseGuards()`", "`@Controller()`"], correct: 2 },
  { q: "`GET /book` hamma uchun ochiq bo'lsin desak?", opts: ["`@Roles(UserRole.ADMIN)` qo'yamiz", "`@Roles('public')` qo'yamiz", "Qo'riqchini butunlay o'chiramiz", "Frontend'da yashirib qo'yamiz"], correct: 1 },
  { q: "Faqat `is_featured: true` kitoblarni qanday qaytaramiz?", opts: ["Yangi CRUD metodini noldan yozamiz", "Hammasini olib, frontend'da filtrlaymiz", "To'g'ridan-to'g'ri xom SQL yozamiz", "`findAll` ga `where` shartini beramiz"], correct: 3 },
  { q: "`BaseService` ni meros olgan service nimani tekin oladi?", opts: ["Eshik qo'riqchisini (guard)", "Swagger hujjatini", "Bazaga ulanishni", "Tayyor CRUD metodlarini"], correct: 3 },
  { q: "Muvaffaqiyatli POST (qo'shildi) qaysi status kodni qaytaradi?", opts: ["200 OK", "201 Created", "204 No Content", "301 Moved"], correct: 1 },
  { q: "DTO nima uchun kerak?", opts: ["Kiruvchi so'rovning qoidalari", "Jadval ustunlarini belgilaydi", "Bo'limni AppModule'ga ulaydi", "Bazaga ulanish sozlamalarini belgilaydi"], correct: 0 },
  { q: "Kitob bilan birga uning kategoriyasini ham olib kelish uchun `findAll` ga nima beriladi?", opts: ["`order: { id: 'DESC' }`", "`select: { title: true }`", "`relations: { category: true }`", "`where: { is_featured: true, id: 1 }`"], correct: 2 },
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

// Jonli fon: suzuvchi uchqunlar + «web» chiziqlari + DARS MAVZUSIDAGI kod tokenlari (canvas)
function QzFX() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = cv.getContext('2d'); const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, raf = 0;
    const size = () => { W = cv.width = Math.max(1, cv.offsetWidth * DPR); H = cv.height = Math.max(1, cv.offsetHeight * DPR); };
    size(); window.addEventListener('resize', size);
    const TOK = ['@ManyToOne', '@Roles', '@UseGuards', 'findAll', 'where', 'DTO', 'BaseService', '201', '403'];
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

// ===== ⚡ CODE STRIKE ARENA — mustahkamlash-jang (mentor/student/solo). Kahoot uslubi: savol→taymer→reveal→podium. =====
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

  // Taymer — 100ms aniqlikda; vaqt tugasa javob ochiladi.
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
      if (!window.confirm("Test hali yakunlanmadi — yopsangiz o'quvchilar arenada kutib qoladi.\nKeyin «⚡ Davom ettirish» bilan aynan shu joydan qaytishingiz mumkin.\n\nBaribir yopilsinmi?")) return;
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
        // DARS javoblari (<100): livePlayers + liveAnswers(pin) [screen_idx<100] — podium reyting
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
            <div className="frame-wait" style={{ maxWidth: 480 }}><p className="body" style={{ margin: 0 }}>Siz mustaqil rejimdasiz. Jonli darsda bu yerda butun guruh reytingi — 🥇🥈🥉 podium chiqadi.</p></div>
          </div>
        ) : !loaded ? (
          <p className="mono small fade-up" style={{ color: T.ink2 }}>Natijalar yuklanmoqda…</p>
        ) : board.length === 0 ? (
          <div className="frame-wait fade-up"><p className="body" style={{ margin: 0 }}>Bu sessiyaga hali hech kim qo'shilmagan.</p></div>
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

// ===== SCREEN 20 — YAKUN (4.2: ScoreRing + ⚡ CodeStrike CTA + RECAP/uyga vazifa + 🏅 kolleksiya) =====
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
    "3 bog'langan resursli real backend qurdingiz (Category · Book · Order)",
    "Bosh dasturchi sikli: Rejalashtir → Yo'naltir → Tekshir",
    "Eshik va qo'riqchi: @UseGuards + @Roles — 🌐 public (mijoz) vs 🔒 admin",
    "Yorliq: @ManyToOne — ko'p kitob → bitta yorliq (yorliq kitobda saqlanadi)",
    "Kirish taxtasi: AppModule'ga ulanmagan bo'lim = 404",
    "AI yo'l qo'ygan ikki xatoni dalil bilan topdingiz (403 va ochiq qolgan eshik)"
  ];
  const HOMEWORK = [
    { b: "O'z marketplace'ingiz", t: "— elektronika/kiyim do'koni: 3 resursni rejaga soling" },
    { b: 'Playbook', t: "— har resurs uchun AI'ga beradigan aniq promptni yozing (5 qadam + AppModule'ga ulash)" },
    { b: 'Tekshiruv', t: "— har eshikni ikki rolda sinang: mijoz va admin" }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Modulni yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Real backend qurdingiz</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>backend dasturchisi</span>siz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! KitobShop — 3 resurs, qo'riqchi, yorliq va maxsus eshik. Hammasini AI'ni yo'naltirib qurdingiz va o'zingiz tekshirdingiz." : "Yaxshi harakat! Qo'riqchi, yorliq va tekshiruv siklini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className={`qz-cta cs-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <CsWordmark stats={false} liveOn={studentLive} disabled={studentWait} onClick={studentWait ? undefined : openArena} hint={studentWait ? '⏳ Mentorni kuting' : undefined} />
        </div>
        {arena && <QuizArena live={_live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Siz endi istalgan g'oyani backendga aylantira olasiz — agentni boshqarib, har eshikni tekshirib!</p></div>
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


// ============================================================ LESSON ROOT
export default function NestArchPracticeLesson({ lang: langProp, onFinished }) {
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
  // ETALON — 1920px: keng oynada proportsional kattalashadi, <=1920 da z=1
  useEffect(() => {
    const upd = () => { const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920)); document.documentElement.style.setProperty('--lz', String(Math.round(z * 1000) / 1000)); };
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, []);
  // 🃏 Flashcard ekrani jonli darsda (mentor boshqaruvida) o'quvchida ko'rsatilmaydi — o'tkazib yuboriladi
  const FLASH_IDX = SCREEN_META.findIndex(m => m.id === 'sflash');
  const flashHidden = () => live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const next = () => setScreen(s => { let n = Math.min(s + 1, TOTAL_SCREENS - 1); if (n === FLASH_IDX && flashHidden()) n = Math.min(n + 1, TOTAL_SCREENS - 1); return n; });
  const prev = () => setScreen(s => { let n = Math.max(s - 1, 0); if (n === FLASH_IDX && flashHidden()) n = Math.max(n - 1, 0); return n; });
  const recordAnswer = (idx, data) => {
    setAnswers(a => ({ ...a, [idx]: data }));
    const _m = SCREEN_META[idx];
    if (_m && ACH_TRIGGERS[_m.id] && data && data.correct) earn(ACH_TRIGGERS[_m.id]); // 🏅 nishon (faqat REAL solve)
  };
  // Javob kaliti: inline testlar + praktika sentineli + jang savollari (QUIZ_BANK'dan) — mentor ochganda serverga yuklanadi
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const locked = isStudentLive && (screen + 1 > live.mentorScreen);
  useEffect(() => { live.reportScreen(screen); }, [screen, live.mode, live.pin]); // eslint-disable-line
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17, Screen19, ScreenKitobShopPractice, ScreenPodium, ScreenFlashcards, Screen20];
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
        /* 11.6 RANG SEMANTIKASI — bir ma'no, bir rang:
           frame-warn/frame-soft = XATO-OGOHLANTIRISH (qizil) · frame-success = xulosa/muvaffaqiyat (yashil) · frame-wait = neytral DALIL/yo'riq (ko'k) */
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.dangerSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 6px 16px -8px rgba(194,54,43,0.24); }
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

        /* VS CODE EDITOR — oyna-chrome (yassi karta emas) */
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
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

        /* AGENT FILE GENERATION */
        .gen-file { display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 9px; padding: 9px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-size: 12px; transition: all 0.2s; }
        .gen-file.ready { box-shadow: inset 0 0 0 1.5px ${T.success}33, 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .gen-ico { font-weight: 800; min-width: 16px; text-align: center; }
        .gen-file .mono { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .gen-d { font-size: 10px; color: ${T.ink2}; font-weight: 600; margin-left: auto; text-align: right; }

        /* AI DEBUG CARD */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 11px; }
        .ai-row { display: flex; gap: 8px; align-items: flex-start; }
        .ai-badge { background: ${T.nest}; color: #fff; font-family: 'Manrope'; font-weight: 800; font-size: 10px; padding: 4px 8px; border-radius: 6px; flex-shrink: 0; }
        .ai-bubble { background: ${T.bg}; border-radius: 4px 12px 12px 12px; padding: 9px 12px; font-size: 13px; color: ${T.ink}; }
        .ai-code { background: ${CODE.bg}; border-radius: 10px; padding: 10px 11px; display: flex; flex-direction: column; gap: 2px; transition: opacity 0.3s ease; }
        .ai-code-h { display: flex; align-items: center; gap: 9px; margin: -10px -11px 8px; padding: 7px 11px; background: rgba(255,255,255,0.06); border-radius: 10px 10px 0 0; }
        .ai-code-t { font-family: 'JetBrains Mono'; font-size: 10.5px; font-weight: 700; color: ${CODE.punct}; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${CODE.text}; padding: 5px 7px; border-radius: 6px; cursor: pointer; transition: all 0.16s; }
        .ai-line:hover { background: rgba(255,255,255,0.07); }
        .ai-line.bad { background: rgba(194,54,43,0.26); box-shadow: inset 0 0 0 1.5px ${T.danger}; }
        .ai-line.ok { opacity: 0.4; text-decoration: line-through; cursor: default; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; font-style: italic; margin: 0; }
        .takeaway { background: ${T.successSoft}; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 3px; text-align: center; }
        .ta-bulb { font-size: 26px; } .ta-h { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: ${T.ink}; margin: 0; } .ta-sub { font-size: 12px; color: ${T.ink2}; margin: 0; }


        /* AUTH ROW (s7) */
        .auth-row { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 10px; padding: 9px 12px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .auth-btn { font-family: 'Manrope'; font-weight: 700; font-size: 12px; padding: 7px 12px; border-radius: 8px; border: none; background: ${T.bg}; color: ${T.ink2}; cursor: pointer; transition: all 0.16s; }
        .auth-btn:hover:not(:disabled) { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.25); }
        .auth-btn:disabled { cursor: default; }
        .auth-btn.ok { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .auth-btn.bad { background: ${T.accentSoft}; color: ${T.danger}; }

        /* SWAGGER */
        .swg { border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); }
        .swg-top { background: #173647; color: #fff; padding: 10px 13px; font-family: 'Manrope'; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 8px; } .swg-dot { width: 8px; height: 8px; border-radius: 50%; background: #49cc90; } .swg-ver { font-family: 'JetBrains Mono'; font-weight: 400; font-size: 11px; color: #9FB4D8; margin-left: auto; }
        .swg-row { border-bottom: 1px solid #eee; }
        .swg-head { width: 100%; display: flex; align-items: center; gap: 9px; padding: 9px 11px; background: #fff; border: none; cursor: pointer; text-align: left; }
        .swg-head:hover { background: #FBFAF7; }
        .swg-m { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: #fff; padding: 3px 8px; border-radius: 5px; min-width: 52px; text-align: center; }
        .swg-path { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; color: ${T.ink}; }
        .swg-sum { font-size: 11px; color: ${T.ink3}; margin-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .swg-chev { color: ${T.ink3}; font-size: 11px; }
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
        /* === 👆 TAP-HINT — bosilmagan joy "meni bos" deb chaqiradi (11.7) === */
        @keyframes tap-hint-pulse { 0% { box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16), 0 0 0 0 rgba(255,79,40,0.32); } 65%,100% { box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16), 0 0 0 9px rgba(255,79,40,0); } }
        .tap-hint { animation: tap-hint-pulse 2.2s ease-out infinite; }
        .tap-hint:hover { animation-play-state: paused; }
        /* bosilgani ✓ bilan "muhrlanadi" — jonli progress signali */
        @keyframes tap-tick-pop { 0% { transform: scale(0) rotate(-25deg); opacity: 0; } 55% { transform: scale(1.45) rotate(6deg); opacity: 1; } 78% { transform: scale(0.92); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        .vseen.tick { display: inline-block; animation: tap-tick-pop 0.44s cubic-bezier(.34,1.56,.44,1) both; }

        /* === ♿ TINCH VARIANT — har og'ir/takrorlanuvchi harakat bilan BIRGA tug'iladi (keyin emas) === */
        @media (prefers-reduced-motion: reduce) {
          .tap-hint, .ev-row.hot, .shop-sign.open, .mstats-reveal.ready { animation: none !important; }
          .vseen.tick, .bk-tag, .sh.catch, .dr-cell.rej, .dr-cell.ok, .ev-row.fixed, .cl-row.liar, .shake { animation: none !important; }
          .bk.drag, .sh, .bk { transition: none !important; }
          .bk:hover, .sh:hover, .sh.over { transform: none; }
          .fade-up, .fade-step, .el-in { animation-duration: 0.01ms !important; }
        }


        /* === 🧵 MEROS TASMASI (Beat 0) === */
        .lg-rail { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 640px) { .lg-rail { grid-template-columns: 1fr; } }
        .lg-card { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 13px; cursor: pointer; text-align: left; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.18s; }
        .lg-card:hover { transform: translateY(-1px); }
        .lg-card.on { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22); }
        .lg-ic { font-size: 20px; }
        .lg-t { font-family: 'Manrope'; font-weight: 800; font-size: 13px; color: ${T.ink}; }
        .lg-s { font-size: 11px; color: ${T.ink2}; font-weight: 600; }
        .lg-staff { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; opacity: 0.22; transition: opacity 0.35s ease; }
        .lg-staff.lit { opacity: 1; }
        .lg-staff i { font-style: normal; font-family: 'JetBrains Mono'; font-size: 9.5px; font-weight: 600; color: ${T.ink2}; background: ${T.bg}; border-radius: 99px; padding: 2px 7px; }

        /* === 🏷️ YORLIQ — kitoblar va rastalar (Beat 2) === */
        .bk-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        @media (max-width: 640px) { .bk-grid { grid-template-columns: repeat(2, 1fr); } }
        /* BEAT 2 — kitob (muqova + tikuv) va rasta (do'kon peshtaxtasi) */
        /* touch-action:none — barmoq bilan sudraganda sahifa SILJIMAYDI (mobil sudrash shu bilan tiriladi) */
        .bk { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; background: linear-gradient(135deg, ${T.paper} 60%, #FBF8F2); border: none; border-left: 5px solid rgba(${T.shadowBase},0.22); border-radius: 4px 10px 10px 4px; padding: 10px 10px 9px 9px; cursor: grab; text-align: left; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.18); transition: all 0.16s; min-height: 80px; touch-action: none; user-select: none; -webkit-user-select: none; }
        .bk:hover { transform: translateY(-2px); }
        .bk.sel { border-left-color: ${T.accent}; box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.28); }
        .bk.done { background: linear-gradient(135deg, ${T.successSoft} 60%, ${T.paper}); border-left-color: ${T.success}; cursor: pointer; }
        .bk.lit { border-left-color: ${T.success}; box-shadow: inset 0 0 0 2px ${T.success}, 0 8px 22px -6px rgba(31,122,77,0.32); }
        /* qo'lda ko'tarilgan kitob — hover transform o'chadi (inline DOM-transform bilan urishmasin) */
        .bk.drag { cursor: grabbing; transition: none !important; box-shadow: 0 18px 34px -10px rgba(${T.shadowBase},0.34), inset 0 0 0 2px ${T.accent}; }
        .bk.drag:hover { transform: none; }
        .bk-t { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; line-height: 1.25; }
        .bk-a { font-size: 10px; color: ${T.ink3}; font-weight: 600; }
        /* 🏷️ yorliq MUQOVAGA muhrlanadi — darsning eng muhim kadri (ko'zga tashlansin) */
        .bk-tag { font-family: 'JetBrains Mono'; font-size: 9.5px; font-weight: 700; color: ${T.success}; background: ${T.paper}; border-radius: 99px; padding: 2px 7px; margin-top: auto; box-shadow: inset 0 0 0 1px ${T.success}66; animation: bk-stamp 0.52s cubic-bezier(.3,1.25,.4,1) both; }
        @keyframes bk-stamp { 0% { transform: scale(2.2) rotate(-15deg); opacity: 0; } 40% { opacity: 1; } 62% { transform: scale(0.9) rotate(3deg); opacity: 1; } 80% { transform: scale(1.06) rotate(-1deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        .sh { display: flex; flex-direction: column; gap: 5px; background: ${T.paper}; border: none; border-bottom: 5px solid rgba(180,83,9,0.28); border-radius: 12px 12px 5px 5px; padding: 11px 13px 10px; width: 100%; text-align: left; cursor: pointer; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.16s; }
        .sh:hover { transform: translateY(-1px); }
        .sh.on { border-bottom-color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}, 0 8px 20px -6px rgba(31,122,77,0.22); }
        /* kitob ustida turibdi — rasta "og'zini ochadi" */
        .sh.over { transform: translateY(-3px) scale(1.015); border-bottom-color: ${T.accent}; box-shadow: inset 0 0 0 2px ${T.accent}, 0 14px 28px -8px rgba(255,79,40,0.3); }
        /* rasta kitobni ushlab oldi */
        .sh.catch { animation: sh-catch 0.43s cubic-bezier(.34,1.5,.4,1); }
        @keyframes sh-catch { 0% { transform: scale(1); } 34% { transform: scale(1.045) translateY(-3px); } 68% { transform: scale(0.985) translateY(1px); } 100% { transform: scale(1); } }
        .sh-h { display: flex; align-items: center; gap: 7px; font-family: 'Manrope'; font-weight: 800; font-size: 13px; color: ${T.ink}; }
        .sh-n { margin-left: auto; font-family: 'JetBrains Mono'; font-size: 10.5px; color: ${T.ink3}; font-weight: 700; }
        .sh-b { font-family: 'JetBrains Mono'; font-size: 10.5px; color: ${T.ink2}; line-height: 1.5; }

        /* === 🚪 ESHIK SINOVI (Beat 3) === */
        .dr-tbl { display: flex; flex-direction: column; gap: 6px; }
        .dr-head { display: flex; align-items: center; gap: 8px; padding: 0 10px 1px; }
        .dr-head .dr-ep { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink3}; }
        .dr-hc { flex: 0 0 auto; width: 92px; text-align: center; font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.ink2}; }
        .dr-row { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 10px; padding: 8px 10px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .dr-ep { font-family: 'JetBrains Mono'; font-size: 11.5px; font-weight: 700; color: ${T.ink}; flex: 1; min-width: 0; }
        .dr-cell { flex: 0 0 auto; width: 92px; box-sizing: border-box; font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; border: none; border-radius: 8px; padding: 6px 8px; background: ${T.bg}; color: ${T.ink2}; cursor: pointer; transition: all 0.16s; }
        .dr-cell:hover:not(:disabled) { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.25); }
        .dr-cell:disabled { cursor: default; }
        .dr-cell.ok { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}55; }
        .dr-cell.bad { background: ${T.dangerSoft}; color: ${T.danger}; box-shadow: inset 0 0 0 1.5px ${T.danger}66; }
        /* 🚪 401/403 = qo'riqchi eshikdan ORQAGA ITARADI · 200/201 = ichkariga kiritadi (oqibat ko'rinadi, o'qilmaydi) */
        .dr-cell.rej { animation: dr-reject 0.58s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes dr-reject { 0% { transform: translateX(0) scale(1); } 16% { transform: translateX(7px) scale(1.05); } 40% { transform: translateX(-8px) scale(0.96); } 60% { transform: translateX(5px); } 78% { transform: translateX(-3px); } 100% { transform: none; } }
        .dr-cell.ok:not(.rej) { animation: dr-enter 0.42s cubic-bezier(.34,1.5,.4,1) both; }
        @keyframes dr-enter { 0% { transform: scale(0.88); } 55% { transform: scale(1.07); } 100% { transform: scale(1); } }

        /* === 🔓 OCHILISH TEKSHIRUVI (Beat 4) === */
        .cl-row { display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 13px; cursor: pointer; font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); transition: all 0.16s; }
        .cl-row:hover:not(:disabled) { transform: translateY(-1px); }
        .cl-row.checked { background: ${T.successSoft}; color: ${T.success}; }
        .cl-row.liar { background: ${T.dangerSoft}; color: ${T.danger}; box-shadow: inset 0 0 0 1.5px ${T.danger}; animation: cl-liar 0.55s cubic-bezier(.34,1.45,.4,1) both; }
        @keyframes cl-liar { 0% { transform: scale(1); } 30% { transform: scale(1.035) translateX(-2px); } 55% { transform: scale(1.01) translateX(2px); } 100% { transform: scale(1); } }
        .cl-row:disabled { cursor: default; }
        .cl-n { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; color: ${T.ink3}; min-width: 16px; }
        .ev-row { display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono'; font-size: 11px; padding: 7px 9px; border-radius: 8px; background: ${T.bg}; margin-bottom: 5px; transition: all 0.3s ease; }
        /* ochiq qolgan eshik SIGNAL BERADI — jim turmaydi (topilgach to'xtamaydi, qo'riqchi qo'yilguncha) */
        .ev-row.hot { background: ${T.dangerSoft}; box-shadow: inset 0 0 0 1.5px ${T.danger}66; animation: ev-alarm 1.7s ease-in-out infinite; }
        @keyframes ev-alarm { 0%, 62%, 100% { transform: translateX(0); } 68% { transform: translateX(-3px); } 74% { transform: translateX(3px); } 80% { transform: translateX(-2px); } 86% { transform: translateX(1px); } }
        .ev-row.fixed { background: ${T.successSoft}; animation: ev-lock 0.5s cubic-bezier(.34,1.5,.4,1) both; }
        @keyframes ev-lock { 0% { transform: scale(0.97); } 45% { transform: scale(1.025); } 100% { transform: scale(1); } }
        .ev-m { font-weight: 700; color: ${T.ink}; min-width: 58px; }
        /* eshik chipi: 🌐 public — ochiq (neytral-ko'k, XATO EMAS) · 🔒 admin — qulflangan (yashil = himoyalangan) */
        .ev-tag { font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 99px; padding: 3px 9px; white-space: nowrap; }
        .ev-tag.open { background: ${T.blueSoft}; color: ${T.blue}; box-shadow: inset 0 0 0 1px ${T.blue}55; }
        .ev-tag.lock { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1px ${T.success}66; }
        /* BEAT 4 — peshtaxta yozuvi (yopiq: xira taxta · OCHIQ: yashil neon) */
        .shop-sign { display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 14px; padding: 17px 14px; font-family: 'Manrope'; font-weight: 800; font-size: clamp(13px,1.7vw,15px); letter-spacing: 0.1em; text-transform: uppercase; background: ${T.bg}; color: ${T.ink3}; box-shadow: inset 0 0 0 1.5px ${T.ink3}44; transition: all 0.45s ease; }
        .shop-sign.open { background: linear-gradient(160deg, ${T.successSoft}, ${T.paper}); color: ${T.success}; text-shadow: 0 0 14px rgba(31,122,77,0.35); box-shadow: inset 0 0 0 2px ${T.success}, 0 0 34px -6px rgba(31,122,77,0.55), 0 10px 26px -10px rgba(${T.shadowBase},0.3);
          animation: sign-ignite 1.15s ease-out both, sign-hum 3.6s ease-in-out 1.15s infinite; }
        /* neon peshtaxta YONADI: bir-ikki pirillaydi, so'ng barqaror nafas oladi = "KitobShop ochildi" */
        @keyframes sign-ignite { 0% { opacity: 0.45; filter: brightness(0.55) saturate(0.5); transform: scale(0.985); } 10% { opacity: 1; filter: brightness(1.55) saturate(1.1); } 17% { opacity: 0.5; filter: brightness(0.6) saturate(0.6); } 27% { opacity: 1; filter: brightness(1.45); transform: scale(1.012); } 35% { opacity: 0.62; filter: brightness(0.75); } 46% { opacity: 1; filter: brightness(1.3); } 58% { opacity: 0.85; filter: brightness(0.95); transform: scale(1); } 72%, 100% { opacity: 1; filter: none; transform: scale(1); } }
        @keyframes sign-hum { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.11); } }

        /* === 🔤 KOD-ATAMA CHIP (fmtCode) === */
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }


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
        /* «✅ Bajardim» → mentor-gate: tugma MUHRLANADI (pop + yorug'lik supurgisi) — o'quvchi tasdiqni KO'RADI */
        .lp-done-btn.is-done { position: relative; overflow: hidden; background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}66; cursor: default; animation: lp-done-pop 0.44s cubic-bezier(.3,1.35,.5,1); }
        @keyframes lp-done-pop { 0% { transform: scale(1); } 32% { transform: scale(1.05) translateY(-2px); } 60% { transform: scale(0.98); } 100% { transform: scale(1); } }
        .lp-done-btn.is-done::after { content: ''; position: absolute; top: 0; bottom: 0; left: -60%; width: 42%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.85), transparent); transform: skewX(-18deg); animation: lp-sweep 1.05s cubic-bezier(.4,0,.2,1) 0.2s 1 both; }
        @keyframes lp-sweep { to { left: 130%; } }
        @media (prefers-reduced-motion: reduce) { .lp-step.on .lp-check, .lp-done-btn.is-done, .lp-done-btn.is-done::after { animation: none !important; } .lp-done-btn.is-done::after { display: none; } }
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

        /* ===================== ⚡ JONLI QATLAM CSS (ReactIntro etalonidan) ===================== */
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

        /* ===== 📖 QAYTA TUSHUNTIRISH (recap) ===== */
        .rc-open { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.6vw,15px); background: ${T.accent}; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(255,79,40,0.5); transition: all 0.2s; }
        .rc-open:hover { transform: translateY(-1px); box-shadow: 0 12px 26px -6px rgba(255,79,40,0.55); }
        .rc-open.soft { background: ${T.paper}; color: ${T.accent}; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.2); }
        .rc-open-mini { align-self: flex-start; margin-top: 10px; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13px; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 99px; padding: 8px 14px; cursor: pointer; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.2); transition: all 0.2s; }
        .rc-open-mini:hover { transform: translateY(-1px); }
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
        @media (max-width: 560px) {
          .rc-nav { flex-wrap: wrap; justify-content: center; row-gap: 10px; }
          .rc-dots { width: 100%; order: -1; }
          .rc-btn { font-size: 13px; padding: 11px 16px; }
        }

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
        .qz-brand { display: flex; align-items: center; gap: 12px; }
        .qz-brand.sm { gap: 9px; }
        .qz-wm { font-family: 'Manrope'; font-weight: 800; font-size: clamp(28px,5vw,46px); letter-spacing: -0.03em; color: #F2ECFF; line-height: 1; text-shadow: 0 0 22px rgba(150,95,255,0.4); }
        .qz-wm-h { color: #FF6A3D; }
        .qz-logo { font-size: clamp(44px,8vw,72px); line-height: 1; }
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
        @media (max-width: 560px) { .qz-grid { grid-template-columns: 1fr; } .qz-wm { font-size: clamp(24px,7vw,34px); } }
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
        /* 11.8 — .qcode chipi qorong'i arena yuzasida: yorug' fon, oq matn (aks holda ko'rinmaydi) */
        .qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
        .qz-q .qcode { background: rgba(203,173,255,0.18); color: #F2ECFF; }
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


        /* option-wait (jonli test kutish holati) — sekin nafas pulsatsiyasi (natija ochilishini kutmoqda) */
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; animation: ow-breathe 1.9s ease-in-out infinite; }
        @keyframes ow-breathe { 0%,100% { box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3); } 50% { box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 30px -6px rgba(1,154,203,0.5); } }
        @media (prefers-reduced-motion: reduce) { .option-wait { animation: none !important; } }
        /* frame-wait (feedback kutish) */
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }

        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

        /* === 🛠️ JONLI PRAKTIKA — mentor «kim bajardi» chiplari === */
        .lp-doer { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 12px; color: ${T.ink2}; background: rgba(58,53,48,0.07); border-radius: 99px; padding: 4px 11px; white-space: nowrap; }
        .lp-doer.done { color: ${T.success}; background: ${T.successSoft}; }

        /* === ⚡ LIVE BADGE — sekundar UI: kerak bo'lguncha xira (L1 etalon) === */
        .live-badge { opacity: 0.4; transition: opacity 0.25s ease, box-shadow 0.25s ease; }
        .live-badge:hover, .live-badge:focus-within { opacity: 1; box-shadow: 0 8px 24px -6px rgba(58,53,48,0.32) !important; }
        @media (hover: none) { .live-badge { opacity: 0.62; } }
      `}</style>
      <AchCtx.Provider value={earned}>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="KitobShop praktikasi" />
          ) : (
            <>
              <Current screen={screen} storedAnswer={answers[screen]} answers={answers} achievements={earned} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
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
