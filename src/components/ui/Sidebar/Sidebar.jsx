import { NavLink } from "react-router-dom";
import { ChevronLeftIcon } from "../icons";
import "./Sidebar.css";

/**
 * sections: [{ title?, items: [{ label, to, icon }] }]
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
              {section.items.map((item) => (
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
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {footer && !collapsed && <div className="sidebar__footer">{footer}</div>}
    </aside>
  );
}
