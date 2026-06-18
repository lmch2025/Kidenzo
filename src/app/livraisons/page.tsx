"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Truck, MapPin, Clock, Package } from "lucide-react";
import Link from "next/link";

export default function LivraisonsPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] bg-brand-primary/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-16">
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl py-4 -mx-4 px-4 mb-8 border-b border-white/10 sm:border sm:border-white/10 sm:rounded-2xl sm:mx-0">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">
              Nos <span className="gradient-text-warm">Livraisons</span>
            </h1>
            <p className="text-white/60 text-lg">
              Recevez vos commandes rapidement, où que vous soyez.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-12">
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Truck className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">1. Comment ça marche ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>C'est très simple :</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li>Vous passez votre commande sur le site.</li>
                  <li>Nous préparons votre colis avec soin.</li>
                  <li>Notre livreur vous appelle pour confirmer l'heure de passage.</li>
                  <li>Il vous remet le colis en main propre !</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Clock className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">2. Délais de livraison</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>Nous faisons le maximum pour vous livrer vite :</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li><strong>Dans la même ville</strong> : Généralement le jour même ou le lendemain.</li>
                  <li><strong>En dehors de la ville</strong> : Entre 2 et 3 jours selon la distance.</li>
                </ul>
                <p className="mt-2 text-white/50 text-sm">Le délai exact vous sera toujours confirmé par notre équipe au téléphone après votre commande.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <MapPin className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">3. Où livrons-nous ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>Nous livrons partout dans le pays. Que vous soyez à la maison, au bureau ou en boutique, donnez-nous juste une adresse précise (ou un point de repère clair) et notre livreur vous trouvera.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Package className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">4. À la réception</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>Quand le livreur arrive, prenez le temps de vérifier que le paquet est en bon état. Si tout est parfait, vous pouvez alors payer le livreur (si vous avez choisi le paiement à la livraison).</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
