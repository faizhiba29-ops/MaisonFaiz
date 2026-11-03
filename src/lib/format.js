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

/** Poids actifs d'un produit, dans l'ordre 250g → 1kg */
export function activeWeights(product) {
  return WEIGHTS.filter((w) => product?.prices?.[w]?.on && product.prices[w].price != null)
}

export function priceFor(product, weight) {
  return Number(product?.prices?.[weight]?.price ?? 0)
}

/** Économie sur le plus gros poids, comparé au plus petit poids actif multiplié. */
export function bulkSaving(product) {
  const ws = activeWeights(product)
  if (ws.length < 2) return null
  const grams = { '250g': 250, '500g': 500, '1kg': 1000 }
  const small = ws[0]
  const big = ws[ws.length - 1]
  const reference = priceFor(product, small) * (grams[big] / grams[small])
  const actual = priceFor(product, big)
  return reference > actual ? { weight: big, reference, actual, saved: reference - actual } : null
}
