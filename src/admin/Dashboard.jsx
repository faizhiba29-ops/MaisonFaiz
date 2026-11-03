import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { formatDH } from '../lib/format'
import { supabase } from '../lib/supabase'
import { STATUSES } from './Orders'
import { VoteResults } from './Votes'

function Stat({ label, value, sub }) {
  return (
    <div className="bg-white p-5">
      <p className="text-[12px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 font-serif text-[34px] leading-none text-ink">{value}</p>
      {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    Promise.all([
      supabase.from('orders').select('created_at,status,total,items').gte('created_at', since).order('created_at', { ascending: false }),
      supabase.rpc('active_promotions'),
      supabase.from('promotions').select('id,name,code,kind,value,usage_count,usage_limit'),
      supabase.rpc('flavor_results'),
    ]).then(([orders, active, promos, votes]) => {
      setData({
        orders: orders.data || [],
        active: (active.data || []).map((a) => ({ ...a, ...(promos.data || []).find((p) => p.id === a.id) })),
        votes: votes.data || [],
      })
    })
  }, [])

  if (!data) return <p className="text-muted">Chargement…</p>

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const valid = data.orders.filter((o) => o.status !== 'annulee')
  const today = valid.filter((o) => new Date(o.created_at) >= startOfDay)
  const week = valid.filter((o) => new Date(o.created_at) >= weekAgo)
  const pending = data.orders.filter((o) => o.status === 'nouvelle').length
  const sum = (list) => list.reduce((n, o) => n + Number(o.total), 0)

  // Produits les plus commandés sur 30 jours (quantités par produit/pack)
  const top = {}
  for (const o of valid) {
    for (const l of o.items || []) {
      top[l.name] = (top[l.name] || 0) + Number(l.qty || 1)
    }
  }
  const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxTop = topList[0]?.[1] || 1

  return (
    <div>
      <h1 className="mb-6 text-[28px]">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Aujourd'hui" value={today.length} sub={formatDH(sum(today))} />
        <Stat label="7 derniers jours" value={week.length} sub={formatDH(sum(week))} />
        <Stat label="30 jours" value={valid.length} sub={formatDH(sum(valid))} />
        <Link to="/admin/commandes" className="block"><Stat label="À traiter" value={pending} sub={`${STATUSES[0].label}s →`} /></Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="bg-white p-5">
          <h2 className="mb-4 text-[20px]">Les plus commandés (30 jours)</h2>
          {topList.length === 0 ? <p className="text-muted">Pas encore de commandes.</p> : (
            <ul className="space-y-3">
              {topList.map(([name, qty]) => (
                <li key={name}>
                  <div className="flex justify-between text-[14px] text-ink"><span>{name}</span><span>{qty}</span></div>
                  <div className="mt-1 h-2 bg-creme"><div className="h-full bg-chocolat" style={{ width: `${(qty / maxTop) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[20px]">Promos actives</h2>
            <Link to="/admin/promotions" className="text-[13px] underline">Gérer</Link>
          </div>
          {data.active.length === 0 ? <p className="text-muted">Aucune promo active.</p> : (
            <ul className="divide-y divide-line text-[14px]">
              {data.active.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span className="text-ink">{p.name} {p.code && <code className="ml-1 bg-creme px-1">{p.code}</code>}</span>
                  <span>{p.kind === 'percent' ? `-${p.value}%` : `-${p.value} DH`} · {p.usage_count}{p.usage_limit ? `/${p.usage_limit}` : ''} util.</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[20px]">Vote des goûts</h2>
            <Link to="/admin/votes" className="text-[13px] underline">Gérer</Link>
          </div>
          <VoteResults results={data.votes} />
        </section>
      </div>
    </div>
  )
}
