import { useCallback, useEffect, useMemo, useState } from 'react'
import { WhatsAppIcon } from '../components/Icons'
import { formatDate, formatDH, orderRef } from '../lib/format'
import { supabase } from '../lib/supabase'
import { waLink } from '../lib/whatsapp'
import { exportOrders } from './exportOrders'

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
  const [selected, setSelected] = useState(() => new Set())
  const [busy, setBusy] = useState(null)

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

  // La sélection suit le filtre : on ne garde que les commandes affichées
  useEffect(() => {
    setSelected((sel) => new Set([...sel].filter((id) => orders?.some((o) => o.id === id))))
  }, [orders])

  const picked = useMemo(() => (orders || []).filter((o) => selected.has(o.id)), [orders, selected])
  const allPicked = orders?.length > 0 && picked.length === orders.length
  const toggle = (id) => setSelected((sel) => {
    const next = new Set(sel)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const toggleAll = () => setSelected(allPicked ? new Set() : new Set(orders.map((o) => o.id)))

  const download = async (kind) => {
    setBusy(kind)
    try {
      // Du plus ancien au plus récent : l'ordre de préparation des colis
      await exportOrders([...picked].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), kind, (v) => statusOf(v).label)
    } catch (e) {
      window.alert(`Export impossible : ${e.message}`)
    }
    setBusy(null)
  }

  const bulkStatus = async (status) => {
    if (!status) return
    const label = statusOf(status).label
    if (!window.confirm(`Passer ${picked.length} commande${picked.length > 1 ? 's' : ''} en « ${label} » ?`)) return
    setBusy('status')
    const ids = picked.map((o) => o.id)
    const { error } = await supabase.from('orders').update({ status }).in('id', ids)
    setBusy(null)
    if (error) return window.alert(error.message)
    setOrders((list) => list.map((x) => (ids.includes(x.id) ? { ...x, status } : x)))
  }

  const setStatus = async (o, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', o.id)
    if (error) return window.alert(error.message)
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)))
  }

  const saveNote = async (o, admin_note) => {
    await supabase.from('orders').update({ admin_note }).eq('id', o.id)
  }

  const remove = async (o) => {
    if (!window.confirm(`Supprimer la commande ${orderRef(o)} ? Cette action est définitive.`)) return
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
      {orders?.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px]">
          <label className="inline-flex cursor-pointer items-center gap-2 text-ink">
            <input type="checkbox" className="h-4 w-4 accent-bordeaux" checked={allPicked} onChange={toggleAll} />
            Tout sélectionner ({orders.length})
          </label>
          <span className="text-muted">Astuce : filtrez sur « Confirmée », sélectionnez tout, puis exportez pour le transporteur.</span>
        </div>
      )}
      {picked.length > 0 && (
        <div className="admin-card sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-3 p-3 md:top-2">
          <span className="text-ink">
            <strong>{picked.length}</strong> sélectionnée{picked.length > 1 ? 's' : ''} · {formatDH(picked.reduce((n, o) => n + Number(o.total), 0))} à encaisser
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className="btn btn-bordeaux" disabled={!!busy} onClick={() => download('livraison')}>
              {busy === 'livraison' ? 'Export…' : 'Excel livraison'}
            </button>
            <button className="btn btn-outline bg-white hover:bg-ink" disabled={!!busy} onClick={() => download('detaille')}>
              {busy === 'detaille' ? 'Export…' : 'Excel détaillé'}
            </button>
            <select className="input !min-h-[40px] w-auto" value="" disabled={!!busy} onChange={(e) => bulkStatus(e.target.value)} aria-label="Changer le statut">
              <option value="">Changer le statut…</option>
              {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
            </select>
            <button className="px-2 text-muted underline" onClick={() => setSelected(new Set())}>Annuler</button>
          </div>
        </div>
      )}
      {!orders ? <p className="text-muted">Chargement…</p> : orders.length === 0 ? (
        <p className="bg-white p-6 text-muted">Aucune commande.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => {
            const st = statusOf(o.status)
            const expanded = open === o.id
            return (
              <li key={o.id} className={`bg-white ${selected.has(o.id) ? 'ring-2 ring-bordeaux/40' : ''}`}>
                <div className="flex items-start">
                <label className="flex cursor-pointer items-center self-stretch pl-4" aria-label={`Sélectionner la commande ${orderRef(o)}`}>
                  <input type="checkbox" className="h-4 w-4 accent-bordeaux" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                </label>
                <button className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left" onClick={() => setOpen(expanded ? null : o.id)}>
                  <span className="font-mono text-[15px] tracking-tight text-ink">{orderRef(o)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] ${st.cls}`}>{st.label}</span>
                  <span className="text-[13px] text-muted">{formatDate(o.created_at)}</span>
                  <span className="w-full text-ink md:w-auto">{o.customer_name} · {o.city}</span>
                  <span className="price ml-auto">{formatDH(o.total)}</span>
                </button>
                </div>
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
                      <a href={waLink(intlPhone(o.phone), `Salam ${o.customer_name}, c'est Hiba de Maison Faiz, concernant votre commande ${orderRef(o)} : `)}
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
