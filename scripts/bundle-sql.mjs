// Assemble toutes les migrations en un seul fichier à coller dans Supabase → SQL Editor.
// Usage : npm run db:bundle  →  supabase/setup_complet.sql
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('../supabase/migrations/', import.meta.url)
const files = readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort()

const header = `-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — installation complète d'une nouvelle base Supabase
-- Généré par « npm run db:bundle » à partir de supabase/migrations/ (ne pas modifier à la main)
--
-- 1. Supabase → SQL Editor → New query
-- 2. Coller TOUT ce fichier, puis « Run »
-- 3. Créer le compte admin : Authentication → Users → Add user (cocher Auto Confirm User)
-- 4. Exécuter la requête « COMPTE ADMIN » tout en bas, avec le bon email
-- 5. Authentication → Sign In / Providers : désactiver « Allow new users to sign up »
--
-- Contenu : ${files.join(', ')}
-- ════════════════════════════════════════════════════════════════
`

const body = files.map((f) => `\n\n-- ┌──────────────────────────────────────────────────────────────\n-- │ ${f}\n-- └──────────────────────────────────────────────────────────────\n\n${readFileSync(new URL(f, dir), 'utf8').trim()}\n`).join('')

const footer = `

-- ════════════════════════════════════════════════════════════════
-- COMPTE ADMIN — à exécuter APRÈS avoir créé l'utilisateur dans Authentication → Users
-- (retirer les deux tirets au début de la ligne et mettre le bon email)
-- ════════════════════════════════════════════════════════════════
-- insert into public.admins (user_id) select id from auth.users where email = 'admin@exemple.com';
`

writeFileSync(new URL('../supabase/setup_complet.sql', import.meta.url), header + body + footer)
console.log(`supabase/setup_complet.sql (${files.length} migrations)`)
