Endi fetch() + polling (2-usul) bilan ulanamiz. Hech qanday kutubxona kerak emas — toza fetch. Mana to'liq, ishlaydigan kod. JSX faylingga shu blokni qo'shasan:
js
// ============================================================
// LIVE SESSION CLIENT — toza fetch() + polling (kutubxona yo'q)
// ============================================================

const SUPABASE_URL = "https://dwoubexcexzsinogojiu.supabase.co";
const SUPABASE_KEY = "sb_publishable_cijLMhCDDdo6dlXs05thyw__oH-YgKX";

// RPC chaqirig'i uchun umumiy yordamchi
async function rpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${fn} xato: ${res.status} — ${txt}`);
  }
  return res.json();
}

// ---------- MENTOR funksiyalari ----------

// Sessiya yaratish → { pin, token } qaytaradi
async function createSession(lessonId) {
  const rows = await rpc("create_session", { p_lesson_id: lessonId });
  return rows[0]; // { pin: "538276", token: "1d69..." }
}

// Sahifani oldinga surish (high-water mark)
async function advanceSession(pin, token, screen) {
  await rpc("advance_session", { p_pin: pin, p_token: token, p_screen: screen });
}

// Heartbeat — mentor tirikligini bildiradi (har ~5s chaqir)
async function sessionHeartbeat(pin, token) {
  await rpc("session_heartbeat", { p_pin: pin, p_token: token });
}

// "Tamom" → hammaga erkinlik
async function endSession(pin, token) {
  await rpc("end_session", { p_pin: pin, p_token: token });
}

// ---------- O'QUVCHI funksiyasi (polling) ----------

// Sessiya holatini bir marta o'qish → { pin, lesson_id, max_screen, status } yoki null
async function getSession(pin) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/live_sessions?pin=eq.${pin}&select=*`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`getSession xato: ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}
React/JSX ichida qanday ishlatasan — ikki tomon:
Mentor tomoni (dars boshlaganda):
jsx
const [pin, setPin] = useState(null);
const [token, setToken] = useState(null);

// Dars boshlash
async function startLesson() {
  const s = await createSession("internet");
  setPin(s.pin);
  setToken(s.token);
  // s.pin'ni ekranda ko'rsat — o'quvchilar shuni kiritadi
}

// Mentor keyingi sahifaga o'tganda chaqir
async function goToScreen(n) {
  await advanceSession(pin, token, n);
}

// Heartbeat — har 5 soniyada
useEffect(() => {
  if (!pin || !token) return;
  const id = setInterval(() => sessionHeartbeat(pin, token), 5000);
  return () => clearInterval(id);
}, [pin, token]);
O'quvchi tomoni (PIN kiritib qo'shilgandan keyin — polling):
jsx
const [maxScreen, setMaxScreen] = useState(0);
const [status, setStatus] = useState("live");

useEffect(() => {
  if (!joinedPin) return;
  const id = setInterval(async () => {
    const s = await getSession(joinedPin);
    if (s) {
      setMaxScreen(s.max_screen);   // o'quvchi shu sahifagacha ocha oladi
      setStatus(s.status);          // "ended" bo'lsa — to'liq erkinlik
    }
  }, 2000); // har 2 soniyada tekshir
  return () => clearInterval(id);
}, [joinedPin]);

// Navigatsiya cheklovi:
// status === "ended"  → o'quvchi xohlagan sahifaga o'tadi
// aks holda           → faqat 0..maxScreen oralig'ida
Mana shu butun ishni qoplaydi: mentor PIN beradi → o'quvchi kiritadi → polling bilan max_screen kuzatiladi → o'quvchi faqat ochilgan sahifagacha boradi → "Tamom" bosilsa status=ended → erkinlik.
Eng muhim ikki nuqta:
Realtime endi kerak emas — fetch+polling tanlading, to'g'ri qaror (oddiy, ishonchli, WebSocket muammolari yo'q). Faylga yangi live_sessions.sql'ni qayta Run qilishing shart emas — ishlab turgan sxema polling bilan baribir ishlaydi.
JSON kalitlari aniq — p_lesson_id, p_pin, p_token, p_screen — bular SQL funksiyalaringdagi parametr nomlari bilan bir xil bo'lishi shart (kodda shunday yozdim, o'zgartirma).