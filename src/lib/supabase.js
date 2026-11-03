import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Une clé secrète ne doit jamais être dans le site : tout ce qui commence par VITE_ est visible par les visiteurs.
export const keyProblem = !url || !key || /COLLER_ICI/.test(key)
  ? 'missing'
  : !/^https:\/\/[^/@]+\.supabase\.co\/?$/.test(url)
    ? 'url'
    : key.startsWith('sb_secret_')
      ? 'secret'
      : null

export const isConfigured = keyProblem === null

export const supabase = isConfigured ? createClient(url, key) : null
