import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kidenzo Wallet',
  description: 'Gérez vos crédits et votre épargne de façon flexible.',
}

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0118] text-white selection:bg-pink-500/30 selection:text-white">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 min-h-screen">
        {children}
      </main>
    </div>
  )
}
