"use client"

import { useState } from "react"
import { Languages, Check, ChevronDown } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useConfig } from "../config-provider"

export function LanguageSwitcher() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const config = useConfig()

    const i18n = config.features?.i18n
    if (!i18n || typeof i18n === 'boolean') return null

    const { locales, localeNames, defaultLocale, prefixDefault } = i18n

    // Extract current locale from pathname
    // /docs/[version]/[locale]/...
    const pathParts = pathname.split("/")
    const version = pathParts[2]
    let currentLocale = defaultLocale

    if (pathParts[3] && locales.includes(pathParts[3])) {
        currentLocale = pathParts[3]
    }

    const handleLocaleChange = (newLocale: string) => {
        if (newLocale === currentLocale) {
            setOpen(false)
            return
        }

        const parts = [...pathParts]

        // Check if current path has a locale prefix
        const hasLocalePrefix = locales.includes(parts[3])

        if (newLocale === defaultLocale && !prefixDefault) {
            // Transitioning to default locale which has no prefix
            if (hasLocalePrefix) {
                parts.splice(3, 1)
            }
        } else {
            // Transitioning to a localized path
            if (hasLocalePrefix) {
                parts[3] = newLocale
            } else {
                parts.splice(3, 0, newLocale)
            }
        }

        const newPath = parts.join("/")
        router.push(newPath)
        setOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2 h-9 rounded-md hover:bg-muted transition-colors"
                aria-label="Switch language"
            >
                <Languages className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">{currentLocale}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-md shadow-lg z-50">
                        <div className="p-2">
                            {locales.map((locale) => (
                                <button
                                    key={locale}
                                    onClick={() => handleLocaleChange(locale)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    <span>{localeNames?.[locale] || locale.toUpperCase()}</span>
                                    {currentLocale === locale && <Check className="h-4 w-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
