"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Lock, Eye, Server, Trash2, UserCheck } from "lucide-react";
import Link from "next/link";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background elements */}
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
              Politique de <span className="gradient-text-warm">Confidentialité</span>
            </h1>
            <p className="text-white/60 text-lg">
              Parce que vos données privées doivent le rester. Voici comment nous les protégeons.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-12">
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Eye className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">1. Quelles données récupérons-nous ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Nous collectons uniquement les informations nécessaires pour que vous puissiez utiliser Kidenzo :</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Votre nom et adresse email (pour créer votre compte).</li>
                  <li>Votre adresse (pour vous livrer vos commandes).</li>
                  <li>Vos informations de paiement (gérées par nos partenaires sécurisés, nous ne les stockons pas).</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Lock className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">2. À quoi servent ces données ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Vos données servent principalement à deux choses :</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li><strong>Traiter vos commandes</strong> : sans votre adresse, nous ne pouvons pas vous envoyer vos produits !</li>
                  <li><strong>Améliorer votre expérience</strong> : retenir vos préférences pour que le site soit plus simple à utiliser lors de votre prochaine visite.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Server className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">3. Qui y a accès ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p><strong>Nous ne vendrons jamais vos données personnelles à d'autres entreprises.</strong></p>
                <p>Seuls nos prestataires indispensables (comme les services de livraison ou de paiement) y ont accès, et uniquement pour faire leur travail.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Trash2 className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">4. Vos droits (RGPD)</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Conformément à la loi, vous avez le contrôle total sur vos données :</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Le droit de voir quelles informations nous avons sur vous.</li>
                  <li>Le droit de les modifier si elles sont fausses.</li>
                  <li>Le droit de nous demander de tout supprimer.</li>
                </ul>
                <p className="mt-2">Pour utiliser vos droits, envoyez-nous simplement un message à <strong>contact@kidenzo.com</strong>.</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
