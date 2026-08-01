import { ArrowRightIcon } from "../../../../components/ui/icons";
import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./WhyUcds.css";

const STEPS = [
  "Plusieurs CDS",
  "Une seule Union",
  "Plus de poids",
  "Plus de financements",
  "Meilleure organisation",
  "Meilleurs services de santé",
];

export default function WhyUcds() {
  return (
    <section id="pourquoi-ucds" className="why-ucds">
      <div className="container">
        <SectionHeading
          eyebrow="Pourquoi une UCDS ?"
          title="La force du collectif au service de la santé"
          description="En s'unissant, les Comités de Développement Sanitaire pèsent davantage et obtiennent de meilleurs résultats pour la population."
        />

        <div className="why-ucds__flow">
          {STEPS.map((step, index) => (
            <Reveal key={step} delay={index * 120} className="why-ucds__step-wrap">
              <div className={`why-ucds__step ${index === STEPS.length - 1 ? "why-ucds__step--final" : ""}`}>
                {step}
              </div>
              {index < STEPS.length - 1 && (
                <span className="why-ucds__arrow" aria-hidden="true">
                  <ArrowRightIcon />
                </span>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
