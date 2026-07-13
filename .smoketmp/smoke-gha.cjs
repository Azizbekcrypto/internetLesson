const { JSDOM } = require('jsdom');

function run(label, storeVal) {
  return new Promise((resolve) => {
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.com', pretendToBeVisual: true });
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    const store = {};
    if (storeVal) store['liveSession:github-actions-4c-02-v18'] = JSON.stringify(storeVal);
    global.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; }
    };
    global.HTMLElement = dom.window.HTMLElement;
    global.MouseEvent = dom.window.MouseEvent;
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    global.fetch = async (url) => ({ ok: true, json: async () => ({}) });
    global.window.fetch = global.fetch;

    let errCount = 0;
    const errors = [];
    const origError = console.error;
    console.error = (...args) => { errCount++; errors.push(args.map(String).join(' ')); };

    delete require.cache[require.resolve('/home/kali/Desktop/InternetLesson/.smoketmp/gha-bundle.cjs')];
    delete require.cache[require.resolve('react')];
    delete require.cache[require.resolve('react-dom/client')];
    const React = require('react');
    const { createRoot } = require('react-dom/client');
    const mod = require('/home/kali/Desktop/InternetLesson/.smoketmp/gha-bundle.cjs');
    const Lesson = mod.default;

    const container = document.getElementById('root');
    const root = createRoot(container);
    let thrown = null;
    try { root.render(React.createElement(Lesson, { lang: 'uz' })); }
    catch (e) { thrown = e; }

    function progressLabel() {
      const els = Array.from(document.querySelectorAll('.mono.small'));
      const el = els.find(e => /\d+\s*\/\s*\d+/.test(e.textContent));
      return el ? el.textContent.trim() : null;
    }
    function clickAllOptions() {
      const opts = Array.from(document.querySelectorAll('.option'));
      const avail = opts.filter(b => !b.disabled);
      if (avail.length) { try { avail[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); } catch(e){} return true; }
      return false;
    }
    function clickCheckboxLikeToggles() {
      // Screen17 route builder chips - try clicking elements with class containing 'chip' or 'gchip' or 'tree-row'
      const chips = Array.from(document.querySelectorAll('.gchip, .tree-row, .dd-chip'));
      const avail = chips.filter(c => !c.disabled);
      avail.slice(0, 3).forEach(c => { try { c.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); } catch(e){} });
    }

    setTimeout(() => {
      if (thrown) { console.log(`[${label}] THROW ON MOUNT:`, thrown); resolve({ label, ok: false, thrown: String(thrown) }); return; }
      let clicks = 0;
      const maxClicks = 90;
      const seen = new Set();
      function step() {
        const p = progressLabel();
        if (p) seen.add(p);
        clickAllOptions();
        if (clicks % 5 === 0) clickCheckboxLikeToggles();
        const btns = Array.from(document.querySelectorAll('button'));
        const nextRe = /Davom etish|keyingi|Boshlash|Keyingisiga|Sinab ko|Boshlaymiz|Tugatish|Yakunlash|Lentani|Sababni|Yopish|Yo.l xaritangizni|Lentaga qo|→/i;
        let target = btns.find(b => !b.disabled && nextRe.test((b.textContent||'').trim()));
        if (!target) {
          // click any enabled, visible, non-back, non-destructive button to unlock next
          target = btns.find(b => {
            if (b.disabled) return false;
            const t = (b.textContent || '').trim();
            if (t === 'Orqaga') return false;
            if (/Erkin qilish|Mentor kodi|kirish/i.test(t)) return false;
            return true;
          });
        }
        if (target) {
          try { target.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }
          catch (e) { errors.push('CLICK THROW: ' + e.message); errCount++; }
        }
        clicks++;
        if (clicks < maxClicks) setTimeout(step, 25);
        else finish();
      }
      function finish() {
        console.log(`[${label}] steps=${clicks} progressSeen=${JSON.stringify(Array.from(seen).sort())} errCount=${errCount}`);
        if (errCount > 0) console.log(`[${label}] ERRORS:`, errors.slice(0, 8));
        console.error = origError;
        resolve({ label, ok: errCount === 0, errCount, lastProgress: progressLabel(), seenCount: seen.size });
      }
      setTimeout(step, 60);
    }, 100);
  });
}

(async () => {
  const r1 = await run('SELF-STUDY', { mode: 'self' });
  console.log('---');
  const r2 = await run('MENTOR', { mode: 'mentor', pin: '123456', token: 'tok-test' });
  console.log('---');
  console.log('SUMMARY', JSON.stringify([r1, r2]));
  process.exit((r1.ok && r2.ok) ? 0 : 3);
})();
