// Configuration Supabase, sans charger le client (lourd) : il est importé à la demande via db().
export const url = import.meta.env.VITE_SUPABASE_URL
export const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Une clé secrète ne doit jamais être dans le site : tout ce qui commence par VITE_ est visible par les visiteurs.
export const keyProblem = !url || !key || /COLLER_ICI/.test(key)
  ? 'missing'
  : !/^https:\/\/[^/@]+\.supabase\.co\/?$/.test(url)
    ? 'url'
    : key.startsWith('sb_secret_')
      ? 'secret'
      : null

export const isConfigured = keyProblem === null

// Client Supabase chargé après le premier affichage de la page
export const db = () => import('./supabase').then((m) => m.supabase)
