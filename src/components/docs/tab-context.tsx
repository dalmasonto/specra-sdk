"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface TabContextType {
  activeTabGroup: string
  setActiveTabGroup: (tabId: string) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function TabProvider({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
  const [activeTabGroup, setActiveTabGroup] = useState(defaultTab)

  return (
    <TabContext.Provider value={{ activeTabGroup, setActiveTabGroup }}>
      {children}
    </TabContext.Provider>
  )
}

export function useTabContext() {
  const context = useContext(TabContext)
  if (!context) {
    throw new Error("useTabContext must be used within TabProvider")
  }
  return context
}
