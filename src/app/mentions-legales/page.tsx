"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Shield, Building, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function MentionsLegalesPage() {
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
              Mentions <span className="gradient-text-warm">Légales</span>
            </h1>
            <p className="text-white/60 text-lg">
              Informations importantes sur Kidenzo et la gestion de notre plateforme.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 space-y-12">
            
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Building className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">Éditeur du site</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Le site Kidenzo est édité par la société <strong>Kidenzo SAS</strong>.</p>
                <p>Capital social : 10 000 €</p>
                <p>RCS : Paris B 123 456 789</p>
                <p>TVA Intracommunautaire : FR 12 3456789</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <MapPin className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">Siège social</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>123 Avenue des Champs-Élysées</p>
                <p>75008 Paris</p>
                <p>France</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Mail className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">Contact</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Email : contact@kidenzo.com</p>
                <p>Téléphone : +33 (0)1 23 45 67 89</p>
                <p>Directeur de la publication : Jean Dupont</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Shield className="w-6 h-6" />
                <h2 className="text-2xl font-semibold text-white">Hébergement</h2>
              </div>
              <div className="space-y-2 text-white/70 pl-9">
                <p>Ce site est hébergé par <strong>Vercel Inc.</strong></p>
                <p>440 N Barranca Ave #4133</p>
                <p>Covina, CA 91723</p>
                <p>États-Unis</p>
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
