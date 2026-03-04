import { supabase, isSupabaseConfigured } from './supabase'

// ── Families ───────────────────────────────────────

export async function createFamily(name) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_families')
    .insert({ name })
    .select()
    .single()

  return { data, error: error?.message }
}

export async function getFamily(userId) {
  if (!isSupabaseConfigured) return { data: null, error: null }

  const { data: member } = await supabase
    .from('fm_members')
    .select('family_id')
    .eq('id', userId)
    .single()

  if (!member) return { data: null, error: null }

  const { data, error } = await supabase
    .from('fm_families')
    .select('*')
    .eq('id', member.family_id)
    .single()

  return { data, error: error?.message }
}

export async function updateFamily(familyId, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_families')
    .update(updates)
    .eq('id', familyId)
    .select()
    .single()

  return { data, error: error?.message }
}

// ── Members ────────────────────────────────────────

export async function getMembers(familyId) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  const { data, error } = await supabase
    .from('fm_members')
    .select('*')
    .eq('family_id', familyId)
    .order('role', { ascending: true })
    .order('created_at', { ascending: true })

  return { data: data || [], error: error?.message }
}

export async function createMember(member) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_members')
    .insert(member)
    .select()
    .single()

  return { data, error: error?.message }
}

export async function updateMember(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }

  const { data, error } = await supabase
    .from('fm_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error: error?.message }
}

export async function deleteMember(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }

  const { error } = await supabase
    .from('fm_members')
    .delete()
    .eq('id', id)

  return { error: error?.message }
}

// ── Collections ────────────────────────────────────

export async function getCollections(familyId, { ownerId, type } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  let query = supabase
    .from('fm_collections')
    .select('*, fm_items(count)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })

  if (ownerId) query = query.eq('owner_id', ownerId)
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
    .select('*, fm_collections(name, type, family_id, icon)')
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

export async function getItemsByFamily(familyId) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  const { data: collections } = await supabase
    .from('fm_collections')
    .select('id')
    .eq('family_id', familyId)

  if (!collections?.length) return { data: [], error: null }

  const ids = collections.map((c) => c.id)

  const { data, error } = await supabase
    .from('fm_items')
    .select('*, fm_collections(name, type, icon)')
    .in('collection_id', ids)
    .order('created_at', { ascending: false })

  return { data: data || [], error: error?.message }
}

// ── Play Logs ──────────────────────────────────────

export async function getPlayLogs({ familyId, itemId, memberId, limit = 50 } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  let query = supabase
    .from('fm_play_logs')
    .select('*, fm_items(name, image_url, collection_id), fm_members(name, avatar_url)')
    .order('played_at', { ascending: false })

  if (itemId) query = query.eq('item_id', itemId)
  if (memberId) query = query.eq('played_by', memberId)
  if (limit) query = query.limit(limit)

  if (familyId && !itemId) {
    const { data: collections } = await supabase
      .from('fm_collections')
      .select('id')
      .eq('family_id', familyId)

    if (!collections?.length) return { data: [], error: null }

    const { data: items } = await supabase
      .from('fm_items')
      .select('id')
      .in('collection_id', collections.map((c) => c.id))

    if (!items?.length) return { data: [], error: null }

    query = query.in('item_id', items.map((i) => i.id))
  }

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

export async function getTopToys(familyId, { memberId, limit = 5 } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }

  const { data: collections } = await supabase
    .from('fm_collections')
    .select('id')
    .eq('family_id', familyId)
    .eq('type', 'toy')

  if (!collections?.length) return { data: [], error: null }

  const { data: items } = await supabase
    .from('fm_items')
    .select('id, name, image_url, collection_id')
    .in('collection_id', collections.map((c) => c.id))

  if (!items?.length) return { data: [], error: null }

  let logQuery = supabase
    .from('fm_play_logs')
    .select('item_id, played_at')
    .in('item_id', items.map((i) => i.id))

  if (memberId) logQuery = logQuery.eq('played_by', memberId)

  const { data: logs } = await logQuery

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

export async function getFamilyStats(familyId) {
  if (!isSupabaseConfigured) {
    return {
      data: { totalItems: 0, totalCollections: 0, totalValue: 0, totalPlayMinutes: 0 },
      error: null,
    }
  }

  const { data: collections } = await supabase
    .from('fm_collections')
    .select('id, name, type, icon')
    .eq('family_id', familyId)

  if (!collections?.length) {
    return {
      data: { totalItems: 0, totalCollections: collections?.length || 0, totalValue: 0, totalPlayMinutes: 0 },
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
