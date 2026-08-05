import "./PosteLetterhead.css";

/** En-tête commune à tous les documents imprimés : nom du poste + téléphone. */
export function PrintLetterheadHeader({ poste }) {
  if (!poste?.nom) return null;

  return (
    <div className="print-letterhead__header">
      <p className="print-letterhead__poste-nom">{poste.nom}</p>
      {poste.telephone && <p className="print-letterhead__poste-tel">Tél : {poste.telephone}</p>}
    </div>
  );
}

/** Pied de page commun : cachet, signature et nom du chef de poste, une fois renseignés dans Réglages. */
export function PrintLetterheadFooter({ poste }) {
  const hasFooter = poste?.nom_chef || poste?.cachet_url || poste?.signature_url;
  if (!hasFooter) return null;

  return (
    <div className="print-letterhead__footer">
      <div className="print-letterhead__footer-block">
        {poste.cachet_url && (
          <img src={poste.cachet_url} alt="Cachet du poste" className="print-letterhead__cachet" />
        )}
      </div>
      <div className="print-letterhead__footer-block print-letterhead__footer-block--signature">
        <p className="print-letterhead__signature-label">Le Chef de Poste</p>
        {poste.signature_url && (
          <img src={poste.signature_url} alt="Signature" className="print-letterhead__signature" />
        )}
        {poste.nom_chef && <p className="print-letterhead__nom-chef">{poste.nom_chef}</p>}
      </div>
    </div>
  );
}
