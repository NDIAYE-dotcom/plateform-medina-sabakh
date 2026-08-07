import { CheckCircleIcon, ClipboardIcon, MapPinIcon, PillIcon, UsersIcon } from "../../../../components/ui/icons";

export default function HeroIllustration() {
  return (
    <div className="hero-mock" role="img" aria-label="Aperçu du tableau de bord d'un poste de santé sur la plateforme UCDS">
      <div className="hero-mock__blob hero-mock__blob--a" aria-hidden="true" />
      <div className="hero-mock__blob hero-mock__blob--b" aria-hidden="true" />

      <div className="hero-mock__card">
        <div className="hero-mock__card-header">
          <span className="hero-mock__poste">
            <span className="hero-mock__poste-dot" aria-hidden="true" />
            Poste de santé — Kohel
          </span>
          <span className="hero-mock__status">
            <span className="hero-mock__status-dot" aria-hidden="true" />
            En ligne
          </span>
        </div>

        <div className="hero-mock__pulse">
          <svg viewBox="0 0 240 40" preserveAspectRatio="none" className="hero-mock__pulse-line" aria-hidden="true">
            <path d="M0 22h26l8-14 12 28 10-22 7 8h28l8-14 12 28 10-22 7 8h112" />
          </svg>
        </div>

        <div className="hero-mock__rows">
          <div className="hero-mock__row">
            <span className="hero-mock__row-icon">
              <UsersIcon />
            </span>
            <span className="hero-mock__row-label">Patients suivis</span>
            <span className="hero-mock__row-value">1 240</span>
          </div>
          <div className="hero-mock__row">
            <span className="hero-mock__row-icon">
              <ClipboardIcon />
            </span>
            <span className="hero-mock__row-label">Consultations ce mois</span>
            <span className="hero-mock__row-value">312</span>
          </div>
          <div className="hero-mock__row">
            <span className="hero-mock__row-icon">
              <PillIcon />
            </span>
            <span className="hero-mock__row-label">Stock pharmacie</span>
            <span className="hero-mock__row-value hero-mock__row-value--ok">
              <CheckCircleIcon />À jour
            </span>
          </div>
        </div>
      </div>

      <div className="hero-mock__badge hero-mock__badge--network" aria-hidden="true">
        <span className="hero-mock__badge-icon">
          <MapPinIcon />
        </span>
        <div className="hero-mock__badge-text">
          <strong>6 postes</strong>
          <span>en réseau</span>
        </div>
      </div>

      <div className="hero-mock__badge hero-mock__badge--activity" aria-hidden="true">
        <span className="hero-mock__activity-dot" />
        Nouveau patient enregistré
      </div>
    </div>
  );
}
