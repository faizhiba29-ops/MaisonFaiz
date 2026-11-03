import { shortDH } from './format'

export function waLink(number, text = '') {
  const n = String(number || '').replace(/\D/g, '')
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Message pré-rempli envoyé à Hiba, construit à partir du devis serveur. */
export function buildOrderMessage(quote, customer, orderNumber) {
  const lines = quote.lines.map((l) => {
    const qty = l.qty > 1 ? `${l.qty} × ` : ''
    const label = l.type === 'pack' ? l.name : `${l.weight} ${l.name}`
    return `- ${qty}${label} – ${shortDH(l.line_total)}`
  })
  const out = ['Salam Hiba 👋 Je voudrais commander :', ...lines]
  if (quote.code?.status === 'ok' && Number(quote.discount) > 0) {
    out.push(`Code promo : ${quote.code.code} (${quote.code.label})`)
  }
  if (Number(quote.delivery_fee) > 0) out.push(`Livraison : ${shortDH(quote.delivery_fee)}`)
  out.push(`Total : ${shortDH(quote.total)}`)
  out.push('')
  out.push(
    `Nom : ${customer.name} / Ville : ${customer.city} / Adresse : ${customer.address} / Tél : ${customer.phone}`,
  )
  if (customer.note?.trim()) out.push(`Remarque : ${customer.note.trim()}`)
  if (orderNumber) out.push(`(Commande n°${orderNumber})`)
  return out.join('\n')
}
