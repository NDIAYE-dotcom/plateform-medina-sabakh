import { useEffect, useRef, useState } from "react";

/**
 * Retourne [ref, isInView] — isInView passe à true une fois l'élément visible
 * (déclenchement unique, utilisé pour les animations de révélation au scroll).
 */
export function useInView({ threshold = 0.2, rootMargin = "0px 0px -80px 0px" } = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isInView, threshold, rootMargin]);

  return [ref, isInView];
}
