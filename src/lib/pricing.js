// Affichage des prix promo côté client (le calcul faisant foi est fait par le serveur
// dans les fonctions SQL quote_cart / place_order).

function unitDiscount(promo, base) {
  if (promo.kind === 'percent') return Math.round(base * Math.min(promo.value, 100)) / 100
  return Math.min(promo.value, base)
}

export function promoApplies(promo, kind, id) {
  return (
    promo.target === 'all' ||
    (promo.target === 'products' && kind === 'product' && promo.product_ids?.includes(id)) ||
    (promo.target === 'packs' && kind === 'pack' && promo.pack_ids?.includes(id))
  )
}

/** Meilleure promo automatique (sans code) pour un article. */
export function bestAutoPromo(promos, kind, id, base) {
  let best = null
  for (const p of promos || []) {
    if (!p.is_auto || !promoApplies(p, kind, id)) continue
    const d = unitDiscount(p, base)
    if (!best || d > best.discount) best = { promo: p, discount: d }
  }
  return best
}

/** { price, original|null, promo|null } */
export function displayPrice(promos, kind, id, base) {
  const best = bestAutoPromo(promos, kind, id, base)
  if (!best || best.discount <= 0) return { price: base, original: null, promo: null }
  return { price: Math.max(base - best.discount, 0), original: base, promo: best.promo }
}

export function hasAutoPromo(promos, kind, id) {
  return (promos || []).some((p) => p.is_auto && promoApplies(p, kind, id))
}
