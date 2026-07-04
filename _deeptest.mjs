import { chromium } from 'playwright-core';
const LESSONS = [
  ['internet','internet-01-v17',null], ['pm','pm-audience-01-v17',null],
  ['m1-03','html-01-v17','<h1>Salom</h1>'], ['m1-05','pm-structure-02-v17',null],
  ['m1-06','css-01-v17','h1 { color: red; }'], ['m1-07','css-02-v17','.box { display: flex; }'],
  ['m1-09','git-github-01-v17','git commit -m "test"'], ['m1-11','deploy-01-v17','aziza.maktab.uz'],
  ['m1-12','pm-pitch-03-v17',null],
  ['m2-01','js-intro-01-v17',null], ['m2-02','pm-problem-solution-04-v17',null],
  ['m2-03','js-vars-01-v17','let ball = 5'], ['m2-04','js-cond-01-v17','if (ball > 5) {'],
  ['m2-05','js-loops-01-v17','for (let i = 0; i < 3; i++) {'], ['m2-06','js-functions-01-v17','function kvadrat(n) { return n * n }'],
  ['m2-07','pm-decomposition-05-v17',null], ['m2-08','practice-01-jonlantirish-v17',null],
  ['m2-09','practice-02-ai-promo-v17',null], ['m2-10','pean-stack-01-v17',null],
  ['m2-11','practice-03-decompose-v17',null], ['m2-12','practice-04-mvp-deploy-v17',null],
  ['m2-13','pm-demoday-pitch-06-v17',null],
];
const ALLIDS = LESSONS.map(l => l[1]);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
async function testOne([key, lid, finalInput]) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((ids) => ids.forEach(id => localStorage.setItem('liveSession:'+id, '{"mode":"self"}')), ALLIDS);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR: '+String(e.message).slice(0,90)));
  page.on('console', m => { if (m.type()==='error'){ const t=m.text(); if(!/favicon|Download the React|Failed to load resource|net::ERR|preload/i.test(t)) errs.push(t.slice(0,90)); }});
  let maxScreen=0, reachedEnd=false;
  try {
    await page.goto('http://localhost:5300/#/lesson/'+key, { waitUntil:'domcontentloaded', timeout:12000 });
    await page.waitForTimeout(350);
    for (let step=0; step<40; step++) {
      await page.waitForTimeout(55);
      const body = await page.locator('.lesson-root').innerText().catch(()=>'');
      const m = body.match(/(\d+)\s*\/\s*(\d+)/); if (m) maxScreen=Math.max(maxScreen,+m[1]);
      if (/Mustahkamlash testi|Yakunlash|Dars tugadi|Uyga vazifa/i.test(body)) { reachedEnd=true; break; }
      const inputs = page.locator('.lesson-root input[type="text"], .lesson-root input:not([type]):not([type="password"]), .lesson-root textarea');
      const ni = await inputs.count();
      for (let i=0;i<ni;i++){ const el=inputs.nth(i); if(await el.isVisible().catch(()=>0)){ const v=await el.inputValue().catch(()=>'x'); if(!v||v.length<3){ await el.fill(finalInput||'Test javob bu yerda uzun').catch(()=>{});} } }
      const next = page.getByRole('button', { name: /Davom etish|Yakunlash|Testni ishlash|Testga kirish|Testni ochish/ }).first();
      if (await next.count() && await next.isEnabled().catch(()=>0)) { await next.click().catch(()=>{}); continue; }
      const opts = page.locator('.option'); const no=await opts.count(); let clicked=false;
      if (no){ for(let i=0;i<no;i++){ await opts.nth(i).click().catch(()=>{}); await page.waitForTimeout(55); if(await page.getByRole('button',{name:/Davom etish/}).first().isEnabled().catch(()=>0)){clicked=true;break;} } if(clicked)continue; }
      const btns = page.locator('.lesson-root button:not([disabled])'); const nb=await btns.count(); let did=false;
      for(let i=0;i<Math.min(nb,5);i++){ const t=(await btns.nth(i).innerText().catch(()=>''))||''; if(/Orqaga|Bosh sahifa|Qaytadan/.test(t))continue; await btns.nth(i).click().catch(()=>{}); did=true; }
      if(!did) break;
    }
  } catch(e){ errs.push('NAV: '+String(e.message).slice(0,50)); }
  await ctx.close();
  return { key, lid, errs:[...new Set(errs)], maxScreen, reachedEnd };
}
const results=[];
for (let i=0;i<LESSONS.length;i+=6){ results.push(...await Promise.all(LESSONS.slice(i,i+6).map(testOne))); }
await browser.close();
let bad=0;
for(const r of results){ const ok=r.errs.length===0; if(!ok)bad++; console.log(`${ok?'OK':'FAIL'} ${r.key} (${r.lid}) ekran>=${r.maxScreen}${r.reachedEnd?' yakunOK':''}${r.errs.length?' XATO: '+r.errs.slice(0,2).join(' | '):''}`); }
console.log(bad?`${bad} darsda console xato`:'HAMMASI CONSOLE-TOZA');
