-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — passage en boutique multi-catégories
-- Catégories gérées dans /admin, conservation par produit,
-- pâtes à tartiner préparées mais cachées (à activer depuis /admin).
-- ════════════════════════════════════════════════════════════════

-- ─── Catégories ────────────────────────────────────────────────
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
drop policy if exists "admin all" on public.categories;
create policy "admin all" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read" on public.categories;
create policy "public read" on public.categories for select using (true);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;

insert into public.categories (slug, name, description, sort_order) values
  ('granola', 'Granolas', 'Préparés à la main en petites fournées, sans conservateurs.', 1),
  ('sellou', 'Sellou', 'Le sellou traditionnel, comme à la maison.', 2),
  ('pates-a-tartiner', 'Pâtes à tartiner', 'Des pâtes à tartiner faites maison, aux fruits secs sélectionnés.', 3),
  ('autre', 'Autres', null, 9)
on conflict (slug) do nothing;

-- La liste fixe (granola / sellou / autre) est remplacée par la table des catégories
alter table public.products drop constraint if exists products_category_check;
alter table public.products drop constraint if exists products_category_fkey;
alter table public.products add constraint products_category_fkey
  foreign key (category) references public.categories (slug) on update cascade on delete restrict;

-- ─── Conservation propre à chaque produit (vide = texte des Paramètres) ───
alter table public.products add column if not exists conservation text;

-- ─── Pâtes à tartiner : préparées, cachées, sans prix ──────────
-- À activer dans /admin → Produits : ajouter photos, prix et ingrédients (allergènes !), puis cocher « Visible » et « Disponible ».
insert into public.products (slug, name, name_ar, description, category, prices, ingredient_ids,
                             is_new, available, visible, sort_order, theme)
values
  ('pate-a-tartiner-chocolat', 'Pâte à tartiner Chocolat', 'كريمة الشكلاط',
   'Une pâte à tartiner gourmande au chocolat, préparée maison. Sur une tartine, des crêpes ou à la cuillère.',
   'pates-a-tartiner', '{"250g": {"price": null, "on": false, "sort": 0}}',
   '{}',
   true, false, false, 20, 'chocolat'),
  ('pate-a-tartiner-cacahuete', 'Pâte à tartiner Cacahuète', 'كريمة الكاوكاو',
   'Une pâte de cacahuètes onctueuse, préparée maison. Parfaite au petit-déjeuner ou avant le sport.',
   'pates-a-tartiner', '{"250g": {"price": null, "on": false, "sort": 0}}',
   '{}',
   true, false, false, 21, 'kraft'),
  ('pate-a-tartiner-amande', 'Pâte à tartiner Amande', 'كريمة اللوز',
   'Une pâte d''amandes douce et fine, préparée maison.',
   'pates-a-tartiner', '{"250g": {"price": null, "on": false, "sort": 0}}',
   '{}',
   true, false, false, 22, 'creme')
on conflict (slug) do nothing;
