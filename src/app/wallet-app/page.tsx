'use client'

import React, { useState } from 'react'
import CustomerWalletModal from '@/components/CustomerWalletModal'
import { useAppStore } from '@/lib/store'
import CreditPurchaseSheet from '@/components/CreditPurchaseSheet'
import SavingsGoalSheet from '@/components/SavingsGoalSheet'

export default function WalletAppPage() {
  const { setCustomerWallet, user, token } = useAppStore()
  const [creditSheetOpen, setCreditSheetOpen] = useState(false)
  const [savingsSheetOpen, setSavingsSheetOpen] = useState(false)

  // In the standalone PWA, the wallet modal is just embedded as the main view
  // But since CustomerWalletModal uses a Radix Sheet by default, 
  // we might want to either adapt it or just force it open without the backdrop.
  // Actually, wait, CustomerWalletModal currently relies on `showWalletModal` from store.
  
  React.useEffect(() => {
    // Force open modal on mount in standalone app
    useAppStore.setState({ showWalletModal: true })
  }, [])

  return (
    <div className="w-full h-screen bg-[#0a0118] flex justify-center">
      {/* 
        We just render the modal component. It will attach to body.
        The layout background will show if the modal doesn't cover everything,
        but since the modal is full height, it should be fine.
      */}
      <CustomerWalletModal isStandalone={true} onCustomCredit={() => setCreditSheetOpen(true)} onCustomSavings={() => setSavingsSheetOpen(true)} />
      
      {/* Custom Product Sheets */}
      <CreditPurchaseSheet
        open={creditSheetOpen}
        onClose={() => setCreditSheetOpen(false)}
        product={null} // Null triggers custom product mode
        miniSiteId=""
      />

      <SavingsGoalSheet
        open={savingsSheetOpen}
        onClose={() => setSavingsSheetOpen(false)}
        product={null} // Null triggers custom product mode
      />
    </div>
  )
}
