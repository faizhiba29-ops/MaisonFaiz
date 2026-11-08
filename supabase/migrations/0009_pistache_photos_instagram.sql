-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — photos du Granola Pistache et des nouveaux ingrédients,
-- compte Instagram de la nouvelle marque
-- (chaque valeur n'est remplacée que si elle est encore vide ou à l'ancienne valeur)
-- ════════════════════════════════════════════════════════════════

update public.products
set images = array['/images/produits/pistache.jpg', '/images/produits/pistache-bol.jpg', '/images/produits/pistache-chia.jpg']
where slug = 'granola-pistache' and cardinality(images) = 0;

update public.ingredients set image = '/images/ingredients/' || slug || '.jpg'
where slug in ('pistache', 'beurre-pistache', 'lait-concentre', 'huile-olive') and coalesce(image, '') = '';

update public.settings set value = '"maison_faiz_foods"'
where key = 'instagram_handle' and value = '"granola_byhiba"'::jsonb;
update public.settings set value = '"https://www.instagram.com/maison_faiz_foods/"'
where key = 'instagram_url' and value = '"https://www.instagram.com/granola_byhiba/"'::jsonb;
