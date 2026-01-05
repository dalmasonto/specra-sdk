"use client"

import type { SpecraConfig } from "@/lib/config"
import { SidebarMenuItems } from "./sidebar-menu-items"

interface DocItem {
  title: string
  slug: string
  filePath: string
  section?: string
  group?: string
  sidebar?: string
  sidebar_position?: number
  categoryLabel?: string
  categoryPosition?: number
  categoryCollapsible?: boolean
  categoryCollapsed?: boolean
  categoryIcon?: string
  categoryTabGroup?: string
  meta?: {
    icon?: string
    tab_group?: string
    [key: string]: any
  }
}

interface SidebarProps {
  docs: DocItem[]
  version: string
  onLinkClick?: () => void
  config: SpecraConfig
  activeTabGroup?: string
}

export function Sidebar({ docs, version, onLinkClick, config, activeTabGroup }: SidebarProps) {
  if (!config.navigation?.showSidebar) {
    return null
  }

  const hasTabGroups = config.navigation?.tabGroups && config.navigation.tabGroups.length > 0
  const stickyTop = hasTabGroups ? "top-[7.5rem]" : "top-24"
  const maxHeight = hasTabGroups ? "max-h-[calc(100vh-10rem)]" : "max-h-[calc(100vh-7rem)]"

  return (
    <aside className={`w-64 shrink-0 sticky ${stickyTop} self-start`}>
      <div className={`${maxHeight} overflow-y-auto bg-muted/30 dark:bg-muted/10 rounded-2xl p-4 border border-border/50`}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Documentation</h2>
        <SidebarMenuItems
          docs={docs}
          version={version}
          onLinkClick={onLinkClick}
          config={config}
          activeTabGroup={activeTabGroup}
        />
      </div>
    </aside>
  )
}
