import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// PM 1-DARS — KIM MENING FOYDALANUVCHIM? — PLATFORM STANDARD v16
// G'oya: har bir sayt — kimningdir REAL muammosiga yechim.
// Fikrlash yo'li: MUAMMO (qanday qiyinchilik) → KIM (kim uchun) → YECHIM (sayt qanday yordam beradi).
// Namunaviy darslik (JsIntro) dizayn tili: Split interaktiv demolar, animatsiyalar, rangli panellar.
// Har ekran global savol bilan ochiladi. Portfolioga urg'u yo'q.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };
const G = "Georgia, serif"; // "haqiqiy sayt" ko'rinishi uchun (HTML darslar standarti)

// ============================================================
// JONLI DARS (live) — InternetLesson bilan bir xil klient (toza fetch + polling).
// Server ham o'sha: barcha RPC/jadvallar dars-agnostik, lesson_id bilan ajratiladi.
// FARQ: teoriya orasidagi testlarda Kahoot-reveal — javob natijasi mentor
// «Natijani ochish»ni bosgunga qadar sir (supabase/live_phase8_reveal.sql SHART!).
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

// ===== IKONKALAR — abstrakt tushunchalar uchun toza chiziq, real ilovalar uchun rangli brend belgilari =====
const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  // abstrakt tushunchalar — joriy rangda (chiziqli)
  user: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.2-5.8 7-5.8s7 2.2 7 5.8" /></svg>),
  problem: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1 .9-1 1.7" /><path d="M12 16.7h.01" /></svg>),
  solution: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9.5 18h5" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.8 10.7c.7.6 1 1.1 1 1.8h5.6c0-.7.3-1.2 1-1.8A6 6 0 0 0 12 3z" /></svg>),
  arrow: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M4 12h14" /><path d="M13 6l6 6-6 6" /></svg>),
  check: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.3}><path d="M20 6L9 17l-5-5" /></svg>),
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  phone: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>),
  ball: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7.4l3.5 2.5-1.3 4.1H9.8L8.5 9.9z" /><path d="M12 3v4.4M4.4 8.6l4.1 1.3M19.6 8.6l-4.1 1.3M7 20l2.8-3.9M17 20l-2.8-3.9" /></svg>),
  // real ilovalar — o'z brend ranglari bilan (bolalar taniydigan belgilar)
  youtube: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="5" width="20" height="14" rx="4.2" fill="#FF0000" /><path d="M10 8.6v6.8L15.8 12z" fill="#fff" /></svg>),
  telegram: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><circle cx="12" cy="12" r="11" fill="#29A9EB" /><path d="M17.9 7.2l-2.05 9.4c-.15.68-.56.84-1.13.52l-3.1-2.28-1.5 1.44c-.16.16-.3.3-.62.3l.22-3.1 5.68-5.13c.25-.22-.05-.34-.38-.12l-7 4.42-3.02-.94c-.66-.2-.67-.66.14-.97l11.8-4.55c.55-.2 1.03.13.98.49z" fill="#fff" /></svg>),
  market: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><path d="M5 9.5h14V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" fill="#7B3FE4" fillOpacity="0.18" /><path d="M3.4 5.5h17.2l1.05 3.3a2.25 2.25 0 0 1-4.35.55 2.25 2.25 0 0 1-4.3 0 2.25 2.25 0 0 1-4.3 0 2.25 2.25 0 0 1-4.35-.55z" fill="#7B3FE4" /><rect x="9.7" y="13" width="4.6" height="7" rx="0.8" fill="#7B3FE4" /></svg>),
  taxi: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><path d="M4 16.2l1.5-4.9A2.5 2.5 0 0 1 7.9 9.6h8.2a2.5 2.5 0 0 1 2.4 1.7l1.5 4.9v3a.8.8 0 0 1-.8.8h-1.5a.8.8 0 0 1-.8-.8V19H6.6v.2a.8.8 0 0 1-.8.8H4.3a.8.8 0 0 1-.8-.8z" fill="#FFB300" /><rect x="9" y="6.4" width="6" height="2.6" rx="0.5" fill="#222" /><circle cx="7.6" cy="16.4" r="1.15" fill="#222" /><circle cx="16.4" cy="16.4" r="1.15" fill="#222" /></svg>)
};

