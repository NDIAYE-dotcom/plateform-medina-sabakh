# Checklist de test manuel — avant mise en production

Étape 17 du cahier des charges. À dérouler avec de vrais comptes (un par rôle, sur au moins
2 postes différents) avant d'ouvrir la plateforme aux 7 postes de santé. Cochez au fur et à
mesure ; notez tout écart à côté de la case plutôt que de l'ignorer.

> **Sections 1 à 11 et 14 validées le 2026-08-05** avec des comptes réels sur Falila et Kohel.
> Deux problèmes trouvés et corrigés pendant cette passe :
> - Limite d'envoi d'emails Supabase atteinte pendant les tests d'inscription → confirmation email
>   désactivée dans Supabase Dashboard (chaque compte est de toute façon validé manuellement par un
>   Administrateur Poste, l'email de confirmation était redondant).
> - La cloche de notifications ne signalait les comptes en attente que pour le poste actuellement
>   ouvert — aucun signal sur le tableau de bord global du Super Admin pour savoir quel poste avait
>   une demande en attente. Corrigé : la vue globale liste maintenant tous les comptes en attente,
>   tous postes confondus.
>
> **Sections 12 (PWA/Mobile) et 13 (Performance) pas encore testées** — à faire avant l'ouverture
> réelle aux 7 postes, idéalement sur un vrai téléphone.

## 1. Comptes et rôles

- [x] Inscription (`/inscription`) : les 7 postes apparaissent dans la liste déroulante
- [x] Après inscription, le compte atterrit sur "Compte en attente d'assignation"
- [x] Super Admin → Personnel du poste demandé → le compte apparaît dans "Comptes en attente"
- [x] "Promouvoir Administrateur Poste" fonctionne, avec confirmation
- [x] Le nouvel Admin Poste peut se connecter et gérer sa propre équipe sans aide extérieure
- [x] Admin Poste → affecter un compte en attente avec un rôle de terrain → accès correct au module
- [x] Admin Poste → changer le rôle d'un membre existant
- [x] Admin Poste → "Retirer du poste" → le compte repasse en attente (pas supprimé)
- [x] "Supprimer le compte" (Edge Function) → confirmation → compte introuvable ensuite dans
      Authentication → Users côté Supabase
- [x] Un Admin Poste ne voit **que** les comptes en attente ayant demandé **son** poste (pas ceux
      des autres postes)
- [x] Un Admin Poste ne peut pas promouvoir un autre Administrateur Poste (bouton absent du menu
      déroulant de rôles)

## 2. Isolation multi-tenant (le point le plus critique à valider)

- [x] Connecté sur le Poste A, `/poste/B-slug/...` (poste différent) redirige — pas d'accès
- [x] Les listes (patients, tickets, stock...) du Poste A ne montrent jamais de données du Poste B
- [x] Le Super Admin, lui, peut consulter n'importe quel poste normalement

## 3. Par rôle — vérifier que le menu latéral ne montre QUE les modules autorisés

- [x] Médecin / Infirmier Chef / Sage-femme → Patients, Consultations, Grossesse, Tickets
- [x] Pharmacien / Magasinier → Pharmacie, Stock, Tickets (pas Patients ni Consultations)
- [x] Caissier → Tickets, Comptabilité
- [ ] Agent de santé → Patients, Tickets
- [x] Consultation uniquement → tous les modules, en lecture seule (aucun bouton d'ajout/modif visible)
- [x] Naviguer directement vers l'URL d'un module non autorisé → message "Accès réservé", pas de
      page blanche ni d'erreur

## 4. Patients

- [x] Créer un patient, numéro de dossier auto-généré et séquentiel
- [x] Modifier les informations de contact (téléphone, adresse) — traçable (`updated_by`)
- [x] Ajouter vaccin / visite / note de suivi / document — formulaire replié par défaut
- [x] Recherche patient (nom/prénom/numéro dossier) fonctionne dans Patients ET dans Tickets

## 5. Tickets

- [x] Créer un ticket avec et sans patient rattaché, numérotation quotidienne correcte
- [x] Changer le statut (en attente → en cours → terminé)
- [x] Impression du ticket : QR code, montant, en-tête/pied de page (si Réglages rempli)

## 6. Consultations et Grossesse

- [x] Créer une consultation avec ordonnance (plusieurs médicaments)
- [x] Impossible de modifier/supprimer une consultation existante (aucun bouton visible)
- [x] Impression de l'ordonnance : titre, encadré patient, diagnostic, médicaments numérotés
- [x] Créer une grossesse, DPA auto-calculée à J+280 si non renseignée
- [x] Ajouter une CPN, enregistrer un accouchement

## 7. Pharmacie / Stock

- [x] Créer un article, entrée de stock initiale
- [x] Dispenser (sortie de stock) depuis Pharmacie — stock décrémenté
- [x] Badge "Stock bas" quand `stock_actuel <= seuil_alerte`
- [x] Historique des mouvements : traçable (qui, quoi, quand), motif visible (notamment
      "Ajustement d'inventaire")
- [x] Nouvel inventaire → compter quelques articles avec un écart volontaire → clôturer → l'écart
      devient un mouvement de stock automatiquement
- [x] Page Ordonnances (Pharmacie) : les ordonnances récentes apparaissent, filtrables par patient
      et par "Aujourd'hui" — le Pharmacien ne voit ni diagnostic ni examen clinique

## 8. Comptabilité

- [x] Recettes tickets + recettes pharmacie + dépenses = solde correct sur la période choisie
- [x] Ajouter une dépense, elle apparaît immédiatement dans le total
- [x] Impression du bilan

## 9. Rapports

- [x] KPI de la période correspondent aux données réelles (recouper avec Comptabilité/Pharmacie)
- [x] Graphiques (tickets par statut, consultations par jour, personnel par rôle) cohérents
- [x] Impression du rapport complet

## 10. Réglages et documents imprimés

- [x] Renseigner téléphone, nom du chef de poste, uploader cachet + signature
- [x] Le ticket, l'ordonnance et le rapport imprimés affichent bien l'en-tête (nom + téléphone) et
      le pied de page (cachet, signature, nom du chef)
- [x] Tarif du ticket modifiable, répercuté sur les nouveaux tickets
- [x] Un poste qui n'a rien renseigné dans Réglages imprime sans pied de page vide (pas de cadre
      cassé)

## 11. Notifications

- [x] La cloche affiche un badge quand il y a au moins une alerte
- [x] Stock bas, comptes en attente, inventaires non clôturés (>2 jours) apparaissent pour les bons
      rôles seulement
- [x] Cliquer une alerte navigue vers la bonne page

## 12. PWA / Mobile

- [ ] Sur mobile (Chrome Android ou Safari iOS), le site propose "Ajouter à l'écran d'accueil"
- [ ] L'app installée s'ouvre en plein écran (pas de barre d'adresse), avec l'icône UCDS
- [ ] Menu latéral → tiroir mobile fonctionne, toutes les pages restent utilisables en dessous de
      768px de large
- [ ] Couper la connexion puis recharger : l'app affiche au moins la coquille (pas un écran blanc
      total) — les données elles-mêmes nécessitent une connexion, c'est normal

## 13. Performance

- [ ] Premier chargement (page de connexion) sur un réseau 3G/4G simulé reste raisonnable
      (l'outil "Network throttling" des DevTools du navigateur permet de simuler)
- [ ] La navigation entre modules ne recharge pas toute l'application (juste le module ciblé)

## 14. Sécurité — à vérifier une seule fois, en profondeur

- [x] Le fichier `.env` n'est jamais présent dans le dépôt Git (`git log --all --full-history -- .env`
      doit ne rien retourner)
- [x] Aucune clé `service_role` n'apparaît dans le code source de `src/` (seule l'Edge Function,
      côté serveur, y a accès)
- [x] Un compte "Consultation uniquement" ne peut rien créer/modifier/supprimer nulle part
      (vérifier qu'aucun bouton d'action n'est visible, et qu'un appel direct à l'API échouerait —
      la protection réelle est côté base de données, pas juste l'interface)
