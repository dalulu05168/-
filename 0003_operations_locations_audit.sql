PRAGMA foreign_keys = ON;

ALTER TABLE stock_documents ADD COLUMN target_warehouse_id INTEGER REFERENCES warehouses(id);
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  code TEXT NOT NULL,
  name TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE (warehouse_id, code)
);
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON stock_documents(type, status, created_at);
CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
INSERT OR IGNORE INTO warehouse_locations (warehouse_id, code, name, capacity) VALUES
  (1, 'A-01-03', '轴承货架', 500),
  (1, 'A-03-06', '传动部件货架', 300),
  (1, 'B-02-01', '动力设备货架', 100),
  (2, 'C-04-08', '紧固件货架', 800),
  (2, 'D-01-02', '过滤耗材货架', 400);
