import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Un inventaire + la liste complète des articles du poste, chacun rapproché de sa ligne de
 * comptage si elle existe déjà (permet d'afficher tout le catalogue, compté ou non).
 */
export function useInventaireDetail(inventaireId) {
  const [inventaire, setInventaire] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!inventaireId) {
      setInventaire(null);
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: inv, error: invError } = await supabase
      .from("inventaires")
      .select("*")
      .eq("id", inventaireId)
      .maybeSingle();

    if (invError || !inv) {
      if (invError) console.error("Erreur de chargement de l'inventaire :", invError.message);
      setInventaire(null);
      setRows([]);
      setLoading(false);
      return;
    }

    const [articlesResult, lignesResult] = await Promise.all([
      supabase
        .from("articles_stock")
        .select("id, nom, unite, stock_actuel")
        .eq("poste_id", inv.poste_id)
        .order("nom"),
      supabase.from("inventaire_lignes").select("*").eq("inventaire_id", inventaireId),
    ]);

    const lignesByArticle = new Map((lignesResult.data ?? []).map((l) => [l.article_id, l]));
    const mergedRows = (articlesResult.data ?? []).map((article) => ({
      article,
      ligne: lignesByArticle.get(article.id) ?? null,
    }));

    setInventaire(inv);
    setRows(mergedRows);
    setLoading(false);
  }, [inventaireId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { inventaire, rows, loading, refetch: fetchAll };
}
