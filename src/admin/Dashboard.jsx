import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from '../components/Icons'
import { formatDate, formatDH } from '../lib/format'
import { supabase } from '../lib/supabase'
import { STATUSES } from './Orders'
import { VoteResults } from './Votes'

const RANGES = [[7, '7 jours'], [30, '30 jours'], [90, '90 jours']]
const DAY = 86400000

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const dayKey = (d) => startOfDay(d).toISOString()
const compact = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : String(Math.round(v)))
const money = (v) => `${String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} DH`
const shortDate = (d) => d.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit' })
const longDate = (d) => d.toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' })

function niceTicks(max) {
  if (max <= 0) return { top: 100, ticks: [0, 25, 50, 75, 100] }
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
  const top = step * Math.ceil(max / step)
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) }
}

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

// ─── Graphique des ventes : colonnes (CA par jour), une seule série ───
function SalesChart({ days }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const H = 240, padL = 44, padR = 4, padT = 20, padB = 28
  const innerW = Math.max(0, width - padL - padR)
  const innerH = H - padT - padB
  const max = Math.max(0, ...days.map((d) => d.revenue))
  const { top, ticks } = niceTicks(max)
  const n = days.length
  const band = n ? innerW / n : 0
  const barW = Math.min(24, Math.max(2, band * 0.62))
  const labelEvery = Math.ceil(n / (width < 520 ? 5 : 7))
  // Une date sur `labelEvery`, plus la dernière ; on saute celle qui la toucherait
  const showLabel = (i) => i === n - 1 || (i % labelEvery === 0 && n - 1 - i >= labelEvery)
  const maxIdx = days.findIndex((d) => d.revenue === max && max > 0)
  const y = (v) => padT + innerH - (v / top) * innerH

  const bar = (d, i) => {
    const h = (d.revenue / top) * innerH
    if (h <= 0) return null
    const x = padL + i * band + (band - barW) / 2
    const r = Math.min(4, barW / 2, h)
    const y0 = padT + innerH
    const path = `M${x} ${y0} V${y0 - h + r} Q${x} ${y0 - h} ${x + r} ${y0 - h} H${x + barW - r} Q${x + barW} ${y0 - h} ${x + barW} ${y0 - h + r} V${y0} Z`
    return <path key={i} d={path} fill="var(--color-chart)" opacity={hover === null || hover === i ? 1 : 0.45} />
  }

  const hd = hover !== null ? days[hover] : null

  return (
    <div ref={ref} className="relative select-none" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label="Chiffre d'affaires par jour">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke="#ECE8E2" strokeWidth="1" />
              <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="rgba(18,18,18,.5)">{compact(t)}</text>
            </g>
          ))}
          {days.map(bar)}
          {maxIdx >= 0 && hover === null && (
            <text x={padL + maxIdx * band + band / 2} y={y(max) - 6} textAnchor="middle" fontSize="11" fill="#121212">{compact(max)}</text>
          )}
          {days.map((d, i) => showLabel(i) && (
            <text key={i} x={padL + i * band + band / 2} y={H - 8} textAnchor={i === n - 1 && i > 0 ? 'end' : 'middle'} fontSize="11" fill="rgba(18,18,18,.5)">{shortDate(d.date)}</text>
          ))}
          {days.map((d, i) => (
            <rect key={i} x={padL + i * band} y={padT} width={band} height={innerH} fill="transparent"
              onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
          ))}
        </svg>
      )}
      {hd && (
        <div className="pointer-events-none absolute z-10 min-w-[140px] -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] shadow-lg"
          style={{ left: Math.min(Math.max(padL + hover * band + band / 2, 70), width - 70), top: Math.max(y(hd.revenue) - 8, 60) }}>
          <p className="capitalize text-muted">{longDate(hd.date)}</p>
          <p className="mt-1 flex items-center gap-2 text-ink"><span className="h-2 w-2 rounded-full bg-chart" />{formatDH(hd.revenue)}</p>
          <p className="text-muted">{hd.orders} commande{hd.orders > 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}

function Delta({ now, before }) {
  if (!before) return <span className="text-[12px] text-muted">pas de période précédente</span>
  const pct = Math.round(((now - before) / before) * 100)
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] ${up ? 'text-green-700' : 'text-red-700'}`}>
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      {up ? '+' : ''}{pct} %<span className="hidden text-muted sm:inline"> vs période précédente</span>
    </span>
  )
}

function Kpi({ label, value, children, to }) {
  const body = (
    <div className="admin-card h-full p-4 transition-colors hover:border-ink/20 sm:p-5">
      <p className="flex items-center justify-between text-[13px] text-muted">
        {label}
        {to && <ArrowUpRight width={16} height={16} />}
      </p>
      <p className="mt-2 whitespace-nowrap text-[22px] font-medium leading-none tracking-tight text-ink tabular-nums sm:text-[28px]">{value}</p>
      <div className="mt-3 min-h-[18px]">{children}</div>
    </div>
  )
  return to ? <Link to={to} className="block">{body}</Link> : body
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`admin-card min-w-0 p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-sans text-[15px] font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const statusOf = (v) => STATUSES.find((s) => s.value === v) || STATUSES[0]

export default function Dashboard() {
  const [range, setRange] = useState(30)
  const [data, setData] = useState(null)
  const [table, setTable] = useState(false)

  useEffect(() => {
    let cancelled = false
    const since = new Date(startOfDay(Date.now()).getTime() - (2 * range - 1) * DAY).toISOString()
    Promise.all([
      supabase.from('orders').select('id,number,created_at,status,total,items,customer_name,city')
        .gte('created_at', since).order('created_at', { ascending: false }).limit(3000),
      supabase.from('orders').select('id,number,created_at,status,total,customer_name,city').order('created_at', { ascending: false }).limit(6),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'nouvelle'),
      supabase.rpc('active_promotions'),
      supabase.from('promotions').select('id,name,code,kind,value,usage_count,usage_limit,ends_at'),
      supabase.rpc('flavor_results'),
    ]).then(([orders, recent, pending, active, promos, votes]) => {
      if (cancelled) return
      setData({
        orders: orders.data || [],
        recent: recent.data || [],
        pending: pending.count || 0,
        active: (active.data || []).map((a) => ({ ...a, ...(promos.data || []).find((p) => p.id === a.id) })),
        votes: votes.data || [],
      })
    })
    return () => { cancelled = true }
  }, [range])

  const stats = useMemo(() => {
    if (!data) return null
    const today = startOfDay(Date.now()).getTime()
    const curStart = today - (range - 1) * DAY
    const prevStart = curStart - range * DAY
    const valid = data.orders.filter((o) => o.status !== 'annulee')
    const cur = valid.filter((o) => new Date(o.created_at).getTime() >= curStart)
    const prev = valid.filter((o) => { const t = new Date(o.created_at).getTime(); return t >= prevStart && t < curStart })
    const sum = (l) => l.reduce((n, o) => n + Number(o.total), 0)

    const byDay = new Map()
    for (let i = 0; i < range; i++) { const d = new Date(curStart + i * DAY); byDay.set(dayKey(d), { date: d, revenue: 0, orders: 0 }) }
    for (const o of cur) { const e = byDay.get(dayKey(o.created_at)); if (e) { e.revenue += Number(o.total); e.orders++ } }

    const top = {}
    for (const o of cur) for (const l of o.items || []) top[l.name] = (top[l.name] || 0) + Number(l.qty || 1)
    const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5)

    const byStatus = STATUSES.map((s) => ({ ...s, count: data.orders.filter((o) => o.status === s.value && new Date(o.created_at).getTime() >= curStart).length }))

    return {
      revenue: sum(cur), prevRevenue: sum(prev), count: cur.length, prevCount: prev.length,
      avg: cur.length ? sum(cur) / cur.length : 0, prevAvg: prev.length ? sum(prev) / prev.length : 0,
      days: [...byDay.values()], topList, byStatus,
    }
  }, [data, range])

  const hello = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] capitalize text-muted">{longDate(new Date())}</p>
          <h1 className="mt-1 font-sans text-[26px] font-medium text-ink">{hello}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-line bg-white p-1" role="group" aria-label="Période">
            {RANGES.map(([v, label]) => (
              <button key={v} onClick={() => setRange(v)} aria-pressed={range === v}
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${range === v ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink'}`}>
                {label}
              </button>
            ))}
          </div>
          <Link to="/admin/produits" className="btn btn-outline bg-white hover:bg-ink">Produits</Link>
          <Link to="/admin/promotions" className="btn btn-bordeaux">Créer une promo</Link>
        </div>
      </div>

      {!stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="admin-card h-[118px] animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Chiffre d'affaires" value={money(stats.revenue)}><Delta now={stats.revenue} before={stats.prevRevenue} /></Kpi>
            <Kpi label="Commandes" value={stats.count}><Delta now={stats.count} before={stats.prevCount} /></Kpi>
            <Kpi label="Panier moyen" value={money(stats.avg)}><Delta now={stats.avg} before={stats.prevAvg} /></Kpi>
            <Kpi label="À traiter" value={data.pending} to="/admin/commandes">
              <span className="text-[12px] text-muted">{data.pending ? 'à confirmer' : 'tout est à jour'}</span>
            </Kpi>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title={`Ventes · ${RANGES.find((r) => r[0] === range)[1]}`} className="lg:col-span-2"
              action={<button onClick={() => setTable((t) => !t)} className="text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">{table ? 'Voir le graphique' : 'Voir le tableau'}</button>}>
              {table ? (
                <div className="max-h-[260px] overflow-y-auto">
                  <table className="w-full text-[13px]">
                    <thead className="sticky top-0 bg-white text-left text-muted"><tr><th className="py-2 font-normal">Jour</th><th className="py-2 text-right font-normal">Commandes</th><th className="py-2 text-right font-normal">Chiffre d'affaires</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {[...stats.days].reverse().map((d) => (
                        <tr key={d.date.toISOString()}><td className="py-2 capitalize">{longDate(d.date)}</td><td className="py-2 text-right tabular-nums">{d.orders}</td><td className="py-2 text-right tabular-nums">{formatDH(d.revenue)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : stats.revenue > 0 ? (
                <SalesChart days={stats.days} />
              ) : (
                <div className="flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-line text-center">
                  <p className="text-ink">Aucune vente sur la période</p>
                  <p className="mt-1 text-[13px] text-muted">Les commandes envoyées depuis le site apparaîtront ici.</p>
                </div>
              )}
            </Card>

            <Card title="Commandes par statut">
              <ul className="space-y-2">
                {stats.byStatus.map((s) => (
                  <li key={s.value}>
                    <Link to="/admin/commandes" className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink/5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] ${s.cls}`}>{s.label}</span>
                      <span className="tabular-nums text-ink">{s.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Dernières commandes" className="lg:col-span-2"
              action={<Link to="/admin/commandes" className="text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">Tout voir</Link>}>
              {data.recent.length === 0 ? (
                <p className="py-8 text-center text-muted">Pas encore de commande.</p>
              ) : (
                <div className="-mx-5 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-[13px]">
                    <thead className="border-y border-line bg-admin/60 text-left text-muted">
                      <tr><th className="px-5 py-2 font-normal">Commande</th><th className="py-2 font-normal">Client</th><th className="py-2 font-normal">Statut</th><th className="px-5 py-2 text-right font-normal">Total</th></tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.recent.map((o) => {
                        const st = statusOf(o.status)
                        return (
                          <tr key={o.id} className="hover:bg-ink/[0.02]">
                            <td className="px-5 py-3"><span className="text-ink">n°{o.number}</span><span className="block text-muted">{formatDate(o.created_at)}</span></td>
                            <td className="py-3"><span className="text-ink">{o.customer_name}</span><span className="block text-muted">{o.city}</span></td>
                            <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-[12px] ${st.cls}`}>{st.label}</span></td>
                            <td className="px-5 py-3 text-right tabular-nums text-ink">{formatDH(o.total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Les plus commandés">
              {stats.topList.length === 0 ? <p className="py-8 text-center text-muted">Pas encore de données.</p> : (
                <ul className="space-y-3">
                  {stats.topList.map(([name, qty]) => (
                    <li key={name}>
                      <div className="flex justify-between gap-3 text-[13px]"><span className="truncate text-ink">{name}</span><span className="tabular-nums text-muted">{qty}</span></div>
                      <div className="mt-1.5 h-2 rounded-r-[4px] bg-chart" style={{ width: `${Math.max(4, (qty / stats.topList[0][1]) * 100)}%` }} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Promotions actives" action={<Link to="/admin/promotions" className="text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">Gérer</Link>}>
              {data.active.length === 0 ? <p className="py-6 text-center text-muted">Aucune promotion en cours.</p> : (
                <ul className="divide-y divide-line">
                  {data.active.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-ink">{p.name}</span>
                        <span className="text-[12px] text-muted">{p.code ? `Code ${p.code}` : 'Automatique'}{p.ends_at ? ` · jusqu'au ${formatDate(p.ends_at, false)}` : ''}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-ink">{p.kind === 'percent' ? `-${p.value} %` : `-${p.value} DH`}</span>
                        <span className="text-[12px] text-muted">{p.usage_count}{p.usage_limit ? ` / ${p.usage_limit}` : ''} utilisation{p.usage_count > 1 ? 's' : ''}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Vote des goûts" action={<Link to="/admin/votes" className="text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">Gérer</Link>}>
              <VoteResults results={data.votes} />
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
