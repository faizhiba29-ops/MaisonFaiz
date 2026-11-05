-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — durcissement de la sécurité
-- ════════════════════════════════════════════════════════════════

-- Fonctions internes : chemin de recherche figé (recommandation du Security Advisor Supabase)
alter function public._promo_live(public.promotions) set search_path = public;
alter function public._promo_applies(public.promotions, text, uuid) set search_path = public;
alter function public._promo_unit_discount(public.promotions, numeric) set search_path = public;

-- …et non appelables depuis l'API : seules les fonctions serveur (quote_cart, place_order) s'en servent
revoke execute on function public._promo_live(public.promotions) from public, anon, authenticated;
revoke execute on function public._promo_applies(public.promotions, text, uuid) from public, anon, authenticated;
revoke execute on function public._promo_unit_discount(public.promotions, numeric) from public, anon, authenticated;

-- Fonction réservée à l'admin (elle vérifie aussi is_admin() en interne)
revoke execute on function public.reset_votes() from public, anon;
grant execute on function public.reset_votes() to authenticated;

-- Images : uniquement des photos (pas de SVG, qui peut contenir du code), 5 Mo maximum
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'images';
