import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./Partners.css";

const PARTNERS = [
  "La Mairie",
  "District Sanitaire",
  "ASC",
  "Bajenu Gox",
  "ONG",
  "Partenaires Techniques",
];

export default function Partners() {
  return (
    <section id="partenaires" className="partners">
      <div className="container">
        <SectionHeading eyebrow="Ils nous accompagnent" title="Nos partenaires" />

        <Reveal className="partners__grid">
          {PARTNERS.map((partner) => (
            <div key={partner} className="partners__item">
              {partner}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
