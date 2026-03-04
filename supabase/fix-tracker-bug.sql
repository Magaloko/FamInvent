-- ═══════════════════════════════════════════════════════
-- FamInventar - FIX: Tracker-Bug (user_id DEFAULT fehlt)
-- ═══════════════════════════════════════════════════════
-- PROBLEM: fm_trackers, fm_tracker_entries, fm_smoking_materials
-- haben user_id NOT NULL aber KEIN DEFAULT auth.uid().
-- Das INSERT schlaegt fehl weil user_id nicht mitgeschickt wird.
-- ═══════════════════════════════════════════════════════

-- Fix fm_trackers
ALTER TABLE fm_trackers ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Fix fm_tracker_entries
ALTER TABLE fm_tracker_entries ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Fix fm_smoking_materials
ALTER TABLE fm_smoking_materials ALTER COLUMN user_id SET DEFAULT auth.uid();
