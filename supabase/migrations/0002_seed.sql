-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — contenu de départ (tout est modifiable dans /admin)
-- ════════════════════════════════════════════════════════════════

-- ─── Paramètres ────────────────────────────────────────────────
insert into public.settings (key, value) values
  ('whatsapp_number', '"212618145078"'),
  ('whatsapp_display', '"06 18 14 50 78"'),
  ('instagram_handle', '"maison_faiz_foods"'),
  ('instagram_url', '"https://www.instagram.com/maison_faiz_foods/"'),
  ('reels', '["", "", ""]'),
  ('announcement_ar', '"التوصيل لجميع مدن المغرب"'),
  ('announcement_fr', '"Livraison partout au Maroc"'),
  ('hero_title', '"Le granola fait maison, préparé à Fès"'),
  ('hero_subtitle', '"Croquant, gourmand et sans conservateurs. Livré partout au Maroc."'),
  ('hero_subtitle_ar', '"غرانولا منزلية"'),
  ('hero_images', '[]'),
  ('about_title', '"Qui suis-je ?"'),
  ('about_text', '"Salam, moi c''est Hiba. Étudiante à Fès, j''ai commencé à préparer mon granola à la maison pour avoir un petit-déjeuner sain et gourmand pendant mes révisions. Mes proches l''ont goûté… et m''en ont redemandé ! Aujourd''hui je prépare chaque fournée à la main, en petites quantités, avec des ingrédients que je sélectionne moi-même : flocons d''avoine, miel, fruits secs et vrai chocolat. Pas de conservateurs, pas de raccourcis — juste du fait maison, comme à la maison."'),
  ('about_image', '""'),
  ('delivery_fee', '0'),
  ('free_delivery_from', 'null'),
  ('delivery_delay', '"24 à 72h selon la ville"'),
  ('delivery_info', '"Fès : livraison rapide. Autres villes : envoi par transporteur, frais confirmés sur WhatsApp selon votre ville."'),
  ('shelf_life_weeks', '4'),
  ('storage_tips', '["Conservez votre granola dans un bocal hermétique, bien fermé après chaque utilisation.", "Gardez-le dans un endroit sec, à l''abri de la chaleur et du soleil.", "Évitez le réfrigérateur : l''humidité lui fait perdre son croquant.", "Utilisez une cuillère bien sèche pour vous servir."]'),
  ('why_homemade',      '[{"icon": "🚫", "title": "Zéro conservateur", "text": "Préparé en petites fournées, rien d''artificiel pour le faire durer."}, {"icon": "🌰", "title": "Ingrédients choisis", "text": "Avoine, fruits secs et miel sélectionnés un par un."}, {"icon": "🍯", "title": "Sucre contrôlé", "text": "Sucré au miel, juste ce qu''il faut — bien moins que les granolas industriels."}, {"icon": "⚡", "title": "Énergie pour la journée", "text": "Fibres + bonnes graisses = une énergie qui dure jusqu''au déjeuner."}]'),
  ('hygiene_steps', '[{"title": "Sélection des ingrédients", "text": "Avoine, amandes, noix, miel… je choisis chaque ingrédient avec soin.", "image": ""}, {"title": "Mélange avec le miel", "text": "Tout est mélangé à la main avec le miel, charlotte et gants portés.", "image": ""}, {"title": "Cuisson", "text": "Cuisson lente au four pour un croquant doré, surveillée de près.", "image": ""}, {"title": "Emballage soigné", "text": "Une fois refroidi, le granola est mis en sachet kraft fermé, prêt à partir.", "image": ""}]'),
  ('compare_slugs', '["granola-classic", "granola-chocolat"]'),
  ('seo_description', '"Maison Faiz foods : granola et sellou faits maison à Fès. Classic, Chocolat Noir, Ferrero Rocher, Lite et Sellou. Livraison partout au Maroc, commande sur WhatsApp."'),
  ('city', '"Fès"')
on conflict (key) do nothing;

