/* 圖表：純 SVG，不依賴外部套件。
   每種圖表 = 一個函式 (spec, 容器寬度) → SVG 字串。寬度由外層量測，字級永遠是真實大小，
   手機上不會被縮到看不清。每張圖都附「查看數據」表格，方便核對與讀螢幕程式使用。 */
(function () {
  'use strict';
  const SR = window.SR;
  const esc = SR.esc, fmt = SR.fmt;
  let uid = 0;

  /* 粗估文字寬度：中日韓字 = 1 個字級，英數 ≈ 0.58 */
  function tw(s, fs) {
    let w = 0;
    for (const ch of String(s)) w += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.58;
    return w;
  }
  /* 斷行：中日韓字可在任何字之間斷，英數單字與括號不拆開 */
  function wrap(s, maxW, fs) {
    const toks = String(s).match(/[⺀-￿]|[^\s⺀-￿]+|\s+/g) || [];
    const lines = []; let cur = '';
    toks.forEach((t) => {
      if (tw(cur + t, fs) > maxW && cur.trim()) { lines.push(cur.trim()); cur = t.trim() === '' ? '' : t; } else cur += t;
    });
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }
  const HALO = 'paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round';
  const num = (v, s) => (s.prefix || '') + fmt(v, s.decimals || 0) + (s.suffix || '');
  const signed = (v, s) => (v > 0 ? '+' : v < 0 ? '−' : '') + (s.prefix || '') + fmt(Math.abs(v), s.decimals == null ? 1 : s.decimals) + (s.suffix || '');
  const svgOpen = (W, H, label) => `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">`;

  /* ---------- 1. 營收長條 + 毛利率折線（下一季指引用斜線） ---------- */
  function barline(s, w) {
    const W = Math.max(300, w), n = s.bars.length, ml = 14, mr = 14;
    const band = (W - ml - mr) / n, bw = Math.min(58, band * 0.62);
    const hasLine = !!(s.line && s.line.values);
    const topPad = 20, lineH = hasLine ? 92 : 0, gap = hasLine ? 40 : 0;
    const barTop = topPad + lineH + gap, barH = 170, labH = 64;
    const H = barTop + barH + labH, id = 'h' + ++uid;
    const cx = (i) => ml + band * (i + 0.5);
    let o = svgOpen(W, H, s.title);
    o += `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"/><rect width="3" height="6" fill="var(--blue)" opacity=".55"/></pattern></defs>`;

    if (hasLine) {
      const vals = s.line.values, lo = Math.min(...vals), hi = Math.max(...vals);
      const T = SR.niceTicks(Math.max(0, lo - 8), Math.min(100, hi + 4), 3);
      const y = (v) => topPad + lineH - ((v - T.min) / (T.max - T.min)) * lineH;
      o += `<text class="tm tb" x="${ml}" y="${topPad - 7}">${esc(s.line.label)}</text>`;
      T.ticks.forEach((t) => (o += `<line class="gr" x1="${ml}" x2="${W - mr}" y1="${y(t)}" y2="${y(t)}"/>`));
      const pts = vals.map((v, i) => [cx(i), y(v)]);
      const actual = s.bars.map((b, i) => (b.kind === 'guide' ? -1 : i)).filter((i) => i >= 0);
      if (actual.length > 1) o += `<polyline class="ln s-gold" style="stroke:var(--gold)" points="${actual.map((i) => pts[i].join(',')).join(' ')}" fill="none"/>`;
      const gi = s.bars.findIndex((b) => b.kind === 'guide');
      if (gi > 0) o += `<line x1="${pts[gi - 1][0]}" y1="${pts[gi - 1][1]}" x2="${pts[gi][0]}" y2="${pts[gi][1]}" style="stroke:var(--gold);stroke-width:2.5;stroke-dasharray:5 4"/>`;
      pts.forEach(([x, yy], i) => {
        const g = s.bars[i].kind === 'guide';
        o += `<circle cx="${x}" cy="${yy}" r="4.5" style="fill:${g ? 'var(--surface)' : 'var(--gold)'};stroke:var(--gold);stroke-width:2"/>`;
        const showLabel = band >= 46 || i % 2 === n % 2 || i >= n - 2;
        if (showLabel) o += `<text class="tx tb" x="${x}" y="${yy - 9}" text-anchor="middle" style="font-size:11.5px">${fmt(vals[i], 1)}%</text>`;
      });
    }

    const vmax = Math.max(...s.bars.map((b) => b.high || b.value));
    const T = SR.niceTicks(0, vmax * 1.08, 4);
    const y = (v) => barTop + barH - ((v - T.min) / (T.max - T.min)) * barH;
    o += `<text class="tm tb" x="${ml}" y="${barTop - 10}">${esc(s.valueLabel || '營收')}（${esc(s.unit)}）</text>`;
    T.ticks.forEach((t) => (o += `<line class="gr" x1="${ml}" x2="${W - mr}" y1="${y(t)}" y2="${y(t)}"/>`));
    o += `<line class="ax" x1="${ml}" x2="${W - mr}" y1="${y(0)}" y2="${y(0)}"/>`;
    s.bars.forEach((b, i) => {
      const g = b.kind === 'guide', x = cx(i) - bw / 2, top = y(b.value);
      o += `<rect x="${x}" y="${top}" width="${bw}" height="${y(0) - top}" rx="3" ${g ? `fill="url(#${id})" style="stroke:var(--blue);stroke-width:1.5;stroke-dasharray:4 3"` : 'class="f-blue"'}/>`;
      if (g && b.low != null) {
        const a = y(b.low), c = y(b.high);
        o += `<line x1="${cx(i)}" x2="${cx(i)}" y1="${a}" y2="${c}" style="stroke:var(--ink);stroke-width:1.5"/><line x1="${cx(i) - 6}" x2="${cx(i) + 6}" y1="${a}" y2="${a}" style="stroke:var(--ink);stroke-width:1.5"/><line x1="${cx(i) - 6}" x2="${cx(i) + 6}" y1="${c}" y2="${c}" style="stroke:var(--ink);stroke-width:1.5"/>`;
      }
      const labY = (g && b.high != null ? y(b.high) : top) - 6;
      o += `<text class="tx tb" x="${cx(i)}" y="${labY}" text-anchor="middle" style="font-size:12px">${fmt(b.value, 1)}</text>`;
      const yl = barTop + barH + 17, parts = band < 56 ? b.label.split('-') : [b.label];   /* 窄螢幕：FQ4-26 拆成兩行 */
      parts.forEach((pt, k) => (o += `<text class="tx" x="${cx(i)}" y="${yl + k * 13}" text-anchor="middle" style="font-size:${band < 44 ? 11 : 12}px">${esc(pt)}</text>`));
      if (b.note) o += `<text x="${cx(i)}" y="${yl + parts.length * 13 + 2}" text-anchor="middle" style="fill:var(--gold);font-size:11px;font-weight:700">${esc(b.note)}</text>`;
    });
    return o + '</svg>';
  }

  /* ---------- 2. 橫條（例如各部門占「新增營收」的比例） ---------- */
  function hbar(s, w) {
    const W = Math.max(300, w), fs = 13, rowH = 38, top = 6;
    const labW = Math.min(W * 0.4, Math.max(...s.items.map((it) => tw(it.label, fs))) + 10);
    const right = 12, ml = labW + 8;
    const max = Math.max(...s.items.map((it) => Math.abs(it.value)));
    const valW = Math.max(...s.items.map((it) => tw(num(it.value, s) + (it.share != null ? `（${fmt(it.share, 1)}%）` : ''), 12.5))) + 10;
    const barW = Math.max(40, W - ml - right - valW), sc = barW / max;
    const H = top + rowH * s.items.length + 6;
    let o = svgOpen(W, H, s.title);
    s.items.forEach((it, i) => {
      const yy = top + i * rowH, len = Math.max(2, Math.abs(it.value) * sc);
      const lines = wrap(it.label, labW, fs);
      lines.forEach((ln, j) => (o += `<text class="tx" x="${labW}" y="${yy + 22 - (lines.length - 1) * 7 + j * 14}" text-anchor="end" style="font-size:${fs}px">${esc(ln)}</text>`));
      o += `<rect x="${ml}" y="${yy + 6}" width="${len}" height="22" rx="3" class="f-${it.tone || 'blue'}"/>`;
      o += `<text class="tx tb" x="${ml + len + 6}" y="${yy + 22}" style="font-size:12.5px">${num(it.value, s)}${it.share != null ? `（${fmt(it.share, 1)}%）` : ''}</text>`;
    });
    return o + '</svg>';
  }

  /* ---------- 3. 左右分歧條（股價反應：每列兩根 = 隔日、兩日） ---------- */
  function diverge(s, w) {
    const W = Math.max(300, w), fs = 13, rowH = 42, gh = 26;
    const labW = Math.min(W * 0.34, Math.max(...s.items.map((it) => tw(it.label, fs))) + 8);
    const vals = s.items.flatMap((it) => [it.a, it.b]).filter((v) => v != null);
    const ml = labW + 10 + (Math.min(...vals) < 0 ? 46 : 0), mr = 52, plotW = W - ml - mr;   /* 負值的數字標籤要放在長條左邊，所以留白 */
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals), pad = (hi - lo) * 0.14 || 1;
    const dmin = lo - (lo < 0 ? pad : 0), dmax = hi + pad;
    const x = (v) => ml + ((v - dmin) / (dmax - dmin)) * plotW, x0 = x(0);
    let rows = [], lastG = null, yy = 22;
    s.items.forEach((it) => {
      if (it.group && it.group !== lastG) { rows.push({ g: it.group, y: yy }); yy += gh; lastG = it.group; }
      rows.push({ it, y: yy }); yy += rowH;
    });
    const H = yy + 8;
    let o = svgOpen(W, H, s.title);
    o += `<line class="ax" x1="${x0}" x2="${x0}" y1="14" y2="${H - 6}"/>`;
    o += `<text class="tm" x="${x0}" y="10" text-anchor="middle">0%</text>`;
    rows.forEach((r) => {
      if (r.g) { o += `<text class="tm tb" x="6" y="${r.y + 6}" style="font-size:12px;letter-spacing:.06em">${esc(r.g)}</text><line class="gr" x1="6" x2="${W - 6}" y1="${r.y + 12}" y2="${r.y + 12}"/>`; return; }
      const it = r.it, me = it.tone === 'blue', col = me ? 'f-blue' : 'f-grey';
      const lines = wrap(it.label, labW, fs);
      lines.forEach((ln, j) => (o += `<text class="tx${me ? ' tb' : ''}" x="${labW}" y="${r.y + 21 - (lines.length - 1) * 7 + j * 14}" text-anchor="end" style="font-size:${fs}px">${esc(ln)}</text>`));
      [[it.b, 6, 14, 1], [it.a, 24, 11, 0.55]].forEach(([v, off, h, op]) => {
        if (v == null) return;
        const xv = x(v), bx = Math.min(x0, xv), bwid = Math.max(1.5, Math.abs(xv - x0));
        o += `<rect x="${bx}" y="${r.y + off - 2}" width="${bwid}" height="${h}" rx="2" class="${col}" opacity="${op}"/>`;
        const lab = signed(v, { decimals: 1, suffix: '%' });
        o += v >= 0
          ? `<text class="tx tb" x="${xv + 5}" y="${r.y + off + h - 3}" style="font-size:11.5px">${lab}</text>`
          : `<text class="tx tb" x="${xv - 5}" y="${r.y + off + h - 3}" text-anchor="end" style="font-size:11.5px">${lab}</text>`;
      });
    });
    return o + '</svg>';
  }

  /* ---------- 4. 估值區間：浮動長條 + 現價虛線（中點低於現價＝紅，高於＝綠） ---------- */
  function range(s, w) {
    const W = Math.max(280, w), fs = 13, compact = W < 560;
    const rowH = compact ? 78 : 56, top = 34;
    const labW = compact ? 0 : Math.min(W * 0.34, 190);
    const ml = compact ? 10 : labW + 12 + 36, mr = compact ? 12 : 52;
    const hi = Math.max(s.price, ...s.items.map((it) => it.high));
    const T = SR.niceTicks(0, hi * 1.06, compact ? 3 : 5), x = (v) => ml + ((v - T.min) / (T.max - T.min)) * (W - ml - mr);
    const H = top + rowH * s.items.length + 26;
    let o = svgOpen(W, H, s.title);
    T.ticks.forEach((t, i) => {
      const anc = i === 0 ? 'start' : i === T.ticks.length - 1 ? 'end' : 'middle';
      o += `<line class="gr" x1="${x(t)}" x2="${x(t)}" y1="${top - 6}" y2="${H - 22}"/><text class="tm" x="${x(t)}" y="${H - 6}" text-anchor="${anc}">${num(t, { prefix: '$' })}</text>`;
    });
    s.items.forEach((it, i) => {
      const yy = top + i * rowH, mid = it.mid != null ? it.mid : (it.low + it.high) / 2;
      const col = mid < s.price ? 'red' : 'green', diff = (mid / s.price - 1) * 100;
      const x1 = x(it.low), x2 = x(it.high), lowLab = num(it.low, s), highLab = num(it.high, s);
      const info = `中點 ${num(mid, s)}，較現價 ${signed(diff, { decimals: 0, suffix: '%' })}（${mid < s.price ? '低於' : '高於'}現價）`;
      if (compact) {
        o += `<text class="tx tb" x="${ml}" y="${yy + 12}" style="font-size:${fs}px">${esc(it.label)}</text>`;
        o += `<rect x="${x1}" y="${yy + 20}" width="${Math.max(3, x2 - x1)}" height="20" rx="3" class="f-${col}"/>`;
        o += `<line x1="${x(mid)}" x2="${x(mid)}" y1="${yy + 17}" y2="${yy + 43}" style="stroke:var(--surface);stroke-width:2.5"/>`;
        o += `<text class="tx" x="${ml}" y="${yy + 57}" style="font-size:11.5px;${HALO}">${lowLab}–${highLab}</text>`;
        o += `<text class="tm" x="${ml}" y="${yy + 71}" style="font-size:11.5px;${HALO}">${info}</text>`;
        return;
      }
      wrap(it.label, labW, fs).forEach((ln, j) => (o += `<text class="tx tb" x="${labW}" y="${yy + 20 + j * 15}" text-anchor="end" style="font-size:${fs}px">${esc(ln)}</text>`));
      o += `<rect x="${x1}" y="${yy + 6}" width="${Math.max(3, x2 - x1)}" height="22" rx="3" class="f-${col}"/>`;
      o += `<line x1="${x(mid)}" x2="${x(mid)}" y1="${yy + 3}" y2="${yy + 31}" style="stroke:var(--surface);stroke-width:2.5"/>`;
      const room = x1 - ml;
      o += `<text class="tx" x="${x1 - 4}" y="${yy + 22}" text-anchor="end" style="font-size:11.5px;${HALO}">${room > tw(lowLab, 11.5) ? lowLab : ''}</text>`;
      o += `<text class="tx" x="${x2 + 4}" y="${yy + 22}" style="font-size:11.5px;${HALO}">${(room > tw(lowLab, 11.5) ? '' : lowLab + '–') + highLab}</text>`;
      o += `<text class="tm" x="${ml}" y="${yy + 46}" style="font-size:11.5px;${HALO}">${info}</text>`;
    });
    o += `<line class="priceline" x1="${x(s.price)}" x2="${x(s.price)}" y1="${top - 6}" y2="${H - 22}"/>`;
    const pl = esc(s.priceLabel || '現價'), px = x(s.price), lw = tw(s.priceLabel || '現價', 12);
    let anchor = px > W - 150 ? 'end' : 'start', tx = px + (anchor === 'end' ? -5 : 5);
    if (anchor === 'end' && tx - lw < 2) { anchor = 'start'; tx = 2; }                /* 窄螢幕：標籤比左側空間長，改貼齊左緣 */
    else if (anchor === 'start' && tx + lw > W - 2) tx = Math.max(2, W - 2 - lw);     /* 右側放不下，往左收到剛好放得下 */
    o += `<text class="tx tb" x="${tx}" y="${top - 12}" text-anchor="${anchor}" style="font-size:12px">${pl}</text>`;
    return o + '</svg>';
  }

  /* ---------- 5. 直條組（可帶區間鬚線；例如各季報價漲幅預測） ---------- */
  function vbar(s, w) {
    const W = Math.max(300, w), n = s.cats.length, k = s.series.length, ml = 14, mr = 14;
    const band = (W - ml - mr) / n, gw = band * 0.72, bw = Math.min(46, gw / k - 4);
    const top = 30, barH = 190, H = top + barH + 54;
    const vmax = Math.max(...s.series.flatMap((se) => se.high || se.values));
    const T = SR.niceTicks(0, vmax * 1.12, 4), y = (v) => top + barH - ((v - T.min) / (T.max - T.min)) * barH, dp = s.decimals || 0;   /* decimals：數值標籤的小數位（預設 0） */
    let o = svgOpen(W, H, s.title);
    T.ticks.forEach((t) => (o += `<line class="gr" x1="${ml}" x2="${W - mr}" y1="${y(t)}" y2="${y(t)}"/><text class="tm" x="${W - mr}" y="${y(t) - 3}" text-anchor="end">${fmt(t)}${s.suffix || ''}</text>`));
    o += `<line class="ax" x1="${ml}" x2="${W - mr}" y1="${y(0)}" y2="${y(0)}"/>`;
    s.cats.forEach((c, i) => {
      const c0 = ml + band * (i + 0.5);
      s.series.forEach((se, j) => {
        const bx = c0 - (k * (bw + 4)) / 2 + j * (bw + 4) + 2, v = se.values[i], cx = bx + bw / 2;
        o += `<rect x="${bx}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" rx="3" class="f-${se.color || 'blue'}"/>`;
        let labTop = y(v);
        if (se.low) {
          const a = y(se.low[i]), b = y(se.high[i]);
          o += `<line x1="${cx}" x2="${cx}" y1="${a}" y2="${b}" style="stroke:var(--ink);stroke-width:1.5"/><line x1="${cx - 5}" x2="${cx + 5}" y1="${b}" y2="${b}" style="stroke:var(--ink);stroke-width:1.5"/><line x1="${cx - 5}" x2="${cx + 5}" y1="${a}" y2="${a}" style="stroke:var(--ink);stroke-width:1.5"/>`;
          labTop = b;
        }
        const t = se.low ? `${fmt(se.low[i])}–${fmt(se.high[i])}${s.suffix || ''}` : `${fmt(v, dp)}${s.suffix || ''}`;
        o += `<text class="tx tb" x="${cx}" y="${labTop - 6}" text-anchor="middle" style="font-size:${k > 1 && band < 120 ? 10.5 : 12}px">${t}</text>`;
      });
      o += `<text class="tx" x="${c0}" y="${top + barH + 18}" text-anchor="middle" style="font-size:12.5px">${esc(c)}</text>`;
      if (s.catNotes && s.catNotes[i]) o += `<text class="tm" x="${c0}" y="${top + barH + 33}" text-anchor="middle" style="font-size:11px">${esc(s.catNotes[i])}</text>`;
    });
    return o + '</svg>';
  }

  /* ---------- 圖例與數據表 ---------- */
  function legend(s) {
    /* 圖例文字可由資料覆寫（barLegend／guideLegend／line.legend／selfLegend／otherLegend／legendNote）；沒寫就用預設；沒有指引長條或沒有折線時，就不顯示那一項 */
    if (s.kind === 'barline') return [['blue', s.barLegend || '實際營收']].concat(s.bars.some((x) => x.kind === 'guide') ? [['hatch', s.guideLegend || '下一季指引（鬚線＝上下緣）']] : [], s.line && s.line.values ? [['gold', s.line.legend || '毛利率（GAAP）']] : []);
    if (s.kind === 'diverge') return [['blue', s.selfLegend || '本公司'], ['grey', s.otherLegend || '對照組'], ['', s.legendNote || '粗＝兩個交易日累計；淡＝財報後第一個交易日']];
    if (s.kind === 'range') return [['red', '區間中點低於現價'], ['green', '區間中點高於現價'], ['', '虛線＝報告時點的現價']];
    if (s.kind === 'vbar') return s.series.map((se) => [se.color || 'blue', se.name]).concat(s.rangeNote ? [['', s.rangeNote]] : []);
    return [];
  }
  function dataTable(s) {
    let head = [], rows = [];
    if (s.kind === 'barline') {
      const hasLine = !!(s.line && s.line.values);
      head = ['期間', s.valueLabel || '營收'].concat(hasLine ? [s.line.short || '毛利率'] : []);
      rows = s.bars.map((b, i) => [b.label + (b.note ? `（${b.note}）` : ''), fmt(b.value, 1) + (b.low != null ? `（區間 ${fmt(b.low, 1)}–${fmt(b.high, 1)}）` : '')].concat(hasLine ? [fmt(s.line.values[i], 1) + '%'] : []));
    } else if (s.kind === 'hbar') {
      head = ['項目', '數值', '占比'];
      rows = s.items.map((it) => [it.label, num(it.value, s), it.share != null ? fmt(it.share, 1) + '%' : '']);
    } else if (s.kind === 'diverge') {
      head = ['標的', s.aLabel || '財報後第一個交易日', s.bLabel || '兩個交易日累計', '備註'];
      rows = s.items.map((it) => [it.label, it.a == null ? '—' : signed(it.a, { decimals: 2, suffix: '%' }), it.b == null ? '—' : signed(it.b, { decimals: 2, suffix: '%' }), it.note || '']);
    } else if (s.kind === 'range') {
      head = ['方法', '低', '高', '中點', '較現價'];
      rows = s.items.map((it) => { const m = it.mid != null ? it.mid : (it.low + it.high) / 2; return [it.label, num(it.low, s), num(it.high, s), num(m, s), signed((m / s.price - 1) * 100, { decimals: 0, suffix: '%' })]; });
    } else if (s.kind === 'vbar') {
      head = ['期間'].concat(s.series.map((se) => se.name + (se.low ? '（區間）' : '')));
      rows = s.cats.map((c, i) => [c].concat(s.series.map((se) => (se.low ? `${fmt(se.low[i])}–${fmt(se.high[i])}${s.suffix || ''}` : fmt(se.values[i], s.decimals || 0) + (s.suffix || '')))));
    }
    return `<details class="data"><summary>查看數據表</summary><div class="scroll"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  }

  SR.charts = { barline, hbar, diverge, range, vbar };
  SR.chartLegend = function (s) {
    return legend(s).map(([c, t]) => `<span>${c === 'hatch' ? '<i class="dot" style="background:repeating-linear-gradient(45deg,var(--blue) 0 2px,transparent 2px 4px);border:1px solid var(--blue)"></i>' : c ? `<i class="dot ${c === 'gold' ? 'gold' : c}"></i>` : ''}${esc(t)}</span>`).join('');
  };
  SR.chartTable = dataTable;
  SR.drawChart = function (host) {
    const spec = host._spec, plot = host.querySelector('.plot');
    if (!spec || !plot) return;
    const w = Math.floor(plot.clientWidth - 12);
    if (w < 50) return;
    plot.innerHTML = SR.charts[spec.kind](spec, w);
    host._w = w;
  };
})();
