import { useState } from 'react'
import { PackCard, ProductCard } from '../components/Product'
import Seo from '../components/Seo'
import { useSiteData } from '../context/SiteData'
import { gridColsClass } from '../lib/format'

const TABS = [
  ['all', 'Tout'],
  ['granola', 'Granolas'],
  ['sellou', 'Sellou'],
  ['autre', 'Autres'],
]

export default function Shop() {
  const { products, packs } = useSiteData()
  const [tab, setTab] = useState('all')
  const tabs = TABS.filter(([k]) => k === 'all' || products.some((p) => p.category === k))
  const list = tab === 'all' ? products : products.filter((p) => p.category === tab)

  return (
    <>
      <Seo title="Nos granolas" description="Granola Classic, Chocolat, Ferrero Rocher, Lite, Sellou et packs : tous faits maison à Fès. 250g, 500g ou 1kg, livraison partout au Maroc." />
      <section className="section pb-0">
        <div className="container-site">
          <h1 className="h2">Nos granolas</h1>
          <p className="mt-2">En 250g, 500g ou 1kg. Préparés à la main en petites fournées.</p>
          <div className="mb-6 mt-8 flex items-center justify-between gap-6 border-b border-line pb-3">
            {tabs.length > 2 ? (
            <div className="no-scrollbar flex gap-6 overflow-x-auto text-[15px]">
              {tabs.map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`link-underline whitespace-nowrap py-1 ${tab === k ? 'active text-bordeaux' : 'text-ink'}`}>
                  {label}
                </button>
              ))}
            </div>
            ) : <span />}
            <span className="shrink-0 text-[14px] text-muted">{list.length} produit{list.length > 1 ? 's' : ''}</span>
          </div>
          <div className={`grid grid-cols-2 gap-2 ${gridColsClass(list.length)}`}>
            {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>
      {packs.length > 0 && (tab === 'all') && (
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
