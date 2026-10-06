const MARKET_INFO = [
  [".RO", { country: "罗马尼亚", countryCode: "RO", exchangeLabel: "Bucharest Stock Exchange", currency: "RON" }],
  [".PA", { country: "法国", countryCode: "FR", exchangeLabel: "Euronext Paris", currency: "EUR" }],
  [".DE", { country: "德国", countryCode: "DE", exchangeLabel: "Xetra / Frankfurt", currency: "EUR" }],
  [".L",  { country: "英国", countryCode: "GB", exchangeLabel: "London Stock Exchange", currency: "GBP" }],
  [".MI", { country: "意大利", countryCode: "IT", exchangeLabel: "Borsa Italiana", currency: "EUR" }],
  [".MC", { country: "西班牙", countryCode: "ES", exchangeLabel: "Bolsa de Madrid", currency: "EUR" }],
  [".AS", { country: "荷兰", countryCode: "NL", exchangeLabel: "Euronext Amsterdam", currency: "EUR" }],
  [".SW", { country: "瑞士", countryCode: "CH", exchangeLabel: "SIX Swiss Exchange", currency: "CHF" }],
  [".WA", { country: "波兰", countryCode: "PL", exchangeLabel: "Warsaw Stock Exchange", currency: "PLN" }],
  [".T",  { country: "日本", countryCode: "JP", exchangeLabel: "Tokyo Stock Exchange", currency: "JPY" }]
];

const RO_NAMES = {
  TLV:"Banca Transilvania",
  SNP:"OMV Petrom",
  SNG:"Romgaz",
  SNN:"Nuclearelectrica",
  H2O:"Hidroelectrica",
  BRD:"BRD Groupe Société Générale",
  BVB:"Bursa de Valori București"
};

function marketInfo(symbol) {
  const s = symbol.toUpperCase();
  for (const [suffix, info] of MARKET_INFO) if (s.endsWith(suffix)) return info;
  return { country: "美国", countryCode: "US", exchangeLabel: "NASDAQ / NYSE", currency: "USD" };
}

function tag(xml, name) {
  const m = xml.match(new RegExp("<(?:\\w+:)?"+name+"(?:\\s[^>]*)?>([^<]*)</(?:\\w+:)?"+name+">", "i"));
  return m ? m[1].trim() : "";
}
function numberTag(xml, names) {
  for (const n of names) {
    const v = Number(tag(xml, n));
    if (Number.isFinite(v)) return v;
  }
  return null;
}
function parseBvbTrades(xml) {
  const blocks = [...xml.matchAll(/<TypeTrade>([\s\S]*?)<\/TypeTrade>/gi)].map(m => m[1]);
  return blocks.map(b => {
    const time = tag(b, "TradeTime");
    const price = numberTag(b, ["Price"]);
    const volume = numberTag(b, ["Volume"]);
    return { t: time ? Date.parse(time) : null, close: price, volume };
  }).filter(p => Number.isFinite(p.t) && Number.isFinite(p.close)).sort((a,b)=>a.t-b.t);
}

async function bvbRealtime(symbol) {
  const code = symbol.replace(/\.RO$/i, "");
  const levelUrl = `https://ws.bvb.ro/BVBOnline/Intraday.asmx/Level1?symbol=${encodeURIComponent(code)}&market=`;
  const seriesUrl = `https://ws.bvb.ro/BVBOnline/Intraday.asmx/SymbolDataSeries?symbol=${encodeURIComponent(code)}&market=&fromID=0&toID=0`;
  const headers = { "User-Agent": "Brantone-Veylor-CRM/1.0" };
  const [levelRes, seriesRes] = await Promise.all([
    fetch(levelUrl, { headers, signal: AbortSignal.timeout(7000) }),
    fetch(seriesUrl, { headers, signal: AbortSignal.timeout(7000) })
  ]);
  if (!levelRes.ok) throw new Error(`BVB Level1 HTTP ${levelRes.status}`);
  const level = await levelRes.text();
  if (/error|unauthori|forbidden/i.test(level) || !/<[^>]+>/.test(level)) throw new Error("BVB 实时接口未返回有效数据");
  const points = seriesRes.ok ? parseBvbTrades(await seriesRes.text()) : [];
  const price = numberTag(level, ["Lastprice","LastPrice","Closeprice","ClosePrice","ReferencePrice"]);
  const prev = numberTag(level, ["OfficialPrice","ReferencePrice","PreviousClose","PrevClose"]);
  const changePct = numberTag(level, ["PrcChgFromOfficialPrice","PrcChange","PercentChange"]);
  const lastTrade = tag(level, "LastTradeTime") || tag(level, "LastBestTime");
  if (!Number.isFinite(price)) throw new Error("BVB 实时价格为空");
  return {
    symbol,
    name: code,
    exchange: "Bucharest Stock Exchange",
    country: "罗马尼亚",
    countryCode: "RO",
    currency: "RON",
    price,
    previousClose: prev,
    changePct: Number.isFinite(changePct) ? changePct : (prev ? ((price-prev)/prev)*100 : null),
    marketState: tag(level, "SymbolStatus") || "BVB",
    timezone: "Europe/Bucharest",
    points,
    source: "Bucharest Stock Exchange BVB Online",
    realtime: true,
    delaySeconds: 0,
    lastTradeAt: lastTrade || (points.at(-1)?.t ? new Date(points.at(-1).t).toISOString() : null)
  };
}

