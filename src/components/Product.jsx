import { Link } from 'react-router'
import { useCart } from '../context/Cart'
import { useSiteData } from '../context/SiteData'
import { activeWeights, formatDH, priceFor } from '../lib/format'
import { displayPrice, hasAutoPromo } from '../lib/pricing'
import { theme } from '../lib/themes'
import { BagArt, BowlArt, DuoArt, JarArt } from './Art'

const ART = { bag: BagArt, jar: JarArt, bowl: BowlArt, duo: DuoArt }

/**
 * Visuel carré : photo uploadée, ou illustration sur fond coloré (aplat ou coupe en diagonale).
 * `hoverImage` : 2e photo qui apparaît au survol (desktop).
 */
export function Visual({ image, hoverImage, themeName, name, art = 'bag', overlay, split = true, choco, eager, className = '', children }) {
  const t = theme(themeName)
  const Art = ART[art] || BagArt
  const bg = split ? `linear-gradient(135deg, ${t.a} 0 58%, ${t.b} 58% 100%)` : t.a
  return (
    <div className={`group/visual media-frame relative aspect-square overflow-hidden ${className}`} style={{ background: bg }}>
      {image ? (
        <>
          <img
            src={image}
            alt={name}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/visual:scale-[1.03]"
          />
          {hoverImage && (
            <img src={hoverImage} alt="" loading="lazy" aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover/visual:opacity-100" />
          )}
        </>
      ) : (
        <div className="absolute inset-[8%] transition-transform duration-700 group-hover/visual:scale-105">
          <Art name={name} seed={name} choco={choco} />
        </div>
      )}
      {/* Texte incrusté seulement sur les illustrations : les vraies photos portent déjà l'étiquette du produit */}
      {overlay && !image && (
        <span
          className="pointer-events-none absolute left-[7%] top-[7%] max-w-[70%] font-sans text-[clamp(12px,2.6vw,20px)] font-semibold uppercase leading-[1.05] tracking-wide"
          style={{ color: t.text }}
        >
          {overlay}
        </span>
      )}
      {children}
    </div>
  )
}

export function Badge({ kind }) {
  const styles = {
    promo: ['bg-bordeaux', 'Promo'],
    new: ['bg-chocolat', 'Nouveau'],
    best: ['bg-ink', 'Best-seller'],
    soldout: ['bg-neutral-400', 'Épuisé'],
  }
  const [cls, label] = styles[kind]
  return <span className={`badge ${cls}`}>{label}</span>
}

export function productBadges(product, promos, kind = 'product') {
  const out = []
  if (!product.available) out.push('soldout')
  if (hasAutoPromo(promos, kind, product.id)) out.push('promo')
  if (product.is_new) out.push('new')
  if (product.is_bestseller) out.push('best')
  return out
}

export function PriceTag({ price, original, className = '', prefix }) {
  return (
    <span className={`price inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      {prefix && <span className="text-muted">{prefix}</span>}
      {original != null && <s className="text-muted">{formatDH(original)}</s>}
      <span className={original != null ? 'text-bordeaux' : ''}>{formatDH(price)}</span>
    </span>
  )
}

const productArt = (p) => (p.category === 'sellou' ? 'bowl' : p.sort_order % 2 === 0 ? 'jar' : 'bag')
const isChoco = (p) => /chocolat|ferrero/i.test(p.name)

export function ProductVisual({ product, eager, overlay = true, index = 0 }) {
  return (
    <Visual
      image={product.images?.[0]}
      hoverImage={product.images?.[1]}
      themeName={product.theme}
      name={product.name}
      art={productArt(product)}
      overlay={overlay ? product.overlay_text : null}
      split={index % 3 !== 1}
      choco={isChoco(product)}
      eager={eager}
    />
  )
}

export function ProductCard({ product, index = 0 }) {
  const { promos } = useSiteData()
  const weights = activeWeights(product)
  const from = weights[0]
  const dp = from ? displayPrice(promos, 'product', product.id, priceFor(product, from)) : null
  const badges = productBadges(product, promos)

  return (
    <Link to={`/produits/${product.slug}`} className="group block">
      <div className="relative">
        <ProductVisual product={product} index={index} />
        {badges.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {badges.slice(0, 2).map((b) => <Badge key={b} kind={b} />)}
          </div>
        )}
      </div>
      <div className="pb-5 pt-3">
        <h3 className="text-[16px] leading-snug underline-offset-4 group-hover:underline md:text-[18px]">{product.name}</h3>
        <div className="mt-1">
          {!product.available ? (
            <span className="price text-muted">Bientôt disponible</span>
          ) : dp ? (
            <PriceTag price={dp.price} original={dp.original} prefix={weights.length > 1 ? 'À partir de' : null} />
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export function packContents(pack, products) {
  return (pack.items || [])
    .map((it) => {
      const p = products.find((x) => x.id === it.product_id)
      return p ? `${it.weight} ${p.name}` : null
    })
    .filter(Boolean)
}

export function PackCard({ pack, index = 0 }) {
  const { promos, products } = useSiteData()
  const { add } = useCart()
  const dp = displayPrice(promos, 'pack', pack.id, Number(pack.price))
  const contents = packContents(pack, products)

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <Visual image={pack.image} themeName={pack.theme} name={pack.name} art="duo" split={index % 2 === 0} overlay={contents.length ? `${contents.length} granolas` : null} />
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {!pack.available && <Badge kind="soldout" />}
          {dp.promo && <Badge kind="promo" />}
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <h3 className="text-[16px] md:text-[18px]">{pack.name}</h3>
        {contents.length > 0 && <p className="text-sm text-muted">{contents.join(' + ')}</p>}
        <div className="mb-3 mt-1"><PriceTag price={dp.price} original={dp.original} /></div>
        <button
          className="btn btn-outline mt-auto w-full"
          disabled={!pack.available}
          onClick={() => add({ type: 'pack', id: pack.id }, pack.name)}
        >
          {pack.available ? 'Ajouter au panier' : 'Bientôt disponible'}
        </button>
      </div>
    </div>
  )
}
