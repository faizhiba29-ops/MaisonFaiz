-- ════════════════════════════════════════════════════════════════
-- Maison Faiz foods — conformité : informations légales et allégations
-- ════════════════════════════════════════════════════════════════

-- Informations légales (Admin → Paramètres → Informations légales).
-- Laissées vides : elles ne s'affichent sur le site qu'une fois remplies.
insert into public.settings (key, value) values
  ('legal_name', '""'),         -- nom du commerçant / raison sociale
  ('legal_form', '""'),         -- ex. auto-entrepreneur, SARL…
  ('legal_address', '""'),
  ('legal_email', '""'),
  ('legal_rc', '""'),           -- registre du commerce
  ('legal_ice', '""'),          -- identifiant commun de l'entreprise
  ('legal_if', '""'),           -- identifiant fiscal
  ('legal_cndp', '""'),         -- n° de déclaration à la CNDP (loi 09-08)
  ('claim_hours', '48')         -- délai pour signaler un colis abîmé ou erroné
on conflict (key) do nothing;

-- Allégations santé ou comparatives non justifiées → descriptions factuelles.
-- Chaque texte n'est remplacé que s'il n'a pas été modifié depuis le contenu de départ.
update public.ingredients set benefits = 'Source de fibres, pour un petit-déjeuner qui tient au corps.'
  where slug = 'avoine' and benefits = 'Riches en fibres (bêta-glucanes), ils apportent une énergie durable et rassasient longtemps.';
update public.ingredients set benefits = 'Sucrant naturel, qui apporte une douceur parfumée.'
  where slug = 'miel' and benefits = 'Sucrant naturel qui apporte de l''énergie rapide et des antioxydants.';
update public.ingredients set benefits = 'Source d''oméga-3 d''origine végétale. Un en-cas apprécié pendant les révisions.'
  where slug = 'noix' and benefits = 'Oméga-3 végétaux, bonnes pour le cerveau et la concentration — idéal pendant les révisions.';
update public.ingredients set benefits = 'Riche en cacao, pour le plaisir et la gourmandise.'
  where slug = 'chocolat' and benefits = 'Antioxydants (flavonoïdes), plaisir et bonne humeur.';
update public.ingredients set benefits = 'Une épice au goût chaleureux qui parfume le granola.'
  where slug = 'cannelle' and benefits = 'Un goût chaleureux, et elle aide à réguler la glycémie.';

update public.products
  set description = 'La version légère : moins de miel, pas de chocolat, plus de graines. Toujours croquant, pour un petit-déjeuner simple ou un en-cas avant le sport.'
  where slug = 'granola-lite'
    and description = 'La version légère : moins de miel, pas de chocolat, plus de graines. Toujours croquant, idéal si vous surveillez votre sucre ou pour un en-cas avant le sport.';

update public.settings set value = (
  select jsonb_agg(
           case
             when e->>'text' = 'Sucré au miel, juste ce qu''il faut — bien moins que les granolas industriels.'
               then jsonb_set(e, '{text}', to_jsonb('Sucré au miel, avec modération.'::text))
             when e->>'text' = 'Fibres + bonnes graisses = une énergie qui dure jusqu''au déjeuner.'
               then jsonb_set(e, '{text}', to_jsonb('Avoine, fruits secs et graines : un petit-déjeuner complet et gourmand.'::text))
             else e
           end order by ord)
  from jsonb_array_elements(value) with ordinality as t(e, ord)
)
where key = 'why_homemade' and jsonb_typeof(value) = 'array';
