"use client"

import { useEffect, useState } from "react"
import type { SpecraConfig } from "@/lib/config"

interface TOCItem {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  items: TOCItem[]
  config: SpecraConfig
}

export function TableOfContents({ items, config }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("")

  // Check if TOC should be shown
  if (!config.navigation?.showTableOfContents) {
    return null
  }

  // Filter items by max depth
  const maxDepth = config.navigation?.tocMaxDepth || 3
  const filteredItems = items.filter(item => item.level <= maxDepth)

  // Check if tab groups are configured
  const hasTabGroups = config.navigation?.tabGroups && config.navigation.tabGroups.length > 0

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-80px 0px -80% 0px" },
    )

    filteredItems.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [filteredItems])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 100 // Offset for fixed header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      
      // Update URL without jumping
      window.history.replaceState(null, "", `#${id}`)
      
      // Manually set active ID after scroll
      setActiveId(id)
    }
  }

  // Adjust top position based on whether tabs are present
  const stickyTop = hasTabGroups ? "top-[7.5rem]" : "top-24"
  const maxHeight = hasTabGroups ? "max-h-[calc(100vh-10rem)]" : "max-h-[calc(100vh-7rem)]"

  return (
    <aside className={`w-64 hidden xl:block shrink-0 sticky ${stickyTop} self-start`}>
      {filteredItems.length > 0 && (
        <div className={`${maxHeight} overflow-y-auto bg-muted/30 dark:bg-muted/10 rounded-2xl p-4 border border-border/50`}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">On this page</h3>
          <nav className="space-y-1">
            {filteredItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`block text-sm transition-all cursor-pointer rounded-xl px-3 py-2 ${item.level === 3 ? "ml-3" : ""} ${
                  activeId === item.id
                    ? "text-primary font-medium"
                    : "text-foreground hover:bg-accent/50"
                }`}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      )}
    </aside>
  )
}
