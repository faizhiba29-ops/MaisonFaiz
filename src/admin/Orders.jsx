import { useCallback, useEffect, useState } from 'react'
import { WhatsAppIcon } from '../components/Icons'
import { formatDate, formatDH } from '../lib/format'
import { supabase } from '../lib/supabase'
import { waLink } from '../lib/whatsapp'

export const STATUSES = [
  { value: 'nouvelle', label: 'Nouvelle', cls: 'bg-bordeaux text-white' },
  { value: 'confirmee', label: 'Confirmée', cls: 'bg-amber-100 text-amber-900' },
  { value: 'preparation', label: 'En préparation', cls: 'bg-orange-100 text-orange-900' },
  { value: 'expediee', label: 'Expédiée', cls: 'bg-sky-100 text-sky-900' },
  { value: 'livree', label: 'Livrée', cls: 'bg-green-100 text-green-800' },
  { value: 'annulee', label: 'Annulée', cls: 'bg-neutral-200 text-neutral-600' },
]
const statusOf = (v) => STATUSES.find((s) => s.value === v) || STATUSES[0]

/** Numéro marocain → format international pour wa.me (06… → 2126…) */
function intlPhone(p) {
  const d = String(p || '').replace(/\D/g, '')
  if (d.startsWith('212')) return d
  if (d.startsWith('0')) return `212${d.slice(1)}`
  return d
}

export default function Orders() {
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    setError(error?.message || null)
    setOrders(data || [])
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (o, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id)
    if (error) return window.alert(error.message)
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)))
  }

  const saveNote = async (o, admin_note) => {
    await supabase.from('orders').update({ admin_note }).eq('id', o.id)
  }

  const remove = async (o) => {
    if (!window.confirm(`Supprimer la commande n°${o.number} ? Cette action est définitive.`)) return
    const { error } = await supabase.from('orders').delete().eq('id', o.id)
    if (error) return window.alert(error.message)
    load()
  }

  return (
    <div>
      <h1 className="mb-4 text-[28px]">Commandes</h1>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {[{ value: 'all', label: 'Toutes' }, ...STATUSES].map((s) => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={`whitespace-nowrap border px-3 py-1.5 text-[13px] ${filter === s.value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'}`}>
            {s.label}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 text-bordeaux">{error}</p>}
      {!orders ? <p className="text-muted">Chargement…</p> : orders.length === 0 ? (
        <p className="bg-white p-6 text-muted">Aucune commande.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => {
            const st = statusOf(o.status)
            const expanded = open === o.id
            return (
              <li key={o.id} className="bg-white">
                <button className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left" onClick={() => setOpen(expanded ? null : o.id)}>
                  <span className="font-serif text-[18px] text-ink">n°{o.number}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] ${st.cls}`}>{st.label}</span>
                  <span className="text-[13px] text-muted">{formatDate(o.created_at)}</span>
                  <span className="w-full text-ink md:w-auto">{o.customer_name} · {o.city}</span>
                  <span className="price ml-auto">{formatDH(o.total)}</span>
                </button>
                {expanded && (
                  <div className="grid gap-6 border-t border-line p-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 font-sans text-[12px] uppercase tracking-widest text-muted">Articles</h3>
                      <ul className="space-y-1 text-[14px]">
                        {(o.items || []).map((l, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span>{l.qty > 1 ? `${l.qty} × ` : ''}{l.type === 'pack' ? l.name : `${l.weight} ${l.name}`}</span>
                            <span>{formatDH(l.line_total)}</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-3 space-y-1 border-t border-line pt-3 text-[14px]">
                        <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatDH(o.subtotal)}</dd></div>
                        {Number(o.discount) > 0 && <div className="flex justify-between text-bordeaux"><dt>Code {o.promo_code}</dt><dd>-{formatDH(o.discount)}</dd></div>}
                        {Number(o.delivery_fee) > 0 && <div className="flex justify-between"><dt>Livraison</dt><dd>{formatDH(o.delivery_fee)}</dd></div>}
                        <div className="flex justify-between text-ink"><dt>Total</dt><dd>{formatDH(o.total)}</dd></div>
                      </dl>
                    </div>
                    <div className="space-y-3 text-[14px]">
                      <h3 className="font-sans text-[12px] uppercase tracking-widest text-muted">Client</h3>
                      <p className="text-ink">{o.customer_name}<br />{o.phone}<br />{o.address}, {o.city}</p>
                      {o.note && <p className="bg-creme p-3">💬 {o.note}</p>}
                      <a href={waLink(intlPhone(o.phone), `Salam ${o.customer_name} 👋 C'est Hiba de Granola by Hiba, concernant votre commande n°${o.number} : `)}
                        target="_blank" rel="noreferrer" className="btn btn-whatsapp min-h-[42px] w-full">
                        <WhatsAppIcon width={18} height={18} /> Écrire au client
                      </a>
                      <label className="block">
                        <span className="label">Statut</span>
                        <select className="input" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="label">Note interne</span>
                        <textarea className="input" rows={2} defaultValue={o.admin_note || ''} onBlur={(e) => saveNote(o, e.target.value)} />
                      </label>
                      <button className="text-[13px] text-bordeaux underline" onClick={() => remove(o)}>Supprimer la commande</button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
