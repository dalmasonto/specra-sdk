/**
 * Example Security Middleware for Next.js
 *
 * Copy this file to the root of your Next.js app as `middleware.ts`
 * to enable comprehensive security protections for your documentation site.
 *
 * This middleware protects against:
 * - XSS attacks via Content Security Policy
 * - Path traversal attacks
 * - Clickjacking via X-Frame-Options
 * - MIME sniffing attacks
 * - Cross-origin attacks
 */

import { NextResponse, type NextRequest } from "next/server"
import { createSecurityMiddleware } from "specra/middleware/security"

// Option 1: Use the built-in security middleware (Recommended)
export const middleware = createSecurityMiddleware({
  production: process.env.NODE_ENV === "production",
  strictPathValidation: true,
})

// Option 2: Custom middleware with your own logic
/*
export function middleware(request: NextRequest) {
  // Your custom logic here

  // Apply security headers
  const response = NextResponse.next()

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust as needed
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; ")
  )

  // Additional security headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return response
}
*/

// Option 3: Custom CSP with additional domains
/*
import { generateCSPHeader } from "specra/lib/mdx-security"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Custom CSP for analytics, CDN, etc.
  const csp = generateCSPHeader({
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://analytics.example.com",
    ],
    "connect-src": [
      "'self'",
      "https://api.example.com",
      "https://analytics.example.com",
    ],
    "img-src": [
      "'self'",
      "data:",
      "https:",
      "https://cdn.example.com",
    ],
  }, process.env.NODE_ENV === "production")

  response.headers.set("Content-Security-Policy", csp)

  // Add other security headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}
*/

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

// Additional configuration examples:

// 1. Protect specific routes only
/*
export const config = {
  matcher: [
    '/docs/:path*',
    '/api/:path*',
  ],
}
*/

// 2. Exclude specific routes
/*
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
*/

// 3. Multi-tenant subdomain isolation
/*
import { validateSubdomainIsolation } from "specra/middleware/security"

export function middleware(request: NextRequest) {
  // Extract organization from subdomain or path
  const hostname = request.headers.get("host") || ""
  const subdomain = hostname.split(".")[0]

  // Validate subdomain isolation
  const validation = validateSubdomainIsolation(request, {
    allowedSubdomains: ["docs", "api", "app"],
    currentOrg: subdomain,
  })

  if (!validation.valid) {
    console.warn(`[Security] ${validation.reason}`, {
      path: request.nextUrl.pathname,
      subdomain,
    })
    return new NextResponse("Forbidden", { status: 403 })
  }

  // Continue with security headers
  const response = NextResponse.next()
  // ... add headers
  return response
}
*/
