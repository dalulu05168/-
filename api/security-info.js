const MARKET_INFO=[
  [".RO",{country:"罗马尼亚",market:"Bucharest Stock Exchange",currency:"RON"}],
  [".PA",{country:"法国",market:"Euronext Paris",currency:"EUR"}],
  [".DE",{country:"德国",market:"Xetra / Frankfurt",currency:"EUR"}],
  [".L",{country:"英国",market:"London Stock Exchange",currency:"GBP"}],
  [".MI",{country:"意大利",market:"Borsa Italiana",currency:"EUR"}],
  [".MC",{country:"西班牙",market:"Bolsa de Madrid",currency:"EUR"}],
  [".AS",{country:"荷兰",market:"Euronext Amsterdam",currency:"EUR"}],
  [".SW",{country:"瑞士",market:"SIX Swiss Exchange",currency:"CHF"}],
  [".WA",{country:"波兰",market:"Warsaw Stock Exchange",currency:"PLN"}],
  [".T",{country:"日本",market:"Tokyo Stock Exchange",currency:"JPY"}]
];
function infoFor(symbol){
  const s=symbol.toUpperCase();
  for(const [suffix,info] of MARKET_INFO)if(s.endsWith(suffix))return info;
  return {country:"美国",market:"NASDAQ / NYSE",currency:"USD"};
}
export default async function handler(req,res){
  try{
    const symbol=String(req.query.symbol||"").trim().toUpperCase();
    if(!/^[A-Z0-9.^=\-]{1,24}$/.test(symbol))return res.status(400).json({error:"invalid symbol"});
    const [chartRes,searchRes]=await Promise.all([
      fetch("https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=5d&interval=5m&includePrePost=false",{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(7000)}),
      fetch("https://query1.finance.yahoo.com/v1/finance/search?q="+encodeURIComponent(symbol)+"&quotesCount=8&newsCount=0",{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(7000)})
    ]);
    const cj=chartRes.ok?await chartRes.json():null;
    const result=cj?.chart?.result?.[0]||null;
    const meta=result?.meta||{};
    const sj=searchRes.ok?await searchRes.json():null;
    const match=(sj?.quotes||[]).find(x=>String(x.symbol||"").toUpperCase()===symbol)||(sj?.quotes||[])[0]||{};
    const fallback=infoFor(symbol);
    const price=meta.regularMarketPrice??null;
    const prev=meta.chartPreviousClose??meta.previousClose??null;
    const changePct=price!=null&&prev?((price-prev)/prev)*100:null;
    const q=result?.indicators?.quote?.[0]||{};
    const ts=result?.timestamp||[];
    const points=ts.map((t,i)=>({
      t:t*1000,open:q.open?.[i]??q.close?.[i]??null,high:q.high?.[i]??q.close?.[i]??null,
      low:q.low?.[i]??q.close?.[i]??null,close:q.close?.[i]??null,volume:q.volume?.[i]??null
    })).filter(x=>x.close!=null);
    const out={
      symbol,
      companyName:meta.longName||meta.shortName||match.longname||match.shortname||symbol,
      stockName:meta.shortName||match.shortname||match.longname||symbol,
      exchange:meta.fullExchangeName||meta.exchangeName||match.exchDisp||match.exchange||fallback.market,
      market:fallback.market,
      country:fallback.country,
      currency:meta.currency||match.currency||fallback.currency,
      industry:match.industry||match.sector||null,
      price,
      previousClose:prev,
      changePct,
      timezone:meta.exchangeTimezoneName||null,
      lastTradeAt:meta.regularMarketTime?new Date(meta.regularMarketTime*1000).toISOString():(points.at(-1)?.t?new Date(points.at(-1).t).toISOString():null),
      points,
      source:"Yahoo Finance"
    };
    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=180");
    return res.status(200).json(out);
  }catch(e){
    return res.status(500).json({error:e instanceof Error?e.message:"security info error"});
  }
}
