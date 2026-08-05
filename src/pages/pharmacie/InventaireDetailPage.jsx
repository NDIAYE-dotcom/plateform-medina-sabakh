import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Input } from "../../components/ui";
import { formatDateTime } from "../../constants/patients";
import { getStatutInventaireLabel, getStatutInventaireTone } from "../../constants/inventaire";
import { PHARMACIE_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useInventaireDetail } from "../../hooks/useInventaireDetail";
import { supabase } from "../../lib/supabaseClient";
import "./PharmaciePage.css";

function InventaireRow({ row, inventaireId, posteId, enCours, onSaved }) {
  const toast = useToast();
  const { ligne, article } = row;
  const [compte, setCompte] = useState(ligne ? String(ligne.stock_compte) : "");
  const [notes, setNotes] = useState(ligne?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const ecart = ligne ? ligne.stock_compte - ligne.stock_theorique : null;

  const handleSave = async () => {
    const compteNumber = Number(compte);
    if (!Number.isInteger(compteNumber) || compteNumber < 0) {
      toast.error("La quantité comptée doit être un nombre entier positif ou nul.");
      return;
    }

    setSaving(true);
    const { error } = ligne
      ? await supabase
          .from("inventaire_lignes")
          .update({ stock_compte: compteNumber, notes: notes || null })
          .eq("id", ligne.id)
      : await supabase.from("inventaire_lignes").insert({
          inventaire_id: inventaireId,
          article_id: article.id,
          poste_id: posteId,
          stock_theorique: article.stock_actuel,
          stock_compte: compteNumber,
          notes: notes || null,
        });
    setSaving(false);

    if (error) {
      toast.error("Impossible d'enregistrer le comptage.");
      return;
    }

    toast.success(`${article.nom} enregistré.`);
    onSaved();
  };

  return (
    <li className="pharmacie-page__inventaire-row">
      <div className="pharmacie-page__inventaire-row-info">
        <p>{article.nom}</p>
        <span className="pharmacie-page__modified-by">
          Stock théorique : {ligne ? ligne.stock_theorique : article.stock_actuel} {article.unite || ""}
        </span>
      </div>

      {enCours ? (
        <div className="pharmacie-page__row-actions">
          <Input
            placeholder="Quantité comptée"
            type="number"
            min="0"
            value={compte}
            onChange={(event) => setCompte(event.target.value)}
          />
          <Input placeholder="Notes (facultatif)" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <Button size="sm" loading={saving} onClick={handleSave}>
            {ligne ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      ) : (
        ligne && (
          <div className="pharmacie-page__inventaire-result">
            <span>{ligne.stock_compte} compté(s)</span>
            {ecart !== 0 && (
              <Badge tone={ecart > 0 ? "success" : "danger"}>
                {ecart > 0 ? `+${ecart}` : ecart}
              </Badge>
            )}
          </div>
        )
      )}
    </li>
  );
}

export default function InventaireDetailPage() {
  const { slug, inventaireId } = useParams();
  const toast = useToast();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PHARMACIE_MODULE_ROLES);
  const { inventaire, rows, loading, refetch } = useInventaireDetail(canView ? inventaireId : null);
  const [closing, setClosing] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  if (!canView) {
    return (
      <main className="container pharmacie-page">
        <h1>Accès réservé</h1>
        <p className="pharmacie-page__restricted">
          L'accès aux inventaires est réservé au Pharmacien, au Magasinier et à l'Administrateur
          du poste.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container pharmacie-page">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!inventaire) {
    return (
      <main className="container pharmacie-page">
        <h1>Inventaire introuvable</h1>
        <Link to={`/poste/${slug}/inventaires`} className="pharmacie-page__back">
          ← Retour aux inventaires
        </Link>
      </main>
    );
  }

  const enCours = inventaire.statut === "en_cours";
  const compteCount = rows.filter((r) => r.ligne).length;

  const handleCloturer = async () => {
    setClosing(true);
    const { error } = await supabase.rpc("cloturer_inventaire", { p_inventaire_id: inventaire.id });
    setClosing(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Inventaire clôturé — les écarts ont été appliqués au stock.");
    setConfirmingClose(false);
    refetch();
  };

  return (
    <main className="container pharmacie-page">
      <Link to={`/poste/${slug}/inventaires`} className="pharmacie-page__back">
        ← Retour aux inventaires
      </Link>

      <div className="pharmacie-page__header">
        <div>
          <h1>Inventaire du {formatDateTime(inventaire.created_at)}</h1>
          <p className="pharmacie-page__subtitle">
            {compteCount} / {rows.length} article(s) comptés.
          </p>
        </div>
        <Badge tone={getStatutInventaireTone(inventaire.statut)}>
          {getStatutInventaireLabel(inventaire.statut)}
        </Badge>
      </div>

      <ul className="pharmacie-page__inventaire-list">
        {rows.map((row) => (
          <InventaireRow
            key={row.article.id}
            row={row}
            inventaireId={inventaire.id}
            posteId={inventaire.poste_id}
            enCours={enCours}
            onSaved={refetch}
          />
        ))}
      </ul>

      {enCours && (
        <div className="pharmacie-page__inventaire-close">
          {confirmingClose ? (
            <>
              <p className="pharmacie-page__restricted">
                {compteCount < rows.length
                  ? `${rows.length - compteCount} article(s) n'ont pas encore été comptés — ils seront ignorés. `
                  : ""}
                Chaque écart créera un mouvement de stock automatique. Confirmer la clôture ?
              </p>
              <div className="pharmacie-page__row-actions">
                <Button loading={closing} onClick={handleCloturer}>
                  Confirmer la clôture
                </Button>
                <Button variant="outline" onClick={() => setConfirmingClose(false)}>
                  Annuler
                </Button>
              </div>
            </>
          ) : (
            <Button variant="primary" onClick={() => setConfirmingClose(true)}>
              Clôturer l'inventaire
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
