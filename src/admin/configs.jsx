import { Stars } from '../components/Icons'
import { formatDate, formatDH, formatsOf } from '../lib/format'
import { THEME_OPTIONS } from '../lib/themes'
import { Thumb, YesNo } from './CrudPage'

const productLookup = { table: 'products', label: 'name', order: 'sort_order' }

export const products = {
  table: 'products',
  title: 'Produits',
  singular: 'produit',
  folder: 'products',
  slugFrom: 'name',
  order: [['sort_order', true], ['created_at', true]],
  lookups: {
    ingredients: { table: 'ingredients', label: (r) => `${r.icon || ''} ${r.name_fr}`, order: 'sort_order' },
    categories: { table: 'categories', label: 'name', value: 'slug', order: 'sort_order' },
  },
  defaults: {
    name: '', slug: '', name_ar: '', description: '', category: 'granola', images: [], conservation: '',
    prices: { '250g': { price: 55, on: true, sort: 0 }, '500g': { price: 110, on: true, sort: 1 }, '1kg': { price: 200, on: true, sort: 2 } },
    ingredient_ids: [], is_new: false, is_bestseller: false, available: true, visible: true,
    sort_order: 0, theme: 'kraft', overlay_text: '', taste: '', main_ingredients: '', best_moment: '',
  },
  columns: [
    { label: 'Produit', render: (r, ctx) => <div className="flex items-center gap-3"><Thumb src={r.images?.[0]} /><div><p className="text-ink">{r.name}</p><p className="text-[12px] text-muted">{ctx.options.categories?.find((c) => c.value === r.category)?.label || r.category} · /{r.slug}</p></div></div> },
    { label: 'Prix', render: (r) => <span className="text-[13px]">{formatsOf(r).filter((f) => f.on && f.price).map((f) => `${f.label} ${f.price} DH`).join(' · ') || 'Prix à définir'}</span> },
    { label: 'Badges', render: (r) => <span className="text-[13px]">{[r.is_new && 'Nouveau', r.is_bestseller && 'Best-seller'].filter(Boolean).join(', ') || '—'}</span> },
    { label: 'Dispo', render: (r, ctx) => <YesNo row={r} col="available" ctx={ctx} /> },
    { label: 'Visible', render: (r, ctx) => <YesNo row={r} col="visible" ctx={ctx} /> },
  ],
  fields: [
    { name: 'name', label: 'Nom', required: true },
    { name: 'slug', label: 'Slug (URL)', help: 'Généré automatiquement depuis le nom. Ex. granola-chocolat' },
    { name: 'name_ar', label: 'Nom en arabe', dir: 'rtl' },
    { name: 'category', label: 'Catégorie', type: 'select', optionsKey: 'categories', help: 'Les catégories se gèrent dans Catalogue → Catégories.' },
    { name: 'description', label: 'Description', type: 'textarea', full: true },
    { name: 'images', label: 'Photos', type: 'images', full: true, help: 'La 1re photo est la principale ; la 2e apparaît au survol. Format carré conseillé.' },
    { name: 'prices', label: 'Formats et prix', type: 'prices', full: true, help: 'Ex. 250g / 500g / 1kg, ou « Pot 250g ». Mettez un poids dans le libellé (250g, 1kg) pour afficher l’économie sur le grand format.' },
    { name: 'ingredient_ids', label: 'Ingrédients', type: 'multiselect', optionsKey: 'ingredients', full: true },
    { name: 'is_new', label: 'Badge « Nouveau »', type: 'checkbox' },
    { name: 'is_bestseller', label: 'Badge « Best-seller »', type: 'checkbox' },
    { name: 'available', label: 'Disponible (sinon « Bientôt disponible »)', type: 'checkbox' },
    { name: 'visible', label: 'Visible sur le site', type: 'checkbox', help: 'Décoché = produit préparé mais caché aux clients.' },
    { name: 'sort_order', label: "Ordre d'affichage", type: 'number', step: 1 },
    { name: 'theme', label: 'Couleur de fond du visuel', type: 'select', options: THEME_OPTIONS },
    { name: 'overlay_text', label: 'Texte incrusté sur la photo', placeholder: '100% FAIT MAISON', full: true },
    { name: 'taste', label: 'Comparaison — goût' },
    { name: 'main_ingredients', label: 'Comparaison — ingrédients principaux' },
    { name: 'best_moment', label: 'Comparaison — moment idéal', full: true },
    { name: 'conservation', label: 'Conservation (optionnel)', type: 'textarea', rows: 2, full: true, help: 'Laissez vide pour les granolas : le texte des Paramètres est utilisé.' },
  ],
  // Le formulaire manipule une liste ordonnée ; la base garde un objet { libellé: { price, on, sort } }
  load: (r) => ({ ...r, prices: formatsOf(r).map(({ label, price, on }) => ({ label, price, on })) }),
  validate: (r) => {
    const list = (r.prices || []).filter((f) => f.label?.trim() || f.price != null)
    if (list.some((f) => !f.label?.trim())) return 'Chaque format doit avoir un nom (ex. 250g).'
    const labels = list.map((f) => f.label.trim().toLowerCase())
    if (new Set(labels).size !== labels.length) return 'Deux formats portent le même nom.'
    if (r.visible && r.available && !list.some((f) => f.on && f.price > 0)) return 'Un produit visible et disponible doit avoir au moins un format en vente avec un prix.'
    return null
  },
  prepare: (r) => ({
    ...r,
    conservation: r.conservation?.trim() || null,
    prices: Object.fromEntries((r.prices || []).filter((f) => f.label?.trim()).map((f, i) => [f.label.trim(), { price: f.price, on: Boolean(f.on), sort: i }])),
  }),
}

