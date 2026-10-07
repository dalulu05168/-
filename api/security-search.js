const ALLOWED=/^[\p{L}\p{N} .^=_\-&'()]{1,80}$/u;
const BVB_SECURITIES=[
  {symbol:"TLV.RO",name:"Banca Transilvania",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"EQUITY",currency:"RON"},
  {symbol:"SNP.RO",name:"OMV Petrom",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"EQUITY",currency:"RON"},
  {symbol:"SNG.RO",name:"Romgaz",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"EQUITY",currency:"RON"},
  {symbol:"SNN.RO",name:"Nuclearelectrica",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"EQUITY",currency:"RON"},
  {symbol:"H2O.RO",name:"Hidroelectrica",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"EQUITY",currency:"RON"},
  {symbol:"BRD.RO",name:"BRD Groupe Société Générale",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"EQUITY",currency:"RON"},
  {symbol:"BVB.RO",name:"Bursa de Valori București",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"EQUITY",currency:"RON"},
  {symbol:"BET.RO",name:"BET Index",exchange:"BVB",exchangeDisplay:"Bucharest Stock Exchange",type:"INDEX",currency:"RON"}
];
function bvbMatches(q){
  const n=q.toLowerCase();
  return BVB_SECURITIES.filter(x=>x.symbol.toLowerCase().includes(n)||x.name.toLowerCase().includes(n)||n.includes(x.symbol.toLowerCase().replace(".ro","")));
}

export default async function handler(req,res){
  try{
    const q=String(req.query.q||"").trim();
    if(!q||!ALLOWED.test(q))return res.status(400).json({error:"invalid query"});
    const local=bvbMatches(q);
    let remote=[];
    try{
      const url="https://query1.finance.yahoo.com/v1/finance/search?q="+encodeURIComponent(q)+"&quotesCount=12&newsCount=0&enableFuzzyQuery=true";
      const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(7000)});
      if(r.ok){
        const j=await r.json();
        remote=(j.quotes||[]).filter(x=>x?.symbol).slice(0,12).map(x=>({
          symbol:String(x.symbol||"").toUpperCase(),
          name:x.longname||x.shortname||x.symbol,
          shortName:x.shortname||null,
          exchange:x.exchange||x.exchDisp||null,
          exchangeDisplay:x.exchDisp||null,
          type:x.quoteType||x.typeDisp||null,
          currency:x.currency||null,
          score:x.score||null
        }));
      }
    }catch{}
    const seen=new Set();
    const rows=[...local,...remote].filter(x=>{
      const k=String(x.symbol||"").toUpperCase();
      if(!k||seen.has(k))return false;seen.add(k);return true;
    }).slice(0,12);
    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=180");
    return res.status(200).json({query:q,rows});
  }catch(e){
    return res.status(500).json({error:e instanceof Error?e.message:"search error"});
  }
}
