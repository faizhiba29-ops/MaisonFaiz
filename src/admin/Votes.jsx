import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function VoteResults({ results }) {
  const total = results.reduce((n, r) => n + Number(r.votes), 0)
  return (
    <ul className="space-y-3">
      {results.map((r) => {
        const pct = total ? Math.round((Number(r.votes) / total) * 100) : 0
        return (
          <li key={r.id}>
            <div className="flex justify-between text-[14px] text-ink">
              <span>{r.emoji} {r.name}</span>
              <span className="tabular-nums">{r.votes} vote{Number(r.votes) > 1 ? 's' : ''} · {pct}%</span>
            </div>
            <div className="mt-1 h-2 bg-creme"><div className="h-full bg-bordeaux" style={{ width: `${pct}%` }} /></div>
          </li>
        )
      })}
      <li className="pt-1 text-[13px] text-muted">{total} vote{total > 1 ? 's' : ''} au total</li>
    </ul>
  )
}

export default function Votes() {
  const [results, setResults] = useState(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('flavor_results')
    setResults(data || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const { error } = await supabase.from('flavor_options').insert({ name: name.trim(), emoji: emoji.trim() || null, sort_order: (results?.length || 0) + 1 })
    if (error) return window.alert(error.message)
    setName('')
    setEmoji('')
    load()
  }

  const remove = async (o) => {
    if (!window.confirm(`Supprimer « ${o.name} » et ses ${o.votes} vote(s) ?`)) return
    await supabase.from('flavor_options').delete().eq('id', o.id)
    load()
  }

  const reset = async () => {
    if (!window.confirm('Remettre tous les votes à zéro ? Les options sont conservées.')) return
    const { error } = await supabase.rpc('reset_votes')
    if (error) return window.alert(error.message)
    load()
  }

  return (
    <div className="max-w-[720px]">
      <h1 className="mb-6 text-[28px]">Vote des goûts</h1>
      <div className="bg-white p-5">
        {!results ? <p className="text-muted">Chargement…</p> : results.length ? <VoteResults results={results} /> : <p className="text-muted">Aucune option.</p>}
      </div>

      <h2 className="mb-3 mt-8 text-[22px]">Options</h2>
      <ul className="divide-y divide-line bg-white">
        {(results || []).map((o) => (
          <li key={o.id} className="flex items-center justify-between p-4">
            <span className="text-ink">{o.emoji} {o.name}</span>
            <button className="text-[14px] text-bordeaux underline" onClick={() => remove(o)}>Supprimer</button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className="input w-20" placeholder="🍓" value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Emoji" />
        <input className="input" placeholder="Nouveau goût (ex. Pistache)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-bordeaux shrink-0 px-4">Ajouter</button>
      </form>

      <button className="btn btn-outline mt-8" onClick={reset}>Réinitialiser les votes</button>
    </div>
  )
}
