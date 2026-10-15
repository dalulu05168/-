PRAGMA foreign_keys = ON;
CREATE TRIGGER IF NOT EXISTS prevent_negative_inventory
BEFORE UPDATE OF quantity ON inventory
WHEN NEW.quantity < 0
BEGIN
  SELECT RAISE(ABORT, '库存不能为负数，库存写入已回滚');
END;
