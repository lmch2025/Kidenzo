import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: (self as any).__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ─── Push Notification Handler ──────────────────────────────────────
self.addEventListener('push', (event: any) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'Kidenzo Wallet'
    const options: any = {
      body: data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      tag: data.tag || 'wallet-reminder',
      renotify: true,
      data: {
        url: data.url || '/',
      },
      actions: [
        { action: 'open', title: '🔓 Ouvrir' },
        { action: 'dismiss', title: 'Plus tard' },
      ],
    }

    event.waitUntil(
      (self as any).registration.showNotification(title, options)
    )
  } catch (e) {
    console.error('Push event error:', e)
  }
})

// ─── Notification Click Handler ─────────────────────────────────────
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification?.data?.url || '/'

  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
      // Try to focus existing window
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(url)
      }
    })
  )
})