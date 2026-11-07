import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FieldWrap, ImageInput, ImagesInput, LinesInput, ObjectListInput } from './fields'

const SECTIONS = [
  {
    title: 'Contact',
    fields: [
      { key: 'whatsapp_number', label: 'Numéro WhatsApp (format international, sans +)', help: 'Ex. 212618145078 — reçoit les commandes.' },
      { key: 'whatsapp_display', label: 'Numéro affiché', help: 'Ex. 06 18 14 50 78' },
      { key: 'instagram_handle', label: 'Compte Instagram (sans @)' },
      { key: 'instagram_url', label: 'Lien Instagram' },
      { key: 'city', label: 'Ville' },
    ],
  },
  {
    title: 'Bandeau d\'annonce (si aucune promo active)',
    fields: [
      { key: 'announcement_ar', label: 'Texte en arabe', dir: 'rtl' },
      { key: 'announcement_fr', label: 'Texte en français' },
    ],
  },
  {
    title: 'Accueil — Hero',
    fields: [
      { key: 'hero_title', label: 'Titre', full: true },
      { key: 'hero_subtitle', label: 'Sous-titre' },
      { key: 'hero_subtitle_ar', label: 'Petit texte en arabe', dir: 'rtl' },
      { key: 'hero_images', label: 'Photos du hero (carrousel)', type: 'images', full: true, help: 'Format paysage, lumineux. Sans photo, une illustration est affichée.' },
    ],
  },
  {
    title: 'Qui suis-je',
    fields: [
      { key: 'about_title', label: 'Titre' },
      { key: 'about_image', label: 'Photo', type: 'image' },
      { key: 'about_text', label: 'Texte', type: 'textarea', full: true },
    ],
  },
  {
    title: 'Fait maison avec hygiène (étapes)',
    fields: [
      { key: 'hygiene_steps', type: 'objects', full: true, shape: [{ name: 'title', label: 'Titre' }, { name: 'image', label: 'Photo', type: 'image' }, { name: 'text', label: 'Texte', type: 'textarea', full: true }] },
    ],
  },
  {
    title: 'Pourquoi le fait maison ? (page Bienfaits)',
    fields: [
      { key: 'why_homemade', type: 'objects', full: true, shape: [{ name: 'icon', label: 'Emoji' }, { name: 'title', label: 'Titre' }, { name: 'text', label: 'Texte', type: 'textarea', full: true }] },
    ],
  },
  {
    title: 'Comparaison sur l\'accueil',
    fields: [{ key: 'compare_slugs', type: 'compare', full: true }],
  },
  {
    title: 'Instagram — 3 reels à intégrer',
    fields: [{ key: 'reels', type: 'reels', full: true, help: 'Collez le lien du reel (ex. https://www.instagram.com/reel/ABC123/).' }],
  },
  {
    title: 'Livraison',
    fields: [
      {
        key: 'delivery_mode', label: 'La livraison est…', type: 'select', full: true,
        options: [
          ['included', 'Incluse dans le prix (le total affiché est définitif)'],
          ['fixed', 'En plus : frais fixes ajoutés au total'],
          ['on_confirm', 'En plus : frais selon la ville, confirmés sur WhatsApp'],
        ],
        help: 'Appliqué au panier, au message WhatsApp et aux exports. Le total est toujours recalculé par le serveur.',
      },
      { key: 'delivery_fee', label: 'Frais de livraison (DH)', type: 'number', show: (v) => v.delivery_mode === 'fixed' },
      { key: 'free_delivery_from', label: 'Livraison offerte dès (DH, optionnel)', type: 'number', show: (v) => v.delivery_mode === 'fixed' },
      { key: 'delivery_delay', label: 'Délai de livraison' },
      { key: 'delivery_info', label: 'Informations livraison', type: 'textarea', full: true },
    ],
  },
  {
    title: 'Informations légales',
    fields: [
      { key: 'legal_name', label: 'Nom du commerçant / raison sociale' },
      { key: 'legal_form', label: 'Forme juridique', help: 'Ex. auto-entrepreneur, personne physique, SARL…' },
      { key: 'legal_address', label: 'Adresse', full: true },
      { key: 'legal_email', label: 'Email de contact' },
      { key: 'legal_rc', label: 'Registre du commerce (RC)' },
      { key: 'legal_ice', label: 'ICE' },
      { key: 'legal_if', label: 'Identifiant fiscal (IF)' },
      { key: 'legal_cndp', label: 'N° de déclaration CNDP', help: 'Déclaration du fichier clients (loi 09-08), sur cndp.ma.' },
      { key: 'claim_hours', label: 'Délai pour signaler un colis abîmé (heures)', type: 'number' },
    ],
  },
  {
    title: 'Conservation',
    fields: [
      { key: 'shelf_life_weeks', label: 'À consommer dans (semaines)', type: 'number' },
      { key: 'storage_tips', label: 'Conseils (un par ligne)', type: 'lines', full: true },
    ],
  },
  {
    title: 'Référencement',
    fields: [{ key: 'seo_description', label: 'Description Google / partage', type: 'textarea', full: true }],
  },
]

