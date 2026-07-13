import { useState, useEffect, useMemo, lazy, Suspense } from 'react'

// ============================================================================
// CODDYCAMP SENIOR 2026 — BARCHA DARSLAR BITTA JOYDA
// Tartib CoddyCamp_Senior_2026_Final PDF dasturiga 1:1 mos (1 → 7-modul).
// Har dars lazy yuklanadi: bosh sahifa yengil, dars ochilganda o'z chunk'i keladi.
// Hash-routing: #/lesson/KEY — orqaga/oldinga va reload ishlaydi (jonli rejim uchun muhim).
// ============================================================================

const L = (p) => lazy(p)

// ---- 1-Modul
const InternetLesson = L(() => import('./InternetLesson.jsx'))
const PmLesson1 = L(() => import('./PmLesson1.jsx'))
const Htmllesson1 = L(() => import('./1-Modull/Htmllesson1.jsx'))
const Htmllesson2 = L(() => import('./1-Modull/Htmllesson2.jsx'))
const PmLesson2 = L(() => import('./1-Modull/PmLesson2.jsx'))
const CssLesson1 = L(() => import('./1-Modull/CssLesson1.jsx'))
const CssLesson2 = L(() => import('./1-Modull/CssLesson2.jsx'))
const HtmlPractice = L(() => import('./1-Modull/HtmlPractice.jsx'))
const GitLesson = L(() => import('./1-Modull/GitLesson.jsx'))
const CssPractice = L(() => import('./1-Modull/CssPractice.jsx'))
const DeployLesson = L(() => import('./1-Modull/DeployLesson.jsx'))
const PmLesson3 = L(() => import('./1-Modull/PmLesson3.jsx'))

// ---- 2-Modul
const JsIntroLesson = L(() => import('./2-Modull/JsIntroLesson.jsx'))
const PmLesson4 = L(() => import('./2-Modull/PmLesson4.jsx'))
const JsVarsLesson = L(() => import('./2-Modull/JsVarsLesson.jsx'))
const JsConditionsLesson = L(() => import('./2-Modull/JsConditionsLesson.jsx'))
const JsLoopsLesson = L(() => import('./2-Modull/JsLoopsLesson.jsx'))
const JsFunctionsLesson = L(() => import('./2-Modull/JsFunctionsLesson.jsx'))
const PmLesson5 = L(() => import('./2-Modull/PmLesson5.jsx'))
const PracticeLesson1 = L(() => import('./2-Modull/PracticeLesson1.jsx'))
const PracticeLesson2 = L(() => import('./2-Modull/PracticeLesson2.jsx'))
const PeanStackLesson = L(() => import('./2-Modull/PeanStackLesson.jsx'))
const PracticeLesson3 = L(() => import('./2-Modull/PracticeLesson3.jsx'))
const PracticeLesson4 = L(() => import('./2-Modull/PracticeLesson4.jsx'))
const PmLesson6 = L(() => import('./2-Modull/PmLesson6.jsx'))

// ---- 3-Modul
const ReactIntroLesson = L(() => import('./3-Modull/ReactIntroLesson.jsx'))
const PmLesson7 = L(() => import('./3-Modull/PmLesson7.jsx'))
const ReactFirstComponentLesson = L(() => import('./3-Modull/ReactFirstComponentLesson.jsx'))
const ReactStateEffectLesson = L(() => import('./3-Modull/ReactStateEffectLesson.jsx'))
const PmLesson8 = L(() => import('./3-Modull/PmLesson8.jsx'))
const ReactPropsReuseLesson = L(() => import('./3-Modull/ReactPropsReuseLesson.jsx'))
const ReactCrudPracticeLesson = L(() => import('./3-Modull/ReactCrudPracticeLesson.jsx'))
const ReactApiGetLesson = L(() => import('./3-Modull/ReactApiGetLesson.jsx'))
const ReactApiPostLesson = L(() => import('./3-Modull/ReactApiPostLesson.jsx'))
const PmLesson9 = L(() => import('./3-Modull/PmLesson9.jsx'))
const ReactRouterPracticeLesson = L(() => import('./3-Modull/ReactRouterPracticeLesson.jsx'))
const ReactProjectDayLesson = L(() => import('./3-Modull/ReactProjectDayLesson.jsx'))
const ReactBuildSiteLesson = L(() => import('./3-Modull/ReactBuildSiteLesson.jsx'))
const PmLesson10 = L(() => import('./3-Modull/PmLesson10.jsx'))

// ---- 4-Modul
const DataIntroLesson = L(() => import('./4-Modull/DataIntroLesson.jsx'))
const PmLesson11 = L(() => import('./4-Modull/PmLesson11.jsx'))
const DbSqlNosqlLesson = L(() => import('./4-Modull/DbSqlNosqlLesson.jsx'))
const NodeServerLesson = L(() => import('./4-Modull/NodeServerLesson.jsx'))
const RoutingLesson = L(() => import('./4-Modull/RoutingLesson.jsx'))
const PostgresCrudLesson = L(() => import('./4-Modull/PostgresCrudLesson.jsx'))
const PmLesson12 = L(() => import('./4-Modull/PmLesson12.jsx'))
const BackendCrudPracticeLesson = L(() => import('./4-Modull/BackendCrudPracticeLesson.jsx'))
const ApiPostmanLesson = L(() => import('./4-Modull/ApiPostmanLesson.jsx'))
const FullstackConnectPracticeLesson = L(() => import('./4-Modull/FullstackConnectPracticeLesson.jsx'))
const AuthEnvLesson = L(() => import('./4-Modull/AuthEnvLesson.jsx'))
const PmLesson13 = L(() => import('./4-Modull/PmLesson13.jsx'))
const FullstackProjectDayLesson = L(() => import('./4-Modull/FullstackProjectDayLesson.jsx'))
const FullstackFeedbackLesson = L(() => import('./4-Modull/FullstackFeedbackLesson.jsx'))
const PmLesson14 = L(() => import('./4-Modull/PmLesson14.jsx'))

// ---- 4a-Modul
const NestArchAliveLesson = L(() => import('./4a-Modull/NestArchAliveLesson.jsx'))
const PmLesson15 = L(() => import('./4a-Modull/PmLesson15.jsx'))
const NestArchResourceLesson = L(() => import('./4a-Modull/NestArchResourceLesson.jsx'))
const NestArchPracticeLesson = L(() => import('./4a-Modull/NestArchPracticeLesson.jsx'))

