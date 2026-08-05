import { useState } from "react";
import { useParams } from "react-router-dom";
import { Badge, Button, Modal, Select } from "../../components/ui";
import { FIELD_ROLE_OPTIONS, getRoleLabel } from "../../constants/roles";
import { formatDateTime } from "../../constants/patients";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { usePendingProfiles } from "../../hooks/usePendingProfiles";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import { usePosteTeam } from "../../hooks/usePosteTeam";
import { supabase } from "../../lib/supabaseClient";
import "./PersonnelPage.css";

function DeleteAccountModal({ account, onClose, onDeleted }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: { userId: account.id },
    });
    setDeleting(false);

    if (error || data?.error) {
      console.error("Erreur de suppression du compte :", error?.message || data?.error);
      toast.error(data?.error || "Impossible de supprimer ce compte.");
      return;
    }

    toast.success(`${account.full_name || "Ce compte"} a été supprimé définitivement.`);
    onDeleted();
    onClose();
  };

  return (
    <Modal open={Boolean(account)} onClose={onClose} title="Supprimer ce compte ?">
      <p className="personnel-page__delete-warning">
        Cette action est <strong>irréversible</strong>. Le compte{" "}
        <strong>{account?.full_name || "sans nom"}</strong> sera définitivement supprimé (connexion,
        profil, affectation) — il ne pourra plus se reconnecter et devra se réinscrire s'il souhaite
        revenir.
      </p>
      <div className="personnel-page__delete-actions">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="danger" loading={deleting} onClick={handleConfirm}>
          Supprimer définitivement
        </Button>
      </div>
    </Modal>
  );
}

function PromoteAdminModal({ account, onClose, onPromoted }) {
  const toast = useToast();
  const [promoting, setPromoting] = useState(false);

  const handleConfirm = async () => {
    setPromoting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ poste_id: account.posteId, role: "admin_poste" })
      .eq("id", account.id);
    setPromoting(false);

    if (error) {
      console.error("Erreur de promotion :", error.message);
      toast.error("Impossible de promouvoir ce compte.");
      return;
    }

    toast.success(`${account.full_name || "Ce compte"} est désormais Administrateur du poste.`);
    onPromoted();
    onClose();
  };

  return (
    <Modal open={Boolean(account)} onClose={onClose} title="Promouvoir Administrateur Poste ?">
      <p className="personnel-page__delete-warning">
        <strong>{account?.full_name || "Ce compte"}</strong> aura un accès complet au poste{" "}
        <strong>{account?.posteName}</strong> : gestion de tous les modules, de l'équipe (y compris
        affecter/retirer d'autres membres), des réglages et de la comptabilité.
      </p>
      <div className="personnel-page__delete-actions">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="secondary" loading={promoting} onClick={handleConfirm}>
          Promouvoir Administrateur Poste
        </Button>
      </div>
    </Modal>
  );
}

