"use client"

import React, { useState, Children, isValidElement } from "react"

interface TabProps {
  label: string
  children: React.ReactNode
}

interface TabsProps {
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[]
  defaultValue?: string
}

export function Tab({ children }: TabProps) {
  return <>{children}</>
}

export function Tabs({ children, defaultValue }: TabsProps) {
  const tabs = Children.toArray(children).filter(isValidElement) as React.ReactElement<TabProps>[]

  // Use defaultValue or first tab label as initial active tab
  const firstTabLabel = tabs[0]?.props.label || ""
  const [activeTab, setActiveTab] = useState(defaultValue || firstTabLabel)

  return (
    <div className="my-6">
      {/* Tab buttons */}
      <div className="flex items-center gap-1 border-b border-border mb-4">
        {tabs.map((tab) => {
          const label = tab.props.label
          const isActive = activeTab === label

          return (
            <button
              key={label}
              onClick={() => setActiveTab(label)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tabs.map((tab) => {
        const label = tab.props.label
        if (activeTab !== label) return null

        return (
          <div key={label} className="prose prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0">
            {tab.props.children}
          </div>
        )
      })}
    </div>
  )
}
