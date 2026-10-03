#!/usr/bin/env node
/* 報告資料檢查：對應 README 的「人工檢查清單」，把能自動檢查的部分自動化。
   用法：node tools/check_reports.js            檢查 data/ 底下所有報告
         node tools/check_reports.js MU NVDA     只檢查指定代碼
   檢查項目：
     1. 結構完整：封面欄位、三張數字卡、30 秒結論 5 點、五章、必要區塊
     2. 出處：文字裡的 [sN] 都有定義；定義過的來源都至少被引用一次
     3. 試算：三情境參數都在滑桿範圍內；「三情境」估值區間 = 試算算出的最小與最大值
     4. 範圍圖：每個區間的 low < high；現價 > 0
     5. 引用原話：英文原話不超過 15 個字
     6. 殘留標記：沒有未轉換的 ** 或 {{ }} 或 TODO */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'data');
const only = process.argv.slice(2).map((s) => s.toUpperCase());

const reports = {};
const SR = { register: (r) => (reports[r.meta.ticker] = r), index: [] };
fs.readdirSync(root).filter((f) => /^[A-Z][A-Z0-9.\-]*\.js$/.test(f)).forEach((f) => {
  new Function('SR', 'window', fs.readFileSync(path.join(root, f), 'utf8'))(SR, {});
});

let errors = 0, warns = 0;
const err = (t, m) => { errors++; console.log(`  ✗ [${t}] ${m}`); };
const warn = (t, m) => { warns++; console.log(`  ! [${t}] ${m}`); };

function walk(o, fn, pathStr = '') {
  if (typeof o === 'string') return fn(o, pathStr);
  if (Array.isArray(o)) return o.forEach((v, i) => walk(v, fn, `${pathStr}[${i}]`));
  if (o && typeof o === 'object') Object.keys(o).forEach((k) => walk(o[k], fn, `${pathStr}.${k}`));
}
const compute = (c, v) => ((v.revenue * (v.margin / 100) * 1000) / c.shares) * v.pe;