export const categories = {
  table: 'categories',
  title: 'Catégories',
  singular: 'catégorie',
  folder: 'categories',
  slugFrom: 'name',
  order: [['sort_order', true], ['name', true]],
  intro: "Une catégorie apparaît dans la boutique (onglet et page) dès qu'elle contient au moins un produit visible.",
  defaults: { name: '', slug: '', description: '', sort_order: 0 },
  columns: [
    { label: 'Catégorie', render: (r) => <div><p className="text-ink">{r.name}</p><p className="text-[12px] text-muted">/boutique/{r.slug}</p></div> },
    { label: 'Description', render: (r) => <span className="line-clamp-2 max-w-[420px] text-[13px]">{r.description || '—'}</span> },
    { label: 'Ordre', render: (r) => r.sort_order },
  ],
  fields: [
    { name: 'name', label: 'Nom', required: true, placeholder: 'Pâtes à tartiner' },
    { name: 'slug', label: 'Slug (URL)', help: 'Ne le changez plus une fois la page partagée.' },
    { name: 'description', label: "Phrase d'introduction", type: 'textarea', rows: 2, full: true },
    { name: 'sort_order', label: "Ordre d'affichage", type: 'number', step: 1 },
  ],
}

export const packs = {
  table: 'packs',
  title: 'Packs',
  singular: 'pack',
  folder: 'packs',
  slugFrom: 'name',
  order: [['sort_order', true], ['created_at', true]],
  lookups: { products: productLookup },
  defaults: { name: '', slug: '', description: '', image: '', items: [], price: 95, available: true, visible: true, sort_order: 0, theme: 'bordeaux' },
  columns: [
    { label: 'Pack', render: (r) => <div className="flex items-center gap-3"><Thumb src={r.image} /><span className="text-ink">{r.name}</span></div> },
    { label: 'Contenu', render: (r, ctx) => <span className="text-[13px]">{(r.items || []).map((it) => `${it.weight} ${ctx.options.products?.find((p) => p.value === it.product_id)?.label || '?'}`).join(' + ')}</span> },
    { label: 'Prix', render: (r) => formatDH(r.price) },
    { label: 'Dispo', render: (r, ctx) => <YesNo row={r} col="available" ctx={ctx} /> },
  ],
  fields: [
    { name: 'name', label: 'Nom', required: true },
    { name: 'slug', label: 'Slug' },
    { name: 'description', label: 'Description', type: 'textarea', full: true },
    { name: 'image', label: 'Photo', type: 'image', full: true },
    { name: 'items', label: 'Produits inclus', type: 'packItems', optionsKey: 'products', full: true },
    { name: 'price', label: 'Prix du pack (DH)', type: 'number', required: true, min: 0 },
    { name: 'theme', label: 'Couleur de fond', type: 'select', options: THEME_OPTIONS },
    { name: 'available', label: 'Disponible', type: 'checkbox' },
    { name: 'visible', label: 'Visible sur le site', type: 'checkbox', help: 'Décoché = produit préparé mais caché aux clients.' },
    { name: 'sort_order', label: "Ordre d'affichage", type: 'number', step: 1 },
  ],
  prepare: (r) => ({ ...r, items: (r.items || []).filter((it) => it.product_id) }),
}

