-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — schéma, sécurité (RLS) et fonctions serveur
-- À exécuter dans Supabase > SQL Editor (ou `supabase db push`)
-- ════════════════════════════════════════════════════════════════

-- ─── Admin ──────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated
  using (user_id = auth.uid());

-- ─── Paramètres (clé / valeur) ─────────────────────────────────
create table if not exists public.settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Ingrédients / bienfaits ───────────────────────────────────
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_ar text,
  icon text,                 -- emoji
  image text,
  benefits text,
  allergen boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Produits ──────────────────────────────────────────────────
-- prices : {"250g": {"price": 55, "on": true}, "500g": {...}, "1kg": {...}}
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text,
  description text,
  category text not null default 'granola' check (category in ('granola', 'sellou', 'autre')),
  images text[] not null default '{}',
  prices jsonb not null default '{"250g":{"price":55,"on":true},"500g":{"price":110,"on":true},"1kg":{"price":200,"on":true}}',
  ingredient_ids uuid[] not null default '{}',
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  available boolean not null default true,
  visible boolean not null default true,
  sort_order int not null default 0,
  theme text not null default 'kraft',          -- couleur de fond du visuel
  overlay_text text,                            -- texte incrusté sur la photo
  taste text,                                   -- comparaison : goût
  main_ingredients text,                        -- comparaison : ingrédients principaux
  best_moment text,                             -- comparaison : moment idéal
  created_at timestamptz not null default now()
);

-- ─── Packs ─────────────────────────────────────────────────────
-- items : [{"product_id": "...", "weight": "250g"}]
create table if not exists public.packs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  image text,
  items jsonb not null default '[]',
  price numeric(10,2) not null check (price >= 0),
  available boolean not null default true,
  visible boolean not null default true,
  sort_order int not null default 0,
  theme text not null default 'bordeaux',
  created_at timestamptz not null default now()
);

