import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FieldWrap } from './fields'

const MIN_LENGTH = 8

// Messages d'erreur de Supabase Auth → texte compréhensible
function explain(error) {
  switch (error?.code) {
    case 'same_password': return 'Le nouveau mot de passe doit être différent de l\'ancien.'
    case 'weak_password': return 'Mot de passe trop faible : mélangez lettres, chiffres et symboles.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit': return 'Trop de tentatives. Réessayez dans quelques minutes.'
    default: return error?.message || 'Le mot de passe n\'a pas pu être modifié.'
  }
}

export default function Account() {
  const [email, setEmail] = useState('')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''))
  }, [])

  const reset = () => { setCurrent(''); setNext(''); setConfirm('') }

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (next.length < MIN_LENGTH) return setMsg({ ok: false, text: `Le nouveau mot de passe doit faire au moins ${MIN_LENGTH} caractères.` })
    if (next !== confirm) return setMsg({ ok: false, text: 'La confirmation ne correspond pas au nouveau mot de passe.' })
    if (next === current) return setMsg({ ok: false, text: 'Le nouveau mot de passe doit être différent de l\'ancien.' })

    setBusy(true)
    // On vérifie d'abord le mot de passe actuel : une session restée ouverte ne suffit pas pour le changer
    const check = await supabase.auth.signInWithPassword({ email, password: current })
    if (check.error) {
      setBusy(false)
      return setMsg({ ok: false, text: check.error.code === 'invalid_credentials' || /invalid login/i.test(check.error.message) ? 'Mot de passe actuel incorrect.' : explain(check.error) })
    }
    const { error } = await supabase.auth.updateUser({ password: next })
    if (error) {
      setBusy(false)
      return setMsg({ ok: false, text: explain(error) })
    }
    // Les autres appareils connectés avec l'ancien mot de passe sont déconnectés
    await supabase.auth.signOut({ scope: 'others' })
    setBusy(false)
    reset()
    setMsg({ ok: true, text: 'Mot de passe modifié ✓ Les autres appareils ont été déconnectés.' })
  }

  const type = show ? 'text' : 'password'

  return (
    <div className="max-w-[560px]">
      <h1 className="mb-6 text-[28px]">Mon compte</h1>
      <section className="mb-6 bg-white p-4 md:p-6">
        <h2 className="mb-1 text-[20px]">Connexion</h2>
        <p className="text-muted">Connecté en tant que <strong className="font-medium text-ink">{email || '…'}</strong></p>
      </section>
      <form onSubmit={submit} className="space-y-5 bg-white p-4 md:p-6">
        <div>
          <h2 className="text-[20px]">Changer le mot de passe</h2>
          <p className="mt-1 text-muted">Au moins {MIN_LENGTH} caractères. Choisissez un mot de passe que vous n'utilisez nulle part ailleurs.</p>
        </div>
        {/* Champ caché pour que le gestionnaire de mots de passe du navigateur associe le bon compte */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />
        <FieldWrap label="Mot de passe actuel">
          <input className="input" type={type} autoComplete="current-password" required value={current} onChange={(e) => { setCurrent(e.target.value); setMsg(null) }} />
        </FieldWrap>
        <FieldWrap label="Nouveau mot de passe">
          <input className="input" type={type} autoComplete="new-password" required minLength={MIN_LENGTH} value={next} onChange={(e) => { setNext(e.target.value); setMsg(null) }} />
        </FieldWrap>
        <FieldWrap label="Confirmer le nouveau mot de passe">
          <input className="input" type={type} autoComplete="new-password" required minLength={MIN_LENGTH} value={confirm} onChange={(e) => { setConfirm(e.target.value); setMsg(null) }} />
        </FieldWrap>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Afficher les mots de passe
        </label>
        {msg && (
          <p role="status" className={`rounded-lg px-3 py-2 ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-bordeaux/10 text-bordeaux'}`}>{msg.text}</p>
        )}
        <button className="btn btn-bordeaux" disabled={busy}>{busy ? 'Modification…' : 'Changer le mot de passe'}</button>
      </form>
    </div>
  )
}
