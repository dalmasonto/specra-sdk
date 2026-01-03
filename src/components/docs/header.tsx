"use client"

import Link from "next/link"
import { Search, Menu, Github, Twitter, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VersionSwitcher } from "./version-switcher"
import { ThemeToggle } from "./theme-toggle"
import { SearchModal } from "./search-modal"
import { Logo } from "./logo"
import { useState, useEffect } from "react"
import type { SpecraConfig } from "@/lib/config"
import { useConfig } from "@/lib/config.context"

interface HeaderProps {
  currentVersion: string
  versions: string[]
  onMenuClick?: () => void
  config?: SpecraConfig // Made optional since we can get it from context
}

export function Header({ currentVersion, versions, onMenuClick, config: configProp }: HeaderProps) {
  // Use config from context if not provided as prop
  const contextConfig = useConfig()
  const config = configProp || contextConfig
  const [searchOpen, setSearchOpen] = useState(false)

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-2 md:px-6 mx-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden hover:bg-muted p-2 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            {!config.site.hideLogo && (
              config.site.logo ? (
                <Logo logo={config.site.logo} alt={config.site.title} className="w-18 object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    {config.site.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )
            )}
            {!config.site.hideTitle && (
              <span className="font-semibold text-lg text-foreground">{config.site.title ?? "Specra"}</span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {config.search?.enabled && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground bg-muted rounded-md transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{config.search.placeholder || "Search"}</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-xs font-medium">
                ⌘K
              </kbd>
            </button>
          )}

          {config.features?.versioning && (
            <VersionSwitcher currentVersion={currentVersion} versions={versions} />
          )}

          {/* Social Links */}
          {config.social?.github && (
            <a
              href={config.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
          {config.social?.twitter && (
            <a
              href={config.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          )}
          {config.social?.discord && (
            <a
              href={config.social.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
              aria-label="Discord"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} config={config} />
    </header>
  )
}
