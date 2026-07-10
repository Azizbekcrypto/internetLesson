import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// 08-DARS — JAVASCRIPT: O'ZGARUVCHILAR (Peremennie) — PLATFORM STANDARD v16
// Mavzu: o'zgaruvchi nima (nomlangan quti), qiymat berish (=),
//        let / const / var, ma'lumot turlari (string, number, boolean),
//        o'z qo'li bilan birinchi o'zgaruvchilarni yozish.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  line: '#E9E6DF', shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8', kw: '#C792EA', num: '#F78C6C', vr: '#82AAFF', bool: '#FFCB6B' };


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
const MentorCtx = createContext(null);
const AchCtx = createContext(null); // 🏅 olingan nishonlar (Set) — Stage hisoblagichi uchun
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

const LESSON_META = { lessonId: 'js-vars-01-v18', lessonTitle: { uz: "JavaScript — O'zgaruvchilar", ru: 'JavaScript — Переменные' } };
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
  { id: 'sflash', type: 'flashcards', template: 'custom', scored: false, scope: null },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

// JS kod ranglari
const Kw = ({ children }) => <span style={{ color: CODE.kw }}>{children}</span>;
const Vr = ({ children }) => <span style={{ color: CODE.vr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Nm = ({ children }) => <span style={{ color: CODE.num }}>{children}</span>;
const Op = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;

// O'zgaruvchi = nomlangan quti (asosiy vizual metafora)
const VarBox = ({ name, value, valColor = T.accent, small, pulse }) => (
  <div className="var-box" key={value}>
    <div className="var-name">📦 {name}</div>
    <div className={`var-val ${pulse ? 'drop-in' : ''}`} style={{ color: valColor, fontSize: small ? 'clamp(15px,2.4vw,19px)' : 'clamp(18px,3vw,24px)' }}>{value}</div>
  </div>
);

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

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 60; // InternetLesson layout standarti: 1100px + 60px
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
  4: {
    title: "O'zgaruvchi nima?",
    cards: [
      { ic: "📦", h: "O'zgaruvchi — nomlangan quti",
        body: <>O'zgaruvchi — bu <b>qiymat saqlaydigan nomlangan «quti»</b>. Ichiga biror narsa solamiz, qutiga <b>nom</b> beramiz, keyin shu nom bilan chaqiramiz.</>,
        vis: <RcFlow items={["📦 quti", "🏷️ nom: yosh", "🔢 ichida: 14"]} />,
        ask: "Uyda qanday «nomlangan qutilar» bor — masalan «tuz» yozilgan idish?" },
      { ic: "🏷️", h: "Nom bo'lsa — topa olamiz",
        body: <>Qutiga <b>nom</b> berganimiz uchun keyin uni <b>oson topamiz</b>. «yosh» desak — ichidagi 14 chiqadi. Nomsiz quti — qidirib topib bo'lmaydi.</>,
        vis: <RcFlow items={["🏷️ ism", "🏷️ yosh", "🏷️ shahar"]} sep="·" /> },
      { ic: "🎯", h: "Amal ham, sahifa ham emas",
        body: <>O'zgaruvchi — bu <b>hisob-kitob amali</b> yoki internet sahifasi emas. U shunchaki <b>ma'lumotni saqlab turadigan joy</b>.</> },
    ]
  },
  6: {
    title: "let — o'zgaradigan qiymat",
    cards: [
      { ic: "🔄", h: "Qiymat o'zgarsa — let",
        body: <>Qiymati <b>keyin o'zgaradigan</b> o'zgaruvchini <b>let</b> so'zi bilan ochamiz. «number» yoki «print» emas — aynan let.</>,
        vis: <RcFlow items={["let ball = 10", "ball = 25", "📦 endi 25"]} />,
        ask: "O'yin bali dars davomida o'zgaradimi? Unda let mi, boshqami?" },
      { ic: "🎮", h: "Misol: o'yin bali",
        body: <>O'yinda <b>ball</b> ortib boradi — 10, keyin 25. Bunday <b>o'zgarib turadigan</b> narsa uchun <b>let</b> to'g'ri keladi.</>,
        vis: <RcFlow items={["10", "20", "25", "🔼 o'zgaradi"]} sep="·" /> },
      { ic: "🎯", h: "let bilan constni adashtirmang",
        body: <>Yodda tuting: <b>let</b> — keyin <b>o'zgartirsa bo'ladi</b>. const esa — <b>o'zgarmaydi</b>. Savolda «o'zgaradigan» so'zi bo'lsa — javob let.</> },
    ]
  },
  10: {
    title: "const — o'zgarmas qiymat",
    cards: [
      { ic: "🔒", h: "O'zgarmasa — const",
        body: <>Tug'ilgan yilingiz kabi <b>o'zgarmas</b> qiymat uchun <b>const</b> ishlatamiz. const qutisini <b>qulflab</b> qo'yamiz — ichidagisi doim shu bo'lib qoladi.</>,
        vis: <RcFlow items={["const yil = 2011", "🔒 qulf", "doim 2011"]} />,
        ask: "Bir haftada necha kun bor? Bu o'zgaradimi? Unda let mi, const mi?" },
      { ic: "🚫", h: "O'zgartirsangiz — xato",
        body: <>const PI = 3.14 dan keyin <b>PI = 3</b> desak — <b>xato</b> beradi. Chunki const bir marta to'ldiriladi va <b>o'zgarmaydi</b>.</>,
        vis: <RcFlow items={["const PI = 3.14", "PI = 3", "❌ xato"]} /> },
      { ic: "🎯", h: "Qulf kerakmi? — const",
        body: <>Qoida: qiymat <b>hech qachon o'zgarmasa</b> — const. O'zgarib tursa — let. «o'zgarmas», «doim bir xil» so'zlari constdan darak beradi.</> },
    ]
  },
  13: {
    title: "Number (raqam) va string (matn)",
    cards: [
      { ic: "🔢", h: "Tirnoqsiz — bu raqam",
        body: <>25 — bu <b>number (raqam)</b>, chunki <b>qo'shtirnoqsiz</b> yozilgan. Number bilan <b>hisob-kitob</b> qilsa bo'ladi: qo'shish, ko'paytirish.</>,
        vis: <RcFlow items={["25 → number", "25 + 5 = 30", "✅ hisob bo'ladi"]} />,
        ask: "10 + 5 raqamlar bilan bo'ladi. Lekin «o'n» + «besh» bo'ladimi?" },
      { ic: "✍️", h: "Qo'shtirnoqda — bu matn",
        body: <>«25» qo'shtirnoqda bo'lsa — bu endi <b>string (matn)</b>, raqam emas. «yigirma» ham — <b>harflar</b> bo'lgani uchun string.</>,
        vis: <RcFlow items={["\"25\" → matn", "\"yigirma\" → matn"]} sep="·" /> },
      { ic: "🎯", h: "true — boshqa tur",
        body: <>true — bu <b>boolean</b> (ha/yo'q), raqam emas. Demak faqat <b>tirnoqsiz 25</b> — number bo'ladi.</> },
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

// Kod-atamalarni `backtick` ichida chip qilib ko'rsatadi (11.8)
const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;

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
                <span style={{ flex: 1 }}>{fmtCode(opt)}</span>
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
                ? "Javobingiz qabul qilindi. Mentor «Natijani ochish»ni bosganda natija hammada birdan ko'rinadi."
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

const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png';
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
  const audio = useAudio([{ id: 's0', text: `O'yin o'ynaganingizda ekranda ballingiz, jonlaringiz va ismingiz turadi. O'yin ularni qayerda eslab qoladi? "Kod" tugmasini bosib, ichkariga qarang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('game');
  const OPTS = [
    { id: 'a', label: 'Sehr bilan — shunchaki eslab qoladi' },
    { id: 'b', label: "Nomlangan \"quti\" — o'zgaruvchida saqlaydi" },
    { id: 'c', label: 'Hech qayerda — har safar yo\'qoladi' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext optionalLive disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>O'yin ballingizni <span className="italic" style={{ color: T.accent }}>qayerda</span> saqlaydi?</h1>
        <Mentor>O'yin o'ynaganingizda ekranda <b style={{ color: T.ink }}>ballingiz</b>, jonlaringiz va ismingiz turadi. O'yin ularni qayerda eslab qoladi? <b style={{ color: T.ink }}>"Kod"</b> tugmasini bosib, ichkariga qarang.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'game' ? 'chip-on' : ''}`} onClick={() => setView('game')}>👾 O'yin</button>
              <button className={`chip ${view === 'code' ? 'chip-on' : ''}`} onClick={() => setView('code')}>{'</>'} Kod</button>
            </div>
            <div className="demo-swap" key={view}>
              {view === 'game' ? (
                <div style={{ background: '#101826', borderRadius: 14, padding: '18px 16px', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.2)` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontFamily: "'Manrope',sans-serif" }}>
                    <span style={{ fontWeight: 800, color: '#FFCB6B' }}>👾 SPACE</span>
                    <span style={{ fontSize: 13, color: '#82AAFF' }}>O'yinchi: Aziza</span>
                  </div>
                  <div style={{ textAlign: 'center', margin: '16px 0' }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 38, color: '#7DD181' }}>1250</div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: '#9FB4D8', letterSpacing: '0.1em' }}>BALL</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 18 }}>❤️ ❤️ ❤️</div>
                </div>
              ) : (
                <pre className="code-box"><Kw>let</Kw> <Vr>ball</Vr> <Op>=</Op> <Nm>1250</Nm>{'\n'}<Kw>let</Kw> <Vr>jon</Vr> <Op>=</Op> <Nm>3</Nm>{'\n'}<Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St></pre>
              )}
            </div>
            {view === 'code' && <p className="mono small" style={{ color: T.ink3, marginTop: 6, textAlign: 'center' }}>↑ har bir qiymat — nomlangan "quti"da</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, o'yin ballni qanday eslab qoladi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'nalish! Bu "qutilar" — <b>o'zgaruvchilar</b>. Bugun ularni o'rganamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Mana, eng qizig'i boshlanadi — bugun siz birinchi marta haqiqiy JavaScript kodi yozasiz! Boshlanishi esa o'zgaruvchilardan. Ularni 5 ta qadamda o'rganamiz va oxirida o'zingiz yozasiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: "O'zgaruvchi nima — nomlangan quti", tag: '' },
    { text: "Qiymat berish", tag: '=' },
    { text: "O'zgaradigan va o'zgarmas", tag: 'let / const' },
    { text: "Ma'lumot turlari", tag: 'matn · raqam' },
    { text: "O'zgaruvchini o'zingiz yozasiz", tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugun shunday kod yozasiz</p>
      <pre className="code-box" style={{ fontSize: 'clamp(13px,1.9vw,15px)' }}><span className="fade-up" style={{ display: 'block', animationDelay: '0.1s' }}><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St></span><span className="fade-up" style={{ display: 'block', animationDelay: '0.3s' }}><Kw>let</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm></span><span className="fade-up" style={{ display: 'block', animationDelay: '0.5s' }}><Kw>const</Kw> <Vr>shahar</Vr> <Op>=</Op> <St>"Toshkent"</St></span></pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ uchta o'zgaruvchi, uchta "quti"</p>
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
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up">Bugun <span className="italic" style={{ color: T.accent }}>birinchi haqiqiy kodingizni</span> yozasiz!</h2>
        </div>
        <Mentor>Mana, eng qizig'i boshlanadi — bugun siz birinchi marta <b style={{ color: T.ink }}>haqiqiy JavaScript kodi</b> yozasiz! Hammasi <b style={{ color: T.ink }}>o'zgaruvchilardan</b> boshlanadi. 5 qadamda o'rganamiz va oxirida o'zingiz yozasiz.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Kodni ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — O'ZGARUVCHI = NOMLANGAN QUTI =====
// OMBORCHI: qiymat tokenlari + nom yorliqlari (stellaj uyasini to'ldirish uchun)
const S2_VALUES = [{ id: 'aziza', label: '"Aziza"', color: CODE.str }, { id: 'v1250', label: '1250', color: CODE.num }, { id: 'v14', label: '14', color: CODE.num }];
const S2_NAMES = ['ism', 'ball', 'yosh'];
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `O'zgaruvchini shunday tasavvur qiling: ustiga nom yozilgan quti. Endi omborchi kabi birinchi qutingizni to'ldiring: avval ichiga qiymat soling, keyin ustiga nom yorlig'ini yopishtiring. Qiymat tokenini quti ichiga sudrang yoki bosing.`, trigger: 'on_mount', waits_for: null }]);
  // Stellaj uyasi — bitta atomik holat: { value, name } (S7: bitta useState obyekti)
  const [box, setBox] = useState(() => storedAnswer?.box || { value: null, name: null });
  const [drag, setDrag] = useState(null);      // sudralayotgan token id (skelet — Animatsiya silliqlaydi)
  const [over, setOver] = useState(false);      // quti ustida turibdimi
  const [jolt, setJolt] = useState(false);      // token tushganda quti seskanadi
  const isNarrow = useIsMobile(768);
  const filled = !!box.value;
  const done = !!box.value && !!box.name;
  const placeValue = (tok) => { if (box.value) return; setBox(b => ({ ...b, value: tok })); setDrag(null); setOver(false); setJolt(true); setTimeout(() => setJolt(false), 450); };
  const placeName = (nm) => setBox(b => ({ ...b, name: nm }));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, box }); }, [done]); // eslint-disable-line
  const navLabel = done ? 'Davom etish' : filled ? 'Yorliq yopishtiring 🏷️' : 'Qutiga qiymat soling';
  return (
    <Stage eyebrow="O'zgaruvchi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi <span className="italic" style={{ color: T.accent }}>qutini</span> to'ldiring.</h2></div>
        <Mentor>O'zgaruvchi — ustiga <b style={{ color: T.ink }}>yorliq</b> yopishtirilgan <b style={{ color: T.ink }}>quti</b>. Omborchi bo'ling: avval ichiga <b style={{ color: T.ink }}>qiymat</b> soling (tokenni sudrang yoki bosing), keyin ustiga <b style={{ color: T.ink }}>nom</b> yorlig'ini yopishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            {/* Qiymat tokenlari (SOL: qutiga sol) */}
            <p className="flow-label">1 — qiymat tokeni {filled ? '✓' : ''}</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', minHeight: 40 }}>
              {S2_VALUES.map(tok => {
                const used = box.value && box.value.id === tok.id;
                return (
                  <button key={tok.id} disabled={filled}
                    draggable={!filled}
                    onDragStart={() => setDrag(tok.id)}
                    onDragEnd={() => setDrag(null)}
                    onClick={() => placeValue(tok)}
                    className="mono" style={{ cursor: filled ? 'default' : 'grab', border: 'none', borderRadius: 9, padding: '9px 15px', fontWeight: 700, fontSize: 15, background: used ? T.accentSoft : T.paper, color: tok.color, opacity: filled && !used ? 0.35 : 1, boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.25)`, transition: 'all 0.18s' }}>{tok.label}</button>
                );
              })}
            </div>
            {/* Stellaj uyasi — drop target */}
            <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              <div className={jolt ? 'wh-jolt' : ''}
                onDragOver={(e) => { if (!filled) { e.preventDefault(); setOver(true); } }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); const tok = S2_VALUES.find(t => t.id === drag); if (tok) placeValue(tok); }}
                style={{ background: T.paper, borderRadius: 16, boxShadow: `0 10px 26px -6px rgba(${T.shadowBase},0.16)`, overflow: 'hidden', minWidth: 210, outline: over ? `2px dashed ${T.accent}` : 'none', outlineOffset: 3, transition: 'outline 0.15s' }}>
                <div style={{ background: box.name ? T.accent : T.ink, color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}><span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9.5, opacity: 0.65, letterSpacing: '0.12em' }}>YORLIQ · NOMI</span>🏷️ {box.name || '___'}</div>
                <div className={`${box.value ? 'drop-in' : ''}`} style={{ padding: '20px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 'clamp(20px,4vw,28px)', color: box.value ? box.value.color : T.ink3, background: box.value ? T.accentSoft : '#fff', transition: 'all 0.2s' }} key={box.value ? box.value.id : 'empty'}><div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9.5, opacity: 0.6, letterSpacing: '0.12em', fontWeight: 600, marginBottom: 5 }}>QIYMATI · ICHIDAGI</div>{box.value ? box.value.label : <span style={{ fontStyle: 'italic', fontSize: 13, opacity: 0.8 }}>bo'sh — qiymat soling</span>}</div>
              </div>
            </div>
            <pre className="code-box fade-up delay-2" style={{ textAlign: 'center' }}><Kw>let</Kw> <Vr>{box.name || '___'}</Vr> <Op>=</Op> {box.value ? <St>{box.value.label}</St> : <span style={{ color: T.ink3 }}>___</span>}</pre>
          </Col>
          <Col>
            {/* Nom yorliqlari (YORLIQLA) — faqat qiymat solingach ochiladi */}
            {filled ? (
              <div className="pop-in">
                <p className="flow-label">2 — nom yorlig'ini yopishtiring 🏷️</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '4px 0 10px' }}>
                  {S2_NAMES.map(nm => (
                    <button key={nm} onClick={() => placeName(nm)} className="mono" style={{ cursor: 'pointer', border: box.name === nm ? `2px solid ${T.accent}` : `2px solid ${T.line}`, borderRadius: 9, padding: '8px 15px', fontWeight: 700, fontSize: 14, background: box.name === nm ? T.accentSoft : T.paper, color: box.name === nm ? T.accent : T.ink, transition: 'all 0.18s' }}>🏷️ {nm}</button>
                  ))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Avval qutiga qiymat soling — keyin nom yorlig'i ochiladi</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Birinchi qutingiz to'ldi! Mana shu — <b>o'zgaruvchi</b>: <span className="mono">{box.name}</span> deb chaqirsangiz, ichidagi <span className="mono">{box.value.label}</span> ni olasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — QIYMAT BERISH (=) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Qutiga qiymatni qanday solamiz? Teng belgisi orqali. Lekin diqqat: kodda teng belgisi "teng" degani emas — u "qutiga sol" degani. let ism teng Aziza degani: Aziza ni ism qutisiga sol. Bir qiymat tanlab, qutiga tushishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const VALUES = ['Aziza', 'Bobur', 'Dilnoza'];
  const [val, setVal] = useState(null);
  const [read, setRead] = useState(false);        // OMBORCHI O'QI: robot-qo'l qutini chaqirib qiymatni chiqardi
  const [sawNameless, setSawNameless] = useState(false); // nomsiz quti chaqirilsa — bo'sh qaytadi
  const done = val !== null && read;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="Qiymat berish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : val === null ? 'Bir qiymat tanlang' : 'Qutini o\'qing 🤖'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qutiga qiymatni <span className="italic" style={{ color: T.accent }}>qanday</span> solamiz?</h2></div>
        <Mentor>Qutiga qiymat <b style={{ color: T.ink }}>= belgisi</b> orqali solinadi. Lekin diqqat: kodda <b style={{ color: T.ink }}>=</b> "teng" degani emas — u <b style={{ color: T.ink }}>"qutiga sol"</b> degani! Bir qiymat tanlab, qutiga tushishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qiymat tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {VALUES.map(v => (<button key={v} className={`chip ${val === v ? 'chip-on' : ''}`} onClick={() => setVal(v)}>"{v}"</button>))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(14px,2.4vw,18px)' }}><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <span className="pop-num" key={val} style={{ color: CODE.str }}>"{val || '...'}"</span></pre>
            <div className="frame fade-up delay-2"><p className="body" style={{ margin: 0, color: T.ink }}>O'qiymiz: «<span className="mono">"{val || '...'}"</span> ni <span className="mono">ism</span> qutisiga sol».</p></div>
          </Col>
          <Col>
            <p className="flow-label">Natija — quti</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              {val ? <VarBox name="ism" value={`"${val}"`} valColor={CODE.str} pulse /> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qiymat tanlang — quti to'ladi</p></div>}
            </div>
            {/* OMBORCHI O'QI: nom orqali chaqirib qiymatni chiqarish (robot-qo'l) */}
            {val && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <button className="btn" onClick={() => setRead(true)} disabled={read} style={{ opacity: read ? 0.6 : 1 }}>🤖 <span className="mono">ism</span> ni o'qi (chaqir)</button>
                {read && <div className="frame pop-in" style={{ width: '100%' }}><p className="body" style={{ margin: 0, color: T.ink }}><span className="wh-arm" style={{ display: 'inline-block' }}>🤖</span> Robot-qo'l <span className="mono">ism</span> qutisini topdi va ichidan <span className="mono pop-num" style={{ color: CODE.str, animationDelay: '.35s', animationFillMode: 'both' }}>"{val}"</span> ni tortib chiqardi.</p></div>}
                {read && (
                  <button className="btn-ghost" onClick={() => setSawNameless(true)} style={{ fontSize: 13 }}>❓ Nomsiz qutini chaqirib ko'ring</button>
                )}
                {sawNameless && <div className="frame-dash pop-in" style={{ width: '100%' }}><p className="small" style={{ margin: 0, color: T.ink2 }}><span className="wh-grope" style={{ display: 'inline-block' }}>🤖</span> Nomsiz qutini robot-qo'l paypaslab topolmadi — <span className="wh-graygone" style={{ display: 'inline-block' }}>bo'sh qaytdi</span>. Shuning uchun har qutiga <b style={{ color: T.ink }}>nom (yorliq)</b> kerak!</p></div>}
              </div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tayyor! <span className="mono">ism</span> qutisida endi <span className="mono">"{val}"</span> turibdi — nomi orqali istalgan payt o'qiysiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="O'zgaruvchi nima? To'g'ri variantni tanlang."
    questionText="O'zgaruvchi (peremennaya) nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>O'zgaruvchi nima?</p><h2 className="title h-sub" style={{ marginTop: 8 }}>O'zgaruvchi (peremennaya) nima?</h2></>}
    options={["Qiymat saqlaydigan nomlangan \"quti\"", 'Sonlar ustida hisob-kitob amali', 'Brauzerda ochiladigan sahifa', "Ekranda ko'rinadigan rang turi"]} correctIdx={0}
    explainCorrect="To'g'ri! O'zgaruvchi — nomi bor quti: ichida qiymat (matn, raqam...) saqlanadi va siz uni nom orqali chaqirasiz."
    explainWrong={{ 1: "Yo'q — bu hisoblash emas. O'zgaruvchi qiymat saqlaydigan nomlangan quti.", 2: "Yo'q — bu sahifa emas. O'zgaruvchi — kod ichidagi qiymat qutisi.", 3: "Yo'q — rang emas. O'zgaruvchi — qiymat saqlaydigan nomlangan quti.", default: "O'zgaruvchi — qiymat saqlaydigan nomlangan quti." }} />
);

// ===== SCREEN 5 — let (o'zgaradigan quti) =====
const S5_VALS = [25, 60, 100, 250]; // ball qutisiga soladigan yangi qiymat-tokenlar
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `O'yindagi ballingizni eslang — u doim o'zgarib turadi-ku. Bunday o'zgarib turadigan qiymatlar uchun let so'zini ishlatamiz. let qutisiga yangi qiymat-tokenni soling — eski qiymat tushib ketadi, yangisi joylashadi.`, trigger: 'on_mount', waits_for: null }]);
  // OMBORCHI: let qutisini qayta-to'ldirish (SOL naqshi) — eski qiymat tushadi, yangisi tushadi
  const [box, setBox] = useState(() => storedAnswer?.box || { value: 10 });
  const [refills, setRefills] = useState(storedAnswer?.refills || 0);
  const [falling, setFalling] = useState(null); // eski qiymat qutidan tushib ketmoqda
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(false);
  const [jolt, setJolt] = useState(false);      // yangi qiymat tushganda quti seskanadi
  const ball = box.value;
  const done = refills >= 1;
  const place = (v) => {
    if (v === box.value) return;
    setFalling(box.value); setBox({ value: v }); setRefills(r => r + 1);
    setDrag(null); setOver(false);
    setJolt(true); setTimeout(() => setJolt(false), 450);
    setTimeout(() => setFalling(null), 560);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, box, refills }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="let" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Yangi qiymat soling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic mono" style={{ color: T.accent }}>let</span> — qiymatni keyin o'zgartirsa bo'ladimi?</h2></div>
        <Mentor>O'yindagi <b style={{ color: T.ink }}>ballingiz</b> doim o'zgarib turadi-ku. Bunday qiymatlar uchun <b style={{ color: T.ink }}>let</b> so'zini ishlatamiz. Qutiga <b style={{ color: T.ink }}>yangi qiymat-tokenni</b> soling (sudrang yoki bosing) — eski qiymat tushib ketadi, yangisi joylashadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Yangi qiymat tokeni — qutiga soling</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {S5_VALS.map(v => (
                <button key={v} draggable onDragStart={() => setDrag(v)} onDragEnd={() => setDrag(null)} onClick={() => place(v)} disabled={v === box.value}
                  className="mono" style={{ cursor: v === box.value ? 'default' : 'grab', border: 'none', borderRadius: 9, padding: '9px 15px', fontWeight: 700, fontSize: 15, background: v === box.value ? T.accentSoft : T.paper, color: CODE.num, opacity: v === box.value ? 0.4 : 1, boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.25)`, transition: 'all 0.18s' }}>{v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', position: 'relative' }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); if (drag != null) place(drag); }}
                className={jolt ? 'wh-jolt' : ''}
                style={{ outline: over ? `2px dashed ${T.accent}` : 'none', outlineOffset: 4, borderRadius: 16, transition: 'outline 0.15s' }}>
                <VarBox name="ball" value={ball} valColor={CODE.num} pulse />
              </div>
              {falling != null && <span className="mono wh-fall" style={{ position: 'absolute', top: 8, left: '50%', color: CODE.num, fontWeight: 700, fontSize: 18, pointerEvents: 'none' }}>{falling} ↓</span>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Kod</p>
            <pre className="code-box fade-up" style={{ fontSize: 'clamp(13px,2vw,15px)' }}><Kw>let</Kw> <Vr>ball</Vr> <Op>=</Op> <Nm>10</Nm>  <span style={{ color: CODE.comment }}>{"// boshlang'ich"}</span>{'\n'}{refills > 0 && <><Vr>ball</Vr> <Op>=</Op> <Nm>{ball}</Nm>  <span style={{ color: CODE.comment }}>{'// yangilandi'}</span></>}</pre>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>let</b> — bu o'zgaradigan quti. Eski qiymat tushdi, yangisi joylashdi. Xohlagancha yangilaysiz!</p></div>
              : <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Diqqat: ikkinchi marta <span className="mono">let</span> yozilmaydi — quti bor, faqat ichini almashtiramiz.</p></div>}
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
    audioText="Qiymati keyin o'zgarib turadigan o'zgaruvchini qaysi so'z bilan ochamiz?"
    questionText="Qiymati keyin o'zgaradigan o'zgaruvchini qaysi so'z bilan ochamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qiymati keyin <span className="italic" style={{ color: T.accent }}>o'zgaradigan</span> o'zgaruvchini qaysi so'z bilan ochamiz?</h2></>}
    options={['const', 'let', 'number', 'print']} correctIdx={1}
    explainCorrect="To'g'ri! let bilan ochilgan qutining qiymatini keyin istagancha o'zgartirish mumkin."
    explainWrong={{
      0: "Yo'q — const o'zgarmas qiymat uchun. O'zgaradigan qiymat uchun let.",
      2: "Yo'q — number bunday so'z emas. To'g'risi — let.",
      3: "Yo'q — print bunday so'z emas. O'zgaradigan qiymat uchun let.",
      default: "O'zgaradigan qiymat uchun — let."
    }} />
);

// ===== SCREEN 6 — const (o'zgarmas quti) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Ba'zi qiymatlar esa hech qachon o'zgarmaydi. Tug'ilgan yilingizni o'ylab ko'ring — u doim bir xil. Bunday qiymatlar uchun const so'zini ishlatamiz. const qutisining ichini o'zgartirib bo'lmaydi. Ishonmaysizmi? Tugmani bosib, o'zgartirishga urinib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [tried, setTried] = useState(false);
  const done = tried;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="const" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'O\'zgartirishga urining'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ba'zi qiymatlar <span className="italic" style={{ color: T.accent }}>o'zgarmasligi</span> kerakmi?</h2></div>
        <Mentor>Ba'zi qiymatlar hech qachon o'zgarmaydi: <b style={{ color: T.ink }}>tug'ilgan yilingiz</b> doim bir xil-ku. Bunday qiymatlar uchun <b style={{ color: T.ink }}>const</b> so'zini ishlatamiz — uning ichini o'zgartirib bo'lmaydi. Ishonmaysizmi? Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Quti — o'zgarmas (const)</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div className={tried ? 'shake-x' : ''} style={{ position: 'relative' }}>
                <VarBox name="tugilgan_yil" value={2012} valColor={CODE.num} />
                {tried && <span className="pop-num" style={{ position: 'absolute', top: -10, right: -10, fontSize: 22 }}>🔒</span>}
                {tried && <span className="mono wh-reject" style={{ position: 'absolute', top: 6, left: '50%', color: CODE.num, fontWeight: 700, fontSize: 17, pointerEvents: 'none' }}>2015 ↩</span>}
              </div>
            </div>
            <button className="btn" onClick={() => setTried(true)} style={{ alignSelf: 'center' }}>✏️ Qiymatni o'zgartirishga urinish</button>
          </Col>
          <Col>
            <p className="flow-label">Kod</p>
            <pre className="code-box fade-up" style={{ fontSize: 'clamp(13px,2vw,15px)' }}><Kw>const</Kw> <Vr>tugilgan_yil</Vr> <Op>=</Op> <Nm>2012</Nm>{'\n'}{tried && <><Vr>tugilgan_yil</Vr> <Op>=</Op> <Nm>2015</Nm>{'\n'}<span className="el-in" style={{ color: T.accent, display: 'inline-block' }}>{"❌ Xato: const o'zgarmaydi!"}</span></>}</pre>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi — <b>const</b> qutini "qulflaydi" 🔒. Qiymat bir marta solinadi va o'zgarmaydi.</p></div>
              : <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>const = constant = o'zgarmas. Tug'ilgan yil, hafta kunlari soni (7), Pi soni — bularga const.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — let vs const (qaysini tanlash) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Endi eng muhim qoidani mustahkamlaymiz. Qiymat o'zgaradimi — let. O'zgarmaydimi — const. Quyidagi har bir holat uchun to'g'ri so'zni tanlang.`, trigger: 'on_mount', waits_for: null }]);
  const CASES = [
    { t: "O'yindagi ballingiz", a: 'let', why: "doim o'zgaradi" },
    { t: "Tug'ilgan yilingiz", a: 'const', why: "hech o'zgarmaydi" },
    { t: 'Haftadagi kunlar (7)', a: 'const', why: 'doim 7' }
  ];
  const [ans, setAns] = useState(storedAnswer?.ans || {});
  const done = CASES.every((c, i) => ans[i] === c.a);
  const choose = (i, v) => { if (ans[i] === CASES[i].a) return; setAns(p => ({ ...p, [i]: v })); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, ans }); }, [done]);
  return (
    <Stage eyebrow="let vs const" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Hammasini to\'g\'ri tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">let yoki const — <span className="italic" style={{ color: T.accent }}>qaysi birini</span>?</h2></div>
        <Mentor>Oddiy qoida: qiymat <b style={{ color: T.ink }}>o'zgaradimi</b> — <span className="mono">let</span>. <b style={{ color: T.ink }}>O'zgarmaydimi</b> — <span className="mono">const</span>. Har bir holat uchun to'g'ri so'zni tanlang.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CASES.map((c, i) => {
            const correct = ans[i] === c.a;
            const wrong = ans[i] && ans[i] !== c.a;
            return (
              <div key={i} className={correct ? 'ring-green' : ''} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.paper, borderRadius: 12, padding: '12px 15px', boxShadow: `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, flexWrap: 'wrap' }}>
                <span style={{ flex: 1, minWidth: 140, fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink }}>{c.t}</span>
                {correct ? (
                  <span className="mono pop-in" style={{ color: T.success, fontWeight: 700, fontSize: 14 }}>✓ {c.a} — {c.why}</span>
                ) : (
                  <span style={{ display: 'flex', gap: 7 }}>
                    {['let', 'const'].map(opt => (
                      <button key={opt} onClick={() => choose(i, opt)} className="mono" style={{ cursor: 'pointer', border: 'none', borderRadius: 9, padding: '8px 16px', fontWeight: 700, fontSize: 14, background: wrong && ans[i] === opt ? T.accentSoft : T.bg, color: wrong && ans[i] === opt ? T.accent : T.ink, boxShadow: `0 3px 9px -5px rgba(${T.shadowBase},0.2)` }}>{opt}</button>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Ajoyib! Ko'pincha <b>const</b> dan boshlanadi — agar qiymat keyin o'zgarishi kerak bo'lsa, <b>let</b> ga o'tasiz.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — var (eski usul) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Eski kodlarda yana bitta so'zni uchratasiz — var. Bu o'zgaruvchining eng eski usuli, 2015-yilgacha hamma shuni ishlatardi. Lekin uning kamchiliklari bor edi, shuning uchun bugun biz let va const ishlatamiz. var bilan shunchaki tanish bo'lib qo'ying. Tugmani bosib, eski va yangi usulni solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [era, setEra] = useState('new');
  const [touched, setTouched] = useState(false);
  const done = touched;
  const set = (e) => { setEra(e); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="var" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic mono" style={{ color: T.accent }}>var</span> — eski usul (endi ishlatilmaydi)</h2></div>
        <Mentor>Eski kodlarda yana bitta so'zni uchratasiz — <b style={{ color: T.ink }}>var</b>. Bu o'zgaruvchining eng eski usuli (2015-yilgacha). Kamchiliklari borligi uchun bugun biz <b style={{ color: T.ink }}>let</b> va <b style={{ color: T.ink }}>const</b> ishlatamiz. var bilan shunchaki tanish bo'lib qo'ying.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${era === 'old' ? 'chip-on' : ''}`} onClick={() => set('old')}>🕰️ Eski (2015 gacha)</button>
              <button className={`chip ${era === 'new' ? 'chip-on' : ''}`} onClick={() => set('new')}>✨ Hozir</button>
            </div>
            <pre className="code-box demo-swap" key={era} style={{ fontSize: 'clamp(13px,2.1vw,16px)' }}>
              {era === 'old'
                ? <><Kw>var</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St>{'\n'}<Kw>var</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm></>
                : <><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> <St>"Aziza"</St>{'\n'}<Kw>const</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm></>}
            </pre>
            <p className="el-in" key={era} style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: era === 'old' ? T.accent : T.success }}>{era === 'old' ? '⚠️ Eski usul — kamchiliklari bor edi' : '✨ Zamonaviy va ishonchli usul'}</p>
          </Col>
          <Col>
            <div className="frame fade-up delay-2">
              <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>Qisqa xulosa</p>
              <p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">var</span> — eski usul, eski kodlarda ko'rasiz. <br /><span className="mono">let</span> va <span className="mono">const</span> — zamonaviy, ishonchli usul. <b>Siz doim shu ikkitasini ishlating.</b></p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi uchalasini ham bilasiz: <b>var</b> (eski), <b>let</b> va <b>const</b> (yangi). Tanlov oson — let yoki const.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Tug'ilgan yilingiz kabi o'zgarmas qiymat uchun qaysi so'zni ishlatasiz?"
    questionText="Tug'ilgan yilingiz kabi o'zgarmas qiymat uchun qaysi so'zni ishlatasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tug'ilgan yilingiz kabi <span className="italic" style={{ color: T.accent }}>o'zgarmas</span> qiymat uchun qaysi so'zni ishlatasiz?</h2></>}
    options={['let', 'var', 'const', 'box']} correctIdx={2}
    explainCorrect="To'g'ri! O'zgarmas qiymat uchun const — u qutini qulflaydi, qiymat o'zgarmaydi."
    explainWrong={{
      0: "Yo'q — let o'zgaradigan qiymat uchun. O'zgarmas qiymatga const.",
      1: "Yo'q — var eski usul. Zamonaviy o'zgarmas qiymat uchun const.",
      3: "Yo'q — box bunday so'z emas. O'zgarmas qiymat uchun const.",
      default: "O'zgarmas qiymat uchun — const."
    }} />
);

// ===== SCREEN 10 — MA'LUMOT TURLARI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Qutiga turli xil narsa solish mumkin. Matn — masalan ism, qo'shtirnoq ichida yoziladi. Raqam — masalan yosh, qo'shtirnoqsiz. Va ha-yo'q qiymati — true yoki false. Bularni ma'lumot turlari deyiladi. Har birini bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const TYPES = {
    string: { name: 'Matn — string', box: { n: 'ism', v: '"Aziza"' }, color: CODE.str, desc: 'Harflar, so\'zlar. Doim qo\'shtirnoq ichida: "..."' },
    number: { name: 'Raqam — number', box: { n: 'yosh', v: '14' }, color: CODE.num, desc: "Sonlar, qo'shtirnoqsiz. Ular bilan hisob qilamiz." },
    boolean: { name: "Ha/yo'q — boolean", box: { n: 'maktabda', v: 'true' }, color: CODE.bool, desc: "Faqat ikki qiymat: true (ha) yoki false (yo'q)." }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ma'lumot turlari" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 turni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Quti ichida qanday <span className="italic" style={{ color: T.accent }}>qiymatlar</span> bo'ladi?</h2></div>
        <Mentor>Qutiga turli xil narsa sig'adi: <b style={{ color: T.ink }}>matn</b> (qo'shtirnoq ichida), <b style={{ color: T.ink }}>raqam</b> (qo'shtirnoqsiz) va <b style={{ color: T.ink }}>ha/yo'q</b> (true yoki false). Bular — <b style={{ color: T.ink }}>ma'lumot turlari</b>. Har birini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.keys(TYPES).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 15px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${TYPES[k].color}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span className="mono" style={{ fontWeight: 700, color: TYPES[k].color, fontSize: 14 }}>{TYPES[k].box.v}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{TYPES[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }} key={active}>
                <div style={{ display: 'flex', justifyContent: 'center' }}><VarBox name={TYPES[active].box.n} value={TYPES[active].box.v} valColor={TYPES[active].color} small pulse /></div>
                <div className="sk-info"><span className="sk-tagbig"><span className="sk-wordbadge">{TYPES[active].name}</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{TYPES[active].desc}</p></div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir turni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Uchta asosiy tur: <b>matn</b>, <b>raqam</b>, <b>boolean</b>. Eng muhim farq — qo'shtirnoq!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — STRING vs NUMBER =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi eng muhim sirni ochaman. Qo'shtirnoq bitta narsani butunlay o'zgartiradi. Agar raqamlar qo'shtirnoqsiz bo'lsa — qo'shiladi: besh qo'shuv besh — o'n. Lekin qo'shtirnoq ichida bo'lsa — ular matn, shunchaki yopishtiriladi: besh-besh — besh yuz emas, ellik besh degani — "55". Ikki tugmani bosib solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [mode, setMode] = useState('num');
  const [seen, setSeen] = useState(new Set(['num']));
  const done = seen.size >= 2;
  const set = (m) => { setMode(m); setSeen(prev => { const n = new Set(prev); n.add(m); return n; }); };
  const isNum = mode === 'num';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Matn vs Raqam" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Besh qo'shuv besh — <span className="italic" style={{ color: T.accent }}>qachon</span> o'n emas?</h2></div>
        <Mentor>Bitta <b style={{ color: T.ink }}>qo'shtirnoq</b> hammasini o'zgartiradi! Raqamlar qo'shtirnoqsiz bo'lsa — <b style={{ color: T.ink }}>qo'shiladi</b> (5+5=10). Qo'shtirnoq ichida bo'lsa — ular matn, <b style={{ color: T.ink }}>yopishtiriladi</b> ("5"+"5"="55"). Solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${isNum ? 'chip-on' : ''}`} onClick={() => set('num')}>🔢 Raqam</button>
              <button className={`chip ${!isNum ? 'chip-on' : ''}`} onClick={() => set('str')}>🔤 Matn</button>
            </div>
            <pre className="code-box demo-swap" key={mode} style={{ fontSize: 'clamp(14px,2.4vw,18px)' }}>
              {isNum
                ? <><Nm>5</Nm> <Op>+</Op> <Nm>5</Nm>  <span style={{ color: CODE.comment }}>{'// raqamlar'}</span></>
                : <><St>"5"</St> <Op>+</Op> <St>"5"</St>  <span style={{ color: CODE.comment }}>{'// matn'}</span></>}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <div className="demo-swap" key={mode + 'r'} style={{ background: T.paper, borderRadius: 14, padding: '22px', textAlign: 'center', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <div className="pop-num" key={mode} style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(36px,8vw,52px)', color: isNum ? CODE.num : T.accent }}>{isNum ? '10' : '"55"'}</div>
              <p className="body" style={{ margin: '6px 0 0', color: T.ink2 }}>{isNum ? "Qo'shildi — chunki raqam" : 'Yopishdi — chunki matn'}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Esda saqlang: <b>qo'shtirnoq bor → matn</b>, <b>qo'shtirnoq yo'q → raqam</b>. Bu — eng ko'p chalkashtiradigan joy!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Quyidagilardan qaysi biri RAQAM (number)?"
    questionText="Qaysi biri RAQAM (number)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi biri <span className="italic" style={{ color: T.accent }}>RAQAM</span> (number)?</h2></>}
    options={['"25"', '25', '"yigirma"', 'true']} correctIdx={1}
    explainCorrect="To'g'ri! 25 — qo'shtirnoqsiz, demak raqam (number). U bilan hisob qilsa bo'ladi."
    explainWrong={{
      0: '"25" — qo\'shtirnoqda, demak bu matn (string), raqam emas.',
      2: '"yigirma" — qo\'shtirnoqdagi so\'z, bu matn (string).',
      3: "true — bu boolean (ha/yo'q), raqam emas. Raqam — qo'shtirnoqsiz 25.",
      default: "Qo'shtirnoqsiz son — raqam: 25."
    }} />
);

// ===== SCREEN 13 — KULMINATSIYA: O'Z OMBORINGNI YIG' (stellaj-gate) =====
const S13_COLOR = (t) => (t === 'str' ? CODE.str : t === 'bool' ? CODE.bool : CODE.num);
const S13_VALUES = [{ label: '"Aziza"', t: 'str' }, { label: '14', t: 'num' }, { label: '"Toshkent"', t: 'str' }, { label: '0', t: 'num' }, { label: 'true', t: 'bool' }, { label: '"Coddycamp"', t: 'str' }];
const S13_NAMES = ['ism', 'yosh', 'shahar', 'ball', 'maktab', 'oqiyaptimi'];
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi navbat sizga — o'z omboringizni yig'ing. Har quti uchun: qiymat-tokenni ichiga soling, nom yorlig'ini yopishtiring va let yoki const tanlang. O'zgarmasiga const tanlansa quti qulflanadi. Kamida 3 ta to'liq quti yig'ing.`, trigger: 'on_mount', waits_for: null }]);
  // OMBORCHI kulminatsiya: build-station'da quti yig'iladi (SOL + YORLIQLA + let/const) → omborga qo'yiladi
  const [shelf, setShelf] = useState(() => storedAnswer?.shelf || []);
  const [cur, setCur] = useState({ kw: 'let', value: null, name: null });
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(false);
  const [jolt, setJolt] = useState(false);      // token qutiga tushganda seskanish
  const MAX = 5;
  const usedNames = shelf.map(b => b.name);
  const done = shelf.length >= 3;
  const curReady = !!cur.value && !!cur.name;
  const placeValue = (tok) => { setCur(c => ({ ...c, value: tok })); setDrag(null); setOver(false); setJolt(true); setTimeout(() => setJolt(false), 450); };
  const stash = () => { if (!curReady || shelf.length >= MAX) return; setShelf(s => [...s, cur]); setCur({ kw: 'let', value: null, name: null }); };
  const resetAll = () => { setShelf([]); setCur({ kw: 'let', value: null, name: null }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, shelf }); }, [done]); // eslint-disable-line
  const availNames = S13_NAMES.filter(n => !usedNames.includes(n));
  const isConst = cur.kw === 'const';
  return (
    <Stage eyebrow="Kulminatsiya · o'z omboring" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `Kamida 3 ta quti (${shelf.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z <span className="italic" style={{ color: T.accent }}>omboringizni</span> yig'ing.</h2></div>
        <Mentor>Navbat sizga — omborchi bo'ling. Har quti uchun: <b style={{ color: T.ink }}>qiymat</b> soling, <b style={{ color: T.ink }}>nom</b> yorlig'ini yopishtiring, <b style={{ color: T.ink }}>let/const</b> tanlang (o'zgarmasiga const — quti qulflanadi 🔒). Kamida <b style={{ color: T.ink }}>3 ta</b> to'liq quti yig'ing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Quti yig'ish stansiyasi</p>
            {/* let/const tanlov */}
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {['let', 'const'].map(k => (
                <button key={k} onClick={() => setCur(c => ({ ...c, kw: k }))} className="mono" style={{ cursor: 'pointer', flex: 1, border: cur.kw === k ? `2px solid ${T.accent}` : `2px solid ${T.line}`, borderRadius: 9, padding: '8px 10px', fontWeight: 700, fontSize: 14, background: cur.kw === k ? T.accentSoft : T.paper, color: cur.kw === k ? T.accent : T.ink }}>{k === 'const' ? '🔒 const' : 'let'}</button>
              ))}
            </div>
            {/* qiymat tokenlari (SOL) */}
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {S13_VALUES.map(tok => {
                const used = cur.value && cur.value.label === tok.label;
                return (
                  <button key={tok.label} draggable onDragStart={() => setDrag(tok)} onDragEnd={() => setDrag(null)} onClick={() => placeValue(tok)}
                    className="mono" style={{ cursor: 'grab', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: 13.5, background: used ? T.accentSoft : T.paper, color: S13_COLOR(tok.t), boxShadow: `0 3px 10px -6px rgba(${T.shadowBase},0.25)` }}>{tok.label}</button>
                );
              })}
            </div>
            {/* quti — drop target + yorliq */}
            <div
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); if (drag) placeValue(drag); }}
              className={jolt ? 'wh-jolt' : ''}
              style={{ background: T.paper, borderRadius: 14, boxShadow: `0 8px 22px -8px rgba(${T.shadowBase},0.16)`, overflow: 'hidden', outline: over ? `2px dashed ${T.accent}` : 'none', outlineOffset: 3 }}>
              <div style={{ background: cur.name ? T.accent : T.ink, color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>{isConst ? '🔒' : '🏷️'} {cur.name || '___'} <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>{cur.kw}</span></div>
              <div className={cur.value ? 'drop-in' : ''} key={cur.value ? cur.value.label : 'e'} style={{ padding: '14px', textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 'clamp(17px,3vw,22px)', color: cur.value ? S13_COLOR(cur.value.t) : T.ink3, background: cur.value ? T.accentSoft : '#fff' }}>{cur.value ? cur.value.label : <span style={{ fontStyle: 'italic', fontSize: 12 }}>qiymat soling</span>}</div>
            </div>
            {/* nom yorliqlari (YORLIQLA) */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {availNames.map(nm => (
                <button key={nm} onClick={() => setCur(c => ({ ...c, name: nm }))} className="mono" style={{ cursor: 'pointer', border: cur.name === nm ? `2px solid ${T.accent}` : `2px solid ${T.line}`, borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 13, background: cur.name === nm ? T.accentSoft : T.paper, color: cur.name === nm ? T.accent : T.ink }}>🏷️ {nm}</button>
              ))}
            </div>
            <button className="btn" onClick={stash} disabled={!curReady || shelf.length >= MAX} style={{ alignSelf: 'flex-start', opacity: curReady && shelf.length < MAX ? 1 : 0.5 }}>📦 Omborga qo'y</button>
          </Col>
          <Col>
            <p className="flow-label">Sizning omboringiz ({shelf.length}/3){shelf.length > 0 && <button onClick={resetAll} style={{ marginLeft: 8, background: 'none', border: 'none', color: T.ink3, cursor: 'pointer', fontSize: 12 }}>↺ tozalash</button>}</p>
            <div className="stellaj">
              {shelf.length === 0 && <div className="frame-dash stellaj-empty"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yig'ilgan qutilaringiz shu yerda javon-javon terilib boradi</p></div>}
              {shelf.map((b, i) => (
                <div key={i} className="wh-shelve" style={{ background: T.paper, borderRadius: 12, boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.18)`, overflow: 'hidden' }}>
                  <div style={{ background: b.kw === 'const' ? T.ink : T.accent, color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, padding: '6px 11px' }}>{b.kw === 'const' ? '🔒' : '🏷️'} {b.name}</div>
                  <div className="mono" style={{ padding: '10px 11px', textAlign: 'center', fontWeight: 700, color: S13_COLOR(b.value.t) }}>{b.value.label}</div>
                </div>
              ))}
            </div>
            <pre className="code-box" style={{ minHeight: 54, fontSize: 'clamp(12px,1.8vw,14px)' }}>
              {shelf.length === 0
                ? <span style={{ color: CODE.comment }}>{"// quti yig'ing…"}</span>
                : shelf.map((b, i) => (<span key={i} style={{ display: 'block' }}><Kw>{b.kw}</Kw> <Vr>{b.name}</Vr> <Op>=</Op> <span style={{ color: S13_COLOR(b.value.t) }}>{b.value.label}</span></span>))}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Ombor tayyor! {shelf.length} ta quti — har biri nomi, qiymati va turi (let/const) bilan. Siz omborchisiz! 🎉</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (qo'shtirnoq tushib qolgan) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI sizga kod yozib berdi, lekin bittasida xato bor — dastur ishlamayapti. Yaxshilab qarang: bir o'zgaruvchining matn qiymati qo'shtirnoqsiz qolib ketibdi. Xato qatorni toping va bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'ism' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'ism';
  const done = fixed;
  const pickIsm = () => { if (found) return; setPicked('ism'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Aziza qo'shtirnoqsiz — kompyuter uni o'zgaruvchi deb o'ylab, topolmayapti. Qo'shtirnoq qo'shamiz.`); }, 300); };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi "Aziza" matn bo'ldi — kod ishlaydi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kod ishlamadi — <span className="italic" style={{ color: T.accent }}>nega</span>?</h2></div>
        <Mentor>AI kod yozib berdi, lekin dastur <b style={{ color: T.ink }}>ishlamayapti</b>. Yaxshilab qarang: bir o'zgaruvchining <b style={{ color: T.ink }}>matn qiymati qo'shtirnoqsiz</b> qolib ketibdi. Xato qatorni toping va bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana, o'zgaruvchilaringiz:</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default' }}><Kw>let</Kw> <Vr>yosh</Vr> <Op>=</Op> <Nm>14</Nm></div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickIsm}><Kw>let</Kw> <Vr>ism</Vr> <Op>=</Op> {fixed ? <St>"Aziza"</St> : <span style={{ color: CODE.text }}>Aziza</span>} {!fixed && <span style={{ color: CODE.comment }}>{'// ?'}</span>}</div>
                <div className="ai-line" style={{ cursor: 'default' }}><Kw>const</Kw> <Vr>shahar</Vr> <Op>=</Op> <St>"Toshkent"</St></div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda xato? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 "Aziza" ga qo'shtirnoq qo'shish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi kod ishlaydi!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              picked && picked !== 'ism'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri. Yana qarang: qaysi matn qiymatida <b>qo'shtirnoq yetishmayapti</b>?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: matn qiymati doim <b style={{ color: T.ink }}>qo'shtirnoq ichida</b> bo'lishi kerak. Qaysi qatorda yo'q?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">Aziza</span> qo'shtirnoqsiz — kompyuter uni o'zgaruvchi deb o'ylab, topolmayapti. To'g'risi: <span className="mono">"Aziza"</span>. Chap tugmani bosing →</p></div>)}
            {fixed && (<>
              <p className="flow-label">Endi ishlaydi</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}><VarBox name="ism" value={'"Aziza"'} valColor={CODE.str} small /></div>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">Matn = qo'shtirnoq ichida</p></div>
            </>)}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (o'zgaruvchini o'zi yozadi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana, eng muhim lahza. Shu paytgacha qutilarni qo'l bilan to'ldirdingiz — endi birinchi qutingizni so'z bilan yozasiz. Ismingizni saqlaydigan o'zgaruvchi yozing: let, keyin nom, teng belgisi va qo'shtirnoqda ismingiz. Masalan: let ism teng qo'shtirnoqda Aziza.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.trim();
  const m = v.match(/^(let|const|var)\s+([A-Za-z_]\w*)\s*=\s*(.+)$/);
  const hasKw = /^(let|const|var)\b/.test(v);
  const hasName = /^(let|const|var)\s+[A-Za-z_]\w*/.test(v);
  const hasEq = /^(let|const|var)\s+[A-Za-z_]\w*\s*=/.test(v);
  const valid = !!m && m[3].trim().length > 0;
  const nm = valid ? m[2] : '';
  const vv = valid ? m[3].trim() : '';
  const valIsStr = /^".*"$/.test(vv) || /^'.*'$/.test(vv);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { correct: true, picked: value });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! Birinchi o'zgaruvchingizni o'zingiz yozdingiz. Tabriklayman!`); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'O\'zgaruvchini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: o'zgaruvchini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozing.</h2></div>
        <Mentor><b style={{ color: T.ink }}>Shu paytgacha qutilarni qo'l bilan to'ldirdingiz — endi birinchi qutingizni so'z bilan yozasiz.</b> Ismingizni saqlaydigan o'zgaruvchi yozing: <span className="mono">let</span>, keyin nom, <span className="mono">=</span> va qo'shtirnoqda ismingiz. Masalan: <span className="mono">let ism = "Aziza"</span>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <input className="fade-up delay-1" value={value} onChange={e => setValue(e.target.value)} placeholder={'let ism = "Aziza"'} spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasKw ? 1 : 0.4 }}>{hasKw ? '✓' : '1'} let / const</span>
              <span className="tagpill" style={{ opacity: hasName ? 1 : 0.4 }}>{hasName ? '✓' : '2'} nom</span>
              <span className="tagpill" style={{ opacity: hasEq ? 1 : 0.4 }}>{hasEq ? '✓' : '3'} =</span>
              <span className="tagpill" style={{ opacity: valid ? 1 : 0.4 }}>{valid ? '✓' : '4'} qiymat</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Bu — to'liq, to'g'ri o'zgaruvchi. Siz haqiqiy JavaScript yozdingiz!</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Matn qiymatini qo'shtirnoqqa oling: <span className="mono">"..."</span>. Raqam uchun qo'shtirnoq shart emas.</p>)}
          </Col>
          <Col>
            <p className="flow-label">natija — quti</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              {valid
                ? <VarBox name={nm} value={vv} valColor={valIsStr ? CODE.str : CODE.num} />
                : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'liq yozing — quti shu yerda paydo bo'ladi</p></div>}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== 🃏 FLASHCARDS (o'zgaruvchilar mavzusi — 3D flip takrorlash) =====
const JS_FLASHCARDS = [
  { front: 'Qiymat saqlaydigan nomlangan quti', back: "o'zgaruvchi", note: 'kod ichidagi qutilar' },
  { front: "O'zgarib turadigan qutini ochish", back: 'let', note: "qiymatini keyin almashtirsa bo'ladi" },
  { front: "O'zgarmas (qulflangan) qutini ochish", back: 'const', note: "qiymati o'zgarmaydi" },
  { front: 'Qutiga qiymat solish belgisi', back: '=', note: '"o\'zlashtir" — teng emas' },
  { front: "Matn (so'z, gap) turi", back: 'string', note: 'qo\'shtirnoqda: "Aziza"' },
  { front: 'Raqam turi', back: 'number', note: "qo'shtirnoqsiz: 14, 3.14" },
  { front: "Ha / yo'q (rost / yolg'on) turi", back: 'boolean', note: 'true yoki false' },
  { front: '"14" — qo\'shtirnoqdagi qiymat turi', back: 'string', note: "raqamga o'xshasa ham — matn" },
  { front: 'Bugun ishlatilmaydigan eski usul', back: 'var', note: "o'rniga let / const" },
  { front: "Nom bo'sh joysiz, raqam bilan boshlanmasin", back: 'nomlash qoidasi', note: "ism, tugilgan_yil — to'g'ri" },
];
function Flashcards({ cards }) {
  const [queue, setQueue] = useState(() => cards.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [exiting, setExiting] = useState(null); // 'knew' | 'again' — karta uchib chiqish animatsiyasi (Quizlet uslubi)
  const swapRef = useRef(0);                    // har almashishda karta remount bo'lib, kirish animatsiyasi o'ynaydi
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
    <div className="fc-done fade-up"><span className="fc-done-emoji">🎉</span><p className="fc-done-h">Hammasini bilasiz!</p><p className="fc-done-s">{total}/{total} karta yodlandi</p><button className="fc-btn ghost" onClick={restart}>↻ Qaytadan takrorlash</button></div>
  );
  return (
    <div className="fc fade-up">
      <div className="fc-top"><span className="fc-pill learn" key={`l-${queue.length}-${swapRef.current}`}>↻ O'rganilmoqda · <b>{queue.length}</b></span><span className="fc-pill knew" key={`k-${known}`}>✓ Bildim · <b>{known}</b></span></div>
      <div className="fc-bar"><span className="fc-bar-fill" style={{ width: `${(known / total) * 100}%` }} /></div>
      <div className="fc-cardwrap">
        <div className={`fc-fly ${exiting === 'knew' ? 'out-knew' : ''} ${exiting === 'again' ? 'out-again' : ''}`} key={swapRef.current}>
        <div className={`fc-card ${flipped ? 'flip' : ''}`} onClick={() => !flipped && !exiting && setFlipped(true)} role="button" tabIndex={0}>
          <div className="fc-face fc-front"><span className="fc-q">{card.front}</span><span className="fc-cue">Qaysi so'z? 🤔 <span className="fc-tap">bosing</span></span></div>
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
const ScreenFlashcards = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 'sflash', text: `Darsni yakunlashdan oldin, bugun o'rgangan so'zlarni tez takrorlaymiz. Har kartada bir tushuncha — qaysi so'z ekanini o'ylang, keyin kartani bosib tekshiring.`, trigger: 'on_mount', waits_for: null }]);
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []); // eslint-disable-line
  return (
    <Stage eyebrow="Takrorlash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={false} label="Yakunlash →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">So'zlarni <span className="italic" style={{ color: T.accent }}>tez takrorlaymiz</span>.</h2></div>
        <Mentor>Darsni yakunlashdan oldin bugun o'rgangan so'zlarni takrorlaymiz. Har kartada bir tushuncha — <b style={{ color: T.ink }}>qaysi so'z</b> ekanini o'ylang, keyin kartani bosib tekshiring. <b style={{ color: T.ink }}>Bildim</b> yoki <b style={{ color: T.ink }}>Takrorlash</b> bilan baholang.</Mentor>
        <div className="fc-center"><Flashcards cards={JS_FLASHCARDS} /></div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, achievements, onReset, onPrev, onFinish }) => {
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
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz — bugun siz birinchi haqiqiy JavaScript kodingizni yozdingiz! Eslab qoling: o'zgaruvchi — nomlangan quti, let o'zgaradi, const o'zgarmaydi, qiymatlar esa matn, raqam yoki boolean bo'ladi. Keyingi darsda o'zgaruvchilarni ekranga chiqarib, ular bilan amallar bajaramiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ["O'zgaruvchi — qiymat saqlaydigan nomlangan quti", "Qiymat berish: = (\"qutiga sol\")", "let — o'zgaradi, const — o'zgarmas", "var — eski usul, bugun let/const", "Turlar: matn (string), raqam (number), boolean"];
  const HOMEWORK = [{ b: 'ism', t: "— let bilan, qo'shtirnoqda" }, { b: 'yosh', t: "— let bilan, qo'shtirnoqsiz raqam" }, { b: 'tugilgan_yil', t: '— const bilan' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Birinchi <span className="italic" style={{ color: T.accent }}>JavaScript</span> kodingizni yozdingiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi o'zgaruvchilar bilan ishlay olasiz — let, const va ma'lumot turlari sizniki." : "Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className={`qz-cta cs-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <CsWordmark
            stats={false}
            bolt={false}
            disabled={studentWait}
            onClick={studentWait ? undefined : openArena}
            hint={studentWait ? '⏳ Mentorni kuting' : undefined}
          />
        </div>
        {arena && <QuizArena live={_live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'zingiz haqingizda 3 ta o'zgaruvchi yozing:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b className="mono">{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Avval qo'lda yozing, keyin to'g'ri-noto'g'risini tekshiring. Keyingi darsda ularni ekranga chiqaramiz! 🚀</p></div>
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
// Podium yorliqlari (scored indeks -> qisqa nom)
const Q_LABELS = { 4: '1 — O\'zgaruvchi nima', 6: '2 — let (o\'zgaradigan)', 10: '3 — const (o\'zgarmas)', 13: '4 — Raqam (number)', 16: '5 — O\'zgaruvchi yoz' };

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
const INLINE_KEYS = { s4: 0, s5b: 1, s9: 2, s12: 1, s15: -1 };

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
const QUIZ_MS = 15000;
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#FF5A2C', '#0FA6D6', '#F5A623', '#22A05C']; // CodeStrike brend palitrasi: coral · ocean · sun · leaf
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
// Arena foni: suzuvchi kod tokenlari (JS o'zgaruvchilar mavzusi)
const QZ_BG_SHAPES = [
  { ch: 'let',   l: 6,  t: 18, s: 40, c: 'rgba(20,17,14,0.05)',   d: 19, dl: 0 },
  { ch: 'const', l: 82, t: 12, s: 32, c: 'rgba(255,79,40,0.08)',  d: 23, dl: 1.5 },
  { ch: '=',     l: 9,  t: 74, s: 44, c: 'rgba(20,17,14,0.05)',   d: 27, dl: 0.8 },
  { ch: '"..."', l: 76, t: 70, s: 30, c: 'rgba(15,166,214,0.09)', d: 21, dl: 2.2 },
  { ch: '10',    l: 46, t: 86, s: 34, c: 'rgba(245,166,35,0.10)', d: 25, dl: 1.1 },
  { ch: '{ }',   l: 66, t: 24, s: 30, c: 'rgba(20,17,14,0.05)',   d: 17, dl: 0.4 },
  { ch: ';',     l: 24, t: 36, s: 28, c: 'rgba(20,17,14,0.05)',   d: 20, dl: 1.9 },
  { ch: 'true',  l: 92, t: 46, s: 24, c: 'rgba(34,160,92,0.09)',  d: 24, dl: 1.3 },
  { ch: '//',    l: 2,  t: 46, s: 28, c: 'rgba(20,17,14,0.045)',  d: 26, dl: 2.6 },
];
const QUIZ_BANK = [
  { q: "let ism = \"Aziza\" — bu yerda «quti»ning nomi qaysi?", opts: ["ism", "\"Aziza\"", "let", "="], correct: 0 },
  { q: "let yosh = 14 — 14 qanday ma'lumot turi?", opts: ["string (matn)", "number (raqam)", "boolean", "const"], correct: 1 },
  { q: "Qaysi qiymat string (matn) hisoblanadi?", opts: ["42", "true", "\"Toshkent\"", "3.14"], correct: 2 },
  { q: "const PI = 3.14 dan keyin PI = 3 desak nima bo'ladi?", opts: ["Xato beradi — const o'zgarmaydi", "PI qiymati 3 ga o'zgaradi", "Ikkala qiymat ham saqlanib qoladi", "PI o'chib ketadi"], correct: 0 },
  { q: "Kodda = belgisi aslida nimani bildiradi?", opts: ["Ikki qiymat bir-biriga teng", "Qutiga qiymat sol (o'zlashtir)", "Ikki qiymatni o'zaro taqqosla", "Qutidagi qiymatni o'chir"], correct: 1 },
  { q: "true va false qaysi ma'lumot turiga tegishli?", opts: ["string", "number", "boolean", "const"], correct: 2 },
  { q: "Qaysi holatda const ishlatgan ma'qul?", opts: ["Haftadagi kunlar soni (7)", "O'yin bali (o'zgarib turadi)", "Foydalanuvchi kiritgan matn", "Jon soni jangda"], correct: 0 },
  { q: "let ball = 10 keyin ball = 25 yozildi. ball qutisida endi nima?", opts: ["10", "25", "10 va 25", "Xato"], correct: 1 },
  { q: "let va const o'rtasidagi asosiy farq nima?", opts: ["let raqamga, const matnga mo'ljallangan", "const koddan ancha tezroq ishlaydi", "let keyin o'zgaradi, const o'zgarmaydi", "Ikkalasi aynan bir xil, farqi yo'q"], correct: 2 },
  { q: "\"14\" (qo'shtirnoqda) qanday tur?", opts: ["number — u bilan hisob qilinadi", "const", "boolean", "string — bu matn"], correct: 3 },
  { q: "var haqida to'g'ri gap qaysi?", opts: ["Zamonaviy standart, doim ishlating", "const bilan bir xil narsa", "Faqat raqamlar uchun", "Eski usul — bugun let/const afzal"], correct: 3 },
  { q: "let shahar = \"Toshkent\" da qiymat qo'shtirnoqda. Nega?", opts: ["Chunki u raqam", "Qo'shtirnoq shart emas edi", "Chunki u boolean", "Chunki u matn (string)"], correct: 3 },
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

// ⚡ CodeStrike mascot — chaqmoq (8.2)
const QzBolt = ({ size = 72 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="qz-bolt">
    <defs><linearGradient id="qzbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A3D" /><stop offset="1" stopColor="#FF4F28" /></linearGradient></defs>
    <rect x="6" y="6" width="88" height="88" rx="24" fill="url(#qzbg)" />
    <path d="M56 12 L28 54 L45 54 L38 88 L72 40 L53 40 Z" fill="#fff" stroke="#E23A16" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="76" cy="24" r="3.5" fill="#FFD9A8" /><circle cx="22" cy="72" r="2.6" fill="#FFD9A8" /><circle cx="80" cy="66" r="2.2" fill="#FFD9A8" />
  </svg>
);

// ⚡ Katta yonib turuvchi CODESTRIKE wordmark (CTA'da bosiladi, lobbyda ko'rsatiladi)
const CsWordmark = ({ onClick, disabled, hint, stats = true, bolt = true }) => {
  const clickable = !!onClick && !disabled;
  return (
    <div
      className={`cs-hero ${clickable ? 'cs-clickable' : ''} ${disabled ? 'cs-off' : ''}`}
      {...(clickable ? { role: 'button', tabIndex: 0, onClick, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } } : {})}
    >
      {bolt && <div className="cs-boltrow"><QzBolt size={48} /></div>}
      <div className="cs-word" data-text="CODESTRIKE" aria-label="CodeStrike">CODESTRIKE</div>
      {stats && (
        <div className="cs-chips">
          <span className="cs-chip"><b>{QUIZ_BANK.length}</b> savol</span>
          <span className="cs-chip"><b>{QUIZ_MS / 1000}</b> soniya</span>
          <span className="cs-chip">🏆 podium</span>
        </div>
      )}
      {hint && <span className={`cs-enter ${disabled ? 'wait' : ''}`}>{hint}</span>}
    </div>
  );
};

// Jonli fon: suzuvchi uchqunlar + «web» chiziqlari + kod tokenlari (canvas)
function QzFX() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = cv.getContext('2d'); const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, raf = 0;
    const size = () => { W = cv.width = Math.max(1, cv.offsetWidth * DPR); H = cv.height = Math.max(1, cv.offsetHeight * DPR); };
    size(); window.addEventListener('resize', size);
    const TOK = ['let', 'const', '=', '{ }', '//', '14', '"..."', ';'];
    const em = [], toks = [];
    for (let i = 0; i < 26; i++) em.push({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .7, ph: Math.random() * 6.28, sw: .3 + Math.random() * .6 });
    for (let i = 0; i < 9; i++) toks.push({ x: Math.random() * W, y: Math.random() * H, z: .4 + Math.random() * .9, vx: (Math.random() - .5) * .16, t: TOK[i % TOK.length], r: (Math.random() - .5) * .5 });
    const draw = (tm) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of em) { p.y -= (.15 + p.z * .35) * DPR; p.x += Math.sin(tm / 1400 + p.ph) * p.sw * DPR * .35; if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; } }
      ctx.lineWidth = 1 * DPR;
      for (let a = 0; a < em.length; a++) for (let b = a + 1; b < em.length; b++) { const dx = em[a].x - em[b].x, dy = em[a].y - em[b].y, d = Math.sqrt(dx * dx + dy * dy), mx = 95 * DPR; if (d < mx) { ctx.strokeStyle = 'rgba(255,79,40,' + (.055 * (1 - d / mx)) + ')'; ctx.beginPath(); ctx.moveTo(em[a].x, em[a].y); ctx.lineTo(em[b].x, em[b].y); ctx.stroke(); } }
      for (const p of em) { const s = (1.3 + p.z * 2.2) * DPR, tw = .16 + p.z * .24 + Math.sin(tm / 600 + p.ph) * .08; ctx.fillStyle = 'rgba(245,166,35,' + tw + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 6.29); ctx.fill(); }
      for (const t of toks) { t.x += t.vx * DPR; t.y -= (.08 + t.z * .12) * DPR; if (t.y < -34) t.y = H + 34; if (t.x < -50) t.x = W + 50; if (t.x > W + 50) t.x = -50; ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.r * .12); ctx.font = '700 ' + ((13 + t.z * 22) * DPR) + 'px "JetBrains Mono",monospace'; ctx.fillStyle = 'rgba(20,17,14,' + (.03 + t.z * .05) + ')'; ctx.textAlign = 'center'; ctx.fillText(t.t, 0, 0); ctx.restore(); }
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
      <QzFX />
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
          <CsWordmark />
          <p className="qz-sub">{QUIZ_BANK.length} savol · har biriga {QUIZ_MS / 1000} soniya · tezroq to'g'ri bossangiz — ko'proq ball. Ketma-ket to'g'ri javoblar 🔥 bonus beradi!</p>
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

      {/* ===== YAKUN — PODIUM ===== */}
      {phase === 'done' && (
        <div className="qz-view fade-step">
          <Confetti />
          <div className="qz-brand sm"><QzBolt size={48} /><span className="qz-wm">Code<span className="qz-wm-h">Strike</span></span></div>
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

// ===== 🏅 ACHIEVEMENTS (nishonlar) — dars davomidagi real bosqichlar uchun =====
const ACHIEVEMENTS = {
  boxkeeper:     { icon: '📦', name: 'Box Keeper',     desc: "O'zgaruvchi — nomlangan quti ekanini bildingiz" },
  lockmaster:    { icon: '🔒', name: 'Lock Master',    desc: "const bilan qutini qulflashni o'rgandingiz" },
  typedetective: { icon: '🔍', name: 'Type Detective', desc: "Ma'lumot turini (matn / raqam) aniqladingiz" },
  graduate:      { icon: '🏆', name: 'Level Up!',      desc: "Birinchi JavaScript darsini to'liq yakunladingiz" },
};
// Ekran id → nishon (recordAnswer'da, faqat to'g'ri javobga avtomatik beriladi)
const ACH_TRIGGERS = { s4: 'boxkeeper', s9: 'lockmaster', s12: 'typedetective' };
// 🏅 O'YIN USLUBIDAGI TO'LIQ-EKRAN NISHON BAYRAMI — yorqin nurlar, medal portlashi, uchqunlar
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
// Navbatda bittasi ko'rsatiladi (to'liq-ekran bayram) — tugagach keyingisi chiqadi
function AchToasts({ toasts, onDone }) {
  const t = toasts[0];
  const a = t && ACHIEVEMENTS[t.id];
  if (!a) return null;
  return <AchCelebrate key={t.k} ach={a} onDone={() => onDone(t.k)} />;
}

export default function JsVarsLesson({ lang: langProp, onFinished }) {
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
  const FLASH_IDX = SCREEN_META.findIndex(m => m.id === 'sflash');
  const flashHidden = () => live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const next = () => setScreen(s => { let n = Math.min(s + 1, TOTAL_SCREENS - 1); if (n === FLASH_IDX && flashHidden()) n = Math.min(n + 1, TOTAL_SCREENS - 1); return n; });
  const prev = () => setScreen(s => { let n = Math.max(s - 1, 0); if (n === FLASH_IDX && flashHidden()) n = Math.max(n - 1, 0); return n; });
  const recordAnswer = (idx, data) => {
    setAnswers(a => ({ ...a, [idx]: data }));
    const _m = SCREEN_META[idx];
    if (_m && _m.scored && _m.scope === 'final' && data && data.correct && live.mode === 'student') live.submitAnswer(idx, _m.id, 0, true, 0);
    if (_m && ACH_TRIGGERS[_m.id] && data && data.correct) earn(ACH_TRIGGERS[_m.id]); // 🏅 nishon
  };
  const reset = () => { setAnswers({}); setScreen(0); startTimeRef.current = Date.now(); };

  // Javob kaliti: inline testlar + jang savollari (QUIZ_BANK'dan) — mentor ochganda serverga yuklanadi
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const locked = isStudentLive && (screen + 1 > live.mentorScreen);
  useEffect(() => { live.reportScreen(screen); }, [screen, live.mode, live.pin]); // eslint-disable-line
  useEffect(() => { if (screen === TOTAL_SCREENS - 1) earn('graduate'); }, [screen, earn]); // 🏅 dars yakuni nishoni

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
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, ScreenPodium, ScreenFlashcards, Screen16];
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

        /* ── Jonli demo animatsiyalari ── */
        @keyframes pop-in { 0% { opacity: 0; transform: scale(.82) translateY(10px); } 55% { opacity: 1; transform: scale(1.05) translateY(0); } 100% { transform: scale(1); } }
        .pop-in { animation: pop-in .42s cubic-bezier(.34,1.4,.4,1); }
        @keyframes pop-num { 0% { transform: scale(.5); opacity: 0; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); } }
        .pop-num { animation: pop-num .5s cubic-bezier(.34,1.5,.4,1); display: inline-block; }
        @keyframes drop-in { 0% { opacity: 0; transform: translateY(-16px) scale(.8); } 60% { opacity: 1; transform: translateY(3px) scale(1.05); } 100% { transform: translateY(0) scale(1); } }
        .drop-in { animation: drop-in .5s cubic-bezier(.34,1.4,.4,1); }
        @keyframes shake-x { 0%,100% { transform: translateX(0); } 18% { transform: translateX(-6px); } 38% { transform: translateX(6px); } 58% { transform: translateX(-4px); } 78% { transform: translateX(4px); } }
        .shake-x { animation: shake-x .45s ease; }
        @keyframes ring-green { 0% { box-shadow: 0 0 0 0 rgba(31,122,77,.5); } 70% { box-shadow: 0 0 0 16px rgba(31,122,77,0); } 100% { box-shadow: 0 0 0 0 rgba(31,122,77,0); } }
        @keyframes ring-red { 0% { box-shadow: 0 0 0 0 rgba(255,79,40,.5); } 70% { box-shadow: 0 0 0 16px rgba(255,79,40,0); } 100% { box-shadow: 0 0 0 0 rgba(255,79,40,0); } }
        .ring-green { animation: ring-green 1.3s ease-out; } .ring-red { animation: ring-red 1.3s ease-out; }
        @keyframes flow-y { 0% { transform: translateY(-3px); opacity: .45; } 50% { transform: translateY(3px); opacity: 1; } 100% { transform: translateY(-3px); opacity: .45; } }
        .flow-y { animation: flow-y 1.1s ease-in-out infinite; display: inline-block; }

        /* ── 📦 OMBORCHI (warehouse) harakatlari — Ijodkor brifi ── */
        /* quti seskanishi: token qutiga tushganda quti "plop" bilan silkidi */
        @keyframes wh-jolt { 0%,100% { transform: translateY(0); } 22% { transform: translateY(5px); } 52% { transform: translateY(-2px); } 78% { transform: translateY(1px); } }
        .wh-jolt { animation: wh-jolt .42s cubic-bezier(.34,1.4,.4,1); }
        /* eski qiymat qutidan tushib ketadi (s5 refill) */
        @keyframes wh-fall { 0% { transform: translate(-50%,0) rotate(0); opacity: 1; } 15% { opacity: 1; } 100% { transform: translate(-50%,58px) rotate(16deg); opacity: 0; } }
        .wh-fall { animation: wh-fall .55s cubic-bezier(.5,.1,.9,.4) forwards; }
        /* const-qulf: rad etilgan token orqaga/yuqoriga uchib ketadi (s6) */
        @keyframes wh-reject { 0% { transform: translate(-50%,0) scale(1); opacity: 0; } 18% { transform: translate(-50%,-14px) scale(1.08); opacity: 1; } 55% { transform: translate(-50%,-42px) scale(.96) rotate(8deg); opacity: 1; } 100% { transform: translate(-50%,-88px) scale(.6) rotate(18deg); opacity: 0; } }
        .wh-reject { animation: wh-reject .62s cubic-bezier(.4,.05,.75,.5) forwards; }
        /* javonga quti terilishi: yuqoridan tushib bounce (s13) */
        @keyframes wh-shelve { 0% { transform: translateY(-24px) scale(.9); opacity: 0; } 55% { transform: translateY(4px) scale(1.05); opacity: 1; } 76% { transform: translateY(-1px) scale(.99); } 100% { transform: translateY(0) scale(1); } }
        .wh-shelve { animation: wh-shelve .5s cubic-bezier(.34,1.4,.4,1); }
        /* robot-qo'l O'QI: cho'zilish → ushlash → tortib chiqarish (s3) */
        @keyframes wh-arm { 0% { transform: translateX(-34px) scale(.7); opacity: 0; } 34% { transform: translateX(0) scale(1); opacity: 1; } 58% { transform: translateX(7px) scale(1.14); } 100% { transform: translateX(0) scale(1); opacity: 1; } }
        .wh-arm { animation: wh-arm .72s cubic-bezier(.34,1.3,.4,1); display: inline-block; }
        /* topolmadi: robot-qo'l paypaslaydi (s3 nomsiz quti) */
        @keyframes wh-grope { 0%,100% { transform: translateX(0) rotate(0); } 18% { transform: translateX(-8px) rotate(-9deg); } 44% { transform: translateX(8px) rotate(9deg); } 68% { transform: translateX(-4px) rotate(-4deg); } 86% { transform: translateX(3px) rotate(3deg); } }
        .wh-grope { animation: wh-grope .75s ease-in-out; display: inline-block; }
        /* bo'sh qaytish: token kulrang so'nadi */
        @keyframes wh-graygone { 0% { opacity: 1; filter: grayscale(0); } 100% { opacity: .32; filter: grayscale(1); } }
        .wh-graygone { animation: wh-graygone .6s ease forwards; }
        @media (prefers-reduced-motion: reduce) {
          .wh-jolt, .wh-shelve, .wh-arm, .wh-grope { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
          .wh-fall, .wh-reject { animation-duration: .2s !important; }
          .wh-graygone { animation: none !important; opacity: .32; filter: grayscale(1); }
        }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
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
        /* Quizlet uslubi: karta rangli muhr bilan chapga (✗ qizil) / o'ngga (✓ yashil) uchib ketadi */
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
        .fc-tag { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(30px,6vw,46px); letter-spacing: -0.02em; }
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
        /* === 🏅 ACHIEVEMENTS === */
        /* ===== 🏅 O'YIN USLUBIDAGI TO'LIQ-EKRAN NISHON BAYRAMI ===== */
        .acu-overlay { position: fixed; inset: 0; z-index: 11000; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer;
          background: radial-gradient(circle at 50% 42%, rgba(20,14,6,0.34) 0%, rgba(10,8,14,0.72) 62%, rgba(8,6,12,0.86) 100%);
          animation: acu-bg-in 0.35s ease-out, acu-bg-out 0.55s ease-in 3.45s forwards; }
        @keyframes acu-bg-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes acu-bg-out { to { opacity: 0; } }
        /* Aylanuvchi nur burjlari (butun ekran) */
        .acu-rays { position: absolute; top: 50%; left: 50%; width: 170vmax; height: 170vmax; transform: translate(-50%,-50%); pointer-events: none;
          background: repeating-conic-gradient(from 0deg, rgba(255,201,77,0.16) 0deg 7deg, transparent 7deg 20deg);
          -webkit-mask-image: radial-gradient(circle, #000 8%, rgba(0,0,0,0.55) 30%, transparent 62%); mask-image: radial-gradient(circle, #000 8%, rgba(0,0,0,0.55) 30%, transparent 62%);
          animation: acu-spin 16s linear infinite, acu-fade 0.6s ease-out; }
        @keyframes acu-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes acu-fade { from { opacity: 0; } to { opacity: 1; } }
        /* Markaziy yorug'lik */
        .acu-glow { position: absolute; top: 42%; left: 50%; width: 78vmin; height: 78vmin; transform: translate(-50%,-50%); pointer-events: none; filter: blur(4px);
          background: radial-gradient(circle, rgba(255,224,150,0.62) 0%, rgba(255,150,60,0.30) 38%, rgba(255,120,40,0) 68%);
          animation: acu-glow-pulse 2.2s ease-in-out infinite, acu-fade 0.5s ease-out; }
        @keyframes acu-glow-pulse { 0%,100% { opacity: 0.85; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.08); } }
        /* Zarba to'lqini (halqa) */
        .acu-ring { position: absolute; top: 42%; left: 50%; width: 130px; height: 130px; border-radius: 50%; border: 3px solid rgba(255,240,200,0.85); transform: translate(-50%,-50%) scale(0.3); pointer-events: none; animation: acu-shock 1s cubic-bezier(.2,.7,.3,1) forwards; }
        .acu-ring.d2 { border-color: rgba(255,180,90,0.6); animation-delay: 0.22s; }
        @keyframes acu-shock { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(6.5); opacity: 0; } }
        /* Sahna (medal + matn) */
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
        /* Yuqori paneldagi nishon hisoblagichi */
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
        /* === Jonli panel (LiveBadge) — xira turadi, ustiga borilganda tiniqlashadi (kontentni to'smaydi) === */
        .live-badge { opacity: 0.4; transition: opacity 0.25s ease, box-shadow 0.25s ease; }
        .live-badge:hover, .live-badge:focus-within { opacity: 1; box-shadow: 0 8px 24px -6px rgba(58,53,48,0.32) !important; }
        @media (hover: none) { .live-badge { opacity: 0.62; } }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); display: flex; align-items: center; justify-content: center; }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: cover; }
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

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.65; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        /* O'zgaruvchi qutisi */
        .var-box { display: inline-flex; flex-direction: column; min-width: 130px; border-radius: 14px; overflow: hidden; background: ${T.paper}; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.18); }
        .var-name { background: ${T.ink}; color: ${T.bg}; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12.5px; padding: 8px 14px; letter-spacing: 0.03em; display: flex; align-items: center; gap: 6px; }
        .var-val { padding: 16px 14px; font-family: 'JetBrains Mono', monospace; font-weight: 700; text-align: center; }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

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

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        /* OMBORCHI stellaj — iliq karton/yog'och javon: recessed rack + tekis grid */
        .stellaj { display: grid; grid-template-columns: repeat(auto-fill, 118px); justify-content: start; gap: 12px; min-height: 96px; align-content: start; padding: 16px 15px 18px; border-radius: 16px; background: ${T.bg}; border: 1px solid ${T.line}; box-shadow: inset 0 2px 8px -3px rgba(${T.shadowBase},0.20), inset 0 -13px 20px -16px rgba(${T.shadowBase},0.28); }
        .stellaj-empty { grid-column: 1 / -1; }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.3s ease-out; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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
        /* ===== ⚡ CODESTRIKE — CTA (dars ichida) ===== */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: linear-gradient(135deg, #FFF3EA, #FFE7DC); border: 1px solid #F3D9CC; border-radius: 20px; padding: clamp(16px,2.4vw,22px) clamp(18px,2.6vw,26px); box-shadow: 0 16px 40px -18px rgba(255,79,40,0.28); }
        .qz-cta-txt { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 3px; }
        .qz-cta-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(16px,2.2vw,20px); color: #121826; }
        .qz-cta-s { font-family: 'Manrope'; font-weight: 500; font-size: 13px; color: #525A6B; }
        .qz-cta-btn { background: linear-gradient(170deg,#FF8A3D,#FF4F28); color: #fff; border: none; border-radius: 14px; padding: 13px 24px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 12px 24px -8px rgba(255,79,40,0.6); transition: transform 0.2s; }
        .qz-cta-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
        .qz-cta-btn:disabled { background: #E9E6DF; color: #98A0B4; cursor: default; box-shadow: none; }
        .qz-cta.ready .qz-cta-btn { animation: qz-pulse 1.1s ease-in-out infinite; }
        @keyframes qz-pulse { 0%,100% { transform: scale(1); box-shadow: 0 12px 24px -8px rgba(255,79,40,0.6); } 50% { transform: scale(1.06); box-shadow: 0 16px 34px -6px rgba(255,79,40,0.9); } }

        /* ===== ⚡ CODESTRIKE — yorqin wordmark (3D + glint) ===== */
        .cs-cta { flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: clamp(8px,1.2vw,12px); position: relative; padding: clamp(14px,2vw,20px) clamp(16px,2.6vw,28px); background: radial-gradient(130% 130% at 50% 0%, #FFF2EA 0%, #FFE3D3 58%, #FFD4C0 100%); border-color: #F7C8B0; }
        .cs-cta::before { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(58% 74% at 50% 34%, rgba(255,95,30,0.20), transparent 72%); pointer-events: none; animation: cs-bg-breathe 3.4s ease-in-out infinite; }
        @keyframes cs-bg-breathe { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
        .cs-hero { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: clamp(6px,1vw,11px); text-align: center; width: 100%; }
        .cs-clickable { cursor: pointer; user-select: none; transition: transform .18s cubic-bezier(.2,1,.3,1); outline: none; }
        .cs-clickable:hover { transform: scale(1.04); }
        .cs-clickable:active { transform: scale(.985); }
        .cs-clickable:focus-visible .cs-word { outline: 2px dashed rgba(255,79,40,.6); outline-offset: 12px; border-radius: 10px; }
        .cs-off { opacity: .62; filter: saturate(.55); }

        .cs-boltrow { animation: cs-bolt-bob 2.2s ease-in-out infinite; margin-bottom: 2px; }
        @keyframes cs-bolt-bob { 0%,100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-7px) rotate(6deg); } }

        .cs-word { position: relative; display: inline-block; font-family: 'Manrope','Manrope Fallback',sans-serif; font-weight: 900;
          font-size: clamp(38px,7.4vw,82px); letter-spacing: .012em; line-height: 1;
          background: linear-gradient(178deg,#FF9A4D 0%,#FF6A2C 40%,#FF4F28 68%,#EA360F 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;
          transform-origin: center; animation: cs-throb 2.6s ease-in-out infinite; }
        .cs-word::before { content: attr(data-text); position: absolute; left: 0; top: 0; width: 100%; pointer-events: none;
          background: linear-gradient(100deg, transparent 34%, rgba(255,255,255,.92) 48%, rgba(255,255,255,.35) 54%, transparent 66%); background-size: 260% 100%;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;
          animation: cs-glint 3.4s cubic-bezier(.6,0,.4,1) infinite; }
        @keyframes cs-throb { 0%,100% { transform: scale(1); filter: drop-shadow(0 2px 0 #C42F0E) drop-shadow(0 7px 16px rgba(226,58,22,.42)); }
          50% { transform: scale(1.07); filter: drop-shadow(0 2px 0 #C42F0E) drop-shadow(0 12px 34px rgba(255,79,40,.8)); } }
        @keyframes cs-glint { 0% { background-position: 135% 0; } 60%,100% { background-position: -55% 0; } }
        .cs-clickable:hover .cs-word { animation-duration: 1.5s; }

        .cs-chips { display: flex; gap: clamp(8px,1.3vw,13px); flex-wrap: wrap; justify-content: center; }
        .cs-chip { display: inline-flex; align-items: baseline; gap: 5px; font-family: 'Manrope'; font-weight: 800; font-size: clamp(12px,1.55vw,15px); color: #9A3E1A;
          background: #fff; border: 1.5px solid rgba(255,79,40,.42); padding: 6px 15px; border-radius: 999px; box-shadow: 0 5px 16px -7px rgba(255,79,40,.5);
          animation: cs-chip-pop .5s cubic-bezier(.2,1.4,.4,1) both, cs-chip-glow 2.4s ease-in-out infinite; }
        .cs-chip b { font-size: clamp(16px,2.1vw,21px); font-weight: 900; color: #FF4F28; }
        .cs-chip:nth-child(2) { animation-delay: .09s, .35s; }
        .cs-chip:nth-child(3) { animation-delay: .18s, .7s; }
        @keyframes cs-chip-pop { from { transform: scale(.4) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes cs-chip-glow { 0%,100% { box-shadow: 0 5px 16px -7px rgba(255,79,40,.5); border-color: rgba(255,79,40,.42); } 50% { box-shadow: 0 8px 26px -5px rgba(255,79,40,.85); border-color: rgba(255,79,40,.8); } }

        .cs-enter { font-family: 'Manrope'; font-weight: 900; font-size: clamp(13px,1.8vw,17px); color: #E23A16; letter-spacing: .01em; animation: cs-enter-pulse 1.3s ease-in-out infinite; }
        .cs-enter.wait { color: #98A0B4; animation: none; }
        @keyframes cs-enter-pulse { 0%,100% { opacity: .72; transform: translateY(0) scale(1); } 50% { opacity: 1; transform: translateY(2px) scale(1.03); } }
        @media (prefers-reduced-motion: reduce) { .cs-word, .cs-word::before, .cs-chip, .cs-enter, .cs-boltrow, .cs-cta::before { animation: none !important; } }
        @media (max-width: 560px) { .cs-word { font-size: clamp(34px,11vw,58px); } }

        /* ===== ⚡ ARENA — issiq CoddyCamp muhiti ===== */
        .qz-arena { position: fixed; inset: 0; z-index: 10500; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; padding: clamp(18px,4vw,44px) clamp(12px,3vw,32px); background: radial-gradient(60% 45% at 12% 8%, rgba(255,79,40,0.10) 0%, rgba(255,79,40,0) 55%), radial-gradient(58% 48% at 90% 14%, rgba(15,166,214,0.16) 0%, rgba(15,166,214,0) 55%), radial-gradient(60% 50% at 78% 100%, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0) 60%), radial-gradient(80% 48% at 50% -6%, #E9F0FD 0%, rgba(233,240,253,0) 52%), #F0F4FC; }
        .qz-arena::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: radial-gradient(rgba(30,44,80,0.05) 1.1px, transparent 1.2px); background-size: 24px 24px; -webkit-mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); }
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; animation: qz-drift ease-in-out infinite; will-change: transform; }
        @keyframes qz-drift { 0%,100% { transform: translate(0,0) rotate(-6deg) scale(1); } 50% { transform: translate(18px,-24px) rotate(6deg) scale(1.05); } }
        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .qz-shp { animation: none; } }
        .qz-x { position: fixed; top: 14px; right: 16px; z-index: 10600; width: 38px; height: 38px; border-radius: 50%; border: 1px solid #DDE4F1; background: #fff; color: #525A6B; font-size: 16px; cursor: pointer; box-shadow: 0 6px 16px -8px rgba(30,44,80,0.4); transition: transform 0.25s, color 0.2s; }
        .qz-x:hover { color: #121826; transform: rotate(90deg); }
        .qz-view { position: relative; z-index: 1; width: 100%; max-width: 820px; display: flex; flex-direction: column; align-items: center; gap: clamp(14px,2.4vw,22px); margin: auto; }
        .qz-brand { display: flex; align-items: center; gap: 12px; }
        .qz-brand.sm { gap: 9px; }
        .qz-bolt { filter: drop-shadow(0 8px 18px rgba(255,79,40,0.32)); }
        .qz-wm { font-family: 'Manrope'; font-weight: 800; font-size: clamp(28px,5vw,46px); letter-spacing: -0.03em; color: #121826; line-height: 1; }
        .qz-wm-h { color: #FF4F28; }
        .qz-logo { font-size: clamp(44px,8vw,72px); line-height: 1; }
        .qz-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(22px,4vw,36px); color: #121826; margin: 0; text-align: center; letter-spacing: -0.02em; }
        .qz-sub { font-family: 'Manrope'; font-size: clamp(13px,1.9vw,16px); color: #525A6B; margin: 0; text-align: center; max-width: 540px; line-height: 1.55; font-weight: 500; }
        .qz-sub b { color: #121826; }
        .qz-dimtxt { color: #98A0B4; font-family: 'Manrope'; font-size: 14px; font-style: italic; }
        .qz-lobby-players { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 640px; }
        .qz-pchip { background: #fff; border: 1.5px solid #DDE4F1; color: #121826; font-family: 'Manrope'; font-weight: 700; font-size: 14px; border-radius: 99px; padding: 7px 16px; box-shadow: 0 5px 12px -8px rgba(30,44,80,0.3); animation: qz-pop 0.4s cubic-bezier(.34,1.5,.4,1); }
        .qz-pchip.me { background: linear-gradient(170deg,#FF8A3D,#FF4F28); color: #fff; border-color: transparent; }
        @keyframes qz-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .qz-btn { background: linear-gradient(170deg,#FF8A3D,#FF4F28); color: #fff; border: none; border-radius: 14px; padding: 13px 26px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 14px 26px -10px rgba(255,79,40,0.6), inset 0 2px 0 rgba(255,255,255,0.3); transition: transform 0.18s; }
        .qz-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .qz-btn:disabled { opacity: 0.5; cursor: default; }
        .qz-btn.big { font-size: clamp(16px,2.2vw,19px); padding: clamp(15px,2vw,18px) clamp(32px,4vw,46px); }
        .qz-btn.ghost { background: #fff; color: #121826; border: 1.5px solid #DDE4F1; box-shadow: 0 6px 16px -10px rgba(30,44,80,0.4); }
        .qz-waitmsg { margin: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14.5px; color: #12A968; text-align: center; }
        .qz-qview { max-width: 880px; }
        .qz-top { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .qz-count { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.8vw,16px); color: #525A6B; }
        .qz-count b { color: #121826; font-size: 1.25em; }
        .qz-ansn { font-family: 'Manrope'; font-weight: 800; font-size: clamp(13px,1.8vw,16px); color: #FF4F28; min-width: 64px; text-align: right; }
        .qz-timer { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
        .qz-timer-n { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 20px; }
        .qz-timer.urgent { animation: qz-shake 0.5s ease-in-out infinite; }
        @keyframes qz-shake { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .qz-q { font-family: 'Manrope'; font-weight: 800; font-size: clamp(19px,3.2vw,28px); color: #121826; margin: 0; text-align: center; line-height: 1.35; background: #fff; border: 1px solid #DDE4F1; border-radius: 20px; padding: clamp(18px,2.8vw,28px) clamp(18px,3vw,30px); width: 100%; box-shadow: 0 14px 34px -20px rgba(30,44,80,0.4); text-wrap: balance; }
        .qz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(11px,1.6vw,15px); width: 100%; }
        @media (max-width: 560px) { .qz-grid { grid-template-columns: 1fr; } .qz-wm { font-size: clamp(24px,7vw,34px); } }
        .qz-tile { position: relative; display: flex; align-items: center; gap: 14px; border: none; border-radius: 18px; padding: clamp(15px,2.4vw,22px) clamp(14px,2.2vw,20px); cursor: pointer; text-align: left; min-height: 66px; color: #fff; overflow: hidden; box-shadow: 0 14px 26px -14px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -4px 0 rgba(0,0,0,0.16); transition: transform 0.14s, opacity 0.3s, box-shadow 0.14s, filter 0.2s; }
        .qz-tile:hover:not(:disabled):not(.rv) { transform: translateY(-3px); box-shadow: 0 20px 34px -14px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.18); }
        .qz-tile:active:not(:disabled):not(.rv) { transform: translateY(2px) scale(0.985); }
        .qz-tile:disabled { cursor: default; }
        .qz-shape { width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,0.22); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.35); display: flex; align-items: center; justify-content: center; font-size: clamp(16px,2.2vw,20px); color: #fff; flex-shrink: 0; }
        .qz-opt { flex: 1; font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(14px,2vw,17px); color: #fff; line-height: 1.3; letter-spacing: -0.01em; }
        .qz-tile.faded { filter: saturate(0.5); opacity: 0.4; }
        .qz-tile.picked { outline: 3px solid #fff; box-shadow: 0 0 0 4px rgba(255,255,255,0.4), 0 14px 26px -12px rgba(0,0,0,0.4); animation: qz-pop 0.3s; }
        .qz-pbadge { position: absolute; top: -9px; right: -7px; width: 27px; height: 27px; border-radius: 50%; background: #fff; color: #12A968; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 12px rgba(0,0,0,0.28); }
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }
        .qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
        .qz-tile.rv.win { outline: 4px solid #fff; box-shadow: 0 0 0 5px rgba(18,169,104,0.35), 0 0 44px rgba(18,169,104,0.45), 0 14px 30px -12px rgba(0,0,0,0.4); animation: qz-pop 0.4s; }
        .qz-tile.rv.lose { filter: saturate(0.45); opacity: 0.4; }
        .qz-cnt { font-family: 'Manrope'; font-weight: 800; font-size: clamp(15px,2.2vw,19px); color: #fff; background: rgba(0,0,0,0.22); border-radius: 99px; padding: 4px 13px; flex-shrink: 0; margin-left: auto; font-variant-numeric: tabular-nums; }
        .qz-mrow { display: flex; align-items: center; gap: 14px; }
        .qz-allin { font-family: 'Manrope'; font-weight: 700; font-size: 15px; color: #12A968; animation: qz-pop 0.4s; }
        .qz-res { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; justify-content: center; border-radius: 16px; padding: 14px 26px; animation: qz-pop 0.45s cubic-bezier(.34,1.5,.4,1); }
        .qz-res.good { background: rgba(18,169,104,0.12); outline: 1.5px solid rgba(18,169,104,0.4); }
        .qz-res.bad { background: rgba(226,72,72,0.1); outline: 1.5px solid rgba(226,72,72,0.35); }
        .qz-res-pts { font-family: 'Manrope'; font-weight: 800; font-size: clamp(28px,4.4vw,40px); color: #12A968; line-height: 1; font-variant-numeric: tabular-nums; }
        .qz-res-t { font-family: 'Manrope'; font-weight: 700; font-size: clamp(14px,2vw,17px); color: #121826; }
        .qz-res-rank { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; color: #525A6B; width: 100%; text-align: center; }
        .qz-board { width: 100%; max-width: 480px; background: #fff; border: 1px solid #DDE4F1; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 16px 36px -22px rgba(30,44,80,0.45); }
        .qz-board.wide { max-width: 640px; max-height: 260px; overflow: auto; }
        .qz-board-h { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; letter-spacing: 0.1em; color: #FF4F28; margin-bottom: 3px; text-transform: uppercase; }
        .qz-brow { display: flex; align-items: center; gap: 10px; padding: 8px 11px; border-radius: 11px; background: #E6ECF8; }
        .qz-brow.me { background: linear-gradient(90deg,rgba(18,169,104,0.20),rgba(18,169,104,0.05)); outline: 1.5px solid rgba(18,169,104,0.5); }
        .qz-brank { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; color: #fff; background: #98A0B4; border-radius: 8px; min-width: 23px; height: 23px; display: flex; align-items: center; justify-content: center; }
        .qz-brow:first-of-type .qz-brank { background: #FFCE3D; color: #121826; }
        .qz-brow.me .qz-brank { background: #12A968; }
        .qz-bname { flex: 1; min-width: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14.5px; color: #121826; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-bstreak { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: #FF8A3D; }
        .qz-bok { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: #525A6B; }
        .qz-bpts { font-family: 'Manrope'; font-weight: 800; font-size: 15px; color: #FF4F28; min-width: 52px; text-align: right; font-variant-numeric: tabular-nums; }
        .qz-pod { display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px,2.4vw,24px); padding-top: 18px; }
        .qz-pod-col { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; width: clamp(92px,24vw,170px); }
        .qz-crown { position: absolute; top: -30px; font-size: 28px; animation: qz-float-sm 2s ease-in-out infinite; }
        @keyframes qz-float-sm { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }
        .qz-pod-medal { font-size: clamp(30px,5vw,46px); line-height: 1; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.16)); }
        .qz-pod-name { font-family: 'Manrope'; font-weight: 800; font-size: clamp(14px,2vw,18px); color: #121826; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-pod-pts { font-family: 'Manrope'; font-weight: 600; font-size: clamp(11px,1.5vw,13px); color: #525A6B; font-variant-numeric: tabular-nums; }
        .qz-pod-bar { width: 100%; border-radius: 14px 14px 0 0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.45); animation: qz-rise 0.9s cubic-bezier(.3,1.2,.4,1); transform-origin: bottom; }
        @keyframes qz-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .qz-pod-col.p1 .qz-pod-bar { height: clamp(96px,14vw,156px); background: linear-gradient(180deg, #FFCE3D, #F5A623); box-shadow: inset 0 2px 0 rgba(255,255,255,0.5), 0 0 40px rgba(245,166,35,0.35); }
        .qz-pod-col.p2 .qz-pod-bar { height: clamp(66px,10vw,110px); background: linear-gradient(180deg, #D6D9E0, #A2A8B4); }
        .qz-pod-col.p3 .qz-pod-bar { height: clamp(48px,7vw,82px); background: linear-gradient(180deg, #EDB183, #CB8149); }
        .qz-pod-col.me .qz-pod-name { color: #12A968; }
        .qz-mypl { margin: 0; font-family: 'Manrope'; font-size: 15px; color: #525A6B; }
        .qz-mypl b { color: #12A968; }
        .qz-solo-res { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .qz-solo-pts { font-family: 'Manrope'; font-weight: 800; font-size: clamp(52px,9vw,84px); line-height: 1; color: #FF4F28; text-shadow: 0 8px 30px rgba(255,79,40,0.3); font-variant-numeric: tabular-nums; }
        .qz-endnote { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 10600; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 94vw; background: rgba(255,255,255,0.92); border: 1px solid #DDE4F1; border-radius: 16px; padding: 10px 16px; color: #121826; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 13.5px; box-shadow: 0 12px 30px -14px rgba(30,44,80,0.4); backdrop-filter: blur(6px); }

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
        .pod-row.me { background: ${T.successSoft}; outline: 1.5px solid ${T.success}66; }
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
        <AchCtx.Provider value={earned}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="JS darsi" />
          ) : (
            <>
              <Current screen={screen} storedAnswer={answers[screen]} answers={answers} achievements={earned} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
              <AchToasts toasts={achToasts} onDone={(k) => setAchToasts(t => t.filter(x => x.k !== k))} />
              <LiveBadge live={live} total={TOTAL_SCREENS} />
            </>
          )}
        </div>
        </AchCtx.Provider>
      </LiveGateCtx.Provider>
    </LangContext.Provider>
  );
}
