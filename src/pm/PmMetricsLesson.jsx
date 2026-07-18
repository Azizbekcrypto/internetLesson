import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
const MENTOR_IMG = 'https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png';

// ============================================================
// PM MODULI (8-MODUL) · 1-DARS — METRIKA NIMA: DAU, RETENTION, NORTH STAR
// Senariy-manba: pm-senariylar/M8-D1-Metrika.md (GATE S tasdiqlangan).
// Mavzu: metrika (mahsulot pulsi); DAU/MAU; retention (qaytish); churn (ketish);
//        North Star (bosh yulduz-ko'rsatkich); K5 Duolingo streak keysi (RAQAMSIZ).
// Artefakt: o'quvchi sinfda North Star nomzodi + 3 metrika-karta chiqaradi (uyda jonli raqam qo'shadi).
// INFRA/PRIMITIV MANBAI: P0 — src/pm/PmUserStoryLesson.jsx (liveRpc/useLiveSession/LiveGate/Stage/
//        NavNext/QuestionScreen/MentorTestStats/RecapOverlay/compiler-qobiq/ScreenPodium/arena/badges/
//        PRACTICE_BASE sentinel) — infra/rels AYNAN ko'chirilgan, kontent yangi (Metrika).
// AUDIOSIZ: ovoz (TTS) yo'q (useAudio stub, QuestionScreen imzosi saqlangan).
// PRIMITIVLAR: hook streak-alanga zanjiri · 4 metrika flip-karta · North Star validator ·
//        metrika-panel ustaxona · MatchPairs juftlash (yangi) · retentionFoiz compiler.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

// ============================================================
// 🎨 PM-STUDIA IDENTITET (PM PLATFORM P0 ETALON — barcha PM darslar shu palitrada)
// «Mahsulot-menejerning ish stoli»: chuqur indigo/binafsha brend + studio-qog'oz fon.
// Rang-qonun: accent(indigo)=brend/e'tibor · success(yashil)=muvaffaqiyat · err(qizil)=FAQAT xato ·
// blue(kok)=KIM slot/info · amber=NIMA slot · yashil=NATIJA slot (formula-semantikasi).
// CODESTRIKE arenasi allaqachon binafsha — bu palitra u bilan bitta oilada.
// ============================================================
const T = {
  bg: '#F2F0FA', ink: '#1B1630', ink2: '#565073', ink3: '#9C97B4',
  paper: '#FFFFFF', accent: '#5B3DE6', accentSoft: '#EBE5FD', accentVivid: '#6E4BFF',
  success: '#12A968', successSoft: '#E4F5EC', blue: '#0E86C4', blueSoft: '#E1F3FB', link: '#5B3DE6',
  line: '#E7E3F4', err: '#E5484D', errSoft: '#FCE7E8',
  shadowBase: '40, 34, 82'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

// ============================================================
// JONLI SESSIYA INFRA — InternetLesson etalon bilan bir xil (liveRpc/useLiveSession/LiveGate)
// ============================================================
const LIVE_SUPABASE_URL = 'https://dwoubexcexzsinogojiu.supabase.co';
const LIVE_SUPABASE_KEY = 'sb_publishable_cijLMhCDDdo6dlXs05thyw__oH-YgKX';
const LIVE_ENABLED = !!(LIVE_SUPABASE_URL && LIVE_SUPABASE_KEY);
const LIVE_POLL_MS = 2500, LIVE_POLL_MAX_MS = 15000, LIVE_HEARTBEAT_MS = 10000, LIVE_STALE_MS = 60000;
const LT = { bg: '#F2F0FA', ink: '#1B1630', ink2: '#565073', ink3: '#9C97B4', paper: '#FFFFFF', accent: '#5B3DE6', accentSoft: '#EBE5FD', success: '#12A968' };
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
  const [quiz, setQuiz] = useState({ state: 'off', q: -1 });
  const [revealScreen, setRevealScreen] = useState(-1);
  const lastSeenRef = useRef(Date.now());
  const lastUpdatedRef = useRef(null);
  const syncQuiz = useCallback((row) => {
    const qs = row?.quiz_state || 'off', qq = row?.quiz_q ?? -1;
    setQuiz(p => (p.state === qs && p.q === qq) ? p : { state: qs, q: qq });
    const rv = row?.reveal_screen ?? -1;
    setRevealScreen(p => p === rv ? p : rv);
  }, []);

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

  const quizControl = useCallback(async (state, q) => {
    if (mode !== 'mentor' || !pin) throw new Error('mentor emas');
    await liveRpc('quiz_control', { p_pin: pin, p_token: tokenRef.current, p_state: state, p_q: q ?? -1 });
    setQuiz({ state, q: q ?? -1 });
  }, [mode, pin]);

  const mentorReveal = useCallback((screenIdx) => {
    if (mode !== 'mentor' || !pin) return;
    setRevealScreen(screenIdx);
    liveRpc('reveal_screen', { p_pin: pin, p_token: tokenRef.current, p_screen: screenIdx }).catch(() => {});
  }, [mode, pin]);

  return { mode, pin, mentorScreen, status, mentorAlive, connected, ended, joinError, busy, startMentor, joinStudent, selfStudy, reportScreen, endSession, submitAnswer, quiz, quizControl, revealScreen, mentorReveal, playerId: playerRef.current?.id || null, nickname: nickRef.current };
}

