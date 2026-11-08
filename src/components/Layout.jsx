import { Suspense, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useCart } from '../context/Cart'
import Img from './Img'
import { useSettings, useSiteData } from '../context/SiteData'
import { waLink } from '../lib/whatsapp'
import { safeUrl } from '../lib/format'
import { BagIcon, CloseIcon, InstagramIcon, MenuIcon, SearchIcon, WhatsAppIcon } from './Icons'
import { ProductVisual } from './Product'

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/boutique', label: 'Boutique' },
  { to: '/bienfaits', label: 'Bienfaits' },
  { to: '/comment-le-deguster', label: 'Comment le déguster' },
  { to: '/contact', label: 'Contact' },
]

function AnnouncementBar() {
  const s = useSettings()
  const { promos } = useSiteData()
  const banners = promos.filter((p) => p.banner_text).map((p) => p.banner_text)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  return (
    <div className="bg-bordeaux px-4 py-2 text-center text-[12px] leading-snug tracking-[1px] text-white">
      {banners.length > 0 ? (
        <p key={i} className="animate-fade-in">{banners[i % banners.length]}</p>
      ) : (
        <>
          {s.announcement_ar && <p lang="ar" className="text-[14px] tracking-normal">{s.announcement_ar}</p>}
          {s.announcement_fr && <p>{s.announcement_fr}</p>}
        </>
      )}
    </div>
  )
}

function Logo({ className = '' }) {
  return (
    <Link to="/" className={`block shrink-0 ${className}`} aria-label="Maison Faiz foods — accueil">
      <Img src="/images/brand/logo.png" sizes="(min-width: 768px) 174px, 142px" alt="Maison Faiz foods" width="477" height="121" className="h-[36px] w-auto md:h-[44px]" />
    </Link>
  )
}

function SearchOverlay({ onClose }) {
  const { products } = useSiteData()
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return products
    return products.filter((p) => `${p.name} ${p.name_ar || ''} ${p.description || ''} ${p.main_ingredients || ''}`.toLowerCase().includes(n))
  }, [q, products])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white animate-fade-in" role="dialog" aria-modal="true" aria-label="Recherche">
      <div className="container-site py-5">
        <div className="flex items-center gap-3 border-b border-ink pb-2">
          <SearchIcon />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chocolat, noisettes, sellou…"
            className="w-full bg-transparent py-2 text-[18px] text-ink outline-none"
          />
          <button onClick={onClose} aria-label="Fermer" className="p-2"><CloseIcon /></button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {results.map((p, i) => (
            <Link key={p.id} to={`/produits/${p.slug}`} onClick={onClose}>
              <ProductVisual product={p} index={i} overlay={false} />
              <p className="mt-2 font-serif text-[17px] text-ink">{p.name}</p>
            </Link>
          ))}
          {results.length === 0 && <p className="col-span-full text-muted">Aucun résultat pour « {q} ».</p>}
        </div>
      </div>
    </div>
  )
}

function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  // Menu mobile : fermeture avec la touche Échap
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const navCls = ({ isActive }) => `link-underline py-1 ${isActive ? 'active text-bordeaux' : 'text-ink hover:text-bordeaux'}`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="container-site flex h-[60px] items-center gap-6 md:h-[72px]">
        <button className="-ml-2 p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <MenuIcon />
        </button>
        <Logo className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0" />
        <nav className="hidden items-center gap-6 text-[14px] md:flex" aria-label="Menu principal">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={navCls}>{n.label}</NavLink>)}
        </nav>
        <div className="ml-auto flex items-center gap-1 text-ink">
          <button className="hidden p-2 md:block" onClick={() => setSearch(true)} aria-label="Rechercher"><SearchIcon /></button>
          <Link to="/panier" className="relative -mr-2 p-2" aria-label={`Panier (${count})`}>
            <BagIcon />
            {count > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-bordeaux px-1 text-[10px] text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-[82%] max-w-[340px] flex-col bg-white p-6 animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="p-2"><CloseIcon /></button>
            </div>
            {[...NAV, { to: '/faq', label: 'FAQ' }].map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `border-b border-line py-4 font-serif text-[22px] ${isActive ? 'text-bordeaux' : 'text-ink'}`}>
                {n.label}
              </NavLink>
            ))}
            <button onClick={() => { setOpen(false); setSearch(true) }} className="mt-6 flex items-center gap-2 text-ink">
              <SearchIcon /> Rechercher
            </button>
          </nav>
        </div>
      )}
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </header>
  )
}

