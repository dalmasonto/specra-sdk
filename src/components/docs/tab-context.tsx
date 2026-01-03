"use client"

// import { createContext, useContext, useState, ReactNode } from "react"
import * as React from "react"

interface TabContextType {
  activeTabGroup: string
  setActiveTabGroup: (tabId: string) => void
}

const TabContext = React.createContext<TabContextType | undefined>(undefined)

const TAB_STORAGE_KEY = "specra-active-tab-group"

export function TabProvider({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  // Initialize from localStorage if available, otherwise use defaultTab
  const [activeTabGroup, setActiveTabGroupState] = React.useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(TAB_STORAGE_KEY)
        return stored || defaultTab
      } catch {
        return defaultTab
      }
    }
    return defaultTab
  })

  // Wrapper to persist to localStorage when tab changes
  const setActiveTabGroup = (tabId: string) => {
    setActiveTabGroupState(tabId)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(TAB_STORAGE_KEY, tabId)
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  return (
    <TabContext.Provider value={{ activeTabGroup, setActiveTabGroup }}>
      {children}
    </TabContext.Provider>
  )
}

export function useTabContext() {
  const context = React.useContext(TabContext)
  if (!context) {
    throw new Error("useTabContext must be used within TabProvider")
  }
  return context
}
