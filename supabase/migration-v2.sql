-- ============================================
-- FamInventar — Migration V2
-- Erweiterte Item-Felder: Standort, Herkunft,
-- Foto, Rechnung
-- ============================================

-- Standort / Ausleih-Status
ALTER TABLE fm_items ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'zuhause';
ALTER TABLE fm_items ADD COLUMN IF NOT EXISTS borrowed_to TEXT DEFAULT '';

-- Herkunft (gekauft / geschenkt)
ALTER TABLE fm_items ADD COLUMN IF NOT EXISTS acquired_type TEXT DEFAULT '';
ALTER TABLE fm_items ADD COLUMN IF NOT EXISTS acquired_date DATE;
ALTER TABLE fm_items ADD COLUMN IF NOT EXISTS acquired_from TEXT DEFAULT '';
ALTER TABLE fm_items ADD COLUMN IF NOT EXISTS acquired_occasion TEXT DEFAULT '';

-- Rechnung
ALTER TABLE fm_items ADD COLUMN IF NOT EXISTS receipt_url TEXT;