function Footer() {
  const s = useSettings()
  return (
    <footer id="contact" className="mt-auto border-t border-line bg-creme-light">
      <div className="container-site grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-[15px]">Granola fait maison, préparé à la main en petites fournées, sans conservateurs.</p>
          <p className="mt-4 text-[15px] text-ink">Livraison partout au Maroc</p>
          <p className="text-[15px] text-ink">Basée à {s.city || 'Fès'}</p>
        </div>
        <div>
          <h4 className="eyebrow mb-4 font-sans">La boutique</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/boutique" className="link-underline">Boutique</Link></li>
            <li><Link to="/bienfaits" className="link-underline">Les bienfaits</Link></li>
            <li><Link to="/comment-le-deguster" className="link-underline">Comment le déguster</Link></li>
            <li><Link to="/faq" className="link-underline">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-4 font-sans">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={waLink(s.whatsapp_number)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-ink">
                <WhatsAppIcon width={18} height={18} /> {s.whatsapp_display || s.whatsapp_number}
              </a>
            </li>
            <li>
              <a href={safeUrl(s.instagram_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-ink">
                <InstagramIcon width={18} height={18} /> @{s.instagram_handle}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        <nav className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1" aria-label="Informations légales">
          <Link to="/mentions-legales" className="hover:text-ink">Mentions légales</Link>
          <Link to="/cgv" className="hover:text-ink">Conditions de vente</Link>
          <Link to="/confidentialite" className="hover:text-ink">Confidentialité</Link>
        </nav>
        © {new Date().getFullYear()} Maison Faiz foods · Fait maison à {s.city || 'Fès'}
      </div>
    </footer>
  )
}

function WhatsAppFloat() {
  const s = useSettings()
  const { pathname } = useLocation()
  if (pathname === '/panier' || !s.whatsapp_number) return null
  return (
    <a
      href={waLink(s.whatsapp_number, 'Salam Hiba, ')}
      target="_blank"
      rel="noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="fixed bottom-4 right-4 z-30 flex h-12 w-12 md:bottom-6 md:right-6 md:h-14 md:w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-[0_4px_14px_rgba(0,0,0,.18)] transition-transform hover:scale-105"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  )
}

function CartToast() {
  const { toast, count } = useCart()
  if (!toast) return null
  return (
    <div key={toast.at} className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm animate-fade-in bg-ink p-4 text-sm text-white md:bottom-8 md:left-auto md:right-24" role="status">
      <p>{toast.label} ajouté au panier</p>
      <Link to="/panier" className="mt-1 inline-block underline underline-offset-4">Voir le panier ({count})</Link>
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="text-[14px] tracking-[2px] text-muted">CHARGEMENT…</span>
    </div>
  )
}

export default function Layout() {
  const { loading, error } = useSiteData()
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
        Aller au contenu
      </a>
      <AnnouncementBar />
      <Header />
      <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
        {loading ? <Loading /> : error ? (
          <div className="container-site py-24 text-center">
            <p className="font-serif text-2xl text-ink">Oups, le site n'a pas pu charger.</p>
            <p className="mt-2 text-muted">Vérifiez votre connexion puis rechargez la page.</p>
            {import.meta.env.DEV && (
              <p className="mx-auto mt-6 max-w-lg bg-creme p-4 text-left font-mono text-[13px] text-bordeaux">
                [dev] {error.message}
                {/api key/i.test(error.message) && ' → vérifiez VITE_SUPABASE_ANON_KEY dans .env (clé sb_publishable_… ou anon eyJ…).'}
              </p>
            )}
          </div>
        ) : <Suspense fallback={<Loading />}><Outlet /></Suspense>}
      </main>
      <Footer />
      <WhatsAppFloat />
      <CartToast />
    </div>
  )
}

