import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MinusIcon, PlusIcon } from '../components/Icons'
import { Badge, PackCard, PriceTag, ProductCard, Visual } from '../components/Product'
import Seo from '../components/Seo'
import { useCart } from '../context/Cart'
import { useSettings, useSiteData } from '../context/SiteData'
import { formatDH, priceFor } from '../lib/format'
import { displayPrice } from '../lib/pricing'
import { deliveryPromise } from '../lib/delivery'
import NotFound from './NotFound'
import { Collapsible, Gallery, GALLERY_SIZES } from './Product'

export default function PackPage() {
  const { slug } = useParams()
  return <Pack key={slug} slug={slug} />
}

function Pack({ slug }) {
  const { packs, products, ingredients, promos } = useSiteData()
  const s = useSettings()
  const { add } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const pack = packs.find((p) => p.slug === slug)

  if (!pack) return <NotFound />

  const dp = displayPrice(promos, 'pack', pack.id, Number(pack.price))
  // Contenu du pack : produit, format et prix à l'unité
  const lines = (pack.items || [])
    .map((it) => {
      const product = products.find((p) => p.id === it.product_id)
      return product ? { product, weight: it.weight, price: priceFor(product, it.weight) } : null
    })
    .filter(Boolean)
  const separate = lines.every((l) => l.price) ? lines.reduce((sum, l) => sum + Number(l.price), 0) : 0
  const saved = separate - dp.price

  const ingIds = [...new Set(lines.flatMap((l) => l.product.ingredient_ids || []))]
  const ings = ingIds.map((id) => ingredients.find((i) => i.id === id)).filter(Boolean)
  const allergens = ings.filter((i) => i.allergen)
  const conservation = lines.some((l) => ['granola', 'sellou'].includes(l.product.category)) && s.shelf_life_weeks
    ? `À conserver dans un bocal hermétique, au sec et à l'abri de la chaleur. À consommer dans les ${s.shelf_life_weeks} semaines.`
    : null

  const images = [...new Set([pack.image, ...lines.map((l) => l.product.images?.[0])].filter(Boolean))]
  const otherPacks = packs.filter((p) => p.id !== pack.id)
  const inside = lines.map((l) => l.product).filter((p, k, all) => all.indexOf(p) === k).slice(0, 4)

  const addToCart = () => add({ type: 'pack', id: pack.id, qty }, pack.name)

  return (
    <>
      <Seo title={pack.name} description={(pack.description || lines.map((l) => `${l.weight} ${l.product.name}`).join(' + ')).slice(0, 155)} image={pack.image} />

      <section className="container-site grid gap-8 pb-12 pt-6 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pb-16 md:pt-10">
        <div className="md:sticky md:top-24 md:self-start">
          <Gallery
            product={{ images, theme: pack.theme, name: pack.name }}
            single={<Visual image={images[0]} themeName={pack.theme} name={pack.name} art="duo" eager sizes={GALLERY_SIZES} />}
          />
        </div>

        <div className="md:max-w-[480px]">
          <p className="eyebrow">Pack · Maison Faiz foods</p>
          <h1 className="mt-2 text-[34px] leading-[1.15] md:text-[44px]">{pack.name}</h1>
          {(!pack.available || dp.promo) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {!pack.available && <Badge kind="soldout" />}
              {dp.promo && <Badge kind="promo" />}
            </div>
          )}

          <div className="mt-4">
            {pack.available
              ? <PriceTag price={dp.price} original={dp.original} className="!text-[18px]" />
              : <span className="price text-muted">Bientôt disponible</span>}
          </div>
          {pack.available && saved > 0 && (
            <p className="mt-1 text-[14px] text-ink">
              Au lieu de {formatDH(separate)} séparément, soit <strong className="font-medium text-bordeaux">{formatDH(saved)} d'économie</strong>.
            </p>
          )}
          <p className="mt-1 text-[13px] text-muted">{deliveryPromise(s)}</p>

          {lines.length > 0 && (
            <div className="mt-7">
              <p className="mb-2 text-[14px] text-ink">Ce pack contient</p>
              <ul className="divide-y divide-line border-y border-line">
                {lines.map((l, k) => (
                  <li key={k}>
                    <Link to={`/produits/${l.product.slug}`} className="group flex items-center gap-3 py-3">
                      <span className="w-14 shrink-0">
                        <Visual image={l.product.images?.[0]} themeName={l.product.theme} name={l.product.name} sizes="56px" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-ink underline-offset-4 group-hover:underline">{l.product.name}</span>
                        <span className="text-[13px] text-muted">{l.weight}</span>
                      </span>
                      {l.price > 0 && <span className="price text-[14px] text-muted">{formatDH(l.price)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pack.available ? (
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

          {pack.description && <p className="mt-8 whitespace-pre-line">{pack.description}</p>}

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
            <Collapsible title="Livraison">
              <p>{deliveryPromise(s)}{s.delivery_delay ? ` · ${s.delivery_delay}` : ''}.</p>
              {s.delivery_info && <p className="mt-2">{s.delivery_info}</p>}
            </Collapsible>
            {conservation && (
              <Collapsible title="Conservation">
                <p>{conservation}</p>
              </Collapsible>
            )}
          </div>
        </div>
      </section>

      {otherPacks.length > 0 && (
        <section className="section border-t border-line">
          <div className="container-site">
            <h2 className="h2 mb-8">Nos autres packs</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {otherPacks.map((p, i) => <PackCard key={p.id} pack={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {inside.length > 0 && (
        <section className="section border-t border-line">
          <div className="container-site">
            <h2 className="h2 mb-8">Les produits du pack</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {inside.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
