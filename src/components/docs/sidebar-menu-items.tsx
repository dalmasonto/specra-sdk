"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, ChevronDown, FolderOpen } from "lucide-react"
import { useState } from "react"
import type { SpecraConfig } from "@/lib/config"
import { Icon } from "./icon"
import { sortSidebarItems, sortSidebarGroups } from "@/lib/sidebar-utils"

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

interface SidebarMenuItemsProps {
  docs: DocItem[]
  version: string
  onLinkClick?: () => void
  config: SpecraConfig
  activeTabGroup?: string
}

interface SidebarGroup {
  label: string
  path: string
  icon?: string
  items: DocItem[]
  position: number
  collapsible: boolean
  defaultCollapsed: boolean
  children: Record<string, SidebarGroup>
}

export function SidebarMenuItems({ docs, version, onLinkClick, config, activeTabGroup }: SidebarMenuItemsProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    return initial
  })

  // Filter docs by active tab group if tab groups are configured
  const hasTabGroups = config.navigation?.tabGroups && config.navigation.tabGroups.length > 0
  const filteredDocs = hasTabGroups && activeTabGroup
    ? docs.filter((doc) => {
        const docTabGroup = doc.meta?.tab_group || doc.categoryTabGroup

        if (!docTabGroup) {
          return activeTabGroup === config.navigation?.tabGroups?.[0]?.id
        }

        return docTabGroup === activeTabGroup
      })
    : docs

  // Build a hierarchical tree structure
  const rootGroups: Record<string, SidebarGroup> = {}
  const standalone: DocItem[] = []

  filteredDocs.forEach((doc) => {
    const pathParts = doc.filePath.split("/")
    const isIndexFile = doc.filePath.endsWith("/index") ||
      doc.filePath === "index" ||
      (pathParts.length > 1 && doc.slug === pathParts.slice(0, -1).join("/"))

    const customGroup = doc.sidebar || doc.group

    if (customGroup) {
      const groupName = customGroup.charAt(0).toUpperCase() + customGroup.slice(1)
      if (!rootGroups[groupName]) {
        rootGroups[groupName] = {
          label: groupName,
          path: customGroup,
          items: [],
          position: 999,
          collapsible: doc.categoryCollapsible ?? true,
          defaultCollapsed: doc.categoryCollapsed ?? false,
          children: {}
        }
      }
      if (isIndexFile) {
        rootGroups[groupName].position = doc.sidebar_position ?? 999
        rootGroups[groupName].icon = doc.categoryIcon
      } else {
        rootGroups[groupName].items.push(doc)
      }
      return
    }

    if (pathParts.length > 1) {
      const folderParts = pathParts.slice(0, -1)

      let currentLevel = rootGroups
      let currentPath = ""

      for (let i = 0; i < folderParts.length; i++) {
        const folder = folderParts[i]
        currentPath = currentPath ? `${currentPath}/${folder}` : folder
        const folderLabel = folder.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

        if (!currentLevel[folder]) {
          currentLevel[folder] = {
            label: doc.categoryLabel && i === folderParts.length - 1 ? doc.categoryLabel : folderLabel,
            path: currentPath,
            icon: doc.categoryIcon,
            items: [],
            position: doc.categoryPosition ?? 999,
            collapsible: doc.categoryCollapsible ?? true,
            defaultCollapsed: doc.categoryCollapsed ?? false,
            children: {}
          }
        }

        if (i === folderParts.length - 1) {
          if (isIndexFile) {
            currentLevel[folder].position = doc.categoryPosition ?? doc.sidebar_position ?? 999
            if (doc.categoryLabel) {
              currentLevel[folder].label = doc.categoryLabel
            }
            if (doc.categoryIcon) {
              currentLevel[folder].icon = doc.categoryIcon
            }
          } else {
            currentLevel[folder].items.push(doc)
          }
        }

        currentLevel = currentLevel[folder].children
      }
    } else {
      if (!isIndexFile) {
        standalone.push(doc)
      }
    }
  })

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const renderGroup = (groupKey: string, group: SidebarGroup, depth: number = 0) => {
    const sortedItems = sortSidebarItems(group.items)
    const sortedChildren = sortSidebarGroups(group.children)
    const hasChildren = sortedChildren.length > 0
    const hasItems = sortedItems.length > 0
    const hasContent = hasChildren || hasItems

    const isActiveInGroup = (g: SidebarGroup): boolean => {
      const hasActiveItem = g.items.some((doc) => pathname === `/docs/${version}/${doc.slug}`)
      if (hasActiveItem) return true
      return Object.values(g.children).some(child => isActiveInGroup(child))
    }

    const hasActiveItem = isActiveInGroup(group)
    const isGroupActive = pathname === `/docs/${version}/${group.path}`
    const isCollapsed = hasActiveItem || isGroupActive ? false : (collapsed[groupKey] ?? group.defaultCollapsed)
    const marginLeft = depth > 0 ? "ml-4" : ""
    const groupHref = `/docs/${version}/${group.path}`

    return (
      <div key={`group-${groupKey}`} className={`space-y-1 ${marginLeft}`}>
        <div className="flex items-center group">
          <Link
            href={groupHref}
            onClick={onLinkClick}
            className={`flex items-center gap-2 flex-1 px-3 py-2 text-sm font-semibold rounded-l-xl transition-all ${isGroupActive
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-accent/50"
              }`}
          >
            {group.icon ? (
              <Icon icon={group.icon} size={16} className="shrink-0" />
            ) : (
              <FolderOpen size={16} className="shrink-0" />
            )}
            {group.label}
          </Link>

          {hasContent && group.collapsible && config.navigation?.collapsibleSidebar && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleSection(groupKey)
              }}
              className={`p-2 rounded-r-xl transition-all ${isGroupActive ? "hover:bg-primary/20" : "hover:bg-accent/50"}`}
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            >
              {isCollapsed ? (
                <ChevronRight className={`h-4 w-4 ${isGroupActive ? "text-primary" : "text-muted-foreground"}`} />
              ) : (
                <ChevronDown className={`h-4 w-4 ${isGroupActive ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </button>
          )}
        </div>

        {!isCollapsed && hasContent && (
          <div className="ml-4 space-y-1">
            {(() => {
              const merged: Array<{type: 'group', key: string, group: SidebarGroup, position: number} | {type: 'item', doc: DocItem, position: number}> = [
                ...sortedChildren.map(([childKey, childGroup]) => ({
                  type: 'group' as const,
                  key: childKey,
                  group: childGroup,
                  position: childGroup.position
                })),
                ...sortedItems.map((doc) => ({
                  type: 'item' as const,
                  doc,
                  position: doc.sidebar_position ?? doc.meta?.sidebar_position ?? doc.meta?.order ?? 999
                }))
              ]

              merged.sort((a, b) => a.position - b.position)

              return merged.map((item) => {
                if (item.type === 'group') {
                  return renderGroup(`${groupKey}/${item.key}`, item.group, depth + 1)
                } else {
                  const href = `/docs/${version}/${item.doc.slug}`
                  const isActive = pathname === href

                  return (
                    <Link
                      key={`grouped-${item.doc.slug}`}
                      href={href}
                      onClick={onLinkClick}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all ${isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                    >
                      {item.doc.meta?.icon && <Icon icon={item.doc.meta.icon} size={16} className="shrink-0" />}
                      {item.doc.title}
                    </Link>
                  )
                }
              })
            })()}
          </div>
        )}
      </div>
    )
  }

  const sortedRootGroups = sortSidebarGroups(rootGroups)
  const sortedStandalone = sortSidebarItems(standalone)

  return (
    <nav className="space-y-1">
      {sortedStandalone.length > 0 && sortedStandalone.map((doc) => {
        const href = `/docs/${version}/${doc.slug}`
        const isActive = pathname === href

        return (
          <Link
            key={`standalone-${doc.slug}`}
            href={href}
            onClick={onLinkClick}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all ${isActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground hover:text-foreground hover:bg-accent/50"
              }`}
          >
            {doc.meta?.icon && <Icon icon={doc.meta.icon} size={16} className="shrink-0" />}
            {doc.title}
          </Link>
        )
      })}

      {sortedRootGroups.map(([groupKey, group]) => renderGroup(groupKey, group, 0))}
    </nav>
  )
}
