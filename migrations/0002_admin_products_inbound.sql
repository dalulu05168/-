PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_documents_type_status ON stock_documents(type,status);

-- 为商品和入库业务补齐必要索引；权限规则由 Worker 按角色校验。
CREATE INDEX IF NOT EXISTS idx_document_items_document ON stock_document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
