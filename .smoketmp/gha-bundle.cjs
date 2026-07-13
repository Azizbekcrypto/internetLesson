var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/4c-Modull/GithubActionsLesson.jsx
var GithubActionsLesson_exports = {};
__export(GithubActionsLesson_exports, {
  default: () => GithubActionsLesson
});
module.exports = __toCommonJS(GithubActionsLesson_exports);
var import_react = __toESM(require("react"), 1);
var MENTOR_IMG = "https://go.coddycamp.uz/uploads/media_library/c7b711619071c92bef604c7ad68380dd.png";
var T = {
  bg: "#F6F4EF",
  ink: "#0E0E10",
  ink2: "#5A5A60",
  ink3: "#A7A6A2",
  paper: "#FFFFFF",
  accent: "#FF4F28",
  accentSoft: "#FFE8E1",
  success: "#1F7A4D",
  successSoft: "#E3F0E8",
  blue: "#019ACB",
  blueSoft: "#E2F4FA",
  danger: "#C2362B",
  dangerSoft: "#FAE3E0",
  amber: "#B45309",
  line: "#E9E6DF",
  shadowBase: "58, 53, 48"
};
var CODE = { bg: "#1A2436", text: "#E8E5DD", tag: "#FF7755", attr: "#FFD380", str: "#7DD181", comment: "#6B7585", punct: "#9FB4D8" };
var LIVE_SUPABASE_URL = "https://dwoubexcexzsinogojiu.supabase.co";
var LIVE_SUPABASE_KEY = "sb_publishable_cijLMhCDDdo6dlXs05thyw__oH-YgKX";
var LIVE_ENABLED = !!(LIVE_SUPABASE_URL && LIVE_SUPABASE_KEY);
var LIVE_POLL_MS = 2500;
var LIVE_POLL_MAX_MS = 15e3;
var LIVE_HEARTBEAT_MS = 1e4;
var LIVE_STALE_MS = 6e4;
var LT = { bg: "#F6F4EF", ink: "#0E0E10", ink2: "#5A5A60", ink3: "#A7A6A2", paper: "#FFFFFF", accent: "#FF4F28", accentSoft: "#FFE8E1", success: "#1F7A4D" };
var _liveHdr = { apikey: LIVE_SUPABASE_KEY, Authorization: `Bearer ${LIVE_SUPABASE_KEY}` };
async function liveRpc(fn, body) {
  const r = await fetch(`${LIVE_SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ..._liveHdr, "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  if (!r.ok) {
    let msg = "";
    try {
      msg = JSON.parse(await r.text()).message || "";
    } catch {
    }
    throw new Error(msg || `${fn}: ${r.status}`);
  }
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
async function liveGet(pin) {
  const r = await fetch(`${LIVE_SUPABASE_URL}/rest/v1/live_sessions?pin=eq.${encodeURIComponent(pin)}&select=lesson_id,max_screen,status,updated_at,quiz_state,quiz_q,quiz_started_at,reveal_screen`, { headers: _liveHdr });
  if (!r.ok) throw new Error(`get: ${r.status}`);
  const rows = await r.json();
  return rows && rows[0] || null;
}
var _lsKey = (id) => `liveSession:${id}`;
var liveRead = (id) => {
  try {
    return JSON.parse(localStorage.getItem(_lsKey(id)) || "null");
  } catch {
    return null;
  }
};
var liveStore = (id, o) => {
  try {
    localStorage.setItem(_lsKey(id), JSON.stringify(o));
  } catch {
  }
};
var liveClear = (id) => {
  try {
    localStorage.removeItem(_lsKey(id));
  } catch {
  }
};
var fmtPin = (p) => p ? String(p).replace(/(\d{3})(\d{3})/, "$1 $2") : "";
var LIVE_NICK_KEY = "liveNickname";
var nickRead = () => {
  try {
    return localStorage.getItem(LIVE_NICK_KEY) || "";
  } catch {
    return "";
  }
};
var nickStore = (n) => {
  try {
    localStorage.setItem(LIVE_NICK_KEY, n);
  } catch {
  }
};
async function liveList(path) {
  const r = await fetch(`${LIVE_SUPABASE_URL}/rest/v1/${path}`, { headers: _liveHdr });
  if (!r.ok) throw new Error(`list: ${r.status}`);
  return r.json();
}
var livePlayers = (pin) => liveList(`live_players?pin=eq.${encodeURIComponent(pin)}&select=id,nickname,joined_at&order=joined_at.asc`);
var liveAnswers = (pin, screenIdx) => liveList(`live_answers?pin=eq.${encodeURIComponent(pin)}${screenIdx == null ? "&screen_idx=lt.100" : `&screen_idx=eq.${screenIdx}`}&select=player_id,screen_idx,picked,correct,elapsed_ms`);
var liveQuizAnswers = (pin) => liveList(`live_answers?pin=eq.${encodeURIComponent(pin)}&screen_idx=gte.100&select=player_id,screen_idx,picked,correct,elapsed_ms`);
function useLiveSession(lessonId, answerKey) {
  const keyRef = (0, import_react.useRef)(answerKey);
  keyRef.current = answerKey;
  const initRef = (0, import_react.useRef)(void 0);
  if (initRef.current === void 0) initRef.current = LIVE_ENABLED ? liveRead(lessonId) : null;
  const init = initRef.current;
  const [mode, setMode] = (0, import_react.useState)(() => {
    if (!LIVE_ENABLED) return "self";
    if (init?.mode === "self") return "self";
    if (init?.mode === "student") return "student";
    if (init?.mode === "mentor") return "mentor";
    return "choosing";
  });
  const [pin, setPin] = (0, import_react.useState)(init?.pin || null);
  const tokenRef = (0, import_react.useRef)(init?.token || null);
  const playerRef = (0, import_react.useRef)(init?.playerId ? { id: init.playerId, token: init.playerToken } : null);
  const nickRef = (0, import_react.useRef)(init?.nickname || "");
  const [mentorScreen, setMentorScreen] = (0, import_react.useState)(init?.lastScreen || 0);
  const [status, setStatus] = (0, import_react.useState)("live");
  const [mentorAlive, setMentorAlive] = (0, import_react.useState)(true);
  const [connected, setConnected] = (0, import_react.useState)(true);
  const [ended, setEnded] = (0, import_react.useState)(false);
  const [joinError, setJoinError] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [quiz, setQuiz] = (0, import_react.useState)({ state: "off", q: -1 });
  const [revealScreen, setRevealScreen] = (0, import_react.useState)(-1);
  const lastSeenRef = (0, import_react.useRef)(Date.now());
  const lastUpdatedRef = (0, import_react.useRef)(null);
  const syncQuiz = (0, import_react.useCallback)((row) => {
    const qs = row?.quiz_state || "off", qq = row?.quiz_q ?? -1;
    setQuiz((p) => p.state === qs && p.q === qq ? p : { state: qs, q: qq });
    const rv = row?.reveal_screen ?? -1;
    setRevealScreen((p) => p === rv ? p : rv);
  }, []);
  (0, import_react.useEffect)(() => {
    if (mode !== "student" || !pin) return;
    let on = true, timer = null, delay = LIVE_POLL_MS;
    const schedule = () => {
      if (on) timer = setTimeout(tick, delay);
    };
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        schedule();
        return;
      }
      try {
        const row = await liveGet(pin);
        if (!on) return;
        delay = LIVE_POLL_MS;
        setConnected(true);
        if (!row) {
          setStatus((p) => p === "ended" ? p : "ended");
          schedule();
          return;
        }
        setMentorScreen((p) => p === row.max_screen ? p : row.max_screen);
        setStatus((p) => p === row.status ? p : row.status);
        syncQuiz(row);
        if (row.updated_at !== lastUpdatedRef.current) {
          lastUpdatedRef.current = row.updated_at;
          lastSeenRef.current = Date.now();
          liveStore(lessonId, { mode: "student", pin, lastScreen: row.max_screen, playerId: playerRef.current?.id, playerToken: playerRef.current?.token, nickname: nickRef.current });
        }
        const alive = Date.now() - lastSeenRef.current < LIVE_STALE_MS;
        setMentorAlive((p) => p === alive ? p : alive);
      } catch {
        if (!on) return;
        setConnected(false);
        delay = Math.min(delay * 2, LIVE_POLL_MAX_MS);
      }
      schedule();
    };
    tick();
    const onVis = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        delay = LIVE_POLL_MS;
        tick();
      }
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis);
    return () => {
      on = false;
      clearTimeout(timer);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis);
    };
  }, [mode, pin, lessonId]);
  (0, import_react.useEffect)(() => {
    if (mode !== "mentor" || !pin) return;
    let on = true;
    liveGet(pin).then((row) => {
      if (!on) return;
      if (!row || row.status === "ended") {
        liveClear(lessonId);
        setPin(null);
        tokenRef.current = null;
        setMode("choosing");
        setEnded(false);
        return;
      }
      syncQuiz(row);
    }).catch(() => {
    });
    const id = setInterval(() => {
      liveRpc("session_heartbeat", { p_pin: pin, p_token: tokenRef.current }).catch(() => {
      });
    }, LIVE_HEARTBEAT_MS);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, [mode, pin, lessonId]);
  const startMentor = (0, import_react.useCallback)(async (mentorCode) => {
    setBusy(true);
    setJoinError("");
    try {
      const res = await liveRpc("create_session", { p_lesson_id: lessonId, p_mentor_code: (mentorCode || "").trim() });
      const row = Array.isArray(res) ? res[0] : res;
      if (!row?.pin) throw new Error("no pin");
      tokenRef.current = row.token;
      setPin(row.pin);
      setMode("mentor");
      setEnded(false);
      liveStore(lessonId, { mode: "mentor", pin: row.pin, token: row.token });
      if (keyRef.current) liveRpc("set_quiz_keys", { p_lesson_id: lessonId, p_mentor_code: (mentorCode || "").trim(), p_keys: keyRef.current }).catch(() => {
      });
    } catch {
      setJoinError("Mentor kodi noto'g'ri yoki ulanishda xato.");
    } finally {
      setBusy(false);
    }
  }, [lessonId]);
  const joinStudent = (0, import_react.useCallback)(async (raw, rawNick) => {
    const p = (raw || "").replace(/\D/g, "");
    const nick = (rawNick || "").trim();
    if (p.length < 4) {
      setJoinError("Kodni to'liq kiriting.");
      return;
    }
    if (nick.length < 2) {
      setJoinError("Ismingizni kiriting (kamida 2 harf).");
      return;
    }
    setBusy(true);
    setJoinError("");
    try {
      const row = await liveGet(p);
      if (!row) {
        setJoinError("Bunday kod topilmadi.");
        setBusy(false);
        return;
      }
      if (row.lesson_id && row.lesson_id !== lessonId) {
        setJoinError("Bu kod boshqa darsga tegishli.");
        setBusy(false);
        return;
      }
      if (row.status !== "live") {
        setJoinError("Bu dars allaqachon yakunlangan.");
        setBusy(false);
        return;
      }
      const res = await liveRpc("join_session", { p_pin: p, p_nickname: nick });
      const player = Array.isArray(res) ? res[0] : res;
      if (!player?.player_id) throw new Error("no player");
      playerRef.current = { id: player.player_id, token: player.token };
      nickRef.current = nick;
      nickStore(nick);
      lastUpdatedRef.current = row.updated_at;
      lastSeenRef.current = Date.now();
      setPin(p);
      setMentorScreen(row.max_screen);
      setStatus(row.status);
      setMode("student");
      liveStore(lessonId, { mode: "student", pin: p, lastScreen: row.max_screen, playerId: player.player_id, playerToken: player.token, nickname: nick });
    } catch (e) {
      const m = String(e?.message || "");
      setJoinError(/ism|band|kod|dars|belgi/i.test(m) ? m : "Ulanib bo'lmadi. Internetni tekshiring.");
    } finally {
      setBusy(false);
    }
  }, [lessonId]);
  const selfStudy = (0, import_react.useCallback)(() => {
    setMode("self");
    liveStore(lessonId, { mode: "self" });
  }, [lessonId]);
  const reportScreen = (0, import_react.useCallback)((idx) => {
    if (mode === "mentor" && pin) liveRpc("advance_session", { p_pin: pin, p_token: tokenRef.current, p_screen: idx }).catch(() => {
    });
  }, [mode, pin]);
  const endSession = (0, import_react.useCallback)(() => {
    if (mode === "mentor" && pin) {
      liveRpc("end_session", { p_pin: pin, p_token: tokenRef.current }).catch(() => {
      });
      setEnded(true);
    }
  }, [mode, pin]);
  const submitAnswer = (0, import_react.useCallback)((screenIdx, questionId, picked, correct, elapsedMs) => {
    if (mode !== "student" || !pin || !playerRef.current) return;
    const body = {
      p_pin: pin,
      p_player_id: playerRef.current.id,
      p_token: playerRef.current.token,
      p_screen: screenIdx,
      p_question_id: questionId || "",
      p_picked: picked,
      p_correct: !!correct,
      p_elapsed_ms: Math.max(0, Math.round(elapsedMs || 0))
    };
    const attempt = (n) => {
      liveRpc("submit_answer", body).catch(() => {
        if (n < 3) setTimeout(() => attempt(n + 1), 3e3 * (n + 1));
      });
    };
    attempt(0);
  }, [mode, pin]);
  const quizControl = (0, import_react.useCallback)(async (state, q) => {
    if (mode !== "mentor" || !pin) throw new Error("mentor emas");
    await liveRpc("quiz_control", { p_pin: pin, p_token: tokenRef.current, p_state: state, p_q: q ?? -1 });
    setQuiz({ state, q: q ?? -1 });
  }, [mode, pin]);
  const mentorReveal = (0, import_react.useCallback)((screenIdx) => {
    if (mode !== "mentor" || !pin) return;
    setRevealScreen(screenIdx);
    liveRpc("reveal_screen", { p_pin: pin, p_token: tokenRef.current, p_screen: screenIdx }).catch(() => {
    });
  }, [mode, pin]);
  return { mode, pin, mentorScreen, status, mentorAlive, connected, ended, joinError, busy, startMentor, joinStudent, selfStudy, reportScreen, endSession, submitAnswer, quiz, quizControl, revealScreen, mentorReveal, playerId: playerRef.current?.id || null, nickname: nickRef.current };
}
var _liveBtnPri = { background: LT.accent, color: "#fff", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer" };
var _liveBadgeS = { position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 9998, background: LT.paper, border: `1px solid ${LT.ink3}55`, borderRadius: 99, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: LT.ink2, boxShadow: "0 2px 10px rgba(58,53,48,0.12)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", maxWidth: "92vw" };
var _liveDot = (c) => ({ width: 8, height: 8, borderRadius: 99, background: c, display: "inline-block" });
function LiveBigCode({ pin, onClose }) {
  const digits = String(pin || "").split("");
  const overlay = { position: "fixed", inset: 0, zIndex: 1e4, background: LT.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px,4vw,40px)", textAlign: "center" };
  const box = { background: LT.paper, color: LT.ink, borderRadius: "clamp(10px,1.6vw,18px)", fontFamily: "monospace", fontWeight: 800, lineHeight: 1, fontSize: "clamp(48px,13vw,150px)", padding: "clamp(10px,2vw,28px) clamp(12px,2.2vw,30px)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)" };
  return /* @__PURE__ */ import_react.default.createElement("div", { style: overlay }, /* @__PURE__ */ import_react.default.createElement("div", { style: { fontSize: "clamp(13px,2vw,18px)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LT.accent, marginBottom: "clamp(14px,3vw,28px)" } }, "Jonli darsga qo'shilish"), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", gap: "clamp(6px,1.4vw,16px)", justifyContent: "center", flexWrap: "wrap" } }, digits.map((d, i) => /* @__PURE__ */ import_react.default.createElement("span", { key: i, style: box }, d))), /* @__PURE__ */ import_react.default.createElement("p", { style: { color: "#fff", opacity: 0.85, fontSize: "clamp(15px,2.2vw,22px)", maxWidth: 640, margin: "clamp(20px,4vw,36px) 0 0", lineHeight: 1.5 } }, "Shu darsni o'z qurilmangizda oching \u2192 ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: "#fff" } }, "\xAB\u{1F468}\u200D\u{1F393} O'quvchiman\xBB"), " \u2192 ushbu kodni kiriting."), /* @__PURE__ */ import_react.default.createElement("button", { onClick: onClose, style: { marginTop: "clamp(22px,4vw,40px)", background: LT.accent, color: "#fff", border: "none", borderRadius: 14, padding: "clamp(12px,1.6vw,16px) clamp(24px,3vw,36px)", fontSize: "clamp(15px,1.8vw,18px)", fontWeight: 700, cursor: "pointer" } }, "Darsni boshlash \u2192"));
}
function LiveGate({ live, title = "Jonli dars" }) {
  const [code, setCode] = (0, import_react.useState)("");
  const [nick, setNick] = (0, import_react.useState)(() => nickRead());
  const [mentorCode, setMentorCode] = (0, import_react.useState)("");
  const [role, setRole] = (0, import_react.useState)("student");
  const card = { position: "relative", width: "100%", maxWidth: 420, background: LT.paper, borderRadius: 20, padding: "clamp(24px,4vw,36px)", boxShadow: "0 10px 40px -12px rgba(58,53,48,0.22)", display: "flex", flexDirection: "column", gap: 18 };
  const wrap = { minHeight: "calc(100dvh / var(--lz, 1))", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 };
  const link = { background: "none", border: "none", color: LT.ink3, fontSize: 13, cursor: "pointer", alignSelf: "center" };
  if (role === "mentor") {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: wrap }, /* @__PURE__ */ import_react.default.createElement("div", { style: card }, /* @__PURE__ */ import_react.default.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ import_react.default.createElement("h2", { style: { fontFamily: "Georgia, serif", fontSize: "clamp(22px,3vw,28px)", color: LT.ink, margin: "0 0 4px" } }, "\u{1F9D1}\u200D\u{1F3EB} Mentor kirishi"), /* @__PURE__ */ import_react.default.createElement("p", { style: { color: LT.ink2, fontSize: 14, margin: 0 } }, "Mentor kodini kiriting.")), /* @__PURE__ */ import_react.default.createElement("input", { value: mentorCode, onChange: (e) => setMentorCode(e.target.value), type: "password", autoFocus: true, placeholder: "Mentor kodi", onKeyDown: (e) => {
      if (e.key === "Enter") live.startMentor(mentorCode);
    }, style: { width: "100%", padding: "14px", border: `2px solid ${LT.ink3}55`, borderRadius: 14, fontSize: 18, fontWeight: 600, textAlign: "center", outline: "none" } }), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => live.startMentor(mentorCode), disabled: live.busy, style: _liveBtnPri }, live.busy ? "Tekshirilmoqda\u2026" : "Kirish \u2192"), live.joinError && /* @__PURE__ */ import_react.default.createElement("div", { style: { color: LT.accent, fontSize: 13, textAlign: "center" } }, live.joinError), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => {
      setRole("student");
      setMentorCode("");
    }, style: link }, "\u2190 Orqaga")));
  }
  return /* @__PURE__ */ import_react.default.createElement("div", { style: wrap }, /* @__PURE__ */ import_react.default.createElement("div", { style: card }, /* @__PURE__ */ import_react.default.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ import_react.default.createElement("div", { style: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: LT.accent } }, title), /* @__PURE__ */ import_react.default.createElement("h2", { style: { fontFamily: "Georgia, serif", fontSize: "clamp(22px,3vw,28px)", color: LT.ink, margin: "6px 0 4px" } }, "Darsga qo'shilish"), /* @__PURE__ */ import_react.default.createElement("p", { style: { color: LT.ink2, fontSize: 14, margin: 0 } }, "Mentor bergan kodni va ismingizni kiriting.")), /* @__PURE__ */ import_react.default.createElement("input", { value: code, onChange: (e) => setCode(e.target.value), inputMode: "numeric", autoFocus: true, placeholder: "483 920", style: { width: "100%", padding: "16px 14px", border: `2px solid ${LT.ink3}55`, borderRadius: 14, fontSize: 28, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.12em", textAlign: "center", outline: "none" } }), /* @__PURE__ */ import_react.default.createElement("input", { value: nick, onChange: (e) => setNick(e.target.value), maxLength: 24, placeholder: "Ismingiz (masalan: Ali)", onKeyDown: (e) => {
    if (e.key === "Enter") live.joinStudent(code, nick);
  }, style: { width: "100%", padding: "13px 14px", border: `2px solid ${LT.ink3}55`, borderRadius: 14, fontSize: 17, fontWeight: 600, textAlign: "center", outline: "none" } }), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => live.joinStudent(code, nick), disabled: live.busy, style: _liveBtnPri }, live.busy ? "Ulanmoqda\u2026" : "Qo'shilish \u2192"), live.joinError && /* @__PURE__ */ import_react.default.createElement("div", { style: { color: LT.accent, fontSize: 13, textAlign: "center" } }, live.joinError), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => {
    setRole("mentor");
    setCode("");
  }, title: "Mentor", "aria-label": "Mentor", style: { position: "absolute", bottom: 10, right: 12, background: "none", border: "none", fontSize: 16, opacity: 0.3, cursor: "pointer", lineHeight: 1, padding: 4 } }, "\u{1F9D1}\u200D\u{1F3EB}")));
}
function LiveBadge({ live, total }) {
  const [bigOpen, setBigOpen] = (0, import_react.useState)(false);
  const [nPlayers, setNPlayers] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    if (live.mode !== "mentor" || !live.pin || live.ended) return;
    let on = true, t = null;
    const tick = async () => {
      try {
        const rows = await livePlayers(live.pin);
        if (on) setNPlayers(rows.length);
      } catch {
      }
      if (on) t = setTimeout(tick, 6e3);
    };
    tick();
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, [live.mode, live.pin, live.ended]);
  if (live.mode === "mentor") {
    if (live.ended) return /* @__PURE__ */ import_react.default.createElement("div", { className: "live-badge", style: _liveBadgeS }, /* @__PURE__ */ import_react.default.createElement("span", { style: _liveDot(LT.ink3) }), " \u{1F513} O'quvchilar erkin qilindi");
    return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, bigOpen && /* @__PURE__ */ import_react.default.createElement(LiveBigCode, { pin: live.pin, onClose: () => setBigOpen(false) }), /* @__PURE__ */ import_react.default.createElement("div", { className: "live-badge", style: _liveBadgeS }, /* @__PURE__ */ import_react.default.createElement("span", { style: _liveDot(LT.success) }), " Kod: ", /* @__PURE__ */ import_react.default.createElement("b", { style: { fontFamily: "monospace", letterSpacing: "0.08em" } }, fmtPin(live.pin)), nPlayers !== null && /* @__PURE__ */ import_react.default.createElement("span", { style: { color: LT.ink2 } }, "\u{1F465} ", nPlayers), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => setBigOpen(true), title: "Kodni katta ko'rsatish", style: { marginLeft: 6, background: LT.ink, color: "#fff", border: "none", borderRadius: 99, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" } }, "\u{1F4FA} Ko'rsatish"), /* @__PURE__ */ import_react.default.createElement("button", { onClick: () => {
      if (window.confirm("O'quvchilarni ozod qilasizmi? Ular o'zlari erkin davom etadi.")) live.endSession();
    }, style: { background: LT.accentSoft, color: LT.accent, border: "none", borderRadius: 99, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" } }, "\u{1F513} Erkin qilish")));
  }
  if (live.mode === "student") {
    if (live.status === "ended") return /* @__PURE__ */ import_react.default.createElement("div", { className: "live-badge", style: _liveBadgeS }, /* @__PURE__ */ import_react.default.createElement("span", { style: _liveDot(LT.success) }), " \u{1F513} Erkin rejim \u2014 o'zingiz davom eting");
    if (!live.mentorAlive) return /* @__PURE__ */ import_react.default.createElement("div", { className: "live-badge", style: _liveBadgeS }, /* @__PURE__ */ import_react.default.createElement("span", { style: _liveDot(LT.ink3) }), " \u26A0\uFE0F Mentor uzildi \u2014 erkin rejim");
    if (!live.connected) return /* @__PURE__ */ import_react.default.createElement("div", { className: "live-badge", style: _liveBadgeS }, /* @__PURE__ */ import_react.default.createElement("span", { style: _liveDot("#FFD380") }), " \u{1F504} Qayta ulanmoqda\u2026");
    return /* @__PURE__ */ import_react.default.createElement("div", { className: "live-badge", style: _liveBadgeS }, /* @__PURE__ */ import_react.default.createElement("span", { style: _liveDot(LT.success) }), " \u{1F468}\u200D\u{1F3EB} Mentor: ", Math.min(live.mentorScreen + 1, total), " / ", total, live.nickname && /* @__PURE__ */ import_react.default.createElement("span", { style: { color: LT.ink3 } }, "\xB7 ", live.nickname));
  }
  return null;
}
var LangContext = (0, import_react.createContext)("uz");
var MentorCtx = (0, import_react.createContext)(null);
var AchCtx = (0, import_react.createContext)(null);
var LiveGateCtx = (0, import_react.createContext)(null);
var fmtCode = (s) => typeof s === "string" && s.includes("`") ? s.split("`").map((p, i) => i % 2 ? /* @__PURE__ */ import_react.default.createElement("code", { className: "qcode", key: i }, p) : p) : s;
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = (0, import_react.useState)(typeof window !== "undefined" ? window.innerWidth < breakpoint : false);
  (0, import_react.useEffect)(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}
var LESSON_META = { lessonId: "github-actions-4c-02-v18", lessonTitle: { uz: "GitHub Actions \u2014 yo'l xaritasini yozish", ru: "GitHub Actions \u2014 \u043D\u0430\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043A\u0430\u0440\u0442\u044B \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0430" } };
var SCREEN_META = [
  { id: "s0", type: "hook", template: "custom", scored: false, scope: "hook" },
  { id: "s1", type: "rule", template: "custom", scored: false, scope: null },
  { id: "s2", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s3", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s4", type: "test", template: "MCScreen", scored: true, scope: "module-mikro" },
  { id: "s5", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s6", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s7", type: "test", template: "MCScreen", scored: true, scope: "module-mikro" },
  { id: "s8", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s9", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s10", type: "test", template: "MCScreen", scored: true, scope: "module-mikro" },
  { id: "s11", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s12", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s13", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s14", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s15", type: "test", template: "MCScreen", scored: true, scope: "module-mikro" },
  { id: "s16", type: "exploration", template: "custom", scored: false, scope: null },
  { id: "s17", type: "case", template: "custom", scored: false, scope: null },
  { id: "s18", type: "test", template: "custom", scored: true, scope: "final" },
  { id: "practice", type: "practice", template: "custom", scored: false, scope: null },
  { id: "podium", type: "stats", template: "custom", scored: false, scope: null },
  { id: "sflash", type: "flashcards", template: "custom", scored: false, scope: null },
  { id: "s19", type: "summary", template: "custom", scored: false, scope: null }
];
var TOTAL_SCREENS = SCREEN_META.length;
var SCORED_IDX = SCREEN_META.map((m, i) => m.scored ? i : null).filter((i) => i !== null);
var Split = ({ children }) => /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, children);
var Zoomable = ({ children }) => {
  const [big, setBig] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (!big) return;
    const onKey = (e) => {
      if (e.key === "Escape") setBig(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [big]);
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, big && /* @__PURE__ */ import_react.default.createElement("div", { className: "zoom-backdrop", onClick: () => setBig(false) }), /* @__PURE__ */ import_react.default.createElement("div", { className: `zoomable ${big ? "zoom-on" : ""}` }, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "zoom-btn", onClick: () => setBig((b) => !b), "aria-label": big ? "Kichraytirish" : "Kattalashtirish", title: big ? "Kichraytirish" : "Kattalashtirish" }, big ? "\u2715" : "\u26F6"), children));
};
var Col = ({ children, gap }) => /* @__PURE__ */ import_react.default.createElement("div", { className: "col", style: gap ? { gap } : void 0 }, children);
function AchCounter() {
  const earned = (0, import_react.useContext)(AchCtx);
  const count = earned ? earned.size : 0;
  const total = Object.keys(ACHIEVEMENTS).length;
  const prevRef = (0, import_react.useRef)(count);
  const [bump, setBump] = (0, import_react.useState)(false);
  const [open, setOpen] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (count > prevRef.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 800);
      prevRef.current = count;
      return () => clearTimeout(t);
    }
    prevRef.current = count;
  }, [count]);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "ach-cnt-wrap" }, /* @__PURE__ */ import_react.default.createElement("button", { className: `ach-counter ${bump ? "bump" : ""} ${count > 0 ? "has" : ""}`, onClick: () => setOpen((o) => !o), "aria-label": "Badges", title: "Badges" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "ach-cnt-ic" }, "\u{1F3C5}"), /* @__PURE__ */ import_react.default.createElement("b", null, count), /* @__PURE__ */ import_react.default.createElement("span", { className: "ach-cnt-tot" }, "/", total)), open && /* @__PURE__ */ import_react.default.createElement("div", { className: "ach-pop", onMouseLeave: () => setOpen(false) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "ach-pop-h" }, "\u{1F3C5} Badges \u2014 ", count, "/", total), Object.entries(ACHIEVEMENTS).map(([id, a]) => {
    const got = !!(earned && earned.has(id));
    return /* @__PURE__ */ import_react.default.createElement("div", { key: id, className: `ach-pop-row ${got ? "got" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: "ach-pop-ic" }, got ? a.icon : "\u{1F512}"), /* @__PURE__ */ import_react.default.createElement("span", { className: "ach-pop-nm" }, a.name));
  })));
}
var Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic, scrollSignal }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 60;
  const [mCollapsed, setMCollapsed] = (0, import_react.useState)(false);
  const contentRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    setMCollapsed(false);
  }, [screen]);
  (0, import_react.useEffect)(() => {
    if (!scrollSignal || !isNarrow) return;
    const el = contentRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 240);
    return () => clearTimeout(t);
  }, [scrollSignal, isNarrow]);
  const setCollapsed = (0, import_react.useCallback)((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) {
      const el = contentRef.current;
      requestAnimationFrame(() => {
        if (el) el.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    if (e.target && e.target.closest && e.target.closest(".mentor")) return;
    setMCollapsed(true);
  };
  const onContentScroll = () => {
    if (!collapseOn || mCollapsed) return;
    const el = contentRef.current;
    if (el && el.scrollTop > 6) setMCollapsed(true);
  };
  return /* @__PURE__ */ import_react.default.createElement(MentorCtx.Provider, { value: { enabled: collapseOn, collapsed: mCollapsed, setCollapsed } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "stage" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "stage-header", style: { paddingLeft: padH, paddingRight: padH } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "progress-track" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "progress-bar", style: { width: `${(screen + 1) / totalScreens * 100}%` } })), /* @__PURE__ */ import_react.default.createElement("div", { className: "chrome" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "chrome-left eyebrow" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "dot" }), /* @__PURE__ */ import_react.default.createElement("span", null, eyebrow)), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ import_react.default.createElement(AchCounter, null), /* @__PURE__ */ import_react.default.createElement("div", { className: "mono small", style: { color: T.ink3 } }, String(screen + 1).padStart(2, "0"), " / ", String(totalScreens).padStart(2, "0"))))), /* @__PURE__ */ import_react.default.createElement("div", { ref: contentRef, onClick: onContentClick, onScroll: onContentScroll, className: `stage-content ${narrow ? "narrow" : ""}`, style: { paddingLeft: padH, paddingRight: padH } }, children), navContent && /* @__PURE__ */ import_react.default.createElement("div", { className: "stage-nav", style: { paddingLeft: padH, paddingRight: padH } }, navContent)));
};
var NavBack = ({ onPrev }) => /* @__PURE__ */ import_react.default.createElement("button", { className: "btn-ghost", onClick: onPrev, style: { padding: "clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)", fontSize: "clamp(13px,1.5vw,15px)" } }, "Orqaga");
var NavNext = ({ disabled, label = "Davom etish", onClick, optionalLive }) => {
  const gate = (0, import_react.useContext)(LiveGateCtx);
  const locked = !!(gate && gate.locked);
  const live = gate && gate.live;
  const freeRide = !!(optionalLive && live && live.mode === "student" && live.status !== "ended" && live.mentorAlive);
  return /* @__PURE__ */ import_react.default.createElement("button", { className: "btn-white-accent", disabled: (freeRide ? false : disabled) || locked, onClick, title: locked ? "Mentor hali bu sahifaga o'tmadi" : void 0, style: { padding: "clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)", fontSize: "clamp(13px,1.5vw,15px)", marginLeft: "auto" } }, locked ? "\u23F3 Mentorni kuting" : freeRide && disabled ? "Davom etish" : label);
};
var FeedbackBlock = ({ show, isCorrect, neutral, children }) => {
  const [mounted, setMounted] = (0, import_react.useState)(show);
  const [visible, setVisible] = (0, import_react.useState)(false);
  const ref = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => {
          if (ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 350);
      }));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [show]);
  if (!mounted) return null;
  return /* @__PURE__ */ import_react.default.createElement("div", { ref, className: `feedback-block ${visible ? "visible" : ""}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: neutral ? "frame-wait" : isCorrect ? "frame-success" : "frame-soft" }, children));
};
var MSTATS_COLORS = ["#019ACB", "#8B5CF6", "#E8A13A", "#E0559A"];
var RECAP_NEED_PCT = 60;
var RECAP_GOOD_PCT = 75;
var RECAP_MIN_ANSWERS = 3;
var RcFlow = ({ items, sep = "\u2192" }) => /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-flow" }, items.map((t, i) => /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, { key: i }, /* @__PURE__ */ import_react.default.createElement("span", { className: "rc-chip" }, t), sep && i < items.length - 1 && /* @__PURE__ */ import_react.default.createElement("span", { className: "rc-arr" }, sep))));
var INLINE_KEYS = { s4: 2, s7: 0, s10: 3, s15: 1, s18: 0, practice: -1 };
var RECAPS = {
  4: {
    title: "Yo'l xaritasi qayerda yashaydi",
    cards: [
      { ic: "\u{1F5C2}\uFE0F", h: "Aniq manzil", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, ".github/workflows/"), " ichidagi har ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, ".yml"), " fayl \u2014 alohida yo'l xaritasi. GitHub aynan shu papkani qidiradi.") },
      { ic: "\u{1F4DB}", h: "Nom muhim emas, joy muhim", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Faylni istalgan nom bilan atash mumkin (masalan ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "ci.yml"), "), lekin u albatta ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, ".github/workflows/"), " ichida turishi kerak.") },
      { ic: "\u{1F6AB}", h: "Boshqa joyda ishlamaydi", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Fayl boshqa papkada tursa, GitHub uni umuman ko'rmaydi \u2014 lenta hech qachon aylanmaydi."), ask: "Yo'l xaritasi qaysi papkada saqlanadi?" }
    ]
  },
  7: {
    title: "Yo'l xaritasi ichidagi ierarxiya",
    cards: [
      { ic: "\u{1F5FA}\uFE0F", h: "Eng katta \u2014 yo'l xaritasi", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "Workflow"), " \u2014 butun ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "ci.yml"), " fayli. Ichida bir yoki bir nechta nuqta (job) bo'ladi.") },
      { ic: "\u{1F6D1}", h: "Nuqta \u2014 o'z mashinasida", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "Job"), " (nuqta) o'z alohida lenta mashinasida ishlaydi. ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "runs-on"), " shu darajada yoziladi.") },
      { ic: "\u{1F527}", h: "Amal \u2014 eng kichik birlik", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "Step"), " (amal) \u2014 bitta harakat. Nuqta ichida ketma-ket bir nechta amal bo'ladi."), vis: /* @__PURE__ */ import_react.default.createElement(RcFlow, { items: ["\u{1F5FA}\uFE0F Workflow", "\u{1F6D1} Nuqta (job)", "\u{1F527} Amal (step)"] }), ask: "Yo'l xaritasi ichida nima birinchi, nima oxirgi turadi?" }
    ]
  },
  10: {
    title: "Signal va mashina",
    cards: [
      { ic: "\u{1F6A6}", h: "on: \u2014 qachon", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "on: push"), " \u2014 lenta har push'da o'zi ishga tushadi. Bu START SIGNALI.") },
      { ic: "\u{1F5A5}\uFE0F", h: "runs-on: \u2014 qayerda", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "runs-on: ubuntu-latest"), " \u2014 GitHub sizga bepul, toza lenta mashinasi beradi.") },
      { ic: "\u{1F517}", h: "Ikkalasi birga", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Signal bo'lmasa \u2014 lenta aylanmaydi. Mashina bo'lmasa \u2014 lenta aylansa ham hech narsa bajarilmaydi."), ask: "on: va runs-on qaysi savollarga javob beradi?" }
    ]
  },
  15: {
    title: "Amal turlari \u2014 uses va run",
    cards: [
      { ic: "\u{1F9E9}", h: "uses \u2014 tayyor amal", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Marketplace'dagi tayyor amalni chaqiradi, masalan ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "actions/checkout@v4"), ".") },
      { ic: "\u2328\uFE0F", h: "run \u2014 buyruq", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Oddiy terminal buyrug'i, masalan ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "npm install"), " yoki ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "npm test"), ".") },
      { ic: "\u{1F50D}", h: "Skanerni unutmang", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "npm test"), " \u2014 bu SKANER. Uni tashlab ketsangiz, buzuq yuk to'g'ridan-to'g'ri uchib ketadi."), ask: "uses bilan run orasidagi farq nima?" }
    ]
  },
  18: {
    title: "Jurnaldan sababni topish",
    cards: [
      { ic: "\u{1F4DC}", h: "Jurnal \u2014 hamma narsani yozadi", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Har amal LENTA JURNALIGA yoziladi: qaysi nuqta yashil, qaysi biri qizil bo'lgani ko'rinadi.") },
      { ic: "\u{1F50D}", h: "Skanersiz \u2014 xavfli", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "\u{1F50D} SKANER (", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "npm test"), ") o'tkazib yuborilsa, kod tekshirilmasdan to'g'ridan-to'g'ri uchiriladi.") },
      { ic: "\u{1F6E0}\uFE0F", h: "Tuzatib qayta yuboring", body: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Sababni topgach, yo'l xaritasini tuzating va qaytadan lentaga qo'ying \u2014 endi yashil chiqadi."), ask: "Qizil chiroq yonganda birinchi qayerga qaraysiz?" }
    ]
  }
};
function RecapOverlay({ screenIdx, onClose }) {
  const rc = RECAPS[screenIdx];
  const [i, setI] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setI((p) => Math.min(p + 1, rc.cards.length - 1));
      else if (e.key === "ArrowLeft") setI((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, rc]);
  if (!rc) return null;
  const card = rc.cards[i];
  const last = i === rc.cards.length - 1;
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-overlay" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-head" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "rc-tag" }, "\u{1F4D6} Qayta tushuntirish"), /* @__PURE__ */ import_react.default.createElement("span", { className: "rc-title" }, rc.title), /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-x", onClick: onClose, "aria-label": "Yopish" }, "\u2715")), /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-card", key: i }, /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-ic" }, card.ic), /* @__PURE__ */ import_react.default.createElement("h2", { className: "rc-h" }, card.h), /* @__PURE__ */ import_react.default.createElement("p", { className: "rc-body" }, card.body), card.vis && /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-vis" }, card.vis), card.ask && /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-ask" }, "\u{1F5E3}\uFE0F Sinfga savol: ", card.ask)), /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-nav" }, /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-btn ghost", disabled: i === 0, onClick: () => setI(i - 1) }, "\u2190 Oldingi"), /* @__PURE__ */ import_react.default.createElement("div", { className: "rc-dots" }, rc.cards.map((_, k) => /* @__PURE__ */ import_react.default.createElement("button", { key: k, className: `rc-dot ${k === i ? "cur" : k < i ? "fill" : ""}`, onClick: () => setI(k), "aria-label": `${k + 1}-karta` }))), last ? /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-btn done", onClick: onClose }, "\u2713 Tushunarli \u2014 davom etamiz") : /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-btn", onClick: () => setI(i + 1) }, "Keyingisi \u2192")));
}
function MentorTestStats({ live, screenIdx, options, correctIdx, reveal, onReveal, onOpenRecap }) {
  const [data, setData] = (0, import_react.useState)({ players: null, rows: [] });
  (0, import_react.useEffect)(() => {
    let on = true, t = null;
    const tick = async () => {
      try {
        const [players, answers] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, screenIdx)]);
        if (on) setData({ players, rows: answers });
      } catch {
      }
      if (on) t = setTimeout(tick, 3e3);
    };
    tick();
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, [live.pin, screenIdx]);
  if (data.players === null) return null;
  const total = data.players.length;
  const answered = data.rows.length;
  const ok = data.rows.filter((a) => a.picked === correctIdx).length;
  const bad = answered - ok;
  const allIn = total > 0 && answered >= total;
  const struggling = answered >= 2 && bad > ok;
  const answeredIds = new Set(data.rows.map((r) => r.player_id));
  const waiting = data.players.filter((p) => !answeredIds.has(p.id));
  const maxN = Math.max(1, ...options.map((_, i) => data.rows.filter((a) => a.picked === i).length));
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats fade-up" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-head" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-lbl" }, "\u{1F4CA} Jonli natija"), /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-n" }, allIn ? "\u2713 Hamma javob berdi" : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "Javob berdi: ", /* @__PURE__ */ import_react.default.createElement("b", null, answered), " / ", total)), !reveal && onReveal && /* @__PURE__ */ import_react.default.createElement("button", { className: `mstats-reveal ${allIn ? "ready" : ""}`, onClick: onReveal }, "\u{1F513} Natijani ochish")), /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-prog" }, /* @__PURE__ */ import_react.default.createElement("span", { className: `mstats-prog-fill ${allIn ? "full" : ""}`, style: { width: `${total ? Math.round(answered / total * 100) : 0}%` } })), reveal ? /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-big" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-chip okc" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-n" }, ok), /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-t" }, "to'g'ri \u2705")), /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-chip badc" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-n" }, bad), /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-t" }, "xato \u274C")), /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-chip waitc" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-n" }, total - answered), /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-t" }, "kutilmoqda \u23F3"))) : /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-big" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-chip ansc" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-n" }, answered), /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-t" }, "javob berdi \u{1F4E8}")), /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-chip waitc" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-n" }, total - answered), /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-chip-t" }, "kutilmoqda \u23F3"))), !reveal && answered > 0 && /* @__PURE__ */ import_react.default.createElement("p", { className: "mstats-hidden" }, "\u{1F648} Kim nimani tanlagani va \u2705/\u274C soni yashirin \u2014 \xABNatijani ochish\xBB bosilganda sizda ham, o'quvchilar ekranida ham birdan ochiladi."), reveal && /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-bars" }, options.map((opt, i) => {
    const n = data.rows.filter((a) => a.picked === i).length;
    const pct = answered ? Math.round(n / answered * 100) : 0;
    const isC = reveal && i === correctIdx;
    const col = isC ? T.success : MSTATS_COLORS[i % 4];
    return /* @__PURE__ */ import_react.default.createElement("div", { key: i, className: `mstats-row ${reveal && !isC ? "dimmed" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-abc", style: { background: col } }, isC ? "\u2713" : String.fromCharCode(65 + i)), /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-track" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-fill", style: { width: `${answered ? Math.round(n / maxN * 100) : 0}%`, background: col } })), /* @__PURE__ */ import_react.default.createElement("span", { className: "mono mstats-count", style: isC ? { color: T.success, fontWeight: 800 } : void 0 }, n > 0 ? `${n} o'quvchi \xB7 ${pct}%` : "\u2014"));
  })), reveal && answered > 0 && (() => {
    const pct = Math.round(ok / answered * 100);
    const level = answered < RECAP_MIN_ANSWERS ? "few" : pct < RECAP_NEED_PCT ? "need" : pct < RECAP_GOOD_PCT ? "maybe" : "good";
    return /* @__PURE__ */ import_react.default.createElement("div", { className: `mstats-verdict ${level}` }, level === "need" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "mstats-verdict-t" }, "\u26A0\uFE0F Faqat ", /* @__PURE__ */ import_react.default.createElement("b", null, pct, "%"), " to'g'ri \u2014 bu mavzu sinfga tushunarsiz qolgan. Davom etishdan oldin qisqa takrorlash tavsiya etiladi."), onOpenRecap && /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-open", onClick: onOpenRecap }, "\u{1F4D6} Qayta tushuntirish \u2014 ", RECAPS[screenIdx]?.title)), level === "maybe" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "mstats-verdict-t" }, "\u{1F7E1} ", /* @__PURE__ */ import_react.default.createElement("b", null, pct, "%"), " to'g'ri \u2014 yomon emas. Xohlasangiz, davom etishdan oldin qisqa takrorlab oling."), onOpenRecap && /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-open soft", onClick: onOpenRecap }, "\u{1F4D6} Qisqa takrorlash")), level === "good" && /* @__PURE__ */ import_react.default.createElement("p", { className: "mstats-verdict-t" }, "\u2705 ", /* @__PURE__ */ import_react.default.createElement("b", null, pct, "%"), " to'g'ri \u2014 sinf mavzuni o'zlashtirdi. Bemalol davom eting!"), level === "few" && /* @__PURE__ */ import_react.default.createElement("p", { className: "mstats-verdict-t" }, "Javob berganlar kam (", answered, " ta) \u2014 foiz bo'yicha xulosa chiqarish qiyin. O'zingiz baholang."));
  })(), waiting.length > 0 && answered > 0 && /* @__PURE__ */ import_react.default.createElement("div", { className: "mstats-waitrow" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-wait-lbl" }, "\u23F3 Kutilmoqda:"), waiting.slice(0, 8).map((p) => /* @__PURE__ */ import_react.default.createElement("span", { key: p.id, className: "mstats-wait-chip" }, p.nickname)), waiting.length > 8 && /* @__PURE__ */ import_react.default.createElement("span", { className: "mstats-wait-chip more" }, "+", waiting.length - 8)), reveal && struggling && /* @__PURE__ */ import_react.default.createElement("p", { className: "mstats-warn" }, "\u26A0\uFE0F Ko'pchilik xato qildi \u2014 bu mavzu tushunarsiz bo'lgan ko'rinadi. Qayta tushuntirish tavsiya etiladi."), answered === 0 && /* @__PURE__ */ import_react.default.createElement("p", { className: "mstats-wait" }, "O'quvchilar javoblari shu yerda jonli ko'rinadi\u2026"));
}
var QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const gate = (0, import_react.useContext)(LiveGateCtx) || {};
  const live = gate.live;
  const oneShot = !!(live && live.mode === "student");
  const isMentorLive = !!(live && live.mode === "mentor");
  const mountTs = (0, import_react.useRef)(Date.now());
  const [picked, setPicked] = (0, import_react.useState)(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = (0, import_react.useState)(storedAnswer ? storedAnswer.solved ?? storedAnswer.picked === correctIdx : false);
  const firstCorrectRef = (0, import_react.useRef)(storedAnswer ? storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null : null);
  const [mReveal, setMReveal] = (0, import_react.useState)(() => !!(isMentorLive && storedAnswer));
  const [recapOpen, setRecapOpen] = (0, import_react.useState)(false);
  const hasRecap = !!RECAPS[screen];
  const doReveal = () => {
    setMReveal(true);
    if (live) live.mentorReveal(screen);
    if (storedAnswer === void 0) onAnswer(screen, { mentorRevealed: true });
  };
  const liveRevealScreen = live ? live.revealScreen : -1;
  (0, import_react.useEffect)(() => {
    if (isMentorLive && liveRevealScreen === screen) setMReveal(true);
  }, [isMentorLive, liveRevealScreen, screen]);
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
  const revealed = !oneShot || !!(live && (live.revealScreen === screen || live.mentorScreen > screen || live.status === "ended" || !live.mentorAlive));
  const waiting = oneShot && solved && !revealed;
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow, screen, narrow: true, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { disabled: isMentorLive ? !mReveal : !solved, label: isMentorLive ? mReveal ? "Davom etish" : "Avval natijani oching" : solved ? "Davom etish" : oneShot ? "Javob tanlang" : "To'g'ri javobni toping", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { justifyContent: isMentorLive ? "flex-start" : "center", gap: "clamp(16px,2.5vw,24px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up" }, question), oneShot && !solved && /* @__PURE__ */ import_react.default.createElement("p", { className: "small mono fade-up", style: { margin: "-8px 0 0", color: T.accent, fontWeight: 600 } }, "\u26A1 Jonli dars \u2014 bitta urinish, o'ylab bosing!"), /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up delay-1", style: { display: "flex", flexDirection: "column", gap: 9 } }, options.map((opt, i) => {
    let cls = "option";
    if (isMentorLive) {
      if (mReveal) {
        if (i === correctIdx) cls += " option-correct";
        else cls += " option-wrong";
      }
    } else if (solved) {
      if (waiting) {
        if (i === picked) cls += " option-wait";
      } else {
        if (i === correctIdx) cls += " option-correct";
        else cls += " option-wrong";
        if (wrongLocked && i === picked) cls += " option-picked-wrong";
      }
    } else if (i === picked) cls += " option-picked-wrong";
    const showGreenLetter = isMentorLive ? mReveal && i === correctIdx : solved && revealed && i === correctIdx;
    return /* @__PURE__ */ import_react.default.createElement("button", { key: i, className: cls, disabled: solved || isMentorLive, onClick: () => pick(i), style: { padding: "clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)", fontSize: "clamp(14px,1.7vw,16px)", display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono small", style: { minWidth: 20, color: showGreenLetter ? T.success : T.ink3 } }, String.fromCharCode(65 + i)), /* @__PURE__ */ import_react.default.createElement("span", { style: { flex: 1 } }, fmtCode(opt)));
  })), /* @__PURE__ */ import_react.default.createElement(FeedbackBlock, { show: isMentorLive ? mReveal : picked !== null, isCorrect: isMentorLive ? true : solved && !wrongLocked, neutral: waiting }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small mono", style: { margin: "0 0 6px", fontWeight: 600, color: waiting ? T.blue : isMentorLive || solved && !wrongLocked ? T.success : T.accent, textTransform: "uppercase", letterSpacing: "0.08em" } }, isMentorLive ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "\u2713 To'g'ri javob: ", String.fromCharCode(65 + correctIdx), " \u2014 ", fmtCode(options[correctIdx])) : waiting ? "\u{1F4E8} Javobingiz qabul qilindi" : wrongLocked ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, "To'g'ri javob: ", String.fromCharCode(65 + correctIdx), " \u2014 ", fmtCode(options[correctIdx])) : solved ? "To'g'ri" : "Qaytadan urinib ko'ring"), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0 } }, isMentorLive ? fmtCode(explainCorrect) : waiting ? "Hozir to'g'ri javobni bilib olasiz." : wrongLocked ? fmtCode(explainWrong[picked] ?? explainWrong.default) : solved ? fmtCode(explainCorrect) : fmtCode(explainWrong[picked] ?? explainWrong.default)), hasRecap && !isMentorLive && firstCorrectRef.current === false && (!oneShot || revealed) && /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-open-mini", onClick: () => setRecapOpen(true) }, "\u{1F4D6} Qisqa takrorlash \u2014 mavzuni yana bir ko'rish")), isMentorLive && /* @__PURE__ */ import_react.default.createElement(MentorTestStats, { live, screenIdx: screen, options, correctIdx, reveal: mReveal, onReveal: doReveal, onOpenRecap: hasRecap ? () => setRecapOpen(true) : null }), recapOpen && hasRecap && /* @__PURE__ */ import_react.default.createElement(RecapOverlay, { screenIdx: screen, onClose: () => setRecapOpen(false) })));
};
function ScoreRing({ correct, total }) {
  const PCT = total ? correct / total : 0;
  const col = PCT >= 0.6 ? T.success : T.accent;
  const R = 50, ST = 9, C = 2 * Math.PI * R;
  const [off, setOff] = (0, import_react.useState)(C);
  (0, import_react.useEffect)(() => {
    const t = setTimeout(() => setOff(C * (1 - PCT)), 200);
    return () => clearTimeout(t);
  }, [C, PCT]);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "ring-wrap" }, /* @__PURE__ */ import_react.default.createElement("svg", { width: "128", height: "128", viewBox: "0 0 128 128" }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "64", cy: "64", r: R, fill: "none", stroke: T.ink3 + "40", strokeWidth: ST }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "64", cy: "64", r: R, fill: "none", stroke: col, strokeWidth: ST, strokeLinecap: "round", strokeDasharray: C, strokeDashoffset: off, transform: "rotate(-90 64 64)", style: { transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" } })), /* @__PURE__ */ import_react.default.createElement("div", { className: "ring-center" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "ring-num" }, /* @__PURE__ */ import_react.default.createElement("span", { style: { color: col } }, correct), /* @__PURE__ */ import_react.default.createElement("span", { className: "ring-den" }, "/", total)), /* @__PURE__ */ import_react.default.createElement("div", { className: "ring-lbl" }, "to'g'ri javob")));
}
var Mentor = ({ children }) => {
  const ctx = (0, import_react.useContext)(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => {
    e.stopPropagation();
    if (ctx.setCollapsed) ctx.setCollapsed(false);
  };
  return /* @__PURE__ */ import_react.default.createElement("div", { className: `mentor fade-up ${enabled ? "mentor-mob" : ""} ${collapsed ? "is-collapsed" : ""}`, onClick: collapsed ? expand : void 0, role: collapsed ? "button" : void 0 }, /* @__PURE__ */ import_react.default.createElement("div", { className: "mentor-ava", "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("img", { src: MENTOR_IMG, alt: "" })), /* @__PURE__ */ import_react.default.createElement("div", { className: "mentor-col" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mentor-name" }, "Mentor", collapsed && /* @__PURE__ */ import_react.default.createElement("span", { className: "mentor-cue" }, " \xB7 ko'rsatmani ochish \u25BE")), /* @__PURE__ */ import_react.default.createElement("div", { className: "mentor-msg body" }, children)));
};
var Kw = ({ children }) => /* @__PURE__ */ import_react.default.createElement("span", { style: { color: CODE.tag } }, children);
var At = ({ children }) => /* @__PURE__ */ import_react.default.createElement("span", { style: { color: CODE.attr } }, children);
var St = ({ children }) => /* @__PURE__ */ import_react.default.createElement("span", { style: { color: CODE.str } }, children);
var Cm = ({ children }) => /* @__PURE__ */ import_react.default.createElement("span", { style: { color: CODE.comment, fontStyle: "italic" } }, children);
var CodeFile = ({ name, children, minH }) => /* @__PURE__ */ import_react.default.createElement("div", { className: "editor" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "editor-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "bb-dots" }, /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null)), /* @__PURE__ */ import_react.default.createElement("span", { className: "editor-tab" }, name)), /* @__PURE__ */ import_react.default.createElement("div", { className: "editor-body", style: { minHeight: minH } }, /* @__PURE__ */ import_react.default.createElement("pre", { className: "editor-code" }, children)));
var Term = ({ title = "Terminal", children, minH }) => /* @__PURE__ */ import_react.default.createElement("div", { className: "term" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "term-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "bb-dots" }, /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null)), /* @__PURE__ */ import_react.default.createElement("span", { className: "term-title" }, title)), /* @__PURE__ */ import_react.default.createElement("div", { className: "term-body", style: { minHeight: minH } }, children));
var TLine = ({ cmd, out, col, delay }) => /* @__PURE__ */ import_react.default.createElement("div", { className: "el-in tline", style: delay ? { animationDelay: `${delay}s` } : void 0 }, cmd ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { style: { color: CODE.str } }, "$"), " ", /* @__PURE__ */ import_react.default.createElement("span", { style: { color: CODE.text } }, cmd)) : /* @__PURE__ */ import_react.default.createElement("span", { style: { color: col || CODE.comment } }, out));
var BELT_STEPS_PASS = [{ label: "\u{1F4E6} YIG'ISH", ok: true }, { label: "\u{1F50D} SKANER", ok: true }, { label: "\u{1F381} O'RASH", ok: true }, { label: "\u2708\uFE0F UCHIRISH", ok: true }];
var BELT_STEPS_FAIL = [{ label: "\u{1F4E6} YIG'ISH", ok: true }, { label: "\u{1F50D} SKANER", ok: false }, { label: "\u{1F381} O'RASH", ok: null }, { label: "\u2708\uFE0F UCHIRISH", ok: null }];
var BeltRun = ({ status = "pass", steps }) => {
  const list = steps || (status === "pass" ? BELT_STEPS_PASS : BELT_STEPS_FAIL);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "ghrun" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "ghrun-head" }, /* @__PURE__ */ import_react.default.createElement("span", { className: `ghrun-badge ${status}` }, status === "pass" ? "\u2713 YASHIL CHIROQ" : "\u2717 QIZIL CHIROQ"), /* @__PURE__ */ import_react.default.createElement("span", { className: "ghrun-title" }, "Lenta \xB7 on: push \xB7 #14")), /* @__PURE__ */ import_react.default.createElement("div", { className: "ghrun-job" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "ghrun-jobname" }, /* @__PURE__ */ import_react.default.createElement("span", { style: { color: status === "pass" ? T.success : T.danger } }, status === "pass" ? "\u2713" : "\u2717"), " nuqta \xB7 ubuntu-latest"), /* @__PURE__ */ import_react.default.createElement("div", { className: "ghrun-steps" }, list.map((s, i) => /* @__PURE__ */ import_react.default.createElement("div", { className: `ghrun-step el-in ${s.ok === true && s.label.includes("UCHIRISH") ? "plane-ok" : ""}`, key: i, style: { animationDelay: `${i * 0.12}s` } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "ghrun-ck", style: { color: s.ok === true ? T.success : s.ok === false ? T.danger : T.ink3 } }, s.ok === true ? "\u2713" : s.ok === false ? "\u2717" : "\xB7"), /* @__PURE__ */ import_react.default.createElement("span", null, s.label))))));
};
var FileTree = ({ revealed }) => /* @__PURE__ */ import_react.default.createElement("div", { className: "tree" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "tree-row", style: { paddingLeft: 0 } }, "\u{1F4C1} mening-loyiham"), revealed >= 1 && /* @__PURE__ */ import_react.default.createElement("div", { className: "tree-row hl el-in", style: { paddingLeft: 18 } }, "\u{1F4C1} .github"), revealed >= 2 && /* @__PURE__ */ import_react.default.createElement("div", { className: "tree-row hl el-in", style: { paddingLeft: 36 } }, "\u{1F4C1} workflows"), revealed >= 3 && /* @__PURE__ */ import_react.default.createElement("div", { className: "tree-row hl el-in", style: { paddingLeft: 54 } }, "\u{1F4C4} ci.yml"), /* @__PURE__ */ import_react.default.createElement("div", { className: "tree-row dim", style: { paddingLeft: 18 } }, "\u{1F4C1} src"), /* @__PURE__ */ import_react.default.createElement("div", { className: "tree-row dim", style: { paddingLeft: 18 } }, "\u{1F4C4} package.json"));
var PhonePreview = ({ state }) => /* @__PURE__ */ import_react.default.createElement("div", { className: `phone ${state}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: "phone-notch" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "phone-scr" }, state === "ok" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "phone-ic" }, "\u2705"), /* @__PURE__ */ import_react.default.createElement("span", { className: "phone-t" }, "Sayt ishlayapti")), state === "bad" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "phone-ic" }, "\u{1F4A5}"), /* @__PURE__ */ import_react.default.createElement("span", { className: "phone-t" }, "Buzuq sayt chiqdi")), state === "idle" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "phone-ic" }, "\u{1F4F1}"), /* @__PURE__ */ import_react.default.createElement("span", { className: "phone-t", style: { color: T.ink3 } }, "hali hech narsa yuborilmadi"))));
function DragDropOrder({ items, hints, onSolved, doneText }) {
  const order = items.map((x) => x.id);
  const byId = (0, import_react.useMemo)(() => Object.fromEntries(items.map((x) => [x.id, x])), [items]);
  const [st, setSt] = (0, import_react.useState)(() => {
    const a = order.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return { pool: a, slots: order.map(() => null) };
  });
  const { pool, slots } = st;
  const slotRefs = (0, import_react.useRef)([]);
  const full = slots.every((s) => s !== null);
  const solved = slots.every((s, i) => s === order[i]);
  const wrong = full && !solved;
  (0, import_react.useEffect)(() => {
    if (solved) onSolved && onSolved();
  }, [solved]);
  const place = (id, from, slotIdx) => setSt(({ pool: pool2, slots: slots2 }) => {
    const ns = slots2.slice();
    const occ = ns[slotIdx];
    if (typeof from === "number") ns[from] = null;
    ns[slotIdx] = id;
    let np = from === "pool" ? pool2.filter((x) => x !== id) : pool2.slice();
    if (occ) np = [...np, occ];
    return { pool: np, slots: ns };
  });
  const toPool = (slotIdx) => setSt(({ pool: pool2, slots: slots2 }) => {
    const id = slots2[slotIdx];
    if (!id) return { pool: pool2, slots: slots2 };
    const ns = slots2.slice();
    ns[slotIdx] = null;
    return { pool: [...pool2, id], slots: ns };
  });
  const tap = (id) => setSt(({ pool: pool2, slots: slots2 }) => {
    const e = slots2.findIndex((s) => s === null);
    if (e < 0) return { pool: pool2, slots: slots2 };
    const ns = slots2.slice();
    ns[e] = id;
    return { pool: pool2.filter((x) => x !== id), slots: ns };
  });
  const down = (ev, id, from) => {
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    const el = ev.currentTarget;
    const sx = ev.clientX, sy = ev.clientY;
    let moved = false;
    el.style.transition = "none";
    el.style.zIndex = "9999";
    el.style.willChange = "transform";
    const mv = (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) el.style.transform = `translate(${dx}px,${dy}px) scale(1.06) rotate(-2deg)`;
    };
    const finish = (el2) => {
      el2.style.zIndex = "";
      el2.style.willChange = "";
      el2.style.transform = "";
      el2.style.transition = "";
    };
    const up = (e) => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      if (!moved) {
        finish(el);
        if (from === "pool") tap(id);
        else toPool(from);
        return;
      }
      let t = -1;
      slotRefs.current.forEach((elm, i) => {
        if (!elm) return;
        const r = elm.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) t = i;
      });
      if (t >= 0) {
        finish(el);
        place(id, from, t);
      } else if (typeof from === "number") {
        finish(el);
        toPool(from);
      } else {
        el.style.transition = "transform .2s cubic-bezier(.34,1.3,.4,1)";
        el.style.transform = "";
        setTimeout(() => finish(el), 210);
      }
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "dd fade-up" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "dd-slots" }, slots.map((sid, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, ref: (el) => slotRefs.current[i] = el, className: `dd-slot ${sid ? "filled" : ""} ${solved && sid ? "ok" : ""} ${wrong && sid && sid !== order[i] ? "bad" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: "dd-slotn" }, i + 1), sid ? /* @__PURE__ */ import_react.default.createElement("button", { key: sid, className: "dd-chip in", onPointerDown: (e) => down(e, sid, i) }, byId[sid].label) : /* @__PURE__ */ import_react.default.createElement("span", { className: "dd-hint" }, hints ? hints[i] : "bu yerga joylang")))), /* @__PURE__ */ import_react.default.createElement("div", { className: "dd-pool" }, pool.length === 0 && !solved && /* @__PURE__ */ import_react.default.createElement("span", { className: "dd-pool-empty" }, "Tartib xato \u2014 bo'lakni bosib qaytaring va qayta joylang"), pool.map((id) => /* @__PURE__ */ import_react.default.createElement("button", { key: id, className: "dd-chip", onPointerDown: (e) => down(e, id, "pool") }, byId[id].label))), solved && /* @__PURE__ */ import_react.default.createElement("div", { className: "dd-done" }, "\u2713 ", doneText || "To'g'ri tartib!"), wrong && !solved && /* @__PURE__ */ import_react.default.createElement("div", { className: "dd-wrong" }, "\u26A0\uFE0F Tartib xato \u2014 qayta joylang."));
}
var Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = (0, import_react.useState)(!!storedAnswer);
  const [picked, setPicked] = (0, import_react.useState)(storedAnswer?.picked ?? null);
  const [sc, setSc] = (0, import_react.useState)(0);
  const OPTS = [
    { id: "a", label: "Har push'dan keyin o'zim qo'lda npm test yozaman" },
    { id: "b", label: "GitHub Actions sozlayman \u2014 lenta har push'da o'zi tekshiradi" },
    { id: "c", label: "Testni umuman tashlab qo'yaman" }
  ];
  const poke = () => {
    setTried(true);
    setSc((n) => n + 1);
  };
  const pick = (v) => {
    if (picked !== null || !tried) return;
    setPicked(v);
    setSc((n) => n + 1);
    onAnswer(screen, { stage: "hook", screenIdx: screen, picked: v, correct: true });
  };
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Kirish", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: picked === null, label: "Davom etish", onClick: onNext }) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen" }, /* @__PURE__ */ import_react.default.createElement("h1", { className: "title h-title fade-up", style: { maxWidth: 880 } }, "Chamadonni lentaga qo'ydingiz (push) \u2014 endi uni ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "kim tekshiradi"), "?"), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "O'tgan darsda lenta g'oyasini tushundik. Endi lentaga qo'yib ko'ring (push) \u2014 va kim tekshirishini kuzating."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement(Split, null, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(Term, { title: "bash", minH: 120 }, /* @__PURE__ */ import_react.default.createElement(TLine, { cmd: "git push origin main" }), tried && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(TLine, { out: "main -> main" }), /* @__PURE__ */ import_react.default.createElement(TLine, { out: "\u2713 chamadon lentaga qo'yildi", col: CODE.str }), /* @__PURE__ */ import_react.default.createElement(TLine, { out: "... skaner? hech kim ishga tushirmadi", col: "#FF8A7A" }))), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn-soft ${tried ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, onClick: poke, disabled: tried }, tried ? "\u2713 Lentaga qo'yildi" : "\u25B6 git push"), tried && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-warn fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Chamadon lentaga tushdi \u2014 lekin ", /* @__PURE__ */ import_react.default.createElement("b", null, "uni hech kim tekshirmadi"), ". Ichida nima borligi noma'lum. Buni avtomatlashtirsak-chi?"))), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "eyebrow fade-up delay-2", style: { color: T.ink2, margin: 0 } }, "Har push'da tekshiruvni qanday avtomatik ishga tushiramiz?"), /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up delay-3", style: { display: "flex", flexDirection: "column", gap: 9 } }, OPTS.map((o) => {
    const on = picked === o.id;
    return /* @__PURE__ */ import_react.default.createElement("button", { key: o.id, className: `hook-option ${on ? "on" : ""}`, disabled: picked !== null || !tried, style: { opacity: !tried ? 0.55 : 1 }, onClick: () => pick(o.id) }, /* @__PURE__ */ import_react.default.createElement("span", { className: "radio" }, on && /* @__PURE__ */ import_react.default.createElement("span", { className: "radio-dot" })), /* @__PURE__ */ import_react.default.createElement("span", null, o.label));
  })), !tried && /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, fontStyle: "italic", margin: 0 } }, "Avval push'ni bosing \u2190"), picked !== null && /* @__PURE__ */ import_react.default.createElement("p", { className: "hook-ack fade-step" }, "Aynan! ", /* @__PURE__ */ import_react.default.createElement("b", null, "GitHub Actions"), " \u2014 repozitoriyangiz ichidagi bepul lenta tizimi. Unga bir marta yo'l xaritasi (ci.yml) berasiz, u ", /* @__PURE__ */ import_react.default.createElement("b", null, "har push'da"), " lentani o'zi aylantiradi. Bugun shu yo'l xaritasini o'zingiz yozasiz."))))));
};
var Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "GitHub Actions nima va yo'l xaritasi qayerda yashaydi", tag: ".github/workflows" },
    { text: "Yo'l xaritasi ierarxiyasi", tag: "Workflow \u2192 Nuqta \u2192 Amal" },
    { text: "START SIGNALI va LENTA MASHINASI", tag: "on: \xB7 runs-on:" },
    { text: "O'z yo'l xaritangizni yozib, lentani aylantirasiz", tag: "npm test" }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = (0, import_react.useState)(false);
  const Preview = /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label" }, "Dars oxirida \u2014 har push'da shu chiqadi"), /* @__PURE__ */ import_react.default.createElement(BeltRun, { status: "pass" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "sk-info" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Lentaga qo'ydingiz \u2192 GitHub Actions o'zi chamadonni oldi, tekshirdi va ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.success } }, "yashil chiroq \u2713"), " berdi. Hech narsa qo'lda emas.")));
  const StepsB = /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label" }, "Bugungi 4 qadam"), /* @__PURE__ */ import_react.default.createElement("ol", { className: "roadmap" }, STEPS.map((s, i) => /* @__PURE__ */ import_react.default.createElement("li", { key: i, className: "step-card fade-up", style: { animationDelay: `${0.08 + i * 0.05}s` } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "step-num" }, String(i + 1).padStart(2, "0")), /* @__PURE__ */ import_react.default.createElement("span", { className: "step-body" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "step-text" }, s.text), /* @__PURE__ */ import_react.default.createElement("span", { className: "step-tag" }, s.tag))))));
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Reja", screen, mentorStatic: true, scrollSignal: showSteps, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, label: "Boshlaymiz \u2192", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Lentani ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "o'zimiz"), " qanday quramiz?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "GitHub Actions \u2014 lentani boshqaradigan tizim. Siz unga kichik bir ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "yo'l xaritasi"), " (ci.yml) yozasiz, qolganini u bajaradi. Mana natija va 4 qadam."), !isNarrow ? /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement(Split, null, Preview, StepsB)) : !showSteps ? /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-step", style: { display: "flex", flexDirection: "column", gap: "clamp(12px,2vw,16px)" } }, Preview, /* @__PURE__ */ import_react.default.createElement("button", { className: "btn", style: { alignSelf: "flex-start" }, onClick: () => setShowSteps(true) }, "4 qadamni ko'rish")) : /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-step", style: { display: "flex", flexDirection: "column", gap: "clamp(12px,2vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("button", { className: "btn-soft", style: { alignSelf: "flex-start" }, onClick: () => setShowSteps(false) }, "\u21A9 Natijani ko'rish"), StepsB)));
};
var Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = (0, import_react.useState)(!!storedAnswer);
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = show;
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 lenta tizimi", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : "Lentani ko'ring", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "GitHub Actions \u2014 bu ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "aslida nima"), "?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "GitHub Actions \u2014 GitHub'ning o'z xizmati: ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "bepul"), ", alohida server kerak emas. Siz yo'l xaritasini yozasiz, lenta har push'da o'zi aylanadi. Natijani ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "Actions"), " bo'limida ko'rasiz. Tugmani bosing."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "frame", style: { borderLeft: `4px solid ${T.danger}` } }, /* @__PURE__ */ import_react.default.createElement("p", { className: "note-h", style: { color: T.danger } }, "\u{1F40C} Lentasiz"), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Lentaga qo'yasiz \u2014 keyin o'zingiz eslab, qo'lda ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "npm test"), " yozasiz. Eslamasangiz \u2014 tekshiruv yo'q.")), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn ${show ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, disabled: show, onClick: () => {
    setShow(true);
    setSc((n) => n + 1);
  } }, show ? "\u2713 Ko'rdingiz" : "Lenta bilan-chi?")), /* @__PURE__ */ import_react.default.createElement(Col, null, show ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "frame fade-step", style: { borderLeft: `4px solid ${T.success}` } }, /* @__PURE__ */ import_react.default.createElement("p", { className: "note-h", style: { color: T.success } }, "\u{1F6EB} GitHub Actions"), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Push'ni ", /* @__PURE__ */ import_react.default.createElement("b", null, "sezadi"), " va yo'l xaritasi bo'yicha lentani o'zi aylantiradi. Bepul, GitHub ichida, har safar. Natija \u2014 Actions bo'limida.")), /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-step" }, /* @__PURE__ */ import_react.default.createElement(BeltRun, { status: "pass" }))) : /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Tugmani bosing \u2190")), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Lenta tayyor turibdi \u2014 faqat unga yo'l xaritasi berishimiz kerak. Bu xarita qayerda saqlanadi?")))))));
};
var Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [revealed, setRevealed] = (0, import_react.useState)(storedAnswer ? 3 : 0);
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = revealed >= 3;
  const NOTES = [
    "Loyiha ildizida maxsus papka \u2014 .github bilan boshlanadi.",
    "Uning ichida workflows papkasi \u2014 barcha yo'l xaritalari shu yerda.",
    "ci.yml \u2014 bizning yo'l xaritamiz. GitHub bu papkani o'zi topadi va ishga tushiradi."
  ];
  const go = () => {
    setRevealed((r) => Math.min(r + 1, 3));
    setSc((n) => n + 1);
  };
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 joylashuv", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : "Yo'lni oching", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Yo'l xaritasi ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "qayerda"), " saqlanadi?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Yo'l xaritasi aniq bir joyga yoziladi: ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, ".github/workflows/ci.yml"), ". Bu nomlar ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "aniq shunday"), " bo'lishi kerak \u2014 GitHub shu papkani o'zi qidiradi. Yo'lni qadam-baqadam oching."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(FileTree, { revealed }), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn ${done ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, disabled: done, onClick: go }, done ? "\u2713 ci.yml topildi" : revealed === 0 ? "+ .github papkasini ochish" : revealed === 1 ? "+ workflows papkasini ochish" : "+ ci.yml faylini ochish")), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label" }, "izoh"), revealed === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Papkani oching \u2190")) : /* @__PURE__ */ import_react.default.createElement("div", { className: "sk-info fade-step", key: revealed }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, NOTES[revealed - 1])), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Yodda tuting: ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, ".github/workflows/"), " ichidagi har ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, ".yml"), " fayl \u2014 alohida yo'l xaritasi. Endi shu faylning ichini yozamiz.")))))));
};
var Screen4 = (props) => /* @__PURE__ */ import_react.default.createElement(
  QuestionScreen,
  {
    ...props,
    scope: "module-mikro",
    eyebrow: "Mashq \xB7 1-savol",
    questionText: "Yo'l xaritasi (workflow) fayli qayerda saqlanadi?",
    question: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "eyebrow", style: { color: T.accent } }, "To'g'ri javobni tanlang"), /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-sub", style: { marginTop: 8 } }, "Yo'l xaritasi fayli ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "qayerda"), " saqlanadi?")),
    options: ["src/ papkasi ichida \u2014 bu yerga hech qachon yozilmaydi", "package.json fayli ichida", ".github/workflows/ papkasida, .yml fayl sifatida", "Hech qayerda \u2014 GitHub o'zi biladi"],
    correctIdx: 2,
    explainCorrect: "To'g'ri! Yo'l xaritasi fayllari .github/workflows/ papkasida .yml kengaytmasi bilan yashaydi. GitHub bu papkani avtomatik topadi.",
    explainWrong: {
      0: "src/ \u2014 bu loyiha kodi uchun. Yo'l xaritasi esa .github/workflows/ ichida bo'ladi.",
      1: "package.json \u2014 paketlar va scriptlar uchun. Yo'l xaritasi alohida .yml faylda.",
      3: "GitHub aniq joyni qidiradi: .github/workflows/. Bo'lmasa \u2014 hech narsa ishlamaydi.",
      default: "To'g'risi \u2014 .github/workflows/ papkasidagi .yml fayl."
    }
  }
);
var Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { id: "kv", t: "key: value", d: "Sodda juftlik: kalit va qiymat. Masalan name: CI yoki runs-on: ubuntu-latest." },
    { id: "list", t: "- ro'yxat", d: "Chiziqcha (-) ro'yxat elementi. steps: ostidagi har bir - \u2014 alohida amal." },
    { id: "indent", t: "bo'sh joy = ierarxiya", d: "Chap tomondagi bo'sh joy kim kimning ichidaligini bildiradi. steps: \u2014 nuqta ichida, nuqta \u2014 yo'l xaritasi ichida." }
  ];
  const [seen, setSeen] = (0, import_react.useState)(storedAnswer ? new Set(PARTS.map((p) => p.id)) : /* @__PURE__ */ new Set());
  const [active, setActive] = (0, import_react.useState)(null);
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = seen.size >= PARTS.length;
  const tap = (id) => {
    setActive(id);
    setSeen((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    setSc((n) => n + 1);
  };
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  const cur = PARTS.find((p) => p.id === active);
  const FullYml = /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: ".github/workflows/ci.yml", minH: 180 }, /* @__PURE__ */ import_react.default.createElement(At, null, "name"), ": CI", "\n", /* @__PURE__ */ import_react.default.createElement(At, null, "on"), ": ", /* @__PURE__ */ import_react.default.createElement(Kw, null, "push"), "\n", /* @__PURE__ */ import_react.default.createElement(At, null, "jobs"), ":", "\n", "  ", /* @__PURE__ */ import_react.default.createElement(At, null, "test"), ":", "\n", "    ", /* @__PURE__ */ import_react.default.createElement(At, null, "runs-on"), ": ubuntu-latest", "\n", "    ", /* @__PURE__ */ import_react.default.createElement(At, null, "steps"), ":", "\n", "      - ", /* @__PURE__ */ import_react.default.createElement(At, null, "uses"), ": ", /* @__PURE__ */ import_react.default.createElement(St, null, "actions/checkout@v4"), "\n", "      - ", /* @__PURE__ */ import_react.default.createElement(At, null, "run"), ": ", /* @__PURE__ */ import_react.default.createElement(St, null, "npm test"));
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 YAML", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : `3 qoidani ko'ring (${seen.size}/3)`, onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "YAML nima \u2014 nega ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "bo'sh joy"), " muhim?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "ci.yml \u2014 YAML tilida. Unda qavs yo'q: ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "bo'sh joy (chekinish)"), " qaysi qator qaysining ichida turishini bildiradi. 3 ta qoidani bosib o'rganing \u2014 keyin yo'l xaritasi tushunarli bo'ladi."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, FullYml), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up delay-1", style: { display: "flex", flexWrap: "wrap", gap: 7 } }, PARTS.map((p) => /* @__PURE__ */ import_react.default.createElement("button", { key: p.id, className: `gchip ${seen.has(p.id) ? "" : "tap-hint"}`, onClick: () => tap(p.id), style: seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : void 0 }, seen.has(p.id) ? "\u2713 " : "", p.t))), cur ? /* @__PURE__ */ import_react.default.createElement("div", { className: "sk-info fade-step", key: active }, /* @__PURE__ */ import_react.default.createElement("p", { className: "note-h" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, cur.t)), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, cur.d)) : /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Qoidani bosing \u2190")), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Bo'sh joy noto'g'ri bo'lsa \u2014 yo'l xaritasi ishlamaydi. Endi ierarxiyaning 3 darajasini ko'ramiz.")))))));
};
var Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LEVELS = [
    { id: "workflow", icon: "\u{1F5FA}\uFE0F", t: "Workflow", en: "yo'l xaritasi", d: "Butun lenta rejasi \u2014 bitta ci.yml fayl. name: va on: shu darajada. Ichida bir yoki bir nechta nuqta (job) bo'ladi." },
    { id: "job", icon: "\u{1F6D1}", t: "Job", en: "nuqta", d: "Bitta tekshiruv nuqtasi \u2014 o'z mashinasida (runner) ishlaydi. runs-on: shu yerda. Bir nechta nuqta parallel ishlashi mumkin." },
    { id: "step", icon: "\u{1F527}", t: "Step", en: "amal", d: "Bitta harakat: buyruq (run:) yoki tayyor amal (uses:). Amallar ketma-ket, yuqoridan pastga bajariladi." }
  ];
  const [seen, setSeen] = (0, import_react.useState)(storedAnswer ? new Set(LEVELS.map((l) => l.id)) : /* @__PURE__ */ new Set());
  const [active, setActive] = (0, import_react.useState)(null);
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = seen.size >= LEVELS.length;
  const tap = (id) => {
    setActive(id);
    setSeen((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    setSc((n) => n + 1);
  };
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  const cur = LEVELS.find((l) => l.id === active);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 ierarxiya", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : `3 darajani ko'ring (${seen.size}/3)`, onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Yo'l xaritasi ichida nima \u2014 ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "Workflow \u2192 Job \u2192 Step"), " qanday joylashgan?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Bu darsning markazi. ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "Yo'l xaritasi"), " ichida ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "nuqta"), ", nuqta ichida ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "amal"), ". Har darajani bosing."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up delay-1", style: { display: "flex", flexDirection: "column", gap: 8 } }, LEVELS.map((l, i) => /* @__PURE__ */ import_react.default.createElement("button", { key: l.id, className: `vcard ${seen.has(l.id) ? "" : "tap-hint"}`, onClick: () => tap(l.id), style: { marginLeft: i * 16, boxShadow: active === l.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : void 0 } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "role-ico" }, l.icon), /* @__PURE__ */ import_react.default.createElement("span", { className: "vlbl" }, l.t), /* @__PURE__ */ import_react.default.createElement("span", { className: "role-r mono" }, l.en), /* @__PURE__ */ import_react.default.createElement("span", { className: "vseen", style: { color: seen.has(l.id) ? T.success : T.ink3 } }, seen.has(l.id) ? "\u2713" : ""))))), /* @__PURE__ */ import_react.default.createElement(Col, null, cur ? /* @__PURE__ */ import_react.default.createElement("div", { className: "frame fade-step", key: active }, /* @__PURE__ */ import_react.default.createElement("p", { className: "note-h" }, /* @__PURE__ */ import_react.default.createElement("span", { style: { fontSize: 20, marginRight: 6 } }, cur.icon), cur.t, " ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.ink3, marginLeft: 6, fontSize: 12 } }, "(", cur.en, ")")), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, cur.d)) : /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Darajani bosing \u2190")), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Workflow \u2283 Job \u2283 Step. ci.yml'da bu bo'sh joy orqali ko'rinadi: steps nuqta ichida, nuqta esa yo'l xaritasi ichida.")))))));
};
var Screen7 = (props) => /* @__PURE__ */ import_react.default.createElement(
  QuestionScreen,
  {
    ...props,
    scope: "module-mikro",
    eyebrow: "Mashq \xB7 2-savol",
    questionText: "Workflow, job va step qanday joylashgan?",
    question: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "eyebrow", style: { color: T.accent } }, "To'g'ri javobni tanlang"), /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-sub", style: { marginTop: 8 } }, "Yo'l xaritasi, nuqta va amal qanday ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "joylashgan"), "?")),
    options: ["Yo'l xaritasi ichida nuqta, nuqta ichida amal", "Amal ichida nuqta, nuqta ichida yo'l xaritasi", "Uchchalasi ham bir xil darajada", "Nuqta ichida yo'l xaritasi, yo'l xaritasi ichida amal"],
    correctIdx: 0,
    explainCorrect: "To'g'ri! Workflow \u2283 Job \u2283 Step. Eng katta \u2014 yo'l xaritasi, uning ichida nuqtalar, har nuqta ichida amallar.",
    explainWrong: {
      1: "Teskari \u2014 eng katta yo'l xaritasi, eng kichigi amal. Amal hech narsani o'z ichiga olmaydi.",
      2: "Bir xil daraja emas \u2014 ular ichma-ich joylashgan (ierarxiya).",
      3: "Yo'l xaritasi eng tashqarida \u2014 u nuqta ichiga kira olmaydi.",
      default: "To'g'risi: Yo'l xaritasi \u2283 Nuqta \u2283 Amal."
    }
  }
);
var Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TRIG = [
    { id: "push", t: "push", d: "Chamadon lentaga qo'yilganda (push) \u2014 eng keng tarqalgan. Biz aynan shuni ishlatamiz.", spin: "har push'da" },
    { id: "pull_request", t: "pull_request", d: "PR ochilganda/yangilanganda \u2014 kodni birlashtirishdan oldin tekshirish uchun.", spin: "PR ochilganda" },
    { id: "schedule", t: "schedule", d: "Belgilangan vaqtda (cron), masalan har kecha \u2014 vaqtli tekshiruvlar uchun.", spin: "har kecha" }
  ];
  const [seen, setSeen] = (0, import_react.useState)(storedAnswer ? new Set(TRIG.map((t) => t.id)) : /* @__PURE__ */ new Set());
  const [active, setActive] = (0, import_react.useState)(null);
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = seen.size >= TRIG.length;
  const tap = (id) => {
    setActive(id);
    setSeen((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    setSc((n) => n + 1);
  };
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  const cur = TRIG.find((t) => t.id === active);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 START SIGNALI", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : `Signallarni ko'ring (${seen.size}/3)`, onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, "on:"), " \u2014 lenta ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "qachon"), " aylanadi?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "on:"), " \u2014 yo'l xaritasining ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "START SIGNALI"), ": qaysi hodisa lentani aylantiradi. Bizning maqsad \u2014 ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "on: push"), ". Uchala signalni bosib ko'ring va lenta qachon aylanishini ko'ring."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: "ci.yml", minH: 90 }, /* @__PURE__ */ import_react.default.createElement(At, null, "name"), ": CI", "\n", /* @__PURE__ */ import_react.default.createElement(At, null, "on"), ": ", /* @__PURE__ */ import_react.default.createElement(Kw, null, active || "push"), "   ", /* @__PURE__ */ import_react.default.createElement(Cm, null, "# START SIGNALI"), "\n", /* @__PURE__ */ import_react.default.createElement(At, null, "jobs"), ":", " ..."), /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up delay-1", style: { display: "flex", flexWrap: "wrap", gap: 7 } }, TRIG.map((t) => /* @__PURE__ */ import_react.default.createElement("button", { key: t.id, className: `gchip ${seen.has(t.id) ? "" : "tap-hint"}`, onClick: () => tap(t.id), style: seen.has(t.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : void 0 }, seen.has(t.id) ? "\u2713 " : "", t.t)))), /* @__PURE__ */ import_react.default.createElement(Col, null, cur ? /* @__PURE__ */ import_react.default.createElement("div", { className: "sk-info fade-step", key: active }, /* @__PURE__ */ import_react.default.createElement("p", { className: "note-h" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, "on: ", cur.t)), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, cur.d), /* @__PURE__ */ import_react.default.createElement("p", { className: "small mono", style: { margin: "8px 0 0", color: T.success, fontWeight: 700 } }, "\u{1F504} Lenta aylanadi: ", cur.spin)) : /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Signalni bosing \u2190")), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Biz ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "on: push"), " ishlatamiz \u2014 har push'da tekshiruv boshlansin. ", /* @__PURE__ */ import_react.default.createElement("b", null, "on: bo'sh qolsa \u2014 lenta umuman aylanmaydi."), " Endi nuqta qaysi mashinada ishlashini ko'ramiz.")))))));
};
var Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = (0, import_react.useState)(!!storedAnswer);
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = show;
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 LENTA MASHINASI", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : "Mashinani ko'ring", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, "runs-on"), " \u2014 nuqta ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "qaysi mashinada"), " ishlaydi?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Tekshiruv bir joyda ishlashi kerak. ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "runs-on: ubuntu-latest"), " \u2014 GitHub sizga ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "bepul, toza LENTA MASHINASI"), " beradi. Har safar yangi mashinada \u2014 toza sharoitda. Tugmani bosing."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: "ci.yml", minH: 110 }, /* @__PURE__ */ import_react.default.createElement(At, null, "jobs"), ":", "\n", "  ", /* @__PURE__ */ import_react.default.createElement(At, null, "test"), ":", "\n", "    ", /* @__PURE__ */ import_react.default.createElement(At, null, "runs-on"), ": ", /* @__PURE__ */ import_react.default.createElement(Kw, null, "ubuntu-latest"), "\n", "    ", /* @__PURE__ */ import_react.default.createElement(At, null, "steps"), ": ..."), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn ${show ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, disabled: show, onClick: () => {
    setShow(true);
    setSc((n) => n + 1);
  } }, show ? "\u2713 Mashina tayyorlandi" : "\u25B6 Mashina qayerdan keladi?")), /* @__PURE__ */ import_react.default.createElement(Col, null, show ? /* @__PURE__ */ import_react.default.createElement(Term, { title: "GitHub \u2014 lenta mashinasi", minH: 90 }, /* @__PURE__ */ import_react.default.createElement(TLine, { out: "\u{1F5A5}  ubuntu-latest ishga tushdi", col: CODE.str }), /* @__PURE__ */ import_react.default.createElement(TLine, { out: "toza muhit \xB7 Node, npm tayyor" }), /* @__PURE__ */ import_react.default.createElement(TLine, { out: "nuqta shu mashinada bajariladi" })) : /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Tugmani bosing \u2190")), /* @__PURE__ */ import_react.default.createElement("div", { className: "sk-info" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "\u{1F4A1} Linux (ubuntu) eng tez va arzon. Kerak bo'lsa ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "windows-latest"), " yoki ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "macos-latest"), " ham bor.")), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Mashina tayyor. ", /* @__PURE__ */ import_react.default.createElement("b", null, "runs-on: bo'sh qolsa \u2014 lenta mashinasi tayinlanmaydi"), ", nuqta hech narsa bajara olmaydi. Endi mashinada nima bajarilishini (amallarni) yozamiz.")))))));
};
var Screen10 = (props) => /* @__PURE__ */ import_react.default.createElement(
  QuestionScreen,
  {
    ...props,
    scope: "module-mikro",
    eyebrow: "Mashq \xB7 3-savol",
    questionText: "ci.yml'da on: push va runs-on: nimaga javob beradi?",
    question: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "eyebrow", style: { color: T.accent } }, "To'g'ri javobni tanlang"), /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-sub", style: { marginTop: 8 } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, "on: push"), " va ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, "runs-on"), " ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "nimaga"), " javob beradi?")),
    options: ["Ikkalasi ham aynan bir xil narsani anglatadi, hech qanday farqi yo'q butunlay", "runs-on kodni serverga o'zi push qilib yuboradi", "on: push \u2014 mashinani tanlaydi, runs-on \u2014 qachonligini", "on: push qachon, runs-on qaysi mashinada ishlashini belgilaydi"],
    correctIdx: 3,
    explainCorrect: "To'g'ri! on: push \u2014 START SIGNALI (qachon). runs-on \u2014 LENTA MASHINASI (qaysi mashinada). Ikkalasi birga bo'lmasa, lenta ishlamaydi.",
    explainWrong: {
      0: "Yo'q \u2014 ular boshqa-boshqa savollarga javob beradi: biri qachon, biri qayerda.",
      1: "runs-on push qilmaydi \u2014 u faqat nuqta ishlaydigan mashinani tanlaydi.",
      2: "Aksincha: on: \u2014 qachon, runs-on \u2014 qayerda.",
      default: "on: push qachon, runs-on qaysi mashinada ishlashini belgilaydi."
    }
  }
);
var Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const KINDS = [
    { id: "uses", icon: "\u{1F9E9}", t: "uses", d: "Marketplace'dan tayyor amal \u2014 boshqalar yozgan 'detal'. Masalan uses: actions/checkout@v4 \u2014 repodagi kodni mashinaga olib keladi." },
    { id: "run", icon: "\u2328\uFE0F", t: "run", d: "Oddiy terminal buyrug'i \u2014 xuddi o'zingiz yozgandek. Masalan run: npm install yoki run: npm test." }
  ];
  const [seen, setSeen] = (0, import_react.useState)(storedAnswer ? new Set(KINDS.map((k) => k.id)) : /* @__PURE__ */ new Set());
  const [active, setActive] = (0, import_react.useState)(null);
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = seen.size >= KINDS.length;
  const tap = (id) => {
    setActive(id);
    setSeen((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    setSc((n) => n + 1);
  };
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  const cur = KINDS.find((k) => k.id === active);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 amal turlari", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : `2 turni ko'ring (${seen.size}/2)`, onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Amal qanday yoziladi \u2014 ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "uses"), "mi yoki ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "run"), "mi?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Har amal yo tayyor blok chaqiradi (", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "uses"), "), yo buyruq bajaradi (", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "run"), "). Ikkalasini bosib ko'ring."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up delay-1", style: { display: "flex", flexDirection: "column", gap: 8 } }, KINDS.map((k) => /* @__PURE__ */ import_react.default.createElement("button", { key: k.id, className: `vcard ${seen.has(k.id) ? "" : "tap-hint"}`, onClick: () => tap(k.id), style: { boxShadow: active === k.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : void 0 } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "role-ico" }, k.icon), /* @__PURE__ */ import_react.default.createElement("span", { className: "vlbl mono" }, k.t, ":"), /* @__PURE__ */ import_react.default.createElement("span", { className: "vseen", style: { color: seen.has(k.id) ? T.success : T.ink3 } }, seen.has(k.id) ? "\u2713" : ""))))), /* @__PURE__ */ import_react.default.createElement(Col, null, cur ? /* @__PURE__ */ import_react.default.createElement("div", { className: "frame fade-step", key: active }, /* @__PURE__ */ import_react.default.createElement("p", { className: "note-h" }, /* @__PURE__ */ import_react.default.createElement("span", { style: { fontSize: 18, marginRight: 6 } }, cur.icon), /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, cur.t, ":")), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, cur.d)) : /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Turini bosing \u2190")), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, /* @__PURE__ */ import_react.default.createElement("b", null, "uses"), " \u2014 tayyor detal, ", /* @__PURE__ */ import_react.default.createElement("b", null, "run"), " \u2014 buyruq. Endi standart amallarning to'g'ri tartibini yig'amiz.")))))));
};
var Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = (0, import_react.useState)(!!storedAnswer);
  const ITEMS = [
    { id: "checkout", label: "\u{1F9E9} uses: actions/checkout@v4" },
    { id: "node", label: "\u{1F9E9} uses: actions/setup-node@v4" },
    { id: "install", label: "\u2328\uFE0F run: npm install (\u{1F4E6} YIG'ISH)" },
    { id: "test", label: "\u2328\uFE0F run: npm test (\u{1F50D} SKANER)" }
  ];
  const HINTS = ["1 \u2014 kodni mashinaga olib keladi", "2 \u2014 Node.js o'rnatadi", "3 \u2014 kutubxonalarni yig'adi", "4 \u2014 kodni skanerdan o'tkazadi"];
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Amaliyot \xB7 tartib", screen, scrollSignal: done ? 1 : 0, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : "Amallarni tartiblang", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Har yo'l xaritasi qaysi ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "4 amal"), "dan boshlanadi?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Tartib muhim: avval kodni olamiz, Node o'rnatamiz, kutubxonalarni yig'amiz, keyin skaner qilamiz. Bo'laklarni sudrab to'g'ri tartibga joylang."), /* @__PURE__ */ import_react.default.createElement(
    DragDropOrder,
    {
      items: ITEMS,
      hints: HINTS,
      doneText: "checkout \u2192 setup-node \u2192 install \u2192 test \u2014 to'g'ri tartib!",
      onSolved: () => {
        if (!done) {
          setDone(true);
          if (storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
        }
      }
    }
  ), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "checkout \u2192 setup-node \u2192 install \u2192 test. Endi bu tartibni yo'l xaritasida o'zingiz yozasiz."))));
};
var Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [run, setRun] = (0, import_react.useState)(!!storedAnswer);
  const [sc, setSc] = (0, import_react.useState)(0);
  const LANES = [{ v: "Node 18" }, { v: "Node 20" }, { v: "Node 22" }];
  (0, import_react.useEffect)(() => {
    if (run && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [run]);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 PARALLEL LENTALAR", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !run, label: run ? "Davom etish" : "3 lentani ishga tushiring", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Bitta yukni ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "3 sharoitda birdan"), " tekshirish \u2014 matrix")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Ba'zan bir xil kodni bir nechta Node versiyasida sinash kerak. ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "matrix"), " yozsangiz \u2014 bitta chamadon ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "bir vaqtning o'zida"), " bir nechta PARALLEL LENTADA tekshiriladi. Tugmani bosing."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: "ci.yml", minH: 130 }, "  ", /* @__PURE__ */ import_react.default.createElement(At, null, "test"), ":", "\n", "    ", /* @__PURE__ */ import_react.default.createElement(At, null, "strategy"), ":", "\n", "      ", /* @__PURE__ */ import_react.default.createElement(At, null, "matrix"), ":", "\n", "        ", /* @__PURE__ */ import_react.default.createElement(At, null, "node"), ": [", /* @__PURE__ */ import_react.default.createElement(St, null, "18"), ", ", /* @__PURE__ */ import_react.default.createElement(St, null, "20"), ", ", /* @__PURE__ */ import_react.default.createElement(St, null, "22"), "]", "\n", "    ", /* @__PURE__ */ import_react.default.createElement(At, null, "runs-on"), ": ubuntu-latest"), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn ${run ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, disabled: run, onClick: () => {
    setRun(true);
    setSc((n) => n + 1);
  } }, run ? "\u2713 3 lenta ishlab bo'ldi" : "\u25B6 matrix ishga tushiring")), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "matrix-lanes" }, LANES.map((l, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: l.v, className: `matrix-lane ${run ? "go" : ""}`, style: { animationDelay: `${i * 0.15}s` } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "matrix-v mono" }, l.v), /* @__PURE__ */ import_react.default.createElement("div", { className: "matrix-track" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "matrix-cap" })), run && /* @__PURE__ */ import_react.default.createElement("span", { className: "matrix-ok" }, "\u2713 o'tdi")))), run && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "3 lenta bir vaqtda aylandi \u2014 kodingiz Node 18, 20 va 22'da birdan sinaldi. Bittasi yiqilsa ham, qaysi versiyada muammo borligi darhol ko'rinadi.")))))));
};
var Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [run, setRun] = (0, import_react.useState)(!!storedAnswer);
  const [t1, setT1] = (0, import_react.useState)(0);
  const [t2, setT2] = (0, import_react.useState)(0);
  const [sc, setSc] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    if (!run) return;
    const i1 = setInterval(() => setT1((v) => Math.min(40, v + 2)), 90);
    const i2 = setInterval(() => setT2((v) => Math.min(8, v + 1)), 90);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
    };
  }, [run]);
  const done = run && t1 >= 40 && t2 >= 8;
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, [done]);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 YAQIN JAVON", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : "Ikkalasini solishtiring", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "Cache"), " \u2014 YAQIN JAVON nima uchun tezlashtiradi?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "\u{1F4E6} YIG'ISH har safar noldan yuklasa \u2014 sekin. ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "cache"), " \u2014 o'tgan safargi tayyor javobni ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "yaqin joyda"), " saqlab qo'yadi. Ikkala holatni solishtiring."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: "ci.yml", minH: 90 }, "      - ", /* @__PURE__ */ import_react.default.createElement(At, null, "uses"), ": ", /* @__PURE__ */ import_react.default.createElement(St, null, "actions/cache@v4"), "\n", "        ", /* @__PURE__ */ import_react.default.createElement(At, null, "with"), ":", "\n", "          ", /* @__PURE__ */ import_react.default.createElement(At, null, "path"), ": node_modules"), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn ${run ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, disabled: run, onClick: () => {
    setRun(true);
    setSc((n) => n + 1);
  } }, run ? "\u2713 Solishtirildi" : "\u25B6 Ikkalasini yoqing")), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "cache-timers" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "cache-t" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "flow-label" }, "Cache'siz"), /* @__PURE__ */ import_react.default.createElement("div", { className: "cache-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { style: { width: `${t1 / 40 * 100}%`, background: T.danger } })), /* @__PURE__ */ import_react.default.createElement("span", { className: "mono cache-n" }, t1, "s")), /* @__PURE__ */ import_react.default.createElement("div", { className: "cache-t" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "flow-label" }, "Cache bilan"), /* @__PURE__ */ import_react.default.createElement("div", { className: "cache-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { style: { width: `${t2 / 8 * 100}%`, background: T.success } })), /* @__PURE__ */ import_react.default.createElement("span", { className: "mono cache-n" }, t2, "s"))), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Cache bilan \u{1F4E6} YIG'ISH 5 baravar tezlashdi \u2014 noldan yuklamay, yaqin javobdan foydalandi.")))))));
};
var Screen15 = (props) => /* @__PURE__ */ import_react.default.createElement(
  QuestionScreen,
  {
    ...props,
    scope: "module-mikro",
    eyebrow: "Mashq \xB7 4-savol",
    questionText: "uses va run orasidagi farq nima?",
    question: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "eyebrow", style: { color: T.accent } }, "To'g'ri javobni tanlang"), /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-sub", style: { marginTop: 8 } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, "uses"), " bilan ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono", style: { color: T.accent } }, "run"), " orasidagi ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "farq"), " nima?")),
    options: ["uses va run \u2014 ikkalasi ham aynan bir xil ishni bajaradi", "uses tayyor amalni chaqiradi, run buyruq bajaradi", "matrix \u2014 faqat bitta lentani tezlashtiradi", "cache har doim skanerni o'chirib qo'yadi"],
    correctIdx: 1,
    explainCorrect: "To'g'ri! uses \u2014 marketplace'dagi tayyor amalni chaqiradi (masalan checkout). run \u2014 oddiy terminal buyrug'i (masalan npm test).",
    explainWrong: {
      0: "Yo'q \u2014 uses tayyor blok, run esa siz yozadigan buyruq. Ular boshqa-boshqa.",
      2: "Aksincha \u2014 matrix bir yukni bir nechta PARALLEL lentada birdan tekshiradi.",
      3: "Cache skanerni o'chirmaydi \u2014 u faqat \u{1F4E6} YIG'ISHni tezlashtiradi.",
      default: "uses tayyor amal chaqiradi, run buyruq bajaradi."
    }
  }
);
var Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [tried, setTried] = (0, import_react.useState)(() => new Set(storedAnswer?.tried || []));
  const [sc, setSc] = (0, import_react.useState)(0);
  const done = tried.has("open") && tried.has("safe");
  const go = (id) => {
    setTried((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });
    setSc((n) => n + 1);
  };
  (0, import_react.useEffect)(() => {
    if (done && storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true, tried: ["open", "safe"] });
  }, [done]);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tushuncha \xB7 SEYF", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : "Ikkalasini sinang", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Maxfiy kalitni ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "qayerga"), " yozamiz?")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Yo'l xaritasida ba'zan API kalit kerak bo'ladi. Uni ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.danger } }, "ochiq yozish"), " yoki ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.success } }, "SEYFga qo'yish"), " mumkin. Ikkalasini sinab ko'ring \u2014 oqibati boshqacha."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: "ci.yml (xato)", minH: 60 }, "      - ", /* @__PURE__ */ import_react.default.createElement(At, null, "run"), ": ", /* @__PURE__ */ import_react.default.createElement(St, null, 'curl -H "Authorization: sk_live_9a8f..."')), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn-soft ${tried.has("open") ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, onClick: () => go("open"), disabled: tried.has("open") }, tried.has("open") ? "\u2713 Sinaldi" : "\u25B6 Ochiq yozib ko'rish"), tried.has("open") && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-warn fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "\u{1F4A5} Kalit ochiq yo'l xaritasida qoldi \u2014 repo public bo'lsa, ", /* @__PURE__ */ import_react.default.createElement("b", null, "butun dunyo"), " uni ko'rishi mumkin."))), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: "ci.yml (to'g'ri)", minH: 60 }, "      - ", /* @__PURE__ */ import_react.default.createElement(At, null, "run"), ": ", /* @__PURE__ */ import_react.default.createElement(St, null, 'curl -H "Authorization: ${{ secrets.API_KEY }}"')), /* @__PURE__ */ import_react.default.createElement("button", { className: `btn-soft ${tried.has("safe") ? "" : "tap-hint"}`, style: { alignSelf: "flex-start" }, onClick: () => go("safe"), disabled: tried.has("safe") }, tried.has("safe") ? "\u2713 Sinaldi" : "\u25B6 SEYFga qo'yib ko'rish"), tried.has("safe") && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "\u{1F512} Kalit SEYFda (Settings \u2192 Secrets) \u2014 jurnalda ham, kodda ham hech qachon ochiq ko'rinmaydi.")))), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Qoida: maxfiy kalit doim ", /* @__PURE__ */ import_react.default.createElement("span", { className: "mono" }, "${{ secrets.NOM }}"), " orqali \u2014 hech qachon to'g'ridan-to'g'ri yozilmaydi.")))));
};
var RB_TRIGGERS = [{ id: "push", t: "push" }, { id: "pull_request", t: "pull_request" }, { id: "schedule", t: "schedule" }];
var RB_RUNNERS = [{ id: "ubuntu-latest", t: "ubuntu-latest" }, { id: "windows-latest", t: "windows-latest" }, { id: "macos-latest", t: "macos-latest" }];
var RB_ORDER = ["checkout", "node", "install", "test"];
var RB_CAND = [
  { id: "checkout", label: "\u{1F9E9} uses: actions/checkout@v4", real: true },
  { id: "node", label: "\u{1F9E9} uses: actions/setup-node@v4", real: true },
  { id: "install", label: "\u2328\uFE0F run: npm install", real: true },
  { id: "test", label: "\u2328\uFE0F run: npm test  \u{1F50D} SKANER", real: true },
  { id: "pushline", label: "\u2328\uFE0F run: git push", real: false },
  { id: "printline", label: "\u2328\uFE0F run: print('test')", real: false }
];
var RB_LABEL = Object.fromEntries(RB_CAND.map((c) => [c.id, c.label]));
function simulateBelt(trigger, runner, steps) {
  if (!trigger) return { key: "no-trigger", spin: false, phone: "idle" };
  if (!runner) return { key: "no-runner", spin: true, machine: false, phone: "idle" };
  const hasTest = steps.includes("test");
  const hasBad = steps.some((s) => !RB_CAND.find((c) => c.id === s)?.real);
  const orderOk = JSON.stringify(steps) === JSON.stringify(RB_ORDER);
  if (orderOk) return { key: "success", spin: true, machine: true, success: true, phone: "ok" };
  if (!hasTest) return { key: "no-scan", spin: true, machine: true, success: false, phone: "bad" };
  if (hasBad) return { key: "bad-step", spin: true, machine: true, success: false, phone: "bad" };
  return { key: "wrong-order", spin: true, machine: true, success: false, phone: "bad" };
}
var RB_JOURNAL = {
  "no-trigger": ["\u23F8 Lenta START SIGNALINI kutmoqda\u2026", "on: bo'sh \u2014 hech qachon aylanmaydi."],
  "no-runner": ["\u{1F504} START SIGNALI keldi \u2014 lenta aylanishga urindi\u2026", "\u2717 runs-on bo'sh \u2014 bu nuqta uchun mashina yo'q.", "Hech qanday amal bajarilmadi."],
  "no-scan": ["\u{1F504} Lenta aylandi \u2014 ubuntu-latest mashinasi tayinlandi.", "\u{1F4E6} YIG'ISH \u2713", "\u{1F50D} SKANER \u2014 topilmadi, o'tkazib yuborildi \u26A0\uFE0F", "\u{1F381} O'RASH \u2713 (tekshirilmagan kod bilan)", "\u2708\uFE0F UCHIRISH \u2014 yuk yo'lovchi qo'liga uchdi", "\u{1F4A5} Foydalanuvchi buzuq saytni ko'rdi."],
  "bad-step": ["\u{1F504} Lenta aylandi \u2014 ubuntu-latest mashinasi tayinlandi.", "\u{1F4E6} YIG'ISH \u2713", "\u{1F50D} SKANER \u2014 steps ichida tegishli bo'lmagan amal bor \u26A0\uFE0F", "\u{1F381} O'RASH \u2713", "\u2708\uFE0F UCHIRISH \u2014 yuk yo'lovchi qo'liga uchdi", "\u{1F4A5} Foydalanuvchi buzuq saytni ko'rdi."],
  "wrong-order": ["\u{1F504} Lenta aylandi \u2014 ubuntu-latest mashinasi tayinlandi.", "\u26A0\uFE0F Amallar tartibi xato \u2014 SKANER kerakli joyda emas.", "\u{1F381} O'RASH \u2713 (noto'g'ri tartibda)", "\u2708\uFE0F UCHIRISH \u2014 yuk yo'lovchi qo'liga uchdi", "\u{1F4A5} Foydalanuvchi buzuq saytni ko'rdi."],
  "success": ["\u{1F504} Lenta aylandi \u2014 ubuntu-latest mashinasi tayinlandi.", "\u{1F4E6} YIG'ISH \u2713", "\u{1F50D} SKANER \u2713", "\u{1F381} O'RASH \u2713", "\u2708\uFE0F UCHIRISH \u2713 \u2014 YASHIL CHIROQ", "\u2705 Foydalanuvchi yangi saytni ko'rdi."]
};
var Screen17 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [trigger, setTrigger] = (0, import_react.useState)(storedAnswer?.trigger || "");
  const [runner, setRunner] = (0, import_react.useState)(storedAnswer?.runner || "");
  const [steps, setSteps] = (0, import_react.useState)(storedAnswer?.steps || []);
  const [result, setResult] = (0, import_react.useState)(null);
  const [sending, setSending] = (0, import_react.useState)(false);
  const [solvedOnce, setSolvedOnce] = (0, import_react.useState)(!!storedAnswer?.correct);
  const [sc, setSc] = (0, import_react.useState)(0);
  const sendTimer = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => () => clearTimeout(sendTimer.current), []);
  const toggleStep = (id) => setSteps((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const send = () => {
    if (sending) return;
    setResult(null);
    setSending(true);
    setSc((n) => n + 1);
    sendTimer.current = setTimeout(() => {
      const r = simulateBelt(trigger, runner, steps);
      setSending(false);
      setResult(r);
      setSc((n) => n + 1);
      if (r.success && !solvedOnce) {
        setSolvedOnce(true);
        onAnswer(screen, { stage: "case", screenIdx: screen, trigger, runner, steps, correct: true, picked: true });
      }
    }, 780);
  };
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "\u{1F6EB} Markaziy \xB7 yo'l xaritasi", screen, scrollSignal: sc, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !solvedOnce, label: solvedOnce ? "Davom etish" : "Lentani yashil qiling", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Yo'l xaritasini ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "o'zingiz"), " yozing.")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "START SIGNALINI, LENTA MASHINASINI va amallarni tanlang, so'ng ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "\xAB\u{1F680} Lentaga qo'ying\xBB"), " bosing. Xaritangiz qanday yozilgan bo'lsa \u2014 lenta ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "aynan shunday"), " aylanadi. Xato bo'lsa \u2014 tuzatib qayta yuboring."), /* @__PURE__ */ import_react.default.createElement(Zoomable, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label" }, "1 \xB7 START SIGNALI (on:)"), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 } }, RB_TRIGGERS.map((t) => /* @__PURE__ */ import_react.default.createElement("button", { key: t.id, className: "gchip", onClick: () => setTrigger(t.id), style: trigger === t.id ? { boxShadow: `inset 0 0 0 1.5px ${T.accent}`, color: T.accent } : void 0 }, trigger === t.id ? "\u25CF " : "", t.t)), trigger && /* @__PURE__ */ import_react.default.createElement("button", { className: "gchip", onClick: () => setTrigger(""), style: { color: T.ink3 } }, "\u2715 tozalash")), /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label", style: { marginTop: 6 } }, "2 \xB7 LENTA MASHINASI (runs-on)"), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 } }, RB_RUNNERS.map((r) => /* @__PURE__ */ import_react.default.createElement("button", { key: r.id, className: "gchip", onClick: () => setRunner(r.id), style: runner === r.id ? { boxShadow: `inset 0 0 0 1.5px ${T.accent}`, color: T.accent } : void 0 }, runner === r.id ? "\u25CF " : "", r.t)), runner && /* @__PURE__ */ import_react.default.createElement("button", { className: "gchip", onClick: () => setRunner(""), style: { color: T.ink3 } }, "\u2715 tozalash")), /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label", style: { marginTop: 6 } }, "3 \xB7 AMALLAR (steps) \u2014 bosgan tartibingizda yoziladi"), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 7 } }, RB_CAND.map((c) => /* @__PURE__ */ import_react.default.createElement("button", { key: c.id, className: "pick-row", style: { width: "auto", boxShadow: steps.includes(c.id) ? `inset 0 0 0 1.5px ${T.success}` : void 0 }, onClick: () => toggleStep(c.id) }, /* @__PURE__ */ import_react.default.createElement("span", null, c.label), /* @__PURE__ */ import_react.default.createElement("span", { className: "pick-plus" }, steps.includes(c.id) ? "\u2713" : "+")))), /* @__PURE__ */ import_react.default.createElement(CodeFile, { name: ".github/workflows/ci.yml", minH: 100 }, /* @__PURE__ */ import_react.default.createElement(At, null, "on"), ": ", trigger ? /* @__PURE__ */ import_react.default.createElement(Kw, null, trigger) : /* @__PURE__ */ import_react.default.createElement("span", { className: "line-empty" }, "___"), "\n", /* @__PURE__ */ import_react.default.createElement(At, null, "runs-on"), ": ", runner ? /* @__PURE__ */ import_react.default.createElement(Kw, null, runner) : /* @__PURE__ */ import_react.default.createElement("span", { className: "line-empty" }, "___"), "\n", /* @__PURE__ */ import_react.default.createElement(At, null, "steps"), ":", "\n", steps.length === 0 ? /* @__PURE__ */ import_react.default.createElement("span", { className: "line-empty" }, "      # amal yo'q") : steps.map((sid, i) => /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, { key: i }, i > 0 ? "\n" : "", "      - ", RB_LABEL[sid]))), /* @__PURE__ */ import_react.default.createElement("button", { className: "btn", style: { alignSelf: "flex-start" }, disabled: sending, onClick: send }, sending ? "\u25CF Lenta aylanmoqda\u2026" : "\u{1F680} Lentaga qo'ying")), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label" }, "natija"), sending ? /* @__PURE__ */ import_react.default.createElement("div", { className: "belt-run spin sending" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "belt-light off" }), /* @__PURE__ */ import_react.default.createElement("span", { className: "belt-lbl" }, "\u{1F504} LENTA AYLANMOQDA\u2026"), /* @__PURE__ */ import_react.default.createElement("span", { className: "belt-suitcase", "aria-hidden": "true" }, "\u{1F9F3}")) : !result ? /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-dash" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, textAlign: "center", fontStyle: "italic", margin: 0 } }, "Xaritangizni tayyorlang \u2192 \xAB\u{1F680} Lentaga qo'ying\xBB \u2190")) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: `belt-run ${result.spin ? "spin" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: `belt-light ${result.success ? "green" : result.key === "no-trigger" ? "off" : "red"}` }), /* @__PURE__ */ import_react.default.createElement("span", { className: "belt-lbl" }, result.key === "no-trigger" ? "AYLANMAYAPTI" : result.key === "no-runner" ? "MASHINA YO'Q" : result.success ? "YASHIL CHIROQ" : "QIZIL CHIROQ")), /* @__PURE__ */ import_react.default.createElement("div", { className: "term fade-step" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "term-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "bb-dots" }, /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null)), /* @__PURE__ */ import_react.default.createElement("span", { className: "term-title" }, "Lenta jurnali")), /* @__PURE__ */ import_react.default.createElement("div", { className: "term-body" }, RB_JOURNAL[result.key].map((l, i) => /* @__PURE__ */ import_react.default.createElement(TLine, { key: i, delay: i * 0.12, out: l, col: l.includes("\u{1F4A5}") || l.includes("\u2717") ? "#FF8A7A" : l.includes("\u2713") || l.includes("\u2705") ? CODE.str : void 0 })))), /* @__PURE__ */ import_react.default.createElement(PhonePreview, { state: result.phone }), result.success && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "plane-lift" }, "\u{1F389}"), " Yo'l xaritangiz to'g'ri! START SIGNALI bor, LENTA MASHINASI bor, amallar to'g'ri tartibda \u2014 ", /* @__PURE__ */ import_react.default.createElement("span", { className: "plane-lift" }, "\u2708\uFE0F"), " samolyot uchdi.")), !result.success && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-warn fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, result.key === "no-trigger" ? "on: bo'sh \u2014 lenta hech qachon aylanmaydi. Signal tanlang." : result.key === "no-runner" ? "runs-on bo'sh \u2014 nuqta uchun mashina tayinlanmagan. Mashina tanlang." : result.key === "no-scan" ? "\u{1F50D} SKANER (npm test) yo'q \u2014 buzuq yuk to'g'ridan-to'g'ri uchib ketdi." : result.key === "bad-step" ? "Amallar orasida yo'l xaritasiga tegishli bo'lmagan qator bor \u2014 uni olib tashlang." : "Amallar tartibi xato \u2014 checkout \u2192 setup-node \u2192 install \u2192 test tartibida bo'lishi kerak."))))))));
};
var S18_JOURNAL = ["\u{1F4E6} YIG'ISH \u2713", "\u{1F381} O'RASH \u2713", "\u2708\uFE0F UCHIRISH \u2014 yuk yo'lovchi qo'liga uchdi", "\u{1F4A5} Foydalanuvchi buzuq saytni ko'rdi"];
var S18_OPTS = [
  "\u{1F50D} SKANER (npm test) bosqichi tashlab ketilgan edi",
  "on: push signali noto'g'ri yozilgan edi",
  "runs-on qatorida mashina ko'rsatilmagan edi",
  "Internet uzilib, natija yetib bormagan edi"
];
var S18_EXPLAIN = {
  1: "on: push to'g'ri yozilgan bo'lsa, lenta muammosiz aylandi \u2014 jurnalda buni ko'rasiz.",
  2: "Mashina bor edi (\u{1F4E6} YIG'ISH va \u{1F381} O'RASH bajarildi) \u2014 muammo boshqa joyda.",
  3: "Internet emas \u2014 jurnalda barcha amallar muvaffaqiyatli yozilgan, faqat biri yo'q.",
  default: "Jurnalni diqqat bilan qaytadan o'qing: qaysi amal umuman ko'rinmayapti?"
};
var Screen18 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = (0, import_react.useState)(storedAnswer?.uiPicked ?? null);
  const [recapOpen, setRecapOpen] = (0, import_react.useState)(false);
  const done = picked !== null;
  const correctIdx = 0;
  const pick = (i) => {
    if (done) return;
    setPicked(i);
    const isCorrect = i === correctIdx;
    onAnswer(screen, { stage: "final", screenIdx: screen, question: "Lenta jurnali \u2014 qizil chiroq sababi", uiPicked: i, correct: isCorrect, solved: true, picked: isCorrect ? 0 : 1 });
  };
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Yakuniy \xB7 LENTA JURNALI", screen, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { disabled: !done, label: done ? "Davom etish" : "Sababni toping", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(14px,2.2vw,20px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Qizil chiroq yondi \u2014 ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "sababini"), " jurnaldan toping.")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Foydalanuvchi telefonida buzuq sayt chiqdi. Quyidagi LENTA JURNALIGA qarang va sababni toping. ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.accent } }, "Faqat bitta urinish bor"), " \u2014 diqqat bilan tanlang."), /* @__PURE__ */ import_react.default.createElement(Split, null, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "term" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "term-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "bb-dots" }, /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null), /* @__PURE__ */ import_react.default.createElement("i", null)), /* @__PURE__ */ import_react.default.createElement("span", { className: "term-title" }, "Lenta jurnali \u2014 run #22")), /* @__PURE__ */ import_react.default.createElement("div", { className: "term-body" }, S18_JOURNAL.map((l, i) => /* @__PURE__ */ import_react.default.createElement(TLine, { key: i, out: l, col: l.includes("\u{1F4A5}") ? "#FF8A7A" : l.includes("\u2713") ? CODE.str : void 0 })))), /* @__PURE__ */ import_react.default.createElement(PhonePreview, { state: "bad" })), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label" }, "Nega qizil chiroq yondi?"), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 9 } }, S18_OPTS.map((o, i) => {
    let cls = "option";
    if (done) {
      if (i === correctIdx) cls += " option-correct";
      else if (i === picked) cls += " option-picked-wrong";
      else cls += " option-wrong";
    }
    return /* @__PURE__ */ import_react.default.createElement("button", { key: i, className: cls, disabled: done, onClick: () => pick(i), style: { padding: "clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)", fontSize: "clamp(14px,1.7vw,16px)", display: "flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono small", style: { minWidth: 20, color: done && i === correctIdx ? T.success : T.ink3 } }, String.fromCharCode(65 + i)), /* @__PURE__ */ import_react.default.createElement("span", { style: { flex: 1 } }, o));
  })), done && /* @__PURE__ */ import_react.default.createElement("div", { className: picked === correctIdx ? "frame-success fade-step" : "frame-warn fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, picked === correctIdx ? "To'g'ri! Jurnalda \u{1F50D} SKANER umuman ko'rinmaydi \u2014 u tashlab ketilgan, shuning uchun buzuq yuk to'g'ridan-to'g'ri uchib ketdi." : S18_EXPLAIN[picked] || S18_EXPLAIN.default), picked !== correctIdx && /* @__PURE__ */ import_react.default.createElement("button", { className: "rc-open-mini", onClick: () => setRecapOpen(true) }, "\u{1F4D6} Qisqa takrorlash \u2014 mavzuni yana bir ko'rish")))), recapOpen && RECAPS[screen] && /* @__PURE__ */ import_react.default.createElement(RecapOverlay, { screenIdx: screen, onClose: () => setRecapOpen(false) })));
};
var ACHIEVEMENTS = {
  greenLight: { icon: "\u{1F7E2}", name: "Green Light", desc: "Yo'l xaritasi faylining aniq manzilini topdingiz" },
  runwayClear: { icon: "\u{1F6EB}", name: "Runway Clear", desc: "Amal turlarini \u2014 uses va run farqini \u2014 to'g'ri aniqladingiz" },
  routeWriter: { icon: "\u{1F5FA}\uFE0F", name: "Route Writer", desc: "O'z yo'l xaritangizni yozib, lentani muvaffaqiyatli aylantirdingiz" },
  logDetective: { icon: "\u{1F50D}", name: "Log Detective", desc: "Jurnaldan qizil chiroq sababini 1-urinishda topdingiz" }
};
var ACH_TRIGGERS = { s4: "greenLight", s15: "runwayClear", s17: "routeWriter", s18: "logDetective" };
function AchCelebrate({ ach, onDone }) {
  (0, import_react.useEffect)(() => {
    const t = setTimeout(onDone, 4e3);
    return () => clearTimeout(t);
  }, []);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-overlay", onClick: onDone, role: "status", "aria-label": `Yangi nishon: ${ach.name}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-rays", "aria-hidden": "true" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-glow", "aria-hidden": "true" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-ring", "aria-hidden": "true" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-ring d2", "aria-hidden": "true" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-stage" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-medal-wrap" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-medal" }, ach.icon, /* @__PURE__ */ import_react.default.createElement("span", { className: "acu-shine" })), Array.from({ length: 14 }).map((_, i) => /* @__PURE__ */ import_react.default.createElement("span", { key: i, className: "acu-spark", style: { "--a": `${i * (360 / 14)}deg`, animationDelay: `${0.18 + i % 5 * 0.05}s` } }, "\u2726"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "acu-txt" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "acu-eyebrow" }, "\u{1F3C5} Nishon ochildi!"), /* @__PURE__ */ import_react.default.createElement("span", { className: "acu-name" }, ach.name), ach.desc && /* @__PURE__ */ import_react.default.createElement("span", { className: "acu-desc" }, ach.desc)), /* @__PURE__ */ import_react.default.createElement("span", { className: "acu-tap" }, "bosib davom eting")));
}
function AchToasts({ toasts, onDone }) {
  const t = toasts[0];
  const a = t && ACHIEVEMENTS[t.id];
  if (!a) return null;
  return /* @__PURE__ */ import_react.default.createElement(AchCelebrate, { key: t.k, ach: a, onDone: () => onDone(t.k) });
}
var Confetti = () => {
  const COLORS = [T.accent, T.success, T.blue, "#FFD380", "#FF7755", "#7DD181"];
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "confetti", "aria-hidden": "true" }, Array.from({ length: 44 }).map((_, i) => {
    const left = (i * 2.31 + i % 7 * 4) % 100;
    const size = 6 + i % 4 * 2;
    return /* @__PURE__ */ import_react.default.createElement("span", { key: i, className: "confetti-bit", style: {
      left: `${left}%`,
      background: COLORS[i % COLORS.length],
      width: size,
      height: size * 1.5,
      animationDelay: `${i % 11 * 0.16}s`,
      animationDuration: `${2.4 + i % 6 * 0.45}s`,
      borderRadius: i % 2 ? "2px" : "50%"
    } });
  }));
};
var Q_LABELS = { 4: "1 \u2014 Yo'l xaritasi joyi", 7: "2 \u2014 Ierarxiya", 10: "3 \u2014 Signal & mashina", 15: "4 \u2014 Amal turlari", 18: "5 \u2014 Jurnal" };
var QUIZ_MS = 15e3;
var QZ_BG_SHAPES = [
  { ch: "on:", l: 5, t: 10, s: 32, d: 19, dl: 0 },
  { ch: "runs-on", l: 85, t: 8, s: 26, d: 23, dl: 1.5 },
  { ch: "push", l: 8, t: 72, s: 26, d: 27, dl: 0.8 },
  { ch: "uses", l: 76, t: 68, s: 26, d: 21, dl: 2.2 },
  { ch: "steps", l: 45, t: 86, s: 24, d: 25, dl: 1.1 },
  { ch: "matrix", l: 66, t: 26, s: 22, d: 17, dl: 0.4 },
  { ch: "cache", l: 26, t: 34, s: 22, d: 20, dl: 1.9 },
  { ch: "ci.yml", l: 55, t: 5, s: 24, d: 22, dl: 0.6 },
  { ch: "\u2717", l: 91, t: 42, s: 30, d: 24, dl: 1.3 },
  { ch: "\u2713", l: 16, t: 52, s: 30, d: 26, dl: 2.6 },
  { ch: "checkout", l: 34, t: 62, s: 18, d: 29, dl: 3.4 },
  { ch: "secrets", l: 2, t: 30, s: 22, d: 28, dl: 3.1 },
  { ch: "run:", l: 60, t: 90, s: 22, d: 31, dl: 4.2 },
  { ch: "\u2708\uFE0F", l: 20, t: 16, s: 22, d: 18, dl: 2.9 }
];
var QUIZ_BANK = [
  { q: "`.github/workflows/ci.yml` \u2014 bu fayl nima?", opts: ["Loyihaning butun manba kodi shu yerda saqlanadi, boshqa hech narsa yo'q", "Yo'l xaritasi \u2014 lentaning ishini belgilaydi", "Foydalanuvchi ko'radigan saytning zaxira nusxasi", "GitHub'ning o'zi uchun yashirin ichki sozlamalar"], correct: 1 },
  { q: "`on: push` nima uchun kerak?", opts: ["Lentani har push'da avtomatik ishga tushiradi", "Repozitoriyni butunlay o'chirib tashlash buyrug'i", "Faqat loyiha hujjatlarini yangilab turish uchun", "Har push'dan keyin kodni qo'lda serverga joylash kerak bo'ladi"], correct: 0 },
  { q: "`runs-on: ubuntu-latest` nimani bildiradi?", opts: ["Faqat Ubuntu tizimida yozish mumkin degan ma'no", "Loyihaning nomi aynan shunday bo'lishi shart, boshqacha bo'lmaydi", "Lentani aylantiradigan mashina \u2014 GitHub bepul beradi", "Testlar hech qachon ishga tushmaydi degan belgi"], correct: 2 },
  { q: "\u{1F4E6} YIG'ISH nuqtasida nima bajariladi?", opts: ["Loyiha kerak qiladigan kutubxonalar o'rnatiladi", "Yozilgan kod o'lcham ramkasi bo'yicha tekshiriladi", "Tayyor sayt foydalanuvchiga to'g'ridan-to'g'ri yuboriladi, hech narsa tekshirilmaydi", "Avvalgi eski yuk qaytadan tiklab olinadi"], correct: 0 },
  { q: "\u{1F50D} SKANER nuqtasi tushirib qoldirilsa nima bo'ladi?", opts: ["Lenta odatdagidan biroz sekinroq aylanib qoladi, xolos", "GitHub bu bosqichni avtomatik o'zi qo'shib qo'yadi, siz hech narsa qilmaysiz", "Buzuq yuk to'g'ridan-to'g'ri foydalanuvchiga uchib ketadi", "Faqat ogohlantirish chiqadi, yuk baribir tekshiriladi"], correct: 2 },
  { q: "Amallar (steps) qanday tartibda bajariladi?", opts: ["Har safar tasodifiy, boshqa-boshqa tartibda ishlaydi, hech qanday qoida yo'q", "Yozilgan tartibda, yuqoridan pastga ketma-ket bajariladi", "Eng oxirgi yozilgan amal birinchi bajariladi", "Barcha amallar bir vaqtning o'zida, tartibsiz"], correct: 1 },
  { q: "`uses: actions/checkout@v4` amali nima qiladi?", opts: ["Loyihadagi butun kodni izsiz o'chirib tashlaydi", "Yangi bir lenta mashinasini alohida sotib oladi", "Testlarni siz o'rniga avtomatik yozib beradi, o'zi tekshirib chiqadi", "Repodagi kodni lenta mashinasiga olib keladi"], correct: 3 },
  { q: "PARALLEL LENTALAR (matrix) nima uchun ishlatiladi?", opts: ["Bitta yukni ikki qismga bo'lib yuborish uchun", "Lenta mashinasini butunlay to'xtatib, o'chirish uchun", "Bitta yukni bir nechta sharoitda birdan sinash uchun", "Faqat rasm fayllarini siqib kichraytirish uchun, boshqa vazifasi yo'q"], correct: 2 },
  { q: "YAQIN JAVON (cache) nima beradi?", opts: ["Faqat mentorning o'z kompyuterida ishlaydi", "Har safar hamma narsani qaytadan noldan yuklaydi, hech narsa saqlanmaydi", "Skanerlash bosqichini butunlay o'chirib qo'yadi", "Noldan yuklamay, tayyor javobdan foydalanib tezlashtiradi"], correct: 3 },
  { q: "Maxfiy kalitni to'g'ridan-to'g'ri yo'l xaritasiga ochiq yozsangiz nima bo'ladi?", opts: ["Butun dunyo uni ochiq holda ko'rishi mumkin bo'ladi", "Faqat siz ko'rasiz, boshqa hech kim ko'ra olmaydi, hammasi maxfiy", "Hech narsa \u2014 GitHub uni avtomatik yashirib qo'yadi, xavotir yo'q", "Lenta bu holatda umuman ishga tushmay qoladi"], correct: 0 },
  { q: "`${{ secrets.API_KEY }}` yozuvi nimani bildiradi?", opts: ["Kalitni oddiy matn sifatida ekranga to'g'ridan-to'g'ri chiqarish", "Kalitni seyfdan xavfsiz shaklda olib kelish", "Kalitni boshqa bir loyihaga ko'chirib qo'yish", "Kalitni butunlay o'chirib, izsiz yo'q qilib tashlash"], correct: 1 },
  { q: "TABLO (status badge) nimani ko'rsatadi?", opts: ["Loyihaning umumiy fayl hajmini ko'rsatadi", "Serverning qaysi mamlakatda joylashganini", "Nechta o'quvchi darsni tugatganini ko'rsatib beradi, statistika chiqaradi", "Repo sahifasida lenta yashilmi yoki qizilmi ekanini"], correct: 3 }
];
var CsNeonBolt = ({ flip }) => /* @__PURE__ */ import_react.default.createElement("span", { className: `csn-boltwrap ${flip ? "flip" : ""}`, "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("svg", { className: "csn-bolt", viewBox: "0 0 60 100" }, /* @__PURE__ */ import_react.default.createElement("defs", null, /* @__PURE__ */ import_react.default.createElement("linearGradient", { id: "csnb", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ import_react.default.createElement("stop", { offset: "0", stopColor: "#FFFFFF" }), /* @__PURE__ */ import_react.default.createElement("stop", { offset: "1", stopColor: "#B08CFF" }))), /* @__PURE__ */ import_react.default.createElement("path", { d: "M38 4 L10 52 L27 52 L20 96 L52 40 L33 40 Z", fill: "url(#csnb)", stroke: "rgba(255,255,255,.65)", strokeWidth: "1.6", strokeLinejoin: "round" })), /* @__PURE__ */ import_react.default.createElement("i", { className: "cs-spark s1" }), /* @__PURE__ */ import_react.default.createElement("i", { className: "cs-spark s2" }), /* @__PURE__ */ import_react.default.createElement("i", { className: "cs-spark s3" }));
var CsWordmark = ({ onClick, disabled, hint, stats = true, bolt = true, liveOn = false }) => {
  const clickable = !!onClick && !disabled;
  const [charge, setCharge] = (0, import_react.useState)(false);
  const fire = () => {
    if (!clickable || charge) return;
    setCharge(true);
    setTimeout(onClick, 430);
    setTimeout(() => setCharge(false), 900);
  };
  return /* @__PURE__ */ import_react.default.createElement(
    "div",
    {
      className: `cs-cap ${clickable ? "cs-clickable" : ""} ${disabled ? "cs-off" : ""} ${liveOn ? "cs-live" : ""} ${charge ? "cs-charging" : ""}`,
      ...clickable ? { role: "button", tabIndex: 0, onClick: fire, onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fire();
        }
      } } : {}
    },
    /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-ring", "aria-hidden": "true" }),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "cs-sky", "aria-hidden": "true" }, QZ_BG_SHAPES.map((s, i) => /* @__PURE__ */ import_react.default.createElement("span", { key: i, className: `cs-tok ${i % 2 ? "back" : "front"}`, style: { left: `${s.l}%`, top: `${s.t}%`, fontSize: `clamp(9px, ${Math.round(s.s * 0.4)}px, ${Math.round(s.s * 0.6)}px)`, "--d": `${s.d}s`, animationDelay: `-${s.dl * 3}s` } }, s.ch)), [[14, 30, 24], [38, 66, 15], [57, 20, 27], [76, 60, 18], [88, 36, 13]].map(([l, t, w], i) => /* @__PURE__ */ import_react.default.createElement("i", { key: i, className: "cs-dash", style: { left: `${l}%`, top: `${t}%`, width: w, animationDelay: `-${i * 1.7}s` } })), /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-thunder" })),
    /* @__PURE__ */ import_react.default.createElement("div", { className: "cs-row" }, bolt && /* @__PURE__ */ import_react.default.createElement(CsNeonBolt, null), /* @__PURE__ */ import_react.default.createElement("div", { className: "cs-word", "data-text": "CODE STRIKE", "aria-label": "CodeStrike" }, "CODE STRIKE"), bolt && /* @__PURE__ */ import_react.default.createElement(CsNeonBolt, { flip: true })),
    stats && /* @__PURE__ */ import_react.default.createElement("div", { className: "cs-hud" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-hud-i" }, /* @__PURE__ */ import_react.default.createElement("b", null, QUIZ_BANK.length), " SAVOL"), /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-hud-dot" }, "\xB7"), /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-hud-i" }, /* @__PURE__ */ import_react.default.createElement("b", null, QUIZ_MS / 1e3), " SONIYA"), /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-hud-dot" }, "\xB7"), /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-hud-i" }, "\u{1F3C6} PODIUM")),
    hint && /* @__PURE__ */ import_react.default.createElement("span", { className: `cs-enter ${disabled ? "wait" : ""}` }, hint),
    liveOn && /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-livedot" }, /* @__PURE__ */ import_react.default.createElement("i", null), "LIVE"),
    charge && /* @__PURE__ */ import_react.default.createElement("span", { className: "cs-portal", "aria-hidden": "true" })
  );
};
var QUIZ_BASE_IDX = 100;
var QUIZ_COLORS = ["#FF5A2C", "#0FA6D6", "#F5A623", "#22A05C"];
var QUIZ_SHAPES = ["\u25B2", "\u25C6", "\u25CF", "\u25A0"];
var quizPts = (elapsedMs) => elapsedMs <= 500 ? 1e3 : Math.max(0, Math.round(1e3 * (1 - Math.min(elapsedMs, QUIZ_MS) / QUIZ_MS / 2)));
var quizScore = (rows) => {
  const byQ = {};
  rows.forEach((r) => {
    byQ[r.screen_idx - QUIZ_BASE_IDX] = r;
  });
  let pts = 0, streak = 0, maxStreak = 0, ok = 0;
  for (let i = 0; i < QUIZ_BANK.length; i++) {
    const a = byQ[i];
    if (a && a.correct) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
      ok++;
      pts += quizPts(a.elapsed_ms) + (streak >= 2 ? 100 : 0);
    } else streak = 0;
  }
  return { pts, ok, maxStreak };
};
function QzTimer({ remaining }) {
  const R = 26, C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, remaining / QUIZ_MS));
  const sec = Math.ceil(remaining / 1e3);
  const col = remaining > 1e4 ? "#2BD97C" : remaining > 5e3 ? "#FFC94D" : "#FF5A5A";
  return /* @__PURE__ */ import_react.default.createElement("div", { className: `qz-timer ${remaining <= 5e3 && remaining > 0 ? "urgent" : ""}` }, /* @__PURE__ */ import_react.default.createElement("svg", { width: "64", height: "64", viewBox: "0 0 64 64" }, /* @__PURE__ */ import_react.default.createElement("circle", { cx: "32", cy: "32", r: R, fill: "none", stroke: "rgba(255,255,255,0.16)", strokeWidth: "6" }), /* @__PURE__ */ import_react.default.createElement("circle", { cx: "32", cy: "32", r: R, fill: "none", stroke: col, strokeWidth: "6", strokeLinecap: "round", strokeDasharray: C, strokeDashoffset: C * (1 - frac), transform: "rotate(-90 32 32)", style: { transition: "stroke-dashoffset 0.12s linear, stroke 0.4s" } })), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-timer-n", style: { color: col } }, sec));
}
function QzFX() {
  const ref = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const cv = ref.current;
    if (!cv) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    const ctx = cv.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, raf = 0;
    const size = () => {
      W = cv.width = Math.max(1, cv.offsetWidth * DPR);
      H = cv.height = Math.max(1, cv.offsetHeight * DPR);
    };
    size();
    window.addEventListener("resize", size);
    const TOK = ["on:", "runs-on", "uses", "run:", "steps", "\u2713", "\u2717", "push", "matrix"];
    const em = [], toks = [];
    for (let i = 0; i < 26; i++) em.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.7, ph: Math.random() * 6.28, sw: 0.3 + Math.random() * 0.6 });
    for (let i = 0; i < 9; i++) toks.push({ x: Math.random() * W, y: Math.random() * H, z: 0.4 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.16, t: TOK[i % TOK.length], r: (Math.random() - 0.5) * 0.5 });
    const draw = (tm) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of em) {
        p.y -= (0.15 + p.z * 0.35) * DPR;
        p.x += Math.sin(tm / 1400 + p.ph) * p.sw * DPR * 0.35;
        if (p.y < -12) {
          p.y = H + 12;
          p.x = Math.random() * W;
        }
      }
      ctx.lineWidth = 1 * DPR;
      for (let a = 0; a < em.length; a++) for (let b = a + 1; b < em.length; b++) {
        const dx = em[a].x - em[b].x, dy = em[a].y - em[b].y, d = Math.sqrt(dx * dx + dy * dy), mx = 95 * DPR;
        if (d < mx) {
          ctx.strokeStyle = "rgba(150,95,255," + 0.11 * (1 - d / mx) + ")";
          ctx.beginPath();
          ctx.moveTo(em[a].x, em[a].y);
          ctx.lineTo(em[b].x, em[b].y);
          ctx.stroke();
        }
      }
      for (const p of em) {
        const s = (1.3 + p.z * 2.2) * DPR, tw = 0.22 + p.z * 0.3 + Math.sin(tm / 600 + p.ph) * 0.1;
        ctx.fillStyle = "rgba(205,175,255," + tw + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, 6.29);
        ctx.fill();
      }
      for (const t of toks) {
        t.x += t.vx * DPR;
        t.y -= (0.08 + t.z * 0.12) * DPR;
        if (t.y < -34) t.y = H + 34;
        if (t.x < -50) t.x = W + 50;
        if (t.x > W + 50) t.x = -50;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.r * 0.12);
        ctx.font = "700 " + (13 + t.z * 22) * DPR + 'px "JetBrains Mono",monospace';
        ctx.fillStyle = "rgba(190,150,255," + (0.05 + t.z * 0.07) + ")";
        ctx.textAlign = "center";
        ctx.fillText(t.t, 0, 0);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);
  return /* @__PURE__ */ import_react.default.createElement("canvas", { ref, className: "qz-fx", "aria-hidden": "true" });
}
function QuizArena({ live, onClose, startSolo }) {
  const isMentor = live.mode === "mentor";
  const isStudent = live.mode === "student";
  const [soloMode, setSoloMode] = (0, import_react.useState)(!!startSolo);
  const solo = soloMode || !isMentor && !isStudent;
  const soloRef = (0, import_react.useRef)(solo);
  soloRef.current = solo;
  const [phase, setPhase] = (0, import_react.useState)("lobby");
  const [qi, setQi] = (0, import_react.useState)(-1);
  const [remaining, setRemaining] = (0, import_react.useState)(QUIZ_MS);
  const [myAnswers, setMyAnswers] = (0, import_react.useState)({});
  const [players, setPlayers] = (0, import_react.useState)([]);
  const [qRows, setQRows] = (0, import_react.useState)([]);
  const [answeredN, setAnsweredN] = (0, import_react.useState)(0);
  const [classEnded, setClassEnded] = (0, import_react.useState)(false);
  const seenQRef = (0, import_react.useRef)(-1);
  const qStartRef = (0, import_react.useRef)(0);
  const deadlineRef = (0, import_react.useRef)(0);
  const phaseRef = (0, import_react.useRef)(phase);
  phaseRef.current = phase;
  (0, import_react.useEffect)(() => {
    if (!isStudent || solo || !live.playerId) return;
    liveQuizAnswers(live.pin).then((rows) => {
      const mine = {};
      rows.filter((r) => r.player_id === live.playerId).forEach((r) => {
        mine[r.screen_idx - QUIZ_BASE_IDX] = { picked: r.picked, correct: r.correct, elapsed: r.elapsed_ms };
      });
      setMyAnswers((m) => ({ ...mine, ...m }));
    }).catch(() => {
    });
  }, []);
  (0, import_react.useEffect)(() => {
    if (soloRef.current) return;
    let on = true, t = null;
    const tick = async () => {
      if (soloRef.current) return;
      try {
        const row = await liveGet(live.pin);
        if (!on) return;
        if (row) {
          const st = row.quiz_state || "off", q = row.quiz_q ?? -1;
          if (st === "q" && q !== seenQRef.current) {
            seenQRef.current = q;
            qStartRef.current = Date.now();
            deadlineRef.current = Date.now() + QUIZ_MS - (isMentor ? 0 : 700);
            setQi(q);
            setRemaining(deadlineRef.current - Date.now());
            setPhase("q");
            setAnsweredN(0);
          } else if (st === "r") {
            if (q !== seenQRef.current) {
              seenQRef.current = q;
              setQi(q);
            }
            setPhase((p) => p === "done" ? p : "reveal");
          } else if (st === "done") {
            setPhase("done");
          }
        }
        const st1 = row ? row.quiz_state || "off" : null;
        const ph = st1 === "r" ? "reveal" : st1 === "done" ? "done" : st1 === "lobby" ? "lobby" : st1 === "q" ? "q" : phaseRef.current;
        if (on) setClassEnded(!row || row.status === "ended");
        if (ph === "lobby" || ph === "reveal" || ph === "done" || phaseRef.current === "reveal") {
          const [pl, qa] = await Promise.all([livePlayers(live.pin), liveQuizAnswers(live.pin)]);
          if (on) {
            setPlayers(pl);
            setQRows(qa);
          }
        } else if (ph === "q" && isMentor) {
          const [pl, qa] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, QUIZ_BASE_IDX + seenQRef.current)]);
          if (on) {
            setPlayers(pl);
            setAnsweredN(qa.length);
          }
        }
      } catch {
      }
      if (on) t = setTimeout(tick, 1200);
    };
    tick();
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, []);
  (0, import_react.useEffect)(() => {
    if (phase !== "q") return;
    const iv = setInterval(() => {
      const rem = deadlineRef.current - Date.now();
      setRemaining(rem > 0 ? rem : 0);
      if (rem <= 0) {
        clearInterval(iv);
        setPhase("reveal");
        if (isMentor && !soloRef.current) ctrl("r", seenQRef.current);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase, qi]);
  const ctrl = async (state, q) => {
    try {
      await live.quizControl(state, q);
      if (state === "q") {
        seenQRef.current = q;
        qStartRef.current = Date.now();
        deadlineRef.current = Date.now() + QUIZ_MS;
        setQi(q);
        setRemaining(QUIZ_MS);
        setPhase("q");
        setAnsweredN(0);
      } else if (state === "r" || state === "done") {
        setPhase(state === "r" ? "reveal" : "done");
        Promise.all([livePlayers(live.pin), liveQuizAnswers(live.pin)]).then(([pl, qa]) => {
          setPlayers(pl);
          setQRows(qa);
        }).catch(() => {
        });
      }
    } catch {
    }
  };
  const soloStart = (i) => {
    seenQRef.current = i;
    qStartRef.current = Date.now();
    deadlineRef.current = Date.now() + QUIZ_MS;
    setQi(i);
    setRemaining(QUIZ_MS);
    setPhase("q");
  };
  const soloNext = () => {
    const n = qi + 1;
    if (n >= QUIZ_BANK.length) setPhase("done");
    else soloStart(n);
  };
  const soloReplay = () => {
    setMyAnswers({});
    soloStart(0);
  };
  const startPractice = () => {
    setSoloMode(true);
    setMyAnswers({});
    soloStart(0);
  };
  const answer = (i) => {
    if (phase !== "q" || isMentor || myAnswers[qi]) return;
    const elapsed = Math.min(QUIZ_MS, Date.now() - qStartRef.current);
    const correct = i === QUIZ_BANK[qi].correct;
    setMyAnswers((m) => ({ ...m, [qi]: { picked: i, correct, elapsed } }));
    if (isStudent && !solo) live.submitAnswer(QUIZ_BASE_IDX + qi, `quiz-${qi}`, i, correct, elapsed);
    if (solo) setPhase("reveal");
  };
  const streakUpTo = (k) => {
    let s = 0;
    for (let i = 0; i <= k; i++) {
      if (myAnswers[i]?.correct) s++;
      else s = 0;
    }
    return s;
  };
  const myPtsFor = (k) => {
    const a = myAnswers[k];
    if (!a || !a.correct) return 0;
    return quizPts(a.elapsed) + (streakUpTo(k) >= 2 ? 100 : 0);
  };
  const board = players.map((p) => {
    const s = quizScore(qRows.filter((r) => r.player_id === p.id));
    return { id: p.id, nickname: p.nickname, ...s };
  }).sort((a, b) => b.pts - a.pts || b.ok - a.ok);
  const myRank = live.playerId ? board.findIndex((b) => b.id === live.playerId) : -1;
  const soloRows = Object.entries(myAnswers).map(([k, v]) => ({ player_id: "me", screen_idx: QUIZ_BASE_IDX + Number(k), correct: v.correct, elapsed_ms: v.elapsed }));
  const soloScore = quizScore(soloRows);
  const Q = qi >= 0 && qi < QUIZ_BANK.length ? QUIZ_BANK[qi] : null;
  const counts = Q ? Q.opts.map((_, i) => {
    if (solo) return myAnswers[qi]?.picked === i ? 1 : 0;
    let n = qRows.filter((r) => r.screen_idx === QUIZ_BASE_IDX + qi && r.picked === i).length;
    const mine = myAnswers[qi];
    if (mine && mine.picked === i && live.playerId && !qRows.some((r) => r.player_id === live.playerId && r.screen_idx === QUIZ_BASE_IDX + qi)) n++;
    return n;
  }) : [];
  const lastQ = qi >= QUIZ_BANK.length - 1;
  const my = qi >= 0 ? myAnswers[qi] : null;
  const closeArena = () => {
    if (isMentor && !solo && phase !== "done") {
      if (typeof window !== "undefined" && !window.confirm("Test hali yakunlanmadi \u2014 yopsangiz o'quvchilar arenada kutib qoladi.\nBaribir yopilsinmi?")) return;
    }
    onClose();
  };
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-arena" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-bg", "aria-hidden": "true" }, QZ_BG_SHAPES.map((s, i) => /* @__PURE__ */ import_react.default.createElement("span", { key: i, className: "qz-shp", style: { left: `${s.l}%`, top: `${s.t}%`, fontSize: s.s, color: s.c, animationDuration: `${s.d}s`, animationDelay: `${s.dl}s` } }, s.ch))), /* @__PURE__ */ import_react.default.createElement(QzFX, null), /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-x", onClick: closeArena, "aria-label": "Yopish" }, "\u2715"), classEnded && isStudent && !solo && phase !== "done" && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-endnote fade-step" }, /* @__PURE__ */ import_react.default.createElement("span", null, "\u26A0\uFE0F Jonli dars yakunlandi \u2014 testni o'zingiz davom ettiring:"), /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn", onClick: startPractice }, "\u{1F4D6} Mashq rejimida davom etish")), phase === "lobby" && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-view fade-step" }, /* @__PURE__ */ import_react.default.createElement(CsWordmark, null), /* @__PURE__ */ import_react.default.createElement("p", { className: "qz-sub", style: { marginTop: -4 } }, "Tezroq to'g'ri bossangiz \u2014 ko'proq ball. Ketma-ket to'g'ri javoblar \u{1F525} bonus beradi!"), !solo && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-lobby-players" }, players.map((p) => /* @__PURE__ */ import_react.default.createElement("span", { key: p.id, className: `qz-pchip ${p.id === live.playerId ? "me" : ""}` }, p.nickname)), players.length === 0 && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-dimtxt" }, "O'quvchilar kutilmoqda\u2026")), isMentor && /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn big", disabled: players.length === 0, onClick: () => ctrl("q", 0) }, "\u25B6 Testni boshlash"), isStudent && !solo && /* @__PURE__ */ import_react.default.createElement("p", { className: "qz-waitmsg" }, "\u23F3 Mentor testni boshlashini kuting\u2026"), solo && /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn big", onClick: () => soloStart(0) }, "\u25B6 Boshlash")), phase === "q" && Q && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-view qz-qview fade-step", key: `q${qi}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-top" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-count" }, "Savol ", /* @__PURE__ */ import_react.default.createElement("b", null, qi + 1), "/", QUIZ_BANK.length), /* @__PURE__ */ import_react.default.createElement(QzTimer, { remaining }), isMentor ? /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-ansn" }, "\u{1F4E8} ", answeredN, "/", players.length) : /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-ansn" }, streakUpTo(qi - 1) >= 2 ? `\u{1F525} x${streakUpTo(qi - 1)}` : " ")), /* @__PURE__ */ import_react.default.createElement("h2", { className: "qz-q" }, fmtCode(Q.q)), /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-grid" }, Q.opts.map((o, i) => {
    const pickedThis = my && my.picked === i;
    return /* @__PURE__ */ import_react.default.createElement("button", { key: i, className: `qz-tile ${my ? pickedThis ? "picked" : "faded" : ""}`, style: { background: QUIZ_COLORS[i] }, disabled: isMentor || !!my, onClick: () => answer(i) }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-shape" }, QUIZ_SHAPES[i]), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-opt" }, fmtCode(o)), pickedThis && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-pbadge" }, "\u2714"));
  })), my && !isMentor && !solo && /* @__PURE__ */ import_react.default.createElement("p", { className: "qz-waitmsg" }, "\u2714 Javob qabul qilindi \u2014 natijani kuting\u2026"), isMentor && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-mrow" }, answeredN >= players.length && players.length > 0 && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-allin" }, "\u2713 Hamma javob berdi!"), /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn", onClick: () => ctrl("r", qi) }, "\u23F9 Natijani ochish"))), phase === "reveal" && Q && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-view qz-qview fade-step", key: `r${qi}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-top" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-count" }, "Savol ", /* @__PURE__ */ import_react.default.createElement("b", null, qi + 1), "/", QUIZ_BANK.length, " \u2014 natija")), /* @__PURE__ */ import_react.default.createElement("h2", { className: "qz-q" }, fmtCode(Q.q)), /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-grid" }, Q.opts.map((o, i) => {
    const win = i === Q.correct;
    const pickedThis = my && my.picked === i;
    return /* @__PURE__ */ import_react.default.createElement("div", { key: i, className: `qz-tile rv ${win ? "win" : "lose"} ${pickedThis ? "picked" : ""}`, style: { background: QUIZ_COLORS[i] } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-shape" }, QUIZ_SHAPES[i]), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-opt" }, fmtCode(o)), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-cnt" }, win ? "\u2713 " : "", counts[i]));
  })), !isMentor && /* @__PURE__ */ import_react.default.createElement("div", { className: `qz-res ${my?.correct ? "good" : "bad"}` }, my?.correct ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-res-pts" }, "+", myPtsFor(qi)), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-res-t" }, "ball", streakUpTo(qi) >= 2 ? ` \xB7 \u{1F525} x${streakUpTo(qi)} streak` : "")) : /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-res-t" }, my ? "Xato \u2014 0 ball. Keyingisida olasiz! \u{1F4AA}" : "Vaqt tugadi \u2014 0 ball. Tezroq bo'ling! \u23F1"), !solo && myRank >= 0 && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-res-rank" }, "Siz hozir: ", myRank + 1, "-o'rin")), !solo && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-board" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-board-h" }, "\u{1F3C6} TOP-5"), board.slice(0, 5).map((b, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: b.id, className: `qz-brow ${b.id === live.playerId ? "me" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-brank" }, i + 1), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-bname" }, b.nickname), b.maxStreak >= 2 && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-bstreak" }, "\u{1F525}"), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-bpts" }, b.pts)))), isMentor && /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn big", onClick: () => lastQ ? ctrl("done", qi) : ctrl("q", qi + 1) }, lastQ ? "\u{1F3C1} G'oliblarni e'lon qilish" : "Keyingi savol \u2192"), solo && /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn big", onClick: soloNext }, lastQ ? "\u{1F3C1} Natijani ko'rish" : "Keyingi \u2192")), phase === "done" && /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-view fade-step" }, /* @__PURE__ */ import_react.default.createElement(Confetti, null), /* @__PURE__ */ import_react.default.createElement("h2", { className: "qz-h" }, "\u{1F3C6} Test yakunlandi!"), solo ? /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-solo-res" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-solo-pts" }, soloScore.pts), /* @__PURE__ */ import_react.default.createElement("p", { className: "qz-sub" }, "ball \xB7 ", soloScore.ok, "/", QUIZ_BANK.length, " to'g'ri", soloScore.maxStreak >= 2 ? ` \xB7 eng uzun streak \u{1F525}x${soloScore.maxStreak}` : ""), /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn big", onClick: soloReplay }, "\u21BB Qayta ishlash")) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-pod" }, [1, 0, 2].map((rank) => {
    const b = board[rank];
    return /* @__PURE__ */ import_react.default.createElement("div", { key: rank, className: `qz-pod-col p${rank + 1} ${b && b.id === live.playerId ? "me" : ""}` }, rank === 0 && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-crown" }, "\u{1F451}"), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-pod-medal" }, ["\u{1F947}", "\u{1F948}", "\u{1F949}"][rank]), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-pod-name" }, b ? b.nickname : "\u2014"), b && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-pod-pts" }, b.pts, " ball \xB7 ", b.ok, "/", QUIZ_BANK.length), /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-pod-bar" }));
  })), myRank >= 0 && /* @__PURE__ */ import_react.default.createElement("p", { className: "qz-mypl" }, "Siz \u2014 ", /* @__PURE__ */ import_react.default.createElement("b", null, myRank + 1, "-o'rin"), " \xB7 ", board[myRank].pts, " ball"), /* @__PURE__ */ import_react.default.createElement("div", { className: "qz-board wide" }, board.map((b, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: b.id, className: `qz-brow ${b.id === live.playerId ? "me" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-brank" }, i + 1), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-bname" }, b.nickname), b.maxStreak >= 2 && /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-bstreak" }, "\u{1F525}x", b.maxStreak), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-bok" }, b.ok, "/", QUIZ_BANK.length), /* @__PURE__ */ import_react.default.createElement("span", { className: "qz-bpts" }, b.pts)))), isStudent && /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn", onClick: startPractice }, "\u21BB Testni qayta ishlash \u2014 mashq (jadvalga yozilmaydi)")), /* @__PURE__ */ import_react.default.createElement("button", { className: "qz-btn ghost", onClick: closeArena }, "Arenani yopish")));
}
var ScreenPodium = ({ screen, answers, onNext, onPrev }) => {
  const gate = (0, import_react.useContext)(LiveGateCtx) || {};
  const live = gate.live;
  const isLive = !!(live && (live.mode === "student" || live.mode === "mentor") && live.pin);
  const livePin = live ? live.pin : null;
  const [players, setPlayers] = (0, import_react.useState)([]);
  const [rows, setRows] = (0, import_react.useState)([]);
  const [loaded, setLoaded] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (!isLive || !livePin) return;
    let on = true, t = null;
    const tick = async () => {
      try {
        const [p, a] = await Promise.all([livePlayers(livePin), liveAnswers(livePin)]);
        if (on) {
          setPlayers(p);
          setRows(a);
          setLoaded(true);
        }
      } catch {
      }
      if (on) t = setTimeout(tick, 3e3);
    };
    tick();
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, [isLive, livePin]);
  const totalQ = SCORED_IDX.length;
  const board = players.map((p) => {
    const mine = rows.filter((a) => a.player_id === p.id && SCORED_IDX.includes(a.screen_idx));
    const okCount = mine.filter((a) => a.correct).length;
    const time = mine.reduce((s, a) => s + (a.elapsed_ms || 0), 0);
    return { id: p.id, nickname: p.nickname, okCount, time };
  }).sort((x, y) => y.okCount - x.okCount || x.time - y.time);
  const fmtT = (ms) => `${(ms / 1e3).toFixed(1)}s`;
  const top3 = board.slice(0, 3);
  const myIdx = live && live.playerId ? board.findIndex((b) => b.id === live.playerId) : -1;
  const selfCorrect = SCORED_IDX.filter((i) => answers[i]?.correct).length;
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Natijalar", screen, narrow: true, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { label: "Davom etish", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(14px,2.2vw,20px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Kim ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "g'olib"), "?")), !isLive ? /* @__PURE__ */ import_react.default.createElement("div", { className: "fade-up", style: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center" } }, /* @__PURE__ */ import_react.default.createElement(ScoreRing, { correct: selfCorrect, total: totalQ }), /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-soft", style: { maxWidth: 480 } }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0 } }, "Siz mustaqil rejimdasiz. Jonli darsda bu yerda butun guruh reytingi \u2014 \u{1F947}\u{1F948}\u{1F949} podium chiqadi."))) : !loaded ? /* @__PURE__ */ import_react.default.createElement("p", { className: "mono small fade-up", style: { color: T.ink2 } }, "Natijalar yuklanmoqda\u2026") : board.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-soft fade-up" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0 } }, "Bu sessiyaga hali hech kim qo'shilmagan.")) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(Confetti, null), /* @__PURE__ */ import_react.default.createElement("div", { className: "pod-stage fade-up" }, [1, 0, 2].map((rank) => {
    const b = top3[rank];
    return /* @__PURE__ */ import_react.default.createElement("div", { key: rank, className: `pod-col pod-${rank + 1} ${b && live.playerId === b.id ? "me" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: "pod-medal" }, ["\u{1F947}", "\u{1F948}", "\u{1F949}"][rank]), /* @__PURE__ */ import_react.default.createElement("span", { className: "pod-name" }, b ? b.nickname : "\u2014"), b && /* @__PURE__ */ import_react.default.createElement("span", { className: "pod-score mono" }, b.okCount, "/", totalQ, " \xB7 ", fmtT(b.time)), /* @__PURE__ */ import_react.default.createElement("div", { className: "pod-bar" }));
  })), myIdx >= 0 && /* @__PURE__ */ import_react.default.createElement("p", { className: "pod-my fade-up" }, "Siz \u2014 ", /* @__PURE__ */ import_react.default.createElement("b", null, myIdx + 1, "-o'rin"), " (", board[myIdx].okCount, "/", totalQ, " to'g'ri)"), /* @__PURE__ */ import_react.default.createElement("div", { className: "card fade-up d1" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "card-lbl", style: { color: T.accent } }, "\u{1F3C6} To'liq reyting"), /* @__PURE__ */ import_react.default.createElement("div", { className: "pod-list" }, board.map((b, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: b.id, className: `pod-row ${live.playerId === b.id ? "me" : ""}` }, /* @__PURE__ */ import_react.default.createElement("span", { className: "mono pod-rank" }, i + 1), /* @__PURE__ */ import_react.default.createElement("span", { className: "pod-row-name" }, b.nickname), /* @__PURE__ */ import_react.default.createElement("span", { className: "pod-row-dots" }, SCORED_IDX.map((q) => {
    const a = rows.find((r) => r.player_id === b.id && r.screen_idx === q);
    return /* @__PURE__ */ import_react.default.createElement("span", { key: q, className: `pod-dot ${a ? a.correct ? "ok" : "bad" : ""}`, title: Q_LABELS[q] });
  })), /* @__PURE__ */ import_react.default.createElement("span", { className: "mono pod-row-score" }, b.okCount, "/", totalQ), /* @__PURE__ */ import_react.default.createElement("span", { className: "mono pod-row-time" }, fmtT(b.time)))))))));
};
var PRACTICE_BASE = 500;
var MentorPracticeStats = ({ live, screen }) => {
  const [data, setData] = (0, import_react.useState)({ players: null, doneIds: /* @__PURE__ */ new Set() });
  (0, import_react.useEffect)(() => {
    if (!live || live.mode !== "mentor" || !live.pin) return;
    let on = true, t = null;
    const tick = async () => {
      try {
        const [players2, rows] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, PRACTICE_BASE + screen)]);
        if (on) setData({ players: players2, doneIds: new Set(rows.map((r) => r.player_id)) });
      } catch {
      }
      if (on) t = setTimeout(tick, 3e3);
    };
    tick();
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, [live && live.pin, screen]);
  if (!live || live.mode !== "mentor") return null;
  const players = data.players || [];
  const doers = players.filter((p) => data.doneIds.has(p.id));
  const waiting = players.filter((p) => !data.doneIds.has(p.id));
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "lp-mstats fade-up" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "card-lbl", style: { color: T.blue } }, "\u{1F440} Kim bajardi \u2014 ", doers.length, "/", players.length), data.players === null ? /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, margin: 0, fontStyle: "italic" } }, "Yuklanmoqda\u2026") : players.length === 0 ? /* @__PURE__ */ import_react.default.createElement("p", { className: "small", style: { color: T.ink3, margin: 0, fontStyle: "italic" } }, "Hali hech kim qo'shilmagan.") : /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, doers.map((p) => /* @__PURE__ */ import_react.default.createElement("span", { key: p.id, className: "mstats-wait-chip", style: { background: T.successSoft, color: T.success } }, "\u2713 ", p.nickname)), waiting.map((p) => /* @__PURE__ */ import_react.default.createElement("span", { key: p.id, className: "mstats-wait-chip", style: { opacity: 0.6 } }, "\u23F3 ", p.nickname))));
};
function ScreenLivePractice({ title, task, checklist, screen, storedAnswer, onAnswer, onNext, onPrev, live }) {
  const _gate = (0, import_react.useContext)(LiveGateCtx) || {};
  const _live = live || _gate.live;
  const [checked, setChecked] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
  const [done, setDone] = (0, import_react.useState)(!!(storedAnswer && storedAnswer.solved));
  const toggle = (i) => setChecked((prev) => {
    const s = new Set(prev);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    return s;
  });
  const complete = () => {
    if (done) return;
    setDone(true);
    onAnswer(screen, { stage: "practice", screenIdx: screen, practice: title, solved: true, correct: true, picked: true });
    if (_live && _live.mode === "student") _live.submitAnswer(PRACTICE_BASE + screen, "practice", 0, true, 0);
  };
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Amaliyot \xB7 o'z repongizda", screen, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { optionalLive: true, disabled: !done, label: done ? "Davom etish" : "Avval bajaring", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(12px,2vw,18px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, title)), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Bu topshiriqni ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "o'z GitHub repongizda"), " bajaring. Har bosqichni bajarib, belgilab boring. Tugagach ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "\xABBajardim\xBB"), " tugmasini bosing \u2014 mentor kuzatib turadi."), /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "lp-task fade-up delay-1" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "lp-task-h" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "lp-task-badge" }, "TOPSHIRIQ")), /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, task)), /* @__PURE__ */ import_react.default.createElement(MentorPracticeStats, { live: _live, screen })), /* @__PURE__ */ import_react.default.createElement(Col, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "flow-label" }, "Bosqichlar \u2014 belgilab boring"), /* @__PURE__ */ import_react.default.createElement("div", { className: "lp-steps fade-up delay-2" }, checklist.map((c, i) => {
    const on = checked.has(i);
    return /* @__PURE__ */ import_react.default.createElement("button", { key: i, className: `lp-step ${on ? "on" : ""}`, onClick: () => toggle(i) }, /* @__PURE__ */ import_react.default.createElement("span", { className: "lp-check" }, on ? "\u2713" : i + 1), /* @__PURE__ */ import_react.default.createElement("span", { className: "lp-step-t" }, fmtCode(c)));
  })), /* @__PURE__ */ import_react.default.createElement("button", { className: `lp-done-btn ${done ? "is-done" : ""}`, disabled: done, onClick: complete }, done ? "\u2713 Bajarildi \u2014 mentorni kuting" : "\u2705 Bajardim"), done && /* @__PURE__ */ import_react.default.createElement("div", { className: "frame-success fade-step" }, /* @__PURE__ */ import_react.default.createElement("p", { className: "body", style: { margin: 0, color: T.ink } }, "Zo'r! Yo'l xaritangizni yozdingiz. Mentor tekshirib, keyingi qadamga o'tkazadi."))))));
}
var ScreenGaPractice = (props) => /* @__PURE__ */ import_react.default.createElement(
  ScreenLivePractice,
  {
    ...props,
    title: "O'z repongizga yo'l xaritasini yozing",
    task: "O'z GitHub repongizda .github/workflows/ci.yml faylini yarating: on: push, runs-on: ubuntu-latest va steps: checkout + npm install + npm test. Push qiling va Actions bo'limida yashil \u2713 ni kuting.",
    checklist: [
      "Repo ildizida `.github/workflows/` papkasini yarating",
      "Ichiga `ci.yml` faylini qo'shing",
      "`on: push` va `runs-on: ubuntu-latest` yozing",
      "`steps:` ostiga checkout, setup-node, npm install, npm test qatorlarini yozing",
      "Push qiling va GitHub'dagi Actions bo'limida yashil \u2713 ni kuzating"
    ]
  }
);
function Flashcards({ cards }) {
  const [queue, setQueue] = (0, import_react.useState)(() => cards.map((_, i) => i));
  const [flipped, setFlipped] = (0, import_react.useState)(false);
  const [known, setKnown] = (0, import_react.useState)(0);
  const [exiting, setExiting] = (0, import_react.useState)(null);
  const swapRef = (0, import_react.useRef)(0);
  const total = cards.length;
  const cur = queue[0];
  const card = cur != null ? cards[cur] : null;
  const advance = (removed) => {
    if (exiting) return;
    setExiting(removed ? "knew" : "again");
    setTimeout(() => {
      setExiting(null);
      setFlipped(false);
      swapRef.current++;
      if (removed) setKnown((k) => k + 1);
      setQueue((q) => {
        const [first, ...rest] = q;
        return removed ? rest : [...rest, first];
      });
    }, 420);
  };
  const knew = () => advance(true);
  const again = () => advance(false);
  const restart = () => {
    setQueue(cards.map((_, i) => i));
    setKnown(0);
    setFlipped(false);
  };
  if (!card) return /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-done fade-up" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-done-emoji" }, "\u{1F389}"), /* @__PURE__ */ import_react.default.createElement("p", { className: "fc-done-h" }, "Hammasini bilasiz!"), /* @__PURE__ */ import_react.default.createElement("p", { className: "fc-done-s" }, total, "/", total, " atama yodlandi"), /* @__PURE__ */ import_react.default.createElement("button", { className: "fc-btn ghost", onClick: restart }, "\u21BB Qaytadan takrorlash"));
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "fc fade-up" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-top" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-pill learn", key: `l-${queue.length}-${swapRef.current}` }, "\u21BB O'rganilmoqda \xB7 ", /* @__PURE__ */ import_react.default.createElement("b", null, queue.length)), /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-pill knew", key: `k-${known}` }, "\u2713 Bildim \xB7 ", /* @__PURE__ */ import_react.default.createElement("b", null, known))), /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-bar" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-bar-fill", style: { width: `${known / total * 100}%` } })), /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-cardwrap" }, /* @__PURE__ */ import_react.default.createElement("div", { className: `fc-fly ${exiting === "knew" ? "out-knew" : ""} ${exiting === "again" ? "out-again" : ""}`, key: swapRef.current }, /* @__PURE__ */ import_react.default.createElement("div", { className: `fc-card ${flipped ? "flip" : ""}`, onClick: () => !flipped && !exiting && setFlipped(true), role: "button", tabIndex: 0 }, /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-face fc-front" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-q" }, card.front), /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-cue" }, "Qaysi atama? \u{1F914} ", /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-tap" }, "bosing"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-face fc-back" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-tag" }, card.back), card.note && /* @__PURE__ */ import_react.default.createElement("span", { className: "fc-note" }, card.note))))), flipped ? /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-actions" }, /* @__PURE__ */ import_react.default.createElement("button", { className: "fc-btn again", disabled: !!exiting, onClick: again }, "\u2717 Takrorlash"), /* @__PURE__ */ import_react.default.createElement("button", { className: "fc-btn knew", disabled: !!exiting, onClick: knew }, "\u2713 Bildim")) : /* @__PURE__ */ import_react.default.createElement("p", { className: "fc-hint" }, "\u{1F446} Kartani bosing \u2014 javobni ko'rasiz"));
}
var GA_FLASHCARDS = [
  { front: "GitHub bu joyni o'zi qidiradi", back: ".github/workflows/ci.yml", note: "Yo'l xaritasi shu yerda" },
  { front: "Workflow \u2014 'qachon ishga tushsin' shu yerda yoziladi", back: "on:", note: "START SIGNALI" },
  { front: "Job qaysi mashinada ishlashini belgilaydi", back: "runs-on", note: "Lenta mashinasi" },
  { front: "Bitta harakat \u2014 buyruq yoki tayyor amal", back: "step", note: "AMAL" },
  { front: "Tayyor marketplace amali", back: "uses", note: "masalan checkout@v4" },
  { front: "Terminal buyrug'i", back: "run", note: "masalan npm test" },
  { front: "Kodni lenta mashinasiga olib keluvchi birinchi amal", back: "actions/checkout@v4", note: "eng birinchi step" },
  { front: "Bitta yukni bir nechta sharoitda birdan tekshirish", back: "matrix", note: "Parallel lentalar" },
  { front: "Qayta yuklamay tezlashtiruvchi vosita", back: "cache", note: "Yaqin javon" },
  { front: "Maxfiy kalit saqlanadigan xavfsiz joy", back: "secrets", note: "Seyf" },
  { front: "Repo sahifasidagi yashil/qizil belgi", back: "status badge", note: "Tablo" },
  { front: "Qizil chiroq sababi shu yerda yoziladi", back: "logs", note: "Lenta jurnali" }
];
var ScreenFlashcards = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  (0, import_react.useEffect)(() => {
    if (storedAnswer === void 0) onAnswer(screen, { correct: true, picked: true });
  }, []);
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Takrorlash", screen, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement(NavNext, { disabled: false, label: "Yakunlash \u2192", onClick: onNext })) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen", style: { gap: "clamp(10px,1.6vw,16px)" } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "head" }, /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up" }, "Lenta atamalarini ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "tez takrorlaymiz"), ".")), /* @__PURE__ */ import_react.default.createElement(Mentor, null, "Darsni yakunlashdan oldin bugungi atamalarni takrorlaymiz. Har kartada bir topishmoq \u2014 ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "qaysi atama"), " ekanini o'ylang, keyin kartani bosib tekshiring. ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "Bildim"), " yoki ", /* @__PURE__ */ import_react.default.createElement("b", { style: { color: T.ink } }, "Takrorlash"), " bilan baholang."), /* @__PURE__ */ import_react.default.createElement("div", { className: "fc-center" }, /* @__PURE__ */ import_react.default.createElement(Flashcards, { cards: GA_FLASHCARDS }))));
};
var Screen19 = ({ screen, answers, achievements, onReset, onPrev, onFinish }) => {
  const _gate = (0, import_react.useContext)(LiveGateCtx) || {};
  const _live = _gate.live;
  const [arena, setArena] = (0, import_react.useState)(false);
  const [arenaSolo, setArenaSolo] = (0, import_react.useState)(false);
  const quizSt = _live && _live.quiz && _live.quiz.state || "off";
  const isStudentL = _live && _live.mode === "student";
  const isMentorL = _live && _live.mode === "mentor";
  const classOver = !!(_live && (_live.status === "ended" || !_live.mentorAlive));
  const studentSolo = isStudentL && classOver && quizSt !== "done";
  const studentLive = isStudentL && !studentSolo && quizSt !== "off";
  const studentWait = isStudentL && !studentSolo && quizSt === "off";
  const openArena = async () => {
    if (isMentorL && quizSt === "off") {
      try {
        await _live.quizControl("lobby", -1);
      } catch {
        return;
      }
    }
    setArenaSolo(studentSolo);
    setArena(true);
  };
  const RECAP = [
    "GitHub Actions \u2014 GitHub ichidagi bepul lenta tizimi; yo'l xaritasi .github/workflows/ci.yml",
    "Workflow \u2192 Job \u2192 Step (yo'l xaritasi \u2192 nuqta \u2192 amal)",
    "on: push \u2014 START SIGNALI; runs-on \u2014 LENTA MASHINASI",
    "uses (tayyor amal) + run (buyruq); checkout \u2192 setup-node \u2192 install \u2192 test",
    "Maxfiy kalit \u2014 SEYFda (${{ secrets.NOM }}), hech qachon ochiq emas",
    "Qizil chiroq sababi \u2014 LENTA JURNALIDA"
  ];
  const HOMEWORK = [
    { b: "Qo'shing", t: "\u2014 o'z repongizga .github/workflows/ci.yml fayl yarating" },
    { b: "Yozing", t: "\u2014 on: push va steps: checkout + npm install + npm test" },
    { b: "Ko'ring", t: "\u2014 lentaga qo'yib, Actions bo'limida yashil chiroqni kuzating" }
  ];
  const correct = SCORED_IDX.filter((i) => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  return /* @__PURE__ */ import_react.default.createElement(Stage, { eyebrow: "Tayyor", screen, navContent: /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(NavBack, { onPrev }), /* @__PURE__ */ import_react.default.createElement("button", { className: "btn-ghost", onClick: onReset, style: { padding: "clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)", fontSize: "clamp(13px,1.5vw,15px)" } }, "Qaytadan"), /* @__PURE__ */ import_react.default.createElement("button", { className: "btn-white-accent", onClick: onFinish, style: { marginLeft: "auto", padding: "clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)", fontSize: "clamp(13px,1.5vw,15px)" } }, "Yakunlash \u2713")) }, /* @__PURE__ */ import_react.default.createElement("div", { className: "screen" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "hero" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "hero-l" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "done-chip fade-up" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "tick" }, "\u2713"), " Birinchi yo'l xaritangizni yozdingiz"), /* @__PURE__ */ import_react.default.createElement("h2", { className: "title h-title fade-up d1" }, "Endi lenta har push'da ", /* @__PURE__ */ import_react.default.createElement("span", { className: "italic", style: { color: T.accent } }, "o'zi aylanadi"), "."), /* @__PURE__ */ import_react.default.createElement("p", { className: "body h-sub fade-up d2" }, PASSED ? "Tabriklaymiz! GitHub Actions, ci.yml, Workflow\u2192Job\u2192Step, on:push va birinchi yo'l xaritasini o'zlashtirdingiz." : "Yaxshi harakat! START SIGNALI va LENTA MASHINASINI mustahkamlash uchun bir-ikki ekranni qayta ko'ring.")), /* @__PURE__ */ import_react.default.createElement(ScoreRing, { correct, total })), /* @__PURE__ */ import_react.default.createElement("div", { className: `qz-cta cs-cta fade-up d2 ${studentLive ? "ready" : ""}` }, /* @__PURE__ */ import_react.default.createElement(CsWordmark, { stats: false, liveOn: studentLive, disabled: studentWait, onClick: studentWait ? void 0 : openArena, hint: studentWait ? "\u23F3 Mentorni kuting" : void 0 })), arena && /* @__PURE__ */ import_react.default.createElement(QuizArena, { live: _live || { mode: "self" }, startSolo: arenaSolo, onClose: () => setArena(false) }), /* @__PURE__ */ import_react.default.createElement("div", { className: "split" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "card fade-up d3" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "card-lbl", style: { color: T.success } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "tick", style: { width: 16, height: 16, borderRadius: "50%", background: T.success, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 } }, "\u2713"), " Endi siz bilasiz"), /* @__PURE__ */ import_react.default.createElement("ul", { className: "recap" }, RECAP.map((r, i) => /* @__PURE__ */ import_react.default.createElement("li", { key: i, style: { animationDelay: `${0.3 + i * 0.07}s` } }, /* @__PURE__ */ import_react.default.createElement("span", { className: "ck" }, "\u2713"), /* @__PURE__ */ import_react.default.createElement("span", null, r))))), /* @__PURE__ */ import_react.default.createElement("div", { className: "card hw fade-up d4" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "card-lbl", style: { color: T.accent } }, "\u{1F4DD} Uyga vazifa"), /* @__PURE__ */ import_react.default.createElement("ul", null, HOMEWORK.map((h, i) => /* @__PURE__ */ import_react.default.createElement("li", { key: i }, /* @__PURE__ */ import_react.default.createElement("b", null, h.b), " ", /* @__PURE__ */ import_react.default.createElement("span", { className: "t" }, h.t)))), /* @__PURE__ */ import_react.default.createElement("p", { className: "hw-note" }, "\u{1F680} Keyingi dars \u2014 bitta yukni to'liq lentadan o'tkazamiz: \u{1F50D} skaner + \u{1F381} o'rash + \u2708\uFE0F uchirish!"))), /* @__PURE__ */ import_react.default.createElement("div", { className: "card ach-coll fade-up d3" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "card-lbl", style: { color: T.accent } }, "\u{1F3C5} Nishonlaringiz \u2014 ", achievements ? achievements.size : 0, "/", Object.keys(ACHIEVEMENTS).length), /* @__PURE__ */ import_react.default.createElement("div", { className: "ach-grid" }, Object.entries(ACHIEVEMENTS).map(([id, a]) => {
    const got = !!(achievements && achievements.has(id));
    return /* @__PURE__ */ import_react.default.createElement("div", { key: id, className: `ach-badge ${got ? "got" : "locked"}`, title: a.desc }, /* @__PURE__ */ import_react.default.createElement("span", { className: "ach-badge-ic" }, got ? a.icon : "\u{1F512}"), /* @__PURE__ */ import_react.default.createElement("span", { className: "ach-badge-name" }, a.name), got && /* @__PURE__ */ import_react.default.createElement("span", { className: "ach-badge-desc" }, a.desc));
  })))));
};
function GithubActionsLesson({ lang: langProp, onFinished }) {
  const lang = langProp || "uz";
  const [screen, setScreen] = (0, import_react.useState)(0);
  const [answers, setAnswers] = (0, import_react.useState)({});
  const startTimeRef = (0, import_react.useRef)(Date.now());
  const earnedRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
  const [earned, setEarned] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
  const [achToasts, setAchToasts] = (0, import_react.useState)([]);
  const achKeyRef = (0, import_react.useRef)(0);
  const earn = (0, import_react.useCallback)((id) => {
    if (!ACHIEVEMENTS[id] || earnedRef.current.has(id)) return;
    earnedRef.current.add(id);
    setEarned(new Set(earnedRef.current));
    setAchToasts((t) => [...t, { id, k: ++achKeyRef.current }]);
  }, []);
  (0, import_react.useEffect)(() => {
    const upd = () => {
      const z = Math.min(1.5, Math.max(1, window.innerWidth / 1920));
      document.documentElement.style.setProperty("--lz", String(Math.round(z * 1e3) / 1e3));
    };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === "student" && live.status !== "ended" && live.mentorAlive;
  const locked = isStudentLive && screen + 1 > live.mentorScreen;
  (0, import_react.useEffect)(() => {
    live.reportScreen(screen);
  }, [screen, live.mode, live.pin]);
  const FLASH_IDX = SCREEN_META.findIndex((m) => m.id === "sflash");
  const flashHidden = () => live.mode === "student" && live.status !== "ended" && live.mentorAlive;
  const next = () => setScreen((s) => {
    let n = Math.min(s + 1, TOTAL_SCREENS - 1);
    if (n === FLASH_IDX && flashHidden()) n = Math.min(n + 1, TOTAL_SCREENS - 1);
    return n;
  });
  const prev = () => setScreen((s) => {
    let n = Math.max(s - 1, 0);
    if (n === FLASH_IDX && flashHidden()) n = Math.max(n - 1, 0);
    return n;
  });
  const recordAnswer = (idx, data) => {
    setAnswers((a) => ({ ...a, [idx]: data }));
    const _m = SCREEN_META[idx];
    if (_m && ACH_TRIGGERS[_m.id] && data && data.correct) earn(ACH_TRIGGERS[_m.id]);
    if (_m && _m.scored && _m.scope === "final" && data && data.solved && live.mode === "student") live.submitAnswer(idx, _m.id, data.picked ?? 1, !!data.correct, data.elapsedMs || 0);
  };
  const reset = () => {
    setAnswers({});
    setScreen(0);
    startTimeRef.current = Date.now();
  };
  const finishLesson = () => {
    live.endSession();
    const scoredMeta = SCREEN_META.filter((s) => s.scored);
    const finalMeta = scoredMeta.filter((s) => s.scope === "final");
    const scoredAnswers = SCREEN_META.map((s, i) => s.scored ? answers[i] : null).filter(Boolean);
    const correctAnswers = scoredAnswers.filter((a) => a.correct).length;
    const finalAnswers = SCREEN_META.map((s, i) => s.scored && s.scope === "final" ? answers[i] : null).filter(Boolean);
    const finalCorrect = finalAnswers.filter((a) => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId,
      lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1e3),
      totalQuestions: scoredMeta.length,
      correctAnswers,
      scorePercent: scoredMeta.length ? Math.round(correctAnswers / scoredMeta.length * 100) : 0,
      finalScore: finalCorrect,
      finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false,
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === "function") onFinished(payload);
  };
  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17, Screen18, ScreenGaPractice, ScreenPodium, ScreenFlashcards, Screen19];
  const Current = screens[screen];
  return /* @__PURE__ */ import_react.default.createElement(LangContext.Provider, { value: lang }, /* @__PURE__ */ import_react.default.createElement("style", null, `
        /* PRODUCTION: shu @import OLIB TASHLANADI \u2014 shriftlarni LMS yuklaydi (platform_contract). */
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
        .el-in { animation: el-pop 0.3s ease-out; animation-fill-mode: backwards; }
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
        .gchip { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 12px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); } .gchip:hover:not(:disabled) { transform: translateY(-1px); }
        .tagpill { font-family: 'JetBrains Mono'; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope'; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }
        .option-wait { background: ${T.blueSoft} !important; color: ${T.blue} !important; box-shadow: inset 0 0 0 2px ${T.blue}, 0 8px 22px -8px rgba(1,154,203,0.3) !important; animation: opt-wait-breathe 2s ease-in-out infinite; }
        @keyframes opt-wait-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.012); } }
        .frame-wait { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(1,154,203,0.22); }

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
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
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
        .frame-warn { background: ${T.dangerSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; }
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

        /* VS CODE-USLUB EDITOR */
        .editor { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .editor-bar { background: #2D2D2D; padding: 7px 11px; display: flex; align-items: center; gap: 9px; }
        .editor-tab { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; background: #1E1E1E; padding: 4px 11px; border-radius: 6px 6px 0 0; word-break: break-all; }
        .editor-body { background: ${CODE.bg}; padding: 12px 14px; }
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.75; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .line-empty { color: ${CODE.comment}; font-style: italic; }
        .code-line { display: flex; align-items: center; flex-wrap: wrap; }

        /* PICK-ROW (steps/candidates) */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 10px 12px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; }

        /* TERMINAL */
        .term { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .term-bar { background: #2D2D2D; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; }
        .term-body { background: #1E1E1E; padding: 12px 13px; min-height: 60px; }
        .tline { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.8; color: ${CODE.text}; word-break: break-word; }

        /* LENTA NATIJASI (BeltRun) \u2014 pastida cheksiz aylanuvchi lenta chizig'i (1-dars pipe-track naqshi) */
        .ghrun { position: relative; background: ${T.paper}; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); }
        .ghrun::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; border-radius: 99px; background-image: repeating-linear-gradient(90deg, ${T.ink3}70 0 9px, transparent 9px 19px); background-size: 38px 100%; animation: belt-scroll 1s linear infinite; opacity: 0.45; }
        .ghrun-head { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-bottom: 1px solid rgba(167,166,162,0.22); }
        .ghrun-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 99px; }
        .ghrun-badge.pass { background: ${T.successSoft}; color: ${T.success}; }
        .ghrun-badge.fail { background: ${T.dangerSoft}; color: ${T.danger}; }
        .ghrun-title { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; }
        .ghrun-job { padding: 11px 14px; }
        .ghrun-jobname { font-family: 'JetBrains Mono'; font-size: 12.5px; font-weight: 700; color: ${T.ink}; margin-bottom: 9px; display: flex; align-items: center; gap: 7px; }
        .ghrun-steps { display: flex; flex-direction: column; gap: 6px; padding-left: 8px; }
        .ghrun-step { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink2}; display: flex; align-items: center; gap: 9px; }
        .ghrun-ck { font-weight: 800; min-width: 12px; }
        .ghrun-step.plane-ok .ghrun-ck { display: inline-block; animation: plane-launch 0.9s cubic-bezier(.3,.75,.4,1) both; animation-delay: 0.5s; }
        @keyframes belt-scroll { to { background-position: -38px 0; } }
        @keyframes plane-launch { 0% { transform: translate(0,0) rotate(0deg); } 55% { transform: translate(13px,-11px) rotate(-8deg); } 100% { transform: translate(0,0) rotate(0deg); } }

        /* FAYL-TREE */
        .tree { background: ${CODE.bg}; border-radius: 12px; padding: 13px 15px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .tree-row { font-family: 'JetBrains Mono'; font-size: 12.5px; line-height: 1.95; color: ${CODE.text}; display: flex; align-items: center; }
        .tree-row.hl { color: ${CODE.attr}; font-weight: 700; }
        .tree-row.dim { opacity: 0.45; }

        /* \u{1F6EB} BELT RUN (markaziy builder natijasi) \u2014 pastida cheksiz aylanuvchi lenta chizig'i */
        .belt-run { position: relative; overflow: hidden; display: flex; align-items: center; gap: 12px; background: ${T.paper}; border-radius: 14px; padding: 14px 18px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); }
        .belt-run::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; border-radius: 99px; background-image: repeating-linear-gradient(90deg, ${T.ink3}70 0 9px, transparent 9px 19px); background-size: 38px 100%; animation: belt-scroll 1s linear infinite; opacity: 0.45; }
        .belt-light { position: relative; width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.08); }
        .belt-light.green { background: ${T.success}; box-shadow: 0 0 0 4px ${T.successSoft}; }
        .belt-light.red { background: ${T.danger}; box-shadow: 0 0 0 4px ${T.dangerSoft}; }
        .belt-light.off { background: ${T.ink3}; }
        .belt-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 13px; letter-spacing: 0.06em; color: ${T.ink}; }
        .belt-run.spin .belt-light.green { animation: belt-pulse 1.2s ease-in-out infinite; }
        .belt-run.spin .belt-light.red { animation: belt-fail-pulse 0.5s ease-in-out 2, belt-fail-shake 0.5s ease; }
        .belt-run.sending .belt-light.off { animation: belt-pulse-off 0.7s ease-in-out infinite; }
        .belt-run.sending .belt-suitcase { position: absolute; left: 8px; bottom: 6px; font-size: 14px; animation: belt-suitcase-move 0.9s linear infinite; }
        @keyframes belt-pulse { 0%,100% { box-shadow: 0 0 0 4px ${T.successSoft}; } 50% { box-shadow: 0 0 0 8px ${T.successSoft}; } }
        @keyframes belt-pulse-off { 0%,100% { box-shadow: 0 0 0 4px rgba(167,166,162,0.35); } 50% { box-shadow: 0 0 0 8px rgba(167,166,162,0.5); } }
        @keyframes belt-fail-pulse { 0%,100% { box-shadow: 0 0 0 4px ${T.dangerSoft}; } 50% { box-shadow: 0 0 0 9px ${T.dangerSoft}; } }
        @keyframes belt-fail-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(4px); } }
        @keyframes belt-suitcase-move { from { left: 8px; } to { left: calc(100% - 26px); } }
        .plane-lift { display: inline-block; animation: plane-launch 0.9s cubic-bezier(.3,.75,.4,1) both; }
        .tline-stag { animation-fill-mode: backwards; }

        /* \u{1F4F1} PHONE PREVIEW */
        .phone { width: 108px; margin: 0 auto; background: ${T.ink}; border-radius: 20px; padding: 8px 6px; box-shadow: 0 10px 26px -8px rgba(${T.shadowBase},0.35); }
        .phone-notch { width: 34px; height: 5px; border-radius: 4px; background: rgba(255,255,255,0.25); margin: 0 auto 6px; }
        .phone-scr { min-height: 92px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 8px; text-align: center; }
        .phone.ok .phone-scr { background: ${T.successSoft}; }
        .phone.bad .phone-scr { background: ${T.dangerSoft}; }
        .phone.idle .phone-scr { background: ${T.bg}; }
        .phone-ic { font-size: 24px; }
        .phone-t { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: ${T.ink}; line-height: 1.3; }

        /* PARALLEL LENTALAR (matrix) */
        .matrix-lanes { display: flex; flex-direction: column; gap: 10px; }
        .matrix-lane { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); opacity: 0; }
        .matrix-lane.go { animation: fade-in-up 0.4s ease-out forwards; }
        .matrix-v { min-width: 62px; font-weight: 700; color: ${T.ink}; }
        .matrix-track { flex: 1; height: 8px; background: ${T.bg}; border-radius: 99px; overflow: hidden; position: relative; }
        .matrix-lane.go .matrix-cap { display: block; height: 100%; width: 40%; background: ${T.accent}; border-radius: 99px; animation: matrix-run 1s ease-out forwards; }
        @keyframes matrix-run { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
        .matrix-ok { color: ${T.success}; font-weight: 700; font-size: 12.5px; }

        /* YAQIN JAVON (cache) taymerlari */
        .cache-timers { display: flex; flex-direction: column; gap: 14px; }
        .cache-t { display: flex; flex-direction: column; gap: 5px; }
        .cache-bar { height: 10px; background: ${T.bg}; border-radius: 99px; overflow: hidden; }
        .cache-bar span { display: block; height: 100%; border-radius: 99px; transition: width 0.15s linear; }
        .cache-n { font-size: 12.5px; color: ${T.ink2}; }

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
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }

        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; }

        /* \u{1F9F2} DRAG-DROP TARTIB */
        .dd { display: flex; flex-direction: column; gap: 13px; }
        .dd-slots { display: flex; flex-direction: column; gap: 9px; position: relative; }
        .dd-slot { display: flex; align-items: center; gap: 12px; min-height: 58px; border-radius: 14px; border: 2px dashed ${T.ink3}66; background: ${T.paper}; padding: 8px 12px; box-shadow: 0 5px 14px -9px rgba(${T.shadowBase},0.2); transition: border-color .18s, background .18s, box-shadow .18s; }
        .dd-slot.filled { border-style: solid; border-color: ${T.line}; box-shadow: 0 8px 18px -10px rgba(${T.shadowBase},0.26); }
        .dd-slot.ok { border-color: ${T.success}; background: ${T.successSoft}; animation: dd-ok-pop 0.42s cubic-bezier(.3,1.5,.5,1); }
        .dd-slot.ok:nth-child(2) { animation-delay: 0.07s; } .dd-slot.ok:nth-child(3) { animation-delay: 0.14s; }
        .dd-slot.ok:nth-child(4) { animation-delay: 0.21s; }
        @keyframes dd-ok-pop { 0%,100% { transform: scale(1); } 45% { transform: scale(1.025); } }
        .dd-slot.bad { border-color: ${T.danger}; background: ${T.dangerSoft}; animation: dd-shake .4s; }
        @keyframes dd-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
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

        /* tap-hint affordance \u2014 bosilmagan kartalar "meni bos" deb pulslaydi. Bosilgach pulsatsiya TO'XTAYDI. */
        @keyframes tap-hint-pulse { 0% { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18), 0 0 0 0 rgba(255,79,40,0.4); } 70%,100% { box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18), 0 0 0 8px rgba(255,79,40,0); } }
        .tree-row.tap-hint, .gchip.tap-hint, .btn-soft.tap-hint, .btn.tap-hint, .vcard.tap-hint { animation: tap-hint-pulse 1.9s ease-in-out infinite; }

        /* 11.15 \u2014 jonli badge xira, hover'da tiniq */
        .live-badge { opacity: 0.4; transition: opacity 0.25s ease, box-shadow 0.25s ease; }
        .live-badge:hover, .live-badge:focus-within { opacity: 1; box-shadow: 0 8px 24px -6px rgba(58,53,48,0.32) !important; }
        @media (hover: none) { .live-badge { opacity: 0.62; } }

        /* === \u{1F524} KOD-ATAMA CHIP (fmtCode) === */
        .qcode { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.92em; background: rgba(20,17,14,0.08); border-radius: 6px; padding: 1px 6px; white-space: nowrap; }

        /* === \u{1F3C5} ACHIEVEMENTS \u2014 hisoblagich + to'liq-ekran bayram === */
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

        /* === \u{1F3C6} PODIUM / STATISTIKA SAHIFASI === */
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

        /* === \u26A1 CODE STRIKE \u2014 CTA neon-kapsula === */
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

        /* === MENTOR STATISTIKASI (jonli test) === */
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

        /* === \u{1F4D6} QAYTA TUSHUNTIRISH (recap overlay) === */
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
        @media (max-width: 640px) { .rc-nav { flex-wrap: wrap; justify-content: center; row-gap: 10px; } .rc-dots { width: 100%; order: -1; } .rc-btn { font-size: 13px; padding: 11px 16px; } }

        /* ===== \u26A1 ARENA \u2014 issiq CoddyCamp muhiti ===== */
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
        .qz-tile .qcode { background: rgba(255,255,255,0.25); color: #fff; }
        .qz-q .qcode { background: rgba(203,173,255,0.18); color: #F2ECFF; }
        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

        /* === \u{1F6E0}\uFE0F JONLI PRAKTIKA === */
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

        /* === \u{1F0CF} FLASHCARDS (3D flip) === */
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
        .fc-fly.out-knew::after { content: '\u2713'; background: ${T.success}; box-shadow: 0 10px 26px -8px ${T.success}; }
        .fc-fly.out-again::after { content: '\u2717'; background: ${T.accent}; box-shadow: 0 10px 26px -8px ${T.accent}; }
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

        @media (prefers-reduced-motion: reduce) {
          .dd-chip.in, .dd-slot.ok, .dd-slot.bad, .tree-row.tap-hint, .gchip.tap-hint, .btn-soft.tap-hint, .btn.tap-hint, .vcard.tap-hint,
          .belt-run.spin .belt-light.green, .matrix-lane.go .matrix-cap,
          .ghrun::after, .belt-run::after, .belt-run.spin .belt-light.red, .belt-run.sending .belt-light.off,
          .belt-run.sending .belt-suitcase, .ghrun-step.plane-ok .ghrun-ck, .plane-lift { animation: none !important; }
        }
      `), /* @__PURE__ */ import_react.default.createElement(AchCtx.Provider, { value: earned }, /* @__PURE__ */ import_react.default.createElement(LiveGateCtx.Provider, { value: { locked, live } }, /* @__PURE__ */ import_react.default.createElement("div", { className: "lesson-root" }, live.mode === "choosing" ? /* @__PURE__ */ import_react.default.createElement(LiveGate, { live, title: "GitHub Actions darsi" }) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(Current, { screen, storedAnswer: answers[screen], answers, achievements: earned, onAnswer: recordAnswer, onNext: next, onPrev: prev, onReset: reset, onFinish: finishLesson, live }), /* @__PURE__ */ import_react.default.createElement(LiveBadge, { live, total: TOTAL_SCREENS }), /* @__PURE__ */ import_react.default.createElement(AchToasts, { toasts: achToasts, onDone: (k) => setAchToasts((t) => t.filter((x) => x.k !== k)) }))))));
}
