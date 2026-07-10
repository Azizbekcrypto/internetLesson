import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';

// ============================================================
// PM 3-DARS — STORYTELLING / PITCH (2 daqiqada tushuntirish) — PLATFORM STANDARD v16
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
// Mentor avatar — hostlangan rasm (11.1 standart, LMS'da assets papkasi yo'q)
const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png';


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
  // 🔴 Katta PIN (LiveBigCode) AUTO-ochilmaydi — faqat «📺 Ko'rsatish» tugmasi ochadi
  // (auto-open bo'lsa onboarding tur ortida data-tour="live" spotlight bo'sh chiqadi).
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
    if (live.ended) return <div data-tour="live" className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.ink3)} /> 🔓 O'quvchilar erkin qilindi</div>;
    return (<>
      {bigOpen && <LiveBigCode pin={live.pin} onClose={() => setBigOpen(false)} />}
      <div data-tour="live" className="live-badge" style={_liveBadgeS}>
        <span style={_liveDot(LT.success)} /> Kod: <b style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>{fmtPin(live.pin)}</b>
        {nPlayers !== null && <span style={{ color: LT.ink2 }}>👥 {nPlayers}</span>}
        <button onClick={() => setBigOpen(true)} title="Kodni katta ko'rsatish" style={{ marginLeft: 6, background: LT.ink, color: '#fff', border: 'none', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>📺 Ko'rsatish</button>
        <button onClick={() => { if (window.confirm("O'quvchilarni ozod qilasizmi? Ular o'zlari erkin davom etadi.")) live.endSession(); }} style={{ background: LT.accentSoft, color: LT.accent, border: 'none', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔓 Erkin qilish</button>
      </div>
    </>);
  }
  if (live.mode === 'student') {
    if (live.status === 'ended') return <div data-tour="live" className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.success)} /> 🔓 Erkin rejim — o'zingiz davom eting</div>;
    if (!live.mentorAlive) return <div data-tour="live" className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.ink3)} /> ⚠️ Mentor uzildi — erkin rejim</div>;
    if (!live.connected) return <div data-tour="live" className="live-badge" style={_liveBadgeS}><span style={_liveDot('#FFD380')} /> 🔄 Qayta ulanmoqda…</div>;
    return <div data-tour="live" className="live-badge" style={_liveBadgeS}><span style={_liveDot(LT.success)} /> 👨‍🏫 Mentor: {Math.min(live.mentorScreen + 1, total)} / {total}{live.nickname && <span style={{ color: LT.ink3 }}>· {live.nickname}</span>}</div>;
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
  map: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>),
  book: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" /><path d="M5 16h13" /></svg>),
  // real ilovalar — o'z brend ranglari bilan (bolalar taniydigan belgilar)
  youtube: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="5" width="20" height="14" rx="4.2" fill="#FF0000" /><path d="M10 8.6v6.8L15.8 12z" fill="#fff" /></svg>),
  telegram: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><circle cx="12" cy="12" r="11" fill="#29A9EB" /><path d="M17.9 7.2l-2.05 9.4c-.15.68-.56.84-1.13.52l-3.1-2.28-1.5 1.44c-.16.16-.3.3-.62.3l.22-3.1 5.68-5.13c.25-.22-.05-.34-.38-.12l-7 4.42-3.02-.94c-.66-.2-.67-.66.14-.97l11.8-4.55c.55-.2 1.03.13.98.49z" fill="#fff" /></svg>),
  market: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><path d="M5 9.5h14V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" fill="#7B3FE4" fillOpacity="0.18" /><path d="M3.4 5.5h17.2l1.05 3.3a2.25 2.25 0 0 1-4.35.55 2.25 2.25 0 0 1-4.3 0 2.25 2.25 0 0 1-4.3 0 2.25 2.25 0 0 1-4.35-.55z" fill="#7B3FE4" /><rect x="9.7" y="13" width="4.6" height="7" rx="0.8" fill="#7B3FE4" /></svg>),
  taxi: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><path d="M4 16.2l1.5-4.9A2.5 2.5 0 0 1 7.9 9.6h8.2a2.5 2.5 0 0 1 2.4 1.7l1.5 4.9v3a.8.8 0 0 1-.8.8h-1.5a.8.8 0 0 1-.8-.8V19H6.6v.2a.8.8 0 0 1-.8.8H4.3a.8.8 0 0 1-.8-.8z" fill="#FFB300" /><rect x="9" y="6.4" width="6" height="2.6" rx="0.5" fill="#222" /><circle cx="7.6" cy="16.4" r="1.15" fill="#222" /><circle cx="16.4" cy="16.4" r="1.15" fill="#222" /></svg>)
};

const LESSON_META = { lessonId: 'pm-pitch-03-v18', lessonTitle: { uz: 'Storytelling — pitch', ru: 'Сторителлинг — питч' } };
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
  { id: 'sflash', type: 'flashcard', template: 'custom',  scored: false, scope: null },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

// 🏅 NISHONLAR (Badges) — inglizcha o'yin-nom (istisno), desc o'zbekcha siz-forma
const AchCtx = createContext(null); // olingan nishonlar (Set) — Stage hisoblagichi uchun
const ACHIEVEMENTS = {
  storyteller: { icon: '🎬', name: 'Storyteller!',    desc: 'Pitch treyler kabi ishlashini to\'g\'ri tushundingiz' },
  editor:      { icon: '🎞️', name: 'Final Cut!',      desc: 'Treyler-montajni to\'g\'ri yig\'dingiz' },
  pitcher:     { icon: '🎤', name: 'Pitch Perfect!',  desc: 'O\'z pitchingizni yozib chiqdingiz' },
  graduate:    { icon: '🏆', name: 'Level Up!',        desc: 'Pitch darsini to\'liq yakunladingiz' },
};
// Ekran id → nishon (recordAnswer'da correct:true bo'lganda avtomatik beriladi).
// FAQAT ma'noli ekranlar: s9 (scored test), s13 (treyler-montaj g'alabasi), s15 (final).
const ACH_TRIGGERS = { s9: 'storyteller', s13: 'editor', s15: 'pitcher' };

// Backtick ichidagi kodni chip qiladi (`<a>` → chip)
const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;

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
      <button data-tour="ach" className={`ach-counter ${bump ? 'bump' : ''} ${count > 0 ? 'has' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Badges" title="Badges">
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
          <div data-tour="progress" className="progress-track"><div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }} /></div>
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
  return <button data-tour="next" className="btn-white-accent" disabled={(freeRide ? false : disabled) || locked} onClick={onClick} title={locked ? 'Mentor hali bu sahifaga o\'tmadi' : undefined} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)', marginLeft: 'auto' }}>{locked ? '⏳ Mentorni kuting' : (freeRide && disabled ? 'Davom etish' : label)}</button>;
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
// RECAPS kontenti — 4 scored inline test (idx 4, 6, 10, 13) × 3 karta, treyler/pitch metaforasi bilan.
const RECAPS = {
  4: {
    title: 'Pitch nimadan boshlanadi',
    cards: [
      { ic: '🎬', h: 'Pitch — mahsulot treyleri', body: 'Kino treyleri birinchi soniyada ushlaydi. Pitch ham xuddi shunday: birinchi gap qiziqtirmasa, tinglovchi qolganini eshitmaydi.', vis: <RcFlow items={['Birinchi gap', 'diqqatni tortadi', 'qolgan pitch']} />, ask: 'Sevimli filmingiz treyleri qanday boshlanadi — darrov qiziqtiradimi?' },
      { ic: '✋', h: 'Kuchli birinchi gap', body: 'Yaxshi boshlama — tanish savol yoki muammo: «Uyingizda ishlatilmay yotgan narsalar bormi?». Bu tinglovchini o\'ylatadi va o\'ziga tegishli deb his qildiradi.', ask: 'Qaysi boshlama kuchliroq: «men sayt qildim» yoki «sizda shu muammo bormi?»' },
      { ic: '🚫', h: 'Texnik tafsilot — zaif boshlama', body: '«HTML va CSS da qilingan» kabi fakt hech kimni qiziqtirmaydi. Birinchi gap odamning muammosiga tegsin, texnik tafsilotga emas.', ask: 'Nega «bu sayt HTML da» degan gap tinglovchini ushlab tura olmaydi?' },
    ],
  },
  6: {
    title: 'Demo + harakat vazifasi',
    cards: [
      { ic: '🎥', h: 'Demo — ko\'rsatib ishontiradi', body: 'Demo mahsulotning ishlayotganini ko\'rsatadi. Gap bilan aytishdan ko\'ra, ko\'rsatish tinglovchini kuchliroq ishontiradi.', ask: 'Nega «ishlaydi» deb aytgandan ko\'ra ishlab ko\'rsatgan kuchliroq?' },
      { ic: '👉', h: 'Harakat — keyingi qadam', body: 'Harakat (chaqiriq) aniq aytadi: «hoziroq sinab ko\'ring». Tinglovchi endi nima qilishini biladi — pitch havoda qolmaydi.', ask: 'Yaxshi pitch oxirida tinglovchi nimani aniq bilishi kerak?' },
      { ic: '🏁', h: 'Demo + harakat — kuchli yakun', body: 'Bu ikkisi birga pitchni tugatadi: avval ko\'rsat, keyin chaqir. Shu bilan tinglovchida sinab ko\'rish istagi paydo bo\'ladi.', vis: <RcFlow items={['Ko\'rsat', 'ishontir', 'chaqir']} />, ask: 'Demo va chaqiriqdan biri tushib qolsa, pitch nimasidan yutqazadi?' },
    ],
  },
  10: {
    title: 'Pitch = treyler',
    cards: [
      { ic: '🎬', h: 'Treyler, to\'liq film emas', body: 'Treyler hammasini ko\'rsatmaydi — eng qiziq joyini beradi. Pitch ham: hamma tafsilotni emas, faqat foydani qiziqtirib aytadi.', ask: 'Treyler butun filmni ko\'rsatsa, sizni kinoga qiziqtira oladimi?' },
      { ic: '⏱️', h: 'Qisqa va aniq', body: 'Pitch — 2 daqiqa. Uzun bo\'lsa, tinglovchi charchaydi va asosiy fikr yo\'qoladi. Faqat eng muhimini ayting.', ask: 'Nega uzun pitch qisqasidan ko\'ra ko\'proq odamni yo\'qotadi?' },
      { ic: '🎁', h: 'Foydani soting', body: 'Odam texnik tafsilotni emas, mahsulot unga qanday foyda berishini bilishni xohlaydi. Shuning uchun foydani old planga chiqaring.', ask: 'Bir mahsulot haqida sizni nima ko\'proq qiziqtiradi — qanday qilingani yoki qanday foyda berishi?' },
    ],
  },
  13: {
    title: 'Vaqt taqsimoti',
    cards: [
      { ic: '⏳', h: '2 daqiqa qanday bo\'linadi', body: 'Vaqtning katta qismi — muammo va yechimga. Tinglovchi «nega kerak va qanday yordam beradi»ni tushunishi shart.', vis: <RcFlow items={['Diqqat', 'muammo + yechim', 'demo']} />, ask: 'Agar 2 daqiqadan atigi 20 soniya qolsa, uni nimaga sarflaysiz?' },
      { ic: '🚫', h: 'Texnik tafsilot vaqtni yeydi', body: 'Qaysi tilda qilingani yoki uzun salomlashuv vaqtni behuda ketkazadi. Ular tinglovchiga qiziq emas.', ask: 'Nega «qaysi dasturda qilingani» pitchda ko\'p vaqt olmasligi kerak?' },
      { ic: '🎯', h: 'Muammo → yechim — markazda', body: 'Kuchli pitchning yuragi shu: tanish muammo va aniq yechim. Qolgan qismlar shu ikkisining atrofida turadi.', ask: 'Pitchning eng ko\'p vaqt oladigan qismi qaysi bo\'lishi kerak?' },
    ],
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
  // «To'g'ri» sanog'ini ustunlar bilan BIR XIL mantiqdan olamiz (picked === correctIdx) —
  // server `correct` ustuni eskirgan bo'lsa ham sanoq va ustunlar hech qachon farq qilmaydi.
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
                ? "Hozir to'g'ri javobni bilib olasiz."
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

const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div data-tour="mentor" className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
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

// global savol — har ekran shu bilan ochiladi
const Q = ({ children, max = 760 }) => <h2 className="title h-title fade-up" style={{ maxWidth: max }}>{children}</h2>;
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

// ===== PM-3 PITCH — mahsulotni 2 daqiqada tushuntirish (treyler kabi) =====
const p3sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const p3 = {
  hook: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><path d="M4 9v6h4l6 4V5L8 9z" /><path d="M17 8.5a4 4 0 0 1 0 7" /></svg>),
  demo: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5z" /></svg>),
  film: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 15h18M8 4v16M16 4v16" /></svg>),
  mic: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p3sv}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><path d="M12 17v4M9 21h6" /></svg>)
};
const PARTS = [
  { key: 'ilgak', label: 'Diqqat tortish', ic: p3.hook(18), color: '#E0892B', job: 'Birinchi gap — diqqatni tortadi, tinglovchini ushlaydi.', ex: 'Uyingizda ishlatilmay yotgan narsalar bormi?' },
  { key: 'muammo', label: 'Muammo', ic: Ico.problem(18), color: T.accent, job: 'Tinglovchi his qiladigan tanish qiyinchilik.', ex: 'Ularni sotish qiyin — e\'lon joylash, xaridor topish ko\'p vaqt oladi.' },
  { key: 'yechim', label: 'Yechim', ic: Ico.solution(18), color: T.blue, job: 'Mahsulotingiz — bir aniq jumlada.', ex: 'Bozor — 3 daqiqada e\'lon bering, minglab xaridor ko\'radi.' },
  { key: 'demo', label: 'Demo + harakat', ic: p3.demo(18), color: '#7B3FE4', job: 'Ko\'rsating va aniq chaqiring: nima qilsin.', ex: 'Mana, velosipedni 2 daqiqada sotuvga qo\'ydim. Siz ham hoziroq sinab ko\'ring!' }
];
const PMETA = {}; PARTS.forEach(p => { PMETA[p.key] = p; });

// Mobil: Mentor yopilganda ish maydonini ko'rsatadi (avtoskroll)
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

// Teleprompter — pitch-kartasi (script)
const PitchCard = ({ items, minH = 200 }) => (
  <div style={{ background: CODE.bg, borderRadius: 14, padding: '16px 17px', minHeight: minH, boxShadow: `0 12px 30px -10px rgba(${T.shadowBase},0.3)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 9, borderBottom: `1px solid #ffffff18` }}>
      <span style={{ color: '#9FB4D8', display: 'inline-flex' }}>{p3.mic(15)}</span>
      <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: '#9FB4D8', textTransform: 'uppercase' }}>2 daqiqalik pitch</span>
    </div>
    {items.map((it, i) => (
      <div key={i} className={`pc-row ${it.text ? 'lit' : ''}`}>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: it.color, textTransform: 'uppercase' }}>{it.label}</span>
        <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,15px)', lineHeight: 1.5, color: it.text ? '#E8E5DD' : '#6B7585', margin: '3px 0 0', fontStyle: it.text ? 'normal' : 'italic' }}>{it.text || it.ph}</p>
      </div>
    ))}
  </div>
);

