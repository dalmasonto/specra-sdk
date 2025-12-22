/**
 * Development utilities for debugging and performance monitoring
 * Only active in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Performance timer for measuring operation duration
 */
export class PerfTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = isDevelopment ? performance.now() : 0
  }

  end() {
    if (!isDevelopment) return

    const duration = performance.now() - this.startTime
    const color = duration > 1000 ? '\x1b[31m' : duration > 500 ? '\x1b[33m' : '\x1b[32m'
    const reset = '\x1b[0m'

    console.log(`${color}⏱️  ${this.label}: ${duration.toFixed(2)}ms${reset}`)
  }
}

/**
 * Log file system operations
 */
export function logFsOperation(operation: string, path: string, details?: any) {
  if (!isDevelopment) return

  console.log(`📁 [FS] ${operation}: ${path}`, details || '')
}

/**
 * Log cache operations
 */
export function logCacheOperation(operation: 'hit' | 'miss' | 'invalidate', key: string) {
  if (!isDevelopment) return

  const emoji = operation === 'hit' ? '✅' : operation === 'miss' ? '❌' : '🔄'
  console.log(`${emoji} [Cache] ${operation}: ${key}`)
}

/**
 * Memory usage reporter
 */
export function logMemoryUsage(label?: string) {
  if (!isDevelopment) return

  const used = process.memoryUsage()
  const prefix = label ? `[${label}] ` : ''

  console.log(`💾 ${prefix}Memory Usage:`, {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
  })
}

/**
 * Pretty print object for debugging
 */
export function debugLog(label: string, data: any) {
  if (!isDevelopment) return

  console.log(`\n🔍 ${label}:`)
  console.dir(data, { depth: null, colors: true })
  console.log('')
}
