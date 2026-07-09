import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl flex flex-col items-center space-y-6">
        
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 animate-bounce">
          <CheckCircle2 size={64} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Paiement Réussi !
          </h1>
          <p className="text-gray-600 text-lg">
            Ton opération a bien été enregistrée. Merci !
          </p>
        </div>

        <div className="w-full pt-6">
          <Link 
            href="/"
            className="w-full block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors"
          >
            🏠 Retour à l'accueil
          </Link>
        </div>

      </div>
    </div>
  );
}
