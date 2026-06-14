# Kidenzo - Plateforme de Recommandation et Commerce

> Recommandez. Gagnez. Prospérez.

Kidenzo est une plateforme e-commerce innovante qui permet aux propriétaires de produits de vendre via un réseau de recommandeurs et d'ambassadeurs, avec un système de commissions automatisé et une gamification engageante.

## Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style) + Framer Motion
- **Database**: Prisma ORM + SQLite
- **State Management**: Zustand (client) + TanStack Query (server)
- **Authentication**: Custom JWT-based auth with phone + PIN

## Fonctionnalités

### Pour les Propriétaires
- Gestion complète des produits (CRUD, import, images)
- Tableau de bord avec statistiques en temps réel
- Gestion des commandes (confirmer, annuler, livrer)
- Sites vitrines automatiques pour chaque produit
- Système d'administration complet

### Pour les Ambassadeurs
- Vue d'ensemble des performances
- Suivi des commissions
- Parrainage de recommandeurs
- Système de progression et badges

### Pour les Recommandeurs
- Catalogue de produits à recommander
- Liens de partage uniques par produit
- Suivi des clics et conversions
- Commissions automatiques sur les ventes

### Gamification
- Système XP et niveaux (10 niveaux)
- Badges et succès déblocables
- Quêtes journalières
- Classement (leaderboard)
- Roue de la fortune
- Boutique de récompenses

## Structure du Projet

```
src/
├── app/
│   ├── page.tsx              # Page principale (route unique)
│   ├── layout.tsx            # Layout racine
│   ├── globals.css           # Styles globaux
│   ├── api/                  # Routes API
│   │   ├── auth/             # Authentification
│   │   ├── products/         # Gestion produits
│   │   ├── orders/           # Gestion commandes
│   │   ├── mini-sites/       # Sites vitrines
│   │   ├── gamification/     # Système de jeu
│   │   ├── recommender/      # Gestion recommandeurs
│   │   ├── ambassador/       # Gestion ambassadeurs
│   │   ├── clicks/           # Suivi des clics
│   │   ├── admin/            # Administration
│   │   ├── image-proxy/      # Proxy images
│   │   ├── import-product/   # Import produits
│   │   └── generate-marketing-text/ # IA marketing
│   └── s/[slug]/             # Sites vitrines publics
├── components/
│   ├── AuthScreen.tsx        # Écran d'authentification
│   ├── DashboardLayout.tsx   # Layout du tableau de bord
│   ├── OverviewTab.tsx       # Vue d'ensemble
│   ├── ProductsTab.tsx       # Gestion produits
│   ├── OrdersTab.tsx         # Gestion commandes
│   ├── AmbassadorTab.tsx     # Espace ambassadeur
│   ├── RecommenderTab.tsx    # Espace recommandeur
│   ├── ClicksTab.tsx         # Suivi des clics
│   ├── GamificationPanel.tsx # Panneau gamification
│   ├── GamificationOverlay.tsx # Overlay notifications
│   ├── MiniSiteView.tsx      # Vue site vitrine
│   ├── PublicProductsPage.tsx # Page publique produits
│   ├── admin/                # Composants administration
│   └── ui/                   # Composants shadcn/ui
├── lib/
│   ├── store.ts              # État Zustand global
│   ├── db.ts                 # Client Prisma
│   ├── utils.ts              # Utilitaires
│   └── anti-fraud.ts         # Protection anti-fraude
└── hooks/
    ├── use-mobile.ts         # Détection mobile
    └── use-toast.ts          # Notifications toast
```

## Installation

```bash
# Installer les dépendances
bun install

# Configurer la base de données
bun run db:push

# (Optionnel) Seeder avec des données de démonstration
bunx tsx --tsconfig ./tsconfig.json prisma/seed.ts

# Lancer en développement
bun run dev
```

## Comptes de Démonstration

| Rôle | Téléphone | PIN |
|------|-----------|-----|
| Propriétaire | 237690000001 | 1234 |
| Ambassadeur | 237690000002 | 1234 |
| Recommandeur | 237690000003 | 1234 |

## Scripts Disponibles

| Script | Description |
|--------|-------------|
| `bun run dev` | Serveur de développement (port 3000) |
| `bun run build` | Build de production |
| `bun run start` | Lancer en production |
| `bun run lint` | Vérification ESLint |
| `bun run db:push` | Pousser le schéma Prisma |
| `bun run db:generate` | Générer le client Prisma |

## Compatibilité Mobile

- Navigation bottom-bar adaptative par rôle (5 items + menu "Plus")
- Authentification non-scrollable, fixée au viewport
- Header sticky avec effet glassmorphism
- Safe-area-inset pour les appareils à encoche
- Design responsive mobile-first

## Environnement

Créer un fichier `.env` avec:
```
DATABASE_URL="file:./db/custom.db"
```

## Licence

Projet privé - Tous droits réservés.
