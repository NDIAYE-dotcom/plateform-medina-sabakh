-- Étape 8 (complément) — Tarification des tickets
-- Au Sénégal, le ticket est payant : il est acheté avant la consultation, et cette vente doit être
-- comptabilisée dans l'espace du poste. À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Tarif du ticket, configurable par poste (en FCFA)
alter table public.postes_sante add column if not exists prix_ticket integer not null default 0;

-- 2. Montant réellement encaissé pour ce ticket (peut différer du tarif standard si besoin)
alter table public.tickets add column if not exists montant integer;

-- Si le montant n'est pas fourni à la création, on applique automatiquement le tarif du poste
create or replace function public.set_ticket_montant()
returns trigger
language plpgsql
as $$
begin
  if new.montant is null then
    select prix_ticket into new.montant
    from public.postes_sante
    where id = new.poste_id;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_set_montant on public.tickets;
create trigger tickets_set_montant
before insert on public.tickets
for each row execute function public.set_ticket_montant();

alter table public.tickets alter column montant set default 0;
update public.tickets set montant = 0 where montant is null;
alter table public.tickets alter column montant set not null;

-- 3. Un Administrateur Poste de Santé peut mettre à jour SON poste (pour régler son tarif de
-- ticket), mais uniquement le tarif — pas le nom ni le slug, réservés au Super Admin
drop policy if exists "postes_sante_update_poste_admin" on public.postes_sante;
create policy "postes_sante_update_poste_admin"
on public.postes_sante for update
to authenticated
using (public.is_poste_admin() and id = public.current_poste_id())
with check (public.is_poste_admin() and id = public.current_poste_id());

create or replace function public.prevent_poste_field_tampering()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_super_admin() then
    if new.nom is distinct from old.nom then
      raise exception 'Vous n''êtes pas autorisé à modifier le nom du poste.';
    end if;
    if new.slug is distinct from old.slug then
      raise exception 'Vous n''êtes pas autorisé à modifier le slug du poste.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists postes_sante_prevent_tampering on public.postes_sante;
create trigger postes_sante_prevent_tampering
before update on public.postes_sante
for each row execute function public.prevent_poste_field_tampering();
