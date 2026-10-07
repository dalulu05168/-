const ALLOWED=/^[A-Z0-9.^=\-\s]{1,80}$/i;

export default async function handler(req,res){
  try{
    const q=String(req.query.q||"").trim();
    if(!q||!ALLOWED.test(q))return res.status(400).json({error:"invalid query"});
    const url="https://query1.finance.yahoo.com/v1/finance/search?q="+encodeURIComponent(q)+"&quotesCount=12&newsCount=0&enableFuzzyQuery=true";
    const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(7000)});
    if(!r.ok)return res.status(r.status).json({error:"search unavailable"});
    const j=await r.json();
    const rows=(j.quotes||[]).filter(x=>x?.symbol).slice(0,12).map(x=>({
      symbol:String(x.symbol||"").toUpperCase(),
      name:x.longname||x.shortname||x.symbol,
      shortName:x.shortname||null,
      exchange:x.exchange||x.exchDisp||null,
      exchangeDisplay:x.exchDisp||null,
      type:x.quoteType||x.typeDisp||null,
      currency:x.currency||null,
      score:x.score||null
    }));
    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=180");
    return res.status(200).json({query:q,rows});
  }catch(e){
    return res.status(500).json({error:e instanceof Error?e.message:"search error"});
  }
}
