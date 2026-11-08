# Maison Faiz foods

Boutique en ligne de **Maison Faiz foods**, marque de granola, sellou et créations maison préparés à Fès.
Les clientes commandent depuis leur téléphone et envoient leur commande sur WhatsApp ; la boutique se gère entièrement depuis un espace d'administration.

![CI](https://github.com/khammar-ben/GranolabyHiba/actions/workflows/ci.yml/badge.svg)

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Déploiement](#déploiement)
- [Sécurité](#sécurité)
- [Utilisation de l'admin](#utilisation-de-ladmin)
- [Structure du projet](#structure-du-projet)
- [Limites connues](#limites-connues)

---

## Fonctionnalités

**Boutique**
- Catalogue multi-catégories (granolas, sellou, pâtes à tartiner…) avec une page par catégorie
- Formats libres par produit (250g, 500g, 1kg, « Pot 250g »…) et économie affichée sur les grands formats
- Packs, badges (Nouveau, Best-seller, Promo, Épuisé), produits « Bientôt disponible »
- Panier conservé dans le navigateur, codes promo, promotions automatiques avec prix barrés
- Commande envoyée sur WhatsApp avec un message pré-rempli, et enregistrée en base
- Pages Bienfaits (ingrédients et allergènes), Comment le déguster, FAQ, Contact
- Sondage « prochain goût », avis clients, reels Instagram
- Conçu d'abord pour le téléphone ; textes en français avec l'arabe là où il compte

**Administration (`/admin`)**
- Tableau de bord : chiffre d'affaires, commandes et panier moyen sur 7/30/90 jours avec évolution, graphique des ventes, commandes à traiter, produits les plus commandés
- Suivi des commandes par statut, références séquentielles `MF-2026-0001`, contact du client sur WhatsApp en un clic
- Export Excel des commandes sélectionnées : fichier pour le transporteur (colis, montant à encaisser) et fichier détaillé, changement de statut groupé
- Gestion complète : produits, catégories, packs, promotions, ingrédients, recettes, avis, FAQ, vote, paramètres du site
- Photos redimensionnées et converties en WebP avant l'envoi

## Stack technique

| Couche | Outils |
|---|---|
| Interface | React 19, React Router 7, Tailwind CSS 4, Vite |
| Données et authentification | Supabase (PostgreSQL, Auth, Storage) |
| Logique métier | Fonctions PostgreSQL (`quote_cart`, `place_order`, `cast_vote`) |
| Hébergement | Vercel |
| Qualité | oxlint, GitHub Actions, Dependabot |

## Architecture

```
 Navigateur (React)                       Supabase
 ─────────────────                        ─────────────────────────────────────────
 Boutique  ──── lecture publique ───────▶ Tables catalogue (RLS : lecture seule)
           ──── quote_cart() ───────────▶ Calcul des prix, promos et codes (serveur)
           ──── place_order() ──────────▶ Enregistrement de la commande + anti-spam
           ──── wa.me/… ──▶ WhatsApp de la boutique

 /admin    ──── connexion Supabase Auth ─▶ is_admin() : table admins
           ──── lecture / écriture ─────▶ Toutes les tables (RLS : admins seulement)
           ──── upload ────────────────▶ Storage « images » (photos ≤ 5 Mo)
```

Le navigateur n'est jamais cru sur un prix : chaque total est recalculé par le serveur à partir du catalogue et des promotions en vigueur.

## Installation

Prérequis : Node.js 20 ou plus, un projet [Supabase](https://supabase.com).

### 1. Base de données

Dans Supabase → **SQL Editor**, exécuter dans l'ordre :

| Fichier | Contenu |
|---|---|
| `supabase/migrations/0001_schema.sql` | Tables, règles d'accès (RLS), fonctions de prix et de commande, stockage des images |
| `supabase/migrations/0002_seed.sql` | Contenu de départ : produits, prix, pack, ingrédients, recettes, FAQ, paramètres |
| `supabase/migrations/0003_store.sql` | Catégories, conservation par produit, pâtes à tartiner préparées (cachées) |
| `supabase/migrations/0004_security.sql` | Durcissement : fonctions internes verrouillées, limites d'upload |
| `supabase/migrations/0005_order_reference.sql` | Références de commande séquentielles `MF-AAAA-NNNN` |
| `supabase/migrations/0006_delivery_mode.sql` | Mode de livraison : incluse, frais fixes ou à confirmer |
| `supabase/migrations/0007_compliance.sql` | Informations légales (vides par défaut) et descriptions sans allégations santé |
| `supabase/migrations/0008_peanut_pistache.sql` | Peanut Spread en vente (250g, 55 DH) et nouveau Granola Pistache |
| `supabase/migrations/0009_pistache_photos_instagram.sql` | Photos du Granola Pistache et des nouveaux ingrédients, compte Instagram @maison_faiz_foods |
| `supabase/migrations/0010_etiquettes.sql` | Étiquettes Maison Faiz du Lite, du Pistache et du Peanut Spread en 2e photo |

### 2. Compte administrateur

1. **Authentication → Users → Add user** : email + mot de passe solide, cocher *Auto Confirm User*.
2. Lui donner l'accès admin (SQL Editor) :
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@exemple.com';
   ```
3. **Authentication → Sign In / Providers** : désactiver **Allow new users to sign up**.

### 3. Lancer en local

```bash
cp .env.example .env    # puis renseigner les valeurs
npm install
npm run dev             # http://localhost:5173 — admin : /admin
```

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Version de production dans `dist/` |
| `npm run preview` | Tester la version de production en local |
| `npm run lint` | Analyse du code |
| `npm run check` | Lint + build (ce que fait la CI) |

## Variables d'environnement

| Variable | Exemple | Rôle |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://votre-projet.supabase.co` | Adresse du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` | Clé **publique** du projet |
| `VITE_SITE_URL` | `https://www.maisonfaiz.ma` | Adresse publique du site (aperçus de liens) |

> ⚠️ Tout ce qui commence par `VITE_` est inclus dans le site et lisible par les visiteurs.
> N'y mettez **jamais** la clé secrète (`sb_secret_…` / `service_role`) ni l'adresse `postgresql://` de la base. Le site refuse de démarrer s'il détecte une clé secrète.

## Déploiement

1. Sur [Vercel](https://vercel.com) : **Add New → Project**, importer ce dépôt (Vite est détecté automatiquement).
2. Renseigner les 3 variables d'environnement ci-dessus.
3. **Deploy**. Chaque push sur `main` redéploie le site.

`vercel.json` configure les redirections de l'application, le cache des fichiers et les en-têtes de sécurité.

### Performance (au build)

`scripts/vite-plugins.mjs` prépare la page d'accueil pour un affichage rapide :

- chaque photo de `public/images` est déclinée en WebP 400 / 800 / pleine taille (le navigateur choisit la bonne via `srcset`) ;
- le contenu public (catalogue, paramètres, promos) est copié dans `index.html` : la page s'affiche sans attendre Supabase, puis se met à jour en arrière-plan. **Un changement fait dans l'admin est visible tout de suite** ; le contenu intégré est simplement rafraîchi au prochain déploiement ;
- le CSS est intégré à la page, la photo principale et les polices sont préchargées.

## Sécurité

| Protection | Détail |
|---|---|
| Règles d'accès (RLS) | Activées sur toutes les tables. Les visiteurs lisent seulement le catalogue visible ; commandes, codes promo et votes ne sont accessibles qu'aux admins |
| Prix côté serveur | Totaux, promotions et codes recalculés par PostgreSQL ; un prix modifié dans le navigateur est ignoré |
| Administration | Réservée aux comptes listés dans `admins` ; un compte créé ailleurs n'a aucun droit |
| Anti-abus | 5 commandes par numéro et par heure, 20 commandes et 60 votes par minute pour tout le site, paniers limités à 50 lignes |
| Fonctions internes | Non appelables depuis l'API, chemin de recherche figé |
| Images | Stockage limité aux photos (JPEG, PNG, WebP, GIF), 5 Mo maximum, pas de SVG |
| En-têtes HTTP | Content-Security-Policy stricte, HSTS, anti-iframe, `nosniff`, Referrer-Policy, Permissions-Policy |
| Référencement | `/admin` et `/panier` exclus des moteurs de recherche |
| Secrets | `.env` jamais versionné ; la CI vérifie qu'aucun secret ne se retrouve dans le build |

Voir [SECURITY.md](SECURITY.md) pour signaler une faille et la liste de contrôle avant mise en ligne.

## Conformité

| Point | Mise en œuvre |
|---|---|
| Pages légales | `/mentions-legales`, `/cgv` (prix, livraison, réclamations et remboursements), `/confidentialite` (loi 09-08, droits, CNDP) |
| Informations de l'entreprise | Admin → Paramètres → Informations légales (RC, ICE, IF, adresse, n° CNDP) : affichées seulement si remplies |
| Cookies | Aucun cookie publicitaire ni de mesure d'audience, donc pas de bandeau ; polices hébergées sur le site ; vidéos Instagram chargées seulement après un clic |
| Formulaire de commande | Information sur l'usage des données, mémorisation des coordonnées sur l'appareil uniquement sur demande (case décochée) |
| Suppression des données | Bouton « Effacer les données enregistrées sur cet appareil » (page Confidentialité) ; suppression d'une commande depuis l'admin sur demande |
| Allégations | Descriptions factuelles des ingrédients, sans effet santé ni comparaison non justifiée |
| Accessibilité | Contrastes WCAG AA, lien « Aller au contenu », navigation clavier, textes alternatifs |
| Licences | Polices Cardo, Archivo, Amiri sous SIL Open Font License 1.1 ; photos et logo propriété de Maison Faiz foods |

> Les textes juridiques sont des modèles : à faire relire, puis à compléter avec les informations réelles de l'entreprise.

## Utilisation de l'admin

| Section | Usage |
|---|---|
| Tableau de bord | Indicateurs et tendances, commandes récentes, promos actives, vote |
| Commandes | Statuts Nouvelle → Confirmée → En préparation → Expédiée → Livrée / Annulée, note interne, WhatsApp client |
| Produits | Photos (la 1re est la principale, la 2e apparaît au survol), formats et prix, ingrédients, badges, disponibilité, visibilité |
| Catégories | Une catégorie apparaît dans la boutique dès qu'elle contient un produit visible |
| Packs | Produits inclus (avec leur format) et prix du pack |
| Promotions | % ou montant fixe ; cible : tout le site, des produits ou des packs ; code optionnel ; dates ; limite d'utilisation ; texte de bannière |
| Ingrédients, Recettes, Avis, FAQ, Vote | Contenu des pages publiques |
| Paramètres | WhatsApp (numéro qui reçoit les commandes), Instagram, reels, textes de l'accueil, livraison (incluse / frais fixes / à confirmer), conservation |

**Préparer un produit avant sa sortie** : le créer avec *Visible* décoché. Cocher seulement *Visible* l'affiche en « Bientôt disponible » ; cocher aussi *Disponible* (avec un format en vente et un prix) l'ouvre à la commande.

**Règles des promotions**
- Une promotion **sans code** s'applique automatiquement (prix barré) ; la meilleure est retenue par article.
- Un **code** s'applique ensuite dans le panier, sur les articles ciblés.
- Un montant fixe est déduit **par article**, sauf pour un code visant tout le site (déduit une fois).
- La limite d'utilisation compte les commandes passées avec la promotion.

## Structure du projet

```
├── .github/              CI (lint, build, contrôle des secrets) et Dependabot
├── public/               images, logo, robots.txt, aperçu de partage
├── src/
│   ├── admin/            espace d'administration (CRUD générique, commandes, tableau de bord…)
│   ├── components/       mise en page, cartes produits, icônes, SEO
│   ├── context/          données du site et panier
│   ├── lib/              client Supabase, formats et prix, WhatsApp, upload d'images
│   └── pages/            pages publiques
├── supabase/migrations/  schéma, règles d'accès, fonctions, contenu de départ
└── vercel.json           redirections, cache et en-têtes de sécurité
```

## Limites connues

- L'aperçu d'un lien partagé sur WhatsApp est le même pour toutes les pages (`public/og-image.jpg`) : les robots de partage n'exécutent pas le JavaScript. Un aperçu par produit demanderait un pré-rendu.
- La commande est enregistrée avant l'envoi du message WhatsApp : une commande « Nouvelle » sans message reçu n'a peut-être pas été envoyée.
- Le sondage limite à un vote par navigateur : suffisant pour un sondage, pas infalsifiable.
- Le plan gratuit de Supabase met le projet en pause après 7 jours sans activité.

---

© Maison Faiz foods. Tous droits réservés — voir [LICENSE](LICENSE).