-- ─── Ingrédients ───────────────────────────────────────────────
insert into public.ingredients (slug, name_fr, name_ar, icon, benefits, allergen, sort_order) values
  ('avoine',     'Flocons d''avoine',          'الشوفان',   '🌾', 'Riches en fibres (bêta-glucanes), ils apportent une énergie durable et rassasient longtemps.', false, 1),
  ('miel',       'Miel',                       'العسل',     '🍯', 'Sucrant naturel qui apporte de l''énergie rapide et des antioxydants.', false, 2),
  ('amandes',    'Amandes',                    'اللوز',     '🌰', 'Bonnes graisses, vitamine E, magnésium et protéines.', true, 3),
  ('noix',       'Noix',                       'الݣوز',     '🧠', 'Oméga-3 végétaux, bonnes pour le cerveau et la concentration — idéal pendant les révisions.', true, 4),
  ('noisettes',  'Noisettes',                  'البندق',    '🌰', 'Vitamine E et bonnes graisses. La star du granola Ferrero Rocher.', true, 5),
  ('cacahuetes', 'Cacahuètes',                 'الكاوكاو',  '🥜', 'Protéines végétales et énergie, parfaites avant le sport.', true, 6),
  ('raisins',    'Raisins secs',               'الزبيب',    '🍇', 'Sucres naturels, fer et potassium.', false, 7),
  ('chocolat',   'Chocolat noir',              'الشكلاط',   '🍫', 'Antioxydants (flavonoïdes), plaisir et bonne humeur.', false, 8),
  ('sesame',     'Graines de sésame',          'الجنجلان',  '⚪', 'Calcium et minéraux.', true, 9),
  ('lin-courge', 'Graines de lin & de courge', 'الزريعة',   '🎃', 'Fibres, oméga-3 et zinc.', false, 10),
  ('cannelle',   'Cannelle',                   'القرفة',    '🟤', 'Un goût chaleureux, et elle aide à réguler la glycémie.', false, 11)
on conflict (slug) do nothing;

-- ─── Produits ──────────────────────────────────────────────────
insert into public.products (slug, name, name_ar, description, category, ingredient_ids, is_new, is_bestseller,
                             sort_order, theme, overlay_text, taste, main_ingredients, best_moment)
values
  ('granola-classic', 'Granola Classic', 'غرانولا كلاسيك',
   'Le granola de base, celui par lequel tout a commencé. Des flocons d''avoine dorés au miel, des amandes, des noix et une touche de cannelle. Croquant, doux et pas trop sucré : parfait chaque matin.',
   'granola', array(select id from public.ingredients where slug in ('avoine','miel','amandes','noix','raisins','sesame','cannelle')),
   false, false, 1, 'kraft', '100% FAIT MAISON',
   'Croquant, doux, notes de miel et de cannelle',
   'Avoine, miel, amandes, noix, raisins secs',
   'Le petit-déjeuner, avec du lait froid ou un yaourt'),

  ('granola-chocolat', 'Granola Chocolat Noir', 'غرانولا بالشكلاط',
   'Notre best-seller. Le croquant du granola maison avec de généreux morceaux de chocolat noir. Gourmand sans être écœurant, il fait l''unanimité chez les petits comme chez les grands.',
   'granola', array(select id from public.ingredients where slug in ('avoine','miel','amandes','noix','cacahuetes','chocolat')),
   false, true, 2, 'chocolat', 'BEST-SELLER',
   'Gourmand, chocolaté et bien croquant',
   'Avoine, miel, chocolat noir, amandes, cacahuètes',
   'Le goûter, ou un snack pendant les révisions'),

  ('granola-ferrero-rocher', 'Granola Ferrero Rocher', 'غرانولا فيريرو روشي',
   'La version la plus gourmande : noisettes torréfiées, chocolat et miel, inspirée de la célèbre bouchée. Un vrai dessert à la cuillère, à savourer avec un yaourt ou directement du bocal.',
   'granola', array(select id from public.ingredients where slug in ('avoine','miel','noisettes','chocolat','amandes')),
   false, true, 3, 'bordeaux', 'SANS CONSERVATEURS',
   'Noisette, chocolat, très gourmand',
   'Avoine, noisettes, chocolat noir, miel',
   'Un dessert ou un petit plaisir l''après-midi'),

  ('granola-lite', 'Granola Lite', 'غرانولا لايت',
   'La version légère : moins de miel, pas de chocolat, plus de graines. Toujours croquant, idéal si vous surveillez votre sucre ou pour un en-cas avant le sport.',
   'granola', array(select id from public.ingredients where slug in ('avoine','miel','amandes','lin-courge','cannelle')),
   true, false, 4, 'creme', 'NOUVEAU',
   'Léger, peu sucré, notes de graines toastées',
   'Avoine, graines de lin et de courge, amandes',
   'Avant ou après le sport'),

  ('sellou', 'Sellou', 'سلو',
   'Le sellou traditionnel, préparé comme à la maison pour le ftour ou avec un bon thé : farine grillée, amandes, sésame, miel et épices. Riche, parfumé et nourrissant.',
   'sellou', array(select id from public.ingredients where slug in ('amandes','sesame','miel','cannelle')),
   true, false, 5, 'rose', 'NOUVEAU',
   'Grillé, parfumé à l''anis et à la cannelle',
   'Farine grillée, amandes, sésame, miel',
   'Au ftour ou avec un thé à la menthe')