Object.keys(reports).filter((t) => !only.length || only.includes(t)).forEach((t) => {
  const R = reports[t];
  console.log(`\n${t}  ${R.meta.name}`);

  /* 1. 結構 */
  ['ticker', 'name', 'exchange', 'sector', 'image', 'reportLabel', 'period', 'released', 'asOf', 'priceAsOf'].forEach((k) => { if (!R.meta[k]) err(t, `meta.${k} 缺少`); });
  if (!(R.meta.price > 0)) err(t, 'meta.price 必須大於 0');
  if (!R.headline || !R.intro) err(t, '缺少 headline 或 intro');
  if (!R.cards || R.cards.length !== 3) err(t, '三張數字卡必須剛好 3 張');
  if (!R.summary || R.summary.length !== 5 || R.summary.some((s, i) => s.ch !== i + 1)) err(t, '30 秒結論必須 5 點，且依序對應第 1–5 章');
  if (!R.chapters || R.chapters.length !== 5) err(t, '必須有 5 章');
  (R.chapters || []).forEach((c) => {
    ['question', 'lead', 'conclusion', 'howto', 'asks', 'output'].forEach((k) => { if (!c[k] || (Array.isArray(c[k]) && !c[k].length)) err(t, `第 ${c.n} 章缺少 ${k}`); });
    if (c.howto && c.howto.length !== 3) warn(t, `第 ${c.n} 章「怎麼看」建議 3 步（目前 ${c.howto.length}）`);
    if (c.asks && c.asks.length < 2) warn(t, `第 ${c.n} 章「值得追問」建議 2 題`);
    if (c.asks && !c.asks.some((a) => a.link)) warn(t, `第 ${c.n} 章「值得追問」至少一題要指向別章`);
    if (!/[0-9]/.test(c.conclusion || '')) warn(t, `第 ${c.n} 章一句話結論沒有數字`);
  });
  if (!R.watch || !R.watch.length) err(t, '缺少「接下來看什麼」');
  if (!R.limits || !R.limits.length) err(t, '缺少「限制」');

  /* 2. 出處 */
  const ids = new Set((R.sources || []).map((s) => s.id)), used = new Set();
  walk(R, (str, p) => {
    for (const m of str.matchAll(/\[(s\d+)\]/g)) { used.add(m[1]); if (!ids.has(m[1])) err(t, `${p} 引用了不存在的來源 ${m[1]}`); }
    if (/\*\*|\{\{|\}\}/.test(str.replace(/\*\*[^*]+\*\*/g, '').replace(/\{\{[^}]+\}\}/g, ''))) err(t, `${p} 有未配對的標記`);
    if (/TODO/.test(str)) err(t, `${p} 還有 TODO`);
  });
  ids.forEach((id) => { if (!used.has(id)) warn(t, `來源 ${id} 沒有被任何文字引用`); });

  /* 3. 試算 */
  const c = R.calc;
  if (!c) { err(t, '缺少 calc'); return; }
  const vals = c.scenarios.map((s) => ({ s, v: compute(c, s) }));
  c.scenarios.forEach((s) => ['revenue', 'margin', 'pe'].forEach((k) => {
    if (s[k] < c[k].min || s[k] > c[k].max) err(t, `情境「${s.name}」的 ${k}=${s[k]} 超出滑桿範圍 ${c[k].min}–${c[k].max}`);
    const stepsFromMin = (s[k] - c[k].min) / c[k].step;
    if (Math.abs(stepsFromMin - Math.round(stepsFromMin)) > 1e-6) err(t, `情境「${s.name}」的 ${k}=${s[k]} 不在滑桿刻度上（step=${c[k].step}），試算會對不上報告原值`);
  }));
  if (!c.scenarios.find((s) => s.key === c.defaultScenario)) err(t, 'defaultScenario 對不到任何情境');
  const lo = Math.round(Math.min(...vals.map((x) => x.v))), hi = Math.round(Math.max(...vals.map((x) => x.v)));
  let rangeItem = null;
  R.chapters.forEach((ch) => (ch.evidence || []).forEach((b) => { if (b.type === 'chart' && b.kind === 'range') b.items.forEach((it) => { if (/三情境/.test(it.label)) rangeItem = it; }); }));
  if (!rangeItem) warn(t, '估值區間圖沒有「三情境」那一列');
  else if (Math.abs(rangeItem.low - lo) > 1 || Math.abs(rangeItem.high - hi) > 1) err(t, `區間圖「三情境」是 ${rangeItem.low}–${rangeItem.high}，但試算參數算出來是 ${lo}–${hi}`);
  console.log(`  情境每股價值：${vals.map((x) => `${x.s.name} $${Math.round(x.v)}（${((x.v / c.price - 1) * 100).toFixed(0)}%）`).join('　')}　現價 $${c.price}`);
  if (Math.abs(c.price - R.meta.price) > 0.005) err(t, `calc.price（${c.price}）與 meta.price（${R.meta.price}）不一致`);

  /* 4. 範圍圖與一般圖表 */
  R.chapters.forEach((ch) => (ch.evidence || []).forEach((b) => {
    if (b.type !== 'chart') return;
    if (b.kind === 'range') {
      if (!(b.price > 0)) err(t, '範圍圖缺現價');
      b.items.forEach((it) => { if (!(it.low < it.high)) err(t, `範圍圖「${it.label}」low 必須小於 high`); });
      if (Math.abs(b.price - R.meta.price) > 0.005) err(t, `範圍圖現價（${b.price}）與 meta.price 不一致`);
    }
    if (!b.title || !b.subtitle) warn(t, `圖表「${b.title || b.kind}」缺少標題或副標題`);
  }));

  /* 5. 引用原話 */
  R.chapters.forEach((ch) => [...(ch.evidence || []), ...(ch.story || [])].forEach((b) => {
    if (b.type === 'quotes') b.items.forEach((q) => {
      const n = q.quote.trim().split(/\s+/).length;
      if (n > 15) err(t, `原話超過 15 字（${n}）：${q.quote.slice(0, 40)}…`);
    });
  }));
});

console.log(`\n完成：${errors} 個錯誤、${warns} 個提醒。`);
process.exit(errors ? 1 : 0);
