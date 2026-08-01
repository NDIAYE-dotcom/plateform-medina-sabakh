import { useInView } from "../../../../hooks/useInView";
import "./Reveal.css";

/**
 * Révèle son contenu avec un léger fondu + translation lorsqu'il entre dans le viewport.
 */
export default function Reveal({ children, delay = 0, as: Tag = "div", className = "" }) {
  const [ref, isInView] = useInView();

  return (
    <Tag
      ref={ref}
      className={`reveal ${isInView ? "reveal--visible" : ""} ${className}`}
      style={{ transitionDelay: isInView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
