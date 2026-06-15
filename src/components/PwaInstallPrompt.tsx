"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if the app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      return;
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a little bit before showing so it's not too aggressive
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If it's iOS, we can just show it after a delay since they don't have beforeinstallprompt natively working the same way
    if (isIosDevice) {
      const hasSeenPrompt = localStorage.getItem("kidenzo_has_seen_install_prompt");
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 4000);
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      setShowPrompt(false);
    } else if (isIOS) {
      // Just hide it on iOS after they click, they have to follow instructions
      setShowPrompt(false);
      localStorage.setItem("kidenzo_has_seen_install_prompt", "true");
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem("kidenzo_has_seen_install_prompt", "true");
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 sm:pb-4 pointer-events-none"
        >
          <div className="mx-auto max-w-md bg-card/95 backdrop-blur-md border border-border shadow-2xl shadow-black/50 rounded-2xl p-5 flex flex-col gap-4 pointer-events-auto">
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center shadow-lg">
                <Download className="text-white" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Installer l'application</h3>
                <p className="text-sm text-muted-foreground">
                  Accède plus vite à Kidenzo et gagne tes commissions même hors ligne.
                </p>
              </div>
            </div>

            {isIOS && !deferredPrompt ? (
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-center text-foreground">
                Pour l'installer sur ton iPhone : <br/>
                Touche l'icône <span className="inline-block mx-1">⎋</span> puis <br/>
                <strong>« Sur l'écran d'accueil »</strong> <span className="inline-block mx-1">+</span>
              </div>
            ) : null}

            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-[#f97316] text-white rounded-xl font-medium shadow-md shadow-[#f97316]/20 hover:shadow-[#f97316]/40 transition-all active:scale-95"
            >
              {isIOS && !deferredPrompt ? "J'ai compris" : "Installer sur mon téléphone"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
