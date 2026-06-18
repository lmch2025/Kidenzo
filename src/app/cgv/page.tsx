"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, CreditCard, RotateCcw, AlertTriangle, Truck } from "lucide-react";
import Link from "next/link";

export default function CGVPage() {
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
              Conditions Générales <span className="gradient-text-warm">de Vente</span>
            </h1>
            <p className="text-white/60 text-lg">
              Les règles simples qui encadrent nos ventes, pour que tout soit clair entre nous.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-12">
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <ShoppingBag className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">1. Objet</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Les présentes Conditions Générales de Vente (CGV) s'appliquent à tous les achats effectués sur la plateforme Kidenzo.</p>
                <p>En commandant sur Kidenzo, vous acceptez ces règles. Nous avons fait en sorte qu'elles soient simples à comprendre.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <CreditCard className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">2. Prix et Paiement</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Tous les prix affichés sur Kidenzo sont en Euros (€) et incluent toutes les taxes (TTC).</p>
                <p>Vous pouvez payer par carte bancaire de manière 100% sécurisée. Les informations de paiement sont cryptées et nous n'y avons jamais accès directement.</p>
                <p>La commande est validée une fois le paiement reçu.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Truck className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">3. Livraison</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Nous livrons à l'adresse que vous avez indiquée lors de la commande.</p>
                <p>Le délai de livraison estimé est indiqué avant le paiement. En cas de retard, nous vous tiendrons informé(e).</p>
                <p>À la réception, merci de vérifier que le colis n'est pas abîmé.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <RotateCcw className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">4. Retours et Remboursements</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Vous avez <strong>14 jours</strong> après la réception de votre commande pour changer d'avis.</p>
                <p>Pour retourner un article, contactez-nous. L'article doit être dans son état d'origine. Le remboursement sera effectué sous 14 jours après réception du retour.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">5. Litiges et Contact</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>En cas de problème, nous préférons toujours trouver une solution à l'amiable.</p>
                <p>Contactez notre service client en premier. Si le problème persiste, les tribunaux français seront compétents.</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
