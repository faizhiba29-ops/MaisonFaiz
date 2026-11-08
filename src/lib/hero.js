// Photo du hero sur téléphone : celle choisie dans l'admin (Paramètres → Accueil), sinon le recadrage
// vertical livré avec le site pour les photos « produit à gauche, espace libre à droite ».
const MOBILE_CROPS = { '/images/site/hero-1.jpg': '/images/site/hero-1-mobile.jpg' }

export function mobileHeroImages(settings) {
  const images = (settings.hero_images || []).filter(Boolean)
  if (settings.hero_image_mobile) return [settings.hero_image_mobile]
  return images.map((src) => MOBILE_CROPS[src] || src)
}
