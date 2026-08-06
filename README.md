# UCDS — Plateforme SaaS de Gestion Sanitaire

Plateforme de coordination des Comités de Développement Sanitaire (CDS) et de gestion des postes de santé de la commune de Médina Sabakh, Sénégal.

## Stack technique (imposée par le cahier des charges)

- **React 19** + **Vite** — JavaScript pur, aucun TypeScript
- **CSS pur** — aucun framework CSS
- **Supabase** — base de données, authentification, stockage
- **React Router** — navigation
- **Context API** — état global
- **PWA ready** — via `vite-plugin-pwa`
- **QR Code** — via `qrcode-generator` (zéro dépendance, aucun appel réseau, fonctionne hors-ligne ; requis explicitement par le cahier des charges §9.2, ajouté comme `vite-plugin-pwa`/`react-router-dom`/`@supabase/supabase-js` pour honorer une exigence nommée, pas comme substitution de la stack de base)

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
                   Sidebar, Navbar, Breadcrumb, Pagination, Loader, Toast, Skeleton, Chart, Tabs, icons)
  context/        Contextes React (Auth, Toast)
  lib/            Clients externes (Supabase)
  layouts/        Layouts partagés (DashboardLayout)
  pages/
    landing/      Site vitrine public (sections, navbar/footer publics, illustrations)
    auth/         Connexion / authentification
    dashboard/    Tableau de bord global (Super Admin)
    poste/        Tableau de bord par poste de santé
    patients/     Module Patients (liste, formulaire, fiche à onglets) — par poste
    legal/        Mentions légales / politique de confidentialité (contenu provisoire)
    design-system/ Page de démonstration interne des composants UI (QA visuelle, non liée au menu public)
  routes/         Routeur et gardes de route (rôle + poste)
  hooks/          Hooks partagés (useInView, useCountUp, useDashboardOverview, usePatients...)
  constants/      Rôles, feuille de route, listes d'options (sexe, groupe sanguin...)
  styles/         Variables CSS (palette), reset, styles globaux
  utils/          Fonctions utilitaires
```

## Base de données — Authentification et rôles (étape 4)

Le schéma SQL se trouve dans `supabase/migrations/0001_auth_roles.sql`. À exécuter une seule
fois dans **Supabase Dashboard → SQL Editor** (copier/coller le contenu du fichier, puis Run) :

- Crée l'enum `user_role` avec les 10 rôles du cahier des charges (§7.2)
- Crée `postes_sante` (référence des 7 postes réels) et `profiles` (1 profil par utilisateur,
  relié à un poste et un rôle)
- Active la Row Level Security avec des policies strictes (un utilisateur ne voit/modifie que son
  propre profil, sauf le Super Administrateur UCDS qui voit tout ; personne ne peut s'auto-attribuer
  un rôle ou changer de poste — appliqué par un trigger, pas seulement côté client)
- Crée un profil automatiquement à chaque inscription Supabase Auth (`handle_new_user`)

### Créer le premier compte (Super Administrateur UCDS)

Aucune inscription publique n'est prévue (les comptes sont provisionnés par un administrateur,
conformément au §6.2 du cahier des charges). Pour créer le tout premier compte :

1. Supabase Dashboard → **Authentication → Users → Add user**, renseigner email + mot de passe.
   Optionnel : ajouter `{"full_name": "Votre nom"}` dans "User Metadata" pour préremplir le nom.
2. Un profil est automatiquement créé avec le rôle `lecture_seule`. Élever ce compte en Super
   Administrateur via SQL Editor :
   ```sql
   update public.profiles
   set role = 'super_admin_ucds'
   where id = (select id from auth.users where email = 'votre-email@ucds.sn');
   ```
3. Se connecter sur `/connexion` avec cet email et ce mot de passe.

Les comptes suivants (par poste et par rôle) seront gérés via une interface d'administration à
construire aux étapes 5/6.

## Base de données — Temps réel (étape 5)

`supabase/migrations/0002_realtime.sql` active Supabase Realtime sur `profiles` et
`postes_sante`, pour que les statistiques du tableau de bord se mettent à jour automatiquement
sans rechargement de page. À exécuter dans **Supabase Dashboard → SQL Editor** (idempotent, peut
être relancé sans risque).

## Base de données — Multi-Tenant (étape 6)

`supabase/migrations/0003_multi_tenant.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Ajoute un `slug` stable à chaque poste (utilisé dans les URLs `/poste/:slug`)
- Un Administrateur Poste de Santé peut désormais voir et gérer les comptes de **son** poste
  uniquement (nouvelle policy RLS + fonction `is_poste_admin()`)
