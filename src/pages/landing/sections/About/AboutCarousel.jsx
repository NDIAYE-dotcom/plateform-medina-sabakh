import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../../components/ui/icons";
import "./AboutCarousel.css";

const SLIDES = [
  {
    src: "/about-slide-vaccination.webp",
    title: "Vaccination",
    text: "Le suivi vaccinal des enfants, assuré par nos agents de santé avec l'appui des familles.",
  },
  {
    src: "/about-slide-communaute.webp",
    title: "Comités de Développement Sanitaire",
    text: "Les CDS se réunissent régulièrement pour coordonner leurs actions au niveau communautaire.",
  },
  {
    src: "/about-slide-consultation.webp",
    title: "Consultations médicales",
    text: "Un suivi médical assuré pour chaque patient, du nourrisson à l'adulte, dans chaque poste.",
  },
  {
    src: "/about-slide-pharmacie.webp",
    title: "Pharmacie communautaire",
    text: "La gestion du stock et la délivrance des médicaments, au plus près des populations.",
  },
  {
    src: "/about-slide-union.webp",
    title: "L'union fait la force",
    text: "L'UCDS fédère les Comités de Développement Sanitaire autour d'une action commune.",
  },
];

const AUTOPLAY_MS = 5000;
const LETTER_STEP_MS = 28;

export default function AboutCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = (next) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    if (paused) return undefined;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  const slide = SLIDES[index];
  const textDelay = slide.title.length * LETTER_STEP_MS + 180;

  return (
    <div
      className="about-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="about-carousel__stage">
        {SLIDES.map((item, i) => (
          <img
            key={item.src}
            src={item.src}
            alt=""
            className={`about-carousel__image ${i === index ? "about-carousel__image--active" : ""}`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

        <button
          type="button"
          className="about-carousel__nav about-carousel__nav--prev"
          onClick={() => goTo(index - 1)}
          aria-label="Image précédente"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className="about-carousel__nav about-carousel__nav--next"
          onClick={() => goTo(index + 1)}
          aria-label="Image suivante"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="about-carousel__progress" role="tablist" aria-label="Choisir une image">
        {SLIDES.map((item, i) => (
          <button
            key={item.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={item.title}
            className="about-carousel__segment"
            onClick={() => goTo(i)}
          >
            <span
              className={`about-carousel__segment-fill ${i < index ? "about-carousel__segment-fill--done" : ""} ${
                i === index ? "about-carousel__segment-fill--active" : ""
              }`}
              style={
                i === index
                  ? {
                      animationDuration: `${AUTOPLAY_MS}ms`,
                      animationPlayState: paused ? "paused" : "running",
                    }
                  : undefined
              }
            />
          </button>
        ))}
      </div>

      <div className="about-carousel__caption" key={index} aria-live="polite">
        <h3 className="about-carousel__title">
          {slide.title.split("").map((char, i) => (
            <span
              key={i}
              className="about-carousel__letter"
              style={{ animationDelay: `${i * LETTER_STEP_MS}ms` }}
            >
              {char === " " ? " " : char}
            </span>
          ))}
        </h3>
        <p className="about-carousel__text" style={{ animationDelay: `${textDelay}ms` }}>
          {slide.text}
        </p>
      </div>
    </div>
  );
}
