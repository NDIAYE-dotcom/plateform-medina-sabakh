import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui";
import { ArrowRightIcon, HeartPulseIcon, MapPinIcon, UsersIcon } from "../../../../components/ui/icons";
import Reveal from "../../components/Reveal/Reveal";
import HeroIllustration from "./HeroIllustration";
import "./Hero.css";

const TRUST_POINTS = [
  { icon: MapPinIcon, label: "6 postes de santé connectés" },
  { icon: UsersIcon, label: "Dossiers médicaux sécurisés" },
  { icon: HeartPulseIcon, label: "Suivi en temps réel" },
];

export default function Hero() {
  return (
    <section id="accueil" className="hero">
      <div className="hero__backdrop" aria-hidden="true" />
      <div className="container hero__inner">
        <Reveal className="hero__content">
          <span className="hero__eyebrow">
            <span className="hero__eyebrow-dot" aria-hidden="true" />
            UCDS — Médina Sabakh, Sénégal
          </span>
          <h1 className="hero__title">
            Unir les postes de santé pour une commune en meilleure santé
          </h1>
          <p className="hero__subtitle">
            L'Union des Comités de Développement Sanitaire coordonne les Comités de
            Développement Sanitaire de Médina Sabakh, mobilise des ressources et centralise le
            suivi sanitaire de chaque poste de santé de la commune.
          </p>
          <div className="hero__actions">
            <Button as={Link} to="/connexion" size="lg" iconRight={<ArrowRightIcon />}>
              Accéder à la plateforme
            </Button>
            <Button as="a" href="#a-propos" variant="outline" size="lg">
              Découvrir
            </Button>
          </div>

          <ul className="hero__trust">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="hero__trust-item">
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150} className="hero__visual">
          <HeroIllustration />
        </Reveal>
      </div>
    </section>
  );
}
