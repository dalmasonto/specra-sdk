"use client"

import { type ReactNode, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiEndpointProps {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  summary?: string
  children?: ReactNode
  defaultOpen?: boolean
}

const methodColors = {
  GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  POST: "bg-green-500/10 text-green-600 dark:text-green-400",
  PUT: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  PATCH: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
}

export function ApiEndpoint({ method, path, summary, children, defaultOpen = false }: ApiEndpointProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="not-prose mb-4 rounded-xl border border-border overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded",
            methodColors[method]
          )}
        >
          {method}
        </span>
        <code className="text-sm font-mono">{path}</code>
        {summary && <span className="text-sm text-muted-foreground ml-auto mr-2">{summary}</span>}
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform flex-shrink-0",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Accordion Content */}
      {isOpen && children && (
        <div className="border-t border-border bg-background">
          <div className="px-4 py-4 space-y-6">{children}</div>
        </div>
      )}
    </div>
  )
}
