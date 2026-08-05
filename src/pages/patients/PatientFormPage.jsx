import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Select, Textarea } from "../../components/ui";
import { GROUPE_SANGUIN_OPTIONS, SEXE_OPTIONS } from "../../constants/patients";
import { PATIENTS_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import { supabase } from "../../lib/supabaseClient";
import "./PatientFormPage.css";

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  date_naissance: "",
  sexe: "",
  telephone: "",
  adresse: "",
  groupe_sanguin: "",
  allergies: "",
  personne_contact: "",
  telephone_contact: "",
};

export default function PatientFormPage() {
  const { slug, patientId } = useParams();
  const isEditMode = Boolean(patientId);
  const navigate = useNavigate();
  const toast = useToast();
  const { user, role, hasRole } = useAuth();
  const { poste } = usePosteBySlug(slug);
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", ...PATIENTS_MODULE_ROLES);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode) return undefined;

    let active = true;
    supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError("Impossible de charger ce patient.");
        } else if (data) {
          setForm({
            nom: data.nom ?? "",
            prenom: data.prenom ?? "",
            date_naissance: data.date_naissance ?? "",
            sexe: data.sexe ?? "",
            telephone: data.telephone ?? "",
            adresse: data.adresse ?? "",
            groupe_sanguin: data.groupe_sanguin ?? "",
            allergies: data.allergies ?? "",
            personne_contact: data.personne_contact ?? "",
            telephone_contact: data.telephone_contact ?? "",
          });
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isEditMode, patientId]);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.nom.trim() || !form.prenom.trim()) {
      setError("Le nom et le prénom sont obligatoires.");
      return;
    }

    setSubmitting(true);

    const payload = {
      ...form,
      date_naissance: form.date_naissance || null,
      sexe: form.sexe || null,
      groupe_sanguin: form.groupe_sanguin || null,
    };

    let resultError;
    let targetPatientId = patientId;

    if (isEditMode) {
      const { error: updateError } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", patientId);
      resultError = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from("patients")
        .insert({ ...payload, poste_id: poste?.id, created_by: user?.id })
        .select("id")
        .single();
      resultError = insertError;
      targetPatientId = data?.id;
    }

    setSubmitting(false);

    if (resultError) {
      setError(`Impossible d'enregistrer le patient. ${resultError.message}`);
      return;
    }

    toast.success(isEditMode ? "Patient mis à jour." : "Patient créé.");
    navigate(`/poste/${slug}/patients/${targetPatientId}`);
  };

  if (!canView) {
    return (
      <main className="container patient-form">
        <h1>Accès réservé</h1>
        <p>
          L'accès au module Patients est réservé au personnel clinique et à l'Administrateur du
          poste.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container patient-form">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="container patient-form">
      <h1>{isEditMode ? "Modifier le patient" : "Nouveau patient"}</h1>

      <form className="patient-form__form" onSubmit={handleSubmit}>
        <div className="patient-form__grid">
          <Input label="Nom" required value={form.nom} onChange={updateField("nom")} />
          <Input label="Prénom" required value={form.prenom} onChange={updateField("prenom")} />
          <Input
            label="Date de naissance"
            type="date"
            value={form.date_naissance}
            onChange={updateField("date_naissance")}
          />
          <Select
            label="Sexe"
            options={SEXE_OPTIONS}
            value={form.sexe}
            onChange={updateField("sexe")}
          />
          <Input label="Téléphone" value={form.telephone} onChange={updateField("telephone")} />
          <Select
            label="Groupe sanguin"
            options={GROUPE_SANGUIN_OPTIONS}
            value={form.groupe_sanguin}
            onChange={updateField("groupe_sanguin")}
          />
          <Input
            label="Personne à contacter"
            value={form.personne_contact}
            onChange={updateField("personne_contact")}
          />
          <Input
            label="Téléphone du contact"
            value={form.telephone_contact}
            onChange={updateField("telephone_contact")}
          />
        </div>

        <Input label="Adresse" value={form.adresse} onChange={updateField("adresse")} />
        <Textarea
          label="Allergies connues"
          value={form.allergies}
          onChange={updateField("allergies")}
          rows={3}
        />

        {error && <p className="patient-form__error">{error}</p>}

        <div className="patient-form__actions">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? "Enregistrer" : "Créer le patient"}
          </Button>
        </div>
      </form>
    </main>
  );
}
