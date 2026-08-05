-- Étape 15 (complément) — Réglages du poste : en-tête et pied de page des documents imprimés
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Le nom du poste et son numéro de téléphone s'affichent en en-tête des documents imprimés
-- (tickets, ordonnances, rapports) ; le cachet, la signature et le nom du chef de poste en pied
-- de page, une fois renseignés sur la page Réglages.
alter table public.postes_sante add column if not exists telephone text;
alter table public.postes_sante add column if not exists nom_chef text;
alter table public.postes_sante add column if not exists cachet_url text;
alter table public.postes_sante add column if not exists signature_url text;

-- Aucune nouvelle policy RLS nécessaire : la policy "postes_sante_update_poste_admin"
-- (0006_ticket_pricing.sql) laisse déjà un Administrateur Poste modifier n'importe quelle colonne
-- de SON poste hors nom/slug (verrouillés par le trigger prevent_poste_field_tampering), et
-- "postes_sante_write_super_admin" couvre le Super Admin — exactement l'accès voulu ici.

-- Bucket public : le cachet et la signature ne sont pas des données sensibles, elles sont
-- destinées à être affichées librement sur les documents imprimés (contrairement aux dossiers
-- patients, restés privés dans le bucket "patient-documents").
insert into storage.buckets (id, name, public)
values ('poste-branding', 'poste-branding', true)
on conflict (id) do nothing;

-- Convention de chemin : {poste_id}/cachet.<ext> et {poste_id}/signature.<ext>
drop policy if exists "poste_branding_storage_select" on storage.objects;
create policy "poste_branding_storage_select"
on storage.objects for select
to public
using (bucket_id = 'poste-branding');

drop policy if exists "poste_branding_storage_insert" on storage.objects;
create policy "poste_branding_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'poste-branding'
  and (
    (public.is_poste_admin() and (storage.foldername(name))[1] = public.current_poste_id()::text)
    or public.is_super_admin()
  )
);

drop policy if exists "poste_branding_storage_update" on storage.objects;
create policy "poste_branding_storage_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'poste-branding'
  and (
    (public.is_poste_admin() and (storage.foldername(name))[1] = public.current_poste_id()::text)
    or public.is_super_admin()
  )
);

drop policy if exists "poste_branding_storage_delete" on storage.objects;
create policy "poste_branding_storage_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'poste-branding'
  and (
    (public.is_poste_admin() and (storage.foldername(name))[1] = public.current_poste_id()::text)
    or public.is_super_admin()
  )
);
