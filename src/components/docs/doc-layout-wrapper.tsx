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
  const isInitialMount = useRef(true)

  // Set tab based on page's tab group
  useEffect(() => {
    // On initial mount, always set to current page's tab group
    if (isInitialMount.current && currentPageTabGroup) {
      setActiveTabGroup(currentPageTabGroup)
      lastPageTabGroupRef.current = currentPageTabGroup
      isInitialMount.current = false
      return
    }

    // On subsequent renders, only update if navigating to a different page
    if (currentPageTabGroup && lastPageTabGroupRef.current !== currentPageTabGroup) {
      setActiveTabGroup(currentPageTabGroup)
      lastPageTabGroupRef.current = currentPageTabGroup
    }
  }, [currentPageTabGroup, setActiveTabGroup])

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
