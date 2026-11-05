import { shortDH } from './format'

/**
 * Mode de livraison réglé dans l'admin (Paramètres → Livraison) :
 *   included   : incluse dans le prix
 *   fixed      : frais fixes ajoutés au total (option : offerte dès X DH)
 *   on_confirm : frais selon la ville, confirmés sur WhatsApp
 */
export function deliveryMode(settings, quote) {
  const m = quote?.delivery_mode || settings?.delivery_mode
  if (['included', 'fixed', 'on_confirm'].includes(m)) return m
  return Number(settings?.delivery_fee) > 0 ? 'fixed' : 'on_confirm'
}

/** Phrase courte pour la fiche produit */
export function deliveryPromise(settings) {
  const mode = deliveryMode(settings)
  if (mode === 'included') return 'Livraison incluse partout au Maroc'
  if (mode === 'fixed') {
    const free = Number(settings.free_delivery_from) > 0 ? ` · offerte dès ${shortDH(settings.free_delivery_from)}` : ''
    return `Livraison partout au Maroc : ${shortDH(settings.delivery_fee)}${free}`
  }
  return 'Livraison partout au Maroc · frais selon la ville, confirmés sur WhatsApp'
}

/** Valeur de la ligne « Livraison » d'un récapitulatif (panier, message, export) */
export function deliveryLine(mode, fee) {
  if (mode === 'included') return 'Incluse'
  if (mode === 'fixed') return Number(fee) > 0 ? shortDH(fee) : 'Offerte'
  return 'À confirmer'
}

/** Le total est-il définitif (livraison comprise) ? */
export const totalIsFinal = (mode) => mode !== 'on_confirm'
