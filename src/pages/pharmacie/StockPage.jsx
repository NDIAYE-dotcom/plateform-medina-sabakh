import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Input, Pagination, Table } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { formatDateTime } from "../../constants/patients";
import { getCategorieLabel } from "../../constants/stock";
import { PHARMACIE_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useArticlesStock } from "../../hooks/useArticlesStock";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import ArticleFormModal from "./ArticleFormModal";
import MouvementModal from "./MouvementModal";
import "./PharmaciePage.css";

export default function StockPage() {
  const { slug } = useParams();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PHARMACIE_MODULE_ROLES);
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [search, setSearch] = useState("");
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const { articles, page, setPage, totalPages, loading, refetch } = useArticlesStock(
    canView ? poste?.id : null,
    { search }
  );

  const stockBasCount = articles.filter((a) => a.stock_actuel <= a.seuil_alerte).length;

  if (!posteLoading && !canView) {
    return (
      <main className="container pharmacie-page">
        <h1>Stock</h1>
        <p className="pharmacie-page__restricted">
          L'accès au Stock est réservé au Pharmacien, au Magasinier et à l'Administrateur du
          poste.
        </p>
      </main>
    );
  }

  return (
    <main className="container pharmacie-page">
      <div className="pharmacie-page__header">
        <div>
          <h1>Stock</h1>
          <p className="pharmacie-page__subtitle">
            Tous les articles (médicaments, consommables, matériel) du poste {poste?.nom ?? ""}.
          </p>
        </div>
        <div className="pharmacie-page__header-actions">
          <Button as={Link} to={`/poste/${slug}/mouvements`} variant="outline">
            Voir l'historique
          </Button>
          <Button as={Link} to={`/poste/${slug}/inventaires`} variant="outline">
            Inventaires
          </Button>
          <Button variant="primary" onClick={() => setArticleModalOpen(true)}>
            Nouvel article
          </Button>
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
        {stockBasCount > 0 && (
          <Badge tone="danger">
            {stockBasCount} article{stockBasCount > 1 ? "s" : ""} sous le seuil d'alerte
          </Badge>
        )}
      </div>

      <Table
        columns={[
          {
            key: "nom",
            header: "Article",
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
          {
            key: "categorie",
            header: "Catégorie",
            render: (row) => getCategorieLabel(row.categorie),
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
                <Button size="sm" variant="outline" onClick={() => setReceiving(row)}>
                  Réceptionner
                </Button>
              </div>
            ),
          },
        ]}
        rows={articles}
        emptyMessage={
          posteLoading || loading ? "Chargement..." : "Aucun article enregistré pour le moment."
        }
      />

      <div className="pharmacie-page__pagination">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ArticleFormModal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        posteId={poste?.id}
        onCreated={refetch}
      />

      <ArticleFormModal
        open={Boolean(editingArticle)}
        onClose={() => setEditingArticle(null)}
        posteId={poste?.id}
        article={editingArticle}
        onCreated={refetch}
      />

      <MouvementModal
        open={Boolean(receiving)}
        onClose={() => setReceiving(null)}
        article={receiving}
        type="entree"
        posteId={poste?.id}
        onSaved={refetch}
      />
    </main>
  );
}
