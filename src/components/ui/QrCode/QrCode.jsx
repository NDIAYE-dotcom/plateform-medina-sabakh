import { useMemo } from "react";
import qrcodegen from "qrcode-generator";

/**
 * QR Code en SVG pur, généré côté client (aucun appel réseau, aucune image externe — fonctionne
 * hors-ligne dans la PWA). La génération de la matrice utilise `qrcode-generator` (zéro dépendance,
 * domaine public) ; le rendu (couleurs, taille, marge) reste notre code, cohérent avec le Design
 * System.
 *
 * Important : cette bibliothèque encode mal les caractères accentués (testé et confirmé — "é"/"è"
 * ne survivent pas à un cycle encodage/décodage). `value` doit donc rester une chaîne ASCII simple
 * (ex. un identifiant de ticket), jamais du texte affichable en français.
 */
export default function QrCode({ value, size = 160, color = "#124D41", background = "#F2FFFB" }) {
  const qr = useMemo(() => {
    const instance = qrcodegen(0, "M");
    instance.addData(value);
    instance.make();
    return instance;
  }, [value]);

  const moduleCount = qr.getModuleCount();
  const quietZone = 4; // marge blanche standard QR — indispensable pour qu'un scanner lise le code
  const totalModules = moduleCount + quietZone * 2;
  const cellSize = size / totalModules;

  const rects = [];
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.isDark(row, col)) {
        rects.push(
          <rect
            key={`${row}-${col}`}
            x={(col + quietZone) * cellSize}
            y={(row + quietZone) * cellSize}
            width={cellSize}
            height={cellSize}
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`QR code : ${value}`}
    >
      <rect x="0" y="0" width={size} height={size} fill={background} />
      <g fill={color}>{rects}</g>
    </svg>
  );
}
