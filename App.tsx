import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent } from "react";
import "./index.css";

type IconProps = { size?: number };
const localIcon = (symbol: string): ComponentType<IconProps> => ({ size = 18 }) => <span className="local-icon" style={{ fontSize: size * 0.72 }} aria-hidden="true">{symbol}</span>;
const ArrowDownToLine = localIcon("↓");
const ArrowLeftRight = localIcon("↔");
const ArrowUpFromLine = localIcon("↑");
const Bell = localIcon("•");
const Boxes = localIcon("▦");
const BarChart = localIcon("▥");
const ClipboardCheck = localIcon("✓");
const FileText = localIcon("▤");
const LayoutDashboard = localIcon("▥");
const Menu = localIcon("☰");
const PackageSearch = localIcon("⌕");
const Search = localIcon("⌕");
const Settings = localIcon("⚙");
const ShieldCheck = localIcon("◇");
const SlidersHorizontal = localIcon("≡");
const Users = localIcon("♙");
const Warehouse = localIcon("⌂");

type View = "dashboard" | "reports" | "inventory" | "products" | "inbound" | "outbound" | "transfer" | "count" | "audit" | "settings" | "users";

const navGroups = [
  { label: "运营总览", items: [{ id: "dashboard", label: "工作台", icon: LayoutDashboard }, { id: "reports", label: "报表统计", icon: BarChart }] },
  {
    label: "仓储作业",
    items: [
      { id: "inventory", label: "库存总览", icon: Boxes },
      { id: "products", label: "商品资料", icon: PackageSearch },
      { id: "inbound", label: "入库管理", icon: ArrowDownToLine },
      { id: "outbound", label: "出库管理", icon: ArrowUpFromLine },
      { id: "transfer", label: "库存调拨", icon: ArrowLeftRight },
      { id: "count", label: "库存盘点", icon: ClipboardCheck },
      { id: "audit", label: "库存流水", icon: FileText },
    ],
  },
  {
    label: "系统管理",
    items: [
      { id: "settings", label: "仓库与权限", icon: ShieldCheck },
      { id: "users", label: "用户与角色", icon: Users },
    ],
  },
] as const;

function StatCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Boxes size={19} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function BarcodeInput({ products, onSelect, onMessage }: { products: any[]; onSelect: (id: string) => void; onMessage: (message: string) => void }) {
  const [code, setCode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const streamElement = useRef<MediaStream | null>(null);
  const resolve = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const product = products.find((item) => String(item.sku).toLowerCase() === value.toLowerCase() || String(item.barcode || "").toLowerCase() === value.toLowerCase());
    if (!product) { onMessage(`未找到条码/SKU：${value}`); return; }
    onSelect(String(product.id)); setCode(""); onMessage(`已识别：${product.sku} · ${product.name}`);
  };
  useEffect(() => {
    if (!cameraOpen) return;
    let stopped = false;
    const start = async () => {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector || !navigator.mediaDevices?.getUserMedia) { onMessage("当前浏览器不支持摄像头扫码，请使用扫码枪或手动输入"); setCameraOpen(false); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        streamElement.current = stream;
        if (videoElement.current) { videoElement.current.srcObject = stream; await videoElement.current.play(); }
        const detector = new Detector();
        const loop = async () => {
          if (stopped || !videoElement.current) return;
          const codes = await detector.detect(videoElement.current).catch(() => []);
          if (codes[0]?.rawValue) { resolve(codes[0].rawValue); setCameraOpen(false); return; }
          requestAnimationFrame(loop);
        };
        loop();
      } catch { onMessage("无法打开摄像头，请检查浏览器权限"); setCameraOpen(false); }
    };
    start();
    return () => { stopped = true; streamElement.current?.getTracks().forEach((track) => track.stop()); streamElement.current = null; };
  }, [cameraOpen, products]);
  return <div className="scan-tools"><div className="scan-input"><span>⌕</span><input value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); resolve(code); } }} placeholder="扫码枪输入条码 / SKU" aria-label="扫码枪输入条码或 SKU" /><button type="button" onClick={() => resolve(code)}>识别</button></div><button type="button" className="filter-btn camera-btn" onClick={() => setCameraOpen(true)}>手机扫码</button>{cameraOpen && <div className="camera-popover"><video ref={(node) => { videoElement.current = node; }} muted playsInline /><button type="button" className="danger-btn" onClick={() => setCameraOpen(false)}>关闭摄像头</button></div>}</div>;
}

