const E = new TextEncoder();
const B = (v) => {
  const a = v instanceof Uint8Array ? v : new Uint8Array(v);
  let s = "";
  for (const x of a) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const D = (v) => Uint8Array.from(atob(v.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(v.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const J = (data, init = {}) => Response.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init.headers || {}) } });

async function hashPassword(password, salt = B(crypto.getRandomValues(new Uint8Array(16)))) {
  let value = E.encode(`${salt}|${password}`);
  for (let i = 0; i < 1200; i++) value = new Uint8Array(await crypto.subtle.digest("SHA-256", value));
  return `v1$${salt}$${B(value)}`;
}
async function verifyPassword(password, stored) {
  const [, salt] = String(stored || "").split("$");
  return Boolean(salt) && (await hashPassword(password, salt)) === stored;
}
async function sessionToken(id, secret) {
  const payload = `${id}.${Math.floor(Date.now() / 1000) + 1209600}`;
  const key = await crypto.subtle.importKey("raw", E.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${B(E.encode(payload))}.${B(await crypto.subtle.sign("HMAC", key, E.encode(payload)))}`;
}
async function currentUser(request, env) {
  const raw = request.headers.get("Cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith("wms_session="))?.slice(12);
  if (!raw || !env.SESSION_SECRET) return null;
  const [encoded, signature] = raw.split(".");
  const payload = encoded && new TextDecoder().decode(D(encoded));
  if (!payload || !signature) return null;
  const key = await crypto.subtle.importKey("raw", E.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  if (!(await crypto.subtle.verify("HMAC", key, D(signature), E.encode(payload)))) return null;
  const [id, expires] = payload.split(".");
  if (!id || Number(expires) < Date.now() / 1000) return null;
  return env.DB.prepare("SELECT id,email,name,role,warehouse_scope,status FROM users WHERE id=? AND status='active'").bind(Number(id)).first();
}
const cookie = (value) => `wms_session=${value}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=1209600`;
const can = (user, roles) => Boolean(user && roles.includes(user.role));
const forbidden = () => J({ error: "没有权限执行此操作" }, { status: 403 });
const bad = (error) => J({ error }, { status: 400 });
const positiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

async function audit(env, user, action, resource, detail) {
  if (!user) return;
  await env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)")
    .bind(user.id, action, resource, typeof detail === "string" ? detail : JSON.stringify(detail))
    .run();
}
async function validateItems(env, items, allowActual = false) {
  if (!Array.isArray(items) || items.length === 0) return { error: "至少需要一条商品明细" };
  const normalized = [];
  for (const item of items) {
    if (!positiveInt(item.product_id)) return { error: "商品不合法" };
    const quantity = allowActual ? Number(item.actual_quantity) : Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity < 0 || (!allowActual && quantity <= 0)) return { error: "数量必须为有效数字" };
    const product = await env.DB.prepare("SELECT id,sku,name,status FROM products WHERE id=?").bind(Number(item.product_id)).first();
    if (!product || product.status !== "active") return { error: "商品不存在或已停用" };
    const existing = normalized.find((entry) => entry.product_id === Number(item.product_id));
    if (existing) {
      existing.quantity += quantity;
      existing.actual_quantity += quantity;
    } else normalized.push({ product_id: Number(item.product_id), quantity, actual_quantity: quantity, sku: product.sku, name: product.name });
  }
  return { items: normalized };
}
async function warehouseExists(env, id) {
  return Boolean(await env.DB.prepare("SELECT id FROM warehouses WHERE id=?").bind(Number(id)).first());
}
function documentNo(prefix) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const entropy = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(-6);
  return `${prefix}-${stamp}-${entropy}`;
}
async function api(request, env, path) {
  try {
    if (path === "/api/health") return J({ ok: true, service: "wmsystem-api", timestamp: new Date().toISOString() });
    if (path === "/api/auth/me" && request.method === "GET") return J({ user: await currentUser(request, env) });
    if (path === "/api/auth/me" && request.method === "DELETE") return J({ ok: true }, { headers: { "Set-Cookie": "wms_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" } });

    if (path === "/api/auth/register" && request.method === "POST") {
      return J({ error: "系统已关闭自助注册，请联系管理员创建工作账号" }, { status: 403 });
    }
    if (path === "/api/auth/bootstrap" && request.method === "POST") {
      if (!env.BOOTSTRAP_TOKEN || request.headers.get("X-Bootstrap-Token") !== env.BOOTSTRAP_TOKEN) return forbidden();
      const existing = await env.DB.prepare("SELECT id FROM users LIMIT 1").first();
      if (existing) return J({ error: "系统已经完成管理员初始化" }, { status: 409 });
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      if (!email || !name || password.length < 8) return bad("管理员姓名、邮箱和至少 8 位密码为必填项");
      const result = await env.DB.prepare("INSERT INTO users(email,name,password_hash,role,warehouse_scope) VALUES(?,?,?,?,?)").bind(email, name, await hashPassword(password), "admin", "all").run();
      return J({ id: result.meta.last_row_id, message: "管理员初始化成功，请使用登录接口登录" });
    }
    if (path === "/api/auth/login" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const user = await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(String(body.email || "").trim().toLowerCase()).first();
      if (!user || user.status !== "active" || !(await verifyPassword(body.password || "", user.password_hash))) return J({ error: "邮箱或密码不正确" }, { status: 401 });
      delete user.password_hash;
      return J({ user }, { headers: { "Set-Cookie": cookie(await sessionToken(user.id, env.SESSION_SECRET)) } });
    }

    const user = await currentUser(request, env);
    if (!user) return J({ error: "未登录" }, { status: 401 });

    if (path === "/api/users" && request.method === "GET") {
      if (!can(user, ["admin"])) return forbidden();
      return J({ users: (await env.DB.prepare("SELECT id,email,name,role,warehouse_scope,status,created_at FROM users ORDER BY id DESC").all()).results });
    }
    if (path === "/api/users" && request.method === "POST") {
      if (!can(user, ["admin"])) return forbidden();
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      const role = ["admin", "manager", "operator", "viewer"].includes(body.role) ? body.role : "operator";
      if (!name || !email || password.length < 8) return bad("姓名、邮箱和至少 8 位初始密码为必填项");
      if (await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first()) return J({ error: "该邮箱已注册" }, { status: 409 });
      try {
        const result = await env.DB.prepare("INSERT INTO users(email,name,password_hash,role,warehouse_scope) VALUES(?,?,?,?,?)").bind(email, name, await hashPassword(password), role, body.warehouse_scope || "all").run();
        await audit(env, user, "管理员新增员工账号", `user:${result.meta.last_row_id}`, { name, email, role });
        return J({ id: result.meta.last_row_id });
      } catch { return J({ error: "员工账号创建失败" }, { status: 409 }); }
    }
    if (path.startsWith("/api/users/") && request.method === "PATCH") {
      if (!can(user, ["admin"])) return forbidden();
      const body = await request.json().catch(() => ({}));
      const id = Number(path.split("/").pop());
      const role = ["admin", "manager", "operator", "viewer"].includes(body.role) ? body.role : null;
      const status = ["active", "disabled"].includes(body.status) ? body.status : null;
      await env.DB.prepare("UPDATE users SET role=COALESCE(?,role),status=COALESCE(?,status) WHERE id=?").bind(role, status, id).run();
      await audit(env, user, "更新成员", `user:${id}`, { role, status });
      return J({ ok: true });
    }

    if (path === "/api/products" && request.method === "GET") {
      return J({ products: (await env.DB.prepare("SELECT id,sku,name,category,unit,barcode,min_stock,status,created_at FROM products ORDER BY id DESC").all()).results });
    }
    if (path === "/api/products" && request.method === "POST") {
      if (!can(user, ["admin", "manager"])) return forbidden();
      const body = await request.json().catch(() => ({}));
      if (!body.sku || !body.name || !body.category) return bad("SKU、商品名称和分类为必填项");
      try {
        const result = await env.DB.prepare("INSERT INTO products(sku,name,category,unit,barcode,min_stock) VALUES(?,?,?,?,?,?)").bind(body.sku, body.name, body.category, body.unit || "件", body.barcode || null, Math.max(0, Number(body.min_stock || 0))).run();
        await audit(env, user, "新增商品", `product:${result.meta.last_row_id}`, { sku: body.sku, name: body.name });
        return J({ id: result.meta.last_row_id });
      } catch {
        return J({ error: "SKU 已存在" }, { status: 409 });
      }
    }

    if (path === "/api/dashboard" && request.method === "GET") {
      const total = await env.DB.prepare("SELECT COALESCE(SUM(quantity),0) total FROM inventory").first();
      const low = await env.DB.prepare("SELECT COUNT(*) count FROM inventory i JOIN products p ON p.id=i.product_id WHERE i.quantity<p.min_stock").first();
      const pending = await env.DB.prepare("SELECT COUNT(*) count FROM stock_documents WHERE status='pending'").first();
      const recent = await env.DB.prepare("SELECT d.id,d.document_no,d.type,d.status,d.created_at,d.rejection_reason,d.operator_name handler,w.name warehouse,u.name operator FROM stock_documents d JOIN warehouses w ON w.id=d.warehouse_id LEFT JOIN users u ON u.id=d.operator_id WHERE d.status<>'deleted' ORDER BY d.id DESC LIMIT 8").all();
      const alerts = await env.DB.prepare("SELECT p.sku,p.name,w.name warehouse,i.quantity,p.min_stock FROM inventory i JOIN products p ON p.id=i.product_id JOIN warehouses w ON w.id=i.warehouse_id WHERE i.quantity<p.min_stock AND p.status='active' ORDER BY i.quantity ASC").all();
      const trend = await env.DB.prepare("SELECT substr(m.created_at,1,10) day, SUM(CASE WHEN m.movement_type IN ('inbound','transfer_in') THEN ABS(m.quantity) ELSE 0 END) inbound, SUM(CASE WHEN m.movement_type='outbound' THEN ABS(m.quantity) ELSE 0 END) outbound FROM stock_movements m JOIN stock_documents d ON d.id=m.document_id WHERE d.status='approved' AND m.created_at>=date('now','-29 day') GROUP BY substr(m.created_at,1,10) ORDER BY day").all();
      const consistency = await env.DB.prepare("SELECT COUNT(*) count FROM inventory i LEFT JOIN (SELECT m.warehouse_id,m.product_id,SUM(m.quantity) net FROM stock_movements m JOIN stock_documents d ON d.id=m.document_id WHERE d.status='approved' GROUP BY m.warehouse_id,m.product_id) m ON m.warehouse_id=i.warehouse_id AND m.product_id=i.product_id WHERE ABS(i.quantity-COALESCE(i.opening_quantity,0)-COALESCE(m.net,0))>0.0001").first();
      return J({ stats: { total: Number(total?.total || 0), low: Number(low?.count || 0), pending: Number(pending?.count || 0), consistency: Number(consistency?.count || 0) }, recent: recent.results, alerts: alerts.results, trend: trend.results });
    }
    if (path === "/api/inventory" && request.method === "GET") {
      const rows = await env.DB.prepare("SELECT i.warehouse_id,i.product_id,p.sku,p.name,p.category,p.unit,w.name warehouse,i.quantity,i.locked_quantity,p.min_stock,CASE WHEN i.quantity<p.min_stock THEN '低库存' ELSE '充足' END stock_status,COALESCE((SELECT code FROM warehouse_locations l WHERE l.warehouse_id=i.warehouse_id LIMIT 1),'—') location FROM inventory i JOIN products p ON p.id=i.product_id JOIN warehouses w ON w.id=i.warehouse_id WHERE p.status='active' ORDER BY stock_status DESC,p.name").all();
      return J({ rows: rows.results, user });
    }

    if (path === "/api/inbound" && request.method === "GET") return J({ documents: (await env.DB.prepare("SELECT d.id,d.document_no,d.status,d.remark,d.created_at,d.rejection_reason,d.operator_name handler,w.name warehouse,u.name operator FROM stock_documents d JOIN warehouses w ON w.id=d.warehouse_id LEFT JOIN users u ON u.id=d.operator_id WHERE d.type='inbound' AND d.status<>'deleted' ORDER BY d.id DESC").all()).results });
    if (path === "/api/inbound" && request.method === "POST") {
      if (!can(user, ["admin", "manager", "operator"])) return forbidden();
      const body = await request.json().catch(() => ({}));
      if (!(await warehouseExists(env, body.warehouse_id))) return bad("仓库不存在");
      const operatorName = String(body.operator_name || "").trim();
      if (!operatorName) return bad("请填写现场操作人姓名");
      if (operatorName === user.name) return bad("现场操作人不能填写当前登录账号姓名");
      const checked = await validateItems(env, body.items);
      if (checked.error) return bad(checked.error);
      const number = documentNo("IN");
      const statements = [env.DB.prepare("INSERT INTO stock_documents(document_no,type,warehouse_id,status,operator_id,operator_name,remark) VALUES(?,'inbound',?,'pending',?,?,?)").bind(number, body.warehouse_id, user.id, operatorName, body.remark || null)];
      for (const item of checked.items) statements.push(env.DB.prepare("INSERT INTO stock_document_items(document_id,product_id,quantity,location) SELECT id,?,?,? FROM stock_documents WHERE document_no=?").bind(item.product_id, item.quantity, item.location || null, number));
      statements.push(env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, "提交入库单", `document:${number}`, JSON.stringify({ document_no: number })));
      await env.DB.batch(statements);
      const created = await env.DB.prepare("SELECT id FROM stock_documents WHERE document_no=?").bind(number).first();
      return J({ id: created?.id, document_no: number });
    }
    if (path.startsWith("/api/inbound/") && path.endsWith("/approve") && request.method === "POST") {
      if (!can(user, ["admin", "manager"])) return forbidden();
      const id = Number(path.split("/")[3]);
      const claimed = await env.DB.prepare("UPDATE stock_documents SET status='processing' WHERE id=? AND type='inbound' AND status='pending'").bind(id).run();
      if (!claimed.meta.changes) return J({ error: "入库单不存在、已处理或正在审核" }, { status: 409 });
      const document = await env.DB.prepare("SELECT * FROM stock_documents WHERE id=? AND type='inbound' AND status='processing'").bind(id).first();
      const items = (await env.DB.prepare("SELECT * FROM stock_document_items WHERE document_id=?").bind(id).all()).results;
      const statements = [];
      for (const item of items) {
        statements.push(env.DB.prepare("INSERT INTO inventory(warehouse_id,product_id,quantity,locked_quantity) VALUES(?,?,?,0) ON CONFLICT(warehouse_id,product_id) DO UPDATE SET quantity=quantity+excluded.quantity,updated_at=CURRENT_TIMESTAMP").bind(document.warehouse_id, item.product_id, item.quantity));
        statements.push(env.DB.prepare("INSERT INTO stock_movements(product_id,warehouse_id,document_id,movement_type,quantity,operator_name) VALUES(?,?,?,'inbound',?,?)").bind(item.product_id, document.warehouse_id, id, item.quantity, document.operator_name));
      }
      statements.push(env.DB.prepare("UPDATE stock_documents SET status='approved' WHERE id=? AND status='processing'").bind(id));
      statements.push(env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, "审核入库单", `document:${id}`, JSON.stringify({ document_no: document.document_no })));
      try { await env.DB.batch(statements); } catch (error) { await env.DB.prepare("UPDATE stock_documents SET status='pending' WHERE id=? AND status='processing'").bind(id).run(); throw error; }
      return J({ ok: true });
    }

    const operationType = path === "/api/outbound" ? "outbound" : path === "/api/count" ? "count" : path === "/api/transfer" ? "transfer" : null;
    if (operationType && request.method === "GET") {
      const query = operationType === "transfer"
        ? "SELECT d.id,d.document_no,d.status,d.remark,d.created_at,d.operator_name handler,w.name warehouse,tw.name target_warehouse,u.name operator FROM stock_documents d JOIN warehouses w ON w.id=d.warehouse_id LEFT JOIN warehouses tw ON tw.id=d.target_warehouse_id LEFT JOIN users u ON u.id=d.operator_id WHERE d.type='transfer' AND d.status<>'deleted' ORDER BY d.id DESC"
        : "SELECT d.id,d.document_no,d.status,d.remark,d.created_at,d.rejection_reason,d.operator_name handler,w.name warehouse,u.name operator FROM stock_documents d JOIN warehouses w ON w.id=d.warehouse_id LEFT JOIN users u ON u.id=d.operator_id WHERE d.type=? AND d.status<>'deleted' ORDER BY d.id DESC";
      const result = operationType === "transfer" ? await env.DB.prepare(query).all() : await env.DB.prepare(query).bind(operationType).all();
      return J({ documents: result.results });
    }
    if (operationType && request.method === "POST") {
      if (!can(user, ["admin", "manager", "operator"])) return forbidden();
      const body = await request.json().catch(() => ({}));
      if (!(await warehouseExists(env, body.warehouse_id))) return bad("仓库不存在");
      const operatorName = String(body.operator_name || "").trim();
      if (!operatorName) return bad("请填写现场操作人姓名");
      if (operatorName === user.name) return bad("现场操作人不能填写当前登录账号姓名");
      if (operationType === "transfer" && (Number(body.warehouse_id) === Number(body.target_warehouse_id) || !(await warehouseExists(env, body.target_warehouse_id)))) return bad("调出和调入仓库必须有效且不能相同");
      const checked = await validateItems(env, body.items, operationType === "count");
      if (checked.error) return bad(checked.error);
      const number = documentNo(operationType === "outbound" ? "OUT" : operationType === "count" ? "CNT" : "TR");
      const statements = [operationType === "transfer"
        ? env.DB.prepare("INSERT INTO stock_documents(document_no,type,warehouse_id,target_warehouse_id,status,operator_id,operator_name,remark) VALUES(?,'transfer',?,?,'pending',?,?,?)").bind(number, body.warehouse_id, body.target_warehouse_id, user.id, operatorName, body.remark || null)
        : env.DB.prepare("INSERT INTO stock_documents(document_no,type,warehouse_id,status,operator_id,operator_name,remark) VALUES(?,?,?,'pending',?,?,?)").bind(number, operationType, body.warehouse_id, user.id, operatorName, body.remark || null)];
      for (const item of checked.items) {
        if (operationType === "count") statements.push(env.DB.prepare("INSERT INTO stock_document_items(document_id,product_id,quantity,actual_quantity) SELECT id,?,?,? FROM stock_documents WHERE document_no=?").bind(item.product_id, item.quantity, item.actual_quantity, number));
        else statements.push(env.DB.prepare("INSERT INTO stock_document_items(document_id,product_id,quantity) SELECT id,?,? FROM stock_documents WHERE document_no=?").bind(item.product_id, item.quantity, number));
      }
      statements.push(env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, `提交${operationType === "outbound" ? "出库" : operationType === "count" ? "盘点" : "调拨"}单`, `document:${number}`, JSON.stringify({ document_no: number })));
      await env.DB.batch(statements);
      const created = await env.DB.prepare("SELECT id FROM stock_documents WHERE document_no=?").bind(number).first();
      return J({ id: created?.id, document_no: number });
    }
    if (path.match(/^\/api\/outbound\/\d+\/reject$/) && request.method === "POST") {
      if (!can(user, ["admin", "manager"])) return forbidden();
      const id = Number(path.split("/")[3]);
      const body = await request.json().catch(() => ({}));
      const reason = String(body.reason || "").trim();
      if (reason.length < 2) return bad("请填写至少 2 个字的驳回原因");
      if (reason.length > 500) return bad("驳回原因不能超过 500 个字");
      const document = await env.DB.prepare("SELECT id,document_no FROM stock_documents WHERE id=? AND type='outbound' AND status='pending'").bind(id).first();
      if (!document) return J({ error: "出库单不存在或已处理" }, { status: 404 });
      const rejected = await env.DB.prepare("UPDATE stock_documents SET status='rejected',rejection_reason=? WHERE id=? AND status='pending'").bind(reason, id).run();
      if (!rejected.meta.changes) return J({ error: "出库单已被其他操作处理" }, { status: 409 });
      await env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, "驳回出库单", `document:${id}`, JSON.stringify({ document_no: document.document_no, reason })).run();
      return J({ ok: true });
    }
    if (path.match(/^\/api\/(outbound|count|transfer)\/\d+\/approve$/) && request.method === "POST") {
      if (!can(user, ["admin", "manager"])) return forbidden();
      const [, , type, idText] = path.split("/");
      const id = Number(idText);
      const claimed = await env.DB.prepare("UPDATE stock_documents SET status='processing' WHERE id=? AND type=? AND status='pending'").bind(id, type).run();
      if (!claimed.meta.changes) return J({ error: "单据不存在、已处理或正在审核" }, { status: 409 });
      const document = await env.DB.prepare("SELECT * FROM stock_documents WHERE id=? AND type=? AND status='processing'").bind(id, type).first();
      const items = (await env.DB.prepare("SELECT * FROM stock_document_items WHERE document_id=?").bind(id).all()).results;
      if (!items.length) return bad("单据没有商品明细");
      const statements = [];
      if (type === "outbound" || type === "transfer") {
        for (const item of items) {
          const stock = await env.DB.prepare("SELECT quantity FROM inventory WHERE warehouse_id=? AND product_id=?").bind(document.warehouse_id, item.product_id).first();
          if (!stock || Number(stock.quantity) < Number(item.quantity)) return J({ error: type === "transfer" ? "来源仓库存不足" : "库存不足，无法审核" }, { status: 409 });
        }
        for (const item of items) {
          statements.push(env.DB.prepare("UPDATE inventory SET quantity=quantity-?,updated_at=CURRENT_TIMESTAMP WHERE warehouse_id=? AND product_id=? AND quantity>=?").bind(item.quantity, document.warehouse_id, item.product_id, item.quantity));
          statements.push(env.DB.prepare("INSERT INTO stock_movements(product_id,warehouse_id,document_id,movement_type,quantity,operator_name) VALUES(?,?,?,'outbound',?,?)").bind(item.product_id, document.warehouse_id, id, -item.quantity, document.operator_name));
          if (type === "transfer") {
            statements.push(env.DB.prepare("INSERT INTO inventory(warehouse_id,product_id,quantity,locked_quantity) VALUES(?,?,?,0) ON CONFLICT(warehouse_id,product_id) DO UPDATE SET quantity=quantity+excluded.quantity,updated_at=CURRENT_TIMESTAMP").bind(document.target_warehouse_id, item.product_id, item.quantity));
            statements.push(env.DB.prepare("INSERT INTO stock_movements(product_id,warehouse_id,document_id,movement_type,quantity,operator_name) VALUES(?,?,?,'transfer_in',?,?)").bind(item.product_id, document.target_warehouse_id, id, item.quantity, document.operator_name));
          }
        }
      } else {
        for (const item of items) {
          const before = await env.DB.prepare("SELECT quantity FROM inventory WHERE warehouse_id=? AND product_id=?").bind(document.warehouse_id, item.product_id).first();
          const delta = Number(item.actual_quantity) - Number(before?.quantity || 0);
          statements.push(env.DB.prepare("INSERT INTO inventory(warehouse_id,product_id,quantity,locked_quantity) VALUES(?,?,?,0) ON CONFLICT(warehouse_id,product_id) DO UPDATE SET quantity=excluded.quantity,updated_at=CURRENT_TIMESTAMP").bind(document.warehouse_id, item.product_id, item.actual_quantity));
          if (delta !== 0) statements.push(env.DB.prepare("INSERT INTO stock_movements(product_id,warehouse_id,document_id,movement_type,quantity,operator_name) VALUES(?,?,?,'count_adjustment',?,?)").bind(item.product_id, document.warehouse_id, id, delta, document.operator_name));
        }
      }
      statements.push(env.DB.prepare("UPDATE stock_documents SET status='approved' WHERE id=? AND status='processing'").bind(id));
      statements.push(env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, `审核${type === "outbound" ? "出库" : type === "count" ? "盘点" : "调拨"}单`, `document:${id}`, JSON.stringify({ document_no: document.document_no })));
      try { await env.DB.batch(statements); } catch (error) { await env.DB.prepare("UPDATE stock_documents SET status='pending' WHERE id=? AND status='processing'").bind(id).run(); throw error; }
      return J({ ok: true });
    }

    if (path.match(/^\/api\/documents\/\d+$/) && request.method === "DELETE") {
      if (!can(user, ["admin"])) return forbidden();
      const id = Number(path.split("/")[3]);
      const document = await env.DB.prepare("SELECT id,document_no,status FROM stock_documents WHERE id=?").bind(id).first();
      if (!document) return J({ error: "单据不存在" }, { status: 404 });
      if (!["pending", "rejected"].includes(document.status)) return J({ error: "已审核单据不可删除，必须保留库存流水" }, { status: 409 });
      const deleted = await env.DB.prepare("UPDATE stock_documents SET status='deleted' WHERE id=? AND status IN ('pending','rejected')").bind(id).run();
      if (!deleted.meta.changes) return J({ error: "单据已被审核或处理，不能删除" }, { status: 409 });
      await env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, "管理员删除单据", `document:${id}`, JSON.stringify({ document_no: document.document_no, previous_status: document.status })).run();
      return J({ ok: true });
    }
    if (path.match(/^\/api\/products\/\d+$/) && request.method === "DELETE") {
      if (!can(user, ["admin"])) return forbidden();
      const id = Number(path.split("/")[3]);
      const product = await env.DB.prepare("SELECT id,sku,status FROM products WHERE id=?").bind(id).first();
      if (!product) return J({ error: "商品不存在" }, { status: 404 });
      const used = await env.DB.prepare("SELECT 1 FROM stock_movements WHERE product_id=? UNION ALL SELECT 1 FROM stock_document_items WHERE product_id=? UNION ALL SELECT 1 FROM inventory WHERE product_id=? LIMIT 1").bind(id, id, id).first();
      if (used) {
        await env.DB.batch([
          env.DB.prepare("UPDATE products SET status='disabled' WHERE id=?").bind(id),
          env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, "停用历史商品", `product:${id}`, JSON.stringify({ sku: product.sku }))
        ]);
        return J({ ok: true, mode: "disabled" });
      }
      await env.DB.batch([
        env.DB.prepare("DELETE FROM products WHERE id=?").bind(id),
        env.DB.prepare("INSERT INTO audit_logs(user_id,action,resource,detail) VALUES(?,?,?,?)").bind(user.id, "管理员删除商品", `product:${id}`, JSON.stringify({ sku: product.sku }))
      ]);
      return J({ ok: true, mode: "deleted" });
    }
    if (path === "/api/reconciliation" && request.method === "GET") {
      if (!can(user, ["admin", "manager"])) return forbidden();
      const rows = await env.DB.prepare("SELECT i.warehouse_id,i.product_id,w.name warehouse,p.sku,p.name product,i.quantity inventory_quantity,COALESCE(i.opening_quantity,0)+COALESCE(SUM(m.quantity),0) ledger_quantity,(i.quantity-(COALESCE(i.opening_quantity,0)+COALESCE(SUM(m.quantity),0))) difference FROM inventory i JOIN warehouses w ON w.id=i.warehouse_id JOIN products p ON p.id=i.product_id LEFT JOIN stock_movements m ON m.warehouse_id=i.warehouse_id AND m.product_id=i.product_id JOIN stock_documents md ON md.id=m.document_id AND md.status='approved' GROUP BY i.warehouse_id,i.product_id HAVING ABS(difference)>0.0001 ORDER BY ABS(difference) DESC").all();
      return J({ rows: rows.results, ok: rows.results.length === 0 });
    }
    if (path === "/api/movements" && request.method === "GET") return J({ movements: (await env.DB.prepare("SELECT m.*,p.sku,p.name product,w.name warehouse FROM stock_movements m JOIN products p ON p.id=m.product_id JOIN warehouses w ON w.id=m.warehouse_id ORDER BY m.id DESC LIMIT 100").all()).results });
    if (path === "/api/reports/movements" && request.method === "GET") {
      const month = new URL(request.url).searchParams.get("month") || new Date().toISOString().slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(month)) return bad("月份格式必须为 YYYY-MM");
      const [year, monthNumber] = month.split("-").map(Number);
      if (monthNumber < 1 || monthNumber > 12) return bad("月份格式不正确");
      const start = `${month}-01`;
      const endDate = new Date(Date.UTC(year, monthNumber, 1));
      const end = endDate.toISOString().slice(0, 10);
      const result = await env.DB.prepare("SELECT m.id,m.created_at,m.movement_type,m.quantity,m.document_id,m.operator_name,p.sku,p.name product,w.name warehouse,d.document_no FROM stock_movements m JOIN products p ON p.id=m.product_id JOIN warehouses w ON w.id=m.warehouse_id LEFT JOIN stock_documents d ON d.id=m.document_id WHERE d.status='approved' AND m.created_at>=? AND m.created_at<? ORDER BY m.created_at DESC,m.id DESC").bind(start, end).all();
      const rows = result.results;
      const summary = rows.reduce((acc, row) => {
        const quantity = Number(row.quantity || 0);
        if (row.movement_type === "inbound" || row.movement_type === "transfer_in") acc.inboundQuantity += Math.abs(quantity);
        else if (row.movement_type === "outbound") acc.outboundQuantity += Math.abs(quantity);
        else acc.adjustmentQuantity += quantity;
        acc.netQuantity += quantity;
        acc.documents.add(row.document_id);
        return acc;
      }, { inboundQuantity: 0, outboundQuantity: 0, adjustmentQuantity: 0, netQuantity: 0, documents: new Set() });
      return J({ month, rows, summary: { ...summary, documents: summary.documents.size } });
    }
    if (path === "/api/warehouses" && request.method === "GET") return J({ warehouses: (await env.DB.prepare("SELECT id,name FROM warehouses ORDER BY id").all()).results });
    if (path.match(/^\/api\/warehouses\/\d+$/) && request.method === "PATCH") {
      if (!can(user, ["admin"])) return forbidden();
      const id = Number(path.split("/")[3]);
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || "").trim();
      if (!name) return bad("仓库名称不能为空");
      await env.DB.prepare("UPDATE warehouses SET name=? WHERE id=?").bind(name, id).run();
      await audit(env, user, "修改仓库名称", `warehouse:${id}`, { name });
      return J({ ok: true });
    }
    if (path === "/api/locations" && request.method === "GET") return J({ locations: (await env.DB.prepare("SELECT l.*,w.name warehouse FROM warehouse_locations l JOIN warehouses w ON w.id=l.warehouse_id ORDER BY w.id,l.id").all()).results });
    if (path === "/api/locations" && request.method === "POST") {
      if (!can(user, ["admin", "manager"])) return forbidden();
      const body = await request.json().catch(() => ({}));
      if (!(await warehouseExists(env, body.warehouse_id)) || !body.code) return bad("仓库和库位编码为必填项");
      try {
        const result = await env.DB.prepare("INSERT INTO warehouse_locations(warehouse_id,code,name,capacity,status) VALUES(?,?,?,?,?)").bind(body.warehouse_id, body.code, body.name || null, Math.max(0, Number(body.capacity || 0)), body.status === "disabled" ? "disabled" : "active").run();
        await audit(env, user, "新增库位", `location:${result.meta.last_row_id}`, { code: body.code });
        return J({ id: result.meta.last_row_id });
      } catch {
        return J({ error: "该仓库的库位编码已存在" }, { status: 409 });
      }
    }
    if (path === "/api/audit" && request.method === "GET") {
      if (!can(user, ["admin", "manager"])) return forbidden();
      return J({ logs: (await env.DB.prepare("SELECT a.*,u.name user_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 100").all()).results });
    }
    return null;
  } catch (error) {
    return J({ error: "服务器处理失败，请稍后重试" }, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) {
      const response = await api(request, env, path);
      if (response) return response;
    }
    return env.ASSETS.fetch(request);
  },
};
