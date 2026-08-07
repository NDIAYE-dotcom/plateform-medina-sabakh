import { ClipboardIcon, HeartPulseIcon, MapPinIcon, UsersIcon } from "../../../../components/ui/icons";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import StatItem from "./StatItem";
import "./Stats.css";

/* Chiffres illustratifs en attendant le branchement sur les statistiques réelles (étape 15) */
const STATS = [
  { icon: MapPinIcon, target: 6, suffix: "", label: "Postes de santé" },
  { icon: UsersIcon, target: 24, suffix: "", label: "Villages couverts" },
  { icon: ClipboardIcon, target: 38, suffix: "", label: "Campagnes menées" },
  { icon: HeartPulseIcon, target: 12000, suffix: "+", label: "Bénéficiaires accompagnés" },
];

export default function Stats() {
  return (
    <section id="statistiques" className="stats">
      <div className="container">
        <SectionHeading
          eyebrow="En chiffres"
          title="L'impact de notre coordination"
          align="center"
        />
        <div className="stats__grid">
          {STATS.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
