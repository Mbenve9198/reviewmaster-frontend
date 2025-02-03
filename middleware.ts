import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isRegisterPage = request.nextUrl.pathname === '/signup'
  const isVerifyEmailPage = request.nextUrl.pathname === '/verify-email'
  const isResetPasswordPage = request.nextUrl.pathname.startsWith('/reset-password')
  const isPublicPage = isLoginPage || isRegisterPage || isVerifyEmailPage || isResetPasswordPage
  const isHomePage = request.nextUrl.pathname === '/'

  // Se l'utente non è autenticato e sta cercando di accedere a una pagina protetta
  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se l'utente è autenticato e sta cercando di accedere a login/register
  if (token && isPublicPage && !isVerifyEmailPage && !isResetPasswordPage) {
    return NextResponse.redirect(new URL('/reviews', request.url))
  }

  // Reindirizza sempre la home page a /reviews quando l'utente è autenticato
  if (isHomePage && token) {
    return NextResponse.redirect(new URL('/reviews', request.url))
  }

  return NextResponse.next()
}

// Configura su quali path deve essere eseguito il middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/reset-password'
  ],
} 