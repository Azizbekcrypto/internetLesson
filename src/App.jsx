import { useState, useEffect } from 'react'
import InternetLesson from './InternetLesson.jsx'
import PmLesson1 from './PmLesson1.jsx'
import Htmllesson1 from './1-Modull/Htmllesson1.jsx'
import Htmllesson2 from './1-Modull/Htmllesson2.jsx'
import PmLesson2 from './1-Modull/PmLesson2.jsx'
import CssLesson1 from './1-Modull/CssLesson1.jsx'
import CssLesson2 from './1-Modull/CssLesson2.jsx'
import GitLesson from './1-Modull/GitLesson.jsx'
import DeployLesson from './1-Modull/DeployLesson.jsx'
import PmLesson3 from './1-Modull/PmLesson3.jsx'
import JsIntroLesson from './2-Modull/JsIntroLesson.jsx'
import PmLesson4 from './2-Modull/PmLesson4.jsx'
import JsVarsLesson from './2-Modull/JsVarsLesson.jsx'
import JsConditionsLesson from './2-Modull/JsConditionsLesson.jsx'
import JsLoopsLesson from './2-Modull/JsLoopsLesson.jsx'
import JsFunctionsLesson from './2-Modull/JsFunctionsLesson.jsx'
import PmLesson5 from './2-Modull/PmLesson5.jsx'
import PracticeLesson1 from './2-Modull/PracticeLesson1.jsx'
import PracticeLesson2 from './2-Modull/PracticeLesson2.jsx'
import PeanStackLesson from './2-Modull/PeanStackLesson.jsx'
import PracticeLesson3 from './2-Modull/PracticeLesson3.jsx'
import PracticeLesson4 from './2-Modull/PracticeLesson4.jsx'
import PmLesson6 from './2-Modull/PmLesson6.jsx'

// DEV HOME — darslarni tanlab ko'rish uchun ichki sahifa (LMS'ga bormaydi).
// Hash-routing: har darsning o'z URL'i (#/lesson/KEY) — brauzer orqaga/oldinga tugmasi
// ishlaydi, sahifa yangilansa (reload) ham dars ochiq qoladi (jonli rejim testlari uchun muhim).
const MODULES = [
  {
    id: 1, title: '1-Modul — Internet va HTML asoslari', tag: 'HTML',
    lessons: [
      { key: 'internet', n: '1', type: 'HTML', emoji: '🌐', title: 'Internet qanday ishlaydi', sub: 'brauzer, domen, DNS, server', comp: InternetLesson },
      { key: 'pm',       n: '2', type: 'PM',   emoji: '🎯', title: 'Kim mening foydalanuvchim?', sub: 'KIM + MUAMMO + YECHIM', comp: PmLesson1 },
      { key: 'm1-03', n: '3',  type: 'Kod',     emoji: '📄', title: 'HTML qo\'lda — 1', sub: 'teg, sarlavha, ro\'yxat, havola · jonli', comp: Htmllesson1 },
      { key: 'm1-04', n: '4',  type: 'Kod',     emoji: '🖼️', title: 'HTML qo\'lda — 2', sub: 'rasm, struktura, forma, DevTools · praktika', comp: Htmllesson2 },
      { key: 'm1-05', n: '5',  type: 'PM',      emoji: '🗺️', title: 'Struktura = mahsulot qarori', sub: 'sayt tuzilishi = UX qaror · jonli', comp: PmLesson2 },
      { key: 'm1-06', n: '6',  type: 'Kod',     emoji: '🎨', title: 'CSS qo\'lda — 1', sub: 'ranglar, shriftlar, bo\'shliqlar · jonli', comp: CssLesson1 },
      { key: 'm1-07', n: '7',  type: 'Kod',     emoji: '📐', title: 'CSS qo\'lda — 2', sub: 'layout, flexbox, DevTools · jonli', comp: CssLesson2 },
      { key: 'm1-09', n: '9',  type: 'Kod',     emoji: '🔀', title: 'Git va GitHub', sub: 'commit, push, kod tarixi · jonli', comp: GitLesson },
      { key: 'm1-11', n: '11', type: 'Kod',     emoji: '🚀', title: 'Netlify va deploy', sub: 'hosting, poddomen · jonli', comp: DeployLesson },
      { key: 'm1-12', n: '12', type: 'PM',      emoji: '🎤', title: 'Storytelling / pitch', sub: '2 daqiqalik pitch · jonli', comp: PmLesson3 },
    ]
  },
  {
    id: 2, title: "2-Modul — Sistemalar qanday o'ylaydi", tag: 'JS',
    lessons: [
      { key: 'm2-01', n: '1',  type: 'Kod',     emoji: '🧠', title: 'Sistema va Algoritm', sub: 'sistema, algoritm, shart, sikl', comp: JsIntroLesson },
      { key: 'm2-02', n: '2',  type: 'PM',      emoji: '💊', title: 'Muammo → Yechim', sub: 'feature = og\'riqqa dori', comp: PmLesson4 },
      { key: 'm2-03', n: '3',  type: 'Kod',     emoji: '📦', title: 'JS — O\'zgaruvchilar', sub: 'let / const / var, turlar', comp: JsVarsLesson },
      { key: 'm2-04', n: '4',  type: 'Kod',     emoji: '🔀', title: 'JS — if / else', sub: 'shart, taqqoslash', comp: JsConditionsLesson },
      { key: 'm2-05', n: '5',  type: 'Kod',     emoji: '🔁', title: 'JS — Sikllar', sub: 'for, while, massiv', comp: JsLoopsLesson },
      { key: 'm2-06', n: '6',  type: 'Kod',     emoji: '🧩', title: 'JS — Funksiyalar', sub: 'funksiya, parametr, return', comp: JsFunctionsLesson },
      { key: 'm2-07', n: '7',  type: 'PM',      emoji: '🪜', title: 'Dekompozitsiya — MVP', sub: 'MVP, feature → backlog', comp: PmLesson5 },
      { key: 'm2-08', n: '8',  type: 'Proyekt', emoji: '⚡', title: 'Saytni jonlantiramiz', sub: 'interaktivlik, hodisa → reaksiya', comp: PracticeLesson1 },
      { key: 'm2-09', n: '9',  type: 'Proyekt', emoji: '🤖', title: 'AI bilan tez sayt', sub: 'prompt, iteratsiya', comp: PracticeLesson2 },
      { key: 'm2-10', n: '10', type: 'Kod',     emoji: '🍽️', title: 'PERN Stack', sub: 'frontend, backend, baza', comp: PeanStackLesson },
      { key: 'm2-11', n: '11', type: 'Proyekt', emoji: '🛠️', title: 'Dekompozitsiya + ishlab chiqish', sub: 'mini-do\'kon, 1-qism', comp: PracticeLesson3 },
      { key: 'm2-12', n: '12', type: 'Proyekt', emoji: '🚀', title: 'MVP tayyor (deploy)', sub: 'savat, bug, deploy', comp: PracticeLesson4 },
      { key: 'm2-13', n: '13', type: 'PM',      emoji: '🎤', title: 'Demo Day pitch', sub: '2 daqiqalik pitch', comp: PmLesson6 },
    ]
  },
]
const ALL = MODULES.flatMap(m => m.lessons)
const TYPE_COLOR = { HTML: '#7C3AED', PM: '#FF4F28', Kod: '#019ACB', Proyekt: '#1F7A4D' }

