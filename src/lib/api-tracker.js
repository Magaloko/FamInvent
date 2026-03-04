import { supabase, isSupabaseConfigured } from './supabase'

// ── Helpers ───────────────────────────────────────

export function computeRolledCigCost(materials = []) {
  return materials.reduce((sum, m) => {
    const pricePerUnit = (parseFloat(m.package_price) || 0) / (parseFloat(m.package_amount) || 1)
    return sum + pricePerUnit * (parseFloat(m.usage_per_cig) || 0)
  }, 0)
}

export function computeStreak(entries, dailyGoal, goalDirection = 'max') {
  if (!dailyGoal || dailyGoal <= 0) return { current: 0, best: 0 }

  // Group entries by date
  const byDate = {}
  entries.forEach((e) => {
    const d = e.date
    byDate[d] = (byDate[d] || 0) + (parseFloat(e.count) || 0)
  })

  // Build date list going backwards from today (up to 365 days)
  const today = new Date().toISOString().split('T')[0]
  const dates = []
  const d = new Date(today)
  for (let i = 0; i < 365; i++) {
    dates.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() - 1)
  }

  // For min-direction: only check days that have entries
  // (we don't count days where user has no data yet as "failed")
  // For max-direction: 0 entries = 0 units = always under limit (counts as success)
  function meetsGoal(dateStr, idx) {
    const val = byDate[dateStr] || 0
    if (goalDirection === 'max') {
      return val <= dailyGoal
    } else {
      // min-direction: only consider days where an entry was actually made
      // Skip days with no entries (they are "not tracked" not "failed")
      if (val === 0 && !byDate[dateStr]) return null // no data = skip
      return val >= dailyGoal
    }
  }

  let current = 0
  let best = 0
  let streak = 0
  let inCurrentRun = true // whether we're still in a run from today

  for (let i = 0; i < dates.length; i++) {
    const result = meetsGoal(dates[i], i)
    if (result === null) {
      // No data for this day — skip (don't break streak, don't extend)
      // But do break current run if we've gone past today
      continue
    }
    if (result) {
      streak++
      if (inCurrentRun) current = streak
      best = Math.max(best, streak)
    } else {
      if (i === 0) current = 0 // today doesn't meet goal
      inCurrentRun = false
      streak = 0
    }
  }

  return { current, best }
}

export function aggregateByDay(entries, startDate, endDate) {
  const result = {}
  const d = new Date(startDate)
  const end = new Date(endDate)
  while (d <= end) {
    const key = d.toISOString().split('T')[0]
    result[key] = { date: key, count: 0, cost: 0, duration: 0 }
    d.setDate(d.getDate() + 1)
  }
  entries.forEach((e) => {
    if (result[e.date]) {
      result[e.date].count += parseFloat(e.count) || 0
      result[e.date].cost += parseFloat(e.cost) || 0
      result[e.date].duration += parseInt(e.duration_minutes) || 0
    }
  })
  return Object.values(result)
}

export function computeTrend(entries, period = 'week') {
  const today = new Date()
  const days = period === 'week' ? 7 : 30
  const currentStart = new Date(today)
  currentStart.setDate(currentStart.getDate() - days + 1)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - days)

  const currentStr = currentStart.toISOString().split('T')[0]
  const previousStr = previousStart.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const currentEntries = entries.filter((e) => e.date >= currentStr && e.date <= todayStr)
  const previousEntries = entries.filter((e) => e.date >= previousStr && e.date < currentStr)

  const currentTotal = currentEntries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
  const previousTotal = previousEntries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
  const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  return { current: currentTotal, previous: previousTotal, changePercent }
}

// ── Trackers CRUD ─────────────────────────────────

export async function getTrackers({ activeOnly = true } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  let query = supabase
    .from('fm_trackers')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  return { data: data || [], error: error?.message }
}

export async function getTracker(id) {
  if (!isSupabaseConfigured) return { data: null, error: null }
  const { data, error } = await supabase
    .from('fm_trackers')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error: error?.message }
}

export async function createTracker(tracker) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_trackers')
    .insert(tracker)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function updateTracker(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_trackers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function deleteTracker(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }
  const { error } = await supabase.from('fm_trackers').delete().eq('id', id)
  return { error: error?.message }
}

// ── Entries CRUD ──────────────────────────────────

export async function getEntries(trackerId, { startDate, endDate, limit = 500 } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  let query = supabase
    .from('fm_tracker_entries')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)
  const { data, error } = await query
  return { data: data || [], error: error?.message }
}

export async function getEntriesForDate(date) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  const { data, error } = await supabase
    .from('fm_tracker_entries')
    .select('*, fm_trackers(name, icon, color, type, unit, daily_goal, goal_direction)')
    .eq('date', date)
    .order('created_at', { ascending: false })
  return { data: data || [], error: error?.message }
}

