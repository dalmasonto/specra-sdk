import { watch, type FSWatcher } from 'fs'
import { join } from 'path'

// Mark route as incompatible with static export (since it's dev-only SSE endpoint)
export const dynamic = 'error'
export const runtime = 'nodejs'

// Store active watchers globally to clean up on process exit
const activeWatchers = new Set<FSWatcher>()

// Clean up all watchers on process termination
if (process.env.NODE_ENV === 'development') {
  const cleanup = () => {
    if (activeWatchers.size > 0) {
      console.log('[MDX Watch] Cleaning up watchers...')
      activeWatchers.forEach((watcher) => {
        try {
          watcher.close()
        } catch (error) {
          // Ignore errors during cleanup
        }
      })
      activeWatchers.clear()
      console.log('[MDX Watch] Cleanup complete')
    }
  }

  // Use regular event listeners instead of 'once' to ensure cleanup happens
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('beforeExit', cleanup)
}

/**
 * API route for watching MDX file changes in development
 * Provides Server-Sent Events (SSE) stream for hot reloading
 * Only available in development mode
 */
export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not available in production', { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(encoder.encode(connectMsg))

      const docsPath = join(process.cwd(), 'docs')

      // Watch the docs directory recursively
      const watcher = watch(
        docsPath,
        { recursive: true },
        (eventType, filename) => {
          if (!filename) return

          // Only watch for .mdx and .json files (MDX files and category configs)
          if (filename.endsWith('.mdx') || filename.endsWith('.json')) {
            console.log(`[MDX Watch] ${eventType}: ${filename}`)

            const message = `data: ${JSON.stringify({
              type: 'change',
              file: filename,
              eventType
            })}\n\n`

            try {
              controller.enqueue(encoder.encode(message))
            } catch (error) {
              console.error('[MDX Watch] Error sending message:', error)
            }
          }
        }
      )

      // Add to active watchers for cleanup on process exit
      activeWatchers.add(watcher)

      // Handle cleanup
      const cleanupWatcher = () => {
        console.log('[MDX Watch] Closing watcher')
        activeWatchers.delete(watcher)
        watcher.close()
        try {
          controller.close()
        } catch (error) {
          // Controller might already be closed
        }
      }

      // Handle errors
      watcher.on('error', (error) => {
        console.error('[MDX Watch] Watcher error:', error)
        cleanupWatcher()
      })
    },
    cancel() {
      // Called when the client disconnects - cleanup happens in start()
      console.log('[MDX Watch] Stream cancelled')
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
