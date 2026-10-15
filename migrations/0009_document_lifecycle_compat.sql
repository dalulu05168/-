PRAGMA foreign_keys = OFF;
ALTER TABLE stock_documents RENAME TO stock_documents_legacy;
CREATE TABLE stock_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_no TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('inbound','outbound','transfer','count')),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  target_warehouse_id INTEGER REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','processing','approved','rejected','deleted','completed','cancelled')),
  operator_id INTEGER REFERENCES users(id),
  operator_name TEXT,
  rejection_reason TEXT,
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO stock_documents(id,document_no,type,warehouse_id,target_warehouse_id,status,operator_id,remark,created_at)
SELECT id,document_no,type,warehouse_id,target_warehouse_id,status,operator_id,remark,created_at FROM stock_documents_legacy;
DROP TABLE stock_documents_legacy;
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON stock_documents(type,status,created_at);
CREATE INDEX IF NOT EXISTS idx_documents_rejection ON stock_documents(type,status,rejection_reason);
CREATE INDEX IF NOT EXISTS idx_documents_operator ON stock_documents(operator_name,created_at);
PRAGMA foreign_keys = ON;
