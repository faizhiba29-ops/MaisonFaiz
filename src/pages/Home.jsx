import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { JarArt } from '../components/Art'
import { ChevronLeft, ChevronRight, Stars } from '../components/Icons'
import { packContents, PackCard, PriceTag, ProductCard, Visual } from '../components/Product'
import Seo from '../components/Seo'
import { useCart } from '../context/Cart'
import { useSettings, useSiteData } from '../context/SiteData'
import { gridColsClass, safeUrl } from '../lib/format'
import { displayPrice } from '../lib/pricing'
import { db } from '../lib/config'
import { waLink } from '../lib/whatsapp'
import Img, { srcSetOf } from '../components/Img'
import { mobileHeroImages } from '../lib/hero'

// En-tête de section aligné à gauche, avec lien optionnel à droite
function SectionHead({ eyebrow, title, text, link, linkLabel }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-6 md:mb-9">
      <div className="max-w-[640px]">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="h2">{title}</h2>
        {text && <p className="mt-2">{text}</p>}
      </div>
      {link && (
        <Link to={link} className="hidden shrink-0 text-[15px] text-ink underline underline-offset-4 hover:text-bordeaux md:inline">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

function Hero() {
  const s = useSettings()
  const images = (s.hero_images || []).filter(Boolean)
  const mobile = mobileHeroImages(s)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % images.length), 6000)
    return () => clearInterval(t)
  }, [images.length])

  const content = (dark) => (
    <>
      <p className={`eyebrow ${dark ? '' : '!text-white/80'}`}>Fait maison à {s.city || 'Fès'}</p>
      <h1 className={`mx-auto mt-3 max-w-[560px] text-[34px] leading-[1.15] md:mx-0 md:text-[49px] ${dark ? '' : '!text-white'}`}>
        {s.hero_title}
      </h1>
      {s.hero_subtitle && <p className={`mx-auto mt-3 max-w-[440px] md:mx-0 ${dark ? '' : 'text-white/90'}`}>{s.hero_subtitle}</p>}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
        <Link to="/boutique" className={`btn ${dark ? 'btn-primary' : 'btn-ghost-white'}`}>Découvrir la boutique</Link>
        <a href={waLink(s.whatsapp_number, 'Salam Hiba, je voudrais commander du granola.')} target="_blank" rel="noreferrer"
          className={`btn ${dark ? 'btn-outline' : 'btn-ghost-white'}`}>
          Commander sur WhatsApp
        </a>
      </div>
    </>
  )

  // Photo claire (produit à gauche, espace libre à droite) : texte à droite sur ordinateur.
  // Sur téléphone : version verticale centrée sur le produit (voir lib/hero.js), texte sous la photo.
  if (images.length > 0) {
    return (
      <section className="relative overflow-hidden bg-creme-light md:h-[78vh] md:min-h-[540px]">
        <div className="relative h-[56vh] min-h-[340px] md:absolute md:inset-0 md:h-full">
          {images.map((src, k) => {
            const small = mobile[k] || mobile[0]
            return (
              <picture key={src}>
                <source media="(max-width: 767px)" srcSet={srcSetOf(small) || small} sizes="100vw" />
                <Img src={src} sizes="100vw" alt="Maison Faiz foods" fetchPriority={k === 0 ? 'high' : 'auto'} loading={k === 0 ? 'eager' : 'lazy'}
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 md:object-left ${k === i ? 'opacity-100' : 'opacity-0'}`} />
              </picture>
            )
          })}
        </div>
        <div className="container-site relative py-10 text-center md:flex md:h-full md:items-center md:justify-end md:py-0 md:text-left">
          <div className="md:w-[44%]">{content(true)}</div>
        </div>
        {images.length > 1 && (
          <div className="absolute left-1/2 top-[52vh] flex -translate-x-1/2 gap-2 md:bottom-6 md:top-auto">
            {images.map((src, k) => (
              <button key={src} onClick={() => setI(k)} aria-label={`Image ${k + 1}`} className={`h-[2px] w-8 ${k === i ? 'bg-ink' : 'bg-ink/25'}`} />
            ))}
          </div>
        )}
      </section>
    )
  }

  // Composition de remplacement tant qu'aucune photo n'est ajoutée dans Paramètres
  return (
    <section className="relative h-[78vh] min-h-[520px] overflow-hidden bg-bordeaux">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, #6B2D3C 0 55%, #4A2C20 55% 100%)' }}>
        <div className="absolute left-1/2 top-[6%] aspect-square h-[58%] -translate-x-1/2 md:left-auto md:right-[8%] md:top-1/2 md:h-[78%] md:-translate-y-1/2 md:translate-x-0">
          <JarArt name="Granola" seed="hero" choco />
        </div>
      </div>
      <div className="container-site relative flex h-full flex-col justify-end pb-12 text-center md:items-start md:justify-center md:pb-0 md:text-left">
        {content(false)}
      </div>
    </section>
  )
}

function Collection({ products }) {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHead title="Nos produits" link="/boutique" linkLabel="Tout voir" />
        <div className={`no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:overflow-visible md:px-0 ${gridColsClass(products.length)}`}>
          {products.map((p, i) => (
            <div key={p.id} className="w-[44%] shrink-0 snap-start md:w-auto">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
        <div className="mt-6 text-center md:hidden">
          <Link to="/boutique" className="btn btn-outline w-full">Tout voir</Link>
        </div>
      </div>
    </section>
  )
}

// Image + texte (comme les sections « image with text » des boutiques en ligne)
function ImageWithText({ image, imageAlt, reverse, children, fallback }) {
  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
      <div className="media-frame relative aspect-square overflow-hidden bg-creme">
        {image ? <Img src={image} sizes="(min-width: 768px) 50vw, 100vw" alt={imageAlt} loading="lazy" className="h-full w-full object-cover" /> : fallback}
      </div>
      <div className="md:px-6">{children}</div>
    </div>
  )
}

function PackFeature() {
  const { packs, products, promos } = useSiteData()
  const { add } = useCart()
  if (!packs.length) return null
  const [pack, ...others] = packs
  const dp = displayPrice(promos, 'pack', pack.id, Number(pack.price))
  const contents = packContents(pack, products)
  return (
    <section className="section pt-0">
      <div className="container-site">
        <ImageWithText image={pack.image} imageAlt={pack.name} fallback={<Visual themeName={pack.theme} name={pack.name} art="duo" />}>
          <p className="eyebrow">Pack</p>
          <h2 className="h2 mt-2"><Link to={`/packs/${pack.slug}`} className="underline-offset-4 hover:underline">{pack.name}</Link></h2>
          <div className="mt-3"><PriceTag price={dp.price} original={dp.original} className="!text-[17px]" /></div>
          {pack.description && <p className="mt-4">{pack.description}</p>}
          {contents.length > 0 && (
            <ul className="mt-4 space-y-1 border-l border-line pl-4 text-[15px] text-ink">
              {contents.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button className="btn btn-primary w-full sm:w-auto" disabled={!pack.available}
              onClick={() => add({ type: 'pack', id: pack.id }, pack.name)}>
              {pack.available ? 'Ajouter au panier' : 'Bientôt disponible'}
            </button>
            <Link to={`/packs/${pack.slug}`} className="btn btn-outline w-full sm:w-auto">Voir le pack</Link>
          </div>
        </ImageWithText>
        {others.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-3">
            {others.map((p, i) => <PackCard key={p.id} pack={p} index={i} />)}
          </div>
        )}
      </div>
    </section>
  )
}

function About() {
  const s = useSettings()
  return (
    <section className="section bg-creme-light">
      <div className="container-site">
        <ImageWithText image={s.about_image || '/images/site/commandes-pretes.jpg'} imageAlt="Maison Faiz foods" reverse>
          <p className="eyebrow">Notre histoire</p>
          <h2 className="h2 mt-2">{s.about_title || 'Qui suis-je ?'}</h2>
          <p className="mt-4 whitespace-pre-line">{s.about_text}</p>
          <Link to="/bienfaits" className="btn btn-outline mt-7">Découvrir les ingrédients</Link>
        </ImageWithText>
      </div>
    </section>
  )
}

function Hygiene() {
  const s = useSettings()
  const steps = s.hygiene_steps || []
  if (!steps.length) return null
  return (
    <section className="section">
      <div className="container-site">
        <SectionHead title="Fait maison, avec hygiène" text="Charlotte, gants et emballage soigné : chaque fournée est préparée à la main, en petite quantité." />
        <div className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-4">
          {steps.map((st, k) => (
            <div key={k}>
              <Visual image={st.image} themeName={['kraft', 'bordeaux', 'chocolat', 'rose'][k % 4]} name={st.title}
                art={k === 2 ? 'jar' : k === 3 ? 'bag' : 'bowl'} split={k % 2 === 0} />
              <p className="eyebrow mt-4">Étape {String(k + 1).padStart(2, '0')}</p>
              <h3 className="mt-1 text-[17px] md:text-[19px]">{st.title}</h3>
              <p className="mt-1 text-[15px]">{st.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Compare() {
  const s = useSettings()
  const { products } = useSiteData()
  const [a, b] = (s.compare_slugs || []).map((slug) => products.find((p) => p.slug === slug))
  if (!a || !b) return null
  const rows = [['Goût', 'taste'], ['Ingrédients', 'main_ingredients'], ['Moment idéal', 'best_moment']]
  const short = (p) => p.name.replace(/^granola\s*/i, '')
  return (
    <section className="section bg-creme-light">
      <div className="container-site">
        <SectionHead title={`${short(a)} ou ${short(b)} ?`} text="Deux recettes, deux caractères. Voici de quoi choisir (ou prendre les deux)." />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[180px_1fr_1fr] md:gap-x-8">
          <div className="hidden md:block" />
          {[a, b].map((p, k) => (
            <Link key={p.id} to={`/produits/${p.slug}`} className="group block">
              <Visual image={p.images?.[0]} themeName={p.theme} name={p.name} art={k ? 'jar' : 'bag'} choco={k === 1} split={k === 0} sizes="(min-width: 768px) 40vw, 50vw" />
              <h3 className="mt-3 text-[18px] underline-offset-4 group-hover:underline md:text-[22px]">{p.name}</h3>
            </Link>
          ))}
          {rows.map(([label, key]) => (
            <div key={key} className="col-span-2 grid grid-cols-2 gap-x-2 border-t border-line py-4 md:col-span-3 md:grid-cols-[180px_1fr_1fr] md:gap-x-8">
              <p className="eyebrow col-span-2 mb-2 md:col-span-1 md:mb-0">{label}</p>
              <p className="text-[15px] text-ink">{a[key] || '—'}</p>
              <p className="text-[15px] text-ink">{b[key] || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Reviews() {
  const [reviews, setReviews] = useState([])
  const track = useRef(null)
  useEffect(() => {
    db().then((supabase) => supabase.from('reviews').select('*').order('sort_order').order('created_at', { ascending: false }))
      .then(({ data }) => setReviews(data || []))
  }, [])
  if (!reviews.length) return null
  const scroll = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <section className="section">
      <div className="container-site">
        <div className="flex items-end justify-between gap-4">
          <SectionHead title="Avis clients" />
          {reviews.length > 1 && (
            <div className="mb-8 flex gap-2">
              <button onClick={() => scroll(-1)} className="border border-line p-2 text-ink hover:border-ink" aria-label="Avis précédents"><ChevronLeft width={18} /></button>
              <button onClick={() => scroll(1)} className="border border-line p-2 text-ink hover:border-ink" aria-label="Avis suivants"><ChevronRight width={18} /></button>
            </div>
          )}
        </div>
        <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto">
          {reviews.map((r) => (
            <figure key={r.id} className="w-[85%] shrink-0 snap-start border border-line p-6 sm:w-[46%] md:w-[32%]">
              <Stars value={r.rating} className="text-ink" />
              <blockquote className="mt-4 font-serif text-[18px] leading-snug text-ink">{r.text}</blockquote>
              {r.image && <Img src={r.image} sizes="(min-width: 768px) 33vw, 85vw" alt="" loading="lazy" className="mt-4 max-h-56 w-full object-cover" />}
              <figcaption className="eyebrow mt-5">{r.name}{r.city ? ` — ${r.city}` : ''}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

const VOTE_KEY = 'gbh-vote'
function voterToken() {
  try {
    let t = localStorage.getItem('gbh-voter')
    if (!t) {
      t = crypto.randomUUID()
      localStorage.setItem('gbh-voter', t)
    }
    return t
  } catch {
    return crypto.randomUUID()
  }
}

function FlavorVote() {
  const [options, setOptions] = useState([])
  const [voted, setVoted] = useState(() => {
    try { return localStorage.getItem(VOTE_KEY) } catch { return null }
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    db().then((supabase) => supabase.rpc('flavor_results')).then(({ data }) => setOptions(data || []))
  }, [])

  if (!options.length) return null
  const total = options.reduce((n, o) => n + Number(o.votes), 0)

  const vote = async (id) => {
    setBusy(true)
    const supabase = await db()
    const { data, error } = await supabase.rpc('cast_vote', { p_option: id, p_token: voterToken() })
    setBusy(false)
    if (error) return
    setOptions(data)
    setVoted(id)
    try { localStorage.setItem(VOTE_KEY, id) } catch { /* ignore */ }
  }

  return (
    <section className="section">
      <div className="container-site grid gap-8 md:grid-cols-2 md:gap-14">
        <div>
          <p className="eyebrow">Sondage</p>
          <h2 className="h2 mt-2">Le prochain goût, c'est vous qui le choisissez</h2>
          <p className="mt-3 max-w-[440px]">Votez pour la saveur que vous aimeriez voir arriver. La plus demandée sera la prochaine recette.</p>
        </div>
        <div>
          <div className="space-y-2">
            {options.map((o) => {
              const pct = total ? Math.round((Number(o.votes) / total) * 100) : 0
              const mine = voted === o.id
              return (
                <button key={o.id} disabled={busy} onClick={() => vote(o.id)}
                  className={`relative block w-full overflow-hidden border px-5 py-4 text-left transition-colors ${mine ? 'border-ink' : 'border-line hover:border-ink'}`}>
                  {voted && <span className="absolute inset-y-0 left-0 bg-creme transition-[width] duration-700" style={{ width: `${pct}%` }} />}
                  <span className="relative flex items-center justify-between gap-3 text-ink">
                    <span>{o.name}{mine && <span className="ml-2 text-[13px] text-muted">votre choix</span>}</span>
                    {voted && <span className="text-[14px] tabular-nums">{pct}%</span>}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[13px] text-muted">
            {voted ? `${total} vote${total > 1 ? 's' : ''} · vous pouvez changer d'avis à tout moment` : "Les résultats s'affichent après votre vote."}
          </p>
        </div>
      </div>
    </section>
  )
}

function reelEmbed(url) {
  const m = String(url || '').match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/)
  return m ? `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed` : null
}

const INSTA_TILES = ['/images/recettes/recette-bol-gourmand.jpg', '/images/recettes/recette-parfait.jpg', '/images/recettes/recette-smoothie-bowl.jpg', '/images/recettes/recette-topping.jpg']

function Instagram() {
  const s = useSettings()
  const reels = (s.reels || []).map(reelEmbed).filter(Boolean)
  // Les vidéos Instagram (Meta) déposent des cookies : on ne les charge qu'après un clic
  const [showReels, setShowReels] = useState(false)
  return (
    <section className="section bg-creme-light">
      <div className="container-site">
        <div className="mb-7 flex items-end justify-between gap-6 md:mb-9">
          <div>
            <p className="eyebrow mb-2">Instagram</p>
            <h2 className="h2">@{s.instagram_handle}</h2>
          </div>
          <a href={safeUrl(s.instagram_url)} target="_blank" rel="noreferrer" className="shrink-0 text-[15px] text-ink underline underline-offset-4 hover:text-bordeaux">
            Suivre
          </a>
        </div>
        {reels.length > 0 && showReels ? (
          <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
            {reels.map((src, k) => (
              <iframe key={src} src={src} title={`Reel Instagram ${k + 1}`} loading="lazy" allow="encrypted-media"
                className="h-[560px] w-[85%] shrink-0 snap-start bg-white md:w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {INSTA_TILES.map((src) => (
              <a key={src} href={safeUrl(s.instagram_url)} target="_blank" rel="noreferrer" aria-label={`Voir @${s.instagram_handle} sur Instagram`} className="media-frame group block aspect-square overflow-hidden">
                <Img src={src} sizes="(min-width: 768px) 25vw, 50vw" alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              </a>
            ))}
          </div>
        )}
        {reels.length > 0 && !showReels && (
          <div className="mt-6 text-center">
            <button className="btn btn-outline" onClick={() => setShowReels(true)}>Voir nos vidéos Instagram</button>
            <p className="mt-2 text-[13px] text-muted">
              Les vidéos sont chargées depuis Instagram, qui peut déposer des cookies. <Link to="/confidentialite" className="underline">En savoir plus</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default function Home() {
  const s = useSettings()
  const { products } = useSiteData()

  return (
    <>
      <Seo description={s.seo_description} />
      <Hero />
      <Collection products={products} />
      <PackFeature />
      <About />
      <Hygiene />
      <Compare />
      <Reviews />
      <FlavorVote />
      <Instagram />
    </>
  )
}
