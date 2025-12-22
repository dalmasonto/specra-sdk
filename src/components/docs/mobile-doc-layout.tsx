"use client"

import { useState, ReactNode, cloneElement, isValidElement } from "react"
import { Footer } from "./footer"
import { SiteBanner } from "./site-banner"
import { TabGroups } from "./tab-groups"
import { Sidebar } from "./sidebar"
import type { SpecraConfig } from "@/lib/config"
import type { Doc } from "@/lib/mdx"

interface MobileDocLayoutProps {
  header: ReactNode
  docs: Doc[]
  version: string
  content: ReactNode
  toc: ReactNode
  config: SpecraConfig
  activeTabGroup?: string
  onTabChange?: (tabId: string) => void
}

export function MobileDocLayout({ header, docs, version, content, toc, config, activeTabGroup, onTabChange }: MobileDocLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleTabChange = (tabId: string) => {
    onTabChange?.(tabId)
  }

  const closeSidebar = () => setSidebarOpen(false)
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  // Clone header and pass onMenuClick prop if it's a valid React element
  const headerWithProps = isValidElement(header)
    ? cloneElement(header as React.ReactElement<any>, {
      onMenuClick: toggleSidebar,
    })
    : header

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {headerWithProps}

      {/* Site-wide Banner */}
      <SiteBanner config={config} />

      {/* Tab Groups - shown only if configured */}
      {config.navigation?.tabGroups && config.navigation.tabGroups.length > 0 && (
        <TabGroups
          tabGroups={config.navigation.tabGroups}
          activeTabId={activeTabGroup}
          onTabChange={handleTabChange}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="pt-20 px-4">
          <Sidebar
            docs={docs}
            version={version}
            config={config}
            onLinkClick={closeSidebar}
            activeTabGroup={activeTabGroup}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar
              docs={docs}
              version={version}
              config={config}
              activeTabGroup={activeTabGroup}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2 px-2 md:px-8">
              {/* Content */}
              {content}

              {/* Footer */}
              <Footer config={config} />

            </div>
          </div>

          {/* ToC */}
          {toc}
        </div>


      </main>



    </div>
  )
}
