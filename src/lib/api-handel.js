import { supabase, isSupabaseConfigured } from './supabase'

// ── Helpers ───────────────────────────────────────

export function generateBatchId(productName, existingBatchIds = []) {
  const prefix = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'PROD'
  const year = new Date().getFullYear()
  const yearPrefix = `${prefix}-${year}-`
  const existing = existingBatchIds
    .filter((b) => b.startsWith(yearPrefix))
    .map((b) => parseInt(b.replace(yearPrefix, ''), 10))
    .filter((n) => !isNaN(n))
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return `${yearPrefix}${String(next).padStart(3, '0')}`
}

export function computePurchaseMetrics(purchase, sales = []) {
  const qty = parseFloat(purchase.quantity) || 0
  const price = parseFloat(purchase.total_price) || 0
  const pricePerUnit = qty > 0 ? price / qty : 0
  const soldQuantity = sales.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0)
  const remaining = qty - soldQuantity
  const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.sale_price) || 0), 0)
  const costOfSold = soldQuantity * pricePerUnit
  const profit = totalRevenue - costOfSold
  const marginPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
  const soldPercent = qty > 0 ? (soldQuantity / qty) * 100 : 0

  return { pricePerUnit, soldQuantity, remaining, totalRevenue, costOfSold, profit, marginPercent, soldPercent }
}

// ── Products ──────────────────────────────────────

export async function getProducts({ category, search, activeOnly = true } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  let query = supabase
    .from('fm_products')
    .select('*, fm_purchases(count)')
    .order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query
  const products = (data || []).map((p) => ({
    ...p,
    purchaseCount: p.fm_purchases?.[0]?.count || 0,
  }))
  return { data: products, error: error?.message }
}

export async function getProduct(id) {
  if (!isSupabaseConfigured) return { data: null, error: null }
  const { data, error } = await supabase
    .from('fm_products')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error: error?.message }
}

export async function createProduct(product) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_products')
    .insert(product)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function updateProduct(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function deleteProduct(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }
  const { error } = await supabase.from('fm_products').delete().eq('id', id)
  return { error: error?.message }
}

// ── Purchases ─────────────────────────────────────

export async function getPurchases(productId, { status } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  let query = supabase
    .from('fm_purchases')
    .select('*, fm_sales(id, quantity, sale_price, sale_date, buyer, status)')
    .eq('product_id', productId)
    .order('purchase_date', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  const enriched = (data || []).map((p) => ({
    ...p,
    ...computePurchaseMetrics(p, p.fm_sales || []),
  }))
  return { data: enriched, error: error?.message }
}

export async function getPurchase(id) {
  if (!isSupabaseConfigured) return { data: null, error: null }
  const { data, error } = await supabase
    .from('fm_purchases')
    .select('*, fm_products(name, unit, category), fm_sales(id, quantity, sale_price, sale_date, buyer, status, notes, created_at)')
    .eq('id', id)
    .single()
  if (data) {
    Object.assign(data, computePurchaseMetrics(data, data.fm_sales || []))
  }
  return { data, error: error?.message }
}

export async function createPurchase(purchase) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_purchases')
    .insert(purchase)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function updatePurchase(id, updates) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_purchases')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error: error?.message }
}

export async function deletePurchase(id) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }
  const { error } = await supabase.from('fm_purchases').delete().eq('id', id)
  return { error: error?.message }
}

export async function getBatchIdsForProduct(productId) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  const { data, error } = await supabase
    .from('fm_purchases')
    .select('batch_id')
    .eq('product_id', productId)
  return { data: (data || []).map((d) => d.batch_id), error: error?.message }
}

// ── Sales ─────────────────────────────────────────

export async function getSales(purchaseId) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  const { data, error } = await supabase
    .from('fm_sales')
    .select('*')
    .eq('purchase_id', purchaseId)
    .order('sale_date', { ascending: false })
  return { data: data || [], error: error?.message }
}

export async function getAllSales({ limit = 50, buyer, status } = {}) {
  if (!isSupabaseConfigured) return { data: [], error: null }
  let query = supabase
    .from('fm_sales')
    .select('*, fm_purchases(batch_id, fm_products(name, unit))')
    .order('sale_date', { ascending: false })
    .limit(limit)
  if (buyer) query = query.ilike('buyer', `%${buyer}%`)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  return { data: data || [], error: error?.message }
}

export async function createSale(sale) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_sales')
    .insert(sale)
    .select()
    .single()
  if (data) await recalcPurchaseStatus(sale.purchase_id)
  return { data, error: error?.message }
}

