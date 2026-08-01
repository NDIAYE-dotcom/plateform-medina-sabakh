import { Link } from "react-router-dom";
import { ChevronRightIcon } from "../icons";
import "./Breadcrumb.css";

/**
 * items: [{ label, to? }] — le dernier élément est la page courante (sans lien)
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Fil d'Ariane">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label}>
              {!isLast && item.to ? (
                <Link to={item.to} className="breadcrumb__link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="breadcrumb__separator" aria-hidden="true">
                  <ChevronRightIcon />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
