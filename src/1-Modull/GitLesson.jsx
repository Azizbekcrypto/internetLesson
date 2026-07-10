import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';

// ============================================================
// HTML 1-DARS — PLATFORM STANDARD v15 (Notion: design_system + platform_contract + infrastructure_v1)
// Arxitektura va asosiy dizayn — Notiondan. 17 ekran bizning kontentimiz.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// Eslatma: ekran-spetsifik widget bezaklari page-by-page bosqichida yakuniy sayqal oladi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E1F3FA', link: '#1a56db',
  line: '#E9E6DF', shadowBase: '58, 53, 48'
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
const AchCtx = createContext(null); // 🏅 olingan nishonlar (Set) — Stage hisoblagichi uchun

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
  // Katta PIN AUTO-OCHILMAYDI — faqat «📺 Ko'rsatish» tugmasi ochadi (onboarding turi bilan to'qnashmasin).
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

const LESSON_META = { lessonId: 'git-github-01-v18', lessonTitle: { uz: 'Git va GitHub — kod uchun vaqt mashinasi', ru: 'Git и GitHub — машина времени для кода' } };
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
  { id: 's14b', type: 'challenge',  template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'MCScreen', scored: true,  scope: 'final' },
  { id: 's15b', type: 'stats',      template: 'custom',   scored: false, scope: null },
  { id: 'sflash', type: 'flashcard', template: 'custom',  scored: false, scope: null },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
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

