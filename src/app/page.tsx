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
  const { isAuthenticated, user, currentView, miniSiteSlug, setProducts, setOrders, setRecommenderProducts, setGamificationData, setLeaderboard, setRewards, setClickStats } = useAppStore()

  // Fetch user data when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchUserData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch(`/api/products?ownerId=${user.id}`)
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData.products || productsData || [])
        }

        // Fetch orders
        const ordersParam = user.role === 'owner' ? `ownerId=${user.id}` : `recommenderId=${user.id}`
        const ordersRes = await fetch(`/api/orders?${ordersParam}`)
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(ordersData.orders || ordersData || [])
        }

        // Fetch recommender products if recommender
        if (user.role === 'recommender') {
          const recRes = await fetch(`/api/recommender?userId=${user.id}`)
          if (recRes.ok) {
            const recData = await recRes.json()
            setRecommenderProducts(recData.products || recData.recommenderProducts || recData || [])
          }

          // Fetch click stats for recommenders
          const clickRes = await fetch(`/api/clicks?userId=${user.id}`)
          if (clickRes.ok) {
            const clickData = await clickRes.json()
            setClickStats(clickData)
          }
        }

        // Fetch gamification data
        const gamRes = await fetch(`/api/gamification?userId=${user.id}`)
        if (gamRes.ok) {
          const gamData = await gamRes.json()
          setGamificationData(gamData)
        }

        // Fetch leaderboard
        const lbRes = await fetch('/api/gamification?action=leaderboard')
        if (lbRes.ok) {
          const lbData = await lbRes.json()
          setLeaderboard(lbData.leaderboard || [])
        }

        // Fetch rewards
        const rwRes = await fetch('/api/gamification?action=rewards')
        if (rwRes.ok) {
          const rwData = await rwRes.json()
          setRewards(rwData.rewards || [])
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    fetchUserData()
  }, [isAuthenticated, user, setProducts, setOrders, setRecommenderProducts, setGamificationData, setLeaderboard, setRewards, setClickStats])

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
      {currentView === 'public' ? (
        <PublicProductsPage />
      ) : currentView === 'auth' ? (
        <AuthScreen />
      ) : currentView === 'dashboard' ? (
        <DashboardLayout />
      ) : isAuthenticated ? (
        <DashboardLayout />
      ) : (
        <PublicProductsPage />
      )}
    </Suspense>
  )
}
