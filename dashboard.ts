interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [products, warehouses, documents, movements] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM products WHERE status = 'active'").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM warehouses WHERE status = 'active'").first<{ count: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM stock_documents WHERE status IN ('pending','approved')").first<{ count: number }>(),
    env.DB.prepare("SELECT COALESCE(SUM(quantity), 0) AS total FROM stock_movements WHERE created_at >= date('now', '-30 day')").first<{ total: number }>(),
  ]);

  return Response.json({
    activeProducts: products?.count ?? 0,
    activeWarehouses: warehouses?.count ?? 0,
    pendingDocuments: documents?.count ?? 0,
    recentMovement: movements?.total ?? 0,
  });
};
