import { cloneElement, isValidElement, useId, useState } from 'react'
import { CloseIcon, PlusIcon } from '../components/Icons'
import { activeWeights, formatsOf } from '../lib/format'
import { uploadImage } from '../lib/images'

export function FieldWrap({ label, help, children, full }) {
  const id = useId()
  // Champ simple (input / textarea / select) : le libellé lui est relié pour les lecteurs d'écran
  const isControl = isValidElement(children) && ['input', 'textarea', 'select'].includes(children.type)
  const control = isControl && !children.props.id ? cloneElement(children, { id }) : children
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      {label && (isControl
        ? <label htmlFor={control.props.id} className="label">{label}</label>
        : <span className="label">{label}</span>)}
      {control}
      {help && <p className="mt-1 text-[12px] text-muted">{help}</p>}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-3 py-2">
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-bordeaux' : 'bg-neutral-300'}`}>
        <input type="checkbox" className="sr-only" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      <span className="text-[14px] text-ink">{label}</span>
    </label>
  )
}

export function ImageInput({ value, onChange, folder }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      onChange(await uploadImage(file, folder))
    } catch (x) {
      setErr(x.message)
    }
    setBusy(false)
  }
  return (
    <div className="flex items-center gap-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden border border-line bg-creme-light">
        {value && <img src={value} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="btn btn-outline min-h-0 cursor-pointer px-3 py-2 text-[12px]">
          {busy ? 'Envoi…' : value ? 'Remplacer' : 'Choisir une photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={pick} disabled={busy} />
        </label>
        {value && <button type="button" className="text-[13px] text-bordeaux underline" onClick={() => onChange('')}>Retirer</button>}
      </div>
      {err && <p className="text-[12px] text-bordeaux">{err}</p>}
    </div>
  )
}

export function ImagesInput({ value = [], onChange, folder }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const list = value || []
  const pick = async (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setErr(null)
    try {
      const urls = []
      for (const f of files) urls.push(await uploadImage(f, folder))
      onChange([...list, ...urls])
    } catch (x) {
      setErr(x.message)
    }
    setBusy(false)
  }
  const move = (i, d) => {
    const next = [...list]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {list.map((src, i) => (
          <div key={src} className="relative h-24 w-24 border border-line">
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 bg-ink px-1 text-[10px] text-white">Principale</span>}
            <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))}
              className="absolute right-1 top-1 bg-white/90 p-0.5" aria-label="Supprimer"><CloseIcon width={14} height={14} /></button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/85 text-[12px]">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="px-2 disabled:opacity-30">←</button>
              <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="px-2 disabled:opacity-30">→</button>
            </div>
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center border border-dashed border-ink/40 text-[12px] text-muted hover:border-ink">
          {busy ? 'Envoi…' : <><PlusIcon /> Ajouter</>}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={pick} disabled={busy} />
        </label>
      </div>
      {err && <p className="mt-1 text-[12px] text-bordeaux">{err}</p>}
    </div>
  )
}

/** Liste de textes (une ligne = un élément) */
export function LinesInput({ value = [], onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      className="input min-h-[96px]"
      rows={rows}
      placeholder={placeholder || 'Un élément par ligne'}
      value={(value || []).join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n'))}
      onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
    />
  )
}

export function MultiSelect({ value = [], onChange, options }) {
  const set = new Set(value || [])
  const toggle = (id) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button type="button" key={o.value} onClick={() => toggle(o.value)}
          className={`border px-3 py-1.5 text-[13px] ${set.has(o.value) ? 'border-bordeaux bg-bordeaux text-white' : 'border-line text-ink'}`}>
          {o.label}
        </button>
      ))}
      {!options.length && <span className="text-[13px] text-muted">Aucun élément disponible.</span>}
    </div>
  )
}

/** Formats d'un produit : [{ label, price, on }] (l'ordre de la liste = l'ordre sur le site) */
export function PricesInput({ value = [], onChange }) {
  const list = Array.isArray(value) ? value : []
  const set = (i, patch) => onChange(list.map((f, k) => (k === i ? { ...f, ...patch } : f)))
  const move = (i, d) => {
    const next = [...list]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {list.map((f, i) => (
        <div key={i} className={`flex flex-wrap items-center gap-2 rounded-lg border p-2 ${f.on ? 'border-ink/30' : 'border-line opacity-70'}`}>
          <input className="input w-36" placeholder="250g, Pot 250g…" value={f.label} aria-label="Format"
            onChange={(e) => set(i, { label: e.target.value })} />
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="0.5" className="input w-28" placeholder="Prix" value={f.price ?? ''} aria-label="Prix"
              onChange={(e) => set(i, { price: e.target.value === '' ? null : Number(e.target.value) })} />
            <span className="text-[13px]">DH</span>
          </div>
          <Toggle checked={f.on} onChange={(on) => set(i, { on })} label="En vente" />
          <span className="ml-auto flex items-center gap-1 text-[13px]">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="px-2 disabled:opacity-30" aria-label="Monter">↑</button>
            <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="px-2 disabled:opacity-30" aria-label="Descendre">↓</button>
            <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} className="px-1 text-bordeaux" aria-label="Supprimer"><CloseIcon width={18} height={18} /></button>
          </span>
        </div>
      ))}
      <button type="button" className="text-[13px] text-ink underline" onClick={() => onChange([...list, { label: '', price: null, on: true }])}>
        + Ajouter un format
      </button>
    </div>
  )
}

