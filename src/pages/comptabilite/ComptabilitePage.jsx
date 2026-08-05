import { useState } from "react";
import { useParams } from "react-router-dom";
import { Badge, Button, Input, Table } from "../../components/ui";
import { formatDate } from "../../constants/patients";
import { formatFcfa, getCategorieDepenseLabel } from "../../constants/comptabilite";
import { useAuth } from "../../context/AuthContext";
import { useBilan } from "../../hooks/useBilan";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import BilanPrintModal from "./BilanPrintModal";
import DepenseFormModal from "./DepenseFormModal";
import "./ComptabilitePage.css";

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ComptabilitePage() {
  const { slug } = useParams();
  const { role, hasRole } = useAuth();
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [dateDebut, setDateDebut] = useState(firstDayOfMonth());
  const [dateFin, setDateFin] = useState(today());
  const [depenseModalOpen, setDepenseModalOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const canView = hasRole("admin_poste", "caissier") || role === "super_admin_ucds";

  const {
    recettesTickets,
    recettesPharmacie,
    totalRecettes,
    depenses,
    totalDepenses,
    solde,
    loading,
    refetch,
  } = useBilan(canView ? poste?.id : null, dateDebut, dateFin);

  if (!posteLoading && !canView) {
    return (
      <main className="container comptabilite-page">
        <h1>Comptabilité</h1>
        <p className="comptabilite-page__restricted">
          L'accès à la comptabilité est réservé à l'Administrateur Poste de Santé, au Caissier et au
          Super Admin.
        </p>
      </main>
    );
  }

  return (
    <main className="container comptabilite-page">
      <div className="comptabilite-page__header">
        <div>
          <h1>Comptabilité</h1>
          <p className="comptabilite-page__subtitle">
            Recettes, dépenses et bilan du poste {poste?.nom ?? ""}.
          </p>
        </div>
        <div className="comptabilite-page__header-actions">
          <Button variant="outline" onClick={() => setPrintOpen(true)}>
            Imprimer le bilan
          </Button>
          <Button variant="primary" onClick={() => setDepenseModalOpen(true)}>
            Nouvelle dépense
          </Button>
        </div>
      </div>

      <div className="comptabilite-page__period">
        <Input
          label="Du"
          type="date"
          value={dateDebut}
          onChange={(event) => setDateDebut(event.target.value)}
        />
        <Input
          label="Au"
          type="date"
          value={dateFin}
          onChange={(event) => setDateFin(event.target.value)}
        />
      </div>

      <div className="comptabilite-page__stats">
        <div className="comptabilite-page__stat-card">
          <span className="comptabilite-page__stat-label">Recettes tickets</span>
          <span className="comptabilite-page__stat-value">{formatFcfa(recettesTickets)}</span>
        </div>
        <div className="comptabilite-page__stat-card">
          <span className="comptabilite-page__stat-label">Recettes pharmacie</span>
          <span className="comptabilite-page__stat-value">{formatFcfa(recettesPharmacie)}</span>
        </div>
        <div className="comptabilite-page__stat-card">
          <span className="comptabilite-page__stat-label">Dépenses</span>
          <span className="comptabilite-page__stat-value">{formatFcfa(totalDepenses)}</span>
        </div>
        <div className="comptabilite-page__stat-card comptabilite-page__stat-card--solde">
          <span className="comptabilite-page__stat-label">Solde</span>
          <span className="comptabilite-page__stat-value">
            {formatFcfa(solde)}
            {solde < 0 && <Badge tone="danger">Déficit</Badge>}
          </span>
        </div>
      </div>

      <Table
        columns={[
          { key: "date_depense", header: "Date", render: (row) => formatDate(row.date_depense) },
          {
            key: "categorie",
            header: "Catégorie",
            render: (row) => getCategorieDepenseLabel(row.categorie),
          },
          { key: "libelle", header: "Libellé" },
          { key: "montant", header: "Montant", render: (row) => formatFcfa(row.montant) },
        ]}
        rows={depenses}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucune dépense sur cette période."
        }
      />

      <DepenseFormModal
        open={depenseModalOpen}
        onClose={() => setDepenseModalOpen(false)}
        posteId={poste?.id}
        onCreated={refetch}
      />

      <BilanPrintModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        posteName={poste?.nom}
        dateDebut={dateDebut}
        dateFin={dateFin}
        recettesTickets={recettesTickets}
        recettesPharmacie={recettesPharmacie}
        totalRecettes={totalRecettes}
        depenses={depenses}
        totalDepenses={totalDepenses}
        solde={solde}
      />
    </main>
  );
}
