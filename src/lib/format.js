/** Formats proposés par défaut pour un nouveau produit */
export const WEIGHTS = ['250g', '500g', '1kg']

/** Colonnes de la grille produits : évite un produit seul sur la dernière ligne. */
export function gridColsClass(n) {
  if (n % 4 === 1 && n % 5 !== 1) return 'md:grid-cols-3 lg:grid-cols-5'
  return 'md:grid-cols-3 lg:grid-cols-4'
}

export function formatDH(n) {
  const v = Number(n || 0)
  return `${v.toFixed(2)} DH`
}

/** "110 DH" — version courte pour les messages WhatsApp */
export function shortDH(n) {
  const v = Math.round(Number(n || 0) * 100) / 100
  return `${Number.isInteger(v) ? v : v.toFixed(2)} DH`
}

export function slugify(s = '') {
  return s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatDate(d, withTime = true) {
  if (!d) return ''
  return new Date(d).toLocaleString('fr-MA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

/** Grammes lus dans un libellé de format (« 250g », « Pot 1 kg »…), sinon null. */
export function gramsOf(label = '') {
  const m = String(label).match(/(\d+(?:[.,]\d+)?)\s*(kg|g)\b/i)
  if (!m) return null
  const n = Number(m[1].replace(',', '.'))
  return m[2].toLowerCase() === 'kg' ? n * 1000 : n
}

/**
 * Formats d'un produit, triés : `prices` = { "<libellé>": { price, on, sort } }.
 * Ordre : `sort` s'il existe, sinon les grammes, sinon le prix.
 */
export function formatsOf(product) {
  return Object.entries(product?.prices || {})
    .map(([label, f]) => ({ label, price: f?.price == null || f.price === '' ? null : Number(f.price), on: Boolean(f?.on), sort: f?.sort }))
    .sort((a, b) => (a.sort ?? 1e9) - (b.sort ?? 1e9) || (gramsOf(a.label) ?? 1e9) - (gramsOf(b.label) ?? 1e9) || (a.price ?? 0) - (b.price ?? 0))
}

/** Formats en vente (actifs et avec un prix), dans l'ordre d'affichage */
export function activeWeights(product) {
  return formatsOf(product).filter((f) => f.on && f.price != null && f.price > 0).map((f) => f.label)
}

export function priceFor(product, weight) {
  return Number(product?.prices?.[weight]?.price ?? 0)
}

/** Économie sur le plus grand format, comparé au plus petit format multiplié (si les grammes sont connus). */
export function bulkSaving(product) {
  const ws = activeWeights(product)
  if (ws.length < 2) return null
  const small = ws[0]
  const big = ws[ws.length - 1]
  const gs = gramsOf(small), gb = gramsOf(big)
  if (!gs || !gb || gb <= gs) return null
  const reference = priceFor(product, small) * (gb / gs)
  const actual = priceFor(product, big)
  return reference > actual ? { weight: big, reference, actual, saved: reference - actual } : null
}
