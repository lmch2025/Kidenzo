/**
 * Client-side utilities for Web Push Notifications
 */

export async function subscribeToPushNotifications(userId: string) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported')
      return false
    }

    const registration = await navigator.serviceWorker.ready
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      // Still send to server to ensure it's linked to the correct user
      await sendSubscriptionToServer(existingSubscription, userId)
      return true
    }

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicVapidKey) {
      console.error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY')
      return false
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    })

    await sendSubscriptionToServer(subscription, userId)
    return true
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return false
  }
}

async function sendSubscriptionToServer(subscription: PushSubscription, userId: string) {
  const subJSON = subscription.toJSON()
  
  await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'subscribe',
      userId,
      endpoint: subJSON.endpoint,
      p256dh: subJSON.keys?.p256dh,
      auth: subJSON.keys?.auth
    })
  })
}

// Utility to convert Base64 URL safe to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
