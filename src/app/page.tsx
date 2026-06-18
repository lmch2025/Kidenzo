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
  const { isAuthenticated, user, currentView, miniSiteSlug, setProducts, setOrders, setRecommenderProducts, setGamificationData, setLeaderboard, setRewards, setClickStats, setDataLoaded } = useAppStore()

  // Fetch user data when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const fetchUserData = async () => {
      try {
        const ordersParam = user.role === 'recommender' ? `recommenderId=${user.id}` : `ownerId=${user.id}`
        
        // Define all promises
        const promises: Promise<void>[] = []
        
        // Product fetch (owners)
        promises.push(
          fetch(`/api/products?ownerId=${user.id}`).then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setProducts(data.products || data || [])
            }
          }).catch(err => console.error('Products fetch error:', err))
        )

        // Orders fetch (all users)
        promises.push(
          fetch(`/api/orders?${ordersParam}`).then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setOrders(data.orders || data || [])
            }
          }).catch(err => console.error('Orders fetch error:', err))
        )

        // Recommender specific fetches
        if (user.role === 'recommender') {
          promises.push(
            fetch(`/api/recommender?userId=${user.id}`).then(async (res) => {
              if (res.ok) {
                const data = await res.json()
                setRecommenderProducts(data.products || data.recommenderProducts || data || [])
              }
            }).catch(err => console.error('Recommender products fetch error:', err))
          )
          
          promises.push(
            fetch(`/api/clicks?userId=${user.id}`).then(async (res) => {
              if (res.ok) {
                const data = await res.json()
                setClickStats(data)
              }
            }).catch(err => console.error('Clicks fetch error:', err))
          )
        }

        // Gamification fetches
        promises.push(
          fetch(`/api/gamification?userId=${user.id}`).then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setGamificationData(data)
            }
          }).catch(err => console.error('Gamification fetch error:', err))
        )

        promises.push(
          fetch('/api/gamification?action=leaderboard').then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setLeaderboard(data.leaderboard || [])
            }
          }).catch(err => console.error('Leaderboard fetch error:', err))
        )

        promises.push(
          fetch('/api/gamification?action=rewards').then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              setRewards(data.rewards || [])
            }
          }).catch(err => console.error('Rewards fetch error:', err))
        )

        // Execute all promises in parallel
        await Promise.all(promises)
        setDataLoaded(true)
        
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    fetchUserData()
  }, [isAuthenticated, user, setProducts, setOrders, setRecommenderProducts, setGamificationData, setLeaderboard, setRewards, setClickStats, setDataLoaded])

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