function DataModule({ view, user }: { view: View; user: { id?: number; name: string; role: string } }) {
  const [rows, setRows] = useState<any[]>([]); const [message, setMessage] = useState("");
  const [form, setForm] = useState({ sku: "", name: "", category: "", unit: "件", barcode: "", min_stock: "0" });
  const [inbound, setInbound] = useState({ warehouse_id: "1", product_id: "", quantity: "1", operator_name: "", remark: "" });
  const [productOptions, setProductOptions] = useState<any[]>([]); const [warehouses, setWarehouses] = useState<any[]>([]);
  const [employee, setEmployee] = useState({ name: "", email: "", password: "", role: "operator" });
  const load = async () => { const endpoint = view === "users" ? "/api/users" : view === "products" ? "/api/products" : "/api/inbound"; const response = await fetch(endpoint); const data = await response.json(); if (!response.ok) throw new Error(data.error || "加载失败"); setRows(data.users || data.products || data.documents || []); };
  useEffect(() => { load().catch((error) => setMessage(error.message)); fetch("/api/products").then((r) => r.json()).then((d) => setProductOptions(d.products || [])).catch(() => {}); fetch("/api/warehouses").then((r) => r.json()).then((d) => setWarehouses(d.warehouses || [])).catch(() => {}); }, [view]);
  const isAdmin = user.role === "admin";
  const addProduct = async (event: FormEvent) => { event.preventDefault(); const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, min_stock: Number(form.min_stock) }) }); const data = await response.json(); setMessage(response.ok ? "商品已创建" : data.error); if (response.ok) { setForm({ sku: "", name: "", category: "", unit: "件", barcode: "", min_stock: "0" }); load(); } };
  const addEmployee = async (event: FormEvent) => { event.preventDefault(); const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(employee) }); const data = await response.json(); setMessage(response.ok ? "员工账号已创建" : data.error || "创建失败"); if (response.ok) { setEmployee({ name: "", email: "", password: "", role: "operator" }); load(); } };
  const changeRole = async (id: number, role: string) => { const response = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }); setMessage(response.ok ? "角色已更新" : "更新失败"); load(); };
  const deleteProduct = async (id: number, sku: string) => { if (!window.confirm(`确定删除/停用商品 ${sku} 吗？有历史流水的商品会被停用，不会破坏账目。`)) return; const response = await fetch(`/api/products/${id}`, { method: "DELETE" }); const data = await response.json(); setMessage(response.ok ? (data.mode === "disabled" ? "商品已有历史流水，已改为停用" : "商品已删除") : data.error || "删除失败"); if (response.ok) load(); };
  const deleteDocument = async (id: number) => { if (!window.confirm("确定删除这张未审核单据吗？删除后不会影响库存，但会保留管理员审计记录。")) return; const response = await fetch(`/api/documents/${id}`, { method: "DELETE" }); const data = await response.json(); setMessage(response.ok ? "单据已删除" : data.error || "删除失败"); if (response.ok) load(); };
  const approve = async (id: number) => { const response = await fetch(`/api/inbound/${id}/approve`, { method: "POST" }); const data = await response.json(); setMessage(response.ok ? "入库单已审核，库存已增加" : data.error || "审核失败"); load(); };
  const createInbound = async (event: FormEvent) => { event.preventDefault(); const response = await fetch("/api/inbound", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ warehouse_id: Number(inbound.warehouse_id), operator_name: inbound.operator_name, items: [{ product_id: Number(inbound.product_id), quantity: Number(inbound.quantity) }], remark: inbound.remark }) }); const data = await response.json(); setMessage(response.ok ? `入库单 ${data.document_no} 已提交，等待审核` : data.error || "提交失败"); if (response.ok) { setInbound({ ...inbound, quantity: "1", operator_name: "", remark: "" }); load(); } };
  if (view === "products") return <><div className="page-heading"><div><p className="eyebrow">MASTER DATA</p><h1>商品资料</h1><p>维护 SKU、条码、分类、单位和安全库存。</p></div></div>{user.role === "admin" || user.role === "manager" ? <form className="inline-form panel" onSubmit={addProduct}><input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /><input placeholder="商品名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><input placeholder="条码（可选）" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /><input placeholder="分类" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /><input placeholder="安全库存" type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /><button className="primary-btn">新增商品</button></form> : null}<div className="panel table-panel"><table><thead><tr><th>SKU / 条码</th><th>商品名称</th><th>分类</th><th>单位</th><th>安全库存</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.sku}</strong><span className="table-sub">{row.barcode || "无条码"}</span></td><td>{row.name}</td><td>{row.category}</td><td>{row.unit}</td><td>{row.min_stock}</td><td><span className={`badge ${row.status === "active" ? "success" : "warning"}`}>{row.status === "active" ? "启用" : "停用"}</span></td><td>{isAdmin ? <button className="text-btn danger-text" onClick={() => deleteProduct(row.id, row.sku)}>删除/停用</button> : "—"}</td></tr>)}</tbody></table></div>{message && <div className="toast-msg">{message}</div>}</>;
  if (view === "users") return <><div className="page-heading"><div><p className="eyebrow">ACCESS CONTROL</p><h1>员工账号</h1><p>仅管理员可以创建账号；员工不能自行注册。</p></div></div>{!isAdmin ? <div className="permission-note">当前账号没有管理员权限，请联系管理员创建员工账号。</div> : <><form className="inline-form panel" onSubmit={addEmployee}><input placeholder="员工姓名" value={employee.name} onChange={(e) => setEmployee({ ...employee, name: e.target.value })} required /><input type="email" placeholder="工作邮箱" value={employee.email} onChange={(e) => setEmployee({ ...employee, email: e.target.value })} required /><input type="password" minLength={8} placeholder="初始密码（至少 8 位）" value={employee.password} onChange={(e) => setEmployee({ ...employee, password: e.target.value })} required /><select value={employee.role} onChange={(e) => setEmployee({ ...employee, role: e.target.value })}><option value="operator">操作员</option><option value="manager">仓库主管</option><option value="viewer">查看人员</option><option value="admin">管理员</option></select><button className="primary-btn">创建员工账号</button></form><div className="panel table-panel"><table><thead><tr><th>成员</th><th>邮箱</th><th>角色</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.email}</td><td><select value={row.role} onChange={(e) => changeRole(row.id, e.target.value)}><option value="admin">管理员</option><option value="manager">仓库主管</option><option value="operator">操作员</option><option value="viewer">查看人员</option></select></td><td><span className={`badge ${row.status === "active" ? "success" : "warning"}`}>{row.status === "active" ? "正常" : "停用"}</span></td><td><button className="text-btn" onClick={() => fetch(`/api/users/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: row.status === "active" ? "disabled" : "active" }) }).then(load)}>{row.status === "active" ? "停用" : "启用"}</button></td></tr>)}</tbody></table></div></>}{message && <div className="toast-msg">{message}</div>}</>;
  return <><div className="page-heading"><div><p className="eyebrow">INBOUND OPERATIONS</p><h1>入库管理</h1><p>扫码或选择商品，填写现场操作人后提交入库单。</p></div></div><form className="inline-form panel" onSubmit={createInbound}><select value={inbound.warehouse_id} onChange={(e) => setInbound({ ...inbound, warehouse_id: e.target.value })}>{warehouses.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select><BarcodeInput products={productOptions} onSelect={(id) => setInbound({ ...inbound, product_id: id })} onMessage={setMessage} /><select value={inbound.product_id} onChange={(e) => setInbound({ ...inbound, product_id: e.target.value })} required><option value="">选择商品</option>{productOptions.map((product) => <option value={product.id} key={product.id}>{product.sku} · {product.name}</option>)}</select><input placeholder="现场操作人姓名（不能是当前登录人）" value={inbound.operator_name} onChange={(e) => setInbound({ ...inbound, operator_name: e.target.value })} required /><input type="number" min="1" placeholder="数量" value={inbound.quantity} onChange={(e) => setInbound({ ...inbound, quantity: e.target.value })} required /><input placeholder="备注" value={inbound.remark} onChange={(e) => setInbound({ ...inbound, remark: e.target.value })} /><button className="primary-btn">提交入库单</button></form><div className="panel table-panel"><table><thead><tr><th>单号</th><th>仓库</th><th>现场操作人</th><th>提交账号</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.document_no}</strong></td><td>{row.warehouse}</td><td>{row.handler || "—"}</td><td>{row.operator || "—"}</td><td><span className={`badge ${row.status === "approved" ? "success" : "warning"}`}>{row.status === "pending" ? "待审核" : row.status === "approved" ? "已审核" : row.status}</span></td><td>{row.created_at}</td><td>{row.status === "pending" && (user.role === "admin" || user.role === "manager") ? <span className="action-group"><button className="text-btn" onClick={() => approve(row.id)}>审核入库</button>{isAdmin && <button className="text-btn danger-text" onClick={() => deleteDocument(row.id)}>删除</button>}</span> : isAdmin && row.status === "rejected" ? <button className="text-btn danger-text" onClick={() => deleteDocument(row.id)}>删除</button> : "—"}</td></tr>)}</tbody></table></div>{message && <div className="toast-msg">{message}</div>}</>;
}

function ReportModule() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState({ inboundQuantity: 0, outboundQuantity: 0, adjustmentQuantity: 0, netQuantity: 0, documents: 0 });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async (targetMonth = month) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/movements?month=${encodeURIComponent(targetMonth)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "报表加载失败");
      setRows(data.rows || []);
      setSummary(data.summary || { inboundQuantity: 0, outboundQuantity: 0, adjustmentQuantity: 0, netQuantity: 0, documents: 0 });
      setMessage("");
    } catch (error: any) { setMessage(error.message || "报表加载失败"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const movementLabel = (type: string) => type === "inbound" ? "采购入库" : type === "outbound" ? "出库" : type === "transfer_in" ? "调拨入库" : "盘点调整";
  const trend = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const dayCount = new Date(year, monthNumber, 0).getDate();
    const data = Array.from({ length: dayCount }, (_, index) => ({ day: index + 1, inbound: 0, outbound: 0 }));
    rows.forEach((row) => {
      const day = Number(String(row.created_at || "").slice(8, 10));
      if (!data[day - 1]) return;
      const quantity = Math.abs(Number(row.quantity || 0));
      if (row.movement_type === "inbound" || row.movement_type === "transfer_in") data[day - 1].inbound += quantity;
      if (row.movement_type === "outbound") data[day - 1].outbound += quantity;
    });
    return data;
  }, [rows, month]);
  const trendMax = Math.max(1, ...trend.flatMap((item) => [item.inbound, item.outbound]));
  const trendPoints = (key: "inbound" | "outbound") => trend.map((item, index) => `${(index / Math.max(1, trend.length - 1)) * 100},${96 - (item[key] / trendMax) * 84}`).join(" ");
  const exportCsv = () => {
    const header = ["时间", "流水类型", "单据号", "SKU", "商品名称", "仓库", "数量", "操作人"];
    const body = rows.map((row) => [row.created_at, movementLabel(row.movement_type), row.document_no || "", row.sku, row.product, row.warehouse, row.quantity, row.operator_name || ""]);
    const csv = "\uFEFF" + [header, ...body].map((line) => line.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `仓库出入库流水-${month}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <><div className="page-heading"><div><p className="eyebrow">REPORTS & ANALYTICS</p><h1>报表统计</h1><p>按月查看出入库流水、库存调整和单据数量。</p></div></div><form className="inline-form panel" onSubmit={(event) => { event.preventDefault(); load(); }}><label>统计月份<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label><button className="primary-btn" disabled={loading}>{loading ? "加载中…" : "查询报表"}</button><button type="button" className="filter-btn" onClick={exportCsv} disabled={!rows.length}>导出 CSV</button></form><div className="stats-grid"><StatCard label="入库数量" value={summary.inboundQuantity.toLocaleString()} note="采购入库 + 调拨入库" tone="blue" /><StatCard label="出库数量" value={summary.outboundQuantity.toLocaleString()} note="已审核出库流水" tone="violet" /><StatCard label="盘点调整" value={summary.adjustmentQuantity.toLocaleString()} note="盘盈为正，盘亏为负" tone="orange" /><StatCard label="关联单据" value={summary.documents.toLocaleString()} note="本月发生业务的单据" tone="red" /></div><div className="panel report-chart-panel"><div className="panel-heading"><div><h2>每日出入库趋势</h2><p>按所选月份展示已审核流水，盘点调整不计入趋势线</p></div><div className="report-legend"><span><i className="report-dot inbound-dot" />入库</span><span><i className="report-dot outbound-dot" />出库</span></div></div><div className="trend-chart"><div className="trend-y"><span>{trendMax}</span><span>{Math.round(trendMax / 2)}</span><span>0</span></div><div className="trend-main"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="每日出入库趋势图"><line x1="0" y1="96" x2="100" y2="96" /><line x1="0" y1="54" x2="100" y2="54" /><line x1="0" y1="12" x2="100" y2="12" /><polyline className="trend-line inbound-line" points={trendPoints("inbound")} /><polyline className="trend-line outbound-line" points={trendPoints("outbound")} /></svg><div className="trend-x"><span>1日</span><span>{Math.ceil(trend.length / 2)}日</span><span>{trend.length}日</span></div></div></div></div><div className="panel table-panel"><div className="panel-heading"><div><h2>{month} 出入库流水</h2><p>{rows.length ? `共 ${rows.length} 条流水` : "当前月份暂无流水"}</p></div>{rows.length > 0 && <button className="text-btn" onClick={exportCsv}>下载当前筛选</button>}</div><table><thead><tr><th>时间</th><th>类型</th><th>单据号</th><th>商品</th><th>仓库</th><th>数量</th><th>操作人</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.created_at}</td><td><span className={`badge ${row.movement_type === "outbound" ? "warning" : "success"}`}>{movementLabel(row.movement_type)}</span></td><td>{row.document_no || "—"}</td><td><strong>{row.product}</strong><span className="table-sub">{row.sku}</span></td><td>{row.warehouse}</td><td className={Number(row.quantity) < 0 ? "danger-text" : "success-text"}>{Number(row.quantity) > 0 ? "+" : ""}{row.quantity}</td><td>{row.operator_name || "—"}</td></tr>)}</tbody></table></div>{message && <div className="toast-msg">{message}</div>}</>;
}

