-- ═══════════════════════════════════════════
-- FamInventar – Migration v4: Tracker Module
-- ═══════════════════════════════════════════

-- ── Trackers (Definitionen) ──────────────────────

CREATE TABLE fm_trackers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📊',
  color TEXT DEFAULT '#FF8A65',
  type TEXT NOT NULL CHECK (type IN ('counter', 'kosten', 'zeit', 'kombi')),
  unit TEXT DEFAULT '',
  daily_goal NUMERIC(10,2) DEFAULT 0,
  goal_direction TEXT DEFAULT 'max' CHECK (goal_direction IN ('max', 'min')),
  cost_per_unit NUMERIC(10,4) DEFAULT 0,
  monthly_cost NUMERIC(10,2) DEFAULT 0,
  has_subtypes BOOLEAN DEFAULT false,
  subtypes TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_smoking_tracker BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fm_trackers_user ON fm_trackers(user_id);
CREATE INDEX idx_fm_trackers_active ON fm_trackers(user_id, is_active);

ALTER TABLE fm_trackers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trackers"
  ON fm_trackers FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Tracker Entries (Einzelne Einträge) ──────────

CREATE TABLE fm_tracker_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tracker_id UUID REFERENCES fm_trackers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count NUMERIC(10,2) DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  subtype TEXT DEFAULT '',
  time_of_day TIME,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fm_tracker_entries_tracker ON fm_tracker_entries(tracker_id);
CREATE INDEX idx_fm_tracker_entries_user ON fm_tracker_entries(user_id);
CREATE INDEX idx_fm_tracker_entries_date ON fm_tracker_entries(tracker_id, date);
CREATE INDEX idx_fm_tracker_entries_user_date ON fm_tracker_entries(user_id, date);

ALTER TABLE fm_tracker_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tracker entries"
  ON fm_tracker_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Smoking Materials (Materialien für Selbstgedrehte) ──

CREATE TABLE fm_smoking_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tracker_id UUID REFERENCES fm_trackers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  package_amount NUMERIC(10,2) NOT NULL DEFAULT 1,
  package_unit TEXT DEFAULT 'g',
  package_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  usage_per_cig NUMERIC(10,4) NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fm_smoking_materials_tracker ON fm_smoking_materials(tracker_id);
CREATE INDEX idx_fm_smoking_materials_user ON fm_smoking_materials(user_id);

ALTER TABLE fm_smoking_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own smoking materials"
  ON fm_smoking_materials FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