// ---- 4b-Modul
const JestUnitTestLesson = L(() => import('./4b-Modull/JestUnitTestLesson.jsx'))
const PmLesson16 = L(() => import('./4b-Modull/PmLesson16.jsx'))
const EdgeCasesTestLesson = L(() => import('./4b-Modull/EdgeCasesTestLesson.jsx'))

// ---- 4c-Modul
const CiCdIntroLesson = L(() => import('./4c-Modull/CiCdIntroLesson.jsx'))
const PmLesson17 = L(() => import('./4c-Modull/PmLesson17.jsx'))
const GithubActionsLesson = L(() => import('./4c-Modull/GithubActionsLesson.jsx'))
const FullPipelineProjectLesson = L(() => import('./4c-Modull/FullPipelineProjectLesson.jsx'))
const AiPipelineProjectLesson = L(() => import('./4c-Modull/AiPipelineProjectLesson.jsx'))
const PmLesson18 = L(() => import('./4c-Modull/PmLesson18.jsx'))
const FullProPipelineLesson = L(() => import('./4c-Modull/FullProPipelineLesson.jsx'))

// ---- 5-Modul
const BotIntroLesson = L(() => import('./5-Modull/BotIntroLesson.jsx'))
const PmLesson19 = L(() => import('./5-Modull/PmLesson19.jsx'))
const BotApiButtonsLesson = L(() => import('./5-Modull/BotApiButtonsLesson.jsx'))
const BotStatefulMemoryLesson = L(() => import('./5-Modull/BotStatefulMemoryLesson.jsx'))
const BotAiProjectLesson = L(() => import('./5-Modull/BotAiProjectLesson.jsx'))
const BotAiBrainLesson = L(() => import('./5-Modull/BotAiBrainLesson.jsx'))
const BotFullProjectLesson = L(() => import('./5-Modull/BotFullProjectLesson.jsx'))
const PmLesson20 = L(() => import('./5-Modull/PmLesson20.jsx'))
const BotFeedbackIterationLesson = L(() => import('./5-Modull/BotFeedbackIterationLesson.jsx'))
const BotAiAgentLesson = L(() => import('./5-Modull/BotAiAgentLesson.jsx'))
const PmLesson21 = L(() => import('./5-Modull/PmLesson21.jsx'))

// ---- 6-Modul
const SystemArchitectureLesson = L(() => import('./6-Modull/SystemArchitectureLesson.jsx'))
const PmLesson22 = L(() => import('./6-Modull/PmLesson22.jsx'))
const ArchPatternsLesson = L(() => import('./6-Modull/ArchPatternsLesson.jsx'))
const AgentArchitectureLesson = L(() => import('./6-Modull/AgentArchitectureLesson.jsx'))
const ClaudeSkillsLesson = L(() => import('./6-Modull/ClaudeSkillsLesson.jsx'))
const PmLesson23 = L(() => import('./6-Modull/PmLesson23.jsx'))
const WriteSkillLesson = L(() => import('./6-Modull/WriteSkillLesson.jsx'))
const PipelineProjectLesson = L(() => import('./6-Modull/PipelineProjectLesson.jsx'))
const ReactNativeBasicsLesson = L(() => import('./6-Modull/ReactNativeBasicsLesson.jsx'))
const ReactNativeAppLesson = L(() => import('./6-Modull/ReactNativeAppLesson.jsx'))
const MobileAppPracticeLesson = L(() => import('./6-Modull/MobileAppPracticeLesson.jsx'))
const PmLesson24 = L(() => import('./6-Modull/PmLesson24.jsx'))
const FullSystemProjectLesson = L(() => import('./6-Modull/FullSystemProjectLesson.jsx'))
const PmLesson25 = L(() => import('./6-Modull/PmLesson25.jsx'))

// ---- 7-Modul
const PmLesson26 = L(() => import('./7-Modull/PmLesson26.jsx'))
const PmLesson27 = L(() => import('./7-Modull/PmLesson27.jsx'))
const PmLesson28 = L(() => import('./7-Modull/PmLesson28.jsx'))
const PmLesson29 = L(() => import('./7-Modull/PmLesson29.jsx'))
const PmLesson30 = L(() => import('./7-Modull/PmLesson30.jsx'))
const PmLesson31 = L(() => import('./7-Modull/PmLesson31.jsx'))
const MvpArchLesson = L(() => import('./7-Modull/MvpArchLesson.jsx'))
const PmLesson32 = L(() => import('./7-Modull/PmLesson32.jsx'))
const MvpBuild1Lesson = L(() => import('./7-Modull/MvpBuild1Lesson.jsx'))
const PmLesson33 = L(() => import('./7-Modull/PmLesson33.jsx'))
const MvpBuild2Lesson = L(() => import('./7-Modull/MvpBuild2Lesson.jsx'))
const PmLesson34 = L(() => import('./7-Modull/PmLesson34.jsx'))
const MvpIterateLesson = L(() => import('./7-Modull/MvpIterateLesson.jsx'))