const _liveBtnPri = { background: LT.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer' };
const _liveBadgeS = { position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 9998, background: LT.paper, border: `1px solid ${LT.ink3}55`, borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: LT.ink2, boxShadow: '0 2px 10px rgba(40,34,82,0.12)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', maxWidth: '92vw' };
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
  const card = { position: 'relative', width: '100%', maxWidth: 420, background: LT.paper, borderRadius: 20, padding: 'clamp(24px,4vw,36px)', boxShadow: '0 10px 40px -12px rgba(40,34,82,0.22)', display: 'flex', flexDirection: 'column', gap: 18 };
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
const AchCtx = createContext(null);
const LiveGateCtx = createContext(null);

const fmtCode = (s) => (typeof s === 'string' && s.includes('`'))
  ? s.split('`').map((p, i) => i % 2 ? <code className="qcode" key={i}>{p}</code> : p)
  : s;

// AUDIOSIZ dars — useAudio/getAudioEngine stub (QuestionScreen imzosi saqlanadi, TTS yo'q)
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

// ============================================================ PM DARS META
const LESSON_META = { lessonId: 'pm-m8d1-v1', lessonTitle: { uz: 'Metrika nima: DAU, retention, North Star', ru: 'Metriki' } };
// EKRAN-TARTIB: testlar teoriyaga biriktirib tarqatildi (s7 qoida'dan keyin idx4 · s8 K5'dan keyin idx6 · s9 ustaxonadan keyin idx9).
const SCREEN_META = [
  { id: 's0',       type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },        // 0 · Duolingo streak ovoz
  { id: 's1',       type: 'rule',        template: 'custom',   scored: false, scope: null },          // 1 · maqsad (North Star + 3 karta)
  { id: 's2',       type: 'exploration', template: 'custom',   scored: false, scope: null },          // 2 · savol + oshxona misoli
  { id: 's3',       type: 'exploration', template: 'custom',   scored: false, scope: null },          // 3 · 4 metrika flip-karta
  { id: 's7',       type: 'test',        template: 'custom',   scored: true,  scope: 'module-mikro' }, // 4 · TEST-1 (DAU · MCQ)
  { id: 's4',       type: 'case',        template: 'custom',   scored: false, scope: null },          // 5 · K5 Duolingo streak keys
  { id: 's8',       type: 'test',        template: 'custom',   scored: true,  scope: 'module-mikro' }, // 6 · TEST-2 (streak→retention · MCQ)
  { id: 's5',       type: 'exploration', template: 'custom',   scored: false, scope: null },          // 7 · o'z North Star nomzodi
  { id: 'practice', type: 'practice',    template: 'custom',   scored: false, scope: null },          // 8 · metrika-panel ustaxona (3 karta)
  { id: 's9',       type: 'test',        template: 'custom',   scored: true,  scope: 'module-mikro' }, // 9 · TEST-3 (juftlash · MatchPairs)
  { id: 's10',      type: 'koding',      template: 'custom',   scored: false, scope: null },          // 10 · koding (retentionFoiz compiler)
  { id: 's11',      type: 'recap',       template: 'custom',   scored: false, scope: null },          // 11
  { id: 's12',      type: 'homework',    template: 'custom',   scored: false, scope: null },          // 12
  { id: 'podium',   type: 'stats',       template: 'custom',   scored: false, scope: null },          // 13
  { id: 's16',      type: 'summary',     template: 'custom',   scored: false, scope: null }           // 14
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

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
  const padH = isMobile ? 12 : 60;
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

// Scored ekranlar (s7/s8 = MCQ · s9 = MatchPairs) javob kaliti — darslik-jonli TASDIQLAYDI.
// correctIdx = haqiqiy to'g'ri variant indeksi (placeCorrect USLUBI YO'Q). s9: 0 = juftlash mukammal.
// T1/T2 correct'lari ATAYIN har xil indeksda (s7=0 · s8=2).
const INLINE_KEYS = { s7: 0, s8: 2, s9: 0, practice: -1 };
// Har scored ekran uchun qayta-tushuntirish (recap) — Metodist sayqallaydi. Kalitlar = YANGI scored ekran indeksi (4/6/9).
const RECAPS = {
  4: {
    title: "DAU — kunlik faol foydalanuvchi",
    cards: [
      { ic: "📅", h: "DAU nimani sanaydi", body: <>DAU (Daily Active Users) — bir kunda mahsulotga <b>kirgan faol odamlar soni</b>. Odam har kuni kirsa, avvalo shu raqam o'sadi.</> },
      { ic: "📊", h: "DAU va MAU farqi", body: <>MAU — <b>oylik</b> faol foydalanuvchi. DAU/MAU nisbati «odamlar qanchalik tez-tez qaytadi»ni ko'rsatadi.</> },
      { ic: "🔀", h: "Churn — aksincha", body: <>Churn (ketish) esa kamayadi: odamlar qaytib kirsa, ketganlar ulushi tushadi — DAU bilan chalkashtirmang.</>, ask: "Ilovaga har kuni odam kirsa — DAU o'sadimi yoki churn?" },
    ]
  },
  6: {
    title: "Streak retention'ni ko'taradi",
    cards: [
      { ic: "🔥", h: "Streak = qaytish mexanikasi", body: <>Duolingo streak — uzluksiz kunlar zanjiri. Zanjir uzilishidan qo'rquv odamni <b>qayta-qayta qaytaradi</b>.</> },
      { ic: "↩️", h: "Retention nimani o'lchaydi", body: <>Retention — kirganlarning <b>qaytish ulushi</b>. Streak birinchi navbatda aynan shu metrikani ko'taradi.</> },
      { ic: "🚫", h: "Yangi oqim emas", body: <>Streak <b>yangi foydalanuvchilar oqimini</b> yoki server tezligini o'zgartirmaydi — u faqat mavjudlarni qaytaradi.</>, ask: "Streak qaysi metrikaga eng kuchli ta'sir qiladi?" },
    ]
  },
  9: {
    title: "Har metrika — o'z savoliga javob",
    cards: [
      { ic: "📅", h: "DAU → kelish", body: <>DAU savoli: <b>«Bugun nechta odam kirdi?»</b> — mahsulotga kelishni sanaydi.</> },
      { ic: "↩️", h: "retention → qaytish · churn → ketish", body: <>Retention: <b>«kelganlarning qanchasi qaytdi?»</b>. Churn: <b>«qanchasi butunlay ketdi?»</b> — ikkisi bir tanganing ikki tomoni.</> },
      { ic: "⭐", h: "North Star → qiymat", body: <>North Star savoli: <b>«mahsulot haqiqiy qiymat beryaptimi?»</b> — bosh yulduz-ko'rsatkich.</>, ask: "«Kelganlarning qanchasi qaytdi?» — bu qaysi metrika?" },
    ]
  }
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
            {level === 'need' && <p className="mstats-verdict-t">⚠️ Faqat <b>{pct}%</b> to'g'ri — bu mavzu sinfga tushunarsiz qolgan. Davom etishdan oldin qisqa takrorlash tavsiya etiladi.</p>}
            {level === 'maybe' && <p className="mstats-verdict-t">🟡 <b>{pct}%</b> to'g'ri — yomon emas. Xohlasangiz, davom etishdan oldin qisqa takrorlab oling.</p>}
            {level === 'good' && <p className="mstats-verdict-t">✅ <b>{pct}%</b> to'g'ri — sinf mavzuni o'zlashtirdi. Bemalol davom eting!</p>}
            {level === 'few' && <p className="mstats-verdict-t">Javob berganlar kam ({answered} ta) — foiz bo'yicha xulosa chiqarish qiyin. O'zingiz baholang.</p>}
            {onOpenRecap && <button className="rc-open soft" onClick={onOpenRecap}>📖 Qayta tushuntirishni ochish</button>}
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

// QuestionScreen — scored test/hotspot mexanikasi (jonli-ball KAFOLATLI: submitAnswer imzosi + Kahoot-reveal).
// Ikki rejim: MCQ (renderMode yo'q) — variant tanlash · hotspot (renderMode='hotspot') — buzuq bo'lakni bosish.
const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, renderMode, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const oneShot = !!(live && live.mode === 'student');
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
  const isHotspot = renderMode === 'hotspot';
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? !mReveal : !solved} label={isMentorLive ? (mReveal ? 'Davom etish' : 'Avval natijani oching') : solved ? 'Davom etish' : (isHotspot ? (oneShot ? 'Buzuq bo\'lakni bosing' : "Buzuq bo'lakni toping") : 'Variantni tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: isMentorLive ? 'flex-start' : 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        {oneShot && !solved && <p className="small mono fade-up" style={{ margin: '-8px 0 0', color: T.accent, fontWeight: 600 }}>⚡ Jonli dars — bitta urinish, o'ylab bosing!</p>}
        <div className={`fade-up delay-1 ${isHotspot ? 'hs-parts' : ''}`} style={{ display: 'flex', flexDirection: isHotspot ? 'row' : 'column', flexWrap: isHotspot ? 'wrap' : 'nowrap', gap: isHotspot ? 10 : 9 }}>
          {options.map((opt, i) => {
            let cls = isHotspot ? 'hs-chip' : 'option';
            if (isMentorLive) {
              if (mReveal) { cls += i === correctIdx ? (isHotspot ? ' hs-broken' : ' option-correct') : (isHotspot ? ' hs-ok' : ' option-wrong'); }
            } else if (solved) {
              if (waiting) { if (i === picked) cls += isHotspot ? ' hs-wait' : ' option-wait'; }
              else { cls += i === correctIdx ? (isHotspot ? ' hs-broken' : ' option-correct') : (isHotspot ? ' hs-ok' : ' option-wrong'); if (wrongLocked && i === picked) cls += isHotspot ? ' hs-miss' : ' option-picked-wrong'; }
            }
            else if (i === picked) cls += isHotspot ? ' hs-miss' : ' option-picked-wrong';
            const showGreenLetter = isMentorLive ? (mReveal && i === correctIdx) : (solved && revealed && i === correctIdx);
            return (
              <button key={i} className={cls} disabled={solved || isMentorLive} onClick={() => pick(i)} style={isHotspot ? undefined : { padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                {!isHotspot && <span className="mono small" style={{ minWidth: 20, color: showGreenLetter ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>}
                <span style={{ flex: 1 }}>{fmtCode(opt)}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={isMentorLive ? mReveal : picked !== null} isCorrect={isMentorLive ? true : (solved && !wrongLocked)} neutral={waiting}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: waiting ? T.blue : (isMentorLive || (solved && !wrongLocked)) ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isMentorLive
              ? <>✓ {isHotspot ? 'Buzuq bo\'lak' : 'To\'g\'ri javob'}: {fmtCode(options[correctIdx])}</>
              : waiting
                ? '📨 Javobingiz qabul qilindi'
                : wrongLocked
                  ? <>{isHotspot ? 'Buzuq bo\'lak' : 'To\'g\'ri javob'}: {fmtCode(options[correctIdx])}</>
                  : solved ? "Topdingiz!" : "Qaytadan ko'ring"}
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

// MentorNote — MENTORGA maydoni: faqat mentor-rejimda. PROYEKTOR-SIR (2026-07-15):
// mentor ekrani katta ekranda ko'rinadi — eslatma DEFAULT YOPIQ xira chip; bir bosishda
// ochiladi, yana bosishda yopiladi; ekran almashganda komponent unmount bo'lib o'zi yopiladi.
const MentorNote = ({ children }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const [open, setOpen] = useState(false);
  if (!live || live.mode !== 'mentor') return null;
  if (!open) return (
    <button type="button" className="mnote-chip" onClick={() => setOpen(true)} title="Mentorga eslatma — bosib oching">📋 Eslatma</button>
  );
  return (
    <div className="mnote fade-up" onClick={() => setOpen(false)} title="Yopish uchun bosing">
      <span className="mnote-lbl">🧑‍🏫 Mentorga eslatma<span className="mnote-x">✕ yopish</span></span>
      <p className="mnote-body">{children}</p>
    </div>
  );
};

// ===== SHARED METRIKA STORAGE — s5 (North Star nomzodi) va ustaxona (panel) BITTA kalitni ishlatadi =====
// s5'dagi North Star ustaxonaga ko'chib keladi; ustaxona 3 metrika-karta qo'shadi (artefakt).
const METRICS_KEY = 'pm-m8d1-metrics';
const readMetrics = () => { try { const o = JSON.parse(localStorage.getItem(METRICS_KEY) || 'null'); return (o && typeof o === 'object') ? o : null; } catch { return null; } };
const writeMetrics = (o) => { try { localStorage.setItem(METRICS_KEY, JSON.stringify(o)); } catch {} };

// ===== PM PRIMITIV: North Star validatori — javobda «raqam» va «chunki…qiymat» bo'laklari bormi =====
// number: matnda raqam yoki o'lchov-so'z bor · reason: «chunki»/«qiymat» bog'lovchisi bor.
const validateNorthStar = (text) => {
  const t = (text || '').trim();
  const hasNumber = /\d/.test(t) || /(soni|ulush|foiz|nechta|raqam|daqiqa|marta|kun)/i.test(t);
  const hasReason = /(chunki|qiymat|foyda|ko'rsat|olayotgan|beradi)/i.test(t) && t.length >= 14;
  return { hasNumber, hasReason, full: hasNumber && hasReason };
};
// ===== PM PRIMITIV: metrika-karta validatori (NOMI + NIMANI o'lchaydi + NEGA muhim) =====
const validateMetricCard = (c) => {
  const has = (s) => (s || '').trim().length >= 2;
  return { nomOk: has(c.nom), whatOk: has(c.what), whyOk: has(c.why), askOk: !!c.ask, full: has(c.nom) && has(c.what) && has(c.why) && !!c.ask };
};
const StoryCheck = ({ ok, label }) => (
  <span className={`stcheck ${ok ? 'on' : ''}`}><span className="stcheck-box">{ok ? '✓' : ''}</span>{label}</span>
);

// ===== SCREEN 0 — HOOK: Duolingo streak ovoz berish (jonli natija — o'sib boradigan alanga zanjiri) =====
const HOOK_OPTS = [
  "Yangi so'zlar qiziqarli",
  "STREAK (kunlar zanjiri) uzilib qolishidan qo'rqish",
  "Eslatma-bildirishnomalar",
  "Do'stlar bilan musobaqa",
];
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [counts, setCounts] = useState(null);
  const isLive = !!(live && (live.mode === 'student' || live.mode === 'mentor') && live.pin);
  // Jonli: shu ekran (0) ovozlarini o'qiymiz — real sinf diagrammasi
  useEffect(() => {
    if (!isLive) return;
    let on = true, t = null;
    const tick = async () => {
      try { const rows = await liveAnswers(live.pin, screen); if (on) setCounts(HOOK_OPTS.map((_, i) => rows.filter(r => r.picked === i).length)); } catch {}
      if (on) t = setTimeout(tick, 3000);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [isLive, live && live.pin, screen]);
  const pick = (i) => {
    if (picked !== null || (live && live.mode === 'mentor')) return;
    setPicked(i);
    onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: i, correct: false });
    if (live && live.mode === 'student') live.submitAnswer(screen, 's0', i, false, 0);
  };
  const isMentor = live && live.mode === 'mentor';
  const shown = counts || (picked !== null ? HOOK_OPTS.map((_, i) => (i === picked ? 1 : 0)) : null);
  const totalVotes = shown ? shown.reduce((a, b) => a + b, 0) : 0;
  const revealViz = shown && (picked !== null || isMentor);
  const topIdx = revealViz ? shown.indexOf(Math.max(...shown)) : -1;
  return (
    <Stage eyebrow="Kirish · Duolingo so'rovi" screen={screen} navContent={<NavNext optionalLive disabled={picked === null && !isMentor} label="Davom etish" onClick={onNext} />}>
      <div className="screen" style={{ gap: 'clamp(14px,2.2vw,20px)' }}>
        <div className="hook-hero fade-up"><span className="hook-cup">🦉</span></div>
        <div className="head"><h2 className="title h-title fade-up" style={{ textAlign: 'center' }}>Nima odamni <span className="italic" style={{ color: T.accent }}>har kuni</span> qaytaradi?</h2></div>
        <Mentor>Duolingo'da juda ko'p odam <b style={{ color: T.ink }}>har kuni</b> kirib dars qiladi — hatto charchagan kunlari ham. Sizningcha, ularni har kuni qaytishga <b style={{ color: T.ink }}>nima majburlaydi</b>? Ovoz bering — sababini birozdan keyin birga bilib olamiz.</Mentor>
        <div className="hook-menu fade-up delay-1">
          {HOOK_OPTS.map((o, i) => {
            const on = picked === i;
            const locked = picked !== null || isMentor;
            return (
              <button key={i} className={`hook-mc ${on ? 'on' : ''} ${!locked ? 'taphint' : ''}`} disabled={locked} onClick={() => pick(i)}>
                <span className="hook-mc-abc">{String.fromCharCode(65 + i)}</span>
                <span className="hook-mc-txt">{o}</span>
                <span className="hook-mc-cup" aria-hidden="true">🔥</span>
              </button>
            );
          })}
        </div>
        {revealViz && (
          <div className="streak-shelf fade-step" aria-label="Ovoz natijalari — streak-alanga zanjirlari">
            <div className="streak-rows">
              {HOOK_OPTS.map((o, i) => {
                const n = shown[i];
                const pct = totalVotes ? Math.round((n / totalVotes) * 100) : 0;
                const flames = Math.max(totalVotes ? 1 : 0, Math.round(pct / 10)); // 0..10 alanga
                return (
                  <div key={i} className={`streak-row ${picked === i ? 'mine' : ''} ${i === topIdx && totalVotes > 0 ? 'top' : ''}`}>
                    <span className="streak-abc">{String.fromCharCode(65 + i)}</span>
                    <div className="streak-chain" aria-hidden="true">
                      {Array.from({ length: 10 }).map((_, k) => (
                        <span key={k} className={`streak-cell ${k < flames ? 'lit' : ''}`} style={{ transitionDelay: `${k * 40}ms` }}>🔥</span>
                      ))}
                    </div>
                    <span className="streak-pct">{i === topIdx && totalVotes > 0 && <span className="streak-crown" aria-hidden="true">👑</span>}{pct}%</span>
                  </div>
                );
              })}
            </div>
            <p className="streak-cap">{isMentor ? "Sinf ovozi — zanjir uzun bo'lgani sari sabab aniqlashadi. To'g'ri javobni hali ochmang." : "Ovozingiz qabul qilindi. Haqiqiy sababni birozdan keyin ochamiz: bu RETENTION (qaytish) mexanikasi bilan bog'liq. 😉"}</p>
          </div>
        )}
        <MentorNote>Javobni aytmang. Sinfda Duolingo ishlatganlar bormi — qo'l ko'tarsin (jonlilik). Gapirish 2 daqiqagacha.</MentorNote>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — MAQSAD: jonli natija-preview (metrika-kartalar ko'z oldida birma-bir to'ladi) =====
// WOW-moment: o'quvchi dars natijasini OLDINDAN ko'radi — bo'sh slotlar namunaviy ko'rsatkichlar
// bilan o'z-o'zidan to'lib boradi (CSS-taymlayn, reduced-motion'da darhol to'liq holat).
const DEMO_METRICS = [
  { ic: '📅', name: 'DAU', what: 'kunlik kirganlar', val: "o'smoqda ▲" },
  { ic: '↩️', name: 'Retention', what: 'qaytganlar ulushi', val: 'qaytish %' },
  { ic: '⭐', name: 'North Star', what: 'real qiymat', val: 'bosh raqam' },
];
const Screen1 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Maqsad" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
    <div className="screen" style={{ gap: 'clamp(14px,2.2vw,20px)' }}>
      <div className="head"><h2 className="title h-title fade-up">Dars oxirida sizda <span className="italic" style={{ color: T.accent }}>metrika-panel</span> bo'ladi.</h2></div>
      <Mentor>Dars oxirida sizda o'z MVP'ingiz uchun <b style={{ color: T.ink }}>NORTH STAR</b> (bosh yulduz-ko'rsatkich) va <b style={{ color: T.ink }}>3 ta asosiy metrika kartasi</b> bo'ladi. Qarang: kartalar hozir ko'z oldingizda to'ladi — dars oxirida xuddi shunday uchtasini o'zingiz to'ldirasiz.</Mentor>
      <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEMO_METRICS.map((m, i) => (
          <div key={i} className="story-silo demo-card" style={{ '--cd': `${0.2 + i * 0.18}s` }}>
            <span className="story-silo-n">{m.ic}</span>
            <div className="story-silo-slots">
              {[['name', 'NOMI', 'kim'], ['what', "O'LCHAYDI", 'nima'], ['val', 'NAMUNA', 'natija']].map(([k, lbl, cls], j) => (
                <span key={k} className={`silo-slot ${cls} demo-slot`} style={{ '--fd': `${1.1 + (i * 3 + j) * 0.42}s` }}>
                  <span className="silo-lbl">{lbl}</span>
                  <span className="silo-fill">{m[k]}</span>
                </span>
              ))}
            </div>
            <span className="silo-done" style={{ '--fd': `${1.1 + (i * 3 + 2) * 0.42 + 0.3}s` }}>✓</span>
          </div>
        ))}
      </div>
      <p className="silo-cap">✨ Xuddi shunday — bugun sizning metrika kartalaringiz ham birma-bir to'ladi.</p>
      <div className="takeaway fade-up delay-2"><span className="ta-bulb">🎯</span><p className="ta-h">Bu panel bugun to'ladi — va keyingi darsda OKR'ga aylanadi.</p><p className="ta-sub">Tayyor natija = loyihangizning o'lchov tizimi</p></div>
    </div>
  </Stage>
);

// ===== SCREEN 2 — YADRO: savol-ekran (sinf muhokamasi + oshxona misoli) =====
const Screen2 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Muhokama · savol" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive label="Davom etish" onClick={onNext} /></>}>
    <div className="screen" style={{ gap: 'clamp(14px,2.2vw,20px)' }}>
      <div className="proj-q fade-up">
        <span className="proj-q-lbl">🗣️ Sinfga savol</span>
        <p className="proj-q-body">MVP'ingizga bir haftada <b>100 kishi kirdi</b>. Bu yaxshimi? <b>Qayerdan bilamiz?</b> (Kim qaytdi? Nima qildi?)</p>
      </div>
      <Mentor>Muhokama qilamiz: «100 kishi kirdi» — bu shunchaki <b style={{ color: T.ink }}>kelish</b>. Muhimi — qanchasi <b style={{ color: T.ink }}>qaytdi</b> va nima qildi? Foyda olmagan odam ertaga qaytmaydi.</Mentor>
      <div className="ex-card fade-up delay-1">
        <span className="ex-lbl">🍽️ O'smir hayotidan misol</span>
        <p className="ex-body">Maktab oshxonasida <b>yangi taom</b> chiqdi — birinchi kuni HAMMA oladi (qiziqish). Muhimi: <b>ikkinchi haftada nechtasi YANA oladi</b>. Qaytish — haqiqiy baho.</p>
        <div className="ex-tags"><span className="ex-tag kim">1-kun: HAMMA oladi (kelish)</span><span className="ex-tag natija">2-hafta: kim qaytdi? (qaytish)</span></div>
      </div>
      <MentorNote>Qoidani SAVOLDAN OLDIN aytmang — o'quvchi «kelish emas, qaytish» g'oyasiga muhokama orqali o'zi kelsin.</MentorNote>
    </div>
  </Stage>
);

// ===== SCREEN 3 — QOIDA-EKRAN: 4 metrika interaktiv flip-karta (bosib ochiladi) =====
const METRIC_DEFS = [
  { key: 'dau',  ic: '📅', name: 'DAU / MAU',  short: 'kunlik / oylik faol foydalanuvchi', def: <>Bir kun (yoki oy) ichida mahsulotga <b>kirgan faol odamlar soni</b>. «Bugun nechta odam kirdi?» degan savolga javob beradi.</> },
  { key: 'ret',  ic: '↩️', name: 'Retention', short: 'qaytish ulushi', def: <>Kirgan odamlarning <b>qanchasi keyin qaytib keladi</b>. Mahsulot foyda berayotganini eng aniq ko'rsatadigan raqamlardan biri.</> },
  { key: 'churn',ic: '📉', name: 'Churn',      short: 'ketish ulushi', def: <>Retention'ning aksi: <b>qanchasi butunlay ketdi</b>. Churn o'ssa — odamlar mahsulotni tashlab ketmoqda degani.</> },
  { key: 'ns',   ic: '⭐', name: 'North Star', short: 'bosh yulduz-ko\'rsatkich', def: <>Mahsulotingiz <b>haqiqiy qiymat berayotganini</b> eng yaxshi ko'rsatadigan YAGONA bosh raqam. Butun jamoa shunga qaraydi.</> },
];
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [st, setSt] = useState(() => ({ opened: storedAnswer?.opened || METRIC_DEFS.map(() => false) }));
  const openedN = st.opened.filter(Boolean).length;
  const done = openedN >= METRIC_DEFS.length;
  const flip = (i) => {
    if (st.opened[i]) return;
    const opened = st.opened.map((o, k) => k === i ? true : o);
    setSt({ opened });
    if (opened.every(Boolean) && storedAnswer === undefined) onAnswer(screen, { opened, correct: true });
  };
  return (
    <Stage eyebrow="Qoida" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : `4 kartani oching (${openedN}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(14px,2.2vw,20px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihangiz yaxshi ishlayaptimi — buni qaysi <span className="italic" style={{ color: T.accent }}>raqam</span> ko'rsatadi?</h2></div>
        <Mentor>Metrika — mahsulot salomatligini ko'rsatadigan <b style={{ color: T.ink }}>raqam</b>. To'rt asosiysini bosib oching. Ular ichida bittasi — <b style={{ color: T.ink }}>North Star</b>: mahsulot haqiqiy qiymat berayotganini eng yaxshi ko'rsatadigan yagona bosh raqam.</Mentor>
        <div className="mcard-grid fade-up delay-1">
          {METRIC_DEFS.map((m, i) => {
            const open = st.opened[i];
            return (
              <button key={m.key} className={`mcard ${m.key} ${open ? 'open' : ''}`} onClick={() => flip(i)} disabled={open}>
                <span className="mcard-ic">{m.ic}</span>
                <span className="mcard-name">{m.name}</span>
                {open
                  ? <span className="mcard-def">{m.def}</span>
                  : <><span className="mcard-short">{m.short}</span><span className="mcard-tap">bosib oching ▸</span></>}
              </button>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✅ To'rttasini ham ko'rdingiz. Diqqat: <b>kelish (DAU)</b> boshqa, <b>qaytish (retention)</b> boshqa — bu farq butun darsning yuragi.</p></div>}
        <MentorNote>Duolingo keysi keyin keladi (unda rasmiy raqam yo'q — raqam to'qimang). «North Star» so'zini birinchi aytganda ochib bering: butun jamoa qaraydigan bitta bosh raqam.</MentorNote>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — KEYS K5: Duolingo streak mexanikasi bosqichma-bosqich (RAQAMSIZ) =====
const K5_SLIDES = [
  { ic: "🦉", h: "Duolingo — har kuni qaytish", body: <>Duolingo'ning bosh muammosi: odamlar ilovani yuklab, keyin <b>tashlab ketmasin</b>. Til o'rganish — uzoq safar, har kun kerak.</> },
  { ic: "🔥", h: "Streak nima", body: <>Streak — <b>uzluksiz kunlar zanjiri</b>: har kuni dars qilsangiz, zanjir uzunlashadi. Bir kun o'tkazib yuborsangiz — zanjir uziladi.</> },
  { ic: "😰", h: "Qo'rquv + odat", body: <>Uzun zanjirni <b>yo'qotishdan qo'rquv</b> odamni charchagan kunda ham qaytaradi. Asta-sekin bu <b>odatga</b> aylanadi.</> },
  { ic: "🧊", h: "Muzlatish va eslatmalar", body: <>Atrofida yordamchi mexanika: zanjirni <b>«muzlatish»</b> (bir kun o'tkazib yuborsangiz saqlanadi) va kunlik <b>eslatmalar</b>.</> },
  { ic: "↩️", h: "Xulosa: retention", body: <>Streak — bu ongli mahsulot-qarori. U <b>retention'ni (qaytishni) ko'taradi</b> va kuniga o'lchab turiladi.</> },
];
const Screen4 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [i, setI] = useState(0);
  const last = i === K5_SLIDES.length - 1;
  useEffect(() => { if (last && storedAnswer === undefined) onAnswer(screen, { correct: true }); }, [last]); // eslint-disable-line
  const c = K5_SLIDES[i];
  return (
    <Stage eyebrow="Keys 🔥" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive label={last ? 'Davom etish' : `Keyingi bosqich (${i + 1}/${K5_SLIDES.length})`} onClick={last ? onNext : () => setI(i + 1)} /></>}>
      <div className="screen" style={{ gap: 'clamp(14px,2.2vw,20px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi ochamiz: nima odamni <span className="italic" style={{ color: T.accent }}>har kuni</span> qaytaradi?</h2></div>
        <div className="k-slide fade-step" key={i}>
          <span className="k-slide-eyebrow">📊 Keys · Duolingo · {i + 1} / {K5_SLIDES.length}</span>
          <div className="k-slide-ic">{c.ic}</div>
          <h3 className="k-slide-h">{c.h}</h3>
          <p className="k-slide-body">{c.body}</p>
        </div>
        <div className="k-dots">{K5_SLIDES.map((_, k) => <button key={k} className={`k-dot ${k === i ? 'cur' : k < i ? 'fill' : ''}`} onClick={() => setI(k)} aria-label={`${k + 1}-bosqich`} />)}</div>
        {last && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sizning MVP'ingizda ham «odamni qaytaradigan» bitta mexanika bo'lishi mumkin. Uni topib, retention'ni o'lchab turasiz.</p></div>}
        <MentorNote>Bu keysda rasmiy raqam yo'q — foydalanuvchi soni yoki foizini o'zingizdan to'qimang. «Streak» so'zini birinchi aytganda ochib bering (kunlar zanjiri).</MentorNote>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5 — O'Z LOYIHASI: North Star nomzodi (jonli validator: raqam + chunki…qiymat) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [text, setText] = useState(() => {
    const saved = readMetrics();
    return storedAnswer?.northStar ?? saved?.northStar ?? '';
  });
  const v = validateNorthStar(text);
  const save = (val) => {
    setText(val);
    onAnswer(screen, { northStar: val, correct: validateNorthStar(val).full });
    const prev = readMetrics() || {};
    writeMetrics({ ...prev, northStar: val });
  };
  return (
    <Stage eyebrow="Amaliyot · North Star'ingiz" screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!v.full} label={v.full ? 'Davom etish' : 'North Star nomzodini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihangizning bosh raqami — <span className="italic" style={{ color: T.accent }}>North Star</span> — qaysi bo'ladi?</h2></div>
        <Mentor>MVP'ingiz uchun bitta bosh raqam nomzodini yozing. Shablon: <b style={{ color: T.ink }}>«Mening North Star'im — [raqam], chunki u [foydalanuvchi olayotgan qiymat]ni ko'rsatadi»</b>. Pastdagi ikki chiroq yonganda nomzod tayyor.</Mentor>
        <div className={`nstar-editor ${v.full ? 'ok' : ''} fade-up delay-1`}>
          <span className="nstar-lead">⭐ Mening North Star'im —</span>
          <textarea className="nstar-input" value={text} spellCheck={false} rows={3} onChange={e => save(e.target.value)} placeholder="masalan: haftada 3+ marta qaytgan foydalanuvchilar soni, chunki u odam mahsulotdan real foyda olayotganini ko'rsatadi" />
          <div className="nstar-checks">
            <StoryCheck ok={v.hasNumber} label="O'lchanadigan raqam bor (soni / ulush / foiz)" />
            <StoryCheck ok={v.hasReason} label="«chunki … qiymat» — nega muhimligi yozilgan" />
          </div>
        </div>
        {v.full && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✅ North Star nomzodi tayyor! U ustaxonaga ko'chadi — u yerda 3 metrika-karta bilan panel yig'asiz.</p></div>}
        <MentorNote>«Hammasi DAU bo'lsin» tuzog'iga tushmasin: North Star — real qiymatni ko'rsatuvchi raqam, shunchaki kelish soni emas.</MentorNote>
      </div>
    </Stage>
  );
};

// ===== 🛠️ JONLI PRAKTIKA signal-zonasi (500+): test <100 · arena 100+ bilan to'qnashmaydi =====
const PRACTICE_BASE = 500;
const MentorPracticeStats = ({ live, screen, label = "👀 Kim bajardi" }) => {
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
      <div className="card-lbl" style={{ color: T.blue }}>{label} — {doers.length}/{players.length}</div>
      {data.players === null ? (
        <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Yuklanmoqda…</p>
      ) : players.length === 0 ? (
        <p className="small" style={{ color: T.ink3, margin: 0, fontStyle: 'italic' }}>Hali hech kim qo'shilmagan.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {doers.map(p => <span key={p.id} className="mstats-wait-chip" style={{ background: T.successSoft, color: T.success, fontWeight: 700 }}>✓ {p.nickname}</span>)}
          {waiting.map(p => <span key={p.id} className="mstats-wait-chip" style={{ background: T.accentSoft, color: T.accent, fontWeight: 700 }}>✏️ {p.nickname}</span>)}
        </div>
      )}
    </div>
  );
};

// ===== SCREEN 6 (practice) — METRIKA-PANEL USTAXONA: North Star + 3 metrika-karta + RO'YXAT + YULDUZCHA + YORDAM =====
// s5'dagi North Star METRICS_KEY orqali ko'chib keladi; o'quvchi 3 metrika-karta qo'shadi (NOMI→NIMANI→NEGA + savol turi).
const METRIC_ASKS = [
  { k: 'kelish', label: 'Kelish — «bugun nechta odam kirdi?»' },
  { k: 'qaytish', label: 'Qaytish — «kelganlarning qanchasi qaytdi?»' },
  { k: 'qiymat', label: 'Qiymat — «mahsulot real foyda beryaptimi?»' },
];
const emptyMetric = () => ({ nom: '', what: '', why: '', ask: '', hyp: '' });
const initMetricCards = (storedAnswer) => {
  if (storedAnswer?.cards) return storedAnswer.cards.slice(0, 3);
  const saved = readMetrics();
  const base = (saved?.cards || []).slice(0, 3).map(c => ({ ...emptyMetric(), ...c }));
  while (base.length < 3) base.push(emptyMetric());
  return base;
};
const ScreenMetricWorkshop = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const [st, setSt] = useState(() => ({
    northStar: storedAnswer?.northStar ?? readMetrics()?.northStar ?? '',
    cards: initMetricCards(storedAnswer),
    done: !!(storedAnswer && storedAnswer.solved),
    helpOpen: false,
  }));
  const { northStar, cards, done, helpOpen } = st;
  // RO'YXAT — 3 band jonli validator
  const nsOk = validateNorthStar(northStar).full;
  const asks = cards.map(c => c.ask).filter(Boolean);
  const threeAsks = new Set(asks).size >= 3;
  const allWhy = cards.every(c => validateMetricCard(c).full);
  const checks = [
    { ok: nsOk, label: "North Star bitta va o'lchanadigan (raqam chiqadi)" },
    { ok: threeAsks, label: "3 karta uch xil savolga javob (kelish · qaytish · qiymat)" },
    { ok: allWhy, label: "Har kartada «nega muhim» real sabab bilan yozilgan" },
  ];
  const passed = checks.every(c => c.ok);
  const persistNS = (val) => setSt(prev => { writeMetrics({ northStar: val, cards: prev.cards }); return { ...prev, northStar: val }; });
  const setCard = (i, p) => setSt(prev => { const cards = prev.cards.map((c, k) => k === i ? { ...c, ...p } : c); writeMetrics({ northStar: prev.northStar, cards }); return { ...prev, cards }; });
  const complete = () => {
    if (done || !passed) return;
    setSt(prev => ({ ...prev, done: true }));
    onAnswer(screen, { stage: 'practice', screenIdx: screen, practice: 'metric-panel', northStar, cards, solved: true, correct: true, picked: true });
    if (live && live.mode === 'student') live.submitAnswer(PRACTICE_BASE + screen, 'practice', 0, true, 0);
  };
  return (
    <Stage eyebrow="Mustaqil ish · metrika-panel ✍️" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done} label={done ? 'Davom etish' : 'Avval bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihangiz <span className="italic" style={{ color: T.accent }}>metrika-panelini</span> o'zingiz yig'a olasizmi?</h2></div>
        <Mentor>North Star'ingizni tasdiqlang va <b style={{ color: T.ink }}>3 metrika-karta</b> to'ldiring: NOMI → NIMANI o'lchaydi → NEGA muhim. Har karta <b style={{ color: T.ink }}>boshqa savolga</b> javob bersin: kelish · qaytish · qiymat. Tugagach «Bajardim»ni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className={`nstar-editor mini ${nsOk ? 'ok' : ''}`}>
              <span className="nstar-lead">⭐ North Star (tasdiqlang)</span>
              <textarea className="nstar-input" value={northStar} spellCheck={false} rows={2} onChange={e => persistNS(e.target.value)} placeholder="…soni, chunki u qanday qiymatni ko'rsatadi" />
            </div>
            {cards.map((c, i) => {
              const v = validateMetricCard(c);
              return (
                <div key={i} className={`swcard ${v.full ? 'ok' : ''}`}>
                  <span className={`swcard-tag ${v.full ? 'kept' : 'new'}`}>{v.full ? '✓ Karta to\'liq' : `✨ Metrika-karta ${i + 1}`}</span>
                  <div className="swcard-fields">
                    <label className={`smini-f kim ${v.nomOk ? 'on' : ''}`}><span>NOMI</span><input value={c.nom} onChange={e => setCard(i, { nom: e.target.value })} placeholder="masalan: retention" /></label>
                    <label className={`smini-f nima ${v.whatOk ? 'on' : ''}`}><span>NIMANI o'lchaydi</span><input value={c.what} onChange={e => setCard(i, { what: e.target.value })} placeholder="qaytish ulushi" /></label>
                    <label className={`smini-f natija ${v.whyOk ? 'on' : ''}`}><span>NEGA muhim</span><input value={c.why} onChange={e => setCard(i, { why: e.target.value })} placeholder="real foyda shu yerda ko'rinadi" /></label>
                  </div>
                  <label className={`mwcard-ask ${c.ask ? 'on' : ''}`}>
                    <span>Qaysi savolga javob beradi?</span>
                    <select value={c.ask} onChange={e => setCard(i, { ask: e.target.value })}>
                      <option value="">— tanlang —</option>
                      {METRIC_ASKS.map(a => <option key={a.k} value={a.k}>{a.label}</option>)}
                    </select>
                  </label>
                  <label className="mwcard-hyp">
                    <span>⭐ Gipoteza — taxmin (ixtiyoriy)</span>
                    <input value={c.hyp} onChange={e => setCard(i, { hyp: e.target.value })} placeholder="…ni qilsak, bu metrika o'sadi" />
                  </label>
                </div>
              );
            })}
          </Col>
          <Col>
            <div className="checklist fade-up">
              <div className="card-lbl" style={{ color: passed ? T.success : T.accent }}>📋 Ro'yxat — {checks.filter(c => c.ok).length}/3</div>
              {checks.map((c, i) => <StoryCheck key={i} ok={c.ok} label={c.label} />)}
            </div>
            <div className={`yordam ${helpOpen ? 'open' : ''} fade-up`}>
              <button className="yordam-toggle" onClick={() => setSt(prev => ({ ...prev, helpOpen: !prev.helpOpen }))}>💡 Yordam kerakmi? {helpOpen ? '▾' : '▸'}</button>
              {helpOpen && <div className="yordam-body">
                <p>Foydalanuvchi birinchi marta qachon <b>«xursand»</b> bo'ladi? O'sha lahzani qaysi raqam ko'rsatadi? — North Star shu.</p>
                <p>Kelganlarni <b>kim sanaydi</b>? Qaytganlarni-chi?</p>
                <p className="yordam-hint">Har savol boshqa raqamni talab qiladi — shuning uchun 3 xil karta.</p>
              </div>}
            </div>
            <div className="star-task fade-up">
              <span className="card-lbl" style={{ color: T.blue }}>⭐ Yulduzcha topshirig'i</span>
              <p className="small" style={{ margin: 0, color: T.ink2 }}>Har metrikaga bitta <b>GIPOTEZA</b> yozing: «[X]ni qilsak, bu metrika o'sadi» — keyingi darsdagi OKR'ga tayyorgarlik.</p>
            </div>
            <MentorPracticeStats live={live} screen={screen} label="✍️ Panelni tugatganlar" />
            <button className={`lp-done-btn ${done ? 'is-done' : ''}`} disabled={done || !passed} onClick={complete}>
              {done ? '✓ Bajarildi — ustozni kuting' : passed ? '✅ Bajardim' : `Ro'yxat 3/3 bo'lsin (${checks.filter(c => c.ok).length}/3)`}
            </button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Metrika-panelingiz tayyor — mana shu sizning tayyor natijangiz. Ustoz tekshirib, keyingi qadamga o'tkazadi.</p></div>}
          </Col>
        </div>
        <MentorNote>3/3 = o'tdi · 2/3 = joyida to'ldiradi · kam = YORDAM bilan qaytadan. «Hammasi DAU bo'lsin» tuzog'i: uch karta uch XIL savolga javob berishini tekshiring.</MentorNote>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7/8 — TEKSHIRUV: teoriyaga biriktirilgan scored MCQ (QuestionScreen, lead→cue) =====
const TestLead = ({ tag, lead, cue }) => (
  <div className="proj-q">
    <span className="proj-q-lbl">🔎 {tag}</span>
    <p className="broken-cue">{lead}</p>
    <p className="proj-q-body"><b>{cue}</b></p>
  </div>
);
const Screen7 = (props) => (
  <QuestionScreen {...props} eyebrow="Tekshiruv · test 1" scope="module-mikro"
    question={<TestLead tag="Test 1"
      lead="DAU bilan MAU'ni endi bilasiz."
      cue="Ilovangizga ODAM har kuni kirsa, qaysi ko'rsatkich birinchi o'sadi?" />}
    questionText="Test 1: har kuni kirish"
    options={["DAU — kunlik faol foydalanuvchi", "Churn — ketish ulushi", "Sahifa dizaynining bahosi", "Server narxi"]}
    correctIdx={0}
    explainCorrect="DAU (kunlik faol foydalanuvchi) — odam har kuni kirsa, avvalo shu raqam o'sadi. Churn esa aksincha kamayadi."
    explainWrong={{ 1: "Churn — ketish. Odam qaytib kirsa, churn kamayadi, o'smaydi. To'g'ri javob — DAU.", 2: "Sahifa dizayni — bu metrika emas, sub'ektiv baho. To'g'ri javob — DAU.", 3: "Server narxi — bu xarajat, foydalanuvchi faolligini o'lchamaydi. To'g'ri javob — DAU.", default: "Har kuni kirish avvalo DAU'ni o'stiradi." }}
  />
);
const Screen8 = (props) => (
  <QuestionScreen {...props} eyebrow="Tekshiruv · test 2" scope="module-mikro"
    question={<TestLead tag="Test 2"
      lead="Duolingo misolida ko'rdik — streak odamni qaytaradi."
      cue="Streak birinchi navbatda qaysi metrikani ko'taradi?" />}
    questionText="Test 2: streak qaysi metrikani ko'taradi"
    options={["Yangi foydalanuvchilar oqimi", "Server tezligi", "Retention — qaytish ulushi", "O'rtacha chek"]}
    correctIdx={2}
    explainCorrect="Retention — «qaytish» mexanikasi. Streak odamni qayta-qayta qaytaradi, demak avvalo retention o'sadi."
    explainWrong={{ 0: "Yangi oqim — bu yangi kelganlar. Streak faqat mavjudlarni qaytaradi, yangi odam keltirmaydi. To'g'ri javob — retention.", 1: "Server tezligi — texnik ko'rsatkich, streak'ga bog'liq emas. To'g'ri javob — retention.", 3: "O'rtacha chek — bu daromad metrikasi. Streak avvalo qaytishni oshiradi. To'g'ri javob — retention.", default: "Streak = qaytish mexanikasi → retention." }}
  />
);

// ===== SCREEN 9 — TEKSHIRUV (TEST-3): MatchPairs — 4 metrika ↔ 4 savol juftlash (scored, Kahoot-reveal) =====
// KONTRAKT: 4 chip → 4 nishon · atomik holat (yagona useState) · DOM-transform drag + tap-fallback ·
// scored: birinchi-urinish mukammal → picked=0, aks holda picked=1 · INLINE_KEYS.s9=0 · Kahoot-reveal.
const MATCH_PAIRS = [
  { id: 'dau',   chip: 'DAU',        target: 'Bugun nechta odam kirdi?' },
  { id: 'ret',   chip: 'retention',  target: 'Kelganlarning qanchasi qaytdi?' },
  { id: 'churn', chip: 'churn',      target: 'Qanchasi butunlay ketdi?' },
  { id: 'ns',    chip: 'North Star', target: 'Mahsulot haqiqiy qiymat beryaptimi?' },
];
// Barqaror (StrictMode-safe) tartiblar — render'da aralashtirilmaydi. Chip tartibi nishondan farqli.
const MATCH_CHIP_ORDER = [2, 0, 3, 1]; // churn · DAU · North Star · retention
const MATCH_TARGET_ORDER = [0, 1, 2, 3];
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const oneShot = !!(live && live.mode === 'student');
  const isMentorLive = !!(live && live.mode === 'mentor');
  const mountTs = useRef(Date.now());
  const [st, setSt] = useState(() => ({
    assign: storedAnswer?.assign || { 0: null, 1: null, 2: null, 3: null },
    sel: null,
    drag: null,
    solved: !!(storedAnswer && storedAnswer.solved),
    picked: storedAnswer?.picked ?? null,
  }));
  const { assign, sel, drag, solved, picked } = st;
  const [mReveal, setMReveal] = useState(() => !!(isMentorLive && storedAnswer));
  const [recapOpen, setRecapOpen] = useState(false);
  const liveRevealScreen = live ? live.revealScreen : -1;
  useEffect(() => { if (isMentorLive && liveRevealScreen === screen) setMReveal(true); }, [isMentorLive, liveRevealScreen, screen]);
  const doReveal = () => { setMReveal(true); if (live) live.mentorReveal(screen); if (storedAnswer === undefined) onAnswer(screen, { mentorRevealed: true }); };

  const pool = MATCH_PAIRS.filter(p => !Object.values(assign).includes(p.id));
  const filled = Object.values(assign).filter(v => v !== null).length;
  const complete = (nextAssign) => {
    const allCorrect = MATCH_PAIRS.every((p, i) => nextAssign[i] === p.id);
    const pk = allCorrect ? 0 : 1; // birinchi-urinish mukammal → 0
    setSt(prev => ({ ...prev, assign: nextAssign, sel: null, drag: null, solved: true, picked: pk }));
    onAnswer(screen, { stage: 'module-mikro', screenIdx: screen, assign: nextAssign, picked: pk, correct: allCorrect, firstAttemptCorrect: allCorrect, solved: true });
    if (oneShot) live.submitAnswer(screen, SCREEN_META[screen]?.id || `s${screen}`, pk, allCorrect, Date.now() - mountTs.current);
  };
  const place = (targetIdx, chipId) => {
    if (solved || isMentorLive || chipId == null) return;
    const next = { ...assign };
    Object.keys(next).forEach(k => { if (next[k] === chipId) next[k] = null; }); // chipni eski nishondan olib tashlash
    next[targetIdx] = chipId;
    if (Object.values(next).filter(v => v !== null).length === 4) complete(next);
    else setSt(prev => ({ ...prev, assign: next, sel: null, drag: null }));
  };
  const tapChip = (chipId) => { if (solved || isMentorLive) return; setSt(prev => ({ ...prev, sel: prev.sel === chipId ? null : chipId })); };
  const tapTarget = (targetIdx) => { if (solved || isMentorLive) return; if (sel != null) place(targetIdx, sel); };

  const revealed = !oneShot || !!(live && (live.revealScreen === screen || live.mentorScreen > screen || live.status === 'ended' || !live.mentorAlive));
  const waiting = oneShot && solved && !revealed;
  const showColors = isMentorLive ? mReveal : (solved && revealed);
  const allCorrect = MATCH_PAIRS.every((p, i) => assign[i] === p.id);
  const navLabel = isMentorLive ? (mReveal ? 'Davom etish' : 'Avval natijani oching') : (solved ? 'Davom etish' : 'Barcha juftlikni tuzing');
  return (
    <Stage eyebrow="Tekshiruv · juftlash" screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? !mReveal : !solved} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: isMentorLive ? 'flex-start' : 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">
          <div className="proj-q">
            <span className="proj-q-lbl">🔎 Test 3 · juftlash</span>
            <p className="broken-cue">Panel yig'dingiz.</p>
            <p className="proj-q-body"><b>Endi 4 metrikani o'z savoliga juftlang — har chipni to'g'ri savol ustiga torting (yoki bosing).</b></p>
          </div>
        </div>
        {oneShot && !solved && <p className="small mono fade-up" style={{ margin: '-8px 0 0', color: T.accent, fontWeight: 600 }}>⚡ Jonli dars — bitta urinish, o'ylab juftlang!</p>}
        {/* CHIP POOL */}
        <div className="match-pool fade-up delay-1">
          {MATCH_CHIP_ORDER.filter(idx => pool.some(p => p.id === MATCH_PAIRS[idx].id)).map(idx => {
            const p = MATCH_PAIRS[idx];
            return (
              <button key={p.id} className={`match-chip ${sel === p.id ? 'sel' : ''} ${drag === p.id ? 'dragging' : ''}`}
                draggable={!solved && !isMentorLive}
                onDragStart={() => setSt(prev => ({ ...prev, drag: p.id, sel: p.id }))}
                onDragEnd={() => setSt(prev => ({ ...prev, drag: null }))}
                disabled={solved || isMentorLive}
                onClick={() => tapChip(p.id)}>
                {p.chip}
              </button>
            );
          })}
          {pool.length === 0 && <span className="match-pool-empty">Barcha chiplar joylandi ✓</span>}
        </div>
        <div className="match-hint small mono">{sel ? '👉 endi savol ustiga bosing' : (isMentorLive ? '' : 'chipni tanlang yoki savol ustiga torting')}</div>
        {/* TARGETS */}
        <div className="match-targets fade-up delay-2">
          {MATCH_TARGET_ORDER.map(ti => {
            const chipId = assign[ti];
            const p = chipId != null ? MATCH_PAIRS.find(x => x.id === chipId) : null;
            const correctHere = showColors && chipId === MATCH_PAIRS[ti].id;
            const wrongHere = showColors && chipId != null && chipId !== MATCH_PAIRS[ti].id;
            return (
              <div key={ti} className={`match-target ${chipId ? 'filled' : ''} ${sel && !solved && !isMentorLive ? 'droppable' : ''} ${correctHere ? 'ok' : ''} ${wrongHere ? 'bad' : ''}`}
                onDragOver={e => { if (!solved && !isMentorLive) e.preventDefault(); }}
                onDrop={() => place(ti, drag)}
                onClick={() => tapTarget(ti)} role="button">
                <span className="match-target-q">{MATCH_PAIRS[ti].target}</span>
                <span className="match-slot">
                  {p ? <span className={`match-slot-chip ${correctHere ? 'ok' : ''} ${wrongHere ? 'bad' : ''}`}>{p.chip}{showColors && (correctHere ? ' ✓' : ' ✕')}</span> : <span className="match-slot-empty">bu yerga</span>}
                </span>
              </div>
            );
          })}
        </div>
        <FeedbackBlock show={isMentorLive ? mReveal : solved} isCorrect={isMentorLive ? true : (allCorrect && !waiting)} neutral={waiting}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: waiting ? T.blue : (isMentorLive || allCorrect) ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isMentorLive ? '✓ To\'g\'ri juftlik' : waiting ? '📨 Javobingiz qabul qilindi' : allCorrect ? 'Barchasi to\'g\'ri!' : 'To\'g\'ri juftlik quyida'}
          </p>
          <p className="body" style={{ margin: 0 }}>
            {waiting ? "Hozir to'g'ri juftlikni bilib olasiz." : "DAU → «bugun kirganlar» · retention → «qaytganlar» · churn → «ketganlar» · North Star → «real qiymat». Har metrika bitta savolga javob beradi."}
          </p>
          {!isMentorLive && !allCorrect && (!oneShot || revealed) && (
            <button className="rc-open-mini" onClick={() => setRecapOpen(true)}>📖 Qisqa takrorlash — mavzuni yana bir ko'rish</button>
          )}
        </FeedbackBlock>
        {isMentorLive && <MentorTestStats live={live} screenIdx={screen} options={["Barcha juftlik to'g'ri", "Xato bo'ldi"]} correctIdx={0} reveal={mReveal} onReveal={doReveal} onOpenRecap={() => setRecapOpen(true)} />}
        {recapOpen && <RecapOverlay screenIdx={screen} onClose={() => setRecapOpen(false)} />}
        <MentorNote>Hamma juftlab bo'lmaguncha natijani ochmang. Ochgandan keyin xato juftlangan metrikalarni birga ko'rib chiqing — qaysi metrika qaysi savolga javob berishini takrorlang.</MentorNote>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — KODING: REAL to'liq-ekran kompilyator (Htmllesson1 tizimi PM-qobiqda) =====
// O'quvchi kodini jonli iframe-hujjatda ishga tushiramiz; yashirin harness 3 shartni tekshirib
// parent'ga xabar yuboradi. PM-STUDIA palitrasida self-contained (import yo'q).
const HC_PREVIEW_CSS = `
  *{box-sizing:border-box}
  body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;padding:16px;background:#FBFAFE;color:#1B1630}
  #hcpm-out{display:flex;flex-direction:column;gap:9px}
  .hcpm-empty{font-style:italic;color:#9C97B4;font-size:13px;margin:0}
  .hcpm-err{font-family:monospace;font-size:13px;color:#E5484D;background:#FCE7E8;border-radius:9px;padding:10px 12px;margin:0;white-space:pre-wrap;word-break:break-word}
  .hcpm-card{font-family:Georgia,serif;font-size:15px;line-height:1.5;color:#1B1630;background:#fff;border-radius:9px;padding:11px 13px;box-shadow:0 5px 14px -8px rgba(40,34,82,.25);border-left:3px solid #E7E3F4}
  .hcpm-card.is-num{border-left-color:#5B3DE6;font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700}
  .hcpm-badge{display:inline-block;font-family:'Manrope',system-ui,sans-serif;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5B3DE6;background:#EBE5FD;border-radius:99px;padding:3px 9px;margin-bottom:6px}
  .hcpm-txt{display:block;white-space:pre-wrap;word-break:break-word}
`;
// Yashirin harness — iframe ichida o'quvchi kodidan KEYIN ishlaydi (alohida <script>, xato izolyatsiyalangan).
// retentionFoiz'ni jimgina chaqirib return'ni tekshiradi + console.log lentasini kartalar qilib chizadi.
const HC_HARNESS = (nonce) => `(function(){
  var N=${JSON.stringify(nonce)};
  var logs=window.__logs||[];
  var probe=null,err=null;
  try{
    if(typeof retentionFoiz==="function"){
      var a=retentionFoiz(20,5), b=retentionFoiz(0,0);
      probe={a:a,b:b,t:typeof a};
    }
  }catch(e){err=String(e&&e.message||e);}
  var c1=!!probe && probe.t==="number" && isFinite(probe.a);
  var c2=c1 && probe.a===25 && probe.b===0;
  var nums=logs.map(function(l){return String(l==null?"":l).trim();}).filter(function(l){return l!=="" && !isNaN(Number(l));});
  var uniq={},cnt=0; nums.forEach(function(l){if(!Object.prototype.hasOwnProperty.call(uniq,l)){uniq[l]=1;cnt++;}});
  var c3=cnt>=2;
  var esc=function(s){return String(s).replace(/[&<>]/g,function(m){return m==="&"?"&amp;":m==="<"?"&lt;":"&gt;";});};
  var root=document.getElementById("hcpm-out");
  if(root){
    if(err){root.innerHTML='<p class="hcpm-err">Xato: '+esc(err)+'</p>';}
    else if(!logs.length){root.innerHTML='<p class="hcpm-empty">Natija hali chiqmadi — funksiyani toldiring va foizlarni console.log qiling.</p>';}
    else{root.innerHTML=logs.map(function(l){var s=String(l==null?"":l).trim();var isNum=s!=="" && !isNaN(Number(s));return '<div class="hcpm-card '+(isNum?"is-num":"")+'">'+(isNum?'<span class="hcpm-badge">foiz-raqam</span>':"")+'<span class="hcpm-txt">'+esc(l)+'</span></div>';}).join("");}
  }
  try{parent.postMessage({__hcpmReport:true,nonce:N,c1:c1,c2:c2,c3:c3,err:err,count:cnt},"*");}catch(e){}
})();`;
// O'quvchi kodini jonli hujjatga o'raymiz: console.log ushlagich → o'quvchi kodi → harness.
const HC_wrapDoc = (code, nonce) => `<!doctype html><html lang="uz"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${HC_PREVIEW_CSS}</style>
<script>window.__logs=[];(function(){var _l=console.log;console.log=function(){for(var i=0;i<arguments.length;i++){var a=arguments[i];try{window.__logs.push(typeof a==="object"?JSON.stringify(a):String(a));}catch(e){window.__logs.push(String(a));}}try{_l.apply(console,arguments);}catch(e){}};})();<\/script>
</head><body><div id="hcpm-out"></div>
<script>${code}<\/script>
<script>${HC_HARNESS(nonce)}<\/script>
</body></html>`;
const KODING_STARTER = `function retentionFoiz(kelganlar, qaytganlar) {
  // Qaytish ulushini foizda hisoblang (yaxlitlangan son qaytsin)
  return 0;
}
console.log(retentionFoiz(20, 5));`;
// Kompilyator-qobiq shartlari (JS-check: son qaytaradi + to'g'ri formula + nol-himoya + 2 xil juftlik bilan sinaldi).
const KODING_CONDS = [
  { id: 'c1', label: "Funksiya son qaytaradi — bo'sh 0 emas", hint: "return qatoriga formula yozing: hozir doim 0 qaytmoqda." },
  { id: 'c2', label: "retentionFoiz(20, 5) === 25 va retentionFoiz(0, 0) === 0 (nol-himoya)", hint: "Foiz = qaytganlar / kelganlar * 100, Math.round() bilan. kelganlar 0 bo'lsa 0 qaytaring." },
  { id: 'c3', label: "Kamida 2 xil juftlik bilan sinaldi (natija-lentada 2+ chiqish)", hint: "console.log'ni kamida 2 xil raqam-juftligi bilan chaqiring." },
];
// ===== PM-KOMPILYATOR — Htmllesson1 (HtmlCompiler) tizimi PM-qobiqda =====
// To'liq-ekran praktika: tepada topshiriq + JONLI shart-chiplar, chapda kod-muharrir,
// o'ngda jonli natija (iframe). Kod yozilgani sari shartlar O'ZI tekshiriladi (400ms
// debounce, ▶ ham bor). Uchala shart yashil bo'lsa — «Davom etish» yonadi.
function PmCompiler({ initialCode, onContinue, onBack }) {
  const [code, setCode] = useState(initialCode || KODING_STARTER);
  const nonceRef = useRef(0);
  const [doc, setDoc] = useState('');
  const [st, setSt] = useState({ ran: false, err: null, conds: { c1: false, c2: false, c3: false } });
  // Jonli tekshiruv — Htmllesson1 uslubida debounce bilan avto-ishga tushadi
  useEffect(() => {
    const t = setTimeout(() => {
      const nonce = ++nonceRef.current;
      setDoc(HC_wrapDoc(code, nonce));
    }, 400);
    return () => clearTimeout(t);
  }, [code]);
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (d && d.__hcpmReport && d.nonce === nonceRef.current) {
        setSt({ ran: true, err: d.err || null, conds: { c1: !!d.c1, c2: !!d.c2, c3: !!d.c3 } });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const { conds, err } = st;
  const passed = conds.c1 && conds.c2 && conds.c3;
  const okN = KODING_CONDS.filter(c => conds[c.id]).length;
  const firstHint = KODING_CONDS.find(c => !conds[c.id])?.hint;
  const runNow = () => { const nonce = ++nonceRef.current; setDoc(HC_wrapDoc(code, nonce)); };
  const reset = () => setCode(initialCode || KODING_STARTER);
  // Tab tugmasi 2 bo'sh joy qo'shsin (Htmllesson1 bilan bir xil)
  const onKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target, s = el.selectionStart, en = el.selectionEnd;
      const next = code.slice(0, s) + '  ' + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
  };
  return (
    <div className="hcp-root">
      <div className="hcp-wrap">
        <header className="hcp-top">
          <span className="hcp-eyebrow">Koding · praktika</span>
          <h1 className="hcp-title">Mini-asbob: retention hisoblagich</h1>
          <p className="hcp-brief"><span className="mono">retentionFoiz(kelganlar, qaytganlar)</span> funksiyasini to'ldiring — u qaytish ulushini foizda qaytarsin, so'ng bir nechta juftlik bilan <span className="mono">console.log</span> qilib sinang. Yozgan zahoti o'ngda tekshiriladi.</p>
          <div className="hcp-checklist">
            <span className="hcp-count">{okN}/{KODING_CONDS.length}</span>
            {KODING_CONDS.map((c, i) => (
              <span key={c.id} className={`hcp-chip ${conds[c.id] ? 'ok' : ''}`} title={c.hint}>
                <span className="hcp-dot">{conds[c.id] ? '✓' : i + 1}</span>{c.label}
              </span>
            ))}
          </div>
          {err
            ? <p className="hcp-err">⚠ Kodda xato: {err}</p>
            : (!passed && firstHint && <p className="hcp-hint">💡 {firstHint}</p>)}
        </header>
        <main className="hcp-split">
          <section className="hcp-pane">
            <div className="hcp-pane-bar dark">
              <span className="bb-dots"><i /><i /><i /></span>
              <span className="hcp-tab">retentionFoiz.js</span>
              <button className="hcp-mini" onClick={runNow}>▶ Ishga tushirish</button>
            </div>
            <textarea className="hcp-code" value={code} spellCheck={false} autoCapitalize="off" autoCorrect="off" onChange={e => setCode(e.target.value)} onKeyDown={onKeyDown} placeholder="Kodingizni shu yerga yozing…" />
          </section>
          <section className="hcp-pane">
            <div className="hcp-pane-bar">
              <span className="hcp-pane-name">📺 Natija</span>
              <span className="hcp-live">jonli</span>
            </div>
            {doc
              ? <iframe key={nonceRef.current} className="hcp-frame" title="Jonli natija" sandbox="allow-scripts" srcDoc={doc} />
              : <p className="code-out-empty" style={{ padding: 16, margin: 0 }}>Yozishni boshlang — foiz-natijalaringiz shu yerda jonli chiqadi.</p>}
          </section>
        </main>
        <footer className="hcp-bottom">
          <button className="hcp-ghost" onClick={onBack}>← Darsga qaytish</button>
          <button className="hcp-ghost" onClick={reset}>Qaytadan</button>
          <div className="hcp-status">
            {passed
              ? <span className="hcp-ok-msg">✓ Uchala shart bajarildi!</span>
              : <span className="hcp-wait-msg">Shartlarni bajaring — natija o'ngda jonli ko'rinadi</span>}
          </div>
          <button className="hcp-next" disabled={!passed} onClick={() => passed && onContinue({ code })}>Davom etish →</button>
        </footer>
      </div>
    </div>
  );
}

const ScreenCoding = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const isMentor = !!(live && live.mode === 'mentor');
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState(() => ({
    code: storedAnswer?.code || KODING_STARTER,
    done: !!(storedAnswer && storedAnswer.solved),
  }));
  const { code, done } = st;
  // Kompilyatordan qaytish: kod saqlanadi, birinchi marta tugatilganda ball-signal ketadi
  const finishPractice = ({ code: newCode }) => {
    setOpen(false);
    setSt({ code: newCode, done: true });
    if (!done) {
      onAnswer(screen, { stage: 'koding', screenIdx: screen, code: newCode, solved: true, correct: true });
      if (live && live.mode === 'student') live.submitAnswer(PRACTICE_BASE + screen, 'koding', 0, true, 0);
    }
  };
  return (
    <Stage eyebrow="Koding · 🛠 kompilyator" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext optionalLive disabled={!done && !isMentor} label={done || isMentor ? 'Davom etish' : 'Avval kompilyatorda bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaytish foizini <span className="italic" style={{ color: T.accent }}>kod</span> ham hisoblab beradimi?</h2></div>
        <Mentor><span className="mono">retentionFoiz(kelganlar, qaytganlar)</span> funksiyasini to'ldiring — u qaytish ulushini <b style={{ color: T.ink }}>foizda</b> qaytarsin. Kompilyatorni oching: kod yozasiz, foiz-natijalaringiz o'ngda jonli chiqadi. Uchala shart yashil bo'lsa, darsga qaytib davom etasiz.</Mentor>
        <div className="split">
          <Col>
            <div className="hc-task fade-up">
              <span className="card-lbl" style={{ color: T.accent }}>📋 Kompilyatorda sizni nima kutadi</span>
              <div className="hc-conds">
                {KODING_CONDS.map((c, i) => {
                  const met = done;
                  return (
                    <div key={c.id} className={`hc-cond ${met ? 'ok' : ''}`}>
                      <span className="hc-cond-box">{met ? '✓' : i + 1}</span>
                      <div className="hc-cond-txt"><span className="hc-cond-label">{c.label}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="star-task"><span className="card-lbl" style={{ color: T.blue }}>⭐ Yulduzcha</span><p className="small" style={{ margin: 0, color: T.ink2 }}>Kunlik kirishlar massividan (<span className="mono">[1,1,0,1,1,1,0…]</span>) eng uzun STREAK'ni topadigan funksiya yozing (2-modul sikllari — Duolingo mexanikasining o'zi!).</p></div>
            <MentorPracticeStats live={live} screen={screen} label="🛠 Kodni tugatganlar" />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✅ Ishladi! Funksiya to'g'ri foizni qaytardi va nolga bo'lishdan himoyalangan.</p></div>}
          </Col>
          <Col>
            <div className="kod-launch fade-up delay-1">
              <div className="kod-launch-bar"><span className="bb-dots"><i /><i /><i /></span><span className="kod-launch-title">retentionFoiz.js</span></div>
              <div className="kod-launch-body" aria-hidden="true">{code.split('\n').slice(0, 6).join('\n')}</div>
              <div className="kod-launch-veil">
                <button className="kod-launch-btn" onClick={() => setOpen(true)}>{done ? '↻ Kompilyatorni qayta ochish' : '🛠 Kompilyatorni ochish'}</button>
                <span className="kod-launch-sub">{done ? "Bajarildi — xohlasangiz kodni yana sayqallang" : "To'liq ekranda yozasiz, tugatgach darsga qaytasiz"}</span>
              </div>
            </div>
          </Col>
        </div>
        <MentorNote>Ulgurmagan o'quvchi kodni uyda tugatadi — unga UYGA VAZIFA qisqa versiyada beriladi. Xohlasangiz kompilyatorni ochib, proyektorda yechib ko'rsating.</MentorNote>
      </div>
      {open && <PmCompiler initialCode={code} onContinue={finishPractice} onBack={() => setOpen(false)} />}
    </Stage>
  );
};

// ===== SCREEN 11 — RECAP: juftlik-taymer + Reflection + 3 tez savol =====
const REFLECT_KEY = 'pm-m8d1-reflection';
function PairTimer() {
  const [st, setSt] = useState({ running: false, left: 60 });
  useEffect(() => {
    if (!st.running) return;
    if (st.left <= 0) { setSt(p => ({ ...p, running: false })); return; }
    const t = setTimeout(() => setSt(p => ({ ...p, left: p.left - 1 })), 1000);
    return () => clearTimeout(t);
  }, [st.running, st.left]);
  const role = st.left > 30 ? 'A' : 'B';
  return (
    <div className="pair-timer fade-up">
      <div className="pair-timer-top"><span className="pair-role">Navbat: <b>{st.running ? `${role}` : 'A'}</b></span><span className="pair-clock">{Math.floor(st.left / 60)}:{String(st.left % 60).padStart(2, '0')}</span></div>
      <p className="small" style={{ margin: 0, color: T.ink2 }}>Juftlikda navbat bilan: «mening North Star'im — …, chunki …». 30 soniyada rol almashadi.</p>
      <div className="pair-timer-btns">
        <button className="btn-soft" onClick={() => setSt({ running: true, left: 60 })}>▶ 1 daqiqa boshlash</button>
        {st.running && <button className="btn-soft" onClick={() => setSt({ running: false, left: 60 })}>⏹ To'xtatish</button>}
      </div>
    </div>
  );
}
const Screen11 = ({ screen, onNext, onPrev }) => {
  const [text, setText] = useState(() => { try { return localStorage.getItem(REFLECT_KEY) || ''; } catch { return ''; } });
  const save = (v) => { setText(v); try { localStorage.setItem(REFLECT_KEY, v); } catch {} };
  return (
    <Stage eyebrow="Mustahkamlash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">North Star'ingiz nima — va qaysi <span className="italic" style={{ color: T.accent }}>qiymatni</span> ko'rsatadi?</h2></div>
        <Mentor>Avval juftlikda <b style={{ color: T.ink }}>bir daqiqa</b> gaplashing: «mening North Star'im — …, chunki …». So'ng javobingizni bir qator qilib yozing. Keyin ekrandagi tez savollarga birga javob beramiz — tayyormisiz?</Mentor>
        <PairTimer />
        <div className="reflect fade-up delay-1">
          <span className="card-lbl" style={{ color: T.accent }}>✍️ Reflection — bir qator</span>
          <input className="reflect-input" value={text} onChange={e => save(e.target.value)} placeholder="Mening North Star'im — ..., chunki u ...ni ko'rsatadi" maxLength={160} />
        </div>
        <div className="qa-cards fade-up delay-2">
          <div className="qa-card"><span className="qa-ic">✋</span><p>Retention <b>kirganlarni</b> emas, <b>qaytganlarni</b> o'lchaydimi? — qo'l ko'taring</p></div>
          <div className="qa-card"><span className="qa-ic">🗳️</span><p>«100 kishi kirdi, 90 tasi qaytmadi» — qaysi metrika signal beradi? — ovoz bering</p></div>
          <div className="qa-card"><span className="qa-ic">📄</span><p>North Star + 3 karta yozganlar — panel ekranini ko'tarsin</p></div>
        </div>
        <MentorNote>Sinfning uchdan biri North Star bilan DAU'ni farqlay olmasa — oshxona misolini qayta tushuntiring (kelganlar emas — QAYTGANLAR).</MentorNote>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — UYGA VAZIFA «SHARTNOMA»: qaysi metrikani birinchi tekshirishni SHU YERDA tanlash =====
// Tanlov localStorage'ga (HW_KEY) yoziladi — summary va keyingi dars o'qishi mumkin.
const HW_KEY = 'pm-m8d1-hw';
const HW_TARGETS = ["North Star", "retention", "DAU"];
const readHwTarget = () => { try { return localStorage.getItem(HW_KEY) || ''; } catch { return ''; } };
const Screen12 = ({ screen, onNext, onPrev }) => {
  const [st, setSt] = useState(() => {
    const saved = readHwTarget();
    const isPreset = HW_TARGETS.includes(saved);
    return { target: saved, custom: isPreset ? '' : saved, customMode: !!saved && !isPreset };
  });
  const { target, custom, customMode } = st;
  const pick = (t) => { setSt(prev => ({ ...prev, target: t, customMode: false })); try { localStorage.setItem(HW_KEY, t); } catch {} };
  const setCustom = (v) => { setSt(prev => ({ ...prev, custom: v, target: v.trim(), customMode: true })); try { localStorage.setItem(HW_KEY, v.trim()); } catch {} };
  const openCustom = () => setSt(prev => ({ ...prev, customMode: true, target: prev.custom.trim() }));
  const chosen = target && target.trim();
  return (
    <Stage eyebrow="Uyga vazifa · shartnoma" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi metrikani <span className="italic" style={{ color: T.accent }}>birinchi</span> tekshirasiz?</h2></div>
        <Mentor>Uyda MVP'ingiz <b style={{ color: T.ink }}>tahlil (analytics) panelidan</b> (M7'da ulagansiz) o'tgan hafta raqamlarini oching va 3 metrika-kartangizga <b style={{ color: T.ink }}>jonli raqam</b> yozing. Shu yerda birinchi tekshiradigan metrikani tanlang — vazifangiz shunga moslashadi.</Mentor>
        <div className="hw-chips fade-up delay-1">
          {HW_TARGETS.map(t => (
            <button key={t} className={`hw-chip ${target === t && !customMode ? 'on' : ''}`} onClick={() => pick(t)}>{t}</button>
          ))}
          <button className={`hw-chip add ${customMode ? 'on' : ''}`} onClick={openCustom}>➕ o'zim yozaman</button>
        </div>
        {customMode && (
          <input className="reflect-input fade-step" value={custom} onChange={e => setCustom(e.target.value)} placeholder="masalan: churn, sessiya davomiyligi…" maxLength={40} autoFocus />
        )}
        {chosen ? (
          <div className="split">
            <div className="hw-card full fade-step">
              <span className="hw-badge">To'liq · ~20 daqiqa</span>
              <p className="body" style={{ color: T.ink }}>Analytics'dan <b>{chosen}</b>dan boshlab <b>3 metrika-kartangizga jonli raqam</b> yozing. Raqam chiqmagan kartaga «hali o'lchanmaydi — nima qo'shish kerak» deb yozing. Eng hayron qoldirgan raqamni bir gap izoh bilan belgilang.</p>
            </div>
            <div className="hw-card short fade-step">
              <span className="hw-badge short">Qisqa · ~10 daqiqa</span>
              <p className="body" style={{ color: T.ink }}>Vaqt kam bo'lsa: faqat <b>North Star</b> raqamini analytics'dan topib yozing va bir gap izoh qo'shing.</p>
            </div>
          </div>
        ) : (
          <div className="frame-soft fade-up delay-2"><p className="body" style={{ margin: 0, color: T.ink }}>👆 Avval metrikani tanlang — vazifa-karta shunga moslashadi.</p></div>
        )}
        <div className="checklist fade-up delay-2">
          <div className="card-lbl" style={{ color: T.accent }}>📋 Tekshiruv ro'yxati (3 band)</div>
          <StoryCheck ok={false} label="3 kartada jonli raqam yoki «nima yetishmaydi» yozuvi" />
          <StoryCheck ok={false} label="North Star raqami alohida belgilangan" />
          <StoryCheck ok={false} label="Eng katta hayron qoldirgan raqam bir gap izoh bilan" />
        </div>
        <MentorNote>Koding sinfda tugagan bo'lsa — to'liq versiya; uyga ketgan bo'lsa — qisqa versiya. Analytics'i ishlamayotgan o'quvchiga: avval M7-D8 ulanishini tiklash — bu ham vazifa.</MentorNote>
      </div>
    </Stage>
  );
};

// ===== 🏅 BADGES — REAL bosqichlar uchun (tekin emas) =====
const ACHIEVEMENTS = {
  panelPro:   { icon: '📊', name: 'Panel Pro!',   desc: "Metrika-panelni 3/3 to'ldirdingiz" },
  dataEye:    { icon: '👁️', name: 'Data Eye!',    desc: "3 scored testni ham to'g'ri yechdingiz" },
  calcMaster: { icon: '🛠️', name: 'Calc Master!', desc: "retention hisoblagichni kod bilan qurdingiz" },
  graduate:   { icon: '🎓', name: 'Level Up!',    desc: "Metrika darsini yakunladingiz" },
};
// Ekran id → nishon (recordAnswer'da, faqat REAL solve bilan). dataEye = 3/3 aggregat, graduate = summary.
const ACH_TRIGGERS = { practice: 'panelPro', s10: 'calcMaster' };

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

// Podium savol yorliqlari (SCORED_IDX indekslariga mos — 4/6/9 = s7/s8/s9)
const Q_LABELS = { 4: "1 — DAU testi", 6: "2 — Retention testi", 9: "3 — Juftlash" };
const QUIZ_MS = 15000;
// Arena fon tokenlari — darsning "DNK"si (metrika atamalari). Arena platforma mahsuloti — brendi qoladi.
const QZ_BG_SHAPES = [
  { ch: 'DAU',       l: 5,  t: 10, s: 30, d: 19, dl: 0 },
  { ch: 'MAU',       l: 85, t: 8,  s: 28, d: 23, dl: 1.5 },
  { ch: 'retention', l: 8,  t: 72, s: 24, d: 27, dl: 0.8 },
  { ch: 'churn',     l: 76, t: 68, s: 26, d: 21, dl: 2.2 },
  { ch: 'North Star',l: 45, t: 86, s: 22, d: 25, dl: 1.1 },
  { ch: '%',         l: 66, t: 26, s: 30, d: 17, dl: 0.4 },
  { ch: 'streak',    l: 26, t: 34, s: 26, d: 20, dl: 1.9 },
  { ch: 'qaytish',   l: 55, t: 5,  s: 22, d: 22, dl: 0.6 },
  { ch: 'N★',        l: 91, t: 42, s: 28, d: 24, dl: 1.3 },
  { ch: '🔥',        l: 16, t: 52, s: 28, d: 26, dl: 2.6 },
  { ch: '⭐',        l: 2,  t: 30, s: 30, d: 28, dl: 3.1 },
];
// ⚔️ CodeStrike savollari — to'g'ri javoblar 4 pozitsiyaga TENG (12 savol: 3/3/3/3), naqshsiz. darslik-jonli TASDIQLAYDI.
const QUIZ_BANK = [
  { q: "Metrika nima?", opts: ["Ilova yuklab olingan qurilma modeli", "Kodda nechta funksiya borligi", "Mahsulot salomatligini ko'rsatadigan raqam", "Dizayn ranglari to'plami"], correct: 2 },
  { q: "DAU nimani sanaydi?", opts: ["Kunlik faol foydalanuvchilar soni", "Oyiga to'langan pul", "Sahifadagi tugmalar soni", "Serverning tezligi"], correct: 0 },
  { q: "Retention nimani o'lchaydi?", opts: ["Bir kunda kirganlar soni", "Kelganlarning keyin qaytish ulushi", "Yangi foydalanuvchilar oqimi", "Ilova hajmi"], correct: 1 },
  { q: "Churn nima?", opts: ["Qaytganlar ulushi", "Kunlik faol foydalanuvchi", "Bosh yulduz-ko'rsatkich", "Butunlay tashlab ketganlar ulushi"], correct: 3 },
  { q: "North Star nima?", opts: ["Real qiymatni ko'rsatuvchi yagona bosh raqam", "Eng ko'p pul olib keladigan reklama", "Kodning eng muhim fayli", "Ilovadagi eng chiroyli ekran"], correct: 0 },
  { q: "Duolingo streak nima?", opts: ["Bir martalik katta chegirma", "Do'stlar ro'yxati", "Uzluksiz kunlar zanjiri", "Ilova versiyasi raqami"], correct: 2 },
  { q: "Streak birinchi navbatda qaysi metrikani ko'taradi?", opts: ["Server narxini", "Yangi foydalanuvchilar oqimini", "Ekran o'lchamini", "Retention (qaytish)ni"], correct: 3 },
  { q: "«MVP'ga bir haftada 100 kishi kirdi» — bu yaxshimi?", opts: ["Ha, chunki kirgan odam soni katta", "Aniq emas — qanchasi qaytganini ko'rish kerak", "Yo'q, har doim yomon", "Faqat serverning narxiga bog'liq"], correct: 1 },
  { q: "Oshxonadagi yangi taom misolida haqiqiy baho nima?", opts: ["Ikkinchi haftada nechtasi YANA olishi", "Birinchi kuni hamma olib ko'rishi", "Taomning rangi", "Narxi qancha ekani"], correct: 0 },
  { q: "20 kishi keldi, 5 tasi qaytdi. Retention necha foiz?", opts: ["5%", "20%", "100%", "25%"], correct: 3 },
  { q: "DAU va MAU farqi nimada?", opts: ["DAU pul, MAU vaqt", "Ular bir xil narsa", "DAU — kunlik, MAU — oylik faol foydalanuvchi", "DAU — dizayn ko'rsatkichi, MAU — marketing"], correct: 2 },
  { q: "North Star tanlashda eng ko'p uchraydigan xato qaysi?", opts: ["Uni jamoaga ochiq ko'rsatish", "Hammasini «kelish» (DAU) deb belgilash", "Raqamni har oy tekshirish", "Uni bitta qilib tanlash"], correct: 1 },
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
// ===== ⚔️ CODESTRIKE ARENA — signal zonasi: 100+ (test <100, praktika 500+ bilan to'qnashmaydi) =====
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
    const TOK = ['DAU', 'MAU', 'retention', 'churn', 'North Star', 'streak', 'qaytish', '%', '⭐', '🔥'];
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
  const [phase, setPhase] = useState('lobby');
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

// ===== SCREEN 16 — YAKUN + CODESTRIKE CTA =====
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
  const RECAP = [
    "Metrika — mahsulot salomatligini ko'rsatadigan raqam",
    "DAU/MAU — kelish · retention — qaytish · churn — ketish",
    "North Star — real qiymatni ko'rsatuvchi yagona bosh raqam",
    "Kelganlar emas — QAYTGANLAR haqiqiy bahoni beradi",
    "Duolingo streak — retention'ni ko'taruvchi mahsulot-mexanikasi"
  ];
  const hwTarget = (() => { try { return localStorage.getItem(HW_KEY) || ''; } catch { return ''; } })();
  const HOMEWORK = [
    { b: hwTarget ? `${hwTarget}dan` : 'Analytics', t: hwTarget ? "— boshlab 3 kartaga jonli raqam yozing" : "— o'tgan hafta raqamlarini oching" },
    { b: '3 karta', t: "— har biriga jonli raqam yoki «nima yetishmaydi»" },
    { b: 'North Star', t: "— raqamini alohida belgilang va bir gap izoh" }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Sizning <span className="italic" style={{ color: T.accent }}>metrika-panelingiz</span> tayyor.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi mahsulotni «kelish» emas, «qaytish» va «qiymat» bilan o'lchaysiz — bu mahsulot fikrlashning poydevori." : "Yaxshi harakat! Testlarni bir-ikki qayta ko'ring — DAU va retention farqi tez o'rnashadi."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className={`qz-cta cs-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <CsWordmark stats={false} liveOn={studentLive} disabled={studentWait} onClick={studentWait ? undefined : openArena} hint={studentWait ? '⏳ Mentorni kuting' : undefined} />
        </div>
        {arena && <QuizArena live={_live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>{hwTarget ? <>Shartnomangiz: <b style={{ color: T.accent }}>{hwTarget}</b>dan boshlab jonli raqamlar.</> : "Analytics'dan 3 kartaga jonli raqam:"}</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda aynan shu metrikalardan OKR quramiz! 🚀</p></div>
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
export default function PmMetricsLesson({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());
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
  useEffect(() => {
    const upd = () => { const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920)); document.documentElement.style.setProperty('--lz', String(Math.round(z * 1000) / 1000)); };
    upd(); window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
  }, []);
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const locked = isStudentLive && (screen + 1 > live.mentorScreen);
  useEffect(() => { live.reportScreen(screen); }, [screen, live.mode, live.pin]); // eslint-disable-line
  const SUMMARY_IDX = SCREEN_META.findIndex(m => m.id === 's16');
  useEffect(() => { if (screen === SUMMARY_IDX) earn('graduate'); }, [screen, SUMMARY_IDX, earn]);
  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, data) => {
    const nextA = { ...answers, [idx]: data };
    setAnswers(nextA);
    // 🏅 dataEye — 3/3 scored testni (DAU · retention · juftlash) to'g'ri yechganda (scored indekslar 4/6/9 = s7/s8/s9)
    if ([4, 6, 9].every(i => nextA[i] && nextA[i].correct)) earn('dataEye');
    const _m = SCREEN_META[idx];
    if (_m && ACH_TRIGGERS[_m.id] && data && data.correct) earn(ACH_TRIGGERS[_m.id]); // 🏅 nishon (faqat REAL solve)
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

  // Tartib — SCREEN_META bilan bir xil: s0,s1,s2,s3,TEST1(s7),s4,TEST2(s8),s5,ustaxona,TEST3(s9),koding,recap,uyga,podium,summary
  const screens = [Screen0, Screen1, Screen2, Screen3, Screen7, Screen4, Screen8, Screen5, ScreenMetricWorkshop, Screen9, ScreenCoding, Screen11, Screen12, ScreenPodium, Screen16];
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
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* Jonli-nishon (LiveBadge) — xira, aralashmaydi; hoverda to'liq ko'rinadi */
        .live-badge { opacity: 0.4; transition: opacity 0.25s ease; }
        .live-badge:hover { opacity: 1; }

        /* === KNOPKALAR === */
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(91,61,230,0.35), 0 0 0 1px rgba(91,61,230,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(91,61,230,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FBFAFE; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.errSoft} !important; color: ${T.err} !important; box-shadow: 0 8px 22px -6px rgba(229,72,77,0.32) !important; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* === MENTORGA ESLATMA (faqat mentor-rejim) === */
        .mnote { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: 12px 15px; display: flex; flex-direction: column; gap: 5px; cursor: pointer; }
        .mnote-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.blue}; display: flex; align-items: center; }
        .mnote-x { margin-left: auto; font-weight: 800; font-size: 10.5px; opacity: 0.7; text-transform: none; letter-spacing: 0; }
        /* Proyektor-sir: yopiq holatda xira chip (LiveBadge oilasi) — o'quvchi diqqatini tortmaydi */
        .mnote-chip { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; background: ${T.paper}; border: 1.5px dashed ${T.blue}; color: ${T.blue}; border-radius: 999px; padding: 4px 12px; font-family: 'Manrope'; font-weight: 800; font-size: 11.5px; letter-spacing: 0.04em; cursor: pointer; opacity: 0.4; transition: opacity 0.2s ease, transform 0.2s ease; }
        .mnote-chip:hover, .mnote-chip:focus-visible { opacity: 1; transform: translateY(-1px); }
        @media (hover: none) { .mnote-chip { opacity: 0.6; } }
        .mnote-body { margin: 0; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; line-height: 1.45; }

        /* === HOOK: menyu-kartochka ovoz-plitkalari === */
        .hook-menu { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px,1.6vw,14px); }
        @media (max-width: 560px) { .hook-menu { grid-template-columns: 1fr; } }
        .hook-mc { position: relative; display: flex; align-items: center; gap: 12px; text-align: left; background: ${T.paper}; border: none; border-radius: 16px; padding: clamp(13px,1.9vw,17px) clamp(14px,2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; overflow: hidden; transition: transform 0.18s, box-shadow 0.18s, background 0.2s; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.18), inset 0 0 0 1.5px ${T.line}; }
        .hook-mc:hover:not(:disabled):not(.on) { transform: translateY(-3px); box-shadow: 0 14px 28px -10px rgba(${T.shadowBase},0.28), inset 0 0 0 1.5px ${T.accent}44; }
        .hook-mc.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 12px 26px -8px rgba(91,61,230,0.34), inset 0 0 0 2px ${T.accent}; }
        .hook-mc:disabled { cursor: default; }
        .hook-mc-abc { flex-shrink: 0; width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 14px; color: ${T.accent}; background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}33; transition: all 0.2s; }
        .hook-mc.on .hook-mc-abc { background: ${T.accent}; color: #fff; box-shadow: none; }
        .hook-mc-txt { flex: 1; line-height: 1.3; }
        .hook-mc-cup { font-size: 22px; opacity: 0.5; flex-shrink: 0; transition: transform 0.25s, opacity 0.2s; }
        .hook-mc.on .hook-mc-cup { opacity: 1; transform: scale(1.15) rotate(-6deg); }
        .hook-mc.taphint { animation: hook-tap 2.4s ease-in-out infinite; }
        .hook-mc.taphint:nth-child(2) { animation-delay: 0.3s; } .hook-mc.taphint:nth-child(3) { animation-delay: 0.6s; } .hook-mc.taphint:nth-child(4) { animation-delay: 0.9s; }
        @keyframes hook-tap { 0%,88%,100% { box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.18), inset 0 0 0 1.5px ${T.line}; } 94% { box-shadow: 0 10px 24px -8px rgba(91,61,230,0.28), inset 0 0 0 1.5px ${T.accent}66; } }

        /* === HOOK: STREAK-ALANGA ZANJIRLARI (dars imzosi) — ovoz sari zanjir uzunlashadi === */
        .streak-shelf { display: flex; flex-direction: column; gap: 12px; background: linear-gradient(180deg, ${T.paper}, #FBFAFE); border-radius: 18px; padding: clamp(14px,2.2vw,20px) clamp(12px,2vw,18px); box-shadow: 0 10px 28px -12px rgba(${T.shadowBase},0.2), inset 0 0 0 1.5px ${T.line}; }
        .streak-rows { display: flex; flex-direction: column; gap: 10px; }
        .streak-row { display: flex; align-items: center; gap: clamp(8px,1.6vw,14px); }
        .streak-abc { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 12px; color: ${T.ink3}; width: 24px; height: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 7px; background: ${T.bg}; transition: background 0.25s, color 0.25s; }
        .streak-row.mine .streak-abc { color: #fff; background: ${T.accent}; }
        .streak-row.top .streak-abc { color: #B7770D; background: #FFF1D6; box-shadow: inset 0 0 0 1px #F5A62366; }
        /* ember-track: zanjir asos-yo'lagi — alanga uning ustida yonadi */
        .streak-chain { display: flex; align-items: center; gap: clamp(2px,0.8vw,5px); flex: 1; min-width: 0; padding: 5px clamp(7px,1.5vw,11px); border-radius: 99px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px ${T.line}, inset 0 2px 5px rgba(${T.shadowBase},0.06); transition: box-shadow 0.3s, background 0.3s; }
        .streak-row.mine .streak-chain { background: linear-gradient(90deg, ${T.accentSoft}, #F3EFFE); box-shadow: inset 0 0 0 1.5px ${T.accent}44, inset 0 2px 5px rgba(91,61,230,0.08); }
        .streak-row.top .streak-chain { background: linear-gradient(90deg, #FFF6E7, #FFEFD4); box-shadow: inset 0 0 0 1.5px #F5A62366, inset 0 2px 6px rgba(255,150,40,0.14); }
        .streak-cell { font-size: clamp(14px,2.4vw,20px); line-height: 1; opacity: 0.24; filter: grayscale(1); transform: none; transition: opacity 0.45s ease, filter 0.45s ease; }
        .streak-cell.lit { opacity: 1; filter: grayscale(0) drop-shadow(0 0 5px rgba(255,140,30,0.5)); animation: streak-flicker 1.9s ease-in-out infinite; }
        .streak-cell.lit:nth-child(2n) { animation-delay: 0.28s; } .streak-cell.lit:nth-child(3n) { animation-delay: 0.55s; } .streak-cell.lit:nth-child(4n) { animation-delay: 0.82s; }
        .streak-row.top .streak-cell { font-size: clamp(16px,2.7vw,23px); }
        .streak-row.top .streak-cell.lit { filter: grayscale(0) drop-shadow(0 0 8px rgba(255,120,20,0.72)); animation-duration: 1.5s; }
        @keyframes streak-flicker { 0%,100% { transform: scale(1.03) rotate(-2deg); } 50% { transform: scale(1.13) rotate(2deg); filter: grayscale(0) drop-shadow(0 0 9px rgba(255,110,15,0.78)) brightness(1.07); } }
        .streak-pct { display: inline-flex; align-items: center; gap: 4px; font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: clamp(13px,1.8vw,16px); color: ${T.ink}; font-variant-numeric: tabular-nums; min-width: 52px; justify-content: flex-end; }
        .streak-row.mine .streak-pct { color: ${T.accent}; }
        .streak-row.top .streak-pct { color: #B7770D; }
        .streak-crown { font-size: clamp(14px,2.2vw,18px); animation: float-sm 2.4s ease-in-out infinite; }
        .streak-cap { margin: 0; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; text-align: center; }
        @media (prefers-reduced-motion: reduce) { .streak-cell { transition: none; } .streak-cell.lit { animation: none; filter: grayscale(0) drop-shadow(0 0 4px rgba(255,140,30,0.45)); } .streak-crown { animation: none; } .hook-mc.taphint { animation: none; } }

        /* === METRIKA FLIP-KARTA (s3 qoida) === */
        .mcard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(10px,1.6vw,14px); }
        @media (max-width: 560px) { .mcard-grid { grid-template-columns: 1fr; } }
        .mcard { position: relative; display: flex; flex-direction: column; align-items: flex-start; text-align: left; gap: 6px; background: ${T.paper}; border: none; border-left: 4px solid ${T.ink3}; border-radius: 6px 14px 14px 6px; padding: clamp(14px,2vw,18px); cursor: pointer; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); transition: transform 0.18s, box-shadow 0.18s; min-height: 118px; }
        .mcard:not(.open):not(:hover) { animation: mcard-tap 2.8s ease-in-out infinite; }
        .mcard-grid .mcard:nth-child(2):not(.open):not(:hover) { animation-delay: 0.45s; } .mcard-grid .mcard:nth-child(3):not(.open):not(:hover) { animation-delay: 0.9s; } .mcard-grid .mcard:nth-child(4):not(.open):not(:hover) { animation-delay: 1.35s; }
        @keyframes mcard-tap { 0%,86%,100% { box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); } 93% { box-shadow: 0 12px 26px -8px rgba(91,61,230,0.26); } }
        .mcard:hover:not(:disabled):not(.open) { transform: translateY(-3px); box-shadow: 0 14px 28px -10px rgba(${T.shadowBase},0.26); }
        .mcard:disabled { cursor: default; }
        .mcard.dau { border-left-color: ${T.blue}; } .mcard.ret { border-left-color: ${T.success}; } .mcard.churn { border-left-color: ${T.err}; } .mcard.ns { border-left-color: #F5A623; }
        .mcard.open { background: linear-gradient(180deg, ${T.paper}, #FBFAFE); box-shadow: 0 10px 24px -8px rgba(${T.shadowBase},0.2), inset 0 0 0 1.5px ${T.line}; animation: mcard-flip 0.5s cubic-bezier(.4,.7,.3,1); }
        .mcard.churn.open { box-shadow: 0 10px 24px -8px rgba(229,72,77,0.16), inset 0 0 0 1.5px ${T.err}33; }
        .mcard.ns.open { background: linear-gradient(180deg, #FFFDF6, #FFF7E6); box-shadow: 0 12px 26px -8px rgba(245,166,35,0.28), inset 0 0 0 1.5px #F5A62355; }
        @keyframes mcard-flip { 0% { transform: perspective(720px) rotateY(-86deg); opacity: 0; } 55% { opacity: 1; } 100% { transform: perspective(720px) rotateY(0); opacity: 1; } }
        .mcard-ic { font-size: clamp(26px,4vw,34px); line-height: 1; }
        .mcard.churn .mcard-ic { filter: drop-shadow(0 2px 5px rgba(229,72,77,0.28)); }
        .mcard.ns .mcard-ic { filter: drop-shadow(0 2px 6px rgba(245,166,35,0.4)); }
        .mcard-name { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; }
        .mcard-short { font-family: 'Manrope'; font-size: 12.5px; color: ${T.ink3}; }
        .mcard-tap { font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: ${T.accent}; margin-top: auto; }
        .mcard.churn .mcard-tap { color: ${T.err}; } .mcard.ns .mcard-tap { color: #B7770D; }
        .mcard-def { font-size: clamp(13px,1.6vw,14.5px); color: ${T.ink2}; line-height: 1.5; } .mcard-def b { color: ${T.ink}; }
        @media (prefers-reduced-motion: reduce) { .mcard:not(.open):not(:hover) { animation: none; } .mcard.open { animation: none; } }

        /* === NORTH STAR VALIDATOR (s5 + ustaxona mini) === */
        .nstar-editor { background: ${T.paper}; border-radius: 14px; border-left: 4px solid ${T.ink3}; padding: 15px 17px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); transition: border-color 0.3s, box-shadow 0.3s, background 0.3s; }
        /* North Star belgilanganda — yumshoq oltin porlash (yulduz-karta hissi) */
        .nstar-editor.ok { border-left-color: #F5A623; background: linear-gradient(180deg, #FFFDF6, #FFF8E9); box-shadow: 0 12px 28px -8px rgba(245,166,35,0.32), inset 0 0 0 1.5px #F5A62333; animation: nstar-gold 0.7s ease-out; }
        @keyframes nstar-gold { 0% { box-shadow: 0 0 0 0 rgba(245,166,35,0); } 45% { box-shadow: 0 0 0 9px rgba(245,166,35,0.16); } 100% { box-shadow: 0 12px 28px -8px rgba(245,166,35,0.32), inset 0 0 0 1.5px #F5A62333; } }
        .nstar-editor.ok .nstar-lead { color: #B7770D; text-shadow: 0 0 12px rgba(245,166,35,0.4); }
        .nstar-editor.mini { padding: 12px 14px; gap: 7px; }
        .nstar-lead { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; letter-spacing: 0.04em; color: ${T.accent}; transition: color 0.3s; }
        @media (prefers-reduced-motion: reduce) { .nstar-editor.ok { animation: none; } }
        .nstar-input { font-family: 'Manrope'; font-weight: 500; font-size: 14.5px; color: ${T.ink}; border: none; border-radius: 10px; padding: 11px 13px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px ${T.line}; outline: none; resize: vertical; line-height: 1.5; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
        .nstar-input:focus { box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .nstar-checks { display: flex; flex-direction: column; gap: 8px; }

        /* === METRIKA-KARTA USTAXONA (ask/gipoteza) === */
        .mwcard-ask, .mwcard-hyp { display: flex; flex-direction: column; gap: 4px; }
        .mwcard-ask > span, .mwcard-hyp > span { font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.06em; color: ${T.ink3}; }
        .mwcard-ask select { font-family: 'Manrope'; font-weight: 500; font-size: 13.5px; color: ${T.ink}; border: none; border-radius: 9px; padding: 9px 11px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px ${T.line}; outline: none; cursor: pointer; }
        .mwcard-ask.on select { box-shadow: inset 0 0 0 1.5px ${T.success}66; background: ${T.paper}; }
        .mwcard-hyp input { font-family: 'Manrope'; font-weight: 500; font-size: 13.5px; color: ${T.ink}; border: none; border-radius: 9px; padding: 9px 11px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px ${T.line}; outline: none; }
        .mwcard-hyp input:focus { box-shadow: inset 0 0 0 1.5px ${T.blue}; }

        /* === MATCHPAIRS — juftlash (s9 TEST-3) === */
        .match-pool { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; min-height: 44px; }
        .match-chip { font-family: 'Manrope'; font-weight: 800; font-size: clamp(14px,1.8vw,16px); padding: 11px 18px; border-radius: 11px; border: none; background: ${T.paper}; color: ${T.accent}; cursor: grab; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.2), inset 0 0 0 1.5px ${T.accent}44; transition: transform 0.16s, box-shadow 0.16s; }
        .match-chip:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 22px -8px rgba(91,61,230,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .match-chip:disabled { cursor: default; }
        .match-chip.sel { background: ${T.accent}; color: #fff; box-shadow: 0 8px 20px -6px rgba(91,61,230,0.42), inset 0 0 0 2px ${T.accent}; }
        .match-chip.dragging { opacity: 0.45; transform: scale(0.92) rotate(-2deg); cursor: grabbing; }
        .match-pool-empty { font-family: 'Manrope'; font-size: 13px; color: ${T.success}; font-weight: 700; }
        .match-hint { text-align: center; color: ${T.ink3}; min-height: 16px; }
        .match-targets { display: flex; flex-direction: column; gap: 10px; }
        .match-target { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.16), inset 0 0 0 1.5px ${T.line}; cursor: pointer; transition: box-shadow 0.2s, background 0.2s, transform 0.16s; }
        .match-target.droppable { box-shadow: 0 8px 20px -8px rgba(91,61,230,0.28), inset 0 0 0 2px ${T.accent}66; }
        .match-target.droppable:hover { transform: translateY(-2px); background: ${T.accentSoft}; box-shadow: 0 12px 26px -8px rgba(91,61,230,0.36), inset 0 0 0 2px ${T.accent}; }
        .match-target.ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}66; animation: match-target-pop 0.44s cubic-bezier(.34,1.5,.4,1); }
        @keyframes match-target-pop { 0% { transform: scale(1); } 40% { transform: scale(1.015) translateY(-2px); } 100% { transform: scale(1); } }
        .match-target.bad { background: ${T.errSoft}; box-shadow: inset 0 0 0 1.5px ${T.err}66; }
        .match-target-q { flex: 1; font-family: 'Source Serif 4', serif; font-size: clamp(14px,1.9vw,17px); color: ${T.ink}; line-height: 1.35; }
        .match-slot { flex-shrink: 0; min-width: clamp(96px,20vw,128px); display: flex; justify-content: center; }
        .match-slot-chip { font-family: 'Manrope'; font-weight: 800; font-size: 13.5px; padding: 8px 12px; border-radius: 9px; background: ${T.accentSoft}; color: ${T.accent}; white-space: nowrap; }
        .match-slot-chip.ok { background: ${T.success}; color: #fff; animation: match-snap 0.42s cubic-bezier(.34,1.55,.4,1); }
        @keyframes match-snap { 0% { transform: scale(0.68); } 48% { transform: scale(1.18); } 100% { transform: scale(1); } }
        .match-slot-chip.bad { background: ${T.err}; color: #fff; }
        @media (prefers-reduced-motion: reduce) { .match-target.ok { animation: none; } .match-slot-chip.ok { animation: none; } }
        .match-slot-empty { font-family: 'Manrope'; font-size: 12px; color: ${T.ink3}; font-style: italic; border: 1.5px dashed ${T.ink3}66; border-radius: 9px; padding: 8px 14px; }
        .hook-hero { display: flex; justify-content: center; }
        .hook-cup { font-size: clamp(48px,10vw,86px); line-height: 1; filter: drop-shadow(0 10px 18px rgba(91,61,230,0.28)); animation: float-sm 2.6s ease-in-out infinite; }
        @keyframes float-sm { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-8px) rotate(3deg); } }

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
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(91,61,230,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(91,61,230,0.55), 0 0 3px rgba(91,61,230,0.4); }

        /* === FRAME === */
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(91,61,230,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr !important; gap: clamp(14px,3vw,20px); } }

        /* === TAKEAWAY === */
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
        .card.hw { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }

        /* === bb-dots (kod-muharrir sarlavhasi) === */
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }

        /* === 🃏 STORY-SILUET — ish stoli ustidagi indeks-kartalar (maqsad) === */
        .story-silo { position: relative; display: flex; align-items: center; gap: 12px; background: linear-gradient(180deg, #fff, #FBFAFE); border-radius: 4px 12px 12px 4px; padding: 13px 16px 13px 22px; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.2); border-left: 4px solid ${T.accent}44; transition: transform 0.22s, box-shadow 0.22s; }
        .story-silo::before { content: ""; position: absolute; left: 11px; top: 12px; width: 6px; height: 6px; border-radius: 50%; background: ${T.accent}33; box-shadow: 0 22px 0 ${T.accent}22; }
        .story-silo:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.26); }
        .story-silo-n { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; }
        .story-silo-slots { display: flex; gap: 8px; flex: 1; flex-wrap: wrap; }
        .silo-slot { font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.06em; padding: 5px 11px; border-radius: 7px; border: 1.5px dashed ${T.ink3}; color: ${T.ink3}; }
        .silo-slot.kim { border-color: ${T.blue}66; color: ${T.blue}; } .silo-slot.nima { border-color: #E8A13A88; color: #B77A16; } .silo-slot.natija { border-color: ${T.success}66; color: ${T.success}; }
        .story-silo-dots { color: ${T.ink3}; letter-spacing: 3px; }
        /* === MAQSAD-EKRAN jonli natija-preview: kartalar ko'z oldida to'ladi (CSS-taymlayn) === */
        .demo-card { opacity: 0; animation: silo-in 0.5s ease-out forwards; animation-delay: var(--cd, 0s); }
        @keyframes silo-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .demo-slot { display: inline-grid; align-items: center; justify-items: center; }
        .demo-slot .silo-lbl { grid-area: 1 / 1; animation: silo-lbl-out 0.3s ease forwards; animation-delay: var(--fd, 1s); }
        @keyframes silo-lbl-out { to { opacity: 0.18; transform: scale(0.92); } }
        .demo-slot .silo-fill { grid-area: 1 / 1; min-width: 0; overflow-wrap: anywhere; word-break: break-word; width: 100%; display: flex; align-items: center; justify-content: center; padding: 0 2px; white-space: nowrap; font-weight: 700; letter-spacing: 0; text-transform: none; background: ${T.paper}; border-radius: 5px; opacity: 0; transform: scale(0.6); animation: silo-fill-pop 0.45s cubic-bezier(.3,1.5,.45,1) forwards; animation-delay: var(--fd, 1s); }
        .silo-slot.kim .silo-fill { background: ${T.blueSoft}; } .silo-slot.nima .silo-fill { background: #FBEED6; } .silo-slot.natija .silo-fill { background: ${T.successSoft}; }
        @keyframes silo-fill-pop { 0% { opacity: 0; transform: scale(0.6); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        .silo-done { width: 22px; height: 22px; border-radius: 50%; background: ${T.success}; color: #fff; font-family: 'Manrope'; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; opacity: 0; transform: scale(0); animation: silo-fill-pop 0.4s cubic-bezier(.3,1.6,.45,1) forwards; animation-delay: var(--fd, 2s); box-shadow: 0 4px 10px -3px rgba(18,169,104,0.5); }
        .silo-cap { margin: 0; font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.accent}; text-align: center; opacity: 0; animation: fade-in-up 0.5s ease-out forwards; animation-delay: 4.9s; }
        @media (prefers-reduced-motion: reduce) {
          .demo-card, .demo-slot .silo-lbl, .demo-slot .silo-fill, .silo-done, .silo-cap { animation: none; opacity: 1; transform: none; }
          .demo-slot .silo-lbl { opacity: 0.35; }
        }

        /* === PROYEKTOR SAVOL + MISOL (yadro) === */
        .proj-q { background: ${T.paper}; border-radius: 14px; padding: clamp(16px,2.5vw,22px); box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); display: flex; flex-direction: column; gap: 8px; border-left: 4px solid ${T.accent}; }
        .proj-q-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: ${T.accent}; }
        .proj-q-body { font-size: clamp(16px,2.3vw,20px); font-weight: 500; color: ${T.ink}; line-height: 1.4; margin: 0; }
        .proj-q.broken { border-left: none; background: repeating-linear-gradient(${T.paper}, ${T.paper} 33px, ${T.line}55 33px, ${T.line}55 34px); box-shadow: 0 12px 30px -12px rgba(${T.shadowBase},0.22), inset 0 0 0 1.5px ${T.line}; position: relative; }
        .proj-q.broken::before { content: "📄"; position: absolute; top: 12px; right: 14px; font-size: 18px; opacity: 0.4; }
        .broken-story { font-family: 'Source Serif 4', serif; font-size: clamp(18px,2.8vw,24px); color: ${T.ink}; margin: 0; line-height: 1.42; }
        .broken-cue { font-size: 13px; color: ${T.ink2}; margin: 0; font-weight: 600; }
        .ex-card { background: ${T.successSoft}; border-radius: 14px; padding: clamp(14px,2.2vw,18px); display: flex; flex-direction: column; gap: 10px; }
        .ex-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.success}; }
        .ex-body { font-size: clamp(15px,2vw,18px); color: ${T.ink}; margin: 0; line-height: 1.45; }
        .ex-tags { display: flex; gap: 8px; flex-wrap: wrap; }
        .ex-tag { font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; padding: 5px 11px; border-radius: 99px; background: ${T.paper}; }
        .ex-tag.kim { color: ${T.blue}; } .ex-tag.nima { color: #B77A16; } .ex-tag.natija { color: ${T.success}; }

        /* === K5 SLAYD (s4) === */
        .k-slide { position: relative; background: ${T.paper}; border-radius: 18px; padding: clamp(24px,4vw,38px) clamp(20px,3.5vw,34px) clamp(20px,3.5vw,34px); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; box-shadow: 0 14px 34px -12px rgba(${T.shadowBase},0.24); overflow: hidden; }
        .k-slide::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, ${T.accent}, ${T.accentVivid}, ${T.blue}); }
        .k-slide-eyebrow { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: clamp(10px,1.3vw,12px); letter-spacing: 0.14em; text-transform: uppercase; color: ${T.accent}; background: ${T.accentSoft}; border-radius: 99px; padding: 5px 14px; }
        .k-slide-ic { font-size: clamp(40px,7vw,64px); line-height: 1; }
        .k-slide-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(20px,3.2vw,30px); color: ${T.ink}; margin: 0; }
        .k-slide-body { font-size: clamp(15px,2vw,18px); color: ${T.ink2}; line-height: 1.55; max-width: 620px; margin: 0; } .k-slide-body b { color: ${T.ink}; }
        .k-dots { display: flex; gap: 8px; justify-content: center; }
        .k-dot { width: 10px; height: 10px; border-radius: 99px; background: rgba(167,166,162,0.4); cursor: pointer; transition: all 0.25s; border: none; padding: 0; }
        .k-dot.fill { background: ${T.ink3}; } .k-dot.cur { background: ${T.accent}; width: 26px; }

        /* === STORY MINI-EDITOR / USTAXONA === */
        .smini, .swcard { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); border-left: 4px solid ${T.ink3}; transition: border-color 0.25s, box-shadow 0.25s; min-width: 0; }
        /* Ustaxonada 3 karta — «dashboard-panel» hissi: burchakda mini-ekran (o'suvchi trend-chizig'i) */
        .swcard { position: relative; }
        .swcard::before { content: ""; position: absolute; top: 13px; right: 14px; width: 48px; height: 17px; border-radius: 5px; background: ${T.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 34'%3E%3Cpolyline points='6,26 28,20 50,23 72,12 94,15 114,6' fill='none' stroke='%235B3DE6' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='114' cy='6' r='4.5' fill='%23F5A623'/%3E%3C/svg%3E") no-repeat center / 34px 11px; box-shadow: inset 0 0 0 1px ${T.line}; opacity: 0.9; pointer-events: none; }
        .swcard.ok::before { background-color: ${T.successSoft}; box-shadow: inset 0 0 0 1px ${T.success}44; }
        .col > .swcard + .swcard { margin-top: 4px; }
        .smini.ok, .swcard.ok { border-left-color: ${T.success}; box-shadow: 0 8px 20px -8px rgba(18,169,104,0.28); animation: card-fill-pop 0.42s cubic-bezier(.34,1.5,.4,1); }
        @keyframes card-fill-pop { 0% { transform: scale(1); } 40% { transform: scale(1.012) translateY(-2px); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .smini.ok, .swcard.ok { animation: none; } }
        /* karta-turi belgisi: ko'chgan (susaygan) vs yangi (indigo) */
        .swcard-tag { align-self: flex-start; font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.04em; padding: 3px 10px; border-radius: 99px; }
        .swcard-tag.kept { color: ${T.ink3}; background: ${T.bg}; box-shadow: inset 0 0 0 1px ${T.line}; }
        .swcard-tag.new { color: ${T.accent}; background: ${T.accentSoft}; }
        /* yangi bo'sh karta = «bo'sh joy chaqiriq» — punktir indigo + yumshoq pulsatsiya (meni to'ldir) */
        .swcard-new { border-left-style: dashed; border-left-color: ${T.accent}; animation: sw-new-pulse 2.4s ease-in-out infinite; }
        @keyframes sw-new-pulse { 0%, 100% { box-shadow: 0 6px 16px -6px rgba(91,61,230,0.14), inset 0 0 0 1.5px ${T.accent}22; } 50% { box-shadow: 0 10px 22px -6px rgba(91,61,230,0.26), inset 0 0 0 1.5px ${T.accent}55; } }
        @media (prefers-reduced-motion: reduce) { .swcard-new { animation: none; box-shadow: 0 6px 16px -6px rgba(91,61,230,0.16), inset 0 0 0 1.5px ${T.accent}33; } }
        .smini-h, .swcard-h { display: flex; align-items: flex-start; gap: 10px; }
        .smini-n, .swcard-n { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .smini-sent, .swcard-sent { font-size: clamp(13px,1.6vw,15px); color: ${T.ink2}; line-height: 1.4; min-width: 0; overflow-wrap: anywhere; word-break: break-word; } .smini-sent b, .swcard-sent b { color: ${T.ink}; }
        .smini-fields, .swcard-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        @media (max-width: 620px) { .smini-fields, .swcard-fields { grid-template-columns: 1fr; } }
        .smini-f { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .smini-f span { font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.06em; color: ${T.ink3}; }
        .smini-f.kim span { color: ${T.blue}; } .smini-f.nima span { color: #B77A16; } .smini-f.natija span { color: ${T.success}; }
        .smini-f input { font-family: 'Manrope'; font-weight: 500; font-size: 14px; color: ${T.ink}; border: none; border-radius: 9px; padding: 9px 11px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px ${T.line}; outline: none; transition: box-shadow 0.18s; width: 100%; }
        .smini-f input:focus { box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .smini-f.on input { box-shadow: inset 0 0 0 1.5px ${T.success}66; background: ${T.paper}; }
        .swcard-star { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .swcard-star-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink2}; }
        .star { background: none; border: none; cursor: pointer; font-size: 18px; color: ${T.ink3}; padding: 0 1px; transition: color 0.15s, transform 0.15s; }
        .star.on { color: #F5A623; } .star:hover { transform: scale(1.2); }
        .swcard-most { margin-left: auto; font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; padding: 5px 12px; border-radius: 99px; border: none; background: ${T.bg}; color: ${T.ink2}; cursor: pointer; box-shadow: inset 0 0 0 1.5px ${T.line}; }
        .swcard-most.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: inset 0 0 0 1.5px ${T.accent}; }

        /* === RO'YXAT / CHECKLIST === */
        .checklist { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 9px; }
        .stcheck { display: flex; align-items: center; gap: 10px; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; font-weight: 500; }
        .stcheck-box { width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}55; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; transition: all 0.2s; }
        .stcheck.on { color: ${T.ink}; } .stcheck.on .stcheck-box { background: ${T.success}; box-shadow: none; animation: lp-check-pop 0.34s cubic-bezier(.3,1.5,.5,1); }
        @keyframes lp-check-pop { 0% { transform: scale(0.7); } 45% { transform: scale(1.3); } 100% { transform: scale(1); } }

        /* === YORDAM (ochiladigan) === */
        .yordam { background: ${T.bg}; border: 1.5px dashed ${T.ink3}66; border-radius: 12px; overflow: hidden; }
        .yordam-toggle { width: 100%; text-align: left; background: none; border: none; padding: 12px 15px; font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.accent}; cursor: pointer; }
        .yordam-body { padding: 0 15px 13px; display: flex; flex-direction: column; gap: 7px; }
        .yordam-body p { font-size: 13.5px; color: ${T.ink2}; margin: 0; } .yordam-body b { color: ${T.ink}; }
        .yordam-hint { color: ${T.accent} !important; font-weight: 700; }
        .star-task { background: ${T.blueSoft}; border-radius: 12px; padding: 12px 15px; display: flex; flex-direction: column; gap: 5px; }

        /* === HOTSPOT (buzuq bo'laklar) === */
        .hs-parts { justify-content: center; }
        .hs-chip { font-family: 'Source Serif 4', serif; font-size: clamp(15px,2.1vw,19px); padding: 12px 18px; border-radius: 12px; border: 2px solid ${T.line}; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.18); }
        .hs-chip:hover:not(:disabled) { border-color: ${T.blue}; transform: translateY(-2px); }
        .hs-chip:disabled { cursor: default; }
        /* buzuq bo'lak TOPILDI = yashil «✓ topdingiz» (xato emas — nishonni topish) */
        .hs-broken { position: relative; background: ${T.successSoft} !important; color: ${T.success} !important; border-color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(18,169,104,0.34) !important; animation: hs-found-pop 0.44s cubic-bezier(.34,1.5,.4,1); }
        .hs-broken::after { content: '✓'; position: absolute; top: -9px; right: -9px; width: 22px; height: 22px; border-radius: 50%; background: ${T.success}; color: #fff; font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px -3px rgba(18,169,104,0.5); }
        @keyframes hs-found-pop { 0% { transform: scale(0.92); } 45% { transform: scale(1.06) translateY(-3px); } 100% { transform: scale(1); } }
        .hs-ok { opacity: 0.45 !important; }
        .hs-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; border-color: ${T.blue} !important; }
        /* o'quvchi NOTO'G'RI bosgan bo'lak = qizil (faqat shu holatda) */
        .hs-miss { background: ${T.errSoft} !important; color: ${T.err} !important; border-color: ${T.err} !important; opacity: 1 !important; text-decoration: line-through; box-shadow: 0 8px 22px -6px rgba(229,72,77,0.28) !important; }
        @media (prefers-reduced-motion: reduce) { .hs-broken { animation: none; } }

        /* === KODING — compiler-panel (natija iframe'da; bo'sh-holat matni) === */
        .code-out-empty { font-family: 'Manrope', sans-serif; font-size: 12.5px; color: ${T.ink3}; font-style: italic; margin: 0; }
        /* Compiler topshiriq-panel (JS-check shartlari — jonli ✓) */
        /* Topshiriq-panel = «brief-hujjat» (chap-accent hoshiya, yumshoq qog'oz) */
        .hc-task { background: linear-gradient(180deg, ${T.paper}, #FBFAFE); border-radius: 14px; border-left: 4px solid ${T.accent}; padding: 15px 17px 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .hc-conds { display: flex; flex-direction: column; gap: 9px; }
        .hc-cond { display: flex; align-items: flex-start; gap: 10px; background: ${T.bg}; border-radius: 11px; padding: 10px 12px; box-shadow: inset 0 0 0 1.5px ${T.line}; transition: box-shadow 0.25s, background 0.25s; }
        .hc-cond.ok { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}55; animation: hc-cond-pop 0.4s cubic-bezier(.34,1.5,.4,1); }
        @keyframes hc-cond-pop { 0% { transform: scale(1); } 42% { transform: scale(1.015) translateY(-1px); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .hc-cond.ok { animation: none; } }
        .hc-cond-box { width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}55; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 800; color: ${T.ink3}; transition: all 0.2s; }
        .hc-cond.ok .hc-cond-box { background: ${T.success}; color: #fff; box-shadow: none; animation: lp-check-pop 0.34s cubic-bezier(.3,1.5,.5,1); }
        .hc-cond-txt { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .hc-cond-label { font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; line-height: 1.35; }
        /* hint = ochiladigan yumshoq indigo maslahat (xato-ogohlantirish EMAS) */
        .hc-cond-hint { font-family: 'Manrope'; font-size: 12px; color: ${T.accent}; line-height: 1.4; background: ${T.accentSoft}; border-radius: 8px; padding: 6px 10px; align-self: flex-start; }

        /* === KODING: launch-karta (darsdan kompilyatorga «boradi») === */
        .kod-launch { position: relative; border-radius: 16px; overflow: hidden; background: ${CODE.bg}; box-shadow: 0 14px 34px -12px rgba(${T.shadowBase},0.35); }
        .kod-launch-bar { background: #141C2B; padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .kod-launch-title { font-family: 'JetBrains Mono'; font-size: 11.5px; color: #7E92B4; }
        .kod-launch-body { padding: 16px 18px; min-height: 190px; min-width: 0; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.7; color: rgba(232,229,221,0.45); white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
        .kod-launch-veil { position: absolute; inset: 42px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(180deg, rgba(26,36,54,0.45), rgba(26,36,54,0.85)); }
        .kod-launch-btn { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: clamp(15px,1.9vw,17px); background: ${T.accent}; color: #fff; border: none; border-radius: 14px; padding: 14px 28px; cursor: pointer; box-shadow: 0 14px 30px -8px rgba(91,61,230,0.65); transition: transform 0.18s, box-shadow 0.18s; animation: kod-btn-pulse 2.2s ease-in-out infinite; }
        .kod-launch-btn:hover { transform: translateY(-2px); box-shadow: 0 18px 36px -8px rgba(110,75,255,0.75); }
        @keyframes kod-btn-pulse { 0%,100% { box-shadow: 0 14px 30px -8px rgba(91,61,230,0.65); } 50% { box-shadow: 0 14px 38px -4px rgba(110,75,255,0.85); } }
        .kod-launch-sub { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: rgba(232,229,221,0.75); text-align: center; padding: 0 14px; }
        @media (prefers-reduced-motion: reduce) { .kod-launch-btn { animation: none; } }

        /* === PM-KOMPILYATOR (to'liq-ekran, Htmllesson1 relslari, PM palitra) === */
        .hcp-root { position: fixed; inset: 0; z-index: 2100; background: radial-gradient(120% 80% at 50% -10%, ${T.accentSoft} 0%, rgba(235,229,253,0) 46%), ${T.bg}; overflow: hidden; animation: fade-step 0.3s ease-out; }
        .hcp-wrap { width: 100%; max-width: 1160px; height: 100dvh; margin: 0 auto; display: flex; flex-direction: column; justify-content: center; gap: clamp(10px,1.6vw,16px); padding: clamp(14px,2.2vw,28px); }
        .hcp-top { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 7px; }
        .hcp-eyebrow { font-family: 'Manrope'; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 800; color: ${T.accent}; display: inline-flex; align-items: center; gap: 7px; }
        .hcp-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: ${T.accent}; }
        .hcp-title { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(20px,2.8vw,30px); margin: 0; color: ${T.ink}; letter-spacing: -0.01em; line-height: 1.12; }
        .hcp-brief { margin: 0; color: ${T.ink2}; font-size: clamp(13px,1.5vw,15px); line-height: 1.55; max-width: 64ch; }
        .hcp-checklist { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
        .hcp-count { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; color: #fff; background: linear-gradient(135deg, ${T.accent}, ${T.accentVivid}); padding: 6px 11px; border-radius: 99px; box-shadow: 0 6px 16px -6px rgba(91,61,230,0.5); }
        .hcp-chip { display: inline-flex; align-items: center; gap: 7px; font-family: 'Manrope'; font-size: 13px; font-weight: 500; color: ${T.ink2}; background: ${T.paper}; padding: 6px 14px 6px 7px; border-radius: 99px; border: 1px solid ${T.line}; transition: all 0.22s ease; cursor: default; min-width: 0; overflow-wrap: anywhere; }
        .hcp-chip.ok { color: ${T.ink}; font-weight: 600; border-color: ${T.success}40; background: ${T.successSoft}; }
        .hcp-dot { flex-shrink: 0; width: 21px; height: 21px; border-radius: 50%; background: ${T.bg}; color: ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; transition: all 0.25s; }
        .hcp-chip.ok .hcp-dot { background: ${T.success}; color: #fff; box-shadow: 0 3px 8px -2px ${T.success}88; }
        .hcp-hint { margin: 3px 0 0; font-family: 'Manrope'; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 8px 15px; border-radius: 11px; max-width: 64ch; line-height: 1.5; overflow-wrap: anywhere; }
        .hcp-err { margin: 3px 0 0; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: ${T.err}; background: ${T.errSoft}; padding: 7px 14px; border-radius: 10px; max-width: 74ch; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }
        .hcp-split { flex: none; height: 58vh; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: clamp(12px,1.6vw,18px); }
        .hcp-pane { display: flex; flex-direction: column; min-height: 0; min-width: 0; border-radius: 18px; overflow: hidden; background: ${T.paper}; box-shadow: 0 1px 0 ${T.line}, 0 18px 40px -22px rgba(${T.shadowBase},0.35); }
        .hcp-pane-bar { display: flex; align-items: center; gap: 10px; padding: 10px 15px; font-family: 'Manrope'; font-size: 12px; font-weight: 600; color: ${T.ink2}; border-bottom: 1px solid ${T.line}; }
        .hcp-pane-bar.dark { background: ${CODE.bg}; color: #A7B6D6; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .hcp-tab { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #fff; background: rgba(255,255,255,0.14); padding: 5px 13px; border-radius: 9px; box-shadow: inset 0 -2px 0 ${T.accent}; }
        .hcp-mini { margin-left: auto; background: ${T.accent}; color: #fff; border: none; border-radius: 9px; padding: 6px 13px; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: 'Manrope', sans-serif; transition: all 0.18s; flex-shrink: 0; box-shadow: 0 6px 14px -6px rgba(91,61,230,0.6); }
        .hcp-mini:hover { transform: translateY(-1px); box-shadow: 0 9px 18px -6px rgba(91,61,230,0.7); }
        .hcp-code { flex: 1; min-height: 0; resize: none; border: none; outline: none; background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: 14px; line-height: 1.7; padding: 18px 20px; tab-size: 2; white-space: pre; overflow: auto; caret-color: ${T.accentVivid}; }
        .hcp-code::placeholder { color: #5B6B86; }
        .hcp-code::selection { background: ${T.accent}55; }
        .hcp-pane-name { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
        .hcp-live { margin-left: auto; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${T.success}; background: ${T.successSoft}; padding: 4px 9px; border-radius: 99px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }
        .hcp-live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: ${T.success}; animation: hcp-pulse 1.8s infinite; }
        @keyframes hcp-pulse { 0% { box-shadow: 0 0 0 0 ${T.success}66; } 70% { box-shadow: 0 0 0 6px ${T.success}00; } 100% { box-shadow: 0 0 0 0 ${T.success}00; } }
        .hcp-frame { flex: 1; min-height: 0; width: 100%; border: none; background: #FBFAFE; }
        .hcp-bottom { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .hcp-ghost { background: transparent; border: 1px solid transparent; color: ${T.ink2}; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; padding: 11px 17px; border-radius: 12px; transition: all 0.15s; }
        .hcp-ghost:hover { background: ${T.paper}; color: ${T.ink}; border-color: ${T.line}; box-shadow: 0 6px 16px -10px rgba(${T.shadowBase},0.3); }
        .hcp-status { margin-left: auto; }
        .hcp-ok-msg { color: ${T.success}; font-family: 'Manrope'; font-weight: 700; font-size: 14px; }
        .hcp-wait-msg { color: ${T.ink3}; font-family: 'Manrope'; font-size: 13px; }
        .hcp-next { background: ${T.accent}; color: #fff; border: none; border-radius: 13px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 15px; cursor: pointer; padding: 13px 30px; box-shadow: 0 10px 24px -8px rgba(91,61,230,0.6); transition: all 0.2s; }
        .hcp-next:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 32px -8px rgba(110,75,255,0.7); }
        .hcp-next:disabled { background: #D7D8DE; color: #fff; cursor: not-allowed; box-shadow: none; }
        @media (max-width: 820px) { .hcp-split { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } .hcp-checklist { width: 100%; } }

        /* === RECAP (juftlik + reflection + savol) === */
        .pair-timer { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 9px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .pair-timer-top { display: flex; align-items: center; justify-content: space-between; }
        .pair-role { font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.ink2}; } .pair-role b { color: ${T.accent}; }
        .pair-clock { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 22px; color: ${T.ink}; font-variant-numeric: tabular-nums; }
        .pair-timer-btns { display: flex; gap: 8px; }
        .reflect { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .reflect-input { font-family: 'Manrope'; font-size: 15px; color: ${T.ink}; border: none; border-radius: 10px; padding: 12px 14px; background: ${T.bg}; box-shadow: inset 0 0 0 1.5px ${T.line}; outline: none; }
        .reflect-input:focus { box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .qa-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 620px) { .qa-cards { grid-template-columns: 1fr; } }
        .qa-card { background: ${T.paper}; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .qa-ic { font-size: 24px; } .qa-card p { font-size: 13.5px; color: ${T.ink}; margin: 0; line-height: 1.4; } .qa-card b { color: ${T.accent}; }

        /* === UYGA VAZIFA kartalari === */
        .hw-card { border-radius: 14px; padding: clamp(15px,2.4vw,20px); display: flex; flex-direction: column; gap: 10px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
        /* «imzolangan shartnoma-hujjat» — oq indeks-karta + chap-accent hoshiya */
        .hw-card.full { background: ${T.paper}; border-left: 5px solid ${T.accent}; box-shadow: 0 12px 28px -10px rgba(91,61,230,0.28); }
        /* qisqa versiya — ikkilamchi ohang (susaygan, punktir) */
        .hw-card.short { background: ${T.bg}; border: 1.5px dashed ${T.ink3}66; box-shadow: none; }
        .hw-badge { align-self: flex-start; font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.05em; padding: 5px 12px; border-radius: 99px; background: ${T.accent}; color: #fff; }
        .hw-badge.short { background: ${T.ink2}; }
        /* Uyga-vazifa SHARTNOMA — tanlov-chiplar */
        .hw-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .hw-chip { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.6vw,15px); padding: 11px 18px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18), inset 0 0 0 1.5px ${T.line}; transition: all 0.18s; }
        .hw-chip:hover:not(.on) { transform: translateY(-2px); box-shadow: 0 10px 22px -8px rgba(${T.shadowBase},0.28), inset 0 0 0 1.5px ${T.accent}55; }
        /* tanlangan = to'ldirilgan indigo (aniq holat) */
        .hw-chip.on { background: ${T.accent}; color: #fff; box-shadow: 0 8px 18px -6px rgba(91,61,230,0.4), inset 0 0 0 2px ${T.accent}; }
        .hw-chip.add { color: ${T.accent}; border-style: dashed; box-shadow: inset 0 0 0 1.5px ${T.accent}55; }
        .hw-chip.add.on { background: ${T.accent}; color: #fff; box-shadow: 0 8px 18px -6px rgba(91,61,230,0.4), inset 0 0 0 2px ${T.accent}; }

        /* === 🔤 KOD-ATAMA CHIP (fmtCode) === */
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }

        /* === 🛠️ JONLI PRAKTIKA (self-report) === */
        .lp-done-btn { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(14px,1.8vw,16px); cursor: pointer; border: none; border-radius: 13px; padding: 14px 20px; background: ${T.ink}; color: ${T.bg}; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.34); transition: all 0.18s; margin-top: 2px; }
        .lp-done-btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 12px 28px -6px rgba(91,61,230,0.5); }
        .lp-done-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .lp-done-btn.is-done { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}66; cursor: default; animation: lp-done-pop 0.44s cubic-bezier(.3,1.35,.5,1); }
        @keyframes lp-done-pop { 0% { transform: scale(1); } 32% { transform: scale(1.05) translateY(-2px); } 60% { transform: scale(0.98); } 100% { transform: scale(1); } }
        .lp-mstats { background: ${T.blueSoft}; border-radius: 12px; padding: 13px 15px; display: flex; flex-direction: column; gap: 6px; }

        /* === 🏅 ACHIEVEMENTS — hisoblagich + bayram === */
        .ach-cnt-wrap { position: relative; }
        .ach-counter { display: inline-flex; align-items: center; gap: 4px; background: ${T.paper}; border: 1.5px solid ${T.line}; border-radius: 99px; padding: 5px 11px 5px 9px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink2}; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .ach-counter.has { border-color: ${T.accent}66; }
        .ach-counter:hover { border-color: ${T.accent}; box-shadow: 0 6px 16px -8px rgba(91,61,230,0.4); }
        .ach-counter b { color: ${T.accent}; font-size: 14px; font-variant-numeric: tabular-nums; }
        .ach-cnt-tot { color: ${T.ink3}; font-size: 11.5px; }
        .ach-cnt-ic { font-size: 14px; }
        .ach-counter.bump { animation: ach-bump 0.8s cubic-bezier(.34,1.6,.4,1); }
        @keyframes ach-bump { 0% { transform: scale(1); } 30% { transform: scale(1.35) rotate(-6deg); box-shadow: 0 0 0 6px rgba(91,61,230,0.18); } 60% { transform: scale(0.96) rotate(3deg); } 100% { transform: scale(1) rotate(0); box-shadow: 0 0 0 0 rgba(91,61,230,0); } }
        .ach-pop { position: absolute; top: calc(100% + 8px); right: 0; z-index: 200; width: 232px; background: ${T.paper}; border: 1px solid ${T.line}; border-radius: 14px; padding: 10px; box-shadow: 0 18px 44px -14px rgba(${T.shadowBase},0.4); display: flex; flex-direction: column; gap: 3px; animation: fade-step 0.22s ease; }
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
        .ach-badge.got { background: linear-gradient(160deg, ${T.accentSoft}, #F5F1FE); border: 1.5px solid ${T.accent}55; }
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
        .pod-dot.bad { background: ${T.err}; }
        .pod-row-score { min-width: 34px; text-align: right; font-size: 12.5px; font-weight: 700; color: ${T.ink}; }
        .pod-row-time { min-width: 46px; text-align: right; font-size: 11.5px; color: ${T.ink3}; }

        /* === ⚡ CODE STRIKE — CTA neon-kapsula (arena STRUKTURASI ⚡ Jonliniki) === */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; border-radius: 18px; }
        .cs-cta { flex-direction: column; align-items: stretch; justify-content: center; text-align: center; gap: 0; position: relative; padding: 0; background: none; border: none; box-shadow: none; }
        .cs-cta .cs-cap { padding: clamp(14px,2vw,24px) clamp(22px,3.2vw,40px); gap: clamp(4px,0.7vw,8px); }
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

        /* === Kahoot-kutish holatlari === */
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; }

        /* === MENTOR STATISTIKASI === */
        .mstats { background: ${T.paper}; border: 1.5px solid rgba(${T.shadowBase},0.12); border-radius: 16px; padding: clamp(14px,2vw,20px); display: flex; flex-direction: column; gap: 12px; box-shadow: 0 10px 30px -12px rgba(${T.shadowBase},0.18); }
        .mstats-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .mstats-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; letter-spacing: 0.07em; text-transform: uppercase; color: ${T.blue}; }
        .mstats-n { font-family: 'Manrope'; font-size: 13.5px; font-weight: 600; color: ${T.ink2}; }
        .mstats-reveal { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; background: ${T.ink}; color: #fff; border: none; border-radius: 99px; padding: 7px 14px; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.35); transition: all 0.2s; }
        .mstats-reveal:hover { background: ${T.accent}; box-shadow: 0 6px 16px -4px rgba(91,61,230,0.5); }
        .mstats-reveal.ready { background: ${T.accent}; animation: mstats-pulse 1.6s ease-in-out infinite; }
        @keyframes mstats-pulse { 0%,100% { box-shadow: 0 4px 12px -4px rgba(91,61,230,0.5); } 50% { box-shadow: 0 4px 18px 0 rgba(91,61,230,0.55); } }
        .mstats-prog { height: 7px; background: rgba(${T.shadowBase},0.09); border-radius: 99px; overflow: hidden; }
        .mstats-prog-fill { display: block; height: 100%; border-radius: 99px; background: ${T.blue}; transition: width 0.6s cubic-bezier(.4,0,.2,1); }
        .mstats-prog-fill.full { background: ${T.success}; }
        .mstats-big { display: flex; gap: 10px; flex-wrap: wrap; }
        .mstats-chip { flex: 1; min-width: 96px; display: flex; flex-direction: column; align-items: center; gap: 2px; border-radius: 14px; padding: clamp(10px,1.6vw,14px) 8px; }
        .mstats-chip-n { font-family: 'Manrope'; font-weight: 800; font-size: clamp(24px,3.4vw,34px); line-height: 1; }
        .mstats-chip-t { font-family: 'Manrope'; font-weight: 600; font-size: 12px; }
        .mstats-chip.okc  { background: ${T.successSoft}; } .mstats-chip.okc .mstats-chip-n, .mstats-chip.okc .mstats-chip-t { color: ${T.success}; }
        .mstats-chip.badc { background: ${T.errSoft}; } .mstats-chip.badc .mstats-chip-n, .mstats-chip.badc .mstats-chip-t { color: ${T.err}; }
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
        .mstats-warn { margin: 0; font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.err}; background: ${T.errSoft}; border-radius: 10px; padding: 9px 12px; }
        .mstats-wait { margin: 0; font-size: 12.5px; color: ${T.ink3}; font-style: italic; }
        @media (max-width: 560px) { .mstats-count { min-width: 78px; font-size: 11px; } }
        .mstats-verdict { border-radius: 12px; padding: 12px 15px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; animation: fade-step 0.3s ease-out; }
        .mstats-verdict.need { background: ${T.errSoft}; border-left: 4px solid ${T.err}; }
        .mstats-verdict.maybe { background: rgba(232,161,58,0.14); border-left: 4px solid #E8A13A; }
        .mstats-verdict.good { background: ${T.successSoft}; border-left: 4px solid ${T.success}; }
        .mstats-verdict.few { background: rgba(167,166,162,0.12); border-left: 4px solid ${T.ink3}; }
        .mstats-verdict-t { margin: 0; font-family: 'Manrope', sans-serif; font-size: clamp(13px,1.6vw,15px); line-height: 1.45; color: ${T.ink}; }
        .rc-open { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.6vw,15px); background: ${T.accent}; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; cursor: pointer; box-shadow: 0 8px 20px -6px rgba(91,61,230,0.5); transition: all 0.2s; }
        .rc-open:hover { transform: translateY(-1px); box-shadow: 0 12px 26px -6px rgba(91,61,230,0.55); }
        .rc-open.soft { background: ${T.paper}; color: ${T.accent}; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.2); }
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
        .rc-vis { margin-top: clamp(4px,1vw,10px); display: flex; justify-content: center; width: 100%; }
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
        @media (max-width: 640px) { .rc-nav { flex-wrap: wrap; justify-content: center; row-gap: 10px; } .rc-dots { width: 100%; order: -1; } .rc-btn { font-size: 13px; padding: 11px 16px; } }

        /* ===== ⚡ ARENA ===== */
        .qz-arena { position: fixed; inset: 0; z-index: 10500; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; padding: clamp(18px,4vw,44px) clamp(12px,3vw,32px); background: radial-gradient(62% 46% at 10% 6%, rgba(124,58,237,0.30) 0%, rgba(124,58,237,0) 56%), radial-gradient(58% 48% at 92% 12%, rgba(15,166,214,0.14) 0%, rgba(15,166,214,0) 55%), radial-gradient(70% 52% at 78% 104%, rgba(255,79,40,0.14) 0%, rgba(255,79,40,0) 60%), radial-gradient(90% 55% at 50% -8%, #26123F 0%, rgba(38,18,63,0) 54%), #140B30; }
        .qz-arena::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: radial-gradient(rgba(190,150,255,0.08) 1.1px, transparent 1.2px); background-size: 24px 24px; -webkit-mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); }
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; text-shadow: 0 0 16px rgba(150,95,255,0.35); animation: qz-drift ease-in-out infinite; will-change: transform; color: rgba(203,173,255,0.16); }
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
        .qz-tile:hover:not(:disabled):not(.rv) { transform: translateY(-3px); }
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
        .qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
        .qz-q .qcode { background: rgba(203,173,255,0.18); color: #F2ECFF; }
        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

        @media (prefers-reduced-motion: reduce) {
          .stcheck.on .stcheck-box, .lp-done-btn.is-done, .hook-cup { animation: none !important; }
        }
      `}</style>
      <AchCtx.Provider value={earned}>
      <LiveGateCtx.Provider value={{ locked, live }}>
        <div className="lesson-root">
          {live.mode === 'choosing' ? (
            <LiveGate live={live} title="Metrika darsi" />
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







