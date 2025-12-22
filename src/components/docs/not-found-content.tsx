"use client"

import Link from "next/link"
import { AlertTriangle, Home, ArrowLeft } from "lucide-react"

interface NotFoundContentProps {
  version: string
}

export function NotFoundContent({ version }: NotFoundContentProps) {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-yellow-500/10 p-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
        </div>

        <h1 className="mb-3 text-5xl font-bold tracking-tight">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>

        <p className="mb-8 text-base text-muted-foreground">
          The documentation page you're looking for doesn't exist or may have been moved.
          <br />
          Try using the sidebar to find what you're looking for, or return to the documentation home.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/docs/${version}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Homepage
          </Link>
        </div>

        <div className="mt-12 rounded-lg border border-border bg-muted/30 p-6">
          <p className="text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">Tip:</strong> Use the sidebar navigation on the left to browse all available documentation pages.
          </p>
        </div>
      </div>
    </div>
  )
}