function OperationsModule({ view, user }: { view: View; user: { name: string; role: string } }) {
  const [rows, setRows] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [bookQuantity, setBookQuantity] = useState(0);
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingBusy, setRejectingBusy] = useState(false);
  const [form, setForm] = useState({ warehouse_id: "1", target_warehouse_id: "2", product_id: "", quantity: "1", actual_quantity: "0", operator_name: "", remark: "" });
  const endpoint = view === "outbound" ? "/api/outbound" : view === "count" ? "/api/count" : view === "audit" ? "/api/audit" : view === "settings" ? "/api/locations" : "/api/transfer";
  const load = async () => {
    const response = await fetch(endpoint);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "加载失败");
    setRows(data.documents || data.logs || data.locations || []);
  };
  useEffect(() => {
    load().catch((error) => setMessage(error.message));
    fetch("/api/products").then((r) => r.json()).then((data) => setProducts(data.products || [])).catch(() => {});
    fetch("/api/warehouses").then((r) => r.json()).then((data) => setWarehouses(data.warehouses || [])).catch(() => {});
  }, [view]);
  useEffect(() => {
    if (view !== "count" || !form.product_id) return;
    fetch("/api/inventory").then((r) => r.json()).then((data) => {
      const row = (data.rows || []).find((item: any) => Number(item.product_id) === Number(form.product_id) && Number(item.warehouse_id) === Number(form.warehouse_id));
      setBookQuantity(Number(row?.quantity || 0));
      setForm((current) => ({ ...current, actual_quantity: String(row?.quantity || 0) }));
    }).catch(() => setBookQuantity(0));
  }, [view, form.product_id, form.warehouse_id]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const item = view === "count"
      ? { product_id: Number(form.product_id), book_quantity: bookQuantity, actual_quantity: Number(form.actual_quantity) }
      : { product_id: Number(form.product_id), quantity: Number(form.quantity) };
    const body = view === "transfer"
      ? { warehouse_id: Number(form.warehouse_id), target_warehouse_id: Number(form.target_warehouse_id), operator_name: form.operator_name, items: [item], remark: form.remark }
      : { warehouse_id: Number(form.warehouse_id), operator_name: form.operator_name, items: [item], remark: form.remark };
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    setMessage(response.ok ? `单据 ${data.document_no} 已提交，等待审核` : data.error || "操作失败");
    if (response.ok) { setForm({ ...form, quantity: "1", actual_quantity: String(bookQuantity), remark: "" }); load(); }
  };
  const approve = async (id: number) => {
    if (!window.confirm("审核后会立即更新库存并写入流水，确定继续吗？")) return;
    setApproving(id);
    try {
      const response = await fetch(`/api/${view}/${id}/approve`, { method: "POST" });
      const data = await response.json();
      setMessage(response.ok ? "审核完成，库存和流水已同步" : data.error || "审核失败");
      load();
    } finally { setApproving(null); }
  };
  const rejectOutbound = async () => {
    if (rejecting === null || rejectReason.trim().length < 2) return;
    setRejectingBusy(true);
    try {
      const response = await fetch(`/api/outbound/${rejecting}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: rejectReason.trim() }) });
      const data = await response.json();
      setMessage(response.ok ? "出库单已驳回，原因已记录" : data.error || "驳回失败");
      if (response.ok) { setRejecting(null); setRejectReason(""); load(); }
    } finally { setRejectingBusy(false); }
  };
  const deleteDocument = async (id: number) => { if (!window.confirm("确定删除这张未审核单据吗？已审核单据不可删除。")) return; const response = await fetch(`/api/documents/${id}`, { method: "DELETE" }); const data = await response.json(); setMessage(response.ok ? "单据已删除" : data.error || "删除失败"); if (response.ok) load(); };
  if (view === "audit") return <><div className="page-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h1>操作审计日志</h1><p>记录提交、审核、库存调整和权限变更。</p></div></div><div className="panel table-panel"><table><thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>资源</th><th>详情</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.created_at}</td><td>{row.user_name || "系统"}</td><td>{row.action}</td><td>{row.resource}</td><td>{row.detail || "—"}</td></tr>)}</tbody></table></div>{message && <div className="toast-msg">{message}</div>}</>;
  const renameWarehouse = async (id: number, name: string) => {
    const response = await fetch(`/api/warehouses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await response.json();
    setMessage(response.ok ? "仓库名称已更新" : data.error || "更新失败");
    if (response.ok) fetch("/api/warehouses").then((r) => r.json()).then((d) => setWarehouses(d.warehouses || []));
  };
  if (view === "settings") return <><div className="page-heading"><div><p className="eyebrow">WAREHOUSE SETTINGS</p><h1>仓库与库位</h1><p>管理员可维护东区、南区等内部仓库名称；仓库主管可维护库位。</p></div></div>{user.role === "admin" && <div className="panel warehouse-name-list"><div className="panel-heading"><div><h2>内部仓库菜单</h2><p>修改后会同步到入库、出库、调拨和库存筛选菜单。</p></div></div>{warehouses.map((warehouse) => <form className="warehouse-name-row" key={warehouse.id} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); renameWarehouse(warehouse.id, String(data.get("name") || "")); }}><span>{warehouse.code || `仓库 ${warehouse.id}`}</span><input name="name" defaultValue={warehouse.name} required /><button className="text-btn">保存名称</button></form>)}</div>}{user.role === "admin" || user.role === "manager" ? <form className="inline-form panel" onSubmit={async (event) => { event.preventDefault(); const target = event.currentTarget as HTMLFormElement; const data = new FormData(target); const response = await fetch("/api/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ warehouse_id: Number(data.get("warehouse_id")), code: data.get("code"), name: data.get("name"), capacity: Number(data.get("capacity") || 0) }) }); const result = await response.json(); setMessage(response.ok ? "库位已创建" : result.error || "创建失败"); if (response.ok) { target.reset(); load(); } }}><select name="warehouse_id">{warehouses.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select><input name="code" placeholder="库位编码，如 A-01-04" required /><input name="name" placeholder="库位名称" /><input name="capacity" type="number" min="0" placeholder="容量" /><button className="primary-btn">新增库位</button></form> : null}<div className="panel table-panel"><table><thead><tr><th>仓库</th><th>库位编码</th><th>库位名称</th><th>容量</th><th>状态</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.warehouse}</td><td><strong>{row.code}</strong></td><td>{row.name || "—"}</td><td>{row.capacity}</td><td><span className={`badge ${row.status === "active" ? "success" : "warning"}`}>{row.status === "active" ? "启用" : "停用"}</span></td></tr>)}</tbody></table></div>{message && <div className="toast-msg">{message}</div>}</>;
  const title = view === "outbound" ? "出库管理" : view === "count" ? "库存盘点" : "库存调拨";
  const canApprove = user.role === "admin" || user.role === "manager";
  return <><div className="page-heading"><div><p className="eyebrow">WAREHOUSE OPERATIONS</p><h1>{title}</h1><p>{view === "count" ? "扫码或选择商品，填写现场操作人后提交盘点单。" : "扫码枪、手机摄像头或手动选择商品，填写现场操作人后提交单据。"}</p></div></div><form className="inline-form panel" onSubmit={submit}><select value={form.warehouse_id} onChange={(event) => setForm({ ...form, warehouse_id: event.target.value })}>{warehouses.map((warehouse) => <option value={warehouse.id} key={warehouse.id}>{warehouse.name}</option>)}</select>{view === "transfer" && <select value={form.target_warehouse_id} onChange={(event) => setForm({ ...form, target_warehouse_id: event.target.value })}>{warehouses.filter((warehouse) => String(warehouse.id) !== form.warehouse_id).map((warehouse) => <option value={warehouse.id} key={warehouse.id}>调入 {warehouse.name}</option>)}</select>}<BarcodeInput products={products} onSelect={(id) => setForm({ ...form, product_id: id })} onMessage={setMessage} /><select value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })} required><option value="">选择商品</option>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}</select>{view === "count" ? <><input value={`账面库存 ${bookQuantity}`} readOnly /><input type="number" min="0" value={form.actual_quantity} onChange={(event) => setForm({ ...form, actual_quantity: event.target.value })} placeholder="实盘数量" required /><span className={Number(form.actual_quantity) - bookQuantity === 0 ? "success-text" : "danger-text"}>差异 {Number(form.actual_quantity) - bookQuantity > 0 ? "+" : ""}{Number(form.actual_quantity) - bookQuantity}</span></> : <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="数量" required />}<input value={form.operator_name} onChange={(event) => setForm({ ...form, operator_name: event.target.value })} placeholder="现场操作人姓名（不能是当前登录人）" required /><input value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} placeholder="备注" /><button className="primary-btn">提交单据</button></form><div className="panel table-panel"><table><thead><tr><th>单号</th><th>仓库</th><th>现场操作人</th><th>提交账号</th><th>状态</th><th>时间</th><th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.document_no}</strong></td><td>{row.warehouse}{row.target_warehouse ? ` → ${row.target_warehouse}` : ""}</td><td>{row.handler || "—"}{row.rejection_reason && <span className="table-sub rejection-note">驳回：{row.rejection_reason}</span>}</td><td>{row.operator || "—"}</td><td><span className={`badge ${row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}`}>{row.status === "pending" ? "待审核" : row.status === "approved" ? "已审核" : row.status === "rejected" ? "已驳回" : row.status}</span></td><td>{row.created_at}</td><td>{row.status === "pending" && canApprove ? <span className="action-group"><button className="text-btn" disabled={approving === row.id || rejectingBusy} onClick={() => approve(row.id)}>{approving === row.id ? "审核中…" : "审核"}</button>{view === "outbound" && <button className="text-btn reject-btn" disabled={approving === row.id || rejectingBusy} onClick={() => { setRejecting(row.id); setRejectReason(""); }}>驳回</button>}</span> : row.status === "rejected" ? <span className="action-group"><span className="rejection-note">已驳回</span>{user.role === "admin" && <button className="text-btn danger-text" onClick={() => deleteDocument(row.id)}>删除</button>}</span> : user.role === "admin" && row.status === "pending" ? <button className="text-btn danger-text" onClick={() => deleteDocument(row.id)}>删除</button> : "—"}</td></tr>)}</tbody></table></div>{view === "outbound" && rejecting !== null && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reject-title"><div className="modal-heading"><div><p className="eyebrow">REJECTION NOTE</p><h2 id="reject-title">驳回出库单</h2></div><button className="icon-btn" onClick={() => setRejecting(null)} aria-label="关闭">×</button></div><p className="modal-help">请填写驳回原因，提交后单据状态会变为“已驳回”，库存不会发生变化。</p><textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="例如：领料数量与生产计划不一致" maxLength={500} autoFocus /><div className="modal-footer"><span>{rejectReason.length}/500</span><div><button className="filter-btn" onClick={() => setRejecting(null)}>取消</button><button className="danger-btn" disabled={rejectReason.trim().length < 2 || rejectingBusy} onClick={rejectOutbound}>{rejectingBusy ? "提交中…" : "确认驳回"}</button></div></div></div></div>}{message && <div className="toast-msg">{message}</div>}</>;
}
function DashboardApp({ user, onLogout }: { user: { name: string; role: string }; onLogout: () => void }) {
  const [view, setView] = useState<View>("dashboard");
  const [warehouse, setWarehouse] = useState("全部仓库");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  useEffect(() => { fetch("/api/dashboard").then(r => r.ok ? r.json() : null).then(setSummary).catch(() => {}); fetch("/api/inventory").then(r => r.ok ? r.json() : null).then(data => setInventory(data?.rows || [])).catch(() => {}); fetch("/api/warehouses").then(r => r.ok ? r.json() : null).then(data => setWarehouses(data?.warehouses || [])).catch(() => {}); }, []);
  const liveRows = inventory.map((row) => ({ sku: row.sku, name: row.name, category: row.category, warehouse: row.warehouse, location: row.location, qty: Number(row.quantity || 0), min: Number(row.min_stock || 0), status: row.stock_status, unit: row.unit || "件" }));
  const recentDocs = (summary?.recent || []).map((row: any) => ({ no: row.document_no, type: row.type === "inbound" ? "入库" : row.type === "outbound" ? "出库" : row.type === "transfer" ? "仓间调拨" : "库存盘点", partner: row.handler || row.operator || row.warehouse, count: "—", status: row.status === "pending" ? "待审核" : row.status === "approved" ? "已完成" : row.status === "rejected" ? "已驳回" : row.status, date: row.created_at }));
  const trend = summary?.trend || [];
  const trendMax = Math.max(1, ...trend.flatMap((row: any) => [Number(row.inbound || 0), Number(row.outbound || 0)]));
  const trendPoints = (key: "inbound" | "outbound") => trend.map((row: any, index: number) => `${trend.length <= 1 ? 50 : (index / (trend.length - 1)) * 100},${96 - (Number(row[key] || 0) / trendMax) * 84}`).join(" ");
  const inventorySummary = { categories: new Set(inventory.map((row) => row.category)).size, quantity: inventory.reduce((sum, row) => sum + Number(row.quantity || 0), 0), low: inventory.filter((row) => row.stock_status === "低库存").length };
  const activeLabel = navGroups.flatMap((group) => group.items).find((item) => item.id === view)?.label ?? "工作台";
  const filtered = useMemo(() => liveRows.filter((row) => `${row.sku}${row.name}${row.category}`.toLowerCase().includes(query.toLowerCase()) && (warehouse === "全部仓库" || row.warehouse === warehouse)), [query, warehouse, liveRows]);

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand"><img className="brand-logo" src="/sasaki-logo.png" alt="佐々木会社仓库管理系统" /></div>
      <div className="workspace"><span>当前工作区</span><strong>仓库运营中心</strong><button onClick={() => setWarehouse(warehouse === "全部仓库" ? (warehouses[0]?.name || "全部仓库") : "全部仓库")}>{warehouse}<SlidersHorizontal size={14} /></button></div>
      <nav>{navGroups.map((group) => <div className="nav-group" key={group.label}><label>{group.label}</label>{group.items.map((item) => { const Icon = item.icon; return <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => { setView(item.id as View); setMenuOpen(false); }}><Icon size={17} />{item.label}</button>; })}</div>)}</nav>
      <div className="sidebar-foot"><div className="status-dot" /><span>系统运行正常</span><span className="version">v0.1</span></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button><div className="crumb"><span>仓库控制台</span><b>/</b><strong>{activeLabel}</strong></div><div className="top-actions"><button className="icon-btn"><Bell size={18} /><i /></button><div className="user-chip"><div className="avatar">{user.name.slice(0, 1)}</div><div><strong>{user.name}</strong><span>{user.role === "admin" ? "系统管理员" : user.role === "manager" ? "仓库主管" : "仓库操作员"}</span></div></div><button className="icon-btn logout-btn" onClick={onLogout}>退出</button></div></header>
      <section className="content">
        {view === "reports" && <ReportModule />}
        {view === "dashboard" && <>
          <div className="page-heading"><div><p className="eyebrow">{new Date().toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" })}</p><h1>早上好，{user.name}</h1><p>这是今天的仓库运营概览。</p></div><button className="primary-btn" onClick={() => setView("inbound")}><ArrowDownToLine size={16} /> 新建入库单</button></div>
          <div className="stats-grid"><StatCard label="库存总量" value={summary ? Number(summary.stats.total).toLocaleString() : "—"} note="来自实时库存" tone="blue" /><StatCard label="库存货值" value="—" note="尚未配置成本字段" tone="violet" /><StatCard label="待处理单据" value={summary ? String(summary.stats.pending) : "—"} note="等待审核" tone="orange" /><StatCard label="库存预警" value={summary ? String(summary.stats.low) : "—"} note="低于安全库存" tone="red" /><StatCard label="账务核对" value={summary ? (Number(summary.stats.consistency || 0) === 0 ? "正常" : `${summary.stats.consistency} 项异常`) : "—"} note="库存与流水净额" tone={summary && Number(summary.stats.consistency || 0) ? "red" : "green"} /></div>
          <div className="dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h2>库存变动趋势</h2><p>近 30 天已审核出入库数量</p></div><span className="select-like">实时 D1 数据</span></div>{trend.length ? <div className="chart"><div className="y-labels"><span>{trendMax}</span><span>{Math.round(trendMax / 2)}</span><span>0</span></div><div className="chart-area"><div className="grid-lines" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="真实库存出入库趋势图"><polyline className="trend-line inbound-line" points={trendPoints("inbound")} /><polyline className="trend-line outbound-line" points={trendPoints("outbound")} /></svg><div className="x-labels"><span>{trend[0]?.day || "—"}</span><span>{trend[Math.floor(trend.length / 2)]?.day || "—"}</span><span>{trend[trend.length - 1]?.day || "—"}</span></div></div><div className="legend"><span><i className="in" />入库</span><span><i className="out" />出库</span><strong>统计范围：近 30 天</strong></div></div> : <p className="empty-state">近 30 天暂无已审核出入库流水</p>}</div>
            <div className="panel alert-panel"><div className="panel-heading"><div><h2>库存预警</h2><p>需要关注的真实库存项目</p></div><button className="text-btn" onClick={() => setView("inventory")}>查看全部 →</button></div><div className="alert-list">{(summary?.alerts || []).slice(0, 4).map((a: any) => <div className="alert-item" key={a.sku}><div className="alert-mark danger">!</div><div><strong>{a.name}</strong><span>{a.sku} · {a.warehouse}</span></div><b>{a.quantity} <small>/ 最低 {a.min_stock}</small></b></div>)}{summary && !summary.alerts?.length && <p className="empty-state">暂无库存预警</p>}{!summary && <p className="empty-state">正在读取云端库存…</p>}</div><button className="outline-btn" onClick={() => setView("inbound")}>创建补货入库单</button></div></div>
          <div className="bottom-grid"><div className="panel"><div className="panel-heading"><div><h2>最近单据</h2><p>最近的仓库业务记录</p></div><button className="text-btn">全部单据 →</button></div><div className="doc-list">{recentDocs.length ? recentDocs.map((doc) => <div className="doc-row" key={doc.no}><div className="doc-icon"><FileText size={16} /></div><div className="doc-main"><strong>{doc.no}</strong><span>{doc.type} · {doc.partner}</span></div><span className={`badge ${doc.status === "已完成" ? "success" : doc.status === "待审核" ? "warning" : "info"}`}>{doc.status}</span><time>{doc.date}</time></div>) : <p className="empty-state">暂无真实单据</p>}</div></div><div className="panel quick-panel"><div className="panel-heading"><div><h2>快捷操作</h2><p>常用仓储动作</p></div></div><div className="quick-actions"><button onClick={() => setView("inbound")}><ArrowDownToLine size={18} /><span>入库</span></button><button onClick={() => setView("outbound")}><ArrowUpFromLine size={18} /><span>出库</span></button><button onClick={() => setView("count")}><ClipboardCheck size={18} /><span>盘点</span></button><button onClick={() => setView("audit")}><ArrowLeftRight size={18} /><span>调拨</span></button></div></div></div>
        </>}
        {view === "inventory" && <><div className="page-heading"><div><p className="eyebrow">WAREHOUSE OPERATIONS</p><h1>库存总览</h1><p>掌握每一件物料的实时位置与库存状态。</p></div><button className="primary-btn" onClick={() => setView("products")}><PackageSearch size={16} /> 管理商品</button></div><div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="搜索 SKU、商品名称或分类" value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="filter-btn"><SlidersHorizontal size={16} /> 筛选</button></div><div className="inventory-summary"><div><span>商品品类</span><strong>{inventorySummary.categories}</strong></div><div><span>库存单位</span><strong>{inventorySummary.quantity.toLocaleString()}</strong></div><div><span>低库存</span><strong className={inventorySummary.low ? "danger-text" : "success-text"}>{inventorySummary.low}</strong></div><div><span>账务核对</span><strong className={summary && Number(summary.stats.consistency || 0) ? "danger-text" : "success-text"}>{summary ? (Number(summary.stats.consistency || 0) ? "异常" : "正常") : "—"}</strong></div></div><div className="panel table-panel"><table><thead><tr><th>商品信息</th><th>分类</th><th>仓库 / 库位</th><th>现有库存</th><th>安全库存</th><th>状态</th><th /></tr></thead><tbody>{filtered.map((row) => <tr key={row.sku}><td><strong>{row.name}</strong><span className="table-sub">{row.sku}</span></td><td>{row.category}</td><td><strong className="table-normal">{row.warehouse}</strong><span className="table-sub">库位 {row.location}</span></td><td><strong className="qty">{row.qty}</strong> {row.unit}</td><td>{row.min}</td><td><span className={`badge ${row.status === "充足" ? "success" : "warning"}`}>{row.status}</span></td><td><button className="more-btn">•••</button></td></tr>)}</tbody></table></div></>}
        {(view === "products" || view === "users" || view === "inbound") && <DataModule view={view} user={user} />}
        {(view === "outbound" || view === "transfer" || view === "count" || view === "audit" || view === "settings") && <OperationsModule view={view} user={user} />}
        {view !== "dashboard" && view !== "reports" && view !== "inventory" && view !== "products" && view !== "users" && view !== "inbound" && view !== "outbound" && view !== "transfer" && view !== "count" && view !== "audit" && view !== "settings" && <div className="placeholder-view"><div className="placeholder-icon"><Settings size={28} /></div><p className="eyebrow">MODULE READY</p><h1>{activeLabel}</h1><p>该模块已加入仓库控制台导航，下一步将接入 D1 数据与真实业务单据流程。</p><div className="module-cards"><div><Users size={18} /><strong>多人权限</strong><span>管理员 / 主管 / 操作员 / 查看人员</span></div><div><Warehouse size={18} /><strong>数据范围</strong><span>按仓库限制可见数据</span></div><div><FileText size={18} /><strong>操作留痕</strong><span>所有关键动作进入审计日志</span></div></div></div>}
      </section>
    </main>
  </div>;
}

