import manifest from 'virtual:responsive-images'

/**
 * <img> qui laisse le navigateur choisir la version WebP adaptée à l'écran (400 / 800 / pleine taille),
 * générée au build pour les photos de public/images. Les photos envoyées depuis l'admin restent telles quelles.
 * `sizes` : largeur affichée de l'image, ex. "(min-width: 768px) 25vw, 50vw".
 */
export const srcSetOf = (src) => manifest[src]?.map(([w, url]) => `${url} ${w}w`).join(', ')

export default function Img({ src, sizes = '100vw', ...props }) {
  const srcSet = srcSetOf(src)
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      decoding="async"
      {...props}
    />
  )
}
