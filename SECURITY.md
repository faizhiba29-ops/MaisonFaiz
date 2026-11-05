# Sécurité

## Signaler une faille

Merci de **ne pas ouvrir d'issue publique**. Écrivez directement aux responsables du projet (WhatsApp de la boutique ou message privé GitHub) avec :

- la page ou la fonction concernée ;
- les étapes pour reproduire ;
- l'impact estimé.

Nous répondons sous 72 heures et corrigeons en priorité tout ce qui touche aux données des clientes.

## Modèle de sécurité

- Le site est servi en fichiers statiques ; toute la logique sensible s'exécute dans **Supabase** (PostgreSQL).
- La clé utilisée par le site est la clé **publique** : elle ne donne que les droits définis par les règles d'accès (RLS).
- Les données des clientes (commandes, téléphones, adresses) ne sont lisibles que par les comptes de la table `admins`.
- Les prix et les promotions sont toujours recalculés par le serveur.

## Liste de contrôle avant mise en ligne

- [ ] Migrations `0001` à `0006` exécutées dans l'ordre
- [ ] Inscriptions désactivées (*Authentication → Sign In / Providers → Allow new users to sign up*)
- [ ] Un seul compte admin par personne, avec un mot de passe solide et unique
- [ ] Sur Vercel, seulement les 3 variables `VITE_*`, avec la clé **publique**
- [ ] Clé secrète et mot de passe de la base jamais partagés (ni chat, ni capture, ni dépôt)
- [ ] *Security Advisor* de Supabase consulté (Database → Advisors) : aucune alerte critique
- [ ] Données de test supprimées avant d'ouvrir la boutique

## En cas de fuite d'un secret

1. Supabase → *Project Settings → API Keys* : supprimer la clé secrète exposée et en créer une nouvelle.
2. *Project Settings → Database* : **Reset database password**.
3. Vérifier *Authentication → Users* et la table `admins` : retirer tout compte inconnu.
4. Si le secret a été commité, le considérer comme public même après suppression du fichier : la rotation (étapes 1 et 2) est obligatoire.
