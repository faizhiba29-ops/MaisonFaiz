-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — mode de livraison
--   included   : livraison incluse dans le prix (0 DH, total définitif)
--   fixed      : frais fixes ajoutés au total (option : offerte dès X DH)
--   on_confirm : frais selon la ville, confirmés sur WhatsApp (total hors livraison)
-- Réglable dans /admin → Paramètres → Livraison.
-- ════════════════════════════════════════════════════════════════

insert into public.settings (key, value)
select 'delivery_mode',
       to_jsonb(case when coalesce((select (value #>> '{}')::numeric from public.settings where key = 'delivery_fee'), 0) > 0
                     then 'fixed' else 'on_confirm' end)
on conflict (key) do nothing;

-- Le mode est conservé sur chaque commande (affichage admin, export transporteur)
alter table public.orders add column if not exists delivery_mode text
  check (delivery_mode is null or delivery_mode in ('included', 'fixed', 'on_confirm'));

-- Devis : applique le mode de livraison
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
  v_mode text;
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
  -- Mode de livraison : incluse (0 DH), frais fixes (ajoutés au total) ou à confirmer (0 DH, total hors livraison)
  select value #>> '{}' into v_mode from public.settings where key = 'delivery_mode';
  if v_mode is null or v_mode not in ('included', 'fixed', 'on_confirm') then
    v_mode := case when v_fee > 0 then 'fixed' else 'on_confirm' end;
  end if;
  if v_mode <> 'fixed' then
    v_fee := 0;
  end if;
  if jsonb_array_length(v_lines) = 0 or (v_free_from is not null and v_subtotal - v_code_disc >= v_free_from) then
    v_fee := 0;
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'removed', v_removed,
    'subtotal', v_subtotal,
    'discount', v_code_disc,
    'delivery_fee', v_fee,
    'delivery_mode', v_mode,
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

-- Commande : enregistre le mode de livraison
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
                             delivery_fee, delivery_mode, total, promo_code)
  values (v_name, v_phone, v_city, v_address, v_note, v_quote->'lines',
          (v_quote->>'subtotal')::numeric, (v_quote->>'discount')::numeric,
          (v_quote->>'delivery_fee')::numeric, v_quote->>'delivery_mode', (v_quote->>'total')::numeric,
          case when v_code_ok then v_quote->'code'->>'code' end)
  returning * into v_order;

  update public.promotions set usage_count = usage_count + 1
  where id in (select (jsonb_array_elements_text(v_quote->'promo_ids'))::uuid)
     or (v_code_ok and id = (v_quote->'code'->>'promo_id')::uuid);

  return v_quote || jsonb_build_object('order_id', v_order.id, 'order_number', v_order.number,
                                    'order_ref', v_order.reference);
end;
$$;
