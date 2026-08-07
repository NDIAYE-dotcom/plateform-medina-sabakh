import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BellIcon, LogOutIcon, MenuIcon, SearchIcon } from "../icons";
import "./Navbar.css";

export default function Navbar({
  onMenuClick,
  showSearch = true,
  notifications = [],
  notificationsLoading = false,
  user,
  actions,
  onSignOut,
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);
  const notificationsCount = notifications.length;

  useEffect(() => {
    if (!panelOpen) return undefined;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  return (
    <header className="navbar">
      <div className="navbar__left">
        {onMenuClick && (
          <button
            type="button"
            className="navbar__icon-btn navbar__icon-btn--menu"
            onClick={onMenuClick}
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
        )}
        {showSearch && (
          <div className="navbar__search">
            <SearchIcon />
            <input type="search" placeholder="Rechercher..." aria-label="Rechercher" />
          </div>
        )}
      </div>

      <div className="navbar__right">
        {actions}
        <div className="navbar__notifications" ref={panelRef}>
          <button
            type="button"
            className="navbar__icon-btn"
            aria-label="Notifications"
            onClick={() => setPanelOpen((open) => !open)}
          >
            <BellIcon />
            {notificationsCount > 0 && <span className="navbar__badge">{notificationsCount}</span>}
          </button>

          {panelOpen && (
            <div className="navbar__notifications-panel">
              <p className="navbar__notifications-title">Notifications</p>
              {notificationsLoading ? (
                <p className="navbar__notifications-empty">Chargement...</p>
              ) : notifications.length === 0 ? (
                <p className="navbar__notifications-empty">Aucune alerte pour le moment.</p>
              ) : (
                <ul className="navbar__notifications-list">
                  {notifications.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.to}
                        className={`navbar__notifications-item ${item.urgent ? "navbar__notifications-item--urgent" : ""}`}
                        onClick={() => setPanelOpen(false)}
                      >
                        <span className="navbar__notifications-item-label">{item.label}</span>
                        <span className="navbar__notifications-item-description">
                          {item.description}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {user && (
          <div className="navbar__user">
            <span className="navbar__avatar" aria-hidden="true">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </span>
            <div className="navbar__user-info">
              <span className="navbar__user-name">{user.name}</span>
              {user.role && <span className="navbar__user-role">{user.role}</span>}
            </div>
          </div>
        )}
        {onSignOut && (
          <button
            type="button"
            className="navbar__icon-btn navbar__icon-btn--signout"
            onClick={onSignOut}
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOutIcon />
          </button>
        )}
      </div>
    </header>
  );
}
