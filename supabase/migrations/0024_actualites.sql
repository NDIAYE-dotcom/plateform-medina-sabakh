-- Complément — Actualités de la Landing Page, gérées par le Super Admin
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Contenu public (blog, évènements, campagnes de vaccination, sensibilisation), visible par tout
-- le monde sur la Landing Page (y compris les visiteurs non connectés), mais géré exclusivement
-- par le Super Admin UCDS — pas de portée par poste, c'est un contenu institutionnel global.
create table if not exists public.actualites (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  categorie text not null check (categorie in ('blog', 'evenement', 'campagne', 'vaccination', 'sensibilisation')),
  description text,
  image_url text,
  image_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists actualites_categorie_idx on public.actualites(categorie, created_at desc);

drop trigger if exists actualites_set_updated_at on public.actualites;
create trigger actualites_set_updated_at
before update on public.actualites
for each row execute function public.set_updated_at();

alter table public.actualites enable row level security;

-- Lecture publique — y compris avant connexion, la Landing Page en a besoin.
drop policy if exists "actualites_select_public" on public.actualites;
create policy "actualites_select_public"
on public.actualites for select
to anon, authenticated
using (true);

drop policy if exists "actualites_write_super_admin" on public.actualites;
create policy "actualites_write_super_admin"
on public.actualites for insert
to authenticated
with check (public.is_super_admin());

drop policy if exists "actualites_update_super_admin" on public.actualites;
create policy "actualites_update_super_admin"
on public.actualites for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "actualites_delete_super_admin" on public.actualites;
create policy "actualites_delete_super_admin"
on public.actualites for delete
to authenticated
using (public.is_super_admin());

-- Stockage des images — bucket public (contenu institutionnel destiné à être vu par tous,
-- contrairement aux dossiers patients, restés privés dans "patient-documents").
insert into storage.buckets (id, name, public)
values ('actualites-images', 'actualites-images', true)
on conflict (id) do nothing;

drop policy if exists "actualites_images_storage_select" on storage.objects;
create policy "actualites_images_storage_select"
on storage.objects for select
to public
using (bucket_id = 'actualites-images');

drop policy if exists "actualites_images_storage_insert" on storage.objects;
create policy "actualites_images_storage_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'actualites-images' and public.is_super_admin());

drop policy if exists "actualites_images_storage_update" on storage.objects;
create policy "actualites_images_storage_update"
on storage.objects for update
to authenticated
using (bucket_id = 'actualites-images' and public.is_super_admin());

drop policy if exists "actualites_images_storage_delete" on storage.objects;
create policy "actualites_images_storage_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'actualites-images' and public.is_super_admin());