// 2 daqiqa mashq taymeri
const RehearseTimer = () => {
  const [sec, setSec] = useState(120);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => () => clearInterval(ref.current), []);
  const start = () => { if (running) return; setRunning(true); clearInterval(ref.current); ref.current = setInterval(() => setSec(s => { if (s <= 1) { clearInterval(ref.current); setRunning(false); return 0; } return s - 1; }), 1000); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setSec(120); };
  const mm = Math.floor(sec / 60); const ss = String(sec % 60).padStart(2, '0');
  const over = sec === 0;
  return (
    <div className="frame fade-step" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 30, lineHeight: 1, color: over ? T.accent : (running ? T.success : T.ink), minWidth: 64 }}>{mm}:{ss}</span>
      <div style={{ flex: 1, minWidth: 150 }}>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink, margin: 0 }}>{over ? 'Vaqt tugadi — qanday chiqdi?' : (running ? 'Ovoz chiqarib o\'qing — oyna oldida!' : 'Pitchingizni 2 daqiqada o\'qib mashq qiling')}</p>
      </div>
      {!running && !over && <button className="btn" onClick={start}>▶ Mashq qilish</button>}
      {(running || over) && <button className="btn-soft" onClick={reset}>↺ Qaytadan</button>}
    </div>
  );
};

// 💼 INVESTOR HOLAT-MASHINASI — 5 kayfiyat, progressiv (jazolamas).
// Yorliq = investorning fikr-pufagi: pitch kuchaygan sari qiziqadi (zerikdi → kelishuv).
// Tanqid GAPGA qaratilgan ("texnik tafsilot"), bolaga emas. emoji + matn — accessibility uchun.
const INVESTOR_MOODS = [
  { emoji: '😐', label: 'Yana texnik tafsilot…' },  // 0 qism — zerikdi
  { emoji: '🙂', label: 'Xo\'sh, ko\'ramiz…' },       // 1 qism — neytral, kutmoqda
  { emoji: '😀', label: 'Hmm, qani davomi?' },       // 2 qism — qiziqmoqda
  { emoji: '😃', label: 'Mana, qizidim!' },          // 3 qism — hayajonda
  { emoji: '🤩', label: 'Ajoyib — deyarli ishondim!' }, // 4 qism — hayratda
];
function InvestorAvatar({ level = 0, deal = false, compact = false }) {
  const lv = Math.min(Math.max(level, 0), 4);
  const m = deal ? { emoji: '🤝', label: 'Kelishdik! 💰' } : INVESTOR_MOODS[lv];
  // Demo Day investor kayfiyati rangda: zerikkan → kulrang, qiziqqan → ko'k, hayratda/kelishuv → yashil
  const moodColor = deal || lv >= 3 ? T.success : lv === 2 ? T.blue : T.ink3;
  return (
    <div className={`inv-avatar ${deal ? 'deal' : ''} ${compact ? 'compact' : ''}`} style={{ '--inv-mood': moodColor }}>
      <div className={`inv-face ${deal ? 'dealface' : lv <= 1 ? 'idle-bored' : lv >= 3 ? 'idle-keen' : ''}`} key={m.emoji} aria-hidden="true">{m.emoji}</div>
      {!compact && <div className="inv-meter" aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} className={`inv-pip ${i < level ? 'on' : ''}`} />)}</div>}
      <p className="inv-label" role="status" style={{ color: moodColor }}>{deal ? 'Kelishdik! 💰' : m.label}</p>
    </div>
  );
}

