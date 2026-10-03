/* ============================================================================
   新公司範本 — 怎麼用
   1. 複製本檔，改名為 data/<代碼>.js（例如 data/AAPL.js），代碼用大寫。
   2. 依序把每個「TODO」換成內容。順序照「五章接力」：先做第 1 章、寫出主線句，再回頭寫其他部分。
   3. 在 data/index.js 加一筆首頁卡片；圖片放 images/<代碼>.svg（或 .png），沒有圖片時網站會自動顯示代碼字樣。
   4. 不用改任何版型或程式。

   文字標記（資料裡的字串都可以用）：
     **粗體**          {{自算}}（本站自己算的數字，標籤）      [s3]（指向 sources 第 3 項的上標連結）
     [[MU|美光報告]]   連到站內另一家公司的報告            \n（換行）
   數字原則：只用正式申報文件；每個數字附 [sN]；自己算的標 {{自算}} 並寫出算法；時點與限制要寫明。

   區塊（evidence／story 陣列裡可放的 type）：
     table      { type:'table', title, subtitle, cols:[...], align:['l','r',...], rows:[ [...] 或 {tone:'blue', cells:[...]} ], note }
                儲存格可寫字串，或 { t:'+5%', c:'pos' | 'neg' } 讓數字上色
     chart      { type:'chart', kind:'barline'|'hbar'|'diverge'|'range'|'vbar', title(＝結論句), subtitle, ... }  各種 kind 的欄位見 MU.js 範例
     callout    { type:'callout', tone:'blue'|'green'|'red'|'gold'|'grey'|'purple', title, body, items:[...], sowhat }
     kpis       { type:'kpis', title, items:[{k, v, s, cau}], note }
     compare    { type:'compare', title, items:[{kind:'歸因錯'|'時態錯'|'基期錯'|'範圍錯', head, media, doc, verdict}] }
     vs         { type:'vs', left:{title, items:[{h,p,qa:[{k,v}]}]}, right:{...} }          （壓力 vs 保護）
     quotes     { type:'quotes', items:[{tag, quote(英文原話，15 字內), who, mean, why, test}] }
     bullbear   { type:'bullbear', bull:{title, points:[{p, reply}]}, bear:{...} }
     scenarios  { type:'scenarios', title }   由 calc.scenarios 自動產生，保證和試算預設值一致
     grid       { type:'grid' }               由 calc.grid 自動產生（淨利率 × 本益比 方格表）
     calc       { type:'calc' }               互動試算（要有頂層 calc 設定）
   顏色語意全站一致：藍＝主結論　綠＝正面／保護　紅＝風險／壓力　金＝媒體補到或需留意　灰＝限制　紫＝思考／反方
   ============================================================================ */
