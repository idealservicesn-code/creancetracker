# Créances Tracker — Financial Ledger & Collections Tracker

Application web interne de gestion de portefeuille de créances et de suivi
d'échéanciers, construite entièrement sur des services gratuits :

- **Next.js 14** (App Router, TypeScript, Tailwind CSS, Lucide Icons) — hébergé sur **Vercel** (plan gratuit)
- **Supabase** (PostgreSQL + Auth + RLS) — plan gratuit
- **Leaflet / React-Leaflet** avec tuiles **OpenStreetMap** — 0 DH, aucune clé Google Maps
- **Recharts** pour les graphiques

## 1. Mise en place de Supabase

1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. Ouvrez **SQL Editor** > **New query**, collez le contenu de
   [`supabase/schema.sql`](./supabase/schema.sql) et exécutez-le. Cela crée :
   - les tables `clients`, `loans`, `payments` ;
   - les triggers de mise à jour automatique du statut des prêts (`ongoing` /
     `overdue` / `paid`) et de `updated_at` ;
   - la vue `v_loans_with_balance` (solde restant, retard, échéance du jour) ;
   - le Row Level Security (RLS), qui restreint tout accès aux seuls
     utilisateurs authentifiés (l'administrateur connecté).
3. Ouvrez à nouveau **SQL Editor** > **New query**, collez cette fois le
   contenu de [`supabase/migration_documents.sql`](./supabase/migration_documents.sql)
   et exécutez-le. Cela ajoute :
   - la table `client_documents` (pièces jointes : CIN, autres documents) ;
   - le bucket de stockage privé `creances-documents` (Supabase Storage),
     avec des règles d'accès réservées aux utilisateurs authentifiés.
4. Créez votre compte administrateur : **Authentication > Users > Add user**
   (email + mot de passe). C'est ce compte qui se connectera sur `/login`.
5. Récupérez vos clés dans **Project Settings > API** :
   - `Project URL`
   - `anon public key` (ou `Publishable key` sur les nouveaux projets Supabase)

## 2. Configuration du projet

```bash
cp .env.local.example .env.local
```

Renseignez dans `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

## 3. Installation et lancement en local

```bash
npm install
npm run dev
```

L'application est disponible sur http://localhost:3000 (redirection
automatique vers `/login` si non connecté, puis vers `/dashboard`).

## 4. Déploiement sur Vercel (gratuit)

1. Poussez ce projet sur un dépôt GitHub/GitLab.
2. Sur [vercel.com](https://vercel.com), importez le dépôt.
3. Renseignez les deux variables d'environnement
   `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans
   **Project Settings > Environment Variables**.
4. Déployez. Aucune configuration supplémentaire n'est nécessaire (le
   middleware, les Server Actions et les pages dynamiques fonctionnent
   nativement sur Vercel).

## 5. Structure du projet

```
supabase/schema.sql              Schéma SQL principal (tables, triggers, vue, RLS)
supabase/migration_documents.sql Migration : pièces jointes clients + bucket Storage
src/
  middleware.ts               Protection des routes (redirige vers /login)
  lib/
    types.ts                  Types TypeScript (Client, Loan, Payment, …)
    utils.ts                  Formatage DH/dates, calculs, texte WhatsApp
    data.ts                   Requêtes de lecture (Server Components)
    actions.ts                Server Actions (création client/prêt/paiement)
    supabase/client.ts         Client Supabase navigateur
    supabase/server.ts         Client Supabase serveur (cookies)
  components/                 Composants réutilisables (formulaires, carte, KPI…)
  app/
    login/page.tsx            Connexion administrateur
    dashboard/page.tsx         KPI, graphique, échéances du jour/en retard
    clients/page.tsx           Formulaire + carte Leaflet + liste des clients
    loans/page.tsx              Création de prêts, règlements, rappel WhatsApp
```

## 6. Fonctionnalités livrées

### Dashboard (`/dashboard`)
- KPI Cards : **Total Encours**, **Total Exigible**, **Taux de Recouvrement**,
  **Clients actifs**.
- Graphique des encaissements mensuels (Recharts, 6 derniers mois).
- Répartition des échéances par statut (en cours / en retard / soldé).
- Répartition des clients par statut (actif / liste noire).
- Top 5 des clients avec le solde restant le plus élevé.
- Liste des échéances en retard ou arrivant à terme aujourd'hui.

### Clients & Carte (`/clients`)
- Formulaire d'ajout rapide d'un client (nom, téléphone, CIN, statut).
- Sélection des coordonnées GPS en cliquant directement sur la carte
  (ou saisie manuelle latitude/longitude).
- Carte Leaflet/OpenStreetMap affichant tous les clients géolocalisés
  (marqueur vert = actif, gris = liste noire).
- **Pièces jointes par client** : dans le tableau des clients, le bouton
  « Pièces jointes » de chaque ligne déplie une zone permettant d'envoyer
  une carte d'identité (CIN) ou tout autre document (image ou PDF), de
  consulter/télécharger les fichiers déjà envoyés (URL signée temporaire,
  bucket privé) et de les supprimer.

### Gestion des prêts (`/loans`)
- Formulaire de création d'échéance (montant initial + date d'émission et
  d'échéance). Le **montant total dû est calculé automatiquement** par le
  serveur (montant initial + 20% de majoration) — il s'affiche en lecture
  seule dans le formulaire et n'est jamais saisi manuellement.
- Suivi des règlements partiels par prêt, avec calcul automatique du
  solde restant et barre de progression.
- Statut du prêt recalculé automatiquement côté base de données
  (`ongoing` / `overdue` / `paid`) via trigger SQL à chaque paiement.
- Bouton **Rappel WhatsApp** : génère le texte
  `"Bonjour [Nom], rappel du solde restant de [Montant] DH pour l'échéance
  du [Date]"`, le copie dans le presse-papiers et ouvre `wa.me` avec le
  message pré-rempli.

## 7. Notes de sécurité

- RLS est activé sur les trois tables : seul un utilisateur authentifié via
  Supabase Auth peut lire/écrire des données. La clé utilisée côté client
  (`anon key`) n'a aucun accès tant que l'utilisateur n'est pas connecté.
- Le middleware Next.js protège toutes les routes de l'application (sauf
  `/login`) côté serveur, en plus de la RLS côté base de données.
- Pensez à créer les comptes administrateurs uniquement depuis Supabase
  Studio (pas d'auto-inscription publique n'est exposée dans l'application).
