import { Card } from "../../../../components/ui";
import {
  ClipboardIcon,
  CoinsIcon,
  HeartPulseIcon,
  MegaphoneIcon,
  TrendingUpIcon,
  UsersIcon,
} from "../../../../components/ui/icons";
import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./Missions.css";

const MISSIONS = [
  {
    icon: UsersIcon,
    title: "Coordination",
    description: "Harmoniser les actions des différents CDS pour une réponse sanitaire cohérente sur toute la commune.",
  },
  {
    icon: MegaphoneIcon,
    title: "Représentation",
    description: "Porter la voix des postes de santé auprès des autorités, des partenaires et des institutions.",
  },
  {
    icon: CoinsIcon,
    title: "Mobilisation des ressources",
    description: "Rechercher et répartir équitablement les financements et équipements entre les postes de santé.",
  },
  {
    icon: ClipboardIcon,
    title: "Planification sanitaire",
    description: "Définir des priorités communes et anticiper les besoins de santé du territoire communal.",
  },
  {
    icon: TrendingUpIcon,
    title: "Suivi et Plaidoyer",
    description: "Évaluer les actions menées et défendre durablement les intérêts sanitaires de la population.",
  },
  {
    icon: HeartPulseIcon,
    title: "Promotion de la santé communautaire",
    description: "Sensibiliser et impliquer les communautés dans la prévention et le bien-être de tous.",
  },
];

export default function Missions() {
  return (
    <section id="missions" className="missions">
      <div className="container">
        <SectionHeading
          eyebrow="Nos missions"
          title="Une action collective au service de la santé communale"
          description="Six missions structurent l'engagement de l'UCDS auprès des Comités de Développement Sanitaire."
        />

        <div className="missions__grid">
          {MISSIONS.map((mission, index) => (
            <Reveal key={mission.title} delay={index * 80}>
              <Card hoverable className="missions__card">
                <div className="missions__icon">
                  <mission.icon />
                </div>
                <Card.Title>{mission.title}</Card.Title>
                <Card.Description>{mission.description}</Card.Description>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
