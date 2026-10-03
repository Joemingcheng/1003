/* 版型：把一份報告資料（data/<代碼>.js）渲染成頁面。
   換一家公司時，這支程式不用動，只要換資料與文字。
   報告骨架（由上而下）：封面 → 這份報告怎麼來的 → 三張數字卡 → 30 秒結論 → 五章本文 → 接下來看什麼 → 限制 → 名詞與免責
   每章同一套模組：問題標題 → 導言 → 一句話結論 → 證據（圖表／表格）→ 怎麼看 → 重點敘事 → 名詞 → 值得追問 */
(function () {
  'use strict';
  const SR = window.SR, esc = SR.esc;
  let calcUid = 0;
  const KIND = { doc: '正式文件', tr: '講稿／逐字稿', media: '媒體', data: '市場資料', calc: '自算' };
  const TONE_LABEL = { blue: '重點', green: '保護因素', red: '風險與壓力', gold: '留意', grey: '限制', purple: '思考' };

  const P = (s, ctx) => `<p>${SR.md(s, ctx)}</p>`;
  const list = (arr, ctx) => `<ul>${arr.map((x) => `<li>${SR.md(x, ctx)}</li>`).join('')}</ul>`;
  const paras = (b, ctx) => (Array.isArray(b) ? b : b ? [b] : []).map((x) => P(x, ctx)).join('');

  /* ---------- 區塊 ---------- */
  const blocks = {
    table(b, ctx) {
      const al = b.align || [];
      const head = b.cols.map((c, i) => `<th class="${al[i] === 'r' ? 'r' : ''}">${SR.md(c, ctx)}</th>`).join('');
      const body = b.rows.map((r) => {
        const cells = Array.isArray(r) ? r : r.cells, tone = Array.isArray(r) ? '' : r.tone ? ' row-' + r.tone : '';
        return `<tr class="${tone.trim()}">${cells.map((c, i) => {
          const t = typeof c === 'object' && c ? c.t : c, cls = typeof c === 'object' && c && c.c ? c.c : '';
          return `<td class="${al[i] === 'r' ? 'r ' : ''}${cls}">${SR.md(t, ctx)}</td>`;
        }).join('')}</tr>`;
      }).join('');
      return `<div class="tbl">${b.title ? `<p class="cap">${SR.md(b.title, ctx)}</p>` : ''}${b.subtitle ? `<p class="sub">${SR.md(b.subtitle, ctx)}</p>` : ''}<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${b.note ? `<p class="note">${SR.md(b.note, ctx)}</p>` : ''}</div>`;
    },

    chart(b, ctx) {
      const id = ctx.charts.push(b) - 1;
      return `<figure class="chart" data-chart="${id}"><h3 class="ct">${SR.md(b.title, ctx)}</h3>${b.subtitle ? `<p class="cs">${SR.md(b.subtitle, ctx)}</p>` : ''}<div class="lg">${SR.chartLegend(b)}</div><div class="plot" aria-hidden="false"></div>${SR.chartTable(b)}${b.note ? `<p class="cs">${SR.md(b.note, ctx)}</p>` : ''}</figure>`;
    },

    callout(b, ctx) {
      const tone = b.tone || 'blue', lab = b.label || TONE_LABEL[tone];
      return `<div class="callout t-${tone}"><h4><span class="lab">${esc(lab)}</span>${SR.md(b.title || '', ctx)}</h4>${paras(b.body, ctx)}${b.items ? list(b.items, ctx) : ''}${b.sowhat ? `<p class="so-what"><b>對你的意義：</b>${SR.md(b.sowhat, ctx)}</p>` : ''}</div>`;
    },

    kpis(b, ctx) {
      return `${b.title ? `<h3 class="sub">${SR.md(b.title, ctx)}</h3>` : ''}<div class="kpis">${b.items.map((k) => `<div class="card kpi mini"><span class="k">${SR.md(k.k, ctx)}</span><span class="v">${SR.md(k.v, ctx)}</span><span class="s">${SR.md(k.s || '', ctx)}</span>${k.cau ? `<span class="cau">${SR.md(k.cau, ctx)}</span>` : ''}</div>`).join('')}</div>${b.note ? `<p class="help">${SR.md(b.note, ctx)}</p>` : ''}`;
    },

    compare(b, ctx) {
      return `${b.title ? `<h3 class="sub">${SR.md(b.title, ctx)}</h3>` : ''}${b.subtitle ? `<p class="lead-note">${SR.md(b.subtitle, ctx)}</p>` : ''}<div class="pair">${b.items.map((it) => `<div class="pc"><div class="hd"><span class="gap">${esc(it.kind)}</span><strong>${SR.md(it.head || '', ctx)}</strong></div><div class="two"><div class="m"><span class="lab">媒體這樣寫</span>${SR.md(it.media, ctx)}</div><div class="d"><span class="lab">文件這樣說</span>${SR.md(it.doc, ctx)}</div></div>${it.verdict ? `<p class="v">${SR.md(it.verdict, ctx)}</p>` : ''}</div>`).join('')}</div>`;
    },

    vs(b, ctx) {
      const col = (c, cls) => `<div class="col ${cls}"><h3>${esc(c.title)}</h3>${c.items.map((it) => `<div class="it"><b>${SR.md(it.h, ctx)}</b><span>${SR.md(it.p, ctx)}</span>${it.qa ? it.qa.map((q) => `<span class="q"><span>${esc(q.k)}：</span>${SR.md(q.v, ctx)}</span>`).join('') : ''}</div>`).join('')}</div>`;
      return `${b.title ? `<h3 class="sub">${SR.md(b.title, ctx)}</h3>` : ''}${b.subtitle ? `<p class="lead-note">${SR.md(b.subtitle, ctx)}</p>` : ''}<div class="vs">${col(b.left, 'red')}${col(b.right, 'green')}</div>`;
    },

    quotes(b, ctx) {
      return `${b.title ? `<h3 class="sub">${SR.md(b.title, ctx)}</h3>` : ''}${b.items.map((q) => `<div class="quote"><span class="tag">${esc(q.tag)}</span><blockquote lang="en">${esc(q.quote)}</blockquote><p class="who">${SR.md(q.who, ctx)}</p><p class="mean"><b>意思是：</b>${SR.md(q.mean, ctx)}</p><p class="mean"><b>為什麼重要：</b>${SR.md(q.why, ctx)}</p>${q.test ? `<p class="mean"><b>怎麼驗證：</b>${SR.md(q.test, ctx)}</p>` : ''}</div>`).join('')}`;
    },

    bullbear(b, ctx) {
      const side = (s, cls) => `<div class="side ${cls}"><h3>${esc(s.title)}</h3><ul>${s.points.map((p) => `<li><span>${SR.md(p.p, ctx)}</span>${p.reply ? `<span class="rp">${SR.md(p.reply, ctx)}</span>` : ''}</li>`).join('')}</ul></div>`;
      return `${b.title ? `<h3 class="sub">${SR.md(b.title, ctx)}</h3>` : ''}<div class="bb">${side(b.bull, 'bull')}${side(b.bear, 'bear')}</div>`;
    },

    text(b, ctx) { return paras(b.body, ctx); },
    grid(b, ctx) { return SR.gridHTML(ctx.report.calc); },
    scenarios(b, ctx) { return SR.scenarioHTML(ctx.report.calc, ctx, b.title); },
    calc(b, ctx) { return SR.calcHTML(ctx.report.calc, ctx, ++calcUid); },
  };
  const block = (b, ctx) => (blocks[b.type] ? blocks[b.type](b, ctx) : '');

  /* ---------- 章節 ---------- */
  function chapter(ch, ctx) {
    const how = ch.howto && ch.howto.length
      ? `<div class="card"><h3 class="sub">怎麼看</h3><ol class="howto">${ch.howto.map((s) => `<li><span><b>${SR.md(s.h, ctx)}</b>${SR.md(s.p, ctx)}</span></li>`).join('')}</ol></div>` : '';
    const terms = ch.terms && ch.terms.length
      ? `<div class="card"><h3 class="sub">這一章的名詞</h3><dl class="terms">${ch.terms.map((t) => `<div><dt>${esc(t.t)}</dt><dd>${SR.md(t.d, ctx)}</dd></div>`).join('')}</dl></div>` : '';
    const asks = ch.asks && ch.asks.length
      ? `<div class="callout t-purple"><h4><span class="lab">值得追問</span></h4><ul class="asks" style="list-style:none;padding:0">${ch.asks.map((a) => `<li><span>${SR.md(a.q, ctx)}</span>${a.hint ? `<span class="hint">提示：${SR.md(a.hint, ctx)}${a.link ? ` <a href="#ch${a.link}" data-go="ch${a.link}">→ 看第 ${a.link} 章</a>` : ''}</span>` : ''}</li>`).join('')}</ul></div>` : '';
    return `<section id="ch${ch.n}" data-ch="${ch.n}">
      <h2 class="h"><span class="no" aria-hidden="true">${ch.n}</span><span>${SR.md(ch.question, ctx)}</span></h2>
      ${ch.lead ? `<p class="lead-note">${SR.md(ch.lead, ctx)}</p>` : ''}
      <div class="concl"><span class="k">一句話結論</span>${SR.md(ch.conclusion, ctx)}</div>
      ${(ch.evidence || []).map((b) => block(b, ctx)).join('')}
      ${how}
      ${(ch.story || []).map((b) => block(b, ctx)).join('')}
      ${terms}${asks}
      ${ch.output ? `<p class="out"><b>本章產出：</b>${SR.md(ch.output, ctx)}</p>` : ''}
    </section>`;
  }

  /* ---------- 報告 ---------- */
  SR.renderReport = function (R) {
    const m = R.meta, srcMap = {};
    (R.sources || []).forEach((s, i) => (srcMap[s.id] = { n: i + 1, label: s.label }));
    const ctx = { report: R, srcMap, charts: [] };
    const nav = [['top', '封面'], ...R.chapters.map((c) => ['ch' + c.n, `${c.n} ${c.short}`]), ['watch', '接下來看什麼'], ['limits', '限制']];

    const cover = `<section id="top" class="cover">
      <div class="pic" data-img="${esc(m.ticker)}"><img src="${esc(m.image)}" alt="${esc(m.name)} 示意圖" width="640" height="360" data-fallback="${esc(m.ticker)}"></div>
      <div>
        <p class="eyebrow">${esc(m.ticker)} · ${esc(m.exchange)} · ${esc(m.reportLabel)}</p>
        <h1>${SR.md(R.headline, ctx)}</h1>
        <p class="subtitle"><strong>${esc(m.name)}${m.nameZh ? `（${esc(m.nameZh)}）` : ''}</strong>｜財報期間：${esc(m.period)}｜公布：${esc(m.released)}｜報告時點：${esc(m.asOf)}（股價資料到 ${esc(m.priceAsOf)} 收盤）</p>
        <p class="intro">${SR.md(R.intro, ctx)}</p>
        <ol class="toc">${R.chapters.map((c) => `<li><a href="#ch${c.n}" data-go="ch${c.n}">${SR.md(c.question, ctx)}</a></li>`).join('')}</ol>
      </div></section>`;

    const how = `<section id="how"><h2 class="h"><span>這份報告怎麼來的</span></h2>
      <div class="card">
        <h3 class="sub">資料來源（每個數字都能指回這裡）</h3>
        <ol class="srcs">${R.sources.map((s, i) => `<li id="src-${s.id}"><span class="n">[${i + 1}]</span><span><span class="kind ${s.kind}">${KIND[s.kind] || ''}</span>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}${s.note ? ` <span class="help">— ${SR.md(s.note, ctx)}</span>` : ''}</span></li>`).join('')}</ol>
      </div>
      <div class="card"><h3 class="sub">分析流程：四段接力，再做人工檢查</h3>
        <ol class="flow">${R.how.flow.map((f) => `<li><b>${esc(f.h)}</b>${SR.md(f.p, ctx)}</li>`).join('')}</ol></div>
      <div class="card"><h3 class="sub">人工檢查清單</h3><ul class="checks">${R.how.checks.map((c) => `<li>${SR.md(c, ctx)}</li>`).join('')}</ul></div>
      <div class="callout t-grey"><h4><span class="lab">聲明</span>不給買賣建議</h4>${P(R.how.notAdvice, ctx)}</div></section>`;

    const cards = `<section id="cards"><h2 class="h"><span>三張數字卡：先抓最重要的三件事</span></h2><div class="kpis">${R.cards.map((k) => `<div class="card kpi"><span class="k">${esc(k.k)}</span><span class="v">${SR.md(k.v, ctx)}</span><span class="s">${SR.md(k.s, ctx)}</span><span class="cmp">${SR.md(k.cmp, ctx)}</span><span class="cau">注意：${SR.md(k.cau, ctx)}</span></div>`).join('')}</div></section>`;

    const sum = `<section id="sum"><h2 class="h"><span>30 秒結論</span></h2><ol class="sum">${R.summary.map((s) => `<li><span>${SR.md(s.text, ctx)} <a class="go" href="#ch${s.ch}" data-go="ch${s.ch}">第 ${s.ch} 章 →</a></span></li>`).join('')}</ol></section>`;

    const watch = `<section id="watch"><h2 class="h"><span>接下來看什麼</span></h2><p class="lead-note">每一項都寫成「日期＋事件＋要看的數字＋對應哪一章的方法」，三個月後可以回來對答案。</p><ul class="watch">${R.watch.map((w) => `<li><span class="dt">${esc(w.date)}${w.status ? `<small>${esc(w.status)}</small>` : ''}</span><span><b>${SR.md(w.event, ctx)}</b><br><span class="look">${SR.md(w.look, ctx)} <a href="#ch${w.ch}" data-go="ch${w.ch}">→ 第 ${w.ch} 章的方法</a></span></span></li>`).join('')}</ul></section>`;

    const limits = `<section id="limits"><h2 class="h"><span>限制</span></h2><div class="callout t-grey"><h4><span class="lab">請先讀這段</span>這份報告做不到的事</h4><ul class="limits">${R.limits.map((l) => `<li>${SR.md(l, ctx)}</li>`).join('')}</ul></div></section>`;

    const seen = new Set(), terms = [];
    R.chapters.forEach((c) => (c.terms || []).forEach((t) => { if (!seen.has(t.t)) { seen.add(t.t); terms.push(t); } }));
    const gloss = `<section id="gloss"><h2 class="h"><span>名詞總表與免責</span></h2><div class="card"><dl class="terms">${terms.map((t) => `<div><dt>${esc(t.t)}</dt><dd>${SR.md(t.d, ctx)}</dd></div>`).join('')}</dl></div>
      <div class="disc"><p>${SR.md(R.disclaimer, ctx)}</p></div></section>`;

    const html = `<nav class="chnav" aria-label="章節導覽"><div class="wrap">${nav.map(([id, t]) => `<a href="#${id}" data-go="${id}" data-nav="${id}">${esc(t)}</a>`).join('')}</div></nav>
      <div class="wrap report" data-ticker="${esc(m.ticker)}">
        <p class="crumb"><a href="#/">← 首頁</a>／${esc(m.ticker)}</p>
        ${cover}${how}${cards}${sum}${R.chapters.map((c) => chapter(c, ctx)).join('')}${watch}${limits}${gloss}
      </div>`;
    return { html, ctx };
  };

  /* 插入頁面之後：畫圖、綁試算、圖片備援、章節導覽高亮 */
  SR.mountReport = function (root, ctx) {
    root.querySelectorAll('figure.chart').forEach((el) => { el._spec = ctx.charts[Number(el.dataset.chart)]; SR.drawChart(el); });
    root.querySelectorAll('[data-calc]').forEach((el) => SR.bindCalc(el, ctx.report.calc));
    SR.bindImages(root);

    /* 章節導覽高亮：以捲動位置判斷（最後一個頂端已過頁首的區塊），大幅跳轉時也準確 */
    const links = [...root.querySelectorAll('[data-nav]')];
    const secs = links.map((a) => root.querySelector('#' + a.dataset.nav));
    let cur = '', ticking = false;
    const setCur = (id) => {
      if (id === cur) return;
      cur = id;
      links.forEach((a) => {
        const on = a.dataset.nav === id;
        a.setAttribute('aria-current', String(on));
        if (on && a.parentElement) a.parentElement.scrollTo({ left: a.offsetLeft - 24, behavior: 'smooth' });
      });
    };
    const spy = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        let id = secs[0] ? secs[0].id : '';
        secs.forEach((s) => { if (s && s.getBoundingClientRect().top <= 150) id = s.id; });
        setCur(id);
      });
    };
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    root._off = () => { window.removeEventListener('scroll', spy); window.removeEventListener('resize', spy); };
    spy();
  };

  /* 圖片載入失敗（例如你還沒放圖）就改顯示代碼字樣，不會出現破圖 */
  SR.bindImages = function (root) {
    root.querySelectorAll('img[data-fallback]').forEach((img) => {
      const swap = () => { if (img.parentElement) img.parentElement.innerHTML = `<div class="mono" aria-hidden="true">${esc(img.dataset.fallback)}</div>`; };
      img.addEventListener('error', swap, { once: true });
      if (img.complete && img.naturalWidth === 0) swap();
    });
  };

  /* ---------- 首頁 ---------- */
  SR.renderHome = function () {
    const idx = SR.index;
    const chips = idx.map((c) => `<a class="chip" href="#/${esc(c.ticker)}"><b>${esc(c.ticker)}</b>${esc(c.nameZh || c.name)}</a>`).join('');
    const cards = idx.map((c) => `<a class="co-card" href="#/${esc(c.ticker)}"><div class="img"><img src="${esc(c.image)}" alt="${esc(c.name)} 示意圖" width="640" height="360" loading="lazy" data-fallback="${esc(c.ticker)}"></div><div class="body"><span class="tk">${esc(c.ticker)}</span><span class="nm">${esc(c.name)}${c.nameZh ? `（${esc(c.nameZh)}）` : ''}</span><span class="hd">${esc(c.headline)}</span><span class="meta">${esc(c.period)}｜${esc(c.sector)}</span></div></a>`).join('');
    const steps = [
      ['賺多少、錢從哪裡來', '拆營收、拆利潤，找出錢真正的來源，寫下這一季的「主線句」。'],
      ['公司怎麼說', '聽管理層怎麼解釋、承諾了什麼，也看他們沒說什麼。'],
      ['市場怎麼反應', '用同業、上下游、類股與大盤對照；再拿媒體報導和文件逐條比對。'],
      ['最該盯什麼', '找出利潤率最敏感的變數，列出「壓力 vs 保護」，把承諾變成可檢驗的數字。'],
      ['股價算貴嗎', '多種方法並列，把「驅動能撐多久」轉成估值裡最關鍵的假設。'],
    ].map((s, i) => `<div class="step"><span class="n">${i + 1}</span><b>${s[0]}</b><p>${s[1]}</p></div>`).join('');
    return `<div class="wrap">
      <section class="hero">
        <h1>輸入美股代碼，<br>用一條主線讀懂這一季財報</h1>
        <p class="lead">每份報告只講一個論點：<strong>「表面上看到的成長是 A，真正的驅動是 B，而 B 正在改變。」</strong>五個章節一路接力，從「賺多少」到「貴不貴」。所有數字取自正式申報文件，媒體只拿來和文件比對。</p>
        <form class="search" data-search role="search" autocomplete="off">
          <label class="sr-only" for="q-hero">輸入美股代碼或公司名稱</label>
          <input id="q-hero" name="q" type="text" inputmode="latin" list="tickers" maxlength="24" placeholder="輸入代碼或公司名，例如 MU" spellcheck="false" autocapitalize="characters">
          <button class="btn primary" type="submit">分析</button>
        </form>
        <div class="chips" aria-label="已收錄的公司"><span class="help">已收錄：</span>${chips}</div>
        <p class="help">只能分析已收錄的公司；輸入其他代碼時，會告訴你怎麼自己拆解，以及如何把它加進本站。</p>
      </section>
      <section><h2 class="sec-title">已收錄的報告</h2><div class="cards-grid">${cards}</div></section>
      <section style="margin-top:36px"><h2 class="sec-title">五個問題，一條主線</h2><div class="method">${steps}</div></section>
      <section style="margin-top:36px"><h2 class="sec-title">顏色代表什麼</h2>
        <div class="legend-row"><span><i class="dot blue"></i>藍：主結論、公司本身</span><span><i class="dot green"></i>綠：正面或保護因素</span><span><i class="dot red"></i>紅：風險或壓力</span><span><i class="dot gold"></i>金：媒體補到但文件沒寫、或需要留意</span><span><i class="dot grey"></i>灰：限制、中性說明</span><span><i class="dot purple"></i>紫：思考題、反方觀點</span></div>
        <p class="help" style="margin-top:8px">圖表一律另附文字標籤與數據表，不單靠顏色傳達意思。標示「自算」的數字，是本站依公開資料計算的，並寫明算法。</p></section>
    </div>`;
  };

  /* ---------- 找不到 ---------- */
  SR.renderNotFound = function (t, raw) {
    const idx = SR.index;
    const chips = idx.map((c) => `<a class="chip" href="#/${esc(c.ticker)}"><b>${esc(c.ticker)}</b>${esc(c.nameZh || c.name)}</a>`).join('');
    if (!t) return `<div class="wrap nf"><h1>代碼格式不正確</h1><p>「${esc(raw)}」看起來不是美股代碼。美股代碼通常是 1 到 5 個英文字母（例如 MU、NVDA、AAPL，或帶點的 BRK.B）。</p><div class="chips">${chips}</div></div>`;
    const sec = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(t)}&type=8-K&dateb=&owner=include&count=40`;
    const steps = [
      ['賺多少、錢從哪裡來', `到 <a href="${sec}" target="_blank" rel="noopener">SEC EDGAR</a> 找 ${esc(t)} 最新的 8-K（新聞稿）與 10-Q／10-K，拿「實際 vs 指引 vs 市場共識 vs 上一季與去年同期」三層對照，並檢查兩期的週數、併購、匯率是否一致。`],
      ['公司怎麼說', '讀法說會逐字稿與官方講稿：挑兩句原話（一句可驗證的承諾、一句主動透露的壞消息），列出「給了什麼數字、沒給什麼數字」。'],
      ['市場怎麼反應', '用直接同業、上下游、類股 ETF、大盤四層對照，算財報後的漲跌與成交量倍數；再把媒體說法和文件逐條比對。'],
      ['最該盯什麼', '找出利潤率最敏感的外部變數（報價、匯率、產能、大客戶……），列「壓力 vs 保護」。'],
      ['股價算貴嗎', '用多種估值方法並列，再用「營收 × 淨利率 × 本益比 ÷ 股數」做三情境，並反推現價隱含的淨利率。'],
    ].map((s) => `<li><b>${s[0]}</b>：${s[1]}</li>`).join('');
    return `<div class="wrap nf">
      <h1>還沒有 ${esc(t)} 的報告</h1>
      <p>本站的每份報告，都是先讀完財報、逐字稿與新聞，再把數字和判斷寫進一個資料檔，所以只能顯示已收錄的公司。目前有：</p>
      <div class="chips">${chips}</div>
      <div class="card"><h3 class="sub">想自己拆解 ${esc(t)}？照這五步做</h3><ol>${steps}</ol></div>
      <div class="callout t-blue"><h4><span class="lab">站長用</span>怎麼把 ${esc(t)} 加進本站</h4><ul>
        <li>複製 <code>data/_template.js</code>，改名為 <code>data/${esc(t)}.js</code>，照註解填入數字與文字。</li>
        <li>在 <code>data/index.js</code> 加一筆卡片資料，並把圖片放進 <code>images/</code>（沒有圖片時會自動改顯示代碼字樣）。</li>
        <li>可用 <code>python tools/sec_quarters.py ${esc(t)}</code> 從 SEC 抓出歷年單季營收、毛利、淨利等原始數字備料。</li>
        <li>版型與程式不用改；詳細說明見 <code>README.md</code>。</li></ul></div>
      <p><a href="#/">← 回首頁</a></p></div>`;
  };
})();
