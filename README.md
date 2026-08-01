# UCDS — Plateforme SaaS de Gestion Sanitaire

Plateforme de coordination des Comités de Développement Sanitaire (CDS) et de gestion des postes de santé de la commune de Médina Sabakh, Sénégal.

## Stack technique (imposée par le cahier des charges)

- **React 19** + **Vite** — JavaScript pur, aucun TypeScript
- **CSS pur** — aucun framework CSS
- **Supabase** — base de données, authentification, stockage
- **React Router** — navigation
- **Context API** — état global
- **PWA ready** — via `vite-plugin-pwa`

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner vos identifiants Supabase
npm run dev
```

## Architecture des dossiers

```
src/
  assets/         Images, illustrations
  components/
    ui/           Composants du Design System (Button, Input, Card, Table, Modal, Drawer,
                   Sidebar, Navbar, Breadcrumb, Pagination, Loader, Toast, Skeleton, Chart, icons)
  context/        Contextes React (Auth, Toast, Tenant à venir...)
  lib/            Clients externes (Supabase)
  layouts/        Layouts partagés (public, dashboard)
  pages/
    landing/      Site vitrine public (sections, navbar/footer publics, illustrations)
    auth/         Connexion / authentification
    dashboard/    Application interne (tableau de bord, modules)
    legal/        Mentions légales / politique de confidentialité (contenu provisoire)
    design-system/ Page de démonstration interne des composants UI (QA visuelle, non liée au menu public)
  routes/         Routeur et gardes de route
  hooks/          Hooks partagés (useInView, useCountUp)
  styles/         Variables CSS (palette), reset, styles globaux
  utils/          Fonctions utilitaires
```

## Design System

Tous les composants réutilisables (section 11 du cahier des charges) sont disponibles via un
import unique :

```js
import { Button, Card, Badge, Table, Modal, useToast } from "./components/ui";
```

Une page de démonstration visuelle est accessible sur `/design-system` (route interne, non
répertoriée dans la navigation publique) pour valider visuellement chaque composant.

## État d'avancement (feuille de route)

- [x] Étape 1 — Initialisation du projet
- [x] Étape 2 — Design System
- [x] Étape 3 — Landing Page
- [ ] Étape 4 — Authentification et gestion des rôles
- [ ] Étape 5 — Tableau de bord principal
- [ ] Étape 6 — Architecture Multi-Tenant
- [ ] Étape 7 à 17 — voir le cahier des charges

## Notes

- Le rôle et les permissions détaillées par utilisateur seront implémentés à l'étape 4, en complément de la table `profiles` côté Supabase.
- Les composants Chart (`BarChart`, `LineChart`, `Sparkline`) sont en SVG pur, sans dépendance externe, conformément à la contrainte "CSS pur / pas de bibliothèque non validée".
- **Contenu provisoire à valider avec le client avant mise en production** : coordonnées de contact (téléphone/email/adresse dans `sections/Contact`), chiffres de la section Statistiques (postes/villages/campagnes/bénéficiaires — à brancher sur les vraies données à l'étape 15), descriptions des postes de santé, articles d'exemple de la section Actualités, et le texte des pages `legal/`.
- Le formulaire de contact simule l'envoi (validation + toast de confirmation) ; il n'est pas encore relié à un backend Supabase — aucune étape de la feuille de route ne couvre explicitement cette persistance, à clarifier avec le client si besoin.
- Logo UCDS provisoire (mark généré, pas le logo officiel de l'organisation) : `public/favicon.svg`, `public/apple-touch-icon.png`, `public/icons/icon-192.png` et `icon-512.png`, ainsi que `components/ui/Logo`. À remplacer si l'UCDS fournit une identité graphique officielle.