- Le trigger anti-escalade de privilèges (étape 4) est étendu : un Administrateur Poste de Santé
  peut attribuer un rôle de terrain (médecin, infirmier, sage-femme, pharmacien, caissier,
  magasinier, agent de santé, lecture seule) à un utilisateur de **son** poste, jamais à lui-même,
  jamais vers un autre poste, et jamais le rôle `admin_poste` ou `super_admin_ucds` (impossible de
  créer un pair ou de s'auto-promouvoir) — seul le Super Admin garde ce pouvoir

### Périmètre volontairement exclu de cette étape

- Pas d'interface pour **créer** des comptes ou changer un rôle depuis l'application — la capacité
  existe désormais côté base de données (RLS + trigger), mais l'écran de gestion reste à
  construire (hors des 17 étapes explicites du cahier des charges ; à clarifier si besoin).
  En attendant, les comptes se créent via Supabase Dashboard comme documenté à l'étape 4.
- Les boutons "Accéder à l'espace du poste" de la landing page pointent tous vers `/connexion` —
  c'est volontaire : la destination après connexion dépend du **compte**, pas du bouton cliqué
  (comme n'importe quel SaaS avec un espace personnel unique par utilisateur).

## Base de données — Patients (étape 7)

`supabase/migrations/0004_patients.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Crée `patients` (fiche patient, numéro de dossier auto-généré séquentiel par poste, ex. `0001`)
  et 4 tables liées : `patient_documents`, `patient_vaccinations`, `patient_visites`,
  `patient_notes_suivi`
- **Isolation stricte par poste** sur les 5 tables (même principe qu'à l'étape 6) : un utilisateur
  ne voit/modifie que les patients de son poste ; seul le rôle `lecture_seule` ne peut pas
  créer/modifier ; seuls Administrateur Poste de Santé et Super Admin peuvent supprimer
- Crée le bucket de stockage `patient-documents` (privé) avec policies RLS sur `storage.objects` —
  convention de chemin `{poste_id}/{patient_id}/{fichier}`, donc même isolation par poste pour les
  fichiers uploadés que pour les données

### Périmètre volontairement exclu de cette étape

- **Ordonnances** : l'onglet existait sur la fiche patient mais restait vide ("à venir") à cette
  étape — les ordonnances sont générées depuis une consultation, construites à l'étape 9.
- **Historique médical** : implémenté comme une fusion en lecture seule des visites + vaccins +
  notes de suivi déjà enregistrés (les seules données réellement disponibles à ce stade) — pas de
  dossier médical structuré séparé, qui n'aurait pas de sens avant les étapes Consultations/Grossesse.
- Le module Patients n'est accessible que **depuis l'espace d'un poste** (`/poste/:slug/patients`) —
  cohérent avec l'architecture multi-tenant : c'est une ressource par poste, pas une vue globale.

## Base de données — Tickets et file d'attente (étape 8)

`supabase/migrations/0005_tickets.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Crée `tickets` (numéro auto-généré, remis à zéro chaque jour et par poste, ex. `001`, `002`...),
  lié optionnellement à un patient existant
- Même isolation par poste que Patients (étape 7)
- Horodatage automatique des changements de statut (`appele_at`, `termine_at`)
- Active Supabase Realtime sur `tickets` — la file d'attente se met à jour en direct pour tous les
  utilisateurs du poste connectés en même temps (utile en salle d'attente)

### Fonctionnement

- **Génération automatique** : bouton "Nouveau ticket" → recherche un patient existant (optionnel)
  ou saisie libre d'un nom → numéro attribué automatiquement
- **QR Code** : encodé sur un code compact ASCII (`{slug-poste}-{numéro}-{date}`), jamais sur du
  texte affichable — la bibliothèque de génération gère mal les caractères accentués français
  (testé et confirmé), donc aucun nom de patient/poste n'est mis dans le QR
- **Statuts** : En attente → En cours → Terminé, ou Annulé à tout moment (tant que non terminé)
- **Historique** : sélecteur de date sur la page (au-delà d'aujourd'hui, lecture seule, sans
  temps réel)
- **Impression** : bouton "Imprimer" sur la fiche ticket, isolé via CSS `@media print` (seul le
  ticket est imprimé, pas le reste de l'application) — pas de génération de PDF, impression
  navigateur standard

### Tarification (le ticket est payant, comme en pratique dans les postes de santé au Sénégal)

`supabase/migrations/0006_ticket_pricing.sql` — à exécuter après `0005_tickets.sql` :

- Chaque poste a un tarif de ticket configurable (`postes_sante.prix_ticket`, en FCFA) — réglable
  par l'Administrateur Poste de Santé ou le Super Admin depuis le tableau de bord du poste
  ("Paramètres du poste"). Un trigger empêche un `admin_poste` de modifier autre chose que ce
  tarif sur son poste (le nom et le slug restent réservés au Super Admin).
- Chaque ticket enregistre le montant réellement encaissé (`tickets.montant`), pré-rempli avec le
  tarif du poste mais modifiable au moment de la création si besoin.
- La page Tickets affiche le total des recettes du jour ("Recettes : X FCFA").
- **Périmètre volontairement limité** : ceci capture la donnée de recette au moment de la vente,
  ce n'est pas le module Comptabilité complet (journal de caisse, dépenses, bilan, export PDF —
  §9.7 du cahier des charges, prévu à l'étape 12). Cette étape évite simplement que la donnée de
  recette soit perdue/à retrouver plus tard.

## Base de données — Consultations et dossiers médicaux (étape 9)

`supabase/migrations/0007_consultations.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Crée `consultations` (motif, examen clinique, diagnostic, traitement, constantes — poids,
  température, tension) et `consultation_prescriptions` (lignes de médicament : nom, posologie,
  durée), liée à une consultation
- Même isolation stricte par poste que les étapes 6/7/8 (lecture par tout le poste, écriture
  interdite au rôle `lecture_seule`, suppression réservée à Administrateur Poste de Santé/Super
  Admin)

### Fonctionnement

- **Onglet "Consultations"** (nouveau, sur la fiche patient) : bouton "Ajouter une consultation" →
  formulaire (motif, constantes, examen clinique, diagnostic, traitement) → la consultation
  apparaît dans l'historique de la fiche
- **Ordonnance** : sur chaque consultation, bouton "Ajouter un médicament" permet d'ajouter autant
  de lignes que nécessaire (médicament, posologie, durée) — dès qu'une consultation a au moins une
  ligne, elle devient une ordonnance
- **Onglet "Ordonnances"** (désormais réel, plus un simple message d'attente) : liste toutes les
  ordonnances du patient, avec un bouton "Imprimer l'ordonnance" par consultation — impression
  navigateur standard isolée via `@media print`, même principe que le ticket de l'étape 8
- **Onglet "Historique médical"** : intègre désormais aussi les consultations dans la timeline
  fusionnée (avec visites, vaccins, notes de suivi)
- **Nouveau module de navigation "Consultations"** (`/poste/:slug/consultations`) : journal de
  toutes les consultations du poste, toutes fiches patients confondues, avec recherche par nom de
  patient et lien direct vers chaque fiche — utile pour une vue d'ensemble de l'activité médicale
  du poste, en complément de la vue par patient. Un bouton "Nouvelle consultation" y ouvre une
  recherche de patient (nom, prénom ou n° de dossier) ; une fois sélectionné, on est redirigé vers
  sa fiche, directement sur l'onglet Consultations (`?tab=consultations`) — la saisie elle-même
  reste sur la fiche patient, seul le point d'entrée est accessible depuis ce journal aussi.

### Périmètre volontairement exclu de cette étape

- Pas de gestion de stock de médicaments à cette étape — la prescription est une ligne de texte
  libre (nom, posologie, durée), pas un lien vers un article de pharmacie. Le rapprochement avec
  un inventaire réel est prévu aux étapes 11 (Pharmacie/Stock).
- Pas de modification/suppression d'une consultation ou d'une ligne de prescription déjà
  enregistrée depuis l'interface — cohérent avec la nature d'un dossier médical (traçabilité), une
  correction se fait via une nouvelle consultation.

## Base de données — Suivi des femmes enceintes (étape 10)

`supabase/migrations/0008_grossesses.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Crée `grossesses` (date des dernières règles, date prévue d'accouchement — calculée
  automatiquement à J+280 si non fournie, gestité, parité, facteurs de risque, puis à la clôture :
  date/lieu/mode d'accouchement, issue, poids de naissance, complications) et
  `consultations_prenatales` (CPN, numérotées automatiquement par grossesse : poids, tension,
  hauteur utérine, bruits du cœur fœtal, observations)
- Même isolation stricte par poste que les étapes 6/7/8/9

### Fonctionnement

- **Onglet "Grossesse"** (nouveau, sur la fiche patient — visible uniquement pour les patientes) :
  bouton "Ajouter une grossesse" → la grossesse apparaît avec sa DPA calculée automatiquement ; sur
  chaque grossesse, "Ajouter une CPN" permet de consigner le suivi prénatal au fil des visites
- **Clôture de la grossesse** : tant qu'une grossesse est "En cours", un bouton "Enregistrer
  l'accouchement" permet de saisir l'issue (date, lieu, mode, poids de naissance, complications) —
  la grossesse passe alors au statut "Accouchée" et devient un historique en lecture
- **Onglet "Historique médical"** : intègre désormais aussi les grossesses dans la timeline fusionnée
- **Nouveau module de navigation "Grossesse"** (`/poste/:slug/grossesses`) : journal de toutes les
  grossesses du poste triées par date prévue d'accouchement (les échéances les plus proches en
  premier), avec recherche par nom de patiente et bouton "Nouvelle grossesse" (recherche limitée
  aux patientes) — même principe que le journal Consultations de l'étape 9

### Périmètre volontairement exclu de cette étape

- Pas de rappel/notification automatique à l'approche d'une DPA ou d'une CPN manquée — la
  détection d'échéances proactive est prévue à l'étape 16 (Notifications intelligentes).
- Pas de lien entre l'issue "vivant" d'une grossesse et la création automatique d'une nouvelle
  fiche patient (nouveau-né) — resterait une saisie manuelle via le module Patients existant si le
  poste souhaite créer un dossier pour l'enfant.

## Base de données — Pharmacie et gestion des stocks (étape 11)

`supabase/migrations/0009_pharmacie_stock.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Crée `articles_stock` (catalogue partagé : médicaments, consommables, matériel — nom, unité,
  seuil d'alerte, solde de stock) et `mouvements_stock` (journal d'entrées/sorties, jamais modifié
  ni supprimé après coup — la vérité est dans le journal, pas dans une saisie manuelle du solde)
- Le solde (`stock_actuel`) est recalculé automatiquement par trigger à chaque mouvement inséré ;
  une sortie qui ferait passer le stock sous zéro est rejetée par la base de données
- Même isolation stricte par poste que les étapes 6 à 10

### Fonctionnement

- **Page "Pharmacie"** (`/poste/:slug/pharmacie`) : catalogue des médicaments uniquement, avec
  badge "Stock bas" dès que le solde atteint le seuil d'alerte. Bouton "Nouveau médicament" pour
  enrichir le catalogue, bouton "Dispenser" par ligne (quantité, patient facultatif via recherche,
  motif) — crée une sortie de stock.
- **Page "Stock"** (`/poste/:slug/stock`) : tous les articles, toutes catégories confondues
  (médicaments + consommables + matériel), avec un compteur d'articles sous le seuil d'alerte.
  Bouton "Nouvel article" (avec choix de catégorie), bouton "Réceptionner" par ligne — crée une
  entrée de stock (ex. livraison reçue).
- Les deux pages partagent le même catalogue et les mêmes mouvements : dispenser un médicament
  depuis Pharmacie fait baisser le même solde que celui affiché sur Stock — ce sont deux vues d'un
  seul système, correspondant aux deux rôles déjà prévus par le cahier des charges (Pharmacien /
  Magasinier), pas deux inventaires séparés.

### Prix, stock initial et traçabilité des modifications (complément, même jour)

`supabase/migrations/0010_pharmacie_prix_modif.sql` — à exécuter après `0009_pharmacie_stock.sql` :

- Ajoute `prix_unitaire` (FCFA) sur chaque article, affiché en colonne sur les deux pages.
- À la création d'un article, un champ "Quantité initiale en stock" permet de saisir le stock de
  départ (crée automatiquement un mouvement d'entrée avec le motif "Stock initial" — le solde ne
  peut jamais être écrit directement, même à la création).
- **La fiche article (nom, catégorie, unité, prix, seuil d'alerte) est modifiable** via un bouton
  "Modifier" — contrairement aux mouvements de stock ou aux dossiers médicaux (consultations,
  grossesses), une fiche article n'est pas un enregistrement d'historique, c'est une donnée de
  catalogue comme les informations d'un patient ou les paramètres d'un poste. Chaque modification
  est tracée automatiquement (colonne `updated_by`, renseignée par un trigger côté base de données
  à partir de l'utilisateur authentifié — donc infalsifiable depuis le client) et affichée sous le
  nom de l'article ("Modifié par {nom} · {date}").
- **Les mouvements de stock, eux, restent non modifiables** — une dispensation ou une réception
  mal saisie se corrige par un nouveau mouvement, jamais en réécrivant le journal (même principe
  de traçabilité confirmé par l'utilisateur pour les dossiers médicaux aux étapes 9/10).

### Vente au moment de la dispensation (complément 2, même jour)

`supabase/migrations/0011_pharmacie_vente.sql` — à exécuter après `0010_pharmacie_prix_modif.sql` :

- Ajoute `montant` (FCFA) sur un mouvement de stock — utilisé uniquement pour une sortie
  (dispensation), toujours nul pour une entrée (réception).
- Sur "Dispenser", un champ "Montant encaissé" est pré-rempli automatiquement (quantité × prix
  unitaire de l'article) et se recalcule tant que l'utilisateur ne l'a pas modifié à la main —
  ce qui permet une dispensation gratuite (programme national, don...) en mettant simplement 0,
  même principe que le montant pré-rempli-mais-modifiable des tickets (étape 8).
- **Périmètre volontairement limité** : ceci capture la donnée de recette au moment de la
  dispensation, comme pour les tickets — pas de tableau de bord de recettes pharmacie ici, la
  consolidation des recettes (tickets + pharmacie) est prévue à l'étape 12 (Comptabilité).

### Historique des mouvements — traçabilité (complément 3, même jour)

Nouvelle page **"Historique des mouvements"** (`/poste/:slug/mouvements`, lien "Voir l'historique"
depuis les pages Pharmacie et Stock) : liste chronologique de toutes les entrées et sorties de
stock du poste, avec pour chaque ligne — date et heure exactes, type (Entrée/Sortie), article,
quantité, montant encaissé (pour une sortie), patient concerné (si renseigné) et **qui a fait le
mouvement** (`mouvements_stock.created_by`, déjà enregistré depuis l'étape 11, simplement jamais
affiché jusqu'ici). Filtrable par type (Tous/Sorties/Entrées) et par nom d'article, paginée.
Aucune migration nécessaire — cette page ne fait que révéler des données déjà tracées dans le
journal de mouvements, cohérent avec le principe déjà établi qu'un journal reste consultable même
s'il n'est jamais modifiable.

**Correctif "Fait par" / "Modifié par" (`supabase/migrations/0013_tracabilite_noms.sql`)** : le
premier essai affichait "Fait par" vide pour la plupart des mouvements. Cause réelle : le nom était
récupéré par une jointure vers la table `profiles` au moment de l'affichage, or les règles de
sécurité de `profiles` (étape 6) n'autorisent à lire le profil d'un **autre** utilisateur que si on
est administrateur du même poste ou super admin — un caissier consultant l'historique ne pouvait
donc pas voir le nom d'un collègue pharmacien, par exemple (aucune erreur, la jointure retournait
simplement vide). Corrigé en capturant un **instantané du nom au moment de l'action**, via un
trigger qui calcule le nom côté base de données à partir de l'utilisateur authentifié
(`mouvements_stock.effectue_par`, `articles_stock.updated_by_nom`) — infalsifiable et toujours
visible, quel que soit le rôle de la personne qui consulte l'historique par la suite.

### Périmètre volontairement exclu de cette étape

- Pas de lien automatique entre une ligne d'ordonnance (étape 9, texte libre) et un article du
  catalogue — la dispensation est une action manuelle indépendante, pas un rapprochement
  automatique par nom de médicament (risque de faux rapprochements trop élevé pour un système de
  santé).
- Pas de modification/suppression d'un mouvement de stock déjà enregistré depuis l'interface —
  même principe de traçabilité que les dossiers médicaux (étapes 9/10, confirmé avec l'utilisateur
  le 2026-08-04) : une correction se fait via un nouveau mouvement, jamais en réécrivant le journal.
- Pas de gestion des dates de péremption ni de valorisation financière du stock — hors périmètre
  explicite de cette étape, pourra être abordé avec le module Comptabilité (étape 12) si besoin.

## Base de données — Comptabilité (étape 12)

`supabase/migrations/0012_comptabilite.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Crée `depenses` (date, catégorie, libellé, montant) — c'est le **seul** nouveau journal ajouté à
  cette étape : les recettes existent déjà (`tickets.montant` depuis l'étape 8, `mouvements_stock.montant`
  depuis l'étape 11), la Comptabilité les consolide plutôt que de les dupliquer.
- **RLS restreinte par rôle** (nouveau dans ce projet) : contrairement à tous les modules
  précédents (qui ne restreignent que le rôle `lecture_seule`), les dépenses ne sont visibles et
  modifiables que par l'Administrateur Poste de Santé, le Caissier, et le Super Admin — cohérent
  avec le rôle "Caissier" déjà défini dans le cahier des charges (§7.2 : "Comptabilité, recettes et
  dépenses").
- Comme les tickets et les mouvements de stock, les dépenses forment un journal — pas de
  modification/suppression depuis l'interface une fois saisies (une correction se fait via une
  nouvelle écriture).

### Fonctionnement

- **Page "Comptabilité"** (`/poste/:slug/comptabilite`, accès restreint — un utilisateur sans
  accès voit un message "Accès réservé" plutôt que la page) : sélecteur de période (Du/Au,
  par défaut le mois en cours), 4 cartes de synthèse (Recettes tickets, Recettes pharmacie,
  Dépenses, Solde — en rouge si négatif), tableau des dépenses de la période, bouton "Nouvelle
  dépense".
- **Bilan imprimable** : bouton "Imprimer le bilan" → même principe que les tickets/ordonnances
  (`window.print()` + isolation CSS `@media print`, pas de librairie PDF) — le "export PDF" du
  cahier des charges est couvert par la fonction "Imprimer → Enregistrer en PDF" du navigateur,
  cohérent avec le choix déjà fait pour les tickets/ordonnances plutôt que d'ajouter une
  dépendance (jsPDF etc.) juste pour ce besoin.
- Le menu latéral n'affiche que les modules réellement accessibles au rôle connecté — un module
  restreint n'apparaît pas du tout dans la liste (plutôt qu'affiché grisé avec un badge
  "Restreint"), pour que chaque rôle voie un menu propre, limité à ce qui le concerne. Seul le
  badge "Par poste" subsiste (super admin hors du contexte d'un poste précis).

### Périmètre volontairement exclu de cette étape

- Pas de saisie de recettes indépendante ici — les recettes viennent exclusivement des modules qui
  les génèrent (Tickets, Pharmacie). Comptabilité est une consolidation en lecture, pas un
  troisième endroit où encoder une vente.
- Pas d'export CSV/Excel ni de comptabilité multi-devises — hors périmètre explicite du cahier des
  charges pour cette étape.

## Suppression définitive d'un compte (étape 13, complément — 2026-08-05)

Nouveau bouton **"Supprimer le compte"** (rouge, avec confirmation) sur chaque ligne de Personnel
— comptes en attente et équipe — pour éliminer un compte de test ou erroné, pas seulement le
retirer du poste (qui ne fait que le repasser en attente d'affectation).

**Première Edge Function du projet** (`supabase/functions/delete-account/index.ts`) : supprimer un
compte `auth.users` nécessite l'API admin de Supabase, qui exige la clé `service_role` — une clé
qui ne doit **jamais** être exposée côté client (React), car elle contourne toutes les policies
RLS. La fonction tourne côté serveur, vérifie elle-même que l'appelant a le droit de supprimer CE
compte précis (même règle que `prevent_role_escalation()` : un Administrateur Poste ne peut
supprimer qu'un rôle de terrain de sa propre équipe, jamais un autre admin ni le Super Admin ; le
Super Admin peut supprimer n'importe qui), puis seulement appelle `auth.admin.deleteUser()`. La
suppression de `auth.users` supprime automatiquement la ligne `profiles` correspondante (clé
étrangère en cascade) — toute trace du compte disparaît immédiatement de Personnel.

**Déploiement** (aucun accès CLI nécessaire) : Dashboard Supabase → **Edge Functions** → **New
function** → nommez-la `delete-account` → collez le contenu de
`supabase/functions/delete-account/index.ts` → **Deploy**. Les variables `SUPABASE_URL` /
`SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` sont déjà disponibles automatiquement dans
l'environnement de toute Edge Function — rien à configurer en plus.

## Démarrage d'un nouveau poste — promotion Administrateur Poste (étape 13, complément — 2026-08-05)

Avec 7 postes de santé mais un seul Administrateur Poste bootstrappé (Falila, via l'étape 4),
les 6 autres postes n'avaient aucun moyen de démarrer : la liste déroulante "Comptes en attente"
de Personnel ne propose jamais le rôle Administrateur Poste (volontairement, pour empêcher un
admin de se l'auto-attribuer), et personne ne pouvait valider le tout premier compte d'un poste
sans administrateur.

Nouveau bouton **"Promouvoir Administrateur Poste"**, réservé au **Super Admin**, sur chaque
compte en attente d'affectation. Parcours complet pour démarrer un nouveau poste, désormais
100% en libre-service (plus de commande SQL manuelle nécessaire, sauf pour le tout premier
Super Admin lui-même — voir étape 4) :
1. La personne s'inscrit sur `/inscription` et choisit son poste.
2. Le Super Admin va sur `/poste/{slug}/personnel` de ce poste, repère le compte, clique sur
   "Promouvoir Administrateur Poste" (confirmation demandée — l'action donne un accès complet au
   poste).
3. Cette personne peut ensuite gérer sa propre équipe de façon totalement autonome.

Corrigé au passage : `usePendingProfiles` ne filtrait pas explicitement par poste demandé
(`poste_souhaite_id`) — la RLS restreint déjà correctement un Administrateur Poste à son propre
poste, mais le Super Admin voit tous les postes en base, donc sans ce filtre explicite sa page
Personnel affichait les comptes en attente de **tous** les postes mélangés, pas seulement ceux du
poste affiché à l'écran.

## Base de données — Gestion du personnel (étape 13)

`supabase/migrations/0014_personnel.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Jusqu'ici, seul un Super Admin pouvait affecter un compte fraîchement inscrit à un poste
  (limitation documentée dès l'étape 6). Cette étape ferme cette boucle : un Administrateur Poste
  de Santé peut désormais gérer lui-même son équipe.
- RLS étendue : un admin de poste peut voir les comptes **en attente d'affectation**
  (`poste_id` null), en plus de son propre poste.
- Le trigger `prevent_role_escalation` (étape 4/6) est étendu avec deux nouveaux cas précis : un
  admin de poste peut **affecter** un compte en attente à son poste avec un rôle de terrain (jamais
  admin_poste/super_admin_ucds), et peut **retirer** un membre de son équipe (le compte repasse en
  attente). Toujours impossible d'agir sur soi-même, ou vers/depuis un autre poste.

### Fonctionnement

- **Page publique "Créer un compte"** (`/inscription`, lien depuis la page de connexion) : un
  nouvel employé crée lui-même son compte (nom, email, mot de passe) — il atterrit sur la page
  "Compte en attente d'assignation" (déjà construite à l'étape 6) tant que personne ne l'a intégré
  à une équipe.
- **Page "Personnel"** (`/poste/:slug/personnel`, accès restreint à l'Administrateur Poste de
  Santé et au Super Admin) : deux sections — "Comptes en attente d'affectation" (choisir un rôle
  puis "Affecter à mon équipe") et "Mon équipe" (changer le rôle d'un membre, ou "Retirer du
  poste" — le compte repasse en attente, réutilisable). La propre ligne de l'administrateur
  s'affiche sans action (impossible de se modifier soi-même).
- Le menu latéral "Personnel" n'apparaît pas pour les rôles sans accès (voir étape 13 complément,
  ci-dessous — les modules restreints sont retirés du menu plutôt qu'affichés grisés).

### Périmètre volontairement exclu de cette étape

- Pas de suppression de compte (auth.users) depuis l'interface — retirer un membre le repasse en
  attente plutôt que de le supprimer, réversible et sans risque de perte de données historiques
  (un ticket/une consultation garde son `created_by` même si son auteur quitte l'équipe).
- Pas d'invitation par email envoyée par l'admin (ce qui nécessiterait une clé service-role côté
  serveur, hors du périmètre client-only du projet) — le nouvel employé crée son compte lui-même.
- Les comptes en attente sont visibles par **n'importe quel** Administrateur Poste de Santé (pas
  seulement celui du poste visé), cohérent avec une petite commune où les responsables se
  connaissent — documenté comme un choix de conception assumé, pas un oubli.

## Ciblage du poste à l'inscription et restriction des modules par rôle (étape 13, complément)

`supabase/migrations/0015_ciblage_et_roles.sql` — à exécuter après `0014_personnel.sql`. Ajouté
suite à deux questions de sécurité posées par l'utilisateur juste après la validation de l'étape
13 de base.

### Ciblage du poste à l'inscription

- **Problème** : n'importe quel Administrateur Poste de Santé pouvait voir et récupérer
  n'importe quel compte en attente, même destiné à un autre des 7 postes.
- **Correctif** : à l'inscription (`/inscription`), la personne choisit désormais son poste de
  santé souhaité (`profiles.poste_souhaite_id`, capturé via le même mécanisme que `full_name` —
  fonctionne même si la confirmation par email est activée). Un admin ne voit et ne peut affecter
  que les comptes en attente ayant demandé **son** poste — appliqué à la fois en RLS (ce qui est
  réellement visible) et dans le trigger `prevent_role_escalation` (ce qui est réellement
  affectable), pas seulement dans l'interface.
- La liste des postes est désormais lisible avant connexion (policy RLS dédiée au rôle `anon`) pour
  peupler ce menu déroulant sur une page publique.

### Restriction des modules par rôle

- **Problème** : seules Comptabilité et Personnel étaient réellement restreintes ; tout le reste
  (Patients, Consultations, Grossesse, Pharmacie, Stock) était accessible à n'importe quel membre
  du personnel non "lecture seule", peu importe son rôle précis.
- **Correctif**, appliqué à la fois en RLS (la vraie protection) et dans l'interface (menu latéral
  + message "Accès réservé", pour éviter la confusion plutôt que par sécurité) :

| Module | Rôles autorisés (en plus d'Administrateur Poste et Super Admin) |
|---|---|
| Patients (dont Consultations/Grossesse/Ordonnances/Vaccins/Visites/Suivi, onglets de la fiche) | Médecin, Infirmier Chef, Sage-femme, Agent de santé |
| Consultations (journal), Grossesse (journal) | Médecin, Infirmier Chef, Sage-femme |
| Pharmacie, Stock, Historique des mouvements | Pharmacien, Magasinier |
| Comptabilité *(déjà en place depuis l'étape 12)* | Caissier |
| Personnel *(déjà en place)* | — (Administrateur Poste uniquement) |
| Tickets | **Reste ouvert à tout le personnel non lecture-seule**, sur demande explicite de
  l'utilisateur (accueil partagé entre plusieurs profils) |

- Le rôle **"Consultation uniquement" (lecture_seule) garde un accès en lecture à tous les
  modules** ci-dessus — c'est un rôle d'observateur transversal, différent des rôles de terrain qui
  sont eux volontairement cloisonnés à leur domaine.
- La table `patients` elle-même (informations de base, pas le dossier clinique) et la table
  `tickets` restent lisibles par tout le personnel du poste — nécessaire pour que la recherche de
  patient depuis un ticket (Caissier) ou une dispensation (Pharmacien) continue de fonctionner,
  même si ces rôles n'ont pas accès au module Patients complet.

**Correctif (`supabase/migrations/0016_fix_recettes_pharmacie.sql`)** : la restriction ci-dessus
avait oublié une dépendance croisée symétrique à celle des tickets — le Bilan de la Comptabilité
(étape 12) a besoin de **lire** `mouvements_stock` pour calculer les recettes pharmacie, mais le
Caissier n'était plus dans la liste des rôles autorisés à lire cette table. Résultat : "Recettes
pharmacie" retombait silencieusement à 0 dans le Bilan, alors que les ventes étaient bien
enregistrées. Corrigé en ajoutant le Caissier à la policy de lecture de `mouvements_stock`
uniquement (toujours pas en écriture, et `articles_stock` reste hors de sa portée — il n'a besoin
que du montant des ventes, pas de gérer le catalogue).

### Périmètre volontairement exclu de ce complément

- Pas de matrice de permissions configurable depuis l'interface (par exemple, permettre à un
  Administrateur Poste de personnaliser qui a accès à quoi) — la répartition ci-dessus est fixée
  dans le code, cohérente avec les descriptions de rôles déjà définies par le cahier des charges.

## Base de données — Inventaires périodiques (étape 14)

`supabase/migrations/0017_inventaires.sql` — à exécuter dans **Supabase Dashboard → SQL Editor** :

- Crée `inventaires` (une session de comptage physique du stock — date, statut `en_cours`/`cloture`)
  et `inventaire_lignes` (une ligne par article compté : stock théorique au moment du comptage,
  stock réellement compté, notes).
- Nouvelle fonction `cloturer_inventaire(p_inventaire_id)` : à la clôture, chaque écart
  (compté ≠ théorique) devient automatiquement un mouvement de stock (`mouvements_stock`, motif
  "Ajustement d'inventaire") — **le solde d'un article ne s'écrit jamais directement**, même pour
  un inventaire, même principe que toute l'étape 11. Une fois clôturé, les lignes sont verrouillées
  (RLS : plus aucune modification possible).
- Mêmes rôles que Pharmacie/Stock (Pharmacien, Magasinier, Administrateur Poste ; lecture seule en
  lecture) — réutilise `is_pharmacie_role()` ajoutée à l'étape 13.

### Fonctionnement

- **Bouton "Inventaires"** depuis la page Stock (comme "Voir l'historique") → journal des sessions
  passées + bouton "Nouvel inventaire".
- **Session de comptage** : liste tous les articles du poste, avec pour chacun le stock théorique
  et un champ "Quantité comptée" à renseigner (pas besoin de tout compter en une fois — on peut
  revenir plus tard tant que la session n'est pas clôturée).
- **Clôture** : un écran de confirmation rappelle combien d'articles restent non comptés (ignorés,
  pas bloquants) et que les écarts vont générer des mouvements de stock automatiques. Une fois
  confirmée, la session devient en lecture seule et affiche chaque écart (badge vert si excédent,
  rouge si manquant).

### Périmètre volontairement exclu de cette étape

- Pas de génération de rapport imprimable pour un inventaire clôturé — les écarts restent
  consultables sur la page, mais pas encore exportables en PDF (à voir si demandé, même principe
  d'impression navigateur que les tickets/ordonnances/bilan).
- Pas de planification automatique d'inventaires récurrents (rappel mensuel, etc.) — hors périmètre
  explicite, pourrait relever de l'étape 16 (Notifications intelligentes) si besoin.

## Base de données — Rapports et statistiques (étape 15)

Aucune nouvelle table : le module Rapports agrège des données déjà collectées par les modules
précédents (Patients, Tickets, Consultations, Grossesse, Pharmacie/Stock, Comptabilité,
Personnel). La seule migration (`0018_rapports.sql`) élargit la politique RLS
`depenses_select` au rôle "Consultation uniquement" — jusqu'ici volontairement exclue des
dépenses (étape 12), cette exclusion aurait sinon fait apparaître un total de dépenses/bilan à
zéro sans erreur visible pour ce rôle, une fois Rapports ouvert à `lecture_seule`.

### Accès

Réservé à l'Administrateur Poste de Santé, à "Consultation uniquement" et au Super Admin — les
rapports sont une vue de pilotage transversale, pas un outil métier quotidien d'un rôle de
terrain en particulier.

### Fonctionnement

- **Sélecteur de période** (Du/Au, même composant que le Bilan comptable de l'étape 12).
- **8 indicateurs clés** sur la période : nouveaux patients, tickets émis, consultations, CPN
  réalisées, accouchements, ventes pharmacie, dépenses, solde.
- **3 graphiques** (composants `BarChart`/`LineChart` existants, aucune librairie externe) :
  tickets par statut, consultations par jour, personnel par rôle.
- **Alertes stock** : liste des articles sous leur seuil d'alerte (même règle que la page Stock),
  indépendante de la période choisie puisqu'il s'agit d'un état courant, pas d'un historique.
- **Rapport imprimable** via `window.print()` (même principe que les tickets/ordonnances/bilan) :
  reprend tous les indicateurs, la répartition des tickets, le détail financier, le personnel par
  rôle et les alertes stock dans un format sobre destiné à l'impression papier.

### Périmètre volontairement exclu de cette étape

- Pas de vue comparative multi-postes pour le Super Admin — il consulte le rapport d'un poste à la
  fois, comme les autres rôles autorisés. Une vue agrégée des 7 postes pourra être ajoutée plus
  tard si besoin.
- Pas d'export CSV/Excel — seul l'export imprimable (PDF via l'impression navigateur) est
  disponible, cohérent avec le reste du projet.

## Base de données — Réglages du poste et en-tête/pied de page des documents (étape 15, complément)

Suite au retour utilisateur après la livraison des Rapports : ajout d'une page **Réglages**
(dernier élément du menu latéral, réservée à l'Administrateur Poste et au Super Admin) permettant
de renseigner le numéro de téléphone du poste, le nom de son chef, ainsi qu'un cachet et une
signature (images). `supabase/migrations/0019_reglages_poste.sql` ajoute 4 colonnes à
`postes_sante` (`telephone`, `nom_chef`, `cachet_url`, `signature_url` — aucune nouvelle policy
RLS nécessaire, la policy `postes_sante_update_poste_admin` de l'étape 8 couvre déjà cet accès) et
un bucket Storage public `poste-branding` (les images ne sont pas des données sensibles,
contrairement aux documents patients).

Un composant partagé (`src/components/print/PosteLetterhead.jsx`) affiche désormais, sur les
tickets, les ordonnances et les rapports imprimés :
- **En-tête** : nom du poste + numéro de téléphone (si renseigné).
- **Pied de page** : cachet, signature et nom du chef de poste (si renseignés — un poste qui n'a
  pas encore rempli Réglages imprime simplement sans pied de page, pas de placeholder vide).

Le bilan comptable (étape 12) n'a volontairement pas encore ce pied de page — à ajouter si demandé,
la même infrastructure le permet directement.

## Refonte du tableau de bord du poste (étape 15, complément)

L'accueil d'un poste (`/poste/:slug/tableau-de-bord`) datait de l'étape 6/8 et n'avait pas suivi le
reste de la plateforme : il affichait encore un message "modules à venir" alors que tout est
construit depuis l'étape 15, dupliquait la liste d'équipe déjà présente sur Personnel (étape 13),
et logeait le réglage du tarif du ticket au milieu de l'accueil plutôt que dans Réglages.

- **Tarif du ticket** déplacé vers Réglages (`ReglagesPage`), à côté du téléphone/nom du chef/
  cachet/signature — c'était d'ailleurs le seul réglage de poste resté sans page dédiée depuis
  l'étape 8.
- **"Mon équipe" retiré** : redondant avec Personnel, déjà accessible depuis l'accès rapide.
- **KPIs réels du jour** (patients enregistrés, tickets du jour + en attente, consultations du
  jour, articles sous le seuil d'alerte) — chaque carte n'apparaît que si le rôle connecté a accès
  au module correspondant, pour éviter qu'un rôle sans accès à la Pharmacie ou aux Consultations
  ne voie un chiffre à 0 qui serait en réalité juste filtré par la RLS (piège déjà rencontré à
  l'étape 13 avec les recettes pharmacie).
- **Grille d'accès rapide** vers les modules accessibles au rôle connecté.

Un nouveau hook partagé `src/hooks/useModuleAccess.js` centralise désormais les règles d'accès par
module (utilisé à la fois par la Sidebar et par cet accueil) — avant, la même logique de rôles
était dupliquée dans `DashboardLayout.jsx` uniquement ; toute évolution future des accès par module
ne se fait donc plus qu'à un seul endroit.

## Ordonnances visibles depuis la Pharmacie (étape 15, complément)

Nouveau bouton "Ordonnances" sur la page Pharmacie → liste des médicaments prescrits récemment,
groupés par ordonnance (patient + date + liste des médicaments/posologie/durée), pour que le
Pharmacien puisse préparer les médicaments avant que le patient ne se présente au comptoir.
Filtrable par patient et par période (Récentes / Aujourd'hui).

`supabase/migrations/0020_ordonnances_pharmacie.sql` élargit uniquement la lecture de
`consultation_prescriptions` (médicament/posologie/durée + patient) aux rôles Pharmacien et
Magasinier — **la table `consultations`** (diagnostic, examen clinique, tension artérielle...)
**reste réservée aux rôles cliniques**, comme depuis l'étape 13. La Pharmacie n'a accès qu'à ce
dont elle a besoin (quoi préparer, pour qui), pas au dossier médical complet.

## Notifications intelligentes (étape 16)

La cloche de la barre de navigation (jusqu'ici décorative, seule l'alerte "postes sans
administrateur" du Super Admin y était câblée) devient un vrai panneau de notifications cliquable,
adapté au rôle et au poste courant. Aucune nouvelle table : comme les KPI du tableau de bord et
des rapports, chaque alerte reflète l'état **actuel** (pas d'historique, pas de statut lu/non lu)
— choix confirmé avec le client pour rester cohérent avec le reste de l'app et éviter la
complexité d'un système de notifications persistantes (triggers par événement, marquage lu/non lu).

**Alertes actives**, chacune n'apparaissant que si le rôle connecté a accès au module concerné
(`src/hooks/usePosteAlerts.js`, `src/hooks/useModuleAccess.js`) :
- **Stock bas** — articles sous leur seuil d'alerte (Pharmacien, Magasinier, Admin Poste, Super
  Admin, Consultation uniquement).
- **Comptes en attente d'affectation** — signups ayant demandé ce poste (Admin Poste, Super
  Admin).
- **Inventaires non clôturés depuis plus de 2 jours** — mêmes rôles que Stock bas.
- **Postes sans administrateur** — déjà en place depuis l'étape 5, réservée au Super Admin.

Chaque alerte est cliquable et renvoie directement vers la page concernée. Mis à jour en temps
réel via Supabase Realtime (mêmes canaux que les autres compteurs du projet). Aucune nouvelle
policy RLS nécessaire — toutes les lectures utilisées existaient déjà pour ces rôles.

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
- [x] Étape 4 — Authentification et gestion des rôles
- [x] Étape 5 — Tableau de bord principal
- [x] Étape 6 — Architecture Multi-Tenant
- [x] Étape 7 — Gestion des patients
- [x] Étape 8 — Gestion des tickets et file d'attente
- [x] Étape 9 — Consultations et dossiers médicaux
- [x] Étape 10 — Suivi des femmes enceintes
- [x] Étape 11 — Gestion de la pharmacie et des stocks
- [x] Étape 12 — Comptabilité
- [x] Étape 13 — Gestion du personnel
- [x] Étape 14 — Inventaires périodiques
- [x] Étape 15 — Rapports et statistiques
- [x] Étape 16 — Notifications intelligentes
- [x] Étape 17 — Tests, optimisation, sécurité, PWA et déploiement

## Tableau de bord (étape 5)

`src/layouts/DashboardLayout.jsx` fournit l'ossature commune (Sidebar + Navbar + zone de contenu)
pour toutes les pages internes futures — les modules des étapes 6 à 16 s'ajouteront comme routes
enfants sous ce même layout. Le menu latéral affiche déjà les 11 modules du cahier des charges
(§9), verrouillés avec un badge indiquant leur étape de livraison.

Les statistiques du tableau de bord (`src/pages/dashboard/DashboardPage.jsx`,
`src/hooks/useDashboardOverview.js`) sont **réelles**, pas des données d'exemple : nombre de
postes, nombre d'utilisateurs, répartition par rôle, et alertes sur les postes sans administrateur
assigné — toutes calculées à partir des tables `postes_sante`/`profiles` et mises à jour en temps
réel. Aucune statistique métier (patients, consultations, stock...) n'est affichée tant que les
modules correspondants ne sont pas construits — ce sera fait au fur et à mesure des étapes 7 à 16.

## Architecture Multi-Tenant (étape 6)

Après connexion, chaque personne arrive automatiquement au bon endroit (`src/utils/getHomePath.js`) :

| Situation | Destination |
|---|---|
| Super Administrateur UCDS | `/tableau-de-bord` — vue globale des 7 postes |
| Compte rattaché à un poste | `/poste/:slug/tableau-de-bord` — espace de ce poste uniquement |
| Compte sans poste assigné | `/en-attente-assignation` |

Deux gardes de route (`src/routes/RequireSuperAdmin.jsx`, `src/routes/RequirePosteAccess.jsx`)
empêchent d'accéder à l'espace d'un autre poste en modifiant l'URL — en complément de l'isolation
déjà garantie côté base de données par la Row Level Security. Le Super Admin peut néanmoins
consulter l'espace de n'importe quel poste (bouton "Voir l'espace" depuis son tableau de bord) à
des fins de supervision.

## Actualités — module Super Admin (post-étape 17, 2026-08-06)

La section "Actualités" de la Landing Page (§5.9 du cahier des charges) était jusqu'ici un contenu
d'exemple statique. Elle est maintenant pilotée par le **Super Admin UCDS**, qui a le monopole de
sa gestion (aucun Administrateur Poste n'y a accès — c'est du contenu institutionnel global, pas
lié à un poste précis).

- Nouvelle page **`/actualites`** (dernier élément du menu du Super Admin) : créer, modifier,
  supprimer des actualités — titre, catégorie (Blog / Évènements / Campagnes / Vaccinations /
  Sensibilisations, les 5 déjà affichées sur la Landing Page), description, image.
- `supabase/migrations/0024_actualites.sql` : table `actualites` + bucket Storage public
  `actualites-images`. Lecture ouverte à **tout le monde, y compris les visiteurs non connectés**
  (`to anon, authenticated`) — c'est la seule table du projet avec cette policy en dehors de
  `postes_sante` (liste des postes pour le formulaire d'inscription), puisque la Landing Page est
  publique. Écriture strictement réservée à `is_super_admin()`.
- La section "Actualités" de la Landing Page (`src/pages/landing/sections/News/News.jsx`) lit
  maintenant ces données réelles au lieu du tableau d'exemple — toute modification faite par le
  Super Admin apparaît immédiatement pour les visiteurs, sans redéploiement.

## Étape 17 — Tests, optimisation, sécurité, PWA et déploiement

Dernière étape du cahier des charges. Résumé de ce qui a été fait, ce qui reste à valider par le
client, et comment mettre la plateforme en ligne.

### Sécurité — revue effectuée le 2026-08-05

- `.env` correctement ignoré par Git, jamais commité ; seul `.env.example` (valeurs factices) est
  versionné.
- Aucune clé `service_role` côté client — seule l'Edge Function `delete-account` y a accès, et
  uniquement côté serveur.
- RLS activée sur les 17 tables métier, sans exception.
- **Deux failles corrigées** par `supabase/migrations/0023_immutabilite_dossiers_medicaux.sql`
  (à exécuter comme les précédentes) :
  1. Les tables cliniques immuables (consultations, ordonnances, grossesses, CPN, mouvements de
     stock) avaient encore des policies UPDATE/DELETE actives en base, même si l'interface n'a
     jamais proposé de bouton pour s'en servir — la RLS est la vraie protection dans ce projet,
     donc c'était une vraie faille, pas juste un détail. Ces policies sont retirées : seules
     lecture et création restent possibles.
  2. Suppression en cascade dangereuse : supprimer un patient ou un article de pharmacie effaçait
     silencieusement tout son historique (consultations, mouvements de stock...). Remplacé par un
     verrou (`on delete restrict`) — un patient ou un article ayant un historique réel ne peut
     plus être supprimé du tout, seule une fiche créée par erreur et jamais utilisée peut l'être.
- **Point ouvert, non tranché** : les carnets de vaccination/visites/notes de suivi restent
  modifiables et supprimables par tout le personnel du poste (pas seulement l'admin) — jamais
  discuté explicitement comme "immuable" contrairement aux consultations. À valider avec le client
  si le même verrouillage doit s'y appliquer.
- Recommandation Supabase Dashboard (hors code) : Authentication → Policies → vérifier la longueur
  minimale du mot de passe (6 caractères par défaut) et l'activer à 8+ si souhaité.

### Optimisation

Chargement à la demande par route (`React.lazy` + `Suspense` dans `src/routes/AppRouter.jsx`) —
seule la Landing Page reste chargée immédiatement. Le script principal est passé de ~660 Ko à
~462 Ko (gzip ~132 Ko), et l'avertissement Vite "chunk > 500 Ko" a disparu. Chaque module (Pharmacie,
Comptabilité, Rapports...) n'est téléchargé qu'au moment d'y naviguer — important sur les connexions
mobiles limitées visées par ce projet.

### PWA

Configuration présente depuis l'étape 1 (`vite-plugin-pwa`), vérifiée en profondeur pour la
première fois : manifeste, icônes (192/512), enregistrement du service worker — tout était déjà
correctement généré au build. Un oubli corrigé : la langue du manifeste était `en` par défaut,
passée à `fr`.

### Tests

Pas de suite automatisée (choix assumé, cf. mémoire de travail) — `CHECKLIST-TESTS.md` à la racine
du projet couvre tous les parcours critiques par rôle et par module, à dérouler avant l'ouverture
aux 7 postes.

### Déploiement

Recommandé : **Vercel**, gratuit pour ce volume de trafic, connecté directement à votre dépôt
GitHub, sans ligne de commande (cohérent avec la façon dont Supabase a été utilisé tout au long du
projet).

1. Sur [vercel.com](https://vercel.com), connectez-vous avec votre compte GitHub.
2. **Add New → Project** → sélectionnez `NDIAYE-dotcom/plateform-medina-sabakh`.
3. Vercel détecte Vite automatiquement (build `npm run build`, dossier `dist`) — ne rien changer.
4. **Environment Variables** : ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (les mêmes
   valeurs que dans votre `.env` local).
5. **Deploy**. Vous obtenez une adresse `https://....vercel.app` (personnalisable ensuite avec un
   nom de domaine à vous, payant, depuis Project Settings → Domains).
6. `vercel.json` (déjà présent à la racine) redirige toutes les routes vers `index.html` — sans lui,
   rafraîchir la page sur `/poste/falila/tickets` afficherait une erreur 404 au lieu de fonctionner
   (React Router gère les routes uniquement côté navigateur, Vercel doit apprendre à toujours
   servir la même page).
7. **Étape à ne pas oublier côté Supabase** : Dashboard → Authentication → URL Configuration →
   ajoutez votre nouvelle adresse Vercel à **Site URL** et **Redirect URLs**. Sans ça, les liens de
   confirmation d'inscription et de réinitialisation de mot de passe redirigeront vers
   `localhost` et ne fonctionneront pas pour vos utilisateurs réels.

## Notes

- Les composants Chart (`BarChart`, `LineChart`, `Sparkline`) sont en SVG pur, sans dépendance externe, conformément à la contrainte "CSS pur / pas de bibliothèque non validée".
- **Contenu provisoire à valider avec le client avant mise en production** : coordonnées de contact (téléphone/email/adresse dans `sections/Contact`), chiffres de la section Statistiques (postes/villages/campagnes/bénéficiaires — à brancher sur les vraies données à l'étape 15), descriptions des postes de santé, articles d'exemple de la section Actualités, et le texte des pages `legal/`.
- **Logo officiel intégré le 2026-08-05** (`src/components/ui/Logo`) — remplace le placeholder dessiné à la main de l'étape 3. Généré à partir de `brand/logo-source.png` (fourni par le client, non servi tel quel) : `public/logo-icon.png` (symbole seul) et `public/logo-full.png` (symbole + mot-symbole "UCDS", sans le sous-titre) pour le composant `Logo`, plus favicon, icône Apple Touch et icônes PWA (192/512) régénérées à partir du même symbole.
- Le formulaire de contact simule l'envoi (validation + toast de confirmation) ; il n'est pas encore relié à un backend Supabase — aucune étape de la feuille de route ne couvre explicitement cette persistance, à clarifier avec le client si besoin.
- Logo UCDS provisoire (mark généré, pas le logo officiel de l'organisation) : `public/favicon.svg`, `public/apple-touch-icon.png`, `public/icons/icon-192.png` et `icon-512.png`, ainsi que `components/ui/Logo`. À remplacer si l'UCDS fournit une identité graphique officielle.