const LESSON_META = { lessonId: 'pm-audience-01-v17', lessonTitle: { uz: 'Kim mening foydalanuvchim?', ru: 'Кто мой пользователь?' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5b', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'practice',    template: 'custom',   scored: false, scope: null },
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
// Podium sahifasidagi savol-statistika yorliqlari (indeks → qisqa nom)
const Q_LABELS = { 4: '1 — Sayt nima uchun', 6: '2 — Hamma uchun', 10: '3 — PM savoli', 13: "4 — To'liq g'oya", 16: "5 — O'z g'oyasi ✍️" };
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 60; // InternetLesson layout standarti: 1100px konteyner + 60px padding
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
const NavNext = ({ disabled, label = 'Davom etish', onClick, optionalLive }) => {
  const gate = useContext(LiveGateCtx);
  const locked = !!(gate && gate.locked); // jonli darsda mentordan oldinga o'tib bo'lmaydi
  // optionalLive: animatsiya-mashq sahifalari. Jonli dars DAVOMIDA (o'quvchi hali ozod
  // qilinmagan) bajarish majburiy emas — mentor proyektorda ko'rsatadi, o'quvchi orqada
  // qolmasin. Erkin rejimda (ended / mentor uzilgan / self) yana MAJBURIY bo'ladi.
  // Testlar, s6 (amaliyot) va s15 (yakuniy g'oya) optionalLive bermaydi — doim majburiy.
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

// Recap chegaralari va kontenti — 3-qadamda to'ldiriladi (hozircha bo'sh stub)
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
const RECAPS = {
  // s4 — «Sayt nima uchun yaratiladi?» (nazariya: s2 sayt=yechim + s3 muammo-yurak)
  4: {
    title: 'Sayt = muammoga yechim', cards: [
      { ic: '💡', h: 'Har bir sayt bitta muammoni yechadi',
        body: <>YouTube — zerikish, taksi ilovasi — mashina kutish, Telegram — uzoqdagi do'st bilan gaplashish. Birortasi ham «shunchaki» paydo bo'lmagan: <b>avval muammo bor edi, sayt uni yechdi</b>.</>,
        vis: <RcFlow items={['😕 Muammo bor', '🌐 Sayt yechdi', '😊 Odam qaytib keladi']} />,
        ask: 'Sevimli saytingiz sizning qaysi muammoyingizni yechadi?' },
      { ic: '❤️', h: 'Muammo — saytning yuragi',
        body: <>Limonad saytini eslang: odam chanqagan ekan — kirdi, chanqoq yo'qoldi — sayt <b>huvillab qoldi</b>. Muammo yo'q joyda sayt yashamaydi.</>,
        vis: <RcFlow items={['😥 Chanqagan odam', '🍋 Limonad sayti — 120 kishi/kun']} /> },
      { ic: '🏆', h: 'Mashhurlik va pul — NATIJA, sabab emas',
        body: <>Avval muammo yaxshi yechiladi → odamlar o'zi kirib keladi → shundan keyingina sayt mashhur bo'ladi va pul topadi. <b>Tartibni almashtirib bo'lmaydi.</b></>,
        vis: <RcFlow items={['✅ Muammo yechildi', "👥 Odamlar keldi", '⭐ Mashhurlik + pul']} /> },
    ]
  },
  // s5b — «Hamma uchun sayt nega kam ishlaydi?» (nazariya: s5 aniq odam)
  6: {
    title: 'Aniq odam — kuch', cards: [
      { ic: '🎯', h: '«Hamma uchun» = «hech kim uchun»',
        body: <>Hammaga birdek yoqadigan narsa bo'lmaydi: issiq choy istagan buviga ham, muzdek kola istagan bolaga ham <b>bir xil gapirsangiz</b> — ikkisi ham chiqib ketadi.</>,
        vis: <RcFlow items={['👵 buviga — issiq choy', '🧒 bolaga — muzdek kola']} sep="·" /> },
      { ic: '🔍', h: 'Aniq odam tanlash — kamchilik emas, KUCH',
        body: <>«Issiq kunda chanqagan o'tkinchilar uchun park yonida muzdek limonad» — endi saytda nima yozishni aniq bilasiz: <b>qayerda, nechpul, qanchalik muzdek</b>.</>,
        vis: <RcFlow items={['KIM aniq', 'MUAMMO aniq', 'YECHIM ham aniq']} />,
        ask: "O'zingiz izlagan narsani «hamma uchun» saytdan topish osonmi?" },
      { ic: '🚪', h: 'Aniqlik bo\'lmasa — odam chiqib ketadi',
        body: <>Odam saytga kirib <b>aynan o'ziga keraklisini</b> topa olmasa — bir kirib, qaytib kelmaydi. Reklama ham, chiroyli dizayn ham buni qutqarolmaydi.</>,
        vis: <RcFlow items={['🚪 Kirdi', '🤷 Topolmadi', '👋 Qaytib kelmaydi']} /> },
    ]
  },
  // s9 — «PM birinchi qaysi savolni beradi?» (nazariya: s7 zanjir + s8 har xil odam)
  10: {
    title: 'PM ning birinchi savoli', cards: [
      { ic: '🧑‍💼', h: 'PM avval so\'raydi: KIM va qanday MUAMMO?',
        body: <>Dizayn, nom, narx — bularning hammasi <b>keyin</b>. KIM va MUAMMO aniq bo'lsa, qolgan javoblar o'z-o'zidan kelib chiqadi.</>,
        vis: <RcFlow items={['1️⃣ KIM?', '2️⃣ MUAMMO?', '3️⃣ YECHIM?']} /> },
      { ic: '⛓️', h: 'G\'oya zanjir bo\'lib yig\'iladi',
        body: <>Buvini eslang: <b>KIM</b> — non yopadigan buvi → <b>MUAMMO</b> — xaridor topolmaydi → <b>YECHIM</b> — buyurtma sayti. Har javob keyingi savolni ochadi.</>,
        vis: <RcFlow items={['👵 Buvi', '❓ Xaridor yo\'q', '🌐 Buyurtma sayti']} />,
        ask: 'Do\'stingiz «sayt qilmoqchiman» desa, unga birinchi nima deysiz?' },
      { ic: '👀', h: 'Har foydalanuvchi o\'z narsasini izlaydi',
        body: <>Bitta saytda buvi <b>buyurtmalarga</b>, xaridor <b>narxga</b>, kuryer <b>manzilga</b> qaraydi. Shuning uchun PM avval <b>asosiy odamni</b> tanlab, saytni unga qulay qiladi.</>,
        vis: <RcFlow items={['👵 buyurtmalar', '🙋 narx', '🛵 manzil']} sep="·" /> },
    ]
  },
  // s12 — «Qaysi g'oya TO'LIQ?» (nazariya: s10 moslash + s11 yig'ish)
  13: {
    title: 'To\'liq g\'oya formulasi', cards: [
      { ic: '🧩', h: 'To\'liq g\'oya = KIM + MUAMMO + YECHIM',
        body: <>Uch bo'lakning bittasi yetishmasa — g'oya <b>chala</b>: nima qurishni ham, kimga kerakligini ham bilmaysiz. Uchalasi bo'lsagina «TO'LIQ» muhrini oladi.</>,
        vis: <RcFlow items={['👤 KIM', '❓ MUAMMO', '💡 YECHIM']} sep="+" /> },
      { ic: '⚖️', h: 'Yechim aynan O\'SHA muammoga mos bo\'lsin',
        body: <>Avtobus kutgan odamga — jonli xarita, telefon tanlaganga — taqqoslash sayti. Yechim boshqa muammoniki bo'lsa — <b>hech kimga foydasi tegmaydi</b>.</>,
        vis: <RcFlow items={['🚌 Kutish muammosi', '🗺️ Jonli xarita']} /> },
      { ic: '🔍', h: 'Chala g\'oyani bir savol fosh qiladi',
        body: <>«Juda chiroyli sport sayti qilamiz» — KIM uchun? Qaysi MUAMMOga? Javob yo'q — demak bu g'oya emas, shunchaki istak. <b>PM doim uch katakni tekshiradi.</b></>,
        vis: <RcFlow items={['💭 Istak', '❓ 3 savol', '✅ G\'oya']} />,
        ask: '«O\'quvchilar uchun hamma narsa bo\'lgan sayt» — bu g\'oyaning nimasi chala?' },
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

// ===== MENTOR STATISTIKASI — test ekranida jonli natija (InternetLesson bilan bir xil) =====
// DIQQAT: mentor ekrani PROYEKTORGA chiqadi — shuning uchun reveal'gacha panel
// HECH NARSANI oshkor qilmaydi: na variant taqsimoti, na ✅/❌ soni. Faqat
// «javob berdi X/Y» va kim kutilayotgani ko'rinadi. «Natijani ochish»da hammasi birdan ochiladi.
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
      <div className="mentor-ava" aria-hidden="true">🧑‍🏫</div>
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

// Brauzer oynasi — "haqiqiy sayt" maketi (HTML darslar dizayni)
const Preview = ({ url, children, minH }) => (
  <div className="bp-window fade-up delay-1">
    <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-url"><span className="lock">●</span>{url}</span></div>
    <div className="bp-body" style={{ minHeight: minH }}>{children}</div>
  </div>
);

// Sayt maketi ichidagi mini landing-page
const SiteMock = ({ logo = 'S', color = T.accent, name = 'Sayt', headline, sub, rows, cta }) => (
  <div className="pg-in" key={name + (headline || '')}>
    <div className="site-header"><span className="site-brand"><span className="site-logo" style={{ background: color }}>{logo}</span><span className="site-name">{name}</span></span><span className="site-nav"><span>Asosiy</span><span>Haqida</span></span></div>
    {headline && <h3 className="site-h3" style={{ marginTop: 2 }}>{headline}</h3>}
    {sub && <p style={{ fontFamily: G, color: T.ink2, fontSize: 'clamp(12.5px,1.6vw,14px)', lineHeight: 1.5, margin: '0 0 12px' }}>{sub}</p>}
    {rows && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 13px' }}>{rows.map((r, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 38, height: 28, borderRadius: 6, background: T.bg, flexShrink: 0, boxShadow: `inset 0 0 0 1px ${T.ink3}30` }} /><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{r}</span></div>))}</div>}
    {cta && <span style={{ display: 'inline-block', background: color, color: '#fff', fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, padding: '9px 18px', borderRadius: 9 }}>{cta}</span>}
  </div>
);

// Konfetti — dars muvaffaqiyatli tugaganda yog'iladigan bayram effekti (InternetLesson bilan bir xil)
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
  const audio = useAudio([{ id: 's0', text: `Telefoningizda o'nlab ilova bor. Ulardan ba'zilarini har kuni ochasiz, ba'zilarini esa o'rnatib qo'yganingiz bilan umuman ishlatmaysiz. Sizningcha, nega shunday? Javobingizni tanlang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const APPS = [{ ic: Ico.youtube(26), n: 'YouTube' }, { ic: Ico.market(26), n: "Do'kon" }, { ic: Ico.taxi(26), n: 'Taksi' }, { ic: Ico.telegram(26), n: 'Telegram' }];
  const OPTS = [
    { id: 'a', label: 'Chiroyli ko\'rinishi uchun' },
    { id: 'b', label: 'Ular mening biror muammomni yechgani uchun' },
    { id: 'c', label: 'Ko\'p reklama qilingani uchun' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext optionalLive disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up">Nega ba'zi ilovalarni har kuni ochasiz, ba'zilarini esa <span className="italic" style={{ color: T.accent }}>umuman ochmaysiz</span>?</h1>
        <Mentor>Telefoningizda o'nlab ilova bor. Ulardan ba'zilarini <b style={{ color: T.ink }}>har kuni</b> ochasiz, ba'zilarini esa o'rnatib qo'yganingiz bilan <b style={{ color: T.ink }}>umuman ishlatmaysiz</b>. Sizningcha, nega shunday? Avval o'zingiz taxmin qiling — o'ngdagi javoblardan birini tanlang.</Mentor>
        <Split>
          <Col>
            <p className="flow-label">Har kuni ochadiganlaringiz</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {APPS.map((o, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 14px', borderRadius: 13, background: T.paper, boxShadow: `0 6px 16px -7px rgba(${T.shadowBase},0.16)` }}>
                  <span style={{ color: T.accent, display: 'inline-flex', animation: `dl-pulse 1s ease-in-out infinite ${i * 0.16}s` }}>{o.ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{o.n}</span>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, asosiy farq nimada?</p>
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
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'ldasiz! Har kuni ochadigan ilovangiz sizning qandaydir <b>muammoyingizni yechadi</b>: zerikdingiz — YouTube, biror narsa kerak — do'kon. Butun darsimiz mana shu qoida haqida.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Sayt qurishdan oldin mahsulot menejeri uchta savolga javob topadi: bu sayt kim uchun? U odamning qanday muammosi bor? Sayt qanday yechim beradi? Buni limonad misolida jonli ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Sayt — kimningdir muammosiga yechim', tag: '' },
    { text: 'Muammoni qanday topamiz', tag: '' },
    { text: 'Foydalanuvchi — aniq kim?', tag: 'kim uchun' },
    { text: 'Muammoni yechimga ulaymiz', tag: '' },
    { text: 'O\'z g\'oyangizni tuzasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const FORMULA = [
    { q: 'KIM?', a: 'Issiqda chanqagan o\'tkinchilar', ic: Ico.user },
    { q: 'MUAMMO?', a: 'Muzdek ichimlikni qayerdan topishni bilishmaydi', ic: Ico.problem },
    { q: 'YECHIM?', a: 'Limonad qayerda va nechpul — ko\'rsatadigan sayt', ic: Ico.solution }
  ];
  const [phase, setPhase] = useState(-1); // -1 idle · 0..2 savollar · 3 yechim
  const [playing, setPlaying] = useState(false);
  const fTimer = useRef(null);
  useEffect(() => () => clearTimeout(fTimer.current), []);
  const play = useCallback(() => {
    clearTimeout(fTimer.current); setPlaying(true); setPhase(0);
    let i = 0;
    const tick = () => {
      fTimer.current = setTimeout(() => {
        if (i < FORMULA.length - 1) { i++; setPhase(i); tick(); }
        else { setPhase(FORMULA.length); setPlaying(false); }
      }, 950);
    };
    tick();
  }, []);
  useEffect(() => { const t = setTimeout(play, 600); return () => clearTimeout(t); }, [play]); // ochilganda bir marta o'ynaydi
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Har bir sayt — muammoga yechim</p>
      <div className="frame frame-col fade-up" style={{ gap: 10, padding: '16px 18px' }}>
        <div className="pf-row pf-prob">
          <span className="pf-emoji">😥</span>
          <div><p className="pf-k">Vaziyat — ko'chada</p><p className="pf-v">"Juda issiq! Muzdek biror narsa ichsam edi… lekin qayerdan?"</p></div>
        </div>
        <div className="pf-arrow">↓ <span style={{ color: T.accent }}>PM (mahsulot menejeri) uchta savol beradi</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {FORMULA.map((f, i) => {
            const on = phase === i; const passed = phase > i;
            return (
              <div key={i} className={`pf-q ${on ? 'on' : ''} ${passed ? 'done' : ''}`}>
                <span className="pf-qic">{passed ? Ico.check(16) : f.ic(17)}</span>
                <span className="pf-qq">{f.q}</span>
                <span className="pf-qa">{(on || passed) ? f.a : '…'}</span>
              </div>
            );
          })}
        </div>
        <div className="pf-arrow">↓ uchala javob birlashsa…</div>
        <div className={`pf-site ${phase >= FORMULA.length ? 'show' : ''}`}>
          <div className="bp-window">
            <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-url"><span className="lock">●</span>muzdek-limonad.uz</span></div>
            <div className="bp-body" style={{ minHeight: 96 }}>
              <SiteMock logo="L" color={T.accent} name="Limonad" headline="Muzdek limonad — 5 000 so'm 🍋" sub="Park darvozasi yonida · har kuni 10:00 dan 18:00 gacha" cta="Xaritada ko'rish" />
            </div>
          </div>
          <p className="pf-site-cap">🎉 …SAYT tug'iladi! Endi chanqagan odam limonadni bir zumda topadi.</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn-soft" onClick={play} disabled={playing}>{playing ? "Ko'rsatilmoqda…" : (phase >= FORMULA.length ? '↻ Yana ko\'rish' : '▶ Qanday ishlaydi?')}</button>
        <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ shu yechimni keyin HTML'da quramiz</p>
      </div>
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
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Bugun mahsulot menejeridek fikrlashni o'rganamiz!</span></h2>
        </div>
        <Mentor>Sayt qurishdan oldin bitta odam ishlaydi — <b style={{ color: T.ink }}>mahsulot menejeri (PM)</b>. U kod yozmaydi. U uchta savolga javob topadi: bu sayt <b style={{ color: T.ink }}>KIM uchun</b>? U odamning qanday <b style={{ color: T.ink }}>MUAMMOSI</b> bor? Sayt qanday <b style={{ color: T.ink }}>YECHIM</b> beradi? Quyida buni limonad misolida jonli ko'ring — bugun butun dars davomida o'zingiz ham xuddi shunday fikrlaysiz.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — SAYT = MUAMMOGA YECHIM (tap real sites) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Har bir mashhur sayt tasodifan paydo bo'lmagan — u kimningdir real muammosini yechgan. Har bir saytni bosib, avval qanday qiyin edi va sayt nimani o'zgartirganini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const SITES = {
    youtube: { ic: Ico.youtube(26), name: 'YouTube', url: 'youtube.com', mock: { logo: 'Y', color: '#FF0000', name: 'Video', headline: 'Bugun nima ko\'ramiz?', rows: ['Dasturlash darsi · 12 daq', 'Sayohat vlogi · 8 daq'], cta: 'Ko\'rish' }, before: 'Sevimli ko\'rsatuvni faqat televizor bergan vaqtda ko\'ra olardingiz.', after: 'Istalgan videoni, istalgan vaqtda — bir bosishda.' },
    market: { ic: Ico.market(26), name: 'Bozor', url: 'bozor.uz', mock: { logo: 'B', color: '#7B3FE4', name: 'Bozor', headline: 'Soting yoki sotib oling', rows: ['Velosiped — 450 000', 'Telefon — 1 200 000'], cta: 'E\'lon berish' }, before: 'Ortiqcha buyumingizni sotmoqchisiz, lekin xaridor topish juda qiyin edi.', after: 'Bir necha daqiqada e\'lon berasiz — minglab xaridor ko\'radi va sotib oladi.' },
    taxi: { ic: Ico.taxi(26), name: 'Taksi', url: 'taksi.uz', mock: { logo: 'T', color: '#FFB300', name: 'Taksi', headline: 'Mashina chaqiring', sub: 'Uyingizgacha 5 daqiqada keladi. Narx oldindan ma\'lum: 18 000 so\'m.', cta: 'Chaqirish' }, before: 'Yo\'l chetida taksi kutardingiz, narxi noaniq edi.', after: 'Ilovada chaqirasiz — mashina ham, narx ham oldindan ma\'lum.' },
    telegram: { ic: Ico.telegram(26), name: 'Telegram', url: 'telegram.org', mock: { logo: 'T', color: '#29A9EB', name: 'Telegram', headline: 'Suhbatlar', rows: ['Ona — Salom, qalaysan?', 'Do\'st — Bugun chiqamizmi?'], cta: 'Yozish' }, before: 'Uzoqdagi do\'st bilan tez gaplashish qiyin va qimmat edi.', after: 'Bepul, bir zumda xabar va ovozli qo\'ng\'iroq.' }
  };
  const [active, setActive] = useState('market');
  const [seen, setSeen] = useState(new Set(['market']));
  const done = seen.size === 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = SITES[active];
  return (
    <Stage eyebrow="Sayt = yechim" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 saytni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sevimli saytlaringiz qanday <span className="italic" style={{ color: T.accent }}>muammoni</span> yechgan?</h2></div>
        <Mentor>Har bir mashhur sayt kimningdir <b style={{ color: T.ink }}>real muammosini</b> yechgan. Saytni bosib, uni va <b style={{ color: T.ink }}>avval</b> qanday qiyin bo'lganini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Saytni tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.keys(SITES).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', border: 'none', borderRadius: 13, padding: '13px 12px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}>
                  <span style={{ display: 'inline-flex' }}>{SITES[k].ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>{SITES[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}
                </button>
              ))}
            </div>
            <div className="frame-warn fade-step" key={active + 'b'} style={{ marginTop: 2 }}>
              <p className="flow-label" style={{ margin: '0 0 4px', color: T.accent }}>Avval qanday edi (muammo)</p>
              <p className="body" style={{ color: T.ink, margin: 0 }}>{cur.before}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bir sayt bir <b>qiyinchilikni</b> osonlikka aylantirgan. Sayt = muammoga yechim.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Sayt bilan (yechim)</p>
            <Preview url={cur.url} minH={188}><SiteMock {...cur.mock} /></Preview>
            <p className="body fade-step" key={active + 'a'} style={{ color: T.ink2, margin: 0, fontSize: 13.5 }}>{cur.after}</p>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — MUAMMO = SAYTNING YURAGI (conn-flow) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Odam chanqagan ekan — limonad saytiga kirib turadi. Harakatlanayotgan nuqtalar — kiruvchilar. Endi tasavvur qiling: muammo yo'qoldi, hamma to'yib ichgan. Tugmani bosib, saytga nima bo'lishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [gone, setGone] = useState(false);
  const [touched, setTouched] = useState(false);
  const done = touched;
  const toggle = () => { setGone(g => !g); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Muammo — yurak" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Sinab ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Agar muammo bo'lmasa, sayt <span className="italic" style={{ color: T.accent }}>kerak</span> bo'larmidi?</h2></div>
        <Mentor>Kechagi limonad saytimizni eslang. Odam <b style={{ color: T.ink }}>chanqagan</b> ekan — saytga kirib turadi (harakatlanayotgan nuqtalar — <b style={{ color: T.ink }}>kiruvchilar</b>). Endi tasavvur qiling: muammo yo'qoldi — hamma to'yib ichgan. Tugmani bosib, saytga nima bo'lishini ko'ring.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="s3-scene fade-up delay-1">
          <div className="s3-node">
            <span className="s3-face" key={gone ? 'ok' : 'hot'}>{gone ? '😊' : '😥'}</span>
            <span className="conn-lbl">Odam</span>
            <span className="conn-sub">{gone ? "chanqoq yo'q — muammo yo'q" : 'chanqagan — muammosi bor'}</span>
          </div>
          <div className={`s3-link ${gone ? 'cut' : ''}`}>
            {!gone && <><span className="s3-dot" /><span className="s3-dot d2" /><span className="s3-dot d3" /></>}
            <span className="s3-wire" />
            {gone && <span className="s3-scissors">✂️</span>}
          </div>
          <div className={`s3-site ${gone ? 'off' : ''}`}>
            <div className="bp-window">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-url"><span className="lock">●</span>muzdek-limonad.uz</span></div>
              <div className="bp-body" style={{ minHeight: 92 }}>
                <SiteMock logo="L" color={T.accent} name="Limonad" headline="Muzdek limonad — 5 000 so'm 🍋" cta="Xaritada ko'rish" />
              </div>
            </div>
            <span className={`s3-visit ${gone ? 'zero' : ''}`} key={gone ? 'z' : 'v'}>{gone ? '👥 Kiruvchilar: 0 — sayt huvillab qoldi' : '👥 Kiruvchilar: kuniga 120 kishi'}</span>
          </div>
        </div>
        <button className="btn" onClick={toggle} style={{ alignSelf: 'flex-start' }}>{gone ? '↩ Muammoni qaytarish' : '✂️ Muammoni olib tashlash'}</button>
        {done && (
          gone
            ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muammo yo'qoldi — odam baxtli, lekin saytga endi <b>hech kim kirmaydi</b>. Muammosiz sayt — huvillagan uy.</p></div>
            : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Muammo qaytdi — kiruvchilar ham qaytdi. Demak <b>muammo — saytning yuragi</b>: u urib turibdimi, sayt yashaydi.</p></div>
        )}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Sayt birinchi navbatda nima uchun yaratiladi?"
    questionText="Sayt birinchi navbatda nima uchun yaratiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sayt birinchi navbatda <span className="italic" style={{ color: T.accent }}>nima uchun</span> yaratiladi?</h2></>}
    options={['Ko\'p odam kirib, mashhur bo\'lishi uchun', 'Egasiga pul topib berishi uchun', 'Kimningdir aniq muammosini yechish uchun', 'Zamonaviy va chiroyli ko\'rinishi uchun']} correctIdx={2}
    explainCorrect="To'g'ri! Hammasi muammodan boshlanadi. Muammo yaxshi yechilsa — odamlar o'zi kirib keladi, mashhurlik ham, pul ham shundan keyin keladi."
    explainWrong={{
      0: 'Mashhurlik — natija, sabab emas. Odamlar saytga muammosini yechgani uchun kiradi, shundan keyingina u mashhur bo\'ladi.',
      1: 'Pul ham natija: sayt odamlarga foyda berganidagina pul topadi. Avval — muammo yechimi, keyin daromad.',
      3: 'Chiroyli dizayn kerak, lekin u yechimga xizmat qiladi. Muammoni yechmasa — eng chiroyli sayt ham ochilmay qolaveradi.',
      default: 'Sayt avvalo kimningdir aniq muammosini yechish uchun yaratiladi — qolgani shundan kelib chiqadi.'
    }} />
);

// ===== SCREEN 5 — MUAMMO ANIQ KIMNIKI? (toggle) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Endi eng muhim savol: bu muammo aniq kimniki? Mening saytim hamma uchun, deyish oson. Lekin aslida bu hech kim uchun degani. Bitta g'oyaning ikki ko'rinishini solishtiring: avval noaniq, keyin aniq — farqni o'zingiz sezasiz.`, trigger: 'on_mount', waits_for: null }]);
  const [mode, setMode] = useState('vague');
  const [seen, setSeen] = useState(new Set(['vague']));
  const done = seen.size >= 2;
  const set = (m) => { setMode(m); setSeen(prev => { const n = new Set(prev); n.add(m); return n; }); };
  const V = {
    vague: { title: 'Hamma uchun ichimliklar sayti', note: 'Kim ichadi? Qachon? Qayerda? Hech narsa aniq emas. Issiq choy istagan buviga ham, muzdek kola istagan bolaga ham bir xil gapirasiz — natijada hech kimni qiziqtira olmaysiz.' },
    specific: { title: 'Issiq kunda chanqagan o\'tkinchilar uchun — park yonida muzdek limonad', note: 'Aniq odam (issiqda chanqagan o\'tkinchi), aniq vaqt (issiq kun), aniq joy (park yoni). Endi saytda nima yozishni ham aniq bilasiz: qayerda, nechpul va qanchalik muzdek.' }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Foydalanuvchi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu muammo aniq <span className="italic" style={{ color: T.accent }}>kimniki</span>?</h2></div>
        <Mentor>Endi eng muhim savol: bu muammo aniq <b style={{ color: T.ink }}>KIMNIKI</b>? "Mening saytim <b style={{ color: T.ink }}>hamma uchun</b>" deyish oson — lekin aslida bu "<b style={{ color: T.ink }}>hech kim uchun</b>" degani: hammaga birdek yoqadigan narsa bo'lmaydi. Quyida bitta g'oyaning ikki ko'rinishi bor — «Noaniq» va «Aniq odam»ni almashtirib, farqni o'zingiz sezing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'vague' ? 'chip-on' : ''}`} onClick={() => set('vague')}>Noaniq</button>
              <button className={`chip ${mode === 'specific' ? 'chip-on' : ''}`} onClick={() => set('specific')}>Aniq odam</button>
            </div>
            <div className="demo-swap pm-pop" key={mode} style={{ background: T.paper, borderRadius: 14, padding: '20px 18px', boxShadow: `0 8px 20px -7px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${mode === 'specific' ? T.success : T.ink3}` }}>
              <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(16px,2.1vw,19px)', color: T.ink, margin: 0 }}>{V[mode].title}</p>
            </div>
          </Col>
          <Col>
            <div className="frame fade-up delay-2" key={mode + 'n'}>
              <p className="eyebrow" style={{ color: mode === 'specific' ? T.success : T.accent, margin: '0 0 6px' }}>{mode === 'specific' ? 'Aniq' : 'Noaniq'}</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>{V[mode].note}</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aniq odamni tanlash — bu kamchilik emas, <b>kuch</b>. Aniq foydalanuvchi = aniq, foydali yechim.</p></div>}
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
    audioText="Hamma uchun qilingan sayt nega kam ishlaydi?"
    questionText="'Hamma uchun' qilingan sayt nega kam ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"Hamma uchun" sayt nega <span className="italic" style={{ color: T.accent }}>kam</span> ishlaydi?</h2></>}
    options={['Hammaga yoqadigan saytga juda ko\'p pul ketadi', 'Unda hamma narsa bor, lekin hech kim aynan o\'zi izlaganini topa olmaydi', 'Ko\'p odam kirganidan sayt sekinlashib qoladi', 'Reklamasiz uni hech kim bilmay qoladi']} correctIdx={1}
    explainCorrect="Aniq topdingiz! Hammaga gapirgan sayt hech kimga aniq gapirmaydi. Choy istagan buviga ham, kola istagan bolaga ham bir xil gapirsangiz — ikkisi ham chiqib ketadi."
    explainWrong={{
      0: 'Gap pulda emas — eng katta kompaniyalar ham "hamma uchun" sayt qilolmaydi. Sabab: aniq odam bo\'lmasa, nimani yaxshilashni ham bilmaysiz.',
      2: 'Sekinlik — texnik masala, xohlasang kuchli server olasan. "Hamma uchun" saytning dardi boshqa: unga odam umuman ko\'p kirmaydi.',
      3: 'Reklama saytni tanitadi, lekin kirgan odam o\'ziga keraklisini topmasa — bir kirib, qaytib kelmaydi.',
      default: 'Aniq odam tanlanmagan — shuning uchun hech kim aynan o\'zi izlaganini topa olmaydi.'
    }} />
);

// ===== SCREEN 6 — AMALIYOT: O'Z SAYTLARINGIZ QAYSI MUAMMONI YECHADI? =====
// O'quvchi eng ko'p ishlatadigan 2 ta sayt/ilovasini yozadi va har biri uning
// qanday muammosini yechishini o'z so'zi bilan aytadi — «sayt = yechim» qoidasini
// o'z hayotida sinab ko'radi. O'ng tomonda «PM daftari» jonli to'ladi.
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Endi PM ko'zoynagini taqib ko'ramiz. O'zingiz eng ko'p ishlatadigan ikkita sayt yoki ilovani yozing va har biri sizning qanday muammoyingizni yechishini ayting.`, trigger: 'on_mount', waits_for: null }]);
  const QUICK = ['YouTube', 'Telegram', 'Instagram', 'TikTok', 'Google', 'O\'yin'];
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const isMentorLive = !!(live && live.mode === 'mentor'); // mentor o'zi to'ldirmaydi — panel ko'radi
  const mountTs = useRef(Date.now());
  const [apps, setApps] = useState(() => storedAnswer?.apps || [{ name: '', prob: '' }, { name: '', prob: '' }]);
  const okName = (n) => n.trim().length >= 2;
  const okProb = (p) => p.trim().length >= 8;
  const slotOk = (a) => okName(a.name) && okProb(a.prob);
  const doneCount = apps.filter(slotOk).length;
  const done = doneCount >= 2;
  const prevDone = useRef(false);
  useEffect(() => {
    if (done && !prevDone.current) {
      prevDone.current = true;
      if (storedAnswer === undefined) onAnswer(screen, { correct: true, apps, stage: 'practice', screenIdx: screen });
      if (live) live.submitAnswer(screen, 's6', 0, true, Date.now() - mountTs.current); // «tugatdi» belgisi mentorga boradi
    }
  }, [done]); // eslint-disable-line
  const upd = (i, k, v) => setApps(prev => prev.map((a, ai) => ai === i ? { ...a, [k]: v } : a));
  const PH = [
    { name: 'Masalan: YouTube', prob: 'Masalan: zerikkanimda nima ko\'rishni topib beradi' },
    { name: 'Masalan: Telegram', prob: 'Masalan: do\'stlarim bilan tez va bepul gaplashaman' }
  ];
  return (
    <Stage eyebrow="Amaliyot · o'zingizdan misol" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? false : !done} label={isMentorLive || done ? 'Davom etish' : `To'ldiring (${doneCount}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sizning saytlaringiz qaysi <span className="italic" style={{ color: T.accent }}>muammoyingizni</span> yechadi?</h2></div>
        <Mentor>Endi PM ko'zoynagini taqamiz 😎. O'zingiz <b style={{ color: T.ink }}>eng ko'p ishlatadigan 2 ta</b> sayt yoki ilovani yozing va har biri sizning qanday <b style={{ color: T.ink }}>muammoyingizni</b> yechishini ayting. Shunda «sayt = yechim» qoidasi o'z hayotingizda ham ishlashini ko'rasiz.</Mentor>
        <div className="split">
          <Col>
            {apps.map((a, i) => (
              <div key={i} className="pr-slot fade-up" style={{ animationDelay: `${0.06 + i * 0.1}s`, boxShadow: slotOk(a) ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.18)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)` }}>
                <div className="pr-slot-head">
                  <span className="pr-slot-num" style={{ background: slotOk(a) ? T.success : T.accent }}>{slotOk(a) ? Ico.check(13) : i + 1}</span>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: T.ink, textTransform: 'uppercase' }}>{i + 1}-sayt yoki ilova</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {QUICK.map(q => <button key={q} type="button" className={`gchip ${a.name.trim() === q ? 'chip-on' : ''}`} onClick={() => upd(i, 'name', q)}>{q}</button>)}
                </div>
                <input value={a.name} onChange={e => upd(i, 'name', e.target.value)} placeholder={PH[i].name}
                  style={{ width: '100%', fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', marginBottom: 7 }} />
                <p className="flow-label" style={{ margin: '0 0 5px' }}>U sizning qanday muammoyingizni yechadi?</p>
                <textarea value={a.prob} onChange={e => upd(i, 'prob', e.target.value)} placeholder={PH[i].prob} rows={2}
                  style={{ width: '100%', fontFamily: "'Manrope',sans-serif", fontSize: 14, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '9px 12px', resize: 'vertical', minHeight: 40, outline: 'none', lineHeight: 1.45, boxSizing: 'border-box' }} />
              </div>
            ))}
          </Col>
          <Col>
            <p className="flow-label">PM daftaringiz</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {apps.map((a, i) => slotOk(a) ? (
                <div key={i} className="pr-note el-in">
                  <span style={{ color: T.success, display: 'inline-flex', flexShrink: 0, marginTop: 2 }}>{Ico.check(16)}</span>
                  <p className="body" style={{ margin: 0, color: T.ink }}><b>{a.name.trim()}</b> — <span style={{ color: T.ink2 }}>{a.prob.trim()}</span></p>
                </div>
              ) : (
                <div key={i} className="frame-dash" style={{ padding: '13px 15px' }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>{i + 1}-saytni chapda to'ldiring — xulosa shu yerda paydo bo'ladi…</p></div>
              ))}
            </div>
            {done && <div className="frame-success fade-step pm-match"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'ryapsizmi — siz allaqachon <b>PM kabi fikrlayapsiz</b>! Har bir sevimli saytingiz ortida bitta yechilgan muammo turibdi. Endi buni o'zingiz ham qura olasiz.</p></div>}
          </Col>
        </div>
        {isMentorLive && <MentorWorkStats live={live} screenIdx={screen} taskLabel="Amaliyot — kim tugatdi?" />}
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — G'OYA QANDAY TUG'ILADI (stepper) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `G'oya osmondan tushmaydi — u uchta savolga javobdan yig'iladi: avval kim, keyin uning muammosi, oxirida yechim. Bitta jonli misol: non yopadigan buvi. Tugmani bosib, uchala javob qanday zanjir bo'lib ulanishini kuzating.`, trigger: 'on_mount', waits_for: { type: 'flow_done' } }]);
  const STEPS = [
    { ic: Ico.user(24), h: 'KIM', t: 'Mazali non yopadigan buvi', link: 'Bu buvining qanday muammosi bor?' },
    { ic: Ico.problem(24), h: 'MUAMMO', t: "Nonini faqat qo'shnilari biladi — boshqa xaridor topolmaydi", link: 'Bu muammoni nima yechadi?' },
    { ic: Ico.solution(24), h: 'YECHIM', t: 'Buvining nonlari: rasm, narx va buyurtma sayti', link: '' }
  ];
  const [step, setStep] = useState(storedAnswer ? STEPS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = step >= STEPS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setStep(0); setRunning(true);
    const tick = (i) => { setStep(i); if (i < STEPS.length) timer.current = setTimeout(() => tick(i + 1), 760); else { setRunning(false); audio.triggerEvent('flow_done'); } };
    timer.current = setTimeout(() => tick(1), 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="G'oya tug'iladi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yaxshi g'oya qanday <span className="italic" style={{ color: T.accent }}>tug'iladi</span>?</h2></div>
        <Mentor>G'oya osmondan tushmaydi — u <b style={{ color: T.ink }}>uchta savolga javobdan</b> yig'iladi: avval <b style={{ color: T.ink }}>KIM</b> (aniq odam), keyin uning <b style={{ color: T.ink }}>MUAMMOSI</b>, oxirida <b style={{ color: T.ink }}>YECHIM</b>. Bitta jonli misol: mazali non yopadigan buvi. «G'oyani yig'ish»ni bosing va uchala javob qanday <b style={{ color: T.ink }}>zanjir</b> bo'lib ulanishini kuzating.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((s, i) => {
            const COLORS = [T.blue, T.accent, T.success];
            const SOFTS = [T.blueSoft, T.accentSoft, T.successSoft];
            const c = COLORS[i];
            const on = step > i;
            const linkOn = step > i + 1; // keyingi bosqich ham ochilgan — zanjir to'liq
            return (
              <React.Fragment key={i}>
                <div className={on ? 'pm-pop' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 14, background: T.paper, borderRadius: 14, padding: 'clamp(14px,2vw,18px)', opacity: on ? 1 : 0.4, boxShadow: on ? `0 8px 20px -8px ${c}55` : 'none', borderLeft: `4px solid ${on ? c : 'transparent'}`, transition: 'all 0.4s' }}>
                  <IcoChip color={on ? c : T.ink3} soft={on ? SOFTS[i] : '#ECEAE5'}>{s.ic}</IcoChip>
                  <div><p className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: on ? c : T.ink3, margin: '0 0 2px' }}>{s.h}</p><p className="body" style={{ margin: 0, color: on ? T.ink : T.ink3, fontWeight: 500 }}>{s.t}</p></div>
                  {on && <span style={{ marginLeft: 'auto', color: c }}>{Ico.check(18)}</span>}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="g7-link" style={{ opacity: on ? 1 : 0.3, transition: 'opacity 0.4s' }}>
                    <span className="g7-bar" style={{ background: linkOn ? c : T.ink3, opacity: linkOn ? 1 : 0.4 }} />
                    <span className="g7-q" style={{ color: linkOn ? c : T.ink3, borderColor: linkOn ? `${c}40` : 'transparent', background: linkOn ? SOFTS[i] : 'transparent' }}>{s.link}</span>
                    <span style={{ display: 'inline-flex', color: linkOn ? c : T.ink3, transform: 'rotate(90deg)', transition: 'color 0.3s' }}>{Ico.arrow(16)}</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Yig\'ilmoqda…' : (done ? '↻ Yana ko\'rish' : 'G\'oyani yig\'ish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq g'oya: <b>buvi</b> + <b>xaridor topolmaslik</b> + <b>buyurtma sayti</b>. Uchta javob — bitta zanjir. Dars oxirida o'z g'oyangizni ham xuddi shunday yig'asiz.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — BIR ODAM, BIR XIL EHTIYOJMI? (tap users) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Buvining non saytiga butunlay har xil odamlar kiradi: buvi sotmoqchi, xaridor sotib olmoqchi, kuryer tez yetkazmoqchi. Har birini bosing — o'sha odam saytda birinchi bo'lib nimaga qarashini o'z ko'zi bilan ko'rasiz.`, trigger: 'on_mount', waits_for: null }]);
  const USERS = {
    seller: { ic: '👵', name: 'Buvi (sotuvchi)', want: "Nonlarini ko'proq odamga sotish va buyurtmalarni adashtirmasdan qabul qilish.", look: 'Buvi birinchi bo\'lib BUYURTMALAR ro\'yxatiga qaraydi' },
    buyer: { ic: '🙋', name: 'Xaridor', want: 'Issiq, yangi non. Narxini oldindan bilish va tez buyurtma berish.', look: 'Xaridor birinchi bo\'lib NARX va BUYURTMA tugmasiga qaraydi' },
    courier: { ic: '🛵', name: 'Kuryer', want: "Aniq manzil va qulay yo'nalish — nonni issiqligida yetkazish.", look: 'Kuryer birinchi bo\'lib MANZILGA qaraydi' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Har xil odam — har xil ehtiyoj" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 odamni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta saytga kirgan har kim <span className="italic" style={{ color: T.accent }}>bir xil</span> narsaga qaraydimi?</h2></div>
        <Mentor>Buvining non saytini eslang. Unga butunlay <b style={{ color: T.ink }}>har xil odamlar</b> kiradi: <b style={{ color: T.ink }}>buvi</b> sotmoqchi, <b style={{ color: T.ink }}>xaridor</b> sotib olmoqchi, <b style={{ color: T.ink }}>kuryer</b> tez yetkazmoqchi. Uchchalasi — bitta saytda, lekin uch xil narsa izlaydi! Har birini bosing — saytga <b style={{ color: T.ink }}>o'sha odamning ko'zi bilan</b> qaraysiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Object.keys(USERS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '13px 15px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -7px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}>
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{USERS[k].ic}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, color: T.ink }}>{USERS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}
                </button>
              ))}
            </div>
            {active && (
              <div className="sk-info fade-step" key={active + 'w'}>
                <p className="flow-label" style={{ margin: '0 0 4px' }}>{USERS[active].ic} {USERS[active].name} nimani xohlaydi?</p>
                <p className="body" style={{ color: T.ink, margin: 0 }}>{USERS[active].want}</p>
              </div>
            )}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta sayt — uch xil ko'z! Shuning uchun PM avval <b>asosiy foydalanuvchini</b> tanlaydi va saytni birinchi navbatda o'sha odamga qulay qiladi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">{active ? `👀 ${USERS[active].look}` : "Sayt — hozircha oddiy ko'rinishda"}</p>
            <div className="bp-window fade-up delay-1">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-url"><span className="lock">●</span>buvi-nonlari.uz</span></div>
              <div className="bp-body" style={{ minHeight: 168 }}>
                <div className="pg-in" key={active || 'none'}>
                  <div className="site-header"><span className="site-brand"><span className="site-logo" style={{ background: '#C97B2D' }}>N</span><span className="site-name">Buvi nonlari</span></span><span className="site-nav"><span>Menyu</span><span>Aloqa</span></span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className={`eye-row ${active === 'buyer' ? 'hot' : ''}`}>🍞 Tandir non — <b>6 000 so'm</b><span className="eye-cta" style={{ background: active === 'buyer' ? T.accent : T.ink3 }}>Buyurtma berish</span></div>
                    <div className={`eye-row ${active === 'seller' ? 'hot' : ''}`}>📋 Bugungi buyurtmalar: <b>7 ta</b> — 3 tasi yangi</div>
                    <div className={`eye-row ${active === 'courier' ? 'hot' : ''}`}>📍 Yetkazish manzili: <b>Chilonzor, 12-uy</b> · xaritada</div>
                  </div>
                </div>
              </div>
            </div>
            {!active && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Chapdan odamni tanlang — u qaraydigan qator saytda yonadi.</p>}
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
    audioText="Do'stingiz zo'r sayt qilmoqchi, lekin nimadan boshlashni bilmayapti. PM sifatida unga birinchi qaysi savolni berasiz?"
    questionText="Do'stingizga PM sifatida birinchi qaysi savolni berasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Vaziyatni yeching</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Do'stingiz: «Zo'r sayt qilmoqchiman, lekin <span className="italic" style={{ color: T.accent }}>nimadan boshlashni</span> bilmayapman» — deydi. PM sifatida unga birinchi qaysi savolni berasiz?</h2></>}
    options={['«Sayting qanaqa dizaynda bo\'ladi — zamonaviymi?»', '«Saytga qancha pul va vaqt ketadi?»', '«Sayting aniq kimga kerak va uning qanday muammosini yechadi?»', '«Saytingga qanday zo\'r nom topamiz?»']} correctIdx={2}
    explainCorrect="Barakalla — bu haqiqiy PM savoli! KIM va MUAMMO aniq bo'lsa, dizayn ham, nom ham, hatto qancha vaqt ketishi ham o'z-o'zidan ayon bo'lib qoladi."
    explainWrong={{
      0: 'Dizayn — keyingi bosqich. Kim uchunligini bilmasangiz, qanday dizayn yoqishini ham bilolmaysiz.',
      1: 'Muhim savol, lekin birinchisi emas: nima qurilishini bilmasdan turib narxini hisoblab bo\'lmaydi.',
      3: 'Nom — eng oxirgi bezak. Avval sayt kimga va nima uchun kerakligini aniqlab olamiz.',
      default: 'PM doim birinchi bo\'lib so\'raydi: sayt aniq KIMGA kerak va qanday MUAMMONI yechadi?'
    }} />
);

// ===== SCREEN 10 — MUAMMO ↔ YECHIM moslash =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `PM ning kundalik ishi shu: muammoga aniq mos yechim topish. Chapdan bitta muammoni tanlang, keyin o'ngdan uning yechimini bosing. Mos kelsa — ko'prik bilan ulanadi. Uchchalasini ulang.`, trigger: 'on_mount', waits_for: null }]);
  const PROBLEMS = [
    { id: 'bus', ic: Ico.clock(20), text: 'Bekatda avtobusni qancha kutishni bilmaysiz', short: 'Avtobus kutish' },
    { id: 'phone', ic: Ico.phone(20), text: 'Yangi telefon olmoqchisiz — qaysi biri yaxshi, bilmaysiz', short: 'Telefon tanlash' },
    { id: 'ball', ic: Ico.ball(20), text: 'Futbol o\'ynagani doim jamoa yig\'ilmaydi', short: 'Jamoa yig\'ish' }
  ];
  const SOLUTIONS = [
    { id: 'ball', text: 'O\'yin vaqti va joyini kelishib olish sahifasi', short: 'O\'yin sahifasi' },
    { id: 'bus', text: 'Avtobuslar qayerdaligini jonli ko\'rsatadigan xarita', short: 'Jonli xarita' },
    { id: 'phone', text: 'Telefonlarni yonma-yon taqqoslaydigan sayt', short: 'Taqqoslash sayti' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState([]); // ulangan tartibda — ko'priklar shu tartibda chiziladi
  const [wrong, setWrong] = useState(null);
  const done = matched.length >= 3;
  const isM = (id) => matched.includes(id);
  const pickP = (id) => { if (isM(id)) return; setSel(id); setWrong(null); };
  const pickS = (id) => { if (!sel || isM(id)) return; if (id === sel) { setMatched(prev => [...prev, sel]); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '13px 15px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(13.5px,1.6vw,15px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Amaliyot · ulash o'yini" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `${matched.length}/3 ulang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        {done && <Confetti />}
        <div className="head"><h2 className="title h-title fade-up">Har bir muammoga <span className="italic" style={{ color: T.accent }}>mos yechimni</span> topa olasizmi?</h2></div>
        <Mentor>PM ning kundalik ishi shu: muammoga <b style={{ color: T.ink }}>aniq mos</b> yechim topish. Chapdan bitta <b style={{ color: T.ink }}>muammoni</b> tanlang, keyin o'ngdan uning <b style={{ color: T.ink }}>yechimini</b> bosing — mos kelsa, pastda <b style={{ color: T.ink }}>ko'prik</b> bilan ulanadi. Uchchalasini ulang!</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,1.6vw,14px)' }}>
        <div className="split">
          <Col>
            <p className="flow-label">Muammolar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PROBLEMS.map(p => {
                const m = isM(p.id); const on = sel === p.id;
                return (
                  <button key={p.id} className={m ? 'pm-match' : undefined} onClick={() => pickP(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.45 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -7px rgba(${T.shadowBase},0.16)` })}>
                    <span style={{ color: m ? T.success : T.accent, display: 'inline-flex' }}>{m ? Ico.check(18) : p.ic}</span>
                    <span style={{ flex: 1 }}>{p.text}</span>
                  </button>
                );
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Yechimlar{sel && !done && <span className="pm-hintnow"> ← endi mos yechimni bosing</span>}</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {SOLUTIONS.map(s => {
                const m = isM(s.id); const isWrong = wrong === s.id;
                return (
                  <button key={s.id} className={m ? 'pm-match' : (isWrong ? 'pm-shake' : undefined)} onClick={() => pickS(s.id)} disabled={m || !sel} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.45 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -7px rgba(${T.shadowBase},0.16)` })}>
                    <span style={{ color: m ? T.success : T.ink3, display: 'inline-flex' }}>{m ? Ico.check(18) : Ico.solution(18)}</span>
                    <span style={{ flex: 1 }}>{s.text}</span>
                  </button>
                );
              })}
            </div>
            {wrong && !done && <p className="small pm-shake" style={{ color: T.accent, margin: 0, fontWeight: 600 }}>Bu yechim boshqa muammoga mos. Muammoni yana bir o'qib, qaytadan urinib ko'ring.</p>}
          </Col>
        </div>
        {matched.length > 0 && (
          <div className="pm-bridges">
            <p className="flow-label" style={{ margin: '0 0 7px' }}>🔗 Ulangan juftliklar</p>
            {matched.map(id => {
              const p = PROBLEMS.find(x => x.id === id); const s = SOLUTIONS.find(x => x.id === id);
              return (
                <div key={id} className="pm-bridge el-in">
                  <span className="pm-bridge-p">{p.short}</span>
                  <span className="pm-bridge-wire"><span className="pm-bridge-link">🔗</span></span>
                  <span className="pm-bridge-s">{s.short}</span>
                </div>
              );
            })}
          </div>
        )}
        {done && <div className="frame-success fade-step pm-match"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r — uchchala ko'prik qurildi! 🎉 Muammoga aniq mos yechim topish — PM ning eng asosiy mahorati, va siz buni uddaladingiz.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — G'OYANI BO'LAKLARDAN YIG'ISH =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi g'oyani o'zingiz yig'ing. Lekin diqqat: uchala bo'lak bitta odamga mos kelishi kerak — kim, uning muammosi va aynan o'sha muammoning yechimi.`, trigger: 'on_mount', waits_for: null }]);
  // har bir g'oya — bitta butun (guruh). To'g'ri g'oya = uchala bo'lak bir guruhdan.
  const GROUPS = {
    limonad: { kim: 'Limonad sotadigan bola', muammo: 'Xaridorlar qayerda sotilishini bilishmaydi', yechim: 'Joy va narxni ko\'rsatadigan sayt' },
    vazifa: { kim: 'Darslarini unutib qo\'yadigan sinfdosh', muammo: 'Qaysi kunga qanday vazifa borini eslolmaydi', yechim: 'Vazifalarni eslatib turadigan sayt' },
    rasm: { kim: 'Rasm chizishni o\'rganmoqchi bo\'lgan bola', muammo: 'Qayerdan boshlashni bilmaydi', yechim: 'Bosqichma-bosqich rasm darslari sayti' }
  };
  const ROWS = [
    { key: 'kim', label: 'KIM', ic: Ico.user(18), color: T.blue, order: ['limonad', 'vazifa', 'rasm'] },
    { key: 'muammo', label: 'MUAMMO', ic: Ico.problem(18), color: T.accent, order: ['vazifa', 'rasm', 'limonad'] },
    { key: 'yechim', label: 'YECHIM', ic: Ico.solution(18), color: T.success, order: ['rasm', 'limonad', 'vazifa'] }
  ];
  const [pick, setPick] = useState({ kim: null, muammo: null, yechim: null });
  const keys = ['kim', 'muammo', 'yechim'];
  const allPicked = keys.every(k => pick[k] !== null);
  const matched = allPicked && pick.kim === pick.muammo && pick.muammo === pick.yechim;
  const set = (k, g) => setPick(prev => ({ ...prev, [k]: prev[k] === g ? null : g }));
  useEffect(() => { if (matched && storedAnswer === undefined) onAnswer(screen, { correct: true, group: pick.kim }); }, [matched]);
  const META = { kim: ROWS[0], muammo: ROWS[1], yechim: ROWS[2] };
  const low = (s) => s ? s[0].toLowerCase() + s.slice(1) : '';
  return (
    <Stage eyebrow="G'oya yig'ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!matched} label={matched ? 'Davom etish' : (allPicked ? 'Mos kelmadi — tekshiring' : 'Uchala bo\'lakni tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">G'oyani <span className="italic" style={{ color: T.accent }}>bo'laklardan</span> yig'a olasizmi?</h2></div>
        <Mentor>Uch qatordan bittadan tanlab, <b style={{ color: T.ink }}>BITTA odamning to'liq g'oyasini</b> yig'ing. Ehtiyot bo'ling — bo'laklar ataylab aralashtirilgan: limonadchi bolaning muammosiga rasm darslari yechim bo'lolmaydi! Uchalasi bir odamniki bo'lsagina g'oyangiz <b style={{ color: T.success }}>«MOS ✓»</b> muhrini oladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            {ROWS.map((r, ri) => (
              <div key={r.key} className={`g11-group fade-up ${keys.find(k => pick[k] === null) === r.key ? 'g11-live' : ''}`} style={{ animationDelay: `${0.05 + ri * 0.08}s` }}>
                <p className="g11-glabel" style={{ color: r.color }}><span className="g11-num" style={{ background: r.color }}>{ri + 1}</span>{r.label}ni tanlang</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {r.order.map(g => {
                    const sel = pick[r.key] === g;
                    return (
                      <button key={g} className={`g11-opt ${sel ? 'sel' : ''}`} onClick={() => set(r.key, g)}
                        style={sel ? { background: r.color, color: '#fff', boxShadow: `0 8px 18px -7px ${r.color}` } : undefined}>
                        <span className="g11-tick" style={{ borderColor: sel ? 'rgba(255,255,255,0.9)' : `${r.color}55`, color: '#fff' }}>{sel && Ico.check(12)}</span>
                        <span style={{ flex: 1 }}>{GROUPS[g][r.key]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </Col>
          <Col>
            <p className="flow-label">Mening g'oyam</p>
            <div className={`algo-build pm-ticket ${matched ? 'pm-match' : ''}`} style={{ minHeight: 150, gap: 9 }}>
              {matched && <span className="pm-stamp ok" key="ok">MOS ✓</span>}
              {allPicked && !matched && <span className="pm-stamp bad" key={pick.kim + pick.muammo + pick.yechim}>MOS EMAS</span>}
              {keys.map(k => {
                const g = pick[k];
                return (
                  <div key={k} className={`g11-slot ${g ? 'filled' : ''}`} style={g ? { borderLeftColor: META[k].color } : undefined}>
                    <span className="mono g11-slabel" style={{ color: g ? META[k].color : T.ink3 }}>{META[k].label}</span>
                    {g ? (
                      <span key={g} className="g11-val el-in">
                        <span style={{ color: META[k].color, display: 'inline-flex', flexShrink: 0 }}>{META[k].ic}</span>
                        {GROUPS[g][k]}
                      </span>
                    ) : (
                      <span className="g11-empty">tanlanmagan…</span>
                    )}
                  </div>
                );
              })}
            </div>
            {matched && (
              <div className="frame-success fade-step pm-match" key={pick.kim}>
                <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mukammal — mos g'oya!</p>
                <p className="body" style={{ margin: 0, color: T.ink }}><b>{GROUPS[pick.kim].kim}</b> — {low(GROUPS[pick.kim].muammo)}. <span style={{ color: T.success, fontWeight: 600 }}>Yechim:</span> {low(GROUPS[pick.kim].yechim)}.</p>
              </div>
            )}
            {allPicked && !matched && (
              <div className="frame-warn fade-step pm-shake" key={pick.kim + '|' + pick.muammo + '|' + pick.yechim}>
                <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mos kelmadi</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>Bu uchtasi bitta odamga mos emas. <b>Kim</b>, uning <b>muammosi</b> va aynan o'sha muammoning <b>yechimi</b> — bittasini o'zgartirib ko'ring.</p>
              </div>
            )}
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
    audioText="To'rtta g'oyadan qaysi biri to'liq: kim, muammo va yechim — uchchalasi ham bor?"
    questionText="Qaysi g'oya TO'LIQ (kim + muammo + yechim bor)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>PM ko'zi bilan tekshiring</p><h2 className="title h-sub" style={{ marginTop: 8 }}>To'rtta g'oyadan qaysi biri <span className="italic" style={{ color: T.accent }}>to'liq</span> — KIM + MUAMMO + YECHIM uchchalasi ham bormi?</h2></>}
    options={['«Juda chiroyli va zamonaviy sport sayti qilamiz»', '«O\'quvchilar uchun sayt — unda hamma narsa bo\'ladi»', '«Ertalab avtobus kutadigan o\'quvchilarga — avtobus qachon kelishini ko\'rsatadigan sayt»', '«Non buyurtma qilinadigan sayt — hamma uchun qulay»']} correctIdx={2}
    explainCorrect="Aniq topdingiz! KIM — avtobus kutadigan o'quvchilar, MUAMMO — qachon kelishi noma'lum, YECHIM — vaqtni ko'rsatadigan sayt. Uchchalasi joyida — qurish mumkin!"
    explainWrong={{
      0: 'Bu yerda faqat DIZAYN istagi bor: sport sayti kimga kerak? Qanday muammoni yechadi? Noma\'lum.',
      1: 'KIM bor-u (o\'quvchilar), lekin MUAMMO yo\'q, «hamma narsa» esa yechim emas — noaniqlik.',
      3: 'YECHIM bor (buyurtma sayti), lekin KIM uchun ekani aniq emas, MUAMMO esa umuman yozilmagan.',
      default: 'To\'liq g\'oyada uchchala javob bo\'ladi: aniq KIM + aniq MUAMMO + aniq YECHIM.'
    }} />
);

// ===== SCREEN 13 — KAMCHILIKNI TOPISH (zaif g'oya) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Do'stingiz g'oyasini ko'rsatyapti va tayyor deyapti. Lekin PM har doim uch katakni tekshiradi: kim, muammo, yechim. Shu g'oyada bittasi bo'sh qolgan. Toping-chi, qaysi biri? O'sha katakni bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'muammo' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'muammo';
  const done = fixed;
  const pickRow = (id) => { if (found) return; setPicked(id); if (id === 'muammo') { audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! MUAMMO katagi bo'sh — bolalarning qanday qiyinchiligi borligi yozilmagan. Endi to'ldiramiz.`); }, 300); } };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`To'ldirildi! Endi g'oya to'liq: kim, qanday muammo va qanday yechim — uchchalasi joyida.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const WRONG = [
    { id: 'kim', label: 'KIM', text: 'Futbolga qiziqadigan, lekin murabbiyi yo\'q bolalar', ok: true },
    { id: 'muammo', label: 'MUAMMO', text: 'bu katak bo\'sh qolgan', ok: false },
    { id: 'yechim', label: 'YECHIM', text: 'Har kunga tayyor mashq rejasini beradigan sayt', ok: true }
  ];
  const RIGHT = [
    { id: 'kim', label: 'KIM', text: 'Futbolga qiziqadigan, lekin murabbiyi yo\'q bolalar' },
    { id: 'muammo', label: 'MUAMMO', text: 'Qanday mashq qilishni bilishmaydi — reja yo\'q' },
    { id: 'yechim', label: 'YECHIM', text: 'Har kunga tayyor mashq rejasini beradigan sayt' }
  ];
  return (
    <Stage eyebrow="Kamchilikni top" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi to\'g\'rilang' : 'Kamchilikni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu g'oyada nima <span className="italic" style={{ color: T.accent }}>yetishmayapti</span>?</h2></div>
        <Mentor>Do'stingiz g'oyasini ko'rsatyapti: <b style={{ color: T.ink }}>«Tayyor, qurishni boshlaymizmi?»</b> Shoshmang! PM har doim uch katakni tekshiradi: <b style={{ color: T.blue }}>KIM</b>, <b style={{ color: T.accent }}>MUAMMO</b>, <b style={{ color: T.success }}>YECHIM</b>. Bu g'oyada bittasi <b style={{ color: T.ink }}>bo'sh qolgan</b> — toping-chi, qaysi biri? O'sha katakni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1 pm-ticket">
              {fixed && <span className="pm-stamp ok">TO'LIQ ✓</span>}
              <div className="ai-row"><span className="ai-badge">G'OYA</span><span className="ai-bubble">Do'stingizning g'oyasi — tekshirib ko'ring:</span></div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <span className="s13-st" style={{ color: T.blue, background: T.blueSoft }}>{Ico.check(12)} KIM bor</span>
                <span className={`s13-st ${!fixed ? 'miss' : ''}`} style={{ color: fixed ? T.success : T.accent, background: fixed ? T.successSoft : T.accentSoft }}>{fixed ? Ico.check(12) : '?'} MUAMMO{fixed ? ' bor' : '…'}</span>
                <span className="s13-st" style={{ color: T.success, background: T.successSoft }}>{Ico.check(12)} YECHIM bor</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(fixed ? RIGHT : WRONG).map(r => {
                  const isMiss = !fixed && r.id === 'muammo';
                  const badPicked = found && r.id === 'muammo';
                  return (
                    <div key={r.id} onClick={() => { if (found || fixed) return; pickRow(r.id); }} className={isMiss && !found ? 's13-miss' : (fixed && r.id === 'muammo' ? 'el-in' : undefined)} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 11, background: badPicked ? T.accentSoft : (fixed && r.id === 'muammo' ? T.successSoft : T.bg), boxShadow: badPicked ? `inset 0 0 0 1.5px ${T.accent}` : (isMiss ? `inset 0 0 0 1.5px ${T.accent}55` : 'none'), transition: 'all 0.18s' }}>
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: r.id === 'kim' ? T.blue : (r.id === 'muammo' ? T.accent : T.success), minWidth: 56, textTransform: 'uppercase' }}>{r.label}</span>
                      <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 13.5, color: isMiss ? T.accent : T.ink, fontStyle: isMiss ? 'italic' : 'normal' }}>{isMiss ? '❓ — ' + r.text + ' —' : r.text}</span>
                    </div>
                  );
                })}
              </div>
              {!found && <p className="ai-prompt">Uch katakning bittasi bo'sh. Toping va bosing 👆</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>✍️ Muammoni yozib to'ldirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>To'ldirildi — endi g'oya «TO'LIQ» muhrini oldi!</p>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>PM tekshiruvi: <b style={{ color: T.blue }}>KIM</b> bormi? Bor — futbolchi bolalar. <b style={{ color: T.success }}>YECHIM</b> bormi? Bor — mashq sayti. <b style={{ color: T.accent }}>MUAMMO</b>-chi?.. 🤔</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>MUAMMO katagi bo'sh: bolalarning aynan <b>qanday qiyinchiligi</b> borligi yozilmagan. Muammosiz esa sayt nima uchun kerakligi noma'lum bo'lib qoladi. Chapdagi tugma bilan to'ldiring.</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ color: T.accent, display: 'inline-flex' }}>{Ico.problem(34)}</div><p className="ta-h">Muammosiz g'oya — bo'sh g'oya</p><p className="ta-sub">G'oyada eng ko'p unutiladigan qism — aynan muammo</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Dunyodagi millionlab saytni bitta jumla bilan tushuntirsa bo'ladi: har bir sayt — kimningdir muammosiga yechim. Pastdagi formulaga qarang — darsdagi barcha misollar unga birma-bir tushib turibdi.`, trigger: 'on_mount', waits_for: null }]);
  const ROWS = [
    { ic: Ico.user(22), color: T.blue, h: 'KIM?', t: 'Sayt aniq kim uchun' },
    { ic: Ico.problem(22), color: T.accent, h: 'MUAMMO?', t: 'U qanday qiyinchilikka duch keladi' },
    { ic: Ico.solution(22), color: T.success, h: 'YECHIM?', t: 'Sayt unga qanday yordam beradi' }
  ];
  // Formula bosqichma-bosqich yig'iladi, ostida darsdagi misollar aylanib turadi
  const [st, setSt] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(() => setSt(1), 350), setTimeout(() => setSt(2), 950), setTimeout(() => setSt(3), 1600)];
    return () => ts.forEach(clearTimeout);
  }, []);
  const EXS = [
    { kim: 'Chanqagan o\'tkinchi', mu: 'ichimlik qayerdaligini bilmaydi', ye: 'Limonad sayti' },
    { kim: 'Non yopadigan buvi', mu: 'xaridor topolmaydi', ye: 'Non buyurtma sayti' },
    { kim: 'Avtobus kutgan o\'quvchi', mu: 'qachon kelishi noma\'lum', ye: 'Jonli xarita sayti' },
    { kim: 'Zerikkan siz', mu: 'nima ko\'rishni bilmaysiz', ye: 'YouTube' }
  ];
  const [exI, setExI] = useState(0);
  useEffect(() => {
    if (st < 3) return;
    const iv = setInterval(() => setExI(i => (i + 1) % EXS.length), 2600);
    return () => clearInterval(iv);
  }, [st]); // eslint-disable-line
  const term = (n) => ({ opacity: st >= n ? 1 : 0.12, transform: st >= n ? 'none' : 'translateY(10px)', transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(.34,1.3,.4,1)' });
  return (
    <Stage eyebrow="Qoida" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Dunyodagi barcha saytlarni <span className="italic" style={{ color: T.accent }}>bitta jumlaga</span> sig'dira olasizmi?</h2></div>
        <Mentor>Ha — va mana o'sha jumla: <b style={{ color: T.ink }}>har bir sayt kimningdir muammosiga yechim</b>. Shuning uchun qurishdan oldin doim <b style={{ color: T.ink }}>uch savolga</b> javob beramiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame fade-up" style={{ padding: 'clamp(18px,2.6vw,26px)' }}>
              <div className="eq-row">
                <span className="eq-term" style={term(1)}><IcoChip color={T.blue} soft={T.blueSoft} size={48}>{Ico.user(24)}</IcoChip><span className="eq-lbl">Aniq odam</span></span>
                <span className="eq-op" style={term(2)}>+</span>
                <span className="eq-term" style={term(2)}><IcoChip color={T.accent} soft={T.accentSoft} size={48}>{Ico.problem(24)}</IcoChip><span className="eq-lbl">Muammo</span></span>
                <span className="eq-op eq-eq" style={term(3)}>=</span>
                <span className={`eq-term ${st >= 3 ? 'pm-pop' : ''}`} style={term(3)}><IcoChip color={T.success} soft={T.successSoft} size={48}>{Ico.solution(24)}</IcoChip><span className="eq-lbl" style={{ color: T.success, fontWeight: 700 }}>Sayt = yechim</span></span>
              </div>
              {st >= 3 && (
                <div className="eq-ex" key={exI}>
                  <span style={{ color: T.blue, fontWeight: 600 }}>{EXS[exI].kim}</span>
                  <span style={{ color: T.ink3 }}> + </span>
                  <span style={{ color: T.accent, fontWeight: 600 }}>{EXS[exI].mu}</span>
                  <span style={{ color: T.ink3 }}> = </span>
                  <span style={{ color: T.success, fontWeight: 700 }}>{EXS[exI].ye}</span>
                </div>
              )}
              <p className="body" style={{ margin: '14px 0 0', color: T.ink2, textAlign: 'center', fontSize: 13 }}>Darsdagi barcha misollar bitta formulaga tushadi — kuzating, ular almashinib turibdi ↑</p>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Qurishdan oldin 3 savol</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROWS.map((r, i) => (
                <div key={i} className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 13, background: T.paper, borderRadius: 13, padding: '13px 15px', boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, animationDelay: `${0.1 + i * 0.1}s` }}>
                  <IcoChip color={r.color} soft={r.color === T.accent ? T.accentSoft : (r.color === T.success ? T.successSoft : T.blueSoft)} size={40}>{r.ic}</IcoChip>
                  <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 16 }}>{r.h}</p><p className="body" style={{ margin: '1px 0 0', color: T.ink2, fontSize: 13.5 }}>{r.t}</p></div>
                </div>
              ))}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: O'Z G'OYANGIZ =====
// Eslatma: ataylab saqlanmaydi — har kirganda bo'sh boshlanadi, o'quvchi yangi muammo o'ylasin.
const emptyIdea = () => ({ kim: '', muammo: '', yechim: '' });
const FIELDS = [
  { key: 'kim', ic: Ico.user(18), color: T.blue, label: 'KIM uchun?', ph: 'Masalan: yozda limonad sotadigan o\'quvchilar' },
  { key: 'muammo', ic: Ico.problem(18), color: T.accent, label: 'Qanday MUAMMO?', ph: 'Masalan: xaridor qayerda sotilishini bilmaydi' },
  { key: 'yechim', ic: Ico.solution(18), color: T.success, label: 'Qanday YECHIM (sayt)?', ph: 'Masalan: sotiladigan joyni ko\'rsatadigan sayt' }
];

const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Mana eng muhim qadam. O'zingiz sezgan bitta muammoni oling. Uchta savolga javob yozing: kim uchun, qanday muammo va qanday sayt yordam beradi. O'ng tomonda g'oyangiz jonli yig'iladi.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const isMentorLive = !!(live && live.mode === 'mentor'); // mentor o'zi yozmaydi — kim tugatganini ko'radi
  const mountTs = useRef(Date.now());
  const [idea, setIdea] = useState(() => storedAnswer?.idea || emptyIdea());
  const [showEx, setShowEx] = useState(false);
  const EXAMPLES = [
    { kim: 'Limonad sotadigan o\'quvchi', muammo: 'Xaridor qayerda va qachon sotilishini bilmaydi', yechim: 'Sotiladigan joy va narxni ko\'rsatadigan sayt' },
    { kim: 'Mazali non yopadigan buvingiz', muammo: 'Nonini faqat qo\'shnilari bilib qoladi — xaridor kam', yechim: 'Non rasmi, narxi va buyurtma tugmasi bor sayt' }
  ];
  const isFilled = (v) => v && v.trim().length >= 6;
  const filled = FIELDS.filter(f => isFilled(idea[f.key])).length;
  const vals = FIELDS.map(f => idea[f.key].trim().toLowerCase()).filter(Boolean);
  const allDistinct = new Set(vals).size === vals.length;
  const passed = filled >= 3 && allDistinct;
  const prevPassed = useRef(false);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, idea, stage: 'final', screenIdx: screen });
      if (live) live.submitAnswer(screen, 's15', 0, true, Date.now() - mountTs.current); // «g'oya tayyor» belgisi mentorga boradi
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Ajoyib! Endi sizda haqiqiy g'oya bor: kim, qanday muammo va qanday yechim.`); }, 300);
    }
  }, [passed]);
  const update = (k, v) => setIdea(prev => ({ ...prev, [k]: v }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? false : !passed} label={isMentorLive || passed ? 'Davom etish' : (filled < 3 ? `To'ldiring (${filled}/3)` : 'Har maydon boshqacha bo\'lsin')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi navbat sizda — qanday <span className="italic" style={{ color: T.accent }}>muammoni</span> yechasiz?</h2></div>
        <Mentor>O'zingiz sezgan bitta muammoni oling. Uchta savolga javob yozing: <b style={{ color: T.ink }}>kim uchun</b>, <b style={{ color: T.ink }}>qanday muammo</b> va <b style={{ color: T.ink }}>qanday sayt</b> yordam beradi.</Mentor>
        <div className="split">
          <Col>
            {FIELDS.map(f => {
              const ok = isFilled(idea[f.key]);
              return (
                <div key={f.key} style={{ background: T.paper, borderRadius: 13, padding: '13px 15px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.18)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                    <span style={{ color: ok ? T.success : f.color, display: 'inline-flex' }}>{ok ? Ico.check(16) : f.ic}</span>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: T.ink, textTransform: 'uppercase' }}>{f.label}</span>
                  </div>
                  <textarea value={idea[f.key]} onChange={e => update(f.key, e.target.value)} placeholder={f.ph} rows={2}
                    style={{ width: '100%', fontFamily: "'Manrope',sans-serif", fontSize: 14, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '9px 11px', resize: 'vertical', minHeight: 40, outline: 'none', lineHeight: 1.45, boxSizing: 'border-box' }} />
                </div>
              );
            })}
            <button type="button" className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowEx(v => !v)}>
              {showEx ? '✕ Namunalarni yopish' : '💡 Qiynaldingizmi? Namuna ko\'ring'}
            </button>
            {showEx && (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {EXAMPLES.map((ex, i) => (
                  <div key={i} className="ex-card">
                    <span className="mono ex-tag"><span style={{ color: T.blue }}>KIM:</span> {ex.kim}</span>
                    <span className="mono ex-tag"><span style={{ color: T.accent }}>MUAMMO:</span> {ex.muammo}</span>
                    <span className="mono ex-tag"><span style={{ color: T.success }}>YECHIM:</span> {ex.yechim}</span>
                  </div>
                ))}
                <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Bular — shunchaki ilhom. O'zingiznikini o'ylab toping!</p>
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Sizning saytingiz shunday ko'rinadi</p>
            <Preview url="mening-saytim.uz" minH={188}>
              {FIELDS.every(f => !idea[f.key].trim()) ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: G }}>Chap tomonni to'ldiring — saytingiz shu yerda jonlanadi…</p>
              ) : (
                <SiteMock
                  logo={((idea.yechim.trim() || idea.kim.trim() || 'S')[0] || 'S').toUpperCase()}
                  color={T.accent}
                  name={idea.yechim.trim() ? idea.yechim.trim().split(' ').slice(0, 2).join(' ') : 'Mening saytim'}
                  headline={idea.yechim.trim() || 'Sizning yechimingiz'}
                  sub={`${idea.kim.trim() ? idea.kim.trim() + ' uchun. ' : ''}${idea.muammo.trim() ? 'Muammo: ' + idea.muammo.trim() + '.' : ''}`}
                  cta="Boshlash"
                />
              )}
            </Preview>
            {passed && <div className="frame-success fade-step pm-match" key="final-ok"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! G'oyangiz allaqachon sayt kabi ko'rinmoqda — keyingi darslarda HTML bilan shunday saytni quramiz.</p></div>}
          </Col>
        </div>
        {isMentorLive && <MentorWorkStats live={live} screenIdx={screen} taskLabel="Yakuniy g'oya — kim tugatdi?" />}
      </div>
    </Stage>
  );
};

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

