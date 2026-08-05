import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import { supabase } from "../../lib/supabaseClient";
import "./ReglagesPage.css";

export default function ReglagesPage() {
  const { slug } = useParams();
  const { role, hasRole } = useAuth();
  const toast = useToast();
  const { poste, loading: posteLoading, refetch } = usePosteBySlug(slug);
  const canView = role === "super_admin_ucds" || hasRole("admin_poste");

  const [telephone, setTelephone] = useState("");
  const [nomChef, setNomChef] = useState("");
  const [prixTicket, setPrixTicket] = useState("0");
  const [saving, setSaving] = useState(false);
  const [savingPrix, setSavingPrix] = useState(false);
  const [uploadingCachet, setUploadingCachet] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  useEffect(() => {
    setTelephone(poste?.telephone ?? "");
    setNomChef(poste?.nom_chef ?? "");
    setPrixTicket(String(poste?.prix_ticket ?? 0));
  }, [poste?.telephone, poste?.nom_chef, poste?.prix_ticket]);

  if (!posteLoading && !canView) {
    return (
      <main className="container reglages-page">
        <h1>Réglages</h1>
        <p className="reglages-page__restricted">
          L'accès aux réglages est réservé à l'Administrateur Poste de Santé et au Super Admin.
        </p>
      </main>
    );
  }

  const handleSaveInfos = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("postes_sante")
      .update({ telephone: telephone || null, nom_chef: nomChef || null })
      .eq("id", poste.id);
    setSaving(false);

    if (error) {
      toast.error("Échec de l'enregistrement.");
      return;
    }
    toast.success("Informations enregistrées.");
    refetch();
  };

  const handleSavePrix = async () => {
    const prix = Number(prixTicket);
    if (!Number.isInteger(prix) || prix < 0) {
      toast.error("Le tarif doit être un nombre entier positif.");
      return;
    }

    setSavingPrix(true);
    const { error } = await supabase.from("postes_sante").update({ prix_ticket: prix }).eq("id", poste.id);
    setSavingPrix(false);

    if (error) {
      toast.error("Impossible de mettre à jour le tarif.");
      return;
    }
    toast.success("Tarif du ticket mis à jour.");
    refetch();
  };

  const uploadBranding = async (file, kind, setUploading, column) => {
    const ext = file.name.split(".").pop();
    const path = `${poste.id}/${kind}.${ext}`;
    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("poste-branding")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast.error("Échec de l'envoi du fichier.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("poste-branding").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("postes_sante")
      .update({ [column]: publicUrl })
      .eq("id", poste.id);

    setUploading(false);

    if (updateError) {
      toast.error("Fichier envoyé mais impossible d'enregistrer la référence.");
      return;
    }

    toast.success("Image enregistrée.");
    refetch();
  };

  const handleCachetChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadBranding(file, "cachet", setUploadingCachet, "cachet_url");
  };

  const handleSignatureChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadBranding(file, "signature", setUploadingSignature, "signature_url");
  };

  return (
    <main className="container reglages-page">
      <div className="reglages-page__header">
        <h1>Réglages</h1>
        <p className="reglages-page__subtitle">
          Informations affichées en en-tête et en pied de page des documents imprimés (tickets,
          ordonnances, rapports) du poste {poste?.nom ?? ""}.
        </p>
      </div>

      <Card className="reglages-page__section">
        <Card.Title>Informations du poste</Card.Title>
        <Card.Description>
          Le nom du poste s'affiche automatiquement en en-tête ; le numéro de téléphone s'y ajoute
          s'il est renseigné.
        </Card.Description>
        <div className="reglages-page__form">
          <Input
            label="Numéro de téléphone"
            type="tel"
            placeholder="Ex. 33 XXX XX XX"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
          />
          <Input
            label="Nom du chef de poste"
            placeholder="Ex. Dr. Amadou Diallo"
            value={nomChef}
            onChange={(event) => setNomChef(event.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleSaveInfos} loading={saving}>
          Enregistrer
        </Button>
      </Card>

      <Card className="reglages-page__section">
        <Card.Title>Tarification</Card.Title>
        <Card.Description>
          Montant encaissé par défaut à chaque nouveau ticket — modifiable au cas par cas depuis
          la file d'attente si besoin.
        </Card.Description>
        <div className="reglages-page__form">
          <Input
            label="Tarif du ticket (FCFA)"
            type="number"
            min="0"
            step="1"
            value={prixTicket}
            onChange={(event) => setPrixTicket(event.target.value)}
          />
        </div>
        <Button variant="primary" onClick={handleSavePrix} loading={savingPrix}>
          Enregistrer
        </Button>
      </Card>

      <Card className="reglages-page__section">
        <Card.Title>Cachet et signature</Card.Title>
        <Card.Description>
          Affichés en pied de page des documents imprimés, à côté du nom du chef de poste.
        </Card.Description>
        <div className="reglages-page__branding">
          <div className="reglages-page__branding-item">
            <p className="reglages-page__branding-label">Cachet du poste</p>
            {poste?.cachet_url ? (
              <img src={poste.cachet_url} alt="Cachet actuel" className="reglages-page__preview" />
            ) : (
              <p className="reglages-page__empty">Aucun cachet enregistré.</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCachetChange}
              className="reglages-page__file-input"
              id="reglages-cachet-upload"
            />
            <Button as="label" htmlFor="reglages-cachet-upload" variant="outline" loading={uploadingCachet}>
              {poste?.cachet_url ? "Remplacer" : "Ajouter un cachet"}
            </Button>
          </div>

          <div className="reglages-page__branding-item">
            <p className="reglages-page__branding-label">Signature du chef de poste</p>
            {poste?.signature_url ? (
              <img
                src={poste.signature_url}
                alt="Signature actuelle"
                className="reglages-page__preview"
              />
            ) : (
              <p className="reglages-page__empty">Aucune signature enregistrée.</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureChange}
              className="reglages-page__file-input"
              id="reglages-signature-upload"
            />
            <Button
              as="label"
              htmlFor="reglages-signature-upload"
              variant="outline"
              loading={uploadingSignature}
            >
              {poste?.signature_url ? "Remplacer" : "Ajouter une signature"}
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
