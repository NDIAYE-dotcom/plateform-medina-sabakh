import Reveal from "../Reveal/Reveal";
import "./SectionHeading.css";

export default function SectionHeading({ eyebrow, title, description, align = "center" }) {
  return (
    <Reveal className={`section-heading section-heading--${align}`}>
      {eyebrow && <span className="section-heading__eyebrow">{eyebrow}</span>}
      <h2 className="section-heading__title">{title}</h2>
      {description && <p className="section-heading__description">{description}</p>}
    </Reveal>
  );
}
