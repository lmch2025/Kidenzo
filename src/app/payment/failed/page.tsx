import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl flex flex-col items-center space-y-6">
        
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
          <XCircle size={64} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Paiement Non Abouti
          </h1>
          <p className="text-gray-600 text-lg">
            Nous n'avons pas pu valider ton paiement. Ne t'inquiète pas, rien n'a été débité.
          </p>
        </div>

        <div className="w-full pt-6 space-y-4">
          <Link 
            href="/"
            className="w-full block bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-2xl text-lg transition-colors"
          >
            🏠 Retour à l'accueil
          </Link>
        </div>

      </div>
    </div>
  );
}
