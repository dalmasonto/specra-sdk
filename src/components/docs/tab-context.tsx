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
  // Always initialize with defaultTab to avoid hydration mismatch
  const [activeTabGroup, setActiveTabGroupState] = React.useState(defaultTab)
  const isInitialMount = React.useRef(true)

  // Sync with localStorage after hydration
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false

      // Only read from localStorage on initial mount
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(TAB_STORAGE_KEY)
          if (stored && stored !== defaultTab) {
            setActiveTabGroupState(stored)
          }
        } catch {
          // Ignore localStorage errors
        }
      }
    }
  }, [defaultTab])

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
