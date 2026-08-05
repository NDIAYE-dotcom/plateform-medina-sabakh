import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Input, Pagination, Table } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { formatDate } from "../../constants/patients";
import { getStatutGrossesseLabel, getStatutGrossesseTone } from "../../constants/grossesse";
import { GROSSESSE_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useGrossesses } from "../../hooks/useGrossesses";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import NewGrossesseModal from "./NewGrossesseModal";
import "./GrossessePage.css";

export default function GrossessePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...GROSSESSE_MODULE_ROLES);
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { grossesses, page, setPage, totalPages, loading } = useGrossesses(
    canView ? poste?.id : null,
    search
  );

  if (!posteLoading && !canView) {
    return (
      <main className="container grossesse-page">
        <h1>Grossesse</h1>
        <p className="grossesse-page__restricted">
          L'accès au module Grossesse est réservé au Médecin, à l'Infirmier Chef, à la Sage-femme
          et à l'Administrateur du poste.
        </p>
      </main>
    );
  }

  const handleSelectPatient = (patient) => {
    setModalOpen(false);
    navigate(`/poste/${slug}/patients/${patient.id}?tab=grossesse`);
  };

  return (
    <main className="container grossesse-page">
      <div className="grossesse-page__header">
        <div>
          <h1>Grossesse</h1>
          <p className="grossesse-page__subtitle">
            Suivi des femmes enceintes du poste {poste?.nom ?? ""}.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          Nouvelle grossesse
        </Button>
      </div>

      <Input
        icon={<SearchIcon />}
        placeholder="Rechercher par nom ou prénom de la patiente..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="grossesse-page__search"
      />

      <Table
        columns={[
          {
            key: "patient",
            header: "Patiente",
            render: (row) =>
              row.patients ? (
                <Link to={`/poste/${slug}/patients/${row.patients.id}?tab=grossesse`}>
                  {row.patients.prenom} {row.patients.nom}
                </Link>
              ) : (
                "—"
              ),
          },
          {
            key: "date_dernieres_regles",
            header: "Dernières règles",
            render: (row) => formatDate(row.date_dernieres_regles),
          },
          {
            key: "date_prevue_accouchement",
            header: "DPA",
            render: (row) => formatDate(row.date_prevue_accouchement),
          },
          {
            key: "statut",
            header: "Statut",
            render: (row) => (
              <Badge tone={getStatutGrossesseTone(row.statut)}>
                {getStatutGrossesseLabel(row.statut)}
              </Badge>
            ),
          },
        ]}
        rows={grossesses}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucune grossesse enregistrée pour le moment."
        }
      />

      <div className="grossesse-page__pagination">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <NewGrossesseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        posteId={poste?.id}
        onSelectPatient={handleSelectPatient}
      />
    </main>
  );
}
