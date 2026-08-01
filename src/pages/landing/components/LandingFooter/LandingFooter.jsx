import { Link } from "react-router-dom";
import { Logo } from "../../../../components/ui";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XSocialIcon } from "../../../../components/ui/icons";
import "./LandingFooter.css";

const NAV_LINKS = [
  { label: "Accueil", href: "#accueil" },
  { label: "L'UCDS", href: "#a-propos" },
  { label: "Nos missions", href: "#missions" },
  { label: "Postes de santé", href: "#postes-de-sante" },
  { label: "Actualités", href: "#actualites" },
  { label: "Contact", href: "#contact" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#", icon: FacebookIcon },
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "X (Twitter)", href: "#", icon: XSocialIcon },
  { label: "LinkedIn", href: "#", icon: LinkedInIcon },
];

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="container landing-footer__top">
        <div className="landing-footer__brand">
          <Logo size={32} />
          <p>
            Union des Comités de Développement Sanitaire — Commune de Médina Sabakh, Sénégal.
          </p>
          <div className="landing-footer__socials">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} aria-label={label} className="landing-footer__social-btn">
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <div className="landing-footer__col">
          <h3>Navigation</h3>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="landing-footer__col">
          <h3>Légal</h3>
          <ul>
            <li>
              <Link to="/mentions-legales">Mentions légales</Link>
            </li>
            <li>
              <Link to="/politique-confidentialite">Politique de confidentialité</Link>
            </li>
          </ul>
        </div>

        <div className="landing-footer__col">
          <h3>Plateforme</h3>
          <ul>
            <li>
              <Link to="/connexion">Accéder à la plateforme</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container landing-footer__bottom">
        <p>© {new Date().getFullYear()} UCDS — Médina Sabakh. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
