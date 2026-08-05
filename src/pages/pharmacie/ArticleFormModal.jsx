import { useEffect, useState } from "react";
import { Button, Input, Modal, Select } from "../../components/ui";
import { CATEGORIE_OPTIONS } from "../../constants/stock";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabaseClient";
import "./pharmacie-shared.css";

const EMPTY_FORM = {
  nom: "",
  categorie: "medicament",
  unite: "",
  seuil_alerte: "0",
  prix_unitaire: "",
  quantite_initiale: "0",
};

export default function ArticleFormModal({ open, onClose, posteId, defaultCategorie, article, onCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = Boolean(article);

  useEffect(() => {
    if (!open) return;

    if (article) {
      setForm({
        nom: article.nom,
        categorie: article.categorie,
        unite: article.unite || "",
        seuil_alerte: String(article.seuil_alerte ?? 0),
        prix_unitaire: article.prix_unitaire != null ? String(article.prix_unitaire) : "",
        quantite_initiale: "0",
      });
    } else {
      setForm({ ...EMPTY_FORM, categorie: defaultCategorie ?? "medicament" });
    }
  }, [open, defaultCategorie, article]);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.nom.trim()) {
      toast.error("Le nom de l'article est obligatoire.");
      return;
    }

    setSubmitting(true);

    const payload = {
      nom: form.nom,
      categorie: form.categorie,
      unite: form.unite || null,
      seuil_alerte: form.seuil_alerte ? Number(form.seuil_alerte) : 0,
      prix_unitaire: form.prix_unitaire ? Number(form.prix_unitaire) : null,
    };

    if (isEditMode) {
      const { error } = await supabase.from("articles_stock").update(payload).eq("id", article.id);
      setSubmitting(false);

      if (error) {
        toast.error("Impossible de modifier l'article.");
        return;
      }

      toast.success("Article modifié.");
      onCreated();
      onClose();
      return;
    }

    const { data, error } = await supabase
      .from("articles_stock")
      .insert({ ...payload, poste_id: posteId, created_by: user?.id })
      .select("id")
      .single();

    if (error) {
      setSubmitting(false);
      toast.error("Impossible de créer l'article.");
      return;
    }

    const quantiteInitiale = Number(form.quantite_initiale);
    if (quantiteInitiale > 0) {
      const { error: mouvementError } = await supabase.from("mouvements_stock").insert({
        poste_id: posteId,
        article_id: data.id,
        type: "entree",
        quantite: quantiteInitiale,
        motif: "Stock initial",
        created_by: user?.id,
      });
      if (mouvementError) {
        toast.error("Article créé, mais le stock initial n'a pas pu être enregistré.");
      }
    }

    setSubmitting(false);
    toast.success("Article ajouté.");
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditMode ? "Modifier l'article" : "Nouvel article"}>
      <form className="pharmacie-modal__form" onSubmit={handleSubmit}>
        <Input label="Nom" value={form.nom} onChange={updateField("nom")} autoFocus />
        {!defaultCategorie && (
          <Select
            label="Catégorie"
            options={CATEGORIE_OPTIONS}
            value={form.categorie}
            onChange={updateField("categorie")}
          />
        )}
        <Input
          label="Unité"
          placeholder="Ex. comprimé, boîte, flacon..."
          value={form.unite}
          onChange={updateField("unite")}
        />
        <Input
          label="Prix unitaire (FCFA)"
          type="number"
          min="0"
          value={form.prix_unitaire}
          onChange={updateField("prix_unitaire")}
        />
        <Input
          label="Seuil d'alerte"
          type="number"
          min="0"
          value={form.seuil_alerte}
          onChange={updateField("seuil_alerte")}
        />
        {!isEditMode && (
          <Input
            label="Quantité initiale en stock"
            type="number"
            min="0"
            value={form.quantite_initiale}
            onChange={updateField("quantite_initiale")}
          />
        )}
        <Button type="submit" loading={submitting}>
          {isEditMode ? "Enregistrer les modifications" : "Ajouter l'article"}
        </Button>
      </form>
    </Modal>
  );
}
