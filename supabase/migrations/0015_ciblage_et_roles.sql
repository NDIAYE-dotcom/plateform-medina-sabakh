-- Étape 13 (complément) — Ciblage du poste à l'inscription + restriction des modules par rôle
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- ============================================================
-- PARTIE 1 — Ciblage du poste à l'inscription
--
-- Problème : n'importe quel Administrateur Poste de Santé pouvait voir ET récupérer N'IMPORTE
-- QUEL compte en attente d'affectation, même destiné à un autre poste. Corrigé en ajoutant un
-- "poste souhaité" choisi par la personne elle-même à l'inscription — un admin ne peut désormais
-- voir/récupérer que les comptes ayant demandé SON poste.
-- ============================================================

-- 1. Poste souhaité (différent de poste_id, qui reste réservé à un admin/super admin)
alter table public.profiles add column if not exists poste_souhaite_id uuid references public.postes_sante(id) on delete set null;

-- 2. La liste des postes doit être visible AVANT connexion pour peupler le formulaire d'inscription
drop policy if exists "postes_sante_select_anon" on public.postes_sante;
create policy "postes_sante_select_anon"
on public.postes_sante for select
to anon
using (true);

-- 3. Le poste souhaité est capturé à l'inscription (même mécanisme que full_name, déjà en place
--    depuis l'étape 4) — fonctionne même si la confirmation par email est activée, puisque le
--    trigger s'exécute dès la création de la ligne dans auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, poste_souhaite_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'poste_souhaite_id', '')::uuid
  );
  return new;
end;
$$;

-- 4. Un admin de poste ne voit plus que les comptes en attente ayant demandé SON poste
drop policy if exists "profiles_select_poste_admin" on public.profiles;
create policy "profiles_select_poste_admin"
on public.profiles for select
to authenticated
using (
  public.is_poste_admin()
  and (
    poste_id = public.current_poste_id()
    or (poste_id is null and poste_souhaite_id = public.current_poste_id())
  )
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
  or (
    public.is_poste_admin()
    and (
      poste_id = public.current_poste_id()
      or (poste_id is null and poste_souhaite_id = public.current_poste_id())
    )
  )
)
with check (
  id = auth.uid()
  or public.is_super_admin()
  or (public.is_poste_admin() and (poste_id = public.current_poste_id() or poste_id is null))
);

-- 5. Le trigger n'autorise plus un admin à "récupérer" un compte en attente que si cette personne
--    a explicitement demandé SON poste à l'inscription.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
declare
  allowed_roles_for_poste_admin public.user_role[] := array[
    'medecin', 'infirmier_chef', 'sage_femme', 'pharmacien',
    'caissier', 'magasinier', 'agent_sante', 'lecture_seule'
  ]::public.user_role[];
begin
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;

  -- Affecter un compte en attente ayant demandé ce poste, ou changer le rôle d'un membre déjà là
  if public.is_poste_admin()
     and old.id <> auth.uid()
     and (
       old.poste_id = public.current_poste_id()
       or (old.poste_id is null and old.poste_souhaite_id = public.current_poste_id())
     )
     and new.poste_id = public.current_poste_id()
     and new.role = any(allowed_roles_for_poste_admin)
  then
    return new;
  end if;

  -- Retirer un membre de l'équipe (repasse en attente d'affectation)
  if public.is_poste_admin()
     and old.id <> auth.uid()
     and old.poste_id = public.current_poste_id()
     and new.poste_id is null
     and new.role = 'lecture_seule'
  then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Vous n''êtes pas autorisé à modifier ce rôle.';
  end if;
  if new.poste_id is distinct from old.poste_id then
    raise exception 'Vous n''êtes pas autorisé à modifier le poste assigné.';
  end if;

  return new;
end;
$$;

-- ============================================================
-- PARTIE 2 — Restriction des modules par rôle
--
-- Jusqu'ici, tout le personnel non "lecture_seule" pouvait lire/écrire dans tous les modules
-- (seules Comptabilité et Personnel étaient restreintes). Désormais : le dossier patient
-- (documents, vaccins, visites, suivi, consultations, ordonnances, grossesse, CPN) est réservé au
-- personnel clinique ; la Pharmacie et le Stock sont réservés au Pharmacien/Magasinier.
-- Patients (informations de base) et Tickets restent ouverts à tout le personnel du poste, car
-- utilisés par plusieurs modules (recherche de patient pour un ticket ou une dispensation).
-- ============================================================

