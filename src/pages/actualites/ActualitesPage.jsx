import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "../../components/ui";
import { ACTUALITE_CATEGORIE_OPTIONS, getActualiteCategorieLabel } from "../../constants/actualites";
import { formatDateTime } from "../../constants/patients";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useActualites } from "../../hooks/useActualites";
import { supabase } from "../../lib/supabaseClient";
import "./ActualitesPage.css";

function ActualiteFormModal({ open, actualite, onClose, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();
  const isEditing = Boolean(actualite);

  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("blog");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitre(actualite?.titre ?? "");
    setCategorie(actualite?.categorie ?? "blog");
    setDescription(actualite?.description ?? "");
    setImageFile(null);
  }, [actualite, open]);

  const handleImageChange = (event) => {
    setImageFile(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!titre.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }

    setSaving(true);

    let imageUrl = actualite?.image_url ?? null;
    let imagePath = actualite?.image_path ?? null;

    if (imageFile) {
      const safeName = imageFile.name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9.]/g, "-");
      const path = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("actualites-images")
        .upload(path, imageFile);

      if (uploadError) {
        setSaving(false);
        toast.error("Échec de l'envoi de l'image.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("actualites-images").getPublicUrl(path);
      imageUrl = publicUrl;
      imagePath = path;
    }

    const payload = {
      titre: titre.trim(),
      categorie,
      description: description.trim() || null,
      image_url: imageUrl,
      image_path: imagePath,
    };

    const { error } = isEditing
      ? await supabase.from("actualites").update(payload).eq("id", actualite.id)
      : await supabase.from("actualites").insert({ ...payload, created_by: user?.id });

    setSaving(false);

    if (error) {
      console.error("Erreur d'enregistrement de l'actualité :", error.message);
      toast.error("Impossible d'enregistrer cette actualité.");
      return;
    }

    toast.success(isEditing ? "Actualité mise à jour." : "Actualité publiée.");
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Modifier l'actualité" : "Nouvelle actualité"} size="lg">
      <form className="actualites-page__form" onSubmit={handleSubmit}>
        <Input
          label="Titre"
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          className="actualites-page__title-input"
          required
        />

        <Select
          label="Catégorie"
          options={ACTUALITE_CATEGORIE_OPTIONS}
          value={categorie}
          onChange={(event) => setCategorie(event.target.value)}
        />

        <Textarea
          label="Description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Décrivez l'évènement, la campagne, l'article..."
        />

        <div className="actualites-page__image-field">
          <p className="actualites-page__field-label">Image</p>
          {actualite?.image_url && !imageFile && (
            <img src={actualite.image_url} alt="" className="actualites-page__image-preview" />
          )}
          {imageFile && (
            <img
              src={URL.createObjectURL(imageFile)}
              alt=""
              className="actualites-page__image-preview"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            id="actualite-image-upload"
            className="actualites-page__file-input"
          />
          <Button as="label" htmlFor="actualite-image-upload" variant="outline" size="sm">
            {actualite?.image_url ? "Remplacer l'image" : "Ajouter une image"}
          </Button>
        </div>

        <div className="actualites-page__form-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {isEditing ? "Enregistrer" : "Publier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteActualiteModal({ actualite, onClose, onDeleted }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);

    if (actualite.image_path) {
      await supabase.storage.from("actualites-images").remove([actualite.image_path]);
    }
    const { error } = await supabase.from("actualites").delete().eq("id", actualite.id);
    setDeleting(false);

    if (error) {
      console.error("Erreur de suppression de l'actualité :", error.message);
      toast.error("Impossible de supprimer cette actualité.");
      return;
    }

    toast.success("Actualité supprimée.");
    onDeleted();
    onClose();
  };

  return (
    <Modal open={Boolean(actualite)} onClose={onClose} title="Supprimer cette actualité ?">
      <p className="actualites-page__delete-warning">
        <strong>{actualite?.titre}</strong> sera retirée de la Landing Page immédiatement. Cette
        action est irréversible.
      </p>
      <div className="actualites-page__delete-actions">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="danger" loading={deleting} onClick={handleConfirm}>
          Supprimer
        </Button>
      </div>
    </Modal>
  );
}

export default function ActualitesPage() {
  const { actualites, loading, refetch } = useActualites();
  const [formOpen, setFormOpen] = useState(false);
  const [editingActualite, setEditingActualite] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => {
    setEditingActualite(null);
    setFormOpen(true);
  };

  const openEdit = (actualite) => {
    setEditingActualite(actualite);
    setFormOpen(true);
  };

  return (
    <main className="container actualites-page">
      <div className="actualites-page__header">
        <div>
          <h1>Actualités</h1>
          <p className="actualites-page__subtitle">
            Blog, évènements, campagnes de vaccination et sensibilisation — visibles immédiatement
            sur la Landing Page publique.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          Nouvelle actualité
        </Button>
      </div>

      {loading ? (
        <p className="actualites-page__empty">Chargement...</p>
      ) : actualites.length === 0 ? (
        <p className="actualites-page__empty">Aucune actualité publiée pour le moment.</p>
      ) : (
        <div className="actualites-page__list">
          {actualites.map((actualite) => (
            <div key={actualite.id} className="actualites-page__card">
              {actualite.image_url && (
                <img src={actualite.image_url} alt="" className="actualites-page__card-image" />
              )}
              <div className="actualites-page__card-body">
                <div className="actualites-page__card-header">
                  <span className="actualites-page__badge">
                    {getActualiteCategorieLabel(actualite.categorie)}
                  </span>
                  <span className="actualites-page__card-date">
                    {formatDateTime(actualite.created_at)}
                  </span>
                </div>
                <p className="actualites-page__card-title">{actualite.titre}</p>
                {actualite.description && (
                  <p className="actualites-page__card-description">{actualite.description}</p>
                )}
                <div className="actualites-page__card-actions">
                  <Button size="sm" variant="outline" onClick={() => openEdit(actualite)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(actualite)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ActualiteFormModal
        open={formOpen}
        actualite={editingActualite}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
      />

      {deleteTarget && (
        <DeleteActualiteModal
          actualite={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refetch}
        />
      )}
    </main>
  );
}
