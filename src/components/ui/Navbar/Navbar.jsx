import { BellIcon, MenuIcon, SearchIcon } from "../icons";
import "./Navbar.css";

export default function Navbar({
  onMenuClick,
  showSearch = true,
  notificationsCount = 0,
  user,
  actions,
}) {
  return (
    <header className="navbar">
      <div className="navbar__left">
        {onMenuClick && (
          <button type="button" className="navbar__icon-btn" onClick={onMenuClick} aria-label="Menu">
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
        <button type="button" className="navbar__icon-btn" aria-label="Notifications">
          <BellIcon />
          {notificationsCount > 0 && <span className="navbar__badge">{notificationsCount}</span>}
        </button>
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
      </div>
    </header>
  );
}
