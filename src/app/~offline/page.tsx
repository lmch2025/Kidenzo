import { WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="w-20 h-20 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-bold mb-2">Tu es hors ligne</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Il semble que tu n'aies pas de connexion internet. Vérifie ta connexion et réessaie pour continuer à gagner tes commissions.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
      >
        Réessayer
      </Link>
    </div>
  );
}
