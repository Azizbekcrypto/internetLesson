/* ═══ PIPELINE STATIK REJASI — bino qavatlari (sarlavha/tartib/narrator) ═══
   JONLI holat endi pipeline-live.js dan keladi (hook avto yozadi) — bu fayl
   faqat qavatlar ro'yxati + zaxira holat. Kodlar: D A I G E R S K (9 belgi).
   Tartib: PIPELINE_STATE.md ko'chirish navbati. */
window.PIPELINE = {
  model: 'claude-fable-5',
  activeLesson: 'PmLesson2.jsx',
  lessons: [
    { id:'Htmllesson2.jsx', icon:'🏠',    title:'HTML 2 — uy (etalon)',  s:'DKDKKDDDD', narrator:"✅ SINXRONLANDI va IMZOLANDI (GATE 3) — L1 bilan to'liq tenglashdi. Jonli-sinov qo'lda kutilmoqda." },
    { id:'CssLesson2.jsx', icon:'🎨',      title:'CSS asoslari 2',        s:'DDDDDDDDD', narrator:"✅ v18 imzolangan — jonli-sinov qo'lda kutilmoqda." },
    { id:'GitLesson.jsx', icon:'🕰️',       title:'Git — vaqt mashinasi',  s:'DDDDDDDDD', narrator:'✅ v18 IMZOLANDI — «MINORA QURUVCHI» (checkpoint mehnatni qutqaradi). Jonli-sinov qo\'lda.' },
    { id:'DeployLesson.jsx', icon:'🚀',    title:'Deploy — raketa',       s:'DDDDDDDDD', narrator:'✅ v18 IMZOLANDI — «UCHIRISH MARKAZI» (GO/HOLD, countdown, liftoff). Jonli-sinov qo\'lda.' },
    { id:'PmLesson2.jsx', icon:'🧩',       title:'PM 2 — Struktura UX',   s:'DDDDDDDDD', narrator:"✅ v18 IMZOLANDI (GATE 3) — «Sinov mijozi» ideasi bilan. Jonli-sinov qo'lda kutilmoqda." },
    { id:'PmLesson3.jsx', icon:'📋',       title:'PM 3',                  s:'DDDDDDDDD', narrator:'✅ v18 IMZOLANDI — «Demo Day investori» (treyler-montaj + jonli hakam). Jonli-sinov qo\'lda.' },
    { id:'JsIntroLesson.jsx', icon:'⚡',   title:'JS — kirish',           s:'IIIIIIIII', narrator:'Navbatda (2-Modull).' },
    { id:'JsVarsLesson.jsx', icon:'📦',    title:"JS — o'zgaruvchilar",   s:'IIIIIIIII', narrator:"Navbatda. Idea urug'i: yorliqli quti." },
    { id:'JsConditionsLesson.jsx', icon:'🚦', title:'JS — shartlar',      s:'IIIIIIIII', narrator:"Navbatda. Idea urug'i: ayri yo'l / svetofor." },
    { id:'JsLoopsLesson.jsx', icon:'🔁',   title:'JS — sikllar',          s:'IIIIIIIII', narrator:"Navbatda. Idea urug'i: konveyer." },
    { id:'JsFunctionsLesson.jsx', icon:'🍳', title:'JS — funksiyalar',    s:'IIIIIIIII', narrator:"Navbatda. Idea urug'i: retsept." },
    { id:'PeanStackLesson.jsx', icon:'🥞', title:'PEAN stack',            s:'IIIIIIIII', narrator:'Navbatda. QUIZ_BANK=15→12 masalasi bor.' },
    { id:'PmLesson4.jsx', icon:'📊',       title:'PM 4',                  s:'IIIIIIIII', narrator:'Navbatda.' },
    { id:'PmLesson5.jsx', icon:'🗂️',       title:'PM 5',                  s:'IIIIIIIII', narrator:'Navbatda.' },
    { id:'PmLesson6.jsx', icon:'🎯',       title:'PM 6',                  s:'IIIIIIIII', narrator:'Navbatda.' },
    { id:'PracticeLesson1.jsx', icon:'🛠️', title:'Praktika 1',            s:'IIIIIIIII', narrator:'Navbatda.' },
    { id:'PracticeLesson2.jsx', icon:'🔧', title:'Praktika 2',            s:'IIIIIIIII', narrator:'Navbatda.' },
    { id:'PracticeLesson3.jsx', icon:'⚙️', title:'Praktika 3',            s:'IIIIIIIII', narrator:'Navbatda.' },
    { id:'PracticeLesson4.jsx', icon:'🧰', title:'Praktika 4',            s:'IIIIIIIII', narrator:'Navbatda.' },
    { id:'PmLesson1.jsx', icon:'📝',       title:'PM 1',                  s:'DDDDDDDDD', narrator:'✅ v18 IMZOLANDI — «Bu men-ku!» qahramon-reaksiya ideasi bilan. Jonli-sinov qo\'lda kutilmoqda.' },
    { id:'InternetLesson.jsx', icon:'🌐',  title:'Internet asoslari',     s:'DKDDDDDDD', narrator:'✅ v18 IMZOLANDI — paket-o\'yin + to\'liq interaktiv qatlam. Jonli-sinov qo\'lda kutilmoqda.' },
  ],
};
if (window.__onPipeline) window.__onPipeline();
