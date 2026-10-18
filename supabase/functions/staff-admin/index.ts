
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
function validUsername(v: string) { return /^[A-Za-z0-9._-]{3,32}$/.test(v); }

async function audit(supabase: any, callerId: string, action: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
  try {
    await supabase.from("audit_logs").insert({
      user_id: callerId,
      action,
      entity_type: "profiles",
      entity_id: entityId,
      metadata
    });
  } catch (_) {}
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "未登录" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "登录已失效" }, 401);

    const { data: caller } = await supabase.from("profiles")
      .select("id,role,status,username,display_name")
      .eq("id", userData.user.id).single();
    if (!caller || caller.role !== "admin" || caller.status !== "active") {
      return json({ error: "无管理员权限" }, 403);
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create") {
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      const displayName = String(body.display_name || "").trim();
      const role = String(body.role || "");
      const phone = body.phone ? String(body.phone).trim() : null;
      let parentId = body.parent_user_id ? String(body.parent_user_id) : null;

      if (!validUsername(username)) return json({ error: "账号格式不正确" }, 400);
      if (password.length < 8) return json({ error: "密码至少 8 位" }, 400);
      if (!displayName) return json({ error: "请输入姓名" }, 400);
      if (role !== "level2") return json({ error: "仅支持创建二级账户" }, 400);
      parentId = caller.id;

      const email = `${username.toLowerCase()}@crm.nuvexapro.com`;
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { username, display_name: displayName }
      });
      if (createErr || !created.user) return json({ error: createErr?.message || "创建账户失败" }, 400);

      const { error: profileErr } = await supabase.from("profiles").insert({
        id: created.user.id,
        username,
        display_name: displayName,
        role,
        status: "active",
        parent_user_id: parentId,
        phone
      });
      if (profileErr) {
        await supabase.auth.admin.deleteUser(created.user.id);
        return json({ error: profileErr.message }, 400);
      }
      await audit(supabase, caller.id, "create_staff", created.user.id, { username, display_name: displayName, role, parent_user_id: parentId });
      return json({ ok: true, user_id: created.user.id });
    }

    if (action === "reset_password") {
      const target = String(body.user_id || "");
      const password = String(body.new_password || "");
      if (!target || password.length < 8) return json({ error: "参数不正确" }, 400);
      const { data: targetProfile } = await supabase.from("profiles").select("role,status").eq("id", target).single();
      if (!targetProfile || targetProfile.status === "deleted") return json({ error: "账户不存在" }, 404);
      const { error } = await supabase.auth.admin.updateUserById(target, { password });
      if (error) return json({ error: error.message }, 400);
      await audit(supabase, caller.id, "reset_password", target, { target_role: targetProfile.role });
      return json({ ok: true });
    }

    if (action === "set_status") {
      const target = String(body.user_id || "");
      const status = String(body.status || "");
      if (!target || !["active","disabled"].includes(status)) return json({ error: "参数不正确" }, 400);
      if (target === caller.id && status === "disabled") return json({ error: "不能禁用当前管理员账户" }, 400);
      const { data: targetProfile } = await supabase.from("profiles")
        .select("id,role,status,parent_user_id").eq("id", target).single();
      if (!targetProfile || targetProfile.status === "deleted") return json({ error: "账户不存在" }, 404);

      if (status === "disabled" && targetProfile.role === "level2") {
        const { count } = await supabase.from("customers")
          .select("id",{count:"exact",head:true}).eq("owner_user_id",target);
        if ((count || 0) > 0) return json({ error: "该二级人员仍有客户，请先转移客户后再禁用" }, 400);
      }

      if (status === "active" && targetProfile.role !== "admin") {
        const { data: parent } = await supabase.from("profiles")
          .select("id,role,status").eq("id",targetProfile.parent_user_id).single();
        const expectedRole = "admin";
        if (!parent || parent.role !== expectedRole || parent.status !== "active") {
          return json({ error: "上级账号未启用，不能启用当前账号" }, 400);
        }
      }

      const { error } = await supabase.from("profiles").update({ status }).eq("id", target);
      if (error) return json({ error: error.message }, 400);
      await audit(supabase, caller.id, "set_staff_status", target, { previous_status: targetProfile.status, status, role: targetProfile.role });
      return json({ ok: true });
    }

    if (action === "update") {
      const target = String(body.user_id || "");
      if (!target) return json({ error: "缺少用户 ID" }, 400);

      const { data: current, error: currentErr } = await supabase.from("profiles")
        .select("id,username,display_name,role,status,parent_user_id,phone")
        .eq("id", target).single();
      if (currentErr || !current || current.status === "deleted") return json({ error: "账户不存在" }, 404);

      const username = body.username !== undefined ? String(body.username).trim() : current.username;
      const displayName = body.display_name !== undefined ? String(body.display_name).trim() : current.display_name;
      const phone = body.phone !== undefined ? (body.phone ? String(body.phone).trim() : null) : current.phone;
      let parentId = current.parent_user_id;

      if (!validUsername(username)) return json({ error: "账号格式不正确" }, 400);
      if (!displayName) return json({ error: "请输入姓名" }, 400);

      if (current.role === "admin") {
        parentId = null;
      } else {
        if (current.role !== "level2") return json({ error: "账户角色不受支持" }, 400);
        if (body.parent_user_id !== undefined) parentId = String(body.parent_user_id || "");
        const { data: parent } = await supabase.from("profiles").select("id,role,status").eq("id", parentId).single();
        if (!parent || parent.role !== "admin" || parent.status !== "active") return json({ error: "请选择有效管理员" }, 400);
      }

      if (username.toLowerCase() !== String(current.username).toLowerCase()) {
        const { data: duplicate } = await supabase.from("profiles").select("id").ilike("username", username).neq("id", target).maybeSingle();
        if (duplicate) return json({ error: "该账号已存在" }, 400);
        const email = `${username.toLowerCase()}@crm.nuvexapro.com`;
        const { error: authErr } = await supabase.auth.admin.updateUserById(target, {
          email,
          email_confirm: true,
          user_metadata: { username, display_name: displayName }
        });
        if (authErr) return json({ error: authErr.message }, 400);
      } else {
        const { error: metaErr } = await supabase.auth.admin.updateUserById(target, {
          user_metadata: { username, display_name: displayName }
        });
        if (metaErr) return json({ error: metaErr.message }, 400);
      }

      const oldParentId = current.parent_user_id;
      const { error } = await supabase.from("profiles").update({
        username, display_name: displayName, phone, parent_user_id: parentId
      }).eq("id", target);
      if (error) return json({ error: error.message }, 400);

      if (current.role === "level2" && oldParentId !== parentId) {
        const { error: customerMoveErr } = await supabase.from("customers")
          .update({ level_one_user_id: null })
          .eq("owner_user_id", target);
        if (customerMoveErr) {
          await supabase.from("profiles").update({ parent_user_id: oldParentId }).eq("id", target);
          return json({ error: "二级人员已修改失败，客户归属同步未完成：" + customerMoveErr.message }, 400);
        }
      }
      await audit(supabase, caller.id, "update_staff", target, {
        previous: { username: current.username, display_name: current.display_name, phone: current.phone, parent_user_id: oldParentId },
        next: { username, display_name: displayName, phone, parent_user_id: parentId },
        role: current.role
      });
      return json({ ok: true });
    }

    if (action === "delete") {
      const target = String(body.user_id || "");
      if (!target) return json({ error: "缺少用户 ID" }, 400);
      if (target === caller.id) return json({ error: "不能删除当前管理员账户" }, 400);

      const { data: current } = await supabase.from("profiles")
        .select("id,role,status,display_name").eq("id", target).single();
      if (!current || current.status === "deleted") return json({ error: "账户不存在" }, 404);
      if (current.role === "admin") return json({ error: "不能删除管理员账户" }, 400);

      if (current.role === "level2") {
        const { count: customerCount } = await supabase.from("customers")
          .select("id",{count:"exact",head:true}).eq("owner_user_id",target);
        if ((customerCount || 0) > 0) return json({ error: "该二级人员仍有客户，请先把客户转移到其他二级人员" }, 400);
      }

      const { error: banErr } = await supabase.auth.admin.updateUserById(target, { ban_duration: "876000h" });
      if (banErr) return json({ error: banErr.message }, 400);

      const { error } = await supabase.from("profiles").update({ status: "deleted" }).eq("id", target);
      if (error) return json({ error: error.message }, 400);
      await audit(supabase, caller.id, "delete_staff", target, { role: current.role, display_name: current.display_name });
      return json({ ok: true });
    }

    return json({ error: "未知操作" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "操作失败" }, 500);
  }
});

