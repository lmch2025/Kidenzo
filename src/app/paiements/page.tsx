"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Wallet, Smartphone, Banknote } from "lucide-react";
import Link from "next/link";

export default function PaiementsPage() {
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
              Modes de <span className="gradient-text-warm">Paiement</span>
            </h1>
            <p className="text-white/60 text-lg">
              Choisissez la méthode de paiement qui vous convient le mieux. Tout est 100% sécurisé.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-12">
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Smartphone className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">1. Mobile Money (Orange Money & MTN)</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>C'est le moyen le plus rapide et le plus utilisé.</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li><strong>Orange Money (OM)</strong> : Payez directement depuis votre téléphone avec votre compte Orange.</li>
                  <li><strong>MTN Mobile Money</strong> : Validez votre commande en toute sécurité via le réseau MTN.</li>
                </ul>
                <p className="mt-2 text-white/50 text-sm">Comment faire ? Au moment de payer, choisissez Mobile Money, entrez votre numéro, et validez avec votre code secret sur votre téléphone.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Banknote className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">2. Paiement à la livraison (Cash)</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>Vous préférez voir le produit avant de payer ? C'est possible !</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li>Commandez en ligne sans rien payer aujourd'hui.</li>
                  <li>Le livreur vous apporte votre colis à la maison ou au bureau.</li>
                  <li>Vous payez <strong>en espèces (cash)</strong> directement au livreur une fois le colis entre vos mains.</li>
                </ul>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