// 🎬 TREYLER-MONTAJ — pitch qismlarini to'g'ri tartibga sudrab «treyler» yig'iladi.
// L1 DragDropOrder mexanikasi (atomik {pool,slots}, sudrash + tap-fallback, StrictMode-safe)
// + jazolamas mantiq: qism FAQAT to'g'ri slotga tushsa qulflanadi, aks holda joyiga qaytadi.
// onLevel(filled) — investor pog'onasi; onSolved — to'liq g'alaba.
function TrailerMontage({ parts, onLevel, onSolved }) {
  const order = parts.map(p => p.key);
  const byKey = useMemo(() => Object.fromEntries(parts.map(p => [p.key, p])), [parts]);
  const [st, setSt] = useState(() => {
    const a = order.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return { pool: a, slots: order.map(() => null) };
  });
  const { pool, slots } = st;
  const [wrongN, setWrongN] = useState(0);
  const [bounce, setBounce] = useState(-1);
  const slotRefs = useRef([]);
  const filled = slots.filter(Boolean).length;
  const solved = slots.every((s, i) => s === order[i]);
  // ≥3 xato urinishda birinchi bo'sh (to'g'ri) slot yoritiladi
  const hintSlot = wrongN >= 3 && !solved ? slots.findIndex((s, i) => s !== order[i]) : -1;
  useEffect(() => { if (onLevel) onLevel(filled); }, [filled]); // eslint-disable-line
  useEffect(() => { if (solved) onSolved && onSolved(); }, [solved]); // eslint-disable-line
  const tryPlace = (key, slotIdx) => {
    const correctIdx = order.indexOf(key);
    if (slotIdx === correctIdx && !slots[slotIdx]) {
      setSt(({ pool, slots }) => { const ns = slots.slice(); ns[slotIdx] = key; return { pool: pool.filter(x => x !== key), slots: ns }; });
      return true;
    }
    setWrongN(n => n + 1); setBounce(slotIdx); setTimeout(() => setBounce(b => (b === slotIdx ? -1 : b)), 420);
    return false;
  };
  const tap = (key) => { const correctIdx = order.indexOf(key); if (!slots[correctIdx]) tryPlace(key, correctIdx); else setWrongN(n => n + 1); };
  const down = (ev, key) => {
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    const el = ev.currentTarget; const sx = ev.clientX, sy = ev.clientY; let moved = false;
    el.style.transition = 'none'; el.style.zIndex = '9999'; el.style.willChange = 'transform';
    const mv = (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (!moved && Math.abs(dx) + Math.abs(dy) > 5) moved = true; if (moved) el.style.transform = `translate(${dx}px,${dy}px) scale(1.06) rotate(-2deg)`; };
    const finish = () => { el.style.zIndex = ''; el.style.willChange = ''; el.style.transform = ''; el.style.transition = ''; };
    const up = (e) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (!moved) { finish(); tap(key); return; }
      let t = -1;
      slotRefs.current.forEach((elm, i) => { if (!elm) return; const r = elm.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) t = i; });
      if (t >= 0 && tryPlace(key, t)) { finish(); }
      else { el.style.transition = 'transform .2s cubic-bezier(.34,1.3,.4,1)'; el.style.transform = ''; setTimeout(finish, 210); }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  return (
    <div className="dd fade-up">
      <div className="dd-slots">
        {slots.map((key, i) => { const p = byKey[order[i]]; return (
          <div key={i} ref={el => (slotRefs.current[i] = el)} className={`dd-slot ${key ? 'filled ok' : ''} ${bounce === i ? 'bad' : ''} ${hintSlot === i ? 'hint' : ''}`}>
            <span className="dd-slotn">{i + 1}</span>
            {key
              ? <span className="dd-chip in" style={{ boxShadow: `inset 0 0 0 1.5px ${p.color}` }}><span style={{ color: p.color, display: 'inline-flex' }}>{p.ic}</span> {p.label}</span>
              : <span className="dd-hint">{hintSlot === i ? `${p.label}?` : 'bu yerga…'}</span>}
          </div>
        ); })}
      </div>
      <div className="dd-pool">
        {pool.length === 0 && !solved && <span className="dd-pool-empty">Qismlarni to'g'ri tartibda joylang</span>}
        {pool.map(key => { const p = byKey[key]; return <button key={key} className={`dd-chip ${filled === 0 ? 'nudge' : ''}`} style={{ boxShadow: `inset 0 0 0 1.5px ${p.color}66` }} onPointerDown={(e) => down(e, key)}><span style={{ color: p.color, display: 'inline-flex' }}>{p.ic}</span> {p.label}</button>; })}
      </div>
    </div>
  );
}

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
  const audio = useAudio([{ id: 's0', text: `Bitta mahsulot — ikki xil aytilgan. Birini eshitib zerikasiz, birini eshitib qiziqasiz. Ikkala variantni bosib o'qing, keyin sababini tanlang.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [v, setV] = useState('boring');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const TEXT = { boring: 'Men bir sayt qildim. Unda odamlar narsa qo\'yadi. HTML va CSS ishlatdim. Bor, ko\'ring.', great: 'Uyingizda ortiqcha narsa bormi? Sotish qiyin-a. Bozor — 3 daqiqada e\'lon bering, minglab xaridor topadi. Hoziroq sinab ko\'ring!' };
  const OPTS = [
    { id: 'a', label: 'Ikkinchisi chiroyliroq yozilgani uchun' },
    { id: 'b', label: 'Muammoni his qildirib, hikoya qilib gapirgani uchun' },
    { id: 'c', label: 'Farqi yo\'q, ikkalasi bir xil' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext optionalLive disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Bir mahsulot — nega biri <span className="italic" style={{ color: T.accent }}>qiziqarli</span>, biri zerikarli?</h1>
        <Mentor>Bitta mahsulot, ikki xil aytilgan. Birini eshitib <b style={{ color: T.ink }}>zerikasiz</b>, birini eshitib <b style={{ color: T.ink }}>qiziqasiz</b>. Ikkalasini bosib o'qing.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'boring' ? 'chip-on' : ''}`} onClick={() => setV('boring')}>Zerikarli</button>
              <button className={`chip ${v === 'great' ? 'chip-on' : ''}`} onClick={() => setV('great')}>Qiziqarli</button>
            </div>
            <div key={v} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '18px 17px', boxShadow: `0 8px 20px -7px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${v === 'great' ? T.success : T.ink3}` }}>
              <span style={{ color: v === 'great' ? T.success : T.ink3, display: 'inline-flex' }}>{p3.mic(18)}</span>
              <p style={{ fontFamily: G, fontSize: 'clamp(15px,2vw,17px)', lineHeight: 1.55, color: T.ink, margin: '9px 0 0' }}>{TEXT[v]}</p>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nega biri qiziqarli?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Mahsulotning o'zi bir xil — lekin <b>qanday aytish</b> hammasini hal qiladi. Buni <b>pitch</b> deyiladi. Bugun 2 daqiqada qiziqtirishni o'rganamiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `G'oyani topdik, sahifani tuzdik. Endi eng muhimi — buni odamlarga qanday qilib 2 daqiqada tushuntirish. Buni pitch deyiladi va u kino treyleri kabi ishlaydi. Bugun shuni to'rtta qism bilan o'rganamiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Birinchi gap — diqqatni tortadi', tag: '' },
    { text: 'Muammo va yechimni hikoya qiling', tag: '' },
    { text: 'Demo bilan ishontiring va chaqiring', tag: '' },
    { text: 'Cho\'zib yubormang — 2 daqiqa', tag: 'vaqt' },
    { text: 'O\'z pitchingizni yozib, mashq qilasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Idea = ({ ic, h, t, c }) => (<div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}><IcoChip color={c} soft={c + '1c'}>{ic}</IcoChip><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>{h}</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>{t}</p></div></div>);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Idea ic={p3.film(22)} c="#E0892B" h="PITCH = TREYLER" t="Hammasini aytmaydi — qiziqtiradi" />
        <Idea ic={p3.mic(22)} c={T.blue} h="4 QISM" t="Diqqat tortish · Muammo · Yechim · Demo+harakat" />
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Demo Day'da shu pitch bilan saytingizni taqdim qilasiz</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Mahsulotingizni 2 daqiqada qanday qiziqtirasiz?</span></h2></div>
        <Mentor>G'oyani topdik, sahifani tuzdik. Endi eng muhimi — buni <b style={{ color: T.ink }}>2 daqiqada</b> tushuntirish. Bu — <b style={{ color: T.ink }}>pitch</b>, va u kino <b style={{ color: T.ink }}>treyleri</b> kabi ishlaydi.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — DIQQAT TORTISH (birinchi gap) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Kino treyleri birinchi soniyada ushlaydi. Pitch ham shunday — birinchi gap qiziqtirmasa, qolganini hech kim eshitmaydi. Quyidagi uchta boshlamadan qaysi biri eng kuchli — bir bosib sinab ko'ring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const OPTS = [
    { id: 0, label: 'Salom, men bir sayt qildim.', why: 'Bu hech kimni qiziqtirmaydi — na muammo, na qiziqish bor. Zaif boshlama.' },
    { id: 1, label: 'Uyingizda ishlatilmay yotgan narsalar bormi?', why: 'Mana bu — kuchli! Savol bilan boshlaydi, tinglovchini o\'ylantiradi va muammoga olib keladi.' },
    { id: 2, label: 'Bu sayt HTML va CSS da qilingan.', why: 'Bu — texnik tafsilot, tinglovchiga qiziq emas. Birinchi gap odamning muammosiga tegishi kerak.' }
  ];
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const solved = picked === 1;
  const pick = (id) => { if (solved) return; setPicked(id); if (id === 1 && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: id }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Diqqat tortish" screen={screen} narrow audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!solved} label={solved ? 'Davom etish' : 'Eng kuchlisini toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>✍️ Sinab ko'ring</p>
          <h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi <span className="italic" style={{ color: T.accent }}>birinchi gap</span> tinglovchini ushlaydi?</h2>
        </div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {OPTS.map(o => { let cls = 'option'; if (solved) { if (o.id === 1) cls += ' option-correct'; else cls += ' option-wrong'; } else if (o.id === picked) cls += ' option-picked-wrong'; return (<button key={o.id} className={cls} disabled={solved} onClick={() => pick(o.id)} style={{ padding: 'clamp(13px,1.9vw,16px) clamp(15px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', textAlign: 'left' }}>{o.label}</button>); })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? 'To\'g\'ri' : 'Qaytadan'}</p>
          <p className="body" style={{ margin: 0 }}>{picked !== null ? OPTS[picked].why : ''}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — REAL MAHSULOTLAR BIR JUMLALI PITCH =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Eng zo'r mahsulotlar o'zini bitta jumlada tushuntira oladi. Har bir mahsulotni bosib, uning bir jumlali pitchini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const SITES = {
    youtube: { ic: Ico.youtube(24), name: 'YouTube', line: 'Sevimli videolaringizni xohlagan vaqtda, bepul ko\'ring — darslar ham, ko\'ngilochar ham bir joyda.' },
    market: { ic: Ico.market(24), name: 'Bozor', line: 'Uydan chiqmasdan, bir necha daqiqada e\'lon bering — yoki kerakli narsani arzonga toping.' },
    taxi: { ic: Ico.taxi(24), name: 'Taksi', line: 'Ko\'chada kutmasdan bir bosishda mashina chaqiring — narxini oldindan bilib turasiz.' },
    telegram: { ic: Ico.telegram(24), name: 'Telegram', line: 'Uzoqda bo\'lsangiz ham, do\'st va oilangiz bilan bepul va bir zumda yozishing.' }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bir jumlali pitch" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashhur mahsulotlar o'zini <span className="italic" style={{ color: T.accent }}>bir jumlada</span> qanday aytadi?</h2></div>
        <Mentor>Eng zo'r mahsulotlar o'zini <b style={{ color: T.ink }}>bitta jumlada</b> tushuntira oladi. Har birini bosib, pitchini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.keys(SITES).map(k => (<button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', border: 'none', borderRadius: 13, padding: '13px 12px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ display: 'inline-flex' }}>{SITES[k].ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: T.ink }}>{SITES[k].name}</span>{seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ display: 'inline-flex' }}>{SITES[active].ic}</span><span className="sk-wordbadge">{SITES[active].name}</span></span><p style={{ fontFamily: G, fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.5, color: T.ink, margin: '13px 0 0', fontStyle: 'italic' }}>"{SITES[active].line}"</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir mahsulotni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi — bironta ham "men sayt qildim" demaydi. Hammasi <b>foydani</b> bir jumlada aytadi.</p></div>}
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
    audioText="Yaxshi pitch nimadan boshlanadi?"
    questionText="Yaxshi pitch nimadan boshlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Yaxshi pitch <span className="italic" style={{ color: T.accent }}>nimadan</span> boshlanadi?</h2></>}
    options={['Texnik tafsilotlardan (qaysi tilda qilingani)', 'Diqqatni tortadigan birinchi gapdan', 'Salomlashuv va o\'zini tanishtirishdan', 'Mahsulot narxini aytishdan']} correctIdx={1}
    explainCorrect="To'g'ri! Treyler kabi — birinchi gap tinglovchini ushlaydi. Aks holda qolganini eshitmaydi."
    explainWrong={{ 0: 'Texnik tafsilot tinglovchiga qiziq emas. Avval qiziqtiruvchi birinchi gap kerak.', 2: 'Uzoq salomlashuv zeriktiradi. Darhol qiziqtiruvchi birinchi gap bilan boshlang.', 3: 'Narx — keyin. Avval qiziqtirish, muammoni his qildirish kerak.', default: 'Pitch diqqatni tortadigan birinchi gapdan boshlanadi.' }} />
);

// ===== SCREEN 5 — 4 QISM (tap → vazifa) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Yaxshi pitch to'rtta qismdan iborat: diqqat tortish, muammo, yechim va demo bilan harakat. Har birini bosib, vazifasini va "Bozor" misolini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Pitch tuzilishi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 qismni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitch qaysi <span className="italic" style={{ color: T.accent }}>4 qism</span>dan iborat?</h2></div>
        <Mentor>Yaxshi pitch 4 qismdan iborat: <b style={{ color: T.ink }}>diqqat tortish, muammo, yechim, demo+harakat</b>. Har birini bosib, vazifasini va "Bozor" misolini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map(s => (<button key={s.key} onClick={() => tap(s.key)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === s.key ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{s.label}</span>{seen.has(s.key) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: PMETA[active].color, display: 'inline-flex' }}>{PMETA[active].ic}</span><span className="sk-wordbadge" style={{ color: PMETA[active].color, background: PMETA[active].color + '1c' }}>{PMETA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{PMETA[active].job}</p><p style={{ fontFamily: G, fontStyle: 'italic', color: T.ink2, margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.5 }}>"{PMETA[active].ex}"</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qismni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rt qism birga — tayyor pitch. Endi ularni <b>tartib bilan</b> bog'laymiz.</p></div>}
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
    audioText="Demo va harakat qismi pitchda nima vazifani bajaradi?"
    questionText="Demo + harakat qismi pitchda nima vazifani bajaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"Demo + harakat" qismi <span className="italic" style={{ color: T.accent }}>nima uchun</span> kerak?</h2></>}
    options={['Ishontiradi va keyingi qadamni beradi', 'Pitchni uzaytirib to\'ldirish uchun', 'Texnik tafsilotlarni sanash uchun', 'Tinglovchi bilan salomlashish uchun']} correctIdx={0}
    explainCorrect="To'g'ri! Demo — ishlayotganini ko'rsatadi, harakat esa aniq aytadi: 'hoziroq sinab ko'ring'. Pitchni kuchli yakunlaydi."
    explainWrong={{ 1: 'Maqsad uzaytirish emas. Demo ishontiradi, harakat keyingi qadamni beradi.', 2: 'Texnik tafsilot kerak emas. Demo — natijani ko\'rsatadi.', 3: 'Salomlashuv emas — bu pitchning kuchli yakuni: ko\'rsat va chaqir.', default: 'Demo ishontiradi, harakat aniq chaqiradi.' }} />
);

// ===== SCREEN 6 — TREYLER STEPPER =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Endi pitchni treyler kabi yig'amiz: diqqatni tortamiz, muammoni eslatamiz, yechimni aytamiz va demo bilan chaqiramiz. Tugmani bosib, pitchning qurilishini kuzating.`, trigger: 'on_mount', waits_for: { type: 'flow_done' } }]);
  const [step, setStep] = useState(storedAnswer ? PARTS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const isMobile = useIsMobile();
  const done = step >= PARTS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < PARTS.length) timer.current = setTimeout(() => tick(i + 1), 780); else { setRunning(false); audio.triggerEvent('flow_done'); } }; timer.current = setTimeout(() => tick(1), 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Treyler" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,13px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitch treyler kabi <span className="italic" style={{ color: T.accent }}>qurilsa</span> — qanday bo'ladi?</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>diqqatni tortamiz</b>, muammoni eslatamiz, yechimni aytamiz va demo bilan <b style={{ color: T.ink }}>chaqiramiz</b>. Tugmani bosing.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PARTS.map((s, i) => { const on = step > i; return (<React.Fragment key={s.key}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '8px 13px', opacity: on ? 1 : 0.4, boxShadow: on ? `0 7px 18px -10px rgba(${T.shadowBase},0.18)` : 'none', transition: 'all 0.4s' }}><IcoChip color={on ? s.color : T.ink3} soft={on ? s.color + '1c' : '#ECEAE5'} size={31}>{s.ic}</IcoChip><div style={{ minWidth: 0, flex: 1 }}><p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13, color: on ? s.color : T.ink3, margin: 0 }}>{s.label}</p>{on && <p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 12.5, color: T.ink2, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>"{s.ex}"</p>}</div>{on && <span style={{ color: T.success }}>{Ico.check(15)}</span>}</div>{i < PARTS.length - 1 && <div style={{ display: 'flex', justifyContent: 'center', color: step > i + 1 ? T.success : T.ink3, transform: 'rotate(90deg)', lineHeight: 1, transition: 'color 0.3s' }}>{Ico.arrow(12)}</div>}</React.Fragment>); })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Qurilmoqda…' : (done ? '↻ Yana ko\'rish' : 'Pitchni qurish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq pitch: <b>diqqat tortish → muammo → yechim → demo+harakat</b>. Treyler kabi qiziqtiradi.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — KUCHLI vs ZAIF PITCH (toggle) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Bir mahsulot — ikki pitch. Biri to'rtta qismni bajaradi, biri shunchaki gapiradi. Ikkalasini bosib solishtiring.`, trigger: 'on_mount', waits_for: null }]);
  const [v, setV] = useState('strong');
  const [seen, setSeen] = useState(new Set(['strong']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  const STRONG = PARTS.map(p => ({ label: p.label, color: p.color, text: p.ex }));
  const WEAK = [{ label: 'Ochilish', color: T.ink3, text: 'Salom. Men bir loyiha qildim.' }, { label: 'Tafsilot', color: T.ink3, text: 'U HTML, CSS va biroz JavaScriptda yozilgan.' }, { label: 'Yana', color: T.ink3, text: 'Unda turli sahifalar bor, rangi ko\'k.' }, { label: 'Tugadi', color: T.ink3, text: 'Mana, xolos.' }];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Kuchli vs zaif" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi pitch sizni <span className="italic" style={{ color: T.accent }}>ishontiradi</span>?</h2></div>
        <Mentor>Bir mahsulot — ikki pitch. Biri 4 qismni bajaradi, biri shunchaki gapiradi. Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'strong' ? 'chip-on' : ''}`} onClick={() => set('strong')}>Kuchli pitch</button>
              <button className={`chip ${v === 'weak' ? 'chip-on' : ''}`} onClick={() => set('weak')}>Zaif pitch</button>
            </div>
            <div key={v}><PitchCard items={v === 'strong' ? STRONG : WEAK} minH={210} /></div>
          </Col>
          <Col>
            {v === 'strong'
              ? <div className="frame-success fade-step" key="s"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ishontiradi</p><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi gap ushlaydi, muammo tanish, yechim aniq, demo chaqiradi. Tinglovchi sinab ko'rgisi keladi.</p></div>
              : <div className="frame-warn fade-step" key="w"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zerikarli</p><p className="body" style={{ margin: 0, color: T.ink }}>Faqat texnik faktlar — na qiziqarli boshlama, na muammo, na chaqiriq. Tinglovchi befarq qoladi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mahsulot bir xil — <b>pitch</b> hammasini hal qiladi. Fakt emas, hikoya soting.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MOSLASH: qism ↔ vazifa =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `To'rtta qism va ularning to'rtta vazifasi. Har bir qismni vazifasi bilan ulang: avval qismni, keyin vazifani bosing.`, trigger: 'on_mount', waits_for: null }]);
  const KEYS = ['ilgak', 'muammo', 'yechim', 'demo'];
  const NEEDS = [
    { id: 'yechim', text: 'Mahsulotni bir aniq jumlada aytadi' },
    { id: 'ilgak', text: 'Birinchi gap bilan diqqatni tortadi' },
    { id: 'demo', text: 'Ko\'rsatadi va keyingi qadamga chaqiradi' },
    { id: 'muammo', text: 'Tanish qiyinchilikni his qildiradi' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= 4;
  const pickP = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickN = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(13px,1.5vw,14.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Amaliyot" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/4 moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir qismni <span className="italic" style={{ color: T.accent }}>vazifasi</span> bilan ulang</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>qismni</b>, keyin uning <b style={{ color: T.ink }}>vazifasini</b> bosing. To'rttasini to'g'ri ulang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Pitch qismlari</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {KEYS.map(id => { const s = PMETA[id]; const m = matched[id]; const on = sel === id; return (<button key={id} onClick={() => pickP(id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : s.color, display: 'inline-flex' }}>{m ? Ico.check(18) : s.ic}</span><span style={{ flex: 1, fontWeight: 600 }}>{s.label}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Vazifalar</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {NEEDS.map(n => { const m = matched[n.id]; const isWrong = wrong === n.id; return (<button key={n.id} onClick={() => pickN(n.id)} disabled={m || !sel} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ flex: 1 }}>{n.text}</span>{m && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(16)}</span>}</button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa qismning vazifasi. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Har bir qism pitchda nima uchun turishini bildingiz.</p></div>}
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
    audioText="Pitch haqida eng to'g'ri fikr qaysi?"
    questionText="Pitch haqida eng to'g'ri fikr qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Pitch haqida eng <span className="italic" style={{ color: T.accent }}>to'g'ri</span> fikr qaysi?</h2></>}
    options={['Mahsulot haqida hamma narsani aytish kerak', 'Qancha uzun bo\'lsa, shuncha yaxshi', 'Treyler kabi — qiziqtirib, foydani aytish', 'Texnik tafsilotlar eng muhim qism']} correctIdx={2}
    explainCorrect="To'g'ri! Pitch — treyler: hammasini aytmaydi, qisqa va qiziqarli qilib foydani ko'rsatadi."
    explainWrong={{ 0: 'Hammasini aytsa, tinglovchi charchaydi. Faqat eng muhimini — qiziqtirib ayting.', 1: 'Uzunlik yomon. 2 daqiqada, qisqa va aniq bo\'lishi kerak.', 3: 'Texnik tafsilot tinglovchiga qiziq emas. Foydani ayting.', default: 'Pitch — treyler kabi: qisqa, qiziqarli, foydani ko\'rsatadi.' }} />
);

// ===== SCREEN 10 — ZAIF QISMNI TUZATISH (debugging) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Bir pitch yozilgan, lekin ochilishi zaif — texnik tafsilotdan boshlangan, hech kimni qiziqtirmaydi. Qaysi qator zaif ekanini toping va o'sha qatorni bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const WEAK_ILGAK = 'Bu sayt HTML va CSS da qilingan.';
  const lines = [
    { key: 'ilgak', label: 'Diqqat tortish', color: '#E0892B', bad: WEAK_ILGAK, good: PMETA.ilgak.ex },
    { key: 'muammo', label: 'Muammo', color: T.accent, bad: PMETA.muammo.ex, good: PMETA.muammo.ex },
    { key: 'yechim', label: 'Yechim', color: T.blue, bad: PMETA.yechim.ex, good: PMETA.yechim.ex },
    { key: 'demo', label: 'Demo + harakat', color: '#7B3FE4', bad: PMETA.demo.ex, good: PMETA.demo.ex }
  ];
  const clickLine = (k) => { if (found) return; if (k === 'ilgak') { setFound(true); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Birinchi gap texnik tafsilotdan boshlangan — bu qiziqtirmaydi. Kuchli gap bilan almashtiramiz.`); }, 300); } };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Endi pitch savol bilan, qiziqtirib boshlanadi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tuzatish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Zaif qatorni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu pitchda qaysi qator <span className="italic" style={{ color: T.accent }}>zaif</span>?</h2></div>
        <Mentor>Pitch yozilgan, lekin <b style={{ color: T.ink }}>ochilishi zaif</b> — texnik tafsilotdan boshlangan. Qaysi qator qiziqtirmaydi? O'sha qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">PITCH</span><span className="ai-bubble">Tekshirib ko'ring:</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map(l => { const bad = found && !fixed && l.key === 'ilgak'; const txt = (l.key === 'ilgak' && !fixed) ? l.bad : l.good; return (<div key={l.key} onClick={() => { if (!found && !fixed) clickLine(l.key); }} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', gap: 2, background: bad ? T.accentSoft : (fixed && l.key === 'ilgak' ? T.successSoft : T.bg), borderRadius: 10, padding: '9px 12px', boxShadow: bad ? `inset 0 0 0 1.5px ${T.accent}` : 'none', transition: 'all 0.18s' }}><span className="mono" style={{ fontSize: 9.5, fontWeight: 700, color: l.color, textTransform: 'uppercase' }}>{l.label}</span><span style={{ fontFamily: G, fontSize: 13, color: T.ink, fontStyle: (l.key === 'ilgak' && !fixed) ? 'normal' : 'normal' }}>"{txt}"</span></div>); })}
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Kuchli birinchi gap bilan almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>Tuzatildi — endi qiziqtiradi.</p>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: birinchi gap <b>qiziqtirishi</b> kerak. Qaysi qator texnik fakt bo'lib, befarq qoldiradi?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Birinchi gap "HTML va CSS da qilingan" deb boshlanyapti — bu hech kimni qiziqtirmaydi. Chap tugmani bosib, kuchli gapga almashtiring.</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ color: '#E0892B', display: 'inline-flex' }}>{p3.hook(34)}</div><p className="ta-h">Zaif boshlama — butun pitchni yo'qotadi</p><p className="ta-sub">Birinchi gap muammoga teginsin, faktga emas</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — ENG KUCHLI GAPNI TANLASH (build) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi pitchni o'zingiz yig'ing. Har bir qism uchun ikkita variant bor — kuchliroq, qiziqarliroq gapni tanlang. O'ngda pitch-kartangiz to'ladi.`, trigger: 'on_mount', waits_for: null }]);
  const POOL = {
    ilgak: { color: '#E0892B', a: 'Salom, men bir sayt qildim.', b: 'Uyingizda ishlatilmay yotgan narsalar bormi?' },
    muammo: { color: T.accent, a: 'Sayt ko\'k rangda.', b: 'Sotish qiyin — xaridor topish ko\'p vaqt oladi.' },
    yechim: { color: T.blue, a: 'Unda tugmalar bor.', b: 'Bozor — 3 daqiqada e\'lon, minglab xaridor.' },
    demo: { color: '#7B3FE4', a: 'Mana, xolos.', b: 'Velosipedni 2 daqiqada sotdim — siz ham sinab ko\'ring!' }
  };
  const KEYS = ['ilgak', 'muammo', 'yechim', 'demo'];
  const [pick, setPick] = useState({});
  const allGood = KEYS.every(k => pick[k] === 'b');
  const allPicked = KEYS.every(k => pick[k]);
  const workRef = useRef(null);
  const set = (k, v) => { if (allGood) return; setPick(prev => ({ ...prev, [k]: v })); };
  useEffect(() => {
    if (!allGood) return;
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
    if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  const items = KEYS.map(k => ({ label: PMETA[k].label, color: POOL[k].color, text: pick[k] ? POOL[k][pick[k]] : '', ph: 'tanlanmagan…' }));
  const strongN = KEYS.filter(k => pick[k] === 'b').length; // investor mikro-reaksiya: faqat kuchli gap qiziqtiradi
  return (
    <Stage eyebrow="Pitch yig'ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!allGood} label={allGood ? 'Davom etish' : (allPicked ? 'Eng kuchli gaplarni tanlang' : 'Har qismdan tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har qism uchun <span className="italic" style={{ color: T.accent }}>kuchliroq</span> gapni tanlang</h2></div>
        <Mentor>Har bir qism uchun ikkita variant — <b style={{ color: T.ink }}>qiziqarliroq</b> gapni tanlang. O'ngda pitch-kartangiz to'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {KEYS.map(k => (<div key={k}><p className="flow-label" style={{ margin: '0 0 6px', color: POOL[k].color }}>{PMETA[k].label}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['a', 'b'].map(v => { const on = pick[k] === v; return (<button key={v} onClick={() => set(k, v)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 13px', fontFamily: G, fontSize: 13, color: on ? '#fff' : T.ink, background: on ? POOL[k].color : T.paper, boxShadow: on ? `0 6px 14px -6px ${POOL[k].color}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}>"{POOL[k][v]}"</button>); })}</div></div>))}
          </Col>
          <Col>
            <p className="flow-label">Pitch-kartangiz · investor</p>
            <InvestorAvatar level={strongN} deal={allGood} compact />
            <PitchCard items={items} minH={200} />
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — kuchli pitch! Har qism qiziqtiradi va harakatga undaydi.</p></div>}
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
    audioText="2 daqiqalik pitchda vaqtni qanday taqsimlash to'g'ri?"
    questionText="2 daqiqalik pitchda eng ko'p vaqtni nimaga ajratasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>2 daqiqada eng ko'p e'tibor <span className="italic" style={{ color: T.accent }}>nimaga</span>?</h2></>}
    options={['Texnik tafsilotlarni sanashga', 'Uzoq salomlashuv va tanishuvga', 'Qaysi dasturlarda qilganini aytishga', 'Muammo va yechimni aniq ko\'rsatishga']} correctIdx={3}
    explainCorrect="To'g'ri! Vaqtning katta qismi — muammo va yechimga. Tinglovchi 'nega kerak va qanday yordam beradi'ni tushunishi shart."
    explainWrong={{ 0: 'Texnik tafsilot vaqtni behuda yeydi. Muammo va yechimga e\'tibor bering.', 1: 'Salomlashuv qisqa bo\'lsin. Asosiysi — muammo va yechim.', 2: 'Qaysi dasturda qilingani tinglovchiga qiziq emas. Foydani ko\'rsating.', default: 'Eng ko\'p e\'tibor — muammo va yechimga.' }} />
);

// ===== SCREEN 13 — NAMUNA (to'liq Bozor pitchi) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Mana to'liq "Bozor" pitchi — kartada yozilgan. Avval har bir qatorni bosib, nega aynan shunday yozilganini ko'ring. Keyin qismlarni to'g'ri tartibga sudrab, treylerni o'zingiz yig'asiz — investor har to'g'ri qismda qizishadi.`, trigger: 'on_mount', waits_for: null }]);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const [invLevel, setInvLevel] = useState(storedAnswer ? 4 : 0);
  const [solved, setSolved] = useState(!!storedAnswer);
  const explored = seen.size >= PARTS.length || solved; // revisitda (solved) to'g'ridan montaj holati
  const [playStep, setPlayStep] = useState(storedAnswer ? PARTS.length : 0);
  const playRef = useRef(null);
  const done = solved; // Davom etish — treyler DRAG bilan yig'ilganda
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => () => clearTimeout(playRef.current), []);
  const onSolved = () => {
    setSolved(prev => {
      if (prev) return prev;
      setInvLevel(4);
      // «Ijro» — qismlar ketma-ket chiqadi (harakat sifati → Animatsiya roli)
      let i = 0; const tick = () => { i++; setPlayStep(i); if (i < PARTS.length) playRef.current = setTimeout(tick, 460); };
      playRef.current = setTimeout(tick, 320);
      return true;
    });
  };
  // onAnswer(correct:true) FAQAT montaj g'alabasida — shu 🏅 'editor' nishonini beradi
  useEffect(() => { if (solved && storedAnswer === undefined) onAnswer(screen, { correct: true, montage: true }); }, [solved]); // eslint-disable-line
  const STRONG = PARTS.map(p => ({ label: p.label, color: p.color, text: p.ex }));
  const playItems = STRONG.map((it, i) => (i < playStep ? it : { ...it, text: '' }));
  const navLabel = !explored ? `${seen.size}/4 qatorni oching` : (solved ? 'Endi navbat sizga →' : 'Treylerni yig\'ing');
  return (
    <Stage eyebrow="Treyler-montaj" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">{explored ? <>Treylerni <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing</> : <>Tayyor pitch: har qator <span className="italic" style={{ color: T.accent }}>nega</span> shunday?</>}</h2></div>
        <Mentor>{explored
          ? <>Pitch qismlarini <b style={{ color: T.ink }}>to'g'ri tartibda</b> sudrab treylerni yig'ing. Har to'g'ri qism — investor bir pog'ona qiziqadi. To'liq to'g'ri bo'lsa — «Kelishdik!»</>
          : <>Mana to'liq "Bozor" pitchi. Har qatorni bosib, <b style={{ color: T.ink }}>nega</b> aynan shunday yozilganini ko'ring.</>}</Mentor>
        <Zoomable>
        {!explored ? (
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map(s => { const open = seen.has(s.key); return (<button key={s.key} onClick={() => tap(s.key)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 14px', background: T.paper, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: active === s.key ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : (open ? `inset 0 0 0 1px ${T.success}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`), transition: 'all 0.18s' }}><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span className="mono" style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase' }}>{s.label}</span>{open && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</span><span style={{ fontFamily: G, fontSize: 13, color: T.ink, fontStyle: 'italic' }}>"{s.ex}"</span></button>); })}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: PMETA[active].color, display: 'inline-flex' }}>{PMETA[active].ic}</span><span className="sk-wordbadge" style={{ color: PMETA[active].color, background: PMETA[active].color + '1c' }}>{PMETA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{PMETA[active].job}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
          </Col>
        </div>
        ) : (
        <div className="split">
          <Col>
            <p className="flow-label">Investor</p>
            <InvestorAvatar level={invLevel} deal={solved} />
          </Col>
          <Col>
            {!solved
              ? <TrailerMontage parts={PARTS} onLevel={setInvLevel} onSolved={onSolved} />
              : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {playStep >= PARTS.length && !storedAnswer && <Confetti />}
                  <PitchCard items={playItems} minH={200} />
                  {playStep >= PARTS.length && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Treyler tayyor — investor «Kelishdik!» dedi. Endi o'z pitchingizni yozasiz.</p></div>}
                </div>}
          </Col>
        </div>
        )}
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA (global savol) =====
const Screen14 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Sizga savol: odamlar aslida nimani sotib oladi — mahsulotnimi? Yo'q. Ular yechilgan muammoni, o'zining yaxshiroq holatini sotib oladi. Shuning uchun pitch faktni emas, hikoyani aytadi: muammodan yechimga.`, trigger: 'on_mount', waits_for: null }]);
  return (
    <Stage eyebrow="Qoida" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Odamlar aslida <span className="italic" style={{ color: T.accent }}>nimani</span> sotib oladi?</h2></div>
        <Mentor>Mahsulotni emas — <b style={{ color: T.ink }}>yechilgan muammoni</b>, o'zining yaxshiroq holatini. Shuning uchun pitch faktni emas, <b style={{ color: T.ink }}>hikoyani</b> aytadi: muammodan yechimga.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
              <IcoChip size={54} color="#E0892B" soft="#E0892B1c">{p3.film(28)}</IcoChip>
              <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Pitch = hikoya</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Fakt emas — yechilgan muammoni soting.</p></div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Yaxshi pitch — har doim</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map((s, i) => (<React.Fragment key={s.key}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.label}</span></div>{i < PARTS.length - 1 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: O'Z PITCHING + REPETITSIYA =====
const emptyPitch = () => ({ ilgak: '', muammo: '', yechim: '', demo: '' });
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const isMentorLive = !!(gate.live && gate.live.mode === 'mentor'); // proyektorda mentor o'zi yozmaydi — davom eta oladi
  const audio = useAudio([{ id: 's15', text: `Mana eng muhim qadam. O'z mahsulotingiz uchun 2 daqiqalik pitch yozing: diqqat tortish, muammo, yechim va demo bilan harakat. O'ngda pitch-kartangiz to'ladi. Keyin taymerni bosib, ovoz chiqarib mashq qiling.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [pit, setPit] = useState(() => storedAnswer?.pitch || emptyPitch());
  const filled = PARTS.filter(p => pit[p.key] && pit[p.key].trim().length >= 3).length;
  const passed = filled >= 4;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, pitch: pit, stage: 'final', screenIdx: screen });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Ajoyib! Pitchingiz tayyor. Endi taymerni bosib, oyna oldida ovoz chiqarib mashq qiling.`); }, 300);
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setPit(prev => ({ ...prev, [k]: v }));
  const items = PARTS.map(p => ({ label: p.label, color: p.color, text: pit[p.key], ph: p.ex }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? false : !passed} label={isMentorLive ? 'Davom etish' : (passed ? 'Davom etish' : `To'ldiring (${filled}/4)`)} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z mahsulotingiz uchun <span className="italic" style={{ color: T.accent }}>2 daqiqalik pitch</span> yozing</h2></div>
        <Mentor>To'rt qismni yozing: <b style={{ color: T.ink }}>diqqat tortish, muammo, yechim, demo+harakat</b>. O'ngda pitch-kartangiz to'ladi — keyin <b style={{ color: T.ink }}>ovoz chiqarib</b> mashq qiling.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {PARTS.map(p => { const ok = pit[p.key] && pit[p.key].trim().length >= 3; return (<div key={p.key} style={{ background: T.paper, borderRadius: 12, padding: '11px 13px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}><span style={{ color: ok ? T.success : p.color, display: 'inline-flex' }}>{ok ? Ico.check(15) : p.ic}</span><span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', color: T.ink, textTransform: 'uppercase' }}>{p.label}</span></div><textarea value={pit[p.key]} onChange={e => upd(p.key, e.target.value)} placeholder={p.ex} rows={2} style={{ width: '100%', fontFamily: G, fontSize: 13.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '8px 11px', resize: 'vertical', minHeight: 38, outline: 'none', lineHeight: 1.45, boxSizing: 'border-box' }} /></div>); })}
          </Col>
          <Col>
            <p className="flow-label">Pitch-kartangiz</p>
            <PitchCard items={items} minH={188} />
            {passed && (
              <div className="inv-rag fade-step" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <InvestorAvatar level={4} deal compact />
                <p className="body" style={{ margin: 0, color: T.ink2, flex: 1, minWidth: 140 }}>To'rt qism ham joyida — investorni ishontiradigan pitch! Endi taymerni bosib, ovoz chiqarib mashq qiling.</p>
              </div>
            )}
            {passed && <RehearseTimer />}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi Demo Day'da shu pitch bilan saytingizni taqdim qilasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN + DEMO DAY =====
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
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz! Endi siz mahsulot menejeri kabi o'ylaysiz: kim uchun, qanday tartibda va qanday qilib pitch qilish. Bularning hammasi Demo Day uchun. O'sha kuni o'zingiz xohlagan saytni qurib, pitch qilasiz. Omad!", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Pitch — treyler: qiziqtiradi, hammasini aytmaydi', 'Diqqat tortish: birinchi gap e\'tiborni tortadi', '4 qism: diqqat tortish → muammo → yechim → demo+harakat', 'Odamlar yechilgan muammoni sotib oladi'];
  const HOMEWORK = [{ b: 'Pitchni mashq qiling', t: '— oyna oldida 2 daqiqada ovoz chiqarib ayting' }, { b: 'Do\'stga ayting', t: '— u 2 daqiqada tushundimi? Qiziqdimi?' }, { b: 'Demo Day\'ga tayyorlaning', t: '— o\'z saytingiz va pitchingizni o\'ylab qo\'ying' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const earned = useContext(AchCtx);
  const achTotal = Object.keys(ACHIEVEMENTS).length;
  const achGot = earned ? earned.size : 0;
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM bloki tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>pitch</span> qila olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Kim uchun, qanday tartibda va qanday pitch — hammasini o\'rgandingiz. Demo Day\'ga tayyorsiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
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
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Demo Day'ga tayyorgarlik</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Pitchingizni jonli qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Demo Day — o'zingiz xohlagan saytni qurib, pitch qilasiz! 🎬</p></div>
        </div>
        <div className="ach-collect fade-up d4">
          <div className="ach-collect-h"><span className="ach-collect-ic">🏅</span><span className="ach-collect-t">Nishonlaringiz</span><span className="ach-collect-n">{achGot}/{achTotal}</span></div>
          <div className="ach-collect-grid">
            {Object.entries(ACHIEVEMENTS).map(([id, a]) => { const got = !!(earned && earned.has(id)); return (
              <div key={id} className={`ach-collect-card ${got ? 'got' : ''}`}>
                <span className="ach-collect-cardic">{got ? a.icon : '🔒'}</span>
                <span className="ach-collect-cardnm">{a.name}</span>
                {got && a.desc && <span className="ach-collect-carddesc">{a.desc}</span>}
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
const Q_LABELS = { 4: "Pitch nimadan boshlanadi", 6: "Demo+harakat vazifasi", 10: "Pitch = treyler", 13: "Vaqt taqsimoti", 16: "O'z pitchingiz (yakuniy)" };

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
const INLINE_KEYS = { s4: 1, s5b: 0, s9: 2, s12: 3, s15: -1 };

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

// ===== ⚡ CODESTRIKE (CoddyCamp jonli test arenasi) =====
const QUIZ_MS = 15000;
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#FF5A2C', '#0FA6D6', '#F5A623', '#22A05C']; // CodeStrike brend palitrasi: coral · ocean · sun · leaf
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
// Arena foni: suzuvchi pitch tokenlari (Demo Day hissi)
const QZ_BG_SHAPES = [
  { ch: '🎬',       l: 6,  t: 18, s: 40, c: 'rgba(20,17,14,0.05)',   d: 19, dl: 0 },
  { ch: 'pitch',    l: 84, t: 12, s: 30, c: 'rgba(255,79,40,0.08)',  d: 23, dl: 1.5 },
  { ch: '🎤',       l: 9,  t: 74, s: 38, c: 'rgba(20,17,14,0.05)',   d: 27, dl: 0.8 },
  { ch: 'Demo Day', l: 76, t: 70, s: 24, c: 'rgba(15,166,214,0.09)', d: 21, dl: 2.2 },
  { ch: '30s',      l: 46, t: 86, s: 28, c: 'rgba(20,17,14,0.05)',   d: 25, dl: 1.1 },
  { ch: '💰',       l: 66, t: 24, s: 34, c: 'rgba(20,17,14,0.05)',   d: 17, dl: 0.4 },
  { ch: 'hook',     l: 24, t: 36, s: 24, c: 'rgba(34,160,92,0.09)',  d: 20, dl: 1.9 },
  { ch: 'demo',     l: 92, t: 46, s: 24, c: 'rgba(245,166,35,0.10)', d: 24, dl: 1.3 },
  { ch: '<pitch>',  l: 2,  t: 46, s: 22, c: 'rgba(20,17,14,0.045)',  d: 26, dl: 2.6 },
];
const QUIZ_BANK = [
  { q: "Pitch nima?", opts: ["Mahsulotni qisqa, qiziqarli tushuntirish", "Mahsulotning uzun texnik hujjati", "Kod yoziladigan dasturlash tili", "Saytning tashqi ko'rinishi, dizayni"], correct: 0 },
  { q: "Yaxshi pitch nimadan boshlanadi?", opts: ["Texnik tafsilotlarni sanashdan", "Diqqatni tortadigan birinchi gapdan", "Mahsulot narxini aytishdan", "Uzoq salomlashuv va tanishtirishdan"], correct: 1 },
  { q: "Pitch qaysi kino elementiga o'xshaydi?", opts: ["Boshidan oxirigacha to'liq filmga", "Film oxiridagi titrlarga", "Treylerga — qisqa qiziqtiradi", "O'rtadagi reklama pauzasiga"], correct: 2 },
  { q: "Pitchning 4 qismi to'g'ri tartibda qaysi?", opts: ["Yechim-muammo-demo-diqqat", "Demo-diqqat-yechim-muammo", "Muammo-demo-diqqat-yechim", "Diqqat-muammo-yechim-demo"], correct: 3 },
  { q: "'Demo + harakat' qismi nima qiladi?", opts: ["Ishontiradi va keyingi qadamga chaqiradi", "Pitchni uzaytirib to'ldiradi", "Texnik faktlarni birma-bir sanaydi", "Tinglovchi bilan salomlashadi"], correct: 0 },
  { q: "2 daqiqalik pitchda eng ko'p vaqt nimaga?", opts: ["Texnik tafsilotlarni sanashga", "Muammo va yechimni ko'rsatishga", "Salomlashuv va tanishtirishga", "Qaysi dasturda qilinganiga"], correct: 1 },
  { q: "Odamlar aslida nimani sotib oladi?", opts: ["Mahsulotning o'zini va narxini", "Bozordagi eng arzon narsani", "Yechilgan muammoni, yaxshi holatni", "Mahsulotning texnik tafsilotini"], correct: 2 },
  { q: "Qaysi birinchi gap tinglovchini eng yaxshi ushlaydi?", opts: ["'Salom, men bir sayt qilib chiqdim'", "'Bu sayt HTML va CSS da qilingan'", "'Saytning rangi ko'k va chiroyli'", "'Uyingizda ishlamay yotgan narsa bormi?'"], correct: 3 },
  { q: "Zaif pitch odatda nimadan boshlanadi?", opts: ["Qiziqarli, kuchli savoldan", "Tinglovchiga tanish muammodan", "Texnik fakt yoki salomlashuvdan", "Kuchli va qiziq hikoyadan"], correct: 2 },
  { q: "Yechim qismi qanday bo'lishi kerak?", opts: ["Mahsulotni bir aniq jumlada aytish", "Barcha funksiyalarni sanash", "Faqat mahsulot narxini aytish", "Texnik stack'ni tushuntirish"], correct: 0 },
  { q: "Nima uchun birinchi gap juda muhim?", opts: ["Faqat chiroyli ko'rinishi uchun", "Zaif bo'lsa, qolganini hech kim eshitmaydi", "U eng uzun qism bo'lishi kerak", "U texnik faktlar bilan to'lishi kerak"], correct: 1 },
  { q: "Pitchni yozib bo'lgach nima qilish kerak?", opts: ["Uni darhol unutib yuborish", "Uni ikki barobar uzaytirish", "Qog'ozga yozib, javonga qo'yib qo'yish", "Ovoz chiqarib, 2 daqiqada mashq qilish"], correct: 3 },
];
const quizPts = (elapsedMs) => elapsedMs <= 500 ? 1000 : Math.max(0, Math.round(1000 * (1 - (Math.min(elapsedMs, QUIZ_MS) / QUIZ_MS) / 2)));
// 🎬 QzFX — arena foni: suzuvchi uchqun + bog'lovchi "web" chiziqlari + pitch tokenlari (Demo Day energiyasi).
// reduced-motion: matchMedia bilan darhol chiqadi (harakat yo'q). L1 QzFX mexanikasi, TOK pitch-mavzudan.
function QzFX() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = cv.getContext('2d'); const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, raf = 0;
    const size = () => { W = cv.width = Math.max(1, cv.offsetWidth * DPR); H = cv.height = Math.max(1, cv.offsetHeight * DPR); };
    size(); window.addEventListener('resize', size);
    const TOK = ['pitch', 'demo', '🎬', '🎤', '💰', 'hook', '30s'];
    const em = [], toks = [];
    for (let i = 0; i < 26; i++) em.push({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * .7, ph: Math.random() * 6.28, sw: .3 + Math.random() * .6 });
    for (let i = 0; i < 7; i++) toks.push({ x: Math.random() * W, y: Math.random() * H, z: .4 + Math.random() * .9, vx: (Math.random() - .5) * .16, t: TOK[i % TOK.length], r: (Math.random() - .5) * .5 });
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
      <QzFX />
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
          <CsWordmark stats={false} />
          <h2 className="qz-h">Mustahkamlash Testi</h2>
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

      {/* ===== NATIJA (reveal) ===== */}
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

      {/* ===== YAKUN — PODIUM ===== */}
      {phase === 'done' && (
        <div className="qz-view fade-step">
          <Confetti />
          <div className="cs-boltrow"><QzBolt size={44} /></div>
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

// 🃏 FLASHCARDS — aktiv takrorlash (3D flip + o'z-o'zini baholash). Pitch/treyler mavzusi, 12 karta.
const PM3_FLASHCARDS = [
  { front: 'Pitch nima?', back: 'Qisqa taqdimot', note: 'mahsulotni 2 daqiqada qiziqtirib tushuntirish' },
  { front: 'Pitch nimaga o\'xshaydi?', back: 'Treyler', note: 'qiziqtiradi, hammasini aytmaydi' },
  { front: 'Pitchning 1-qismi qaysi?', back: 'Diqqat tortish', note: 'birinchi gap e\'tiborni ushlaydi' },
  { front: 'Pitchning 2-qismi qaysi?', back: 'Muammo', note: 'tinglovchiga tanish qiyinchilik' },
  { front: 'Pitchning 3-qismi qaysi?', back: 'Yechim', note: 'mahsulot — bir aniq jumlada' },
  { front: 'Pitchning 4-qismi qaysi?', back: 'Demo + harakat', note: 'ko\'rsat va aniq chaqir' },
  { front: 'Demo nima qiladi?', back: 'Ishlab ko\'rsatadi', note: 'mahsulot ishlayotganini ko\'rsatib ishontiradi' },
  { front: 'Harakat (chaqiriq) nima qiladi?', back: 'Keyingi qadamga chaqiradi', note: '«hoziroq sinab ko\'ring»' },
  { front: 'Odamlar aslida nimani sotib oladi?', back: 'Yechilgan muammoni', note: 'mahsulotning o\'zini emas' },
  { front: 'Pitch qancha davom etadi?', back: '2 daqiqa', note: 'qisqa va aniq' },
  { front: 'Eng ko\'p vaqt nimaga ketadi?', back: 'Muammo va yechimga', note: 'texnik tafsilotga emas' },
  { front: 'Demo Day nima?', back: 'Taqdim qilish kuni', note: 'o\'z saytingiz va pitchingizni ko\'rsatasiz' },
];
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
    <div className="fc-done fade-up"><span className="fc-done-emoji">🎉</span><p className="fc-done-h">Hammasini bilasiz!</p><p className="fc-done-s">{total}/{total} karta takrorlandi</p><button className="fc-btn ghost" onClick={restart}>↻ Qaytadan takrorlash</button></div>
  );
  return (
    <div className="fc fade-up">
      <div className="fc-top"><span className="fc-pill learn" key={`l-${queue.length}-${swapRef.current}`}>↻ O'rganilmoqda · <b>{queue.length}</b></span><span className="fc-pill knew" key={`k-${known}`}>✓ Bildim · <b>{known}</b></span></div>
      <div className="fc-bar"><span className="fc-bar-fill" style={{ width: `${(known / total) * 100}%` }} /></div>
      <div className="fc-cardwrap">
        <div className={`fc-fly ${exiting === 'knew' ? 'out-knew' : ''} ${exiting === 'again' ? 'out-again' : ''}`} key={swapRef.current}>
        <div className={`fc-card ${flipped ? 'flip' : ''}`} onClick={() => !flipped && !exiting && setFlipped(true)} role="button" tabIndex={0}>
          <div className="fc-face fc-front"><span className="fc-q">{card.front}</span><span className="fc-cue">Javobini bilasizmi? 🤔 <span className="fc-tap">bosing</span></span></div>
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
  const audio = useAudio([{ id: 'sflash', text: `Darsni yakunlashdan oldin, bugun o'rgangan pitch tushunchalarini tez takrorlaymiz. Har kartada bir savol — javobni o'ylang, keyin kartani bosib tekshiring.`, trigger: 'on_mount', waits_for: null }]);
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []); // eslint-disable-line
  return (
    <Stage eyebrow="Takrorlash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={false} label="Yakunlash →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Pitch tushunchalarini <span className="italic" style={{ color: T.accent }}>tez takrorlaymiz</span>.</h2></div>
        <Mentor>Darsni yakunlashdan oldin bugun o'rgangan tushunchalarni takrorlaymiz. Har kartada bir savol — <b style={{ color: T.ink }}>javobni</b> o'ylang, keyin kartani bosib tekshiring. <b style={{ color: T.ink }}>Bildim</b> yoki <b style={{ color: T.ink }}>Takrorlash</b> bilan baholang.</Mentor>
        <div className="fc-center"><Flashcards cards={PM3_FLASHCARDS} /></div>
      </div>
    </Stage>
  );
};

// 🏅 To'liq-ekran nishon bayrami (harakat sifati → Animatsiya, KO'RINISH → Dizayn)
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

// ⚡ CODESTRIKE wordmark + bolt (arena lobbyda/done'da ko'rsatiladi). Brend RANGLAR → Dizayn.
const QzBolt = ({ size = 72 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="qz-bolt">
    <defs><linearGradient id="qzbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A3D" /><stop offset="1" stopColor="#FF4F28" /></linearGradient></defs>
    <rect x="6" y="6" width="88" height="88" rx="24" fill="url(#qzbg)" />
    <path d="M56 12 L28 54 L45 54 L38 88 L72 40 L53 40 Z" fill="#fff" stroke="#E23A16" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="76" cy="24" r="3.5" fill="#FFD9A8" /><circle cx="22" cy="72" r="2.6" fill="#FFD9A8" /><circle cx="80" cy="66" r="2.2" fill="#FFD9A8" />
  </svg>
);
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

// 👋 ONBOARDING — rolga qarab bir marta (data-tour tugmalariga spotlight)
const TOUR = {
  learner: [
    { sel: '[data-tour="next"]', ic: '▶', h: 'Oldinga o\'tish', body: <>Tayyor bo'lsangiz, <b>«Davom etish»</b> bilan keyingi qadamga o'tasiz. Yonidagi <b>«Orqaga»</b> bilan qaytasiz.</> },
    { sel: '[data-tour="mentor"]', ic: '🧑‍🏫', h: 'Mentor yordami', body: <>Har ekranda mentor nima qilishni tushuntiradi — avval uni <b>o'qing</b>, keyin bajaring.</> },
    { sel: '[data-tour="progress"]', ic: '📊', h: 'Progress chizig\'i', body: <>Bu chiziq dars <b>qancha qolganini</b> ko'rsatadi — to'lgani sari yakunlaysiz.</> },
    { sel: '[data-tour="ach"]', ic: '🏅', h: 'Nishonlaringiz', body: <>Vazifalarni bajarib, shu yerda <b>nishon</b> yig'asiz. Bosib ro'yxatini ko'rasiz.</> },
  ],
  mentor: [
    { sel: '[data-tour="live"]', ic: '🔢', h: 'Qo\'shilish kodi', body: <>O'quvchilar shu <b>PIN kod</b> bilan qo'shiladi. Kim qo'shilganini shu yerda ko'rasiz.</> },
    { sel: '[data-tour="next"]', ic: '▶', h: 'Siz boshqarasiz', body: <><b>«Davom etish»</b> bosganingizda, barcha o'quvchilar birga oldinga o'tadi.</> },
    { sel: '[data-tour="progress"]', ic: '📊', h: 'Progress chizig\'i', body: <>Dars qaysi bosqichda ekanini shu chiziq ko'rsatadi.</> },
  ],
};
function TourGuide({ role, onClose }) {
  const steps = TOUR[role] || TOUR.learner;
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const step = steps[i];
  const last = i === steps.length - 1;
  useEffect(() => {
    const el = typeof document !== 'undefined' && document.querySelector(step.sel);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'center', behavior: 'auto' });
    const measure = () => { const r = el.getBoundingClientRect(); setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom }); };
    const raf = requestAnimationFrame(() => { measure(); });
    const t = setTimeout(measure, 90);
    window.addEventListener('resize', measure);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowRight') setI(p => Math.min(p + 1, steps.length - 1)); else if (e.key === 'ArrowLeft') setI(p => Math.max(p - 1, 0)); };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener('resize', measure); window.removeEventListener('keydown', onKey); };
  }, [i, step.sel, steps.length, onClose]);
  const next = () => last ? onClose() : setI(i + 1);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const CW = Math.min(300, vw - 24);
  let callStyle = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: CW };
  if (rect) {
    const below = rect.bottom + 168 < vh;
    const cx = Math.min(Math.max(rect.left + rect.width / 2, CW / 2 + 12), vw - CW / 2 - 12);
    callStyle = below
      ? { top: rect.bottom + 16, left: cx, transform: 'translateX(-50%)', width: CW }
      : { top: Math.max(12, rect.top - 16), left: cx, transform: 'translate(-50%,-100%)', width: CW };
  }
  return (
    <div className="tg-root">
      {rect
        ? <div className="tg-hole" style={{ top: rect.top - 7, left: rect.left - 7, width: rect.width + 14, height: rect.height + 14 }} />
        : <div className="tg-dim" />}
      <div className="tg-call" style={callStyle}>
        <div className="tg-head"><span className="tg-ic">{step.ic}</span><span className="tg-h">{step.h}</span><span className="tg-count">{i + 1}/{steps.length}</span></div>
        <p className="tg-body">{step.body}</p>
        <div className="tg-nav">
          <button className="tg-skip" onClick={onClose}>O'tkazib yuborish</button>
          <div className="tg-navr">
            {i > 0 && <button className="tg-btn ghost" onClick={() => setI(i - 1)} aria-label="Oldingi">←</button>}
            <button className="tg-btn go" onClick={next}>{last ? 'Boshladik!' : 'Keyingisi →'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PmLesson3({ lang: langProp, onFinished }) {
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
  // 🃏 Flashcard jonli darsda FAQAT MENTORGA ko'rinadi (proyektorda jamoaviy takrorlash);
  // jonli o'quvchidan yashirin — sakrab o'tiladi. Erkin qilinsa / uzilsa / self — ochiladi.
  const FLASH_IDX = SCREEN_META.findIndex(m => m.id === 'sflash');
  const flashHidden = () => live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const next = () => setScreen(s => {
    let n = Math.min(s + 1, TOTAL_SCREENS - 1);
    if (n === FLASH_IDX && flashHidden()) n = Math.min(n + 1, TOTAL_SCREENS - 1);
    return n;
  });
  const prev = () => setScreen(s => {
    let n = Math.max(s - 1, 0);
    if (n === FLASH_IDX && flashHidden()) n = Math.max(n - 1, 0);
    return n;
  });
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
  // 👋 Onboarding — rejim tanlangach bir marta (rolga qarab, localStorage'da eslab qolinadi)
  const [onboard, setOnboard] = useState(false);
  const onboardShownRef = useRef(false);
  const onboardRole = live.mode === 'mentor' ? 'mentor' : 'learner';
  useEffect(() => {
    if (live.mode !== 'choosing' && !onboardShownRef.current) {
      onboardShownRef.current = true;
      let show = true;
      try { if (localStorage.getItem('pm3Onboarded_' + onboardRole)) show = false; } catch {}
      if (show) { const t = setTimeout(() => setOnboard(true), 500); return () => clearTimeout(t); }
    }
  }, [live.mode, onboardRole]);
  const closeOnboard = () => { try { localStorage.setItem('pm3Onboarded_' + onboardRole, '1'); } catch {} setOnboard(false); };
  // 🏅 Yakuniy ekranga yetganda: bitiruvchi nishoni
  useEffect(() => { if (screen === TOTAL_SCREENS - 1) earn('graduate'); }, [screen]); // eslint-disable-line

  const finishLesson = () => {
    live.endSession();
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, ScreenPodium, ScreenFlashcards, Screen16];
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
        .fade-up { animation: fade-in-up 0.45s cubic-bezier(.2,.7,.2,1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: calc(90vh / var(--lz, 1)); overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
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

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 9px 14px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -6px rgba(${T.shadowBase},0.22); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover { transform: translateY(-1px); }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: cover; }
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
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
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

        /* ===== ⚡ CODESTRIKE — CTA (yakun sahifasida) ===== */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: linear-gradient(135deg, #FFF3EA, #FFE7DC); border: 1px solid #F3D9CC; border-radius: 20px; padding: clamp(16px,2.4vw,22px) clamp(18px,2.6vw,26px); box-shadow: 0 16px 40px -18px rgba(255,79,40,0.28); }
        .cs-cta { flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: clamp(8px,1.2vw,12px); position: relative; padding: clamp(14px,2vw,20px) clamp(16px,2.6vw,28px); background: radial-gradient(130% 130% at 50% 0%, #FFF2EA 0%, #FFE3D3 58%, #FFD4C0 100%); border-color: #F7C8B0; }
        .cs-cta::before { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(58% 74% at 50% 34%, rgba(255,95,30,0.20), transparent 72%); pointer-events: none; }
        .qz-cta-txt { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 3px; }
        .qz-cta-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(16px,2.2vw,20px); color: #121826; }
        .qz-cta-s { font-family: 'Manrope'; font-weight: 500; font-size: 13px; color: #525A6B; }
        .qz-cta-btn { background: linear-gradient(170deg,#FF8A3D,#FF4F28); color: #fff; border: none; border-radius: 14px; padding: 13px 24px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 12px 24px -8px rgba(255,79,40,0.6); transition: transform 0.2s; }
        .qz-cta-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
        .qz-cta-btn:disabled { background: #E9E6DF; color: #98A0B4; cursor: default; box-shadow: none; }
        .qz-cta.ready .qz-cta-btn { animation: qz-pulse 1.1s ease-in-out infinite; }
        @keyframes qz-pulse { 0%,100% { transform: scale(1); box-shadow: 0 8px 22px -8px rgba(255,79,40,0.7); } 50% { transform: scale(1.06); box-shadow: 0 10px 30px -6px rgba(255,79,40,0.95); } }

        /* ===== ⚡ ARENA — issiq CoddyCamp muhiti ===== */
        .qz-arena { position: fixed; inset: 0; z-index: 10500; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; padding: clamp(18px,4vw,44px) clamp(12px,3vw,32px); background: radial-gradient(60% 45% at 12% 8%, rgba(255,79,40,0.10) 0%, rgba(255,79,40,0) 55%), radial-gradient(58% 48% at 90% 14%, rgba(15,166,214,0.16) 0%, rgba(15,166,214,0) 55%), radial-gradient(60% 50% at 78% 100%, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0) 60%), radial-gradient(80% 48% at 50% -6%, #E9F0FD 0%, rgba(233,240,253,0) 52%), #F0F4FC; }
        .qz-arena::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: radial-gradient(rgba(30,44,80,0.05) 1.1px, transparent 1.2px); background-size: 24px 24px; -webkit-mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); }
        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; animation: qz-drift ease-in-out infinite; will-change: transform; }
        @keyframes qz-drift { 0%,100% { transform: translate(0,0) rotate(-7deg) scale(1); } 50% { transform: translate(22px,-28px) rotate(9deg) scale(1.07); } }
        @media (prefers-reduced-motion: reduce) { .qz-shp { animation: none; } }
        .qz-x { position: fixed; top: 14px; right: 16px; z-index: 10600; width: 38px; height: 38px; border-radius: 50%; border: 1px solid #DDE4F1; background: #fff; color: #525A6B; font-size: 16px; cursor: pointer; box-shadow: 0 6px 16px -8px rgba(30,44,80,0.4); transition: transform 0.25s, color 0.2s; }
        .qz-x:hover { color: #121826; transform: rotate(90deg); }
        .qz-view { position: relative; z-index: 1; width: 100%; max-width: 820px; display: flex; flex-direction: column; align-items: center; gap: clamp(14px,2.4vw,22px); margin: auto; }
        .qz-logo { font-size: clamp(44px,8vw,72px); line-height: 1; filter: drop-shadow(0 8px 24px rgba(255,79,40,0.5)); }
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
        .qz-qview { max-width: 860px; }
        .qz-top { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .qz-count { font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.8vw,16px); color: #525A6B; }
        .qz-count b { color: #121826; font-size: 1.25em; }
        .qz-ansn { font-family: 'Manrope'; font-weight: 800; font-size: clamp(13px,1.8vw,16px); color: #FF4F28; min-width: 64px; text-align: right; }
        .qz-timer { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
        .qz-timer-n { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 20px; }
        .qz-timer.urgent { animation: qz-shake 0.5s ease-in-out infinite; }
        @keyframes qz-shake { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .qz-q { font-family: 'Manrope'; font-weight: 800; font-size: clamp(19px,3.2vw,28px); color: #121826; margin: 0; text-align: center; line-height: 1.35; background: #fff; border: 1px solid #DDE4F1; border-radius: 20px; padding: clamp(18px,2.8vw,28px) clamp(18px,3vw,30px); width: 100%; box-shadow: 0 14px 34px -20px rgba(30,44,80,0.4); text-wrap: balance; }
        .qz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px,1.6vw,14px); width: 100%; }
        @media (max-width: 560px) { .qz-grid { grid-template-columns: 1fr; } }
        .qz-tile { position: relative; display: flex; align-items: center; gap: 14px; border: none; border-radius: 18px; padding: clamp(15px,2.4vw,22px) clamp(14px,2.2vw,20px); cursor: pointer; text-align: left; min-height: 66px; color: #fff; overflow: hidden; box-shadow: 0 14px 26px -14px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -4px 0 rgba(0,0,0,0.16); transition: transform 0.14s, opacity 0.3s, box-shadow 0.14s, filter 0.2s; }
        .qz-tile:hover:not(:disabled):not(.rv) { transform: translateY(-3px); box-shadow: 0 20px 34px -14px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.18); }
        .qz-tile:active:not(:disabled):not(.rv) { transform: translateY(2px) scale(0.985); }
        .qz-tile:disabled { cursor: default; }
        .qz-shape { width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,0.22); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.35); display: flex; align-items: center; justify-content: center; font-size: clamp(16px,2.2vw,20px); color: #fff; flex-shrink: 0; }
        .qz-opt { flex: 1; font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(14px,2vw,17px); color: #fff; line-height: 1.3; letter-spacing: -0.01em; }
        .qz-tile.faded { filter: saturate(0.5); opacity: 0.4; }
        .qz-tile.picked { outline: 3px solid #fff; box-shadow: 0 0 0 4px rgba(255,255,255,0.4), 0 14px 26px -12px rgba(0,0,0,0.4); animation: qz-pop 0.3s; }
        .qz-pbadge { position: absolute; top: -9px; right: -7px; width: 27px; height: 27px; border-radius: 50%; background: #fff; color: #12A968; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 12px rgba(0,0,0,0.28); }
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
        @keyframes qz-float-sm { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
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

        /* === .qcode kod-chip (backtick) — CHIP STILI → Dizayn === */
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }
        .qz-tile .qcode, .qz-opt .qcode { background: rgba(255,255,255,0.25); color: #fff; }

        /* === 🎬 TREYLER-MONTAJ (DragDrop) === */
        .dd { display: flex; flex-direction: column; gap: 13px; }
        .dd-slots { display: flex; flex-direction: column; gap: 9px; position: relative; }
        .dd-slot { display: flex; align-items: center; gap: 12px; min-height: 56px; border-radius: 14px; border: 2px dashed ${T.ink3}66; background: ${T.paper}; padding: 8px 12px; transition: border-color .18s, background .18s, box-shadow .18s; }
        .dd-slot.filled { border-style: solid; border-color: #E8E4DC; }
        .dd-slot.ok { border-color: ${T.success}; background: ${T.successSoft}; }
        .dd-slot.bad { border-color: #E24848; background: #FBE9E9; animation: dd-shake .4s; }
        .dd-slot.hint { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accent}33; }
        @keyframes dd-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .dd-slotn { width: 26px; height: 26px; border-radius: 8px; background: ${T.bg}; color: ${T.ink3}; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dd-slot.ok .dd-slotn { background: ${T.success}; color: #fff; }
        .dd-hint { color: ${T.ink3}; font-style: italic; font-size: 13px; }
        .dd-pool { display: flex; flex-wrap: wrap; gap: 9px; min-height: 48px; padding: 10px; border-radius: 14px; background: ${T.bg}; position: relative; z-index: 1; }
        .dd-pool-empty { color: ${T.ink3}; font-size: 12.5px; font-style: italic; align-self: center; }
        .dd-chip { display: inline-flex; align-items: center; gap: 7px; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.7vw,14.5px); color: ${T.ink}; background: ${T.paper}; border: none; border-radius: 11px; padding: 10px 14px; cursor: grab; touch-action: none; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.22); transition: transform .12s; user-select: none; }
        .dd-chip:hover { transform: translateY(-2px); }
        .dd-chip:active { cursor: grabbing; }
        /* tap-hint affordance — birinchi joylashuvgacha «meni sudra» pulsatsiyasi */
        .dd-chip.nudge { animation: dd-nudge 1.5s ease-in-out infinite; }
        .dd-chip.nudge:hover { animation: none; }
        @keyframes dd-nudge { 0%,100% { transform: translateY(0); box-shadow: inset 0 0 0 1.5px transparent, 0 6px 16px -8px rgba(${T.shadowBase},0.22); } 50% { transform: translateY(-3px); box-shadow: 0 0 0 2px ${T.accent}44, 0 11px 22px -8px rgba(255,79,40,0.4); } }
        .dd-chip.in { cursor: default; box-shadow: none; }
        .dd-chip.in:hover { transform: none; }

        /* === 🎬 «TREYLER IJROSI» — qismlar ketma-ket yonadi (playStep stagger) === */
        .pc-row { transition: opacity .2s; }
        .pc-row.lit { animation: pc-light 0.5s cubic-bezier(.2,.8,.25,1) both; }
        @keyframes pc-light { 0% { opacity: 0; transform: translateY(7px) scale(0.99); filter: brightness(1.9); } 55% { filter: brightness(1.35); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); } }

        /* === 💼 INVESTOR HOLAT-MASHINASI (harakat → Animatsiya, rang → Dizayn) === */
        .inv-avatar { display: flex; flex-direction: column; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 16px; padding: 16px; box-shadow: 0 8px 22px -12px rgba(${T.shadowBase},0.2); }
        .inv-avatar.compact { flex-direction: row; padding: 10px 14px; gap: 11px; }
        .inv-face { font-size: clamp(44px,8vw,62px); line-height: 1; animation: inv-pop 0.4s cubic-bezier(.34,1.5,.5,1); will-change: transform; }
        .inv-avatar.compact .inv-face { font-size: 34px; }
        @keyframes inv-pop { 0% { transform: scale(0.7); } 60% { transform: scale(1.16); } 100% { transform: scale(1); } }
        /* S11 mikro-reaksiyalar: zerikkanda yengil esnash/tebranish, qiziqqanda bosh qimirlatish */
        .inv-face.idle-bored { animation: inv-pop 0.4s cubic-bezier(.34,1.5,.5,1), inv-yawn 4.2s ease-in-out 0.6s infinite; }
        @keyframes inv-yawn { 0%,88%,100% { transform: scale(1) rotate(0); } 92% { transform: scale(0.965) rotate(-2.5deg); } 96% { transform: scale(1.03) rotate(1.5deg); } }
        .inv-face.idle-keen { animation: inv-pop 0.4s cubic-bezier(.34,1.5,.5,1), inv-nod 2.3s ease-in-out 0.5s infinite; }
        @keyframes inv-nod { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-4px) rotate(-2deg); } }
        /* «Kelishdik!» — kayfiyat cho'qqisida yuz katta bayram-pop bilan chiqadi */
        .inv-face.dealface { animation: inv-deal-pop 0.62s cubic-bezier(.28,1.6,.4,1); }
        @keyframes inv-deal-pop { 0% { transform: scale(0) rotate(-32deg); } 55% { transform: scale(1.28) rotate(9deg); } 78% { transform: scale(0.93) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }
        .inv-meter { display: flex; gap: 6px; }
        .inv-pip { width: 22px; height: 7px; border-radius: 99px; background: rgba(${T.shadowBase},0.16); transition: background 0.3s; }
        .inv-pip.on { background: var(--inv-mood, ${T.success}); }
        .inv-label { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink2}; margin: 0; text-align: center; }
        .inv-avatar.deal { background: ${T.successSoft}; box-shadow: 0 8px 22px -12px rgba(31,122,77,0.32), inset 0 0 0 1.5px ${T.success}55; }
        /* «Kelishdik! 💰» muhri — rezina-shtamp slam bilan urib qo'yiladi */
        .inv-avatar.deal .inv-label { animation: inv-slam 0.52s cubic-bezier(.3,1.5,.4,1); transform-origin: center; }
        @keyframes inv-slam { 0% { transform: scale(2.5) rotate(-9deg); opacity: 0; } 55% { transform: scale(0.9) rotate(3deg); opacity: 1; } 78% { transform: scale(1.06) rotate(-1.5deg); } 100% { transform: scale(1) rotate(0); } }

        /* === 🃏 FLASHCARDS (3D flip) === */
        .fc-center { display: flex; justify-content: center; padding-top: 4px; }
        .fc { display: flex; flex-direction: column; gap: 11px; max-width: 480px; width: 100%; }
        .fc-top { display: flex; justify-content: space-between; align-items: center; }
        .fc-pill { display: inline-flex; align-items: center; gap: 5px; font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; border-radius: 99px; padding: 5px 13px; animation: fc-pill-pop 0.35s cubic-bezier(.34,1.5,.4,1); }
        .fc-pill b { font-size: 1.15em; font-variant-numeric: tabular-nums; }
        .fc-pill.learn { background: ${T.accentSoft}; color: ${T.accent}; border: 1.5px solid ${T.accent}44; }
        .fc-pill.knew { background: ${T.successSoft}; color: ${T.success}; border: 1.5px solid ${T.success}44; }
        @keyframes fc-pill-pop { 40% { transform: scale(1.16); } }
        .fc-bar { height: 7px; background: #E8E4DC; border-radius: 99px; overflow: hidden; }
        .fc-bar-fill { display: block; height: 100%; background: linear-gradient(90deg, #FF8A3D, ${T.accent}); border-radius: 99px; transition: width .4s cubic-bezier(.34,1.2,.4,1); }
        .fc-cardwrap { perspective: 1200px; position: relative; }
        .fc-cardwrap::before, .fc-cardwrap::after { content: ""; position: absolute; left: 0; right: 0; top: 0; bottom: 0; border-radius: 20px; background: ${T.paper}; border: 2px solid #E8E4DC; z-index: -1; }
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
        @keyframes fc-stamp { from { transform: translate(-50%,-50%) scale(0); } }
        .fc-card { position: relative; height: clamp(160px,26vw,188px); cursor: pointer; transform-style: preserve-3d; transition: transform .55s cubic-bezier(.4,0,.2,1); }
        .fc-card.flip { transform: rotateY(180deg); }
        .fc-card:not(.flip):hover { transform: translateY(-3px); }
        .fc-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 22px; text-align: center; }
        .fc-front { background: ${T.paper}; border: 2px solid #E8E4DC; box-shadow: 0 14px 34px -18px rgba(${T.shadowBase},0.4); }
        .fc-back { background: linear-gradient(160deg, #FF8A3D, ${T.accent}); color: #fff; transform: rotateY(180deg); box-shadow: 0 16px 36px -16px rgba(255,79,40,0.6); }
        .fc-q { font-family: 'Manrope'; font-weight: 800; font-size: clamp(18px,2.8vw,23px); color: ${T.ink}; line-height: 1.3; }
        .fc-cue { font-family: 'Manrope'; font-size: 13px; color: ${T.ink3}; }
        .fc-tap { color: ${T.accent}; font-weight: 700; }
        .fc-tag { font-family: 'Manrope'; font-weight: 800; font-size: clamp(24px,5vw,38px); letter-spacing: -0.01em; }
        .fc-note { font-family: 'Manrope'; font-size: 14px; opacity: 0.92; }
        .fc-actions { display: flex; gap: 10px; }
        .fc-btn { flex: 1; padding: 13px; border-radius: 13px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; border: none; transition: transform .15s; }
        .fc-btn:hover { transform: translateY(-2px); }
        .fc-btn.knew { background: ${T.success}; color: #fff; box-shadow: 0 10px 22px -10px ${T.success}; }
        .fc-btn.again { background: ${T.paper}; border: 2px solid ${T.accent}66; color: ${T.accent}; }
        .fc-btn.again:hover { border-color: ${T.accent}; background: ${T.accentSoft}; }
        .fc-btn:disabled { opacity: 0.55; cursor: default; transform: none; }
        .fc-btn.ghost { background: ${T.paper}; border: 1.5px solid #E8E4DC; color: ${T.ink}; flex: none; align-self: center; padding: 11px 22px; }
        .fc-hint { margin: 0; text-align: center; color: ${T.ink3}; font-style: italic; font-size: 13px; }
        .fc-done { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; background: ${T.successSoft}; border-radius: 18px; padding: 22px; max-width: 480px; }
        .fc-done-emoji { font-size: 40px; }
        .fc-done-h { font-family: 'Manrope'; font-weight: 800; font-size: 20px; color: ${T.success}; margin: 0; }
        .fc-done-s { font-family: 'Manrope'; color: ${T.ink2}; margin: 0 0 8px; font-size: 14px; }

        /* === 🏅 NISHON — yuqori panel hisoblagichi + to'liq-ekran bayram === */
        .ach-cnt-wrap { position: relative; }
        .ach-counter { display: inline-flex; align-items: center; gap: 4px; background: ${T.paper}; border: 1.5px solid #E8E4DC; border-radius: 99px; padding: 5px 11px 5px 9px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink2}; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .ach-counter.has { border-color: ${T.accent}66; }
        .ach-counter:hover { border-color: ${T.accent}; box-shadow: 0 6px 16px -8px rgba(255,79,40,0.4); }
        .ach-counter b { color: ${T.accent}; font-size: 14px; font-variant-numeric: tabular-nums; }
        .ach-cnt-tot { color: ${T.ink3}; font-size: 11.5px; }
        .ach-cnt-ic { font-size: 14px; }
        .ach-counter.bump { animation: ach-bump 0.8s cubic-bezier(.34,1.6,.4,1); }
        @keyframes ach-bump { 0% { transform: scale(1); } 30% { transform: scale(1.35) rotate(-6deg); box-shadow: 0 0 0 6px rgba(255,79,40,0.18); } 60% { transform: scale(0.96) rotate(3deg); } 100% { transform: scale(1) rotate(0); box-shadow: 0 0 0 0 rgba(255,79,40,0); } }
        .ach-pop { position: absolute; top: calc(100% + 8px); right: 0; z-index: 200; width: 232px; background: ${T.paper}; border: 1px solid #E8E4DC; border-radius: 14px; padding: 10px; box-shadow: 0 18px 44px -14px rgba(${T.shadowBase},0.4); display: flex; flex-direction: column; gap: 3px; animation: fade-step 0.22s ease; }
        .ach-pop-h { font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.accent}; padding: 2px 6px 6px; }
        .ach-pop-row { display: flex; align-items: center; gap: 9px; padding: 6px 8px; border-radius: 9px; }
        .ach-pop-row.got { background: ${T.accentSoft}66; }
        .ach-pop-ic { font-size: 17px; width: 20px; text-align: center; }
        .ach-pop-row:not(.got) .ach-pop-ic { filter: grayscale(1) opacity(0.5); font-size: 13px; }
        /* === Jonli-dars xabari — sekundar UI, xira (11.15) === */
        .live-badge { opacity: 0.4; transition: opacity 0.25s ease, box-shadow 0.25s ease; }
        .live-badge:hover, .live-badge:focus-within { opacity: 1; box-shadow: 0 8px 24px -6px rgba(58,53,48,0.32) !important; }
        @media (hover: none) { .live-badge { opacity: 0.62; } }
        .ach-pop-nm { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .ach-pop-row:not(.got) .ach-pop-nm { color: ${T.ink3}; }
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

        /* Summary — 🏅 nishonlar kolleksiyasi */
        .ach-collect { background: ${T.paper}; border-radius: 16px; padding: 16px 18px; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.14); }
        .ach-collect-h { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .ach-collect-ic { font-size: 18px; }
        .ach-collect-t { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: ${T.ink}; flex: 1; }
        .ach-collect-n { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; color: ${T.accent}; }
        .ach-collect-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 560px) { .ach-collect-grid { grid-template-columns: repeat(2, 1fr); } }
        .ach-collect-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; border-radius: 14px; padding: 14px 10px; background: ${T.bg}; border: 1.5px dashed #E8E4DC; opacity: 0.75; }
        .ach-collect-card.got { background: linear-gradient(160deg, ${T.accentSoft}, #FFF3EC); border: 1.5px solid ${T.accent}55; opacity: 1; }
        .ach-collect-cardic { font-size: 28px; line-height: 1; }
        .ach-collect-card:not(.got) .ach-collect-cardic { filter: grayscale(1) opacity(0.55); font-size: 22px; }
        .ach-collect-cardnm { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; color: ${T.ink}; }
        .ach-collect-card:not(.got) .ach-collect-cardnm { color: ${T.ink3}; }
        .ach-collect-carddesc { font-family: 'Manrope'; font-size: 10px; color: ${T.ink2}; line-height: 1.3; }

        /* === 👋 ONBOARDING — coach-mark spotlight tur === */
        .tg-root { position: fixed; inset: 0; z-index: 10300; animation: fade-step 0.2s ease-out; }
        .tg-dim { position: absolute; inset: 0; background: rgba(10,8,14,0.6); }
        .tg-hole { position: absolute; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(10,8,14,0.6), 0 0 0 3px #fff, 0 0 26px 5px rgba(255,201,77,0.55); pointer-events: none; transition: top 0.35s cubic-bezier(.4,0,.2,1), left 0.35s cubic-bezier(.4,0,.2,1), width 0.35s cubic-bezier(.4,0,.2,1), height 0.35s cubic-bezier(.4,0,.2,1); }
        .tg-call { position: absolute; z-index: 2; background: ${T.paper}; border-radius: 16px; padding: 14px 16px 12px; box-shadow: 0 22px 54px -16px rgba(0,0,0,0.55); display: flex; flex-direction: column; gap: 8px; animation: tg-pop 0.25s ease-out; transition: top 0.3s cubic-bezier(.4,0,.2,1), left 0.3s cubic-bezier(.4,0,.2,1); }
        @keyframes tg-pop { from { opacity: 0; } }
        .tg-head { display: flex; align-items: center; gap: 8px; }
        .tg-ic { font-size: 20px; line-height: 1; }
        .tg-h { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 15px; color: ${T.ink}; flex: 1; }
        .tg-count { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 700; color: #fff; background: ${T.accent}; border-radius: 99px; padding: 2px 8px; }
        .tg-body { font-family: 'Manrope', sans-serif; font-size: 14px; line-height: 1.5; color: ${T.ink2}; margin: 0; }
        .tg-body b { color: ${T.ink}; }
        .tg-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 2px; }
        .tg-skip { background: none; border: none; color: ${T.ink3}; font-family: 'Manrope', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 6px 2px; }
        .tg-skip:hover { color: ${T.accent}; }
        .tg-navr { display: flex; align-items: center; gap: 8px; }
        .tg-btn { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; border: none; border-radius: 11px; padding: 9px 16px; cursor: pointer; transition: all 0.16s; }
        .tg-btn.go { background: linear-gradient(135deg,${T.accent},#FF8A3D); color: #fff; box-shadow: 0 8px 20px -6px rgba(255,79,40,0.55); }
        .tg-btn.go:hover { transform: translateY(-1px); }
        .tg-btn.ghost { background: ${T.bg}; color: ${T.ink2}; padding: 9px 12px; }
        .tg-btn.ghost:hover { color: ${T.ink}; }

        /* === ⚡ CODESTRIKE wordmark + bolt (brend RANG/tokenlar → Dizayn) === */
        .cs-hero { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: clamp(6px,1vw,11px); text-align: center; width: 100%; }
        .cs-clickable { cursor: pointer; user-select: none; transition: transform .18s cubic-bezier(.2,1,.3,1); outline: none; }
        .cs-clickable:hover { transform: scale(1.04); }
        .cs-clickable:active { transform: scale(.985); }
        .cs-clickable:focus-visible .cs-word { outline: 2px dashed rgba(255,79,40,.6); outline-offset: 12px; border-radius: 10px; }
        .cs-off { opacity: .62; filter: saturate(.55); }
        .cs-boltrow { animation: cs-bolt-bob 2.2s ease-in-out infinite; margin-bottom: 2px; }
        @keyframes cs-bolt-bob { 0%,100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-7px) rotate(6deg); } }
        .cs-word { position: relative; display: inline-block; font-family: 'Manrope', sans-serif; font-weight: 900;
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
        .qz-bolt { filter: drop-shadow(0 8px 18px rgba(255,79,40,0.32)); }
        @media (prefers-reduced-motion: reduce) { .cs-word, .cs-word::before, .cs-chip, .cs-enter, .cs-boltrow { animation: none !important; } .inv-face, .fc-fly, .acu-medal, .acu-rays, .inv-avatar.deal .inv-label, .dd-chip.nudge, .pc-row.lit { animation: none !important; } .pc-row.lit { opacity: 1 !important; transform: none !important; filter: none !important; } }
        @media (max-width: 560px) { .cs-word { font-size: clamp(34px,11vw,58px); } }
      `}</style>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <AchCtx.Provider value={earned}>
          <div className="lesson-root">
            {live.mode === 'choosing' ? (
              <LiveGate live={live} title="1-Modul" />
            ) : (
              <>
                <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
                <LiveBadge live={live} total={TOTAL_SCREENS} />
                <AchToasts toasts={achToasts} onDone={(k) => setAchToasts(t => t.filter(x => x.k !== k))} />
                {onboard && <TourGuide role={onboardRole} onClose={closeOnboard} />}
              </>
            )}
          </div>
        </AchCtx.Provider>
      </LiveGateCtx.Provider>
    </LangContext.Provider>
  );
}