// Hash'dan joriy dars kalitini o'qiydi (#/lesson/KEY → KEY, aks holda null = home)
function useRoute() {
  const read = () => { const m = window.location.hash.match(/^#\/lesson\/(.+)$/); return m ? m[1] : null }
  const [key, setKey] = useState(read)
  useEffect(() => {
    const on = () => setKey(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return key
}

export default function App() {
  const key = useRoute()
  const lesson = ALL.find(l => l.key === key)

  if (lesson) {
    const L = lesson.comp
    return (
      <>
        <L />
        <a href="#/" title="Bosh sahifa — boshqa darsni tanlash" aria-label="Bosh sahifa"
          style={{ position: 'fixed', bottom: 14, left: 14, zIndex: 950, width: 40, height: 40, borderRadius: 12, border: 'none', background: '#FFFFFF', color: '#5A5A60', fontSize: 19, lineHeight: '40px', textAlign: 'center', textDecoration: 'none', cursor: 'pointer', boxShadow: '0 6px 18px -6px rgba(58,53,48,0.35)', opacity: 0.55, transition: 'opacity 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = 1 }} onMouseLeave={e => { e.currentTarget.style.opacity = 0.55 }}>⌂</a>
      </>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F6F4EF', padding: 'clamp(24px,5vw,56px) 20px', fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600&family=Manrope:wght@500;600;700;800&display=swap');
        .home-wrap { max-width: 720px; margin: 0 auto; }
        .lz-card { display: flex; align-items: center; gap: 16px; width: 100%; text-align: left; background: #fff; border: none; border-radius: 16px; padding: 16px 18px; cursor: pointer; text-decoration: none; box-shadow: 0 6px 20px -12px rgba(58,53,48,0.22); transition: transform 0.18s, box-shadow 0.18s; }
        .lz-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -12px rgba(255,79,40,0.32); }
        .lz-card:hover .lz-arrow { color: #FF4F28; transform: translateX(4px); }
        .lz-num { flex-shrink: 0; width: 30px; height: 30px; border-radius: 9px; background: #F6F4EF; color: #5A5A60; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; }
        .lz-chip { flex-shrink: 0; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 99px; }
        .lz-grid { display: flex; flex-direction: column; gap: 10px; }
      `}</style>
      <div className="home-wrap">
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF4F28' }}>CoddyCamp · Darslar</p>
        <h1 style={{ margin: '0 0 6px', fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 'clamp(26px,4vw,38px)', color: '#0E0E10' }}>Qaysi darsni ochamiz?</h1>
        <p style={{ margin: '0 0 34px', fontSize: 14, fontWeight: 500, color: '#5A5A60' }}>Darsni tanlang — har birining o'z manzili bor, sahifa yangilansa ham ochiq qoladi.</p>

        {MODULES.map(mod => (
          <div key={mod.id} style={{ marginBottom: 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 2px 14px' }}>
              <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 'clamp(17px,2.4vw,21px)', color: '#0E0E10' }}>{mod.title}</h2>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#A7A6A2' }}>· {mod.lessons.length} dars</span>
            </div>
            <div className="lz-grid">
              {mod.lessons.map(l => (
                <a key={l.key} className="lz-card" href={`#/lesson/${l.key}`}>
                  <span className="lz-num">{l.n}</span>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{l.emoji}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 'clamp(15px,2vw,17px)', color: '#0E0E10' }}>{l.title}</span>
                    <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, fontWeight: 500, color: '#5A5A60' }}>{l.sub}</span>
                  </span>
                  <span className="lz-chip" style={{ background: `${TYPE_COLOR[l.type]}18`, color: TYPE_COLOR[l.type] }}>{l.type}</span>
                  <span className="lz-arrow" style={{ fontSize: 18, color: '#A7A6A2', transition: 'transform 0.2s, color 0.2s', flexShrink: 0 }}>→</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