-- ─── Promotions ────────────────────────────────────────────────
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'percent' check (kind in ('percent', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  target text not null default 'all' check (target in ('all', 'products', 'packs')),
  product_ids uuid[] not null default '{}',
  pack_ids uuid[] not null default '{}',
  code text,                       -- vide = appliquée automatiquement
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  banner_text text,
  usage_limit int check (usage_limit is null or usage_limit > 0),
  usage_count int not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists promotions_code_key on public.promotions (lower(code)) where code is not null and code <> '';

-- ─── Recettes ──────────────────────────────────────────────────
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image text,
  prep_time text,
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  theme text not null default 'creme',
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Avis clients ──────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  text text not null,
  rating int not null default 5 check (rating between 1 and 5),
  image text,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── FAQ ───────────────────────────────────────────────────────
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Vote des goûts ────────────────────────────────────────────
create table if not exists public.flavor_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.flavor_votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.flavor_options on delete cascade,
  voter_token text not null unique,
  created_at timestamptz not null default now()
);

-- ─── Commandes ─────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  created_at timestamptz not null default now(),
  status text not null default 'nouvelle'
    check (status in ('nouvelle', 'confirmee', 'preparation', 'expediee', 'livree', 'annulee')),
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  note text,
  items jsonb not null,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  promo_code text,
  admin_note text
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- ════════════════════════════════════════════════════════════════
-- RLS : lecture publique du contenu, écriture réservée à l'admin
-- ════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['settings','ingredients','products','packs','promotions','recipes',
                           'reviews','faqs','flavor_options','flavor_votes','orders']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "public read" on public.settings;
create policy "public read" on public.settings for select using (true);
drop policy if exists "public read" on public.ingredients;
create policy "public read" on public.ingredients for select using (true);
drop policy if exists "public read" on public.products;
create policy "public read" on public.products for select using (visible);
drop policy if exists "public read" on public.packs;
create policy "public read" on public.packs for select using (visible);
drop policy if exists "public read" on public.recipes;
create policy "public read" on public.recipes for select using (visible);
drop policy if exists "public read" on public.reviews;
create policy "public read" on public.reviews for select using (visible);
drop policy if exists "public read" on public.faqs;
create policy "public read" on public.faqs for select using (true);
drop policy if exists "public read" on public.flavor_options;
create policy "public read" on public.flavor_options for select using (true);
-- promotions, flavor_votes, orders : aucune lecture publique (codes promo et données clients protégés)

-- ════════════════════════════════════════════════════════════════
-- Fonctions de calcul des prix (côté serveur)
-- ════════════════════════════════════════════════════════════════

-- Promo en cours de validité ?
create or replace function public._promo_live(p public.promotions)
returns boolean language sql stable as $$
  select p.active
     and (p.starts_at is null or p.starts_at <= now())
     and (p.ends_at is null or p.ends_at >= now())
     and (p.usage_limit is null or p.usage_count < p.usage_limit);
$$;

-- La promo cible-t-elle cet article ? (p_kind = 'product' | 'pack')
create or replace function public._promo_applies(p public.promotions, p_kind text, p_id uuid)
returns boolean language sql immutable as $$
  select p.target = 'all'
      or (p.target = 'products' and p_kind = 'product' and p_id = any(p.product_ids))
      or (p.target = 'packs' and p_kind = 'pack' and p_id = any(p.pack_ids));
$$;

-- Remise par unité (le montant fixe est appliqué par article)
create or replace function public._promo_unit_discount(p public.promotions, p_base numeric)
returns numeric language sql immutable as $$
  select case when p.kind = 'percent' then round(p_base * least(p.value, 100) / 100, 2)
              else least(p.value, p_base) end;
$$;

-- Promotions actives visibles par le public (sans révéler les codes)
create or replace function public.active_promotions()
returns table (id uuid, kind text, value numeric, target text, product_ids uuid[], pack_ids uuid[],
               banner_text text, is_auto boolean, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.kind, p.value, p.target, p.product_ids, p.pack_ids, p.banner_text,
         coalesce(p.code, '') = '' as is_auto, p.ends_at
  from public.promotions p
  where public._promo_live(p)
  order by p.created_at desc;
$$;

-- Devis du panier : prix, promos auto, code promo, livraison.
-- p_items : [{"type":"product","id":"…","weight":"500g","qty":1}, {"type":"pack","id":"…","qty":2}]
create or replace function public.quote_cart(p_items jsonb, p_code text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_item jsonb;
  v_kind text;
  v_id uuid;
  v_weight text;
  v_qty int;
  v_prod public.products;
  v_pack public.packs;
  v_name text;
  v_base numeric;
  v_disc numeric;
  v_promo_id uuid;
  v_unit numeric;
  v_line numeric;
  v_lines jsonb := '[]';
  v_promo_ids uuid[] := '{}';
  v_removed int := 0;
  v_subtotal numeric := 0;
  v_eligible numeric := 0;
  v_code_disc numeric := 0;
  v_code public.promotions;
  v_code_status text := null;
  v_fee numeric := 0;
  v_free_from numeric;
begin
  -- Garde-fous : un panier est une liste raisonnable, un code reste court
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 50 then
    raise exception 'Panier invalide.';
  end if;
  if length(coalesce(p_code, '')) > 40 then p_code := null; end if;

  if p_code is not null and btrim(p_code) <> '' then
    select * into v_code from public.promotions p
      where lower(p.code) = lower(btrim(p_code)) and public._promo_live(p)
      limit 1;
    v_code_status := case when found then 'ok' else 'invalid' end;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_kind := coalesce(v_item->>'type', 'product');
    v_qty := greatest(1, least(50, coalesce((v_item->>'qty')::int, 1)));
    v_weight := null;
    begin
      v_id := (v_item->>'id')::uuid;
    exception when others then
      v_removed := v_removed + 1; continue;
    end;

    if v_kind = 'pack' then
      select * into v_pack from public.packs where id = v_id and visible and available;
      if not found then v_removed := v_removed + 1; continue; end if;
      v_name := v_pack.name;
      v_base := v_pack.price;
    else
      v_kind := 'product';
      v_weight := v_item->>'weight';
      select * into v_prod from public.products where id = v_id and visible and available;
      if not found or v_weight is null
         or not coalesce((v_prod.prices->v_weight->>'on')::boolean, false) then
        v_removed := v_removed + 1; continue;
      end if;
      v_name := v_prod.name;
      v_base := (v_prod.prices->v_weight->>'price')::numeric;
    end if;

    -- meilleure promo automatique pour cet article
    v_disc := 0; v_promo_id := null;
    select p.id, public._promo_unit_discount(p, v_base) into v_promo_id, v_disc
      from public.promotions p
      where coalesce(p.code, '') = '' and public._promo_live(p) and public._promo_applies(p, v_kind, v_id)
      order by 2 desc limit 1;
    v_disc := coalesce(v_disc, 0);
    if v_promo_id is not null and not v_promo_id = any(v_promo_ids) then
      v_promo_ids := v_promo_ids || v_promo_id;
    end if;

    v_unit := greatest(v_base - v_disc, 0);
    v_line := v_unit * v_qty;
    v_subtotal := v_subtotal + v_line;

    -- code promo
    if v_code_status = 'ok' and public._promo_applies(v_code, v_kind, v_id) then
      v_eligible := v_eligible + v_line;
      if v_code.kind = 'fixed' and v_code.target <> 'all' then
        v_code_disc := v_code_disc + least(v_code.value, v_unit) * v_qty;
      end if;
    end if;

    v_lines := v_lines || jsonb_build_object(
      'type', v_kind, 'id', v_id, 'weight', v_weight, 'qty', v_qty, 'name', v_name,
      'base_price', v_base, 'unit_price', v_unit, 'line_total', v_line);
  end loop;

  if v_code_status = 'ok' then
    if v_eligible = 0 then
      v_code_status := 'not_applicable';
    elsif v_code.kind = 'percent' then
      v_code_disc := round(v_eligible * least(v_code.value, 100) / 100, 2);
    elsif v_code.target = 'all' then
      v_code_disc := least(v_code.value, v_eligible);
    end if;
  end if;
  if v_code_status is distinct from 'ok' then v_code_disc := 0; end if;

  select (value #>> '{}')::numeric into v_fee from public.settings where key = 'delivery_fee';
  select (value #>> '{}')::numeric into v_free_from from public.settings where key = 'free_delivery_from';
  v_fee := coalesce(v_fee, 0);
  if jsonb_array_length(v_lines) = 0 or (v_free_from is not null and v_subtotal - v_code_disc >= v_free_from) then
    v_fee := 0;
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'removed', v_removed,
    'subtotal', v_subtotal,
    'discount', v_code_disc,
    'delivery_fee', v_fee,
    'total', greatest(v_subtotal - v_code_disc, 0) + v_fee,
    'promo_ids', to_jsonb(v_promo_ids),
    'code', case when v_code_status is null then null else jsonb_build_object(
      'code', upper(btrim(p_code)),
      'status', v_code_status,
      'promo_id', case when v_code_status = 'ok' then v_code.id end,
      'label', case when v_code_status <> 'ok' then null
                    when v_code.kind = 'percent' then '-' || trim_scale(v_code.value) || '%'
                    else '-' || trim_scale(v_code.value) || ' DH' end) end
  );
end;
$$;

-- Enregistre la commande (statut « nouvelle ») à partir d'un devis recalculé côté serveur.
create or replace function public.place_order(p_items jsonb, p_code text, p_customer jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_quote jsonb;
  v_name text := left(btrim(coalesce(p_customer->>'name', '')), 120);
  v_phone text := left(btrim(coalesce(p_customer->>'phone', '')), 30);
  v_city text := left(btrim(coalesce(p_customer->>'city', '')), 80);
  v_address text := left(btrim(coalesce(p_customer->>'address', '')), 400);
  v_note text := nullif(left(btrim(coalesce(p_customer->>'note', '')), 1000), '');
  v_order public.orders;
  v_code_ok boolean;
begin
  if v_name = '' or v_phone = '' or v_city = '' or v_address = '' then
    raise exception 'Merci de remplir nom, téléphone, ville et adresse.';
  end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 9 then
    raise exception 'Numéro de téléphone invalide.';
  end if;
  -- anti-spam : 5 commandes max par numéro et par heure, 20 par minute pour tout le site
  if (select count(*) from public.orders
      where regexp_replace(phone, '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g')
        and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Trop de commandes envoyées, merci de réessayer plus tard.';
  end if;
  if (select count(*) from public.orders where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Trop de commandes en ce moment, merci de réessayer dans une minute.';
  end if;

  v_quote := public.quote_cart(p_items, p_code);
  if jsonb_array_length(v_quote->'lines') = 0 then
    raise exception 'Votre panier est vide.';
  end if;
  v_code_ok := coalesce(v_quote->'code'->>'status' = 'ok', false);

  insert into public.orders (customer_name, phone, city, address, note, items, subtotal, discount,
                             delivery_fee, total, promo_code)
  values (v_name, v_phone, v_city, v_address, v_note, v_quote->'lines',
          (v_quote->>'subtotal')::numeric, (v_quote->>'discount')::numeric,
          (v_quote->>'delivery_fee')::numeric, (v_quote->>'total')::numeric,
          case when v_code_ok then v_quote->'code'->>'code' end)
  returning * into v_order;

  update public.promotions set usage_count = usage_count + 1
  where id in (select (jsonb_array_elements_text(v_quote->'promo_ids'))::uuid)
     or (v_code_ok and id = (v_quote->'code'->>'promo_id')::uuid);

  return v_quote || jsonb_build_object('order_id', v_order.id, 'order_number', v_order.number);
end;
$$;

-- ─── Vote des goûts ────────────────────────────────────────────
create or replace function public.flavor_results()
returns table (id uuid, name text, emoji text, votes bigint)
language sql stable security definer set search_path = public as $$
  select o.id, o.name, o.emoji, count(v.id)
  from public.flavor_options o left join public.flavor_votes v on v.option_id = o.id
  group by o.id order by o.sort_order, o.created_at;
$$;

-- Un vote par visiteur (jeton stocké dans le navigateur) ; revoter change le choix.
create or replace function public.cast_vote(p_option uuid, p_token text)
returns table (id uuid, name text, emoji text, votes bigint)
language plpgsql volatile security definer set search_path = public as $$
begin
  if p_token is null or length(p_token) < 16 or length(p_token) > 64 then
    raise exception 'Jeton invalide';
  end if;
  -- anti-abus : 60 votes max par minute pour tout le site
  if (select count(*) from public.flavor_votes where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'Trop de votes en ce moment, réessayez dans une minute.';
  end if;
  insert into public.flavor_votes (option_id, voter_token) values (p_option, p_token)
  on conflict (voter_token) do update set option_id = excluded.option_id, created_at = now();
  return query select * from public.flavor_results();
end;
$$;

create or replace function public.reset_votes()
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  delete from public.flavor_votes where true;
end;
$$;


-- ════════════════════════════════════════════════════════════════
-- Stockage des images (bucket public « images »)
-- ════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images public read" on storage.objects;
drop policy if exists "images admin insert" on storage.objects;
drop policy if exists "images admin update" on storage.objects;
drop policy if exists "images admin delete" on storage.objects;
create policy "images public read" on storage.objects for select using (bucket_id = 'images');
create policy "images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.is_admin());
create policy "images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'images' and public.is_admin());
create policy "images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'images' and public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- Droits d'accès explicites (la RLS ci-dessus filtre ensuite les lignes)
-- ════════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.ingredients, public.products, public.packs, public.recipes,
               public.reviews, public.faqs, public.flavor_options to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.active_promotions(), public.quote_cart(jsonb, text),
                          public.place_order(jsonb, text, jsonb), public.flavor_results(),
                          public.cast_vote(uuid, text) to anon, authenticated;
grant execute on function public.is_admin(), public.reset_votes() to authenticated;
