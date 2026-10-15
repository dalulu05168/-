PRAGMA foreign_keys = ON;
ALTER TABLE inventory ADD COLUMN opening_quantity REAL NOT NULL DEFAULT 0;
UPDATE inventory SET opening_quantity = quantity WHERE opening_quantity = 0;
CREATE INDEX IF NOT EXISTS idx_inventory_integrity ON inventory(warehouse_id, product_id, opening_quantity);
