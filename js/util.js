/* 共用工具：HTML 跳脫、行內標記、數字格式。
   整個網站只掛一個全域物件 SR，避免污染全域命名空間。 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});
  SR.reports = SR.reports || {};   // 已載入的完整報告：{ MU: {...} }
  SR.index = SR.index || [];       // 首頁卡片清單（data/index.js 填入）

  /* data/<代碼>.js 以 SR.register({...}) 登錄報告 */
  SR.register = function (report) {
    SR.reports[report.meta.ticker] = report;
  };

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  SR.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  /* 行內標記（先跳脫再轉換，所以資料檔裡的文字不會變成 HTML）：
       **粗體**      →  <strong>
       {{自算}}      →  標籤（自算＝本站依公開資料計算；預測、推論等同理）
       [s3]          →  指向來源清單第 N 項的上標連結
       [[MU|美光報告]] →  站內連結到另一家公司的報告
       \n            →  換行 */
  SR.md = function (s, ctx) {
    let t = SR.esc(s);
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\{\{(.+?)\}\}/g, (m, x) => `<span class="tag${x === '自算' ? ' tag-calc' : ''}">${x}</span>`);
    /* [[MU|美光報告]] → 站內連結到另一家公司的報告（代碼格式需合法） */
    t = t.replace(/\[\[([A-Z][A-Z0-9.\-]{0,9})\|([^\]]+)\]\]/g, (m, tk, label) => `<a href="#/${tk}">${label}</a>`);
    t = t.replace(/\[(s\d+)\]/g, (m, id) => {
      const src = ctx && ctx.srcMap && ctx.srcMap[id];
      if (!src) return m;
      return `<sup class="ref"><a href="#src-${id}" data-go="src-${id}" title="${SR.esc(src.label)}">[${src.n}]</a></sup>`;
    });
    return t.replace(/\n/g, '<br>');
  };

  /* 數字格式 */
  SR.fmt = (n, d = 0) =>
    n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  SR.pct = (n, d = 1) => (n == null ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(d) + '%');
  SR.usd = (n, d = 0) => (n == null ? '—' : '$' + SR.fmt(n, d));
  SR.tone = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');

  /* 代碼格式：1–10 字元，英數與 . - ；避免任何路徑字元 */
  SR.cleanTicker = (raw) => {
    const t = String(raw || '').trim().replace(/^\$/, '').toUpperCase();
    return /^[A-Z][A-Z0-9.\-]{0,9}$/.test(t) ? t : '';
  };

  /* 圖表所需的「好看刻度」 */
  SR.niceTicks = function (min, max, count = 5) {
    if (max === min) max = min + 1;
    const span = max - min, raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
    const start = Math.floor(min / step) * step, end = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v / step) * step);
    return { ticks, min: start, max: end, step };
  };
})();