create or replace function public.is_clinical_role()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('medecin', 'infirmier_chef', 'sage_femme', 'agent_sante')
  );
$$;

create or replace function public.is_pharmacie_role()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('pharmacien', 'magasinier')
  );
$$;

-- Dossier patient (données cliniques)
do $$
declare
  t text;
begin
  foreach t in array array[
    'patient_documents', 'patient_vaccinations', 'patient_visites', 'patient_notes_suivi',
    'consultations', 'consultation_prescriptions', 'grossesses', 'consultations_prenatales'
  ]
  loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_select"
      on public.%1$s for select
      to authenticated
      using (
        (poste_id = public.current_poste_id()
          and (public.is_clinical_role() or public.current_role() in ('lecture_seule', 'admin_poste')))
        or public.is_super_admin()
      )
    $p$, t);

    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_insert"
      on public.%1$s for insert
      to authenticated
      with check (
        (poste_id = public.current_poste_id()
          and (public.is_clinical_role() or public.current_role() = 'admin_poste'))
        or public.is_super_admin()
      )
    $p$, t);

    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_update"
      on public.%1$s for update
      to authenticated
      using (
        (poste_id = public.current_poste_id()
          and (public.is_clinical_role() or public.current_role() = 'admin_poste'))
        or public.is_super_admin()
      )
      with check (
        (poste_id = public.current_poste_id()
          and (public.is_clinical_role() or public.current_role() = 'admin_poste'))
        or public.is_super_admin()
      )
    $p$, t);
  end loop;
end $$;

-- Pharmacie et Stock
do $$
declare
  t text;
begin
  foreach t in array array['articles_stock', 'mouvements_stock']
  loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_select"
      on public.%1$s for select
      to authenticated
      using (
        (poste_id = public.current_poste_id()
          and (public.is_pharmacie_role() or public.current_role() in ('lecture_seule', 'admin_poste')))
        or public.is_super_admin()
      )
    $p$, t);

    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_insert"
      on public.%1$s for insert
      to authenticated
      with check (
        (poste_id = public.current_poste_id()
          and (public.is_pharmacie_role() or public.current_role() = 'admin_poste'))
        or public.is_super_admin()
      )
    $p$, t);

    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_update"
      on public.%1$s for update
      to authenticated
      using (
        (poste_id = public.current_poste_id()
          and (public.is_pharmacie_role() or public.current_role() = 'admin_poste'))
        or public.is_super_admin()
      )
      with check (
        (poste_id = public.current_poste_id()
          and (public.is_pharmacie_role() or public.current_role() = 'admin_poste'))
        or public.is_super_admin()
      )
    $p$, t);
  end loop;
end $$;

-- Fichiers du dossier patient (bucket Storage) : même restriction que les métadonnées
drop policy if exists "patient_documents_storage_select" on storage.objects;
create policy "patient_documents_storage_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'patient-documents'
  and (
    public.is_super_admin()
    or (
      (storage.foldername(name))[1] = public.current_poste_id()::text
      and (public.is_clinical_role() or public.current_role() in ('lecture_seule', 'admin_poste'))
    )
  )
);

drop policy if exists "patient_documents_storage_insert" on storage.objects;
create policy "patient_documents_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'patient-documents'
  and (
    public.is_super_admin()
    or (
      (storage.foldername(name))[1] = public.current_poste_id()::text
      and (public.is_clinical_role() or public.current_role() = 'admin_poste')
    )
  )
);

drop policy if exists "patient_documents_storage_delete" on storage.objects;
create policy "patient_documents_storage_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'patient-documents'
  and (
    public.is_super_admin()
    or (
      (storage.foldername(name))[1] = public.current_poste_id()::text
      and (public.is_clinical_role() or public.current_role() = 'admin_poste')
    )
  )
);
