/**
 * Security Middleware for Next.js
 *
 * Implements:
 * - Content Security Policy (CSP)
 * - Additional security headers
 * - Path traversal protection
 */

import { NextResponse, type NextRequest } from "next/server"
import { generateCSPHeader } from "../lib/mdx-security"

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  "X-Frame-Options": "SAMEORIGIN",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",

  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions Policy (formerly Feature Policy)
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  options?: {
    customCSP?: string
    production?: boolean
  }
): NextResponse {
  const { customCSP, production = process.env.NODE_ENV === "production" } = options || {}

  // Apply standard security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply CSP
  const csp = customCSP || generateCSPHeader(undefined, production)
  response.headers.set("Content-Security-Policy", csp)

  return response
}

/**
 * Validate request path for security issues
 */
export function validateRequestPath(pathname: string): {
  valid: boolean
  reason?: string
} {
  // Decode the pathname to catch encoded attacks
  const decoded = decodeURIComponent(pathname)

  // Check for path traversal
  if (decoded.includes("../") || decoded.includes("..\\")) {
    return { valid: false, reason: "Path traversal detected" }
  }

  // Check for encoded path traversal
  if (
    decoded.includes("%2e%2e") ||
    decoded.includes("%252e%252e") ||
    pathname.includes("%2e%2e") ||
    pathname.includes("%252e%252e")
  ) {
    return { valid: false, reason: "Encoded path traversal detected" }
  }

  // Check for null bytes
  if (decoded.includes("\0") || pathname.includes("%00")) {
    return { valid: false, reason: "Null byte injection detected" }
  }

  return { valid: true }
}

/**
 * Security proxy function (Next.js 16+)
 * Add this to your Next.js proxy.ts file
 */
export function createSecurityProxy(options?: {
  customCSP?: string
  production?: boolean
  strictPathValidation?: boolean
}) {
  return function securityProxy(request: NextRequest): NextResponse {
    const { strictPathValidation = true } = options || {}

    // Validate request path
    if (strictPathValidation) {
      const pathValidation = validateRequestPath(request.nextUrl.pathname)
      if (!pathValidation.valid) {
        const ip = request.headers.get("x-forwarded-for") ||
                   request.headers.get("x-real-ip") ||
                   "unknown"
        console.warn(`[Security] Blocked request: ${pathValidation.reason}`, {
          path: request.nextUrl.pathname,
          ip,
        })
        return new NextResponse("Bad Request", { status: 400 })
      }
    }

    // Continue with the request and apply security headers
    const response = NextResponse.next()
    return applySecurityHeaders(response, options)
  }
}

/**
 * @deprecated Use createSecurityProxy instead. Middleware is renamed to Proxy in Next.js 16+
 */
export const createSecurityMiddleware = createSecurityProxy

/**
 * Example proxy configuration for your project
 *
 * Create this file: proxy.ts (at root of your Next.js app)
 *
 * ```typescript
 * import { createSecurityProxy } from 'specra/middleware/security'
 *
 * export const proxy = createSecurityProxy({
 *   production: process.env.NODE_ENV === 'production',
 *   strictPathValidation: true,
 * })
 *
 * export const config = {
 *   matcher: [
 *     // Match all paths except static files
 *     '/((?!_next/static|_next/image|favicon.ico).*)',
 *   ],
 * }
 * ```
 */

/**
 * Validate subdomain/organization isolation
 * Use this if you're building a multi-tenant system
 */
export function validateSubdomainIsolation(
  request: NextRequest,
  options: {
    allowedSubdomains?: string[]
    currentOrg?: string
  }
): { valid: boolean; reason?: string } {
  const { allowedSubdomains, currentOrg } = options

  const hostname = request.headers.get("host") || ""
  const subdomain = hostname.split(".")[0]

  // If allowlist is provided, validate against it
  if (allowedSubdomains && !allowedSubdomains.includes(subdomain)) {
    return { valid: false, reason: "Subdomain not in allowlist" }
  }

  // Check for subdomain mismatch in paths
  // Example: docs.company-a.com should not access /_mintlify/static/company-b/
  const pathMatch = request.nextUrl.pathname.match(/\/(static|assets|_.*?)\/([^/]+)/)
  if (pathMatch && currentOrg) {
    const pathOrg = pathMatch[2]
    if (pathOrg !== currentOrg) {
      return { valid: false, reason: "Cross-organization access detected" }
    }
  }

  return { valid: true }
}