// ============================================================================
// DASTUR — PDF tartibida. n = PDF'dagi dars raqami.
// type: Kod | PM | Proyekt | Demo | Rezerv   (Demo/Rezerv — dars fayli yo'q, kulrang qator)
// ============================================================================
const MODULES = [
  {
    id: '1', slug: 'm1', title: 'Men internetdaman', period: 'oy 1–1.5', stage: 1,
    idea: 'Portfolio — birinchi mahsulot. Har qadamda: "Bu kim uchun? Nega bor?"',
    lessons: [
      { key: 'm1-01', n: 1,  type: 'Kod',     emoji: '🌐', title: 'Internet qanday ishlaydi',        sub: 'brauzer, server, domen, DNS — so\'rov yo\'li', comp: InternetLesson },
      { key: 'm1-02', n: 2,  type: 'PM',      emoji: '🎯', title: 'Kim mening foydalanuvchim?',      sub: 'auditoriya va saytning maqsadi', comp: PmLesson1 },
      { key: 'm1-03', n: 3,  type: 'Kod',     emoji: '📄', title: 'HTML qo\'lda — 1',                sub: 'teg, sarlavha, ro\'yxat, havola', comp: Htmllesson1 },
      { key: 'm1-04', n: 4,  type: 'Kod',     emoji: '🖼️', title: 'HTML qo\'lda — 2',                sub: 'rasm, forma, struktura, DevTools', comp: Htmllesson2 },
      { key: 'm1-05', n: 5,  type: 'PM',      emoji: '🗺️', title: 'Struktura = mahsulot qarori',     sub: 'sayt tuzilishi — bu UX qaror', comp: PmLesson2 },
      { key: 'm1-06', n: 6,  type: 'Kod',     emoji: '🎨', title: 'CSS qo\'lda — 1',                 sub: 'rang, shrift, bo\'shliqlar', comp: CssLesson1 },
      { key: 'm1-07', n: 7,  type: 'Kod',     emoji: '📐', title: 'CSS qo\'lda — 2',                 sub: 'layout, flexbox, DevTools', comp: CssLesson2 },
      { key: 'm1-08', n: 8,  type: 'Proyekt', emoji: '🧱', title: 'Praktika: portfolio strukturasi', sub: 'saytni bo\'laklaymiz, HTML skelet', comp: HtmlPractice },
      { key: 'm1-09', n: 9,  type: 'Kod',     emoji: '🔀', title: 'Git va GitHub',                   sub: 'commit, push — kod uchun vaqt mashinasi', comp: GitLesson },
      { key: 'm1-10', n: 10, type: 'Proyekt', emoji: '💅', title: 'Praktika: bezash va yakunlash',   sub: 'CSS + kontent + AI bilan tugma', comp: CssPractice },
      { key: 'm1-11', n: 11, type: 'Kod',     emoji: '🚀', title: 'Netlify va deploy',               sub: 'hosting, maktab poddomeni', comp: DeployLesson },
      { key: 'm1-12', n: 12, type: 'PM',      emoji: '🎤', title: 'Storytelling: mahsulotni so\'zlab ber', sub: '2 daqiqalik pitch: muammo → yechim → demo', comp: PmLesson3 },
      { key: 'm1-13', n: 13, type: 'Demo',    emoji: '🎤', title: 'Demo Day 1',                      sub: 'ota-onalar oldida ochiq himoya' },
    ],
  },
  {
    id: '2', slug: 'm2', title: 'Sistemalar qanday o\'ylaydi', period: 'oy 1.5–3', stage: 1,
    idea: 'Koddagi dekompozitsiya = PM\'dagi dekompozitsiya. Bitta mahorat — ikki til.',
    lessons: [
      { key: 'm2-01', n: 1,  type: 'Kod',     emoji: '🧠', title: 'Sistema va Algoritm',          sub: 'komponent, bog\'lanish, ketma-ketlik', comp: JsIntroLesson },
      { key: 'm2-02', n: 2,  type: 'PM',      emoji: '💊', title: 'Muammo → Yechim',               sub: 'har bir feature — qaysi og\'riqqa dori?', comp: PmLesson4 },
      { key: 'm2-03', n: 3,  type: 'Kod',     emoji: '📦', title: 'JS — O\'zgaruvchilar',          sub: 'let / const / var, ma\'lumot turlari', comp: JsVarsLesson },
      { key: 'm2-04', n: 4,  type: 'Kod',     emoji: '🔀', title: 'JS — if / else',                sub: 'shart, taqqoslash operatorlari', comp: JsConditionsLesson },
      { key: 'm2-05', n: 5,  type: 'Kod',     emoji: '🔁', title: 'JS — Sikllar',                  sub: 'for, while, massivni aylanish', comp: JsLoopsLesson },
      { key: 'm2-06', n: 6,  type: 'Kod',     emoji: '🧩', title: 'JS — Funksiyalar, Array + Object', sub: 'parametr, return, xotira (Stack/Heap)', comp: JsFunctionsLesson },
      { key: 'm2-07', n: 7,  type: 'PM',      emoji: '🪜', title: 'Dekompozitsiya — PM quroli',    sub: 'feature list → MVP → backlog', comp: PmLesson5 },
      { key: 'm2-08', n: 8,  type: 'Proyekt', emoji: '⚡', title: 'Loyiha kuni: saytga jon',       sub: 'HTML/CSS saytga interaktivlik', comp: PracticeLesson1 },
      { key: 'm2-09', n: 9,  type: 'Proyekt', emoji: '🤖', title: 'Loyiha kuni: AI bilan tez sayt', sub: 'prompt orqali sifatli loyiha', comp: PracticeLesson2 },
      { key: 'm2-10', n: 10, type: 'Kod',     emoji: '🍽️', title: 'PERN Stack — umumiy ko\'rinish', sub: 'PostgreSQL + Express + React + Node', comp: PeanStackLesson },
      { key: 'm2-11', n: 11, type: 'Proyekt', emoji: '🛠️', title: 'Dekompozitsiya va ishlab chiqish — 1', sub: 'AI\'ni ochishdan oldin bo\'laklaymiz', comp: PracticeLesson3 },
      { key: 'm2-12', n: 12, type: 'Proyekt', emoji: '🚀', title: 'Ishlab chiqish — 2: MVP tayyor', sub: 'feature\'larni yakunlash, deploy', comp: PracticeLesson4 },
      { key: 'm2-13', n: 13, type: 'PM',      emoji: '🎤', title: 'Sistemani qanday pitch qilish',  sub: 'arxitekturani texnik bo\'lmagan odamga', comp: PmLesson6 },
      { key: 'm2-14', n: 14, type: 'Rezerv',  emoji: '📅', title: 'Zaxira dars',                    sub: 'yetib olish / sayqallash' },
      { key: 'm2-15', n: 15, type: 'Demo',    emoji: '🎤', title: 'Demo Day',                       sub: 'guruh oldida ichki himoya' },
    ],
  },
  {
    id: '3', slug: 'm3', title: 'Frontend — React', period: 'oy 3–4.5', stage: 1,
    idea: 'Komponent = feature. User Story koddan OLDIN yoziladi.',
    lessons: [
      { key: 'm3-01', n: 1,  type: 'Kod',     emoji: '⚛️', title: 'React nima va nima uchun?',      sub: 'komponent, Virtual DOM, React Native', comp: ReactIntroLesson },
      { key: 'm3-02', n: 2,  type: 'PM',      emoji: '📝', title: 'User Story: kim va nima uchun?', sub: '"Men [kim] sifatida..." — JTBD', comp: PmLesson7 },
      { key: 'm3-03', n: 3,  type: 'Kod',     emoji: '🧱', title: 'Birinchi komponent',             sub: 'Vite, JSX, props, loyiha strukturasi', comp: ReactFirstComponentLesson },
      { key: 'm3-04', n: 4,  type: 'Kod',     emoji: '💗', title: 'State va Effect',                sub: 'useState + useEffect, lifecycle', comp: ReactStateEffectLesson },
      { key: 'm3-05', n: 5,  type: 'PM',      emoji: '⚖️', title: 'Komponent = feature: prioritet', sub: 'Impact vs Effort matritsasi', comp: PmLesson8 },
      { key: 'm3-06', n: 6,  type: 'Kod',     emoji: '🏭', title: 'Props va qayta ishlatish',       sub: 'ma\'lumotni komponentlar orasida uzatish', comp: ReactPropsReuseLesson },
      { key: 'm3-07', n: 7,  type: 'Proyekt', emoji: '🐠', title: 'Praktika: AI bilan to\'liq CRUD', sub: 'Create / Read / Update / Delete', comp: ReactCrudPracticeLesson },
      { key: 'm3-08', n: 8,  type: 'Kod',     emoji: '🛎️', title: 'API bilan ishlash — GET',        sub: 'fetch / axios, JSON, loading', comp: ReactApiGetLesson },
      { key: 'm3-09', n: 9,  type: 'Kod',     emoji: '📦', title: 'API — POST / PUT / DELETE',      sub: 'serverga ma\'lumot yuborish', comp: ReactApiPostLesson },
      { key: 'm3-10', n: 10, type: 'PM',      emoji: '✅', title: 'Acceptance Criteria',            sub: 'feature qachon tayyor hisoblanadi?', comp: PmLesson9 },
      { key: 'm3-11', n: 11, type: 'Proyekt', emoji: '🌀', title: 'Praktika: React Router',         sub: 'ko\'p sahifali ilova, navigatsiya', comp: ReactRouterPracticeLesson },
      { key: 'm3-12', n: 12, type: 'Proyekt', emoji: '🚗', title: 'Loyiha kuni — AvtoIjara',        sub: 'React + API + CRUD + routing', comp: ReactProjectDayLesson },
      { key: 'm3-13', n: 13, type: 'Proyekt', emoji: '🏗️', title: 'Final loyihani bo\'laklash va qurish', sub: 'komponent sxemasi + ishlaydigan loyiha', comp: ReactBuildSiteLesson },
      { key: 'm3-14', n: 14, type: 'PM',      emoji: '🎤', title: 'Storytelling: frontend pitchi',  sub: 'mahsulotni jonli ko\'rsatish', comp: PmLesson10 },
      { key: 'm3-15', n: 15, type: 'Rezerv',  emoji: '📅', title: 'Zaxira dars',                    sub: 'yetib olish / sayqallash' },
      { key: 'm3-16', n: 16, type: 'Demo',    emoji: '🎤', title: 'Demo Day',                       sub: 'guruh + mehmonlar oldida himoya' },
    ],
  },
  {
    id: '4', slug: 'm4', title: 'Ma\'lumot va bog\'lanishlar', period: 'oy 4.5–6', stage: 1,
    sub: 'Node.js + PostgreSQL',
    idea: 'Ma\'lumot sxemasi — mahsulot qarori. Ma\'lumot tasodifan emas, vazifa uchun yig\'iladi.',
    lessons: [
      { key: 'm4-01', n: 1,  type: 'Kod',     emoji: '🔌', title: 'Ma\'lumot nima',                sub: 'JSON, jadval, bog\'lanish, PK/FK', comp: DataIntroLesson },
      { key: 'm4-02', n: 2,  type: 'PM',      emoji: '📊', title: 'Ma\'lumot = mahsulot qarori',   sub: 'nimani saqlaymiz va nega — metrikalar', comp: PmLesson11 },
      { key: 'm4-03', n: 3,  type: 'Kod',     emoji: '📦', title: 'SQL vs NoSQL — PostgreSQL',     sub: 'qachon qaysi biri kerak', comp: DbSqlNosqlLesson },
      { key: 'm4-04', n: 4,  type: 'Kod',     emoji: '🏪', title: 'Node.js — birinchi server',     sub: 'npm, Express, birinchi endpoint', comp: NodeServerLesson },
      { key: 'm4-05', n: 5,  type: 'Kod',     emoji: '📮', title: 'Routing — Express / Nest',      sub: 'method + path, 404, /:id', comp: RoutingLesson },
      { key: 'm4-06', n: 6,  type: 'Kod',     emoji: '🐘', title: 'PostgreSQL so\'rovlari',        sub: 'SELECT, INSERT, UPDATE, DELETE', comp: PostgresCrudLesson },
      { key: 'm4-07', n: 7,  type: 'PM',      emoji: '🔐', title: 'Xavfsizlik = foydalanuvchi ishonchi', sub: '.env va ma\'lumot himoyasi — mahsulot qiymati', comp: PmLesson12 },
      { key: 'm4-08', n: 8,  type: 'Proyekt', emoji: '🚗', title: 'Praktika: Backend CRUD',        sub: 'AvtoIjara — Express + PostgreSQL', comp: BackendCrudPracticeLesson },
      { key: 'm4-09', n: 9,  type: 'Kod',     emoji: '📡', title: 'API nima + Postman',            sub: 'so\'rov va javob, status kodlari', comp: ApiPostmanLesson },
      { key: 'm4-10', n: 10, type: 'Proyekt', emoji: '🌉', title: 'Praktika: React + Node ulash',  sub: 'fetch, CORS — front ↔ back', comp: FullstackConnectPracticeLesson },
      { key: 'm4-11', n: 11, type: 'Kod',     emoji: '🔑', title: 'Autentifikatsiya va .env',      sub: 'JWT token, login, himoyalangan route', comp: AuthEnvLesson },
      { key: 'm4-12', n: 12, type: 'PM',      emoji: '🗂️', title: 'Sxema — PRD artefakti',         sub: 'baza sxemasi mahsulot hujjatining qismi', comp: PmLesson13 },
      { key: 'm4-13', n: 13, type: 'Proyekt', emoji: '🅿️', title: 'Fullstack loyiha kuni',         sub: 'AvtoStoyanka — baza + server + panel', comp: FullstackProjectDayLesson },
      { key: 'm4-14', n: 14, type: 'Proyekt', emoji: '💬', title: 'Fikr bo\'yicha yaxshilash',     sub: 'sinfdoshlar fikri → 3 muammo tuzatildi', comp: FullstackFeedbackLesson },
      { key: 'm4-15', n: 15, type: 'PM',      emoji: '🎤', title: 'Fullstack arxitektura pitchi',  sub: 'texnik qarorni stakeholder\'ga tushuntirish', comp: PmLesson14 },
      { key: 'm4-16', n: 16, type: 'Rezerv',  emoji: '📅', title: 'Zaxira dars',                   sub: 'yetib olish / sayqallash' },
      { key: 'm4-17', n: 17, type: 'Demo',    emoji: '🎤', title: 'Demo Day',                      sub: 'jonli fullstack demo' },
    ],
  },
  {
    id: '4a', slug: 'm4a', title: 'NestJS + Arxitektura', period: 'oy 6–7.5', stage: 1,
    idea: 'To\'g\'ri arxitektura = yangi feature\'ni tez yetkazish. Texnik qarz — mahsulot riski.',
    lessons: [
      { key: 'm4a-01', n: 1, type: 'Kod',     emoji: '🪺', title: 'NestJS va arxitektura',        sub: 'MVC, module, controller, service', comp: NestArchAliveLesson },
      { key: 'm4a-02', n: 2, type: 'PM',      emoji: '📈', title: 'Masshtablanuvchanlik = mahsulot qarori', sub: 'bugungi arxitektura — 6 oydan keyingi tezlik', comp: PmLesson15 },
      { key: 'm4a-03', n: 3, type: 'Kod',     emoji: '📋', title: 'Boilerplate: Nest + PostgreSQL', sub: 'Entity, DTO, Repository — CRUD', comp: NestArchResourceLesson },
      { key: 'm4a-04', n: 4, type: 'Proyekt', emoji: '📚', title: 'Praktika: yangi modul',        sub: 'KitobShop — o\'z controller + service', comp: NestArchPracticeLesson },
    ],
  },
  {
    id: '4b', slug: 'm4b', title: 'Loyihani testlash', period: 'oy 7.5–8.5', stage: 1,
    idea: 'Har bir tutilmagan bug — yo\'qotilgan foydalanuvchi. Sifat = mahsulot qiymati.',
    lessons: [
      { key: 'm4b-01', n: 1, type: 'Kod', emoji: '🧪', title: 'Unit-test: Jest',            sub: 'describe / it / expect — birinchi test', comp: JestUnitTestLesson },
      { key: 'm4b-02', n: 2, type: 'PM',  emoji: '🛡️', title: 'Sifat = mahsulot qiymati',   sub: 'bug va retention bog\'liqligi', comp: PmLesson16 },
      { key: 'm4b-03', n: 3, type: 'Kod', emoji: '🌶️', title: 'Edge case va error path',    sub: 'happy path vs xato, toThrow', comp: EdgeCasesTestLesson },
    ],
  },
  {
    id: '4c', slug: 'm4c', title: 'CI/CD + Deploy', period: 'oy 8.5–9.5', stage: 1,
    idea: 'Delivery tezligi = gipotezani tekshirish tezligi = raqobat ustunligi.',
    lessons: [
      { key: 'm4c-01', n: 1, type: 'Kod',     emoji: '🛫', title: 'CI/CD nima va nega kerak',   sub: 'Continuous Integration / Deployment', comp: CiCdIntroLesson },
      { key: 'm4c-02', n: 2, type: 'PM',      emoji: '⚡', title: 'Delivery tezligi = ustunlik', sub: 'oyiga nechta eksperiment o\'tkaza olasiz?', comp: PmLesson17 },
      { key: 'm4c-03', n: 3, type: 'Kod',     emoji: '🗺️', title: 'GitHub Actions — asoslar',   sub: 'workflow, job, step, ci.yml', comp: GithubActionsLesson },
      { key: 'm4c-04', n: 4, type: 'Proyekt', emoji: '🧳', title: 'Loyiha kuni: to\'liq lenta', sub: 'backend + frontend — real loyiha', comp: FullPipelineProjectLesson },
      { key: 'm4c-05', n: 5, type: 'Proyekt', emoji: '🧑‍🔧', title: 'Loyiha kuni: promptlar bilan', sub: 'AI bilan lentani boshqarish', comp: AiPipelineProjectLesson },
      { key: 'm4c-06', n: 6, type: 'PM',      emoji: '📟', title: 'Monitoring = mahsulot metrikasi', sub: 'uptime, latency, error rate, SLA', comp: PmLesson18 },
      { key: 'm4c-07', n: 7, type: 'Proyekt', emoji: '⚙️', title: 'Loyiha kuni: hammasi birga', sub: 'test + lint + deploy + monitoring', comp: FullProPipelineLesson },
      { key: 'm4c-08', n: 8, type: 'Rezerv',  emoji: '📅', title: 'Zaxira dars',                sub: 'yetib olish / sayqallash' },
    ],
  },
  {
    id: '5', slug: 'm5', title: 'Botlar va avtomatlashtirish', period: 'oy 9.5–11', stage: 1,
    idea: 'Real odamlar bilan birinchi jonli mahsulot tajribasi. 20+ real foydalanuvchi.',
    lessons: [
      { key: 'm5-01', n: 1,  type: 'Kod',     emoji: '🤖', title: 'Bot nima',                    sub: 'event-driven mantiq: trigger → amal', comp: BotIntroLesson },
      { key: 'm5-02', n: 2,  type: 'PM',      emoji: '🧲', title: 'Birinchi foydalanuvchilar',   sub: 'pulsiz 20 ta foydalanuvchi qanday?', comp: PmLesson19 },
      { key: 'm5-03', n: 3,  type: 'Kod',     emoji: '🎛️', title: 'Telegram Bot API + tugmalar', sub: 'BotFather, token, /start, inline', comp: BotApiButtonsLesson },
      { key: 'm5-04', n: 4,  type: 'Kod',     emoji: '🧠', title: 'Stateful logika + PostgreSQL', sub: 'bot eslab qoladi, ma\'lumot saqlaydi', comp: BotStatefulMemoryLesson },
      { key: 'm5-05', n: 5,  type: 'Proyekt', emoji: '🪄', title: 'Loyiha kuni: AI bilan bot',   sub: 'promptlar bilan istalgan Telegram bot', comp: BotAiProjectLesson },
      { key: 'm5-06', n: 6,  type: 'Proyekt', emoji: '💡', title: 'Bot ichida AI',               sub: 'AI API\'ni ulash, xulq sozlash', comp: BotAiBrainLesson },
      { key: 'm5-07', n: 7,  type: 'Proyekt', emoji: '📦', title: 'Loyiha kuni: bot + DB + AI',  sub: 'to\'liq ishlaydigan bot + hosting', comp: BotFullProjectLesson },
      { key: 'm5-08', n: 8,  type: 'PM',      emoji: '🎙️', title: 'Custdev: jonli foydalanuvchi', sub: '5 savol shabloni, 5 mini-intervyu', comp: PmLesson20 },
      { key: 'm5-09', n: 9,  type: 'Proyekt', emoji: '🔁', title: 'Fikr va iteratsiya',          sub: 'foydalanuvchi nima dedi → nima tuzatamiz', comp: BotFeedbackIterationLesson },
      { key: 'm5-10', n: 10, type: 'Proyekt', emoji: '🦾', title: 'AI-agent yaratish',           sub: 'idrok → qaror → amal sikli', comp: BotAiAgentLesson },
      { key: 'm5-11', n: 11, type: 'PM',      emoji: '📈', title: 'Foydalanuvchi yig\'ish + metrika', sub: 'DAU, retention — 20+ real foydalanuvchi', comp: PmLesson21 },
      { key: 'm5-12', n: 12, type: 'Rezerv',  emoji: '📅', title: 'Zaxira dars',                 sub: 'yetib olish / sayqallash' },
      { key: 'm5-13', n: 13, type: 'Demo',    emoji: '🎤', title: 'Demo Day',                    sub: 'jonli bot + 20 foydalanuvchi + metrika' },
    ],
  },
  {
    id: '6', slug: 'm6', title: 'Tizimni to\'liq yig\'aman', period: 'oy 11–12.5', stage: 1,
    idea: '1-bosqich yakuni: o\'quvchi mahsulotni QURA OLADI va TUSHUNTIRA OLADI.',
    lessons: [
      { key: 'm6-01', n: 1,  type: 'Kod',     emoji: '🧭', title: 'Komponentlardan tizim',      sub: 'front + back + baza + AI + bot', comp: SystemArchitectureLesson },
      { key: 'm6-02', n: 2,  type: 'PM',      emoji: '📄', title: 'PRD nima',                   sub: 'muammo / auditoriya / yechim / metrika', comp: PmLesson22 },
      { key: 'm6-03', n: 3,  type: 'Kod',     emoji: '🏛️', title: 'Arxitektura patternlari',    sub: 'MVC, mikroservis — sodda tilda', comp: ArchPatternsLesson },
      { key: 'm6-04', n: 4,  type: 'Kod',     emoji: '🦾', title: 'AI-agent nima',              sub: 'agent vs oddiy AI — qaror sikli', comp: AgentArchitectureLesson },
      { key: 'm6-05', n: 5,  type: 'Kod',     emoji: '✨', title: 'Claude Skills — nima',       sub: 'Skills AI xulqini qanday o\'zgartiradi', comp: ClaudeSkillsLesson },
      { key: 'm6-06', n: 6,  type: 'PM',      emoji: '⚖️', title: 'Etika va mas\'uliyat',       sub: 'AI-mahsulotda nima noto\'g\'ri ketishi mumkin', comp: PmLesson23 },
      { key: 'm6-07', n: 7,  type: 'Kod',     emoji: '🛠️', title: 'O\'z Skill\'ingizni yozing', sub: 'struktura, test, kontekst-injiniring', comp: WriteSkillLesson },
      { key: 'm6-08', n: 8,  type: 'Proyekt', emoji: '🔗', title: 'Praktika: to\'liq pipeline', sub: 'React + Node + PG + Telegram + AI', comp: PipelineProjectLesson },
      { key: 'm6-09', n: 9,  type: 'Kod',     emoji: '📱', title: 'React Native — asoslar',     sub: 'RN nima, Expo setup', comp: ReactNativeBasicsLesson },
      { key: 'm6-10', n: 10, type: 'Kod',     emoji: '🧳', title: 'RN: komponent, navigatsiya, API', sub: 'View, Text, Stack Navigator, fetch', comp: ReactNativeAppLesson },
      { key: 'm6-11', n: 11, type: 'Proyekt', emoji: '📲', title: 'Praktika: mobil ilova',      sub: 'eski loyihaning mobil versiyasi', comp: MobileAppPracticeLesson },
      { key: 'm6-12', n: 12, type: 'PM',      emoji: '🗺️', title: 'Roadmap: rejalashtirish',    sub: 'hozir / 3 oy / 6 oy — RICE', comp: PmLesson24 },
      { key: 'm6-13', n: 13, type: 'Proyekt', emoji: '🏗️', title: 'Loyiha kuni: to\'liq tizim', sub: 'end-to-end ishlaydigan tizim', comp: FullSystemProjectLesson },
      { key: 'm6-14', n: 14, type: 'PM',      emoji: '🎤', title: 'Metrikali pitch — Demo Day 3', sub: 'metrika = isbot, arxitektura = slayd', comp: PmLesson25 },
      { key: 'm6-15', n: 15, type: 'Rezerv',  emoji: '📅', title: 'Zaxira dars',                sub: 'yetib olish / sayqallash' },
      { key: 'm6-16', n: 16, type: 'Demo',    emoji: '🎤', title: 'Demo Day 3',                 sub: 'IT-hamjamiyat oldida 3 daqiqalik pitch' },
    ],
  },
  {
    id: '7', slug: 'm7', title: 'Kim uchun va nima uchun', period: 'oy 9–10.5', stage: 2,
    idea: 'Real odam uchun birinchi mahsulot. Foydalanuvchi Demo Day\'da hozir bo\'ladi.',
    lessons: [
      { key: 'm7-01', n: 1,  type: 'PM',      emoji: '🎯', title: 'Mahsulot vs loyiha',        sub: 'nega ko\'p loyiha hech kimga kerak emas', comp: PmLesson26 },
      { key: 'm7-02', n: 2,  type: 'PM',      emoji: '🔨', title: 'Jobs-to-be-Done',           sub: 'odam drel emas — teshik sotib oladi', comp: PmLesson27 },
      { key: 'm7-03', n: 3,  type: 'PM',      emoji: '🔍', title: 'Muammoni qanday izlash',    sub: 'kuzatish, og\'riq, frustratsiya', comp: PmLesson28 },
      { key: 'm7-04', n: 4,  type: 'PM',      emoji: '❓', title: 'Custdev: savol berish',     sub: 'Mom Test — taqiqlangan savollar', comp: PmLesson29 },
      { key: 'm7-05', n: 5,  type: 'PM',      emoji: '🎙️', title: 'Custdev: 5 real intervyu',  sub: 'potensial foydalanuvchilar bilan', comp: PmLesson30 },
      { key: 'm7-06', n: 6,  type: 'PM',      emoji: '✂️', title: 'Tahlil + MVP chegarasi',    sub: 'qilamiz / qilmaymiz / keyinroq', comp: PmLesson31 },
      { key: 'm7-07', n: 7,  type: 'Kod',     emoji: '🏛️', title: 'Mini-MVP arxitekturasi',    sub: 'sxema: komponent, data, stack tanlovi', comp: MvpArchLesson },
      { key: 'm7-08', n: 8,  type: 'PM',      emoji: '📊', title: 'Analitika birinchi kundan', sub: 'Plausible / Umami — birinchi userdan oldin', comp: PmLesson32 },
      { key: 'm7-09', n: 9,  type: 'Proyekt', emoji: '🚧', title: 'MVP — 1: vibe coding',      sub: 'prioritet bo\'yicha asosiy ekran', comp: MvpBuild1Lesson },
      { key: 'm7-10', n: 10, type: 'PM',      emoji: '🎨', title: 'Dizayn va nasmotrennost',   sub: 'Dribbble, Behance — yaxshi UI nima', comp: PmLesson33 },
      { key: 'm7-11', n: 11, type: 'Proyekt', emoji: '🏁', title: 'MVP — 2: oxiriga yetkazish', sub: 'feature\'lar tayyor, MVP SHIP', comp: MvpBuild2Lesson },
      { key: 'm7-12', n: 12, type: 'PM',      emoji: '👀', title: 'Real odam bilan test',      sub: 'usability test — gapirma, kuzat', comp: PmLesson34 },
      { key: 'm7-13', n: 13, type: 'Proyekt', emoji: '🔁', title: 'Fidbek iteratsiyasi',       sub: 'eng kritik narsani tuzatamiz', comp: MvpIterateLesson },
      { key: 'm7-14', n: 14, type: 'PM',      emoji: '🎤', title: 'Pitch: muammo → yechim → foydalanuvchi', sub: 'real foydalanuvchi hikoyasi bilan' },
      { key: 'm7-15', n: 15, type: 'Rezerv',  emoji: '📅', title: 'Zaxira dars',               sub: 'yetib olish / sayqallash' },
      { key: 'm7-16', n: 16, type: 'Demo',    emoji: '🎤', title: 'Demo Day',                  sub: 'real foydalanuvchi zalda hozir bo\'ladi' },
    ],
  },
]

