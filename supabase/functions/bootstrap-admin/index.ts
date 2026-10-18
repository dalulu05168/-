
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { username, password, display_name, bootstrap_code } = await req.json();
    if (!/^[A-Za-z0-9._-]{3,32}$/.test(String(username || ""))) {
      return json({ error: "账号格式不正确" }, 400);
    }
    if (String(password || "").length < 8) return json({ error: "密码至少 8 位" }, 400);
    if (!String(display_name || "").trim()) return json({ error: "请输入管理员姓名" }, 400);
    if (!String(bootstrap_code || "")) return json({ error: "缺少初始化码" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: cfg, error: cfgErr } = await supabase
      .from("system_config")
      .select("key,value")
      .in("key", ["bootstrap_code_sha256", "bootstrap_used"]);
    if (cfgErr) return json({ error: cfgErr.message }, 500);

    const map = Object.fromEntries((cfg || []).map((x: any) => [x.key, x.value]));
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin").eq("status", "active");
    if (map.bootstrap_used === "true" || (count || 0) > 0) return json({ error: "系统已完成初始化" }, 409);
    if ((await sha256(String(bootstrap_code))) !== map.bootstrap_code_sha256) return json({ error: "初始化码错误" }, 403);

    const email = `${String(username).toLowerCase()}@ellery-desktop.invalid`;
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: String(password),
      email_confirm: true,
      user_metadata: { username, display_name }
    });
    if (createErr || !created.user) return json({ error: createErr?.message || "创建管理员失败" }, 400);

    const { error: profileErr } = await supabase.from("profiles").insert({
      id: created.user.id,
      username,
      display_name: String(display_name).trim(),
      role: "admin",
      status: "active",
      parent_user_id: null
    });
    if (profileErr) {
      await supabase.auth.admin.deleteUser(created.user.id);
      return json({ error: profileErr.message }, 400);
    }

    await supabase.from("system_config").update({ value: "true", updated_at: new Date().toISOString() }).eq("key", "bootstrap_used");
    return json({ ok: true, username, role: "admin" });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "初始化失败" }, 500);
  }
});

