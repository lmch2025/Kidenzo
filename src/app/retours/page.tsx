"use client";

import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ThumbsUp, AlertCircle, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function RetoursPage() {
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
              Conditions de <span className="gradient-text-warm">Retour</span>
            </h1>
            <p className="text-white/60 text-lg">
              Le produit ne vous plaît pas ou a un problème ? On vous explique comment le rendre.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-12">
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <CalendarDays className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">1. Combien de temps avez-vous ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>À partir du jour où vous recevez votre commande, vous avez <strong>14 jours</strong> pour nous prévenir si vous voulez rendre le produit.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <ThumbsUp className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">2. Dans quel état doit être le produit ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>Pour qu'on puisse accepter le retour, le produit doit :</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li>Être dans son carton d'origine.</li>
                  <li>Avoir toutes ses étiquettes et accessoires.</li>
                  <li>Ne pas avoir été utilisé, abîmé ou sali.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <RotateCcw className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">3. Comment faire le retour ?</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>La démarche est très simple :</p>
                <ul className="list-disc pl-5 space-y-2 mt-3">
                  <li>Appelez-nous ou envoyez-nous un message (WhatsApp ou email).</li>
                  <li>Donnez-nous votre numéro de commande.</li>
                  <li>Nous organiserons avec vous le passage d'un livreur pour récupérer le colis ou nous vous donnerons une adresse où le déposer.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <AlertCircle className="w-8 h-8" />
                <h2 className="text-2xl font-semibold text-white">4. Le remboursement</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-11">
                <p>Dès qu'on récupère le produit et qu'on vérifie qu'il est en bon état, nous vous remboursons dans un délai maximum de <strong>14 jours</strong>.</p>
                <p>Le remboursement se fera de la même manière que vous avez payé (par Mobile Money par exemple).</p>
                <p className="mt-2 text-white/50 text-sm">Attention : Les frais pour renvoyer le produit peuvent être à votre charge si le produit n'a aucun défaut.</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