export async function updateSale(id, updates, purchaseId) {
  if (!isSupabaseConfigured) return { data: null, error: 'Nicht konfiguriert' }
  const { data, error } = await supabase
    .from('fm_sales')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (purchaseId) await recalcPurchaseStatus(purchaseId)
  return { data, error: error?.message }
}

export async function deleteSale(id, purchaseId) {
  if (!isSupabaseConfigured) return { error: 'Nicht konfiguriert' }
  const { error } = await supabase.from('fm_sales').delete().eq('id', id)
  if (purchaseId) await recalcPurchaseStatus(purchaseId)
  return { error: error?.message }
}

// ── Auto-update purchase status ───────────────────

async function recalcPurchaseStatus(purchaseId) {
  const { data: purchase } = await supabase
    .from('fm_purchases')
    .select('quantity, status')
    .eq('id', purchaseId)
    .single()
  if (!purchase) return
  if (['storniert', 'reklamation'].includes(purchase.status)) return

  const { data: sales } = await supabase
    .from('fm_sales')
    .select('quantity')
    .eq('purchase_id', purchaseId)

  const soldQty = (sales || []).reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0)
  let newStatus = purchase.status
  if (soldQty >= parseFloat(purchase.quantity)) newStatus = 'ausverkauft'
  else if (soldQty > 0) newStatus = 'teilweise_verkauft'
  else newStatus = 'im_lager'

  if (newStatus !== purchase.status) {
    await supabase.from('fm_purchases').update({ status: newStatus }).eq('id', purchaseId)
  }
}

// ── Trading Statistics ────────────────────────────

export async function getHandelStats() {
  if (!isSupabaseConfigured) {
    return { data: { totalProducts: 0, totalActiveBatches: 0, lagerwert: 0, monthlyProfit: 0, openSales: 0, lowStock: [], agingBatches: [] }, error: null }
  }

  const [productsRes, purchasesRes, salesRes] = await Promise.all([
    supabase.from('fm_products').select('id, name, unit, low_stock_threshold').eq('is_active', true),
    supabase.from('fm_purchases').select('id, product_id, quantity, total_price, purchase_date, status'),
    supabase.from('fm_sales').select('id, purchase_id, quantity, sale_price, sale_date, status'),
  ])

  const products = productsRes.data || []
  const purchases = purchasesRes.data || []
  const sales = salesRes.data || []

  // Active batches (not ausverkauft/storniert)
  const activeBatches = purchases.filter((p) => !['ausverkauft', 'storniert', 'reklamation'].includes(p.status))
  const totalActiveBatches = activeBatches.length

  // Lagerwert (remaining stock * price per unit)
  let lagerwert = 0
  activeBatches.forEach((p) => {
    const pSales = sales.filter((s) => s.purchase_id === p.id)
    const metrics = computePurchaseMetrics(p, pSales)
    lagerwert += metrics.remaining * metrics.pricePerUnit
  })

  // Monthly profit (current month sales)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  let monthlyProfit = 0
  const monthlySales = sales.filter((s) => s.sale_date >= monthStart)
  monthlySales.forEach((s) => {
    const purchase = purchases.find((p) => p.id === s.purchase_id)
    if (purchase) {
      const ppu = parseFloat(purchase.total_price) / parseFloat(purchase.quantity)
      monthlyProfit += parseFloat(s.sale_price) - (parseFloat(s.quantity) * ppu)
    }
  })

  // Open sales count
  const openSales = sales.filter((s) => s.status === 'offen').length

  // Low stock warnings
  const lowStock = []
  products.forEach((prod) => {
    if (!prod.low_stock_threshold) return
    const prodPurchases = purchases.filter((p) => p.product_id === prod.id && !['ausverkauft', 'storniert', 'reklamation'].includes(p.status))
    const totalRemaining = prodPurchases.reduce((sum, p) => {
      const pSales = sales.filter((s) => s.purchase_id === p.id)
      return sum + computePurchaseMetrics(p, pSales).remaining
    }, 0)
    if (totalRemaining < prod.low_stock_threshold) {
      lowStock.push({ ...prod, remaining: totalRemaining })
    }
  })

  // Aging batches (> 6 months old, still active)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const agingBatches = activeBatches.filter((p) => p.purchase_date < sixMonthsAgo)

  return {
    data: {
      totalProducts: products.length,
      totalActiveBatches,
      lagerwert,
      monthlyProfit,
      openSales,
      lowStock,
      agingBatches,
    },
    error: null,
  }
}
