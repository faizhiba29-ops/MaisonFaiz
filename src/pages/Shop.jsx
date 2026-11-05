import { Link, useParams } from 'react-router'
import { PackCard, ProductCard } from '../components/Product'
import Seo from '../components/Seo'
import { useSiteData } from '../context/SiteData'
import { gridColsClass } from '../lib/format'
import NotFound from './NotFound'

// /boutique (tout) et /boutique/:category (une catégorie)
export default function Shop() {
  const { category } = useParams()
  const { products, packs, categories } = useSiteData()
  const current = category ? categories.find((c) => c.slug === category) : null
  if (category && !current) return <NotFound />

  const list = current ? products.filter((p) => p.category === current.slug) : products
  const title = current ? current.name : 'La boutique'
  const intro = current ? current.description : 'Granolas, sellou et créations maison, préparés à la main à Fès.'
  const tabCls = (active) => `link-underline whitespace-nowrap py-1 ${active ? 'active text-bordeaux' : 'text-ink'}`

  return (
    <>
      <Seo title={title} description={`${intro || title} Livraison partout au Maroc, commande sur WhatsApp.`} />
      <section className="section pb-0">
        <div className="container-site">
          <h1 className="h2">{title}</h1>
          {intro && <p className="mt-2">{intro}</p>}
          <div className="mb-6 mt-8 flex items-center justify-between gap-6 border-b border-line pb-3">
            {categories.length > 1 ? (
              <nav className="no-scrollbar flex gap-6 overflow-x-auto text-[15px]" aria-label="Catégories">
                <Link to="/boutique" className={tabCls(!current)}>Tout</Link>
                {categories.map((c) => (
                  <Link key={c.slug} to={`/boutique/${c.slug}`} className={tabCls(current?.slug === c.slug)}>{c.name}</Link>
                ))}
              </nav>
            ) : <span />}
            <span className="shrink-0 text-[14px] text-muted">{list.length} produit{list.length > 1 ? 's' : ''}</span>
          </div>
          <div className={`grid grid-cols-2 gap-2 ${gridColsClass(list.length)}`}>
            {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>
      {packs.length > 0 && !current && (
        <section className="section">
          <div className="container-site">
            <h2 className="h2">Nos packs</h2>
            <p className="mb-7 mt-2">Pour goûter plusieurs saveurs ou faire plaisir.</p>
            <div className={`grid grid-cols-2 gap-2 ${gridColsClass(list.length)}`}>
              {packs.map((p, i) => <PackCard key={p.id} pack={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
