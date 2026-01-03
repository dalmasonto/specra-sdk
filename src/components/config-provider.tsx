"use client"

import * as React from "react"
import { SpecraConfig, defaultConfig } from "../lib/config.types"

const ConfigContext = React.createContext<SpecraConfig>(defaultConfig)

export interface ConfigProviderProps {
  config: SpecraConfig
  children: React.ReactNode
}

/**
 * Provider component that makes Specra config available to all client components
 * Usage: Wrap your app with this provider in your root layout
 */
export function ConfigProvider({ config, children }: ConfigProviderProps) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

/**
 * Hook to access Specra configuration in any client component
 * @returns The current Specra configuration
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useConfig()
 *   return <div>{config.site.title}</div>
 * }
 * ```
 */
export function useConfig(): SpecraConfig {
  const config = React.useContext(ConfigContext)
  if (!config) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return config
}

/**
 * Hook to access a specific configuration value by path
 * @param path - Dot-separated path to the config value (e.g., "site.title")
 * @returns The configuration value at the specified path
 * @example
 * ```tsx
 * function MyComponent() {
 *   const title = useConfigValue<string>("site.title")
 *   const showSidebar = useConfigValue<boolean>("navigation.showSidebar")
 *   return <div>{title}</div>
 * }
 * ```
 */
export function useConfigValue<T = any>(path: string): T | undefined {
  const config = useConfig()
  const keys = path.split(".")
  let value: any = config

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key]
    } else {
      return undefined
    }
  }

  return value as T
}
