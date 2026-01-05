"use client"

import { ReactNode } from "react"
import { MobileDocLayout } from "./mobile-doc-layout"
import { useTabContext } from "./tab-context"
import type { SpecraConfig } from "@/lib/config"
import type { Doc } from "@/lib/mdx"

interface DocLayoutWrapperProps {
  header: ReactNode
  docs: Doc[]
  version: string
  children: ReactNode
  toc: ReactNode
  config: SpecraConfig
  currentPageTabGroup?: string
}

export function DocLayoutWrapper({ header, docs, version, children, toc, config }: DocLayoutWrapperProps) {
  // Use global tab context - TabSync component handles synchronization
  const { activeTabGroup, setActiveTabGroup } = useTabContext()

  return (
    <MobileDocLayout
      header={header}
      docs={docs}
      version={version}
      toc={toc}
      config={config}
      activeTabGroup={activeTabGroup}
      onTabChange={setActiveTabGroup}
    >
      {children}
    </MobileDocLayout>
  )
}