// 🏅 Yuqori paneldagi nishon hisoblagichi — doim ko'rinadi, yangi olinganda pulslaydi, bosilsa ro'yxat chiqadi
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

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768); // mobil: Mentor yig'ilish rejimi
  const collapseOn = isNarrow && !mentorStatic; // ba'zi sahifalarda Mentor yig'ilmaydi
  const padH = isMobile ? 12 : 60; // InternetLesson layout standarti: 1100px + 60px
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
          <div data-tour="progress" className="progress-track"><div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }} /></div>
          <div className="chrome">
            <div className="chrome-left eyebrow"><span className="dot" /><span>{eyebrow}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* AUDIOSIZ: ovoz tugmasi (AudioIndicator) ko'rsatilmaydi — ovoz allaqachon o'chirilgan */}
              <AchCounter />
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
// RECAPS — har scored test uchun «Qayta tushuntirish» kartalari (kalit = ekran indeksi, Q_LABELS bilan bir xil)
const RECAPS = {
  // idx 4 — s4: «Git asosan nima qiladi?» (nazariya: Git = checkpoint / versiya nazorati)
  4: {
    title: 'Git — kod uchun vaqt mashinasi', cards: [
      { ic: '🎮', h: 'Git — kod uchun checkpoint',
        body: <>Kompyuter o'yinida qiyin joyga yetganda <b>checkpoint</b> (saqlash nuqtasi) qo'yasiz. O'lib qolsangiz — boshidan emas, o'sha nuqtadan davom etasiz. <b>Git</b> kodingiz uchun aynan shunday ishlaydi.</>,
        vis: <RcFlow items={['🎮 O\'yin', '🚩 Checkpoint', '↩️ Qaytish']} />,
        ask: "Qaysi o'yinlarda checkpoint bo'ladi?" },
      { ic: '🕐', h: 'Har holatni eslab qoladi',
        body: <>Git — <b>versiya nazorati</b> tizimi: u kodning <b>har bir holatini</b> eslab qoladi. Xato qilsangiz, eski holatga bemalol qaytasiz — hech narsa yo'qolmaydi.</>,
        vis: <RcFlow items={["Kod o'zgardi", 'Git eslab qoldi', 'Orqaga qaytish']} /> },
      { ic: '☝️', h: 'Git nima QILMAYDI',
        body: <>Git kodni <b>ranglamaydi</b> (bu — CSS ishi), internetni tezlashtirmaydi va rasm tahrirlamaydi. Uning bitta vazifasi bor: kod <b>versiyalarini saqlash</b> va orqaga qaytarish.</>,
        vis: <RcFlow items={['Versiyani saqlaydi', 'Orqaga qaytaradi']} sep="·" />,
        ask: "Git kodni saqlaydi — yana nima qiladi?" },
    ]
  },
  // idx 6 — s5b: «commit nima deb ataladi?» (nazariya: commit = surat, add → commit)
  6: {
    title: 'commit — kodning surati', cards: [
      { ic: '📸', h: 'commit — kodning surati',
        body: <>Har bir saqlash — <b className="mono">commit</b>. Bu kodingizning o'sha lahzadagi <b>surati</b> (xuddi fotosurat), qisqa <b>izoh</b> bilan: nima o'zgardi.</>,
        vis: <RcFlow items={['Kod', '📸 commit', 'Izoh']} /> },
      { ic: '🛒', h: 'Avval add, keyin commit',
        body: <>commit ikki qadamda bo'ladi: <b className="mono">git add</b> — qaysi fayllarni saqlashni tanlaysiz (xuddi savatga solganday), keyin <b className="mono">git commit</b> — ularni izoh bilan saqlaysiz.</>,
        vis: <RcFlow items={['git add', 'git commit']} /> },
      { ic: '🕐', h: 'Har commit — alohida nuqta',
        body: <>Har commit'ning <b>izohi</b>, <b>vaqti</b> va maxsus raqami (<b className="mono">hash</b>) bo'ladi. Shu tufayli istalgan eski commit'ni topib, o'sha holatga qaytishingiz mumkin.</>,
        ask: "commit izohiga nima yozgan bo'lardingiz?" },
    ]
  },
  // idx 10 — s9: «git push nima qiladi?» (nazariya: tarix, GitHub bulut, push/pull)
  10: {
    title: 'push — bulutga yuborish', cards: [
      { ic: '💻', h: 'Kod ikki joyda yashaydi',
        body: <>Kodingiz ikki joyda turadi: <b>kompyuteringizda</b> (lokal) va <b>bulutda</b> (GitHub). Maqsad — ikkalasini bir xil holatda tutish.</>,
        vis: <RcFlow items={['💻 Lokal', '☁️ GitHub']} sep="·" /> },
      { ic: '⬆️', h: 'push — sizdan bulutga',
        body: <><b className="mono">git push</b> — kompyuteringizdagi yangi <b>commit'larni</b> GitHub'ga (bulutga) yuboradi. Endi kod bulutda ham xavfsiz turadi.</>,
        vis: <RcFlow items={['💻 commit', '⬆️ push', '☁️ GitHub']} /> },
      { ic: '⬇️', h: 'pull — bulutdan sizga',
        body: <><b className="mono">git pull</b> — buning teskarisi: bulutdagi yangi commit'larni <b>kompyuteringizga</b> oladi. Do'stingiz o'zgarish qo'shsa, pull bilan olasiz.</>,
        vis: <RcFlow items={['☁️ GitHub', '⬇️ pull', '💻 Lokal']} />,
        ask: "push va pull — qaysi biri bulutga yuboradi?" },
    ]
  },
  // idx 13 — s12: «GitHub nima uchun kerak?» (nazariya: GitHub bulut, repo, jamoa)
  13: {
    title: 'GitHub — bulutdagi uy', cards: [
      { ic: '☁️', h: "GitHub — kodning bulutdagi uyi",
        body: <>Git kompyuteringizda ishlaydi. Kompyuter buzilsa-chi? <b>GitHub</b> — kodning <b>bulutdagi nusxasi</b>: internetda xavfsiz saqlanadi va istalgan joydan ochiladi.</>,
        vis: <RcFlow items={['💻 Git', '☁️ GitHub']} sep="·" /> },
      { ic: '👥', h: 'Birga ishlash uchun',
        body: <>GitHub'ning eng kuchli tomoni — <b>jamoa bilan ishlash</b>. Boshqaning loyihasini <b className="mono">clone</b> qilib nusxalaysiz, o'zgartirasiz va push qilasiz. Millionlab dasturchi shunday birga ishlaydi.</>,
        vis: <RcFlow items={['clone', "o'zgartir", 'push']} /> },
      { ic: '📦', h: 'Repo — bitta loyiha uyi',
        body: <><b>Repository</b> (qisqacha <b>repo</b>) — Git kuzatadigan loyiha papkasi. Ichida barcha fayllar, commit tarixi va <b className="mono">README</b> (loyiha tavsifi) — hammasi birga turadi.</>,
        ask: "Birinchi rep'ingiz nima haqida bo'lardi?" },
    ]
  },
  // idx 17 — s15 (yozma, yakuniy): «commit buyrug'ini o'zingiz yozing» (nazariya: to'liq aylana + commit shakli)
  17: {
    title: "To'liq aylana va commit buyrug'i", cards: [
      { ic: '🔄', h: 'Git ish-oqimi — bitta aylana',
        body: <>Har o'zgarishdan keyin bir xil aylana takrorlanadi: <b className="mono">add</b> (tanlash) → <b className="mono">commit</b> (surat qilish) → <b className="mono">push</b> (bulutga yuborish). Tartib muhim!</>,
        vis: <RcFlow items={['add', 'commit', 'push']} /> },
      { ic: '⌨️', h: "commit buyrug'i — uch qism",
        body: <>To'liq buyruq: <b className="mono">git commit</b> (buyruq) + <b className="mono">-m</b> (izoh bayrog'i) + <b>qo'shtirnoq</b> ichida izoh. Masalan: <b className="mono">git commit -m "birinchi commit"</b>.</>,
        vis: <RcFlow items={['git commit', '-m', '"izoh"']} /> },
      { ic: '⚠️', h: "commit'siz push ishlamaydi",
        body: <>Faqat <b className="mono">add</b> qilib, to'g'ridan push qilsangiz — xato chiqadi. <b>Saqlanmagan</b> narsani yuborib bo'lmaydi. Avval <b className="mono">commit</b> bilan surat oling, keyin push.</>,
        ask: "add'dan keyin, push'dan oldin qaysi qadam kerak?" },
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

// `...` bilan belgilangan kod atamalarini (buyruq, teg) matndan ajratib chip qilib ko'rsatadi.
// Savol, variant va izoh satrlarida ishlatiladi: "`git add` fayllarni tanlaydi" → git add chipda.
const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;

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
              ? fmtCode(`✓ To'g'ri javob: ${String.fromCharCode(65 + correctIdx)} — ${options[correctIdx]}`)
              : waiting
                ? '📨 Javobingiz qabul qilindi'
                : wrongLocked
                  ? fmtCode(`To'g'ri javob: ${String.fromCharCode(65 + correctIdx)} — ${options[correctIdx]}`)
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

// ===== MENTOR (nomsiz ustoz ovozi — intro/izoh shu orqali; audio matni = shu matn) =====
const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png';
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
  const audio = useAudio([{ id: 's0', text: `Loyiha ustida ishlayapsiz. Bir narsani o'zgartirib — saqlaysiz. Yana o'zgartirib — yana saqlaysiz. Tez orada papkangiz to'la bo'ladi: loyiha, loyiha2, loyiha_final, loyiha_oxirgi_ROST... Endi xato qildingiz, lekin uchinchi versiya yaxshiroq edi. Qaysi biriga qaytasiz? Buning aqlli yo'li bormi?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const FILES = ['loyiha.html', 'loyiha2.html', 'loyiha_final.html', 'loyiha_final_ROST.html', 'loyiha_oxirgi(1).html'];
  const [saved, setSaved] = useState(storedAnswer ? FILES.length : 1);
  const OPTS = [
    { id: 'a', label: "Yo'q — har safar yangi nom bilan saqlayverish kerak" },
    { id: 'b', label: 'Ha — maxsus dastur har bir versiyani eslab qoladi' },
    { id: 'c', label: "Eski faylni o'chirib, qaytadan yozish kerak" }
  ];
  const save = () => setSaved(s => Math.min(s + 1, FILES.length));
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext optionalLive disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Xato qildingiz — kodni <span className="italic" style={{ color: T.accent }}>orqaga</span> qaytarib bo'ladimi?</h1>
        <Mentor>Bir narsani o'zgartirib <b style={{ color: T.ink }}>saqlaysiz</b>. Yana — yana saqlaysiz. Tez orada papka to'la: <span className="mono">loyiha_final_ROST.html</span>… Endi 3-versiya yaxshiroq edi. Qaysi biriga qaytasiz? Tugmani bosib, tartibsizlikni ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="flow-label">Papkangiz</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 150 }}>
              {FILES.slice(0, saved).map((f, i) => (
                <div key={i} className="fade-step" style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.paper, borderRadius: 9, padding: '9px 13px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.ink, boxShadow: '0 4px 12px -6px rgba(58,53,48,0.18)' }}>
                  <span>📄</span><span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f}</span>
                  {i === saved - 1 && saved > 1 && <span className="mono small" style={{ color: T.accent, flexShrink: 0 }}>yangi</span>}
                </div>
              ))}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={save} disabled={saved >= FILES.length}>{saved >= FILES.length ? '🤯 Tamom — chalkashlik!' : '💾 Yana saqlash'}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Buning aqlli yo'li bormi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'nalish! Maxsus dastur — <b>Git</b> — har bir o'zgarishni eslab qoladi va istalgan nuqtaga qaytaradi. Xuddi <b>vaqt mashinasi</b> kabi.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Bugun Git va GitHub bilan tanishamiz — bu dasturchining eng muhim quroli. 5 qadamda kodingizni xavfsiz saqlash, istalgan nuqtaga orqaga qaytish va uni bulutga — GitHub'ga yuborishni o'rganamiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Git nima?', tag: 'versiya nazorati' },
    { text: 'commit — saqlangan nuqta', tag: 'snapshot' },
    { text: 'Tarix — vaqt mashinasi', tag: 'orqaga qaytish' },
    { text: 'GitHub — bulutdagi uy', tag: 'github.com' },
    { text: 'push — bulutga yuborish', tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const JOURNEY = [{ ic: '✏️', l: "O'zgartirish" }, { ic: '💾', l: 'commit' }, { ic: '🕐', l: 'Tarix' }, { ic: '☁️', l: 'GitHub' }, { ic: '👥', l: 'Jamoa' }];
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida bilasiz — bu yo'lni</p>
      <Zoomable>
      <div className="jmini fade-up delay-1">
        {JOURNEY.map((j, i) => (<React.Fragment key={i}><div className="jmini-node" style={{ animationDelay: `${i * 0.1}s` }}><span className="jmini-ic">{j.ic}</span><span className="jmini-l">{j.l}</span></div>{i < JOURNEY.length - 1 && <span className="jmini-arr" style={{ animationDelay: `${i * 0.18}s` }}>→</span>}</React.Fragment>))}
      </div>
      </Zoomable>
      <p className="body" style={{ margin: 0, color: T.ink2 }}>…va kodingiz <b style={{ color: T.ink }}>hech qachon</b> yo'qolmaydi.</p>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">5 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Kodingiz uchun <span className="italic" style={{ color: T.accent }}>vaqt mashinasi</span> quramiz</h2><p className="body fade-up delay-1" style={{ margin: '6px 0 0', color: T.ink2, maxWidth: 580 }}><b style={{ color: T.ink }}>«Vaqt mashinasi»</b> — bu istalgan paytda kodning <b style={{ color: T.ink }}>eski holatiga qaytish</b> imkoni. Xato qilsangiz ham, kechagi (yoki bir haftalik) kodga bemalol qaytasiz. Git aynan shuni beradi.</p></div>
        <Mentor>Bugun <b style={{ color: T.ink }}>Git</b> va <b style={{ color: T.ink }}>GitHub</b> bilan tanishamiz — dasturchining eng muhim quroli. <b style={{ color: T.ink }}>5 qadamda</b> kodni saqlash, orqaga qaytish va bulutga yuborishni o'rganamiz.</Mentor>
        {!isNarrow ? (<Split>{PreviewBlock}{StepsBlock}</Split>)
          : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 5 qadamni ko'rish</button></div>)
          : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Yo'lni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — MINORA QURUVCHI (checkpoint-o'yin) =====
// Holat-mashina: blocks (balandlik) · cp (checkpoint-balandlik | null) · photos (📸 tarix)
// crash + qutqarish (cp'dan tiklash) = done. Matn — PLACEHOLDER (Metodist moslaydi).
const S2_HASHES = ['a1b2c3d', 'e4f5a6b', 'c7d8e9f', 'b9a8c7d', 'd2c3b4a'];
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Git — versiya nazorati tizimi. Minora quruvchini tasavvur qiling: blok ustiga blok qo'yasiz. Ba'zan «Checkpoint» bosib, minoraning suratini olasiz — bu commit. Agar bug chiqib minora qulasa, checkpoint bo'lsa — o'sha suratdan tiklanasiz, boshidan emas! Blok qo'ying, checkpoint qo'ying va bug'ni bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [blocks, setBlocks] = useState(storedAnswer ? 3 : 0);
  const [cp, setCp] = useState(storedAnswer ? 3 : null);
  const [photos, setPhotos] = useState(storedAnswer?.photos || []);
  const [anim, setAnim] = useState(null);          // null | 'fall' | 'rewind'
  const [rescued, setRescued] = useState(!!storedAnswer); // kamida bir marta checkpoint-QUTQARISH bo'ldimi
  const [crashed, setCrashed] = useState(false);   // butun minora quladi (checkpointsiz)
  const [celebrate, setCelebrate] = useState(false);
  const done = rescued;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, photos }); }, [done]); // eslint-disable-line
  const putBlock = () => { if (anim) return; setCrashed(false); setBlocks(b => b + 1); };
  const checkpoint = () => {
    if (anim || blocks === 0) return;
    setCp(blocks); setCrashed(false);
    setPhotos(p => [{ n: blocks, hash: S2_HASHES[p.length % S2_HASHES.length] }, ...p]);
  };
  const bug = () => {
    if (anim || blocks === 0) return;
    setAnim('fall'); setCelebrate(false);
    if (cp === null) {
      // Checkpoint yo'q — butun minora qulaydi, boshidan
      setTimeout(() => { setBlocks(0); setCrashed(true); setAnim(null); }, 520);
    } else {
      // Checkpoint bor — cp'dan yuqorisi qulaydi, so'ng cp holatiga tiklanadi
      setTimeout(() => {
        setBlocks(cp); setCrashed(false); setRescued(true); setCelebrate(true);
        setAnim('rewind');
        setTimeout(() => setAnim(null), 520);
        setTimeout(() => setCelebrate(false), 2200);
      }, 520);
    }
  };
  const heights = Array.from({ length: blocks }, (_, i) => i + 1); // 1..blocks
  const twrCls = `twr ${anim === 'fall' ? 'falling' : ''} ${anim === 'rewind' ? 'rewinding' : ''}`;
  return (
    <Stage eyebrow="Git" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Minorangizni qutqaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Git aslida <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></div>
        <Mentor>Git — <b style={{ color: T.ink }}>versiya nazorati</b> tizimi. <b style={{ color: T.ink }}>Minora quruvchi</b>ni tasavvur qiling: blok qo'yasiz, ba'zan <b style={{ color: T.ink }}>Checkpoint</b> bosib suratga olasiz (commit). Bug chiqsa — checkpoint bo'lsa o'sha suratdan tiklanasiz, boshidan emas!</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="flow-label">Minora</div>
            <div className="twr-wrap fade-up delay-2">
              <div className={twrCls}>
                {heights.length === 0
                  ? <span className="twr-empty">{crashed ? '💥 Minora quladi — boshidan' : "Blok qo'ying — minora o'sadi"}</span>
                  : heights.map(h => (
                      // --fi = qulash navbat indeksi (0 = eng tepa, birinchi qulaydi; pastdagilar kattaroq = keyinroq)
                      <div key={h} className={`twr-block ${h === cp ? 'flag' : ''}`} style={{ '--fi': blocks - h }}>
                        {h === cp && <span className="twr-flag">🚩</span>}
                      </div>
                    ))}
              </div>
              <div className="twr-h"><b>{blocks}</b>-qavat{cp !== null && <span style={{ color: T.success, fontWeight: 700 }}> · 🚩 {cp}-qavatda checkpoint</span>}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={putBlock} disabled={!!anim}>▶ Blok qo'yish</button>
              <button className="btn-soft" onClick={checkpoint} disabled={!!anim || blocks === 0}>💾 Checkpoint (commit)</button>
              <button className="btn-soft" onClick={bug} disabled={!!anim || blocks === 0}>💥 Bug!</button>
            </div>
          </div>
          <div className="col">
            {done ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Checkpoint sizni qutqardi</p><p className="body" style={{ margin: 0, color: T.ink }}>Bug minorani qulatdi, lekin faqat <b>saqlanmagan</b> bloklar yo'qoldi — qolgani <b>🚩 checkpoint</b> suratida xavfsiz. Git ham xuddi shunday: har <b>commit</b> — vaqt mashinasidagi qaytish nuqtasi.</p></div>
            ) : crashed ? (
              <div className="frame-soft fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>💥 Hech nima saqlanmagan edi</p><p className="body" style={{ margin: 0, color: T.ink }}>Voy! Butun minora quladi va butun mehnatingiz yo'qoldi — hech qayerda surat yo'q edi. Xafa bo'lmang: keyingi safar avval <b>💾 Checkpoint</b> qo'ying, keyin bemalol tajriba qiling.</p></div>
            ) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Bir necha blok qo'ying, <b>Checkpoint</b> bosing, keyin <b>Bug!</b>ni bosib ko'ring — minorangizni qutqaring.</p></div>)}
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Git</b> — kodning har bir holatini surat qilib saqlaydi. Checkpoint = <span className="mono">commit</span>.</p></div>
            {photos.length > 0 && (
              <div className="col" style={{ gap: 8 }}>
                <div className="flow-label">📸 Suratlar</div>
                {photos.map((p, i) => (
                  <div key={i} className="gcommit">
                    <span className="gcommit-dot">📸</span>
                    <span className="gcommit-body"><span className="gcommit-msg">{p.n}-qavat saqlandi</span><span className="gcommit-meta">commit {p.hash} · hozir</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </Zoomable>
      </div>
      {celebrate && <Confetti />}
    </Stage>
  );
};
// ===== SCREEN 3 — COMMIT (snapshot) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Git kodni qanday saqlaydi? Har bir saqlash — commit deyiladi. commit — bu kodingizning o'sha lahzadagi surati, xuddi fotosurat kabi. Unga qisqa izoh yozasiz: nima o'zgardi. Rangni o'zgartirib, surat oling — commit qiling.`, trigger: 'on_mount', waits_for: null }]);
  const COLORS = [{ n: 'qora', c: '#0E0E10' }, { n: "ko'k", c: '#019ACB' }, { n: 'qizil', c: '#FF4F28' }, { n: 'yashil', c: '#1F7A4D' }];
  const HASHES = ['a1b2c3d', 'e4f5a6b', 'c7d8e9f', 'b9a8c7d'];
  const [ci, setCi] = useState(0);
  const [commits, setCommits] = useState(storedAnswer?.commits || []);
  const done = commits.length > 0;
  const change = () => setCi(i => (i + 1) % COLORS.length);
  const commit = () => {
    const col = COLORS[ci];
    const next = [{ msg: `Sarlavha rangi: ${col.n}`, hash: HASHES[commits.length % HASHES.length], c: col.c }, ...commits];
    setCommits(next);
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, commits: next });
  };
  return (
    <Stage eyebrow="commit" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Surat oling (commit)"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Git o'zgarishni qanday <span className="italic" style={{ color: T.accent }}>eslab qoladi</span>?</h2></div>
        <Mentor>Git'da har bir saqlash — <b style={{ color: T.ink }}>commit</b>. Bu kodingizning o'sha lahzadagi <b style={{ color: T.ink }}>surati</b> 📸, qisqa izoh bilan. Rangni o'zgartirib, surat oling.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="flow-label">Kodingiz</div>
            <pre className="code-box fade-up delay-2" style={{ minHeight: 50 }}><Tg>{'<h1 '}</Tg><At>style</At>=<Sr>{`"color:${COLORS[ci].c}"`}</Sr><Tg>{'>'}</Tg>Salom<Tg>{'</h1>'}</Tg></pre>
            <Preview title="index.html" minH={64}><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3vw,28px)', color: COLORS[ci].c, margin: 0 }}>Salom</h1></Preview>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={change}>🎨 Rangini o'zgartirish</button>
              <button className="btn" onClick={commit}>📸 commit qilish</button>
            </div>
          </div>
          <div className="col">
            <div className="flow-label">commit tarixi</div>
            {commits.length === 0 ? (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali surat yo'q — "commit qilish"ni bosing</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {commits.map((c, i) => (
                  <div key={i} className="gcommit">
                    <span className="gcommit-dot">📸</span>
                    <span className="gcommit-body"><span className="gcommit-msg">{c.msg}</span><span className="gcommit-meta">commit {c.hash} · hozir</span></span>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: c.c, flexShrink: 0, alignSelf: 'center' }} />
                  </div>
                ))}
              </div>
            )}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har commit — alohida surat: <b>izoh</b> + <b>vaqt</b> + maxsus raqam (<span className="mono">hash</span>). Tarix saqlanib qoladi.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST (Git nima qiladi) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Git dasturchiga asosan nima beradi — uning asosiy vazifasi nima?"
    questionText="Git asosan nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Git asosan <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Versiyalarni saqlab, orqaga qaytaradi', 'Kodni chiroyli ranglarga bo\'yaydi', 'Internet tezligini oshirib beradi', 'Rasm va suratlarni tahrirlab beradi']} correctIdx={0}
    explainCorrect="To'g'ri! Git — versiya nazorati: u kodning har bir versiyasini (commit) saqlaydi va istalgan nuqtaga qaytaradi."
    explainWrong={{ 1: 'Ranglash — CSS ishi. Git esa kod versiyalarini saqlaydi.', 2: "Internet tezligi Git bilan bog'liq emas. Git versiyalarni boshqaradi.", 3: 'Rasm tahrirlash — Git vazifasi emas. U kod tarixini saqlaydi.', default: 'Git kod versiyalarini saqlaydi va orqaga qaytaradi.' }} />
);

