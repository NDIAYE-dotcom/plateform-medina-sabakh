-- Correctif — Fusion des postes Ndiba/Ndiayène (un seul poste réel, signalé par le client) et
-- correction orthographique Falila → Falifa.
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Correction orthographique : Falila → Falifa
update public.postes_sante set nom = 'Falifa', slug = 'falifa' where nom = 'Falila';

-- 2. Fusion Ndiba / Ndiayène. On garde l'id de "Ndiba" comme survivant, on y reporte toutes les
--    données de "Ndiayène", puis on renomme le poste survivant et on supprime la ligne devenue
--    orpheline. Idempotent : si l'un des deux noms n'existe plus (déjà fusionné), ne fait rien.
do $$
declare
  v_survivor_id uuid;
  v_loser_id uuid;
begin
  select id into v_survivor_id from public.postes_sante where nom = 'Ndiba';
  select id into v_loser_id from public.postes_sante where nom = 'Ndiayène';

  if v_survivor_id is null or v_loser_id is null then
    raise notice 'Fusion Ndiba/Ndiayène ignorée : un des deux postes est introuvable (déjà fusionné ?).';
  else
    -- 2a. Renuméroter les dossiers patients de "Ndiayène" pour éviter toute collision avec ceux
    --     de "Ndiba" (numero_dossier est séquentiel par poste, ex. 0001, 0002...).
    with base as (
      select coalesce(max(numero_dossier::int), 0) as max_num
      from public.patients
      where poste_id = v_survivor_id and numero_dossier ~ '^[0-9]+$'
    ),
    a_renumeroter as (
      select id, row_number() over (order by created_at) as rn
      from public.patients
      where poste_id = v_loser_id
    )
    update public.patients p
    set numero_dossier = lpad((base.max_num + a_renumeroter.rn)::text, 4, '0')
    from a_renumeroter, base
    where p.id = a_renumeroter.id;

    -- 2b. Idem pour les tickets, dont le numéro se remet à zéro chaque jour, par poste.
    with base as (
      select date_ticket, max(numero::int) as max_num
      from public.tickets
      where poste_id = v_survivor_id
      group by date_ticket
    ),
    a_renumeroter as (
      select t.id, t.date_ticket,
             row_number() over (partition by t.date_ticket order by t.created_at) as rn
      from public.tickets t
      where t.poste_id = v_loser_id
    )
    update public.tickets t
    set numero = lpad((coalesce(base.max_num, 0) + a_renumeroter.rn)::text, 3, '0')
    from a_renumeroter
    left join base on base.date_ticket = a_renumeroter.date_ticket
    where t.id = a_renumeroter.id;

    -- 2c. Reporter toutes les données de "Ndiayène" vers "Ndiba".
    update public.profiles set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.profiles set poste_souhaite_id = v_survivor_id where poste_souhaite_id = v_loser_id;
    update public.tickets set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.patients set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.patient_documents set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.patient_vaccinations set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.patient_visites set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.patient_notes_suivi set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.consultations set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.consultation_prescriptions set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.grossesses set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.consultations_prenatales set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.articles_stock set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.mouvements_stock set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.depenses set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.inventaires set poste_id = v_survivor_id where poste_id = v_loser_id;
    update public.inventaire_lignes set poste_id = v_survivor_id where poste_id = v_loser_id;

    -- 2d. Conserver les réglages (téléphone, cachet, signature, tarif du ticket...) déjà
    --     renseignés d'un côté ou de l'autre plutôt que de les écraser.
    update public.postes_sante survivor
    set telephone = coalesce(survivor.telephone, loser.telephone),
        nom_chef = coalesce(survivor.nom_chef, loser.nom_chef),
        cachet_url = coalesce(survivor.cachet_url, loser.cachet_url),
        signature_url = coalesce(survivor.signature_url, loser.signature_url),
        prix_ticket = case when survivor.prix_ticket = 0 then loser.prix_ticket else survivor.prix_ticket end
    from public.postes_sante loser
    where survivor.id = v_survivor_id and loser.id = v_loser_id;

    -- 2e. Renommer le poste survivant et supprimer la ligne devenue orpheline.
    update public.postes_sante set nom = 'Ndiba/Ndiayène', slug = 'ndiba-ndiayene' where id = v_survivor_id;
    delete from public.postes_sante where id = v_loser_id;
  end if;
end $$;
