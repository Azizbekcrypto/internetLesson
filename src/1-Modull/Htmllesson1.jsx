import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';

// ============================================================
//  KOD COMPILATOR (HtmlCompiler) — ILGARI ./HtmlCompiler.jsx EDI,
//  endi LMS uchun shu faylga BIRLASHTIRILDI (bitta JSX). Nomlar
//  to'qnashmasligi uchun ichki T->HC_T, CODE->HC_CODE deb o'zgartirildi.
// ============================================================

// ============================================================
//  KOD COMPILATOR — mustaqil, qayta ishlatiladigan praktika ekrani
//  index.html + style.css + script.js — uchta fayl, tab bilan.
//  Chap yarmida kod editor (tablar), o'ng yarmida jonli natija (iframe).
//  Tepada shart + tekshiruvlar. Hammasi bajarilsa "Davom etish" yonadi.
//
//  TEKSHIRUV — HAQIQIY TAHLIL (regex emas):
//    • HTML  → DOMParser bilan real DOM: teg bor + ichi bo'sh emas + nesting
//    • CSS   → stylesheet parse: qaysi selektorga qaysi xossa/qiymat yozilgan
//    • JS    → manba (source) namunalari
//  Har shart muvaffaqiyatsiz bo'lsa — aniq MASLAHAT ko'rsatadi.
//
//  LMSga tayyor kontrakt (o'zgarmaydi):
//    <HtmlCompiler task={...} starterCode="..." onContinue={fn} onBack={fn} />
//  Kelajakda CSS/JS darslarida ham shu komponent ishlatiladi — task.files
//  orqali qaysi fayllar ko'rinishini va shartlarni belgilaysiz.
// ============================================================

const HC_T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4D26', accent2: '#FF8A3D', accentSoft: '#FFEDE5',
  success: '#0FA968', successSoft: '#E4F7EE', warn: '#9A5400', shadowBase: '58, 53, 48', line: '#E9E6DF',
};
const HC_CODE = { bg: '#0E1525', text: '#E7EAF2', gutter: '#1C2740' };

// ============================================================
//  TEKSHIRUV YORDAMCHILARI (builders)
//  Har biri ctx (kontekst) qabul qiladigan funksiya qaytaradi.
//  Funksiya:  true  → shart bajarildi
//             "..."  → bajarilmadi, qaytgan matn = o'quvchiga maslahat
//
//  ctx ichida nimalar bor:
//    ctx.html / ctx.css / ctx.js  — xom (raw) manba matnlar
//    ctx.doc                       — o'quvchi HTML'idan qurilgan real DOM
//    ctx.$  / ctx.$$               — doc bo'yicha querySelector / All
//    ctx.cssRules                  — [{selector, props:{...}}] — parslangan CSS
// ============================================================
const norm = (s) => (s || '').trim();

// JS izohlarini olib tashlaymiz — izoh ichidagi matn `js` shartini ALDAB
// o'tmasligi uchun (masalan starterdagi "// console.log ..." izohi).
// Oddiy yondashuv (blok + satr izohi) — o'quv praktikalari uchun yetarli.
const stripJsComments = (src) =>
  (src || '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // /* ... */
    .replace(/\/\/[^\n]*/g, ' ');      // // ...

const checks = {
  // Teg/selektor mavjudmi?
  has: (sel, hint) => (x) =>
    x.$(sel) ? true : (hint ?? `\`${sel}\` topilmadi`),

  // Mavjud VA ichida bo'sh bo'lmagan matn bormi?
  text: (sel, hint) => (x) => {
    const el = x.$(sel);
    if (!el) return hint ?? `\`${sel}\` topilmadi`;
    return norm(el.textContent) ? true : (hint ?? `\`${sel}\` bor, lekin ichi bo'sh — matn yozing`);
  },

  // Atribut bormi va bo'sh emasmi? (yoki equals bilan aniq qiymat)
  attr: (sel, attr, hint, equals) => (x) => {
    const el = x.$(sel);
    if (!el) return hint ?? `\`${sel}\` topilmadi`;
    const v = el.getAttribute(attr);
    if (v == null || !norm(v)) return hint ?? `\`${sel}\` da \`${attr}="..."\` to'ldiring`;
    if (equals != null && norm(v) !== norm(equals)) return hint ?? `\`${sel}\` da \`${attr}\` qiymati \`${equals}\` bo'lsin`;
    return true;
  },

  // Bir nechta atribut — hammasi bo'sh bo'lmasligi kerak
  attrs: (sel, attrList, hint) => (x) => {
    const el = x.$(sel);
    if (!el) return hint ?? `\`${sel}\` topilmadi`;
    const miss = attrList.filter((a) => !norm(el.getAttribute(a) || ''));
    return miss.length ? (hint ?? `\`${sel}\` da \`${miss.join('` va `')}\` to'ldiring`) : true;
  },

  // child element parent ichidami?
  nested: (parent, child, hint) => (x) =>
    x.$(`${parent} ${child}`) ? true : (hint ?? `\`${child}\` ni \`${parent}\` ichiga joylang`),

  // Kamida n ta bormi?
  count: (sel, n, hint) => (x) =>
    x.$$(sel).length >= n ? true : (hint ?? `Kamida ${n} ta \`${sel}\` kerak`),

  // CSS: selektorga shu xossa yozilganmi?
  cssProp: (selector, prop, hint) => (x) => {
    const hit = x.cssRules.some(
      (r) => r.selector.split(',').map(norm).includes(norm(selector)) && norm(r.props[prop])
    );
    return hit ? true : (hint ?? `\`${selector}\` uchun \`${prop}\` xossasini yozing`);
  },

  // CSS: selektorga shu xossa AYNAN shu qiymat bilan yozilganmi?
  cssValue: (selector, prop, val, hint) => (x) => {
    const hit = x.cssRules.some(
      (r) => r.selector.split(',').map(norm).includes(norm(selector)) && norm(r.props[prop]) === norm(val)
    );
    return hit ? true : (hint ?? `\`${selector}\` da \`${prop}: ${val}\` yozing`);
  },

  // JS: manbada namuna (regex) bormi? (izohlar hisobga olinmaydi)
  js: (re, hint) => (x) =>
    re.test(stripJsComments(x.js)) ? true : (hint ?? `Skriptda kerakli qism topilmadi`),

  // To'liq erkin tekshiruv: (ctx) => true | "maslahat"
  custom: (fn) => fn,

  // ── RUNTIME tekshiruvlar (kod iframe'da ishlatiladi) ──
  // Bular funksiya emas, "probe" obyekti qaytaradi — komponent ularni
  // iframe ichida ishlatib, natijani postMessage orqali oladi.

  // console.log chiqishida shu qiymat bormi?
  logs: (value, hint) => ({ __runtime: 'log_includes', value: String(value), hint }),

  // JS ifoda (masalan global o'zgaruvchi yoki typeof) shu qiymatga tengmi?
  evalEquals: (expr, expected, hint) => ({ __runtime: 'eval_equals', expr, expected: String(expected), hint }),

  // clickSel bosilgach, readSel matni expected'ni o'z ichiga oladimi?
  domAfterClick: (clickSel, readSel, expected, hint) =>
    ({ __runtime: 'click_text', clickSel, readSel, expected: String(expected), hint }),

  // ALMASHISH (toggle): clickSel ni ikki marta bosamiz.
  //   boshida readSel matni = textA, 1-bosishdan keyin = textB,
  //   2-bosishdan keyin yana = textA. Hammasi to'g'ri bo'lsa — haqiqiy toggle.
  toggle: (clickSel, readSel, textA, textB, hint) =>
    ({ __runtime: 'toggle', clickSel, readSel, textA: String(textA), textB: String(textB), hint }),
};

// ============================================================
//  DEKLARATIV SHARTLAR — oddiy data → check (tarjimon)
//  Dars yaratuvchi `C.has('form')` kabi kod yozmasdan, faqat data
//  bilan shart bera oladi: { tag: 'form', attrs: ['action'] }.
//  Istalgan teg/atribut ishlaydi — backend kerak emas, hammasi darsda.
//  Qo'llab-quvvatlanadigan kalitlar:
//    HTML:  { tag, text }                       → teg bor + ichi bo'sh emas
//           { tag, attr, equals? }              → atribut bor (yoki aniq qiymat)
//           { tag, attrs: ['src','alt'] }       → bir nechta atribut
//           { tag, child: 'input' }             → child teg ichidami (nested)
//           { tag, count: 3 }                   → kamida n ta
//    CSS:   { css: { sel, prop, value? } }      → xossa (yoki aniq qiymat)
//    JS:    { js: /addEventListener/ }          → manbada namuna
//    Runtime: { logs: 5 }                       → console.log chiqishi
//             { eval: 'typeof f', equals: 'function' }
//             { click: '#btn', read: '#out', expect: 'Salom' }
//  Har bir kalitga ixtiyoriy `hint` (maslahat matni) qo'shsa bo'ladi.
// ============================================================
function specToCheck(s) {
  const hint = s.hint;
  if (s.css) {
    const { sel, prop, value } = s.css;
    return value != null ? checks.cssValue(sel, prop, value, hint) : checks.cssProp(sel, prop, hint);
  }
  if (s.js) return checks.js(s.js instanceof RegExp ? s.js : new RegExp(s.js), hint);
  if (s.logs !== undefined) return checks.logs(s.logs, hint);
  if (s.eval !== undefined) return checks.evalEquals(s.eval, s.equals, hint);
  if (s.toggle) return checks.toggle(s.toggle, s.read || s.toggle, s.a, s.b, hint);
  if (s.click) return checks.domAfterClick(s.click, s.read, s.expect, hint);
  const sel = s.tag || s.sel;
  if (sel) {
    if (s.child || s.nested) return checks.nested(sel, s.child || s.nested, hint);
    if (s.count != null) return checks.count(sel, s.count, hint);
    if (Array.isArray(s.attrs)) return checks.attrs(sel, s.attrs, hint);
    if (s.attr) return checks.attr(sel, s.attr, hint, s.equals);
    if (s.text) return checks.text(sel, hint);
    return checks.has(sel, hint);
  }
  // Tanib bo'lmadi — yiqilmaydi, shunchaki bajarilmagan bo'lib qoladi
  return () => (hint ?? 'shart aniqlanmadi');
}

// Deklarativ shartdan o'qiladigan label avtomatik yasaymiz (label berilmasa)
function buildLabel(s) {
  if (s.css) return `CSS: ${s.css.sel} { ${s.css.prop}${s.css.value != null ? `: ${s.css.value}` : ''} }`;
  if (s.logs !== undefined) return `konsolda «${s.logs}»`;
  if (s.toggle) return `${s.a} ⇄ ${s.b}`;
  if (s.click) return `bosilsa «${s.expect}»`;
  if (s.eval !== undefined) return `${s.eval} = ${s.equals}`;
  if (s.js) return 'JS namunasi';
  const sel = s.tag || s.sel;
  if (sel) {
    if (s.child || s.nested) return `<${sel}> ichida <${s.child || s.nested}>`;
    if (Array.isArray(s.attrs)) return `<${sel}> — ${s.attrs.join(', ')}`;
    if (s.attr) return `<${sel}> — ${s.attr}`;
    if (s.count != null) return `kamida ${s.count} ta <${sel}>`;
    if (s.text) return `<${sel}> (matn bilan)`;
    return `<${sel}>`;
  }
  return 'shart';
}

// Shartni to'liq { id, label, check } shakliga keltiramiz.
// Eski uslub (check: C.has(...) / runtime obyekt / re:/.../) — tegmaymiz,
// faqat yetishmasa id/label to'ldiramiz. Deklarativ data bo'lsa — tarjima qilamiz.
function normalizeReq(req, i = 0) {
  const ready = typeof req.check === 'function' || (req.check && req.check.__runtime) || req.re;
  if (ready) return { id: req.id ?? `r${i}`, label: req.label ?? '', ...req };
  const check = specToCheck(req);
  const id = req.id ?? `${req.tag || req.sel || 'r'}${i}`;
  return { ...req, id, label: req.label ?? buildLabel(req), check };
}

// ============================================================
//  STANDART SHART (komponent yakka ishga tushganda)
// ============================================================
const DEFAULT_FILES = [
  { name: 'index.html', lang: 'html', starter: `<!-- Kodingizni shu yerga yozing -->
<h1>Mening sahifam</h1>
<p>Bu yerga o'zingiz haqingizda yozing.</p>
<img src="https://placehold.co/300x180" alt="rasm tavsifi">
` },
];

const DEFAULT_TASK = {
  eyebrow: 'Praktika',
  title: "O'z sahifangizni quring",
  brief:
    "Quyidagi shartlarni bajaring. Har biri bajarilganda yashil ✓ yonadi. Hammasi yashil bo'lsa — “Davom etish” ochiladi.",
  requirements: [
    { id: 'h1', label: '<h1> sarlavha (matn bilan)', check: checks.text('h1', "`<h1>` ichiga sarlavha matnini yozing") },
    { id: 'p', label: '<p> — matn (paragraf)', check: checks.text('p', "`<p>` ichiga bir-ikki gap yozing") },
    { id: 'img', label: '<img> — src va alt bilan', check: checks.attrs('img', ['src', 'alt'], "`<img>` da `src` va `alt` ikkalasini to'ldiring") },
  ],
};

// ============================================================
//  CSS'ni xavfsiz parslash — vaqtinchalik <style> orqali,
//  qiymatlarni oddiy obyektga ko'chirib olamiz (DOM'dan ajratamiz).
// ============================================================
function parseCss(css) {
  if (!css || !css.trim() || typeof document === 'undefined') return [];
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
  let rules = [];
  try {
    rules = [...(el.sheet?.cssRules || [])]
      .filter((r) => r.style) // faqat style qoidalari (media/keyframes emas)
      .map((r) => {
        const props = {};
        for (let i = 0; i < r.style.length; i++) {
          const p = r.style[i];
          props[p] = r.style.getPropertyValue(p);
        }
        return { selector: r.selectorText || '', props };
      });
  } catch { /* parse xatosi — bo'sh qaytadi */ }
  el.remove();
  return rules;
}

// ============================================================
//  HTML LINTER — sintaksis tekshiruvi (DOMParser kechirimchi,
//  bu esa qattiqqo'l). Yopilmagan teg, yopish typo'si, yopilmagan
//  tirnoq/izoh, noto'g'ri ichma-ichlikni ushlaydi.
//  Qaytaradi: [{ line, msg }]
// ============================================================
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// Yopish tegi IXTIYORIY bo'lgan elementlar (HTML brauzer o'zi yopadi).
// Bularni "yopilmagan" deb xato chiqarmaymiz — aks holda <li>, ketma-ket
// <p> kabi to'g'ri kod noto'g'ri qizil bo'lardi.
const OPTIONAL_CLOSE = new Set(['li', 'p', 'td', 'th', 'tr', 'dt', 'dd', 'option', 'thead', 'tbody', 'tfoot']);
const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul',
]);
// Yangi ochuvchi teg (open) stack tepasidagi (top) ixtiyoriy tegni yopadimi?
function closesOnOpen(open, top) {
  if (top === 'li') return open === 'li';
  if (top === 'p') return open === 'p' || BLOCK_TAGS.has(open);
  if (top === 'option') return open === 'option';
  if (top === 'td' || top === 'th') return open === 'td' || open === 'th' || open === 'tr';
  if (top === 'tr') return open === 'tr';
  if (top === 'dt' || top === 'dd') return open === 'dt' || open === 'dd';
  if (top === 'thead' || top === 'tbody' || top === 'tfoot') return open === 'tbody' || open === 'tfoot' || open === 'thead';
  return false;
}

function lintHtml(src) {
  const errors = [];
  if (!src) return errors;
  const stack = []; // { name, line }
  const n = src.length;
  let i = 0, line = 1, col = 1;
  const here = () => ({ line, col });
  const step = () => { if (src[i] === '\n') { line++; col = 1; } else { col++; } i++; };
  const skipTo = (idx) => { while (i < idx && i < n) step(); };

  while (i < n) {
    if (src[i] !== '<') { step(); continue; }
    const next = src[i + 1];

    // Izoh
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end === -1) { errors.push({ ...here(), msg: 'Izoh yopilmagan (`-->` yetishmayapti)' }); break; }
      skipTo(end + 3); continue;
    }
    // <!doctype ...> yoki deklaratsiya
    if (next === '!') {
      const end = src.indexOf('>', i);
      if (end === -1) { errors.push({ ...here(), msg: '`<! ... >` yopilmagan' }); break; }
      skipTo(end + 1); continue;
    }
    // Yopuvchi teg </...>
    if (next === '/') {
      const start = here();
      let j = i + 2, name = '';
      while (j < n && /[a-zA-Z0-9-]/.test(src[j])) { name += src[j]; j++; }
      while (j < n && src[j] !== '>') j++;
      if (j >= n) { errors.push({ line: start.line, msg: `Yopuvchi teg \`</${name}>\` to'liq emas (\`>\` yetishmayapti)` }); break; }
      const lname = name.toLowerCase();
      // Ixtiyoriy yopiladigan teglarni jimgina yopamiz (masalan </ul> ochiq <li>'ni yopadi)
      while (
        stack.length &&
        OPTIONAL_CLOSE.has(stack[stack.length - 1].name) &&
        stack[stack.length - 1].name !== lname &&
        stack.some((s, idx) => s.name === lname && idx < stack.length - 1)
      ) {
        stack.pop();
      }
      if (stack.length === 0) {
        errors.push({ line: start.line, msg: `Ortiqcha yopuvchi teg \`</${name}>\` — mos ochuvchi yo'q` });
      } else {
        const top = stack[stack.length - 1];
        if (top.name === lname) {
          stack.pop();
        } else {
          const idx = stack.map((s) => s.name).lastIndexOf(lname);
          if (idx === -1) {
            errors.push({ line: start.line, msg: `\`</${name}>\` mos ochuvchi tegga ega emas (xato yoki typo)` });
          } else {
            errors.push({ line: top.line, msg: `\`<${top.name}>\` yopilmagan — \`</${top.name}>\` kutilgan, \`</${name}>\` keldi` });
            stack.length = idx;
          }
        }
      }
      skipTo(j + 1); continue;
    }
    // Ochuvchi teg <...>
    if (/[a-zA-Z]/.test(next || '')) {
      const start = here();
      let j = i + 1, name = '';
      while (j < n && /[a-zA-Z0-9-]/.test(src[j])) { name += src[j]; j++; }
      let selfClose = false, closed = false, quote = null, strayLt = false;
      while (j < n) {
        const c = src[j];
        if (quote) { if (c === quote) quote = null; j++; continue; }
        if (c === '"' || c === "'") { quote = c; j++; continue; }
        if (c === '<') { strayLt = true; break; }
        if (c === '/' && src[j + 1] === '>') { selfClose = true; closed = true; j += 2; break; }
        if (c === '>') { closed = true; j++; break; }
        j++;
      }
      if (quote && j >= n) { errors.push({ line: start.line, msg: `\`<${name}>\` ichida tirnoq (${quote}) yopilmagan` }); break; }
      if (strayLt) {
        errors.push({ line: start.line, msg: `\`<${name}\` tegi \`>\` bilan yopilmagan` });
        skipTo(j); continue; // '<' dan qayta boshlaymiz
      }
      if (!closed && j >= n) { errors.push({ line: start.line, msg: `\`<${name}\` tegi \`>\` bilan yopilmagan` }); break; }
      const lname = name.toLowerCase();
      // Ochuvchi teg stack tepasidagi ixtiyoriy tegni yopsa — jimgina yopamiz
      while (stack.length && closesOnOpen(lname, stack[stack.length - 1].name)) stack.pop();
      if (!selfClose && !VOID_TAGS.has(lname)) stack.push({ name: lname, line: start.line });
      skipTo(j); continue;
    }
    // '<' dan keyin harf/`/`/`!` emas → matn deb qaraladi (brauzer ham shunday)
    step();
  }
  // Oxirida ochiq qolgan teglar (ixtiyoriy yopiladiganlardan tashqari)
  for (const t of stack) {
    if (OPTIONAL_CLOSE.has(t.name)) continue;
    errors.push({ line: t.line, msg: `\`<${t.name}>\` ochiq qoldi — \`</${t.name}>\` bilan yoping` });
  }
  return errors;
}

// Bitta shartni ishga tushiramiz → { ok, hint }
function runOne(req, ctx) {
  try {
    // Runtime probe — bu yerda emas, iframe'da tekshiriladi (placeholder)
    if (req.check && req.check.__runtime) {
      return { ok: false, hint: 'ishga tushirilmoqda…', runtime: true };
    }
    if (typeof req.check === 'function') {
      const r = req.check(ctx);
      if (r === true) return { ok: true, hint: null };
      return { ok: false, hint: typeof r === 'string' ? r : (req.hint || null) };
    }
    // Eski uslub: regex (orqaga moslik). Izohlarni olib tashlab tekshiramiz.
    if (req.re) {
      const ok = req.re.test((ctx.html || '').replace(/<!--[\s\S]*?-->/g, ''));
      return { ok, hint: ok ? null : (req.hint || null) };
    }
    return { ok: false, hint: null };
  } catch {
    return { ok: false, hint: 'tekshirishda xatolik' };
  }
}

// ============================================================
//  RUNTIME HARNESS — iframe ichida ishlaydigan kod.
//  console.log'ni ushlaydi, probe'larni bajaradi, natijani
//  postMessage bilan ota-oynaga (parent) yuboradi. Xavfsiz:
//  sandbox buzilmaydi, faqat bool natijalar uzatiladi.
// ============================================================
const CONSOLE_CAPTURE = `<script>
window.__logs=[];
(function(){var _l=console.log;console.log=function(){
  for(var i=0;i<arguments.length;i++){var a=arguments[i];
    try{window.__logs.push(typeof a==='object'?JSON.stringify(a):String(a));}catch(e){window.__logs.push(String(a));}}
  try{_l.apply(console,arguments);}catch(e){}
};})();
<\/script>`;

// KO'RINADIGAN konsol uchun: console.log/info/warn/error va xatolarni
// ota-oynaga (parent) postMessage bilan uzatadi → UI'da chiqaramiz.
// nonce — eski va yangi natijalar aralashmasligi uchun.
const CONSOLE_FORWARD = (nonce) => `<script>
(function(){
  var N=${JSON.stringify(nonce)};
  function fmt(a){try{return typeof a==='object'?JSON.stringify(a):String(a);}catch(e){return String(a);}}
  function send(level,args){
    var parts=[];for(var i=0;i<args.length;i++)parts.push(fmt(args[i]));
    try{parent.postMessage({__hcConsole:true,nonce:N,level:level,text:parts.join(' ')},'*');}catch(e){}
  }
  ['log','info','warn','error'].forEach(function(m){
    var _o=console[m]?console[m].bind(console):function(){};
    console[m]=function(){send(m,arguments);try{_o.apply(null,arguments);}catch(e){}};
  });
  window.addEventListener('error',function(e){send('error',[e.message]);});
})();
<\/script>`;

const buildHarness = (probes, nonce) => `<script>
(function(){
  function runProbes(){
    var P=${JSON.stringify(probes)};
    var logs=window.__logs||[];
    var joined=logs.join(' ');
    var out={};
    for(var k=0;k<P.length;k++){
      var p=P[k],ok=false;
      try{
        if(p.type==='log_includes'){
          var v=String(p.value).trim();
          ok=joined.indexOf(v)!==-1||logs.some(function(l){return String(l).trim().indexOf(v)!==-1;});
        }else if(p.type==='eval_equals'){
          var r; try{r=eval(p.expr);}catch(e){r=undefined;}
          ok=String(r)===String(p.expected);
        }else if(p.type==='click_text'){
          var exp=String(p.expected);
          var t0=document.querySelector(p.readSel);
          var before=t0?t0.textContent:'';
          var b=document.querySelector(p.clickSel);
          if(b){try{b.click();}catch(e){}}
          var t1=document.querySelector(p.readSel);
          var after=t1?t1.textContent:'';
          // Matn bosishdan KEYIN paydo bo'lishi kerak (oldin bo'lmagan) — JS'siz o'tmaydi
          ok=after.indexOf(exp)!==-1 && before.indexOf(exp)===-1;
        }else if(p.type==='toggle'){
          var A=String(p.textA).toLowerCase().trim();
          var B=String(p.textB).toLowerCase().trim();
          var rd=function(){var e=document.querySelector(p.readSel);return (e?e.textContent:'').toLowerCase();};
          var b2=document.querySelector(p.clickSel);
          var s0=rd();
          var startOk=s0.indexOf(A)!==-1 && s0.indexOf(B)===-1; // boshida A
          if(b2){try{b2.click();}catch(e){}}
          var s1=rd();
          var firstOk=s1.indexOf(B)!==-1 && s1.indexOf(A)===-1; // 1-bosish -> B
          if(b2){try{b2.click();}catch(e){}}
          var s2=rd();
          var secondOk=s2.indexOf(A)!==-1 && s2.indexOf(B)===-1; // 2-bosish -> A
          ok=startOk && firstOk && secondOk;
        }
      }catch(e){ok=false;}
      out[p.id]=ok;
    }
    try{parent.postMessage({__hcReport:true,nonce:${JSON.stringify(nonce)},results:out},'*');}catch(e){}
  }
  // 'load' hodisasidan keyin ishga tushiramiz — o'quvchi handler'ni
  // window.onload / addEventListener('load') ichida ulagan bo'lsa ham ulgursin.
  function start(){ setTimeout(runProbes, 50); }
  if(document.readyState==='complete') start();
  else window.addEventListener('load', start);
})();
<\/script>`;

