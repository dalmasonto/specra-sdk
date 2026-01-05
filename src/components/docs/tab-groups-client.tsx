"use client"

import { TabGroups } from "./tab-groups"
import { useTabContext } from "./tab-context"
import type { TabGroup } from "@/lib/config.types"

interface TabGroupsClientProps {
  tabGroups: TabGroup[]
  activeTabId?: string
  docs?: Array<{ slug: string; meta?: { tab_group?: string }; categoryTabGroup?: string }>
  version?: string
}

/**
 * Client wrapper for TabGroups to isolate client-side behavior
 * from the server component tree
 */
export function TabGroupsClient({ tabGroups, activeTabId, docs, version }: TabGroupsClientProps) {
  const { setActiveTabGroup } = useTabContext()

  return (
    <TabGroups
      tabGroups={tabGroups}
      activeTabId={activeTabId}
      onTabChange={setActiveTabGroup}
      docs={docs}
      version={version}
    />
  )
}
