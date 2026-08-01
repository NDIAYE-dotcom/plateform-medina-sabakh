import { useMemo, useState } from "react";
import { Badge, Card } from "../../../../components/ui";
import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./News.css";

const CATEGORIES = ["Tout", "Blog", "Évènements", "Campagnes", "Vaccinations", "Sensibilisations"];

/* Contenu d'exemple en attendant la connexion au module Actualités (backend à définir) */
const ARTICLES = [
  {
    id: 1,
    category: "Vaccinations",
    title: "Campagne de vaccination infantile dans les postes de santé",
    date: "Exemple de contenu",
    excerpt: "Une campagne conjointe pour renforcer la couverture vaccinale des enfants de la commune.",
  },
  {
    id: 2,
    category: "Sensibilisations",
    title: "Journée de sensibilisation sur l'hygiène communautaire",
    date: "Exemple de contenu",
    excerpt: "Les agents de santé communautaires mobilisés auprès des familles de chaque village.",
  },
  {
    id: 3,
    category: "Évènements",
    title: "Assemblée générale des Comités de Développement Sanitaire",
    date: "Exemple de contenu",
    excerpt: "Un temps fort de coordination entre les différents postes de santé de l'UCDS.",
  },
];

export default function News() {
  const [activeCategory, setActiveCategory] = useState("Tout");

  const filteredArticles = useMemo(
    () =>
      activeCategory === "Tout"
        ? ARTICLES
        : ARTICLES.filter((article) => article.category === activeCategory),
    [activeCategory]
  );

  return (
    <section id="actualites" className="news">
      <div className="container">
        <SectionHeading
          eyebrow="Actualités"
          title="Vie des postes de santé et de l'UCDS"
          description="Retrouvez le blog, les évènements, les campagnes de vaccination et les actions de sensibilisation."
        />

        <div className="news__filters">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`news__filter ${activeCategory === category ? "news__filter--active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="news__grid">
          {filteredArticles.map((article, index) => (
            <Reveal key={article.id} delay={index * 90}>
              <Card hoverable className="news__card">
                <div className="news__thumb" aria-hidden="true" />
                <Badge tone="primary">{article.category}</Badge>
                <Card.Title className="news__title">{article.title}</Card.Title>
                <Card.Description>{article.excerpt}</Card.Description>
                <span className="news__date">{article.date}</span>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
