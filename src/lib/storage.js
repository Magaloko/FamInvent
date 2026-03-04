import { supabase, isSupabaseConfigured } from './supabase'

const BUCKET = 'family-items'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Nicht unterstütztes Format. Erlaubt: JPG, PNG, WebP, GIF' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Datei zu groß. Maximum: 5MB' }
  }
  return { valid: true, error: null }
}

export function validateReceiptFile(file) {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { valid: false, error: 'Nicht unterstütztes Format. Erlaubt: JPG, PNG, WebP, PDF' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Datei zu groß. Maximum: 5MB' }
  }
  return { valid: true, error: null }
}

export function createPreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

export async function uploadImage(file, folder, itemId) {
  if (!isSupabaseConfigured) {
    const preview = await createPreview(file)
    return { url: preview, storagePath: null, error: null }
  }

  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { url: null, storagePath: null, error: validation.error }
  }

  const ext = file.name.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const path = `${folder}/${itemId}/${timestamp}-${random}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    return { url: null, storagePath: null, error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return { url: publicUrl, storagePath: path, error: null }
}

export async function uploadReceipt(file, itemId) {
  if (!isSupabaseConfigured) {
    const preview = file.type.startsWith('image/') ? await createPreview(file) : null
    return { url: preview, storagePath: null, error: null }
  }

  const validation = validateReceiptFile(file)
  if (!validation.valid) {
    return { url: null, storagePath: null, error: validation.error }
  }

  const ext = file.name.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const path = `receipts/${itemId}/${timestamp}-${random}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    return { url: null, storagePath: null, error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return { url: publicUrl, storagePath: path, error: null }
}

export async function deleteImage(storagePath) {
  if (!isSupabaseConfigured || !storagePath) return

  await supabase.storage.from(BUCKET).remove([storagePath])
}
