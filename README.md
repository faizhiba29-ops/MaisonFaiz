# Granola by Hiba — site e-commerce

Site vitrine + panier + commande WhatsApp pour **Granola by Hiba** (Fès), avec un espace d'administration sur `/admin`.

- **Front** : React 19 + Vite + Tailwind CSS v4, mobile-first.
- **Back** : Supabase (Postgres + Auth + Storage). Les prix, promos et codes promo sont **calculés côté serveur** (fonctions SQL `quote_cart` / `place_order`) ; le navigateur ne fait qu'afficher.
- **Commande** : panier stocké dans le navigateur → commande enregistrée en base (statut « Nouvelle ») → WhatsApp s'ouvre avec le message pré-rempli vers `wa.me/212618145078`.

---

## 1. Créer le projet Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (région Europe conseillée).
2. **SQL Editor** → coller et exécuter, dans l'ordre :
   1. `supabase/migrations/0001_schema.sql` (tables, sécurité RLS, fonctions de prix, bucket `images`)
   2. `supabase/migrations/0002_seed.sql` (produits, prix, Pack Duo, ingrédients, recettes, FAQ, vote, paramètres)
3. **Créer le compte admin (unique)** :
   - *Authentication → Users → Add user* : email + mot de passe de Hiba (cocher « Auto confirm »).
   - Puis dans le SQL Editor :
     ```sql
     insert into public.admins (user_id)
     select id from auth.users where email = 'email-de-hiba@exemple.com';
     ```
   - *Authentication → Sign In / Providers* : **désactiver « Allow new users to sign up »** pour qu'aucun autre compte ne puisse être créé.
4. *Project Settings → API* : copier l'URL du projet et la clé `anon` (publique).

## 2. Lancer en local

```bash
cp .env.example .env      # puis remplir VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SITE_URL
npm install
npm run dev               # http://localhost:5173  —  admin : http://localhost:5173/admin
```

## 3. Mettre en ligne

**Vercel** (recommandé) ou **Netlify** : importer le dépôt, commande `npm run build`, dossier `dist`, et ajouter les 3 variables d'environnement.
Les redirections SPA sont déjà configurées (`vercel.json` et `public/_redirects`).

`VITE_SITE_URL` doit être l'adresse finale du site (ex. `https://granolabyhiba.ma`) : elle sert à l'aperçu des liens partagés sur WhatsApp / Instagram.

---

## Utilisation de l'admin (`/admin`)

| Section | Ce qu'on y fait |
|---|---|
| Tableau de bord | Commandes du jour / semaine, produits les plus commandés, promos actives, résultats du vote |
| Commandes | Liste filtrable par statut (Nouvelle → Confirmée → En préparation → Expédiée → Livrée / Annulée), bouton « Écrire au client » sur WhatsApp, note interne |
| Produits | Nom, photos (plusieurs, la 1re est la principale, la 2e apparaît au survol), prix 250g / 500g / 1kg activables, ingrédients, badges, disponibilité, ordre |
| Packs | Produits inclus + poids, prix du pack |
| Promotions | % ou montant fixe, cible (tout / produits / packs), code optionnel (vide = automatique), dates, limite d'utilisation, texte de bannière |
| Ingrédients | Nom FR + arabe, emoji ou photo, bienfaits, allergène |
| Recettes, Avis clients, FAQ | Contenu des pages publiques |
| Vote des goûts | Ajouter / supprimer des options, réinitialiser |
| Paramètres | WhatsApp, Instagram, 3 reels, textes du hero + photos, « Qui suis-je », étapes d'hygiène, livraison, conservation, comparaison Classic VS Chocolat |

**Photos** : tant qu'aucune photo n'est uploadée, le site affiche des illustrations aux couleurs de la marque (sachet kraft, bocal, bol). Les photos sont automatiquement redimensionnées (max 1600px) et converties en WebP avant l'envoi. Format carré conseillé pour les produits.

### Règles de calcul des promos
- Une promo **sans code** s'applique automatiquement : prix barré sur le site, et la meilleure promo est retenue par article.
- Un **code promo** s'applique ensuite dans le panier, sur les articles ciblés.
- Montant fixe : déduit **par article** ; sauf code promo ciblant « tout le site », déduit une seule fois sur la commande.
- La **limite d'utilisation** compte les commandes passées avec la promo.
- **Livraison** : si `Frais de livraison` = 0, le panier affiche « Confirmée sur WhatsApp » ; sinon les frais sont ajoutés au total (option « offerte dès X DH »).

---

## Structure

```
supabase/migrations/   schéma SQL, RLS, fonctions serveur, contenu de départ
src/pages/             pages publiques (accueil, produit, bienfaits, recettes, FAQ, contact, panier)
src/components/        layout, cartes produits, illustrations, icônes, SEO
src/context/           données du site (catalogue, paramètres, promos) et panier
src/lib/               client Supabase, formatage, prix promo affichés, message WhatsApp, upload images
src/admin/             espace admin (CRUD générique + commandes, votes, paramètres, tableau de bord)
```

## Limites connues / pistes
- L'aperçu de lien WhatsApp utilise l'image et le titre **généraux** du site (`public/og-image.jpg`) : les robots de WhatsApp n'exécutent pas le JavaScript. Pour un aperçu par produit, il faudrait un pré-rendu (ex. fonction edge Vercel).
- Le vote des goûts est limité à un vote par navigateur (pas de compte) : suffisant pour un sondage, pas infalsifiable.
- Anti-spam des commandes : 5 commandes max par numéro de téléphone et par heure.
