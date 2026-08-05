import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Pagination, Table } from "../../components/ui";
import { formatDateTime } from "../../constants/patients";
import { getStatutInventaireLabel, getStatutInventaireTone } from "../../constants/inventaire";
import { PHARMACIE_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useInventaires } from "../../hooks/useInventaires";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import { supabase } from "../../lib/supabaseClient";
import "./PharmaciePage.css";

export default function InventairesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PHARMACIE_MODULE_ROLES);
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const { inventaires, page, setPage, totalPages, loading } = useInventaires(
    canView ? poste?.id : null
  );
  const [creating, setCreating] = useState(false);

  if (!posteLoading && !canView) {
    return (
      <main className="container pharmacie-page">
        <h1>Inventaires</h1>
        <p className="pharmacie-page__restricted">
          L'accès aux inventaires est réservé au Pharmacien, au Magasinier et à l'Administrateur
          du poste.
        </p>
      </main>
    );
  }

  const handleCreate = async () => {
    setCreating(true);
    const { data, error } = await supabase
      .from("inventaires")
      .insert({ poste_id: poste?.id, created_by: user?.id })
      .select("id")
      .single();
    setCreating(false);

    if (error) {
      toast.error("Impossible de créer l'inventaire.");
      return;
    }

    navigate(`/poste/${slug}/inventaires/${data.id}`);
  };

  return (
    <main className="container pharmacie-page">
      <div className="pharmacie-page__header">
        <div>
          <h1>Inventaires</h1>
          <p className="pharmacie-page__subtitle">
            Sessions de comptage physique du stock du poste {poste?.nom ?? ""}.
          </p>
        </div>
        <Button variant="primary" loading={creating} onClick={handleCreate}>
          Nouvel inventaire
        </Button>
      </div>

      <Table
        columns={[
          {
            key: "date_inventaire",
            header: "Date",
            render: (row) => formatDateTime(row.created_at),
          },
          {
            key: "statut",
            header: "Statut",
            render: (row) => (
              <Badge tone={getStatutInventaireTone(row.statut)}>
                {getStatutInventaireLabel(row.statut)}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (row) => (
              <Link
                to={`/poste/${slug}/inventaires/${row.id}`}
                className="pharmacie-page__inventaire-link"
              >
                Ouvrir
              </Link>
            ),
          },
        ]}
        rows={inventaires}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucun inventaire enregistré pour le moment."
        }
      />

      <div className="pharmacie-page__pagination">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </main>
  );
}
