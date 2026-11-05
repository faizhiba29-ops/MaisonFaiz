import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronDown, MinusIcon, PlusIcon } from '../components/Icons'
import { Badge, PriceTag, ProductCard, ProductVisual, productBadges, Visual } from '../components/Product'
import Seo from '../components/Seo'
import { useCart } from '../context/Cart'
import { useSettings, useSiteData } from '../context/SiteData'
import { activeWeights, bulkSaving, formatDH, priceFor } from '../lib/format'
import { displayPrice } from '../lib/pricing'
import NotFound from './NotFound'

function Gallery({ product }) {
  const images = (product.images || []).filter(Boolean)
  const [active, setActive] = useState(0)
  const track = useRef(null)

  if (images.length <= 1) return <ProductVisual product={product} eager overlay={false} />

  const go = (k) => {
    setActive(k)
    track.current?.scrollTo({ left: k * track.current.clientWidth, behavior: 'smooth' })
  }

  return (
    <div>
      <div
        ref={track}
        onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((src, k) => (
          <div key={src} className="w-full shrink-0 snap-center">
            <Visual image={src} themeName={product.theme} name={product.name} eager={k === 0} />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {images.map((src, k) => (
          <button key={src} onClick={() => go(k)} aria-label={`Photo ${k + 1}`}
            className={`aspect-square overflow-hidden border ${k === active ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

// Ligne repliable (ingrédients, livraison…)
function Collapsible({ title, children, open }) {
  return (
    <details className="group border-b border-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown width={18} className="shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-[15px]">{children}</div>
    </details>
  )
}

export default function ProductPage() {
  const { slug } = useParams()
  return <Product key={slug} slug={slug} />
}

function Product({ slug }) {
  const { products, ingredients, promos } = useSiteData()
  const s = useSettings()
  const { add } = useCart()
  const navigate = useNavigate()
  const product = products.find((p) => p.slug === slug)
  const weights = product ? activeWeights(product) : []
  const [choice, setWeight] = useState(null)
  const [qty, setQty] = useState(1)
  const weight = weights.includes(choice) ? choice : weights.includes('500g') ? '500g' : weights[0] || null

  if (!product) return <NotFound />

  const base = weight ? priceFor(product, weight) : 0
  const dp = displayPrice(promos, 'product', product.id, base)
  const saving = bulkSaving(product)
  const badges = productBadges(product, promos)
  const ings = (product.ingredient_ids || []).map((id) => ingredients.find((i) => i.id === id)).filter(Boolean)
  const allergens = ings.filter((i) => i.allergen)
  const canBuy = product.available && weight
  const others = products.filter((p) => p.id !== product.id).slice(0, 4)

  // Texte propre au produit, sinon le texte général (pensé pour le granola et le sellou)
  const conservation = product.conservation
    || (['granola', 'sellou'].includes(product.category) && s.shelf_life_weeks
      ? `À conserver dans un bocal hermétique, au sec et à l'abri de la chaleur. À consommer dans les ${s.shelf_life_weeks} semaines.`
      : null)

  const addToCart = () => add({ type: 'product', id: product.id, weight, qty }, `${weight} ${product.name}`)

  return (
    <>
      <Seo title={product.name} description={(product.description || '').slice(0, 155)} image={product.images?.[0]} />

      <section className="container-site grid gap-8 pb-12 pt-6 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pb-16 md:pt-10">
        <div className="md:sticky md:top-24 md:self-start">
          <Gallery product={product} />
        </div>

        <div className="md:max-w-[480px]">
          <p className="eyebrow">Maison Faiz foods</p>
          <h1 className="mt-2 text-[34px] leading-[1.15] md:text-[44px]">{product.name}</h1>
          {badges.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{badges.map((b) => <Badge key={b} kind={b} />)}</div>}

          <div className="mt-4">
            {product.available
              ? <PriceTag price={dp.price} original={dp.original} className="!text-[18px]" />
              : <span className="price text-muted">Bientôt disponible</span>}
          </div>
          <p className="mt-1 text-[13px] text-muted">Livraison partout au Maroc · commande confirmée sur WhatsApp</p>

          {weights.length > 0 && (
            <fieldset className="mt-7" disabled={!product.available}>
              <legend className="mb-2 text-[14px] text-ink">Format</legend>
              <div className="flex flex-wrap gap-2">
                {weights.map((w) => (
                  <button key={w} type="button" onClick={() => setWeight(w)} aria-pressed={weight === w}
                    className={`rounded-full border px-5 py-2 text-[15px] transition-colors ${weight === w ? 'border-ink bg-ink text-white' : 'border-ink/30 text-ink hover:border-ink'}`}>
                    {w}
                  </button>
                ))}
              </div>
              {saving && (
                <p className="mt-3 text-[14px] text-muted">
                  {saving.weight} : {formatDH(saving.actual)} au lieu de {formatDH(saving.reference)}, soit {formatDH(saving.saved)} d'économie.
                </p>
              )}
            </fieldset>
          )}

          {canBuy ? (
            <>
              <div className="mt-6">
                <p className="mb-2 text-[14px] text-ink">Quantité</p>
                <div className="inline-flex items-center border border-ink/30 text-ink">
                  <button className="px-4 py-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer"><MinusIcon width={14} /></button>
                  <span className="w-8 text-center tabular-nums">{qty}</span>
                  <button className="px-4 py-3" onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Augmenter"><PlusIcon width={14} /></button>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <button className="btn btn-outline w-full" onClick={addToCart}>Ajouter au panier</button>
                <button className="btn btn-primary w-full" onClick={() => { addToCart(); navigate('/panier') }}>Commander sur WhatsApp</button>
              </div>
            </>
          ) : (
            <button className="btn mt-7 w-full" disabled>Bientôt disponible</button>
          )}

          {product.description && <p className="mt-8 whitespace-pre-line">{product.description}</p>}

          <div className="mt-8 border-t border-line">
            {ings.length > 0 && (
              <Collapsible title="Ingrédients">
                <p>
                  {ings.map((i, k) => (
                    <span key={i.id}>
                      {k > 0 && ', '}
                      <Link to={`/bienfaits#${i.slug}`} className="text-ink underline underline-offset-2 hover:text-bordeaux">{i.name_fr}</Link>
                    </span>
                  ))}.
                </p>
                {allergens.length > 0 && <p className="mt-2">Allergènes : {allergens.map((a) => a.name_fr.toLowerCase()).join(', ')}.</p>}
              </Collapsible>
            )}
            {product.category === 'granola' && (
              <Collapsible title="Comment le déguster">
                <p>Avec du lait froid, sur un yaourt, en smoothie bowl, sur des crêpes ou un msemen, ou simplement à la poignée.</p>
                <Link to="/comment-le-deguster" className="mt-2 inline-block text-ink underline underline-offset-2">Voir les idées recettes</Link>
              </Collapsible>
            )}
            <Collapsible title="Livraison">
              <p>Livraison partout au Maroc{s.delivery_delay ? `, ${s.delivery_delay}` : ''}.</p>
              {s.delivery_info && <p className="mt-2">{s.delivery_info}</p>}
            </Collapsible>
            {conservation && (
              <Collapsible title="Conservation">
                <p className="whitespace-pre-line">{conservation}</p>
              </Collapsible>
            )}
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section border-t border-line">
          <div className="container-site">
            <h2 className="h2 mb-8">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {others.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
