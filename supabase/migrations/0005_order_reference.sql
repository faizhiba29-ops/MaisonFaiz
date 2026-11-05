-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — référence de commande professionnelle
-- Format MF-AAAA-NNNN (ex. MF-2026-0001) : séquentielle, sans trou,
-- remise à 0001 chaque 1er janvier (heure du Maroc).
-- ════════════════════════════════════════════════════════════════

-- Compteur par année. Aucune règle d'accès : seul le serveur (trigger) y touche.
create table if not exists public.order_counters (
  year int primary key,
  last int not null default 0
);
alter table public.order_counters enable row level security;
revoke all on public.order_counters from anon, authenticated;

alter table public.orders add column if not exists reference text;

-- Commandes déjà enregistrées : numérotées dans l'ordre chronologique
with r as (
  select id,
         extract(year from created_at at time zone 'Africa/Casablanca')::int as y,
         row_number() over (partition by extract(year from created_at at time zone 'Africa/Casablanca')
                            order by created_at, number) as n
  from public.orders
  where reference is null
)
update public.orders o
set reference = 'MF-' || r.y || '-' || lpad(r.n::text, 4, '0')
from r where o.id = r.id;

insert into public.order_counters (year, last)
select extract(year from created_at at time zone 'Africa/Casablanca')::int, count(*)
from public.orders group by 1
on conflict (year) do update set last = greatest(public.order_counters.last, excluded.last);

-- Attribution automatique à chaque nouvelle commande.
-- La ligne du compteur est verrouillée jusqu'à la fin de la transaction : deux commandes
-- simultanées ne peuvent pas obtenir le même numéro, et une commande annulée (erreur)
-- ne consomme pas de numéro.
create or replace function public._assign_order_reference()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_year int := extract(year from coalesce(new.created_at, now()) at time zone 'Africa/Casablanca')::int;
  v_n int;
begin
  if new.reference is not null then
    return new;
  end if;
  insert into public.order_counters (year, last) values (v_year, 1)
  on conflict (year) do update set last = public.order_counters.last + 1
  returning last into v_n;
  new.reference := 'MF-' || v_year || '-' || lpad(v_n::text, 4, '0');
  return new;
end;
$$;
revoke execute on function public._assign_order_reference() from public, anon, authenticated;

drop trigger if exists orders_assign_reference on public.orders;
create trigger orders_assign_reference before insert on public.orders
  for each row execute function public._assign_order_reference();

alter table public.orders alter column reference set not null;
create unique index if not exists orders_reference_key on public.orders (reference);

-- place_order renvoie aussi la référence (utilisée dans le message WhatsApp et la page de confirmation)
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

  return v_quote || jsonb_build_object('order_id', v_order.id, 'order_number', v_order.number,
                                    'order_ref', v_order.reference);
end;
$$;