export default function Settings() {
  const [values, setValues] = useState(null)
  const [initial, setInitial] = useState({})
  const [products, setProducts] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    supabase.from('settings').select('key,value').then(({ data }) => {
      const v = Object.fromEntries((data || []).map((r) => [r.key, r.value]))
      setValues(v)
      setInitial(v)
    })
    supabase.from('products').select('slug,name').order('sort_order').then(({ data }) => setProducts(data || []))
  }, [])

  if (!values) return <p className="text-muted">Chargement…</p>

  const set = (k, v) => {
    setValues((x) => ({ ...x, [k]: v }))
    setMsg(null)
  }

  const save = async () => {
    const changed = Object.keys(values).filter((k) => JSON.stringify(values[k]) !== JSON.stringify(initial[k]))
    if (!changed.length) return setMsg({ ok: true, text: 'Rien à enregistrer.' })
    setSaving(true)
    const rows = changed.map((key) => {
      let value = values[key]
      if (Array.isArray(value) && key === 'storage_tips') value = value.map((s) => s.trim()).filter(Boolean)
      return { key, value: value === undefined ? null : value, updated_at: new Date().toISOString() }
    })
    const { error } = await supabase.from('settings').upsert(rows)
    setSaving(false)
    if (error) return setMsg({ ok: false, text: error.message })
    setInitial(values)
    setMsg({ ok: true, text: 'Paramètres enregistrés ✓' })
  }

  const render = (f) => {
    const v = values[f.key]
    switch (f.type) {
      case 'select':
        return (
          <select className="input" value={v ?? ''} onChange={(e) => set(f.key, e.target.value)}>
            {f.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        )
      case 'textarea':
        return <textarea className="input" rows={5} value={v ?? ''} onChange={(e) => set(f.key, e.target.value)} />
      case 'number':
        return <input type="number" className="input" value={v ?? ''} onChange={(e) => set(f.key, e.target.value === '' ? null : Number(e.target.value))} />
      case 'image':
        return <ImageInput value={v} onChange={(x) => set(f.key, x)} folder="site" />
      case 'images':
        return <ImagesInput value={v || []} onChange={(x) => set(f.key, x)} folder="site" />
      case 'lines':
        return <LinesInput value={v || []} onChange={(x) => set(f.key, x)} />
      case 'objects':
        return <ObjectListInput value={v || []} onChange={(x) => set(f.key, x)} shape={f.shape} folder="site" />
      case 'reels':
        return (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <input key={i} className="input" placeholder={`Reel ${i + 1}`} value={(v || [])[i] || ''}
                onChange={(e) => { const next = [...(v || ['', '', ''])]; next[i] = e.target.value.trim(); set(f.key, next) }} />
            ))}
          </div>
        )
      case 'compare':
        return (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((i) => (
              <select key={i} className="input" aria-label={`Produit comparé n°${i + 1}`} value={(v || [])[i] || ''}
                onChange={(e) => { const next = [...(v || ['', ''])]; next[i] = e.target.value; set(f.key, next) }}>
                <option value="">— Produit —</option>
                {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            ))}
          </div>
        )
      default:
        return <input className="input" dir={f.dir} lang={f.dir === 'rtl' ? 'ar' : undefined} value={v ?? ''} onChange={(e) => set(f.key, e.target.value)} />
    }
  }

  return (
    <div className="max-w-[860px]">
      <h1 className="mb-6 text-[28px]">Paramètres du site</h1>
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title} className="bg-white p-4 md:p-6">
            <h2 className="mb-4 text-[20px]">{s.title}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {s.fields.filter((f) => !f.show || f.show(values)).map((f) => (
                <FieldWrap key={f.key} label={f.label} help={f.help} full={f.full}>{render(f)}</FieldWrap>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="sticky bottom-0 mt-6 flex items-center gap-4 bg-admin/95 py-3 backdrop-blur">
        <button className="btn btn-bordeaux" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        {msg && <span className={`text-[14px] ${msg.ok ? 'text-green-700' : 'text-bordeaux'}`}>{msg.text}</span>}
      </div>
    </div>
  )
}
