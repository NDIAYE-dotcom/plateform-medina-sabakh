import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui";
import { ArrowRightIcon, MapPinIcon } from "../../../../components/ui/icons";
import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./HealthPosts.css";

const HEALTH_POSTS = [
  "Médina Sabakh",
  "Keur Ayib Gueye",
  "Falila",
  "Kohel",
  "Ndiba",
  "Ndiayène",
  "Payoma",
];

export default function HealthPosts() {
  return (
    <section id="postes-de-sante" className="health-posts">
      <div className="container">
        <SectionHeading
          eyebrow="Notre réseau"
          title="Les postes de santé de la commune"
          description="Chaque poste de santé dispose de son propre espace sécurisé au sein de la plateforme UCDS. Choisissez le vôtre lors de votre inscription."
        />

        <Reveal>
          <ul className="health-posts__list">
            {HEALTH_POSTS.map((name) => (
              <li key={name} className="health-posts__pill">
                <MapPinIcon />
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={80}>
          <div className="health-posts__cta">
            <Button as={Link} to="/connexion" size="lg" iconRight={<ArrowRightIcon />}>
              Accéder à mon espace
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
