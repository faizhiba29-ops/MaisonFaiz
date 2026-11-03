import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import Seo from '../components/Seo'
import { useSettings, useSiteData } from '../context/SiteData'
import { theme } from '../lib/themes'

const THEMES = ['kraft', 'creme', 'rose', 'kraft', 'creme', 'rose']

export default function Benefits() {
  const s = useSettings()
  const { ingredients, products } = useSiteData()
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-bordeaux')
    const t = setTimeout(() => el.classList.remove('ring-2', 'ring-bordeaux'), 2200)
    return () => clearTimeout(t)
  }, [hash])

  const why = s.why_homemade || []

  return (
    <>
      <Seo title="Les bienfaits du granola" description="Avoine, miel, amandes, noix, chocolat noir… découvrez les bienfaits de chaque ingrédient de nos granolas faits maison." />
      <section className="section pb-0">
        <div className="container-site">
          <h1 className="section-title">Les bienfaits</h1>
          <p lang="ar" className="text-center text-[18px] text-muted">فوائد الغرانولا</p>
          <p className="section-sub mt-2">Ce qu'il y a dans votre bocal, et pourquoi c'est bon pour vous.</p>
        </div>
      </section>

      {why.length > 0 && (
        <section className="section">
          <div className="container-site">
            <h2 className="mb-8 text-center text-[26px] md:text-[32px]">Pourquoi le granola fait maison ?</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {why.map((w, k) => (
                <div key={k} className="bg-creme p-5 md:p-7">
                  <span className="eyebrow">{String(k + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-[18px] md:text-[20px]">{w.title}</h3>
                  <p className="mt-1 text-[14px]">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section pt-0">
        <div className="container-site">
          <h2 className="mb-8 text-center text-[26px] md:text-[32px]">Ingrédient par ingrédient</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ingredients.map((ing, k) => {
              const t = theme(THEMES[k % THEMES.length])
              const inProducts = products.filter((p) => p.ingredient_ids?.includes(ing.id))
              return (
                <article key={ing.id} id={ing.slug} className="flex scroll-mt-28 flex-col border border-line transition-shadow">
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${t.a} 0 60%, ${t.b} 60% 100%)` }}>
                    {ing.image
                      ? <img src={ing.image} alt={ing.name_fr} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      : <span className="text-[64px]">{ing.icon}</span>}
                    {ing.allergen && <span className="badge absolute bottom-3 left-3 bg-chocolat">Fruit à coque / allergène</span>}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[22px]">{ing.name_fr}</h3>
                      {ing.name_ar && <span lang="ar" className="text-[20px] text-bordeaux">{ing.name_ar}</span>}
                    </div>
                    <p className="mt-2 text-[15px]">{ing.benefits}</p>
                    {inProducts.length > 0 && (
                      <p className="mt-auto pt-4 text-[13px] text-muted">
                        On le retrouve dans :{' '}
                        {inProducts.map((p, i) => (
                          <span key={p.id}>
                            {i > 0 && ', '}
                            <Link to={`/produits/${p.slug}`} className="text-ink underline underline-offset-2">{p.name}</Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <p className="mx-auto mt-10 max-w-[640px] text-center text-[13px] text-muted">
            Informations à titre indicatif, elles ne remplacent pas un avis médical.
            Contient des fruits à coque (allergènes).
          </p>
        </div>
      </section>
    </>
  )
}