const ALL = MODULES.flatMap(m => m.lessons.map(l => ({ ...l, mod: m })))
const READY = ALL.filter(l => l.comp)

const TYPE = {
  Kod:     { color: '#019ACB', label: 'Kod' },
  PM:      { color: '#FF4F28', label: 'PM' },
  Proyekt: { color: '#1F7A4D', label: 'Proyekt' },
  Demo:    { color: '#7C3AED', label: 'Demo' },
  Rezerv:  { color: '#A7A6A2', label: 'Zaxira' },
}
const FILTERS = ['Hammasi', 'Kod', 'PM', 'Proyekt']

// Hash'dan joriy dars kalitini o'qiydi (#/lesson/KEY → KEY, aks holda null = bosh sahifa)
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

function LessonLoading() {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#F6F4EF', fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div className="lz-spin" style={{ width: 34, height: 34, margin: '0 auto 14px', borderRadius: '50%', border: '3px solid #E7E3DA', borderTopColor: '#FF4F28' }} />
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#5A5A60' }}>Dars yuklanmoqda…</p>
      </div>
      <style>{`@keyframes lzspin { to { transform: rotate(360deg) } } .lz-spin { animation: lzspin 0.8s linear infinite }`}</style>
    </div>
  )
}

export default function App() {
  const key = useRoute()
  const lesson = READY.find(l => l.key === key)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('Hammasi')

  useEffect(() => { window.scrollTo(0, 0) }, [key])

  const modules = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return MODULES.map(m => ({
      ...m,
      shown: m.lessons.filter(l => {
        if (filter !== 'Hammasi' && l.type !== filter) return false
        if (!needle) return true
        return (l.title + ' ' + l.sub + ' ' + m.title).toLowerCase().includes(needle)
      }),
    })).filter(m => m.shown.length > 0)
  }, [q, filter])

  if (lesson) {
    const C = lesson.comp
    return (
      <Suspense fallback={<LessonLoading />}>
        <C />
        <a href="#/" title="Bosh sahifa — boshqa darsni tanlash" aria-label="Bosh sahifa"
          style={{ position: 'fixed', bottom: 14, left: 14, zIndex: 950, width: 40, height: 40, borderRadius: 12, border: 'none', background: '#FFFFFF', color: '#5A5A60', fontSize: 19, lineHeight: '40px', textAlign: 'center', textDecoration: 'none', cursor: 'pointer', boxShadow: '0 6px 18px -6px rgba(58,53,48,0.35)', opacity: 0.55, transition: 'opacity 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = 1 }} onMouseLeave={e => { e.currentTarget.style.opacity = 0.55 }}>⌂</a>
      </Suspense>
    )
  }

  const counts = { Kod: 0, PM: 0, Proyekt: 0 }
  ALL.forEach(l => { if (counts[l.type] !== undefined) counts[l.type]++ })

  return (
    <div style={{ minHeight: '100dvh', background: '#F6F4EF', fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600&family=Manrope:wght@500;600;700;800&display=swap');
        .hp { max-width: 880px; margin: 0 auto; padding: clamp(28px,5vw,56px) 20px 80px; }
        .lz-card { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; background: #fff; border: none; border-radius: 14px; padding: 13px 16px; cursor: pointer; text-decoration: none; box-shadow: 0 5px 18px -12px rgba(58,53,48,0.22); transition: transform 0.16s, box-shadow 0.16s; }
        .lz-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -12px rgba(255,79,40,0.3); }
        .lz-card:hover .lz-arrow { color: #FF4F28; transform: translateX(4px); }
        .lz-card.soon { background: #FBFAF7; box-shadow: none; border: 1px dashed #E2DED4; cursor: default; }
        .lz-card.soon:hover { transform: none; box-shadow: none; }
        .lz-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 8px; background: #F6F4EF; color: #5A5A60; font-weight: 800; font-size: 12.5px; display: flex; align-items: center; justify-content: center; }
        .lz-chip { flex-shrink: 0; font-size: 10.5px; font-weight: 800; padding: 3px 9px; border-radius: 99px; letter-spacing: 0.02em; }
        .lz-grid { display: flex; flex-direction: column; gap: 8px; }
        .lz-nav { position: sticky; top: 0; z-index: 20; background: rgba(246,244,239,0.92); backdrop-filter: blur(8px); border-bottom: 1px solid #E7E3DA; }
        .lz-nav-in { max-width: 880px; margin: 0 auto; padding: 10px 20px; display: flex; gap: 6px; align-items: center; overflow-x: auto; }
        .lz-pill { flex-shrink: 0; font-size: 12.5px; font-weight: 800; padding: 6px 11px; border-radius: 9px; border: none; background: #fff; color: #5A5A60; cursor: pointer; text-decoration: none; transition: background 0.15s, color 0.15s; }
        .lz-pill:hover { background: #FF4F28; color: #fff; }
        .lz-pill.on { background: #0E0E10; color: #fff; }
        .lz-in { flex: 1; min-width: 120px; border: none; background: #fff; border-radius: 9px; padding: 7px 11px; font: 600 12.5px/1 'Manrope', system-ui, sans-serif; color: #0E0E10; outline: none; }
        .lz-in::placeholder { color: #A7A6A2; font-weight: 600; }
        .lz-mod { scroll-margin-top: 62px; margin-bottom: 30px; }
        @media (max-width: 620px) { .lz-card { gap: 10px; padding: 12px } .lz-chip { display: none } }
      `}</style>

      <nav className="lz-nav">
        <div className="lz-nav-in">
          {MODULES.map(m => <a key={m.id} className="lz-pill" href={`#${m.slug}`}>{m.id}</a>)}
          <span style={{ width: 1, height: 20, background: '#E2DED4', flexShrink: 0, margin: '0 4px' }} />
          {FILTERS.map(f => (
            <button key={f} className={`lz-pill${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
          <input className="lz-in" placeholder="Dars qidirish…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </nav>

      <div className="hp">
        <p style={{ margin: '0 0 6px', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FF4F28' }}>CoddyCamp · Senior 2026</p>
        <h1 style={{ margin: '0 0 8px', fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 'clamp(27px,4.4vw,40px)', color: '#0E0E10' }}>Barcha darslar — dastur tartibida</h1>
        <p style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 500, color: '#5A5A60', maxWidth: 620 }}>
          1-moduldan 7-modulgacha, CoddyCamp Senior 2026 dasturi bo'yicha. Darsni bosing — o'z manzili bor, sahifa yangilansa ham ochiq qoladi.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 34 }}>
          {[
            { v: READY.length, t: 'tayyor dars' },
            { v: counts.Kod, t: '💻 Kod' },
            { v: counts.Proyekt, t: '🛠 Proyekt' },
            { v: counts.PM, t: '🧭 PM' },
          ].map(s => (
            <span key={s.t} style={{ background: '#fff', borderRadius: 10, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, color: '#5A5A60', boxShadow: '0 4px 14px -10px rgba(58,53,48,0.3)' }}>
              <b style={{ color: '#0E0E10', fontWeight: 800 }}>{s.v}</b> {s.t}
            </span>
          ))}
        </div>

        {modules.length === 0 && (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#A7A6A2' }}>Hech narsa topilmadi — boshqa so'z bilan qidiring.</p>
        )}

        {modules.map(mod => (
          <section key={mod.id} id={mod.slug} className="lz-mod">
            <div style={{ margin: '0 2px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#FF4F28' }}>{mod.id}-MODUL</span>
                <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: 'clamp(18px,2.6vw,23px)', color: '#0E0E10' }}>{mod.title}</h2>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#A7A6A2' }}>· {mod.period} · {mod.lessons.length} dars</span>
              </div>
              <p style={{ margin: '5px 0 0', fontSize: 12.5, fontWeight: 600, color: '#5A5A60', fontStyle: 'italic' }}>💡 {mod.idea}</p>
            </div>
            <div className="lz-grid">
              {mod.shown.map(l => {
                const t = TYPE[l.type]
                const inner = (
                  <>
                    <span className="lz-num">{l.n}</span>
                    <span style={{ fontSize: 23, flexShrink: 0 }}>{l.emoji}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 'clamp(14px,1.9vw,16px)', color: l.comp ? '#0E0E10' : '#8A8880' }}>{l.title}</span>
                      <span style={{ display: 'block', marginTop: 1, fontSize: 12, fontWeight: 500, color: '#8A8880' }}>{l.sub}</span>
                    </span>
                    <span className="lz-chip" style={{ background: `${t.color}18`, color: t.color }}>{t.label}</span>
                    {l.comp
                      ? <span className="lz-arrow" style={{ fontSize: 17, color: '#A7A6A2', transition: 'transform 0.2s, color 0.2s', flexShrink: 0 }}>→</span>
                      : <span style={{ fontSize: 11, fontWeight: 700, color: '#C4C2BB', flexShrink: 0 }}>—</span>}
                  </>
                )
                return l.comp
                  ? <a key={l.key} className="lz-card" href={`#/lesson/${l.key}`}>{inner}</a>
                  : <div key={l.key} className="lz-card soon">{inner}</div>
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
