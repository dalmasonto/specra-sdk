"use client"

import { Icon } from "./icon"
import type { TabGroup } from "@/lib/config.types"

interface TabGroupsProps {
  tabGroups: TabGroup[]
  activeTabId?: string
  onTabChange?: (tabId: string) => void
}

export function TabGroups({ tabGroups, activeTabId, onTabChange }: TabGroupsProps) {
  const activeTab = activeTabId || tabGroups[0]?.id || ""

  const handleTabChange = (tabId: string) => {
    onTabChange?.(tabId)
  }

  if (!tabGroups || tabGroups.length === 0) {
    return null
  }

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar" aria-label="Documentation tabs">
          {tabGroups.map((tab) => {
            const isActive = tab.id === activeTab

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.icon && <Icon icon={tab.icon} size={16} className="shrink-0" />}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
