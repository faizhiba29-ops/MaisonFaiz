import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { CloseIcon, MenuIcon } from '../components/Icons'
import { supabase } from '../lib/supabase'

const NAV = [
  ['/admin', 'Tableau de bord', true],
  ['/admin/commandes', 'Commandes'],
  ['/admin/produits', 'Produits'],
  ['/admin/packs', 'Packs'],
  ['/admin/promotions', 'Promotions'],
  ['/admin/ingredients', 'Ingrédients'],
  ['/admin/recettes', 'Recettes'],
  ['/admin/avis', 'Avis clients'],
  ['/admin/faq', 'FAQ'],
  ['/admin/votes', 'Vote des goûts'],
  ['/admin/parametres', 'Paramètres'],
]

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError('Email ou mot de passe incorrect.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-creme-light p-4">
      <form onSubmit={submit} className="w-full max-w-[380px] space-y-4 bg-white p-8">
        <p className="font-serif text-[26px] text-ink">Granola <span className="text-[17px] italic text-bordeaux">by Hiba</span></p>
        <h1 className="font-sans text-[13px] uppercase tracking-widest text-muted">Espace admin</h1>
        <label className="block"><span className="label">Email</span>
          <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block"><span className="label">Mot de passe</span>
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="text-[14px] text-bordeaux">{error}</p>}
        <button className="btn btn-bordeaux w-full" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <a href="/" className="block text-center text-[13px] underline">← Retour au site</a>
      </form>
    </div>
  )
}

function Sidebar({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 text-[14px]">
      {NAV.map(([to, label, end]) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => `px-3 py-2.5 ${isActive ? 'bg-bordeaux text-white' : 'text-ink hover:bg-creme'}`}>
          {label}
        </NavLink>
      ))}
      <div className="mt-6 border-t border-line pt-4">
        <a href="/" target="_blank" rel="noreferrer" className="block px-3 py-2 text-ink hover:bg-creme">Voir le site ↗</a>
        <button onClick={() => supabase.auth.signOut()} className="block w-full px-3 py-2 text-left text-bordeaux hover:bg-creme">Se déconnecter</button>
      </div>
    </nav>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(null)
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setIsAdmin(null)
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(Boolean(data)))
  }, [session])

  useEffect(() => {
    document.title = 'Admin · Granola by Hiba'
    setMenu(false)
  }, [pathname])

  if (session === undefined || (session && isAdmin === null)) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Chargement…</div>
  }
  if (!session) return <Login />
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-ink">Ce compte n'a pas accès à l'administration.</p>
        <button className="btn btn-outline" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-creme-light md:flex">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
        <span className="font-serif text-[20px] text-ink">Admin <span className="text-[14px] italic text-bordeaux">Granola by Hiba</span></span>
        <button onClick={() => setMenu(true)} aria-label="Menu" className="p-2"><MenuIcon /></button>
      </header>
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 w-[78%] max-w-[300px] overflow-y-auto bg-white p-4">
            <div className="mb-4 flex justify-end"><button onClick={() => setMenu(false)} aria-label="Fermer"><CloseIcon /></button></div>
            <Sidebar onNavigate={() => setMenu(false)} />
          </div>
        </div>
      )}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 overflow-y-auto border-r border-line bg-white p-4 md:block">
        <p className="mb-6 px-3 font-serif text-[22px] leading-tight text-ink">Granola <span className="text-[15px] italic text-bordeaux">by Hiba</span><br /><span className="font-sans text-[11px] uppercase tracking-widest text-muted">Administration</span></p>
        <Sidebar />
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