function PendingRow({ account, posteId, isSuperAdmin, onAssigned, onDeleteRequested, onPromoteRequested }) {
  const toast = useToast();
  const [role, setRole] = useState("lecture_seule");
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ poste_id: posteId, role })
      .eq("id", account.id);
    setSaving(false);

    if (error) {
      console.error("Erreur d'affectation :", error.message);
      toast.error("Impossible d'affecter ce compte.");
      return;
    }

    toast.success(`${account.full_name || "Ce compte"} a été intégré à l'équipe.`);
    onAssigned();
  };

  return (
    <div className="personnel-page__row">
      <div className="personnel-page__row-info">
        <p>{account.full_name || "Nom non renseigné"}</p>
        <span className="personnel-page__row-date">
          Inscrit le {formatDateTime(account.created_at)}
        </span>
      </div>
      <div className="personnel-page__row-actions">
        <Select
          options={FIELD_ROLE_OPTIONS}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
        <Button size="sm" loading={saving} onClick={handleAssign}>
          Affecter à mon équipe
        </Button>
        {isSuperAdmin && (
          <Button size="sm" variant="secondary" onClick={() => onPromoteRequested(account)}>
            Promouvoir Administrateur Poste
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={() => onDeleteRequested(account)}>
          Supprimer le compte
        </Button>
      </div>
    </div>
  );
}

function TeamRow({ member, isSelf, onChanged, onDeleteRequested }) {
  const toast = useToast();
  const [role, setRole] = useState(member.role);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleUpdateRole = async () => {
    if (role === member.role) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ role }).eq("id", member.id);
    setSaving(false);

    if (error) {
      console.error("Erreur de mise à jour du rôle :", error.message);
      toast.error("Impossible de mettre à jour le rôle.");
      setRole(member.role);
      return;
    }

    toast.success("Rôle mis à jour.");
    onChanged();
  };

  const handleRemove = async () => {
    setRemoving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ poste_id: null, role: "lecture_seule" })
      .eq("id", member.id);
    setRemoving(false);

    if (error) {
      console.error("Erreur de retrait du membre :", error.message);
      toast.error("Impossible de retirer ce membre.");
      return;
    }

    toast.success(`${member.full_name || "Ce membre"} a été retiré de l'équipe.`);
    onChanged();
  };

  if (isSelf) {
    return (
      <div className="personnel-page__row">
        <div className="personnel-page__row-info">
          <p>{member.full_name || "—"}</p>
        </div>
        <Badge tone="primary">{getRoleLabel(member.role)}</Badge>
      </div>
    );
  }

  return (
    <div className="personnel-page__row">
      <div className="personnel-page__row-info">
        <p>{member.full_name || "—"}</p>
      </div>
      <div className="personnel-page__row-actions">
        <Select
          options={FIELD_ROLE_OPTIONS}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
        <Button size="sm" variant="outline" loading={saving} onClick={handleUpdateRole}>
          Mettre à jour
        </Button>
        <Button size="sm" variant="outline" loading={removing} onClick={handleRemove}>
          Retirer du poste
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDeleteRequested(member)}>
          Supprimer le compte
        </Button>
      </div>
    </div>
  );
}

export default function PersonnelPage() {
  const { slug } = useParams();
  const { profile, role, hasRole } = useAuth();
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const isSuperAdmin = role === "super_admin_ucds";
  const canManage = hasRole("admin_poste") || isSuperAdmin;

  const {
    pending,
    loading: pendingLoading,
    refetch: refetchPending,
  } = usePendingProfiles(poste?.id, canManage);
  const {
    team,
    loading: teamLoading,
    refetch: refetchTeam,
  } = usePosteTeam(canManage ? poste?.id : null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [promoteTarget, setPromoteTarget] = useState(null);

  if (!posteLoading && !canManage) {
    return (
      <main className="container personnel-page">
        <h1>Personnel</h1>
        <p className="personnel-page__restricted">
          L'accès à la gestion du personnel est réservé à l'Administrateur Poste de Santé et au
          Super Admin.
        </p>
      </main>
    );
  }

  const refetchAll = () => {
    refetchTeam();
    refetchPending();
  };

  return (
    <main className="container personnel-page">
      <div className="personnel-page__header">
        <h1>Personnel</h1>
        <p className="personnel-page__subtitle">
          Comptes en attente et équipe du poste {poste?.nom ?? ""}.
        </p>
      </div>

      <section className="personnel-page__section">
        <h2>Comptes en attente d'affectation</h2>
        {pendingLoading ? (
          <p className="personnel-page__empty">Chargement...</p>
        ) : pending.length === 0 ? (
          <p className="personnel-page__empty">Aucun compte en attente pour le moment.</p>
        ) : (
          <div className="personnel-page__list">
            {pending.map((account) => (
              <PendingRow
                key={account.id}
                account={account}
                posteId={poste?.id}
                isSuperAdmin={isSuperAdmin}
                onAssigned={refetchPending}
                onDeleteRequested={setDeleteTarget}
                onPromoteRequested={(acc) =>
                  setPromoteTarget({ ...acc, posteId: poste?.id, posteName: poste?.nom })
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="personnel-page__section">
        <h2>Mon équipe</h2>
        {teamLoading ? (
          <p className="personnel-page__empty">Chargement...</p>
        ) : team.length === 0 ? (
          <p className="personnel-page__empty">Aucun membre assigné à ce poste.</p>
        ) : (
          <div className="personnel-page__list">
            {team.map((member) => (
              <TeamRow
                key={member.id}
                member={member}
                isSelf={member.id === profile?.id}
                onChanged={refetchAll}
                onDeleteRequested={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </section>

      {deleteTarget && (
        <DeleteAccountModal
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refetchAll}
        />
      )}

      {promoteTarget && (
        <PromoteAdminModal
          account={promoteTarget}
          onClose={() => setPromoteTarget(null)}
          onPromoted={refetchAll}
        />
      )}
    </main>
  );
}
