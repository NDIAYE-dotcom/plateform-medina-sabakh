import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Input, Pagination, Table, Tabs } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { formatDateTime } from "../../constants/patients";
import { formatFcfa } from "../../constants/comptabilite";
import { PHARMACIE_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useMouvementsStock } from "../../hooks/useMouvementsStock";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import "./PharmaciePage.css";

const TYPE_TABS = [
  { id: "", label: "Tous" },
  { id: "sortie", label: "Sorties" },
  { id: "entree", label: "Entrées" },
];

export default function HistoriqueMouvementsPage() {
  const { slug } = useParams();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PHARMACIE_MODULE_ROLES);
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const { mouvements, page, setPage, totalPages, loading } = useMouvementsStock(
    canView ? poste?.id : null,
    { type: type || undefined, search }
  );

  if (!posteLoading && !canView) {
    return (
      <main className="container pharmacie-page">
        <h1>Historique des mouvements</h1>
        <p className="pharmacie-page__restricted">
          L'accès à l'historique des mouvements est réservé au Pharmacien, au Magasinier et à
          l'Administrateur du poste.
        </p>
      </main>
    );
  }

  return (
    <main className="container pharmacie-page">
      <div className="pharmacie-page__header">
        <div>
          <h1>Historique des mouvements</h1>
          <p className="pharmacie-page__subtitle">
            Traçabilité des entrées et sorties de stock du poste {poste?.nom ?? ""} — qui, quoi, quand.
          </p>
        </div>
      </div>

      <div className="pharmacie-page__toolbar">
        <Input
          icon={<SearchIcon />}
          placeholder="Rechercher un article..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pharmacie-page__search"
        />
      </div>

      <Tabs tabs={TYPE_TABS} activeId={type} onChange={setType} />

      <Table
        columns={[
          {
            key: "created_at",
            header: "Date et heure",
            render: (row) => formatDateTime(row.created_at),
          },
          {
            key: "type",
            header: "Type",
            render: (row) => (
              <Badge tone={row.type === "entree" ? "success" : "primary"}>
                {row.type === "entree" ? "Entrée" : "Sortie"}
              </Badge>
            ),
          },
          {
            key: "article",
            header: "Article",
            render: (row) => row.articles_stock?.nom || "—",
          },
          {
            key: "quantite",
            header: "Quantité",
            render: (row) => `${row.quantite} ${row.articles_stock?.unite || ""}`,
          },
          {
            key: "montant",
            header: "Montant",
            render: (row) => (row.montant != null ? formatFcfa(row.montant) : "—"),
          },
          {
            key: "motif",
            header: "Motif",
            render: (row) => row.motif || "—",
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
          {
            key: "created_by",
            header: "Fait par",
            render: (row) => row.effectue_par || "—",
          },
        ]}
        rows={mouvements}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucun mouvement enregistré pour le moment."
        }
      />

      <div className="pharmacie-page__pagination">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </main>
  );
}