/** Contenu d'un pack : [{product_id, weight}] */
export function PackItemsInput({ value = [], onChange, products }) {
  const list = value || []
  const set = (i, patch) => onChange(list.map((it, k) => (k === i ? { ...it, ...patch } : it)))
  return (
    <div className="space-y-2">
      {list.map((it, i) => (
        <div key={i} className="flex gap-2">
          <select className="input" value={it.product_id || ''} onChange={(e) => set(i, { product_id: e.target.value, weight: activeWeights(products.find((p) => p.value === e.target.value)?.row)[0] || '' })}>
            <option value="">— Produit —</option>
            {products.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="input w-36" value={it.weight || ''} onChange={(e) => set(i, { weight: e.target.value })}>
            <option value="">— Format —</option>
            {formatsOf(products.find((p) => p.value === it.product_id)?.row).map((f) => <option key={f.label}>{f.label}</option>)}
          </select>
          <button type="button" className="px-2 text-bordeaux" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="Retirer"><CloseIcon /></button>
        </div>
      ))}
      <button type="button" className="text-[13px] text-ink underline" onClick={() => onChange([...list, { product_id: '', weight: '' }])}>
        + Ajouter un produit
      </button>
    </div>
  )
}

/** Liste d'objets éditables (ex. étapes, arguments) */
export function ObjectListInput({ value = [], onChange, shape, folder }) {
  const list = value || []
  const set = (i, patch) => onChange(list.map((it, k) => (k === i ? { ...it, ...patch } : it)))
  const blank = Object.fromEntries(shape.map((f) => [f.name, '']))
  return (
    <div className="space-y-3">
      {list.map((it, i) => (
        <div key={i} className="relative grid gap-3 border border-line p-3 pr-10 md:grid-cols-2">
          {shape.map((f) => (
            <FieldWrap key={f.name} label={f.label} full={f.full}>
              {f.type === 'image' ? (
                <ImageInput value={it[f.name]} onChange={(v) => set(i, { [f.name]: v })} folder={folder} />
              ) : f.type === 'textarea' ? (
                <textarea className="input" rows={2} value={it[f.name] || ''} onChange={(e) => set(i, { [f.name]: e.target.value })} />
              ) : (
                <input className="input" value={it[f.name] || ''} onChange={(e) => set(i, { [f.name]: e.target.value })} />
              )}
            </FieldWrap>
          ))}
          <button type="button" className="absolute right-2 top-2 text-bordeaux" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="Supprimer"><CloseIcon /></button>
        </div>
      ))}
      <button type="button" className="text-[13px] text-ink underline" onClick={() => onChange([...list, blank])}>+ Ajouter</button>
    </div>
  )
}

/** Champ générique piloté par une définition { name, label, type, options, … } */
export function Field({ field, value, onChange, options, folder }) {
  const { type = 'text' } = field
  let input
  switch (type) {
    case 'textarea':
      input = <textarea className="input" rows={field.rows || 4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      break
    case 'number':
      input = <input type="number" className="input" step={field.step || 'any'} min={field.min} value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
      break
    case 'checkbox':
      return <div className={field.full ? 'md:col-span-2' : ''}><Toggle checked={value} onChange={onChange} label={field.label} />{field.help && <p className="text-[12px] text-muted">{field.help}</p>}</div>
    case 'select':
      input = (
        <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options || options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
      break
    case 'datetime':
      input = <input type="datetime-local" className="input" value={value ? toLocalInput(value) : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />
      break
    case 'image':
      input = <ImageInput value={value} onChange={onChange} folder={folder} />
      break
    case 'images':
      input = <ImagesInput value={value} onChange={onChange} folder={folder} />
      break
    case 'lines':
      input = <LinesInput value={value} onChange={onChange} placeholder={field.placeholder} />
      break
    case 'multiselect':
      input = <MultiSelect value={value} onChange={onChange} options={options || []} />
      break
    case 'prices':
      input = <PricesInput value={value} onChange={onChange} />
      break
    case 'packItems':
      input = <PackItemsInput value={value} onChange={onChange} products={options || []} />
      break
    default:
      input = <input className="input" dir={field.dir} lang={field.dir === 'rtl' ? 'ar' : undefined} placeholder={field.placeholder}
        value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={field.required} />
  }
  return <FieldWrap label={`${field.label}${field.required ? ' *' : ''}`} help={field.help} full={field.full}>{input}</FieldWrap>
}

function toLocalInput(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
