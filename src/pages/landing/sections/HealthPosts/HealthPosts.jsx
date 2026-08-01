import { Link } from "react-router-dom";
import { Button, Card } from "../../../../components/ui";
import { MapPinIcon } from "../../../../components/ui/icons";
import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./HealthPosts.css";

const HEALTH_POSTS = [
  { name: "Médina Sabakh" },
  { name: "Keur Ayib Gueye" },
  { name: "Falila" },
  { name: "Kohel" },
  { name: "Ndiba" },
  { name: "Ndiayène" },
  { name: "Payoma" },
];

export default function HealthPosts() {
  return (
    <section id="postes-de-sante" className="health-posts">
      <div className="container">
        <SectionHeading
          eyebrow="Notre réseau"
          title="Les postes de santé de la commune"
          description="Chaque poste de santé dispose de son propre espace sécurisé au sein de la plateforme UCDS."
        />

        <div className="health-posts__grid">
          {HEALTH_POSTS.map((post, index) => (
            <Reveal key={post.name} delay={index * 70}>
              <Card className="health-posts__card" padded={false}>
                <div className="health-posts__photo">
                  <MapPinIcon />
                  <span>{post.name}</span>
                </div>
                <div className="health-posts__body">
                  <Card.Title>{post.name}</Card.Title>
                  <Card.Description>
                    Poste de santé de la commune de Médina Sabakh, engagé pour une santé de
                    proximité au service des populations.
                  </Card.Description>
                  <Button as={Link} to="/connexion" variant="outline" size="sm" fullWidth>
                    Accéder à l'espace du poste
                  </Button>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
