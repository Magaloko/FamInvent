-- ============================================
-- FamInventar — Migration V3
-- Handel-Modul: Produkte, Einkäufe, Verkäufe
-- (Chargen-Tracking + Teilverkauf + Margen)
-- ============================================

-- ═══════════════════════════════════════════
-- TABLE: fm_products (Produkt-Stammdaten)
-- ═══════════════════════════════════════════

CREATE TABLE fm_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'kg',
  image_url TEXT,
  low_stock_threshold NUMERIC(10,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- TABLE: fm_purchases (Einkäufe / Chargen)
-- ═══════════════════════════════════════════

CREATE TABLE fm_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  product_id UUID NOT NULL REFERENCES fm_products(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  supplier TEXT DEFAULT '',
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'eingekauft'
    CHECK (status IN ('eingekauft', 'im_lager', 'teilweise_verkauft', 'ausverkauft', 'storniert', 'reklamation')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- TABLE: fm_sales (Verkäufe / Teilverkäufe)
-- ═══════════════════════════════════════════

CREATE TABLE fm_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  purchase_id UUID NOT NULL REFERENCES fm_purchases(id) ON DELETE CASCADE,
  buyer TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'offen'
    CHECK (status IN ('offen', 'bezahlt', 'geliefert', 'abgeschlossen')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX idx_fm_products_user ON fm_products(user_id);
CREATE INDEX idx_fm_products_category ON fm_products(category);
CREATE INDEX idx_fm_purchases_user ON fm_purchases(user_id);
CREATE INDEX idx_fm_purchases_product ON fm_purchases(product_id);
CREATE INDEX idx_fm_purchases_status ON fm_purchases(status);
CREATE INDEX idx_fm_purchases_date ON fm_purchases(purchase_date DESC);
CREATE INDEX idx_fm_purchases_batch ON fm_purchases(batch_id);
CREATE INDEX idx_fm_sales_user ON fm_sales(user_id);
CREATE INDEX idx_fm_sales_purchase ON fm_sales(purchase_id);
CREATE INDEX idx_fm_sales_status ON fm_sales(status);
CREATE INDEX idx_fm_sales_date ON fm_sales(sale_date DESC);
CREATE INDEX idx_fm_sales_buyer ON fm_sales(buyer);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════

ALTER TABLE fm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_sales ENABLE ROW LEVEL SECURITY;

-- fm_products
CREATE POLICY "Users can view own products" ON fm_products FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can create products" ON fm_products FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own products" ON fm_products FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own products" ON fm_products FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- fm_purchases
CREATE POLICY "Users can view own purchases" ON fm_purchases FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can create purchases" ON fm_purchases FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own purchases" ON fm_purchases FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own purchases" ON fm_purchases FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- fm_sales
CREATE POLICY "Users can view own sales" ON fm_sales FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can create sales" ON fm_sales FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sales" ON fm_sales FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own sales" ON fm_sales FOR DELETE TO authenticated
  USING (user_id = auth.uid());
