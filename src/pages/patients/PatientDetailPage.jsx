import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Badge, Button, Skeleton, Tabs } from "../../components/ui";
import { getAge } from "../../constants/patients";
import { PATIENTS_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { usePatient } from "../../hooks/usePatient";
import ConsultationsTab from "./tabs/ConsultationsTab";
import DocumentsTab from "./tabs/DocumentsTab";
import GrossesseTab from "./tabs/GrossesseTab";
import HistoriqueTab from "./tabs/HistoriqueTab";
import InfosTab from "./tabs/InfosTab";
import OrdonnancesTab from "./tabs/OrdonnancesTab";
import SuiviTab from "./tabs/SuiviTab";
import VaccinsTab from "./tabs/VaccinsTab";
import VisitesTab from "./tabs/VisitesTab";
import "./PatientDetailPage.css";

const BASE_TABS = [
  { id: "infos", label: "Informations" },
  { id: "historique", label: "Historique médical" },
  { id: "consultations", label: "Consultations" },
  { id: "grossesse", label: "Grossesse" },
  { id: "documents", label: "Documents" },
  { id: "ordonnances", label: "Ordonnances" },
  { id: "vaccins", label: "Vaccins" },
  { id: "visites", label: "Visites" },
  { id: "suivi", label: "Suivi" },
];

export default function PatientDetailPage() {
  const { slug, patientId } = useParams();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PATIENTS_MODULE_ROLES);
  const { patient, documents, vaccinations, visites, consultations, grossesses, notes, loading, refetch } =
    usePatient(canView ? patientId : null);
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    BASE_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : "infos"
  );

  useEffect(() => {
    if (patient && patient.sexe !== "F" && activeTab === "grossesse") {
      setActiveTab("infos");
    }
  }, [patient, activeTab]);

  if (!canView) {
    return (
      <main className="container patient-detail">
        <h1>Accès réservé</h1>
        <p className="patient-detail__subtitle">
          L'accès aux fiches patients est réservé au personnel clinique et à l'Administrateur du
          poste.
        </p>
        <Link to={`/poste/${slug}/patients`} className="patient-detail__back">
          ← Retour à la liste des patients
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container patient-detail">
        <Skeleton variant="text" width={280} />
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="container patient-detail">
        <h1>Patient introuvable</h1>
        <p className="patient-detail__subtitle">
          Ce patient n'existe pas ou n'appartient pas à ce poste.
        </p>
        <Link to={`/poste/${slug}/patients`} className="patient-detail__back">
          ← Retour à la liste des patients
        </Link>
      </main>
    );
  }

  const age = getAge(patient.date_naissance);
  const tabs = BASE_TABS.filter((tab) => tab.id !== "grossesse" || patient.sexe === "F");

  return (
    <main className="container patient-detail">
      <Link to={`/poste/${slug}/patients`} className="patient-detail__back">
        ← Retour à la liste des patients
      </Link>

      <div className="patient-detail__header">
        <div>
          <h1>
            {patient.prenom} {patient.nom}
          </h1>
          <div className="patient-detail__badges">
            <Badge tone="primary">N° {patient.numero_dossier}</Badge>
            {age != null && <Badge tone="neutral">{age} ans</Badge>}
            {patient.sexe && (
              <Badge tone="neutral">{patient.sexe === "M" ? "Masculin" : "Féminin"}</Badge>
            )}
          </div>
        </div>
        <Button as={Link} to={`/poste/${slug}/patients/${patientId}/modifier`} variant="outline">
          Modifier
        </Button>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      {activeTab === "infos" && <InfosTab patient={patient} />}
      {activeTab === "historique" && (
        <HistoriqueTab
          visites={visites}
          vaccinations={vaccinations}
          consultations={consultations}
          grossesses={grossesses}
          notes={notes}
        />
      )}
      {activeTab === "consultations" && (
        <ConsultationsTab
          patientId={patientId}
          posteId={patient.poste_id}
          consultations={consultations}
          onChange={refetch}
        />
      )}
      {activeTab === "grossesse" && patient.sexe === "F" && (
        <GrossesseTab
          patientId={patientId}
          posteId={patient.poste_id}
          grossesses={grossesses}
          onChange={refetch}
        />
      )}
      {activeTab === "documents" && (
        <DocumentsTab
          patientId={patientId}
          posteId={patient.poste_id}
          documents={documents}
          onChange={refetch}
        />
      )}
      {activeTab === "ordonnances" && (
        <OrdonnancesTab patient={patient} consultations={consultations} />
      )}
      {activeTab === "vaccins" && (
        <VaccinsTab
          patientId={patientId}
          posteId={patient.poste_id}
          vaccinations={vaccinations}
          onChange={refetch}
        />
      )}
      {activeTab === "visites" && (
        <VisitesTab
          patientId={patientId}
          posteId={patient.poste_id}
          visites={visites}
          onChange={refetch}
        />
      )}
      {activeTab === "suivi" && (
        <SuiviTab
          patientId={patientId}
          posteId={patient.poste_id}
          notes={notes}
          onChange={refetch}
        />
      )}
    </main>
  );
}
