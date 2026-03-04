-- ============================================
-- FamInventar — Simplified Database Schema
-- ============================================
-- No family/member system. Collections belong
-- directly to the authenticated user (auth.uid).
-- ============================================

-- ═══════════════════════════════════════════
-- CLEAN UP
-- ═══════════════════════════════════════════

DROP TABLE IF EXISTS fm_play_logs CASCADE;
DROP TABLE IF EXISTS fm_items CASCADE;
DROP TABLE IF EXISTS fm_collections CASCADE;
DROP TABLE IF EXISTS fm_members CASCADE;
DROP TABLE IF EXISTS fm_families CASCADE;
DROP FUNCTION IF EXISTS fm_get_my_family_id();

-- ═══════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════

CREATE TABLE fm_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'normal' CHECK (type IN ('normal', 'toy')),
  icon TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fm_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES fm_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  value NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fm_play_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES fm_items(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  notes TEXT DEFAULT ''
);

-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX idx_fm_collections_user ON fm_collections(user_id);
CREATE INDEX idx_fm_items_collection ON fm_items(collection_id);
CREATE INDEX idx_fm_items_category ON fm_items(category);
CREATE INDEX idx_fm_play_logs_item ON fm_play_logs(item_id);
CREATE INDEX idx_fm_play_logs_played_at ON fm_play_logs(played_at DESC);

-- ═══════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════

ALTER TABLE fm_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_play_logs ENABLE ROW LEVEL SECURITY;

-- ── fm_collections: user owns their own ────

CREATE POLICY "Users can view own collections"
  ON fm_collections FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create collections"
  ON fm_collections FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections"
  ON fm_collections FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collections"
  ON fm_collections FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── fm_items: via collection ownership ─────

CREATE POLICY "Users can view own items"
  ON fm_items FOR SELECT TO authenticated
  USING (
    collection_id IN (SELECT id FROM fm_collections WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create items"
  ON fm_items FOR INSERT TO authenticated
  WITH CHECK (
    collection_id IN (SELECT id FROM fm_collections WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own items"
  ON fm_items FOR UPDATE TO authenticated
  USING (
    collection_id IN (SELECT id FROM fm_collections WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own items"
  ON fm_items FOR DELETE TO authenticated
  USING (
    collection_id IN (SELECT id FROM fm_collections WHERE user_id = auth.uid())
  );

-- ── fm_play_logs: via item → collection ────

CREATE POLICY "Users can view own play logs"
  ON fm_play_logs FOR SELECT TO authenticated
  USING (
    item_id IN (
      SELECT i.id FROM fm_items i
      JOIN fm_collections c ON c.id = i.collection_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create play logs"
  ON fm_play_logs FOR INSERT TO authenticated
  WITH CHECK (
    item_id IN (
      SELECT i.id FROM fm_items i
      JOIN fm_collections c ON c.id = i.collection_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own play logs"
  ON fm_play_logs FOR DELETE TO authenticated
  USING (
    item_id IN (
      SELECT i.id FROM fm_items i
      JOIN fm_collections c ON c.id = i.collection_id
      WHERE c.user_id = auth.uid()
    )
  );
