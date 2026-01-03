/**
 * Caching layer for MDX operations to improve development performance
 *
 * This module provides in-memory caching for expensive file system operations
 * that occur during static generation. In development mode, caches are
 * invalidated automatically when files change.
 */

// Note: This file uses server-only APIs (fs, path) and should only be imported in Server Components
import { Doc, getVersions, getAllDocs, getDocBySlug } from './mdx'
import { watch } from 'fs'
import { join } from 'path'
import { PerfTimer, logCacheOperation } from './dev-utils'

const isDevelopment = process.env.NODE_ENV === 'development'

// Cache stores
const versionsCache = {
  data: null as string[] | null,
  timestamp: 0,
}

const allDocsCache = new Map<string, {
  data: Doc[]
  timestamp: number
}>()

const docBySlugCache = new Map<string, {
  data: Doc | null
  timestamp: number
}>()

// Cache TTL (time to live) in milliseconds
const CACHE_TTL = isDevelopment ? 5000 : 60000 // 5s in dev, 60s in prod

// Track if we've set up file watchers
let watchersInitialized = false

/**
 * Initialize file watchers to invalidate cache on changes
 * Only runs in development mode
 */
function initializeWatchers() {
  if (!isDevelopment || watchersInitialized) return

  watchersInitialized = true
  const docsPath = join(process.cwd(), 'docs')

  try {
    watch(docsPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return

      // Invalidate relevant caches when MDX or JSON files change
      if (filename.endsWith('.mdx') || filename.endsWith('.json')) {
        // Extract version from path
        const parts = filename.split(/[/\\]/)
        const version = parts[0]

        // Clear all docs cache for this version
        allDocsCache.delete(version)

        // Clear individual doc caches for this version
        const cacheKeysToDelete: string[] = []
        docBySlugCache.forEach((_, key) => {
          if (key.startsWith(`${version}:`)) {
            cacheKeysToDelete.push(key)
          }
        })
        cacheKeysToDelete.forEach(key => docBySlugCache.delete(key))

        // Clear versions cache if directory structure changed
        if (eventType === 'rename') {
          versionsCache.data = null
        }

        console.log(`[MDX Cache] Invalidated cache for: ${filename}`)
      }
    })

    console.log('[MDX Cache] File watchers initialized')
  } catch (error) {
    console.error('[MDX Cache] Failed to initialize watchers:', error)
  }
}

/**
 * Check if a cache entry is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL
}

/**
 * Cached version of getVersions()
 */
export function getCachedVersions(): string[] {
  // Initialize watchers on first use
  initializeWatchers()

  if (versionsCache.data && isCacheValid(versionsCache.timestamp)) {
    logCacheOperation('hit', 'versions')
    return versionsCache.data
  }

  logCacheOperation('miss', 'versions')
  const timer = new PerfTimer('getVersions')
  const versions = getVersions()
  timer.end()

  versionsCache.data = versions
  versionsCache.timestamp = Date.now()

  return versions
}

/**
 * Cached version of getAllDocs()
 */
export async function getCachedAllDocs(version = 'v1.0.0'): Promise<Doc[]> {
  // Initialize watchers on first use
  initializeWatchers()

  const cached = allDocsCache.get(version)
  if (cached && isCacheValid(cached.timestamp)) {
    logCacheOperation('hit', `getAllDocs:${version}`)
    return cached.data
  }

  logCacheOperation('miss', `getAllDocs:${version}`)
  const timer = new PerfTimer(`getAllDocs(${version})`)
  const docs = await getAllDocs(version)
  timer.end()

  allDocsCache.set(version, {
    data: docs,
    timestamp: Date.now(),
  })

  return docs
}

/**
 * Cached version of getDocBySlug()
 */
export async function getCachedDocBySlug(
  slug: string,
  version = 'v1.0.0'
): Promise<Doc | null> {
  // Initialize watchers on first use
  initializeWatchers()

  const cacheKey = `${version}:${slug}`
  const cached = docBySlugCache.get(cacheKey)

  if (cached && isCacheValid(cached.timestamp)) {
    logCacheOperation('hit', `getDocBySlug:${cacheKey}`)
    return cached.data
  }

  logCacheOperation('miss', `getDocBySlug:${cacheKey}`)
  const timer = new PerfTimer(`getDocBySlug(${slug})`)
  const doc = await getDocBySlug(slug, version)
  timer.end()

  docBySlugCache.set(cacheKey, {
    data: doc,
    timestamp: Date.now(),
  })

  return doc
}

/**
 * Manually clear all caches
 * Useful for testing or when you want to force a refresh
 */
export function clearAllCaches() {
  versionsCache.data = null
  allDocsCache.clear()
  docBySlugCache.clear()
  console.log('[MDX Cache] All caches cleared')
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return {
    versions: {
      cached: versionsCache.data !== null,
      age: versionsCache.timestamp ? Date.now() - versionsCache.timestamp : 0,
    },
    allDocs: {
      entries: allDocsCache.size,
      versions: Array.from(allDocsCache.keys()),
    },
    docBySlug: {
      entries: docBySlugCache.size,
    },
  }
}
