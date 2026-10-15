PRAGMA foreign_keys = ON;
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_movement_document_line
ON stock_movements(document_id, product_id, warehouse_id, movement_type)
WHERE document_id IS NOT NULL;
