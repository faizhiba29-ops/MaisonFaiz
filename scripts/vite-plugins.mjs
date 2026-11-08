// Optimisations de chargement appliquées au build (npm run build / Vercel). Rien ne change en développement.
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { loadEnv } from 'vite'

const WIDTHS = [400, 800, 1600]
const VIRTUAL = 'virtual:responsive-images'

/**
 * Photos du dossier public/images : une version WebP en 400 / 800 / pleine taille (max 1600 px) de chacune,
 * avec une empreinte dans le nom (mise en cache permanente). Le site lit la correspondance via
 * `import manifest from 'virtual:responsive-images'` → { '/images/produits/x.jpg': [[400, '/assets/img/…webp'], …] }.
 */
export function responsiveImages({ dir = 'public/images', skip = [] } = {}) {
  let root = process.cwd()
  let isBuild = false
  const manifest = {}
  const files = []

  async function walk(d) {
    const out = []
    for (const e of await readdir(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) out.push(...await walk(p))
      else out.push(p)
    }
    return out
  }

  return {
    name: 'maison-faiz:responsive-images',
    configResolved(c) {
      root = c.root
      isBuild = c.command === 'build'
    },
    resolveId: (id) => (id === VIRTUAL ? '\0' + VIRTUAL : null),
    load: (id) => (id === '\0' + VIRTUAL ? `export default ${JSON.stringify(manifest)}` : null),
    async buildStart() {
      if (!isBuild) return
      const base = path.join(root, dir)
      const list = (await walk(base))
        .filter((f) => /\.(jpe?g|png)$/i.test(f) && !skip.includes(path.relative(base, f).split(path.sep)[0]))
      await Promise.all(list.map(async (file) => {
        const rel = path.relative(base, file).split(path.sep).join('/')
        const input = await readFile(file)
        const { width } = await sharp(input).metadata()
        const widths = [...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS.at(-1))].filter((w, k, all) => all.indexOf(w) === k)
        const slug = rel.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-')
        manifest[`/images/${rel}`] = await Promise.all(widths.map(async (w) => {
          const source = await sharp(input).resize({ width: w }).webp({ quality: 74, effort: 6 }).toBuffer()
          const fileName = `assets/img/${slug}-${w}-${createHash('sha256').update(source).digest('hex').slice(0, 8)}.webp`
          files.push({ fileName, source })
          return [w, `/${fileName}`]
        }))
      }))
    },
    generateBundle() {
      for (const f of files) this.emitFile({ type: 'asset', fileName: f.fileName, source: f.source })
    },
    api: { manifest },
  }
}

export const srcSet = (variants) => variants.map(([w, url]) => `${url} ${w}w`).join(', ')

/**
 * Page d'accueil prête plus vite :
 * - contenu du site (catalogue, paramètres) copié dans la page au moment du build : affichage immédiat,
 *   puis mise à jour depuis Supabase en arrière-plan ;
 * - photo principale et polices du haut de page préchargées ;
 * - CSS intégré à la page (plus de fichier qui bloque l'affichage).
 */
export function fastFirstPaint({ images }) {
  let env = {}
  let isBuild = false

  async function snapshot() {
    const url = env.VITE_SUPABASE_URL
    const key = env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) return null
    const headers = { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }
    const get = async (p, init) => {
      const r = await fetch(`${url}/rest/v1/${p}`, { headers, signal: AbortSignal.timeout(10000), ...init })
      if (!r.ok) throw new Error(`${p} → HTTP ${r.status}`)
      return r.json()
    }
    try {
      const [settings, products, packs, ingredients, promos, categories] = await Promise.all([
        get('settings?select=key,value'),
        get('products?select=*&order=sort_order,created_at'),
        get('packs?select=*&order=sort_order,created_at'),
        get('ingredients?select=*&order=sort_order,name_fr'),
        get('rpc/active_promotions', { method: 'POST', body: '{}' }),
        get('categories?select=*&order=sort_order,name'),
      ])
      return { settings, products, packs, ingredients, promos, categories }
    } catch (e) {
      console.warn(`[fast-first-paint] contenu non intégré (${e.message}) : la page le chargera depuis Supabase.`)
      return null
    }
  }

  return {
    name: 'maison-faiz:fast-first-paint',
    configResolved(c) {
      isBuild = c.command === 'build'
      env = loadEnv(c.mode, c.envDir || c.root, 'VITE_')
    },
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        if (!isBuild || !ctx.bundle) return html
        const tags = []

        // CSS intégré
        html = html.replace(/<link rel="stylesheet"[^>]*href="\/([^"]+\.css)"[^>]*>/g, (tag, file) => {
          const css = ctx.bundle[file]?.source
          return css ? `<style>${String(css)}</style>` : tag
        })

        // Polices visibles dès l'ouverture (titres Cardo, texte Archivo)
        for (const re of [/cardo-latin-400-normal-[^/]+\.woff2$/, /archivo-latin-400-normal-[^/]+\.woff2$/]) {
          const file = Object.keys(ctx.bundle).find((f) => re.test(f))
          if (file) tags.push({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' }, injectTo: 'head' })
        }

        const data = await snapshot()
        if (data) {
          const json = JSON.stringify(data).replace(/</g, '\\u003c')
          tags.push({ tag: 'script', attrs: { id: 'site-data', type: 'application/json' }, children: json, injectTo: 'body-prepend' })
          // Photo principale de l'accueil
          const hero = data.settings.find((r) => r.key === 'hero_images')?.value?.find(Boolean)
          if (hero) {
            const v = images.api.manifest[hero]
            tags.push({
              tag: 'link',
              attrs: v
                ? { rel: 'preload', as: 'image', imagesrcset: srcSet(v), imagesizes: '(min-width: 768px) 100vw, 200vw', fetchpriority: 'high' }
                : { rel: 'preload', as: 'image', href: hero, fetchpriority: 'high' },
              injectTo: 'head',
            })
          }
        }
        return { html, tags }
      },
    },
  }
}