// ===== SCREEN 5 — COMMIT JARAYONI (add -> commit) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `commit ikki qadamda bo'ladi. Avval git add — qaysi fayllarni saqlashni tanlaysiz, xuddi savatga solganday. Keyin git commit — ularni izoh bilan saqlaysiz. Tugmalarni bosib, faylni o'zgartirgandan saqlangangacha bo'lgan yo'lni ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [stage, setStage] = useState(storedAnswer ? 2 : 0);
  const done = stage >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const STATUS = [{ ic: '🔴', l: "o'zgartirildi", cls: 'gst-mod' }, { ic: '🟢', l: 'tayyorlandi (staged)', cls: 'gst-staged' }, { ic: '✅', l: 'saqlandi (committed)', cls: 'gst-done' }];
  const cur = STATUS[stage];
  const add = () => { if (stage === 0) setStage(1); };
  const commit = () => { if (stage === 1) setStage(2); };
  return (
    <Stage eyebrow="commit jarayoni" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Saqlang (add → commit)"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saqlashdan oldin <span className="italic" style={{ color: T.accent }}>nima bo'ladi</span>?</h2></div>
        <Mentor>Avval <span className="mono">git add</span> — qaysi fayllarni saqlashni tanlaysiz (xuddi savatga solganday). Keyin <span className="mono">git commit</span> — ularni <b style={{ color: T.ink }}>izoh bilan</b> saqlaysiz. Tugmalarni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="flow-label">Fayl holati</div>
            <div className="gfile fade-up delay-2"><span style={{ fontSize: 18 }}>📄</span><span className="gfile-name">index.html</span><span className={`gfile-status ${cur.cls}`}>{cur.ic} {cur.l}</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={add} disabled={stage !== 0}>📥 git add</button>
              <button className="btn" onClick={commit} disabled={stage !== 1}>💾 git commit</button>
            </div>
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>add</b> → fayllarni tanlash. <b>commit</b> → izoh bilan saqlash. Ikkisi birga.</p></div>
          </div>
          <div className="col">
            <div className="flow-label">Terminal</div>
            <div className="term fade-up delay-2">
              <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">{stage >= 1 ? 'git add index.html' : '_'}</span></span>
              {stage >= 2 && <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git commit -m "yangi o'zgarish"</span></span>}
              {stage >= 2 && <span className="term-row"><span className="term-ok">[main a1b2c3d] yangi o'zgarish</span></span>}
              {stage >= 2 && <span className="term-row"><span className="term-out"> 1 fayl o'zgardi</span></span>}
            </div>
            {done && (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>add</b> faylni tanladi, <b>commit</b> uni izoh bilan saqladi. Checkpoint tayyor!</p></div>)}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST (commit nima) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Kodning bir holatini izoh bilan saqlagan nuqta — bu nima deb ataladi?"
    questionText="Kodning izoh bilan saqlangan nuqtasi nima deb ataladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kodning izoh bilan saqlangan <span className="italic" style={{ color: T.accent }}>nuqtasi (surati)</span> nima deb ataladi?</h2></>}
    options={['Brauzer', 'Parol', 'commit', 'Domen']} correctIdx={2}
    explainCorrect="To'g'ri! commit — kodning o'sha lahzadagi saqlangan nuqtasi (surati), izoh bilan birga."
    explainWrong={{ 0: 'Brauzer — saytni ochadigan dastur. Saqlangan nuqta — commit.', 1: "Parol — maxfiy so'z. Kod surati — commit.", 3: 'Domen — sayt manzili. Kodning saqlangan nuqtasi — commit.', default: 'Kodning saqlangan surati — commit.' }} />
);
// ===== SCREEN 6 — TARIX (vaqt mashinasi) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Endi eng kuchli qism boshlanadi. Har commit tarixda saqlanadi. Istalgan eski commit'ni tanlasangiz, kodingiz aynan o'sha holatga qaytadi — xuddi vaqt mashinasi. Tarixdagi commit'larni bosib, kod qanday o'zgarishini ko'ring.`, trigger: 'on_mount', waits_for: { type: 'time_travel' } }]);
  const HISTORY = [
    { hash: 'c7d8e9f', msg: "Tugma qo'shildi", code: ['<h1>Salom</h1>', '<p>Mening saytim</p>', '<button>Obuna</button>'] },
    { hash: 'e4f5a6b', msg: "Paragraf qo'shildi", code: ['<h1>Salom</h1>', '<p>Mening saytim</p>'] },
    { hash: 'a1b2c3d', msg: "Boshlang'ich sarlavha", code: ['<h1>Salom</h1>'] }
  ];
  const [sel, setSel] = useState(0);
  const [traveled, setTraveled] = useState(!!storedAnswer);
  const done = traveled;
  const pick = (i) => { setSel(i); if (i !== 0 && !traveled) { setTraveled(true); audio.triggerEvent('time_travel'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); } };
  const cur = HISTORY[sel];
  return (
    <Stage eyebrow="Tarix" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Eski commit'ga qayting"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir hafta oldingi kodga <span className="italic" style={{ color: T.accent }}>qaytib bo'ladimi</span>?</h2></div>
        <Mentor>Har commit tarixda saqlanadi. Istalgan <b style={{ color: T.ink }}>eski commit</b>'ni tanlasangiz, kod aynan o'sha holatga qaytadi — xuddi <b style={{ color: T.ink }}>vaqt mashinasi</b>. Eski commit'ni bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="flow-label">commit tarixi (yangidan eskiga)</div>
            <div className="gtl fade-up delay-2">
              {HISTORY.map((h, i) => (
                <div key={h.hash} className={`gtl-node ${sel === i ? 'on' : ''}`} onClick={() => pick(i)}>
                  <div className="gtl-rail"><span className="gtl-dot" />{i < HISTORY.length - 1 && <span className="gtl-line" />}</div>
                  <div className="gtl-card"><div className="gtl-msg">{h.msg}{i === 0 && <span style={{ color: T.accent, fontWeight: 700 }}> · hozir</span>}</div><div className="gtl-hash">commit {h.hash}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">{sel === 0 ? 'Hozirgi kod' : `Kod o'sha paytda · ${cur.hash}`}</div>
            <pre className="code-box gcode-rewind" key={cur.hash} style={{ minHeight: 90 }}>{cur.code.join('\n')}</pre>
            {done && sel !== 0 && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kod <b>{cur.hash}</b> holatiga qaytdi! Hech narsa yo'qolmadi — istalgan paytga sayohat qilsangiz bo'ladi.</p></div>}
            {done && sel === 0 && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yana <b>hozirgi</b> holatga qaytdingiz. Git hammasini eslab turadi.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — GITHUB (bulutdagi uy) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Git kompyuteringizda ishlaydi — bu sizning shaxsiy kundaligingiz. Lekin kompyuter buzilsa-chi? Yoki kodni do'stingizga ko'rsatmoqchi bo'lsangiz? Shu yerda GitHub keladi — bu bulutdagi uy. Kodingiz internetda xavfsiz saqlanadi, istalgan joydan ochiladi va boshqalar bilan ulashasiz. Tugmani bosib, loyihani GitHub'ga joylang.`, trigger: 'on_mount', waits_for: null }]);
  const [uploaded, setUploaded] = useState(!!storedAnswer);
  const done = uploaded;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const BEN = [{ ic: '🛡️', t: 'Zaxira — kompyuter buzilsa ham kod saqlanadi' }, { ic: '🌍', t: 'Istalgan joydan — uydan, maktabdan ochiladi' }, { ic: '👥', t: "Ulashish — do'stlar bilan birga ishlaysiz" }, { ic: '💼', t: "Portfolio — ishlaringiz ko'rinadi" }];
  return (
    <Stage eyebrow="GitHub" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "GitHub'ga joylang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kompyuter buzilsa, kod <span className="italic" style={{ color: T.accent }}>yo'qoladimi</span>?</h2></div>
        <Mentor>Git faqat <b style={{ color: T.ink }}>kompyuteringizda</b> ishlaydi. Lekin kompyuter buzilsa yoki yo'qolsa — kod ham ketadimi? Yo'q! <b style={{ color: T.ink }}>GitHub</b> bor — kodning <b style={{ color: T.ink }}>bulutdagi nusxasi</b>. Tugmani bosib, loyihani bulutga joylang.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="cs fade-up delay-2">
              <div className="cs-node"><span className="cs-ic">💻</span><span className="cs-l">Git<br />(kompyuteringiz)</span></div>
              <div className="cs-wire"><div className={`cs-msg cs-req ${uploaded ? 'on' : ''}`}>⬆️ push</div>{uploaded && <span className="cs-fly cs-fly-r">📦</span>}</div>
              <div className={`cs-node ${uploaded ? 'cs-active' : ''}`}><span className="cs-ic">☁️</span><span className="cs-l">GitHub<br />(bulut)</span></div>
            </div>
            {!uploaded ? <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setUploaded(true)}>☁️ GitHub'ga joylash</button>
              : <p className="mono small fade-step" style={{ color: T.success, margin: 0, fontWeight: 600 }}>✓ github.com/siz/loyiha</p>}
          </div>
          <div className="col">
            <div className="flow-label">GitHub nima beradi</div>
            {uploaded ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="fade-step">
                {BEN.map((b, i) => (<div key={i} className="gfile" style={{ fontFamily: "'Manrope', sans-serif" }}><span style={{ fontSize: 18 }}>{b.ic}</span><span className="gfile-name" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13.5 }}>{b.t}</span></div>))}
              </div>
            ) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Chapdagi tugmani bosing — kod kompyuterdan bulutga (GitHub) ko'chadi.</p></div>)}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — PUSH & PULL =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: "Kodingiz ikki joyda — kompyuteringizda va bulutda. push sizdagi commit'larni bulutga yuboradi, pull bulutdagilarni sizga oladi. Bu yerda erkin sinab ko'ring: yangi commit qo'shib push qiling, do'stingiz commit qo'shsa pull qiling. Istagancha qayta-qayta bosib ko'ring.", trigger: 'on_mount', waits_for: null }]);
  const [local, setLocal] = useState(2);
  const [cloud, setCloud] = useState(storedAnswer ? 2 : 1);
  const [anim, setAnim] = useState(null);
  const [didPush, setDidPush] = useState(!!storedAnswer);
  const [didPull, setDidPull] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = didPush && didPull;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const newCommit = () => { if (anim) return; setLocal(n => n + 1); };
  const friendCommit = () => { if (anim) return; setCloud(n => n + 1); };
  const push = () => { if (anim || local <= cloud) return; const target = local; setAnim('push'); timer.current = setTimeout(() => { setCloud(target); setAnim(null); setDidPush(true); }, 750); };
  const pull = () => { if (anim || cloud <= local) return; const target = cloud; setAnim('pull'); timer.current = setTimeout(() => { setLocal(target); setAnim(null); setDidPull(true); }, 750); };
  return (
    <Stage eyebrow="push & pull" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "push va pull'ni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kodni bulut bilan qanday <span className="italic" style={{ color: T.accent }}>almashasiz</span>?</h2></div>
        <Mentor>Kodingiz ikki joyda: kompyuter va bulut. <b style={{ color: T.ink }}>push</b> — sizdagini bulutga yuboradi, <b style={{ color: T.ink }}>pull</b> — bulutdagini sizga oladi. Erkin sinang: commit qo'shib push qiling, do'st commit qo'shsa pull qiling — qayta-qayta.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="cs fade-up delay-2">
              <div className={`cs-node ${local >= cloud ? 'cs-active' : ''}`}><span className="cs-ic">💻</span><span className="cs-l">Lokal<br /><b>{local} commit</b></span></div>
              <div className="cs-wire">
                <div className={`cs-msg cs-req ${anim === 'push' ? 'on' : ''}`}>⬆️ push</div>
                <div className={`cs-msg cs-res ${anim === 'pull' ? 'on' : ''}`}>⬇️ pull</div>
                {anim === 'push' && <span className="cs-fly cs-fly-r">📦</span>}
                {anim === 'pull' && <span className="cs-fly cs-fly-l">📦</span>}
              </div>
              <div className={`cs-node ${cloud >= local ? 'cs-active' : ''}`}><span className="cs-ic">☁️</span><span className="cs-l">GitHub<br /><b>{cloud} commit</b></span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={push} disabled={anim !== null || local <= cloud}>⬆️ git push</button>
              <button className="btn" onClick={pull} disabled={anim !== null || cloud <= local}>⬇️ git pull</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={newCommit} disabled={anim !== null}>✏️ Yangi commit</button>
              <button className="btn-soft" onClick={friendCommit} disabled={anim !== null}>👤 Do'st commit qo'shdi</button>
            </div>
          </div>
          <div className="col">
            {anim === 'push' ? (<div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>⬆️ commit'lar bulutga yuborilmoqda…</p></div>)
              : anim === 'pull' ? (<div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>⬇️ commit'lar bulutdan olinmoqda…</p></div>)
                : local > cloud ? (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Lokalda <b>{local - cloud}</b> ta yangi commit bor. <b>push</b> bilan bulutga yuboring.</p></div>)
                  : cloud > local ? (<div className="frame-soft"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>👤 Do'stdan yangilik</p><p className="body" style={{ margin: 0, color: T.ink }}>Bulutda <b>{cloud - local}</b> ta yangi commit bor. <b>pull</b> bilan o'zingizga oling.</p></div>)
                    : (<div className="frame-success"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Sinxron</p><p className="body" style={{ margin: 0, color: T.ink }}>Lokal va bulut bir xil! "Yangi commit" yoki "Do'st commit" qo'shib, yana push/pull qiling.</p></div>)}
            <div style={{ display: 'flex', gap: 16, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: didPush ? T.success : T.ink3 }}>{didPush ? '✓' : '○'} push sinaldi</span>
              <span style={{ color: didPull ? T.success : T.ink3 }}>{didPull ? '✓' : '○'} pull sinaldi</span>
            </div>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};
// ===== SCREEN 9 — TEST (push) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="git push buyrug'i nima qiladi — u kodni qayerga jo'natadi?"
    questionText="git push buyrug'i nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>git push</span> buyrug'i nima qiladi?</h2></>}
    options={["Barcha kodni butunlay o'chiradi", "Lokal commit'larni bulutga yuboradi", "Sahifaga yangi ranglar qo'shadi", 'Internet tezligini oshirib beradi']} correctIdx={1}
    explainCorrect="To'g'ri! push — lokal kompyuteringizdagi commit'larni GitHub'ga (bulutga) yuboradi."
    explainWrong={{ 0: "push o'chirmaydi — aksincha, commit'laringizni bulutga yuboradi.", 2: "Rang — CSS ishi. push esa commit'larni bulutga yuboradi.", 3: "Internet tezligi push bilan bog'liq emas. U commit'larni yuboradi.", default: "push — lokal commit'larni GitHub'ga yuboradi." }} />
);

// ===== SCREEN 10 — REPOSITORY =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: "Kodingiz qayerda yashaydi? Repository'da — qisqacha repo. Repo — bu Git kuzatadigan loyiha papkasi. Ichida barcha fayllar, commit tarixi va README bor. GitHub'dagi repo qismlarini bosib o'rganing.", trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    name: { label: 'Repo nomi', body: "Repository — Git kuzatadigan loyiha papkasi. Har repo'ning manzili bor: github.com/siz/loyiha." },
    files: { label: 'Fayllar', body: "Loyihaning barcha fayllari shu yerda: index.html, style.css va boshqalar." },
    readme: { label: 'README.md', body: "README — loyiha tavsifi. Repo'ni ochgan har kim avval shuni o'qiydi: bu qanday loyiha." },
    commits: { label: 'commit tarixi', body: "Repo barcha commit'larni saqlaydi — butun tarix shu yerda, vaqt mashinasi." }
  };
  const KEYS = Object.keys(PARTS);
  const [seen, setSeen] = useState(storedAnswer?.seen || []);
  const [active, setActive] = useState(storedAnswer ? 'name' : null);
  const done = seen.length >= KEYS.length;
  const click = (k) => { setActive(k); setSeen(s => { const ns = s.includes(k) ? s : [...s, k]; if (ns.length >= KEYS.length && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, seen: ns }); return ns; }); };
  return (
    <Stage eyebrow="Repository" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : `Qismlarni oching (${seen.length}/${KEYS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihaning hamma narsasi <span className="italic" style={{ color: T.accent }}>qayerda turadi</span>?</h2></div>
        <Mentor>Loyihangizning fayllari, commit tarixi va tavsifi — hammasi qayerda? <b style={{ color: T.ink }}>Repository</b>'da (qisqacha <b style={{ color: T.ink }}>repo</b>) — Git kuzatadigan loyiha papkasi. GitHub'dagi repo qismlarini bosib o'rganing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="repo fade-up delay-2">
              <div className="repo-top">📦 <b>mening-saytim</b> <span style={{ marginLeft: 'auto', color: T.ink3, fontSize: 11 }}>Public</span></div>
              <div className={`repo-row ${active === 'name' ? 'on' : ''} ${seen.includes('name') ? 'seen' : ''}`} onClick={() => click('name')}>🔗 github.com/siz/mening-saytim</div>
              <div className={`repo-row ${active === 'files' ? 'on' : ''} ${seen.includes('files') ? 'seen' : ''}`} onClick={() => click('files')}>📄 index.html · style.css</div>
              <div className={`repo-row ${active === 'readme' ? 'on' : ''} ${seen.includes('readme') ? 'seen' : ''}`} onClick={() => click('readme')}>📝 README.md</div>
              <div className={`repo-row ${active === 'commits' ? 'on' : ''} ${seen.includes('commits') ? 'seen' : ''}`} onClick={() => click('commits')}>🕐 5 commit</div>
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Qism haqida</div>
            {active ? (
              <div className="sk-info" key={active}><div className="sk-tagbig" style={{ marginBottom: 8 }}><span className="sk-wordbadge">{PARTS[active].label}</span></div><p className="body" style={{ margin: 0, color: T.ink }}>{PARTS[active].body}</p></div>
            ) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Repo qismini bosing — izoh chiqadi</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Repo — bitta loyiha uchun bitta uy: fayllar + tarix + tavsif, hammasi birga.</p></div>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — CLONE & JAMOA =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: "GitHub'ning eng kuchli tomoni — birga ishlash. Boshqaning ochiq loyihasini ko'rdingizmi? clone qilib, butun repo'ni kompyuteringizga nusxalaysiz. Keyin o'zgartirib, push qilasiz. Shunday qilib millionlab dasturchilar bitta loyihada birga ishlaydi. Clone tugmasini bosib ko'ring.", trigger: 'on_mount', waits_for: null }]);
  const [cloned, setCloned] = useState(!!storedAnswer);
  const done = cloned;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Jamoa" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Clone qiling"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Boshqaning loyihasini qanday <span className="italic" style={{ color: T.accent }}>olasiz</span>?</h2></div>
        <Mentor>GitHub'ning eng kuchli tomoni — <b style={{ color: T.ink }}>birga ishlash</b>. Boshqaning loyihasini <b style={{ color: T.ink }}>clone</b> qilib, butun repo'ni kompyuteringizga nusxalaysiz. Keyin o'zgartirib, push qilasiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            <div className="cs fade-up delay-2">
              <div className="cs-node cs-active"><span className="cs-ic">☁️</span><span className="cs-l">GitHub repo<br />(jamoaniki)</span></div>
              <div className="cs-wire"><div className={`cs-msg cs-res ${cloned ? 'on' : ''}`}>⬇️ clone</div>{cloned && <span className="cs-fly cs-fly-r">📦</span>}</div>
              <div className={`cs-node ${cloned ? 'cs-active' : ''}`}><span className="cs-ic">💻</span><span className="cs-l">Sizning<br />kompyuter</span></div>
            </div>
            {!cloned ? <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setCloned(true)}>⬇️ git clone</button>
              : <div className="term fade-step"><span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git clone github.com/jamoa/loyiha</span></span><span className="term-row"><span className="term-ok">✓ Nusxalandi — barcha fayl va tarix</span></span></div>}
          </div>
          <div className="col">
            {done ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Repo nusxalandi</p><p className="body" style={{ margin: 0, color: T.ink }}>Endi butun loyiha sizda — barcha fayl va commit tarixi bilan. O'zgartirib, <b>push</b> qilsangiz, jamoa sizning hissangizni ko'radi.</p></div>
            ) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}><b>clone</b> — bulutdagi butun repo'ni kompyuteringizga ko'chiradi.</p></div>)}
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Millionlab dasturchilar shunday ishlaydi: <b>clone</b> → o'zgartir → <b>push</b>. Bitta loyiha — ko'p odam.</p></div>
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};
// ===== SCREEN 12 — TEST (GitHub nima uchun) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="GitHub asosan nima uchun kerak — uning ikki asosiy foydasi nima?"
    questionText="GitHub asosan nima uchun kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>GitHub asosan <span className="italic" style={{ color: T.accent }}>nima uchun</span> kerak?</h2></>}
    options={["Faqat onlayn o'yin o'ynash uchun", "Internet tezligini oshirish uchun", "Rasmlarni chiroyli tahrirlash uchun", "Bulutda saqlash va birga ishlash uchun"]} correctIdx={3}
    explainCorrect="To'g'ri! GitHub — kodni bulutda xavfsiz saqlaydi va boshqalar bilan birga ishlash imkonini beradi."
    explainWrong={{ 0: "GitHub o'yin platformasi emas. U kodni saqlaydi va jamoa ishini birlashtiradi.", 1: "Internet tezligi GitHub bilan bog'liq emas. U kodni bulutda saqlaydi.", 2: "Rasm tahrirlash — Photoshop ishi. GitHub kod va loyihalar uchun.", default: "GitHub — kodni bulutda saqlash va birga ishlash uchun." }} />
);

// ===== SCREEN 13 — WORKFLOW SIMULATOR =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: "Endi o'zingiz to'liq aylanani bajaring. Faylni o'zgartirdingiz. Endi uchta buyruqni tartib bilan bosing: git add fayllarni tanlaydi, git commit saqlaydi, git push GitHub'ga yuboradi. Tartib muhim!", trigger: 'on_mount', waits_for: null }]);
  const CMDS = [
    { cmd: 'git add .', out: "O'zgarishlar tanlandi (staged)", ic: '📥', l: 'add' },
    { cmd: 'git commit -m "yangi sahifa"', out: '[main a1b2c3d] yangi sahifa', ic: '💾', l: 'commit' },
    { cmd: 'git push', out: "GitHub'ga yuborildi ✓", ic: '⬆️', l: 'push' }
  ];
  const NODES = [{ ic: '✏️', l: "O'zgartirish" }, ...CMDS.map(c => ({ ic: c.ic, l: c.l }))];
  const [step, setStep] = useState(storedAnswer ? CMDS.length : 0);
  const done = step >= CMDS.length;
  const run = (i) => { if (i !== step) return; const ns = step + 1; setStep(ns); if (ns >= CMDS.length && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); };
  return (
    <Stage eyebrow="Amaliyot · workflow" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Aylanani bajaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq aylana — <span className="italic" style={{ color: T.accent }}>o'zingiz bajaring</span></h2></div>
        <Mentor>Faylni o'zgartirdingiz. Endi uchta buyruqni <b style={{ color: T.ink }}>tartib bilan</b> bosing: <span className="mono">add</span> → <span className="mono">commit</span> → <span className="mono">push</span>. Tartib muhim!</Mentor>
        <div className="frame frame-col fade-up delay-2">
          <div className="pz-flow">{NODES.map((s, i) => (<React.Fragment key={i}><div className={`pz-step ${i === 0 || step >= i ? 'on' : ''} ${i > 0 && step + 1 === i ? 'active' : ''}`}><span className="pz-ic">{i === 0 ? '✏️' : (step >= i ? '✓' : s.ic)}</span><span className="pz-lbl">{s.l}</span></div>{i < NODES.length - 1 && <span className={`pz-arrow ${step >= i ? 'on' : ''}`}>→</span>}</React.Fragment>))}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {CMDS.map((c, i) => (<button key={i} className={`chip ${step === i ? 'chip-on' : ''}`} disabled={step !== i} onClick={() => run(i)}>{c.ic} git {c.l}</button>))}
          </div>
        </div>
        <div className="term fade-up delay-2" style={{ minHeight: 70 }}>
          {step === 0 ? <span className="term-row"><span className="term-out">{'// Buyruqlarni tartib bilan bosing…'}</span></span>
            : CMDS.slice(0, step).map((c, i) => (<React.Fragment key={i}><span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">{c.cmd}</span></span><span className="term-row"><span className="term-ok">{c.out}</span></span></React.Fragment>))}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq aylana: <b>o'zgartir → add → commit → push</b>. Kodingiz endi GitHub'da, xavfsiz!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (push ishlamadi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: "AI sizga buyruqlar berdi, lekin push ishlamadi. Nega? Diqqat bilan qarang: git add bor, git push bor, lekin orasida git commit yo'q! Saqlanmagan narsani yuborib bo'lmaydi. Avval ishga tushiring, keyin yetishmagan qadamni qo'shing.", trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [stage, setStage] = useState(storedAnswer ? 'fixed' : 'idle'); // idle -> failed -> fixed
  const done = stage === 'fixed';
  const fail = () => { if (stage !== 'idle') return; setStage('failed'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff("Mana muammo: git add dan keyin to'g'ridan-to'g'ri push. Orasida git commit yo'q — saqlanmagan o'zgarishni yuborib bo'lmaydi."); }, 300); };
  const fix = () => { setStage('fixed'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff("Tuzatildi! Endi git commit bor — o'zgarish saqlandi va push ishladi."); }, 300); };
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : (stage === 'failed' ? "Endi tuzating" : "Ishga tushiring")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">push ishlamadi — <span className="italic" style={{ color: T.accent }}>nega</span>?</h2></div>
        <Mentor>AI buyruqlar berdi, lekin push ishlamadi. Diqqat bilan qarang: <span className="mono">add</span> bor, <span className="mono">push</span> bor, lekin orasida <b style={{ color: T.ink }}>commit yo'q</b>! Ishga tushiring, keyin tuzating.</Mentor>
        <div className="split">
          <div className="col">
            <div className="term fade-up delay-2" style={{ minHeight: 100 }}>
              <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git add .</span></span>
              {stage === 'fixed' && <span className="term-row fade-step"><span className="term-prompt">$ </span><span className="term-cmd">git commit -m "yangi"</span></span>}
              {stage === 'fixed' && <span className="term-row"><span className="term-ok">[main a1b2c3d] yangi</span></span>}
              <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git push</span></span>
              {stage === 'failed' && <span className="term-row fade-step"><span className="term-err">✗ Xato: nothing to commit — saqlanmagan</span></span>}
              {stage === 'fixed' && <span className="term-row"><span className="term-ok">✓ GitHub'ga yuborildi</span></span>}
            </div>
            {stage === 'idle' && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={fail}>▶ Buyruqlarni bajarish</button>}
            {stage === 'failed' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 git commit qo'shib tuzatish</button>}
            {stage === 'fixed' && <p className="mono small" style={{ color: T.success, margin: 0, fontWeight: 600 }}>✓ add → commit → push — to'g'ri!</p>}
          </div>
          <div className="col">
            {stage === 'idle' && (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Buyruqlarni o'qing. "Bajarish"ni bosib, nima bo'lishini ko'ring.</p></div>)}
            {stage === 'failed' && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>❌ commit tushib qolgan</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">add</span> fayllarni tanladi, lekin <b>commit</b> qilinmadi — saqlangan narsa yo'q. push yuboradigan narsani topolmadi. Chap tomondagi tugma bilan tuzating →</p></div>)}
            {stage === 'fixed' && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Yetishmagan qadamni topdingiz!</p><p className="ta-sub">add → commit → push: har biri kerak, tartib bilan</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 15 — YAKUNIY (yozma) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: "Oxirgi qadam: o'zingiz commit buyrug'ini yozing. Uch qism kerak: git commit, so'ng -m bayrog'i, so'ng qo'shtirnoq ichida izoh. Pastdagi namunaga qarab yozing.", trigger: 'on_mount', waits_for: null }]);
  const [val, setVal] = useState(storedAnswer?.picked || '');
  const norm = val.trim();
  const hasCmd = /git\s+commit/i.test(norm);
  const hasM = /-m\b/.test(norm);
  const afterM = hasM ? norm.split(/-m/i).slice(1).join('-m') : '';
  const qmatch = afterM.match(/["'‘’“”]\s*([^"'‘’“”]+?)\s*["'‘’“”]/);
  const hasMsg = hasM && !!qmatch;
  const valid = hasCmd && hasM && hasMsg;
  const solvedRef = useRef(!!storedAnswer);
  useEffect(() => {
    if (valid && !solvedRef.current) {
      solvedRef.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, correct: true, firstAttemptCorrect: true, picked: val });
      const e = getAudioEngine();
      if (e && !audio.muted) setTimeout(() => { if (!audio.muted) e.pushOneOff("Zo'r! git commit, -m va izoh — uchchalasini to'liq yozdingiz."); }, 200);
    }
    // eslint-disable-next-line
  }, [valid]);
  const CHECKS = [{ ok: hasCmd, l: '1. git commit' }, { ok: hasM, l: `2. -m bayrog'i` }, { ok: hasMsg, l: `3. "izoh" qo'shtirnoqda` }];
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!valid} label={valid ? "Davom etish" : "To'liq buyruqni yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'zingiz <span className="italic" style={{ color: T.accent }}>commit</span> yozing</h2></div>
        <Mentor>Uch qism kerak: <span className="mono">git commit</span> + <span className="mono">-m</span> + qo'shtirnoq ichida <b style={{ color: T.ink }}>izoh</b>. Namuna: <span className="mono">{`git commit -m "birinchi commit"`}</span>.</Mentor>
        <div className="split">
          <div className="col">
            <input className="text-input" style={valid ? { boxShadow: `0 8px 22px -6px rgba(31,122,77,0.4), 0 0 0 2px ${T.success}` } : undefined} value={val} placeholder={`git commit -m "..."`} onChange={e => setVal(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {CHECKS.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'Manrope', sans-serif", fontSize: 14, color: c.ok ? T.success : T.ink3, fontWeight: c.ok ? 600 : 500 }}><span style={{ width: 20, height: 20, borderRadius: '50%', background: c.ok ? T.success : 'transparent', boxShadow: c.ok ? 'none' : `inset 0 0 0 2px ${T.ink3}`, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{c.ok ? '✓' : ''}</span>{c.l}</div>))}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Natija</div>
            {valid ? (
              <div className="term fade-step"><span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">{norm}</span></span><span className="term-row"><span className="term-ok">[main a1b2c3d] saqlandi ✓</span></span></div>
            ) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'liq buyruqni yozing — natija shu yerda chiqadi</p></div>)}
            {valid && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'liq commit buyrug'ini o'zingiz yozdingiz! Endi haqiqiy loyihada ishlata olasiz.</p></div>}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// 🧲 Qayta ishlatiladigan DRAG&DROP TARTIB — bo'laklarni to'g'ri ketma-ketlikda joylash.
// Boshqa darsga: faqat `items` ({ id, label }), `hints`, `onSolved` almashtiriladi.
// YAGONA holat (pool+slots birga) — StrictMode'da dublikat bo'lmaydi (S7 saboq).
function DragDropOrder({ items, hints, onSolved }) {
  const order = items.map(x => x.id);
  const byId = useMemo(() => Object.fromEntries(items.map(x => [x.id, x])), [items]);
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
            {sid ? <button className="dd-chip in" onPointerDown={(e) => down(e, sid, i)}>{byId[sid].label}</button> : <span className="dd-hint">{hints ? hints[i] : 'bu yerga joylang'}</span>}
          </div>
        ))}
      </div>
      <div className="dd-pool">
        {pool.length === 0 && !solved && <span className="dd-pool-empty">Tartib xato — bo'lakni bosib qaytaring va qayta joylang</span>}
        {pool.map(id => <button key={id} className="dd-chip" onPointerDown={(e) => down(e, id, 'pool')}>{byId[id].label}</button>)}
      </div>
      {solved && <div className="dd-done">✓ To'g'ri! Git ish-oqimi aynan shu tartibda.</div>}
      {wrong && !solved && <div className="dd-wrong">⚠️ Tartib xato — qayta joylang.</div>}
    </div>
  );
}

// 🃏 Qayta ishlatiladigan FLASHCARDS — aktiv takrorlash (3D flip + o'z-o'zini baholash).
// Boshqa darsga: faqat `cards` ({ front, back, note }) almashtiriladi.
const GIT_FLASHCARDS = [
  { front: 'Kod uchun vaqt mashinasi', back: 'Git', note: 'versiya nazorati' },
  { front: 'Kodning saqlangan surati', back: 'commit', note: 'izoh bilan nuqta' },
  { front: 'Loyiha papkasi (kod uyi)', back: 'repository', note: 'qisqa: repo' },
  { front: 'Kodning bulutdagi uyi', back: 'GitHub', note: 'onlayn platforma' },
  { front: 'O\'zgarishni saqlashga tanlash', back: 'git add', note: 'staged' },
  { front: 'Suratni saqlash buyrug\'i', back: 'git commit', note: '-m "izoh"' },
  { front: 'Lokaldan bulutga yuborish', back: 'git push', note: 'yuqoriga' },
  { front: 'Bulutdan lokalga olish', back: 'git pull', note: 'pastga' },
  { front: 'Repo nusxasini olib kelish', back: 'git clone', note: 'birga ishlash' },
  { front: 'commitdagi qisqa izoh bayrog\'i', back: '-m', note: 'message' },
  { front: 'Repo holatini ko\'rish', back: 'git status', note: 'nima o\'zgardi' },
  { front: 'Commitlar tarixini ko\'rish', back: 'git log', note: 'barcha suratlar' },
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
    <div className="fc-done fade-up"><span className="fc-done-emoji">🎉</span><p className="fc-done-h">Hammasini bilasiz!</p><p className="fc-done-s">{total}/{total} atama yodlandi</p><button className="fc-btn ghost" onClick={restart}>↻ Qaytadan takrorlash</button></div>
  );
  return (
    <div className="fc fade-up">
      <div className="fc-top"><span className="fc-pill learn" key={`l-${queue.length}-${swapRef.current}`}>↻ O'rganilmoqda · <b>{queue.length}</b></span><span className="fc-pill knew" key={`k-${known}`}>✓ Bildim · <b>{known}</b></span></div>
      <div className="fc-bar"><span className="fc-bar-fill" style={{ width: `${(known / total) * 100}%` }} /></div>
      <div className="fc-cardwrap">
        <div className={`fc-fly ${exiting === 'knew' ? 'out-knew' : ''} ${exiting === 'again' ? 'out-again' : ''}`} key={swapRef.current}>
        <div className={`fc-card ${flipped ? 'flip' : ''}`} onClick={() => !flipped && !exiting && setFlipped(true)} role="button" tabIndex={0}>
          <div className="fc-face fc-front"><span className="fc-q">{card.front}</span><span className="fc-cue">Qaysi atama? 🤔 <span className="fc-tap">bosing</span></span></div>
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

// ⚡ CodeStrike chaqmoq mascot (brend belgisi)
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

// ===== 🏅 ACHIEVEMENTS (nishonlar) — dars davomidagi real bosqichlar uchun =====
const ACHIEVEMENTS = {
  timetravel: { icon: '🔍', name: 'Nice Catch!', desc: "Yetishmagan git-qadamni topib tuzatdingiz" },
  quizace:    { icon: '🎯', name: 'Bullseye!',      desc: "Test savoliga birinchi urinishda to'g'ri javob berdingiz" },
  gitflow:    { icon: '🔀', name: 'Flow Master!',   desc: "Git ish-oqimini to'g'ri tartibladingiz" },
  graduate:   { icon: '🏆', name: 'Level Up!',      desc: "Git va GitHub darsini to'liq yakunladingiz" },
};
// Ekran id → nishon (recordAnswer'da avtomatik beriladi) — FAQAT ma'noli ekranga (haqiqiy challenge/scored):
// s14 = debug challenge (yetishmagan qadamni topib TUZATGANDA correct:true otadi) · s9 = scored test · s14b = DragDrop gate g'alabasi
const ACH_TRIGGERS = { s14: 'timetravel', s9: 'quizace', s14b: 'gitflow' };
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
// Navbatda bittasi ko'rsatiladi (to'liq-ekran bayram) — tugagach keyingisi chiqadi
function AchToasts({ toasts, onDone }) {
  const t = toasts[0];
  const a = t && ACHIEVEMENTS[t.id];
  if (!a) return null;
  return <AchCelebrate key={t.k} ach={a} onDone={() => onDone(t.k)} />;
}

// ===== 👋 ONBOARDING — coach-mark turi: har qadamda haqiqiy tugmaga spotlight + so'z (rolga qarab, bir marta) =====
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

// ===== SCREEN 14b — GIT ISH-OQIMI GATE (DragDrop tartiblash) =====
// Bo'laklarni to'g'ri ketma-ketlikda joylash — «o'zim qildim» gate (S8 saboq: passiv→aktiv).
const GIT_FLOW_PIECES = [
  { id: 'edit',   label: '✏️ Faylni o\'zgartir' },
  { id: 'add',    label: 'git add' },
  { id: 'commit', label: 'git commit' },
  { id: 'push',   label: 'git push' },
  { id: 'github', label: '🌐 GitHub\'da ko\'rinadi' },
];
const ScreenGitFlow = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14b', text: "Endi butun aylanani o'zingiz tartiblang. Fayl o'zgardi, keyin git add tanlaydi, git commit surat qilib saqlaydi, git push GitHub'ga yuboradi — va u yerda ko'rinadi. Bo'laklarni to'g'ri tartibda joylang.", trigger: 'on_mount', waits_for: null }]);
  const [done, setDone] = useState(!!storedAnswer);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]); // eslint-disable-line
  return (
    <Stage eyebrow="Amaliyot · tartib" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? "Davom etish" : "Bosqichlarni tartiblang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Git ish-oqimini <span className="italic" style={{ color: T.accent }}>o'zingiz tartiblang</span></h2></div>
        <Mentor>Butun aylanani eslang: <b style={{ color: T.ink }}>o'zgartir → add → commit → push → GitHub</b>. Bo'laklarni to'g'ri tartibda joylang — sudrab yoki bosib.</Mentor>
        <div className="sk-buildbox">
          <DragDropOrder items={GIT_FLOW_PIECES} hints={["ish shu qadamdan boshlanadi", "o'zgarishni saqlashga tanlash", "surat qilib saqlash", "bulutga yuborish", "natijada bulutda ko'rinadi"]} onSolved={() => setDone(true)} />
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN FLASHCARDS — teglarni tez takrorlash (podiumdan keyin) =====
const ScreenFlashcards = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 'sflash', text: "Darsni yakunlashdan oldin bugun o'rgangan Git atamalarini tez takrorlaymiz. Har kartada bir vazifa — qaysi atama yoki buyruq ekanini o'ylang, keyin kartani bosib tekshiring.", trigger: 'on_mount', waits_for: null }]);
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []); // eslint-disable-line
  return (
    <Stage eyebrow="Takrorlash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={false} label="Yakunlash →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Atamalarni <span className="italic" style={{ color: T.accent }}>tez takrorlaymiz</span>.</h2></div>
        <Mentor>Bugun o'rgangan Git atama va buyruqlarini takrorlaymiz. Har kartada bir vazifa — <b style={{ color: T.ink }}>qaysi atama</b> ekanini o'ylang, keyin kartani bosib tekshiring. <b style={{ color: T.ink }}>Bildim</b> yoki <b style={{ color: T.ink }}>Takrorlash</b> bilan baholang.</Mentor>
        <div className="fc-center"><Flashcards cards={GIT_FLASHCARDS} /></div>
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
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz! Endi Git va GitHub sirini bilasiz: Git — kod uchun vaqt mashinasi, commit — saqlangan surat, tarix orqali istalgan nuqtaga qaytasiz, GitHub — kodning bulutdagi uyi va jamoa maydoni. push bilan yuborasiz, clone bilan birga ishlaysiz. Endi o'zingizning birinchi repongizni ochishga tayyorsiz!", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Git — kod uchun vaqt mashinasi', 'commit — kodning saqlangan surati', 'Tarix — istalgan nuqtaga qaytish', 'GitHub — kodning bulutdagi uyi', 'push / pull — bulut bilan aloqa', 'clone — jamoa bilan birga ishlash'];
  const HOMEWORK = [{ b: "Ro'yxatdan o'ting", t: '— github.com da bepul account oching' }, { b: 'Repo yarating', t: '— birinchi repository: mening-saytim' }, { b: 'commit qiling', t: "— fayl qo'shib, izoh bilan saqlang" }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Git va GitHub darsi tugadi</span><h2 className="title h-title fade-up d1">Git va GitHub <span className="italic" style={{ color: T.accent }}>sirini</span> ochdingiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi kodingizni Git bilan boshqarib, GitHub'ga joylaysiz." : "Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
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
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🔎 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Bilimingizni amalda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">GitHub'da birinchi repongizni yaratib, do'stlaringizga ulashing!</p></div>
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
// Podium yorliqlari (scored indeks -> qisqa nom)
const Q_LABELS = { 4: "Git nima qiladi", 6: "commit nima", 10: "git push", 13: "GitHub nega kerak", 17: "commit buyrug'i yozish (yakuniy)" };

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
const INLINE_KEYS = { s4: 0, s5b: 2, s9: 1, s12: 3, s15: -1 };

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

// ===== ⚡ CODESTRIKE (CoddyCamp jonli test arenasi — Git mavzusi) =====
const QUIZ_MS = 15000;
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#FF5A2C', '#0FA6D6', '#F5A623', '#22A05C']; // CodeStrike brend palitrasi: coral · ocean · sun · leaf
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
// Arena foni: suzuvchi Git tokenlari (checkpoint/vaqt mashinasi hissi)
const QZ_BG_SHAPES = [
  { ch: 'commit',  l: 6,  t: 18, s: 30, c: 'rgba(20,17,14,0.06)',   d: 19, dl: 0 },
  { ch: 'git add', l: 82, t: 12, s: 24, c: 'rgba(20,17,14,0.05)',   d: 23, dl: 1.5 },
  { ch: 'push',    l: 9,  t: 74, s: 30, c: 'rgba(255,79,40,0.09)',  d: 27, dl: 0.8 },
  { ch: '💾',      l: 78, t: 70, s: 34, c: 'rgba(20,17,14,0.5)',    d: 21, dl: 2.2 },
  { ch: 'main',    l: 46, t: 86, s: 28, c: 'rgba(34,160,92,0.11)',  d: 25, dl: 1.1 },
  { ch: '📸',      l: 66, t: 24, s: 30, c: 'rgba(20,17,14,0.5)',    d: 17, dl: 0.4 },
  { ch: '.git',    l: 24, t: 36, s: 26, c: 'rgba(15,166,214,0.10)', d: 20, dl: 1.9 },
  { ch: '🕰️',     l: 92, t: 46, s: 30, c: 'rgba(20,17,14,0.5)',    d: 24, dl: 1.3 },
  { ch: 'commit',  l: 2,  t: 46, s: 24, c: 'rgba(20,17,14,0.05)',   d: 26, dl: 2.6 },
];
const QUIZ_BANK = [
  { q: "Git asosan nima ish bajaradi?", opts: ["Kod versiyalarini saqlab, orqaga qaytaradi", "Kodni chiroyli ranglarga bo'yaydi", "Internet tezligini oshiradi", "Rasm va suratlarni tahrirlaydi"], correct: 0 },
  { q: "Kodning izoh bilan saqlangan nuqtasi nima deb ataladi?", opts: ["Brauzer", "commit", "Parol", "Domen"], correct: 1 },
  { q: "git push buyrug'i nima qiladi?", opts: ["Barcha kodni butunlay o'chiradi", "Sahifaga yangi rang qo'shadi", "Lokal commit'larni bulutga yuboradi", "Faylni printerda chop etadi"], correct: 2 },
  { q: "GitHub asosan nima uchun kerak?", opts: ["Onlayn o'yinlar o'ynash uchun", "Musiqa va video tinglash uchun", "Rasmlarni chiroyli tahrirlash", "Kodni bulutda saqlash va birga ishlash"], correct: 3 },
  { q: "Git qanday tizim deb ataladi?", opts: ["Versiya nazorati tizimi", "Operatsion tizim (OS)", "Antivirus dasturi", "Internet brauzeri"], correct: 0 },
  { q: "commit'da -m bayrog'i nima uchun?", opts: ["Faylni o'chirish", "Izoh (xabar) yozish", "Rang berish", "Internetga ulanish"], correct: 1 },
  { q: "To'g'ri commit buyrug'i qaysi?", opts: ["git save 'matn'", "commit push now", "git commit -m \"matn\"", "git upload -m matn"], correct: 2 },
  { q: "Eski holatga qaytmoqchisiz. Nima yordam beradi?", opts: ["Brauzer sahifasini yangilash", "Kompyuterni qayta o'chirish", "Butunlay yangi fayl yaratish", "Git tarixidagi oldingi commit"], correct: 3 },
  { q: "Loyihaning GitHub'dagi joyi nima deb ataladi?", opts: ["Repository (repozitoriy)", "Oddiy fayllar papkasi", "Maxfiy kirish paroli", "Sayt domen manzili"], correct: 0 },
  { q: "Nega loyiha_final_ROST.html kabi ko'p nusxa yomon?", opts: ["Kompyuter tez ishlaydi", "Chalkashlik ko'payadi", "Internet tejaladi", "Kod chiroyli bo'ladi"], correct: 1 },
  { q: "push qilgandan keyin commit'lar qayerda bo'ladi?", opts: ["Faqat mening kompyuterimda", "O'chib ketadi", "GitHub'da (bulutda) ham", "Qog'ozda"], correct: 2 },
  { q: "O'yinda commit nimaga to'g'ri keladi?", opts: ["Yangi o'yin sotib olish", "O'yindan butunlay chiqish", "O'yin ovozini balandlatish", "Checkpoint (saqlash nuqtasi)"], correct: 3 },
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

// 🎆 Arena jonli qatlami — canvas: suzuvchi uchqunlar + "web" chiziqlari + git tokenlari.
// reduced-motion: umuman ishlamaydi (matchMedia). L1 QzFX bilan bir xil, TOK git-mavzudan.
function QzFX() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = cv.getContext('2d'); const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, raf = 0;
    const size = () => { W = cv.width = Math.max(1, cv.offsetWidth * DPR); H = cv.height = Math.max(1, cv.offsetHeight * DPR); };
    size(); window.addEventListener('resize', size);
    const TOK = ['commit', 'push', 'git add', '💾', '📸', 'main', '.git'];
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

export default function GitLesson({ lang: langProp, onFinished }) {
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
  // jonli o'quvchidan yashirin — sakrab o'tiladi. Mentor «Erkin qilish» qilgach ochiladi.
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
      try { if (localStorage.getItem('gitOnboarded_' + onboardRole)) show = false; } catch {}
      if (show) { const t = setTimeout(() => setOnboard(true), 500); return () => clearTimeout(t); } // sahifa chizilib bo'lsin
    }
  }, [live.mode, onboardRole]);
  const closeOnboard = () => { try { localStorage.setItem('gitOnboarded_' + onboardRole, '1'); } catch {} setOnboard(false); };
  // 🏅 Yakuniy ekranga yetganda: bitiruvchi nishoni
  useEffect(() => {
    if (screen === TOTAL_SCREENS - 1) earn('graduate');
  }, [screen]); // eslint-disable-line

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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, ScreenGitFlow, Screen15, ScreenPodium, ScreenFlashcards, Screen16];
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: calc(90vh / var(--lz, 1)); overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
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

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
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

        .text-input, .prompt-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); font-weight: 500; padding: 11px 13px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: box-shadow 0.2s; }
        .text-input:focus, .prompt-input:focus { box-shadow: 0 10px 22px -6px rgba(255,79,40,0.3), 0 0 0 1px rgba(255,79,40,0.2); }
        .prompt-input { font-family: 'Manrope'; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.55; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
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
        .pz-flow { display: flex; align-items: flex-start; justify-content: center; gap: 4px; overflow-x: auto; padding: 4px 2px 2px; }
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
        .ipbox { align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(16px,2.4vw,20px); color: ${T.blue}; background: #E2F1F7; padding: 10px 16px; border-radius: 10px; }
        .ipbox-sm { font-size: clamp(13px,1.7vw,15px); padding: 5px 10px; }
        .anabox { display: flex; align-items: center; justify-content: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); text-align: center; }
        .ana-name { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; }
        .ana-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; font-size: 12px; flex-shrink: 0; }
        .ana-num { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; }
        .dns-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 10px; }
        .dns-head { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .dns-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .dns-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .cs { position: relative; display: flex; align-items: stretch; gap: 8px; background: ${T.paper}; border-radius: 14px; padding: 16px 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .cs-node { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; padding: 10px; border-radius: 12px; transition: all 0.3s; min-width: 80px; }
        .cs-node.cs-active { background: ${T.accentSoft}; box-shadow: inset 0 0 0 2px ${T.accent}; }
        .cs-node.cs-active .cs-ic { animation: csPop 0.45s cubic-bezier(.34,1.5,.5,1); }
        .cs-ic { font-size: 30px; }
        .cs-l { font-family: 'Manrope'; font-size: 11px; font-weight: 600; color: ${T.ink2}; text-align: center; line-height: 1.2; }
        @keyframes csPop { 0% { transform: scale(1); } 45% { transform: scale(1.28); } 100% { transform: scale(1); } }
        .cs-wire { position: relative; flex: 1; align-self: stretch; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; min-height: 70px; }
        .cs-wire::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 3px; transform: translateY(-50%); border-radius: 2px; background: repeating-linear-gradient(90deg, rgba(167,166,162,0.55) 0 7px, transparent 7px 14px); }
        .cs-msg { position: relative; z-index: 2; font-family: 'JetBrains Mono'; font-size: 11px; padding: 5px 9px; border-radius: 7px; text-align: center; opacity: 0; transform: translateY(5px); transition: all 0.3s; box-shadow: 0 3px 9px -4px rgba(${T.shadowBase},0.3); }
        .cs-req { background: ${T.accentSoft}; color: ${T.accent}; }
        .cs-res { background: ${T.successSoft}; color: ${T.success}; }
        .cs-msg.on { opacity: 1; transform: none; }
        .cs-fly { position: absolute; z-index: 3; top: 50%; margin-top: -14px; width: 28px; height: 28px; border-radius: 8px; background: ${T.paper}; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 5px 14px -3px rgba(${T.shadowBase},0.45), inset 0 0 0 1.5px ${T.accent}; }
        .cs-fly-r { animation: csFlyR 0.72s cubic-bezier(.5,0,.4,1) both; }
        .cs-fly-l { animation: csFlyL 0.72s cubic-bezier(.5,0,.4,1) both; }
        @keyframes csFlyR { 0% { left: 0; opacity: 0; transform: scale(0.5); } 18% { opacity: 1; transform: scale(1); } 82% { opacity: 1; transform: scale(1); } 100% { left: calc(100% - 28px); opacity: 0; transform: scale(0.5); } }
        @keyframes csFlyL { 0% { left: calc(100% - 28px); opacity: 0; transform: scale(0.5); } 18% { opacity: 1; transform: scale(1); } 82% { opacity: 1; transform: scale(1); } 100% { left: 0; opacity: 0; transform: scale(0.5); } }
        .jmini { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; background: ${T.paper}; border-radius: 12px; padding: 14px 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .jmini-node { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .jmini-ic { font-size: 22px; }
        .jmini-l { font-family: 'Manrope'; font-size: 10px; font-weight: 600; color: ${T.ink2}; }
        .jmini-arr { color: ${T.accent}; font-weight: 700; }

        /* ============ GIT/GITHUB DARS CSS ============ */
        /* === 🏗️ MINORA QURUVCHI (Screen2) — sodda vertikal stack (Dizayn sayqallaydi) === */
        .twr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .twr { display: flex; flex-direction: column-reverse; align-items: center; justify-content: flex-start; gap: 4px; width: 100%; min-height: 200px; padding: 12px 10px; border-radius: 12px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px rgba(167,166,162,0.28); }
        .twr-block { position: relative; width: clamp(80px,58%,150px); height: 26px; border-radius: 7px; background: linear-gradient(180deg, #FF8A3D, ${T.accent}); box-shadow: 0 4px 10px -4px rgba(255,79,40,0.5), inset 0 1.5px 0 rgba(255,255,255,0.32); animation: twrPop 0.4s cubic-bezier(.34,1.45,.5,1); will-change: transform; }
        /* blok qo'shilishi — yuqoridan tushib joylashish spring'i (settle bounce bilan) */
        @keyframes twrPop { 0% { transform: translateY(-24px) scale(0.6); opacity: 0; } 55% { transform: translateY(2px) scale(1.09); opacity: 1; } 76% { transform: translateY(-1px) scale(0.97); } 100% { transform: none; opacity: 1; } }
        .twr-block.flag { background: ${T.successSoft}; box-shadow: 0 4px 10px -4px rgba(31,122,77,0.45), inset 0 0 0 2px ${T.success}; }
        .twr-flag { position: absolute; right: -22px; top: 50%; transform: translateY(-50%); font-size: 16px; }
        /* ===== 💥 MINORA QULASHI — darsning eng dramatik lahzasi =====
           1) butun minora beqarorlikdan silkinadi (twrShake), 2) bloklar KETMA-KET qulaydi:
           tepa avval, pastdagilar keyinroq (--fi stagger) — translateY+rotate+opacity bilan. */
        .twr.falling { animation: twrShake 0.42s cubic-bezier(.36,.07,.19,.97); transform-origin: bottom center; }
        @keyframes twrShake { 0%,100% { transform: translateX(0) rotate(0); } 12% { transform: translateX(-6px) rotate(-1deg); } 26% { transform: translateX(6px) rotate(1.2deg); } 40% { transform: translateX(-5px) rotate(-1deg); } 55% { transform: translateX(4px) rotate(.8deg); } 72% { transform: translateX(-2px) rotate(-.4deg); } 86% { transform: translateX(1px); } }
        .twr.falling .twr-block { animation: twrBlockFall 0.36s cubic-bezier(.55,.08,.9,.35) forwards; animation-delay: calc(var(--fi, 0) * 0.05s); will-change: transform, opacity; }
        .twr.falling .twr-block:nth-child(odd) { --fr: -19deg; }
        @keyframes twrBlockFall { 0% { transform: translateY(0) rotate(0); opacity: 1; } 22% { transform: translateY(-5px) rotate(-2deg); opacity: 1; } 100% { transform: translateY(135px) rotate(var(--fr, 17deg)); opacity: 0; } }
        /* ===== ⏪ QUTQARISH — vaqt-mashinasi tiklashi =====
           gRewind (blur+siljish) container'da; tiklangan bloklar yengil "yashil nafas" oladi. */
        .twr.rewinding { animation: gRewind 0.5s ease-out; }
        .twr.rewinding .twr-block { animation: twrBreathe 0.75s ease-out; }
        @keyframes twrBreathe { 0% { box-shadow: 0 4px 10px -4px rgba(31,122,77,0), inset 0 1.5px 0 rgba(255,255,255,0.32); } 45% { box-shadow: 0 0 0 4px rgba(31,122,77,0.22), 0 5px 16px -4px rgba(31,122,77,0.5), inset 0 1.5px 0 rgba(255,255,255,0.4); transform: scale(1.03); } 100% { box-shadow: 0 4px 10px -4px rgba(31,122,77,0), inset 0 1.5px 0 rgba(255,255,255,0.32); transform: none; } }
        /* reduced-motion: dramatik qulash/rewind o'rniga tinch opacity-only variant */
        @media (prefers-reduced-motion: reduce) {
          .twr.falling { animation: none; }
          .twr.falling .twr-block { animation: twrFadeOut 0.3s ease-out forwards; animation-delay: 0; }
          @keyframes twrFadeOut { to { opacity: 0; } }
          .twr.rewinding { animation: none; }
          .twr.rewinding .twr-block { animation: acu-fade 0.35s ease-out; }
        }
        .twr-empty { color: ${T.ink3}; font-style: italic; font-size: 13px; padding: 30px 0; text-align: center; }
        .twr-h { font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.ink2}; }
        .twr-h b { color: ${T.accent}; font-size: 16px; }
        .term { background: ${CODE.bg}; border-radius: 12px; padding: 14px 16px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); display: flex; flex-direction: column; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.6vw,13.5px); line-height: 1.5; overflow-x: auto; }
        .term-row { white-space: pre-wrap; word-break: break-word; }
        .term-prompt { color: ${CODE.str}; } .term-cmd { color: ${CODE.attr}; } .term-out { color: ${CODE.punct}; } .term-err { color: ${CODE.tag}; } .term-ok { color: ${CODE.str}; }
        .gfile { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 11px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); font-family: 'JetBrains Mono', monospace; font-size: 14px; transition: all 0.3s; }
        .gfile-name { color: ${T.ink}; flex: 1; min-width: 0; }
        .gfile-status { font-family: 'Manrope'; font-weight: 700; font-size: 11px; padding: 4px 11px; border-radius: 99px; flex-shrink: 0; }
        .gst-mod { background: ${T.accentSoft}; color: ${T.accent}; } .gst-staged { background: #E2F1F7; color: ${T.blue}; } .gst-done { background: ${T.successSoft}; color: ${T.success}; }
        .gcommit { display: flex; align-items: flex-start; gap: 12px; background: ${T.paper}; border-radius: 11px; padding: 11px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.35s ease-out; }
        .gcommit-dot { width: 32px; height: 32px; border-radius: 50%; background: ${T.accentSoft}; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .gcommit-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .gcommit-msg { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; color: ${T.ink}; }
        .gcommit-meta { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .gtl { display: flex; flex-direction: column; }
        .gtl-node { display: flex; gap: 13px; cursor: pointer; }
        .gtl-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .gtl-dot { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 3px ${T.paper}, 0 0 0 2px ${T.ink3}; background: ${T.ink3}; transition: all 0.25s; margin-top: 5px; }
        .gtl-line { width: 2px; flex: 1; min-height: 20px; background: rgba(167,166,162,0.35); }
        .gtl-node.on .gtl-dot { box-shadow: inset 0 0 0 3px ${T.paper}, 0 0 0 2px ${T.accent}; background: ${T.accent}; }
        .gtl-card { flex: 1; min-width: 0; padding: 9px 13px; border-radius: 10px; background: ${T.paper}; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); margin-bottom: 8px; transition: all 0.2s; }
        .gtl-node.on .gtl-card { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.25); background: ${T.accentSoft}; }
        .gtl-msg { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; }
        .gtl-hash { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .repo { background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); }
        .repo-top { display: flex; align-items: center; gap: 8px; padding: 12px 15px; border-bottom: 1px solid rgba(167,166,162,0.25); font-family: 'JetBrains Mono'; font-size: 13px; color: ${T.ink}; }
        .repo-row { display: flex; align-items: center; gap: 10px; padding: 11px 15px; cursor: pointer; transition: background 0.2s; font-family: 'JetBrains Mono'; font-size: 13px; color: ${T.ink2}; }
        .repo-row:hover { background: ${T.bg}; }
        .repo-row.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 3px 0 0 ${T.accent}; }
        /* tap-hint affordance (L1 bilan bir xil): bosilmagan qatorlar "meni bos" deb pulslaydi; ochilgani ✓ */
        @keyframes tap-hint { 0%, 100% { box-shadow: inset 0 0 0 0 rgba(255,79,40,0); } 50% { box-shadow: inset 0 0 0 2px rgba(255,79,40,0.42); } }
        .repo-row:not(.on):not(.seen) { animation: tap-hint 1.8s ease-in-out infinite; }
        .repo-row.seen:not(.on)::after { content: '✓'; margin-left: auto; color: ${T.success}; font-weight: 800; font-size: 12px; }
        @media (prefers-reduced-motion: reduce) { .repo-row:not(.on):not(.seen) { animation: none; } }
        /* === animatsiya yaxshilashlari (page 2,3,4,8,12) === */
        .jmini-node { animation: jpop 0.45s backwards cubic-bezier(.34,1.5,.5,1); }
        .jmini-arr { animation: jflow 1.8s ease-in-out infinite; }
        @keyframes jpop { from { opacity: 0; transform: scale(0.55); } to { opacity: 1; transform: scale(1); } }
        @keyframes jflow { 0%,100% { opacity: 0.4; transform: translateX(0); } 50% { opacity: 1; transform: translateX(2px); } }
        .gcommit-dot { animation: snapPop 0.5s cubic-bezier(.34,1.5,.5,1); }
        @keyframes snapPop { 0% { transform: scale(0); } 55% { transform: scale(1.3); box-shadow: 0 0 0 6px rgba(255,79,40,0.18); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,79,40,0); } }
        .gtl-node.on .gtl-dot { animation: dotPulse 0.55s cubic-bezier(.34,1.5,.5,1); }
        @keyframes dotPulse { 0% { transform: scale(1); } 50% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .gcode-rewind { animation: gRewind 0.5s ease-out; }
        @keyframes gRewind { 0% { opacity: 0; transform: translateX(-12px); filter: blur(1.5px); } 100% { opacity: 1; transform: none; filter: none; } }


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

        /* ===== ⚡ CODESTRIKE — CTA (dars ichida) ===== */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: linear-gradient(135deg, #FFF3EA, #FFE7DC); border: 1px solid #F3D9CC; border-radius: 20px; padding: clamp(16px,2.4vw,22px) clamp(18px,2.6vw,26px); box-shadow: 0 16px 40px -18px rgba(255,79,40,0.28); }
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
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; animation: qz-drift ease-in-out infinite; will-change: transform; }
        @keyframes qz-drift { 0%,100% { transform: translate(0,0) rotate(-7deg) scale(1); } 50% { transform: translate(22px,-28px) rotate(9deg) scale(1.07); } }
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
        .pod-col.me .pod-name { color: ${T.success}; }
        .pod-my { margin: 0; text-align: center; font-family: 'Manrope'; font-size: 14px; color: ${T.ink2}; }
        .pod-my b { color: ${T.success}; }
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

        /* === 🧲 DRAG&DROP (reusable) === */
        .sk-buildbox { display: flex; flex-direction: column; animation: sk-swapin 0.5s cubic-bezier(.34,1.3,.4,1); }
        @keyframes sk-swapin { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: none; } }
        .dd { display: flex; flex-direction: column; gap: 13px; }
        .dd-slots { display: flex; flex-direction: column; gap: 9px; }
        .dd-slot { display: flex; align-items: center; gap: 12px; min-height: 56px; border-radius: 14px; border: 2px dashed ${T.ink3}66; background: ${T.paper}; padding: 8px 12px; transition: border-color .18s, background .18s; }
        .dd-slot.filled { border-style: solid; border-color: ${T.line}; }
        .dd-slot.ok { border-color: ${T.success}; background: ${T.successSoft}; }
        .dd-slot.bad { border-color: #E24848; background: #FBE9E9; animation: dd-shake .4s; }
        @keyframes dd-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .dd-slotn { width: 26px; height: 26px; border-radius: 8px; background: ${T.bg}; color: ${T.ink3}; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dd-slot.ok .dd-slotn { background: ${T.success}; color: #fff; }
        .dd-hint { color: ${T.ink3}; font-style: italic; font-size: 13px; }
        .dd-pool { display: flex; flex-wrap: wrap; gap: 9px; min-height: 48px; padding: 10px; border-radius: 14px; background: ${T.bg}; }
        .dd-pool-empty { color: ${T.ink3}; font-size: 12.5px; font-style: italic; align-self: center; }
        .dd-chip { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(13px,1.7vw,15px); color: #fff; background: linear-gradient(170deg, #FF8A3D, ${T.accent}); border: none; border-radius: 11px; padding: 11px 15px; cursor: grab; touch-action: none; box-shadow: 0 8px 16px -8px rgba(255,79,40,.6), inset 0 2px 0 rgba(255,255,255,.3); transition: transform .12s; user-select: none; }
        .dd-chip:hover { transform: translateY(-2px); }
        .dd-chip:active { cursor: grabbing; }
        .dd-slots, .dd-pool { position: relative; }
        .dd-pool { z-index: 1; }
        .dd-done { font-weight: 700; color: ${T.success}; font-size: 14.5px; }
        .dd-wrong { font-weight: 700; color: #E24848; font-size: 13.5px; }

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

        /* === 🏅 O'YIN USLUBIDAGI TO'LIQ-EKRAN NISHON BAYRAMI === */
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

        /* ===== ⚡ CODESTRIKE — yorqin wordmark (3D + glint) ===== */
        .cs-cta { flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: clamp(8px,1.2vw,12px); position: relative; padding: clamp(14px,2vw,20px) clamp(16px,2.6vw,28px); background: radial-gradient(130% 130% at 50% 0%, #FFF2EA 0%, #FFE3D3 58%, #FFD4C0 100%); }
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
        .qz-bolt { filter: drop-shadow(0 8px 18px rgba(255,79,40,0.32)); }

        /* kod atamasi chipi — savol/variant/izohlarda oddiy matndan ajralib turadi */
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }
        .qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
      `}</style>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <AchCtx.Provider value={earned}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="1-Modul" />
          ) : (
            <>
              <Current screen={screen} storedAnswer={answers[screen]} answers={answers} achievements={earned} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
              <AchToasts toasts={achToasts} onDone={(k) => setAchToasts(t => t.filter(x => x.k !== k))} />
              <LiveBadge live={live} total={TOTAL_SCREENS} />
              {onboard && <TourGuide role={onboardRole} onClose={closeOnboard} />}
            </>
          )}
        </div>
        </AchCtx.Provider>
      </LiveGateCtx.Provider>
    </LangContext.Provider>
  );
}