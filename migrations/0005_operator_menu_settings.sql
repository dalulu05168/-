PRAGMA foreign_keys = ON;
ALTER TABLE stock_documents ADD COLUMN operator_name TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_operator ON stock_documents(operator_name, created_at);