on conflict (slug) do nothing;

-- ─── Packs ─────────────────────────────────────────────────────
insert into public.packs (slug, name, description, items, price, sort_order, theme)
select 'pack-duo', 'Pack Duo',
       'Le meilleur des deux mondes : 250g de Granola Classic + 250g de Granola Chocolat. Idéal pour goûter ou pour offrir.',
       jsonb_build_array(
         jsonb_build_object('product_id', (select id from public.products where slug = 'granola-classic'), 'weight', '250g'),
         jsonb_build_object('product_id', (select id from public.products where slug = 'granola-chocolat'), 'weight', '250g')),
       95, 1, 'bordeaux'
where not exists (select 1 from public.packs where slug = 'pack-duo');

-- ─── Recettes ──────────────────────────────────────────────────
insert into public.recipes (title, prep_time, ingredients, steps, theme, sort_order)
select * from (values
  ('Bol classique', '2 min',
   array['4 c. à soupe de granola', 'Lait froid ou lait d''amande'],
   array['Versez le granola dans un bol.', 'Ajoutez le lait bien froid.', 'Dégustez tout de suite pour garder le croquant.'],
   'kraft', 1),
  ('Bol gourmand', '5 min',
   array['1 yaourt nature', '4 c. à soupe de granola', '1 banane', '1 filet de pâte à tartiner'],
   array['Versez le yaourt dans un bol.', 'Ajoutez la banane en rondelles.', 'Parsemez de granola et terminez par un filet de pâte à tartiner.'],
   'chocolat', 2),
  ('Parfait en verre', '5 min',
   array['Yaourt grec', 'Fruits rouges', 'Granola'],
   array['Dans un verre, alternez une couche de yaourt grec, une couche de fruits rouges et une couche de granola.', 'Répétez jusqu''en haut du verre.', 'Terminez par du granola pour le croquant.'],
   'rose', 3),
  ('Smoothie bowl', '7 min',
   array['1 banane congelée', '3 dattes dénoyautées', '1 petit verre de lait', 'Granola croquant'],
   array['Mixez la banane, les dattes et le lait jusqu''à obtenir une texture épaisse.', 'Versez dans un bol.', 'Ajoutez une bonne poignée de granola sur le dessus.'],
   'bordeaux', 4),
  ('Snack nature', '0 min',
   array['Une poignée de granola'],
   array['Une poignée directement du bocal, pendant les études ou avant le sport. C''est tout !'],
   'creme', 5),
  ('Topping gourmand', '2 min',
   array['Crêpes, pancakes, msemen ou glace', 'Granola'],
   array['Préparez vos crêpes, pancakes ou msemen (ou servez une boule de glace).', 'Parsemez généreusement de granola pour ajouter du croquant.'],
   'kraft', 6),
  ('Petit-déj marocain revisité', '3 min',
   array['Amlou ou miel', 'Granola', 'Pain ou msemen (optionnel)'],
   array['Versez un peu d''amlou ou de miel dans un petit bol.', 'Ajoutez le granola par-dessus.', 'À déguster à la cuillère ou avec du pain, avec un thé bien chaud.'],
   'chocolat', 7)
) as v(title, prep_time, ingredients, steps, theme, sort_order)
where not exists (select 1 from public.recipes);

