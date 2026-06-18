"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function AppExitGuard() {
  const { toast } = useToast();
  const backPressCount = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialisation unique par session de l'historique de garde
    if (!window.sessionStorage.getItem("app_exit_guard_init")) {
      window.sessionStorage.setItem("app_exit_guard_init", "true");
      
      // L'état actuel devient l'état "racine" (qui intercepte la sortie)
      window.history.replaceState({ ...window.history.state, isAppRoot: true }, "");
      // On ajoute un état normal par-dessus qui sera l'espace de navigation standard
      window.history.pushState({ ...window.history.state, isAppNormal: true }, "");
    }

    const handlePopState = (e: PopStateEvent) => {
      // Si un retour programmé est en cours (nettoyage de modale), on l'ignore
      if (window.__isProgrammaticBack) {
        return;
      }

      // Si une modale (Dialog, Drawer, Sheet) est ouverte, son hook s'en occupe
      const hasOpenModals = document.querySelectorAll('[role="dialog"][data-state="open"]').length > 0;
      if (hasOpenModals) return;

      // Si l'utilisateur est retombé sur l'état "isAppRoot" de base
      if (e.state && e.state.isAppRoot) {
        if (backPressCount.current === 0) {
          toast({
            title: "Quitter l'application ?",
            description: "Appuyez encore une fois sur Retour pour quitter.",
            duration: 2000,
          });
          backPressCount.current = 1;
          
          // On repousse un état normal pour empêcher la sortie immédiate
          window.history.pushState({ ...window.history.state, isAppNormal: true }, "");

          setTimeout(() => {
            backPressCount.current = 0;
          }, 2000);
        } else {
          // L'utilisateur a appuyé deux fois, on le laisse quitter
          window.history.back();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [toast]);

  return null;
}