SR.register({
  meta: {
    ticker: 'TODO', name: 'TODO Company Inc.', nameZh: 'TODO 中文名', exchange: 'NASDAQ', sector: 'TODO 產業',
    image: 'images/TODO.svg', reportLabel: 'TODO 財報解讀',
    period: 'TODO 財報期間（含週數）', released: 'TODO 公布時點', asOf: 'TODO 報告寫作日', priceAsOf: 'TODO 股價資料截止日', price: 0
  },

  headline: 'TODO「[公司]這一季 [亮眼數字]，但 [真正的驅動因素]，而 [這個因素的變化方向]」——寫不出來就回頭拆第 1 章',
  intro: 'TODO 一段白話：這家公司賣什麼、靠什麼賺錢、這份報告要回答什麼。',

  sources: [
    // kind：doc 正式文件｜tr 講稿／逐字稿｜media 媒體｜data 市場資料｜calc 自算
    { id: 's1', kind: 'doc', label: 'TODO 8-K 新聞稿', url: 'https://www.sec.gov/…', note: 'TODO' }
  ],

  how: {
    flow: [{ h: '① 取數', p: 'TODO' }, { h: '② 找原因', p: 'TODO' }, { h: '③ 估值', p: 'TODO' }, { h: '④ 媒體比對', p: 'TODO' }, { h: '⑤ 整合與人工檢查', p: 'TODO' }],
    checks: ['每個數字都能指回文件出處。', '自己算的數字都標了「自算」。', '所有「比上一季」都確認過基期。', '圖表顏色與文字敘述一致。', '試算的預設值＝情境表上的數字。', '時點與限制已寫明。'],
    notAdvice: '這份報告是教學用的財報拆解，不是買賣建議。'
  },

  // 三張數字卡：規模（營收）、獲利能力（毛利率）、前瞻（指引）；每張附對照物與一個注意事項
  cards: [
    { k: '規模', v: 'TODO', s: 'TODO', cmp: 'TODO 對照物[s1]', cau: 'TODO 注意事項' },
    { k: '獲利能力', v: 'TODO', s: 'TODO', cmp: 'TODO', cau: 'TODO' },
    { k: '前瞻', v: 'TODO', s: 'TODO', cmp: 'TODO', cau: 'TODO' }
  ],

  // 30 秒結論：五點，依序對應五章
  summary: [{ ch: 1, text: 'TODO' }, { ch: 2, text: 'TODO' }, { ch: 3, text: 'TODO' }, { ch: 4, text: 'TODO' }, { ch: 5, text: 'TODO' }],

  chapters: [
    {
      n: 1, short: '賺多少',
      question: '這一季賺了多少？錢是從哪裡來的？',
      lead: '先看比預期好多少，不是先看成長幾倍。',
      conclusion: 'TODO 一句話結論（要有數字）。結尾寫主線句：表面上看到的成長是 A，真正的驅動是 B，而 B 正在改變。',
      evidence: [
        // 建議：三層對照表（實際／指引／共識／前期）→ 營收＋毛利率圖 → 增量橫條圖 → 部門對照表 → 基期檢查 → 費用對帳 → 資產負債表看一眼
        { type: 'table', title: 'TODO', cols: ['項目', '實際', '指引', '共識'], rows: [['TODO', 'TODO', 'TODO', 'TODO']] }
      ],
      howto: [{ h: 'TODO 動作', p: 'TODO 解釋' }, { h: 'TODO', p: 'TODO' }, { h: 'TODO', p: 'TODO' }],
      story: [{ type: 'callout', tone: 'blue', title: '主線句', body: 'TODO', sowhat: 'TODO' }],
      terms: [{ t: 'TODO 名詞', d: 'TODO 白話解釋（只放本章第一次出現的詞）' }],
      asks: [{ q: 'TODO 開放題', hint: 'TODO 提示（至少一題指向別章）', link: 4 }, { q: 'TODO', hint: '', link: 0 }],
      output: 'TODO 本章產出（第 1 章＝主線裡的 B）。'
    },
    { n: 2, short: '公司怎麼說', question: '公司自己怎麼說？承諾了什麼、避開了什麼？', lead: '先看給了什麼數字，再看沒給什麼數字。', conclusion: 'TODO', evidence: [], howto: [], story: [], terms: [], asks: [], output: 'TODO' },
    { n: 3, short: '市場反應', question: '市場怎麼反應？媒體說對了嗎？', lead: '先看同業有沒有一起動，不是先看自己漲了多少。', conclusion: 'TODO', evidence: [], howto: [], story: [], terms: [], asks: [], output: 'TODO' },
    { n: 4, short: '盯什麼', question: '最該盯什麼？這個數字能撐多久？', lead: '方向比水準重要。', conclusion: 'TODO', evidence: [], howto: [], story: [], terms: [], asks: [], output: 'TODO' },
    { n: 5, short: '貴不貴', question: '股價算貴嗎？市場在賭什麼？', lead: 'TODO', conclusion: 'TODO',
      evidence: [{ type: 'scenarios', title: '三情境' }, { type: 'grid' }, { type: 'calc' }], howto: [], story: [], terms: [], asks: [], output: 'TODO' }
  ],

  // 互動試算：每股價值 = 營收 × 淨利率 × 本益比 ÷ 股數。三個情境的每個參數都要有出處（保守＝歷史中位數；中性＝上一輪高峰或共識；樂觀＝指引隱含）
  calc: {
    title: '互動試算：營收 × 淨利率 × 本益比 ÷ 股數', intro: 'TODO',
    shares: 1000, sharesNote: 'TODO 股數來源（百萬股）', price: 100, priceDate: 'TODO',
    revenue: { label: '年化營收（十億美元）', min: 1, max: 100, step: 0.1, decimals: 1, prefix: '$', suffix: 'B', hint: 'TODO' },
    margin: { label: '淨利率', min: 1, max: 80, step: 0.1, decimals: 1, suffix: '%', hint: 'TODO' },
    pe: { label: '本益比', min: 3, max: 60, step: 0.1, decimals: 1, suffix: '×', hint: 'TODO' },
    defaultScenario: 'neu',
    scenarios: [
      { key: 'cons', name: '保守', revenue: 10, margin: 10, pe: 10, source: 'TODO 三個參數各自的出處' },
      { key: 'neu', name: '中性', revenue: 20, margin: 20, pe: 15, source: 'TODO' },
      { key: 'opt', name: '樂觀', revenue: 30, margin: 30, pe: 20, source: 'TODO' }
    ],
    grid: { title: 'TODO', subtitle: 'TODO', revenue: 20, margins: [10, 20, 30], pes: [10, 15, 20] }
  },

  // 接下來看什麼：每一項＝日期＋事件＋要看的數字＋對應哪一章的方法
  watch: [{ date: 'TODO 日期', status: '已公告｜預計', event: 'TODO', look: 'TODO 要看的數字', ch: 4 }],
  limits: ['**時點：**TODO', '**自算數字：**TODO', '**尚未取得的文件：**TODO'],
  disclaimer: '本報告為教學用途，不構成買賣建議、目標價或股價預測。所有數字皆標示出處；標示「自算」者為本站依公開資料計算。投資有風險，請自行查證並諮詢專業人士。'
});