-- ─── FAQ ───────────────────────────────────────────────────────
insert into public.faqs (question, answer, sort_order)
select * from (values
  ('Livrez-vous partout au Maroc ? Combien coûte la livraison et en combien de temps ?',
   'Oui, on livre partout au Maroc ! À Fès la livraison est rapide ; pour les autres villes, l''envoi se fait par transporteur en 24 à 72h. Les frais dépendent de votre ville et vous sont confirmés sur WhatsApp avant l''envoi.', 1),
  ('Comment commander ?',
   'Ajoutez vos granolas au panier, remplissez vos coordonnées puis cliquez sur « Envoyer ma commande sur WhatsApp ». Votre commande arrive directement chez Hiba, qui vous confirme tout par message.', 2),
  ('Quels sont les prix et les poids ?',
   'Tous les granolas existent en 250g (55 DH), 500g (110 DH) et 1kg (200 DH au lieu de 220 DH). Le Pack Duo (250g Classic + 250g Chocolat) est à 95 DH.', 3),
  ('Peut-on avoir un granola sans miel ?',
   'Oui, sur demande ! Précisez-le dans la remarque de votre commande ou écrivez-nous sur WhatsApp, et Hiba vous prépare une fournée adaptée.', 4),
  ('Quels sont les ingrédients ? (Chnahuwa gouz ?)',
   'Flocons d''avoine, miel, amandes, noix (gouz = noix ), noisettes, cacahuètes, raisins secs, chocolat noir, sésame, graines et cannelle selon les recettes. Chaque fiche produit détaille ses ingrédients, et la page « Bienfaits » explique à quoi sert chacun.', 5),
  ('Combien de temps se conserve le granola ?',
   'Environ 4 semaines dans un bocal hermétique, dans un endroit sec et à l''abri de la chaleur. Comme il n''y a aucun conservateur, mieux vaut le consommer frais — ce qui n''est jamais un problème ', 6),
  ('Contient-il des allergènes ?',
   'Oui : nos granolas contiennent des fruits à coque (amandes, noix, noisettes), des cacahuètes, du sésame et de l''avoine (gluten). En cas d''allergie, contactez-nous avant de commander.', 7)
) as v(question, answer, sort_order)
where not exists (select 1 from public.faqs);

-- ─── Vote des goûts ────────────────────────────────────────────
insert into public.flavor_options (name, emoji, sort_order)
select * from (values ('Framboise', '🍓', 1), ('Pistache', '🟢', 2), ('Coco', '🥥', 3), ('Caramel', '🍮', 4)) as v(name, emoji, sort_order)
where not exists (select 1 from public.flavor_options);


-- Aucun avis client n'est pré-rempli : ajoutez de vrais avis depuis /admin (la section se masque tant qu'il n'y en a pas).

-- ─── Illustrations de départ (public/images) — remplaçables depuis /admin ──
update public.ingredients set image = '/images/ingredients/' || slug || '.jpg' where coalesce(image, '') = '';
update public.recipes r set image = '/images/recettes/' || v.file || '.jpg'
from (values ('Bol classique', 'recette-bol-lait'), ('Bol gourmand', 'recette-bol-gourmand'),
             ('Parfait en verre', 'recette-parfait'), ('Smoothie bowl', 'recette-smoothie-bowl'),
             ('Snack nature', 'recette-snack'), ('Topping gourmand', 'recette-topping'),
             ('Petit-déj marocain revisité', 'recette-amlou')) as v(title, file)
where r.title = v.title and coalesce(r.image, '') = '';
update public.products p set images = v.imgs
from (values ('granola-classic', array['/images/produits/classic.jpg', '/images/produits/etiquette-classic.jpg', '/images/recettes/recette-bol-lait.jpg']),
             ('granola-chocolat', array['/images/produits/chocolat.jpg', '/images/produits/etiquette-chocolat.jpg', '/images/recettes/recette-bol-gourmand.jpg']),
             ('granola-ferrero-rocher', array['/images/produits/ferrero.jpg', '/images/produits/etiquette-ferrero.jpg']),
             ('granola-lite', array['/images/produits/lite.jpg', '/images/recettes/recette-smoothie-bowl.jpg']),
             ('sellou', array['/images/produits/sellou.jpg', '/images/produits/etiquette-sellou.jpg'])) as v(slug, imgs)
where p.slug = v.slug and cardinality(p.images) = 0;
update public.packs set image = '/images/produits/pack-duo.jpg' where slug = 'pack-duo' and coalesce(image, '') = '';
update public.settings set value = '["/images/site/hero-1.jpg"]' where key = 'hero_images' and value = '[]'::jsonb;
update public.settings set value = (
  select jsonb_agg(case when coalesce(step->>'image', '') = '' then step || jsonb_build_object('image', '/images/site/' || f.file || '.jpg') else step end order by ord)
  from jsonb_array_elements(value) with ordinality as e(step, ord)
  left join (values (1, 'etape-1-ingredients'), (2, 'etape-2-melange'), (3, 'etape-3-cuisson'), (4, 'etape-4-emballage')) as f(n, file) on f.n = e.ord
) where key = 'hygiene_steps';
