"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  logo?: string | { light: string; dark: string }
  alt?: string
  className?: string
}

export function Logo({ logo, alt = "Logo", className = "h-8 w-8 object-contain" }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!logo) return null

  // If logo is a string, use it directly
  if (typeof logo === "string") {
    return <img src={logo} alt={alt} className={className} />
  }

  // If logo is an object with light/dark variants
  // Use light as fallback during SSR and before theme is determined
  if (!mounted) {
    return <img src={logo.light} alt={alt} className={className} />
  }

  const logoSrc = resolvedTheme === "dark" ? logo.dark : logo.light

  return <img src={logoSrc} alt={alt} className={className} />
}