// Foydalanuvchi 3 faylini bitta jonli HTML hujjatga birlashtiramiz
const baseStyle = `
  *{box-sizing:border-box}
  body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;padding:24px;color:#13141A;line-height:1.6;background:#fff}
  h1{font-family:Georgia,serif;margin:0 0 12px;letter-spacing:-.01em}
  img{max-width:100%;border-radius:12px;display:block;margin:10px 0}
  p{margin:0 0 12px}
  li:empty{display:none}`;

const wrapDoc = (html, css, js, opts = {}) => `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<style>${baseStyle}
${css || ''}</style>
${opts.capture ? CONSOLE_CAPTURE : ''}
${opts.consoleNonce != null ? CONSOLE_FORWARD(opts.consoleNonce) : ''}
</head>
<body>
${html || ''}
<script>${js || ''}<\/script>
${opts.harness || ''}
</body>
</html>`;

function HtmlCompiler({
  task = DEFAULT_TASK,
  starterCode,            // eski kontrakt: bitta HTML fayl uchun starter
  onContinue,
  onBack,
}) {
  // Shartlarni bir marta normalizatsiya: deklarativ data ham, eski C.has(...)
  // uslubi ham bir xil { id, label, check } shaklga keladi. Quyidagi butun
  // kod (runtimeProbes, results, merged, render) o'zgarmaydi.
  const reqs = useMemo(
    () => (task.requirements || []).map((r, i) => normalizeReq(r, i)),
    [task.requirements]
  );

  // Fayllar: task.files bo'lsa o'shani, bo'lmasa eski yakka HTML faylni ishlatamiz
  const files = useMemo(() => {
    if (task.files && task.files.length) return task.files;
    const single = { ...DEFAULT_FILES[0] };
    if (starterCode != null) single.starter = starterCode;
    return [single];
  }, [task.files, starterCode]);

  const [codes, setCodes] = useState(() =>
    Object.fromEntries(files.map((f) => [f.name, f.starter ?? '']))
  );
  const [active, setActive] = useState(files[0].name);
  const taRef = useRef(null);

  // Til bo'yicha matnni olish (birlashtirilgan preview uchun)
  const byLang = (lang) => {
    const f = files.find((ff) => ff.lang === lang);
    return f ? (codes[f.name] ?? '') : '';
  };
  const html = byLang('html'), css = byLang('css'), js = byLang('js');

  // Runtime shartlar (iframe'da ishlatib tekshiriladi)
  const runtimeProbes = useMemo(
    () => reqs.filter((r) => r.check && r.check.__runtime)
      .map((r) => ({ id: r.id, type: r.check.__runtime, ...r.check })),
    [reqs]
  );
  const hasRuntime = runtimeProbes.length > 0;
  const nonceRef = useRef(0);
  const [runtimeResults, setRuntimeResults] = useState({});

  // ── KO'RINADIGAN KONSOL — JS fayli bo'lsa ko'rsatamiz (console.log natijasi) ──
  const showConsole = useMemo(() => files.some((f) => f.lang === 'js'), [files]);
  const consoleNonceRef = useRef(0);
  const [consoleLines, setConsoleLines] = useState([]);

  // Ko'rinadigan preview — HECH QACHON tekshiruv tomonidan o'zgartirilmaydi
  const [doc, setDoc] = useState(() => wrapDoc(html, css, js));
  // Tekshiruv hujjati — alohida YASHIRIN iframe'da ishlaydi (tugmani bosadi,
  // DOMni o'zgartiradi — lekin foydalanuvchi buni ko'rmaydi)
  const [checkDoc, setCheckDoc] = useState('');
  // Jonli natijani debounce bilan yangilaymiz (har bosishda emas)
  useEffect(() => {
    const id = setTimeout(() => {
      const cn = showConsole ? ++consoleNonceRef.current : null;
      if (showConsole) setConsoleLines([]); // yangi ishga tushishda konsol tozalanadi
      setDoc(wrapDoc(html, css, js, cn != null ? { consoleNonce: cn } : {}));
      if (hasRuntime) {
        const nonce = ++nonceRef.current;
        setRuntimeResults({}); // kutish holatiga qaytaramiz
        setCheckDoc(wrapDoc(html, css, js, { capture: true, harness: buildHarness(runtimeProbes, nonce) }));
      }
    }, 300);
    return () => clearTimeout(id);
  }, [html, css, js, hasRuntime, runtimeProbes, showConsole]);

  // iframe'dan kelgan runtime natijalarni qabul qilamiz (faqat oxirgi nonce)
  useEffect(() => {
    if (!hasRuntime) return;
    const onMsg = (e) => {
      const d = e.data;
      if (d && d.__hcReport && d.nonce === nonceRef.current) {
        setRuntimeResults(d.results || {});
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [hasRuntime]);

  // Preview iframe'dan kelgan console.log xabarlarini yig'amiz (faqat oxirgi nonce)
  useEffect(() => {
    if (!showConsole) return;
    const onMsg = (e) => {
      const d = e.data;
      if (d && d.__hcConsole && d.nonce === consoleNonceRef.current) {
        setConsoleLines((prev) => (prev.length >= 200 ? prev : [...prev, { level: d.level, text: d.text }]));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [showConsole]);

  // ── TEKSHIRUV: real tahlil, sinxron, xavfsiz (iframe'ga tegmaydi) ──
  const results = useMemo(() => {
    const parsed = new DOMParser().parseFromString(html || '', 'text/html');
    const ctx = {
      html, css, js,
      doc: parsed,
      $: (s) => { try { return parsed.querySelector(s); } catch { return null; } },
      $$: (s) => { try { return [...parsed.querySelectorAll(s)]; } catch { return []; } },
      cssRules: parseCss(css),
    };
    return reqs.map((r) => runOne(r, ctx));
  }, [html, css, js, reqs]);

  // ── SINTAKSIS: HTML linter (DOMParser ushlamaydigan xatolarni tutadi) ──
  const htmlErrors = useMemo(() => lintHtml(html), [html]);
  const hasSyntaxError = htmlErrors.length > 0;

  // Sinxron + runtime natijalarni birlashtiramiz
  const merged = reqs.map((r, i) => {
    if (r.check && r.check.__runtime) {
      const got = runtimeResults[r.id];
      if (got === undefined) return { ok: false, hint: 'ishga tushirilmoqda…' };
      return { ok: !!got, hint: got ? null : (r.check.hint || 'natija kutilgancha emas') };
    }
    return results[i];
  });

  const passedCount = merged.filter((r) => r.ok).length;
  const allPassed = reqs.length > 0 && passedCount === reqs.length && !hasSyntaxError;
  const firstHint = merged.find((r) => !r.ok && r.hint)?.hint;

  const setActiveCode = (val) => setCodes((prev) => ({ ...prev, [active]: val }));

  // Tab tugmasi 2 bo'sh joy qo'shsin
  const onKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const s = el.selectionStart, en = el.selectionEnd;
      const cur = codes[active] ?? '';
      const next = cur.slice(0, s) + '  ' + cur.slice(en);
      setActiveCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
  };

  const runNow = () => {
    const cn = showConsole ? ++consoleNonceRef.current : null;
    if (showConsole) setConsoleLines([]);
    setDoc(wrapDoc(html, css, js, cn != null ? { consoleNonce: cn } : {}));
  };
  const reset = () => setCodes(Object.fromEntries(files.map((f) => [f.name, f.starter ?? ''])));

  return (
    <div className="hc-root">
      <StyleTag />

      {/* ── Tepa: shart (markazda) ── */}
      <header className="hc-top">
        {task.eyebrow && <span className="hc-eyebrow">{task.eyebrow}</span>}
        <h1 className="hc-title">{task.title}</h1>
        {task.brief && <p className="hc-brief">{task.brief}</p>}
        <div className="hc-checklist">
          <span className="hc-count">{passedCount}/{reqs.length}</span>
          {reqs.map((r, i) => (
            <span key={r.id} className={`hc-chip ${merged[i]?.ok ? 'ok' : ''}`} title={merged[i]?.hint || ''}>
              <span className="hc-dot">{merged[i]?.ok ? '✓' : i + 1}</span>
              {r.label}
            </span>
          ))}
        </div>
        {hasSyntaxError ? (
          <div className="hc-errors">
            {htmlErrors.slice(0, 3).map((e, k) => (
              <span key={k} className="hc-err">⚠ Sintaksis · qator {e.line}: {e.msg}</span>
            ))}
            {htmlErrors.length > 3 && <span className="hc-err">… va yana {htmlErrors.length - 3} ta xato</span>}
          </div>
        ) : (!allPassed && firstHint && (
          <p className="hc-hint">💡 {firstHint}</p>
        ))}
      </header>

      {/* ── O'rta: editor | natija ── */}
      <main className="hc-split">
        <section className="hc-pane hc-editor-pane">
          <div className="hc-pane-bar hc-tabs-bar">
            <span className="hc-dots"><i /><i /><i /></span>
            <div className="hc-tabs">
              {files.map((f) => (
                <button
                  key={f.name}
                  className={`hc-tab ${active === f.name ? 'active' : ''}`}
                  onClick={() => setActive(f.name)}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <button className="hc-mini" onClick={runNow} title="Ishga tushirish">▶ Ishga tushirish</button>
          </div>
          <textarea
            ref={taRef}
            className="hc-code"
            value={codes[active] ?? ''}
            onChange={(e) => setActiveCode(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Kodingizni shu yerga yozing…"
          />
        </section>

        <section className="hc-pane hc-preview-pane">
          <div className="hc-pane-bar">
            <span className="hc-pane-name">📺 Natija</span>
            <span className="hc-live">jonli</span>
          </div>
          <iframe
            className="hc-frame"
            title="natija"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            srcDoc={doc}
          />
          {showConsole && (
            <div className="hc-console">
              <div className="hc-console-bar">
                <span className="hc-console-title">🖥️ Console</span>
                {consoleLines.length > 0 && (
                  <button className="hc-console-clear" onClick={() => setConsoleLines([])}>tozalash</button>
                )}
              </div>
              <div className="hc-console-body">
                {consoleLines.length === 0 ? (
                  <div className="hc-console-empty">console.log(...) natijasi shu yerda chiqadi</div>
                ) : (
                  consoleLines.map((l, i) => (
                    <div key={i} className={`hc-console-line lvl-${l.level}`}>
                      <span className="hc-console-caret">›</span>
                      <span className="hc-console-text">{l.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Yashirin tekshiruv iframe'i — probe'lar shu yerda ishlaydi (tugmani
          bosadi, DOMni o'zgartiradi), foydalanuvchi ko'radigan preview esa toza qoladi */}
      {hasRuntime && (
        <iframe
          aria-hidden="true"
          tabIndex={-1}
          title="tekshiruv"
          sandbox="allow-scripts"
          srcDoc={checkDoc}
          style={{ position: 'fixed', left: '-9999px', top: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 'none' }}
        />
      )}

      {/* ── Past: harakatlar ── */}
      <footer className="hc-bottom">
        {onBack && <button className="hc-ghost" onClick={onBack}>← Orqaga</button>}
        <button className="hc-ghost" onClick={reset}>Qaytadan</button>
        <div className="hc-status">
          {allPassed
            ? <span className="hc-ok-msg">✓ Barcha shartlar bajarildi!</span>
            : <span className="hc-wait-msg">Shartlarni bajaring — natija o'ngda ko'rinadi</span>}
        </div>
        <button
          className="hc-next"
          disabled={!allPassed}
          onClick={() => allPassed && onContinue && onContinue({ codes, code: html })}
        >
          Davom etish →
        </button>
      </footer>
    </div>
  );
}

function StyleTag() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
      .hc-root,.hc-root *{box-sizing:border-box}
      .hc-root{font-family:'Manrope',system-ui,sans-serif;color:${HC_T.ink};background:
        radial-gradient(120% 80% at 50% -10%, ${HC_T.accentSoft} 0%, rgba(255,237,229,0) 46%),
        ${HC_T.bg};
        height:100dvh;display:flex;flex-direction:column;justify-content:center;gap:clamp(12px,1.8vw,18px);padding:clamp(16px,2.4vw,30px);overflow:hidden;-webkit-font-smoothing:antialiased;width:100%;max-width:1160px;margin:0 auto}

      .hc-top{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px}
      .hc-eyebrow{font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:800;color:${HC_T.accent};display:inline-flex;align-items:center;gap:7px}
      .hc-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:${HC_T.accent}}
      .hc-title{font-family:Georgia,serif;font-size:clamp(22px,3vw,32px);margin:0;color:${HC_T.ink};font-weight:600;letter-spacing:-.015em;line-height:1.12}
      .hc-brief{margin:0;color:${HC_T.ink2};font-size:clamp(13px,1.5vw,15px);line-height:1.55;max-width:60ch}

      .hc-checklist{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:6px}
      .hc-count{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;color:#fff;background:linear-gradient(135deg,${HC_T.accent},${HC_T.accent2});padding:6px 11px;border-radius:99px;box-shadow:0 6px 16px -6px rgba(255,77,38,.5)}
      .hc-chip{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:${HC_T.ink2};background:${HC_T.paper};padding:6px 14px 6px 7px;border-radius:99px;border:1px solid ${HC_T.line};box-shadow:0 1px 2px rgba(${HC_T.shadowBase},.04);transition:all .22s ease;cursor:default}
      .hc-chip.ok{color:${HC_T.ink};font-weight:600;border-color:${HC_T.success}40;background:${HC_T.successSoft}}
      .hc-dot{flex-shrink:0;width:21px;height:21px;border-radius:50%;background:${HC_T.bg};color:${HC_T.ink3};display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:all .25s}
      .hc-chip.ok .hc-dot{background:${HC_T.success};color:#fff;box-shadow:0 3px 8px -2px ${HC_T.success}88}
      .hc-hint{margin:3px 0 0;font-size:13px;color:${HC_T.warn};background:#FFF6EA;border:1px solid #F4DFBC;padding:8px 15px;border-radius:11px;max-width:60ch;line-height:1.5}
      .hc-errors{display:flex;flex-direction:column;gap:5px;align-items:center;margin:3px 0 0}
      .hc-err{font-size:12.5px;color:#C01024;background:#FDECEC;border:1px solid #F6CFCF;padding:7px 14px;border-radius:10px;font-family:'JetBrains Mono',monospace;max-width:74ch;line-height:1.5}

      .hc-split{flex:none;height:62vh;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,1.6vw,18px)}
      .hc-pane{display:flex;flex-direction:column;min-height:0;border-radius:18px;overflow:hidden;background:${HC_T.paper};box-shadow:0 1px 0 ${HC_T.line},0 18px 40px -22px rgba(${HC_T.shadowBase},.35)}
      .hc-pane-bar{display:flex;align-items:center;gap:10px;padding:10px 15px;font-size:12px;font-weight:600;color:${HC_T.ink2}}
      .hc-editor-pane .hc-pane-bar{background:${HC_CODE.bg};color:#A7B6D6;border-bottom:1px solid rgba(255,255,255,.06)}
      .hc-preview-pane .hc-pane-bar{background:${HC_T.paper};border-bottom:1px solid ${HC_T.line}}
      .hc-dots{display:inline-flex;gap:6px;flex-shrink:0}
      .hc-dots i{width:11px;height:11px;border-radius:50%;background:#3A4760;display:block}
      .hc-dots i:nth-child(1){background:#ff5f56}.hc-dots i:nth-child(2){background:#ffbd2e}.hc-dots i:nth-child(3){background:#27c93f}
      .hc-pane-name{font-family:'JetBrains Mono',monospace;font-weight:700}
      .hc-live{margin-left:auto;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:${HC_T.success};background:${HC_T.successSoft};padding:4px 9px;border-radius:99px;font-weight:800;display:inline-flex;align-items:center;gap:6px}
      .hc-live::before{content:"";width:6px;height:6px;border-radius:50%;background:${HC_T.success};animation:hc-pulse 1.8s infinite}
      @keyframes hc-pulse{0%{box-shadow:0 0 0 0 ${HC_T.success}66}70%{box-shadow:0 0 0 6px ${HC_T.success}00}100%{box-shadow:0 0 0 0 ${HC_T.success}00}}

      .hc-tabs{display:flex;gap:4px;overflow:hidden}
      .hc-tab{background:transparent;border:none;color:#7E92B4;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;padding:6px 13px;border-radius:9px;cursor:pointer;transition:all .15s;white-space:nowrap}
      .hc-tab:hover{color:#cfe0ff;background:rgba(255,255,255,.06)}
      .hc-tab.active{color:#fff;background:rgba(255,255,255,.14);box-shadow:inset 0 -2px 0 ${HC_T.accent}}
      .hc-mini{margin-left:auto;background:linear-gradient(135deg,${HC_T.accent},${HC_T.accent2});color:#fff;border:none;border-radius:9px;padding:6px 13px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:'Manrope',sans-serif;transition:all .18s;flex-shrink:0;box-shadow:0 6px 14px -6px rgba(255,77,38,.6)}
      .hc-mini:hover{transform:translateY(-1px);box-shadow:0 9px 18px -6px rgba(255,77,38,.7)}
      .hc-mini:active{transform:translateY(0)}

      .hc-code{flex:1;min-height:0;resize:none;border:none;outline:none;background:${HC_CODE.bg};color:${HC_CODE.text};font-family:'JetBrains Mono',monospace;font-size:14px;line-height:1.7;padding:18px 20px;tab-size:2;white-space:pre;overflow:auto;caret-color:${HC_T.accent2}}
      .hc-code::placeholder{color:#5B6B86}
      .hc-code::selection{background:${HC_T.accent}55}

      .hc-frame{flex:1;min-height:0;width:100%;border:none;background:#fff}

      .hc-console{flex-shrink:0;height:34%;min-height:96px;display:flex;flex-direction:column;background:${HC_CODE.bg};border-top:1px solid rgba(255,255,255,.07)}
      .hc-console-bar{display:flex;align-items:center;gap:8px;padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#7E92B4;border-bottom:1px solid rgba(255,255,255,.06)}
      .hc-console-title{font-family:'JetBrains Mono',monospace}
      .hc-console-clear{margin-left:auto;background:rgba(255,255,255,.08);color:#cfe0ff;border:none;border-radius:7px;padding:4px 10px;font-size:10.5px;font-weight:600;cursor:pointer;text-transform:none;letter-spacing:0;font-family:'Manrope',sans-serif;transition:all .15s}
      .hc-console-clear:hover{background:${HC_T.accent};color:#fff}
      .hc-console-body{flex:1;min-height:0;overflow:auto;padding:6px 0;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.6}
      .hc-console-empty{color:#5B6B86;padding:4px 15px;font-style:italic}
      .hc-console-line{display:flex;gap:8px;padding:2px 15px;color:#E7EAF2;border-bottom:1px solid rgba(255,255,255,.03);white-space:pre-wrap;word-break:break-word}
      .hc-console-caret{color:#27c93f;flex-shrink:0;font-weight:700}
      .hc-console-line.lvl-warn{color:#FFD380;background:rgba(255,189,46,.08)}
      .hc-console-line.lvl-error{color:#ff8a7a;background:rgba(255,95,86,.1)}
      .hc-console-line.lvl-error .hc-console-caret{color:#ff5f56}

      .hc-bottom{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
      .hc-ghost{background:transparent;border:1px solid transparent;color:${HC_T.ink2};font-family:'Manrope',sans-serif;font-weight:600;font-size:14px;cursor:pointer;padding:11px 17px;border-radius:12px;transition:all .15s}
      .hc-ghost:hover{background:${HC_T.paper};color:${HC_T.ink};border-color:${HC_T.line};box-shadow:0 6px 16px -10px rgba(${HC_T.shadowBase},.3)}
      .hc-status{margin-left:auto}
      .hc-ok-msg{color:${HC_T.success};font-weight:700;font-size:14px}
      .hc-wait-msg{color:${HC_T.ink3};font-size:13px}
      .hc-next{background:linear-gradient(135deg,${HC_T.accent},${HC_T.accent2});color:#fff;border:none;border-radius:13px;font-family:'Manrope',sans-serif;font-weight:800;font-size:15px;cursor:pointer;padding:13px 30px;box-shadow:0 10px 24px -8px rgba(255,77,38,.6);transition:all .2s}
      .hc-next:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 32px -8px rgba(255,77,38,.7)}
      .hc-next:active:not(:disabled){transform:translateY(0)}
      .hc-next:disabled{background:#D7D8DE;color:#fff;cursor:not-allowed;box-shadow:none}

      @media (max-width:820px){
        .hc-split{grid-template-columns:1fr;grid-template-rows:1fr 1fr}
        .hc-checklist{width:100%}
      }
    `}</style>
  );
}

// Dars shartlarida ishlatiladigan qisqa alias (ilgari `checks as C`)
const C = checks;


// ============================================================
// HTML 1-DARS — PLATFORM STANDARD v15 (Notion: design_system + platform_contract + infrastructure_v1)
// Arxitektura va asosiy dizayn — Notiondan. 17 ekran bizning kontentimiz.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// Eslatma: ekran-spetsifik widget bezaklari page-by-page bosqichida yakuniy sayqal oladi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', link: '#1a56db',
  shadowBase: '58, 53, 48'
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
// Praktika-tugadi signali: o'quvchi kod mashqini bajarib bo'lgach 500+screenIdx ga yoziladi.
// 500+ diapazon — DARS testlari (<100) va Mustahkamlash/quiz (100+, aniq indeks bilan
// o'qiladi) bilan to'qnashmaydi; faqat mentorning praktika paneli aniq indeks bilan o'qiydi.
const PRACTICE_DONE_BASE = 500;

const LiveGateCtx = createContext(null);
const AchCtx = createContext(null); // 🏅 olingan nishonlar (Set) — Stage hisoblagichi uchun

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
      // Javob kalitini serverga avto-yuklash (mentor-kod bilan) — server-baholash uchun SHART.
      // Busiz server javoblarni kalitsiz baholaydi va hammasini «xato» deb hisoblaydi (podium 0/5).
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

const LESSON_META = { lessonId: 'html-01-v17', lessonTitle: { uz: 'HTML asoslari', ru: 'Основы HTML' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5b', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'test',        template: 'custom',   scored: true,  scope: 'module-mikro' },
  { id: 's8',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's15b', type: 'stats',      template: 'custom',   scored: false, scope: null },
  { id: 'sflash', type: 'review',   template: 'custom',   scored: false, scope: null },
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
      <button className={`ach-counter ${bump ? 'bump' : ''} ${count > 0 ? 'has' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Nishonlar" title="Nishonlaringiz">
        <span className="ach-cnt-ic">🏅</span><b>{count}</b><span className="ach-cnt-tot">/{total}</span>
      </button>
      {open && (
        <div className="ach-pop" onMouseLeave={() => setOpen(false)}>
          <div className="ach-pop-h">🏅 Nishonlar — {count}/{total}</div>
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
  const [mForced, setMForced] = useState(false); // ekran majburan yopishi mumkin (desktopda ham)
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); setMForced(false); }, [screen]); // har ekranda Mentor ochiq holatdan boshlanadi
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
    <MentorCtx.Provider value={{ enabled: collapseOn, collapsed: mCollapsed, setCollapsed, forced: mForced, setForced: setMForced }}>
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
// RECAPS kontenti — Stage 4'da JS-intro testlariga to'ldiriladi (hozircha bo'sh)
const RECAPS = {};

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
  // «To'g'ri» sanog'ini ustunlar bilan BIR XIL mantiqdan olamiz (picked === correctIdx),
  // serverdagi eskirishi mumkin bo'lgan `a.correct` boolean'iga tayanmaymiz — aks holda
  // pastdagi ustun «to'g'ri javobda 1 o'quvchi», yuqoridagi sanoq esa «1 xato» deb zid chiqadi.
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

// ===== MENTOR PRAKTIKA PANELI — jonli darsda kod mashqi uchun =====
// Oqim: mentor "Davom etish" bosadi → o'quvchilar OCHILADI va o'z qurilmasida mashqni
// yozadi; mentor bu panelda kim tugatganini JONLI kuzatadi. Ko'pchilik tugagach —
// mentor «🖊 Doskada yozib ko'rsatish» bilan AYNAN shu mashqni proyektorda yozib beradi.
// Shunday qilib: avval o'quvchilar mustaqil yozadi, keyin mentor birga yechib tushuntiradi.
function MentorPracticeOverlay({ entry, live, onClose }) {
  const [view, setView] = useState('watch'); // 'watch' | 'demo'
  const [data, setData] = useState({ players: null, rows: [] });
  const doneIdx = PRACTICE_DONE_BASE + entry.fromScreen;
  useEffect(() => {
    let on = true, t = null;
    const tick = async () => {
      try {
        const [players, rows] = await Promise.all([livePlayers(live.pin), liveAnswers(live.pin, doneIdx)]);
        if (on) setData({ players, rows });
      } catch {}
      if (on) t = setTimeout(tick, 3000);
    };
    tick();
    return () => { on = false; clearTimeout(t); };
  }, [live.pin, doneIdx]);

  if (view === 'demo') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: T.bg }}>
        <HtmlCompiler task={entry.task} starterCode={entry.starter} onContinue={() => setView('watch')} onBack={() => setView('watch')} />
      </div>
    );
  }

  const total = data.players ? data.players.length : 0;
  const doneN = data.rows.length;
  const allIn = total > 0 && doneN >= total;
  const doneIds = new Set(data.rows.map(r => r.player_id));
  return (
    <div className="mp-overlay">
      <div className="mp-card">
        <div className="mp-eyebrow">✍️ Amaliyot · jonli</div>
        <h2 className="mp-title">{entry.task.title}</h2>
        <p className="mp-brief">{entry.task.brief}</p>
        <div className="mp-flow">
          <span className="mp-step cur">1 · O'quvchilar o'z qurilmasida yozmoqda</span>
          <span className="mp-arr">→</span>
          <span className="mp-step">2 · Mentor doskada yozib ko'rsatadi</span>
        </div>
        {data.players === null ? (
          <p className="mstats-wait">Ulanish…</p>
        ) : (
          <div className="mstats" style={{ marginTop: 2 }}>
            <div className="mstats-head">
              <span className="mstats-lbl">👨‍🎓 Praktikani tugatdi</span>
              <span className="mstats-n">{allIn ? '✓ Hamma tugatdi!' : <>Tugatdi: <b>{doneN}</b> / {total}</>}</span>
            </div>
            <div className="mstats-prog"><span className={`mstats-prog-fill ${allIn ? 'full' : ''}`} style={{ width: `${total ? Math.round((doneN / total) * 100) : 0}%` }} /></div>
            {total > 0 && (
              <div className="mstats-waitrow" style={{ marginTop: 10 }}>
                {data.players.map(p => <span key={p.id} className="mstats-wait-chip" style={doneIds.has(p.id) ? { background: T.successSoft, color: T.success, fontWeight: 700 } : undefined}>{doneIds.has(p.id) ? '✓ ' : '✏️ '}{p.nickname}</span>)}
              </div>
            )}
            {total === 0 && <p className="mstats-wait">Hali o'quvchi qo'shilmagan — ular praktikani boshlashi bilan bu yerda ✓ chiqadi…</p>}
          </div>
        )}
        <div className="mp-actions">
          <button className="mp-demo" onClick={() => setView('demo')}>🖊 Doskada yozib ko'rsatish</button>
          <button className="mp-next" onClick={onClose}>Keyingi mavzuga →</button>
        </div>
        <p className="mp-tip">💡 Ko'pchilik tugatgach, aynan shu mashqni doskada birga yozing — shunda o'quvchilar o'zini tekshiradi va mavzu mustahkamlanadi.</p>
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
// Stage (Provider) ichida turib, `when` true bo'lganda Mentorni majburan yopadi
// (desktopda ham). `when` false bo'lsa — ochiq holatga qaytaradi.
const MentorAutoClose = ({ when }) => {
  const ctx = useContext(MentorCtx) || {};
  const setForced = ctx.setForced;
  useEffect(() => { if (setForced) setForced(!!when); }, [when, setForced]);
  return null;
};

const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  // forced = ekran (masalan Xulosa) majburan yopgan — desktopda ham ishlaydi
  const enabled = !!ctx.enabled || !!ctx.forced;
  const collapsed = (!!ctx.enabled && ctx.collapsed) || !!ctx.forced;
  const expand = (e) => { e.stopPropagation(); if (ctx.forced && ctx.setForced) ctx.setForced(false); if (ctx.setCollapsed) ctx.setCollapsed(false); };
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
  const audio = useAudio([{ id: 's0', text: `Har kuni eMaktab, YouTube, Telegram'ni ochasiz, to'g'rimi? Ularning hammasi bitta narsadan yasalgan. "Sayt" tugmasini bosib, ichida nima borligini ko'ring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('site');
  const OPTS = [
    { id: 'a', label: 'Oddiy inglizcha matn' },
    { id: 'b', label: 'HTML — maxsus belgili til' },
    { id: 'c', label: 'Photoshop kabi dastur' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Bu sayt nimadan <span className="italic" style={{ color: T.accent }}>yasalgan</span>?</h1>
        <Mentor>Har kuni eMaktab, YouTube, Telegram'ni ochasiz, to'g'rimi? Ularning hammasi bitta narsadan yasalgan. <b style={{ color: T.ink }}>"Sayt"</b> tugmasini bosib, ichida nima borligini ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'site' ? 'chip-on' : ''}`} onClick={() => setView('site')}>🌐 Sayt</button>
              <button className={`chip ${view === 'code' ? 'chip-on' : ''}`} onClick={() => setView('code')}>{'</>'} Kod</button>
            </div>
            <div className="demo-swap" key={view}>
              {view === 'site' ? (
                <Preview minH={170} title="maktab.uz">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${T.ink3}40`, marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 22, height: 22, borderRadius: 6, background: T.accent, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 13 }}>M</span><b style={{ fontFamily: "'Manrope', sans-serif", color: T.ink, fontSize: 15 }}>Maktab</b></span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, fontFamily: "'Manrope', sans-serif", fontSize: 12, color: T.ink2 }}><span>Asosiy</span><span>Darslar</span><span style={{ background: T.ink, color: T.bg, padding: '5px 11px', borderRadius: 6, fontWeight: 600 }}>Kirish</span></span>
                  </div>
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3.2vw,28px)', margin: '0 0 6px', color: T.ink }}>Xush kelibsiz! 👋</h1>
                  <p style={{ fontFamily: 'Georgia, serif', margin: '0 0 12px', color: T.ink2, fontSize: 'clamp(13px,1.8vw,15px)' }}>Bilim — bir bosishda.</p>
                  <span style={{ display: 'inline-block', fontFamily: "'Manrope', sans-serif", fontWeight: 700, background: T.accent, color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 'clamp(12px,1.7vw,14px)' }}>Boshlash</span>
                </Preview>
              ) : (
                <>
                  <CodeBox><Tg>{'<header>'}</Tg>{'\n  '}Maktab · Asosiy · Darslar · Kirish{'\n'}<Tg>{'</header>'}</Tg>{'\n'}<Tg>{'<h1>'}</Tg>Xush kelibsiz! 👋<Tg>{'</h1>'}</Tg>{'\n'}<Tg>{'<p>'}</Tg>Bilim — bir bosishda.<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'<button>'}</Tg>Boshlash<Tg>{'</button>'}</Tg></CodeBox>
                  <p className="mono small" style={{ color: T.ink3, marginTop: 6, textAlign: 'center' }}>↑ shu saytning kodi — boshqa hech narsa emas!</p>
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nima ishlatiladi?</p>
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
            {picked !== null && <p className="hook-ack fade-step">Yaxshi! Hozir hammasini birga ko'rib chiqamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};
// ===== SCREEN 1 — REJA (mobil: preview <-> qadamlar, v16) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Va'da beraman: dars oxirida o'zingizning saytingiz tayyor bo'ladi — xuddi mana shunaqa. Unga 7 ta qadamda yetib boramiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Kod nima? — tushunamiz',   tag: '' },
    { text: 'HTML bilan tanishamiz',    tag: '' },
    { text: 'Sahifa skeletini quramiz', tag: '' },
    { text: "Sarlavha qo'shamiz",       tag: 'h1–h6' },
    { text: 'Matn bezaymiz',            tag: 'p, strong, em' },
    { text: "Ro'yxat yasaymiz",         tag: 'ul, ol, li' },
    { text: 'Havola ulaymiz',           tag: 'a href' },
  ];
  const G = "Georgia, serif";
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Natija — dars oxirida shunday bo'ladi</p>
      <Preview title="mening-saytim.html" minH={260}>
        <h1 style={{ fontFamily: G, fontSize: 'clamp(20px,3vw,26px)', margin: '0 0 8px', color: T.ink }}>Salom, men Aziza!</h1>
        <p style={{ fontFamily: G, margin: '0 0 14px', color: T.ink2, fontSize: 'clamp(13px,1.8vw,15px)', lineHeight: 1.5 }}>Web-dasturlashni endi o'rganyapman. Bu — mening birinchi saytim.</p>
        <p style={{ fontFamily: G, fontWeight: 700, margin: '0 0 6px', color: T.ink, fontSize: 'clamp(14px,1.9vw,16px)' }}>Sevimli mashg'ulotlarim:</p>
        <ul style={{ fontFamily: G, color: T.ink, margin: '0 0 14px', paddingLeft: 22, fontSize: 'clamp(13px,1.8vw,15px)', lineHeight: 1.6 }}><li>Minecraft</li><li>Futbol</li><li>Shaxmat</li></ul>
        <a style={{ fontFamily: G, color: T.link, textDecoration: 'underline', fontSize: 'clamp(13px,1.8vw,15px)' }}>Mening Telegram kanalim</a>
      </Preview>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">7 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (
          <li
            key={i}
            className="step-card fade-up"
            style={{ animationDelay: `${0.08 + i * 0.05}s` }}
          >
            <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="step-body">
              <span className="step-text">{s.text}</span>
              {s.tag && <span className="step-tag">{s.tag}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Bugun haqiqiy sayt yasaymiz!</span></h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida <b style={{ color: T.ink }}>o'zingizning saytingiz</b> tayyor bo'ladi — xuddi mana shunaqa. Unga <b style={{ color: T.ink }}>7 ta qadamda</b> yetib boramiz.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 7 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};


// ===== SCREEN 2 — HAYOTDAN MISOL (dinozavrni dasturlash o'yini) =====
// Och dinozavrni 🍖 gacha olib borish kerak. Yo'lda 🌵 kaktuslar bor — har
// biridan «Sakra» bilan oshib o'tish kerak. Bola buyruqlar ketma-ketligini
// (DASTUR) tuzadi → dinozavr AYNAN, shu tartibda bajaradi. Xato bo'lsa ham
// o'zi tuzatmaydi. Xulosa: kompyuter ham shunday — nazorat BIZdan.
const RG_GOAL = 6;                 // manzil katagi
const RG_CACTI = [2, 4];           // kaktuslar shu kataklarda
const RG_START = 0, RG_MAX = 8;
const RG_N = RG_GOAL + 1;          // jami kataklar (0..6)
const RG_CMDS = {
  yur:   { icon: '🐾', label: 'Yur',   note: 'bir qadam',  step: 1 },
  sakra: { icon: '⤴️', label: 'Sakra', note: 'sakrash',    step: 2 },
};
// Kataklarni 8%..92% oralig'iga teng taqsimlaymiz
const rgCellLeft = (i) => `${8 + i * (84 / (RG_N - 1))}%`;
// G'alaba konfettisi — sahna bo'ylab tarqalgan (bitta joyda emas)
const RG_CONFETTI = [
  { left: '14%', color: '#FF4D26', d: '0s' },   { left: '26%', color: '#0FA968', d: '.12s' },
  { left: '38%', color: '#019ACB', d: '.05s' },  { left: '50%', color: '#FF8A3D', d: '.18s' },
  { left: '62%', color: '#FF4D26', d: '.09s' },  { left: '74%', color: '#0FA968', d: '.22s' },
  { left: '86%', color: '#FFD380', d: '.15s' },  { left: '20%', color: '#019ACB', d: '.28s' },
];

const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Kompyuter juda tez ishlaydi, lekin sirni bilasizmi? U o'zicha hech narsa qila olmaydi — unga har bir ishni o'zimiz buyurishimiz kerak. Qanday qilib? Avval o'zingiz o'ylab ko'ring, keyin "Yechimni ko'rsat" tugmasini bosing.`, trigger: 'on_mount', waits_for: { type: 'solution_revealed' } }]);
  const [revealed, setRevealed] = useState(!!storedAnswer);
  const answerRef = useRef(null);
  const xulosaRef = useRef(null);
  // solved — dinozavr 🍖 ga yetib, Xulosa ko'rilgan. "Davom etish" shundan keyin yonadi.
  const [solved, setSolved] = useState(!!storedAnswer);

  // ── Dinozavrni dasturlash o'yini ──
  const [program, setProgram] = useState([]);   // masalan ['yur','sakra','sakra','yur']
  const [pos, setPos] = useState(RG_START);     // dino qaysi katakda (0..6)
  const [phase, setPhase] = useState('idle');   // idle | running | win | fail-cactus | fail-short
  const [jumping, setJumping] = useState(false);
  const [active, setActive] = useState(-1);      // hozir bajarilayotgan buyruq indeksi
  const botTimer = useRef(null);
  const running = phase === 'running';
  const isCactus = (c) => RG_CACTI.indexOf(c) !== -1;

  useEffect(() => () => clearTimeout(botTimer.current), []);
  // Manzilga yetganda: bu ekran "yechildi" (Davom etish yonadi), Xulosa
  // ochilib avtoscroll qilinadi. (Mentorni yopish — <MentorAutoClose/> orqali.)
  useEffect(() => {
    if (phase === 'win') {
      setSolved(true);
      if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true });
      if (xulosaRef.current) {
        const id = setTimeout(() => xulosaRef.current && xulosaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }), 260);
        return () => clearTimeout(id);
      }
    }
  }, [phase]);

  const resetDino = () => { clearTimeout(botTimer.current); setPos(RG_START); setPhase('idle'); setActive(-1); setJumping(false); };
  const addCmd = (c) => { if (running) return; setProgram((p) => (p.length >= RG_MAX ? p : [...p, c])); resetDino(); };
  const clearProgram = () => { if (running) return; setProgram([]); resetDino(); };

  // Dinozavr dasturni qadam-baqadam, AYNAN tartibda bajaradi
  const runProgram = () => {
    if (running || !program.length) return;
    clearTimeout(botTimer.current);
    setPos(RG_START); setPhase('running'); setActive(-1); setJumping(false);
    let cur = RG_START;
    let i = 0;
    const stepThrough = () => {
      if (i >= program.length) {                 // buyruqlar tugadi
        setActive(-1);
        setPhase(cur >= RG_GOAL ? 'win' : 'fail-short');
        return;
      }
      const cmd = program[i];
      setActive(i);
      if (cmd === 'sakra') setJumping(true);
      cur += RG_CMDS[cmd].step;
      const landed = cur;
      setPos(landed);
      botTimer.current = setTimeout(() => {
        setJumping(false);
        if (isCactus(landed)) { setActive(-1); setPhase('fail-cactus'); return; }  // kaktusga tushdi
        if (landed >= RG_GOAL) { setActive(-1); setPhase('win'); return; }          // manzilga yetdi
        i += 1;
        botTimer.current = setTimeout(stepThrough, 160);
      }, 600);
    };
    botTimer.current = setTimeout(stepThrough, 380);
  };

  const reveal = () => {
    setRevealed(true);
    audio.triggerEvent('solution_revealed');
    setTimeout(() => { if (answerRef.current) answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Mana, dinozavrga buyruq tuzib ko'ring: u o'zicha o'ylamaydi, faqat siz aytgan tartibda yuradi. Kompyuter ham xuddi shunday — biz buyruq beramiz, u darhol bajaradi, to'g'ri-noto'g'riligini esa biz nazorat qilamiz.`); }, 300);
  };

  const RG_MSG = {
    running:      { cls: 'idle', text: '🦖 Dinozavr buyruqlaringizni bajaryapti…' },
    win:          { cls: 'ok',   text: '🎉 Yetib keldi! Buyruqlaringiz to‘g‘ri ketma-ketlikda edi.' },
    'fail-cactus':{ cls: 'bad',  text: '💥 Dinozavr kaktusga urildi! Undan «Sakra» bilan oshish kerak edi. U o‘zi o‘ylab sakramaydi — aniq buyurasiz.' },
    'fail-short': { cls: 'bad',  text: '🤏 Dinozavr 🍖 gacha yetmadi. Yana buyruq qo‘shing va qaytadan urinib ko‘ring.' },
  };
  const msg = RG_MSG[phase];

  return (
    <Stage eyebrow="Hayotdan misol" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? "Davom etish" : (revealed ? "Dinozavrni 🍖 ga yetkazing" : "Avval o'ylab ko'ring")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kompyuter <span className="italic" style={{ color: T.accent }}>o'zicha</span> o'ylay oladimi?</h2></div>
        <Mentor>Kompyuter juda tez ishlaydi, lekin sirni bilasizmi? U <b style={{ color: T.ink }}>o'zicha hech narsa qila olmaydi</b> — unga har bir ishni o'zimiz buyurishimiz kerak. Qanday qilib? Avval o'zingiz o'ylab ko'ring.</Mentor>
        <MentorAutoClose when={phase === 'win'} />
        {!revealed && (
          <div className="frame frame-col savo fade-up delay-2">
            <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>Savol</p>
            <p className="body" style={{ margin: 0, color: T.ink, fontSize: 'clamp(15px,1.9vw,18px)', lineHeight: 1.5 }}>Kompyuter o'zi hech narsa o'ylab topmaydi. Unga biror ishni <b>qanday bajartiramiz</b> — qanday qilib «mana shuni qil» deb tushuntiramiz?</p>
            <button className="btn" onClick={reveal} style={{ alignSelf: 'flex-start', marginTop: 4 }}>Dinozavrda sinab ko'ramiz →</button>
          </div>
        )}
        {revealed && (
          <>
            <Zoomable>
            <div ref={answerRef} className="frame frame-col fade-step" style={{ scrollMarginTop: 12 }}>
              <div className="pz-head">
                <span className="pz-emoji">🦖</span>
                <div>
                  <p className="pz-title">Dinozavrni o'zingiz boshqaring</p>
                  <p className="pz-sub">Dinozavrga buyruq bering — u <b style={{ color: T.ink }}>aynan</b> shuni, <b style={{ color: T.ink }}>shu tartibda</b> bajaradi. Tuzgan buyruqlaringiz ro'yxati — bu <b style={{ color: T.ink }}>dastur (kod)</b>.</p>
                </div>
              </div>

              {/* Sahna — dinozavr, kaktuslar, manzil */}
              <div className="rg-scene">
                <div className="rg-sky" />
                <div className="rg-ground" />
                {Array.from({ length: RG_N }).map((_, i) => <span key={i} className="rg-cell" style={{ left: rgCellLeft(i) }} />)}
                {RG_CACTI.map((c) => <div key={c} className="rg-cactus" style={{ left: rgCellLeft(c) }}>🌵</div>)}
                <div className="rg-goal" style={{ left: rgCellLeft(RG_GOAL) }}><span className={`rg-meat ${phase === 'win' ? 'eaten' : ''}`}>🍖</span></div>
                <div className={`rg-dino ${phase}`} style={{ left: rgCellLeft(Math.max(0, Math.min(pos, RG_GOAL))) }}>
                  {phase === 'fail-cactus' && <span className="rg-burst">💥</span>}
                  {phase === 'win' && <span className="rg-yum">😋</span>}
                  <span className={`rg-dino-in ${jumping ? 'jump' : ''}`}><span className="rg-dino-face">🦖</span></span>
                </div>
                {phase === 'win' && (
                  <div className="rg-confetti" aria-hidden="true">
                    {RG_CONFETTI.map((c, i) => <i key={i} style={{ left: c.left, background: c.color, animationDelay: c.d }} />)}
                  </div>
                )}
              </div>

              {/* Buyruq tugmalari — dino ostida */}
              <div className="rg-pad">
                <button className="rg-key rg-key-yur" onClick={() => addCmd('yur')} disabled={running || program.length >= RG_MAX}><span className="rg-key-ic">🐾</span>Yur</button>
                <button className="rg-key rg-key-jump" onClick={() => addCmd('sakra')} disabled={running || program.length >= RG_MAX}><span className="rg-key-ic">⤴️</span>Sakra</button>
                <span className="rg-legend">🐾 Yur = <b>1 qadam</b> · ⤴️ Sakra = <b>2 qadam</b></span>
              </div>

              {/* DASTUR — kod tahririday ko'rinish */}
              <div className="rg-code">
                <div className="rg-code-bar"><span className="rg-dot" /><span className="rg-dot" /><span className="rg-dot" /><span className="rg-code-name">🦖 dino.kod</span></div>
                <div className="rg-code-body">
                  {program.length === 0
                    ? <div className="rg-code-empty">// yuqoridagi tugmalardan buyruq qo'shing…</div>
                    : program.map((c, i) => (
                        <div key={i} className={`rg-line ${active === i ? 'now' : ''}`}>
                          <span className="rg-ln">{i + 1}</span>
                          <span className="rg-call"><span className="rg-fn">{c}</span><span className="rg-paren">()</span></span>
                          <span className="rg-cmt">{RG_CMDS[c].icon} {RG_CMDS[c].note}</span>
                        </div>
                      ))}
                </div>
              </div>

              {/* Boshqaruv — tozalash + ishga tushirish */}
              <div className="rg-run-row">
                <button className="rg-mini" onClick={clearProgram} disabled={running || !program.length}>↺ Tozala</button>
                <button className="btn" onClick={runProgram} disabled={running || !program.length} style={{ marginLeft: 'auto' }}>{running ? 'Bajaryapti…' : '▶ Ishga tushir'}</button>
              </div>

              {msg && <p className={`rg-msg ${msg.cls}`} key={phase}>{msg.text}</p>}
            </div>
            </Zoomable>

            {/* Yashil XULOSA — faqat dino 🍖 ga yetganda ochiladi */}
            {phase === 'win' && (
              <div ref={xulosaRef} className="rg-xulosa fade-step" style={{ scrollMarginTop: 16 }}>
                <span className="rg-xulosa-ic">💡</span>
                <div>
                  <p className="xh">Xulosa</p>
                  <p className="xb">Kompyuter — xuddi shu dinozavr: juda tez va itoatkor, lekin <b>o'zi o'ylamaydi</b>. Biz unga aniq, ketma-ket <b>buyruqlar — ya'ni kod</b> beramiz; u esa ularni <b>darhol va aynan</b> bajaradi, to'g'ri yoki xato ekanini o'zi bilmaydi. Demak, kompyuterni aqlli qiladigan — bu <b style={{ color: T.success }}>biz, dasturchilar!</b> To'g'ri natija buyruqlarimiz qanchalik aniq bo'lishiga bog'liq.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Stage>
  );
};



// ===== SCREEN 3 — HTML: "Brauzer mashinasi" (kodni o'qib sahifa quradi) =====
const Screen3 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Chrome yoki Safari'ni ochganingizda sayt chiroyli ko'rinadi. Lekin brauzer aslida HTML degan tilni o'qiydi, keyin uni sahifaga aylantiradi. Ismingizni yozing va "Brauzerni ishga tushir"ni bosing — brauzer kodni o'qib, sahifangizni qadam-baqadam quradi.`, trigger: 'on_mount', waits_for: null }]);
  const [name, setName] = useState('Aziz');
  const [step, setStep] = useState(0);      // nechta bo'lak qurilgan (0..3)
  const [active, setActive] = useState(-1);  // brauzer hozir o'qiyotgan qator
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const isNarrow = useIsMobile(768);
  const built = step >= 3;
  useEffect(() => () => clearTimeout(timer.current), []);

  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  // 3 ta kod qatori — har biri sahifaning bitta bo'lagiga aylanadi
  const codeLines = [
    <><Tg>{'<h1>'}</Tg><span className="hl-sync" key={name}>{name || '...'}</span><Tg>{'</h1>'}</Tg></>,
    <><Tg>{'<p>'}</Tg>HTML o'rganyapman<Tg>{'</p>'}</Tg></>,
    <><Tg>{'<button>'}</Tg>Obuna bo'lish<Tg>{'</button>'}</Tg></>,
  ];

  // Brauzer kodni yuqoridan pastga o'qiydi: har qatorni yoqib, mos bo'lakni quradi
  const runBrowser = () => {
    clearTimeout(timer.current);
    setStep(0); setActive(-1); setRunning(true);
    let i = 0;
    const tick = () => {
      if (i >= codeLines.length) { setActive(-1); setRunning(false); return; }
      setActive(i);                                   // qatorni o'qiymiz (yonadi)
      timer.current = setTimeout(() => {
        setStep(i + 1);                               // mos bo'lak sahifaga chiqadi
        i += 1;
        timer.current = setTimeout(tick, 260);
      }, 520);
    };
    timer.current = setTimeout(tick, 350);
  };
  const reset = () => { clearTimeout(timer.current); setRunning(false); setStep(0); setActive(-1); };

  return (
    <Stage eyebrow="HTML" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.5vw,14px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yozgan so'zingiz qanday <span className="italic" style={{ color: T.accent }}>saytga</span> aylanadi?</h2></div>
        <Mentor>Chrome yoki Safari'ni ochganingizda sayt chiroyli ko'rinadi. Lekin brauzer aslida <b style={{ color: T.ink }}>HTML</b> degan tilni o'qiydi, keyin uni sahifaga aylantiradi. Ismingizni yozing, so'ng <b style={{ color: T.ink }}>«Brauzerni ishga tushir»</b>ni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col" style={{ gap: 8 }}>
            <div className="fade-up delay-1">
              <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>Ismingizni yozing</p>
              <input className="text-input" value={name} onChange={e => setName(e.target.value)} maxLength={18} placeholder="Ismingiz" disabled={running} />
            </div>
            <p className="flow-label">HTML kod {isNarrow ? '↓' : '→'} brauzer o'qiydi</p>
            <div className="code-box br-code">
              {codeLines.map((ln, i) => (
                <div key={i} className={`br-line ${active === i ? 'now' : ''} ${step > i ? 'read' : ''}`}>
                  <span className="br-caret">{active === i ? '▸' : ''}</span>
                  <span>{ln}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col" style={{ gap: 7 }}>
            <p className="flow-label">Brauzer oynasi</p>
            <Preview title="profil.html" minH={isNarrow ? 124 : 150}>
              {step === 0 && !running
                ? <div className="br-empty"><span style={{ fontSize: 24 }}>🌐</span><span>Brauzer hali kodni o'qimadi.<br />Pastdagi tugmani bosing.</span></div>
                : (
                  <div className="profile-card">
                    {step >= 1 && (
                      <div className="br-el" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div className="pf-ava">{initial}</div>
                        <h1 className="pf-name">{name || '...'}</h1>
                      </div>
                    )}
                    {step >= 2 && <p className="pf-bio br-el">HTML o'rganyapman</p>}
                    {step >= 3 && <button className="pf-btn br-el">Obuna bo'lish</button>}
                  </div>
                )}
            </Preview>
            <div className="br-controls">
              {built && !running && <button className="rg-mini" onClick={reset}>↺ Tozalash</button>}
              <button className="btn" onClick={runBrowser} disabled={running} style={{ marginLeft: built && !running ? 'auto' : 0 }}>
                {running ? 'Brauzer o’qiyapti…' : built ? '↻ Qaytadan qurish' : '▶ Brauzerni ishga tushir'}
              </button>
            </div>
            {built && <p className="br-status">✓ Brauzer kodni <b>yuqoridan pastga</b> o'qib, har bir qatorni sahifaga aylantirdi.</p>}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};


// ===== SCREEN 4 — TEST =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi? To'g'ri variantni tanlang."
    questionText="HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Kim nima qiladi?</p><h2 className="title h-sub" style={{ marginTop: 8 }}>HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi?</h2></>}
    options={['Server', 'Photoshop', 'Brauzer', 'Klaviatura']} correctIdx={2}
    explainCorrect="To'g'ri. Brauzer (Chrome, Safari, Firefox, Edge) HTML kodini o'qib, sahifa qilib ekraningizda ko'rsatadi."
    explainWrong={{ 0: 'Server faqat HTML faylni saqlaydi va jo\u2019natadi. Uni o\u2019qib sahifaga aylantirish — brauzerning ishi.', 1: 'Photoshop — bu rasm muharriri, HTML\u2019ga aloqasi yo\u2019q.', 3: 'Klaviatura — bu siz yozadigan qurilma. HTML\u2019ni o\u2019qib ko\u2019rsatadigan — brauzer.', default: 'HTML kodini o\u2019qib, sahifa qilib ko\u2019rsatadigan — brauzer.' }} />
);

// 🧲 Qayta ishlatiladigan DRAG&DROP — bo'laklarni to'g'ri TARTIBDA joylash (sudrab yoki bosib).
// Boshqa darsga: faqat `items` (to'g'ri tartibda) va `hints` almashtiriladi.
const SKELET_PIECES = [
  { id: 'doctype', label: '<!DOCTYPE html>' },
  { id: 'html', label: '<html>' },
  { id: 'head', label: '<head>' },
  { id: 'body', label: '<body>' },
];
function DragDropOrder({ items, hints, onSolved }) {
  const order = items.map(x => x.id);
  const byId = useMemo(() => Object.fromEntries(items.map(x => [x.id, x])), [items]);
  // YAGONA holat — pool va slots birga (setState ichida setState YO'Q → StrictMode'da dublikat bo'lmaydi)
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
  // Sudrash — asl chip elementini DOM transform bilan suramiz (state yo'q → pirillamaydi;
  // transform lokal → `position:fixed` muammosi yo'q, ekran pastida chiqmaydi).
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
      else { el.style.transition = 'transform .2s cubic-bezier(.34,1.3,.4,1)'; el.style.transform = ''; setTimeout(() => finish(el), 210); } // pool'ga qaytadi
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
      {solved && <div className="dd-done">✓ To'g'ri! Skelet aynan shu tartibda.</div>}
      {wrong && !solved && <div className="dd-wrong">⚠️ Tartib xato — qayta joylang.</div>}
    </div>
  );
}

// 🐞 Qayta ishlatiladigan DEBUG CHALLENGE — buzuq koddan xato qatorni topib bosish → tuzatiladi.
// Boshqa darsga: `lines` (bittasida bug:true), `fixed` (to'g'ri qator), `explain` almashtiriladi.
function DebugChallenge({ lines, fixed, explain, onSolved }) {
  const bugIdx = lines.findIndex(l => l.bug);
  const [picked, setPicked] = useState(-1);
  const [wrongIdx, setWrongIdx] = useState(-1);
  const solved = picked === bugIdx;
  useEffect(() => { if (solved) onSolved && onSolved(); }, [solved]); // eslint-disable-line
  const click = (i) => {
    if (solved) return;
    if (i === bugIdx) setPicked(i);
    else { setWrongIdx(i); setTimeout(() => setWrongIdx(w => (w === i ? -1 : w)), 500); }
  };
  return (
    <div className="dbg fade-up">
      <div className="dbg-code">
        {lines.map((l, i) => (
          <div key={i} className={`dbg-line ${solved && i === bugIdx ? 'fixed' : ''} ${wrongIdx === i ? 'wrong' : ''}`} onClick={() => click(i)}>
            <span className="dbg-ln">{i + 1}</span>
            <span className="dbg-txt">{solved && i === bugIdx ? fixed : l.text}</span>
            {solved && i === bugIdx && <span className="dbg-badge">✓ tuzatildi</span>}
          </div>
        ))}
      </div>
      {!solved
        ? <p className="dbg-hint">👆 Xato bor qatorni toping va bosing</p>
        : <div className="dbg-ok">✓ Topdingiz! {explain}</div>}
    </div>
  );
}

// 🃏 Qayta ishlatiladigan FLASHCARDS — aktiv takrorlash (3D flip + o'z-o'zini baholash + spaced recall).
// Boshqa darsga: faqat `cards` ({ front, back, note }) almashtiriladi.
const HTML_FLASHCARDS = [
  { front: 'Eng katta sarlavha', back: '<h1>', note: 'h1 — eng katta · h6 — eng kichik' },
  { front: 'Oddiy matn (paragraf)', back: '<p>', note: 'bir-ikki gap' },
  { front: "Tartibsiz (nuqtali) ro'yxat", back: '<ul>', note: '• belgili' },
  { front: "Tartibli (raqamli) ro'yxat", back: '<ol>', note: '1 · 2 · 3 …' },
  { front: "Ro'yxatning bitta bandi", back: '<li>', note: 'ul/ol ichida' },
  { front: 'Boshqa sahifaga havola', back: '<a>', note: 'bosiladigan link' },
  { front: "Havola manzili qayerga yoziladi", back: 'href', note: '<a href="...">' },
  { front: 'Matnni qalin qilish', back: '<strong>', note: "muhim so'z" },
  { front: 'Matnni qiya (kursiv) qilish', back: '<em>', note: "urg'u" },
  { front: "Ko'rinmaydigan qism (sozlamalar)", back: '<head>', note: 'title shu yerda' },
  { front: "Ko'rinadigan qism (kontent)", back: '<body>', note: "hamma ko'radi" },
];
function Flashcards({ cards }) {
  const [queue, setQueue] = useState(() => cards.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const total = cards.length;
  const cur = queue[0];
  const card = cur != null ? cards[cur] : null;
  const advance = (removed) => {
    setFlipped(false);
    setTimeout(() => setQueue(q => { const [first, ...rest] = q; return removed ? rest : [...rest, first]; }), flipped ? 160 : 0);
  };
  const knew = () => { setKnown(k => k + 1); advance(true); };
  const again = () => advance(false);
  const restart = () => { setQueue(cards.map((_, i) => i)); setKnown(0); setFlipped(false); };
  if (!card) return (
    <div className="fc-done fade-up"><span className="fc-done-emoji">🎉</span><p className="fc-done-h">Hammasini bilasiz!</p><p className="fc-done-s">{total}/{total} teg yodlandi</p><button className="fc-btn ghost" onClick={restart}>↻ Qaytadan takrorlash</button></div>
  );
  return (
    <div className="fc fade-up">
      <div className="fc-top"><span className="fc-count">Bilaman: <b>{known}</b> / {total}</span><span className="fc-remain">{queue.length} ta qoldi</span></div>
      <div className="fc-bar"><span className="fc-bar-fill" style={{ width: `${(known / total) * 100}%` }} /></div>
      <div className="fc-cardwrap">
        <div className={`fc-card ${flipped ? 'flip' : ''}`} onClick={() => !flipped && setFlipped(true)} role="button" tabIndex={0}>
          <div className="fc-face fc-front"><span className="fc-q">{card.front}</span><span className="fc-cue">Qaysi teg? 🤔 <span className="fc-tap">bosing</span></span></div>
          <div className="fc-face fc-back"><span className="fc-tag">{card.back}</span>{card.note && <span className="fc-note">{card.note}</span>}</div>
        </div>
      </div>
      {flipped
        ? (<div className="fc-actions"><button className="fc-btn again" onClick={again}>↻ Takrorlash</button><button className="fc-btn knew" onClick={knew}>✓ Bildim</button></div>)
        : (<p className="fc-hint">👆 Kartani bosing — javobni ko'rasiz</p>)}
    </div>
  );
}

// ===== SCREEN 5 — SKELET (savol + Mentor) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Odamda ham ko'rinadigan va ko'rinmaydigan tomon bor: yuzingizni hamma ko'radi, lekin miyangiz ichkarida, ko'rinmasdan ishlaydi. Sahifa ham xuddi shunaqa — head ko'rinmaydigan qism, body ko'rinadigan qism. Har bir qismni bosib, nima ekanini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    doctype: { tag: '<!DOCTYPE html>', word: "E'lon", role: 'Eng boshida turadi va "bu HTML5 sahifa" deb bildiradi.' },
    html: { tag: '<html>', word: 'Butun hujjat', role: 'Butun sahifani o\u2019rab turadi — head ham, body ham shuning ichida.' },
    head: { tag: '<head>', word: 'Bosh — ko\u2019rinmaydi', role: 'Sahifaning "boshi": title (nom) va sozlamalar. title brauzer tabchasida ko\u2019rinadi, lekin sahifa ichida ko\u2019rinmaydi.' },
    body: { tag: '<body>', word: 'Tana — ko\u2019rinadi', role: 'Sahifaning "tanasi": ko\u2019rinadigan hamma narsa — sarlavha, matn, rasm, havola shu yerda.' }
  };
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const [dragDone, setDragDone] = useState(!!storedAnswer);
  const isNarrow = useIsMobile(768);
  const explored = clicked.size === 4;
  const done = dragDone; // Davom etish — skelet DRAG bilan yig'ilganda
  const tap = (k) => { setActive(k); setClicked(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const fc = (k, base) => `${base} ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  const ck = (k) => `ck ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Struktura" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : (explored ? "Skeletni yig'ing" : `${clicked.size}/4 qismi ko'rilgan`)} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytning <span className="italic" style={{ color: T.accent }}>ko'rinmaydigan</span> tomoni bormi?</h2></div>
        <Mentor>Odamda ham ko'rinadigan va ko'rinmaydigan tomon bor: yuzingizni hamma ko'radi, lekin miyangiz ichkarida ishlaydi. Sahifa ham xuddi shunaqa — <b style={{ color: T.ink }}>head</b> ko'rinmaydigan qism, <b style={{ color: T.ink }}>body</b> ko'rinadigan qism. Har qismni bosib biling.</Mentor>
        <Zoomable>
        <div className="split">
          <div className="col">
            {explored ? (
              <div className="sk-buildbox">
                <p className="eyebrow" style={{ color: T.accent, margin: '0 0 2px' }}>🧲 Endi o'zingiz yig'ing</p>
                <p className="body" style={{ margin: '0 0 10px', color: T.ink2, fontSize: 13.5 }}>Bo'laklarni to'g'ri tartibda joylang — sudrab yoki bosib.</p>
                <DragDropOrder items={SKELET_PIECES} hints={["eng boshida", "butun sahifa qobig'i", "ko'rinmas qism", "ko'rinadigan qism"]} onSolved={() => setDragDone(true)} />
              </div>
            ) : (
            <div className="bskel fade-up delay-2">
              <div className={fc('doctype', 'bskel-doctype')} onClick={() => tap('doctype')}>&lt;!DOCTYPE html&gt;</div>
              <div className={fc('html', 'bskel-html')} onClick={() => tap('html')}>
                <span className="bskel-htmllabel">&lt;html&gt; — butun hujjat</span>
                <div className="bskel-win" onClick={(e) => e.stopPropagation()}>
                  <div className={fc('head', 'bskel-tab')} onClick={() => tap('head')}><span className="bskel-dots"><i /><i /><i /></span><span className="bskel-tabpill">Mening sahifam</span><span className="bskel-zone">&lt;head&gt;</span></div>
                  <div className={fc('body', 'bskel-page')} onClick={() => tap('body')}><p className="bskel-ptitle">Salom! 👋</p><p className="bskel-ptext">Bu mening sahifam.</p><span className="bskel-zone bskel-zone-b">&lt;body&gt;</span></div>
                </div>
              </div>
            </div>
            )}
          </div>
          <div className="col" style={{ gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="flow-label">HTML kodi</div>
              <span className="small mono" style={{ color: explored ? T.success : T.ink3 }}>{clicked.size} / 4 ko'rildi</span>
            </div>
            <pre className="code-box fade-up delay-2">
              <span className={ck('doctype')} onClick={() => tap('doctype')}><span className="t-tag">&lt;!DOCTYPE html&gt;</span></span>{'\n'}
              <span className={ck('html')} onClick={() => tap('html')}><span className="t-tag">&lt;html&gt;</span></span>{'\n'}
              {'  '}<span className={ck('head')} onClick={() => tap('head')}><span className="t-tag">&lt;head&gt;</span></span>{'\n'}
              {'    '}<span className="t-title">&lt;title&gt;Mening sahifam&lt;/title&gt;</span>{'\n'}
              {'  '}<span className={ck('head')} onClick={() => tap('head')}><span className="t-tag">&lt;/head&gt;</span></span>{'\n'}
              {'  '}<span className={ck('body')} onClick={() => tap('body')}><span className="t-tag">&lt;body&gt;</span></span>{'\n'}
              {'    '}<span className="t-cm">&lt;!-- kontent shu yerga --&gt;</span>{'\n'}
              {'  '}<span className={ck('body')} onClick={() => tap('body')}><span className="t-tag">&lt;/body&gt;</span></span>{'\n'}
              <span className={ck('html')} onClick={() => tap('html')}><span className="t-tag">&lt;/html&gt;</span></span>
            </pre>
            {explored ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Skeletni o'rgandingiz</p><p className="body" style={{ margin: 0, color: T.ink }}>Har sahifa shu tartibda: <b>DOCTYPE → html → head (ko'rinmaydi) + body (ko'rinadi)</b>.</p></div>
            ) : active ? (
              <div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-chip">{PARTS[active].tag}</span><span className="sk-wordbadge">{PARTS[active].word}</span></span><p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p></div>
            ) : (
              !isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chizma yoki koddan bir qismni bosing</p></div> : null
            )}
          </div>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};


// ===== YANGI: SKELET MUSTAHKAMLASH TESTI (s5 dan keyin) =====
const ScreenSkeletTest = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText={`Sahifada ko'rinadigan matn qaysi qismga yoziladi?`}
    questionText="Sahifada ko'rinadigan matn qaysi qismga yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sahifada <span className="italic" style={{ color: T.accent }}>ko'rinadigan</span> matn qaysi qismga yoziladi?</h2></>}
    options={['<head>', '<title>', '<!DOCTYPE>', '<body>']} correctIdx={3}
    explainCorrect="To'g'ri! body — sahifada ko'rinadigan hamma narsa (sarlavha, matn, rasm) shu yerda yoziladi."
    explainWrong={{
      0: '<head> — bu ko\u2019rinmaydigan qism: title va sozlamalar. Ko\u2019rinadigan matn body ichida.',
      1: '<title> — faqat brauzer tabchasidagi nom. To\u2019g\u2019risi — body.',
      2: '<!DOCTYPE> — bu "men HTML5 man" degan e\u2019lon, matn joyi emas. To\u2019g\u2019risi — body.',
      default: 'Ko\u2019rinadigan matn body ichiga yoziladi.'
    }} />
);

// ===== SCREEN 6 — TEG (qo'shtirnoq modeli, v16) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Brauzer aqlli emas — matn qayerda boshlanib, qayerda tugashini o'zi bilmaydi. Buni unga teglar aytadi: ochuvchi teg boshlanishini, yopuvchi teg tugashini ko'rsatadi. Xuddi yozuvdagi qo'shtirnoq kabi — ochasiz va albatta yopasiz. Tugmani bosib, "Salom!" so'ziga teg qo'shing.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    open:    { role: 'Ochuvchi teg — element shu yerdan boshlanadi.' },
    content: { role: "Kontent — ekranda ko'rinadigan matn. Teglar uni yashirmaydi, balki nima ekanini aytadi." },
    close:   { role: 'Yopuvchi teg — / belgili. Element shu yerda tugaydi.' }
  };
  const [wrapped, setWrapped] = useState(false);
  const [active, setActive] = useState(null);
  const [dbgDone, setDbgDone] = useState(!!storedAnswer);
  const isNarrow = useIsMobile(768);
  const done = dbgDone; // Davom etish — teg qamragach xato ham topilganda
  const tap = (k) => { if (!wrapped) return; setActive(k); };
  const ic = (k, base) => `${base} ${active === k ? 'active' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);

  return (
    <Stage eyebrow="Teg" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : (wrapped ? "🐞 Xatoni toping" : "Avval tegga o'rang")} onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Brauzer matn qayerda <span className="italic" style={{ color: T.accent }}>tugashini</span> qanday biladi?</h2></div>
        <Mentor>Brauzer aqlli emas — matn qayerda <b style={{ color: T.ink }}>boshlanib</b>, qayerda <b style={{ color: T.ink }}>tugashini</b> o'zi bilmaydi. Buni unga teglar aytadi: ochuvchi teg — boshlanishi, yopuvchi teg — tugashi. Xuddi yozuvdagi <b style={{ color: T.ink }}>qo'shtirnoq</b> kabi — ochasiz va albatta yopasiz. Tugmani bosib, <b style={{ color: T.ink }}>"Salom!"</b> so'ziga teg qo'shing.</Mentor>

        <div className="split">
          <div className="col">
            <div className={`tegbuild-wrap ${wrapped ? 'on' : ''} fade-up delay-2`}>
              <div className={`tegbuild ${wrapped ? 'on' : ''}`}>
                <div className={ic('open', `tb-chip tb-tag tb-open ${wrapped ? '' : 'hide'}`)} onClick={() => tap('open')}>
                  <span className="tb-code">&lt;h1&gt;</span><span className="tb-lbl">ochuvchi</span>
                </div>
                <div className={ic('content', 'tb-chip tb-content')} onClick={() => tap('content')}>
                  <span className="tb-code">Salom!</span><span className="tb-lbl">{wrapped ? 'kontent' : 'oddiy matn'}</span>
                </div>
                <div className={ic('close', `tb-chip tb-tag tb-close ${wrapped ? '' : 'hide'}`)} onClick={() => tap('close')}>
                  <span className="tb-code">&lt;<span className="tb-slash">/</span>h1&gt;</span><span className="tb-lbl">yopuvchi</span>
                </div>
              </div>
              <div className="tb-bracket"><div className="tb-brace" /><span className="tb-brace-lbl">= bitta element</span></div>
            </div>

            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setWrapped(w => !w); setActive(null); }}>
              {wrapped ? '↻ Qaytadan' : '▶ Tegga o\u2019rash'}
            </button>

            {wrapped
              ? (active
                  ? (<div className="role-line fade-step" key={active}><p className="body" style={{ color: T.ink, margin: 0 }}>{PARTS[active].role}</p></div>)
                  : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13, fontStyle: 'italic' }}>Yuqoridagi uchta qismdan birini bosib, vazifasini ko'ring.</p>))
              : (<div className="hint"><p className="body" style={{ color: T.ink2, margin: 0 }}>Hozir "Salom!" — oddiy matn, brauzer u bilan nima qilishni bilmaydi. Tugmani bosing — teglar ikki tomondan kelib uni <b style={{ color: T.ink }}>qamrab oladi</b>.</p></div>)}
          </div>

          {(!isNarrow || wrapped) && (<div className="col fade-step">
            <div className="flow-label">Sahifada qanday ko'rinadi</div>
            <Preview title="sahifa.html" minH={92}>{wrapped ? <p className="pv-h1 fade-step">Salom!</p> : <p className="pv-plain">Salom!</p>}</Preview>
            {wrapped && (<div className="frame-ok fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Endi brauzer biladi: <span className="mono">&lt;h1&gt;</span> boshladi, <span className="mono">&lt;/h1&gt;</span> tugatdi — orasidagi <b>"Salom!"</b> katta sarlavhaga aylandi.</p></div>)}
          </div>)}
        </div>
        {wrapped && (
          <div className="dbg-box">
            <p className="eyebrow" style={{ color: T.accent, margin: '2px 0 0' }}>🐞 Endi xatoni toping</p>
            <p className="body" style={{ margin: '2px 0 8px', color: T.ink2, fontSize: 13.5 }}>Bu kodda bitta teg <b style={{ color: T.ink }}>noto'g'ri yopilgan</b>. Xato qatorni bosing.</p>
            <DebugChallenge
              lines={[{ text: '<h1>Mening saytim<h1>', bug: true }, { text: '<p>Xush kelibsiz!</p>' }]}
              fixed={'<h1>Mening saytim</h1>'}
              explain={"Yopuvchi tegda / belgisi bo'lishi kerak: </h1>"}
              onSolved={() => setDbgDone(true)} />
          </div>
        )}
      </div>
    </Stage>
  );
};


// ===== SCREEN 7 — YOZISH (baholanadi, + Mentor) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Har bir o'ralgan tegning yopuvchisi bo'lishi shart. Mana, h1 ochildi, lekin yopilmagan. Uni yopuvchi tegini o'zingiz yozing — pastdagi katakka.`, trigger: 'on_mount', waits_for: null }]);
  const gate = useContext(LiveGateCtx) || {};
  const live = gate.live;
  const isMentorLive = !!(live && live.mode === 'mentor');
  const ANSWER = '</h1>';
  const normTag = (v) => (v || '').toLowerCase().replace(/\s+/g, '');
  const [val, setVal] = useState(storedAnswer?.studentAnswer ?? '');
  const correct = normTag(val) === ANSWER;
  const touched = val.trim().length > 0;
  useEffect(() => {
    if (correct && storedAnswer === undefined) {
      onAnswer(screen, { stage: 'module-mikro', screenIdx: screen, picked: val, question: '<h1>Salom! ... yopuvchi tegni yozing', correctAnswer: ANSWER, studentAnswer: val, correct: true });
      // Jonli darsda o'quvchi tugatganini serverga yozamiz — mentor «kim tugatdi»ni ko'radi va podium hisoblaydi
      if (live && live.mode === 'student') live.submitAnswer(screen, SCREEN_META[screen]?.id || `s${screen}`, 0, true, 0);
    }
  }, [correct]);
  return (
    <Stage eyebrow="Yozing" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={isMentorLive ? false : !correct} label={isMentorLive ? 'Davom etish' : (correct ? 'Davom etish' : 'Yopuvchi tegni yozing')} onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozib ko'ring.</h2></div>
        <Mentor>Har bir o'ralgan tegning <b style={{ color: T.ink }}>yopuvchisi bo'lishi shart</b>. Mana, <span className="mono">&lt;h1&gt;</span> ochildi, lekin yopilmagan. Uni yopuvchi tegini o'zingiz yozing — pastdagi katakka.</Mentor>
        <div className="split">
          <div className="col"><div className="yz-card fade-up delay-2"><div className="yz-line"><span className="yz-code"><span className="t-tag">&lt;h1&gt;</span>Salom!</span>{!correct ? (<input className="yz-input" value={val} onChange={e => setVal(e.target.value)} placeholder="yopuvchi teg…" spellCheck={false} />) : (<span className="yz-code yz-done"><span className="t-tag">&lt;/h1&gt;</span></span>)}</div>{!correct && (<p className="yz-hint">{touched ? "Deyarli! Yopuvchi teg / belgisi bilan boshlanadi: </h1>" : "Maslahat: avval / yozing, keyin teg nomi va >"}</p>)}{correct && <p className="yz-ok">✓ To'g'ri! Endi element yopildi: &lt;h1&gt;...&lt;/h1&gt;</p>}</div></div>
          <div className="col"><div className="flow-label">Natija</div><div className="bp-window fade-up delay-2"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">sahifa.html</span></div><div className="bp-body" style={{ minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{correct ? <p className="pv-h1 fade-step">Salom!</p> : <p className="yz-placeholder">Natija shu yerda chiqadi…</p>}</div></div></div>
        </div>
        {isMentorLive && <MentorWorkStats live={live} screenIdx={screen} taskLabel="Yopuvchi teg yozish" />}
      </div>
    </Stage>
  );
};


// ===== SCREEN 8 — SARLAVHALAR (gazeta -> teglar, v16) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Mana oddiy gazeta sahifasi. Hatto o'qib chiqmasangiz ham, qaysi yozuv eng muhim ekanini darrov bilib olasiz. Sizningcha, qaysi biri eng muhim?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const LADDER = [
    { n: 1, size: 28, tag: 'eng katta' }, { n: 2, size: 23, tag: '' }, { n: 3, size: 19, tag: '' },
    { n: 4, size: 16.5, tag: '' }, { n: 5, size: 14.5, tag: '' }, { n: 6, size: 13, tag: 'eng kichik' }
  ];
  const LADDER_COMPACT = [
    { n: 1, size: 26, tag: 'eng katta' }, { n: 2, size: 21, tag: '' },
    { ellipsis: true }, { n: 6, size: 13, tag: 'eng kichik' }
  ];
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const done = picked !== null;
  const [revealed, setRevealed] = useState(false);
  const revealRef = useRef(null);
  const G = "Georgia, serif";
  const mctx = useContext(MentorCtx) || {};
  const isNarrow = useIsMobile(768);
  const pick = (v) => {
    if (done) return; setPicked(v); setRevealed(true);
    onAnswer(screen, { correct: true, picked: v });
    audio.triggerEvent('option_picked');
    if (isNarrow && mctx.setCollapsed) mctx.setCollapsed(true);
    setTimeout(() => { if (revealRef.current) revealRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 420);
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Eng katta yozuv eng muhim. HTML'da ham shunday — h1 eng katta va muhim, h6 eng kichik.`); }, 300);
  };
  const showAnswer = done && (!isNarrow || revealed);
  const prevCollapsedRef = useRef(mctx.collapsed);
  useEffect(() => {
    if (isNarrow && done) {
      if (prevCollapsedRef.current && !mctx.collapsed) setRevealed(false);        // Mentor ochildi -> savol
      else if (!prevCollapsedRef.current && mctx.collapsed) setRevealed(true);    // Mentor yopildi -> javob
    }
    prevCollapsedRef.current = mctx.collapsed;
  }, [mctx.collapsed]);
  return (
    <Stage eyebrow="Sarlavhalar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? '✍️ Praktika →' : 'Avval tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Gazetada <span className="italic" style={{ color: T.accent }}>nima</span> darrov ko'zga tashlanadi?</h2></div>
        <Mentor>Mana oddiy gazeta sahifasi. Hatto o'qib chiqmasangiz ham, qaysi yozuv eng muhim ekanini <b style={{ color: T.ink }}>darrov</b> bilib olasiz. Sizningcha, qaysi biri eng muhim?</Mentor>
        <div className="split">
          <div className="col">
            <div className={`news-card frame fade-up delay-1 ${showAnswer ? 'tagged' : ''}`}>
              <p className="eyebrow" style={{ color: T.ink3, margin: '0 0 10px' }}>📰 Gazeta sahifasi</p>
              <div className="news-line news-headline">
                <h3 style={{ fontFamily: G, fontWeight: 700, fontSize: 'clamp(20px,3vw,26px)', lineHeight: 1.15, color: T.ink, margin: 0 }}>Maktabimizda robototexnika to'garagi ochildi</h3>
                <span className="tag-badge accent" style={{ transitionDelay: '0.05s' }}>&lt;h1&gt;</span>
              </div>
              <div className="news-line">
                <p style={{ fontFamily: G, fontWeight: 700, fontSize: 'clamp(15px,2vw,17px)', color: T.ink, margin: 0 }}>Kim qatnashishi mumkin?</p>
                <span className="tag-badge" style={{ transitionDelay: '0.18s' }}>&lt;h2&gt;</span>
              </div>
              <div className="news-line">
                <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,14.5px)', color: T.ink2, margin: 0, lineHeight: 1.5 }}>To'garak har shanba soat 10:00 da. Ro'yxatdan o'tish hammaga ochiq.</p>
                <span className="tag-badge soft" style={{ transitionDelay: '0.31s' }}>&lt;p&gt;</span>
              </div>
              {showAnswer && <p className="news-hint fade-step">↑ Har bir yozuvning o'z "darajasi" bor — eng kattasi <b style={{ color: T.accent }}>&lt;h1&gt;</b>.</p>}
            </div>
          </div>
          <div className="col">
            {!showAnswer ? (
              <>
                <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, qaysi yozuv eng muhim?</p>
                {[{ id: 'a', label: 'Eng katta sarlavha (tepadagi)' }, { id: 'b', label: '«Kim qatnashishi mumkin?»' }].map(o => (
                  <button key={o.id} className="hook-option fade-up delay-3" onClick={() => pick(o.id)}><span className="radio" /><span>{o.label}</span></button>
                ))}
              </>
            ) : (
              <div ref={revealRef} className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12, scrollMarginTop: 16 }}>
                {!isNarrow && <div className="frame-success"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{picked === 'a' ? "✓ To'g'ri" : 'Mana gap'}</p><p className="body" style={{ margin: 0, color: T.ink }}>Eng <b>katta</b> yozuv darrov ko'zga tashlanadi — demak u eng muhim. HTML sarlavhalari ham aynan shunday darajalangan: <b>h1</b> eng katta, <b>h6</b> eng kichik.</p></div>}
                <p className="flow-label">{isNarrow ? 'h1 → h6 — sarlavha darajalari' : 'h1 dan h6 gacha — darajalar narvoni'}</p>
                <div className="ladder ladder-stair">{(isNarrow ? LADDER_COMPACT : LADDER).map((h, i) => h.ellipsis ? (<div key="el" className="hl-row hl-stair" style={{ animationDelay: `${i * 0.1}s`, justifyContent: 'center', padding: '2px 0', background: 'transparent', boxShadow: 'none' }}><span style={{ color: T.ink3, fontSize: 18, letterSpacing: 3 }}>⋮</span></div>) : (<div key={h.n} className="hl-row hl-stair" style={{ animationDelay: `${i * 0.1}s`, marginLeft: isNarrow ? 0 : `${i * 15}px` }}><span className="hl-bar" style={{ opacity: Math.max(0.18, 1 - i * 0.15) }} /><span className="hl-chip">{`<h${h.n}>`}</span><span className="hl-text" style={{ fontSize: h.size }}>Sarlavha</span>{h.tag && <span className="hl-tag">{h.tag}</span>}</div>))}</div>
              </div>
            )}
          </div>
        </div>
        {showAnswer && (<div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> saytingizdagi eng katta sarlavha — bu ismingiz. Demak u <span className="mono">&lt;h1&gt;</span>.</p></div>)}
      </div>
    </Stage>
  );
};


// ===== SCREEN 9 — MATN (Telegram analogiyasi + Mentor) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's9', text: `Telegram'da xabar yozasiz, muhim so'zni belgilab B yoki I bilan formatlaysiz, keyin yuborasiz. Veb-saytda esa xuddi shu ishni HTML tegi qiladi: strong qalin, em yotiq. So'zni bosib belgilang va sinab ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const labels = { imtihon: 'imtihon', albatta: 'Albatta' };
  const [fmt, setFmt] = useState({ imtihon: { b: false, i: false }, albatta: { b: false, i: false } });
  const [sel, setSel] = useState(null);
  const [usedB, setUsedB] = useState(false);
  const [usedI, setUsedI] = useState(false);
  const [sent, setSent] = useState(false);
  const done = usedB && usedI;
  const applyFmt = (k) => { if (!sel) return; setFmt(f => ({ ...f, [sel]: { ...f[sel], [k]: !f[sel][k] } })); if (k === 'b') setUsedB(true); else setUsedI(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);

  // Composer: belgilanadigan + format menyusi chiqadigan so'z
  const chatWord = (id) => (
    <span key={id} className={`tgm-word ${sel === id ? 'sel' : ''} ${fmt[id].b ? 'bold' : ''} ${fmt[id].i ? 'ital' : ''}`} onClick={(e) => { e.stopPropagation(); setSel(id); }}>
      {labels[id]}
      {sel === id && (
        <span className="tgm-menu" onClick={(e) => e.stopPropagation()}>
          <button className={fmt[id].b ? 'on' : ''} onClick={() => applyFmt('b')} title="Qalin"><b>B</b></button>
          <button className={fmt[id].i ? 'on' : ''} onClick={() => applyFmt('i')} title="Yotiq"><i>I</i></button>
        </span>
      )}
    </span>
  );
  // Read-only renderlangan so'z (pufak va sayt uchun)
  const renderWord = (id) => <span key={id} className={`${fmt[id].b ? 'rw-b' : ''} ${fmt[id].i ? 'rw-i' : ''}`}>{labels[id]}</span>;
  const codeWord = (id) => {
    let el = labels[id];
    if (fmt[id].i) el = <><span className="tg">&lt;em&gt;</span>{el}<span className="tg">&lt;/em&gt;</span></>;
    if (fmt[id].b) el = <><span className="tg">&lt;strong&gt;</span>{el}<span className="tg">&lt;/strong&gt;</span></>;
    return el;
  };

  return (
    <Stage eyebrow="Matn" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "✍️ Praktika →" : "B va I ni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }} onClick={() => setSel(null)}>
        <div className="head"><h2 className="title h-title fade-up">Muhim so'zni qanday <span className="italic" style={{ color: T.accent }}>ajratasiz</span>?</h2></div>
        <Mentor>Telegram'da so'zni <b style={{ color: T.ink }}>belgilab</b>, <b style={{ color: T.ink }}>B</b>/<b style={{ color: T.ink }}>I</b> bilan formatlab yuborasiz. Veb-saytda esa o'sha ishni <b style={{ color: T.ink }}>HTML tegi</b> qiladi: <span className="mono">strong</span> — qalin, <span className="mono">em</span> — yotiq.</Mentor>

        <div className="cmp-grid fade-up delay-2">
          {/* TELEGRAM muhiti */}
          <div className="cmp-side">
            <div className="cmp-hd cmp-hd-tg">💬 Telegram</div>
            <div className="tgc-window">
              <div className="tgc-head"><span className="tgc-ava">🧑‍🏫</span><div><p className="tgc-name">Sinfdosh</p><p className="tgc-status">online</p></div></div>
              <div className="tgc-body">
                <div className="tgc-row in"><div className="tgc-bubble in">Ertaga maktabda muhim narsa bormi?</div></div>
                {sent && <div className="tgc-row out"><div className="tgc-bubble out">Ertaga {renderWord('imtihon')} bor! {renderWord('albatta')} keling.<span className="tgc-time">✓✓</span></div></div>}
              </div>
              <div className="tgc-composer" onClick={(e) => e.stopPropagation()}>
                <span className="tgc-cic">😊</span>
                <div className="tgc-input">Ertaga {chatWord('imtihon')} bor! {chatWord('albatta')} keling.</div>
                <button className="tgc-send" onClick={() => setSent(true)} title="Yuborish" aria-label="Yuborish"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" /></svg></button>
              </div>
            </div>
            <p className="tgc-hint">{sel ? '☝️ Ustidagi menyudan B (qalin) yoki I (yotiq) tanlang' : '👆 xabardagi so‘zni bosib belgilang'}</p>
          </div>

          <div className="cmp-vs">=</div>

          {/* VEB-SAYT muhiti */}
          <div className="cmp-side">
            <div className="cmp-hd cmp-hd-html">🌐 Veb-saytda HTML buni teg bilan qiladi</div>
            <div className="bp-window">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">mening-saytim.uz</span></div>
              <div className="cmp-siteview"><p>Ertaga {renderWord('imtihon')} bor! {renderWord('albatta')} keling.</p></div>
            </div>
            <div className="cmp-codeblock">
              <span className="cmp-codelbl">&lt;/&gt; HTML kod</span>
              <pre className="code-box cmp-code"><span className="tg">&lt;p&gt;</span>Ertaga {codeWord('imtihon')} bor! {codeWord('albatta')} keling.<span className="tg">&lt;/p&gt;</span></pre>

              <p className="cmp-leg"><span className="cmp-leg-tag">&lt;strong&gt;</span> — qalin qiladi · <span className="cmp-leg-tag">&lt;em&gt;</span> — yotiq-kursiv qiladi
              </p>
            </div>
          </div>
        </div>

        <div className={`cmp-merge fade-up delay-3 ${done ? 'done' : ''}`}>
          {done ? '✓ ' : ''}Telegramda so‘zni belgilab <b>tugma</b> bosasiz; veb-saytda esa o‘sha so‘z <b>teg</b> ichiga olinadi.
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 10 — RO'YXATLAR (xarid ro'yxati vs retsept + Mentor) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Xarid ro'yxatida tartib muhim emas — non, sut, tuxum, qaysi biri avval bo'lsa ham bari bir. Lekin retseptda qadamlar aniq tartibda. Shuning uchun HTML'da ikki xil ro'yxat bor: ul belgili, tartibsiz uchun; ol raqamli, tartibli uchun. Har bir element esa li.`, trigger: 'on_mount', waits_for: null }]);
  const SHOP = ['Non', 'Sut', 'Tuxum'];
  const RECIPE = ['Limon siqing', 'Shakar soling', 'Suv quying'];
  const isNarrow = useIsMobile(768);
  const gridRef = useRef(null);
  const [phase, setPhase] = useState(0); // 0 = boshlanmagan; >0 = quriladi (key sifatida)
  const startedRef = useRef(false);
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []);
  // Mobilda: kartalarga avtoscroll, so'ng qurilish boshlanadi; desktopda darrov boshlanadi
  useEffect(() => {
    const timers = [];
    if (isNarrow && gridRef.current) timers.push(setTimeout(() => gridRef.current && gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600));
    if (!startedRef.current) { startedRef.current = true; timers.push(setTimeout(() => setPhase(1), isNarrow ? 1000 : 450)); }
    return () => timers.forEach(clearTimeout);
  }, [isNarrow]);
  const replay = () => setPhase(p => p + 1);

  const codeList = (tag, items) => (
    <pre className="code-box cmp2-code"><span className="tg">{`<${tag}>`}</span>{'\n'}{items.map((it, i) => (<React.Fragment key={i}>{'  '}<span className="tg">&lt;li&gt;</span>{it}<span className="tg">&lt;/li&gt;</span>{'\n'}</React.Fragment>))}<span className="tg">{`</${tag}>`}</span></pre>
  );

  return (
    <Stage eyebrow="Ro'yxatlar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext label="✍️ Praktika →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Xarid ro'yxati va retsept — <span className="italic" style={{ color: T.accent }}>farqi</span> nimada?</h2></div>
        <Mentor>Xarid ro'yxatida tartib <b style={{ color: T.ink }}>muhim emas</b> (non, sut — qaysi avval bo'lsa ham bari bir). Retseptda esa qadamlar <b style={{ color: T.ink }}>aniq tartibda</b>. Shuning uchun HTML'da <b style={{ color: T.ink }}>ikki xil</b> ro'yxat bor — pastdan farqini ko'ring.</Mentor>

        <div className="cmp2-grid" ref={gridRef} style={{ scrollMarginTop: 12 }}>
          {/* XARID — ul */}
          <div className="cmp2-card fade-up delay-2">
            <div className="cmp2-hd">🛒 Xarid ro'yxati <span className="cmp2-chip">&lt;ul&gt;</span></div>
            <span className="cmp2-order no">tartib muhim EMAS</span>
            <div className="cmp2-bp">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">xaridlar.uz</span></div>
              <div className="cmp2-site shop">
                <div className="cmp2-top"><span className="cmp2-logo">🛒</span><span className="cmp2-brand">Mahsulotlar</span><span className="cmp2-nav"><span>Bosh</span><span>Savat</span></span></div>
                <div className="cmp2-body">
                  <p className="cmp2-site-h">Bugungi xaridlar</p>
                  <ul className={`cmp2-site-list ul ${phase ? 'play' : ''}`} key={`ul-${phase}`}>{SHOP.map((it, i) => <li key={i} style={{ animationDelay: `${0.15 + i * 0.07}s` }}>{it}</li>)}</ul>
                </div>
              </div>
            </div>
            <div className="cmp2-codewrap">
              <span className="cmp2-pvlbl">&lt;/&gt; HTML kod</span>
              {codeList('ul', SHOP)}
            </div>
          </div>

          {/* RETSEPT — ol */}
          <div className="cmp2-card fade-up delay-3">
            <div className="cmp2-hd">🥤 Limonad retsepti <span className="cmp2-chip">&lt;ol&gt;</span></div>
            <span className="cmp2-order yes">tartib MUHIM</span>
            <div className="cmp2-bp">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">limonad.uz</span></div>
              <div className="cmp2-site lemon">
                <div className="cmp2-top"><span className="cmp2-logo">🥤</span><span className="cmp2-brand">Limonad</span><span className="cmp2-nav"><span>Retseptlar</span></span></div>
                <div className="cmp2-body">
                  <p className="cmp2-site-h">Limonad retsepti</p>
                  <ol className={`cmp2-site-list ol ${phase ? 'play' : ''}`} key={`ol-${phase}`}>{RECIPE.map((it, i) => <li key={i} style={{ animationDelay: `${0.15 + i * 0.42}s` }}>{it}</li>)}</ol>
                </div>
              </div>
            </div>
            <div className="cmp2-codewrap">
              <span className="cmp2-pvlbl">&lt;/&gt; HTML kod</span>
              {codeList('ol', RECIPE)}
            </div>
          </div>
        </div>

        <div className="cmp2-replaywrap">
          <button className="cmp2-replay" onClick={replay}>↻ Qaytadan ko'rsatish</button>
        </div>

        <div className="cmp2-concl fade-up delay-3">
          <p>💡 <b>🛒 ul</b> — belgili (•), tartib muhim emas. <b>🥤 ol</b> — raqamli (1, 2, 3), tartib muhim (limonadda avval shakar, keyin limon bo'lsa — boshqacha chiqadi!). Har bir element — <span className="mono" style={{ color: T.accent }}>&lt;li&gt;</span>.</p>
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 11 — TEST =====
const Screen11 = (props) => (
  <QuestionScreen {...props} idx={11} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?"
    questionText="Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri tegni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?</h2></>}
    options={['<li>', '<ol>', '<ul>', '<a>']} correctIdx={1}
    explainCorrect="To'g'ri. <ol> — ordered list, ya'ni raqamli ro'yxat. Tartib muhim bo'lgan joylarda ishlatiladi."
    explainWrong={{ 2: '<ul> — bu belgili (bullet) ro\u2019yxat. Raqam emas, nuqta chiqaradi.', 0: '<li> — bu alohida element. Avval uni o\u2019rab oluvchi <ol> yoki <ul> kerak.', 3: '<a> — bu havola tegi, ro\u2019yxatga aloqasi yo\u2019q.', default: 'Raqamli ro\u2019yxat uchun <ol> ishlatiladi.' }} />
);

// ===== SCREEN 12 — HAVOLALAR (YouTube analogiyasi + Mentor) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's12', text: `YouTube'da bitta videoni ko'rib bo'lgach, yonidagisiga bosib o'tasiz-ku. O'sha bosish — havola. HTML'da havola a href bilan yasaladi. Quyidagi menyuni bosib, sahifalar o'rtasida yuring.`, trigger: 'on_mount', waits_for: { type: 'link_jumped' } }]);
  const PAGES = {
    bosh: { title: 'Bosh sahifa', file: 'index.html', url: 'sayt.uz', body: "Salom! Bu mening birinchi saytim. O'zim haqimda yozaman.", links: [{ to: 'oyinlar', label: "O'yinlar" }, { to: 'men', label: 'Men haqimda' }] },
    oyinlar: { title: "O'yinlar", file: 'oyinlar.html', url: 'sayt.uz/oyinlar.html', body: "Bo'sh vaqtimda Minecraft va futbol o'ynayman.", links: [{ to: 'minecraft', label: 'Minecraft haqida' }, { to: 'bosh', label: 'Bosh sahifa' }] },
    minecraft: { title: 'Minecraft', file: 'minecraft.html', url: 'sayt.uz/minecraft.html', body: "Minecraft — menga eng yoqadigan o'yin.", links: [{ to: 'oyinlar', label: "O'yinlar" }, { to: 'bosh', label: 'Bosh sahifa' }] },
    men: { title: 'Men haqimda', file: 'men.html', url: 'sayt.uz/men.html', body: "Men CoddyCamp o'quvchisiman. Web-dasturchi bo'lmoqchiman.", links: [{ to: 'bosh', label: 'Bosh sahifa' }] }
  };
  const POS = { bosh: [55, 72], oyinlar: [150, 34], minecraft: [216, 90], men: [108, 122] };
  const EDGES = [['bosh', 'oyinlar'], ['bosh', 'men'], ['oyinlar', 'minecraft']];
  const [page, setPage] = useState('bosh');
  const [jumped, setJumped] = useState(false);
  const done = jumped;
  const [revealed, setRevealed] = useState(false);
  const [travel, setTravel] = useState(null); // havola bo'ylab uchayotgan nuqta
  const travelKey = useRef(0);
  const travelTimer = useRef(null);
  const mctx = useContext(MentorCtx) || {};
  const isNarrow = useIsMobile(768);
  const showResult = !isNarrow || revealed;
  useEffect(() => () => clearTimeout(travelTimer.current), []);
  // Havola bosilganda: nuqta joriy sahifadan manzilga uchadi, so'ng sahifa almashadi
  const go = (to) => {
    if (to === page || travel) return;
    const f = POS[page], t = POS[to];
    setTravel({ fx: `${f[0] / 260 * 100}%`, fy: `${f[1] / 150 * 100}%`, tx: `${t[0] / 260 * 100}%`, ty: `${t[1] / 150 * 100}%`, key: ++travelKey.current });
    clearTimeout(travelTimer.current);
    travelTimer.current = setTimeout(() => {
      setPage(to);
      if (!jumped) { setJumped(true); audio.triggerEvent('link_jumped'); }
      setRevealed(true);
      if (isNarrow && mctx.setCollapsed) mctx.setCollapsed(true);
      setTravel(null);
    }, 480);
  };
  const cur = PAGES[page];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => { if (isNarrow && mctx.collapsed === false) setRevealed(false); }, [mctx.collapsed]);
  return (
    <Stage eyebrow="Havolalar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "✍️ Praktika →" : "Havolani bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir bosishda boshqa sahifaga qanday <span className="italic" style={{ color: T.accent }}>o'tamiz</span>?</h2></div>
        <Mentor>YouTube'da bitta videoni ko'rib bo'lgach, yonidagisiga bosib o'tasiz-ku. O'sha bosish — <b style={{ color: T.ink }}>havola</b>. HTML'da havola <span className="mono">{'<a href="…">'}</span> bilan yasaladi. Menyuni bosib, sahifalar o'rtasida yuring.</Mentor>
        <div className="split">
          <div className="col"><div className="flow-label">Veb — bu "to'r"</div><div className="web fade-up delay-2"><svg className="web-svg" viewBox="0 0 260 150" preserveAspectRatio="none">{EDGES.map(([a, b], i) => { const active = page === a || page === b; return <line key={i} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} stroke={active ? T.accent : T.ink3} strokeWidth={active ? 2 : 1.2} strokeDasharray={active ? '0' : '4 3'} opacity={active ? 1 : 0.6} />; })}</svg>{Object.keys(PAGES).map(k => { const isCur = page === k; const linked = cur.links.some(l => l.to === k); const off = !isCur && !linked; return (<div key={k} className={`web-node ${isCur ? 'on' : ''} ${off ? 'web-node-off' : ''}`} onClick={linked && !isCur ? () => go(k) : undefined} style={{ left: `${POS[k][0] / 260 * 100}%`, top: `${POS[k][1] / 150 * 100}%` }}>{PAGES[k].title}</div>); })}{travel && <div className="web-travel" key={travel.key} style={{ '--fx': travel.fx, '--fy': travel.fy, '--tx': travel.tx, '--ty': travel.ty }} />}</div><p className="web-cap">Har sahifa boshqasiga <b>havola</b> bilan bog'langan. Shu bog'lanishlar <b>"to'r"</b> hosil qiladi — <b>Veb</b> (World Wide Web) shundan nom olgan.</p></div>
          {showResult && (<div className="col">
            {!isNarrow && (<div className="bp-window fade-up delay-2"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-url" key={`u-${page}`}><span className="lock">●</span>{cur.url}</span></div><div className="bp-body pg-in" key={`p-${page}`}><div className="site-top"><span className="site-wordmark">Mening saytim</span><span className="site-tag">o'quvchi · CoddyCamp</span></div><h1 className="pg-h1">{cur.title}</h1><p className="pg-body">{cur.body}</p><div className="pg-divider" /><p className="pg-linklabel">Boshqa sahifalar</p><div className="pg-links">{cur.links.map((l, i) => (<a key={i} className="pg-a" onClick={() => go(l.to)}>{l.label} <span className="arr">→</span></a>))}</div></div></div>)}
            <div className="codecard" key={`c-${page}`}><p className="codecard-top"><span className="dotf" />{cur.file} — havolalar kodi</p><pre className="codeblock">{cur.links.map((l, i) => (<span className="ln" key={i}><span className="tg">&lt;a </span><span className="at">href</span><span className="tx">=</span><span className="st">"{PAGES[l.to].file}"</span><span className="tg">&gt;</span><span className="tx">{l.label}</span><span className="tg">&lt;/a&gt;</span></span>))}</pre><p className="codecap">Har bir havola = bitta <span className="mn">&lt;a&gt;</span> teg.</p></div>
          </div>)}
        </div>
        {showResult && <div className="frame-soft fade-up delay-3" style={{ padding: '9px 15px' }}><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> saytingizga sevimli sayt yoki Telegram kanalingizga havola qo'shasiz.</p></div>}
      </div>
    </Stage>
  );
};


// ===== SCREEN 13 — DEBUGGING (musbat ramka + tuzatish, v16) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `AI kod yozishda zo'r yordamchi — hozir buyruq berib sahifa yasadingiz. Lekin odamlar ham, AI ham ba'zan kichik xato qiladi. Shuni topib tuzatish debugging deyiladi. Endi siz teglarni bilasiz: AI yozgan kodda bitta xato bor — qaysi qatorda? Bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const G = "Georgia, serif";
  const [picked, setPicked] = useState(storedAnswer ? 'h1' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'h1';
  const done = fixed;
  const pickH1 = () => {
    if (found) return; setPicked('h1'); audio.triggerEvent('error_found');
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! h1 ochildi, lekin yopilmadi. Endi yopuvchi tegni qo'shib tuzatamiz.`); }, 300);
  };
  const fix = () => {
    setFixed(true);
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Mana, debugging shunday bo'ladi: xatoni topasiz va to'g'rilaysiz.`); }, 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : (found ? "Endi tuzating" : "Xatoni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI kod yozishda zo'r yordamchi — hozir buyruq berib sahifa yasadingiz-ku. Lekin <b style={{ color: T.ink }}>odamlar ham, AI ham</b> ba'zan kichik xato qiladi. Shuni topib tuzatish — <b style={{ color: T.ink }}>debugging</b> deyiladi, va bu eng zo'r mahorat. Endi siz teglarni bilasiz: AI yozgan kodda bitta xato bor — toping-chi.</Mentor>
        <div className="split">
          <div className="col">
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana, buyrug'ingiz bo'yicha sahifa kodi tayyor!</span></div>
              <div className="ai-code">
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickH1}><span className="tg">&lt;h1&gt;</span>Salom!{fixed && <span className="tg">&lt;/h1&gt;</span>}</div>
                <div className={`ai-line ${picked === 'p' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('p'); }}><span className="tg">&lt;p&gt;</span>Bu mening saytim.<span className="tg">&lt;/p&gt;</span></div>
              </div>
              {!found && <p className="ai-prompt">Xato qaysi qatorda? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Yopuvchi tegni qo'shib tuzatish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi kod to'g'ri!</p>}
            </div>
          </div>
          <div className="col">
            {/* JONLI preview — boshidan BUZUQ ko'rinadi (h1 yopilmagani uchun hammasi katta), tuzatgach to'g'rilanadi */}
            <div className="flow-label">{fixed ? "Endi sahifa to'g'ri ishlaydi" : "Hozir sahifa shunday ko'rinadi"}</div>
            <div className="bp-window fade-up delay-2" style={{ border: `2px solid ${fixed ? T.success : 'rgba(226,72,72,0.5)'}`, transition: 'border-color 0.35s' }}>
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">sahifa.html</span></div>
              <div className="bp-body" style={{ display: 'block' }}>
                {fixed
                  ? (<><h1 key="okh" className="fade-step" style={{ fontFamily: G, fontSize: 'clamp(20px,2.8vw,26px)', color: T.ink, margin: '0 0 6px' }}>Salom!</h1><p style={{ fontFamily: G, color: T.ink2, margin: 0, fontSize: 'clamp(13px,1.8vw,15px)' }}>Bu mening saytim.</p></>)
                  : (<><p style={{ fontFamily: G, fontWeight: 700, fontSize: 'clamp(19px,2.7vw,25px)', color: T.ink, margin: '0 0 6px' }}>Salom!</p><p style={{ fontFamily: G, fontWeight: 700, fontSize: 'clamp(19px,2.7vw,25px)', color: T.ink, margin: 0 }}>Bu mening saytim.</p></>)}
              </div>
            </div>
            <p style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 12.5, color: fixed ? T.success : '#E24848' }}>{fixed ? "✓ endi to'g'ri ko'rinyapti" : "⚠️ ikkala matn ham katta bo'lib ketgan — bitta teg yopilmagan"}</p>
            {!found && (
              picked === 'p'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — <span className="mono">&lt;p&gt;</span> ochildi va <span className="mono">&lt;/p&gt;</span> bilan yopildi. Yana qarang: qaysi teg yopilmagan?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Preview'ga qarang — nega <b style={{ color: T.ink }}>ikkala matn ham katta</b>? Koddan qaysi teg <b style={{ color: T.ink }}>ochilib, yopilmaganini</b> toping.</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">&lt;h1&gt;</span> ochildi, lekin <span className="mono">&lt;/h1&gt;</span> bilan yopilmagan — shu tufayli pastdagi matn ham sarlavhaga qo'shilib ketdi. Chap tomondagi tugmani bosib tuzating →</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topding va tuzatding — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 14 — BUILDER (Mentor + amaliyot) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Mana, vaqti keldi. Bugun o'rgangan teglaringizdan o'z sahifangizni yig'asiz. Buyruq yozing yoki tayyor teglardan tanlang, Yarat tugmasini bosing — kod o'zi paydo bo'ladi. Kamida 3 ta bo'lak qo'shing.`, trigger: 'on_mount', waits_for: null }]);
  const MAX = 6;
  const CHIPS = [{ key: 'h1', label: 'Sarlavha', tag: 'h1' }, { key: 'p', label: 'Matn', tag: 'p' }, { key: 'ul', label: "Ro'yxat", tag: 'ul' }, { key: 'a', label: 'Havola', tag: 'a' }, { key: 'img', label: 'Rasm', tag: 'img' }];
  const detect = (txt) => { const t = (txt || '').toLowerCase(); if (/sarlavha|ism|title|bosh/.test(t)) return 'h1'; if (/rasm|surat|img|foto/.test(t)) return 'img'; if (/ro.?yxat|ruyxat|mashg|list/.test(t)) return 'ul'; if (/havola|sayt|link|url/.test(t)) return 'a'; if (/matn|paragraf|haqim|tavsif|yoz/.test(t)) return 'p'; return null; };
  const elCode = (type) => { switch (type) { case 'h1': return <><Tg>{'<h1>'}</Tg>Mening sahifam<Tg>{'</h1>'}</Tg></>; case 'p': return <><Tg>{'<p>'}</Tg>Men HTML o'rganyapman.<Tg>{'</p>'}</Tg></>; case 'ul': return <><Tg>{'<ul>'}</Tg>{'\n    '}<Tg>{'<li>'}</Tg>Futbol<Tg>{'</li>'}</Tg>{'\n    '}<Tg>{'<li>'}</Tg>Kitob<Tg>{'</li>'}</Tg>{'\n  '}<Tg>{'</ul>'}</Tg></>; case 'a': return <><Tg>{'<a '}</Tg><At>href</At>=<Sr>"coddycamp.uz"</Sr><Tg>{'>'}</Tg>CoddyCamp<Tg>{'</a>'}</Tg></>; case 'img': return <><Tg>{'<img '}</Tg><At>src</At>=<Sr>"rasm.jpg"</Sr><Tg>{'>'}</Tg></>; default: return null; } };
  const ImgPlaceholder = () => (<span style={{ display: 'inline-block', width: 150, height: 96, borderRadius: 10, overflow: 'hidden', border: '1px solid #00000018', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}><svg viewBox="0 0 150 96" width="150" height="96" preserveAspectRatio="none"><defs><linearGradient id="bp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a9def0" /><stop offset="100%" stopColor="#eaf6ee" /></linearGradient></defs><rect width="150" height="96" fill="url(#bp-sky)" /><circle cx="118" cy="26" r="14" fill="#FFD36A" /><ellipse cx="42" cy="22" rx="20" ry="7" fill="#ffffff" opacity="0.8" /><ellipse cx="58" cy="26" rx="14" ry="6" fill="#ffffff" opacity="0.8" /><polygon points="0,96 48,44 88,96" fill="#84b18d" /><polygon points="58,96 104,32 150,96" fill="#5f9a78" /><rect y="84" width="150" height="12" fill="#6f9460" /></svg></span>);
  const elView = (type, i) => { switch (type) { case 'h1': return <h1 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,2.8vw,24px)', margin: '0 0 6px', color: T.ink }}>Mening sahifam</h1>; case 'p': return <p key={i} style={{ fontFamily: 'Georgia, serif', margin: '0 0 6px', color: T.ink, fontSize: 'clamp(13px,1.8vw,15px)' }}>Men HTML o'rganyapman.</p>; case 'ul': return <ul key={i} style={{ fontFamily: 'Georgia, serif', color: T.ink, margin: '0 0 6px', paddingLeft: 22, fontSize: 'clamp(13px,1.8vw,15px)' }}><li>Futbol</li><li>Kitob</li></ul>; case 'a': return <a key={i} style={{ fontFamily: 'Georgia, serif', color: T.link, textDecoration: 'underline', fontSize: 'clamp(13px,1.8vw,15px)', display: 'inline-block', marginBottom: 6 }}>CoddyCamp</a>; case 'img': return <span key={i} style={{ display: 'block', marginBottom: 6 }}><ImgPlaceholder /></span>; default: return null; } };
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [pending, setPending] = useState(null);
  const timer = useRef(null);
  const done = items.length >= 3;
  const generate = (type) => { if (items.length >= MAX || pending) return; setHint(''); setPending(type); clearTimeout(timer.current); timer.current = setTimeout(() => { setItems(prev => [...prev, type]); setPending(null); }, 650); };
  const submit = () => { const type = detect(text); if (!type) { setHint('Tushunmadim 🙂 Mana shulardan yozing: sarlavha, matn, ro\u2019yxat, havola, rasm.'); return; } generate(type); setText(''); };
  const reset = () => { setItems([]); setPending(null); setHint(''); clearTimeout(timer.current); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · sahifa quramiz" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `Kamida 3 ta bo\u2019lak (${items.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Buyruq bering — <span className="italic" style={{ color: T.accent }}>kod o'zi yaraladi</span>.</h2></div>
        <Mentor>Mana, vaqti keldi. Bugun o'rgangan teglaringizdan o'z sahifangizni yig'asiz. Buyruq yozing yoki tayyor teglardan tanlang — <b style={{ color: T.ink }}>"Yarat"</b> bosing, kod o'zi paydo bo'ladi. Kamida 3 ta bo'lak qo'shing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 7 }}>Buyruq yozing</p><div className="prompt-row"><input className="prompt-input" value={text} placeholder="masalan: rasm qo'sh" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} /><button className="prompt-btn" onClick={submit} disabled={!!pending || items.length >= MAX}>Yarat</button></div></div>
            <div className="fade-up delay-2"><p className="flow-label" style={{ margin: '2px 0 7px' }}>yoki tayyor buyruqlardan tanlang</p><div className="chips">{CHIPS.map(c => (<button key={c.key} className="gchip" disabled={items.length >= MAX} onClick={() => { setText(c.label.toLowerCase() + " qo'sh"); setHint(''); }}>{c.label} <span className="gt">&lt;{c.tag}&gt;</span></button>))}{items.length > 0 && <button className="gchip" onClick={reset}>↺ Tozalash</button>}</div></div>
            <p className="body fade-up delay-3" style={{ margin: '2px 0 0', color: T.ink3, fontSize: 13 }}><b style={{ color: T.ink2 }}>Tez tugatdingizmi?</b> 5 xil teg ishlating yoki yangi teg topib sinab ko'ring.</p>
            {hint && <p className="hint fade-step">{hint}</p>}
            {done && (<div style={{ background: T.successSoft, borderLeft: `4px solid ${T.success}`, borderRadius: 12, padding: '12px 15px' }} className="fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Siz <b>buyruq berib</b> sahifa qurdingiz — va kodni o'qib, nima yozilganini tushunasiz.</p></div>)}
          </div>
          <div className="col">
            <div className="flow-label">Kod</div>
            <pre className="code-box"><Tg>{'<body>'}</Tg>{'\n'}{items.length === 0 && !pending && <><span className="cm">{'  <!-- buyruq bering -->'}</span>{'\n'}</>}{items.map((it, i) => (<React.Fragment key={i}>{'  '}{elCode(it)}{'\n'}</React.Fragment>))}{pending && <><span className="gen-line">{'  yaratilmoqda'}</span>{'\n'}</>}<Tg>{'</body>'}</Tg></pre>
            <div className="flow-label">Sahifa</div>
            <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">mening-sahifam.html</span></div><div className="bp-body">{items.length === 0 && !pending ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif' }}>Bo'sh sahifa — buyruq bering...</p> : items.map((it, i) => <span key={i} className="el-in" style={{ display: 'block' }}>{elView(it, i)}</span>)}</div></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN: FLASHCARD TAKRORLASH (yakuniy summarydan oldin) =====
const ScreenFlashcards = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 'sflash', text: `Darsni yakunlashdan oldin, bugun o'rgangan teglarni tez takrorlaymiz. Har kartada bir vazifa — qaysi teg ekanini o'ylang, keyin kartani bosib tekshiring.`, trigger: 'on_mount', waits_for: null }]);
  useEffect(() => { if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, []); // eslint-disable-line
  return (
    <Stage eyebrow="Takrorlash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={false} label="Yakunlash →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Teglarni <span className="italic" style={{ color: T.accent }}>tez takrorlaymiz</span>.</h2></div>
        <Mentor>Darsni yakunlashdan oldin bugun o'rgangan teglarni takrorlaymiz. Har kartada bir vazifa — <b style={{ color: T.ink }}>qaysi teg</b> ekanini o'ylang, keyin kartani bosib tekshiring. <b style={{ color: T.ink }}>Bildim</b> yoki <b style={{ color: T.ink }}>Takrorlash</b> bilan baholang.</Mentor>
        <div className="fc-center"><Flashcards cards={HTML_FLASHCARDS} /></div>
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
  const audio = useAudio([{ id: 's16', text: "Dars yakunlandi. Birinchi saytingizni yasadingiz! Asosiyni eslab qoling: HTML — veb-sahifalar tili, brauzer HTMLni o'qib sahifani ko'rsatadi, teg ochiladi va yopiladi.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['HTML bilan veb-sahifa yasash', 'Sahifa skeletini qurish (head, body)', 'Teglarni ochish va yopish', 'Sarlavha (h1–h6) va matn (strong, em)', "Ro'yxat (ul/ol) va havola (a) qo'shish"];
  const HOMEWORK = [{ b: 'Sarlavha (h1)', t: '— ismingiz' }, { b: '2–3 paragraf', t: "— o'zingiz haqingizda" }, { b: "Ro'yxat", t: "— sevimli mashg'ulotlaringiz" }, { b: 'Havola', t: '— sevimli saytingizga' }];
  const GLOSSARY = [{ b: 'HTML', t: '— veb tili' }, { b: 'Skelet', t: '— DOCTYPE, html, head, body' }, { b: 'Teg', t: '— ochiluvchi/yopiluvchi' }, { b: 'Atribut', t: "— href kabi qo'shimcha" }, { b: 'Teglar', t: '— h1–h6, p, strong, em, ul, ol, li, a' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Keyingi dars →</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Birinchi <span className="italic" style={{ color: T.accent }}>saytingizni</span> yasadingiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Endi o\u2019zingiz veb-sahifa yasay olasiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\u2019ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className={`qz-cta fade-up d2 ${studentLive ? 'ready' : ''}`}>
          <div className="qz-cta-txt">
            <span className="qz-cta-h">🦉 CoddyHoot jangi</span>
            <span className="qz-cta-s">{studentSolo
              ? `${QUIZ_BANK.length} savol · har biriga ${QUIZ_MS / 1000} soniya · mashq rejimi — natija faqat sizga`
              : `${QUIZ_BANK.length} savol · har biriga ${QUIZ_MS / 1000} soniya · tezkorlar podiumga 🏆`}</span>
          </div>
          <button className="qz-cta-btn" disabled={studentWait} onClick={openArena}>
            {studentWait ? '⏳ Mentorni kuting'
              : studentSolo ? "📖 Testni o'zim ishlash"
              : studentLive ? (quizSt === 'done' ? "🏆 Natijalarni ko'rish" : '🔥 Testga kirish!')
              : isMentorL ? (quizSt === 'off' ? '⚔️ Testni ochish' : '⚔️ Davom ettirish')
              : '⚔️ Testni ishlash'}
          </button>
        </div>
        {arena && <QuizArena live={_live || { mode: 'self' }} startSolo={arenaSolo} onClose={() => setArena(false)} />}
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'zingiz haqingizda HTML sahifa yarating:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Avval o'z qo'lingiz bilan yozing — keyin AI'ga tekshirtiring. Tayyor bo'lsa platformaga yuklang — mentor 4 mezon bo'yicha baholaydi.</p></div>
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
        <div className="gloss fade-up d4"><div className="gloss-head" onClick={() => setOpen(o => !o)}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
// Podium yorliqlari (scored indeks -> qisqa nom)
const Q_LABELS = { 4: "Brauzer roli", 6: "Ko'rinadigan matn — body", 8: "Yopuvchi teg (</h1>)", 12: "Raqamli ro'yxat — ol" };

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
const INLINE_KEYS = { s4: 2, s5b: 3, s7: -1, s11: 1 };

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

// ===== 🦉 CODDYHOOT (CoddyCamp jonli test arenasi) =====
const QUIZ_MS = 20000;
const QUIZ_BASE_IDX = 100;
const QUIZ_COLORS = ['#FF5A2C', '#0FA6D6', '#F5A623', '#22A05C']; // CoddyHoot brend palitrasi: coral · ocean · sun · leaf
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
// Arena foni: suzuvchi kod tokenlari (kodlash maktabi hissi)
const QZ_BG_SHAPES = [
  { ch: '</>',  l: 6,  t: 18, s: 40, c: 'rgba(20,17,14,0.05)',   d: 19, dl: 0 },
  { ch: '{ }',  l: 84, t: 12, s: 34, c: 'rgba(20,17,14,0.05)',   d: 23, dl: 1.5 },
  { ch: '<h1>', l: 9,  t: 74, s: 30, c: 'rgba(255,79,40,0.08)',  d: 27, dl: 0.8 },
  { ch: '</ul>',l: 78, t: 70, s: 28, c: 'rgba(20,17,14,0.045)',  d: 21, dl: 2.2 },
  { ch: '//',   l: 46, t: 86, s: 30, c: 'rgba(20,17,14,0.05)',   d: 25, dl: 1.1 },
  { ch: 'href', l: 66, t: 24, s: 22, c: 'rgba(15,166,214,0.09)', d: 17, dl: 0.4 },
  { ch: ';',    l: 24, t: 36, s: 26, c: 'rgba(20,17,14,0.05)',   d: 20, dl: 1.9 },
  { ch: '<a>',  l: 92, t: 46, s: 24, c: 'rgba(34,160,92,0.09)',  d: 24, dl: 1.3 },
  { ch: '<p>',  l: 2,  t: 46, s: 24, c: 'rgba(20,17,14,0.045)',  d: 26, dl: 2.6 },
];
const QUIZ_BANK = [
  { q: "Yopuvchi teg qaysi belgi bilan boshlanadi?", opts: ["/", "\\", "!", "#"], correct: 0 },
  { q: "Sarlavha teglaridan eng KICHIGI qaysi?", opts: ["h1", "h3", "h6", "p"], correct: 2 },
  { q: "Tartibsiz (nuqtali) ro'yxatni qaysi teg boshlaydi?", opts: ["ul", "ol", "li", "a"], correct: 0 },
  { q: "Ro'yxatning har bir bandi qaysi tegga o'raladi?", opts: ["ul", "li", "ol", "dd"], correct: 1 },
  { q: "Havolada (link) manzil qaysi atributga yoziladi?", opts: ["src", "href", "link", "url"], correct: 1 },
  { q: "title tegidagi matn qayerda ko'rinadi?", opts: ["Sahifa o'rtasida", "Brauzer yorlig'ida (tab)", "Tugma ustida", "Hech qayerda"], correct: 1 },
  { q: "Ko'rinmaydigan sozlamalar (title, meta) qaysi qismga yoziladi?", opts: ["body", "head", "p", "h1"], correct: 1 },
  { q: "Matnni QALIN (bold) qilish uchun qaysi teg?", opts: ["strong", "em", "p", "i"], correct: 0 },
  { q: "<!DOCTYPE html> nimani bildiradi?", opts: ["Sahifa rangini", "Bu HTML5 hujjat ekanini", "Rasm qo'shishni", "Sahifani yopishni"], correct: 1 },
  { q: "Sahifa skeletining to'g'ri tartibi qaysi?", opts: ["html ichida head va body", "body ichida html", "head ichida html", "title ichida body"], correct: 0 },
  { q: "HTML kodni o'qib, sahifaga aylantiradigan dastur qaysi?", opts: ["Server", "Brauzer", "Word", "Fayl menejeri"], correct: 1 },
  { q: "Matnni QIYA (kursiv) qilish uchun qaysi teg?", opts: ["em", "ul", "a", "h1"], correct: 0 },
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
        <circle cx="32" cy="32" r={R} fill="none" stroke="#DDE4F1" strokeWidth="6" />
        <circle cx="32" cy="32" r={R} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.4s' }} />
      </svg>
      <span className="qz-timer-n" style={{ color: col }}>{sec}</span>
    </div>
  );
}

// 🦉 CoddyHoot boyqush mascot (brend belgisi)
const QzOwl = ({ size = 72 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="qz-owl">
    <defs><linearGradient id="qzog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A3D" /><stop offset="1" stopColor="#FF4F28" /></linearGradient></defs>
    <rect x="6" y="6" width="88" height="88" rx="24" fill="url(#qzog)" />
    <ellipse cx="50" cy="58" rx="30" ry="30" fill="#fff" />
    <path d="M28 32 L40 44 L24 46 Z" fill="#E23A16" /><path d="M72 32 L60 44 L76 46 Z" fill="#E23A16" />
    <circle cx="38" cy="52" r="13" fill="#fff" stroke="#14110E" strokeWidth="2.5" />
    <circle cx="62" cy="52" r="13" fill="#fff" stroke="#14110E" strokeWidth="2.5" />
    <circle cx="38" cy="53" r="6.5" fill="#14110E" /><circle cx="62" cy="53" r="6.5" fill="#14110E" />
    <circle cx="40" cy="50.5" r="2" fill="#fff" /><circle cx="64" cy="50.5" r="2" fill="#fff" />
    <path d="M44 66 L50 74 L56 66 Z" fill="#FF8A3D" />
    <path d="M30 78 Q50 88 70 78" stroke="#FF8A3D" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

// Jonli fon: suzuvchi uchqunlar + «web» chiziqlari + kod tokenlari (canvas)
function QzFX() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = cv.getContext('2d'); const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 1, H = 1, raf = 0;
    const size = () => { W = cv.width = Math.max(1, cv.offsetWidth * DPR); H = cv.height = Math.max(1, cv.offsetHeight * DPR); };
    size(); window.addEventListener('resize', size);
    const TOK = ['<h1>', '</ul>', '<a>', 'href', '{ }', '//', '<li>', ';'];
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
          <div className="qz-brand"><QzOwl size={74} /><span className="qz-wm">Coddy<span className="qz-wm-h">Hoot</span></span></div>
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
          <div className="qz-brand sm"><QzOwl size={48} /><span className="qz-wm">Coddy<span className="qz-wm-h">Hoot</span></span></div>
          <h2 className="qz-h" style={{ fontSize: 'clamp(20px,3.4vw,30px)' }}>Test yakunlandi! 🎉</h2>
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

// ============================================================
//  PRAKTIKA — KOD COMPILATOR (Htmllesson2 bilan bir xil mexanizm)
//  Har praktika PRACTICE_AFTER[screenIdx] orqali shu ekrandan KEYIN ochiladi.
//  Shartlar C.* bilan HAQIQIY DOM tahlili (regex emas).
//  Indekslar — screens[] massividagi o'rin (0 dan boshlab):
//    9 = Screen8 (Sarlavhalar) · 10 = Screen9 (Matn) · 11 = Screen10 (Ro'yxatlar)
//    13 = Screen12 (Havolalar) · 16 = Screen15 (yakuniy testdan keyin)
// ============================================================

// — P1: sarlavhalar (Screen8 — Sarlavhalar — dan keyin) —
const TASK_HEADINGS = {
  eyebrow: 'Praktika · sarlavha',
  title: "Sarlavha va matn (paragraf) yozing",
  brief: "Sahifaga bosh sarlavha, kichik sarlavha va bir matn (paragraf) qo'shing. To'g'ri bo'lsa o'ngda ko'rinadi va “Davom etish” yonadi.",
  requirements: [
    { id: 'h1', label: '<h1> — bosh sarlavha', check: C.text('h1', "`<h1>` ichiga bosh sarlavha matnini yozing") },
    { id: 'h2', label: '<h2> — kichik sarlavha', check: C.text('h2', "`<h2>` ichiga kichik sarlavha yozing") },
    { id: 'p', label: '<p> — matn (paragraf)', check: C.text('p', "`<p>` ichiga bir-ikki gap yozing") },
  ],
};
const STARTER_HEADINGS = `<!-- Quyidagilarni yozing: -->
<!-- 1) <h1> bosh sarlavha -->

<!-- 2) <h2> kichik sarlavha -->

<!-- 3) <p> matn / paragraf (bir-ikki gap) -->

`;

// — P2: matn (Screen9 — strong/em — dan keyin) —
const TASK_TEXT = {
  eyebrow: 'Praktika · matn',
  title: "Muhim so'zlarni ajrating",
  brief: "Bir jumla yozing. Muhim so'zni <strong> bilan qalin, boshqasini <em> bilan qiya qiling.",
  requirements: [
    { id: 'strong', label: '<strong> — qalin so\'z', check: C.nested('p', 'strong', "`<p>` ichida bitta so'zni `<strong>...</strong>` bilan qalin qiling") },
    { id: 'em', label: '<em> — qiya so\'z', check: C.nested('p', 'em', "`<p>` ichida bitta so'zni `<em>...</em>` bilan qiya qiling") },
  ],
};
const STARTER_TEXT = `<!-- Bir so'zni <strong>qalin</strong>, boshqasini <em>qiya</em> qiling -->
<p>Men dasturlashni yaxshi ko'raman.</p>
`;

// — P3: ro'yxat (Screen10 — Ro'yxatlar — dan keyin) —
const TASK_LIST = {
  eyebrow: 'Praktika · ro\'yxat',
  title: "O'z ro'yxatingizni yasang",
  brief: "Sevimli narsalaringizdan ro'yxat tuzing: ro'yxat qobig'i (ul yoki ol) ichida kamida 3 ta band (li).",
  requirements: [
    { id: 'list', label: '<ul> yoki <ol> — ro\'yxat qobig\'i', check: C.has('ul, ol', "`<ul>` (nuqtali) yoki `<ol>` (raqamli) ro'yxatni qo'shing") },
    { id: 'items', label: 'kamida 3 ta <li> band', check: C.count('li', 3, "Ro'yxat ichiga kamida 3 ta `<li>...</li>` band yozing") },
  ],
};
const STARTER_LIST = `<!-- <ul> yoki <ol> yasang, ichiga kamida 3 ta <li> band -->

`;

// — P4: havola (Screen12 — Havolalar — dan keyin) —
const TASK_LINK = {
  eyebrow: 'Praktika · havola',
  title: "Havola yasang",
  brief: "Boshqa saytga olib boradigan bosiladigan havola qo'shing: href ichida manzil, teg ichida ko'rinadigan matn.",
  requirements: [
    { id: 'href', label: '<a> — href manzil bilan', check: C.attr('a', 'href', "`<a>` da `href=\"https://...\"` manzilni to'ldiring") },
    { id: 'text', label: '<a> — ko\'rinadigan matn', check: C.text('a', "`<a>` ichiga bosiladigan matn yozing (masalan sayt nomi)") },
  ],
};
const STARTER_LINK = `<!-- href ichiga manzil, teg ichiga matn yozing -->
<a href="">Bu yerni bosing</a>
`;

// — P5: yakuniy (Screen13 Debugging dan keyin — Screen15 "ismingizni sarlavha qiling" olib tashlandi) —
const TASK_FINAL = {
  eyebrow: 'Praktika · yakuniy',
  title: "Hammasi birga — o'z sahifangiz",
  brief: "Bugun o'rgangan hamma narsa: sarlavha + matn (paragraf) + ro'yxat + havola. Yetishmayotgan qismlarni o'zingiz to'ldiring.",
  requirements: [
    { id: 'h1', label: '<h1> sarlavha (matn bilan)', check: C.text('h1', "`<h1>` ichiga sarlavha yozing") },
    { id: 'p', label: '<p> — matn (paragraf)', check: C.text('p', "`<p>` ichiga bir-ikki gap yozing") },
    { id: 'li', label: 'ro\'yxatda kamida 2 ta <li>', check: C.count('li', 2, "`<ul>`/`<ol>` ichida kamida 2 ta `<li>` band yozing") },
    { id: 'a', label: '<a> havola — href bilan', check: C.attr('a', 'href', "`<a href=\"...\">matn</a>` havola qo'shing") },
  ],
};
const STARTER_FINAL = `<h1>Men haqimda</h1>

<!-- 1) Bir matn / paragraf <p> yozing -->

<!-- 2) Ro'yxat: <ul> yoki <ol>, ichida <li> bandlar -->

<!-- 3) Havola: <a href="...">matn</a> -->
`;

// Praktika handoff xaritasi: shu ekran INDEKSIDAN keyin qaysi praktika chaqiriladi.
const PRACTICE_AFTER = {
  9:  { task: TASK_HEADINGS, starter: STARTER_HEADINGS },
  10: { task: TASK_TEXT,     starter: STARTER_TEXT },
  11: { task: TASK_LIST,     starter: STARTER_LIST },
  13: { task: TASK_LINK,     starter: STARTER_LINK },
  15: { task: TASK_FINAL,    starter: STARTER_FINAL }, // Screen15 olib tashlandi → yakuniy praktika Debugging (idx 15) dan keyin
};

// ===== 🏅 ACHIEVEMENTS (nishonlar) — dars davomidagi real bosqichlar uchun =====
const ACHIEVEMENTS = {
  skelet:    { icon: '🧲', name: 'Skelet ustasi',     desc: "Sahifa skeletini o'zing yig'ding" },
  firsttag:  { icon: '🏷️', name: 'Birinchi teg',      desc: 'Yopuvchi tegni yozding' },
  debugger:  { icon: '🐞', name: 'Xato ovchisi',      desc: 'Buzuq kodni topib tuzatding' },
  flashcard: { icon: '🃏', name: 'Flashcard usta',    desc: 'Teglarni takrorlading' },
  ace:       { icon: '⭐', name: "A'lochi",           desc: "Barcha testlar to'g'ri" },
  graduate:  { icon: '🏆', name: 'HTML bitiruvchisi', desc: 'Darsni yakunlading' },
};
// Ekran id → nishon (recordAnswer'da avtomatik beriladi)
const ACH_TRIGGERS = { s5: 'skelet', s7: 'firsttag', s13: 'debugger', sflash: 'flashcard' };
function AchToastItem({ ach, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3600); return () => clearTimeout(t); }, []); // eslint-disable-line
  return (
    <div className="ach-toast" onClick={onDone} role="status">
      <span className="ach-toast-shine" />
      <span className="ach-toast-ic">{ach.icon}</span>
      <div className="ach-toast-txt"><span className="ach-toast-lbl">🏅 Yangi nishon!</span><span className="ach-toast-name">{ach.name}</span></div>
    </div>
  );
}
function AchToasts({ toasts, onDone }) {
  return <div className="ach-toasts" aria-live="polite">{toasts.map(t => { const a = ACHIEVEMENTS[t.id]; return a ? <AchToastItem key={t.k} ach={a} onDone={() => onDone(t.k)} /> : null; })}</div>;
}

export default function HtmlLesson({ lang: langProp, onFinished, onPractice }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const [practice, setPractice] = useState(null);   // lokal overlay: { task, starter, done } yoki null
  const [mentorPractice, setMentorPractice] = useState(null); // jonli darsda mentor praktika paneli: { task, starter, fromScreen }
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
  const advance = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  // Praktikani ishga tushiradi: production'da onPractice (LMS), lokalda overlay.
  // fromScreen — praktika QAYSI ekrandan keyin ochilgani; tugatilganda mentor paneli
  // uchun «tugatdim» signali serverga yoziladi (o'quvchi jonli darsda bo'lsa).
  const runPractice = (entry, fromScreen) => {
    const done = () => {
      if (live && live.mode === 'student') live.submitAnswer(PRACTICE_DONE_BASE + fromScreen, `practice-${fromScreen}`, 0, true, 0);
      setPractice(null); advance();
    };
    if (typeof onPractice === 'function') {
      Promise.resolve(onPractice(entry.task)).then(done); // production: LMS compilatori
    } else {
      setPractice({ ...entry, done }); // lokal: overlay compilatori
    }
  };
  // "Davom etish" bosilganda: shu ekrandan keyin praktika bo'lsa — compilatorni ochadi,
  // bajarilgach keyingi ekranga o'tadi. Aks holda oddiy o'tadi.
  const next = () => {
    const entry = PRACTICE_AFTER[screen];
    if (!entry) { advance(); return; }
    if (live && live.mode === 'mentor') {
      // Jonli mentor: avval o'quvchilarni OCHAMIZ (advance → ular praktikani o'z
      // qurilmasida yozadi), so'ng mentor panelida kim tugatganini kuzatadi va
      // «Doskada yozib ko'rsatish» bilan aynan shu mashqni proyektorda yechib beradi.
      setMentorPractice({ ...entry, fromScreen: screen });
      advance();
    } else {
      runPractice(entry, screen); // o'quvchi / self: mashqni o'zi bajaradi
    }
  };
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, data) => {
    setAnswers(a => ({ ...a, [idx]: data }));
    const _m = SCREEN_META[idx];
    if (_m && _m.scored && _m.scope === 'final' && data && data.correct && live.mode === 'student') live.submitAnswer(idx, _m.id, 0, true, 0);
    if (_m && ACH_TRIGGERS[_m.id] && data && data.correct) earn(ACH_TRIGGERS[_m.id]); // 🏅 nishon
  };
  const reset = () => { setAnswers({}); setScreen(0); setPractice(null); setMentorPractice(null); startTimeRef.current = Date.now(); };

  // Javob kaliti: inline testlar + jang savollari (QUIZ_BANK'dan) — mentor ochganda serverga yuklanadi
  const answerKey = { ...INLINE_KEYS, ...Object.fromEntries(QUIZ_BANK.map((q, i) => [`quiz-${i}`, q.correct])) };
  const live = useLiveSession(LESSON_META.lessonId, answerKey);
  const isStudentLive = live.mode === 'student' && live.status !== 'ended' && live.mentorAlive;
  const locked = isStudentLive && (screen + 1 > live.mentorScreen);
  useEffect(() => { live.reportScreen(screen); }, [screen, live.mode, live.pin]); // eslint-disable-line
  // 🏅 Yakuniy ekranga yetganda: bitiruvchi + (hammasi to'g'ri bo'lsa) a'lochi
  useEffect(() => {
    if (screen === TOTAL_SCREENS - 1) {
      earn('graduate');
      const scored = SCREEN_META.map((s, i) => (s.scored ? !!answers[i]?.correct : null)).filter(v => v !== null);
      if (scored.length && scored.every(Boolean)) earn('ace');
    }
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, ScreenSkeletTest, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen14, Screen13, ScreenPodium, ScreenFlashcards, Screen16];
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
        .fade-step { animation: fade-step 0.3s ease-out; }
        /* Kattalashtirish (zoom) — animatsiyani katta ekranda ko'rish */
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: calc(90vh / var(--lz, 1)); overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .hl-sync { border-radius: 4px; padding: 0 2px; animation: hl-sync 0.6s ease; }
        @keyframes hl-sync { 0% { background: ${T.accent}; color: #fff; } 55% { background: ${T.accentSoft}; color: ${T.accent}; } 100% { background: transparent; color: inherit; } }
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
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; }
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
        /* ===== BRAUZER MASHINASI (Screen3) ===== */
        .br-code { display: flex; flex-direction: column; gap: 3px; white-space: normal; }
        .br-line { display: flex; align-items: center; gap: 6px; padding: 3px 7px; border-radius: 6px; border-left: 3px solid transparent; opacity: 0.5; transition: opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease; }
        .br-line.read { opacity: 1; }
        .br-line.now { opacity: 1; background: rgba(255,79,40,0.18); border-left-color: ${T.accent}; }
        .br-caret { width: 9px; flex-shrink: 0; color: ${T.accent}; font-weight: 700; }
        .br-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 90px; height: 100%; text-align: center; color: ${T.ink3}; font-family: 'Manrope'; font-weight: 600; font-size: clamp(12px,1.6vw,13.5px); line-height: 1.4; }
        .br-el { animation: br-pop 0.42s cubic-bezier(.34,1.4,.5,1); }
        @keyframes br-pop { 0% { opacity: 0; transform: translateY(9px) scale(0.82); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .br-controls { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
        .br-status { margin: 4px 0 0; font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.6vw,14px); color: ${T.success}; background: ${T.successSoft}; padding: 9px 13px; border-radius: 11px; animation: fade-step 0.35s ease-out; }

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
        .pv-h1 { font-family: 'Georgia, serif'; font-weight: 700; font-size: clamp(22px,3vw,30px); color: ${T.ink}; margin: 0; animation: tb-pvpop 0.5s cubic-bezier(.34,1.4,.5,1); }

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
        .dd-pool { z-index: 1; } /* sudralgan pool chip slotlar ustida ko'rinsin */
        .dd-done { font-weight: 700; color: ${T.success}; font-size: 14.5px; }
        .dd-wrong { font-weight: 700; color: #E24848; font-size: 13.5px; }

        /* === 🐞 DEBUG CHALLENGE (reusable) === */
        .dbg-box { display: flex; flex-direction: column; border-top: 1.5px dashed ${T.line}; padding-top: 12px; margin-top: 6px; animation: sk-swapin 0.5s cubic-bezier(.34,1.3,.4,1); }
        .dbg { display: flex; flex-direction: column; gap: 10px; }
        .dbg-code { background: ${CODE.bg}; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 10px 26px -14px rgba(${T.shadowBase},0.4); overflow-x: auto; }
        .dbg-line { display: flex; align-items: center; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: clamp(13px,1.8vw,15px); color: ${CODE.text}; padding: 8px 12px; border-radius: 9px; cursor: pointer; border: 1.5px solid transparent; transition: background .15s, border-color .15s; white-space: nowrap; }
        .dbg-line:hover { background: rgba(255,255,255,0.06); }
        .dbg-line.wrong { border-color: #E24848; background: rgba(226,72,72,0.16); animation: dd-shake .4s; }
        .dbg-line.fixed { border-color: ${T.success}; background: rgba(18,169,104,0.16); cursor: default; }
        .dbg-ln { color: ${CODE.comment}; font-size: 12px; min-width: 16px; text-align: right; flex-shrink: 0; }
        .dbg-txt { flex: 1; }
        .dbg-badge { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.success}; background: rgba(18,169,104,0.2); border-radius: 99px; padding: 3px 9px; flex-shrink: 0; }
        .dbg-hint { margin: 0; font-size: 13px; color: ${T.ink3}; font-style: italic; }
        .dbg-ok { font-weight: 700; color: ${T.success}; font-size: 14px; background: ${T.successSoft}; border-radius: 12px; padding: 10px 14px; }

        /* === 🃏 FLASHCARDS (reusable, 3D flip) === */
        .fc-center { display: flex; justify-content: center; padding-top: 4px; }
        .fc { display: flex; flex-direction: column; gap: 11px; max-width: 480px; width: 100%; }
        .fc-top { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Manrope'; font-weight: 700; font-size: 13px; }
        .fc-count { color: ${T.ink2}; } .fc-count b { color: ${T.accent}; font-size: 1.15em; }
        .fc-remain { color: ${T.ink3}; font-size: 12px; }
        .fc-bar { height: 7px; background: ${T.line}; border-radius: 99px; overflow: hidden; }
        .fc-bar-fill { display: block; height: 100%; background: linear-gradient(90deg, #FF8A3D, ${T.accent}); border-radius: 99px; transition: width .4s cubic-bezier(.34,1.2,.4,1); }
        .fc-cardwrap { perspective: 1200px; position: relative; }
        .fc-cardwrap::before, .fc-cardwrap::after { content: ""; position: absolute; left: 0; right: 0; top: 0; bottom: 0; border-radius: 20px; background: ${T.paper}; border: 2px solid ${T.line}; z-index: -1; }
        .fc-cardwrap::before { transform: translateY(7px) scale(0.965); opacity: 0.7; }
        .fc-cardwrap::after { transform: translateY(15px) scale(0.93); opacity: 0.4; }
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
        .fc-btn.again { background: ${T.paper}; border: 1.5px solid ${T.line}; color: ${T.ink}; }
        .fc-btn.ghost { background: ${T.paper}; border: 1.5px solid ${T.line}; color: ${T.ink}; flex: none; align-self: center; padding: 11px 22px; }
        .fc-hint { margin: 0; text-align: center; color: ${T.ink3}; font-style: italic; font-size: 13px; }
        .fc-done { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; background: ${T.successSoft}; border-radius: 18px; padding: 22px; max-width: 480px; }
        .fc-done-emoji { font-size: 40px; }
        .fc-done-h { font-family: 'Manrope'; font-weight: 800; font-size: 20px; color: ${T.success}; margin: 0; }
        .fc-done-s { font-family: 'Manrope'; color: ${T.ink2}; margin: 0 0 8px; font-size: 14px; }

        /* === 🏅 ACHIEVEMENTS === */
        .ach-toasts { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 11000; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
        .ach-toast { position: relative; overflow: hidden; pointer-events: auto; cursor: pointer; display: flex; align-items: center; gap: 12px; background: ${T.paper}; border: 1.5px solid ${T.line}; border-left: 4px solid ${T.accent}; border-radius: 15px; padding: 11px 18px 11px 13px; box-shadow: 0 16px 40px -12px rgba(${T.shadowBase},0.4); animation: ach-in 0.5s cubic-bezier(.34,1.4,.4,1), ach-out 0.4s ease 3.2s forwards; min-width: 236px; }
        @keyframes ach-in { from { opacity: 0; transform: translateY(-26px) scale(0.9); } to { opacity: 1; transform: none; } }
        @keyframes ach-out { to { opacity: 0; transform: translateY(-16px) scale(0.96); } }
        .ach-toast-ic { font-size: 30px; line-height: 1; flex-shrink: 0; animation: ach-pop 0.6s cubic-bezier(.34,1.6,.4,1) 0.1s both; }
        @keyframes ach-pop { 0% { transform: scale(0) rotate(-25deg); } 60% { transform: scale(1.25) rotate(8deg); } 100% { transform: scale(1) rotate(0); } }
        .ach-toast-txt { display: flex; flex-direction: column; gap: 1px; }
        .ach-toast-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: ${T.accent}; }
        .ach-toast-name { font-family: 'Manrope'; font-weight: 800; font-size: 15.5px; color: ${T.ink}; }
        .ach-toast-shine { position: absolute; top: 0; bottom: 0; left: -60%; width: 40%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.6), transparent); transform: skewX(-18deg); animation: ach-shine 1.1s ease 0.35s; }
        @keyframes ach-shine { to { left: 130%; } }
        .ach-coll { display: flex; flex-direction: column; gap: 10px; }
        .ach-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
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
        /* Yuqori paneldagi nishon hisoblagichi */
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

        /* === LADDER (sarlavhalar) === */
        .ladder { display: flex; flex-direction: column; gap: 6px; }
        .hl-row { display: flex; align-items: center; gap: 13px; padding: 9px 14px; border-radius: 10px; cursor: pointer; transition: all 0.18s; background: ${T.paper}; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.12); }
        .hl-row:hover { box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.2); }
        .hl-row.on { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.25); background: ${T.accentSoft}; }
        .hl-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 8px; border-radius: 5px; flex-shrink: 0; }
        .hl-text { font-family: 'Georgia, serif'; font-weight: 700; color: ${T.ink}; line-height: 1; }
        .hl-tag { margin-left: auto; font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; background: ${T.accentSoft}; padding: 3px 9px; border-radius: 99px; }
        /* narvon zinapoya bo'lib, navbatma-navbat tushadi */
        .hl-stair { animation: rung-drop 0.5s cubic-bezier(.34,1.35,.5,1) backwards; }
        @keyframes rung-drop { 0% { opacity: 0; transform: translateY(-16px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .hl-bar { width: 4px; align-self: stretch; border-radius: 99px; background: ${T.accent}; flex-shrink: 0; }
        .hl-note { background: ${T.paper}; border-radius: 10px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .hl-note .nb { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .hl-hint { padding: 10px 2px; }

        /* === MCARD (matn) === */
        /* ===== Telegram muhiti ↔ Veb-sayt (HTML teg) (Screen9) ===== */
        .cmp-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: stretch; }
        .cmp-side { display: flex; flex-direction: column; gap: 10px; background: ${T.paper}; border-radius: 14px; padding: 13px 14px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }
        .cmp-hd { font-family: 'Manrope'; font-weight: 700; font-size: clamp(11.5px,1.5vw,13px); }
        .cmp-hd-tg { color: #5288C1; }
        .cmp-hd-html { color: ${CODE.tag}; }
        .cmp-vs { align-self: center; font-family: 'Manrope'; font-weight: 800; font-size: 24px; color: ${T.ink3}; padding: 0 2px; }
        /* Telegram oynasi */
        .tgc-window { border-radius: 13px; overflow: hidden; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.25); display: flex; flex-direction: column; }
        .tgc-head { background: #5288C1; display: flex; align-items: center; gap: 10px; padding: 9px 13px; }
        .tgc-ava { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .tgc-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: #fff; margin: 0; }
        .tgc-status { font-family: 'Manrope'; font-size: 11px; color: rgba(255,255,255,0.82); margin: 1px 0 0; }
        .tgc-body { background: #D9E2EC; padding: 13px 12px; display: flex; flex-direction: column; gap: 8px; min-height: 92px; }
        .tgc-row { display: flex; }
        .tgc-row.in { justify-content: flex-start; } .tgc-row.out { justify-content: flex-end; }
        .tgc-bubble { position: relative; max-width: 85%; padding: 8px 12px; border-radius: 14px; font-family: 'Manrope'; font-size: clamp(13px,1.8vw,14.5px); line-height: 1.6; color: #16202A; box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
        .tgc-bubble.in { background: #fff; border-bottom-left-radius: 5px; }
        .tgc-bubble.out { background: #E4F7CF; border-bottom-right-radius: 5px; animation: tgc-fly 0.45s cubic-bezier(.34,1.35,.5,1); }
        @keyframes tgc-fly { 0% { opacity: 0; transform: translateY(16px) scale(0.88); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .tgc-time { font-size: 10px; color: #5DA86A; margin-left: 6px; float: right; position: relative; top: 5px; }
        .tgc-composer { display: flex; align-items: center; gap: 9px; background: #fff; padding: 8px 10px; }
        .tgc-cic { font-size: 18px; flex-shrink: 0; }
        .tgc-input { flex: 1; min-width: 0; font-family: 'Manrope'; font-size: clamp(13px,1.8vw,14.5px); color: #16202A; line-height: 2.1; }
        .tgc-send { width: 38px; height: 38px; flex-shrink: 0; border: none; border-radius: 50%; background: #5288C1; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(82,136,193,0.6); transition: transform 0.15s ease; }
        .tgc-send:hover { transform: scale(1.08); }
        .tgc-send:active { transform: scale(0.94); }
        .tgc-send svg { width: 19px; height: 19px; margin-left: 1px; }
        .tgc-hint { font-family: 'Manrope'; font-weight: 600; font-size: 11.5px; color: ${T.ink3}; text-align: center; margin: 0; }
        /* belgilanadigan so'z + format menyusi */
        .tgm-word { position: relative; display: inline-block; cursor: pointer; padding: 0 2px; border-radius: 3px; transition: background 0.15s ease; }
        .tgm-word:hover { background: rgba(82,136,193,0.16); }
        .tgm-word.sel { background: #A8D3FF; }
        .tgm-word.sel::before, .tgm-word.sel::after { content: ''; position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #2F86E0; }
        .tgm-word.sel::before { left: -3px; top: -5px; } .tgm-word.sel::after { right: -3px; bottom: -5px; }
        .tgm-word.bold { font-weight: 800; color: #000; animation: tgm-pop 0.4s cubic-bezier(.34,1.5,.5,1); }
        .tgm-word.ital { font-style: italic; animation: tgm-pop 0.4s cubic-bezier(.34,1.5,.5,1); }
        @keyframes tgm-pop { 0% { transform: scale(1); } 45% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .tgm-menu { position: absolute; bottom: calc(100% + 9px); left: 50%; transform: translateX(-50%); display: flex; gap: 2px; background: #2B3A4A; border-radius: 9px; padding: 3px; box-shadow: 0 8px 18px -5px rgba(0,0,0,0.45); z-index: 6; animation: tgm-menuin 0.16s ease-out; }
        .tgm-menu::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: #2B3A4A; }
        .tgm-menu button { width: 32px; height: 30px; border: none; background: transparent; color: #fff; font-family: 'Georgia, serif'; font-size: 16px; border-radius: 7px; cursor: pointer; transition: background 0.15s ease; }
        .tgm-menu button:hover { background: rgba(255,255,255,0.14); }
        .tgm-menu button.on { background: #5288C1; }
        @keyframes tgm-menuin { 0% { opacity: 0; transform: translateX(-50%) translateY(5px) scale(0.9); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        /* Veb-sayt tomoni */
        .cmp-siteview { padding: 14px 16px; background: #fff; }
        .cmp-siteview p { font-family: 'Georgia, serif'; font-size: clamp(14px,2vw,16px); color: ${T.ink}; margin: 0; line-height: 1.6; }
        .rw-b { font-weight: 800; } .rw-i { font-style: italic; }
        .cmp-codeblock { display: flex; flex-direction: column; gap: 6px; margin-top: 9px; padding-top: 11px; border-top: 1.5px dashed ${T.line}; }
        .cmp-codelbl { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: ${T.ink3}; }
        .cmp-code { margin: 0; font-size: clamp(12px,1.6vw,13.5px) !important; }
        .cmp-leg { margin: 0; font-family: 'Manrope'; font-weight: 500; font-size: clamp(11.5px,1.5vw,13px); color: ${T.ink2}; line-height: 1.5; }
        .cmp-leg-tag { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${CODE.tag}; }
        .cmp-merge { text-align: center; font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.8vw,15px); line-height: 1.5; color: ${T.ink}; background: ${T.accentSoft}; border-radius: 13px; padding: 13px 16px; transition: box-shadow 0.3s ease; }
        .cmp-merge.done { box-shadow: inset 0 0 0 2px ${T.success}55; }
        @media (max-width: 760px) {
          .cmp-grid { grid-template-columns: 1fr; }
          .cmp-vs { transform: rotate(90deg); }
        }

        /* === WHEN / LISTS === */
        .when { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 10px; padding: 11px 15px; }
        .site-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid ${T.ink3}40; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .site-brand { display: inline-flex; align-items: center; gap: 8px; } .site-logo { width: 22px; height: 22px; border-radius: 6px; background: ${T.accent}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 13px; } .site-name { font-family: 'Manrope'; font-weight: 700; color: ${T.ink}; font-size: 14px; }
        .site-nav { display: inline-flex; gap: 11px; font-family: 'Manrope'; font-size: 12px; color: ${T.ink2}; }
        .site-sec { } .site-h3 { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0 0 8px; }
        .site-list { font-family: 'Georgia, serif'; color: ${T.ink}; font-size: clamp(14px,1.8vw,16px); }
        .site-list ul, .site-list ol { padding-left: 24px; } .site-list li { display: list-item; margin: 3px 0; }
        /* ===== ul vs ol yonma-yon farq (Screen10) ===== */
        .cmp2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; align-items: start; }
        .cmp2-card { display: flex; flex-direction: column; gap: 8px; background: ${T.paper}; border-radius: 13px; padding: 12px 13px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); }
        .cmp2-hd { display: flex; align-items: center; gap: 7px; font-family: 'Manrope'; font-weight: 700; font-size: clamp(13px,1.7vw,15px); color: ${T.ink}; }
        .cmp2-chip { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 2px 7px; border-radius: 5px; }
        .cmp2-order { align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.03em; padding: 3px 10px; border-radius: 99px; }
        .cmp2-order.no { color: ${T.ink2}; background: ${T.bg}; box-shadow: inset 0 0 0 1px ${T.line}; }
        .cmp2-order.yes { color: ${T.accent}; background: ${T.accentSoft}; }
        .cmp2-pvlbl { display: block; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; color: ${T.ink3}; margin-bottom: 5px; }
        /* sayt = rangli, brendli klassik saytcha */
        .cmp2-bp { border-radius: 10px; overflow: hidden; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.22), inset 0 0 0 1px ${T.line}; }
        .cmp2-site { background: #fff; }
        .cmp2-top { display: flex; align-items: center; gap: 8px; padding: 8px 11px; }
        .cmp2-site.shop .cmp2-top { background: linear-gradient(135deg, #2FA84F, #46C46A); }
        .cmp2-site.lemon .cmp2-top { background: linear-gradient(135deg, #F2A60C, #FFC93C); }
        .cmp2-logo { width: 22px; height: 22px; border-radius: 7px; background: rgba(255,255,255,0.28); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .cmp2-brand { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; color: #fff; }
        .cmp2-nav { margin-left: auto; display: flex; gap: 10px; font-family: 'Manrope'; font-weight: 600; font-size: 10px; color: rgba(255,255,255,0.92); }
        .cmp2-body { padding: 11px 13px 13px; }
        .cmp2-site-h { font-family: 'Georgia, serif'; font-weight: 700; font-size: clamp(14px,1.9vw,16px); color: ${T.ink}; margin: 0 0 9px; }
        /* klassik ro'yxat — kartochkasiz, oddiy qatorlar */
        .cmp2-site-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
        .cmp2-site-list li { display: flex; align-items: center; gap: 10px; font-family: 'Manrope'; font-weight: 600; font-size: clamp(13.5px,1.8vw,15px); color: ${T.ink}; opacity: 0; }
        .cmp2-site-list.play li { animation: li-build 0.45s cubic-bezier(.34,1.4,.5,1) both; }
        @keyframes li-build { 0% { opacity: 0; transform: translateY(-9px) scale(0.92); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .cmp2-replaywrap { display: flex; justify-content: center; }
        .cmp2-replay { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink2}; background: transparent; border: none; border-radius: 9px; padding: 7px 14px; cursor: pointer; box-shadow: inset 0 0 0 1.5px ${T.line}; transition: all 0.15s ease; }
        .cmp2-replay:hover { box-shadow: inset 0 0 0 1.5px ${T.accent}; color: ${T.accent}; }
        .cmp2-site-list.ul li::before { content: ''; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .cmp2-site.shop .cmp2-site-list.ul li::before { background: #2FA84F; }
        .cmp2-site-list.ol { counter-reset: step; }
        .cmp2-site-list.ol li::before { counter-increment: step; content: counter(step); width: 22px; height: 22px; border-radius: 50%; color: #fff; font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cmp2-site.lemon .cmp2-site-list.ol li::before { background: #F2A60C; }
        .cmp2-codewrap { margin-top: 8px; padding-top: 11px; border-top: 1.5px dashed ${T.line}; }
        .cmp2-code { margin: 0; font-size: clamp(11px,1.4vw,12.5px) !important; }
        .cmp2-concl { background: ${T.accentSoft}; border-radius: 12px; padding: 11px 15px; }
        .cmp2-concl p { margin: 0; font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.7vw,14px); line-height: 1.5; color: ${T.ink}; }
        @media (max-width: 620px) { .cmp2-grid { grid-template-columns: 1fr; } }

        /* === WEB (graf) === */
        .web { position: relative; height: 150px; background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .web-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .web-node { position: absolute; transform: translate(-50%,-50%); font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.ink}; background: ${T.bg}; padding: 5px 10px; border-radius: 99px; cursor: pointer; transition: all 0.2s; white-space: nowrap; box-shadow: 0 3px 8px -3px rgba(${T.shadowBase},0.25); }
        .web-node:hover { transform: translate(-50%,-50%) scale(1.06); }
        .web-node-off { opacity: 0.38; cursor: default; box-shadow: none; }
        .web-node-off:hover { transform: translate(-50%,-50%); }
        .web-node.on { background: ${T.accent}; color: #fff; animation: node-pop 0.4s ease; }
        @keyframes node-pop { 0% { transform: translate(-50%,-50%) scale(1); } 45% { transform: translate(-50%,-50%) scale(1.22); } 100% { transform: translate(-50%,-50%) scale(1); } }
        .web-travel { position: absolute; width: 13px; height: 13px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 12px 3px ${T.accent}; pointer-events: none; z-index: 4; animation: web-fly 0.48s cubic-bezier(.4,0,.25,1) forwards; }
        @keyframes web-fly { 0% { left: var(--fx); top: var(--fy); opacity: 0; transform: translate(-50%,-50%) scale(0.4); } 16% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 84% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 100% { left: var(--tx); top: var(--ty); opacity: 1; transform: translate(-50%,-50%) scale(1); } }
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
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }
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
        /* ===== DINOZAVRNI DASTURLASH O'YINI ===== */
        .rg-scene { position: relative; height: clamp(174px,38.5vw,216px); border-radius: 14px; overflow: hidden; box-shadow: inset 0 0 0 1px ${T.line}; }
        .rg-sky { position: absolute; inset: 0; background: linear-gradient(180deg,#EAF4FB 0%, #F5F9FC 58%); }
        .rg-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 24%; background: linear-gradient(180deg,#DAC79F,#C8AF80); box-shadow: inset 0 2px 0 #E9DAB8; }
        .rg-cell { position: absolute; bottom: 16%; width: 6px; height: 6px; border-radius: 50%; background: rgba(80,60,20,0.18); transform: translateX(-50%); }
        .rg-cactus { position: absolute; bottom: 24%; transform: translateX(-50%); font-size: clamp(24px,5.6vw,36px); line-height: 1; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.18)); z-index: 1; }
        .rg-goal { position: absolute; bottom: 24%; transform: translateX(-50%); font-size: clamp(26px,6vw,38px); line-height: 1; }
        .rg-meat { display: inline-block; animation: rg-bobgoal 1.5s ease-in-out infinite; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.18)); }
        @keyframes rg-bobgoal { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        /* dino yetib kelganda go'shtni "yeydi" — yo'qoladi (uyilib qolmaydi) */
        .rg-meat.eaten { animation: rg-eaten 0.5s ease forwards; }
        @keyframes rg-eaten { 0% { transform: scale(1) rotate(0); opacity: 1; } 55% { transform: scale(1.3) rotate(14deg); opacity: 1; } 100% { transform: scale(0) rotate(45deg); opacity: 0; } }
        .rg-dino { position: absolute; bottom: 24%; transform: translateX(-50%); transition: left 0.55s cubic-bezier(.45,.05,.35,1); z-index: 2; }
        .rg-dino-in { display: inline-block; }
        .rg-dino-face { display: inline-block; transform: scaleX(-1); font-size: clamp(30px,7vw,44px); line-height: 1; filter: drop-shadow(0 3px 3px rgba(0,0,0,0.22)); }
        .rg-dino.running .rg-dino-in:not(.jump) { animation: rg-run 0.32s ease-in-out infinite; }
        @keyframes rg-run { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .rg-dino-in.jump { animation: rg-jump 0.6s cubic-bezier(.3,.05,.3,1); }
        @keyframes rg-jump { 0% { transform: translateY(0); } 45% { transform: translateY(-44px); } 100% { transform: translateY(0); } }
        .rg-dino.win .rg-dino-in { animation: rg-cheer 0.6s ease; }
        @keyframes rg-cheer { 0%,100% { transform: translateY(0) scale(1); } 30% { transform: translateY(-16px) scale(1.12); } 60% { transform: translateY(0) scale(1); } 80% { transform: translateY(-7px); } }
        .rg-dino.fail-cactus .rg-dino-in { animation: rg-shake 0.45s ease; }
        @keyframes rg-shake { 0%,100% { transform: translateX(0) rotate(0); } 20% { transform: translateX(-5px) rotate(-10deg); } 60% { transform: translateX(5px) rotate(10deg); } }
        .rg-burst { position: absolute; left: 50%; top: -20px; transform: translateX(-50%); font-size: clamp(22px,5vw,30px); z-index: 3; animation: rg-pop 0.55s ease; pointer-events: none; }
        @keyframes rg-pop { 0% { opacity: 0; transform: translateX(-50%) scale(0.3); } 50% { opacity: 1; transform: translateX(-50%) scale(1.25); } 100% { opacity: 1; transform: translateX(-50%) scale(1); } }
        /* g'alaba: dino ustida ko'tarilib o'chuvchi 😋 */
        .rg-yum { position: absolute; left: 50%; top: -24px; transform: translateX(-50%); font-size: clamp(18px,4vw,24px); z-index: 3; pointer-events: none; animation: rg-yum 1s ease forwards; }
        @keyframes rg-yum { 0% { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.5); } 25% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } 75% { opacity: 1; transform: translateX(-50%) translateY(-14px) scale(1); } 100% { opacity: 0; transform: translateX(-50%) translateY(-28px) scale(1); } }
        /* g'alaba konfettisi — butun sahna bo'ylab tushadi */
        .rg-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 4; }
        .rg-confetti i { position: absolute; top: -12px; width: 8px; height: 12px; border-radius: 2px; opacity: 0; animation: rg-fall 1.15s ease-in forwards; }
        @keyframes rg-fall { 0% { transform: translateY(-12px) rotate(0); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(160px) rotate(460deg); opacity: 0; } }

        /* DASTUR — kod tahriri ko'rinishi */
        .rg-code { border-radius: 12px; overflow: hidden; background: ${CODE.bg}; box-shadow: 0 8px 22px -8px rgba(${T.shadowBase},0.28); }
        .rg-code-bar { display: flex; align-items: center; gap: 6px; padding: 7px 12px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .rg-dot { width: 9px; height: 9px; border-radius: 50%; background: #4a5568; }
        .rg-dot:nth-child(1) { background: #FF5F57; } .rg-dot:nth-child(2) { background: #FEBC2E; } .rg-dot:nth-child(3) { background: #28C840; }
        .rg-code-name { margin-left: 8px; font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; }
        .rg-code-body { padding: 9px 10px; display: flex; flex-direction: column; gap: 2px; min-height: 92px; }
        .rg-code-empty { font-family: 'JetBrains Mono'; font-size: 12.5px; color: ${CODE.comment}; padding: 6px 8px; }
        .rg-line { display: flex; align-items: center; gap: 10px; padding: 4px 8px; border-radius: 6px; border-left: 3px solid transparent; transition: background 0.25s ease, border-color 0.25s ease; }
        .rg-line.now { background: rgba(255,79,40,0.18); border-left-color: ${T.accent}; }
        .rg-ln { font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; width: 14px; text-align: right; flex-shrink: 0; }
        .rg-call { font-family: 'JetBrains Mono'; font-size: 13.5px; }
        .rg-fn { color: ${CODE.tag}; font-weight: 600; }
        .rg-paren { color: ${CODE.punct}; }
        .rg-cmt { font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; margin-left: auto; }
        .rg-line.now .rg-cmt { color: ${CODE.text}; }

        /* Buyruq tugmalari (control pad) */
        .rg-pad { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rg-key { display: inline-flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 15px; color: ${T.ink}; border: none; border-radius: 12px; padding: 11px 20px; cursor: pointer; transition: transform 0.13s ease, box-shadow 0.13s ease, opacity 0.2s ease; }
        .rg-key-ic { font-size: 19px; line-height: 1; }
        .rg-key-yur { background: linear-gradient(180deg,#EAF7EE,#DAEFE2); box-shadow: 0 5px 14px -6px rgba(15,140,90,0.45), inset 0 0 0 1.5px #C2E6D2; }
        .rg-key-jump { background: linear-gradient(180deg,#FFEDE5,#FFDFD2); box-shadow: 0 5px 14px -6px rgba(255,79,40,0.42), inset 0 0 0 1.5px #FFCDBA; }
        .rg-key:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 9px 20px -7px rgba(${T.shadowBase},0.32); }
        .rg-key:active:not(:disabled) { transform: translateY(0); }
        .rg-key:disabled { opacity: 0.5; cursor: default; }
        .rg-legend { font-family: 'Manrope'; font-weight: 500; font-size: clamp(11.5px,1.5vw,13px); color: ${T.ink3}; margin-left: 4px; }
        .rg-legend b { color: ${T.ink2}; font-weight: 700; }
        .rg-run-row { display: flex; align-items: center; gap: 10px; }
        .rg-mini { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink2}; background: transparent; border: none; border-radius: 10px; padding: 9px 14px; cursor: pointer; box-shadow: inset 0 0 0 1.5px ${T.line}; transition: all 0.15s ease; }
        .rg-mini:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px ${T.ink3}; }
        .rg-mini:disabled { opacity: 0.45; cursor: default; }

        .rg-msg { margin: 0; font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.7vw,14.5px); line-height: 1.45; padding: 10px 14px; border-radius: 11px; animation: fade-step 0.32s ease-out; }
        .rg-msg.idle { color: ${T.ink2}; background: ${T.bg}; }
        .rg-msg.ok { color: ${T.success}; background: ${T.successSoft}; }
        .rg-msg.bad { color: ${T.accent}; background: ${T.accentSoft}; }

        /* Yashil xulosa */
        .rg-xulosa { display: flex; align-items: flex-start; gap: 13px; background: ${T.successSoft}; border-radius: 14px; padding: 15px 17px; box-shadow: inset 0 0 0 1.5px rgba(15,140,90,0.22); }
        .rg-xulosa-ic { font-size: 24px; line-height: 1; flex-shrink: 0; }
        .rg-xulosa .xh { font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.success}; text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 4px; }
        .rg-xulosa .xb { font-family: 'Manrope'; font-size: clamp(13.5px,1.8vw,15px); color: ${T.ink}; line-height: 1.5; margin: 0; }
        /* SCREEN 6 — Teg (qo'shtirnoq modeli) */
        .pv-plain { font-family: 'Georgia, serif'; font-size: 14px; color: ${T.ink3}; margin: 0; }
        .tegbuild-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 0 16px; }
        .tegbuild { display: flex; align-items: center; justify-content: center; gap: 5px; min-height: 84px; }
        .tegbuild.on { gap: 4px; }
        .tb-chip { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 13px 16px; border-radius: 11px; transition: transform 0.6s cubic-bezier(.34,1.45,.4,1), opacity 0.45s ease, box-shadow 0.3s ease; cursor: default; }
        .tegbuild.on .tb-chip { cursor: pointer; }
        .tb-tag { background: ${CODE.bg}; } .tb-content { background: ${T.accentSoft}; }
        .tb-code { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(16px,2.4vw,20px); }
        .tb-tag .tb-code { color: ${CODE.tag}; } .tb-content .tb-code { color: ${T.accent}; }
        .tb-slash { color: ${CODE.attr}; display: inline-block; }
        .tegbuild.on .tb-slash { animation: slashpulse 1.3s ease-in-out 0.7s 2; }
        @keyframes slashpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.5); } }
        .tb-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: ${T.ink3}; transition: opacity 0.3s 0.4s; }
        /* teglar navbatma-navbat (chap, keyin o'ng) sakrab kelib qamraydi */
        .tb-open { transition-delay: 0.04s; }
        .tb-close { transition-delay: 0.18s; }
        .tb-open.hide { transform: translateX(-96px) scale(0.55) rotate(-9deg); opacity: 0; }
        .tb-close.hide { transform: translateX(96px) scale(0.55) rotate(9deg); opacity: 0; }
        .tegbuild:not(.on) .tb-tag .tb-lbl { opacity: 0; }
        .tb-chip.active { box-shadow: 0 0 0 2px ${T.accent}; }
        /* kontent qamrab olinganda sakraydi va apelsin yonadi */
        .tegbuild.on .tb-content { animation: tb-capture 0.6s cubic-bezier(.34,1.45,.5,1) 0.46s; }
        @keyframes tb-capture { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,79,40,0); } 45% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(255,79,40,0.3); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,79,40,0); } }
        .tb-bracket { display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.3s 0.6s; }
        .tegbuild-wrap.on .tb-bracket { opacity: 1; }
        .tb-brace { width: 150px; max-width: 70%; height: 9px; border: 1.5px solid ${T.ink3}; border-top: none; border-radius: 0 0 9px 9px; transform: scaleX(0); transform-origin: center; transition: transform 0.45s cubic-bezier(.34,1.2,.5,1) 0.6s; }
        .tegbuild-wrap.on .tb-brace { transform: scaleX(1); }
        .tb-brace-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink2}; }
        @keyframes tb-pvpop { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
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
        /* Mentor praktika paneli (jonli) */
        .mp-overlay { position: fixed; inset: 0; z-index: 2000; background: ${T.bg}; display: flex; align-items: center; justify-content: center; padding: clamp(16px,3vw,34px); overflow: auto; }
        .mp-card { width: 100%; max-width: 640px; background: ${T.paper}; border-radius: 22px; padding: clamp(22px,3.4vw,36px); box-shadow: 0 24px 60px -24px rgba(${T.shadowBase},0.4); display: flex; flex-direction: column; gap: 14px; animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        .mp-eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.accent}; }
        .mp-title { font-family: 'Source Serif 4', Georgia, serif; font-weight: 600; font-size: clamp(22px,3.2vw,30px); color: ${T.ink}; margin: 0; line-height: 1.15; }
        .mp-brief { margin: 0; font-size: clamp(13.5px,1.8vw,15px); line-height: 1.55; color: ${T.ink2}; }
        .mp-flow { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 2px 0 4px; }
        .mp-step { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: ${T.ink2}; background: rgba(${T.shadowBase},0.06); border-radius: 99px; padding: 6px 13px; }
        .mp-step.cur { color: ${T.success}; background: ${T.successSoft}; }
        .mp-arr { color: ${T.ink3}; font-weight: 700; }
        .mp-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
        .mp-demo { flex: 1; min-width: 200px; padding: 14px 20px; border: none; border-radius: 14px; background: ${T.ink}; color: ${T.paper}; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 10px 26px -10px rgba(${T.shadowBase},0.4); transition: transform 0.15s; }
        .mp-demo:hover { transform: translateY(-2px); }
        .mp-next { flex: 1; min-width: 160px; padding: 14px 20px; border: 1.5px solid rgba(${T.shadowBase},0.16); border-radius: 14px; background: ${T.paper}; color: ${T.ink}; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.15s; }
        .mp-next:hover { border-color: ${T.accent}; color: ${T.accent}; }
        .mp-tip { margin: 2px 0 0; font-size: 12.5px; line-height: 1.5; color: ${T.ink3}; }
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
        /* ===== 🦉 CODDYHOOT — CTA (dars ichida) ===== */
        .qz-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: linear-gradient(135deg, #FFF3EA, #FFE7DC); border: 1px solid #F3D9CC; border-radius: 20px; padding: clamp(16px,2.4vw,22px) clamp(18px,2.6vw,26px); box-shadow: 0 16px 40px -18px rgba(255,79,40,0.28); }
        .qz-cta-txt { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 3px; }
        .qz-cta-h { font-family: 'Manrope'; font-weight: 800; font-size: clamp(16px,2.2vw,20px); color: #121826; }
        .qz-cta-s { font-family: 'Manrope'; font-weight: 500; font-size: 13px; color: #525A6B; }
        .qz-cta-btn { background: linear-gradient(170deg,#FF8A3D,#FF4F28); color: #fff; border: none; border-radius: 14px; padding: 13px 24px; font-family: 'Manrope'; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 12px 24px -8px rgba(255,79,40,0.6); transition: transform 0.2s; }
        .qz-cta-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
        .qz-cta-btn:disabled { background: #E9E6DF; color: #98A0B4; cursor: default; box-shadow: none; }
        .qz-cta.ready .qz-cta-btn { animation: qz-pulse 1.1s ease-in-out infinite; }
        @keyframes qz-pulse { 0%,100% { transform: scale(1); box-shadow: 0 12px 24px -8px rgba(255,79,40,0.6); } 50% { transform: scale(1.06); box-shadow: 0 16px 34px -6px rgba(255,79,40,0.9); } }
        /* ===== 🦉 ARENA — issiq CoddyCamp muhiti ===== */
        .qz-arena { position: fixed; inset: 0; z-index: 10500; overflow-y: auto; display: flex; align-items: flex-start; justify-content: center; padding: clamp(18px,4vw,44px) clamp(12px,3vw,32px); background: radial-gradient(60% 45% at 12% 8%, rgba(255,79,40,0.10) 0%, rgba(255,79,40,0) 55%), radial-gradient(58% 48% at 90% 14%, rgba(15,166,214,0.16) 0%, rgba(15,166,214,0) 55%), radial-gradient(60% 50% at 78% 100%, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0) 60%), radial-gradient(80% 48% at 50% -6%, #E9F0FD 0%, rgba(233,240,253,0) 52%), #F0F4FC; }
        .qz-arena::before { content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: radial-gradient(rgba(30,44,80,0.05) 1.1px, transparent 1.2px); background-size: 24px 24px; -webkit-mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); mask-image: radial-gradient(120% 90% at 50% 20%, #000 40%, transparent 82%); }
        .qz-bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .qz-shp { position: absolute; line-height: 1; user-select: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; animation: qz-drift ease-in-out infinite; will-change: transform; }
        @keyframes qz-drift { 0%,100% { transform: translate(0,0) rotate(-6deg) scale(1); } 50% { transform: translate(18px,-24px) rotate(6deg) scale(1.05); } }
        .qz-fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .qz-shp { animation: none; } }
        .qz-x { position: fixed; top: 14px; right: 16px; z-index: 10600; width: 38px; height: 38px; border-radius: 50%; border: 1px solid #DDE4F1; background: #fff; color: #525A6B; font-size: 16px; cursor: pointer; box-shadow: 0 6px 16px -8px rgba(30,44,80,0.4); transition: transform 0.25s, color 0.2s; }
        .qz-x:hover { color: #121826; transform: rotate(90deg); }
        .qz-view { position: relative; z-index: 1; width: 100%; max-width: 820px; display: flex; flex-direction: column; align-items: center; gap: clamp(14px,2.4vw,22px); margin: auto; }
        .qz-brand { display: flex; align-items: center; gap: 12px; }
        .qz-brand.sm { gap: 9px; }
        .qz-owl { filter: drop-shadow(0 8px 18px rgba(255,79,40,0.32)); }
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
        .qz-brow.me { background: linear-gradient(90deg,#FFEBE1,rgba(255,235,225,0.4)); outline: 1.5px solid rgba(255,79,40,0.4); }
        .qz-brank { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; color: #fff; background: #98A0B4; border-radius: 8px; min-width: 23px; height: 23px; display: flex; align-items: center; justify-content: center; }
        .qz-brow:first-of-type .qz-brank { background: #FFCE3D; color: #121826; }
        .qz-brow.me .qz-brank { background: #FF4F28; }
        .qz-bname { flex: 1; min-width: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14.5px; color: #121826; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-bstreak { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: #FF8A3D; }
        .qz-bok { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: #525A6B; }
        .qz-bpts { font-family: 'Manrope'; font-weight: 800; font-size: 15px; color: #FF4F28; min-width: 52px; text-align: right; font-variant-numeric: tabular-nums; }
        .qz-pod { display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px,2.4vw,24px); padding-top: 18px; }
        .qz-pod-col { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; width: clamp(92px,24vw,170px); }
        .qz-crown { position: absolute; top: -30px; font-size: 28px; animation: qz-float-sm 2s ease-in-out infinite; }
        @keyframes qz-float-sm { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }
        .qz-pod-medal { font-size: clamp(30px,5vw,46px); line-height: 1; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.16)); }
        .qz-pod-name { font-family: 'Manrope'; font-weight: 800; font-size: clamp(14px,2vw,18px); color: #121826; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .qz-pod-pts { font-family: 'Manrope'; font-weight: 600; font-size: clamp(11px,1.5vw,13px); color: #525A6B; font-variant-numeric: tabular-nums; }
        .qz-pod-bar { width: 100%; border-radius: 14px 14px 0 0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.45); animation: qz-rise 0.9s cubic-bezier(.3,1.2,.4,1); transform-origin: bottom; }
        @keyframes qz-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .qz-pod-col.p1 .qz-pod-bar { height: clamp(96px,14vw,156px); background: linear-gradient(180deg, #FFCE3D, #F5A623); box-shadow: inset 0 2px 0 rgba(255,255,255,0.5), 0 0 40px rgba(245,166,35,0.35); }
        .qz-pod-col.p2 .qz-pod-bar { height: clamp(66px,10vw,110px); background: linear-gradient(180deg, #D6D9E0, #A2A8B4); }
        .qz-pod-col.p3 .qz-pod-bar { height: clamp(48px,7vw,82px); background: linear-gradient(180deg, #EDB183, #CB8149); }
        .qz-pod-col.me .qz-pod-name { color: #FF4F28; }
        .qz-mypl { margin: 0; font-family: 'Manrope'; font-size: 15px; color: #525A6B; }
        .qz-mypl b { color: #FF4F28; }
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
            </>
          )}
        </div>
        </AchCtx.Provider>
      </LiveGateCtx.Provider>
      {/* Lokal praktika overlay (LMS compilatorining o'rnini bosadi — test rejimi).
          Production'da onPractice berilsa, bu overlay umuman ochilmaydi. */}
      {practice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: T.bg }}>
          <HtmlCompiler
            task={practice.task}
            starterCode={practice.starter}
            onContinue={practice.done}
            onBack={() => setPractice(null)}
          />
        </div>
      )}
      {/* Jonli darsda mentor praktika paneli — o'quvchilar yozadi, keyin mentor doskada ko'rsatadi */}
      {mentorPractice && (
        <MentorPracticeOverlay entry={mentorPractice} live={live} onClose={() => setMentorPractice(null)} />
      )}
    </LangContext.Provider>
  );
}