import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Input, Pagination, Table } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { formatDateTime } from "../../constants/patients";
import { PHARMACIE_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useArticlesStock } from "../../hooks/useArticlesStock";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import ArticleFormModal from "./ArticleFormModal";
import MouvementModal from "./MouvementModal";
import "./PharmaciePage.css";

export default function PharmaciePage() {
  const { slug } = useParams();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PHARMACIE_MODULE_ROLES);
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [search, setSearch] = useState("");
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [dispensing, setDispensing] = useState(null);
  const { articles, page, setPage, totalPages, loading, refetch } = useArticlesStock(
    canView ? poste?.id : null,
    { categorie: "medicament", search }
  );

  if (!posteLoading && !canView) {
    return (
      <main className="container pharmacie-page">
        <h1>Pharmacie</h1>
        <p className="pharmacie-page__restricted">
          L'accès à la Pharmacie est réservé au Pharmacien, au Magasinier et à l'Administrateur du
          poste.
        </p>
      </main>
    );
  }

  return (
    <main className="container pharmacie-page">
      <div className="pharmacie-page__header">
        <div>
          <h1>Pharmacie</h1>
          <p className="pharmacie-page__subtitle">
            Catalogue des médicaments et dispensation du poste {poste?.nom ?? ""}.
          </p>
        </div>
        <div className="pharmacie-page__header-actions">
          <Button
            as={Link}
            to={`/poste/${slug}/ordonnances`}
            variant="outline"
            className="pharmacie-page__outline-btn"
          >
            Ordonnances
          </Button>
          <Button
            as={Link}
            to={`/poste/${slug}/mouvements`}
            variant="outline"
            className="pharmacie-page__outline-btn"
          >
            Voir l'historique
          </Button>
          <Button variant="primary" onClick={() => setArticleModalOpen(true)}>
            Nouveau médicament
          </Button>
        </div>
      </div>

      <Input
        icon={<SearchIcon />}
        placeholder="Rechercher un médicament..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="pharmacie-page__search"
      />

      <Table
        columns={[
          {
            key: "nom",
            header: "Médicament",
            render: (row) => (
              <div>
                <p>{row.nom}</p>
                {row.updated_by_nom && (
                  <span className="pharmacie-page__modified-by">
                    Modifié par {row.updated_by_nom} · {formatDateTime(row.updated_at)}
                  </span>
                )}
              </div>
            ),
          },
          { key: "unite", header: "Unité", render: (row) => row.unite || "—" },
          {
            key: "prix_unitaire",
            header: "Prix",
            render: (row) =>
              row.prix_unitaire != null ? `${row.prix_unitaire.toLocaleString("fr-FR")} FCFA` : "—",
          },
          {
            key: "stock_actuel",
            header: "Stock",
            render: (row) => (
              <span className="pharmacie-page__stock-cell">
                {row.stock_actuel}
                {row.stock_actuel <= row.seuil_alerte && <Badge tone="danger">Stock bas</Badge>}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (row) => (
              <div className="pharmacie-page__row-actions">
                <Button size="sm" variant="outline" onClick={() => setEditingArticle(row)}>
                  Modifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDispensing(row)}>
                  Dispenser
                </Button>
              </div>
            ),
          },
        ]}
        rows={articles}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucun médicament enregistré pour le moment."
        }
      />

      <div className="pharmacie-page__pagination">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ArticleFormModal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        posteId={poste?.id}
        defaultCategorie="medicament"
        onCreated={refetch}
      />

      <ArticleFormModal
        open={Boolean(editingArticle)}
        onClose={() => setEditingArticle(null)}
        posteId={poste?.id}
        defaultCategorie="medicament"
        article={editingArticle}
        onCreated={refetch}
      />

      <MouvementModal
        open={Boolean(dispensing)}
        onClose={() => setDispensing(null)}
        article={dispensing}
        type="sortie"
        posteId={poste?.id}
        onSaved={refetch}
      />
    </main>
  );
}
