import Reveal from "../../components/Reveal/Reveal";
import AboutCarousel from "./AboutCarousel";
import "./About.css";

export default function About() {
  return (
    <section id="a-propos" className="about">
      <div className="container about__inner">
        <Reveal className="about__content">
          <span className="about__eyebrow">Qui sommes-nous ?</span>
          <h2>L'Union des Comités de Développement Sanitaire</h2>
          <p className="about__lead">
            « L'Union des Comités de Développement Sanitaire (UCDS) rassemble tous les Comités de
            Développement Sanitaire (CDS) d'une même commune afin d'unir leurs efforts, coordonner
            leurs actions et parler d'une seule voix pour améliorer durablement la santé des
            populations. »
          </p>
        </Reveal>

        <Reveal delay={120} className="about__visual">
          <AboutCarousel />
        </Reveal>
      </div>
    </section>
  );
}
