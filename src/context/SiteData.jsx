import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../lib/config'

const SiteDataContext = createContext(null)

// Mise en forme commune au contenu intégré à la page et à celui chargé depuis Supabase
function shape({ settings, products, packs, ingredients, promos, categories }) {
  return {
    settings: Object.fromEntries((settings || []).map((r) => [r.key, r.value])),
    products: products || [],
    packs: packs || [],
    ingredients: ingredients || [],
    promos: promos || [],
    // Seules les catégories qui contiennent au moins un produit visible apparaissent dans la boutique
    categories: (categories || []).filter((c) => (products || []).some((p) => p.category === c.slug)),
  }
}

// Contenu copié dans la page au moment du build (voir scripts/vite-plugins.mjs) : la page s'affiche sans attendre
function readSnapshot() {
  try {
    const el = document.getElementById('site-data')
    return el ? shape(JSON.parse(el.textContent)) : null
  } catch {
    return null
  }
}

const EMPTY = { settings: {}, products: [], packs: [], ingredients: [], promos: [], categories: [] }

// Catalogue, paramètres et promos actives : chargés une fois, partagés par toutes les pages publiques.
// Le contenu intégré est affiché tout de suite, puis remplacé par la version à jour de Supabase.
export function SiteDataProvider({ children }) {
  const [state, setState] = useState(() => {
    const snap = readSnapshot()
    return snap ? { loading: false, error: null, ...snap } : { loading: true, error: null, ...EMPTY }
  })

  const load = useCallback(async () => {
    const supabase = await db()
    const [settings, products, packs, ingredients, promos, categories] = await Promise.all([
      supabase.from('settings').select('key,value'),
      supabase.from('products').select('*').order('sort_order').order('created_at'),
      supabase.from('packs').select('*').order('sort_order').order('created_at'),
      supabase.from('ingredients').select('*').order('sort_order').order('name_fr'),
      supabase.rpc('active_promotions'),
      supabase.from('categories').select('*').order('sort_order').order('name'),
    ])
    const error = [settings, products, packs, ingredients, promos, categories].find((r) => r.error)?.error
    // Hors ligne avec un contenu déjà affiché : on le garde plutôt que d'afficher une erreur
    if (error) return setState((prev) => (prev.loading ? { ...prev, loading: false, error } : prev))
    setState({
      loading: false,
      error: null,
      ...shape({ settings: settings.data, products: products.data, packs: packs.data, ingredients: ingredients.data, promos: promos.data, categories: categories.data }),
    })
  }, [])

  // Avec le contenu intégré, la mise à jour attend la fin du chargement de la page (photos prioritaires)
  const fromSnapshot = useRef(!state.loading)
  useEffect(() => {
    if (!fromSnapshot.current || document.readyState === 'complete') return void load()
    const run = () => load()
    window.addEventListener('load', run, { once: true })
    return () => window.removeEventListener('load', run)
  }, [load])

  const value = useMemo(() => ({ ...state, reload: load }), [state, load])
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSiteData() {
  return useContext(SiteDataContext)
}

export function useSettings() {
  return useContext(SiteDataContext).settings
}