type AuthUser = { id: number; name: string; email: string; role: string };

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(data.error || "登录失败，请稍后重试");
    onAuthenticated(data.user);
  };
  return <div className="auth-shell"><div className="auth-card"><img className="auth-logo" src="/sasaki-logo-auth.png" alt="仓库管理系统" /><p className="eyebrow">SECURE WAREHOUSE ACCESS</p><h1>欢迎回来</h1><p className="auth-subtitle">使用管理员创建的工作账号进入仓库管理系统。</p><form onSubmit={submit}><label>工作邮箱<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required /></label><label>密码<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required /></label>{error && <div className="auth-error">{error}</div>}<button className="primary-btn auth-submit" disabled={busy}>{busy ? "登录中…" : "进入工作台"}</button></form><p className="auth-switch-note">没有账号？请联系系统管理员创建员工账号。</p></div></div>;
}
function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => { fetch("/api/auth/me").then((response) => response.ok ? response.json() : { user: null }).then((data) => setUser(data.user)).catch(() => setUser(null)).finally(() => setChecking(false)); }, []);
  if (checking) return <div className="auth-loading">正在检查登录状态…</div>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  return <DashboardApp user={user} onLogout={async () => { await fetch("/api/auth/me", { method: "DELETE" }); setUser(null); }} />;
}

export default App;




