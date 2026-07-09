'use client'

import { useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/lib/store'

// Lazy-load heavy components to reduce initial chunk size and prevent timeout errors
const AuthScreen = dynamic(() => import('@/components/AuthScreen'), { ssr: false })
const DashboardLayout = dynamic(() => import('@/components/DashboardLayout').then(m => ({ default: m.DashboardLayout })), { ssr: false })
const GamificationOverlay = dynamic(() => import('@/components/GamificationOverlay'), { ssr: false })
const MiniSiteView = dynamic(() => import('@/components/MiniSiteView'), { ssr: false })
const PublicProductsPage = dynamic(() => import('@/components/PublicProductsPage'), { ssr: false })

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  )
}

export default function Home() {
  const { isAuthenticated, user, token, currentView, miniSiteSlug, setDataLoaded, setPpcRate, refreshUserFromDB, preloadUserData } = useAppStore()

  // Load global PPC rate (no auth required)
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { if (typeof d.ppcRate === 'number') setPpcRate(d.ppcRate) })
      .catch(() => {}) // silent — fallback is 5 FCFA
  }, [setPpcRate])

  // Fetch user data when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user || !token) return

    const loadData = async () => {
      try {
        // Step 1: Ensure user role is fresh (in case of recent promotion)
        const freshUser = await refreshUserFromDB(token)
        const activeUser = freshUser || user

        // Step 2: Use the unified preload function to get all dashboard data
        await preloadUserData(activeUser, token)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    loadData()
  }, [isAuthenticated, user, token, refreshUserFromDB, preloadUserData])

  // If viewing a mini-site from the dashboard
  if (currentView === 'mini-site' && miniSiteSlug) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <MiniSiteView slug={miniSiteSlug} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <GamificationOverlay />
      {currentView === 'auth' ? (
        <AuthScreen />
      ) : currentView === 'mini-site' && miniSiteSlug ? (
        <MiniSiteView slug={miniSiteSlug} />
      ) : (
        <DashboardLayout />
      )}
    </Suspense>
  )
}
