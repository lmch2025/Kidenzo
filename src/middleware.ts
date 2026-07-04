import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Exclude static files, API routes, Next.js internals
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle wallet subdomain
  const isWalletDomain = hostname.startsWith('wallet.')

  if (isWalletDomain) {
    // Prevent routing loop if already rewritten
    if (!url.pathname.startsWith('/wallet-app')) {
      // Rewrite the URL to /wallet-app/[path]
      return NextResponse.rewrite(new URL(`/wallet-app${url.pathname === '/' ? '' : url.pathname}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
