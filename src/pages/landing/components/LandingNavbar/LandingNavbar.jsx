import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Drawer, Logo } from "../../../../components/ui";
import { MenuIcon } from "../../../../components/ui/icons";
import "./LandingNavbar.css";

const NAV_LINKS = [
  { label: "Accueil", href: "#accueil" },
  { label: "L'UCDS", href: "#a-propos" },
  { label: "Nos missions", href: "#missions" },
  { label: "Postes de santé", href: "#postes-de-sante" },
  { label: "Actualités", href: "#actualites" },
  { label: "Contact", href: "#contact" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`landing-navbar ${scrolled ? "landing-navbar--scrolled" : ""}`}>
      <div className="container landing-navbar__inner">
        <a href="#accueil" className="landing-navbar__brand">
          <Logo size={34} />
        </a>

        <nav className="landing-navbar__links" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-navbar__actions">
          <Button as={Link} to="/connexion" size="sm">
            Accéder à la plateforme
          </Button>
        </div>

        <button
          type="button"
          className="landing-navbar__menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <MenuIcon />
        </button>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="right">
        <nav className="landing-navbar__mobile-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <Button
          as={Link}
          to="/connexion"
          fullWidth
          onClick={() => setMenuOpen(false)}
          className="landing-navbar__mobile-cta"
        >
          Accéder à la plateforme
        </Button>
      </Drawer>
    </header>
  );
}
