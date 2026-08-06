import { useState } from "react";
import { Badge, Card } from "../../../../components/ui";
import { ACTUALITE_CATEGORIE_OPTIONS, getActualiteCategorieLabel } from "../../../../constants/actualites";
import { useActualites } from "../../../../hooks/useActualites";
import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./News.css";

const FILTERS = [{ value: "", label: "Tout" }, ...ACTUALITE_CATEGORIE_OPTIONS];

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function News() {
  const [activeCategorie, setActiveCategorie] = useState("");
  const { actualites, loading } = useActualites({ categorie: activeCategorie || undefined });

  return (
    <section id="actualites" className="news">
      <div className="container">
        <SectionHeading
          eyebrow="Actualités"
          title="Vie des postes de santé et de l'UCDS"
          description="Retrouvez le blog, les évènements, les campagnes de vaccination et les actions de sensibilisation."
        />

        <div className="news__filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`news__filter ${activeCategorie === filter.value ? "news__filter--active" : ""}`}
              onClick={() => setActiveCategorie(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? null : actualites.length === 0 ? (
          <p className="news__empty">Aucune actualité publiée pour le moment.</p>
        ) : (
          <div className="news__grid">
            {actualites.map((actualite, index) => (
              <Reveal key={actualite.id} delay={index * 90}>
                <Card hoverable className="news__card">
                  {actualite.image_url ? (
                    <img src={actualite.image_url} alt="" className="news__thumb-img" />
                  ) : (
                    <div className="news__thumb" aria-hidden="true" />
                  )}
                  <Badge tone="primary">{getActualiteCategorieLabel(actualite.categorie)}</Badge>
                  <Card.Title className="news__title">{actualite.titre}</Card.Title>
                  {actualite.description && <Card.Description>{actualite.description}</Card.Description>}
                  <span className="news__date">{formatDate(actualite.created_at)}</span>
                </Card>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
