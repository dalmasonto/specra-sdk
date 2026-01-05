"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { Icon } from "./icon"
import type { TabGroup } from "@/lib/config.types"

interface TabGroupsProps {
  tabGroups: TabGroup[]
  activeTabId?: string
  onTabChange?: (tabId: string) => void
  mobileOnly?: boolean
  docs?: Array<{ slug: string; meta?: { tab_group?: string }; categoryTabGroup?: string }>
  version?: string
}

export function TabGroups({ tabGroups, activeTabId, onTabChange, mobileOnly = false, docs, version }: TabGroupsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  // Filter out tabs that have no associated docs
  const filteredTabGroups = docs
    ? tabGroups.filter((tab) => {
        const hasDocsInTab = docs.some((doc) => {
          const docTabGroup = doc.meta?.tab_group || doc.categoryTabGroup
          return docTabGroup === tab.id || (!docTabGroup && tab.id === tabGroups[0]?.id)
        })
        return hasDocsInTab
      })
    : tabGroups

  const activeTab = activeTabId || filteredTabGroups[0]?.id || ""
  const activeTabData = filteredTabGroups.find(tab => tab.id === activeTab)

  const handleTabChange = (tabId: string) => {
    onTabChange?.(tabId)
    setDropdownOpen(false)

    // Navigate to the first item in the new tab group if docs are provided
    if (docs && version) {
      const firstDocInTab = docs.find((doc) => {
        const docTabGroup = doc.meta?.tab_group || doc.categoryTabGroup
        return docTabGroup === tabId || (!docTabGroup && tabId === filteredTabGroups[0]?.id)
      })

      if (firstDocInTab) {
        router.push(`/docs/${version}/${firstDocInTab.slug}`)
      }
    }
  }

  if (!filteredTabGroups || filteredTabGroups.length === 0) {
    return null
  }

  // Mobile only version (for sidebar)
  if (mobileOnly) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          aria-label="Select tab group"
          aria-expanded={dropdownOpen}
        >
          <div className="flex items-center gap-2">
            {activeTabData?.icon && <Icon icon={activeTabData.icon} size={16} className="shrink-0" />}
            <span>{activeTabData?.label}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto">
              {filteredTabGroups.map((tab) => {
                const isActive = tab.id === activeTab

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {tab.icon && <Icon icon={tab.icon} size={16} className="shrink-0" />}
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2 md:px-6">
        {/* Mobile Dropdown */}
        <div className="md:hidden relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground"
            aria-label="Select tab"
            aria-expanded={dropdownOpen}
          >
            <div className="flex items-center gap-2">
              {activeTabData?.icon && <Icon icon={activeTabData.icon} size={16} className="shrink-0" />}
              {activeTabData?.label}
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 bg-background border border-border shadow-lg z-50 max-h-[60vh] overflow-y-auto">
                {filteredTabGroups.map((tab) => {
                  const isActive = tab.id === activeTab

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-left transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {tab.icon && <Icon icon={tab.icon} size={16} className="shrink-0" />}
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex gap-1" aria-label="Documentation tabs">
          {filteredTabGroups.map((tab) => {
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