// ============================================================
// ⚔️ MUSTAHKAMLASH — Kahoot uslubidagi jonli test (12 savol · 20s)
// Mentor quiz_control RPC bilan fazalarni boshqaradi: lobby → q → r → … → done.
// O'quvchilar arenada 1.2s polling bilan sinxron yuradi. Ball — Kahoot formulasi:
// to'g'ri = 1000×(1−(vaqt/20s)/2); ketma-ket 2+ to'g'ri = +100 (streak 🔥).
// Solo (self/mashq) rejimda lokal o'ynaladi, serverga yozilmaydi.
// Javoblar live_answers'da screen_idx = 100 + savol_raqami bilan saqlanadi.
// ============================================================
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
// 12 ta PM savoli — dars kontentidan, chalg'ituvchilari ishonarli
// Server-baholash javob kaliti (dars ichidagi testlar; s6/s15 = -1 ishtirok). quiz-N QUIZ_BANK'dan avto-qo'shiladi.
const INLINE_KEYS = { s4: 2, s5b: 1, s9: 2, s12: 2, s6: -1, s15: -1 };
const QUIZ_BANK = [
  { q: 'Sayt ENG AVVAL nima uchun yaratiladi?', opts: ['Mashhur bo\'lish uchun', 'Egasiga pul topish uchun', 'Aniq odamning muammosini yechish uchun', 'Chiroyli ko\'rinish uchun'], correct: 2 },
  { q: '«Hamma uchun» qilingan sayt aslida…', opts: ['hech kim uchun bo\'lib qoladi', 'eng ko\'p odam yig\'adi', 'eng tez ishlaydi', 'eng ko\'p pul topadi'], correct: 0 },
  { q: 'PM (mahsulot menejeri) birinchi bo\'lib nimani aniqlaydi?', opts: ['Sayt dizayni qanday bo\'lishini', 'KIM va uning qanday MUAMMOSI borligini', 'Saytga zo\'r nom topishni', 'Qancha pul ketishini'], correct: 1 },
  { q: 'Muammo yo\'qolsa, saytga nima bo\'ladi?', opts: ['Tezroq ishlay boshlaydi', 'Hech nima — ishlayveradi', 'Avtomatik yangilanadi', 'Hech kim kirmay qo\'yadi'], correct: 3 },
  { q: 'To\'liq g\'oya formulasi qaysi?', opts: ['NOM + RANG + TUGMA', 'KIM + MUAMMO + YECHIM', 'DIZAYN + REKLAMA + PUL', 'SAYT + ILOVA + O\'YIN'], correct: 1 },
  { q: 'Buvining non saytida XARIDOR birinchi nimaga qaraydi?', opts: ['Buyurtmalar ro\'yxatiga', 'Yetkazish manziliga', 'Narx va buyurtma tugmasiga', 'Sayt rangiga'], correct: 2 },
  { q: 'Mashhurlik va pul — bu…', opts: ['muammo yechilganidan keyingi NATIJA', 'saytning birinchi maqsadi', 'faqat reklamaga bog\'liq narsa', 'faqat omadga bog\'liq narsa'], correct: 0 },
  { q: 'Qaysi biri ishlashga arziydigan REAL muammo?', opts: ['«Sayt ko\'k rangda bo\'lsin»', '«Zo\'r nom topish kerak»', '«Ko\'proq tugma qo\'shish kerak»', '«Bekatda avtobusni qancha kutish noma\'lum»'], correct: 3 },
  { q: 'Do\'stingiz g\'oyasida MUAMMO katagi bo\'sh. Bu nimani bildiradi?', opts: ['G\'oya baribir tayyor', 'Sayt nima uchun kerakligi noma\'lum', 'Faqat dizayn yetishmayapti', 'Faqat nom yetishmayapti'], correct: 1 },
  { q: 'Bitta saytga kiradigan har xil odamlar (buvi, xaridor, kuryer)…', opts: ['hammasi bir xil narsani izlaydi', 'faqat dizaynga qaraydi', 'har biri O\'ZINIKINI izlaydi', 'faqat narxga qaraydi'], correct: 2 },
  { q: 'Yechim qanday bo\'lishi SHART?', opts: ['Iloji boricha kattaroq', 'Aynan o\'sha muammoga mos', 'Hammaga birdek yoqadigan', 'Eng zamonaviy uslubda'], correct: 1 },
  { q: '«Issiqda chanqaganlar uchun park yonida muzdek limonad» — bu g\'oyada nima aniq?', opts: ['Faqat YECHIM aniq', 'Faqat KIM aniq', 'Hech narsa aniq emas', 'KIM ham, MUAMMO ham, YECHIM ham'], correct: 3 },
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

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz! Bugun siz mahsulot menejeridek o'ylay boshladingiz. Eslang: har bir sayt kimningdir muammosiga yechim. Avval kim va qanday muammo ekanini bilamiz, keyingina yechimni quramiz. Keyingi darslarda shu yechimni HTML bilan o'z qo'lingiz bilan qurishni boshlaymiz.", trigger: 'on_mount', waits_for: null }]);
  // ⚔️ Mustahkamlash testi: jonli darsda mentor ochadi → o'quvchilar kiradi.
  // Dars tugagan / mentor uzilgan / test ochilmagan bo'lsa — o'quvchi UYDA
  // xuddi shu taymer bilan SOLO (mashq) ishlaydi, natijani o'zi ko'radi.
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const [arena, setArena] = useState(false);
  const [arenaSolo, setArenaSolo] = useState(false);
  const quizSt = (live && live.quiz && live.quiz.state) || 'off';
  const isStudentL = live && live.mode === 'student';
  const isMentorL = live && live.mode === 'mentor';
  const classOver = !!(live && (live.status === 'ended' || !live.mentorAlive)); // jonli sinf tugagan/uzilgan
  const studentSolo = isStudentL && classOver && quizSt !== 'done';
  const studentLive = isStudentL && !studentSolo && quizSt !== 'off';
  const studentWait = isStudentL && !studentSolo && quizSt === 'off';
  const openArena = async () => {
    if (isMentorL && quizSt === 'off') { try { await live.quizControl('lobby', -1); } catch { return; } }
    setArenaSolo(studentSolo); // uydagi o'quvchi — mashq rejimida
    setArena(true);
  };
  const RECAP = ['Har bir sayt kimningdir real muammosiga yechim', 'Avval aniq odamni (foydalanuvchini) tanlaymiz', '"Hamma uchun" — aslida hech kim uchun', 'To\'liq g\'oya: KIM + MUAMMO + YECHIM'];
  const HOMEWORK = [{ b: 'Bitta muammo toping', t: '— o\'zing, do\'sting yoki maktabda sezgan qiyinchilikni yozing' }, { b: 'Foydalanuvchini aniqlang', t: '— bu muammo aniq kimniki?' }, { b: 'Yechim o\'ylang', t: '— qanday sayt yordam beradi yoki hatto pul ishlab beradi?' }];
  const GLOSSARY = [{ b: 'Foydalanuvchi', t: '— saytni ishlatadigan aniq odam' }, { b: 'Muammo', t: '— odam his qiladigan real qiyinchilik' }, { b: 'Yechim', t: '— sayt muammoni qanday osonlashtiradi' }, { b: 'Mahsulot menejeri (PM)', t: '— kim, qanday muammo, qanday yechim ekanini hal qiladi' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        {PASSED && <Confetti />}
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>mahsulot menejeridek</span> o'ylaysiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Muammo, foydalanuvchi va yechimni tushundingiz — qurishni boshlashga tayyorsiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
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
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Bitta yangi g'oyani topib keling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda HTML bilan shu yechimni qurishni boshlaymiz.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
      {arena && <QuizArena live={live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson1({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());

  // ETALON — 1920px (InternetLesson standarti): kengroq oynada (2K monitor, brauzer
  // zoom <100%) butun dars proportsional kattalashadi, 1920 va undan torda z=1.
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
    live.endSession(); // mentor "Yakunlash" bossa — barcha o'quvchilarga erkinlik
    const scoredMeta = SCREEN_META.filter(s => s.scored);
    const finalMeta = scoredMeta.filter(s => s.scope === 'final');
    const scoredAnswers = SCREEN_META.map((s, i) => (s.scored ? answers[i] : null)).filter(Boolean);
    const correctAnswers = scoredAnswers.filter(a => a.correct).length;
    const finalCorrect = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean).filter(a => a.correct).length;
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, ScreenPodium, Screen16];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        /* PRODUCTION: shu @import OLIB TASHLANADI — shriftlarni LMS yuklaydi (platform_contract). */
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,500&family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        /* Keng ekran etaloni (--lz JS'da hisoblanadi): ≥1920px oynada proportsional kattalashadi */
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; zoom: var(--lz, 1); height: calc(100dvh / var(--lz, 1)); overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
        .lesson-root h1,.lesson-root h2,.lesson-root h3,.lesson-root h4,.lesson-root h5,.lesson-root h6,.lesson-root p,.lesson-root ul,.lesson-root ol { margin: 0; padding: 0; }

        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.45s cubic-bezier(.2,.7,.2,1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: calc(90vh / var(--lz, 1)); overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
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

        /* === pm animatsiya yaxshilashlari === */
        /* Reja (s1): formula oxirida sayt paydo bo'ladi */
        .pf-site { opacity: 0; transform: translateY(12px) scale(0.97); transition: opacity 0.55s ease, transform 0.55s cubic-bezier(.34,1.3,.4,1); display: flex; flex-direction: column; gap: 8px; }
        .pf-site.show { opacity: 1; transform: none; }
        .pf-site-cap { margin: 0; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.success}; text-align: center; }
        /* Muammo — yurak (s3): odam ↔ sayt sahna, kiruvchilar oqimi, qirqilgan ip */
        .s3-scene { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 16px; padding: clamp(16px,2.6vw,24px); box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); flex-wrap: wrap; }
        .s3-node { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; min-width: 118px; }
        .s3-face { font-size: 46px; line-height: 1; animation: pmPop 0.45s cubic-bezier(.34,1.55,.5,1); }
        .s3-link { position: relative; flex: 1; min-width: 90px; height: 26px; display: flex; align-items: center; }
        .s3-wire { width: 100%; height: 3px; border-radius: 2px; background: ${T.accent}; transition: all 0.3s; }
        .s3-link.cut .s3-wire { background: transparent; border-top: 2.5px dashed ${T.ink3}; height: 0; }
        .s3-scissors { position: absolute; left: 50%; top: 50%; font-size: 20px; animation: pm-snip 0.55s cubic-bezier(.34,1.5,.5,1) forwards; }
        @keyframes pm-snip { 0% { transform: translate(-50%,-50%) scale(0) rotate(-40deg); } 60% { transform: translate(-50%,-50%) scale(1.35) rotate(12deg); } 100% { transform: translate(-50%,-50%) scale(1) rotate(0); } }
        .s3-dot { position: absolute; top: 50%; width: 9px; height: 9px; margin-top: -4.5px; border-radius: 99px; background: ${T.accent}; box-shadow: 0 0 7px rgba(255,79,40,0.6); animation: s3-flow 1.7s linear infinite; }
        .s3-dot.d2 { animation-delay: 0.55s; } .s3-dot.d3 { animation-delay: 1.15s; }
        @keyframes s3-flow { 0% { left: 0; opacity: 0; } 12% { opacity: 1; } 86% { opacity: 1; } 100% { left: calc(100% - 9px); opacity: 0; } }
        .s3-site { flex: 1.35; min-width: 235px; display: flex; flex-direction: column; gap: 7px; transition: filter 0.5s ease, opacity 0.5s ease; }
        .s3-site.off { filter: grayscale(1); opacity: 0.45; }
        .s3-visit { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 12.5px; color: ${T.success}; animation: fade-step 0.4s ease; }
        .s3-visit.zero { color: ${T.ink3}; }
        /* Amaliyot (s6): PM daftari */
        .pr-slot { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; transition: box-shadow 0.25s ease; }
        .pr-slot-head { display: flex; align-items: center; gap: 9px; margin-bottom: 9px; }
        .pr-slot-num { width: 20px; height: 20px; border-radius: 50%; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 11px; flex-shrink: 0; transition: background 0.25s; }
        .pr-note { display: flex; align-items: flex-start; gap: 10px; background: ${T.paper}; border-left: 3px solid ${T.success}; border-radius: 12px; padding: 13px 15px; box-shadow: 0 6px 16px -8px rgba(31,122,77,0.2); }
        /* Har xil odam (s8): saytga «uning ko'zi bilan» qarash */
        .eye-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-family: 'Manrope', sans-serif; font-size: 13px; color: ${T.ink}; background: ${T.bg}; border-radius: 10px; padding: 10px 12px; transition: all 0.3s ease; }
        .eye-row.hot { background: ${T.accentSoft}; box-shadow: inset 0 0 0 2px ${T.accent}; animation: eye-pulse 1.3s ease-in-out infinite; }
        @keyframes eye-pulse { 0%,100% { box-shadow: inset 0 0 0 2px ${T.accent}, 0 0 0 0 rgba(255,79,40,0.25); } 50% { box-shadow: inset 0 0 0 2px ${T.accent}, 0 0 0 6px rgba(255,79,40,0); } }
        .eye-cta { margin-left: auto; color: #fff; font-weight: 700; font-size: 11.5px; border-radius: 8px; padding: 5px 11px; transition: background 0.3s; }
        /* Ulash o'yini (s10): ko'priklar */
        .pm-hintnow { text-transform: none; letter-spacing: 0; font-size: 11.5px; color: ${T.accent}; animation: fade-step 0.3s ease; }
        .pm-bridges { background: ${T.paper}; border-radius: 14px; padding: 13px 16px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 8px; }
        .pm-bridge { display: flex; align-items: center; gap: 10px; }
        .pm-bridge-p, .pm-bridge-s { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 12.5px; padding: 7px 12px; border-radius: 99px; white-space: nowrap; }
        .pm-bridge-p { background: ${T.accentSoft}; color: ${T.accent}; }
        .pm-bridge-s { background: ${T.successSoft}; color: ${T.success}; }
        .pm-bridge-wire { flex: 1; height: 2.5px; background: linear-gradient(90deg, ${T.accent}, ${T.success}); border-radius: 2px; position: relative; min-width: 40px; animation: bridge-grow 0.5s cubic-bezier(.2,.7,.2,1); transform-origin: left; }
        @keyframes bridge-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .pm-bridge-link { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); font-size: 13px; background: ${T.paper}; padding: 0 3px; }
        /* Muhr (s11, s13): MOS ✓ / MOS EMAS / TO'LIQ ✓ */
        .pm-ticket { position: relative; }
        .pm-stamp { position: absolute; top: 8px; right: 10px; z-index: 3; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 14px; letter-spacing: 0.08em; padding: 5px 12px; border: 2.5px solid; border-radius: 8px; transform: rotate(-8deg); background: rgba(255,255,255,0.88); animation: pm-stamp 0.5s cubic-bezier(.34,1.6,.5,1); pointer-events: none; }
        .pm-stamp.ok { color: ${T.success}; border-color: ${T.success}; }
        .pm-stamp.bad { color: ${T.accent}; border-color: ${T.accent}; }
        @keyframes pm-stamp { 0% { transform: rotate(-8deg) scale(2.4); opacity: 0; } 55% { transform: rotate(-8deg) scale(0.94); opacity: 1; } 100% { transform: rotate(-8deg) scale(1); opacity: 1; } }
        .g11-live .g11-num { animation: dl-pulse 1s ease-in-out infinite; }
        /* Kamchilik top (s13): bo'sh katak pulsatsiyasi + status chiplar */
        .s13-st { display: inline-flex; align-items: center; gap: 5px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.04em; padding: 4px 10px; border-radius: 99px; }
        .s13-st.miss { animation: dl-pulse 1.1s ease-in-out infinite; }
        .s13-miss { animation: s13-blink 1.2s ease-in-out infinite; }
        @keyframes s13-blink { 0%,100% { background: ${T.bg}; } 50% { background: ${T.accentSoft}; } }
        /* Qoida (s14): misollar karuseli */
        .eq-ex { margin-top: 14px; text-align: center; font-family: 'Source Serif 4', serif; font-size: clamp(13.5px,1.8vw,16px); background: ${T.bg}; border-radius: 10px; padding: 10px 14px; animation: fade-step 0.5s ease; }

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
        /* Kahoot-reveal: javob qotdi, natija hali sir — neytral ko'k belgi (to'g'ri/xato sezdirmaydi) */
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 9px 14px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -6px rgba(${T.shadowBase},0.22); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover { transform: translateY(-1px); }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -7px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI === */
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
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .frame-col { display: flex; flex-direction: column; }
        .ex-card { display: flex; flex-direction: column; gap: 3px; background: ${T.bg}; border-radius: 11px; padding: 11px 13px; box-shadow: inset 0 0 0 1px rgba(${T.shadowBase},0.08); }
        .ex-tag { font-size: 12px; color: ${T.ink}; line-height: 1.45; } .ex-tag span { font-weight: 700; letter-spacing: 0.03em; }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === BRAUZER MAKETI (HTML darslar dizayni) === */
        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 12px 30px -8px rgba(${T.shadowBase},0.2); }
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-url { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; display: flex; align-items: center; gap: 6px; } .lock { color: ${T.success}; font-size: 8px; }
        .bp-body { padding: clamp(13px,2.2vw,18px); }
        .pg-in { animation: pg-in 0.38s cubic-bezier(.2,.7,.2,1); } @keyframes pg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .site-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid ${T.ink3}40; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .site-brand { display: inline-flex; align-items: center; gap: 8px; } .site-logo { width: 24px; height: 24px; border-radius: 6px; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 13px; } .site-name { font-family: 'Manrope'; font-weight: 700; color: ${T.ink}; font-size: 14px; }
        .site-nav { display: inline-flex; gap: 12px; font-family: 'Manrope'; font-size: 12px; color: ${T.ink2}; }
        .site-h3 { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,21px); color: ${T.ink}; margin: 0 0 8px; }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }

        /* === ROADMAP === */
        /* Reja (2-page) — muammo → 3 savol → yechim animatsiyasi */
        .pf-row { display: flex; align-items: center; gap: 12px; padding: 11px 13px; border-radius: 12px; background: ${T.bg}; }
        .pf-emoji { font-size: 26px; line-height: 1; flex-shrink: 0; }
        .pf-k { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: ${T.ink3}; margin: 0; }
        .pf-v { font-family: 'Source Serif 4', serif; font-size: 14px; color: ${T.ink}; margin: 1px 0 0; }
        .pf-arrow { text-align: center; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 11.5px; color: ${T.ink3}; }
        .pf-q { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: 10px; background: ${T.paper}; box-shadow: inset 0 0 0 1.5px transparent; opacity: 0.45; transition: opacity 0.35s ease, background 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease; }
        .pf-q.on { opacity: 1; background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; transform: scale(1.025); }
        .pf-q.done { opacity: 1; background: ${T.paper}; box-shadow: inset 0 0 0 1.5px ${T.successSoft}; }
        .pf-qic { display: flex; flex-shrink: 0; color: ${T.accent}; }
        .pf-q.done .pf-qic { color: ${T.success}; }
        .pf-qq { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.ink}; flex-shrink: 0; }
        .pf-qa { font-family: 'Source Serif 4', serif; font-size: 13px; color: ${T.ink2}; margin-left: auto; text-align: right; }
        .pf-sol { background: ${T.successSoft}; opacity: 0.4; transform: translateY(8px); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(.34,1.3,.4,1); }
        .pf-sol.show { opacity: 1; transform: none; }
        .pf-check { margin-left: auto; display: flex; color: ${T.success}; }
        /* G'oya tug'iladi (Screen7) — mantiqiy zanjir bog'lovchisi */
        .g7-link { display: flex; align-items: center; gap: 9px; padding: 7px 0 7px 26px; }
        .g7-bar { width: 3px; height: 22px; border-radius: 2px; flex-shrink: 0; transition: background 0.35s ease, opacity 0.35s ease; }
        .g7-q { font-family: 'Source Serif 4', serif; font-style: italic; font-size: 13px; padding: 4px 11px; border-radius: 8px; border: 1px solid transparent; transition: all 0.35s ease; }
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 16px 18px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); animation: fade-step 0.34s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === CONN === */
        .conn-flow { display: flex; align-items: center; justify-content: center; gap: 6px; background: ${T.paper}; border-radius: 16px; padding: 24px 16px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .conn-node { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; transition: opacity 0.3s; }
        .conn-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .conn-sub { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; text-align: center; }
        .conn-link { display: flex; align-items: center; gap: 3px; flex: 1; max-width: 150px; }
        .conn-line { flex: 1; height: 3px; background: ${T.success}; border-radius: 2px; transition: background 0.3s; }
        .conn-sig { display: inline-flex; }
        .conn-link.cut .conn-line { background: ${T.ink3}; opacity: 0.5; border-top: 2px dashed ${T.accent}; height: 0; }
        .conn-link.cut { animation: shake 0.3s; }
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }

        /* === ALGO BUILD === */
        .algo-build { background: ${T.paper}; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 7px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .algo-line { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: ${T.bg}; }
        /* G'oya yig'ish (Screen11) — toza tanlov + slotlar */
        .g11-group { display: flex; flex-direction: column; gap: 7px; }
        .g11-glabel { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
        .g11-num { width: 18px; height: 18px; border-radius: 50%; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
        .g11-opt { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; border: none; border-radius: 11px; padding: 12px 14px; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.6vw,14.5px); color: ${T.ink}; background: ${T.paper}; cursor: pointer; transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease; box-shadow: 0 5px 14px -8px rgba(${T.shadowBase},0.18); }
        .g11-opt:hover:not(.sel) { transform: translateY(-1px); box-shadow: 0 10px 20px -9px rgba(${T.shadowBase},0.26); }
        .g11-opt.sel { animation: pmPop 0.4s cubic-bezier(.34,1.5,.5,1); }
        .g11-tick { width: 19px; height: 19px; border-radius: 50%; border: 2px solid; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; transition: all 0.16s; }
        .g11-slot { display: flex; align-items: center; gap: 11px; padding: 13px 14px; border-radius: 10px; background: ${T.bg}; border-left: 3px solid ${T.ink3}40; min-height: 48px; transition: border-color 0.3s ease, background 0.3s ease; }
        .g11-slot.filled { background: ${T.paper}; box-shadow: 0 5px 14px -9px rgba(${T.shadowBase},0.2); }
        .g11-slabel { font-size: 10px; text-transform: uppercase; min-width: 52px; font-weight: 700; letter-spacing: 0.04em; transition: color 0.3s; }
        .g11-val { display: flex; align-items: center; gap: 8px; flex: 1; font-family: 'Manrope', sans-serif; font-size: 13.5px; color: ${T.ink}; font-weight: 500; }
        .g11-empty { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${T.ink3}; font-style: italic; }
        /* Qoida (Screen14) — vizual formula */
        .eq-row { display: flex; align-items: center; justify-content: center; gap: clamp(8px,1.6vw,14px); flex-wrap: wrap; }
        .eq-term { display: flex; flex-direction: column; align-items: center; gap: 7px; }
        .eq-lbl { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 12.5px; color: ${T.ink}; text-align: center; }
        .eq-op { font-family: 'Source Serif 4', serif; font-size: clamp(20px,2.6vw,26px); font-weight: 600; color: ${T.ink3}; padding-bottom: 18px; }
        .eq-eq { color: ${T.success}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; } .ta-bulb { } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        /* MOBIL: yig'iladigan Mentor */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }
      `}</style>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="PM darsi" />
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
