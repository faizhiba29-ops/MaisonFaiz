// Export Excel des commandes : un fichier « livraison » à importer chez le transporteur
// (Sendit, Ozon Express, Cathedis, Amana…) et un fichier « détaillé » pour la comptabilité.

const HEADER = { fontWeight: 'bold', backgroundColor: '#F3EDE2', borderColor: '#D9C3A0', borderStyle: 'thin' }

/** 0612345678 : format attendu par les transporteurs marocains (212…, +212…, 00212… → 0…) */
export function localPhone(p) {
  let d = String(p || '').replace(/\D/g, '')
  if (d.startsWith('00212')) d = d.slice(5)
  else if (d.startsWith('212')) d = d.slice(3)
  if (d.length === 9 && /^[5-7]/.test(d)) d = `0${d}`
  return d
}

const lineLabel = (l) => `${l.qty > 1 ? `${l.qty} × ` : ''}${l.type === 'pack' || !l.weight ? l.name : `${l.weight} ${l.name}`}`
const productsText = (o) => (o.items || []).map(lineLabel).join(' + ')
const itemCount = (o) => (o.items || []).reduce((n, l) => n + Number(l.qty || 1), 0)
const ref = (o) => `MF-${o.number}`
const money = (v) => ({ value: Number(v || 0), type: Number, format: '#,##0.00' })
const text = (v) => ({ value: v == null ? '' : String(v), type: String, format: '@' })
const date = (v) => ({ value: new Date(v), type: Date, format: 'dd/mm/yyyy hh:mm' })

const FORMATS = {
  livraison: {
    sheet: 'Colis',
    columns: [
      ['Référence', 12, (o) => text(ref(o))],
      ['Nom du destinataire', 24, (o) => text(o.customer_name)],
      ['Téléphone', 14, (o) => text(localPhone(o.phone))],
      ['Ville', 16, (o) => text(o.city)],
      ['Adresse', 40, (o) => text(o.address)],
      ['Montant à encaisser (DH)', 14, (o) => money(o.total)],
      ['Produits', 44, (o) => text(productsText(o))],
      ["Nombre d'articles", 10, (o) => ({ value: itemCount(o), type: Number })],
      ['Commentaire', 30, (o) => text(o.note)],
      ['Date de commande', 17, (o) => date(o.created_at)],
    ],
  },
  detaille: {
    sheet: 'Commandes',
    columns: [
      ['N°', 8, (o) => ({ value: Number(o.number), type: Number })],
      ['Date', 17, (o) => date(o.created_at)],
      ['Statut', 14, (o, st) => text(st(o.status))],
      ['Client', 24, (o) => text(o.customer_name)],
      ['Téléphone', 14, (o) => text(localPhone(o.phone))],
      ['Ville', 16, (o) => text(o.city)],
      ['Adresse', 36, (o) => text(o.address)],
      ['Articles', 44, (o) => text(productsText(o))],
      ['Sous-total (DH)', 12, (o) => money(o.subtotal)],
      ['Remise (DH)', 11, (o) => money(o.discount)],
      ['Code promo', 13, (o) => text(o.promo_code)],
      ['Livraison (DH)', 12, (o) => money(o.delivery_fee)],
      ['Total (DH)', 12, (o) => money(o.total)],
      ['Remarque client', 30, (o) => text(o.note)],
      ['Note interne', 30, (o) => text(o.admin_note)],
    ],
  },
}

/** Génère et télécharge le fichier .xlsx des commandes données (déjà triées). */
export async function exportOrders(orders, kind, statusLabel = (s) => s) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const f = FORMATS[kind]
  const header = f.columns.map(([label]) => ({ value: label, ...HEADER }))
  const rows = orders.map((o) => f.columns.map(([, , cell]) => cell(o, statusLabel)))
  if (kind === 'livraison') {
    const total = orders.reduce((n, o) => n + Number(o.total || 0), 0)
    rows.push([], [{ value: `${orders.length} colis`, fontWeight: 'bold' }, null, null, null,
      { value: 'Total à encaisser', fontWeight: 'bold', align: 'right' }, { ...money(total), fontWeight: 'bold' }])
  }
  const day = new Date().toISOString().slice(0, 10)
  await writeExcelFile([header, ...rows], {
    sheet: f.sheet,
    columns: f.columns.map(([, width]) => ({ width })),
    stickyRowsCount: 1,
    fontFamily: 'Calibri',
    fontSize: 11,
  }).toFile(`maison-faiz-${kind === 'livraison' ? 'livraison' : 'commandes'}-${day}.xlsx`)
}