const now = new Date()
const promoState = (r) => {
  if (!r.active) return ['Désactivée', 'bg-neutral-200 text-neutral-600']
  if (r.starts_at && new Date(r.starts_at) > now) return ['Programmée', 'bg-amber-100 text-amber-800']
  if (r.ends_at && new Date(r.ends_at) < now) return ['Terminée', 'bg-neutral-200 text-neutral-600']
  if (r.usage_limit && r.usage_count >= r.usage_limit) return ['Limite atteinte', 'bg-neutral-200 text-neutral-600']
  return ['Active', 'bg-green-100 text-green-800']
}

export const promotions = {
  table: 'promotions',
  title: 'Promotions',
  singular: 'promotion',
  order: [['created_at', false]],
  intro: 'Sans code, la promo s\'applique automatiquement (prix barrés sur le site). Avec un code, le client le saisit dans son panier. Le texte de bannière s\'affiche en haut du site tant que la promo est active.',
  lookups: { products: productLookup, packs: { table: 'packs', label: 'name', order: 'sort_order' } },
  defaults: { name: '', kind: 'percent', value: 10, target: 'all', product_ids: [], pack_ids: [], code: '', starts_at: null, ends_at: null, active: true, banner_text: '', usage_limit: null },
  columns: [
    { label: 'Promotion', render: (r) => <div><p className="text-ink">{r.name}</p><p className="text-[12px] text-muted">{r.banner_text}</p></div> },
    { label: 'Remise', render: (r) => (r.kind === 'percent' ? `-${r.value}%` : `-${r.value} DH`) },
    { label: 'Code', render: (r) => (r.code ? <code className="bg-creme px-1.5">{r.code}</code> : <span className="text-[12px] text-muted">Automatique</span>) },
    { label: 'Période', render: (r) => <span className="text-[12px]">{r.starts_at ? formatDate(r.starts_at, false) : '…'} → {r.ends_at ? formatDate(r.ends_at, false) : '…'}</span> },
    { label: 'Utilisations', render: (r) => <span className="text-[13px]">{r.usage_count}{r.usage_limit ? ` / ${r.usage_limit}` : ''}</span> },
    { label: 'État', render: (r, ctx) => { const [l, c] = promoState(r); return <button onClick={() => ctx.toggle(r, 'active')} className={`rounded-full px-2.5 py-0.5 text-[12px] ${c}`} title="Activer / désactiver">{l}</button> } },
  ],
  fields: [
    { name: 'name', label: 'Nom interne', required: true, placeholder: 'Week-end Ferrero' },
    { name: 'kind', label: 'Type', type: 'select', options: [{ value: 'percent', label: 'Pourcentage (%)' }, { value: 'fixed', label: 'Montant fixe (DH)' }] },
    { name: 'value', label: 'Valeur', type: 'number', required: true, min: 0, help: 'Ex. 15 pour -15% ou -15 DH. Un montant fixe s\'applique par article (ou une fois sur la commande si la cible est « tout le site » avec un code).' },
    { name: 'target', label: 'Cible', type: 'select', options: [{ value: 'all', label: 'Tout le site' }, { value: 'products', label: 'Un ou plusieurs produits' }, { value: 'packs', label: 'Un ou plusieurs packs' }] },
    { name: 'product_ids', label: 'Produits concernés', type: 'multiselect', optionsKey: 'products', full: true, show: (r) => r.target === 'products' },
    { name: 'pack_ids', label: 'Packs concernés', type: 'multiselect', optionsKey: 'packs', full: true, show: (r) => r.target === 'packs' },
    { name: 'code', label: 'Code promo (optionnel)', placeholder: 'HIBA15', help: 'Laisser vide = appliquée automatiquement à tout le monde.' },
    { name: 'usage_limit', label: "Limite d'utilisation (optionnel)", type: 'number', min: 1, step: 1, help: 'Nombre maximum de commandes.' },
    { name: 'starts_at', label: 'Début', type: 'datetime' },
    { name: 'ends_at', label: 'Fin', type: 'datetime' },
    { name: 'banner_text', label: 'Texte de la bannière', full: true, placeholder: '🎉 -15% sur le Ferrero Rocher ce week-end !' },
    { name: 'active', label: 'Active', type: 'checkbox' },
  ],
  validate: (r) => {
    if (r.value <= 0) return 'La valeur doit être positive.'
    if (r.kind === 'percent' && r.value > 100) return 'Un pourcentage ne peut pas dépasser 100.'
    if (r.target === 'products' && !r.product_ids?.length) return 'Choisissez au moins un produit.'
    if (r.target === 'packs' && !r.pack_ids?.length) return 'Choisissez au moins un pack.'
    if (r.starts_at && r.ends_at && new Date(r.ends_at) < new Date(r.starts_at)) return 'La date de fin est avant la date de début.'
    return null
  },
  prepare: (r) => ({ ...r, code: r.code?.trim().toUpperCase() || null, banner_text: r.banner_text?.trim() || null }),
}

