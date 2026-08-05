import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Input, Pagination, Table } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { formatDateTime } from "../../constants/patients";
import { CONSULTATIONS_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useConsultations } from "../../hooks/useConsultations";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import NewConsultationModal from "./NewConsultationModal";
import "./ConsultationsPage.css";

export default function ConsultationsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" ||
    hasRole("admin_poste", "lecture_seule", ...CONSULTATIONS_MODULE_ROLES);
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { consultations, page, setPage, totalPages, loading } = useConsultations(
    canView ? poste?.id : null,
    search
  );

  if (!posteLoading && !canView) {
    return (
      <main className="container consultations-page">
        <h1>Consultations</h1>
        <p className="consultations-page__restricted">
          L'accès au module Consultations est réservé au Médecin, à l'Infirmier Chef, à la
          Sage-femme et à l'Administrateur du poste.
        </p>
      </main>
    );
  }

  const handleSelectPatient = (patient) => {
    setModalOpen(false);
    navigate(`/poste/${slug}/patients/${patient.id}?tab=consultations`);
  };

  return (
    <main className="container consultations-page">
      <div className="consultations-page__header">
        <div>
          <h1>Consultations</h1>
          <p className="consultations-page__subtitle">
            Journal des consultations médicales du poste {poste?.nom ?? ""}.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          Nouvelle consultation
        </Button>
      </div>

      <Input
        icon={<SearchIcon />}
        placeholder="Rechercher par nom ou prénom du patient..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="consultations-page__search"
      />

      <Table
        columns={[
          {
            key: "date_consultation",
            header: "Date",
            render: (row) => formatDateTime(row.date_consultation),
          },
          {
            key: "patient",
            header: "Patient",
            render: (row) =>
              row.patients ? (
                <Link to={`/poste/${slug}/patients/${row.patients.id}`}>
                  {row.patients.prenom} {row.patients.nom}
                </Link>
              ) : (
                "—"
              ),
          },
          { key: "motif", header: "Motif", render: (row) => row.motif || "—" },
          { key: "diagnostic", header: "Diagnostic", render: (row) => row.diagnostic || "—" },
        ]}
        rows={consultations}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucune consultation enregistrée pour le moment."
        }
      />

      <div className="consultations-page__pagination">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <NewConsultationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        posteId={poste?.id}
        onSelectPatient={handleSelectPatient}
      />
    </main>
  );
}
