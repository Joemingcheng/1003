/* 路由與搜尋。網址用 hash：#/MU 是 MU 的報告，#/MU/ch3 直接捲到第 3 章。
   報告資料在使用者搜尋後才以 <script> 載入 data/<代碼>.js（不用 fetch，所以直接雙擊開檔也能看）。 */
(function () {
  'use strict';
  const SR = window.SR, view = document.getElementById('view'), main = document.getElementById('main');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SITE = '美股財報解讀';

  /* ---------- 搜尋 ---------- */
  document.getElementById('menu').innerHTML = SR.index.map((c) => `<a href="#/${SR.esc(c.ticker)}"><b>${SR.esc(c.ticker)}</b>${SR.esc(c.nameZh || c.name)}</a>`).join('');
  document.getElementById('tickers').innerHTML = SR.index.map((c) => `<option value="${SR.esc(c.ticker)}">${SR.esc(c.name)}${c.nameZh ? ' ' + SR.esc(c.nameZh) : ''}</option>`).join('');

  function resolve(raw) {
    const q = String(raw || '').trim();
    if (!q) return null;
    const t = SR.cleanTicker(q), lc = q.toLowerCase();
    const hit = SR.index.find((c) => c.ticker === t) || (lc.length >= 2 && SR.index.find((c) => (c.name + ' ' + (c.nameZh || '')).toLowerCase().includes(lc)));
    return { ticker: hit ? hit.ticker : t, raw: q };
  }
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-search]');
    if (!f) return;
    e.preventDefault();
    const r = resolve(new FormData(f).get('q'));
    if (!r) { f.querySelector('input').focus(); return; }
    const target = r.ticker ? '#/' + r.ticker : '#/?bad=' + encodeURIComponent(r.raw);
    if (location.hash === target) route(); else location.hash = target;
  });

  /* ---------- 載入資料檔 ---------- */
  function load(t) {
    return new Promise((done) => {
      if (SR.reports[t]) return done(SR.reports[t]);
      const s = document.createElement('script');
      s.src = 'data/' + t + '.js';
      s.onload = () => done(SR.reports[t] || null);
      s.onerror = () => { s.remove(); done(null); };
      document.head.appendChild(s);
    });
  }

  /* ---------- 路由 ---------- */
  let token = 0, showing = '';
  function parse() {
    const h = location.hash;
    if (!h.startsWith('#/')) return null;
    const [t, anchor] = decodeURIComponent(h.slice(2)).split('/');
    return { raw: t || '', anchor: anchor || '' };
  }
  function setView(html, title, kind) {
    if (view._off) { view._off(); view._off = null; }
    view.innerHTML = html;
    document.title = title;
    document.body.dataset.view = kind || 'report';
    document.getElementById('nav-open').checked = false;   // 換頁時收起漢堡選單
  }
  function focusMain() { main.focus({ preventScroll: true }); }

  async function route() {
    const r = parse(), my = ++token;
    if (r === null) { if (!showing) home(); return; }          // #ch3 這類頁內錨點：不換頁
    if (!r.raw || r.raw.startsWith('?')) {
      if (r.raw.startsWith('?bad=')) { setView(SR.renderNotFound('', r.raw.slice(5)), `代碼格式不正確｜${SITE}`, 'nf'); showing = 'nf'; window.scrollTo(0, 0); focusMain(); return; }
      home(); return;
    }
    const t = SR.cleanTicker(r.raw);
    if (!t) { setView(SR.renderNotFound('', r.raw), `代碼格式不正確｜${SITE}`, 'nf'); showing = 'nf'; window.scrollTo(0, 0); focusMain(); return; }
    if (showing !== t) view.innerHTML = '<p class="loading wrap">載入 ' + SR.esc(t) + ' 的報告…</p>';
    const R = await load(t);
    if (my !== token) return;                                    // 使用者已換去別頁
    if (!R) { setView(SR.renderNotFound(t, t), `還沒有 ${t} 的報告｜${SITE}`, 'nf'); showing = 'nf'; window.scrollTo(0, 0); focusMain(); return; }
    if (showing !== t) {
      const out = SR.renderReport(R);
      setView(out.html, `${t}｜${R.meta.reportLabel}｜${SITE}`, 'report');
      SR.mountReport(view, out.ctx);
      showing = t;
      view._fresh = true;
      window.scrollTo(0, 0);
      focusMain();
    }
    if (r.anchor) {
      /* 剛載入時直接定位（不要平滑捲動，途中版面還會變動）；網頁字型載入完再校正一次 */
      const jump = (smooth) => { const el = document.getElementById(r.anchor); if (el) el.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'instant', block: 'start' }); };
      const fresh = !!view._fresh; view._fresh = false;
      jump(!fresh);
      if (fresh && document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const now = parse(); if (showing === t && now && now.anchor === r.anchor) jump(false); });
    }
  }
  function home() {
    setView(SR.renderHome(), `${SITE}｜輸入代碼，看懂這一季`, 'home');
    SR.bindImages(view);
    showing = 'home';
    window.scrollTo(0, 0);
  }

  /* 頁內導覽：捲動後用 replaceState 更新網址，但不觸發重新繪製 */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-go]');
    if (!a) return;
    const id = a.dataset.go, el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    const r = parse();
    history.replaceState(null, '', r && r.raw ? '#/' + r.raw + '/' + id : '#' + id);
  });

  /* ---------- 視窗寬度改變時重畫圖表 ---------- */
  let lastW = 0, timer = 0;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const w = view.clientWidth;
      if (Math.abs(w - lastW) < 8) return;
      lastW = w;
      view.querySelectorAll('figure.chart').forEach(SR.drawChart);
    }, 120);
  }).observe(view);

  window.addEventListener('hashchange', route);
  route();

  /* ---------- 背景是影片：減少動態偏好要靠暫停影片來遵守（CSS 只管得到動畫與過場）。暫停後停在第一格 ---------- */
  (function () {
    const q = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)'), v = document.querySelector('video.art');
    if (!q || !v) return;
    function sync() { if (q.matches) { v.pause(); } else { const p = v.play(); if (p) p.catch(function () {}); } }
    sync();
    q.addEventListener ? q.addEventListener('change', sync) : q.addListener(sync);
  })();

  /* ---------- 進場動畫純 CSS；這裡只在最後一個動畫結束時「退役」它，之後換版面（顯示漢堡）也不會重播 ---------- */
  (function () {
    const root = document.documentElement, last = document.getElementById('foot2');
    let timer = 0;
    function done() { clearTimeout(timer); if (last) last.removeEventListener('animationend', done); root.classList.add('is-entered'); }
    if (last) last.addEventListener('animationend', done);
    timer = setTimeout(done, 4000);   // 安全網
  })();
})();
