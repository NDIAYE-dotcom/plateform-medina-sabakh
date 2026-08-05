import { NavLink } from "react-router-dom";
import { ChevronLeftIcon } from "../icons";
import "./Sidebar.css";

/**
 * sections: [{ title?, items: [{ label, to, icon, disabled?, badge? }] }]
 * Un item avec `disabled: true` s'affiche verrouillé (non cliquable), avec un `badge` optionnel
 * (ex. "Bientôt") — utilisé pour prévisualiser les modules pas encore développés.
 */
export default function Sidebar({ logo, sections = [], footer, collapsed = false, onToggleCollapse }) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__top">
        {logo && <div className="sidebar__logo">{logo}</div>}
        {onToggleCollapse && (
          <button
            type="button"
            className="sidebar__toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          >
            <ChevronLeftIcon />
          </button>
        )}
      </div>

      <nav className="sidebar__nav">
        {sections.map((section) => (
          <div className="sidebar__section" key={section.title ?? section.items[0]?.label}>
            {section.title && !collapsed && <p className="sidebar__section-title">{section.title}</p>}
            <ul>
              {section.items.map((item) =>
                item.disabled ? (
                  <li key={item.label}>
                    <span
                      className="sidebar__item sidebar__item--disabled"
                      title={collapsed ? `${item.label}${item.badge ? ` — ${item.badge}` : ""}` : undefined}
                    >
                      {item.icon && <span className="sidebar__icon">{item.icon}</span>}
                      {!collapsed && <span className="sidebar__label">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="sidebar__badge">{item.badge}</span>
                      )}
                    </span>
                  </li>
                ) : (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `sidebar__item ${isActive ? "sidebar__item--active" : ""}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon && <span className="sidebar__icon">{item.icon}</span>}
                      {!collapsed && <span className="sidebar__label">{item.label}</span>}
                    </NavLink>
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </nav>

      {footer && !collapsed && <div className="sidebar__footer">{footer}</div>}
    </aside>
  );
}
