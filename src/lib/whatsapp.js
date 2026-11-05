import { shortDH } from './format'
import { deliveryLine, totalIsFinal } from './delivery'

export function waLink(number, text = '') {
  const n = String(number || '').replace(/\D/g, '')
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** « 06 12 34 56 78 » : numéro marocain lisible (212…, +212… → 0…) */
export function prettyPhone(p) {
  let d = String(p || '').replace(/\D/g, '')
  if (d.startsWith('00212')) d = d.slice(5)
  else if (d.startsWith('212')) d = d.slice(3)
  if (d.length === 9 && /^[5-7]/.test(d)) d = `0${d}`
  return d.length === 10 ? d.replace(/(\d{2})(?=\d)/g, '$1 ') : String(p || '').trim()
}

const clean = (v) => String(v || '').replace(/[*_~]/g, '').trim() // évite de casser la mise en forme WhatsApp

/**
 * Message pré-rempli envoyé à la boutique, construit à partir du devis serveur.
 * Mise en forme WhatsApp : *gras*, une info par ligne, lisible d'un coup d'œil sur téléphone.
 * Pas d'emoji : WhatsApp Web / Desktop les affiche parfois en « � » quand ils passent par un lien wa.me.
 */
export function buildOrderMessage(quote, customer, orderNumber) {
  const out = ['Salam Hiba,', 'Je voudrais passer une commande chez *Maison Faiz* :', '']

  out.push(orderNumber ? `*COMMANDE ${/^MF-/.test(orderNumber) ? orderNumber : `N°${orderNumber}`}*` : '*MA COMMANDE*')
  for (const l of quote.lines) {
    const qty = l.qty > 1 ? `${l.qty} × ` : ''
    const format = l.type !== 'pack' && l.weight ? ` (${l.weight})` : ''
    out.push(`- ${qty}${l.name}${format} : ${shortDH(l.line_total)}`)
  }
  out.push('')

  const mode = quote.delivery_mode || (Number(quote.delivery_fee) > 0 ? 'fixed' : 'on_confirm')
  const hasDiscount = quote.code?.status === 'ok' && Number(quote.discount) > 0
  const hasFee = Number(quote.delivery_fee) > 0
  if (hasDiscount || hasFee) out.push(`Sous-total : ${shortDH(quote.subtotal)}`)
  if (hasDiscount) out.push(`Code ${quote.code.code} (${quote.code.label}) : -${shortDH(quote.discount)}`)
  const fee = deliveryLine(mode, quote.delivery_fee)
  out.push(`Livraison : ${/\d/.test(fee) ? fee : fee.toLowerCase()}`)
  out.push(`*Total : ${shortDH(quote.total)}*${totalIsFinal(mode) ? '' : ' (hors livraison)'}`)
  out.push('')

  out.push('*LIVRAISON*')
  out.push(`Nom : ${clean(customer.name)}`)
  out.push(`Téléphone : ${prettyPhone(customer.phone)}`)
  out.push(`Ville : ${clean(customer.city)}`)
  out.push(`Adresse : ${clean(customer.address)}`)
  if (customer.note?.trim()) {
    out.push('')
    out.push(`*Remarque :* ${clean(customer.note)}`)
  }
  out.push('')
  out.push('Merci !')
  return out.join('\n')
}