export const ingredients = {
  table: 'ingredients',
  title: 'Ingrédients & bienfaits',
  singular: 'ingrédient',
  folder: 'ingredients',
  slugFrom: 'name_fr',
  order: [['sort_order', true], ['name_fr', true]],
  defaults: { name_fr: '', name_ar: '', slug: '', icon: '', image: '', benefits: '', allergen: false, sort_order: 0 },
  columns: [
    { label: 'Ingrédient', render: (r) => <span className="text-ink">{r.icon} {r.name_fr} <span lang="ar" className="ml-2 text-bordeaux">{r.name_ar}</span></span> },
    { label: 'Bienfaits', render: (r) => <span className="line-clamp-2 max-w-[380px] text-[13px]">{r.benefits}</span> },
    { label: 'Allergène', render: (r, ctx) => <YesNo row={r} col="allergen" ctx={ctx} /> },
  ],
  fields: [
    { name: 'name_fr', label: 'Nom (FR)', required: true },
    { name: 'name_ar', label: 'Nom (arabe)', dir: 'rtl' },
    { name: 'slug', label: 'Slug', help: 'Utilisé pour les liens depuis les fiches produits.' },
    { name: 'icon', label: 'Icône (emoji)', placeholder: '🌰' },
    { name: 'image', label: 'Photo (optionnel, remplace l\'icône)', type: 'image', full: true },
    { name: 'benefits', label: 'Bienfaits', type: 'textarea', full: true, rows: 3 },
    { name: 'allergen', label: 'Allergène', type: 'checkbox' },
    { name: 'sort_order', label: "Ordre d'affichage", type: 'number', step: 1 },
  ],
}

