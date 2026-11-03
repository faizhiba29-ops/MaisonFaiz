import { useEffect, useState } from 'react'
import { ClockIcon } from '../components/Icons'
import { Visual } from '../components/Product'
import Seo from '../components/Seo'
import { Loading } from '../components/Layout'
import { useSettings } from '../context/SiteData'
import { supabase } from '../lib/supabase'

export default function Recipes() {
  const s = useSettings()
  const [recipes, setRecipes] = useState(null)

  useEffect(() => {
    supabase.from('recipes').select('*').order('sort_order').order('created_at')
      .then(({ data }) => setRecipes(data || []))
  }, [])

  const tips = s.storage_tips || []

  return (
    <>
      <Seo title="Comment le déguster" description="Bol classique, bol gourmand, parfait, smoothie bowl, topping sur msemen… nos idées simples pour savourer votre granola." />
      <section className="section">
        <div className="container-site">
          <h1 className="section-title">Comment le déguster ?</h1>
          <p className="section-sub mt-2">Des idées simples et rapides, du petit-déjeuner au goûter.</p>

          {!recipes ? <Loading /> : (
            <div className="grid grid-cols-1 gap-x-2 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((r, k) => (
                <article key={r.id}>
                  <Visual image={r.image} themeName={r.theme} name={r.title} art={k % 3 === 2 ? 'jar' : 'bowl'} split={k % 2 === 0} choco={k % 2 === 1} />
                  <div className="pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[22px]">{r.title}</h2>
                      {r.prep_time && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted">
                          <ClockIcon width={16} height={16} /> {r.prep_time}
                        </span>
                      )}
                    </div>
                    {r.ingredients?.length > 0 && (
                      <p className="mt-2 text-[14px]"><span className="text-ink">Il vous faut :</span> {r.ingredients.join(' · ')}</p>
                    )}
                    {r.steps?.length > 0 && (
                      <ol className="mt-3 space-y-1.5 text-[14px]">
                        {r.steps.map((st, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="font-serif text-[16px] text-bordeaux">{i + 1}.</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {tips.length > 0 && (
        <section className="section bg-creme-light">
          <div className="container-site grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
            <Visual image="/images/produits/classic.jpg" name="Bocal de granola" />
            <div>
              <h2 className="text-[30px] md:text-[38px]">Bien le conserver</h2>
              <ul className="mt-5 space-y-3">
                {tips.map((t, i) => (
                  <li key={i} className="flex gap-3"><span className="text-bordeaux">—</span><span>{t}</span></li>
                ))}
              </ul>
              {s.shelf_life_weeks && (
                <p className="mt-6 border-l-2 border-bordeaux pl-4 text-ink">
                  À consommer dans les <strong>{s.shelf_life_weeks} semaines</strong> pour profiter de tout son croquant.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
