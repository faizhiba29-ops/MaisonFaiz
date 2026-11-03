import { supabase } from './supabase'

/** Redimensionne (max 1600px) et convertit en WebP avant l'envoi, pour des pages rapides. */
async function compress(file, maxSize = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality))
    return blob && blob.size < file.size ? new File([blob], 'image.webp', { type: 'image/webp' }) : file
  } catch {
    return file
  }
}

export async function uploadImage(file, folder = 'misc') {
  const f = await compress(file)
  const ext = f.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('images').upload(path, f, {
    cacheControl: '31536000',
    contentType: f.type,
  })
  if (error) throw error
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}
