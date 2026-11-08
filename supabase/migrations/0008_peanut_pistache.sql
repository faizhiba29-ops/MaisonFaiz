-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — Peanut Spread en vente et nouveau Granola Pistache
-- ════════════════════════════════════════════════════════════════

-- ─── Nouveaux ingrédients ──────────────────────────────────────
insert into public.ingredients (slug, name_fr, name_ar, icon, benefits, allergen, sort_order) values
  ('pistache',        'Pistaches',        'الفستق',        '🟢', 'Fruit à coque au goût doux, source de protéines et de fibres.', true, 12),
  ('beurre-pistache', 'Beurre de pistache', 'زبدة الفستق', '🟢', 'Pistaches finement broyées, pour un goût de pistache intense.', true, 13),
  ('lait-concentre',  'Lait concentré',   'الحليب المركز', '🥛', 'Apporte une note lactée et légèrement caramélisée. Contient du lait.', true, 14),
  ('huile-olive',     'Huile d''olive',   'زيت الزيتون',   '🫒', 'Pour un granola doré et croustillant, et une pâte à tartiner onctueuse.', false, 15)
on conflict (slug) do nothing;

-- ─── Peanut Spread : en vente, 250g à 55 DH ───────────────────
update public.products set
  name = 'Peanut Spread',
  name_ar = 'كريمة الكاوكاو',
  description = 'Pâte à tartiner aux cacahuètes, préparée maison avec du miel et de l''huile d''olive. Onctueuse et naturellement gourmande : sur une tartine, des crêpes ou à la cuillère.',
  prices = '{"250g": {"price": 55, "on": true, "sort": 0}}',
  ingredient_ids = array(select id from public.ingredients where slug in ('cacahuetes', 'miel', 'huile-olive')),
  images = array['/images/produits/peanut-spread.jpg', '/images/produits/etiquette-peanut-spread.jpg'],
  main_ingredients = 'Cacahuètes, miel, huile d''olive',
  theme = 'kraft',
  is_new = true,
  available = true,
  visible = true
where slug = 'pate-a-tartiner-cacahuete';

-- ─── Granola Pistache : 70 / 140 / 250 DH ─────────────────────
insert into public.products (slug, name, name_ar, description, category, prices, ingredient_ids, is_new,
                             available, visible, sort_order, theme, overlay_text, taste, main_ingredients, best_moment)
select 'granola-pistache', 'Granola Pistache', 'غرانولا بالفستق',
       'Le petit nouveau : des flocons d''avoine dorés au miel et à l''huile d''olive, des pistaches, du beurre de pistache et une touche de lait concentré. Gourmand, croquant et fondant à la fois.',
       'granola',
       '{"250g": {"price": 70, "on": true, "sort": 0}, "500g": {"price": 140, "on": true, "sort": 1}, "1kg": {"price": 250, "on": true, "sort": 2}}',
       array(select id from public.ingredients where slug in ('avoine', 'miel', 'pistache', 'beurre-pistache', 'lait-concentre', 'huile-olive')),
       true, true, true, 6, 'creme', 'NOUVEAU',
       'Gourmand, pistache et lait concentré',
       'Avoine, pistaches, beurre de pistache, lait concentré, miel',
       'Le goûter ou un dessert avec un yaourt'
on conflict (slug) do nothing;
