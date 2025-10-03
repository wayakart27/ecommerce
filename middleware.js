import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
  adminRoutes,
  userRoutes,
  customerRoutes,
} from './routes';

// Cache for route matching results
const routeMatchCache = new Map();

function matchRoute(pathname, routes){
  const cacheKey = `${pathname}-${routes.join(',')}`;
  
  if (routeMatchCache.has(cacheKey)) {
    return routeMatchCache.get(cacheKey);
  }

  const result = routes.some(route => {
    // Exact match
    if (route === pathname) return true;

    // Wildcard match (ends with *)
    if (route.endsWith('*')) {
      const base = route.slice(0, -1);
      if (pathname.startsWith(base)) return true;
    }

    // Dynamic route match (contains [param])
    if (route.includes('[') && route.includes(']')) {
      const routeParts = route.split('/').filter(Boolean);
      const pathParts = pathname.split('/').filter(Boolean);
      
      if (routeParts.length !== pathParts.length) return false;
      
      return routeParts.every((part, i) => 
        part.startsWith('[') || part === pathParts[i]
      );
    }

    return false;
  });

  routeMatchCache.set(cacheKey, result);
  return result;
}

export default async function middleware(request) {
  const { nextUrl } = request;
  const { pathname, search } = nextUrl;
  const searchParams = new URLSearchParams(search);

   // Get token with secure cookie setting
  const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
  secureCookie: true,
});

  try {
    // Skip middleware for API auth routes and static files
  if (
  apiAuthPrefix.some(prefix => pathname.startsWith(prefix)) ||
  pathname.startsWith('/api/paystack/webhook') || // 👈 add this line
  pathname.startsWith('/_next/') ||
  pathname.includes('.') // Skip files with extensions
) {
  return NextResponse.next();
}

   

    const isLoggedIn = !!token;
    const userRole = token?.role 
    const isPublicRoute = matchRoute(pathname, publicRoutes);

    // Handle authentication routes (/auth/*)
    if (authRoutes.some(route => matchRoute(pathname, [route]))) {
      if (isLoggedIn) {
        const callbackUrl = searchParams.get('callbackUrl') || DEFAULT_LOGIN_REDIRECT;
        const safeRedirect = callbackUrl.startsWith('/') 
          ? new URL(callbackUrl, nextUrl.origin).toString()
          : new URL(DEFAULT_LOGIN_REDIRECT, nextUrl.origin).toString();
        
        return NextResponse.redirect(safeRedirect);
      }
      return NextResponse.next();
    }

    // Redirect unauthenticated users trying to access protected routes
    if (!isLoggedIn && !isPublicRoute) {
      const callbackUrl = pathname + (search ? `?${search}` : '');
      const loginUrl = new URL('/auth/login', nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', callbackUrl);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control for protected routes
    if (isLoggedIn && userRole) {
      const roleAccessMap = {
        Admin: [...publicRoutes, ...adminRoutes],
        User: [...publicRoutes, ...userRoutes],
        Customer: [...publicRoutes, ...customerRoutes],
      };

      const allProtectedRoutes = [...adminRoutes, ...userRoutes, ...customerRoutes];
      const isProtectedRoute = matchRoute(pathname, allProtectedRoutes);
      
      if (isProtectedRoute) {
        const allowedRoutes = roleAccessMap[userRole] || publicRoutes;
        const hasAccess = matchRoute(pathname, allowedRoutes);
        
        if (!hasAccess) {
          return NextResponse.redirect(new URL('/unauthorized', nextUrl.origin));
        }
      }
    }

    // Add security headers to all responses
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;

  } catch (error) {
    console.error('[MIDDLEWARE_ERROR]', error);
    const errorUrl = new URL('/auth/error', nextUrl.origin);
    errorUrl.searchParams.set('error', 'middleware_failure');
    return NextResponse.redirect(errorUrl);
  }
}

export const config = {
  matcher: [
    '/((?!api/paystack/webhook|api/auth|_next/static|_next/image|favicon.ico|sw.js|_next/webpack-hmr).*)',
  ],
};
