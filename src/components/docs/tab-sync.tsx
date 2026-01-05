"use client"

import { useEffect, useRef } from "react"
import { useTabContext } from "./tab-context"
import type { SpecraConfig } from "@/lib/config"

interface TabSyncProps {
  currentPageTabGroup?: string
  config: SpecraConfig
}

/**
 * Client component that syncs tab state based on current page.
 * This is a zero-render component that only runs effects.
 */
export function TabSync({ currentPageTabGroup, config }: TabSyncProps) {
  const { activeTabGroup, setActiveTabGroup } = useTabContext()
  const hasInitialized = useRef(false)

  useEffect(() => {
    // If no tab groups configured, nothing to do
    if (!config.navigation?.tabGroups || config.navigation.tabGroups.length === 0) {
      return
    }

    // Initialize with currentPageTabGroup or first tab on first load
    if (!hasInitialized.current) {
      const initialTab = currentPageTabGroup || config.navigation.tabGroups[0]?.id
      if (initialTab && initialTab !== activeTabGroup) {
        setActiveTabGroup(initialTab)
      }
      hasInitialized.current = true
      return
    }

    // After initialization, only sync if the page's tab group doesn't match the active tab
    // AND the page actually has a tab group (this handles navigation to pages with different tab groups)
    if (currentPageTabGroup && currentPageTabGroup !== activeTabGroup) {
      setActiveTabGroup(currentPageTabGroup)
    }
  }, [currentPageTabGroup, setActiveTabGroup, activeTabGroup, config.navigation?.tabGroups])

  return null
}
