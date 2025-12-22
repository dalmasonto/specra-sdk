import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Get the correct asset path based on deployment configuration
 * Handles different deployment scenarios:
 * - Vercel/Node.js hosting (standalone build): No basePath needed
 * - GitHub Pages without custom domain: Uses basePath from config
 * - Static hosting with custom domain: No basePath needed
 *
 * @param path - The asset path (can start with or without '/')
 * @returns The properly formatted asset path
 */
export function getAssetPath(path: string): string {
  // Get basePath from Next.js config (set during build for static exports)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.__NEXT_ROUTER_BASEPATH || ''

  // Normalize the input path: ensure it starts with '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // If we have a basePath (GitHub Pages without custom domain), prepend it
  if (basePath) {
    // Normalize basePath: remove trailing slash, ensure leading slash
    const normalizedBase = basePath.startsWith('/') ? basePath : `/${basePath}`
    const cleanBase = normalizedBase.replace(/\/$/, '')
    return `${cleanBase}${normalizedPath}`
  }

  // Default: return the normalized path (works for Vercel, custom domains, and dev)
  return normalizedPath
}