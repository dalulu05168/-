export default async function handler(req, res) {
  try {
    const raw = String(req.query.symbols || "AAPL,NVDA,MSFT,MC.PA,OR.PA,AIR.PA");
    const symbols = raw.split(",").map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9.^=-]{1,20}$/.test(s)).slice(0, 12);
    if (!symbols.length) return res.status(400).json({ error: "缺少有效股票代码" });

    const rows = await Promise.all(symbols.map(async symbol => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m&includePrePost=false`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
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
      return {
        symbol,
        name: meta.longName || meta.shortName || symbol,
        exchange: meta.exchangeName || meta.fullExchangeName || "",
        currency: meta.currency || "",
        price,
        previousClose: prev,
        changePct,
        marketState: meta.marketState || "",
        timezone: meta.exchangeTimezoneName || "",
        points
      };
    }));

    res.setHeader("Cache-Control","s-maxage=45, stale-while-revalidate=120");
    return res.status(200).json({
      source: "Yahoo Finance public chart endpoint",
      mode: "free-delayed/non-guaranteed",
      updatedAt: new Date().toISOString(),
      rows
    });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "行情服务异常" });
  }
}
