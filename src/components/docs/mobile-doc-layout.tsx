"use client"

import { useState, ReactNode, cloneElement, isValidElement } from "react"
import Link from "next/link"
import { Footer } from "./footer"
import { SiteBanner } from "./site-banner"
import { TabGroups } from "./tab-groups"
import { Sidebar } from "./sidebar"
import { SidebarMenuItems } from "./sidebar-menu-items"
import { Logo } from "./logo"
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
          docs={docs}
          version={version}
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
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Site Title Header */}
          <div className="shrink-0 px-4 py-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2 group justify-center">
              {!config.site?.hideLogo && (
                <Logo
                  logo={config.site?.logo}
                  alt={config.site?.title || "Logo"}
                  className="w-18 object-contain"
                />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {config.site?.title || "Documentation"}
                </span>
                {config.site?.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {config.site.description}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Documentation Label */}
          <div className="shrink-0 px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Documentation</h2>
          </div>

          {/* Tab Groups Dropdown - Mobile Only */}
          {config.navigation?.tabGroups && config.navigation.tabGroups.length > 0 && (
            <div className="shrink-0 px-4 py-3 border-b border-border">
              <TabGroups
                tabGroups={config.navigation.tabGroups}
                activeTabId={activeTabGroup}
                onTabChange={handleTabChange}
                mobileOnly
                docs={docs}
                version={version}
              />
            </div>
          )}

          {/* Sidebar Menu Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <SidebarMenuItems
              docs={docs}
              version={version}
              config={config}
              onLinkClick={closeSidebar}
              activeTabGroup={activeTabGroup}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-2 md:px-6 py-8">
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
