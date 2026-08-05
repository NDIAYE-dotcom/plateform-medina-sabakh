import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Input, Pagination, Table } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { getAge } from "../../constants/patients";
import { PATIENTS_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { usePatients } from "../../hooks/usePatients";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import "./PatientsListPage.css";

export default function PatientsListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { role, hasRole } = useAuth();
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [search, setSearch] = useState("");
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PATIENTS_MODULE_ROLES);
  const { patients, page, setPage, totalPages, loading } = usePatients(canView ? poste?.id : null, search);

  if (!posteLoading && !canView) {
    return (
      <main className="container patients-list">
        <h1>Patients</h1>
        <p className="patients-list__restricted">
          L'accès au module Patients est réservé au personnel clinique (Médecin, Infirmier Chef,
          Sage-femme, Agent de santé) et à l'Administrateur du poste.
        </p>
      </main>
    );
  }

  return (
    <main className="container patients-list">
      <div className="patients-list__header">
        <div>
          <h1>Patients</h1>
          <p className="patients-list__subtitle">Fiches patients du poste {poste?.nom ?? ""}.</p>
        </div>
        <Button as={Link} to={`/poste/${slug}/patients/nouveau`}>
          Nouveau patient
        </Button>
      </div>

      <Input
        icon={<SearchIcon />}
        placeholder="Rechercher par nom, prénom ou numéro de dossier..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="patients-list__search"
      />

      <Table
        columns={[
          { key: "numero_dossier", header: "N° dossier" },
          { key: "nom", header: "Nom" },
          { key: "prenom", header: "Prénom" },
          {
            key: "age",
            header: "Âge",
            render: (row) => {
              const age = getAge(row.date_naissance);
              return age != null ? `${age} ans` : "—";
            },
          },
          {
            key: "sexe",
            header: "Sexe",
            render: (row) => (row.sexe === "M" ? "Masculin" : row.sexe === "F" ? "Féminin" : "—"),
          },
          { key: "telephone", header: "Téléphone", render: (row) => row.telephone || "—" },
        ]}
        rows={patients}
        onRowClick={(row) => navigate(`/poste/${slug}/patients/${row.id}`)}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucun patient enregistré pour le moment."
        }
      />

      <div className="patients-list__pagination">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </main>
  );
}
