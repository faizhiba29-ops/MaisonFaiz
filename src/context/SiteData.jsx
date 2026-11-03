import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const SiteDataContext = createContext(null)

// Catalogue, paramètres et promos actives : chargés une fois, partagés par toutes les pages publiques.
export function SiteDataProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    settings: {},
    products: [],
    packs: [],
    ingredients: [],
    promos: [],
  })

  const load = useCallback(async () => {
    const [settings, products, packs, ingredients, promos] = await Promise.all([
      supabase.from('settings').select('key,value'),
      supabase.from('products').select('*').order('sort_order').order('created_at'),
      supabase.from('packs').select('*').order('sort_order').order('created_at'),
      supabase.from('ingredients').select('*').order('sort_order').order('name_fr'),
      supabase.rpc('active_promotions'),
    ])
    const error = [settings, products, packs, ingredients, promos].find((r) => r.error)?.error
    setState({
      loading: false,
      error,
      settings: Object.fromEntries((settings.data || []).map((r) => [r.key, r.value])),
      products: products.data || [],
      packs: packs.data || [],
      ingredients: ingredients.data || [],
      promos: promos.data || [],
    })
  }, [])

  useEffect(() => {
    load()
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
