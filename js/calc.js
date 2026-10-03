/* 互動試算：每股價值 = 營收 × 淨利率 × 本益比 ÷ 股數。
   現價固定在報告時點（資料檔 calc.price），不會隨市場更新。 */
(function () {
  'use strict';
  const SR = window.SR, esc = SR.esc, fmt = SR.fmt;

  const compute = (c, v) => {
    const ni = v.revenue * (v.margin / 100);           // 淨利（十億美元）
    const eps = (ni * 1000) / c.shares;                // 每股盈餘（美元）
    const value = eps * v.pe;                          // 每股價值
    const implied = ((c.price * c.shares) / 1000 / (v.revenue * v.pe)) * 100; // 現價隱含淨利率（％）
    return { ni, eps, value, diff: (value / c.price - 1) * 100, implied };
  };
  const matches = (c, v) =>
    c.scenarios.find((s) => Math.abs(s.revenue - v.revenue) < 0.051 && Math.abs(s.margin - v.margin) < 0.051 && Math.abs(s.pe - v.pe) < 0.051);

  function slider(id, k, cfg) {
    return `<div class="sl"><label for="${id}-${k}"><span>${esc(cfg.label)}</span><output id="${id}-${k}-o" for="${id}-${k}"></output></label>
      <input id="${id}-${k}" data-k="${k}" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}">
      <span class="src">${esc(cfg.hint || '')}</span></div>`;
  }

  SR.calcHTML = function (c, ctx, uid) {
    const id = 'calc' + uid;
    const scen = c.scenarios.map((s) => `<button type="button" class="btn" data-scn="${s.key}" aria-pressed="false">${esc(s.name)}</button>`).join('');
    const rows = c.scenarios.map((s) => `<tr><td><b>${esc(s.name)}</b></td><td class="r">${fmt(s.revenue, 1)}</td><td class="r">${fmt(s.margin, 1)}%</td><td class="r">${fmt(s.pe, 1)}×</td><td>${SR.md(s.source, ctx)}</td></tr>`).join('');
    return `<div class="calc" id="${id}" data-calc>
      <h3>${esc(c.title)}</h3>
      <p class="lead-note">${SR.md(c.intro, ctx)}</p>
      <div class="presets" role="group" aria-label="情境按鈕">${scen}<button type="button" class="btn" data-reset>回到報告原值</button></div>
      <div class="sliders">${slider(id, 'revenue', c.revenue)}${slider(id, 'margin', c.margin)}${slider(id, 'pe', c.pe)}</div>
      <div class="res" aria-live="polite">
        <div><span class="k">淨利（十億美元）</span><span class="v" data-out="ni"></span></div>
        <div><span class="k">每股盈餘 EPS</span><span class="v" data-out="eps"></span></div>
        <div><span class="k">每股價值</span><span class="v" data-out="value"></span></div>
        <div><span class="k">相對現價 ${esc(SR.usd(c.price, 2))}</span><span class="v" data-out="diff"></span></div>
        <div><span class="k">現價隱含的淨利率</span><span class="v" data-out="implied"></span></div>
      </div>
      <p class="status" data-status></p>
      <details class="data"><summary>三個情境的參數與出處</summary>
        <div class="scroll"><table><thead><tr><th>情境</th><th class="r">年化營收（十億美元）</th><th class="r">淨利率</th><th class="r">本益比</th><th>出處</th></tr></thead><tbody>${rows}</tbody></table></div>
      </details>
      <p class="help">股數固定為 ${fmt(c.shares)} 百萬股（${SR.md(c.sharesNote || '稀釋後', ctx)}）；現價 ${esc(SR.usd(c.price, 2))} 固定於 ${esc(c.priceDate)} 收盤。「現價隱含的淨利率」＝在你選的營收與本益比下，要多高的淨利率才撐得住現價。</p>
    </div>`;
  };

  /* 情境表：和試算用同一份參數算出來，所以「試算預設值 = 情境卡數字」永遠成立 */
  SR.scenarioHTML = function (c, ctx, title) {
    const rows = c.scenarios.map((s) => {
      const r = compute(c, s);
      return `<tr class="${s.key === c.defaultScenario ? 'row-blue' : ''}"><td><b>${esc(s.name)}</b></td><td class="r">${fmt(s.revenue, 1)}</td><td class="r">${fmt(s.margin, 1)}%</td><td class="r">${fmt(s.pe, 1)}×</td><td class="r">${fmt(r.ni, 1)}</td><td class="r">${SR.usd(r.eps, 2)}</td><td class="r"><b>${SR.usd(r.value)}</b></td><td class="r ${SR.tone(r.diff)}">${SR.pct(r.diff, 0)}</td></tr>`;
    }).join('');
    const src = c.scenarios.map((s) => `<li><b>${esc(s.name)}：</b>${SR.md(s.source, ctx)}</li>`).join('');
    return `<div class="tbl"><p class="cap">${esc(title || '三情境')}</p><p class="sub">營收單位：十億美元；EPS ＝ 淨利 ÷ 股數 ${fmt(c.shares)} 百萬股。藍底為試算的預設情境。</p><div class="scroll"><table style="min-width:520px"><thead><tr><th>情境</th><th class="r">年化營收</th><th class="r">淨利率</th><th class="r">本益比</th><th class="r">淨利</th><th class="r">EPS</th><th class="r">每股價值</th><th class="r">較現價 ${esc(SR.usd(c.price, 2))}</th></tr></thead><tbody>${rows}</tbody></table></div><p class="cap" style="margin-top:6px">每個參數的出處</p><ul class="limits">${src}</ul></div>`;
  };

  SR.gridHTML = function (c) {
    const g = c.grid;
    if (!g) return '';
    const head = g.pes.map((p) => `<th class="r">本益比 ${p}×</th>`).join('');
    const body = g.margins.map((m) => {
      const cells = g.pes.map((p) => {
        const v = compute(c, { revenue: g.revenue, margin: m, pe: p }).value, up = v >= c.price;
        return `<td class="gcell ${up ? 'up' : 'dn'}">${up ? '▲' : '▼'} ${SR.usd(v)}</td>`;
      }).join('');
      return `<tr><th>淨利率 ${m}%</th>${cells}</tr>`;
    }).join('');
    return `<div class="tbl"><p class="cap">${esc(g.title)}</p><p class="sub">${esc(g.subtitle)}</p><div class="scroll"><table><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
  };

  SR.bindCalc = function (root, c) {
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const first = c.scenarios.find((s) => s.key === c.defaultScenario) || c.scenarios[0];
    let st = { revenue: first.revenue, margin: first.margin, pe: first.pe };
    const cfg = { revenue: c.revenue, margin: c.margin, pe: c.pe };
    const show = (k, v) => `${cfg[k].prefix || ''}${fmt(v, cfg[k].decimals == null ? 1 : cfg[k].decimals)}${cfg[k].suffix || ''}`;

    function update() {
      $$('input[type=range]').forEach((el) => {
        const k = el.dataset.k;
        el.value = st[k];
        $(`#${el.id}-o`).textContent = show(k, st[k]);
        el.setAttribute('aria-valuetext', show(k, st[k]));
      });
      const r = compute(c, st), set = (n, t, cls) => { const e = $(`[data-out="${n}"]`); e.textContent = t; e.className = 'v' + (cls ? ' ' + cls : ''); };
      set('ni', fmt(r.ni, 1));
      set('eps', SR.usd(r.eps, 2));
      set('value', SR.usd(r.value, 0));
      set('diff', SR.pct(r.diff, 0), SR.tone(r.diff));
      set('implied', fmt(r.implied, 1) + '%' + (r.implied > 100 ? '（不可能）' : ''), r.implied > 100 ? 'neg' : '');
      const m = matches(c, st), s = $('[data-status]');
      s.className = 'status ' + (m ? 'orig' : 'custom');
      s.textContent = m ? `目前＝報告原值：「${m.name}」情境。` : '目前是你自訂的數字，不是報告原值；按「回到報告原值」可還原。';
      $$('[data-scn]').forEach((b) => b.setAttribute('aria-pressed', String(!!m && b.dataset.scn === m.key)));
    }
    root.addEventListener('input', (e) => {
      const k = e.target.dataset && e.target.dataset.k;
      if (k) { st[k] = Number(e.target.value); update(); }
    });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.scn) { const s = c.scenarios.find((x) => x.key === b.dataset.scn); st = { revenue: s.revenue, margin: s.margin, pe: s.pe }; update(); }
      if ('reset' in b.dataset) { st = { revenue: first.revenue, margin: first.margin, pe: first.pe }; update(); }
    });
    update();
  };
})();
