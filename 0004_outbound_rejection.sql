PRAGMA foreign_keys = ON;
ALTER TABLE stock_documents ADD COLUMN rejection_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_rejection ON stock_documents(type, status, rejection_reason);