export async function createEntry(entry, materials = []) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  // Auto-calculate cost for rolled cigarettes
  if (entry.subtype === 'gedreht' && materials.length > 0 && !entry.cost) {
    const costPerCig = computeRolledCigCost(materials)
    entry.cost = (parseFloat(entry.count) || 0) * costPerCig
  }
  const { data, error } = await supabase
    .from('fm_tracker_entries')
    .insert(entry)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function updateEntry(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_tracker_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function deleteEntry(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }
  const { error } = await supabase.from('fm_tracker_entries').delete().eq('id', id)
  return { error: error?.message }
}

// ── Materials CRUD ────────────────────────────────

export async function getMaterials(trackerId) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  const { data, error } = await supabase
    .from('fm_smoking_materials')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('sort_order', { ascending: true })
  return { data: data || [], error: error?.message }
}

export async function createMaterial(material) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_smoking_materials')
    .insert(material)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function updateMaterial(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_smoking_materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function deleteMaterial(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }
  const { error } = await supabase.from('fm_smoking_materials').delete().eq('id', id)
  return { error: error?.message }
}

// ── Statistics ────────────────────────────────────

export async function getTrackerStats() {
  if (!isSupabaseConfigured) {
    return { data: { trackers: [], todayTotal: 0, todayCost: 0, weekTrend: 0 }, error: null }
  }

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

  const [trackersRes, todayRes, weekRes, prevWeekRes] = await Promise.all([
    supabase.from('fm_trackers').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('fm_tracker_entries').select('tracker_id, count, cost, duration_minutes').eq('date', today),
    supabase.from('fm_tracker_entries').select('tracker_id, count, cost').gte('date', weekAgo),
    supabase.from('fm_tracker_entries').select('tracker_id, count, cost').gte('date', twoWeeksAgo).lt('date', weekAgo),
  ])

  const trackers = trackersRes.data || []
  const todayEntries = todayRes.data || []
  const weekEntries = weekRes.data || []
  const prevWeekEntries = prevWeekRes.data || []

  const todayTotal = todayEntries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
  const todayCost = todayEntries.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)

  const weekTotal = weekEntries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
  const prevWeekTotal = prevWeekEntries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
  const weekTrend = prevWeekTotal > 0 ? ((weekTotal - prevWeekTotal) / prevWeekTotal) * 100 : 0

  // Per-tracker today stats
  const trackerStats = trackers.map((t) => {
    const tEntries = todayEntries.filter((e) => e.tracker_id === t.id)
    const todayCount = tEntries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
    const todayTrackerCost = tEntries.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
    const todayDuration = tEntries.reduce((s, e) => s + (parseInt(e.duration_minutes) || 0), 0)
    return { ...t, todayCount, todayCost: todayTrackerCost, todayDuration }
  })

  return {
    data: { trackers: trackerStats, todayTotal, todayCost, weekTrend },
    error: null,
  }
}

export async function getTrackerDetailStats(trackerId, days = 30) {
  if (!isSupabaseConfigured) return { data: null, error: null }

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const [trackerRes, entriesRes, materialsRes, allEntriesRes] = await Promise.all([
    supabase.from('fm_trackers').select('*').eq('id', trackerId).single(),
    // Display entries (last N days)
    supabase.from('fm_tracker_entries').select('*').eq('tracker_id', trackerId).gte('date', startDate).order('date', { ascending: false }),
    supabase.from('fm_smoking_materials').select('*').eq('tracker_id', trackerId).order('sort_order'),
    // All-time entries for accurate streak calculation (only date + count needed)
    supabase.from('fm_tracker_entries').select('date, count').eq('tracker_id', trackerId).order('date', { ascending: false }),
  ])

  const tracker = trackerRes.data
  const entries = entriesRes.data || []
  const materials = materialsRes.data || []
  const allEntries = allEntriesRes.data || []

  if (!tracker) return { data: null, error: 'Tracker nicht gefunden' }

  const daily = aggregateByDay(entries, startDate, endDate)
  // Compute streak from ALL-TIME entries, not just last N days
  const streak = computeStreak(allEntries, parseFloat(tracker.daily_goal), tracker.goal_direction)
  const trend = computeTrend(entries, 'week')
  const rolledCost = computeRolledCigCost(materials)

  const totalCount = entries.reduce((s, e) => s + (parseFloat(e.count) || 0), 0)
  const totalCost = entries.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
  const totalDuration = entries.reduce((s, e) => s + (parseInt(e.duration_minutes) || 0), 0)
  const avgPerDay = days > 0 ? totalCount / days : 0

  return {
    data: {
      tracker,
      entries,
      materials,
      daily,
      streak,
      trend,
      rolledCost,
      totalCount,
      totalCost,
      totalDuration,
      avgPerDay,
    },
    error: null,
  }
}
