import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  BookIcon, ChartIcon, CloseIcon, ExternalIcon, GearIcon, GiftIcon, HelpIcon, HomeIcon, LeafIcon,
  LogoutIcon, MenuIcon, PercentIcon, ReceiptIcon, StarIcon, TagIcon,
} from '../components/Icons'
import { supabase } from '../lib/supabase'

const NAV = [
  { group: null, items: [
    ['/admin', 'Tableau de bord', HomeIcon, true],
    ['/admin/commandes', 'Commandes', ReceiptIcon],
  ] },
  { group: 'Catalogue', items: [
    ['/admin/produits', 'Produits', TagIcon],
    ['/admin/packs', 'Packs', GiftIcon],
    ['/admin/promotions', 'Promotions', PercentIcon],
  ] },
  { group: 'Contenu', items: [
    ['/admin/ingredients', 'Ingrédients', LeafIcon],
    ['/admin/recettes', 'Recettes', BookIcon],
    ['/admin/avis', 'Avis clients', StarIcon],
    ['/admin/faq', 'FAQ', HelpIcon],
    ['/admin/votes', 'Vote des goûts', ChartIcon],
  ] },
  { group: 'Boutique', items: [
    ['/admin/parametres', 'Paramètres', GearIcon],
  ] },
]

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bordeaux font-serif text-[18px] text-white">G</span>
      <span className="leading-tight">
        <span className="block font-serif text-[17px] text-ink">Granola by Hiba</span>
        <span className="block text-[11px] uppercase tracking-[1.5px] text-muted">Administration</span>
      </span>
    </div>
  )
}

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
    <div className="admin flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="admin-card w-full max-w-[400px] space-y-5 p-8">
        <Brand />
        <div>
          <h1 className="text-[22px]">Connexion</h1>
          <p className="mt-1 text-muted">Accédez à la gestion de la boutique.</p>
        </div>
        <label className="block"><span className="label">Email</span>
          <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block"><span className="label">Mot de passe</span>
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="rounded-lg bg-bordeaux/10 px-3 py-2 text-bordeaux">{error}</p>}
        <button className="btn btn-bordeaux w-full" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <a href="/" className="block text-center text-[13px] text-muted hover:text-ink">← Retour au site</a>
      </form>
    </div>
  )
}

function Sidebar({ email, pending, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-2 pb-6 pt-1"><Brand /></div>
      <nav className="flex-1 space-y-5">
        {NAV.map(({ group, items }) => (
          <div key={group || 'main'}>
            {group && <p className="mb-1 px-3 text-[11px] uppercase tracking-[1.5px] text-muted">{group}</p>}
            {items.map(([to, label, Icon, end]) => (
              <NavLink key={to} to={to} end={end} onClick={onNavigate}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors ${isActive ? 'bg-bordeaux/10 font-medium text-bordeaux' : 'text-ink/80 hover:bg-ink/5 hover:text-ink'}`}>
                <Icon width={18} height={18} />
                <span className="flex-1">{label}</span>
                {to === '/admin/commandes' && pending > 0 && (
                  <span className="rounded-full bg-bordeaux px-2 py-0.5 text-[11px] leading-none text-white">{pending}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-6 space-y-1 border-t border-line pt-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-ink/80 hover:bg-ink/5">
          <ExternalIcon width={18} height={18} /> Voir le site
        </a>
        <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-ink/80 hover:bg-ink/5">
          <LogoutIcon width={18} height={18} /> Se déconnecter
        </button>
        {email && <p className="truncate px-3 pt-2 text-[12px] text-muted">{email}</p>}
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(null)
  const [menu, setMenu] = useState(false)
  const [pending, setPending] = useState(0)
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

  // Nombre de commandes à traiter, rafraîchi à chaque changement de page
  useEffect(() => {
    if (!isAdmin) return
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'nouvelle')
      .then(({ count }) => setPending(count || 0))
  }, [isAdmin, pathname])

  useEffect(() => {
    document.title = 'Admin · Granola by Hiba'
    setMenu(false)
  }, [pathname])

  if (session === undefined || (session && isAdmin === null)) {
    return <div className="admin flex min-h-screen items-center justify-center text-muted">Chargement…</div>
  }
  if (!session) return <Login />
  if (!isAdmin) {
    return (
      <div className="admin flex min-h-screen items-center justify-center p-4">
        <div className="admin-card max-w-[400px] p-8 text-center">
          <p className="text-ink">Ce compte n'a pas accès à l'administration.</p>
          <button className="btn btn-outline mt-5" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
        </div>
      </div>
    )
  }

  const email = session.user?.email

  return (
    <div className="admin min-h-screen md:flex">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
        <button onClick={() => setMenu(true)} aria-label="Menu" className="-ml-2 p-2"><MenuIcon /></button>
        <span className="font-serif text-[17px] text-ink">Granola by Hiba</span>
        <span className="w-8" />
      </header>
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 w-[80%] max-w-[300px] overflow-y-auto bg-white p-4">
            <div className="mb-2 flex justify-end"><button onClick={() => setMenu(false)} aria-label="Fermer" className="p-1"><CloseIcon /></button></div>
            <Sidebar email={email} pending={pending} onNavigate={() => setMenu(false)} />
          </div>
        </div>
      )}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 overflow-y-auto border-r border-line bg-white p-4 md:block">
        <Sidebar email={email} pending={pending} />
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-[1180px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
