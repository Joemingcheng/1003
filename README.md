# 美股財報解讀（靜態網站）

輸入美股代碼，用「**一條主線、五個問題**」讀懂公司這一季的財報：賺多少 → 公司怎麼說 → 市場怎麼反應 → 最該盯什麼 → 貴不貴。

純 HTML／CSS／JS，沒有後端、沒有建置步驟，可以直接放上 GitHub Pages。

目前收錄：**MU（美光）**、**NVDA（輝達）**、**AAPL（蘋果）**。報告時點：2026-10-03，股價資料到 2026-10-02 收盤。

---

## 資料夾結構

```
index.html          首頁（唯一的 HTML；報告由 JS 依網址產生）
css/style.css       樣式（顏色語意：藍＝主結論 綠＝保護 紅＝壓力 金＝媒體補到 灰＝限制 紫＝思考）
js/
  util.js           跳脫、行內標記、數字格式
  charts.js         純 SVG 圖表（營收＋毛利率、橫條、股價反應、估值區間、直條）
  calc.js           互動試算與情境表
  render.js         版型：把一份報告資料渲染成頁面
  app.js            路由、搜尋、主題切換
data/
  index.js          首頁卡片與搜尋建議清單
  MU.js  NVDA.js  AAPL.js   各公司的報告資料（只有數字與文字）
  _template.js      新增公司用的範本（含欄位說明）
images/             各公司的圖片（相對路徑；MU.svg、NVDA.svg、AAPL.svg 是示意圖）
tools/
  sec_quarters.py   從 SEC EDGAR（XBRL）抓某檔股票的單季與年度財務序列，替新報告備料
  check_reports.js  報告資料自動檢查（出處引用、情境與試算一致、原話長度…）；需要 Node.js
```

**資料和版面分開**：換一家公司時，`css/`、`js/` 都不用動，只要新增 `data/<代碼>.js`。

## 在自己電腦預覽

兩種方式都可以：

1. 直接雙擊 `index.html`。報告資料是用 `<script>` 載入（不是 fetch），所以程式上不需要伺服器；但本站只在 http 伺服器環境下實測過，若你的瀏覽器因安全設定無法顯示，請改用第 2 種。
2. 或在這個資料夾開終端機，執行 `python -m http.server 8000`，再開 <http://localhost:8000>。

網址格式：`#/MU` 是美光的報告，`#/MU/ch3` 會直接捲到第 3 章。

## 部署到 GitHub Pages（手動上傳）

1. 在 GitHub 建立一個新的 repository（例如 `us-stock-report`），設為 Public。
2. 進入 repository → **Add file → Upload files**，把下列內容**連同資料夾結構**拖進去：
   `index.html`、`css/`、`js/`、`data/`、`images/`、`README.md`（`tools/` 想放就放，網站不需要它）。
   - **`index.html` 必須在 repository 的最上層**。
   - 不需要上傳：`.claude/`（本機預覽設定）、`vibe-site/` 與 `tsmc-2330-quote-20261002.html`（這個資料夾裡其他專案的檔案）。
3. 進入 **Settings → Pages**，Source 選 *Deploy from a branch*，Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
4. 等一兩分鐘，網址會是 `https://<你的帳號>.github.io/<repository 名稱>/`。

所有路徑都是相對路徑（`images/MU.svg`、`data/MU.js`），所以放在子路徑底下也能運作。

## 為什麼是「預先產製」資料，而不是即時抓取

SEC EDGAR 的 API 沒有開放瀏覽器跨網域存取（沒有 CORS 標頭），靜態網頁無法在使用者的瀏覽器裡即時向它取資料；而且報告的核心——管理層怎麼說、媒體比對、估值判斷——需要人讀完文件才寫得出來。所以做法是：先讀完文件，把數字與判斷寫進 `data/<代碼>.js`，網站負責把它畫成同一套版型。

輸入尚未收錄的代碼時，網站會說明這一點，並給出「自己拆解這家公司」的五個步驟與 SEC 連結。

## 新增一家公司

1. 備料：`python tools/sec_quarters.py TSLA --quarters 10`
   - SEC 要求自動化請求帶上聯絡方式，請先設定環境變數：
     Windows（PowerShell）`$env:SEC_USER_AGENT="MyStudyProject you@example.com"`；macOS／Linux `export SEC_USER_AGENT="MyStudyProject you@example.com"`
   - 只會抓到「已送件」的季度；剛公布但 10-Q／10-K 還沒送的最新一季，請從 8-K 新聞稿補。
2. 複製 `data/_template.js` → `data/TSLA.js`，依序填寫。順序照五章接力，**先做第 1 章、寫出主線句**，再回頭做其他部分；寫不出來就回頭再拆數字。
3. 在 `data/index.js` 加一筆卡片資料；圖片放 `images/TSLA.svg`（或 `.png`，改 `image` 欄位即可）。沒有圖片時，網站會自動改顯示代碼字樣。
4. 重新上傳 `data/` 與 `images/` 即可。

### 上線前先跑資料檢查

```bash
node tools/check_reports.js          # 檢查所有報告
node tools/check_reports.js TSLA     # 只檢查 TSLA
```

它會檢查：每個 `[sN]` 都有對應來源、每個來源都被引用、三情境的參數在滑桿範圍內、估值圖的「三情境」區間和試算算出的一致、引用的英文原話不超過 15 個字、沒有殘留的標記或 TODO。有錯誤時結束碼不是 0。

### 人工檢查清單（每份報告上線前）

- 每個數字都能指回文件出處（`[sN]`）。
- 自算的數字已標 `{{自算}}`，並寫明算法。
- 所有「比上一季」「比去年同期」都確認過基期（週數、併購、匯率、一次性項目、口徑變更）。
- 圖表顏色與文字敘述一致。
- 試算的預設值＝情境表的數字（情境表由同一份參數自動產生，天然一致）。
- 媒體文章的**日期**已核對（搜尋結果可能把舊文排在新日期底下）。
- 時點與限制已寫明。

## 關於圖片

`images/` 裡的 `MU.svg`、`NVDA.svg` 是本站自繪的示意圖（晶片造型加代碼），**不是公司的官方標誌**。若要換成官方 Logo 或照片，請把檔案放進 `images/` 並在 `data/index.js` 與該公司資料檔的 `image` 欄位改檔名；使用前請自行確認授權。

## 授權與免責

教學用途；不構成投資建議。報告裡的數字取自公開的正式申報文件與所列來源，標示「自算」者為本站計算，可能與其他來源略有差異。
