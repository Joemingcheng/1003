#!/usr/bin/env python3
"""
sec_quarters.py — 從 SEC EDGAR（XBRL）抓某檔美股的「單季」與「年度」財務序列。

用途：替 data/<TICKER>.js 的第 1 章（營收、毛利率、淨利）與第 5 章（歷史淨利率、股數）備料。
所有數字都來自公司送交 SEC 的正式申報（10-Q / 10-K），不含任何第三方估計。

用法：
    python tools/sec_quarters.py MU
    python tools/sec_quarters.py NVDA --quarters 12 --json out.json

注意：
  * SEC 要求自動化請求在 User-Agent 帶上聯絡方式。請用環境變數 SEC_USER_AGENT 設定，
    例如：  set SEC_USER_AGENT=MyStudyProject your-name@example.com
  * 單季值＝10-Q 內「3 個月」的數字；第 4 季 = 年度 − 前三季（標註為 derived，屬自算）。
  * 公司剛公布、但 10-K / 10-Q 尚未送件的最新一季，不會出現在這裡；請從 8-K 新聞稿補。
"""
import argparse, json, os, sys, urllib.request, datetime as dt

UA = os.environ.get("SEC_USER_AGENT", "StockReportStudy contact@example.com")

# 每個指標依序嘗試的 XBRL 概念名稱（各公司用法不一）
CONCEPTS = {
    "revenue":       ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"],
    "cogs":          ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold"],
    "gross_profit":  ["GrossProfit"],
    "op_income":     ["OperatingIncomeLoss"],
    "net_income":    ["NetIncomeLoss"],
    "eps_diluted":   ["EarningsPerShareDiluted"],
    "shares_diluted": ["WeightedAverageNumberOfDilutedSharesOutstanding"],
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "identity"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def ticker_to_cik(ticker):
    data = get("https://www.sec.gov/files/company_tickers.json")
    for row in data.values():
        if row["ticker"].upper() == ticker.upper():
            return str(row["cik_str"]).zfill(10), row["title"]
    raise SystemExit(f"找不到代號 {ticker}（SEC 的公司清單中沒有這個 ticker）")


def days(a, b):
    return (dt.date.fromisoformat(b) - dt.date.fromisoformat(a)).days


def series(facts, names, unit):
    """回傳 {'q': {end: (val, start)}, 'y': {...}, 'concepts': [...]}。
    同一指標常見多個 XBRL 概念名稱（公司會中途換用），所以把各概念的期間聯集起來，
    同一期間以名稱順序在前者為準；同一概念內同一期間取「最新送件」的值。"""
    g = facts.get("facts", {}).get("us-gaap", {})
    q, y, used = {}, {}, []
    for name in names:
        if name not in g or unit not in g[name]["units"]:
            continue
        rows = sorted(g[name]["units"][unit], key=lambda r: r.get("filed", ""))
        qn, yn = {}, {}
        for r in rows:
            if "start" not in r:
                continue
            d = days(r["start"], r["end"])
            if 80 <= d <= 100:
                qn[r["end"]] = (r["val"], r["start"])
            elif 350 <= d <= 380:
                yn[r["end"]] = (r["val"], r["start"])
        if qn or yn:
            used.append(name)
        for k, v in qn.items():
            q.setdefault(k, v)
        for k, v in yn.items():
            y.setdefault(k, v)
    return {"concept": "+".join(used) or None, "q": q, "y": y}


def build(ticker, n_quarters):
    cik, title = ticker_to_cik(ticker)
    facts = get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json")
    out = {"ticker": ticker.upper(), "cik": cik, "name": title, "metrics": {}}
    for key, names in CONCEPTS.items():
        unit = "USD/shares" if key == "eps_diluted" else ("shares" if key == "shares_diluted" else "USD")
        s = series(facts, names, unit)
        # 補第 4 季：年度 − 前三季（只要年度結束日前三個單季都在）
        qs = dict(s["q"])
        for yend, (yval, ystart) in s["y"].items():
            if yend in qs:
                continue
            prior = sorted(k for k, (v, st) in qs.items() if st and ystart <= st and k < yend)
            if len(prior) == 3 and key not in ("eps_diluted", "shares_diluted"):
                qs[yend] = (yval - sum(qs[k][0] for k in prior), None)
                s.setdefault("derived", []).append(yend)
        qs_keep = {k for k, _ in sorted(qs.items())[-n_quarters:]}
        out["metrics"][key] = {
            "concept": s["concept"],
            "quarters": {k: v[0] for k, v in sorted(qs.items())[-n_quarters:]},
            "annual": {k: v[0] for k, v in sorted(s["y"].items())},
            "derived_quarters": [d for d in s.get("derived", []) if d in qs_keep],
        }
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticker")
    ap.add_argument("--quarters", type=int, default=10)
    ap.add_argument("--json", help="另存為 JSON 檔")
    a = ap.parse_args()
    res = build(a.ticker, a.quarters)
    print(f"{res['ticker']}  {res['name']}  CIK {res['cik']}")
    for k, m in res["metrics"].items():
        print(f"\n[{k}]  concept={m['concept']}  derived(自算 Q4)={m['derived_quarters']}")
        for end, v in m["quarters"].items():
            print(f"  Q  {end}  {v:,.2f}" if isinstance(v, float) else f"  Q  {end}  {v:,}")
        for end, v in list(m["annual"].items())[-8:]:
            print(f"  FY {end}  {v:,.2f}" if isinstance(v, float) else f"  FY {end}  {v:,}")
    if a.json:
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False, indent=1)
        print("\n已寫入", a.json)


if __name__ == "__main__":
    sys.exit(main())