export const recipes = {
  table: 'recipes',
  title: 'Recettes « Comment le déguster »',
  singular: 'recette',
  folder: 'recipes',
  order: [['sort_order', true], ['created_at', true]],
  defaults: { title: '', image: '', prep_time: '', ingredients: [], steps: [], theme: 'creme', visible: true, sort_order: 0 },
  columns: [
    { label: 'Recette', render: (r) => <div className="flex items-center gap-3"><Thumb src={r.image} /><span className="text-ink">{r.title}</span></div> },
    { label: 'Temps', render: (r) => r.prep_time },
    { label: 'Étapes', render: (r) => r.steps?.length || 0 },
    { label: 'Visible', render: (r, ctx) => <YesNo row={r} col="visible" ctx={ctx} /> },
  ],
  fields: [
    { name: 'title', label: 'Titre', required: true },
    { name: 'prep_time', label: 'Temps de préparation', placeholder: '5 min' },
    { name: 'image', label: 'Photo', type: 'image', full: true },
    { name: 'ingredients', label: 'Ingrédients (un par ligne)', type: 'lines', full: true },
    { name: 'steps', label: 'Étapes (une par ligne)', type: 'lines', full: true },
    { name: 'theme', label: 'Couleur de fond (sans photo)', type: 'select', options: THEME_OPTIONS },
    { name: 'sort_order', label: "Ordre d'affichage", type: 'number', step: 1 },
    { name: 'visible', label: 'Visible', type: 'checkbox' },
  ],
}

export const reviews = {
  table: 'reviews',
  title: 'Avis clients',
  singular: 'avis',
  folder: 'reviews',
  order: [['sort_order', true], ['created_at', false]],
  intro: 'Ajoutez les avis reçus sur Instagram ou WhatsApp. Une capture d\'écran peut être jointe. La section se masque s\'il n\'y a aucun avis visible.',
  defaults: { name: '', city: '', text: '', rating: 5, image: '', visible: true, sort_order: 0 },
  columns: [
    { label: 'Client', render: (r) => <div><p className="text-ink">{r.name}{r.city ? ` · ${r.city}` : ''}</p><Stars value={r.rating} className="text-bordeaux" /></div> },
    { label: 'Avis', render: (r) => <span className="line-clamp-2 max-w-[420px] text-[13px]">{r.text}</span> },
    { label: 'Visible', render: (r, ctx) => <YesNo row={r} col="visible" ctx={ctx} /> },
  ],
  fields: [
    { name: 'name', label: 'Nom / prénom', required: true },
    { name: 'city', label: 'Ville' },
    { name: 'text', label: 'Avis', type: 'textarea', required: true, full: true },
    { name: 'rating', label: 'Note', type: 'select', options: [5, 4, 3, 2, 1].map((n) => ({ value: n, label: '★'.repeat(n) })) },
    { name: 'image', label: 'Photo / capture (optionnel)', type: 'image' },
    { name: 'sort_order', label: "Ordre d'affichage", type: 'number', step: 1 },
    { name: 'visible', label: 'Visible', type: 'checkbox' },
  ],
  prepare: (r) => ({ ...r, rating: Number(r.rating) }),
}

export const faqs = {
  table: 'faqs',
  title: 'FAQ',
  singular: 'question',
  order: [['sort_order', true], ['created_at', true]],
  defaults: { question: '', answer: '', sort_order: 0 },
  columns: [
    { label: 'Question', render: (r) => <span className="text-ink">{r.question}</span> },
    { label: 'Ordre', render: (r) => r.sort_order },
  ],
  fields: [
    { name: 'question', label: 'Question', required: true, full: true },
    { name: 'answer', label: 'Réponse', type: 'textarea', required: true, full: true, rows: 5 },
    { name: 'sort_order', label: 'Ordre', type: 'number', step: 1 },
  ],
}
