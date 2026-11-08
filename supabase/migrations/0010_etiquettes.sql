-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — étiquette en 2e photo (affichée au survol) pour
-- le Granola Lite, le Granola Pistache et le Peanut Spread, comme les autres produits.
-- N'ajoute l'étiquette que si elle n'est pas déjà dans la galerie.
-- ════════════════════════════════════════════════════════════════

update public.products set images = images[1:1] || '/images/produits/etiquette-lite.jpg'::text || images[2:]
where slug = 'granola-lite' and cardinality(images) > 0 and not ('/images/produits/etiquette-lite.jpg' = any(images));

update public.products set images = images[1:1] || '/images/produits/etiquette-pistache.jpg'::text || images[2:]
where slug = 'granola-pistache' and cardinality(images) > 0 and not ('/images/produits/etiquette-pistache.jpg' = any(images));

update public.products set images = images[1:1] || '/images/produits/etiquette-peanut-spread.jpg'::text || images[2:]
where slug = 'pate-a-tartiner-cacahuete' and cardinality(images) > 0 and not ('/images/produits/etiquette-peanut-spread.jpg' = any(images));
