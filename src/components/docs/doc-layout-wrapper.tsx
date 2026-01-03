"use client"

import { ReactNode, useEffect, useRef } from "react"
import { MobileDocLayout } from "./mobile-doc-layout"
import { useTabContext } from "./tab-context"
import type { SpecraConfig } from "@/lib/config"
import type { Doc } from "@/lib/mdx"

interface DocLayoutWrapperProps {
  header: ReactNode
  docs: Doc[]
  version: string
  content: ReactNode
  toc: ReactNode
  config: SpecraConfig
  currentPageTabGroup?: string
}

export function DocLayoutWrapper({ header, docs, version, content, toc, config, currentPageTabGroup }: DocLayoutWrapperProps) {
  // Use global tab context instead of local state
  const { activeTabGroup, setActiveTabGroup } = useTabContext()
  const lastPageTabGroupRef = useRef<string | undefined>(undefined)
  const hasInitialized = useRef(false)

  // Set tab based on page's tab group
  useEffect(() => {
    // If no tab groups configured, nothing to do
    if (!config.navigation?.tabGroups || config.navigation.tabGroups.length === 0) {
      return
    }

    // If we have a currentPageTabGroup, always sync to it
    if (currentPageTabGroup) {
      // Only update if it's different from the last one we set
      if (lastPageTabGroupRef.current !== currentPageTabGroup) {
        setActiveTabGroup(currentPageTabGroup)
        lastPageTabGroupRef.current = currentPageTabGroup
        hasInitialized.current = true
      }
      return
    }

    // If no currentPageTabGroup but we haven't initialized yet, set to first tab
    if (!hasInitialized.current && !activeTabGroup) {
      const firstTab = config.navigation.tabGroups[0]?.id
      if (firstTab) {
        setActiveTabGroup(firstTab)
        lastPageTabGroupRef.current = firstTab
        hasInitialized.current = true
      }
    }
  }, [currentPageTabGroup, setActiveTabGroup, activeTabGroup, config.navigation?.tabGroups])

  return (
    <MobileDocLayout
      header={header}
      docs={docs}
      version={version}
      content={content}
      toc={toc}
      config={config}
      activeTabGroup={activeTabGroup}
      onTabChange={setActiveTabGroup}
    />
  )
}
