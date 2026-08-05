-- Correctif — "Impossible de retirer ce membre" dans Personnel
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Réaffirme la fonction prevent_role_escalation() telle que définie à l'étape 13
-- (0015_ciblage_et_roles.sql), qui autorise déjà un Administrateur Poste à retirer un membre de
-- son équipe (poste_id -> null, role -> lecture_seule). Sans effet si la fonction était déjà à
-- jour ; corrige le cas où seule une version antérieure (0001/0014, sans la branche "retirer un
-- membre") serait restée active en base — par exemple si 0015 a été exécutée partiellement.
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
