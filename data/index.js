/* 首頁卡片與搜尋建議清單。新增公司時，在這裡加一筆（完整報告放 data/<代碼>.js）。
   image：放在 images/ 的圖片，用相對路徑；找不到圖片時網站會自動改顯示代碼字樣。 */
window.SR = window.SR || {};
SR.index = [
  {
    ticker: 'MU', name: 'Micron Technology', nameZh: '美光科技', image: 'images/MU.svg',
    period: 'FQ4-26（截至 2026-09-03）', sector: '記憶體 DRAM／NAND',
    headline: '營收衝上 542 億美元、毛利率 87%，但多出來的營收主要靠「漲價」而不是「賣更多」，而漲價的速度預期正在放慢'
  },
  {
    ticker: 'NVDA', name: 'NVIDIA', nameZh: '輝達', image: 'images/NVDA.svg',
    period: 'Q2 FY27（截至 2026-07-26）', sector: 'AI 加速運算',
    headline: '營收衝上 962 億美元、毛利率 75%，但收現沒跟上：應收帳款一季暴增 223 億、自由現金流不到上一季的一半，輝達同時在替客戶的擴張融資'
  },
  {
    ticker: 'AAPL', name: 'Apple', nameZh: '蘋果', image: 'images/AAPL.svg',
    period: 'FQ3-26（截至 2026-06-27）', sector: '消費電子與服務',
    headline: '營收 1,094 億美元（+16%）、EPS +29%，但毛利率 50.1% 含約 2 個百分點一次性關稅退費；扣掉後約 48.1%，下一季實質毛利率預告降到約 46.5%（記憶體漲價）'
  },
  {
    ticker: 'CSCO', name: 'Cisco Systems', nameZh: '思科', image: 'images/CSCO.svg',
    period: 'Q4 FY26（截至 2026-07-25）', sector: '網路設備與資安軟體',
    headline: '營收 173 億美元（+18%）、訂單 +35%，但成長主要來自毛利較低的 AI 硬體與漲價：非 GAAP 毛利率 68.4%→66.3%，下一季預告 65–66%；回購 61 億美元，流通股只少 0.35%'
  },
  {
    ticker: 'SPCX', name: 'SpaceX', nameZh: '太空探索科技', image: 'images/SPCX.svg',
    period: 'Q2 2026（截至 2026-06-30；上市後第一份財報）', sector: '太空發射、Starlink 與 AI 算力',
    headline: '營收 78 億美元（+92%），但新增營收四成來自 5 月才開始的「出租 AI 算力」，單季資本支出 184 億是營收的 2.4 倍；合約 90 天可終止，公司不回購、反而四個月新發行 10.3 億股'
  }
];
