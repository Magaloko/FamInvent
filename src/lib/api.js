import { supabase, isSupabaseConfigured } from './supabase'

// ── Collections ────────────────────────────────────

export async function getCollections({ type } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  let query = supabase
    .from('fm_collections')
    .select('*, fm_items(count)')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, error } = await query

  const collections = (data || []).map((c) => ({
    ...c,
    itemCount: c.fm_items?.[0]?.count || 0,
  }))

  return { data: collections, error: error?.message }
}

export async function getCollection(id) {
  if (!isSupabaseConfigured) return { data: null, error: null }

  const { data, error } = await supabase
    .from('fm_collections')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error: error?.message }
}

export async function createCollection(collection) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_collections')
    .insert(collection)
    .select()
    .single()

  return { data, error: error?.message }
}

export async function updateCollection(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error: error?.message }
}

export async function deleteCollection(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }

  const { error } = await supabase
    .from('fm_collections')
    .delete()
    .eq('id', id)

  return { error: error?.message }
}

// ── Items ──────────────────────────────────────────

export async function getItems(collectionId, { category, search } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  let query = supabase
    .from('fm_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query

  return { data: data || [], error: error?.message }
}

export async function getItem(id) {
  if (!isSupabaseConfigured) return { data: null, error: null }

  const { data, error } = await supabase
    .from('fm_items')
    .select('*, fm_collections(name, type, icon)')
    .eq('id', id)
    .single()

  return { data, error: error?.message }
}

export async function createItem(item) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_items')
    .insert(item)
    .select()
    .single()

  return { data, error: error?.message }
}

export async function updateItem(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error: error?.message }
}

export async function deleteItem(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }

  const { error } = await supabase
    .from('fm_items')
    .delete()
    .eq('id', id)

  return { error: error?.message }
}

export async function getAllToyItems() {
  if (!isSupabaseConfigured) return { data: [], error: null }

  const { data: collections } = await supabase
    .from('fm_collections')
    .select('id')
    .eq('type', 'toy')

  if (!collections?.length) return { data: [], error: null }

  const { data, error } = await supabase
    .from('fm_items')
    .select('id, name, image_url, collection_id')
    .in('collection_id', collections.map((c) => c.id))
    .order('name')

  return { data: data || [], error: error?.message }
}

// ── Play Logs ──────────────────────────────────────

export async function getPlayLogs({ itemId, limit = 50 } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  let query = supabase
    .from('fm_play_logs')
    .select('*, fm_items(name, image_url, collection_id)')
    .order('played_at', { ascending: false })

  if (itemId) query = query.eq('item_id', itemId)
  if (limit) query = query.limit(limit)

  const { data, error } = await query

  return { data: data || [], error: error?.message }
}

export async function createPlayLog(log) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_play_logs')
    .insert(log)
    .select()
    .single()

  return { data, error: error?.message }
}

export async function deletePlayLog(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }

  const { error } = await supabase
    .from('fm_play_logs')
    .delete()
    .eq('id', id)

  return { error: error?.message }
}

// ── Statistics ─────────────────────────────────────

export async function getTopToys({ limit = 5 } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  const { data: collections } = await supabase
    .from('fm_collections')
    .select('id')
    .eq('type', 'toy')

  if (!collections?.length) return { data: [], error: null }

  const { data: items } = await supabase
    .from('fm_items')
    .select('id, name, image_url, collection_id')
    .in('collection_id', collections.map((c) => c.id))

  if (!items?.length) return { data: [], error: null }

  const { data: logs } = await supabase
    .from('fm_play_logs')
    .select('item_id, played_at')
    .in('item_id', items.map((i) => i.id))

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const scores = {}
  items.forEach((item) => {
    scores[item.id] = { ...item, totalPlays: 0, recentPlays: 0 }
  })

  ;(logs || []).forEach((log) => {
    if (scores[log.item_id]) {
      scores[log.item_id].totalPlays++
      if (new Date(log.played_at) > thirtyDaysAgo) {
        scores[log.item_id].recentPlays++
      }
    }
  })

  const ranked = Object.values(scores)
    .map((s) => ({
      ...s,
      score: s.totalPlays * 0.6 + s.recentPlays * 0.4,
    }))
    .filter((s) => s.totalPlays > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return { data: ranked, error: null }
}

export async function getStats() {
  if (!isSupabaseConfigured) {
    return {
      data: { totalItems: 0, totalCollections: 0, totalValue: 0, totalPlayMinutes: 0 },
      error: null,
    }
  }

  const { data: collections } = await supabase
    .from('fm_collections')
    .select('id, name, type, icon')

  if (!collections?.length) {
    return {
      data: { totalItems: 0, totalCollections: 0, totalValue: 0, totalPlayMinutes: 0 },
      error: null,
    }
  }

  const collectionIds = collections.map((c) => c.id)

  const { data: items } = await supabase
    .from('fm_items')
    .select('id, value, collection_id, category')
    .in('collection_id', collectionIds)

  const totalItems = items?.length || 0
  const totalValue = (items || []).reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0)

  const valueByCollection = collections.map((c) => {
    const collItems = (items || []).filter((i) => i.collection_id === c.id)
    return {
      name: c.name,
      icon: c.icon,
      value: collItems.reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0),
      count: collItems.length,
    }
  })

  const categoryMap = {}
  ;(items || []).forEach((i) => {
    const cat = i.category || 'Sonstiges'
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  })
  const categoryDistribution = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count,
  }))

  let totalPlayMinutes = 0
  const itemIds = (items || []).map((i) => i.id)
  if (itemIds.length) {
    const { data: logs } = await supabase
      .from('fm_play_logs')
      .select('duration_minutes')
      .in('item_id', itemIds)

    totalPlayMinutes = (logs || []).reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
  }

  return {
    data: {
      totalItems,
      totalCollections: collections.length,
      totalValue,
      totalPlayMinutes,
      valueByCollection,
      categoryDistribution,
    },
    error: null,
  }
}

export async function getCollectionValue(collectionId) {
  if (!isSupabaseConfigured) return { data: 0, error: null }

  const { data: items } = await supabase
    .from('fm_items')
    .select('value')
    .eq('collection_id', collectionId)

  const total = (items || []).reduce((sum, i) => sum + (parseFloat(i.value) || 0), 0)

  return { data: total, error: null }
}

// Batch version: fetches values for multiple collections in a single DB query
export async function getCollectionValues(collectionIds) {
  if (!isSupabaseConfigured || !collectionIds.length) return { data: {}, error: null }

  const { data: items, error } = await supabase
    .from('fm_items')
    .select('collection_id, value')
    .in('collection_id', collectionIds)

  const vals = {}
  collectionIds.forEach((id) => { vals[id] = 0 })
  ;(items || []).forEach((item) => {
    vals[item.collection_id] = (vals[item.collection_id] || 0) + (parseFloat(item.value) || 0)
  })

  return { data: vals, error: error?.message }
}
