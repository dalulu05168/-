// Desktop-only backend. Intentionally empty until a separate project is provisioned.
export const backendConfig=Object.freeze({url:'',publishableKey:''});
export function validateBackend(config){
 const url=String(config?.url||'').trim(),key=String(config?.publishableKey||'').trim();
 if(!url||!key)return {ready:false,reason:'桌面版独立数据库尚未配置。请等待管理员完成配置。'};
 let parsed;try{parsed=new URL(url)}catch{return {ready:false,reason:'独立数据库地址无效。'}}
 if(parsed.protocol!=='https:'||!parsed.hostname.endsWith('.supabase.co')||parsed.hostname==='igcmvzoxminzvcgwimwi.supabase.co'||parsed.pathname!=='/'||parsed.search||parsed.hash||parsed.username||parsed.password)return {ready:false,reason:'此数据库连接不允许用于独立桌面版。'};
 if(!key.startsWith('sb_publishable_')&&!key.startsWith('eyJ'))return {ready:false,reason:'请配置数据库公开连接密钥。'};
 return {ready:true,url:parsed.origin,publishableKey:key};
}
