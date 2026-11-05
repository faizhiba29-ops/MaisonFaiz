import { useCallback, useEffect, useState } from 'react'
import { slugify } from '../lib/format'
import { supabase } from '../lib/supabase'
import { Field } from './fields'

/**
 * Page CRUD générique : liste + ajouter + modifier + supprimer (avec confirmation).
 *
 * config = {
 *   table, title, singular, folder,
 *   order: [['sort_order', true], …],
 *   columns: [{ label, render(row, ctx) }],
 *   fields: [{ name, label, type, required, help, full, optionsKey }],
 *   defaults: {…},
 *   lookups: { key: { table, label, value? } }   // options chargées depuis d'autres tables
 *   slugFrom: 'name',                             // génère le slug automatiquement
 *   validate(row) → message | null,
 *   prepare(row) → row,                           // nettoyage avant enregistrement
 *   load(row) → row,                              // mise en forme pour le formulaire (inverse de prepare)
 * }
 */
export default function CrudPage({ config }) {
  const { table, title, singular, fields, columns, defaults = {}, order = [['created_at', false]], lookups = {} } = config
  const [rows, setRows] = useState(null)
  const [options, setOptions] = useState({})
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    let query = supabase.from(table).select('*')
    for (const [col, asc] of order) query = query.order(col, { ascending: asc })
    const { data, error } = await query
    if (error) setError(error.message)
    setRows(data || [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  useEffect(() => {
    load()
    Promise.all(
      Object.entries(lookups).map(async ([key, l]) => {
        const { data } = await supabase.from(l.table).select('*').order(l.order || 'created_at')
        return [key, (data || []).map((r) => ({ value: r[l.value || 'id'], label: typeof l.label === 'function' ? l.label(r) : r[l.label], row: r }))]
      }),
    ).then((entries) => setOptions(Object.fromEntries(entries)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  const startNew = () => {
    const nextOrder = rows?.length ? Math.max(...rows.map((r) => r.sort_order || 0)) + 1 : 1
    const row = { ...structuredClone(defaults), ...('sort_order' in defaults ? { sort_order: nextOrder } : {}) }
    setEditing(config.load ? config.load(row) : row)
    setError(null)
  }

  const save = async (e) => {
    e.preventDefault()
    let row = { ...editing }
    if (config.slugFrom && !row.slug) row.slug = slugify(row[config.slugFrom])
    for (const f of fields) {
      if (f.required && (row[f.name] == null || row[f.name] === '')) return setError(`Le champ « ${f.label} » est obligatoire.`)
      if (f.type === 'lines' && Array.isArray(row[f.name])) row[f.name] = row[f.name].map((s) => s.trim()).filter(Boolean)
    }
    const msg = config.validate?.(row)
    if (msg) return setError(msg)
    if (config.prepare) row = config.prepare(row)

    setSaving(true)
    setError(null)
    const { id, created_at: _c, ...payload } = row
    const res = id ? await supabase.from(table).update(payload).eq('id', id) : await supabase.from(table).insert(payload)
    setSaving(false)
    if (res.error) return setError(res.error.message.includes('duplicate') ? 'Cette valeur existe déjà (slug ou code en double).' : res.error.message)
    setEditing(null)
    load()
  }

  const remove = async (row) => {
    const name = row.name || row.title || row.question || row.name_fr || singular
    if (!window.confirm(`Supprimer « ${name} » ? Cette action est définitive.`)) return
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    if (error) return window.alert(error.message)
    load()
  }

  const toggle = async (row, col) => {
    await supabase.from(table).update({ [col]: !row[col] }).eq('id', row.id)
    load()
  }

  // ─── Formulaire ───
  if (editing) {
    return (
      <form onSubmit={save} className="max-w-[860px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-[28px]">{editing.id ? `Modifier ${singular}` : `Nouveau ${singular}`}</h1>
          <button type="button" className="text-[14px] underline" onClick={() => setEditing(null)}>Annuler</button>
        </div>
        <div className="grid gap-5 bg-white p-4 md:grid-cols-2 md:p-6">
          {fields.map((f) =>
            f.show && !f.show(editing) ? null : (
              <Field
                key={f.name}
                field={f}
                value={editing[f.name]}
                options={f.optionsKey ? options[f.optionsKey] : undefined}
                folder={config.folder || table}
                onChange={(v) =>
                  setEditing((r) => {
                    const next = { ...r, [f.name]: v }
                    if (config.slugFrom === f.name && !r.id && (!r.slug || r.slug === slugify(r[f.name] || ''))) next.slug = slugify(v)
                    return next
                  })
                }
              />
            ),
          )}
        </div>
        {error && <p className="mt-4 border border-bordeaux bg-white p-3 text-[14px] text-bordeaux">{error}</p>}
        <div className="sticky bottom-0 mt-6 flex gap-3 bg-admin/95 py-3 backdrop-blur">
          <button className="btn btn-bordeaux flex-1 md:flex-none" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Annuler</button>
        </div>
      </form>
    )
  }

  // ─── Liste ───
  const ctx = { options, toggle }
  const filtered = (rows || []).filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px]">{title}</h1>
        <button className="btn btn-bordeaux min-h-[42px] px-5" onClick={startNew}>+ Ajouter</button>
      </div>
      {config.intro && <p className="mb-4 max-w-[720px] text-[14px]">{config.intro}</p>}
      {rows && rows.length > 6 && (
        <input className="input mb-4 max-w-sm" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
      )}
      {error && <p className="mb-4 text-bordeaux">{error}</p>}
      {!rows ? (
        <p className="text-muted">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="bg-white p-6 text-muted">Aucun élément pour l'instant.</p>
      ) : (
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-[14px]">
            <thead className="hidden border-b border-line text-[12px] uppercase tracking-wider text-muted md:table-header-group">
              <tr>
                {columns.map((c) => <th key={c.label} className="px-4 py-3 font-normal">{c.label}</th>)}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((row) => (
                <tr key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 md:table-row md:p-0">
                  {columns.map((c, i) => (
                    <td key={c.label} className={`md:px-4 md:py-3 ${i === 0 ? 'w-full md:w-auto' : ''}`}>
                      {c.render(row, ctx)}
                    </td>
                  ))}
                  <td className="ml-auto whitespace-nowrap md:px-4 md:py-3 md:text-right">
                    <button className="mr-4 text-ink underline" onClick={() => { const r = structuredClone(row); setEditing(config.load ? config.load(r) : r); setError(null) }}>Modifier</button>
                    <button className="text-bordeaux underline" onClick={() => remove(row)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Petite pastille cliquable oui/non pour la liste */
export function YesNo({ row, col, ctx, yes = 'Oui', no = 'Non' }) {
  return (
    <button onClick={() => ctx.toggle(row, col)} title="Cliquer pour changer"
      className={`rounded-full px-2.5 py-0.5 text-[12px] ${row[col] ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600'}`}>
      {row[col] ? yes : no}
    </button>
  )
}

export function Thumb({ src }) {
  return <div className="h-12 w-12 shrink-0 overflow-hidden bg-creme">{src && <img src={src} alt="" className="h-full w-full object-cover" />}</div>
}
