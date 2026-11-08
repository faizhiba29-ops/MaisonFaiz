import { createClient } from '@supabase/supabase-js'
import { isConfigured, key, url } from './config'

export { isConfigured, keyProblem } from './config'

export const supabase = isConfigured ? createClient(url, key) : null
