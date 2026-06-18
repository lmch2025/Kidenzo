import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __isProgrammaticBack?: boolean;
  }
}

/**
 * Hook qui s'assure qu'une modale peut être fermée via le bouton retour du téléphone
 * sans pour autant faire reculer la page de l'application.
 */
export function useHardwareBack() {
  const stateId = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Pousser l'état de la modale dans l'historique
    const currentState = window.history.state;
    window.history.pushState({ ...currentState, overlayId: stateId.current }, "");

    const handlePopState = (e: PopStateEvent) => {
      // 2. Si c'est un retour programmé (pour nettoyer l'historique), on ignore
      if (window.__isProgrammaticBack) {
        return;
      }
      
      // 3. Le bouton retour physique a été pressé
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        })
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      // 4. Si on démonte la modale (croix, clic dehors) et que son état est toujours au sommet
      if (window.history.state?.overlayId === stateId.current) {
        window.__isProgrammaticBack = true;
        
        const onPopStateDone = () => {
          window.__isProgrammaticBack = false;
          window.removeEventListener('popstate', onPopStateDone);
          clearTimeout(fallback);
        };
        
        window.addEventListener('popstate', onPopStateDone);
        const fallback = setTimeout(onPopStateDone, 100);
        
        window.history.back();
      }
    };
  }, []);
}