async function bvbDelayed(symbol) {
  const code = symbol.replace(/\.RO$/i, "");
  const levelUrl = `https://ws.bvb.ro/BVBDelayedWS/Intraday.asmx/Level1?symbol=${encodeURIComponent(code)}&market=`;
  const seriesUrl = `https://ws.bvb.ro/BVBDelayedWS/Intraday.asmx/SymbolDataSeries?symbol=${encodeURIComponent(code)}&market=&fromID=0&toID=0`;
  const headers = { "User-Agent": "Brantone-Veylor-CRM/1.0" };
  const [levelRes, seriesRes] = await Promise.all([
    fetch(levelUrl, { headers, signal: AbortSignal.timeout(7000) }),
    fetch(seriesUrl, { headers, signal: AbortSignal.timeout(7000) })
  ]);
  if (!levelRes.ok) throw new Error(`BVB Delayed Level1 HTTP ${levelRes.status}`);
  const level = await levelRes.text();
  const points = seriesRes.ok ? parseBvbTrades(await seriesRes.text()) : [];
  const price = numberTag(level, ["Closeprice","ClosePrice","Lastprice","LastPrice","ReferencePrice"]);
  const prev = numberTag(level, ["ReferencePrice","OfficialPrice","PreviousClose","PrevClose"]);
  const changePct = numberTag(level, ["PrcChgFromOfficialPrice","PrcChange","PercentChange"]);
  const lastTrade = tag(level, "LastTradeTime") || tag(level, "LastBestTime");
  if (!Number.isFinite(price)) throw new Error("BVB 官方延迟行情价格为空");
  return {
    symbol,
    name: RO_NAMES[code] || code,
    exchange: "Bucharest Stock Exchange",
    country: "罗马尼亚",
    countryCode: "RO",
    currency: "RON",
    price,
    previousClose: prev,
    changePct: Number.isFinite(changePct) ? changePct : (prev ? ((price-prev)/prev)*100 : null),
    marketState: tag(level, "SymbolStatus") || "BVB",
    timezone: "Europe/Bucharest",
    points,
    source: "BVB Official Delayed",
    realtime: false,
    delaySeconds: 900,
    lastTradeAt: lastTrade || (points.at(-1)?.t ? new Date(points.at(-1).t).toISOString() : null)
  };
}

async function yahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&includePrePost=false`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(7000) });
  if (!r.ok) return { symbol, error: `HTTP ${r.status}` };
  const j = await r.json();
  const result = j?.chart?.result?.[0];
  if (!result) return { symbol, error: "无行情数据" };
  const meta = result.meta || {};
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const volumes = quote.volume || [];
  const points = timestamps.map((t,i) => ({ t: t*1000, close: closes[i] ?? null, volume: volumes[i] ?? null })).filter(p => p.close !== null);
  const price = meta.regularMarketPrice ?? points.at(-1)?.close ?? null;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const changePct = price != null && prev ? ((price-prev)/prev)*100 : null;
  const delay = Number(meta.exchangeDataDelayedBy);
  const realtime = Number.isFinite(delay) ? delay === 0 : false;
  const info = marketInfo(symbol);
  return {
    symbol,
    name: meta.longName || meta.shortName || symbol,
    exchange: meta.exchangeName || meta.fullExchangeName || info.exchangeLabel,
    country: info.country,
    countryCode: info.countryCode,
    currency: meta.currency || info.currency,
    price,
    previousClose: prev,
    changePct,
    marketState: meta.marketState || "",
    timezone: meta.exchangeTimezoneName || "",
    points,
    source: "Yahoo Finance",
    realtime,
    delaySeconds: Number.isFinite(delay) ? delay : null,
    lastTradeAt: meta.regularMarketTime ? new Date(meta.regularMarketTime*1000).toISOString() : (points.at(-1)?.t ? new Date(points.at(-1).t).toISOString() : null)
  };
}

async function getQuote(symbol) {
  if (symbol.endsWith(".RO")) {
    try { return await bvbRealtime(symbol); }
    catch (realtimeError) {
      try {
        const delayed = await bvbDelayed(symbol);
        delayed.realtimeError = realtimeError instanceof Error ? realtimeError.message : "BVB Online 实时权限不可用";
        return delayed;
      } catch (delayedError) {
        return {
          symbol,
          name: RO_NAMES[symbol.replace(/\.RO$/i,"")] || symbol,
          exchange: "Bucharest Stock Exchange",
          country: "罗马尼亚",
          countryCode: "RO",
          currency: "RON",
          realtime: false,
          delaySeconds: null,
          source: "BVB",
          error: delayedError instanceof Error ? delayedError.message : "BVB 行情不可用"
        };
      }
    }
  }
  return yahooQuote(symbol);
}

export default async function handler(req, res) {
  try {
    const raw = String(req.query.symbols || "TLV.RO,SNP.RO,SNG.RO,SNN.RO,H2O.RO,AAPL,NVDA,MSFT,MC.PA,SAP.DE,SHEL.L,ENI.MI");
    const realtimeOnly = String(req.query.realtimeOnly || "0") === "1";
    const symbols = raw.split(",").map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9.^=-]{1,24}$/.test(s)).slice(0, 40);
    if (!symbols.length) return res.status(400).json({ error: "缺少有效股票代码" });

    const rows = await Promise.all(symbols.map(getQuote));
    const normalized = rows.map(row => {
      if (realtimeOnly && !row.error && row.realtime !== true) {
        return {
          symbol: row.symbol,
          country: row.country,
          countryCode: row.countryCode,
          exchange: row.exchange,
          source: row.source,
          realtime: false,
          delaySeconds: row.delaySeconds,
          error: "当前数据源未确认实时，已按系统规则禁止展示价格"
        };
      }
      return row;
    });

    res.setHeader("Cache-Control","s-maxage=5, stale-while-revalidate=10");
    return res.status(200).json({
      mode: "realtime-strict",
      realtimeOnly,
      timezone: "Europe/Bucharest",
      updatedAt: new Date().toISOString(),
      rows: normalized
    });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "行情服务异常" });
  }
}
