import { useEffect } from 'react'

const SITE = 'Granola by Hiba'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Titre, description et Open Graph de la page courante. */
export default function Seo({ title, description, image }) {
  useEffect(() => {
    const full = title ? `${title} · ${SITE}` : `${SITE} — Granola fait maison à Fès`
    document.title = full
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', window.location.href)
    if (image) setMeta('property', 'og:image', image)
  }, [title, description, image])
  return null
}
