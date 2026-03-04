-- ============================================
-- FamInventar — Family Inventory Database Schema
-- ============================================
-- Clean install: drops any partial state from
-- failed runs, then creates everything fresh.
-- ============================================

-- ═══════════════════════════════════════════
-- PART 0: CLEAN UP (safe for first run too)
-- ═══════════════════════════════════════════

DROP TABLE IF EXISTS fm_play_logs CASCADE;
DROP TABLE IF EXISTS fm_items CASCADE;
DROP TABLE IF EXISTS fm_collections CASCADE;
DROP TABLE IF EXISTS fm_members CASCADE;
DROP TABLE IF EXISTS fm_families CASCADE;

-- ═══════════════════════════════════════════
-- PART 1: CREATE ALL TABLES
-- ═══════════════════════════════════════════

CREATE TABLE fm_families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fm_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES fm_families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'child' CHECK (role IN ('parent', 'child')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fm_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES fm_families(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES fm_members(id) ON DELETE SET NULL,
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
  played_by UUID REFERENCES fm_members(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  notes TEXT DEFAULT ''
);

-- ═══════════════════════════════════════════
-- PART 2: INDEXES
-- ═══════════════════════════════════════════

CREATE INDEX idx_fm_members_family ON fm_members(family_id);
CREATE INDEX idx_fm_collections_family ON fm_collections(family_id);
CREATE INDEX idx_fm_collections_owner ON fm_collections(owner_id);
CREATE INDEX idx_fm_items_collection ON fm_items(collection_id);
CREATE INDEX idx_fm_items_category ON fm_items(category);
CREATE INDEX idx_fm_play_logs_item ON fm_play_logs(item_id);
CREATE INDEX idx_fm_play_logs_played_at ON fm_play_logs(played_at DESC);
CREATE INDEX idx_fm_play_logs_played_by ON fm_play_logs(played_by);

-- ═══════════════════════════════════════════
-- PART 3: ENABLE RLS
-- ═══════════════════════════════════════════

ALTER TABLE fm_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_play_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════
-- PART 4: RLS POLICIES
-- ═══════════════════════════════════════════

-- ── fm_families ────────────────────────────

CREATE POLICY "Auth users can create families"
  ON fm_families FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Family members can view their family"
  ON fm_families FOR SELECT TO authenticated
  USING (
    id IN (SELECT family_id FROM fm_members WHERE id = auth.uid())
  );

CREATE POLICY "Family parents can update their family"
  ON fm_families FOR UPDATE TO authenticated
  USING (
    id IN (SELECT family_id FROM fm_members WHERE id = auth.uid() AND role = 'parent')
  );

-- ── fm_members ─────────────────────────────

CREATE POLICY "Family members can view members"
  ON fm_members FOR SELECT TO authenticated
  USING (
    family_id IN (SELECT family_id FROM fm_members m WHERE m.id = auth.uid())
  );

CREATE POLICY "Parents can insert members"
  ON fm_members FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Parents can update members"
  ON fm_members FOR UPDATE TO authenticated
  USING (
    family_id IN (SELECT family_id FROM fm_members m WHERE m.id = auth.uid() AND m.role = 'parent')
  );

CREATE POLICY "Parents can delete members"
  ON fm_members FOR DELETE TO authenticated
  USING (
    family_id IN (SELECT family_id FROM fm_members m WHERE m.id = auth.uid() AND m.role = 'parent')
  );

-- ── fm_collections ─────────────────────────

CREATE POLICY "Family members can view collections"
  ON fm_collections FOR SELECT TO authenticated
  USING (
    family_id IN (SELECT family_id FROM fm_members WHERE id = auth.uid())
  );

CREATE POLICY "Parents can insert collections"
  ON fm_collections FOR INSERT TO authenticated
  WITH CHECK (
    family_id IN (SELECT family_id FROM fm_members WHERE id = auth.uid() AND role = 'parent')
  );

CREATE POLICY "Parents can update collections"
  ON fm_collections FOR UPDATE TO authenticated
  USING (
    family_id IN (SELECT family_id FROM fm_members WHERE id = auth.uid() AND role = 'parent')
  );

CREATE POLICY "Parents can delete collections"
  ON fm_collections FOR DELETE TO authenticated
  USING (
    family_id IN (SELECT family_id FROM fm_members WHERE id = auth.uid() AND role = 'parent')
  );

-- ── fm_items ───────────────────────────────

CREATE POLICY "Family members can view items"
  ON fm_items FOR SELECT TO authenticated
  USING (
    collection_id IN (
      SELECT c.id FROM fm_collections c
      JOIN fm_members m ON m.family_id = c.family_id
      WHERE m.id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert items"
  ON fm_items FOR INSERT TO authenticated
  WITH CHECK (
    collection_id IN (
      SELECT c.id FROM fm_collections c
      JOIN fm_members m ON m.family_id = c.family_id
      WHERE m.id = auth.uid() AND m.role = 'parent'
    )
  );

CREATE POLICY "Parents can update items"
  ON fm_items FOR UPDATE TO authenticated
  USING (
    collection_id IN (
      SELECT c.id FROM fm_collections c
      JOIN fm_members m ON m.family_id = c.family_id
      WHERE m.id = auth.uid() AND m.role = 'parent'
    )
  );

CREATE POLICY "Parents can delete items"
  ON fm_items FOR DELETE TO authenticated
  USING (
    collection_id IN (
      SELECT c.id FROM fm_collections c
      JOIN fm_members m ON m.family_id = c.family_id
      WHERE m.id = auth.uid() AND m.role = 'parent'
    )
  );

-- ── fm_play_logs ───────────────────────────

CREATE POLICY "Family members can view play logs"
  ON fm_play_logs FOR SELECT TO authenticated
  USING (
    item_id IN (
      SELECT i.id FROM fm_items i
      JOIN fm_collections c ON c.id = i.collection_id
      JOIN fm_members m ON m.family_id = c.family_id
      WHERE m.id = auth.uid()
    )
  );

CREATE POLICY "Family members can insert play logs"
  ON fm_play_logs FOR INSERT TO authenticated
  WITH CHECK (
    item_id IN (
      SELECT i.id FROM fm_items i
      JOIN fm_collections c ON c.id = i.collection_id
      JOIN fm_members m ON m.family_id = c.family_id
      WHERE m.id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete play logs"
  ON fm_play_logs FOR DELETE TO authenticated
  USING (
    item_id IN (
      SELECT i.id FROM fm_items i
      JOIN fm_collections c ON c.id = i.collection_id
      JOIN fm_members m ON m.family_id = c.family_id
      WHERE m.id = auth.uid() AND m.role = 'parent'
    )
  );

-- ═══════════════════════════════════════════
-- STORAGE BUCKET SETUP
-- ═══════════════════════════════════════════
-- Create bucket 'family-items' manually in Supabase Dashboard > Storage:
-- Name: family-items
-- Public: true
-- File size limit: 5MB (5242880 bytes)
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
