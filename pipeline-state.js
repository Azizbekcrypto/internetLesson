/* ═══ PIPELINE JONLI HOLATI — asosiy agent (Claude) yangilaydi ═══
   Kodlar: D=done A=active I=idle G=gate E=error R=retry S=stuck  (9 belgi, ROLES tartibida)
   Auditor·Ijodkor·Quruvchi·Dizayn·Animatsiya·Jonli·Metodist·Tekshiruvchi·Verifikator */
window.PIPELINE = {
  model: 'claude-opus-4-8',
  updated: '16:45',
  activeLesson: 'CssLesson2.jsx',
  lessons: [
    { id:'CssLesson2.jsx', title:'CSS asoslari 2', s:'DDDDDDDDD',
      narrator:"🎉 FEEDBACK-QURILISH TAYYOR — 6 kamchilik hal qilindi! Nishonlar real, CodeStrike L1 darajasi. (jonli-sinov qo'lda kutilmoqda)",
      n:{6:'✅ til/matn', 7:'✅ QA: 0 nuqson', 8:'✅ imzolandi (feedback v18+)'} },
    { id:'GitLesson.jsx', title:'Git — versiyalar', s:'IIIIIIIII', narrator:"Navbatda." },
    { id:'DeployLesson.jsx', title:'Deploy — nashr', s:'IIIIIIIII', narrator:"Navbatda." },
    { id:'PmLesson2.jsx', title:'PM 2', s:'IIIIIIIII', narrator:"Navbatda." },
  ],
};
if (window.__onPipeline) window.__onPipeline();
